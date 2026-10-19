#!/usr/bin/env python3
"""Envio del resumen semanal de precios por correo (data/digest/weekly.json).
SIN CLAVES NO ENVIA NADA: por defecto es un ensayo (dry-run) que escribe el correo en un fichero y lo enseña.
Envio real solo con --send Y la variable de entorno DIGEST_API_KEY (la clave de tu proveedor). Proveedor soportado: buttondown
(https://buttondown.com, gestiona altas, bajas y consentimiento; el formulario de la web apunta a su dirección de alta).
Cada correo lleva solo los movimientos que NO se habian enviado antes (data/digest/sent.json guarda los ids): un dato mensual no se repite semana tras semana.
Uso: python3 scripts/send-digest.py [--lang es|en] [--out fichero.html] [--send]"""
import argparse, html, json, os, sys, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from unit_labels import unit_label
ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'data' / 'digest'
BASE = 'https://dehesaindex.com'
TX = {'es': {'subj': 'Dehesa Index: precios que se han movido ({d})', 'h': 'Precios que se han movido', 'up': 'Suben más', 'dn': 'Bajan más', 'none': 'Sin movimientos por encima del umbral.', 'from': 'antes', 'src': 'Fuente',
             'rep': 'Informe de negociación', 'foot': 'Datos de fuentes oficiales, sin estimar. Las fechas son el periodo que mide la fuente, no el día de publicación. Información, no asesoramiento financiero. Todos los datos y sus licencias: ' + BASE + '/datos-descargables.html'},
      'en': {'subj': 'Dehesa Index: prices that moved ({d})', 'h': 'Prices that moved', 'up': 'Biggest rises', 'dn': 'Biggest falls', 'none': 'No moves above the threshold.', 'from': 'before', 'src': 'Source',
             'rep': 'Negotiation report', 'foot': 'Data from official sources, nothing estimated. Dates are the period the source measures, not the publication day. Information, not financial advice. All data and licences: ' + BASE + '/datos-descargables.html'}}
def fmt(v, l):
    s = ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) < 1000 else '%d' % round(v)
    return s.replace('.', ',') if l == 'es' else s
def label(e, l):
    n = e['name'].get(l) or e['name']['es']; p = e['place'].get(l) or e['place'].get('es') or ''
    return n + (' (' + p + ')' if p and p != n else '')
def build(w, l):
    t = TX[l]; e = html.escape
    def block(title, items):
        if not items: return ''
        rows = ''.join('<li style="margin:8px 0"><b>%s</b>: %s%s %% → %s %s/%s <span style="color:#666">(%s; %s %s, %s)</span><br><span style="font-size:12px;color:#666">%s · <a href="%s%s">%s</a></span></li>' % (
            e(label(i, l)), '+' if i['changePct'] > 0 else '', fmt(i['changePct'], l), fmt(i['value'], l), e(i['currency']), e(unit_label(i['unit'], l)), e(i['date']), t['from'], fmt(i['previous'], l), e(i['previousDate']),
            e(i['attribution']), BASE, e(i['report']), t['rep']) for i in items)
        return '<h3 style="margin:18px 0 4px">%s</h3><ul style="padding-left:18px;margin:0">%s</ul>' % (e(title), rows)
    body = block(t['up'], w['topUp']) + block(t['dn'], w['topDown'])
    if not body: body = '<p>%s</p>' % e(t['none'])
    h = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1c1c1c"><h2 style="margin:0 0 6px">%s</h2>%s<p style="font-size:12px;color:#666;margin-top:22px">%s</p></div>' % (e(t['h']), body, e(t['foot']))
    return t['subj'].format(d=w['generatedAt'][:10]), h
def pick(events, done):
    """Un movimiento por serie (el mas reciente aun no enviado); 5 mayores subidas y 5 mayores bajadas."""
    seen, L = set(), []
    for e in events:   # ya vienen del mas reciente al mas antiguo
        if e['series'] in seen: continue
        seen.add(e['series'])          # solo cuenta el ULTIMO movimiento de cada serie: si ya se envio, la serie no vuelve hasta que haya otro nuevo
        if e['id'] in done: continue
        L.append(e)
    return sorted([e for e in L if e['changePct'] > 0], key=lambda e: -e['changePct'])[:5], sorted([e for e in L if e['changePct'] < 0], key=lambda e: e['changePct'])[:5]
def api(method, path, key, body=None):
    """Llamada a la API de Buttondown; devuelve (estado, json)."""
    req = urllib.request.Request('https://api.buttondown.email/v1' + path, data=json.dumps(body).encode('utf-8') if body is not None else None,
                                 headers={'Authorization': 'Token ' + key, 'Content-Type': 'application/json'}, method=method)
    with urllib.request.urlopen(req, timeout=60) as r: return r.status, json.loads(r.read().decode('utf-8') or 'null')
def audience(key, lang):
    """Filtro de Buttondown con la etiqueta del idioma (el formulario etiqueta a cada suscriptor con es/en). Sin etiqueta = nadie recibe: None."""
    path = '/tags'
    while path:
        _, d = api('GET', path, key)
        for t in d.get('results', []):
            if t.get('name') == lang: return {'filters': [{'field': 'subscriber.tags', 'operator': 'contains', 'value': t['id']}], 'groups': [], 'predicate': 'and'}
        nxt = d.get('next'); path = nxt.split('/v1', 1)[1] if nxt and '/v1' in nxt else None
    return None
def deliver(key, lang, subj, html_body):
    """Envia solo a los suscriptores de ese idioma. None si no hay etiqueta (no se envia nada)."""
    flt = audience(key, lang)
    if flt is None: return None
    st, _ = api('POST', '/emails', key, {'subject': subj, 'body': html_body, 'status': 'about_to_send', 'filters': flt})
    return st
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--lang', default='es', choices=['es', 'en']); ap.add_argument('--out', default=''); ap.add_argument('--send', action='store_true'); a = ap.parse_args()
    ev = json.loads((D / 'events.json').read_text(encoding='utf-8'))
    sentp = D / 'sent.json'; sent = json.loads(sentp.read_text(encoding='utf-8')) if sentp.exists() else {'sent': [], 'events': []}
    ek = 'events' if a.lang == 'es' else 'events-' + a.lang   # cada idioma recuerda lo que ya envio
    up, dn = pick(ev['events'], set(sent.get(ek, [])))
    w = {'generatedAt': ev['generatedAt'], 'topUp': up, 'topDown': dn}; subj, h = build(w, a.lang)
    sid = '%s-%s' % (w['generatedAt'][:10], a.lang)
    if a.out: Path(a.out).write_text(h, encoding='utf-8')
    if not a.send:
        print('ENSAYO (no se envia nada). Asunto: %s | %d subidas, %d bajadas%s' % (subj, len(w['topUp']), len(w['topDown']), ' | escrito en ' + a.out if a.out else '')); return
    key = os.environ.get('DIGEST_API_KEY', '')
    if not key: sys.exit('Falta DIGEST_API_KEY: no se envia nada.')
    if sid in sent['sent']: print('Ya enviado (%s): no se repite.' % sid); return
    if not up and not dn: print('Nada nuevo que enviar.'); return
    r = deliver(key, a.lang, subj, h)
    if r is None: print('Nadie esta apuntado con la etiqueta "%s": no se envia.' % a.lang); return
    print('Enviado (%s): HTTP %s' % (sid, r))
    sent['sent'].append(sid); sent.setdefault(ek, []).extend(e['id'] for e in up + dn); sentp.write_text(json.dumps(sent, indent=1) + '\n', encoding='utf-8')
if __name__ == "__main__": main()

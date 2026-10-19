#!/usr/bin/env python3
"""Avisos de precio (eventos) y resumen semanal -> data/digest/
Sale SOLO de la API publica (data/api/v1, que ya excluye fuentes sin licencia comercial). Nada se estima.
  events.json   movimientos recientes (ventana segun frecuencia: 62 dias diaria y semanal, 100 mensual, 200 trimestral) que superan el umbral de su frecuencia (cada punto frente al anterior)
  weekly.json   resumen: los 5 mayores subidas y los 5 mayores bajadas, uno por serie (el ultimo movimiento relevante)
  feed.xml / feed-en.xml   Atom con los ultimos 40 eventos (se puede seguir sin dar el correo)
La fecha es la del paquete de datos, no la hora de ejecucion: sin datos nuevos no cambia nada.
El «date» de un evento es el periodo observado por la fuente, no el dia en que se publico.
Uso: python3 scripts/build-digest.py [--check]"""
import json, sys, datetime
from pathlib import Path
from xml.sax.saxutils import escape
ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'data' / 'api' / 'v1'
OUT = ROOT / 'data' / 'digest'
BASE = 'https://dehesaindex.com'
WINDOW = {'daily': 62, 'weekly': 62, 'monthly': 100, 'quarterly': 200}   # dias de observacion: los datos mensuales y trimestrales llegan con retraso
THRESH = {'daily': 3.0, 'weekly': 3.0, 'monthly': 5.0, 'quarterly': 8.0}
def jdump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n'
def pt(d):
    y, rest = d[:4], d[5:]
    if rest.startswith('Q'): return datetime.date(int(y), (int(rest[1]) - 1) * 3 + 2, 15)
    p = d.split('-')
    return datetime.date(int(p[0]), int(p[1]), int(p[2]) if len(p) > 2 else 15)
def label(s, l):
    n = (s['name'].get(l) or s['name']['es']); p = (s['place'].get(l) or s['place'].get('es') or '')
    return n + (' (' + p + ')' if p and p != n else '')
def fmt(v, l):
    s = ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) < 1000 else '%d' % round(v)
    return s.replace('.', ',') if l == 'es' else s
def build():
    idx = json.loads((API / 'index.json').read_text(encoding='utf-8'))
    gen = idx['generatedAt']; today = datetime.date.fromisoformat(gen[:10])
    events = []
    for m in idx['series']:
        s = json.loads((API / 'series' / (m['id'] + '.json')).read_text(encoding='utf-8')); P = s['points']; th = THRESH.get(s['frequency'], 5.0); lo = today - datetime.timedelta(days=WINDOW.get(s['frequency'], 62))
        for i in range(1, len(P)):
            d, v = P[i]; pv = P[i - 1][1]
            if pt(d) < lo or not pv: continue
            c = round((v / pv - 1) * 100, 2)
            if abs(c) < th: continue
            events.append({'id': '%s@%s' % (s['id'], d), 'series': s['id'], 'product': s['product'], 'region': s['region'], 'name': s['name'], 'place': s['place'], 'date': d, 'value': v, 'previousDate': P[i - 1][0], 'previous': pv,
                           'changePct': c, 'direction': 'up' if c > 0 else 'down', 'unit': s['unit'], 'currency': s['currency'], 'frequency': s['frequency'], 'sourceName': s['sourceName'], 'attribution': s['attribution'],
                           'report': '/informe-negociacion.html?p=' + s['product']})
    events.sort(key=lambda e: (e['date'], e['id']), reverse=True)
    latest = {}
    for e in events:
        if e['series'] not in latest: latest[e['series']] = e
    L = list(latest.values())
    ups = sorted([e for e in L if e['direction'] == 'up'], key=lambda e: -e['changePct'])[:5]
    dns = sorted([e for e in L if e['direction'] == 'down'], key=lambda e: e['changePct'])[:5]
    pick = lambda e: {k: e[k] for k in ('id', 'series', 'product', 'region', 'name', 'place', 'date', 'value', 'previousDate', 'previous', 'changePct', 'unit', 'currency', 'sourceName', 'attribution', 'report')}
    ev = {'schemaVersion': 1, 'generatedAt': gen, 'windowDays': WINDOW, 'thresholdsPct': THRESH, 'events': events}
    wk = {'schemaVersion': 1, 'generatedAt': gen, 'windowDays': WINDOW, 'thresholdsPct': THRESH, 'summary': {'seriesWithMoves': len(L), 'events': len(events), 'up': len([e for e in L if e['direction'] == 'up']), 'down': len([e for e in L if e['direction'] == 'down'])},
          'topUp': [pick(e) for e in ups], 'topDown': [pick(e) for e in dns]}
    files = {'events.json': jdump(ev), 'weekly.json': jdump(wk)}
    for l, fn, ttl in (('es', 'feed.xml', 'Dehesa Index: movimientos de precios'), ('en', 'feed-en.xml', 'Dehesa Index: price moves')):
        ent = []
        for e in events[:40]:
            t = '%s: %s%s %% hasta %s %s/%s (%s)' % (label(e, l), '+' if e['changePct'] > 0 else '', fmt(e['changePct'], l), fmt(e['value'], l), e['currency'], e['unit'], e['date']) if l == 'es' else \
                '%s: %s%s%% to %s %s/%s (%s)' % (label(e, l), '+' if e['changePct'] > 0 else '', fmt(e['changePct'], l), fmt(e['value'], l), e['currency'], e['unit'], e['date'])
            body = ('Antes: %s (%s). Fuente: %s. %s' if l == 'es' else 'Before: %s (%s). Source: %s. %s') % (fmt(e['previous'], l), e['previousDate'], e['sourceName'], e['attribution'])
            upd = pt(e['date']).isoformat() + 'T00:00:00Z'
            ent.append('<entry><id>tag:dehesaindex.com,2026:%s</id><title>%s</title><updated>%s</updated><link href="%s%s"/><summary>%s</summary></entry>' % (escape(e['id']), escape(t), upd, BASE, escape(e['report']), escape(body)))
        files[fn] = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="%s"><id>tag:dehesaindex.com,2026:digest-%s</id><title>%s</title><updated>%sT00:00:00Z</updated><link rel="self" href="%s/data/digest/%s"/><link href="%s/avisos.html"/>%s</feed>\n' % (l, l, ttl, gen[:10], BASE, fn, BASE, ''.join(ent))
    return files
def main():
    files = build()
    if '--check' in sys.argv:
        bad = [k for k, v in files.items() if not (OUT / k).exists() or (OUT / k).read_text(encoding='utf-8') != v]
        if bad: print('AVISOS DESFASADOS (%s): ejecuta scripts/build-digest.py' % ', '.join(bad)); sys.exit(1)
        print('Avisos al dia: %d ficheros' % len(files)); return
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in files.items():
        p = OUT / k
        if not p.exists() or p.read_text(encoding='utf-8') != v: p.write_text(v, encoding='utf-8')
    w = json.loads(files['weekly.json'])
    print('Avisos: %d eventos, %d series con movimiento (%d suben, %d bajan)' % (len(json.loads(files['events.json'])['events']), w['summary']['seriesWithMoves'], w['summary']['up'], w['summary']['down']))
if __name__ == "__main__": main()

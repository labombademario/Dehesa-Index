#!/usr/bin/env python3
"""Francia, patata de consumo en expedicion (FranceAgriMer, RNM) -> series fr-rnm-potato-* dentro de data/france-rnm-stats.json (13-oct-2026).
Serie representativa: mercado «France : pomme de terre» (cours Expedition), «POMME DE TERRE div.var.cons France lavée cat.I 50-75mm filet 10kg
consommation», en EUR HT por tonelada. Es la patata de consumo corriente lavada y en malla de 10 kg, la mas cotizada del mercado nacional.
  - fr-rnm-potato-consumption-monthly: media mensual de la pagina «12 meses» (rnm.franceagrimer.fr/prix?POMME-DE-TERRE&12MOIS); se conserva lo ya guardado y se amplia.
  - fr-rnm-potato-consumption-weekly: la cotizacion de la ultima fecha publicada (pagina diaria); un punto por cotizacion, acumulado desde la primera ejecucion.
Licencia: Licence Ouverte 2.0 de FranceAgriMer (reutilizacion, incluso comercial, citando la fuente y sin alterar los datos). Los demas series del fichero no se tocan.
Uso: python3 scripts/update-france-rnm-potato.py"""
import datetime, html, json, re, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'data' / 'france-rnm-stats.json'
U = 'https://rnm.franceagrimer.fr/prix?POMME-DE-TERRE'
MARKET = 'France : pomme de terre'
PRODUCT = 'POMME DE TERRE div.var.cons France lavée cat.I 50-75mm filet 10kg consommation'
MON = {'janv': 1, 'févr': 2, 'fevr': 2, 'mars': 3, 'avri': 4, 'avril': 4, 'mai': 5, 'juin': 6, 'juil': 7, 'août': 8, 'aout': 8, 'sept': 9, 'septe': 9, 'octo': 10, 'nove': 11, 'déce': 12, 'dece': 12}
SRC = 'FranceAgriMer – RNM (Réseau des Nouvelles des Marchés)'
def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}), timeout=90).read().decode('utf-8', 'replace')
def post_day(dt):
    """Pagina de una fecha cualquiera (formulario «autre date»: POST ESPECE=112, DATE=dd-mm-aa)."""
    body = ('ESPECE=112&DATE=' + dt.strftime('%d-%m-%y')).encode()
    return urllib.request.urlopen(urllib.request.Request('https://rnm.franceagrimer.fr/prix', data=body, headers={'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}), timeout=90).read().decode('utf-8', 'replace')
def rows(b):
    b = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', b, flags=re.S)
    for r in re.findall(r'<tr[^>]*>(.*?)</tr>', b, flags=re.S):
        yield [html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', c))).replace('\xa0', ' ').strip() for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r, flags=re.S)]
def num(s):
    try: return float(s.replace(',', '.').replace(' ', ''))
    except ValueError: return None
def daily(b):
    """(fecha ISO, EUR/t) de la fila de la patata de consumo en el mercado nacional de expedicion."""
    date = None
    for c in rows(b):
        t = ' '.join(c)
        if c and c[0].startswith(MARKET) and 'cours Expédition' in t and 'export' not in c[0] and 'industrie' not in c[0] and 'bio' not in c[0]:
            m = re.search(r'du (\d\d)/(\d\d)/(\d\d)\b', t); date = '20%s-%s-%s' % (m.group(3), m.group(2), m.group(1)) if m else None
            if 'tonne' not in t: date = None   # la unidad tiene que ser la tonelada
        elif date and c and c[0] == PRODUCT:
            v = num(c[1]) if len(c) > 1 else None
            return (date, v) if v else None
        elif date and c and c[0].startswith(('France :', 'Marché', 'Bassin')): date = None
    return None
def monthly(b):
    hdr = None; inblock = False; out = []
    for c in rows(b):
        if c and c[0] == 'libellé': hdr = c
        t = c[0] if c else ''
        if t.startswith('France :') or t.startswith('Marché') or t.startswith('Bassin'): inblock = t.startswith(MARKET + ' (cours Expédition'); continue
        if inblock and hdr and t == PRODUCT + ' (la tonne)':
            for h, v in zip(hdr[1:13], c[1:13]):
                m = re.match(r'(\w+)\.? (\d{4})$', h); x = num(v)
                if m and x and m.group(1).lower() in MON: out.append(('%s-%02d' % (m.group(2), MON[m.group(1).lower()]), x))
    return out
def merge(old, new):
    d = {p[0]: p[1] for p in (old or [])}
    for k, v in new: d[k] = round(v, 2)
    return [[k, d[k]] for k in sorted(d)]
def mk(sid, label, freq, pts, prev):
    s = {'id': sid, 'group': 'prices_lv', 'label': label, 'unit': '€/t', 'frequency': freq, 'latestPeriod': pts[-1][0], 'latest': pts[-1][1],
         'changePct': round((pts[-1][1] - pts[-2][1]) / pts[-2][1] * 100, 2) if len(pts) > 1 and pts[-2][1] else None, 'points': pts, 'sourceGroup': SRC}
    return s
def main(day_html=None, m12_html=None):
    d = json.loads(FILE.read_text(encoding='utf-8')); fr = d['countries']['FR']
    old = {s['id']: s for s in fr['series']}
    dv = daily(day_html or fetch(U)); mv = monthly(m12_html or fetch(U + '&12MOIS'))
    assert dv or mv, 'sin datos de patata: el RNM ha cambiado de formato'
    out = []
    if mv:
        pts = merge(old.get('fr-rnm-potato-consumption-monthly', {}).get('points'), mv); assert all(80 < p[1] < 2000 for p in pts)
        out.append(mk('fr-rnm-potato-consumption-monthly', 'Consumer potatoes, France, washed class I 50-75 mm, 10 kg net bag, shipping point (monthly average)', 'monthly', pts, None))
    if dv:
        prev = old.get('fr-rnm-potato-consumption-weekly', {}).get('points') or []
        extra = []
        if day_html is None and len(prev) < 20:   # primera ejecucion: recupera las ultimas ~26 semanas pidiendo fechas anteriores (si una falla se salta)
            today = datetime.date.today()
            for k in range(1, 27):
                try:
                    x = daily(post_day(today - datetime.timedelta(days=7 * k)))
                    if x: extra.append(x)
                except Exception as e: print('fecha atras', k, str(e)[:80])
        pts = merge(prev, extra + [dv]); assert 80 < dv[1] < 2000
        if len(pts) > 1: out.append(mk('fr-rnm-potato-consumption-weekly', 'Consumer potatoes, France, washed class I 50-75 mm, 10 kg net bag, shipping point (latest quotation)', 'weekly', pts, None))
    ids = {s['id'] for s in out}
    fr['series'] = [s for s in fr['series'] if s['id'] not in ids] + out
    d['generatedAt'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    FILE.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    LOG = [' '.join(str(x) for x in (s['id'], s['latestPeriod'], s['latest'], len(s['points']))) for s in out]
    print('\n'.join(LOG))
    (ROOT / 'data' / 'france-rnm-potato-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__':
    if len(sys.argv) == 3: main(Path(sys.argv[1]).read_text(encoding='utf-8'), Path(sys.argv[2]).read_text(encoding='utf-8'))   # prueba con HTML guardado
    else: main()

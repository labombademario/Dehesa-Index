#!/usr/bin/env python3
"""EE. UU. en el catalogo de series: totales NACIONALES de USDA NASS que ya descargan nass-crops/nass-livestock/nass-prices.
No hace llamadas de red: solo reordena a la forma de los demas *-stats.json (id, grupo, etiqueta, unidad, frecuencia, puntos), para que
la grafica "Explorar los datos" de la ficha de EE. UU. tenga mas que el tipo de la Reserva Federal.
No transforma las cifras (mismos valores y periodos que NASS); solo se descartan series de un solo punto y los porcentajes de semillas biotecnologicas.
Grupos: crops (area, produccion, rendimiento), livestock (existencias de animales), stocks (camaras frigorificas), prices_paid (indices de precios pagados)."""
import datetime, json, re, statistics, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-stats.json'
SRC = {'name': 'USDA NASS - Quick Stats (national totals)', 'url': 'https://quickstats.nass.usda.gov/', 'license': 'US Government work (public domain); cite USDA NASS'}
UNIT = {'ACRES': 'acres', 'BU': 'bushels', 'BU / ACRE': 'bu/acre', 'LB': 'lb', 'LB / ACRE': 'lb/acre', 'TONS': 'short tons', 'TONS / ACRE': 'short tons/acre', 'CWT': 'cwt',
        '480 LB BALES': '480-lb bales', '$': 'USD', 'HEAD': 'head', 'PIGS / LITTER': 'pigs/litter', 'INDEX': 'index (2011=100)', '$ / HEAD': 'USD/head'}
def nice(s):
    s = s.strip().lower()
    s = re.sub(r'\bexcl\b', 'excluding', s); s = re.sub(r'\bincl\b', 'including', s); s = re.sub(r'\bge (\d+) lbs\b', r'\1 lb and over', s)
    s = re.sub(r'\bpitw\b', 'PITW', s); s = re.sub(r'\bppitw\b', 'PPITW', s)
    return s[:1].upper() + s[1:]
def metric(m, cold=True):
    m = m.strip()
    for pat, name in [(r'^ACRES HARVESTED', 'area harvested'), (r'^ACRES PLANTED', 'area planted'), (r'^PRODUCTION, MEASURED IN \$', 'production value'), (r'^PRODUCTION', 'production'),
                      (r'^YIELD', 'yield'), (r'^INVENTORY, MEASURED IN \$ / HEAD', None), (r'^INVENTORY, MEASURED IN \$', None), (r'^INVENTORY', 'inventory'), (r'^OPERATIONS', None),
                      (r'^STOCKS', 'cold storage stocks'), (r'^LITTER RATE', 'litter rate'), (r'^PIG CROP', 'pig crop'), (r'^INDEX FOR PRICE PAID', 'prices paid index')]:
        if re.match(pat, m): return ('stocks' if name == 'cold storage stocks' and not cold else name)
    return None
def freq_of(pts):
    if all(re.fullmatch(r'\d{4}', p[0]) for p in pts): return 'annual'
    ms = [int(p[0][:4]) * 12 + int(p[0][5:7]) for p in pts if re.fullmatch(r'\d{4}-\d{2}', p[0])]
    if len(ms) != len(pts) or len(ms) < 3: return None
    g = statistics.median([b - a for a, b in zip(ms, ms[1:])])
    return {1: 'monthly', 3: 'quarterly', 6: 'semiannual', 12: 'annual'}.get(g)
def build(fn, group_of, log):
    d = json.loads((ROOT / 'data' / fn).read_text(encoding='utf-8')); out = []
    for key, v in d['series'].items():
        if ' - ' not in key: continue
        name, rest = key.split(' - ', 1)
        if 'BIOTECH' in name or 'PCT BY TYPE' in rest: continue
        mt = metric(rest, 'COLD STORAGE' in key)
        if not mt: continue
        pts = [[p, x] for p, x in v.get('n', []) if x is not None]
        if len(pts) < 5: continue
        fq = freq_of(pts)
        if not fq: log.append('descartada %s: periodicidad irregular' % key); continue
        u = UNIT.get(v.get('u'))
        if not u: log.append('descartada %s: unidad %r sin traduccion' % (key, v.get('u'))); continue
        mo = None
        if fq == 'annual' and not all(re.fullmatch(r'\d{4}', p[0]) for p in pts):  # existencias a una fecha fija del anio: periodo = anio, el mes va en la etiqueta
            mm = {p[0][5:7] for p in pts}
            if len(mm) != 1: log.append('descartada %s: meses distintos en serie anual' % key); continue
            mo = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][int(mm.pop())]
            pts = [[p[0][:4], p[1]] for p in pts]
        mx = max(abs(p[1]) for p in pts)  # cifras enormes (miles de millones de bushels) -> "millones"/"miles"; division exacta, sin redondeo de los datos
        if u not in ('index (2011=100)', 'bu/acre', 'lb/acre', 'short tons/acre', 'pigs/litter', 'USD/head'):
            if mx >= 1e8: pts = [[p[0], round(p[1] / 1e6, 6)] for p in pts]; u = 'million ' + u
            elif mx >= 1e5: pts = [[p[0], round(p[1] / 1e3, 6)] for p in pts]; u = 'thousand ' + u
        prev = pts[-2][1] if len(pts) > 1 else None
        chg = round((pts[-1][1] / prev - 1) * 100, 2) if prev else None
        label = '%s: %s' % (nice(re.sub(r', INDEX FOR PRICE PAID.*', '', name)), mt) + (' (%s)' % mo if mo else '')
        sid = 'us-nass-' + re.sub(r'[^a-z0-9]+', '-', ('%s %s %s' % (name, mt, u)).lower()).strip('-')
        out.append({'id': sid, 'group': group_of(key), 'label': label, 'unit': u, 'frequency': fq, 'latestPeriod': pts[-1][0], 'latest': pts[-1][1], 'changePct': chg, 'points': pts, 'sourceGroup': group_of(key)})
    return out
def main():
    log = []; series = []
    series += build('nass-crops.json', lambda k: 'stocks' if ' - STOCKS' in k else 'crops', log)
    series += build('nass-livestock.json', lambda k: 'stocks' if ('COLD STORAGE' in k or ' - STOCKS' in k) else 'livestock', log)
    series += build('nass-prices.json', lambda k: 'prices_paid', log)
    ids = [s['id'] for s in series]
    if len(ids) != len(set(ids)): raise SystemExit('ids duplicados: %s' % sorted({i for i in ids if ids.count(i) > 1})[:5])
    series.sort(key=lambda s: (s['group'], s['label']))
    gen = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:  # sin cambios en las series no se reescribe la fecha (evita commits vacios)
        old = json.loads(OUT.read_text(encoding='utf-8'))
        if old['countries']['US']['series'] == series: gen = old['generatedAt']
    except Exception: pass
    obj = {'schemaVersion': 1, 'generatedAt': gen, 'countries': {'US': {'name': 'US', 'source': SRC, 'extend': False, 'series': series}},
           'log': ['%s: %d series (%s)' % (datetime.datetime.now(datetime.timezone.utc).strftime('%H:%M:%S'), len(series), ', '.join('%s %d' % (g, sum(1 for s in series if s['group'] == g)) for g in sorted({s['group'] for s in series})))] + log[:40]}
    OUT.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    (ROOT / "data/us-stats-log.txt").write_text("\n".join(obj["log"]) + "\n", encoding="utf-8"); print(obj["log"][0])
if __name__ == '__main__': main()

#!/usr/bin/env python3
"""Suecia (SCB, Statistics Sweden) -> data/sweden-scb-stats.json (countries.SE, extend)
Fuente: base PxWeb de SCB, API publica: https://api.scb.se/OV0104/v1/doris/en/ssd/
Tablas: PR0101A/KPI2020COICOPM (IPC por grupo COICOP, indice 2020=100, mensual), PR0301G/PPI2020M (indice de precios de productor, 2020=100, mensual) y MI1002/ForsHandelsgodsel
(ventas de abonos minerales, anual por campana de abonado julio-junio, solo total nacional).
Licencia: SCB publica sus datos como CC0 (configuracion de la API y pagina open data de SCB); se cita a SCB igualmente. Limites: 10 consultas/10 s y 100.000 valores por tabla.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones. Series sin datos suficientes se omiten.
Uso: python3 scripts/update-se-scb.py"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_pxweb import UA, make_say, make_call, num, clean, slug, var, month
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'sweden-scb-stats.json'; LOG = ROOT / 'data' / 'sweden-scb-log.txt'
BASE = 'https://api.scb.se/OV0104/v1/doris/en/ssd/'
SG = 'SCB'
log = []
say = make_say(log)
def url(path): return BASE + path
call = make_call(pause=1.2, tries=4, backoff=6)   # SCB admite 10 consultas por 10 s
def codes(v, wanted, what):
    miss = [w for w in wanted if w not in v['values']]
    if miss: say('%s: codigos que no existen en la fuente (se omiten): %s' % (what, miss))
    return [w for w in wanted if w in v['values']]

OUTS = {}
def put(sid, group, label, unit, freq, pts, note, ref):
    d = {p: v for p, v in pts if p and v is not None}
    pp = sorted(d.items())
    if len(pp) < 12 and freq == 'monthly' or len(pp) < 5: say('omitida (pocos puntos):', sid, len(pp)); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    OUTS[sid] = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
                 'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'periodNote': note,
                 'reference': {'source': 'Statistics Sweden (SCB), statistical database', 'dataset': ref, 'licence': 'CC0', 'original': 'https://www.statistikdatabasen.scb.se/'}}


def query(path, sel):
    m = call(url(path)); q = [{'code': c, 'selection': {'filter': 'item', 'values': v}} for c, v in sel]
    r = call(url(path), json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
    return m, r

# (codigo COICOP, etiqueta inglesa)
CPI = [('00', 'all items'), ('01', 'food and non-alcoholic beverages'), ('01.1', 'food'), ('01.1.1', 'cereals and cereal products'), ('01.1.1.2', 'flour of cereals'), ('01.1.1.3', 'bread and bakery products'),
       ('01.1.2', 'live animals, meat and other parts of slaughtered land animals'), ('01.1.2.2', 'meat, fresh, chilled or frozen'), ('01.1.4', 'milk, other dairy products and eggs'), ('01.1.4.5', 'cheese'),
       ('01.1.4.8', 'eggs'), ('01.1.5', 'oils and fats'), ('01.1.5.2', 'butter and other fats from milk'), ('01.1.6', 'fruits and nuts'), ('01.1.7', 'vegetables, tubers and pulses'),
       ('01.1.8', 'sugar, confectionery and desserts'), ('01.1.8.1', 'cane sugar and beet sugar')]
PPI = [('A', 'products of agriculture, forestry and fishing'), ('01', 'products of agriculture'), ('01.11', 'cereals, leguminous crops and oil seeds'), ('01.41', 'dairy cattle, live, and raw milk'),
       ('01.42', 'other cattle, live'), ('01.45', 'sheep and goats, live, and their milk'), ('01.47', 'poultry, live, and eggs'), ('10', 'food products'), ('10.11', 'processed and preserved meat'),
       ('10.12', 'processed and preserved poultry meat'), ('10.31', 'processed and preserved potatoes'), ('10.41', 'oils and fats'), ('10.42', 'margarine and similar fats'), ('10.51', 'dairy and cheese products'),
       ('10.61', 'grain mill products'), ('10.71', 'bread, fresh pastry goods and cakes'), ('10.81', 'sugar'), ('10.91', 'prepared feeds for farm animals'), ('20.15', 'fertilisers and nitrogen compounds'),
       ('28.3', 'agricultural and forestry machinery')]

def block_cpi():
    path = 'PR/PR0101/PR0101A/KPI2020COICOPM'
    m = call(url(path)); cs = codes(var(m, 'VaruTjanstegrupp'), [c for c, _ in CPI], path)
    m, r = query(path, [('VaruTjanstegrupp', cs), ('ContentsCode', ['0000080H']), ('Tid', var(m, 'Tid')['values'])])
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']; lab = dict(CPI); by = {}
    tt = dict(zip(var(m, 'Tid')['values'], var(m, 'Tid')['valueTexts']))
    for row in r['data']:
        k = dict(zip(names, row['key'])); v = num(row['values'][0]); p = month(tt.get(k['Tid'], k['Tid']))
        if p and v is not None: by.setdefault(k['VaruTjanstegrupp'], []).append((p, v))
    for c, pts in by.items():
        put('se-scb-cpi-' + slug(c), 'idx_pag', 'Consumer price index (COICOP): %s, Sweden (SCB, 2020=100)' % lab[c], 'index 2020=100', 'monthly', pts,
            'Índice de precios al consumo por grupo COICOP (base 2020=100), media mensual publicada por SCB; la clasificación COICOP se reconstruyó en 2023, por lo que algunos grupos empiezan más tarde que el total.', 'KPI2020COICOPM (Consumer Price Index 2020=100 by product group)')
    say('IPC', len(by), 'series')

def block_ppi():
    path = 'PR/PR0301/PR0301G/PPI2020M'
    m = call(url(path)); cs = codes(var(m, 'SPIN2015'), [c for c, _ in PPI], path)
    m, r = query(path, [('SPIN2015', cs), ('ContentsCode', ['000000SA']), ('Tid', var(m, 'Tid')['values'])])
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']; lab = dict(PPI); by = {}
    tt = dict(zip(var(m, 'Tid')['values'], var(m, 'Tid')['valueTexts']))
    for row in r['data']:
        k = dict(zip(names, row['key'])); v = num(row['values'][0]); p = month(tt.get(k['Tid'], k['Tid']))
        if p and v is not None: by.setdefault(k['SPIN2015'], []).append((p, v))
    for c, pts in by.items():
        put('se-scb-ppi-' + slug(c), 'idx_perc', 'Producer price index (PPI): %s, Sweden (SCB, 2020=100)' % lab[c], 'index 2020=100', 'monthly', pts,
            'Índice de precios de productor (PPI, base 2020=100) por producto SPIN 2015, publicado por SCB; algunas series acaban antes que otras.', 'PPI2020M (Producer Price Index by market and products SPIN 2015, 2020=100)')
    say('PPI', len(by), 'series')

def block_fert():
    path = 'MI/MI1002/ForsHandelsgodsel'
    m = call(url(path)); reg = var(m, 'Region'); tv = var(m, 'Tid')
    sweden = [c for c, t in zip(reg['values'], reg['valueTexts']) if t.strip() == 'Sweden']
    if len(sweden) != 1: raise RuntimeError('region «Sweden» no encontrada')
    nut = {'nitrogen': 'nitrogen (N)', 'phosphorus': 'phosphorus (P)', 'potassium': 'potassium (K)', 'sulphur': 'sulphur (S)'}
    vv = var(m, 'Vaxtnaring'); n2c = {t.strip(): c for c, t in zip(vv['values'], vv['valueTexts'])}
    cv = var(m, 'ContentsCode'); ct = dict(zip(cv['values'], cv['valueTexts']))
    m, r = query(path, [('Region', sweden), ('Vaxtnaring', list(n2c.values())), ('ContentsCode', cv['values']), ('Tid', tv['values'])])
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']; cc = [c['code'] for c in r['columns'] if c['type'] == 'c']
    c2n = {c: t for t, c in n2c.items()}; tt = dict(zip(tv['values'], tv['valueTexts'])); by = {}
    for row in r['data']:
        k = dict(zip(names, row['key'])); y = re.match(r'^(\d{4})/(\d{4})$', tt.get(k['Tid'], k['Tid']))
        if not y or int(y.group(2)) != int(y.group(1)) + 1: continue
        for j, raw in enumerate(row['values']):
            v = num(raw)
            if v is not None: by.setdefault((c2n[k['Vaxtnaring']], cc[j] if len(cc) > 1 else cv['values'][0]), []).append((y.group(1), v))
    for (nu, cc_), pts in by.items():
        kg = 'kg per hectare' in ct[cc_]
        put('se-scb-fert-%s-%s' % (slug(nu), 'kg-ha' if kg else 'kt'), 'inputs', 'Mineral fertiliser sales, %s (%s), Sweden (SCB)' % (nut.get(nu, nu), 'kg per hectare of utilised land' if kg else '1,000 t of nutrient'), 'kg/ha' if kg else '1,000 t', 'annual', pts,
            'Ventas de abonos minerales por campaña de abonado (1 de julio a 30 de junio); el año indicado es el de INICIO de la campaña (2023 = campaña 2023/2024). Total nacional, según SCB.', 'MI1002 (Sales of mineral fertilisers for agriculture and horticulture)')
    say('fertilizantes', len(by), 'series')

for fn in (block_cpi, block_ppi, block_fert):
    try: fn()
    except Exception as e: say('FALLO %s: %s' % (fn.__name__, str(e)[:200]))
lastm = max(v['latestPeriod'] for v in OUTS.values() if v['frequency'] == 'monthly'); cut = '%04d%s' % (int(lastm[:4]) - 2, lastm[4:])
for k in sorted(OUTS):   # series mensuales que la fuente dejo de publicar hace mas de 2 años: no se publican
    if OUTS[k]['frequency'] == 'monthly' and OUTS[k]['latestPeriod'] < cut: say('omitida (descontinuada): %s hasta %s' % (k, OUTS[k]['latestPeriod'])); del OUTS[k]
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 20: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'SE': {'name': 'Sweden', 'extend': True, 'source': {'name': 'Statistics Sweden (SCB), statistical database', 'url': 'https://www.statistikdatabasen.scb.se/', 'license': 'CC0; credit: Statistics Sweden (SCB)'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))

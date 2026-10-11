#!/usr/bin/env python3
"""Chequia (CSU / Czech Statistical Office, datos abiertos DataStat) -> data/czechia-csu-stats.json (countries.CZ)
Fuente: catalogo de datos abiertos del CSU (DCAT-AP-CZ): https://data.csu.gov.cz/opendata/ ; cada conjunto se descarga en CSV desde .../sady/<ID>/distribuce/csv.
Conjuntos: CEN0203B (precios medios de productos agrarios, mensual), CEN0203E (precios de insumos: fertilizantes y semillas, trimestral), CEN02031 (indices de precios agrarios, base 2020=100, mensual),
ZEM03A (cosecha y rendimiento, anual) y ZEM03C (superficie sembrada a 31 de mayo, anual).
Licencia: condiciones de uso de datos.gov.cz declaradas en cada conjunto (sin obra protegida por derecho de autor, sin base de datos protegida ni derecho sui generis): uso libre; se cita la fuente.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones. Los acumulados («K») y las medias moviles se descartan. Si un nombre ya no existe, el script falla con un mensaje claro y no escribe nada.
Uso: python3 scripts/update-cz-csu.py"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'czechia-csu-stats.json'; LOG = ROOT / 'data' / 'czechia-csu-log.txt'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
BASE = 'https://data.csu.gov.cz/opendata/sady/%s/distribuce/csv'
SG = 'CSU Czechia'
log = []
def say(*a): s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
def fetch(ds):
    err = None
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE % ds, headers=UA), timeout=240) as r: return list(csv.DictReader(io.StringIO(r.read().decode('utf-8-sig'))))
        except Exception as e: err = e; time.sleep(5 * (k + 1))
    raise RuntimeError('%s -> %s' % (ds, err))
def num(x):
    try:
        v = float(str(x).replace(',', '.')); return round(v, 4) if v == v else None
    except Exception: return None
OUTS = {}
def put(sid, group, label, unit, pts, freq, note, ds):
    d = {p: v for p, v in pts if v is not None}; pp = sorted(d.items())
    if len(pp) < 3: say('omitida (menos de 3 puntos):', sid); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    s = {'id': 'cz-csu-' + sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None, 'points': [[k, v] for k, v in pp], 'sourceGroup': SG,
         'reference': {'source': 'CSU (Czech Statistical Office), open data DataStat', 'dataset': ds, 'original': 'https://data.csu.gov.cz/opendata/sady/' + ds.split()[0]}}
    if note: s['periodNote'] = note
    OUTS[s['id']] = s
def need(rows, col, wanted, what):
    names = {r[col].strip() for r in rows}
    miss = [w for w in wanted if w not in names]
    if miss: raise RuntimeError('%s: valores que ya no existen en la fuente: %s' % (what, miss))
def match(rows, col, pat, what):
    """primer nombre que cumple el patron (para nombres de los que no se conoce la forma exacta); si no hay, se avisa y se omite."""
    for n in dict.fromkeys(r[col].strip() for r in rows):
        if re.search(pat, n): return n
    say('aviso:', what, 'no encontrado con', pat); return None
MON = re.compile(r'^\d{4}-\d{2}$')

# --- precios medios de productos agrarios (mensual) ---
def prices():
    rows = [r for r in fetch('CEN0203B') if MON.match(r['CASMKMQR']) and r['UZ02HU.STAT'] == 'CZ' and not r['UZ02HU.KRAJ'].strip()]
    say('CEN0203B filas nacionales mensuales:', len(rows))
    W = [('Pšenice potravinářská [t]', 'wheat-milling', 'wheat (milling)', 'prices'), ('Pšenice krmná [t]', 'wheat-feed', 'wheat (feed)', 'prices'), ('Ječmen sladovnický [t]', 'barley-malting', 'barley (malting)', 'prices'),
         ('Ječmen krmný [t]', 'barley-feed', 'barley (feed)', 'prices'), ('Žito potravinářské [t]', 'rye', 'rye', 'prices'), ('Tritikale [t]', 'triticale', 'triticale', 'prices'), ('Oves krmný [t]', 'oats-feed', 'oats (feed)', 'prices'),
         ('Kukuřice krmná [t]', 'maize', 'maize', 'prices'), ('Hrách krmný [t]', 'feed-peas', 'feed peas', 'prices'), ('Semeno řepky olejné [t]', 'rapeseed', 'rapeseed', 'prices'), ('Semeno slunečnice [t]', 'sunflower', 'sunflower seed', 'prices'),
         ('Soja na zrno [t]', 'soybeans', 'soybeans', 'prices'), ('Cukrovka technická [t]', 'sugar-beet', 'sugar beet', 'prices'), ('Brambory pozdní konzumní [t]', 'ware-potatoes', 'ware potatoes', 'prices'),
         ('Býci jateční v živém [t]', 'bulls-live', 'slaughter bulls (live weight)', 'prices_lv'), ('Krávy jatečné v živém [t]', 'cows-live', 'slaughter cows (live weight)', 'prices_lv')]
    need(rows, 'Reprezentant', [w[0] for w in W], 'CEN0203B')
    opt = [(match(rows, 'Reprezentant', r'^Prasata jatečná v živém', 'prasata'), 'pigs-live', 'slaughter pigs (live weight)', 'prices_lv'), (match(rows, 'Reprezentant', r'^Mléko kravské', 'leche'), 'milk', 'cow milk', 'prices'),
           (match(rows, 'Reprezentant', r'^Vejce slepičí konzumní', 'huevos'), 'eggs', 'table eggs', 'prices')]
    for name, sid, lab, grp in W + [o for o in opt if o[0]]:
        pts = [(r['CASMKMQR'], num(r['Hodnota'])) for r in rows if r['Reprezentant'].strip() == name]; unit = 'CZK/' + {'t': 't', 'l': 'l', 'tis.l.': '1000 l', 'tis.ks': '1000 pcs'}.get(re.search(r'\[(.*?)\]', name).group(1).replace(' ', ''), re.search(r'\[(.*?)\]', name).group(1))
        put('price-' + sid, grp, 'Producer price: %s, Czechia (CSU)' % lab, unit, pts, 'monthly', 'Precio medio de venta del agricultor publicado por el CSU (Kč por la unidad indicada).', 'CEN0203B (Average prices of agricultural products)')
    say('precios:', sum(1 for k in OUTS if k.startswith('cz-csu-price-')), 'series')
# --- insumos (trimestral) ---
def inputs():
    rows = [r for r in fetch('CEN0203E') if re.match(r'^\d{4}-Q[1-4]$', r['CASQKQR2']) and r['Uz0'] == 'CZ']
    W = [('Průmyslová hnojiva - ledek amonný s vápencem 27% [t]', 'fert-can27', 'calcium ammonium nitrate 27%', 'inputs_f'), ('Průmyslová hnojiva - močovina [t]', 'fert-urea', 'urea', 'inputs_f'), ('Průmyslová hnojiva - DAM 390 [t]', 'fert-dam390', 'UAN (DAM 390)', 'inputs_f'),
         ('Průmyslová hnojiva - NPK(15:15:15) [t]', 'fert-npk', 'NPK 15-15-15', 'inputs_f'), ('Průmyslová hnojiva - amofos [t]', 'fert-map', 'ammophos (MAP)', 'inputs_f'), ('Průmyslová hnojiva - draselná sůl 60% gran. [t]', 'fert-potash', 'potassium salt 60%', 'inputs_f'),
         ('Průmyslová hnojiva - síran amonný 21% [t]', 'fert-as', 'ammonium sulphate 21%', 'inputs_f'), ('Osivo a sadba - pšenice ozimá [t]', 'seed-wheat', 'winter wheat seed', 'inputs'), ('Osivo a sadba - ječmen jarní [t]', 'seed-barley', 'spring barley seed', 'inputs')]
    need(rows, 'Reprezentant', [w[0] for w in W], 'CEN0203E')
    for name, sid, lab, grp in W:
        pts = [(r['CASQKQR2'], num(r['Hodnota'])) for r in rows if r['Reprezentant'].strip() == name]
        put('input-' + sid, grp, 'Input price: %s, Czechia (CSU)' % lab, 'CZK/t', pts, 'quarterly', 'Precio medio pagado por el agricultor, publicado por el CSU (Kč por tonelada).', 'CEN0203E (Average prices of selected agricultural inputs)')
    say('insumos:', len(W), 'series')
# --- indices de precios (mensual, base 2020=100) ---
def indices():
    rows = [r for r in fetch('CEN02031') if MON.match(r['CASMKMQRZEM1']) and r['Typ indexu'].startswith('Bazický') and r['Uz0'] == 'CZ']
    W = [('Zemědělská výroba', 'total', 'agricultural output'), ('Rostlinná výroba', 'crops', 'crop output'), ('Živočišná výroba', 'livestock', 'livestock output'), ('Obiloviny', 'cereals', 'cereals'), ('Olejniny', 'oilseeds', 'oilseeds'),
         ('Skot', 'cattle', 'cattle'), ('Mléko', 'milk', 'milk'), ('Vejce', 'eggs', 'eggs')]
    need(rows, 'Klasifikace API', [w[0] for w in W], 'CEN02031')
    for name, sid, lab in W:
        pts = [(r['CASMKMQRZEM1'], num(r['Hodnota'])) for r in rows if r['Klasifikace API'].strip() == name]
        put('aindex-' + sid, 'idx_perc', 'Producer price index: %s, Czechia (CSU, 2020=100)' % lab, 'index 2020=100', pts, 'monthly', 'Indice de precios de los productores agrarios, base 2020=100.', 'CEN02031 (Agricultural producer price indices)')
    say('indices:', len(W), 'series')
# --- cosecha y superficie (anual) ---
CROPS = [('Pšenice', 'wheat'), ('Žito', 'rye'), ('Ječmen', 'barley'), ('Oves', 'oats'), ('Tritikale', 'triticale'), ('Kukuřice na zrno', 'maize'), ('Řepka', 'rapeseed'), ('Slunečnice na semeno', 'sunflower'), ('Sója', 'soybeans'),
         ('Řepa cukrová', 'sugar-beet'), ('Brambory', 'potatoes'), ('Hrách polní na zrno', 'field-peas'), ('Obiloviny na zrno', 'cereals')]
def harvest():
    rows = fetch('ZEM03A'); cl = lambda s: s.strip().lstrip('-').strip()
    for r in rows: r['_c'] = cl(r['Druh zemědělské plodiny'])
    need(rows, '_c', [c[0] for c in CROPS], 'ZEM03A')
    n = 0
    for name, sid in CROPS:
        for ind, kind, unit, grp in (('Sklizeň zemědělských plodin (t)', 'harvest', 't', 'production'), ('Hektarový výnos (t/ha)', 'yield', 't/ha', 'crops')):
            pts = [(r['CasR'], num(r['Hodnota'])) for r in rows if r['_c'] == name and r['Ukazatel'] == ind and r['Uz0'] == 'CZ']
            lab = {'harvest': 'Production', 'yield': 'Yield'}[kind]
            put('%s-%s' % (kind, sid), grp, '%s: %s, Czechia (CSU)' % (lab, sid.replace('-', ' ')), unit, pts, 'annual', None, 'ZEM03A (Harvest of agricultural crops)'); n += 1
    rows = [r for r in fetch('ZEM03C') if r['Typ údaje'].startswith('Aktuální') and r['Uz02'] == 'CZ']
    for r in rows: r['_c'] = cl(r['Druh zemědělské plodiny'])
    need(rows, '_c', [c[0] for c in CROPS], 'ZEM03C')
    for name, sid in CROPS:
        pts = [(r['CasR'], num(r['Hodnota'])) for r in rows if r['_c'] == name]
        put('area-' + sid, 'crops', 'Sown area: %s, Czechia (CSU)' % sid.replace('-', ' '), 'ha', pts, 'annual', 'Superficie sembrada a 31 de mayo de cada año (CSU).', 'ZEM03C (Sown areas of agricultural crops as of 31 May)'); n += 1
    say('cosecha y superficie:', n, 'series')
for f in (prices, inputs, indices, harvest): f()
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 60: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'CZ': {'name': 'Czechia', 'extend': True, 'source': {'name': 'CSU (Czech Statistical Office), open data DataStat', 'url': 'https://data.csu.gov.cz/opendata/', 'license': 'CSU open data (data.gov.cz terms: no protected work or database); credit: CSU'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))

#!/usr/bin/env python3
"""Suecia (Jordbruksverket / Swedish Board of Agriculture, estadisticas oficiales) -> data/sweden-sjv-stats.json (countries.SE)
Fuente: base de datos estadistica de Jordbruksverket (PxWeb, API publica): https://statistik.jordbruksverket.se/ (API: statistik.sjv.se/PXWeb/api/v1/sv/Jordbruksverkets%20statistikdatabas).
Tablas: JO1001L2 (precios de liquidacion al productor, mensual), JO1001AM20 (indice de precios percibidos A-index, 2020=100, mensual) y JO0611L01 (existencias de cereales y colza en la explotacion; junio y septiembre).
Licencia: la politica de datos abiertos de Jordbruksverket (jordbruksverket.se/oppnadata) permite usar los datos «sin ninguna restriccion» bajo CC0 (la que prefiere) o CC BY; la base estadistica se ofrece como datos abiertos con API. Se cita la fuente igualmente.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones. El valor «December (prognos)» de existencias es un pronostico y NO se publica.
Uso: python3 scripts/update-se-sjv.py"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'sweden-sjv-stats.json'; LOG = ROOT / 'data' / 'sweden-sjv-log.txt'
BASE = 'https://statistik.sjv.se/PXWeb/api/v1/sv/Jordbruksverkets%20statistikdatabas/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Content-Type': 'application/json'}
SG = 'Jordbruksverket'
log = []
def say(*a): s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
def url(path): return BASE + '/'.join(urllib.parse.quote(p) for p in path.split('/'))
def call(u, data=None):
    err = None
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=UA), timeout=120) as r: return json.loads(r.read().decode('utf-8-sig'))
        except Exception as e: err = e; time.sleep(5 * (k + 1))
    raise RuntimeError('%s -> %s' % (u, err))

PRICES = 'Priser och prisindex/Priser/Avrakningspriser20/JO1001L2.px'
INDEX = 'Priser och prisindex/Prisindex/Prisindex med basar 2020=100/JO1001AM20.px'
STOCKS = 'Skordar/Lagerhallning/JO0611L01.px'
# (texto exacto de la fuente, id, grupo, etiqueta inglesa)
P = [('Vete, kr/100 kg', 'wheat', 'prices', 'wheat'), ('Råg kr/100 kg', 'rye', 'prices', 'rye'), ('Korn, kr/100 kg', 'barley', 'prices', 'barley'), ('Foderhavre, kr/100 kg', 'feed-oats', 'prices', 'feed oats'),
     ('Raps, kr/100 kg', 'rapeseed', 'prices', 'rapeseed'), ('Sockerbetor, kr/100 kg', 'sugar-beet', 'prices', 'sugar beet'), ('Matpotatis, kr/100 kg', 'ware-potatoes', 'prices', 'ware potatoes'),
     ('Smågrisar, kr/100 kg', 'piglets', 'prices_lv', 'piglets'), ('Hanungnöt, kr/100 kg', 'young-bulls', 'prices_lv', 'young bulls'), ('Ko, kr/100 kg', 'cows', 'prices_lv', 'cows'),
     ('Slaktgris, kr/100 kg', 'slaughter-pigs', 'prices_lv', 'slaughter pigs'), ('Får, kr/100 kg', 'sheep', 'prices_lv', 'sheep'), ('Lamm, kr/100 kg', 'lamb', 'prices_lv', 'lamb'),
     ('Mjölk (4,2 % fett) , kr/100 kg', 'milk', 'prices', 'milk 4.2% fat'), ('A-ägg frigående höns, kr/100 kg', 'eggs-a', 'prices', 'class A eggs'),
     # ampliacion 23-oct-2026: el resto de lineas de la tabla en SEK/100 kg (tulipanes y huevos por pieza se omiten: otra unidad)
     ('Höstvete, kr/100 kg', 'winter-wheat', 'prices', 'winter wheat'), ('Vårvete, kr/100 kg', 'spring-wheat', 'prices', 'spring wheat'), ('Fodervete, kr/100 kg', 'feed-wheat', 'prices', 'feed wheat'),
     ('Foderkorn, kr/100 kg', 'feed-barley', 'prices', 'feed barley'), ('Maltkorn, kr/100 kg', 'malting-barley', 'prices', 'malting barley'), ('Rågvete, kr/100 kg', 'triticale', 'prices', 'triticale'),
     ('Blomkål, 1:a kvalitet, kr/100 kg', 'cauliflower', 'prices', 'cauliflower (class 1)'), ('Tomater, växthusodlad 1:a kvalitet, kr/100 kg', 'tomatoes-gh', 'prices', 'greenhouse tomatoes (class 1)'),
     ('Vitkål, 1:a kvalitet, kr/100 kg', 'white-cabbage', 'prices', 'white cabbage (class 1)'), ('Växthusodlad gurka, 1:a kvalitet, kr/100 kg', 'cucumbers-gh', 'prices', 'greenhouse cucumbers (class 1)'),
     ('Morötter, 1:a kvalitet, kr/100 kg', 'carrots', 'prices', 'carrots (class 1)'), ('Lök, alla kvaliteter, kr/100 kg', 'onions', 'prices', 'onions (all qualities)'),
     ('Potatis för stärkelse, kr/100 kg', 'starch-potatoes', 'prices', 'starch potatoes'), ('Äpplen, alla sorter, kr/100 kg', 'apples', 'prices', 'apples (all varieties)'),
     ('Jordgubbar på friland, kr/100 kg', 'strawberries', 'prices', 'outdoor strawberries'), ('Livkalvar, kr/100 kg', 'breeding-calves', 'prices_lv', 'breeding calves'),
     ('Grisar – klass S, kr/100 kg', 'pigs-s', 'prices_lv', 'pigs, EUROP class S'), ('Grisar – klass E, kr/100 kg', 'pigs-e', 'prices_lv', 'pigs, EUROP class E'),
     ('-varav konventionell mjölk (4,2 % fett), kr/100 kg', 'milk-conv', 'prices', 'conventional milk 4.2% fat'), ('-varav ekologisk mjölk (4,2 % fett), kr/100 kg', 'milk-org', 'prices', 'organic milk 4.2% fat'),
     ('Mjölk (3,7 % fett), kr/100 kg', 'milk-37', 'prices', 'milk 3.7% fat'), ('Ekologiska ägg, kr/100 kg', 'eggs-org', 'prices', 'organic eggs')]
X = [('A-INDEX TOTALT', 'total', 'all farm products'), ('SPANNMÅL', 'cereals', 'cereals'), ('Vete', 'wheat', 'wheat'), ('Korn', 'barley', 'barley'), ('Havre', 'oats', 'oats'), ('Råg', 'rye', 'rye'),
     ('Oljeväxtfrö och oljehaltiga frukter', 'oilseeds', 'oilseeds'), ('Sockerbetor och andra industrigrödor', 'sugar-beet', 'sugar beet and other industrial crops'), ('POTATIS', 'potatoes', 'potatoes'),
     ('Nötkreatur', 'cattle', 'cattle'), ('Gris', 'pigs', 'pigs'), ('Får och getter', 'sheep-goats', 'sheep and goats'), ('Mjölk', 'milk', 'milk'), ('Ägg', 'eggs', 'eggs')]
S = [('Höstvete', 'winter-wheat', 'winter wheat'), ('Vårvete', 'spring-wheat', 'spring wheat'), ('Råg', 'rye', 'rye'), ('Höstkorn', 'winter-barley', 'winter barley'), ('Vårkorn', 'spring-barley', 'spring barley'),
     ('Havre', 'oats', 'oats'), ('Majs', 'maize', 'maize'), ('Höstraps', 'winter-rapeseed', 'winter rapeseed'), ('Vårraps', 'spring-rapeseed', 'spring rapeseed'), ('Spannmål, totalt', 'cereals-total', 'cereals, total')]

IDXB = 'Priser och prisindex/Prisindex/Prisindex med basar 2020=100/'
PMI = IDXB + 'JO1001APMM20.px'; PPI = IDXB + 'JO1001APPM20.px'; KPI = IDXB + 'JO1001KJM20.px'
# ampliacion 23-oct-2026: indices mensuales 2020=100 (texto exacto de la fuente, id, etiqueta inglesa). Los que no tienen datos suficientes se omiten (put exige >= 3 puntos).
PM = [('PM-INDEX TOTALT', 'total', 'all inputs and investment goods'), ('UTSÄDE', 'seed', 'seed'), ('ENERGI OCH DRIVMEDEL', 'energy', 'energy and fuels'), ('Elektricitet', 'electricity', 'electricity'),
      ('Diesel', 'diesel', 'diesel'), ('Andra bränslen och drivmedel', 'other-fuels', 'other fuels'), ('GÖDNINGS- OCH JORDFÖRBÄTTRINGSMEDEL', 'fertilisers', 'fertilisers and soil improvers'),
      ('Enkla gödselmedel', 'fert-straight', 'straight fertilisers'), ('Sammansatta gödselmedel', 'fert-compound', 'compound fertilisers'), ('VÄXTSKYDDS- OCH BEKÄMPNINGSMEDEL', 'plant-protection', 'plant protection products'),
      ('Svampmedel', 'fungicides', 'fungicides'), ('Insektsmedel', 'insecticides', 'insecticides'), ('Ogräsmedel', 'herbicides', 'herbicides'), ('VETERINÄRKOSTNADER', 'veterinary', 'veterinary costs'),
      ('DJURFODER', 'feed', 'animal feed'), ('UNDERHÅLL AV UTRUSTNING', 'maint-equipment', 'maintenance of equipment'), ('UNDERHÅLL AV EKONOMIBYGGNADER', 'maint-buildings', 'maintenance of farm buildings'),
      ('ANDRA VAROR OCH TJÄNSTER', 'other-goods', 'other goods and services'), ('TOTAL INSATSFÖRBRUKNING', 'intermediate', 'total intermediate consumption'), ('UTRUSTNING', 'equipment', 'equipment'),
      ('Traktorer', 'tractors', 'tractors'), ('Övrig utrustning', 'other-equipment', 'other equipment'), ('EKONOMIBYGGNADER', 'buildings', 'farm buildings'), ('INVESTERINGSVAROR', 'investment', 'investment goods')]
FOODX = [('VEGETABILIER', 'plant-products', 'plant-based products'), ('Mjöl, gryn & hårt bröd', 'flour', 'flour groats and crispbread'), ('Mjukt bröd', 'bread', 'soft bread'), ('Matpotatis', 'potatoes', 'ware potatoes'),
         ('Socker', 'sugar', 'sugar'), ('Margarin', 'margarine', 'margarine'), ('ANIMALIER', 'animal-products', 'animal-based products'), ('MEJERIPRODUKTER', 'dairy', 'dairy products'), ('Mjölk', 'milk', 'milk'),
         ('Grädde', 'cream', 'cream'), ('Smör', 'butter', 'butter'), ('Ost', 'cheese', 'cheese'), ('Glass', 'ice-cream', 'ice cream'), ('ÄGG', 'eggs', 'eggs'), ('KÖTT, CHARK & KÖTTKONSERVER', 'meat-all', 'meat including charcuterie and canned meat'),
         ('KÖTT', 'meat', 'meat'), ('Nötkött', 'beef', 'beef'), ('Griskött', 'pork', 'pork'), ('Fjäderfäkött', 'poultry', 'poultry meat'), ('Annat kött', 'other-meat', 'other meat'), ('CHARK & KÖTTKONSERVER', 'charcuterie', 'charcuterie and canned meat only')]
PPIJ = [('PPI-J TOTALT', 'total', 'all agriculture-regulated foods')] + FOODX
KPIJ = [('KPI-J TOTALT (inkl moms)', 'total', 'all agriculture-regulated foods')] + [(a.replace('Mjöl, gryn & hårt bröd', 'Mjöl, gryn och hårt bröd').replace('KÖTT, CHARK & KÖTTKONSERVER', 'KÖTT, CHARK & KÖTTKONSERVER'), b, c) for a, b, c in FOODX] + [('KPI TOTALT', 'cpi', 'all items (CPI)'), ('LIVSMEDEL TOTALT', 'food-all', 'all food (CPI)'), ('EJ JORDBRUKSREGLERADE LIVSMEDEL', 'food-unregulated', 'foods not agriculture-regulated (CPI)')]

def meta(path): return call(url(path))
def var(m, code): return next(v for v in m['variables'] if v['code'] == code)
def pick(v, wanted, what):
    """codigos de los valores cuyo texto (sin espacios sobrantes) coincide exactamente; falta alguno -> error claro (la tabla cambio)."""
    t2c = {re.sub(r'\s+', ' ', x).strip(): c for c, x in zip(v['values'], v['valueTexts'])}
    miss = [w for w in wanted if re.sub(r'\s+', ' ', w).strip() not in t2c]
    if miss: raise RuntimeError('%s: valores que ya no existen en la fuente: %s' % (what, miss))
    return [t2c[re.sub(r'\s+', ' ', w).strip()] for w in wanted]
def query(path, m, sel):
    q = [{'code': c, 'selection': {'filter': 'item', 'values': vals}} for c, vals in sel]
    r = call(url(path), json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
    cols = [c for c in r['columns'] if c['type'] != 'c']
    return cols, r['data']
def num(x):
    try:
        v = float(str(x).replace(',', '.')); return v if v == v else None
    except Exception: return None
OUTS = {}
def put(sid, group, label, unit, freq, pts, note, ref):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pp = sorted(d.items())
    if len(pp) < 3: say('omitida (menos de 3 puntos):', sid); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    s = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
         'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'reference': {'source': 'Jordbruksverket (Swedish Board of Agriculture), statistics database', 'dataset': ref, 'licence': 'Jordbruksverket open data (CC0 / CC BY)', 'original': 'https://statistik.jordbruksverket.se/'}}
    if note: s['periodNote'] = note
    OUTS[sid] = s
def month(txt):
    m = re.match(r'^(\d{4})M(\d{2})$', txt); return '%s-%s' % m.groups() if m else None

def run_monthly(path, items, prefix, mk, unit, note):
    m = meta(path); pv = var(m, 'Produkter'); tv = var(m, 'Månad')
    codes = pick(pv, [i[0] for i in items], path)
    cols, data = query(path, m, [('Produkter', codes), ('Månad', tv['values'])])
    t2t = dict(zip(tv['values'], tv['valueTexts'])); c2i = dict(zip(codes, items)); by = {}
    for row in data:
        pc, tc = row['key']; per = month(t2t[tc]); v = num(row['values'][0])
        if per and v is not None: by.setdefault(pc, []).append((per, v))
    for pc, pts in by.items(): mk(c2i[pc], pts, unit, note, path.split('/')[-1])
    say(path.split('/')[-1], len(by), 'series')

def mk_price(it, pts, unit, note, ds):
    nn = (note + (' El precio de la remolacha solo se publica de septiembre a diciembre.' if it[1] == 'sugar-beet' else '')).strip()
    put('se-sjv-price-' + it[1], it[2], 'Producer price: %s, Sweden (Jordbruksverket)' % it[3], 'SEK/100 kg', 'monthly', pts, nn, ds + ' (Avräkningspriser, månad)')
def mk_idx(it, pts, unit, note, ds):
    put('se-sjv-aindex-' + it[1], 'idx_perc', 'Producer price index: %s, Sweden (Jordbruksverket, 2020=100)' % it[2], 'index 2020=100', 'monthly', pts, note, ds + ' (Avräkningsprisindex A-index, månad)')

def mk_pm(it, pts, unit, note, ds):
    put('se-sjv-pmindex-' + it[1], 'idx_pag', 'Farm input price index: %s, Sweden (Jordbruksverket, 2020=100)' % it[2], 'index 2020=100', 'monthly', pts, note, ds + ' (Produktionsmedelsprisindex PM-index, månad)')
def mk_ppi(it, pts, unit, note, ds):
    put('se-sjv-ppij-' + it[1], 'idx_perc', 'Food-industry producer price index: %s, Sweden (Jordbruksverket PPI-J, 2020=100)' % it[2], 'index 2020=100', 'monthly', pts, note, ds + ' (Producentprisindex livsmedelsindustrin PPI-J, månad)')
def mk_kpi(it, pts, unit, note, ds):
    put('se-sjv-kpij-' + it[1], 'idx_pag', 'Consumer price index: %s, Sweden (Jordbruksverket KPI-J, 2020=100)' % it[2], 'index 2020=100', 'monthly', pts, note, ds + ' (Konsumentprisindex jordbruksreglerade livsmedel KPI-J, månad)')

# ampliacion 23-oct-2026: produccion mensual (sacrificios, lacteos, huevos) y prevision de cosecha anual. Unidades tal como las publica la fuente.
AP = 'Animalieproduktion/'
SLK = [('Summa nötkreatur', 'cattle', 'cattle total'), ('Summa tjur', 'bulls', 'bulls'), ('Ko', 'cows', 'cows'), ('Kviga', 'heifers', 'heifers'), ('Summa kalv', 'calves', 'calves'),
       ('Summa gris', 'pigs', 'pigs total'), ('Slaktgris', 'fattening-pigs', 'fattening pigs'), ('Suggor', 'sows', 'sows'), ('Summa får', 'sheep', 'sheep total'), ('Lamm', 'lamb', 'lambs')]
DAI = [('Kvantitet invägd mjölk, 1 000 ton', 'milk-intake', 'milk received by dairies', 'milk'), ('Produktion av konsumtionsmjölk och syrade produkter totalt, 1 000 ton', 'drinking-milk', 'drinking milk and soured products', 'production'),
       ('Produktion av grädde, 1 000 ton', 'cream', 'cream', 'production'), ('Produktion av ost, 1 000 ton', 'cheese', 'cheese', 'production'), ('Produktion av smör, 1 000 ton', 'butter', 'butter', 'production'),
       ('Produktion av mjölkpulver, 1 000 ton', 'milk-powder', 'milk powder', 'production')]
FCG = [('Höstvete', 'winter-wheat', 'winter wheat'), ('Vårvete', 'spring-wheat', 'spring wheat'), ('Råg', 'rye', 'rye'), ('Höstkorn', 'winter-barley', 'winter barley'), ('Vårkorn', 'spring-barley', 'spring barley'),
       ('Havre', 'oats', 'oats'), ('Spannmål totalt', 'cereals-total', 'cereals total'), ('Höstraps', 'winter-rapeseed', 'winter rapeseed'), ('Vårraps', 'spring-rapeseed', 'spring rapeseed'), ('Oljeväxter totalt', 'oilseeds-total', 'oilseeds total')]

def gen(path, sels, tcode):
    """consulta generica: sels = [(variable, [textos exactos])]; el tiempo se pide entero. Si PxWeb devuelve una variable como columnas de contenido (dimension de medidas), cada columna es una serie.
    Devuelve ({clave de valores (textos): [(texto de periodo, valor)]}, nombres de las variables de la clave)."""
    m = meta(path); q = [(c, pick(var(m, c), t, path)) for c, t in sels]; q.append((tcode, var(m, tcode)['values']))
    r = call(url(path), json.dumps({'query': [{'code': c, 'selection': {'filter': 'item', 'values': vals}} for c, vals in q], 'response': {'format': 'json'}}).encode())
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']; cc = [re.sub(r'\s+', ' ', c.get('text', '')).strip() for c in r['columns'] if c['type'] == 'c']
    miss = [c for c, _ in sels if c not in names]
    if len(cc) > 1 and len(miss) != 1: raise RuntimeError('%s: no se sabe a que variable corresponden las columnas de contenido' % path)
    txt = {v['code']: dict(zip(v['values'], v['valueTexts'])) for v in m['variables']}; by = {}
    for row in r['data']:
        k = dict(zip(names, row['key'])); base = tuple(re.sub(r'\s+', ' ', txt[c][k[c]]).strip() for c in names if c != tcode)
        for j, raw in enumerate(row['values']):
            v = num(raw)
            if v is not None: by.setdefault(base + ((cc[j],) if len(cc) > 1 else ()), []).append((txt[tcode][k[tcode]].strip(), v))
    return by, [c for c in names if c != tcode] + (miss if len(cc) > 1 else [])

def run_slaughter():
    path = AP + 'Slakt/JO0604A4.px'
    by, cols = gen(path, [('Djurslag', [i[0] for i in SLK]), ('Tabelluppgift', ['Slaktade hela kroppar, 1 000-tal', 'Kvantitet, 1 000 ton'])], 'Månad')
    nm = {i[0]: i for i in SLK}
    for k, pts in by.items():
        it, tab = nm[k[cols.index('Djurslag')]], k[cols.index('Tabelluppgift')]
        pp = [(month(a), v) for a, v in pts]
        if tab.startswith('Slaktade'):
            put('se-sjv-slaughter-heads-' + it[1], 'livestock', 'Slaughterings at abattoirs: %s (1,000 head), Sweden (Jordbruksverket)' % it[2], '1,000 head', 'monthly', pp, 'Animales sacrificados en mataderos (miles de cabezas), según Jordbruksverket.', 'JO0604A4 (Slakt av större lantbruksdjur vid slakteri, månad)')
        else:
            put('se-sjv-slaughter-weight-' + it[1], 'production', 'Slaughter quantity at abattoirs: %s (1,000 t), Sweden (Jordbruksverket)' % it[2], '1,000 t', 'monthly', pp, 'Cantidad sacrificada en mataderos (miles de toneladas), según Jordbruksverket.', 'JO0604A4 (Slakt av större lantbruksdjur vid slakteri, månad)')
    say('JO0604A4', len(by), 'series')

def run_dairy():
    path = AP + 'Mejeriproduktion/JO0604A2.px'
    by, _ = gen(path, [('Variabel', [i[0] for i in DAI])], 'Månad'); nm = {i[0]: i for i in DAI}
    for (t,), pts in by.items():
        it = nm[t]
        put('se-sjv-dairy-' + it[1], it[3], 'Dairy production: %s (1,000 t), Sweden (Jordbruksverket)' % it[2], '1,000 t', 'monthly', [(month(a), v) for a, v in pts], 'Producción láctea mensual de las industrias (miles de toneladas), según Jordbruksverket.', 'JO0604A2 (Mejeriproduktion, månad)')
    say('JO0604A2', len(by), 'series')

def run_eggs():
    path = AP + 'Agg/JO0604A8.px'
    by, _ = gen(path, [('Variabel', ['Kvantitet invägd ägg, 1 000 ton'])], 'Månad')
    for k, pts in by.items():
        put('se-sjv-eggs-intake', 'production', 'Eggs received by wholesalers (1,000 t), Sweden (Jordbruksverket)', '1,000 t', 'monthly', [(month(a), v) for a, v in pts], 'Huevos recibidos por el comercio mayorista (miles de toneladas), según Jordbruksverket.', 'JO0604A8 (Partihandelns invägning av ägg, månad)')
    say('JO0604A8', len(by), 'series')

def run_forecast():
    path = 'Skordar/Skordeprognos/JO0605P01.px'
    by, cols = gen(path, [('Gröda', [i[0] for i in FCG]), ('Variabel', ['Hektarskörd, kg per hektar', 'Totalskörd, ton'])], 'År'); nm = {i[0]: i for i in FCG}
    for k, pts in by.items():
        it, vb = nm[k[cols.index('Gröda')]], k[cols.index('Variabel')]
        yld = vb.startswith('Hektar')
        put('se-sjv-forecast-%s-%s' % ('yield' if yld else 'total', it[1]), 'crops', 'Harvest forecast, %s: %s, Sweden (Jordbruksverket)' % ('yield per hectare' if yld else 'total harvest', it[2]), 'kg/ha' if yld else 't', 'annual',
            [(a, v) for a, v in pts], 'PREVISIÓN de cosecha de Jordbruksverket (no es la cosecha final): cada año recoge la previsión publicada ese año.', 'JO0605P01 (Skördeprognos efter gröda)')
    say('JO0605P01', len(by), 'series')

def run_stocks():
    path = STOCKS; m = meta(path); gv = var(m, 'Gröda'); mv = var(m, 'Månad'); av = var(m, 'År'); xv = var(m, 'Variabel')
    gc = pick(gv, [i[0] for i in S], path); vcode = pick(xv, ['Värde, ton'], path)
    months = {c: t for c, t in zip(mv['values'], mv['valueTexts']) if t.strip() in ('Juni', 'September')}   # diciembre es pronostico: no se publica
    if len(months) != 2: raise RuntimeError('existencias: meses de la fuente cambiaron: %s' % mv['valueTexts'])
    cols, data = query(path, m, [('Gröda', gc), ('Månad', list(months)), ('År', av['values']), ('Variabel', vcode)])
    a2t = dict(zip(av['values'], av['valueTexts'])); c2i = dict(zip(gc, S)); by = {}
    # el orden de la clave sigue el de las columnas devueltas
    names = [c['code'] for c in cols]
    for row in data:
        k = dict(zip(names, row['key'])); v = num(row['values'][0]); per = '%s-%s' % (a2t[k['År']].strip(), '06' if months[k['Månad']].strip() == 'Juni' else '09')
        if v is not None: by.setdefault(k['Gröda'], []).append((per, v))
    for gcode, pts in by.items():
        it = c2i[gcode]
        put('se-sjv-stocks-' + it[1], 'stocks', 'Farm stocks: %s, Sweden (Jordbruksverket)' % it[2], 't', 'quarterly', pts,
            'Existencias en la explotación según la encuesta de Jordbruksverket, en junio y en septiembre de cada año (no hay serie mensual); el valor de diciembre es un pronóstico y no se publica.', 'JO0611L01 (Lagerhållning av spannmål och raps)')
    say('JO0611L01', len(by), 'series')

# ---- segunda ampliacion: tierra, arrendamiento, cuentas agrarias, censo de junio, estructura y ecologico (23-oct) ----
def yr(a):
    # precio de la tierra: en los años de cambio de metodo (2005, 2011, 2014, 2017, 2020, 2023) la fuente publica «gammal» (metodo anterior) y «ny» (nuevo); se usa «ny» y se omite «gammal»
    a = a.strip(); m = re.match(r'^(\d{4})( ny)?$', a); return m.group(1) if m else None
def ann(path, sels, tcode, build):
    """consulta anual con gen(); build(clave_dict, pts) -> (sid, group, label, unit, note) o None para saltar."""
    by, cols = gen(path, sels, tcode); n = 0
    for k, pts in by.items():
        r = build(dict(zip(cols, k)))
        if not r: continue
        sid, grp, lab, unit, note = r
        put(sid, grp, lab, unit, 'annual', [(yr(a), v) for a, v in pts if yr(a)], note, path.split('/')[-1][:-3] + ' (' + r[5] + ')' if len(r) > 5 else path.split('/')[-1][:-3]); n += 1
    say(path.split('/')[-1], n, 'series')
NUTS = {'Riket': ('sweden', 'Sweden'), 'Stockholm': ('stockholm', 'Stockholm'), 'Östra Mellansverige': ('east-central', 'East Central Sweden'), 'Småland med öarna': ('smaland', 'Småland and islands'), 'Sydsverige': ('south', 'South Sweden'),
        'Västsverige': ('west', 'West Sweden'), 'Norra Mellansverige': ('north-central', 'North Central Sweden'), 'Mellersta Norrland': ('mid-norrland', 'Mid Norrland'), 'Övre Norrland': ('upper-norrland', 'Upper Norrland')}
LAND = {'Åkermark': ('arable', 'arable land'), 'Betesmark': ('pasture', 'pasture'), 'Jordbruksmark': ('agricultural', 'agricultural land')}
def run_land():
    path = 'Priser och prisindex/Markpriser/JO1002L1.px'
    def b(k):
        reg, lt, vb = k['Region (Nuts 2)'], k['Ägoslag'], k['Variabel']
        if vb.startswith('Pris'):
            if reg != 'Riket' and lt != 'Åkermark': return None
            return ('se-sjv-landprice-%s-%s' % (LAND[lt][0], NUTS[reg][0]), 'prices', 'Farmland sale price: %s, %s (Jordbruksverket)' % (LAND[lt][1], NUTS[reg][1]), 'SEK thousand/ha', 'Precio medio de las fincas vendidas (miles de coronas por hectárea), según Jordbruksverket. En 2005, 2011, 2014, 2017, 2020 y 2023 cambió el método de cálculo: la fuente publica ese año con el método anterior y con el nuevo; aquí se usa el nuevo, así que los niveles anteriores a cada cambio no son estrictamente comparables.')
        if vb.startswith('Antal') and reg == 'Riket' and lt == 'Jordbruksmark':
            return ('se-sjv-landsales-count-sweden', 'production', 'Farmland sales: number of properties sold, Sweden (Jordbruksverket)', 'sales', 'Número de fincas agrícolas vendidas al año, según Jordbruksverket.')
        return None
    ann(path, [('Region (Nuts 2)', list(NUTS)), ('Ägoslag', list(LAND)), ('Variabel', ['Antal försäljningar', 'Pris per hektar, tkr per hektar'])], 'År', b)
    path = 'Priser och prisindex/Markpriser/JO1002L4.px'
    def b2(k):
        reg, lt = k['Region (Nuts 2)'], k['Ägoslag']
        if reg != 'Riket': return None
        return ('se-sjv-landindex-%s-sweden' % LAND[lt][0], 'idx_perc', 'Farmland price index: %s, Sweden (Jordbruksverket)' % LAND[lt][1], 'index', 'Índice de precios de la tierra agrícola de Jordbruksverket, publicado tal cual (la tabla no indica la base). Cambios de método como en el precio de la tierra: se usa el valor «nuevo» de los años de cambio.')
    ann(path, [('Region (Nuts 2)', ['Riket']), ('Ägoslag', list(LAND))], 'År', b2)
def run_rent():
    path = 'Priser och prisindex/Arrendepriser/JO1003M01.px'
    R = {k: v for k, v in NUTS.items() if k in ('Riket', 'Östra Mellansverige', 'Småland med öarna', 'Sydsverige', 'Västsverige', 'Norra Mellansverige')}
    def b(k):
        reg, lt = k['Region (Nuts 2)'], k['Ägoslag']
        if reg != 'Riket' and lt != 'Åkermark': return None
        return ('se-sjv-rent-%s-%s' % (LAND[lt][0], R[reg][0]), 'prices', 'Farmland rent: %s, %s (Jordbruksverket)' % (LAND[lt][1], R[reg][1]), 'SEK/ha', 'Arrendamiento medio por hectárea (coronas) incluyendo arriendos gratuitos, según Jordbruksverket.')
    ann(path, [('Region (Nuts 2)', list(R)), ('Ägoslag', list(LAND)), ('Variabel', ['Inklusive gratisarrenden']), ('Tabelluppgift', ['Genomsnittligt pris per hektar'])], 'År', b)
EAA_EN = {'100000': 'value of crop output', '130000': 'value of animal output', '150000': 'agricultural services income', '170000': 'income from secondary non-agricultural activities', '180000': 'total value of agricultural output',
          '200000': 'costs of inputs and services', '260000': 'gross value added at basic prices', '270000': 'consumption of fixed capital', '280000': 'net value added at basic prices', '310000': 'other production subsidies',
          '320000': 'factor income', '290000': 'compensation of employees', '330000': 'net operating surplus', '340000': 'rent and leasing costs', '350000': 'interest costs', '360000': 'interest income', '370000': 'entrepreneurial income'}
EAA_IND = {'A': 'real factor income per annual work unit', 'B': 'real entrepreneurial income per unpaid annual work unit', 'C': 'real entrepreneurial income'}
def run_eaa():
    path = 'Jordbrukets ekonomi/1 EAA/JO0205H2.px'; m = meta(path); cats = var(m, 'Kategori i EAA')['valueTexts']
    def b(k):
        t = k['Kategori i EAA']; code = t.split(' ')[0]; name = EAA_EN.get(code)
        if not name: return None
        return ('se-sjv-eaa-' + code, 'production', 'Agricultural accounts (EAA): %s, Sweden (Jordbruksverket)' % name, 'SEK million', 'Cuentas económicas de la agricultura (EAA) a precios corrientes, millones de coronas; el último año puede ser una estimación avanzada.')
    ann(path, [('Kategori i EAA', cats)], 'År', b)
    path = 'Jordbrukets ekonomi/1 EAA/JO0205H3.px'; m = meta(path); ind = var(m, 'Indikator')['valueTexts']
    def b2(k):
        t = k['Indikator']; l = t.split(':')[0].split(' ')[-1]
        return ('se-sjv-eaa-indicator-' + l.lower(), 'idx_perc', 'Farm income indicator %s: %s, Sweden (Jordbruksverket)' % (l, EAA_IND[l]), 'index 2019-2021=100', 'Indicadores de renta agraria A, B y C (índice 2019-2021=100) calculados por Jordbruksverket.')
    ann(path, [('Indikator', ind)], 'År', b2)
JUNE = [('Kor för mjölkproduktion', 'dairy-cows', 'dairy cows', 'livestock'), ('Kor för uppfödning av kalvar', 'suckler-cows', 'suckler cows', 'livestock'), ('Summa nötkreatur', 'cattle', 'cattle total', 'livestock'), ('Summa får', 'sheep', 'sheep total', 'livestock'),
        ('Suggor, inklusive gyltor', 'sows', 'sows and gilts', 'livestock'), ('Slaktgrisar', 'fattening-pigs', 'fattening pigs', 'livestock'), ('Summa grisar', 'pigs', 'pigs total', 'livestock'), ('Höns', 'hens', 'hens', 'livestock'),
        ('Slaktkycklingar', 'broilers', 'broilers', 'livestock'), ('Kalkoner', 'turkeys', 'turkeys', 'livestock'), ('Hästar', 'horses', 'horses', 'livestock')]
def run_june():
    path = 'Lantbrukets djur/Lantbruksdjur i juni/JO0103F01.px'; nm = {i[0]: i for i in JUNE}
    def b(k):
        it, vb = nm[k['Kategori']], k['Variabel']
        if vb == 'Antal djur': return ('se-sjv-june-animals-' + it[1], 'livestock', 'Livestock in June: %s (head), Sweden (Jordbruksverket)' % it[2], 'head', 'Censo de junio de Jordbruksverket (muestra y registro); no es el censo de diciembre.')
        if it[1] in ('cattle', 'pigs', 'sheep', 'dairy-cows'): return ('se-sjv-june-holdings-' + it[1], 'livestock', 'Holdings with animals in June: %s, Sweden (Jordbruksverket)' % it[2], 'holdings', 'Número de explotaciones con ese ganado en junio, según Jordbruksverket.')
        return None
    ann(path, [('Län', ['00 Riket']), ('Kategori', list(nm)), ('Variabel', ['Antal djur', 'Antal företag']), ('Tabelluppgift', ['Värde'])], 'År', b)
def run_farms():
    path = 'Jordbruksforetag/Jordbruksforetag och jordbruksforetagare/JO0106F01.px'
    def b(k):
        vb = k['Variabel']
        return ('se-sjv-farms-arable-ha' if vb.startswith('Areal') else 'se-sjv-farms-with-arable', 'production', 'Arable area on farms (ha), Sweden (Jordbruksverket)' if vb.startswith('Areal') else 'Farms with arable land (number), Sweden (Jordbruksverket)', 'ha' if vb.startswith('Areal') else 'farms', 'Censo agrario anual de Jordbruksverket; solo hay años 2007, 2010, 2013, 2016 y desde 2020 (no son anuales antes).')
    ann(path, [('Storleksgrupp', ['Totalt']), ('Brukningsform åkermark', ['Totalt']), ('Variabel', ['Areal åkermark, hektar', 'Antal företag med åkermark'])], 'År', b)
def run_organic():
    path = 'Ekologisk produktion/1 Ekologiskt odlad jordbruksmark/JO0104C06.px'
    LT = {'Total jordbruksmark': ('agricultural', 'agricultural land'), 'Åkermark': ('arable', 'arable land'), 'Betesmark': ('pasture', 'pasture')}
    def b(k):
        lt, vb = k['Ägoslag'], k['Variabel']
        if vb.startswith('Areal'): return ('se-sjv-organic-area-' + LT[lt][0], 'crops', 'Organic farmland area: %s, Sweden (Jordbruksverket)' % LT[lt][1], 'ha', 'Superficie ecológica (certificada y en conversión) según Jordbruksverket.')
        if vb.startswith('Andel'): return ('se-sjv-organic-share-' + LT[lt][0], 'crops', 'Organic share of %s, Sweden (Jordbruksverket)' % LT[lt][1], '%', 'Porcentaje de superficie ecológica sobre la total, según Jordbruksverket.')
        if lt == 'Total jordbruksmark': return ('se-sjv-organic-farms', 'crops', 'Farms with organic farmland, Sweden (Jordbruksverket)', 'farms', 'Número de explotaciones con superficie ecológica, según Jordbruksverket.')
        return None
    ann(path, [('Län', ['00 Riket']), ('Variabel', ['Areal, hektar', 'Andel ekologisk areal, procent', 'Antal företag']), ('Ägoslag', list(LT)), ('Omställd/under omställning', ['Totalt omställd/under omställning'])], 'År', b)
    path = 'Ekologisk produktion/3 Ekologisk Animalieproduktion/JO0609C1.px'
    OD = [('Kvantitet invägd ekologisk mjölk, 1 000 ton', 'milk-intake', 'organic milk received'), ('Produktion av ekologisk konsumtionsmjölk, 1 000 ton', 'drinking-milk', 'organic drinking milk'), ('Produktion av ekologisk grädde, 1 000 ton', 'cream', 'organic cream'),
          ('Produktion av ekologisk ost, 1 000 ton', 'cheese', 'organic cheese'), ('Partihandelns invägning av ekologiska ägg, 1 000 ton', 'eggs', 'organic eggs received by wholesalers')]
    nm = {i[0]: i for i in OD}
    ann(path, [('Variabel', list(nm))], 'År', lambda k: ('se-sjv-organic-' + nm[k['Variabel']][1], 'milk' if 'milk' in nm[k['Variabel']][1] else 'production', 'Organic production: %s (1,000 t), Sweden (Jordbruksverket)' % nm[k['Variabel']][2], '1,000 t', 'Producción ecológica anual según Jordbruksverket.'))
    path = 'Ekologisk produktion/3 Ekologisk Animalieproduktion/JO0609C2.px'
    by, _ = gen(path, [('Variabel', ['Kvantitet invägd ekologisk mjölk, 1 000 ton'])], 'Månad')
    for k, pts in by.items():
        put('se-sjv-organic-milk-intake-monthly', 'milk', 'Organic milk received by dairies, monthly (1,000 t), Sweden (Jordbruksverket)', '1,000 t', 'monthly', [(month(a), v) for a, v in pts], 'Leche ecológica recibida por las lecherías cada mes (miles de toneladas), según Jordbruksverket.', 'JO0609C2 (Ekologisk mejeri- och äggproduktion, månad)')
    path = 'Ekologisk produktion/3 Ekologisk Animalieproduktion/JO0609C4.px'
    SL = {'Summa Nötkreatur': ('cattle', 'cattle'), 'Summa Gris': ('pigs', 'pigs'), 'Summa Får och lamm': ('sheep', 'sheep and lambs'), 'Slaktkyckling': ('broilers', 'broilers')}
    ann(path, [('Djurslag', list(SL)), ('Variabel', ['Kvantitet, ton'])], 'År', lambda k: ('se-sjv-organic-slaughter-' + SL[k['Djurslag']][0], 'production', 'Organic slaughter quantity: %s (t), Sweden (Jordbruksverket)' % SL[k['Djurslag']][1], 't', 'Sacrificio de animales criados con métodos ecológicos, según Jordbruksverket.'))
    path = 'Ekologisk produktion/2 Antal omstallda ekologiska djur/JO0115B1.px'
    OA = {'Summa kor': ('cows', 'cows'), 'Summa nötkreatur': ('cattle', 'cattle total'), 'Summa får och lamm': ('sheep', 'sheep and lambs'), 'Summa grisar': ('pigs', 'pigs total'), 'Värphöns': ('laying-hens', 'laying hens'), 'Slaktkycklingar': ('broilers', 'broilers')}
    def b3(k):
        it, vb = OA[k['Djurslag']], k['Variabel']
        if vb == 'Antal djur': return ('se-sjv-organic-animals-' + it[0], 'livestock', 'Organic animals: %s (head), Sweden (Jordbruksverket)' % it[1], 'head', 'Animales ecológicos (incluidos los en conversión) según Jordbruksverket.')
        return ('se-sjv-organic-animals-share-' + it[0], 'livestock', 'Organic share of animals: %s, Sweden (Jordbruksverket)' % it[1], '%', 'Porcentaje de animales ecológicos sobre el total, según Jordbruksverket.')
    ann(path, [('Län', ['00 Riket']), ('Variabel', ['Antal djur', 'Andel ekologiskt hållna djur, procent']), ('Djurslag', list(OA))], 'År', b3)

run_monthly(PRICES, P, 'price', mk_price, 'SEK/100 kg', 'Precio de liquidación pagado al productor (kr por 100 kg), media mensual publicada por Jordbruksverket.')
run_monthly(INDEX, X, 'aindex', mk_idx, 'index', 'Índice de precios percibidos por el agricultor (A-index), base 2020=100.')
run_monthly(PMI, PM, 'pmindex', mk_pm, 'index', 'Índice de precios de los medios de producción que compra el agricultor (PM-index), base 2020=100; fitosanitarios y veterinarios dejaron de publicarse en 2024.')
run_monthly(PPI, PPIJ, 'ppij', mk_ppi, 'index', 'Índice de precios de productor de la industria alimentaria para alimentos regulados por la política agraria (PPI-J), base 2020=100.')
run_monthly(KPI, KPIJ, 'kpij', mk_kpi, 'index', 'Índice de precios al consumo de alimentos regulados por la política agraria (KPI-J, con IVA), base 2020=100, y comparación con el IPC general.')
run_stocks()
for fn in (run_slaughter, run_dairy, run_eggs, run_forecast, run_land, run_rent, run_eaa, run_june, run_farms, run_organic):
    try: fn()
    except Exception as e: say('FALLO %s: %s' % (fn.__name__, str(e)[:200]))
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 25: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'SE': {'name': 'Sweden', 'extend': True, 'source': {'name': 'Jordbruksverket (Swedish Board of Agriculture), official statistics database', 'url': 'https://statistik.jordbruksverket.se/', 'license': 'Jordbruksverket open data (CC0 / CC BY); credit: Jordbruksverket'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))

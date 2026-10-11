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
     ('Mjölk (4,2 % fett) , kr/100 kg', 'milk', 'prices', 'milk 4.2% fat'), ('A-ägg frigående höns, kr/100 kg', 'eggs-a', 'prices', 'class A eggs')]
X = [('A-INDEX TOTALT', 'total', 'all farm products'), ('SPANNMÅL', 'cereals', 'cereals'), ('Vete', 'wheat', 'wheat'), ('Korn', 'barley', 'barley'), ('Havre', 'oats', 'oats'), ('Råg', 'rye', 'rye'),
     ('Oljeväxtfrö och oljehaltiga frukter', 'oilseeds', 'oilseeds'), ('Sockerbetor och andra industrigrödor', 'sugar-beet', 'sugar beet and other industrial crops'), ('POTATIS', 'potatoes', 'potatoes'),
     ('Nötkreatur', 'cattle', 'cattle'), ('Gris', 'pigs', 'pigs'), ('Får och getter', 'sheep-goats', 'sheep and goats'), ('Mjölk', 'milk', 'milk'), ('Ägg', 'eggs', 'eggs')]
S = [('Höstvete', 'winter-wheat', 'winter wheat'), ('Vårvete', 'spring-wheat', 'spring wheat'), ('Råg', 'rye', 'rye'), ('Höstkorn', 'winter-barley', 'winter barley'), ('Vårkorn', 'spring-barley', 'spring barley'),
     ('Havre', 'oats', 'oats'), ('Majs', 'maize', 'maize'), ('Höstraps', 'winter-rapeseed', 'winter rapeseed'), ('Vårraps', 'spring-rapeseed', 'spring rapeseed'), ('Spannmål, totalt', 'cereals-total', 'cereals, total')]

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

run_monthly(PRICES, P, 'price', mk_price, 'SEK/100 kg', 'Precio de liquidación pagado al productor (kr por 100 kg), media mensual publicada por Jordbruksverket.')
run_monthly(INDEX, X, 'aindex', mk_idx, 'index', 'Índice de precios percibidos por el agricultor (A-index), base 2020=100.')
run_stocks()
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

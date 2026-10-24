#!/usr/bin/env python3
"""Finlandia (Luke, Natural Resources Institute Finland, estadisticas agrarias) -> data/finland-luke-stats.json (countries.FI, extend)
Fuente: base PxWeb de Luke, API publica: https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/ (maa = estadisticas agrarias).
Bloque 1 (precios al productor, mensual): leche (tuohin/kk/0100), carne (0200), huevos (0300), cereales y colza (0400), patata de consumo (0500).
Bloque 3: semanales (euhint: cereales por fabrica, canales de vacuno y cerdo, huevos), produccion y prevision de cosecha (sattil), superficie (kamama), censo de ganado (kotlkm) y balance de cereales (viltas); campañas con el año de inicio.
Bloque 2 (produccion, mensual): sacrificios y carne producida (lihtuo/kk/0100), leche recibida por las lecherias (maitot/kk/0100); kg -> t y l -> 1.000 l son conversiones exactas.
Licencia: Luke publica sus estadisticas bajo CC BY 4.0 (luke.fi, terms of use of statistics); atribucion: «Natural Resources Institute Finland (Luke)». Limites de la API: 100 llamadas/10 s, 1.000.000 celdas.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones (la leche va en c/l, la carne y los huevos en EUR/100 kg, los cereales en EUR/1.000 kg). Los huecos («..», «-») se omiten.
Uso: python3 scripts/update-fi-luke.py"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'finland-luke-stats.json'; LOG = ROOT / 'data' / 'finland-luke-log.txt'
BASE = 'https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/maa/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Content-Type': 'application/json'}
SG = 'Luke'
log = []
def say(*a): s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
def call(u, data=None):
    err = None
    for k in range(4):
        time.sleep(1.2)   # Luke corta la conexion si se le insiste: una llamada cada ~1 s
        try:
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=UA), timeout=120) as r: return json.loads(r.read().decode('utf-8-sig'))
        except Exception as e: err = e; time.sleep(6 * (k + 1))
    raise RuntimeError('%s -> %s' % (u, err))
def url(path): return ('https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/' if path.startswith('met/') else BASE) + '/'.join(urllib.parse.quote(p) for p in path.split('/'))
def clean(t): return re.sub(r'\s+', ' ', t).strip()
def slug(t): return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
def var(m, code): return next(v for v in m['variables'] if v['code'] == code)
def pick(v, wanted, what):
    t2c = {clean(x): c for c, x in zip(v['values'], v['valueTexts'])}
    miss = [w for w in wanted if clean(w) not in t2c]
    if miss: raise RuntimeError('%s: valores que ya no existen en la fuente: %s' % (what, miss))
    return [t2c[clean(w)] for w in wanted]
def num(x):
    try:
        v = float(str(x).replace(',', '.').replace(' ', '')); return v if v == v else None
    except Exception: return None
def month(txt):
    m = re.match(r'^(\d{4})M(\d{2})$', txt); return '%s-%s' % m.groups() if m else None

import datetime as _dt
def wk(t):
    m = re.match(r'^(\d{4})W(\d{2})$', t)
    if not m: return None
    try: return _dt.date.fromisocalendar(int(m.group(1)), int(m.group(2)), 1).isoformat()   # lunes de la semana ISO
    except ValueError: return None
def yr(t):
    m = re.match(r'^(\d{4})$', t.strip()); return m.group(1) if m else None
def crop_year(t):
    m = re.match(r'^(\d{4})/(\d{2})$', t.strip())   # 2025/26 -> 2025 (año de inicio)
    return m.group(1) if m and int(m.group(2)) == (int(m.group(1)) + 1) % 100 else None

OUTS = {}
def put(sid, group, label, unit, pts, note, ref, freq='monthly'):
    d = {p: v for p, v in pts if p and v is not None}
    pp = sorted(d.items())
    if len(pp) < 3: say('omitida (menos de 3 puntos):', sid); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    OUTS[sid] = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
                 'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'periodNote': note,
                 'reference': {'source': 'Natural Resources Institute Finland (Luke), statistics database', 'dataset': ref, 'licence': 'CC BY 4.0', 'original': 'https://statdb.luke.fi/'}}

def table(path, sel, tvar, tf=month):
    """sel = [(codigo de variable, [textos exactos])]; las demas variables con un solo valor se piden enteras; la de tiempo, entera (tf convierte su texto en periodo; None = se omite).
    Devuelve ({(valores..): [(periodo, valor)]}, nombres de las variables de la clave). Si «Information» llega como varias columnas de contenido, cada una es una serie."""
    m = call(url(path)); q = []; used = {c for c, _ in sel}
    for c, texts in sel: q.append({'code': c, 'selection': {'filter': 'item', 'values': pick(var(m, c), texts, path)}})
    for v in m['variables']:
        if v['code'] in used: continue
        q.append({'code': v['code'], 'selection': {'filter': 'all', 'values': ['*']}})
    r = call(url(path), json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']
    cc = [clean(c.get('text', '')) for c in r['columns'] if c['type'] == 'c']
    miss = [c for c, _ in sel if c not in names]
    texts = {v['code']: dict(zip(v['values'], v['valueTexts'])) for v in m['variables']}
    by = {}
    for row in r['data']:
        k = dict(zip(names, row['key'])); per = tf(texts[tvar][k[tvar]]) if tvar in k else None
        base = tuple(clean(texts[c][k[c]]) for c in names if c != tvar)
        for j, raw in enumerate(row['values']):
            v = num(raw)
            if per and v is not None: by.setdefault(base + ((cc[j],) if len(cc) > 1 else ()), []).append((per, v))
    return by, [c for c in names if c != tvar] + (miss if len(cc) > 1 else [])

def block_milk():
    path = 'tuohin/kk/0100_tuohin.px'
    info = ['Average producer price (c/l)', 'Price of standard milk, quality class E (c/l)', 'Price of standard milk, quality class I (c/l)', 'Production subsidies (c/l)']
    by, _ = table(path, [('INFO', info)], 'M')
    for (t,), pts in by.items():
        put('fi-luke-milk-' + slug(re.sub(r'\s*\(c/l\)', '', t)), 'prices', 'Producer milk price: %s, Finland (Luke)' % re.sub(r'\s*\(c/l\)', '', t).lower().replace('production subsidies', 'production subsidies paid per litre'), 'c/l', pts,
            'Precio de la leche al productor en céntimos por litro, media mensual publicada por Luke.', '0100_tuohin (Producer prices of milk, monthly)')
    say('leche', len(by), 'series')

def block_meat():
    path = 'tuohin/kk/0200_tuohin.px'
    m = call(url(path)); sp = [clean(t) for t in var(m, 'LJ')['valueTexts']]
    by, cols = table(path, [('LJ', sp)], 'M')
    i = cols.index('LJ')
    for k, pts in by.items():
        t = re.sub(r'\s*\d\)$', '', k[i])   # nota al pie «1)» de la fuente
        put('fi-luke-meat-' + slug(t), 'prices_lv', 'Producer price, meat: %s, Finland (Luke)' % t.lower(), 'EUR/100 kg', pts,
            'Precio de compra al productor en euros por 100 kg de carne en canal, media mensual publicada por Luke.', '0200_tuohin (Producer prices of meat, monthly)')
    say('carne', len(by), 'series')

def block_eggs():
    path = 'tuohin/kk/0300_tuohin.px'
    m = call(url(path)); sp = [clean(t) for t in var(m, 'LLUOKK_TUOTT')['valueTexts']]
    by, cols = table(path, [('LLUOKK_TUOTT', sp)], 'M')
    i = cols.index('LLUOKK_TUOTT')
    for k, pts in by.items():
        put('fi-luke-eggs-' + slug(k[i]), 'prices', 'Producer price, eggs: %s, Finland (Luke)' % k[i], 'EUR/100 kg', pts,
            'Precio de los huevos al productor en euros por 100 kg, media mensual publicada por Luke.', '0300_tuohin (Producer prices of eggs, monthly)')
    say('huevos', len(by), 'series')

def block_cereals():
    path = 'tuohin/kk/0400_tuohin.px'
    m = call(url(path)); sp = [clean(t) for t in var(m, 'LJ')['valueTexts']]
    by, cols = table(path, [('INFO', ['Basic price (EUR/1,000 kg)']), ('LJ', sp)], 'M')
    i = cols.index('LJ')
    for k, pts in by.items():
        t = k[i].lstrip('.')
        put('fi-luke-cereal-' + slug(t), 'prices', 'Producer price: %s (basic price), Finland (Luke)' % t.lower(), 'EUR/t', pts,
            'Precio base al productor en euros por tonelada (1.000 kg), media mensual publicada por Luke; el precio ajustado por calidad no se publica aquí.', '0400_tuohin (Producer prices of cereals and rape, monthly)')
    say('cereales', len(by), 'series')

def block_potato():
    path = 'tuohin/kk/0500_tuohin.px'
    by, _ = table(path, [('INFO', ['Producer price food potatoes (e/100 kg)', 'Producer price early potatoes (e/100 kg)'])], 'M')   # «Net-%» no es un precio
    for (t,), pts in by.items():
        t2 = re.sub(r'\s*\(e/100 kg\)', '', t)
        put('fi-luke-potato-' + slug(t2), 'prices', '%s, Finland (Luke)' % t2, 'EUR/100 kg', pts, 'Precio de la patata al productor en euros por 100 kg, media mensual publicada por Luke.', '0500_tuohin (Producer prices of food potatoes, monthly)')
    say('patata', len(by), 'series')

def put_g(sid, group, label, unit, pts, note, ref, k=1, freq='monthly'):
    put(sid, group, label, unit, [(p, round(v / k, 6) if k != 1 else v) for p, v in pts], note, ref, freq)

SL = ['CATTLE TOTAL', 'Cows', 'Bulls, over 12 months', 'Heifers, over 12 months', 'PIGS TOTAL', 'Fattening pigs', 'Sows', 'SHEEP TOTAL', 'Lambs', 'POULTRY TOTAL', 'Broilers', 'Turkeys']
def block_slaughter():
    path = 'lihtuo/kk/0100_lihtuo.px'
    by, cols = table(path, [('INFO', ['Slaughterings (heads)', 'Meat production (kg)']), ('LJ', SL)], 'M')
    for k, pts in by.items():
        sp, info = k[cols.index('LJ')], k[cols.index('INFO')]
        nm = sp.lstrip('.').lower().replace(' total', '').replace('total', '').strip()
        if info.startswith('Slaughterings'):
            put_g('fi-luke-slaughter-heads-' + slug(nm), 'livestock', 'Slaughterings: %s (heads), Finland (Luke)' % nm, 'heads', pts, 'Animales sacrificados en mataderos cada mes (cabezas), según Luke.', '0100_lihtuo (Meat production monthly)')
        else:   # kg -> t es una conversion exacta
            put_g('fi-luke-meat-production-' + slug(nm), 'production', 'Meat production (slaughterhouses): %s, Finland (Luke)' % nm, 't', pts, 'Producción de carne en mataderos en toneladas (Luke publica kg; se divide por 1.000, conversión exacta).', '0100_lihtuo (Meat production monthly)', 1000)
    say('sacrificios', len(by), 'series')

def block_milk_volume():
    path = 'maitot/kk/0100_maitot.px'
    by, _ = table(path, [('INFO', ['Received milk volume total (l)', 'Received organic milk (l)'])], 'M')
    for (t,), pts in by.items():
        org = 'organic' in t
        put_g('fi-luke-milk-received-' + ('organic' if org else 'total'), 'milk', 'Milk received by dairies: %s, Finland (Luke)' % ('organic milk' if org else 'total'), '1,000 l', pts,
              'Leche recibida por las industrias lácteas en miles de litros (Luke publica litros; se divide por 1.000, conversión exacta).', '0100_maitot (Production of dairy milk, monthly)', 1000)
    say('leche recogida', len(by), 'series')

# ---------------------------------------------------------------- bloque 3: semanales (euhint), cultivos, superficie, censo y balance de cereales
WK = 'Semana ISO; la fecha es el lunes de la semana. Cotización semanal de Luke (seguimiento de precios de la UE), media nacional ponderada.'
def wlabel(t): return t
def block_weekly():
    n = 0
    # cereales: precio de compra de la fabrica, 4 plazas
    by, cols = table('euhint/0100_euhint.px', [('INFO', ["Factory's purchase price"]), ('PK', ['Raisio', 'Koskenkorva', 'Hyvinkää', 'Vaasa'])], 'W', wk)
    for k, pts in by.items():
        pl, sp = k[cols.index('PK')], k[cols.index('LJ')]
        put('fi-luke-wk-grain-%s-%s' % (slug(pl), slug(sp)), 'prices', 'Grain, factory purchase price: %s at %s, Finland (Luke)' % (sp.lower(), pl), 'EUR/t', pts, WK + ' Precio de compra de la fábrica en %s (EUR por 1.000 kg).' % pl, '0100_euhint (Price quotations for grain in Finland)', 'weekly'); n += 1
    for path, tag, lbl, classes in (('euhint/0300_euhint.px', 'bulls', 'young bull carcass', ['R3', 'U3', 'O3', 'EUROP average']), ('euhint/0400_euhint.px', 'cows', 'cow carcass', ['O3', 'P2', 'EUROP average']), ('euhint/0500_euhint.px', 'heifers', 'heifer carcass', ['R3', 'O3', 'EUROP average']),
                                    ('euhint/0900_euhint.px', 'pigs', 'pig carcass', ['E', 'U', 'R', 'SEUROP average'])):
        by, cols = table(path, [('LL', classes)], 'W', wk)
        for k, pts in by.items():
            c = k[cols.index('LL')]
            put('fi-luke-wk-%s-%s' % (tag, slug(c)), 'prices_lv', 'Carcass price, %s: class %s, Finland (Luke)' % (lbl, c), 'EUR/100 kg', pts, WK + ' Precio en euros por 100 kg de canal.', path.split('/')[-1][:-3] + ' (Prices for carcases in Finland)', 'weekly'); n += 1
    by, cols = table('euhint/1400_euhint.px', [('KL', ['Average of size classes M and L'])], 'W', wk)
    for k, pts in by.items():
        tt = k[cols.index('TT')]
        put('fi-luke-wk-eggs-' + slug(tt), 'prices', 'Egg selling price (packing plants): %s, sizes M and L, Finland (Luke)' % tt.lower(), 'EUR/100 kg', pts, WK + ' Precio de venta de los centros de embalaje, euros por 100 kg.', '1400_euhint (Selling prices of eggs quoted by packing plants)', 'weekly'); n += 1
    by, cols = table('euhint/1700_euhint.px', [('LL', ['SEUROP average'])], 'W', wk)
    for k, pts in by.items():
        put('fi-luke-wk-pig-weight', 'production', 'Average pig carcass weight, Finland (Luke)', 'kg', pts, WK + ' Peso medio de la canal de cerdo.', '1700_euhint (Average weight of pig carcases)', 'weekly'); n += 1
    say('semanales', n, 'series')

CROPS = ['Wheat', 'Rye', 'Barley', 'Oats', 'Potatoes', 'Sugar beet', 'Rape']
def block_crops():
    by, cols = table('sattil/0400_sattil.px', [('LJ', CROPS)], 'A', yr); n = 0
    for k, pts in by.items():
        sp = k[cols.index('LJ')]
        put('fi-luke-production-' + slug(sp), 'crops', 'Crop production: %s (million kg), Finland (Luke)' % sp.lower(), 'million kg', pts, 'Producción anual (millones de kg) desde 1920, estadística final de Luke.', '0400_sattil (Production 1920-)', 'annual'); n += 1
    # prevision de cosecha: ultima estimacion y cifra final por separado
    FS = ['Wheat total', 'Barley total', 'Oats', 'Rye', 'Rape and turnip rape, total', 'Potatoes total']
    by, cols = table('sattil/0500_sattil.px', [('LJ', FS), ('AKOHT', ['Estimate 2', 'Final'])], 'A', yr)
    for k, pts in by.items():
        sp, ver, info = k[cols.index('LJ')], k[cols.index('AKOHT')], k[-1]
        tag = {'Yield (million kg)': ('total', 'million kg', 'harvest'), 'Area (1 000 ha)': ('area', '1,000 ha', 'area'), 'Yield per hectare (kg/ha)': ('yield', 'kg/ha', 'yield per hectare')}.get(info)
        if not tag: continue
        fin = ver == 'Final'
        put('fi-luke-%s-%s-%s' % ('crop' if fin else 'forecast', tag[0], slug(sp)), 'crops', '%s, %s: %s, Finland (Luke)' % ('Crop ' + tag[2] if fin else 'Harvest forecast (second estimate), ' + tag[2], 'final figure' if fin else 'not final', sp.lower().replace(', total', '').replace(' total', '')), tag[1], pts,
            'Cifra final de la estadística de cosecha de Luke.' if fin else 'PREVISIÓN (segunda estimación del año) de Luke: no es la cosecha final; los años cerrados tienen su serie «final».', '0500_sattil (Crop production forecast)', 'annual'); n += 1
    say('cultivos', n, 'series')

def block_area():
    by, cols = table('kamama/0300_kamama.px', [('LJ', ['TOTAL (cultivated area and fallow)', 'Cultivated area', '.Winter wheat', '.Spring wheat', '.Rye', '.Barley', '.Oats', '.Potatoes', '.Sugar beet', '.Turnip rape and rape', '.Grassland crops', 'Fallow area'])], 'A', yr); n = 0
    for k, pts in by.items():
        sp = k[cols.index('LJ')].lstrip('.')
        put('fi-luke-area-' + slug(sp), 'crops', 'Area: %s (1,000 ha), Finland (Luke)' % sp.lower(), '1,000 ha', pts, 'Superficie anual (miles de hectáreas) desde 1920, según Luke.', '0300_kamama (Use of arable land area)', 'annual'); n += 1
    say('superficie', n, 'series')

LIVE = ['Cattle', '.Dairy cows', '.Suckler cows', 'Pigs', '.Sows 8 months and over', '.Fattening pigs over 3 - under 8 months', 'Poultry', '.Laying hens', '.Broilers', 'Sheep', 'Goats', 'Horses (on farms)']
def block_livestock():
    by, cols = table('kotlkm/1000_kotlkm.px', [('LJ', LIVE)], 'A', yr); n = 0
    for k, pts in by.items():
        sp = k[cols.index('LJ')].lstrip('.')
        put('fi-luke-livestock-' + slug(sp), 'livestock', 'Livestock: %s (1,000 head), Finland (Luke)' % sp.lower(), '1,000 head', pts, 'Censo anual de ganado (miles de cabezas) desde 1920, según Luke.', '1000_kotlkm (Number of livestock)', 'annual'); n += 1
    say('censo', n, 'series')

BAL = ['Production', 'Import', 'Export', 'DOMESTIC USE, TOTAL', 'Use as feed, total', 'Use for food, total', 'Closing stocks 30.6.']
def block_balance():
    by, cols = table('viltas/0100_viltas.px', [('TASE', BAL), ('LJ', ['Grain', '.Wheat', '.Rye', '.Barley', '.Oats'])], 'SATOA', crop_year); n = 0
    nm = {'Production': 'production', 'Import': 'imports', 'Export': 'exports', 'DOMESTIC USE, TOTAL': 'domestic use', 'Use as feed, total': 'use as feed', 'Use for food, total': 'use for food', 'Closing stocks 30.6.': 'closing stocks'}
    for k, pts in by.items():
        b, sp = k[cols.index('TASE')], k[cols.index('LJ')].lstrip('.')
        put('fi-luke-balance-%s-%s' % (slug(nm[b]), slug(sp)), 'production', 'Cereals balance sheet, %s: %s (million kg), Finland (Luke)' % (nm[b], sp.lower()), 'million kg', pts,
            'Balance de cereales por campaña (1 julio a 30 junio, millones de kg); el año indicado es el de INICIO de la campaña (2024 = campaña 2024/25).', '0100_viltas (Cereals balance sheet)', 'annual'); n += 1
    say('balance de cereales', n, 'series')

# ---------------------------------------------------------------- bloque 4: bosque y madera (met)
def block_forest():
    n = 0
    PT = ['Industrial roundwood', '.Logs', '.Pulpwood', '..Pine logs', '..Spruce logs', '..Pine pulpwood', '..Spruce pulpwood', 'Energywood']
    by, cols = table('met/marhak/kk/0100_marhak.px', [('OM', ['TOTAL (forest ownership category)']), ('PTL', PT)], 'M')
    for k, pts in by.items():
        a = k[cols.index('PTL')].lstrip('.').lower().replace('total (roundwood assortment)', 'all assortments')
        put_g('fi-luke-removals-' + slug(a), 'production', 'Commercial roundwood removals: %s (1,000 m³), Finland (Luke)' % a, '1,000 m³', pts, 'Cortas comerciales mensuales (miles de m³) según Luke; el último mes puede ser provisional.', '0100_marhak (Industrial roundwood removals by month)')
        n += 1
    AS = ['Pine logs', 'Spruce logs', 'Birch logs', 'Pine pulpwood', 'Spruce pulpwood', 'Birch pulpwood']
    by, cols = table('met/teokau/kk/0100_teokau.px', [('INFO', ['Price (EUR/m³)']), ('MPKH', ['WHOLE COUNTRY']), ('KAUP', ['Delivery sales', 'Standing sales']), ('PTL', ['..' + x for x in AS])], 'M')
    for k, pts in by.items():
        ks, a = k[cols.index('KAUP')], k[cols.index('PTL')].lstrip('.').lower()
        put_g('fi-luke-wood-price-%s-%s' % (slug(ks), slug(a)), 'prices', 'Roundwood price, %s: %s, Finland (Luke)' % (ks.lower(), a), 'EUR/m³', pts, 'Precio medio de la madera en rollo vendida por propietarios forestales privados en toda Finlandia (EUR/m³), según Luke. Venta en pie = el comprador corta; venta en destino = entregada.', '0100_teokau (Roundwood trade by month)'); n += 1
    by, cols = table('met/teokau/kk/0200_teokau.px', [('PTL', AS)], 'M')
    for k, pts in by.items():
        a = k[cols.index('PTL')].lower()
        put_g('fi-luke-stumpage-index-' + slug(a), 'idx_perc', 'Nominal stumpage price index: %s, Finland (Luke, 12/2010=100)' % a, 'index 12/2010=100', pts, 'Índice nominal del precio de la madera en pie (diciembre 2010 = 100), según Luke.', '0200_teokau (Nominal stumpage price index)'); n += 1
    by, cols = table('met/hakker/0500_hakker.px', [('MU', ['Increment', 'Drain', 'Total rounwood removals'])], 'A', yr)
    for k, pts in by.items():
        v = k[cols.index('MU')]
        put_g('fi-luke-forest-' + slug(v.replace('rounwood', 'roundwood')), 'production', 'Forest: %s (million m³), Finland (Luke)' % v.lower().replace('rounwood', 'roundwood'), 'million m³', pts, 'Incremento, drenaje (drain = cortas más pérdidas naturales) y cortas totales de madera en rollo (millones de m³) desde 1918, según Luke.', '0500_hakker (Total annual roundwood removals, increment and drain)', freq='annual'); n += 1
    say('bosque', n, 'series')

for fn in (block_milk, block_meat, block_eggs, block_cereals, block_potato, block_slaughter, block_milk_volume, block_weekly, block_crops, block_area, block_livestock, block_balance, block_forest):
    try: fn()
    except Exception as e: say('FALLO %s: %s' % (fn.__name__, str(e)[:200]))
def _yr(p): return int(p[:4])
for fq in ('monthly', 'weekly', 'annual'):   # series que la fuente dejo de publicar hace mas de 2 años (respecto a la mas reciente de su frecuencia) o con muy pocos puntos
    grp = [k for k, v in OUTS.items() if v['frequency'] == fq]
    if not grp: continue
    top = max(_yr(OUTS[k]['latestPeriod']) for k in grp)
    for k in sorted(grp):
        v = OUTS[k]
        if _yr(v['latestPeriod']) < top - 2 or len(v['points']) < (12 if fq != 'annual' else 5): say('omitida (descontinuada o corta): %s (%d puntos, hasta %s)' % (k, len(v['points']), v['latestPeriod'])); del OUTS[k]
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 30: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'FI': {'name': 'Finland', 'extend': True, 'source': {'name': 'Natural Resources Institute Finland (Luke), statistics database', 'url': 'https://statdb.luke.fi/', 'license': 'CC BY 4.0; credit: Natural Resources Institute Finland (Luke)'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))

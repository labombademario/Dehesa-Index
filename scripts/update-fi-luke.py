#!/usr/bin/env python3
"""Finlandia (Luke, Natural Resources Institute Finland, estadisticas agrarias) -> data/finland-luke-stats.json (countries.FI, extend)
Fuente: base PxWeb de Luke, API publica: https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/ (maa = estadisticas agrarias).
Bloque 1 (precios al productor, mensual): leche (tuohin/kk/0100), carne (0200), huevos (0300), cereales y colza (0400), patata de consumo (0500).
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
def url(path): return BASE + '/'.join(urllib.parse.quote(p) for p in path.split('/'))
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

OUTS = {}
def put(sid, group, label, unit, pts, note, ref):
    d = {p: v for p, v in pts if v is not None}
    pp = sorted(d.items())
    if len(pp) < 3: say('omitida (menos de 3 puntos):', sid); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    OUTS[sid] = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': 'monthly', 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
                 'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'periodNote': note,
                 'reference': {'source': 'Natural Resources Institute Finland (Luke), statistics database', 'dataset': ref, 'licence': 'CC BY 4.0', 'original': 'https://statdb.luke.fi/'}}

def table(path, sel, tvar):
    """sel = [(codigo de variable, [textos exactos])]; las demas variables con un solo valor se piden enteras; la de tiempo, entera. Devuelve ({(valores..): [(periodo, valor)]}, nombres de columnas)."""
    m = call(url(path)); q = []; used = {c for c, _ in sel}
    for c, texts in sel: q.append({'code': c, 'selection': {'filter': 'item', 'values': pick(var(m, c), texts, path)}})
    for v in m['variables']:
        if v['code'] in used: continue
        q.append({'code': v['code'], 'selection': {'filter': 'all', 'values': ['*']}})
    r = call(url(path), json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']
    texts = {v['code']: dict(zip(v['values'], v['valueTexts'])) for v in m['variables']}
    cc = [clean(c.get('text', '')) for c in r['columns'] if c['type'] == 'c']   # si «Information» llega como varias columnas de contenido, cada una es una serie
    by = {}
    for row in r['data']:
        k = dict(zip(names, row['key'])); per = month(texts[tvar][k[tvar]]) if tvar in k else None
        base = tuple(clean(texts[c][k[c]]) for c in names if c != tvar)
        for j, raw in enumerate(row['values']):
            v = num(raw)
            if per and v is not None: by.setdefault(base + ((cc[j],) if len(cc) > 1 else ()), []).append((per, v))
    return by, [c for c in names if c != tvar]

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

def put_g(sid, group, label, unit, pts, note, ref, k=1):
    put(sid, group, label, unit, [(p, round(v / k, 6) if k != 1 else v) for p, v in pts], note, ref)

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

for fn in (block_milk, block_meat, block_eggs, block_cereals, block_potato, block_slaughter, block_milk_volume):
    try: fn()
    except Exception as e: say('FALLO %s: %s' % (fn.__name__, str(e)[:200]))
last = max(v['latestPeriod'] for v in OUTS.values()); cut = '%04d%s' % (int(last[:4]) - 2, last[4:])
for k in sorted(OUTS):   # series descontinuadas hace mas de 2 años o con muy pocos puntos: no se publican
    v = OUTS[k]
    if v['latestPeriod'] < cut or len(v['points']) < 12: say('omitida (descontinuada o corta): %s (%d puntos, hasta %s)' % (k, len(v['points']), v['latestPeriod'])); del OUTS[k]
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

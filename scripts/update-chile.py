#!/usr/bin/env python3
"""Chile (ODEPA, portal de datos abiertos https://datos.odepa.gob.cl, licencia Creative Commons Attribution: el campo license_id de cada conjunto en la API CKAN del portal es 'cc-by', leido el 6 oct 2026)
-> data/chile-stats.json (countries.CL) y data/chile-log.txt.
Tres conjuntos oficiales, todos en CSV por ano y descubiertos en tiempo de ejecucion con la API CKAN del propio portal:
  comercio-exterior (Servicio Nacional de Aduanas): exportaciones (volumen y USD FOB) e importaciones (volumen y USD CIF) por producto del Sistema Armonizado, ano natural completo (12 meses publicados).
  precios-consumidor: precio medio semanal de supermercados, ferias, carnicerias y panaderias; aqui, media simple mensual de 'Precio promedio' de todas las observaciones del producto y la unidad indicados.
  precios-mayoristas-de-frutas-y-hortalizas: media simple mensual de 'Precio promedio' de todos los mercados, variedades y calidades del producto en UNA unidad de comercializacion.
Sin estimaciones: lo que no esta publicado no se rellena; una serie con menos de 3 puntos o sin dato en los ultimos 3 anos se descarta y se anota en el log. Las unidades son las del fichero ('$' = peso chileno)."""
import csv, datetime, io, json, re, sys, time, urllib.request
from collections import defaultdict
BASE = 'https://datos.odepa.gob.cl/api/3/action/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
LOG = []
OUT = {}
NOW = datetime.date.today()
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def opn(u, t=300):
    last = None
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t)
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError('%s -> %s' % (u[:120], last))
def resources(pkg):
    """[(ano, nombre, url)] de los recursos CSV cuyo nombre acaba en el ano."""
    d = json.loads(opn(BASE + 'package_show?id=' + pkg, 90).read())['result']
    if d.get('license_id') != 'cc-by': raise RuntimeError('licencia inesperada en %s: %r' % (pkg, d.get('license_id')))
    out = []
    for r in d['resources']:
        m = re.search(r'(\d{4})\s*$', r.get('name') or '')
        if m and (r.get('format') or '').upper() == 'CSV': out.append((int(m.group(1)), r.get('name') or '', r['url']))
    return out
def rows(url):
    t = io.TextIOWrapper(opn(url), encoding='utf-8-sig', newline='')
    return csv.DictReader(t)
def num(s):
    try: return float(str(s).replace('.', '').replace(',', '.')) if ',' in str(s) and '.' in str(s) else float(str(s).replace(',', '.'))
    except Exception: return None
def mk(id_, group, label, unit, freq, pts, sg, note=None, min_pts=3):
    pts = sorted(pts)
    if len(pts) < min_pts: log('descartada', id_, len(pts), 'puntos'); return
    ly = int(pts[-1][0][:4])
    if ly < NOW.year - 3: log('descartada', id_, 'ultimo', pts[-1][0]); return
    last, prev = pts[-1], pts[-2]
    s = dict(id=id_, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1],
             changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=[[p, v] for p, v in pts], sourceGroup=sg)
    if note: s['note'] = note
    OUT[id_] = s
# ---------------- comercio exterior ----------------
# (clave, etiqueta en ingles, prefijos del codigo de producto, unidad esperada del volumen)
HS = (('wheat', 'Wheat (HS 1001)', ('1001',), 'Kilo neto'), ('maize', 'Maize (HS 1005)', ('1005',), 'Kilo neto'), ('barley', 'Barley (HS 1003)', ('1003',), 'Kilo neto'),
      ('oats', 'Oats (HS 1004)', ('1004',), 'Kilo neto'), ('rye', 'Rye (HS 1002)', ('1002',), 'Kilo neto'), ('rice', 'Rice (HS 1006)', ('1006',), 'Kilo neto'),
      ('soy', 'Soya beans (HS 1201)', ('1201',), 'Kilo neto'), ('rapeseed', 'Rapeseed (HS 1205)', ('1205',), 'Kilo neto'), ('potato', 'Potatoes, fresh (HS 0701)', ('0701',), 'Kilo neto'),
      ('sugar', 'Sugar (HS 1701)', ('1701',), 'Kilo neto'), ('fruit', 'Fruit and nuts (HS 08)', ('08',), 'Kilo neto'), ('wine', 'Wine (HS 2204)', ('2204',), 'Litro'),
      ('olive', 'Olive oil (HS 1509)', ('1509',), 'Kilo neto'), ('cattle', 'Beef, fresh/chilled/frozen (HS 0201-0202)', ('0201', '0202'), 'Kilo neto'),
      ('pigs', 'Pork (HS 0203)', ('0203',), 'Kilo neto'), ('sheep', 'Sheep meat (HS 0204)', ('0204',), 'Kilo neto'), ('poultry', 'Poultry meat (HS 0207)', ('0207',), 'Kilo neto'),
      ('eggs', 'Eggs (HS 0407-0408)', ('0407', '0408'), 'Kilo neto'), ('milk', 'Milk and cream (HS 0401-0402)', ('0401', '0402'), 'Kilo neto'),
      ('butter', 'Butter and milk fats (HS 0405)', ('0405',), 'Kilo neto'), ('cheese', 'Cheese and curd (HS 0406)', ('0406',), 'Kilo neto'), ('fertilizer', 'Fertilisers (HS 31)', ('31',), 'Kilo neto'))
def trade():
    firstyear = 2010
    for flow, pkg_word, vcol, word, tag in (('exp', 'Exportaciones', 'USD FOB', 'exports', 'exp'), ('imp', 'Importaciones', 'USD CIF', 'imports', 'imp')):
        res = {y: u for y, nm, u in resources('comercio-exterior') if nm.startswith(pkg_word) and y >= firstyear}
        vol = defaultdict(lambda: defaultdict(float)); usd = defaultdict(lambda: defaultdict(float)); months = defaultdict(set)
        for y in sorted(res):
            if y >= NOW.year: continue   # el ano en curso esta incompleto
            try:
                for r in rows(res[y]):
                    code = r['Codigo producto']; v = num(r.get(vcol)); q = num(r['Volumen'])
                    try: mo = int(r['Mes'])
                    except Exception: continue
                    months[y].add(mo)
                    for key, nm, pref, unit in HS:
                        if code.startswith(pref):
                            if v is not None: usd[(key, y)][flow] += v
                            if q is not None and r['Unidad'] == unit: vol[(key, y)][flow] += q
                            break
                log(flow, y, 'ok')
            except Exception as e: log('ERROR', flow, y, repr(e)[:160]); months.pop(y, None)
        complete = {y for y in months if len(months[y]) == 12 and y < NOW.year}
        for key, nm, pref, unit in HS:
            vp = [[str(y), round(vol[(key, y)][flow] / 1000.0, 3) if unit == 'Kilo neto' else round(vol[(key, y)][flow] / 100.0, 3)] for y in sorted(complete) if (key, y) in vol and flow in vol[(key, y)]]
            up = [[str(y), round(usd[(key, y)][flow] / 1e6, 3)] for y in sorted(complete) if (key, y) in usd and flow in usd[(key, y)]]
            u = 't' if unit == 'Kilo neto' else 'hl'
            sg = 'ODEPA comercio exterior (Aduanas) ' + key
            mk('cl-odepa-trade-%s-%s-vol' % (key, tag), 'trade', '%s: Chile %s, world, volume (ODEPA/Aduanas)' % (nm, word), u, 'annual', vp, sg)
            mk('cl-odepa-trade-%s-%s-usd' % (key, tag), 'trade', '%s: Chile %s, world, value %s (ODEPA/Aduanas)' % (nm, word, 'FOB' if flow == 'exp' else 'CIF'), 'USD million', 'annual', up, sg)
# ---------------- precios al consumidor ----------------
# (clave, etiqueta en ingles, Grupo, producto (texto antes de '|'), unidad exacta)
CONS = (('beef-posta-negra', 'Beef, posta negra, retail price', 'Carne bovina', 'Posta Negra', '$/kilo'), ('beef-lomo-liso', 'Beef, lomo liso, retail price', 'Carne bovina', 'Lomo Liso', '$/kilo'),
        ('beef-asado-tira', 'Beef, short ribs (asado de tira), retail price', 'Carne bovina', 'Asado de tira', '$/kilo'),
        ('pork-pulpa', 'Pork, boneless leg (pulpa s/hueso), retail price', 'Carne de Cerdo - Ave - Cordero', 'Cerdo Pulpa s/hueso', '$/kilo'),
        ('pork-chuleta', 'Pork, loin chop (chuleta centro), retail price', 'Carne de Cerdo - Ave - Cordero', 'Chuleta (centro)', '$/kilo'),
        ('lamb', 'Lamb (cordero), retail price', 'Carne de Cerdo - Ave - Cordero', 'Cordero', '$/kilo'), ('chicken', 'Chicken, whole (pollo entero), retail price', 'Carne de Cerdo - Ave - Cordero', 'Pollo Entero', '$/kilo'),
        ('eggs', 'Eggs, white large first grade, 12-egg tray, retail price', 'Lácteos - Huevos - Margarinas', 'Huevo blanco grande (primera)', '$/bandeja 12 unidades'),
        ('milk', 'Milk, whole fluid, 1 litre carton, retail price', 'Lácteos - Huevos - Margarinas', 'Leche Fluida Entera', '$/Caja de 1 Litro'),
        ('butter', 'Butter, salted, 250 g block, retail price', 'Lácteos - Huevos - Margarinas', 'Mantequilla con sal', '$/pan de 250 gramos'),
        ('cheese-gauda', 'Cheese, gauda, retail price', 'Lácteos - Huevos - Margarinas', 'Queso Gauda', '$/envase 1 kilo'), ('cheese-chanco', 'Cheese, chanco, retail price', 'Lácteos - Huevos - Margarinas', 'Queso Chanco', '$/envase 1 kilo'),
        ('rice', 'Rice, wide grain grade 1, retail price', 'Abarrotes y otros', 'Arroz grano ancho grado 1', '$/kilo'), ('sugar', 'Sugar, retail price', 'Abarrotes y otros', 'Azúcar', '$/kilo'),
        ('olive-oil', 'Olive oil, retail price', 'Abarrotes y otros', 'Aceite de oliva', '$/litro'), ('flour', 'Flour without raising agent (baking), retail price', 'Abarrotes y otros', 'Harina sin polvos de hornear', '$/kilo'),
        ('bread', 'Bread, marraqueta, retail price', 'Pan', 'Marraqueta', '$/kilo'), ('potato', 'Potatoes, retail price (all varieties and grades)', 'Hortalizas', 'Papa', '$/kilo'),
        ('tomato', 'Tomatoes, retail price', 'Hortalizas', 'Tomate', '$/kilo'), ('apple', 'Apples, retail price (all varieties and grades)', 'Frutas', 'Manzana', '$/kilo'),
        ('lemon', 'Lemons, retail price', 'Frutas', 'Limón', '$/kilo'))
def monthly_means(acc):
    return [[k, round(s / n, 2)] for k, (s, n) in sorted(acc.items())]
def consumer():
    res = {y: u for y, nm, u in resources('precios-consumidor')}; want = {(c[2], c[3], c[4]): c[0] for c in CONS}
    acc = defaultdict(lambda: defaultdict(lambda: [0.0, 0]))
    for y in sorted(res):
        if y < NOW.year - 8: continue
        try:
            for r in rows(res[y]):
                k = want.get((r['Grupo'], r['Producto'].split('|')[0].strip(), r['Unidad']))
                if not k: continue
                v = num(r['Precio promedio'])
                if v is None: continue
                a = acc[k]['%04d-%02d' % (int(r['Anio']), int(r['Mes']))]; a[0] += v; a[1] += 1
            log('consumidor', y, 'ok')
        except Exception as e: log('ERROR consumidor', y, repr(e)[:160])
    for key, nm, g, p, u in CONS:
        mk('cl-odepa-consumer-' + key, 'prices', '%s (ODEPA, mean of monitored points)' % nm, 'CLP/' + u[2:], 'monthly', [tuple(x) for x in monthly_means(acc[key])], 'ODEPA precios al consumidor',
           note='Media simple mensual de las observaciones semanales de precio medio de todos los puntos de monitoreo (%s); unidad del fichero: %s.' % (g, u))
# ---------------- precios mayoristas de frutas y hortalizas ----------------
WH = (('potato', 'Potatoes, wholesale price, 25 kg sack', 'Papa', '$/saco 25 kilos'), ('tomato', 'Tomatoes, wholesale price, 18 kg tray', 'Tomate', '$/bandeja 18 kilos'),
      ('onion', 'Onions, wholesale price, 18 kg net bag', 'Cebolla', '$/malla 18 kilos'), ('carrot', 'Carrots, wholesale price, 20 kg sack', 'Zanahoria', '$/saco 20 kilos'),
      ('apple', 'Apples, wholesale price, 15 kg bulk tray', 'Manzana', '$/bandeja 15 kilos granel'), ('lemon', 'Lemons, wholesale price, 18 kg net bag', 'Limón', '$/malla 18 kilos'),
      ('lettuce', 'Lettuce, wholesale price, box of 15 units', 'Lechuga', '$/caja 15 unidades'))
def wholesale():
    res = {y: u for y, nm, u in resources('precios-mayoristas-de-frutas-y-hortalizas')}; want = {(w[2], w[3]): w[0] for w in WH}
    acc = defaultdict(lambda: defaultdict(lambda: [0.0, 0]))
    for y in sorted(res):
        if y < NOW.year - 10: continue
        try:
            for r in rows(res[y]):
                k = want.get((r['Producto'], r['Unidad de comercializacion']))
                if not k: continue
                v = num(r['Precio promedio'])
                if v is None: continue
                a = acc[k][r['Fecha'][:7]]; a[0] += v; a[1] += 1
            log('mayorista', y, 'ok')
        except Exception as e: log('ERROR mayorista', y, repr(e)[:160])
    for key, nm, p, u in WH:
        mk('cl-odepa-wholesale-' + key, 'prices_fv', '%s (ODEPA, mean of wholesale markets)' % nm, 'CLP/' + u[2:], 'monthly', [tuple(x) for x in monthly_means(acc[key])], 'ODEPA precios mayoristas',
           note='Media simple mensual del precio medio diario de todos los mercados mayoristas, variedades y calidades del producto en la unidad indicada.')
def main():
    for fn in (trade, consumer, wholesale):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:200])
    log('series', len(OUT))
    if len(OUT) < 40:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/chile-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'ODEPA (Oficina de Estudios y Politicas Agrarias), datos abiertos', 'url': 'https://datos.odepa.gob.cl/', 'license': 'Creative Commons Attribution (CC BY)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'CL': {'name': 'Chile', 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}}, 'log': LOG[-30:]}
    json.dump(doc, open('data/chile-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/chile-log.txt', 'w').write('\n'.join(LOG) + '\n')
main()

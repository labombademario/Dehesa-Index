#!/usr/bin/env python3
"""data/views/*.json — vistas pequenas para las paginas de entrada. Cada pagina descarga SOLO su vista (KB), nunca el dataset entero.
  home-summary.json cifras, 4 ultimos movimientos y los datos justos de las tarjetas de la Home (cultivos, oferta y demanda, clima, mercados USDA)
  eu-preview.json   tarjetas de la vista previa de la UE de perfiles.html (media UE publicada por la Comision; sin recalcular)
  region-metrics.json  el valor por region con el que se colorea el mapa de regiones de cada ficha de pais (js/region-metrics.js): asi el mapa no baja el fichero regional entero (hasta ~350 KB)
Se regenera junto con el catalogo (update-pipeline-status.yml) y es estricto: si una fuente falta, falla en lugar de publicar una vista incompleta."""
import datetime, json, re, sys
import sys as _s
from pathlib import Path as _P
_s.path.insert(0, str(_P(__file__).resolve().parent))
from lib_markets import market
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'; V = D / 'views'
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def write(name, doc, volatile=('generatedAt',)):
    """Solo reescribe si cambia algo distinto de la hora de generacion."""
    p = V / name; p.parent.mkdir(parents=True, exist_ok=True)
    new = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(p.read_text())
        a = {k: v for k, v in old.items() if k not in volatile}; b = {k: v for k, v in doc.items() if k not in volatile}
        if a == b: print(name, 'sin cambios'); return
    except Exception: pass
    p.write_text(new); print(name, len(new), 'bytes')
# (familia, serie, pais, clave de etiqueta en js/perfiles.js)
EUP = [('cerdo', 'e', 'EU', 'cerdo'), ('vacuno', 'young-bulls-ao2', 'EU', 'vacuno'), ('cereales', ('milling-wheat-deliver-to-first-customer-silo-or-processing-plant-on-tr', 'breadmaking-common-wheat-national-average-not-specified'), 'EU', 'trigo'),
       ('cereales', ('feed-barley-deliver-to-first-customer-silo-or-processing-plant-on-truc', 'feed-barley-national-average-not-specified'), 'EU', 'cebada'), ('lacteos', 'butter', 'EU', 'mantequilla'), ('lacteos', 'smp', 'EU', 'leche_polvo'), ('huevos', 'cage', 'EU', 'huevos'),
       ('pollo', 'whole-broiler-65-selling-price', 'EU', 'pollo'), ('ovino', 'heavy-lamb', 'EU', 'cordero'), ('fertilizantes', 'n-nitrogen', 'EU', 'nitrogeno'), ('leche', 'raw-milk', 'DE', 'leche'),
       ('aceite', 'extra-virgin-olive-oil-up-to-0-8', 'ES', 'aceite')]
def eu_preview():
    cards = []; fams = {}
    for fam, sid, cc, k in EUP:
        fd = fams.get(fam) or fams.setdefault(fam, json.loads((D / 'eu' / (fam + '.json')).read_text()))  # estricto: la familia debe existir
        # Cereales: desde agosto de 2026 la Comision publica el agregado UE en la fase «entrega al primer comprador» y deja la «media nacional»;
        # se aceptan varias series candidatas y se usa la que tiene el dato mas reciente (sin mezclar puntos de dos series).
        cand = []
        for one in (sid if isinstance(sid, tuple) else (sid,)):
            se1 = next((s for s in fd['series'] if s['id'] == one), None)
            r1 = next((x for x in se1['regions'] if x['c'] == cc), None) if se1 else None
            if r1: cand.append((r1['last'][0], one, se1, r1))
        if not cand: raise KeyError('eu/%s/%s: region %s no existe' % (fam, sid, cc))
        _, sid, se, r = max(cand, key=lambda z: z[0])
        cards.append({'k': k, 'family': fam, 'series': sid, 'c': cc, 'unit': se['unit'], 'freq': se.get('freq'), 'last': r['last'], 'prev': r.get('prev'), 'yoy': r.get('yoy')})
    return {'schemaVersion': 1, 'generatedAt': now(), 'cards': cards}
HOME_CROPS = ['corn', 'soybeans', 'wheat_spring', 'cotton']   # js/cultivos.js (teaser)
HOME_PSD = ['trigo', 'maiz', 'soja', 'azucar']                 # js/oferta-demanda.js (teaser)
def load(rel): return json.loads((D / rel).read_text())      # estricto: si falta una fuente, falla
def home_summary():
    latest = load('latest.json')['observations']; cat = load('catalog.json')
    try: plabels = json.loads((D / 'observatory.json').read_text()).get('labels', {})   # nombres de producto en es/en/fr/it (los de js/data.js)
    except Exception: plabels = {}
    slim = lambda o: dict({k: v for k, v in o.items() if k != 'history'}, **({'market': market(o)} if market(o) else {}), **({'name': plabels[o['product']]} if o.get('product') in plabels else {}))
    # Panel de la portada POR MERCADO (antes: las 4 observaciones mas recientes de cualquier pais, y salian 4 precios de Alberta a todo el mundo).
    # Por cada mercado, los productos de referencia en este orden si tienen dato verificado de los ultimos 6 meses; si faltan, los mas recientes.
    PRI = ['trigo', 'trigo_cwrs_ab', 'maiz', 'leche', 'vaca', 'novillo_ab', 'cerdo', 'cerdo_ab', 'cebada', 'canola_elevador', 'colza', 'soja_grano', 'huevos', 'pollo',
           'defra_wheat_output_index', 'defra_milk_output_index', 'defra_cattle_output_index', 'defra_pigs_output_index', 'defra_barley_output_index']
    lim = (datetime.date.today() - datetime.timedelta(days=183)).isoformat()
    by_region = {}
    for reg in ('us', 'eu', 'uk', 'ca'):
        rs = [o for o in latest if o.get('region') == reg and o.get('status') == 'verified']
        fresh = {o['product']: o for o in rs if str(o.get('observationDate')) >= lim[:len(str(o.get('observationDate')))]}
        GRP = {'trigo_cwrs_ab': 'trigo', 'novillo_ab': 'vaca', 'cerdo_ab': 'cerdo', 'canola_elevador': 'colza'}   # un solo producto de cada familia
        pick, seen = [], set()
        for p in PRI:
            if p in fresh and GRP.get(p, p) not in seen and len(pick) < 4: pick.append(fresh[p]); seen.add(GRP.get(p, p))
        if len(pick) < 4: pick += [o for o in sorted(rs, key=lambda o: str(o.get('observationDate')), reverse=True) if o not in pick][:4 - len(pick)]
        by_region[reg] = [slim(o) for o in pick]
    movers = by_region['eu']
    cp = load('crop-progress.json')
    crops = []
    for c in cp['crops']:
        if c['id'] in HOME_CROPS: crops.append({'id': c['id'], 'seasons': {s: {'condition': v['condition']} for s, v in c['seasons'].items() if v.get('condition')}})
    sd = load('supply-demand.json'); comm = []
    for c in sd['commodities']:
        if c['id'] not in HOME_PSD: continue
        my = c['latestMarketYear']; w = {str(y): {a: c['world'][str(y)][a] for a in ('production', 'endingStocks', 'consumption') if a in c['world'].get(str(y), {})} for y in (my, my - 1) if str(y) in c['world']}
        comm.append({'id': c['id'], 'unit': c.get('unit'), 'latestMarketYear': my, 'world': w})
    cl = load('climate.json')
    locs = [{'id': l['id'], 'name': l['name'], 'months': l['months'][-1:]} for l in cl['locations'] if l.get('months')]
    ams = load('ams/index.json')
    return {'schemaVersion': 1, 'generatedAt': now(),
            'stats': {'observations': len(latest), 'products': len(cat['products']), 'sources': len(cat['sources']), 'catalogObservations': cat.get('observationCount')},
            'movers': movers, 'moversBy': by_region, 'cropProgress': {'lastWeekEnding': cp.get('lastWeekEnding'), 'crops': crops},
            'supplyDemand': {'commodities': comm}, 'climate': {'lastPeriod': cl['lastPeriod'], 'locations': locs},
            'markets': {'total': len(ams['reports']), 'families': {f: sum(1 for r in ams['reports'] if r['fam'] == f) for f in sorted({r['fam'] for r in ams['reports']})}}}
def trade_products():
    """data/views/trade-products/<CC>.json: el bloque de socios comerciales de un perfil de pais solo baja su propio pais (mismo esquema que el fichero completo, un solo reporter)."""
    for src in ('eu-trade-products.json', 'au-trade-products.json', 'us-trade-products.json', 'uk-trade-products.json', 'cl-trade-products.json', 'ca-trade-products.json'):
        try: d = load(src)
        except Exception: continue
        for cc, rep in (d.get('reporters') or {}).items():
            write('trade-products/%s.json' % cc, dict({k: v for k, v in d.items() if k != 'reporters'}, reporters={cc: rep}))

def diesel_eu_more():
    """data/views/diesel-eu/<CC>.json: gasoleo semanal de un pais (Boletin Petrolero de la UE); la ficha solo baja su pais."""
    try: d = load('diesel-eu-more.json')
    except Exception: return
    for cc, rows in (d.get('countries') or {}).items():
        write('diesel-eu/%s.json' % cc, {'schemaVersion': 1, 'generatedAt': d.get('generatedAt'), 'cc': cc, 'unit': d.get('unit'), 'fields': d.get('fields'), 'source': d.get('source'), 'note': d.get('note'), 'weekly': rows})

FARM_HEAD = {
    'IE': ('ie-cso-stats.json', ['ie-cso-ara02-median-price-p-all-land-types-ireland', 'ie-cso-ara02-number-of-tran-all-land-types-ireland', 'ie-cso-aka01-intake-of-cows-milk-by-m-domestic', 'ie-cso-aka01-fat-content-domestic', 'ie-cso-aka01-protein-content-domestic',
           'ie-cso-ahm05-agricultural-output-price-index', 'ie-cso-ahm05-agricultural-input-price-index', 'ie-cso-ahm05-milk', 'ie-cso-ahm05-fertilisers', 'ie-cso-eiia17-total-sales', 'ie-cso-eiia17-potassium']),
    'HU': ('hu-ksh-stats.json', ['hu-ksh-0009-arable-land-agricultural-land-pr', 'hu-ksh-0009-arable-land-annual-rental-prices', 'hu-ksh-0009-grassland-agricultural-land-pr', 'hu-ksh-0015-wheat', 'hu-ksh-0018-wheat', 'hu-ksh-0015-maize', 'hu-ksh-0018-maize',
           'hu-ksh-0034-cow-s-milk-production', 'hu-ksh-0027-cattle', 'hu-ksh-0027-pigs', 'hu-ksh-0001-share-of-agriculture-forestry-and-fishin']),
}
def farm_headlines():
    """data/views/farm-headlines/<CC>.json: las series de las cifras clave de Irlanda (CSO) y Hungria (KSH) (js/farm-headlines.js); la ficha no baja el fichero entero."""
    for cc, (fn, ids) in FARM_HEAD.items():
        try: d = load(fn)
        except Exception: continue
        c = (d.get('countries') or {}).get(cc) or {}; by = {s['id']: s for s in c.get('series', [])}
        keep = [dict((k, s[k]) for k in ('id', 'label', 'unit', 'frequency', 'latestPeriod', 'latest', 'changePct', 'points', 'periodNote') if k in s) for i in ids for s in [by.get(i)] if s]
        if len(keep) < 6: print('farm-headlines', cc, 'faltan series (%d de %d): no se escribe' % (len(keep), len(ids))); continue
        write('farm-headlines/%s.json' % cc, {'schemaVersion': 1, 'generatedAt': d.get('generatedAt'), 'cc': cc, 'source': c.get('source'), 'series': keep})

def _last(a):
    for p in reversed(a or []):
        if p and p[1] is not None: return p
    return None
def _at(a, y):
    for p in a or []:
        if str(p[0]) == str(y) and p[1] is not None: return p[1]
    return None
def region_metrics():
    """Mismo calculo que compute() de js/region-metrics.js (el JS lo sigue haciendo si esta vista falta). Valores tal cual de la fuente; perha = produccion / SAU (calculo, como en el JS)."""
    import re
    C = {}
    names = (ROOT / 'js' / 'region-names.js').read_text()
    def ids(cc):
        m = re.search(r"var " + cc + r" = \{(.*?)\};", names, re.S); return set(re.findall(r"(\w+): '", m.group(1))) if m else set()
    def put(cc, mid, vals, period, src):
        ok = ids(cc); vals = {k: x for k, x in vals.items() if k in ok and isinstance(x, (int, float))}   # fuera totales nacionales (p. ej. «CA») y claves sin contorno
        if vals: C.setdefault(cc, {})[mid] = {'period': str(period or ''), 'source': src, 'vals': {k: (round(x, 4) if isinstance(x, float) else x) for k, x in sorted(vals.items())}}
    d = load('drought.json'); v = {}; per = ''
    for k, r in (d.get('states') or {}).items():
        if r: v[k] = r[-1][2]; per = max(per, str(r[-1][0]))
    put('US', 'drought', v, per, 'drought.json')
    m = re.search(r"var US = \{(.*?)\};", names, re.S)
    en = {b: a for a, b in re.findall(r"(\w+): '([^|']+)\|", m.group(1))} if m else {}
    d = load('cattle-on-feed.json'); r = (d.get('reports') or [None])[-1]; v = {}
    if r:
        for st in r.get('states') or []:
            if st.get('state') in en and st.get('current') is not None: v[en[st['state']]] = st['current']
        put('US', 'cattle', v, r.get('inventoryDate'), 'cattle-on-feed.json')
    d = load('other-tax.json'); S = (d.get('us') or {}).get('states') or {}
    put('US', 'tax', {k: (0 if x.get('noStateSalesTax') else x.get('rate')) for k, x in S.items() if x.get('noStateSalesTax') or x.get('rate') is not None}, d.get('reviewedAt', ''), 'other-tax.json')
    # EE. UU. por estado (data/us-states, scripts/update-us-states.py): valor de la tierra de cultivo, leche y ventas del Censo 2022
    import glob as _g
    vl, vm, vs = {}, {}, {}; pl = pm = ''
    for f in sorted(_g.glob(str(D / 'us-states' / '[A-Z][A-Z].json'))):
        try: u = json.loads(Path(f).read_text())
        except Exception: continue
        st = u.get('state'); S = u.get('series') or {}
        if st == 'US': continue
        p = (S.get('lv_crop') or {}).get('points'); p = p[-1] if p else None
        if p: vl[st] = p[1]; pl = max(pl, str(p[0]))
        p = (S.get('mk_prod') or {}).get('points'); p = p[-1] if p else None
        if p: vm[st] = (str(p[0]), p[1] / 1e6); pm = max(pm, str(p[0]))
        c = (u.get('census2022') or {}).get('ce_sales')
        if c: vs[st] = c / 1e6
    vm = {k: x[1] for k, x in vm.items() if x[0] == pm}   # solo los estados con dato del ultimo mes (los demas publican por trimestre)
    put('US', 'landval', vl, pl, 'us-states/*.json'); put('US', 'milk', vm, pm, 'us-states/*.json'); put('US', 'sales', vs, '2022', 'us-states/*.json')
    d = load('canada-drought.json'); v = {}; n = len(d.get('periods') or [])
    for k, x in (d.get('provinces') or {}).items():
        row = (x.get('v') or [])[n - 1] if n and len(x.get('v') or []) >= n else None
        if row: v[k] = row[1]
    put('CA', 'drought', v, d.get('asOf'), 'canada-drought.json')
    d = load('canada-provinces.json'); v = {}; per = ''
    for k, x in (d.get('provinces') or {}).items():
        o = (x.get('receipts') or {}).get('total-farm-cash-receipts'); p = _last(o and o.get('pts'))
        if p: v[k] = p[1]; per = max(per, str(p[0]))
    put('CA', 'receipts', v, per, 'canada-provinces.json')
    d = load('au-states.json')
    for mid in ('agrifood', 'beef', 'wheat', 'wine'):
        v = {}; per = ''
        for k, x in (d.get('states') or {}).items():
            p = _last(x.get(mid))
            if p: v[k] = p[1]; per = max(per, str(p[0]))
        put('AU', mid, v, per, 'au-states.json')
    d = load('ar-provinces.json')
    if d and d.get('provinces'):
        c = d['lastCampaign']
        for crop in ('soja', 'maiz', 'trigo'):
            put('AR', crop, {k: v[crop][c][2] / 1000 for k, v in d['provinces'].items() if v.get(crop, {}).get(c) and v[crop][c][2] > 0}, c, 'ar-provinces.json')
    for cc in ('ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'BE', 'DK', 'PL', 'PT', 'CH', 'IE', 'EL', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'HU', 'RO', 'SE', 'SI', 'UK'):
        f = 'eu-regions-%s.json' % cc.lower(); d = load(f); vo = {}; vu = {}; vp = {}; po = pu = pp = ''
        for k, b in (d.get('regions') or {}).items():
            o = (b.get('eaa') or {}).get('AM180000'); ua = ((b.get('crops') or {}).get('UAA') or {}).get('area')
            p = _last(o)
            if p and p[1] <= 0: p = None   # Bruselas-Capital: Eurostat da 0,0 en todas las partidas de 2023 aunque hay explotaciones; un 0 de produccion no es un dato, el mapa la deja sin dato
            if p: vo[k] = p[1]; po = max(po, str(p[0]))
            q = _last(ua)
            if q: vu[k] = q[1]; pu = max(pu, str(q[0]))
            if p:
                u2 = _at(ua, p[0])
                if u2: vp[k] = p[1] / u2 * 1000; pp = max(pp, str(p[0]))
        vm = {}; pm = ''
        for k, b in (d.get('regions') or {}).items():
            mg = b.get('managers') or {}; ys = sorted(mg)
            if ys and mg[ys[-1]].get('TOTAL') and mg[ys[-1]].get('Y_GE65') is not None: vm[k] = mg[ys[-1]]['Y_GE65'] / mg[ys[-1]]['TOTAL'] * 100; pm = max(pm, ys[-1])
        # rama agricola (produccion vegetal, AM100000) y rama ganadera (animales AM110000 + productos animales AM120000 del mismo ano = produccion animal de Eurostat)
        vc = {}; va = {}; pc = pa = ''
        for k, b in (d.get('regions') or {}).items():
            e = b.get('eaa') or {}; c1 = _last(e.get('AM100000'))
            if c1 and c1[1] > 0: vc[k] = c1[1]; pc = max(pc, str(c1[0]))
            a1 = _last(e.get('AM110000')); a2 = a1 and _at(e.get('AM120000'), a1[0])
            if a1 and a2 is not None and a1[1] + a2 > 0: va[k] = a1[1] + a2; pa = max(pa, str(a1[0]))
        put(cc, 'output', vo, po, f); put(cc, 'uaa', vu, pu, f); put(cc, 'perha', vp, pp, f); put(cc, 'mgr65', vm, pm, f); put(cc, 'crop', vc, pc, f); put(cc, 'animal', va, pa, f)
    # Uruguay (data/uruguay-departments.json, scripts/update-uruguay.py): mismo calculo que la rama UY de compute() en js/region-metrics.js
    d = load('uruguay-departments.json')
    if d:
        for mid, sp in (('cattle', 'cattle'), ('sheep', 'sheep'), ('dairy', 'dairy-cattle')):
            tab = (d.get('livestock') or {}).get(sp) or {}; ys = sorted(tab)
            if ys: put('UY', mid, {k: x / 1000 for k, x in tab[ys[-1]].items()}, ys[-1], 'uruguay-departments.json')
        for mid, key in (('landsale', 'sale'), ('landrent', 'rent')):
            tab = (d.get('land') or {}).get(key) or {}; ys = sorted(tab)
            if ys: put('UY', mid, {k: x['usdHa'] for k, x in tab[ys[-1]].items() if isinstance(x, dict) and x.get('usdHa') is not None}, ys[-1], 'uruguay-departments.json')
        fo = d.get('forest') or {}
        if fo.get('byDept'): put('UY', 'forest', {k: x['total'] / 1000 for k, x in fo['byDept'].items() if x.get('total') is not None}, fo.get('year'), 'uruguay-departments.json')
    return {'schemaVersion': 1, 'generatedAt': now(), 'note': 'Valor por region para colorear los mapas de las fichas de pais; derivado de los ficheros de data/ indicados en source.', 'countries': C}
# Lonjas (mercados) de cereales por pais del Agri-food Data Portal (precio salida de silo, EUR/t): para elegir otra lonja en la tarjeta de Precios.
# Solo mercados con dato en las ultimas 10 semanas respecto al ultimo dato del producto (los parados no se ofrecen). Ultimos 26 puntos semanales para el minigrafico.
# Mercados de cereales de cada país (Comisión Europea, Agri-food Data Portal). Desde 2026/27 la Comisión ya no publica la media
# nacional: solo mercados concretos, cada uno en su fase comercial. Se guardan todos (13-oct-2026, decisión de Mario), con su nombre,
# su variedad y su fase; nunca se mezclan ni se promedian. España conserva su lonja por defecto (salida de silo).
LONJA_PROD = {'trigo': {'Milling wheat': 'pan', 'Feed wheat': 'pienso'}, 'maiz': {'Feed maize': 'pienso'}, 'cebada': {'Feed barley': 'pienso', 'Malting barley': 'malta'},
              'avena': {'Feed oats': 'pienso', 'Milling oats': 'moli'}, 'centeno': {'Milling rye': 'pan', 'Feed rye': 'pienso'}, 'trigo_duro': {'Durum wheat': ''}}
LONJA_STAGE = [('Departure from silo', 'silo'), ('Deliver to first customer', 'first'), ('Departure from farm', 'farm'), ('Price at farm gate', 'gate'),
               ('Delivered to port', 'port'), ('Shipped to the place', 'unl'), ('Free On Board', 'fob'), ('Cost, Insurance and Freight', 'cif'), ('Rendu Port', 'rport')]
LONJA_NAME = {'Lerida': 'Lleida', 'Leon': 'León', 'Cordoba': 'Córdoba', 'Cadiz': 'Cádiz', 'Avila': 'Ávila', 'Caceres': 'Cáceres', 'Jaen': 'Jaén', 'Malaga': 'Málaga', 'Almeria': 'Almería', 'Kobenhavn': 'København'}
LONJA_T = {'var': {'pan': ['panificable', 'milling', 'meunier', 'panificabile'], 'pienso': ['pienso', 'feed', 'fourrager', 'foraggero'], 'malta': ['cervecera', 'malting', 'brassicole', 'da malto'], 'moli': ['molinera', 'milling', 'meunière', 'da molitura'], '': ['', '', '', '']},
           'st': {'silo': ['salida de silo', 'ex-silo', 'départ silo', 'franco silo'], 'first': ['entregado al primer comprador', 'delivered to first buyer', 'livré au premier acheteur', 'consegnato al primo acquirente'],
                  'farm': ['salida de explotación', 'ex-farm', 'départ exploitation', 'franco azienda'], 'gate': ['precio en explotación', 'farm-gate price', 'prix à la ferme', 'prezzo in azienda'],
                  'port': ['entregado en puerto', 'delivered to port', 'rendu port', 'reso al porto'], 'unl': ['descargado en puerto', 'unloaded at port', 'déchargé au port', 'scaricato in porto'],
                  'fob': ['FOB', 'FOB', 'FOB', 'FOB'], 'cif': ['CIF', 'CIF', 'CIF', 'CIF'], 'rport': ['rendu puerto', 'delivered port', 'rendu port', 'reso porto']}}
def lonjas():
    E = datetime.date(2000, 1, 1); out = {}
    fam = load('eu/cereales.json')
    for s in fam.get('series', []):
        parts = s.get('parts') or []
        if len(parts) < 2: continue
        prod = next((k for k, m in LONJA_PROD.items() if parts[0] in m), None)
        st = next((code for pre, code in LONJA_STAGE if parts[1].startswith(pre)), None)
        if not prod or not st: continue
        var = LONJA_PROD[prod][parts[0]]
        if not any(r.get('m') for r in s.get('regions', [])): continue
        try: j = load('eu/cereales/' + s['id'] + '.json')
        except Exception: continue
        for r in j.get('regions', []):
            m = r.get('m') or ''
            if not m or re.search(r'national|average', m, re.I) or not r.get('d'): continue
            pts = [[(E + datetime.timedelta(days=d)).isoformat(), v] for d, v in zip(r['d'], r['v']) if v is not None][-26:]
            if len(pts) < 2: continue
            out.setdefault(r['c'], {}).setdefault(prod, []).append({'m': LONJA_NAME.get(m, m), 'src': m, 'var': var, 'st': st, 'p': pts})
    # un mercado que no publica desde hace más de 70 días (respecto al dato más reciente de toda la UE) no entra: no es un precio actual
    gtop = max((x['p'][-1][0] for v in out.values() for L in v.values() for x in L), default='2000-01-01')
    for cc in list(out):
        for prod in list(out[cc]):
            L = out[cc][prod]
            cut = (datetime.date.fromisoformat(gtop) - datetime.timedelta(days=70)).isoformat()
            seen, keep = set(), []
            for x in sorted(L, key=lambda x: (x['m'], x['var'], x['st'], x['p'][-1][0]), reverse=False):
                if x['p'][-1][0] < cut: continue   # mercado que dejó de publicar
                k = (x['m'], x['var'], x['st'])
                if k in seen: keep = [y for y in keep if (y['m'], y['var'], y['st']) != k]   # misma lonja con dos grafías: la más reciente
                seen.add(k); keep.append(x)
            if keep: out[cc][prod] = sorted(keep, key=lambda x: (x['m'], x['var'], x['st']))
            else: del out[cc][prod]
        if not out[cc]: del out[cc]
    # Polonia: GUS (BDL) no esta en el Agri-food Data Portal. Precios mensuales en PLN/t convertidos a EUR con la media MENSUAL del BCE del mismo mes
    # (data/fx-history.json); si el BCE aun no trae el zloty o falta el mes, ese punto no se publica (nada se estima). 'o' = moneda original, 'f' = periodicidad mensual.
    try:
        fx = {m: v for m, v in (load('fx-history.json').get('currencies', {}).get('PLN') or [])}
        gus = {s['id']: s for s in load('poland-stats.json')['countries']['PL']['series']}
    except Exception: fx, gus = {}, {}
    PLG = [('trigo', 'wheat'), ('cebada', 'barley'), ('avena', 'oats'), ('centeno', 'rye')]
    PLM = [('gus_buy', 'pl-gus-procm-cereal-grain-excluding-sowing-seed-%s', {'avena': 'oat'}), ('gus_mkt', 'pl-gus-mkt-cereal-grain-%s', {})]
    for prod, en in PLG + [('maiz', 'corn')]:
        for stc, pat, alt in PLM:
            sr = gus.get(pat % alt.get(prod, en))
            if not sr: continue
            raw = [(m, v) for m, v in sr.get('points', []) if v is not None and m in fx][-26:]
            pts = [[m + '-15', round(v / fx[m], 1)] for m, v in raw]
            if len(pts) < 2: continue
            out.setdefault('PL', {}).setdefault(prod, []).append({'m': 'GUS', 'src': 'GUS', 'var': '', 'st': stc, 'p': pts, 'po': [[m + '-15', v] for m, v in raw], 'o': 'PLN', 'f': 'm'})
    LONJA_T['st']['gus_buy'] = ['precio de compra (skup)', 'procurement price (skup)', 'prix d’achat (skup)', 'prezzo di acquisto (skup)']
    LONJA_T['st']['gus_mkt'] = ['precio en mercados locales', 'local-market price', 'prix sur les marchés locaux', 'prezzo nei mercati locali']
    return {'schemaVersion': 2, 'generatedAt': now(), 'unit': 'EUR/t', 'labels': LONJA_T,
            'source': {'name': 'Comisión Europea, Agri-food Data Portal', 'url': 'https://agridata.ec.europa.eu/', 'license': 'Commission Decision 2011/833/EU'}, 'countries': out}

# EE. UU.: frutas, hortalizas y frutos secos (precio recibido por el agricultor, USDA NASS Quick Stats). Valor publicado tal cual en su unidad; nada se convierte ni se estima.
# (clave, grupo, nombres es/en/fr/it, emoji, fuente: ('R', serie de nass-received.json) o ('X', id de us-nass-extra-stats.json))
FVUS = [
 ('apple', 'fruit', ['Manzana (mercado en fresco)', 'Apples (fresh market)', 'Pommes (marché du frais)', 'Mele (mercato fresco)'], '🍎', ('R', 'APPLES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / LB')),
 ('orange', 'fruit', ['Naranja (en el árbol)', 'Oranges (on tree)', 'Oranges (sur l’arbre)', 'Arance (sull’albero)'], '🍊', ('X', 'us-nass-x-oranges-on-tree-equiv-price-received-monthly-usd-box')),
 ('lemon', 'fruit', ['Limón (en el árbol)', 'Lemons (on tree)', 'Citrons (sur l’arbre)', 'Limoni (sull’albero)'], '🍋', ('X', 'us-nass-x-lemons-on-tree-equiv-price-received-monthly-usd-box')),
 ('grapefruit', 'fruit', ['Pomelo (en el árbol)', 'Grapefruit (on tree)', 'Pamplemousses (sur l’arbre)', 'Pompelmi (sull’albero)'], '', ('X', 'us-nass-x-grapefruit-on-tree-equiv-price-received-monthly-usd-box')),
 ('grape', 'fruit', ['Uva de mesa (mercado en fresco)', 'Grapes (fresh market)', 'Raisin de table (marché du frais)', 'Uva da tavola (mercato fresco)'], '🍇', ('R', 'GRAPES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / TON')),
 ('peach', 'fruit', ['Melocotón', 'Peaches', 'Pêches', 'Pesche'], '🍑', ('X', 'us-nass-x-peaches-price-received-usd-short-ton')),
 ('strawberry', 'fruit', ['Fresa', 'Strawberries', 'Fraises', 'Fragole'], '🍓', ('X', 'us-nass-x-strawberries-price-received-usd-cwt')),
 ('blueberry', 'fruit', ['Arándano cultivado', 'Blueberries (cultivated)', 'Myrtilles (cultivées)', 'Mirtilli (coltivati)'], '🫐', ('X', 'us-nass-x-blueberries-tame-price-received-usd-lb')),
 ('cranberry', 'fruit', ['Arándano rojo', 'Cranberries', 'Canneberges', 'Mirtilli rossi'], '', ('X', 'us-nass-x-cranberries-price-received-usd-barrel')),
 ('potato', 'veg', ['Patata (mercado en fresco)', 'Potatoes (fresh market)', 'Pommes de terre (marché du frais)', 'Patate (mercato fresco)'], '🥔', ('R', 'POTATOES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT')),
 ('tomato', 'veg', ['Tomate (mercado en fresco)', 'Tomatoes (fresh market)', 'Tomates (marché du frais)', 'Pomodori (mercato fresco)'], '🍅', ('X', 'us-nass-x-tomatoes-fresh-market-price-received-usd-cwt')),
 ('onion', 'veg', ['Cebolla seca', 'Onions (dry)', 'Oignons secs', 'Cipolle secche'], '🧅', ('X', 'us-nass-x-onions-dry-price-received-usd-cwt')),
 ('lettuce_head', 'veg', ['Lechuga iceberg', 'Lettuce (head)', 'Laitue pommée', 'Lattuga a cappuccio'], '🥬', ('X', 'us-nass-x-lettuce-head-price-received-usd-cwt')),
 ('lettuce_romaine', 'veg', ['Lechuga romana', 'Lettuce (romaine)', 'Laitue romaine', 'Lattuga romana'], '🥬', ('X', 'us-nass-x-lettuce-romaine-price-received-usd-cwt')),
 ('lettuce_leaf', 'veg', ['Lechuga de hoja', 'Lettuce (leaf)', 'Laitue feuille', 'Lattuga a foglia'], '🥬', ('X', 'us-nass-x-lettuce-leaf-price-received-usd-cwt')),
 ('mushroom', 'veg', ['Champiñón', 'Mushrooms (agaricus)', 'Champignons de Paris', 'Champignon'], '🍄', ('X', 'us-nass-x-mushrooms-agaricus-price-received-usd-lb')),
 ('almond', 'nut', ['Almendra', 'Almonds', 'Amandes', 'Mandorle'], '', ('X', 'us-nass-x-almonds-price-received-usd-lb')),
 ('walnut', 'nut', ['Nuez', 'Walnuts (English)', 'Noix', 'Noci'], '', ('X', 'us-nass-x-walnuts-english-price-received-usd-short-ton')),
 ('pecan', 'nut', ['Nuez pecana', 'Pecans', 'Noix de pécan', 'Noci pecan'], '', ('X', 'us-nass-x-pecans-price-received-usd-lb')),
 ('pistachio', 'nut', ['Pistacho', 'Pistachios', 'Pistaches', 'Pistacchi'], '', ('X', 'us-nass-x-pistachios-price-received-usd-lb')),
]
FVUS_UNIT = {'LB': 'lb', 'CWT': 'cwt', 'TON': 'short ton', 'BOX': 'box', 'BARREL': 'barrel'}
def fv_us():
    rec = load('nass-received.json')['series']
    ex = {x['id']: x for x in load('us-nass-extra-stats.json')['countries']['US']['series']}
    out = []
    for key, grp, names, emo, (kind, sid) in FVUS:
        if kind == 'R':
            sr = rec.get(sid)
            if not sr: continue
            pts = [[str(a), b] for a, b in sr['n'] if b is not None]; unit = sr['u'].replace('$ / ', '').strip()
        else:
            sr = ex.get(sid)
            if not sr: continue
            pts = [[str(a), b] for a, b in sr['points'] if b is not None]; unit = sid.rsplit('-usd-', 1)[1].replace('-', ' ')
        if len(pts) < 2: continue
        u = FVUS_UNIT.get(unit.upper().replace(' ', ''), None) or FVUS_UNIT.get(unit.upper()) or unit.lower()
        if unit.lower() == 'short ton' or unit.upper() == 'TON': u = 'short ton'
        monthly = len(pts[-1][0]) == 7; last = pts[-1]
        prev = pts[-2]
        yago = None
        if monthly:
            y, m = last[0].split('-'); t = '%d-%s' % (int(y) - 1, m); yago = next((q for q in pts if q[0] == t), None)
            if pts[-2][0] != '%s-%02d' % (y, int(m) - 1) and not (m == '01' and pts[-2][0] == '%d-12' % (int(y) - 1)): prev = None   # mes anterior sin dato (serie con huecos): no se sustituye por otro mes
        out.append({'id': key, 'g': grp, 'n': names, 'e': emo, 'u': u, 'm': 1 if monthly else 0, 'd': last[0], 'v': last[1], 'p': prev[1] if prev else None, 'pd': prev[0] if prev else None, 'y': yago[1] if yago else None,
                    'h': [q[1] for q in pts[-24:]] if monthly else [q[1] for q in pts[-10:]]})
    return {'schemaVersion': 1, 'generatedAt': now(), 'source': {'name': 'USDA NASS, Quick Stats (price received by farmers, national)', 'url': 'https://quickstats.nass.usda.gov/', 'license': 'Public domain (U.S. government work)'}, 'items': out}

# Reino Unido: precios mayoristas de fruta, hortaliza y flor de produccion local en Inglaterra y Gales (Defra), de data/uk-fv-stats.json; semanal, en la unidad publicada.
FVUK_ITEM = {
 'apples': ('fruit', ['Manzana', 'Apples', 'Pommes', 'Mele'], '🍎'), 'blackberries': ('fruit', ['Mora', 'Blackberries', 'Mûres', 'More'], ''), 'blueberries': ('fruit', ['Arándano', 'Blueberries', 'Myrtilles', 'Mirtilli'], '🫐'),
 'cherries': ('fruit', ['Cereza', 'Cherries', 'Cerises', 'Ciliegie'], '🍒'), 'currants': ('fruit', ['Grosella', 'Currants', 'Groseilles', 'Ribes'], ''), 'gooseberries': ('fruit', ['Grosella espinosa', 'Gooseberries', 'Groseilles à maquereau', 'Uva spina'], ''),
 'pears': ('fruit', ['Pera', 'Pears', 'Poires', 'Pere'], '🍐'), 'plums': ('fruit', ['Ciruela', 'Plums', 'Prunes', 'Susine'], ''), 'raspberries': ('fruit', ['Frambuesa', 'Raspberries', 'Framboises', 'Lamponi'], ''),
 'strawberries': ('fruit', ['Fresa', 'Strawberries', 'Fraises', 'Fragole'], '🍓'), 'asparagus': ('veg', ['Espárrago', 'Asparagus', 'Asperges', 'Asparagi'], ''), 'beans': ('veg', ['Judía', 'Beans', 'Haricots', 'Fagioli'], '🫛'),
 'beetroot': ('veg', ['Remolacha de mesa', 'Beetroot', 'Betterave rouge', 'Barbabietola rossa'], ''), 'brussels-sprouts': ('veg', ['Col de Bruselas', 'Brussels sprouts', 'Choux de Bruxelles', 'Cavoletti di Bruxelles'], ''),
 'cabbage': ('veg', ['Col', 'Cabbage', 'Chou', 'Cavolo'], '🥬'), 'calabrese': ('veg', ['Brócoli', 'Broccoli (calabrese)', 'Brocoli', 'Broccoli'], '🥦'), 'capsicum': ('veg', ['Pimiento', 'Peppers', 'Poivrons', 'Peperoni'], '🫑'),
 'carrots': ('veg', ['Zanahoria', 'Carrots', 'Carottes', 'Carote'], '🥕'), 'cauliflower': ('veg', ['Coliflor', 'Cauliflower', 'Chou-fleur', 'Cavolfiore'], ''), 'celeriac': ('veg', ['Apionabo', 'Celeriac', 'Céleri-rave', 'Sedano rapa'], ''),
 'celery': ('veg', ['Apio', 'Celery', 'Céleri', 'Sedano'], ''), 'chinese-leaf': ('veg', ['Col china', 'Chinese leaf', 'Chou chinois', 'Cavolo cinese'], ''), 'coriander': ('veg', ['Cilantro', 'Coriander', 'Coriandre', 'Coriandolo'], ''),
 'courgettes': ('veg', ['Calabacín', 'Courgettes', 'Courgettes', 'Zucchine'], ''), 'cucumbers': ('veg', ['Pepino', 'Cucumbers', 'Concombres', 'Cetrioli'], '🥒'), 'curly-kale': ('veg', ['Col rizada (kale)', 'Curly kale', 'Chou frisé', 'Cavolo riccio'], ''),
 'leeks': ('veg', ['Puerro', 'Leeks', 'Poireaux', 'Porri'], ''), 'lettuce': ('veg', ['Lechuga', 'Lettuce', 'Laitue', 'Lattuga'], '🥬'), 'mixed-babyleaf-salad': ('veg', ['Brotes tiernos de ensalada', 'Mixed baby-leaf salad', 'Jeunes pousses', 'Insalata baby leaf'], ''),
 'onion': ('veg', ['Cebolla', 'Onions', 'Oignons', 'Cipolle'], '🧅'), 'pak-choi': ('veg', ['Pak choi', 'Pak choi', 'Pak-choï', 'Pak choi'], ''), 'parsnips': ('veg', ['Chirivía', 'Parsnips', 'Panais', 'Pastinaca'], ''),
 'peas': ('veg', ['Guisante', 'Peas', 'Petits pois', 'Piselli'], ''), 'rhubarb': ('veg', ['Ruibarbo', 'Rhubarb', 'Rhubarbe', 'Rabarbaro'], ''), 'rocket': ('veg', ['Rúcula', 'Rocket', 'Roquette', 'Rucola'], ''),
 'spinach-leaf': ('veg', ['Espinaca', 'Spinach', 'Épinards', 'Spinaci'], ''), 'spring-greens': ('veg', ['Col tierna (spring greens)', 'Spring greens', 'Jeunes choux', 'Cavolo primaverile'], ''), 'swede': ('veg', ['Colinabo', 'Swede', 'Rutabaga', 'Rutabaga'], ''),
 'sweetcorn': ('veg', ['Maíz dulce', 'Sweetcorn', 'Maïs doux', 'Mais dolce'], '🌽'), 'tomatoes': ('veg', ['Tomate', 'Tomatoes', 'Tomates', 'Pomodori'], '🍅'), 'turnip': ('veg', ['Nabo', 'Turnip', 'Navet', 'Rapa'], ''),
 'gladioli': ('flower', ['Gladiolo', 'Gladioli', 'Glaïeuls', 'Gladioli'], ''), 'tulips': ('flower', ['Tulipán', 'Tulips', 'Tulipes', 'Tulipani'], '🌷'), 'daffodils': ('flower', ['Narciso', 'Daffodils', 'Jonquilles', 'Narcisi'], ''),
 'chrysanthemums': ('flower', ['Crisantemo', 'Chrysanthemums', 'Chrysanthèmes', 'Crisantemi'], ''), 'lilies': ('flower', ['Lirio', 'Lilies', 'Lys', 'Gigli'], ''), 'stocks': ('flower', ['Alhelí', 'Stocks', 'Giroflées', 'Violacciocche'], ''),
 'sweet-williams': ('flower', ['Clavel del poeta', 'Sweet williams', 'Œillets de poète', 'Garofani dei poeti'], ''), 'pinks': ('flower', ['Clavellina', 'Pinks', 'Œillets mignardise', 'Garofanini'], ''),
}
FVUK_VAR = {'all': None, 'all varieties': None, 'red': ['roja', 'red', 'rouge', 'rosso'], 'white': ['blanca', 'white', 'blanc', 'bianco'], 'black': ['negra', 'black', 'noire', 'nero'], 'green': ['verde', 'green', 'vert', 'verde'],
 'savoy': ['de Milán', 'Savoy', 'de Milan', 'verza'], 'broad': ['haba', 'broad', 'fèves', 'fave'], 'dwarf french or kidney': ['verde (enana)', 'French (dwarf)', 'verts (nains)', 'fagiolini (nani)'], 'runner climbing': ['de enrame', 'runner', 'à rames', 'rampicanti'],
 'round green other': ['repollo verde', 'round green', 'pommé vert', 'cappuccio verde'], 'summer autumn pointed': ['puntiaguda', 'pointed (summer/autumn)', 'pointu', 'a punta'], 'elongated': ['alargado', 'elongated', 'allongé', 'allungato'],
 'yelloworange': ['amarillo o naranja', 'yellow or orange', 'jaune ou orange', 'giallo o arancione'], 'topped washed': ['lavada sin hojas', 'topped and washed', 'lavées équeutées', 'lavate senza foglie'], 'all washed': ['lavado', 'washed', 'lavé', 'lavato'],
 'trimmed': ['limpio', 'trimmed', 'paré', 'mondato'], 'butterhead indoor': ['mantecosa de invernadero', 'butterhead (indoor)', 'beurre (sous serre)', 'cappuccio (serra)'], 'cos': ['romana', 'cos', 'romaine', 'romana'],
 'crisp iceberg type': ['iceberg', 'iceberg', 'iceberg', 'iceberg'], 'little gem': ['cogollo (little gem)', 'little gem', 'little gem', 'little gem'], 'pillow pack': ['en bolsa', 'pillow pack', 'en sachet', 'in busta'],
 'bulb brown': ['seca, marrón', 'brown bulb', 'jaune', 'dorata'], 'bulb red': ['seca, roja', 'red bulb', 'rouge', 'rossa'], 'saladspring': ['tierna (cebolleta)', 'spring/salad', 'nouvelle', 'cipollotto'],
 'shelling all varieties': ['para desgranar', 'for shelling', 'à écosser', 'da sgranare'], 'forced': ['forzado', 'forced', 'forcée', 'forzato'], 'outdoor': ['al aire libre', 'outdoor', 'plein champ', 'pieno campo'],
 'loose bunches': ['en manojo', 'loose bunches', 'en bottes', 'a mazzi'], 'prepacked': ['envasada', 'prepacked', 'préemballés', 'confezionato'], 'cherry': ['cherry', 'cherry', 'cerise', 'ciliegino'], 'plum': ['pera', 'plum', 'allongée', 'perino'],
 'round': ['redondo', 'round', 'ronde', 'tondo'], 'vine': ['en rama', 'on the vine', 'en grappe', 'a grappolo'], 'conference': ['Conference', 'Conference', 'Conférence', 'Conference'], 'doyenne du comice': ['Doyenné du Comice', 'Doyenné du Comice', 'Doyenné du Comice', 'Doyenné du Comice'],
 'other': ['otras', 'other', 'autres', 'altre'], 'all other': ['otras', 'other', 'autres', 'altre'], 'victoria': ['Victoria', 'Victoria', 'Victoria', 'Victoria'], 'other early season': ['otras tempranas', 'other early', 'autres précoces', 'altre precoci'],
 'other mid season': ['otras de media estación', 'other mid-season', 'autres de mi-saison', 'altre di media stagione'], 'other late season': ['otras tardías', 'other late', 'autres tardives', 'altre tardive'], 'bramleys seedling': ['Bramley (de cocinar)', 'Bramley (cooking)', 'Bramley (à cuire)', 'Bramley (da cucina)'],
 'coxs orange group': ['Cox', 'Cox’s Orange group', 'Cox', 'Cox'], 'egremont russet': ['Egremont Russet', 'Egremont Russet', 'Egremont Russet', 'Egremont Russet'], 'braeburn': ['Braeburn', 'Braeburn', 'Braeburn', 'Braeburn'], 'gala': ['Gala', 'Gala', 'Gala', 'Gala']}
FVUK_UNIT = {'GBP/kg': 'kg', 'GBP/head': 'head', 'GBP/stem': 'stem', 'GBP/twin pack': 'twin pack', 'GBP/bunch': 'bunch', 'GBP/each': 'each'}
def fv_uk():
    try: S = load('uk-fv-stats.json')['countries']['UK']['series']
    except Exception: return None
    from datetime import date as _d, timedelta as _td
    out, miss = [], []
    for s in S:
        m = re.match(r'^(.+?), (.+?): wholesale', s['label'])
        if not m: continue
        it, var = m.group(1), m.group(2).strip().lower()
        k = re.sub(r'[^a-z0-9]+', '-', it.lower()).strip('-'); base = FVUK_ITEM.get(k)
        if not base: miss.append(k); continue
        grp, names, emo = base
        if var == it.lower() or var in ('all', 'all varieties'): q = None
        else: q = FVUK_VAR.get(var); q = q if q is not None else [var] * 4
        n = [names[i] + (' · ' + q[i] if q else '') for i in range(4)]
        pts = [p for p in s['points'] if p[1] is not None]
        if len(pts) < 2: continue
        last = pts[-1]; ld = _d.fromisoformat(last[0])
        prev = pts[-2] if (ld - _d.fromisoformat(pts[-2][0])).days <= 21 else None   # Defra publica cada dos semanas; un hueco mayor no se compara
        ya = None
        for p in reversed(pts):
            dd = abs((_d.fromisoformat(p[0]) - (ld - _td(days=364))).days)
            if dd <= 4: ya = p; break
        out.append({'id': s['id'], 'g': grp, 'n': n, 'e': emo, 'u': FVUK_UNIT.get(s['unit'], s['unit'].replace('GBP/', '')), 'd': last[0], 'v': last[1], 'p': prev[1] if prev else None, 'pd': prev[0] if prev else None, 'y': ya[1] if ya else None, 'h': [p[1] for p in pts[-26:]]})
    if miss: print('fv-uk: productos sin traducir', sorted(set(miss)))
    return {'schemaVersion': 1, 'generatedAt': now(), 'source': {'name': 'Defra, Wholesale fruit and vegetable prices (England and Wales)', 'url': 'https://www.gov.uk/government/statistics/wholesale-fruit-and-vegetable-prices', 'license': 'Open Government Licence v3.0'}, 'items': out}

# EE. UU.: precios mayoristas de frutas y hortalizas en los mercados terminales del USDA AMS (Market News). Se lee lo ya descargado en data/ams/<id>.json (scripts/update-ams.mjs);
# un fichero por ciudad con el ultimo dia publicado. Valor publicado tal cual por envase; el $/lb solo se calcula si el envase dice un peso en libras ("50 lb cartons").
WH_CITIES = [('NY', 'New York', (2314, 2315, 2316)), ('CH', 'Chicago', (2290, 2291, 2292)), ('LA', 'Los Angeles', (2306, 2307, 2308)), ('AT', 'Atlanta', (2277, 2278, 2279)),
             ('BO', 'Boston', (2285, 2286, 2287)), ('PH', 'Philadelphia', (2318, 2319, 2320)), ('MI', 'Miami', (2310, 2311, 2312)), ('DT', 'Detroit', (2302, 2303, 2304)), ('BA', 'Baltimore', (2281, 2282, 2283))]
def fv_us_wholesale():
    idx = []
    for code, name, ids in WH_CITIES:
        rows = []; latest = ''
        for i in ids:
            d = load('ams/%d.json' % i); cat = {0: 'fruit', 1: 'veg', 2: 'veg'}[ids.index(i)]
            if d.get('lastDate', '') > latest: latest = d['lastDate']
            for x in d.get('series', []):
                pts = [q for q in x['p'] if q and (q[2] is not None or q[3] is not None)]
                if not pts: continue
                v = dict(zip(d.get('dn') or [], x['v']))
                if 'per package' not in x.get('u', '') and 'package' not in x.get('u', ''): continue
                rows.append((cat, v, pts))
        best = {}
        for cat, v, pts in rows:
            if pts[-1][0] < (datetime.date.fromisoformat(latest) - datetime.timedelta(days=3)).isoformat(): continue   # linea sin cotizar estos dias
            k = (cat, v.get('commodity', ''), v.get('variety', ''))
            sc = (pts[-1][0], len(pts))
            if k not in best or sc > best[k][0]: best[k] = (sc, v, pts)
        out = []
        for (cat, com, var), (sc, v, pts) in sorted(best.items()):
            lo, hi = pts[-1][2], pts[-1][3]
            pv = pts[-2] if len(pts) > 1 else None
            pk = v.get('package') or ''; m = re.match(r'^(\d+(?:\.\d+)?)\s*lb\b', pk)
            lb = float(m.group(1)) if m else None
            out.append([cat, com, var if var != 'N/A' else '', v.get('origin') or '', pk, ' · '.join(z for z in (v.get('grade'), v.get('condition'), v.get('item_size')) if z and z != 'N/A'), lo, hi, pv[2] if pv else None, pv[3] if pv else None, pts[-1][0], lb])
        write('fv-us-wh-%s.json' % code, {'schemaVersion': 1, 'generatedAt': now(), 'code': code, 'city': name, 'date': latest, 'cols': ['cat', 'commodity', 'variety', 'origin', 'package', 'grade', 'low', 'high', 'prevLow', 'prevHigh', 'date', 'lb'],
              'source': {'name': 'USDA AMS, Market News (terminal markets)', 'url': 'https://www.ams.usda.gov/market-news', 'license': 'Public domain (U.S. government work)'}, 'rows': out})
        idx.append({'code': code, 'city': name, 'date': latest, 'n': len(out)})
    return {'schemaVersion': 1, 'generatedAt': now(), 'cities': idx}
def price_revisions():
    """data/views/price-revisions.json: solo las revisiones de precios del panel (series 'P/<id>') de los ultimos 90 dias. La ficha de producto
    las enseña; antes descargaba data/revisions.json entero (315 KB, 1.500 revisiones de estadisticas de todos los paises)."""
    rv = json.loads((D / 'revisions.json').read_text()).get('revisions', [])
    cut = (datetime.datetime.utcnow() - datetime.timedelta(days=90)).strftime('%Y-%m-%dT%H:%M:%SZ')
    keep = [r for r in rv if str(r.get('series', '')).startswith('P/') and str(r.get('detectedAt', '')) >= cut]
    return {'schemaVersion': 1, 'generatedAt': now(), 'windowDays': 90, 'source': 'data/revisions.json', 'revisions': keep}
def _pts(s): return [[str(p), v] for p, v in (s or {}).get('points', []) if v is not None]
def fish():
    """data/views/fish/index.json (tabla de paises) y data/views/fish/<CC>.json (series y especies) para pesca.html y la ficha de pais (js/fish.js).
    Solo cifras publicadas por Eurostat y NOAA; las especies principales las elige el cargador por la ultima cifra publicada. Nada se calcula aqui
    salvo el reparto de la flota por edad (buques de 25 anos o mas / total de buques del mismo ano), que la pagina rotula como calculo."""
    import re
    rows = []
    try: rt = load('eu-fish-retail-prices.json')   # precio minorista online (EUMOFA, scripts/update-eu-fish-retail-prices.py)
    except Exception: rt = {}
    try: hp = load('eu-fish-hicp.json')   # IPCA del pescado (Eurostat, scripts/update-eu-fish-hicp.py)
    except Exception: hp = {}
    try: wk = load('eu-fish-first-sales.json')   # precio semanal en primera venta por especie (EUMOFA, scripts/update-eu-fish-first-sales.py)
    except Exception: wk = {}
    try: eu = load('eurostat-fish-stats.json')
    except Exception: eu = {'countries': {}}
    for cc, c in sorted((eu.get('countries') or {}).items()):
        by = {x['id'][len(cc) + 6:]: x for x in c.get('series', [])}   # '<cc>-fish-' fuera
        g = lambda k: _pts(by.get(k))
        sp = []
        for k, x in by.items():
            m = re.match(r'ld-sp-([a-z0-9_]+)-eur$', k)
            if not m: continue
            code = m.group(1); nm = re.match(r'^Fish landings: (.*), value \(Eurostat\)$', x['label'])
            sp.append({'code': code, 'name': nm.group(1) if nm else code, 'value': g('ld-sp-%s-eur' % code), 'qty': g('ld-sp-%s-tpw' % code), 'price': g('ld-sp-%s-eur_t' % code)})
        sp.sort(key=lambda o: -(_last(o['value']) or [0, 0])[1])
        cs = []
        for k, x in by.items():
            m = re.match(r'ca-sp-([a-z0-9_]+)$', k); nm = re.match(r'^Fish catches: (.*) \(tonnes live weight, Eurostat\)$', x['label'])
            if m: cs.append({'code': m.group(1), 'name': nm.group(1) if nm else m.group(1), 'qty': g(k)})
        cs.sort(key=lambda o: -(_last(o['qty']) or [0, 0])[1])
        aq = []
        for k, x in by.items():
            m = re.match(r'aq-sp-([a-z0-9_]+)-tlw$', k); nm = re.match(r'^Aquaculture production: (.*), quantity \(Eurostat\)$', x['label'])
            if m: aq.append({'code': m.group(1), 'name': nm.group(1) if nm else m.group(1), 'qty': g(k), 'price': g('aq-sp-%s-eur_t' % m.group(1))})
        aq.sort(key=lambda o: -(_last(o['qty']) or [0, 0])[1])
        areas = []
        for k, x in by.items():
            m = re.match(r'ca-area-(\d+)$', k); nm = re.match(r'^Fish catches: (.*) \(tonnes live weight, Eurostat\)$', x['label'])
            if m: areas.append({'code': m.group(1), 'name': nm.group(1) if nm else m.group(1), 'qty': g(k)})
        areas.sort(key=lambda o: -(_last(o['qty']) or [0, 0])[1])
        S = {k: g(k) for k in ('ca-total', 'ld-total-eur', 'ld-total-tpw', 'ld-total-eur_t', 'aq-total-tlw', 'aq-total-eur', 'aq-total-eur_t', 'fleet-nr', 'fleet-gt', 'fleet-kw', 'fleet-age-y_ge25')}
        S = {k: v for k, v in S.items() if v}
        if not S: continue
        fa = {k: g('fleet-age-' + k) for k in ('y_lt5', 'y5-9', 'y10-14', 'y15-19', 'y20-24', 'y_ge25') if g('fleet-age-' + k)}
        fs = (wk.get('countries') or {}).get(cc)
        fsv = {'lastWeek': fs['lastWeek'], 'generatedAt': wk.get('generatedAt'), 'minKg': wk.get('minKg'), 'species': [{'name': x['name'], 'group': x['group'], 'points': x['points']} for x in fs['species']]} if fs else None
        fm = None if fs else ((wk.get('monthly') or {}).get('countries') or {}).get(cc)   # mensual solo donde no hay semanal
        fmv = {'lastMonth': fm['lastMonth'], 'generatedAt': wk.get('generatedAt'), 'minKg': wk['monthly'].get('minKg'), 'species': [{'name': x['name'], 'group': x['group'], 'points': x['points']} for x in fm['species']]} if fm else None
        extra = {'firstSales': fsv} if fsv else ({'firstSalesM': fmv} if fmv else {})
        fx = ((wk.get('monthly') or {}).get('countries') or {}).get(cc); hc = (hp.get('countries') or {}).get(cc)   # primera venta mensual por especie frente al IPCA del pescado
        if fx and hc and fx.get('species'): extra['cross'] = {'latestMonth': fx['lastMonth'], 'hicpLatest': hp.get('latestMonth'), 'hicp': hc, 'species': [{'name': x['name'], 'group': x['group'], 'points': x['points']} for x in fx['species']]}
        rs = (rt.get('countries') or {}).get(cc)
        if rs: extra['retail'] = {'latestMonth': rt.get('latestMonth'), 'minDays': rt.get('minDays'), 'series': rs}
        write('fish/%s.json' % cc, dict({'schemaVersion': 1, 'generatedAt': eu.get('generatedAt'), 'cc': cc, 'src': 'eurostat', 'series': S, 'landings': sp, 'catches': cs, 'aquaculture': aq, 'areas': areas, 'fleetAge': fa}, **extra))
        L = lambda k: _last(S.get(k))
        old = None; nr = L('fleet-nr'); o25 = L('fleet-age-y_ge25')
        if nr and o25 and nr[0] == o25[0] and nr[1]: old = [nr[0], round(o25[1] / nr[1] * 100, 1)]
        rows.append({'cc': cc, 'src': 'eurostat', 'catches': L('ca-total'), 'landValue': L('ld-total-eur'), 'landQty': L('ld-total-tpw'), 'landPrice': L('ld-total-eur_t'),
                     'aqQty': L('aq-total-tlw'), 'aqValue': L('aq-total-eur'), 'fleet': nr, 'fleetOld': old})
    try:
        us = load('us-noaa-fish-stats.json'); c = (us.get('countries') or {}).get('US') or {}
        by = {x['id']: x for x in c.get('series', [])}
        sp = []
        for k, x in by.items():
            m = re.match(r'us-noaa-fish-sp-(.+)-usd$', k); nm = re.match(r'^Commercial fish landings: (.*), value \(USD, NOAA Fisheries\)$', x['label'])
            if m: sp.append({'code': m.group(1), 'name': nm.group(1) if nm else m.group(1), 'value': _pts(x), 'qty': _pts(by.get('us-noaa-fish-sp-%s-lb' % m.group(1)))})
        sp.sort(key=lambda o: -(_last(o['value']) or [0, 0])[1])
        st = []
        for k, x in by.items():
            m = re.match(r'us-noaa-fish-st-(.+)-usd$', k); nm = re.match(r'^Commercial fish landings in (.*): value \(USD, NOAA Fisheries\)$', x['label'])
            if m: st.append({'code': m.group(1), 'name': nm.group(1) if nm else m.group(1), 'value': _pts(x), 'qty': _pts(by.get('us-noaa-fish-st-%s-lb' % m.group(1)))})
        st.sort(key=lambda o: -(_last(o['value']) or [0, 0])[1])
        S = {k: _pts(by.get(i)) for k, i in (('ld-total-usd', 'us-noaa-fish-landings-value'), ('ld-total-lb', 'us-noaa-fish-landings-lb'))}
        S = {k: v for k, v in S.items() if v}
        if S:
            write('fish/US.json', {'schemaVersion': 1, 'generatedAt': us.get('generatedAt'), 'cc': 'US', 'src': 'noaa_fisheries', 'series': S, 'landings': sp, 'states': st})
            rows.append({'cc': 'US', 'src': 'noaa_fisheries', 'landValueUsd': _last(S.get('ld-total-usd')), 'landLb': _last(S.get('ld-total-lb'))})
    except Exception as e: print('fish US', e)
    if rows: write('fish/index.json', {'schemaVersion': 1, 'generatedAt': max([eu.get('generatedAt') or '']), 'countries': rows})

def forest():
    """data/views/forest/index.json (comparativa de paises) y data/views/forest/<CC>.json para bosque.html, por pais como pesca:
    incendios anuales y de la temporada (EFFIS/GWIS), cortas (Eurostat for_remov), superficie forestal (Eurostat for_area), precio oficial de la madera
    por surtido (SI, CZ, LV, FI, PL, SE, DE, UK, US), indice de precios industriales de la madera (Eurostat sts_inpp_m C16/C161), danos (CZ, SE, EE, HU),
    energia de la madera (US, FI, HU) y, en Espana y Portugal, corcho; en Espana tambien pinon y castana (data/dehesa.json). Nada se estima aqui:
    las cuentas son copias o divisiones (cortas por hectarea, variaciones), y la vista dice de donde sale cada cifra."""
    ff = load('forest-fires.json')
    try: fs = load('forest-fires-season.json')
    except Exception: fs = {'countries': {}}
    rm = load('wood-removals.json'); tp = load('forest-timber-prices.json'); ew = load('eu-wood-prices.json')
    fd = load('forest-damage.json'); we = load('wood-energy.json'); de = load('wood-prices-de.json'); na = load('wood-prices-na.json'); uk = load('uk-timber-prices.json')
    try: dh = load('dehesa.json')
    except Exception: dh = {}
    try: em = load('eurostat-more-stats.json')['countries']
    except Exception: em = {}
    def pts(periods, values): return [[str(p), v] for p, v in zip(periods, values) if v is not None]
    def lastp(a): return a[-1] if a else None
    def yoy(a, back):
        if len(a) <= back: return None
        x, y = a[-1], a[-1 - back]
        return round((x[1] / y[1] - 1) * 100, 2) if y[1] else None
    BACK = {'A': 1, 'M': 12, 'Q': 4, 'H': 2, 'W': 52}
    QK = lambda p: re.sub(r'^(\d{4})K([1-4])$', r'\1-Q\2', p)
    out = {}
    def C(cc): return out.setdefault(cc, {'schemaVersion': 1, 'generatedAt': now(), 'cc': cc})
    # incendios
    ys = ff['years']
    for cc, c in ff['countries'].items():
        v = C(cc); rows = [[y, b, n] for y, b, n in zip(ys, c['ba'], c['nf']) if b is not None]
        v['fires'] = {'system': c['system'], 'asOf': ff['asOf'], 'currentYear': ff['currentYear'], 'years': rows, 'src': ff['source']}
        s = (fs.get('countries') or {}).get(cc)
        if s: v['fires']['season'] = {'year': fs['year'], 'fromYear': s['fromYear'], 'weeks': s['weeks'], 'sumOf': s.get('sumOf')}
    # cortas
    RK = {'total': 'TOTAL.RW', 'conif': 'CONIF.RW', 'nonconif': 'NCONIF.RW', 'fuel': 'TOTAL.RW_FW', 'industrial': 'TOTAL.RW_IN', 'saw': 'TOTAL.RW_IN_LG', 'pulp': 'TOTAL.RW_IN_PW', 'other': 'TOTAL.RW_IN_O'}
    for cc, c in rm['countries'].items():
        ser = {k: [[y, x] for y, x in zip(rm['years'], c['series'].get(code) or []) if x is not None] for k, code in RK.items()}
        ser = {k: a for k, a in ser.items() if a}
        if ser.get('total'): C(cc)['removals'] = {'unit': 'thousand m3 under bark', 'series': ser, 'estimated': c.get('estimated') or [], 'src': rm['source']}
    # superficie forestal (miles de ha)
    for cc, c in em.items():
        for s in c.get('series', []):
            if s['id'] == cc.lower() + '-mo-area-for-thsha' and s.get('points'):
                C(cc)['area'] = {'unit': 'thousand ha', 'points': [[int(p), v] for p, v in s['points'] if v is not None], 'src': {'name': 'Eurostat, for_area', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/for_area/default/table', 'license': 'Eurostat copyright notice'}}
    # precio oficial de la madera
    for cc, c in tp['countries'].items():
        C(cc)['prices'] = {'freq': c['freq'], 'unit': c['unit'], 'currency': c['currency'], 'vat': c.get('vat'), 'priceType': c.get('priceType'), 'note': c.get('note'), 'src': c['source'],
                           'series': [dict({'id': s['id'], 'label': s['label'], 'group': s.get('group'), 'bench': bool(s.get('bench')), 'pts': pts(c['periods'], s['values'])}, **({'region': s['region']} if s.get('region') else {})) for s in c['series']]}
    se = (ew.get('national') or {}).get('SE')
    if se: C('SE')['prices'] = {'freq': 'Q', 'unit': se['series'][0]['unit'], 'currency': 'SEK', 'vat': 'excl', 'priceType': 'delivery', 'note': None, 'preliminary': [QK(p) for p in se.get('preliminary') or []],
                                'src': {'name': se['name'], 'url': se['url'], 'license': se['license']},
                                'series': [{'id': s['id'], 'label': s['name'], 'group': 'sawlog' if 'sawlog' in s['id'] else 'pulpwood', 'bench': s['id'] == 'se-roundwood-sawlogs-pine-and-spruce', 'pts': [[QK(p), v] for p, v in s['pts'] if v is not None]} for s in se['series']]}
    DEL = {'total': 'Roundwood from state forests, total', 'logs': 'Sawlogs', 'pulp': 'Pulpwood', 'fuel': 'Fuelwood', 'spruce': 'Spruce sawlogs', 'pine': 'Pine sawlogs', 'beech': 'Beech sawlogs', 'oak': 'Oak sawlogs'}
    C('DE')['prices'] = {'freq': 'M', 'unit': 'index ' + de['base'], 'currency': None, 'vat': 'excl', 'priceType': 'index', 'note': None, 'src': de['source'],
                         'series': [{'id': 'de-wood-' + k, 'label': DEL.get(k, k), 'group': k, 'bench': k == 'total', 'pts': pts(de['months'], v)} for k, v in de['series'].items()]}
    C('UK')['prices'] = {'freq': 'H', 'unit': uk['series'][0]['unit'], 'currency': 'GBP', 'vat': 'n/d', 'priceType': 'twelve-month average', 'note': uk.get('note'), 'src': uk['source'],
                         'series': [{'id': s['id'], 'label': s['label'], 'group': s['id'], 'bench': s['id'] == 'uk-sawlog-softwood', 'pts': pts(s['periods'], s['values'])} for s in uk['series']]}
    us = na['countries']['US']; UL = {'lumber': 'Lumber', 'softwood': 'Softwood lumber', 'hardwood': 'Hardwood lumber', 'plywood': 'Plywood', 'logs': 'Logs, bolts, timber, pulpwood and wood chips'}
    C('US')['prices'] = {'freq': 'M', 'unit': 'index ' + us['source'].get('base', ''), 'currency': None, 'vat': 'n/d', 'priceType': 'index', 'note': None, 'src': us['source'],
                         'series': [{'id': 'us-ppi-' + k, 'label': UL.get(k, k), 'group': k, 'bench': k == 'logs', 'pts': pts(us['months'], v)} for k, v in us['series'].items()]}
    # indice de precios industriales de la madera
    pp = ew['ppi']
    for cc, c in pp['countries'].items():
        C(cc)['ppi'] = {'unit': pp['unit'], 'products': pp['products'], 'C16': c.get('C16') or [], 'C161': c.get('C161') or [], 'src': pp['source']}
    # danos y energia
    for s in fd['series']:
        C(s['country']).setdefault('damage', []).append({'id': s['id'], 'group': s['group'], 'label': s['label'], 'freq': s['freq'], 'unit': s['unit'], 'region': s.get('region'), 'note': s.get('note'), 'src': s['source'], 'pts': pts(s['periods'], s['values'])})
    for s in we['series']:
        cc = s['id'][:2].upper()
        C(cc).setdefault('energy', []).append({'id': s['id'], 'group': s['group'], 'label': s['label'], 'freq': s['freq'], 'unit': s['unit'], 'currency': s.get('currency'), 'vat': s.get('vat'), 'note': s.get('note'), 'src': s['source'], 'pts': pts(s['periods'], s['values'])})
    # corcho, pinon y castana
    ck = dh.get('cork') or {}
    for cc, c in (ck.get('countries') or {}).items():
        C(cc)['cork'] = {'unit': ck.get('unit'), 'exports': c.get('exports') or [], 'imports': c.get('imports') or [], 'src': ck.get('source')}
    if 'ES' in out and dh.get('forest'):
        f = dh['forest']; out['ES']['nonWood'] = {k: f[k] for k in ('pineNut', 'chestnut') if f.get(k)}
        if (ck.get('production') or {}).get('years'): out['ES'].setdefault('cork', {})['production'] = ck['production']
    # resumen por pais para la comparativa y el selector
    rows = []
    for cc, v in sorted(out.items()):
        r = {'cc': cc}
        f = v.get('fires')
        if f:
            cy = [x for x in f['years'] if x[0] == f['currentYear']]
            full = [x for x in f['years'] if x[0] < f['currentYear']]
            if cy: r['fireYtd'] = [cy[0][0], cy[0][1], cy[0][2]]
            if full: r['fireLast'] = [full[-1][0], full[-1][1]]
            w = [x for x in (f.get('season') or {}).get('weeks', []) if x[2] is not None]
            if w: r['fireVsAvg'] = [w[-1][1], w[-1][2], w[-1][3]]
        m = (v.get('removals') or {}).get('series', {}).get('total')
        if m:
            r['removals'] = m[-1] + ([True] if m[-1][0] in v['removals']['estimated'] else [])
            ar = {y: a for y, a in (v.get('area') or {}).get('points', [])}
            a = ar.get(m[-1][0]) or (ar[max(ar)] if ar else None)
            if a: r['removalsPerHa'] = [m[-1][0], round(m[-1][1] / a, 2)]
        p = v.get('prices')
        if p and p['series']:
            b = [s for s in p['series'] if s['bench'] and not s.get('region') and s['pts']] or [s for s in p['series'] if not s.get('region') and s['pts']]
            if b: b = b[0]; r['price'] = {'label': b['label'], 'unit': p['unit'], 'freq': p['freq'], 'period': b['pts'][-1][0], 'value': b['pts'][-1][1], 'yoy': yoy(b['pts'], BACK.get(p['freq'], 1))}
        q = (v.get('ppi') or {}).get('C16')
        if q: r['ppi'] = [q[-1][0], q[-1][1], yoy(q, 12)]
        v['summary'] = r
        if len(r) > 1: rows.append(r)
        write('forest/%s.json' % cc, v)
    write('forest/index.json', {'schemaVersion': 1, 'generatedAt': now(), 'countries': rows})
    print('forest views:', len(rows), 'paises')
def farm_managers():
    """data/views/farm-managers.json: jefes de explotacion por edad (numero de explotaciones), total y mujeres, de los 26 paises de la UE
    (data/eurostat-structure*-stats.json, Eurostat ef_fsi_agesex). Cifras tal cual; los porcentajes los calcula la ficha (js/farm-managers.js) y los rotula como calculo."""
    out = {}
    for fn in ('eurostat-structure-stats.json', 'eurostat-structure2-stats.json'):
        try: d = load(fn)
        except Exception: continue
        for cc, c in (d.get('countries') or {}).items():
            pre = cc.lower() + '-es-st-mgr-'; o = {}
            for x in c.get('series', []):
                if x['id'].startswith(pre): o[x['id'][len(pre):].replace('age-', '', 1)] = [[str(p), v] for p, v in x['points'] if v is not None]
            if o.get('total'): out[cc] = o
    if out: write('farm-managers.json', {'schemaVersion': 1, 'source': 'eurostat', 'dataset': 'ef_fsi_agesex', 'countries': dict(sorted(out.items()))})

def census():
    """data/views/census/<PAIS>.json: censo agrario de Eurostat (data/eurostat-census-stats.json) por pais y por region de la ficha.
    Cada region suma los NUTS 2 que la forman (todo son recuentos o superficies, asi que se pueden sumar); si a algun NUTS le falta un valor, el de la region queda vacio.
    'abv' lista las tablas en las que algun NUTS solo publica las explotaciones por encima del umbral estadistico (Eurostat no da el total): la ficha lo avisa.
    Los precios de insumos de 2025 (apri_aip_*) van aparte en input-prices-2025.json. Cifras tal cual: nada se estima."""
    try: d = load('eurostat-census-stats.json')
    except Exception as e: print('census', e); return
    G = d['geo']; T = d['meta']['tables']; made = 0
    for cc in sorted(k for k in G if len(k) == 2):
        reg = {}
        f = D / ('eu-regions-' + cc.lower() + '.json')
        if f.exists():
            for rk, r in (json.loads(f.read_text()).get('regions') or {}).items(): reg[rk] = sorted(set(r.get('nuts') or []))   # la lista mezcla niveles (DE1, DE11, DE12): no se pueden sumar todos
        nat = {ds: ks for ds, ks in G[cc].items() if not ds.startswith('apri_aip')}
        regions = {}
        for rk, nuts in reg.items():
            o = {}; abv = []
            for ds in nat:
                if ds in ('ef_fsi_nfm', 'ef_fsi_ecsz'): continue
                ks_out = {}
                leaves = [n for n in nuts if not any(m != n and m.startswith(n) for m in nuts)]   # NUTS mas detallados
                roots = [n for n in nuts if not any(m != n and n.startswith(m) for m in nuts)]    # NUTS mas amplios (por si el detalle no se publica)
                used = None
                for k in nat[ds]:
                    for cand in (leaves, roots):
                        cols = [G.get(n, {}).get(ds, {}).get(k) for n in cand]
                        if cand and all(c is not None for c in cols): break
                    else: continue
                    used = cand
                    ks_out[k] = [None if any(c[i] is None for c in cols) else round(sum(c[i] for c in cols), 2) for i in range(len(cols[0]))]
                if ks_out:
                    o[ds] = ks_out
                    if used and any(n in T[ds]['abv'] for n in used): abv.append(ds)
            if o: o['abv'] = abv; regions[rk] = o
        doc = {'schemaVersion': 1, 'generatedAt': d.get('generatedAt'), 'cc': cc, 'source': 'eurostat', 'years': {ds: T[ds]['years'] for ds in nat},
               'abvNat': [ds for ds in nat if cc in T[ds]['abv']], 'nat': nat, 'regions': regions}
        write('census/' + cc + '.json', doc); made += 1
    ap = {}; yrs = set()
    for ds in ('apri_aip_ft', 'apri_aip_fs', 'apri_aip_en'):
        for g, tb in G.items():
            for k, vs in (tb.get(ds) or {}).items():
                code = k.split('|')[0]; y = T[ds]['years']
                for i, v in enumerate(vs):
                    if v is not None: ap.setdefault(g if len(g) == 2 else 'EU', {}).setdefault(code, {})[y[i]] = v; yrs.add(y[i])
    if ap: write('input-prices-2025.json', {'schemaVersion': 1, 'generatedAt': d.get('generatedAt'), 'source': 'eurostat', 'datasets': ['apri_aip_ft', 'apri_aip_fs', 'apri_aip_en'], 'countries': dict(sorted(ap.items()))})
    print('census', made, 'paises')

def forecasts():
    """data/views/forecast/<PAIS>.json: previsiones de produccion de carne de Eurostat (apro_mt_ppighq porcino, apro_mt_pcatlhs vacuno, ovino y caprino) hasta 2027.
    Los periodos aun no terminados van en 'fc' (campo forecast de la serie, data/eurostat-more-stats.json); lo observado reciente, en 'obs'. Cifras tal cual."""
    try: d = load('eurostat-more-stats.json')
    except Exception as e: print('forecast', e); return
    n = 0
    for cc, c in (d.get('countries') or {}).items():
        rows = []
        for x in c.get('series', []):
            if not x.get('forecast'): continue
            rows.append({'id': x['id'], 'label': x['label'], 'unit': x['unit'], 'freq': x['frequency'], 'obs': x['points'][-6:], 'fc': x['forecast']})
        if rows: write('forecast/' + cc + '.json', {'schemaVersion': 1, 'generatedAt': d.get('generatedAt'), 'cc': cc, 'source': 'eurostat', 'series': rows}); n += 1
    print('forecast', n, 'paises')

def main():
    write('price-revisions.json', price_revisions())
    write('home-summary.json', home_summary())
    write('eu-preview.json', eu_preview())
    write('region-metrics.json', region_metrics())
    write('lonjas.json', lonjas())
    write('fv-us.json', fv_us())
    write('fv-us-wh-index.json', fv_us_wholesale())
    fu = fv_uk()
    if fu and fu['items']: write('fv-uk.json', fu)
    trade_products()
    diesel_eu_more()
    farm_headlines()
    fish()
    forest()
    farm_managers()
    census()
    forecasts()
if len(sys.argv) > 1 and sys.argv[1] in ('census', 'forecasts', 'farm_managers', 'fish', 'forest'): globals()[sys.argv[1]]()   # uso: build-views.py census (solo esa vista)
else: main()

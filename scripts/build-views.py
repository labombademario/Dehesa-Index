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
    return {'schemaVersion': 2, 'generatedAt': now(), 'unit': 'EUR/t', 'labels': LONJA_T,
            'source': {'name': 'Comisión Europea, Agri-food Data Portal', 'url': 'https://agridata.ec.europa.eu/', 'license': 'Commission Decision 2011/833/EU'}, 'countries': out}
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
        write('fish/%s.json' % cc, {'schemaVersion': 1, 'generatedAt': eu.get('generatedAt'), 'cc': cc, 'src': 'eurostat', 'series': S, 'landings': sp, 'catches': cs, 'aquaculture': aq, 'areas': areas, 'fleetAge': fa})
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
    trade_products()
    diesel_eu_more()
    farm_headlines()
    fish()
    farm_managers()
    census()
    forecasts()
if len(sys.argv) > 1 and sys.argv[1] in ('census', 'forecasts', 'farm_managers', 'fish'): globals()[sys.argv[1]]()   # uso: build-views.py census (solo esa vista)
else: main()

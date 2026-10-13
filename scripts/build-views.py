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
EUP = [('cerdo', 'e', 'EU', 'cerdo'), ('vacuno', 'young-bulls-ao2', 'EU', 'vacuno'), ('cereales', 'breadmaking-common-wheat-national-average-not-specified', 'EU', 'trigo'),
       ('cereales', 'feed-barley-national-average-not-specified', 'EU', 'cebada'), ('lacteos', 'butter', 'EU', 'mantequilla'), ('lacteos', 'smp', 'EU', 'leche_polvo'), ('huevos', 'cage', 'EU', 'huevos'),
       ('pollo', 'whole-broiler-65-selling-price', 'EU', 'pollo'), ('ovino', 'heavy-lamb', 'EU', 'cordero'), ('fertilizantes', 'n-nitrogen', 'EU', 'nitrogeno'), ('leche', 'raw-milk', 'DE', 'leche'),
       ('aceite', 'extra-virgin-olive-oil-up-to-0-8', 'ES', 'aceite')]
def eu_preview():
    cards = []; fams = {}
    for fam, sid, cc, k in EUP:
        fd = fams.get(fam) or fams.setdefault(fam, json.loads((D / 'eu' / (fam + '.json')).read_text()))  # estricto: la familia debe existir
        se = next((s for s in fd['series'] if s['id'] == sid), None)
        if not se: raise KeyError('eu/%s: serie %s no existe' % (fam, sid))
        r = next((x for x in se['regions'] if x['c'] == cc), None)
        if not r: raise KeyError('eu/%s/%s: region %s no existe' % (fam, sid, cc))
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
    for cc in ('ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'BE', 'DK', 'PL', 'PT', 'CH', 'IE', 'EL', 'FI', 'BG', 'HR', 'LT', 'SK', 'UK'):
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
        put(cc, 'output', vo, po, f); put(cc, 'uaa', vu, pu, f); put(cc, 'perha', vp, pp, f)
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
def main():
    write('home-summary.json', home_summary())
    write('eu-preview.json', eu_preview())
    write('region-metrics.json', region_metrics())
    write('lonjas.json', lonjas())
    trade_products()
main()

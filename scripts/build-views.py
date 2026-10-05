#!/usr/bin/env python3
"""data/views/*.json — vistas pequenas para las paginas de entrada. Cada pagina descarga SOLO su vista (KB), nunca el dataset entero.
  home-summary.json cifras, 4 ultimos movimientos y los datos justos de las tarjetas de la Home (cultivos, oferta y demanda, clima, mercados USDA)
  eu-preview.json   tarjetas de la vista previa de la UE de perfiles.html (media UE publicada por la Comision; sin recalcular)
  region-metrics.json  el valor por region con el que se colorea el mapa de regiones de cada ficha de pais (js/region-metrics.js): asi el mapa no baja el fichero regional entero (hasta ~350 KB)
Se regenera junto con el catalogo (update-pipeline-status.yml) y es estricto: si una fuente falta, falla en lugar de publicar una vista incompleta."""
import datetime, json, sys
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
    rows = sorted(latest, key=lambda o: str(o.get('observationDate')), reverse=True)[:4]
    movers = [{k: v for k, v in o.items() if k != 'history'} for o in rows]
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
            'movers': movers, 'cropProgress': {'lastWeekEnding': cp.get('lastWeekEnding'), 'crops': crops},
            'supplyDemand': {'commodities': comm}, 'climate': {'lastPeriod': cl['lastPeriod'], 'locations': locs},
            'markets': {'total': len(ams['reports']), 'families': {f: sum(1 for r in ams['reports'] if r['fam'] == f) for f in sorted({r['fam'] for r in ams['reports']})}}}
def trade_products():
    """data/views/trade-products/<CC>.json: el bloque de socios comerciales de un perfil de pais solo baja su propio pais (mismo esquema que el fichero completo, un solo reporter)."""
    for src in ('eu-trade-products.json', 'au-trade-products.json'):
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
    for cc in ('ES', 'FR', 'IT', 'DE', 'NL', 'AT'):
        f = 'eu-regions-%s.json' % cc.lower(); d = load(f); vo = {}; vu = {}; vp = {}; po = pu = pp = ''
        for k, b in (d.get('regions') or {}).items():
            o = (b.get('eaa') or {}).get('AM180000'); ua = ((b.get('crops') or {}).get('UAA') or {}).get('area')
            p = _last(o)
            if p: vo[k] = p[1]; po = max(po, str(p[0]))
            q = _last(ua)
            if q: vu[k] = q[1]; pu = max(pu, str(q[0]))
            if p:
                u2 = _at(ua, p[0])
                if u2: vp[k] = p[1] / u2 * 1000; pp = max(pp, str(p[0]))
        put(cc, 'output', vo, po, f); put(cc, 'uaa', vu, pu, f); put(cc, 'perha', vp, pp, f)
    return {'schemaVersion': 1, 'generatedAt': now(), 'note': 'Valor por region para colorear los mapas de las fichas de pais; derivado de los ficheros de data/ indicados en source.', 'countries': C}
def main():
    write('home-summary.json', home_summary())
    write('eu-preview.json', eu_preview())
    write('region-metrics.json', region_metrics())
    trade_products()
main()

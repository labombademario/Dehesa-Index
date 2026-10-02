"""Utilidades comunes de indice de series (watchlist y brief diario). Solo libreria estandar."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STATS = ['country-stats', 'spain-stats', 'france-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'portugal-stats', 'portugal-eurostat-stats',
         'canada-stats', 'eu-trade-stats', 'australia-trade-stats', 'interest-rates-stats']
def git_show(rev, path):
    try:
        return subprocess.run(['git', 'show', '%s:%s' % (rev, path)], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
    except Exception:
        return None
def rev_before(path, iso):
    """Ultimo commit anterior a `iso` que toco `path` (None si el fichero no existia)."""
    try:
        out = subprocess.run(['git', 'rev-list', '-1', '--before=' + iso, 'HEAD', '--', path], cwd=ROOT, capture_output=True, check=True).stdout.decode().strip()
        return out or None
    except Exception:
        return None
_LIC = None
def _lic():
    global _LIC
    if _LIC is None:
        try: _LIC = json.loads((ROOT / 'data/license-registry.json').read_text(encoding='utf-8'))
        except Exception: _LIC = {'sources': {}, 'files': {}}
    return _LIC
def canon_source(sid):
    """sourceId canonico del registro de licencias (resuelve alias); None si no existe."""
    src = _lic().get('sources', {})
    if sid in src: return sid
    for k, v in src.items():
        if sid in (v.get('aliases') or []): return k
    return None
def stats_source(name, cc, s):
    """Fuente de una serie de un *-stats.json segun data/license-registry.json (files). name = 'data/x.json' o 'x'. None si no se puede resolver."""
    if not name: return None
    n = name if name.startswith('data/') else 'data/%s.json' % name
    m = _lic().get('files', {}).get(n) or {}
    if cc in (m.get('byCountry') or {}): return canon_source(m['byCountry'][cc])
    for pf, sid in (m.get('bySourceGroupPrefix') or {}).items():
        if (s.get('sourceGroup') or '').startswith(pf): return canon_source(sid)
    if m.get('default'): return canon_source(m['default'])
    return None
def stats_series(doc, name=None):
    """{'CC/id': dict(l,u,f,g,p,v,c,s)} de un fichero *-stats.json (s = sourceId canonico, si se conoce el fichero)."""
    out = {}
    for cc, c in (doc.get('countries') or {}).items():
        for s in c.get('series', []):
            out['%s/%s' % (cc, s['id'])] = {'l': s.get('label', ''), 'u': s.get('unit', ''), 'f': s.get('frequency', ''), 'g': s.get('group', ''),
                                            'p': s.get('latestPeriod'), 'v': s.get('latest'), 'c': s.get('changePct'), 's': canon_source(s.get('sourceId')) if s.get('sourceId') else stats_source(name, cc, s)}
    return out
def products(doc):
    """{'P/producto/region': ...} de data/latest.json (solo observaciones verificadas)."""
    out = {}
    for o in (doc.get('observations') or []):
        if o.get('status') != 'verified' or o.get('value') is None: continue
        out['P/%s/%s' % (o['product'], o['region'])] = {'l': '%s (%s)' % (o['product'], o['region'].upper()), 'u': ((o.get('currency') or '') + '/' + (o.get('unit') or '')).strip('/'), 'f': o.get('frequency', ''),
                                                       'g': 'product', 'p': o.get('observationDate'), 'v': o.get('value'), 'c': o.get('changePct'), 's': canon_source(o.get('sourceId'))}
    return out
def load_all(loader, strict=False):
    """loader(path) -> texto JSON o None. Devuelve (series, ficheros_presentes).
    strict=True (estado actual): un fichero ausente o ilegible es un error, no se ignora. En versiones antiguas (git) puede faltar legitimamente."""
    series, present = {}, set()
    for n in STATS:
        t = loader('data/%s.json' % n)
        if not t:
            if strict: raise FileNotFoundError('data/%s.json' % n)
            continue
        try: d = json.loads(t)
        except Exception:
            if strict: raise
            continue
        present.add(n); series.update(stats_series(d, n))
    t = loader('data/latest.json')
    if t:
        try: series.update(products(json.loads(t))); present.add('latest')
        except Exception:
            if strict: raise
    elif strict: raise FileNotFoundError('data/latest.json')
    return series, present

# ---- cobertura del brief diario: TODOS los pipelines, clasificados por tipo ----
KINDS = ['PRICE', 'PRODUCTION', 'TRADE', 'CROP', 'CLIMATE', 'INPUT', 'TARIFF', 'MACRO']
# fichero o carpeta -> (tipo, nombre corto). Los *-stats.json se leen serie a serie (STATS) y se clasifican por su grupo; aqui van el resto de datasets.
DATASETS = {
    'data/latest.json': ('PRICE', 'Precios de mercado (latest)'), 'data/nass-prices.json': ('PRICE', 'USDA NASS precios'), 'data/ams-grain-daily.json': ('PRICE', 'USDA AMS granos (diario)'),
    'data/ams': ('PRICE', 'USDA AMS mercados (MARS)'), 'data/eu-farm-economics.json': ('INPUT', 'Costes y renta agraria UE (Eurostat EAA)'), 'data/eu-regions-es.json': ('PRODUCTION', 'Datos agrarios por comunidad autónoma (Eurostat)'), 'data/eu-regions-fr.json': ('PRODUCTION', 'Datos agrarios por región de Francia (Eurostat)'), 'data/eu-regions-it.json': ('PRODUCTION', 'Datos agrarios por región de Italia (Eurostat)'), 'data/eu-regions-de.json': ('PRODUCTION', 'Datos agrarios por Land de Alemania (Eurostat)'), 'data/canada-provinces.json': ('PRODUCTION', 'Canada por provincia (Statistics Canada)'), 'data/canada-drought.json': ('PRODUCTION', 'Sequia Canada (Canadian Drought Monitor)'), 'data/eu-drought.json': ('PRODUCTION', 'Sequia Europa (EDO CDI)'), 'data/us-dairy.json': ('PRICE', 'Lacteos EE. UU. (USDA AMS NDPSR)'), 'data/us-lamb.json': ('PRICE', 'Cordero EE. UU. (USDA AMS LM_XL502)'), 'data/eu-vat.json': ('INPUT', 'IVA UE-27 (TEDB)'), 'data/us-fertilizers.json': ('INPUT', 'Fertilizantes de EE. UU. (USDA AMS)'), 'data/us-cash-bids': ('PRICE', 'Precios locales de grano EE. UU. (USDA AMS)'), 'data/denmark-prices.json': ('PRICE', 'Dinamarca precios'), 'data/alberta-weekly.json': ('PRICE', 'Alberta semanal'),
    'data/eu': ('PRICE', 'Agri-food Data Portal UE'),
    'data/supply-demand.json': ('PRODUCTION', 'USDA PSD oferta y demanda'), 'data/nass-crops.json': ('PRODUCTION', 'USDA NASS cultivos'), 'data/nass-livestock.json': ('PRODUCTION', 'USDA NASS ganaderia'), 'data/cattle-on-feed.json': ('PRODUCTION', 'USDA Cattle on Feed'),
    'data/ers.json': ('PRODUCTION', 'USDA ERS'), 'data/recan.json': ('PRODUCTION', 'RECAN (Espana)'),
    'data/export-sales.json': ('TRADE', 'USDA exportaciones semanales'), 'data/canada-grain.json': ('TRADE', 'Granos de Canada (CGC, semanal)'), 'data/gats.json': ('TRADE', 'USDA GATS'), 'data/eu-trade-products.json': ('TRADE', 'Comercio UE por producto'), 'data/au-trade-products.json': ('TRADE', 'Comercio Australia por producto'),
    'data/crop-progress.json': ('CROP', 'USDA Crop Progress'),
    'data/drought.json': ('CLIMATE', 'US Drought Monitor'), 'data/climate.json': ('CLIMATE', 'Clima (Open-Meteo)'),
    'data/us-tariffs.json': ('TARIFF', 'Aranceles EE. UU.'), 'data/tariffs-eu.json': ('TARIFF', 'Aranceles UE'), 'data/tariffs-mx.json': ('TARIFF', 'Aranceles Mexico'), 'data/tariffs-ca.json': ('TARIFF', 'Aranceles Canada'),
    'data/us-tariff-measures.json': ('TARIFF', 'Medidas arancelarias EE. UU.'),
    'data/country-macro.json': ('MACRO', 'Macro por pais'), 'data/fx-history.json': ('MACRO', 'Tipos de cambio (BCE)'),
}
# grupo de una serie de *-stats.json -> tipo
GROUP_KIND = {'markets': 'PRICE', 'quotes': 'PRICE', 'prices': 'PRICE', 'prices_lv': 'PRICE', 'prices_fv': 'PRICE', 'milk': 'PRICE', 'milk_regions': 'PRICE', 'meat_regions': 'PRICE', 'product': 'PRICE',
              'production': 'PRODUCTION', 'crops': 'PRODUCTION', 'livestock': 'PRODUCTION', 'stocks': 'PRODUCTION', 'organic': 'PRODUCTION', 'environment': 'CLIMATE',
              'trade': 'TRADE', 'partners': 'TRADE', 'inputs': 'INPUT', 'inputs_f': 'INPUT', 'inputs_a': 'INPUT', 'costs': 'INPUT', 'prices_paid': 'INPUT', 'idx_perc': 'PRICE', 'idx_pag': 'INPUT',
              'income': 'MACRO', 'rates': 'MACRO'}
INPUT_PRODUCTS = {'urea', 'dap', 'potasa', 'diesel', 'gas_natural', 'petroleo_brent', 'petroleo_wti', 'fertilizantes', 'harina_soja'}
def kind_of(group, key=''):
    """Tipo de dato de una serie (PRICE/PRODUCTION/TRADE/CROP/CLIMATE/INPUT/TARIFF/MACRO) por su grupo; los productos de insumos (fertilizante, energia, pienso) son INPUT."""
    if key.startswith('P/') and key.split('/')[1] in INPUT_PRODUCTS: return 'INPUT'
    return GROUP_KIND.get(group, 'PRICE')
# workflow -> tipos que alimenta (todos los pipelines deben estar aqui; el brief falla si aparece uno sin clasificar)
WORKFLOW_KINDS = {
    'update-alberta-weekly.yml': ['PRICE'], 'update-ams-auctions.yml': ['PRICE'], 'update-ams.yml': ['PRICE'], 'update-au-trade.yml': ['TRADE'], 'update-austria.yml': ['PRODUCTION', 'TRADE', 'INPUT'],
    'update-belgium.yml': ['PRODUCTION', 'INPUT'], 'update-canada-stats.yml': ['PRODUCTION', 'TRADE'], 'update-canada.yml': ['PRICE'], 'update-climate.yml': ['CLIMATE'], 'update-country-macro.yml': ['MACRO'],
    'update-country-stats.yml': ['PRODUCTION', 'TRADE'], 'update-crop-progress.yml': ['CROP'], 'update-defra-milk.yml': ['PRICE'], 'update-denmark.yml': ['PRICE'], 'update-drought.yml': ['CLIMATE'],
    'update-energy-markets.yml': ['INPUT'], 'update-energy.yml': ['INPUT'], 'update-ers.yml': ['PRODUCTION'], 'update-cattle-on-feed.yml': ['PRODUCTION'], 'update-canada-grain.yml': ['TRADE'], 'update-canada-drought.yml': ['PRODUCTION'], 'update-eu-regions.yml': ['PRODUCTION'], 'update-canada-provinces.yml': ['PRODUCTION'], 'update-us-dairy.yml': ['PRICE'], 'update-us-lamb.yml': ['PRICE'], 'update-eu-vat.yml': ['INPUT'], 'update-eu-drought.yml': ['PRODUCTION'], 'update-eu-farm-economics.yml': ['INPUT', 'PRODUCTION'], 'update-eu-agrifood.yml': ['PRICE'], 'update-eu-catalog.yml': ['PRICE'], 'update-eu-trade.yml': ['TRADE'],
    'update-eurostat.yml': ['PRICE', 'INPUT'], 'update-export-sales.yml': ['TRADE'], 'update-france.yml': ['PRICE', 'PRODUCTION'], 'update-fx-history.yml': ['MACRO'], 'update-fx.yml': ['MACRO'], 'update-gats.yml': ['TRADE'],
    'update-germany.yml': ['PRICE', 'PRODUCTION'], 'update-interest-rates.yml': ['MACRO'], 'update-mars-us.yml': ['PRICE'], 'update-nass-data.yml': ['PRICE', 'PRODUCTION'], 'update-nass.yml': ['PRICE'],
    'update-partner-tariffs.yml': ['TARIFF'], 'update-portugal-eurostat.yml': ['PRODUCTION'], 'update-portugal.yml': ['PRODUCTION', 'PRICE'], 'update-recan.yml': ['PRODUCTION'], 'update-spain.yml': ['PRICE', 'INPUT', 'PRODUCTION'],
    'update-us-cash-bids.yml': ['PRICE'], 'update-us-tariffs.yml': ['TARIFF'], 'update-usda-calendar.yml': [], 'update-usda-psd.yml': ['PRODUCTION'], 'update-worldbank-urea.yml': ['INPUT'],
    # no son datos agricolas: noticias (no entran en el brief) y trabajos internos
    'update-news.yml': [], 'update-pipeline-status.yml': [], 'update-seo-pages.yml': [],
}
VOLATILE = {'generatedAt', 'revisedAt', 'verifiedAt', 'fetchedAt', 'updatedAt', 'checkedAt'}
def _strip(o):
    if isinstance(o, dict): return {k: _strip(v) for k, v in o.items() if k not in VOLATILE}
    if isinstance(o, list): return [_strip(v) for v in o]
    return o
def content_key(text):
    """Huella del contenido sin marcas de tiempo de ejecucion: solo cambia si cambian los datos."""
    import hashlib
    try: return hashlib.sha1(json.dumps(_strip(json.loads(text)), sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    except Exception: return None
def tree_key(rev, path):
    try: return subprocess.run(['git', 'rev-parse', '%s:%s' % (rev, path)], cwd=ROOT, capture_output=True, check=True).stdout.decode().strip()
    except Exception: return None

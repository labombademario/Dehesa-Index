"""Utilidades comunes de indice de series (watchlist y brief diario). Solo libreria estandar."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STATS = ['country-stats', 'spain-stats', 'france-stats', 'france-crops-stats', 'france-extras-stats', 'france-campaign-stats', 'france-rnm-stats', 'france-dairy-stats', 'france-saa-stats', 'france-rica-stats', 'france-comex-stats', 'france-bulconj-stats', 'france-agreste-more-stats', 'netherlands-more-stats', 'belgium-more-stats', 'portugal-more-stats', 'poland-zsrir-stats', 'france-infosrapides-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'uk-stats', 'portugal-stats', 'portugal-eurostat-stats', 'italy-eurostat-stats', 'eurostat-structure-stats', 'eurostat-structure2-stats', 'ie-cso-stats', 'hu-ksh-stats', 'eurostat-fish-stats', 'eurostat-more-stats', 'us-noaa-fish-stats', 'france-organic-stats', 'eurostat-depth-stats', 'uk-trade-stats', 'chile-stats', 'argentina-stats', 'uruguay-stats', 'poland-eurostat-stats', 'eurostat-eu-stats', 'eurostat-euw-stats', 'eurostat-eu2-stats', 'eurostat-eu3-stats', 'us-ers-stats', 'us-fmmo-stats', 'us-ers-livestock-stats', 'ca-statcan-more-stats', 'ca-alberta-inputs-stats', 'ca-aafc-slaughter-stats', 'ca-boc-bcpi-stats', 'us-nass-cdl-stats', 'us-ers-productivity-stats', 'us-ers-food-stats', 'us-ers-bioenergy-stats', 'us-ers-fertilizer-stats', 'us-nass-processing-stats', 'eu-organic-stats', 'eu-production-stats', 'eu-food-monitor-stats', 'france-insee-stats', 'eu-stocks-stats', 'spain-siega-stats', 'spain-hicp-stats', 'france-hicp-stats', 'spain-oilseeds-stats', 'us-ttb-stats', 'abares-stats', 'switzerland-foag-stats', 'switzerland-bfs-stats', 'sweden-sjv-stats', 'finland-luke-stats', 'sweden-scb-stats', 'finland-statfin-stats', 'finland-fmi-stats', 'australia-prices-stats', 'baltics-national-stats', 'czechia-csu-stats', 'austria-balances-stats', 'germany-extra-stats', 'us-weekly-stats', 'switzerland-meteo-stats', 'poland-stats', 'eu-gapfill-stats',
         'canada-stats', 'us-stats', 'eu-trade-stats', 'australia-trade-stats', 'interest-rates-stats', 'us-nass-extra-stats', 'us-trade-partners-stats', 'cl-trade-partners-stats', 'eu-extra-trade-stats', 'us-climate-stats', 'us-kcfed-stats', 'us-snotel-stats', 'us-fed-stats', 'uk-fuel-stats', 'uk-fv-stats', 'uk-ni-market-stats', 'uk-scotland-stats']
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
_PL = None
def product_label(key, source=None):
    """Nombre INGLES del producto (data/product-labels.json): el glosario de etiquetas (data/label-gloss) lo traduce en el navegador. Sin entrada se devuelve la clave tal cual (el test lo detecta)."""
    global _PL
    if _PL is None: _PL = json.loads((ROOT / 'data/product-labels.json').read_text(encoding='utf-8'))
    n = (_PL['labels'].get(key) or {}).get('en') or key.replace('_', ' ').capitalize()
    return n if source is None else '%s \u00b7 %s' % (n, _PL['sources'].get(source, source))
def products(doc):
    """{'P/producto/region': ...} de data/latest.json (solo observaciones verificadas)."""
    out = {}
    for o in (doc.get('observations') or []):
        if o.get('status') != 'verified' or o.get('value') is None: continue
        out['P/%s/%s' % (o['product'], o['region'])] = {'l': '%s \u00b7 %s' % (product_label(o['product']), o['region'].upper()), 'u': ((o.get('currency') or '') + '/' + (o.get('unit') or '')).strip('/'), 'f': o.get('frequency', ''),
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
    'data/latest.json': ('PRICE', 'Precios de mercado (latest)'), 'data/nass-prices.json': ('PRICE', 'USDA NASS precios'), 'data/nass-received.json': ('PRICE', 'USDA NASS precios recibidos'), 'data/us-ppi.json': ('PRICE', 'EE. UU.: indices de precios de produccion de productos agrarios y alimentarios (BLS PPI)'), 'data/ams-grain-daily.json': ('PRICE', 'USDA AMS granos (diario)'),
    'data/spain-prices': ('PRICE', 'Precios medios nacionales semanales y observatorio de precios origen-destino de España (MAPA)'), 'data/spain-income': ('PRODUCTION', 'Cuentas económicas de la agricultura y renta agraria de España (MAPA)'), 'data/spain-esyrce': ('PRODUCTION', 'Superficies de cultivos de España por provincia, secano y regadío (MAPA ESYRCE)'), 'data/spain-inputs': ('INPUT', 'Mercado de fertilizantes y fitosanitarios de España (MAPA)'), 'data/spain-ganaderia': ('PRODUCTION', 'Huevos, industria láctea y previsiones de producción de ganado de España (MAPA)'), 'data/spain-avances': ('PRODUCTION', 'Avances mensuales de superficies y producciones agrícolas de España (MAPA)'),
    'data/italy-istat': ('PRODUCTION', 'Macellazioni, precios agrarios, existencias de ganado, fertilizantes y fitosanitarios de Italia (ISTAT)'),
    'data/spain-health': ('PRODUCTION', 'Focos de enfermedades animales de España (MAPA RASVE)'),
    'data/france-infosrapides': ('PRICE', 'Informes mensuales Infos Rapides de Francia: leche, cosechas de grandes cultivos por región y comercio exterior (Agreste)'),
    'data/poland-zsrir': ('PRICE', 'Precios semanales y mensuales de cereales, colza, carne, lácteos, huevos y piensos de Polonia (ZSRIR, Ministerio de Agricultura)'),
    'data/portugal-more': ('PRODUCTION', 'Pesca con precio medio descargado, balances de abastecimiento, leche recogida, producción bruta de carne, IPCA de alimentos, incendios rurales, cultivos por región, fertilizantes y miel de Portugal (INE)'),
    'data/belgium-more': ('PRODUCTION', 'Censo ganadero y de superficies por región y provincia, cosecha definitiva, IPC de alimentos, pesca con precio de lonja, productos lácteos y balances de carne de Bélgica (Statbel)'),
    'data/netherlands-more': ('PRODUCTION', 'Facturación trimestral de las explotaciones, invernaderos y flores, nitrógeno y estiércol, cadena de precios (PPI e IPC de alimentos) y otras series de Países Bajos (CBS)'),
    'data/france-agreste-more': ('PRODUCTION', 'Empleo agrícola, uso del suelo (TERUTI), vendimia por cuenca e índices de precios de los medios de producción (IPAMPA) de Francia (Agreste)'),
    'data/france-bulconj': ('PRICE', 'Boletín mensual de coyuntura agraria de Francia: precios, cotizaciones, índices y comercio por sector (Agreste)'),
    'data/france-comex': ('TRADE', 'Comercio exterior de Francia de cereales, lácteos, huevos y alimentos por producto y país (Agreste, aduanas)'),
    'data/france-rica': ('MACRO', 'Cuentas de las explotaciones de Francia por orientación, tamaño y región (Agreste RICA)'),
    'data/france-saa': ('PRODUCTION', 'Estadística agrícola anual de Francia por región y departamento (Agreste SAA)'),
    'data/ams': ('PRICE', 'USDA AMS mercados (MARS)'), 'data/us-county': ('PRODUCTION', 'Rendimiento, superficie cosechada y producción por condado de EE. UU. (USDA NASS)'), 'data/us-states': ('PRODUCTION', 'EE. UU. por estado: sacrificio, existencias, tierra, leche, huevos, precios, censo y renta (USDA NASS y ERS)'), 'data/us-markets': ('PRICE', 'Mercado e insumos de EE. UU.: posiciones de los fondos (CFTC), transporte de grano (USDA AMS) y gasoleo y propano por región (EIA)'), 'data/us-arcplc': ('INPUT', 'Tasas de pago ARC-CO por condado y PLC nacionales (USDA FSA)'), 'data/us-local': ('PRICE', 'Ganado en subasta y heno locales EE. UU. (USDA AMS)'), 'data/mb-markets': ('PRICE', 'Ganado vacuno en subastas de Manitoba (Manitoba Agriculture)'), 'data/spain-crops': ('PRODUCTION', 'Cultivos de España por provincia: superficies y producciónes (MAPA)'), 'data/spain-land': ('INPUT', 'Precio de la tierra y cánones de arrendamiento de España por comunidad y provincia (MAPA)'), 'data/spain-livestock': ('PRODUCTION', 'Efectivos de ganado de España por provincia (MAPA)'), 'data/spain-balances': ('PRODUCTION', 'Balances de cereales de España (MAPA)'), 'data/supply-balances': ('PRODUCTION', 'Balances oficiales de oferta y demanda por país: Canadá (Statistics Canada), UE (Comisión Europea), Australia (ABARES) y Francia (FranceAgriMer)'), 'data/spain-wine': ('PRODUCTION', 'Vino de España por campaña y comunidad: producción, salidas y existencias (MAPA INFOVI)'), 'data/spain-slaughter': ('PRODUCTION', 'Sacrificio de ganado de España por especie y comunidad (MAPA)'), 'data/spain-milk': ('PRODUCTION', 'Leche cruda de España: entregas, precio y calidad (MAPA INFOLAC)'), 'data/eu-farm-economics.json': ('INPUT', 'Costes y renta agraria UE (Eurostat EAA)'), 'data/eu-regions-macro.json': ('PRODUCTION', 'PIB, población y paro por región (Eurostat NUTS 2)'), 'data/eu-regions-es.json': ('PRODUCTION', 'Datos agrarios por comunidad autónoma (Eurostat)'), 'data/eu-regions-fr.json': ('PRODUCTION', 'Datos agrarios por región de Francia (Eurostat)'), 'data/eu-regions-it.json': ('PRODUCTION', 'Datos agrarios por región de Italia (Eurostat)'), 'data/eu-regions-de.json': ('PRODUCTION', 'Datos agrarios por Land de Alemania (Eurostat)'), 'data/eu-regions-nl.json': ('PRODUCTION', 'Datos agrarios por provincia de los Países Bajos (Eurostat)'), 'data/eu-regions-at.json': ('PRODUCTION', 'Datos agrarios por Land de Austria (Eurostat)'), 'data/eu-regions-be.json': ('PRODUCTION', 'Datos agrarios por provincia de Bélgica (Eurostat)'), 'data/eu-regions-dk.json': ('PRODUCTION', 'Datos agrarios por región de Dinamarca (Eurostat)'), 'data/eu-regions-pl.json': ('PRODUCTION', 'Datos agrarios por voivodía de Polonia (Eurostat)'), 'data/au-states.json': ('TRADE', 'Exportaciones agroalimentarias de Australia por estado (ABS)'), 'data/crop-insurance.json': ('INPUT', 'Seguro de cosechas de EE. UU. por estado, cultivo y causa (USDA RMA)'), 'data/crop-insurance-ca.json': ('INPUT', 'Seguro de cosechas de Canadá por provincia (Statistics Canada)'), 'data/canada-provinces.json': ('PRODUCTION', 'Canadá por provincia (Statistics Canada)'), 'data/canada-drought.json': ('PRODUCTION', 'Sequía en Canadá (Canadian Drought Monitor)'), 'data/eu-drought.json': ('PRODUCTION', 'Sequia Europa (EDO CDI)'), 'data/eu-climate.json': ('PRODUCTION', 'Temperatura y lluvia mensual por país frente a la media 1991-2020 (NASA POWER)'), 'data/eu-drought-ind': ('PRODUCTION', 'Humedad del suelo y SPI-3 por país y región (EDO)'), 'data/us-dairy.json': ('PRICE', 'Lacteos EE. UU. (USDA AMS NDPSR)'), 'data/us-lamb.json': ('PRICE', 'Cordero EE. UU. (USDA AMS LM_XL502)'), 'data/eu-vat.json': ('INPUT', 'IVA UE-27 (TEDB)'), 'data/us-fertilizers.json': ('INPUT', 'Fertilizantes de EE. UU. (USDA AMS)'), 'data/us-cash-bids': ('PRICE', 'Precios locales de grano EE. UU. (USDA AMS)'), 'data/denmark-prices.json': ('PRICE', 'Dinamarca precios'), 'data/alberta-weekly.json': ('PRICE', 'Alberta semanal'), 'data/cl': ('PRICE', 'Chile: precios mayoristas y de consumidor de fruta y hortaliza (ODEPA)'), 'data/ca': ('PRICE', 'Canadá: precios mayoristas de fruta y hortaliza por ciudad (AAFC)'),
    'data/eu': ('PRICE', 'Agri-food Data Portal UE'),
    'data/supply-demand.json': ('PRODUCTION', 'USDA PSD oferta y demanda'), 'data/nass-crops.json': ('PRODUCTION', 'USDA NASS cultivos'), 'data/nass-livestock.json': ('PRODUCTION', 'USDA NASS ganaderia'), 'data/cattle-on-feed.json': ('PRODUCTION', 'USDA Cattle on Feed'),
    'data/ers.json': ('PRODUCTION', 'USDA ERS'), 'data/recan.json': ('PRODUCTION', 'RECAN (Espana)'),
    'data/export-sales.json': ('TRADE', 'USDA exportaciones semanales'), 'data/canada-grain.json': ('TRADE', 'Granos de Canada (CGC, semanal)'), 'data/gats.json': ('TRADE', 'USDA GATS'), 'data/eu-trade-products.json': ('TRADE', 'Comercio UE por producto'), 'data/au-trade-products.json': ('TRADE', 'Comercio Australia por producto'),
    'data/crop-progress.json': ('CROP', 'USDA Crop Progress'),
    'data/drought.json': ('CLIMATE', 'US Drought Monitor'), 'data/climate.json': ('CLIMATE', 'Clima (Open-Meteo)'),
    'data/us-tariffs.json': ('TARIFF', 'Aranceles EE. UU.'), 'data/tariffs-eu.json': ('TARIFF', 'Aranceles UE'), 'data/tariffs-mx.json': ('TARIFF', 'Aranceles Mexico'), 'data/tariffs-ca.json': ('TARIFF', 'Aranceles Canada'),
    'data/us-tariff-measures.json': ('TARIFF', 'Medidas arancelarias EE. UU.'),
    'data/eu-tariff-measures.json': ('TARIFF', 'Medidas arancelarias UE'),
    'data/country-macro.json': ('MACRO', 'Macro por pais'), 'data/cpi.json': ('MACRO', 'Indices de precios de consumo (precios reales)'), 'data/worldbank-agri.json': ('MACRO', 'Perfil agrario por pais (Banco Mundial)'), 'data/germany-agri.json': ('PRODUCTION', 'Alemania: produccion por Land, precios de la tierra y alquileres (Destatis)'), 'data/germany-livestock.json': ('PRODUCTION', 'Alemania: sacrificios, aves, huevos, censos ganaderos y fruta (Destatis)'), 'data/fx-history.json': ('MACRO', 'Tipos de cambio (BCE)'),
}
# grupo de una serie de *-stats.json -> tipo
GROUP_KIND = {'markets': 'PRICE', 'quotes': 'PRICE', 'prices': 'PRICE', 'prices_lv': 'PRICE', 'prices_fv': 'PRICE', 'milk': 'PRICE', 'milk_regions': 'PRICE', 'meat_regions': 'PRICE', 'product': 'PRICE',
              'production': 'PRODUCTION', 'crops': 'PRODUCTION', 'crops_regions': 'PRODUCTION', 'livestock': 'PRODUCTION', 'stocks': 'PRODUCTION', 'organic': 'PRODUCTION', 'fish': 'PRODUCTION', 'environment': 'CLIMATE', 'climate': 'CLIMATE',
              'trade': 'TRADE', 'partners': 'TRADE', 'inputs': 'INPUT', 'inputs_f': 'INPUT', 'inputs_a': 'INPUT', 'costs': 'INPUT', 'prices_paid': 'INPUT', 'idx_perc': 'PRICE', 'idx_pag': 'INPUT',
              'income': 'MACRO', 'rates': 'MACRO'}
INPUT_PRODUCTS = {'urea', 'dap', 'potasa', 'diesel', 'gas_natural', 'petroleo_brent', 'petroleo_wti', 'fertilizantes', 'harina_soja'}
def kind_of(group, key=''):
    """Tipo de dato de una serie (PRICE/PRODUCTION/TRADE/CROP/CLIMATE/INPUT/TARIFF/MACRO) por su grupo; los productos de insumos (fertilizante, energia, pienso) son INPUT."""
    if key.startswith('P/') and key.split('/')[1] in INPUT_PRODUCTS: return 'INPUT'
    return GROUP_KIND.get(group, 'PRICE')
# workflow -> tipos que alimenta (todos los pipelines deben estar aqui; el brief falla si aparece uno sin clasificar)
WORKFLOW_KINDS = {
    'update-alberta-weekly.yml': ['PRICE'], 'update-ca-panel-prices.yml': ['PRICE'], 'update-uk-panel-prices.yml': ['PRICE'], 'update-wb-panel-prices.yml': ['PRICE'], 'update-eu-oilseeds-panel-prices.yml': ['PRICE'], 'update-us-panel-prices.yml': ['PRICE'], 'update-canada-wholesale.yml': ['PRICE'], 'update-chile-fv.yml': ['PRICE'], 'update-ams-auctions.yml': ['PRICE'], 'update-ams.yml': ['PRICE'], 'update-au-trade.yml': ['TRADE'], 'update-au-prices.yml': ['PRICE'], 'update-trade-partners.yml': ['TRADE'], 'update-embalses.yml': ['PRODUCTION'], 'update-uk-defra.yml': ['PRODUCTION', 'INPUT'], 'update-austria.yml': ['PRODUCTION', 'TRADE', 'INPUT'],
    'update-belgium.yml': ['PRODUCTION', 'INPUT'], 'update-canada-stats.yml': ['PRODUCTION', 'TRADE'], 'update-us-stats.yml': ['PRODUCTION', 'INPUT'], 'update-eu-regions-macro.yml': ['PRODUCTION'], 'update-us-states-macro.yml': ['PRODUCTION'], 'update-canada-provinces-macro.yml': ['PRODUCTION'], 'update-canada.yml': ['PRICE'], 'update-climate.yml': ['CLIMATE'], 'update-country-macro.yml': ['MACRO'], 'update-worldbank-agri.yml': ['MACRO'], 'update-worldbank-fertilizers.yml': ['INPUT'],
    'update-country-stats.yml': ['PRODUCTION', 'TRADE'], 'update-crop-progress.yml': ['CROP'], 'update-defra-milk.yml': ['PRICE'], 'update-denmark.yml': ['PRICE'], 'update-drought.yml': ['CLIMATE'],
    'update-es-cork.yml': ['PRODUCTION'], 'update-eu-crops-map.yml': ['PRODUCTION'], 'update-energy-markets.yml': ['INPUT'], 'update-energy.yml': ['INPUT'], 'update-ers.yml': ['PRODUCTION'], 'update-us-wasde.yml': ['PRODUCTION'], 'update-us-sap.yml': ['PRICE'], 'update-us-fmmo.yml': ['PRICE'], 'update-us-ers-livestock.yml': ['PRODUCTION'], 'update-ca-statcan-more.yml': ['PRICE'], 'update-ca-alberta-inputs.yml': ['INPUT'], 'update-ca-aafc-slaughter.yml': ['PRODUCTION'], 'update-ca-boc-bcpi.yml': ['PRICE'], 'update-us-nass-cdl.yml': ['PRODUCTION'], 'update-us-ers-productivity.yml': ['PRODUCTION'], 'update-us-ers-food.yml': ['PRODUCTION'], 'update-us-ers-fertilizer.yml': ['INPUT'], 'update-us-ers-bioenergy.yml': ['PRODUCTION'], 'update-us-nass-processing.yml': ['PRODUCTION'],  'update-eu-organic.yml': ['PRICE'], 'update-eu-production.yml': ['PRODUCTION'], 'update-eu-food-monitor.yml': ['PRICE'], 'update-cattle-on-feed.yml': ['PRODUCTION'], 'update-canada-grain.yml': ['TRADE'], 'update-canada-drought.yml': ['PRODUCTION'], 'update-eu-regions.yml': ['PRODUCTION'], 'update-au-states.yml': ['TRADE'], 'update-crop-insurance.yml': ['INPUT'], 'update-crop-insurance-ca.yml': ['INPUT'], 'update-canada-provinces.yml': ['PRODUCTION'], 'update-us-dairy.yml': ['PRICE'], 'update-us-lamb.yml': ['PRICE'], 'update-us-slaughter.yml': ['PRODUCTION'], 'update-ers-baseline.yml': ['PRODUCTION'], 'update-es-prices.yml': ['PRICE'], 'update-es-income.yml': ['PRODUCTION'], 'update-es-esyrce.yml': ['PRODUCTION'], 'update-es-inputs.yml': ['INPUT'], 'update-es-esyrce-extra.yml': ['PRODUCTION'], 'update-es-ganaderia.yml': ['PRODUCTION'], 'update-es-avances.yml': ['PRODUCTION'], 'update-it-istat.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-it-istat-2.yml': ['PRODUCTION', 'CROP'], 'update-el-elstat.yml': ['PRICE', 'INPUT', 'PRODUCTION'], 'update-eu-land.yml': ['PRICE', 'PRODUCTION'], 'update-es-health.yml': ['PRODUCTION'], 'update-eu-vat.yml': ['INPUT'], 'update-eu-drought.yml': ['PRODUCTION'], 'update-eu-drought-ind.yml': ['PRODUCTION'], 'update-eu-climate.yml': ['PRODUCTION'], 'update-eu-farm-economics.yml': ['INPUT', 'PRODUCTION'], 'update-eu-agrifood.yml': ['PRICE'], 'update-eu-balances.yml': ['PRODUCTION'], 'update-eu-catalog.yml': ['PRICE'], 'update-eu-trade.yml': ['TRADE'], 'update-eu-trade-extra.yml': ['TRADE'],
    'update-eurostat.yml': ['PRICE', 'INPUT'], 'update-export-sales.yml': ['TRADE'], 'update-france.yml': ['PRICE', 'PRODUCTION'], 'update-cpi.yml': ['MACRO'], 'update-fx-history.yml': ['MACRO'], 'update-fx.yml': ['MACRO'], 'update-gats.yml': ['TRADE'],
    'update-germany.yml': ['PRICE', 'PRODUCTION'], 'update-germany-livestock.yml': ['PRODUCTION'], 'update-interest-rates.yml': ['MACRO'], 'update-mars-us.yml': ['PRICE'], 'update-nass-data.yml': ['PRICE', 'PRODUCTION'], 'update-nass.yml': ['PRICE'],
    'update-eambrosia.yml': [], 'update-inao-geo.yml': [], 'update-wine-prices.yml': ['PRICE'], 'update-wood-removals.yml': ['PRODUCTION'], 'update-eu-fv-farm.yml': ['PRICE'], 'update-fr-saa.yml': ['PRODUCTION'], 'update-fr-rica.yml': ['MACRO'], 'update-fr-comex.yml': ['TRADE'], 'update-fr-bulconj.yml': ['PRICE'], 'update-fr-agreste-more.yml': ['PRODUCTION', 'INPUT'], 'update-nl-cbs-more.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-be-statbel-more.yml': ['PRODUCTION', 'PRICE'], 'update-pt-ine-more.yml': ['PRODUCTION', 'PRICE'], 'update-pl-zsrir.yml': ['PRICE'], 'update-fr-infosrapides.yml': ['PRICE'], 'update-eu-wood-prices.yml': ['PRICE'], 'update-wood-prices-de.yml': ['PRICE'], 'update-wood-prices-na.yml': ['PRICE'], 'update-us-reservoirs.yml': ['CLIMATE'], 'update-es-gasoleo-b.yml': ['INPUT'], 'update-es-ghg-agri.yml': ['PRODUCTION'], 'update-es-drought-ute.yml': ['CLIMATE'], 'update-es-climate-provinces.yml': ['CLIMATE'], 'update-eu-region-climate.yml': ['CLIMATE'], 'update-au-states-macro.yml': ['PRODUCTION'], 'update-uk-regions-macro.yml': ['PRODUCTION'], 'update-uk-farmers-age.yml': ['PRODUCTION'], 'update-uk-farm-accounts.yml': ['PRODUCTION'], 'update-uk-structure.yml': ['PRODUCTION'], 'update-uk-tiff-regions.yml': ['PRODUCTION'], 'update-uk-climate.yml': ['CLIMATE'], 'update-es-jcyl-prices.yml': ['PRICE'], 'update-fr-gnr.yml': ['INPUT'], 'update-fr-ghg-agri.yml': ['PRODUCTION'], 'update-fr-onde.yml': ['CLIMATE'], 'update-fr-nitrates.yml': ['CLIMATE'], 'update-de-diesel.yml': ['INPUT'], 'update-de-ghg-agri.yml': ['PRODUCTION'], 'update-de-soil-moisture.yml': ['CLIMATE'], 'update-it-fuel.yml': ['INPUT'], 'update-it-ghg-agri.yml': ['PRODUCTION'], 'update-it-water-severity.yml': ['CLIMATE'], 'update-pl-diesel.yml': ['INPUT'], 'update-pl-ghg-agri.yml': ['PRODUCTION'], 'update-pl-hydro-drought.yml': ['CLIMATE'], 'update-be-diesel.yml': ['INPUT'], 'update-be-ghg-agri.yml': ['PRODUCTION'], 'update-be-drought.yml': ['CLIMATE'], 'update-be-nitrates.yml': ['CLIMATE'], 'update-at-diesel.yml': ['INPUT'], 'update-at-ghg-agri.yml': ['PRODUCTION'], 'update-at-drought.yml': ['CLIMATE'], 'update-hr-diesel.yml': ['INPUT'], 'update-hr-ghg-agri.yml': ['PRODUCTION'], 'update-hr-drought.yml': ['CLIMATE'], 'update-ie-diesel.yml': ['INPUT'], 'update-ie-ghg-agri.yml': ['PRODUCTION'], 'update-ie-nitrates.yml': ['CLIMATE'], 'update-ie-cso.yml': ['PRICE', 'PRODUCTION', 'INPUT'], 'update-hu-ksh.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-eurostat-fish.yml': ['PRODUCTION', 'PRICE'], 'update-eurostat-census.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-eurostat-more.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-us-noaa-fish.yml': ['PRODUCTION'], 'update-ie-drought.yml': ['CLIMATE'], 'update-nl-diesel.yml': ['INPUT'], 'update-nl-ghg-agri.yml': ['PRODUCTION'], 'update-nl-nitrates.yml': ['CLIMATE'], 'update-nl-drought.yml': ['CLIMATE'], 'update-pt-diesel.yml': ['INPUT'], 'update-eu-diesel-more.yml': ['INPUT'], 'update-eu-nitrates.yml': ['CLIMATE'], 'update-us-cash-receipts.yml': ['PRODUCTION', 'PRICE'], 'update-ca-ghg-agri.yml': ['PRODUCTION'], 'update-pt-ghg-agri.yml': ['PRODUCTION'], 'update-el-ghg-agri.yml': ['PRODUCTION'], 'update-eu-more-ghg-agri.yml': ['PRODUCTION'], 'update-eurostat-structure2.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-pt-nitrates.yml': ['CLIMATE'], 'update-pt-drought.yml': ['CLIMATE'], 'update-germany-extra.yml': ['PRODUCTION', 'PRICE'], 'update-argentina-provinces.yml': ['PRODUCTION'], 'update-partner-tariffs.yml': ['TARIFF'], 'update-portugal-eurostat.yml': ['PRODUCTION'], 'update-italy-eurostat.yml': ['PRODUCTION', 'PRICE'], 'update-eurostat-structure.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-france-organic.yml': ['PRODUCTION'], 'update-eurostat-depth.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-uk-trade.yml': ['TRADE'], 'update-chile.yml': ['PRICE', 'TRADE'], 'update-argentina.yml': ['PRODUCTION', 'PRICE', 'TRADE'], 'update-uruguay.yml': ['CLIMATE', 'INPUT', 'PRICE'], 'update-switzerland-foag.yml': ['PRICE', 'PRODUCTION'], 'update-switzerland-bfs.yml': ['PRODUCTION', 'PRICE'], 'update-sweden-sjv.yml': ['PRODUCTION', 'PRICE'], 'update-finland-luke.yml': ['PRICE', 'PRODUCTION'], 'update-sweden-scb.yml': ['PRICE', 'INPUT'], 'update-finland-statfin.yml': ['PRICE'], 'update-finland-fmi.yml': ['CLIMATE'], 'update-baltics-national.yml': ['PRODUCTION', 'PRICE'], 'update-czechia-csu.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-austria-balances.yml': ['PRODUCTION'], 'update-switzerland-meteo.yml': ['CLIMATE'], 'update-poland-eurostat.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-eurostat-eu.yml': ['PRODUCTION', 'PRICE', 'INPUT'], 'update-us-ers.yml': ['PRICE', 'PRODUCTION', 'TRADE'], 'update-fr-insee.yml': ['PRICE'], 'update-eu-stocks.yml': ['PRODUCTION'], 'update-spain-siega.yml': ['PRODUCTION'], 'update-spain-hicp.yml': ['PRICE'], 'update-france-hicp.yml': ['PRICE'], 'update-france-rnm-potato.yml': ['PRICE'], 'update-spain-oilseeds.yml': ['PRODUCTION', 'TRADE'], 'update-poland.yml': ['PRODUCTION', 'PRICE'], 'update-portugal.yml': ['PRODUCTION', 'PRICE'], 'update-recan.yml': ['PRODUCTION'], 'update-spain.yml': ['PRICE', 'INPUT', 'PRODUCTION'],
    'update-us-cash-bids.yml': ['PRICE'], 'update-us-fsa-rates.yml': ['MACRO'], 'update-us-local-markets.yml': ['PRICE'], 'update-us-crop-progress-states.yml': ['CROP'], 'update-us-county-yields.yml': ['PRODUCTION'], 'update-us-ppi.yml': ['PRICE'], 'update-us-states.yml': ['PRODUCTION', 'PRICE'], 'update-us-markets.yml': ['PRICE', 'INPUT'], 'update-us-arcplc.yml': ['INPUT'], 'update-spain-crops.yml': ['PRODUCTION'], 'update-spain-livestock.yml': ['PRODUCTION'], 'update-spain-land.yml': ['INPUT'], 'update-land-fr-it.yml': ['INPUT'], 'update-land-pl.yml': ['INPUT'], 'update-regions-pl.yml': ['PRODUCTION'], 'update-spain-balances.yml': ['PRODUCTION'], 'update-spain-olive.yml': ['PRODUCTION'], 'update-spain-milk.yml': ['PRODUCTION', 'PRICE'], 'update-spain-slaughter.yml': ['PRODUCTION'], 'update-spain-slaughter-census.yml': ['PRODUCTION'], 'update-spain-wine.yml': ['PRODUCTION'], 'update-spain-wine-monthly.yml': ['PRODUCTION'], 'update-spain-wine-balance-historic.yml': ['PRODUCTION'], 'update-mb-cattle.yml': ['PRICE'], 'update-mb-smallstock.yml': ['PRICE'], 'update-us-tariffs.yml': ['TARIFF'], 'update-denmark-depth.yml': ['PRODUCTION', 'PRICE'], 'update-nl-cbs.yml': ['PRODUCTION', 'PRICE'], 'update-nl-rvo.yml': ['PRICE'], 'update-fr-vigieau.yml': ['CLIMATE'], 'update-fr-cereobs.yml': ['CROP'], 'update-usda-calendar.yml': [], 'update-weekly-blog.yml': [], 'update-usda-psd.yml': ['PRODUCTION'], 'update-worldbank-urea.yml': ['INPUT'],
    # no son datos agricolas: noticias (no entran en el brief) y trabajos internos
    'update-news.yml': [], 'update-news-translations.yml': [], 'update-pipeline-status.yml': [], 'update-seo-pages.yml': [], 'update-cap-es.yml': [], 'update-cap-dk.yml': [], 'update-cap-fr.yml': [], 'update-cap-it.yml': [], 'update-cap-pl.yml': [], 'update-eu-sulphur.yml': ['INPUT', 'TRADE'], 'update-eu-fadn.yml': ['INPUT', 'PRODUCTION'], 'update-eu-fish-first-sales.yml': ['PRICE'], 'update-eu-fish-retail-prices.yml': ['PRICE'], 'update-eu-fish-hicp.yml': ['PRICE'], 'update-us-fertilizer-imports.yml': ['INPUT', 'TRADE'], 'update-us-rivers.yml': ['INPUT'], 'update-de-rivers.yml': ['INPUT'], 'update-eu-input-prices.yml': ['INPUT', 'TRADE'], 'update-us-sulphur.yml': ['INPUT', 'TRADE'], 'update-cap-de.yml': [], 'update-cap-nl.yml': [], 'update-cap-pt.yml': [], 'update-cap-el.yml': [], 'update-eu-cap.yml': [], 'update-eu-gapfill.yml': ['PRODUCTION'], 'update-us-nass-extra.yml': ['PRODUCTION', 'PRICE'], 'update-us-climate.yml': ['CLIMATE'], 'update-us-kcfed.yml': ['MACRO'], 'update-us-snotel.yml': ['CLIMATE'], 'update-us-fed.yml': ['MACRO'], 'update-uk-fuel.yml': ['PRICE'], 'update-uk-fv-wholesale.yml': ['PRICE'], 'update-uk-ni-market.yml': ['PRICE'], 'update-uk-scotland.yml': ['PRODUCTION'],  # cap-es: normativa de la PAC (reglas e importes del real decreto), no una serie de datos
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

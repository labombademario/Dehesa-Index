"""Modelo compartido de cobertura (Data Coverage Gap Analysis + Source Discovery Queue).
Solo diccionarios y funciones PURAS sobre el catalogo unificado; no decide nada sobre importancia de mercados: la matriz es tecnica (que hay, que falta, que esta viejo).
Limite declarado: las etiquetas de producto del catalogo son palabras clave derivadas de las etiquetas de serie (heuristica, ver manifest.tagsNote); una celda MISSING significa
'ninguna serie del catalogo con esa etiqueta y ese tipo de metrica', no que el dato no exista en el mundo."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
ARCHIVE_STATES = ('HISTORICAL', 'DISCONTINUED')   # igual que archiveStates de data/freshness-policy.json
OK_STATES = ('LIVE', 'FRESH', 'EXPECTED_DELAY')   # igual que js/freshness.js okStates y scripts/freshness.py

# grupo del catalogo -> tipo de metrica. 'other' = series sin celda de producto (tipos de interes, renta agraria, ecologico, medio ambiente).
GROUP_METRIC = {
  'prices': 'price', 'prices_lv': 'price', 'prices_fv': 'price', 'prices_paid': 'price', 'quotes': 'price', 'meat_regions': 'price', 'milk_regions': 'price', 'product': 'price',
  'eu_cereales': 'price', 'eu_vacuno': 'price', 'eu_fruta': 'price', 'eu_oleaginosas': 'price', 'eu_arroz': 'price', 'eu_lacteos': 'price', 'eu_leche': 'price', 'eu_aceite': 'price',
  'eu_cerdo': 'price', 'eu_huevos': 'price', 'eu_pollo': 'price', 'eu_ovino': 'price', 'eu_vino': 'price', 'eu_azucar': 'price',
  'eu_fertilizantes': 'input_price',
  'idx_perc': 'price_index', 'idx_pag': 'price_index',
  'crops': 'production', 'crops_regions': 'production', 'production': 'production', 'livestock': 'production', 'milk': 'production',
  'trade': 'trade', 'partners': 'trade',
  'stocks': 'stocks',
  'inputs': 'input_price', 'inputs_a': 'input_price', 'inputs_f': 'input_price', 'costs': 'input_price',
  'income': 'other', 'rates': 'other', 'organic': 'other', 'environment': 'other',
}
METRICS = ['price', 'price_index', 'production', 'trade', 'stocks', 'input_price']
KIND_OF = {}
for p in ('wheat', 'maize', 'barley', 'oats', 'rye', 'rice', 'soy', 'rapeseed'): KIND_OF[p] = 'grain'
for p in ('potato', 'sugar', 'fruit', 'wine', 'olive'): KIND_OF[p] = 'crop'
for p in ('cattle', 'pigs', 'sheep', 'poultry', 'eggs'): KIND_OF[p] = 'livestock'
for p in ('milk', 'butter', 'cheese'): KIND_OF[p] = 'dairy'
KIND_OF['fertilizer'] = 'input'; KIND_OF['energy'] = 'energy'
def cell_metric(tag, m):
    """El precio de un insumo (gasoleo, urea) cuenta como precio de insumo: para energia y fertilizantes la metrica 'price' no aplica."""
    return 'input_price' if m == 'price' and KIND_OF.get(tag) in ('energy', 'input') else m
def cell_metrics(tag, m, s):
    """Un indice de precios pagados (grupo inputs*, 'Input price index') es tambien un indice de precios: cuenta como precio de insumo y como price_index."""
    out = [cell_metric(tag, m)]
    if str(s.get('group', '')).startswith('inputs') and 'price index' in str(s.get('label', '')).lower() and 'price_index' not in out: out.append('price_index')
    return out
APPLICABLE = {  # metricas con sentido por tipo de producto (no se cuentan huecos donde la metrica no aplica)
  'grain': ['price', 'price_index', 'production', 'trade', 'stocks'],
  'crop': ['price', 'price_index', 'production', 'trade'],
  'livestock': ['price', 'price_index', 'production', 'trade'],
  'dairy': ['price', 'price_index', 'production', 'trade', 'stocks'],
  'input': ['input_price', 'price_index', 'trade'],
  'energy': ['input_price', 'price_index'],
}
# etiqueta de catalogo -> producto(s) del sitio (data/product-metadata.json); solo orientativo
SITE_PRODUCT = {'wheat': ['trigo'], 'maize': ['maiz'], 'barley': ['cebada'], 'oats': ['avena'], 'rice': ['arroz'], 'soy': ['soja'], 'rapeseed': ['colza'], 'milk': ['leche'],
                'cattle': ['vacuno'], 'pigs': ['cerdo'], 'eggs': ['huevos'], 'fertilizer': ['urea', 'fertilizantes'], 'energy': ['diesel'], 'olive': ['oliva']}
# datos que existen FUERA del catalogo unificado (ficheros USDA con su propio formato). Se comprueban contra el fichero real; no se evalua su frescura.
PSD_COUNTRY = {'United States': 'US', 'Canada': 'CA', 'Australia': 'AU', 'European Union': 'EU', 'United Kingdom': 'UK'}
PSD_PRODUCT = {'trigo': 'wheat', 'maiz': 'maize', 'arroz': 'rice', 'cebada': 'barley', 'soja': 'soy', 'colza': 'rapeseed', 'oliva': 'olive', 'cerdo': 'pigs', 'vacuno': 'cattle',
               'pollo': 'poultry', 'leche': 'milk', 'azucar': 'sugar'}
PSD_METRIC = {'production': 'production', 'area': 'production', 'endingStocks': 'stocks', 'exports': 'trade', 'imports': 'trade'}
GATS_PRODUCT = {'trigo': 'wheat', 'maiz': 'maize', 'arroz': 'rice', 'soja': 'soy', 'cebada': 'barley', 'vacuno': 'cattle', 'cerdo': 'pigs', 'pollo': 'poultry', 'huevos': 'eggs',
                'lacteos': 'milk', 'fertilizantes': 'fertilizer'}
# ficheros USDA con formato propio (fuera del catalogo unificado): la clave de cada serie nombra producto y metrica; se mapea SOLO lo que el fichero contiene de verdad
NASS_CROP_PRODUCT = {'WHEAT': 'wheat', 'CORN': 'maize', 'SOYBEANS': 'soy', 'BARLEY': 'barley', 'OATS': 'oats', 'RICE': 'rice'}   # nass-crops.json: area, produccion, rendimiento
NASS_LIVESTOCK_PRODUCT = {'HOGS': 'pigs', 'PORK': 'pigs', 'CATTLE': 'cattle', 'BEEF': 'cattle', 'VEAL': 'cattle', 'CHICKENS': 'poultry', 'TURKEYS': 'poultry', 'EGGS': 'eggs', 'MILK': 'milk',
                          'CHEESE': 'cheese', 'BUTTER': 'butter', 'LAMB & MUTTON': 'sheep'}
NASS_LIVESTOCK_METRIC = (('STOCKS', 'stocks'), ('PRICE RECEIVED', 'price'), ('INVENTORY', 'production'), ('PRODUCTION', 'production'), ('PIG CROP', 'production'))  # 'OPERATIONS WITH INVENTORY' cuenta explotaciones, no se mapea
AMS_GRAIN_PRODUCT = {'maiz': 'maize', 'soja': 'soy', 'trigo': 'wheat'}                         # ams-grain-daily.json: precios diarios USDA AMS
NASS_PRICES_PRODUCT = (('FERTILIZER', 'fertilizer'), ('FUELS', 'energy'), ('ENERGY', 'energy'))  # nass-prices.json: indices de precios pagados (price_index)
DE_AGRI_PRODUCT = {'wheat': 'wheat', 'rye': 'rye', 'barley': 'barley', 'oats': 'oats', 'maize': 'maize', 'rapeseed': 'rapeseed', 'potato': 'potato', 'sugarbeet': 'sugar'}   # germany-agri.json: produccion nacional/Land de Destatis (cereals, triticale, sunflower y silage no son producto de la matriz)
DE_LIVESTOCK_PRODUCT = {'cattle': 'cattle', 'calves': 'cattle', 'pigs': 'pigs', 'sheep': 'sheep'}   # germany-livestock.json: sacrificios (cabezas y peso de canal)
# Paises Bajos (CBS, data/netherlands-farm.json) y Dinamarca (Danmarks Statistik, data/denmark-depth.json): ficheros de formato propio con cifras nacionales reales.
NL_CROP_PRODUCT = {'A042170': 'wheat', 'A042160': 'barley', 'A042169': 'rye', 'A042164': 'oats', 'A042167': 'maize', 'A042180': 'rapeseed', 'A042355': 'potato', 'A042194': 'sugar'}   # 85636NED, total nacional NL01, produccion
NL_SLAUGHTER_PRODUCT = {'cattle': 'cattle', 'pigs': 'pigs', 'sheep': 'sheep', 'chickens': 'poultry'}   # 7123SLAC: peso en canal (t)
DK_HARVEST_PRODUCT = {'wheat_winter': 'wheat', 'wheat_spring': 'wheat', 'rye': 'rye', 'barley_winter': 'barley', 'barley_spring': 'barley', 'oats': 'oats', 'maize_grain': 'maize', 'rapeseed': 'rapeseed', 'potato_food': 'potato', 'sugarbeet': 'sugar'}   # HST77/HST88, nacional '000'
DK_SLAUGHTER_PRODUCT = {'cattle': 'cattle', 'pigs': 'pigs'}
DK_MILK_PRODUCT = {'milk_total': 'milk', 'butter': 'butter', 'cheese': 'cheese'}
OUTSIDE_NOT_MAPPED = {'ers.json': 'costes de produccion, prevision de renta y IPC/IPP de alimentos del ERS: la metrica input_price no aplica a cereales/ganado en la matriz y la renta/IPC no son un producto',
                      'crop-progress.json': 'progreso y condicion semanal del cultivo (porcentajes): no corresponde a ninguna metrica de la matriz (precio, indice, produccion, comercio, existencias)',
                      'drought.json': 'Drought Monitor por estado: no es un producto ni una metrica de la matriz'}
LIC_RANK = {'VERIFIED': 0, 'PENDING': 1, 'RESTRICTED': 2, 'BLOCKED': 3}

def J(rel, default=None):
    f = D / rel
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else default

def period_key(p):
    """'2026' / '2026-Q2' / '2026-08' / '2026-09-28' -> entero ordenable (YYYYMMDD; periodos gruesos = ultimo mes/dia)."""
    s = str(p or '')
    try:
        y = int(s[:4])
        if len(s) == 4: return y * 10000 + 1231
        if s[5:6] == 'Q': return y * 10000 + int(s[6]) * 300 + 31
        m = int(s[5:7])
        if len(s) == 7: return y * 10000 + m * 100 + 31
        return y * 10000 + m * 100 + int(s[8:10])
    except (ValueError, IndexError): return 0

def entities():
    """Entidades de la matriz: los paises (entityType country) y el agregado UE. Devuelve [(codigo, nombre, entityType, [ficheros de catalogo])]."""
    man = J('catalog/manifest.json'); out = []
    for c, v in man['countries'].items():
        if v['entityType'] == 'country' or c == 'EU':
            files = [v['catalog']]
            f2 = 'catalog/eu/%s.json' % c
            if (D / f2).exists(): files.append(f2)
            out.append((c, v.get('name') or c, v['entityType'], files))
    return sorted(out)

def load_series(files):
    rows = []
    for f in files: rows += J(f)['series']
    return rows

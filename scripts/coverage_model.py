"""Modelo compartido de cobertura (Data Coverage Gap Analysis + Source Discovery Queue).
Solo diccionarios y funciones PURAS sobre el catalogo unificado; no decide nada sobre importancia de mercados: la matriz es tecnica (que hay, que falta, que esta viejo).
Limite declarado: las etiquetas de producto del catalogo son palabras clave derivadas de las etiquetas de serie (heuristica, ver manifest.tagsNote); una celda MISSING significa
'ninguna serie del catalogo con esa etiqueta y ese tipo de metrica', no que el dato no exista en el mundo."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
OK_STATES = ('LIVE', 'FRESH', 'EXPECTED_DELAY')   # igual que js/freshness.js okStates y scripts/freshness.py

# grupo del catalogo -> tipo de metrica. 'other' = series sin celda de producto (tipos de interes, renta agraria, ecologico, medio ambiente).
GROUP_METRIC = {
  'prices': 'price', 'prices_lv': 'price', 'prices_fv': 'price', 'prices_paid': 'price', 'quotes': 'price', 'meat_regions': 'price', 'milk_regions': 'price', 'product': 'price',
  'eu_cereales': 'price', 'eu_vacuno': 'price', 'eu_fruta': 'price', 'eu_oleaginosas': 'price', 'eu_arroz': 'price', 'eu_lacteos': 'price', 'eu_leche': 'price', 'eu_aceite': 'price',
  'eu_cerdo': 'price', 'eu_huevos': 'price', 'eu_pollo': 'price', 'eu_ovino': 'price', 'eu_vino': 'price', 'eu_azucar': 'price',
  'eu_fertilizantes': 'input_price',
  'idx_perc': 'price_index', 'idx_pag': 'price_index',
  'crops': 'production', 'production': 'production', 'livestock': 'production', 'milk': 'production',
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

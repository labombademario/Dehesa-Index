#!/usr/bin/env python3
"""data/worldbank-agri.json — perfil agrario, comercio agrario, precios/macro y medio ambiente agrario por pais (Banco Mundial, WDI).
Cada indicador se comprueba contra sus metadatos oficiales (License_Type): solo se publica si dice CC BY-4.0; si no, se descarta y queda en el log.
Si un indicador falla en una ejecucion, se conserva el valor anterior (nunca se rellena ni se estima)."""
import json, os, sys, time, datetime, urllib.request

WB = {'US': 'USA', 'ES': 'ESP', 'FR': 'FRA', 'DE': 'DEU', 'BE': 'BEL', 'AT': 'AUT', 'PT': 'PRT', 'IT': 'ITA', 'DK': 'DNK', 'NL': 'NLD', 'CA': 'CAN', 'AU': 'AUS', 'EU': 'EUU'}
EURO = {'ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'NL'}
FIRST = 1990
# clave -> (codigo WDI, grupo)
IND = {
    'agriLandPct': ('AG.LND.AGRI.ZS', 'structure'), 'agriLandKm2': ('AG.LND.AGRI.K2', 'structure'), 'arableLandPct': ('AG.LND.ARBL.ZS', 'structure'),
    'arablePerCap': ('AG.LND.ARBL.HA.PC', 'structure'), 'irrigatedPct': ('AG.LND.IRIG.AG.ZS', 'structure'), 'agriEmploymentPct': ('SL.AGR.EMPL.ZS', 'structure'),
    'agriVaPerWorker': ('NV.AGR.EMPL.KD', 'structure'), 'agriVaUsd': ('NV.AGR.TOTL.CD', 'structure'), 'agriVaPct': ('NV.AGR.TOTL.ZS', 'structure'),
    'cerealYield': ('AG.YLD.CREL.KG', 'yield'), 'cerealArea': ('AG.LND.CREL.HA', 'yield'), 'cerealProd': ('AG.PRD.CREL.MT', 'yield'), 'fertKgHa': ('AG.CON.FERT.ZS', 'yield'),
    'cropIdx': ('AG.PRD.CROP.XD', 'indices'), 'livestockIdx': ('AG.PRD.LVSK.XD', 'indices'), 'foodIdx': ('AG.PRD.FOOD.XD', 'indices'),
    'agriRawExpPct': ('TX.VAL.AGRI.ZS.UN', 'trade'), 'agriRawImpPct': ('TM.VAL.AGRI.ZS.UN', 'trade'), 'foodExpPct': ('TX.VAL.FOOD.ZS.UN', 'trade'), 'foodImpPct': ('TM.VAL.FOOD.ZS.UN', 'trade'),
    'cpi': ('FP.CPI.TOTL', 'macro'), 'inflation': ('FP.CPI.TOTL.ZG', 'macro'), 'fxUsd': ('PA.NUS.FCRF', 'macro'), 'gdpGrowth': ('NY.GDP.MKTP.KD.ZG', 'macro'),
    'ch4Agri': ('EN.GHG.CH4.AG.MT.CE.AR5', 'environment'), 'n2oAgri': ('EN.GHG.N2O.AG.MT.CE.AR5', 'environment'), 'waterAgriPct': ('ER.H2O.FWAG.ZS', 'environment'),
}
OK_LICENSE = 'CC BY-4.0'
LOG = []

def log(m):
    LOG.append(datetime.datetime.utcnow().strftime('%H:%M:%S ') + m); print(m)

def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'DehesaIndex/1.0'}), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            log('  error %s: %s' % (url[:100], e)); time.sleep(3 * (i + 1))
    return None

old = {}
try: old = json.load(open('data/worldbank-agri.json'))
except Exception: pass
old_ind, old_c = old.get('indicators', {}), old.get('countries', {})

src = get('https://api.worldbank.org/v2/source/2?format=json')
try: wdi_updated = src[1][0]['lastupdated']
except Exception: wdi_updated = None

indicators, countries = {}, {c: {} for c in WB}
inv = {v: c for c, v in WB.items()}
for key, (code, group) in IND.items():
    meta = get('https://api.worldbank.org/v2/sources/2/series/%s/metadata?format=json' % code)
    mt = {}
    try: mt = {x['id']: x['value'] for x in meta['source'][0]['concept'][0]['variable'][0]['metatype']}
    except Exception: pass
    lic = mt.get('License_Type')
    if lic is None and key in old_ind: lic = old_ind[key].get('license')  # metadatos caidos: se mantiene lo ya comprobado
    if lic != OK_LICENSE:
        log('%s (%s): licencia %r, descartado' % (key, code, lic)); continue
    d = get('https://api.worldbank.org/v2/country/%s/indicator/%s?format=json&per_page=20000&date=%d:%d' % (';'.join(WB.values()), code, FIRST, datetime.date.today().year))
    rows = d[1] if d and len(d) > 1 and d[1] else None
    if not rows:
        if key in old_ind:
            indicators[key] = old_ind[key]
            for c in WB:
                if key in old_c.get(c, {}): countries[c][key] = old_c[c][key]
            log('%s: sin respuesta, se conserva lo anterior' % key)
        else: log('%s: sin datos' % key)
        continue
    byc = {}
    for r in rows:
        c = inv.get(r.get('countryiso3code'))
        if not c or r.get('value') is None: continue
        y = int(r['date'])
        if key == 'fxUsd' and (c == 'US' or (c in EURO and y < 1999)): continue  # EE. UU. = 1; antes de 1999 el WB usa la moneda nacional anterior al euro
        byc.setdefault(c, {})[y] = r['value']
    n = 0
    for c, ys in byc.items():
        y0, y1 = min(ys), max(ys)
        countries[c][key] = {'y0': y0, 'v': [ys.get(y) for y in range(y0, y1 + 1)]}; n += 1
    name = ''
    try: name = d[1][0]['indicator']['value']
    except Exception: pass
    indicators[key] = {'code': code, 'group': group, 'name': name, 'unit': mt.get('Unitofmeasure') or '', 'license': lic, 'origin': (mt.get('Source') or '').split('\n')[0][:160]}
    log('%s: %d paises' % (key, n))

if len(indicators) < 20:
    log('muy pocos indicadores (%d); no se escribe' % len(indicators))
    open('data/worldbank-agri-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
       'source': {'id': 'world_bank_wdi', 'name': 'World Bank - World Development Indicators', 'url': 'https://data.worldbank.org/indicator', 'license': 'CC BY 4.0', 'licenseUrl': 'https://datacatalog.worldbank.org/public-licenses#cc-by', 'wdiLastUpdated': wdi_updated},
       'indicators': indicators, 'countries': countries}
os.makedirs('data', exist_ok=True)
open('data/worldbank-agri-log.txt', 'w').write('\n'.join(LOG) + '\n')
json.dump(doc, open('data/worldbank-agri.json', 'w'), ensure_ascii=False, separators=(',', ':'))
log('ok: %d indicadores' % len(indicators))

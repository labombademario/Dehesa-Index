#!/usr/bin/env python3
"""Eurostat, temas que el resto de pipelines no cubren, para FR ES PT EL BE NL DE IT -> data/eurostat-structure-stats.json (countries.XX, extend)
  * Tierra: precio de la tierra agricola (apri_lprc: arable, regadio, secano, prados) y alquiler (apri_lrnt) en EUR/ha. ES solo trae precios de este tema por su pipeline propio y el alquiler de ES NO se publica
    (Eurostat da +54 % en 2024 y el MAPA +4 %: ver data/spain-land).
  * Estructura de explotaciones (censo agrario 2023 y anteriores; ef_fsi_*): numero de explotaciones y por tamaño, usos de la tierra, regimen de tenencia (propiedad/arrendamiento), edad de los jefes, formacion, mano de obra, regadio, carga ganadera.
  * Plaguicidas (sdg_02_53, aei_pestsal_rsk), selvicultura (for_basic, for_eco_cp) y produccion ecologica en toneladas (org_croppro).
Nada se estima: lo que Eurostat no publica para un pais se queda sin serie. Series con <3 puntos o paradas (ultimo dato anterior a año-3) se omiten (eurostat_country.put).
Uso: update-eurostat-structure.py [XX ...]"""
import datetime, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_breaks import clean as _clean_breaks
import eurostat_country as E
C = {'FR': 'France', 'ES': 'Spain', 'PT': 'Portugal', 'EL': 'Greece', 'BE': 'Belgium', 'NL': 'Netherlands', 'DE': 'Germany', 'IT': 'Italy'}
SRC = {'name': 'Eurostat (official national data via the European Statistical System)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
def put(sid, *a, **k): return E.put(E.CFG['pfx'] + '-es-' + sid, *a, **k)
def pts(recs, f):
    d = {}
    for r, v in recs:
        k = f(r)
        if k is not None: d.setdefault(k, []).append((r['time'], v))
    return d
SKIP_PRICE = {}   # Portugal ya no se omite (15-oct): Eurostat lo publica como dato oficial (arable 76.556 EUR/ha en 2024); se muestra con aviso en la etiqueta: valor muy superior al del resto de paises y sin contraste con fuente nacional
def land():
    cc = E.CFG['geo']
    LP = {'ARA': 'arable land', 'ARAIB': 'irrigable arable land', 'ARAXIB': 'non-irrigable arable land', 'J0000': 'permanent grassland'}
    LR = {'ARA_J0000': 'arable land and/or permanent grassland', 'ARA': 'arable land', 'J0000': 'permanent grassland'}
    PRIO = ['ARA_J0000', 'ARA', 'ARAIB', 'ARAXIB', 'J0000']
    n = 0
    def emit(kind, ds, names, label, recs):
        k = 0; groups = {}
        for code, p in pts(recs, lambda r: r['agriprod']).items():
            groups.setdefault(tuple(sorted(set((a, b) for a, b in p))), []).append(code)
        for key, codes in groups.items():
            codes.sort(key=lambda c: PRIO.index(c) if c in PRIO else 9)
            code = codes[0]; nm = names.get(code, code)
            if len(codes) > 1: nm = 'arable land and permanent grassland (single value)'
            k += put('st-land-%s-%s' % (kind, code.lower()), 'inputs', label % nm, 'EUR/ha', 'annual', list(key), 'Eurostat %s %s' % (ds, '+'.join(codes)))
        return k
    if cc != 'ES':   # España: el precio ya sale de su pipeline propio y el alquiler lo publica el MAPA
        if cc in SKIP_PRICE: E.log(cc, 'precio de la tierra omitido:', SKIP_PRICE[cc])
        else:
            recs, _ = E.es('apri_lprc', unit='EUR_HA'); n += emit('price', 'apri_lprc', LP, 'Agricultural land price: %s (EUR/ha, Eurostat' + ('; as reported by Portugal, far above other EU countries and not cross-checked with a national source' if cc == 'PT' else '') + ')', recs)
        recs, _ = E.es('apri_lrnt', unit='EUR_HA'); n += emit('rent', 'apri_lrnt', LR, 'Agricultural land rent, one year: %s (EUR/ha, Eurostat)', recs)
    E.log(cc, 'tierra', n)
BANDS = {'HA_GT0_LT2': '0-2 ha', 'HA2-4': '2-5 ha', 'HA5-9': '5-10 ha', 'HA10-19': '10-20 ha', 'HA20-29': '20-30 ha', 'HA30-49': '30-50 ha', 'HA50-99': '50-100 ha', 'HA100-249': '100-250 ha', 'HA_GE250': '250 ha or more'}
AGES = {'Y_LT25': 'under 25', 'Y25-34': '25 to 34', 'Y35-44': '35 to 44', 'Y45-54': '45 to 54', 'Y55-64': '55 to 64', 'Y_GE65': '65 or over'}
def structure():
    cc = E.CFG['geo']; n = 0
    recs, _ = E.es('ef_fsi_farms', unit='HLD')
    for k, p in pts(recs, lambda r: r['uaarea'] if r['uaarea'] == 'TOTAL' else None).items():
        n += put('st-farms', 'production', 'Agricultural holdings: number (farm structure survey / census, Eurostat)', 'holdings', 'annual', p, 'Eurostat ef_fsi_farms TOTAL')
    recs, _ = E.es('ef_fsi_farms', unit='PC')
    for k, p in pts(recs, lambda r: r['uaarea'] if r['uaarea'] in BANDS else None).items():
        n += put('st-farms-size-' + k.lower(), 'production', 'Holdings by size, %s of UAA (%% of holdings, Eurostat)' % BANDS[k], '%', 'annual', p, 'Eurostat ef_fsi_farms %s' % k)
    recs, _ = E.es('ef_fsi_lus', so_eur='TOTAL', unit='HA')
    LU = {'FA': 'farm area', 'UAA': 'utilised agricultural area', 'ARA': 'arable land', 'J0000T': 'permanent grassland (outdoor)', 'PECR': 'permanent crops', 'UAAXK0000_ORG': 'organic and in conversion area'}
    for k, p in pts(recs, lambda r: r['crops'] if r['crops'] in LU else None).items():
        n += put('st-landuse-' + k.lower(), 'crops', 'Land use: %s (ha, farm structure survey, Eurostat)' % LU[k], 'ha', 'annual', p, 'Eurostat ef_fsi_lus %s' % k)
    for unit, uname, un in (('HA', 'ha', 'ha'), ('PC', '% of UAA', '%')):
        recs, _ = E.es('ef_fsi_tenure', uaarea='TOTAL', age='TOTAL', unit=unit)
        TN = {'OWN': 'owned', 'RENT': 'rented', 'CML': 'common land', 'SHR_OTH': 'shared or other tenure'}
        for k, p in pts(recs, lambda r: r['tenure'] if r['tenure'] in TN else None).items():
            n += put('st-tenure-%s-%s' % (k.lower(), unit.lower()), 'production', 'Tenure of utilised agricultural area: %s (%s, Eurostat)' % (TN[k], uname), un, 'annual', p, 'Eurostat ef_fsi_tenure %s %s' % (k, unit))
    recs, _ = E.es('ef_fsi_agesex', so_eur='TOTAL', sex='T', unit='HLD')
    for k, p in pts(recs, lambda r: r['age'] if r['age'] in AGES else None).items():
        n += put('st-mgr-age-' + k.lower(), 'production', 'Farm managers aged %s (number of holdings, Eurostat)' % AGES[k], 'holdings', 'annual', p, 'Eurostat ef_fsi_agesex %s' % k)
    recs, _ = E.es('ef_fsi_training', age='TOTAL', unit='PC')
    TR = {'FULL': 'full agricultural training', 'BASIC': 'basic training', 'PRACT': 'practical experience only'}
    for k, p in pts(recs, lambda r: r['training'] if r['training'] in TR else None).items():
        n += put('st-training-' + k.lower(), 'production', 'Farm managers with %s (%% of managers, Eurostat)' % TR[k], '%', 'annual', p, 'Eurostat ef_fsi_training %s' % k)
    recs, _ = E.es('ef_fsi_lf', sex='T', wstatus='TOTAL')
    for k, p in pts(recs, lambda r: r['unit'] if r['unit'] in ('AWU', 'PER', 'AVG') else None).items():
        nm = {'AWU': ('Farm labour force: total (annual work units, Eurostat)', 'AWU'), 'PER': ('Farm labour force: total (persons, Eurostat)', 'persons'), 'AVG': ('Farm labour force: average per holding (persons, Eurostat)', 'persons per holding')}[k]
        n += put('st-labour-' + k.lower(), 'income', nm[0], nm[1], 'annual', p, 'Eurostat ef_fsi_lf TOTAL %s' % k)
    recs, _ = E.es('ef_fsi_irri', unit='HA')
    IR = {'UAA_IB': 'irrigable', 'UAA_IT': 'irrigated'}
    for k, p in pts(recs, lambda r: r['irr_area'] if r['irr_area'] in IR else None).items():
        n += put('st-irri-' + k.lower(), 'crops', 'Utilised agricultural area, %s (ha, Eurostat)' % IR[k], 'ha', 'annual', p, 'Eurostat ef_fsi_irri %s' % k)
    recs, _ = E.es('ef_fsi_lskds', unit='RAT')
    for k, p in pts(recs, lambda r: 'x').items():
        n += put('st-lsu-density', 'livestock', 'Livestock density (livestock units per ha of UAA, Eurostat)', 'LSU/ha', 'annual', p, 'Eurostat ef_fsi_lskds')
    E.log(cc, 'estructura', n)
def pesticides():
    cc = E.CFG['geo']; n = 0
    recs, _ = E.es('sdg_02_53')
    for k, p in pts(recs, lambda r: 'x').items():
        n += put('st-pest-risk-idx', 'environment', 'Use and risk of chemical pesticides: harmonised risk indicator (index 2015-2017 = 100, Eurostat)', 'index 2015-17=100', 'annual', p, 'Eurostat sdg_02_53')
    recs, labs = E.es('aei_pestsal_rsk', unit='KG')
    for k, p in pts(recs, lambda r: r['subst_cat']).items():
        n += put('st-pest-sales-' + k.lower(), 'environment', 'Pesticide sales: %s (tonnes of active substance, Eurostat)' % E.clean(labs['subst_cat'][k]), 't', 'annual', p, 'Eurostat aei_pestsal_rsk %s' % k, 0.001)
    E.log(cc, 'plaguicidas', n)
EMI = {'GHG': ('greenhouse gases, total', 'thousand t CO2e'), 'CH4_CO2E': ('methane', 'thousand t CO2e'), 'N2O_CO2E': ('nitrous oxide', 'thousand t CO2e'), 'CO2': ('carbon dioxide', 'thousand t'), 'NH3': ('ammonia', 'thousand t')}
def emissions():
    cc = E.CFG['geo']; n = 0
    for k, (nm, un) in EMI.items():
        try: recs, _ = E.es('env_ac_ainah_r2', nace_r2='A', unit='THS_T', airpol=k)
        except Exception as e: E.log(cc, 'emisiones', k, 'no disponible', repr(e)[:80]); continue
        for kk, p in pts(recs, lambda r: 'x').items():
            n += put('st-emis-' + k.lower(), 'environment', 'Air emissions of agriculture, forestry and fishing (NACE A): %s (%s, Eurostat)' % (nm, un), un, 'annual', p, 'Eurostat env_ac_ainah_r2 A %s' % k)
    E.log(cc, 'emisiones', n)
def forestry():
    cc = E.CFG['geo']; n = 0
    recs, labs = E.es('for_basic', treespec='TOTAL', stk_flow='PRD', unit='THS_M3')
    for k, p in pts(recs, lambda r: r['prod_wd'] if r['prod_wd'] in ('RW', 'RW_FW', 'RW_IN') else None).items():
        n += put('st-wood-' + k.lower(), 'production', '%s: production (thousand m3, Eurostat)' % E.clean(labs['prod_wd'][k]), 'thousand m3', 'annual', p, 'Eurostat for_basic %s PRD' % k)
    recs, labs = E.es('for_eco_cp', unit='MIO_EUR')
    for k, p in pts(recs, lambda r: r['for_acc'] if r['for_acc'] in ('P1', 'B1G', 'B2A3N') else None).items():
        n += put('st-forest-' + k.lower(), 'income', 'Forestry, %s (EUR million, current prices, Eurostat)' % E.clean(labs['for_acc'][k]).lower(), 'EUR million', 'annual', p, 'Eurostat for_eco_cp %s' % k)
    E.log(cc, 'selvicultura', n)
ORGK = re.compile(r'wheat|barley|maize|oats|rye|rice|cereals for|potato|sugar beet|rape|sunflower|soya|olive|grape|citrus|vegetables|fruit|pulses', re.I)
def organic():
    cc = E.CFG['geo']; n = 0
    recs, labs = E.es('org_croppro', unit='T')
    for k, p in pts(recs, lambda r: r['crops'] if ORGK.search(E.clean(labs['crops'][r['crops']])) and not E.NEC.search(E.clean(labs['crops'][r['crops']])) else None).items():
        n += put('st-orgprod-' + k.lower(), 'organic', 'Organic production: %s (tonnes, Eurostat)' % E.clean(labs['crops'][k]), 't', 'annual', p, 'Eurostat org_croppro %s' % k)
    E.log(cc, 'ecologico', n)
only = [a for a in sys.argv[1:] if a in C]
out = {}
for cc in (only or C):
    E.CFG = {'geo': cc, 'pfx': cc.lower()}; E.OUT.clear()
    for fn in (land, structure, pesticides, emissions, forestry, organic):
        try: fn()
        except Exception as e: E.log('ERROR', cc, fn.__name__, repr(e)[:300])
    E.log(cc, 'series', len(E.OUT))
    if len(E.OUT) >= 15: out[cc] = {'name': C[cc], 'extend': True, 'source': dict(SRC), 'series': sorted(E.OUT.values(), key=lambda s: s['id'])}
    else: E.log('sin datos suficientes', cc)
open('data/eurostat-structure-log.txt', 'w').write('\n'.join(E.LOG) + '\n')
if not out: sys.exit(1)
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
json.dump(_clean_breaks({'schemaVersion': 1, 'generatedAt': now, 'countries': out, 'log': E.LOG[-30:]}), open('data/eurostat-structure-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('paises', len(out), 'series', sum(len(v['series']) for v in out.values()))

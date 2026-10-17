#!/usr/bin/env python3
"""Eurostat, series nacionales adicionales (24 paises + agregado UE) -> data/eurostat-more-stats.json (countries.XX, extend)
Previsiones y mensuales: porcino y vacuno/ovino/caprino con previsiones hasta 2027 (apro_mt_ppighq, apro_mt_pcatlhs), aves (apro_ec_poulm) y carne con comercio mensual (apro_mt_pheadm).
Ambiente: uso de pesticidas (aei_pestuse), erosion del suelo (aei_pr_soiler), agua captada por sector (env_wat_abs), aves de campo (env_bio2), desperdicio alimentario (env_wasfw).
Silvicultura ampliada: propiedad, aserrado, papel, empleo, superficie y volumen (for_*). Energia: precio del gas y la electricidad para empresas (nrg_pc_203, nrg_pc_205) y comercio de biocombustibles (nrg_ti_bio, nrg_te_bio).
Menores: industrias lacteas y leche de granja (apro_mk_str*, apro_mk_farm), acuicultura: insumo de la acuicultura de captura y produccion de criaderos en fase de huevo y de juveniles (fish_aq3, fish_aq4a, fish_aq4b), procesadores ecologicos (org_cpreact) y sacrificio ecologico (apro_mt_porg).
Solo UE: superficie incorporada en el comercio (env_landfp_*) y stocks pesqueros sostenibles (env_bio5).
Licencia: politica de reutilizacion de Eurostat (Decision 2011/833/UE), ya registrada (fuente 'eurostat'). Nada se estima ni se convierte: las cifras y las unidades son las que publica Eurostat.
Las etiquetas salen de las del propio Eurostat (sin traducir; las traduce js/label-tl.js). Series con <3 puntos o paradas (ultimo dato anterior a ano-3) se omiten (eurostat_country.put).
Las previsiones (periodos futuros) se rotulan como tales en periodNote.
Uso: update-eurostat-more.py [XX ...]   (--test: un solo pais, a data/eurostat-more-test.json)"""
import datetime, json, os, re, sys, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eurostat_country as E
from lib_breaks import clean as _clean_breaks   # rupturas de serie (cambios de unidad): ver scripts/lib_breaks.py
C = {'ES': 'Spain', 'FR': 'France', 'DE': 'Germany', 'BE': 'Belgium', 'AT': 'Austria', 'PT': 'Portugal', 'IT': 'Italy', 'DK': 'Denmark', 'NL': 'Netherlands',
     'PL': 'Poland', 'EL': 'Greece', 'IE': 'Ireland', 'FI': 'Finland', 'BG': 'Bulgaria', 'HR': 'Croatia', 'LT': 'Lithuania', 'SK': 'Slovakia', 'CZ': 'Czechia',
     'EE': 'Estonia', 'HU': 'Hungary', 'LV': 'Latvia', 'RO': 'Romania', 'SE': 'Sweden', 'SI': 'Slovenia', 'EU': 'European Union'}
GEO = {'EU': 'EU27_2020'}
SRC = {'name': 'Eurostat (forecasts, monthly series, environment, forestry, energy, dairy, aquaculture and organic statistics)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
FC = 'Forecast: the periods after the last observed one are Eurostat forecasts, not observations.'
GIP = FC + ' Gross indigenous production = slaughterings + exports of live animals - imports of live animals, so it can be negative when imports exceed slaughter.'
DSL = ['']   # titulo de la ultima tabla pedida
SKIP_DIMS = ('freq', 'geo', 'time', 'unit')

def es(ds, nogeo=False, **flt):
    """como eurostat_country.es pero con filtros de lista (varios valores del mismo parametro)"""
    q = 'lang=EN' + ('' if nogeo else '&geo=' + E.CFG['geo'])   # las tablas de la UE entera (env_landfp_*, env_bio5) no tienen dimension geo
    for k, v in flt.items():
        for x in (v if isinstance(v, list) else [v]): q += '&%s=%s' % (k, urllib.parse.quote(x))
    j = json.loads(E.get(E.API + ds + '?' + q)); ids, size = j['id'], j['size']; cats = {}; labs = {}; DSL[0] = nice(j.get('label') or ds)   # titulo oficial de la tabla
    for d in ids:
        c = j['dimension'][d]['category']; idx = c['index']; o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        cats[d] = o; labs[d] = c.get('label', {})
    out = []
    for k, v in j.get('value', {}).items():
        k = int(k); rec = {}
        for d, n in reversed(list(zip(ids, size))): rec[d] = cats[d][k % n]; k //= n
        out.append((rec, v))
    return out, labs

def safe(ds, dim, values, **flt):
    """una peticion por valor de `dim`: si Eurostat rechaza un codigo (400), se salta solo ese; devuelve (registros, etiquetas)"""
    recs, labs = [], {}
    for v in values:
        try: r, l = es(ds, **dict(flt, **{dim: v}))
        except Exception as e: E.log('  codigo rechazado', ds, dim, v, repr(e)[-60:]); continue
        recs += r
        for d, m in l.items(): labs.setdefault(d, {}).update(m)
    return recs, labs

def freq_of(p):
    p = str(p)
    if re.fullmatch(r'\d{4}', p): return 'annual'
    if re.fullmatch(r'\d{4}-Q\d', p): return 'quarterly'
    if re.fullmatch(r'\d{4}-S\d', p): return 'semiannual'
    if re.fullmatch(r'\d{4}-\d{2}', p): return 'monthly'
    return None

def pend(p):
    """ultimo dia del periodo (para separar lo observado de lo previsto)"""
    p = str(p); y = int(p[:4])
    if len(p) == 4: return datetime.date(y, 12, 31)
    if p[5] == 'Q': m = int(p[6]) * 3
    elif p[5] == 'S': m = int(p[6]) * 6
    else: m = int(p[5:7])
    return (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1))

def nice(l): return E.clean(l).replace(' - ', ', ')
def sid(*a): return '-'.join(re.sub(r'[^a-z0-9]+', '', str(x).lower().replace('-', '_')) or 'x' for x in a)

def gen(recs, labs, tag, group, title, src, note=None, maxn=60, drop=(), unit_label=None, only_units=None):
    """Convierte registros de Eurostat en series: una por combinacion de las dimensiones que varian (salvo freq, geo, time, unit). El texto sale de las etiquetas de Eurostat."""
    title = title or DSL[0]
    dims = sorted({d for r, _ in recs for d in r} - set(SKIP_DIMS) - set(drop))
    vary = [d for d in dims if len({r[d] for r, _ in recs}) > 1]
    by = {}
    for r, v in recs:
        if v is None: continue
        u = r.get('unit', '')
        if only_units and u not in only_units: continue
        by.setdefault((tuple(r[d] for d in vary), u), []).append((r['time'], v))
    n = 0; rows = sorted(by.items(), key=lambda kv: -max(len(kv[1]), 0))
    for (codes, u), pts in rows[:maxn]:
        fr = freq_of(pts[0][0])
        if not fr: continue
        parts = [nice(labs[d].get(c, c)) for d, c in zip(vary, codes)]
        ul = nice(labs.get('unit', {}).get(u, u)) if u else (unit_label or '')
        if not ul and 'indic_ag' in dims:   # tablas sin dimension de unidad (estructura lactea): la unidad es la del indicador (p. ej. numero de empresas)
            ia = {r['indic_ag'] for r, _ in recs if r.get('indic_ag')}
            if len(ia) == 1: ul = nice(labs['indic_ag'].get(next(iter(ia)), ''))
        if not ul: E.log('  sin unidad, se omite', tag, codes); continue   # sin unidad publicada no hay serie: no se inventa
        ttl = '%s%s (%s, Eurostat)' % (title, (': ' + ', '.join(parts)) if parts else '', ul) if ul else '%s%s (Eurostat)' % (title, (': ' + ', '.join(parts)) if parts else '')
        nt = None if note == FC else note
        today = datetime.date.today(); past = [(p, v) for p, v in pts if pend(p) <= today]; fut = sorted((p, v) for p, v in pts if pend(p) > today)
        k = E.CFG['pfx'] + '-mo-' + sid(tag, *codes, u)
        ok = E.put(k, group, ttl, ul or unit_label or '', fr, past, '%s %s' % (src, ' '.join(codes)), note=nt)
        if ok and fut:   # lo previsto (periodos aun no terminados) va aparte: el resto de comprobaciones del catalogo no admite fechas futuras
            E.OUT[k]['forecast'] = [[p, round(v, 3)] for p, v in fut]; E.OUT[k]['periodNote'] = FC
        n += ok
    return n

def run(name, fn):
    try: n = fn(); E.log(name, n, 'series')
    except Exception as e: E.log('ERROR', E.CFG['geo'], name, repr(e)[:300])

def forecasts():
    n = 0
    r, l = es('apro_mt_ppighq', sinceTimePeriod='2015-Q1'); n += gen(r, l, 'ppighq', 'production', 'Gross indigenous production, forecast (pigs)', 'Eurostat apro_mt_ppighq', GIP)
    r, l = es('apro_mt_pcatlhs', sinceTimePeriod='2015-S1'); n += gen(r, l, 'pcatlhs', 'production', 'Gross indigenous production, forecast (cattle, sheep, goats)', 'Eurostat apro_mt_pcatlhs', GIP)
    return n
def monthlies():
    n = 0
    r, l = es('apro_ec_poulm', hatchitm='CU', sinceTimePeriod='2015-01'); n += gen(r, l, 'poulm', 'production', 'Poultry, monthly', 'Eurostat apro_ec_poulm')
    r, l = safe('apro_mt_pheadm', 'meat', ['B1000', 'B3100', 'B4000', 'B7000'], meatitem=['SLAUGHT', 'EXP', 'IMP'], unit='THS_T', sinceTimePeriod='2015-01')
    n += gen(r, l, 'pheadm', 'trade', 'Meat, monthly', 'Eurostat apro_mt_pheadm')
    return n
def environment():
    n = 0
    r, l = es('aei_pestuse', crops='C0000', unit='KG', sinceTimePeriod='2005'); n += gen(r, l, 'pestuse', 'environment', 'Pesticide use on cereals', 'Eurostat aei_pestuse', maxn=12)
    r, l = es('aei_pr_soiler', levels='MOD_SEV', clc18=['CLC2X23', 'CLC23_321', 'CLC2_321', 'CLC2_3X331_332_335'], unit='PC'); n += gen(r, l, 'soiler', 'environment', 'Soil erosion by water, moderate to severe, share of area', 'Eurostat aei_pr_soiler')
    r, l = es('env_wat_abs', wat_proc=['ABST', 'ABS_PWS', 'ABS_AGR', 'ABS_AGR_IR', 'ABS_IND'], wat_src='FRW', unit='MIO_M3', sinceTimePeriod='2000'); n += gen(r, l, 'watabs', 'environment', 'Freshwater abstraction', 'Eurostat env_wat_abs')
    r, l = es('env_bio2', sinceTimePeriod='2000'); n += gen(r, l, 'bio2', 'environment', 'Farmland bird index', 'Eurostat env_bio2', maxn=6)
    r, l = es('env_wasfw', nace_r2=['A01_A03_FOOD', 'HH'], unit='KG_HAB', sinceTimePeriod='2018'); n += gen(r, l, 'wasfw', 'environment', 'Food waste', 'Eurostat env_wasfw')
    return n
def forestry():
    n = 0
    r, l = safe('for_owner', 'owner', ['PRV', 'PUB'], treespec='TOTAL', sinceTimePeriod='2000'); n += gen(r, l, 'owner', 'production', 'Forestry, ownership', 'Eurostat for_owner', maxn=12)
    r, l = es('for_swpan', prod_wd='SN', stk_flow='PRD', treespec='TOTAL', unit='THS_M3', sinceTimePeriod='2000'); n += gen(r, l, 'swpan', 'production', 'Forestry, sawnwood production', 'Eurostat for_swpan', maxn=6)
    r, l = safe('for_pp', 'prod_wd', ['PL', 'PA'], stk_flow='PRD', unit='THS_T', sinceTimePeriod='2000'); n += gen(r, l, 'pp', 'production', 'Forestry, pulp and paper production', 'Eurostat for_pp', maxn=8)
    r, l = es('for_emp_lfs', sex='T', isced11='TOTAL', wstatus='EMP', nace_r2='A02', sinceTimePeriod='2005'); n += gen(r, l, 'emplfs', 'production', 'Forestry employment', 'Eurostat for_emp_lfs', maxn=4)
    r, l = safe('for_area', 'indic_fo', ['FOR', 'FAWS', 'OWL'], sinceTimePeriod='2000'); n += gen(r, l, 'area', 'production', 'Forest area', 'Eurostat for_area', maxn=6)
    r, l = safe('for_vol', 'indic_fo', ['GS_FOR', 'GS_FAWS'], sinceTimePeriod='2000'); n += gen(r, l, 'vol', 'production', 'Growing stock volume of forest', 'Eurostat for_vol', maxn=6)
    r, l = safe('for_irass', 'stk_flow', ['EXP', 'IMP'], prod_wd='RW_IN_LG', unit='THS_M3', treespec='TOTAL', sinceTimePeriod='2000'); n += gen(r, l, 'irass', 'trade', 'Forestry, industrial roundwood trade', 'Eurostat for_irass', maxn=6)
    r, l = safe('for_irspec', 'stk_flow', ['EXP', 'IMP'], prod_wd='RW_IN', treespec=['CONIF', 'NCONIF', 'C_FIR', 'C_PIN', 'NC_OAK', 'NC_BEE', 'NC_BIR'], unit='THS_M3', sinceTimePeriod='2000'); n += gen(r, l, 'irspec', 'trade', 'Forestry, industrial roundwood trade by species', 'Eurostat for_irspec', maxn=16)
    r, l = safe('for_awu', 'wstatus', ['EMP', 'SELF'], unit='THS_AWU', sinceTimePeriod='2000'); n += gen(r, l, 'awu', 'production', 'Forestry, annual work units', 'Eurostat for_awu', maxn=4)
    return n
def energy():
    n = 0
    r, l = es('nrg_pc_205', nrg_cons=['MWH_LT20', 'MWH20-499'], unit='KWH', tax='X_VAT', currency='EUR', sinceTimePeriod='2007-S1'); n += gen(r, l, 'nrgel', 'inputs', 'Electricity price for non-household consumers, excluding VAT', 'Eurostat nrg_pc_205', maxn=6)
    r, l = es('nrg_pc_203', nrg_cons=['GJ_LT1000', 'GJ1000-9999'], unit='KWH', tax='X_VAT', currency='EUR', sinceTimePeriod='2007-S1'); n += gen(r, l, 'nrggas', 'inputs', 'Natural gas price for non-household consumers, excluding VAT', 'Eurostat nrg_pc_203', maxn=6)
    for ds, lab in (('nrg_ti_bio', 'imports'), ('nrg_te_bio', 'exports')):
        r, l = safe(ds, 'siec', ['R5210P', 'R5220P', 'R5230P'], partner='TOTAL', sinceTimePeriod='2005'); n += gen(r, l, ds[-6:], 'trade', 'Biofuel ' + lab, 'Eurostat ' + ds, maxn=12)
    return n
def dairy():
    n = 0
    for ds, tag in (('apro_mk_strmk', 'strmk'), ('apro_mk_strmt', 'strmt'), ('apro_mk_strdm', 'strdm'), ('apro_mk_strbt', 'strbt'), ('apro_mk_strfp', 'strfp'), ('apro_mk_strpd', 'strpd')):
        try: r, l = es(ds, indic_ag='ENT', volume='TOTAL', sinceTimePeriod='2000'); n += gen(r, l, tag, 'milk', None, 'Eurostat ' + ds, maxn=6)
        except Exception as e: E.log('  ', ds, repr(e)[-80:])
    r, l = es('apro_mk_farm', dairyprod=['D1100A', 'D1100D', 'D1100F'], milkitem='PRO', sinceTimePeriod='2015'); n += gen(r, l, 'farm', 'milk', None, 'Eurostat apro_mk_farm', maxn=12)
    return n
def aquaculture():
    n = 0
    r, l = es('fish_aq3', species='F00', unit='TLW', sinceTimePeriod='2000'); n += gen(r, l, 'aq3', 'fish', None, 'Eurostat fish_aq3', maxn=8)
    for ds in ('fish_aq4a', 'fish_aq4b'):
        r, l = es(ds, species='F00', dest_use='TOTAL', sinceTimePeriod='2000'); n += gen(r, l, ds[-4:], 'fish', None, 'Eurostat ' + ds, maxn=8)
    r, l = safe('fish_aq2b', 'species', ['F00', 'F01', 'F07'], aquameth='TOTAL', aquaenv='TOTAL', fishreg='0', unit='TLW', sinceTimePeriod='2000'); n += gen(r, l, 'aq2b', 'fish', None, 'Eurostat fish_aq2b', maxn=6)
    return n
def organic():
    n = 0
    r, l = safe('org_cpreact', 'nace_r2', ['C10', 'C101', 'C102', 'C103', 'C104', 'C105', 'C106', 'C107', 'C108', 'C11'], unit='NR', sinceTimePeriod='2005'); n += gen(r, l, 'cpreact', 'organic', 'Organic processors', 'Eurostat org_cpreact', maxn=14)
    r, l = safe('apro_mt_porg', 'meat', ['B1000', 'B3100', 'B4000', 'B7000'], unit='T', sinceTimePeriod='2005'); n += gen(r, l, 'porg', 'organic', 'Organic slaughter', 'Eurostat apro_mt_porg', maxn=8)
    return n
def eu_only():
    n = 0
    for ds, tag, tt in (('env_landfp_dom', 'lfdom', 'Land footprint of EU consumption, domestic'), ('env_landfp_imp', 'lfimp', 'Land footprint of EU imports'), ('env_landfp_exp', 'lfexp', 'Land footprint of EU exports')):
        try:
            flt = dict(indic_env='CRL') if ds != 'env_landfp_dom' else dict(indic_env='CRL', c_orig='EU27_2020', prodgrp='TOTAL', agriprod='TOTAL')
            if ds == 'env_landfp_imp': flt.update(hs22='TOTAL', c_orig='TOTAL')
            if ds == 'env_landfp_exp': flt.update(hs22='TOTAL')
            r, l = es(ds, nogeo=True, **flt); n += gen(r, l, tag, 'environment', None, 'Eurostat ' + ds, maxn=12)
        except Exception as e: E.log('  ', ds, repr(e)[-90:])
    r, l = es('env_bio5', nogeo=True); n += gen(r, l, 'bio5', 'fish', None, 'Eurostat env_bio5', maxn=12)
    return n

only = [a for a in sys.argv[1:] if a in C]
test = '--test' in sys.argv
FNS = [('previsiones', forecasts), ('mensuales', monthlies), ('ambiente', environment), ('silvicultura', forestry), ('energia', energy), ('lacteo', dairy), ('acuicultura', aquaculture), ('ecologico', organic)]

def one(cc):
    """todas las series de un pais (se ejecuta en un proceso aparte: varios paises a la vez, sin pasar de 5 peticiones simultaneas a Eurostat)"""
    E.CFG = {'geo': GEO.get(cc, cc), 'pfx': cc.lower()}; E.OUT.clear(); E.LOG.clear()
    for name, fn in FNS + ([('superficie incorporada y stocks pesqueros', eu_only)] if cc == 'EU' else []): run(name, fn)
    E.log(cc, 'series', len(E.OUT))
    return cc, sorted(E.OUT.values(), key=lambda s: s['id']), list(E.LOG)

if __name__ == '__main__':
    import multiprocessing
    todo = (only or list(C))[:1] if test else (only or list(C))
    with multiprocessing.Pool(5) as pool: res = pool.map(one, todo, chunksize=1)
    out = {}
    for cc, ser, lg in res:
        E.LOG.extend(lg)
        if len(ser) >= 3: out[cc] = {'name': C[cc], 'extend': True, 'source': dict(SRC), 'series': ser}
        else: E.log('sin datos suficientes', cc)
    fn = 'data/eurostat-more-test.json' if test else 'data/eurostat-more-stats.json'
    open('data/eurostat-more-log.txt', 'w').write('\n'.join(E.LOG) + '\n')
    if not test and len(out) < 18: sys.exit('FALLO: pocos paises con datos (%d)' % len(out))
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    json.dump(_clean_breaks({'schemaVersion': 1, 'generatedAt': now, 'countries': out, 'log': E.LOG[-30:]}), open(fn, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('paises', len(out), 'series', sum(len(v['series']) for v in out.values()))

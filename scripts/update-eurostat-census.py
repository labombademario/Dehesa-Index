#!/usr/bin/env python3
"""Censo agrario de Eurostat (explotaciones, jefes, tecnologia, practicas, estructura) y precios de insumos 2025, por pais y por region NUTS 2
-> data/eurostat-census-stats.json  (data/views/census/<CC>.json lo construye scripts/build-views.py; la web lee las vistas, no este fichero)
Tablas (todas Eurostat, reutilizacion con cita; Decision 2011/833/UE):
  jefes de explotacion:  ef_fsi_nfm (nuevos jefes por sexo, pais), ef_mp_training (formacion por edad), ef_mp_tenure (tenencia de la tierra por edad),
                         ef_lf_main (mano de obra por edad del jefe), ef_fsi_ecsz (tamano economico por edad, pais), aact_ali01_r (empleo agrario, region)
  tecnologia y practicas (2023): ef_mp_digi, ef_mp_digicr (agricultura de precision por edad), ef_mp_mach, ef_mp_renerg, ef_mp_irri, ef_lus_irri,
                         ef_mp_prac (laboreo), ef_mp_soil (cubierta del suelo), ef_mp_efa (elementos del paisaje)
  estructura:            ef_lsk_main, ef_lsk_bees (explotaciones y cabezas por especie), ef_lus_main (uso del suelo), ef_lus_orch* (frutales por edad y densidad, 2023)
  insumos 2025:          apri_aip_ft (fertilizantes), apri_aip_fs (piensos), apri_aip_en (energia agraria): solo 2025 (continuan apri_ap_ina, que acaba en 2024)
Nada se estima, no se rellena ningun hueco y no se suman regiones aqui (la suma de NUTS 2 de una region la hace la pagina solo cuando estan todas).
Formato: meta.tables[ds] = {years, keys}; geo[GEO][ds][clave] = [valor por ano de years | null]. La clave es los codigos de las dimensiones de «keys» unidos con '|'.
Uso: update-eurostat-census.py [--only tabla,tabla]"""
import datetime, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
COUNTRIES = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'PL', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI']
SRC = {'name': 'Eurostat, farm structure survey / agricultural census and agricultural prices', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
AGES7 = ['TOTAL', 'Y_LT25', 'Y25-34', 'Y35-39', 'Y35-44', 'Y40-44', 'Y45-54', 'Y55-64', 'Y_GE65']   # las tablas publican 35-39 y 40-44 (2020, 2023) o 35-44 (2016): se piden las tres franjas
AGES8 = ['TOTAL', 'Y_LT25', 'Y25-34', 'Y35-39', 'Y40-44', 'Y45-54', 'Y55-64', 'Y_GE65']
T3 = dict(statinfo=['TOTAL', 'ABVTH'])
# scope: 'nat' = paises (y EU27); 'reg' = paises y regiones NUTS 2. since: primer ano. flt: filtros (lista = varia); keys: dimensiones que forman la clave
SPECS = [
    dict(ds='ef_fsi_nfm', scope='nat', since=2016, flt=dict(wstatus=['TOTAL', 'NEW_FLF_LE40', 'NEW_FLF_GT40'], sex=['T', 'M', 'F'], unit=['HLD', 'PC']), keys=['wstatus', 'sex', 'unit']),
    dict(ds='ef_mp_training', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], uaarea='TOTAL', so_eur='TOTAL', sex='T', age=AGES7, training=['TOTAL', 'BASIC', 'PRACT', 'FULL'], unit='HLD'), keys=['age', 'training', 'unit']),
    dict(ds='ef_mp_tenure', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', uaarea='TOTAL', sex='T', age=AGES7, tenure=['TOTAL', 'OWN', 'RENT', 'CML', 'SHR_OTH'], unit='HA'), keys=['age', 'tenure', 'unit']),
    dict(ds='ef_mp_tenure', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', uaarea='TOTAL', sex='T', age='TOTAL', tenure=['TOTAL', 'OWN', 'RENT', 'CML', 'SHR_OTH'], unit='HLD'), keys=['age', 'tenure', 'unit']),
    dict(ds='ef_lf_main', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', sex='T', wstatus='TOTAL', age=AGES7, unit=['PER', 'AWU']), keys=['age', 'wstatus', 'unit']),
    dict(ds='ef_fsi_ecsz', scope='nat', since=2016, flt=dict(so_eur='TOTAL', farmtype='TOTAL', age=['TOTAL', 'Y_LT25', 'Y25-34', 'Y35-44', 'Y45-54', 'Y55-64', 'Y_GE65'], unit=['EUR', 'AVG', 'HLD', 'AWU', 'HA']), keys=['age', 'unit']),
    dict(ds='aact_ali01_r', scope='reg', since=1995, flt=dict(), keys=['am_item', 'unit']),
    dict(ds='ef_mp_digi', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', so_eur='TOTAL', unit='HLD'), keys=['agr_inp', 'unit']),
    dict(ds='ef_mp_digicr', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], uaarea='TOTAL', training='TOTAL', age=AGES8, agr_inp=['MAC_PFRM', 'NMAC_PFRM'], unit='HLD'), keys=['age', 'agr_inp', 'unit']),
    dict(ds='ef_mp_digicr', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], uaarea='TOTAL', training='TOTAL', age='TOTAL', unit='HLD'), keys=['age', 'agr_inp', 'unit']),
    dict(ds='ef_mp_mach', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', uaarea='TOTAL', owner='TOTAL', unit=['HLD', 'MACH']), keys=['agr_inp', 'unit']),
    dict(ds='ef_mp_renerg', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', so_eur='TOTAL', unit='HLD'), keys=['nrg_bal', 'unit']),
    dict(ds='ef_mp_irri', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], irrmeth=['TOTAL', 'SURF', 'SPLR', 'DRIP'], wat_src='TOTAL', irr_area=['UAA_IT', 'UAAT_IT', 'UAAS_IT'], unit=['HA', 'M3', 'HLD']), keys=['irrmeth', 'irr_area', 'unit']),
    dict(ds='ef_mp_irri', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], irrmeth='TOTAL', irr_area='UAA_IT', unit='HA'), keys=['wat_src', 'irr_area', 'unit']),
    dict(ds='ef_lus_irri', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], so_eur='TOTAL', uaarea='TOTAL', unit='HA'), keys=['crops', 'unit']),
    dict(ds='ef_mp_prac', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', arable='TOTAL', crop_rot='TOTAL', unit=['HA', 'HLD']), keys=['tillage', 'unit']),
    dict(ds='ef_mp_soil', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', arable='TOTAL', crop_rot='TOTAL', unit=['HA', 'HLD']), keys=['soil_cov', 'unit']),
    dict(ds='ef_mp_efa', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', uaarea='TOTAL', unit=['HA', 'HLD']), keys=['efa', 'unit']),
    dict(ds='ef_lsk_main', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', so_eur='TOTAL', uaarea='TOTAL', lsu='TOTAL', unit=['HD', 'LSU', 'HLD']), keys=['animals', 'unit']),
    dict(ds='ef_lsk_bees', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], so_eur='TOTAL', uaarea='TOTAL'), keys=['animals', 'unit']),
    dict(ds='ef_lus_main', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', so_eur='TOTAL', uaarea='TOTAL', unit=['HA', 'HLD']), keys=['crops', 'unit']),
    dict(ds='ef_lus_orchpome', scope='reg', since=2023, flt=dict(statinfo=['TOTAL', 'ABVTH'], density='TOTAL', unit='HA'), keys=['crops', 'age', 'unit']),
    dict(ds='ef_lus_orchstone', scope='reg', since=2023, flt=dict(statinfo=['TOTAL', 'ABVTH'], density='TOTAL', unit='HA'), keys=['crops', 'age', 'unit']),
    dict(ds='ef_lus_orchcitrus', scope='reg', since=2023, flt=dict(statinfo=['TOTAL', 'ABVTH'], density='TOTAL', unit='HA'), keys=['crops', 'age', 'unit']),
    dict(ds='ef_lus_orcholives', scope='reg', since=2023, flt=dict(statinfo=['TOTAL', 'ABVTH'], density='TOTAL', unit='HA'), keys=['crops', 'age', 'unit']),
    dict(ds='ef_lus_orchgrapes', scope='reg', since=2023, flt=dict(statinfo=['TOTAL', 'ABVTH'], density='TOTAL', unit='HA'), keys=['crops', 'age', 'unit']),
    dict(ds='ef_mp_voctraining', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], so_eur='TOTAL', uaarea='TOTAL', sex='T', age=AGES7, frequenc=['TOTAL', 'M12', 'NVR_NM12'], unit='HLD'), keys=['age', 'frequenc', 'unit']),
    dict(ds='ef_mp_manorg', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], uaarea='TOTAL', sex='T', training='TOTAL', age=AGES7, organic=['TOTAL', 'ORG'], unit=['HLD', 'HA']), keys=['age', 'training', 'organic', 'unit']),
    dict(ds='ef_mp_manorg', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], uaarea='TOTAL', sex='T', training=['TOTAL', 'BASIC', 'PRACT', 'FULL'], age='TOTAL', organic='ORG', unit='HLD'), keys=['age', 'training', 'organic', 'unit']),
    dict(ds='ef_lf_fam', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], leg_form='TOTAL', age='TOTAL', sex='T', farmtype='TOTAL', unit=['HLD', 'AWU']), keys=['fam_farm', 'unit']),
    dict(ds='ef_lf_size', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], farmtype='TOTAL', wstatus=['TOTAL', 'FLF_D_RFAM_HLD', 'FLF_D_RFAMXHLD', 'FLF_D_RNFAM', 'FLF_D_NR', 'FLF_ND'], unit=['PER', 'AWU']), keys=['uaarea', 'wstatus', 'unit']),
    dict(ds='ef_mp_digilsk', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], age='TOTAL', training='TOTAL', lsu='TOTAL', unit='HLD'), keys=['lsu', 'agr_inp', 'unit']),
    dict(ds='ef_mp_digilsk', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], age='TOTAL', training='TOTAL', agr_inp=['MAC_LSM', 'MAC_MLK_ROB', 'NMAC_LSM'], unit='HLD'), keys=['lsu', 'agr_inp', 'unit']),
    dict(ds='ef_lus_pegrass', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], so_eur='TOTAL', croparea='TOTAL', uaarea='TOTAL', unit=['HA', 'HLD']), keys=['crops', 'unit']),
    dict(ds='ef_lus_allcrops', scope='reg', since=2016, flt=dict(statinfo=['TOTAL', 'ABVTH'], so_eur='TOTAL', uaarea='TOTAL', unit=['HA', 'HLD']), keys=['crops', 'unit']),
    dict(ds='apri_aip_ft', scope='nat', since=2025, flt=dict(unit='EUR_T'), keys=['am_item', 'unit']),
    dict(ds='apri_aip_fs', scope='nat', since=2025, flt=dict(unit='EUR_T'), keys=['am_item', 'unit']),
    dict(ds='apri_aip_en', scope='nat', since=2025, flt=dict(unit=['EUR_THS_KWH', 'EUR_HL']), keys=['am_item', 'unit']),
]
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def region_geos():
    g = set(COUNTRIES)
    for f in sorted((ROOT / 'data').glob('eu-regions-*.json')):
        try: doc = json.loads(f.read_text(encoding='utf-8'))
        except Exception: continue
        for r in doc.get('regions', {}).values(): g.update(r.get('nuts', []))
    return sorted(g)
class TooBig(Exception): pass
def fetch(ds, flt, geos, since):
    pairs = [('format', 'JSON'), ('lang', 'EN')]
    if since: pairs.append(('sinceTimePeriod', str(since)))
    for k, v in flt.items():
        for x in (v if isinstance(v, list) else [v]): pairs.append((k, x))
    for g in geos: pairs.append(('geo', g))
    url = API + ds + '?' + urllib.parse.urlencode(pairs); last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=240) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (400, 413): raise TooBig('%s %s' % (e.code, ds))
            if e.code == 404: return None
            last = e
        except Exception as e: last = e
        time.sleep(3 * (i + 1))
    raise RuntimeError('%s: %s' % (ds, last))
def cells(j):
    if not j or not j.get('value'): return
    ids, size = j['id'], j['size']; cat = {}
    for d in ids:
        c = j['dimension'][d]['category']['index']
        cat[d] = [k for k, _ in sorted(c.items(), key=lambda kv: kv[1])] if isinstance(c, dict) else list(c)
    for key, v in j['value'].items():
        i = int(key); co = {}
        for d, s in zip(reversed(ids), reversed(size)): co[d] = cat[d][i % s]; i //= s
        if v is not None: yield co, float(v)
def run_chunk(spec, geos, acc, depth=0):
    try: j = fetch(spec['ds'], spec['flt'], geos, spec['since'])
    except TooBig:
        if len(geos) <= 1: log('  demasiado grande aun con 1 geo:', spec['ds'], geos); return
        h = len(geos) // 2; run_chunk(spec, geos[:h], acc, depth + 1); run_chunk(spec, geos[h:], acc, depth + 1); return
    n = 0
    for co, v in cells(j):
        try: key = '|'.join(co[d] for d in spec['keys'])
        except KeyError: continue
        acc.setdefault(co['geo'], {}).setdefault(co.get('statinfo', ''), {}).setdefault(key, {})[co['time']] = v; n += 1
    return n
def main():
    only = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else None
    nat = COUNTRIES + ['EU27_2020']; reg = region_geos()
    log('geos: paises', len(nat), 'regiones+paises', len(reg))
    tables = {}; geo = {}; fails = 0
    for spec in SPECS:
        ds = spec['ds']
        if only and ds not in only: continue
        G = nat if spec['scope'] == 'nat' else reg
        acc = {}; t0 = time.time()
        for i in range(0, len(G), 60):
            try: run_chunk(spec, G[i:i + 60], acc)
            except Exception as e: log('ERROR', ds, repr(e)[:200]); fails += 1
        if not acc: log('  SIN DATOS', ds); continue
        T = tables.setdefault(ds, {'years': set(), 'keys': set(), 'abv': set()})
        for g, bystat in acc.items():
            # un solo criterio por pais o region: el total (TOTAL) si existe; si no, solo las explotaciones por encima del umbral (ABVTH)
            st = '' if '' in bystat else ('TOTAL' if 'TOTAL' in bystat or 'ABVTH' not in bystat else 'ABVTH')
            if st == 'ABVTH': T['abv'].add(g)
            for k, ys in bystat.get(st, {}).items():
                T['keys'].add(k); T['years'].update(ys)
                geo.setdefault(g, {}).setdefault(ds, {}).setdefault(k, {}).update(ys)
        nv = sum(len(ys) for bs in acc.values() for ks in bs.values() for ys in ks.values())
        log(ds, 'claves', len({k for bs in acc.values() for ks in bs.values() for k in ks}), 'geos', len(acc), 'valores', nv, 'solo por encima del umbral:', len(T['abv']), '%.0fs' % (time.time() - t0))
    meta = {}
    for ds, T in tables.items():
        yrs = sorted(T['years']); meta[ds] = {'years': yrs, 'keys': sorted(T['keys']), 'abv': sorted(T['abv'])}
    for g, tb in geo.items():
        for ds, ks in tb.items():
            yrs = meta[ds]['years']
            for k in list(ks): ks[k] = [ks[k].get(y) for y in yrs]
    if only is None and (fails or len(meta) < len({s['ds'] for s in SPECS}) - 3): print('FALLO: tablas con datos', len(meta));
    out = ROOT / 'data' / ('eurostat-census-stats.json' if only is None else 'eurostat-census-test.json')
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    out.write_text(json.dumps({'schemaVersion': 1, 'generatedAt': now, 'source': SRC, 'meta': {'tables': meta}, 'geo': geo}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (ROOT / 'data' / 'eurostat-census-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
    log('escrito', out.name, out.stat().st_size // 1024, 'KB; geos', len(geo))
    return 1 if (only is None and len(meta) < 20) else 0
if __name__ == '__main__': sys.exit(main())

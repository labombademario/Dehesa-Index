#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-input-prices.py con respuestas JSON-stat sinteticas (sin red): 100 kg -> t, valor unitario, umbral por producto, codigo de Grecia,
series cortas y reparto por origen (sin miembros de la UE ni agregados)."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('inp', ROOT / 'scripts' / 'update-eu-input-prices.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(ok, msg):
    if not ok: fails.append(msg); print('FALLA', msg)
months = ['%04d-%02d' % (2022 + i // 12, i % 12 + 1) for i in range(36)]
def jstat(dims, vals):
    ids = ['freq', 'reporter', 'partner', 'product', 'flow', 'indicators', 'time']
    d = {k: {'category': {'index': {x: i for i, x in enumerate(dims[k])}}} for k in ids}
    size = [len(dims[k]) for k in ids]; value = {}
    for key, v in vals.items():
        n = 0
        for k, x in zip(ids, key): n = n * len(dims[k]) + dims[k].index(x)
        value[str(n)] = v
    return {'id': ids, 'size': size, 'dimension': d, 'value': value}
inds = ['VALUE_IN_EUROS', 'QUANTITY_IN_100KG']
dims = {'freq': ['M'], 'reporter': ['EU27_2020', 'GR', 'FR'], 'partner': ['EXT_EU27_2020'], 'product': ['310210', '3808'], 'flow': ['1'], 'indicators': inds, 'time': months}
vals = {}
for mi, m in enumerate(months):
    vals[('M', 'EU27_2020', 'EXT_EU27_2020', '310210', '1', inds[0], m)] = (400 + mi) * 100000      # 100 000 t a 400+mi EUR/t
    vals[('M', 'EU27_2020', 'EXT_EU27_2020', '310210', '1', inds[1], m)] = 100000 * 10
    vals[('M', 'GR', 'EXT_EU27_2020', '310210', '1', inds[0], m)] = 450 * 2000; vals[('M', 'GR', 'EXT_EU27_2020', '310210', '1', inds[1], m)] = 2000 * 10
    vals[('M', 'FR', 'EXT_EU27_2020', '310210', '1', inds[0], m)] = 999; vals[('M', 'FR', 'EXT_EU27_2020', '310210', '1', inds[1], m)] = 100   # 10 t: bajo el umbral
    vals[('M', 'EU27_2020', 'EXT_EU27_2020', '3808', '1', inds[0], m)] = 7000 * 300; vals[('M', 'EU27_2020', 'EXT_EU27_2020', '3808', '1', inds[1], m)] = 300 * 10   # 300 t: sobre 100, bajo 500
del vals[('M', 'GR', 'EXT_EU27_2020', '310210', '1', inds[1], months[5])]
raw = M.parse_monthly(jstat(dims, vals))
check(set(raw) == {('310210', 'EU'), ('310210', 'EL'), ('310210', 'FR'), ('3808', 'EU')}, 'claves %s' % sorted(raw))
check(abs(raw[('310210', 'EU')]['2022-01'][1] - 100000.0) < 1e-6, 'toneladas')
b = M.build(raw, {'310210': 500.0, '3808': 100.0})
check(set(b) == {'310210', '3808'} and set(b['310210']) == {'EU', 'EL'}, 'FR (10 t) no debe publicarse: %s' % {k: sorted(v) for k, v in b.items()})
check(b['310210']['EU']['points'][0] == ['2022-01', 400.0, 100000] and b['310210']['EU']['points'][1][1] == 401.0, 'punto UE: %s' % b['310210']['EU']['points'][:2])
check(len(b['310210']['EL']['points']) == 35 and all(p[0] != '2022-06' for p in b['310210']['EL']['points']), 'un mes sin cantidad no da precio')
check(b['3808']['EU']['points'][0][1:] == [7000.0, 300], 'umbral propio del producto (100 t): %s' % b['3808']['EU']['points'][:1])
check('3808' not in M.build(raw, {'310210': 500.0, '3808': 500.0}), 'con umbral 500 t el producto de 300 t/mes no se publica')
check(M.build({('310210', 'EU'): {m: [1e6, 5000.0] for m in months[:10]}}, {}) == {}, 'menos de 24 meses no se publica')
# origenes
od = {'freq': ['A'], 'reporter': ['EU27_2020', 'GR'], 'partner': ['EG', 'RU', 'DE', 'EXT_EU27_2020', 'XX', 'DZ'], 'product': ['310210'], 'flow': ['1'], 'indicators': inds, 'time': ['2025']}
ov = {}
for pa, t in (('EG', 600), ('RU', 300), ('DE', 5000), ('EXT_EU27_2020', 9999), ('XX', 70), ('DZ', 100)):
    ov[('A', 'EU27_2020', pa, '310210', '1', inds[1], '2025')] = t * 10; ov[('A', 'EU27_2020', pa, '310210', '1', inds[0], '2025')] = t * 1000
for pa, t in (('EG', 90), ('RU', 10), ('DE', 777)):      # Grecia (GR en Comext, EL en el sitio): solo cuentan los origenes de fuera de la UE
    ov[('A', 'GR', pa, '310210', '1', inds[1], '2025')] = t * 10
o = M.parse_origins(jstat(od, ov), '2025')
check(set(o['310210']) == {'EU', 'EL'}, 'declarantes de origenes: %s' % sorted(o['310210']))
check(set(o['310210']['EU']) == {'EG', 'RU', 'DZ'}, 'origenes: %s' % o)
check(set(o['310210']['EL']) == {'EG', 'RU'} and abs(o['310210']['EL']['EG'] - 90.0) < 1e-9, 'origenes de Grecia: %s' % o['310210']['EL'])
check(M.shares(o['310210']['EL'], min_t=500.0) is None and M.shares(o['310210']['EL'], min_t=50.0)['tonnes'] == 100, 'umbral de toneladas para paises')
s = M.shares(o['310210']['EU'])
check(s['tonnes'] == 1000 and s['top'][0] == ['EG', 60.0] and s['top'][2] == ['DZ', 10.0], 'cuotas: %s' % s)
check(M.shares({}) is None, 'sin datos no hay cuotas')
print('precios unitarios de insumos Comext: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

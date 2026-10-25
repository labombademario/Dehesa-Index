#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-sulphur.py con una respuesta JSON-stat sintetica (sin red): unidades (100 kg -> t), precio unitario, umbral de volumen,
codigo de Grecia y rechazo de series cortas."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sul', ROOT / 'scripts' / 'update-eu-sulphur.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(ok, msg):
    if not ok: fails.append(msg); print('FALLA', msg)
months = ['%04d-%02d' % (2022 + i // 12, i % 12 + 1) for i in range(36)]
reps = ['EU27_2020', 'GR', 'FR']
def js(vals):   # vals[(rep, ind, month_index)] -> numero
    ids = ['freq', 'reporter', 'partner', 'product', 'flow', 'indicators', 'time']
    inds = ['VALUE_IN_EUROS', 'QUANTITY_IN_100KG']
    dim = {'freq': ['A'], 'reporter': reps, 'partner': ['EXT_EU27_2020'], 'product': ['2503'], 'flow': ['1'], 'indicators': inds, 'time': months}
    d = {k: {'category': {'index': {x: i for i, x in enumerate(v)}}} for k, v in dim.items()}
    size = [len(dim[k]) for k in ids]; value = {}
    for (rep, ind, mi), v in vals.items():
        value[str((reps.index(rep) * 2 + inds.index(ind)) * len(months) + mi)] = v
    return {'id': ids, 'size': size, 'dimension': d, 'value': value}
vals = {}
for mi in range(36):
    vals[('EU27_2020', 'VALUE_IN_EUROS', mi)] = 200 * 1000 * 100 + mi * 100000          # 100 000 t a ~200 EUR/t
    vals[('EU27_2020', 'QUANTITY_IN_100KG', mi)] = 100000 * 10
    vals[('GR', 'VALUE_IN_EUROS', mi)] = 300 * 2000; vals[('GR', 'QUANTITY_IN_100KG', mi)] = 2000 * 10   # 2000 t a 300 EUR/t
    vals[('FR', 'VALUE_IN_EUROS', mi)] = 999; vals[('FR', 'QUANTITY_IN_100KG', mi)] = 100   # 10 t: bajo el umbral
vals[('GR', 'QUANTITY_IN_100KG', 5)] = None; del vals[('GR', 'QUANTITY_IN_100KG', 5)]      # un mes sin cantidad
raw = M.parse(js(vals))
check(set(raw) == {'EU', 'EL', 'FR'}, 'codigos %s' % sorted(raw))
check(abs(raw['EU']['2022-01'][1] - 100000.0) < 1e-6, 'toneladas: %s' % raw['EU']['2022-01'])
c = M.build(raw)
check(set(c) == {'EU', 'EL'}, 'FR (10 t/mes) no debe publicarse: %s' % sorted(c))
check(c['EU']['points'][0][1] == 200.0 and c["EU"]["points"][1][1] == 201.0, 'precio unitario UE: %s' % c['EU']['points'][:2])
check(c['EL']['points'][0] == ['2022-01', 300.0, 2000, 600000], 'punto EL: %s' % c['EL']['points'][0])
check(len(c['EL']['points']) == 35 and all(p[0] != '2022-06' for p in c['EL']['points']), 'un mes sin cantidad no da precio y no se rellena')
short = {'EU': {m: [1e6, 5000.0] for m in months[:10]}}
check(M.build(short) == {}, 'menos de 24 meses con volumen no se publica')
print('azufre Comext: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

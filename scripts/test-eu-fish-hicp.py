#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-fish-hicp.py con JSON-stat sintetico (sin red): lectura por posicion, solo unidad I25 y COICOP CP0113, solo Estados miembros, salto mensual excesivo descarta el pais."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('hp', ROOT / 'scripts' / 'update-eu-fish-hicp.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
months = ['%d-%02d' % (2024 + k // 12, k % 12 + 1) for k in range(30)]
geos = ['ES', 'FR', 'NO', 'EU27_2020']
units = ['I25', 'RCH_A']
val = {}
def put(u, g, k, v): val[str((units.index(u) * len(geos) + geos.index(g)) * len(months) + k)] = v
for k in range(30):
    put('I25', 'ES', k, 100 + k * 0.5); put('I25', 'FR', k, 100 + k * 0.3 if k != 10 else 160); put('I25', 'NO', k, 100); put('I25', 'EU27_2020', k, 101 + k * 0.2); put('RCH_A', 'ES', k, 5.0)
doc = {'id': ['freq', 'unit', 'coicop18', 'geo', 'time'], 'size': [1, 2, 1, 4, 30], 'value': val,
       'dimension': {'freq': {'category': {'index': {'M': 0}}}, 'unit': {'category': {'index': {'I25': 0, 'RCH_A': 1}}}, 'coicop18': {'category': {'index': {'CP0113': 0}}},
                     'geo': {'category': {'index': {g: i for i, g in enumerate(geos)}}}, 'time': {'category': {'index': {m: i for i, m in enumerate(months)}}}}}
raw = M.parse(doc)
check(set(raw) == {'ES', 'FR', 'EU27_2020'}, 'solo Estados miembros y UE: %s' % sorted(raw))
check(raw['ES']['2024-01'] == 100.0 and raw['ES']['2026-06'] == 114.5, 'valores por posicion: %s' % raw['ES'].get('2026-06'))
check(all(v > 90 for v in raw['ES'].values()), 'la tasa RCH_A (5.0) no se mezcla con el indice')
b = M.build(raw)
check('ES' in b and 'EU' in b and 'EU27_2020' not in b, 'UE renombrada: %s' % sorted(b))
check('FR' not in b, 'un salto de 60 % descarta el pais')
check(b['ES'][0] == ['2024-01', 100.0] and len(b['ES']) == 30, 'puntos ordenados')
print('IPCA del pescado: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

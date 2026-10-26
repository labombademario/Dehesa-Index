#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-fadn.py con un CSV sintetico (sin red): separador ';', codigos de pais (Grecia = EL, UE-27 = EU, Reino Unido y agregados descartados),
valores vacios y no numericos, series de menos de 3 años, columnas que faltan y rechazo de datos insuficientes."""
import importlib.util, io, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fadn', ROOT / 'scripts' / 'update-eu-fadn.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(ok, msg):
    if not ok: fails.append(msg); print('FALLA', msg)
cols = ['YEAR', 'COUNTRY', 'SYS02'] + M.CODES
def csv_text(rows):
    out = [';'.join(cols)]
    for y, c, vals in rows:
        out.append(';'.join([str(y), c, '1'] + [str(vals.get(k, '')) for k in M.CODES]))
    return '﻿' + '\n'.join(out) + '\n'
rows = []
for y in range(2018, 2025):
    rows.append((y, 'EU-27_2020', {'SE420': 30000 + y, 'SE295': 6000 + y}))
    rows.append((y, '(EL) Greece', {'SE420': 12000 + y, 'SE295': '5.5' if y == 2020 else 4000 + y, 'SE320': 'n/a'}))
    rows.append((y, '(UK) United Kingdom', {'SE420': 99999}))
    rows.append((y, 'EU-12', {'SE420': 88888}))
    rows.append((y, '(ALL) EU', {'SE420': 77777 + y}))
rows.append((2024, '(MT) Malta', {'SE420': 5000}))        # un solo año: no se publica
rows.append((2023, '(MT) Malta', {'SE420': 4900}))
raw = M.parse(csv_text(rows))
check(set(raw) == {'EU', 'EUALL', 'EL', 'MT'}, 'paises %s' % sorted(raw))
check(raw['EL']['SE295']['2020'] == 5.5 and raw['EL']['SE295']['2021'] == 6021.0, 'valores de Grecia %s' % raw['EL']['SE295'])
check('SE320' not in raw['EL'], 'un valor no numerico no da dato')
check('SE131' not in raw['EL'], 'una celda vacia no da dato')
b = M.build(raw)
check('EUALL' not in b, '(ALL) EU no se publica como pais')
# huecos de la UE-27: EU-27_2020 sin 2022 y 2023; (ALL) EU rellena solo >= 2021 y solo lo que falta
gap = [r for r in rows if not (r[1] == 'EU-27_2020' and r[0] in (2022, 2023))]
bg = M.build(M.parse(csv_text(gap)))['EU']['SE420']; dg = dict((y, v) for y, v in bg)
check(dg[2022] == 77777 + 2022 and dg[2023] == 77777 + 2023, 'se rellenan 2022 y 2023 desde (ALL) EU: %s' % bg)
check(dg[2024] == 30000 + 2024 and dg[2021] == 30000 + 2021, 'los años que EU-27_2020 si tiene no se sustituyen: %s' % bg)
rows_old = [r for r in rows if not (r[1] == 'EU-27_2020' and r[0] <= 2020)]
bo = dict((y, v) for y, v in M.build(M.parse(csv_text(rows_old)))['EU']['SE420'])
check(2018 not in bo and 2019 not in bo and 2020 not in bo, 'antes de 2021 no se usa (ALL) EU (incluye Reino Unido): %s' % sorted(bo))
check('MT' not in b, 'menos de 3 años no se publica')
check(b['EU']['SE420'][0] == [2018, 32018.0] and len(b['EU']['SE420']) == 7, 'serie UE %s' % b['EU']['SE420'][:1])
check(b['EL']['SE295'][2] == [2020, 5.5], 'orden por año')
check(M.cc_of('(ES) Spain') == 'ES' and M.cc_of('(UK) United Kingdom') is None and M.cc_of('EU-27_2007') is None and M.cc_of('(ALL) EU') == 'EUALL' and M.cc_of('EU-27_2020') == 'EU', 'cc_of')
try:
    M.parse(csv_text(rows).replace('SE420', 'XX999', 1)); check(False, 'debe fallar si falta una columna')
except RuntimeError as e: check('faltan columnas' in str(e), 'mensaje de columnas: %s' % e)
print('FADN (CSV de resultados estandar): %d fallos' % len(fails)); sys.exit(1 if fails else 0)

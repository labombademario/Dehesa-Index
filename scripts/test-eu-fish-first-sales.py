#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-fish-first-sales.py con CSV sinteticos (sin red): solo Estados miembros, suma de valor/volumen por semana, umbral de kilos,
cajones "Other ...", seleccion de especies por valor de las ultimas 52 semanas y minimo de semanas, columnas que faltan."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('ff', ROOT / 'scripts' / 'update-eu-fish-first-sales.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
HEAD = 'year;week_of_year;country;location;commodity_group;main_commercial_species;product;english_name;cod_size;presentation;preservation;volume(Kg);weight;value(Eur)'
def row(y, w, c, sp, kg, eur, grp='Groundfish'): return '%d;%d;%s;Puerto;%s;%s;X;X;1;Whole;Fresh;%s;Net weight;%s' % (y, w, c, grp, sp, kg, eur)
rows = []
for w in range(1, 53):
    rows += [row(2025, w, 'Spain', 'Hake', 1000, 5000), row(2025, w, 'Spain', 'Hake', 1000, 7000)]     # dos puertos: 2000 kg, 12000 EUR -> 6 EUR/kg
    rows.append(row(2025, w, 'Spain', 'Sardine', 2000, 3000, 'Small pelagics'))                         # 1,5 EUR/kg, menos valor que la merluza
    rows.append(row(2025, w, 'Spain', 'Other marine fish', 9000, 90000))                                # cajon: fuera
    rows.append(row(2025, w, 'Norway', 'Cod', 5000, 20000))                                             # no es Estado miembro: fuera
    if w <= 20: rows.append(row(2025, w, 'Spain', 'Octopus', 1000, 9000))                               # solo 20 semanas: fuera (minimo 26)
rows.append(row(2025, 53, 'Spain', 'Hake', 100, 900))                                                   # semana 53 por debajo del umbral: sin precio
rows.append(row(2025, 3, 'Spain', 'Hake', '', 100))                                                     # volumen vacio: se ignora
rows.append('2025;x;Spain;P;G;Hake;X;X;1;W;F;10;Net weight;10')                                         # semana no numerica
acc, groups = {}, {}
n = M.accumulate('﻿' + HEAD + '\n' + '\n'.join(rows) + '\n', acc, groups)
check(set(acc) == {'ES'}, 'solo Estados miembros: %s' % sorted(acc))
check('Other marine fish' not in acc['ES'], 'cajon Other fuera')
check(acc['ES']['Hake']['2025-W01'] == [2000.0, 12000.0], 'suma por semana %s' % acc['ES']['Hake']['2025-W01'])
b = M.build(acc, groups)['ES']
names = [s['name'] for s in b['species']]
check(names == ['Hake', 'Sardine'], 'seleccion y orden por valor: %s' % names)
hk = b['species'][0]
check(hk['points'][0] == ['2025-W01', 6.0, 2.0], 'punto: %s' % hk['points'][0])
check(all(p[0] != '2025-W53' for p in hk['points']), 'semana bajo el umbral sin precio')
check(b['lastWeek'] == '2025-W53', 'ultima semana del pais: %s' % b['lastWeek'])
check(b['species'][1]['group'] == 'Small pelagics', 'grupo')
try: M.accumulate('a;b\n1;2\n', {}, {}); check(False, 'debe fallar sin columnas')
except RuntimeError as e: check('faltan columnas' in str(e), 'mensaje: %s' % e)
print('EUMOFA primeras ventas semanales: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Pruebas de scripts/update-us-fertilizer-imports.py con filas sinteticas del Census (sin red): suma de lineas de 10 cifras, unidades desconocidas fuera, minimo de toneladas, origenes solo de paises (no agregados)."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fi', ROOT / 'scripts' / 'update-us-fertilizer-imports.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
H = ["I_COMMODITY", "GEN_VAL_MO", "GEN_QY1_MO", "UNIT_QY1", "CTY_CODE", "CTY_NAME", "time"]
rows = [H]
for k in range(14):
    p = '2025-%02d' % (k % 12 + 1) if k < 12 else '2026-%02d' % (k - 11)
    rows += [["3102100010", "3000000", "10000", "T", "-", "TOTAL FOR ALL COUNTRIES", p], ["3102100050", "1000000", "5000000", "KG", "-", "TOTAL FOR ALL COUNTRIES", p],
             ["3102100010", "1800000", "6000", "T", "1220", "CANADA", p], ["3102100010", "1200000", "4000", "T", "5250", "QATAR", p], ["3102100010", "3000000", "10000", "T", "0003", "EUROPEAN UNION", p]]
rows.append(["3102100010", "500", "1", "BBL", "-", "TOTAL FOR ALL COUNTRIES", "2025-01"])
rows.append(["3102100010", "1000", "100", "T", "-", "TOTAL FOR ALL COUNTRIES", "2027-01"])     # 100 t < MIN_T: sin precio
w, c, seen, bad = M.parse(rows)
check(bad == {'BBL'}, 'unidad desconocida descartada: %s' % bad)
check(w['2025-01'] == [4000000.0, 15000.0], 'suma de lineas y KG->t: %s' % w['2025-01'])
check(set(c) == {'CA', 'QA'}, 'solo paises, sin agregados: %s' % sorted(c))
b = M.build(w, c)
check(b['points'][0] == ['2025-01', 266.7, 15000, 4000000], 'precio USD/t: %s' % b['points'][0])
check(all(p[0] != '2027-01' for p in b['points']), 'mes con menos de MIN_T fuera')
check(b['origins']['top'] == [['CA', 60.0], ['QA', 40.0]] and b['origins']['to'] == '2026-02', 'origenes ultimos 12 meses: %s' % b['origins'])
check(M.parse([H]) == ({}, {}, set(), set()), 'sin filas')
print('Importacion de fertilizantes de EE. UU.: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

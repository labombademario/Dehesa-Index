#!/usr/bin/env python3
"""Prueba del cruce gasto en fertilizantes (FADN) x valor unitario de importacion de la urea (Comext): media anual ponderada y cantidad implicita. Datos sinteticos."""
import importlib.util, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location('b', Path(__file__).resolve().parent / 'build-input-monitor-countries.py'); B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
def months(y, price, t, n=12): return [['%d-%02d' % (y, m), price, t] for m in range(1, n + 1)]
# media ponderada por toneladas: 2 meses a 100 EUR/t con 1 t y 2 meses a 400 con 3 t, completados hasta 9 meses a 100 con 1 t... se comprueba aparte
pts = months(2020, 200.0, 10) + [['2021-01', 100.0, 1], ['2021-02', 400.0, 3]] + months(2022, 300.0, 5, n=8)
a = B.annual_unit_values(pts)
check(set(a) == {2020}, 'solo años con >= 9 meses: %s' % sorted(a))
check(abs(a[2020] - 200.0) < 1e-9, 'media 2020 %s' % a.get(2020))
w = months(2020, 100.0, 1, n=8) + [['2020-09', 500.0, 8]]
check(abs(B.annual_unit_values(w)[2020] - (8 * 100.0 + 8 * 500.0) / 16) < 1e-9, 'ponderada por toneladas')
check(B.annual_unit_values([['2020-%02d' % m, None, 5] for m in range(1, 13)]) == {}, 'precio vacio no cuenta')
check(B.annual_unit_values([['2020-%02d' % m, 100.0, 0] for m in range(1, 13)]) == {}, 'sin toneladas no cuenta')
# cruce
pr = {'imports': {'310210': {'XX': {'points': sum([months(y, 250.0, 10) for y in range(2016, 2021)], [])}, 'YY': {'points': months(2020, 250.0, 10)}}}}
fa = {'XX': {'SE295': [[y, 5000.0] for y in range(2016, 2021)], 'SE025': [[y, 50.0] for y in range(2016, 2021)]},
      'YY': {'SE295': [[2020, 5000.0]], 'SE025': [[2020, 50.0]]},
      'ZZ': {'SE295': [[y, 5000.0] for y in range(2016, 2021)], 'SE025': [[y, 50.0] for y in range(2016, 2021)]}}
c = B.fert_cross(fa, pr)
check(set(c) == {'XX'}, 'YY (un año) y ZZ (sin urea) no salen: %s' % sorted(c))
check(c['XX'][0] == [2016, 100.0, 250.0, 400], 'fila: %s' % c['XX'][0])
fa['XX']['SE025'] = [[y, 50.0] for y in range(2016, 2020)]
check([r[0] for r in B.fert_cross(fa, pr)['XX']] == [2016, 2017, 2018, 2019], 'año sin superficie no entra ni se estima')
print('Cruce fertilizantes x urea: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-fish-retail-prices.py con CSV sintetico (sin red): solo filas con precio por kilo, media mensual, minimo de dias y de meses, saltos marcados, columnas que faltan."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fr', ROOT / 'scripts' / 'update-eu-fish-retail-prices.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
H = 'YEAR;MONTH;DAY;COUNTRY;CATEGORY;SIZE/WEIGHT RANGE;PRODUCT;PRODUCT ORIGINAL;ITEM ON SALE;PRICE PER UNIT (EUR);PRICE PER UNIT (LCY);PRICE PER KG (EUR);PRICE PER KG (LCY)'
def row(y, m, d, c, prod, kg, unit='', cat='Fresh'): return '%d;%d;%d;%s;%s; ;%s;orig;x;%s; ;%s; ' % (y, m, d, c, cat, prod, unit, kg)
rows = []
for k in range(24):
    y, m = 2024 + k // 12, k % 12 + 1
    for d in (1, 2, 3, 4, 5, 6):
        rows.append(row(y, m, d, 'Spain', 'Salmon fillets', 20.0 if k < 12 else 30.0))        # salto del 50 % en 2025-01
        rows.append(row(y, m, d, 'Spain', 'Seabass', '', unit='5.0'))                          # solo precio por unidad: fuera
        rows.append(row(y, m, d, 'Norway', 'Salmon fillets', 9.0))                               # no es Estado miembro
    rows.append(row(y, m, 7, 'Spain', 'Trout', 8.0))                                          # un solo dia al mes: sin media
rows.append(row(2026, 2, 1, 'Spain', 'Salmon fillets', 1500))                                  # absurdo (> 1000 EUR/kg): fuera
for c in ('France', 'Italy', 'Poland', 'Sweden', 'Portugal', 'Germany', 'Ireland', 'Greece', 'Denmark'):
    for k in range(14):
        for d in range(1, 7): rows.append(row(2025 + k // 12, k % 12 + 1, d, c, 'Seabass', 10.0 + k * 0.1, cat='Frozen'))
acc = {}
n = M.accumulate(H + '\n' + '\n'.join(rows) + '\n', acc)
check(('ES', 'Fresh', 'Seabass') not in acc, 'precio por unidad no cuenta')
check(all(k[0] != 'NO' for k in acc), 'solo Estados miembros')
b = M.build(acc)
es = {(s['category'], s['product']): s for s in b['ES']}
check(set(es) == {('Fresh', 'Salmon fillets')}, 'Trout (1 dia/mes) fuera, Seabass fuera: %s' % sorted(es))
s = es[('Fresh', 'Salmon fillets')]
check(s['points'][0] == ['2024-01', 20.0, 6] and len(s['points']) == 24, 'media y dias: %s' % s['points'][0])
check(s['breaks'] == ['2025-01'], 'salto marcado: %s' % s['breaks'])
check('FR' in b and b['FR'][0]['breaks'] == [], 'serie sin salto')
check(len(b['FR'][0]['points']) == 14 and b['FR'][0]['category'] == 'Frozen', 'serie con 14 meses')
try: M.accumulate('a;b\n1;2\n', {}); check(False, 'debe fallar sin columnas')
except RuntimeError as e: check('faltan columnas' in str(e), 'mensaje: %s' % e)
print('EUMOFA precios minoristas online: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

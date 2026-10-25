#!/usr/bin/env python3
"""Pruebas de scripts/update-us-sulphur.py con respuestas sinteticas del Census (sin red ni clave): kg -> t, precio unitario, total mundial frente a suma de paises,
umbral de volumen, unidad inesperada."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('usul', ROOT / 'scripts' / 'update-us-sulphur.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(ok, msg):
    if not ok: fails.append(msg); print('FALLA', msg)
H = ['GEN_VAL_MO', 'GEN_QY1_MO', 'UNIT_QY1', 'CTY_CODE', 'CTY_NAME', 'time']
months = ['%04d-%02d' % (2022 + i // 12, i % 12 + 1) for i in range(30)]
def rows(world=True, unit='KG', tons=1000):
    out = [H]
    for i, m in enumerate(months):
        usd = (100 + i) * tons                       # (100+i) USD/t
        if world: out.append([str(usd), str(tons * 1000), unit, '-', 'TOTAL FOR ALL COUNTRIES', m])
        out.append([str(usd // 2), str(tons * 500), unit, '1220', 'CANADA', m]); out.append([str(usd - usd // 2), str(tons * 500), unit, '2010', 'MEXICO', m])
    return out
mo, units, wt = M.parse(rows())
check(wt and units == {'KG'}, 'total mundial: %s %s' % (wt, units))
pts = M.build(mo)
check(len(pts) == 30 and pts[0] == ['2022-01', 100.0, 1000, 100000] and pts[1][1] == 101.0, 'puntos: %s' % pts[:2])
mo2, _, wt2 = M.parse(rows(world=False))
check(not wt2 and M.build(mo2) == pts, 'sin fila de total debe sumar los paises y dar lo mismo')
check(M.build(M.parse(rows(tons=0.2))[0]) == [], 'menos de 500 t al mes no da precio')
check(M.parse(rows(unit='NO'))[1] == {'NO'}, 'la unidad se devuelve para que el script la rechace')
bad = rows(); bad[4][1] = 'x'
check(len(M.build(M.parse(bad)[0])) == 29, 'una fila ilegible se omite sin romper')
print('azufre Census: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Pruebas de scripts/build-baskets.py con series sinteticas: media mensual, mes semanal incompleto fuera, ano base = media 100, pesos iguales,
mes con hueco no se publica, minimos (2 series y 24 meses), veredicto = el peor, determinismo."""
import importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
s = importlib.util.spec_from_file_location('b', ROOT / 'scripts' / 'build-baskets.py'); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
ok = 0
def check(name, cond):
    global ok
    if not cond: sys.exit('FALLA: ' + name)
    ok += 1; print('OK    ', name)
tmp = Path(tempfile.mkdtemp()); (tmp / 'series' / 'eu').mkdir(parents=True)
def mon(y0, y1, f, gaps=()):
    return [['%d-%02d' % (y, mo), f(y, mo)] for y in range(y0, y1 + 1) for mo in range(1, 13) if '%d-%02d' % (y, mo) not in gaps]
def wk(y0, y1, f):
    return [['%d-%02d-%02d' % (y, mo, d), f(y, mo)] for y in range(y0, y1 + 1) for mo in range(1, 13) for d in (7, 14, 21, 28)]
def ser(p, freq, pts, verdict='apto'):
    d = {'id': 'eu/' + p, 'product': p, 'region': 'eu', 'name': {'es': p}, 'place': {'es': 'UE'}, 'unit': 't', 'currency': 'EUR', 'frequency': freq, 'sourceName': 'F', 'license': 'L', 'verdict': verdict, 'attribution': 'Source: ' + p, 'points': pts}
    (tmp / 'series' / 'eu' / (p + '.json')).write_text(json.dumps(d)); return {'id': 'eu/' + p}
a_pts = mon(2020, 2022, lambda y, mo: 100.0 if y == 2020 else 200.0)         # base 2020 = 100 -> 2021+ = 200
b_pts = mon(2020, 2022, lambda y, mo: 50.0 if y == 2020 else 50.0)           # plana
c_pts = wk(2020, 2022, lambda y, mo: 10.0) + [['2023-01-07', 99.0], ['2023-01-14', 99.0]]   # enero 2023 semanal incompleto (hasta el 14)
S = [ser('a', 'monthly', a_pts), ser('b', 'monthly', b_pts, 'condiciones'), ser('c', 'weekly', c_pts), ser('gap', 'monthly', mon(2020, 2022, lambda y, mo: 10.0, gaps=('2021-06',))), ser('gend', 'monthly', mon(2020, 2022, lambda y, mo: 10.0, gaps=('2022-11',))), ser('short', 'monthly', mon(2022, 2022, lambda y, mo: 10.0))]
(tmp / 'index.json').write_text(json.dumps({'generatedAt': '2026-10-19', 'series': S}))
m.API = tmp
m.BASKETS = [('eu', 'ab', {'es': 'AB'}, ['a', 'b']), ('eu', 'abg', {'es': 'ABG'}, ['a', 'b', 'gap']), ('eu', 'agend', {'es': 'AGEND'}, ['a', 'gend']), ('eu', 'ash', {'es': 'ASH'}, ['a', 'short']), ('eu', 'one', {'es': 'UNO'}, ['a']), ('eu', 'nox', {'es': 'NOX'}, ['a', 'nox']), ('eu', 'ac', {'es': 'AC'}, ['a', 'c'])]
F = m.build(); idx = json.loads(F['index.json']); B = {b['basket']: json.loads(F['eu/%s.json' % b['basket']]) for b in idx['baskets']}
ex = {e['id']: e['reason'] for e in idx['excluded']}
ab = B['ab']; d = dict(ab['points'])
check('año base: la media del año base vale 100', abs(sum(v for k, v in ab['points'] if k[:4] == '2020') / 12 - 100) < 0.01)
check('pesos iguales: media simple de 200 % y 100 % -> 150', d['2021-03'] == 150.0 and d['2020-05'] == 100.0)
check('veredicto = el peor de los miembros', ab['verdict'] == 'condiciones' and B['ac']['verdict'] == 'apto')
check('un mes con hueco en un miembro no se publica (sin relleno)', '2021-06' not in {k for k, _ in B['abg']['points']} and '2021-05' in {k for k, _ in B['abg']['points']})
check('mes semanal incompleto (datos hasta el dia 14) no cuenta', B['ac']['last'] == '2022-12')
check('menos de 24 meses: excluida con motivo', 'eu/ash' in ex and '24' in ex['eu/ash'])
check('una sola serie: excluida', 'eu/one' in ex)
check('serie que no existe en la API: excluida con motivo', 'eu/nox' in ex and 'nox' in ex['eu/nox'])
check('variacion anual recalculada', abs(ab['changeYoYPct']) < 0.001 and ab['changeMoMPct'] == 0)
check('metodologia en 4 idiomas en cada cesta', all(set(b['methodology']) == {'es', 'en', 'fr', 'it'} for b in B.values()))
def _consec(a, b): return (int(b[:4]) * 12 + int(b[5:])) - (int(a[:4]) * 12 + int(a[5:])) == 1
check('variacion mensual: solo con el mes anterior; con hueco entre los dos ultimos puntos = null, nunca se compara con un mes lejano',
      all((b['changeMoMPct'] is None) == (not _consec(b['points'][-2][0], b['points'][-1][0])) for b in B.values()))
check('hay al menos una cesta de prueba con hueco antes del ultimo mes y su variacion mensual es null', any(not _consec(b['points'][-2][0], b['points'][-1][0]) and b['changeMoMPct'] is None for b in B.values()))
check('determinista', m.build() == F)
print('%d comprobaciones OK' % ok)

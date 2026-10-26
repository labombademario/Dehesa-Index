#!/usr/bin/env python3
"""Pruebas de scripts/update-rivers.py con datos sinteticos (sin red): media diaria solo con lecturas en >= 20 horas, dia en curso fuera, union con la historia guardada,
relleno con la serie larga solo donde se pide, referencia propia (cuartiles de +-7 dias en anos anteriores, minimo de anos), percentil y estado."""
import datetime, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rv', ROOT / 'scripts' / 'update-rivers.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
def hours(d, hs, v): return [("%sT%02d:%02d" % (d, h, m), v + h * 0.0) for h in hs for m in (0, 30)]
# media diaria
dd = M.daily(hours('2026-10-24', range(24), 10.0) + hours('2026-10-25', range(12), 10.0) + [('2026-10-26T01:00', None)])
check(list(dd) == ['2026-10-24'] and dd['2026-10-24'] == 10.0, 'solo el dia con 24 horas: %s' % dd)
# ventana de +-7 dias independiente del ano
check(M.doy_window('2026-10-26', '2019-10-20') and M.doy_window('2026-10-26', '2019-11-02') and not M.doy_window('2026-10-26', '2019-11-04'), 'ventana de +-7 dias')
# referencia: 10 anos, valores 1..N en la ventana
hist = {}
for y in range(2014, 2024):
    for k in range(-7, 8):
        hist[(datetime.date(y, 10, 26) + datetime.timedelta(days=k)).isoformat()] = 100.0 + (y - 2014) * 10 + k
ref = M.reference(hist, '2026-10-26', 80.0)
check(ref and ref['pct'] == 0 and ref['years'] == [2014, 2023] and ref['n'] == 10, 'por debajo de todo: %s' % ref)
ref2 = M.reference(hist, '2026-10-26', 1000.0); check(ref2 and ref2['pct'] == 100, 'por encima de todo: %s' % ref2)
ref3 = M.reference(hist, '2026-10-26', ref['p50']); check(ref3 and 45 <= ref3['pct'] <= 55 and ref3['p25'] < ref3['p50'] < ref3['p75'], 'mediana en el centro: %s' % ref3)
few = {d: v for d, v in hist.items() if int(d[:4]) >= 2020}; check(M.reference(few, '2026-10-26', 100.0) is None, 'menos de %d anos: sin referencia' % M.MIN_YEARS)
cur = {d: v for d, v in hist.items()}; cur['2026-10-20'] = 5.0; check(M.reference(cur, '2026-10-26', 100.0)['n'] == 10, 'el ano en curso no entra en la referencia')
# estacion
now = datetime.datetime(2026, 10, 26, 18, 0, tzinfo=datetime.timezone.utc)
q = hours('2026-10-25', range(24), 90.0) + hours('2026-10-26', range(10), 80.0)
meta = {"id": "x1", "river": "Rijn", "name": "Lobith", "lon": 6.1, "lat": 51.8, "w": [("2026-10-26T09:30", 700.0)], "q": q, "qh": hist, "prefill": False}
s = M.build_station(meta, now, {"points": [["2026-10-20", 1.0, 2.0]]})
check(s['q']['value'] == 80.0 and s['w']['value'] == 700.0, 'lectura actual: %s %s' % (s['q'], s['w']))
check(s['state'] == 'low' and s['w']['state'] == 'low' and s['ref']['basis'] == 'Q' and s['ref']['pct'] == 0, 'estado bajo con caudal %s' % s['ref'])
check([p[0] for p in s['points']] == ['2026-10-20', '2026-10-25'], 'sin relleno con la serie larga (prefill False) y sin el dia en curso: %s' % [p[0] for p in s['points']])
meta2 = dict(meta); meta2.pop('prefill'); s2 = M.build_station(meta2, now, None)
check(len(s2['points']) > 100 and s2['points'][-1][0] == '2026-10-25', 'con prefill la serie larga rellena la historia: %d' % len(s2['points']))
check(s2['points'][-1][2] == 90.0, 'lo recalculado manda sobre la serie larga')
meta3 = dict(meta, q=[], qh={}); s3 = M.build_station(meta3, now, None); check(s3['q'] is None and s3['state'] is None and s3['ref'] == {}, 'solo nivel y sin historia: sin estado')
check(M.build_station(dict(meta, w=[], q=[]), now, None) is None, 'sin lecturas no se publica')
hi = M.build_station(dict(meta, q=hours('2026-10-26', range(24), 1000.0)), now, None); check(hi['state'] == 'high', 'estado alto: %s' % hi['state'])
print('Rios (NL, FR, CA, BE): %d fallos' % len(fails)); sys.exit(1 if fails else 0)

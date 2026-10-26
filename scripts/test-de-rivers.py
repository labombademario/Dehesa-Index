#!/usr/bin/env python3
"""Pruebas de scripts/update-de-rivers.py con respuestas sinteticas de PEGELONLINE (sin red): media diaria solo de dias con lecturas suficientes, dia en curso fuera,
union con la historia ya guardada (lo recalculado manda), referencias oficiales y estado de la WSV."""
import datetime, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('dr', ROOT / 'scripts' / 'update-de-rivers.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
def day(d, n, v, off='+01:00'):
    return [{"timestamp": "%sT%02d:%02d:00%s" % (d, (i * 15) // 60, (i * 15) % 60, off), "value": v + (i % 2)} for i in range(n)]
st = {"uuid": "u1", "shortname": "KAUB", "longname": "KAUB", "km": 546.23, "agency": "BINGEN", "water": {"shortname": "RHEIN"},
      "timeseries": [{"shortname": "Q", "equidistance": 15, "currentMeasurement": {"timestamp": "2026-10-26T16:15:00+01:00", "value": 673.0}},
                     {"shortname": "W", "equidistance": 15, "currentMeasurement": {"timestamp": "2026-10-26T16:30:00+01:00", "value": 55.0, "stateMnwMhw": "low"},
                      "characteristicValues": [{"shortname": "MNW", "value": 65.0, "timespanStart": "2010-11-01", "timespanEnd": "2020-10-31"}, {"shortname": "MW", "value": 208.0, "timespanStart": "2010-11-01", "timespanEnd": "2020-10-31"},
                                               {"shortname": "GlW", "value": 77.0}, {"shortname": "NW", "value": 25.0}, {"shortname": "NNW", "value": 25.0}]}]}
meas = {"u1/W": day("2026-10-23", 96, 40) + day("2026-10-24", 50, 30) + day("2026-10-25", 96, 20) + day("2026-10-26", 60, 50),
        "u1/Q": day("2026-10-23", 96, 500) + day("2026-10-25", 96, 600)}
now = datetime.datetime(2026, 10, 26, 15, 40, tzinfo=datetime.timezone.utc)
old = {"points": [["2026-10-20", 99.0, 700.0], ["2026-10-23", 1.0, 1.0]]}
r = M.station(st, 'Rhein', old, lambda u, s: meas.get(u + '/' + s, []), now)
d = {p[0]: p for p in r['points']}
check(sorted(d) == ['2026-10-20', '2026-10-23', '2026-10-25'], 'dias guardados: %s' % sorted(d))
check(d['2026-10-23'][1] == 40.5 and d['2026-10-23'][2] == 500.5, 'lo recalculado manda sobre lo guardado: %s' % (d['2026-10-23'],))
check('2026-10-24' not in d, 'un dia con 50 de 96 lecturas no se guarda')
check('2026-10-26' not in d, 'el dia en curso no se guarda')
check(d['2026-10-25'][2] == 600.5 and d['2026-10-20'] == ['2026-10-20', 99.0, 700.0], 'caudal y dia antiguo conservado')
check(r['ref'] == {'MNW': 65.0, 'period': ['2010', '2020'], 'MW': 208.0, 'GlW': 77.0, 'NNW': 25.0}, 'referencias oficiales: %s' % r['ref'])
check(r['w']['state'] == 'low' and r['w']['value'] == 55.0 and r['q']['value'] == 673.0, 'estado de la WSV y lectura actual')
check(r['id'] == 'kaub' and r['name'] == 'Kaub' and r['first'] == '2026-10-20' and r['last'] == '2026-10-25', 'identidad: %s %s' % (r['id'], r['name']))
st2 = dict(st); st2['timeseries'] = [st['timeseries'][0]]
check(M.station(st2, 'Rhein', None, lambda u, s: [], now) is None, 'sin nivel actual no se publica')
check(M.pick([st])[('RHEIN', 'KAUB')] is st and ('ELBE', 'DRESDEN') not in M.pick([st]), 'seleccion por rio y estacion')
check(M.DISPLAY['Trier UP'] == 'Trier' and ('MOSEL', 'Cochem') in [(w, n) for w, n, _ in M.STATIONS], 'estaciones de Mosela con nombre limpio')
print('Rios alemanes (PEGELONLINE): %d fallos' % len(fails)); sys.exit(1 if fails else 0)

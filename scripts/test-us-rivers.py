#!/usr/bin/env python3
"""Pruebas de scripts/update-us-rivers.py con JSON sintetico del USGS (sin red): valores sin dato fuera, media de 7 dias, percentil frente al mismo mes de años anteriores, climatologia."""
import datetime, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rv', ROOT / 'scripts' / 'update-us-rivers.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fails = []
def check(c, m):
    if not c: fails.append(m); print('FALLO:', m)
vals = []
d = datetime.date(2010, 1, 1)
while d <= datetime.date(2026, 10, 25):
    v = 100000 + (d.year - 2010) * 1000
    if d.year == 2026 and d.month == 10: v = 50000          # octubre de 2026 muy bajo
    vals.append({"value": str(v), "dateTime": d.isoformat() + "T00:00:00.000"}); d += datetime.timedelta(days=1)
vals.append({"value": "-999999", "dateTime": "2026-10-26T00:00:00.000"})
doc = {"value": {"timeSeries": [{"sourceInfo": {"siteCode": [{"value": "07010000"}]}, "variable": {"variableCode": [{"value": "00060"}], "noDataValue": -999999.0}, "values": [{"value": vals}]},
                                {"sourceInfo": {"siteCode": [{"value": "07010000"}]}, "variable": {"variableCode": [{"value": "00065"}], "noDataValue": -999999.0}, "values": [{"value": [{"value": "5", "dateTime": "2026-10-25T00:00:00.000"}]}]}]}}
data = M.parse(doc)
check(list(data) == ['07010000'] and '2026-10-26' not in data['07010000'], 'sin dato fuera y solo caudal')
st = M.station('07010000', 'Mississippi', 'St. Louis, MO', data['07010000'], datetime.date(2026, 10, 26))
check(st['last'] == '2026-10-25' and st['avg7'] == 50000, 'media de 7 dias: %s' % st['avg7'])
check(st['pctMonth'] == 0.0, 'percentil del mes muy bajo: %s' % st['pctMonth'])
check(st['nYears'] == 16 and st['histYears'] == ['2010', '2025'], 'años completos: %s %s' % (st['nYears'], st['histYears']))
check(len(st['clim']) == 365 and st['clim'][0][1] == 107500, 'climatologia (mediana): %s' % (st['clim'][0],))
check(len(st['points']) <= M.KEEP_DAYS + 1, 'serie recortada')
print('Rios de EE. UU. (USGS): %d fallos' % len(fails)); sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Pruebas del calculo meteorologico de Belgica (KMI) con datos sinteticos: Makkink conocido, deficit acumulado desde el 1 de abril, minimo de 8 estaciones por dia,
mensual con meses parciales, años antiguos que faltan y fallo cerrado (conserva el fichero anterior). Uso: python3 scripts/test-be-weather.py"""
import datetime, importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("m", ROOT / "scripts" / "update-be-weather.py"); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
ok = True
def chk(name, cond):
    global ok
    print(("OK   " if cond else "FALLO ") + name)
    if not cond: ok = False
chk("Makkink: 15 C, 200 W/m2 -> 2,84 mm/dia", abs(m.makkink(15, 200, 1013) - 2.84) < 0.03)
chk("Makkink: sin radiacion o fuera de rango -> None", m.makkink(15, None, 1013) is None and m.makkink(80, 200, 1013) is None and m.makkink(15, -5, 1013) is None)
chk("Makkink: radiacion 0 -> 0", m.makkink(5, 0, 1000) == 0)
CODES = list(m.PROV)[:12]
def feature(code, d, r, t=15.0, k=200.0):
    return {"properties": {"code": int(code), "timestamp": d + "T00:00:00Z", "precip_quantity": r, "temp_avg": t, "temp_min": t - 5, "temp_max": t + 5, "short_wave_from_sky_avg": k, "pressure": 1013.0, "temp_soil_avg_10cm": t - 1}}
def year(y, last=None, rain=2.0, nst=12):
    fs = []; d = datetime.date(y, 1, 1)
    while d.year == y and (last is None or d <= last):
        for c in CODES[:nst]: fs.append(feature(c, d.isoformat(), rain))
        d += datetime.timedelta(days=1)
    return {"features": fs}
today = datetime.date(2026, 10, 26)
Y = {y: m.days(year(y, None if y < 2026 else today - datetime.timedelta(days=1))) for y in range(2005, 2027)}
stations = [{"code": int(c), "name": "ST" + c, "lon": 4.5, "lat": 50.8, "alt": 50.0} for c in CODES]
deficit, monthly, last30, st = m.build(Y, today, stations)
e = m.makkink(15, 200, 1013)
chk("deficit: primer dia = ET0 - lluvia", abs(deficit["cur"][0] - round(e - 2.0, 1)) < 0.06)
chk("deficit: acumulado de 30 dias", abs(deficit["cur"][29] - round(30 * (e - 2.0), 1)) < 0.5)
chk("deficit: el año en curso llega hasta el ultimo dia disponible (25 oct)", len(deficit["cur"]) == 208 and deficit["asOf"] == "2026-10-25")
chk("deficit: mediana de años identicos = curva propia y banda p10 = p90", deficit["med"][100] == deficit["p10"][100] == deficit["p90"][100])
chk("monthly: 12 meses seguidos, el ultimo parcial sin lluvia mensual", len(monthly) == 12 and monthly[-1]["rain"] is None and monthly[0]["rain"] is not None)
import calendar
m0 = monthly[0]
chk("monthly: la normal del primer mes = dias del mes * 2 mm", abs(m0["rainNormal"] - 2.0 * calendar.monthrange(2025, m0["m"])[1]) < 0.3)
chk("last30: 30 dias * 2 mm y normal igual", abs(last30["rain"] - 60.0) < 0.2 and abs(last30["rainNormal"] - 60.0) < 0.5)
chk("stations: 12 con provincia y heladas 0", len(st) == 12 and all(s["province"].startswith("BE") and s["frost30"] == 0 for s in st))
# menos de 8 estaciones un dia -> hueco que se rellena, no se inventa
Y2 = dict(Y); Y2[2026] = m.days({"features": year(2026, today - datetime.timedelta(days=1))["features"] + []})
d3 = {k: dict(v) for k, v in Y2[2026].items()}
d3["2026-06-10"] = dict(list(d3["2026-06-10"].items())[:7])
s3 = m.season(2026, d3)
i = (datetime.date(2026, 6, 10) - datetime.date(2026, 4, 1)).days
chk("season: un dia con 7 estaciones se rellena con el valor anterior", s3[i] == s3[i - 1])
# fallo cerrado: sin el año en curso se conserva el fichero anterior
with tempfile.TemporaryDirectory() as t:
    t = Path(t); (t / "stations.json").write_text(json.dumps(stations))
    for y in range(2005, 2026): (t / ("%d.json" % y)).write_text(json.dumps(year(y)))
    out = t / "out.json"; out.write_text('{"viejo": true}')
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "update-be-weather.py"), "--local", str(t), "--today", "2026-10-26", "--out", str(out)], capture_output=True, text=True)
    chk("fallo cerrado: falta el año en curso -> conserva el fichero y sale 0", r.returncode == 0 and json.loads(out.read_text()) == {"viejo": True} and "FALLO" in r.stdout)
    (t / "2026.json").write_text(json.dumps(year(2026, today - datetime.timedelta(days=1))))
    (t / "2010.json").unlink()
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "update-be-weather.py"), "--local", str(t), "--today", "2026-10-26", "--out", str(out)], capture_output=True, text=True)
    d = json.loads(out.read_text())
    chk("un año antiguo que falta se omite con aviso", r.returncode == 0 and "aviso: 2010" in r.stdout and d["deficit"]["curYear"] == 2026 and all(x[0] != 2010 for x in d["deficit"]["yearMax"]))
sys.exit(0 if ok else 1)

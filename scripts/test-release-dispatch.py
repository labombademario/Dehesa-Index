#!/usr/bin/env python3
"""Test sin red del lanzador por calendario (horas de Nueva York con y sin horario de verano, intentos, duplicados, seguidores)."""
import datetime, importlib.util, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("rd", ROOT / "scripts" / "release-dispatch.py"); rd = importlib.util.module_from_spec(sp); sp.loader.exec_module(rd)
UTC = datetime.timezone.utc; bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b)); print("FALLO", m, a, b)
    else: print("OK  ", m)
T = lambda s: datetime.datetime.strptime(s, "%Y-%m-%dT%H:%M").replace(tzinfo=UTC)
run = lambda w, c, st="completed", co="success", up=None: {"path": ".github/workflows/" + w, "created_at": c + ":00Z", "updated_at": (up or c) + ":00Z", "status": st, "conclusion": co}
wasde = {"date": "2026-10-09", "time": "12:00", "agency": "OCE", "id": "wasde", "name": "WASDE"}
cof = {"date": "2026-10-23", "time": "15:00", "agency": "NASS", "id": "cattle-on-feed", "name": "Cattle on Feed"}
dec = {"date": "2026-12-10", "time": "12:00", "agency": "OCE", "id": "wasde", "name": "WASDE"}
eq(rd.release_utc(wasde), T("2026-10-09T16:00"), "12:00 ET en octubre (EDT) = 16:00 UTC")
eq(rd.release_utc(dec), T("2026-12-10T17:00"), "12:00 ET en diciembre (EST) = 17:00 UTC")
w = lambda rel, runs, now: [x[0] for x in rd.decide(rel, runs, T(now))]
eq(w([wasde], [], "2026-10-09T16:30"), [], "antes de +40 min no se lanza")
eq(w([wasde], [], "2026-10-09T16:45"), ["update-usda-psd.yml"], "a +45 min se lanza PSD")
eq(w([wasde], [run("update-usda-psd.yml", "2026-10-09T16:41")], "2026-10-09T16:55"), [], "ya lanzado tras el intento: no se repite")
eq(w([wasde], [run("update-usda-psd.yml", "2026-10-09T16:41")], "2026-10-09T20:05"), ["update-usda-psd.yml"], "segundo intento a +4 h")
eq(w([wasde], [run("update-usda-psd.yml", "2026-10-09T16:41", "in_progress", None)], "2026-10-09T16:55"), [], "en curso: no se lanza")
eq(w([wasde], [], "2026-10-10T03:00"), [], "fuera de la ventana: lo cubre el cron")
eq(sorted(w([cof], [], "2026-10-23T20:00")), ["update-cattle-on-feed.yml", "update-nass.yml"], "Cattle on Feed lanza su workflow y NASS")
two = [cof, dict(cof, id="cold-storage", name="Cold Storage")]
eq(sorted(w(two, [], "2026-10-23T20:00")), ["update-cattle-on-feed.yml", "update-nass.yml"], "dos informes a la vez: NASS una sola vez")
eq(w([dict(cof, id="peanut-prices")], [], "2026-10-23T20:00"), [], "informe que no usamos: nada")
eq(w([dict(cof, time=None)], [], "2026-10-23T20:00"), [], "sin hora: nada")
eq(w([], [run("update-nass.yml", "2026-10-23T19:40", up="2026-10-23T20:05")], "2026-10-23T20:15"), ["update-us-stats.yml"], "us-stats tras NASS bien")
eq(w([], [run("update-nass.yml", "2026-10-23T19:40", up="2026-10-23T20:05"), run("update-us-stats.yml", "2026-10-23T20:10")], "2026-10-23T20:30"), [], "us-stats ya lanzado despues")
eq(w([], [run("update-nass.yml", "2026-10-23T19:40", co="failure", up="2026-10-23T20:05")], "2026-10-23T20:15"), [], "NASS fallido: us-stats no")
# todos los workflows del mapa existen
for ws in list(rd.MAP.values()) + [list(rd.FOLLOW)] + list(rd.FOLLOW.values()):
    for x in ws: eq((ROOT / ".github/workflows" / x).exists(), True, "existe " + x)
cal = json.loads((ROOT / "data/usda-calendar.json").read_text(encoding="utf-8"))
eq(bool([r for r in cal["releases"] if r["id"] in rd.MAP]), True, "el calendario real trae informes del mapa")
raise SystemExit(1 if bad else 0)

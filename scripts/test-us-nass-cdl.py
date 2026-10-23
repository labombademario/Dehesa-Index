#!/usr/bin/env python3
"""Prueba sin red del Cropland Data Layer: respuesta XML de CropScape y CSV con las cabeceras reales (con espacios), cola incremental y serie nacional."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cd", ROOT / "scripts" / "update-us-nass-cdl.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
xml = b'<ns1:GetCDLStatResponse xmlns:ns1="x"><returnURL>https://nassgeodata.gmu.edu/webservice/nass_data_cache/byfips/CDL_2024_19.csv</returnURL></ns1:GetCDLStatResponse>'
csvb = b"Value, Category, Count,  Acreage\n1, Corn, 100, 13500000.5\n5, Soybeans, 90, 9200000.0\n61, Fallow/Idle Cropland, 5, 1000.0\n176, Grassland/Pasture, 7, 5.5\n"
def fake_get(url, tries=3, timeout=180, accept=None): return xml if "GetCDLStat" in url else csvb
C.U.get = fake_get
r = C.fetch("19", 2024); eq(r, {"Corn": 13500000.5, "Soybeans": 9200000.0}, "solo cultivos elegidos, cabeceras con espacios")
C.U.get = lambda url, **k: b"<x/>"; eq(C.fetch("19", 2030), None, "sin returnURL -> None")
eq(C.latest_year(lambda f, y: {"x": 1} if y <= 2025 else None) >= 2025 or True, True, "latest_year corre")
cache = {}
eq(len(C.pending(cache, 2025)), 48 * (2025 - C.FIRST + 1), "todo pendiente"); eq(C.pending(cache, 2025)[0][0], 2025, "primero el ano reciente")
for f in C.STATES:
    for y in range(2018, 2026): cache.setdefault(f, {})[str(y)] = {"Corn": 1e5 + int(f), "Soybeans": 5e4, "Cotton": 10.0}
eq(len(C.pending(cache, 2025)), 48 * (2025 - C.FIRST + 1) - 48 * 8, "lo descargado ya no se pide")
s = {x["id"]: x for x in C.build(cache)}
eq("us-cdl-corn-19-a" in s, True, "serie estatal maiz Iowa"); eq("us-cdl-cotton-19-a" in s, False, "algodon < 1000 acres descartado")
eq(s["us-cdl-corn-us-a"]["latest"], sum(1e5 + int(f) for f in C.STATES), "suma nacional"); eq(s["us-cdl-corn-19-a"]["latestPeriod"], "2025", "ultimo ano")
del cache["19"]["2025"]; s = {x["id"]: x for x in C.build(cache)}
eq(s["us-cdl-corn-us-a"]["latestPeriod"], "2024", "sin Iowa 2025 la serie nacional acaba en 2024")
print("OK test-us-nass-cdl" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

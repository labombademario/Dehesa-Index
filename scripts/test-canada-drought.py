#!/usr/bin/env python3
"""Pruebas del calculo de sequia de Canada: proyeccion de areas, referencia de provincias, extracto real del Canadian Drought Monitor y datos publicados."""
import gzip, importlib.util, json, math, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("d", ROOT / "scripts" / "update-canada-drought.py"); d = importlib.util.module_from_spec(spec); spec.loader.exec_module(d)
from shapely.geometry import Polygon, box, shape
from shapely.ops import transform
F = []
def T(name, ok):
    print(("OK   " if ok else "FALLO ") + name)
    if not ok: F.append(name)
def merc(lon, lat): return d.R * math.radians(lon), d.R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
def ring(l0, l1, p0, p1, n=40):
    pts = [(l0 + (l1 - l0) * i / n, p0) for i in range(n)] + [(l1, p0 + (p1 - p0) * i / n) for i in range(n)] + [(l1 - (l1 - l0) * i / n, p1) for i in range(n)] + [(l0, p1 - (p1 - p0) * i / n) for i in range(n)]
    return pts
# 1. Albers conserva areas: rectangulo lon/lat contra la formula esferica R^2 * dlon * (sin lat2 - sin lat1)
for (l0, l1, p0, p1) in ((-110, -100, 50, 55), (-80, -60, 45, 62), (-140, -120, 60, 69)):
    a = transform(d.tr_ll, Polygon(ring(l0, l1, p0, p1))).area
    ex = d.R ** 2 * math.radians(l1 - l0) * (math.sin(math.radians(p1)) - math.sin(math.radians(p0)))
    T("area conservada en el rectángulo %s: %.3f %%" % ((l0, l1, p0, p1), 100 * (a / ex - 1)), abs(a / ex - 1) < 0.005)
# 2. porcentaje con geometria sintetica: la sequia cubre la mitad oeste de una "provincia"
prov = {"XX": ("Test", transform(d.tr_ll, Polygon(ring(-110, -100, 50, 55))))}
half = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[list(merc(*p)) for p in ring(-111, -105, 49, 56)] + [list(merc(-111, 49))]]}}]}
none = {"type": "FeatureCollection", "features": []}
r = d.shares({"D0": half, "D1": half, "D2": none, "D3": none, "D4": none}, prov)["XX"]
T("mitad de la provincia en sequia = 50%% (D0, D1) y 0%% (D2-D4): %s" % r, abs(r[0] - 50) < 1 and abs(r[1] - 50) < 1 and r[2:] == [0.0, 0.0, 0.0])
T("la sequia fuera de la provincia no cuenta", d.shares({c: {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[list(merc(*p)) for p in ring(-90, -85, 40, 45)] + [list(merc(-90, 40))]]}}]} for c in d.CLASSES}, prov)["XX"] == [0.0] * 5)
# 3. referencia de provincias: superficies conocidas (km2, con aguas interiores), tolerancia 6 %
P = d.provinces(); km = {k: v[1].area / 1e6 for k, v in P.items()}
known = {"SK": 651900, "AB": 661800, "MB": 647800, "ON": 1076400, "QC": 1542100, "BC": 944700, "NS": 55300, "PE": 5660}
T("las 13 provincias y territorios", len(P) == 13)
T("superficies de la referencia dentro del 6 %% de las oficiales: %s" % {k: round(km[k] / v, 3) for k, v in known.items()}, all(abs(km[k] / v - 1) < 0.06 for k, v in known.items()))
T("Canada suma 9,98 millones de km2 (5 %)", abs(sum(km.values()) / 9984670 - 1) < 0.05)
# 4. extracto real del Canadian Drought Monitor (agosto de 2026, ventana de las praderas, coordenadas EPSG:3857)
fx = json.loads(gzip.decompress((ROOT / "scripts" / "fixtures" / "cdm-2608-window.json.gz").read_bytes()))["files"]
files = {("D" + n.split("_D")[1][0]): v for n, v in fx.items()}
T("el extracto trae las cinco clases", sorted(files) == d.CLASSES)
T("el extracto esta en metros (EPSG:3857), no en grados", max(abs(c) for fc in files.values() for f in fc["features"] for r in f["geometry"]["coordinates"][0] for c in (r[0] if isinstance(r[0], list) else r)) > 1000)
sh = d.shares(files, P)
T("clases acumulativas: D0 >= D1 >= D2 >= D3 >= D4 en cada provincia", all(all(r[i] >= r[i + 1] for i in range(4)) for r in sh.values()))
T("porcentajes entre 0 y 100", all(0 <= x <= 100 for r in sh.values() for x in r))
T("fuera de la ventana (Atlantico) no hay sequia en el extracto", all(sh[c] == [0.0] * 5 for c in ("NB", "NS", "PE", "NL")))
# 5. datos publicados
p = ROOT / "data" / "canada-drought.json"
if p.exists():
    D = json.loads(p.read_text())
    T("periodos ordenados, fin de mes y asOf = ultimo", D["periods"] == sorted(set(D["periods"])) and D["asOf"] == D["periods"][-1])
    T("13 provincias con un valor por periodo", len(D["provinces"]) == 13 and all(len(v["v"]) == len(D["periods"]) for v in D["provinces"].values()))
    T("publicado: clases acumulativas y 0-100", all(all(0 <= x <= 100 for r in v["v"] for x in r) and all(r[i] >= r[i + 1] for r in v["v"] for i in range(4)) for v in D["provinces"].values()))
    T("al menos 6 meses", len(D["periods"]) >= 6)
print("\n%d fallos" % len(F)); sys.exit(1 if F else 0)

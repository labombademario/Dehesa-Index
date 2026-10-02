#!/usr/bin/env python3
"""Genera vendor/ca-provinces.js: contornos de las provincias y territorios de Canada (Natural Earth 1:50m, dominio publico) en proyeccion Albers equivalente, lista para SVG.
Mismo formato que vendor/us-states.js: window.DEHESA_CA_PROVINCES = {viewBox, states:[{id, name, d}]}. Uso: python3 scripts/build-region-maps.py"""
import importlib.util, json
from pathlib import Path
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.ops import transform
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("d", ROOT / "scripts" / "update-canada-drought.py"); D = importlib.util.module_from_spec(spec); spec.loader.exec_module(D)
W = 975.0
fc = json.loads((ROOT / "scripts" / "ref" / "ne-provinces-ca.json").read_text(encoding="utf-8"))
geo = {}
for f in fc["features"]:
    n = f["properties"]["name"]
    if n in D.CODES: geo[D.CODES[n]] = (n, transform(D.tr_ll, shape(f["geometry"])).simplify(2500, preserve_topology=True))
minx = min(g.bounds[0] for _, g in geo.values()); maxx = max(g.bounds[2] for _, g in geo.values()); miny = min(g.bounds[1] for _, g in geo.values()); maxy = max(g.bounds[3] for _, g in geo.values())
k = W / (maxx - minx); H = round((maxy - miny) * k, 1)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; out = []
    for p in polys:
        if p.area * k * k < 4: continue  # islas de menos de ~4 px2
        for ring in [p.exterior] + list(p.interiors):
            pts = ["%.1f %.1f" % ((x - minx) * k, (maxy - y) * k) for x, y in ring.coords]
            out.append("M" + "L".join(pts) + "Z")
    return "".join(out)
items = [{"id": c, "name": n, "d": path(g)} for c, (n, g) in sorted(geo.items())]
js = "/* Contornos de las provincias y territorios de Canada (proyeccion Albers equivalente) a partir de Natural Earth 1:50m (dominio publico). Generado por scripts/build-region-maps.py. */\nwindow.DEHESA_CA_PROVINCES = " + json.dumps({"viewBox": "0 0 %d %s" % (W, H), "states": items}, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "vendor" / "ca-provinces.js").write_text(js, encoding="utf-8"); print("vendor/ca-provinces.js", len(js), "bytes", len(items), "provincias, viewBox", "0 0 %d %s" % (W, H))

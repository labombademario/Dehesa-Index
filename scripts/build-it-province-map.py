#!/usr/bin/env python3
"""Genera vendor/it-provinces.js: contornos de las 107 provincias de Italia (NUTS 3 de Eurostat/GISCO 2021, (c) EuroGeographics, reutilizacion libre
citando la fuente), proyeccion plana con cos(lat), listos para SVG. Mismo formato que vendor/hr-regions.js: window.DEHESA_IT_PROVINCES = {viewBox, states:[{id, name, d}]}.
Uso: python3 scripts/build-it-province-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.ops import transform
ROOT = Path(__file__).resolve().parents[1]
W = 900.0; TOL = 0.004
fc = json.loads((ROOT / "scripts" / "ref" / "nuts3-it.json").read_text(encoding="utf-8"))["features"]
lat = sum((shape(f["geometry"]).bounds[1] + shape(f["geometry"]).bounds[3]) / 2 for f in fc) / len(fc); c = math.cos(math.radians(lat)); out = {}
for f in fc:
    g = transform(lambda x, y, z=None: ([v * c for v in x], list(y)) if hasattr(x, "__iter__") else (x * c, y), shape(f["geometry"]))
    out[f["properties"]["id"]] = (f["properties"]["name"], g.simplify(TOL * c, preserve_topology=True))
mnx = min(g.bounds[0] for _, g in out.values()); mxx = max(g.bounds[2] for _, g in out.values()); mny = min(g.bounds[1] for _, g in out.values()); mxy = max(g.bounds[3] for _, g in out.values())
k = W / (mxx - mnx); H = round((mxy - mny) * k, 1)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; o = []
    for p in polys:
        if p.area * k * k < 3: continue
        for ring in [p.exterior] + list(p.interiors): o.append("M" + "L".join("%.1f %.1f" % ((x - mnx) * k, (mxy - y) * k) for x, y in ring.coords) + "Z")
    if not o: big = max(polys, key=lambda q: q.area); o.append("M" + "L".join("%.1f %.1f" % ((x - mnx) * k, (mxy - y) * k) for x, y in big.exterior.coords) + "Z")
    return "".join(o)
items = [{"id": i, "name": n, "d": path(g)} for i, (n, g) in sorted(out.items())]
js = "/* Contornos de las 107 provincias de Italia a partir de Eurostat/GISCO NUTS 2021 (c) EuroGeographics, reutilizacion libre citando la fuente. Generado por scripts/build-it-province-map.py. */\nwindow.DEHESA_IT_PROVINCES = " + json.dumps({"viewBox": "0 0 %d %s" % (W, H), "states": items}, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "vendor" / "it-provinces.js").write_text(js, encoding="utf-8"); print("vendor/it-provinces.js", len(js), "bytes", len(items), "provincias, viewBox", "0 0 %d %s" % (W, H))

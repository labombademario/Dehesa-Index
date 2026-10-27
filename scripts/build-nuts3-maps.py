#!/usr/bin/env python3
"""Genera vendor/nuts3/<cc>.js: contornos de las unidades NUTS 3 (Eurostat/GISCO 2021, (c) EuroGeographics, reutilizacion libre citando la fuente) de
14 paises, proyeccion plana con cos(lat), listos para SVG. Mismo formato que vendor/hr-counties.js: window.DEHESA_NUTS3_<CC> = {viewBox, states:[{id, name, d}]}.
Uso: python3 scripts/build-nuts3-maps.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.ops import transform
ROOT = Path(__file__).resolve().parents[1]
W = 900.0
TOL = {"DE": 0.02, "FR": 0.012, "SE": 0.02, "FI": 0.02, "RO": 0.01, "BG": 0.008, "HU": 0.008, "CZ": 0.008, "DK": 0.006, "SI": 0.005, "LT": 0.008, "SK": 0.006, "LV": 0.008, "EE": 0.008}
def build(cc):
    fc = json.loads((ROOT / "scripts" / "ref" / ("nuts3-%s.json" % cc.lower())).read_text(encoding="utf-8"))["features"]
    lat = sum((shape(f["geometry"]).bounds[1] + shape(f["geometry"]).bounds[3]) / 2 for f in fc) / len(fc); c = math.cos(math.radians(lat)); out = {}
    for f in fc:
        g = transform(lambda x, y, z=None: ([v * c for v in x], list(y)) if hasattr(x, "__iter__") else (x * c, y), shape(f["geometry"]))
        out[f["properties"]["id"]] = (f["properties"]["name"], g.simplify(TOL[cc] * c, preserve_topology=True))
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
    js = ("/* Contornos de las %d unidades NUTS 3 de %s a partir de Eurostat/GISCO NUTS 2021 (c) EuroGeographics, reutilizacion libre citando la fuente. Generado por scripts/build-nuts3-maps.py. */\n" % (len(items), cc) +
          "window.DEHESA_NUTS3_%s = " % cc + json.dumps({"viewBox": "0 0 %d %s" % (W, H), "states": items}, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (ROOT / "vendor" / "nuts3").mkdir(exist_ok=True); (ROOT / "vendor" / "nuts3" / (cc.lower() + ".js")).write_text(js, encoding="utf-8")
    print("vendor/nuts3/%s.js" % cc.lower(), len(js), "bytes", len(items), "unidades, viewBox 0 0 %d %s" % (W, H))
for cc in TOL: build(cc)

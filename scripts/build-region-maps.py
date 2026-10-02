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

# ---------- Espana: comunidades autonomicas (Natural Earth 1:10m, provincias disueltas por la propiedad "region") ----------
import math
from shapely.ops import unary_union
from shapely.affinity import translate
ES_CODES = {"Andalucía": "AN", "Aragón": "AR", "Asturias": "AS", "Canary Is.": "CN", "Cantabria": "CB", "Castilla y León": "CL", "Castilla-La Mancha": "CM", "Cataluña": "CT", "Extremadura": "EX", "Foral de Navarra": "NC", "Galicia": "GA", "Islas Baleares": "IB", "La Rioja": "RI", "Madrid": "MD", "Murcia": "MC", "País Vasco": "PV", "Valenciana": "VC"}
adm = json.loads((ROOT / "scripts" / "ref" / "ne-admin1-4c.json").read_text(encoding="utf-8"))
byreg = {}
for f in adm["ESP"]:
    r = f["properties"]["region"]
    if r in ES_CODES: byreg.setdefault(r, []).append(shape(f["geometry"]))
assert len(byreg) == 17, sorted(byreg)
C40 = math.cos(math.radians(40.0))
es = {}
for r, gs in byreg.items():
    g = unary_union(gs)
    if r == "Canary Is.": g = translate(g, xoff=9.0, yoff=6.0)  # recuadro: Canarias bajo el suroeste peninsular
    g = transform(lambda x, y, z=None: ([v * C40 for v in x], list(y)) if hasattr(x, "__iter__") else (x * C40, y), g)
    es[ES_CODES[r]] = (r, g.simplify(0.012 * C40, preserve_topology=True))
W2 = 900.0
mnx = min(g.bounds[0] for _, g in es.values()); mxx = max(g.bounds[2] for _, g in es.values()); mny = min(g.bounds[1] for _, g in es.values()); mxy = max(g.bounds[3] for _, g in es.values())
k2 = W2 / (mxx - mnx); H2 = round((mxy - mny) * k2, 1)
def path2(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; out = []
    for p in polys:
        if p.area * k2 * k2 < 3: continue
        for ring in [p.exterior] + list(p.interiors):
            out.append("M" + "L".join("%.1f %.1f" % ((x - mnx) * k2, (mxy - y) * k2) for x, y in ring.coords) + "Z")
    return "".join(out)
items2 = [{"id": c, "name": n, "d": path2(g)} for c, (n, g) in sorted(es.items())]
js2 = "/* Contornos de las comunidades autonomas de Espana (Canarias en recuadro) a partir de Natural Earth 1:10m (dominio publico); provincias disueltas por comunidad. Generado por scripts/build-region-maps.py. */\nwindow.DEHESA_ES_CCAA = " + json.dumps({"viewBox": "0 0 %d %s" % (W2, H2), "states": items2}, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "vendor" / "es-ccaa.js").write_text(js2, encoding="utf-8"); print("vendor/es-ccaa.js", len(js2), "bytes", len(items2), "CCAA, viewBox", "0 0 %d %s" % (W2, H2))

#!/usr/bin/env python3
"""Mapa de las 19 zonas principales de pesca FAO (vendor/fao-areas.js) a partir de scripts/ref/fao-areas-lowres.json.
Ese fichero (10,7 MB) no se guarda en el repositorio: para regenerar el mapa, lanzar a mano el workflow «fetch-fao-areas» (lo vuelve a bajar de la FAO, CC BY 4.0), ejecutar este script y no subir el fichero.
Fuente: FAO. 2024. FAO Major Fishing Areas for Statistical Purposes (capa FAO_AREAS_ERASE_LOWRES), licencia CC BY 4.0.
Se descargo con .github/workflows/fetch-fao-areas.yml. Proyeccion plana (longitud, latitud), simplificada."""
import json
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
fc = json.loads((ROOT / "scripts" / "ref" / "fao-areas-lowres.json").read_text(encoding="utf-8"))
by = {}
for f in fc["features"]:
    p = f["properties"]
    if p["F_LEVEL"] == "MAJOR": by.setdefault(p["F_CODE"], []).append(shape(f["geometry"]))
assert len(by) == 19, sorted(by)
W = 1000.0; k = W / 360.0; LAT_N, LAT_S = 90.0, -78.0; H = round((LAT_N - LAT_S) * k, 1)
def ring(r): return "M" + "L".join("%.1f %.1f" % ((x + 180) * k, (LAT_N - max(LAT_S, y)) * k) for x, y in r.coords) + "Z"
areas = []
for code in sorted(by):
    g = unary_union([x.buffer(0) for x in by[code]]).simplify(0.4, preserve_topology=True)
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    d = "".join(ring(r) for p in polys if p.area * k * k >= 4 for r in [p.exterior] + list(p.interiors))
    areas.append({"id": code, "name": by[code][0] and "", "d": d})
names = {f["properties"]["F_CODE"]: f["properties"]["NAME_EN"] for f in fc["features"] if f["properties"]["F_LEVEL"] == "MAJOR"}
for a in areas: a["name"] = names[a["id"]]
js = "/* Zonas principales de pesca de la FAO (19). FAO. 2024. FAO Major Fishing Areas for Statistical Purposes, CC BY 4.0. Generado por scripts/build-fao-map.py. */\nwindow.DEHESA_FAO_AREAS = " + json.dumps({"viewBox": "0 0 %d %s" % (W, H), "areas": areas}, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "vendor" / "fao-areas.js").write_text(js, encoding="utf-8"); print("vendor/fao-areas.js", len(js), "bytes", len(areas), "zonas")

#!/usr/bin/env python3
"""Genera vendor/nl-natura2000.js: contornos de las zonas Natura 2000 de los Paises Bajos para el mapa de la pestaña «Naturaleza (RIVM)» de netherlands.html.
Fuente: PDOK / RVO «Natura2000» (servicio OGC API Features, https://api.pdok.nl/rvo/natura2000/ogc/v1), licencia CC0 1.0 (Creative Commons Zero, indicada en el AccessConstraints del servicio).
Cada zona es la union de sus poligonos (habitats y aves) y su id es el numero nacional de zona («nr»), el mismo que usa el RIVM (nl-n2k-<nr>).
Se dejan fuera las zonas de alta mar de la Zona Economica Exclusiva (Friese Front, Doggersbank, Klaverbank, Bruine Bank), que obligarian a reducir el mapa a la mitad.
Fondo: Paises Bajos de Natural Earth 1:50m (dominio publico), scripts/ref/ne-countries-eu.json. Proyeccion plana con cos(latitud). Uso: python3 scripts/build-nl-n2k-map.py [--check]"""
import json, math, sys, urllib.request
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
URL = "https://api.pdok.nl/rvo/natura2000/ogc/v1/collections/natura2000/items?f=json&limit=1000"
OFFSHORE = {164, 165, 166, 168}
W, TOL = 900.0, 0.0012
def fetch():
    feats, url = [], URL
    while url:
        r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}), timeout=180))
        feats += r["features"]; nx = [l["href"] for l in r.get("links", []) if l.get("rel") == "next"]; url = nx[0] if nx else None
    return feats
def main():
    feats = fetch(); assert len(feats) > 150, len(feats)
    by, names = {}, {}
    for f in feats:
        p = f["properties"]; n = int(p["nr"])
        if n in OFFSHORE: continue
        by.setdefault(n, []).append(shape(f["geometry"]).buffer(0)); names[n] = (p.get("naam_n2k") or "").strip()
    geo = {n: unary_union(g) for n, g in by.items()}
    ne = json.loads((ROOT / "scripts" / "ref" / "ne-countries-eu.json").read_text(encoding="utf-8"))
    nl = [shape(f["geometry"]) for f in ne["features"] if f["properties"].get("iso2") == "NL"]; assert nl
    base = unary_union(nl)
    allg = list(geo.values()) + [base]
    minx = min(g.bounds[0] for g in allg); maxx = max(g.bounds[2] for g in allg); miny = min(g.bounds[1] for g in allg); maxy = max(g.bounds[3] for g in allg)
    kx = math.cos(math.radians((miny + maxy) / 2)); k = W / ((maxx - minx) * kx); H = round((maxy - miny) * k, 1)
    def path(g, tol, keep_largest=False):
        g = g.simplify(tol, preserve_topology=True); polys = sorted(g.geoms, key=lambda p: -p.area) if isinstance(g, MultiPolygon) else [g]; out = []
        for i, p in enumerate(polys):
            if p.is_empty: continue
            if p.area * k * k * kx * kx < 0.6 and not (keep_largest and i == 0): continue
            for ring in [p.exterior] + [r for r in p.interiors if shape({"type": "Polygon", "coordinates": [list(r.coords)]}).area * k * k * kx * kx >= 1.5]:
                out.append("M" + "L".join("%.1f %.1f" % ((x - minx) * kx * k, (maxy - y) * k) for x, y in ring.coords) + "Z")
        return "".join(out)
    items = [{"id": str(n), "name": names[n], "d": path(g, TOL, True)} for n, g in sorted(geo.items())]
    doc = {"viewBox": "0 0 %d %s" % (W, H), "base": path(base, 0.004), "states": items}
    js = "/* Zonas Natura 2000 de los Paises Bajos (id = numero nacional de zona) a partir de PDOK/RVO «Natura2000» (CC0 1.0); fondo Natural Earth 1:50m (dominio publico). Sin las zonas de alta mar de la ZEE. Generado por scripts/build-nl-n2k-map.py. */\nwindow.DEHESA_NL_N2K = " + json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + ";\n"
    p = ROOT / "vendor" / "nl-natura2000.js"
    if "--check" in sys.argv:
        print("OK" if p.exists() and p.read_text(encoding="utf-8") == js else "desactualizado: python3 scripts/build-nl-n2k-map.py"); return
    p.write_text(js, encoding="utf-8"); print(p.name, len(js), "bytes", len(items), "zonas, viewBox", doc["viewBox"])
if __name__ == "__main__": main()

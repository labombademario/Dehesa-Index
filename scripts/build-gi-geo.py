#!/usr/bin/env python3
"""Genera data/gi/<PAIS>-geo.json (zonas de produccion de las DOP de vino) a partir del dataset EU-PDO.

Fuente: Candiago, S. et al. (2022) «A geospatial inventory of regulatory information for wine protected designations of origin in Europe»,
Scientific Data 9, 389; datos en figshare (coleccion 10.6084/m9.figshare.c.5877659.v1), licencia CC0. El poligono de cada DOP es la union de los municipios
(EuroRegionalMap, EuroGeographics) de su zona, segun el registro eAmbrosia a 4-nov-2021: es orientativo, no delimita parcelas, y no incluye IGP.
Uso: python3 scripts/build-gi-geo.py RUTA/EU_PDO.gpkg  (necesita sqlite3, shapely y pyproj)."""
import json, math, sqlite3, struct, sys, datetime
from pyproj import Transformer
from shapely import wkb
from shapely.geometry import MultiPolygon, Polygon
from shapely.geometry.polygon import orient
from shapely.ops import transform as shp_transform

CC = {'ES': 'ES', 'PT': 'PT', 'GB': 'UK', 'CZ': 'CZ'}    # codigo del dataset -> codigo del sitio
TOL = {'ES': 0.012, 'PT': 0.012, 'GB': 0.01, 'CZ': 0.006}  # simplificacion en grados
MAIN = {'ES': (-10, 35.5, 5, 44.5), 'PT': (-10, 36, -6, 42.5), 'GB': (-9, 49, 3, 61), 'CZ': (11, 48, 19.5, 51.5)}  # (lon0, lat0, lon1, lat1) del territorio peninsular/principal
SRC = {'name': 'Candiago et al. (2022), EU-PDO: A geospatial inventory of regulatory information for wine PDOs in Europe (Scientific Data; figshare)', 'url': 'https://doi.org/10.6084/m9.figshare.c.5877659.v1', 'license': 'CC0 1.0'}

def geom_from_gpkg(blob):
    flags = blob[3]; env = (flags >> 1) & 7; n = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env]
    return wkb.loads(bytes(blob[8 + n:]))

def main(path):
    con = sqlite3.connect(path)
    tr = Transformer.from_crs(3035, 4326, always_xy=True)
    rows = con.execute('select PDOid, Shape from EU_PDO').fetchall()
    for dc, sc in CC.items():
        items = {}
        for pid, blob in rows:
            if not pid.startswith('PDO-%s-' % dc): continue
            g = shp_transform(tr.transform, geom_from_gpkg(blob))
            items[pid] = g
        if not items: continue
        lon0, lat0, lon1, lat1 = MAIN[dc]
        # proyeccion plana (equirectangular) con la escala del paralelo central del pais
        lat_c = (lat0 + lat1) / 2; kx = math.cos(math.radians(lat_c))
        span = max((lon1 - lon0) * kx, lat1 - lat0); S = 900.0 / span
        X = lambda lon: (lon - lon0) * kx * S
        Y = lambda lat: (lat1 - lat) * S
        areas = {}; minx = miny = 1e9; maxx = maxy = -1e9
        for pid, g in sorted(items.items()):
            g = g.simplify(TOL[dc], preserve_topology=True)
            if g.is_empty: continue
            polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
            polys = [p for p in polys if isinstance(p, Polygon) and not p.is_empty]
            d = ''; bx0 = by0 = 1e9; bx1 = by1 = -1e9
            for p in polys:
                p = orient(p, 1.0)
                for ring in [p.exterior] + list(p.interiors):
                    pts = [(X(x), Y(y)) for x, y in ring.coords]
                    if len(pts) < 4: continue
                    d += 'M' + 'L'.join('%.1f %.1f' % pt for pt in pts[:-1]) + 'Z'
                    for x, y in pts: bx0 = min(bx0, x); bx1 = max(bx1, x); by0 = min(by0, y); by1 = max(by1, y)
            if not d: continue
            cx = (g.centroid.x); cy = (g.centroid.y)
            main = lon0 <= cx <= lon1 and lat0 <= cy <= lat1
            areas[pid] = {'b': [round(bx0, 1), round(by0, 1), round(bx1 - bx0, 1), round(by1 - by0, 1)], 'd': d}
            if not main: areas[pid]['i'] = 1       # fuera del territorio principal (islas): solo se dibuja al pedir su zona
        W = round((lon1 - lon0) * kx * S, 1); H = round((lat1 - lat0) * S, 1)
        out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'country': sc, 'source': SRC, 'viewBox': '0 0 %s %s' % (W, H), 'areas': areas}
        fn = 'data/gi/%s-geo.json' % sc
        json.dump(out, open(fn, 'w'), separators=(',', ':'))
        import os; print(sc, len(areas), 'zonas', os.path.getsize(fn) // 1024, 'KB', out['viewBox'])

if __name__ == '__main__':
    main(sys.argv[1])

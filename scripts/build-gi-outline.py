#!/usr/bin/env python3
"""Anade a data/gi/<PAIS>-geo.json el contorno del pais ('o') y el de los paises vecinos ('n') con la MISMA proyeccion que build-gi-geo.py.
Fuente: Natural Earth 1:10m admin_0 countries (dominio publico). Solo el territorio principal (recortado al recuadro de MAIN).
Uso: python3 scripts/build-gi-outline.py RUTA/ne_10m_admin_0_countries.geojson"""
import json, math, sys
from shapely.geometry import shape, box, MultiPolygon, Polygon
MAIN = {'ES': (-10, 35.5, 5, 44.5), 'PT': (-10, 36, -6, 42.5), 'UK': (-9, 49, 3, 61), 'CZ': (11, 48, 19.5, 51.5), 'AT': (9.4, 46.3, 17.2, 49.1), 'BE': (2.5, 49.4, 6.5, 51.6), 'BG': (22.3, 41.2, 28.7, 44.3), 'HR': (13.4, 42.3, 19.5, 46.6), 'DE': (5.8, 47.2, 15.1, 55.1), 'EL': (19.3, 34.7, 28.3, 41.8), 'HU': (16, 45.7, 23, 48.7), 'NL': (3.3, 50.7, 7.3, 53.6), 'RO': (20.2, 43.6, 29.8, 48.3), 'SK': (16.8, 47.7, 22.6, 49.7), 'SI': (13.3, 45.4, 16.7, 46.9)}
ISO = {'ES': 'ESP', 'PT': 'PRT', 'UK': 'GBR', 'CZ': 'CZE', 'AT': 'AUT', 'BE': 'BEL', 'BG': 'BGR', 'HR': 'HRV', 'DE': 'DEU', 'EL': 'GRC', 'HU': 'HUN', 'NL': 'NLD', 'RO': 'ROU', 'SK': 'SVK', 'SI': 'SVN'}
TOL = 0.01
def path(g, X, Y):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    d = ''
    for p in polys:
        if not isinstance(p, Polygon) or p.is_empty: continue
        for ring in [p.exterior] + list(p.interiors):
            pts = [(X(x), Y(y)) for x, y in ring.coords]
            if len(pts) < 4: continue
            d += 'M' + 'L'.join('%.1f %.1f' % pt for pt in pts[:-1]) + 'Z'
    return d
def main(src):
    feats = json.load(open(src))['features']
    by = {}
    for f in feats:
        p = f['properties']; iso = p.get('ADM0_A3') or p.get('ISO_A3')
        by[iso] = shape(f['geometry'])
    for cc, (lon0, lat0, lon1, lat1) in MAIN.items():
        lat_c = (lat0 + lat1) / 2; kx = math.cos(math.radians(lat_c))
        span = max((lon1 - lon0) * kx, lat1 - lat0); S = 900.0 / span
        X = lambda lon: (lon - lon0) * kx * S
        Y = lambda lat: (lat1 - lat) * S
        bb = box(lon0, lat0, lon1, lat1)
        me = by[ISO[cc]].simplify(TOL, preserve_topology=True).intersection(bb)
        others = [g for k, g in by.items() if k != ISO[cc] and g.intersects(bb)]
        ne = []
        for g in others:
            h = g.simplify(TOL, preserve_topology=True).intersection(bb)
            if not h.is_empty: ne.append(h)
        from shapely.ops import unary_union
        nb = unary_union(ne) if ne else None
        fn = 'data/gi/%s-geo.json' % cc
        d = json.load(open(fn))
        d['o'] = path(me, X, Y)
        d['n'] = path(nb, X, Y) if nb is not None and not nb.is_empty else ''
        d['outline'] = {'name': 'Natural Earth 1:10m admin_0 countries', 'url': 'https://www.naturalearthdata.com/', 'license': 'Public domain'}
        json.dump(d, open(fn, 'w'), separators=(',', ':'))
        print(cc, len(d['o']) // 1024, 'KB contorno', len(d['n']) // 1024, 'KB vecinos')
main(sys.argv[1])

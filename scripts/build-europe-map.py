#!/usr/bin/env python3
"""Fondo del mapa de sequia de Europa -> vendor/eu-countries-map.js: los paises de scripts/ref/ne-countries-eu.json (Natural Earth, dominio publico)
recortados a Europa (Turquia y Ucrania hasta 41 E; sin Rusia ni territorios de ultramar), proyeccion plana con cos(52 N). Ids ISO2 como en data/eu-drought.json.
Uso: python3 scripts/build-europe-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, box, MultiPolygon
ROOT = Path(__file__).resolve().parents[1]
C = math.cos(math.radians(52.0)); W = 760.0; CLIP = box(-25.0, 34.0, 41.0, 71.5)
fs = json.loads((ROOT / 'scripts' / 'ref' / 'ne-countries-eu.json').read_text(encoding='utf-8'))['features']
geo = {}
for f in fs:
    g = shape(f['geometry']).intersection(CLIP)
    if not g.is_empty: geo[f['properties']['iso2']] = (f['properties']['name'], g.simplify(0.03, preserve_topology=True))
minx = min(g.bounds[0] for _, g in geo.values()); maxx = max(g.bounds[2] for _, g in geo.values()); miny = min(g.bounds[1] for _, g in geo.values()); maxy = max(g.bounds[3] for _, g in geo.values())
k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def path(g):
    polys = list(g.geoms) if hasattr(g, 'geoms') else [g]; o = []
    for p in polys:
        if p.geom_type != 'Polygon' or p.area * C * k * k < 1.5: continue
        o.append('M' + 'L'.join('%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k) for x, y in p.exterior.coords) + 'Z')
    if not o:   # Malta, Luxemburgo: se conserva el poligono mayor para que se vea y se pueda señalar
        big = max([p for p in polys if p.geom_type == 'Polygon'], key=lambda q: q.area)
        o.append('M' + 'L'.join('%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k) for x, y in big.exterior.coords) + 'Z')
    return ''.join(o)
doc = {'viewBox': '0 0 %d %s' % (W, H), 'countries': [{'id': i, 'name': n, 'd': path(g)} for i, (n, g) in sorted(geo.items())]}
js = '/* Paises de Europa (Natural Earth, dominio publico) para el mapa de sequia. Generado por scripts/build-europe-map.py. */\nwindow.DEHESA_EU_COUNTRIES_MAP = ' + json.dumps(doc, separators=(',', ':'), ensure_ascii=False) + ';\n'
(ROOT / 'vendor' / 'eu-countries-map.js').write_text(js, encoding='utf-8'); print('vendor/eu-countries-map.js', len(js), 'bytes', len(doc['countries']), 'paises', doc['viewBox'])

#!/usr/bin/env python3
"""Contornos de los departamentos de Francia metropolitana y Corcega (Natural Earth 1:10m admin-1, dominio publico) -> vendor/fr-departements.js
Proyeccion plana con cos(46,5 N), lista para SVG: window.DEHESA_FR_DEPTS = {viewBox, states:[{id, name, d}]}; id = codigo del departamento
('01'...'95', '2A', '2B'), el mismo que usan VigiEau y Hub'Eau. Los departamentos de ultramar no se dibujan. Uso: python3 scripts/build-fr-dept-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
ROOT = Path(__file__).resolve().parents[1]
C = math.cos(math.radians(46.5)); W = 640.0
fs = [f for f in json.loads((ROOT / 'scripts' / 'ref' / 'ne-admin1-4c.json').read_text(encoding='utf-8'))['FRA'] if f['properties'].get('type_en') == 'Metropolitan department']
geo = {}
for f in fs:
    code = f['properties']['iso_3166_2'].split('-')[1]
    geo[code] = (f['properties']['name'], shape(f['geometry']).buffer(0).simplify(0.008, preserve_topology=True))
assert len(geo) == 96, len(geo)
minx = min(g.bounds[0] for _, g in geo.values()); maxx = max(g.bounds[2] for _, g in geo.values()); miny = min(g.bounds[1] for _, g in geo.values()); maxy = max(g.bounds[3] for _, g in geo.values())
k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def P(x, y): return '%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; o = []
    for p in polys:
        if p.area * C * k * k < 1.5 and len(polys) > 1: continue
        o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
    return ''.join(o)
doc = {'viewBox': '0 0 %d %s' % (W, H), 'states': [{'id': c, 'name': n, 'd': path(g)} for c, (n, g) in sorted(geo.items())]}
js = '/* Departamentos de Francia metropolitana y Corcega (Natural Earth 1:10m admin-1, dominio publico); proyeccion plana con cos(46,5 N). Generado por scripts/build-fr-dept-map.py. */\nwindow.DEHESA_FR_DEPTS = ' + json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'vendor' / 'fr-departements.js').write_text(js, encoding='utf-8'); print('vendor/fr-departements.js', len(js), 'bytes', len(doc['states']), 'departamentos', doc['viewBox'])

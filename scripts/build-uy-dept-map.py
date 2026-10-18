#!/usr/bin/env python3
"""Contornos de los 19 departamentos de Uruguay (Natural Earth 1:10m admin-1, dominio publico) -> vendor/uy-departments.js
Proyeccion plana con cos(lat media), lista para SVG: window.DEHESA_UY_DEPTS = {viewBox, states:[{id, name, d}]}; id = sufijo ISO 3166-2 del departamento ('AR', 'CA', ...).
IMPORTANTE: son contornos cartograficos generalizados de Natural Earth, NO los limites oficiales de la IDE (la URL oficial antigua devuelve HTML y el servidor de pruebas no es fuente de produccion).
El id del mapa es el sufijo ISO; los codigos numericos de DICOSE (1-19) son otra cosa y se relacionan por nombre en scripts/update-uruguay.py (UY_DEPTS). Uso: python3 scripts/build-uy-dept-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
ROOT = Path(__file__).resolve().parents[1]
fs = json.loads((ROOT / 'scripts' / 'ref' / 'ne-admin1-uy.json').read_text(encoding='utf-8'))['URY']
assert len(fs) == 19, len(fs)
geo = {f['properties']['iso_3166_2'].split('-')[1]: (f['properties']['name'], shape(f['geometry']).buffer(0).simplify(0.004, preserve_topology=True)) for f in fs}
minx = min(g.bounds[0] for _, g in geo.values()); maxx = max(g.bounds[2] for _, g in geo.values()); miny = min(g.bounds[1] for _, g in geo.values()); maxy = max(g.bounds[3] for _, g in geo.values())
C = math.cos(math.radians((miny + maxy) / 2)); W = 700.0
k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def P(x, y): return '%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; o = []
    for p in polys:
        if p.area * C * k * k < 1.5 and len(polys) > 1: continue
        o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
    return ''.join(o)
doc = {'viewBox': '0 0 %d %s' % (W, H), 'states': [{'id': c, 'name': n, 'd': path(g)} for c, (n, g) in sorted(geo.items())]}
js = '/* Departamentos de Uruguay (Natural Earth 1:10m admin-1, dominio publico; contornos generalizados, no los limites oficiales); proyeccion plana con cos(lat media). Generado por scripts/build-uy-dept-map.py. */\nwindow.DEHESA_UY_DEPTS = ' + json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'vendor' / 'uy-departments.js').write_text(js, encoding='utf-8'); print('vendor/uy-departments.js', len(js), 'bytes', len(doc['states']), 'departamentos', doc['viewBox'])

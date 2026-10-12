#!/usr/bin/env python3
"""Fondo del mapa de embalses -> vendor/es-reservoir-map.js: Espana peninsular y Baleares con el limite de las comunidades autonomas
(Natural Earth 1:10m admin-1, dominio publico), en proyeccion plana con cos(40 N), y los parametros para situar puntos (lat, lon) encima.
Canarias, Ceuta y Melilla no tienen embalses en el Boletin Hidrologico y no se dibujan. Uso: python3 scripts/build-es-reservoir-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
C = math.cos(math.radians(40.0)); W = 640.0
fs = [f for f in json.loads((ROOT / 'scripts' / 'ref' / 'ne-admin1-4c.json').read_text(encoding='utf-8'))['ESP'] if f['properties'].get('region') not in ('Canary Is.', 'Ceuta', 'Melilla')]
reg = {}
for f in fs: reg.setdefault(f['properties']['region'], []).append(shape(f['geometry']))
geo = {r: unary_union([g.buffer(0.004, join_style=2) for g in gs]).buffer(-0.004, join_style=2).simplify(0.01, preserve_topology=True) for r, gs in reg.items()}
allg = unary_union(list(geo.values()))
minx, miny, maxx, maxy = allg.bounds; k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def P(x, y): return '%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; o = []
    for p in polys:
        if p.area * C * k * k < 2: continue
        o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
    return ''.join(o)
doc = {'viewBox': '0 0 %d %s' % (W, H), 'proj': {'lon0': round(minx, 5), 'lat0': round(maxy, 5), 'c': round(C, 6), 'k': round(k, 5)},
       'regions': [{'name': r, 'd': path(g)} for r, g in sorted(geo.items())]}
js = '/* Espana peninsular y Baleares por comunidad autonoma (Natural Earth 1:10m, dominio publico) para el mapa de embalses. Generado por scripts/build-es-reservoir-map.py.\n   Punto (lat, lon) -> x = (lon - proj.lon0) * proj.c * proj.k ; y = (proj.lat0 - lat) * proj.k */\nwindow.DEHESA_ES_RESERVOIR_MAP = ' + json.dumps(doc, separators=(',', ':')) + ';\n'
(ROOT / 'vendor' / 'es-reservoir-map.js').write_text(js, encoding='utf-8'); print('vendor/es-reservoir-map.js', len(js), 'bytes', doc['viewBox'])

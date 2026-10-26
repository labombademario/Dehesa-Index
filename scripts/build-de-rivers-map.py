#!/usr/bin/env python3
"""Mapa de Alemania para el bloque de ríos (Länder + ríos principales) -> vendor/de-rivers-map.js
- Länder: Natural Earth 1:10m admin-1 (dominio publico), scripts/ref/ne-admin1-4c.json, simplificados.
- Rios: Natural Earth 1:10m rivers_lake_centerlines y rivers_europe (dominio publico), recortados a Alemania (scripts/ref/de-rivers.json).
Punto (lat, lon) -> x = (lon - proj.lon0) * proj.c * proj.k ; y = (proj.lat0 - lat) * proj.k  (el mismo esquema que vendor/es-reservoir-map.js).
Uso: python3 scripts/build-de-rivers-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, Polygon, MultiPolygon, LineString
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
W = 640.0
feats = json.loads((ROOT / 'scripts' / 'ref' / 'ne-admin1-4c.json').read_text(encoding='utf-8'))['DEU']
geo = {f['properties']['iso_3166_2']: (f['properties']['name'], shape(f['geometry']).buffer(0).simplify(0.01, preserve_topology=True)) for f in feats}
land = unary_union([g for _, g in geo.values()])
minx, miny, maxx, maxy = land.bounds; C = math.cos(math.radians((miny + maxy) / 2)); k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def P(x, y): return '%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k)
def ppath(g):
    o = []
    for p in (list(g.geoms) if hasattr(g, 'geoms') else [g]):
        if isinstance(p, Polygon) and p.area * C * k * k >= 3: o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
    return ''.join(o)
regions = [{'name': n, 'd': ppath(g)} for _, (n, g) in sorted(geo.items())]
rivers = []
for f in json.loads((ROOT / 'scripts' / 'ref' / 'de-rivers.json').read_text(encoding='utf-8'))['features']:
    d = ''.join('M' + 'L'.join(P(x, y) for x, y in LineString(l).simplify(0.004).coords) for l in f['geometry']['coordinates'] if len(l) > 1)
    if d: rivers.append({'name': f['properties']['name'], 'major': f['properties']['major'], 'd': d})
doc = {'viewBox': '0 0 %d %s' % (W, H), 'proj': {'lon0': round(minx, 5), 'lat0': round(maxy, 5), 'c': round(C, 6), 'k': round(k, 5)}, 'regions': regions, 'rivers': rivers}
js = ('/* Alemania por Land (Natural Earth 1:10m, dominio publico) y rios principales (Natural Earth 1:10m, dominio publico) para el mapa de niveles de los rios. Generado por scripts/build-de-rivers-map.py.\n'
      '   Punto (lat, lon) -> x = (lon - proj.lon0) * proj.c * proj.k ; y = (proj.lat0 - lat) * proj.k */\nwindow.DEHESA_DE_RIVER_MAP = ' + json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + ';\n')
(ROOT / 'vendor' / 'de-rivers-map.js').write_text(js, encoding='utf-8')
print('vendor/de-rivers-map.js', len(js), 'bytes', doc['viewBox'], len(regions), 'Lander', len(rivers), 'rios')

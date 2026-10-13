#!/usr/bin/env python3
"""Mapa de las demarcaciones hidrograficas y los rios principales de Espana -> vendor/es-basins.js
- Demarcaciones: capa WISE WFD 2022 (River Basin Districts) de la Agencia Europea de Medio Ambiente, con los limites que reporta el MITECO
  (scripts/ref/es-rbd.json). El MITECO publica la misma capa con licencia CC BY 4.0; el aviso legal de la AEMA permite reutilizarla citando la fuente.
  Se recortan con la costa (Natural Earth 1:10m, dominio publico) para quitar las aguas costeras. Se dibujan la peninsula y Baleares;
  Canarias, Ceuta y Melilla no caben a esta escala.
- Rios: Natural Earth 1:10m (rivers_lake_centerlines y rivers_europe, dominio publico), recortados al territorio espanol (scripts/ref/es-rivers.json).
Tambien escribe data/es-basins.json (lo lee la app movil). Uso: python3 scripts/build-es-basins-map.py"""
import json, math
from pathlib import Path
from shapely.geometry import shape, MultiPolygon, Polygon, LineString, MultiLineString
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
C = math.cos(math.radians(40.0)); W = 640.0
land = unary_union([shape(f['geometry']) for f in json.loads((ROOT / 'scripts' / 'ref' / 'ne-admin1-4c.json').read_text(encoding='utf-8'))['ESP']
                    if f['properties'].get('region') not in ('Canary Is.', 'Ceuta', 'Melilla')]).buffer(0.002)
rbd = json.loads((ROOT / 'scripts' / 'ref' / 'es-rbd.json').read_text(encoding='utf-8'))['features']
geo = {}
for f in rbd:
    g = shape(f['geometry']).buffer(0)
    if g.bounds[0] < -12 or g.bounds[1] < 35.8: continue          # Canarias, Ceuta, Melilla
    g = g.intersection(land).simplify(0.008, preserve_topology=True)
    if not g.is_empty: geo[f['properties']['code']] = (f['properties']['name'], g)
allg = unary_union([g for _, g in geo.values()])
minx, miny, maxx, maxy = allg.bounds; k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
def xy(x, y): return ((x - minx) * C * k, (maxy - y) * k)
def P(x, y): a, b = xy(x, y); return '%.1f %.1f' % (a, b)
def ppath(g):
    polys = list(g.geoms) if hasattr(g, 'geoms') else [g]; o = []
    for p in polys:
        if not isinstance(p, Polygon) or p.area * C * k * k < 3: continue
        o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
    return ''.join(o)
basins = []
for code, (name, g) in sorted(geo.items()):
    big = max(list(g.geoms) if hasattr(g, 'geoms') else [g], key=lambda p: p.area)
    lx, ly = xy(*big.representative_point().coords[0])
    basins.append({'id': code, 'name': name, 'd': ppath(g), 'lx': round(lx, 1), 'ly': round(ly, 1)})
rivers = []
for f in json.loads((ROOT / 'scripts' / 'ref' / 'es-rivers.json').read_text(encoding='utf-8'))['features']:
    g = MultiLineString(f['geometry']['coordinates']).intersection(land.buffer(0.02)).simplify(0.006)
    ls = list(g.geoms) if hasattr(g, 'geoms') else [g]
    d = ''.join('M' + 'L'.join(P(x, y) for x, y in l.coords) for l in ls if isinstance(l, LineString) and len(l.coords) > 1)
    if d: rivers.append({'name': f['properties']['name'], 'major': f['properties']['major'], 'd': d})
doc = {'viewBox': '0 0 %d %s' % (W, H), 'basins': basins, 'rivers': rivers}
js = ('/* Demarcaciones hidrograficas de Espana (AEMA, WISE WFD 2022, limites del MITECO; CC BY 4.0) y rios principales (Natural Earth 1:10m, dominio publico).\n'
      '   Peninsula y Baleares. Generado por scripts/build-es-basins-map.py. */\nwindow.DEHESA_ES_BASINS = ' + json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + ';\n')
(ROOT / 'vendor' / 'es-basins.js').write_text(js, encoding='utf-8')
(ROOT / 'data' / 'es-basins.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')   # la misma geometria para la app movil
print('vendor/es-basins.js', len(js), 'bytes', doc['viewBox'], len(basins), 'demarcaciones', len(rivers), 'tramos de rio')
print([(b['id'], b['name']) for b in basins])

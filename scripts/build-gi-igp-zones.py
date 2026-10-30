#!/usr/bin/env python3
"""Anade a data/gi/<PAIS>-geo.json las zonas de vinos IGP (y DOP que faltan en EU-PDO) a partir de scripts/ref/gi-igp-zones.json.

Cada entrada de ese fichero dice, para una denominacion (clave f de eAmbrosia), que unidades NUTS (GISCO 2021) cubre su zona segun el pliego de condiciones,
la fuente consultada y si la zona es solo parcial dentro de esas unidades. Aqui se une la geometria de esas unidades y se proyecta igual que build-gi-geo.py;
el area queda marcada con 'p':1 (zona a nivel de unidad NUTS, mas amplia que la real) y 'u' (unidades). No se asigna nada que no este en el fichero de entradas.
Uso: python3 scripts/build-gi-igp-zones.py   (orden: build-gi-geo.py, build-gi-igp-zones.py, build-gi-outline.py)
Tambien recoge las zonas de los quesos (mismo formato)."""
import json, math, importlib.util, sys
from pathlib import Path
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('g', ROOT / 'scripts' / 'build-gi-geo.py'); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
SITE2DS = {v: k for k, v in G.CC.items()}   # EL -> GR
def units(cc, level):
    if level == 'NUTS2':
        fc = json.load(open(ROOT / 'scripts/ref/nuts2-eu.geojson'))['features']
        return {f['properties']['id']: shape(f['geometry']) for f in fc}
    fc = json.load(open(ROOT / ('scripts/ref/nuts3-%s.json' % cc.lower())))['features']
    return {f['properties']['id']: shape(f['geometry']) for f in fc}
def main():
    inp = json.load(open(ROOT / 'scripts/ref/gi-igp-zones.json'))
    by = {}
    for k, e in inp.items():
        f = e.get('f', k)
        us = e.get('units') or e.get('nuts3')
        if not us: continue
        by.setdefault(e['cc'], []).append((f, e, us))
    for cc, items in by.items():
        ds = SITE2DS.get(cc, cc)
        if ds not in G.MAIN: print(cc, 'sin proyeccion en build-gi-geo (omitido)'); continue
        lon0, lat0, lon1, lat1 = G.MAIN[ds]; tol = G.TOL[ds]
        fn = ROOT / ('data/gi/%s-geo.json' % cc)
        lat_c = (lat0 + lat1) / 2; kx = math.cos(math.radians(lat_c)); S = 900.0 / max((lon1 - lon0) * kx, lat1 - lat0)
        if fn.exists(): d = json.load(open(fn))
        else:   # pais sin DOP de vino en EU-PDO: fichero nuevo con la misma proyeccion (luego build-gi-outline.py le pone el contorno)
            d = {'schemaVersion': 1, 'country': cc, 'viewBox': '0 0 %s %s' % (round((lon1 - lon0) * kx * S, 1), round((lat1 - lat0) * S, 1)), 'areas': {}}
        X = lambda lon: (lon - lon0) * kx * S
        Y = lambda lat: (lat1 - lat) * S
        cache = {}
        n = 0
        for f, e, us in items:
            lv = e.get('level', 'NUTS3')
            if lv not in cache: cache[lv] = units(cc, lv)
            geo = [cache[lv][u] for u in us if u in cache[lv]]
            if len(geo) != len(us): print('unidad desconocida en', f, us); continue
            g = unary_union(geo).simplify(tol, preserve_topology=True)
            polys = [p for p in (list(g.geoms) if isinstance(g, MultiPolygon) else [g]) if isinstance(p, Polygon) and not p.is_empty]
            dd = ''; bx0 = by0 = 1e9; bx1 = by1 = -1e9
            for p in polys:
                p = orient(p, 1.0)
                for ring in [p.exterior] + list(p.interiors):
                    pts = [(X(x), Y(y)) for x, y in ring.coords]
                    if len(pts) < 4: continue
                    dd += 'M' + 'L'.join('%.1f %.1f' % pt for pt in pts[:-1]) + 'Z'
                    for x, y in pts: bx0 = min(bx0, x); bx1 = max(bx1, x); by0 = min(by0, y); by1 = max(by1, y)
            if not dd: continue
            a = {'b': [round(bx0, 1), round(by0, 1), round(bx1 - bx0, 1), round(by1 - by0, 1)], 'd': dd, 'p': 1, 'u': us}
            if e.get('partial'): a['pt'] = 1
            cx, cy = g.centroid.x, g.centroid.y
            if not (lon0 <= cx <= lon1 and lat0 <= cy <= lat1): a['i'] = 1
            if f in d['areas'] and not d['areas'][f].get('p'): continue   # ya hay poligono municipal de EU-PDO: no se pisa
            d['areas'][f] = a; n += 1
        d['areasP'] = {'name': 'Zonas de IGP y otras DOP: unidades NUTS (Eurostat/GISCO 2021) que cubre la zona segun el pliego de condiciones de cada denominacion', 'url': 'https://ec.europa.eu/eurostat/web/gisco', 'license': 'Eurostat/GISCO, (c) EuroGeographics, reutilizacion libre citando la fuente'}
        json.dump(d, open(fn, 'w'), separators=(',', ':'))
        print(cc, n, 'zonas anadidas', fn.stat().st_size // 1024, 'KB')
if __name__ == '__main__': main()

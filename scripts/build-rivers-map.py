#!/usr/bin/env python3
"""Mapas para el bloque de ríos de Países Bajos, Francia, Canadá y Bélgica -> vendor/rivers-map-{nl,fr,ca,be,pl,se,fi}.js
- Regiones: Natural Earth 1:10m admin-1 (dominio publico), scripts/ref/ne-admin1-*.json y ne-provinces-ca.json, simplificadas y recortadas a la parte continental.
- Rios: Natural Earth 1:10m rivers_europe y rivers_north_america (dominio publico), descargados de github.com/nvkelso/natural-earth-vector (carpeta geojson) en --rivers-dir, recortados al pais.
Punto (lat, lon) -> x = (lon - proj.lon0) * proj.c * proj.k ; y = (proj.lat0 - lat) * proj.k  (el mismo esquema que vendor/de-rivers-map.js).
Uso: python3 scripts/build-rivers-map.py [--rivers-dir /ruta/con/ne_10m_rivers_*.geojson] [nl fr ca be pl se fi]"""
import json, math, sys
from pathlib import Path
from shapely.geometry import shape, box, Polygon, LineString
from shapely.ops import unary_union
ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'scripts' / 'ref'
W = 640.0
CFG = {
    'nl': {'src': ('ne-admin1-nlat.json', 'NLD'), 'bbox': (3.0, 50.6, 7.4, 53.7), 'rivers': 'europe', 'tol': 0.006, 'rtol': 0.004, 'maxrank': 99, 'detail': True},
    'be': {'src': ('ne-admin1-bedkpt.json', 'BEL'), 'bbox': (2.4, 49.4, 6.5, 51.6), 'rivers': 'europe', 'tol': 0.006, 'rtol': 0.004, 'maxrank': 99, 'detail': True},
    'pl': {'src': ('ne-admin1-pl.json', 'POL'), 'bbox': (13.9, 48.9, 24.3, 54.95), 'rivers': 'europe', 'tol': 0.012, 'rtol': 0.008, 'maxrank': 99, 'detail': True},
    'se': {'src': ('nuts3-se.json', None), 'bbox': (10.9, 55.2, 24.3, 69.2), 'rivers': 'europe', 'tol': 0.02, 'rtol': 0.012, 'maxrank': 6, 'detail': True},
    'fi': {'src': ('nuts3-fi.json', None), 'bbox': (19.0, 59.7, 31.7, 70.2), 'rivers': 'europe', 'tol': 0.02, 'rtol': 0.012, 'maxrank': 6, 'detail': True},
    'fr': {'src': ('ne-admin1-4c.json', 'FRA'), 'bbox': (-5.6, 41.2, 9.8, 51.3), 'rivers': 'europe', 'tol': 0.02, 'rtol': 0.01, 'maxrank': 8, 'detail': False},
    'ca': {'src': ('ne-provinces-ca.json', None), 'bbox': (-141.5, 41.5, -52.0, 62.5), 'rivers': 'north_america', 'tol': 0.05, 'rtol': 0.03, 'maxrank': 7, 'detail': False},
}


def features(cfg):
    name, key = cfg['src']; d = json.loads((REF / name).read_text(encoding='utf-8'))
    return d['features'] if key is None else d[key]


def main():
    args = sys.argv[1:]; rdir = Path('/tmp/ne')
    if '--rivers-dir' in args: i = args.index('--rivers-dir'); rdir = Path(args[i + 1]); del args[i:i + 2]
    sel = [a for a in args if a in CFG] or list(CFG)
    for cc in sel:
        cfg = CFG[cc]; clip = box(*cfg['bbox']); regions = []
        for f in features(cfg):
            g = shape(f['geometry']).buffer(0).intersection(clip)
            if g.is_empty: continue
            nm = f['properties'].get('name') or f['properties'].get('NAME') or ''
            regions.append((nm, g.simplify(cfg['tol'], preserve_topology=True)))
        land = unary_union([g for _, g in regions]); minx, miny, maxx, maxy = land.bounds
        C = math.cos(math.radians((miny + maxy) / 2)); k = W / ((maxx - minx) * C); H = round((maxy - miny) * k, 1)
        P = lambda x, y: '%.1f %.1f' % ((x - minx) * C * k, (maxy - y) * k)

        def ppath(g):
            o = []
            for p in (list(g.geoms) if hasattr(g, 'geoms') else [g]):
                if isinstance(p, Polygon) and p.area * C * k * k >= 3: o.append('M' + 'L'.join(P(x, y) for x, y in p.exterior.coords) + 'Z')
            return ''.join(o)
        regs = [{'name': n, 'd': ppath(g)} for n, g in sorted(regions, key=lambda r: r[0])]
        rivers = []
        feats = []
        for nm, mx in (('lake_centerlines', cfg['maxrank']), (cfg['rivers'], 99)):
            for f in json.loads((rdir / ('ne_10m_rivers_%s.geojson' % nm)).read_text(encoding='utf-8'))['features']:
                if nm == 'lake_centerlines' and (f['properties'].get('scalerank') if f['properties'].get('scalerank') is not None else 99) > mx: continue
                if nm != 'lake_centerlines' and not cfg.get('detail', True): continue
                feats.append((nm, f))
        for nm, f in feats:
            pr = f['properties']; rank = (pr.get('scalerank') if nm == 'lake_centerlines' else 9) if pr.get('scalerank') is not None else 99
            if not f.get('geometry'): continue
            g = shape(f['geometry']).intersection(land.buffer(0.05))
            if g.is_empty: continue
            lines = list(g.geoms) if hasattr(g, 'geoms') else [g]
            d = ''.join('M' + 'L'.join(P(x, y) for x, y in LineString(l.coords).simplify(cfg['rtol']).coords) for l in lines if l.geom_type == 'LineString' and len(l.coords) > 1)
            if d: rivers.append({'name': pr.get('name') or '', 'major': 1 if rank <= 5 else 0, 'd': d})
        doc = {'viewBox': '0 0 %d %s' % (W, H), 'proj': {'lon0': round(minx, 5), 'lat0': round(maxy, 5), 'c': round(C, 6), 'k': round(k, 5)}, 'regions': regs, 'rivers': rivers}
        js = ('/* Mapa de %s (Natural Earth 1:10m, dominio publico) con rios principales (Natural Earth 1:10m, dominio publico) para el bloque de niveles de los rios. Generado por scripts/build-rivers-map.py.\n'
              '   Punto (lat, lon) -> x = (lon - proj.lon0) * proj.c * proj.k ; y = (proj.lat0 - lat) * proj.k */\n(window.DEHESA_RIVER_MAPS = window.DEHESA_RIVER_MAPS || {})[%s] = %s;\n') % (cc.upper(), json.dumps(cc), json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
        out = ROOT / 'vendor' / ('rivers-map-%s.js' % cc); out.write_text(js, encoding='utf-8')
        print(out.name, len(js), 'bytes', doc['viewBox'], len(regs), 'regiones', len(rivers), 'rios')


if __name__ == '__main__':
    main()

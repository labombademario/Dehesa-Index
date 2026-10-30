#!/usr/bin/env python3
"""Zona de produccion y categoria de las denominaciones francesas (INAO, data.gouv.fr, Licence Ouverte 2.0).
- Delimitacion de las areas geograficas de los SIQO (shapefile, Lambert 93): se cruza por nombre con data/gi/FR.json (eAmbrosia), se simplifica
  y se proyecta con la misma proyeccion que vendor/fr-regions.js (scripts/ref/fr-map-proj.json) para dibujarla sobre las regiones.
- Referencial de productos SIQO (CSV): categoria del producto (pasta azul, cabra, vino espumoso...). No trae fecha de reconocimiento.
Salida: data/gi/FR-geo.json (poligonos, se carga solo al pedir la zona) y data/gi/FR-inao.json (categorias, pequeno).
Uso: python3 scripts/update-inao-geo.py [--shp zip_local] [--ref csv_local]"""
import csv, io, json, re, sys, unicodedata, urllib.request, zipfile, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DG = 'https://www.data.gouv.fr/api/1/datasets/%s/'
SLUG_GEO = 'delimitation-des-aires-geographiques-des-siqo'
SLUG_REF = 'referentiel-des-produits-sous-signe-officiel-didentification-de-la-qualite-et-de-lorigine-siqo'
LIC = 'Licence Ouverte / Open Licence 2.0 (Etalab)'
def norm(t):
    t = unicodedata.normalize('NFD', str(t).lower()); t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()
def fetch(u, t=600):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=t) as r: return r.read()
def resource(slug, key, fmt):
    d = json.loads(fetch(DG % slug))
    res = [r for r in d.get('resources', []) if key in (r.get('url') or '') and (r.get('format') or '').lower() == fmt]
    if not res: raise RuntimeError('INAO %s: sin recurso %s' % (slug, key))
    res.sort(key=lambda r: r.get('url') or '')  # el nombre empieza por la fecha
    return res[-1]['url'], d.get('page') or ('https://www.data.gouv.fr/datasets/' + slug)
def text(b):
    for enc in ('utf-8-sig', 'cp1252'):
        try: return b.decode(enc)
        except UnicodeDecodeError: pass
    return b.decode('latin-1')

def main(args):
    import shapefile
    from shapely.geometry import shape as shp_shape, MultiPolygon, Polygon
    from shapely.ops import unary_union, transform
    from shapely.validation import make_valid
    from pyproj import Transformer
    P = json.loads((ROOT / 'scripts' / 'ref' / 'fr-map-proj.json').read_text(encoding='utf-8'))
    gi = json.loads((ROOT / 'data' / 'gi' / 'FR.json').read_text(encoding='utf-8'))
    ents = [e for k in ('wine', 'cheese') for e in gi[k]]
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    # --- referencial de productos
    ref_url, ref_page = (None, None)
    if '--ref' in args: rb = open(args[args.index('--ref') + 1], 'rb').read()
    else: ref_url, ref_page = resource(SLUG_REF, 'ref-produit-siqo', 'csv'); rb = fetch(ref_url)
    ref = list(csv.DictReader(io.StringIO(text(rb))))
    cats_by_id = {}
    for r in ref:
        c = (r.get('categorie') or '').strip()
        if c: cats_by_id.setdefault(str(r['id_denomination_geo']), set()).add(c)
    print('referencial', len(ref), 'filas')
    # --- poligonos
    if '--shp' in args: zb = open(args[args.index('--shp') + 1], 'rb').read(); shp_url = None
    else: shp_url, shp_page = resource(SLUG_GEO, 'delim-aire-geographique-shp', 'zip'); zb = fetch(shp_url)
    z = zipfile.ZipFile(io.BytesIO(zb)); base = [n for n in z.namelist() if n.lower().endswith('.shp')][0][:-4]
    r = shapefile.Reader(shp=io.BytesIO(z.read(base + '.shp')), shx=io.BytesIO(z.read(base + '.shx')), dbf=io.BytesIO(z.read(base + '.dbf')), encoding='utf-8')
    fl = [f[0] for f in r.fields[1:]]; recs = [dict(zip(fl, x)) for x in r.records()]
    del zb, z
    byname = {}; idx_by_id = {}
    for i, x in enumerate(recs):
        did = str(x['id_denom']); idx_by_id.setdefault(did, []).append(i)
        byname.setdefault(norm(x['denom']), set()).add(did)
        if x['type_denom'] == 'appellation': byname.setdefault(norm(x['app']), set()).add(did)
    keys = sorted(byname)
    def find(names):
        out = set()
        for n in names:
            k = norm(n)
            if k in byname: out |= byname[k]; continue
            for a in keys:
                if a.startswith(k + ' ou ') or a.startswith(k + ' et '): out |= byname[a]
        return out
    tr = Transformer.from_crs(2154, 4326, always_xy=True)
    c, mnx, mxy, k = P['c'], P['mnx'], P['mxy'], P['k']
    def to_map(x, y, z=None):
        lon, lat = tr.transform(x, y)
        return ([(lo * c - mnx) * k for lo in lon], [(mxy - la) * k for la in lat]) if hasattr(lon, '__iter__') else ((lon * c - mnx) * k, (mxy - lat) * k)
    cats = {}; ecat = {}; areas = {}; miss = []
    for e in ents:
        ids = find(e['n'])
        if not ids: miss.append(e['n'][0]); continue
        cs = sorted({x for i in ids for x in cats_by_id.get(i, ())})
        if cs: ecat[e['f']] = [cats.setdefault(x, len(cats)) for x in cs]
        polys = []
        for i in ids:
            for j in idx_by_id.get(i, ()):
                g = shp_shape(r.shape(j).__geo_interface__)
                if not g.is_valid: g = make_valid(g)
                polys.append(g)
        g = unary_union(polys).buffer(0)
        if g.is_empty: miss.append(e['n'][0]); continue
        tol = min(600.0, max(120.0, (g.area ** 0.5) * 0.012))
        g = g.simplify(tol, preserve_topology=True)
        parts = [p for p in (list(g.geoms) if isinstance(g, MultiPolygon) else [g]) if isinstance(p, Polygon)]
        parts.sort(key=lambda p: -p.area)
        keep = [p for p in parts if p.area > 0.4e6] or parts[:1]  # fuera islotes de menos de 0,4 km2
        d = []; xs = []; ys = []
        for p in keep:
            p = transform(to_map, p)  # noqa
            bb = p.bounds
            if bb[0] < -30 or bb[2] > P['W'] + 30 or bb[1] < -30 or bb[3] > P['H'] + 30: continue  # ultramar: no cabe en el mapa
            for ring in [p.exterior] + [q for q in p.interiors if Polygon(q).area * k * k > 1.5]:
                d.append('M' + 'L'.join('%.1f %.1f' % xy for xy in ring.coords[:-1]) + 'Z')
            xs += [p.bounds[0], p.bounds[2]]; ys += [p.bounds[1], p.bounds[3]]
        if not d: miss.append(e['n'][0]); continue
        areas[e['f']] = {'b': [round(min(xs), 1), round(min(ys), 1), round(max(xs) - min(xs), 1), round(max(ys) - min(ys), 1)], 'd': ''.join(d)}
    print('con zona', len(areas), 'de', len(ents), '| sin zona', len(miss), miss[:30])
    src = {'name': 'INAO, delimitacion de las areas geograficas de los SIQO (data.gouv.fr)', 'url': 'https://www.data.gouv.fr/datasets/' + SLUG_GEO, 'license': LIC}
    # zonas de IGP/otras DOP dibujadas desde NUTS3 (build-gi-igp-zones.py, p=1): se conservan al regenerar
    prev = {}
    try: prev = json.loads((ROOT / 'data' / 'gi' / 'FR-geo.json').read_text(encoding='utf-8'))
    except Exception: pass
    for k, v in (prev.get('areas') or {}).items():
        if v.get('p') and k not in areas: areas[k] = v
    out_g = {'schemaVersion': 1, 'generatedAt': now, 'country': 'FR', 'source': src, 'viewBox': '0 0 %d %s' % (P['W'], P['H']), 'areas': dict(sorted(areas.items()))}
    if prev.get('areasP'): out_g['areasP'] = prev['areasP']
    refsrc = {'name': 'INAO, referencial de productos SIQO (data.gouv.fr)', 'url': 'https://www.data.gouv.fr/datasets/' + SLUG_REF, 'license': LIC}
    out_i = {'schemaVersion': 1, 'generatedAt': now, 'country': 'FR', 'source': refsrc, 'cats': [x for x, _ in sorted(cats.items(), key=lambda t: t[1])], 'e': dict(sorted(ecat.items())), 'z': sorted(areas)}
    (ROOT / 'data' / 'gi' / 'FR-geo.json').write_text(json.dumps(out_g, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (ROOT / 'data' / 'gi' / 'FR-inao.json').write_text(json.dumps(out_i, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('FR-geo.json', (ROOT / 'data' / 'gi' / 'FR-geo.json').stat().st_size, 'bytes; FR-inao.json', (ROOT / 'data' / 'gi' / 'FR-inao.json').stat().st_size)
    if len(areas) < 0.85 * len(ents): print('ERROR: muy pocas zonas', len(areas)); return 1
    return 0
if __name__ == '__main__': sys.exit(main(sys.argv[1:]))

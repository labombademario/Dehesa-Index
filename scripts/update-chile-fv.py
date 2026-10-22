#!/usr/bin/env python3
"""Chile: precios de fruta y hortaliza de ODEPA (portal de datos abiertos, licencia CC BY: license_id 'cc-by' en la API CKAN de cada conjunto).
Dos conjuntos: 'Precios mayoristas de frutas y hortalizas' (diario, por mercado mayorista; minimo, maximo y promedio por producto, variedad, calidad y unidad)
y 'Precios al Consumidor' (semanal, por region, sector y tipo de punto; solo los grupos Frutas y Hortalizas).
Salidas (pequenas, las lee la ficha de Chile): data/cl/wholesale-<codigo>.json + wholesale-index.json, data/cl/consumer-<region>.json + consumer-index.json.
Precios en pesos chilenos (CLP) tal como los publica ODEPA, en la unidad de comercializacion de cada fila. El CLP/kg solo se calcula si la unidad indica el peso.
Si la descarga falla o trae pocas filas no toca nada y sale en rojo."""
import csv, datetime, io, json, re, sys, time, unicodedata, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'cl'
API = 'https://datos.odepa.gob.cl/api/3/action/package_show?id='
PKG = {'wh': '33f10516-acbe-4446-b633-68244b9b6b26', 'co': 'd4646b7f-0d2e-4567-b6fa-932b1a6bb3f3'}
SRC = {'wh': {'name': 'ODEPA, Precios mayoristas de frutas y hortalizas', 'url': 'https://datos.odepa.gob.cl/dataset/precios-mayoristas-de-frutas-y-hortalizas', 'license': 'Creative Commons Attribution (CC BY)'},
       'co': {'name': 'ODEPA, Precios al consumidor', 'url': 'https://datos.odepa.gob.cl/dataset/precios-al-consumidor', 'license': 'Creative Commons Attribution (CC BY)'}}


def now(): return datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'})
            with urllib.request.urlopen(req, timeout=240) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    print('descarga fallida %s: %s' % (url, last)); return b''
def num(s):
    try: return float(str(s).replace(',', '.')) if s not in (None, '') else None
    except ValueError: return None
def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
def year_csv(pkg, year):
    d = json.loads(get(API + PKG[pkg]) or b'{}')
    for r in (d.get('result') or {}).get('resources', []):
        if re.search(r'_%d\.csv' % year, r.get('url') or ''): return r['url']
    return None
def rows_for(pkg, years):
    out = []
    for y in years:
        u = year_csv(pkg, y)
        if not u: continue
        b = get(u)
        if b: out += list(csv.DictReader(io.StringIO(b.decode('utf-8-sig', 'replace'))))
    return out
def kg_of(unit):
    """kilos por unidad de comercializacion, solo si el texto lo dice sin ambiguedad: '$/kilo...' = 1; '$/<envase> N kilos' = N."""
    u = unit.lower()
    if re.match(r'^\$/kilo\b', u): return 1.0
    m = re.match(r'^\$/(?:caja|bandeja|malla|saco|bolsa|cajon|cajón|saco)\s+(?:de\s+)?(\d+(?:,\d+)?)\s*kilos?\b', u)
    return float(m.group(1).replace(',', '.')) if m else None
def write(path, doc):
    if path.exists():
        try:
            o = json.loads(path.read_text(encoding='utf-8')); a = dict(o); b = dict(doc); a.pop('generatedAt', None); b.pop('generatedAt', None)
            if a == b: return
        except Exception: pass
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
COLS = ['cat', 'product', 'variety', 'origin', 'package', 'grade', 'low', 'high', 'prevLow', 'prevHigh', 'date', 'kg']


def wholesale(years):
    R = rows_for('wh', years)
    if len(R) < 5000: raise SystemExit('mayorista: pocas filas (%d), no se toca nada' % len(R))
    lines = {}; meta = {}
    for r in R:
        mk = (r.get('Mercado') or '').strip(); pr = (r.get('Producto') or '').strip()
        lo, hi = num(r.get('Precio minimo')), num(r.get('Precio maximo'))
        if not mk or not pr or (lo is None and hi is None): continue
        k = (mk, pr, (r.get('Variedad / Tipo') or '').strip(), (r.get('Calidad') or '').strip(), (r.get('Unidad de comercializacion') or '').strip(), (r.get('Origen') or '').strip())
        lines.setdefault(k, []).append((r['Fecha'], lo, hi)); meta[mk] = (r.get('Region') or '').strip()
        if k not in meta: meta[k] = 'fruit' if (r.get('Subsector') or '').startswith('Fruta') else 'veg'
    idx = []
    for mk in sorted({k[0] for k in lines}):
        mine = {k: sorted(set(v)) for k, v in lines.items() if k[0] == mk}
        latest = max(p[-1][0] for p in mine.values()); cut = (datetime.date.fromisoformat(latest) - datetime.timedelta(days=7)).isoformat()
        best = {}
        for k, pts in mine.items():
            if pts[-1][0] < cut: continue
            kk = (k[1], k[2]); sc = (pts[-1][0], len(pts))
            if kk not in best or sc > best[kk][0]: best[kk] = (sc, k, pts)
        out = []
        for (pr, var), (sc, k, pts) in sorted(best.items()):
            d, lo, hi = pts[-1]; pv = pts[-2] if len(pts) > 1 else None
            out.append([meta[k], pr, var if var.lower() not in ('sin especificar', '') else '', k[5], k[4], k[3] if k[3].lower() != 'sin especificar' else '', lo, hi, pv[1] if pv else None, pv[2] if pv else None, d, kg_of(k[4])])
        code = slug(mk)
        write(OUT / ('wholesale-%s.json' % code), {'schemaVersion': 1, 'generatedAt': now(), 'code': code, 'city': mk, 'region': meta[mk], 'date': latest, 'ccy': 'CLP', 'cols': COLS, 'source': SRC['wh'], 'rows': out})
        idx.append({'code': code, 'city': mk, 'region': meta[mk], 'date': latest, 'n': len(out)})
    if len(idx) < 6: raise SystemExit('mayorista: pocos mercados (%d)' % len(idx))
    write(OUT / 'wholesale-index.json', {'schemaVersion': 1, 'generatedAt': now(), 'cities': idx, 'source': SRC['wh']})
    print('mayorista', [(c['city'], c['date'], c['n']) for c in idx])


def consumer(years):
    R = [r for r in rows_for('co', years) if (r.get('Grupo') or '') in ('Frutas', 'Hortalizas')]
    if len(R) < 3000: raise SystemExit('consumidor: pocas filas (%d), no se toca nada' % len(R))
    wk = {}   # (region, producto, unidad) -> {fin de semana: [(min, max, tipo)]}
    names = {}
    for r in R:
        lo, hi = num(r.get('Precio minimo')), num(r.get('Precio maximo'))
        if lo is None and hi is None: continue
        rg = (r.get('ID region') or '').strip(); names[rg] = (r.get('Region') or '').strip()
        k = (rg, (r.get('Producto') or '').strip(), (r.get('Unidad') or '').strip(), 'fruit' if r['Grupo'] == 'Frutas' else 'veg')
        wk.setdefault(k, {}).setdefault(r['Fecha termino'], []).append((lo, hi, (r.get('Tipo de punto monitoreo') or '').strip()))
    idx = []
    for rg in sorted(names, key=lambda x: int(x) if x.isdigit() else 99):
        mine = {k: v for k, v in wk.items() if k[0] == rg}
        latest = max(max(v) for v in mine.values()); cut = (datetime.date.fromisoformat(latest) - datetime.timedelta(days=14)).isoformat()
        best = {}
        for k, v in mine.items():
            ds = sorted(v)
            if ds[-1] < cut: continue
            kk = k[1]; sc = (ds[-1], len(v[ds[-1]]))
            if kk not in best or sc > best[kk][0]: best[kk] = (sc, k, v, ds)
        out = []
        for pr, (sc, k, v, ds) in sorted(best.items()):
            def agg(d):
                x = v[d]; los = [a for a, b, c in x if a is not None]; his = [b for a, b, c in x if b is not None]
                return (min(los) if los else None, max(his) if his else None)
            lo, hi = agg(ds[-1]); pv = agg(ds[-2]) if len(ds) > 1 else (None, None)
            kinds = ', '.join(sorted({c for a, b, c in v[ds[-1]] if c}))
            out.append([k[3], pr, '', kinds, k[2], '', lo, hi, pv[0], pv[1], ds[-1], 1.0 if re.match(r'^\$/kilo$', k[2].lower()) else None])
        write(OUT / ('consumer-%s.json' % rg), {'schemaVersion': 1, 'generatedAt': now(), 'code': rg, 'city': names[rg], 'date': latest, 'ccy': 'CLP', 'cols': COLS, 'source': SRC['co'], 'rows': out})
        idx.append({'code': rg, 'city': names[rg], 'date': latest, 'n': len(out)})
    if len(idx) < 6: raise SystemExit('consumidor: pocas regiones (%d)' % len(idx))
    write(OUT / 'consumer-index.json', {'schemaVersion': 1, 'generatedAt': now(), 'cities': idx, 'source': SRC['co']})
    print('consumidor', [(c['city'], c['date'], c['n']) for c in idx])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    y = datetime.date.today().year; years = [y] if datetime.date.today().timetuple().tm_yday > 14 else [y - 1, y]
    wholesale(years); consumer(years)


if __name__ == '__main__': main()

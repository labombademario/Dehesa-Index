#!/usr/bin/env python3
"""data/prices/** — el motor de precios en trozos pequenos para el navegador (Precios, Mapa, Producto, Home). Sustituye la descarga de
latest.json (3,7 MB, con todo el historico de cada serie) y history.json (10 MB):
  prices/manifest.json                      regiones -> ficheros, recuentos, productos
  prices/latest/<region>.json               ultimo dato de cada producto de la region, SIN el historico completo (con `spark`: ultimos 104 valores para el minigrafico, `recent`: ultimos 30 puntos con fecha y `n`)
  prices/history/<region>/<producto>.json   historico completo con fechas de UN producto (solo se baja al abrir su grafico)
  prices/intelligence/<region>.json         indices (*_index) mensuales/trimestrales verificados y comparables de la region [fecha, valor] para el Relationship Engine (solo se baja la region activa)
Estricto: lee latest.json e history.json ya validados; si algo no cuadra, falla. Solo reescribe lo que cambia."""
import datetime, json, math, shutil, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'; P = D / 'prices'
SPARK = 104
RECENT = 30   # ultimos N puntos con fecha: bastan para variaciones a 1 y 3 meses y para el mapa de mercado; el historico completo se baja solo bajo demanda
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
def num(x): return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)
written = set(); changed = 0
def write(rel, doc, volatile=('generatedAt',)):
    """Reescribe solo si cambia algo distinto de la hora de generacion."""
    global changed
    p = P / rel; written.add(p.resolve()); p.parent.mkdir(parents=True, exist_ok=True)
    try:
        old = json.loads(p.read_text())
        if {k: v for k, v in old.items() if k not in volatile} == {k: v for k, v in doc.items() if k not in volatile}: return
    except Exception: pass
    p.write_text(dump(doc)); changed += 1
def main():
    global changed
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    latest = json.loads((D / 'latest.json').read_text())
    hist = json.loads((D / 'history.json').read_text())
    regions = {}
    for o in latest['observations']: regions.setdefault(o['region'], []).append(o)
    man = {'schemaVersion': 1, 'generatedAt': now, 'sourceGeneratedAt': latest.get('generatedAt'), 'layout': 'manifest -> latest/<region> -> history/<region>/<product> (lazy) ; intelligence/<region> (lazy)', 'regions': {}}
    for rg in sorted(regions):
        obs = sorted(regions[rg], key=lambda o: o['product']); rows = []; prods = []
        for o in obs:
            h = o.get('history') or []
            vals = [x['value'] for x in h if num(x.get('value'))]
            r = {k: v for k, v in o.items() if k != 'history'}
            r['n'] = len(h); r['spark'] = vals[-SPARK:] if len(vals) >= 2 else None; r['recent'] = h[-RECENT:]
            rows.append(r); prods.append(o['product'])
            write('history/%s/%s.json' % (rg, o['product']), {'schemaVersion': 1, 'region': rg, 'product': o['product'], 'id': o['id'], 'frequency': o.get('frequency'), 'unit': o.get('unit'), 'currency': o.get('currency'), 'history': h})
        write('latest/%s.json' % rg, {'schemaVersion': 1, 'generatedAt': now, 'region': rg, 'observations': rows})
        # series para el Relationship Engine
        ser = {}
        for o in hist['observations']:
            if o['region'] != rg or o.get('frequency') not in ('monthly', 'quarterly'): continue
            if o.get('status') and o['status'] != 'verified': continue
            if o.get('comparability') == 'not_comparable': continue
            if not o['product'].endswith('_index'): continue  # el Relationship Engine solo usa los indices (js/precios-intel.js); un test de coherencia lo comprueba
            ser.setdefault(o['product'], []).append(o)
        out = {}
        for pid, rs in sorted(ser.items()):
            rs.sort(key=lambda x: str(x['observationDate'])); last = rs[-1]
            out[pid] = {'frequency': last['frequency'], 'unit': last.get('unit', ''), 'currency': last.get('currency', ''), 'comparability': last.get('comparability', ''), 'sourceId': last.get('sourceId', ''), 'points': [[str(x['observationDate']), x['value']] for x in rs]}
        write('intelligence/%s.json' % rg, {'schemaVersion': 1, 'generatedAt': now, 'region': rg, 'series': out})
        man['regions'][rg] = {'latest': 'prices/latest/%s.json' % rg, 'intelligence': 'prices/intelligence/%s.json' % rg, 'historyDir': 'prices/history/%s/' % rg, 'products': prods, 'observations': len(rows), 'intelligenceSeries': len(out)}
    man['totals'] = {'observations': sum(v['observations'] for v in man['regions'].values()), 'regions': len(man['regions'])}
    write('manifest.json', man)
    for f in P.rglob('*.json'):  # limpieza de productos que han desaparecido
        if f.resolve() not in written: f.unlink(); changed += 1
    for d in sorted(P.rglob('*'), reverse=True):
        if d.is_dir() and not any(d.iterdir()): d.rmdir()
    size = sum(f.stat().st_size for f in P.rglob('*.json'))
    print('prices: %d regiones, %d observaciones, %d ficheros escritos/cambiados, %d KB en total' % (man['totals']['regions'], man['totals']['observations'], changed, size // 1024))
main()

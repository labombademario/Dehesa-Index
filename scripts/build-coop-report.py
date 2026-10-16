#!/usr/bin/env python3
"""Informe de mercado para cooperativas (muestra) -> data/views/coop-report.json

Por mercado (EE. UU., UE, Reino Unido, Canada) y SOLO con datos ya publicados en data/prices:
  - variacion a ~1 mes de cada precio, calculada sobre su historico (ultimo dato frente al de hace ~30 dias; semanal o mensual segun la fuente);
  - lo que mas sube y mas baja (solo precios al dia segun data/freshness.json);
  - presion de insumos: variacion a 1 mes del precio de venta frente a una cesta de insumos (harina de soja 50 %, diesel 25 %, urea 25 %,
    reponderada sobre los componentes con dato en ese mercado). Es una comparacion de variaciones, no el margen de ninguna explotacion;
  - cuando se espera el siguiente dato de cada precio (data/freshness.json) y las proximas publicaciones del USDA (data/usda-calendar.json).
Nada se estima: si falta un dato, el hueco se deja vacio. Uso: python3 scripts/build-coop-report.py"""
import datetime, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/views/coop-report.json'
REGIONS = ['eu', 'us', 'uk', 'ca']
MONTHS = {m: i + 1 for i, m in enumerate(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'])}
LIVESTOCK = ['leche', 'vaca', 'novillo_ab', 'cerdo', 'cerdo_ab', 'pollo', 'huevos', 'cordero']
BASKET = [('harina_soja', 50), ('diesel', 25), ('urea', 25)]
OK_STATES = ('LIVE', 'FRESH', 'EXPECTED_DELAY')

def J(p): return json.loads((ROOT / p).read_text(encoding='utf-8'))

def to_date(year, period):
    p = str(period).strip()
    try:
        if p.upper()[:3] in MONTHS and not p[:1].isdigit(): return datetime.date(year, MONTHS[p.upper()[:3]], 15)
        if '-' in p:
            a, b = p.split('-', 1); return datetime.date(year, int(a), int(b))
        if p.isdigit() and 1 <= int(p) <= 12: return datetime.date(year, int(p), 15)
    except ValueError:
        return None
    return None  # trimestral u otro: no se usa para la variacion a 1 mes

def change_1m(hist):
    pts = [(to_date(e['year'], e['period']), e['value']) for e in hist if e.get('value') is not None]
    pts = sorted((d, v) for d, v in pts if d)
    if len(pts) < 2: return None, None
    last_d, last_v = pts[-1]
    target = last_d - datetime.timedelta(days=30)
    prev = [(d, v) for d, v in pts if d <= target + datetime.timedelta(days=4)]
    if not prev: return None, None
    pd, pv = prev[-1]
    if (target - pd).days > 20 or not pv: return None, None   # el dato anterior queda demasiado lejos: no se fuerza
    return round((last_v / pv - 1) * 100, 2), pd.isoformat()

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from price_names import index_name

def main():
    names = {(x['product'], x['region']): x for x in J('data/app/v1/prices.json')['prices']}
    fresh = {(x['product'], x['region']): x for x in J('data/freshness.json')['latest']['observations']}
    cite = J('data/views/license-cite.json')['sources']
    asof, out = '', {}
    for region in REGIONS:
        d = J('data/prices/latest/%s.json' % region)
        items = []
        for o in (d.get('observations') if isinstance(d, dict) else d):
            prod = o['product']; n = names.get((prod, region), {}); f = fresh.get((prod, region), {})
            hp = ROOT / ('data/prices/history/%s/%s.json' % (region, prod))
            ch, since = change_1m(J('data/prices/history/%s/%s.json' % (region, prod))['history']) if hp.exists() else (None, None)
            asof = max(asof, str(o.get('snapshotDate') or ''))
            items.append({'product': prod, 'name': n.get('name') or index_name(prod) or {'es': prod}, 'index': bool(index_name(prod)), 'place': n.get('place') or {}, 'unit': n.get('unit') or {'es': o.get('unit')},
                          'currency': o.get('currency'), 'value': o.get('value'), 'date': o.get('observationDate'), 'frequency': o.get('frequency'),
                          'change1m': ch, 'since': since, 'state': f.get('state'), 'expectedNext': f.get('expectedNext'),
                          'source': (cite.get(o.get('sourceId')) or {}).get('short') or o.get('sourceId')})
        by = {x['product']: x for x in items}
        movers = [x for x in items if x['change1m'] is not None and x['state'] in OK_STATES]
        up = [x['product'] for x in sorted(movers, key=lambda x: -x['change1m']) if x['change1m'] > 0][:5]
        down = [x['product'] for x in sorted(movers, key=lambda x: x['change1m']) if x['change1m'] < 0][:5]
        comp = [(k, w) for k, w in BASKET if k in by and by[k]['change1m'] is not None]
        margin = None
        if comp:
            tw = sum(w for _, w in comp)
            cost = round(sum(by[k]['change1m'] * w / tw for k, w in comp), 2)
            rows = [{'product': p, 'sale': by[p]['change1m'], 'delta': round(by[p]['change1m'] - cost, 2)} for p in LIVESTOCK if p in by and by[p]['change1m'] is not None]
            if rows: margin = {'cost': cost, 'basket': [{'product': k, 'weight': round(w * 100.0 / tw), 'change': by[k]['change1m']} for k, w in comp], 'rows': rows}
        nxt = sorted([x for x in items if x['expectedNext']], key=lambda x: x['expectedNext'])
        late = [x['product'] for x in items if x['state'] in ('DELAYED', 'STALE')]
        out[region] = {'items': items, 'up': up, 'down': down, 'margin': margin, 'next': [x['product'] for x in nxt], 'late': late}
    cal = J('data/usda-calendar.json')['releases']
    ref = datetime.date.fromisoformat(asof[:10]) if asof else datetime.date.today()
    usda = [r for r in cal if ref.isoformat() <= r['date'] <= (ref + datetime.timedelta(days=21)).isoformat()]
    doc = {'schemaVersion': 1, 'generatedAt': asof, 'basketWeights': {k: w for k, w in BASKET}, 'regions': out, 'usda': sorted(usda, key=lambda r: (r['date'], r.get('time') or ''))[:12]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('Informe cooperativas: ' + ', '.join('%s %d precios (sube %d, baja %d, margen %s)' % (r, len(v['items']), len(v['up']), len(v['down']), 'si' if v['margin'] else 'no') for r, v in out.items()) + '; USDA %d' % len(doc['usda']))

main()

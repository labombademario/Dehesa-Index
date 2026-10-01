#!/usr/bin/env python3
"""data/product-compare.json — series comparables por producto y pais (para comparador.html y su Unit Engine).
Fuentes: catalogo Agri-food UE (data/eu/*) para paises de la UE y Reino Unido; data/latest.json (historia NASS EE. UU., StatCan Canada).
Cada serie guarda unidad y moneda ORIGINALES, los kg que representa una unidad de precio y puntos mensuales (media del mes). La conversion de moneda
(tipo de cambio mensual del BCE, data/fx-history.json) y de unidad se hace en el navegador, siempre mostrando el valor original."""
import datetime, json, sys
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
sys.path.insert(0, str(ROOT / 'scripts'))
import freshness as FR
NOW = FR.today_ord()
FROM = '2008-01'
META = json.loads((D / 'product-metadata.json').read_text())  # productos y series UE configuradas: data/product-metadata.json (no en el codigo)
BU = META['bushelKg']
PRODUCTS = {pid: dict(eu=tuple(m['compare']['eu']), per=m['compare']['per'], label=m['compare']['label']) for pid, m in META['products'].items() if m.get('compare')}
KG = {'tonelada': 1000.0, '100kg': 100.0, 'cwt': 45.3592}
MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
EPOCH = datetime.date(2000, 1, 1)
def monthly(pairs):
    acc = defaultdict(list)
    for ym, v in pairs:
        if ym >= FROM and v is not None: acc[ym].append(v)
    return [[k, round(sum(v) / len(v), 3)] for k, v in sorted(acc.items())]
def main():
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'products': {}}
    latest = json.loads((D / 'latest.json').read_text())['observations']
    for pid, cfg in PRODUCTS.items():
        series = []
        fam, sid = cfg['eu']
        f = json.loads((D / 'eu' / fam / (sid + '.json')).read_text())  # estricto: la serie UE configurada debe existir
        if f:
            for r in f['regions']:
                c = r['c']
                if c == 'EU+UK' or not r.get('d'): continue
                raw = [((EPOCH + datetime.timedelta(days=d)).isoformat(), v) for d, v in zip(r['d'], r['v'])]
                pts = monthly([(x[:7], v) for x, v in raw])
                if len(pts) < 6: continue
                u = f['unit']; kg = 1000.0 if u == '€/t' else 100.0
                n_last = sum(1 for x, _ in raw if x[:7] == pts[-1][0])
                series.append({'c': c, 'cur': 'EUR', 'unit': u, 'kg': kg, 'freq': f['freq'], 'src': 'EU Agri-food Data Portal', 'sourceId': 'eu_agrifood', 'latest': [raw[-1][0], raw[-1][1]], 'points': pts, 'comp': 'directional',
                               'aggregation': {'points': 'monthly_mean', 'of': f['freq'], 'lastMonthObs': n_last, 'latest': 'last_quote'}, 'fs': FR.evaluate(raw[-1][0], f['freq'], 'eu_agrifood', NOW)['state']})
        for o in latest:
            if o['product'] != pid or o['region'] not in ('us', 'ca', 'uk') or o.get('status') != 'verified': continue
            if o['region'] == 'uk' and any(s['c'] == 'UK' for s in series): continue
            un = o['unit']; kg = BU.get(pid) if un == 'bushel' else KG.get(un)
            if not kg: continue
            raw = []
            for h in o.get('history', []):
                p = str(h['period']); m = MON.get(p.upper()) if not p.isdigit() else int(p)
                if m: raw.append(('%04d-%02d' % (h['year'], m), h['value']))
            pts = monthly(raw)
            if len(pts) < 6: continue
            same = o['frequency'] == 'monthly'
            series.append({'c': o['region'].upper(), 'iid': o['id'], 'cur': o['currency'], 'unit': '%s/%s' % (o['currency'], un), 'kg': kg, 'freq': o['frequency'], 'src': {'us': 'USDA NASS', 'ca': 'Statistics Canada', 'uk': 'Defra'}[o['region']], 'sourceId': o['sourceId'],
                           'latest': [o['observationDate'], o['value']], 'points': pts, 'comp': o.get('comparability', 'directional'),
                           'aggregation': {'points': 'monthly_value' if same else 'monthly_mean', 'of': o['frequency'], 'lastMonthObs': 1 if same else None, 'latest': 'last_quote'},
                           'fs': FR.evaluate(o['observationDate'], o['frequency'], o['sourceId'], NOW)['state']})
        doc['products'][pid] = {'label': cfg['label'], 'per': cfg['per'], 'series': sorted(series, key=lambda s: s['c'])}
    path = D / 'product-compare.json'
    new = json.dumps(doc['products'], ensure_ascii=False, separators=(',', ':'))
    try:
        if json.dumps(json.loads(path.read_text())['products'], ensure_ascii=False, separators=(',', ':')) == new: print('sin cambios'); return
    except Exception: pass
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    print({k: len(v['series']) for k, v in doc['products'].items()}, path.stat().st_size)
main()

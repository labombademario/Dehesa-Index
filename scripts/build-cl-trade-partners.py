#!/usr/bin/env python3
"""data/cl-trade-partners-stats.json: series de comercio de Chile por socio (para el bloque «Comercio agroalimentario» del perfil de pais),
derivadas de data/cl-trade-products.json (ODEPA, Aduanas de Chile, CC BY). No descarga nada.
Honestidad: ODEPA aqui trae 16 grupos de producto y los socios principales de cada uno; la cifra es la suma de los PRODUCTOS SELECCIONADOS
(sin fertilizantes) y NO es el total agroalimentario de Chile. Anual, USD millones. Uso: python3 scripts/build-cl-trade-partners.py"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
EXCL = {'31'}
TOP = 8
def main():
    d = json.loads((ROOT / 'data' / 'cl-trade-products.json').read_text(encoding='utf-8'))
    years = d['years']; prods = d['reporters']['CL']; series = []
    for flow, tag, word in (('exp', 'exp', 'Exports to'), ('imp', 'imp', 'Imports from')):
        tot = {}; names = {}
        for code, p in prods.items():
            if code in EXCL or not p.get(flow): continue
            for r in p[flow]['partners']:
                names[r['c']] = r['n']; t = tot.setdefault(r['c'], [0.0] * len(years))
                for i, v in enumerate(r['v']): t[i] += v or 0
        for c in sorted(tot, key=lambda k: -tot[k][-1])[:TOP]:
            v = [round(x, 3) for x in tot[c]]
            series.append({'id': 'cl-tp-%s-%s' % (tag, c.lower()), 'group': 'partners', 'label': '%s %s: selected agri-food products (annual)' % (word, names[c]),
                           'unit': 'USD million (value)', 'frequency': 'annual', 'latestPeriod': years[-1], 'latest': v[-1],
                           'changePct': round((v[-1] / v[-2] - 1) * 100, 2) if v[-2] else None, 'points': [[y, x] for y, x in zip(years, v)], 'sourceGroup': 'ODEPA'})
    if not series: print('sin series'); return
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'CL': {'name': 'Chile', 'extend': True, 'source': d['source'], 'series': series}}}
    p = ROOT / 'data' / 'cl-trade-partners-stats.json'
    if p.exists():
        try:
            old = json.loads(p.read_text(encoding='utf-8')); o2 = dict(old); n2 = dict(doc); o2.pop('generatedAt', None); n2.pop('generatedAt', None)
            if o2 == n2: print('sin cambios'); return
        except Exception: pass
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('CL: %d series de socios, ultimo ano %s' % (len(series), years[-1]))
main()

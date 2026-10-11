#!/usr/bin/env python3
"""data/us-trade-products.json: comercio de EE. UU. por producto y socio, derivado de data/gats.json (USDA FAS GATS, datos del Census Bureau).
Mismo esquema que eu-trade-products.json, con dos diferencias honestas: (1) los periodos son 12 meses moviles al ultimo mes publicado y los 12 anteriores,
no anos naturales; (2) GATS aqui solo trae los ~67 socios principales, asi que 'world' es la suma de esos socios y no el total mundial exacto.
No descarga nada: se ejecuta tras el pipeline de GATS. Uso: python3 scripts/build-us-trade-products.py"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TOP = 15
def month_add(ym, n):
    y, m = int(ym[:4]), int(ym[4:]) - 1 + n
    return '%04d%02d' % (y + m // 12, m % 12 + 1)
def main():
    g = json.loads((ROOT / 'data' / 'gats.json').read_text(encoding='utf-8'))
    names = json.loads((ROOT / 'scripts' / 'ref' / 'trade-product-names.json').read_text(encoding='utf-8'))
    latest = g['latest']; have = set(g['months'])
    w2 = [month_add(latest, -k) for k in range(11, -1, -1)]; w1 = [month_add(m, -12) for m in w2]
    if not all(m in have for m in w1 + w2):
        print('GATS no cubre 24 meses: sin cambios'); return
    lab = lambda w: 'LTM %s/%s' % (w[-1][4:], w[-1][:4])
    out = {}
    for flow, key in (('ex', 'exp'), ('im', 'imp')):
        for prod, partners in (g.get(flow) or {}).items():
            rows = []
            for code, per in partners.items():
                p = g['partners'].get(code)
                if not p: continue
                v = [round(sum((per.get(m) or [0])[0] or 0 for m in w) / 1e6, 3) for w in (w1, w2)]
                if v[0] or v[1]: rows.append({'c': p['i2'], 'n': p['n'], 'v': v})
            if not rows: continue
            rows.sort(key=lambda r: -(r['v'][1] or 0))
            world = [round(sum(r['v'][i] for r in rows), 3) for i in (0, 1)]
            o = out.setdefault(prod, {'name': names['en'].get(prod, prod), 'nm': {l: names[l].get(prod, prod) for l in ('es', 'en', 'fr', 'it')}})
            o[key] = {'world': world, 'extra': None, 'intra': None, 'partners': rows[:TOP]}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'years': [lab(w1), lab(w2)], 'unit': 'USD million',
           'source': {'name': 'USDA FAS GATS (US Census Bureau)', 'url': 'https://apps.fas.usda.gov/gats/', 'license': 'US public domain (USDA / Census Bureau); cite source'},
           'note': 'world = suma de los socios principales que publica GATS; periodos = 12 meses moviles',
           'reporters': {'US': out}}
    p = ROOT / 'data' / 'us-trade-products.json'
    if p.exists():
        try:
            old = json.loads(p.read_text(encoding='utf-8')); o2 = dict(old); n2 = dict(doc); o2.pop('generatedAt', None); n2.pop('generatedAt', None)
            if o2 == n2: print('sin cambios'); return
        except Exception: pass
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('US: %d productos, periodos %s' % (len(out), doc['years']))
main()

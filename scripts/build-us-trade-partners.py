#!/usr/bin/env python3
"""data/us-trade-partners-stats.json: series de comercio de EE. UU. por socio (para el bloque «Comercio agroalimentario» del perfil de pais),
derivadas de data/gats.json (USDA FAS GATS, datos del Census Bureau). No descarga nada.
Honestidad: GATS aqui solo cubre ~29 grupos de producto y los socios principales de cada uno, asi que la cifra es la suma de los PRODUCTOS SELECCIONADOS
(sin fertilizantes, etanol ni algodon, y sin duplicar mantequilla y queso, que ya estan dentro de lacteos). NO es el total agroalimentario de EE. UU.
Serie mensual = suma de los 12 meses que terminan en ese mes (USD millones). Uso: python3 scripts/build-us-trade-partners.py"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
EXCL = {'fertilizantes', 'etanol', 'algodon', 'mantequilla', 'queso'}
TOP = 8
def ym(m): return '%s-%s' % (m[:4], m[4:])
def main():
    g = json.loads((ROOT / 'data' / 'gats.json').read_text(encoding='utf-8'))
    months = sorted(g['months'])
    if len(months) < 13: print('GATS con menos de 13 meses: sin cambios'); return
    series = []
    for flow, tag, word in (('ex', 'exp', 'Exports to'), ('im', 'imp', 'Imports from')):
        tot = {}
        for prod, partners in (g.get(flow) or {}).items():
            if prod in EXCL: continue
            for code, per in partners.items():
                p = g['partners'].get(code)
                if not p: continue
                d = tot.setdefault(code, {})
                for m, v in per.items():
                    if v and v[0]: d[m] = d.get(m, 0) + v[0]
        ltm = {}
        for code, d in tot.items():
            pts = []
            for i in range(11, len(months)):
                w = months[i - 11:i + 1]
                pts.append([ym(months[i]), round(sum(d.get(m, 0) for m in w) / 1e6, 3)])
            ltm[code] = pts
        top = sorted(ltm, key=lambda c: -ltm[c][-1][1])[:TOP]
        for c in top:
            pts = ltm[c]; p = g['partners'][c]
            s = {'id': 'us-tp-%s-%s' % (tag, p['i2'].lower()), 'group': 'partners',
                 'label': '%s %s: selected agri-food products (12-month total)' % (word, p['n']), 'unit': 'USD million (value)', 'frequency': 'monthly',
                 'latestPeriod': pts[-1][0], 'latest': pts[-1][1],
                 'changePct': round((pts[-1][1] / pts[-2][1] - 1) * 100, 2) if len(pts) > 1 and pts[-2][1] else None,
                 'points': pts, 'sourceGroup': 'USDA FAS GATS'}
            series.append(s)
    if not series: print('sin series'); return
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'US': {'name': 'United States', 'extend': True,
                                'source': {'name': 'USDA FAS GATS (US Census Bureau)', 'url': 'https://apps.fas.usda.gov/gats/', 'license': 'US public domain (USDA / Census Bureau); cite source'},
                                'series': series}}}
    p = ROOT / 'data' / 'us-trade-partners-stats.json'
    if p.exists():
        try:
            old = json.loads(p.read_text(encoding='utf-8')); o2 = dict(old); n2 = dict(doc); o2.pop('generatedAt', None); n2.pop('generatedAt', None)
            if o2 == n2: print('sin cambios'); return
        except Exception: pass
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('US: %d series de socios, ultimo mes %s' % (len(series), months[-1]))
main()

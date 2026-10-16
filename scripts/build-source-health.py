#!/usr/bin/env python3
"""Estado por fuente -> data/views/source-health.json (lo lee status.html)

Para cada fuente con series en el catalogo (data/catalog/<pais>.json): numero de series, ultimo periodo publicado,
cuantas estan al dia / retrasadas / desactualizadas / historicas (estado de frescura «fs» de cada serie, data/freshness.json)
y su veredicto de uso comercial (data/commercial-summary.json). Solo lectura de datos ya construidos; no estima nada.
Uso: python3 scripts/build-source-health.py"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/views/source-health.json'
OK = ('LIVE', 'FRESH', 'EXPECTED_DELAY')

def J(p): return json.loads(Path(p).read_text(encoding='utf-8'))

def norm(p):
    """Ordenable por INICIO del periodo (2026 -> 2026-01-01, 2026-Q2 -> 2026-04-01, 2026-08 -> 2026-08-01): asi un dato semanal o mensual
    reciente no queda por detras de un dato anual del mismo año."""
    p = str(p or '')
    if len(p) == 4 and p.isdigit(): return p + '-01-01'
    if '-Q' in p:
        y, q = p.split('-Q'); return '%s-%02d-01' % (y, (int(q[:1]) - 1) * 3 + 1) if q[:1].isdigit() else p
    if '-W' in p:
        y, w = p.split('-W'); return '%s-%02d-01' % (y, min(12, max(1, int(w[:2]) * 7 // 31 + 1))) if w[:2].isdigit() else p
    if len(p) == 7 and p[5] in 'SH' and p[6].isdigit(): return '%s-%02d-01' % (p[:4], 1 if p[6] == '1' else 7)
    if len(p) == 7: return p + '-01'
    return p[:10]

def main():
    reg = J(ROOT / 'data/license-registry.json')['sources']
    alias = {}
    for k, v in reg.items():
        alias[k] = k
        for a in v.get('aliases', []): alias[a] = k
    verdict = {k: v.get('verdict') for k, v in J(ROOT / 'data/commercial-summary.json')['sources'].items()}
    agg = {}
    for f in sorted((ROOT / 'data/catalog').glob('*.json')):
        if f.name in ('manifest.json',): continue
        d = J(f)
        if not isinstance(d, dict) or 'series' not in d: continue
        for s in d['series']:
            sid = alias.get(s.get('sourceId'), s.get('sourceId'))
            if not sid: continue
            a = agg.setdefault(sid, {'series': 0, 'countries': set(), 'last': '', 'lastRaw': '', 'ok': 0, 'delayed': 0, 'stale': 0, 'historical': 0})
            a['series'] += 1; a['countries'].add(d.get('country') or f.stem)
            lp = s.get('latestPeriod')
            if lp and norm(lp) > a['last']: a['last'], a['lastRaw'] = norm(lp), str(lp)
            fs = s.get('fs')
            if fs in OK: a['ok'] += 1
            elif fs == 'DELAYED': a['delayed'] += 1
            elif fs == 'STALE': a['stale'] += 1
            elif fs == 'HISTORICAL': a['historical'] += 1
    rows = []
    for sid, a in agg.items():
        r = reg.get(sid, {})
        rows.append({'id': sid, 'name': r.get('short') or r.get('name') or sid, 'fullName': r.get('name') or sid, 'url': r.get('url'),
                     'countries': sorted(a['countries']), 'series': a['series'], 'lastPeriod': a['lastRaw'], 'ok': a['ok'], 'delayed': a['delayed'],
                     'stale': a['stale'], 'historical': a['historical'], 'verdict': verdict.get(sid) or 'no-apto', 'licenseStatus': r.get('status')})
    rows.sort(key=lambda x: -x['series'])
    gen = J(ROOT / 'data/freshness.json').get('generatedAt')
    doc = {'schemaVersion': 1, 'generatedAt': gen, 'summary': {'sources': len(rows), 'series': sum(x['series'] for x in rows),
           'ok': sum(x['ok'] for x in rows), 'delayed': sum(x['delayed'] for x in rows), 'stale': sum(x['stale'] for x in rows), 'historical': sum(x['historical'] for x in rows)}, 'sources': rows}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('Estado por fuente: %d fuentes, %d series' % (len(rows), doc['summary']['series']))

main()

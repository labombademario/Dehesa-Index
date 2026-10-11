#!/usr/bin/env python3
"""Por pais: que datos se esperan y para cuando -> data/country-pending.json (lo lee el Observatorio, seccion «Paises»).
Solo lee data/coverage-gaps.json y los catalogos por pais ya publicados; no descarga ni estima nada.
  - pct / potentialPct: % de cobertura hoy y % si llegara todo lo que hoy figura como retrasado (celdas STALE de la matriz pasan a cubiertas).
  - waiting: series cuyo siguiente dato deberia haber salido ya (EXPECTED_DELAY, DELAYED, STALE), agrupadas por fuente y frecuencia, con la fecha en que
    la politica de frescura (rezago habitual de la fuente) esperaba el dato. Es una ESTIMACION: la mayoria de fuentes no publican calendario.
  - upcoming: series al dia cuyo siguiente dato se espera en los proximos 45 dias.
  - archived: series historicas (llevan muchos ciclos sin dato; no cuentan como retraso)."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / 'data'
sys.path.insert(0, str(ROOT / 'scripts'))
import freshness as FR
def jl(p): return json.loads((DATA / p).read_text(encoding='utf-8'))
now_day = FR.today_ord(); today = FR.iso(now_day)
gaps = jl('coverage-gaps.json'); man = jl('catalog/manifest.json')['countries']
WAIT = ('EXPECTED_DELAY', 'DELAYED', 'STALE')
out = []
for cc, g in gaps['countries'].items():
    if g.get('entityType') not in ('country', 'aggregate') or cc not in man: continue
    f = DATA / man[cc]['catalog']
    if not f.exists(): continue
    rows = json.loads(f.read_text(encoding='utf-8'))['series']
    groups, up, arch = {}, {}, 0
    for r in rows:
        fs = r.get('fs'); ev = FR.evaluate(r['latestPeriod'], r['freq'], r['sourceId'], now_day)
        if fs == 'HISTORICAL': arch += 1; continue
        if fs in WAIT and ev.get('due') is not None:
            k = (r['sourceId'], r['freq']); d = groups.setdefault(k, {'sourceId': r['sourceId'], 'frequency': r['freq'], 'n': 0, 'states': {}, 'due': [], 'periods': [], 'sample': r['label']})
            d['n'] += 1; d['states'][fs] = d['states'].get(fs, 0) + 1; d['due'].append(ev['due']); d['periods'].append(str(r['latestPeriod']))
        elif fs in ('LIVE', 'FRESH') and ev.get('due') is not None and 0 <= ev['due'] - now_day <= 45:
            k = (r['sourceId'], r['freq']); d = up.setdefault(k, {'sourceId': r['sourceId'], 'frequency': r['freq'], 'n': 0, 'due': []}); d['n'] += 1; d['due'].append(ev['due'])
    waiting = []
    for d in sorted(groups.values(), key=lambda x: -x['n']):
        ds = sorted(d['due']); waiting.append({'sourceId': d['sourceId'], 'frequency': d['frequency'], 'n': d['n'], 'latestPeriod': max(d['periods']),
            'expectedSinceMedian': FR.iso(ds[len(ds) // 2]), 'daysLate': now_day - ds[len(ds) // 2]})
    upcoming = [{'sourceId': d['sourceId'], 'frequency': d['frequency'], 'n': d['n'], 'expectedNext': FR.iso(min(d['due']))} for d in sorted(up.values(), key=lambda x: min(x['due']))][:6]
    app, cov, st = g['applicable'], g['covered'], g['byState'].get('STALE', 0)
    out.append({'code': cc, 'name': g['name'], 'pct': round(g['coveredPct']), 'potentialPct': round(100 * (cov + st) / app) if app else None, 'waiting': waiting[:5], 'upcoming': upcoming[:3]})
out.sort(key=lambda x: (-(x['potentialPct'] or 0) + (x['pct'] or 0) * 0, x['name']))
out.sort(key=lambda x: -(x['potentialPct'] - x['pct']) if x['potentialPct'] is not None else 0)
doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'today': today,
       'doc': 'Fechas esperadas = fin del periodo + periodo + rezago habitual de la fuente (data/freshness-policy.json). Estimacion: la mayoria de fuentes no publican calendario. potentialPct = % si las celdas hoy retrasadas pasaran a cubiertas.',
       'countries': out}
body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
p = DATA / 'country-pending.json'
if p.exists():
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(body); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
p.write_text(body, encoding='utf-8'); print('OK', len(out), 'paises', len(body), 'bytes')

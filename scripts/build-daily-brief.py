#!/usr/bin/env python3
"""data/daily-brief.json — "Que ha cambiado hoy" en Dehesa: cambios REALES de datos (no noticias).
Compara el estado actual de las series con el que tenia cada fichero hace 24 h (historial de git; el workflow necesita fetch-depth 0),
mas revisiones (data/revisions.json) y estado de pipelines (data/pipeline-status.json)."""
import datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib_cashbids as CB
from lib_index import ROOT, STATS, git_show, rev_before, stats_series, products, DATASETS, KINDS, WORKFLOW_KINDS, kind_of, content_key, tree_key
WINDOW_H = 24
def main():
    now = datetime.datetime.utcnow().replace(microsecond=0); since = now - datetime.timedelta(hours=WINDOW_H)
    iso = since.strftime('%Y-%m-%dT%H:%M:%SZ')
    files = ['data/%s.json' % n for n in STATS] + ['data/latest.json']
    updated, new_data, new_ds = [], [], []
    names = {}
    ps = json.loads((ROOT / 'data/pipeline-status.json').read_text())  # estricto: sin estado de pipelines no hay brief
    for p in ps.get('pipelines', []):
        for f in p.get('files', []): names.setdefault(f['path'], p.get('name', p.get('workflow', '')).replace('Dehesa Data — ', ''))
    for f in files:
        cur_p = ROOT / f
        if not cur_p.exists(): continue
        cur = json.loads(cur_p.read_text())
        cs = products(cur) if f.endswith('latest.json') else stats_series(cur)
        rev = rev_before(f, iso)
        if not rev: new_ds.append({'file': f, 'name': names.get(f, f), 'series': len(cs)}); continue
        old_t = git_show(rev, f)
        try: od = json.loads(old_t)
        except Exception: continue
        os_ = products(od) if f.endswith('latest.json') else stats_series(od)
        changed = 0
        for k, v in cs.items():
            o = os_.get(k)
            if o is None: changed += 1; new_data.append(dict(k=k, new=True, **v)); continue
            if v['p'] != o['p'] and v['p'] is not None:
                changed += 1; new_data.append(dict(k=k, prevP=o['p'], prevV=o['v'], **v))
            elif v['v'] != o['v']: changed += 1
        if changed: updated.append({'file': f, 'name': names.get(f, f), 'changed': changed})
    fresh = [x for x in new_data if not x.get('new')]
    # --- cobertura completa: cada dataset de DATASETS (y los *-stats.json ya leidos serie a serie) con su tipo y si cambio de CONTENIDO en la ventana
    unknown = sorted(p['workflow'] for p in ps.get('pipelines', []) if p['workflow'] not in WORKFLOW_KINDS)
    if unknown: sys.exit('pipelines sin clasificar en lib_index.WORKFLOW_KINDS: %s' % unknown)
    cover = []
    for path, (kind, label) in sorted(DATASETS.items(), key=lambda kv: (kv[1][0], kv[0])):
        cur_p = ROOT / path
        if not cur_p.exists(): continue
        rev = rev_before(path, iso)
        if cur_p.is_dir():
            now_k = tree_key('HEAD', path); old_k = tree_key(rev, path) if rev else None
        else:
            now_k = content_key(cur_p.read_text()); old_t = git_show(rev, path) if rev else None; old_k = content_key(old_t) if old_t else None
        cover.append({'file': path, 'name': label, 'kind': kind, 'status': 'new' if old_k is None else ('changed' if old_k != now_k else 'unchanged')})
    # las series de *-stats.json y de latest.json se clasifican por su grupo
    by_kind = {k: {'datasets': 0, 'changed': 0, 'newPeriods': 0} for k in KINDS}
    for c in cover:
        by_kind[c['kind']]['datasets'] += 1
        if c['status'] != 'unchanged': by_kind[c['kind']]['changed'] += 1
    for x in fresh: by_kind[kind_of(x['g'], x['k'])]['newPeriods'] += 1
    def mk(x):
        r = {'k': x['k'], 'kind': kind_of(x['g'], x['k']), 'label': x['l'], 'unit': x['u'], 'period': x['p'], 'value': x['v'], 'changePct': x['c'], 'group': x['g']}
        if x.get('new'): r['new'] = True
        if x.get('s'): r['sourceId'] = x['s']
        return r
    fresh = [x for x in new_data if not x.get('new')]
    movers = sorted([x for x in fresh if isinstance(x['c'], (int, float)) and x['g'] != 'rates' and abs(x['c']) >= 2], key=lambda x: -abs(x['c']))[:12]
    # revisiones detectadas en la ventana
    revs = []
    try:
        for r in json.loads((ROOT / 'data/revisions.json').read_text()).get('revisions', []):
            if (r.get('detectedAt') or '') >= iso: revs.append(r)
    except Exception: pass
    # pipelines en retraso / error y proximas ejecuciones
    old = {}
    try: old = json.loads((ROOT / 'data/daily-brief.json').read_text())
    except Exception: pass
    prev_stale = {s['workflow'] for s in old.get('stale', [])}
    stale = [{'workflow': p['workflow'], 'name': p.get('name', '').replace('Dehesa Data — ', ''), 'status': p['status'], 'isNew': p['workflow'] not in prev_stale}
             for p in ps.get('pipelines', []) if p.get('status') in ('late', 'error')]
    horizon = (now + datetime.timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ'); nowS = now.strftime('%Y-%m-%dT%H:%M:%SZ')
    upcoming = sorted([{'workflow': p['workflow'], 'name': p.get('name', '').replace('Dehesa Data — ', ''), 'nextRun': p['nextRun']} for p in ps.get('pipelines', []) if p.get('nextRun') and nowS <= p['nextRun'] <= horizon], key=lambda x: x['nextRun'])[:15]
    doc = {'schemaVersion': 1, 'generatedAt': nowS, 'windowHours': WINDOW_H, 'since': iso,
           'counts': {'datasetsUpdated': len(updated), 'newPeriods': len(fresh), 'newSeries': len([x for x in new_data if x.get('new')]), 'newDatasets': len(new_ds), 'revisions': len(revs), 'stale': len(stale), 'staleNew': len([s for s in stale if s['isNew']]), 'upcoming': len(upcoming)},
           'datasets': sorted(updated, key=lambda x: -x['changed']), 'newDatasets': new_ds, 'movers': [mk(x) | {'prevPeriod': x.get('prevP'), 'prevValue': x.get('prevV')} for x in movers],
           'newData': [mk(x) for x in sorted(fresh, key=lambda x: -abs(x['c'] if isinstance(x['c'], (int, float)) else 0))[:150]],
           'cashBids': CB.brief_section(now, iso), 'revisions': revs[:30], 'stale': stale, 'upcoming': upcoming, 'coverage': cover, 'byKind': by_kind,
           'pipelinesCovered': {'total': len(ps.get('pipelines', [])), 'withKind': len([p for p in ps.get('pipelines', []) if WORKFLOW_KINDS.get(p['workflow'])]), 'internal': sorted(w for w, k in WORKFLOW_KINDS.items() if not k)}}
    # no reescribir si solo cambia la hora
    a = dict(doc); a.pop('generatedAt'); b = dict(old); b.pop('generatedAt', None)
    if a == b: print('sin cambios'); return
    (ROOT / 'data/daily-brief.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps(doc['counts']))
main()

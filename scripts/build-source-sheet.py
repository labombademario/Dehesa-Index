#!/usr/bin/env python3
"""Ficha de datos por fuente -> data/views/source-sheet.json (la lee la pagina de empresas)

Una fila por fuente en uso: licencia, veredicto de uso comercial, atribucion, cadencia con la que se actualiza, ultima actualizacion correcta y estado.
Cruza data/license-registry.json (licencias y ficheros), data/commercial-summary.json (veredicto), sources.yml (ficheros de cada pipeline),
data/pipeline-status.json (cadencia y ultima ejecucion) y data/views/source-health.json (ultimo periodo de los datos, si la fuente tiene series).
Sin datos nuevos no cambia nada. Uso: python3 scripts/build-source-sheet.py [--check]"""
import json, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'views' / 'source-sheet.json'
RANK = {'ok': 0, 'late': 1, 'not_run': 2, 'unknown': 2, 'error': 3}


def load(rel): return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def file_sources(spec):
    s = set()
    if spec.get('default'): s.add(spec['default'])
    for k in ('sources', 'also'):
        for x in spec.get(k) or []: s.add(x)
    return s


def build():
    reg = load('data/license-registry.json'); com = load('data/commercial-summary.json')['sources']; ps = load('data/pipeline-status.json')
    health = {x['id']: x for x in load('data/views/source-health.json')['sources']}
    pipes = {p['workflow']: p for p in ps['pipelines']}
    files = reg['files']
    prefix = {k: v for k, v in files.items() if k.endswith('/')}
    by_src = {}   # fuente -> pipelines
    for y in yaml.safe_load((ROOT / 'sources.yml').read_text(encoding='utf-8'))['sources']:
        wf = 'update-%s.yml' % y['id']
        if wf not in pipes: continue
        found = set()
        for f in y.get('data', []):
            path = 'data/' + f
            spec = files.get(path) or next((v for k, v in prefix.items() if path.startswith(k)), None)
            if spec: found |= file_sources(spec)
        for sid in found: by_src.setdefault(sid, []).append(wf)
    rows = []
    for sid, s in sorted(reg['sources'].items()):
        if not s.get('used'): continue
        ps_ = [pipes[w] for w in by_src.get(sid, [])]
        hrs = [p['expectedEveryHours'] for p in ps_ if p.get('expectedEveryHours')]
        ok = [p['last']['startedAt'] for p in ps_ if p.get('last') and p['last'].get('conclusion') == 'success']
        st = max((p.get('status', 'unknown') for p in ps_), key=lambda x: RANK.get(x, 2)) if ps_ else None
        h = health.get(sid, {})
        rows.append({'id': sid, 'name': s.get('short') or s['name'], 'fullName': s['name'], 'url': s.get('url'), 'country': s.get('country'),
                     'license': {'id': s.get('licenseId'), 'name': s.get('licenseName'), 'url': s.get('licenseUrl')},
                     'commercial': (com.get(sid) or {}).get('verdict'), 'commercialUse': s.get('commercialUse'), 'redistribution': s.get('redistribution'),
                     'attributionRequired': bool(s.get('attributionRequired')), 'attribution': s.get('attributionText'),
                     'cadenceHours': min(hrs) if hrs else None, 'lastUpdate': max(ok)[:10] if ok else None, 'lastPeriod': h.get('lastPeriod'), 'status': st,
                     'pipelines': len(ps_)})
    return {'schemaVersion': 1, 'generatedAt': ps['generatedAt'], 'summary': {'sources': len(rows), 'withPipeline': sum(1 for r in rows if r['pipelines']),
            'apto': sum(1 for r in rows if r['commercial'] == 'apto'), 'condiciones': sum(1 for r in rows if r['commercial'] == 'condiciones')}, 'sources': rows}


def main():
    doc = build(); txt = json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n'
    if '--check' in sys.argv:
        if not OUT.exists() or json.loads(OUT.read_text(encoding='utf-8')) != doc: print('FICHA DE FUENTES DESFASADA: ejecuta scripts/build-source-sheet.py'); sys.exit(1)
        print('ficha de fuentes al dia'); return
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != txt: OUT.write_text(txt, encoding='utf-8')
    print('ficha de fuentes: %(sources)d fuentes, %(withPipeline)d con pipeline, %(apto)d aptas, %(condiciones)d con condiciones' % doc['summary'])


if __name__ == '__main__':
    main()

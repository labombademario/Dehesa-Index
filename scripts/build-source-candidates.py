#!/usr/bin/env python3
"""data/source-candidates.json — Source Discovery Queue. Cola de fuentes candidatas (curadas en scripts/source-candidates-seed.json a partir de notas del proyecto) mas las fuentes YA integradas
(ACTIVE, derivadas del registro y del catalogo). El estado de ingesta y el resultado del License Gate los CALCULA scripts/source_gate.py desde data/license-registry.json: este script no concede licencias.
Nada pasa a READY/INGESTING/ACTIVE sin gate READY (salvo lo ya integrado segun el registro). lastChecked = fecha de la verificacion registrada, no la de hoy; verification = NOT_REVERIFIED para lo curado."""
import collections, datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import coverage_model as CM, source_gate as G
ROOT = CM.ROOT; D = CM.D
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
reg = CM.J('license-registry.json'); S = reg['sources']
seed = json.loads((ROOT / 'scripts' / 'source-candidates-seed.json').read_text(encoding='utf-8'))
FREQ = {'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'irregular', 'mixed', 'unknown'}

def clean(d): return {k: v for k, v in d.items() if v is not None}

def entry_from_seed(c):
    r = S.get(c['registryId']) if c.get('registryId') else None
    if c.get('registryId') and not r: raise SystemExit('registryId inexistente: %s' % c['registryId'])
    gr, why = G.gate(r, c); st = G.ingestion(gr, r, c)
    e = {'sourceId': c['sourceId'], 'registryId': c.get('registryId'), 'country': c['country'], 'scope': c['scope'], 'institution': c['institution'], 'dataset': c['dataset'],
         'products': sorted(c['products']), 'productsConfirmed': bool(c['productsConfirmed']), 'metrics': sorted(c['metrics']), 'frequency': c['frequency'], 'access': c['access'],
         'licenseStatus': G.license_view(r), 'licenseId': r['licenseId'] if r else None, 'licenseClaim': c.get('licenseClaim'),
         'commercialReuse': r['commercialUse'] if r else 'unknown', 'derivatives': r['derivatives'] if r else 'unknown', 'attribution': (r or {}).get('attributionText'),
         'lastChecked': (r or {}).get('verifiedAt') or seed['lastCheckedDefault'], 'verification': 'NOT_REVERIFIED',
         'datasetIdentified': bool(c['datasetIdentified']), 'gate': {'result': gr, 'reasons': why}, 'ingestionStatus': st,
         'technicalBlockers': c['technicalBlockers'], 'canStart': st == 'READY' and not c['technicalBlockers'],
         'evidence': c['evidence'], 'notes': c.get('notes')}
    return e

def active_entries():
    cat = collections.defaultdict(lambda: {'tags': set(), 'metrics': set(), 'freq': set(), 'n': 0})
    man = CM.J('catalog/manifest.json')
    files = []
    for c, v in man['countries'].items():
        files.append(v['catalog'])
        if (D / ('catalog/eu/%s.json' % c)).exists(): files.append('catalog/eu/%s.json' % c)
    for f in files:
        for s in CM.J(f)['series']:
            a = cat[s.get('sourceId')]; a['n'] += 1; a['freq'].add(s.get('freq'))
            m = CM.GROUP_METRIC.get(s['group'])
            if m and m != 'other': a['metrics'].add(m)
            for t in s.get('tags') or []: a['tags'].add(t)
    out = []
    for k, r in S.items():
        if not r.get('used'): continue
        a = cat.get(k); gr, why = G.gate(r, {}); fr = sorted(a['freq']) if a else []
        freq = fr[0] if len(fr) == 1 else ('mixed' if fr else 'unknown')
        if freq not in FREQ: freq = 'mixed'
        out.append({'sourceId': k, 'registryId': k, 'country': r['country'], 'scope': 'integrated', 'institution': r['name'],
                    'dataset': 'Ya integrada (%d series en el catalogo unificado)' % a['n'] if a else 'Ya integrada (ficheros propios fuera del catalogo unificado)',
                    'products': sorted(a['tags']) if a else [], 'productsConfirmed': bool(a), 'metrics': sorted(a['metrics']) if a else [], 'frequency': freq,
                    'access': {'api': None, 'csv': None, 'json': None}, 'licenseStatus': r['status'], 'licenseId': r['licenseId'], 'licenseClaim': None,
                    'commercialReuse': r['commercialUse'], 'derivatives': r['derivatives'], 'attribution': r.get('attributionText'), 'lastChecked': r['verifiedAt'],
                    'verification': 'REGISTRY', 'datasetIdentified': True, 'gate': {'result': gr, 'reasons': why}, 'ingestionStatus': 'ACTIVE', 'technicalBlockers': [], 'canStart': False,
                    'evidence': ['data/license-registry.json'], 'notes': 'ACTIVE por used=true en el registro; la licencia se muestra tal cual (%s).' % r['status'] if r['status'] != 'VERIFIED' else None})
    return out

cands = [entry_from_seed(c) for c in seed['candidates']] + active_entries()
ids = [c['sourceId'] for c in cands]
dup = [k for k, n in collections.Counter(ids).items() if n > 1]
if dup: raise SystemExit('sourceId duplicado: %s' % dup)
rank = {s: i for i, s in enumerate(G.STATUS_ORDER)}
cands.sort(key=lambda c: (-rank[c['ingestionStatus']] if c['ingestionStatus'] != 'ACTIVE' else 9, c['sourceId']))
cands = [clean(c) for c in cands]
by = collections.Counter(c['ingestionStatus'] for c in cands)
doc = {'schemaVersion': 1, 'generatedAt': NOW,
       'policy': {'doc': 'Cola de descubrimiento de fuentes. NO concede licencias ni activa ingestas: el estado se calcula desde data/license-registry.json con scripts/source_gate.py.',
                  'states': {'DISCOVERED': 'fuente conocida; sin licencia revisada o sin dataset concreto identificado',
                             'LICENSE_REVIEW': 'en el registro con licencia PENDING o con condiciones no inequivocas',
                             'READY': 'licencia VERIFIED (comercial y derivados) y dataset identificado: puede construirse; canStart=false si hay bloqueos tecnicos',
                             'INGESTING': 'en construccion (exige gate READY)', 'ACTIVE': 'ya integrada segun used=true del registro',
                             'BLOCKED': 'RESTRICTED/BLOCKED en el registro o decision documentada: no se usa'},
                  'gate': 'READY solo si el registro dice VERIFIED con uso comercial y derivados = yes. licenseClaim recoge lo que dicen las notas del proyecto y nunca cuenta como licencia.'},
       'summary': {'total': len(cands), 'byStatus': dict(sorted(by.items())), 'canStart': sorted(c['sourceId'] for c in cands if c['canStart']),
                   'newCountries': sorted({c['country'] for c in cands if c['scope'] == 'outside' and c['country'] != 'INT'})},
       'candidates': cands}
(D / 'source-candidates.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('source-candidates.json: %d fuentes %s; canStart=%s' % (len(cands), dict(by), doc['summary']['canStart']))

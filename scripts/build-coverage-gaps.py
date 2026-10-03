#!/usr/bin/env python3
"""data/coverage-gaps.json — Data Coverage Gap Analysis: pais x producto x metrica, con estados tecnicos.
Estados por celda: AVAILABLE (alguna serie del catalogo con frescura LIVE/FRESH/EXPECTED_DELAY), STALE (hay series pero ninguna al dia), AVAILABLE_OUTSIDE_CATALOG (no hay serie en el catalogo
unificado pero el dato existe en un fichero USDA propio; frescura no evaluada), SOURCE_AVAILABLE_NOT_INGESTED (hay una candidata READY segun el License Gate), LICENSE_PENDING (candidata con licencia
por revisar y dataset identificado), MISSING (nada). El orden es TECNICO (cuantas celdas desbloquea una fuente y si su gate esta READY); no mide importancia de mercado.
No inventa: una celda solo cambia por series reales o por candidatas de data/source-candidates.json con productos CONFIRMADOS."""
import collections, datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import coverage_model as CM
D = CM.D
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
reg = CM.J('license-registry.json')['sources']
alias = {}
for k, v in reg.items():
    alias[k] = k
    for a in v.get('aliases', []): alias[a] = k
cand = CM.J('source-candidates.json')['candidates']
PRODUCTS = sorted(CM.KIND_OF)
STATES = ['AVAILABLE', 'AVAILABLE_OUTSIDE_CATALOG', 'STALE', 'HISTORICAL_ONLY', 'SOURCE_AVAILABLE_NOT_INGESTED', 'LICENSE_PENDING', 'MISSING']

def lic_of(sid):
    r = reg.get(alias.get(sid)); return r['status'] if r else 'UNKNOWN'

# ---- evidencia fuera del catalogo (se lee del fichero real)
ext = collections.defaultdict(list)   # (cc, producto, metrica) -> [{sourceId, file}]
psd = CM.J('supply-demand.json', {'commodities': []})
for c in psd['commodities']:
    p = CM.PSD_PRODUCT.get(c['id'])
    if not p: continue
    metrics = {CM.PSD_METRIC[a] for a in c.get('attributes', []) if a in CM.PSD_METRIC}
    for name in (c.get('countries') or []):
        cc = CM.PSD_COUNTRY.get(name)
        if cc:
            for m in metrics: ext[(cc, p, m)].append({'sourceId': 'usda_fas_psd', 'file': 'supply-demand.json'})
gats = CM.J('gats.json', {})
for side in ('ex', 'im'):
    for g in (gats.get(side) or {}):
        p = CM.GATS_PRODUCT.get(g)
        if p: ext[('US', p, 'trade')].append({'sourceId': 'usda_fas_gats', 'file': 'gats.json'})
es = CM.J('export-sales.json', {'commodities': []})
if es.get('commodities'):
    for p in ('wheat', 'maize', 'barley', 'soy', 'rice', 'cattle', 'pigs'): ext[('US', p, 'trade')].append({'sourceId': 'usda_fas_esr', 'file': 'export-sales.json'})
# ficheros USDA de formato propio: se lee el fichero real y se mapea lo que contiene (ver coverage_model.py)
FILE_SRC = {f[len('data/'):]: v['sources'][0] for f, v in CM.J('license-registry.json')['files'].items() if f.startswith('data/') and len(v.get('sources', [])) == 1}
def add_ext(cc, p, m, f):
    ext[(cc, p, m)].append({'sourceId': FILE_SRC.get(f, 'usda_nass'), 'file': f})
for key in (CM.J('nass-crops.json', {'series': {}}).get('series') or {}):
    p = CM.NASS_CROP_PRODUCT.get(key.split(' - ')[0].split(',')[0].strip())
    if p: add_ext('US', p, 'production', 'nass-crops.json')
for key in (CM.J('nass-livestock.json', {'series': {}}).get('series') or {}):
    head, _, tail = key.partition(' - '); p = CM.NASS_LIVESTOCK_PRODUCT.get(head.split(',')[0].strip())
    m = next((mm for tok, mm in CM.NASS_LIVESTOCK_METRIC if tail.upper().startswith(tok)), None)
    if p and m: add_ext('US', p, m, 'nass-livestock.json')
for key in (CM.J('nass-prices.json', {'series': {}}).get('series') or {}):
    p = next((pp for tok, pp in CM.NASS_PRICES_PRODUCT if key.upper().startswith(tok)), None)
    if p: add_ext('US', p, 'price_index', 'nass-prices.json')
for k, v in (CM.J('ams-grain-daily.json', {'products': {}}).get('products') or {}).items():
    if v and CM.AMS_GRAIN_PRODUCT.get(k): add_ext('US', CM.AMS_GRAIN_PRODUCT[k], 'price', 'ams-grain-daily.json')
for key in ((CM.J('germany-agri.json', {'production': {'nat': {}}}).get('production') or {}).get('nat') or {}):   # produccion agricola de Alemania (Destatis)
    if CM.DE_AGRI_PRODUCT.get(key): add_ext('DE', CM.DE_AGRI_PRODUCT[key], 'production', 'germany-agri.json')
_gl = CM.J('germany-livestock.json', {})   # ganaderia, huevos, aves y fruta de Alemania (Destatis)
for key in ((_gl.get('slaughter') or {}).get('nat') or {}):
    if CM.DE_LIVESTOCK_PRODUCT.get(key): add_ext('DE', CM.DE_LIVESTOCK_PRODUCT[key], 'production', 'germany-livestock.json')
if (_gl.get('poultry') or {}).get('total'): add_ext('DE', 'poultry', 'production', 'germany-livestock.json')
if (_gl.get('eggs') or {}).get('nat', {}).get('eggs'): add_ext('DE', 'eggs', 'production', 'germany-livestock.json')
if _gl.get('fruit'): add_ext('DE', 'fruit', 'production', 'germany-livestock.json')
for k in ext:  # sin duplicados
    seen = []; [seen.append(x) for x in ext[k] if x not in seen]; ext[k] = seen

# ---- matriz
matrix = {}; basis = {}; countries = {}; untagged = collections.Counter(); unmapped = collections.Counter(); other = collections.Counter(); stale_by_source = collections.defaultdict(lambda: {'cells': set(), 'series': 0, 'countries': set()})
for cc, name, etype, files in CM.entities():
    cells = collections.defaultdict(lambda: {'n': 0, 'ok': 0, 'arch': 0, 'latest': 0, 'latestPeriod': None, 'sources': set(), 'groups': set()})
    ing = collections.Counter(); trk = collections.Counter(); unt = collections.Counter(); basis[cc] = (ing, trk, unt)  # evidencia para la confianza de los huecos
    for s in CM.load_series(files):
        m = CM.GROUP_METRIC.get(s['group'])
        if m is None: unmapped[s['group']] += 1; continue
        if m == 'other': other[s['group']] += 1; continue
        tags = [t for t in (s.get('tags') or []) if t in CM.KIND_OF]
        ing[m] += 1
        if not tags: untagged[s['group']] += 1; unt[m] += 1; continue
        for t in tags:
            trk[t] += 1
            c = cells[(t, m)]; c['n'] += 1; c['sources'].add(s.get('sourceId')); c['groups'].add(s['group'])
            if s.get('fs') in CM.OK_STATES: c['ok'] += 1
            if s.get('fs') in CM.ARCHIVE_STATES: c['arch'] += 1
            k = CM.period_key(s.get('latestPeriod'))
            if k > c['latest']: c['latest'] = k; c['latestPeriod'] = s.get('latestPeriod')
            if s.get('fs') not in CM.OK_STATES and s.get('fs') not in CM.ARCHIVE_STATES:  # las historicas no son un pipeline retrasado
                sb = stale_by_source[s.get('sourceId')]; sb['cells'].add((cc, t, m)); sb['series'] += 1; sb['countries'].add(cc)
    rows = {}
    for p in PRODUCTS:
        for m in CM.APPLICABLE[CM.KIND_OF[p]]:
            c = cells.get((p, m)); e = ext.get((cc, p, m), [])
            cl = [x for x in cand if x['scope'] in ('catalog',) and x['country'] == cc and x.get('productsConfirmed') and p in x['products'] and m in x['metrics'] and x['ingestionStatus'] != 'ACTIVE']
            if c and c['ok']: st = 'AVAILABLE'
            elif c and c['arch'] == c['n']: st = 'HISTORICAL_ONLY'
            elif c: st = 'STALE'
            elif e: st = 'AVAILABLE_OUTSIDE_CATALOG'
            else:
                live = [x for x in cl if x['ingestionStatus'] == 'READY']
                pend = [x for x in cl if x['ingestionStatus'] == 'LICENSE_REVIEW' or (x['ingestionStatus'] == 'DISCOVERED' and x['licenseStatus'] == 'UNREVIEWED' and x['datasetIdentified'])]
                st = 'SOURCE_AVAILABLE_NOT_INGESTED' if live else 'LICENSE_PENDING' if pend else 'MISSING'
            cell = {'state': st, 'series': c['n'] if c else 0, 'fresh': c['ok'] if c else 0, 'archive': c['arch'] if c else 0}
            if c:
                cell['latestPeriod'] = c['latestPeriod']; cell['sources'] = sorted(x for x in c['sources'] if x)
                cell['licenses'] = sorted({lic_of(x) for x in c['sources'] if x}, key=lambda z: CM.LIC_RANK.get(z, 9))
            if e: cell['external'] = e
            if cl and st != 'AVAILABLE': cell['candidates'] = sorted(x['sourceId'] for x in cl)
            rows.setdefault(p, {})[m] = cell
    matrix[cc] = rows
    cnt = collections.Counter(cell['state'] for r in rows.values() for cell in r.values())
    tot = sum(cnt.values())
    countries[cc] = {'name': name, 'entityType': etype, 'cells': tot, 'byState': {s: cnt.get(s, 0) for s in STATES}, 'covered': cnt['AVAILABLE'] + cnt['AVAILABLE_OUTSIDE_CATALOG'],
                     'coveredPct': round(100 * (cnt['AVAILABLE'] + cnt['AVAILABLE_OUTSIDE_CATALOG']) / tot, 1) if tot else 0}

# ---- confianza de cada hueco (confidence): solo los MISSING 'high' sirven para priorizar fuentes nuevas
# Evidencia por celda MISSING (todo sale del catalogo y de la propia matriz, nada se supone):
#   metricIngested  la entidad tiene series de ese tipo de metrica (hay pipeline para la metrica en ese pais)
#   productTracked  la entidad tiene series etiquetadas con ese producto (el producto esta en su alcance)
#   peers           otras entidades SI tienen ese producto y metrica (AVAILABLE o AVAILABLE_OUTSIDE_CATALOG): el tipo de dato existe
#   untaggedCandidates  series de ese tipo de metrica sin etiqueta de producto: podrian esconder la celda
# high = metricIngested y productTracked y peers>0 y sin candidatas sin etiquetar; medium = peers>0 y alguna evidencia propia (producto o metrica) pero no todas; low = el resto.
def peers_of(cc, p, m): return sum(1 for c2, rows2 in matrix.items() if c2 != cc and rows2[p][m]['state'] in ('AVAILABLE', 'AVAILABLE_OUTSIDE_CATALOG'))
for cc, rows in matrix.items():
    ing, trk, unt = basis[cc]
    for p, ms in rows.items():
        for m, cell in ms.items():
            st = cell['state']
            if st == 'MISSING':
                b = {'metricIngested': ing[m] > 0, 'productTracked': trk[p] > 0, 'peers': peers_of(cc, p, m), 'untaggedCandidates': unt[m]}
                cell['basis'] = b
                cell['confidence'] = 'high' if b['metricIngested'] and b['productTracked'] and b['peers'] > 0 and b['untaggedCandidates'] == 0 else 'medium' if b['peers'] > 0 and (b['metricIngested'] or b['productTracked']) else 'low'
            elif st == 'AVAILABLE_OUTSIDE_CATALOG': cell['confidence'] = 'medium'   # el dato existe, pero fuera del catalogo y sin frescura evaluada
            else: cell['confidence'] = 'high'   # AVAILABLE/STALE/HISTORICAL_ONLY se observan en series reales; LICENSE_PENDING/SOURCE_AVAILABLE tienen candidata identificada
for cc, rows in matrix.items():
    mc = collections.Counter(cell['confidence'] for r in rows.values() for cell in r.values() if cell['state'] == 'MISSING')
    countries[cc]['missingByConfidence'] = {k: mc.get(k, 0) for k in ('high', 'medium', 'low')}

# ---- agregados y ranking tecnico
tot_state = collections.Counter(); by_metric = {m: collections.Counter() for m in CM.METRICS}; by_product = {p: collections.Counter() for p in PRODUCTS}
for cc, rows in matrix.items():
    for p, ms in rows.items():
        for m, cell in ms.items(): tot_state[cell['state']] += 1; by_metric[m][cell['state']] += 1; by_product[p][cell['state']] += 1
cells_total = sum(tot_state.values())
leverage = []
for x in cand:
    if x['ingestionStatus'] == 'ACTIVE' or not x.get('productsConfirmed') or x['scope'] != 'catalog': continue
    hit = [(cc, p, m) for cc, rows in matrix.items() if cc == x['country'] for p in x['products'] for m in x['metrics'] if m in rows.get(p, {}) and rows[p][m]['state'] != 'AVAILABLE' and (rows[p][m]['state'] != 'MISSING' or rows[p][m]['confidence'] == 'high')]
    leverage.append({'sourceId': x['sourceId'], 'country': x['country'], 'ingestionStatus': x['ingestionStatus'], 'gate': x['gate']['result'], 'canStart': x['canStart'], 'cells': len(hit),
                     'technicalBlockers': len(x['technicalBlockers'])})
order = {'READY': 0, 'LICENSE_REVIEW': 1, 'DISCOVERED': 2, 'BLOCKED': 3}
leverage.sort(key=lambda r: (order.get(r['ingestionStatus'], 9), not r['canStart'], -r['cells'], r['sourceId']))
stale_src = sorted(({'sourceId': k, 'staleSeries': v['series'], 'staleCells': len(v['cells']), 'countries': sorted(v['countries'])} for k, v in stale_by_source.items() if v['cells']),
                   key=lambda r: (-r['staleCells'], r['sourceId']))
doc = {'schemaVersion': 1, 'generatedAt': NOW,
       'method': {'doc': 'Matriz pais x producto x metrica sobre el catalogo unificado (data/catalog). Productos = etiquetas del catalogo (heuristica de palabras clave sobre las etiquetas de serie). Solo se cuentan metricas aplicables a cada tipo de producto. Orden y ranking: tecnicos, sin juicio de importancia de mercado.',
                  'states': {'AVAILABLE': 'al menos una serie del catalogo con frescura LIVE/FRESH/EXPECTED_DELAY', 'STALE': 'hay series, ninguna al dia y alguna deberia seguir publicandose (STALE/DELAYED)', 'HISTORICAL_ONLY': 'todas las series de la celda son historicas o discontinuadas: hay historia pero no hay fuente viva en el catalogo; no es un pipeline retrasado',
                             'AVAILABLE_OUTSIDE_CATALOG': 'sin serie en el catalogo unificado, pero el dato existe en un fichero USDA propio (supply-demand/gats/export-sales); frescura no evaluada',
                             'SOURCE_AVAILABLE_NOT_INGESTED': 'candidata READY segun el License Gate (data/source-candidates.json) con producto y metrica confirmados',
                             'LICENSE_PENDING': 'candidata con licencia en revision (o sin revisar con dataset identificado) y producto confirmado', 'MISSING': 'ninguna de las anteriores; cada celda lleva confidence y basis (metricIngested, productTracked, peers, untaggedCandidates)'},
                  'metricOfGroup': CM.GROUP_METRIC, 'applicable': CM.APPLICABLE, 'kindOf': CM.KIND_OF, 'okStates': list(CM.OK_STATES),
                  'limits': ['Las etiquetas de producto son heuristicas: MISSING significa que no hay serie etiquetada, no que el dato no exista.',
                             'Una candidata solo rellena celdas si sus productos estan CONFIRMADOS por las notas (productsConfirmed).',
                             'AVAILABLE_OUTSIDE_CATALOG solo comprueba que el fichero USDA contiene el producto y la metrica; no mide su frescura.',
                             'AVAILABLE_OUTSIDE_CATALOG se deduce de ficheros USDA reales con formato propio (supply-demand/PSD, gats, export-sales, nass-crops, nass-livestock, nass-prices, ams-grain-daily): se mapea solo lo que contienen. ERS, crop-progress y drought no tienen metrica equivalente en la matriz y se listan en notInMatrix.outsideCatalogNotMapped.',
                             'confidence (high/medium/low) mide cuanta evidencia hay de que un MISSING sea un hueco real; solo los MISSING con confidence=high deben usarse para priorizar fuentes nuevas. medium/low son no concluyentes (la metrica no esta ingerida en el pais, el producto no esta en su alcance, hay series sin etiquetar o ningun otro pais tiene el dato).',
                             'Las series de grupos sin celda de producto (renta, tipos de interes, ecologico, medio ambiente) y las series sin etiqueta de producto no entran en la matriz y se cuentan aparte.']},
       'products': PRODUCTS, 'metrics': CM.METRICS, 'siteProducts': CM.SITE_PRODUCT,
       'summary': {'entities': len(matrix), 'cells': cells_total, 'byState': {s: tot_state.get(s, 0) for s in STATES}, 'byMetric': {m: {s: by_metric[m].get(s, 0) for s in STATES} for m in CM.METRICS},
                   'byProduct': {p: {s: by_product[p].get(s, 0) for s in STATES} for p in PRODUCTS},
                   'missingByConfidence': {k: sum(1 for r in matrix.values() for ms in r.values() for cell in ms.values() if cell['state'] == 'MISSING' and cell['confidence'] == k) for k in ('high', 'medium', 'low')},
                   'highConfidenceMissing': sorted([cc, p, m] for cc, r in matrix.items() for p, ms in r.items() for m, cell in ms.items() if cell['state'] == 'MISSING' and cell['confidence'] == 'high'),
                   'notInMatrix': {'groupsWithoutProductCell': dict(sorted(other.items())), 'untaggedSeriesByGroup': dict(sorted(untagged.items())), 'unmappedGroups': dict(unmapped), 'outsideCatalogNotMapped': CM.OUTSIDE_NOT_MAPPED}},
       'countries': countries,
       'ranking': {'doc': 'Tecnico: fuentes candidatas por estado del gate y celdas que tocan (solo cuentan huecos MISSING con confidence=high; el resto son no concluyentes); fuentes integradas por celdas STALE.', 'candidateSources': leverage, 'staleSources': stale_src},
       'matrix': matrix}
(D / 'coverage-gaps.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print('coverage-gaps.json: %d entidades, %d celdas %s; sin mapear=%s' % (len(matrix), cells_total, dict(tot_state), dict(unmapped)))

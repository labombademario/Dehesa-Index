#!/usr/bin/env python3
"""API publica de datos (v1, estatica) -> data/api/v1/

Sale SOLO del paquete descargable (data/pack/), que ya excluye las fuentes cuya licencia no permite el uso comercial. Nada se estima ni se rellena.
  index.json                        catalogo de series (id region/producto), fuente, licencia, atribucion, rango y enlaces
  latest.json                       ultimo valor, anterior y variacion de TODAS las series, en un solo fichero
  series/<region>/<producto>.json   metadatos + puntos [fecha, valor] con todo el historico del paquete
  openapi.json                      descripcion OpenAPI 3.1 de lo anterior
La fecha del fichero es la del paquete (no la hora de ejecucion): sin datos nuevos no cambia nada y no genera commits.
Uso: python3 scripts/build-api.py [--check]"""
import csv, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from api_notes_i18n import translate_note
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'api' / 'v1'
BASE = 'https://dehesaindex.com'
POLICY = {'es': 'Solo fuentes cuyo veredicto comercial es apto o apto con condiciones. Cada serie lleva su fuente, licencia y texto de atribucion: citalo al reutilizar. Sin estimaciones ni relleno de huecos.',
          'en': 'Only sources whose commercial verdict is fit or fit with conditions. Every series carries its source, licence and attribution text: quote it when reusing. No estimates and no gap filling.'}

def jdump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n'

def read_series(f):
    rows = []
    with open(ROOT / f['csv'], encoding='utf-8-sig', newline='') as fh:
        for r in csv.DictReader(fh):
            try: rows.append([r['date'], float(r['value'])])
            except (KeyError, ValueError): continue
    rows.sort(key=lambda p: p[0])
    return rows

def with_translations(note, sid):
    """La nota nace en espanol; se anaden en/fr/it solo si cada frase esta en la tabla de scripts/api_notes_i18n.py (si no, se queda en espanol y se avisa)."""
    out = dict(note)
    if note.get('es'):
        tr, missing = translate_note(note['es'])
        out.update(tr)
        for m in missing: print('AVISO nota sin traducir (%s): %s' % (sid, m[:110]), file=sys.stderr)
    return out

def build():
    pack = json.loads((ROOT / 'data' / 'pack' / 'index.json').read_text(encoding='utf-8'))
    gen = pack['generatedAt']
    files, series_docs, latest = {}, [], []
    notes = {(x['product'], x['region']): x for x in json.loads((ROOT / 'data' / 'app' / 'v1' / 'prices.json').read_text(encoding='utf-8'))['prices']}
    for f in pack['files']:
        pts = read_series(f)
        if not pts: continue
        sid = '%s/%s' % (f['region'], f['product'])
        meta = {'id': sid, 'product': f['product'], 'region': f['region'], 'name': f['name'], 'place': f['place'], 'unit': f['unit'], 'currency': f['currency'], 'frequency': f['frequency'],
                'source': f['source'], 'sourceName': f['sourceName'], 'license': f['license'], 'verdict': f['verdict'], 'attribution': f['attribution']}
        n = notes.get((f['product'], f['region']), {})
        if n.get('note'): meta['note'] = with_translations(n['note'], sid)   # que mide exactamente la serie (mercado, calidad, si es nacional o de un pais)
        if n.get('comparability'): meta['comparability'] = n['comparability']
        last, prev = pts[-1], (pts[-2] if len(pts) > 1 else None)
        chg = round((last[1] / prev[1] - 1) * 100, 2) if prev and prev[1] else None
        entry = dict(meta, first=pts[0][0], last=last[0], rows=len(pts), url='/data/api/v1/series/%s.json' % sid, csv='/' + f['csv'], xlsx='/' + f['xlsx'])
        series_docs.append(entry)
        latest.append({'id': sid, 'date': last[0], 'value': last[1], 'previousDate': prev[0] if prev else None, 'previous': prev[1] if prev else None, 'changePct': chg,
                       'unit': f['unit'], 'currency': f['currency'], 'frequency': f['frequency'], 'sourceName': f['sourceName'], 'attribution': f['attribution']})
        files['series/%s.json' % sid] = jdump(dict(meta, schemaVersion=1, generatedAt=gen, first=pts[0][0], last=last[0], rows=len(pts), points=pts))
    series_docs.sort(key=lambda x: x['id']); latest.sort(key=lambda x: x['id'])
    files['index.json'] = jdump({'schemaVersion': 1, 'name': 'Dehesa Index Data API', 'version': 'v1', 'generatedAt': gen, 'base': BASE, 'policy': POLICY,
        'endpoints': {'index': '/data/api/v1/index.json', 'latest': '/data/api/v1/latest.json', 'series': '/data/api/v1/series/{region}/{product}.json', 'openapi': '/data/api/v1/openapi.json', 'water': '/data/api/v1/water/index.json'},
        'regions': ['us', 'eu', 'uk', 'ca'], 'summary': {'series': len(series_docs), 'rows': sum(s['rows'] for s in series_docs)}, 'terms': BASE + '/condiciones', 'series': series_docs})
    files['latest.json'] = jdump({'schemaVersion': 1, 'generatedAt': gen, 'policy': POLICY, 'series': latest})
    files['openapi.json'] = jdump(openapi(gen))
    return files

def openapi(gen):
    ref = lambda n: {'$ref': '#/components/schemas/' + n}
    ok = lambda d, s: {'200': {'description': d, 'content': {'application/json': {'schema': s}}}}
    param = lambda n, d, enum=None: {'name': n, 'in': 'path', 'required': True, 'description': d, 'schema': dict({'type': 'string'}, **({'enum': enum} if enum else {}))}
    return {'openapi': '3.1.0', 'info': {'title': 'Dehesa Index Data API', 'version': 'v1', 'description': POLICY['en'] + ' Static JSON files: no key, no rate limit beyond the CDN; be reasonable and cache.',
            'license': {'name': 'Per source: see each series', 'url': BASE + '/condiciones'}}, 'servers': [{'url': BASE}],
        'paths': {'/data/api/v1/index.json': {'get': {'operationId': 'listSeries', 'summary': 'Catalogue of series with source, licence and attribution', 'responses': ok('Catalogue', ref('Index'))}},
                  '/data/api/v1/latest.json': {'get': {'operationId': 'latestAll', 'summary': 'Latest value, previous value and change of every series', 'responses': ok('Latest values', ref('Latest'))}},
                  '/data/api/v1/water/index.json': {'get': {'operationId': 'waterCatalogue', 'summary': 'Catalogue of river and drought datasets with source, licence and attribution', 'responses': ok('Water catalogue', {'type': 'object'})}},
                  '/data/api/v1/water/rivers/{country}.json': {'get': {'operationId': 'getRivers', 'summary': 'River stations of one country: latest level and discharge, state, percentile against history and 30 days of daily points', 'parameters': [param('country', 'Country', ['de', 'nl', 'fr', 'be', 'ca', 'us'])], 'responses': ok('River stations', {'type': 'object'})}},
                  '/data/api/v1/water/drought/eu.json': {'get': {'operationId': 'getDroughtEu', 'summary': 'European Drought Observatory Combined Drought Indicator by country: share of the area in each class, last 13 periods', 'responses': ok('Drought by country', {'type': 'object'})}},
                  '/data/api/v1/series/{region}/{product}.json': {'get': {'operationId': 'getSeries', 'summary': 'Full history of one series', 'parameters': [param('region', 'Market', ['us', 'eu', 'uk', 'ca']), param('product', 'Product key from the catalogue, e.g. trigo')], 'responses': dict(ok('Series', ref('Series')), **{'404': {'description': 'No such series'}})}}},
        'components': {'schemas': {
            'SeriesMeta': {'type': 'object', 'required': ['id', 'unit', 'currency', 'frequency', 'sourceName', 'license', 'attribution'], 'properties': {'id': {'type': 'string', 'description': 'region/product'}, 'product': {'type': 'string'}, 'region': {'type': 'string'}, 'name': {'type': 'object', 'additionalProperties': {'type': 'string'}}, 'place': {'type': 'object', 'additionalProperties': {'type': 'string'}}, 'unit': {'type': 'string'}, 'currency': {'type': 'string'}, 'frequency': {'type': 'string'}, 'source': {'type': 'string'}, 'sourceName': {'type': 'string'}, 'license': {'type': 'string'}, 'verdict': {'enum': ['apto', 'condiciones']}, 'attribution': {'type': 'string'}, 'note': {'type': 'object', 'additionalProperties': {'type': 'string'}, 'description': 'What exactly the series measures'}, 'comparability': {'type': 'string'}}},
            'Index': {'type': 'object', 'properties': {'generatedAt': {'type': 'string'}, 'series': {'type': 'array', 'items': ref('SeriesMeta')}}},
            'Latest': {'type': 'object', 'properties': {'generatedAt': {'type': 'string'}, 'series': {'type': 'array', 'items': {'type': 'object', 'properties': {'id': {'type': 'string'}, 'date': {'type': 'string'}, 'value': {'type': 'number'}, 'previousDate': {'type': ['string', 'null']}, 'previous': {'type': ['number', 'null']}, 'changePct': {'type': ['number', 'null']}, 'unit': {'type': 'string'}, 'currency': {'type': 'string'}, 'frequency': {'type': 'string'}, 'sourceName': {'type': 'string'}, 'attribution': {'type': 'string'}}}}}},
            'Series': {'allOf': [ref('SeriesMeta'), {'type': 'object', 'properties': {'first': {'type': 'string'}, 'last': {'type': 'string'}, 'rows': {'type': 'integer'}, 'points': {'type': 'array', 'description': '[date, value] pairs, oldest first. Dates: YYYY-MM, YYYY-MM-DD or YYYY-Qn.', 'items': {'type': 'array', 'prefixItems': [{'type': 'string'}, {'type': 'number'}], 'minItems': 2, 'maxItems': 2}}}}]}}}}

def main():
    check = '--check' in sys.argv
    files = build()
    if check:
        bad = [k for k, v in files.items() if not (OUT / k).exists() or (OUT / k).read_text(encoding='utf-8') != v]
        extra = [str(p.relative_to(OUT)) for p in OUT.rglob('*.json') if str(p.relative_to(OUT)) not in files and not str(p.relative_to(OUT)).startswith('water/')] if OUT.exists() else []
        if bad or extra: print('API DESFASADA (%d ficheros, %d sobrantes): ejecuta scripts/build-api.py' % (len(bad), len(extra))); sys.exit(1)
        print('API al dia: %d ficheros' % len(files)); return
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in files.items():
        p = OUT / k; p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists() or p.read_text(encoding='utf-8') != v: p.write_text(v, encoding='utf-8')
    for p in list(OUT.rglob('*.json')):
        if str(p.relative_to(OUT)) not in files and not str(p.relative_to(OUT)).startswith('water/'): p.unlink()   # (water/ lo gestiona scripts/build-api-water.py) serie que ya no es apta: fuera de la API
    idx = json.loads(files['index.json'])
    print('API v1: %d series, %d filas, %d ficheros' % (idx['summary']['series'], idx['summary']['rows'], len(files)))

main()

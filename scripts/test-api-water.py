#!/usr/bin/env python3
"""Pruebas de scripts/build-api-water.py y scripts/build-source-sheet.py sin red: usan los ficheros del repositorio y variantes sinteticas en memoria."""
import copy, importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
fails = []
def ok(c, m):
    if not c: fails.append(m); print('FALLO:', m)

def mod(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / file); m = importlib.util.module_from_spec(spec); sys.argv = [file]; spec.loader.exec_module(m); return m

w = mod('w', 'build-api-water.py')
files = w.build()
ok('index.json' in files and 'rivers/nl.json' in files and 'drought/eu.json' in files, 'faltan ficheros esperados')
for k, v in files.items():
    d = json.loads(v); ok(d.get('schemaVersion') == 1, 'schemaVersion ' + k)
    if k.startswith('rivers/'):
        ok(d['source'].get('license') and 'attributionRequired' in d['source'], 'licencia/atribucion ' + k)
        ok(all(s['id'] and s['river'] for s in d['stations']), 'estaciones sin id/rio ' + k)
        ok(all(len(s['points']) <= w.KEEP_DAYS for s in d['stations']), 'mas de %d puntos en %s' % (w.KEEP_DAYS, k))
nl = json.loads(files['rivers/nl.json'])
ok(any(s['percentile'] is not None for s in nl['stations']), 'NL sin percentiles')
de = json.loads(files['rivers/de.json'])
ok(all(s['percentile'] is None for s in de['stations']) and all(s['state'] in ('low', 'normal', 'high', None) for s in de['stations']), 'DE: sin percentil y estado valido')
us = json.loads(files['rivers/us.json'])
ok(all(s['discharge']['unit'] == 'm3/s' for s in us['stations']), 'US en m3/s')
# conversion ft3/s -> m3/s
raw = json.loads((ROOT / 'data/us-markets/rivers.json').read_text(encoding='utf-8'))['stations'][0]
ok(abs(us['stations'][0]['discharge']['value'] - raw['lastValue'] * 0.0283168) < 0.01, 'conversion ft3/s')
# change7 y tail
ok(w.change7([['2026-10-19', 1, 100.0], ['2026-10-26', 1, 110.0]], 2) == 10.0, 'change7 +10 %')
ok(w.change7([['2026-10-25', 1, 100.0], ['2026-10-26', 1, 110.0]], 2) is None, 'change7 sin dato exacto de hace 7 dias')
ok(len(w.tail([['2026-%02d-%02d' % (m, d), 1, 1] for m in (8, 9, 10) for d in range(1, 29)])) <= w.KEEP_DAYS, 'tail')
# una fuente no apta desaparece
orig = w.licence
w.licence = lambda reg, sid: (False, {}) if sid == 'rijkswaterstaat' else orig(reg, sid)
f2 = w.build(); ok('rivers/nl.json' not in f2 and 'rivers/de.json' in f2, 'fuente no apta debe salir de la API')
w.licence = orig
# ficha de fuentes
s = mod('s', 'build-source-sheet.py'); doc = s.build()
ok(doc['summary']['sources'] == len(doc['sources']) and doc['summary']['sources'] > 100, 'ficha: numero de fuentes')
ok(all(r['commercial'] in ('apto', 'condiciones', 'no-apto') for r in doc['sources']), 'ficha: veredicto en todas las filas')
ids = {r['id']: r for r in doc['sources']}
ok(ids['rijkswaterstaat']['pipelines'] >= 1 and ids['rijkswaterstaat']['cadenceHours'], 'ficha: rijkswaterstaat con pipeline y cadencia')
ok(ids['rijkswaterstaat']['license']['id'] == 'CC0-1.0', 'ficha: licencia CC0')
print('test-api-water: %d fallos' % len(fails)); sys.exit(1 if fails else 0)

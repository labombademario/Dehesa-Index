#!/usr/bin/env python3
"""Integridad de la capa de datos unificada: el manifiesto y los catalogos cuadran con las series reales, todos los ficheros existen y ninguno supera el limite."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_index import ROOT, STATS
MAX = 600_000  # bytes por fichero de puntos (el generador parte a ~450 KB)
D = ROOT / 'data'; err = []
try: man = json.loads((D / 'catalog/manifest.json').read_text())
except Exception as e: print('sin manifiesto:', e); sys.exit(1)
reg = {}
try:
    for r in json.loads((D / 'series-registry.json').read_text())['series']: reg[(r['country'], r['id'])] = r
except Exception: pass
real = 0
for n in STATS:
    p = D / (n + '.json')
    if p.exists():
        for cc, c in json.loads(p.read_text()).get('countries', {}).items():
            for s in c.get('series', []):
                r = reg.get((cc, s['id']))
                if not r or r.get('preferred', True): real += 1
warn = []
if real != man['seriesTotal']: warn.append('series reales %d != manifiesto %d (se regenera cada 3 h con build-data-catalog.py)' % (real, man['seriesTotal']))
tot = 0
for cc, c in man['countries'].items():
    cat = json.loads((D / c['catalog']).read_text()); tot += len(cat['series'])
    if len(cat['series']) != c['n']: err.append('%s: catalogo %d != manifiesto %d' % (cc, len(cat['series']), c['n']))
    ids = [s['id'] for s in cat['series']]
    if len(ids) != len(set(ids)): err.append('%s: ids repetidos en el catalogo' % cc)
    for g, m in c['metrics'].items():
        for f in m['files']:
            p = D / f
            if not p.exists(): err.append('falta ' + f); continue
            if p.stat().st_size > MAX: err.append('%s pesa %d KB (> %d KB)' % (f, p.stat().st_size // 1024, MAX // 1024))
    for s in cat['series']:
        if not (D / s['file']).exists(): err.append('%s/%s apunta a fichero inexistente %s' % (cc, s['id'], s['file']))
if tot != man['seriesTotal']: err.append('suma de catalogos %d != seriesTotal %d' % (tot, man['seriesTotal']))
if warn: print('AVISO:', '; '.join(warn))
if err: print('\n'.join(err[:30])); sys.exit(1)
print('Catalogo OK: %d series, %d paises' % (tot, len(man['countries'])))

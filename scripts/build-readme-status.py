#!/usr/bin/env python3
"""Bloque de cifras del README generado desde los ficheros del repo (sin editar numeros a mano).

Solo cifras ESTRUCTURALES (workflows, scripts, esquemas, registro de licencias, catalogo): cambian cuando cambia el codigo,
no cada dia. El estado vivo de los pipelines (OK/error/atrasado) NO va aqui: lo publica status.html desde data/pipeline-status.json.
Uso: python3 scripts/build-readme-status.py [--check]
"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
A, B = '<!-- status:start (generado por scripts/build-readme-status.py; no editar) -->', '<!-- status:end -->'

def block():
    wf = list((ROOT / '.github/workflows').glob('*.yml'))
    upd = [w for w in wf if w.name.startswith('update-')]
    scripts = list((ROOT / 'scripts').glob('update-*'))
    schemas = list((ROOT / 'schemas').glob('*.json'))
    lic = json.load(open(ROOT / 'data/license-registry.json'))
    man = json.load(open(ROOT / 'data/catalog/manifest.json'))
    ent = man['entities']
    series = (man['seriesTotal'] // 500) * 500
    pipes = len(json.load(open(ROOT / 'data/pipeline-status.json'))['pipelines'])
    L = [A,
         '- %d data pipelines (`update-*.yml`, %d source scripts `scripts/update-*`) plus %d workflows in total in `.github/workflows/`; the pipeline-status report tracks %d of them.' % (len(upd), len(scripts), len(wf), pipes),
         '- %d JSON schemas in `schemas/`; licence registry: %d sources, %d data files.' % (len(schemas), len(lic['sources']), len(lic['files'])),
         '- Catalogue: %d entities (%d countries, %d aggregates, %d regions) and more than %d series.' % (ent['total'], ent['country'], ent['aggregate'], ent['region'], series),
         '- Live pipeline state (OK, late, error, not run) and coverage gaps are not copied here: see [`status.html`](https://dehesaindex.com/status.html), built from `data/pipeline-status.json` and `data/coverage-gaps.json`.',
         B]
    return '\n'.join(L)

def main():
    p = ROOT / 'README.md'
    t = p.read_text(encoding='utf-8')
    b = block()
    if A in t:
        n = re.sub(re.escape(A) + r'.*?' + re.escape(B), lambda m: b, t, flags=re.S)
    else:
        old = re.search(r'^- `scripts/update-\*\.py\|js`.*\n', t, re.M)
        if not old: sys.exit('README: no encuentro la linea de scripts')
        n = t.replace(old.group(0), '- `scripts/update-*.py|js` fetch and normalise one source each and write to `data/`; most workflows are generated from `sources.yml`. Figures:\n' + b + '\n')
    if '--check' in sys.argv:
        if n != t: sys.exit('README desactualizado: ejecuta python3 scripts/build-readme-status.py')
        print('README status OK'); return
    p.write_text(n, encoding='utf-8'); print('README status escrito' if n != t else 'sin cambios')
main()

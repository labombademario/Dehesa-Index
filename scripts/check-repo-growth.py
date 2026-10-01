#!/usr/bin/env python3
"""Presupuesto de crecimiento del repositorio (scripts/repo-budget.json).
Falla si un fichero versionado supera maxFileMB, si data/ supera maxDataTreeMB o si el pack supera maxPackMB.
Con --report imprime el desglose (mayores ficheros, tamano por directorio, versiones acumuladas por fichero) sin fallar."""
import json, subprocess, sys, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = json.load(open(os.path.join(ROOT, 'scripts/repo-budget.json')))
def sh(c): return subprocess.run(c, shell=True, cwd=ROOT, capture_output=True, text=True).stdout
files = [f for f in sh('git ls-files').split('\n') if f and os.path.isfile(os.path.join(ROOT, f))]
sizes = {f: os.path.getsize(os.path.join(ROOT, f)) for f in files}
MB = 1048576.0
data_total = sum(s for f, s in sizes.items() if f.startswith('data/'))
fails, warns = [], []
for f, s in sorted(sizes.items(), key=lambda x: -x[1]):
    if s > B['maxFileMB'] * MB: fails.append('%s: %.1f MB > %d MB' % (f, s / MB, B['maxFileMB']))
    elif s > B['warnFileMB'] * MB: warns.append('%s: %.1f MB (aviso > %d MB)%s' % (f, s / MB, B['warnFileMB'], ' - ' + B['knownLarge'][f] if f in B.get('knownLarge', {}) else ''))
if data_total > B['maxDataTreeMB'] * MB: fails.append('data/: %.0f MB > %d MB' % (data_total / MB, B['maxDataTreeMB']))
elif data_total > B['warnDataTreeMB'] * MB: warns.append('data/: %.0f MB (aviso > %d MB)' % (data_total / MB, B['warnDataTreeMB']))
pack = 0.0
for l in sh('git count-objects -v').split('\n'):
    if l.startswith('size-pack:') or l.startswith('size:'): pack += float(l.split(':')[1]) / 1024.0
if pack > B['maxPackMB']: fails.append('historial git (pack+sueltos): %.0f MB > %d MB' % (pack, B['maxPackMB']))
elif pack > B['warnPackMB']: warns.append('historial git: %.0f MB (aviso > %d MB)' % (pack, B['warnPackMB']))
print('Repo: %d ficheros versionados, data/ %.1f MB, historial git ~%.0f MB' % (len(files), data_total / MB, pack))
if '--report' in sys.argv:
    d = collections.Counter()
    for f, s in sizes.items(): d['/'.join(f.split('/')[:2]) if f.startswith('data/') else f.split('/')[0]] += s
    print('\nPor directorio (MB):'); [print('  %8.1f %s' % (v / MB, k)) for k, v in d.most_common(12)]
    print('\nMayores ficheros:'); [print('  %8.2f MB %s' % (s / MB, f)) for f, s in sorted(sizes.items(), key=lambda x: -x[1])[:12]]
for w in warns: print('AVISO ' + w)
for x in fails: print('FALLO ' + x)
sys.exit(1 if fails else 0)

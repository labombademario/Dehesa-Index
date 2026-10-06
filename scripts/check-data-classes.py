#!/usr/bin/env python3
"""Clasificacion de los ficheros de datos grandes (>= 500 KB) por uso real: RUNTIME (lo descarga el navegador), BUILD_ONLY (solo lo leen scripts/workflows),
DERIVED (se regenera a partir de otros datos y lo leen otros constructores) y ARCHIVE (historico/instantaneas). La declaracion esta en scripts/data-file-classes.json
y se COMPRUEBA contra los consumidores reales (js/, html, sw.js, scripts/, workflows): un fichero declarado no-RUNTIME no puede referenciarse desde el navegador
(los comentarios no cuentan) y uno RUNTIME debe tener al menos un consumidor en el navegador. Todo fichero >= 500 KB de data/ debe estar declarado (o cubierto por un prefijo).
No borra nada: informa. Uso: python3 scripts/check-data-classes.py [--report]"""
import json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; MIN = 500000
CLS = json.loads((ROOT / 'scripts' / 'data-file-classes.json').read_text(encoding='utf-8'))
def sh(c): return subprocess.run(c, shell=True, cwd=ROOT, capture_output=True, text=True).stdout
files = [f for f in sh('git ls-files data').split('\n') if f]
big = {f: (ROOT / f).stat().st_size for f in files if (ROOT / f).exists() and (ROOT / f).stat().st_size >= MIN}
def strip_js(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S); return re.sub(r'(^|[^:\'"])//[^\n]*', r'\1', s)
runtime_src = {}
for p in list((ROOT / 'js').glob('*.js')) + list(ROOT.glob('*.html')) + [ROOT / 'sw.js']:
    if p.exists(): runtime_src[p.relative_to(ROOT).as_posix()] = strip_js(p.read_text(encoding='utf-8', errors='ignore')) if p.suffix == '.js' else p.read_text(encoding='utf-8', errors='ignore')
other = {}
for p in list((ROOT / 'scripts').glob('*.py')) + list((ROOT / 'scripts').glob('*.mjs')) + list((ROOT / '.github').rglob('*.yml')):
    other[p.relative_to(ROOT).as_posix()] = p.read_text(encoding='utf-8', errors='ignore')
def consumers(f):
    name = f[len('data/'):]
    rx = re.compile(r'(?<![\w/.-])(?:data/)?' + re.escape(name) + r'(?![\w])') if '/' in name else re.compile(r'(?<![\w/.-])(?:data/)?' + re.escape(name) + r'(?![\w])')
    rt = sorted(k for k, v in runtime_src.items() if ('data/' + name) in v)
    bd = sorted(k for k, v in other.items() if rx.search(v))
    return rt, bd
def decl(f):
    if f in CLS['files']: return CLS['files'][f]
    for pre, v in CLS['prefixes'].items():
        if f.startswith(pre): return v
    return None
errs, rows = [], []
if '--probe' in sys.argv:
    for f, sz in sorted(big.items(), key=lambda x: -x[1]):
        rt, bd = consumers(f); print('%6.2fMB %-42s rt=%s bd=%d' % (sz / 1048576, f, rt[:4], len(bd)))
    sys.exit(0)
for f, sz in sorted(big.items(), key=lambda x: -x[1]):
    d = decl(f); rt, bd = consumers(f)
    if not d: errs.append('%s (%.1f MB): fichero grande sin clasificar en scripts/data-file-classes.json' % (f, sz / 1048576)); continue
    if d['class'] not in CLS['classes']: errs.append('%s: clase %r desconocida' % (f, d['class'])); continue
    if d['class'] == 'RUNTIME' and not rt:   # ruta construida en el navegador: el fichero declarado en 'via' debe contener el patron
        v = d.get('via')
        if not v or v['file'] not in runtime_src or v['pattern'] not in runtime_src[v['file']]: errs.append('%s: declarado RUNTIME pero ningun js/html/sw lo descarga (y falta un "via" comprobable)' % f)
        else: rt = [v['file']]
    if d['class'] != 'RUNTIME' and rt: errs.append('%s: declarado %s pero lo descarga el navegador (%s)' % (f, d['class'], ', '.join(rt)))
    if not d.get('note'): errs.append('%s: falta nota' % f)
    rows.append((f, sz, d['class'], rt, bd, d.get('note', '')))
for f in list(CLS['files']):
    if f not in big: errs.append('%s: declarado en data-file-classes.json pero ya no supera 500 KB o no existe: quitarlo' % f)
if '--report' in sys.argv:
    for f, sz, c, rt, bd, n in rows: print('%-9s %6.2f MB  %-42s navegador:%d scripts/workflows:%d' % (c, sz / 1048576, f, len(rt), len(bd)))
for e in errs: print('ERROR', e)
print('Ficheros grandes: %d clasificados, %d errores' % (len(rows), len(errs))); sys.exit(1 if errs else 0)

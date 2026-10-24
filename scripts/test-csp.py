#!/usr/bin/env python3
"""_headers: la CSP y HSTS estan, y los scripts EN LINEA de las paginas (los unicos que la CSP deja pasar por hash) coinciden con los hashes de la CSP.
Si se edita el script en linea de index.html u offline.html, hay que actualizar el hash en _headers (la salida de este test lo da)."""
import base64, glob, hashlib, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
txt = (ROOT / '_headers').read_text(encoding='utf-8')
blk = re.search(r'^/\*\n((?:[ \t]+.*\n?)+)', txt, re.M)
bad = []
ALL = [f for f in glob.glob(str(ROOT / '**' / '*.html'), recursive=True) if '/node_modules/' not in f and '/.git/' not in f]
if not blk: sys.exit('_headers: no hay bloque /*')
h = {}
for l in blk.group(1).splitlines():
    if ':' in l: k, v = l.strip().split(':', 1); h[k.strip().lower()] = v.strip()
csp = h.get('content-security-policy', '')
if not csp: bad.append('falta Content-Security-Policy en /*')
if 'strict-transport-security' not in h or 'max-age=' not in h['strict-transport-security']: bad.append('falta Strict-Transport-Security en /*')
if 'frame-ancestors' in csp: bad.append('la CSP global no debe llevar frame-ancestors (rompe /embed, que lo abre con su propia CSP)')
if "'unsafe-eval'" in csp: bad.append("la CSP no debe permitir 'unsafe-eval'")
if 'script-src-attr' in csp: bad.append("la CSP no debe llevar script-src-attr: los manejadores en linea (onclick=...) estan prohibidos; usa data-di-act (js/shared.js)")
# ningun manejador en linea en las paginas ni en el HTML que genera el JavaScript
for f in sorted(ALL + glob.glob(str(ROOT / 'js' / '*.js')) + glob.glob(str(ROOT / 'data' / '*.js'))):
    s = Path(f).read_text(encoding='utf-8')
    if f.endswith('.html'): s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
    for mm in re.finditer(r'<[a-zA-Z][^<>]*?\son[a-z]{3,}\s*=\s*\\?["\']', s):
        bad.append('%s: manejador en linea %r (la CSP lo bloquea; usa data-di-act en js/shared.js)' % (Path(f).name, mm.group(0)[:80]))
m = re.search(r"script-src ([^;]*)", csp); allowed = set(re.findall(r"'(sha256-[^']+)'", m.group(1))) if m else set()
used = {}
# 24-oct-2026: tambien las paginas generadas (datos/, regiones/, precios/, en|fr|it/, data/): antes solo se miraba la raiz y
# 2.566 landings llevaban un <script> en linea que la CSP bloqueaba (sin menu ni pie en produccion).
for f in sorted(ALL):
    if Path(f).parent != ROOT:
        s = Path(f).read_text(encoding='utf-8', errors='ignore')
        for mm in re.finditer(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', s, re.S):
            if 'ld+json' in mm.group(1) or 'speculationrules' in mm.group(1) or not mm.group(2).strip(): continue
            bad.append('%s: script en linea (la CSP lo bloquea; usa js/boot.js con data-*)' % Path(f).relative_to(ROOT))
            break
for f in sorted(glob.glob(str(ROOT / '*.html'))):
    s = Path(f).read_text(encoding='utf-8')
    for mm in re.finditer(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', s, re.S):
        if 'ld+json' in mm.group(1) or 'type="speculationrules"' in mm.group(1): continue
        d = 'sha256-' + base64.b64encode(hashlib.sha256(mm.group(2).encode('utf-8')).digest()).decode()
        used[d] = Path(f).name
        if d not in allowed: bad.append('%s: script en linea con hash %s que la CSP no permite (anadelo a script-src en _headers o saca el script a un .js)' % (Path(f).name, d))
for d in allowed - set(used): bad.append('la CSP lista un hash que ya no usa ninguna pagina: %s (quitalo)' % d)
if bad: print('\n'.join(bad)); sys.exit(1)
print('OK test-csp: %d scripts en linea permitidos por hash' % len(used))

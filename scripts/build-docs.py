#!/usr/bin/env python3
"""Genera DATA_SOURCES.md a partir de data/license-registry.json (fuente de verdad de licencias) y data/catalog/manifest.json (series por fuente).
Uso: python3 scripts/build-docs.py [--check]   (--check falla si el fichero esta desactualizado; lo ejecuta Dehesa Quality)."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
reg = json.loads((ROOT / 'data/license-registry.json').read_text())
man = json.loads((ROOT / 'data/catalog/manifest.json').read_text())
ns = {k: v.get('series', 0) for k, v in man['provenance']['sources'].items()}
S = reg['sources']
ORDER = ['VERIFIED', 'PENDING', 'RESTRICTED', 'BLOCKED']
def row(k, s):
    flag = lambda v: {'yes': 'si', 'no': 'no'}.get(v, v or '?')
    note = (s.get('additionalRestrictions') or '').replace('|', '/').replace('\n', ' ')
    return '| `%s` | %s | %s | %s | %s/%s | %s | %d | %s |' % (k, (s['name'] or '').replace('|', '/'), s.get('country') or '', s.get('licenseId') or '', flag(s.get('commercialUse')), flag(s.get('derivatives')), 'si' if s.get('attributionRequired') else 'no', ns.get(k, 0), (note[:140] + ('…' if len(note) > 140 else '')))
L = ['# Fuentes de datos y licencias', '',
     '> Generado por `scripts/build-docs.py` desde `data/license-registry.json` (fuente de verdad). No editar a mano; `Dehesa Quality` falla si esta desactualizado.', '',
     'Regla: **no se asume ninguna licencia**. `PENDING` significa que la licencia es poco clara o no verificable: la fuente solo se sigue usando si ya estaba, y se muestra como pendiente. `RESTRICTED` y `BLOCKED` no se usan. El gate de CI (`scripts/check-licenses.py`) lo hace cumplir.', '']
cnt = {o: sum(1 for s in S.values() if s['status'] == o) for o in ORDER}
L += ['Resumen: ' + ', '.join('%d %s' % (cnt[o], o) for o in ORDER) + '; %d series en el catalogo unificado.' % man['seriesTotal'], '']
for o in ORDER:
    items = sorted((k, s) for k, s in S.items() if s['status'] == o)
    if not items: continue
    L += ['## %s (%d)' % (o, len(items)), '', reg['policy']['statuses'][o] + '.', '', '| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |', '|---|---|---|---|---|---|---|---|']
    L += [row(k, s) for k, s in items] + ['']
L += ['## Como anadir una fuente', '', '1. Leer los terminos y anotar la evidencia en `data/license-registry.json` (`status`, `licenseId`, `attributionText`, `evidence`, `verifiedAt`).', '2. Si no se puede verificar: `PENDING`, nunca `VERIFIED`.', '3. Anadir el workflow en `sources.yml` (se genera con `scripts/gen-workflows.py`) y el contrato en `schemas/registry.json`.', '4. `python3 scripts/check-licenses.py` y `python3 scripts/validate-data.py --all` deben pasar.', '']
out = '\n'.join(L)
f = ROOT / 'DATA_SOURCES.md'
if '--check' in sys.argv:
    if not f.exists() or f.read_text() != out: print('DATA_SOURCES.md desactualizado: python3 scripts/build-docs.py'); sys.exit(1)
    print('DATA_SOURCES.md OK'); sys.exit(0)
f.write_text(out); print('DATA_SOURCES.md generado (%d fuentes)' % len(S))

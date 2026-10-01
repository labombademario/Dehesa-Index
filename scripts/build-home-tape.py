#!/usr/bin/env python3
"""data/home-tape.json — las 8 filas del panel de la portada (trigo, maiz y leche; UE, EEUU y Canada), copiadas TAL CUAL de data/prices/latest/*.json.

Existe para que la portada no tenga que descargar los ficheros completos de precios (cientos de KB) solo para pintar 8 cifras.
No calcula ni convierte nada: valor, moneda, unidad, fecha y variacion son los de la observacion original. Si falta una fila, no se inventa: se omite."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
ROWS = [('trigo', 'eu'), ('trigo', 'us'), ('trigo', 'ca'), ('maiz', 'eu'), ('maiz', 'us'), ('maiz', 'ca'), ('leche', 'eu'), ('leche', 'us')]
KEEP = ['id', 'product', 'region', 'sourceId', 'observationDate', 'value', 'currency', 'unit', 'changePct']
def main():
    by = {}; src = set()
    for reg in sorted({r for _, r in ROWS}):
        p = D / 'prices' / 'latest' / (reg + '.json')
        if not p.exists(): continue
        for o in json.loads(p.read_text()).get('observations', []): by[(o['product'], o['region'])] = o
    rows = []
    for k in ROWS:
        o = by.get(k)
        if not o or not isinstance(o.get('value'), (int, float)): continue
        rows.append({f: o.get(f) for f in KEEP}); src.add(o['sourceId'])
    if not rows: print('home-tape: sin observaciones; no se genera'); return 1
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'sourceIds': sorted(src), 'rows': rows}
    (D / 'home-tape.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print('home-tape:', len(rows), 'filas')
    return 0
if __name__ == '__main__': sys.exit(main())

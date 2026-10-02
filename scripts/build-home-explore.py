#!/usr/bin/env python3
"""data/home-explore.json — una cifra viva por tarjeta de "Explora los datos" de la portada, copiada TAL CUAL de ficheros ya publicados.

Existe para que la portada no tenga que descargar ficheros grandes (sequia, Cattle on Feed, exportaciones) solo para pintar 4 cifras.
No estima ni convierte nada: cada hecho trae el fichero de origen y su fecha; el contrato (contract_tests.home_explore) lo recalcula desde el origen.
Si falta un origen, ese hecho se omite (no se inventa)."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
def load(rel):
    try: return json.loads((D / rel).read_text())
    except Exception: return None
def facts():
    out = []
    e = load('eu/index.json')
    if e and e.get('families'):
        out.append({'id': 'eu', 'file': 'eu/index.json', 'date': max(f.get('latest') or '' for f in e['families']) or None,
                    'series': sum(f['series'] for f in e['families']), 'families': len(e['families'])})
    d = load('drought.json')
    row = (d or {}).get('us', {}).get('conus', [None])[-1] if d else None
    if row and len(row) >= 3 and isinstance(row[2], (int, float)):
        out.append({'id': 'drought', 'file': 'drought.json', 'date': row[0], 'pctD1': row[2]})
    c = load('cattle-on-feed.json')
    if c and c.get('reports'):
        r = c['reports'][-1]; n = r.get('national') or {}
        cur = (n.get('current') or {}).get('onFeedEnd'); pct = (n.get('pctYearAgo') or {}).get('onFeedEnd')
        if isinstance(cur, (int, float)) and isinstance(pct, (int, float)):
            out.append({'id': 'cattle', 'file': 'cattle-on-feed.json', 'date': r['inventoryDate'], 'release': r['release'], 'onFeedKhead': cur, 'pctYearAgo': pct})
    x = load('export-sales.json')
    if x:
        w = next((k for k in x.get('commodities', []) if k.get('name') == 'All Wheat'), None)
        if w and isinstance((w.get('totals') or {}).get('net'), (int, float)):
            out.append({'id': 'exports', 'file': 'export-sales.json', 'date': w['weekEnding'], 'commodity': 'All Wheat', 'unit': w.get('unit'), 'netSales': w['totals']['net']})
    return out
def main():
    f = facts()
    if not f: print('home-explore: sin hechos; no se genera'); return 1
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'facts': f}
    p = D / 'home-explore.json'
    if p.exists():  # no reescribir si solo cambia la hora (evita commits vacios)
        try:
            old = json.loads(p.read_text())
            if old.get('facts') == f: print('home-explore: sin cambios'); return 0
        except Exception: pass
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print('home-explore:', len(f), 'hechos')
    return 0
if __name__ == '__main__': sys.exit(main())

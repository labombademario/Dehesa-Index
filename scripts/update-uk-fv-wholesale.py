#!/usr/bin/env python3
"""Inglaterra y Gales: precios mayoristas de fruta, hortaliza y flor cortada de produccion local (Defra, "Wholesale fruit and vegetable prices";
mercados de Birmingham, Bristol, Manchester y Londres; Open Government Licence v3.0) -> data/uk-fv-stats.json
Usa el CSV oficial "machine-readable" (desde 2017; quincenal desde dic. 2024, antes semanal), localizado en la pagina de gov.uk. Libras por kg, por unidad,
por manojo o por tallo segun el producto, tal como los publica Defra. Solo se publican las series con dato en los ultimos 18 meses."""
import csv, datetime, io, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_ukstats import get, series, write
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.gov.uk/government/statistics/wholesale-fruit-and-vegetable-prices'
UNIT = {'kg': 'GBP/kg', 'head': 'GBP/head', 'unit': 'GBP/unit', 'stem': 'GBP/stem', 'twin': 'GBP/twin pack', 'bunch': 'GBP/bunch'}
LOG = []
def log(*a): s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def nice(s): return s.replace('_', ' ').strip().capitalize()
def main():
    page = get(PAGE).decode('utf-8', 'replace')
    m = re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s<>]+?\.csv', page)
    if not m: raise SystemExit('no se encontro el CSV en la pagina de gov.uk')
    url = m[0]; log('CSV', url)
    rows = list(csv.DictReader(io.StringIO(get(url).decode('utf-8-sig', 'replace'))))
    if len(rows) < 5000: raise SystemExit('CSV demasiado corto (%d filas)' % len(rows))
    acc = {}
    for r in rows:
        try: v = float(r['price'])
        except (ValueError, KeyError): continue
        k = (r['category'], r['item'], r['variety'], r['unit']); acc.setdefault(k, {})[r['date']] = v
    last = max(max(d) for d in acc.values()); cut = (datetime.date.fromisoformat(last) - datetime.timedelta(days=548)).isoformat()
    out = []
    for (cat, item, var, unit), pts in sorted(acc.items()):
        if max(pts) < cut or len(pts) < 10: continue
        sid = 'uk-fv-' + re.sub(r'[^a-z0-9]+', '-', '%s-%s' % (item, var)).strip('-')
        lab = '%s, %s: wholesale price, England and Wales (Defra, %s)' % (nice(item), 'all varieties' if var in ('all', 'all_varieties') else nice(var).lower(), {'fruit': 'home-grown fruit', 'vegetable': 'home-grown vegetables', 'cut_flowers': 'cut flowers', 'pot_plants': 'pot plants'}.get(cat, cat))
        out.append(series(sid, 'prices_fv', lab, UNIT.get(unit, 'GBP/' + unit), 'weekly', [[d, v] for d, v in pts.items()], 'Defra'))
    if len(out) < 40: raise SystemExit('muy pocas series vivas (%d)' % len(out))
    log('series', len(out), 'ultimo dato', last)
    write(ROOT / 'data/uk-fv-stats.json', {'name': 'Defra, Wholesale fruit and vegetable prices (England and Wales)', 'url': PAGE, 'license': 'Open Government Licence v3.0'}, out, LOG)
    (ROOT / 'data/uk-fv-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

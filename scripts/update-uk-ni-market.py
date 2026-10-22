#!/usr/bin/env python3
"""Irlanda del Norte: precios semanales de ganado de abasto del "Agricultural Market Report" de DAERA (estadistica oficial acreditada;
informacion del sitio bajo Open Government Licence) -> data/uk-ni-market-stats.json
Cada ano tiene su pagina (publications/agricultural-market-reports-AAAA) con un Excel por trimestre y una hoja por semana. De cada semana se toma
el precio medio en canal (peniques por kg, "All Grades") y el numero de animales de añojos (steers), novillas, toros jovenes y vacas, el precio de la
canal R3 de añojo y el precio del cordero. Se leen los anos FROM..actual; si DAERA cambia el formato de un ano, ese ano se salta y queda en el log."""
import datetime, io, re, sys, html
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_ukstats import get, series, write
import openpyxl
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.daera-ni.gov.uk/publications/agricultural-market-reports-%d'
FROM = 2022
LOG = []
def log(*a): s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def num(v):
    try: return float(v)
    except (TypeError, ValueError): return None
def iso(v):
    if isinstance(v, datetime.datetime): return v.date().isoformat()
    if isinstance(v, datetime.date): return v.isoformat()
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', str(v or '')); return m.group(0) if m else None
def sheet(ws, acc):
    rows = [list(r) for r in ws.iter_rows(min_row=1, max_row=60, values_only=True)]
    wk = None
    for r in rows:
        if r and isinstance(r[0], str) and r[0].strip().lower().startswith('week ending'):
            wk = next((iso(c) for c in r[1:] if iso(c)), None); break
    if not wk: return False
    blk = None
    for r in rows:
        r = (r + [None] * 18)[:18]
        for off in (0, 8):
            lab = r[off].strip() if isinstance(r[off], str) else r[off]
            if lab in ('Steers', 'Heifers', 'Young Bulls', 'Cows'): blk = blk or {}; blk[off] = lab; continue
            if blk and off in blk and lab in ('All Grades', 'R3'):
                k = blk[off]; p, n = num(r[off + 2]), num(r[off + 1])
                if p is not None: acc.setdefault((k, lab, 'p'), {})[wk] = p
                if n is not None and lab == 'All Grades': acc.setdefault((k, lab, 'n'), {})[wk] = n
            if lab == 'Lambs' and off == 8:
                p, n = num(r[10]), num(r[9])
                if p is not None: acc.setdefault(('Lambs', 'All', 'p'), {})[wk] = round(p, 2)
                if n is not None: acc.setdefault(('Lambs', 'All', 'n'), {})[wk] = n
    return True
def main():
    acc, ok = {}, 0
    for y in range(FROM, datetime.date.today().year + 1):
        try: t = html.unescape(get(BASE % y).decode('utf-8', 'replace'))
        except SystemExit as e: log('ano', y, 'sin pagina:', e); continue
        files = sorted(set(u for u in re.findall(r'href="([^"]+\.xlsx)"', t) if re.search(r'(?i)quarter\s*\d|quarter%20\d', u) and 'QRM' not in u))
        for u in files:
            u = u if u.startswith('http') else 'https://www.daera-ni.gov.uk' + u
            try: wb = openpyxl.load_workbook(io.BytesIO(get(u)), read_only=True, data_only=True)
            except Exception as e: log('fallo', u, e); continue
            n = sum(1 for name in wb.sheetnames if name.startswith('No.') and sheet(wb[name], acc)); ok += n
            log(y, u.rsplit('/', 1)[-1], 'semanas', n)
    if ok < 30 or ('Steers', 'All Grades', 'p') not in acc: raise SystemExit('muy pocas semanas leidas (%d)' % ok)
    NAME = {'Steers': 'Steers', 'Heifers': 'Heifers', 'Young Bulls': 'Young bulls', 'Cows': 'Cows', 'Lambs': 'Lambs'}
    out = []
    for (k, g, w), pts in sorted(acc.items()):
        if len(pts) < 10: continue
        slug = re.sub(r'[^a-z0-9]+', '-', ('%s-%s' % (k, g)).lower()).strip('-')
        if w == 'p': out.append(series('uk-ni-%s-price' % slug, 'prices_lv', '%s (%s): average deadweight price, Northern Ireland (DAERA, weekly)' % (NAME[k], 'all grades' if g in ('All Grades', 'All') else 'grade ' + g), 'pence/kg dw', 'weekly', [[d, v] for d, v in pts.items()], 'DAERA'))
        else: out.append(series('uk-ni-%s-head' % slug, 'production', '%s: animals priced, Northern Ireland (DAERA, weekly)' % NAME[k], 'head', 'weekly', [[d, v] for d, v in pts.items()], 'DAERA'))
    log('series', len(out), 'semanas', ok)
    write(ROOT / 'data/uk-ni-market-stats.json', {'name': 'DAERA, Northern Ireland Agricultural Market Report (weekly)', 'url': 'https://www.daera-ni.gov.uk/articles/agricultural-market-reports', 'license': 'Open Government Licence v3.0 (DAERA website)'}, out, LOG)
    (ROOT / 'data/uk-ni-market-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

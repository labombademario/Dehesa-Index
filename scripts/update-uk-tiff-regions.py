#!/usr/bin/env python3
"""Renta agraria (Total Income from Farming) y cuentas de produccion de las regiones de Inglaterra (Defra, "Total income from farming for the regions
of England"; Open Government Licence v3.0) -> data/uk-tiff-regions.json
  itl1 : las 9 regiones ITL1 (TLC..TLK; Londres y Sudeste juntos, TLIJ) con todas las partidas de la cuenta (millones de libras, precios corrientes) y,
         aparte, las partidas por hectarea de superficie agraria (libras/ha)
  itl3 : los 133 territorios ITL3 (condados y autoridades unitarias) con las 6 partidas que publica Defra (produccion agricola y ganadera, produccion total,
         consumos intermedios, valor anadido bruto y renta agraria)
Defra reparte la cuenta regional entre territorios; son estimaciones oficiales, no se recalculan. Si falta un fichero, no se toca el JSON."""
import datetime, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_ods import read_ods
from lib_ukstats import get
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.gov.uk/government/statistics/total-income-from-farming-for-the-regions-of-england'
LOG = []
def log(*a): s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def yr(c):
    m = re.match(r'^(\d{4})', str(int(c)) if isinstance(c, float) else str(c or '')); return m.group(1) if m else None
def r1(v): return round(v, 2) if isinstance(v, float) else None
def tables(rows):
    """Recorre una hoja con una o varias tablas: titulo 'Nombre - CODIGO', fila de cabecera con anos, filas de partidas hasta una fila vacia."""
    out, title, cols = [], None, None
    for r in rows:
        if not r or not any(c is not None for c in r): cols = None; continue
        c0 = str(r[0]).strip() if r[0] is not None else ''
        ys = [(j, yr(c)) for j, c in enumerate(r) if j and yr(c)]
        if len(ys) >= 5 and c0.lower() in ('type', 'account item'): cols = ys; out.append([title, {}]); continue
        if cols is None:
            m = re.match(r'^(.+?)\s+-\s+(TL[A-Z]{1,2}(?:[ _]?\d+)?)', c0)
            if m: title = (m.group(1).strip(), m.group(2).replace(' ', '_'))
            continue
        out[-1][1][re.sub(r'\s*\[[^\]]*\]', '', c0).strip()] = [r1(r[j]) if j < len(r) else None for j, _ in cols]
        out[-1].append([y for _, y in cols]) if len(out[-1]) == 2 else None
    return out
def main():
    page = get(PAGE).decode('utf-8', 'replace')
    L = sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s<>]+?\.ods', page)))
    pick = lambda rx: next((u for u in L if re.search(rx, u)), None)
    u1, u3, uh = pick(r'ITL1_Regional_Accounts_Current'), pick(r'ITL3_Regional_Accounts_Current'), pick(r'ITL1_Regional_Accounts_Per_Ha')
    if not (u1 and u3): raise SystemExit('no se encontraron los ODS ITL1/ITL3 en la pagina')
    log('ITL1', u1); log('ITL3', u3); log('per ha', uh)
    itl1, years = {}, None
    for name, rows in read_ods(get(u1), max_cols=40).items():
        for t in tables(rows):
            if t[0] and len(t) > 2: itl1[t[0][1]] = {'n': t[0][0], 'items': t[1]}; years = t[2]
    if uh:
        for name, rows in read_ods(get(uh), max_cols=40).items():
            for t in tables(rows):
                if t[0] and t[0][1] in itl1: itl1[t[0][1]]['perHa'] = t[1]
    itl3 = {}
    for name, rows in read_ods(get(u3), max_cols=40).items():
        for t in tables(rows):
            if t[0] and re.match(r'TL[A-Z]+_?\d+', t[0][1]): itl3[t[0][1]] = {'n': t[0][0], 'r': re.match(r'TL[A-Z]+', t[0][1]).group(0)[:3], 'items': t[1]}
            elif t[0]: log('tabla no ITL3 en', name, t[0])
        log('hoja', name, sum(1 for t in tables(rows) if t[0]))
    if len(itl1) < 8 or len(itl3) < 100 or not years: raise SystemExit('estructura inesperada: %d ITL1, %d ITL3, anos %s' % (len(itl1), len(itl3), years))
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'scope': 'England', 'unit': 'GBP million, current prices (perHa: GBP per hectare)',
           'source': {'name': 'Defra, Total income from farming for the regions of England', 'url': PAGE, 'license': 'Open Government Licence v3.0'}, 'years': years, 'itl1': itl1, 'itl3': itl3}
    p = ROOT / 'data' / 'uk-tiff-regions.json'
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
        if o == n: log('sin cambios')
        else: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    except Exception: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('ITL1 codigos', sorted(itl1)); log('ITL3 por region', {r: sum(1 for v in itl3.values() if v['r'] == r) for r in sorted(set(v['r'] for v in itl3.values()))})
    log('partidas ITL1', list(next(iter(itl1.values()))['items'])[:60]); log('partidas ITL3', list(next(iter(itl3.values()))['items']))
    log('anos', years[0], '-', years[-1], '| ITL1', len(itl1), '| ITL3', len(itl3))
    (ROOT / 'data' / 'uk-tiff-regions-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

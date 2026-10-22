#!/usr/bin/env python3
"""Estructura agraria de Inglaterra por condado / autoridad unitaria (Defra, encuesta y censo de junio, "Structure of the agricultural industry in England",
fichero por condado; Open Government Licence v3.0) -> data/uk-structure.json
Para el ultimo ano publicado (y el anterior con hoja propia, para comparar) guarda todas las columnas del fichero: explotaciones y superficie por tamano y
por tipo de granja, usos del suelo, cultivos, ganado y mano de obra, tal como las publica Defra. Las celdas con '#' son datos ocultos por confidencialidad
(se guardan como null y se cuentan aparte; nunca se rellenan). Las filas de region (North East... South West) y England son totales que da el propio Defra."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_ods import read_ods
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.gov.uk/government/statistical-data-sets/structure-of-the-agricultural-industry-in-england-and-the-uk-at-june'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
REGIONS = {'North East': 'UKC', 'North West and Merseyside': 'UKD', 'Yorkshire and The Humber': 'UKE', 'East Midlands': 'UKF', 'West Midlands': 'UKG', 'Eastern': 'UKH',
           'South East (incl. London)': 'UKIJ', 'South West': 'UKK', 'England': 'ENG'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise SystemExit('descarga fallida %s: %s' % (u, last))
def clean(s): return re.sub(r'\s+', ' ', re.sub(r'\(\d+\)', '', str(s or ''))).strip()
def sheet(rows, year):
    hi = next((i for i, r in enumerate(rows[:12]) if r and isinstance(r[0], str) and r[0].startswith('England %s' % year)), None)
    if hi is None: raise SystemExit('cabecera no encontrada en la hoja %s' % year)
    grp, cur, cols = rows[hi - 1] if hi else [], '', []
    for j, lab in enumerate(rows[hi]):
        if j == 0: continue
        g = grp[j] if j < len(grp) else None
        if g: cur = clean(g)
        if lab and clean(lab): cols.append((j, cur, clean(lab)))
    areas, conf = [], 0
    for r in rows[hi + 1:]:
        if not r or not isinstance(r[0], str) or not r[0].strip(): continue
        name = r[0].strip()
        if re.match(r'^(\(|Source|Note|Figures|#|Data|Totals|Holdings|Please)', name): break
        vals = []
        for j, g, l in cols:
            v = r[j] if j < len(r) else None
            if v == '#': conf += 1; vals.append(None)
            elif isinstance(v, float): vals.append(round(v, 1) if abs(v) < 100 else round(v))
            else: vals.append(None)
        areas.append([name, vals])
        if name == 'England': break
    return cols, areas, conf
def main():
    page = get(PAGE).decode('utf-8', 'replace')
    m = re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s<>]+?structure-england-june-county[^"\'\s<>]*\.ods', page)
    if not m: raise SystemExit('no se encontro el ODS por condado en la pagina')
    url = m[0]; log('ODS', url)
    S = read_ods(get(url), max_cols=220)
    yrs = sorted(int(n) for n in S if re.fullmatch(r'\d{4}', n))
    if not yrs or yrs[-1] < 2024: raise SystemExit('anos inesperados: %s' % yrs)
    y, py = yrs[-1], yrs[-2]
    cols, areas, conf = sheet(S[str(y)], y)
    pcols, pareas, _ = sheet(S[str(py)], py)
    if len(areas) < 100 or len(cols) < 60 or areas[-1][0] != 'England': raise SystemExit('estructura inesperada: %d zonas, %d columnas, ultima %s' % (len(areas), len(cols), areas[-1][0] if areas else '-'))
    # region de cada zona: las zonas van antes de su total regional
    reg, out = None, []
    for name, vals in reversed(areas):
        if name in REGIONS: reg = REGIONS[name]; out.append({'n': name, 'r': reg, 'total': True, 'v': vals}); continue
        out.append({'n': name, 'r': reg, 'v': vals})
    out.reverse()
    # ano anterior: mismas columnas (por grupo y etiqueta) y mismas zonas (por nombre)
    pidx = {(g, l): k for k, (j, g, l) in enumerate(pcols)}; pmap = {n: v for n, v in pareas}
    for a in out:
        pv = pmap.get(a['n'])
        if pv: a['p'] = [pv[pidx[(g, l)]] if (g, l) in pidx else None for j, g, l in cols]
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'scope': 'England',
           'source': {'name': 'Defra, Structure of the agricultural industry in England at June (county / unitary authority)', 'url': PAGE, 'license': 'Open Government Licence v3.0', 'file': url},
           'year': y, 'prevYear': py, 'columns': [[g, l] for j, g, l in cols], 'areas': out, 'confidential': conf}
    p = ROOT / 'data' / 'uk-structure.json'
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
        if o == n: log('sin cambios')
        else: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    except Exception: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('ano', y, 'anterior', py, '| zonas', len(out), '| columnas', len(cols), '| celdas confidenciales', conf)
    (ROOT / 'data' / 'uk-structure-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

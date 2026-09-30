#!/usr/bin/env python3
"""Bélgica (Statbel) -> data/belgium-stats.json (countries.BE)
Fuente: Statbel, ficheros abiertos de https://statbel.fgov.be/en/themes/agriculture-fishery/ . Statbel declara sus open data
"libres, gratuitos y sin restricción, para fines comerciales y no comerciales" (https://statbel.fgov.be/en/open-data); se cita
la fuente y la fecha de actualización.
  - Índices de precios agrarios (output e input, base 2020=100, mensual desde 2010)
  - Estadísticas de leche (recogida de leche de vaca, grasa, proteína), mensual desde 2018
  - Estadísticas de sacrificio (animales y peso), mensual desde 2014
No se usa Flandes/Landbouwcijfers: sus gráficas de precios son paneles Spotfire sin descarga automatizable.
"""
import datetime, io, json, re, sys, urllib.request, collections
import openpyxl
try: import xlrd
except Exception: xlrd = None

LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'}), timeout=180) as r: return r.read()
        except Exception as e: last = e
    raise RuntimeError('%s -> %s' % (u, last))
def page_files(slug, pat):
    h = get('https://statbel.fgov.be/en/themes/agriculture-fishery/' + slug).decode('utf-8', 'replace')
    out = []
    for x in dict.fromkeys(re.findall(r'href="([^"]+)"', h)):
        if re.search(pat, x):
            out.append(x if x.startswith('http') else 'https://statbel.fgov.be' + x)
    return out
def sheets(b):
    out = {}
    if b[:2] == b'PK':
        wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
        for ws in wb.worksheets: out[ws.title] = [list(r) for r in ws.iter_rows(values_only=True)]
    else:
        wb = xlrd.open_workbook(file_contents=b)
        for sh in wb.sheets(): out[sh.name] = [sh.row_values(i) for i in range(sh.nrows)]
    return out
def num(v):
    if isinstance(v, bool) or v is None or v in ('', '..', '...', '-', 'x'): return None
    if isinstance(v, (int, float)): return float(v)
    try: return float(str(v).replace(',', '.').replace(' ', ''))
    except ValueError: return None

OUT = {}
def put(sid, group, label, unit, freq, pts, extra=None):
    d = dict(pts); pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 2: return
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts)
    if extra: s.update(extra)
    OUT[sid] = s
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

# ---------- índices de precios agrarios ----------
def prices():
    f = [u for u in page_files('agricultural-prices', r'agriprices') if u.endswith('.xlsx')]
    log('agriprices', f)
    sh = sheets(get(f[0]))
    for name, group, pre, title in (('output', 'idx_perc', 'out', 'Farm-gate output price index'), ('input', 'idx_pag', 'in', 'Input price index (prices paid by farmers)')):
        rows = sh[name]; hdr = rows[1]
        cols = [(j, re.sub(r'\s+', '', str(h))) for j, h in enumerate(hdr) if isinstance(h, str) and re.match(r'^\s*\d{4}\s+\d{2}\s*$', h)]
        n = 0
        for r in rows[2:]:
            lab = re.sub(r'\s+', ' ', str(r[0] or '').replace('\xa0', ' ')).strip()
            if not lab: continue
            pts = []
            for j, k in cols:
                v = num(r[j]) if j < len(r) else None
                if v is not None: pts.append(('%s-%s' % (k[:4], k[4:]), v))
            if len(pts) < 12: continue
            nice = lab if lab != lab.upper() else lab.capitalize()
            put('be-%s-%s' % (pre, slug(lab)), group, '%s: %s (2020=100)' % (title, nice), 'index 2020=100', 'monthly', pts, {'sourceGroup': 'Statbel – agriprices'}); n += 1
        log(name, n, 'series', 'columnas mensuales', len(cols))

# ---------- leche ----------
MONTH = {m: i + 1 for i, m in enumerate(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])}
def period_of(name, rows):
    if re.match(r'^\d{6}$', name): return '%s-%s' % (name[:4], name[4:])
    return None
def milk():
    files = [u for u in page_files('milk-and-milk-product-statistics', r'milk_monthlyresults\d{4}b?_en\.xls$')]
    log('leche ficheros', len(files))
    vol, fat, prot = [], [], []
    for u in sorted(files):
        try: sh = sheets(get(u))
        except Exception as e: log('ERR', u, e); continue
        for name, rows in sh.items():
            p = period_of(name, rows)
            if not p: continue
            for i, r in enumerate(rows):
                if str(r[0]).strip().lower().startswith("raw cows' milk delivered to dairies") and i + 1 < len(rows):
                    m = rows[i + 1]
                    if 'Milk' in str(m[1]) and 'Skim' not in str(m[1]):
                        v, f_, pr = num(m[3]), num(m[4]), num(m[5])
                        if v: vol.append((p, v / 1e6))
                        if f_: fat.append((p, f_))
                        if pr: prot.append((p, pr))
                    break
    src = {'sourceGroup': 'Statbel – milk and milk product statistics'}
    put('be-milk-delivered', 'milk', "Cows' milk delivered to dairies (Belgium + imports), monthly", 'million litres', 'monthly', vol, src)
    put('be-milk-fat', 'milk', "Cows' milk delivered to dairies: fat content", '%', 'monthly', fat, src)
    put('be-milk-protein', 'milk', "Cows' milk delivered to dairies: protein content", '%', 'monthly', prot, src)
    log('leche', len(vol), 'meses')

# ---------- sacrificio ----------
def slaughter():
    files = page_files('animal-slaughtering', r'slaughtering_monthlyresults\d{4}\w*\.xls$')
    log('sacrificio ficheros', len(files))
    heads = collections.defaultdict(list); wt = collections.defaultdict(list)
    for u in sorted(files):
        try: sh = sheets(get(u))
        except Exception as e: log('ERR', u, e); continue
        for name, rows in sh.items():
            p = period_of(name, rows)
            if not p: continue
            on = False
            for r in rows:
                c0 = str(r[0]).strip()
                if c0.lower().startswith('animal categories'): on = True; continue
                if not on or not c0: continue
                if c0.startswith('(*') or c0.lower().startswith('source'): break
                lab = re.sub(r'\s*\(\*+\)\s*$', '', c0)
                a, b = num(r[1]), num(r[2]) if len(r) > 2 else None
                if a is not None: heads[lab].append((p, a))
                if b is not None: wt[lab].append((p, b / 1000))
    n = 0
    for lab, pts in heads.items():
        if len(pts) < 24: continue
        put('be-slaughter-heads-' + slug(lab), 'production', 'Slaughterings: %s (head)' % lab, 'head', 'monthly', pts, {'sourceGroup': 'Statbel – slaughtering statistics'}); n += 1
    for lab, pts in wt.items():
        if len(pts) < 24: continue
        put('be-slaughter-weight-' + slug(lab), 'production', 'Slaughterings: %s (slaughter weight)' % lab, 't', 'monthly', pts, {'sourceGroup': 'Statbel – slaughtering statistics'}); n += 1
    log('sacrificio', n, 'series')

def main():
    for fn in (prices, milk, slaughter):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e))
    if len(OUT) < 20:
        log('demasiado pocas series'); open('data/belgium-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'BE': {'name': 'Belgium', 'source': {'name': 'Statbel (Statistics Belgium)', 'url': 'https://statbel.fgov.be/en/themes/agriculture-fishery', 'license': 'Statbel open data (free reuse, commercial included; cite source)'}, 'series': list(OUT.values())}},
           'log': LOG[-30:]}
    json.dump(doc, open('data/belgium-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/belgium-log.txt', 'w').write('\n'.join(LOG)); log('series', len(OUT))
main()

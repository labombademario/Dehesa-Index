#!/usr/bin/env python3
"""EE. UU.: productos de USDA NASS que no estaban en el catalogo (frutos secos, citricos, bayas, hortalizas, legumbres, miel, lana y mohair, cabras, tabaco, champinon, canamo, pavo)
-> data/us-nass-extra-stats.json (countries.US, extend). Totales NACIONALES de Quick Stats (API con NASS_API_KEY).
Solo cifras publicadas por NASS tal cual (sin conversiones salvo escala a millones en cifras enormes); se descartan pronosticos, paridad, medias moviles y bases ajustadas.
Un fallo de una consulta no borra lo anterior: si salen muy pocas series no se escribe nada."""
import datetime, json, os, re, statistics, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-nass-extra-stats.json'; LOGF = ROOT / 'data/us-nass-extra-log.txt'
KEY = os.environ.get('NASS_API_KEY', '')
API = 'https://quickstats.nass.usda.gov/api/api_GET/?key=' + KEY + '&format=JSON&'
YEAR0 = 2000
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
# commodity_desc -> (prefijo de short_desc permitido (regex), estadisticas)
COMMODITIES = [
    'ALMONDS', 'PECANS', 'WALNUTS', 'PISTACHIOS', 'ORANGES', 'GRAPEFRUIT', 'LEMONS', 'STRAWBERRIES', 'BLUEBERRIES', 'CRANBERRIES', 'PEACHES', 'APPLES',
    'TOMATOES', 'ONIONS', 'LETTUCE', 'BEANS', 'LENTILS', 'PEAS', 'HONEY', 'WOOL', 'MOHAIR', 'GOATS', 'TOBACCO', 'MUSHROOMS', 'HEMP', 'TURKEYS']
ALLOW = {  # solo estas filas de cada commodity (el resto de variantes de NASS no aporta o duplica)
    'BEANS': r'^BEANS, DRY EDIBLE, \(EXCL CHICKPEAS\) - ', 'PEAS': r'^PEAS, DRY EDIBLE(, (ON|OFF) FARM)? - ', 'ONIONS': r'^ONIONS, DRY(, FRESH MARKET)? - ',
    'TURKEYS': r'^TURKEYS - (PRICE RECEIVED|PRODUCTION)', 'LETTUCE': r'^LETTUCE, (HEAD|ROMAINE|LEAF)(, FRESH MARKET)? - ', 'TOMATOES': r'^TOMATOES(, (FRESH MARKET|PROCESSING|IN THE OPEN))? - ',
    'GOATS': r'^GOATS(, SLAUGHTER, COMMERCIAL)? - ', 'HEMP': r'^HEMP, INDUSTRIAL(, IN THE OPEN)? - '}
BAD = re.compile(r'PARITY|10 YEAR AVG|ADJUSTED BASE|PCT OF|PCT |PERCENT|PROGRESS|ECONOMIC|FORECAST|GROUP ITEM|SALES, MEASURED IN PCT', re.I)
MONTH = {m: i + 1 for i, m in enumerate(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'])}
def get(params, tries=3):
    err = None
    for k in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(API + urllib.parse.urlencode(params), headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=120)
            return json.loads(r.read().decode('utf-8')).get('data', [])
        except urllib.error.HTTPError as e:
            if e.code in (400, 413): return None if e.code == 413 else []
            err = e; time.sleep(5 * (k + 1))
        except Exception as e:
            err = e; time.sleep(5 * (k + 1))
    raise err
def fetch(c):
    base = {'commodity_desc': c, 'agg_level_desc': 'NATIONAL', 'source_desc': 'SURVEY', 'year__GE': str(YEAR0)}
    rows = get(base)
    if rows is None:  # >50.000 filas: por estadistica
        rows = []
        for sc in ('PRICE RECEIVED', 'PRODUCTION', 'YIELD', 'AREA BEARING', 'AREA HARVESTED', 'AREA PLANTED', 'STOCKS', 'INVENTORY', 'SLAUGHTERED'):
            rows += get(dict(base, statisticcat_desc=sc)) or []
            time.sleep(0.3)
    return rows
def num(v):
    v = (v or '').replace(',', '').strip()
    try: return float(v)
    except ValueError: return None
def period(r):
    """(frecuencia, periodo) o None. Anual: YEAR / MARKETING YEAR. Mensual: JAN..DEC, END OF MAR... Descarta pronosticos y periodos compuestos."""
    f, ref, yr = r['freq_desc'], r['reference_period_desc'].upper().strip(), r['year']
    if f == 'ANNUAL': return ('A', str(yr)) if ref in ('YEAR', 'MARKETING YEAR') else None
    if f in ('MONTHLY', 'POINT IN TIME'):
        m = re.fullmatch(r'(?:END OF |FIRST OF |MID |MIDDLE OF )?([A-Z]{3})[A-Z]*', ref)
        if m and m.group(1) in MONTH and ' THRU ' not in ref: return ('M', '%s-%02d' % (yr, MONTH[m.group(1)]))
    return None
def freq_of(pts):
    if all(re.fullmatch(r'\d{4}', p[0]) for p in pts): return 'annual'
    ms = [int(p[0][:4]) * 12 + int(p[0][5:7]) for p in pts if re.fullmatch(r'\d{4}-\d{2}', p[0])]
    if len(ms) != len(pts) or len(ms) < 3: return None
    g = statistics.median([b - a for a, b in zip(ms, ms[1:])])
    return {1: 'monthly', 12: 'annual'}.get(g)
UNIT = {'LB': 'lb', 'TONS': 'short tons', 'CWT': 'cwt', 'BOXES': 'boxes', 'BARRELS': 'barrels', 'HEAD': 'head', 'ACRES': 'acres', '$': 'USD', 'BOX': 'box', 'BARREL': 'barrel',
        'TON': 'short ton', 'ACRE': 'acre', 'COLONY': 'colony', 'EGGS': 'eggs', 'POUNDS': 'lb', 'NUMBER': 'number', 'BU': 'bushels'}
def unit_of(mi):
    """'$ / LB' -> 'USD/lb'; 'LB / ACRE' -> 'lb/acre'; 'TONS' -> 'short tons'. Qualifier tras coma ('$ / BOX, ON TREE EQUIV') se devuelve aparte."""
    q = ''
    if ',' in mi: mi, q = [x.strip() for x in mi.split(',', 1)]
    out = []
    for t in [x.strip() for x in mi.split('/')]:
        if t not in UNIT: return None, q
        out.append(UNIT[t])
    return '/'.join(out), q
def metric_of(sc, sd, unit):
    if BAD.search(sd): return None
    if sc == 'PRICE RECEIVED': return ('price received', 'prices') if unit and unit.startswith('USD/') else None
    if sc == 'PRODUCTION':
        if unit == 'USD': return ('production value', 'crops')
        if unit and '/' in unit: return ('yield', 'crops')
        return ('production', 'crops')
    if sc == 'YIELD': return ('yield', 'crops')
    if sc in ('AREA BEARING', 'AREA HARVESTED', 'AREA PLANTED'): return (sc.lower(), 'crops')
    if sc == 'STOCKS': return ('cold storage stocks' if 'COLD STORAGE' in sd else 'stocks', 'stocks')
    if sc == 'INVENTORY' and unit in ('head', None): return ('inventory', 'livestock')
    if sc == 'SLAUGHTERED' and unit == 'head': return ('slaughtered', 'livestock')
    if sc in ('SHORN', 'CLIPPED') and unit == 'head': return (sc.lower(), 'livestock')
    return None
PREF = ['short tons', 'lb', 'cwt', 'boxes', 'barrels', 'head', 'acres']   # una sola unidad por (producto, medida): la primera de esta lista
def nice(s):
    s = s.strip().lower(); s = re.sub(r'\bexcl\b', 'excluding', s)
    return s[:1].upper() + s[1:]
def build():
    cur = datetime.date.today().year; cand = {}
    for c in COMMODITIES:
        try: rows = fetch(c)
        except Exception as e: log('ERROR', c, repr(e)[:200]); continue
        keep = 0
        for r in rows:
            sd = r['short_desc']
            if c in ALLOW and not re.match(ALLOW[c], sd): continue
            if r['domain_desc'] != 'TOTAL' or r['prodn_practice_desc'] not in ('ALL PRODUCTION PRACTICES', 'NOT SPECIFIED') or r['util_practice_desc'] not in ('ALL UTILIZATION PRACTICES', 'NOT SPECIFIED'): continue
            if r['freq_desc'] == 'WEEKLY': continue
            p = period(r); v = num(r['Value'])
            if not p or v is None: continue
            m = re.match(r'^(.*?) - (.*)$', sd)
            if not m: continue
            head, tail = m.group(1), m.group(2)
            mm = re.match(r'^([A-Z ,&\-\(\)/0-9]+?)(?:, MEASURED IN (.+))?$', tail)
            if not mm: continue
            unit, q = unit_of(mm.group(2) or '')
            if mm.group(2) and not unit: continue
            sc = r['statisticcat_desc']; met = metric_of(sc, sd, unit)
            if not met: continue
            if r['freq_desc'] == 'POINT IN TIME' and sc not in ('STOCKS', 'INVENTORY'): continue
            parts = [x.strip() for x in head.split(',') if x.strip()]
            if q: parts.append(q.lower())
            key = (tuple(parts), met[0], unit or '', r['freq_desc'] == 'ANNUAL')
            cand.setdefault(key, {'group': met[1], 'pts': {}, 'cls': set()})
            cand[key]['pts'][p[1]] = v; keep += 1
        log(c, len(rows), 'filas', keep, 'utiles'); time.sleep(0.3)
    # una unidad por (partes, medida, anual?)
    best = {}
    for k in cand:
        g = (k[0], k[1], k[3]); rank = PREF.index(k[2]) if k[2] in PREF else 99
        if g not in best or rank < best[g][0]: best[g] = (rank, k)
    out = {}; labels = {}
    for g, (_, k) in sorted(best.items()):
        parts, metric, unit, annual = k; d = cand[k]
        pts = sorted(d['pts'].items())
        if annual: pts = [p for p in pts if re.fullmatch(r'\d{4}', p[0])]
        else:
            ms = [p for p in pts if re.fullmatch(r'\d{4}-\d{2}', p[0])]
            pts = ms
            if len(ms) and freq_of(ms) == 'annual' and False: pass
        if len(pts) < 5: continue
        fq = freq_of([list(p) for p in pts])
        if not fq: log('descartada', parts, metric, 'periodicidad irregular'); continue
        if not annual and fq == 'annual':   # existencias a una fecha fija del anio: periodo = anio
            if len({p[0][5:7] for p in pts}) != 1: continue
            mon = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][int(pts[0][0][5:7])]
            pts = [(p[0][:4], p[1]) for p in pts]
        else: mon = None
        if int(pts[-1][0][:4]) < cur - 3: continue
        pts = pts[-(30 if fq == 'annual' else 180):]
        u = unit
        mx = max(abs(p[1]) for p in pts)
        if u in ('lb', 'short tons', 'cwt', 'boxes', 'barrels', 'head', 'acres', 'USD', 'eggs') and mx >= 1e8: pts = [(p[0], round(p[1] / 1e6, 6)) for p in pts]; u = 'million ' + u
        label = ', '.join([nice(parts[0])] + [x.lower() for x in parts[1:]]) + ': ' + metric
        labels.setdefault(label, []).append((fq, metric, parts, u, pts, d['group'], mon))
    for label, lst in sorted(labels.items()):
        for fq, metric, parts, u, pts, group, mon in lst:
            lab = label if len(lst) == 1 else label + ' (%s)' % fq
            sid = 'us-nass-x-' + re.sub(r'[^a-z0-9]+', '-', (lab + ' ' + u).lower()).strip('-')
            last, prev = pts[-1], pts[-2]
            s = {'id': sid, 'group': group, 'label': lab, 'unit': u, 'frequency': fq, 'latestPeriod': last[0], 'latest': last[1],
                 'changePct': round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, 'points': [[a, b] for a, b in pts], 'sourceGroup': 'NASS ' + group}
            if mon: s['periodNote'] = 'Point-in-time value (%s) of each year' % mon
            out[sid] = s
    return sorted(out.values(), key=lambda s: s['id'])
def main():
    if not KEY: print('falta NASS_API_KEY'); sys.exit(1)
    ser = build(); log('series', len(ser))
    LOGF.write_text('\n'.join(LOG[-200:]) + '\n', encoding='utf-8')
    if len(ser) < 60: log('demasiado pocas series; no se escribe'); sys.exit(1)
    src = {'name': 'USDA NASS - Quick Stats (national totals: tree nuts, citrus, berries, vegetables, pulses, honey, wool, goats, tobacco, mushrooms, hemp, turkeys)', 'url': 'https://quickstats.nass.usda.gov/', 'license': 'US Government work (public domain); cite USDA NASS'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': src, 'series': ser}}, 'log': LOG[-30:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
main()

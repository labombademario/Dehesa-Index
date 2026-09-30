#!/usr/bin/env python3
"""Portugal (INE, API JSON de indicadores) -> data/portugal-stats.json (countries.PT)
Fuente: Instituto Nacional de Estatística (INE), https://www.ine.pt/ine/json_indicador/pindica.jsp ; los conjuntos aparecen en dados.gov.pt
con licencia CC BY 4.0 (citar INE). No se usa SIMA/GPP (licencia de reutilización comercial sin aclarar).
"""
import datetime, json, re, sys, urllib.request
BASE = 'https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&Dim1=T&lang=EN&varcd='
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
def fetch(v):
    last = None
    for i in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + v, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'}), timeout=100) as r:
                return json.loads(r.read().decode('utf-8'))[0]
        except Exception as e: last = e
    raise RuntimeError('%s: %s' % (v, last))
MON = {m: i + 1 for i, m in enumerate('january february march april may june july august september october november december'.split())}
MON.update({m: i + 1 for i, m in enumerate('janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split())})
UNPARSED = set()
def period(k):
    k0 = k.strip(); s = k0.lower()
    if re.fullmatch(r'\d{4}', s): return s
    m = re.fullmatch(r'([a-zç]+)\s+(?:de\s+)?(\d{4})', s)
    if m and m.group(1) in MON: return '%s-%02d' % (m.group(2), MON[m.group(1)])
    m = re.search(r'(\d)\D{0,3}\s*(?:quarter|trimestre).*?(\d{4})', s)
    if m: return '%s-Q%s' % (m.group(2), m.group(1))
    m = re.search(r'(\d)\D{0,3}\s*(?:semi-?annual|semestre).*?(\d{4})', s)
    if m: return '%s-%s' % (m.group(2), '06' if m.group(1) == '1' else '12')
    UNPARSED.add(k0); return None
def rows(v):
    j = fetch(v); out = []
    for k, lst in j.get('Dados', {}).items():
        p = period(k)
        if not p: continue
        for r in lst:
            if 'valor' not in r: continue
            try: val = float(r['valor'])
            except ValueError: continue
            out.append((p, r.get('geodsg', ''), r.get('dim_3_t', ''), val, r.get('dim_4_t', ''), r.get('dim_5_t', '')))
    return out
OUT = {}
def put(sid, group, label, unit, freq, pts, extra=None):
    d = dict(pts); pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts)
    if extra: s.update(extra)
    OUT[sid] = s
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def freq_of(p): return 'monthly' if re.fullmatch(r'\d{4}-\d{2}', p) and not p.endswith(('-06', '-12')) else None

# (varcd, tag, group, label template, unit, frequency, filter-national)
SPECS = [
 ('0014466', 'out', 'idx_perc', 'Producer price index: {c} (2020=100)', 'index 2020=100', 'monthly', 'INE – Agricultural products price index (output)'),
 ('0014463', 'in', 'idx_pag', 'Input price index (prices paid by farmers): {c} (2020=100)', 'index 2020=100', 'monthly', 'INE – Agricultural production means price index (input)'),
 ('0000918', 'milk', 'milk', 'Milk production: {c}', 't', 'annual', 'INE – Animal production statistics'),
 ('0000920', 'cheese', 'milk', 'Cheese production: {c}', 't', 'annual', 'INE – Animal production statistics'),
 ('0000921', 'butter', 'milk', 'Butter production', 't', 'annual', 'INE – Animal production statistics'),
 ('0000916', 'meat', 'production', 'Meat production: {c}', 't', 'annual', 'INE – Animal production statistics'),
 ('0000917', 'eggs', 'production', 'Egg production: {c}', 't', 'annual', 'INE – Animal production statistics'),
 ('0001330', 'slaughter-heads', 'production', 'Slaughterings (approved for consumption): {c} (head)', 'head', 'annual', 'INE – Slaughterhouse statistics'),
 ('0001331', 'slaughter-weight', 'production', 'Slaughterings (approved for consumption): {c} (net weight)', 't', 'annual', 'INE – Slaughterhouse statistics'),
 ('0001336', 'poultry-heads', 'production', 'Poultry and rabbit slaughterings: {c} (head)', 'head', 'annual', 'INE – Slaughterhouse statistics'),
 ('0001337', 'poultry-weight', 'production', 'Poultry and rabbit slaughterings: {c} (net weight)', 't', 'annual', 'INE – Slaughterhouse statistics'),
 ('0000019', 'crop-area', 'crops', 'Area: {c}', 'ha', 'annual', 'INE – Vegetable production statistics'),
 ('0000021', 'crop-prod', 'crops', 'Production: {c}', 't', 'annual', 'INE – Vegetable production statistics'),
 ('0000023', 'crop-yield', 'crops', 'Yield: {c}', 'kg/ha', 'annual', 'INE – Vegetable production statistics'),
 ('0000704', 'olive', 'crops', 'Olive production', 't', 'annual', 'INE – Olive oil production survey'),
 ('0000537', 'cattle', 'livestock', 'Cattle livestock: {c}', 'thousand head', 'semiannual', 'INE – Livestock survey'),
 ('0000538', 'pigs', 'livestock', 'Pig livestock: {c}', 'thousand head', 'semiannual', 'INE – Livestock survey'),
 ('0000539', 'sheep', 'livestock', 'Sheep livestock: {c}', 'thousand head', 'annual', 'INE – Livestock survey'),
 ('0000540', 'goats', 'livestock', 'Goat livestock: {c}', 'thousand head', 'annual', 'INE – Livestock survey'),
]
def run(spec):
    v, tag, group, tpl, unit, freq, sg = spec
    rs = rows(v)
    geos = sorted({r[1] for r in rs})
    nat = [g for g in geos if g.lower().startswith('portugal')]
    if not nat: log(v, tag, 'sin total nacional; geos:', geos[:8]); return
    g0 = nat[0]; by = {}
    for p, g, c, val, *_ in rs:
        if g == g0: by.setdefault(c, {})[p] = val
    n = 0
    for c, d in by.items():
        if tag == 'oliveoil' and not re.search(r'^total', c, re.I) and len(by) > 1 and any(re.search(r'^total', x, re.I) for x in by): continue
        lab = tpl.format(c='Total' if c.lower() == 'meat' else c).strip().rstrip(':')
        f = freq
        put('pt-%s-%s' % (tag, slug(c) or 'total'), group, lab, unit, f, list(d.items()), {'sourceGroup': sg}); n += 1
    log(v, tag, n, 'series')
def olive():
    """Aceite de oliva: total nacional (0000709, Portugal, prensas/acidez/extracción = Total) y por acidez en el Continente (0013162)."""
    rs = rows('0000709'); d = {}
    for p, g, c, val, c4, c5 in rs:
        if g.lower().startswith('portugal') and c.lower() == 'total' and c4.lower() == 'total' and c5.lower() == 'total': d[p] = val
    put('pt-oliveoil-total', 'crops', 'Olive oil produced: Portugal total', 'hl', 'annual', list(d.items()), {'sourceGroup': 'INE – Olive oil production survey'})
    rs = rows('0013162'); by = {}
    for p, g, c, val, *_ in rs:
        if g == 'Continente': by.setdefault(c, {})[p] = val
    for c, dd in by.items():
        if c.lower() == 'total': continue
        put('pt-oliveoil-acidity-' + slug(c), 'crops', 'Olive oil produced (mainland): acidity %s %%' % c.replace('up to', '≤').replace('over', '>'), 'hl', 'annual', list(dd.items()), {'sourceGroup': 'INE – Olive oil production survey'})
    log('azeite', len([k for k in OUT if k.startswith('pt-oliveoil')]), 'series')

def merge_only(fn):
    doc = json.load(open('data/portugal-stats.json'))
    ser = {x['id']: x for x in doc['countries']['PT']['series']}
    fn(); ser.update(OUT)
    doc['countries']['PT']['series'] = list(ser.values())
    doc['generatedAt'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'); doc['log'] = LOG[-30:]
    json.dump(doc, open('data/portugal-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/portugal-log.txt', 'w').write('\n'.join(LOG)); log('series', len(ser))

def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'olive':
        merge_only(olive); return
    for s in SPECS:
        try: run(s)
        except Exception as e: log('ERROR', s[0], repr(e))
    try: olive()
    except Exception as e: log('ERROR olive', repr(e))
    if UNPARSED: log('periodos no reconocidos:', sorted(UNPARSED)[:8])
    if len(OUT) < 30:
        log('demasiado pocas series'); open('data/portugal-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'PT': {'name': 'Portugal', 'source': {'name': 'INE – Statistics Portugal', 'url': 'https://www.ine.pt/', 'license': 'CC BY 4.0 (dados.gov.pt); cite INE'}, 'series': list(OUT.values())}},
           'log': LOG[-30:]}
    json.dump(doc, open('data/portugal-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/portugal-log.txt', 'w').write('\n'.join(LOG)); log('series', len(OUT))
main()

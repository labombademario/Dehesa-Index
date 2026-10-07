#!/usr/bin/env python3
"""Polonia: Oficina Central de Estadistica (GUS), Banco de Datos Locales (BDL, API REST publica) -> data/poland-stats.json (countries.PL, extend)
Fuente: https://bdl.stat.gov.pl/api/v1/ (sin clave: limites anonimos 5 peticiones/s, 100 por 15 min y 1000 por 12 h; este script hace unas 130 y espera si se acerca al tope).
Licencia: aviso de copyright de GUS (https://stat.gov.pl/en/copyright/, leido el 7 oct 2026): sin objecion a copiar archivos y paginas ni a elaborar resumenes propios si se cita la fuente.
Solo nivel nacional (unit-level=0, POLAND) y solo el valor definitivo de cada ano (attrId 1); un dato con otro atributo (0, '-', estimacion) no se publica.
Precios percibidos por el agricultor (mercado local) y de compra (acopio) anuales, cosechas por cultivo, ganado, produccion de carne, leche y huevos, y acopio mensual.
Conversiones exactas: dt (quintal, 100 kg) -> t (x0,1; precio por dt -> por t x10). Sin estimaciones ni relleno de huecos."""
import datetime, json, re, sys, time, urllib.error, urllib.request
B = 'https://bdl.stat.gov.pl/api/v1/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': 'application/json'}
LOG = []
NREQ = [0, time.time()]
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=90):
    # limites anonimos: 100 peticiones por 15 min -> ritmo de ~1 cada 1,3 s y pausa si llevamos 85 en la ventana
    if NREQ[0] >= 70 and time.time() - NREQ[1] < 900:
        w = 905 - (time.time() - NREQ[1]); log('pausa', int(w), 's por el limite de la API'); time.sleep(max(w, 1)); NREQ[0] = 0; NREQ[1] = time.time()
    last = None
    for i in range(4):
        try:
            time.sleep(1.3); NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429: log('429 de la API: espero a que se abra la ventana de 15 min'); time.sleep(910); NREQ[0] = 0; NREQ[1] = time.time()
            else: time.sleep(8 * (i + 1))
        except Exception as e:
            last = e; time.sleep(8 * (i + 1))
    raise RuntimeError('%s -> %s' % (u[:140], last))
def variables(sid):
    out, page = [], 0
    while True:
        j = get(B + 'variables?subject-id=%s&lang=en&format=json&page-size=100&page=%d' % (sid, page))
        out += j.get('results', [])
        if (page + 1) * 100 >= j.get('totalRecords', 0): break
        page += 1
    return out
def values(ids):
    """{id: [(anio, valor)]} del nivel nacional; solo attrId 1 (valor). La API pagina por variable: se piden paginas hasta cubrir totalRecords."""
    res = {}
    for i in range(0, len(ids), 10):
        chunk = ids[i:i + 10]; page = 0; got = 0
        while True:
            j = get(B + 'data/by-unit/000000000000?format=json&lang=en&page-size=100&page=%d&' % page + '&'.join('var-id=%d' % v for v in chunk))
            for r in j.get('results', []):
                pts, skipped = [], 0
                for v in r.get('values', []):
                    if v.get('attrId') == 1 and v.get('val') is not None: pts.append((v['year'], v['val']))
                    else: skipped += 1
                res[r['id']] = pts; got += 1
                if skipped: log('  var', r['id'], 'descartados', skipped, 'valores con atributo distinto de 1')
            if got >= j.get('totalRecords', 0) or not j.get('results'): break
            page += 1
        if got < len(chunk): log('AVISO', 'pedidas', len(chunk), 'variables y la API devolvio', got)
    return res
OUT = {}
def cap(s): return s[:1].upper() + s[1:]
def put(sid, group, label, unit, freq, pts, src, mult=1.0, note=None):
    d = {}
    for p, v in pts: d[str(p)] = round(v * mult, 4)
    pts = [[p, v] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3: return False
    if group in ('production', 'crops', 'milk', 'livestock') and any(v < 0 for _, v in pts): log('descartada (valor negativo en una cantidad)', sid, label); return False
    last, prev = pts[-1], pts[-2]
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=pts, sourceGroup=src)
    if note: s['periodNote'] = note
    OUT[sid] = s; return True
CROPS_SKIP = re.compile(r'^$')
def crops():
    n = 0
    for sid in ('P1423', 'P1457', 'P2138'):
        vs = [v for v in variables(sid) if v.get('n3') in (None, 'total')]
        vals = values([v['id'] for v in vs])
        for v in vs:
            n1, n2 = v['n1'], v.get('n2') or ''
            if 'area' in n2: k, u, mu, w = 'area', 'ha', 1.0, 'area'
            elif 'crops from 1' in n2 or 'yield' in n2: k, u, mu, w = 'yield', 't/ha', 0.1, 'yield'
            elif 'harvest' in n2 or 'collection' in n2: k, u, mu, w = 'harvest', 't', 0.1, 'harvest'
            else: continue
            if v.get('measureUnitName') not in ('ha', 'dt'): continue
            n += put('pl-gus-crop-%d' % v['id'], 'crops', '%s: %s (GUS)' % (cap(n1), {'area': 'sown area', 'yield': 'yield', 'harvest': 'harvest'}[w]), u, 'annual', vals.get(v['id'], []), 'GUS BDL %s' % sid, mu)
    log('cultivos', n, 'series')
def prices():
    n = 0
    for sid, tag, ttl in (('P1459', 'market', 'price received by farmers (market-place)'), ('P1458', 'proc', 'procurement price')):
        vs = variables(sid); vals = values([v['id'] for v in vs])
        for v in vs:
            nm = v['n1']; m = re.search(r'\s*(per\s+)?1\s*(dt|kg|l|head|piece|pcs|pc)\b\.?\s*$', nm, re.I)
            nm2 = nm
            if re.search(r'1\s*kg', nm): u, mu = 'PLN/kg', 1.0
            elif re.search(r'1\s*dt|1dt', nm): u, mu = 'PLN/t', 10.0
            elif re.search(r'1\s*l\b', nm): u, mu = 'PLN/l', 1.0
            elif re.search(r'1\s*head|1\s*piece|1\s*pcs?', nm, re.I): u, mu = ('PLN/piece' if 'egg' in nm else 'PLN/head'), 1.0
            else: continue
            nm2 = re.sub(r'\s*,?\s*(per\s+)?1\s*(dt|kg|l|head|piece|pcs?)\b\.?.*$', '', nm, flags=re.I).strip() or nm
            nm2 = re.sub(r'\s+in live weight$', ' (live weight)', nm2)
            live = re.search(r'slaughter|cattle|pigs|calves', nm, re.I) and u == 'PLN/kg'
            grp = 'prices_lv' if (live or re.search(r'cow|heifer|piglet|ewe|horse|colt', nm, re.I)) else 'prices'
            n += put('pl-gus-%s-%d' % (tag, v['id']), grp, '%s: %s, annual average (GUS)' % (cap(nm2), ttl), u, 'annual', vals.get(v['id'], []), 'GUS BDL %s' % sid, mu)
    log('precios', n, 'series')
def livestock():
    n = 0
    for sid in ('P1440', 'P1441', 'P1442'):
        vs = [v for v in variables(sid) if (v.get('n1') in ('total',))]
        vals = values([v['id'] for v in vs])
        for v in vs:
            nm = ({'P1440': 'Cattle: ', 'P1441': 'Pigs: ', 'P1442': ''}[sid]) + (v['n2'] if v.get('n2') else v['n1'])
            if v.get('measureUnitName') not in ('head', 'szt.'): continue
            n += put('pl-gus-herd-%d' % v['id'], 'livestock', '%s (stock, GUS)' % cap(nm).replace('Cattle: total', 'Cattle: total herd').replace('Pigs: total', 'Pigs: total herd'), 'head', 'annual', vals.get(v['id'], []), 'GUS BDL %s' % sid)
    log('censos', n, 'series')
def output():
    n = 0
    vs = [v for v in variables('P1443') if v['n1'] == 'total']; vals = values([v['id'] for v in vs])
    for v in vs:
        n += put('pl-gus-slaught-%d' % v['id'], 'production', 'Production of animals for slaughter, %s (GUS)' % v['n2'].replace('of sheep', 'sheep meat'), 't', 'annual', vals.get(v['id'], []), 'GUS BDL P1443')
    vs = [v for v in variables('P1444') if v['n1'] == 'total']; vals = values([v['id'] for v in vs])
    for v in vs:
        t = v['n2']; mu = {'thousand tons': ('t', 1000.0), 'thousand litres': ('l', 1000.0)}.get(t)
        if mu: n += put('pl-gus-milk-%d' % v['id'], 'milk', "Cows' milk production (%s, GUS)" % ('tonnes' if mu[0] == 't' else 'litres'), mu[0], 'annual', vals.get(v['id'], []), 'GUS BDL P1444', mu[1])
    vs = [v for v in variables('P1445') if v['n1'] == 'total']; vals = values([v['id'] for v in vs])
    for v in vs: n += put('pl-gus-eggs-%d' % v['id'], 'production', 'Eggs production (GUS)', 'pieces', 'annual', vals.get(v['id'], []), 'GUS BDL P1445', 1000.0)
    vs = variables('P2140'); vals = values([v['id'] for v in vs])
    for v in vs:
        if v['n1'].startswith('thousand tons'): n += put('pl-gus-milkproc-%d' % v['id'], 'milk', "Procurement of cows' milk (GUS)", 't', 'annual', vals.get(v['id'], []), 'GUS BDL P2140', 1000.0)
        elif v['n1'].startswith('fat content'): n += put('pl-gus-milkfat-%d' % v['id'], 'milk', "Fat content of purchased cows' milk (GUS)", '%', 'annual', vals.get(v['id'], []), 'GUS BDL P2140')
    vs = [v for v in variables('P3941') if 'grand total' in (v.get('n2') or '')]; vals = values([v['id'] for v in vs])
    for v in vs: n += put('pl-gus-procval-%d' % v['id'], 'production', 'Value of procurement of agricultural products, %s (current prices, GUS)' % v['n1'], 'PLN million', 'annual', vals.get(v['id'], []), 'GUS BDL P3941')
    log('produccion', n, 'series')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
def procurement():
    vs = variables('P2488'); vals = values([v['id'] for v in vs]); by = {}
    for v in vs:
        mo, prodn = v['n1'], (v.get('n2') or '')
        if mo not in MONTHS or not prodn: continue
        by.setdefault((prodn, v.get('measureUnitName')), []).append((MONTHS.index(mo) + 1, v['id']))
    n = 0
    for (prod, mu), lst in by.items():
        pts = []
        for mi, vid in lst:
            for y, val in vals.get(vid, []): pts.append(('%s-%02d' % (y, mi), val))
        u, f = ('t', 0.1) if mu == 'dt' else ('thousand l', 1.0) if mu == 'thousand l' else (None, None)
        if not u: continue
        slug = re.sub(r'[^a-z0-9]+', '-', prod.lower()).strip('-')
        n += put('pl-gus-proc-m-%s' % slug, 'production', 'Procurement of %s (monthly, GUS)' % prod.replace(' - ', ': '), u, 'monthly', pts, 'GUS BDL P2488', f)
    log('acopio mensual', n, 'series')
def main():
    for fn in (prices, crops, livestock, output, procurement):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:300])
    if len(OUT) < 40:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/poland-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'Statistics Poland (GUS), Local Data Bank (BDL)', 'url': 'https://bdl.stat.gov.pl/', 'license': 'Statistics Poland copyright notice: copying and own compilations allowed if the source is cited'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'PL': {'name': 'Poland', 'extend': True, 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}}, 'log': LOG[-30:]}
    json.dump(doc, open('data/poland-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/poland-log.txt', 'w').write('\n'.join(LOG) + '\n'); log('series', len(OUT))
main()

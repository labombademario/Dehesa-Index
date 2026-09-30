#!/usr/bin/env python3
"""Portugal (precios absolutos y leche mensual vía Eurostat) -> data/portugal-eurostat-stats.json (countries.PT, extend)
El INE solo publica índices de precios agrarios; Eurostat (geo=PT, datos oficiales portugueses, política de reutilización con cita de la fuente) aporta precios absolutos anuales, leche mensual y más. Complementa a update-portugal.py.
"""
import datetime, json, re, sys, urllib.request, urllib.parse
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
def fetch(ds, **flt):
    q = 'lang=EN&geo=PT' + ''.join('&%s=%s' % (k, urllib.parse.quote(v)) for k, v in flt.items())
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + ds + '?' + q, headers={'User-Agent': 'DehesaIndex'}), timeout=120) as r:
                return json.load(r)
        except Exception as e: last = e
    raise RuntimeError('%s: %s' % (ds, last))
def records(j):
    """devuelve lista de (dict dim->código, valor) y labels por dimensión"""
    ids, size = j['id'], j['size']
    cats = {}; labs = {}
    for d in ids:
        c = j['dimension'][d]['category']
        idx = c['index']; order = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): order[v] = k
        else: order = list(idx)
        cats[d] = order; labs[d] = c.get('label', {})
    out = []
    for pos, v in j.get('value', {}).items():
        pos = int(pos); rec = {}
        for d, n in reversed(list(zip(ids, size))):
            rec[d] = cats[d][pos % n]; pos //= n
        out.append((rec, v))
    return out, labs
OUT = {}
def put(sid, group, label, unit, freq, pts, extra=None):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return  # series discontinued / stale
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts)
    if extra: s.update(extra)
    OUT[sid] = s
def split_label(l):
    m = re.match(r'^(.*?)\s+-\s+prices\s+(.*)$', l)
    return (m.group(1), 'EUR ' + m.group(2)) if m else (l, 'EUR')

def abs_prices(ds, tag, groupfn, prodim):
    j = fetch(ds, currency='EUR'); recs, labs = records(j); by = {}
    for r, v in recs: by.setdefault(r[prodim], []).append((r['time'], v))
    n = 0
    for code, pts in by.items():
        name, unit = split_label(labs[prodim][code])
        put('pt-es-%s-%s' % (tag, code), groupfn(name), name + ' (producer price)' if tag != 'inp' else name + ' (price paid)', unit, 'annual', pts, {'sourceGroup': 'Eurostat ' + ds}); n += 1
    log(ds, n, 'series')
def inputs_group(name):
    if re.search(r'fertili|nitrate|urea|phosphate|potash|ammonia|lime|compound', name, re.I) and not re.search(r'feed', name, re.I): return 'inputs_f'
    if re.search(r'feed|straw|hay|cake|meal|maize|barley|wheat|oats|soya|concentrate', name, re.I): return 'inputs_a'
    return 'inputs'

def prices():
    abs_prices('apri_ap_crpouta', 'crop', lambda n: 'prices', 'prod_veg')
    abs_prices('apri_ap_anouta', 'ani', lambda n: 'prices_lv', 'prod_ani')
    abs_prices('apri_ap_ina', 'inp', inputs_group, 'prod_inp')

def milk():
    j = fetch('apro_mk_colm'); recs, labs = records(j); by = {}
    for r, v in recs:
        d, mi, u = r['dairyprod'], r['milkitem'], r['unit']
        if mi == 'PRD' and u == 'THS_T': by.setdefault(('prd', d), []).append((r['time'], v))
        elif mi in ('FAT', 'PTEN') and u == 'PC' and d == 'D1110D': by.setdefault((mi.lower(), d), []).append((r['time'], v))
    for (k, d), pts in by.items():
        name = labs['dairyprod'][d]
        if k == 'prd': put('pt-es-milk-%s' % d, 'milk', name + ' (monthly)', 'thousand t', 'monthly', pts, {'sourceGroup': 'Eurostat apro_mk_colm'})
        else: put('pt-es-milk-%s-%s' % (k, d), 'milk', name + ': ' + ('fat' if k == 'fat' else 'protein') + ' content', '%', 'monthly', pts, {'sourceGroup': 'Eurostat apro_mk_colm'})
    log('leche', len([s for s in OUT if s.startswith('pt-es-milk')]), 'series')

def slaughter():
    j = fetch('apro_mt_pann', meatitem='SLAUGHT'); recs, labs = records(j); by = {}
    for r, v in recs:
        if r['unit'] in ('THS_T', 'THS_HD'): by.setdefault((r['meat'], r['unit']), []).append((r['time'], v))
    for (m, u), pts in by.items():
        name = labs['meat'][m]
        put('pt-es-slaughter-%s-%s' % (u.lower(), m.lower()), 'production', 'Slaughterings: %s (%s)' % (name, 'carcass weight' if u == 'THS_T' else 'head'), 'thousand t' if u == 'THS_T' else 'thousand head', 'annual', pts, {'sourceGroup': 'Eurostat apro_mt_pann'})
    log('sacrificio', len(by), 'series')

CROPS = {'C1110': 'Common wheat and spelt', 'C1120': 'Durum wheat', 'C1210': 'Rye', 'C1300': 'Barley', 'C1400': 'Oats and spring cereal mixtures', 'C1500': 'Grain maize', 'C1600': 'Triticale',
         'I1110': 'Rape and turnip rape seeds', 'I1120': 'Sunflower seed', 'I1130': 'Soya', 'R1000': 'Potatoes', 'R2000': 'Sugar beet', 'C0000': 'Cereals for grain', 'P1100': 'Field peas'}
MET = {'AR_THS_HA': ('Area', 'thousand ha'), 'HPRD_HUMD_EU_THS_T': ('Harvested production', 'thousand t'), 'YLD_HUMD_EU_T_HA': ('Yield', 't/ha')}
def crops():
    j = fetch('apro_cpsh1'); recs, labs = records(j); by = {}
    for r, v in recs:
        if r['crops'] in CROPS and r['strucpro'] in MET: by.setdefault((r['crops'], r['strucpro']), []).append((r['time'], v))
    for (c, m), pts in by.items():
        put('pt-es-crop-%s-%s' % (c.lower(), m.lower()), 'crops', '%s: %s' % (CROPS[c], MET[m][0].lower()), MET[m][1], 'annual', pts, {'sourceGroup': 'Eurostat apro_cpsh1'})
    log('cultivos', len(by), 'series')

def herds():
    specs = [('apro_mt_lscatl', {'A2000': 'Live bovine animals', 'A2300F': 'Dairy cows', 'A2300G': 'Non-dairy cows'}, 'M11_M12'),
             ('apro_mt_lspig', {'A3100': 'Live pigs', 'A3120': 'Breeding sows (50 kg or over)', 'A3132': 'Fattening pigs (50 kg or over)'}, 'M11_M12'),
             ('apro_mt_lssheep', {'A4100': 'Live sheep', 'A4200': 'Live goats'}, 'M11_M12')]
    n = 0
    for ds, items, month in specs:
        try:
            j = fetch(ds); recs, labs = records(j); by = {}
            for r, v in recs:
                if r['animals'] in items and r.get('month', month) == month: by.setdefault(r['animals'], []).append((r['time'], v))
            for a, pts in by.items():
                put('pt-es-herd-%s' % a.lower(), 'livestock', '%s (Nov-Dec census)' % items[a], 'thousand head', 'annual', pts, {'sourceGroup': 'Eurostat ' + ds}); n += 1
        except Exception as e: log('ERROR', ds, repr(e))
    log('censo', n, 'series')

def organic():
    j = fetch('org_cropar', agprdmet='TOTAL'); recs, labs = records(j); by = {}
    keep = {'UAAXK0000': 'Utilised agricultural area', 'ARA': 'Arable land', 'C0000': 'Cereals', 'I1100': 'Oilseeds', 'R1000': 'Potatoes'}
    for r, v in recs:
        if r['crops'] in keep and r['unit'] == 'HA': by.setdefault(r['crops'], []).append((r['time'], v))
    for c, pts in by.items():
        put('pt-es-organic-%s' % c.lower(), 'organic', 'Organic area (converted + in conversion): %s' % keep[c], 'ha', 'annual', pts, {'sourceGroup': 'Eurostat org_cropar'})
    log('ecologico', len(by), 'series')

def main():
    for fn in (prices, milk, slaughter, crops, herds, organic):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e))
    if len(OUT) < 20:
        log('demasiado pocas series'); open('data/portugal-eurostat-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'PT': {'name': 'Portugal', 'extend': True, 'source': {'name': 'Eurostat (official Portuguese data: INE)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (CC BY 4.0); cite source'}, 'series': list(OUT.values())}},
           'log': LOG[-30:]}
    json.dump(doc, open('data/portugal-eurostat-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/portugal-eurostat-log.txt', 'w').write('\n'.join(LOG)); log('series', len(OUT))
main()

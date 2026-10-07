#!/usr/bin/env python3
"""Austria (vía Eurostat) -> data/austria-stats.json (countries.AT)
Los datos de mercado de AMA (Agrarmarkt Austria) se publican en un panel Power BI y en PDF, sin descarga automatizable; el open data de
Statistik Austria no incluye estadística agraria. Por eso se usa la API de Eurostat (geo=AT), que reutiliza datos oficiales austriacos
(Statistik Austria / BMLUK) con la política de reutilización de Eurostat (CC BY 4.0, citar la fuente).
"""
import datetime, json, re, sys, urllib.request, urllib.parse
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
def fetch(ds, **flt):
    q = 'lang=EN&geo=AT' + ''.join('&%s=%s' % (k, urllib.parse.quote(v)) for k, v in flt.items())
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
    out = []; st = j.get('status') or {}
    for pos, v in j.get('value', {}).items():
        flag = st.get(pos) if isinstance(st, dict) else None  # marca de calidad de Eurostat (z = no aplicable, c = confidencial)
        pos = int(pos); rec = {'_s': flag}
        for d, n in reversed(list(zip(ids, size))):
            rec[d] = cats[d][pos % n]; pos //= n
        out.append((rec, v))
    return out, labs
OUT = {}
def put(sid, group, label, unit, freq, pts, extra=None, max_age=2):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - max_age: return  # series discontinued / stale
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
        put('at-%s-%s' % (tag, code), groupfn(name), name + ' (producer price)' if tag != 'inp' else name + ' (price paid)', unit, 'annual', pts, {'sourceGroup': 'Eurostat ' + ds}); n += 1
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
        if k == 'prd': put('at-milk-%s' % d, 'milk', name + ' (monthly)', 'thousand t', 'monthly', pts, {'sourceGroup': 'Eurostat apro_mk_colm'})
        else: put('at-milk-%s-%s' % (k, d), 'milk', name + ': ' + ('fat' if k == 'fat' else 'protein') + ' content', '%', 'monthly', pts, {'sourceGroup': 'Eurostat apro_mk_colm'})
    log('leche', len([s for s in OUT if s.startswith('at-milk')]), 'series')

def slaughter():
    j = fetch('apro_mt_pann', meatitem='SLAUGHT'); recs, labs = records(j); by = {}
    for r, v in recs:
        if r['unit'] not in ('THS_T', 'THS_HD'): continue
        if any(c in (r.get('_s') or '') for c in 'zc'): continue  # 'no aplicable' / 'confidencial' no son un 0: no se publican como dato
        by.setdefault((r['meat'], r['unit']), []).append((r['time'], v))
    for (m, u), pts in by.items():
        name = labs['meat'][m]
        put('at-slaughter-%s-%s' % (u.lower(), m.lower()), 'production', 'Slaughterings: %s (%s)' % (name, 'carcass weight' if u == 'THS_T' else 'head'), 'thousand t' if u == 'THS_T' else 'thousand head', 'annual', pts, {'sourceGroup': 'Eurostat apro_mt_pann'})
    log('sacrificio', len(by), 'series')

CROPS = {'C1110': 'Common wheat and spelt', 'C1120': 'Durum wheat', 'C1210': 'Rye', 'C1300': 'Barley', 'C1400': 'Oats and spring cereal mixtures', 'C1500': 'Grain maize', 'C1600': 'Triticale',
         'I1110': 'Rape and turnip rape seeds', 'I1120': 'Sunflower seed', 'I1130': 'Soya', 'R1000': 'Potatoes', 'R2000': 'Sugar beet', 'C0000': 'Cereals for grain', 'P1100': 'Field peas',
         'W1100': 'Grapes for wines', 'F1110': 'Apples', 'F1120': 'Pears', 'F0000': 'Fruits, berries and nuts (excl. citrus and grapes)'}
MET = {'AR_THS_HA': ('Area', 'thousand ha'), 'HPRD_HUMD_EU_THS_T': ('Harvested production', 'thousand t'), 'YLD_HUMD_EU_T_HA': ('Yield', 't/ha')}
def crops():
    j = fetch('apro_cpsh1'); recs, labs = records(j); by = {}
    for r, v in recs:
        if r['crops'] in CROPS and r['strucpro'] in MET: by.setdefault((r['crops'], r['strucpro']), []).append((r['time'], v))
    for (c, m), pts in by.items():
        put('at-crop-%s-%s' % (c.lower(), m.lower()), 'crops', '%s: %s' % (CROPS[c], MET[m][0].lower()), MET[m][1], 'annual', pts, {'sourceGroup': 'Eurostat apro_cpsh1'})
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
                put('at-herd-%s' % a.lower(), 'livestock', '%s (Nov-Dec census)' % items[a], 'thousand head', 'annual', pts, {'sourceGroup': 'Eurostat ' + ds}); n += 1
        except Exception as e: log('ERROR', ds, repr(e))
    log('censo', n, 'series')

OUT_EXTRA = ('AM021100', 'AM021200', 'AM021300', 'AM065000', 'AM080000')   # colza, girasol, soja, aceituna y aceite de oliva: productos concretos de la matriz de cobertura (nivel inferior al de agrupacion)
def quarterly():
    """Índices trimestrales de precios agrícolas (Eurostat apri_pi_outq / apri_pi_inq), base 2020=100, índice nominal.
    Solo agrupaciones de 2.º nivel (código acabado en 000) para no inundar la lista."""
    for ds, tag, group, what in (('apri_pi_outq', 'out', 'idx_perc', 'output price index'), ('apri_pi_inq', 'in', 'idx_pag', 'input price index')):
        j = fetch(ds, p_adj='NI', unit='I20'); recs, labs = records(j); by = {}
        for r, v in recs:
            c = r['am_item']
            if c.endswith('000') or c in OUT_EXTRA: by.setdefault(c, []).append((r['time'], v))
        n = 0
        for c, pts in by.items():
            name = re.sub(r'\s*\(Input \d\)$', '', labs['am_item'][c])
            put('at-q-%s-%s' % (tag, c.lower()), group, '%s: %s' % (name, what), 'index (2020=100)', 'quarterly', pts, {'sourceGroup': 'Eurostat ' + ds}); n += 1
        log(ds, n, 'series')

def organic():
    """Agricultura ecológica. La superficie por cultivo (org_cropar) se queda en 2020 para Austria; se complementa con
    ganado ecológico (apro_mt_lsorg, hasta 2025), productos (org_aprod), operadores (org_coptyp), huevos (apro_ec_eggorg)
    y la superficie ecológica de la encuesta de estructura de explotaciones (ef_lus_org, 2010-2023)."""
    j = fetch('org_cropar', agprdmet='TOTAL'); recs, labs = records(j); by = {}
    keep = {'UAAXK0000': 'Utilised agricultural area', 'ARA': 'Arable land', 'C0000': 'Cereals', 'I1100': 'Oilseeds', 'R1000': 'Potatoes'}
    for r, v in recs:
        if r['crops'] in keep and r['unit'] == 'HA': by.setdefault(r['crops'], []).append((r['time'], v))
    for c, pts in by.items():
        put('at-organic-%s' % c.lower(), 'organic', 'Organic area (converted + in conversion): %s' % keep[c], 'ha', 'annual', pts, {'sourceGroup': 'Eurostat org_cropar'})
    n0 = len(OUT)
    # ganado ecológico
    j = fetch('apro_mt_lsorg'); recs, labs = records(j); by = {}
    for r, v in recs: by.setdefault((r['animals'], r['unit']), []).append((r['time'], v))
    for (a, u), pts in by.items():
        name = labs['animals'][a]
        if u == 'THS_HD': put('at-organic-ls-%s' % a.lower(), 'organic', 'Organic livestock: %s' % name, 'thousand head', 'annual', pts, {'sourceGroup': 'Eurostat apro_mt_lsorg'})
        elif u == 'PC_ORG': put('at-organic-lsshare-%s' % a.lower(), 'organic', 'Organic share of total: %s' % name, '%', 'annual', pts, {'sourceGroup': 'Eurostat apro_mt_lsorg'})
    # productos ecológicos
    j = fetch('org_aprod'); recs, labs = records(j); by = {}
    for r, v in recs: by.setdefault((r['agriprod'], r['unit']), []).append((r['time'], v))
    for (a, u), pts in by.items():
        put('at-organic-prod-%s' % a.lower(), 'organic', 'Organic production: %s' % labs['agriprod'][a], 'thousand' if u == 'THS' else 't', 'annual', pts, {'sourceGroup': 'Eurostat org_aprod'})
    # huevos ecológicos
    j = fetch('apro_ec_eggorg'); recs, labs = records(j); by = {}
    for r, v in recs: by.setdefault(r['unit'], []).append((r['time'], v))
    for u, pts in by.items():
        if u == 'MIO': put('at-organic-eggs', 'organic', 'Organic hens\' eggs', 'million', 'annual', pts, {'sourceGroup': 'Eurostat apro_ec_eggorg'})
        elif u == 'PC_ORG': put('at-organic-eggs-share', 'organic', 'Organic share of total: hens\' eggs', '%', 'annual', pts, {'sourceGroup': 'Eurostat apro_ec_eggorg'})
    # operadores ecológicos (registrados a fin de año)
    j = fetch('org_coptyp', procstat='REG_END'); recs, labs = records(j); by = {}
    for r, v in recs: by.setdefault(r['operator'], []).append((r['time'], v))
    for o, pts in by.items():
        put('at-organic-op-%s' % o.lower(), 'organic', 'Organic operators registered: %s' % labs['operator'][o], 'number', 'annual', pts, {'sourceGroup': 'Eurostat org_coptyp'})
    # encuesta de estructura (2010, 2013, 2016, 2020, 2023): superficie ecológica y nº de explotaciones
    j = fetch('ef_lus_org', statinfo='TOTAL', so_eur='TOTAL', uaarea='TOTAL'); recs, labs = records(j); by = {}
    for r, v in recs:
        if r['agriprod'] in ('UAAXK0000_ORG', 'ARAT_ORG', 'C0000T_ORG'): by.setdefault((r['agriprod'], r['unit']), []).append((r['time'], v))
    for (a, u), pts in by.items():
        nm = {'UAAXK0000_ORG': 'utilised agricultural area', 'ARAT_ORG': 'arable land', 'C0000T_ORG': 'cereals'}[a]
        put('at-organic-fss-%s-%s' % (a.lower(), u.lower()), 'organic', ('Organic holdings: %s (farm structure survey)' if u == 'HLD' else 'Organic area: %s (farm structure survey)') % nm, 'holdings' if u == 'HLD' else 'ha', 'annual', pts, {'sourceGroup': 'Eurostat ef_lus_org'}, max_age=4)
    log('ecologico', len(OUT) - n0 + len(by), 'series')

def main():
    for fn in (prices, quarterly, milk, slaughter, crops, herds, organic):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e))
    if len(OUT) < 20:
        log('demasiado pocas series'); open('data/austria-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'AT': {'name': 'Austria', 'source': {'name': 'Eurostat (official Austrian data: Statistik Austria / BMLUK)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (CC BY 4.0); cite source'}, 'series': list(OUT.values())}},
           'log': LOG[-30:]}
    json.dump(doc, open('data/austria-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/austria-log.txt', 'w').write('\n'.join(LOG)); log('series', len(OUT))
main()

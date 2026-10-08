#!/usr/bin/env python3
"""Nucleo comun de los scripts por pais que usan Eurostat (geo=XX): Italia y Polonia (update-italy-eurostat.py y update-poland-eurostat.py son envoltorios finos).
Cultivos, censos de ganado, sacrificio, leche, aves, indices de precios, precios absolutos y cuentas agrarias. Solo lo que Eurostat publica; ninguna serie se completa ni se estima.
Se omiten las series cortas (<3 puntos) o paradas (ultimo dato anterior a año-3). Unidades: miles de t / ha se convierten x1000 exacto.
Uso: from eurostat_country import run; run({geo, pfx, slug, name, source, extend}). Portugal tiene otra estructura y queda aparte."""
import datetime, json, re, sys, urllib.request, urllib.parse
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=180):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e
    raise RuntimeError('%s -> %s' % (u, last))
def es(ds, **flt):
    q = 'lang=EN&geo=' + CFG['geo'] + ''.join('&%s=%s' % (k, urllib.parse.quote(v)) for k, v in flt.items())
    j = json.loads(get(API + ds + '?' + q)); ids, size = j['id'], j['size']; cats = {}; labs = {}
    for d in ids:
        c = j['dimension'][d]['category']; idx = c['index']; o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        cats[d] = o; labs[d] = c.get('label', {})
    out = []
    for k, v in j.get('value', {}).items():
        k = int(k); rec = {}
        for d, n in reversed(list(zip(ids, size))): rec[d] = cats[d][k % n]; k //= n
        out.append((rec, v))
    return out, labs
OUT = {}
def put(sid, group, label, unit, freq, pts, src, mult=1, note=None):
    d = {}
    for p, v in pts:
        if v is not None: d[str(p)] = v * mult
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3: return False
    last, prev = pts[-1], pts[-2]
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=pts, sourceGroup=src)
    if note: s['periodNote'] = note
    OUT[sid] = s; return True
def clean(l): return re.sub(r'\s+', ' ', l).strip().replace(' - ', ', ')
KEEP = re.compile(r'\b(wheat|barley|maize|rye|oats|rice|rape|sunflower|soya|soy|potato|sugar beet|grape|wine|olive|cereal|oilseed|cattle|bovine|calves|pig|sheep|goat|poultry|chicken|egg|milk|butter|cheese|meat|beef|pork|animals|crop|total|fertili|energy|fuel|feed|seed|plant protection|pesticide)s?\b', re.I)
def keep(label): return not CFG.get('lite') or bool(KEEP.search(label))   # modo reducido (presupuesto de datos): solo los productos de la matriz y los totales
NEC = re.compile(r'n\.e\.c|^other\b|, other\b', re.I)
def crops():
    recs, labs = es('apro_cpsh1'); by = {}
    M = {'HPRD_HUMD_EU_THS_T': ('production', 'harvested production, EU standard humidity', 't', 1000), 'AR_THS_HA': ('area', 'cultivated area', 'ha', 1000), 'YLD_HUMD_EU_T_HA': ('yield', 'yield, EU standard humidity', 't/ha', 1)}
    for r, v in recs:
        if r['strucpro'] in M: by.setdefault((r['crops'], r['strucpro']), []).append((r['time'], v))
    n = 0
    for (c, sp), pts in by.items():
        if NEC.search(clean(labs['crops'][c])) or not keep(clean(labs['crops'][c])): continue   # categorias residuales («n.e.c.», «Other ...»): no identifican un cultivo
        k, txt, u, mu = M[sp]
        n += put(CFG['pfx'] + '-es-crop-%s-%s' % (c.lower(), k), 'crops', '%s: %s (Eurostat)' % (clean(labs['crops'][c]), txt), u, 'annual', pts, 'Eurostat apro_cpsh1 %s' % c, mu)
    log('cultivos', n, 'series')
def herds():
    n = 0
    for ds in ('apro_mt_lscatl', 'apro_mt_lspig', 'apro_mt_lssheep', 'apro_mt_lsgoat'):
        try:
            recs, labs = es(ds); by = {}
            for r, v in recs:
                if r['unit'] == 'THS_HD': by.setdefault((r['animals'], r['month']), []).append((r['time'], v))
            for (a, m), pts in by.items():
                n += put(CFG['pfx'] + '-es-herd-%s-%s' % (a.lower(), m.lower()), 'livestock', '%s (%s, Eurostat)' % (clean(labs['animals'][a]), clean(labs['month'].get(m, m))), 'head', 'annual', pts, 'Eurostat ' + ds, 1000)
        except Exception as e: log('ERROR', ds, repr(e)[:200])
    log('censos', n, 'series')
def slaughter():
    recs, labs = es('apro_mt_pann'); by = {}
    for r, v in recs:
        if r['meatitem'] in ('SLAUGHT', 'PRD', 'IMP', 'EXP') and r['unit'] in ('THS_T', 'THS_HD'): by.setdefault((r['meatitem'], r['meat'], r['unit']), []).append((r['time'], v))
    ML = {'SLAUGHT': 'slaughterings', 'PRD': 'gross indigenous production', 'IMP': 'imports', 'EXP': 'exports'}
    n = 0
    for (mi, m, u), pts in by.items():
        if mi in ('IMP', 'EXP') and u == 'THS_HD': continue
        n += put(CFG['pfx'] + '-es-meat-%s-%s-%s' % (mi.lower(), m.lower(), u.lower()), 'production', '%s: %s (%s, Eurostat)' % (clean(labs['meat'][m]), ML[mi], 'tonnes carcass weight' if u == 'THS_T' else 'head'), 't' if u == 'THS_T' else 'head', 'annual', pts, 'Eurostat apro_mt_pann %s' % m, 1000)
    log('carne', n, 'series')
def milk():
    n = 0
    recs, labs = es('apro_mk_colm'); by = {}
    for r, v in recs:
        if r['milkitem'] == 'PRD' and r['unit'] == 'THS_T': by.setdefault(r['dairyprod'], []).append((r['time'], v))
        elif r['milkitem'] in ('FAT', 'PTEN') and r['unit'] == 'PC' and r['dairyprod'] == 'D1110D': by.setdefault((r['milkitem'], r['dairyprod']), []).append((r['time'], v))
    for k, pts in by.items():
        if isinstance(k, tuple): n += put(CFG['pfx'] + '-es-milk-%s-%s' % (k[0].lower(), k[1].lower()), 'milk', '%s: %s content (monthly, Eurostat)' % (clean(labs['dairyprod'][k[1]]), 'fat' if k[0] == 'FAT' else 'protein'), '%', 'monthly', pts, 'Eurostat apro_mk_colm')
        else: n += put(CFG['pfx'] + '-es-milk-m-%s' % k.lower(), 'milk', '%s: production (monthly, Eurostat)' % clean(labs['dairyprod'][k]), 't', 'monthly', pts, 'Eurostat apro_mk_colm', 1000)
    recs, labs = es('apro_mk_cola'); by = {}
    for r, v in recs:
        if r['milkitem'] == 'PRD' and r['unit'] == 'THS_T': by.setdefault(r['dairyprod'], []).append((r['time'], v))
    for k, pts in by.items(): n += put(CFG['pfx'] + '-es-milk-a-%s' % k.lower(), 'milk', '%s: production (annual, Eurostat)' % clean(labs['dairyprod'][k]), 't', 'annual', pts, 'Eurostat apro_mk_cola', 1000)
    log('leche', n, 'series')
def poultry():
    recs, labs = es('apro_ec_poula'); by = {}
    for r, v in recs:
        if r['unit'] == 'THS': by.setdefault((r['hatchitm'], r['animals']), []).append((r['time'], v))
    n = 0
    for (h, a), pts in by.items():
        n += put(CFG['pfx'] + '-es-poultry-%s-%s' % (h.lower(), a.lower()), 'production', '%s: %s (Eurostat)' % (clean(labs['animals'][a]), clean(labs['hatchitm'][h])), 'head', 'annual', pts, 'Eurostat apro_ec_poula', 1000)
    log('aves', n, 'series')
def priceidx():
    recs, labs = es('apri_pi_outq', unit='I20'); by = {}
    for r, v in recs:
        if r['p_adj'] == 'NI': by.setdefault((r['am_item'], r['p_adj']), []).append((r['time'], v))   # solo nominal: el indice real (deflactado) duplica el numero de series sin dato nuevo
    n = 0; seen = set()
    for (a, p), pts in sorted(by.items()):
        nm = clean(labs['am_item'][a])
        if not keep(nm): continue
        key = (p, frozenset(re.findall(r'[a-z0-9]+', nm.lower())))
        if key in seen: nm += ' (code %s)' % a  # Eurostat repite el nombre en un subnivel («Other fresh fruit» / «Other fresh fruit - other»): el codigo los distingue
        seen.add(key)
        n += put(CFG['pfx'] + '-es-pidx-%s-%s' % (a.lower(), p.lower()), 'idx_perc', 'Output price index, %s: %s (2020=100, Eurostat)' % ('nominal' if p == 'NI' else 'real (deflated)', nm), 'index 2020=100', 'quarterly', pts, 'Eurostat apri_pi_outq %s' % a)
    log('indices de precios', n, 'series')
def absprices():
    n = 0
    for ds, dim, tag, grp in (('apri_ap_crpouta', 'prod_veg', 'crop', 'prices'), ('apri_ap_anouta', 'prod_ani', 'ani', 'prices_lv')):
        recs, labs = es(ds, currency='EUR'); by = {}
        for r, v in recs: by.setdefault(r[dim], []).append((r['time'], v))
        for c, pts in by.items():
            l = re.sub(r'\s+', ' ', labs[dim][c]).strip(); m = re.match(r'^(.*?)\s+-\s+prices\s+(.*)$', l)
            nm, un = (m.group(1), 'EUR ' + m.group(2)) if m else (l, 'EUR')
            nm = nm.replace(' - ', ', ')
            if not keep(nm): continue
            n += put(CFG['pfx'] + '-es-%s-%s' % (tag, c), grp, nm + ' (producer price, Eurostat)', un, 'annual', pts, 'Eurostat ' + ds)
    log('precios absolutos', n, 'series')
def accounts():
    recs, labs = es('aact_eaa01', unit='MIO_EUR', indic_agr='PRD_BP'); by = {}
    for r, v in recs: by.setdefault(r['am_item'], []).append((r['time'], v))
    n = 0
    for a, pts in by.items():
        if not keep(re.sub(r'\(.*','',clean(labs['am_item'][a]))): continue
        n += put(CFG['pfx'] + '-es-eaa-%s' % a.lower(), 'income', '%s (EUR million, current prices, Eurostat)' % clean(labs['am_item'][a]), 'EUR million', 'annual', pts, 'Eurostat aact_eaa01 %s PRD_BP' % a)
    log('cuentas agrarias', n, 'series')
def inputs():
    recs, labs = es('apri_pi_inq', unit='I20'); by = {}
    for r, v in recs:
        if r['p_adj'] == 'NI': by.setdefault(r['am_item'], []).append((r['time'], v))
    n = 0; seen = set()
    for a, pts in sorted(by.items()):
        nm = clean(labs['am_item'][a])
        if not keep(nm): continue
        key = frozenset(re.findall(r'[a-z0-9]+', nm.lower()))
        if key in seen: nm += ' (code %s)' % a
        seen.add(key)
        g = 'inputs_f' if re.search(r'fertili|nitrate|urea|phosphate|potash|ammonia|lime|compound', nm, re.I) and not re.search(r'feed', nm, re.I) else 'inputs_a' if re.search(r'feed|straw|hay|cake|meal|concentrate', nm, re.I) else 'inputs'
        n += put(CFG['pfx'] + '-es-inpidx-%s' % a.lower(), g, 'Input price index (prices paid by farmers), nominal: %s (2020=100, Eurostat)' % nm, 'index 2020=100', 'quarterly', pts, 'Eurostat apri_pi_inq %s' % a)
    log('indices de precios de insumos', n, 'series')
def fertiliser():
    recs, labs = es('aei_fm_usefert'); by = {}
    for r, v in recs:
        if r['unit'] == 'T': by.setdefault(r['nutrient'], []).append((r['time'], v))
    n = 0
    for k, pts in by.items(): n += put(CFG['pfx'] + '-es-fert-%s' % k.lower(), 'inputs_f', 'Consumption of inorganic fertilisers: %s (tonnes of nutrient, Eurostat)' % clean(labs['nutrient'][k]), 't', 'annual', pts, 'Eurostat aei_fm_usefert %s' % k)
    log('fertilizantes', n, 'series')
def labour():
    recs, labs = es('aact_ali01'); by = {}
    for r, v in recs:
        if r['unit'] == 'THS_AWU': by.setdefault(r['am_item'], []).append((r['time'], v))
    n = 0
    for k, pts in by.items(): n += put(CFG['pfx'] + '-es-ali-%s' % k.lower(), 'income', 'Agricultural labour input: %s (annual work units, Eurostat)' % clean(labs['am_item'][k]), 'AWU', 'annual', pts, 'Eurostat aact_ali01 %s' % k, 1000)
    log('empleo agrario', n, 'series')
ORG_KEEP = re.compile(r'^(utili[sz]ed agricultural area|arable|cereals|oilseeds|potatoes|permanent grassland|permanent crops|vineyards|grapes|olives|fruit|fresh vegetables|vegetables)', re.I)
def organic():
    n = 0
    recs, labs = es('org_cropar', agprdmet='TOTAL'); by = {}
    for r, v in recs:
        if r['unit'] == 'HA' and ORG_KEEP.match(clean(labs['crops'][r['crops']])): by.setdefault(r['crops'], []).append((r['time'], v))
    for c, pts in by.items(): n += put(CFG['pfx'] + '-es-organic-%s' % c.lower(), 'organic', 'Organic area (certified + in conversion): %s (Eurostat)' % clean(labs['crops'][c]), 'ha', 'annual', pts, 'Eurostat org_cropar %s' % c)
    recs, labs = es('org_lstspec'); by = {}
    for r, v in recs:
        if r['unit'] == 'HD': by.setdefault(r['animals'], []).append((r['time'], v))
    for a, pts in by.items(): n += put(CFG['pfx'] + '-es-organic-ls-%s' % a.lower(), 'organic', 'Organic livestock: %s (head, Eurostat)' % clean(labs['animals'][a]), 'head', 'annual', pts, 'Eurostat org_lstspec %s' % a)
    log('ecologico', n, 'series')
def slaughter_m():
    recs, labs = es('apro_mt_pwgtm', meatitem='SLAUGHT'); by = {}
    for r, v in recs:
        if r['unit'] in ('THS_T', 'THS_HD'): by.setdefault((r['meat'], r['unit']), []).append((r['time'], v))
    n = 0
    for (m, u), pts in by.items():
        n += put(CFG['pfx'] + '-es-meatm-%s-%s' % (m.lower(), u.lower()), 'production', '%s: slaughterings, monthly (%s, Eurostat)' % (clean(labs['meat'][m]), 'tonnes carcass weight' if u == 'THS_T' else 'head'), 't' if u == 'THS_T' else 'head', 'monthly', pts, 'Eurostat apro_mt_pwgtm %s' % m, 1000)
    log('sacrificio mensual', n, 'series')
def main():
    for fn in (crops, herds, slaughter, slaughter_m, milk, poultry, priceidx, absprices, accounts, inputs, fertiliser, labour, organic):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:300])
    if len(OUT) < 50:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/%s-eurostat-log.txt' % CFG['slug'], 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': CFG['source'], 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
    ctry = {'name': CFG['name'], 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}
    if CFG.get('extend'): ctry = {'name': CFG['name'], 'extend': True, 'source': src, 'series': ctry['series']}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {CFG['geo']: ctry}, 'log': LOG[-30:]}
    json.dump(doc, open('data/%s-eurostat-stats.json' % CFG['slug'], 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/%s-eurostat-log.txt' % CFG['slug'], 'w').write('\n'.join(LOG) + '\n'); log('series', len(OUT))
def collect(cfg, minimum=15):
    """Varios paises en una ejecucion (update-eurostat-eu.py): devuelve las series de un pais o None si salen menos de `minimum`."""
    global CFG
    CFG = cfg; OUT.clear()
    for fn in (crops, herds, slaughter, slaughter_m, milk, priceidx, absprices, accounts, inputs, fertiliser, labour) + ((poultry,) if not cfg.get('lite') else ()) + (() if cfg.get('lite') else (organic,)):
        try: fn()
        except Exception as e: log('ERROR', cfg['geo'], fn.__name__, repr(e)[:300])
    log(cfg['geo'], 'series', len(OUT))
    return sorted(OUT.values(), key=lambda s: s['id']) if len(OUT) >= minimum else None
def run(cfg):
    """cfg: geo (IT/PL), pfx (prefijo de los ids), slug (italy/poland: ficheros data/<slug>-eurostat-*), name, source (nombre de la fuente), extend (bool)."""
    global CFG
    CFG = cfg; main()

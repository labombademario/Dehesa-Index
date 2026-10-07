#!/usr/bin/env python3
"""Profundidad con Eurostat para ES, FR, DK, NL, BE, DE y el agregado UE-27 (EU27_2020 -> EU) (DE: solo indices de precios de avena, soja, arroz, mantequilla y queso) (NL: solo precios e insumos; BE: sin censos ni sacrificio) -> data/eurostat-depth-stats.json (countries.ES/FR/DK, extend)
Francia: produccion (cultivos, censos, sacrificio, leche), indices de precios e insumos. Espana y Dinamarca: solo indices de precios de produccion e insumos (su produccion ya sale de MAPA y Statistics Denmark).
Solo los productos de la matriz de cobertura (cereales, oleaginosas, patata, remolacha, vid, olivo, vacuno, porcino, ovino, aves, leche) y los insumos clave: cultivos, censos, sacrificio, leche, indices de precios de produccion y de insumos. Complementa las fuentes nacionales (tier 1); las duplicadas las ordena el registro de series.
Cultivos, censos de ganado, sacrificio, leche, aves, indices de precios, precios absolutos y cuentas agrarias. Solo lo que Eurostat publica; ninguna serie se completa ni se estima.
Se omiten las series cortas (<3 puntos) o paradas (ultimo dato anterior a año-3). Unidades: miles de t / ha se convierten x1000 exacto."""
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
GEOS = ['ES', 'FR', 'DK', 'NL', 'BE', 'DE', 'EU27_2020']; NAMES = {'EU': 'European Union', 'DE': 'Germany', 'ES': 'Spain', 'FR': 'France', 'DK': 'Denmark', 'NL': 'Netherlands', 'BE': 'Belgium'}
NEW = ('NL', 'BE', 'EU')   # precios absolutos de productor y aves: solo para los paises anadidos despues, para no tocar las series ya publicadas de ES, FR y DK
def es(ds, geos=None, **flt):
    q = 'lang=EN' + ''.join('&geo=' + g for g in (geos or GEOS)) + ''.join('&%s=%s' % (k, urllib.parse.quote(v)) for k, v in flt.items())
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
        if rec.get('geo') == 'EU27_2020': rec['geo'] = 'EU'   # agregado UE-27 de Eurostat: entidad 'EU' de la matriz
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
def sid(g, *a): return '-'.join([g.lower(), 'eus'] + [str(x).lower() for x in a])
CROP_RX = re.compile(r'^(common wheat|durum|barley|oats|rye|grain maize|rice|rape|sunflower|soya|potatoes|sugar beet|olives|grapes for wines?|apples|tomatoes|oranges|total cereals|cereals \(including rice\)|cereals for the production of grain)', re.I)
def crops():
    recs, labs = es('apro_cpsh1'); by = {}
    M = {'HPRD_HUMD_EU_THS_T': ('production', 'harvested production, EU standard humidity', 't', 1000), 'AR_THS_HA': ('area', 'cultivated area', 'ha', 1000), 'YLD_HUMD_EU_T_HA': ('yield', 'yield, EU standard humidity', 't/ha', 1)}
    for r, v in recs:
        if r['strucpro'] in M and CROP_RX.match(clean(labs['crops'][r['crops']])): by.setdefault((r['geo'], r['crops'], r['strucpro']), []).append((r['time'], v))
    n = 0
    for (g, c, sp), pts in by.items():
        k, txt, u, mu = M[sp]
        n += put(sid(g, 'crop', c, k), 'crops', '%s: %s (Eurostat)' % (clean(labs['crops'][c]), txt), u, 'annual', pts, 'Eurostat apro_cpsh1 %s' % c, mu)
    log('cultivos', n, 'series')
HERD_RX = re.compile(r'^(live bovine animals|dairy cows|live swine|breeding sows|live sheep|live goats|sheep and goats)', re.I)
def herds():
    n = 0
    for ds in ('apro_mt_lscatl', 'apro_mt_lspig', 'apro_mt_lssheep', 'apro_mt_lsgoat'):
        try:
            recs, labs = es(ds); by = {}
            for r, v in recs:
                if r['unit'] == 'THS_HD' and HERD_RX.match(clean(labs['animals'][r['animals']])): by.setdefault((r['geo'], r['animals'], r['month']), []).append((r['time'], v))
            for (g, a, m), pts in by.items():
                n += put(sid(g, 'herd', a, m), 'livestock', '%s (%s, Eurostat)' % (clean(labs['animals'][a]), clean(labs['month'].get(m, m))), 'head', 'annual', pts, 'Eurostat ' + ds, 1000)
        except Exception as e: log('ERROR', ds, repr(e)[:200])
    log('censos', n, 'series')
MEAT_RX = re.compile(r'^(bovine meat|pig ?meat|sheep ?meat|poultry|chicken|turkey|total meat|meat, total)', re.I)
def slaughter():
    n = 0
    for ds, fq, t in (('apro_mt_pann', 'annual', None), ('apro_mt_pwgtm', 'monthly', None)):
        recs = []; labs = {}; by = {}
        for g0 in GEOS:   # un pais por peticion: con el agregado UE-27 la consulta mensual conjunta devolvia HTTP 413
            try:
                r0, l0 = es(ds, geos=[g0], meatitem='SLAUGHT'); recs += r0
                for dk, dv in l0.items(): labs.setdefault(dk, {}).update(dv)
            except Exception as e: log('ERROR', ds, g0, repr(e)[:120])
        for r, v in recs:
            if r['unit'] in ('THS_T', 'THS_HD') and MEAT_RX.match(clean(labs['meat'][r['meat']])): by.setdefault((r['geo'], r['meat'], r['unit']), []).append((r['time'], v))
        for (g, m, u), pts in by.items():
            n += put(sid(g, 'meat', fq[0], m, u), 'production', '%s: slaughterings%s (%s, Eurostat)' % (clean(labs['meat'][m]), ', monthly' if fq == 'monthly' else '', 'tonnes carcass weight' if u == 'THS_T' else 'head'), 't' if u == 'THS_T' else 'head', fq, pts, 'Eurostat %s %s' % (ds, m), 1000)
    log('carne', n, 'series')
def milk():
    n = 0
    for ds, fq in (('apro_mk_colm', 'monthly'), ('apro_mk_cola', 'annual')):
        recs, labs = es(ds); by = {}
        for r, v in recs:
            if r['milkitem'] == 'PRD' and r['unit'] == 'THS_T': by.setdefault((r['geo'], r['dairyprod']), []).append((r['time'], v))
        for (g, d), pts in by.items():
            n += put(sid(g, 'milk', fq[0], d), 'milk', '%s: production (%s, Eurostat)' % (clean(labs['dairyprod'][d]), fq), 't', fq, pts, 'Eurostat %s %s' % (ds, d), 1000)
    log('leche', n, 'series')
PI_RX = re.compile(r'wheat|barley|maize|oats|rye|rice|rape|soya|sunflower|potato|sugar beet|fresh fruit|fruit|olive|wine|milk|eggs|cattle|pigs|sheep|poultry|cereals|animals|plant products', re.I)
def priceidx():
    recs, labs = es('apri_pi_outq', unit='I20'); by = {}
    for r, v in recs:
        if r['p_adj'] == 'NI' and PI_RX.search(clean(labs['am_item'][r['am_item']])): by.setdefault((r['geo'], r['am_item']), []).append((r['time'], v))
    n = 0; seen = {}
    for (g, a), pts in sorted(by.items()):
        nm = clean(labs['am_item'][a]); key = (g, frozenset(re.findall(r'[a-z0-9]+', nm.lower())))
        if key in seen: nm += ' (code %s)' % a
        seen[key] = 1
        n += put(sid(g, 'pidx', a), 'idx_perc', 'Output price index, nominal: %s (2020=100, Eurostat)' % nm, 'index 2020=100', 'quarterly', pts, 'Eurostat apri_pi_outq %s' % a)
    log('indices de precios', n, 'series')
IN_RX = re.compile(r'^(input total|goods and services currently consumed|energy; lubricants|electricity|fuels for heating|motor fuels|fertilisers and soil improvers|straight fertilisers|nitrogenous|phosphatic|potassic|compound fertilisers|animal feedingstuffs|straight feedingstuffs|compound feedingstuffs$|plant protection products|veterinary)', re.I)
def inputs():
    recs, labs = es('apri_pi_inq', unit='I20'); by = {}
    for r, v in recs:
        if r['p_adj'] == 'NI' and IN_RX.match(clean(labs['am_item'][r['am_item']])): by.setdefault((r['geo'], r['am_item']), []).append((r['time'], v))
    n = 0
    for (g, a), pts in sorted(by.items()):
        nm = clean(labs['am_item'][a])
        gr = 'inputs_f' if re.search(r'fertili|nitrogenous|phosphatic|potassic', nm, re.I) else 'inputs_a' if re.search(r'feed', nm, re.I) else 'inputs'
        n += put(sid(g, 'inpidx', a), gr, 'Input price index (prices paid by farmers), nominal: %s (2020=100, Eurostat)' % nm, 'index 2020=100', 'quarterly', pts, 'Eurostat apri_pi_inq %s' % a)
    log('insumos', n, 'series')
NAT = ('ES', 'DK', 'NL')   # NL: produccion ya del CBS
DUP = ('dk-eus-crop-f1110-', 'dk-eus-crop-r2000-area', 'dk-eus-meat-a-b4100-')
def absprices():
    n = 0
    for ds, dim, tag, grp in (('apri_ap_crpouta', 'prod_veg', 'crop', 'prices'), ('apri_ap_anouta', 'prod_ani', 'ani', 'prices_lv')):
        recs, labs = es(ds, currency='EUR'); by = {}
        for r, v in recs:
            if r['geo'] in NEW: by.setdefault((r['geo'], r[dim]), []).append((r['time'], v))
        for (g, c), pts in by.items():
            l = re.sub(r'\s+', ' ', labs[dim][c]).strip(); m = re.match(r'^(.*?)\s+-\s+prices\s+(.*)$', l)
            nm, un = (m.group(1), 'EUR ' + m.group(2)) if m else (l, 'EUR')
            nm = nm.replace(' - ', ', '); n += put(sid(g, 'abs', tag, c), grp, nm + ' (producer price, Eurostat)', un, 'annual', pts, 'Eurostat ' + ds)
    log('precios absolutos', n, 'series')
def poultry():
    recs, labs = es('apro_ec_poula'); by = {}
    for r, v in recs:
        if r['unit'] == 'THS' and r['geo'] in NEW: by.setdefault((r['geo'], r['hatchitm'], r['animals']), []).append((r['time'], v))
    n = 0
    for (g, h, a), pts in by.items():
        n += put(sid(g, 'poultry', h, a), 'production', '%s: %s (Eurostat)' % (clean(labs['animals'][a]), clean(labs['hatchitm'][h])), 'head', 'annual', pts, 'Eurostat apro_ec_poula', 1000)
    log('aves', n, 'series')

def dairy_eu():
    """Mantequilla y queso producidos por las lecheras de la UE-27 (apro_mk_pobta, 'Products obtained'). El codigo se busca por su nombre, no se supone."""
    recs, labs = es('apro_mk_pobta', geos=['EU27_2020'], milkitem='PRO'); n = 0
    for tag, rx in (('butter', r'^butter\b'), ('cheese', r'^cheese\b')):
        codes = [c for c, l in labs['dairyprod'].items() if re.match(rx, l.strip(), re.I)]
        if not codes: log('apro_mk_pobta: sin categoria', tag, '; etiquetas:', list(labs['dairyprod'].values())[:30]); continue
        code = codes[0]; log('lacteo UE', tag, '=', code, labs['dairyprod'][code], '(%d candidatos)' % len(codes))
        pts = [(r['time'], v) for r, v in recs if r['dairyprod'] == code]
        n += put('eu-eus-dairy-%s-production' % tag, 'production', '%s: production by dairies, EU-27 (Eurostat)' % tag.capitalize(), 't', 'annual', pts, 'Eurostat apro_mk_pobta %s' % code, 1000)
    log('lacteos UE', n, 'series')
COMEXT = 'https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/ds-045409'
# (codigo SA, nombre; sin las palabras milk/dairy/cream en butter y cheese, para que la etiqueta no cuente tambien como leche)
TRADE_HS = (('0405', 'Butter and spreads'), ('0406', 'Cheese and curd'), ('0407', "Birds' eggs in shell"), ('31', 'Fertilisers'), ('08', 'Edible fruit and nuts'), ('1004', 'Oats'), ('0701', 'Potatoes, fresh or chilled'),
            ('1002', 'Rye'), ('0104', 'Sheep and goats, live'), ('0204', 'Meat of sheep or goats'), ('2204', 'Wine of fresh grapes'))
def trade_eu():
    """Comercio exterior de la UE-27 con terceros paises (Comext ds-045409, socio EXT_EU27_2020), cantidad en 100 kg -> t (x0,1 exacto), anual. El ano en curso se omite (incompleto)."""
    n = 0; year = datetime.date.today().year
    for hs, nm in TRADE_HS:
        for flow, fl in (('1', 'imports'), ('2', 'exports')):
            q = '?lang=EN&reporter=EU27_2020&partner=EXT_EU27_2020&product=%s&flow=%s&freq=A&indicators=QUANTITY_IN_100KG' % (hs, flow)
            try: j = json.loads(get(COMEXT + q))
            except Exception as e: log('ERROR comext', hs, flow, repr(e)[:150]); continue
            tc = j['dimension']['time']['category']['index']; tl = [None] * len(tc)
            for k, v in (tc.items() if isinstance(tc, dict) else enumerate(tc)): tl[v if isinstance(tc, dict) else k] = k if isinstance(tc, dict) else v
            pts = []
            for k, v in j.get('value', {}).items():
                t = tl[int(k) % len(tl)]
                if t and t.isdigit() and int(t) < year and v is not None: pts.append((t, v))
            n += put('eu-eus-trade-%s-%s' % (hs, fl[0]), 'trade', '%s (HS %s): extra-EU-27 %s, quantity (Eurostat Comext)' % (nm, hs, fl), 't', 'annual', pts, 'Eurostat Comext ds-045409 %s' % hs, 0.1)
    log('comercio UE', n, 'series')
def main():
    for fn in (crops, herds, slaughter, milk, poultry, absprices, priceidx, inputs, trade_eu):   # dairy_eu (apro_mk_pobta UE-27) no se usa: la fuente solo llega a 2018-2021 para mantequilla y queso
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:300])
    for k in [k for k in OUT if k.split('-')[0].upper() in NAT and OUT[k]['group'] in ('crops', 'livestock', 'production', 'milk')]: del OUT[k]   # ES y DK ya publican su produccion con fuente nacional (MAPA, Statistics Denmark): aqui solo lo que les falta (indices de precios de produccion e insumos)
    for k in [k for k in OUT if k.startswith('be-eus-') and (OUT[k]['group'] == 'livestock' or k.startswith('be-eus-meat-'))]: del OUT[k]   # BE: censos y sacrificio ya salen de Statbel; aqui solo cultivos, leche, aves, precios e insumos
    for k in [k for k in OUT if k.startswith('de-eus-') and not (OUT[k]['group'] == 'idx_perc' and re.search(r'\b(oats?|soya?|rice|butter|cheese)\b', OUT[k]['label'].split(': ', 1)[-1], re.I))]: del OUT[k]   # DE: Destatis ya publica sus indices y produccion; de Eurostat solo los indices de precios de los productos que Destatis no trae
    for k in [k for k in OUT if k.startswith(DUP)]: del OUT[k]   # ya publicadas por eu-gapfill (mismas series de Eurostat): evita duplicados en el registro
    if len(OUT) < 60:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/eurostat-depth-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    by = {}
    for s in OUT.values(): by.setdefault(s['id'].split('-')[0].upper(), []).append(s)
    src = {'name': 'Eurostat (official national data via Eurostat)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {cc: {'name': NAMES[cc], 'extend': True, 'source': src, 'series': sorted(v, key=lambda s: s['id'])} for cc, v in sorted(by.items())}, 'log': LOG[-30:]}
    json.dump(doc, open('data/eurostat-depth-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/eurostat-depth-log.txt', 'w').write('\n'.join(LOG) + '\n'); log('series', len(OUT), {c: len(v) for c, v in by.items()})
main()

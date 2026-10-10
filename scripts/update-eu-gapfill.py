#!/usr/bin/env python3
"""Huecos de cobertura con fuente oficial armonizada -> data/eu-gapfill-stats.json (countries.DE/NL/DK, extend)
Solo lo que el pais no publica ya por otra via en la web (ver claude/huecos-taxonomia-pac-5-oct.md):
  - Eurostat apro_mk_pobta: mantequilla producida (DE, NL). El codigo se busca por su nombre ('Butter'), no se supone.
  - Eurostat apro_cpsh1: soja (DE, NL); manzana y pera (DK), produccion en humedad estandar UE y superficie.
  - Eurostat apro_mt_pann: carne de ovino sacrificada (DK), toneladas en canal y cabezas.
  - Destatis 41253-0001 (cosecha de mosto de vino, 1991-) por la descarga publica (Datenlizenz Deutschland 2.0).
Todo como lo publica la fuente (miles de t -> t, x1000 exacto). Si un bloque falla se registra y el resto sigue; si no sale casi nada no se escribe."""
import datetime, json, re, sys, urllib.request, urllib.parse
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=120):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e
    raise RuntimeError('%s -> %s' % (u, last))
def es(ds, geos, **flt):
    q = 'lang=EN' + ''.join('&geo=' + g for g in geos) + ''.join('&%s=%s' % (k, urllib.parse.quote(v)) for k, v in flt.items())
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
def put(cc, sid, group, label, unit, pts, src, note=None):
    d = {str(p): v for p, v in pts if v is not None}
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3: log('omitida (corta o antigua)', sid, pts[-1][0] if pts else '-'); return
    last, prev = pts[-1], pts[-2]
    s = dict(id=sid, group=group, label=label, unit=unit, frequency='annual', latestPeriod=last[0], latest=last[1], changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=pts, sourceGroup=src)
    if note: s['periodNote'] = note
    OUT.setdefault(cc, {})[sid] = s
def butter():
    recs, labs = es('apro_mk_pobta', ['DE', 'NL'], milkitem='PRO')
    code = next((c for c, l in labs['dairyprod'].items() if re.match(r'^butter\b', l, re.I)), None)
    if not code: raise RuntimeError('apro_mk_pobta: no hay categoria Butter; etiquetas: %s' % list(labs['dairyprod'].values())[:40])
    log('mantequilla = %s (%s)' % (code, labs['dairyprod'][code]))
    by = {}
    for r, v in recs:
        if r['dairyprod'] == code: by.setdefault(r['geo'], []).append((r['time'], None if v is None else v * 1000))
    for g, pts in by.items(): put(g, '%s-es-butter-production' % g.lower(), 'production', 'Butter production by dairies (Eurostat)', 't', pts, 'Eurostat apro_mk_pobta')
CROPS = [(['DE', 'NL'], r'^soya', 'soy', 'Soya beans'), (['DK'], r'^apples$', 'apples', 'Fruit: apples'), (['DK'], r'^pears$', 'pears', 'Fruit: pears')]
def crops():
    for geos, rx, key, nm in CROPS:
        recs, labs = es('apro_cpsh1', geos)
        code = next((c for c, l in labs['crops'].items() if re.match(rx, l.strip(), re.I)), None)
        if not code: log('apro_cpsh1: sin categoria para', nm); continue
        by = {}
        for r, v in recs:
            if r['crops'] != code: continue
            if r['strucpro'] == 'HPRD_HUMD_EU_THS_T': by.setdefault((r['geo'], 'prod'), []).append((r['time'], None if v is None else v * 1000))
            elif r['strucpro'] == 'AR_THS_HA': by.setdefault((r['geo'], 'area'), []).append((r['time'], None if v is None else v * 1000))
        for (g, m), pts in by.items():
            if g == 'NL' and key == 'soy': log('NL soja omitida: superficie minima y produccion declarada 0 (no significativa)'); continue
            put(g, '%s-es-%s-%s' % (g.lower(), key, m), 'crops', '%s: %s (Eurostat)' % (nm, 'harvested production, EU standard humidity' if m == 'prod' else 'cultivated area'), 't' if m == 'prod' else 'ha', pts, 'Eurostat apro_cpsh1 %s' % code)
def sheep():
    recs, labs = es('apro_mt_pann', ['DK'], meatitem='SLAUGHT', meat='B4100')
    by = {}
    for r, v in recs:
        if r['unit'] in ('THS_T', 'THS_HD'): by.setdefault(r['unit'], []).append((r['time'], None if v is None else v * 1000))
    for u, pts in by.items():
        put('DK', 'dk-es-sheep-slaughter-%s' % ('t' if u == 'THS_T' else 'head'), 'production', 'Sheepmeat: slaughterings (%s, Eurostat)' % ('carcass weight' if u == 'THS_T' else 'head'), 't' if u == 'THS_T' else 'head', pts, 'Eurostat apro_mt_pann B4100')
def destatis(tb):
    b = get('https://genesis.destatis.de/genesisWS/downloads/00/tables/%s_00.csv' % tb)
    try: t = b.decode('utf-8')
    except Exception: t = b.decode('latin-1')
    return [l.split(';') for l in t.splitlines()]
def num(x):
    x = (x or '').strip().replace('.', '').replace(',', '.')
    try: return float(x)
    except ValueError: return None
def wine():
    rows = destatis('41253-0001')
    hdr = next(r for r in rows if any(c.strip() == 'Erntemenge an Weinmost' for c in r))   # fila de magnitudes (no el titulo)
    top = rows[rows.index(hdr) - 1]   # fila de tipo de mosto (Weißmost/Rotmost/Insgesamt)
    col = next(i for i in range(len(hdr)) if hdr[i].strip() == 'Erntemenge an Weinmost' and top[i].strip() == 'Insgesamt')
    area = next(i for i in range(len(hdr)) if hdr[i].strip() == 'Rebfläche im Ertrag' and top[i].strip() == 'Insgesamt')
    pr, ar = [], []
    for r in rows:
        if r and re.match(r'^\d{4}$', r[0].strip()): pr.append((r[0].strip(), num(r[col]))); ar.append((r[0].strip(), num(r[area])))
    put('DE', 'de-destatis-wine-must-harvest', 'production', 'Wine must harvest (Destatis, hectolitres)', 'hl', pr, 'Destatis 41253-0001', 'Grape must harvested for wine; not the same as finished wine')
    put('DE', 'de-destatis-wine-vineyard-area', 'crops', 'Wine: vineyard area in yield (Destatis)', 'ha', ar, 'Destatis 41253-0001')
    # existencias de vino (41255-0001) no se ingieren: una sola serie de existencias haria creer al motor de cobertura que Alemania publica existencias de todo
EVID = {}
EV_CHECKS = [('DE', 'rice', r'^rice\b'), ('DK', 'wine', r'^grapes for wines?\b'), ('NL', 'wine', r'^grapes for wines?\b'), ('NL', 'soy', r'^soya')] + [(c, k, r) for c in ('FI', 'IE') for k, r in (('maize', r'^grain maize'), ('rice', r'^rice\b'), ('soy', r'^soya'), ('olive', r'^olives'))] + [('IE', 'rye', r'^rye'), ('IE', 'sugar', r'^sugar beet')] + [('DE', 'olive', r'^olives'), ('EL', 'soy', r'^soya'), ('EL', 'rapeseed', r'^rape')]
EV_CHECKS += [(c, k, r) for c in ('PL', 'AT', 'NL', 'DK') for k, r in (('rice', r'^rice\b'), ('olive', r'^olives'))] + [('NL', 'oats', r'^oats'), ('NL', 'rye', r'^rye'), ('DK', 'soy', r'^soya'), ('AT', 'olive', r'^olives'), ('PT', 'rapeseed', r'^rape'), ('PT', 'soy', r'^soya')]   # 10-oct-2026: PL, AT, NL, DK y PT
def evidence():
    """Prueba para clasificar huecos como «no aplica» o «no significativo»: superficie y produccion que publica Eurostat (apro_cpsh1), o que no publica nada."""
    recs, labs = es('apro_cpsh1', sorted(set(c for c, _, _ in EV_CHECKS)))
    for cc, key, rx in EV_CHECKS:
        code = next((c for c, l in labs['crops'].items() if re.match(rx, l.strip(), re.I)), None)
        e = {'dataset': 'apro_cpsh1', 'crop': code, 'label': labs['crops'].get(code) if code else None, 'checked': datetime.date.today().isoformat()}
        for m, sp in (('area_ha', 'AR_THS_HA'), ('prod_t', 'HPRD_HUMD_EU_THS_T')):
            pts = sorted((r['time'], v) for r, v in recs if code and r['crops'] == code and r['geo'] == cc and r['strucpro'] == sp and v is not None)
            e[m] = {'latestYear': pts[-1][0], 'latest': round(pts[-1][1] * 1000, 1), 'max': round(max(v for _, v in pts) * 1000, 1), 'years': len(pts)} if pts else None
        EVID['%s/%s' % (cc, key)] = e; log('evidencia', cc, key, json.dumps(e, ensure_ascii=False))
NAMES = {'DE': 'Germany', 'NL': 'Netherlands', 'DK': 'Denmark'}
def main():
    for fn in (butter, crops, sheep, wine, evidence):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:300])
    n = sum(len(v) for v in OUT.values())
    if n < 4:
        log('demasiado pocas series (%d); no se escribe nada' % n); open('data/eu-gapfill-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'Eurostat and Destatis (official harmonised and national statistics)', 'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); Destatis: Datenlizenz Deutschland – Namensnennung – 2.0'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {cc: {'name': NAMES[cc], 'extend': True, 'source': src, 'series': sorted(v.values(), key=lambda s: s['id'])} for cc, v in sorted(OUT.items())}, 'evidence': EVID, 'log': LOG[-30:]}
    json.dump(doc, open('data/eu-gapfill-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/eu-gapfill-log.txt', 'w').write('\n'.join(LOG) + '\n'); log('series', n)
main()

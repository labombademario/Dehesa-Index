#!/usr/bin/env python3
"""Capa de datos unificada: Registro de series -> Manifiesto -> pais/producto/metrica -> fichero pequeno.
Genera, a partir de los data/*-stats.json (que siguen siendo la fuente de verdad):
  data/catalog/manifest.json      pequeno: paises -> metricas (grupos) -> ficheros, recuentos, producto(s) y niveles de fuente
  data/catalog/<CC>.json          metadatos de TODAS las series de un pais (sin puntos): id, etiqueta, unidad, frecuencia, ultimo dato, tier, tags, fichero
  data/series/<CC>/<grupo>.json   los puntos de las series de ese pais y metrica (se parte en trozos de ~SHARD_MAX bytes)
Un cliente descarga el manifiesto (pocos KB), luego el catalogo del pais y por ultimo solo el trozo que necesita; nunca el dataset entero.
Solo reescribe los ficheros que cambian."""
import datetime, hashlib, json, re, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_index import ROOT, STATS
import freshness as FR
SHARD_MAX = 450_000
TAGS = [('wheat', r'wheat|trigo|blé|\bble\b|frumento'), ('maize', r'maize|corn|ma[ií]z|mais'), ('barley', r'barley|cebada|orge'), ('oats', r'\boats?\b|avena'), ('rye', r'\brye\b|centeno'), ('rapeseed', r'rapeseed|canola|colza'),
        ('soy', r'soy|soja'), ('rice', r'\brice\b|arroz|riz'), ('milk', r'milk|leche|lait|dairy|l[aá]cte'), ('butter', r'butter|mantequilla|beurre'), ('cheese', r'cheese|queso|fromage'),
        ('cattle', r'cattle|beef|vacuno|bovin|calf|veal|cow|steer|heifer|bull'), ('pigs', r'\bpigs?\b|pork|porcin|cerdo|swine|hog'), ('sheep', r'sheep|lamb|ovin|cordero|goat|caprin'),
        ('poultry', r'poultry|chicken|broiler|pollo|volaille|turkey'), ('eggs', r'\beggs?\b|huevo|oeuf'), ('olive', r'olive|aceite|azeite|olio'), ('sugar', r'sugar|az[uú]car|beet|remolacha|sucre'),
        ('potato', r'potato|patata|pomme de terre'), ('fertilizer', r'fertili[sz]|urea|nitrogen|phosph|potash|abono'), ('energy', r'diesel|energy|fuel|electric|gas\b'), ('wine', r'\bwine\b|vino|vin\b'),
        ('fruit', r'fruit|apple|orange|tomato|vegetable|lettuce|hortaliza|fruta')]
TAGS = [(k, re.compile(v, re.I)) for k, v in TAGS]
def tags(label): return [k for k, rx in TAGS if rx.search(label)]
SPECIAL = {'EL': 'Greece', 'UK': 'United Kingdom', 'EU': 'European Union', 'EU+UK': 'EU and UK (average)', 'EU-UK': 'EU excluding UK (average)', 'EU Average': 'EU average', 'EU13': 'EU-13 (Member States since 2004)', 'EU14': 'EU-14 (EU-15 without UK)', 'EU15': 'EU-15 (members before 2004)', 'Region 1': 'Sugar region 1', 'Region 2': 'Sugar region 2', 'Region 3': 'Sugar region 3'}
def slug(cc): return re.sub(r'[^A-Za-z0-9]+', '_', cc.replace('+', 'plus')).strip('_')
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
def write_if_changed(path, text, written):
    path.parent.mkdir(parents=True, exist_ok=True); written.add(path.resolve())
    try:
        if path.read_text() == text: return False
    except Exception: pass
    path.write_text(text); return True
LIC = json.loads((ROOT / 'data/license-registry.json').read_text(encoding='utf-8'))  # estricto: sin registro de licencias no hay catalogo
LIC_ALIAS = {}
for _k, _v in LIC['sources'].items():
    LIC_ALIAS[_k] = _k
    for _a in _v.get('aliases', []): LIC_ALIAS[_a] = _k
def lic(sid):
    """(sourceId canonico, licenseId) de una fuente del registro; detiene el build si no existe."""
    k = LIC_ALIAS.get(sid)
    if not k: raise KeyError('sourceId %r no esta en data/license-registry.json' % sid)
    return k, LIC['sources'][k]['licenseId']
def stats_source(n, cc, s):
    m = LIC['files'].get('data/%s.json' % n)
    if not m: raise KeyError('data/%s.json sin entrada en el registro de licencias' % n)
    if cc in m.get('byCountry', {}): return m['byCountry'][cc]
    for pf, sid in m.get('bySourceGroupPrefix', {}).items():
        if (s.get('sourceGroup') or '').startswith(pf): return sid
    if m.get('default'): return m['default']
    raise KeyError('%s: %s/%s sin fuente en el registro de licencias' % (n, cc, s.get('id')))
BLK = {'markets': ['quotes', 'prices', 'prices_lv', 'prices_fv', 'milk', 'milk_regions', 'meat_regions'], 'production': ['production', 'crops', 'livestock', 'stocks', 'environment', 'organic'], 'trade': ['trade', 'partners'],
       'inputs': ['inputs', 'inputs_f', 'inputs_a', 'costs', 'prices_paid', 'idx_perc', 'idx_pag', 'income']}
MAXAGE = {'daily': 10, 'weekly': 25, 'monthly': 80, 'quarterly': 160, 'semiannual': 220, 'annual': 520}
def pms(p):
    """Misma lectura de periodos que js/perfil-pais.js (pms): ms UTC o None."""
    m = re.match(r'^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?(?:-(\d{2}))?$', str(p or ''))
    if not m: return None
    mo = 0
    if m.group(2): mo = (int(m.group(2)[1]) - 1) * 3 if m.group(2)[0] == 'Q' else (int(m.group(2)[1]) - 1) * 6 if m.group(2)[0] == 'S' else int(m.group(2)) - 1
    return datetime.datetime(int(m.group(1)), mo + 1, int(m.group(3) or 1), tzinfo=datetime.timezone.utc).timestamp() * 1000
def coverage(rows, now_ms):
    """Coverage Score (amplitud, frescura, profundidad, frecuencia): MISMA formula que DIProfile.coverage (js/perfil-pais.js); scripts/test-coverage-parity.mjs lo comprueba."""
    blocks = sum(1 for k in ('markets', 'production', 'trade', 'inputs') if any(r['group'] in BLK[k] for r in rows)); n = fresh = mo = 0; yrs = []
    for r in rows:
        if r['group'] == 'rates': continue
        n += 1; b = pms(r.get('latestPeriod')); a = pms(r.get('first'))
        if (r['fs'] in FR.POLICY['okStates']) if r.get('fs') else (b is not None and (now_ms - b) / 864e5 <= MAXAGE.get(r.get('freq'), 80) * 1.5): fresh += 1
        if r.get('freq') in ('monthly', 'weekly', 'daily'): mo += 1
        if a is not None and b is not None: yrs.append((b - a) / (365.25 * 864e5))
    if not n: return None
    yrs.sort(); med = yrs[len(yrs) >> 1] if yrs else 0
    c = {'b': blocks / 4, 'f': fresh / n, 'd': min(med, 20) / 20, 'q': mo / n}
    return {'b': round(c['b'], 4), 'f': round(c['f'], 4), 'd': round(c['d'], 4), 'q': round(c['q'], 4), 'score': int(100 * (0.3 * c['b'] + 0.3 * c['f'] + 0.2 * c['d'] + 0.2 * c['q']) + 0.5), 'years': round(med, 2), 'blocks': blocks}
NOW_MS = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000
NOW_DAY = FR.today_ord(NOW_MS)
def main():
    reg = {}
    # estricto: sin registro no sabemos que series duplicadas excluir; se detiene el build en vez de publicar un catalogo distinto
    for r in json.loads((ROOT / 'data/series-registry.json').read_text())['series']: reg[(r['country'], r['id'])] = r
    by_c = {}; names = {}; srcs = {}
    for n in STATS:
        p = ROOT / 'data' / (n + '.json')
        d = json.loads(p.read_text())  # estricto: todos los *-stats.json deben existir
        for cc, c in d.get('countries', {}).items():
            names.setdefault(cc, c.get('name', cc))
            sn = (c.get('source') or {}).get('name')
            if sn and sn not in srcs.setdefault(cc, []): srcs[cc].append(sn)
            for s in c.get('series', []):
                r = reg.get((cc, s['id']))
                if r and not r.get('preferred', True): continue  # duplicado: solo la serie preferida entra al catalogo
                by_c.setdefault(cc, []).append((n, s, r))
    # --- series de producto de Precios (data/latest.json): pais = region, grupo 'product', trozos normales
    MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
    def iso(freq, y, p):
        if isinstance(p, int): return '%d-%02d' % (y, p)
        p = str(p)
        if p in MON: return '%d-%02d' % (y, MON[p])
        if re.match(r'^Q\d$', p): return '%d-%s' % (y, p)
        if re.match(r'^\d\d$', p): return '%d-%s' % (y, p)
        if re.match(r'^\d\d-\d\d$', p): return ('%d-%s' % (y, p)) if freq == 'weekly' else '%d-%s' % (y, p[:2])
        return None
    obs = json.loads((ROOT / 'data/latest.json').read_text())['observations']
    nprod = 0
    for o in obs:
        cc = o['region'].upper(); pts = []
        for h in o.get('history', []):
            k = iso(o.get('frequency'), h['year'], h['period'])
            if k and h.get('value') is not None: pts.append([k, h['value']])
        if not pts: continue
        names.setdefault(cc, SPECIAL.get(cc, cc))
        sr = {'id': 'product:' + o['id'].replace('di_', '', 1), 'group': 'product', 'label': '%s · %s' % (o['product'].replace('_', ' ').capitalize(), o.get('sourceId', '')), 'unit': '%s/%s' % (o.get('currency', ''), o.get('unit', '')), 'frequency': o.get('frequency', ''),
              'latestPeriod': pts[-1][0], 'latest': o.get('value'), 'changePct': o.get('changePct'), 'points': pts, '_sid': o['sourceId']}
        by_c.setdefault(cc, []).append(('latest', sr, None)); nprod += 1
    # --- catalogo Agri-food UE (data/eu): solo metadatos, apuntan a los ficheros que ya existen (formato 'eu-regions')
    eu_rows = {}
    fams = json.loads((ROOT / 'data/eu/index.json').read_text())['families']
    for fam in fams:
        fd = json.loads((ROOT / 'data/eu' / (fam['id'] + '.json')).read_text())
        for se in fd.get('series', []):
            f = 'eu/%s/%s.json' % (fam['id'], se['id'])
            if not (ROOT / 'data' / f).exists(): raise FileNotFoundError('data/' + f)  # estricto: el catalogo UE apunta a ficheros que deben existir
            seen = {}
            for rg in se.get('regions', []):
                cc = rg['c']; seen[cc] = seen.get(cc, 0) + 1
                names.setdefault(cc, SPECIAL.get(cc, cc)); last, prev = rg.get('last') or [None, None], rg.get('prev') or [None, None]
                lab = '%s: %s' % (fam['id'].capitalize(), ' · '.join(se.get('parts', [se['id']])))
                if rg.get('m'): lab += ' (%s)' % rg['m']
                sid = 'eu:%s:%s' % (fam['id'], se['id']) + ('' if seen[cc] == 1 else '#%d' % seen[cc])
                ch = round((last[1] - prev[1]) / prev[1] * 100, 2) if last[1] is not None and prev[1] else None
                row = {'id': sid, 'label': lab, 'unit': se.get('unit', ''), 'freq': se.get('freq', ''), 'group': 'eu_' + fam['id'], 'latestPeriod': last[0], 'latest': last[1], 'changePct': ch, 'first': rg.get('first'), 'n': rg.get('n'),
                       'tier': 3, 'canonical': None, 'tags': tags(lab), 'source': 'eu/%s.json' % fam['id'], 'file': f, 'format': 'eu-regions', 'c': cc, 'sourceId': lic('eu_agrifood')[0], 'licenseId': lic('eu_agrifood')[1]}
                if rg.get('m'): row['m'] = rg['m']
                eu_rows.setdefault(cc, []).append(row)
    neu = sum(len(v) for v in eu_rows.values())
    written = set(); changed = 0; total = 0; man = {'countries': {}}
    for cc in sorted(set(by_c) | set(eu_rows)):
        rows = by_c.get(cc, []); groups = {}
        for n, s, r in rows: groups.setdefault(s.get('group', 'other'), []).append((n, s, r))
        cat = []; mg = {}
        for g in sorted(groups):
            chunks, cur, size = [], [], 0
            for item in groups[g]:
                b = len(dump(item[1].get('points', [])))
                if cur and size + b > SHARD_MAX: chunks.append(cur); cur, size = [], 0
                cur.append(item); size += b
            if cur: chunks.append(cur)
            files = []
            for i, ch in enumerate(chunks):
                rel = 'series/%s/%s%s.json' % (slug(cc), g, '' if i == 0 else '-%d' % (i + 1)); files.append(rel)
                doc = {'schemaVersion': 1, 'country': cc, 'group': g, 'series': [{'id': s['id'], 'label': s.get('label', ''), 'unit': s.get('unit', ''), 'frequency': s.get('frequency', ''), 'points': s.get('points', [])} for n, s, r in ch]}
                changed += write_if_changed(ROOT / 'data' / rel, dump(doc), written)
                for n, s, r in ch:
                    pts = s.get('points', [])
                    cat.append({'id': s['id'], 'label': s.get('label', ''), 'unit': s.get('unit', ''), 'freq': s.get('frequency', ''), 'group': g, 'latestPeriod': s.get('latestPeriod'), 'latest': s.get('latest'), 'changePct': s.get('changePct'),
                                'first': pts[0][0] if pts else None, 'n': len(pts), 'tier': r['tier'] if r else None, 'canonical': r['canonicalSeriesId'] if r else None, 'tags': tags(s.get('label', '')), 'source': n + '.json', 'file': rel,
                                'sourceId': lic(s['_sid'] if n == 'latest' else stats_source(n, cc, s))[0], 'licenseId': lic(s['_sid'] if n == 'latest' else stats_source(n, cc, s))[1]})
            gs = [x for x in cat if x['group'] == g]
            mg[g] = {'n': len(gs), 'files': files, 'latestPeriod': max([x['latestPeriod'] for x in gs if x['latestPeriod']] or [None]), 'tags': sorted({t for x in gs for t in x['tags']})}
        cat.extend(eu_rows.get(cc, []))
        for g in sorted({x['group'] for x in eu_rows.get(cc, [])}):
            gs = [x for x in cat if x['group'] == g]
            mg[g] = {'n': len(gs), 'files': [], 'format': 'eu-regions', 'latestPeriod': max([x['latestPeriod'] for x in gs if x['latestPeriod']] or [None]), 'tags': sorted({t for x in gs for t in x['tags']})}
        total += len(cat)
        for x in cat: x['fs'] = FR.evaluate(x['latestPeriod'], x['freq'], x['sourceId'], NOW_DAY)['state']  # Freshness Engine 2.0
        core = [x for x in cat if x.get('format') != 'eu-regions']; eu = [x for x in cat if x.get('format') == 'eu-regions']
        # los metadatos del catalogo UE van en un fichero aparte: quien solo necesita las series del pais no los baja
        changed += write_if_changed(ROOT / 'data/catalog' / (slug(cc) + '.json'), dump({'schemaVersion': 1, 'country': cc, 'name': names.get(cc, cc), 'sources': srcs.get(cc, []), 'series': core}), written)
        man['countries'][cc] = {'name': names.get(cc, cc), 'n': len(cat), 'catalog': 'catalog/%s.json' % slug(cc), 'metrics': mg}
        # resumen para tarjetas de perfiles.html (no hace falta bajar el catalogo del pais para listarlo)
        prof = [x for x in core if x['group'] != 'product']
        if prof:
            man['countries'][cc]['summary'] = {'n': len(prof), 'categories': len({x['group'] for x in prof}), 'latestPeriod': max([x['latestPeriod'] for x in prof if x['latestPeriod']] or [None]), 'first': min([x['first'] for x in prof if x['first']] or [None]),
                                               'sources': srcs.get(cc, []), 'coverage': coverage(prof, NOW_MS)}
        if eu:
            changed += write_if_changed(ROOT / 'data/catalog/eu' / (slug(cc) + '.json'), dump({'schemaVersion': 1, 'country': cc, 'series': eu}), written)
            man['countries'][cc]['catalogEu'] = 'catalog/eu/%s.json' % slug(cc); man['countries'][cc]['nEu'] = len(eu)
    prods = {}
    for cc, c in man['countries'].items():
        for g, m in c['metrics'].items():
            for t in m['tags']: prods.setdefault(t, []).append('%s/%s' % (cc, g))
    man.update({'schemaVersion': 1, 'seriesTotal': total, 'tiers': {'1': 'national official body', '2': 'Eurostat harmonised', '3': 'international organisation', '4': 'secondary / aggregator'},
                'seriesByKind': {'stats': total - neu - nprod, 'product': nprod, 'eu-regions': neu}, 'layout': 'manifest -> catalog/<CC>.json (metadata) -> series/<CC>/<metric>.json (points)', 'products': {k: sorted(v) for k, v in sorted(prods.items())}, 'tagsNote': 'products are keyword tags derived from series labels (heuristic), not an official classification'})
    # el manifiesto solo cambia de generatedAt si cambia algo mas
    mp = ROOT / 'data/catalog/manifest.json'; body = dump(man)
    try: old = json.loads(mp.read_text()); g0 = old.pop('generatedAt', None); same = dump(old) == body
    except Exception: same = False; g0 = None
    if not same or changed: man['generatedAt'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    else: man['generatedAt'] = g0
    changed += write_if_changed(mp, dump(man), written)
    # limpieza de ficheros huerfanos (series que han desaparecido)
    for base in (ROOT / 'data/series', ROOT / 'data/catalog'):
        for f in base.rglob('*.json'):
            if f.resolve() not in written: f.unlink(); changed += 1
    for d in sorted((ROOT / 'data/series').glob('*')):
        if d.is_dir() and not any(d.iterdir()): d.rmdir()
    print('series', total, 'paises', len(man['countries']), 'ficheros escritos/cambiados', changed)
main()

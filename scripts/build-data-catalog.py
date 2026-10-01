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
from lib_tags import TAGS, tags
ISO_EN = {'AT': 'Austria', 'AU': 'Australia', 'BE': 'Belgium', 'BG': 'Bulgaria', 'CA': 'Canada', 'CY': 'Cyprus', 'CZ': 'Czechia', 'DE': 'Germany', 'DK': 'Denmark', 'EE': 'Estonia', 'EL': 'Greece', 'ES': 'Spain', 'FI': 'Finland',
          'FR': 'France', 'HR': 'Croatia', 'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'LV': 'Latvia', 'MT': 'Malta', 'NL': 'Netherlands', 'PL': 'Poland', 'PT': 'Portugal',
          'RO': 'Romania', 'SE': 'Sweden', 'SI': 'Slovenia', 'SK': 'Slovakia', 'UK': 'United Kingdom', 'US': 'United States'}
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
def entity(cc, name):
    """Tipo de entidad del manifiesto: country | aggregate | region. NO todo lo que lleva codigo es un pais (EU, medias, regiones azucareras)."""
    if re.fullmatch(r'Region \d', cc): return {'entityType': 'region', 'parent': 'EU', 'displayName': 'EU sugar region ' + cc[-1], 'isoCode': None, 'flagType': 'none'}
    if cc == 'EU': return {'entityType': 'aggregate', 'parent': None, 'displayName': 'European Union', 'isoCode': None, 'flagType': 'eu'}
    if cc.startswith('EU') and not re.fullmatch(r'[A-Z]{2}', cc): return {'entityType': 'aggregate', 'parent': 'EU', 'displayName': name, 'isoCode': None, 'flagType': 'eu'}
    return {'entityType': 'country', 'parent': None, 'displayName': name, 'isoCode': {'EL': 'GR', 'UK': 'GB'}.get(cc, cc), 'flagType': 'country'}
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
    blocks = sum(1 for k in ('markets', 'production', 'trade', 'inputs') if any(r['group'] in BLK[k] for r in rows)); n = act = fresh = mo = 0; yrs = []
    for r in rows:
        if r['group'] == 'rates': continue
        n += 1; b = pms(r.get('latestPeriod')); arch = r.get('fs') in FR.POLICY['archiveStates']  # historicas/discontinuadas: fuera del denominador de frescura
        if not arch: act += 1; a = pms(r.get('first'))
        if (r['fs'] in FR.POLICY['okStates']) if r.get('fs') else (b is not None and (now_ms - b) / 864e5 <= MAXAGE.get(r.get('freq'), 80) * 1.5): fresh += 1
        if r.get('freq') in ('monthly', 'weekly', 'daily'): mo += 1
        if a is not None and b is not None: yrs.append((b - a) / (365.25 * 864e5))
    if not n: return None
    yrs.sort(); med = yrs[len(yrs) >> 1] if yrs else 0
    c = {'b': blocks / 4, 'f': (fresh / act if act else 0), 'd': min(med, 20) / 20, 'q': mo / n}
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
        names.setdefault(cc, ISO_EN.get(cc) or SPECIAL.get(cc, cc))
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
                names.setdefault(cc, ISO_EN.get(cc) or SPECIAL.get(cc, cc)); last, prev = rg.get('last') or [None, None], rg.get('prev') or [None, None]
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
        for x in cat: x['fs'] = FR.apply_lifecycle(x['id'], FR.evaluate(x['latestPeriod'], x['freq'], x['sourceId'], NOW_DAY)['state'])  # Freshness Engine 2.0 (+ declaraciones de ciclo de vida)
        core = [x for x in cat if x.get('format') != 'eu-regions']; eu = [x for x in cat if x.get('format') == 'eu-regions']
        # los metadatos del catalogo UE van en un fichero aparte: quien solo necesita las series del pais no los baja
        changed += write_if_changed(ROOT / 'data/catalog' / (slug(cc) + '.json'), dump({'schemaVersion': 1, 'country': cc, 'name': ISO_EN.get(cc) or names.get(cc, cc), 'sources': srcs.get(cc, []), 'series': core}), written)
        man['countries'][cc] = {**entity(cc, SPECIAL.get(cc) or ISO_EN.get(cc) or names.get(cc, cc)), 'name': ISO_EN.get(cc) or names.get(cc, cc), 'n': len(cat), 'catalog': 'catalog/%s.json' % slug(cc), 'metrics': mg}
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
    used = {}
    for cc, c in man['countries'].items():
        for g, m in c['metrics'].items(): pass
    PROV_FILES = {'product': ('latest.json', 'Historico mensual del motor de precios, valores tal como los publica la fuente; sin conversion de moneda ni de unidad (la unidad original viaja con la serie).', 'none'),
                  'eu-regions': ('data/eu/*', 'Cotizaciones del Agri-food Data Portal tal como las publica la Comision; sin transformacion salvo el calculo de variaciones.', 'none'),
                  'stats': ('*-stats.json', 'Valores tal como los publica la fuente, reescalados a la unidad indicada en la serie; changePct lo calcula Dehesa con los dos ultimos puntos.', 'none (la frecuencia es la de la fuente)')}
    ents = {}
    for c in man['countries'].values(): ents[c['entityType']] = ents.get(c['entityType'], 0) + 1
    srcs_used = {}
    for f in sorted((ROOT / 'data/catalog').glob('*.json')) + sorted((ROOT / 'data/catalog/eu').glob('*.json')):
        if f.name == 'manifest.json': continue
        for x in json.loads(f.read_text())['series']: srcs_used[x['sourceId']] = srcs_used.get(x['sourceId'], 0) + 1
    man['provenance'] = {
        'doc': 'Procedencia por serie = fila del catalogo (sourceId, licenseId, source=fichero de origen, canonical, latestPeriod=observationDate, fs=frescura) + este bloque (nombre, URL oficial y licencia de la fuente; transformacion y agregacion por tipo de dato). El catalogo se genera en generatedAt. publicationDate no la publican la mayoria de las fuentes estadisticas: se omite en vez de inventarla.',
        'sources': {k: {'name': LIC['sources'][k]['name'], 'officialUrl': LIC['sources'][k]['url'], 'licenseId': LIC['sources'][k]['licenseId'], 'licenseStatus': LIC['sources'][k]['status'], 'attribution': LIC['sources'][k].get('attributionText'), 'series': n} for k, n in sorted(srcs_used.items())},
        'transformations': {k: {'applies': v[0], 'transformation': v[1], 'aggregation': v[2]} for k, v in PROV_FILES.items()},
        'role': 'Todas las series del catalogo son la representacion preferida (primary); los duplicados no preferidos se excluyen (data/series-registry.json, nonPreferred=0).'}
    man.update({'entities': {**ents, 'total': len(man['countries'])}, 'schemaVersion': 1, 'seriesTotal': total, 'tiers': {'1': 'national official body', '2': 'Eurostat harmonised', '3': 'international organisation', '4': 'secondary / aggregator'},
                'seriesByKind': {'stats': total - neu - nprod, 'product': nprod, 'eu-regions': neu}, 'layout': 'manifest -> catalog/<CC>.json (metadata) -> series/<CC>/<metric>.json (points)', 'products': {k: sorted(v) for k, v in sorted(prods.items())}, 'tagsNote': 'products are keyword tags derived from series labels (heuristic), not an official classification'})
    # indice global compacto (solo lo necesario para buscar): la busqueda global no descarga ningun catalogo de pais
    idx_rows, DICT = [], {k: [] for k in ('cc', 'group', 'unit', 'freq', 'fs', 'tag')}
    def di(k, v):
        if v not in DICT[k]: DICT[k].append(v)
        return DICT[k].index(v)
    for cc in sorted(man['countries']):
        c = man['countries'][cc]
        for rel, kind in ((c['catalog'], 0), (c.get('catalogEu'), 1)):
            if not rel: continue
            for x in json.loads((ROOT / 'data' / rel).read_text(encoding='utf-8'))['series']:
                idx_rows.append([x['id'], x['label'], di('cc', cc), di('group', x['group']), di('unit', x['unit']), di('freq', x['freq']), x['latestPeriod'], di('fs', x['fs']), [di('tag', t) for t in x['tags']], x['canonical'], kind])
    ig = ''
    try: ig = json.loads((ROOT / 'data/catalog/series-index.json').read_text()).get('generatedAt', '')
    except Exception: pass
    ibody = {'schemaVersion': 1, 'doc': 'Indice global de busqueda: una fila por serie [id, label, cc, group, unit, freq, latestPeriod, fs, tags, canonicalSeriesId, kind]; cc/group/unit/freq/fs/tags son indices en dict. kind 0 = catalog/<cc>.json, kind 1 = catalog/eu/<cc>.json (puntero al catalogo de la entidad; los puntos viven en el shard de la fila). Sin puntos ni valores.', 'total': len(idx_rows), 'dict': DICT, 'rows': idx_rows}
    old_i = None
    try: old_i = json.loads((ROOT / 'data/catalog/series-index.json').read_text()); og = old_i.pop('generatedAt', None)
    except Exception: og = None
    ibody['generatedAt'] = og if old_i is not None and dump(old_i) == dump(ibody) else datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    changed += write_if_changed(ROOT / 'data/catalog/series-index.json', dump(ibody), written)
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

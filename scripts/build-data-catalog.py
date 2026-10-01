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
SHARD_MAX = 450_000
TAGS = [('wheat', r'wheat|trigo|blé|\bble\b|frumento'), ('maize', r'maize|corn|ma[ií]z|mais'), ('barley', r'barley|cebada|orge'), ('oats', r'\boats?\b|avena'), ('rye', r'\brye\b|centeno'), ('rapeseed', r'rapeseed|canola|colza'),
        ('soy', r'soy|soja'), ('rice', r'\brice\b|arroz|riz'), ('milk', r'milk|leche|lait|dairy|l[aá]cte'), ('butter', r'butter|mantequilla|beurre'), ('cheese', r'cheese|queso|fromage'),
        ('cattle', r'cattle|beef|vacuno|bovin|calf|veal|cow|steer|heifer|bull'), ('pigs', r'\bpigs?\b|pork|porcin|cerdo|swine|hog'), ('sheep', r'sheep|lamb|ovin|cordero|goat|caprin'),
        ('poultry', r'poultry|chicken|broiler|pollo|volaille|turkey'), ('eggs', r'\beggs?\b|huevo|oeuf'), ('olive', r'olive|aceite|azeite|olio'), ('sugar', r'sugar|az[uú]car|beet|remolacha|sucre'),
        ('potato', r'potato|patata|pomme de terre'), ('fertilizer', r'fertili[sz]|urea|nitrogen|phosph|potash|abono'), ('energy', r'diesel|energy|fuel|electric|gas\b'), ('wine', r'\bwine\b|vino|vin\b'),
        ('fruit', r'fruit|apple|orange|tomato|vegetable|lettuce|hortaliza|fruta')]
TAGS = [(k, re.compile(v, re.I)) for k, v in TAGS]
def tags(label): return [k for k, rx in TAGS if rx.search(label)]
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
def write_if_changed(path, text, written):
    path.parent.mkdir(parents=True, exist_ok=True); written.add(path.resolve())
    try:
        if path.read_text() == text: return False
    except Exception: pass
    path.write_text(text); return True
def main():
    reg = {}
    try:
        for r in json.loads((ROOT / 'data/series-registry.json').read_text())['series']: reg[(r['country'], r['id'])] = r
    except Exception: pass
    by_c = {}; names = {}
    for n in STATS:
        p = ROOT / 'data' / (n + '.json')
        if not p.exists(): continue
        d = json.loads(p.read_text())
        for cc, c in d.get('countries', {}).items():
            names.setdefault(cc, c.get('name', cc))
            for s in c.get('series', []):
                r = reg.get((cc, s['id']))
                if r and not r.get('preferred', True): continue  # duplicado: solo la serie preferida entra al catalogo
                by_c.setdefault(cc, []).append((n, s, r))
    written = set(); changed = 0; total = 0; man = {'countries': {}}
    for cc in sorted(by_c):
        rows = by_c[cc]; groups = {}
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
                rel = 'series/%s/%s%s.json' % (cc, g, '' if i == 0 else '-%d' % (i + 1)); files.append(rel)
                doc = {'schemaVersion': 1, 'country': cc, 'group': g, 'series': [{'id': s['id'], 'label': s.get('label', ''), 'unit': s.get('unit', ''), 'frequency': s.get('frequency', ''), 'points': s.get('points', [])} for n, s, r in ch]}
                changed += write_if_changed(ROOT / 'data' / rel, dump(doc), written)
                for n, s, r in ch:
                    pts = s.get('points', [])
                    cat.append({'id': s['id'], 'label': s.get('label', ''), 'unit': s.get('unit', ''), 'freq': s.get('frequency', ''), 'group': g, 'latestPeriod': s.get('latestPeriod'), 'latest': s.get('latest'), 'changePct': s.get('changePct'),
                                'first': pts[0][0] if pts else None, 'n': len(pts), 'tier': r['tier'] if r else None, 'canonical': r['canonicalSeriesId'] if r else None, 'tags': tags(s.get('label', '')), 'source': n + '.json', 'file': rel})
            gs = [x for x in cat if x['group'] == g]
            mg[g] = {'n': len(gs), 'files': files, 'latestPeriod': max([x['latestPeriod'] for x in gs if x['latestPeriod']] or [None]), 'tags': sorted({t for x in gs for t in x['tags']})}
        total += len(cat)
        changed += write_if_changed(ROOT / 'data/catalog' / (cc + '.json'), dump({'schemaVersion': 1, 'country': cc, 'name': names.get(cc, cc), 'series': cat}), written)
        man['countries'][cc] = {'name': names.get(cc, cc), 'n': len(cat), 'catalog': 'catalog/%s.json' % cc, 'metrics': mg}
    prods = {}
    for cc, c in man['countries'].items():
        for g, m in c['metrics'].items():
            for t in m['tags']: prods.setdefault(t, []).append('%s/%s' % (cc, g))
    man.update({'schemaVersion': 1, 'seriesTotal': total, 'tiers': {'1': 'national official body', '2': 'Eurostat harmonised', '3': 'international organisation', '4': 'secondary / aggregator'},
                'layout': 'manifest -> catalog/<CC>.json (metadata) -> series/<CC>/<metric>.json (points)', 'products': {k: sorted(v) for k, v in sorted(prods.items())}, 'tagsNote': 'products are keyword tags derived from series labels (heuristic), not an official classification'})
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
    print('series', total, 'paises', len(man['countries']), 'ficheros escritos/cambiados', changed)
main()

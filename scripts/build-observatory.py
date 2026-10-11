#!/usr/bin/env python3
"""data/observatory.json — Observatorio de datos: que se ha actualizado, que es nuevo, los mayores movimientos (1-3 d / 5-10 d / 25-40 d), revisiones, frescura,
proximas observaciones ESPERADAS (por la politica de frescura, no un calendario oficial de publicaciones), cambios de cobertura, calidad y salud de pipelines.
Todo se DERIVA de ficheros ya validados (prices/latest + history, freshness, catalog/manifest, revisions, data-anomalies, data-quality, pipeline-status, daily-brief).
No inventa nada: si una ventana no tiene series con dato comparable queda vacia y se dice. Las instantaneas de cobertura se acumulan en el propio fichero (maximo 60)."""
import calendar, datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import freshness as FR
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'); TODAY = NOW[:10]
NEW_DAYS = 7
WINDOWS = {'d1': (1, 3), 'd7': (5, 10), 'd30': (25, 40)}  # dias entre el dato anterior y el ultimo: [min, max]
MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
def J(p, default=None):
    f = D / p
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else default

def row_date(r, freq):
    """Fecha ISO (inicio del periodo) de una fila de historico, o None."""
    y = r.get('year'); p = str(r.get('period')).strip().upper()
    try:
        if freq == 'quarterly' and len(p) == 2 and p[0] == 'Q': return datetime.date(y, (int(p[1]) - 1) * 3 + 1, 1)
        if freq == 'weekly' or '-' in p:
            mm, dd = p.split('-'); return datetime.date(y, int(mm), int(dd))
        m = MON.get(p) or (int(p) if p.isdigit() else None)
        return datetime.date(y, m, 1) if m and 1 <= m <= 12 else None
    except (ValueError, TypeError): return None

def moves_for(hist):
    """{d1,d7,d30: {pct, from, to, days}|None} comparando el ultimo punto con el anterior dentro de cada ventana de dias."""
    rows = [(row_date(r, hist['frequency']), r['value']) for r in hist['history'] if isinstance(r.get('value'), (int, float))]
    rows = sorted([x for x in rows if x[0]], key=lambda x: x[0])
    out = {k: None for k in WINDOWS}
    if len(rows) < 2: return out, None
    last_d, last_v = rows[-1]
    for k, (lo, hi) in WINDOWS.items():
        cand = [(last_d - d).days for d, _ in rows[:-1] if lo <= (last_d - d).days <= hi]
        if not cand: continue
        # el dato mas cercano al centro de la ventana
        mid = (lo + hi) / 2; best = min(((abs((last_d - d).days - mid), d, v) for d, v in rows[:-1] if lo <= (last_d - d).days <= hi), key=lambda x: x[0])
        _, d0, v0 = best
        if v0 and v0 > 0: out[k] = {'pct': round((last_v / v0 - 1) * 100, 2), 'from': d0.isoformat(), 'to': last_d.isoformat(), 'days': (last_d - d0).days}
    return out, last_d.isoformat()


def L4(es, en, fr, it): return {'es': es, 'en': en, 'fr': fr, 'it': it}
EXTRA = {
 'arroz': L4('Arroz', 'Rice', 'Riz', 'Riso'), 'avena': L4('Avena', 'Oats', 'Avoine', 'Avena'), 'azucar': L4('Azúcar', 'Sugar', 'Sucre', 'Zucchero'), 'cebada': L4('Cebada', 'Barley', 'Orge', 'Orzo'), 'centeno': L4('Centeno', 'Rye', 'Seigle', 'Segale'),
 'cerdo': L4('Cerdo', 'Pigs', 'Porc', 'Suini'), 'colza': L4('Colza', 'Rapeseed', 'Colza', 'Colza'), 'cordero': L4('Cordero', 'Lamb', 'Agneau', 'Agnello'), 'dap': L4('Fosfato diamónico (DAP)', 'Diammonium phosphate (DAP)', 'Phosphate diammonique (DAP)', 'Fosfato biammonico (DAP)'),
 'diesel': L4('Diésel', 'Diesel', 'Gazole', 'Gasolio'), 'gas_natural': L4('Gas natural', 'Natural gas', 'Gaz naturel', 'Gas naturale'), 'harina_soja': L4('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), 'huevos': L4('Huevos', 'Eggs', 'Œufs', 'Uova'),
 'leche': L4('Leche', 'Milk', 'Lait', 'Latte'), 'leche_polvo': L4('Leche en polvo', 'Milk powder', 'Lait en poudre', 'Latte in polvere'), 'mantequilla': L4('Mantequilla', 'Butter', 'Beurre', 'Burro'), 'maiz': L4('Maíz', 'Maize (corn)', 'Maïs', 'Mais'),
 'oliva': L4('Aceite de oliva', 'Olive oil', 'Huile d’olive', 'Olio d’oliva'), 'petroleo_brent': L4('Petróleo Brent', 'Brent crude', 'Pétrole Brent', 'Petrolio Brent'), 'petroleo_wti': L4('Petróleo WTI', 'WTI crude', 'Pétrole WTI', 'Petrolio WTI'),
 'pollo': L4('Pollo', 'Chicken', 'Poulet', 'Pollo'), 'potasa': L4('Potasa', 'Potash', 'Potasse', 'Potassa'), 'sorgo': L4('Sorgo', 'Sorghum', 'Sorgho', 'Sorgo'), 'trigo': L4('Trigo', 'Wheat', 'Blé', 'Frumento'), 'urea': L4('Urea', 'Urea', 'Urée', 'Urea'), 'vaca': L4('Vacuno', 'Beef cattle', 'Bovins', 'Bovini'),
 'lino': L4('Lino', 'Flax', 'Lin', 'Lino'), 'lenteja': L4('Lenteja', 'Lentils', 'Lentilles', 'Lenticchie'), 'guisante_seco': L4('Guisante seco', 'Dry peas', 'Pois secs', 'Piselli secchi'), 'soja_grano': L4('Soja (grano)', 'Soybeans', 'Soja (grain)', 'Soia (granella)'),
 'avena_pienso_ab': L4('Avena forrajera (Alberta)', 'Feed oats (Alberta)', 'Avoine fourragère (Alberta)', 'Avena da foraggio (Alberta)'), 'cebada_pienso_ab': L4('Cebada forrajera (Alberta)', 'Feed barley (Alberta)', 'Orge fourragère (Alberta)', 'Orzo da foraggio (Alberta)'),
 'trigo_pienso_ab': L4('Trigo forrajero (Alberta)', 'Feed wheat (Alberta)', 'Blé fourrager (Alberta)', 'Frumento da foraggio (Alberta)'), 'trigo_cwrs_ab': L4('Trigo CWRS (Alberta)', 'CWRS wheat (Alberta)', 'Blé CWRS (Alberta)', 'Frumento CWRS (Alberta)'),
 'canola_elevador': L4('Canola en elevador (Alberta)', 'Canola at elevator (Alberta)', 'Canola à l’élévateur (Alberta)', 'Canola in elevatore (Alberta)'), 'cerdo_ab': L4('Cerdo (Alberta)', 'Hogs (Alberta)', 'Porcs (Alberta)', 'Suini (Alberta)'),
 'novillo_ab': L4('Novillo (Alberta)', 'Steers (Alberta)', 'Bouvillons (Alberta)', 'Manzi (Alberta)'), 'guisante_verde_ab': L4('Guisante verde (Alberta)', 'Green peas (Alberta)', 'Pois verts (Alberta)', 'Piselli verdi (Alberta)'), 'lenteja_laird_ab': L4('Lenteja Laird (Alberta)', 'Laird lentils (Alberta)', 'Lentilles Laird (Alberta)', 'Lenticchie Laird (Alberta)'),
 'eurostat_cereals_output_index': L4('Índice Eurostat: precios de cereales (producción)', 'Eurostat index: cereal output prices', 'Indice Eurostat : prix des céréales (production)', 'Indice Eurostat: prezzi dei cereali (produzione)'),
 'eurostat_energy_input_index': L4('Índice Eurostat: energía (insumos)', 'Eurostat index: energy (inputs)', 'Indice Eurostat : énergie (intrants)', 'Indice Eurostat: energia (input)'),
 'eurostat_fertiliser_input_index': L4('Índice Eurostat: fertilizantes (insumos)', 'Eurostat index: fertilisers (inputs)', 'Indice Eurostat : engrais (intrants)', 'Indice Eurostat: fertilizzanti (input)'),
 'eurostat_milk_output_index': L4('Índice Eurostat: leche (producción)', 'Eurostat index: milk (output)', 'Indice Eurostat : lait (production)', 'Indice Eurostat: latte (produzione)'),
 'defra_barley_output_index': L4('Índice DEFRA: cebada (producción)', 'DEFRA index: barley (output)', 'Indice DEFRA : orge (production)', 'Indice DEFRA: orzo (produzione)'), 'defra_cattle_output_index': L4('Índice DEFRA: bovino (producción)', 'DEFRA index: cattle (output)', 'Indice DEFRA : bovins (production)', 'Indice DEFRA: bovini (produzione)'),
 'defra_eggs_output_index': L4('Índice DEFRA: huevos (producción)', 'DEFRA index: eggs (output)', 'Indice DEFRA : œufs (production)', 'Indice DEFRA: uova (produzione)'), 'defra_energy_input_index': L4('Índice DEFRA: energía (insumos)', 'DEFRA index: energy (inputs)', 'Indice DEFRA : énergie (intrants)', 'Indice DEFRA: energia (input)'),
 'defra_feed_input_index': L4('Índice DEFRA: pienso (insumos)', 'DEFRA index: feed (inputs)', 'Indice DEFRA : aliments (intrants)', 'Indice DEFRA: mangimi (input)'), 'defra_fertiliser_input_index': L4('Índice DEFRA: fertilizantes (insumos)', 'DEFRA index: fertilisers (inputs)', 'Indice DEFRA : engrais (intrants)', 'Indice DEFRA: fertilizzanti (input)'),
 'defra_milk_output_index': L4('Índice DEFRA: leche (producción)', 'DEFRA index: milk (output)', 'Indice DEFRA : lait (production)', 'Indice DEFRA: latte (produzione)'), 'defra_oilseed_rape_output_index': L4('Índice DEFRA: colza (producción)', 'DEFRA index: oilseed rape (output)', 'Indice DEFRA : colza (production)', 'Indice DEFRA: colza (produzione)'),
 'defra_pigs_output_index': L4('Índice DEFRA: cerdo (producción)', 'DEFRA index: pigs (output)', 'Indice DEFRA : porcs (production)', 'Indice DEFRA: suini (produzione)'), 'defra_sheep_output_index': L4('Índice DEFRA: ovino (producción)', 'DEFRA index: sheep (output)', 'Indice DEFRA : ovins (production)', 'Indice DEFRA: ovini (produzione)'),
 'defra_wheat_output_index': L4('Índice DEFRA: trigo (producción)', 'DEFRA index: wheat (output)', 'Indice DEFRA : blé (production)', 'Indice DEFRA: frumento (produzione)')}
REGIONS = {'eu': L4('UE', 'EU', 'UE', 'UE'), 'us': L4('EE. UU.', 'US', 'É.-U.', 'USA'), 'ca': L4('Canadá', 'Canada', 'Canada', 'Canada'), 'uk': L4('Reino Unido', 'UK', 'Royaume-Uni', 'Regno Unito')}

def main():
    meta = J('product-metadata.json')['products']; ptype = {}
    for pid, m in meta.items():
        t = 'INPUT' if m['kind'] in ('input', 'energy') else 'PRICE'
        for i in (m.get('instruments') or []) + (m.get('indices') or []): ptype[i['product']] = t
    for p in ('urea', 'gas_natural', 'diesel'): ptype[p] = 'INPUT'
    fr = J('freshness.json'); fresh_by = {o['id']: o for o in fr['latest']['observations']}
    now_day = FR.today_ord(); obs = []
    prev = {x['k']: x for x in (J('observatory.json', {}).get('observations') or [])}
    man = J('prices/manifest.json')
    for rg in sorted(man['regions']):
        lat = J('prices/latest/%s.json' % rg)
        for o in lat['observations']:
            h = J('prices/history/%s/%s.json' % (rg, o['product']))
            mv, hist_last = moves_for(h) if h else ({k: None for k in WINDOWS}, None)
            fo = fresh_by.get(o['id']) or {}; ev = FR.evaluate(o['observationDate'], o['frequency'], o['sourceId'], now_day)
            pub = o.get('publicationDate'); basis = pub or o.get('snapshotDate'); key = 'P/%s/%s' % (o['product'], rg)
            # firstSeen: primer dia en que el pipeline vio ESTA fecha de observacion. Con estado previo se conserva (o pasa a hoy si la fecha de observacion es nueva).
            # Sin estado previo (primera ejecucion) se usa la fecha de publicacion/recuperacion, pero solo si el dato esta al dia: recuperar hoy un dato viejo no lo hace nuevo.
            pv = prev.get(key)
            if pv is not None: first = pv.get('firstSeen') if pv['observationDate'] == o['observationDate'] else TODAY
            else: first = basis[:10] if basis and ev['state'] in ('LIVE', 'FRESH', 'EXPECTED_DELAY') else None
            isnew = bool(first) and (datetime.date.fromisoformat(TODAY) - datetime.date.fromisoformat(first)).days <= NEW_DAYS
            obs.append({'k': 'P/%s/%s' % (o['product'], rg), 'id': o['id'], 'product': o['product'], 'region': rg, 'sourceId': o['sourceId'], 'type': ptype.get(o['product'], 'PRICE'),
                        'unit': o['unit'], 'currency': o['currency'], 'frequency': o['frequency'], 'observationDate': o['observationDate'], 'publicationDate': pub, 'snapshotDate': o.get('snapshotDate'),
                        'pubKnown': bool(pub), 'firstSeen': first, 'isNew': isnew, 'value': o['value'], 'changePct': o.get('changePct'), 'comparability': o.get('comparability'),
                        'freshness': ev['state'], 'ageDays': ev.get('ageDays'), 'expectedNext': fo.get('expectedNext') or (FR.iso(ev['due']) if 'due' in ev else None), 'moves': mv})
    obs.sort(key=lambda x: (x['region'], x['product']))
    # ---- revisiones
    rv = J('revisions.json', {'revisions': []})['revisions']; brief = J('daily-brief.json')
    revisions = {'count': len(rv), 'items': rv[:50], 'windowHours': brief.get('windowHours'), 'note': 'Cambios detectados en periodos ya publicados (data/revisions.json): pueden ser revisiones de la fuente, correcciones o reajustes del historico; la fuente no los confirma. Ninguna registrada no significa que la fuente no revise: solo que no se ha detectado un cambio de un valor ya publicado.'}
    # ---- frescura
    cat = fr['catalog']; freshness = {'latest': {'total': fr['latest']['total'], 'byState': fr['latest']['byState']}, 'catalog': {'total': cat['total'], 'byState': cat['byState'], 'bySource': cat['bySource'], 'lateTotal': cat.get('lateTotal')}}
    # ---- calidad
    an = J('data-anomalies.json', {'anomalies': []})['anomalies']; dq = J('data-quality.json', {}).get('summary', {})
    quality = {'files': dq.get('files'), 'errors': dq.get('errors'), 'warnings': dq.get('warnings'),
               'anomalies': [{'series': a['series'], 'status': a['status'], 'detected': a['detected'][:220], 'since': a.get('since')} for a in an],
               'unexplained': sum(1 for a in an if a['status'] == 'UNEXPLAINED_ANOMALY'), 'verified': sum(1 for a in an if a['status'] == 'KNOWN_VERIFIED_ANOMALY')}
    # ---- pipelines
    ps = J('pipeline-status.json'); bad = [{'workflow': p['workflow'], 'name': p['name'].replace('Dehesa Data — ', ''), 'status': p['status'], 'last': (p.get('last') or {}).get('conclusion'), 'lastAt': (p.get('last') or {}).get('startedAt'), 'url': (p.get('last') or {}).get('url')}
                                       for p in ps['pipelines'] if p['status'] != 'ok']
    pipelines = {'summary': ps['summary'], 'global': ps['global'], 'total': len(ps['pipelines']), 'attention': bad, 'generatedAt': ps['generatedAt'],
                 'next': sorted([{'workflow': p['workflow'], 'name': p['name'].replace('Dehesa Data — ', ''), 'nextRun': p['nextRun']} for p in ps['pipelines'] if p.get('nextRun')], key=lambda x: x['nextRun'])[:12]}
    # ---- cobertura + instantaneas
    mf = J('catalog/manifest.json'); prov = {}
    for k, v in cat['bySource'].items(): prov[k] = sum(v.values())
    snap = {'date': TODAY, 'series': mf['seriesTotal'], 'countries': {c: v['n'] for c, v in mf['countries'].items()}, 'sources': prov, 'latest': fr['latest']['byState'], 'catalog': cat['byState']}
    old = J('observatory.json', {}); snaps = [s for s in (old.get('coverage', {}).get('snapshots') or []) if s['date'] != TODAY] + [snap]; snaps = snaps[-60:]
    changes = []
    if len(snaps) >= 2:
        a, b = snaps[-2], snaps[-1]
        if a['series'] != b['series']: changes.append({'scope': 'total', 'key': 'series', 'from': a['series'], 'to': b['series']})
        for scope, kk in (('country', 'countries'), ('source', 'sources')):
            for key in sorted(set(a[kk]) | set(b[kk])):
                x, y = a[kk].get(key, 0), b[kk].get(key, 0)
                if x != y: changes.append({'scope': scope, 'key': key, 'from': x, 'to': y})
    coverage = {'series': mf['seriesTotal'], 'entities': mf['entities'], 'byCountry': {c: v['n'] for c, v in mf['countries'].items()}, 'bySource': prov, 'priceLayer': len(obs), 'since': snaps[-2]['date'] if len(snaps) > 1 else None, 'changes': changes, 'snapshots': snaps,
                'note': 'Los cambios comparan la ultima instantanea guardada con la anterior; la primera ejecucion no tiene con que comparar.'}
    upcoming = sorted([{'k': o['k'], 'expectedNext': o['expectedNext'], 'frequency': o['frequency'], 'sourceId': o['sourceId'], 'freshness': o['freshness']} for o in obs if o['expectedNext']], key=lambda x: x['expectedNext'])
    kinds = sorted({c['kind'] for c in brief['coverage']}); datasets = [{'file': c['file'], 'name': c['name'], 'kind': c['kind'], 'status': c['status']} for c in brief['coverage']]
    doc = {'schemaVersion': 1, 'generatedAt': NOW, 'today': TODAY, 'newDays': NEW_DAYS, 'windows': {k: {'minDays': v[0], 'maxDays': v[1]} for k, v in WINDOWS.items()},
           'methodology': 'Todo se deriva de ficheros ya validados. "Nuevo" = el pipeline vio esa fecha de observacion por primera vez en los ultimos %d dias (en la primera ejecucion, la de publicacion/recuperacion de un dato al dia). Los movimientos comparan el ultimo punto con el anterior dentro de cada ventana de dias, en la moneda y unidad originales. "Proximas" son observaciones ESPERADAS segun la politica de frescura, no un calendario oficial.' % NEW_DAYS,
           'labels': {p: EXTRA.get(p) or L4(p, p, p, p) for p in sorted({o['product'] for o in obs})}, 'regions': {r: REGIONS.get(r) or L4(r.upper(), r.upper(), r.upper(), r.upper()) for r in sorted({o['region'] for o in obs})}, 'kinds': kinds, 'observations': obs, 'datasets': datasets, 'revisions': revisions, 'freshness': freshness, 'upcoming': upcoming, 'coverage': coverage, 'quality': quality, 'pipelines': pipelines}
    new = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    path = D / 'observatory.json'
    try:
        o = json.loads(path.read_text()); o['generatedAt'] = doc['generatedAt']
        if json.dumps(o, ensure_ascii=False, separators=(',', ':')) == new: print('sin cambios'); return
    except Exception: pass
    path.write_text(new + '\n'); print(len(obs), 'observaciones;', sum(1 for o in obs if o['isNew']), 'nuevas;', {k: sum(1 for o in obs if o['moves'][k]) for k in WINDOWS}, path.stat().st_size, 'bytes')
main()

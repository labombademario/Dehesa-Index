#!/usr/bin/env python3
"""data/product-compare.json — series comparables por producto y pais (para comparador.html y su Unit Engine).
Fuentes: catalogo Agri-food UE (data/eu/*) para paises de la UE y Reino Unido; data/latest.json (historia NASS EE. UU., StatCan Canada).
Cada serie guarda unidad y moneda ORIGINALES, los kg que representa una unidad de precio y puntos mensuales (media del mes). La conversion de moneda
(tipo de cambio mensual del BCE, data/fx-history.json) y de unidad se hace en el navegador, siempre mostrando el valor original."""
import datetime, json, sys
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
sys.path.insert(0, str(ROOT / 'scripts'))
import freshness as FR
import lib_markets as LM
NOW = FR.today_ord()
FROM = '2008-01'
META = json.loads((D / 'product-metadata.json').read_text())  # productos y series UE configuradas: data/product-metadata.json (no en el codigo)
BU = META['bushelKg']
PRODUCTS = {pid: dict(eu=tuple(m['compare']['eu']), per=m['compare']['per'], label=m['compare']['label'], fb=m['compare'].get('marketFallback', {})) for pid, m in META['products'].items() if m.get('compare')}
STALE_DAYS = 120  # media nacional que lleva mas de esto por detras de la serie mas reciente de la familia: se sustituye por el mercado configurado (marketFallback)
KG = {'tonelada': 1000.0, '100kg': 100.0, 'cwt': 45.3592}
MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
EPOCH = datetime.date(2000, 1, 1)
def monthly(pairs):
    acc = defaultdict(list)
    for ym, v in pairs:
        if ym >= FROM and v is not None: acc[ym].append(v)
    return [[k, round(sum(v) / len(v), 3)] for k, v in sorted(acc.items())]
def despike(pts):
    """Quita picos aislados (un mes que se aleja más de un 35 % de dos vecinos que coinciden entre sí: p. ej. leche de Croacia 7,41 €/100 kg
    entre 49 y 52): son errores de carga del país, no precios. Misma regla que scripts/build-app-eu-countries.py."""
    out = []
    for i, p in enumerate(pts):
        if 0 < i < len(pts) - 1:
            a, b, c = pts[i - 1][1], p[1], pts[i + 1][1]
            if a and c and abs(a / c - 1) < 0.15 and abs(b / ((a + c) / 2) - 1) > 0.35: continue
        out.append(p)
    return out
def main():
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'products': {}}
    latest = json.loads((D / 'latest.json').read_text())['observations']
    for pid, cfg in PRODUCTS.items():
        series = []
        fam, sid = cfg['eu']
        f = json.loads((D / 'eu' / fam / (sid + '.json')).read_text())  # estricto: la serie UE configurada debe existir
        if f:
            newest = max((r['d'][-1] for r in f['regions'] if r.get('d')), default=0)
            regions = []
            for r in f['regions']:
                c = r['c']
                if c == 'EU+UK' or not r.get('d'): continue
                fb = cfg['fb'].get(c)
                if fb and newest - r['d'][-1] > STALE_DAYS:
                    # el pais dejo de publicar media nacional: se usa su mercado de referencia (mismo portal y misma fase comercial), marcado con 'm'
                    mf = json.loads((D / 'eu' / fb[0] / (fb[1] + '.json')).read_text())
                    mr = next((x for x in mf['regions'] if x['c'] == c and x.get('m') == fb[2] and x.get('d')), None)
                    if mr and mr['d'][-1] > r['d'][-1] and mf['unit'] == f['unit']:
                        print('compare %s %s: media nacional parada en %s; se usa el mercado %s' % (pid, c, (EPOCH + datetime.timedelta(days=r['d'][-1])).isoformat(), fb[2]))
                        r = dict(mr, _m=fb[2], _basis=mf.get('parts'))
                regions.append(r)
            def mk(r, ff):
                raw = [((EPOCH + datetime.timedelta(days=d)).isoformat(), v) for d, v in zip(r['d'], r['v'])]
                pts = monthly([(x[:7], v) for x, v in raw])
                if len(pts) < 6: return None
                u = ff['unit']; kg = 1000.0 if u == '€/t' else 100.0
                n_last = sum(1 for x, _ in raw if x[:7] == pts[-1][0])
                o = {'c': r['c'], 'cur': 'EUR', 'unit': u, 'kg': kg, 'freq': ff['freq'], 'src': 'EU Agri-food Data Portal', 'sourceId': 'eu_agrifood', 'latest': [raw[-1][0], raw[-1][1]], 'points': pts, 'comp': 'directional',
                     'aggregation': {'points': 'monthly_mean', 'of': ff['freq'], 'lastMonthObs': n_last, 'latest': 'last_quote'}, 'fs': FR.evaluate(raw[-1][0], ff['freq'], 'eu_agrifood', NOW)['state']}
                if r.get('_m'):
                    o['m'] = r['_m']; o['basis'] = ' - '.join(r['_basis'] or [])
                return o
            for r in regions:
                c = r['c']; o = mk(r, f)
                if not o: continue
                series.append(o)
                fb = cfg['fb'].get(c)
                if fb:
                    # el resto de mercados del pais (mismo portal, misma fase comercial): el comparador deja elegir entre ellos
                    mf = json.loads((D / 'eu' / fb[0] / (fb[1] + '.json')).read_text())
                    if mf['unit'] != f['unit']: continue
                    alts = []
                    for x in mf['regions']:
                        if x['c'] != c or not x.get('m') or not x.get('d') or x['m'] == o.get('m'): continue
                        a = mk(dict(x, _m=x['m'], _basis=mf.get('parts')), mf)
                        if a: alts.append(a)
                    if alts: o['alts'] = sorted(alts, key=lambda a: (-int(a['latest'][0][:4]), a['m']))
        for o in latest:
            if o['product'] != pid or o['region'] not in ('us', 'ca', 'uk') or o.get('status') != 'verified': continue
            if o.get('comparability') == 'not_comparable': continue  # no es el mismo instrumento (p. ej. peso vivo frente a canal): no se pone al lado de la serie UE
            if o['region'] == 'uk' and any(s['c'] == 'UK' for s in series): continue
            un = o['unit']; kg = BU.get(pid) if un == 'bushel' else KG.get(un)
            if not kg: continue
            raw = []
            for h in o.get('history', []):
                p = str(h['period']); m = MON.get(p.upper()) if not p.isdigit() else int(p)
                if m: raw.append(('%04d-%02d' % (h['year'], m), h['value']))
            pts = monthly(raw)
            if len(pts) < 6: continue
            same = o['frequency'] == 'monthly'
            # Canadá: StatCan publica por provincia; la serie lleva su provincia (Saskatchewan, Ontario…) para no rotularla como todo Canadá
            prov = (LM.market(o) or [''])[0].split(' · ')[0] if o['region'] == 'ca' else ''
            series.append({**({'m': prov} if prov and prov not in ('Canadá',) else {}), 'c': o['region'].upper(), 'iid': o['id'], 'cur': o['currency'], 'unit': '%s/%s' % (o['currency'], un), 'kg': kg, 'freq': o['frequency'], 'src': {'us': 'USDA NASS', 'ca': 'Statistics Canada', 'uk': 'Defra'}[o['region']], 'sourceId': o['sourceId'],
                           'latest': [o['observationDate'], o['value']], 'points': pts, 'comp': o.get('comparability', 'directional'),
                           'aggregation': {'points': 'monthly_value' if same else 'monthly_mean', 'of': o['frequency'], 'lastMonthObs': 1 if same else None, 'latest': 'last_quote'},
                           'fs': FR.evaluate(o['observationDate'], o['frequency'], o['sourceId'], NOW)['state']})
        for s_ in series:
            s_['points'] = despike(s_['points'])
            for a in s_.get('alts') or []:
                if a.get('points'): a['points'] = despike(a['points'])
        doc['products'][pid] = {'label': cfg['label'], 'per': cfg['per'], 'series': sorted(series, key=lambda s: s['c'])}
    # Vista para el navegador (optimización 13-oct-2026): un fichero por producto + índice. comparador.html solo baja el producto
    # que se mira (antes, 426 KB con los seis productos). data/product-compare.json sigue completo para pruebas y otros scripts.
    vd = D / 'views' / 'compare'; vd.mkdir(parents=True, exist_ok=True)
    idx = {'schemaVersion': 1, 'products': {k: {'label': v['label'], 'per': v['per'], 'n': len(v['series'])} for k, v in doc['products'].items()}}
    (vd / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, separators=(',', ':')))
    for k, v in doc['products'].items(): (vd / (k + '.json')).write_text(json.dumps(v, ensure_ascii=False, separators=(',', ':')))
    for f in vd.glob('*.json'):
        if f.stem != 'index' and f.stem not in doc['products']: f.unlink()
    path = D / 'product-compare.json'
    new = json.dumps(doc['products'], ensure_ascii=False, separators=(',', ':'))
    try:
        if json.dumps(json.loads(path.read_text())['products'], ensure_ascii=False, separators=(',', ':')) == new: print('sin cambios'); return
    except Exception: pass
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    print({k: len(v['series']) for k, v in doc['products'].items()}, path.stat().st_size)
main()

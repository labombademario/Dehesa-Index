#!/usr/bin/env python3
"""Precios de la madera en la UE -> data/eu-wood-prices.json (22-oct-2026, a peticion de Mario: «los paises sin datos de madera, tenemos que buscar datos para ellos»).
1) Eurostat sts_inpp_m (indice mensual de precios de productor de la industria, 2021=100, sin desestacionalizar, mercado total): C16 = fabricacion de madera y productos de madera
   y C161 = aserrado y cepillado de la madera, para los paises de la UE-27 que lo publican. Es el precio de lo que vende la industria, NO el de la madera en rollo del monte.
2) Suecia, Skogsstyrelsen (estadistica oficial JO0303): precio medio de liquidacion de la madera en rollo entregada, kr por m3 sin corteza, trimestral desde 2019, total del pais.
Un pais sin dato no tiene la serie: nunca se rellena con la de otro. Uso: python3 scripts/update-eu-wood-prices.py"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'eu-wood-prices.json'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
GEOS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
STS = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_inpp_m?format=JSON&lang=EN&indic_bt=PRC_PRR&s_adj=NSA&unit=I21&sinceTimePeriod=2015-01&' + '&'.join('nace_r2=' + n for n in ('C16', 'C161')) + '&' + '&'.join('geo=' + g for g in GEOS)
SK = 'https://pxweb.skogsstyrelsen.se/api/v1/sv/Skogsstyrelsens%20statistikdatabas/Rundvirkespriser/JO0303_3ny.px'
SK_LAB = {'Tallsågtimmer': 'Pine sawlogs', 'Gransågtimmer': 'Spruce sawlogs', 'Sågtimmer': 'Sawlogs (pine and spruce)', 'Massaved av barrträd': 'Softwood pulpwood', 'Massaved av lövträd': 'Hardwood pulpwood', 'Massaved totalt': 'Pulpwood, total'}
def call(u, data=None, tries=4):
    last = None
    for i in range(tries):
        try:
            h = dict(UA); 
            if data is not None: h['Content-Type'] = 'application/json'
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=h), timeout=120) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError('%s: %s' % (u[:80], str(last)[:160]))
def ppi():
    d = call(STS); dims = d['id']; sizes = d['size']
    inv = {k: {i: v for v, i in d['dimension'][k]['category']['index'].items()} for k in dims}
    names = {c: re.sub(r'\s+', ' ', t).strip() for c, t in d['dimension']['nace_r2']['category']['label'].items()}
    pos = {k: dims.index(k) for k in dims}; res = {}
    for n, v in d['value'].items():
        if v is None: continue
        n = int(n); u = []
        for s in reversed(sizes): u.append(n % s); n //= s
        u = list(reversed(u)); g = inv['geo'][u[pos['geo']]]
        if g not in GEOS: continue
        res.setdefault(g, {}).setdefault(inv['nace_r2'][u[pos['nace_r2']]], []).append([inv['time'][u[pos['time']]], round(float(v), 1)])
    for g in res:
        for k in res[g]: res[g][k].sort()
    return {'unit': 'index 2021=100', 'products': names, 'countries': dict(sorted(res.items()))}
def sweden():
    meta = call(SK); var = {v['code']: v for v in meta['variables']}
    q = {'query': [{'code': v['code'], 'selection': {'filter': 'all', 'values': ['*']}} for v in meta['variables'] if v['code'] != 'ContentsCode'], 'response': {'format': 'json'}}
    d = call(SK, json.dumps(q).encode())
    tx = lambda code: dict(zip(var[code]['values'], var[code]['valueTexts']))
    ls, so, kv = tx('Landsdel'), tx('Sortiment'), tx('Kvartal')
    ser = {}; prelim = set()
    for r in d['data']:
        a, b, c = r['key']; v = r['values'][0]
        if ls[a] != 'Hela landet' or v in ('..', '', None): continue
        try: v = float(v)
        except ValueError: continue
        q_ = kv[c]; 
        if 'Prel' in q_: prelim.add(re.match(r'\d{4}K\d', q_).group(0))
        ser.setdefault(so[b], []).append([re.match(r'\d{4}K\d', q_).group(0), v])
    out = []
    for nm, pts in ser.items():
        pts.sort(); out.append({'id': 'se-roundwood-' + re.sub(r'[^a-z]+', '-', SK_LAB.get(nm, nm).lower()).strip('-'), 'name': SK_LAB.get(nm, nm), 'nameSv': nm, 'unit': 'SEK/m3 under bark', 'freq': 'Q', 'pts': pts})
    return {'name': 'Skogsstyrelsen (Swedish Forest Agency), official statistics JO0303 · Rundvirkespriser', 'url': 'https://www.skogsstyrelsen.se/statistik/', 'license': 'Skogsstyrelsen, statistik oppen att ateranvanda med kallhanvisning', 'preliminary': sorted(prelim), 'series': sorted(out, key=lambda s: s['id'])}
def main():
    p = ppi(); print('PPI paises:', len(p['countries']), 'sin dato:', sorted(set(GEOS) - set(p['countries'])), {c: sorted(v) for c, v in p['countries'].items() if len(v) < 2})
    if len(p['countries']) < 20: print('ERROR: demasiados paises sin dato en sts_inpp_m'); return 1
    s = None
    try: s = sweden(); print('Suecia:', len(s['series']), 'series; ultimo trimestre', max(x['pts'][-1][0] for x in s['series']))
    except Exception as e: print('AVISO Suecia (Skogsstyrelsen):', e)
    old = {}
    try: old = json.loads(OUT.read_text(encoding='utf-8'))
    except Exception: pass
    if s is None: s = (old.get('national') or {}).get('SE')   # si Skogsstyrelsen no responde, se conserva lo ultimo publicado
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'ppi': {'source': {'name': 'Eurostat, sts_inpp_m (producer prices in industry, monthly; datos de cada instituto nacional de estadistica)', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/sts_inpp_m/default/table', 'license': 'CC BY 4.0'}, **p},
           'national': {'SE': s} if s else {}}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('eu-wood-prices.json', OUT.stat().st_size, 'bytes'); return 0
if __name__ == '__main__': sys.exit(main())

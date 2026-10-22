#!/usr/bin/env python3
"""Precio que cobra el agricultor por fruta, hortaliza y patata en TODA la UE-27 -> data/eu-fv-farm.json (22-oct-2026, a peticion de Mario:
«que paises de la UE aun no tienen frutas y hortalizas ... buscar datos para ellos»).
Eurostat, conjunto apri_ap_crpouta (precios de venta de productos agricolas, anual, EUR por 100 kg; cada instituto nacional los envia a Eurostat).
Los pipelines por pais de Eurostat solo guardan unos pocos productos (modo reducido por el presupuesto de datos); aqui se guardan TODAS las hortalizas
frescas, la patata y la fruta que publica cada pais, y nada mas (ni flores ni vino ni cereales). Un pais sin dato de un producto no tiene ese producto: nunca se rellena con el de otro.
Uso: python3 scripts/update-eu-fv-farm.py"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'eu-fv-farm.json'
GEOS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
URL = ('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apri_ap_crpouta?format=JSON&lang=EN&currency=EUR&sinceTimePeriod=2005&' + '&'.join('geo=' + g for g in GEOS))
SKIP = re.compile(r'wine|roses|carnation|chrysanth|gladiol|tulip|freesia|tobacco|hops|cotton', re.I)
def get():
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=180) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError(str(last)[:200])
def main():
    d = get(); dims = d['id']; sizes = d['size']
    inv = {k: {i: v for v, i in d['dimension'][k]['category']['index'].items()} for k in dims}
    lab = {k: d['dimension'][k]['category'].get('label', {}) for k in dims}
    pos = {k: dims.index(k) for k in dims}
    prods, data = {}, {}
    for n, v in d['value'].items():
        if v is None: continue
        n = int(n); u = []
        for s in reversed(sizes): u.append(n % s); n //= s
        u = list(reversed(u))
        code = inv['prod_veg'][u[pos['prod_veg']]]
        if code[:2] not in ('04', '05', '06') : continue
        name = re.sub(r'\s+', ' ', lab['prod_veg'][code]).strip()
        m = re.match(r'^(.*?)\s+-\s+prices per (\d+) (kg|items)$', name)
        if not m or m.group(3) != 'kg' or m.group(2) != '100' or SKIP.search(m.group(1)): continue
        prods[code] = m.group(1).strip()
        data.setdefault(inv['geo'][u[pos['geo']]], {}).setdefault(code, []).append([inv['time'][u[pos['time']]], round(float(v), 2)])
    for cc in data:
        for code in data[cc]: data[cc][code].sort()
    n_series = sum(len(v) for v in data.values())
    missing = sorted(set(GEOS) - set(data))
    print('paises con dato:', len(data), 'sin dato:', missing, 'series:', n_series, 'productos:', len(prods))
    if len(data) < 24 or n_series < 600: print('ERROR: respuesta de Eurostat demasiado pequeña'); return 1
    for cc in sorted(data): print(cc, len(data[cc]), 'productos; ultimo año', max(p[-1][0] for p in data[cc].values()))
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': 'EUR/100 kg',
           'source': {'name': 'Eurostat, apri_ap_crpouta (precios de venta de productos agricolas; datos de cada instituto nacional)', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/default/table', 'license': 'CC BY 4.0'},
           'products': dict(sorted(prods.items())), 'countries': {cc: dict(sorted(v.items())) for cc, v in sorted(data.items())}}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('eu-fv-farm.json', OUT.stat().st_size, 'bytes'); return 0
if __name__ == '__main__': sys.exit(main())

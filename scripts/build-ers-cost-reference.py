#!/usr/bin/env python3
"""data/ers-cost-reference.json — costes de produccion de referencia (USDA ERS, 'U.S. total', ultimo ano) agrupados en las partidas de la calculadora.
Reduce data/ers.json (1,3 MB) a lo que la calculadora necesita (unos KB). Cada partida de la calculadora es la SUMA de lineas ERS nombradas en `map`; si la suma de
todas las partidas no coincide con 'Total, costs listed' publicado por ERS (tolerancia 0,05 $/acre) la cultura se omite: no se ajusta ni se reparte la diferencia.
Las partidas 'rent' (coste de oportunidad de la tierra) y la parte de mano de obra no remunerada son costes IMPUTADOS, no desembolsos: se marcan en `imputed`."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CROPS = {'corn': 'maiz', 'soybeans': 'soja', 'wheat': 'trigo', 'barley': 'cebada', 'oats': 'avena'}
MAP = {
    'fert': ['Fertilizer'], 'seed': ['Seed'], 'prot': ['Chemicals'], 'energy': ['Fuel, lube, and electricity'],
    'mach': ['Repairs', 'Capital recovery of machinery and equipment'],
    'labour': ['Hired labor', 'Opportunity cost of unpaid labor'],
    'rent': ['Opportunity cost of land'],
    'other': ['Custom services', 'Purchased irrigation water', 'Interest on operating capital', 'Interest on operating inputs', 'Taxes and insurance', 'General farm overhead', 'Other variable expenses'],
}
IMPUTED = ['Opportunity cost of land', 'Opportunity cost of unpaid labor']
def main():
    d = json.loads((ROOT / 'data/ers.json').read_text())
    out = {}
    for ers, key in CROPS.items():
        rows = [r for r in d['costs'].get(ers, []) if r[3] == 'U.S. total']
        if not rows: continue
        year = max(r[4] for r in rows); rows = [r for r in rows if r[4] == year]
        val = {(r[0], r[1]): r[5] for r in rows}
        line = lambda g, n: val.get((g, n))
        costs, used = {}, set()
        for b, names in MAP.items():
            tot = 0.0
            for n in names:
                v = next((x for (g, nn), x in val.items() if nn == n and g in ('Operating costs', 'Allocated overhead')), None)
                if v is not None: tot += v; used.add(n)
            costs[b] = round(tot, 2)
        total = line('Costs listed', 'Total, costs listed'); y = line('Supporting information', 'Yield'); p = line('Supporting information', 'Price')
        if total is None or abs(sum(costs.values()) - total) > 0.05 or y is None:
            print('omitido', ers, round(sum(costs.values()), 2), total); continue
        out[key] = {'ersCommodity': ers, 'year': year, 'region': 'U.S. total', 'unit': 'USD per planted acre', 'costs': costs, 'totalCostsListed': total,
                    'operatingCosts': line('Operating costs', 'Total, operating costs'), 'yieldBuPerAcre': y, 'priceUsdPerBu': p, 'enterpriseAcres': line('Supporting information', 'Enterprise size'),
                    'imputed': round(sum(line('Allocated overhead', n) or 0 for n in IMPUTED), 2),
                    # lineas de resultado PUBLICADAS por ERS (no calculadas aqui): valor de la produccion y valor menos costes
                    'grossValue': line('Gross value of production', 'Total, gross value of production'),
                    'netOperating': line('Net value', 'Value of production less operating costs'),
                    'netTotal': line('Net value', 'Value of production less total costs listed')}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'sourceIds': ['usda_ers'],
           'doc': 'USDA ERS Commodity Costs and Returns, U.S. total, ultimo ano publicado. Cada partida es la suma de lineas ERS (ver map). La partida rent es el coste de oportunidad de la tierra y parte de labour es mano de obra no remunerada: costes imputados, no desembolsos. Media nacional: no representa ninguna explotacion concreta.',
           'map': MAP, 'imputedLines': IMPUTED, 'crops': out}
    (ROOT / 'data/ers-cost-reference.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
    for k, v in out.items(): print(k, v['year'], v['costs'], v['totalCostsListed'], v['yieldBuPerAcre'])
    return 0 if out else 1
if __name__ == '__main__': sys.exit(main())

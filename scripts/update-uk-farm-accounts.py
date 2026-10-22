#!/usr/bin/env python3
"""Cuentas de las explotaciones de Inglaterra (Defra, Farm Business Survey: "Farm Accounts in England", Open Government Licence v3.0) -> data/uk-farm-accounts.json
Usa el ZIP oficial "machine-readable CSV" (la direccion cambia en cada publicacion y se localiza en la pagina de gov.uk). Libras por explotacion, tal como
se publican (media de la muestra de la encuesta, con su intervalo de confianza del 95 %):
  income : renta de la explotacion (FBI), renta neta (NFI), renta en caja (CI) y renta familiar (FFI) por tipo de granja, a precios corrientes y reales (tabla 1)
  regions: renta de la explotacion por region y tipo de granja, ultimos dos ejercicios (tabla 2)
  costs  : produccion, costes variables y fijos y renta por tipo de granja (tabla 5a, centro de coste "Agriculture" y explotacion entera) y detalle de los costes
           de la actividad agraria (tabla 5c), ultimos dos ejercicios
El ejercicio "2024/25" va de marzo de 2024 a febrero de 2025. Solo Inglaterra. Si falta algo, no se toca el fichero y sale en rojo."""
import csv, datetime, io, json, re, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.gov.uk/government/statistics/farm-accounts-in-england-data-sets'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise SystemExit('descarga fallida %s: %s' % (u, last))
def num(s):
    s = (s or '').replace(',', '').strip()
    try: return float(s) if s not in ('', '-', '..', 'x', '#') else None
    except ValueError: return None
def rows(z, pat):
    n = [x for x in z.namelist() if re.search(pat, x)]
    if not n: raise SystemExit('no esta la tabla %s en el ZIP' % pat)
    return list(csv.DictReader(io.StringIO(z.read(n[0]).decode('utf-8-sig', 'replace'))))
TYPO = {'2017SO': 3, '2013SO': 2, '2010SO': 1}
def main():
    page = get(PAGE).decode('utf-8', 'replace')
    m = re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s<>]+?fae_tables_csv_format_\d+\.zip', page)
    if not m: raise SystemExit('no se encontro el ZIP de CSV en la pagina')
    url = sorted(set(m))[-1]; log('ZIP', url)
    z = zipfile.ZipFile(io.BytesIO(get(url)))
    # tabla 1: historico por tipo de granja; para cada ejercicio, la tipologia mas reciente disponible
    t1 = rows(z, r'fae_table1_'); best = {}
    for r in t1:
        k = (r['survey_year'], r['farm_type'], r['measure'], r['prices'])
        if k not in best or TYPO.get(r['typology'], 0) > TYPO.get(best[k]['typology'], 0): best[k] = r
    years = sorted({k[0] for k in best}); types = sorted({k[1] for k in best}, key=lambda x: (x != 'All Types', x))
    income = {}
    for ft in types:
        for ms in ('FBI', 'NFI', 'CI', 'FFI'):
            for pr in ('Current', 'Real'):
                vals = [num(best[(y, ft, ms, pr)]['value']) if (y, ft, ms, pr) in best else None for y in years]
                if any(v is not None for v in vals): income.setdefault(ft, {}).setdefault(ms, {})[pr.lower()] = vals
    typo = {y: max((best[k]['typology'] for k in best if k[0] == y), key=lambda t: TYPO.get(t, 0)) for y in years}
    # tabla 2: por region
    t2 = rows(z, r'fae_table2_'); ry = sorted({r['survey_year'] for r in t2})
    regions = {}
    for r in t2:
        if r['measure'] != 'FBI': continue
        regions.setdefault(r['region'], {}).setdefault(r['farm_type'], [None] * len(ry))[ry.index(r['survey_year'])] = num(r['value'])
    # tabla 5a y 5c: produccion, costes y renta por tipo de granja (todas las explotaciones, sin separar zonas desfavorecidas)
    t5a = rows(z, r'fae_table5a_'); cy = sorted({r['survey_year'] for r in t5a})
    costs = {}
    for r in t5a:
        if r['sda_status'] != 'All Farms' or r['cost_centre'] not in ('Agriculture', 'Farm Business'): continue
        c = costs.setdefault(r['farm_type'], {'summary': {}, 'detail': {}, 'n': {}})
        key = r['cost_centre'] + '|' + r['measure']
        c['summary'].setdefault(key, [None] * len(cy))[cy.index(r['survey_year'])] = num(r['value'])
        c['n'][r['survey_year']] = num(r['sample_size'])
    for r in rows(z, r'fae_table5c_'):
        if r['sda_status'] != 'All Farms' or not r['fbs_variable'].startswith('agriculture.') or r['farm_type'] not in costs: continue
        costs[r['farm_type']]['detail'].setdefault(r['measure'], [None] * len(cy))[cy.index(r['survey_year'])] = num(r['value'])
    if len(years) < 5 or 'All Types' not in income or len(costs) < 5: raise SystemExit('estructura inesperada: %s %s %s' % (years, list(income)[:3], list(costs)))
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'scope': 'England', 'unit': 'GBP per farm',
           'source': {'name': 'Defra, Farm Business Survey: Farm Accounts in England', 'url': PAGE, 'license': 'Open Government Licence v3.0', 'file': url},
           'years': years, 'typology': typo, 'income': income, 'regionYears': ry, 'regions': regions, 'costYears': cy, 'costs': costs}
    p = ROOT / 'data' / 'uk-farm-accounts.json'
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
        if o == n: log('sin cambios')
        else: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    except Exception: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('ejercicios', years[0], '-', years[-1], '| FBI todas', income['All Types']['FBI']['current'][-1], '| tipos', len(costs))
    (ROOT / 'data' / 'uk-farm-accounts-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

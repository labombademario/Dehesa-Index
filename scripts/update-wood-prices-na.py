#!/usr/bin/env python3
"""data/wood-prices-na.json — precios de la madera de EE. UU. y Canadá para la pestaña «Madera» del panel de precios.

EE. UU.: Bureau of Labor Statistics, Producer Price Index por producto (sin desestacionalizar, 1982 = 100), API publica v1. Dominio publico.
         WPU081 madera aserrada (total), WPU0811 de coniferas, WPU0812 de frondosas, WPU083 contrachapado, WPU085 trozas, rollizos y madera para pasta.
Canadá: Statistics Canada, tabla 18-10-0266-01 (Industrial product price index, by product, monthly), Open Government Licence - Canada.
         Se guardan las filas de Canadá cuyo producto es madera aserrada (lumber) o madera en rollo / astillas.
Son INDICES de precios (no dolares por pie tablar ni por m3): dicen cuanto sube o baja la madera, no cuanto cuesta.
El futuro de madera del CME no se usa: su licencia prohibe redistribuirlo (ver data/license-registry.json).
Si una fuente falla se conserva lo publicado de esa fuente; nunca se rellena ni se estima. Uso: python3 scripts/update-wood-prices-na.py"""
import csv, datetime, io, json, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'wood-prices-na.json'
LOGF = ROOT / 'data' / 'wood-prices-na-log.txt'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com; dehesaindex@gmail.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(time.strftime('%H:%M:%S ') + s); print(s, flush=True)

BLS = {'lumber': 'WPU081', 'softwood': 'WPU0811', 'hardwood': 'WPU0812', 'plywood': 'WPU083', 'logs': 'WPU085'}
FIRST = 1990

def http(url, body=None, tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            h = dict(UA); data = None
            if body is not None: data = json.dumps(body).encode(); h['Content-Type'] = 'application/json'
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout) as r: return r.read()
        except Exception as e:
            last = e; log('  error', url[:90], repr(e)[:120]); time.sleep(5 * (i + 1))
    raise RuntimeError('%s -> %s' % (url[:90], last))

def bls():
    """{clave: {AAAA-MM: valor}} de la API v1 (tramos de 10 años, como pide la v1)."""
    out = {k: {} for k in BLS}; inv = {v: k for k, v in BLS.items()}
    y, end = FIRST, datetime.date.today().year
    while y <= end:
        e = min(y + 9, end)
        d = json.loads(http('https://api.bls.gov/publicAPI/v1/timeseries/data/', {'seriesid': list(BLS.values()), 'startyear': str(y), 'endyear': str(e)}))
        if d.get('status') != 'REQUEST_SUCCEEDED': raise RuntimeError('BLS %s %s' % (d.get('status'), d.get('message')))
        for s in d['Results']['series']:
            k = inv.get(s['seriesID'])
            for p in s.get('data', []):
                if k and p['period'].startswith('M') and p['period'] != 'M13':
                    try: out[k]['%s-%s' % (p['year'], p['period'][1:])] = float(p['value'])
                    except ValueError: pass   # '-' = sin dato ese mes
        for m in d.get('message') or []: log('  BLS:', str(m)[:160])
        y = e + 1; time.sleep(2)
    for k, v in out.items(): log('BLS %s (%s): %d meses%s' % (k, BLS[k], len(v), (', ultimo ' + max(v)) if v else ''))
    return {k: v for k, v in out.items() if len(v) >= 24}

def statcan():
    """Filas de Canada de la tabla 18-10-0266-01 cuyo producto es madera aserrada o en rollo."""
    info = json.loads(http('https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/18100266/en'))
    raw = http(info['object'], timeout=300, tries=4)
    z = zipfile.ZipFile(io.BytesIO(raw)); name = [n for n in z.namelist() if n.endswith('.csv') and 'MetaData' not in n][0]
    rd = csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig'))
    pcol = next((c for c in rd.fieldnames if 'NAPCS' in c or 'product' in c.lower()), None)
    log('StatCan columnas:', rd.fieldnames[:8], '-> producto =', pcol)
    out, seen = {}, set()
    for r in rd:
        prod = (r.get(pcol) or '').strip()
        low = prod.lower()
        if r.get('GEO') != 'Canada' or not any(w in low for w in ('lumber', 'roundwood', 'pulpwood', 'logs and bolts', 'wood chips')): continue
        seen.add(prod)
        try: v = float(r['VALUE'])
        except (TypeError, ValueError): continue
        out.setdefault(prod, {})[r['REF_DATE'][:7]] = v
    log('StatCan productos de madera encontrados:', sorted(seen))
    return {k: v for k, v in out.items() if len(v) >= 24}

def pack(series, src):
    ms = sorted({m for s in series.values() for m in s})
    return {'source': src, 'months': ms, 'series': {k: [s.get(m) for m in ms] for k, s in series.items()}}

def main():
    old = {}
    try: old = json.loads(OUT.read_text()).get('countries', {})
    except Exception: pass
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': 'INDEX', 'countries': {}}
    ok = 0
    try:
        s = bls()
        if 'lumber' not in s: raise RuntimeError('sin la serie principal WPU081')
        doc['countries']['US'] = pack(s, {'name': 'U.S. Bureau of Labor Statistics, Producer Price Index (commodity data, not seasonally adjusted)', 'url': 'https://www.bls.gov/ppi/',
                                          'license': 'Public domain (U.S. Government work)', 'base': '1982=100', 'ids': {k: BLS[k] for k in s}}); ok += 1
    except Exception as e:
        log('FALLO EE. UU.:', repr(e)[:200])
        if 'US' in old: doc['countries']['US'] = old['US']; log('  se conserva lo publicado de EE. UU.')
    try:
        s = statcan()
        if not s: raise RuntimeError('ningun producto de madera con 24 meses o mas en la tabla 18-10-0266-01')
        doc['countries']['CA'] = pack(s, {'name': 'Statistics Canada, table 18-10-0266-01 (Industrial product price index, by product, monthly)', 'url': 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810026601',
                                          'license': 'Open Government Licence - Canada', 'base': 'see product (StatCan IPPI base)'}); ok += 1
    except Exception as e:
        log('FALLO Canada:', repr(e)[:200])
        if 'CA' in old: doc['countries']['CA'] = old['CA']; log('  se conserva lo publicado de Canada')
    LOGF.write_text('\n'.join(LOG) + '\n')
    if not doc['countries']: log('nada que escribir'); sys.exit(1)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    log('ok:', ', '.join('%s %d series' % (c, len(v['series'])) for c, v in doc['countries'].items()))
    if not ok: sys.exit(1)

main()

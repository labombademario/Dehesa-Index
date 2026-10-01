#!/usr/bin/env python3
"""Tipos de interés oficiales (EE. UU., UE/BCE, Canadá, Australia). Fuentes primarias con respaldo BIS. Salida en formato de estadísticas por país."""
import csv, io, json, os, sys, time, datetime, urllib.request

LOG = []
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36 DehesaIndex/1.0'

def log(m):
    LOG.append(datetime.datetime.utcnow().strftime('%H:%M:%S ') + m); print(m)

def fetch(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                return r.read().decode('utf-8-sig')
        except Exception as e:
            log('  error %s: %s' % (url[:100], e)); time.sleep(2)
    return None

def monthly(daily):
    """[(YYYY-MM-DD, v)] -> [[YYYY-MM, v]] con el último valor de cada mes."""
    m = {}
    for d, v in sorted(daily):
        m[d[:7]] = v
    return [[k, m[k]] for k in sorted(m)]

def us_fred(sid):
    t = fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + sid)
    if not t: return None
    rows = [r for r in csv.reader(io.StringIO(t))][1:]
    return monthly([(r[0], float(r[1])) for r in rows if len(r) > 1 and r[1] not in ('', '.')])

def ca_boc():
    t = fetch('https://www.bankofcanada.ca/valet/observations/V39079/json?start_date=1990-01-01')
    if not t: return None
    o = json.loads(t)['observations']
    return monthly([(x['d'], float(x['V39079']['v'])) for x in o if 'V39079' in x])

def eu_ecb(key):
    t = fetch('https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.%s.LEV?format=csvdata&startPeriod=1999-01-01' % key)
    if not t: return None
    rd = csv.DictReader(io.StringIO(t))
    return monthly([(r['TIME_PERIOD'], float(r['OBS_VALUE'])) for r in rd if r.get('OBS_VALUE')])

def au_rba():
    t = fetch('https://www.rba.gov.au/statistics/tables/csv/f1.1-data.csv')
    if not t: return None
    rows = list(csv.reader(io.StringIO(t)))
    ids = next((r for r in rows if r and r[0].strip().lower() == 'series id'), None)
    if not ids or 'FIRMMCRT' not in ids: return None
    ci = ids.index('FIRMMCRT'); out = []
    for r in rows:
        if len(r) > ci and r[ci].strip() and len(r[0]) >= 8 and r[0][2] in '-/' :
            try:
                dd = datetime.datetime.strptime(r[0].strip(), '%d-%b-%Y').strftime('%Y-%m-%d')
            except ValueError:
                try: dd = datetime.datetime.strptime(r[0].strip(), '%d/%m/%Y').strftime('%Y-%m-%d')
                except ValueError: continue
            out.append((dd, float(r[ci])))
    return monthly(out) if out else None

def bis(area):
    t = fetch('https://stats.bis.org/api/v1/data/WS_CBPOL/M.%s?format=csv&startPeriod=1990' % area)
    if not t: return None
    rd = csv.DictReader(io.StringIO(t))
    pts = [[r['TIME_PERIOD'], float(r['OBS_VALUE'])] for r in rd if r.get('OBS_VALUE')]
    return sorted(pts) or None

SRC = {
    'US': ('Federal Reserve (FRED)', 'https://fred.stlouisfed.org/series/FEDFUNDS', 'Public domain (U.S. Government work); FRED terms of use'),
    'EU': ('European Central Bank (ECB Data Portal)', 'https://data.ecb.europa.eu/', 'ECB reuse policy (attribution)'),
    'CA': ('Bank of Canada (Valet API)', 'https://www.bankofcanada.ca/valet/', 'Bank of Canada terms of use (attribution)'),
    'AU': ('Reserve Bank of Australia (F1.1)', 'https://www.rba.gov.au/statistics/tables/', 'RBA copyright notice (attribution)')
}
BISAREA = {'US': 'US', 'EU': 'XM', 'CA': 'CA', 'AU': 'AU'}
LABEL = {
    'US': [('us-policy-rate', 'Federal funds rate (effective, monthly)', lambda: us_fred('FEDFUNDS'), 'FEDFUNDS'),
           ('us-target-upper', 'Federal funds target range: upper limit (monthly)', lambda: us_fred('DFEDTARU'), 'DFEDTARU')],
    'EU': [('eu-policy-rate', 'ECB main refinancing operations rate (monthly)', lambda: eu_ecb('MRR_FR'), 'MRR'),
           ('eu-deposit-rate', 'ECB deposit facility rate (monthly)', lambda: eu_ecb('DFR'), 'DFR')],
    'CA': [('ca-policy-rate', 'Bank of Canada target overnight rate (monthly)', ca_boc, 'CA')],
    'AU': [('au-policy-rate', 'RBA cash rate target (monthly)', au_rba, 'AU')]
}
countries = {}
for cc, lst in LABEL.items():
    series = []
    for sid, label, fn, tag in lst:
        pts = None
        try: pts = fn()
        except Exception as e: log('  fallo %s: %s' % (sid, e))
        used = 'primaria'
        if not pts and sid.endswith('policy-rate'):
            pts = bis(BISAREA[cc]); used = 'BIS (respaldo)'
        if not pts:
            log('%s: sin datos' % sid); continue
        log('%s: %d puntos, ultimo %s=%s (%s)' % (sid, len(pts), pts[-1][0], pts[-1][1], used))
        series.append({'id': sid, 'group': 'rates', 'label': label, 'unit': '%', 'frequency': 'monthly', 'latestPeriod': pts[-1][0],
                       'latest': pts[-1][1], 'changePct': None, 'points': pts, 'sourceGroup': 'rates'})
    if series:
        n, u, l = SRC[cc]
        countries[cc] = {'name': cc, 'source': {'name': n, 'url': u, 'license': l}, 'extend': cc in ('CA', 'AU'), 'series': series}
        if cc in ('CA', 'AU'): countries[cc]['source']['name'] = n
os.makedirs('data', exist_ok=True)
open('data/interest-rates-log.txt', 'w').write('\n'.join(LOG) + '\n')
if len(countries) < 3:
    sys.exit(1)
json.dump({'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': countries, 'log': LOG}, open('data/interest-rates-stats.json', 'w'), ensure_ascii=False)

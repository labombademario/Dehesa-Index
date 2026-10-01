#!/usr/bin/env python3
"""Indicadores macro por país: Banco Mundial (PIB, PIB per cápita, población, paro, peso agrario) y FMI DataMapper (deuda/PIB)."""
import json, os, sys, time, datetime, urllib.request

WB = {'ES': 'ESP', 'FR': 'FRA', 'DE': 'DEU', 'BE': 'BEL', 'AT': 'AUT', 'PT': 'PRT', 'DK': 'DNK', 'NL': 'NLD', 'CA': 'CAN', 'AU': 'AUS', 'EU': 'EUU'}
IND = {'gdp': 'NY.GDP.MKTP.CD', 'gdppc': 'NY.GDP.PCAP.CD', 'pop': 'SP.POP.TOTL', 'unemp': 'SL.UEM.TOTL.ZS', 'agri': 'NV.AGR.TOTL.ZS'}
CUR = {c: 'EUR' for c in ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'NL', 'EU']}
CUR.update({'DK': 'DKK', 'CA': 'CAD', 'AU': 'AUD'})
LOG = []

def log(m):
    LOG.append(datetime.datetime.utcnow().strftime('%H:%M:%S ') + m); print(m)

def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'DehesaIndex/1.0'}), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            log('  error %s: %s' % (url[:90], e)); time.sleep(2)
    return None

out = {c: {'currency': CUR[c]} for c in WB}
for k, code in IND.items():
    d = get('https://api.worldbank.org/v2/country/%s/indicator/%s?format=json&mrnev=1&per_page=200' % (';'.join(WB.values()), code))
    n = 0
    if d and len(d) > 1 and d[1]:
        inv = {v: c for c, v in WB.items()}
        for r in d[1]:
            c = inv.get(r['countryiso3code'])
            if c and r.get('value') is not None:
                out[c][k] = {'v': r['value'], 'y': int(r['date'])}; n += 1
    log('%s: %d paises' % (k, n))
# deuda pública bruta / PIB (FMI)
d = get('https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/' + '/'.join(WB[c] for c in WB if c != 'EU'))
n = 0
if d and 'values' in d:
    inv = {v: c for c, v in WB.items()}
    cy = datetime.date.today().year
    for iso, ser in d['values'].get('GGXWDG_NGDP', {}).items():
        c = inv.get(iso)
        yrs = [int(y) for y in ser if int(y) <= cy - 1 and ser[y] is not None]
        if c and yrs:
            y = max(yrs); out[c]['debt'] = {'v': ser[str(y)], 'y': y}; n += 1
log('debt: %d paises' % n)
tot = sum(len(v) - 1 for v in out.values())
os.makedirs('data', exist_ok=True)
open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n')
if tot < 40:
    log('muy pocos datos'); open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
json.dump({'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'sources': {'wb': {'name': 'World Bank Open Data', 'url': 'https://data.worldbank.org/', 'license': 'CC BY 4.0'},
                       'imf': {'name': 'IMF DataMapper (WEO)', 'url': 'https://www.imf.org/external/datamapper', 'license': 'IMF terms of use'}},
           'countries': out}, open('data/country-macro.json', 'w'), ensure_ascii=False, indent=1)

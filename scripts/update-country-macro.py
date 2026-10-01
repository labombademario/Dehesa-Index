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
# deuda pública bruta / PIB: FMI; si falla, Eurostat (UE) y Banco Mundial (gobierno central, Canadá y Australia)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
def get_ua(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'}), timeout=40) as r:
            return json.load(r)
    except Exception as e:
        log('  error %s: %s' % (url[:90], e)); return None
inv = {v: c for c, v in WB.items()}
n = 0
cy = datetime.date.today().year
for c, iso in WB.items():
    if c == 'EU': continue
    d = get_ua('https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/' + iso)
    ser = (d or {}).get('values', {}).get('GGXWDG_NGDP', {}).get(iso, {})
    yrs = [int(y) for y in ser if int(y) <= cy - 1 and ser[y] is not None]
    if yrs:
        y = max(yrs); out[c]['debt'] = {'v': ser[str(y)], 'y': y, 'src': 'imf'}; n += 1
log('debt FMI: %d paises' % n)
for c in WB:
    if 'debt' in out[c]: continue
    if c in ('CA', 'AU'):
        d = get('https://api.worldbank.org/v2/country/%s/indicator/GC.DOD.TOTL.GD.ZS?format=json&mrnev=1' % WB[c])
        r = d[1][0] if d and len(d) > 1 and d[1] else None
        if r and r.get('value') is not None:
            out[c]['debt'] = {'v': r['value'], 'y': int(r['date']), 'src': 'wb-central'}; log('debt %s WB central' % c)
    else:
        geo = 'EU27_2020' if c == 'EU' else c
        d = get('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10dd_edpt1?format=JSON&lang=EN&geo=%s&unit=PC_GDP&sector=S13&na_item=GD&sinceTimePeriod=2020' % geo)
        try:
            tpos = d['dimension']['time']['category']['index']; inv_t = {v: k for k, v in tpos.items()}
            vals = {inv_t[int(i)]: v for i, v in d['value'].items()}
            y = max(vals); out[c]['debt'] = {'v': vals[y], 'y': int(y), 'src': 'eurostat'}; log('debt %s Eurostat %s' % (c, y))
        except Exception as e:
            log('debt %s sin dato (%s)' % (c, e))
tot = sum(len(v) - 1 for v in out.values())
os.makedirs('data', exist_ok=True)
open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n')
if tot < 40:
    log('muy pocos datos'); open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
json.dump({'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'sources': {'wb': {'name': 'World Bank Open Data', 'url': 'https://data.worldbank.org/', 'license': 'CC BY 4.0'},
                       'imf': {'name': 'IMF DataMapper (WEO)', 'url': 'https://www.imf.org/external/datamapper', 'license': 'IMF terms of use'}, 'eurostat': {'name': 'Eurostat (gov_10dd_edpt1)', 'url': 'https://ec.europa.eu/eurostat/', 'license': 'CC BY 4.0'}},
           'countries': out}, open('data/country-macro.json', 'w'), ensure_ascii=False, indent=1)

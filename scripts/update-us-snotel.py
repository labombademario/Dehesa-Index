#!/usr/bin/env python3
"""EE. UU. Oeste: equivalente en agua de la nieve (SWE) de la red SNOTEL (USDA NRCS, AWDB REST) -> data/us-snotel-stats.json (countries.US, extend).
Por estado: media mensual del SWE (pulgadas) de las estaciones SNOTEL activas que informan ese mes, y porcentaje sobre la mediana 1991-2020 de esas mismas estaciones (suma de valores / suma de medianas).
La agregacion por estado es nuestra (media simple de estaciones, sin ponderar por altitud ni superficie): se anota en periodNote. Un fallo no borra lo anterior."""
import collections, datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-snotel-stats.json'; LOGF = ROOT / 'data/us-snotel-log.txt'
API = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
NAMES = {'AZ': 'Arizona', 'CA': 'California', 'CO': 'Colorado', 'ID': 'Idaho', 'MT': 'Montana', 'NV': 'Nevada', 'NM': 'New Mexico', 'OR': 'Oregon', 'UT': 'Utah', 'WA': 'Washington', 'WY': 'Wyoming', 'AK': 'Alaska'}
NOTE = 'Simple mean over the active SNOTEL stations that report in each month (not weighted by elevation or area); the station set can change over time.'
def get(path, params, tries=3):
    err = None
    for k in range(tries):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(API + path + '?' + urllib.parse.urlencode(params, safe=','), headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=120).read().decode('utf-8'))
        except Exception as e: err = e; time.sleep(4 * (k + 1))
    raise err
def main():
    now = datetime.date.today()
    st = get('stations', {'stationTriplets': '*:*:SNTL', 'activeOnly': 'true'})
    by = collections.defaultdict(list)
    for s in st:
        if s.get('stateCode') in NAMES: by[s['stateCode']].append(s['stationTriplet'])
    log('estaciones', {k: len(v) for k, v in sorted(by.items())})
    out = []
    for cc, trip in sorted(by.items()):
        vals = collections.defaultdict(list); meds = collections.defaultdict(list)
        for i in range(0, len(trip), 40):
            chunk = trip[i:i + 40]
            try: d = get('data', {'stationTriplets': ','.join(chunk), 'elements': 'WTEQ', 'duration': 'MONTHLY', 'beginDate': '2010-01-01', 'endDate': '%d-12-31' % now.year})
            except Exception as e: log('ERROR', cc, i, repr(e)[:120]); continue
            for stn in d:
                for blk in stn.get('data', []):
                    for v in blk.get('values', []):
                        if v.get('value') is None: continue
                        per = '%04d-%02d' % (v['year'], v['month'])
                        vals[per].append(float(v['value']))
                        if v.get('median') is not None: meds[per].append((float(v['value']), float(v['median'])))
            time.sleep(0.3)
        pts = [[p, round(sum(x) / len(x), 2)] for p, x in sorted(vals.items()) if len(x) >= 5]
        pct = [[p, round(sum(a for a, b in m) / sum(b for a, b in m) * 100, 1)] for p, m in sorted(meds.items()) if len(m) >= 5 and sum(b for a, b in m) > 0.5]
        for sid, lab, unit, pp in (('swe', 'snow water equivalent (SNOTEL mean)', 'in', pts), ('pctmedian', 'snow water equivalent, % of 1991-2020 median (SNOTEL)', '%', pct)):
            if len(pp) < 60: log('pocos datos', cc, sid, len(pp)); continue
            out.append({'id': 'us-snotel-%s-%s' % (cc.lower(), sid), 'group': 'climate', 'label': '%s: %s' % (NAMES[cc], lab), 'unit': unit, 'frequency': 'monthly', 'latestPeriod': pp[-1][0], 'latest': pp[-1][1],
                        'changePct': None, 'points': pp, 'sourceGroup': 'USDA NRCS SNOTEL', 'periodNote': NOTE})
    log('series', len(out))
    LOGF.write_text('\n'.join(LOG[-60:]) + '\n', encoding='utf-8')
    if len(out) < 12: log('demasiado pocas series; no se escribe'); sys.exit(1)
    src = {'name': 'USDA Natural Resources Conservation Service - SNOTEL (AWDB REST API)', 'url': 'https://www.nrcs.usda.gov/resources/data-and-reports/snow-and-water-interactive-map', 'license': 'US Government work (public domain); cite USDA NRCS'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': src, 'series': out}}, 'log': LOG[-30:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
main()

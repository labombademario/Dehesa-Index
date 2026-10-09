import json, urllib.request, urllib.parse
from pathlib import Path
O = Path('probe_es7'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
E = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read().decode('utf8', 'replace')
    except Exception as e: return 'ERR %s' % e
res = {}
for ds, q in (('apri_pi_outq', 'geo=ES&unit=I20&p_adj=NI&lastTimePeriod=1'), ('apri_pi20_outa', 'geo=ES&lastTimePeriod=1'), ('apri_pi15_outa', 'geo=ES&lastTimePeriod=1'), ('apri_pi10_outa', 'geo=ES&lastTimePeriod=1'),
              ('apri_pi_outm', 'geo=ES&lastTimePeriod=1')):
    r = get(E + ds + '?format=JSON&lang=EN&' + q)
    try:
        j = json.loads(r); dim = 'am_item' if 'am_item' in j['dimension'] else [k for k in j['dimension'] if k not in ('freq', 'unit', 'geo', 'time', 'p_adj', 'currency')][0]
        idx = j['dimension'][dim]['category']; ids, sizes = j['id'], j['size']
        have = set()
        for p in j['value']:
            pos = int(p); d = []
            for s in reversed(sizes): d.append(pos % s); pos //= s
            d.reverse(); have.add(list(idx['index'])[d[ids.index(dim)]])
        res[ds] = {k: idx['label'][k] for k in sorted(have)}
    except Exception as e: res[ds] = 'ERR %s %s' % (e, r[:200])
Path(O / 'pi.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
print('ok')

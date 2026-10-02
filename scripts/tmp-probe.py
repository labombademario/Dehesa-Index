import json, os, urllib.request, urllib.parse
os.makedirs("tmp-probe", exist_ok=True)
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out = []
def get(ds, **f):
    q = urllib.parse.urlencode(dict(f, format='JSON', lang='EN'), doseq=True)
    with urllib.request.urlopen(urllib.request.Request(API + ds + '?' + q, headers={'User-Agent': 'DehesaIndex'}), timeout=180) as r:
        return json.load(r)
def geos(ds, **f):
    d = get(ds, **f); c = d['dimension']['geo']['category']; return list(c['index'].keys()), c.get('label', {})
for ds, f in [('apro_cpshr', dict(crops='C1100', strucpro='AR_THS_HA', time='2022')), ('apro_mt_ls_r', dict(animals='A2000', time='2022')), ('aact_eaa01_r', dict(am_item='AM160000', indic_agr='PRD_BP', unit='MIO_EUR', time='2022')), ('agr_r_milkpr', dict(time='2022')), ('ef_m_farmleg', dict(statinfo='TOTAL', leg_form='TOTAL', farmtype='TOTAL', so_eur='TOTAL', uaarea='TOTAL', unit='HLD', time='2023'))]:
    try:
        g, lab = geos(ds, **f)
        sel = [x for x in g if x[:2] in ('DE', 'FR', 'IT', 'ES')]
        out.append("== %s total geos=%d  sel=%d" % (ds, len(g), len(sel)))
        out.append("  " + "; ".join("%s=%s" % (x, lab.get(x, '')[:22]) for x in sel))
    except Exception as e:
        out.append("== %s ERR %s" % (ds, repr(e)[:200]))
# EAA sample FRH0 2022
try:
    d = get('aact_eaa01_r', geo='FRH0', time='2022', unit='MIO_EUR')
    ids = d['id']; sz = d['size']; dim = {k: list(d['dimension'][k]['category']['index'].keys()) for k in ids}
    import itertools
    vals = d['value']
    pos = {k: 0 for k in ids}
    out.append("== EAA FRH0 2022 MIO_EUR")
    for key, v in vals.items():
        i = int(key); coords = []
        for k, s in zip(reversed(ids), reversed(sz)):
            coords.append(i % s); i //= s
        coords = dict(zip(reversed(ids), reversed(coords)))
        out.append("  %s %s = %s" % (dim['am_item'][coords['am_item']], dim['indic_agr'][coords['indic_agr']], v))
except Exception as e:
    out.append("EAA ERR " + repr(e)[:200])
open("tmp-probe/eurostat-geos.txt", "w").write("\n".join(out))

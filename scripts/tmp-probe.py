import json, os, urllib.request, urllib.parse
os.makedirs("tmp-probe", exist_ok=True)
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
out = []
def get(ds, **f):
    q = urllib.parse.urlencode(dict(f, format='JSON', lang='EN'), doseq=True)
    with urllib.request.urlopen(urllib.request.Request(API + ds + '?' + q, headers={'User-Agent': 'DehesaIndex'}), timeout=180) as r:
        return json.load(r)
for ds, geo in [('aact_eaa01_r', 'FRH0'), ('apro_cpshr', 'FRH0'), ('apro_cpshr', 'ES61'), ('apro_mt_ls_r', 'ITH1'), ('apro_mt_ls_r', 'DE21'), ('apro_cpshr', 'DE21'), ('aact_eaa01_r', 'DE21'), ('ef_m_farmleg', 'ES61')]:
    try:
        d = get(ds, geo=geo)
        dims = d['id']; sz = d['size']
        out.append("== %s geo=%s size=%s values=%d" % (ds, geo, dict(zip(dims, sz)), len(d.get('value', {}))))
        for k in dims:
            c = d['dimension'][k]['category']
            lab = c.get('label', {}); idx = list(c['index'].keys()) if isinstance(c['index'], dict) else c['index']
            if k in ('geo','freq') : continue
            out.append("  %s (%d): %s" % (k, len(idx), "; ".join("%s=%s" % (i, str(lab.get(i, ''))[:40]) for i in idx[:90])))
    except Exception as e:
        out.append("== %s geo=%s ERR %s" % (ds, geo, repr(e)[:200]))
open("tmp-probe/eurostat-dims.txt", "w").write("\n".join(out))

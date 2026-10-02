import os, urllib.request, re, json
os.makedirs("tmp-probe", exist_ok=True)
log = []
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(u, n=3000):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60); b = r.read(); return r.status, r.headers.get("content-type"), len(b), b[:n].decode("utf-8", "replace")
    except Exception as e: return "ERR", repr(e), 0, ""
B="https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/"
def links(u):
    s,ct,n,t=get(u,200000); return s, re.findall(r'href="([^"?/][^"]*/?)"', t) if s==200 else t
for sub in ["shp/","geoJSON/","tif/","fgdb/"]:
    s,l=links(B+sub); log.append("== %s %s %s" % (sub, s, (l[:12]+["..."]+l[-12:]) if isinstance(l,list) else l))
    if isinstance(l,list):
        for d in [x for x in l if x.endswith("/")][:4]+[x for x in l if x.endswith("/")][-2:]:
            s2,l2=links(B+sub+d); log.append("   -- %s%s %s %s" % (sub,d,s2,(l2[:6]+["..."]+l2[-8:]) if isinstance(l2,list) else str(l2)[:200]))
open("tmp-probe/run15.txt", "w").write("\n".join(log))

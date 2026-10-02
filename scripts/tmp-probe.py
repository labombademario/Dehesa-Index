import os, urllib.request, re, json
os.makedirs("tmp-probe", exist_ok=True)
log = []
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(u, n=3000):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60); b = r.read(); return r.status, r.headers.get("content-type"), len(b), b[:n].decode("utf-8", "replace")
    except Exception as e: return "ERR", repr(e), 0, ""
for u in ["https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/shp/monthly_mensuel/",
          "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/monthly_mensuel/",
          "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/",
          "https://www.agr.gc.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/shp/monthly_mensuel/",
          "https://open.canada.ca/data/en/dataset/294d1af6-7aa8-4a8a-9f05-ec8d3b6ca0a5"]:
    s, ct, n, t = get(u); log.append("== %s -> %s %s %d\n%s" % (u, s, ct, n, t[:2500]))
open("tmp-probe/run14.txt", "w").write("\n".join(log))

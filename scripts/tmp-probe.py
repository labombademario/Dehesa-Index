import os, urllib.request, re, json
os.makedirs("tmp-probe", exist_ok=True)
log = []
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def raw(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120); return r.read()
B = "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/"
try:
    t = raw(B + "2026/").decode(); l = re.findall(r'href="([^"?/][^"]*)"', t); log.append("2026 files: %s" % l)
    t2 = raw(B + "2025/").decode(); l2 = re.findall(r'href="([^"?/][^"]*)"', t2); log.append("2025 files: %s" % l2)
    f = sorted(l)[-1]; b = raw(B + "2026/" + f); log.append("latest %s %d bytes" % (f, len(b)))
    open("tmp-probe/cdm-latest.geojson", "wb").write(b)
    d = json.loads(b); log.append("keys %s crs %s nfeat %d" % (list(d), d.get("crs"), len(d["features"])))
    for ft in d["features"][:8]: log.append("props %s geom %s coords-ex %s" % (ft["properties"], ft["geometry"]["type"], json.dumps(ft["geometry"]["coordinates"])[:120]))
except Exception as e: log.append("ERR %r" % e)
for u in ["https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"]:
    try: b = raw(u); log.append("%s %d bytes" % (u.split("/")[-1], len(b)))
    except Exception as e: log.append("ERR %s %r" % (u, e))
open("tmp-probe/run16.txt", "w").write("\n".join(log))

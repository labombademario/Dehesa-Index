import json, urllib.request, os, re, csv, io, collections, zipfile
os.makedirs("tmp-probe", exist_ok=True)
out = []
def getb(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
    r = urllib.request.urlopen(req, timeout=180); return r.read()
def save(): open("tmp-probe/probe6.txt","w").write("\n".join(out)[:60000])
try:
    b = getb("https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/2026-27/gsw-shg-en.csv").decode("utf-8", "replace")
    rows = list(csv.DictReader(io.StringIO(b)))
    for ws, me in (("Terminal Exports", "Exports"), ("Primary", "Deliveries"), ("Primary", "Shipments"), ("Summary", "Stocks")):
        sub = [r for r in rows if r["worksheet"] == ws and r["metric"] == me]
        out.append("== %s/%s rows %d regions %s grains %s grades %s" % (ws, me, len(sub), sorted({r["Region"] for r in sub}), sorted({r["grain"] for r in sub}), sorted({r["grade"] for r in sub})[:15]))
        for r in [x for x in sub if x["Grain Week"] == "8" and x["grain"] in ("Wheat", "Canola")][:24]:
            out.append("   %s %s %s %s %s %s" % (r["period"], r["grain"], r["grade"], r["Region"], r["Ktonnes"], r["Week Ending Date"]))
except Exception as e: out.append("CGC ERR " + repr(e))
save()
try:
    z = zipfile.ZipFile(io.BytesIO(getb("https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/2026/cdm_2608_drought_areas_json.zip")))
    out.append("== zip files: " + str([(i.filename, i.file_size) for i in z.infolist()]))
    nm = z.namelist()[0]; j = json.loads(z.read(nm))
    out.append("%s keys %s crs %s nfeat %d" % (nm, list(j.keys()), j.get("crs"), len(j["features"])))
    for f in j["features"][:3]:
        g = f["geometry"]; out.append("  props %s geom %s coords-sample %s" % (json.dumps(f["properties"]), g["type"], json.dumps(g["coordinates"])[:200]))
except Exception as e: out.append("DROUGHT ERR " + repr(e))
save()
for u in ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"):
    try:
        b = getb(u); j = json.loads(b)
        ca = [f for f in j["features"] if f["properties"].get("adm0_a3") == "CAN"]
        out.append("== %s %d bytes; CAN features %d: %s" % (u.split("/")[-1], len(b), len(ca), [(f["properties"].get("name"), f["properties"].get("iso_3166_2")) for f in ca]))
    except Exception as e: out.append("NE ERR %s %r" % (u, e))
save()

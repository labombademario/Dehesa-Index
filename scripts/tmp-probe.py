import json, urllib.request, os, re, csv, io, collections
os.makedirs("tmp-probe", exist_ok=True)
out = []
def get(url, n=None):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
        r = urllib.request.urlopen(req, timeout=120); b = r.read()
        return r.status, r.headers.get("content-type"), len(b), (b if n is None else b[:n]).decode("utf-8", "replace")
    except Exception as e:
        return "ERR", repr(e), 0, ""
def save(): open("tmp-probe/probe5.txt","w").write("\n".join(out)[:60000])
base = "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/2026/"
s,t,n,b = get(base)
rows = re.findall(r'href="([^"?]+)"', b)
out.append("== drought 2026 dir %s %d links: %s" % (s, len(rows), rows[:40])); save()
files = [r for r in rows if r.lower().endswith(("json", "zip"))]
out.append("files: %s" % files[-12:])
if files:
    u = base + files[-1]; s,t,n,b = get(u)
    out.append("== %s %s %s %s bytes" % (u, s, t, n))
    try:
        j = json.loads(b); out.append("features %d crs %s" % (len(j["features"]), j.get("crs")))
        for f in j["features"][:10]: out.append("  " + json.dumps(f["properties"], ensure_ascii=False)[:300] + " | " + f["geometry"]["type"])
    except Exception as e: out.append("parse " + repr(e) + b[:400])
save()
s,t,n,b = get("https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/2026-27/gsw-shg-en.csv")
rows = list(csv.DictReader(io.StringIO(b)))
c = collections.Counter((r["worksheet"], r["metric"], r["period"]) for r in rows)
out.append("== combos worksheet/metric/period: " + str(len(c)))
for k, v in sorted(c.items()): out.append("  %s : %d" % (k, v))
out.append("grains: " + str(sorted({r["grain"] for r in rows})))
out.append("regions(Summary Exports): " + str(sorted({r["Region"] for r in rows if r["worksheet"] == "Summary" and r["metric"] == "Exports"})))
for r in rows:
    if r["worksheet"] == "Summary" and r["grain"] in ("Wheat", "Canola") and r["grain week"] if False else False: pass
for r in rows:
    if r["worksheet"] == "Summary" and r["Grain Week"] == "8" and r["grain"] in ("Wheat", "Canola", "Durum"):
        out.append("  " + json.dumps(r))
save()

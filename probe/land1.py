import urllib.request, os, json, gzip
os.makedirs("probe/land-out", exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=120):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
E = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/%s?format=JSON&lang=EN&unit=EUR_HA&sinceTimePeriod=2012"
for ds in ("apri_lprc", "apri_lrnt"):
    try:
        b = get(E % ds); open("probe/land-out/%s.json" % ds, "wb").write(b); print(ds, len(b))
    except Exception as e: print(ds, "ERROR", e)
try:
    b = get("https://www.data.gouv.fr/api/1/datasets/agreste-valeur-venale-des-terres/"); open("probe/land-out/dg.json", "wb").write(b)
    d = json.loads(b)
    for r in d.get("resources", []):
        print("RES", r.get("title"), r.get("format"), r.get("url"), r.get("filesize"))
        try:
            x = get(r["url"]); n = "probe/land-out/fr_" + "".join(c if c.isalnum() else "_" for c in r.get("title", "x"))[:40] + "." + (r.get("format") or "bin")
            open(n, "wb").write(x[:3000000]); print("  saved", n, len(x))
        except Exception as e: print("  ERROR", e)
except Exception as e: print("data.gouv ERROR", e)

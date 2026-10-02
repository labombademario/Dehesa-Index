import json, urllib.request, os, re, csv, io, collections, zipfile
os.makedirs("tmp-probe", exist_ok=True)
out = []
def save(): open("tmp-probe/probe7.txt","w").write("\n".join(out)[:60000])
def load(pid):
    req = urllib.request.Request("https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/%d/en" % pid, headers={"User-Agent": "Dehesa-Index-data-bot/1.0", "Content-Type": "application/json"})
    info = json.loads(urllib.request.urlopen(req, timeout=60).read())
    raw = urllib.request.urlopen(urllib.request.Request(info["object"], headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=180).read()
    z = zipfile.ZipFile(io.BytesIO(raw)); nm = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
    return list(csv.DictReader(io.TextIOWrapper(z.open(nm), encoding="utf-8-sig")))
for pid, dims in ((32100049, ("Expenses and rebates",)), (32100050, ("Farm items",)), (32100051, ("Type of lender",)), (18100001, ("Type of fuel", "GEO"))):
    try:
        rows = load(pid)
        out.append("== %d rows %d cols %s" % (pid, len(rows), list(rows[0].keys())))
        out.append("UOM %s | SCALAR %s | REF %s..%s | STATUS %s" % (collections.Counter(r["UOM"] for r in rows).most_common(3), collections.Counter(r["SCALAR_FACTOR"] for r in rows).most_common(3), min(r["REF_DATE"] for r in rows), max(r["REF_DATE"] for r in rows), collections.Counter(r.get("STATUS") for r in rows).most_common(5)))
        for d in dims: out.append("%s: %s" % (d, sorted({r[d] for r in rows})))
        last = [r for r in rows if r["GEO"].startswith("Canada") and r["REF_DATE"] == max(x["REF_DATE"] for x in rows)][:6]
        for r in last: out.append("   " + json.dumps({k: r[k] for k in r if k in ("REF_DATE", "GEO", "VALUE", "UOM", "SCALAR_FACTOR", "STATUS") or k in dims}))
    except Exception as e: out.append("ERR %d %r" % (pid, e))
    save()
# CGC: grade structure
try:
    req = urllib.request.Request("https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/2026-27/gsw-shg-en.csv", headers={"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot"})
    rows = list(csv.DictReader(io.StringIO(urllib.request.urlopen(req, timeout=180).read().decode("utf-8", "replace"))))
    sub = [r for r in rows if r["worksheet"] == "Terminal Exports" and r["period"] == "Current Week" and r["Grain Week"] == "8"]
    by = collections.defaultdict(lambda: collections.defaultdict(float))
    for r in sub:
        by[r["grain"]]["ALL" if r["grade"] == "All grades combined" else "grades"] += float(r["Ktonnes"] or 0)
    out.append("== CGC terminal exports wk8 current: all-grades-combined vs sum of grades: " + json.dumps({g: dict(v) for g, v in by.items()}))
    out.append("grades per grain: " + json.dumps({g: sorted({r["grade"] for r in sub if r["grain"] == g}) for g in ("Wheat", "Canola", "Barley")}))
    wk = sorted({(int(r["Grain Week"]), r["Week Ending Date"]) for r in rows})
    out.append("weeks: %s" % wk)
except Exception as e: out.append("CGC ERR %r" % e)
save()

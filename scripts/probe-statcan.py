#!/usr/bin/env python3
"""Sondeo de Statistics Canada WDS: lista cubos de precios agrícolas y resume sus dimensiones. Uso temporal."""
import json, re, io, zipfile, csv, urllib.request, sys
from pathlib import Path
OUT = Path("data/probe-statcan"); OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://www150.statcan.gc.ca/t1/wds/rest/"
def call(path, body=None):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": "Dehesa-Index-data-bot/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())
cubes = call("getAllCubesListLite")
pat = re.compile(r"farm (product )?price|price.*(grain|cattle|hog|milk|crop|livestock|wheat|canola|barley|oat|corn)|(grain|cattle|hog|livestock).*price|stocks of grain|principal field crops", re.I)
cand = []
for c in cubes:
    t = c.get("cubeTitleEn", "")
    if pat.search(t):
        cand.append({"pid": c["productId"], "title": t, "freq": c.get("frequencyCode"), "start": c.get("cubeStartDate"), "end": c.get("cubeEndDate"), "archived": c.get("archived")})
(OUT / "candidates.json").write_text(json.dumps(cand, indent=1, ensure_ascii=False))
print(len(cand), "candidates")
# resumen de tablas clave (las no archivadas de precios)
want = [c for c in cand if str(c["archived"]) in ("2", "0", "None") and re.search(r"price", c["title"], re.I)][:10]
want_pids = list(dict.fromkeys([32100077] + [c["pid"] for c in want]))[:10]
for pid in want_pids:
    try:
        info = call("getFullTableDownloadCSV/%s/en" % pid)
        url = info["object"]
        raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=300).read()
        z = zipfile.ZipFile(io.BytesIO(raw))
        name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
        rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")))
        cols = list(rows[0].keys())
        dims = {}
        for col in cols:
            if col in ("REF_DATE", "VALUE", "VECTOR", "COORDINATE", "DGUID", "SYMBOL", "STATUS", "TERMINATED", "DECIMALS", "SCALAR_ID", "SCALAR_FACTOR", "UOM_ID"):
                continue
            vals = {}
            for r in rows:
                vals[r[col]] = vals.get(r[col], 0) + 1
            dims[col] = dict(list(sorted(vals.items(), key=lambda x: -x[1]))[:80])
        last = max(r["REF_DATE"] for r in rows)
        sample = [r for r in rows if r["REF_DATE"] == last][:40]
        (OUT / ("table-%s-summary.json" % pid)).write_text(json.dumps({"pid": pid, "rows": len(rows), "columns": cols, "first": min(r["REF_DATE"] for r in rows), "last": last, "dims": dims, "sampleLast": sample}, indent=1, ensure_ascii=False))
        print(pid, "ok", len(rows), last)
    except Exception as e:
        (OUT / ("table-%s-error.txt" % pid)).write_text(str(e))
        print(pid, "FAIL", e)

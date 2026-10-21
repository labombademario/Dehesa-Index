import csv, io, json, re, urllib.request
H = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
def out(*a): print(*a, flush=True)
def get(u, acc):
    return urllib.request.urlopen(urllib.request.Request(u, headers=dict(H, Accept=acc)), timeout=180).read().decode("utf-8-sig")
try:
    j = json.loads(get("https://data.api.abs.gov.au/rest/dataflow/ABS?detail=allcompletestubs", "application/vnd.sdmx.structure+json"))
    fl = j["data"]["dataflows"]; out("dataflows", len(fl))
    for f in fl:
        nm = f.get("name") or (f.get("names") or {}).get("en", "")
        if re.search(r"population|state|labour|gross|product|employment|age|regional", nm, re.I): out("FLOW", f["id"], f.get("version"), nm)
except Exception as e: out("FLOWS FALLO", repr(e)[:200])
def peek(path, n=6):
    try:
        rows = list(csv.DictReader(io.StringIO(get("https://data.api.abs.gov.au/rest/data/" + path, "application/vnd.sdmx.data+csv"))))
        out("PEEK", path, len(rows), "cols", list(rows[0].keys()) if rows else None)
        for r in rows[:n]: out("   ", json.dumps(r)[:400])
        return rows
    except Exception as e:
        out("PEEK FALLO", path, repr(e)[:150]); return []
for p in ("ERP_Q/all?lastNObservations=1&format=csvfilewithlabels", "ABS_ANNUAL_ERP_ASGS2021/all?lastNObservations=1&format=csvfilewithlabels", "LF/all?lastNObservations=1&format=csvfilewithlabels", "ANA_AGG/all?lastNObservations=1&format=csvfilewithlabels", "RT/all?lastNObservations=1&format=csvfilewithlabels"):
    rows = peek(p, 4)
    if rows:
        for col in rows[0]:
            if col in ("OBS_VALUE", "TIME_PERIOD", "OBS_STATUS"): continue
            vals = sorted({r[col] for r in rows})
            out("   dim", col, len(vals), vals[:12])

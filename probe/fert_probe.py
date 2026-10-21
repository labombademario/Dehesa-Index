import csv, io, json, re, urllib.request
H = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
def out(*a): print(*a, flush=True)
def get(u, acc):
    return urllib.request.urlopen(urllib.request.Request(u, headers=dict(H, Accept=acc)), timeout=180).read().decode("utf-8-sig")
j = json.loads(get("https://data.api.abs.gov.au/rest/dataflow/ABS?detail=allcompletestubs", "application/vnd.sdmx.structure+json"))
for f in j["data"]["dataflows"]:
    nm = f.get("name") or (f.get("names") or {}).get("en", "")
    if re.search(r"agricult|farm|crop|livestock|water|land |rain|fish|forest|state account|gross state|SFD|wage|price index|building|dwelling|business|trade|export|income|migrat|household|housing|vacp|commodit", nm, re.I) and not re.search(r"^Census|Census 20|C16_|ABS_C16|CENSUS2011|LGA|SA2\+|SAL|POA", nm + f["id"]):
        out("FLOW", f["id"], f.get("version"), nm[:140])
def peek(path, n=3, want=None):
    try:
        rows = list(csv.DictReader(io.StringIO(get("https://data.api.abs.gov.au/rest/data/" + path, "application/vnd.sdmx.data+csv"))))
        out("PEEK", path, len(rows), "cols", [c for c in rows[0].keys() if c[0].islower() or c in ("MEASURE","REGION","ASGS_2021","TSEST","DATA_ITEM")] if rows else None)
        for r in rows[:n]: out("   ", json.dumps({k: v for k, v in r.items() if k[0].islower() or k in ("OBS_VALUE","TIME_PERIOD","REGION")})[:420])
        return rows
    except Exception as e:
        out("PEEK FALLO", path, repr(e)[:150]); return []
rows = peek("LF/all?lastNObservations=1&format=csvfilewithlabels", 0)
seen = {}
for r in rows:
    seen[(r["MEASURE"], r["Measure"])] = 1
out("LF measures", sorted(seen))
rows = peek("ERP_Q/1.3+2.3.TOT.3+1.Q?lastNObservations=2&format=csvfilewithlabels", 3)
rows = peek("ERP_Q/all?startPeriod=2025-Q1&format=csvfilewithlabels", 0); out("ERP ages", sorted({r["AGE"] for r in rows})[:15], len(rows))
rows = peek("C21_G02_RA/all?format=csvfilewithlabels", 3); out("C21_G02 dims", {c: sorted({r[c] for r in rows})[:10] for c in rows[0] if c[0].isupper() and c not in ("OBS_VALUE","TIME_PERIOD","STRUCTURE","STRUCTURE_ID","STRUCTURE_NAME","ACTION")} if rows else None)

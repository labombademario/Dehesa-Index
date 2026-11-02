#!/usr/bin/env python3
"""Sondeo (solo rama research/): estructura de tablas candidatas de la Regionaldatenbank. No imprime credenciales."""
import csv, io, json, os, urllib.parse, urllib.request, zipfile, collections
U, P = os.environ["RDB_USER"], os.environ["RDB_PASSWORD"]
BASE = "https://www.regionalstatistik.de/genesisws/rest/2020"
def post(path, data):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": U, "password": P, "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    with urllib.request.urlopen(urllib.request.Request(BASE + path, data=urllib.parse.urlencode(data).encode(), headers=h, method="POST"), timeout=240) as r: return r.read()
for sel in ("41120*", "41241*", "41312*", "61511*", "13312*"):
    d = json.loads(post("/catalogue/tables", {"selection": sel, "area": "all", "pagelength": "100", "language": "de"}).decode("utf-8", "replace"))
    for t in (d.get("List") or []): print("CAT", t["Code"], (t.get("Content") or "")[:170])
for tab in ("41241-01-03-4", "61511-01-03-4", "41312-01-01-4", "41120-01-02-4", "13312-01-05-4"):
    try: raw = post("/data/tablefile", {"name": tab, "area": "all", "startyear": "1990", "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"})
    except Exception as e: print("==", tab, "ERROR", str(e)[:120]); continue
    if raw[:2] != b"PK": print("==", tab, raw[:200]); continue
    z = zipfile.ZipFile(io.BytesIO(raw)); rows = list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
    yrs = sorted({r["time"] for r in rows}); lv = collections.defaultdict(set); meas = collections.OrderedDict(); cls = collections.defaultdict(set); filled = collections.Counter(); tot = collections.Counter()
    for r in rows:
        lv[r["1_variable_code"]].add(r["1_variable_attribute_code"]); meas[r["value_variable_code"]] = (r["value_variable_label"], r["value_unit"])
        for n in (2, 3):
            if r.get("%d_variable_code" % n): cls["%d:%s" % (n, r["%d_variable_label" % n])].add(r["%d_variable_attribute_label" % n])
        if r["1_variable_code"].startswith("KREIS"):
            tot[r["value_variable_code"]] += 1; filled[r["value_variable_code"]] += r["value"].strip() not in ("", ".", "-", "x", "/", "...")
    print("==", tab, len(rows), "filas | años", yrs[0], "..", yrs[-1], "(", len(yrs), ")")
    print("  niveles", {k: len(v) for k, v in lv.items()})
    print("  medidas", {k: (v[0][:60], v[1], "%d/%d con dato" % (filled[k], tot[k])) for k, v in meas.items()})
    print("  clases", {k: (len(v), sorted(v)[:8]) for k, v in cls.items()})

#!/usr/bin/env python3
"""Sondeo (solo rama research/): acceso a la Regionaldatenbank con RDB_USER/RDB_PASSWORD y tabla 41141-01-01-4 por distrito. No imprime credenciales."""
import csv, io, os, sys, urllib.parse, urllib.request, zipfile
U, P = os.environ.get("RDB_USER", ""), os.environ.get("RDB_PASSWORD", "")
print("secretos presentes:", bool(U), bool(P))
def san(s): return s.replace(U, "<u>").replace(P, "<p>") if U and P else s
def post(url, data, hdr):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": U, "password": P, "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    h.update(hdr)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(), headers=h, method="POST"), timeout=120) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
    except Exception as e: return 0, san(str(e)).encode()
import collections
base = "https://www.regionalstatistik.de/genesisws/rest/2020"
for tab in ("41141-01-01-4", "41141-02-02-4", "41141-03-02-4", "41141-04-02-4", "41141-05-01-4", "41141-06-01-4", "41141-07-01-4", "41141-09-01-4"):
    s2, b2 = post(base + "/data/tablefile", {"name": tab, "area": "all", "startyear": "2010", "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}, {})
    if b2[:2] != b"PK": print(tab, s2, san(b2[:300].decode("utf-8", "replace"))); continue
    z = zipfile.ZipFile(io.BytesIO(b2)); rows = list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
    lv = collections.defaultdict(set); yrs = set(); vv = collections.Counter(); cls = collections.defaultdict(set)
    for r in rows:
        lv[r["1_variable_code"]].add(r["1_variable_attribute_code"]); yrs.add(r["time"]); vv[r["value_variable_label"]] += 1
        cls[r["2_variable_code"] + ":" + r["2_variable_label"]].add(r["2_variable_attribute_label"])
    print("==", tab, len(rows), "filas; anios", sorted(yrs)); print("  niveles", {k: len(v) for k, v in lv.items()}); print("  medidas", dict(vv))
    print("  clases", {k: sorted(v)[:14] for k, v in cls.items()})
    k = [r for r in rows if r["1_variable_code"].startswith("KREIS")][:1]
    print("  ejemplo kreis", {a: k[0][a] for a in ("1_variable_code", "1_variable_attribute_code", "1_variable_attribute_label", "value", "value_unit")} if k else "SIN KREISE")

#!/usr/bin/env python3
"""Sondeo puntual: estructura (variables, etiquetas distintas, periodos) de tablas candidatas de Destatis -> docs/destatis-estructura.txt"""
import csv, io, os, re, sys, zipfile, urllib.parse, urllib.request, time
from pathlib import Path
tok = os.environ.get("GENESIS_TOKEN", "").strip()
if not tok: sys.exit("sin token")
URL = "https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile"
T = [("42321-0003","2018"),("42321-0010","2016"),("61243-0005","2019"),("61243-0014","2019"),("61241-0101","2020"),("41215-0002","2018"),("41215-0001","2010"),("41243-0010","2015"),("41243-0012","2015"),("41232-0001","2015"),("41214-0001","2015"),("41241-0006","2015"),("41252-0002","2015"),("41255-0010","2015"),("41312-0004","2020"),("41313-0004","2020"),("41314-0002","2015"),("41141-0026","2020"),("41141-0009","2010"),("41141-0015","2010"),("41141-0017","2020"),("41141-0016","2020"),("41271-0003","2015"),("41261-0012","2015"),("61521-0020","2021"),("41254-0010","2024"),("41244-0002","2019")]
out = []
for name, sy in T:
    body = urllib.parse.urlencode({"name": name, "area": "all", "startyear": sy, "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    try:
        with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=h, method="POST"), timeout=240) as r: raw = r.read()
        if raw[:2] != b"PK": out.append("== %s sin ZIP: %s" % (name, raw[:200].decode("utf-8","replace").replace(tok,"<t>"))); continue
        rows = list(csv.DictReader(io.StringIO(zipfile.ZipFile(io.BytesIO(raw)).read(zipfile.ZipFile(io.BytesIO(raw)).namelist()[0]).decode("utf-8-sig")), delimiter=";"))
    except Exception as e:
        out.append("== %s ERR %s" % (name, str(e).replace(tok,"<t>")[:150])); continue
    out.append("== %s filas=%d" % (name, len(rows)))
    if not rows: continue
    out.append("cols: " + ",".join(rows[0].keys()))
    vv = sorted(set(r.get("value_variable_label","") for r in rows)); out.append("valores: " + " | ".join(v[:60] for v in vv[:12]))
    out.append("unidades: " + " | ".join(sorted(set(r.get("value_unit","") for r in rows))[:6]))
    ts = sorted(set(r.get("time","") for r in rows)); out.append("tiempo: %s .. %s (%d)" % (ts[0], ts[-1], len(ts)))
    for k in rows[0]:
        if re.match(r"^\d+_variable_attribute_label$", k):
            vals = sorted(set(r[k] for r in rows)); out.append("%s (%d): %s" % (k.split("_")[0] + " " + rows[0].get(k.replace("attribute_label","label"),""), len(vals), " | ".join(v[:40] for v in vals[:14])))
    out.append("ej: " + str({k: v for k, v in rows[-1].items() if k in ("time","value","value_variable_label") or k.endswith("attribute_label")})[:300])
    time.sleep(0.5)
(Path(__file__).resolve().parents[1] / "docs" / "destatis-estructura.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out)[:300])

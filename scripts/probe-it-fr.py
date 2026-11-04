#!/usr/bin/env python3
"""Sonda 11: forma de la tabla de ganado (CATTLE_ALL) de ISTAT."""
import csv, gzip, io, time, urllib.request, collections
from pathlib import Path
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []; D = Path("data/probe-it")
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
B = "https://esploradati.istat.it/SDMXWS/rest/"
for fid, key in (("DF_DCAT_CENSAGRIC2020_CATTLE_ALL", "A.ITC11..."), ("DF_DCAT_CENSAGRIC2020_CATTLE_ALL", "A.IT..."), ("DF_DCAT_CENSAGRIC2020_CATTLE_ALL", "A.ITC11....")):
    u = B + "data/IT1,%s,1.0/%s?startPeriod=2020&endPeriod=2020&detail=dataonly" % (fid, key)
    try:
        time.sleep(13)
        b = urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept="application/vnd.sdmx.data+csv;version=1.0.0")), timeout=290).read()
    except Exception as e: p("fallo", key, str(e)[:80]); continue
    rows = list(csv.DictReader(io.StringIO(b.decode("utf-8", "replace")))); p("clave", key, "filas", len(rows), "bytes", len(b))
    if key == "A.ITC11...": (D / "CATTLE_ITC11.csv.gz").write_bytes(gzip.compress(b))
    for d in ("DATA_TYPE", "TYPE_OF_HERD", "HEADS_NUMBER"):
        c = collections.Counter(r[d] for r in rows); p("  ", d, len(c), list(c.items())[:40])
    break
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

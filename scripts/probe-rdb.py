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
for base in ("https://www.regionalstatistik.de/genesisws/rest/2020", "https://www.regionalstatistik.de/genesisWS/rest/2020"):
    s, b = post(base + "/helloworld/logincheck", {"language": "de"}, {})
    print(base, "logincheck", s, san(b[:300].decode("utf-8", "replace")))
    if s == 200:
        for tab in ("41141-01-01-4", "41141-02-02-4", "41141-03-02-4"):
            s2, b2 = post(base + "/data/tablefile", {"name": tab, "area": "all", "startyear": "2010", "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}, {})
            print(tab, s2, len(b2), b2[:2])
            if b2[:2] == b"PK":
                z = zipfile.ZipFile(io.BytesIO(b2)); t = z.read(z.namelist()[0]).decode("utf-8-sig").splitlines()
                print("filas", len(t)); print("\n".join(t[:4]))
            else: print(san(b2[:400].decode("utf-8", "replace")))
        break

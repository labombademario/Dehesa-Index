#!/usr/bin/env python3
"""Sondeo (solo rama research/): catalogo de tablas de la Regionaldatenbank con nivel Kreise, agrupado por estadistica. No imprime credenciales."""
import json, os, urllib.parse, urllib.request, collections
U, P = os.environ["RDB_USER"], os.environ["RDB_PASSWORD"]
BASE = "https://www.regionalstatistik.de/genesisws/rest/2020"
def post(path, data):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": U, "password": P, "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    with urllib.request.urlopen(urllib.request.Request(BASE + path, data=urllib.parse.urlencode(data).encode(), headers=h, method="POST"), timeout=120) as r: return json.loads(r.read().decode("utf-8", "replace"))
seen = {}
for sel in ["11*", "12*", "13*", "14*", "21*", "22*", "23*", "24*", "25*", "32*", "33*", "41*", "42*", "43*", "44*", "45*", "46*", "51*", "52*", "53*", "61*", "62*", "63*", "71*", "72*", "73*", "81*", "82*", "85*", "86*", "91*"]:
    try: d = post("/catalogue/tables", {"selection": sel, "area": "all", "pagelength": "2500", "language": "de"})
    except Exception as e: print(sel, "ERROR", str(e)[:100]); continue
    for t in (d.get("List") or []): seen[t["Code"]] = t.get("Content") or t.get("Name") or ""
print("tablas totales", len(seen))
g = collections.OrderedDict()
for c, n in sorted(seen.items()):
    if "Kreise" not in n and "regionale Tiefe: K" not in n: continue
    g.setdefault(c[:5], []).append((c, n))
print("estadisticas con nivel Kreise:", len(g))
for st, L in g.items():
    print("##", st, len(L), "|", L[0][0], "|", L[0][1][:140])

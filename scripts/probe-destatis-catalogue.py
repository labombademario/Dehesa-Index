#!/usr/bin/env python3
"""Sondeo puntual: lista las tablas de Destatis (GENESIS) por prefijo para ver cuales faltan. Escribe docs/destatis-catalogo.tsv. GENESIS_TOKEN obligatorio."""
import json, os, sys, time, urllib.parse, urllib.request
from pathlib import Path
tok = os.environ.get("GENESIS_TOKEN", "").strip()
if not tok: sys.exit("sin token")
URL = "https://genesis.destatis.de/genesisWS/rest/2020/catalogue/tables"
PRE = ["411*","412*","413*","414*","415*","416*","417*","418*","421*","422*","423*","424*","431*","432*","433*","434*","441*","451*","452*","453*","454*","455*","511*","512*","513*","521*","522*","531*","532*","611*","612*","613*","614*","615*","616*","617*","618*","619*","621*","622*","631*","632*","641*","642*","651*","713*","811*","812*","813*","821*","822*","851*","851*","421*","434*","435*","436*","437*","438*","439*"]
rows = {}
for p in PRE:
    body = urllib.parse.urlencode({"selection": p, "area": "all", "pagelength": 2500, "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    try:
        with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=h, method="POST"), timeout=120) as r: d = json.load(r)
    except Exception as e:
        print(p, "ERR", str(e).replace(tok, "<t>")[:120]); continue
    for t in d.get("List") or []:
        rows[t["Code"]] = (t.get("Content", ""), t.get("Time", ""), t.get("Information", ""))
    print(p, len(d.get("List") or []), flush=True); time.sleep(0.5)
out = Path(__file__).resolve().parents[1] / "docs" / "destatis-catalogo.tsv"
out.write_text("\n".join("\t".join([c, *map(str, v)]) for c, v in sorted(rows.items())) + "\n", encoding="utf-8")
print(len(rows), "tablas")

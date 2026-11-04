#!/usr/bin/env python3
"""Sonda 12: datos abiertos del censo agrario 2020 de Francia por debajo del departamento."""
import json, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, t=60):
    for k in range(2):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept="application/json")), timeout=t).read()
        except Exception as e: p("  error", u[-90:], str(e)[:90]); time.sleep(5)
    return b""
seen = set()
for slug in ("rga2020-epci", "l-ra2020-commune-s-091", "rga-2020-commune", "684004192f9592aab088e152"):
    b = get("https://www.data.gouv.fr/api/1/datasets/%s/" % slug)
    try:
        d = json.loads(b); p("DATASET", slug, "|", d.get("title"), "|", (d.get("organization") or {}).get("name"), "|", d.get("license"), "|", d.get("last_modified", "")[:10], "|", (d.get("description") or "")[:500].replace("\n", " "))
        for r in d.get("resources", [])[:12]: p("   -", (r.get("title") or "")[:80], "|", r.get("format"), "|", r.get("filesize"), "|", (r.get("url") or "")[:170])
    except Exception as e: p("fallo", slug, e)
for q in ("recensement agricole 2020 epci", "recensement agricole 2020 commune", "RA 2020 petite région agricole", "recensement agricole 2020 canton", "surface agricole utilisée 2020 commune", "orientation technico-économique 2020 commune", "agreste 2020 exploitations commune"):
    b = get("https://www.data.gouv.fr/api/1/datasets/?q=%s&page_size=30" % q.replace(" ", "+"))
    try:
        for d in json.loads(b).get("data", []):
            if d["id"] in seen: continue
            seen.add(d["id"]); p("  ", d["slug"][:90], "|", (d.get("organization") or {}).get("name", "")[:40], "|", d.get("license"), "|", d.get("last_modified", "")[:10], "|", len(d.get("resources", [])))
    except Exception as e: p("fallo", q, e)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

#!/usr/bin/env python3
"""Sonda: que hay de censo agrario por provincia (Italia, ISTAT) y por comuna (Francia, data.gouv)."""
import json, re, sys, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, accept="*/*", t=120, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: return r.read()
        except Exception as e:
            p("  error", k, u[-100:], str(e)[:120]); time.sleep(8 * (k + 1))
    return b""
B = "https://esploradati.istat.it/SDMXWS/rest/"
p("== ISTAT dataflows")
b = get(B + "dataflow/IT1", "application/vnd.sdmx.structure+json;version=1.0.0")
p("bytes", len(b))
try:
    j = json.loads(b); fl = j["data"]["dataflows"]; p("total dataflows", len(fl))
    hit = []
    for f in fl:
        nm = " | ".join(f.get("names", {}).values()) if isinstance(f.get("names"), dict) else str(f.get("name"))
        if re.search(r"agricol|censimento|azienda|aziende|coltiv|alleva|bestiame|SAU", nm, re.I): hit.append((f["id"], nm)); p("  ", f["id"], nm[:150])
    p("hits", len(hit))
except Exception as e: p("fallo al leer dataflows", e, b[:300])
p("== data.gouv RGA 2020 commune")
for slug in ("rga-2020-commune", "5369931da3a729239d2040d8", "53699038a3a729239d20394f"):
    b = get("https://www.data.gouv.fr/api/1/datasets/%s/" % slug, "application/json")
    try:
        d = json.loads(b); p("dataset", slug, d.get("title"), "| licencia:", d.get("license"), "| org:", (d.get("organization") or {}).get("name"), "| modificado:", d.get("last_modified"))
        for r in d.get("resources", [])[:40]: p("   -", r.get("title"), "|", r.get("format"), "|", r.get("filesize"), "|", r.get("url"))
    except Exception as e: p("fallo", slug, e, b[:200])
p("== data.gouv busqueda RA 2020")
b = get("https://www.data.gouv.fr/api/1/datasets/?q=recensement+agricole+2020&page_size=40", "application/json")
try:
    for d in json.loads(b).get("data", []): p("  ", d["id"], "|", d["title"][:90], "|", (d.get("organization") or {}).get("name"), "|", d.get("license"), "|", len(d.get("resources", [])))
except Exception as e: p("fallo busqueda", e)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

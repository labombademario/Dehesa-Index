#!/usr/bin/env python3
"""Sonda 8: descarga en bruto, por provincia, de las tablas del censo agrario 2020 de ISTAT (se guardan en data/probe-it) y busqueda de datos de Francia por comuna."""
import csv, gzip, io, json, re, time, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []; D = Path("data/probe-it"); D.mkdir(parents=True, exist_ok=True)
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, accept="*/*", t=290, tries=3, pause=0):
    for k in range(tries):
        try:
            if pause: time.sleep(pause)
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: return r.read()
        except Exception as e:
            p("  error", k, u[-110:], str(e)[:100]); time.sleep(20)
    return b""
B = "https://esploradati.istat.it/SDMXWS/rest/"
NS = {"s": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure", "c": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common"}
FLOWS = ["SURF_ALL", "CROPS_ALL", "CATTLE_ALL", "LABCAT_ALL", "SAU_AZONE_ALL", "LEGOWN_ALL", "AGE", "SURF_IRR_CONS", "QUAL_ALL"]
prov = list(json.loads(Path("data/probe-it/provincias.json").read_text()))
if not prov:
    raise SystemExit("faltan provincias")
labels = {}
b = get(B + "dataflow/IT1/DF_DCAT_CENSAGRIC2020_CATTLE_ALL/latest?references=all&detail=full", "application/xml", pause=5)
root = ET.fromstring(b)
for c in root.iter("{%s}Codelist" % NS["s"]):
    labels[c.get("id")] = {k.get("id"): (k.find("c:Name", NS).text if k.find("c:Name", NS) is not None else "") for k in c.findall("s:Code", NS)}
for k in ("CL_TIPO_ALLEVAMENTO", "CL_NUMEROSITA", "CL_MANODOPERA"): (D / (k + ".json")).write_text(json.dumps(labels.get(k, {}), ensure_ascii=False))
p("== ISTAT descarga por provincia")
for fl in FLOWS:
    fid = "DF_DCAT_CENSAGRIC2020_" + fl; rows_all = []; ndim = None; t0 = time.time()
    chunks = [prov[i:i + 10] for i in range(0, len(prov) + 1, 10)] + [["IT"]]
    for ch in chunks:
        if not ch: continue
        got = None
        for n in ([ndim] if ndim else [1, 2, 3, 4, 5, 6]):
            u = B + "data/IT1,%s,1.0/A.%s%s?startPeriod=2020&endPeriod=2020&detail=dataonly" % (fid, "%2B".join(ch), "." * n)
            try:
                time.sleep(13)
                with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept="application/vnd.sdmx.data+csv;version=1.0.0")), timeout=290) as r: got = r.read()
                ndim = n; break
            except Exception as e:
                if getattr(e, "code", 0) == 400 and not ndim: continue
                p("  fallo", fid, ch[0], str(e)[:80]); time.sleep(30); break
        if got is None: p("  sin datos", fid, ch[0]); continue
        rows_all.append(got.decode("utf-8", "replace") if not rows_all else got.decode("utf-8", "replace").split("\n", 1)[1])
    txt = "".join(x if x.endswith("\n") else x + "\n" for x in rows_all)
    (D / (fl + ".csv.gz")).write_bytes(gzip.compress(txt.encode()))
    rows = list(csv.DictReader(io.StringIO(txt))); p("-", fl, "puntos", ndim, "filas", len(rows), "territorios", len(set(r["REF_AREA"] for r in rows)), "%d s" % (time.time() - t0))
    if rows:
        dims = [c for c in rows[0] if c not in ("DATAFLOW", "FREQ", "REF_AREA", "TIME_PERIOD", "OBS_VALUE", "OBS_STATUS", "BASE_PER", "UNIT_MEAS", "UNIT_MULT") and not c.startswith("NOTE")]
        for d in dims: vals = sorted(set(r[d] for r in rows)); p("    ", d, len(vals), vals[:25])
    (D / "log-parcial.txt").write_text("\n".join(OUT) + "\n"); 
    open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
p("== data.gouv: observatoire des territoires y RA 2020")
for q in ("observatoire des territoires surface agricole utile 2020", "recensement agricole 2020 epci", "rga2020 epci", "recensement agricole 2020 canton departement"):
    b = get("https://www.data.gouv.fr/api/1/datasets/?q=%s&page_size=20" % q.replace(" ", "+"), "application/json", t=60)
    try:
        for d in json.loads(b).get("data", []):
            p("  ", d["slug"][:75], "|", (d.get("organization") or {}).get("name", "")[:35], "|", d.get("license"), "|", d.get("last_modified", "")[:10], "|", len(d.get("resources", [])))
    except Exception as e: p("fallo", e)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

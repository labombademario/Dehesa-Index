#!/usr/bin/env python3
"""Sonda 5: datos por provincia del censo agrario 2020 de ISTAT (se guardan en bruto) y descubrimiento de la API de GeoClip."""
import csv, gzip, io, json, re, subprocess as sp, time, urllib.request
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
FLOWS = ["DF_DCAT_CENSAGRIC2020_SURF_ALL", "DF_DCAT_CENSAGRIC2020_CROPS_ALL", "DF_DCAT_CENSAGRIC2020_CATTLE_ALL", "DF_DCAT_CENSAGRIC2020_LABCAT_ALL", "DF_DCAT_CENSAGRIC2020_SAU_AZONE_ALL", "DF_DCAT_CENSAGRIC2020_AGE_EDU"]
p("== ISTAT codelists y provincias")
b = get(B + "dataflow/IT1/DF_DCAT_CENSAGRIC2020_CROPS_ALL/latest?references=all&detail=full", "application/xml", pause=5)
root = ET.fromstring(b); labels = {}; terr = {}
for c in root.iter("{%s}Codelist" % NS["s"]):
    cid = c.get("id"); labels[cid] = {k.get("id"): (k.find("c:Name", NS).text if k.find("c:Name", NS) is not None else "") for k in c.findall("s:Code", NS)}
terr = labels["CL_ITTER107"]
prov = sorted(k for k in terr if re.match(r"^IT[CDEFG]\d[0-9A-Z]$", k)); p("provincias:", len(prov), prov[:5], prov[-5:])
for k in ("CL_TIPO_DATO5", "CL_AGRI_MADRE_CENS"): (D / (k + ".json")).write_text(json.dumps(labels[k], ensure_ascii=False))
(D / "provincias.json").write_text(json.dumps({k: terr[k] for k in prov}, ensure_ascii=False))
for fid in FLOWS:
    p("==", fid)
    u = B + "data/IT1,%s,1.0/A.%s?startPeriod=2020&endPeriod=2020&detail=dataonly" % (fid, "+".join(prov + ["IT"]))
    b = get(u, "application/vnd.sdmx.data+csv;version=1.0.0", pause=20)
    p("bytes", len(b))
    if not b: continue
    (D / (fid + ".csv.gz")).write_bytes(gzip.compress(b))
    rows = list(csv.DictReader(io.StringIO(b.decode("utf-8", "replace")))); p("filas", len(rows), "columnas", list(rows[0].keys()) if rows else None)
    dims = [c for c in rows[0] if c not in ("DATAFLOW", "FREQ", "REF_AREA", "TIME_PERIOD", "OBS_VALUE", "OBS_STATUS") and not c.startswith("NOTE") and c not in ("BASE_PER", "UNIT_MEAS", "UNIT_MULT")]
    p("dimensiones:", dims)
    for d in dims: 
        vals = sorted(set(r[d] for r in rows)); p("  ", d, len(vals), vals[:30])
    for r in rows[:8]: p("  ", r["REF_AREA"], [r[d] for d in dims], r["OBS_VALUE"], r["OBS_STATUS"])
    areas = sorted(set(r["REF_AREA"] for r in rows)); p("territorios con dato:", len(areas))
p("== GeoClip")
r = sp.run("echo | openssl s_client -connect stats.agriculture.gouv.fr:443 -servername stats.agriculture.gouv.fr -showcerts 2>/dev/null", shell=True, capture_output=True, text=True)
certs = re.findall(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", r.stdout, re.S); open("/tmp/leaf.pem", "w").write(certs[0])
t = sp.run("openssl x509 -in /tmp/leaf.pem -noout -text | grep -i 'CA Issuers'", shell=True, capture_output=True, text=True).stdout
m = re.search(r"CA Issuers - URI:(\S+)", t); open("/tmp/iss.der", "wb").write(get(m.group(1), t=60))
sp.run("openssl x509 -inform DER -in /tmp/iss.der -out /tmp/iss.pem; cat /etc/ssl/certs/ca-certificates.crt /tmp/iss.pem > /tmp/bundle.pem", shell=True)
def cu(u, n=60): return sp.run(["curl", "-sS", "--compressed", "-m", str(n), "--cacert", "/tmp/bundle.pem", "-A", "Mozilla/5.0", u], capture_output=True, text=True).stdout
h = cu("https://stats.agriculture.gouv.fr/cartostat/"); p("html", len(h)); p(h[:4500])
js = sorted(set(re.findall(r'(?:src|href)=["\']([^"\']+\.(?:js|json)[^"\']*)["\']', h))); p("scripts", js)
for s in js[:10]:
    u = s if s.startswith("http") else "https://stats.agriculture.gouv.fr" + (s if s.startswith("/") else "/cartostat/" + s)
    c = cu(u); p("  js", u, len(c))
    for mm in sorted(set(re.findall(r'["\'`]([^"\'`\s]{0,80}(?:api|\.json|\.csv|data/|geoclip|indicator|download)[^"\'`\s]{0,80})["\'`]', c)))[:50]: p("      url?", mm)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

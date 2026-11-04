#!/usr/bin/env python3
"""Sonda 4: estructura de los dataflows del censo agrario 2020 de ISTAT y acceso a GeoClip (Agreste)."""
import re, subprocess as sp, sys, time, urllib.request, zipfile, io
import xml.etree.ElementTree as ET
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, accept="*/*", t=280, tries=2, pause=0):
    for k in range(tries):
        try:
            if pause: time.sleep(pause)
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: return r.read()
        except Exception as e:
            p("  error", k, u[-100:], str(e)[:100]); time.sleep(15)
    return b""
B = "https://esploradati.istat.it/SDMXWS/rest/"
NS = {"s": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure", "c": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common"}
p("== ISTAT estructuras")
for fid in ("DF_DCAT_CENSAGRIC2020_SURF_ALL", "DF_DCAT_CENSAGRIC2020_CROPS_ALL", "DF_DCAT_CENSAGRIC2020_CATTLE_ALL", "DF_DCAT_CENSAGRIC2020_LABCAT_ALL"):
    b = get(B + "dataflow/IT1/%s/latest?references=all&detail=full" % fid, "application/xml", pause=15)
    p("-", fid, len(b))
    if not b: continue
    try:
        root = ET.fromstring(b)
        dsd = root.find(".//s:DataStructure", NS)
        dims = [(d.get("id"), (d.find(".//s:Enumeration/Ref", NS) is not None and d.find(".//s:Enumeration/Ref", NS).get("id"))) for d in root.iter("{%s}Dimension" % NS["s"])]
        tdim = [x.get("id") for x in root.iter("{%s}TimeDimension" % NS["s"])]
        p("   dimensiones:", dims, "tiempo:", tdim)
        cl = {c.get("id"): c for c in root.iter("{%s}Codelist" % NS["s"])}
        for did, cid in dims:
            if cid and cid in cl:
                codes = [(k.get("id"), (k.find("c:Name", NS).text if k.find("c:Name", NS) is not None else "")) for k in cl[cid].findall("s:Code", NS)]
                p("   ", did, cid, len(codes), codes[:12] if len(codes) > 12 else codes)
        # restricciones de contenido (series disponibles)
        for ck in root.iter("{%s}ContentConstraint" % NS["s"]): p("   constraint", ck.get("id"))
    except Exception as e: p("   fallo", e, b[:200])
p("== ISTAT muestra de datos (SURF_ALL 2020)")
b = get(B + "data/IT1,DF_DCAT_CENSAGRIC2020_SURF_ALL,1.0/?startPeriod=2020&endPeriod=2020&detail=dataonly&firstNObservations=1", "application/vnd.sdmx.data+csv;version=1.0.0", pause=15)
p("bytes", len(b)); p(b[:1500].decode("utf-8", "replace"))
p("== GeoClip")
b = get("https://agreste.agriculture.gouv.fr/agreste-web/download/publication/publie/GeoclipAir2020/Liste-des-indicateurs-cartographiques-du-RA2020.xlsx", t=120)
p("xlsx bytes", len(b))
if b:
    z = zipfile.ZipFile(io.BytesIO(b)); ss = []
    if "xl/sharedStrings.xml" in z.namelist():
        ss = ["".join(t.itertext()) for t in ET.fromstring(z.read("xl/sharedStrings.xml")) ]
    for n in sorted(x for x in z.namelist() if x.startswith("xl/worksheets/sheet")):
        ws = ET.fromstring(z.read(n)); ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        p("hoja", n)
        for k, row in enumerate(ws.iter("{%s}row" % ns["m"])):
            if k > 350: break
            vals = []
            for c in row:
                v = c.find("m:v", ns)
                if v is None: continue
                vals.append((ss[int(v.text)] if c.get("t") == "s" else v.text)[:80])
            if vals: p("  ", " | ".join(vals))
p("== GeoClip TLS")
r = sp.run("echo | openssl s_client -connect stats.agriculture.gouv.fr:443 -servername stats.agriculture.gouv.fr -showcerts 2>/dev/null", shell=True, capture_output=True, text=True)
certs = re.findall(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", r.stdout, re.S); p("certs recibidos", len(certs))
leaf = certs[0] if certs else ""
open("/tmp/leaf.pem", "w").write(leaf)
t = sp.run("openssl x509 -in /tmp/leaf.pem -noout -text | grep -iE 'Issuer:|CA Issuers|Subject:'", shell=True, capture_output=True, text=True).stdout; p(t)
m = re.search(r"CA Issuers - URI:(\S+)", t)
if m:
    der = get(m.group(1), t=60); p("issuer bytes", len(der))
    open("/tmp/iss.der", "wb").write(der)
    sp.run("openssl x509 -inform DER -in /tmp/iss.der -out /tmp/iss.pem 2>/dev/null || cp /tmp/iss.der /tmp/iss.pem; cat /etc/ssl/certs/ca-certificates.crt /tmp/iss.pem > /tmp/bundle.pem", shell=True)
    r = sp.run(["curl", "-sS", "-m", "60", "--cacert", "/tmp/bundle.pem", "-A", "Mozilla/5.0", "-o", "/tmp/carto.html", "-w", "%{http_code}", "https://stats.agriculture.gouv.fr/cartostat/"], capture_output=True, text=True)
    p("curl con cadena completada:", r.stdout, r.stderr[:200])
    try:
        h = open("/tmp/carto.html", "rb").read().decode("utf-8", "replace"); p("html bytes", len(h)); p(h[:1200].replace("\n", " "))
        js = sorted(set(re.findall(r'(?:src|href)="([^"]+\.(?:js|json))"', h))); p("scripts", js[:20])
        for s in js[:8]:
            u = s if s.startswith("http") else "https://stats.agriculture.gouv.fr" + (s if s.startswith("/") else "/cartostat/" + s)
            c = sp.run(["curl", "-sS", "-m", "60", "--cacert", "/tmp/bundle.pem", u], capture_output=True, text=True).stdout; p("  js", u, len(c))
            for mm in sorted(set(re.findall(r'["\'](/?[\w./-]*(?:api|data|indicator|serie|download|csv|geoclip)[\w./?=&{}-]*)["\']', c)))[:40]: p("      url?", mm)
    except Exception as e: p("fallo html", e)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")

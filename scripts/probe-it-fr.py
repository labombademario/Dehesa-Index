#!/usr/bin/env python3
"""Sonda 37: flujos CENSAGRIC2020 de ISTAT (lista y dimensiones)."""
import re, time, urllib.request
import xml.etree.ElementTree as ET
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", "Accept": "application/xml"}
B = "https://esploradati.istat.it/SDMXWS/rest/"
def get(u):
    time.sleep(12)
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=280).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
t = get(B + "dataflow/IT1")
fl = re.findall(r'<structure:Dataflow[^>]*id="([^"]*CENSAGRIC2020[^"]*)"', t)
print("flujos CENSAGRIC2020:", len(fl))
for f in fl: print("  ", f)
NS = {"s": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure", "c": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common"}
want = [f for f in fl if re.search(r"AZONE|AGE|LEGOWN|IRRIG|SIZE|SURF_ALL|UTE|ORGAN|OTE|TECN|ECON", f)][:14]
done = set()
for f in want:
    x = get(B + "dataflow/IT1/%s/latest?references=all&detail=full" % f)
    if x.startswith("ERR"): print("==", f, x[:150]); continue
    root = ET.fromstring(x); print("==", f)
    for dsd in root.iter("{%s}DimensionList" % NS["s"]):
        print("   dims:", [d.get("id") for d in dsd.findall("s:Dimension", NS)])
    for cl in root.iter("{%s}Codelist" % NS["s"]):
        cid = cl.get("id")
        if cid in done or cid in ("CL_ITTER107", "CL_FREQ"): continue
        done.add(cid); codes = [(k.get("id"), (k.find("c:Name", NS).text or "")[:40]) for k in cl.findall("s:Code", NS)]
        print("   ", cid, len(codes), codes[:30])

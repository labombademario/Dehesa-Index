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
want = ["DF_DCAT_CENSAGRIC2020_SAU_AZONE_ALL", "DF_DCAT_CENSAGRIC2020_AGE", "DF_DCAT_CENSAGRIC2020_LEGOWN_ALL", "DF_DCAT_CENSAGRIC2020_IRRSIS", "DF_DCAT_CENSAGRIC2020_SURF_IRR_CONS", "DF_DCAT_CENSAGRIC2020_ECSIZE_ALL"]
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
        codes = [(k.get("id"), (k.find("c:Name", NS).text or "")[:40]) for k in cl.findall("s:Code", NS)]
        if cid in ("CL_BASE_YEAR","CL_CENSAGR_NOTE","CL_DS_NOTE","CL_ETA1","CL_FLAG","CL_ISTATTERR_NOTE","CL_UNIT_MEASURE","CL_UNIT_MULT","CL_ENTERPRISE_FEATURES","CL_ATTCONNESSE"): continue
        print("   ", cid, len(codes), codes[:60] if cid != "CL_TIPO_DATO5" else [c for c in codes if re.search(r"HO$|^HO|SAU|ARU|ART|IRR|AGE|OWN|RENT|AREA", c[0])][:70])

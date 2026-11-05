#!/usr/bin/env python3
"""Sonda 44: ODS del MMO (Section 2 Landings 2024): hojas y primeras filas."""
import io, re, urllib.request, zipfile
import xml.etree.ElementTree as ET
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
NS = {"t": "urn:oasis:names:tc:opendocument:xmlns:table:1.0", "x": "urn:oasis:names:tc:opendocument:xmlns:text:1.0", "o": "urn:oasis:names:tc:opendocument:xmlns:office:1.0"}
T = "{%s}" % NS["t"]
def sheets(b):
    root = ET.fromstring(zipfile.ZipFile(io.BytesIO(b)).read("content.xml")); out = {}
    for tb in root.iter(T + "table"):
        rows = []
        for r in tb.iter(T + "table-row"):
            cells = []
            for c in r:
                if c.tag not in (T + "table-cell", T + "covered-table-cell"): continue
                n = int(c.get(T + "number-columns-repeated", "1")); v = c.get("{%s}value" % NS["o"]) or "".join("".join(p.itertext()) for p in c.findall("x:p", NS))
                cells += [v] * min(n, 30)
            while cells and cells[-1] == "": cells.pop()
            rows.append(cells)
        while rows and not rows[-1]: rows.pop()
        out[tb.get(T + "name")] = rows
    return out
for name, u in [("S2", "https://assets.publishing.service.gov.uk/media/6a0336a94fb0713aa63ea7e8/Section_2_Landings_2024.ods"), ("S1", "https://assets.publishing.service.gov.uk/media/692db433b3b9afff34e96307/Section_1_Fleet_2024.ods")]:
    b = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=200).read(); sh = sheets(b)
    print("==", name, len(b), "hojas", len(sh))
    for k, rows in sh.items():
        print("  HOJA", k, "filas", len(rows))
        for r in rows[:7]: print("     ", [c[:45] for c in r[:9]])

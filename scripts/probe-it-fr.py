#!/usr/bin/env python3
"""Sonda 32: enlaces del Censo Agrario 2020 en INEbase."""
import re, urllib.request
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=120):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
t = get("https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736176851&menu=resultados&idp=1254735727106")
seen = set()
for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', t, re.S):
    h, x = m.group(1), re.sub(r"<[^>]+>", "", m.group(2)).strip()
    if re.search(r"jaxi|path=|px|tpx|Tabla|t01|csv", h) and h not in seen: seen.add(h); print(h[:170], "|", x[:110])
print("total", len(seen))

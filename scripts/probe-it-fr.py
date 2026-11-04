#!/usr/bin/env python3
"""Sonda 31: Censo Agrario 2020 en INEbase (menus PC-Axis)."""
import re, urllib.request
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=120):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
for u in ["https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736176851&menu=resultados&idp=1254735727106",
          "https://www.ine.es/jaxi/menu.do?type=pcaxis&path=%2Ft01%2Fp042&file=inebase",
          "https://www.ine.es/jaxi/menu.do?type=pcaxis&path=%2Ft01%2Fp042%2F2020&file=inebase"]:
    t = get(u); print("URL", u, len(t)); print(t[:200].replace("\n", " "))
    for m in re.findall(r'href="([^"]*(?:menu\.do|Tabla\.htm|tpx)[^"]*)"[^>]*>([^<]{3,120})<', t)[:80]: print("  ", m[0][:150], "|", m[1].strip())

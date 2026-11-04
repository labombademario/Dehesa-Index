#!/usr/bin/env python3
"""Sonda 35: categorias de las tablas 75471-75483 (Censo Agrario 2020 INE)."""
import urllib.request, time
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=180):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf-8-sig", "replace")
    except Exception as e: return "ERR " + str(e)
U = "https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/%d.csv"
for t in range(75471, 75484):
    time.sleep(2); L = get(U % t).split("\n"); h = L[0].split(";"); rows = [l.split(";") for l in L[1:] if l.strip()]
    print("== TAB", t, "filas", len(rows), "cols", h)
    nt = 1 if h[0] == "Ámbito territorial" else 5
    for j in range(nt, len(h) - 1): print("   col", j, h[j], "->", sorted(set(r[j] for r in rows))[:40])
    mun = [r for r in rows if (r[0][:5].isdigit() and len(r[0].split(" ")[0]) == 5) or (nt == 5 and r[4])][:2]; print("   muestra mun", mun)
    print("   mun-total ejemplo", [r for r in rows if r[0].startswith("28079")][:3] if nt == 1 else "")

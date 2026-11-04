#!/usr/bin/env python3
"""Sonda 34: estructura de tabla 75471 y tablas vecinas del Censo Agrario 2020."""
import urllib.request, time
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=180):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf-8-sig", "replace")
    except Exception as e: return "ERR " + str(e)
U = "https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/%d.csv"
c = get(U % 75471).split("\n"); print("filas", len(c))
sc = []; seen = set()
for l in c[1:]:
    a = l.split(";")[0]
    if a not in seen: seen.add(a); sc.append(a)
print("ambitos", len(sc)); print(sc[:12]); print(sc[-6:])
import random; print([s for s in sc if " (" in s or s[:2].isdigit()][:10])
print("cats", sorted(set(l.split(";")[1] for l in c[1:] if l))[:40])
for t in range(75440, 75520):
    if t == 75471: continue
    time.sleep(1.5); x = get(U % t)
    if x.startswith("ERR"): continue
    L = x.split("\n"); print("TAB", t, len(x), "|", L[0][:200], "|", L[1][:120] if len(L) > 1 else "")

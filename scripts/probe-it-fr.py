#!/usr/bin/env python3
"""Sonda 33: Censo Agrario 2020, operacion 90 y tabla 75471."""
import json, urllib.request
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=120):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
B = "https://www.ine.es/wstempus/js/ES/"
t = get(B + "TABLAS_OPERACION/90"); print("TABLAS_OPERACION/90", len(t), t[:80].replace("\n", " "))
try:
    for x in json.loads(t): print(" ", x.get("Id"), "|", x.get("Nombre"), "|", x.get("Anyo_Periodo_ini"))
except Exception as e: print("noJSON", e)
c = get("https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/75471.csv"); print("CSV 75471", len(c)); print(c[:700])

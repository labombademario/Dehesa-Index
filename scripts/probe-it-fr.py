#!/usr/bin/env python3
"""Sonda 30: tablas del Censo Agrario 2020 en la API del INE."""
import json, urllib.request
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def get(u, t=120):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
B = "https://servicio.ine.es/wstempus/js/ES/"
raw = get(B + "OPERACIONES_DISPONIBLES")
print("RAW", raw[:300].replace("\n"," "))
if raw.startswith("ERR") or not raw.lstrip().startswith("["):
    raise SystemExit(0)
ops = json.loads(raw)
for o in ops:
    if "gr" in o.get("Nombre", "").lower() and "censo" in o.get("Nombre", "").lower(): print("OP", o.get("Id"), o.get("Codigo"), o.get("Nombre"))
for o in ops:
    if "censo agrario" in o.get("Nombre", "").lower():
        oid = o["Id"]; print("== operacion", oid, o.get("Codigo"), o["Nombre"])
        t = get(B + "TABLAS_OPERACION/%s" % oid)
        try: tabs = json.loads(t)
        except Exception: print(t[:300]); continue
        print(len(tabs), "tablas")
        for x in tabs: print(" ", x.get("Id"), "|", x.get("Nombre"), "|", x.get("Anyo_Periodo_ini"), x.get("Ultima_Modificacion"))

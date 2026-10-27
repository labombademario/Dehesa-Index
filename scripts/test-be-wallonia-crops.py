#!/usr/bin/env python3
"""Pruebas de scripts/update-be-wallonia-crops.py con datos sinteticos (sin red): lectura de la consulta de estadisticas, descubrimiento de campañas, cultivos y grupos que suman el total,
nombres de la campaña mas reciente, reconstruccion de las campañas cerradas desde el fichero anterior y fallo cerrado ante datos imposibles. Uso: python3 scripts/test-be-wallonia-crops.py"""
import copy, datetime, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("m", ROOT / "scripts" / "update-be-wallonia-crops.py"); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
ok = True
def chk(name, cond):
    global ok
    print(("OK   " if cond else "FALLO ") + name)
    if not cond: ok = False
# lectura de una consulta de estadisticas del servidor
def feat(y, code, nom, grp, ha, n): return {"attributes": {"CAMPAGNE": str(y), "CULT_COD": code, "CULT_NOM": nom, "GROUPE_CULT": grp, "HA": ha, "N": n}}
resp = {"features": [feat(2022, "6", "Prairie  et fourrage ", "Production fourragère", 397011.0, 100), feat(2022, "311", "Froment d’hiver", "Céréales et assimilés", 126129.5, 30)]}
real = m.get; m.get = lambda url, params=None, **k: resp
rows = m.fetch_year(2022, "SIGEC_PARC_AGRI_ANON__2022")
chk("fetch_year: filas, espacios limpios y apostrofo tipografico normalizado", rows[0]["name"] == "Prairie et fourrage" and rows[1]["name"] == "Froment d'hiver" and rows[1]["ha"] == 126129.5 and rows[1]["n"] == 30)
resp = {"features": [feat(2021, "6", "x", "g", 1.0, 1)]}
try: m.fetch_year(2022, "S"); chk("campaña distinta de la pedida: error", False)
except RuntimeError: chk("campaña distinta de la pedida: error", True)
resp = {"features": [], "exceededTransferLimit": True}
try: m.fetch_year(2022, "S"); chk("limite de transferencia superado: error", False)
except RuntimeError: chk("limite de transferencia superado: error", True)
resp = {"services": [{"name": "AGRICULTURE/SIGEC_PARC_AGRI_ANON__2021", "type": "MapServer"}, {"name": "AGRICULTURE/SIGEC_PARC_AGRI_ANON", "type": "MapServer"}, {"name": "AGRICULTURE/SIGEC_PARC_AGRI_2021", "type": "MapServer"}, {"name": "AGRICULTURE/SIGEC_PARC_AGRI_ANON__2023", "type": "MapServer"}]}
chk("discover: solo los servicios con año y anonimos", m.discover() == {2021: "SIGEC_PARC_AGRI_ANON__2021", 2023: "SIGEC_PARC_AGRI_ANON__2023"})
m.get = real
# documento sintetico de 6 campañas
def year_rows(y, k=1.0):
    return [{"code": "6", "name": "Prairie", "group": "Production fourragère", "ha": 400000.0 * k, "n": 200000}, {"code": "311", "name": "Froment d'hiver", "group": "Céréales et assimilés", "ha": 130000.0 * k, "n": 33000},
            {"code": "201", "name": "Maïs ensilage", "group": "Céréales et assimilés", "ha": 56000.0 * k, "n": 22000}, {"code": "99" if y < 2020 else "9990", "name": "Autres" if y < 2020 else "Autres 2", "group": "Autres utilisations", "ha": 215000.0 * k, "n": 80000}]
now = datetime.datetime(2026, 10, 26, tzinfo=datetime.timezone.utc)
raw = {y: year_rows(y, 1 - 0.002 * (y - 2018)) for y in range(2018, 2024)}
doc = m.build(raw, {y: "SIGEC_PARC_AGRI_ANON__%d" % y for y in raw}, now)
chk("build: campañas y ultima", doc["years"] == list(range(2018, 2024)) and doc["latestYear"] == 2023)
chk("build: totales = suma de filas", abs(doc["totals"]["ha"][-1] - sum(r["ha"] for r in raw[2023])) < 0.2 and doc["totals"]["parcels"][0] == 335000)
chk("build: codigo que cambia de nombre/serie queda con huecos (null) donde no existe", next(c for c in doc["crops"] if c["code"] == "99")["ha"][-1] is None and next(c for c in doc["crops"] if c["code"] == "9990")["ha"][0] is None)
chk("build: cultivos ordenados por la ultima campaña", [c["code"] for c in doc["crops"]][0] == "9990" or doc["crops"][0]["ha"][-1] >= doc["crops"][1]["ha"][-1])
chk("build: los grupos suman el total", all(abs(sum(g["ha"][i] for g in doc["groups"]) - doc["totals"]["ha"][i]) < 0.5 for i in range(6)))
chk("check: un documento sano no da errores", m.check(doc) == [])
# reconstruccion de las campañas cerradas desde el fichero anterior: mismas filas
back = {}
for i, y in enumerate(doc["years"]): back[y] = [{"code": c["code"], "name": c["name"], "group": c["group"], "ha": c["ha"][i], "n": c["n"][i]} for c in doc["crops"] if c["ha"][i] is not None]
doc2 = m.build(back, {y: "SIGEC_PARC_AGRI_ANON__%d" % y for y in back}, now)
chk("reutilizar campañas cerradas: reconstruir y volver a construir da lo mismo", doc2["crops"] == doc["crops"] and doc2["totals"] == doc["totals"] and doc2["groups"] == doc["groups"])
# fallo cerrado
bad = copy.deepcopy(raw); bad[2023] = year_rows(2023, 0.7)
e = m.check(m.build(bad, {}, now)); chk("salto del total > 5 %: error", any("salto" in x for x in e))
bad = copy.deepcopy(raw); bad[2021] = [r for r in bad[2021] if r["code"] != "311"]
e = m.check(m.build(bad, {}, now)); chk("sin froment d'hiver en una campaña: error", any("311" in x for x in e))
d3 = copy.deepcopy(doc); d3["years"][-1] += 1; d3["latestYear"] += 1
e = m.check(d3); chk("campañas no consecutivas: error", any("consecutivas" in x for x in e))
d4 = copy.deepcopy(doc); d4["totals"]["parcels"][2] = 10
chk("parcelas imposibles: error", any("parcelas" in x for x in m.check(d4)))
print("Valonia (SIGEC anonimo): %s" % ("0 fallos" if ok else "con fallos")); sys.exit(0 if ok else 1)

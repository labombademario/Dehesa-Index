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
# zonas: consulta por poligono, zonas con varios poligonos, claves y cache de campañas cerradas
real_post = m.post
def fake_post(url, params, **k):
    g = json.loads(params["geometry"])["rings"][0][0][0]
    if g < 0: return {"error": {"code": 400, "message": "Unable to complete operation."}}
    return {"features": [{"attributes": {"CULT_COD": "311", "HA": 100.0 * (g + 1), "N": 10}}, {"attributes": {"CULT_COD": "6", "HA": 200.0, "N": 20}}]}
import json
m.post = fake_post
poly = lambda x: json.dumps({"rings": [[[x, 0], [x, 1], [x + 1, 1]]], "spatialReference": {"wkid": 3812}})
r = m.area_stats("S", poly(1), 3812); chk("area_stats: suma por cultivo y numero de parcelas", r == {"311": (200.0, 10), "6": (200.0, 20)})
chk("area_stats: el servidor rechaza el poligono -> None", m.area_stats("S", poly(-1), 3812) is None)
z = m.zone_stats("S", {"geos": [poly(1), poly(2)], "wkid": 3812}); chk("zone_stats: suma los poligonos de la zona", z == {"311": (500.0, 20), "6": (400.0, 40)})
chk("zone_stats: un poligono rechazado invalida la zona", m.zone_stats("S", {"geos": [poly(1), poly(-1)], "wkid": 3812}) is None)
m.post = real_post
AD = [{"kind": "province", "id": "BE%d" % (31 + i), "name": "P%d" % i} for i in range(5)] + [{"kind": "region", "id": "R%d" % i, "name": "Reg%d" % i} for i in range(9)]
def areas(k):
    out = {}
    for y in range(2018, 2024):
        out[y] = {}
        for grp, n in (("BE", 5), ("R", 9)):
            for i in range(n):
                tot = (doc["totals"]["ha"][y - 2018] / n) * 1.012 * k
                out[y][("BE%d" % (31 + i)) if grp == "BE" else "R%d" % i] = {"ha": tot, "n": 1000 + i, "crops": {"311": tot * 0.15, "6": tot * 0.5}}
    return out
d5 = m.build(raw, {}, now, areas(1.0), AD)
chk("build con zonas: schemaVersion 2 y 14 zonas, provincias primero", d5["schemaVersion"] == 2 and len(d5["areas"]) == 14 and [a["kind"] for a in d5["areas"][:5]] == ["province"] * 5)
chk("build con zonas: series por cultivo con huecos (null) donde la zona no llega a 50 ha", all(len(a["crops"]["311"]) == 6 for a in d5["areas"]))
chk("check con zonas: un documento sano no da errores", m.check(d5) == [], )
e = m.check(m.build(raw, {}, now, areas(1.5), AD)); chk("zonas que suman un 50 % de mas: error", any("no cuadra" in x for x in e))
e = m.check(m.build(raw, {}, now, areas(1.0), AD[3:])); chk("menos de 5 provincias: error", any("zonas province" in x for x in e))
bad = areas(1.0); bad[2020]["BE31"]["crops"]["311"] = 9e9
e = m.check(m.build(raw, {}, now, bad, AD)); chk("cultivos que superan la zona: error", any("suman mas que la zona" in x for x in e))
print("Valonia (SIGEC anonimo): %s" % ("0 fallos" if ok else "con fallos")); sys.exit(0 if ok else 1)

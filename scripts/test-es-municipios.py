#!/usr/bin/env python3
"""Pruebas sin red de data/es-municipios (censo agrario 2020 por municipio, INE): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "es-municipios"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.es_municipios_region(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("17 comunidades publicadas", len(files) == 17)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["municipios"]) for d in docs)
ok("entre 7.500 y 8.300 municipios con explotaciones (%d)" % n, 7500 <= n <= 8300)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json"))
ok("el indice cuenta los mismos municipios", idx["municipios"] == n)
t = idx["totals"]
ok("explotaciones 2020 entre 800.000 y 950.000", 800000 <= t["expl"] <= 950000)
ok("la suma de los municipios no supera el total de España", t["expl"] <= idx["national"]["expl"] * 1.001 and t["sau"] <= idx["national"]["sau"] * 1.001)
d = next(x for x in docs if x["region"] == "EX"); k = next(iter(d["municipios"])); g = {c: i + 1 for i, c in enumerate(d["ind"])}
b = copy.deepcopy(d); b["municipios"][k][g["sau"]] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k][g["expl"]] = 0
ok("municipio sin explotaciones se rechaza", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k][g["expl"]] = 20000
ok("demasiadas explotaciones se rechazan", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["municipios"]["XX999"] = b["municipios"].pop(k)
ok("codigo INE no valido se rechaza", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k][g["arable"]] = 999999; b["municipios"][k][g["sau"]] = 10
ok("usos del suelo mayores que la SAU se rechazan", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k][g["edad"]] = 5
ok("edad media absurda se rechaza", run(b) != [])
b = copy.deepcopy(d); b["municipios"][k][g["jefm"]] = b["municipios"][k][g["jef"]] + 1
ok("mas mujeres que titulares se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

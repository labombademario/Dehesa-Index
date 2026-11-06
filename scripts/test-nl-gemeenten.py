#!/usr/bin/env python3
"""Pruebas sin red de data/nl-gemeenten (Paises Bajos por municipio, CBS): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "nl-gemeenten"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.nl_gemeenten_province(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("12 provincias publicadas", len(files) == 12)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["gemeenten"]) for d in docs)
ok("entre 300 y 360 municipios con explotaciones (%d)" % n, 300 <= n <= 360)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json"))
ok("el indice cuenta los mismos municipios", idx["gemeenten"] == n)
t, nat = idx["totals"], idx["national"]
ok("explotaciones entre 35.000 y 70.000", 35000 <= t["farms"] <= 70000)
ok("la suma de municipios no se aparta de la superficie nacional", abs(t["land"] - nat["land"]) <= nat["land"] * 0.005 and abs(t["grass"] - nat["grass"]) <= nat["grass"] * 0.005)
ok("la suma de municipios no se aparta del ganado nacional", all(abs(t[k] - nat[k]) <= nat[k] * 0.005 for k in ("cattle", "dairy", "pigs", "chickens")))
d = next(x for x in docs if x["region"] == "NB"); k = next(iter(d["gemeenten"])); g = {c: i + 1 for i, c in enumerate(d["ind"])}
b = copy.deepcopy(d); b["gemeenten"][k][g["land"]] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"][k][g["farms"]] = 0
ok("municipio sin explotaciones se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"][k][g["farms"]] = 5000
ok("demasiadas explotaciones se rechazan", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"][k].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"]["XX999"] = b["gemeenten"].pop(k)
ok("codigo no valido se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"][k][g["arable"]] = 99999; b["gemeenten"][k][g["land"]] = 10
ok("usos mayores que la tierra de cultivo se rechazan", run(b) != [])
b = copy.deepcopy(d); b["gemeenten"][k][g["dairy"]] = b["gemeenten"][k][g["cattle"]] + 1
ok("mas vacas lecheras que bovino se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

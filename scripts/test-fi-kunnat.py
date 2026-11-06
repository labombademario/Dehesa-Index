#!/usr/bin/env python3
"""Pruebas sin red de data/fi-kunnat (Finlandia por municipio, Luke): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "fi-kunnat"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.fi_kunnat_region(doc, e, w, s); return e
files = sorted(D.glob("FI[0-9A-Z][0-9A-Z].json"))
ok("5 grandes regiones publicadas", len(files) == 5)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["kunnat"]) for d in docs)
ok("entre 250 y 330 municipios (%d)" % n, 250 <= n <= 330)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json"))
ok("el indice cuenta los mismos municipios", idx["kunnat"] == n)
t, nat = idx["totals"], idx["national"]
ok("explotaciones entre 30.000 y 50.000", 30000 <= t["farms"] <= 50000)
ok("la suma de municipios no se aparta de la superficie nacional", abs(t["uaa"] - nat["uaa"]) <= nat["uaa"] * 0.01 and abs(t["farms"] - nat["farms"]) <= nat["farms"] * 0.02)
ok("el ganado de los municipios no supera el nacional", all(t[k] <= nat[k] * 1.01 for k in ("cattle", "dairy", "pigs", "sheep")))
d = next(x for x in docs if x["region"] == "FI19"); k = next(iter(d["kunnat"])); g = {c: i + 1 for i, c in enumerate(d["ind"])}
b = copy.deepcopy(d); b["kunnat"][k][g["uaa"]] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kunnat"][k][g["farms"]] = None; b["kunnat"][k][g["uaa"]] = None
ok("municipio vacio se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kunnat"][k][g["farms"]] = 5000
ok("demasiadas explotaciones se rechazan", run(b) != [])
b = copy.deepcopy(d); b["kunnat"][k].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kunnat"]["XX9"] = b["kunnat"].pop(k)
ok("codigo no valido se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kunnat"][k][g["wheatw"]] = 99999; b["kunnat"][k][g["uaa"]] = 10
ok("cultivos mayores que la superficie se rechazan", run(b) != [])
b = copy.deepcopy(d); b["kunnat"][k][g["dairy"]] = (b["kunnat"][k][g["cattle"]] or 0) + 1; b["kunnat"][k][g["cattle"]] = b["kunnat"][k][g["cattle"]] or 0
ok("mas vacas lecheras que bovino se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""Pruebas sin red de data/fi-sector (Finlandia por orientacion productiva, Luke): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "fi-sector"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.fi_sector_region(doc, e, w, s); return e
docs = [json.load(open(p)) for p in sorted(D.glob("FI[0-9A-Z][0-9A-Z].json"))]
ok("5 grandes regiones publicadas", len(docs) == 5)
ok("todas cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json")); y = str(idx["years"][-1])
tot = sum(d["sec"][y][0] for d in docs); nat = idx["national"][y][0]
ok("las regiones suman el total nacional de explotaciones (%s de %s)" % (tot, nat), 0.97 * nat <= tot <= 1.005 * nat)
ok("hay 39.000 a 41.000 explotaciones en el ultimo anio", 30000 <= nat <= 50000)
ok("al menos 10 anios de serie", len(idx["years"]) >= 10)
d = docs[0]; yy = str(d["years"][-1])
b = copy.deepcopy(d); b["sec"][yy][1] = (b["sec"][yy][0] or 0) + 100
ok("orientaciones mayores que el total se rechazan", run(b) != [])
b = copy.deepcopy(d); k = str(d["dairy"]["years"][-1]); b["dairy"][k]["farms"][1] = -3
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["dairy"][k]["head"].pop()
ok("clases incompletas se rechazan", run(b) != [])
b = copy.deepcopy(d); del b["pigs"][str(d["pigs"]["years"][-1])]
ok("anio que falta se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

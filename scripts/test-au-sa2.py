#!/usr/bin/env python3
"""Pruebas sin red de data/au-sa2 (cultivos por SA2, ABS): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "au-sa2"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.au_sa2_state(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z]*.json"))
ok("ocho estados publicados", len(files) == 8)
ok("todos cumplen el contrato", all(run(json.load(open(p))) == [] for p in files))
d = json.load(open(D / "NSW.json")); g = next(iter(d["areas"])); i = next(iter(d["areas"][g]["v"]))
b = copy.deepcopy(d); b["areas"][g]["v"][i][0] = -3
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["areas"][g]["v"][i] = b["areas"][g]["v"][i][:-1]
ok("serie corta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["areas"]["599999999"] = b["areas"][g]
ok("SA2 de otro estado se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

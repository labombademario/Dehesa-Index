#!/usr/bin/env python3
"""Pruebas sin red de data/de-lz (censo agrario por Land): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "de-lz"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.de_lz_land(doc, e, w, s); return e
files = sorted(p for p in D.glob("[A-Z][A-Z].json"))
ok("16 Länder publicados", len(files) == 16)
ok("todos cumplen el contrato", all(run(json.load(open(p))) == [] for p in files))
d = json.load(open(D / "BY.json"))
b = copy.deepcopy(d); b["tables"]["landuse"]["Ackerland"]["area"][0] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["tables"]["landuse"]["Ackerland"]["area"] = b["tables"]["landuse"]["Ackerland"]["area"][:-1]
ok("serie corta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["tables"]["landuse"]["Ackerland"]["area"][3] = 1e9
ok("tierra de cultivo mayor que la superficie agraria se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

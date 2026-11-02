#!/usr/bin/env python3
"""Pruebas sin red de data/au-livestock y data/au-regional: los contratos aceptan lo publicado y rechazan datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(fn, doc): e, w, s = [], [], {}; fn(doc, e, w, s); return e
L = sorted((D / "au-livestock").glob("[A-Z][A-Z]*.json")); G = sorted((D / "au-regional").glob("[A-Z][A-Z]*.json"))
ok("nueve ficheros de ganado (8 estados + AU)", len(L) == 9); ok("ocho ficheros regionales", len(G) == 8)
ok("ganado cumple el contrato", all(run(ct.au_livestock_state, json.load(open(p))) == [] for p in L))
ok("regional cumple el contrato", all(run(ct.au_regional_state, json.load(open(p))) == [] for p in G))
d = json.load(open(D / "au-livestock" / "NSW.json"))
b = copy.deepcopy(d); b["slaughter"]["cattle"][-1] = -1
ok("sacrificio negativo se rechaza", run(ct.au_livestock_state, b) != [])
b = copy.deepcopy(d); b["meat"]["beef"][-5] = b["meat"]["redmeat"][-5] * 2
ok("vacuno mayor que carne roja se rechaza", run(ct.au_livestock_state, b) != [])
b = copy.deepcopy(d); b["periods"] = b["periods"][:-1]
ok("periodos de distinta longitud se rechazan", run(ct.au_livestock_state, b) != [])
g = json.load(open(D / "au-regional" / "NSW.json")); c = next(iter(g["lga"])); m = next(iter(g["lga"][c]["v"])); y = next(iter(g["lga"][c]["v"][m]))
b = copy.deepcopy(g); b["lga"][c]["v"][m][y] = -4
ok("valor regional negativo se rechaza", run(ct.au_regional_state, b) != [])
b = copy.deepcopy(g); b["lga"]["599999"] = b["lga"][c]
ok("area de otro estado se rechaza", run(ct.au_regional_state, b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

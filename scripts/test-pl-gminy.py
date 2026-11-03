#!/usr/bin/env python3
"""Pruebas sin red de data/pl-gminy (censo agrario 2020 por gmina): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "pl-gminy"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.pl_gminy_voivodeship(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("16 voivodias publicadas", len(files) == 16)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["gminy"]) for d in docs)
ok("entre 2.400 y 2.550 gminas en total (%d)" % n, 2400 <= n <= 2550)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
d = next(x for x in docs if x["voivodeship"] == "MA"); k = next(iter(d["gminy"]))
b = copy.deepcopy(d); b["gminy"][k]["v"]["1633195"] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gminy"][k]["v"]["1633195"] = 0; b["gminy"][k]["v"].update({str(i): 10 for i in range(1633196, 1633201)})
ok("clases de tamaño que suman mas que el total se rechazan", run(b) != [])
b = copy.deepcopy(d); b["gminy"][k]["k"] = "000000000000"
ok("powiat distinto del id se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gminy"]["023000000000"] = b["gminy"].pop(k)
ok("id de tipo no valido se rechaza", run(b) != [])
b = copy.deepcopy(d); b["gminy"][k]["v"]["1645123"] = 10; b["gminy"][k]["v"]["1645124"] = 999
ok("cereales mayores que la superficie sembrada se rechazan", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

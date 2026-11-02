#!/usr/bin/env python3
"""Pruebas sin red de data/pl-powiaty (censo agrario 2020 por powiat): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "pl-powiaty"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.pl_powiaty_voivodeship(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("16 voivodias publicadas", len(files) == 16)
docs = [json.load(open(p)) for p in files]
ok("380 powiaty en total", sum(len(d["powiaty"]) for d in docs) == 380)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
d = next(x for x in docs if x["voivodeship"] == "MA"); k = next(iter(d["powiaty"]))
b = copy.deepcopy(d); b["powiaty"][k]["v"]["1633320"] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["powiaty"][k]["v"]["1633320"] = 1
ok("clases de tamaño que suman mas que el total se rechazan", run(b) != [])
b = copy.deepcopy(d); b["powiaty"][k]["v"] = {}
ok("powiat sin datos se rechaza", run(b) != [])
b = copy.deepcopy(d); b["powiaty"]["023000000000"] = b["powiaty"].pop(k)
ok("powiat de otra voivodia se rechaza", run(b) != [])
b = copy.deepcopy(d); b["powiaty"][k]["v"]["1633270"] = 1; b["powiaty"][k]["v"]["1633271"] = 999
ok("superficie agraria mayor que las tierras totales se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""Pruebas sin red de data/it-province (censo agrario 2020 por provincia): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "it-province"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.it_province_region(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z][A-Z].json"))
ok("20 regiones publicadas", len(files) == 20)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["provinces"]) for d in docs)
ok("entre 100 y 110 provincias en total (%d)" % n, 100 <= n <= 110)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
d = next(x for x in docs if x["region"] == "LOM"); k = next(iter(d["provinces"]))
b = copy.deepcopy(d); b["provinces"][k]["v"]["S.HO"] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["provinces"][k]["v"].update({"S.ART": 100, "S.ARU": 5000})
ok("superficie agraria mayor que la total se rechaza", run(b) != [])
b = copy.deepcopy(d); b["provinces"][k]["v"].update({"S.ARU": 100, "C.ARU.CEREALS": 5000})
ok("cereales mayores que la superficie agraria se rechazan", run(b) != [])
b = copy.deepcopy(d); b["provinces"]["XX999"] = b["provinces"].pop(k)
ok("codigo de provincia no valido se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""Pruebas sin red de data/de-kreise (censo agrario por distrito): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "de-kreise"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.de_kreise_land(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("16 Länder publicados", len(files) == 16)
docs = [json.load(open(p)) for p in files]
ok("490 distritos en total", sum(len(d["kreise"]) for d in docs) == 490)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
d = next(x for x in docs if x["land"] == "BY"); k = next(iter(d["kreise"]))
b = copy.deepcopy(d); b["kreise"][k]["t"]["landuse"]["Ackerland insgesamt"]["FLC004"][0] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"][k]["t"]["landuse"]["Ackerland insgesamt"]["FLC004"] = b["kreise"][k]["t"]["landuse"]["Ackerland insgesamt"]["FLC004"][:-1]
ok("serie corta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"][k]["t"]["landuse"]["Ackerland insgesamt"]["FLC004"][2] = 1e9
ok("tierra de cultivo mayor que la superficie agraria se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"]["01001"] = b["kreise"].pop(k)
ok("codigo de otro Land se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

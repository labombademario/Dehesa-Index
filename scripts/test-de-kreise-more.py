#!/usr/bin/env python3
"""Pruebas sin red de data/de-kreise-more (rendimientos, bovinos, empleo, historico por distrito): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "de-kreise-more"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.de_kreise_more_land(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("16 Länder publicados", len(files) == 16)
docs = [json.load(open(p)) for p in files]
ok("487 distritos en total", sum(len(d["kreise"]) for d in docs) == 487)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
d = next(x for x in docs if x["land"] == "BY"); k = "09279"
b = copy.deepcopy(d); b["kreise"][k]["t"]["cattle"]["Milchkühe"]["TIE003"][0] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"][k]["t"]["cattle"]["Milchkühe"]["TIE003"] = b["kreise"][k]["t"]["cattle"]["Milchkühe"]["TIE003"][:-1]
ok("serie corta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"][k]["t"]["cattle"]["Milchkühe"]["TIE003"][2] = 1e9
ok("vacas de leche mayores que los bovinos se rechazan", run(b) != [])
b = copy.deepcopy(d); b["kreise"][k]["t"]["yields"]["Wintergerste"]["ERT001"][1] = 5000
ok("rendimiento implausible se rechaza", run(b) != [])
b = copy.deepcopy(d); b["kreise"]["01001"] = b["kreise"].pop(k)
ok("codigo de otro Land se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

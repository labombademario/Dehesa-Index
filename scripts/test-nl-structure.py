#!/usr/bin/env python3
"""Pruebas sin red de data/nl-structure (Paises Bajos por provincia: mano de obra, tamano y diversificacion, CBS): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "nl-structure"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.nl_structure_province(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z].json"))
ok("12 provincias publicadas", len(files) == 12)
docs = [json.load(open(p)) for p in files]
ok("todas cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json")); nat = idx["national"]
yl, ys, yd = str(idx["labYears"][-1]), str(idx["sizeYears"][-1]), str(idx["divYears"][-1])
ok("personas: la suma de provincias coincide con el total nacional (1 %)", abs(sum(d["lab"][yl]["t"][0] for d in docs) - nat["lab"][yl]["t"][0]) <= nat["lab"][yl]["t"][0] * 0.01)
ok("hectareas por tamano: la suma de provincias coincide con el total nacional (1 %)", abs(sum(d["size"][ys]["area"][0] for d in docs) - nat["size"][ys]["area"][0]) <= nat["size"][ys]["area"][0] * 0.01)
ok("diversificacion: la suma de provincias coincide con el total nacional (2 %)", abs(sum(d["div"][yd][0] for d in docs) - nat["div"][yd][0]) <= nat["div"][yd][0] * 0.02)
d = next(x for x in docs if x["region"] == "GE")
b = copy.deepcopy(d); b["lab"][yl]["t"][0] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["lab"]["2020"]["m"][0] = (b["lab"]["2020"]["t"][0] or 0) * 3
ok("hombres + mujeres distinto del total se rechaza", run(b) != [])
b = copy.deepcopy(d); b["size"][ys]["area"][2] = (b["size"][ys]["area"][0] or 0) * 2
ok("clases de tamano que no suman se rechazan", run(b) != [])
b = copy.deepcopy(d); b["div"][yd][1] = b["div"][yd][0] + 500
ok("actividad mayor que las explotaciones se rechaza", run(b) != [])
b = copy.deepcopy(d); b["div"][yd].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["labYears"] = b["labYears"][:-1]
ok("anios que no coinciden se rechazan", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

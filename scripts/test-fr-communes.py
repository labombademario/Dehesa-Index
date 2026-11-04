#!/usr/bin/env python3
"""Pruebas sin red de data/fr-communes (censo agrario 2020 por comuna): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "fr-communes"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.fr_communes_region(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z][A-Z].json"))
ok("13 regiones publicadas", len(files) == 13)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["communes"]) for d in docs)
ok("entre 25.000 y 35.000 comunas con explotaciones (%d)" % n, 25000 <= n <= 35000)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json"))
ok("el indice cuenta las mismas comunas", idx["communes"] == n)
t = idx["totals"]
ok("explotaciones 2020 entre 380.000 y 430.000", 380000 <= t["nbexpl20"] <= 430000)
ok("la suma de las regiones no supera el total de Francia", sum(r[1 + r_ind.index("nbexpl20")] for d in docs for r_ind in [d["ind"]] for r in d["communes"].values()) <= t["nbexpl20"] + 1)
d = next(x for x in docs if x["region"] == "OCC"); k = next(iter(d["communes"])); ie = d["ind"].index("nbexpl20") + 1; isau = d["ind"].index("sau20") + 1
b = copy.deepcopy(d); b["communes"][k][isau] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["communes"][k][ie] = 0
ok("comuna sin explotaciones se rechaza", run(b) != [])
b = copy.deepcopy(d); b["communes"][k][ie] = 5000
ok("demasiadas explotaciones se rechazan", run(b) != [])
b = copy.deepcopy(d); b["communes"][k].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["communes"]["XX999"] = b["communes"].pop(k)
ok("codigo INSEE no valido se rechaza", run(b) != [])
ip = next((i for i, c in enumerate(d["ind"]) if c.startswith("part")), None)
if ip is not None:
    b = copy.deepcopy(d); b["communes"][k][ip + 1] = 150
    ok("porcentaje mayor que 100 se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

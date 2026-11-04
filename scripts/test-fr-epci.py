#!/usr/bin/env python3
"""Pruebas sin red de data/fr-epci (censo agrario 2020 de Francia por intercomunalidad): el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "fr-epci"
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def run(doc): e, w, s = [], [], {}; ct.fr_epci_region(doc, e, w, s); return e
files = sorted(D.glob("[A-Z][A-Z][A-Z].json"))
ok("11 a 13 regiones publicadas (%d)" % len(files), 11 <= len(files) <= 13)
docs = [json.load(open(p)) for p in files]
n = sum(len(d["epci"]) for d in docs)
ok("entre 1.100 y 1.350 EPCI con explotaciones (%d)" % n, 1100 <= n <= 1350)
ok("todos cumplen el contrato", all(run(d) == [] for d in docs))
idx = json.load(open(D / "index.json"))
ok("el indice cuenta los mismos EPCI", idx["epci"] == n)
ok("las explotaciones sin EPCI son menos del 1 % del total", idx["unmappedFarms"] < 0.01 * (idx["totalFarms"] + idx["unmappedFarms"]))
d = next(x for x in docs if x["region"] == "OCC"); k = next(iter(d["epci"])); g = {c: i + 1 for i, c in enumerate(d["ind"])}
b = copy.deepcopy(d); b["epci"][k][g["sau20"]] = -1
ok("valor negativo se rechaza", run(b) != [])
b = copy.deepcopy(d); b["epci"][k][g["nbexpl20"]] = 0
ok("EPCI sin explotaciones se rechaza", run(b) != [])
b = copy.deepcopy(d); b["epci"][k][g["nbexpl20"]] = 50000
ok("demasiadas explotaciones se rechazan", run(b) != [])
b = copy.deepcopy(d); b["epci"][k].pop()
ok("fila incompleta se rechaza", run(b) != [])
b = copy.deepcopy(d); b["epci"]["12345"] = b["epci"].pop(k)
ok("codigo de EPCI no valido se rechaza", run(b) != [])
b = copy.deepcopy(d); b["epci"][k][g["partvigne20"]] = 150
ok("porcentaje mayor que 100 se rechaza", run(b) != [])
if "otex" in g:
    b = copy.deepcopy(d); b["epci"][k][g["otex"]] = 1234
    ok("OTEX desconocida se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

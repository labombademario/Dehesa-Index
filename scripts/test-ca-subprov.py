#!/usr/bin/env python3
"""Pruebas sin red de los datos de Canada por debajo de provincia (data/ca-sub): los contratos aceptan lo publicado y rechazan datos corrompidos; los tres scripts importan sin red."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; D = R.parent / "data" / "ca-sub"
def load(n):
    sp = importlib.util.spec_from_file_location(n.replace("-", "_"), R / (n + ".py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
ct = load("contract_tests")
def run(fn, doc):
    e, w, s = [], [], {}; fn(doc, e, w, s); return e
for n in ("update-ca-subprov-census", "update-ca-subprov-yields", "update-ca-subprov-ndvi"): load(n)
ok("los tres scripts se cargan sin red", True)
c = json.load(open(D / "census" / "SK.json"))
ok("censo publicado cumple el contrato", run(ct.ca_sub_census, c) == [])
b = copy.deepcopy(c); k = next(k for k, a in b["areas"].items() if a["l"] == "CD"); b["areas"][k]["v"]["farms"] = -5
ok("censo con valor negativo se rechaza", run(ct.ca_sub_census, b) != [])
b = copy.deepcopy(c); b["areas"]["470000000"]["v"]["farms"] *= 2
ok("censo con provincia que no suma sus divisiones se rechaza", run(ct.ca_sub_census, b) != [])
y = json.load(open(D / "yields" / "wheat-all.json"))
ok("rendimientos publicados cumplen el contrato", run(ct.ca_sub_yields, y) == [])
b = copy.deepcopy(y); r = next(iter(b["regions"].values())); r["v"]["yield"] = r["v"]["yield"][:-1]
ok("rendimientos con serie corta se rechazan", run(ct.ca_sub_yields, b) != [])
b = copy.deepcopy(y); r = next(iter(b["regions"].values())); r["v"]["production"][-1] = -1
ok("rendimientos con produccion negativa se rechazan", run(ct.ca_sub_yields, b) != [])
n = json.load(open(D / "ndvi" / "SK.json"))
ok("NDVI publicado cumple el contrato", run(ct.ca_sub_ndvi, n) == [])
b = copy.deepcopy(n); a = next(iter(b["areas"].values())); a["v"]["crop_mean"][-1] = 2.0
ok("NDVI con media fuera de rango se rechaza", run(ct.ca_sub_ndvi, b) != [])
b = copy.deepcopy(n); a = next(iter(b["areas"].values())); a["v"]["crop_peak"] = a["v"]["crop_peak"][:-1]
ok("NDVI con serie corta se rechaza", run(ct.ca_sub_ndvi, b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

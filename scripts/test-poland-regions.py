#!/usr/bin/env python3
"""Prueba sin red de scripts/update-poland-regions.py con respuestas SINTETICAS (misma estructura que la API de GUS/BDL; el reparto entre voivodias es inventado y solo sirve para probar la logica):
produce el fichero, descarta atributos distintos de 1, rechaza una voivodia que falta, una suma que no cuadra con el total nacional, un valor negativo y un rendimiento nacional fuera de rango."""
import importlib.util, json, shutil, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("upr", str(ROOT / "scripts" / "update-poland-regions.py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
m.log = lambda *a: None
CODES = sorted(m.UNITS)
def make(d, mutate=None):
    for iid, var, grp, label, unit, mult, additive in m.INDICATORS:
        base = 1000.0 if additive else 5.0
        l2 = {"totalRecords": 16, "variableId": var, "results": []}
        for k, c in enumerate(CODES):
            w = 1 + k / 16.0
            l2["results"].append({"id": c, "name": "V%d" % k, "values": [{"year": str(y), "val": round(base * w * (1 + (y - 2020) / 50.0) / mult, 3), "attrId": 1} for y in range(2018, 2026)]})
        tot = [sum(u["values"][i]["val"] for u in l2["results"]) if additive else base * 1.5 * (1 + (2018 + i - 2020) / 50.0) / mult for i in range(8)]
        l0 = {"totalRecords": 1, "variableId": var, "results": [{"id": "000000000000", "name": "POLAND", "values": [{"year": str(2018 + i), "val": round(t, 3), "attrId": 1} for i, t in enumerate(tot)]}]}
        if mutate: mutate(var, l2, l0)
        (d / ("data%d_l2.json" % var)).write_text(json.dumps(l2)); (d / ("data%d_l0.json" % var)).write_text(json.dumps(l0))
def run(mutate=None):
    d = Path(tempfile.mkdtemp()); make(d, mutate)
    try: i = m.build(str(d)); m.validate(i); return i, None
    except Exception as e: return None, str(e)
ind, err = run(); assert err is None, err
assert len(ind) == len(m.INDICATORS) and all(len(x["regions"]) == 16 for x in ind)
w = [x for x in ind if x["id"] == "crop-harvest-wheat"][0]; assert w["unit"] == "t" and w["years"][-1] == 2025
v = 4333
def drop_unit(var, l2, l0):
    if var == v: l2["results"].pop()
assert run(drop_unit)[1], "faltaba una voivodia y se acepto"
def bad_sum(var, l2, l0):
    if var == v: l0["results"][0]["values"][-1]["val"] *= 1.2
assert run(bad_sum)[1], "una suma que no cuadra se acepto"
def neg(var, l2, l0):
    if var == v: l2["results"][0]["values"][-1]["val"] = -3
assert run(neg)[1], "un valor negativo se acepto"
def bad_yield(var, l2, l0):
    if var == 4332: l0["results"][0]["values"][-1]["val"] = 900
assert run(bad_yield)[1], "un rendimiento nacional absurdo se acepto"
def attr(var, l2, l0):
    if var == v:
        for u in l2["results"]: u["values"][-1]["attrId"] = 91
i2, e2 = run(attr); assert e2 is None and [x for x in i2 if x["id"] == "crop-harvest-wheat"][0]["years"][-1] == 2024, "con el atributo 91 en el ultimo ano de todas las voivodias, la serie debe terminar un ano antes"
out = Path(tempfile.mkdtemp()); d = Path(tempfile.mkdtemp()); make(d)
sys.argv = ["x", "--out", str(out), "--fixtures", str(d)]
assert m.main() == 0 and (out / "poland-regions" / "regions.json").exists()
print("test-poland-regions OK: %d indicadores" % len(ind))

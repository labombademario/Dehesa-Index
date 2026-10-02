#!/usr/bin/env python3
"""Tests del lector de las cuentas economicas de la agricultura (Eurostat) con respuestas reales de la API (scripts/fixtures/eurostat/eaa-2022-2024.json, 2026-10-01). Sin red."""
import importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fe", ROOT / "scripts" / "update-eu-farm-economics.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
raw = json.loads((ROOT / "scripts" / "fixtures" / "eurostat" / "eaa-2022-2024.json").read_text())
b = C.build(raw)
eq(b["years"], [2022, 2023, 2024], "anos"); eq(sorted(b["geos"]), ["DE", "ES", "EU27_2020"], "ambitos")
es = b["geos"]["ES"]
eq(es["output"], [63068.36, 66701.43, 68747.15], "Espana: produccion"); eq(es["feed"][-1], 15945.65, "Espana: piensos 2024"); eq(es["fert"][-1], 2312.74, "Espana: fertilizantes 2024")
eq(es["factor"][-1], 36560.46, "Espana: renta de los factores 2024"); eq(es["awu"][-1], 824.43, "Espana: UTA 2024"); eq(es["indA"][-1], 116.69, "Espana: indicador A 2024")
eq(b["geos"]["EU27_2020"]["output"][-1], 531671.35, "UE-27: produccion 2024"); eq(b["geos"]["DE"]["indA"][0], 144.61, "Alemania: indicador A 2022")
# coherencia contable de los datos reales: produccion - consumos intermedios = valor anadido bruto
for g, d in b["geos"].items():
    for i in range(3):
        if abs(d["output"][i] - d["ic"][i] - d["gva"][i]) > max(2.0, 0.005 * d["output"][i]): bad.append("%s %d: produccion - consumos != VAB" % (g, b["years"][i]))
# el orden de las dimensiones del JSON-stat no se asume: se recorre por 'id' y 'size'
sw = json.loads(json.dumps(raw["eaa01"])); sw["id"] = ["freq", "am_item", "indic_agr", "unit", "time", "geo"]; sw["size"] = [1, 12, 1, 1, 3, 3]
d2 = sw["dimension"]; d2["time"], d2["geo"] = d2["time"], d2["geo"]
v = sw["value"]; new = {}
for pos, x in v.items():  # reordena geo<->time para simular otro orden de dimensiones
    p = int(pos); t = p % 3; g = (p // 3) % 3; rest = p // 9; new[str(rest * 9 + t * 3 + g)] = x
sw["value"] = new
raw2 = dict(raw); raw2["eaa01"] = sw
eq(C.build(raw2)["geos"]["ES"]["output"], es["output"], "otro orden de dimensiones")
# un valor ausente queda en None, no en 0
r3 = json.loads(json.dumps(raw)); del r3["ali01"]["value"]["8"]
eq(C.build(r3)["geos"]["ES"]["awu"], [b["geos"]["ES"]["awu"][0], b["geos"]["ES"]["awu"][1], None], "UTA ausente = None")
# sin UE-27 no se publica
r4 = json.loads(json.dumps(raw))
for k in ("eaa01", "eaa06", "ali01"): r4[k]["dimension"]["geo"]["category"]["index"].pop("EU27_2020", None)
try: C.build(r4); bad.append("debia fallar sin UE-27")
except Exception: pass
print("OK test-eu-farm-economics" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

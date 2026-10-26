#!/usr/bin/env python3
"""Pruebas del lector del DZS (scripts/update-hr-dzs.py) con tablas json-stat2 sinteticas, sin red: etiquetas, valores no numericos = null,
regiones que no suman la Republica, indice base 2020 distinto de 100, series con saltos de un orden de magnitud y tablas vacias o atrasadas."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("hz", ROOT / "scripts" / "update-hr-dzs.py"); H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
fails = []
def ok(c, m):
    print(("OK    " if c else "FALLO ") + m)
    if not c: fails.append(m)
def js(dims, values):
    d = {"version": "2.0", "class": "dataset", "label": "Tabla de prueba", "id": [n for n, _ in dims], "size": [len(l) for _, l in dims], "value": values, "dimension": {}}
    for n, l in dims: d["dimension"][n] = {"label": n, "category": {"index": {str(i): i for i in range(len(l))}, "label": {str(i): x for i, x in enumerate(l)}}}
    return d
REG = ["Republic of Croatia", "Pannonian Croatia", "Adriatic Croatia", "City of Zagreb", "North Croatia"]
VAR = ["Area (ha)", "Production (t)", "Yield (t/ha)"]
def crops(root=100.0, adriatic=20.0):
    v = []
    for y in (2024, 2025):
        for r, a in zip(REG, (root, 40.0, adriatic, 10.0, 30.0)): v += [a, a * 5, 5.0]
    return js([("Category", ["1 Wheat (2 + 3 + 4)"]), ("Year", ["2024", "2025"]), ("Statistical region", REG), ("Variable", VAR)], v)
t = H.parse(crops())
ok(t["dims"][1]["l"] == ["2024", "2025"] and len(t["v"]) == 30 and t["title"] == "Tabla de prueba", "tabla parseada con sus dimensiones")
ok(H.years_of(t) == (1, [2024, 2025]), "eje de años detectado")
ok(H.check_table("bp2", t, 2025) == 2025, "tabla correcta pasa (regiones suman la Republica, en superficie y produccion)")
try: H.check_table("bp2", H.parse(crops(adriatic=45.0)), 2025); ok(False, "regiones que no suman se rechazan")
except RuntimeError as e: ok("no suman" in str(e), "regiones que no suman la Republica se rechazan")
try: H.check_table("bp2", t, 2027); ok(False, "tabla atrasada se rechaza")
except RuntimeError as e: ok("se esperaba" in str(e), "tabla atrasada se rechaza")
x = crops(); x["value"] = [None if i % 10 else v for i, v in enumerate(x["value"])]
try: H.check_table("bp2", H.parse(x), 2025); ok(False, "tabla casi vacia se rechaza")
except RuntimeError as e: ok("con dato" in str(e), "tabla casi vacia se rechaza")
y = crops(); y["value"][4] = "z"; ok(H.parse(y)["v"][4] is None, "estado no numerico = null")
try: H.parse(js([("Year", ["2024", "2025"])], [1, 2, 3])); ok(False, "valores de mas se rechazan")
except RuntimeError: ok(True, "valores de mas se rechazan")
# indices de precios
def idx(base=100.0, last=150.0):
    v = []
    for y in ("2019", "2020", "2021"):
        for p in range(5): v.append(base if (y == "2020" and p == 4) else last if y == "2021" else 100.0)
    return js([("Category", ["TOTAL"]), ("Year", ["2019", "2020", "2021"]), ("Period", ["Q1", "Q2", "Q3", "Q4", "Year"])], v)
H.check_prices("output", H.parse(idx()))
ok(True, "indice con 2020 = 100 pasa")
try: H.check_prices("output", H.parse(idx(base=112.0))); ok(False, "2020 distinto de 100 se rechaza")
except RuntimeError as e: ok("debe ser 100" in str(e), "indice anual 2020 distinto de 100 se rechaza")
try: H.check_prices("output", H.parse(idx(last=900.0))); ok(False, "indice imposible se rechaza")
except RuntimeError as e: ok("imposible" in str(e), "indice total imposible se rechaza")
# series largas
def ser(vals): return js([("Category", ["Cows milk"]), ("Year", [str(2000 + i) for i in range(len(vals))])], vals)
H.check_series("milk", H.parse(ser([500.0, 510.0, 495.0]))); ok(True, "serie estable pasa")
try: H.check_series("milk", H.parse(ser([500.0, 510.0, 5.0]))); ok(False, "salto se rechaza")
except RuntimeError as e: ok("salto" in str(e), "salto de un orden de magnitud se rechaza")
print("\n%d fallos" % len(fails)); sys.exit(1 if fails else 0)

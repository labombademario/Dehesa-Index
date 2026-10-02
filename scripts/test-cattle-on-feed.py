#!/usr/bin/env python3
"""Tests del lector de Cattle on Feed con el informe real de septiembre de 2026 (scripts/fixtures/usda/cofd0926.txt). Sin red."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; F = ROOT / "scripts" / "fixtures" / "usda"
spec = importlib.util.spec_from_file_location("cof", ROOT / "scripts" / "update-cattle-on-feed.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
txt = (F / "cofd0926.txt").read_text()
r = C.parse(txt)
eq(r["release"], "2026-09-18", "publicacion"); eq(r["inventoryDate"], "2026-09-01", "inventario"); eq(r["flowMonth"], "2026-08", "mes de flujos")
n = r["national"]
eq(n["current"], {"onFeedStart": 11117, "placed": 1617, "marketed": 1519, "otherDisappearance": 52, "onFeedEnd": 11163}, "nacional 2026")
eq(n["yearAgo"], {"onFeedStart": 10922, "placed": 1780, "marketed": 1571, "otherDisappearance": 51, "onFeedEnd": 11080}, "nacional 2025")
eq(n["pctYearAgo"]["placed"], 91, "porcentaje publicado")
ks = {s["state"]: s for s in r["states"]}
eq(len(r["states"]), 13, "filas por estado (11 + otros + EE. UU.)"); eq(ks["Kansas"]["current"], 2320, "Kansas"); eq(ks["South Dakota"]["pctYearAgo"], 105, "South Dakota %"); eq(ks["United States"]["current"], 11163, "total")
# informe de febrero (anual): lleva indice de contenidos y tablas del ano anterior que tambien empiezan por "Cattle on Feed Inventory"
rf = C.parse((F / "cofd0226.txt").read_text())
eq(rf["inventoryDate"], "2026-02-01", "febrero: inventario"); eq(rf["national"]["current"]["onFeedEnd"], 11505, "febrero: nacional"); eq({s["state"]: s for s in rf["states"]}["United States"]["current"], 11505, "febrero: total por estado")
# el texto de la nota coincide con la tabla (cifras en millones)
eq(round(n["current"]["placed"] / 1000, 2), 1.62, "entradas = 1,62 millones segun el texto")
def broken(f):
    try: C.parse(f(txt)); bad.append("debia fallar: " + f.__name__)
    except ValueError: pass
def balance(t): return t.replace("1,617 ", "1,700 ", 1)
def total(t): return t.replace("11,163          101            100", "11,500          101            100")
def sinestados(t): return t.split("Cattle on Feed Inventory on 1,000+")[0]
def mes(t): return t.replace("Placed on feed during August", "Placed on feed during July", 1)
for f in (balance, total, sinestados, mes): broken(f)
a = {"inventoryDate": "2026-08-01", "x": 1}; b = {"inventoryDate": "2026-09-01", "x": 2}; b2 = {"inventoryDate": "2026-09-01", "x": 3}
eq(C.merge([a, b], [b2]), [a, b2], "merge por fecha de inventario")
for m in bad: print("FALLA", m)
print("OK test-cattle-on-feed" if not bad else "%d fallos" % len(bad)); sys.exit(1 if bad else 0)

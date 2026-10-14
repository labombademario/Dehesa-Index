#!/usr/bin/env python3
"""Prueba sin red de la parte Eurostat de update-spain-hicp.py (tierra, alquileres, ecologico) con respuestas reales guardadas (scripts/fixtures/spain-eurostat)."""
import importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sh", ROOT / "scripts" / "update-spain-hicp.py"); sh = importlib.util.module_from_spec(spec); spec.loader.exec_module(sh)
FX = ROOT / "scripts" / "fixtures" / "spain-eurostat"
docs = {p.stem: json.loads(p.read_text()) for p in FX.glob("*.json")}
fails = []
def check(c, m):
    if not c: fails.append(m)
land, org = sh.land_series(docs), sh.organic_series(docs)
ids = {s["id"]: s for s in land + org}
check(len(land) == 7 and len(org) == 10, "recuento: %d tierra, %d ecologico" % (len(land), len(org)))
s = ids["es-land-price-ara"]; check(s["latestPeriod"] == "2024" and s["latest"] == 12778 and s["points"][0] == ["2011", 12325] and len(s["points"]) == 14, "precio tierra labor")
check(round(s["changePct"], 2) == round((12778 - 12421) / 12421 * 100, 2), "variacion precio")
s = ids["es-land-rent-ara_j0000"]; check(s["latest"] == 247 and s["points"][-2] == ["2023", 160], "alquiler")
s = ids["es-land-price-j0000"]; check(s["group"] == "inputs" and s["unit"] == "EUR/ha" and s["frequency"] == "annual", "campos de la serie")
s = ids["es-organic-area-uaaxk0000"]; check(s["latest"] == 2944904 and s["group"] == "organic" and s["unit"] == "ha", "superficie ecologica")
check(ids["es-organic-share-uaa"]["latest"] == 11.91, "cuota ecologica")
check(ids["es-organic-op-op"]["latest"] == 62621 and ids["es-organic-op-prd_agri"]["points"][0][0] == "2012", "operadores")
check(ids["es-organic-ls-a2300f"]["latest"] == 10.95 and ids["es-organic-ls-a2300f"]["latestPeriod"] == "2025", "vacas de leche ecologicas")
for x in land + org:
    check(all(isinstance(v, float) for _, v in x["points"]), x["id"] + ": valores no numericos")
    check([p for p, _ in x["points"]] == sorted(p for p, _ in x["points"]), x["id"] + ": periodos sin ordenar")
# rechazos: una celda de otro pais, y pocos puntos
bad = json.loads(json.dumps(docs["apri_lprc"])); bad["dimension"]["geo"]["category"]["index"] = {"FR": 0}
try: sh.parse_any(bad); check(False, "debia rechazar un pais distinto")
except ValueError: pass
thin = json.loads(json.dumps(docs)); 
try: sh.mk("x", "organic", "x", "ha", {"2023": 1.0, "2024": 2.0}, "t", 8); check(False, "debia rechazar pocos puntos")
except ValueError: pass
print("FALLOS:" if fails else "test-spain-eurostat OK", *fails, sep="\n" if fails else " ")
sys.exit(1 if fails else 0)

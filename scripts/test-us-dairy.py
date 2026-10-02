#!/usr/bin/env python3
"""Tests del lector de NDPSR con respuestas reales de la API de AMS (scripts/fixtures/ams/ndpsr-2026-09-30.json, descargadas el 2026-10-01). Sin red."""
import importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("nd", ROOT / "scripts" / "update-us-dairy.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
fx = json.loads((ROOT / "scripts" / "fixtures" / "ams" / "ndpsr-2026-09-30.json").read_text())
P = {p["id"]: p for p in C.build(fx)}
eq(sorted(P), ["cheddar", "leche_polvo", "mantequilla", "suero"], "productos")
b = P["mantequilla"]["series"]
eq(b[-1], ["2026-09-26", 1.3871, 3461338, 1], "mantequilla: ultima semana provisional")
eq(b[0], ["2026-07-11", 1.6625, 3169784, 0], "mantequilla: primera semana final")
eq([r[3] for r in b[-4:]], [1, 1, 1, 1], "mantequilla: las 4 semanas recientes son provisionales"); eq(b[-5][3], 0, "29-08 ya es final")
eq(len(b), 12, "8 finales + 4 provisionales (la del 29-08 ya esta como final)")
eq(P["cheddar"]["series"][-1][1], 1.4958, "cheddar"); eq(P["suero"]["series"][-1][1], 0.6752, "suero"); eq(P["leche_polvo"]["series"][-1][1], 1.8727, "leche en polvo")
# el queso de barril llega con todo a null: no hay precio y no se inventa
eq(C.points(fx["barrel"]["current"], "cheese_500_Price", "cheese_500_Sales"), {}, "barril sin precio")
# formato roto: debe fallar, no publicar
broken = json.loads(json.dumps(fx)); broken["butter"]["final"] = []; broken["butter"]["current"] = []
try: C.build(broken); bad.append("debia fallar sin filas")
except ValueError: pass
# un informe antiguo en 'current' no sobreescribe la semana final
old = json.loads(json.dumps(fx)); old["butter"]["current"].append({"week_ending_date": "08/01/2026", "Week Ending Date": "08/22/2026", "Butter_Price": "9.9999", "Butter_Sales": "1", "published_date": "08/05/2026 12:50:12"})
eq({r[0]: r[1] for r in C.build(old)[0]["series"]}["2026-08-22"], 1.4531, "revision antigua ignorada")
print("OK test-us-dairy" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

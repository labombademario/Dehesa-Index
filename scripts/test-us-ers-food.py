#!/usr/bin/env python3
"""Prueba sin red de los lectores de Food Expenditure Series y Food Dollar Series (ERS) con CSV sinteticos con las cabeceras reales."""
import importlib.util, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fo", ROOT / "scripts" / "update-us-ers-food.py"); F = importlib.util.module_from_spec(spec); spec.loader.exec_module(F)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
tmp = Path(tempfile.mkdtemp()); F.U.LOCAL = tmp
def w(name, txt): (tmp / name).write_text(txt, encoding="utf-8")
U = "https://www.ers.usda.gov/media/1/"
# mensual: meses numericos y con nombre, notas al pie
mo = "Notes: x,,,\nYear,Month,Food-at-home sales (millions of nominal U.S. dollars),Food-away-from-home sales (millions of nominal U.S. dollars),Total\n" + "".join("%d,%d,%d,%d,%d\n" % (y, m, 1000 + m, 900 + m, 1900 + 2 * m) for y in (2024, 2025, 2026) for m in range(1, 13) if not (y == 2026 and m > 8)) + "Source: ERS,,,\n"
w("monthly-sales.csv", mo)
s = {x["id"]: x for x in F.monthly(U + "monthly-sales.csv", "monthly-sales", "Monthly")}
eq(len(s), 3, "3 columnas mensuales"); a = list(s.values())[0]; eq(a["latestPeriod"], "2026-08", "ultimo mes"); eq(a["unit"], "million USD", "unidad"); eq(len(a["points"]), 32, "32 meses")
# anual con unidad en cabecera
an = "Year,Grocery stores (millions of nominal U.S. dollars),Constant (millions of constant 1988 U.S. dollars)\n" + "".join("%d,%d,%d\n" % (y, 1000 * (y - 1996), 500 * (y - 1996)) for y in range(1997, 2026))
w("annual.csv", an); s = {x["id"]: x for x in F.annual_cols(U + "annual.csv", "nom", "Food", F.SGE)}
eq(len(s), 2, "2 columnas anuales"); eq([x["unit"] for x in s.values()], ["million USD", "million USD (1988 dollars)"], "unidades")
# por estado
st = "Year,State,FAH sales million nominal U.S. dollars with taxes and tips,Total sales million constant 1988 U.S. dollars\n" + "".join('%d,%s,"%s",5\n' % (y, e, "1,234.5") for y in range(2002, 2025) for e in ("Alabama", "Wyoming"))
w("st.csv", st); s = F.by_state(U + "st.csv", "st", "State", lambda h: "nominal" in h.lower())
eq(len(s), 2, "2 estados x 1 columna nominal"); eq(s[0]["latest"], 1234.5, "coma de miles"); eq(s[0]["frequency"], "annual", "anual")
# food dollar
fd = "Table_num,Table_name,Category_num,Category_desc,Year,Units,Salary_and_benefits,Property_income,Output_taxes,Imports,Total\n" + "".join("1,Food dollar,2,Farm share,%d,Cents per Domestic Food Dollar,Not available,Not available,Not available,0.4,%s\n" % (y, "Not available" if y == 1995 else "8.5") for y in range(1993, 2024))
fd += "".join("2,Food dollar,1,Total,%d,million dollars,x,x,x,x,\"900,000\"\n" % y for y in range(1993, 2024))
w("food-dollar-nominal-data-2011-model-1993-2023.csv", fd); s = {x["id"]: x for x in F.food_dollar(U + "food-dollar-nominal-data-2011-model-1993-2023.csv", "nom", F.SGD)}
eq(len(s), 2, "2 series del dolar"); k = [x for x in s.values() if x["unit"] == "cents per food dollar"][0]; eq(len(k["points"]), 30, "Not available se salta"); eq(k["latest"], 8.5, "ultimo")
eq([x for x in s.values() if x["unit"] == "million USD"][0]["latest"], 900000.0, "comas")
print("OK test-us-ers-food" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

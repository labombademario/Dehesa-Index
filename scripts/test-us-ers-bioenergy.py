#!/usr/bin/env python3
"""Prueba sin red del lector de U.S. Bioenergy Statistics (ERS) con filas sinteticas con el formato del CSV."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("bio", ROOT / "scripts" / "update-us-ers-bioenergy.py"); B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
def row(**k):
    d = dict(table="1", table_name="Fuel ethanol supply", year="2024", year_cat="Calendar year", year_desc="", period="", period_cat="", period_desc="", geographic_level="National", location="United States",
             commodity="Fuel ethanol", data_item="PROD", data_item_desc="Production", units="Million gallons", value="1")
    d.update(k); return d
rows = []
for y in range(2018, 2026): rows.append(row(year=str(y), value=str(14000 + y)))                                   # anual
for y in (2024, 2025):
    for m in range(1, 13): rows.append(row(table="17", table_name="Monthly average retail diesel prices", commodity="Diesel", data_item_desc="Retail price", units="Dollars per gallon",
                                            year=str(y), period=str(m), period_cat="Month", period_desc=B.MONTHS[m - 1].capitalize(), value="3.%02d" % m))   # mensual
for y in range(2018, 2026):
    for q in range(1, 5): rows.append(row(table="3", table_name="Quarterly", commodity="Biodiesel", data_item_desc="Output", year=str(y), period=str(q), period_cat="Quarter", period_desc="Q%d" % q, value="5"))
rows.append(row(value="(D)")); rows.append(row(year="n/a", value="3"))
s = {x["id"]: x for x in B.build(rows)}
eq(len(s), 3, "3 series (anual, mensual, trimestral)")
a = [x for x in s.values() if x["frequency"] == "annual"][0]; m = [x for x in s.values() if x["unit"] == "USD/gal"][0]
eq(a["points"][-1], ["2025", 16025.0], "anual ultimo"); eq(a["unit"], "million gal", "unidad anual"); eq(a["group"], "production", "grupo")
eq(m["points"][0][0], "2024-01", "mensual primer periodo"); eq(m["latestPeriod"], "2025-12", "mensual ultimo"); eq(m["group"], "prices", "grupo precios")
q = [x for x in s.values() if x.get("periodNote")][0]; eq(q["points"][-1][0], "2025-12", "trimestre fechado en mes final"); eq(len(q["points"]), 32, "32 trimestres")
eq(len({x["id"] for x in s.values()}), 3, "ids unicos")
print("OK test-us-ers-bioenergy" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

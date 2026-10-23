#!/usr/bin/env python3
"""Prueba sin red del lector de Alberta Farm Input Prices con texto con la estructura real de los PDF."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ab", ROOT / "scripts" / "update-ca-alberta-inputs.py"); A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
T = """Alberta Farm Input Prices
August 2026
F arm Input Prices - Dollars ($) Aug 2025 Jul 2026 Aug 2026
Construction Grade Lumber, 2x6, spruce, M 1,026.88 1,017.58 1,018.39
Ready-Mix Concrete, 32 mpa strength, cubic metre * - 347.48 348.52
Double Disc, heavy-duty tandem, 19-21', 22" blades, new, each 111,497.47 110,309,40 105,104.00
Ivermectin, injection for cattle, sheep and swine, 200 ml injectable **** - 148.93 148.93
Feed Barley, good quality, non-board, farm gate, bushel 5.11 5.76 5.31
Fertilizer, 46-0-0, Urea, bulk, tonne 849.58 926.58 876.25
Natural Gas, (excluding service or delivery charge, prov. rebate deducted where applicable), GJ 0.93 2.43 2.36
Electricity, farm use, (excluding service or delivery charge), 100 kwh 12.04 11.56 11.56
Seed, Barley, Canada No. 1, Feed Certified, bulk, per bushel 11.73 11.14 -
Most agricultural inputs were reported to be in good supply for the month of August 2026 with some exceptions.
Source: Alberta Agriculture and Irrigation, Trade, Economics and Data Analytics Branch."""
per, d = A.parse_text(T)
eq(per, "2026-08", "mes de la cabecera"); eq(d["Fertilizer, 46-0-0, Urea, bulk, tonne"], 876.25, "urea"); eq(d["Ready-Mix Concrete, 32 mpa strength, cubic metre"], 348.52, "asterisco antes de las cifras")
eq(d["Double Disc, heavy-duty tandem, 19-21', 22\" blades, new, each"], 105104.0, "miles con coma"); eq(d["Ivermectin, injection for cattle, sheep and swine, 200 ml injectable"], 148.93, "varios asteriscos")
eq("Seed, Barley, Canada No. 1, Feed Certified, bulk, per bushel" in d, False, "mes actual sin dato se salta"); eq(len(d), 8, "no entran el texto ni la fuente")
eq(A.unit_of("Fertilizer, 46-0-0, Urea, bulk, tonne"), "CAD/tonne", "unidad tonelada"); eq(A.unit_of("Electricity, farm use, (excluding service or delivery charge), 100 kwh"), "CAD/100 kWh", "kWh")
eq(A.unit_of("Natural Gas, (excluding service or delivery charge, prov. rebate deducted where applicable), GJ"), "CAD/GJ", "GJ"); eq(A.unit_of("Diesel Fuel, marked farm fuel, (provincial allowance deducted), 100 litres"), "CAD/100 L", "diesel")
eq(A.group_of("Seed, Barley, Canada No. 1, Feed Certified, bulk, per bushel"), "inputs", "semilla no es pienso"); eq(A.unit_of("Roundup WeatherMAX, liquid, 10 litre"), "CAD", "bidon: sin unidad por litro"); eq(A.group_of("Fertilizer, 46-0-0, Urea, bulk, tonne"), "inputs_f", "grupo fertilizante"); eq(A.group_of("Hog Grower Ration, pellets, 15-17% protein, bagged, 25 kg"), "inputs_a", "grupo pienso"); eq(A.group_of("Diesel Fuel, marked farm fuel, 100 litres"), "inputs", "grupo otros")
months = {"%d-%02d" % (2023 + i // 12, i % 12 + 1): {"Fertilizer, 46-0-0, Urea, bulk, tonne": 800.0 + i, "Diesel Fuel, marked farm fuel, 100 litres": 120.0} for i in range(36)}
months["2026-02"] = {"Fertilizer, 46-0-0, Urea, bulk, tonne": 900.0}
for i in range(14): months["%d-%02d" % (2023 + i // 12, i % 12 + 1)]["Old spec product, each"] = 5.0
s = {x["id"]: x for x in A.build(months)}
eq(sorted(s), ["ca-ab-inputs-diesel-fuel-marked-farm-fuel-100-litres-m", "ca-ab-inputs-fertilizer-46-0-0-urea-bulk-tonne-m"], "ids")
try:
    eq(A.parse_text("Farm Input Prices - Dollars ($) July 2025 June 2026 July 2026\nUrea, tonne 1.00 2.00 3.00")[0], "2026-07", "mes con nombre largo")
    A.parse_text("nada"); bad.append("deberia fallar sin cabecera")
except ValueError: pass
print("OK test-ca-alberta-inputs" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

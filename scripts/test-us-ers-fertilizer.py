#!/usr/bin/env python3
"""Prueba sin red del lector del libro de fertilizantes de ERS con hojas sinteticas que copian la disposicion real (cabeceras de varias filas, NA, notas al pie)."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fz", ROOT / "scripts" / "update-us-ers-fertilizer.py"); F = importlib.util.module_from_spec(spec); spec.loader.exec_module(F)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
Y = list(range(1990, 2016))
t1 = [["Table 1. U.S. consumption"], [""] * 9, ["", "Primary nutrient content", "", "", "", "", "Share of total", "", ""], ["Year ending June 30", "Nitrogen (N)", "Phosphate (P2O5)", "Potash (K2O)", "Total", "", "Nitrogen", "Phosphate", "Potash"], [""] * 9]
t1 += [[float(y), 10000.0 + y, 4000.0, 4500.0, 18500.0 + y, "", 50.0, 25.0, 25.0] for y in Y] + [["1/ Includes Puerto Rico"], ["Source: USDA"]]
t4 = [["Table 4"], [""] * 4, ["Year ending June 30", "Ammonia (Anhydrous)", "Ammonia (Aqua)", "", "Urea"], ["", "", "", "", ""], ["", "Material short tons"], [""] * 5] + [[float(y), 4e6, 3e5, "", 6e6] for y in Y] + [["Source: USDA"]]
t5 = [["Table 5"], [""] * 5, ["", "Phosphates", "", "", ""], ["", "Superphosphates", "", "Other", "Potash"], ["Year ending June 30", "Grades 22% and under", "Grades over 22%", "Diammonium phosphate", "Potassium chloride"], [""] * 5] + [["   %d" % y, 5e5, 4e5, 9e5, 1e6] for y in Y]
t7 = [["Table 7"], [""] * 4, [" Year", "Month", "Anhydrous ammonia", "Urea 44-46% nitrogen"], [""] * 4, ["", "", "Dollars per material short ton"], [""] * 4]
for y in range(1990, 2015):
    for mo in ("  Apr.", "  Sept."): t7.append([float(y), mo, 300.0 + (y - 1990), "NA" if y < 1995 else 250.0])
t7 += [["NA = Not available."], ["Source: USDA"]]
t8 = [["Table 8"], ["", "Index of prices"], ["Year", "Paid", "Received", "", "All fertilizers", "Nitrogen", "Phosphate", "Potash"], [""] * 8, ["", "2011=100"]] + [[float(y), "NA" if y < 2000 else 60.0, 80.0, "", 70.0, 71.0, 72.0, "NA"] for y in range(1990, 2019)] + [["NA = Not available."]]
def states(unit):
    t = [["Table"], [""] * 8, ["State"] + [float(y) for y in range(2010, 2018)], [""] * 9, ["", unit], [""] * 9, ["Iowa"] + [150.0 + i for i in range(8)], ["Colorado"] + ["NA"] * 2 + [1.0, 2.0, 3.0, 4.0, 5.0, 6.0], ["", ""], ["U.S. average 1/"] + [1.0] * 8, [""] * 9, ["NA = Not available. Source"]]
    return t
S = {"Table1": t1, "Table4": t4, "Table5": t5, "Table7": t7, "Table8": t8}
for n in range(9, 14): S["Table%d" % n] = states("Percent")
ser = {s["id"]: s for s in F.build(lambda n: S[n])}
eq(ser["us-ersfert-use-nitrogen-n-a"]["latest"], 12015.0, "N 2015"); eq(ser["us-ersfert-use-nitrogen-n-a"]["unit"], "thousand t nutrient", "unidad N")
eq(ser["us-ersfert-use-nitrogen-share-of-to-a"]["latest"], 50.0, "cuota N")
eq("us-ersfert-mat-n-ammonia-anhydrous-a" in ser, True, "material N"); eq("us-ersfert-mat-pk-superphosphates-grades-over-22-a" in ser, True, "cabecera de 2 filas arrastrada a la derecha en T5")
p = ser["us-ersfert-price-anhydrous-ammonia-m"]; eq(p["points"][0][0], "1990-04", "abril"); eq(p["points"][1][0], "1990-09", "sept. -> 09"); eq(p["latestPeriod"], "2014-09", "ultimo")
u = ser["us-ersfert-price-urea-44-46-nitrogen-m"]; eq(u["points"][0][0], "1995-04", "NA saltado en urea")
eq(ser["us-ersfert-index-index-of-prices-paid-by-farmers-for-fert-a"]["points"][0][0], "2000", "indice sin NA")
eq("us-ersfert-index-producer-price-index-potash-a" not in ser, True, "potasa solo NA descartada")
io = ser["us-ersfert-corn-n-pct-iowa-a"]; eq(len(io["points"]), 8, "Iowa 8 anos"); eq(ser["us-ersfert-corn-n-pct-u-s-average-a"]["latest"], 1.0, "media nacional incluida")
eq(ser["us-ersfert-corn-p-pct-colorado-a"]["points"][0][0], "2012", "Colorado empieza donde hay dato")
print("OK test-us-ers-fertilizer" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

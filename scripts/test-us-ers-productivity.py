#!/usr/bin/env python3
"""Prueba sin red de los lectores de productividad agraria de ERS con CSV sinteticos con las cabeceras reales."""
import importlib.util, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("pr", ROOT / "scripts" / "update-us-ers-productivity.py"); P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
tmp = Path(tempfile.mkdtemp()); P.U.LOCAL = tmp
# enlace: gana la edicion con el ultimo ano
(tmp / "agricultural-productivity-in-the-us").write_text('<a href="/media/1/table-1-indices-x-1948-2021.csv?v=1">a</a><a href="/media/2/table-1-indices-x-1948-2023.csv?v=2">b</a><a href="/media/3/table-1-indices-x-1948-2023.xlsx">c</a>')
eq(P.best_link(P.PUS, r"table-1-indices[^\"?]*\.csv"), "https://www.ers.usda.gov/media/2/table-1-indices-x-1948-2023.csv?v=2", "ultima edicion")
t1 = [{"Year": str(y), "Attribute": a, "Value": "%.5f" % (0.3 + 0.01 * (y - 1948))} for y in range(1948, 2024) for a in ("Total agricultural output", "Total factor productivity (TFP)")]
s = {x["id"]: x for x in P.us_t1(t1)}
eq(sorted(s), ["us-ersprod-t1-total-agricultural-output-a", "us-ersprod-t1-total-factor-productivity-tfp-a"], "ids T1"); eq(s["us-ersprod-t1-total-factor-productivity-tfp-a"]["latestPeriod"], "2023", "ultimo ano")
t1a = [{"Year": str(y), "Attribute": a, "Value": "1.5"} for y in range(1948, 2024) for a in ("Total output: Price (index, 2015=1)", "Total output: Quantity (million, $2015)", "Weird attribute")]
s = {x["id"]: x for x in P.us_t1a(t1a)}
eq(sorted(s), ["us-ersprod-t1a-total-output-p-a", "us-ersprod-t1a-total-output-q-a"], "ids T1a (la fila rara se ignora)"); eq(s["us-ersprod-t1a-total-output-q-a"]["unit"], "million USD (2015 dollars)", "unidad cantidad")
rows = []
for iso, nm in (("ESP", "Spain"), ("USA", "United States"), ("BRA", "Brazil"), ("GBR", "United Kingdom")):
    for y in range(1961, 2024):
        for v in ("TFP_Index", "Outall_Index", "Pasture_Q"): rows.append({"Order": "1", "FAO": "1", "ISO3": iso, "Country/territory": nm, "Region": "r", "Sub-Region": "s", "Inc I": "H", "Year": str(y), "Variable": v, "Value": "100"})
per, names = P.intl(rows)
eq(sorted(per), ["ES", "UK"], "solo paises del catalogo, sin USA ni Brasil"); eq(len(per["ES"]), 2, "solo variables *_Index"); eq(names["UK"], "United Kingdom", "nombre")
print("OK test-us-ers-productivity" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

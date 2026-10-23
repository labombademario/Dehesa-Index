#!/usr/bin/env python3
"""Prueba sin red de los lectores de StatCan (aserraderos, IPPI, materias primas, IPC, acuicultura) con filas con las cabeceras reales."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sc", ROOT / "scripts" / "update-ca-statcan-more.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
NAP = "North American Product Classification System (NAPCS)"
def months(a, n):
    return ["%d-%02d" % (a + i // 12, i % 12 + 1) for i in range(n)]
rows = []
for geo in ("Canada", "Quebec", "Yukon"):
    for prod in ("Total softwood and hardwood, production", "Spruce, pine and fir, production [2411211]", "Total softwood, stocks [24112]"):
        for m in months(2022, 50): rows.append({"REF_DATE": m, "GEO": geo, NAP: prod, "VALUE": "100.5"})
[r.update(VALUE="") for r in rows if r["GEO"] == "Canada" and r["REF_DATE"] == "2026-02" and "stocks" in r[NAP]]
s = {x["id"]: x for x in S.lumber(rows)}
eq(sorted(s), ["ca-sc-lumber-canada-spruce-pine-and-fir-production-m", "ca-sc-lumber-canada-total-softwood-and-hardwood-production-m", "ca-sc-lumber-canada-total-softwood-stocks-m",
               "ca-sc-lumber-quebec-spruce-pine-and-fir-production-m", "ca-sc-lumber-quebec-total-softwood-and-hardwood-production-m", "ca-sc-lumber-quebec-total-softwood-stocks-m"], "lumber: sin Yukon")
eq(s["ca-sc-lumber-canada-total-softwood-stocks-m"]["group"], "stocks", "grupo stocks"); eq(len(s["ca-sc-lumber-canada-total-softwood-stocks-m"]["points"]), 49, "valor vacio omitido")
rows = [{"REF_DATE": m, "GEO": "Canada", NAP: p, "VALUE": "120.1"} for m in months(2023, 40) for p in ("Total, Industrial product price index (IPPI)", "Lumber and other wood products [P41]", "Cannabis products (except seeds) [P15]")]
s = {x["id"]: x for x in S.ippi(rows, "18-10-0265", "ippi", "Industrial product price index, Canada")}
eq(sorted(s), ["ca-sc-ippi-lumber-and-other-wood-products-m", "ca-sc-ippi-total-industrial-product-price-index-ippi-m"], "ippi sin cannabis")
rows = []
for geo in ("Canada", "Toronto, Ontario"):
    for prod in ("Food [A.2]", "Gasoline [A.5]", "Tobacco"):
        for uom in ("2002=100", "2025=100"):
            for m in months(2022, 50): rows.append({"REF_DATE": m, "GEO": geo, "Products and product groups": prod, "UOM": uom, "VALUE": "150.0"})
s = {x["id"]: x for x in S.cpi(rows)}
eq(sorted(s), ["ca-sc-cpi-food-m", "ca-sc-cpi-gasoline-m"], "IPC solo Canada, base 2002, productos elegidos")
rows = []
for geo in ("Canada", "Nova Scotia"):
    for sp in ("Total aquaculture", "Salmon", "Total aquaculture (including re-stocking)"):
        for kind in ("Tonnes", "Dollars"):
            for y in range(2000, 2025): rows.append({"REF_DATE": str(y), "GEO": geo, "Finfish and shellfish": sp, "Production": kind, "VALUE": "5"})
s = {x["id"]: x for x in S.aqua(rows)}
eq(sorted(s), ["ca-sc-aqua-canada-salmon-cad-a", "ca-sc-aqua-canada-salmon-t-a", "ca-sc-aqua-canada-total-aquaculture-cad-a", "ca-sc-aqua-canada-total-aquaculture-t-a",
               "ca-sc-aqua-nova-scotia-total-aquaculture-cad-a", "ca-sc-aqua-nova-scotia-total-aquaculture-t-a"], "acuicultura: provincias solo total")
print("OK test-ca-statcan-more" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

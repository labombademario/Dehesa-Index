#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-fr-bulconj.py: lectura de una tabla año x meses, titulos, periodos, union con ediciones previas y seleccion de series del catalogo."""
import importlib.util, sys
from pathlib import Path
sp = importlib.util.spec_from_file_location("fb", str(Path(__file__).resolve().parent / "update-fr-bulconj.py")); fb = importlib.util.module_from_spec(sp); sp.loader.exec_module(fb)
MES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
HDR = ["Rubriques", "N°", "Unité", "Année"] + MES + ["Moyenne annuelle"]


def row(label, no, unit, year, vals, agg):
    return [label, no, unit, year] + vals + [""] * (12 - len(vals)) + [agg]


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


rows = [["Haut de la feuille"], ["COTATIONS DES CEREALES"] + [""] * 16, HDR,
        row("Blé tendre rendu Rouen", "1", "Euro / tonne", 2025, [200 + i for i in range(12)], 205.5),
        row("", "", "", 2026, [300 + i for i in range(9)], ""),
        row("Maïs", "2", "Euro / tonne", 2026, [150, 151, ""], "")]
ser = fb.parse_sheet(rows)
check(len(ser) == 2, "dos series, hay %d" % len(ser))
s = ser[0]
check(s["unit"] == "Euro / tonne" and s["sec"].startswith("COTATIONS"), "unidad y titulo: %r %r" % (s["unit"], s["sec"]))
check(s["pts"]["2025-01"] == 200 and s["pts"]["2025-12"] == 211 and s["pts"]["2025"] == 205.5 and s["pts"]["2026-09"] == 308, "periodos")
check("2026-10" not in s["pts"], "sin celdas vacias inventadas")
check(ser[1]["pts"] == {"2026-01": 150, "2026-02": 151}, "celdas vacias no existen: %r" % ser[1]["pts"])
# union: un punto que la edicion nueva ya no trae se conserva y uno que trae se reemplaza
old = [{"id": s["id"], "pts": {"2020-01": 1, "2025-01": 999}}, {"id": "otra", "pts": {"2020": 5}}]
m = fb.merge(old, [dict(s, pts=dict(s["pts"]))])
byid = {x["id"]: x for x in m}
check(byid[s["id"]]["pts"]["2020-01"] == 1 and byid[s["id"]]["pts"]["2025-01"] == 200 and "otra" in byid, "merge")
# unidades y seleccion
check(fb.unit_short("Euro / tonne") == "€/t" and fb.unit_short("Euro / kg carcasse - Entrée abattoir") == "€/kg carcass" and fb.unit_short("Euro") is None, "unit_short")
sheets = {"Céréales": {"file": "cereales.json", "title": "t", "series": [dict(s, pts={"2025-%02d" % i: 100 + i for i in range(1, 13)}, id="cotations-x|1|euro-tonne", sec="COTATIONS DES CEREALES > Marché", detail="")]}}
st = fb.stats(sheets, "2026-10-22T00:00:00Z")["countries"]["FR"]["series"]
check(len(st) == 1 and st[0]["group"] == "prices" and st[0]["unit"] == "€/t" and st[0]["latestPeriod"] == "2025-12" and st[0]["points"][0][0] == "2025-01", "stats")
print("ok: test-fr-bulconj")

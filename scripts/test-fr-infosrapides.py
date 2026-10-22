#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-fr-infosrapides.py: periodos, tablas de leche (historico y de un solo mes), estimaciones por edicion, union con ediciones previas y catalogo."""
import importlib.util, sys
from pathlib import Path
sp = importlib.util.spec_from_file_location("fi", str(Path(__file__).resolve().parent / "update-fr-infosrapides.py")); fi = importlib.util.module_from_spec(sp); sp.loader.exec_module(fi)


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


check(fi.fr_period("Août 2026") == "2026-08" and fi.fr_period("2017-01") == "2017-01" and fi.fr_period("43831") == "2020-01" and fi.fr_period("août-26") == "2026-08" and fi.fr_period("Quantité") is None and fi.fr_period("2041080") is None, "fr_period")
check(fi.pid("Lai", 26, 133) == "IraLai26133" and fi.pid("Gcu", 25, 7) == "IraGcu25007", "pid")
check(fi.gcu_edition("Situation mensuelle grandes cultures au 1er octobre 2026") == "2026-10" and fi.gcu_edition("sin fecha") is None, "gcu_edition")
# Tableau 2 (precios): historico mensual; una celda «**» o vacia no existe; una cabecera inesperada se omite
T2 = [["", "Tableau 2"], [], ["", "", "Teneurs", "", "Prix à teneurs réelles", "", "", "", "Bio"],
      ["", "", "Taux de matière grasse", "Taux de matière protéique", "Tous laits confondus", "Evolution", "Conventionnel", "Evolution", "Bio"], ["", "", "g/l", "g/l", "€/1000 l", "%", "€/1000 l", "%", "€/1000 l"],
      ["", "Janvier 2021", "43.4", "34.2", "380.3", "-0.5", "358.3", "-1.7", "501.5"], ["", "Février 2021", "42.7", "33.7", "376", "-0.7", "354.3", "-1.9", "**"], ["", "Source : Agreste"]]
h = fi.lait_hist({"Tableau 2": T2})
check(h["lait-prix-reel-conv"]["pts"] == {"2021-01": 358.3, "2021-02": 354.3} and h["lait-prix-reel-bio"]["pts"] == {"2021-01": 501.5}, "tabla 2: %r" % h.get("lait-prix-reel-bio"))
check(h["lait-teneur-mg"]["unit"] == "g/l" and h["lait-prix-reel-tous"]["unit"] == "€/1000 l", "unidades")
T2bad = [r[:] for r in T2]
T2bad[3][6] = "Otra cosa"
check("lait-prix-reel-conv" not in fi.lait_hist({"Tableau 2": T2bad}), "cabecera inesperada se omite")
# Tableau 5 (un solo mes): un punto por fila en el mes de la cabecera
T5 = [["", "Tableau 5"], ["", "", "", "", "", "(1) Tonne (sauf lait conditionné : millier de litres)"], ["", "Août 2026", "", "Évolution sur un an", "Cumul 2026"], ["", "", "Quantité (1)", " %", "Quantité (1)"],
      ["", "Lait conditionné", "199171", "-1.4", "1721603"], ["", "Beurre", "26652", "1.6", "257497"], ["", "Comté (3)", "s.", "s.", "5"], ["", "(2) Matières grasses"], ["", "Source : Agreste"]]
sn = fi.lait_snap({"Tableau 5": T5})
check(sn["lait-fab-vache-lait-conditionne"]["pts"] == {"2026-08": 199171} and sn["lait-fab-vache-lait-conditionne"]["unit"] == "1000 l" and sn["lait-fab-vache-beurre"]["unit"] == "t" and "lait-fab-vache-comte" not in sn, "tabla 5: %r" % list(sn))
# union: lo nuevo reemplaza, lo viejo que ya no viene se conserva
old = {"a": {"label": "A", "unit": "t", "pts": {"2020-01": 1, "2021-01": 2}}}
m = fi.merge_series(old, {"a": {"label": "A", "unit": "t", "pts": {"2021-01": 9, "2021-02": 3}}, "b": {"label": "B", "unit": "t", "pts": {"2021-01": 1}}})
check(m["a"]["pts"] == {"2020-01": 1, "2021-01": 9, "2021-02": 3} and "b" in m, "merge_series")
e = fi.merge_est({}, "2026-09", {"2026": {"FR": {"Orge": [1, 2, 3]}}})
e = fi.merge_est(e, "2026-10", {"2026": {"FR": {"Orge": [1, 2, 4]}}})
check(e["2026"]["FR"]["Orge"] == {"2026-09": [1, 2, 3], "2026-10": [1, 2, 4]}, "merge_est")
# catalogo: la estimacion necesita dos ediciones; la serie de leche necesita 24 meses
est = {"2026": {"FR": {"Orge": {"2026-09": [1771.0, 60.1, 10600.0], "2026-10": [1771.18, 60.088, 10642.75]}, "Colza": {"2026-10": [1, 2, 3]}}}}
lait = {"lait-prix-reel-conv": {"label": "L", "unit": "€/1000 l", "pts": {"%d-%02d" % (2024 + (i // 12), i % 12 + 1): 400 + i for i in range(26)}}, "lait-corto": {"label": "C", "unit": "t", "pts": {"2026-08": 1}}}
st = fi.stats(lait, {}, est, {"FR": "France"}, "2026-10-22T00:00:00Z")["countries"]["FR"]["series"]
ids = {s["id"] for s in st}
check("fr-ira-lait-prix-reel-conv" in ids and "fr-ira-lait-corto" not in ids and "fr-ira-gcu-barley-production-2026" in ids and not any("rapeseed" in i for i in ids), "stats: %r" % sorted(ids))
check(next(s for s in st if s["id"] == "fr-ira-lait-prix-reel-conv")["changePct"] is not None, "variacion interanual")
fruw = {"fru-poire-prod-france-metropolitaine": {"label": "Pear production, France", "unit": "1000 t", "pts": {"2025": 157.1, "2026": 144.1}}}
sf = fi.stats({}, {}, {}, {}, "2026-10-22T00:00:00Z", fruw)["countries"]["FR"]["series"]
check(len(sf) == 1 and sf[0]["frequency"] == "annual" and sf[0]["changePct"] == -8.27, "fruta: %r" % sf)
print("ok: test-fr-infosrapides")

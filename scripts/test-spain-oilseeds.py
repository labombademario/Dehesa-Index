#!/usr/bin/env python3
"""Balances de oleaginosas de España (MAPA): lector y validacion con extractos reales de `pdftotext -layout` (scripts/fixtures/spain-oilseeds, sin red).
Comprueba cifras concretas de los PDF de 2025/26, 2023/24, 2020/21, 2019/20 y 2016/17 (formatos con y sin «A./B./C.», decimales con coma, orden distinto de las filas de la tabla de tortas),
que se rechaza una tabla que no cuadra, una campaña que no es la pedida, una fila que falta y un negativo, y que las series salen en miles de toneladas, anuales y sin duplicar la produccion de semillas.
Uso: python3 scripts/test-spain-oilseeds.py"""
import copy, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("uso", ROOT / "scripts" / "update-spain-oilseeds.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
def fx(k): return (ROOT / "scripts" / "fixtures" / "spain-oilseeds" / ("oleaginosas_%s.txt" % k)).read_text("utf-8")
P = {2025: M.parse_text(fx("2025_26"), 2025), 2023: M.parse_text(fx("2023_24"), 2023), 2020: M.parse_text(fx("2020_21"), 2020), 2019: M.parse_text(fx("2019_20"), 2019), 2016: M.parse_text(fx("2016_17"), 2016)}
s = P[2025]["seeds"]; m = P[2025]["meals"]
ok("2025/26 colza superficie 102,0 y produccion 267,5", s["rapeseed"]["area"] == 102.0 and s["rapeseed"]["production"] == 267.5)
ok("2025/26 soja importaciones 3.350,0 (miles con punto y decimal con coma)", s["soy"]["imports"] == 3350.0)
ok("2025/26 girasol existencias finales 100 y total 340", s["sunflower"]["endingStocks"] == 100 and s["total"]["endingStocks"] == 340)
ok("2025/26 tortas: soja importaciones 2900,0 (sin separador de miles) y produccion utilizable 2.284,6", m["soy"]["imports"] == 2900.0 and m["soy"]["production"] == 2284.6)
ok("2025/26 tortas: colza existencias iniciales 30 aunque la fila va antes de la produccion", m["rapeseed"]["beginningStocks"] == 30 and m["rapeseed"]["production"] == 140.6)
ok("2025/26 estado y edicion", P[2025]["status"] == "estimación" and P[2025]["edition"] == "Julio 2026")
ok("2016/17 sin letras A./B./C. y sin estado", P[2016]["seeds"]["rapeseed"]["area"] == 92 and P[2016]["status"] is None)
ok("2016/17 tortas: la produccion utilizable va primero", P[2016]["meals"]["soy"]["production"] == 2027 and P[2016]["meals"]["soy"]["beginningStocks"] == 150)
ok("2019/20 y 2020/21 se leen", P[2019]["seeds"]["soy"]["endingStocks"] == 250 and P[2020]["seeds"]["rapeseed"]["exports"] == 88.3)
e, w = M.validate(P)
ok("tablas reales cuadran", not e)
bad = copy.deepcopy(P); bad[2025]["seeds"]["soy"]["imports"] += 500
ok("importaciones alteradas se rechazan", M.validate(bad)[0])
bad = copy.deepcopy(P); bad[2023]["meals"]["sunflower"]["endingStocks"] += 200
ok("existencias finales alteradas se rechazan", M.validate(bad)[0])
neg = copy.deepcopy(P); neg[2020]["seeds"]["rapeseed"]["exports"] = -1
ok("negativo se rechaza", M.validate(neg)[0])
tot = copy.deepcopy(P); tot[2025]["seeds"]["total"]["imports"] += 900
e, w = M.validate(tot)
ok("un TOTAL que no suma es aviso, no error", not e and any("total != suma" in x for x in w))
try: M.parse_text(fx("2025_26"), 2024); ok("campaña equivocada debe fallar", False)
except ValueError: pass
try: M.parse_text(fx("2025_26").replace("Existencias finales", "Otra cosa"), 2025); ok("fila que falta debe fallar", False)
except ValueError: pass
try: M.parse_text(fx("2025_26").replace("BALANCE TORTAS", "OTRA TABLA"), 2025); ok("tabla que falta debe fallar", False)
except ValueError: pass
html = 'href="/dam/x/balances-de-gestion-de-oleaginosas/1-balances-oleaginosas-es_2025_26.pdf" href="/dam/x/balancesoleaginosases_2016_17.pdf" href="/dam/x/1-balance-leguminosas-grano_campa-a-2025_26.pdf" href="/dam/x/balanceleguminosasgrano_campana2022_23.pdf" href="/dam/x/balances-oleaginosas-es_2021_23.pdf"'
L = M.pdf_links(html)
ok("enlaces: solo oleaginosas con campaña coherente (2025 y 2016), ni leguminosas ni 2021_23", sorted(L) == [2016, 2025])
series = M.make_series(P)
ids = [x["id"] for x in series]
ok("18 series (colza y soja, 9 cada una) con ids unicos; el girasol se valida pero no se publica", len(series) == 18 and len(set(ids)) == 18 and not any("sunflower" in i for i in ids))
ok("la produccion de semillas no se duplica", not any(i.startswith("es-oilseed-seed-") and "output" in i for i in ids))
x = {i["id"]: i for i in series}["es-oilseed-seed-soybean-imports"]
ok("serie anual en miles de t, periodo = año de inicio, latest = ultimo punto", x["frequency"] == "annual" and x["unit"] == "thousand t" and x["points"][-1] == ["2025", 3350.0] and x["latest"] == 3350.0 and x["points"][0][0] == "2016")
ok("grupos: stocks, trade y production", {y["group"] for y in series} == {"stocks", "trade", "production"})
ok("ninguna etiqueta usa «aceite»/«oil» (se etiquetaria como oliva)", not any("aceite" in y["label"].lower() for y in series))
print("test-spain-oilseeds:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

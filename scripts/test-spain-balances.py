#!/usr/bin/env python3
"""Balances de cereales de España (MAPA): lector y validacion con extractos reales de `pdftotext -layout` (scripts/fixtures/spain-balances, sin red).
Comprueba cifras concretas leidas de los PDF de 2025/26, 2020/21, 2019/20 y 2016/17 (formatos distintos: miles con punto, decimales con coma, columnas vacias, orden de columnas), celdas vacias = null,
las discrepancias de la columna TOTAL (2019/20) quedan como nota, y que se rechaza una tabla que no cuadra, una campaña que no es la pedida y una fila que falta.
Uso: python3 scripts/test-spain-balances.py"""
import importlib.util, copy, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("usb", ROOT / "scripts" / "update-spain-balances.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
def fx(y): return (ROOT / "scripts" / "fixtures" / "spain-balances" / ("cereales_%d.txt" % y)).read_text("utf-8")
P = {y: M.parse_text(fx(y), y) for y in (2025, 2020, 2019, 2016)}
v = P[2025]["v"]
ok("2025/26 trigo blando produccion 7.755 kt", v["wheat_soft"]["production"] == 7755)
ok("2025/26 maiz importaciones 8.000", v["maize"]["imports"] == 8000)
ok("2025/26 total existencias finales 4.950", v["total"]["endingStocks"] == 4950)
ok("2025/26 celdas vacias = null (sorgo alimentacion humana, trigo duro usos industriales)", v["sorghum"]["food"] is None and v["wheat_durum"]["industrial"] is None)
ok("2025/26 estado y edicion", P[2025]["status"] == "estimación" and P[2025]["edition"] == "Julio 2026")
ok("2020/21 decimales con coma y miles con punto", P[2020]["v"]["barley"]["area"] == 2749.04 and P[2020]["v"]["wheat_soft"]["production"] == 7029.6 and P[2020]["v"]["total"]["area"] == 5911.5)
ok("2020/21 sin estado", P[2020]["status"] is None)
ok("2019/20 mismo orden de columnas (blando antes que duro)", P[2019]["v"]["wheat_soft"]["production"] == 5107.7 and P[2019]["v"]["wheat_durum"]["production"] == 733.7)
ok("2016/17 numero sin separador de miles (avena 1110,1)", P[2016]["v"]["oats"]["production"] == 1110.1)
ok("2016/17 ceros publicados se conservan (alimentacion humana triticale 0)", P[2016]["v"]["triticale"]["food"] == 0)
camps = {y: dict(P[y], label="x") for y in P}
e, w, n = M.validate({2025: camps[2025], 2020: camps[2020], 2016: camps[2016]})
ok("tablas reales cuadran", not e)
e, w, n = M.validate({2019: camps[2019]})
ok("2019/20: ningun cereal falla", not e)
ok("2019/20: la discrepancia del TOTAL queda como nota (consumo 36.627 vs 35.827)", any(x["item"] == "consumption" and x["printed"] == 36627 for x in n[2019]))
bad = copy.deepcopy(camps[2025]); bad["v"]["barley"]["production"] += 5000
ok("produccion alterada se rechaza", M.validate({2025: bad})[0])
neg = copy.deepcopy(camps[2025]); neg["v"]["oats"]["exports"] = -1
ok("negativo se rechaza", M.validate({2025: neg})[0])
try: M.parse_text(fx(2025), 2024); ok("campaña equivocada debe fallar", False)
except ValueError: pass
try: M.parse_text(fx(2025).replace("Existencias finales", "Otra cosa"), 2025); ok("fila que falta debe fallar", False)
except ValueError: pass
try: M.parse_text(fx(2025).replace("Exportaciones                                                  200", "Exportaciones                                                  200  999"), 2025); ok("fila con columnas de mas debe fallar", False)
except ValueError: pass
ok("enlaces de la pagina", M.pdf_links('<a href="/dam/x/balances-de-mercado-de-cereales/1-balances-cereales-es_2025_26.pdf">a</a><a href="/dam/x/balancescerealeses_2019_20.pdf">b</a><a href="/dam/x/balances-cereales-es_2025_30.pdf">c</a>') == {2025: M.SITE + "/dam/x/balances-de-mercado-de-cereales/1-balances-cereales-es_2025_26.pdf", 2019: M.SITE + "/dam/x/balancescerealeses_2019_20.pdf"})
print("test-spain-balances:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

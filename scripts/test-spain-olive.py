#!/usr/bin/env python3
"""Balance del olivar y aforo de aceite de oliva de España (MAPA): lector y validacion con extractos reales de `pdftotext -layout` (scripts/fixtures/spain-balances, sin red).
Uso: python3 scripts/test-spain-olive.py"""
import importlib.util, copy, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("uso", ROOT / "scripts" / "update-spain-olive.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
def fx(n): return (ROOT / "scripts" / "fixtures" / "spain-balances" / n).read_text("utf-8")
B = {y: M.parse_balance(fx("olivar_%d.txt" % y)) for y in (2025, 2024, 2020)}
o = B[2025]["v"]["oil"]
ok("2025/26 provisional, actualización mayo 2026", B[2025]["status"] == "provisional" and B[2025]["update"] == "2026-05" and B[2025]["campaign"] == 2025)
ok("2025/26 aceite: produccion 1.295 kt, exportaciones 1.040, existencias finales 259,628", o["production"] == 1295.0 and o["exports"] == 1040.0 and o["endingStocks"] == 259.628)
ok("2025/26 aceite: ajustes y pérdidas vacío = null y aceituna de mesa 86,87", o["lossesAdj"] is None and B[2025]["v"]["tableOlive"]["lossesAdj"] == 86.87)
ok("2025/26 sin desglose UE = null", o["importsEU"] is None and o["exportsEU"] is None)
ok("2024/25 definitivo con desglose UE-27 / extra UE-27", B[2024]["status"] == "definitivo" and B[2024]["v"]["oil"]["exportsEU"] == 625.411 and B[2024]["v"]["oil"]["exportsNonEU"] == 416.16 and B[2024]["v"]["pomace"]["importsNonEU"] == 19.648)
ok("2020/21 formato antiguo (TOTAL RECURSOS, guiones)", B[2020]["v"]["oil"]["production"] == 1389.97 and B[2020]["v"]["oil"]["lossesAdj"] is None and B[2020]["v"]["tableOlive"]["lossesAdj"] == 79.432 and B[2020]["v"]["oil"]["totalUse"] == 2064.07)
e, w = M.validate({y: B[y] for y in B}); ok("balances reales cuadran", not e)
bad = copy.deepcopy(B[2025]); bad["v"]["oil"]["production"] += 300; ok("produccion alterada se rechaza", M.validate({2025: bad})[0])
bad = copy.deepcopy(B[2024]); bad["v"]["oil"]["exportsEU"] += 50; ok("UE + extra UE que no suman se rechaza", M.validate({2024: bad})[0])
try: M.parse_balance(fx("olivar_2025.txt").replace("Existencias finales", "Otra cosa")); ok("fila que falta debe fallar", False)
except ValueError: pass
try: M.parse_balance("nada"); ok("texto sin campaña debe fallar", False)
except ValueError: pass
A = M.parse_aforo(fx("aforo_2026.txt"))
ok("aforo 2026/27 publicado el 1 de octubre de 2026", A["campaign"] == 2026 and A["published"] == "2026-10-01")
ok("aforo total nacional 1.602.596 t (anterior 1.301.979, media 1.187.647)", A["total"] == {"mean6": 1187647, "previous": 1301979, "estimate": 1602596})
ok("aforo: Andalucía 1.261.200 y 13 filas autonómicas", [r for r in A["ccaa"] if r["name"] == "Andalucía"][0]["estimate"] == 1261200 and len(A["ccaa"]) == 13)
ok("aforo: «Otras CCAA» sin asterisco", any(r["name"] == "Otras CCAA" for r in A["ccaa"]))
try: M.parse_aforo(fx("aforo_2026.txt").replace("1.261.200", "1.261.900")); ok("aforo que no suma debe fallar", False)
except ValueError: pass
ok("enlaces de la pagina (balances sí, aforo aparte, ajenos fuera)", M.pdf_links('<a href="/dam/x/balances/balance-aceite-2025-26.pdf">a</a><a href="/dam/x/balances/aforo-2026.pdf">b</a><a href="/dam/x/otros/guia.pdf">c</a>') == ([M.SITE + "/dam/x/balances/balance-aceite-2025-26.pdf"], M.SITE + "/dam/x/balances/aforo-2026.pdf"))
print("test-spain-olive:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

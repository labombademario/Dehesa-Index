#!/usr/bin/env python3
"""Leche cruda de España (MAPA, INFOLAC): lector, validacion y acumulacion de historia con un extracto real de `pdftotext -layout` del informe de agosto de 2026 (scripts/fixtures/spain-milk, sin red).
Uso: python3 scripts/test-spain-milk.py"""
import importlib.util, copy, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("usm", ROOT / "scripts" / "update-spain-milk.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
T = (ROOT / "scripts" / "fixtures" / "spain-milk" / "entregas_2026-08.txt").read_text("utf-8")
r = M.parse(T); N = r["national"]
ok("informe de agosto de 2026, publicado el 1/10/2026, extraido el 30/9/2026", r["month"] == "2026-08" and r["published"] == "2026-10-01" and r["extracted"] == "2026-09-30")
ok("12 meses de sep-2025 a ago-2026", r["periods"][0] == "2025-09" and r["periods"][-1] == "2026-08" and len(r["periods"]) == 12)
ok("entregas: ago-2026 624.947 t y ago-2025 (año anterior) 605.207 t", N["deliveries"]["2026-08"] == 624947 and N["deliveries"]["2025-08"] == 605207 and N["deliveries"]["2024-09"] == 581894)
ok("precio medio ago-2026 0,469 EUR/l", N["price"]["2026-08"] == 0.469 and N["price"]["2025-09"] == 0.529)
ok("grasa 3,71 % y proteina 3,32 % en ago-2026", N["fat"]["2026-08"] == 3.71 and N["protein"]["2026-08"] == 3.32)
ok("ganaderos 8.425 y compradores 289 en ago-2026", N["farmers"]["2026-08"] == 8425 and N["buyers"]["2026-08"] == 289)
ok("leche ecologica ago-2026 3.353 t", N["organic"]["2026-08"] == 3353)
H = r["priceHistory"]
ok("historia del precio desde ene-2022 (0,371) y los meses futuros (0,000) son hueco, no cero", H["2022-01"] == 0.371 and H["2023-01"] == 0.599 and H["2026-08"] == 0.469 and H["2026-09"] is None and H["2026-12"] is None)
C = r["ccaa"]
ok("17 comunidades", len(C) == 17 and "otros" not in C)
ok("Galicia ago-2026: 267.795 t, grasa 3,79 %, proteina 3,34 %, 4.745 ganaderos", C["galicia"]["production"]["2026-08"] == 267795 and C["galicia"]["fat"]["2026-08"] == 3.79 and C["galicia"]["protein"]["2026-08"] == 3.34 and C["galicia"]["farmers"]["2026-08"] == 4745)
ok("Castilla-La Mancha y Valenciana con su clave", C["clm"]["production"]["2026-08"] == 23699 and C["valenciana"]["production"]["2026-08"] == 6640)
ok("«Otros» (ganadero de Portugal) solo en ganaderos de sep-2025", N["_otros_farmers"]["2025-09"] == 1)
e, w = M.validate(r); ok("el informe real cuadra", not e)
ok("aviso de los 26 t del ganadero portugues en sep-2025", any("2025-09" in x and "otro pais" in x for x in w))
bad = copy.deepcopy(r); bad["ccaa"]["galicia"]["production"]["2026-08"] += 5000; ok("comunidades que no suman se rechaza", M.validate(bad)[0])
bad = copy.deepcopy(r); bad["national"]["price"]["2026-08"] = 0.6; ok("precio general distinto del de la tabla de evolucion se rechaza", M.validate(bad)[0])
bad = copy.deepcopy(r); bad["national"]["fat"]["2026-03"] = 9; ok("grasa fuera de rango se rechaza", M.validate(bad)[0])
bad = copy.deepcopy(r); bad["national"]["farmers"]["2026-08"] += 500; ok("ganaderos que no cuadran se rechaza", M.validate(bad)[0])
for what, f in (("falta la tabla de grasa", lambda t: t.replace("CARACTERÍSTICAS CUALITATIVAS. MATERIA GRASA", "OTRA COSA")), ("sin mes", lambda t: t.replace("AGOSTO 2026", "")), ("sin tabla general", lambda t: t.replace("DATOS GENERALES", "OTROS"))):
    try: M.parse(f(T)); ok(what + " debe fallar", False)
    except ValueError: pass
# acumulacion: un informe posterior (sep-2026) desplaza la ventana un mes, repite 11 y revisa uno
d1, rv = M.merge(None, r); ok("primer informe: 56 meses (2022-01..2026-08), sin revisiones", len(d1["periods"]) == 56 and d1["periods"][0] == "2022-01" and not rv)
ok("meses sin dato quedan null (fat en 2022-01)", d1["national"]["fat"][0] is None and d1["national"]["deliveries"][0] is None and d1["ccaa"]["galicia"]["production"][0] is None)
r2 = copy.deepcopy(r); r2["month"] = "2026-09"; r2["periods"] = r["periods"][1:] + ["2026-09"]
def sh(d, v): d = {p: x for p, x in d.items() if p != "2025-09"}; d["2026-09"] = v; return d
r2["national"]["deliveries"] = sh(r["national"]["deliveries"], 600000.0); r2["national"]["deliveries"]["2026-08"] = 625100.0
for k in ("price", "fat", "protein", "farmers", "buyers", "organic"): r2["national"][k] = sh(r["national"][k], r["national"][k]["2026-08"])
r2["priceHistory"] = {}
r2["ccaa"] = {c: {v: sh(a, a["2026-08"]) for v, a in vs.items()} for c, vs in r["ccaa"].items()}
d2, rv = M.merge(d1, r2)
ok("segundo informe: 57 meses, 2025-09 se conserva y 2026-09 se añade", len(d2["periods"]) == 57 and d2["periods"][-1] == "2026-09" and d2["national"]["deliveries"][d2["periods"].index("2025-09")] == 588630)
ok("la revision del MAPA (ago-2026 624.947 -> 625.100) se registra y gana el informe nuevo", any(x[0] == "2026-08" and x[2] == 624947 and x[3] == 625100 for x in rv) and d2["national"]["deliveries"][d2["periods"].index("2026-08")] == 625100)
ok("la historia del precio no se pierde", d2["national"]["price"][0] == 0.371)
print("test-spain-milk:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

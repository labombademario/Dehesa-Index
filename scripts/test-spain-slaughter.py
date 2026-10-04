#!/usr/bin/env python3
"""Sacrificio de ganado de España (MAPA): lector, validacion, incoherencia de la fuente y acumulacion con el libro real de agosto de 2026 (scripts/fixtures/spain-slaughter, sin red).
Uso: python3 scripts/test-spain-slaughter.py"""
import importlib.util, copy, sys, io
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("uss", ROOT / "scripts" / "update-spain-slaughter.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
import openpyxl
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
wb = openpyxl.load_workbook(ROOT / "scripts" / "fixtures" / "spain-slaughter" / "sacrificio_2026-08.xlsx", data_only=True)
nat, months = M.parse_book(wb)
P, N, cc, notes = M.build(nat, months)
ok("serie nacional de ene-2022 a ago-2026 (56 meses)", P[0] == "2022-01" and P[-1] == "2026-08" and len(P) == 56)
i = P.index("2026-07"); j = P.index("2025-07")
ok("bovino jul-2026: 209.794 cabezas y 65.928,75 t canal", N["bovino"]["heads"][i] == 209794 and abs(N["bovino"]["carcass"][i] - 65928.75) < 0.01)
ok("porcino jul-2026: 4.392.384 cabezas", N["porcino"]["heads"][i] == 4392384 and N["porcino"]["heads"][j] == 4547368)
ok("aves en miles de cabezas (83.158 miles en jul-2026)", abs(N["aves"]["heads"][i] - 83158.202) < 0.01)
ok("17 comunidades", len(cc) == 17)
ok("Galicia bovino jul-2026: 31.554 cabezas y 8.910 t; Cataluña porcino 1.740.897", cc["galicia"]["bovino"]["heads"][i] == 31554 and abs(cc["galicia"]["bovino"]["carcass"][i] - 8910.161) < 0.01 and cc["cataluna"]["porcino"]["heads"][i] == 1740897)
ok("antes de 2025 no hay dato por comunidad: es hueco (null), no cero", cc["galicia"]["bovino"]["heads"][0] is None and cc["galicia"]["bovino"]["heads"][P.index("2025-01")] == 28301)
ok("incoherencia de agosto de 2026 anotada (la fila Total de la hoja mensual no es la serie nacional)", notes and all(x["period"] == "2026-08" for x in notes) and any(x["species"] == "caprino" and x["kind"] == "heads" for x in notes))
e, w = M.validate(P, N, cc, nat); ok("el libro real cuadra", not e)
bad = copy.deepcopy(N); bad["bovino"]["heads"][i] += 90000; ok("meses que no suman el total del año se rechaza", M.validate(P, bad, cc, nat)[0])
bad = copy.deepcopy(N); bad["porcino"]["carcass"][i] *= 3; ok("peso canal imposible se rechaza", M.validate(P, bad, cc, nat)[0])
bad = copy.deepcopy(cc); bad["galicia"]["bovino"]["heads"][i] = -5; ok("negativo se rechaza", M.validate(P, N, bad, nat)[0])
bad = copy.deepcopy(cc); bad["galicia"]["ovino"]["heads"][i] += 5000000; ok("comunidades que superan el nacional se rechaza", M.validate(P, N, bad, nat)[0])
d1 = {"periods": P, "national": N, "ccaa": cc}
P1, N1, c1, rv = M.merge(None, P, N, cc); ok("primer libro sin revisiones", not rv and P1 == P)
P2 = P[1:] + ["2026-09"]
N2 = {s: {k: v[1:] + [v[-1]] for k, v in d.items()} for s, d in N.items()}; N2["bovino"]["heads"][-2] = 999.0
c2 = {c: {s: {k: v[1:] + [v[-1]] for k, v in d.items()} for s, d in sps.items()} for c, sps in cc.items()}
Pm, Nm, cm, rv = M.merge(d1, P2, N2, c2)
ok("el segundo libro añade 2026-09 y conserva 2022-01", Pm[0] == "2022-01" and Pm[-1] == "2026-09" and len(Pm) == 57)
ok("la revision del MAPA se registra y gana el libro nuevo", any(x[0] == "2026-08" for x in rv) and Nm["bovino"]["heads"][Pm.index("2026-08")] == 999.0)
try: M.parse_national(wb["2025-2026-enero"]); ok("hoja equivocada debe fallar", False)
except Exception: pass
print("test-spain-slaughter:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

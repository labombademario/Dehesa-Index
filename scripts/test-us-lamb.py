#!/usr/bin/env python3
"""Tests del lector de LM_XL502 con respuestas reales de la API de AMS (scripts/fixtures/ams/lamb-lm_xl502-2026-10-01.json, descargadas el 2026-10-01). Sin red."""
import importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lb", ROOT / "scripts" / "update-us-lamb.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
fx = json.loads((ROOT / "scripts" / "fixtures" / "ams" / "lamb-lm_xl502-2026-10-01.json").read_text())
rows = C.build(fx)
eq(len(rows), 14, "14 dias en el fixture"); eq(rows[0][0], "2026-09-14", "primer dia"); eq(rows[-1][0], "2026-10-01", "ultimo dia")
eq(all(len(r) == 6 for r in rows), True, "6 columnas")
eq([r[0] for r in rows], sorted(r[0] for r in rows), "orden ascendente")
eq(all(abs(r[1] - r[2] - 77) < 1 for r in rows), True, "bruto - neto es constante en el informe (77 USD/cwt)")
eq(all(r[5] in (0, 1) for r in rows), True, "marca de correccion 0/1")
# una seccion sin datos: no se publica a medias
broken = json.loads(json.dumps(fx)); broken["NET CARCASS VALUE"] = []
try: C.build(broken); bad.append("debia fallar sin neto")
except ValueError: pass
# un dia con cifra nula en una seccion se descarta entero
nul = json.loads(json.dumps(fx)); nul["FORESADDLE VALUE"][0]["foresaddle_price"] = None
eq(len(C.build(nul)), 13, "dia con cifra nula descartado")
print("OK test-us-lamb" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

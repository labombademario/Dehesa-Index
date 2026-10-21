#!/usr/bin/env python3
"""update-eu-production: si un bloque del portal falla (404 de azucar el 21-oct-2026), no se borran sus series publicadas:
se conservan tal cual del fichero anterior, sin duplicar las que si llegaron, y se deja constancia en el log. Sin red."""
import json, sys, tempfile, importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location("up", Path(__file__).resolve().parent / "update-eu-production.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
fail = 0
def ok(m, c):
    global fail
    if not c: fail += 1; print("FALLA", m)
ser = lambda i: {"id": i, "points": [["2025", 1.0], ["2026", 2.0]]}
prev = {"countries": {"EU": {"series": [ser("eu-prod-eu-sugar-region-1-area"), ser("eu-prod-eu-cereal-wheat-area")]}, "NL": {"series": [ser("eu-prod-nl-sugar-netherlands-yield"), ser("eu-prod-nl-rice-x-area")]}}}
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / "eu-production-stats.json"; p.write_text(json.dumps(prev))
    M.OUT.clear(); M.OUT["EU"] = [ser("eu-prod-eu-cereal-wheat-area")]
    M.carry(p, ["sugar"])
    ids = sorted(s["id"] for v in M.OUT.values() for s in v)
    ok("las 2 series de azucar se conservan", "eu-prod-eu-sugar-region-1-area" in ids and "eu-prod-nl-sugar-netherlands-yield" in ids)
    ok("lo que si llego no se duplica", ids.count("eu-prod-eu-cereal-wheat-area") == 1)
    ok("no se arrastran bloques que no fallaron (arroz)", "eu-prod-nl-rice-x-area" not in ids)
    ok("queda en el log", any("MANTENIDO sugar: 2 series" in l for l in M.U.LOG))
    M.OUT.clear(); M.carry(p, []); ok("sin fallos no se toca nada", not M.OUT)
    M.OUT.clear(); M.carry(Path(d) / "no-existe.json", ["sugar"]); ok("sin fichero anterior no se inventa nada", not M.OUT)
print("eu-production carry: %d fallos" % fail); sys.exit(1 if fail else 0)

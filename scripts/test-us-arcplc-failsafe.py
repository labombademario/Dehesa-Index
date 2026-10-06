#!/usr/bin/env python3
"""Prueba del comportamiento a prueba de fallos de update-us-arcplc.py con fixtures generados al vuelo (sin red).
Escenarios: (1) fuente disponible, (2) la URL principal da timeout y la alternativa responde, (3) principal y alternativa dan timeout,
(4) respuesta parcial, (5) archivo previo existente (se conserva intacto en un corte), (6) primera ejecucion sin archivo previo.
Regla: un corte del proveedor NO modifica ni un byte de data/us-arcplc y el estado sale 'unavailable'; un conjunto valido sale 'available'.
Uso: python3 scripts/test-us-arcplc-failsafe.py"""
import hashlib, importlib.util, io, json, sys, tempfile
from pathlib import Path
import openpyxl
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("arc", ROOT / "scripts" / "update-us-arcplc.py"); U = importlib.util.module_from_spec(spec); spec.loader.exec_module(U)
U.log = lambda *a: None
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
HEAD = ["ST_CTY", "State", "County", "Sub", "Crop", "Unit", "Designation", "Benchmark (2019-23 Olympic average) yield", "Benchmark price", "Benchmark revenue", "Guarantee revenue", "Maximum payment rate", "Actual yield", "National price", "Actual revenue", "Formula payment rate", "ARC-CO payment rate"]
def arc_xlsx(states, year=2024):
    wb = openpyxl.Workbook(); ws = wb.active; ws.append(["ARC-CO %d" % year]); ws.append([]); ws.append(HEAD)
    for k, st in enumerate(states):
        ws.append(["%02d001" % (k + 1), st, "Condado", "", "Corn", "bu", "All", 180, 4.5, 810, 729, 97, 170, 4.1, 697, 32, 32.0])
    b = io.BytesIO(); wb.save(b); return b.getvalue()
def plc_xlsx():
    wb = openpyxl.Workbook(); ws = wb.active; ws.append(["PLC"]); ws.append(["Commodity", "MY", "", "Unit", "Ref", "MYA", "", "Loan", "Eff", "", "Rate", "", "Max"])
    for i in range(12): ws.append(["Crop%d" % i, "2024/25", "", "bu", 4.0, 3.5, "P", 2.0, 4.0, "", 0.5, "", 1.0])
    b = io.BytesIO(); wb.save(b); return b.getvalue()
STATES = sorted(U.NAMES)  # nombres completos; 50 estados
def setup(avail=True, nstates=len(STATES), fail_main=False, fail_alt=False):
    files = {"arc2024": arc_xlsx(STATES[:nstates]), "plc2024": plc_xlsx()}
    page = '<a href="https://x/arcco-2024-data.xlsx">a</a><a href="https://x/2024-plc-excel.xlsx">p</a>'
    def fetch(u, tries=3, deadline=240):
        if u == U.PAGE and fail_main: raise RuntimeError("timeout principal")
        if u == U.PAGE_ALT and fail_alt: raise RuntimeError("timeout alternativa")
        if u in (U.PAGE, U.PAGE_ALT): return page.encode()
        if not avail: raise RuntimeError("timeout " + u)
        return files["arc2024"] if "arcco" in u else files["plc2024"]
    U.fetch = fetch
def snap(d): return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path(d).glob("*"))}
def go(d): return U.run([], Path(d))
with tempfile.TemporaryDirectory() as t:
    d = Path(t) / "a"
    setup(); st, why = go(d); ok("1 disponible: estado available", st == "available" and not why)
    ok("1 disponible: se escriben index, national y estados", (d / "index.json").exists() and (d / "national.json").exists() and (d / "AL.json").exists() and len(json.loads((d / "index.json").read_text())["states"]) == 50)
    setup(fail_main=True); st, why = go(d); ok("2 timeout principal con alternativa: sigue disponible", st == "available")
    before = snap(d)
    setup(fail_main=True, fail_alt=True); st, why = go(d)
    ok("3 timeout principal y alternativa: unavailable", st == "unavailable" and "no responde" in why)
    ok("3 ... y no se toca ni un byte del dato previo", snap(d) == before)
    setup(avail=False); st, why = go(d); ok("3b ficheros no descargables: unavailable sin tocar nada", st == "unavailable" and snap(d) == before)
    setup(nstates=12); st, why = go(d); ok("4 respuesta parcial (12 estados): unavailable", st == "unavailable" and "parcial" in why)
    ok("4 ... y el dato previo sigue intacto", snap(d) == before)
    setup(fail_main=True, fail_alt=True); go(d); ok("5 archivo previo: sigue exactamente igual tras un corte", snap(d) == before)
    e = Path(t) / "nuevo"
    setup(fail_main=True, fail_alt=True); st, why = go(e); ok("6 primera ejecucion con corte: unavailable y no crea ficheros", st == "unavailable" and not e.exists())
    setup(nstates=12); st, why = go(e); ok("6 primera ejecucion con respuesta parcial: no escribe nada", st == "unavailable" and not e.exists())
    setup(); st, why = go(e); ok("6 primera ejecucion con fuente: available", st == "available" and (e / "index.json").exists())
print("ARC/PLC fail-safe:", "OK" if not fail else "%d fallos" % fail); sys.exit(1 if fail else 0)

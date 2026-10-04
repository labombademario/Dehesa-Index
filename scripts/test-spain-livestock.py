#!/usr/bin/env python3
"""Efectivos de ganado de España (MAPA): lector y validacion con un libro sintetico (sin red). Comprueba: se leen provincias y total nacional, las filas de comunidad se ignoran,
un valor negativo queda como hueco, los decimales se redondean a 1, y se rechaza (sin escribir nada) un libro cuyas provincias no suman el nacional o con valor repetido distinto.
Uso: pip install openpyxl && python3 scripts/test-spain-livestock.py"""
import importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
import openpyxl
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("usl", ROOT / "scripts" / "update-spain-livestock.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
HEAD = ["AÑO", "MES", "COMUNIDAD-PROVINCIA", "COMUNIDAD", "PROVINCIA", "NOMBRE DE LA COMUNIDAD-PROVINCIA", "ESPECIE", "VARIABLE", "VALOR"]
PROV = [("%02d" % p, "%02d" % ((p - 1) // 4 + 1)) for p in range(1, 51)]  # (provincia, comunidad) ficticia
VARS = {"Bovino": ["01Tanimales"] + ["%02dX" % i for i in range(2, 13)], "Ovino": ["01Tanimales", "02Corderos", "03Sementales", "04Thembras", "05A", "06B", "07C", "08D", "09E"],
        "Caprino": ["01Tanimales", "02Chivos", "03Sementales", "04Thembras", "05A", "06B", "08D", "09E"], "Porcino": ["%02dP" % i for i in range(1, 40)]}
def build(mut=None, extra=None):
    rows = [HEAD]
    for e, vs in VARS.items():
        for (a, m) in [(2024, "05"), (2024, "11")]:
            for v in vs:
                code = int(v[:2]); hier = M.HIER[M.SPECIES[e]]
                if code in hier:  # total = suma de componentes (valores enteros pequeños)
                    pass
            # valores: hojas = 10; totales = suma de hijos, por provincia
            def val(code):
                h = M.HIER[M.SPECIES[e]]
                return sum(val(c) for c in h[code]) if code in h else 10
            for (p, c) in PROV:
                for v in vs: rows.append((a, m, c + p, c, p, c + p + " X", e, v, val(int(v[:2]))))
                for v in vs: pass
            for v in vs: rows.append((a, m, "9999", "99", "99", "9999 ESPAÑA", e, v, 50 * val(int(v[:2]))))
            for c in sorted({c for _, c in PROV}):  # filas de comunidad: deben ignorarse
                for v in vs: rows.append((a, m, c + "99", c, "99", c + "99 CCAA", e, v, 12345))
    if mut: rows = mut(rows)
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = "data"
    for r in rows: ws.append(list(r))
    t = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False); wb.save(t.name); return t.name
def run(path, out): return subprocess.run([sys.executable, str(ROOT / "scripts" / "update-spain-livestock.py"), "--file", path, "--out", out], capture_output=True, text=True)
with tempfile.TemporaryDirectory() as out:
    r = run(build(), out); ok("libro correcto aceptado: " + r.stdout[-300:], r.returncode == 0)
    d = json.loads((Path(out) / "livestock-bovino.json").read_text())
    ok("51 areas (ES + 50 provincias), comunidades ignoradas", len(d["v"]) == 51 and "ES" in d["v"] and "01" in d["v"])
    ok("periodos", d["periods"] == ["2024-05", "2024-11"])
    ok("nacional = suma de provincias", d["v"]["ES"]["01"][0] == sum(d["v"][p]["01"][0] for p in d["v"] if p != "ES"))
    ok("indice", json.loads((Path(out) / "index.json").read_text())["species"]["porcino"]["vars"] == 39)
with tempfile.TemporaryDirectory() as out:  # negativo -> hueco; decimales -> 1
    def neg(rows):
        rows = list(rows); i = next(k for k, r in enumerate(rows) if r[6] == "Bovino" and r[4] == "28" and r[7].startswith("02") and r[1] == "05"); r = list(rows[i]); r[8] = -1; rows[i] = tuple(r); return rows
    r = run(build(neg), out); d = json.loads((Path(out) / "livestock-bovino.json").read_text())
    ok("negativo queda como hueco (null)", d["v"]["28"]["02"][0] is None and "valor negativo" in r.stdout)
with tempfile.TemporaryDirectory() as out:  # provincias que no suman -> rechazo y nada escrito
    def off(rows):
        rows = list(rows); i = next(k for k, r in enumerate(rows) if r[6] == "Ovino" and r[3] != "99" and r[4] == "10" and r[7].startswith("05") and r[1] == "05"); r = list(rows[i]); r[8] += 9000; rows[i] = tuple(r); return rows
    r = run(build(off), out); ok("provincias que no suman el nacional se rechazan", r.returncode == 1 and not list(Path(out).glob("*.json")))
with tempfile.TemporaryDirectory() as out:  # valor repetido y distinto
    def dup(rows): rows = list(rows); r = list(rows[1]); r[8] += 1; return rows + [tuple(r)]
    r = run(build(dup), out); ok("valor repetido y distinto se rechaza", r.returncode == 1 and not list(Path(out).glob("*.json")))
with tempfile.TemporaryDirectory() as out:  # cabecera cambiada
    r = run(build(lambda rows: [["X"] * 9] + list(rows[1:])), out); ok("cabecera inesperada se rechaza", r.returncode == 1)
print("test-spain-livestock:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

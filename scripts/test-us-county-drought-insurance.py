#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-us-county-drought.py y scripts/update-us-county-insurance.py con datos sinteticos."""
import importlib.util, io, sys, zipfile
from pathlib import Path
R = Path(__file__).resolve().parent
def load(n):
    sp = importlib.util.spec_from_file_location(n.replace("-", "_"), R / (n + ".py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
ok_n = 0
def ok(msg, cond):
    global ok_n
    print(("OK   " if cond else "FALLA"), msg); ok_n += 0 if cond else 1
d = load("update-us-county-drought")
rows = []
for i in range(60):
    w = "2026-%02d-%02dT00:00:00" % (1 + i // 28, 1 + i % 28)
    rows.append({"mapDate": w, "fips": "19001", "county": "Adair County", "state": "IA", "d0": 50.0, "d1": 20.0, "d2": 5.0, "d3": 0.0, "d4": 0.0})
rows.append({"mapDate": "2026-01-01T00:00:00", "fips": "19003", "county": "Adams County", "state": "IA", "d0": 10, "d1": 20, "d2": 0, "d3": 0, "d4": 0})  # no acumulado: se descarta
rows.append({"mapDate": "2026-01-02T00:00:00", "fips": "19005", "county": "Allamakee County", "state": "IA", "d0": None, "d1": 0, "d2": 0, "d3": 0, "d4": 0})
weeks, cs = d.build("IA", rows)
ok("52 semanas como maximo, ordenadas", len(weeks) == 52 and weeks == sorted(weeks))
ok("condado con categorias no acumuladas descartado", "19003" not in cs)
ok("condado con valor nulo descartado", "19005" not in cs)
ok("valores copiados tal cual", cs["19001"]["v"][-1] == [50.0, 20.0, 5.0, 0.0, 0.0])
ins = load("update-us-county-insurance")
def line(cf, st, crop, liab, prem, sub, ind, pol, acres):
    c = ["2025", "19", st, cf, "Polk", "41", crop, "90", "APH", "A", "RBUP", ".7", "1", str(pol), "0", "0", "0", "Acres", str(acres), "0", str(liab), str(prem), str(sub), "0", "0", "0", str(ind), "0"]
    return "|".join(c)
txt = "\n".join([line("153", "IA", "Corn", 1000, 100, 60, 30, 5, 10), line("153", "IA", "Soybeans", 500, 40, 20, 5, 3, 4), line("999", "IA", "Corn", 200, 10, 5, 1, 1, 1)])
buf = io.BytesIO(); zf = zipfile.ZipFile(buf, "w"); zf.writestr("sobcov_2025.txt", txt); zf.close()
out, tot = ins.agg(buf.getvalue())
ok("el condado 999 no se publica pero cuenta en el total nacional", "19999" not in out and tot[0] == 1700 and tot[3] == 36)
ok("suma por condado", out["19153"]["v"][:4] == [1500, 140, 80, 35] and out["19153"]["v"][4] == 8)
ok("cultivos del condado", out["19153"]["crops"]["Corn"] == [1000, 100, 30])
sys.exit(1 if ok_n else 0)

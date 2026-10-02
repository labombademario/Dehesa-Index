#!/usr/bin/env python3
"""Pruebas de update-canada-grain.py con extractos reales de la CGC (scripts/fixtures/cgc) y con los datos publicados."""
import csv, datetime, gzip, importlib.util, io, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "update-canada-grain.py"); g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
F = []
def T(name, ok):
    print(("OK   " if ok else "FALLO ") + name)
    if not ok: F.append(name)
def load(fy): return g.rows_of(gzip.decompress((ROOT / "scripts" / "fixtures" / "cgc" / ("gsw-%s-excerpt.csv.gz" % fy)).read_bytes()).decode("utf-8"))
T("negativos entre parentesis", g.num("(1.1)") == -1.1 and g.num("1,234.5") == 1234.5 and g.num("12.3") == 12.3)
T("fecha ambigua: gana la lectura que encaja con la semana anterior", [c.isoformat() for c in g.cands("07/06/2025")] == ["2025-06-07", "2025-07-06"])
files = {fy: load(fy) for fy in ("2024-25", "2025-26", "2026-27")}
rows = [r for fy in files for r in files[fy] if r["worksheet"] in ("Terminal Exports", "Primary", "Summary")]
wd = g.week_dates(rows)
T("semana 48 de 2024-25 (texto 07/06/2025) = 6 de julio", wd[("2024-2025", 48)] == "2025-07-06")
T("cada campana: semanas consecutivas separadas 7 dias (salvo la ultima, que cierra el 31 de julio)", all(
    (datetime.date.fromisoformat(wd[(cy, n + 1)]) - datetime.date.fromisoformat(wd[(cy, n)])).days in (7, 4, 5, 6) if n >= 51 else (datetime.date.fromisoformat(wd[(cy, n + 1)]) - datetime.date.fromisoformat(wd[(cy, n)])).days == 7
    for (cy, n) in wd if (cy, n + 1) in wd))
T("las fechas son domingos (salvo el cierre del 31 de julio)", all(datetime.date.fromisoformat(d).weekday() == 6 or d.endswith("-07-31") for d in wd.values()))
weeks, grains = g.build(files)
T("semanas ordenadas y sin repetir", weeks == sorted(set(weeks)))
G = {x["id"]: x for x in grains}
T("hay trigo, canola y cebada", {"wheat", "canola", "barley"} <= set(G))
T("todas las columnas tienen una cifra por semana", all(len(x[k]) == len(weeks) for x in grains for k in ("exports", "cumExports", "deliveries", "stocks")))
T("ninguna exportacion negativa; existencias >= 0 (None no es 0)", all(v is None or v >= 0 for x in grains for v in x["exports"] + x["stocks"]))
pub = json.loads((ROOT / "data" / "canada-grain.json").read_text())
T("los datos publicados coinciden con lo que sale de los extractos en las semanas comunes", all(
    G[x["id"]]["exports"][weeks.index(w)] == x["exports"][i] for x in pub["grains"] if x["id"] in G for i, w in enumerate(pub["weeks"]) if w in weeks and x["exports"][i] is not None))
T("asOf = ultima semana", pub["asOf"] == pub["weeks"][-1])
print("\n%d fallos" % len(F)); sys.exit(1 if F else 0)

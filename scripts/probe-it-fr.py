#!/usr/bin/env python3
"""Sonda 50: cabecera de la tabla 2.13 del MMO 2025."""
import importlib.util, sys
spec = importlib.util.spec_from_file_location("m", "scripts/update-uk-mmo-fish.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
url, page, ry = m.locate(); sh = m.sheets(m.get(url))
rows = sh["Table_2_13"]; print("filas", len(rows), "anchura", max(len(r) for r in rows))
for i, r in enumerate(rows[:9]): print(i, [(j, c[:18]) for j, c in enumerate(r) if c])
for i, r in enumerate(rows):
    if r and r[0]: print("fila", i, r[0][:100])
print([k for k in sh if "13" in k])

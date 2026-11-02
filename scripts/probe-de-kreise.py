#!/usr/bin/env python3
"""Sondeo (solo rama research/): estructura de las tablas del Censo Agrario por Land en GENESIS. No escribe datos."""
import importlib.util, os, re, collections
from pathlib import Path
sp = importlib.util.spec_from_file_location("x", Path(__file__).parent / "update-germany-destatis-extra.py"); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
tok = os.environ["GENESIS_TOKEN"].strip()
for name in ("41141-0101", "41141-0103", "41141-0104", "41141-0105", "41141-0113", "41141-0115", "41141-0116", "41141-0117", "41141-0109"):
    try: R = m.fetch(tok, name, "2010")
    except Exception as e: print("==", name, "ERROR", str(e)[:200]); continue
    print("==", name, len(R), "filas; columnas:", [k for k in R[0] if not k.endswith("_code")][:20])
    print("  años:", sorted({r["time"] for r in R}))
    print("  valores:", sorted({r["value_variable_label"] for r in R}))
    cl = collections.defaultdict(set)
    for r in R:
        for n, v in m.labels(r).items(): cl[n].add(v)
    for n, vs in sorted(cl.items()):
        print("  clasif", n, len(vs), sorted(vs)[:40])
    print("  muestra:", {k: v for k, v in R[0].items() if not k.endswith("_code")})

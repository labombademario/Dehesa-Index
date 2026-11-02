#!/usr/bin/env python3
"""Sondeo (solo rama research/): estructura de las tablas nacionales 41141-0001 y -0004."""
import importlib.util, os, collections
from pathlib import Path
sp = importlib.util.spec_from_file_location("ge", Path(__file__).parent / "update-germany-destatis-extra.py"); ge = importlib.util.module_from_spec(sp); sp.loader.exec_module(ge)
tok = os.environ["GENESIS_TOKEN"].strip()
for name in ("41141-0001", "41141-0004"):
    R = ge.fetch(tok, name, "2010")
    print("==", name, len(R), [k for k in R[0] if not k.endswith("_code")])
    print(" valores", collections.Counter(r["value_variable_label"] for r in R))
    print(" años", sorted({r["time"] for r in R}))
    for r in R[:3]: print(" fila", {k: v for k, v in r.items() if not k.endswith("_code")})
    print(" labels1", sorted({ge.labels(r).get(1) for r in R})[:15])

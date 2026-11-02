#!/usr/bin/env python3
"""Sondeo (solo rama research/): ejecuta update-de-lz-laender.py contra GENESIS sin publicar y enseña el resultado."""
import json, subprocess, sys
r = subprocess.run([sys.executable, "scripts/update-de-lz-laender.py", "--out", "/tmp/lz/de-lz.json", "--probe"])
print("exit", r.returncode)
try:
    d = json.load(open("/tmp/lz/de-lz.json"))
    for k, t in d["tables"].items():
        print("--", k, "BY", json.dumps(t.get("BY", {}), ensure_ascii=False)[:1500])
except Exception as e: print("sin json", e)

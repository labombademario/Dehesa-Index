#!/usr/bin/env python3
"""Prueba del License Gate estricto: una fuente PENDING nueva en uso debe romper --strict; la base declarada no."""
import copy, json, os, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
reg = json.loads((ROOT / "data/license-registry.json").read_text())
def run(r, *flags):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f: json.dump(r, f); fn = f.name
    try: return subprocess.run([sys.executable, str(ROOT / "scripts/check-licenses.py"), *flags], env={**os.environ, "DEHESA_LICENSE_REGISTRY": fn}, capture_output=True, text=True)
    finally: os.unlink(fn)
fails = []
def check(name, cond):
    print(("ok   " if cond else "FAIL ") + name)
    if not cond: fails.append(name)
check("registro real pasa --strict", run(reg, "--strict").returncode == 0)
r = copy.deepcopy(reg); del r["pendingBaseline"]["sources"]["ble"]
x = run(r, "--strict"); check("PENDING en uso fuera de la base falla --strict", x.returncode == 1 and "fuera de pendingBaseline" in x.stdout)
check("sin --strict esa misma fuente solo avisa", run(r).returncode == 0)
r = copy.deepcopy(reg); r["sources"]["ble"]["status"] = "VERIFIED"
x = run(r, "--strict"); check("base desfasada (fuente ya resuelta) falla --strict", x.returncode == 1 and "quitarla de la lista" in x.stdout)
r = copy.deepcopy(reg); r["pendingBaseline"]["sources"]["ble"].pop("nextAction")
check("base sin nextAction falla --strict", run(r, "--strict").returncode == 1)
check("--strict-all falla mientras queden PENDING", run(reg, "--strict-all").returncode == 1)
sys.exit(1 if fails else 0)

#!/usr/bin/env python3
"""Citas bajo cada cifra: (1) toda fuente en uso del registro tiene nombre corto; (2) toda pagina cuyo JS usa DICite carga js/cite.js
antes que ese JS; (3) js/cite.js existe. Falla si una pagina cita sin cargar el modulo (la cita desapareceria en silencio)."""
import json, re, sys
from pathlib import Path
R = Path(__file__).resolve().parents[1]; err = []
reg = json.loads((R / "data/license-registry.json").read_text(encoding="utf-8"))
for k, s in reg["sources"].items():
    if s.get("used") and not s.get("short"): err.append("fuente en uso sin 'short': " + k)
users = {p.name for p in (R / "js").glob("*.js") if p.name != "cite.js" and "DICite" in p.read_text(encoding="utf-8")}
for h in sorted(R.glob("*.html")):
    t = h.read_text(encoding="utf-8"); srcs = re.findall(r'src="js/([^"?]+)', t)
    for i, s in enumerate(srcs):
        if s in users and ("cite.js" not in srcs or srcs.index("cite.js") > i): err.append("%s: %s usa DICite pero cite.js no esta cargado antes" % (h.name, s))
import subprocess
if subprocess.run([sys.executable, str(R / "scripts/build-cite-view.py"), "--check"]).returncode: err.append("data/views/license-cite.json desactualizado")
print("JS que citan:", sorted(users))
print("\n".join(err) or "OK")
sys.exit(1 if err else 0)

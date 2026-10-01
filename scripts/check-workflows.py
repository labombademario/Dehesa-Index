#!/usr/bin/env python3
"""Reglas de higiene de los workflows de datos (fallar cerrado). Sale con 1 si se incumple alguna:
 - nada de `|| true` (un fallo no puede silenciarse);
 - nada de `git add -A` / `git add .` (solo se publican rutas explicitas);
 - todo `continue-on-error: true` va con `id:` y el workflow termina con la accion `finish` o un cierre propio que lo comprueba;
 - todo workflow update-*.yml declara un grupo de concurrencia (un solo escritor a la vez);
 - todo workflow que publica ficheros de datos con contrato (schemas/registry.json) los valida antes del commit."""
import json, re, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]; W = ROOT / ".github" / "workflows"
REG = json.loads((ROOT / "schemas" / "registry.json").read_text())["files"]
bad = []
for f in sorted(W.glob("*.yml")):
    t = f.read_text(encoding="utf-8"); d = yaml.safe_load(t); n = f.name
    code = "\n".join(l for l in t.splitlines() if not l.strip().startswith("#"))
    if "|| true" in code: bad.append("%s: contiene '|| true'" % n)
    if re.search(r"git add (-A|\.)(\s|$)", code): bad.append("%s: git add -A/. (rutas explicitas)" % n)
    if n.startswith("update-"):
        if "concurrency" not in d: bad.append("%s: sin concurrency (un solo escritor a la vez por grupo)" % n)  # grupo propio permitido para ejecuciones largas (ams-auctions, nass, drought, ers)
        for jn, j in d["jobs"].items():
            steps = j.get("steps", [])
            coe = [s for s in steps if s.get("continue-on-error")]
            for s in coe:
                if not s.get("id"): bad.append("%s: continue-on-error sin id" % n)
            if coe and not any("finish" in str(s.get("uses", "")) or "steps." in str(s.get("run", "")) for s in steps[-2:]): bad.append("%s: continue-on-error sin cierre que lo compruebe" % n)
            published = set(re.findall(r"data/([A-Za-z0-9_\-./]+\.json)", code))
            need = sorted(p for p in published if p in REG and p not in ("catalog/manifest.json",) and f"data/{p}" in code and re.search(r"git add[^\n]*data/" + re.escape(p), code))
            if need and not ("validate-files" in t or "validate-data.py" in t or "price-engine" in t): bad.append("%s: publica %s sin validar su contrato" % (n, need))
for b in bad: print("ERROR", b)
print("Workflows: %d revisados, %d incumplimientos" % (len(list(W.glob('*.yml'))), len(bad)))
sys.exit(1 if bad else 0)

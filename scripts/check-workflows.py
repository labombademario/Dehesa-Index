#!/usr/bin/env python3
"""Reglas de higiene de los workflows de datos (fallar cerrado). Sale con 1 si se incumple alguna:
 - nada de `|| true` (un fallo no puede silenciarse);
 - nada de `git add -A` / `git add .` (solo se publican rutas explicitas);
 - todo `continue-on-error: true` va con `id:` y el workflow termina con la accion `finish` o un cierre propio que lo comprueba;
 - todo workflow update-*.yml declara un grupo de concurrencia (un solo escritor a la vez);
 - todo workflow que publica ficheros de datos con contrato (schemas/registry.json) los valida antes del commit;
 - todo `apt-get install` va precedido de `apt-get update` (el indice del runner caduca y la instalacion falla: Manitoba, Alberta, 9 oct);
 - todo workflow de datos cuyo script (o los modulos que carga) descarga de mapa.gob.es instala antes la cadena FNMT (scripts/trust-fnmt.sh);
 - ningun workflow de datos publica con `git pull --rebase; git push` sin reintentos: se usa scripts/publish-data.sh o la accion publish."""
import json, re, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]; W = ROOT / ".github" / "workflows"
REG = json.loads((ROOT / "schemas" / "registry.json").read_text())["files"]
bad = []
# Herramientas temporales de diagnostico: no pueden vivir en main (allowlist explicita vacia)
TMP_ALLOW = set()
for f in sorted(W.glob('*')):
    if (f.name.startswith('tmp-') or 'probe' in f.name.lower()) and f.name not in TMP_ALLOW: bad.append('%s: workflow temporal/de sondeo en main (usa una rama research/ o un artifact)' % f.name)
if (ROOT / 'probe').exists(): bad.append('probe/: carpeta de sondeo en main')
_REF = re.compile(r'scripts/([A-Za-z0-9_.\-]+\.(?:py|mjs|js|sh))|"scripts" / "([A-Za-z0-9_.\-]+)"')
def closure(names, seen=None):
    seen = set() if seen is None else seen
    for n in names:
        if n in seen or not (ROOT / "scripts" / n).is_file(): continue
        seen.add(n); closure([a or b for a, b in _REF.findall((ROOT / "scripts" / n).read_text(encoding="utf-8", errors="ignore"))], seen)
    return seen
for f in sorted(W.glob("*.yml")):
    t = f.read_text(encoding="utf-8"); d = yaml.safe_load(t); n = f.name
    code = "\n".join(l for l in t.splitlines() if not l.strip().startswith("#"))
    if "|| true" in code: bad.append("%s: contiene '|| true'" % n)
    if re.search(r"git add (-A|\.)(\s|$)", code): bad.append("%s: git add -A/. (rutas explicitas)" % n)
    if "apt-get install" in code and "apt-get update" not in code: bad.append("%s: apt-get install sin apt-get update antes" % n)
    if n.startswith("update-"):
        runs = "\n".join(str(st.get("run", "")) for j in d["jobs"].values() for st in j.get("steps", []))
        used = closure([a or b for a, b in _REF.findall(runs)])
        if any("mapa.gob.es" in (ROOT / "scripts" / u).read_text(encoding="utf-8", errors="ignore") for u in used if u.startswith("update-")) and "trust-fnmt.sh" not in code:
            bad.append("%s: descarga de mapa.gob.es sin scripts/trust-fnmt.sh (TLS falla con la raiz FNMT G2R)" % n)
        if re.search(r"git push", code) and not re.search(r"for i in", code): bad.append("%s: git push sin reintentos (usar scripts/publish-data.sh)" % n)
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

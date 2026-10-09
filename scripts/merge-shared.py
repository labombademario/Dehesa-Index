#!/usr/bin/env python3
"""Resuelve, durante un `git rebase`, los conflictos en los dos registros que TODOS los workflows de datos tocan:
  data/revisions.json   (lista de revisiones oficiales: se unen las entradas nuevas de ambos lados, sin perder ninguna)
  data/source-status.json (estado por workflow: gana el lado que cambio esa entrada respecto a la base)
Cualquier otro fichero en conflicto NO se toca: el script sale con 1 y quien lo llama aborta el rebase y reintenta.
Uso: python3 scripts/merge-shared.py resolve        # dentro de un rebase con conflictos
     (funciones merge_revisions / merge_status importables para los tests)"""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; CAP = 1500
def _key(e): return json.dumps(e, sort_keys=True, ensure_ascii=False)
def merge_revisions(base, up, ours):
    """base = ancestro comun; up = lo que ya hay en origin/main; ours = nuestro commit. Devuelve el documento unido."""
    seen_base = {_key(e) for e in (base or {}).get("revisions", [])}
    added = [e for e in (ours or {}).get("revisions", []) if _key(e) not in seen_base]
    merged, seen = [], set()
    for e in added + list((up or {}).get("revisions", [])):
        k = _key(e)
        if k not in seen: seen.add(k); merged.append(e)
    merged.sort(key=lambda e: str(e.get("detectedAt", "")), reverse=True)   # estable: mantiene el orden relativo si la fecha coincide
    doc = dict(up or ours or {"schemaVersion": 1}); doc["revisions"] = merged[:CAP]
    doc["generatedAt"] = max(str((up or {}).get("generatedAt", "")), str((ours or {}).get("generatedAt", "")))
    return doc
def merge_status(base, up, ours):
    bw, uw, ow = [(d or {}).get("workflows", {}) for d in (base, up, ours)]
    out = dict(uw)
    for k, v in ow.items():
        if v != bw.get(k): out[k] = v                      # nuestro lado cambio esta entrada: gana
    for k in bw:
        if k not in ow and k in out and uw.get(k) == bw.get(k): del out[k]   # nosotros la borramos y nadie mas la toco
    doc = dict(up or ours or {"schemaVersion": 1}); doc["workflows"] = out
    return doc
HANDLERS = {
    "data/revisions.json": (merge_revisions, lambda d: json.dumps(d, ensure_ascii=False, separators=(",", ":"))),
    "data/source-status.json": (merge_status, lambda d: json.dumps(d, ensure_ascii=False, indent=1, sort_keys=True) + "\n"),
}
def _stage(path, n):
    r = subprocess.run(["git", "show", ":%d:%s" % (n, path)], cwd=ROOT, capture_output=True)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None
def resolve():
    un = subprocess.run(["git", "diff", "--name-only", "--diff-filter=U"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    if not un: return 0
    other = [p for p in un if p not in HANDLERS]
    if other: print("conflicto en ficheros no mezclables:", other); return 1
    for p in un:
        fn, dump = HANDLERS[p]
        doc = fn(_stage(p, 1), _stage(p, 2), _stage(p, 3))   # durante un rebase: :2 = origin (upstream), :3 = nuestro commit
        (ROOT / p).write_text(dump(doc), encoding="utf-8")
        subprocess.run(["git", "add", "--", p], cwd=ROOT, check=True); print("mezclado", p)
    return 0
if __name__ == "__main__" and sys.argv[1:] == ["resolve"]: sys.exit(resolve())

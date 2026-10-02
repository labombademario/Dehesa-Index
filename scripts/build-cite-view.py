#!/usr/bin/env python3
"""data/license-registry.json -> data/views/license-cite.json: version reducida (solo fuentes en uso y los campos que pinta la cita)
para que las paginas no bajen el registro completo (~64 KB) solo para mostrar «Fuente · periodo». Uso: python3 scripts/build-cite-view.py [--check]"""
import json, sys
from pathlib import Path
R = Path(__file__).resolve().parents[1]
F = ["name", "short", "url", "licenseUrl", "licenseName", "licenseId", "attributionText", "verifiedAt", "status", "aliases"]
def build():
    reg = json.loads((R / "data/license-registry.json").read_text(encoding="utf-8"))
    src = {k: {f: s[f] for f in F if s.get(f) not in (None, "", [])} for k, s in reg["sources"].items() if s.get("used")}
    return json.dumps({"sources": src}, ensure_ascii=False, separators=(",", ":")) + "\n"
if __name__ == "__main__":
    out = R / "data/views/license-cite.json"; new = build()
    if "--check" in sys.argv:
        ok = out.exists() and out.read_text(encoding="utf-8") == new
        print("OK" if ok else "license-cite.json desactualizado: python3 scripts/build-cite-view.py"); sys.exit(0 if ok else 1)
    out.write_text(new, encoding="utf-8"); print("escrito", out.name, len(new), "bytes")

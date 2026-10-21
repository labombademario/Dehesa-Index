#!/usr/bin/env python3
"""Glosario de Dehesa (siglas, terminos de precio y del propio sitio) -> data/glosario-{es,en,fr,it}.json.
Contenido propio (definiciones escritas para Dehesa). Lo leen js/glosario.js (explicacion al tocar un termino) y la seccion «Glosario» de metodologia.html.
Fuente unica: scripts/glosario_entries.py. Uso: python3 scripts/build-glosario.py [--check]"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ns = {}; exec((ROOT / "scripts" / "glosario_entries.py").read_text(encoding="utf-8"), ns); E = ns["E"]
NOAUTO = {"serie", "canal"}  # palabras corrientes: salen en el glosario pero no se subrayan solas en las paginas
ids = [e["id"] for e in E]; assert len(ids) == len(set(ids)), "ids repetidos"
bad = 0
for lang in ("es", "en", "fr", "it"):
    rows = [dict({"id": e["id"], "c": e["c"], "t": e["t"][lang], "d": e["d"][lang]}, **({"a": 0} if e["id"] in NOAUTO else {})) for e in E]
    out = json.dumps({"schemaVersion": 1, "lang": lang, "entries": rows}, ensure_ascii=False, separators=(",", ":")) + "\n"
    p = ROOT / "data" / ("glosario-%s.json" % lang)
    if "--check" in sys.argv:
        if not p.exists() or p.read_text(encoding="utf-8") != out: print("DESACTUALIZADO", p.name); bad += 1
    else: p.write_text(out, encoding="utf-8"); print("escrito", p.name, len(out) // 1024, "KB")
sys.exit(1 if bad else 0)

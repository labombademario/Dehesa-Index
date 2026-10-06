#!/usr/bin/env python3
"""Reproducibilidad: reconstruye una serie tal y como Dehesa Index la publicaba en una fecha (el historial de git es el archivo de versiones).
Uso:  python3 scripts/reconstruct-indicator.py ES/es-perc-aceite 2026-07-15 [--file data/spain-stats.json] [--diff]
  - Busca el ultimo commit que toco el fichero con fecha <= la indicada, lee la serie de esa version y la imprime (periodo, valor).
  - --diff compara con la version actual: periodos que han cambiado (revisiones), que han aparecido despues, y que no existian.
Si no se da --file, busca la serie en todos los ficheros de estadisticas por pais. Salida JSON en stdout (con --json) o texto."""
import datetime, json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FILES = ["country-stats", "spain-stats", "france-stats", "germany-stats", "belgium-stats", "austria-stats", "uk-stats", "portugal-stats", "portugal-eurostat-stats", "italy-eurostat-stats", "eurostat-depth-stats", "eu-gapfill-stats", "canada-stats", "us-stats", "australia-trade-stats", "eu-trade-stats", "interest-rates-stats"]
def git(*a): return subprocess.run(["git"] + list(a), cwd=ROOT, capture_output=True, text=True)
def find_series(doc, cc, sid):
    c = doc.get("countries", {}).get(cc)
    if not c: return None
    for s in c["series"]:
        if s["id"] == sid: return s
def main():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]; flags = [x for x in sys.argv[1:] if x.startswith("--")]
    if len(a) < 2: print(__doc__); sys.exit(2)
    key, asof = a[0], a[1]; cc, sid = key.split("/", 1); datetime.date.fromisoformat(asof)
    files = ["data/%s.json" % f for f in FILES]
    if "--file" in sys.argv: files = [sys.argv[sys.argv.index("--file") + 1]]
    for f in files:
        try: cur = json.loads((ROOT / f).read_text())
        except Exception: continue
        now = find_series(cur, cc, sid)
        if not now: continue
        r = git("log", "-1", "--format=%H %cI", "--until=%sT23:59:59Z" % asof, "--", f)
        if not r.stdout.strip(): print("No hay version de %s anterior a %s (el archivo es mas reciente)." % (f, asof)); sys.exit(1)
        h, when = r.stdout.split()
        old = json.loads(git("show", "%s:%s" % (h, f)).stdout); s = find_series(old, cc, sid)
        if not s: print("La serie no existia en la version de %s (%s)." % (when, h[:8])); sys.exit(1)
        out = {"series": key, "asOf": asof, "versionCommit": h, "versionDate": when, "file": f, "label": s["label"], "unit": s["unit"], "latestPeriod": s["latestPeriod"], "points": s["points"]}
        if "--diff" in flags:
            o = dict((p[0], p[1]) for p in s["points"]); n = dict((p[0], p[1]) for p in now["points"])
            out["revised"] = [[k, o[k], n[k]] for k in o if k in n and o[k] is not None and n[k] is not None and abs(o[k] - n[k]) > 1e-9 * max(1, abs(o[k]))]
            out["addedSince"] = [k for k in n if k not in o]; out["removedSince"] = [k for k in o if k not in n]
        if "--json" in flags: print(json.dumps(out, ensure_ascii=False))
        else:
            print("%s (%s)  version del %s, commit %s" % (key, s["label"], when, h[:8]))
            for p in s["points"][-12:]: print("  %s  %s" % (p[0], p[1]))
            if "--diff" in flags: print("  revisados:", out["revised"][:10], "| nuevos desde entonces:", len(out["addedSince"]), "| retirados:", len(out["removedSince"]))
        return
    print("Serie no encontrada:", key); sys.exit(1)
main()

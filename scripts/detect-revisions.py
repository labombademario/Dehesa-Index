#!/usr/bin/env python3
"""Detecta revisiones oficiales: compara cada fichero de estadisticas por pais con su version en HEAD y registra los periodos ya publicados
cuyo valor ha cambiado (id, periodo, valor anterior, valor nuevo, fecha de deteccion) en data/revisions.json (maximo 1500 entradas, las mas recientes).
Uso: python3 scripts/detect-revisions.py data/a.json data/b.json  (ejecutar antes del commit, tras validar). Nunca falla el workflow."""
import datetime, json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / "data" / "revisions.json"; CAP = 1500
def load_old(rel):
    try: return json.loads(subprocess.run(["git", "show", "HEAD:" + rel], cwd=ROOT, capture_output=True, check=True).stdout)
    except Exception: return None
def idx(doc):
    if isinstance(doc.get("observations"), list):   # data/history.json (precios principales): una fila por serie y fecha, id = <serie>:<fecha>
        out = {}
        for o in doc["observations"]:
            sid = str(o.get("id", "")).split(":")[0]; k = "P/%s" % sid
            if k not in out: out[k] = ({"id": sid, "label": "%s (%s)" % (o.get("product"), str(o.get("region", "")).upper()), "unit": "%s/%s" % (o.get("currency"), o.get("unit"))}, {})
            if o.get("observationDate") and isinstance(o.get("value"), (int, float)): out[k][1][o["observationDate"]] = o["value"]
        return out
    return {"%s/%s" % (cc, s["id"]): (s, dict((p[0], p[1]) for p in s.get("points", []))) for cc, c in doc.get("countries", {}).items() for s in c.get("series", [])}
def rescaled(a, b):
    """Correccion de unidad o escala (todos los periodos comunes cambian por el MISMO factor, p. ej. kg -> t): no es una revision oficial
    de la fuente y llenaria el registro (tope 1500) expulsando las revisiones reales. Tambien si cambia la etiqueta de unidad."""
    (sa, pa), (sb, pb) = a, b
    com = [p for p in pb if isinstance(pa.get(p), (int, float)) and isinstance(pb.get(p), (int, float)) and pa[p] != 0 and pb[p] != 0]
    if len(com) < 5: return False
    rs = [pb[p] / pa[p] for p in com]
    same = max(rs) - min(rs) <= 1e-6 * max(abs(r) for r in rs)
    return (same and abs(rs[0] - 1) > 1e-9) or (sa.get("unit") != sb.get("unit") and sum(1 for p in com if pa[p] != pb[p]) >= 0.8 * len(com))
def main():
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    try: doc = json.loads(OUT.read_text())
    except Exception: doc = {"schemaVersion": 1, "generatedAt": now, "revisions": []}
    new = []
    for rel in sys.argv[1:]:
        try:
            cur = json.loads((ROOT / rel).read_text()); old = load_old(rel)
            if not old or ("countries" not in cur and "observations" not in cur): continue
            o, c = idx(old), idx(cur)
            for k, (s, pts) in c.items():
                if k not in o: continue
                if rescaled(o[k], (s, pts)): print("cambio de escala o unidad en", k, "(no se registra como revision)"); continue
                for per, v in pts.items():
                    ov = o[k][1].get(per)
                    if ov is None or v is None or isinstance(v, str): continue
                    if abs(v - ov) > 1e-9 * max(1.0, abs(ov)):
                        new.append({"file": Path(rel).name, "series": k, "label": s.get("label"), "unit": s.get("unit"), "period": per, "old": ov, "new": v, "pct": round((v - ov) / ov * 100, 2) if ov else None, "detectedAt": now})
        except Exception as e: print("revisiones", rel, repr(e)[:100])
    if not new: print("sin revisiones"); return
    doc["revisions"] = (new + doc.get("revisions", []))[:CAP]; doc["generatedAt"] = now
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print("revisiones detectadas:", len(new))
main()

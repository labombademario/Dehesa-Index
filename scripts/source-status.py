#!/usr/bin/env python3
"""Registra en data/source-status.json los cortes del PROVEEDOR (no errores de Dehesa Index).
  python3 scripts/source-status.py mark  <workflow.yml> "motivo"   # la fuente no respondio o dio una respuesta parcial: el ultimo dato valido se conserva
  python3 scripts/source-status.py clear <workflow.yml>            # la fuente volvio a responder
  python3 scripts/source-status.py none  <workflow.yml>            # no hace nada (el script fallo por otra causa)
build-pipeline-status.py lee este fichero y marca el pipeline como 'late' (retrasado) con nota sourceUnavailable en vez de 'error'.
Solo se escribe el fichero si su contenido cambia; en un corte repetido se actualizan 'lastAttempt' y 'consecutive'."""
import datetime, json, sys
from pathlib import Path
P = Path(__file__).resolve().parents[1] / "data" / "source-status.json"
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def main(argv):
    if len(argv) < 2 or argv[0] not in ("mark", "clear", "none"): print(__doc__); return 2
    mode, wf = argv[0], argv[1]; reason = (argv[2] if len(argv) > 2 else "").strip()[:200] or "sin detalle"
    try: doc = json.loads(P.read_text(encoding="utf-8"))
    except Exception: doc = {"schemaVersion": 1, "workflows": {}}
    ws = doc.setdefault("workflows", {}); before = json.dumps(doc, sort_keys=True)
    if mode == "mark":
        e = ws.get(wf) or {"state": "sourceUnavailable", "since": now(), "consecutive": 0}
        e.update(state="sourceUnavailable", lastAttempt=now(), reason=reason, consecutive=int(e.get("consecutive", 0)) + 1); ws[wf] = e
    elif mode == "clear": ws.pop(wf, None)
    if json.dumps(doc, sort_keys=True) != before or (mode != "none" and not P.exists() and ws):
        P.write_text(json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8"); print("source-status:", mode, wf)
    else: print("source-status: sin cambios")
    return 0
if __name__ == "__main__": sys.exit(main(sys.argv[1:]))

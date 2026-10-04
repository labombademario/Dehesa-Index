#!/usr/bin/env python3
"""Alerta cuando el estado global esta en rojo: abre (o actualiza) un issue de GitHub con etiqueta `estado-rojo` y lo cierra al volver a verde.
GitHub avisa por correo al titular del repositorio al abrir el issue; no hace falta ningun secreto ni servicio externo.
Lee data/pipeline-status.json. Necesita GITHUB_TOKEN con permiso issues: write. Nunca falla el workflow por un error de red (sale 0)."""
import datetime, json, os, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "labombademario/Dehesa-Index"); TOKEN = os.environ.get("GITHUB_TOKEN", "")
LABEL = "estado-rojo"
def api(method, path, body=None):
    rq = urllib.request.Request("https://api.github.com/repos/%s/%s" % (REPO, path), method=method, data=json.dumps(body).encode() if body is not None else None,
                                headers={"Authorization": "Bearer " + TOKEN, "Accept": "application/vnd.github+json", "User-Agent": "dehesa-alert", "Content-Type": "application/json"})
    with urllib.request.urlopen(rq, timeout=30) as r: return json.load(r) if r.status != 204 else None
def problems(P):
    out = []
    d = P.get("deploy") or {}
    if d.get("status") == "error":
        b = d.get("build") or {}
        out.append("- **Despliegue (Cloudflare)**: " + ("el build del commit %s acabo en `%s`" % (b.get("sha"), b.get("conclusion")) if b.get("conclusion") == "failure" else "lo servido va %s h por detras del repositorio" % d.get("lagHours")) + (" ([ver build](%s))" % b["url"] if b.get("url") else "") + ". Mientras tanto la web sirve una version antigua.")
    for p in P.get("pipelines", []):
        if p.get("status") == "error":
            l = p.get("last") or {}
            out.append("- **%s**: %s%s" % (p.get("name"), "la ultima ejecucion fallo" if (l.get("conclusion") == "failure") else "datos invalidos", " ([ver ejecucion](%s))" % l["url"] if l.get("url") else ""))
    return out
def main():
    if not TOKEN: print("sin token"); return 0
    P = json.loads((ROOT / "data" / "pipeline-status.json").read_text())
    probs = problems(P); now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    try:
        open_issues = api("GET", "issues?state=open&labels=%s&per_page=5" % LABEL) or []
        if probs:
            body = "Estado en rojo a las %s (`data/pipeline-status.json`).\n\n%s\n\nPagina de estado: https://dehesaindex.com/status.html\n\nEste issue lo abre y cierra solo el workflow *Update pipeline status*; se cierra cuando todo vuelve a verde." % (now, "\n".join(probs))
            if open_issues:
                it = open_issues[0]
                if (it.get("body") or "").split("\n\n", 1)[-1] != body.split("\n\n", 1)[-1]: api("POST", "issues/%d/comments" % it["number"], {"body": "Sigue en rojo a las %s:\n\n%s" % (now, "\n".join(probs))}); print("issue actualizado", it["number"])
                else: print("issue abierto sin cambios", it["number"])
            else:
                it = api("POST", "issues", {"title": "Estado en rojo: %d problema(s)" % len(probs), "body": body, "labels": [LABEL]}); print("issue abierto", it["number"])
        else:
            for it in open_issues:
                api("POST", "issues/%d/comments" % it["number"], {"body": "Todo en verde a las %s. Se cierra." % now}); api("PATCH", "issues/%d" % it["number"], {"state": "closed"}); print("issue cerrado", it["number"])
            if not open_issues: print("todo en verde, nada que avisar")
    except Exception as e: print("alerta: error de red o permisos:", repr(e)[:160])
    return 0
if __name__ == "__main__": sys.exit(main())

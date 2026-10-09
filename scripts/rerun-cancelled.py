#!/usr/bin/env python3
"""Vigilante de ejecuciones canceladas. GitHub cancela una ejecucion EN COLA cuando entra otra del mismo grupo de concurrencia (solo cabe una en espera);
esa ejecucion nunca llega a arrancar y el dato se queda sin actualizar. Este script detecta, para cada workflow de datos, que su ULTIMA ejecucion
termino cancelada SIN haber ejecutado ni un job (cancelacion por cola, no un fallo ni una cancelacion a mitad) y la vuelve a lanzar.
Salvaguardas: maximo MAX_PER_RUN relanzamientos por pasada, maximo MAX_PER_DAY por workflow y dia, y nada si ya hay una ejecucion suya en curso.
Uso: GH_TOKEN=... python3 scripts/rerun-cancelled.py [--dry-run]   (repo por GITHUB_REPOSITORY)"""
import datetime, json, os, subprocess, sys
MAX_PER_RUN, MAX_PER_DAY, WINDOW_H = 4, 3, 30
def parse(ts): return datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
def decide(runs, jobs_of, now):
    """runs: lista de ejecuciones (dict de la API, mas recientes primero). jobs_of(run_id) -> n.º de jobs. Devuelve los path de workflow a relanzar."""
    by = {}
    for r in runs:
        if not str(r.get("path", "")).split("/")[-1].startswith("update-"): continue
        by.setdefault(r["path"], []).append(r)
    out = []
    for path, rs in sorted(by.items()):
        rs.sort(key=lambda r: r["created_at"], reverse=True)
        if any(r["status"] != "completed" for r in rs): continue                    # ya hay una en curso o en cola
        last = rs[0]
        if last["conclusion"] != "cancelled": continue
        if now - parse(last["created_at"]) > datetime.timedelta(hours=WINDOW_H): continue   # demasiado vieja: la proxima programada la cubre
        if jobs_of(last["id"]) != 0: continue                                       # llego a ejecutar algo: no es cancelacion de cola
        since = now - datetime.timedelta(hours=24)
        if sum(1 for r in rs if r["event"] == "workflow_dispatch" and parse(r["created_at"]) > since and r["actor"]["login"].endswith("[bot]")) >= MAX_PER_DAY: continue
        out.append(path)
    return out[:MAX_PER_RUN]
def gh(*a):
    r = subprocess.run(["gh", "api", *a], capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr
def main():
    repo = os.environ["GITHUB_REPOSITORY"]; dry = "--dry-run" in sys.argv
    runs = []
    for page in (1, 2, 3):
        rc, out, err = gh("repos/%s/actions/runs?per_page=100&page=%d" % (repo, page))
        if rc: print("::error::no se pudo listar ejecuciones:", err[:200]); sys.exit(1)
        runs += json.loads(out)["workflow_runs"]
    def jobs_of(i):
        rc, out, err = gh("repos/%s/actions/runs/%d/jobs" % (repo, i))
        return json.loads(out).get("total_count", 1) if rc == 0 else 1             # ante la duda, no relanzar
    todo = decide(runs, jobs_of, datetime.datetime.now(datetime.timezone.utc))
    print("a relanzar:", [p.split("/")[-1] for p in todo] or "nada")
    bad = 0
    for p in todo:
        if dry: continue
        rc, out, err = gh("-X", "POST", "repos/%s/actions/workflows/%s/dispatches" % (repo, p.split("/")[-1]), "-f", "ref=main")
        print(("relanzado " if rc == 0 else "FALLO al relanzar ") + p.split("/")[-1], err[:150]); bad += rc != 0
    sys.exit(1 if bad else 0)
if __name__ == "__main__": main()

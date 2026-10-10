#!/usr/bin/env python3
"""Lanzador por calendario: dispara los workflows de datos de EE. UU. justo despues de cada publicacion oficial de USDA,
en vez de esperar a su cron semanal. Lee data/usda-calendar.json (fechas y horas oficiales, hora de Nueva York).
Para cada informe de hoy o de ayer con hora, y cada intento de OFFSETS (p. ej. +40 min y +4 h, porque Quick Stats a veces tarda en cargar),
lanza los workflows de MAP si ya paso ese momento y no hay ninguna ejecucion suya creada despues de el (ni en curso).
Ademas FOLLOW: cuando un workflow "lider" termina bien, lanza los que construyen a partir de sus ficheros (us-stats tras NASS).
Uso: GH_TOKEN=... python3 scripts/release-dispatch.py [--dry-run]   (repo por GITHUB_REPOSITORY)"""
import datetime, json, os, subprocess, sys
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT = Path(__file__).resolve().parents[1]; NY = ZoneInfo("America/New_York"); UTC = datetime.timezone.utc
NASS = "update-nass.yml"
MAP = {   # id del informe en el calendario -> workflows que leen esos datos
    "wasde": ["update-usda-psd.yml"],
    "cattle-on-feed": ["update-cattle-on-feed.yml", NASS],
    "crop-progress": ["update-crop-progress.yml"],
    "agricultural-prices": [NASS, "update-nass-data.yml"],
    "milk-production": [NASS], "cold-storage": [NASS], "dairy-products": [NASS], "hogs-and-pigs": [NASS],
    "livestock-slaughter": [NASS], "chickens-and-eggs": [NASS], "crop-production": [NASS], "grain-stocks": [NASS],
    "rice-stocks": [NASS], "small-grains-summary": [NASS],
}
FOLLOW = {"update-us-stats.yml": [NASS]}   # seguidor -> lideres
OFFSETS = [datetime.timedelta(minutes=40), datetime.timedelta(hours=4)]
WINDOW = datetime.timedelta(hours=6)       # un intento que no se pudo lanzar en 6 h se da por perdido (lo cubre el cron)
MAX_PER_RUN = 6
def parse(ts): return datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
def release_utc(r):
    h, m = map(int, r["time"].split(":"))
    d = datetime.date.fromisoformat(r["date"])
    return datetime.datetime(d.year, d.month, d.day, h, m, tzinfo=NY).astimezone(UTC)
def due(releases, now):
    """[(workflow, momento_del_intento, informe)] que ya toca lanzar (sin mirar aun las ejecuciones)."""
    out = []
    for r in releases:
        if r.get("id") not in MAP or not r.get("time"): continue
        t0 = release_utc(r)
        for off in OFFSETS:
            t = t0 + off
            if t <= now < t + WINDOW:
                for w in MAP[r["id"]]: out.append((w, t, r["id"]))
    return out
def decide(releases, runs, now):
    """runs: ejecuciones de la API. Devuelve [(workflow, motivo)] a lanzar, sin repetir workflow."""
    by = {}
    for x in runs: by.setdefault(str(x.get("path", "")).split("/")[-1], []).append(x)
    busy = lambda w: any(x["status"] != "completed" for x in by.get(w, []))
    since = lambda w, t: any(parse(x["created_at"]) >= t for x in by.get(w, []))
    todo, seen = [], set()
    for w, t, rid in sorted(due(releases, now), key=lambda e: e[1]):
        if w in seen or busy(w) or since(w, t): continue
        seen.add(w); todo.append((w, "%s (%s)" % (rid, t.strftime("%H:%M UTC"))))
    for f, leaders in FOLLOW.items():
        if f in seen or busy(f): continue
        ok = [parse(x["updated_at"]) for l in leaders for x in by.get(l, []) if x["status"] == "completed" and x["conclusion"] == "success" and now - parse(x["updated_at"]) < datetime.timedelta(hours=24)]
        if not ok: continue
        last_f = max([parse(x["created_at"]) for x in by.get(f, [])] or [datetime.datetime.min.replace(tzinfo=UTC)])
        if max(ok) > last_f: seen.add(f); todo.append((f, "tras " + "/".join(leaders)))
    return todo[:MAX_PER_RUN]
def gh(*a):
    r = subprocess.run(["gh", "api", *a], capture_output=True, text=True); return r.returncode, r.stdout, r.stderr
def main():
    repo = os.environ["GITHUB_REPOSITORY"]; dry = "--dry-run" in sys.argv; now = datetime.datetime.now(UTC)
    cal = json.loads((ROOT / "data" / "usda-calendar.json").read_text(encoding="utf-8"))
    if now - parse(cal["generatedAt"]) > datetime.timedelta(days=8): print("::warning::el calendario USDA tiene mas de 8 dias (update-usda-calendar no esta actualizando)")
    runs = []
    for page in range(1, 11):   # ~300 ejecuciones al dia: se pagina hasta cubrir las ultimas 30 h
        rc, out, err = gh("repos/%s/actions/runs?per_page=100&page=%d&created=>%s" % (repo, page, (now - datetime.timedelta(hours=30)).strftime("%Y-%m-%dT%H:%M:%SZ")))
        if rc: print("::error::no se pudo listar ejecuciones:", err[:200]); sys.exit(1)
        got = json.loads(out)["workflow_runs"]; runs += got
        if len(got) < 100: break
    else: print("::error::demasiadas ejecuciones para revisar"); sys.exit(1)
    todo = decide(cal["releases"], runs, now)
    print("a lanzar:", todo or "nada"); bad = 0
    for w, why in todo:
        if dry: continue
        rc, o, e = gh("-X", "POST", "repos/%s/actions/workflows/%s/dispatches" % (repo, w), "-f", "ref=main")
        print(("lanzado " if rc == 0 else "FALLO al lanzar ") + w + " por " + why, e[:150]); bad += rc != 0
    sys.exit(1 if bad else 0)
if __name__ == "__main__": main()

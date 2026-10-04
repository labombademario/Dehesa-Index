#!/usr/bin/env python3
"""Observabilidad de pipelines: escribe data/pipeline-status.json con, por cada workflow de datos: cron, proxima ejecucion estimada, ultima ejecucion
(resultado, inicio, duracion, enlace), tasa de exito de las ultimas 10, ficheros de datos que escribe (con fecha del ultimo cambio real en main,
numero de series/puntos/lineas leido de data/data-quality.json) y un estado global (ok / retraso / error).
Usa la API de GitHub con GITHUB_TOKEN (en local sin token solo rellena cron y ficheros). Nunca falla el workflow por un error de red."""
import datetime, json, os, re, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REPO = os.environ.get("GITHUB_REPOSITORY", "labombademario/Dehesa-Index"); TOKEN = os.environ.get("GITHUB_TOKEN", "")
NOW = datetime.datetime.utcnow().replace(second=0, microsecond=0)
def api(path):
    if not TOKEN: return None
    try:
        rq = urllib.request.Request("https://api.github.com/repos/%s/%s" % (REPO, path), headers={"Authorization": "Bearer " + TOKEN, "Accept": "application/vnd.github+json", "User-Agent": "dehesa-status"})
        with urllib.request.urlopen(rq, timeout=30) as r: return json.load(r)
    except Exception as e: print("api", path[:60], repr(e)[:80]); return None
def parse_field(f, lo, hi):
    out = set()
    for part in f.split(","):
        step = 1
        if "/" in part: part, st = part.split("/"); step = int(st)
        if part == "*": a, b = lo, hi
        elif "-" in part: a, b = map(int, part.split("-"))
        else: a = int(part); b = hi if step > 1 else a
        out.update(range(a, b + 1, step))
    return out
def next_run(cron, after):
    try: mi, ho, dom, mo, dow = cron.split()
    except ValueError: return None
    M, H, D, MO = parse_field(mi, 0, 59), parse_field(ho, 0, 23), parse_field(dom, 1, 31), parse_field(mo, 1, 12)
    W = {x % 7 for x in parse_field(dow, 0, 7)}
    t = after + datetime.timedelta(minutes=1)
    for _ in range(60 * 24 * 400):
        wd = (t.weekday() + 1) % 7
        dom_ok = t.day in D; dow_ok = wd in W
        day_ok = (dom_ok and dow_ok) if (dom == "*" or dow == "*") else (dom_ok or dow_ok)
        if t.month in MO and day_ok and t.hour in H and t.minute in M: return t
        t += datetime.timedelta(minutes=1)
    return None
def expected_gap_h(crons):
    ts = []; t = NOW
    for c in crons:
        x = next_run(c, t)
        if x: ts.append(x)
    if not ts: return None
    ts.sort(); all_ = []
    for c in crons:
        x = next_run(c, NOW)
        for _ in range(4):
            if not x: break
            all_.append(x); x = next_run(c, x)
    all_.sort()
    gaps = [(b - a).total_seconds() / 3600 for a, b in zip(all_, all_[1:])]
    return max(gaps) if gaps else None
def is_late(crons, last_start):
    """Retraso real: se compara AHORA con la siguiente ejecucion que tocaba despues de la ultima (segun el cron, con fines de semana y dias laborables),
    mas una tolerancia (la mayor entre 12 h y un intervalo entero), porque GitHub retrasa o salta ejecuciones programadas."""
    exp = [next_run(c, last_start) for c in crons]; exp = [x for x in exp if x]
    if not exp: return False
    e = min(exp)
    nxt = [next_run(c, e) for c in crons]; nxt = [x for x in nxt if x]
    interval = (min(nxt) - e).total_seconds() / 3600 if nxt else 24
    return NOW > e + datetime.timedelta(hours=max(12, interval))
SITE = "https://dehesaindex.com"
def fetch_json(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "dehesa-status", "Cache-Control": "no-cache"}), timeout=30) as r: return json.load(r)
    except Exception as e: print("fetch", url[:60], repr(e)[:80]); return None
def check_deploy():
    """Vigila que lo que sirve dehesaindex.com sea lo que hay en main: (1) el check 'Workers Builds' de Cloudflare del ultimo commit con resultado
    (si falla, el sitio se queda congelado aunque GitHub este verde); (2) desfase entre el news-status.json servido y el del repo (se reescribe cada 3 h).
    Sin red o sin token queda 'unknown'; nunca inventa un estado."""
    out = {"status": "unknown", "site": SITE, "build": None, "lagHours": None, "prodGeneratedAt": None, "repoGeneratedAt": None}
    try:
        import subprocess
        shas = subprocess.run(["git", "log", "--format=%H", "-8"], capture_output=True, text=True, cwd=str(ROOT)).stdout.split()
    except Exception: shas = []
    for sha in shas:
        cr = api("commits/%s/check-runs" % sha)
        if not cr: break
        runs = [c for c in cr.get("check_runs", []) if str(c.get("name", "")).startswith("Workers Builds")]
        done = [c for c in runs if c.get("status") == "completed"]
        if done:
            c = done[0]; out["build"] = {"sha": sha[:8], "conclusion": c.get("conclusion"), "url": c.get("details_url") or c.get("html_url"), "completedAt": c.get("completed_at")}; break
        if runs: continue  # en curso: mirar el commit anterior
    try:
        rep = json.loads((ROOT / "data" / "news-status.json").read_text()).get("generatedAt")
        out["repoGeneratedAt"] = rep
        prod = fetch_json(SITE + "/data/news-status.json?t=" + NOW.strftime("%Y%m%d%H%M"))
        pg = prod.get("generatedAt") if prod else None; out["prodGeneratedAt"] = pg
        if rep and pg: out["lagHours"] = round(max(0.0, (pdate(rep) - pdate(pg)).total_seconds() / 3600), 1)
    except Exception as e: print("deploy lag", repr(e)[:80])
    b = out["build"]
    if (b and b["conclusion"] == "failure") or (out["lagHours"] is not None and out["lagHours"] > 6): out["status"] = "error"
    elif (b and b["conclusion"] == "success") or out["lagHours"] is not None: out["status"] = "ok"
    return out
def iso(d): return d.strftime("%Y-%m-%dT%H:%M:%SZ") if d else None
def pdate(s): return datetime.datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S") if s else None
def main():
    dq = {}
    try: dq = {f["file"]: f for f in json.loads((ROOT / "data" / "data-quality.json").read_text())["files"]}
    except Exception: pass
    out = []; changed_cache = {}
    for wf in sorted((ROOT / ".github" / "workflows").glob("update-*.yml")):
        s = wf.read_text(encoding="utf-8")
        name = (re.search(r"^name:\s*(.+)$", s, re.M) or [None, wf.stem])[1].strip().strip("'\"")
        crons = re.findall(r"cron:\s*['\"]([^'\"]+)['\"]", s)
        files = []
        for a in re.findall(r"git add ([^\n]+)", s):
            for t in a.split():
                t = t.rstrip(";")
                if t.startswith("data/") and not t.endswith("-log.txt") and "*" not in t and t not in files: files.append(t)
        if "git add -A data/" in s and not files: files = ["data/"]
        nxt = [next_run(c, NOW) for c in crons]; nxt = [x for x in nxt if x]
        item = {"workflow": wf.name, "name": name, "crons": crons, "nextRun": iso(min(nxt)) if nxt else None, "files": [], "last": None, "recent": None, "status": "unknown"}
        gap = expected_gap_h(crons) if crons else None
        item["expectedEveryHours"] = round(gap, 1) if gap else None
        for f in files:
            e = {"path": f}; q = dq.get(Path(f).name)
            if q: e.update(valid=q["status"], series=q["stats"].get("series"), points=q["stats"].get("points"), lines=q["stats"].get("lines"))
            if f.endswith(".json"):
                if f not in changed_cache:
                    c = api("commits?per_page=1&path=" + f); changed_cache[f] = pdate(c[0]["commit"]["committer"]["date"]) if c else None
                if changed_cache[f]: e["lastChange"] = iso(changed_cache[f])
            item["files"].append(e)
        runs = api("actions/workflows/%s/runs?per_page=10&exclude_pull_requests=true" % wf.name)
        if runs and runs.get("workflow_runs"):
            rr = [r for r in runs["workflow_runs"] if r.get("status") == "completed"]
            if rr:
                r = rr[0]; st = pdate(r.get("run_started_at")); en = pdate(r.get("updated_at"))
                item["last"] = {"conclusion": r.get("conclusion"), "event": r.get("event"), "startedAt": iso(st), "durationSec": int((en - st).total_seconds()) if st and en else None, "url": r.get("html_url")}
                ok = sum(1 for x in rr if x.get("conclusion") == "success")
                item["recent"] = {"runs": len(rr), "success": ok, "failed": sum(1 for x in rr if x.get("conclusion") == "failure")}
                # Una ejecucion cancelada (la cola de concurrencia descarta la pendiente cuando entra otra) NO es un exito: el retraso se mide desde
                # la ultima ejecucion que si termino bien; si no hay ninguna reciente, queda en retraso y se ve.
                good = [x for x in rr if x.get("conclusion") == "success"]; gst = pdate(good[0].get("run_started_at")) if good else None
                if r.get("conclusion") == "failure": item["status"] = "error"
                elif r.get("conclusion") == "cancelled" and (not gst or (crons and is_late(crons, gst))): item["status"] = "late"; item["last"]["note"] = "cancelled"
                elif crons and st and is_late(crons, gst or st): item["status"] = "late"
                else: item["status"] = "ok"
        # NOT_RUN_YET: la API respondio y el workflow no tiene ninguna ejecucion (distinto de "unknown": no hemos podido consultarlo)
        if runs is not None and not runs.get("workflow_runs"): item["status"] = "not_run"
        if any(f.get("valid") == "error" for f in item["files"]): item["status"] = "error"
        out.append(item)
    cnt = {k: sum(1 for i in out if i["status"] == k) for k in ("ok", "late", "error", "not_run", "unknown")}
    dep = check_deploy()
    doc = {"schemaVersion": 1, "generatedAt": iso(NOW), "repo": REPO, "summary": cnt, "global": "error" if (cnt["error"] or dep["status"] == "error") else ("late" if cnt["late"] else ("ok" if cnt["ok"] else "unknown")), "deploy": dep, "pipelines": out}
    (ROOT / "data" / "pipeline-status.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1))
    print("pipelines", len(out), cnt, "deploy", dep["status"], dep.get("lagHours"), (dep.get("build") or {}).get("conclusion"))
main()

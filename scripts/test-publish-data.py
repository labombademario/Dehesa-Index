#!/usr/bin/env python3
"""Test sin red del publicador de datos: N clones de un repo remoto local publican A LA VEZ, cada uno su fichero y una entrada nueva en
data/revisions.json y en data/source-status.json. Debe llegar todo a main, sin perder ninguna revision ni estado, y un conflicto en un
fichero NO mezclable debe fallar en rojo (no pisar datos)."""
import json, os, shutil, subprocess, sys, tempfile, threading
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def sh(*a, cwd=None, check=True, env=None):
    r = subprocess.run(a, cwd=cwd, capture_output=True, text=True, env=env)
    if check and r.returncode: raise SystemExit("FALLO %s\n%s%s" % (a, r.stdout, r.stderr))
    return r
def seed(tmp):
    bare = tmp / "origin.git"; sh("git", "init", "-q", "--bare", "-b", "main", str(bare))
    w = tmp / "seed"; sh("git", "clone", "-q", str(bare), str(w)); (w / "data").mkdir(); (w / "scripts").mkdir()
    for f in ("merge-shared.py", "publish-data.sh"): shutil.copy(ROOT / "scripts" / f, w / "scripts" / f)
    (w / "data/revisions.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": "2026-01-01T00:00:00Z", "revisions": [{"series": "base", "detectedAt": "2026-01-01T00:00:00Z"}]}, separators=(",", ":")))
    (w / "data/source-status.json").write_text(json.dumps({"schemaVersion": 1, "workflows": {"update-base.yml": {"state": "ok"}}}, indent=1, sort_keys=True) + "\n")
    (w / "data/shared-plain.json").write_text("{}\n")
    sh("git", "add", ".", cwd=w); sh("git", "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "seed", cwd=w); sh("git", "branch", "-M", "main", cwd=w); sh("git", "push", "-q", "origin", "main", cwd=w)
    return bare
def worker(i, tmp, bare, errs, plain=False):
    w = tmp / ("w%d" % i)
    if not w.exists(): sh("git", "clone", "-q", str(bare), str(w))
    d = json.loads((w / "data/revisions.json").read_text()); d["revisions"].insert(0, {"series": "s%d" % i, "detectedAt": "2026-02-0%dT00:00:00Z" % (i + 1)}); d["generatedAt"] = "2026-02-0%dT00:00:00Z" % (i + 1)
    (w / "data/revisions.json").write_text(json.dumps(d, separators=(",", ":")))
    s = json.loads((w / "data/source-status.json").read_text()); s["workflows"]["update-w%d.yml" % i] = {"state": "sourceUnavailable"}
    (w / "data/source-status.json").write_text(json.dumps(s, indent=1, sort_keys=True) + "\n")
    (w / ("data/own%d.json" % i)).write_text('{"i":%d}\n' % i)
    paths = ["data/revisions.json", "data/source-status.json", "data/own%d.json" % i]
    if plain: (w / "data/shared-plain.json").write_text('{"w":%d}\n' % i); paths.append("data/shared-plain.json")
    env = dict(os.environ, PUBLISH_SLEEP_DIV="8", GIT_AUTHOR_NAME="t", GIT_COMMITTER_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_EMAIL="t@t")
    r = sh("bash", "scripts/publish-data.sh", "w%d" % i, *paths, cwd=w, check=False, env=env); errs[i] = r.returncode
def worker_derived(i, tmp, bare, errs):
    """Dos clones que parten del mismo estado reescriben un fichero DERIVADO (data/derived.txt = lista de data/own*.json): con PUBLISH_REGEN el
    choque se resuelve regenerando sobre lo ultimo de origin/main, sin perder el own de nadie."""
    w = tmp / ("w%d" % i)
    (w / ("data/own%d.json" % i)).write_text('{"i":%d}\n' % i)
    (w / "data/derived.txt").write_text("solo own%d\n" % i)
    regen = "ls data/own*.json | sort > data/derived.txt"
    env = dict(os.environ, PUBLISH_SLEEP_DIV="8", GIT_AUTHOR_NAME="t", GIT_COMMITTER_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_EMAIL="t@t", PUBLISH_DERIVED="data/derived.txt", PUBLISH_REGEN=regen)
    r = sh("bash", "scripts/publish-data.sh", "d%d" % i, "data/own%d.json" % i, "data/derived.txt", cwd=w, check=False, env=env); errs[i] = r.returncode
def main():
    tmp = Path(tempfile.mkdtemp()); N = 5
    try:
        bare = seed(tmp); errs = {}
        ts = [threading.Thread(target=worker, args=(i, tmp, bare, errs)) for i in range(N)]
        [t.start() for t in ts]; [t.join() for t in ts]
        assert all(v == 0 for v in errs.values()), "publicacion fallida: %s" % errs
        chk = tmp / "chk"; sh("git", "clone", "-q", str(bare), str(chk))
        rev = json.loads((chk / "data/revisions.json").read_text())["revisions"]; got = sorted(e["series"] for e in rev)
        assert got == sorted(["base"] + ["s%d" % i for i in range(N)]), "revisiones perdidas: %s" % got
        assert [e["detectedAt"] for e in rev] == sorted((e["detectedAt"] for e in rev), reverse=True), "revisiones sin ordenar"
        st = json.loads((chk / "data/source-status.json").read_text())["workflows"]
        assert sorted(st) == sorted(["update-base.yml"] + ["update-w%d.yml" % i for i in range(N)]), "estados perdidos: %s" % sorted(st)
        for i in range(N): assert (chk / ("data/own%d.json" % i)).exists(), "falta own%d" % i
        # conflicto en un fichero NO mezclable: el segundo debe fallar en rojo y NO pisar al primero
        errs2 = {}
        for i in (10, 11): sh("git", "clone", "-q", str(bare), str(tmp / ("w%d" % i)))   # ambos parten del mismo estado: el segundo choca de verdad
        a = threading.Thread(target=worker, args=(10, tmp, bare, errs2, True)); a.start(); a.join()
        b = threading.Thread(target=worker, args=(11, tmp, bare, errs2, True)); b.start(); b.join()
        assert errs2[10] == 0 and errs2[11] != 0, "el conflicto real debia fallar en rojo: %s" % errs2
        sh("git", "pull", "-q", cwd=chk); assert json.loads((chk / "data/shared-plain.json").read_text()) == {"w": 10}, "se pisaron datos"
        errs3 = {}
        for i in (20, 21): sh("git", "clone", "-q", str(bare), str(tmp / ("w%d" % i)))
        worker_derived(20, tmp, bare, errs3)
        worker_derived(21, tmp, bare, errs3)
        assert errs3[20] == 0 and errs3[21] == 0, "el conflicto en un derivado debia resolverse regenerando: %s" % errs3
        sh("git", "pull", "-q", cwd=chk); der = (chk / "data/derived.txt").read_text().split()
        assert "data/own20.json" in der and "data/own21.json" in der, "derivado no regenerado: %s" % der
        print("test-publish-data OK: %d publicaciones simultaneas sin perdidas; conflicto real falla en rojo" % N)
    finally: shutil.rmtree(tmp, ignore_errors=True)
main()

#!/usr/bin/env python3
"""Guarda de publicacion: una serie al dia que no llega se repone; una vieja se deja ir; nada se inventa. Caso real del 21-oct-2026 incluido. Sin red."""
import json, sys, datetime, importlib.util, subprocess
from pathlib import Path
H = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("g", H / "guard-series-loss.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
fail = 0
def ok(m, c):
    global fail
    if not c: fail += 1; print("FALLA", m)
T = datetime.date(2026, 10, 21)
ok("anual 2026 al dia", G.fresh("2026", T)); ok("anual 2024 al dia (margen de 2 anos)", G.fresh("2024", T)); ok("anual 2019 viejo", not G.fresh("2019", T))
ok("mensual 2026-03 al dia", G.fresh("2026-03", T)); ok("mensual 2025-08 viejo", not G.fresh("2025-08", T)); ok("campana 2026/27 al dia", G.fresh("2026/27", T))
ok("trimestral 2026-Q2 al dia", G.fresh("2026-Q2", T)); ok("diario 2026-10-01 al dia", G.fresh("2026-10-01", T)); ok("vacio no cuenta", not G.fresh("", T))
S = lambda i, d: {"id": i, "points": [[d, 1.0]]}
old = {"countries": {"EU": {"name": "EU", "series": [S("a", "2026"), S("viejo", "2019"), S("b", "2026-09")]}, "NL": {"name": "NL", "series": [S("c", "2026")]}}, "log": []}
new = {"countries": {"EU": {"name": "EU", "series": [S("b", "2026-10")]}}, "log": []}
fx, back, gone = G.guard(json.loads(json.dumps(old)), new, T)
ids = sorted(s["id"] for c in fx["countries"].values() for s in c["series"])
ok("repone las al dia (a, y c con su pais)", ids == ["a", "b", "c"] and fx["countries"]["NL"]["name"] == "NL")
ok("la vieja se deja ir", gone == ["viejo"] and "viejo" not in ids)
ok("lo que llego no se toca (b con su dato nuevo)", [s for s in fx["countries"]["EU"]["series"] if s["id"] == "b"][0]["points"][0][0] == "2026-10")
ok("queda anotado en el log", sum("REPUESTA" in l for l in fx["log"]) == 2)
fx2, back2, _ = G.guard(json.loads(json.dumps(old)), json.loads(json.dumps(old)), T); ok("sin cambios no hace nada", not back2)
# caso real: eu-production-stats antes y despues del 404 de azucar (commit f355334d0)
try:
    a = json.loads(subprocess.check_output(["git", "show", "f355334d0^:data/eu-production-stats.json"], cwd=H.parent, stderr=subprocess.DEVNULL))
    b = json.loads(subprocess.check_output(["git", "show", "f355334d0:data/eu-production-stats.json"], cwd=H.parent, stderr=subprocess.DEVNULL))
    _, br, _ = G.guard(a, b, T); ok("caso real 21-oct: repone las 9 series de azucar", sorted(x[1] for x in br) == sorted("eu-prod-eu-sugar-region-%d-%s" % (r, m) for r in (1, 2, 3) for m in ("area", "production", "yield")))
except subprocess.CalledProcessError:
    print("aviso: sin historial git suficiente para el caso real (checkout superficial)")
# renombrados: mismo pais, mismos datos (o casi, por revisiones) con id nuevo -> no es una perdida
o2 = {"countries": {"US": {"series": [{"id": "x-area", "points": [["2022", 1.0], ["2023", 2.0], ["2024", 3.0], ["2025", 4.0], ["2026", 5.0]]}, {"id": "y", "points": [["2024", 9.0], ["2025", 9.0], ["2026", 9.0]]}]}}}
n2 = {"countries": {"US": {"series": [{"id": "x-area-acres", "points": [["2022", 1.0], ["2023", 2.0], ["2024", 3.0], ["2025", 4.0], ["2026", 5.5]]}, {"id": "z", "points": [["2024", 1.0], ["2025", 2.0], ["2026", 3.0]]}]}}}
ok("renombrado detectado aunque se revise el ultimo dato", G.find_renames(o2, n2) == {"x-area": "x-area-acres"})
ok("una serie distinta no se toma por renombrado", "y" not in G.find_renames(o2, n2))
try:
    a = json.loads(subprocess.check_output(["git", "show", "47dd7f838^:data/us-nass-extra-stats.json"], cwd=H.parent, stderr=subprocess.DEVNULL)); b = json.loads(subprocess.check_output(["git", "show", "47dd7f838:data/us-nass-extra-stats.json"], cwd=H.parent, stderr=subprocess.DEVNULL))
    r = G.find_renames(a, b); ok("caso real 9-oct (NASS): 41 renombrados con sufijo -acres", len(r) == 41 and all(v == k + "-acres" for k, v in r.items()))
except subprocess.CalledProcessError:
    print("aviso: sin historial git suficiente para el caso NASS")
# de punta a punta en un repo temporal: fichero preparado, reposicion, re-stage y lista de retiradas
import tempfile, os
with tempfile.TemporaryDirectory() as d:
    run = lambda *a: subprocess.run(a, cwd=d, check=True, capture_output=True)
    run("git", "init", "-q"); run("git", "config", "user.email", "t@t"); run("git", "config", "user.name", "t"); os.makedirs(d + "/data"); os.makedirs(d + "/scripts")
    Y = str(datetime.date.today().year)
    doc = {"countries": {"EU": {"series": [S("x", Y), S("y", Y), S("z", Y)]}}, "log": []}
    open(d + "/data/f.json", "w").write(json.dumps(doc, separators=(",", ":"))); open(d + "/scripts/series-retired.json", "w").write(json.dumps({"ids": ["z"]})); run("git", "add", "-A"); run("git", "commit", "-qm", "a")
    open(d + "/data/f-log.txt", "w").write("x: ok\n"); run("git", "add", "-A"); run("git", "commit", "-qm", "b")
    open(d + "/data/f.json", "w").write(json.dumps({"countries": {"EU": {"series": [S("x", Y)]}}, "log": []}, separators=(",", ":"))); run("git", "add", "data/f.json")
    G.ROOT = d; G.main([])
    ok("e2e: sin fallo en el log no se repone nada (retirada a proposito)", sorted(s["id"] for s in json.loads(subprocess.check_output(["git", "show", ":data/f.json"], cwd=d))["countries"]["EU"]["series"]) == ["x"])
    open(d + "/data/f-log.txt", "w").write("x: ok\nFALLO y: HTTPError 404\n"); run("git", "add", "data/f-log.txt"); G.main([])
    staged = json.loads(subprocess.check_output(["git", "show", ":data/f.json"], cwd=d))
    got = sorted(s["id"] for s in staged["countries"]["EU"]["series"])
    ok("e2e: repone y deja preparada la serie al dia que falto (y)", got == ["x", "y"])
    ok("e2e: la retirada a proposito (z) no se repone", "z" not in got)
    ok("e2e: el fichero sigue compacto", "\n" not in open(d + "/data/f.json").read().strip())
    os.environ["PUBLISH_ALLOW_SERIES_LOSS"] = "1"; open(d + "/data/f.json", "w").write(json.dumps({"countries": {"EU": {"series": []}}}, separators=(",", ":"))); run("git", "add", "data/f.json"); G.main([])
    ok("e2e: con PUBLISH_ALLOW_SERIES_LOSS=1 no toca nada", json.loads(open(d + "/data/f.json").read())["countries"]["EU"]["series"] == []); del os.environ["PUBLISH_ALLOW_SERIES_LOSS"]
print("guard-series-loss: %d fallos" % fail); sys.exit(1 if fail else 0)

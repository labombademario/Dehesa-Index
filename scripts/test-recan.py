#!/usr/bin/env python3
"""Test sin red de RECAN: el recurso del MAPA paso a traer solo el ultimo ejercicio (9-oct-2026). Con un volcado de un solo ejercicio:
 - se conservan intactos los ejercicios ya publicados del historico;
 - el ejercicio nuevo se anade; uno que ya existia se sustituye por lo nuevo;
 - un volcado con muy pocas filas por ejercicio se rechaza sin escribir nada."""
import csv, io, json, os, runpy, shutil, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; SCRIPT = ROOT / "scripts" / "update-recan.py"
HDR = (ROOT / "scripts/fixtures/recan/dump-head-2026-10-09.csv").read_text(encoding="utf-8").splitlines()[0].split(",")
def dump_from(doc, year_src, year_dst, limit=None):
    """CSV con la forma real del recurso (cabecera real) a partir de las filas de un ejercicio del historico."""
    out = io.StringIO(); w = csv.writer(out); w.writerow(HDR); n = 0
    yi = doc["years"].index(year_src)
    for row in doc["rows"]:
        if row[0] != yi: continue
        c = doc["ccaa"][row[1]]; n1, n3 = doc["types"][row[2]]; d = doc["dims"][row[3]]
        for (vid, lab, unit), val in zip(doc["vars"], row[6]):
            if val is None: continue
            n += 1; w.writerow([n, year_dst, 0, c, 0, n1, 0, n3, 0, n3, d, vid, "%s (%s)" % (lab, vid), val, unit, row[4], row[5]])
        if limit and n >= limit: break
    return out.getvalue()
def run(tmp, text):
    g = runpy.run_path(str(SCRIPT), run_name="not_main")
    g["get"] = lambda: text; g["main"].__globals__["get"] = lambda: text
    cwd = os.getcwd(); os.chdir(tmp)
    try: g["main"](); return 0
    except SystemExit as e: return e.code
    finally: os.chdir(cwd)
def main():
    old = json.loads((ROOT / "data/recan.json").read_text(encoding="utf-8")); bad = []
    last = old["years"][-1]
    with tempfile.TemporaryDirectory() as t:
        (Path(t) / "data").mkdir(); shutil.copy(ROOT / "data/recan.json", Path(t) / "data/recan.json")
        rc = run(t, dump_from(old, last, 2030))
        new = json.loads((Path(t) / "data/recan.json").read_text(encoding="utf-8"))
        if rc not in (0, None): bad.append("rc=%r" % rc)
        if new["years"] != old["years"] + [2030]: bad.append("ejercicios %s" % new["years"])
        def cells(doc, y):
            yi = doc["years"].index(y); V = [v[0] for v in doc["vars"]]
            return {(doc["ccaa"][r[1]], tuple(doc["types"][r[2]]), doc["dims"][r[3]], V[i]): x for r in doc["rows"] if r[0] == yi for i, x in enumerate(r[6]) if x is not None}
        for y in old["years"]:
            if cells(old, y) != cells(new, y): bad.append("ejercicio %d alterado" % y)
        if cells(new, 2030) != cells(old, last): bad.append("ejercicio nuevo no reproduce el volcado")
        # el MAPA revisa un ejercicio que ya teniamos: manda lo nuevo y el resto se conserva
        txt = dump_from(old, last, last).replace(",UTA/expl.,", ",UTA/expl.,", 1)
        rc = run(t, txt); new2 = json.loads((Path(t) / "data/recan.json").read_text(encoding="utf-8"))
        if new2["years"] != old["years"] + [2030]: bad.append("revision cambia ejercicios %s" % new2["years"])
        # volcado roto (pocas filas): no se escribe nada
        before = (Path(t) / "data/recan.json").read_text(encoding="utf-8")
        rc = run(t, dump_from(old, last, 2031, limit=40))
        if rc in (0, None): bad.append("volcado con pocas filas debia rechazarse")
        if (Path(t) / "data/recan.json").read_text(encoding="utf-8") != before: bad.append("se escribio un volcado roto")
    for b in bad: print("FALLA", b)
    print("OK test-recan" if not bad else "%d fallos" % len(bad)); sys.exit(1 if bad else 0)
main()

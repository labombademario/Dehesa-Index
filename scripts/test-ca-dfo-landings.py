#!/usr/bin/env python3
"""Tests de scripts/update-ca-dfo-landings.py sin red, con trozos REALES del CSV de DFO (scripts/fixtures/dfo/landings-*.csv, con la nota al pie en cp1252): lectura de cifras con comas,
«x» (suprimido) como null sin rellenar, totales publicados, coherencia Atlantic/Canada, suma de especies, rechazo de cabecera, provincia, grupo, celdas y anos incoherentes (nada se publica
a medias) y que el fichero anterior se conserva cuando el CSV nuevo falla o trae menos anos."""
import importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "dfo"; SCRIPT = ROOT / "scripts" / "update-ca-dfo-landings.py"
spec = importlib.util.spec_from_file_location("dfo", SCRIPT); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
R = {n: (FX / ("landings-%s.csv" % n)).read_bytes() for n in ("1990-1991", "2006", "2024")}
d = M.parse(R["1990-1991"]); eq(d["years"], [1990, 1991], "anos"); eq(M.check(d), [], "1990-91 coherente"); eq(d["suppressed"], [], "sin supresiones en 1990-91")
eq(d["totals"]["Atlantic"]["grand"]["1990"], [1322127566, 951171415], "total Atlantic 1990 (cifras con comas)")
eq(d["landings"]["Atlantic"]["lobster"]["1990"], [47852924, 232204241], "langosta Atlantic 1990")
eq(d["provinces"], M.PROVS, "zonas"); eq(len(d["species"]) >= 25, True, "especies")
g = M.parse(R["2024"]); eq(g["years"], [2024], "2024"); eq(M.check(g), [], "2024 coherente"); eq(g["totals"]["Quebec"]["grand"]["2024"], [39482364, 363996122], "total Quebec 2024 (ultima fila del CSV)")
s = M.parse(R["2006"]); eq(M.check(s), [], "2006 coherente aunque haya celdas suprimidas")
eq(len(s["suppressed"]) > 20, True, "2006 trae celdas suprimidas"); eq(s["landings"]["New Brunswick"]["clams"]["2006"], [None, None], "«x» = null en cantidad y valor, sin rellenar")
eq([x for x in s["suppressed"] if x[1] in ("Canada", "Atlantic", "British Columbia")], [], "las zonas grandes no tienen celdas suprimidas")
def rej(raw, what):
    try: M.check(M.parse(raw)) and None; bad.append("no rechazo: " + what)
    except ValueError: pass
def rej_check(raw, what):
    try:
        if not M.check(M.parse(raw)): bad.append("no detecto: " + what)
    except ValueError: pass
t = R["1990-1991"].decode("cp1252")
enc = lambda x: x.encode("cp1252")
rej(enc(t.replace("Year,Province", "Ano,Province")), "cabecera distinta")
rej(enc(t.replace("1990,Quebec,", "1990,Ontario,", 1)), "provincia desconocida")
rej(enc(t.replace("Groundfish", "Freshwater", 1)), "grupo desconocido")
rej(enc(t.replace('"47,852,924"', "n/d", 1)), "celda no numerica")
rej(enc(t.replace('"47,852,924","232,204,241"', 'x,"232,204,241"', 1)), "suprimida solo en cantidad")
rej(enc(t.replace("1991,", "1993,")), "anos con hueco")
rej(enc(t.replace('"47,852,924"', '"-5"', 1)), "cantidad negativa")
first = t.split("\r\n")[1]; rej(enc(t.replace(first, first + "\r\n" + first, 1)), "fila repetida")
rej_check(enc(t.replace('"47,852,924"', '"97,852,924"', 1)), "especie que no suma el total")
rej_check(enc(t.replace('"1,322,127,566"', '"1,522,127,566"', 1)) if '"1,322,127,566"' in t else enc(t.replace("1,322,127,566", "1,522,127,566", 1)), "Atlantic distinto de la suma de provincias")
# idempotencia y conservacion del fichero anterior
with tempfile.TemporaryDirectory() as tmp:
    out = Path(tmp) / "o.json"; fx = FX / "landings-1990-1991.csv"
    run = lambda *a: subprocess.run([sys.executable, str(SCRIPT), "--out", str(out), *a], capture_output=True, text=True)
    r = run("--csv", str(fx)); eq(r.returncode, 0, "carga sana (%s)" % r.stdout[-200:])
    a = json.loads(out.read_text()); a.pop("generatedAt"); r = run("--csv", str(fx)); b = json.loads(out.read_text()); b.pop("generatedAt"); eq(a, b, "idempotente")
    before = out.read_text(); badf = Path(tmp) / "mal.csv"; badf.write_bytes(enc(t.replace("1990,Quebec,", "1990,Ontario,", 1)))
    r = run("--csv", str(badf)); eq(r.returncode, 1, "CSV roto: sale en rojo"); eq(out.read_text(), before, "CSV roto: el fichero anterior no cambia")
    one = Path(tmp) / "uno.csv"; one.write_bytes(R["2024"]); r = run("--csv", str(one)); eq(r.returncode, 1, "CSV que no empieza en 1990 se rechaza"); eq(out.read_text(), before, "CSV corto: el fichero anterior no cambia")
if bad:
    print("FALLOS:"); [print(" -", x) for x in bad]; sys.exit(1)
print("OK: DFO desembarques (lectura, supresiones, coherencia, rechazos, idempotencia, fallo seguro)")

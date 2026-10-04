#!/usr/bin/env python3
"""Tests de scripts/update-us-county-yields.py sin red. Los fixtures de 2024 son filas REALES de NASS Quick Stats (maiz de seis condados de Iowa y tres 'OTHER COUNTIES', algodon de Texas y dos 'OTHER COUNTIES');
los anos y valores que se cambian dentro de cada prueba son sinteticos y solo comprueban la logica (huecos, fusion de anos, validacion, fallos)."""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "us-county"
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
tmp = Path(tempfile.mkdtemp())
def run(out, fx=None, *args, env=None):
    e = dict(os.environ); e.pop("NASS_API_KEY", None); e.update(env or {})
    a = [sys.executable, str(ROOT / "scripts/update-us-county-yields.py"), "--out", str(out), "--now", "2026-10-04"] + (["--fixture-dir", str(fx)] if fx else []) + list(args)
    return subprocess.run(a, capture_output=True, text=True, env=e)
def rd(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def copy_fx(dst):
    dst.mkdir(parents=True, exist_ok=True)
    for f in FX.glob("*.json"): shutil.copy(f, dst / f.name)
# --- sin clave ni fixtures: no toca nada
o0 = tmp / "o0"; r = run(o0); eq(r.returncode, 0, "sin clave sale con 0"); eq(sorted(p.name for p in o0.glob("*") if p.name != "log.txt"), ["status.json"], "sin clave solo status.json"); eq(rd(o0 / "status.json")["run"]["status"], "NO_KEY", "estado NO_KEY")
# --- maiz y algodon reales
fx = tmp / "fx"; copy_fx(fx); o1 = tmp / "o1"
r = run(o1, fx, "--only", "corn,cotton-upland"); eq(r.returncode, 0, "carga real sale con 0")
c = rd(o1 / "yields" / "corn.json")
eq(c["years"], [2024], "ano 2024"); eq(c["crop"], "CORN, GRAIN", "clave del cultivo"); eq(c["units"], {"yield": "BU / ACRE", "harvested": "ACRES", "production": "BU"}, "unidades")
ia = sorted(k for k in c["counties"] if k.startswith("19")); eq(len(ia), 6, "seis condados de Iowa"); eq(sorted(k for k in c["counties"] if k.endswith("998")), ["01998", "05998", "08998"], "'OTHER COUNTIES' como <estado>998")
src = {(x["state_alpha"], x["county_name"]): x for x in rd(fx / "corn.2024.yield.json")}; adair = src[("IA", "ADAIR")]
eq(c["counties"]["19001"][0][0], float(adair["Value"].replace(",", "")) if float(adair["Value"].replace(",", "")) != int(float(adair["Value"].replace(",", ""))) else int(float(adair["Value"].replace(",", ""))), "rendimiento de Adair = Quick Stats")
prod = {(x["state_alpha"], x["county_name"]): x for x in rd(fx / "corn.2024.production.json")}
eq(c["counties"]["19001"][2][0], int(prod[("IA", "ADAIR")]["Value"].replace(",", "")), "produccion de Adair con separador de miles")
cot = rd(o1 / "yields" / "cotton-upland.json"); eq(cot["units"]["production"], "480 LB BALES", "unidad de produccion del algodon"); eq(len(cot["counties"]), 7, "cinco condados de Texas y dos 'OTHER COUNTIES'")
ST = lambda d, slug: next(e for e in rd(d / "status.json")["crops"] if e["slug"] == slug)
eq(ST(o1, "corn")["status"], "OK", "estado del maiz OK")
eq(ST(o1, "cotton-upland")["countiesLatest"], 5, "condados con rendimiento (sin contar 'OTHER COUNTIES')")
# --- un hueco (D) es null, no cero; el resto de cifras del condado se conserva
f2 = tmp / "f2"; copy_fx(f2); y = rd(f2 / "corn.2024.yield.json"); y[0]["Value"] = "                 (D)"; (f2 / "corn.2024.yield.json").write_text(json.dumps(y))
# (si el rendimiento falta, la validacion produccion = rendimiento x superficie no compara ese condado)
o2 = tmp / "o2"; r = run(o2, f2, "--only", "corn"); eq(r.returncode, 0, "con un hueco sale con 0")
k = "%s%s" % (y[0]["state_fips_code"], y[0]["county_code"]); a = rd(o2 / "yields" / "corn.json")["counties"][k]
eq(a[0], [None], "rendimiento suprimido = null"); eq(a[1][0] is not None and a[2][0] is not None, True, "superficie y produccion del mismo condado se conservan")
# --- validacion: la produccion que no cuadra con rendimiento x superficie se rechaza y no se escribe
f3 = tmp / "f3"; copy_fx(f3); p = rd(f3 / "corn.2024.production.json")
for x in p: x["Value"] = "{:,}".format(int(x["Value"].replace(",", "")) * 2)
(f3 / "corn.2024.production.json").write_text(json.dumps(p)); o3 = tmp / "o3"; r = run(o3, f3, "--only", "corn")
eq(r.returncode, 1, "produccion incoherente sale con 1"); eq((o3 / "yields" / "corn.json").exists(), False, "no se escribe el cultivo invalido"); eq(ST(o3, "corn")["status"], "INVALID", "estado INVALID")
f3b = tmp / "f3b"; copy_fx(f3b); p = rd(f3b / "cotton-upland.2024.production.json")
for x in p: x["Value"] = "{:,}".format(int(x["Value"].replace(",", "")) * 480)
(f3b / "cotton-upland.2024.production.json").write_text(json.dumps(p)); r = run(tmp / "o3b", f3b, "--only", "cotton-upland"); eq(r.returncode, 1, "la unidad de la paca (480 lb) se comprueba")
# --- fusion de anos: 2025 nuevo, 2024 sin respuesta se conserva y se marca PARCIAL; revision de 2025
f4 = tmp / "f4"; f4.mkdir()
for m in ("yield", "harvested", "production"):
    rows = rd(FX / ("corn.2024.%s.json" % m))
    for x in rows: x["year"] = 2025
    (f4 / ("corn.2025.%s.json" % m)).write_text(json.dumps(rows))
o4 = tmp / "o4"; shutil.copytree(o1, o4)
r = run(o4, f4, "--only", "corn"); eq(r.returncode, 0, "fusion sale con 0")
c4 = rd(o4 / "yields" / "corn.json"); eq(c4["years"], [2024, 2025], "2024 se conserva y se añade 2025")
eq(c4["counties"]["19001"][0][0], c["counties"]["19001"][0][0], "el 2024 conservado no cambia"); eq(c4["counties"]["19001"][0][1], c["counties"]["19001"][0][0], "2025 trae los valores del fixture")
eq(ST(o4, "corn")["status"], "PARTIAL", "ano sin respuesta con datos previos: PARCIAL, no se pierde")
# --- fallo de autenticacion: ni escribe ni borra
f5 = tmp / "f5"; copy_fx(f5); (f5 / "corn.2024.yield.json").write_text(json.dumps({"_fixtureError": "AUTH_FAILURE"})); o5 = tmp / "o5"; r = run(o5, f5, "--only", "corn")
eq(r.returncode, 1, "AUTH_FAILURE sale con 1"); eq((o5 / "yields" / "corn.json").exists(), False, "AUTH_FAILURE no escribe"); eq(rd(o5 / "status.json")["run"]["status"], "AUTH_FAILURE", "estado AUTH_FAILURE")
# --- sin cambios no reescribe el fichero
before = (o1 / "yields" / "corn.json").read_text(); r = run(o1, fx, "--only", "corn"); eq((o1 / "yields" / "corn.json").read_text(), before, "segunda ejecucion identica no cambia el fichero")
shutil.rmtree(tmp, ignore_errors=True)
if bad:
    print("\n".join(bad)); sys.exit(1)
print("OK test-us-county-yields")

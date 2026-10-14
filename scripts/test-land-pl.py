#!/usr/bin/env python3
"""Prueba sin red de scripts/update-land-pl.py con respuestas reales guardadas de la API de GUS/BDL (scripts/fixtures/land-pl): produce el fichero, descarta el atributo 91 y rechaza datos rotos."""
import copy, importlib.util, json, shutil, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "land-pl"
sp = importlib.util.spec_from_file_location("ulp", str(ROOT / "scripts" / "update-land-pl.py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
m.log = lambda *a: None
years, cl = m.build(str(FX)); m.validate(years, cl)
assert years[0] == 1999 and years[-1] >= 2025, years
assert set(cl) == {"total", "fertile", "medium", "barren"} and len(cl["total"]) == 17
assert cl["fertile"]["LB"][-1] is None and cl["fertile"]["LB"][-2] is None, "el atributo 91 (valor 0) debe quedar como hueco"
assert all(x is None or x > 0 for a in cl["total"].values() for x in a)
def broken(fn):
    d = Path(tempfile.mkdtemp()); 
    for f in FX.glob("*.json"): shutil.copy(f, d / f.name)
    fn(d)
    try: y, c = m.build(str(d)); m.validate(y, c)
    except Exception as e: return str(e)
    return None
def edit(name, fn):
    def go(d):
        p = d / name; j = json.loads(p.read_text()); fn(j); p.write_text(json.dumps(j))
    return go
assert broken(edit("data4899_l2.json", lambda j: j["results"].pop())), "faltaba una voivodia y se acepto"
assert broken(edit("data4899_l2.json", lambda j: j["results"][0]["values"][-1].__setitem__("val", j["results"][0]["values"][-1]["val"] * 10))), "un valor x10 se acepto"
assert broken(edit("data4902_l0.json", lambda j: j["results"][0]["values"][-1].__setitem__("val", 1))), "valor nacional absurdo aceptado"
def drop_last_year(d):
    for n in ("data4905_l2.json", "data4905_l0.json"): edit(n, lambda j: [u["values"].pop() for u in j["results"]])(d)
assert broken(drop_last_year), "una variable con un ano menos que las demas se acepto"
out = Path(tempfile.mkdtemp())
sys.argv = ["x", "--out", str(out), "--fixtures", str(FX)]
assert m.main() == 0 and (out / "poland-land" / "land.json").exists()
print("test-land-pl OK: %d-%d, 16 voivodias, 4 clases" % (years[0], years[-1]))

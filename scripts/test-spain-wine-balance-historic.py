#!/usr/bin/env python3
"""Balance del vino historico de España (MAPA, campañas 2009/10-2015/16): lector, validacion, definitivo sobre provisional, celdas vacias como hueco, accumulacion y revisiones con libros reales (scripts/fixtures/spain-wine, sin red).
Uso: pip install openpyxl xlrd && python3 scripts/test-spain-wine-balance-historic.py"""
import importlib.util, copy, sys, json, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("uswbh", ROOT / "scripts" / "update-spain-wine-balance-historic.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
F = ROOT / "scripts" / "fixtures" / "spain-wine"
def load(f): return M.parse(*M.rows_of((F / f).read_bytes(), f.rsplit(".", 1)[1]))
c0, s0, d0 = load("balance_2009-10.xls")
c1, s1, d1 = load("balance_2014-15_def.xlsx")
c2, s2, d2 = load("balance_2014-15_prov.xls")
c3, s3, d3 = load("balance_2015-16_prov.xlsx")
ok("campaña y estado por el titulo", (c0, s0, c1, s1, c2, s2, c3, s3) == ("2009/10", "final", "2014/15", "final", "2014/15", "provisional", "2015/16", "provisional"))
ok("2009/10: existencias iniciales 34.373, producción 39.259, finales 35.115 (miles de hl)", d0["1"]["total"]["all"] == 34373 and d0["2"]["total"]["all"] == 39259 and d0["7"]["total"]["all"] == 35115)
ok("2009/10: disponibilidades 70.201 y blancos 29.183", d0["4"]["total"]["all"] == 70201 and d0["4"]["total"]["white"] == 29183)
ok("2014/15 definitivo: producción 44.415 y finales 32.107", d1["2"]["total"]["all"] == 44415 and d1["7"]["total"]["all"] == 32107)
ok("el provisional de 2014/15 difiere del definitivo (producción 45.015)", d2["2"]["total"]["all"] == 45015)
ok("las existencias finales de una campaña son las iniciales de la siguiente", d1["7"]["total"]["all"] == d3["1"]["total"]["all"])
blank = [(c, k, col) for c in M.CODES for k in M.CATS for col in ("all", "white") if d1[c][k][col] is None]
ok("el definitivo 2014/15 trae celdas vacías: son hueco (None), no cero", len(blank) > 0)
for p, d in ((c0, d0), (c1, d1), (c3, d3)):
    e, n = M.validate(p, d); ok("el libro real de %s cuadra" % p, not e)
bad = copy.deepcopy(d0); bad["4"]["total"]["all"] += 500; ok("disponibilidades que no suman se rechaza", M.validate(c0, bad)[0])
bad = copy.deepcopy(d0); bad["2"]["total"]["all"] += 500; ok("producción distinta de mostos + utilizable se rechaza", M.validate(c0, bad)[0])
bad = copy.deepcopy(d0); bad["7"]["total"]["all"] += 500; ok("existencias finales que rompen el balance se rechaza", M.validate(c0, bad)[0])
bad = copy.deepcopy(d0); bad["2"]["dop"]["all"] += 500; ok("categorías que no suman el total se rechaza", M.validate(c0, bad)[0])
rows = M.rows_of((F / "balance_2009-10.xls").read_bytes(), "xls")
try: M.parse(rows[0], [["sin titulo"]]); ok("libro sin título debe fallar", False)
except Exception: pass
html = '<a href="/dam/x/6.-balance-vino/balance-vino--2009-10-definitivo-.xls">a</a><a href="/dam/x/otro/informe.xls">x</a><a href="/dam/x/6.-balance-vino/balance-vino-2015-16.pdf">p</a>'
L = M.find_links(html); ok("solo libros de balance, ni pdf ni otros", len(L) == 1 and L[0].endswith("2009-10-definitivo-.xls"))
files = {c0: {"url": "u0", "lastModified": "x"}, c1: {"url": "u1", "lastModified": "x"}, c3: {"url": "u3", "lastModified": "x"}}
allc = {c0: {"status": s0, "data": d0}, c1: {"status": s1, "data": d1}, c3: {"status": s3, "data": d3}}
doc = M.to_doc(allc, files); back = M.from_doc(doc)
ok("campañas ordenadas", doc["campaigns"] == ["2009/10", "2014/15", "2015/16"] and doc["status"]["2015/16"] == "provisional")
ok("ida y vuelta conserva valores y huecos", all(back[p]["data"][c][k][col] == allc[p]["data"][c][k][col] or (back[p]["data"][c][k][col] is None and allc[p]["data"][c][k][col] is None) or abs(back[p]["data"][c][k][col] - allc[p]["data"][c][k][col]) < 1e-3 for p in allc for c in M.CODES for k in M.CATS for col in ("all", "white")))
with tempfile.TemporaryDirectory() as t:
    import contextlib, io
    def run(*files):
        sys.argv = ["x", "--out", t] + [a for f in files for a in ("--file", str(F / f))]
        with contextlib.redirect_stdout(io.StringIO()): return M.main()
    ok("el provisional no sustituye al definitivo", run("balance_2014-15_def.xlsx") == 0 and run("balance_2014-15_prov.xls") == 0 and json.loads((Path(t) / "balance-historic.json").read_text())["status"]["2014/15"] == "final" and json.loads((Path(t) / "balance-historic.json").read_text())["v"]["2"]["total"]["all"][0] == 44415)
    ok("acumula campañas nuevas", run("balance_2009-10.xls") == 0 and json.loads((Path(t) / "balance-historic.json").read_text())["campaigns"] == ["2009/10", "2014/15"])
print("OK" if not fail else "%d fallos" % fail); sys.exit(1 if fail else 0)

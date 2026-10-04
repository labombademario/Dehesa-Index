#!/usr/bin/env python3
"""Censo anual de sacrificio por provincia de España (MAPA): lector .xls/.xlsx, cambio de unidad de aves y conejos, DC como hueco con su clase, alias de provincia, validacion, acumulacion y revisiones,
con los libros reales de 2025 (.xlsx, recortado a las dos primeras hojas), 2016 (.xls con DC) y 2007 (.xls, «datos sin elevar»), en scripts/fixtures/spain-slaughter-census, sin red.
Uso: python3 scripts/test-spain-slaughter-census.py"""
import importlib.util, copy, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("ussc", ROOT / "scripts" / "update-spain-slaughter-census.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
FX = ROOT / "scripts" / "fixtures" / "spain-slaughter-census"
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
def load(y, f):
    return M.build_year(M.rows_of(str(FX / f), f.rsplit(".", 1)[-1]), y)
Y25 = load(2025, "censo_2025.xlsx"); Y16 = load(2016, "censo_2016.xls"); Y07 = load(2007, "censo_2007.xls")
for y, Y in ((2025, Y25), (2016, Y16), (2007, Y07)):
    e, w, n = M.validate(y, Y); ok("el libro real de %d cuadra" % y, not e)
r25, r16, r07 = Y25["reg"], Y16["reg"], Y07["reg"]
ok("2025: 50 provincias y 17 comunidades", sum(1 for k in r25 if k.startswith("p")) == 50 and sum(1 for k in r25 if k.startswith("c")) == 17)
ok("2025: A Coruña bovino 93.295 cabezas, Galicia 334.509", r25["p15"]["bovino"]["heads"] == 93295 and r25["cgalicia"]["bovino"]["heads"] == 334509)
ok("2025: aves ya vienen en cabezas (892.656.690), sin multiplicar", r25["ES"]["aves"]["heads"] == 892656690)
ok("2025: bovino España 709.515,6 t y 2.383.979 cabezas", abs(r25["ES"]["bovino"]["meat"] - 709515.647) < 0.01 and r25["ES"]["bovino"]["heads"] == 2383979)
ok("2025: Lugo porcino es DC: hueco (null), sin cifra, clase 0 (no indica clase)", r25["p27"]["porcino"]["heads"] is None and r25["p27"]["porcino"]["dcH"] == 0)
ok("2025: Cantabria, Álava, Vizcaya y Soria son DC en las 7 especies", all(r25[k][s]["heads"] is None and r25[k][s]["dcH"] == 0 for k in ("p39", "p01", "p48", "p42") for s in M.SPECIES))
ok("2025: Madrid es provincia y comunidad (misma fila)", r25["p28"] == r25["cmadrid"] and r25["p28"]["bovino"]["heads"] == 108676)
ok("2025: Canarias suma Las Palmas y Tenerife donde no hay DC (ovino)", r25["p35"]["ovino"]["heads"] == 8102 and r25["p38"]["ovino"]["heads"] == 3148 and r25["ccanarias"]["ovino"]["heads"] == 11250)
ok("2025: un cero publicado es cero (Baleares equino)", r25["p07"]["equino"]["heads"] == 0 and r25["p07"]["equino"]["dcH"] is None)
ok("2025: el libro es censal", Y25["basis"] == "census")
ok("2016: aves en miles se pasan a cabezas (764.538.198)", abs(r16["ES"]["aves"]["heads"] - 764538198.4) < 1 and abs(r16["ES"]["conejos"]["heads"] - 48506565.65) < 1)
ok("2016: A Coruña caprino DC clase 1 y conejos DC clase 2", r16["p15"]["caprino"]["heads"] is None and r16["p15"]["caprino"]["dcH"] == 1 and r16["p15"]["conejos"]["dcH"] == 2)
ok("2016: la clase de DC de la carne se lee aparte", r16["p15"]["caprino"]["dcM"] == 1)
ok("2016: A Coruña aparece como «CORUÑA (LA)» y se lee como la provincia 15", r16["p15"]["bovino"]["heads"] == 109134)
ok("2007: sin elevar y sin DC", Y07["basis"] == "unraised" and all(d[s]["dcH"] is None for d in Y07["reg"].values() for s in M.SPECIES))
ok("2007: España incluye otros sacrificios (ovino 17.062.431 = TOTAL 14.578.929 + 2.483.502)", r07["ES"]["ovino"]["heads"] == 17062431 and r07["TOTAL"]["ovino"]["heads"] == 14578929 and r07["OTROS"]["ovino"]["heads"] == 2483502)
ok("2007: aves de A Coruña 3.571.079 cabezas (3.571,079 miles)", abs(r07["p15"]["aves"]["heads"] - 3571079) < 1)
ok("2007: STA.CR.TENERIFE se lee como Santa Cruz de Tenerife (p38)", r07["p38"]["bovino"]["heads"] == 4520)
# cifras de 2025 que el libro mensual del mismo año (data/spain-slaughter/slaughter.json) publica por separado: tienen que coincidir
mp = ROOT / "data" / "spain-slaughter" / "slaughter.json"
if mp.exists():
    m = json.loads(mp.read_text("utf-8")); idx = [i for i, p in enumerate(m["periods"]) if p.startswith("2025")]
    if len(idx) == 12:
        tot = sum(m["national"]["bovino"]["heads"][i] for i in idx); ok("bovino 2025: el censo (%s) coincide con la suma de los 12 meses del libro mensual (%s)" % (r25["ES"]["bovino"]["heads"], tot), abs(tot - r25["ES"]["bovino"]["heads"]) <= 1)
        tot = sum(m["national"]["aves"]["heads"][i] for i in idx) * 1000; ok("aves 2025: el censo coincide con el mensual", abs(tot - r25["ES"]["aves"]["heads"]) <= 100)
# validacion: lo malo se rechaza
bad = copy.deepcopy(Y25); bad["reg"]["ES"]["aves"]["heads"] /= 1000.0; ok("aves en miles en un año de cabezas se rechaza", M.validate(2025, bad)[0])
bad = copy.deepcopy(Y16); bad["reg"]["ES"]["aves"]["heads"] /= 1000.0; ok("aves sin multiplicar en un año de miles se rechaza", M.validate(2016, bad)[0])
bad = copy.deepcopy(Y25); bad["reg"]["p15"]["bovino"]["heads"] = -4; ok("negativo se rechaza", M.validate(2025, bad)[0])
bad = copy.deepcopy(Y25); bad["reg"]["TOTAL"]["porcino"]["heads"] -= 900000; ok("comunidades que suman mas que el TOTAL se rechaza", M.validate(2025, bad)[0])
bad = copy.deepcopy(Y07); bad["reg"]["TOTAL"]["porcino"]["heads"] += 900000; ok("comunidades que no suman el TOTAL (año sin DC) se rechaza", M.validate(2007, bad)[0])
bad = copy.deepcopy(Y07); bad["reg"]["ES"]["ovino"]["heads"] += 500000; ok("TOTAL + otros distinto de España se rechaza", M.validate(2007, bad)[0])
bad = copy.deepcopy(Y25)
for p in ("p22", "p44", "p50", "p27", "p36", "p09", "p47", "p24", "p08", "p17"):
    for sp_ in ("porcino", "ovino"): bad["reg"][p][sp_]["heads"] = (bad["reg"][p][sp_]["heads"] or 0) * 3 + 900000
ok("desajustes grandes y repetidos entre provincias y comunidad (lectura rota) se rechazan", M.validate(2025, bad)[0])
bad = copy.deepcopy(Y25); bad["reg"]["p22"]["porcino"]["heads"] += 40000; e, w, n = M.validate(2025, bad); ok("un desajuste aislado entre provincias y su comunidad se anota, no bloquea", not e and any(x["region"] == "aragon" for x in n))
# lector: nombres sin reconocer y cabecera rota
sh = M.rows_of(str(FX / "censo_2025.xlsx"), "xlsx"); h, mm = M.pick(sh)
rows = copy.deepcopy(h[1]); k = [i for i, r in enumerate(rows) if r[0] == "ZARAGOZA"][0]; rows[k][0] = "ZARAGOZA CAPITAL"
try: M.read_sheet(h[0], rows); ok("provincia con nombre sin reconocer se rechaza", False)
except ValueError: pass
rows = copy.deepcopy(h[1]); k = [i for i, r in enumerate(rows) if r[0] == "ZARAGOZA"][0]; rows[k][1] = "n/d"
try: M.read_sheet(h[0], rows); ok("celda con texto que no es DC se rechaza", False)
except ValueError: pass
rows = copy.deepcopy(h[1]); k = [i for i, r in enumerate(rows) if r[0] == "ZARAGOZA"][0]; del rows[k]
try: M.build_year([(h[0], rows), mm], 2025); ok("provincia que falta se rechaza", False)
except ValueError: pass
try: M.pick([("RESUMEN", [])]); ok("libro sin hojas de cabezas y carne se rechaza", False)
except ValueError: pass
# descubrimiento de enlaces por el texto del enlace
html = '''<a href="/dam/mapa/x/web_sacrificios_agosto-web.xlsx">Sacrificio de agosto</a><a href="/dam/mapa/y/2025/censoexhaustivo-2025.xlsx">Censo exhaustivo 2025 (excel)</a>
<a href="/es/dam/jcr:abc/SACRIFICIO_ANUAL_2024.2025-07-02-10-40-21.xlsx">Sacrificios 2024</a><a href="/es/dam/jcr:abd/SACRIFICIO_ANUAL_2024.pdf">Sacrificios 2024 (pdf)</a>
<a href="/dam/mapa/z/2022/censoexhaustivo2022.xls">Sacrificios 2022</a><a href="/otra/pagina">Sacrificios 2021</a>'''
L = M.find_links(html)
ok("enlaces: censo 2025, 2024 (jcr) y 2022 (.xls); sin el mensual, el pdf ni los enlaces que no son libros", sorted(L) == [2022, 2024, 2025] and L[2024].endswith(".xlsx") and L[2025].startswith("https://www.mapa.gob.es/"))
# acumulacion, lectura de vuelta y revisiones
allY = {2007: Y07, 2016: Y16, 2025: Y25}
doc = M.to_doc(allY, {str(y): {"url": None, "lastModified": None} for y in allY}, [], 0)
ok("documento: 3 años, 50 provincias + España, 17 comunidades", doc["years"] == [2007, 2016, 2025] and len(doc["v"]) == 51 and len(doc["ccaa"]) == 17)
ok("documento: aves de España 2016 en cabezas y DC de Lugo 2025 con su clase", abs(doc["v"]["ES"]["aves"]["heads"][1] - 764538198.4) < 1 and doc["dc"]["27"]["porcino"]["heads"]["2025"] == 0 and doc["v"]["27"]["porcino"]["heads"][2] is None)
back = M.from_doc(json.loads(json.dumps(doc)))
ok("el documento se lee de vuelta sin perder cifras ni DC", all(back[y]["reg"][k][s][f] == allY[y]["reg"][k][s][f] or abs(back[y]["reg"][k][s][f] - allY[y]["reg"][k][s][f]) < 1e-3 for y in allY for k in allY[y]["reg"] if k != "OTROS" or allY[y]["hasOthers"] for s in M.SPECIES for f in ("heads", "meat", "dcH", "dcM")))
with tempfile.TemporaryDirectory() as td:
    import io, contextlib
    def run(args):
        old = sys.argv; sys.argv = ["x"] + args; M.LOG.clear()
        try:
            with contextlib.redirect_stdout(io.StringIO()): return M.main()
        finally: sys.argv = old
    a = ["--out", td, "--file", str(FX / "censo_2007.xls"), "--year", "2007", "--file", str(FX / "censo_2016.xls"), "--year", "2016", "--file", str(FX / "censo_2025.xlsx"), "--year", "2025"]
    ok("main escribe el archivo con tres libros", run(a) == 0 and (Path(td) / "census.json").exists())
    d1 = json.loads((Path(td) / "census.json").read_text("utf-8")); ok("main: 3 años y 0 revisiones", d1["years"] == [2007, 2016, 2025] and d1["revisions"] == 0)
    ok("main de nuevo con el mismo libro: 0 revisiones", run(["--out", td, "--file", str(FX / "censo_2025.xlsx"), "--year", "2025"]) == 0 and json.loads((Path(td) / "census.json").read_text("utf-8"))["revisions"] == 0)
    ok("main sin --year para cada --file se niega", run(["--out", td, "--file", str(FX / "censo_2025.xlsx")]) == 1)
    d2 = json.loads((Path(td) / "census.json").read_text("utf-8")); ok("el archivo conserva 2007 y 2016 al añadir 2025", d2["years"] == [2007, 2016, 2025])
print("test-spain-slaughter-census: %s" % ("OK" if not fail else "%d FALLOS" % fail)); sys.exit(1 if fail else 0)

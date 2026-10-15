#!/usr/bin/env python3
"""Prueba sin red de update-land-fr-it.py con extractos reales: texto de `pdftotext -layout` de Agreste «Valeur vénale des terres en 2023» (filas departamentales) y la Tab. 1 del libro
«MF Regione 1960-2023» del CREA (scripts/fixtures/land-fr-it). Comprueba lectura, unidades, validaciones, acumulacion de anos, eleccion del libro, la puerta de licencia y el contrato."""
import copy, importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "land-fr-it"
def load(name, f):
    sp = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
m = load("lfi", "update-land-fr-it.py"); ct = load("ct", "contract_tests.py")
fails = []
def check(c, msg):
    if not c: fails.append(msg)
def raises(fn, frag, msg):
    try: fn()
    except Exception as e:
        if frag not in str(e): fails.append("%s: error distinto (%s)" % (msg, str(e)[:100]))
        return
    fails.append("%s: no fallo" % msg)
txt = (FX / "fr-vvt-2023.txt").read_text("utf-8")
# ── Francia
years, res = m.parse_france(txt)
check(years == [2021, 2022, 2023], "anos de Francia %s" % years)
check(len(res["free"]) == 91 and len(res["rent"]) == 58, "departamentos %d/%d" % (len(res["free"]), len(res["rent"])))
check(res["free"]["01"] == [4170, 3880, 3780], "Ain libres %s" % res["free"].get("01"))
check(res["free"]["55"] == [5230, 5050, 5050], "Meuse (nombre con prefijo de region) %s" % res["free"].get("55"))
check(res["rent"]["01":"02"] == {} if False else "01" not in res["rent"], "Ain no tiene alquiladas en la tabla")
check("06" not in res["free"] and "75" not in res["free"], "Alpes-Maritimes (NS) y Paris no deben aparecer")
check("2A" in res["free"] and "2B" in res["free"], "Corcega")
check(res["free"]["33"][2] == 7590, "Gironda")
import re
bad = re.sub(r"(?m)^(\s+AIN\s.*?)-3%", r"\g<1>+30%", txt, count=1)
check(bad != txt, "fixture de mutacion")
raises(lambda: m.parse_france(bad), "variacion impresa incoherente", "variacion impresa que no cuadra")
raises(lambda: m.parse_france(txt.replace("AIN  ", "AINX ", 1)), "no reconocidos", "departamento desconocido")
raises(lambda: m.parse_france("\n".join(txt.split("\n")[:80])), "solo", "pocos departamentos")
# acumulacion de anos: una edicion nueva (2022-2024) conserva 2021 y manda en 2022-2023
prev = {"years": [2021, 2022, 2023], "free": {k: list(v) for k, v in res["free"].items()}, "rent": {k: list(v) for k, v in res["rent"].items()}}
new = {"free": {k: [v[1] + 10, v[2], v[2] + 100] for k, v in res["free"].items()}, "rent": {k: [v[1], v[2], v[2] + 100] for k, v in res["rent"].items()}}
import contextlib, io
with contextlib.redirect_stdout(io.StringIO()): Y2, mg = m.merge_fr(prev, [2022, 2023, 2024], new)
check(Y2 == [2021, 2022, 2023, 2024], "acumulacion de anos %s" % Y2)
check(mg["free"]["01"] == [4170, 3890, 3780, 3880], "acumulacion de Ain %s" % mg["free"]["01"])
# ── Italia
src = str(FX / "crea-prezzi.xlsx"); it = m.parse_italy(src)
check(it["years"][0] == 1960 and it["years"][-1] == 2023 and len(it["years"]) == 64, "anos de Italia")
check(len(it["regions"]) == 20 and len(it["macro"]) == 5, "regiones/circoscrizioni")
check(abs(it["regions"]["PIE"][-1] - 21787) < 5, "Piemonte 2023 en euros completos %s" % it["regions"]["PIE"][-1])
check(11000 < it["regions"]["PIE"][it["years"].index(1999)] < 14000 and 12000 < it["regions"]["PIE"][it["years"].index(2000)] < 14000, "Piemonte 1999/2000 continuo (cambio de unidades del libro)")
check(abs(it["italy"][-1] - 22809.4) < 1, "total de Italia 2023 %s" % it["italy"][-1])
check(it["macro"]["NO"][0] is None and it["macro"]["NO"][-1] > 30000, "circoscrizione sin datos antes de 1970")
import openpyxl
def mut(fn):
    wb = openpyxl.load_workbook(src); ws = wb["Prezzi"]; fn(ws)
    with tempfile.TemporaryDirectory() as d:
        p = str(Path(d) / "x.xlsx"); wb.save(p); return m.parse_italy(p)
def to_thousands(ws):
    r = next(i for i in range(1, 40) if ws.cell(i, 1).value == "Lombardia"); c = 1 + 2005 - 1960 + 0   # columna del ano 2005 (B = 1960)
    ws.cell(r, 2 + 2005 - 1960).value = ws.cell(r, 2 + 2005 - 1960).value * 10
raises(lambda: mut(to_thousands), "salto interanual", "valor 10 veces mayor en una region")
def drop_reg(ws):
    r = next(i for i in range(1, 40) if ws.cell(i, 1).value == "Umbria"); ws.cell(r, 1).value = "Umbria bis"
raises(lambda: mut(drop_reg), "20 esperadas", "region que falta")
def hole(ws):
    r = next(i for i in range(1, 40) if ws.cell(i, 1).value == "Veneto"); ws.cell(r, 10).value = None
raises(lambda: mut(hole), "hueco", "hueco en una region")
def italia_bad(ws):
    r = next(i for i in range(1, 40) if ws.cell(i, 1).value == "Italia"); ws.cell(r, 65).value = 900000
raises(lambda: mut(italia_bad), "Italia", "total de Italia absurdo")
# eleccion del libro: gana el de ano final mayor
links = ['href="/documents/68457/0/MF+Regione+1960-2023+%282024.09%29.xlsx/aaa?t=1728635105737"', 'href="/documents/68457/0/MF+Regione+1960-2024+%282025.09%29.xlsx/bbb?t=1761913054813"',
         'href="/documents/68457/0/MF_Regione_1960-2019+%282020-11%29+%281%29.xlsx/ccc?t=1606152458819"', 'href="/documents/68457/0/MF+Esempi+Minmax+2023.xlsx/ddd?t=1"']
y, u = m.pick_crea(" ".join(links)); check(y == 2024 and "bbb" in u, "libro elegido %s %s" % (y, u))
raises(lambda: m.pick_crea('href="/x/otro.xlsx"'), "no se encontro", "pagina sin libro")
# ── puerta de licencia y contrato: Italia no se escribe si crea_fondiario no esta VERIFIED
with tempfile.TemporaryDirectory() as d:
    sys.argv = ["x", "--out", d, "--it-file", src, "--fr-text", str(FX / "fr-vvt-2023.txt")]
    check(m.main() == 0, "main sin errores")
    st = json.loads((ROOT / "data" / "license-registry.json").read_text())["sources"]["crea_fondiario"]["status"]
    check((Path(d) / "france-land" / "land.json").exists(), "Francia se escribe")
    check((Path(d) / "italy-land" / "land.json").exists() == (st == "VERIFIED"), "Italia solo se escribe si la licencia esta VERIFIED (estado %s)" % st)
    fr = json.loads((Path(d) / "france-land" / "land.json").read_text())
with tempfile.TemporaryDirectory() as d:
    sys.argv = ["x", "--out", d, "--it-file", src, "--fr-text", str(FX / "fr-vvt-2023.txt"), "--force-italy"]; check(m.main() == 0, "main con --force-italy")
    itd = json.loads((Path(d) / "italy-land" / "land.json").read_text())
def contract(fn, doc):
    e, w, s = [], [], {}; fn(doc, e, w, s); return e
check(contract(ct.france_land, fr) == [], "contrato Francia: %s" % contract(ct.france_land, fr))
check(contract(ct.italy_land, itd) == [], "contrato Italia: %s" % contract(ct.italy_land, itd))
def mutf(f, fn):
    d = copy.deepcopy(f); fn(d); return d
CASES = [
 ("Italia region que falta", ct.italy_land, itd, lambda d: d["regions"].pop("PIE")),
 ("Italia hueco en una region", ct.italy_land, itd, lambda d: d["regions"]["PIE"].__setitem__(5, None)),
 ("Italia region en miles", ct.italy_land, itd, lambda d: d["regions"]["LOM"].__setitem__(-1, d["regions"]["LOM"][-1] / 1000)),
 ("Italia total absurdo", ct.italy_land, itd, lambda d: d["italy"].__setitem__(-1, 900000)),
 ("Italia circoscrizione que falta", ct.italy_land, itd, lambda d: d["macro"].pop("NO")),
 ("Italia anos que no empiezan en 1960", ct.italy_land, itd, lambda d: d["years"].__setitem__(0, 1961)),
 ("Francia departamento desconocido", ct.france_land, fr, lambda d: d["free"].__setitem__("99", [5000, 5000, 5000])),
 ("Francia pocos departamentos", ct.france_land, fr, lambda d: [d["free"].pop(k) for k in list(d["free"])[:10]]),
]
for name, fn, doc, mu in CASES:
    check(contract(fn, mutf(doc, mu)) != [], "el contrato no detecto: " + name)

# descarga con varias fuentes: Agreste falla (2025 y 2024 no responden), la 2023 llega por el espejo de la DRAAF; el error exacto queda en el log
import tempfile as _tf
with _tf.TemporaryDirectory() as d:
    _http, _pdf = m.http, m.pdf_text
    def fake_http(u, tries=3, timeout=180):
        if u.endswith("valeur-venale-des-terres-en-2023-1.pdf"): return b"%PDF-1.4 fake"
        raise RuntimeError("%s -> HTTP Error 403: Forbidden" % u)
    m.http, m.pdf_text = fake_http, lambda data: txt
    m.LOG.clear(); sys.argv = ["x", "--out", d, "--it-file", src]
    try: rc = m.main()
    finally: m.http, m.pdf_text = _http, _pdf
    check(rc == 0, "descarga con espejo: main sin error")
    check(any("403" in l and "no se pudo descargar" in l for l in m.LOG), "el log lleva el error exacto de la descarga")
    check(any("leida desde" in l and "draaf" in l for l in m.LOG), "la edicion 2023 se lee del espejo de la DRAAF")
    fr_ = json.loads((Path(d) / "france-land" / "land.json").read_text("utf-8"))
    check(fr_["years"] == [2021, 2022, 2023] and "draaf" in fr_["source"]["file"], "datos de Francia desde el espejo")
print("FALLOS:" if fails else "test-land-fr-it OK", *fails, sep="\n" if fails else " ")
sys.exit(1 if fails else 0)

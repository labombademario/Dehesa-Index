#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-belgium-more.py con libros Excel sinteticos: guardas de unidad (are/ha, 100 kg/ha), avance provisional del censo,
cabeceras con columnas desplazadas, filas de producto lacteo en una o dos lineas, balances de carne, precio de lonja derivado, variacion en estadisticas
y que un bloque que falla conserve lo publicado."""
import importlib.util, io, json, sys, tempfile
from pathlib import Path
import openpyxl
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sp = importlib.util.spec_from_file_location("bm", str(HERE / "update-belgium-more.py")); bm = importlib.util.module_from_spec(sp); sp.loader.exec_module(bm)
LB = bm.LB


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


def xlsx(sheets):
    wb = openpyxl.Workbook(); wb.remove(wb.active)
    for n, rows in sheets.items():
        ws = wb.create_sheet(n)
        for r in rows:
            ws.append(r)
    b = io.BytesIO(); wb.save(b)
    return b.getvalue()


# numeros
check(bm.num(" -") is None and bm.num("..") is None and bm.num("12,5") == 12.5 and bm.num("1 234") == 1234 and bm.num(None) is None and bm.num(True) is None, "num")
check(bm.rnd(2.0) == 2 and isinstance(bm.rnd(2.0), int) and bm.rnd(1.23456, 3) == 1.235, "rnd")

# cabecera de la tabla A con columnas desplazadas (el fichero de 2015 lleva una columna vacia mas)
HDR = ["Codes", "Variabelen", None, None, None, None, None, None, None, None, None, "België", "Vlaams Gewest", "Brussels Gewest", "Waals Gewest", "Provincie Antwerpen", "Provincie Vlaams-Brabant", "Provincie West-Vlaanderen",
       "Provincie Oost-Vlaanderen", "Provincie Limburg", "Provincie Waals-Brabant", "Provincie Henegouwen", "Provincie Luik", "Provincie Luxemburg", "Provincie Namen"]
cols = bm.geo_cols(HDR)
check(cols["be"] == 11 and cols["vl"] == 12 and cols["wa"] == 14 and cols["wb"] == 20 and cols["vb"] == 16 and len(cols) == 13, "columnas de region: %s" % cols)


def taba(year, sau_are, cows=500000, shift=0):
    hdr = HDR[:11] + [None] * shift + HDR[11:]
    cols0 = [None] * 11 + [None] * shift

    def row(code, vals):
        return [code] + cols0[1:] + vals
    rows = [["Landbouwcijfers %d" % year], [], hdr,
            row("C000001", [sau_are, sau_are * 0.45, 1, sau_are * 0.55] + [sau_are / 10] * 8),
            row("A132210", [cows, cows * 0.6, 10, cows * 0.4] + [cows / 10] * 8),
            row("H010000", [30000 + year - 2020, 20000, 50, 10000] + [3000] * 8),
            row("H013100", [" -"] * 12),
            row("H013200", [4873 + year - 2020, 100, 5, 4000] + [10] * 8)]
    return rows


rows = taba(2025, 134308241.63)
data, sc = bm.parse_tab_a(rows)
check(sc == 0.01 and abs(data["C000001"]["be"] * sc - 1343082.4163) < 1e-3, "are -> ha: %s" % sc)
check("H013100" not in data, "una fila sin datos no crea codigo")
data, sc = bm.parse_tab_a(taba(2025, 1343082.4163))
check(sc == 1.0, "ya en ha")
try:
    bm.parse_tab_a(taba(2025, 5))
    check(False, "una unidad rara debe fallar")
except RuntimeError:
    pass
try:
    bm.parse_tab_a([["x"]])
    check(False, "sin cabecera debe fallar")
except RuntimeError:
    pass

# avance provisional L05
L05 = [[None, "LANDBOUWGEGEVENS 2027 - MEI", None, "België", None, None, "Vlaams gewest", None, None, "Waals gewest", None, None],
       [None, "voorlopige resultaten", "Eenheden", "2026", "2027", "Evolutie", "2026", "2027", "Evolutie", "2026", "2027", "Evolutie"],
       ["C000001", "oppervlakte", "ha", 1000.5, 990.25, -0.01, 500, 495, -0.01, 500.5, 495.25, -0.01],
       ["A132210", "melkkoeien", "aantal", 520000, 515000, -0.01, 300000, 297000, -0.01, 220000, 218000, -0.01]]
py, cy, prev, cur = bm.parse_l05(L05)
check((py, cy) == (2026, 2027) and cur["C000001"]["be"] == 990.25 and cur["A132210"]["wa"] == 218000, "L05")

# ganado de extremo a extremo con get y page_files falsos
FILES = {}
for y, sau in ((2022, 136191113.0), (2023, 135300000.0), (2024, 135417008.0), (2025, 134308241.63)):
    FILES["https://x/DBREF-L05-%d-TAB-A-NL.xlsx" % y] = xlsx({"NOTA": [], "DBREF-L05-%d-TAB-A-NL" % y: taba(y, sau, shift=1 if y == 2023 else 0) + [[None]] * 100})
FILES["https://x/L05-2026-PROV-WEB-NL.xlsx"] = xlsx({"WEB_NL": [[None, "LANDBOUWGEGEVENS 2026 - MEI", None, "België", None, None, "Vlaams gewest", None, None, "Waals gewest", None, None],
                                                                 [None, "voorlopige resultaten", "Eenheden", "2025", "2026", "Evolutie", "2025", "2026", "Evolutie", "2025", "2026", "Evolutie"],
                                                                 ["C000001", "oppervlakte", "ha", 1343082.4, 1342715.0, 0, 618000, 619000, 0, 725000, 724000, 0],
                                                                 ["A132210", "melkkoeien", "aantal", 522545, 515000, 0, 340638, 336000, 0, 181644, 179000, 0]] + [[None]] * 100})
PAGES = {}


def fake_get(u):
    if u in FILES:
        return FILES[u]
    raise RuntimeError("sin respuesta sintetica para " + u)


def fake_pf(path, pat):
    import re
    return [u for u in PAGES.get(path, []) if re.search(pat, u)]


bm.get = fake_get; bm.page_files = fake_pf
PAGES["agriculture-fishery/farm-and-horticultural-holdings"] = list(FILES)
ed, tabs = bm.ganado()
check(ed == "2026", "edicion = ano del avance: %s" % ed)
t = {x["id"]: x for x in tabs}
check("ganado-a132210" in t and "sup-c000001" in t and "explotaciones-region" in t and "explotaciones-tamano" in t, "tablas: %s" % sorted(t)[:8])
s = next(x for x in t["sup-c000001"]["series"] if x["id"] == "be-agr-c000001-be")
check(s["points"][-3:] == [["2024", 1354170.08], ["2025", 1343082.42], ["2026", 1342715.0]] and s["provisional"] == ["2026"], "superficie en ha con avance provisional: %s" % s["points"])
c = next(x for x in t["ganado-a132210"]["series"] if x["id"] == "be-agr-a132210-vl")
check(c["points"][0][0] == "2022" and c["points"][-1] == ["2026", 336000] and c["provisional"] == ["2026"], "cabezas por region: %s" % c["points"])
check(set(c["l"]) == {"en", "fr", "it"} and "Flandes" in c["label"] and "Flanders" in c["l"]["en"], "nombres en cuatro idiomas")
check(len(t["sup-c000001"]["series"]) == 11, "una serie por region con datos (%d)" % len(t["sup-c000001"]["series"]))
# un ano ilegible se omite, pero con menos de tres anos falla el bloque
del FILES["https://x/DBREF-L05-2025-TAB-A-NL.xlsx"]; FILES["https://x/DBREF-L05-2025-TAB-A-NL.xlsx"] = xlsx({"a": [["x"]] * 200})
ed, tabs2 = bm.ganado()
check(next(x for x in {y["id"]: y for y in tabs2}["sup-c000001"]["series"] if x["id"] == "be-agr-c000001-be")["points"][-2][0] == "2024", "un ano ilegible se omite")
del FILES["https://x/DBREF-L05-2024-TAB-A-NL.xlsx"]
PAGES["agriculture-fishery/farm-and-horticultural-holdings"] = list(FILES)
try:
    bm.ganado(); check(False, "con menos de tres anos debe fallar")
except RuntimeError:
    pass

# cosecha: guarda de unidades y rendimiento 100 kg/ha -> t/ha
def l06(y, prod, area, yld, hdr=None):
    h = hdr or ["BELGIQUE", "Nature de la récolte", "Superficie            ha          ", "Rendement                         100 kg à l'ha", "Production                      en tonnes"]
    pre = [["T"], [], [], [], ["Source"], h, [], ["1. Céréales", "", "", "", ""]]
    cr = [["Froment d'hiver", "grain", area, yld, prod], ["Orge d’hiver", "grain", 100, 80.0, 800]]
    ev = [["EVOLUTION"], [], [], [], ["Source"], ["BELGIQUE", "Nature de la récolte", y - 1.0, float(y)], [], ["1. Céréales", "", "", ""],
          ["Froment d'hiver", "grain", prod * 0.9, prod], ["Orge d’hiver", "grain", 700, 800]]
    ey = [["REND"], [], [], [], ["Source"], ["BELGIQUE", "Nature de la récolte", y - 1.0, float(y)], [], ["1. Céréales", "", "", ""],
          ["Froment d'hiver", "grain", 81.0, yld], ["Orge d’hiver", "grain", 70.0, 80.0]]
    reg = [["R"], [], [], [], ["Source", "", "REGION FLAMANDE", "", "", "REGION BRUXELLES-CAPITALE", "", "", "REGION WALLONNE", "", ""],
           ["REGIONS", "Nature de la récolte"] + ["Superficie", "Rendement", "Production"] * 3, [], ["1. Céréales"] + [""] * 10,
           ["Froment d'hiver", "grain", 60000.0, 92.7, 554697.0, 700.0, 91.2, 6613.0, 120000.0, 90.3, 1100225.0]]
    return xlsx({"NOTE": [[""]], "EVOLUTION DES PRODUCTIONS": ev, "EVOLUTIONS DES RENDEMENTS": ey, "BELGIQUE": pre + cr, "REGIONS": reg})


FILES.clear(); PAGES.clear()
FILES["https://x/L06-2024-DEF-RESULT-TAB-FR-DIF.xls"] = l06(2024, 1033487.0, 152694.0, 67.7)
FILES["https://x/L06-2025-DEF-RESULT-TAB-FR_DIF.xls"] = l06(2025, 1661535.0, 182388.0, 91.1)
PAGES["agriculture-fishery/farm-and-horticultural-holdings"] = list(FILES)
ed, tabs = bm.cosecha()
t = {x["id"]: x for x in tabs}
w = next(x for x in t["produccion"]["series"] if x["id"] == "be-cosecha-prod-froment-d-hiver")
y = next(x for x in t["rendimiento"]["series"] if x["id"] == "be-cosecha-yield-froment-d-hiver")
a = next(x for x in t["superficie"]["series"] if x["id"] == "be-cosecha-area-froment-d-hiver")
check(w["points"][-1] == ["2025", 1661535] and y["points"][-1] == ["2025", 9.11] and a["points"] == [["2024", 152694], ["2025", 182388]], "cosecha: %s %s %s" % (w["points"], y["points"], a["points"]))
check(w["orig"] == "froment d'hiver" and "produccion-flamande" in t and next(x for x in t["rendimiento-flamande"]["series"])["points"][-1] == ["2025", 9.27], "regiones y nombre original")
FILES["https://x/L06-2025-DEF-RESULT-TAB-FR_DIF.xls"] = l06(2025, 1661535.0, 182388.0, 91.1, ["BELGIQUE", "Nature", "Superficie are", "Rendement kg", "Production kg"])
try:
    bm.cosecha(); check(False, "unidades distintas deben fallar")
except RuntimeError:
    pass

# pesca: hoja anual con grupos y precio derivado
def fish(q):
    return [["Sea fishing"], [], [], ["Fish species", "Total"], ["", "Total quantity kg", "Total value in EUR"], ["Overall total", q * 10, q * 50.0], [], ["Demersal fishes:", "", ""], ["Total", q * 6, q * 40.0],
            ["Sole", q, q * 17.5], ["Redfish", "-", "-"], ["Other species", 5, 5], [], ["Pelagic fishes", "", ""], ["Total", 3, 6.0], ["Herring", 3, 6.0], [], ["Crustaceans and molluscs: ", "", ""], ["Total", 100, 400.0], ["Shrimp", 100, 400.0], ["* Source"]]
d = bm.fish_sheet(fish(1000))
check(d["Overall total"] == (10000, 50000.0) and d["Demersal fishes"] == (6000, 40000.0) and d["Sole"] == (1000, 17500.0) and d["Pelagic fishes"] == (3, 6.0) and "Other species" not in d and d["Crustaceans and molluscs"] == (100, 400.0), "hoja de pesca: %s" % d)
check("Redfish" not in d or d["Redfish"] == (None, None), "un guion no es un dato")
try:
    bm.fish_sheet([[""]] * 4 + [["", "kg", "x"]]); check(False, "cabecera rara debe fallar")
except RuntimeError:
    pass
tb = {x["id"]: x for x in bm.fish_tables({"2023": bm.fish_sheet(fish(1000)), "2024": bm.fish_sheet(fish(1100))}, "y")}
sole = next(x for x in tb["pesca-precio-y"]["series"] if x["id"].endswith("-sole"))
check(sole["points"] == [["2023", 17.5], ["2024", 17.5]] and tb["pesca-precio-y"]["unit"] == "€/kg" and "derivado" in tb["pesca-precio-y"]["note"], "precio de lonja derivado: %s" % sole["points"])
q = next(x for x in tb["pesca-cantidad-y"]["series"] if x["id"].endswith("-sole"))
v = next(x for x in tb["pesca-valor-y"]["series"] if x["id"].endswith("-sole"))
check(q["points"][0] == ["2023", 1] and v["points"][0] == ["2023", 17.5] and tb["pesca-valor-y"]["unit"] == "miles de €", "kg -> t y EUR -> miles de EUR")

# lacteos: una linea (mensual) y dos lineas (anual)
M = [["MONTHLY"], ["Collected", "", "", "Quantities"], ["", "", "", "(Litre)"], [" Raw cows' milk", "", "", ""], ["", "- Milk", "", 1000.0],
     ["Milk products", "", "", "PRODUCTION"], ["", "", "", "Quantities (Litre)"], [], ["MILK", "", "", 54988624.0],
     ["- Whole milk", "", "- Pasteurised,  Sterilised, U.H.T.", 19740290.0], ["- Semi-skimmed milk", "", "- Pasteurised,  Sterilised, U.H.T.", 31005219.0],
     ["- Skimmed milk", "", "- Pasteurised,  Sterilised, U.H.T.", 2700664.0], ["- over 29\xa0%", "", "", 7458309.0], ["- below or equal to 29\xa0%", "", "", ".."],
     ["", "- Yoghurt", "", 5044628.0], ["", "- Fermented milk", "", 23180040.0], ["Milk products", "", "", "PRODUCTION"], ["", "", "", "Quantities (Kg)*"],
     ["", "- traditional butter", "", 6192051.0], ["- Cream, Whole milk, Partly skimmed milk powder", "", "", 2852654.0], ["- Skimmed milk (Fat content: 1,5\xa0% max.)", "", "", 16456336.0],
     ["- Fresh cheese", "", "", ""], ["", "- natural    ", "", 1860509.0], ["", "- Gouda", "", 917669.0], ["", "- Mozzarella", "", 8211376.0], ["PROCESSED CHEESE ", "", "", 863566.0]]
m = bm.dairy_sheet(M)
check(m["milk"] == (54988624.0, "l") and m["whole"][0] == 19740290.0 and m["cream-hi"][1] == "l" and m["cream-lo"][0] is None and m["butter"] == (6192051.0, "kg") and m["powder-skim"][0] == 16456336.0
      and m["fresh-cheese"][0] == 1860509.0 and m["mozzarella"][0] == 8211376.0 and m["processed"][0] == 863566.0, "lacteos mensual: %s" % m)
Y = [r[:] for r in M]
Y[9:12] = [["- Whole milk", "", "", ""], ["", "", "- Pasteurised,  Sterilised, U.H.T.", 226174345.0], ["- Semi-skimmed milk", "", "", ""], ["", "", "- Pasteurised,  Sterilised, U.H.T.", 334852818.0],
           ["- Skimmed milk", "", "", ""], ["", "", "- Pasteurised,  Sterilised, U.H.T.", 32291187.0]]
m2 = bm.dairy_sheet(Y)
check(m2["whole"][0] == 226174345.0 and m2["semi"][0] == 334852818.0 and m2["skim"][0] == 32291187.0, "lacteos anual en dos lineas: %s" % m2)
check(bm.dairy_sheet([["nada"]]) == {}, "una hoja sin leche no da nada")

# carne: la tabla de consumo por habitante (cabecera con anos pero sin bloque conocido) no se confunde con un bloque
MEAT = [["Supply balance sheets for meat (tonnes of carcass weight)"],
        ["Beef and veal", 2010.0, 2011.0], ["Gross indigenous production", 281634.0, 277809.0], ["Apparent consumption kg per capita", 18.33, 16.4], ["% self-sufficiency ", 141.7, 154.2],
        ["Pork", 2010.0, 2011.0], ["Gross indigenous production", 1116030.0, 1121276.0], ["Initial stocks", 0.0, 0.0],
        ["Apparent consumption", "", ""], ["kg of carcass weight per capita per year", 2010.0, 2011.0], ["Beef and veal", 18.33, 16.4], ["Gross indigenous production", 1.0, 2.0]]
MEAT_FILE = xlsx({"EN": MEAT})
FILES.clear(); PAGES.clear(); FILES["https://x/delmeat_statbel_en.xls"] = MEAT_FILE
PAGES["agriculture-fishery/supply-balance-sheets-meat"] = list(FILES)
ed, tabs = bm.carne()
t = {x["id"]: x for x in tabs}
check(ed == "2011" and [s["id"] for s in t["carne-production"]["series"]] == ["be-carne-production-beef", "be-carne-production-pork"], "produccion por tipo de carne: %s" % [s["id"] for s in t["carne-production"]["series"]])
check(t["carne-production"]["series"][0]["points"] == [["2010", 281634], ["2011", 277809]], "puntos anuales")
check(t["carne-selfsuff"]["series"][0]["points"][1] == ["2011", 154.2] and t["carne-percapita"]["unit"] == "kg/hab." and len(t["carne-production"]["series"]) == 2, "la tabla por habitante no genera un bloque falso")
FILES["https://x/delmeat_statbel_en.xls"] = xlsx({"EN": [["Supply balance sheets for meat (kg per head)"]] + MEAT[1:]})
try:
    bm.carne(); check(False, "unidad de balance distinta debe fallar")
except RuntimeError:
    pass

# IPC
import datetime
IH = ["CD_COICOP", "LVL", "Dénomination", "Benaming", "LVL"] + ["Pond.%d" % y for y in (2006, 2007)] + [datetime.datetime(2024 + (i // 12), i % 12 + 1, 1) for i in range(30)]
rows = [IH]
for code, lab in list(LB.CPI.items())[:12]:
    rows.append([code, 1, "Nom FR " + code, "Naam NL " + code, 1, 10, 10] + [100 + i * 0.1 for i in range(30)])
rows.append(["ZZ", 1, "x", "y", 1, 1, 1] + [1] * 30)
FILES.clear(); PAGES.clear(); FILES["https://x/Indexen%20per%20productgroep%20vanaf%202006.xlsx"] = xlsx({"Sheet1": rows})
PAGES["consumer-prices/consumer-price-index"] = list(FILES)
ed, tabs = bm.ipc()
ss = tabs[0]["series"]
check(ed == "2026-06" and len(ss) == 12 and ss[1]["l"]["fr"] == "Nom FR 01" and ss[1]["orig"] == "Naam NL 01" and ss[0]["points"][0] == ["2024-01", 100], "ipc: %s %s" % (ed, ss[1]["l"]))
rows2 = [IH] + rows[1:5]
FILES["https://x/Indexen%20per%20productgroep%20vanaf%202006.xlsx"] = xlsx({"Sheet1": rows2})
try:
    bm.ipc(); check(False, "con pocas series debe fallar")
except RuntimeError:
    pass

# estadisticas: variacion anual y mensual contra el mismo mes del ano anterior
docs = {"ipc.json": bm.doc(tabs if False else [bm.mk_table("ipc-alimentos", "ipc", ["a", "a", "a", "a"], "índice 2025=100", "", [bm.mk_series("be-cpi-01", ["x", "x", "x", "x"], {"2025-%02d" % m: 100 + m for m in range(1, 13)} | {"2026-%02d" % m: 110 + m for m in range(1, 10)} | {"2024-%02d" % m: 90 for m in range(1, 13)})])], "2026-09", "2026-10-23T00:00:00Z"),
        "carne.json": bm.doc([bm.mk_table("carne-production", "carne", ["a", "a", "a", "a"], "t", "", [bm.mk_series("be-carne-production-beef", ["x", "x", "x", "x"], {"2018": 100, "2019": 100, "2020": 100, "2021": 100, "2022": 100, "2023": 110, "2021b": 1}) if False else bm.mk_series("be-carne-production-beef", ["x", "x", "x", "x"], {"2018": 100, "2019": 100, "2020": 100, "2021": 100, "2022": 100, "2023": 110})])], "2023", "2026-10-23T00:00:00Z")}
st = bm.stats(docs, "2026-10-23T00:00:00Z")
ser = {x["id"]: x for x in st["countries"]["BE"]["series"]}
check(ser["be-cpi-01"]["changePct"] == round((119 / 109 - 1) * 100, 2) and ser["be-cpi-01"]["frequency"] == "monthly" and ser["be-cpi-01"]["latestPeriod"] == "2026-09", "variacion mensual sobre el mismo mes: %s" % ser.get("be-cpi-01", {}).get("changePct"))
check(ser["be-carne-production-beef"]["changePct"] == 10.0 and ser["be-carne-production-beef"]["frequency"] == "annual", "variacion anual")

# un bloque que falla conserva lo publicado y se escribe el indice
tmp = Path(tempfile.mkdtemp())
(tmp / "data" / "belgium-more").mkdir(parents=True)
bm.ROOT = tmp; bm.OUT = tmp / "data" / "belgium-more"
old = bm.doc([bm.mk_table("viejo", "g", ["a", "a", "a", "a"], "ha", "", [bm.mk_series("be-x", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])], "2020", "2026-01-02T00:00:00Z")
(bm.OUT / "carne.json").write_text(json.dumps(old), encoding="utf-8")
ok = lambda: ("2026", [bm.mk_table("t", "g", ["a", "a", "a", "a"], "ha", "", [bm.mk_series("be-y", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])])


def boom():
    raise RuntimeError("Statbel caido")


bm.ganado = ok; bm.cosecha = ok; bm.ipc = ok; bm.pesca = ok; bm.lacteos = ok; bm.carne = boom
bm.main()
idx = json.loads((bm.OUT / "index.json").read_text(encoding="utf-8"))
check(len(idx["files"]) == 6, "el indice debe listar los seis ficheros: %d" % len(idx["files"]))
check(json.loads((bm.OUT / "carne.json").read_text(encoding="utf-8"))["tables"][0]["id"] == "viejo", "carne.json debe conservar lo publicado cuando falla")
check((tmp / "data" / "belgium-more-stats.json").exists() and (tmp / "data" / "belgium-more-log.txt").exists(), "estadisticas y registro escritos")
print("ok: test-belgium-more")

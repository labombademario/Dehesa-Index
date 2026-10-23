#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-nl-cbs-more.py con respuestas OData sinteticas: periodos, unidades, claves con relleno de espacios, valores vacios, provisionales,
estadisticas (variacion sobre el mismo trimestre del año anterior) y que un bloque que falla conserve lo publicado."""
import importlib.util, json, sys, tempfile
from pathlib import Path
HERE = Path(__file__).resolve().parent
sp = importlib.util.spec_from_file_location("nm", str(HERE / "update-nl-cbs-more.py")); nm = importlib.util.module_from_spec(sp); sp.loader.exec_module(nm)


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


# periodos
check(nm.period("2026JJ00") == "2026" and nm.period("2026KW02") == "2026-Q2" and nm.period("2026MM08") == "2026-08" and nm.period("2026XX00") is None, "formatos de periodo")
# numeros
check(nm.num(None, 1) is None and nm.num(76078.1, 0.0001) == 7.6078 and nm.num(1000, 0.01) == 10 and isinstance(nm.num(1000, 0.01), int), "num")
# metadatos y datos sinteticos
LAB = nm.LB
FAKE = {}


def fake_get(path, key):
    if key in FAKE:
        return FAKE[key]
    raise RuntimeError("sin respuesta sintetica para " + key)


nm.get = fake_get
nm._props.clear(); nm._raw.clear()
FAKE["props_81302NED"] = {"value": [{"Key": "TomatenTotaal_372", "Title": "Tomaten", "Unit": "are"}, {"Key": "X_1", "Title": "x", "Unit": "ha"}, {"Key": "M_1", "Title": "m", "Unit": "mln kg"}, {"Key": "Z_1", "Title": "z", "Unit": "rareza"}]}
check(nm.conv("81302NED", "TomatenTotaal_372") == ("ha", 0.01) and nm.conv("81302NED", "M_1") == ("kt", 1) and nm.conv("81302NED", "Z_1") == ("rareza", 1) and nm.conv("81302NED", "NOEXISTE") == ("", 1), "conversion de unidades")
# claves con relleno
FAKE["dim_80783NED_RegioS"] = {"value": [{"Key": "NL01    ", "Title": "Nederland"}]}
f = nm.flt("80783NED", RegioS="NL01")
check("NL01%20%20%20%20" in f, "el filtro debe llevar la clave con su relleno: %s" % f)
# bloque de facturacion con claves rellenas, vacios y un tipo desconocido
tn = list(LAB.FARM_TYPES)[:2]
FAKE["props_85159NED"] = {"value": []}
FAKE["per_85159NED"] = {"value": [{"Key": "2025KW02", "Status": "Definitief"}, {"Key": "2026KW01", "Status": "Voorlopig"}, {"Key": "2026KW02", "Status": "Voorlopig"}]}
FAKE["dim_85159NED_Bedrijfstype"] = {"value": [{"Key": tn[0] + "  ", "Title": "Totaal"}, {"Key": tn[1], "Title": "Akker"}]}
FAKE["dim_85159NED_RegioS"] = {"value": [{"Key": "NL01", "Title": "Nederland"}, {"Key": "PV20", "Title": "Groningen (PV)"}]}
FAKE["ti_85159NED"] = {"value": [{"Modified": "2026-09-11T02:00:00"}]}


def rec(g, t, p, om, bd):
    return {"RegioS": g + "    ", "Bedrijfstype": t + "  ", "Perioden": p, "Omzet_2": om, "Bedrijven_1": bd}


for g in LAB.PROVINCES:
    FAKE["t85159_" + g] = {"value": [rec(g, tn[0], "2024KW%02d" % q, 50.0 + q, 9) for q in (1, 2, 3, 4)] + [rec(g, tn[0], "2025KW01", 80.0, 9), rec(g, tn[0], "2025KW02", 100.0, 10), rec(g, tn[0], "2025KW03", 95.0, 10), rec(g, tn[0], "2025KW04", 96.0, 10),
                                  rec(g, tn[0], "2026KW01", 90.5, 11), rec(g, tn[0], "2026KW02", 120.0, 12), rec(g, tn[1], "2026KW02", None, None), rec(g, "A099999", "2026KW02", 5, 5)]}
ed, tabs = nm.omzet()
check(ed == "2026-09-11" and [t["id"] for t in tabs] == ["omzet-tipo", "omzet-anual", "explotaciones-tipo", "omzet-provincia"], "tablas de facturacion: %s" % [t["id"] for t in tabs])
s0 = tabs[0]["series"][0]
check(s0["id"] == "nl-" + tn[0].lower() and s0["points"][-3:] == [["2025-Q4", 96], ["2026-Q1", 90.5], ["2026-Q2", 120]] and s0["provisional"] == ["2026-Q1", "2026-Q2"] and len(s0["points"]) == 10, "serie nacional: %s" % s0)
check(len(tabs[0]["series"]) == 1 and len(tabs[3]["series"]) == 12, "una celda vacia o un tipo desconocido no crea serie (%d / %d)" % (len(tabs[0]["series"]), len(tabs[3]["series"])))
check(set(s0["l"]) == {"en", "fr", "it"} and tabs[0]["l"]["en"], "nombres en cuatro idiomas")
# estadisticas: variacion trimestral sobre el mismo trimestre del año anterior
doc = nm.doc(tabs, ed, "2026-10-23T00:00:00Z")
st = nm.stats({"omzet.json": doc}, "2026-10-23T00:00:00Z")
ss = [x for x in st["countries"]["NL"]["series"] if x["id"] == "nl-omzet-" + tn[0].lower()]
check(len(ss) == 1 and ss[0]["changePct"] == 20.0 and ss[0]["latestPeriod"] == "2026-Q2" and ss[0]["frequency"] == "quarterly", "variacion trimestral sobre el mismo trimestre: %s" % ss)
# ---- RIVM: nitrogeno en Natura 2000 con Excel sinteticos
import io, openpyxl
def xl(sheets):
    wb = openpyxl.Workbook(); wb.remove(wb.active)
    for n, rows in sheets.items():
        ws = wb.create_sheet(n)
        for r in rows: ws.append(r)
    b = io.BytesIO(); wb.save(b); return b.getvalue()
Y = 2024
dep = xl({"DepositieTotaal": [["jaar", "nummer", "gebied", "depositie"], [Y, 0, "Nederland", 1293.9], [Y, 1, "Waddenzee", 1200.5], [Y, 2, "Veluwe", 1500.0], [2030, 2, "Veluwe", 900.0], [2026, 2, "Veluwe", 1400.0]] + [[Y, 10 + i, "Zona %d" % i, 800.0 + i] for i in range(60)],
          "DepositiePerSectorgroep": [["jaar", "nummer", "gebied", "land", "sectorgroep", "depositie"], [Y, 0, "Nederland", "Nederland", "Landbouw", 676.5], [Y, 0, "Nederland", "Nederland", "Mobiliteit", 162.0], [Y, 0, "Nederland", "Duitsland", "Landbouw", 5.0], [Y, 2, "Veluwe", "Nederland", "Landbouw", 700.0]],
          "DepositiePerLand": [["jaar", "nummer", "gebied", "herkomst", "land", "sectorgroep", "depositie"], [Y, 0, "Nederland", "Nederlandse bijdrage", "Nederland", "Totaal", 918.8], [Y, 0, "Nederland", "Overige bijdrage", "-", "Meetcorrectie", -118.2], [Y, 0, "Nederland", "Buitenlandse bijdrage", "Raro", "Totaal", 1.0]]})
ovr = xl({"data": [["nummer", "gebied", "habitattype", "omschrijving", "KDW", "relevant", "jaar", "overbelast", "overbelasting klasse volgnummer", "overbelasting klasse", "oppervlak (ha)", "oppervlak (%)"],
          [2, "Veluwe", "H1", "a", 1000, "ja", Y, "ja", 3, "x", 30.0, 0.3], [2, "Veluwe", "H2", "b", 1000, "ja", Y, "nee", 1, "x", 70.0, 0.7], [2, "Veluwe", "H3", "c", 1000, "nee", Y, "ja", 3, "x", 999.0, 0.0],
          [1, "Waddenzee", "H4", "d", 1000, "ja", Y, "naderend", 2, "x", 10.0, 1.0]]})
nm.rivm_files = lambda: (2026, "dep", "ovr")
nm.rget = lambda url, key, binary=True: dep if url == "dep" else ovr
ed, tabs = nm.natura()
check(ed == "Monitor 2026, año calculado 2024" and [t["id"] for t in tabs] == ["natura-total", "natura-agricultura", "natura-sectores", "natura-origen", "natura-sobrecarga"], "tablas RIVM: %s %s" % (ed, [t["id"] for t in tabs]))
tot = {s["id"]: s for s in tabs[0]["series"]}
check(tot["nl-n2k-2"]["points"] == [["2024", 1500.0]] and tot["nl-n2k-0"]["label"].startswith("Países Bajos"), "total por zona, sin proyecciones ni años distintos: %s" % tot["nl-n2k-2"]["points"])
check({s["id"] for s in tabs[1]["series"]} == {"nl-n2k-ag-0", "nl-n2k-ag-2"} and [s for s in tabs[1]["series"] if s["id"] == "nl-n2k-ag-0"][0]["points"] == [["2024", 676.5]], "agricultura neerlandesa: solo el origen Nederland")
check(sorted(s["id"] for s in tabs[2]["series"]) == ["nl-n2k-sec-Landbouw", "nl-n2k-sec-Mobiliteit"], "sectores")
check(sorted(s["id"] for s in tabs[3]["series"]) == ["nl-n2k-orig--", "nl-n2k-orig-Nederland"] and [s for s in tabs[3]["series"] if s["id"] == "nl-n2k-orig--"][0]["points"] == [["2024", -118.2]], "origen: pais desconocido fuera, correccion negativa conservada")
ov = {s["id"]: s["points"][0][1] for s in tabs[4]["series"]}
check(ov["nl-n2k-over-2"] == 30.0 and ov["nl-n2k-over-1"] == 0.0 and ov["nl-n2k-over-0"] == round(100 * 30.0 / 110.0, 1), "sobrecarga: solo habitats relevantes, ha publicadas: %s" % ov)
check(all(set(s["l"]) == {"en", "fr", "it"} for t in tabs for s in t["series"]), "cuatro idiomas")
sys.path.insert(0, str(HERE)); import contract_tests as CT
errs, warns = [], []
CT.netherlands_more(nm.doc(tabs, ed, "2026-10-23T00:00:00Z", nm.SRC_RIVM), errs, warns, {})
check(not errs, "contrato: %s" % errs)

# un bloque que falla conserva lo publicado
tmp = Path(tempfile.mkdtemp())
(tmp / "data" / "netherlands-more").mkdir(parents=True)
nm.ROOT = tmp; nm.OUT = tmp / "data" / "netherlands-more"
old = nm.doc([nm.mk_table("viejo", ["a", "a", "a", "a"], "ha", "", [nm.mk_series("nl-x", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])], "2026-01-01", "2026-01-02T00:00:00Z")
(nm.OUT / "otros.json").write_text(json.dumps(old), encoding="utf-8")
ok = lambda: ("2026-10-01", [nm.mk_table("t", ["a", "a", "a", "a"], "ha", "", [nm.mk_series("nl-y", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])])


def boom():
    raise RuntimeError("CBS caido")


nm.omzet = ok; nm.horticultura = ok; nm.nitrogeno = ok; nm.cadena = ok; nm.otros = boom; nm.natura = ok
nm.main()
idx = json.loads((nm.OUT / "index.json").read_text(encoding="utf-8"))
check(len(idx["files"]) == 6, "el indice debe listar los seis ficheros: %d" % len(idx["files"]))
check(json.loads((nm.OUT / "otros.json").read_text(encoding="utf-8"))["tables"][0]["id"] == "viejo", "otros.json debe conservar lo publicado cuando falla")
check((tmp / "data" / "netherlands-more-stats.json").exists(), "estadisticas escritas")
print("ok: test-nl-cbs-more")

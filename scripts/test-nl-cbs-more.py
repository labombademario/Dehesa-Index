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
# un bloque que falla conserva lo publicado
tmp = Path(tempfile.mkdtemp())
(tmp / "data" / "netherlands-more").mkdir(parents=True)
nm.ROOT = tmp; nm.OUT = tmp / "data" / "netherlands-more"
old = nm.doc([nm.mk_table("viejo", ["a", "a", "a", "a"], "ha", "", [nm.mk_series("nl-x", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])], "2026-01-01", "2026-01-02T00:00:00Z")
(nm.OUT / "otros.json").write_text(json.dumps(old), encoding="utf-8")
ok = lambda: ("2026-10-01", [nm.mk_table("t", ["a", "a", "a", "a"], "ha", "", [nm.mk_series("nl-y", ["a", "a", "a", "a"], {"2020": 1, "2021": 2})])])


def boom():
    raise RuntimeError("CBS caido")


nm.omzet = ok; nm.horticultura = ok; nm.nitrogeno = ok; nm.cadena = ok; nm.otros = boom
nm.main()
idx = json.loads((nm.OUT / "index.json").read_text(encoding="utf-8"))
check(len(idx["files"]) == 5, "el indice debe listar los cinco ficheros: %d" % len(idx["files"]))
check(json.loads((nm.OUT / "otros.json").read_text(encoding="utf-8"))["tables"][0]["id"] == "viejo", "otros.json debe conservar lo publicado cuando falla")
check((tmp / "data" / "netherlands-more-stats.json").exists(), "estadisticas escritas")
print("ok: test-nl-cbs-more")

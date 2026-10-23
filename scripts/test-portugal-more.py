#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-portugal-more.py con respuestas sinteticas de la API del INE y de su ficha de metadatos: periodos (anual, campana, mes, trimestre,
semestre), guarda de escala (potencia de 10), niveles geograficos sin duplicados (Azores 2/20/200), pesca, incendios por municipio, estadisticas y que un bloque que falla
conserve lo publicado. El contrato de los ficheros se comprueba con scripts/contract_tests.py."""
import importlib.util, json, sys, tempfile
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sp = importlib.util.spec_from_file_location("pm", str(HERE / "update-portugal-more.py")); pm = importlib.util.module_from_spec(sp); sp.loader.exec_module(pm)
import contract_tests as CT
LB = pm.LB


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


# periodos
P = pm.period
check(P("2025") == "2025" and P("1989 / 1990") == "1989/90" and P("1999 / 2000") == "1999/00" and P("September 2026") == "2026-09" and P("4th Quarter 2025") == "2025-Q4"
      and P("1st Semi-annual 1995") == "1995-S1" and P("2nd Semi-annual 2025") == "2025-S2" and P("1989 / 1991") is None and P("Foo 2025") is None, "periodos")
check(sorted(["1999/00", "1998/99", "2000/01"]) == ["1998/99", "1999/00", "2000/01"], "orden de campanas")

# geografia: un nivel que repite el nombre del superior se omite
names = {"PT": "Portugal", "1": "Continente", "2": "Açores", "20": "Açores", "200": "Açores", "15": "Algarve", "150": "Algarve", "1A": "Grande Lisboa", "1A0": "Grande Lisboa", "11": "Norte", "111": "Alto Minho", "1111601": "Arcos"}
k = pm.geo_keep(names)
check(set(k) == {"PT", "1", "2", "15", "1A", "11", "111"}, "geo_keep: %s" % sorted(k))

# API sintetica
DATA = {}
POWER = {}


def api(v, dsg, dados):
    DATA[v] = [{"IndicadorCod": v, "IndicadorDsg": dsg, "DataUltimoAtualizacao": "2026-10-01", "UltimoPref": "2025", "Dados": dados, "Sucesso": "ok"}]


def row(geocod, geodsg, valor, d3=None, d3t=None, prov=False):
    r = {"geocod": geocod, "geodsg": geodsg, "valor": str(valor)}
    if d3t:
        r.update({"dim_3": d3 or d3t, "dim_3_t": d3t})
    if prov:
        r.update({"sinal_conv": "&", "sinal_conv_desc": "Provisional value"})
    return r


def fake_fetch(url, tries=4, binary=False):
    if "minfo.jsp" in url:
        v = url.split("var_cd=")[1]
        return "<td>Measure unit (symbol)</td><td>X (x)</td><td>Power of 10</td><td>&nbsp;%d</td><td>Observations</td>" % POWER.get(v, 0)
    v = url.split("varcd=")[1]
    if v not in DATA:
        raise RuntimeError("sin red: " + v)
    return json.dumps(DATA[v])


pm.fetch = fake_fetch
pm.time.sleep = lambda s: None

# pesca: 4 especies + agregados + puertos; Azores repetido (2 y 20)
yrs = ["2023", "2024", "2025"]
dados = {}
for i, y in enumerate(yrs):
    L = []
    for sp_, base in (("Total", 2.5), ("Sea fish", 2.4), ("Crustaceans", 9.0), ("Molluscs", 3.1), ("Diadromous and freshwater fish", 4.0), ("Other aquatic species", 1.2), ("Other products", 0.9)):
        for gc, gn in (("PT", "Portugal"), ("1", "Continente"), ("2", "Região Autónoma dos Açores"), ("20", "Região Autónoma dos Açores"), ("C03", "Peniche"), ("G03", "Olhão")):
            L.append(row(gc, gn, round(base + i * 0.1 + len(gc) * 0.01, 2), None, sp_))
    # un hueco: el puerto sin dato no aparece
    dados[y] = L
for j in range(100):   # relleno hasta superar el minimo de 100 series
    pass
api("0001066", "Mean value of fish landed", dados)
# el minimo de series de pesca es 100: con 7 especies x 6 geos = 42 no basta, asi que debe fallar y conservar lo publicado
try:
    pm.pesca()
    check(False, "pesca con pocas series debe fallar")
except RuntimeError as e:
    check("solo" in str(e), "mensaje de pesca: %s" % e)
# con muchos puertos si pasa
for y in yrs:
    for n in range(20):
        for sp_ in LB.SPECIES:
            DATA["0001066"][0]["Dados"][y].append(row("Z%02d" % n, "Puerto %d" % n, 3.0 + n / 10.0, None, sp_))
pm._J.clear()
ed, tabs = pm.pesca()
check(len(tabs) == 7 and tabs[0]["id"] == "pesca-total" and tabs[0]["unit"] == "€/kg", "tablas de pesca")
ids = [s["id"] for s in tabs[0]["series"]]
check("pt-pesca-20-total" not in ids and "pt-pesca-2-total" in ids and "pt-pesca-pt-total" in ids and ids[0] == "pt-pesca-pt-total", "pesca sin Azores repetido: %s" % ids[:6])
check(tabs[0]["series"][0]["points"][-1][0] == "2025", "ultimo ano")
check(CT is not None, "contract_tests importado")

# guarda de escala: miles de cabezas esperado 3
api("0000549", "Gross indigenous production of meat - Pig (No.)", {"1st Quarter 2025": [row("PT", "Portugal", 1208)], "2nd Quarter 2025": [row("PT", "Portugal", 1289)], "3rd Quarter 2025": [row("PT", "Portugal", 1314)]})
api("0000548", "Bovine", {"1st Semi-annual 2025": [row("PT", "Portugal", 10, "T", "Total"), row("PT", "Portugal", 4, "22", "Cows")], "2nd Semi-annual 2025": [row("PT", "Portugal", 11, "T", "Total"), row("PT", "Portugal", 5, "22", "Cows")]})
for v in ("0000550", "0000551"):
    api(v, "x", {"1st Semi-annual 2025": [row("PT", "Portugal", 5)], "2nd Semi-annual 2025": [row("PT", "Portugal", 6)]})
for v in ("0000549", "0000548", "0000550", "0000551"):
    POWER[v] = 3
ed, tabs = pm.carne()
check([t["id"] for t in tabs] == ["carne-cerdo", "carne-bovino", "carne-ovino-caprino"] and tabs[0]["unit"] == "miles de cabezas", "carne")
check(tabs[0]["series"][0]["points"] == [["2025-Q1", 1208], ["2025-Q2", 1289], ["2025-Q3", 1314]], "trimestres")
check(tabs[1]["series"][0]["points"][0][0] == "2025-S1", "semestres")
POWER["0000549"] = 0
pm._J.clear()
try:
    pm.carne()
    check(False, "una escala distinta debe rechazarse")
except RuntimeError as e:
    check("escala" in str(e), "mensaje de escala: %s" % e)
POWER["0000549"] = 3
pm._J.clear()

# balances: campanas
camp = {"2023 / 2024": [row("PT", "Portugal", 20.5, None, "Wheat"), row("PT", "Portugal", 80.5, None, "Cereals total")], "2024 / 2025": [row("PT", "Portugal", 21.5, None, "Wheat"), row("PT", "Portugal", 81.5, None, "Cereals total")]}
api("0000182", "Self sufficiency of cereals", camp)
meat = {y: [row("PT", "Portugal", 70 + i, None, m) for m in LB.MEAT] for i, y in enumerate(("2023", "2024", "2025"))}
for v in ("0000212", "0000211"):
    api(v, "meat", meat)
api("0000210", "Human consumption of meat (t)", meat); POWER["0000210"] = 3
api("0000164", "fruit", {"2023 / 2024": [row("PT", "Portugal", 40, None, "Apple")], "2024 / 2025": [row("PT", "Portugal", 41, None, "Apple")]})
api("0000203", "honey", {"2023 / 2024": [row("PT", "Portugal", 70)], "2024 / 2025": [row("PT", "Portugal", 71)]})
api("0000177", "wine hl", {"2023 / 2024": [row("PT", "Portugal", 5331)], "2024 / 2025": [row("PT", "Portugal", 5256)]}); POWER["0000177"] = 3
api("0000178", "wine pc", {"2023 / 2024": [row("PT", "Portugal", 49.1)], "2024 / 2025": [row("PT", "Portugal", 48.5)]})
ed, tabs = pm.balances()
ids = {t["id"]: t for t in tabs}
check("cereales-autoabast" in ids and ids["cereales-autoabast"]["series"][0]["points"][-1][0] == "2024/25", "campanas")
check(ids["wine-consumption"]["unit"] == "miles de hl" and ids["carne-consumo"]["unit"] == "miles de t" and ids["carne-autoabast"]["unit"] == "%", "unidades de balances")
# contrato
for name, tb in (("balances", tabs),):
    errs, warns, st = [], [], {}
    CT.portugal_more(pm.doc(tb, ed, "2026-10-23T00:00:00Z"), errs, warns, st)
    check(not errs, "contrato balances: %s" % errs)

# incendios: municipios (7 digitos) y niveles
def fires(v, cat, scale):
    d = {}
    for y in ("2023", "2024", "2025"):
        L = []
        for gc, gn in (("PT", "Portugal"), ("1", "Continente"), ("11", "Norte"), ("111", "Alto Minho"), ("2", "Açores"), ("20", "Açores"), ("200", "Açores")):
            for c in cat:
                L.append(row(gc, gn, scale * (1 + int(y) % 7), None, c, prov=(y == "2025")))
        for n in range(300):
            for c in cat:
                L.append(row("11%05d" % n, "Concelho %d" % n, (n % 5) * scale, None, c))
        d[y] = L
    api(v, "fires", d)
fires("0013514", list(LB.FIRE_SIZE), 10)
fires("0013510", list(LB.BURNT), 100)
ed, tabs = pm.incendios()
t = {x["id"]: x for x in tabs}
check(set(t) == {"inc-n-tam", "inc-ha-tipo", "inc-n-reg", "inc-ha-reg", "inc-n-mun", "inc-ha-mun"}, "tablas de incendios %s" % sorted(t))
check(len(t["inc-n-mun"]["series"]) == 300 and "pt-fire-n-reg-20" not in [s["id"] for s in t["inc-n-reg"]["series"]], "municipios y regiones")
check(t["inc-n-tam"]["series"][0]["provisional"] == ["2025"], "provisional")
errs, warns, st = [], [], {}
CT.portugal_more(pm.doc(tabs, ed, "2026-10-23T00:00:00Z"), errs, warns, st)
check(not errs, "contrato incendios: %s" % errs)

# bloque que falla conserva lo publicado
tmp = Path(tempfile.mkdtemp())
pm.OUT = tmp / "data" / "portugal-more"
pm.ROOT = tmp
(tmp / "data").mkdir(parents=True)
prev = pm.doc([pm.mk_table("pesca-total", "pesca", ["Anterior", "Previous", "Précédent", "Precedente"], "€/kg", "n", [pm.mk_series("pt-pesca-pt-total", ["Portugal"] * 4, {"2020": 1.0, "2021": 2.0})])], "viejo", "2026-01-01T00:00:00Z")
pm.OUT.mkdir(parents=True)
(pm.OUT / "pesca.json").write_text(json.dumps(prev), encoding="utf-8")
DATA.pop("0014651", None)
for k_ in list(DATA):
    if k_ in ("0001066",):
        DATA[k_] = [{"Dados": {}, "Sucesso": "x"}]   # pesca vacia: falla y conserva
sys.argv = ["x"]
try:
    pm.main()
except SystemExit:
    pass
kept = json.loads((pm.OUT / "pesca.json").read_text(encoding="utf-8"))
check(kept["edition"] == "viejo", "pesca conservada")
check((pm.OUT / "index.json").exists() and (tmp / "data" / "portugal-more-stats.json").exists() and (tmp / "data" / "portugal-more-log.txt").exists(), "indice, estadisticas y registro")
st = json.loads((tmp / "data" / "portugal-more-stats.json").read_text(encoding="utf-8"))
check(st["countries"]["PT"]["extend"] is True and isinstance(st["countries"]["PT"]["series"], list), "estructura de estadisticas")
# estadisticas con series largas: variacion anual y trimestral
pts = {str(2010 + i): 100.0 + i for i in range(14)}
fdoc = pm.doc([pm.mk_table("inc-ha-tipo", "nacional", ["a"] * 4, "ha", "n", [pm.mk_series("pt-fire-ha-pt-total", ["Portugal"] * 4, pts)]),
               pm.mk_table("inc-n-tam", "nacional", ["a"] * 4, "nº", "n", [pm.mk_series("pt-fire-n-pt-total", ["Portugal"] * 4, pts)])], "e", "2026-10-23T00:00:00Z")
qpts = {"%d-Q%d" % (2020 + i // 4, i % 4 + 1): 1000.0 + i for i in range(16)}
cdoc = pm.doc([pm.mk_table("carne-cerdo", "carne", ["a"] * 4, "miles de cabezas", "n", [pm.mk_series("pt-cargross-pig", ["Porcino"] * 4, qpts)])], "e", "2026-10-23T00:00:00Z")
st2 = pm.stats({"incendios.json": fdoc, "carne.json": cdoc}, "2026-10-23T00:00:00Z")
by = {s["id"]: s for s in st2["countries"]["PT"]["series"]}
check(by["pt-incendios-ha"]["changePct"] == round((113 / 112 - 1) * 100, 2) and by["pt-incendios-ha"]["group"] == "environment", "variacion anual de estadisticas")
check(by["pt-carne-bruta-cerdo"]["latestPeriod"] == "2023-Q4" and by["pt-carne-bruta-cerdo"]["changePct"] == round((1015 / 1011 - 1) * 100, 2), "variacion trimestral interanual")
bad = [s["id"] for s in st["countries"]["PT"]["series"] if s["frequency"] not in ("annual", "monthly", "quarterly", "semiannual")]
check(not bad, "frecuencias")
print("test-portugal-more: OK")

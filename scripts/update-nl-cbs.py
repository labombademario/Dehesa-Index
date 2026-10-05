#!/usr/bin/env python3
"""Paises Bajos: cultivos por region, estructura de las explotaciones y censo de ganado por region, sacrificios mensuales e indice de precios agrarios
de Statistics Netherlands (CBS StatLine, OData API) -> data/netherlands-farm.json
Tablas: 85636NED (superficie, rendimiento y produccion por cultivo, provincia y landsdeel, 1994-), 80780NED (explotaciones, uso del suelo y animales por region, 2000-),
7123SLAC (sacrificios mensuales desde 1990), 86125NED (indice de precios de los productos agrarios, trimestral); opcionales: 84499NED (manzana y pera, 1997-) y 7425zuiv (lecherias, mensual 1995-).
Todo se guarda como lo publica el CBS: area en ha (80780: are/100 = ha, conversion exacta), rendimiento en t/ha, produccion en toneladas. Los valores vacios se omiten.
Si una tabla falla, falla todo: no se escribe un fichero a medias. Modo sin red: NL_FIXTURES=<carpeta>."""
import datetime, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://opendata.cbs.nl/ODataApi/odata/"
LOG = []
FIX = os.environ.get("NL_FIXTURES")
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(path, key):
    if FIX: return json.loads((Path(FIX) / (key + ".json")).read_text(encoding="utf-8"))
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + path, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}), timeout=120) as r: return json.loads(r.read().decode("utf-8-sig"))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("CBS %s: %s" % (path, str(last)[:160]))
def rows(path, key):
    out = []; d = get(path, key); out += d["value"]; n = 0
    while d.get("odata.nextLink") and not FIX and n < 50:
        nl = d["odata.nextLink"]; d = get(nl[len(BASE):] if nl.startswith(BASE) else nl, key + "_%d" % n); out += d["value"]; n += 1
    return out
def dim(table, name):
    return {v["Key"].strip(): v["Title"].strip() for v in get("%s/%s" % (table, name), "dim_%s_%s" % (table, name))["value"]}
def periods(table):
    return {v["Key"].strip(): v.get("Status") for v in get("%s/Perioden" % table, "per_%s" % table)["value"]}
def clean(v):
    r = round(v, 4); return int(r) if r == int(r) else r
def ser(d):
    return [[p, clean(v)] for p, v in sorted(d.items())]
# ------------------------------------------------------------ cultivos 85636
def crops(years):
    cn = dim("85636NED", "Gewassen"); rn = dim("85636NED", "RegioS"); st = periods("85636NED")
    data = {}; n = 0
    for y in years:
        for r in rows("85636NED/TypedDataSet?$filter=Perioden%%20eq%%20%%27%dJJ00%%27" % y, "cbs85636_%d" % y):
            c = r["Gewassen"].strip(); g = r["RegioS"].strip()
            if c not in cn or g not in rn: continue
            for fld, m in (("BeteeldeOppervlakte_1", "area"), ("BrutoOpbrengstPerHa_3", "yield"), ("TotaleBrutoOpbrengst_4", "prod")):
                if r.get(fld) is not None: data.setdefault(c, {}).setdefault(g, {}).setdefault(m, {})[str(y)] = r[fld]; n += 1
    log("cultivos", n, "valores")
    prov = sorted(int(k[:4]) for k, v in st.items() if k.endswith("JJ00") and v == "Voorlopig")
    return {"regions": rn, "crops": cn, "data": {c: {g: {m: ser(s) for m, s in ms.items()} for g, ms in gs.items()} for c, gs in data.items()}, "provisional": prov}
# ------------------------------------------------------------ explotaciones y animales 80780
TOP = {"AantalLandbouwbedrijvenTotaal_1": ("farms", 1), "CultuurgrondTotaal_3": ("agri_land", 0.01), "Akkerbouw_4": ("arable", 0.01), "TuinbouwOpenGrond_5": ("horticulture", 0.01),
       "TuinbouwOnderGlas_6": ("greenhouse", 0.01), "GraslandEnGroenvoedergewassen_7": ("grass", 0.01), "RundveeTotaal_468": ("cattle", 1), "MelkEnKalfkoeien2Jaar_484": ("dairy_cows", 1),
       "VleesEnWeidekoeien2Jaar_486": ("beef_cows", 1), "SchapenTotaal_491": ("sheep", 1), "GeitenTotaal_501": ("goats", 1), "VarkensTotaal_575": ("pigs", 1), "KippenTotaal_593": ("chickens", 1),
       "LeghennenTotaal_594": ("laying_hens", 1), "Vleeskuikens_601": ("broilers", 1), "RundveeTotaal_522": ("farms_cattle", 1), "VarkensTotaal_613": ("farms_pigs", 1), "KippenTotaal_631": ("farms_chickens", 1)}
def farms(years):
    rn = {k: v for k, v in dim("80780NED", "RegioS").items() if k == "NL01" or k[:2] in ("LD", "PV")}; st = periods("80780NED")
    data = {}; n = 0
    for y in years:
        for r in rows("80780NED/TypedDataSet?$filter=Perioden%%20eq%%20%%27%dJJ00%%27" % y, "cbs80780_%d" % y):
            g = r["RegioS"].strip()
            if g not in rn: continue
            for fld, (k, f) in TOP.items():
                if fld in r and r[fld] is not None: data.setdefault(k, {}).setdefault(g, {})[str(y)] = r[fld] * f; n += 1
    log("explotaciones", n, "valores")
    prov = sorted(int(k[:4]) for k, v in st.items() if k.endswith("JJ00") and v == "Voorlopig")
    return {"regions": rn, "data": {k: {g: ser(s) for g, s in gs.items()} for k, gs in data.items()}, "provisional": prov}
# ------------------------------------------------------------ sacrificios 7123
SPECIES = {"A028972": "cattle", "A048695": "adult_cattle", "A028975": "cows", "A048698": "heifers", "A028982": "bulls", "A048700": "calves", "A028991": "pigs", "A028984": "sheep", "A028985": "goats", "A028996": "chickens"}
def slaughter():
    nm = dim("7123SLAC", "Slachtdieren"); out = {}; n = 0
    for r in rows("7123SLAC/TypedDataSet", "cbs7123"):
        k = SPECIES.get(r["Slachtdieren"].strip()); m = re.match(r"^(\d{4})MM(\d{2})$", r["Perioden"].strip())
        if not k or not m: continue
        p = "%s-%s" % (m.group(1), m.group(2))
        for fld, u in (("AantalSlachtingen_1", "heads"), ("GeslachtGewicht_2", "weight")):
            if r.get(fld) is not None: out.setdefault(k, {}).setdefault(u, {})[p] = r[fld]; n += 1
    log("sacrificios", n, "valores")
    return {"labels": {SPECIES[c]: nm[c] for c in SPECIES if c in nm}, "data": {k: {u: ser(s) for u, s in us.items()} for k, us in out.items()}}
# ------------------------------------------------------------ indice de precios 86125
LPI = {"A045424": "cereals", "A045437": "sugarbeet", "A053067": "potatoes", "A053077": "cattle", "A053078": "calves", "A045466": "pigs", "A053149": "milk", "A045473": "eggs", "A053079": "chicken"}
def lpi():
    nm = dim("86125NED", "LandbouwInOutputGoederenDiensten"); out = {}; n = 0
    for r in rows("86125NED/TypedDataSet", "cbs86125"):
        k = LPI.get(r["LandbouwInOutputGoederenDiensten"].strip()); m = re.match(r"^(\d{4})KW(\d{2})$", r["Perioden"].strip())
        if not k or not m or r.get("LandbouwprijsindexLPI_1") is None: continue
        out.setdefault(k, {})["%s-Q%d" % (m.group(1), int(m.group(2)))] = r["LandbouwprijsindexLPI_1"]; n += 1
    log("indice de precios", n, "valores")
    return {"base": "2020=100", "labels": {LPI[c]: nm[c] for c in LPI if c in nm}, "data": {k: ser(s) for k, s in out.items()}}
# ------------------------------------------------------------ fruta 84499NED (cosecha y superficie de manzana y pera, anual desde 1997)
FRUIT = {"A041297": "apples", "A041309": "pears"}
def fruit():
    nm = dim("84499NED", "Fruitgewassen"); st = periods("84499NED"); out = {}; n = 0
    for r in rows("84499NED/TypedDataSet", "cbs84499"):
        k = FRUIT.get(r["Fruitgewassen"].strip()); m = re.match(r"^(\d{4})JJ00$", r["Perioden"].strip())
        if not k or not m: continue
        if r.get("Oogst_1") is not None: out.setdefault(k, {}).setdefault("prod", {})[m.group(1)] = r["Oogst_1"] * 1000; n += 1   # mln kg -> toneladas (x1000, exacto)
        if r.get("Teeltoppervlakte_2") is not None: out.setdefault(k, {}).setdefault("area", {})[m.group(1)] = r["Teeltoppervlakte_2"]; n += 1
    log("fruta", n, "valores")
    prov = sorted(int(k[:4]) for k, v in st.items() if k.endswith("JJ00") and v == "Voorlopig")
    return {"labels": {FRUIT[c]: nm[c] for c in FRUIT if c in nm}, "units": {"prod": "tonnes", "area": "ha"}, "data": {k: {u: ser(s) for u, s in us.items()} for k, us in out.items()}, "provisional": prov}
# ------------------------------------------------------------ lacteos 7425zuiv (leche recogida y productos de las lecherias, mensual desde 1995)
DAIRY = {"Hoeveelheid_1": "milk_intake", "Vetgehalte_2": "fat_pct", "Eiwitgehalte_3": "protein_pct", "Boter_4": "butter", "Fabriekskaas_5": "cheese", "MelkpoederTotaal_6": "milk_powder",
         "MagerMelkpoeder_8": "smp", "GecondenseerdeMelk_9": "condensed", "Weipoeder_10": "whey_powder"}
def dairy():
    st = periods("7425zuiv"); out = {}; n = 0
    for r in rows("7425zuiv/TypedDataSet", "cbs7425"):
        m = re.match(r"^(\d{4})MM(\d{2})$", r["Perioden"].strip())
        if not m: continue
        p = "%s-%s" % (m.group(1), m.group(2))
        for fld, k in DAIRY.items():
            if r.get(fld) is not None: out.setdefault(k, {})[p] = r[fld]; n += 1   # 1 000 kg = 1 tonelada; grasa y proteina en %
    log("lacteos", n, "valores; sin dato publicado:", sorted(set(DAIRY.values()) - set(out)))   # el CBS deja la mantequilla vacia: no se rellena
    prov = sorted(k.strip() for k, v in st.items() if "MM" in k and v == "Voorlopig")
    return {"units": {"milk_intake": "tonnes", "fat_pct": "%", "protein_pct": "%", "default": "tonnes"}, "note": "1 000 kg of milk = 971 litres (CBS)", "data": {k: ser(s) for k, s in out.items()}, "provisional": prov}
def optional(fn, name):
    try: return fn()
    except Exception as e: log("AVISO: bloque opcional", name, "no se pudo leer:", type(e).__name__, str(e)[:200]); return None
def build():
    y = datetime.date.today().year
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "NL",
           "source": {"id": "cbs_nl", "name": "Statistics Netherlands (CBS), StatLine open data", "url": "https://opendata.cbs.nl/", "license": "CBS open data: free re-use with source citation",
                      "tables": ["85636NED", "80780NED", "7123SLAC", "86125NED"]},
           "units": {"area": "ha", "yield": "t/ha", "prod": "tonnes", "heads": "thousand head", "weight": "tonnes carcass weight", "animals": "head", "index": "2020=100"}}
    doc["crops"] = crops(range(1994, y + 1)); doc["farms"] = farms(range(2000, y + 1)); doc["slaughter"] = slaughter(); doc["priceIndex"] = lpi()
    for key, fn, tb in (("fruit", fruit, "84499NED"), ("dairy", dairy, "7425zuiv")):   # opcionales: si fallan, el resto se publica igual
        v = optional(fn, key)
        if v: doc[key] = v; doc["source"]["tables"].append(tb)
    return doc
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True)
    try: doc = build()
    except Exception as e:
        import traceback
        log("FALLO:", type(e).__name__, str(e)[:300])
        if os.environ.get("GITHUB_ACTIONS"): print("::error title=nl-cbs::" + (" | ".join(LOG[-6:]) + " | " + traceback.format_exc()[-1500:])[:3500].replace("%", "%25").replace("\r", "").replace("\n", "%0A"), flush=True)
        (outdir / "netherlands-farm-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    c = doc["crops"]["data"]; ok = c.get("A042170", {}).get("NL01", {}).get("prod") and doc["farms"]["data"].get("dairy_cows", {}).get("NL01") and doc["slaughter"]["data"].get("pigs", {}).get("heads") and doc["priceIndex"]["data"]
    if not ok: log("FALLO: faltan bloques esenciales"); (outdir / "netherlands-farm-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")); (outdir / "netherlands-farm.json").write_text(s, encoding="utf-8")
    log("escrito netherlands-farm.json", len(s) // 1024, "KB"); (outdir / "netherlands-farm-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

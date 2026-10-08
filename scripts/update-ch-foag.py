#!/usr/bin/env python3
"""Suiza (FOAG/BLW, Agrarmarktdaten) -> data/switzerland-foag-stats.json (countries.CH)
Fuente: Bundesamt fuer Landwirtschaft BLW / Office federal de l'agriculture OFAG, "Marktzahlen" (cubos RDF en LINDAS, https://lindas.admin.ch/query,
grafo https://lindas.admin.ch/foag/agricultural-market-data; publicados en opendata.swiss).
Licencia: opendata.swiss "Open use. Must provide the source" (https://opendata.swiss/terms-of-use#terms_by): uso comercial permitido citando fuente.
Cada serie lleva la base de IVA tal como la publica FOAG (cost-component) y el nivel de cadena (value-chain-detail); no se suman ni se restan etapas.
Los precios se publican en centimos (Rappen); 1 centimo/kg == 1 CHF/100 kg, asi que los valores numericos de leche se publican tal cual en CHF/100 kg.
Modo desarrollo: CH_OBS_DIR=<carpeta con obs_<cubo>.json y labels_all.json de una sonda> lee ficheros en vez de LINDAS."""
import datetime, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "switzerland-foag-stats.json"
LOG = ROOT / "data" / "switzerland-foag-log.txt"
G = "https://lindas.admin.ch/foag/agricultural-market-data"
NS = "https://agriculture.ld.admin.ch/foag/"
D = NS + "dimension/"
EXTRA = ["market", "product-properties", "product-origin", "usage", "foreign-trade", "cost-component", "value-chain-detail", "key-indicator-type", "product-subgroup", "product-group"]
IDX = {"p": 0, "s": 1, "u": 2, "cur": 3, "d": 4, "v": 5, "vc": 6, "dm": 7, "ds": 8, "sr": 9, "mk": 10, "pp": 11, "po": 12, "us": 13, "ft": 14, "cost": 15, "vcd": 16}
DEV = os.environ.get("CH_OBS_DIR")
log = []
def say(m): log.append(m); print(m)

def sparql(q):
    for k in range(3):
        try:
            req = urllib.request.Request("https://lindas.admin.ch/query", data=urllib.parse.urlencode({"query": q}).encode(),
                                         headers={"Accept": "application/sparql-results+json", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"})
            return json.loads(urllib.request.urlopen(req, timeout=170).read().decode())
        except Exception as e:
            err = e; time.sleep(5 * (k + 1))
    raise err

_labels = None
def labels():
    global _labels
    if _labels is None:
        _labels = {}
        if DEV:
            for i, n, l in json.load(open(os.path.join(DEV, "labels_all.json"))): _labels.setdefault(i, {})[l] = n
        else:
            r = sparql("PREFIX schema: <http://schema.org/> SELECT ?i ?n (LANG(?n) AS ?l) WHERE { GRAPH <%s> { ?i schema:name ?n FILTER(STRSTARTS(STR(?i),'%s') && !STRSTARTS(STR(?i),'%scube')) } }" % (G, NS, NS))
            for b in r["results"]["bindings"]: _labels.setdefault(b["i"]["value"].replace(NS, ""), {})[b["l"]["value"]] = b["n"]["value"]
    return _labels
def lab(i, lang="en"):
    if not i: return ""
    d = labels().get(i, {})
    return d.get(lang) or d.get("en") or d.get("de") or i.split("/")[-1]

_cache = {}
def rows(cube):
    if cube in _cache: return _cache[cube]
    if DEV:
        rs = json.load(open(os.path.join(DEV, "obs_%s.json" % cube.replace("/", "__"))))
    else:
        meas = "price" if "Price" in cube else ("quantity" if "Quantity" in cube else "index")
        opt = " ".join("OPTIONAL { ?o <%s%s> ?%s }" % (D, e, v) for e, v in [("product", "p"), ("production-system", "s"), ("unit", "u"), ("currency", "cur"), ("value-chain", "vc"), ("data-method", "dm"), ("data-source", "ds"), ("sales-region", "sr")] + [(e, "x%d" % k) for k, e in enumerate(EXTRA)])
        q = "PREFIX cube: <https://cube.link/> SELECT * WHERE { GRAPH <%s> { <%scube/%s> cube:observationSet/cube:observation ?o . ?o <%sdate> ?d ; <%smeasure/%s> ?v . %s } }" % (G, NS, cube, D, NS, meas, opt)
        r = sparql(q)
        keys = ["p", "s", "u", "cur", "d", "v", "vc", "dm", "ds", "sr"] + ["x%d" % k for k in range(len(EXTRA))]
        rs = [[b.get(k, {}).get("value", "").replace(NS, "") for k in keys] for b in r["results"]["bindings"]]
    _cache[cube] = rs
    return rs

def period(d):
    m = re.search(r"/time/month/(\d{4})-(\d{2})$", d)
    if m: return "%s-%s" % m.groups(), "monthly"
    m = re.search(r"/time/year/(\d{4})$", d)
    if m: return m.group(1), "annual"
    return None, None

MILK_P = "Milk and dairy products"
# (id, grupo, etiqueta EN, unidad, factor, cubo, filtro)  filtro: p=id producto o etiqueta EN exacta, cost=etiqueta de IVA, origin=etiqueta de origen
S = []
def spec(id, group, label, unit, cube, p, cost=None, origin="Switzerland", factor=1.0, cur=None, usrc=None):
    S.append(dict(id=id, group=group, label=label, unit=unit, cube=cube, p=p, cost=cost, origin=origin, factor=factor, cur=cur, usrc=usrc))
# Leche (mensual): precio al productor "valor realizado", ex-farm; FOAG lo publica con IVA incluido
for pid, key, nm in (("product/271", "total", "Milk, all types"), ("product/272", "dairy-conv", "Milk delivered to dairies, conventional"), ("product/273", "organic", "Organic milk"),
                     ("product/280", "cheese-conv", "Cheese-making milk, conventional"), ("product/312", "ipsuisse", "IP Suisse meadow milk")):
    spec("ch-foag-milk-price-%s" % key, "prices", "%s: producer price (FOAG)" % nm, "CHF/100 kg", "MilkDairyProducts/Production_Price_Month", pid, cost="incl. VAT")
spec("ch-foag-milk-prod-total", "production", "Milk, all types: marketed production (FOAG)", "t", "MilkDairyProducts/Production_Quantity_Month", "product/271", factor=0.001, origin=None)
spec("ch-foag-milk-prod-organic", "production", "Organic milk: marketed production (FOAG)", "t", "MilkDairyProducts/Production_Quantity_Month", "product/273", factor=0.001, origin=None)
# Huevos (mensual): precio al productor ponderado, centimos por huevo
for pid, key, nm in (("product/235", "all", "all production forms"), ("product/234", "barn", "barn"), ("product/229", "freerange", "free range"), ("product/224", "organic", "organic")):
    spec("ch-foag-egg-price-%s" % key, "prices", "Eggs, %s: producer price, weighted average (FOAG)" % nm, "CHF cent/egg", "Eggs/Production_Price_Month", pid, cur="Centime")
# Piensos y subproductos (mensual): precio franco molino / ex-procesadora, sin IVA
for en, key in (("Feed wheat, conv.", "feed-wheat"), ("Feed barley, conv.", "feed-barley"), ("Feed maize, conv.", "feed-maize"), ("Feed oats, conv.", "feed-oats"), ("Triticale, conv.", "feed-triticale"),
                ("Wheat bran, conv.", "feed-wheat-bran"), ("Rapeseed meal, conv.", "feed-rapeseed-meal"), ("Soybean meal, conv.", "feed-soybean-meal")):
    spec("ch-foag-%s" % key, "prices", "%s: processing price (FOAG)" % en.replace(", conv.", ", conventional"), "CHF/100 kg", "Feed/WholesaleProcessing_Price_Month", en, origin=None)
# Cereales panificables (anual): precio bruto al productor, sin IVA
for en, key in (("Top wheat, conv., CH", "topwheat-conv"), ("Wheat, organic, CH", "wheat-organic"), ("Rye, conv., CH", "rye-conv"), ("Spelt, conv., CH", "spelt-conv")):
    spec("ch-foag-cereal-price-%s" % key, "prices", "%s: gross producer price (FOAG)" % en.replace(", CH", "").replace(", conv.", ", conventional"), "CHF/100 kg", "BreadCerealsFlourBakedGoods/Production_Price_Year", en, cost="excl. VAT", origin=None)
# Oleaginosas (anual)
for en, key in (("Rapeseed, conv., CH", "rapeseed-conv"), ("Rapeseed, organic, CH", "rapeseed-organic"), ("Sunflower, conv., CH", "sunflower-conv")):
    spec("ch-foag-oilseed-price-%s" % key, "prices", "%s: producer price (FOAG)" % en.replace(", CH", "").replace(", conv.", ", conventional"), "CHF/100 kg", "Oilseeds/Production_Price_Year", en, origin=None)
for en, key in (("Rapeseed, total", "rapeseed"), ("Sunflower, total", "sunflower"), ("Soybeans, total", "soybeans")):
    spec("ch-foag-oilseed-prod-%s" % key, "crops", "%s: production (FOAG)" % en.replace(", total", ""), "t", "Oilseeds/Production_Quantity_Year", en, origin=None)

# --- Cadena de valor: transformacion (sin IVA) y consumo (con IVA), mensual. Se publican como series separadas: no se restan etapas ---
for pid, key, nm in (("product/288", "butter", "Cooking butter (industrial)"), ("product/289", "smp", "Skimmed milk powder"), ("product/291", "wmp", "Whole milk powder 26%")):
    spec("ch-foag-milk-proc-%s" % key, "prices", "%s: processing price, ex-processing (FOAG)" % nm, "CHF/kg", "MilkDairyProducts/WholesaleProcessing_Price_Month", pid, origin=None)
for pid, key, nm, un in (("product/268", "uht-milk", "Whole milk UHT", "CHF/l"), ("product/292", "past-milk", "Whole milk, pasteurised", "CHF/l"), ("product/283", "cream", "Cream UHT 35%", "CHF/l"),
                         ("product/270", "butter", "Cooking butter", "CHF/kg"), ("product/296", "yogurt", "Plain yoghurt", "CHF/kg"), ("product/316", "emmental", "Emmentaler, mild", "CHF/kg"),
                         ("product/319", "gruyere", "Gruyere, mild", "CHF/kg"), ("product/311", "mozzarella", "Mozzarella", "CHF/kg")):
    spec("ch-foag-milk-retail-%s" % key, "prices", "%s: retail price (FOAG)" % nm, un, "MilkDairyProducts/Consumption_Price_Month", pid, origin=None)
for pid, key, nm in (("product/163", "all", "all production forms"), ("product/152", "barn", "barn"), ("product/142", "freerange", "free range"), ("product/131", "organic", "organic")):
    spec("ch-foag-egg-retail-%s" % key, "prices", "Eggs, %s: retail price, raw (FOAG)" % nm, "CHF cent/egg", "Eggs/Consumption_Price_Month", pid, origin=None, cur="Centime")
for pid, key, nm in (("product/954", "topwheat-conv", "Top wheat, conventional"), ("product/955", "wheat1-conv", "Wheat I, conventional"), ("product/958", "topwheat-ip", "Top wheat, IP Suisse"), ("product/964", "wheat-organic", "Wheat, organic")):
    spec("ch-foag-cereal-mill-%s" % key, "prices", "%s: franco-mill price (FOAG)" % nm, "CHF/100 kg", "BreadCerealsFlourBakedGoods/WholesaleProcessing_Price_Month", pid, origin=None)
spec("ch-foag-cereal-mill-flour", "prices", "Industrial flour, conventional: ex-processing price (FOAG)", "CHF/100 kg", "BreadCerealsFlourBakedGoods/WholesaleProcessing_Price_Month", "product/974", origin=None)
for pid, key, nm in (("product/1299", "rapeseed-oil", "Rapeseed oil, non-organic"), ("product/1300", "sunflower-oil", "Sunflower oil, non-organic")):
    spec("ch-foag-oil-retail-%s" % key, "prices", "%s: retail price (FOAG)" % nm, "CHF/l", "Oilseeds/Consumption_Price_Month", pid, origin=None)

# Carne (anual): oferta total del mercado (produccion suiza mas importaciones), kg de equivalente carne fresca -> t. FOAG no publica un precio mensual de carne con historia.
for en, key, nm in (("Beef - All product groups - Supply", "beef", "Beef"), ("Pork - All product groups - Supply", "pork", "Pork"), ("Poultry - All product groups - Supply", "poultry", "Poultry"),
                    ("Sheep - All product groups - Supply", "sheep", "Sheep meat"), ("Veal - All product groups - Supply", "veal", "Veal"), ("All types of meat - All product groups - Supply", "all", "All meat")):
    spec("ch-foag-meat-supply-%s" % key, "livestock", "%s: market supply, domestic production plus imports (FOAG)" % nm, "t", "MeatMeatProductsSausages/Production_Quantity_Year", en, factor=0.001, origin=None)

# --- Ampliacion (8 oct): piensos compuestos, mas cereales, produccion anual, huevos, leche, proteaginosas, patata importada, otras carnes ---
FEEDS = (("863", "laying-hens-rearing", "Laying hens rearing"), ("864", "laying-hens-1", "Laying hens, 1st phase"), ("865", "laying-hens-2", "Laying hens, 2nd phase"), ("866", "broilers", "Broiler chickens (integration)"),
         ("867", "pigs-pre", "Fattening pigs, pre-fattening"), ("868", "pigs-finish", "Fattening pigs, finishing"), ("869", "sows-pregnant", "Pregnant sows"), ("870", "sows-lactating", "Lactating sows"),
         ("871", "piglets", "Piglet rearing"), ("872", "beef-cattle", "Beef cattle"), ("873", "dairy-energy", "Dairy cattle energy feed"), ("874", "dairy-perf1", "Dairy cattle performance feed 1"),
         ("875", "dairy-perf2", "Dairy cattle performance feed 2"), ("876", "dairy-protein", "Dairy cattle protein concentrate"))
for pid, key, nm in FEEDS:
    spec("ch-foag-compound-%s" % key, "prices", "Compound feed, %s, conventional: processing price (FOAG)" % nm, "CHF/100 kg", "Feed/WholesaleProcessing_Price_Month", "product/" + pid, origin=None)
for pid, key, nm in (("956", "wheat2-conv", "Wheat II, conventional"), ("959", "wheat1-ip", "Wheat I, IP Suisse"), ("960", "wheat2-ip", "Wheat II, IP Suisse"), ("896", "rye-ip", "Rye, IP Suisse"), ("899", "rye-organic", "Rye, organic"),
                     ("962", "spelt-ip", "Spelt, IP Suisse"), ("968", "spelt-organic", "Spelt, organic"), ("1", "wheat-europe", "Wheat, Europe, conventional (import reference)"), ("963", "wheat-organic-europe", "Wheat, organic, Europe (import reference)")):
    spec("ch-foag-cereal-mill-%s" % key, "prices", "%s: franco-mill price (FOAG)" % nm, "CHF/100 kg", "BreadCerealsFlourBakedGoods/WholesaleProcessing_Price_Month", "product/" + pid, origin=None)
for pid, key, nm in (("1410", "top-wheat", "Top wheat"), ("1407", "wheat-1", "Wheat class I"), ("1406", "biscuit-wheat", "Biscuit wheat"), ("1379", "rye", "Rye"), ("1376", "spelt", "Spelt"), ("1385", "food-oats", "Food oats"),
                     ("1382", "food-barley", "Food barley"), ("1397", "durum", "Durum wheat"), ("1372", "buckwheat", "Buckwheat"), ("1371", "quinoa", "Quinoa"), ("1412", "emmer-einkorn", "Emmer and einkorn"),
                     ("1393", "mixed-baking", "Mixed baking cereals"), ("1375", "wheat-organic", "Wheat, organic")):
    spec("ch-foag-cereal-prod-%s" % key, "crops", "%s: production (FOAG)" % nm, "t", "BreadCerealsFlourBakedGoods/Production_Quantity_Year", "product/" + pid)
for pid, key, nm in (("1317", "wheat", "Wheat for feed"), ("1323", "barley", "Feed barley"), ("1335", "maize", "Feed maize"), ("1329", "triticale", "Triticale"), ("1332", "mixed", "Mixed feed cereals")):
    spec("ch-foag-feed-prod-%s" % key, "crops", "%s: production (FOAG)" % nm, "t", "Feed/Production_Quantity_Year", "product/" + pid)
for pid, key, nm in (("1341", "peas", "Protein peas"), ("1366", "fava", "Fava beans"), ("1369", "lupins", "Lupins"), ("1347", "lentils", "Lentils")):
    spec("ch-foag-protein-prod-%s" % key, "crops", "%s: production (FOAG)" % nm, "t", "ProteinCrops/Production_Quantity_Year", "product/" + pid)
for pid, key, nm, org in (("237", "total", "Eggs, total domestic production", "Switzerland"), ("241", "table", "Domestic table eggs, total", "Switzerland"), ("143", "organic", "Organic shell eggs, domestic", "Switzerland"), ("85", "consumption", "Eggs, total consumption (domestic plus imports)", None)):
    spec("ch-foag-egg-prod-%s" % key, "livestock", "%s (FOAG)" % nm, "million pieces", "Eggs/Production_Quantity_Year", "product/" + pid, origin=org)
spec("ch-foag-milk-prod-year-total", "milk", "Milk, all types: marketed production, annual (FOAG)", "t", "MilkDairyProducts/Production_Quantity_Year", "product/271", factor=0.001, origin=None)
spec("ch-foag-milk-prod-year-organic", "milk", "Organic milk: marketed production, annual (FOAG)", "t", "MilkDairyProducts/Production_Quantity_Year", "product/273", factor=0.001, origin=None)
for pid, key, nm in (("1069", "processing", "Potatoes for processing"), ("996", "table", "Table potatoes"), ("1007", "frozen", "Frozen potato products")):
    spec("ch-foag-potato-import-%s" % key, "trade", "%s: imports (FOAG)" % nm, "t", "FruitsVegetablesPotatoes/Import_Quantity_Month", "product/" + pid, origin=None, usrc="t")
for en, key, nm in (("Rabbit - All product groups - Supply", "rabbit", "Rabbit meat"), ("Horse - All product groups - Supply", "horse", "Horse meat"), ("Goat - All product groups - Supply", "goat", "Goat meat")):
    spec("ch-foag-meat-supply-%s" % key, "livestock", "%s: market supply, domestic production plus imports (FOAG)" % nm, "t", "MeatMeatProductsSausages/Production_Quantity_Year", en, factor=0.001, origin=None)

def build_series(sp, diag):
    rs = rows(sp["cube"])
    keep = []
    for r in rs:
        pid = r[IDX["p"]]
        if sp["p"].startswith("product/"):
            if pid != sp["p"]: continue
        elif lab(pid) != sp["p"]: continue
        if sp["origin"] and lab(r[IDX["po"]]) != sp["origin"]: continue
        if sp["cost"] and lab(r[IDX["cost"]]) != sp["cost"]: continue
        if sp["cur"] and lab(r[IDX["cur"]]) != sp["cur"]: continue
        if sp.get("usrc") and lab(r[IDX["u"]]) != sp["usrc"]: continue
        keep.append(r)
    if not keep: return None, "sin filas"
    # una serie = un producto; si hay mas de una base (IVA / etapa) mezclada con fechas solapadas, se rechaza
    byd, combos = {}, {}
    for r in keep:
        per, fr = period(r[IDX["d"]])
        if not per: continue
        key = (lab(r[IDX["cost"]]), lab(r[IDX["vcd"]]), lab(r[IDX["u"]]), lab(r[IDX["cur"]]))
        combos.setdefault(key, set()).add(per)
        byd.setdefault(per, {})[key] = float(r[IDX["v"]])
        sp["_freq"] = fr
    dup = [p for p, m in byd.items() if len({(round(v, 6)) for v in m.values()}) > 1]
    if dup: return None, "valores distintos para el mismo periodo (%d, p. ej. %s): %s" % (len(dup), dup[0], list(byd[dup[0]].items())[:3])
    costs = {k[0] for k in combos}
    if len(costs) > 1: return None, "bases de IVA mezcladas: %s" % sorted(costs)
    units = {(k[2], k[3]) for k in combos}
    if len(units) > 1: return None, "unidades mezcladas: %s" % sorted(units)
    pts = sorted((p, round(next(iter(m.values())) * sp["factor"], 4)) for p, m in byd.items())
    sp["_cost"] = sorted(costs)[0]; sp["_vcd"] = sorted({k[1] for k in combos}); sp["_unitsrc"] = sorted(units)[0]
    return pts, None

today = datetime.date.today()
series, skipped = [], []
for sp in S:
    try: pts, why = build_series(sp, None)
    except Exception as e: pts, why = None, "error: %r" % e
    if not pts or why: skipped.append((sp["id"], why)); say("OMITIDA %s: %s" % (sp["id"], why)); continue
    freq = sp["_freq"]
    last = pts[-1][0]
    if freq == "monthly" and last > today.strftime("%Y-%m"): pts = [p for p in pts if p[0] <= today.strftime("%Y-%m")]
    if freq == "annual" and last > str(today.year): pts = [p for p in pts if p[0] <= str(today.year)]
    if len(pts) < 2: continue
    prev = pts[-2][1]
    note = "FOAG: etapa %s; base de IVA: %s." % (" / ".join(sp["_vcd"]), sp["_cost"])
    if sp["factor"] == 0.001: note += " Convertido de kg a toneladas."
    if sp["unit"] == "CHF/100 kg" and "Milk" in sp["label"]: note += " FOAG publica centimos/kg (1 centimo/kg = 1 CHF/100 kg)."
    series.append({"id": sp["id"], "group": sp["group"], "label": sp["label"], "unit": sp["unit"], "frequency": freq, "latestPeriod": pts[-1][0], "latest": pts[-1][1],
                   "changePct": round((pts[-1][1] - prev) / prev * 100, 1) if prev else None, "points": [[p, v] for p, v in pts], "sourceGroup": "FOAG Marktzahlen", "periodNote": note,
                   "reference": {"source": "FOAG/BLW (Federal Office for Agriculture)", "dataset": sp["cube"].split("/")[0] + " - " + sp["cube"].split("/")[1], "licence": "opendata.swiss: Open use. Must provide the source.", "original": "https://opendata.swiss/en/organization/bundesamt-fur-landwirtschaft-blw"}})
    say("OK %s %d pts %s..%s %s" % (sp["id"], len(pts), pts[0][0], pts[-1][0], note))
doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
       "countries": {"CH": {"name": "Switzerland", "source": {"name": "FOAG/BLW, Agricultural market data (via LINDAS / opendata.swiss)", "url": "https://opendata.swiss/en/organization/bundesamt-fur-landwirtschaft-blw", "license": "Open use. Must provide the source (opendata.swiss)"}, "series": series}},
       "log": log[-60:]}
if not series: print("sin series: no se escribe"); sys.exit(1)
if not DEV or os.environ.get("CH_WRITE"):
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    LOG.write_text("\n".join(log) + "\n", encoding="utf-8")
print("series:", len(series), "omitidas:", len(skipped))
if not DEV or os.environ.get("CH_WRITE"):
    import subprocess
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build-ch-chain.py")], check=True)

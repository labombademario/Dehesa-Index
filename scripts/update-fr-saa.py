#!/usr/bin/env python3
"""Francia: Estadistica agricola anual (SAA, Agreste/SSP), series 2010-2025 por departamento y region
-> data/france-saa/index.json, data/france-saa/reg-<HOJA>.json, data/france-saa/dep-<HOJA>.json y data/france-saa-stats.json (series nacionales y regionales clave para el catalogo).

Fuente: «Statistique agricole annuelle (SAA) - Series longues depuis 2010» (ficha disaron/SAA-SeriesLongues): un zip con dos libros Excel (departamental y regional),
una hoja por tipo de produccion (cereales, forrajes, industriales, patata, hortalizas, fruta, flores, vina, vino, uso del suelo, efectivos, produccion animal, leche, huevos, miel).
Cada fila es area x producto; las columnas son <medida>_<ano>. El ultimo ano es provisional. Los valores se guardan tal cual (ha, q, q/ha, hl, cabezas...): la unica
conversion es q -> t en las series del catalogo (como ya hace france-crops-stats). Una celda vacia es null: nada se estima.
Si la descarga falla (Agreste es intermitente) se conservan los ficheros publicados y el script termina sin error."""
import datetime, io, json, os, re, sys, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import XL, DL, detail_files, fetch, num, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-saa"
FALLBACK = DL + "SAA-SeriesLongues/SAA-SeriesLongues-2010-2025_DonneesProvisoires-DepartementalesRegionales.zip"
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


# hoja -> (titulo, grupo del catalogo nacional, grupo regional, unidad de cada medida)
SHEETS = {
    "COP": ("Cereales, oleaginosas y proteaginosas", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "FOU": ("Cultivos forrajeros y praderas", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "IND": ("Cultivos industriales", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "PDT": ("Patata y tuberculos", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "LEG": ("Hortalizas", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "FRT": ("Frutales", "crops", "crops_regions", {"SURF": "ha", "REND": "q/ha", "PROD": "q"}),
    "FLR": ("Flores y plantas ornamentales", "crops", "crops_regions", {"SURF": "ha"}),
    "VIG": ("Vinedo", "crops", "crops_regions", {"SURF_TOT": "ha", "SURF_PROD": "ha", "REND": "q/ha", "PROD": "q"}),
    "VIN": ("Vino, zumos y mostos", "crops", "crops_regions", {"SURF": "ha", "REND": "hl/ha", "PROD_BLANC": "hl", "PROD_ROUGE": "hl", "PROD_TT": "hl"}),
    "TER": ("Reparto de la superficie agricola", "crops", "crops_regions", {"SURF": "ha"}),
    "EFA": ("Efectivos de bovino, porcino, caprino y ovino a final de ano", "livestock", "livestock", {"EFF": "heads"}),
    "EFV": ("Efectivos de aves y conejas a final de ano", "livestock", "livestock", {"EFF": "thousand heads"}),
    "EQU": ("Efectivos de equidos a final de ano", "livestock", "livestock", {"EFF": "heads"}),
    "PRA": ("Animales finalizados: bovino, porcino, caprino y ovino", "livestock", "livestock", {"NBTETE": "heads", "POIDS_MOY": "kg/head", "PROD": "t carcass"}),
    "PRV": ("Animales finalizados: aves y conejos", "livestock", "livestock", {"NBTETE": "thousand heads", "POIDS_MOY": "g", "PROD": "t carcass"}),
    "PRA_": None,
    "LAI": ("Produccion de leche y uso en la explotacion", "milk", "milk_regions", {"LAIT": "hl"}),
    "OEU": ("Produccion de huevos de las granjas profesionales", "livestock", "livestock", {"POND": "thousand hens", "PRODUCTION": "thousand eggs", "PROD_MOY": "eggs/hen/year"}),
    "MIE": ("Apicultura de los agricultores", "production", "livestock", {"RUCHE": "hives", "RECOLTE": "kg", "PROD_MOY": "kg/hive"}),
}
SHEETS.pop("PRA_")
MLAB = {"SURF": "Area", "SURF_TOT": "Total area", "SURF_PROD": "Area in production", "REND": "Yield", "PROD": "Production", "PROD_BLANC": "White wine production", "PROD_ROUGE": "Red and rose wine production",
        "PROD_TT": "Total wine production", "EFF": "Headcount", "NBTETE": "Animals slaughtered or finished", "POIDS_MOY": "Average weight", "LAIT": "Milk", "POND": "Laying hens", "PRODUCTION": "Egg production",
        "PROD_MOY": "Average yield", "RUCHE": "Hives", "RECOLTE": "Honey harvest"}
# (hoja, codigo de producto, nombre en ingles, medidas que se publican en el catalogo; None = todas las de la hoja)
KEY = [
    ("COP", "03", "Soft wheat"), ("COP", "06", "Durum wheat"), ("COP", "10", "Barley"), ("COP", "13", "Oats"), ("COP", "18", "Grain maize and seed maize"), ("COP", "20", "Triticale"),
    ("COP", "23", "Cereals excluding rice"), ("COP", "27", "All cereals"), ("COP", "31", "Rapeseed"), ("COP", "32", "Sunflower"), ("COP", "33", "Soybean"), ("COP", "36", "Oilseeds, total"),
    ("COP", "38", "Faba beans"), ("COP", "41", "Protein peas"),
    ("FOU", "06", "Silage maize"), ("FOU", "13", "Temporary and artificial grassland"), ("FOU", "17", "Permanent grassland"), ("FOU", "18", "All grassland"),
    ("IND", "01", "Sugar beet"), ("IND", "04", "Hemp"), ("IND", "05", "Fibre flax"),
    ("PDT", "01", "Certified seed potatoes"), ("PDT", "03", "Starch potatoes"), ("PDT", "06", "Ware potatoes (early and main crop)"), ("PDT", "07", "Potatoes"),
    ("LEG", "04", "Cauliflower"), ("LEG", "12", "Leeks"), ("LEG", "13", "Lettuce"), ("LEG", "23", "Strawberries"), ("LEG", "28", "Cucumbers"), ("LEG", "34", "Melons"), ("LEG", "41", "Tomatoes"),
    ("LEG", "46", "Carrots"), ("LEG", "51", "Coloured onions"), ("LEG", "54", "Garden peas"), ("LEG", "56", "Green beans"),
    ("FRT", "01", "Apricots"), ("FRT", "04", "Cherries"), ("FRT", "08", "Peaches and nectarines"), ("FRT", "14", "Plums"), ("FRT", "17", "Olives"), ("FRT", "19", "Cider apples"),
    ("FRT", "26", "Table pears"), ("FRT", "31", "Table apples"), ("FRT", "33", "Almonds"), ("FRT", "35", "Walnuts"), ("FRT", "39", "Kiwifruit"),
    ("FLR", "01", "Flower bulbs"), ("FLR", "02", "Flower nurseries"), ("FLR", "03", "Cut flowers and foliage"), ("FLR", "04", "Pot plants"),
    ("VIG", "03", "Vineyards, total"), ("VIN", "03", "AOP wine"), ("VIN", "05", "PGI wine"), ("VIN", "11", "Wine, total"),
    ("TER", "21", "Arable land"), ("TER", "27", "Permanent grassland on holdings"), ("TER", "28", "Utilised agricultural area of holdings"),
    ("EFA", "01", "Dairy cows"), ("EFA", "02", "Suckler cows"), ("EFA", "03", "All cows"), ("EFA", "20", "Cattle, total"), ("EFA", "26", "Pigs, total"), ("EFA", "23", "Sows"),
    ("EFA", "30", "Goats, total"), ("EFA", "32", "Breeding ewes"), ("EFA", "35", "Sheep, total"),
    ("EFV", "02", "Laying hens for consumption eggs"), ("EFV", "04", "Broilers"), ("EFV", "05", "Chickens, total"), ("EFV", "08", "Turkeys"), ("EFV", "12", "Breeding does (rabbits)"),
    ("EQU", "05", "Equids, total"),
    ("PRA", "03", "Cull cows"), ("PRA", "19", "Cattle, total"), ("PRA", "23", "Pigs, total"), ("PRA", "26", "Goats, total"), ("PRA", "29", "Sheep, total"),
    ("PRV", "02", "Broilers"), ("PRV", "03", "Fattened ducks"), ("PRV", "06", "Turkeys"), ("PRV", "12", "Rabbits"),
    ("LAI", "01", "Cow milk delivered to industry"), ("LAI", "05", "Cow milk, final production"), ("LAI", "10", "Goat milk, final production"), ("LAI", "15", "Ewe milk, final production"),
    ("OEU", "01", "Table eggs"), ("OEU", "02", "Hatching eggs"), ("MIE", "01", "Honey"),
]
KEYSET = {(s, c): n for s, c, n in KEY}
DOM = {"01", "02", "03", "04", "06"}


def split_code(s):
    m = re.match(r"^\s*([0-9A-Za-z]+)\s*-\s*(.*?)\s*$", s or "")
    return (m.group(1), re.sub(r"\s+", " ", m.group(2))) if m else (None, None)


def parse_sheet(rows, level):
    rows = iter(rows)
    hdr = None
    for r in rows:
        if r and r[0].strip() == "LIB_REG2":
            hdr = r
            break
    if not hdr:
        raise ValueError("sin cabecera LIB_REG2")
    ci = {h: i for i, h in enumerate(hdr)}
    metric_cols = {}
    for i, h in enumerate(hdr):
        m = re.match(r"^(.*)_(\d{4})$", h)
        if m:
            metric_cols.setdefault(m.group(1), {})[int(m.group(2))] = i
    years = sorted({y for d in metric_cols.values() for y in d})
    prods, areas, deps = {}, {}, {}
    for r in rows:
        if not r or len(r) < 3 or not r[ci["LIB_SAA"]]:
            continue
        pc, pn = split_code(r[ci["LIB_SAA"]])
        rc, rn = split_code(r[ci["LIB_REG2"]])
        if pc is None or rc is None:
            continue
        if level == "dep":
            dc, dn = split_code(r[ci["LIB_DEP"]])
            if dc is None:
                continue
            areas[dc] = dn
            deps[dc] = rc
            areas["r" + rc] = rn
            ac = dc
        else:
            ac = rc
            areas[ac] = rn
        d = {}
        if "STATUT_QUALITE" in ci and ci["STATUT_QUALITE"] < len(r) and r[ci["STATUT_QUALITE"]] != "":
            d["q"] = r[ci["STATUT_QUALITE"]]
        for mname, cols in metric_cols.items():
            vals = [num(r[cols[y]]) if y in cols and cols[y] < len(r) else None for y in years]
            if any(v is not None for v in vals):
                d[mname] = vals
        p = prods.setdefault(pc, {"c": pc, "n": pn, "d": {}})
        p["d"][ac] = d
    return {"years": years, "metrics": list(metric_cols), "products": list(prods.values()), "areas": areas, "regionOf": deps}


def discover():
    try:
        urls, _ = detail_files("SAA-SeriesLongues", log)
        u = pick(urls, r"SAA-SeriesLongues.*\.zip$")
        if u:
            return quote_url(u)
    except Exception as e:
        log("ficha SAA no legible (%s): se usa la URL conocida" % str(e)[:100])
    return FALLBACK


def stats_series(reg_docs, now):
    """Series del catalogo: nacional (001) y regionales (regiones metropolitanas y DOM) de los productos clave. Produccion q -> t."""
    series = []
    for sh, doc in reg_docs.items():
        title, gnat, greg, units = SHEETS[sh]
        years = doc["years"]
        for p in doc["products"]:
            en = KEYSET.get((sh, p["c"]))
            if not en:
                continue
            for ac, d in p["d"].items():
                nat = ac == "001"
                if not nat and ac in ("002",):
                    continue
                for mname in doc["metrics"]:
                    vals = d.get(mname)
                    if not vals:
                        continue
                    pts = [[str(y), v] for y, v in zip(years, vals) if v is not None]
                    if len(pts) < 2:
                        continue
                    unit = units.get(mname, "")
                    if unit == "q":
                        pts, unit = [[y, round(v / 10.0, 3)] for y, v in pts], "t"
                    elif unit == "hl":
                        pass
                    last, prev = pts[-1][1], pts[-2][1]
                    area_name = "France" if nat else doc["areas"][ac]
                    aid = "nat" if nat else "r" + ac
                    series.append({"id": ("fr-saa-%s-%s%s-%s" % (aid, sh.lower(), p["c"], mname.lower().replace("_", "-"))), "group": gnat if nat else greg,
                                   "label": "%s: %s, %s (SAA)" % (MLAB.get(mname, mname), en, area_name), "unit": unit, "frequency": "annual", "latestPeriod": pts[-1][0],
                                   "latest": last, "changePct": round((last / prev - 1) * 100, 2) if prev else None, "points": pts, "sourceGroup": "agreste-saa"})
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": {"name": "Agreste (SSP) - Statistique agricole annuelle, series longues depuis 2010", "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/SAA-SeriesLongues/detail/", "license": "Licence Ouverte 2.0 (Etalab)"}, "series": series}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        url = discover()
        log("descargando", url)
        z = zipfile.ZipFile(io.BytesIO(fetch(url, "bin", tries=6, wait=25, timeout=240, log=log)))
    except Exception as e:
        log("DESCARGA FALLIDA, se conserva lo publicado:", str(e)[:200])
        (ROOT / "data" / "france-saa-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    names = z.namelist()
    reg_n = next((n for n in names if re.search(r"region", n, re.I) and n.endswith(".xlsx")), None)
    dep_n = next((n for n in names if re.search(r"d.partement", n, re.I) and n.endswith(".xlsx")), None)
    if not reg_n or not dep_n:
        log("el zip no trae los dos libros esperados:", names)
        sys.exit(1)
    index = {"schemaVersion": 1, "generatedAt": now, "source": {"name": "Agreste (SSP) - Statistique agricole annuelle, series longues depuis 2010", "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/SAA-SeriesLongues/detail/", "license": "Licence Ouverte 2.0 (Etalab)", "file": url.split("/")[-1]},
             "sheets": {}, "regions": {}, "departments": {}}
    reg_docs = {}
    for level, member in (("reg", reg_n), ("dep", dep_n)):
        x = XL(z.read(member))
        for sh in x.names():
            if sh not in SHEETS:
                if sh != "Sommaire":
                    log("hoja nueva sin describir, se ignora:", level, sh)
                continue
            try:
                doc = parse_sheet(x.rows(sh), level)
            except Exception as e:
                log("hoja ilegible", level, sh, str(e)[:100])
                continue
            title = SHEETS[sh][0]
            out = {"schemaVersion": 1, "generatedAt": now, "level": "region" if level == "reg" else "department", "sheet": sh, "title": title, "units": SHEETS[sh][3], "metrics": doc["metrics"], "years": doc["years"],
                   "provisionalYear": doc["years"][-1], "areas": doc["areas"], "products": doc["products"]}
            if level == "dep":
                out["regionOf"] = doc["regionOf"]
            if level == "reg":
                reg_docs[sh] = out
                for k, v in doc["areas"].items():
                    index["regions"][k] = v
            else:
                for k, v in doc["areas"].items():
                    if not k.startswith("r"):
                        index["departments"][k] = {"name": v, "region": doc["regionOf"].get(k)}
            (OUT / ("%s-%s.json" % (level, sh))).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            e = index["sheets"].setdefault(sh, {"title": title, "units": SHEETS[sh][3], "levels": [], "years": doc["years"], "products": {}})
            e["levels"].append("region" if level == "reg" else "department")
            for p in doc["products"]:
                e["products"][p["c"]] = p["n"]
            log("ok", level, sh, len(doc["products"]), "productos", len(doc["areas"]), "areas")
    if not reg_docs or "COP" not in reg_docs:
        log("sin hoja regional COP: no se publica nada")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats_series(reg_docs, now)
    n = len(st["countries"]["FR"]["series"])
    if n < 400:
        log("pocas series de catalogo (%d): no se escribe france-saa-stats.json" % n)
        sys.exit(1)
    (ROOT / "data" / "france-saa-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("series de catalogo:", n)
    miss = [k for k in KEYSET if not any(p["c"] == k[1] for p in reg_docs.get(k[0], {"products": []})["products"])]
    if miss:
        log("productos clave que ya no existen en la fuente:", miss)
    (ROOT / "data" / "france-saa-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Producción, sacrificio, cultivos y exportaciones por país (no precios): Dinamarca (Statistics Denmark, CC BY 4.0),
Países Bajos (CBS StatLine, CC BY 4.0) y Australia (ABS, CC BY 4.0). Escribe data/country-stats.json.
Cada serie se pide por separado: si una falla o viene vacía, se omite y se anota; nunca se rellena."""
import csv, io, json, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
log = []

def http(url, body=None, headers=None, timeout=180):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=body, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8-sig", "replace")

def norm_period(p):
    p = str(p)
    if "M" in p and len(p) == 7 and p[4] == "M": return p[:4] + "-" + p[5:]
    if len(p) == 8 and p[4:6] == "MM": return p[:4] + "-" + p[6:]
    if len(p) == 8 and p[4:6] == "JJ": return p[:4]
    if len(p) == 6 and p[4] in ("Q", "K"): return p[:4] + "-Q" + p[5]
    return p

def mk(id_, label, unit, freq, pts, group, note=None):
    pts = sorted((norm_period(p), v) for p, v in pts if v is not None)
    if len(pts) < 3:
        log.append("OMITIDA " + id_ + " (menos de 3 puntos)")
        return None
    prev = pts[-2][1]
    return {"id": id_, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": pts[-1][0], "latest": pts[-1][1],
            "changePct": round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, "points": [[p, v] for p, v in pts], **({"note": note} if note else {})}

countries = {}

# ---------------- Dinamarca ----------------
def dst(table, var_codes, unit_var=None):
    vars_ = [{"code": c, "values": v} for c, v in var_codes]
    vars_.append({"code": "Tid", "values": ["*"]})
    body = json.dumps({"table": table, "format": "CSV", "lang": "en", "valuePresentation": "Code", "variables": vars_}).encode()
    rows = list(csv.DictReader(io.StringIO(http("https://api.statbank.dk/v1/data", body, {"Content-Type": "application/json"})), delimiter=";"))
    out = []
    for r in rows:
        v = r.get("INDHOLD", "").replace(",", ".").strip()
        if v and v not in ("..", "-"):
            out.append((r["TID"], float(v)))
    return out

dk = []
for id_, label, unit, tbl, vs, group in [
    ("dk-cattle-prod", "Cattle: meat production (total)", "million kg", "ANI41", [("DYRKAT", ["KVAEGIALT"]), ("ENHED", ["PROD"])], "production"),
    ("dk-cattle-slaught", "Cattle: slaughterings and live exports (total)", "1,000 head", "ANI41", [("DYRKAT", ["KVAEGIALT"]), ("ENHED", ["SLAGEKS"])], "production"),
    ("dk-pig-prod", "Pigs: meat production (total)", "million kg", "ANI51", [("DYRKAT", ["SVINIALT"]), ("ENHED", ["PROD"])], "production"),
    ("dk-pig-slaught", "Pigs: slaughterings and live exports (total)", "1,000 head", "ANI51", [("DYRKAT", ["SVINIALT"]), ("ENHED", ["SLAGEKS"])], "production"),
    ("dk-milk-prod", "Milk ex farm, total", "million kg", "ANI71", [("MÆNGDE4", ["MAELK1"])], "production"),
    ("dk-butter-prod", "Butter production", "million kg", "ANI71", [("MÆNGDE4", ["PROD4"])], "production"),
    ("dk-cheese-prod", "Cheese production", "million kg", "ANI71", [("MÆNGDE4", ["PROD6"])], "production"),
]:
    try:
        s = mk(id_, label, unit, "monthly", dst(tbl, vs), group)
        if s: dk.append(s)
    except Exception as e:
        log.append("ERROR DK " + id_ + ": " + str(e)[:160])

def dst_values(table, var):
    info = json.loads(http("https://api.statbank.dk/v1/tableinfo", json.dumps({"table": table, "format": "JSON", "lang": "en"}).encode(), {"Content-Type": "application/json"}))
    for v in info["variables"]:
        if v["id"] == var:
            return [(x["id"], x["text"]) for x in v["values"]]
    return []

def first_match(vals, rx, must=None):
    import re
    for i, t in vals:
        if re.search(rx, t, re.I) and (must is None or must in t):
            return i, t
    return None, None

def add(list_, id_, label, unit, freq, fetch, group, note=None):
    try:
        s = mk(id_, label, unit, freq, fetch(), group, note)
        if s: list_.append(s)
        else: log.append("VACIA " + id_)
    except Exception as e:
        log.append("ERROR " + id_ + ": " + str(e)[:160])

# aves (trimestral) y huevos (trimestral)
for code, id_, label, unit, enh in [("FJERKRIALT", "dk-poultry-prod", "Poultry: meat production (total)", "million kg", "PROD"), ("FJERKRIALT", "dk-poultry-slaught", "Poultry: slaughterings (total)", "1,000 head", "SLAGEKS"), ("KYLLING", "dk-chicken-slaught", "Chickens: slaughterings", "1,000 head", "SLAGEKS")]:
    add(dk, id_, label, unit, "quarterly", lambda c=code, e=enh: dst("ANI61", [("DYRKAT", [c]), ("ENHED", [e])]), "production")
add(dk, "dk-chicken-quote", "Chickens: quotation (live weight)", "DKK øre/kg", "quarterly", lambda: dst("ANI61", [("DYRKAT", ["KYLLING"]), ("ENHED", ["PRISKYL"])]), "prices")
for code, id_, label in [("KON3", "dk-eggs-consumption", "Eggs for consumption, total"), ("BUR", "dk-eggs-caged", "Eggs: caged layers"), ("FRIT", "dk-eggs-freerange", "Eggs: free-range"), ("SKRAB", "dk-eggs-litter", "Eggs: deep litter"), ("OKOAEG", "dk-eggs-organic", "Eggs: organic")]:
    add(dk, id_, label, "million kg", "quarterly", lambda c=code: dst("ANI81", [("ENHED", [c])]), "production")
# cultivos: superficie por cultivo (AFG6, hectáreas, total explotaciones)
try:
    crops = dst_values("AFG6", "AFGRØDE")
    for rx, key, label in [(r"common wheat$|^1\.1 common wheat", "wheat", "Wheat"), (r"^1\.2 barley", "barley", "Barley"), (r"^1\.3 rye", "rye", "Rye"), (r"^1\.4 oats", "oats", "Oats"), (r"grain maize", "maize", "Grain maize"), (r"rape", "rape", "Rapeseed"), (r"potatoes", "potatoes", "Potatoes"), (r"sugar beet", "sugarbeet", "Sugar beet")]:
        cid, ctext = first_match(crops, rx)
        if not cid:
            log.append("AFG6 sin cultivo para " + key); continue
        add(dk, "dk-area-" + key, label + ": area (" + ctext[:40] + ")", "ha", "annual", lambda c=cid: dst("AFG6", [("AFGRØDE", [c]), ("ENHED", ["HA"]), ("AREAL1", ["AIALT"])]), "crops")
except Exception as e:
    log.append("ERROR DK AFG6: " + str(e)[:160])
# previsión de cosecha de invierno (superficie cosechada)
for cid, key, label in [("H110", "winter-wheat", "Winter wheat"), ("H150", "winter-barley", "Winter barley"), ("H210", "winter-rape", "Winter rapeseed")]:
    add(dk, "dk-harvarea-" + key, label + ": harvested area", "1,000 ha", "annual", lambda c=cid: dst("HST5", [("AFGRØDE", [c]), ("ENHED", ["4A"])]), "crops")
# precio de cebada y trigo en granja, total Dinamarca (anual)
for cid, key, label in [("HVEDE", "wheat", "Wheat"), ("BYG", "barley", "Barley")]:
    add(dk, "dk-farmgate-" + key, label + ": farm gate price (all Denmark, KAPIT1)", "DKK per 100 kg (table KAPIT1)", "annual", lambda c=cid: dst("KAPIT1", [("KAPIT", ["000"]), ("KORNART", [c])]), "prices")
# costes de explotación (JORD1, agricultura, media, DKK por explotación)
try:
    items = dst_values("JORD1", "REGNSKPOSTER")
    for rx, key, label in [(r"fertili[sz]ers? \(costs\)", "fert", "Fertiliser"), (r"feed stuffs? \(costs\)", "feed", "Feed"), (r"seeds? \(costs\)", "seed", "Seed"), (r"pesticides? \(costs\)|plant protection", "pest", "Pesticides"), (r"(energy|fuel).*\(costs\)", "energy", "Energy and fuel"), (r"(wages|hired labour).*\(costs\)", "wages", "Hired labour"), (r"^[\d.]+\s*(total )?(output|revenue|turnover)", "revenue", "Output / revenue"), (r"net profit", "netprofit", "Net profit")]:
        cid, ctext = first_match(items, rx, "DKK 1 000")
        if not cid:
            log.append("JORD1 sin partida para " + key); continue
        add(dk, "dk-farm-" + key, "Farm accounts: " + ctext[:60], "DKK 1,000 per farm (average, agricultural holdings)", "annual", lambda c=cid: dst("JORD1", [("BEDRIFTSTAND", ["1"]), ("KVARTIL", ["1000"]), ("REGNSKPOSTER", [c])]), "costs")
except Exception as e:
    log.append("ERROR DK JORD1: " + str(e)[:160])
# precios de insumos (LPRIS38, anual)
try:
    inp = dst_values("LPRIS38", "PRODUKT")
    n = 0
    import re
    for i, t in inp:
        if re.search(r"fertili[sz]er|nitrogen|npk|lime|diesel|gas oil|feed|pesticide|herbicide|fungicide", t, re.I) and n < 14:
            n += 1
            add(dk, "dk-input-" + i, t, "DKK (unit as in source label)", "annual", lambda c=i: dst("LPRIS38", [("PRODUKT", [c]), ("ENHED", ["320"])]), "inputs")
    log.append("LPRIS38 insumos elegidos: " + str(n))
except Exception as e:
    log.append("ERROR DK LPRIS38: " + str(e)[:160])

countries["DK"] = {"name": "Denmark", "source": {"name": "Statistics Denmark (StatBank)", "url": "https://www.statbank.dk/", "license": "CC BY 4.0"}, "series": dk}

# ---------------- Países Bajos ----------------
def cbs(table, filt, cols):
    url = "https://opendata.cbs.nl/ODataApi/odata/%s/TypedDataSet?$format=json%s" % (table, filt)
    out = {c: [] for c in cols}
    while url:
        d = json.loads(http(url))
        for r in d["value"]:
            for c in cols:
                if r.get(c) is not None:
                    out[c].append((r["Periods"], float(r[c])))
        url = d.get("odata.nextLink")
    return out

nl = []
try:
    m = cbs("7425eng", "", ["Volume_1", "Cheese_5", "Butter_4"])
    for c, id_, label, unit in [("Volume_1", "nl-milk-supply", "Milk supply to dairy factories", "1,000 kg"), ("Cheese_5", "nl-cheese-prod", "Cheese production (dairy factories)", "1,000 kg"), ("Butter_4", "nl-butter-prod", "Butter production (dairy factories)", "1,000 kg")]:
        s = mk(id_, label, unit, "monthly", [(p, v) for p, v in m[c] if p[4:6] == "MM"], "production")
        if s: nl.append(s)
except Exception as e:
    log.append("ERROR NL milk: " + str(e)[:160])
for code, key, label in [("A042170", "wheat", "Wheat"), ("A042160", "barley", "Barley"), ("A042180", "rapeseed", "Rapeseed"), ("A042355", "potatoes", "Potatoes"), ("A042194", "sugarbeet", "Sugar beet"), ("A042167", "grain-maize", "Grain maize")]:
    try:
        m = cbs("85636ENG", "&$filter=ArableCrops%20eq%20%27" + code + "%27%20and%20Regions%20eq%20%27NL01%27", ["GrossYieldTotal_4", "AreaUnderCultivation_1", "GrossYieldPerHa_3"])
        ann = lambda pts: [(p, v) for p, v in pts if p.endswith("JJ00")]
        for col, sfx, lab, unit in [("GrossYieldTotal_4", "prod", "production", "1,000 kg"), ("AreaUnderCultivation_1", "area", "area under cultivation", "ha"), ("GrossYieldPerHa_3", "yield", "gross yield per ha", "1,000 kg/ha")]:
            s = mk("nl-%s-%s" % (key, sfx), label + ": " + lab, unit, "annual", ann(m[col]), "crops")
            if s: nl.append(s)
    except Exception as e:
        log.append("ERROR NL crop " + key + ": " + str(e)[:160])

def cbs_titles(table, dim):
    d = json.loads(http("https://opendata.cbs.nl/ODataApi/odata/%s/%s?$format=json" % (table, dim)))
    return {x["Key"].strip(): x["Title"] for x in d["value"]}
try:
    animals = cbs_titles("84952ENG", "FarmAnimals")
    rows = json.loads(http("https://opendata.cbs.nl/ODataApi/odata/84952ENG/TypedDataSet?$format=json&$top=5000"))["value"]
    by = {}
    for r in rows:
        if r.get("Livestock_1") is not None:
            by.setdefault(r["FarmAnimals"].strip(), []).append((r["Periods"], float(r["Livestock_1"])))
    for k, pts in list(by.items())[:40]:
        s = mk("nl-animals-" + k, "Livestock on holdings: " + animals.get(k, k), "x 1,000 head", "semiannual", pts, "livestock", "1 April and 1 December")
        if s: nl.append(s)
except Exception as e:
    log.append("ERROR NL animals: " + str(e)[:160])
try:
    mt = cbs_titles("83981ENG", "ManureAndNutrients")
    rows = json.loads(http("https://opendata.cbs.nl/ODataApi/odata/83981ENG/TypedDataSet?$format=json&$top=5000"))["value"]
    for col, lab in [("TotalExcretion_1", "total excretion"), ("AmmoniaEmissionsN_5", "ammonia emissions (N)"), ("UseOfLivestockManureInAgriculture_14", "use in agriculture")]:
        by = {}
        for r in rows:
            if r.get(col) is not None:
                by.setdefault(r["ManureAndNutrients"].strip(), []).append((r["Periods"], float(r[col])))
        for k, pts in list(by.items())[:3]:
            s = mk("nl-manure-%s-%s" % (col.split("_")[0].lower(), k), "Livestock manure (" + mt.get(k, k) + "): " + lab, "million kg", "annual", pts, "environment")
            if s: nl.append(s)
except Exception as e:
    log.append("ERROR NL manure: " + str(e)[:160])

countries["NL"] = {"name": "Netherlands", "source": {"name": "Statistics Netherlands (CBS StatLine)", "url": "https://opendata.cbs.nl/", "license": "CC BY 4.0"}, "series": nl}

# ---------------- Australia ----------------
def abs_csv(path):
    return list(csv.DictReader(io.StringIO(http("https://data.api.abs.gov.au/rest/data/" + path, headers={"Accept": "application/vnd.sdmx.data+csv"}))))

au = []
try:
    rows = abs_csv("LSTOCK_SLAUGHT/all?startPeriod=1990&format=csvfilewithlabels")
    hdr = rows[0].keys()
    log.append("ABS slaughter cols: " + ",".join(hdr))
    item_col = "LSTOCK_SLAUGHT"
    for code, id_, label in [("30", "au-cattle-slaught", "Cattle (excl. calves) slaughtered"), ("110", "au-pig-slaught", "Pigs slaughtered"), ("70", "au-sheep-slaught", "Sheep slaughtered"), ("80", "au-lamb-slaught", "Lambs slaughtered"), ("10", "au-steer-slaught", "Bulls, bullocks and steers slaughtered"), ("20", "au-cow-slaught", "Cows and heifers slaughtered"), ("60", "au-calf-slaught", "Calves slaughtered"), ("170", "au-chicken-slaught", "Chickens slaughtered")]:
        pts = []
        for r in rows:
            if r.get(item_col) == code and r.get("STATE") == "AUS" and r.get("TSEST") == "10" and r.get("OBS_VALUE") not in (None, ""):
                mult = int(r.get("UNIT_MULT") or 0)
                pts.append((r["TIME_PERIOD"], float(r["OBS_VALUE"]) * (10 ** mult) / 1000.0))
        s = mk(id_, label, "1,000 head", "quarterly", pts, "production")
        if s: au.append(s)
except Exception as e:
    log.append("ERROR AU slaughter: " + str(e)[:200])
try:  # ABS LSTOCK_MEAT: carne producida (toneladas), nacional, serie original, trimestral
    rows = abs_csv("LSTOCK_MEAT/all?startPeriod=1990&format=csvfilewithlabels")
    for code, id_, label in [("171", "au-chicken-meat-prod", "Chicken meat produced"), ("1101", "au-pig-meat-prod", "Pig meat produced"), ("301", "au-beef-prod", "Beef produced"), ("601", "au-veal-prod", "Veal produced"), ("701", "au-mutton-prod", "Mutton produced"), ("801", "au-lamb-prod", "Lamb produced"), ("120", "au-redmeat-prod", "Total red meat produced")]:
        pts = []
        for r in rows:
            if r.get("LSTOCK_MEAT") == code and r.get("STATE") == "AUS" and r.get("TSEST") == "10" and r.get("OBS_VALUE") not in (None, "") and (r.get("UNIT_MEASURE") or "T") == "T":
                pts.append((r["TIME_PERIOD"], float(r["OBS_VALUE"]) * (10 ** int(r.get("UNIT_MULT") or 0))))
        s = mk(id_, label, "tonnes", "quarterly", pts, "production")
        if s: au.append(s)
except Exception as e:
    log.append("ERROR AU meat produced: " + str(e)[:200])
for code, id_, label in [("041", "au-exp-wheat", "Exports: wheat"), ("043", "au-exp-barley", "Exports: barley"), ("044", "au-exp-maize", "Exports: maize"), ("222", "au-exp-oilseeds", "Exports: oilseeds (canola etc.)"),
                         ("011", "au-exp-beef", "Exports: bovine meat"), ("012", "au-exp-sheepmeat", "Exports: other meat (incl. sheep meat)"), ("024", "au-exp-cheese", "Exports: cheese and curd"), ("001", "au-exp-live", "Exports: live animals")]:
    try:
        rows = abs_csv("MERCH_EXP/%s.TOT.TOT.M?format=csvfilewithlabels&startPeriod=1988" % code)
        pts = []
        for r in rows:
            if r.get("OBS_VALUE") not in (None, ""):
                mult = int(r.get("UNIT_MULT") or 0)
                pts.append((r["TIME_PERIOD"], float(r["OBS_VALUE"]) * (10 ** mult) / 1e6))
        s = mk(id_, label, "A$ million (value)", "monthly", pts, "trade")
        if s: au.append(s)
    except Exception as e:
        log.append("ERROR AU " + id_ + ": " + str(e)[:200])

for code, id_, label in [("3117006", "au-xpi-fruit", "Export price index: edible fruit and nuts"), ("3117007", "au-xpi-cereals", "Export price index: cereals"), ("3117002", "au-xpi-meat", "Export price index: meat and offal"), ("3117004", "au-xpi-dairy", "Export price index: dairy products"), ("3117009", "au-xpi-oilseeds", "Export price index: oil seeds"), ("3117001", "au-xpi-live", "Export price index: live animals"), ("3117012", "au-xpi-sugar", "Export price index: sugars"), ("3117034", "au-xpi-wool", "Export price index: wool and animal hair")]:
    try:
        rows = abs_csv("ITPI_EXP/1.%s.Q?format=csvfilewithlabels" % code)
        pts = [(r["TIME_PERIOD"], float(r["OBS_VALUE"])) for r in rows if r.get("OBS_VALUE") not in (None, "")]
        base = next((r.get("BASE_PERIOD") for r in rows if r.get("BASE_PERIOD")), "")
        s = mk(id_, label, "index (AUD, see base)", "quarterly", pts, "prices", "Base period code " + str(base) + " (see ABS ITPI_EXP)")
        if s: au.append(s)
    except Exception as e:
        log.append("ERROR AU " + id_ + ": " + str(e)[:200])

countries["AU"] = {"name": "Australia", "source": {"name": "Australian Bureau of Statistics (ABS Data API)", "url": "https://www.abs.gov.au/", "license": "CC BY 4.0"}, "series": au}

total = sum(len(c["series"]) for c in countries.values())
if total == 0:
    print("Sin series", log, file=sys.stderr); sys.exit(1)
out = {"schemaVersion": "1.0", "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "countries": countries, "log": log}
(ROOT / "data" / "country-stats.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Series:", {k: len(v["series"]) for k, v in countries.items()})
for k, v in countries.items():
    for s in v["series"]:
        print(" ", s["id"], "|", s["label"], "|", s["latestPeriod"], s["latest"], "| n=", len(s["points"]), "| first", s["points"][0][0])
for l in log: print("LOG", l)

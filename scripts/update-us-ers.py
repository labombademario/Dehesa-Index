#!/usr/bin/env python3
"""EE. UU.: datos publicos del USDA ERS (margenes de la carne, lacteos, leche, arroz) y del TTB del Tesoro (vino) -> data/us-ers-stats.json y data/us-ttb-stats.json
Ambas fuentes son obra del Gobierno federal de EE. UU. (dominio publico). Todo tal como lo publican: nada se estima; lo que falta es un hueco.
ERS (https://www.ers.usda.gov/data-products/...): se busca en cada pagina el CSV por su nombre, porque el numero del fichero cambia en cada actualizacion.
  - meat-price-spreads: valores y margenes mensuales de vacuno, cerdo y pollo (historico 1970- y ficheros recientes) y precios minoristas de cortes, huevos y lacteos (BLS, via ERS)
  - dairy-data: situacion lactea mensual y anual (precios mayoristas, produccion de productos) y leche y vacas por trimestre
  - rice-yearbook: precios de arroz recibidos por los agricultores (mensual, total nacional)
TTB (https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/wine-statistics): produccion de vino (total y por tipo) y salidas para exportacion, en galones (anual)
Uso: update-us-ers.py [--out DIR]"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=120).read().decode("utf-8-sig", "replace")
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))
MONTHS = {m: i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
MON3 = {m.upper(): i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:56]
def fnum(v):
    try: return float(str(v).replace(",", ""))
    except Exception: return None
NOW = datetime.date.today().year
def mk(sid, group, label, unit, freq, pts, src):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pts = [[p, round(v, 4)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < NOW - 3:
        log("descartada %s: %d puntos, ultimo %s" % (sid, len(pts), pts[-1][0] if pts else "-")); return None
    prev = pts[-2][1]
    return dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=pts[-1][0], latest=pts[-1][1], changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup=src)
UNITS = {"cents per pound of retail equivalent": "cents/lb retail equivalent", "cents/lb": "cents/lb", "dollars per pound": "USD/lb", "dollars per hundred pounds live weight": "USD/cwt live weight",
         "dollars per dozen": "USD/dozen", "dollars per half gallon": "USD/half gallon", "dollars per gallon": "USD/gallon", "dollars per hundredweight": "USD/cwt", "million pounds": "million lb", "1,000 head": "thousand head",
         "dollars per head": "USD/head", "pounds": "lb"}
def unit_of(u): return UNITS.get(u.strip().lower(), u.strip().lower())
def rows_of(text): return list(csv.DictReader(io.StringIO(text)))
def link(page, rx):
    h = get(page); m = re.findall(r'href="(/media/\d+/(?:%s)\.csv)(?:\?[^"]*)?"' % rx, h)
    if not m: raise RuntimeError("sin enlace %s en %s" % (rx, page))
    return "https://www.ers.usda.gov" + m[0]

def meat_spreads(out):
    page = "https://www.ers.usda.gov/data-products/meat-price-spreads"
    by = {}
    def add(item, unit, y, mo, v, src):
        v = fnum(v)
        if v is None: return
        item = re.sub(r"^(Choice beef|Pork) price spread[:,]? (farm to retail|farm to wholesale|wholesale to retail)$", r"\1 \2 price spread", item.strip(), flags=re.I)   # los ficheros recientes nombran distinto los mismos margenes que el historico
        k = by.setdefault((slug(item), src), {"item": item.strip(), "unit": unit_of(unit), "pts": {}})   # el mismo concepto en el historico y en los ficheros recientes (distinta grafia de unidad) es una sola serie
        k["pts"]["%04d-%02d" % (int(y), mo)] = v
    for rx, kind in (("historical-monthly-price-spread-data-for-beef-pork-broilers", "m"), ("choice-beef-values-and-spreads-and-the-all-fresh-retail-value", "p"), ("pork-values-and-spreads", "p"),
                     ("retail-prices-for-beef-pork-poultry-cuts-eggs-and-dairy-products", "m")):
        try:
            rows = rows_of(get(link(page, rx)))
            for r in rows:
                if not r.get("Year") or not r.get("Data_Item"): continue
                mo = MONTHS.get((r.get("Month") or r.get("Period") or "").strip())
                if mo: add(r["Data_Item"], r["Units"], r["Year"], mo, r["Value"], "BLS" if r.get("Source") == "BLS" else "ERS")
            log("ERS", rx, len(rows), "filas")
        except Exception as e: log("ERROR ERS", rx, repr(e)[:200])
    for (sl, src), e in by.items():
        item, unit, d = e["item"], e["unit"], e["pts"]
        retail = src == "BLS"
        lab = "%s (%s)" % (item[0].upper() + item[1:], "BLS monthly retail price, via ERS" if retail else "ERS meat price spreads, monthly")
        s = mk("us-ers-" + sl, "prices", lab, unit, "monthly", list(d.items()), "usda_ers")
        if s: out.append(s)

def dairy(out):
    page = "https://www.ers.usda.gov/data-products/dairy-data"
    try:
        rows = rows_of(get(link(page, "us-dairy-situation-at-a-glance-monthly-and-annual"))); seen = set(); by = {}
        for r in rows:
            cat, item, unit, fq = r["Category"].strip(), r["Data_item"].strip(), r["Unit"].strip(), r["Frequency"].strip().lower()
            cl = cat.lower()
            if "percent" in unit.lower() or "index" in cl or "consumer price" in cl:
                seen.add("saltada: " + cat); continue
            g = "prices" if "price" in cl else "production" if ("output" in cl or "production" in cl or "milk" in cl and "price" not in cl) else "stocks" if "stock" in cl else "trade" if ("trade" in cl or "export" in cl or "import" in cl) else None
            if g is None: seen.add("sin grupo: " + cat); continue
            if fq == "monthly": mo = MONTHS.get(r["Period"].strip()); p = "%s-%02d" % (r["Year"], mo) if mo else None
            elif fq == "annual": p = r["Year"]
            else:
                m = re.search(r"([1-4])", r["Period"]); p = "%s-Q%s" % (r["Year"], m.group(1)) if m and "uarter" in r["Period"] else None
            v = fnum(r["Value"])
            if p and v is not None: by.setdefault((g, cat, item, unit, fq), {})[p] = v
        for k in sorted(seen): log("dairy", k)
        for (g, cat, item, unit, fq), d in by.items():
            s = mk("us-ers-dairy-%s-%s-%s" % (slug(cat)[:24].strip("-"), slug(item), fq[:1]), g, "%s: %s (ERS dairy data, %s)" % (cat, item, fq), unit_of(unit), fq, list(d.items()), "usda_ers")
            if s: out.append(s)
    except Exception as e: log("ERROR ERS dairy", repr(e)[:200])
    try:
        rows = rows_of(get(link(page, "us-milk-production-and-related-data-quarterly-and-annual"))); by = {}
        for r in rows:
            item, tn = r["Data_item"].strip(), r["Timeperiod_name"].strip()
            v = fnum(r["Value"])
            if v is None: continue
            if tn.startswith("Quarter"): p, fq = "%s-Q%s" % (r["Year"], tn.split()[1]), "quarterly"
            elif tn.lower().startswith("annual") or tn.lower().startswith("year"): p, fq = r["Year"], "annual"
            else: continue
            by.setdefault((item, r["Units"].strip(), fq), {})[p] = v
        for (item, unit, fq), d in by.items():
            g = "prices" if ("price" in item.lower() or "value" in item.lower()) else "production"
            s = mk("us-ers-milk-%s-%s" % (slug(item), fq[:1]), g, "US milk: %s (ERS, %s)" % (item.lower(), fq), unit_of(unit), fq, list(d.items()), "usda_ers")
            if s: out.append(s)
    except Exception as e: log("ERROR ERS milk", repr(e)[:200])

def rice(out):
    try:
        rows = rows_of(get(link("https://www.ers.usda.gov/data-products/rice-yearbook", "us-rough-and-milled-rice-prices-monthly-and-marketing-year"))); by = {}
        for r in rows:
            mo = MON3.get(r["REFERENCE_PERIOD_DESCRIPTION"].strip().upper())
            v = fnum(r["VALUE"])
            if not mo or v is None or r["LOCATION_DESCRIPTION"].strip() != "U.S. TOTAL" or r["AGGREGATE_LEVEL_DESCRIPTION"].strip() != "NATIONAL": continue
            by.setdefault((r["TABLE_NAME"].split(":")[0].strip(), r["CLASS_DESCRIPTION"].strip(), r["UNIT_DESCRIPTION"].strip()), {})["%s-%02d" % (r["YEAR"], mo)] = v
        for (t, c, u), d in by.items():
            s = mk("us-ers-rice-%s-%s" % (slug(t), slug(c)), "prices", "%s: %s, average price received (ERS rice yearbook, monthly)" % (t, c.lower()), unit_of(u), "monthly", list(d.items()), "usda_ers")
            if s: out.append(s)
    except Exception as e: log("ERROR ERS rice", repr(e)[:200])

def wine(out):
    """TTB: la serie mensual llega con 6-7 meses de retraso por naturaleza (aparecería como atrasada): se publica la anual, que se cierra en el ano natural anterior."""
    page = "https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/wine-statistics"
    try:
        h = get(page); m = re.search(r'href="(/system/files/[^"]*Wine_yearly_data_csv\.csv)"', h)
        if not m: raise RuntimeError("sin enlace al CSV anual")
        rows = rows_of(get("https://www.ttb.gov" + m.group(1))); by = {}
        SEL = {("1-Production", "1-Production", "0-Category Total"): ("production", "production, total", "prod"), ("1-Production", "1-Production", "1-Low Alcohol %"): ("production", "production, low-alcohol wine (TTB category)", "prod-low"),
               ("1-Production", "1-Production", "2-Medium and High Alcohol %"): ("production", "production, medium- and high-alcohol wine (TTB category)", "prod-high"),
               ("1-Production", "1-Production", "4-Artificially Carbonated Wine"): ("production", "production, artificially carbonated wine", "prod-carb"), ("1-Production", "1-Production", "5-Sparkling Wine"): ("production", "production, sparkling wine", "prod-spark"),
               ("1-Production", "1-Production", "6-Hard Cider"): ("production", "production, hard cider", "prod-cider"),
               ("2-Withdrawals", "3-Tax Free Withdrawals For Export", "0-Category Total"): ("trade", "tax-free withdrawals for export", "export")}
        for r in rows:
            k = (r["Statistical_Group"], r["Statistical_Category"], r["Statistical_Detail"])
            if k in SEL and r.get("Stat_Redaction", "").upper() != "TRUE":
                v = fnum(r["Value"])
                if v is not None: by.setdefault(SEL[k][2], {})[r["Year"]] = v / 1e6
        for tag, d in by.items():
            g, nm = next((v_[0], v_[1]) for v_ in SEL.values() if v_[2] == tag)
            s = mk("us-ttb-wine-" + tag, g, "Wine: %s (TTB, annual)" % nm, "million gallons", "annual", list(d.items()), "ttb")
            if s: out.append(s)
        log("TTB vino", len(rows), "filas")
    except Exception as e: log("ERROR TTB", repr(e)[:200])

# ───────── Mas tablas del ERS: trigo, azucar y edulcorantes, oleaginosas y arroz (stocks y balance mundial) ─────────
import zipfile
def getb(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180).read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))
def link_any(page, rx, ext):
    m = re.findall(r'href="(/media/\d+/(?:%s)\.%s)(?:\?[^"]*)?"' % (rx, ext), get(page))
    if not m: raise RuntimeError("sin enlace %s en %s" % (rx, page))
    return "https://www.ers.usda.gov" + m[0]
def my_year(my):
    m = re.match(r"(\d{4})", str(my).strip()); return int(m.group(1)) if m else None
def mk_recent(sid, group, label, unit, freq, pts, src, lastmin=None):
    """como mk, pero descarta series cuyo ultimo dato es anterior a lastmin (por defecto, el año pasado): una serie discontinuada no es un dato vigente"""
    ds = [p for p in pts if p[1] is not None]
    if not ds or int(sorted(ds)[-1][0][:4]) < (lastmin or NOW - 1):
        log("descartada por antigua %s" % sid); return None
    return mk(sid, group, label, unit, freq, pts, src)
MON_ABB = {m[:3].upper(): i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
def cap(x): return x[0].upper() + x[1:]

def wheat(out):
    page = "https://www.ers.usda.gov/data-products/wheat-data"
    try: z = zipfile.ZipFile(io.BytesIO(getb(link_any(page, "wheat-data-all-years", "zip"))))
    except Exception as e: log("ERROR ERS trigo", repr(e)[:200]); return
    def rd(prefix):
        n = [x for x in z.namelist() if x.split("/")[-1].startswith(prefix)][0]
        return rows_of(z.read(n).decode("utf-8-sig", "replace"))
    CL = {"All wheat": "all wheat", "Durum": "durum", "Hard red spring": "hard red spring", "Hard red winter": "hard red winter", "Soft red winter": "soft red winter", "White": "white"}
    ATT = {"Weighted-average farm price": ("prices", "farm price received, marketing-year average"), "Production": ("crops", "production"), "Harvested acreage": ("crops", "harvested area"), "Planted acreage": ("crops", "planted area"), "Yield": ("crops", "yield")}
    by = {}
    for r in rd("01_Wheat"):
        y = my_year(r["Marketing_Year"]); v = fnum(r["Amount"])
        if y is None or v is None or y > NOW - 1 or r["Commodity_Desc2"] not in CL or r["Attribute_Desc"] not in ATT: continue
        by.setdefault((r["Commodity_Desc2"], r["Attribute_Desc"], r["Unit_Desc"]), {})[str(y)] = v
    for (c, a, u), d in by.items():
        g, nm = ATT[a]
        x = mk("us-ers-wheat-%s-%s" % (slug(CL[c]), slug(nm)), g, "US %s: %s (ERS wheat data, Jun-May marketing year, annual)" % (CL[c], nm), unit_of(u), "annual", list(d.items()), "usda_ers")
        if x: out.append(x)
    SD = {"Beginning stocks": ("stocks", "beginning stocks"), "Ending stocks": ("stocks", "ending stocks"), "Exports": ("trade", "exports"), "Imports": ("trade", "imports"), "Production": ("crops", "production"),
          "Food use": ("production", "food use"), "Feed and residual use": ("production", "feed and residual use"), "Total domestic use": ("production", "total domestic use"), "Seed use": ("production", "seed use")}
    by = {}
    for r in rd("05_11"):
        y = my_year(r["Marketing_Year"]); v = fnum(r["Amount"])
        if y is None or v is None or y > NOW - 1 or r["Timeperiod_Desc"] != "MY Jun-May" or r["Commodity_Desc2"] not in CL or r["Attribute_Desc"] not in SD: continue
        by.setdefault((r["Commodity_Desc2"], r["Attribute_Desc"], r["Unit_Desc"]), {})[str(y)] = v
    for (c, a, u), d in by.items():
        if a == "Production" or c != "All wheat" and a not in ("Ending stocks", "Exports"): continue   # la produccion por clase ya sale del cuadro 01; por clase solo existencias finales y exportaciones
        g, nm = SD[a]
        x = mk("us-ers-wheat-sd-%s-%s" % (slug(CL[c]), slug(nm)), g, "US %s: %s (ERS wheat supply and use, Jun-May marketing year, annual)" % (CL[c], nm), unit_of(u), "annual", list(d.items()), "usda_ers")
        if x: out.append(x)
    # precios mensuales: recibidos por los agricultores por clase y ofertas al contado por plaza
    by = {}
    for r in rd("18_20"):
        mo = MON_ABB.get(r["Timeperiod_Desc"].strip().upper()); v = fnum(r["Amount"]); m = re.match(r"(\d{4})/(\d\d)", r["Marketing_Year"])
        if not mo or v is None or not m: continue
        y = int(m.group(1)) + (0 if mo >= 6 else 1)
        if y > NOW: continue
        by.setdefault((r["Commodity_Desc"], r["Attribute_Desc"], r["Geography_Desc"], r["Unit_Desc"]), {})["%04d-%02d" % (y, mo)] = v
    for (c, a, geo, u), d in by.items():
        lab = "Wheat price, %s: %s, %s (ERS wheat data, monthly)" % ("received by farmers" if "received" in a else "average cash bid", c.lower() if len(c) < 90 else c[:90], geo)
        x = mk_recent("us-ers-wheat-px-%s-%s-%s" % (slug(c), slug(geo), slug(a)[:12]), "prices", lab, unit_of(u), "monthly", list(d.items()), "usda_ers")
        if x: out.append(x)

SUGAR_PX = {("2", "World white refined sugar (Number 5)"): "World white sugar futures, ICE No. 5", ("3b", "World raw sugar (Number 11)"): "World raw sugar futures, ICE No. 11",
            ("4", "U.S. raw sugar (Number 16)"): "US raw sugar futures, No. 16", ("5", "Refined beet sugar (bulk)"): "US refined beet sugar spot price, Midwest (bulk)",
            ("5a", "Refined cane sugar (bulk)"): "US refined cane sugar price, Northeast (bulk)", ("6", "Refined sugar"): "US retail price of refined sugar",
            ("7", "Glucose syrup (bulk)"): "US glucose syrup spot price, Midwest (bulk)", ("8", "Dextrose (bulk)"): "US dextrose spot price, Midwest (bulk)",
            ("9", "High-fructose corn syrup (HFCS)-42 (bulk)"): "US HFCS-42 spot price, Midwest (bulk)", ("9", "High-fructose corn syrup (HFCS)-55 (bulk)"): "US HFCS-55 spot price, Midwest (bulk)",
            ("10", "Raw cane sugar and other cane mill products and byproducts"): "US producer price index, raw cane sugar", ("10", "Refined cane sugar and byproducts"): "US producer price index, refined cane sugar",
            ("10", "Refined beet sugar and byproducts"): "US producer price index, refined beet sugar", ("10", "Corn sweeteners (liquids and solids), including glucose, dextrose, and high-fructose corn syrup"): "US producer price index, corn sweeteners",
            ("54", "Estandar (standard) sugar"): "Mexico wholesale price of standard sugar, Mexico City", ("55", "Refinada (refined) sugar"): "Mexico wholesale price of refined sugar, Mexico City"}
def sugar(out):
    page = "https://www.ers.usda.gov/data-products/sugar-and-sweeteners-yearbook-tables"
    # precios mensuales
    try:
        by = {}
        for r in rows_of(get(link_any(page, "world-us-and-mexican-sugar-and-corn-sweetener-prices", "csv"))):
            k = (r["Table_number"], r["Commodity_desc2"])
            if k not in SUGAR_PX or r["Period_cat"] != "Month" or r["Year_cat"] != "Calendar": continue
            if r["Table_number"] in ("54", "55") and r["Unit"] != "U.S. cents per pound": continue
            if r["Attribute_desc"] in ("Exchange rate",): continue
            v = fnum(r["Value"]); mo = MON_ABB.get(r["Period_desc"][:3].upper()); y = int(r["Year"]) if r["Year"].isdigit() else None
            if v is None or not mo or y is None: continue
            by.setdefault((k, r["Unit"]), {})["%04d-%02d" % (y, mo)] = v
        for (k, u), d in by.items():
            x = mk_recent("us-ers-sugar-px-%s-%s" % (k[0], slug(SUGAR_PX[k])[:36]), "prices", "%s (ERS sugar and sweeteners yearbook, monthly)" % SUGAR_PX[k], unit_of(u.replace("U.S. cents per pound", "cents/lb")), "monthly", list(d.items()), "usda_ers")
            if x: out.append(x)
    except Exception as e: log("ERROR ERS azucar precios", repr(e)[:200])
    # produccion, entregas, existencias (anual; año natural o de campaña)
    try:
        rows = rows_of(get(link_any(page, "us-sugar-crop-production-and-sugar-production-deliveries-and-stocks", "csv")))
        WANT = [("17", "Sugarbeets", "Production", "crops", "US sugarbeet production", "Crop"), ("17", "Sugarbeets", "Area harvested", "crops", "US sugarbeet harvested area", "Crop"), ("17", "Sugarbeets", "Yield", "crops", "US sugarbeet yield", "Crop"),
                ("17", "Beet sugar", "Production", "crops", "US beet sugar production", "Crop"), ("15", "Sugarcane", "Production for sugar", "crops", "US sugarcane production for sugar", "Crop"),
                ("15", "Sugarcane", "Area harvested for sugar", "crops", "US sugarcane harvested area (sugar)", "Crop"), ("15", "Cane sugar", "Production", "crops", "US cane sugar production", "Crop"),
                ("18", "Beet and cane sugar", "Production", "production", "US sugar production (beet and cane)", "Calendar year"), ("19", "Sugar", "Total sugar deliveries for domestic food and beverage use", "production", "US sugar deliveries for domestic food and beverage use", "Calendar year"),
                ("19", "Sugar", "Sugar exports", "trade", "US sugar exports (deliveries)", "Calendar year"), ("21", "Sugar", "Total use", "production", "US total sugar use (refined basis)", "Calendar year"),
                ("22", "Sugar", "Total sugar ending stocks", "stocks", "US sugar stocks at 31 December", "Dec_31")]
        for t, c2, att, g, nm, mode in WANT:
            d = {}; unit = None
            for r in rows:
                if r["Table_number"] != t or r["Commodity_desc2"] != c2 or r["Attribute_desc"] != att or r["Geographic_extent2"] not in ("United States",): continue
                v = fnum(r["Value"])
                if v is None: continue
                if mode == "Crop":
                    if r["Year_cat"] != "Crop" or r["Period_cat"] not in ("Crop year", "Crop year (Aug-Jul)") : continue
                elif mode == "Calendar year":
                    if r["Period_cat"] != "Calendar year": continue
                elif r["Period_desc"] != "Dec_31": continue
                y = int(r["Year"])
                if y > NOW - 1: continue
                d[str(y)] = v; unit = r["Unit"]
            x = mk("us-ers-sugar-%s-%s" % (t, slug(nm)[:40]), g, "%s (ERS sugar and sweeteners yearbook, %s, annual)" % (nm, "crop year Aug-Jul" if mode == "Crop" else "calendar year"), unit_of(unit or ""), "annual", list(d.items()), "usda_ers") if d else None
            if x: out.append(x)
    except Exception as e: log("ERROR ERS azucar balance", repr(e)[:200])

OC_COM = {"Soybeans": "seed", "Soybean meal": "prod", "Soybean oil": "prod", "Canola": "seed", "Canola oil": "prod", "Canola meal": "prod", "Sunflowerseed": "seed", "Sunflowerseed oil": "prod", "Sunflowerseed meal": "prod",
          "Peanuts": "seed", "Cottonseed": "seed", "Cottonseed oil": "prod", "Cottonseed meal": "prod", "Flaxseed": "seed", "Linseed oil": "prod", "Corn oil": "prod"}
OC_ATT = {"Production": ("production", "production"), "Imports": ("trade", "imports"), "Exports": ("trade", "exports"), "Ending stocks": ("stocks", "ending stocks"), "Crush": ("production", "crush")}
def oilcrops(out):
    page = "https://www.ers.usda.gov/data-products/oil-crops-yearbook"
    try: rows = rows_of(get(link_any(page, "all-tables-oil-crops-yearbook", "csv")))
    except Exception as e: log("ERROR ERS oleaginosas", repr(e)[:200]); return
    by = {}; mon = {}; world = {}
    for r in rows:
        v = fnum(r["Amount"]); y = my_year(r["Marketing_Year"]); c = r["Commodity_Desc"]; a = r["Attribute_Desc"]; geo = r["Geography_Desc"]
        if v is None or y is None: continue
        if r["Table_number"] == "34" and a == "Received by U.S. farmers":   # precios mensuales recibidos por los agricultores (año natural)
            mo = MONTHS.get(r["Timeperiod_Desc"].strip())
            if mo and y <= NOW: mon.setdefault((c, r["Unit_Desc"]), {})["%04d-%02d" % (y, mo)] = v
            continue
        if r["Timeperiod_Desc"] != "MY Total" or y > NOW - 1: continue
        if r["MY_Definition"].startswith("Varies") and geo == "United States": continue   # cuadros de balance mundial: el desglose de EE. UU. de los cuadros nacionales es la fuente buena
        if geo == "United States" and c in OC_COM and a in OC_ATT:
            if OC_COM[c] == "seed" and a in ("Production",): continue   # la produccion de grano ya sale de NASS
            by.setdefault((c, a, r["Unit_Desc"], r["MY_Definition"]), {})[str(y)] = v
        elif geo == "World" and a == "Production" and r["Table_number"] in ("41", "42", "43"):
            world.setdefault((c, r["Unit_Desc"], r["MY_Definition"]), {})[str(y)] = v
        elif geo == "United States" and c == "Soybean oil" and a == "Price" and r["Table_number"] == "9":
            by.setdefault((c, a, r["Unit_Desc"], r["MY_Definition"]), {})[str(y)] = v
    best = {}
    for k, d in by.items():   # el mismo concepto sale en varios cuadros (anual y trimestral/mensual, otras unidades): se queda el mas reciente y largo
        kk = (k[0], k[1])
        if kk not in best or (max(d), len(d)) > (max(best[kk][1]), len(best[kk][1])): best[kk] = (k, d)
    for kk, (k, d) in best.items():
        c, a, u, my = k
        g, nm = OC_ATT.get(a, ("prices", "price"))
        x = mk("us-ers-oc-%s-%s" % (slug(c), slug(nm)), g, "US %s: %s (ERS oil crops yearbook, %s marketing year, annual)" % (c.lower(), nm, my.replace("\u2013", "-")), unit_of(u), "annual", list(d.items()), "usda_ers")
        if x: out.append(x)
    for (c, u, my), d in world.items():
        x = mk("us-ers-oc-world-%s-production" % slug(c), "production", "World %s: production (ERS oil crops yearbook, annual)" % c.lower(), unit_of(u), "annual", list(d.items()), "usda_ers")
        if x: out.append(x)
    for (c, u), d in mon.items():
        x = mk_recent("us-ers-oc-px-%s" % slug(c), "prices", "US %s: price received by farmers (ERS oil crops yearbook, monthly)" % c.lower(), unit_of(u), "monthly", list(d.items()), "usda_ers")
        if x: out.append(x)

def rice_more(out):
    page = "https://www.ers.usda.gov/data-products/rice-yearbook"
    try:
        by = {}
        for r in rows_of(get(link_any(page, "rice-stocks-rough-and-milled-1983-to-present", "csv"))):
            if r["STATISTIC_DESCRIPTION"].strip() != "STOCKS, TOTAL ALL POSITIONS" or r["LOCATION_DESCRIPTION"].strip() != "U.S. TOTAL": continue
            mo = MONTHS.get(r["REFERENCE_PERIOD_DESCRIPTION"].split()[0].strip()); v = fnum(r["VALUE"])
            if mo and v is not None: by.setdefault((r["CLASS_DESCRIPTION"].strip().lower(), r["UNIT_DESCRIPTION"].strip().lower()), {})["%s-%02d" % (r["YEAR"], mo)] = v
        for (cl, u), d in by.items():
            x = mk("us-ers-rice-stocks-%s" % cl, "stocks", "US rice stocks, %s: total all positions (ERS rice yearbook, quarterly)" % cl, unit_of(u), "quarterly", list(d.items()), "usda_ers")
            if x: out.append(x)
    except Exception as e: log("ERROR ERS arroz existencias", repr(e)[:200])
    try:
        by = {}
        for r in rows_of(get(link_any(page, "world-rice-supply-and-utilization-196061-to-present", "csv"))):
            if r["LOCATION_DESCRIPTION"].strip() != "WORLD TOTAL" or not r["REFERENCE_PERIOD_DESCRIPTION"].startswith("MARKETING"): continue
            st = r["STATISTIC_DESCRIPTION"].strip(); v = fnum(r["VALUE"]); y = int(r["YEAR"]) if r["YEAR"].isdigit() else None
            if st not in ("PRODUCTION", "ENDING STOCKS", "EXPORTS", "TOTAL DOMESTIC USE", "AREA HARVESTED", "YIELD", "STOCKS-TO-USE RATIO") or v is None or y is None or y > NOW - 1: continue
            by.setdefault((st, r["UNIT_DESCRIPTION"].strip().lower()), {})[str(y)] = v
        G = {"PRODUCTION": "production", "ENDING STOCKS": "stocks", "EXPORTS": "trade", "TOTAL DOMESTIC USE": "production", "AREA HARVESTED": "crops", "YIELD": "crops", "STOCKS-TO-USE RATIO": "stocks"}
        for (st, u), d in by.items():
            x = mk("us-ers-rice-world-%s" % slug(st), G[st], "World rice, milled basis: %s (ERS rice yearbook, Aug-Jul marketing year, annual)" % st.lower(), unit_of(u), "annual", list(d.items()), "usda_ers")
            if x: out.append(x)
    except Exception as e: log("ERROR ERS arroz mundial", repr(e)[:200])


def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ers, ttb = [], []
    for fn in (meat_spreads, dairy, rice, wheat, sugar, oilcrops, rice_more): fn(ers)
    wine(ttb)
    seen = set(); uniq = []
    for x in ers:
        if x["id"] in seen: log("id duplicado descartado", x["id"]); continue
        seen.add(x["id"]); uniq.append(x)
    ers[:] = uniq
    for name, ser, src in (("us-ers-stats.json", ers, {"name": "USDA Economic Research Service (data products)", "url": "https://www.ers.usda.gov/data-products/", "license": "US Government work (public domain); cite USDA ERS"}),
                           ("us-ttb-stats.json", ttb, {"name": "Alcohol and Tobacco Tax and Trade Bureau (US Treasury): wine statistics", "url": "https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/wine-statistics", "license": "US Government work (public domain); cite TTB"})):
        if not ser: log("sin series para", name, "(se conserva el fichero anterior)"); continue
        doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"US": {"name": "United States", "extend": True, "source": src, "series": ser}}, "log": LOG[-30:]}
        (outdir / name).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        log(name, "series", len(ser))
    (outdir / "us-ers-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if not ers and not ttb: sys.exit(1)
if __name__ == "__main__": main()

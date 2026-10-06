#!/usr/bin/env python3
"""Canadá: producción, existencias, ganadería, lácteos, huevos, aves, ingresos y costes de Statistics Canada
(tablas WDS, Open Government Licence - Canada). Escribe data/canada-stats.json (esquema de paises.html) y data/canada-stats-log.txt.
Los precios mensuales de las tarjetas siguen en update-statcan-canada.py (tabla 32-10-0077)."""
import csv, io, json, re, sys, time, urllib.request, zipfile, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
WDS = "https://www150.statcan.gc.ca/t1/wds/rest/"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0", "Content-Type": "application/json"}
LOG = []; OUT = {}
def log(*a):
    s = " ".join("%s" % x for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "canada-stats-log.txt").write_text("\n".join(LOG))
    except Exception: pass
SC = {"units": 1, "tens": 10, "hundreds": 100, "thousands": 1e3, "millions": 1e6, "billions": 1e9}
_cache = {}
def fetch_resume(url, tries=8):
    buf = b""; total = None
    for i in range(tries):
        h = {"User-Agent": UA["User-Agent"]}
        if buf: h["Range"] = "bytes=%d-" % len(buf)
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=150)
            if buf and r.status != 206: buf = b""
            while True:
                c = r.read(65536)
                if not c: break
                buf += c
            return buf
        except Exception as e:
            log("corte en", len(buf) // 1024, "KB", repr(e)[:80]); time.sleep(3)
    raise RuntimeError("descarga incompleta")
def load(pid):
    if pid in _cache: return _cache[pid]
    last = None
    for i in range(2):
        try:
            req = urllib.request.Request(WDS + "getFullTableDownloadCSV/%d/en" % pid, headers=UA)
            info = json.loads(urllib.request.urlopen(req, timeout=60).read())
            raw = fetch_resume(info["object"])
            z = zipfile.ZipFile(io.BytesIO(raw)); name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
            log("descargada", pid, len(raw) // 1024, "KB")
            rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")))
            _cache[pid] = rows; log("tabla", pid, len(rows), "filas"); return rows
        except Exception as e: last = e; time.sleep(5)
    raise RuntimeError("%s: %s" % (pid, last))
def num(r):
    v = r.get("VALUE", "")
    if v in ("", None): return None
    try: return float(v) * SC.get((r.get("SCALAR_FACTOR") or "units").strip().lower(), 1)
    except ValueError: return None
def put(sid, group, label, unit, freq, pts, src):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3: return
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    OUT[sid] = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts, sourceGroup=src)
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]
def clean(s): return re.sub(r"\s*\[[0-9A-Z]+\]\s*$", "", s).strip()
def series_of(rows, keyfn, valfn=num):
    by = {}
    for r in rows:
        k = keyfn(r)
        if k is None: continue
        v = valfn(r)
        if v is None: continue
        by.setdefault(k, []).append((r["REF_DATE"], v))
    return by

# ───────── 1. Cultivos de campo (32-10-0359): Canadá ─────────
CROPS = {"Wheat, all": "Wheat (all)", "Wheat, durum": "Durum wheat", "Barley": "Barley", "Oats": "Oats", "Rye, all": "Rye", "Canola (rapeseed)": "Canola", "Corn for grain": "Grain corn",
         "Soybeans": "Soybeans", "Peas, dry": "Dry peas", "Lentils": "Lentils", "Flaxseed": "Flaxseed", "Sunflower seed": "Sunflower seed", "Mustard seed": "Mustard seed", "Chick peas": "Chickpeas", "Canary seed": "Canary seed", "Sugar beets": "Sugar beets"}
def crops():
    rows = [r for r in load(32100359) if r["GEO"] == "Canada" and r["Type of crop"] in CROPS]
    spec = {"Seeded area (hectares)": ("crops", "Seeded area", "thousand ha", 1e-3, "area"), "Harvested area (hectares)": ("crops", "Harvested area", "thousand ha", 1e-3, "harea"),
            "Production (metric tonnes)": ("crops", "Production", "thousand t", 1e-3, "prod"), "Average yield (kilograms per hectare)": ("crops", "Yield", "kg/ha", 1, "yield"),
            "Average farm price (dollars per tonne)": ("prices", "Average farm price", "CAD/t", 1, "price")}
    by = series_of(rows, lambda r: (r["Type of crop"], r["Harvest disposition"]) if r["Harvest disposition"] in spec else None)
    n = 0
    for (c, h), pts in by.items():
        g, nm, u, f, tag = spec[h]
        put("ca-crop-%s-%s" % (slug(c), tag), g, "%s: %s" % (CROPS[c], nm.lower()), u, "annual", [(p, v * f) for p, v in pts], "StatCan 32-10-0359"); n += 1
    log("cultivos", n)

# ───────── 2. Existencias de cereales (32-10-0007): 31-mar, 31-jul, 31-dic ─────────
STK = {"Wheat, all": "Wheat (all)", "Wheat, durum": "Durum wheat", "Barley": "Barley", "Oats": "Oats", "Canola (rapeseed)": "Canola", "Corn for grain": "Grain corn", "Soybeans": "Soybeans", "Peas, dry": "Dry peas", "Lentils": "Lentils", "Flaxseed": "Flaxseed", "Rye, all": "Rye"}
def stocks():
    rows = [r for r in load(32100007) if r["GEO"] == "Canada" and r["Type of stock"] == "Farm and commercial, total" and r["Type of crop"] in STK]
    by = series_of(rows, lambda r: r["Type of crop"])
    for c, pts in by.items(): put("ca-stocks-%s" % slug(c), "stocks", "Stocks at 31 Mar / 31 Jul / 31 Dec: %s (farm + commercial)" % STK[c], "thousand t", "monthly", [(p, v / 1000) for p, v in pts], "StatCan 32-10-0007")
    log("existencias", len(by))

# ───────── 3. Entregas de los productores y molturación ─────────
def deliveries():
    rows = [r for r in load(32100351) if r["GEO"] == "Canada"]
    nm = {"All grains, total": "All grains", "Wheat, total": "Wheat", "Durum wheat": "Durum wheat", "Oats": "Oats", "Barley": "Barley", "Rye": "Rye", "Flaxseed": "Flaxseed", "Canola (rapeseed)": "Canola"}
    by = series_of(rows, lambda r: r["Type of grain"] if r["Type of grain"] in nm else None)
    for c, pts in by.items(): put("ca-deliv-%s" % slug(c), "production", "Producer deliveries: %s (monthly)" % nm[c], "thousand t", "monthly", [(p, v / 1000) for p, v in pts], "StatCan 32-10-0351")
    log("entregas", len(by))
def crush():
    rows = [r for r in load(32100352) if r["GEO"] == "Canada" and r["Commodity"] in ("Canola (rapeseed)", "Soybeans")]
    pr = {"Seed crushed": "seed crushed", "Oil  produced": "oil produced", "Meal produced": "meal produced"}
    by = series_of(rows, lambda r: (r["Commodity"], re.sub(r"\s+", " ", r["Process"])) if re.sub(r"\s+", " ", r["Process"]) in ("Seed crushed", "Oil produced", "Meal produced") else None)
    for (c, p), pts in by.items(): put("ca-crush-%s-%s" % (slug(c), slug(p)), "production", "Crushing: %s %s (monthly)" % (c.split(" (")[0].lower(), p.lower()), "thousand t", "monthly", [(a, v / 1000) for a, v in pts], "StatCan 32-10-0352")
    log("molturacion", len(by))

# ───────── 4. Ganadería ─────────
def per(r):  # "YYYY" + fecha de encuesta -> periodo YYYY-01 / YYYY-07
    s = r.get("Survey date") or ""
    return "%s-%s" % (r["REF_DATE"][:4], "07" if "July" in s else "01")
def inventories():
    rows = [r for r in load(32100130) if r["GEO"] == "Canada" and r["Farm type"] == "On all cattle operations"]
    nm = {"Total cattle": "Total cattle", "Dairy cows": "Dairy cows", "Beef cows": "Beef cows", "Calves, under 1 year": "Calves under 1 year", "Total heifers": "Heifers"}
    by = series_of(rows, lambda r: r["Livestock"] if r["Livestock"] in nm else None, lambda r: num(r))
    for k in list(by): by[k] = None
    by = {}
    for r in rows:
        if r["Livestock"] in nm and num(r) is not None: by.setdefault(r["Livestock"], []).append((per(r), num(r)))
    for k, pts in by.items(): put("ca-cattle-%s" % slug(k), "livestock", "Cattle inventory: %s (1 Jan / 1 Jul)" % nm[k], "thousand head", "semiannual", [(p, v / 1000) for p, v in pts], "StatCan 32-10-0130")
    n = len(by)
    for pid, key, names, tag, ttl in ((32100160, "Hogs", {"Hogs, total": "Total hogs", "Sows and gilts, 6 months and over": "Sows and gilts"}, "hogs", "Hog inventory"),
                                       (32100129, "Sheep", {"Sheep and lambs, total": "Sheep and lambs", "Ewes": "Ewes", "Lambs for marketing": "Lambs for marketing"}, "sheep", "Sheep inventory")):
        by = {}
        for r in load(pid):
            if r["GEO"] == "Canada" and r["Livestock"] in names and num(r) is not None: by.setdefault(r["Livestock"], []).append((per(r), num(r)))
        for k, pts in by.items(): put("ca-%s-%s" % (tag, slug(k)), "livestock", "%s: %s (1 Jan / 1 Jul)" % (ttl, names[k]), "thousand head", "semiannual", [(p, v / 1000) for p, v in pts], "StatCan 32-10-%s" % str(pid)[-4:]); n += 1
    log("inventarios", n)
def sd_period(r):
    s = r.get("Survey date") or ""
    return "%s-%s" % (r["REF_DATE"][:4], "12" if "July" in s else "06")
def supply():
    n = 0
    for pid, col, names, tag, ttl in ((32100139, "Supply and disposition of cattle", {"Slaughter of cattle": "slaughter", "International exports of cattle": "international exports", "International imports of cattle": "international imports", "Calves born": "calves born"}, "cattle", "Cattle"),
                                       (32100200, "Supply and disposition of hogs", {"Pig crop": "pig crop", "International exports of hogs": "international exports", "International imports of hogs": "international imports"}, "hogs", "Hogs")):
        by = {}
        for r in load(pid):
            if r["GEO"] == "Canada" and r[col] in names and num(r) is not None: by.setdefault(r[col], []).append((sd_period(r), num(r)))
        for k, pts in by.items(): put("ca-sd-%s-%s" % (tag, slug(k)), "livestock" if tag == "cattle" else "production", "%s: %s (half-year)" % (ttl, names[k]), "thousand head", "semiannual", [(p, v / 1000) for p, v in pts], "StatCan 32-10-%s" % str(pid)[-4:]); n += 1
    by = {}
    for r in load(32100126):
        if r["GEO"] != "Canada": continue
        e = r["Livestock estimates"]
        if e in ("Total slaughter", "Estimated meat production") and num(r) is not None: by.setdefault((r["Livestock"], e), []).append((r["REF_DATE"], num(r)))
    for (l, e), pts in by.items():
        t = "t" if e.startswith("Estimated") else "head"
        put("ca-meat-%s-%s" % (slug(l), slug(e)), "production", "%s: %s" % (l, e.lower()), "thousand t" if t == "t" else "thousand head", "annual", [(p, v / 1000) for p, v in pts], "StatCan 32-10-0126"); n += 1
    log("oferta ganado", n)

# ───────── 1b. Patata (32-10-0358), fruta fresca (32-10-0364), mantequilla y queso (32-10-0482/0483) ─────────
CWT_T = 0.045359237   # 1 hundredweight = 100 libras = 45,359237 kg (exacto)
def potatoes():
    rows = [r for r in load(32100358) if r["GEO"] == "Canada"]; col = "Area, production and farm value of potatoes"
    spec = {"Production": ("production", "Production", "thousand t", CWT_T / 1e3, "prod"), "Harvested area": ("crops", "Harvested area", "thousand acres", 1e-3, "harea"),
            "Seeded area": ("crops", "Seeded area", "thousand acres", 1e-3, "area"), "Average farm price, potatoes": ("prices", "Average farm price", "CAD/cwt", 1, "price")}
    by = series_of(rows, lambda r: r[col] if r[col] in spec else None); n = 0
    for k, pts in by.items():
        g, nm, u, f, tag = spec[k]
        put("ca-potato-%s" % tag, g, "Potatoes: %s%s" % (nm.lower(), " (1 cwt = 100 lb)" if tag == "price" else ""), u, "annual", [(p, v * f) for p, v in pts], "StatCan 32-10-0358"); n += 1
    log("patata", n)
FRUIT = {"Total fresh fruit": "Total fresh fruit", "Fresh apples": "Apples", "Fresh grapes": "Grapes", "Fresh peaches": "Peaches", "Fresh pears": "Pears", "Fresh blueberries": "Blueberries", "Fresh strawberries": "Strawberries"}
def fruit():
    rows = [r for r in load(32100364) if r["GEO"] == "Canada" and r["UOM"] == "Metric tonnes" and r["Estimates"] in ("Total production", "Marketed production")]
    by = series_of(rows, lambda r: (clean(r["Commodity"]), r["Estimates"]) if clean(r["Commodity"]) in FRUIT else None); n = 0
    for (c, e), pts in by.items():
        put("ca-fruit-%s-%s" % (slug(c), slug(e)), "production", "%s: %s (annual)" % (FRUIT[clean(c)], e.lower()), "t", "annual", pts, "StatCan 32-10-0364"); n += 1
    log("fruta", n)
def dairy_products():
    def q(p): return re.sub(r"-(\d\d)$", lambda m: "-Q%d" % ((int(m.group(1)) - 1) // 3 + 1), p)
    n = 0
    for pid, items, tag in ((32100482, ("Creamery butter",), "butter"), (32100483, ("Cheddar cheese", "Speciality cheese", "Mozzarella cheese"), "cheese")):
        by = series_of([r for r in load(pid) if r["GEO"] == "Canada" and r["UOM"] == "Tonnes" and r["Commodity"] in items], lambda r: r["Commodity"])
        for k, pts in by.items(): put("ca-prod-%s" % slug(k), "production", "Production: %s (quarterly)" % k.lower(), "t", "quarterly", [(q(p), v) for p, v in pts], "StatCan 32-10-%s" % str(pid)[-4:]); n += 1
    log("mantequilla y queso", n)

# ───────── 5. Leche, huevos y aves ─────────
def dairy():
    n = 0
    by = series_of([r for r in load(32100113) if r["GEO"] == "Canada"], lambda r: r["Dairy distribution"] if r["Dairy distribution"] in ("Milk production, total", "Milk sold off farms, total", "Industrial purposes", "Fluid purposes") else None)
    for k, pts in by.items(): put("ca-milk-%s" % slug(k), "milk", "Milk: %s (monthly)" % k.lower().replace(", total", ""), "million litres", "monthly", [(p, v / 1e3) for p, v in pts], "StatCan 32-10-0113"); n += 1
    rows = [r for r in load(32100480) if r["GEO"] == "Canada" and r["Stocks"] == "Total stocks" and r["Commodity"] in ("Creamery butter", "Cheddar cheese", "Skim milk powder", "Whole milk powder")]
    by = series_of(rows, lambda r: r["Commodity"])
    for k, pts in by.items(): put("ca-dairystock-%s" % slug(k), "stocks", "Dairy stocks: %s (quarterly)" % k.lower(), "t", "quarterly", [(re.sub(r"-(\d\d)$", lambda m: "-Q%d" % ((int(m.group(1)) - 1) // 3 + 1), p), v) for p, v in pts], "StatCan 32-10-0480"); n += 1
    log("lacteos", n)
def eggs_poultry():
    n = 0
    rows = [r for r in load(32100121) if r["GEO"] == "Canada"]
    spec = {"Production of eggs in shell  [116111]": ("Eggs in shell: production (monthly)", "million dozen", 1e-6, "prod"), "Average number of layers": ("Laying hens: average number (monthly)", "million", 1e-6, "layers"),
            "Farm price of eggs sold for consumption": ("Eggs: farm price (monthly)", None, 1, "price")}
    for r in rows: r["_k"] = re.sub(r"\s+", " ", r["Production and disposition"]).strip()
    spec = {re.sub(r"\s+", " ", k): v for k, v in spec.items()}
    by = {}
    for r in rows:
        if r["_k"] in spec and num(r) is not None: by.setdefault((r["_k"], r["UOM"]), []).append((r["REF_DATE"], num(r)))
    for (k, u), pts in by.items():
        lab, unit, f, tag = spec[k]
        put("ca-egg-%s" % tag, "production" if tag != "price" else "prices", lab, unit or ("CAD/dozen" if "dozen" in u.lower() and "cent" not in u.lower() else "cents/dozen"), "monthly", [(p, v * f) for p, v in pts], "StatCan 32-10-0121"); n += 1
    rows = [r for r in load(32100122) if r["GEO"] == "Canada" and r["Commodity"] in ("All poultry meat, total", "Chickens, total", "Turkeys, total")]
    by = series_of(rows, lambda r: r["Commodity"])
    for k, pts in by.items(): put("ca-poultrystock-%s" % slug(k), "stocks", "Frozen poultry stocks: %s (monthly)" % k.lower().replace(", total", ""), "thousand t", "monthly", [(p, v / 1e3) for p, v in pts], "StatCan 32-10-0122"); n += 1
    rows = [r for r in load(32100117) if r["GEO"] == "Canada" and r["Production and disposition"] == "Production, total" and r["Estimates"] == "Weight (kilograms)"]
    by = series_of(rows, lambda r: r["Commodity"])
    for k, pts in by.items(): put("ca-poultry-%s" % slug(k), "production", "Poultry meat production: %s" % k.lower().replace(" (including stewing hen)", ""), "thousand t", "annual", [(p, v / 1e6) for p, v in pts], "StatCan 32-10-0117"); n += 1
    log("huevos y aves", n)

# ───────── 6. Ingresos, costes y precios ─────────
def finance():
    n = 0
    for pid, per_lbl, freq, tag in ((32100045, "annual", "annual", "recA"), (32100046, "quarterly", "quarterly", "recQ")):
        rows = [r for r in load(pid) if r["GEO"] == "Canada"]
        names = sorted({r["Type of cash receipts"] for r in rows})
        want = [("Total farm cash receipts", "Total"), ("Total crop receipts", "Crops"), ("Total livestock", "Livestock"), ("Wheat (except durum", "Wheat"), ("Canola", "Canola"), ("Soybeans", "Soybeans"), ("Corn for grain", "Grain corn"), ("Cattle and calves", "Cattle and calves"), ("Hogs", "Hogs"), ("Dairy products", "Dairy"), ("Poultry", "Poultry"), ("Eggs", "Eggs")]
        for pre, lab in want:
            m = [x for x in names if x.startswith(pre)]
            if not m: continue
            nm = m[0]
            pts = [(r["REF_DATE"] if freq == "annual" else re.sub(r"-(\d\d)$", lambda mm: "-Q%d" % ((int(mm.group(1)) - 1) // 3 + 1), r["REF_DATE"]), num(r)) for r in rows if r["Type of cash receipts"] == nm]
            put("ca-%s-%s" % (tag, slug(lab)), "income", "Farm cash receipts: %s (%s)" % (lab.lower(), per_lbl), "CAD million", freq, [(p, v / 1e6 if v is not None else None) for p, v in pts], "StatCan 32-10-%s" % str(pid)[-4:]); n += 1
    rows = [r for r in load(32100052) if r["GEO"] == "Canada"]
    by = series_of(rows, lambda r: r["Income components"] if r["Income components"] in ("Net cash income", "Realized net income", "Net income, total", "Cash receipts, total", "Operating expenses and depreciation charges", "Supplementary payments") else None)
    for k, pts in by.items(): put("ca-nfi-%s" % slug(k), "income", "Farm income: %s" % k.lower().replace(", total", ""), "CAD million", "annual", [(p, v / 1e6) for p, v in pts], "StatCan 32-10-0052"); n += 1
    rows = [r for r in load(32100098) if r["GEO"] == "Canada"]
    uom = rows[0]["UOM"] if rows else "index"
    by = series_of(rows, lambda r: clean(r["Commodity groups"]))
    for k, pts in by.items(): put("ca-fppi-%s" % slug(k), "idx_perc", "Farm product price index: %s (monthly)" % k.lower(), re.sub(r"^Index,\s*", "index ", uom), "monthly", pts, "StatCan 32-10-0098"); n += 1
    rows = [r for r in load(18100258) if r["GEO"] == "Canada"]
    uom = rows[0]["UOM"] if rows else "index"
    keep = ("Farm input total", "Buildings", "Machinery and motor vehicles", "Machinery fuel", "Crop production", "Commercial seed and plant", "Fertilizer", "Nitrogen fertilizers", "Pesticides", "Animal production", "Commercial feed", "Veterinary fees and drugs", "Production insurance")
    by = series_of(rows, lambda r: r["Price index"] if r["Price index"] in keep else None)
    for k, pts in by.items():
        pts = [(re.sub(r"-(\d\d)$", lambda mm: "-Q%d" % ((int(mm.group(1)) - 1) // 3 + 1), p) if re.search(r"-\d\d$", p) else p, v) for p, v in pts]
        put("ca-fiip-%s" % slug(k), "idx_pag", "Farm input price index: %s (quarterly)" % k.lower(), re.sub(r"^Index,\s*", "index ", uom), "quarterly", pts, "StatCan 18-10-0258"); n += 1
    log("finanzas", n)
def fertilizer():
    rows = [r for r in load(32100038) if r["GEO"] == "Canada" and r["Period"] == "July to June"]
    by = series_of(rows, lambda r: r["Fertilizer product type"])
    for k, pts in by.items():
        nm = re.sub(r"\s+\d[\d\-\.]*.*$", "", k)
        pts = [(re.split(r"[/-]", p)[-1][:4], v / 1e3) for p, v in pts]
        put("ca-fert-%s" % slug(nm), "inputs_f", "Fertilizer shipments to Canadian agriculture: %s (Jul-Jun year)" % nm.lower(), "thousand t", "annual", pts, "StatCan 32-10-0038")
    log("fertilizantes", len(by))


# ───────── 6b. Costes de explotación (32-10-0049), capital y deuda (32-10-0050/51), combustible (18-10-0001) ─────────
EXP = {"Total expenses after rebates": "total expenses", "Total operating expenses after rebates": "operating expenses", "Fertilizer and lime, after rebates": "fertiliser and lime",
       "Pesticides, after rebates": "pesticides", "Commercial seed, after rebates": "seed", "Commercial feed, after rebates": "feed", "Machinery fuel, after rebates": "machinery fuel",
       "Interest, after rebates": "interest", "Cash wages including room and board, after rebates": "wages", "Livestock and poultry purchases, after rebates": "livestock purchases",
       "Electricity, after rebates": "electricity", "Heating fuel, after rebates": "heating fuel", "Machinery repairs and other expenses": "machinery repairs", "Total depreciation": "depreciation", "Property taxes, after rebates": "property taxes"}
EXP_PROV = ("Total expenses after rebates", "Fertilizer and lime, after rebates", "Commercial feed, after rebates", "Machinery fuel, after rebates", "Interest, after rebates")
PROV = ("Saskatchewan", "Alberta", "Manitoba", "Ontario", "Quebec")
def costs():
    n = 0
    rows = [r for r in load(32100049) if r["GEO"] == "Canada" or r["GEO"] in PROV]
    for geo in ("Canada",) + PROV:
        sub = [r for r in rows if r["GEO"] == geo]
        by = series_of(sub, lambda r: r["Expenses and rebates"] if r["Expenses and rebates"] in EXP and (geo == "Canada" or r["Expenses and rebates"] in EXP_PROV) else None)
        for k, pts in by.items():
            put("ca-exp-%s-%s" % (slug(geo), slug(EXP[k])), "costs", "Farm operating expenses: %s%s (annual)" % (EXP[k], "" if geo == "Canada" else ", " + geo), "CAD million", "annual", [(p, v / 1e6) for p, v in pts], "StatCan 32-10-0049"); n += 1
    log("costes", n)
BAL = {"Total value of farm capital": "total farm capital", "Land and buildings": "land and buildings", "Machinery and equipment": "machinery and equipment", "Livestock and poultry": "livestock and poultry"}
DEBT = {"Farm debt outstanding, total": "total", "Chartered banks": "chartered banks", "Credit unions": "credit unions", "Federal government agencies": "federal agencies", "Provincial government agencies": "provincial agencies", "Private individuals and supply companies": "private lenders and suppliers"}
def balance():
    n = 0
    by = series_of([r for r in load(32100050) if r["GEO"] == "Canada"], lambda r: r["Farm items"] if r["Farm items"] in BAL else None)
    for k, pts in by.items(): put("ca-cap-%s" % slug(BAL[k]), "income", "Farm balance sheet, value at 1 July: %s (annual)" % BAL[k], "CAD million", "annual", [(p, v / 1e6) for p, v in pts], "StatCan 32-10-0050"); n += 1
    by = series_of([r for r in load(32100051) if r["GEO"] == "Canada"], lambda r: r["Type of lender"] if r["Type of lender"] in DEBT else None)
    for k, pts in by.items(): put("ca-debt-%s" % slug(DEBT[k]), "income", "Farm debt outstanding: %s (annual)" % DEBT[k], "CAD million", "annual", [(p, v / 1e6) for p, v in pts], "StatCan 32-10-0051"); n += 1
    log("balance", n)
FUELS = {"Diesel fuel at self service filling stations": "diesel (self-service)", "Regular unleaded gasoline at self service filling stations": "regular gasoline (self-service)", "Household heating fuel": "household heating fuel"}
FUEL_GEO = ("Canada", "Calgary, Alberta", "Edmonton, Alberta", "Regina, Saskatchewan", "Saskatoon, Saskatchewan", "Winnipeg, Manitoba", "Toronto, Ontario", "Montréal, Quebec", "Vancouver, British Columbia")
def fuel():
    n = 0
    rows = [r for r in load(18100001) if r["GEO"] in FUEL_GEO]
    for geo in FUEL_GEO:
        for fk, fl in FUELS.items():
            if geo != "Canada" and not fk.startswith("Diesel"): continue
            by = series_of([r for r in rows if r["GEO"] == geo and r["Type of fuel"] == fk], lambda r: fk)
            for k, pts in by.items():
                city = geo.split(",")[0].replace("é", "e")
                put("ca-fuel-%s-%s" % (slug(city), slug(fl)), "inputs", "Retail price: %s, %s (monthly)" % (fl, geo.split(",")[0]), "cents per litre", "monthly", pts, "StatCan 18-10-0001"); n += 1
    log("combustible", n)

# ───────── 7. Comercio exterior ─────────
def trade():
    rows = load(12100163)
    ck = [k for k in rows[0] if k.startswith("North American Product")][0]
    rows = [r for r in rows if r["GEO"] == "Canada" and r["Basis"] == "Customs" and r["Seasonal adjustment"] == "Unadjusted"]
    want = {"Farm, fishing and intermediate food products": "farm, fishing and food (total)", "Farm and fishing products": "farm and fishing products", "Live animals": "live animals", "Wheat": "wheat", "Canola (including rapeseed)": "canola",
            "Fresh fruit, nuts and vegetables, and pulse crops": "fruit, nuts, vegetables and pulses", "Other crop products": "other crop products", "Other animal products": "other animal products", "Animal feed": "animal feed",
            "Fertilizers, pesticides and other chemical products": "fertilizers, pesticides and chemicals", "Potash": "potash", "Agricultural, lawn and garden machinery and equipment": "agricultural machinery",
            "Meat products": "meat products", "Dairy products": "dairy products", "Other food products": "other food products", "Food, beverage and tobacco products": "food, beverage and tobacco"}
    n = 0; by = {}
    for r in rows:
        nm = re.sub(r"\s*\[.*?\]\s*$", "", r[ck]).strip()
        if nm in want and r["Trade"] in ("Export", "Import"):
            v = num(r)
            if v is not None: by.setdefault((nm, r["Trade"]), {})[r["REF_DATE"]] = v / 1e6
    for (nm, tr), d in by.items():
        pts = sorted(d.items())
        put("ca-trade-%s-%s" % ("exp" if tr == "Export" else "imp", slug(want[nm])), "trade", "%s: %s (monthly)" % ("Exports" if tr == "Export" else "Imports", want[nm]), "CAD million", "monthly", pts, "StatCan 12-10-0163"); n += 1
        if tr == "Export" and (nm, "Import") in by:
            im = by[(nm, "Import")]
            bal = [(p, v - im[p]) for p, v in pts if p in im]
            put("ca-trade-bal-%s" % slug(want[nm]), "trade", "Trade balance: %s (monthly)" % want[nm], "CAD million", "monthly", bal, "StatCan 12-10-0163"); n += 1
    for k in OUT:
        if k.startswith("ca-trade-bal-"): OUT[k]["changePct"] = None
    log("comercio", n)
# ───────── 8. Socios comerciales ─────────
def load_filtered(pid, pred):
    """Descarga el CSV completo pero solo guarda las filas que cumplen pred (tablas enormes)."""
    last = None
    for i in range(2):
        try:
            info = json.loads(urllib.request.urlopen(urllib.request.Request(WDS + "getFullTableDownloadCSV/%d/en" % pid, headers=UA), timeout=60).read())
            raw = fetch_resume(info["object"]); log("descargada", pid, len(raw) // 1024, "KB")
            z = zipfile.ZipFile(io.BytesIO(raw)); name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
            rows = [r for r in csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")) if pred(r)]
            log("tabla", pid, len(rows), "filas filtradas"); return rows
        except Exception as e: last = e; time.sleep(5)
    raise RuntimeError("%s: %s" % (pid, last))
def partners():
    n = 0
    # a) Total mercancías por socio, mensual (12-10-0011)
    rows = [r for r in load(12100011) if r["GEO"] == "Canada" and r["Basis"] == "Customs" and r["Seasonal adjustment"] == "Unadjusted" and r["Trade"] in ("Import", "Export")]
    pk = [k for k in rows[0] if k.startswith("Principal trading")][0]
    by = {}
    for r in rows:
        v = num(r)
        if v is not None: by.setdefault((r[pk], r["Trade"]), {})[r["REF_DATE"]] = v / 1e6
    skip = ("All countries", "European Union")
    for tr, tag, word in (("Export", "exp", "Exports to"), ("Import", "imp", "Imports from")):
        cand = {k[0]: sorted(d.items())[-12:] for k, d in by.items() if k[1] == tr and k[0] not in skip}
        top = sorted(cand, key=lambda k: -sum(v for _, v in cand[k]))[:12] + ["European Union"]
        for c in top:
            d = by.get((c, tr))
            if d: put("ca-tp-%s-%s" % (tag, slug(c)), "partners", "%s %s: all goods (monthly)" % (word, c), "CAD million", "monthly", sorted(d.items()), "StatCan 12-10-0011"); n += 1
    # b) Agro-alimentario por socio, anual (12-10-0173)
    rows = load_filtered(12100173, lambda r: r["GEO"] == "Canada" and r["Trade"] in ("Export", "Import") and r[[k for k in r if k.startswith("North American Product")][0]].startswith("Farm, fishing and intermediate"))
    pk = "Trading partner"; by = {}
    for r in rows:
        v = num(r)
        if v is not None: by.setdefault((r[pk], r["Trade"]), {})[r["REF_DATE"]] = v / 1e6
    for tr, tag, word in (("Export", "exp", "Exports to"), ("Import", "imp", "Imports from")):
        cand = {k[0]: sorted(d.items()) for k, d in by.items() if k[1] == tr and k[0] != "All countries" and d}
        top = sorted(cand, key=lambda k: -(cand[k][-1][1] if cand[k][-1][0] >= str(datetime.date.today().year - 2) else 0))[:12]
        for c in top:
            put("ca-tpa-%s-%s" % (tag, slug(c)), "partners", "%s %s: farm, fishing and food (annual)" % (word, c), "CAD million", "annual", cand[c], "StatCan 12-10-0173"); n += 1
    log("socios", n)
# ───────── 9. Balance de granos, vacuno y comercio por provincia y socio ─────────
GB_CROPS = {"All wheat": "Wheat (all)", "Durum wheat": "Durum wheat", "Barley": "Barley", "Oats": "Oats", "Canola": "Canola", "Soybeans": "Soybeans", "Flaxseed": "Flaxseed", "Dry peas": "Dry peas", "Lentils": "Lentils", "Rye": "Rye"}
GB_ITEMS = {"Total supplies": "total supplies", "Production": "production", "Total exports": "exports", "Total domestic disappearance": "domestic disappearance", "Total ending stocks": "ending stocks"}
def grain_balance():
    """32-10-0013: cierre de campaña (31 de julio). El periodo es el año de cosecha: REF_DATE 2026-07 = campaña ago 2025 - jul 2026 = «2025»."""
    n = 0; by = {}
    for r in load(32100013):
        if r["GEO"] != "Canada" or not r["REF_DATE"].endswith("-07"): continue
        c, it = r["Type of crop"], r["Supply and disposition of grains"]
        if c in GB_CROPS and it in GB_ITEMS and num(r) is not None: by.setdefault((c, it), []).append((str(int(r["REF_DATE"][:4]) - 1), num(r) / 1000))
    for (c, it), pts in by.items():
        put("ca-gb-%s-%s" % (slug(c), slug(GB_ITEMS[it])), "stocks" if it == "Total ending stocks" else "production", "Grain balance %s: %s (crop year Aug-Jul)" % (GB_CROPS[c], GB_ITEMS[it]), "thousand t", "annual", pts, "StatCan 32-10-0013"); n += 1
    log("balance de granos", n)
def beef():
    """32-10-0125: vacuno y terneros, producción en finca y de carne (anual, Canadá). Hermana de 32-10-0126 (porcino y ovino)."""
    n = 0; want = {"Total slaughter": ("total slaughter", "head"), "Inspected slaughter": ("inspected slaughter", "head"), "Live exports": ("live exports", "head"), "Live imports": ("live imports", "head"),
                   "Average cold dressed weight": ("average cold dressed weight", "kg"), "Estimated meat production": ("estimated meat production", "t")}
    by = {}
    for r in load(32100125):
        e = r["Livestock estimates"]
        if r["GEO"] == "Canada" and e in want and num(r) is not None: by.setdefault((r["Livestock"], e), []).append((r["REF_DATE"], num(r)))
    for (l, e), pts in by.items():
        t = want[e][1]
        if t == "kg": pts, unit = pts, "kg"
        elif t == "t": pts, unit = [(p, v / 1000) for p, v in pts], "thousand t"
        else: pts, unit = [(p, v / 1000) for p, v in pts], "thousand head"
        put("ca-meat-%s-%s" % (slug(l), slug(e)), "production", "%s: %s" % (l, want[e][0]), unit, "annual", pts, "StatCan 32-10-0125"); n += 1
    log("vacuno y sacrificio", n)
PROV_ES = {"Newfoundland and Labrador": "NL", "Prince Edward Island": "PE", "Nova Scotia": "NS", "New Brunswick": "NB", "Quebec": "QC", "Ontario": "ON", "Manitoba": "MB", "Saskatchewan": "SK", "Alberta": "AB", "British Columbia": "BC"}
TP_PARTNERS = ["All countries", "United States", "China", "Mexico", "Japan"]
def province_trade():
    """12-10-0175: comercio de productos agrarios, pesqueros y alimentos intermedios por provincia y socio (mensual, dólares)."""
    n = 0; by = {}
    rows = load_filtered(12100175, lambda r: r["North American Product Classification System (NAPCS)"].startswith("Farm, fishing") and r["GEO"] in PROV_ES and r["Trade"] in ("Domestic export", "Import") and r["Principal trading partners"] in TP_PARTNERS)
    for r in rows:
        v = num(r)
        if v is not None and r["REF_DATE"] >= "2018-01": by.setdefault((r["GEO"], r["Trade"], r["Principal trading partners"]), []).append((r["REF_DATE"], v / 1e6))
    for (g, tr, pa), pts in by.items():
        if tr == "Import" and pa != "All countries": continue
        ex = tr == "Domestic export"
        put("ca-tpr-%s-%s-%s" % ("exp" if ex else "imp", PROV_ES[g].lower(), slug(pa)), "partners", "%s %s: farm, fishing and food, %s (monthly)" % ("Domestic exports" if ex else "Imports", ("to " + pa) if ex and pa != "All countries" else "(all countries)", g), "CAD million", "monthly", pts, "StatCan 12-10-0175"); n += 1
    log("comercio por provincia", n)
def main():
    import os
    only = [x for x in os.environ.get("ONLY", "").replace(",", " ").split() if x]
    allf = (crops, potatoes, fruit, dairy_products, stocks, deliveries, crush, inventories, supply, dairy, eggs_poultry, finance, fertilizer, costs, balance, fuel, trade, partners, grain_balance, beef, province_trade)
    if only:
        try:
            for x in json.loads((ROOT / "data" / "canada-stats.json").read_text())["countries"]["CA"]["series"]: OUT[x["id"]] = x
        except Exception as e: log("sin base previa", repr(e))
    for fn in [f for f in allf if not only or f.__name__ in only]:
        try: fn()
        except Exception as e: log("ERROR", fn.__name__, repr(e))
    if len(OUT) < 40:
        log("demasiado pocas series", len(OUT)); (ROOT / "data" / "canada-stats-log.txt").write_text("\n".join(LOG)); sys.exit(1)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"CA": {"name": "Canada", "source": {"name": "Statistics Canada", "url": "https://www150.statcan.gc.ca/n1/en/subjects/agriculture_and_food", "license": "Statistics Canada Open Licence"}, "series": list(OUT.values())}},
           "log": LOG[-30:]}
    (ROOT / "data" / "canada-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "canada-stats-log.txt").write_text("\n".join(LOG)); log("series", len(OUT))
if __name__ == "__main__": main()

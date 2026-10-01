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
         "Soybeans": "Soybeans", "Peas, dry": "Dry peas", "Lentils": "Lentils", "Flaxseed": "Flaxseed", "Sunflower seed": "Sunflower seed", "Mustard seed": "Mustard seed", "Chick peas": "Chickpeas", "Canary seed": "Canary seed"}
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
def main():
    import os
    only = [x for x in os.environ.get("ONLY", "").replace(",", " ").split() if x]
    allf = (crops, stocks, deliveries, crush, inventories, supply, dairy, eggs_poultry, finance, fertilizer, trade)
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
main()

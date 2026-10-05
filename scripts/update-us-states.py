#!/usr/bin/env python3
"""EE. UU. por estado (y nacional): USDA NASS Quick Stats y USDA ERS -> data/us-states/<ESTADO>.json, data/us-states/US.json y data/us-states/index.json
Bloques (todo tal como lo publica la fuente; lo suprimido -(D), (Z), (S), (NA)...- queda como hueco, nunca como cero):
  sacrificio comercial mensual (cabezas y peso vivo; nacional tambien peso canal medio por cabeza) de vacuno, terneros, porcino, ovino, pollos y pavos
  existencias de grano trimestrales (maiz, soja, trigo: total, en la explotacion y fuera de ella)
  valor de la tierra (USD por acre) y arrendamiento en efectivo (USD por acre, por estado y por condado)
  leche (produccion mensual, por vaca y vacas de leche), huevos (produccion mensual) y gallinas ponedoras
  precios recibidos mensuales por estado (los productos que NASS publica a ese nivel)
  Censo Agrario 2022 por estado y por condado (explotaciones, superficie, tamano medio, ventas, ayudas federales, regadio)
  renta agraria por estado de ERS (Farm Income and Wealth Statistics, ultimo fichero publicado)
La clave (secret NASS_API_KEY) solo se lee del entorno y nunca se escribe. Si una consulta falla, se conserva lo anterior de esa serie (nunca se borra un dato).
Uso: update-us-states.py [--outdir DIR] [--years N]"""
import csv, datetime, io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://quickstats.nass.usda.gov/api/api_GET/"
ERS_PAGE = "https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-u-s-and-state-level-farm-income-and-wealth-statistics"
LOG = []
MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
# id, bloque, short_desc, unidad, frecuencia (M mensual, Q trimestral -primero de mes-, A anual), niveles
def S(i, blk, sd, unit, fq, lv=("STATE", "NATIONAL"), src="SURVEY"): return dict(id=i, blk=blk, sd=sd, unit=unit, fq=fq, lv=lv, src=src)
SPEC = [
    S("sl_cattle_hd", "slaughter", "CATTLE, GE 500 LBS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_cattle_lb", "slaughter", "CATTLE, GE 500 LBS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_calves_hd", "slaughter", "CATTLE, CALVES, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_calves_lb", "slaughter", "CATTLE, CALVES, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_hogs_hd", "slaughter", "HOGS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_hogs_lb", "slaughter", "HOGS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_sheep_hd", "slaughter", "SHEEP, INCL LAMBS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_sheep_lb", "slaughter", "SHEEP, INCL LAMBS, SLAUGHTER, COMMERCIAL - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_chick_hd", "slaughter", "CHICKENS, YOUNG, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_chick_lb", "slaughter", "CHICKENS, YOUNG, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_turkey_hd", "slaughter", "TURKEYS, YOUNG, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN HEAD", "head", "M"),
    S("sl_turkey_lb", "slaughter", "TURKEYS, YOUNG, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN LB, LIVE BASIS", "lb live", "M"),
    S("sl_chick_all_hd", "slaughter", "CHICKENS, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN HEAD", "head", "M", ("NATIONAL",)),
    S("sl_turkey_all_hd", "slaughter", "TURKEYS, SLAUGHTER, FI - SLAUGHTERED, MEASURED IN HEAD", "head", "M", ("NATIONAL",)),
    S("dw_cattle", "slaughter", "CATTLE, GE 500 LBS, SLAUGHTER, COMMERCIAL, FI - SLAUGHTERED, MEASURED IN LB / HEAD, DRESSED BASIS", "lb/head dressed", "M", ("NATIONAL",)),
    S("dw_hogs", "slaughter", "HOGS, SLAUGHTER, COMMERCIAL, FI - SLAUGHTERED, MEASURED IN LB / HEAD, DRESSED BASIS", "lb/head dressed", "M", ("NATIONAL",)),
    S("dw_sheep", "slaughter", "SHEEP, INCL LAMBS, SLAUGHTER, COMMERCIAL, FI - SLAUGHTERED, MEASURED IN LB / HEAD, DRESSED BASIS", "lb/head dressed", "M", ("NATIONAL",)),
    S("dw_calves", "slaughter", "CATTLE, CALVES, SLAUGHTER, COMMERCIAL, FI - SLAUGHTERED, MEASURED IN LB / HEAD, DRESSED BASIS", "lb/head dressed", "M", ("NATIONAL",)),
    S("st_corn", "stocks", "CORN, GRAIN - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_corn_on", "stocks", "CORN, ON FARM, GRAIN - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_corn_off", "stocks", "CORN, OFF FARM, GRAIN - STOCKS, MEASURED IN BU", "bu", "Q"),
    S("st_soy", "stocks", "SOYBEANS - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_soy_on", "stocks", "SOYBEANS, ON FARM - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_soy_off", "stocks", "SOYBEANS, OFF FARM - STOCKS, MEASURED IN BU", "bu", "Q"),
    S("st_wheat", "stocks", "WHEAT - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_wheat_on", "stocks", "WHEAT, ON FARM - STOCKS, MEASURED IN BU", "bu", "Q"), S("st_wheat_off", "stocks", "WHEAT, OFF FARM - STOCKS, MEASURED IN BU", "bu", "Q"),
    S("lv_all", "land", "AG LAND, INCL BUILDINGS - ASSET VALUE, MEASURED IN $ / ACRE", "USD/acre", "A"), S("lv_crop", "land", "AG LAND, CROPLAND - ASSET VALUE, MEASURED IN $ / ACRE", "USD/acre", "A"),
    S("lv_crop_irr", "land", "AG LAND, CROPLAND, IRRIGATED - ASSET VALUE, MEASURED IN $ / ACRE", "USD/acre", "A"), S("lv_crop_dry", "land", "AG LAND, CROPLAND, NON-IRRIGATED - ASSET VALUE, MEASURED IN $ / ACRE", "USD/acre", "A"),
    S("lv_pasture", "land", "AG LAND, PASTURELAND - ASSET VALUE, MEASURED IN $ / ACRE", "USD/acre", "A"),
    S("rt_crop", "land", "RENT, CASH, CROPLAND - EXPENSE, MEASURED IN $ / ACRE", "USD/acre", "A"), S("rt_crop_irr", "land", "RENT, CASH, CROPLAND, IRRIGATED - EXPENSE, MEASURED IN $ / ACRE", "USD/acre", "A"),
    S("rt_crop_dry", "land", "RENT, CASH, CROPLAND, NON-IRRIGATED - EXPENSE, MEASURED IN $ / ACRE", "USD/acre", "A"), S("rt_pasture", "land", "RENT, CASH, PASTURELAND - EXPENSE, MEASURED IN $ / ACRE", "USD/acre", "A"),
    S("mk_prod", "dairy", "MILK - PRODUCTION, MEASURED IN LB", "lb", "M"), S("mk_cow", "dairy", "MILK - PRODUCTION, MEASURED IN LB / HEAD", "lb/cow", "M"), S("mk_cows", "dairy", "CATTLE, COWS, MILK - INVENTORY", "head", "M"),
    S("eg_prod", "dairy", "EGGS - PRODUCTION, MEASURED IN EGGS", "eggs", "M"), S("eg_layers", "dairy", "CHICKENS, LAYERS - INVENTORY", "head", "M"),
    S("pr_corn", "prices", "CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU", "USD/bu", "M"), S("pr_soy", "prices", "SOYBEANS - PRICE RECEIVED, MEASURED IN $ / BU", "USD/bu", "M"),
    S("pr_wheat", "prices", "WHEAT - PRICE RECEIVED, MEASURED IN $ / BU", "USD/bu", "M"), S("pr_oats", "prices", "OATS - PRICE RECEIVED, MEASURED IN $ / BU", "USD/bu", "M"),
    S("pr_barley", "prices", "BARLEY - PRICE RECEIVED, MEASURED IN $ / BU", "USD/bu", "M"), S("pr_sorghum", "prices", "SORGHUM, GRAIN - PRICE RECEIVED, MEASURED IN $ / CWT", "USD/cwt", "M"),
    S("pr_hay", "prices", "HAY - PRICE RECEIVED, MEASURED IN $ / TON", "USD/short ton", "M"), S("pr_alfalfa", "prices", "HAY, ALFALFA - PRICE RECEIVED, MEASURED IN $ / TON", "USD/short ton", "M"),
    S("pr_hay_other", "prices", "HAY, (EXCL ALFALFA) - PRICE RECEIVED, MEASURED IN $ / TON", "USD/short ton", "M"), S("pr_cotton", "prices", "COTTON, UPLAND - PRICE RECEIVED, MEASURED IN $ / LB", "USD/lb", "M"),
    S("pr_peanuts", "prices", "PEANUTS - PRICE RECEIVED, MEASURED IN $ / LB", "USD/lb", "M"), S("pr_canola", "prices", "CANOLA - PRICE RECEIVED, MEASURED IN $ / CWT", "USD/cwt", "M"),
    S("pr_milk", "prices", "MILK - PRICE RECEIVED, MEASURED IN $ / CWT", "USD/cwt", "M"),
]
CENSUS = [  # Censo Agrario 2022 (dominio TOTAL), por estado y condado
    ("ce_farms", "FARM OPERATIONS - NUMBER OF OPERATIONS", "farms"), ("ce_acres", "FARM OPERATIONS - ACRES OPERATED", "acres"),
    ("ce_avgsize", "FARM OPERATIONS - AREA OPERATED, MEASURED IN ACRES / OPERATION", "acres/farm"), ("ce_sales", "COMMODITY TOTALS - SALES, MEASURED IN $", "USD"),
    ("ce_crops", "CROP TOTALS - SALES, MEASURED IN $", "USD"), ("ce_animals", "ANIMAL TOTALS, INCL PRODUCTS - SALES, MEASURED IN $", "USD"),
    ("ce_govt", "GOVT PROGRAMS, FEDERAL - RECEIPTS, MEASURED IN $", "USD"), ("ce_cropland", "AG LAND, CROPLAND - ACRES", "acres"),
    ("ce_irrigated", "AG LAND, IRRIGATED - ACRES", "acres"), ("ce_age", "PRODUCERS - AGE, AVG, MEASURED IN YEARS", "years"), ("ce_age", "PRODUCERS, (ALL) - AGE, AVG, MEASURED IN YEARS", "years"), ("ce_age", "OPERATORS - AGE, AVG, MEASURED IN YEARS", "years"),
]
COUNTY_RENTS = [("rt_crop_dry", "RENT, CASH, CROPLAND, NON-IRRIGATED - EXPENSE, MEASURED IN $ / ACRE"), ("rt_crop_irr", "RENT, CASH, CROPLAND, IRRIGATED - EXPENSE, MEASURED IN $ / ACRE"), ("rt_pasture", "RENT, CASH, PASTURELAND - EXPENSE, MEASURED IN $ / ACRE")]

def num(v):
    s = str(v).replace(",", "").strip()
    return float(s) if re.match(r"^-?\d+(\.\d+)?$", s) else None
def period(r, fq):
    y = str(r.get("year")); rp = str(r.get("reference_period_desc") or "").upper().strip()
    if fq == "A": return y if rp == "YEAR" else None
    m = re.match(r"^(?:FIRST OF |END OF )?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$", rp)
    if not m: return None
    return "%s-%02d" % (y, MON[m.group(1)])
def api(key, **p):
    p.update(key=key, format="JSON"); u = API + "?" + urllib.parse.urlencode(p); last = ""
    for i in range(5):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "dehesaindex-us-states/1.0"}), timeout=240) as r: return json.loads(r.read().decode("utf-8")).get("data") or []
        except urllib.error.HTTPError as e:
            if e.code == 400: return []      # sin registros (o seleccion demasiado grande: se registra)
            last = "HTTP %s" % e.code; time.sleep(30 * (i + 1))
        except Exception as e: last = repr(e)[:120]; time.sleep(15 * (i + 1))
    raise RuntimeError(last)
def keep(r):
    d = r.get("domaincat_desc") or ""
    return d in ("", "NOT SPECIFIED") and (r.get("domain_desc") or "TOTAL") == "TOTAL"

def nass(key, years, out, county):
    y0 = datetime.date.today().year - years
    for sp in SPEC:
        for lv in sp["lv"]:
            try: rows = api(key, source_desc=sp["src"], short_desc=sp["sd"], agg_level_desc=lv, year__GE=str(y0))
            except Exception as e: log("ERROR", sp["id"], lv, e); continue
            n = 0
            for r in rows:
                if not keep(r): continue
                p = period(r, sp["fq"]); v = num(r.get("Value"))
                if not p or v is None: continue
                st = "US" if lv == "NATIONAL" else r.get("state_alpha")
                if st != "US" and st not in STATES: continue
                out.setdefault(st, {}).setdefault(sp["id"], {})[p] = v; n += 1
            log(sp["id"], lv, len(rows), "filas,", n, "puntos")
    # Censo 2022
    done = set()
    for cid, sd, unit in CENSUS:
        for lv in ("NATIONAL", "STATE", "COUNTY"):
            if (cid, lv) in done: continue
            try: rows = api(key, source_desc="CENSUS", year="2022", short_desc=sd, agg_level_desc=lv, domain_desc="TOTAL")
            except Exception as e: log("ERROR censo", cid, lv, e); continue
            n = 0
            for r in rows:
                if not keep(r): continue
                v = num(r.get("Value"))
                if v is None: continue
                if lv == "COUNTY":
                    st = r.get("state_alpha"); f = (r.get("state_fips_code") or "") + (r.get("county_code") or "")
                    if st in STATES and len(f) == 5: county.setdefault(st, {}).setdefault(f, {"name": (r.get("county_name") or "").title()})[cid] = v; n += 1
                else:
                    st = "US" if lv == "NATIONAL" else r.get("state_alpha")
                    if st == "US" or st in STATES: out.setdefault(st, {}).setdefault("census", {})[cid] = v; n += 1
            log("censo", cid, lv, len(rows), "filas,", n, "valores")
            if n: done.add((cid, lv))
    # arrendamientos por condado (ultimos 3 anos publicados)
    for rid, sd in COUNTY_RENTS:
        try: rows = api(key, source_desc="SURVEY", short_desc=sd, agg_level_desc="COUNTY", year__GE=str(datetime.date.today().year - 3))
        except Exception as e: log("ERROR rentas condado", rid, e); continue
        n = 0
        for r in rows:
            if not keep(r) or str(r.get("reference_period_desc")).upper() != "YEAR": continue
            v = num(r.get("Value")); st = r.get("state_alpha"); f = (r.get("state_fips_code") or "") + (r.get("county_code") or "")
            if v is None or st not in STATES or len(f) != 5 or f.endswith("998"): continue
            c = county.setdefault(st, {}).setdefault(f, {"name": (r.get("county_name") or "").title()}); c.setdefault(rid, {})[str(r.get("year"))] = v; n += 1
        log("rentas condado", rid, len(rows), "filas,", n, "valores")

# ---------- ERS: renta agraria por estado ----------
ERS_VARS = [  # (id, patron sobre la descripcion normalizada -espacios antes de coma quitados, minusculas-), tal como la publica ERS en Farm Income and Wealth Statistics
    ("cash_receipts", r"^cash receipts value, all commodities, all$"), ("cr_crops", r"^cash receipts value, crops, all$"), ("cr_animals", r"^cash receipts value, livestock and products, all$"),
    ("govt", r"^value of government payments, total$"), ("expenses", r"^production expenses, all, incl\. operator dwellings$"), ("gross_income", r"^gross farm income$"),
    ("net_cash", r"^net cash income$"), ("net_income", r"^net farm income$")]
def ers_norm(d): return re.sub(r"\s+", " ", re.sub(r"\s+,", ",", d or "")).strip().lower()
ERS_UNIT = {}
def ers(out):
    try:
        with urllib.request.urlopen(urllib.request.Request(ERS_PAGE, headers={"User-Agent": "Mozilla/5.0 dehesaindex"}), timeout=120) as r: page = r.read().decode("utf-8", "replace")
    except Exception as e: log("ERROR ERS pagina", repr(e)[:120]); return None
    rel = []
    for href in set(re.findall(r'href="([^"]+-release[^"]*\.zip)"', page)):
        m = re.search(r"/([a-z]+)-(\d{1,2})-(\d{4})-release", href)
        if m:
            try: d = datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date(); rel.append((d, href))
            except ValueError: pass
    if not rel: log("ERROR ERS: sin ficheros de publicacion"); return None
    d, href = max(rel); url = urllib.parse.urljoin(ERS_PAGE, href); log("ERS ultima publicacion", d, url)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 dehesaindex"}), timeout=300) as r: z = zipfile.ZipFile(io.BytesIO(r.read()))
    except Exception as e: log("ERROR ERS zip", repr(e)[:120]); return None
    names = [n for n in z.namelist() if n.lower().endswith(".csv")]; log("ERS ficheros", names)
    seen = {}; got = 0
    for n in names:
        with z.open(n) as fh:
            rd = csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig", errors="replace"))
            cols = rd.fieldnames or []; log("ERS columnas", n, cols[:14])
            vcol = next((c for c in cols if c.lower() in ("variabledescriptiontotal", "variable_description_total")), None) or next((c for c in cols if "variabledescription" in c.lower()), None)
            scol = next((c for c in cols if c.lower() == "state"), None); ycol = next((c for c in cols if c.lower() == "year"), None); acol = next((c for c in cols if c.lower() == "amount"), None)
            if not (vcol and scol and ycol and acol): continue
            for row in rd:
                desc = ers_norm(row.get(vcol)); seen[desc] = seen.get(desc, 0) + 1
                for vid, pat in ERS_VARS:
                    if re.match(pat, desc):
                        st = (row.get(scol) or "").strip(); v = num(row.get(acol))
                        if v is None or not re.match(r"^\d{4}$", str(row.get(ycol) or "")): continue
                        if st in STATES or st == "US":
                            out.setdefault(st, {}).setdefault("ers_" + vid, {})[str(row[ycol])] = v; got += 1
                            u = re.sub(r"[^\x20-\x7e]", "", row.get("unit_desc") or "").strip()   # ERS lo escribe con caracteres sueltos: «$1,000»
                            if u: ERS_UNIT["ers_" + vid] = "USD thousand" if u.replace(" ", "") in ("$1,000", "$1000") else u
    log("ERS valores", got, "por variable:", {v: sum(1 for st in out for k in out[st] if k == "ers_" + v) for v, _ in ERS_VARS})
    log("ERS descripciones de totales disponibles:", sorted(d for d in seen if re.search(r"government|net .*income|gross .*income|production expenses|cash income", d))[:80])
    return {"release": d.isoformat(), "url": url}

def series_doc(st, data, unit_of, blk_of, county, ersmeta):
    ser = {}
    for k, pts in sorted(data.items()):
        if k == "census": continue
        pp = [[p, pts[p]] for p in sorted(pts)]
        if pp: ser[k] = {"blk": blk_of.get(k, "income" if k.startswith("ers_") else ""), "unit": unit_of.get(k) or ERS_UNIT.get(k, ""), "points": pp}
    doc = {"schemaVersion": 1, "generatedAt": now(), "state": st,
           "source": {"nass": "USDA NASS Quick Stats (https://quickstats.nass.usda.gov/)", "ers": ("USDA ERS Farm Income and Wealth Statistics, release " + ersmeta["release"]) if ersmeta else None},
           "series": ser}
    if data.get("census"): doc["census2022"] = data["census"]
    if county: doc["counties"] = county
    return doc

def main():
    a = sys.argv[1:]; outdir = Path(a[a.index("--outdir") + 1]) if "--outdir" in a else ROOT / "data" / "us-states"
    years = int(a[a.index("--years") + 1]) if "--years" in a else 6
    key = os.environ.get("NASS_API_KEY")
    if not key: print("falta NASS_API_KEY"); return 1
    out, county = {}, {}
    nass(key, years, out, county); meta = ers(out)
    unit_of = {s["id"]: s["unit"] for s in SPEC}; blk_of = {s["id"]: s["blk"] for s in SPEC}
    outdir.mkdir(parents=True, exist_ok=True); idx = {}
    for st in ["US"] + STATES:
        old = None; p = outdir / ("%s.json" % st)
        try: old = json.loads(p.read_text())
        except Exception: pass
        data = out.get(st, {})
        if old:  # una consulta fallida no borra series: se conservan las que faltan
            for k, s in (old.get("series") or {}).items():
                if k not in data: data[k] = {q[0]: q[1] for q in s["points"]}
            if "census" not in data and old.get("census2022"): data["census"] = old["census2022"]
            if st not in county and old.get("counties"): county[st] = old["counties"]
        if not data: continue
        doc = series_doc(st, data, unit_of, blk_of, county.get(st), meta)
        p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        idx[st] = {"series": len(doc["series"]), "counties": len(doc.get("counties") or {}), "bytes": p.stat().st_size}
    if len(idx) < 40 or "US" not in idx: log("demasiados pocos estados", len(idx)); (outdir / "log.txt").write_text("\n".join(LOG) + "\n"); return 1
    (outdir / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now(), "ers": meta, "states": idx}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "log.txt").write_text("\n".join(LOG[-400:]) + "\n"); log("estados", len(idx)); return 0
if __name__ == "__main__": sys.exit(main())

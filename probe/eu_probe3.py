import json, os, urllib.request, time, gzip, collections
UA = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)", "Accept": "*/*"}
OUT = "probe/eu-out3"; os.makedirs(OUT, exist_ok=True)
def get(u, t=300):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6)
    raise RuntimeError("%r" % last)
A = "https://api.tech.ec.europa.eu/agrifood/api/"
S = "beginDate=01/01/2015"
EP = {
 "beefcuts_w": "beef/cuts/prices?" + S, "beefcuts_m": "beef/cuts/prices/month?" + S,
 "pigcuts_w": "pigmeat/cuts/prices?" + S, "pigcuts_m": "pigmeat/cuts/prices/month?" + S,
 "live": "liveAnimal/prices?" + S, "poultry_m": "poultry/prices/month?" + S,
 "organic": "organic/prices", "cereal_prod": "cereal/production", "oilseeds_prod": "oilseeds/production",
 "rice_prod": "rice/production", "sugar_prod": "sugar/production", "olive_m": "oliveOil/production?granularity=monthly",
 "olive_y": "oliveOil/production?granularity=yearly",
 "organic_sectors": "organic/sectors", "organic_products": "organic/organicProducts", "organic_overall": "organic/overallProducts",
 "beefcuts_cat": "beef/cuts/prices/categories", "beefcuts_pt": "beef/cuts/prices/priceTypes",
 "beefcutsm_cat": "beef/cuts/prices/month/categories", "pigcuts_cat": "pigmeat/cuts/categories", "pigcuts_pt": "pigmeat/cuts/priceTypes",
 "poultrym_pt": "poultry/prices/month/priceTypes", "live_cat": "liveAnimal/categories",
 "cereal_crops": "cereal/production/crops", "oilseeds_crops": "oilseeds/production/crops", "rice_prod_products": "rice/production/products",
}
rep = {}
def cov(rows):
    if isinstance(rows, dict): rows = rows.get("content") or rows.get("data") or [rows]
    if not isinstance(rows, list): return {"type": str(type(rows))}
    c = {"n": len(rows), "sample": rows[:2]}
    if rows and isinstance(rows[0], dict):
        for k in ("memberStateCode", "year", "marketingYear", "productionYear", "category", "priceType", "crop", "product", "productName", "sector", "organicProduct", "overallProduct", "organicStage", "overallStage", "unit", "organicUnit", "region", "month", "monthNumber", "type", "animal"):
            vals = collections.Counter(str(r.get(k)) for r in rows if r.get(k) is not None)
            if vals: c[k] = dict(vals.most_common(80)) if len(vals) <= 80 else {"distinct": len(vals), "top": dict(vals.most_common(25))}
        pc = collections.defaultdict(lambda: collections.defaultdict(int))
        for r in rows:
            d = r.get("endDate") or r.get("beginDate")
            if d and r.get("memberStateCode"): pc[r["memberStateCode"]][d[-4:]] += 1
        if pc: c["byCountryYear"] = {k: dict(sorted(v.items())) for k, v in sorted(pc.items())}
    return c
for k, q in EP.items():
    try:
        raw = get(A + q); d = json.loads(raw)
        rep[k] = cov(d); rep[k]["bytes"] = len(raw)
        with gzip.open(OUT + "/" + k + ".json.gz", "wb", 9) as f: f.write(raw)
    except Exception as e: rep[k] = {"error": str(e)[:300]}
    time.sleep(2)
E = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
try:
    j = json.loads(get(E + "prc_fpmt_m?lastTimePeriod=2"))
    rep["fpmt_dims"] = {d: list(j["dimension"][d]["category"]["label"].items()) for d in j["id"]}
    rep["fpmt_updated"] = j.get("updated")
except Exception as e: rep["fpmt_dims"] = {"error": str(e)[:300]}
for g in ("EU27_2020", "ES", "FR", "DE", "IT", "NL", "PL"):
    try:
        raw = get(E + "prc_fpmt_m?geo=" + g)
        with gzip.open(OUT + "/fpmt_" + g + ".json.gz", "wb", 9) as f: f.write(raw)
        jj = json.loads(raw); rep["fpmt_" + g] = {"size": jj["size"], "nvals": len(jj.get("value", {})), "bytes": len(raw)}
    except Exception as e: rep["fpmt_" + g] = {"error": str(e)[:300]}
    time.sleep(2)
open(OUT + "/report.json", "w").write(json.dumps(rep, indent=1, ensure_ascii=False))

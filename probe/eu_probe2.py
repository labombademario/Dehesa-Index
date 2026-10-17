import json, os, urllib.request, urllib.parse, time
UA = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)", "Accept": "*/*"}
OUT = "probe/eu-out2"; os.makedirs(OUT, exist_ok=True)
def get(u, t=150):
    last = None
    for i in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(4)
    raise RuntimeError("%r" % last)
A = "https://api.tech.ec.europa.eu/agrifood/api/"
rep = {}
def summ(rows):
    if isinstance(rows, dict): rows = rows.get("content") or rows.get("data") or [rows]
    s = {"n": len(rows), "keys": list(rows[0].keys()) if rows else [], "first": rows[0] if rows else None, "last": rows[-1] if rows else None}
    for k in ("memberStateCode", "memberStateName", "year", "marketingYear", "beginDate", "endDate", "month", "week", "category", "crop", "product", "partner", "partnerCode", "indicator", "sector", "productionYear"):
        vals = sorted({str(r.get(k)) for r in rows if isinstance(r, dict) and r.get(k) is not None})
        if vals: s[k] = vals if len(vals) <= 40 else vals[:12] + ["..."] + vals[-12:] + ["(%d)" % len(vals)]
    return s
AF = {
 "beef_production": "beef/production?years=2024,2025,2026",
 "beef_production_categories": "beef/production/categories",
 "cereal_production": "cereal/production?years=2024,2025,2026",
 "cereal_production_crops": "cereal/production/crops",
 "dairy_production": "dairy/production?years=2025,2026",
 "dairy_production_categories": "dairy/production/categories",
 "pigmeat_production": "pigmeat/production?years=2025,2026",
 "poultry_production": "poultry/production?years=2025,2026",
 "sheep_production": "sheepAndGoat/production?years=2025,2026",
 "oilseeds_production": "oilseeds/production?years=2024,2025,2026",
 "rice_production": "rice/production?years=2024,2025,2026",
 "sugar_production": "sugar/production",
 "olive_production": "oliveOil/production?granularity=monthly",
 "olive_production_y": "oliveOil/production?granularity=yearly",
 "liveanimal_prices": "liveAnimal/prices?beginDate=01/06/2026",
 "liveanimal_categories": "liveAnimal/categories",
 "beefcuts_prices": "beef/cuts/prices?beginDate=01/08/2026",
 "beefcuts_month": "beef/cuts/prices/month?years=2026",
 "pigcuts_prices": "pigmeat/cuts/prices?beginDate=01/08/2026",
 "poultry_month": "poultry/prices/month?years=2026",
 "protein_prices": "oilseeds/crops/prices?beginDate=01/06/2026",
 "organic_prices": "organic/prices?years=2025,2026",
 "organic_sectors": "organic/sectors",
 "taxud_sectors": "taxud/weeklyData/sectors",
 "taxud_import_products": "taxud/weeklyData/import/products",
 "taxud_import_cats": "taxud/weeklyData/importCategories",
 "taxud_import_cereals": "taxud/weeklyData/import?sectors=Cereals&marketingYears=2026",
 "taxud_export_cereals": "taxud/weeklyData/export?sectors=Cereals&marketingYears=2026",
 "cmef_indicators": "cmefIndicators/indicators",
 "pmef_indicators": "indicators/pmef/indicators",
 "pmef_planned": "indicators/pmef/planned",
}
for k, q in AF.items():
    try:
        raw = get(A + q); d = json.loads(raw)
        rep[k] = summ(d if isinstance(d, list) else d); rep[k]["bytes"] = len(raw)
        if k.startswith(("taxud_import_c", "taxud_export_c", "cereal_production", "beef_production", "olive")): open(OUT + "/" + k + ".json", "wb").write(raw[:3000000])
    except Exception as e: rep[k] = {"error": str(e)[:200]}
E = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
ES = {
 "prc_fpmt_m": "prc_fpmt_m?geo=ES&lastTimePeriod=2",
 "apro_cpsh1_geo": "apro_cpsh1?crops=C1100&strucpro=PR_HU_EU&lastTimePeriod=1",
 "apro_mt_lscatl_geo": "apro_mt_lscatl?animals=A2000&month=M12&unit=THS_HD&lastTimePeriod=1",
 "apro_mt_pann_geo": "apro_mt_pann?meat=B1000&meatitem=SL&unit=THS_T&lastTimePeriod=1",
 "enpe_apro_cpnh1": "enpe_apro_cpnh1?lastTimePeriod=1",
 "enps_apro_cpnh1": "enps_apro_cpnh1?lastTimePeriod=1",
 "enpe_apro_mt_ls": "enpe_apro_mt_ls?lastTimePeriod=1",
 "ef_ah_pigt": "ef_ah_pigt?geo=ES&lastTimePeriod=1",
 "ef_ah_poult": "ef_ah_poult?geo=ES&lastTimePeriod=1",
 "ef_oga_type": "ef_oga_type?geo=ES&lastTimePeriod=1",
 "ef_mp_ms": "ef_mp_ms?geo=ES&lastTimePeriod=1",
 "ef_mp_ma": "ef_mp_ma?geo=ES&lastTimePeriod=1",
 "ef_fsi_cdiv": "ef_fsi_cdiv?geo=ES",
 "ef_fsi_legum": "ef_fsi_legum?geo=ES",
 "ef_m_pry": "ef_m_pry?geo=ES&lastTimePeriod=1",
 "aact_eaa05": "aact_eaa05?geo=ES&itm_newa=18000&lastTimePeriod=3",
 "lan_lcv_ovw": "lan_lcv_ovw?geo=ES&lastTimePeriod=1",
 "lan_use_ovw": "lan_use_ovw?geo=ES&lastTimePeriod=1",
 "ef_rd_man": "ef_rd_man?geo=ES&lastTimePeriod=1",
 "for_eoutput": "for_eoutput?geo=ES",
 "sdg_06_70": "sdg_06_70",
}
for k, q in ES.items():
    try:
        raw = get(E + q); j = json.loads(raw)
        dims = {d: list(j["dimension"][d]["category"]["label"].items())[:60] for d in j["id"]}
        rep["es_" + k] = {"size": j["size"], "nvals": len(j.get("value", {})), "dims": {d: (v if len(v) < 60 else v[:25] + [("...", len(v))]) for d, v in dims.items()}, "updated": j.get("updated")}
    except Exception as e: rep["es_" + k] = {"error": str(e)[:200]}
open(OUT + "/report.json", "w").write(json.dumps(rep, indent=1, ensure_ascii=False))

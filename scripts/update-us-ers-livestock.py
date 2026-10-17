#!/usr/bin/env python3
"""Carne y ganado de EE. UU. (USDA ERS, Livestock and Meat Domestic Data, ficheros legibles por maquina) -> data/us-ers-livestock-stats.json (formato *-stats.json).
El ZIP trae siete CSV; aqui se leen todos y se publican (cada punto es una cifra publicada, nada se calcula):
  Meat-Supply-Disappearance   oferta y utilizacion de cada carne y de los huevos, anual: produccion, importaciones, exportaciones, desaparicion total, existencias finales y consumo por persona
  Meat-Statistics             mensual: pesos medios vivos y en canal, produccion y existencias en frio de comienzo de mes (el sacrificio en cabezas ya esta en NASS)
  LivestockPrices             precios mensuales de ganado (cebo, terneros de recria, cerdo, cordero, heno)
  WholesalePrices             precios mayoristas mensuales (cortes de vacuno y cerdo, pollo, pavo, huevos)
  FeederCattleSuppliesOutsideFeedlots   terneros y novillas de recria fuera de cebaderos a 1 de enero (anual)
  heifersenteringherd         novillas que entran en la cabana de vacas (semestral, publicado por ano)
  highplainscattlefeedingsimulator      simulador de rentabilidad del cebadero de las Altas Llanuras (periodos de 4 meses; el periodo se fecha en su mes final)
Uso: update-us-ers-livestock.py [--local DIR] [--out DIR]   (--local: carpeta con livestock-domestic-data-machine-readable-files.zip)"""
import csv, io, re, sys, zipfile
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
PAGE = "https://www.ers.usda.gov/data-products/livestock-and-meat-domestic-data/livestock-and-meat-domestic-data"
KNOWN = "https://www.ers.usda.gov/media/5539/livestock-domestic-data-machine-readable-files.zip"
SG = "USDA ERS, Livestock and Meat Domestic Data"
SD_ATTRS = ["Total Production", "Commercial Production", "Imports", "Exports", "Total Disappearance", "Ending Stocks"]
CN = {"Beef": "Beef", "Veal": "Veal", "Pork": "Pork", "Lamb and mutton": "Lamb and mutton", "Broiler": "Broilers", "Turkey": "Turkey", "Eggs and egg products": "Eggs",
      "Total red meat": "Total red meat", "Total poultry": "Total poultry", "Total red meat and poultry": "Total red meat and poultry"}
def rd(z, name):
    for i in z.infolist():
        if i.filename.lower().endswith("/" + name.lower()) or i.filename.lower() == name.lower():
            return list(csv.DictReader(io.StringIO(z.read(i).decode("utf-8-sig", "replace"))))
    raise ValueError("falta " + name + " en el ZIP")
def u_of(s):
    s = s.strip(); t = s.lower()
    return {"1,000 head": "thousand head", "dollars per hundredweight": "USD/cwt", "dollars per head": "USD/head", "dollars per ton": "USD/short ton", "cents per pound": "cents/lb",
            "cents per dozen": "cents/dozen", "million pounds": "million lb", "pounds": "lb", "percent": "%", "dollars per pound": "USD/lb"}.get(t, s)
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-ers-livestock-stats.json"
    rc = 0
    try:
        try: url = U.find_link(PAGE, r"machine-readable-files\.zip", "https://www.ers.usda.gov/")
        except Exception as e: U.log("pagina no legible:", repr(e)[:100]); url = None
        url = url or KNOWN; U.log("ZIP:", url)
        z = zipfile.ZipFile(io.BytesIO(U.get(url)))
        ser = []
        add = lambda s: ser.append(s) if s else None
        # ---- oferta y utilizacion (anual: timeperiod 17 = Jan-Dec)
        by = defaultdict(list)
        for r in rd(z, "Meat-Supply-Disappearance.csv"):
            if r["timeperiod_id"] != "17" or r["commodity_desc"] not in CN: continue
            a = r["attribute_desc"]
            if a == "Disappearance Per Capita":
                if r["unit_desc"] not in ("Retail weight, pounds", "Carcass-weight-equivalent, pounds", "Shell-egg equivalent, number"): continue
            elif a not in SD_ATTRS: continue
            by[(r["commodity_desc"], a, r["unit_desc"])].append((r["year_id"], U.fnum(r["amount"])))
        for (c, a, u), pts in sorted(by.items()):
            if a == "Disappearance Per Capita":
                nm = "per-person disappearance, " + ("retail weight" if u.startswith("Retail") else "carcass-weight equivalent" if u.startswith("Carcass") else "shell-egg equivalent"); un = "lb per person" if "pounds" in u else "eggs per person"; g = "production"
                sid = "per-capita-" + ("retail" if u.startswith("Retail") else "carcass" if u.startswith("Carcass") else "shell-egg")
            else:
                nm = a.lower(); un = "million dozen" if "Dozens" in u else "million lb"; g = "stocks" if "Stocks" in a else "trade" if a in ("Imports", "Exports") else "production"; sid = U.slug(a)
            add(U.mk_series("us-erslm-%s-%s-a" % (U.slug(CN[c]), sid), g, "%s: %s (ERS Livestock & Meat Domestic Data, annual)" % (CN[c], nm), un, "annual", pts, SG, min_points=5))
        U.log("oferta y utilizacion:", len(ser), "series")
        # ---- mensual: pesos, produccion, existencias en frio
        by = defaultdict(list)
        for r in rd(z, "Meat-Statistics.csv"):
            t = r["table_name"]
            if t == "Livestock and poultry slaughter" or not re.match(r"^(0[1-9]|1[0-2])$", r["timeperiod_id"]): continue
            by[(t, r["commodity_desc"], r["attribute_desc"], r["unit_desc"])].append(("%s-%s" % (r["year_id"], r["timeperiod_id"]), U.fnum(r["amount"])))
        n0 = len(ser)
        for (t, c, a, u), pts in sorted(by.items()):
            g = "production" if "production" in t.lower() else "stocks" if "stocks" in t.lower() else "production"
            add(U.mk_series("us-erslm-%s-%s-m" % (U.slug(c), U.slug(a, 40)), g, "%s: %s (ERS Livestock & Meat Domestic Data, monthly)" % (c, a.lower()), u_of(u), "monthly", pts, SG, min_points=24, max_age_years=2, keep=360))
        U.log("estadisticas mensuales:", len(ser) - n0, "series")
        # ---- precios de ganado y mayoristas
        n0 = len(ser)
        for fn, kind in (("LivestockPrices.csv", "livestock price"), ("WholesalePrices.csv", "wholesale price")):
            by = defaultdict(list)
            for r in rd(z, fn): by[(r["commodity_desc"], r["geography_desc"], r["attribute_desc"].strip(), r["unit_desc"])].append(("%s-%02d" % (r["year_id"], int(r["month_id"])), U.fnum(r["amount"])))
            for (c, geo, a, u), pts in sorted(by.items()):
                add(U.mk_series("us-erslm-%s-%s-%s-m" % ("lp" if fn.startswith("Live") else "wp", U.slug(c, 14), U.slug(geo + " " + a, 52)), "prices", "%s, %s: %s (ERS, monthly)" % (c, geo, a), u_of(u), "monthly", pts, SG, min_points=24, max_age_years=2, keep=360))
        U.log("precios:", len(ser) - n0, "series")
        # ---- ternero de recria fuera de cebaderos, 1 de enero
        n0 = len(ser); by = defaultdict(list)
        for r in rd(z, "FeederCattleSuppliesOutsideFeedlots.csv"): by[(r["attribute_desc"], r["unit_desc"])].append((r["year_id"], U.fnum(r["amount"])))
        for (a, u), pts in by.items():
            add(U.mk_series("us-erslm-feeder-supply-%s-a" % U.slug(a, 50), "production", "Cattle: %s (ERS, annual)" % a, u_of(u), "annual", pts, SG, min_points=5))
        U.log("recria fuera de cebaderos:", len(ser) - n0, "series")
        # ---- novillas que entran en la cabana (no se repite el inventario de 1 de enero, que ya esta en NASS)
        n0 = len(ser); by = defaultdict(list)
        for r in rd(z, "heifersenteringherd.csv"):
            if r["table_name"] == "January 1 cattle inventory": continue
            by[(r["table_name"], r["attribute_desc"], r["unit_desc"])].append((r["year_id"], U.fnum(r["amount"])))
        for (t, a, u), pts in by.items():
            add(U.mk_series("us-erslm-heifers-%s-%s-a" % (U.slug(t.replace("Total ", "").replace(" entering cow herd", ""), 14), U.slug(a, 40)), "production", "%s: %s (ERS, annual)" % (t, a), u_of(u), "annual", pts, SG, min_points=5, note="Los datos del año en curso incluyen estimaciones del propio ERS; ver el libro de ERS."))
        U.log("novillas:", len(ser) - n0, "series")
        # ---- simulador del cebadero (periodos de 4 meses, fechado en el mes final)
        n0 = len(ser); by = defaultdict(list)
        for r in rd(z, "highplainscattlefeedingsimulator.csv"):
            m = re.match(r"^([A-Z][a-z]{2})-(\d{2}) to ([A-Z][a-z]{2})-(\d{2})$", r["timeperiod_desc"].strip())
            if not m or r["attribute_desc"].strip() == "Marketing": continue
            by[(r["attribute_desc"].strip(), r["unit_desc"])].append(("20%s-%02d" % (m.group(4), U.mon_num(m.group(3))), U.fnum(r["amount"])))
        for (a, u), pts in by.items():
            add(U.mk_series("us-erslm-feedlot-sim-%s-m" % U.slug(a, 56), "prices", "High Plains cattle feeding simulator, 4-month period: %s (ERS)" % a, u_of(u), "monthly", pts, SG, min_points=5, max_age_years=2,
                            note="Cada punto es un periodo de alimentacion de 4 meses fechado en su mes final; los periodos se solapan."))
        U.log("simulador:", len(ser) - n0, "series")
        ids = {s["id"] for s in ser}
        for need in ("us-erslm-beef-per-capita-retail-a", "us-erslm-pork-total-production-a", "us-erslm-feeder-supply-feeder-cattle-outside-feedlots-on-jan-1-a"):
            if not any(i.startswith(need[:-2]) for i in ids): raise ValueError("falta la serie " + need)
        if len(ser) < 150: raise ValueError("solo %d series (se esperan >=150)" % len(ser))
        if len(ser) != len(ids): raise ValueError("ids repetidos")
        U.write_json(out, U.stats_doc("USDA Economic Research Service, Livestock and Meat Domestic Data", PAGE, "US Government work (public domain); credit: USDA ERS", ser))
        U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-ers-livestock-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

#!/usr/bin/env python3
"""Leche en EE. UU.: ordenes federales de comercializacion (FMMO, USDA AMS) -> data/us-fmmo-stats.json (formato *-stats.json, se suma al catalogo de EE. UU.).
API publica sin clave del datamart de AMS (https://mpr.datamart.ams.usda.gov/services/v1.1/reports/<informe>/<seccion>):
  3355 Class Prices by Order      precios minimos de clase I a IV (USD por cwt al 3,5 % de grasa), mensual desde 2012; la clase I varia por orden, II-IV son iguales en todas
  3351 Uniform Milk Prices        precio uniforme (leche, grasa en USD/lb, solidos no grasos en USD/cwt), todas las ordenes combinadas
  3357 Mailbox Milk Prices        precio "mailbox" (lo que recibe el ganadero tras deducciones) por zona
  3352 Price and Pool - Monthly   recepciones del pool y reparto del uso por clase, total de mercados
  3462 Producer Milk Components   composicion de la leche de los productores (grasa, proteina, otros solidos, solidos no grasos), total de mercados
Nada se calcula ni se rellena: cada punto es una cifra publicada; si AMS revisa un mes, gana la ultima publicacion. Si no valida, NO se toca el fichero anterior.
Uso: update-us-fmmo.py [--out DIR]"""
import json, sys, urllib.parse, datetime
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
DM = "https://mpr.datamart.ams.usda.gov/services/v1.1/reports/"
SRC = "USDA AMS Dairy Programs, Federal Milk Marketing Orders (datamart)"
MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split()
Y0 = 2012
def dm(report, section, q=None):
    url = DM + str(report) + "/" + urllib.parse.quote(section) + (("?q=" + q) if q else "")
    d = json.loads(U.get(url, accept="application/json").decode("utf-8"))
    return d.get("results", [])
def pdate(s):
    try: return datetime.datetime.strptime(s, "%m/%d/%Y %H:%M:%S")
    except Exception: return datetime.datetime.min
def newest(rows, keyf):
    """Una fila por clave: la de publicacion mas reciente (AMS republica meses revisados)."""
    best = {}
    for r in rows:
        k = keyf(r)
        if k not in best or pdate(r.get("published_date", "")) >= pdate(best[k].get("published_date", "")): best[k] = r
    return list(best.values())
def wide(rows, namef, cols, scale=1.0):
    """Filas anuales con una columna por mes -> {nombre: [(AAAA-MM, valor)]}."""
    out = defaultdict(list)
    for r in newest(rows, lambda r: (r.get("report_year"), namef(r))):
        nm = namef(r)
        if nm is None: continue
        for i, c in enumerate(cols):
            v = U.fnum(r.get(c))
            if v is not None: out[nm].append(("%04d-%02d" % (int(r["report_year"]), i + 1), v * scale))
    return out
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-fmmo-stats.json"
    rc = 0
    try:
        ser = []
        this = datetime.date.today().year
        # ---- 3355 precios de clase
        rows = []
        for y in range(Y0, this + 1): rows += dm(3355, "Final Class Prices by Order", "report_year=%d" % y)
        U.log("3355:", len(rows), "filas")
        by = defaultdict(lambda: defaultdict(list))   # campo -> area -> pts
        for r in newest(rows, lambda r: (r["report_year"], r["report_month"], r["MarketingArea"])):
            mo = U.mon_num(r["report_month"])
            if not mo: continue
            p = "%04d-%02d" % (int(r["report_year"]), mo)
            for f in ("ClassIWhole", "ClassIIWhole", "ClassIIIWhole", "ClassIVWhole"):
                v = U.fnum(r.get(f))
                if v is not None: by[f][r["MarketingArea"]].append((p, v))
        unit = "USD/cwt (3.5% butterfat)"
        for f, nm in (("ClassIIWhole", "II"), ("ClassIIIWhole", "III"), ("ClassIVWhole", "IV")):
            a = by[f].get("All Market Average") or next(iter(by[f].values()), [])
            s = U.mk_series("us-fmmo-class-%s-price" % nm.lower(), "prices", "Federal order Class %s milk price (USDA AMS, monthly)" % nm, unit, "monthly", a, SRC)
            if s: ser.append(s)
        for area, a in sorted(by["ClassIWhole"].items()):
            nm = "all-markets" if area == "All Market Average" else U.slug(area.split("(")[0])
            lab = "all markets (average)" if area == "All Market Average" else area
            s = U.mk_series("us-fmmo-class-i-price-%s" % nm, "prices", "Federal order Class I milk price, %s (USDA AMS, monthly)" % lab, unit, "monthly", a, SRC)
            if s: ser.append(s)
        # ---- 3351 precio uniforme (todas las ordenes combinadas)
        allm = lambda r: "all" if r.get("Pool_Order_Name") == "All Markets Combined" else None
        for sect, sid, lab, u in (("Milk", "uniform-price", "Federal order uniform (blend) milk price, all markets combined", "USD/cwt"),
                                  ("Butterfat", "uniform-butterfat", "Federal order uniform butterfat price, all markets combined", "USD/lb"),
                                  ("Skim", "uniform-skim", "Federal order uniform skim milk price, all markets combined", "USD/cwt")):
            r = dm(3351, sect); w = wide(r, allm, MONTHS)
            s = U.mk_series("us-fmmo-" + sid, "prices", lab + " (USDA AMS, monthly)", u, "monthly", w.get("all", []), SRC)
            if s: ser.append(s)
            else: raise ValueError("sin serie " + sid)
        # ---- 3357 mailbox
        r = dm(3357, "Mailbox Milk Prices")
        w = wide(r, lambda r: r.get("Reporting_Area"), [m.capitalize() for m in MONTHS])
        for area, a in sorted(w.items()):
            s = U.mk_series("us-fmmo-mailbox-%s" % U.slug(area), "prices", "Mailbox milk price, %s (USDA AMS, monthly)" % area, "USD/cwt", "monthly", a, SRC)
            if s: ser.append(s)
        # ---- 3352 pool mensual (total de mercados)
        rows = []
        for y in range(2005, this + 1): rows += dm(3352, "Price and Pool Monthly", "report_year=%d" % y)
        U.log("3352:", len(rows), "filas")
        tot = [r for r in newest(rows, lambda r: (r["report_year"], r["report_month"], r["Pool_Order_Name"])) if r.get("Pool_Order_Name") == "ALL MARKET AVERAGE OR TOTAL"]
        def mp(f): return [("%04d-%02d" % (int(r["report_year"]), U.mon_num(r["report_month"])), U.fnum(r.get(f))) for r in tot if U.mon_num(r["report_month"])]
        for f, sid, lab, u, g in (("Producer_Receipts", "pool-receipts", "Federal order producer milk receipts (pooled), all markets", "million lb", "production"),
                                  ("ClassI_Util_Percent", "util-class-i", "Share of pooled milk used as Class I (fluid), all markets", "%", "production"),
                                  ("ClassII_Util_Percent", "util-class-ii", "Share of pooled milk used as Class II (soft products), all markets", "%", "production"),
                                  ("ClassIII_Util_Percent", "util-class-iii", "Share of pooled milk used as Class III (cheese, whey), all markets", "%", "production"),
                                  ("ClassIV_Util_Percent", "util-class-iv", "Share of pooled milk used as Class IV (butter, powder), all markets", "%", "production")):
            s = U.mk_series("us-fmmo-" + sid, g, lab + " (USDA AMS, monthly)", u, "monthly", mp(f), SRC)
            if s: ser.append(s)
        # ---- 3462 composicion
        for sect, sid, lab in (("Butterfat", "comp-butterfat", "Butterfat"), ("Protein", "comp-protein", "True protein"), ("Other Solids", "comp-other-solids", "Other solids"), ("NFS", "comp-nonfat-solids", "Nonfat solids")):
            try: r = dm(3462, sect)
            except Exception as e: U.log("3462", sect, "no disponible:", repr(e)[:80]); continue
            w = wide(r, allm, MONTHS)
            s = U.mk_series("us-fmmo-" + sid, "production", "Composition of producer milk: %s, all markets combined (USDA AMS, monthly)" % lab, "% of milk", "monthly", w.get("all", []), SRC)
            if s: ser.append(s)
        ids = {s["id"] for s in ser}
        for need in ("us-fmmo-class-iii-price", "us-fmmo-class-iv-price", "us-fmmo-class-ii-price", "us-fmmo-class-i-price-all-markets", "us-fmmo-uniform-price", "us-fmmo-mailbox-all-federal-order-areas"):
            if need not in ids: raise ValueError("falta la serie " + need)
        for s in ser:
            if s["unit"].startswith("USD/cwt") and not 3 < s["latest"] < 80: raise ValueError("%s: ultimo valor %s fuera de rango" % (s["id"], s["latest"]))
        c3 = next(s for s in ser if s["id"] == "us-fmmo-class-iii-price")
        if c3["points"][0][0] > "2013-01" or len(c3["points"]) < 120: raise ValueError("Clase III incompleta: %d puntos desde %s" % (len(c3["points"]), c3["points"][0][0]))
        lastm = c3["latestPeriod"]; age = (this * 12 + datetime.date.today().month) - (int(lastm[:4]) * 12 + int(lastm[5:7]))
        if age > 4: raise ValueError("el ultimo precio de clase es de %s" % lastm)
        U.write_json(out, U.stats_doc(SRC, "https://www.ams.usda.gov/rules-regulations/moa/dairy", "US Government work (public domain); credit: USDA AMS", ser))
        U.log("OK: %d series, Clase III hasta %s" % (len(ser), lastm))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-fmmo-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

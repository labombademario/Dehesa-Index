#!/usr/bin/env python3
"""Gasto en alimentos y reparto del dolar de la comida en EE. UU. (USDA ERS, Food Expenditure Series y Food Dollar Series) -> data/us-ers-food-stats.json (formato *-stats.json).
Cada punto es una cifra publicada por ERS; nada se calcula.
  Food Expenditure Series:  ventas mensuales de comida (en casa / fuera de casa / total, con impuestos y propinas), gasto anual por tipo de punto de venta y por comprador final, y ventas por estado (totales y por persona)
  Food Dollar Series:  reparto del dolar de la comida entre agricultura, intermediarios y sectores (centavos por dolar y millones de dolares, nominales y reales, modelo 2011)
Uso: update-us-ers-food.py [--local DIR] [--out DIR]   (--local: carpeta con las paginas y los CSV por nombre de fichero)"""
import csv, io, re, sys
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
BASE = "https://www.ers.usda.gov/"
PEXP = BASE + "data-products/food-expenditure-series"
PFD = BASE + "data-products/food-dollar-series"
SGE = "USDA ERS, Food Expenditure Series"; SGD = "USDA ERS, Food Dollar Series"
def rows_of(url):
    txt = U.get(url).decode("utf-8-sig", "replace")
    return list(csv.reader(io.StringIO(txt)))
def unit_of(h):
    t = h.lower()
    if "per capita" in t or "per person" in t: return "USD per person" + (" (1988 dollars)" if "1988" in t else "")
    if "ratio" in t or "share" in t or "percent" in t: return "%"
    if "billions" in t: return "billion USD"
    if "constant" in t or "real" in t:
        m = re.search(r"(19|20)\d\d", t); return "million USD (%s dollars)" % (m.group(0) if m else "constant")
    return "million USD"
def short(h): return re.sub(r"\s+", " ", h).strip().rstrip(",")
def read_wide(url, mincols=2):
    """CSV con cabecera 'Year,...' -> (cabeceras, filas de datos sin notas)."""
    rs = rows_of(url); hi = next(i for i, r in enumerate(rs) if r and r[0].strip().lower() == "year")
    return [c.strip() for c in rs[hi]], [r for r in rs[hi + 1:] if r and re.match(r"^(19|20)\d\d$", r[0].strip())]
def annual_cols(url, sid, group_label, sg, take=None, group="consumption", min_points=8):
    hs, data = read_wide(url); ser = []
    for j, h in enumerate(hs):
        if j == 0 or not h or (take and not take(h)): continue
        pts = [(r[0].strip(), U.fnum(r[j]) if j < len(r) else None) for r in data]
        s = U.mk_series("us-ersfood-%s-%s-a" % (sid, U.slug(short(h), 44)), group, "%s: %s (ERS)" % (group_label, short(h)), unit_of(h), "annual", pts, sg, min_points=min_points, max_age_years=4)
        if s: ser.append(s)
    return ser
def monthly(url, sid, label):
    hs, data = read_wide(url); ser = []; mi = next((j for j, h in enumerate(hs) if h.lower() == "month"), 1)
    for j, h in enumerate(hs):
        if j <= mi or not h: continue
        pts = []
        for r in data:
            m = r[mi].strip(); mm = int(m) if re.match(r"^\d{1,2}$", m) else U.mon_num(m)
            if mm: pts.append(("%s-%02d" % (r[0].strip(), mm), U.fnum(r[j]) if j < len(r) else None))
        s = U.mk_series("us-ersfood-%s-%s-m" % (sid, U.slug(short(h), 44)), "consumption", "%s: %s (ERS)" % (label, short(h)), unit_of(h), "monthly", pts, SGE, min_points=24, max_age_years=2, keep=360)
        if s: ser.append(s)
    return ser
def by_state(url, sid, label, take):
    hs, data = read_wide(url); si = next(j for j, h in enumerate(hs) if h.lower() == "state"); by = defaultdict(list); ser = []
    cols = [j for j, h in enumerate(hs) if j > si and take(h)]
    for r in data:
        for j in cols: by[(hs[j], r[si].strip())].append((r[0].strip(), U.fnum(r[j]) if j < len(r) else None))
    for (h, st), pts in sorted(by.items()):
        s = U.mk_series("us-ersfood-%s-%s-%s-a" % (sid, U.slug(re.sub(r"\b(million|nominal|dollars|with|taxes|and|tips|sales)\b", "", re.sub(r"u\.s\.", "", short(h), flags=re.I), flags=re.I), 14), U.slug(st, 20)), "consumption", "%s, %s: %s (ERS)" % (label, st, short(h)), unit_of(h), "annual", pts, SGE, min_points=8, max_age_years=4)
        if s: ser.append(s)
    return ser
def food_dollar(url, kind, sg):
    rs = rows_of(url); hs = [c.strip() for c in rs[0]]; ix = {h: j for j, h in enumerate(hs)}; by = defaultdict(list); names = {}
    for r in rs[1:]:
        if len(r) < len(hs): continue
        v = U.fnum(r[ix["Total"]]); y = r[ix["Year"]].strip()
        if v is None or not re.match(r"^\d{4}$", y): continue
        k = (r[ix["Table_num"]].strip(), r[ix["Category_desc"]].strip(), r[ix["Units"]].strip()); by[k].append((y, v)); names[k] = r[ix["Table_name"]].strip()
    ser = []; seen = set()
    for (tn, cat, un), pts in sorted(by.items()):
        if cat == "Total food dollar" and (tn, "Total", un) in by: continue   # mismo total con otro nombre
        sig = (tn, un, tuple(sorted(pts)))
        if sig in seen: continue   # 'Total' y 'Total food dollar' publican las mismas cifras
        seen.add(sig)
        if "cents" in un.lower() and len({v for _, v in pts}) == 1 and abs(next(iter({v for _, v in pts})) - 100) < 1e-9: continue   # el total del food dollar vale 100 centavos por definicion: no informa
        u = "cents per food dollar" if "cents" in un.lower() else ("million 2017 USD" if "2017" in un else "million USD")
        s = U.mk_series("us-ersfd-t%s-%s-%s-%s-a" % (U.slug(tn, 4), U.slug(cat, 30), "c" if "cents" in un.lower() else "m", kind), "consumption", "Food dollar, %s: %s (ERS, %s)" % (names[(tn, cat, un)], cat, "real" if kind == "real" else "nominal"), u, "annual", pts, sg, min_points=8, max_age_years=4,
                        note="Modelo 2011 de ERS; los datos de los últimos años son preliminares.")
        if s: ser.append(s)
    return ser
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-ers-food-stats.json"
    rc = 0
    try:
        def link(page, pat):
            try: return U.find_link(page, pat, BASE)
            except Exception as e: U.log("pagina no legible:", repr(e)[:90]); return None
        ser = []
        def need(url, what):
            if not url: raise ValueError("no hay enlace de " + what)
            return url
        mo = link(PEXP, r"/monthly-sales-of-food-with-taxes-and-tips-for-all-purchasers\.csv"); U.log("mensual:", mo)
        ser += monthly(need(mo, "ventas mensuales"), "monthly-sales", "Monthly food sales, all purchasers, with taxes and tips")
        n0 = len(ser)
        for pat, sid, lab in ((r"/nominal-food-and-alcohol-expenditures-with-taxes-and-tips-for-all-purchasers\.csv", "nom", "Expenditures, nominal, with taxes and tips"),
                              (r"/constant-dollar-food-and-alcohol-expenditures-with-taxes-and-tips-for-all-purchasers\.csv", "const", "Expenditures, constant dollars, with taxes and tips"),
                              (r"/food-expenditures-by-final-purchaser\.csv", "buyer", "Food expenditures by final purchaser")):
            u = link(PEXP, pat); ser += annual_cols(need(u, sid), sid, lab, SGE)
        U.log("gasto anual:", len(ser) - n0, "series"); n0 = len(ser)
        for pat, sid, lab, take in ((r"/state-food-sales-with-taxes-and-tips-for-all-purchasers\.csv", "st", "State food sales, with taxes and tips", lambda h: "nominal" in h.lower()),
                                    (r"/state-food-sales-per-capita-with-taxes-and-tips-for-all-purchasers\.csv", "stpc", "State food sales per person, with taxes and tips", lambda h: "nominal" in h.lower())):
            u = link(PEXP, pat); ser += by_state(need(u, sid), sid, lab, take)
        U.log("ventas por estado:", len(ser) - n0, "series"); n0 = len(ser)
        for pat, kind in ((r"/food-dollar-nominal-data-2011-model[^/]*\.csv", "nom"), (r"/food-dollar-real-data-2011-model[^/]*\.csv", "real")):
            u = link(PFD, pat); ser += food_dollar(need(u, "dolar de la comida " + kind), kind, SGD)
        U.log("dolar de la comida:", len(ser) - n0, "series")
        seen = {}
        for s in ser:
            n = seen.get(s["id"], 0); seen[s["id"]] = n + 1
            if n: s["id"] += "-%d" % (n + 1)
        ids = [s["id"] for s in ser]
        if len(ser) < 150: raise ValueError("solo %d series (se esperan >=150)" % len(ser))
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos: %s" % [i for i in set(ids) if ids.count(i) > 1][:5])
        U.write_json(out, U.stats_doc("USDA Economic Research Service, Food Expenditure Series and Food Dollar Series", PEXP, "US Government work (public domain); credit: USDA ERS", ser))
        U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-ers-food-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

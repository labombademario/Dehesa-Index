#!/usr/bin/env python3
"""Bioenergia de EE. UU. (USDA ERS, U.S. Bioenergy Statistics, CSV largo) -> data/us-ers-bioenergy-stats.json (formato *-stats.json).
Cada fila del CSV es una cifra publicada (etanol, biodiesel, diesel renovable, maiz y aceites usados como materia prima, precios, comercio...); nada se calcula.
Columnas: table, table_name, year, year_cat, year_desc, period, period_cat, period_desc, geographic_level, location, commodity, data_item, data_item_desc, units, value.
Una serie = (tabla, ambito, producto, concepto, unidad, tipo de ano). Periodo mensual -> AAAA-MM; trimestral -> AAAA-MM del mes final; anual/campana -> AAAA (la campana se fecha en su ano de inicio).
Uso: update-us-ers-bioenergy.py [--local DIR] [--out DIR]   (--local: carpeta con us-bioenergy-statistics.csv)"""
import csv, io, re, sys
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
PAGE = "https://www.ers.usda.gov/data-products/us-bioenergy-statistics"
KNOWN = "https://www.ers.usda.gov/media/6478/us-bioenergy-statistics.csv"
SG = "USDA ERS, U.S. Bioenergy Statistics"
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
def u_of(s):
    t = (s or "").strip().lower()
    return {"million gallons": "million gal", "1,000 gallons": "thousand gal", "thousand gallons": "thousand gal", "million bushels": "million bu", "1,000 bushels": "thousand bu",
            "million pounds": "million lb", "1,000 pounds": "thousand lb", "dollars per gallon": "USD/gal", "dollars per bushel": "USD/bu", "dollars per ton": "USD/short ton",
            "cents per pound": "cents/lb", "percent": "%", "1,000 barrels": "thousand bbl", "million barrels": "million bbl", "barrels per day": "bbl/day",
            "1,000 barrels per day": "thousand bbl/day", "dollars per mmbtu": "USD/MMBtu", "trillion btu": "trillion Btu", "million dollars": "million USD", "dollars per barrel": "USD/bbl"}.get(t, (s or "").strip())
def group_of(tn, item):
    t = (tn + " " + item).lower()
    if "price" in t or "cost" in t or "margin" in t or "dollars per" in t: return "prices"
    if "import" in t or "export" in t or "trade" in t: return "trade"
    if "stock" in t or "inventor" in t: return "stocks"
    return "production"
def period_of(r):
    """(etiqueta, frecuencia) o None. Mensual AAAA-MM, trimestral al mes final, anual AAAA."""
    y = (r.get("year") or "").strip()
    if not re.match(r"^\d{4}$", y): return None
    pd_ = ((r.get("period_desc") or "") + " " + (r.get("period_cat") or "")).lower(); p = (r.get("period") or "").strip()
    for i, m in enumerate(MONTHS):
        if re.search(r"\b" + m[:3], pd_) and "quarter" not in pd_: return "%s-%02d" % (y, i + 1), "monthly"
    q = re.search(r"(?:q|quarter\s*)([1-4])\b|\b([1-4])(?:st|nd|rd|th)\s+quarter", pd_)
    if q: return "%s-%02d" % (y, 3 * int(q.group(1) or q.group(2))), "monthly"
    if "month" in pd_ and re.match(r"^(0?[1-9]|1[0-2])$", p): return "%s-%02d" % (y, int(p)), "monthly"
    if "quarter" in pd_ and re.match(r"^[1-4]$", p): return "%s-%02d" % (y, 3 * int(p)), "monthly"
    return y, "annual"
def build(rows):
    by = defaultdict(list); fr = {}; qn = set()
    for r in rows:
        v = U.fnum(r.get("value")); pe = period_of(r)
        if v is None or not pe: continue
        key = (r["table"].strip(), r["table_name"].strip(), (r.get("location") or "").strip(), (r.get("commodity") or "").strip(), (r.get("data_item_desc") or r.get("data_item") or "").strip(),
               (r.get("units") or "").strip(), (r.get("year_cat") or "").strip())
        by[key].append((pe[0], v)); fr.setdefault(key, set()).add(pe[1])
        if "quarter" in ((r.get("period_desc") or "") + (r.get("period_cat") or "")).lower(): qn.add(key)
    ser = []
    for key, pts in sorted(by.items()):
        tb, tn, loc, com, item, un, ycat = key
        f = fr[key]
        if len(f) > 1:  # mezcla de anual y mensual en la misma serie: solo se publica la parte con mas puntos
            pts = [p for p in pts if (len(p[0]) == 7) == (sum(1 for q in pts if len(q[0]) == 7) >= sum(1 for q in pts if len(q[0]) == 4))]
        monthly = len(pts[0][0]) == 7
        label = "%s: %s%s%s%s (ERS Bioenergy, %s)" % (com or tn, item, (", " + loc) if loc and loc.lower() not in ("united states", "us", "u.s.") else "", (" [" + ycat + "]") if ycat and ycat.lower() not in ("calendar year", "calendar", "") else "",
                                                       "", "monthly" if monthly else "annual")
        note = "Cada punto trimestral se fecha en el mes final del trimestre." if key in qn else ("Año de campaña fechado en su año de inicio." if "market" in ycat.lower() else None)
        sid = "us-ersbio-t%s-%s-%s-%s-%s" % (U.slug(tb, 4), U.slug(com, 14), U.slug(item, 40), U.slug(loc, 10) or "us", "m" if monthly else "a")
        if ycat and ycat.lower() not in ("calendar year", "calendar", ""): sid += "-" + U.slug(ycat, 6)
        s = U.mk_series(sid, group_of(tn, item), label, u_of(un), "monthly" if monthly else "annual", pts, SG, min_points=24 if monthly else 5, max_age_years=2 if monthly else 3, keep=360 if monthly else None, note=note)
        if s: ser.append(s)
    return ser
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-ers-bioenergy-stats.json"
    rc = 0
    try:
        try: url = U.find_link(PAGE, r"us-bioenergy-statistics\.csv", "https://www.ers.usda.gov/")
        except Exception as e: U.log("pagina no legible:", repr(e)[:100]); url = None
        url = url or KNOWN; U.log("CSV:", url)
        rows = list(csv.DictReader(io.StringIO(U.get(url).decode("utf-8-sig", "replace"))))
        U.log("filas:", len(rows))
        ser = build(rows)
        ids = [s["id"] for s in ser]
        if len(ser) < 40: raise ValueError("solo %d series (se esperan >=40)" % len(ser))
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos")
        U.write_json(out, U.stats_doc("USDA Economic Research Service, U.S. Bioenergy Statistics", PAGE, "US Government work (public domain); credit: USDA ERS", ser))
        U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-ers-bioenergy-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

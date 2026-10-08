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

def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ers, ttb = [], []
    for fn in (meat_spreads, dairy, rice): fn(ers)
    wine(ttb)
    for name, ser, src in (("us-ers-stats.json", ers, {"name": "USDA Economic Research Service (data products)", "url": "https://www.ers.usda.gov/data-products/", "license": "US Government work (public domain); cite USDA ERS"}),
                           ("us-ttb-stats.json", ttb, {"name": "Alcohol and Tobacco Tax and Trade Bureau (US Treasury): wine statistics", "url": "https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/wine-statistics", "license": "US Government work (public domain); cite TTB"})):
        if not ser: log("sin series para", name, "(se conserva el fichero anterior)"); continue
        doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"US": {"name": "United States", "extend": True, "source": src, "series": ser}}, "log": LOG[-30:]}
        (outdir / name).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        log(name, "series", len(ser))
    (outdir / "us-ers-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if not ers and not ttb: sys.exit(1)
if __name__ == "__main__": main()

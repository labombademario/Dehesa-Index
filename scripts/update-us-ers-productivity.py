#!/usr/bin/env python3
"""Productividad agraria (USDA ERS: Agricultural Productivity in the U.S. y International Agricultural Productivity) -> data/us-ers-productivity-stats.json (formato *-stats.json).
  EE. UU. Tabla 1: indices de produccion, insumos y productividad total de los factores (PTF), base 2015 = 1, anual desde 1948.
  EE. UU. Tabla 1a: indices de precios (2015 = 1) y cantidades implicitas (millones de dolares de 2015) de cada producto e insumo.
  Internacional: indices (PTF, produccion, insumos y sus componentes) por pais, 1961-ultimo ano, solo para los paises que ya estan en el catalogo; los demas paises se anaden cuando entren.
Cada punto es una cifra publicada; nada se calcula.
Uso: update-us-ers-productivity.py [--local DIR] [--out DIR]"""
import csv, io, re, sys
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
BASE = "https://www.ers.usda.gov/"
PUS = BASE + "data-products/agricultural-productivity-in-the-us"
PINT = BASE + "data-products/international-agricultural-productivity"
SGU = "USDA ERS, Agricultural Productivity in the U.S."; SGI = "USDA ERS, International Agricultural Productivity"
ISO3 = {"ARG": "AR", "AUS": "AU", "CAN": "CA", "CHE": "CH", "CHL": "CL", "URY": "UY", "GBR": "UK", "AUT": "AT", "BEL": "BE", "BGR": "BG", "CYP": "CY", "CZE": "CZ", "DEU": "DE", "DNK": "DK", "EST": "EE", "GRC": "EL", "ESP": "ES", "FIN": "FI", "FRA": "FR",
        "HRV": "HR", "HUN": "HU", "IRL": "IE", "ITA": "IT", "LTU": "LT", "LUX": "LU", "LVA": "LV", "MLT": "MT", "NLD": "NL", "POL": "PL", "PRT": "PT", "ROU": "RO", "SWE": "SE", "SVN": "SI", "SVK": "SK"}
def best_link(page, pat):
    """Enlace cuyo href cumple el patron y que lleva el ultimo ano en el nombre (ERS conserva la edicion anterior en la misma pagina)."""
    html = U.get(page, timeout=90).decode("utf-8", "replace"); c = []
    for m in re.finditer(r'href="([^"]+)"', html):
        u = m.group(1).replace("&amp;", "&")
        if re.search(pat, u, re.I):
            y = re.findall(r"(\d{4})(?:\.csv|\.xlsx)", u.split("?")[0]); c.append((int(y[-1]) if y else 0, u))
    if not c: raise ValueError("sin enlace para " + pat)
    import urllib.parse; return urllib.parse.urljoin(page, max(c)[1])
def long_rows(url):
    return list(csv.DictReader(io.StringIO(U.get(url).decode("utf-8-sig", "replace"))))
def us_t1(rows):
    by = defaultdict(list)
    for r in rows: by[r["Attribute"].strip()].append((r["Year"].strip(), U.fnum(r["Value"])))
    ser = []
    for a, pts in sorted(by.items()):
        s = U.mk_series("us-ersprod-t1-%s-a" % U.slug(a, 54), "production", "US agriculture: %s (ERS, index 2015=1)" % a, "index 2015=1", "annual", pts, SGU, min_points=20, max_age_years=4)
        if s: ser.append(s)
    return ser
def us_t1a(rows):
    by = defaultdict(list); ser = []
    for r in rows: by[r["Attribute"].strip()].append((r["Year"].strip(), U.fnum(r["Value"])))
    for a, pts in sorted(by.items()):
        m = re.match(r"^(.*): (Price|Quantity) \((.*)\)$", a)
        if not m: continue
        name, kind, u = m.groups()
        s = U.mk_series("us-ersprod-t1a-%s-%s-a" % (U.slug(name, 48), "p" if kind == "Price" else "q"), "prices" if kind == "Price" else "production", "US agriculture: %s, %s (ERS)" % (name, kind.lower()),
                        "index 2015=1" if kind == "Price" else "million USD (2015 dollars)", "annual", pts, SGU, min_points=20, max_age_years=4)
        if s: ser.append(s)
    return ser
def intl(rows):
    """{codigo de catalogo: [series]} con las variables *_Index de cada pais del catalogo."""
    by = defaultdict(list); names = {}; vars_ = set()
    for r in rows:
        cc = ISO3.get((r.get("ISO3") or "").strip())
        v = (r.get("Variable") or "").strip(); vars_.add(v)
        if not cc or not v.endswith("_Index"): continue
        by[(cc, v)].append((r["Year"].strip(), U.fnum(r["Value"]))); names[cc] = r["Country/territory"].strip()
    U.log("variables en el fichero:", ", ".join(sorted(vars_))[:600])
    out = defaultdict(list)
    for (cc, v), pts in sorted(by.items()):
        s = U.mk_series("us-ersprod-intl-%s-a" % U.slug(v.replace("_Index", ""), 30), "production", "Agricultural productivity: %s (ERS International, index)" % v.replace("_Index", "").replace("_", " "), "index", "annual", pts, SGI, min_points=20, max_age_years=4)
        if s: out[cc].append(s)
    return out, names
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-ers-productivity-stats.json"
    rc = 0
    try:
        ser = us_t1(long_rows(best_link(PUS, r"table-1-indices[^\"?]*\.csv"))); n1 = len(ser)
        ser += us_t1a(long_rows(best_link(PUS, r"table-1a-price-indices[^\"?]*\.csv")))
        U.log("EE. UU.: %d series (T1 %d)" % (len(ser), n1))
        per, names = intl(long_rows(best_link(PINT, r"machine-readable-and-long-format[^\"?]*\.csv")))
        U.log("paises del catalogo con datos:", len(per), sorted(per))
        ids = [s["id"] for s in ser]
        if len(ser) < 40: raise ValueError("solo %d series de EE. UU. (se esperan >=40)" % len(ser))
        if "us-ersprod-t1-total-factor-productivity-tfp-a" not in ids: raise ValueError("falta la PTF de EE. UU.")
        if len(per) < 15 or any(len(v) < 3 for v in per.values()): raise ValueError("pocos paises o series en la parte internacional")
        doc = U.stats_doc("USDA Economic Research Service, Agricultural Productivity", PUS, "US Government work (public domain); credit: USDA ERS", ser)
        for cc, ss in sorted(per.items()):
            doc["countries"][cc] = {"name": names.get(cc, cc), "extend": True, "source": {"name": "USDA Economic Research Service, International Agricultural Productivity", "url": PINT, "license": "US Government work (public domain); credit: USDA ERS"}, "series": ss}
        U.write_json(out, doc)
        U.log("OK: %d series de EE. UU. + %d paises" % (len(ser), len(per)))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-ers-productivity-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

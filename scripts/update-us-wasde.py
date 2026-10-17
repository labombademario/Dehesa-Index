#!/usr/bin/env python3
"""WASDE de EE. UU. (USDA OCE): cifras de oferta y demanda de EE. UU. con su revision mes a mes -> data/us-markets/wasde.json (+ libro data/us-markets/wasde-ledger.json).
El WASDE mensual se publica tambien como XML (wasdeMMYY.xml); en cada informe, la campana en curso trae DOS columnas: la del mes anterior y la del mes actual.
Cada ejecucion lee el informe del mes y el del anterior y anota esos valores en el LIBRO (una linea por magnitud, campana y mes de informe). Asi la historia de
revisiones se acumula desde la primera ejecucion y NO se inventa nada hacia atras: antes del primer libro no hay revisiones, salvo las del precio medio de campana,
que ya trae completas el CSV de ERS (data/us-markets/sap-forecasts.json).
Tablas leidas: trigo, maiz (y cereales pienso), sorgo, cebada, avena, arroz, soja (grano, aceite y harina), azucar, algodon, carnes, huevos, leche (oferta y precios
de las clases) y precios anuales del ganado. Valores tal como los publica el USDA; unidades segun el encabezado de cada tabla del informe.
Uso: update-us-wasde.py [--local DIR] [--out DIR]"""
import re, sys, io
import xml.etree.ElementTree as ET
from collections import OrderedDict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
PAGE = "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report"
BASE = "https://www.usda.gov/oce/commodity/wasde/"
KEEP_MONTHS = 36     # meses de informe que se guardan en el libro
# (subinforme, matriz) -> (grupo, id, nombre en ingles)
TABLES = {
 ("sr11", "matrix1"): ("crops", "wheat", "Wheat"),
 ("sr12", "matrix1"): ("crops", "feedgrains", "Feed grains"),
 ("sr12", "matrix2"): ("crops", "corn", "Corn"),
 ("sr13", "matrix1"): ("crops", "sorghum", "Sorghum"),
 ("sr13", "matrix2"): ("crops", "barley", "Barley"),
 ("sr13", "matrix3"): ("crops", "oats", "Oats"),
 ("sr14", "matrix1"): ("crops", "rice", "Rice"),
 ("sr15", "matrix1"): ("oilseeds", "soybeans", "Soybeans"),
 ("sr15", "matrix2"): ("oilseeds", "soyoil", "Soybean oil"),
 ("sr15", "matrix3"): ("oilseeds", "soymeal", "Soybean meal"),
 ("sr16", "matrix1"): ("crops", "sugar", "Sugar"),
 ("sr17", "matrix1"): ("crops", "cotton", "Cotton"),
 ("sr33", "matrix1"): ("livestock", "eggs", "Eggs"),
 ("sr33", "matrix2"): ("dairy", "milk", "Milk (supply and use)"),
 ("sr34", "matrix1"): ("dairy", "dairyprices", "Dairy prices"),
}
MEAT = {"Beef": "beef", "Pork": "pork", "Total Red Meat": "redmeat", "Broiler": "broiler", "Turkey": "turkey", "Total Poultry": "poultry", "Red Meat & Poultry": "meatpoultry"}
ANIMAL_PRICE = {"Steers": ("steers", "USD/cwt", "5-area direct, all grades"), "Barrows and gilts": ("hogs", "USD/cwt", "national base, live equivalent"),
                "Broilers": ("broilers", "cents/lb", "national composite, wholesale"), "Turkeys": ("turkeys", "cents/lb", "hens 8-16 lb, national"),
                "Eggs": ("eggs", "cents/dozen", "grade A large, New York"), "Milk": ("allmilk", "USD/cwt", "prices received by farmers, all milk")}
def clean(s): return re.sub(r"\s+", " ", s or "").strip()
def strip_fn(s): return clean(re.sub(r"\s*\b\d{1,2}/(?=\s|$)", " ", s))   # '2/' '10/' notas al pie
def norm(k): return re.sub(r"\d+$", "", re.sub(r"^m\d+_", "", k))
KEEPK = {"market_year", "forecast_month", "attribute", "commodity"}
def flat(root):
    """Celdas del XML: (subinforme, matriz, contexto, valor). El contexto recoge anio de campana, mes de prevision, atributo y producto de los ancestros y de los hermanos de grupo."""
    out = []
    def walk(e, ctx, sr, mx):
        ctx = dict(ctx)
        for k, v in e.attrib.items():
            n = norm(k)
            if n in KEEPK: ctx[n] = v
        if re.match(r"(m\d+_)?matrix\d+$", e.tag): mx = re.sub(r"^m\d+_", "", e.tag)
        if e.tag.endswith("attribute_group") or e.tag.endswith("commodity_group"):
            for c in e:
                if re.match(r"(m\d+_)?(attribute|commodity)\d+$", c.tag):
                    for k, v in c.attrib.items():
                        n = norm(k)
                        if n in KEEPK: ctx[n] = v
        if e.tag == "Cell":
            for k, v in e.attrib.items():
                if "cell_value" in k and v.strip(): out.append((sr, mx, ctx, v.strip()))
        for c in e: walk(c, ctx, sr, mx)
    for sr in root:
        rep = sr.find("Report")
        if rep is not None: walk(rep, {}, sr.tag, None)
    return out
def parse_month(rep_ym, fm):
    """'Sep' / 'September' / 'Oct Proj.' -> 'AAAA-MM' (el anio es el del informe, o el anterior si el mes es posterior al del informe)."""
    w = clean(fm).split(" ")[0] if clean(fm) else ""
    m = U.mon_num(w)
    if not m: return None
    y, rm = int(rep_ym[:4]), int(rep_ym[5:7])
    return "%04d-%02d" % (y - 1 if m > rm else y, m)
def unit_of(group, cid, attr, price_hint=None):
    a = attr.lower()
    m = re.search(r"\(([^)]*)\)", attr)
    if "avg. farm price" in a or "avg. price" in a or "avg. milling" in a:
        p = (m.group(1) if m else "").lower()
        if "%" in p: return "%"
        if "$/bu" in p: return "USD/bushel"
        if "$/cwt" in p: return "USD/cwt"
        if "c/lb" in p: return "cents/lb"
        if "$/s.t" in p: return "USD/short ton"
        if cid == "cotton": return "cents/lb"
        return None
    if "stocks to use" in a or "stocks-to-use" in a: return "%"
    if "area" in a or a in ("planted", "harvested") or "acres" in a: return "Million acres"
    if "yield" in a:
        return {"cotton": "pounds/acre", "rice": "pounds/acre", "feedgrains": "metric tons/hectare"}.get(cid, "bushels/acre")
    if group == "dairy" and cid == "dairyprices":
        return "USD/lb" if clean(attr) in ("Cheese", "Butter", "Nonfat Dry Milk", "Dry Whey") else "USD/cwt"
    if cid == "milk": return "Billion pounds"
    if cid == "eggs": return "number per person" if "per capita" in a else "Million dozen"
    if group == "livestock": return "pounds per person" if "per capita" in a else "Million pounds"
    return {"wheat": "Million bushels", "corn": "Million bushels", "sorghum": "Million bushels", "barley": "Million bushels", "oats": "Million bushels",
            "soybeans": "Million bushels", "rice": "Million cwt", "feedgrains": "Million metric tons", "soyoil": "Million pounds", "soymeal": "Thousand short tons",
            "cotton": "Million 480-lb bales", "sugar": "1,000 short tons, raw value"}.get(cid)
def my_key(s):
    s = clean(s); m = re.match(r"^(\d{4}(?:/\d{2})?)", s)
    if not m: return None, ""
    st = "Proj." if re.search(r"proj", s, re.I) else "Est." if re.search(r"\best", s, re.I) else ""
    return m.group(1), st
def extract(xml_bytes):
    """XML -> (mes del informe 'AAAA-MM', lista de lineas {g, c, cn, a, u, my, st, ym, v}) con ym = mes del informe al que pertenece el valor."""
    root = ET.fromstring(xml_bytes.lstrip(b"\xef\xbb\xbf"))
    rep0 = next(r.find("Report") for r in root if r.find("Report") is not None)
    mm = re.match(r"^(\w+)\s+(\d{4})$", clean(rep0.get("Report_Month")))
    if not mm or not U.mon_num(mm.group(1)): raise ValueError("mes del informe ilegible: " + repr(rep0.get("Report_Month")))
    rep_ym = "%04d-%02d" % (int(mm.group(2)), U.mon_num(mm.group(1)))
    rows = []
    for sr, mx, c, v in flat(root):
        val = U.fnum(v)
        if val is None: continue
        my, st = my_key(c.get("market_year"))
        if not my: continue
        fm = clean(c.get("forecast_month"))
        attr = strip_fn(c.get("attribute", ""))
        com = strip_fn(c.get("commodity", ""))
        if (sr, mx) in TABLES:
            g, cid, cn = TABLES[(sr, mx)]
            if not attr: continue
        elif sr == "sr32" and mx == "matrix1":
            cid = MEAT.get(com)
            if not cid or not attr: continue
            g, cn = "livestock", com
        elif sr == "sr31" and mx == "matrix2":
            base = re.sub(r"\s*\d+/$", "", com)
            if base not in ANIMAL_PRICE: continue
            if not (re.search(r"proj", fm, re.I) or fm == "Annual"): continue   # los trimestres no se guardan: solo el promedio anual
            g, cid, cn = "livestock", "animalprices", "Animal prices (annual average)"
            attr = base
        else: continue
        if fm == "" or fm == "Annual": ym = rep_ym
        else:
            ym = parse_month(rep_ym, fm)
            if not ym: continue
        u = unit_of(g, cid, attr) if cid != "animalprices" else ANIMAL_PRICE[attr][1]
        rows.append({"g": g, "c": cid, "cn": cn, "a": attr, "u": u, "my": my, "st": st, "ym": ym, "v": val})
    if len(rows) < 800: raise ValueError("pocas celdas (%d): el XML cambio de estructura" % len(rows))
    return rep_ym, rows
def merge(ledger, rep_ym, rows):
    items = ledger.setdefault("items", {})
    for r in rows:
        iid = r["c"] + "|" + re.sub(r"[^a-z0-9]+", "-", r["a"].lower()).strip("-")
        it = items.setdefault(iid, {"g": r["g"], "c": r["c"], "cn": r["cn"], "a": r["a"], "u": r["u"], "m": OrderedDict()})
        if r["u"] and not it.get("u"): it["u"] = r["u"]
        e = it["m"].setdefault(r["my"], {"st": {}, "v": {}})
        e["v"][r["ym"]] = r["v"]; e["st"][r["ym"]] = r["st"]
    reps = set(ledger.get("reports", [])); reps.add(rep_ym); ledger["reports"] = sorted(reps)[-KEEP_MONTHS:]
def month_add(ym, n):
    y, m = int(ym[:4]), int(ym[5:7]); t = y * 12 + (m - 1) + n
    return "%04d-%02d" % (t // 12, t % 12 + 1)
def trim(ledger):
    """Se conservan los valores de los ultimos KEEP_MONTHS meses (contados desde el informe mas reciente)."""
    cut = month_add(max(ledger["reports"]), -(KEEP_MONTHS - 1))
    for it in ledger["items"].values():
        for my in list(it["m"]):
            e = it["m"][my]
            for ym in [k for k in e["v"] if k < cut]: e["v"].pop(ym); e["st"].pop(ym, None)
            if not e["v"]: del it["m"][my]
def view(ledger, rep_ym):
    """Lo que se publica: por magnitud, las campanas presentes en el ULTIMO informe, con valor actual, valor del informe anterior y la historia acumulada."""
    prev_ym = month_add(rep_ym, -1)
    out = []
    for iid, it in ledger["items"].items():
        rows = []
        for my, e in it["m"].items():
            if rep_ym not in e["v"]: continue
            hist = sorted(e["v"].items())
            pv = e["v"].get(prev_ym) if prev_ym else None
            rows.append({"my": my, "st": e["st"].get(rep_ym, ""), "v": e["v"][rep_ym], "prev": pv, "hist": [[k, v] for k, v in hist][-KEEP_MONTHS:]})
        if not rows: continue
        rows.sort(key=lambda r: r["my"])
        out.append({"id": iid, "g": it["g"], "c": it["c"], "cn": it["cn"], "a": it["a"], "u": it["u"], "rows": rows[-3:]})
    return out, prev_ym
def validate(items, rep_ym):
    ids = {i["id"] for i in items}
    need = ["corn|avg-farm-price-bu", "wheat|avg-farm-price-bu", "soybeans|avg-farm-price-bu", "cotton|avg-farm-price", "corn|production", "soybeans|production", "wheat|production", "beef|production", "dairyprices|class-iii"]
    miss = [n for n in need if n not in ids]
    if miss: raise ValueError("faltan magnitudes clave: " + ", ".join(miss))
    pr = {i["id"]: i for i in items}
    cp = pr["corn|avg-farm-price-bu"]["rows"][-1]["v"]; sp = pr["soybeans|avg-farm-price-bu"]["rows"][-1]["v"]; wp = pr["wheat|avg-farm-price-bu"]["rows"][-1]["v"]
    if not (1 < cp < 15 and 3 < sp < 30 and 1.5 < wp < 20): raise ValueError("precios fuera de rango (maiz %s, soja %s, trigo %s)" % (cp, sp, wp))
    if len(items) < 150: raise ValueError("solo %d magnitudes" % len(items))
    for i in items:
        for r in i["rows"]:
            if not isinstance(r["v"], (int, float)) or abs(r["v"]) > 1e8: raise ValueError("valor imposible en " + i["id"])
def discover():
    """Nombres de XML del informe actual y del anterior en la pagina del WASDE (wasdeMMYY.xml); si la pagina no responde, se deducen del mes."""
    names = []
    try:
        h = U.get(PAGE, timeout=90).decode("utf-8", "replace")
        names = sorted(set(re.findall(r"wasde(\d{4})\.xml", h)), key=lambda s: (s[2:], s[:2]))
    except Exception as e: U.log("pagina del WASDE no legible:", repr(e)[:120])
    return names
def main():
    local, outdir = U.parse_args()
    d = (outdir or ROOT / "data") / "us-markets"
    led_path = d / "wasde-ledger.json"
    rc = 0
    try:
        import json
        ledger = json.loads(led_path.read_text(encoding="utf-8")) if led_path.exists() else {"reports": [], "items": {}}
        names = discover()
        if local is not None and not names:
            names = sorted({p.stem.replace("wasde", "") for p in local.glob("wasde????.xml")}, key=lambda s: (s[2:], s[:2]))
        if not names and local is None:
            # la pagina del WASDE a veces no responde desde los runners (usda.gov): se deducen los nombres de los 3 ultimos meses y se quedan los que existen
            import datetime as _dt
            t = _dt.date.today(); cand = []
            for k in range(3):
                y, m = t.year, t.month - k
                while m < 1: m += 12; y -= 1
                cand.append("%02d%02d" % (m, y % 100))
            for nm in sorted(cand, key=lambda s: (s[2:], s[:2])):
                try: U.get(BASE + "wasde%s.xml" % nm, tries=2, timeout=90); names.append(nm)
                except Exception as e: U.log("sin XML de %s: %s" % (nm, repr(e)[:80]))
            U.log("nombres deducidos del mes:", names)
        if not names: raise ValueError("no hay XML del WASDE en la pagina")
        if len(names) < 2: U.log("solo un informe en la pagina:", names)
        done = set(ledger.get("reports", []))
        last_ym = None
        for nm in names[-2:]:
            ym = "20%s-%s" % (nm[2:], nm[:2])
            if ym in done and nm != names[-1]: U.log("ya en el libro:", ym); continue   # el informe actual se relee siempre (puede haber version corregida)
            raw = U.get(BASE + "wasde%s.xml" % nm)
            rep_ym, rows = extract(raw)
            if rep_ym != ym: raise ValueError("el XML %s dice ser del mes %s" % (nm, rep_ym))
            merge(ledger, rep_ym, rows); last_ym = rep_ym
            U.log("leido %s: %d celdas" % (nm, len(rows)))
        if not last_ym: raise ValueError("no se leyo ningun informe")
        trim(ledger)
        items, prev_ym = view(ledger, max(ledger["reports"]))
        rep_ym = max(ledger["reports"])
        validate(items, rep_ym)
        doc = {"schemaVersion": "1.0", "generatedAt": U.now_iso(), "sourceId": "usda_oce_wasde", "pageUrl": PAGE, "reportMonth": rep_ym, "previousReportMonth": prev_ym,
               "ledgerSince": ledger["reports"][0], "reports": ledger["reports"], "items": items}
        U.write_json(d / "wasde.json", doc); U.write_json(led_path, ledger)
        U.log("OK: informe %s, %d magnitudes, libro desde %s" % (rep_ym, len(items), ledger["reports"][0]))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-wasde-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

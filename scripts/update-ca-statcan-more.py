#!/usr/bin/env python3
"""Statistics Canada, tablas nuevas para Canada -> data/ca-statcan-more-stats.json (formato *-stats.json, pais CA, extiende el catalogo).
  16-10-0017  Aserraderos: produccion, envios y existencias de madera aserrada por especie (miles de m3, mensual), Canada y provincias madereras.
  18-10-0265  Indice de precios industriales (IPPI) por grupo de producto, Canada, mensual (2020-01 = 100): alimentos, quimicos, madera, energia, maquinaria...
  18-10-0268  Indice de precios de materias primas (RMPI), Canada, mensual (2020-01 = 100).
  18-10-0004  IPC de Canada, mensual (2002 = 100): alimentos por grupo, energia y combustibles.
  32-10-0107  Acuicultura: produccion (t) y valor (miles de CAD) por especie, anual, Canada y total por provincia.
Licencia Statistics Canada Open Licence. Cada punto es una cifra publicada; nada se calcula (las cifras con marca de supresion o vacias se omiten).
Uso: update-ca-statcan-more.py [--out DIR]   (descarga por la API WDS)"""
import csv, io, json, re, sys, time, zipfile
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
WDS = "https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/%d/en"
PAGE = "https://www150.statcan.gc.ca/n1/en/subjects/agriculture_and_food"
LIC = "Statistics Canada Open Licence"
LUMBER_GEO = ["Canada", "Quebec", "Ontario", "British Columbia", "Alberta"]
GEOC = {"Canada": "ca", "Quebec": "qc", "Ontario": "on", "British Columbia": "bc", "Alberta": "ab"}
CPI_GEO = "Canada"
CPI_ITEMS = ["All-items", "Food", "Food purchased from stores", "Food purchased from restaurants", "Meat", "Fish, seafood and other marine products", "Dairy products and eggs", "Bakery and cereal products (excluding baby food)",
             "Fruit, fruit preparations and nuts", "Vegetables and vegetable preparations", "Energy", "Gasoline", "Fuel oil and other fuels", "Natural gas", "Electricity"]
def clean(s): return re.sub(r"\s*\[[0-9A-Za-z.]+\]\s*$", "", (s or "").strip())
def val(r):
    v = r.get("VALUE", "")
    if v in ("", None): return None
    try: return float(v)
    except ValueError: return None
def group_by(rows, key):
    by = {}
    for r in rows:
        v = val(r)
        if v is None: continue
        k = key(r)
        if k is not None: by.setdefault(k, []).append((r["REF_DATE"], v))
    return by
def lumber(rows, nap="North American Product Classification System (NAPCS)"):
    out = []
    by = group_by(rows, lambda r: (r["GEO"], clean(r[nap])) if r["GEO"] in LUMBER_GEO else None)
    for (geo, prod), pts in sorted(by.items()):
        g = "stocks" if prod.lower().endswith("stocks") else "production"
        s = U.mk_series("ca-sc-lumber-%s-%s-m" % (GEOC[geo], U.slug(prod, 60)), g, "Sawmills, %s: %s (monthly)" % (geo, prod[0].lower() + prod[1:]), "thousand m3", "monthly", pts, "StatCan 16-10-0017", min_points=36, max_age_years=1, keep=240)
        if s: out.append(s)
    return out
def ippi(rows, pid, tag, what, nap="North American Product Classification System (NAPCS)"):
    out = []
    by = group_by(rows, lambda r: clean(r[nap]) if r["GEO"] == "Canada" and "annabis" not in r[nap] else None)
    for prod, pts in sorted(by.items()):
        s = U.mk_series("ca-sc-%s-%s-m" % (tag, U.slug(prod, 60)), "prices", "%s: %s (monthly, 2020-01=100)" % (what, prod[0].lower() + prod[1:] if not prod.startswith(("IPPI", "Total")) else prod), "index 2020-01=100", "monthly", pts, "StatCan %s" % pid, min_points=36, max_age_years=1, keep=480)
        if s: out.append(s)
    return out
def cpi(rows):
    out = []; want = {k.lower(): k for k in CPI_ITEMS}
    by = group_by(rows, lambda r: clean(r["Products and product groups"]) if r["GEO"] == CPI_GEO and r["UOM"] == "2002=100" and clean(r["Products and product groups"]).lower() in want else None)
    miss = [k for k in CPI_ITEMS if k not in by]
    if miss: U.log("IPC sin datos para:", miss)
    for prod, pts in sorted(by.items()):
        s = U.mk_series("ca-sc-cpi-%s-m" % U.slug(prod, 50), "prices", "Consumer price index, Canada: %s (monthly, 2002=100)" % prod, "index 2002=100", "monthly", pts, "StatCan 18-10-0004", min_points=36, max_age_years=1, keep=480)
        if s: out.append(s)
    return out
def aqua(rows):
    out = []
    def key(r):
        sp = clean(r["Finfish and shellfish"])
        if sp.startswith("Total aquaculture") and "including" in sp: return None
        if r["GEO"] != "Canada" and sp != "Total aquaculture": return None
        return (r["GEO"], sp, r["Production"])
    by = group_by(rows, key)
    for (geo, sp, kind), pts in sorted(by.items()):
        t = kind == "Tonnes"
        s = U.mk_series("ca-sc-aqua-%s-%s-%s-a" % (U.slug(geo, 14), U.slug(sp, 40), "t" if t else "cad"), "fish", "Aquaculture, %s: %s, %s (annual)" % (geo, sp[0].lower() + sp[1:], "production in tonnes" if t else "value in thousand CAD"),
                        "t" if t else "thousand CAD", "annual", pts, "StatCan 32-10-0107", min_points=10, max_age_years=3)
        if s: out.append(s)
    return out
def load(pid):
    last = None
    for i in range(3):
        try:
            info = json.loads(U.get(WDS % pid, timeout=90).decode("utf-8"))
            raw = U.get(info["object"], timeout=600)
            z = zipfile.ZipFile(io.BytesIO(raw)); name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
            rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")))
            U.log("tabla", pid, len(rows), "filas"); return rows
        except Exception as e:
            last = e; U.log("intento %d tabla %d: %r" % (i + 1, pid, e)); time.sleep(10 * (i + 1))
    raise RuntimeError("%d: %r" % (pid, last))
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "ca-statcan-more-stats.json"
    rc = 0
    try:
        ser = []; ok = {}
        for name, pid, fn in (("lumber", 16100017, lumber), ("ippi", 18100265, lambda r: ippi(r, "18-10-0265", "ippi", "Industrial product price index, Canada")),
                              ("rmpi", 18100268, lambda r: ippi(r, "18-10-0268", "rmpi", "Raw materials price index, Canada")), ("cpi", 18100004, cpi), ("aqua", 32100107, aqua)):
            try:
                s = fn(load(pid)); ok[name] = len(s); ser += s; U.log(name, len(s), "series")
            except Exception as e:
                U.log("FALLO", name, repr(e)[:200])
        ids = [s["id"] for s in ser]
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos")
        if len(ok) < 5 or min(ok.values()) < 5: raise ValueError("faltan bloques o salen pocas series: %r" % ok)
        doc = U.stats_doc("Statistics Canada", PAGE, LIC, ser)
        doc["countries"] = {"CA": dict(doc["countries"]["US"], name="Canada")}
        U.write_json(out, doc); U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "ca-statcan-more-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

#!/usr/bin/env python3
"""Canada: Censo agrario 2021 por region agricola censal (CAR), division censal (CD) y subdivision censal consolidada (CCS) -> data/ca-sub/census/<PROV>.json + index.json
Fuente: Statistics Canada, tablas de la serie 32-10 (Census of Agriculture 2021), descarga completa en CSV (sin clave): explotaciones por tipo (32-10-0231), uso del suelo (0249),
cultivos de campo y heno (0309), ganado vacuno (0370), ovino (0371) y porcino (0372), ingresos (0240) y gastos (0241) de explotacion, insumos y regadio (0368) y operadores (0381).
Se copia el valor tal cual lo publica Statistics Canada: las celdas suprimidas por confidencialidad (x, F, ..) no traen valor y quedan como hueco, nunca como cero.
Control: en cada provincia, la suma de sus divisiones censales no se aparta mas de un 3 % del total provincial (el censo redondea al azar) para explotaciones; si falla, no se escribe nada.
Uso: update-ca-subprov-census.py [--out DIR] [--fixture-dir DIR]   (fixture: <tabla>.csv ya descomprimidos, sin red)"""
import argparse, csv, datetime, io, json, re, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://www150.statcan.gc.ca/n1/tbl/csv/%s-eng.zip"
PROV = {"10": "NL", "11": "PE", "12": "NS", "13": "NB", "24": "QC", "35": "ON", "46": "MB", "47": "SK", "48": "AB", "59": "BC", "60": "YT", "61": "NT", "62": "NU"}
LEVELS = ("PR", "CAR", "CD", "CCS")
# clave, tabla, {columna: valor}, unidad
F = lambda k, t, c, u: (k, t, c, u)
NA = "North American Industry Classification System (NAICS)"
FIELDS = [
    F("farms", "32100231", {NA: "Total number of farms"}, "farms"), F("t_grain", "32100231", {NA: "Oilseed and grain farming [1111]"}, "farms"), F("t_veg", "32100231", {NA: "Vegetable and melon farming [1112]"}, "farms"),
    F("t_fruit", "32100231", {NA: "Fruit and tree nut farming [1113]"}, "farms"), F("t_greenh", "32100231", {NA: "Greenhouse, nursery and floriculture production [1114]"}, "farms"),
    F("t_hay", "32100231", {NA: "Hay farming [111940]"}, "farms"), F("t_cattle", "32100231", {NA: "Cattle ranching and farming [1121]"}, "farms"),
    F("t_dairy", "32100231", {NA: "Dairy cattle and milk production [112120]"}, "farms"), F("t_hogs", "32100231", {NA: "Hog and pig farming [1122]"}, "farms"),
    F("t_poultry", "32100231", {NA: "Poultry and egg production [1123]"}, "farms"), F("t_sheep", "32100231", {NA: "Sheep and goat farming [1124]"}, "farms"),
    F("a_farm", "32100249", {"Land use": "Total farm area", "Unit of measure": "Acres"}, "acres"), F("a_crops", "32100249", {"Land use": "Land in crops (excluding Christmas tree area)", "Unit of measure": "Acres"}, "acres"),
    F("a_fallow", "32100249", {"Land use": "Summerfallow land", "Unit of measure": "Acres"}, "acres"), F("a_tame", "32100249", {"Land use": "Tame or seeded pasture", "Unit of measure": "Acres"}, "acres"),
    F("a_natural", "32100249", {"Land use": "Natural land for pasture", "Unit of measure": "Acres"}, "acres"), F("a_wood", "32100249", {"Land use": "Woodlands and wetlands", "Unit of measure": "Acres"}, "acres"),
]
for k, name in [("c_total", "Total area of field crops and hay"), ("c_wheat", "Wheat, total"), ("c_durum", "Durum wheat"), ("c_oats", "Oats"), ("c_barley", "Barley"), ("c_corn", "Corn for grain"), ("c_canola", "Canola (rapeseed)"),
                ("c_soy", "Soybeans"), ("c_flax", "Flaxseed"), ("c_peas", "Dry field peas"), ("c_lentils", "Lentils"), ("c_alfalfa", "Alfalfa and alfalfa mixtures"), ("c_hay", "All other tame hay and fodder crops"), ("c_potato", "Potatoes")]:
    FIELDS.append(F(k, "32100309", {"Field crops and hay": name, "Unit of measure": "Acres"}, "acres"))
FIELDS += [F("l_cattle", "32100370", {"Cattle": "Total cattle", "Unit of measure": "Number of animals"}, "head"), F("l_cows_beef", "32100370", {"Cattle": "Cows, beef", "Unit of measure": "Number of animals"}, "head"),
           F("l_cows_dairy", "32100370", {"Cattle": "Cows, dairy", "Unit of measure": "Number of animals"}, "head"), F("l_sheep", "32100371", {"Sheep": "Total sheep", "Unit of measure": "Number of animals"}, "head"),
           F("l_pigs", "32100372", {"Pigs": "Total pigs", "Unit of measure": "Number of animals"}, "head"),
           F("rev", "32100240", {"Total operating revenues, excluding forest products": "Dollars"}, "CAD"), F("exp", "32100241", {"Total farm operating expenses": "Dollars"}, "CAD"),
           F("irrig", "32100368", {"Land inputs, manure and irrigation": "Irrigation", "Unit of measure": "Acres"}, "acres"), F("fert", "32100368", {"Land inputs, manure and irrigation": "Commercial fertilizer", "Unit of measure": "Acres"}, "acres")]
OPS = "Farms according to the number of operators reported"
FIELDS += [F("op_n", "32100381", {OPS: "All farms", "Characteristics": "Total number of farm operators"}, "people"), F("op_female", "32100381", {OPS: "All farms", "Characteristics": "Sex - female"}, "people"),
           F("op_u35", "32100381", {OPS: "All farms", "Characteristics": "Age - under 35 years"}, "people"), F("op_o55", "32100381", {OPS: "All farms", "Characteristics": "Age - 55 years and over"}, "people"),
           F("op_age", "32100381", {OPS: "All farms", "Characteristics": "Age - average"}, "years")]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def table_text(t, fixture):
    if fixture:
        p = Path(fixture) / (t + ".csv"); return p.read_text("utf-8-sig")
    last = None
    for i in range(3):
        try:
            blob = urllib.request.urlopen(urllib.request.Request(URL % t, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=300).read()
            z = zipfile.ZipFile(io.BytesIO(blob)); n = [x for x in z.namelist() if x.endswith(".csv") and "MetaData" not in x][0]
            return z.read(n).decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s: %s" % (t, repr(last)[:140]))
def geo_info(geo):
    m = re.search(r"\[([A-Z]*)(\d+)\]$", geo)
    if not m: return None
    lv, code = m.group(1), m.group(2)
    if lv == "" and code.strip("0") == "": return ("CA", code, "Canada")
    if lv not in LEVELS: return None
    name = re.sub(r"\s*\[[^\]]*\]$", "", geo)
    pv = {"PR": code[:2], "CAR": code[:2], "CD": code[:2], "CCS": code[:2]}[lv]
    return (lv, code, name, pv)
def read_table(t, specs, fixture, areas, canada):
    rd = csv.reader(io.StringIO(table_text(t, fixture))); h = next(rd)
    ix = {c: h.index(c) for c in h}; gi, vi, ri = ix["GEO"], ix["VALUE"], ix["REF_DATE"]
    want = {}
    for k, c, u in specs: want.setdefault(tuple(sorted(c.items())), []).append(k)
    n = 0
    for row in rd:
        if row[ri] != "2021": continue
        key = None
        for cond, ks in want.items():
            if all(row[ix[c]] == v for c, v in cond): key = ks[0]; break
        if key is None: continue
        v = row[vi].strip()
        if v == "": continue
        try: val = float(v)
        except ValueError: continue
        val = int(val) if val == int(val) else round(val, 1)
        g = geo_info(row[gi])
        if not g: continue
        if g[0] == "CA": canada[key] = val; continue
        a = areas.setdefault(g[1], {"n": re.sub(r"\s+", " ", re.sub(r",\s*[^,]+$", "", g[2]) if g[0] != "PR" else g[2]), "l": g[0], "p": PROV.get(g[3]), "v": {}})
        a["v"][key] = val; n += 1
    return n
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture-dir"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "ca-sub" / "census"
    areas, canada = {}, {}
    for t in sorted({f[1] for f in FIELDS}):
        specs = [(k, c, u) for k, tt, c, u in FIELDS if tt == t]
        n = read_table(t, specs, a.fixture_dir, areas, canada); log("tabla", t, n, "valores")
    byp = {}
    for code, ar in areas.items():
        if ar["p"] is None: continue
        byp.setdefault(ar["p"], {})[code] = ar
    if len(byp) < 10: log("FALLO: solo %d provincias" % len(byp)); return 1
    for p, d in byp.items():                      # control: divisiones censales frente al total provincial (explotaciones)
        pr = [x for x in d.values() if x["l"] == "PR"]; cd = [x for x in d.values() if x["l"] == "CD" and "farms" in x["v"]]
        if pr and "farms" in pr[0]["v"] and cd:
            tot, s = pr[0]["v"]["farms"], sum(x["v"]["farms"] for x in cd)
            if tot and abs(s - tot) / tot > 0.03: log("FALLO: %s divisiones suman %d y la provincia %d" % (p, s, tot)); return 1
    if "farms" not in canada or sum(1 for x in areas.values() if x["l"] == "CCS") < 1500: log("FALLO: cobertura insuficiente"); return 1
    out.mkdir(parents=True, exist_ok=True); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "statcan", "url": "https://www150.statcan.gc.ca/n1/en/catalogue/32100231"}
    units = {k: u for k, _, _, u in FIELDS}; idx = {}
    for p, d in sorted(byp.items()):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "province": p, "year": 2021, "units": units, "areas": dict(sorted(d.items()))}
        (out / (p + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
        idx[p] = {lv: sum(1 for x in d.values() if x["l"] == lv) for lv in LEVELS}
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "year": 2021, "units": units, "canada": canada, "provinces": idx}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d provincias, %d areas" % (len(idx), sum(sum(v.values()) for v in idx.values()))); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "ca-subprov-census-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

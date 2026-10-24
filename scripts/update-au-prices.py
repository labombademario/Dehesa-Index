#!/usr/bin/env python3
"""Australia: indices de precios (ABS CPI, PPI, ITPI importaciones/exportaciones), valor implicito de cosecha (ABS AG_BROADACRE / AG_HORTICULTURE)
e indice de precios de materias primas rurales (RBA I2). Licencias: ABS y RBA CC BY 4.0. Sin clave.
Escribe data/australia-prices-stats.json (extend AU) y data/australia-prices-log.txt.
Notas honestas: las series CPI se rebasan (Sep 2025=100), por eso siempre se baja la historia completa; el PPI 'INPUT' de agricultura es el precio de la
materia prima agraria que paga la industria, no el coste de insumos del agricultor; la base del PPI/ITPI no la publica la API."""
import csv, datetime, io, json, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.api.abs.gov.au/rest/data/"
LOG = []; OUT = {}
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "australia-prices-log.txt").write_text("\n".join(LOG))
    except Exception: pass
def get(url, accept, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "Dehesa-Index-data-bot/1.0"})
            return urllib.request.urlopen(req, timeout=120).read().decode("utf-8-sig")
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: break
            time.sleep(4 * (i + 1))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def abs_csv(path): return list(csv.DictReader(io.StringIO(get(BASE + path, "application/vnd.sdmx.data+csv"))))
def put(sid, group, label, unit, freq, pts, src, note=None, ref=None):
    d = {p: v for p, v in pts if v is not None}
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return
    prev = pts[-2][1]
    o = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=pts[-1][0], latest=pts[-1][1], changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup=src)
    if note: o["periodNote"] = note
    if ref: o["reference"] = ref
    OUT[sid] = o
def series(rows, key):
    res = {}
    for r in rows:
        if r.get("OBS_VALUE") in (None, ""): continue
        res.setdefault(r[key], []).append((r["TIME_PERIOD"], float(r["OBS_VALUE"])))
    return res
# CPI: (indice, id, etiqueta)
CPI = [("40009", "beef", "Beef and veal"), ("40010", "lamb", "Lamb and goat"), ("131178", "pork", "Pork"), ("40012", "poultry", "Poultry"), ("40001", "milk", "Milk"),
       ("40002", "cheese", "Cheese"), ("40027", "eggs", "Eggs"), ("40088", "wine", "Wine"), ("114121", "fruit", "Fruit"), ("114122", "vegetables", "Vegetables"),
       ("40081", "fuel", "Automotive fuel"), ("40055", "electricity", "Electricity")]
CPI_NOTE = "Indice de precios al consumo (ABS, base Sep 2025=100; la serie se rebasa y se descarga completa en cada ejecucion). Precio al consumidor, no de granja."
def run_cpi():
    ids = "+".join(c for c, _, _ in CPI); lab = {c: l for c, _, l in CPI}; key = {c: k for c, k, _ in CPI}; n = 0
    for fq, tag, word in (("Q", "q", "quarterly"), ("M", "m", "monthly")):
        rows = abs_csv("CPI/1.%s.10.50.%s?startPeriod=%s" % (ids, fq, "1980-Q1" if fq == "Q" else "2017-09"))
        for c, pts in series(rows, "INDEX").items():
            put("au-cpi-%s-%s" % (key[c], tag), "idx_pag", "Consumer price index: %s, Australia (%s)" % (lab[c], word), "index Sep 2025=100", word, pts, "ABS CPI", CPI_NOTE, "ABS Consumer Price Index (CPI), dataflow CPI"); n += 1
    log("cpi", n)
# PPI (INPUT = materia prima agraria que paga la industria; OUTPUT = precio de salida de la industria)
PPI = [("7013001", "agri", "Agriculture, raw material price paid by industry"), ("7015231", "sheep-beef-grain", "Sheep, beef cattle and grain farming, raw material price paid by industry"),
       ("7015232", "dairy-cattle", "Dairy cattle farming, raw material price paid by industry"), ("7015233", "poultry-farming", "Poultry farming, raw material price paid by industry"),
       ("7015234", "other-livestock", "Other livestock farming, raw material price paid by industry"), ("8133017", "other-crops", "Other crop growing, raw material price paid by industry"),
       ("8132999", "fruit-nuts", "Fruit and tree nut growing, raw material price paid by industry"), ("8132989", "vegetables", "Mushroom and vegetable growing, raw material price paid by industry"),
       ("1327001", "meat-processing", "Meat processing, producer price (output)"), ("1327004", "milk-processing", "Milk and cream processing, producer price (output)"),
       ("8048286", "cheese-mfg", "Cheese and other dairy product manufacturing, producer price (output)"), ("1325002", "dairy-mfg", "Dairy product manufacturing, producer price (output)"),
       ("1327026", "wine-mfg", "Wine and other alcoholic beverage manufacturing, producer price (output)"), ("1327021", "feed-mfg", "Prepared animal and bird feed manufacturing, producer price (output)"),
       ("1377120", "fertiliser-mfg", "Fertiliser manufacturing, producer price (output)"), ("8126314", "fert-pest-mfg", "Fertiliser and pesticide manufacturing, producer price (output)"),
       ("1385038", "petroleum-refining", "Petroleum refining and fuel manufacturing, producer price (output)")]
AGRI_IN = {"7013001", "7015231", "7015232", "7015233", "7015234", "8133017", "8132999", "8132989"}
PPI_NOTE = "Indice de precios de productor (ABS PPI). Los 'raw material price paid by industry' son lo que la industria paga por la materia prima agraria (indice de precio de granja), no el coste de insumos del agricultor. La API no publica el periodo base."
def run_ppi():
    ids = "+".join(c for c, _, _ in PPI); lab = {c: l for c, _, l in PPI}; key = {c: k for c, k, _ in PPI}; n = 0
    rows = abs_csv("PPI/1.%s..Q?startPeriod=1983-Q1" % ids)
    by = {}
    for r in rows:
        if r.get("OBS_VALUE") in (None, ""): continue
        if r["TYPE"] not in ("INPUT", "OUTPUT"): continue
        want = "INPUT" if r["INDEX"] in AGRI_IN else "OUTPUT"   # agricultura = INPUT; manufacturas = OUTPUT
        if r["TYPE"] != want: continue
        by.setdefault(r["INDEX"], []).append((r["TIME_PERIOD"], float(r["OBS_VALUE"])))
    for c, pts in by.items():
        put("au-ppi-%s" % key[c], "idx_perc", "Producer price index: %s, Australia" % lab[c], "index (base not published)", "quarterly", pts, "ABS PPI", PPI_NOTE, "ABS Producer Price Indexes, dataflow PPI"); n += 1
    log("ppi", n)
ITPI = [("ITPI_IMP", "6015020", "imp-fertilisers", "Import price index: fertilisers (excluding crude), Australia"), ("ITPI_IMP", "6015013", "imp-petroleum", "Import price index: petroleum and petroleum products, Australia"),
        ("ITPI_IMP", "6015001", "imp-dairy-eggs", "Import price index: dairy products and eggs, Australia"), ("ITPI_EXP", "3117016", "exp-beverages", "Export price index: beverages, spirits and vinegar, Australia"),
        ("ITPI_EXP", "3117035", "exp-cotton", "Export price index: cotton, Australia"), ("ITPI_EXP", "3117005", "exp-edible-vegetables", "Export price index: edible vegetables, Australia"),
        ("ITPI_EXP", "3117010", "exp-fats-oils", "Export price index: animal or vegetable fats and oils, Australia"), ("ITPI_EXP", "3117030", "exp-hides", "Export price index: raw hides and skins and leather, Australia")]
def run_itpi():
    n = 0
    for fl in ("ITPI_IMP", "ITPI_EXP"):
        its = [i for i in ITPI if i[0] == fl]
        rows = abs_csv("%s/1.%s.Q?startPeriod=1983-Q1" % (fl, "+".join(i[1] for i in its)))
        s = series(rows, "INDEX")
        for _, c, k, lab in its:
            if c in s: put("au-itpi-%s" % k, "idx_perc", lab, "index (base not published)", "quarterly", s[c], "ABS " + fl, "Indice de precios de comercio exterior (ABS). La API no publica el periodo base.", "ABS International Trade Price Indexes, dataflow " + fl); n += 1
    log("itpi", n)
# cosecha: valor local / produccion = A$/t implicito (derivado por Dehesa Index)
BROAD = [("Wheat", "wheat"), ("Barley", "barley"), ("Maize", "maize"), ("Canola", "canola"), ("Sugarcane", "sugarcane"), ("Rice", "rice")]
def fy(t): return t[:4]   # ano de inicio del ejercicio (julio-junio): 2024 = 2024-25
def run_ag():
    n = 0
    for fl, items in (("AG_BROADACRE", [("Broad" + a, b, "Prod_Levy", "Val_Local") for a, b in BROAD]), ("AG_HORTICULTURE", [("HortWinegrape", "wine-grapes", "Crush", "Val_Local")])):
        for pre, k, pn, vn in items:
            rows = abs_csv("%s/%s_%s+%s_%s.AUS" % (fl, pre, pn, pre, vn))
            prod = {fy(r["TIME_PERIOD"]): float(r["OBS_VALUE"]) for r in rows if r["DATAITEM"].endswith(pn) and r["OBS_VALUE"] not in ("", None)}
            val = {fy(r["TIME_PERIOD"]): float(r["OBS_VALUE"]) for r in rows if r["DATAITEM"].endswith(vn) and r["OBS_VALUE"] not in ("", None)}
            pts = [(p, val[p] / prod[p]) for p in sorted(prod) if p in val and prod[p] > 0]
            name = k.replace("-", " ")
            put("au-ag-value-per-tonne-%s" % k, "prices", "Implied farm value per tonne: %s, Australia (A$/t, derived)" % name, "A$/t", "annual", pts, "ABS " + fl,
                "Derivado por Dehesa Index: valor local de la produccion / produccion (cuotas de tasas de la industria, no censo). El periodo es el año de inicio del ejercicio fiscal (2024 = 2024-25). Solo hay tres campañas; no es un precio de mercado.", "ABS %s: %s_%s / %s_%s" % (fl, pre, vn, pre, pn)); n += 1
    log("ag", n)
def run_rba():
    txt = get("https://www.rba.gov.au/statistics/tables/csv/i2-data.csv", "text/csv")
    rows = list(csv.reader(io.StringIO(txt)))
    hdr = next(i for i, r in enumerate(rows) if r and r[0] == "Series ID")
    sid = rows[hdr]; want = {"GRCPRCAD": ("rural", "Rural commodity prices"), "GRCPAIAD": ("all", "All commodity prices")}
    for j, s in enumerate(sid):
        if s in want:
            pts = []
            for r in rows[hdr + 1:]:
                if len(r) > j and r[j].strip():
                    d, m, y = r[0].split("/"); pts.append(("%s-%s" % (y, m), float(r[j])))
            put("au-rba-i2-%s" % want[s][0], "idx_perc", "%s index, A$ terms, Australia (RBA)" % want[s][1], "index 2024/25=100", "monthly", pts, "RBA I2",
                "Indice de precios de materias primas del RBA (A$, 2024/25=100), media mensual; solo agregado rural, sin subindices por producto.", "RBA Statistical Table I2 (%s)" % s)
    log("rba", sum(1 for k in OUT if k.startswith("au-rba")))
def main():
    for fn in (run_cpi, run_ppi, run_itpi, run_ag, run_rba):
        try: fn()
        except Exception as e: log("ERROR", fn.__name__, repr(e))
    log("series", len(OUT))
    if len(OUT) < 25: sys.exit(1)
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"name": "Australian Bureau of Statistics (ABS Data API) and Reserve Bank of Australia", "url": "https://www.abs.gov.au/", "license": "CC BY 4.0"}
    (ROOT / "data" / "australia-prices-stats.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "countries": {"AU": {"name": "Australia", "extend": True, "source": src, "series": list(OUT.values())}}}, ensure_ascii=False, separators=(",", ":")))
main()

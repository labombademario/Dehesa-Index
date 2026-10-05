#!/usr/bin/env python3
"""Mercado e insumos de EE. UU. -> data/us-markets/{cot,transport,fuel}.json y data/us-markets/log.txt
  cot.json        posiciones de los fondos (CFTC Commitments of Traders, informe desagregado solo futuros): maiz, soja, harina y aceite de soja,
                  trigo SRW y HRW, vacuno vivo, vacuno de engorde y porcino magro. Contratos abiertos, gestores de dinero, productores/comerciantes y swaps.
  transport.json  transporte de grano de USDA AMS (AgTransport): indicadores semanales de coste por modo (camion, tren lanzadera, barcaza, flete
                  oceanico; indice 2017 = 100) y fletes de barcaza rio abajo por el sistema del Misisipi (porcentaje de la tarifa 7 y USD por tonelada).
  fuel.json       gasoleo de automocion (precio de venta al publico, semanal) por region PADD y por los estados que publica la EIA, y propano
                  (residencial y mayorista, semanal; la EIA solo lo publica en la temporada de calefaccion, de octubre a marzo).
Todo tal como lo publica la fuente: un hueco es un hueco. Si un bloque falla, se conserva su fichero anterior (nunca se borra un dato).
La clave EIA_API_KEY solo se lee del entorno y nunca se escribe; sin clave se usa DEMO_KEY (limite bajo de llamadas, suficiente para este volumen).
Uso: update-us-markets.py [--outdir DIR] [--years N]"""
import datetime, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LOG = []
EIA_KEY = os.environ.get("EIA_API_KEY") or "DEMO_KEY"
def log(*a):
    s = " ".join(str(x) for x in a)
    if EIA_KEY and EIA_KEY != "DEMO_KEY": s = s.replace(EIA_KEY, "***")
    LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = "HTTP %s" % e.code
            if e.code in (400, 401, 403, 404): break
        except Exception as e: last = repr(e)[:200]
        time.sleep(4 * (i + 1))
    raise RuntimeError(last)
def num(v):
    try:
        x = float(str(v).replace(",", "").strip())
        return x if x == x else None
    except Exception: return None
def day(s): return str(s or "")[:10]

# ---------------- CFTC ----------------
COT = [("002602", "corn", "Maiz", "CBOT"), ("005602", "soybeans", "Soja", "CBOT"), ("026603", "soymeal", "Harina de soja", "CBOT"), ("007601", "soyoil", "Aceite de soja", "CBOT"),
       ("001602", "wheat_srw", "Trigo SRW", "CBOT"), ("001612", "wheat_hrw", "Trigo HRW", "KCBT"), ("057642", "live_cattle", "Vacuno vivo", "CME"),
       ("061641", "feeder_cattle", "Vacuno de engorde", "CME"), ("054642", "lean_hogs", "Porcino magro", "CME")]
COT_F = ["open_interest_all", "m_money_positions_long_all", "m_money_positions_short_all", "m_money_positions_spread", "prod_merc_positions_long", "prod_merc_positions_short",
         "swap_positions_long_all", "swap__positions_short_all", "nonrept_positions_long_all", "nonrept_positions_short_all"]
COT_K = ["oi", "mmL", "mmS", "mmSp", "pmL", "pmS", "swL", "swS", "nrL", "nrS"]
def cot(years):
    since = (datetime.date.today() - datetime.timedelta(days=365 * years + 14)).isoformat()
    out = []
    for code, mid, label, exch in COT:
        q = {"$select": "report_date_as_yyyy_mm_dd,market_and_exchange_names," + ",".join(COT_F), "$where": "cftc_contract_market_code='%s' AND report_date_as_yyyy_mm_dd >= '%sT00:00:00'" % (code, since),
             "$order": "report_date_as_yyyy_mm_dd ASC", "$limit": "5000"}
        rows = get("https://publicreporting.cftc.gov/resource/72hh-3qpy.json?" + urllib.parse.urlencode(q))
        pts, name = [], None
        for r in rows:
            vals = [num(r.get(f)) for f in COT_F]
            if vals[0] is None: continue
            pts.append([day(r.get("report_date_as_yyyy_mm_dd"))] + [None if v is None else int(round(v)) for v in vals]); name = r.get("market_and_exchange_names") or name
        if len(pts) < 20: raise RuntimeError("CFTC %s: solo %d semanas" % (code, len(pts)))
        out.append({"code": code, "id": mid, "label": label, "exchange": exch, "name": name, "points": pts})
        log("CFTC", code, mid, len(pts), "semanas, ultima", pts[-1][0])
    return {"schemaVersion": 1, "generatedAt": now(), "sourceId": "cftc", "dataset": "72hh-3qpy", "report": "Disaggregated Commitments of Traders, futures only",
            "unit": "contracts", "fields": COT_K, "markets": out}

# ---------------- AgTransport ----------------
AGT = "https://agtransport.usda.gov/resource/%s.json?"
def agt(ds, sel, since, order="date ASC"):
    rows, off = [], 0
    while True:
        q = {"$select": sel, "$where": "date >= '%sT00:00:00'" % since, "$order": order, "$limit": "5000", "$offset": str(off)}
        part = get(AGT % ds + urllib.parse.urlencode(q)); rows += part
        if len(part) < 5000: return rows
        off += 5000
def transport(years):
    since = (datetime.date.today() - datetime.timedelta(days=365 * years + 14)).isoformat()
    ind = agt("8uye-ieij", "date,truck,shuttle_train,barge,gulf_vessel,pacific_vessel", since)
    keys = ["truck", "shuttle_train", "barge", "gulf_vessel", "pacific_vessel"]
    indic = {"dataset": "8uye-ieij", "base": "2017 = 100", "fields": keys, "points": []}
    for r in ind:
        v = [num(r.get(k)) for k in keys]
        if any(x is not None for x in v): indic["points"].append([day(r.get("date"))] + v)
    if len(indic["points"]) < 20: raise RuntimeError("AgTransport 8uye-ieij: %d semanas" % len(indic["points"]))
    log("AgTransport indicadores", len(indic["points"]), "semanas, ultima", indic["points"][-1][0])
    def bylocation(ds, valcol, loccol):
        series = {}
        for r in agt(ds, "date,%s,%s" % (loccol, valcol), since):
            v, loc = num(r.get(valcol)), (r.get(loccol) or "").strip()
            if v is None or not loc: continue
            series.setdefault(loc, []).append([day(r.get("date")), v])
        return [{"location": k, "points": sorted([a, b] for a, b in dict(map(tuple, p)).items())} for k, p in sorted(series.items())]
    pct = bylocation("deqi-uken", "rate", "location")
    if not pct: raise RuntimeError("AgTransport deqi-uken vacio")
    log("AgTransport barcaza % tarifa", len(pct), "tramos")
    try:
        tons = bylocation("7spn-fbua", "price_per_ton", "river_system_location"); log("AgTransport barcaza USD/t", len(tons), "tramos")
    except Exception as e: tons = None; log("AgTransport 7spn-fbua FALLO", e)
    doc = {"schemaVersion": 1, "generatedAt": now(), "sourceId": "usda_ams_agtransport", "indicators": indic,
           "bargePctTariff": {"dataset": "deqi-uken", "unit": "percent of tariff", "series": pct}}
    if tons: doc["bargeUsdTon"] = {"dataset": "7spn-fbua", "unit": "USD/short ton", "series": tons}
    return doc

# ---------------- EIA ----------------
DIESEL_AREAS = ["NUS", "R10", "R1X", "R1Y", "R1Z", "R20", "R30", "R40", "R50", "R5XCA", "SCA", "SCO", "SFL", "SMA", "SMN", "SNY", "SOH", "STX", "SWA"]
STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()
PROP_AREAS = ["NUS", "R10", "R1X", "R1Y", "R1Z", "R20", "R30", "R40"] + ["S" + s for s in STATES]
def eia(route, series, since):
    rows, off = [], 0
    while True:
        q = [("frequency", "weekly"), ("data[0]", "value"), ("start", since), ("sort[0][column]", "period"), ("sort[0][direction]", "asc"), ("offset", str(off)), ("length", "5000"), ("api_key", EIA_KEY)]
        q += [("facets[series][]", s) for s in series]
        j = get("https://api.eia.gov/v2/%s/data/?" % route + urllib.parse.urlencode(q))
        part = (j.get("response") or {}).get("data") or []; rows += part
        if len(part) < 5000: return rows
        off += 5000; time.sleep(2)
def fuel(years):
    since = (datetime.date.today() - datetime.timedelta(days=365 * years + 14)).isoformat()
    out = {"schemaVersion": 1, "generatedAt": now(), "sourceId": "eia", "unit": "USD/gal", "diesel": {}, "propane": {"residential": {}, "wholesale": {}}}
    d = eia("petroleum/pri/gnd", ["EMD_EPD2D_PTE_%s_DPG" % a for a in DIESEL_AREAS], since)
    for r in d:
        v = num(r.get("value")); a = r.get("duoarea")
        if v is None or not a: continue
        s = out["diesel"].setdefault(a, {"name": r.get("area-name"), "series": r.get("series"), "points": []}); s["points"].append([day(r.get("period")), v])
    if "NUS" not in out["diesel"] or "R20" not in out["diesel"]: raise RuntimeError("EIA gasoleo sin EE. UU. o PADD 2")
    log("EIA gasoleo", len(out["diesel"]), "areas, ultima", out["diesel"]["NUS"]["points"][-1][0])
    time.sleep(2)
    for proc, k in (("PRS", "residential"), ("PWR", "wholesale")):
        try:
            p = eia("petroleum/pri/wfr", ["W_EPLLPA_%s_%s_DPG" % (proc, a) for a in PROP_AREAS], since)
            for r in p:
                v = num(r.get("value")); a = r.get("duoarea")
                if v is None or not a: continue
                s = out["propane"][k].setdefault(a, {"name": r.get("area-name"), "series": r.get("series"), "points": []}); s["points"].append([day(r.get("period")), v])
            log("EIA propano", k, len(out["propane"][k]), "areas")
        except Exception as e: log("EIA propano", k, "FALLO", e)
        time.sleep(2)
    for grp in [out["diesel"], out["propane"]["residential"], out["propane"]["wholesale"]]:  # la paginacion de la API puede repetir una fila en el corte: se deja una
        for s in grp.values():
            seen = {}
            for d0, v in s["points"]:
                if d0 in seen and seen[d0] != v: log("EIA", s["series"], d0, "dos valores distintos", seen[d0], v, "-> se queda el ultimo")
                seen[d0] = v
            s["points"] = sorted([k, v] for k, v in seen.items())
    return out

# ---------------- EIA etanol ----------------
ETH = [("prod_NUS", "W_EPOOXE_YOP_NUS_MBBLD", "kbd"), ("prod_R20", "W_EPOOXE_YOP_R20_MBBLD", "kbd"), ("stocks_NUS", "W_EPOOXE_SAE_NUS_MBBL", "kbbl"), ("stocks_R20", "W_EPOOXE_SAE_R20_MBBL", "kbbl")]
def ethanol(years):
    """Produccion de etanol de combustible (miles de barriles al dia) y existencias (miles de barriles), semanal, EE. UU. y Medio Oeste (PADD 2)."""
    since = (datetime.date.today() - datetime.timedelta(days=365 * years + 14)).isoformat()
    rows = eia("petroleum/sum/sndw", [s for _, s, _ in ETH], since)
    by = {s: k for k, s, _ in ETH}; un = {k: u for k, _, u in ETH}; out = {}
    for r in rows:
        k = by.get(r.get("series")); v = num(r.get("value"))
        if not k or v is None: continue
        out.setdefault(k, {"series": r.get("series"), "name": r.get("series-description"), "unit": un[k], "points": {}})["points"][day(r.get("period"))] = v
    if "prod_NUS" not in out: raise RuntimeError("EIA etanol sin la produccion de EE. UU.")
    for s in out.values(): s["points"] = sorted([d0, v] for d0, v in s["points"].items())
    log("EIA etanol", sorted(out), "ultima", out["prod_NUS"]["points"][-1][0])
    return {"schemaVersion": 1, "generatedAt": now(), "sourceId": "eia", "series": out}

# ---------------- USDA AMS: precios de referencia de la Notificacion Obligatoria de Precios (LMR) ----------------
DM = "https://mpr.datamart.ams.usda.gov/services/v1.1/reports/"
def mmdd(d): return d.strftime("%m/%d/%Y")
def iso(s):
    try: return datetime.datetime.strptime(str(s).strip(), "%m/%d/%Y").strftime("%Y-%m-%d")
    except Exception: return None
def dm(rid, sec, since, until, step=100):
    """Filas de una seccion de un informe del datamart de AMS (publico, sin clave) entre dos fechas, en tramos para no topar con limites."""
    rows = []; a = since
    while a <= until:
        b = min(a + datetime.timedelta(days=step - 1), until)
        url = "%s%s/%s?q=report_date=%s:%s" % (DM, rid, urllib.parse.quote(sec), mmdd(a), mmdd(b))
        try: rows += get(url).get("results") or []
        except RuntimeError as e: log("datamart", rid, sec, mmdd(a), "->", e)
        a = b + datetime.timedelta(days=1)
    return rows
def slug(s): return "".join(c if c.isalnum() else "_" for c in str(s).lower()).strip("_")
def lmr(years):
    today = datetime.date.today(); since = today - datetime.timedelta(days=365 * min(years, 2) + 10); out = {}
    # carne de vacuno en caja: indice de corte Choice y Select, LM_XB403 (negociado, tarde); USD por 100 lb
    cut = {iso(r["report_date"]): r for r in dm("2453", "Current Cutout Values", since, today)}
    vol = {iso(r["report_date"]): r for r in dm("2453", "Current Volume", since, today)}
    beef = []
    for d in sorted(k for k in cut if k):
        r = cut[d]; c, s_ = num(r.get("choice_600_900_current")), num(r.get("select_600_900_current"))
        if c is None and s_ is None: continue
        v = vol.get(d, {}); beef.append([d, c, s_, num(v.get("choice_volume_loads")), num(v.get("select_volume_loads"))])
    out["beef"] = {"report": "LM_XB403", "id": "2453", "title": "National Daily Boxed Beef Cutout & Boxed Beef Cuts - Negotiated Sales - PM", "unit": "USD/cwt",
                   "columns": ["date", "choice", "select", "choiceLoads", "selectLoads"], "rows": beef}
    # porcino: indice de canal y piezas, LM_PK602 (FOB planta, tarde); USD por 100 lb
    pk = []
    for r in sorted(dm("2498", "Cutout and Primal Values", since, today), key=lambda r: iso(r["report_date"]) or ""):
        d = iso(r["report_date"]); f = [num(r.get(k)) for k in ("pork_carcass", "pork_loin", "pork_butt", "pork_picnic", "pork_rib", "pork_ham", "pork_belly", "total_loads_date_1")]
        if d and f[0] is not None: pk.append([d] + f)
    out["pork"] = {"report": "LM_PK602", "id": "2498", "title": "National Daily Pork FOB Plant - Negotiated Sales - Afternoon", "unit": "USD/cwt",
                   "columns": ["date", "cutout", "loin", "butt", "picnic", "rib", "ham", "belly", "loads"], "rows": pk}
    # porcino vivo: precio base de la canal de los cerdos sacrificados el dia anterior, LM_HG201; USD por 100 lb de canal
    hs = {iso(r["report_date"]): r for r in dm("2511", "Summary", since, today)}; hg = []
    for r in sorted(dm("2511", "Carcass Measurements", since, today), key=lambda r: iso(r["report_date"]) or ""):
        d = iso(r["report_date"]); base = num(r.get("wtd_avg_base"))
        if d and base is not None: hg.append([d, base, num(r.get("wtd_avg_net_price")), num(r.get("avg_carcass_weight")), num((hs.get(d) or {}).get("barrows_head_count"))])
    out["hogs"] = {"report": "LM_HG201", "id": "2511", "title": "National Daily Direct Prior Day Slaughtered Swine", "unit": "USD/cwt carcass",
                   "columns": ["date", "base", "net", "carcassWeight", "barrowsGilts"], "rows": hg}
    # vacuno de sacrificio: media ponderada de las 5 zonas (negociado), LM_CT100; dolares por 100 lb (vivo o en canal)
    ser = {}; seen = set()
    for r in dm("2466", "Detail", today - datetime.timedelta(days=365 * min(years, 2) + 10), today, 30):
        d = iso(r.get("report_date")); g = str(r.get("grade_description") or "")
        if not d or "total all" not in g.lower(): continue
        p = num(r.get("weighted_avg_price")); k = slug(r.get("class_description")) + "|" + slug(r.get("selling_basis_description")); seen.add(k)
        if p is None: continue
        ser.setdefault(k, {})[d] = [p, num(r.get("head_count")), num(r.get("weight_range_avg"))]
    log("vacuno 5 zonas, series:", sorted(seen))
    out["cattle"] = {"report": "LM_CT100", "id": "2466", "title": "5 Area Daily Weighted Average Direct Slaughter Cattle - Negotiated", "unit": "USD/cwt",
                     "columns": ["date", "price", "head", "avgWeight"], "series": {k: [[d] + v for d, v in sorted(x.items())] for k, x in ser.items()}}
    for k, v in out.items(): log("LMR", k, len(v.get("rows") or v.get("series") or []), "ultimo", (v["rows"][-1][0] if v.get("rows") else {a: b[-1][0] for a, b in v["series"].items()}))
    if not (beef and pk and hg and ser): raise RuntimeError("LMR incompleto: vacuno en caja %d, pork %d, hogs %d, cattle %d" % (len(beef), len(pk), len(hg), len(ser)))
    return {"schemaVersion": 1, "generatedAt": now(), "sourceId": "usda_ams_lmr", "reports": out}

# ---------------- USDA AMS / FGIS: inspecciones de exportacion de grano ----------------
FGIS = "https://fgisonline.ams.usda.gov/ExportGrainReport/CY%d.csv"
GRAINS = ["CORN", "SOYBEANS", "WHEAT", "SORGHUM"]
def inspections(years):
    import csv, io
    this = datetime.date.today().year; wk = {g: {} for g in GRAINS}; dest = {g: {} for g in GRAINS}
    for y in (this - 1, this):
        raw = None
        for i in range(3):
            try:
                req = urllib.request.Request(FGIS % y, headers={"User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)"})
                with urllib.request.urlopen(req, timeout=240) as r: raw = r.read()
                break
            except Exception as e: log("FGIS", y, repr(e)[:120]); time.sleep(5 * (i + 1))
        if raw is None:
            if y == this: raise RuntimeError("FGIS CY%d no disponible" % y)
            continue
        rd = csv.reader(io.StringIO(raw.decode("cp1252", "replace"))); head = [h.strip() for h in next(rd)]
        ix = {h: i for i, h in enumerate(head)}
        for need in ("Thursday", "Grain", "Metric Ton", "Destination"):
            if need not in ix: raise RuntimeError("FGIS: falta la columna " + need)
        n = 0
        for row in rd:
            if len(row) <= ix["Metric Ton"]: continue
            g = row[ix["Grain"]].strip().upper()
            if g not in wk: continue
            t = num(row[ix["Metric Ton"]]); d = row[ix["Thursday"]].strip()
            if t is None or len(d) != 8: continue
            d = "%s-%s-%s" % (d[:4], d[4:6], d[6:]); wk[g][d] = wk[g].get(d, 0) + t; n += 1
            dest[g].setdefault(d, {}); k = row[ix["Destination"]].strip().title(); dest[g][d][k] = dest[g][d].get(k, 0) + t
        log("FGIS", y, len(raw), "bytes,", n, "filas de", GRAINS)
    out = {}; top = {}
    for g in GRAINS:
        pts = sorted([d, round(v)] for d, v in wk[g].items())
        if pts: out[g] = pts
        last = sorted(dest[g])[-4:]; c = {}
        for d in last:
            for k, v in dest[g][d].items(): c[k] = c.get(k, 0) + v
        if c: top[g] = {"weeks": last, "countries": [[k, round(v)] for k, v in sorted(c.items(), key=lambda kv: -kv[1])[:8]]}
    if not out.get("CORN") or not out.get("SOYBEANS"): raise RuntimeError("FGIS sin maiz o soja")
    log("FGIS ultima semana maiz", out["CORN"][-1], "soja", out["SOYBEANS"][-1])
    return {"schemaVersion": 1, "generatedAt": now(), "sourceId": "usda_ams_fgis", "unit": "metric tons inspected for export, by week ending Thursday", "series": out, "destinations": top}

def main():
    a = sys.argv[1:]; outdir = Path(a[a.index("--outdir") + 1]) if "--outdir" in a else ROOT / "data" / "us-markets"
    years = int(a[a.index("--years") + 1]) if "--years" in a else 5
    outdir.mkdir(parents=True, exist_ok=True); ok = 0
    for name, fn in (("cot", cot), ("transport", transport), ("fuel", fuel), ("ethanol", ethanol), ("lmr", lmr), ("inspections", inspections)):
        try:
            doc = fn(years); (outdir / (name + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); ok += 1; log("OK", name)
        except Exception as e: log("FALLO", name, e, "(se conserva el fichero anterior)")
    (outdir / "log.txt").write_text(now() + "\n" + "\n".join(LOG[-300:]) + "\n", encoding="utf-8")
    return 0 if ok else 1
if __name__ == "__main__": sys.exit(main())

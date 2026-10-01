"""US Local Cash Bids: normalizacion, fusion y generacion de shards a partir de informes USDA AMS MARS (MyMarketNews).
Sin red, sin claves y sin efectos secundarios: lo usan scripts/update-us-cash-bids.py (CI) y scripts/test-us-cash-bids.py (tests con fixtures).
Reglas: null antes que inventar; nunca se mezclan clases/grados/puntos de entrega/ubicaciones en una misma serie; nunca se calcula un basis."""
import datetime, hashlib, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "scripts" / "us-cash-bids-registry.json"
OUT = ROOT / "data" / "us-cash-bids"
SOURCE_ID = "usda_ams_mars"
MAX_GAP_DAYS = {"daily": 7, "weekly": 14}  # el cambio solo se calcula entre observaciones consecutivas razonablemente proximas (si no, null)
HIST_WINDOW = 130  # puntos por serie en el shard "corriente" (el historico completo va aparte)
PEER_MIN = 3  # pares minimos para hablar de movimiento del grupo
PEER_OUTLIER_PTS = 5.0  # puntos porcentuales respecto a la mediana de sus pares
LOCATION_TYPES = ("ELEVATOR", "TERMINAL", "CITY", "REGION", "STATE", "EXPORT_MARKET", "UNKNOWN")

IDENTITY_FIELDS = {"commodity", "class", "grade", "protein", "deliverypoint", "tradeloc", "deliverystart", "deliveryend", "desc", "application", "freight", "saletype", "transmode"}
def norm(k): return re.sub(r"[^a-z0-9]", "", str(k).lower())
def load_registry(path=None): return json.loads(Path(path or REGISTRY).read_text(encoding="utf-8"))

# ---------- lectura tolerante de filas MARS ----------
def _n(v):
    if v is None or v == "": return None
    try:
        x = float(str(v).replace("$", "").replace(",", "").strip())
    except ValueError: return None
    return x if x == x and abs(x) != float("inf") else None
def _s(v):
    if v is None: return None
    s = str(v).strip()
    return None if s in ("", "N/A", "None", "null") else s
def _date(v):
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", str(v or ""))
    if m: return "%s-%02d-%02d" % (m.group(3), int(m.group(1)), int(m.group(2)))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", str(v or ""))
    return m.group(0) if m else None
def _ts(v):
    """Fecha de publicacion con hora si la trae (las correcciones del mismo dia solo se distinguen por la hora)."""
    d = _date(v)
    if not d: return None
    m = re.search(r"[ T](\d{1,2}):(\d{2})", str(v))
    return "%sT%02d:%s" % (d, int(m.group(1)), m.group(2)) if m else d
AVG = {"avgprice", "priceavg", "averageprice", "wtdavgprice", "weightedavgprice", "price", "weeklyav"}
LO = {"pricemin", "pricelow", "lowprice", "minprice", "pricelo"}
HI = {"pricemax", "pricehigh", "highprice", "maxprice"}
BLO = {"basismin", "basislow", "basislo"}
BHI = {"basismax", "basishigh", "basishi"}
BAVG = {"basisavg", "basisaverage", "avgbasis", "basis"}
FUT = {"futuresmonth", "futuremonth", "futurescontract", "futuresmth"}
FUT_MIN, FUT_MAX = "basisminfuturesmonth", "basismaxfuturesmonth"  # nombres reales del API (basis Min/Max Futures Month)
FIELDS = {"commodity": {"commodity", "commod"}, "cls": {"class"}, "grade": {"grade"}, "protein": {"protein"}, "dpoint": {"deliverypoint"},
          "loc": {"tradeloc", "tradelocation", "marketlocation"}, "freight": {"freight"}, "sale": {"saletype"}, "dstart": {"deliverystart"}, "dend": {"deliveryend"},
          "unit": {"priceunit"}, "bunit": {"basisunit"}, "trans": {"transmode"}, "app": {"application"}, "desc": {"desc"}, "end": {"reportenddate"}, "begin": {"reportbegindate"}, "rdate": {"reportdate"},
          "pub": {"publisheddate"}, "period": {"period"}, "final": {"finalind", "reportstatus", "revision"}}

def _index(row):
    d = {}
    for k, v in row.items(): d.setdefault(norm(k), v)
    return d
def sections(doc):
    """MARS devuelve una lista [{reportSection, results:[...]}] (o un unico objeto). -> (header_row, detail_rows)."""
    secs = doc if isinstance(doc, list) else [doc]
    head, det = None, []
    for s in secs:
        if not isinstance(s, dict): continue
        name = str(s.get("reportSection") or "")
        res = [r for r in (s.get("results") or []) if isinstance(r, dict)]
        if name == "Report Header": head = res[0] if res else head
        elif name == "Report Detail" or not name: det += res
    return head, det
def fields_seen(rows):
    """Nombres de campo vistos (solo nombres, nunca valores): se registran para confirmar el formato real tras la primera ejecucion en CI."""
    s = set()
    for r in rows: s.update(r.keys())
    return sorted(s)

def commodity_of(raw, reg):
    k = str(raw or "").strip().lower()
    for slug, c in reg["commodities"].items():
        if k in c["raw"]: return slug, c["name"], True
    slug = re.sub(r"[^a-z0-9]+", "-", k).strip("-")
    return (slug or "unknown"), (str(raw or "").strip() or "Unknown"), False

def unit_of(raw):
    """'$ Per Bushel' -> (USD, bu). Cualquier otra cosa se conserva tal cual: no se convierte ninguna unidad."""
    u = _s(raw)
    if not u: return None, None
    m = re.match(r"^\$\s*per\s+(.+)$", u, re.I)
    if not m: return None, u
    w = m.group(1).strip().lower()
    return "USD", {"bushel": "bu", "cwt": "cwt", "hundredweight": "cwt", "ton": "ton", "pound": "lb", "bu": "bu"}.get(w, w)

def location_of(f, rcfg, reg):
    """-> (locationName, locationType, deliveryPoint). Ver registry.locationTypeDoc: tipo = geografia representada."""
    loc, dp = _s(f.get("loc")), _s(f.get("dpoint"))
    ov = (rcfg.get("locationOverrides") or {}).get(loc or "")
    if ov: return loc, ov, dp
    t = reg["deliveryPointTypes"].get((dp or "").lower())
    if loc and t is None: t = "REGION"
    if loc and t == "REGION": return loc, "REGION", dp
    if loc and t in ("TERMINAL", "EXPORT_MARKET"): return loc, t, dp
    if not loc and t in ("TERMINAL", "EXPORT_MARKET") and not rcfg.get("defaultLocationName"): return dp, t, dp
    name = rcfg.get("defaultLocationName") or loc or (reg["states"].get(rcfg.get("state")) if rcfg.get("scope") == "STATE_REPORT" else None)
    typ = rcfg.get("defaultLocationType") or ("STATE" if rcfg.get("scope") == "STATE_REPORT" else "UNKNOWN")
    if t in ("TERMINAL", "EXPORT_MARKET") and not loc: typ = t
    return name, typ, dp

def _plausible(avg, lo, hi, unit):
    xs = [x for x in (avg, lo, hi) if x is not None]
    if not xs or any(x <= 0 for x in xs): return False
    if unit == "bu" and any(x > 100 for x in xs): return False
    if lo is not None and hi is not None and lo > hi: return False
    return True

def normalize_rows(rows, rcfg, reg, ingested_at):
    """Filas crudas de 'Report Detail' -> (observaciones, rechazos {motivo: n}). Una observacion = una serie en una fecha; si la misma
    serie/fecha llega varias veces manda la publicacion mas reciente, y si dos filas de la MISMA publicacion discrepan se descarta el punto (no se adivina)."""
    obs, rej = {}, {}
    def bad(why): rej[why] = rej.get(why, 0) + 1
    for row in rows:
        r = _index(row); f = {}
        for k, names in FIELDS.items():
            for nm in names:
                if nm in r: f[k] = r[nm]; break
        if f.get("period") and not re.match(r"^current$", str(f["period"]), re.I): bad("not_current_period"); continue
        avg = lo = hi = blo = bhi = bavg = None
        for k, v in r.items():
            if k in AVG and avg is None: avg = _n(v)
            elif k in LO and lo is None: lo = _n(v)
            elif k in HI and hi is None: hi = _n(v)
            elif k in BLO and blo is None: blo = _n(v)
            elif k in BHI and bhi is None: bhi = _n(v)
            elif k in BAVG and bavg is None: bavg = _n(v)
        fut = next((_s(r[k]) for k in FUT if k in r and _s(r[k])), None)
        if not fut:
            fa, fb = _s(r.get(FUT_MIN)), _s(r.get(FUT_MAX))
            fut = fa if fa and (not fb or fa == fb) else (fb if fb and not fa else ("%s / %s" % (fa, fb) if fa and fb else None))
        cur, unit = unit_of(f.get("unit"))
        if avg is None and lo is None and hi is None: bad("no_price"); continue
        if not unit: bad("no_unit"); continue
        if not _plausible(avg, lo, hi, unit): bad("implausible_price"); continue
        day = _date(f.get("end")) or _date(f.get("rdate")) or _date(f.get("begin"))
        if not day: bad("no_date"); continue
        com, comname, known = commodity_of(f.get("commodity"), reg)
        if not _s(f.get("commodity")): bad("no_commodity"); continue
        name, ltype, dp = location_of(f, rcfg, reg)
        dper = None
        ds, de = _date(f.get("dstart")) or _s(f.get("dstart")), _date(f.get("dend")) or _s(f.get("dend"))
        if ds or de: dper = "%s/%s" % (ds or "", de or "")
        sale = _s(f.get("sale")); split = rcfg.get("splitBy") or []
        if sale and "saleType" not in split and not re.search(r"bid", sale, re.I): bad("non_bid_sale_type"); continue
        spec = {"commodity": com, "class": _s(f.get("cls")), "grade": _s(f.get("grade")), "protein": _s(f.get("protein")), "deliveryPoint": dp,
                "location": name, "deliveryPeriod": dper, "unit": unit, "description": _s(f.get("desc")), "application": _s(f.get("app"))}
        extra = {"freight": _s(f.get("freight")), "saleType": sale, "transMode": _s(f.get("trans"))}
        key = "|".join([str(spec[k] or "").lower() for k in ("commodity", "class", "grade", "protein", "deliveryPoint", "location", "deliveryPeriod", "unit", "description", "application")] + [str(extra[k] or "").lower() for k in split])
        sid = "us-cb:%d:%s" % (rcfg["reportId"], hashlib.sha1(key.encode()).hexdigest()[:10])
        basis = None
        if bavg is not None: basis = bavg
        elif blo is not None and blo == bhi: basis = blo
        o = {"seriesId": sid, "reportId": rcfg["reportId"], "state": rcfg.get("state"), "commodity": com, "commodityName": comname, "commodityKnown": known,
             "commodityClass": spec["class"], "grade": spec["grade"], "protein": spec["protein"], "deliveryPoint": dp, "locationName": name, "locationType": ltype,
             "freight": extra["freight"], "saleType": sale, "transMode": extra["transMode"], "description": spec["description"], "application": spec["application"], "deliveryPeriod": dper, "currency": cur, "unit": unit,
             "observationDate": day, "publicationDate": _ts(f.get("pub")), "priceAverage": avg, "priceLow": lo, "priceHigh": hi,
             "basis": basis, "basisUnit": _s(f.get("bunit")), "basisLow": blo, "basisHigh": bhi, "futuresContract": fut, "ingestedAt": ingested_at}
        k2 = (sid, day); cur_o = obs.get(k2)
        if cur_o is None: obs[k2] = [o]; continue
        cur_o.append(o)
    out = []
    for (sid, day), lst in obs.items():
        latest = max(x["publicationDate"] or "" for x in lst)
        c = [x for x in lst if (x["publicationDate"] or "") == latest]
        sig = {(x["priceAverage"], x["priceLow"], x["priceHigh"], x["basis"], x["basisLow"], x["basisHigh"]) for x in c}
        if len(sig) != 1: bad("ambiguous_same_publication"); continue
        if len(lst) > len(c) or len(c) > 1: rej["duplicate_collapsed"] = rej.get("duplicate_collapsed", 0) + (len(lst) - 1)
        out.append(c[0])
    return out, rej

# ---------- almacen por estado/producto ----------
META = ("reportId", "state", "commodity", "commodityName", "commodityClass", "grade", "protein", "deliveryPoint", "locationName", "locationType", "freight", "saleType", "transMode", "description", "application", "deliveryPeriod", "currency", "unit")
def empty_store(state, commodity): return {"schemaVersion": 1, "state": state, "commodity": commodity, "series": {}}
def _pt(o): return [o["observationDate"], o["priceAverage"], o["priceLow"], o["priceHigh"], o["basisLow"] if o["basisLow"] is not None else o["basis"], o["basisHigh"] if o["basisHigh"] is not None else o["basis"], o["publicationDate"]]
def merge(store, observations, detected_at):
    """Fusiona observaciones en el almacen. -> dict(added, same, revised, reconciled, stale_ignored, revisions[]). Revision = el mismo punto publicado de nuevo
    (fecha de publicacion posterior, ambas conocidas) con otro valor; un punto de arranque sin fecha de publicacion se reconcilia sin llamarlo revision."""
    st = {"added": 0, "same": 0, "revised": 0, "reconciled": 0, "stale_ignored": 0, "revisions": []}
    for o in observations:
        s = store["series"].get(o["seriesId"])
        if s is None:
            s = {k: o[k] for k in META}; s["pts"] = []; store["series"][o["seriesId"]] = s
        if o.get("futuresContract"): s["futuresContract"] = o["futuresContract"]
        if o.get("basisUnit"): s["basisUnit"] = o["basisUnit"]
        pts = s["pts"]; new = _pt(o)
        lo_i = next((i for i, p in enumerate(pts) if p[0] == new[0]), None)
        if lo_i is None:
            pts.append(new); st["added"] += 1; continue
        old = pts[lo_i]
        if old[1:6] == new[1:6] and (old[6] == new[6] or new[6] is None): st["same"] += 1; continue
        if old[6] is None or new[6] is None:
            if new[6] is None and old[6] is not None: st["stale_ignored"] += 1; continue
            pts[lo_i] = new; st["reconciled"] += 1; continue
        if new[6] > old[6]:
            pts[lo_i] = new; st["revised"] += 1
            st["revisions"].append({"seriesId": o["seriesId"], "reportId": o["reportId"], "state": o["state"], "commodity": o["commodity"], "locationName": o["locationName"], "deliveryPoint": o["deliveryPoint"],
                                    "commodityClass": o["commodityClass"], "grade": o["grade"], "unit": o["unit"], "observationDate": new[0],
                                    "oldValue": old[1] if old[1] is not None else old[2], "newValue": new[1] if new[1] is not None else new[2],
                                    "oldPublicationDate": old[6], "newPublicationDate": new[6], "detectedAt": detected_at})
        elif new[6] < old[6]: st["stale_ignored"] += 1
        else: st["same"] += 1  # misma publicacion con otros valores: se conserva el punto existente (no se adivina)
    for s in store["series"].values(): s["pts"].sort(key=lambda p: p[0])
    return st

def headline(p):
    """Valor principal de un punto: promedio publicado; si no hay, el precio exacto (min == max); si es un rango sin promedio, None (no se calcula un punto medio)."""
    if p[1] is not None: return p[1]
    if p[2] is not None and p[2] == p[3]: return p[2]
    return None

def kind_of(p):
    if p[1] is not None: return "AVERAGE"
    if p[2] is not None and p[2] == p[3]: return "EXACT"
    return "RANGE" if p[2] is not None or p[3] is not None else "NONE"

def freshness(day, freq, now_day=None, fr=None):
    import freshness as F  # scripts/freshness.py
    r = F.evaluate(day, freq, SOURCE_ID, F.today_ord() if now_day is None else now_day)
    return r["state"]

def shard_of(store, freq_of, now_day=None, generated_at=None):
    """Shard corriente: metadatos + ultima observacion + anterior + ultimos HIST_WINDOW puntos [fecha, avg, min, max, basisMin, basisMax]."""
    series = []
    for sid, s in sorted(store["series"].items(), key=lambda kv: (kv[1]["locationName"] or "", kv[1]["deliveryPoint"] or "", kv[1]["commodityClass"] or "", kv[1]["grade"] or "", kv[0])):
        pts = s["pts"]
        if not pts: continue
        last = pts[-1]; prev = pts[-2] if len(pts) > 1 else None
        freq = freq_of(s["reportId"])
        hl, hp = headline(last), (headline(prev) if prev else None)
        if prev and (datetime.date.fromisoformat(last[0]) - datetime.date.fromisoformat(prev[0])).days > MAX_GAP_DAYS.get(freq, 7): hp = None
        e = {"id": sid, **{k: s[k] for k in META}, "futuresContract": s.get("futuresContract"), "basisUnit": s.get("basisUnit"), "frequency": freq,
             "priceKind": kind_of(last), "date": last[0], "pub": last[6], "avg": last[1], "lo": last[2], "hi": last[3], "bLo": last[4], "bHi": last[5],
             "prevDate": prev[0] if prev else None, "prevAvg": hp, "changePct": round((hl / hp - 1) * 100, 2) if hl is not None and hp else None,
             "freshness": freshness(last[0], freq, now_day), "n": len(pts), "first": pts[0][0], "pts": [p[:6] for p in pts[-HIST_WINDOW:]]}
        series.append(e)
    # Contexto de pares: un movimiento compartido por todo el grupo es mercado; uno que se aparta mucho de sus pares puede ser un cambio de definicion
    groups = {}
    for e in series:
        if e["changePct"] is not None: groups.setdefault((e["commodityClass"], e["grade"], e["deliveryPoint"], e["unit"], e["date"]), []).append(e)
    for e in series:
        e["peerMedianPct"] = None; e["changeFlag"] = None
        g = groups.get((e["commodityClass"], e["grade"], e["deliveryPoint"], e["unit"], e["date"])) if e["changePct"] is not None else None
        if g and len(g) >= PEER_MIN:
            vals = sorted(x["changePct"] for x in g); n = len(vals); med = vals[n // 2] if n % 2 else (vals[n // 2 - 1] + vals[n // 2]) / 2
            e["peerMedianPct"] = round(med, 2)
            if abs(e["changePct"] - med) >= PEER_OUTLIER_PTS: e["changeFlag"] = "PEER_OUTLIER"
    return {"schemaVersion": 1, "generatedAt": generated_at, "state": store["state"], "commodity": store["commodity"], "sourceId": SOURCE_ID, "series": series}

def history_of(store, generated_at=None):
    """Historico completo = el propio almacen (metadatos + todos los puntos [fecha, avg, min, max, basisMin, basisMax, publicacion]); la web lo carga solo para 1a/3a/max.
    La fecha de publicacion se conserva porque es lo que permite detectar correcciones en la siguiente ejecucion."""
    return {"schemaVersion": 1, "generatedAt": generated_at, "state": store["state"], "commodity": store["commodity"], "sourceId": SOURCE_ID,
            "series": {sid: store["series"][sid] for sid in sorted(store["series"])}}

# ---------- Daily Brief ----------
def brief_section(now, since_iso, out=None, max_groups=12):
    """Seccion 'US cash markets' del Daily Brief. Una linea por (estado, producto, clase, grado, tipo de comprador): numero de mercados actualizados y su
    rango de cambios (min..max) mas el mercado que mas se mueve. NUNCA un unico cambio combinado de mercados distintos."""
    out = Path(out or OUT); man = json.loads((out / "manifest.json").read_text(encoding="utf-8")) if (out / "manifest.json").exists() else None
    if not man or not man.get("latestObservation"): return {"asOf": None, "run": (man or {}).get("run", {}).get("status"), "marketsUpdated": 0, "groups": [], "revisions": [], "newBids": []}
    last = man["latestObservation"]; age = (now.date() - datetime.date.fromisoformat(last)).days
    groups, upd, new_bids = {}, 0, []
    for st, e in man["states"].items():
        for com, c in e["commodities"].items():
            for s in json.loads((out / c["shard"]).read_text(encoding="utf-8"))["series"]:
                if s["date"] != last or age > 4: continue
                upd += 1
                if s["n"] == 1 or s["prevDate"] is None: new_bids.append({"state": st, "stateName": e["name"], "commodity": com, "market": s["locationName"], "deliveryPoint": s["deliveryPoint"], "commodityClass": s["commodityClass"], "grade": s["grade"], "date": s["date"]}); continue
                if s["changePct"] is None: continue
                k = (st, com, s["commodityClass"], s["grade"], s["deliveryPoint"], s["unit"])
                g = groups.setdefault(k, {"state": st, "stateName": e["name"], "commodity": com, "commodityName": c and man["commodities"][com]["name"], "commodityClass": s["commodityClass"], "grade": s["grade"], "deliveryPoint": s["deliveryPoint"], "unit": s["unit"], "date": last, "markets": 0, "min": None, "max": None, "lead": None})
                g["markets"] += 1; g["min"] = s["changePct"] if g["min"] is None else min(g["min"], s["changePct"]); g["max"] = s["changePct"] if g["max"] is None else max(g["max"], s["changePct"])
                if g["lead"] is None or abs(s["changePct"]) > abs(g["lead"]["pct"]): g["lead"] = {"market": s["locationName"], "locationType": s["locationType"], "pct": s["changePct"], "value": s["avg"] if s["avg"] is not None else s["lo"]}
    lst = sorted(groups.values(), key=lambda g: -max(abs(g["min"]), abs(g["max"])))[:max_groups]
    revs = [r for r in (json.loads((out / "revisions.json").read_text(encoding="utf-8")).get("revisions", []) if (out / "revisions.json").exists() else []) if (r.get("detectedAt") or "") >= since_iso]
    return {"asOf": last, "run": man["run"]["status"], "marketsUpdated": upd, "groups": lst, "revisions": revs[:20], "newBids": new_bids[:20]}

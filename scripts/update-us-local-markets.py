#!/usr/bin/env python3
"""EE. UU. precios locales de GANADO y HENO: informes de USDA AMS (MyMarketNews / MARS) -> data/us-local/{cattle,hay}-<ESTADO>.json + status.json
Fuente: resumenes semanales de subastas de ganado por estado y 'Direct Hay Report' por estado (registro en scripts/us-local-registry.json).
La clave (secret USDA_MMN_API_KEY; se acepta MARS_API_KEY, la misma API) solo se lee del entorno: nunca se escribe en ficheros ni en logs.
Seguridad: un fallo de la API NUNCA borra datos; el informe que falla conserva su ultimo fichero valido y queda marcado en status.json.
Sin clave: no se llama a la API ni se inventa nada; solo se anota NO_KEY.
Nada se estima: cada precio es el que publica el USDA (minimo, maximo y media ponderada por cabezas/cantidad del propio informe). Solo se agregan filas
del mismo informe, fecha y especificacion (media ponderada por cabezas del promedio publicado en cada fila).
Uso: update-us-local-markets.py [--window-days 21] [--backfill-days N] [--only ID,ID] [--fixture-dir DIR] [--out DIR] [--now YYYY-MM-DD]
  --fixture-dir  lee <id>.json de un directorio en vez de llamar a la API (tests; nunca toca la red)"""
import argparse, base64, datetime, json, os, re, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
RETAIN_DAYS = 420          # historial que se conserva (13 meses + margen: permite comparar con el mismo mes del ano anterior)
FIRST_LOAD_DAYS = 420      # primera carga de un informe
CHUNK_DAYS = 100           # la API se pide por tramos para no pedir ventanas enormes
HAY_KEY_TTL = 120          # una serie de heno sin datos desde hace tantos dias deja de arrastrarse
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def dump(doc): return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
def read_json(p, default=None):
    try: return json.loads(Path(p).read_text(encoding="utf-8"))
    except Exception: return default
def write_if_changed(path, doc, volatile=("generatedAt",)):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        old = read_json(path)
        if isinstance(old, dict) and {k: v for k, v in old.items() if k not in volatile} == {k: v for k, v in doc.items() if k not in volatile}: return False
    path.write_text(dump(doc), encoding="utf-8"); return True

class ApiError(Exception):
    def __init__(self, kind, msg=""): super().__init__(kind + (": " + msg if msg else "")); self.kind = kind
def api_get(url, key, timeout=120, tries=3):
    tok = base64.b64encode((key + ":").encode()).decode(); last = ""
    for i in range(tries):
        req = urllib.request.Request(url, headers={"Authorization": "Basic " + tok, "Accept": "application/json", "User-Agent": "dehesaindex-local-markets/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (401, 403): raise ApiError("AUTH_FAILURE", "HTTP %d" % e.code)
            if e.code == 404: raise ApiError("UNAVAILABLE", "HTTP 404")
            last = "HTTP %d" % e.code
        except Exception as e: last = type(e).__name__
        time.sleep(2 * (i + 1))
    raise ApiError("ERROR", last)

def mdy(d): return d.strftime("%m/%d/%Y")
def iso(s):
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", (s or "").strip())
    return "%s-%s-%s" % (m.group(3), m.group(1), m.group(2)) if m else None
def num(x):
    if x is None or isinstance(x, bool): return None
    try: v = float(str(x).replace(",", "").strip())
    except ValueError: return None
    return v if v == v and abs(v) != float("inf") else None
def pos(x):
    """El USDA publica 0 cuando una media ponderada no aplica (p. ej. precios de oferta): 0 significa 'sin dato', no un precio."""
    v = num(x)
    return v if v is not None and v > 0 else None
def clean(v):
    if v is None: return None
    return int(v) if v == int(v) else round(v, 3)
def txt(x):
    s = ("" if x is None else str(x)).strip()
    return "" if s in ("None", "N/A", "null") else s

def rows_of(doc):
    """Todas las filas de datos de las secciones de un informe (los de ganado vienen en una seccion sin nombre, los de heno en 'Report Details')."""
    secs = doc if isinstance(doc, list) else [doc]; out = []
    for s in secs:
        name = s.get("reportSection") if isinstance(s, dict) else None
        if name in ("Report Header", "Report Receipts", "Report Summary"): continue
        out += [r for r in (s.get("results") or []) if isinstance(r, dict)]
    return out

def fetch_window(rid, reg, key, fixture_dir, d0, d1):
    if fixture_dir:
        p = Path(fixture_dir) / ("%d.json" % rid)
        if not p.exists(): raise ApiError("UNAVAILABLE", "fixture ausente")
        d = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(d, dict) and d.get("_fixtureError"): raise ApiError(d["_fixtureError"], "fixture")
        return d
    return api_get("%s%d?q=report_begin_date=%s:%s&allSections=true" % (reg["apiBase"], rid, mdy(d0), mdy(d1)), key)

# ---------------- ganado ----------------
CATTLE_COLS = ["commodity", "class", "frame", "grade", "lot", "unit", "wbLow", "wbHigh", "head", "wt", "pMin", "pMax", "p", "x"]
HEADLINE = {"commodity": "Feeder Cattle", "frame": "Medium and Large", "grade": "1", "lot": "", "unit": "Per Cwt", "classes": ("Steers", "Heifers", "Bulls")}
def cattle_rows(raw, stats):
    out = []
    for r in raw:
        d = iso(r.get("report_date")); com = txt(r.get("commodity")); cl = txt(r.get("class"))
        head, p, pmn, pmx = num(r.get("head_count")), num(r.get("avg_price")), num(r.get("avg_price_min")), num(r.get("avg_price_max"))
        if not d or not com or not cl: stats["skipped"] += 1; continue
        if head is None or head <= 0 or p is None or p <= 0: stats["skipped"] += 1; continue
        if pmn is None: pmn = p
        if pmx is None: pmx = p
        if not (pmn - 0.01 <= p <= pmx + 0.01 and pmn <= pmx): stats["skipped"] += 1; continue
        extra = " · ".join(x for x in (txt(r.get("age")), txt(r.get("pregnancy_stage")), ("dressing " + txt(r.get("dressing"))) if txt(r.get("dressing")) else "") if x)
        out.append({"date": d, "commodity": com, "class": cl, "frame": txt(r.get("frame")), "grade": txt(r.get("muscle_grade")), "lot": txt(r.get("lot_desc")), "unit": txt(r.get("price_unit")),
                    "wbLow": num(r.get("weight_break_low")), "wbHigh": num(r.get("weight_break_high")), "head": head, "wt": num(r.get("avg_weight")), "pMin": pmn, "pMax": pmx, "p": p, "x": extra,
                    "rcp": num(r.get("receipts")), "rcpWk": num(r.get("receipts_week_ago")), "rcpYr": num(r.get("receipts_year_ago"))})
    return out
def is_headline(r):
    return (r["commodity"] == HEADLINE["commodity"] and r["frame"] == HEADLINE["frame"] and r["grade"] == HEADLINE["grade"] and r["lot"] == HEADLINE["lot"]
            and r["unit"] == HEADLINE["unit"] and r["class"] in HEADLINE["classes"] and r["wbLow"] is not None)
def cattle_history_points(rows):
    """(clase|tramo) -> {fecha: [precio medio ponderado por cabezas, cabezas, peso medio]} solo para la especificacion de referencia."""
    agg = {}
    for r in rows:
        if not is_headline(r): continue
        k = "%s|%d" % (r["class"], int(r["wbLow"])); a = agg.setdefault(k, {}).setdefault(r["date"], [0.0, 0.0, 0.0, 0.0])   # sum(h*p), sum(h), sum(h*w), sum(h con peso)
        a[0] += r["head"] * r["p"]; a[1] += r["head"]
        if r["wt"] is not None: a[2] += r["head"] * r["wt"]; a[3] += r["head"]
    return {k: {d: [round(a[0] / a[1], 2), int(a[1]), round(a[2] / a[3], 1) if a[3] else None] for d, a in ds.items()} for k, ds in agg.items()}
def build_cattle(rcfg, raw_rows, old, now, ts, stats):
    rows = cattle_rows(raw_rows, stats)
    hist = {}
    for k, pts in ((old or {}).get("history") or {}).items(): hist[k] = {p[0]: p[1:] for p in pts}
    for k, ds in cattle_history_points(rows).items(): hist.setdefault(k, {}).update(ds)
    cut = (now - datetime.timedelta(days=RETAIN_DAYS)).isoformat()
    history = {k: [[d] + v for d, v in sorted(ds.items()) if d >= cut] for k, ds in hist.items()}
    history = {k: v for k, v in sorted(history.items()) if v}
    rcp = {}
    for r in rows:
        if r["rcp"] is not None: rcp.setdefault(r["date"], r["rcp"])
    for p in ((old or {}).get("receipts") or []): rcp.setdefault(p[0], p[1])
    receipts = [[d, clean(v)] for d, v in sorted(rcp.items()) if d >= cut]
    if rows:
        ld = max(r["date"] for r in rows); lr = [r for r in rows if r["date"] == ld]
        pick = lambda f: next((r[f] for r in lr if r[f] is not None), None)
        latest = {"date": ld, "receipts": {"week": clean(pick("rcp")), "weekAgo": clean(pick("rcpWk")), "yearAgo": clean(pick("rcpYr"))},
                  "rows": [[r["commodity"], r["class"], r["frame"], r["grade"], r["lot"], r["unit"], clean(r["wbLow"]), clean(r["wbHigh"]), clean(r["head"]), clean(r["wt"]), clean(r["pMin"]), clean(r["pMax"]), clean(r["p"]), r["x"]]
                           for r in sorted(lr, key=lambda r: (r["commodity"], r["class"], r["wbLow"] if r["wbLow"] is not None else 1e9, r["frame"], r["grade"], r["lot"]))]}
    else: latest = (old or {}).get("latest")
    if not latest: return None
    return {"schemaVersion": 1, "generatedAt": ts, "kind": "cattle", "state": rcfg["state"], "source": src_of(rcfg), "cols": CATTLE_COLS,
            "headline": {"commodity": HEADLINE["commodity"], "frame": HEADLINE["frame"], "grade": HEADLINE["grade"], "lot": "none", "unit": "USD/cwt (head-weighted average of the published averages)"},
            "latest": latest, "receipts": receipts, "history": history}

# ---------------- heno ----------------
HAY_COLS = ["class", "quality", "package", "unit", "sale", "freight", "region", "use", "crop", "desc", "org", "qty", "pMin", "pMax", "avg"]
def hay_rows(raw, stats):
    out = []
    for r in raw:
        d = iso(r.get("report_begin_date")); pmn, pmx = num(r.get("price_Min")), num(r.get("price_Max"))
        cl, un = txt(r.get("class")), txt(r.get("price_Unit"))
        if not d or not cl or not un or pmn is None or pmx is None or pmn <= 0 or pmx < pmn: stats["skipped"] += 1; continue
        out.append({"date": d, "class": cl, "quality": txt(r.get("quality")), "package": txt(r.get("package")), "unit": un, "sale": txt(r.get("sale_Type")), "freight": txt(r.get("freight")),
                    "region": txt(r.get("region")), "use": txt(r.get("use")), "crop": txt(r.get("crop_Age")), "desc": txt(r.get("desc")), "org": "Organic" if txt(r.get("conventional")).lower() == "organic" else "",
                    "qty": num(r.get("quantity")), "pMin": pmn, "pMax": pmx, "avg": pos(r.get("wtd_Avg_Price"))})
    return out
def hay_key(r): return "|".join(r[c] for c in ("class", "quality", "package", "unit", "sale", "freight", "region", "use", "crop", "desc", "org"))
def hay_group(rows):
    """Filas del mismo informe, fecha y especificacion -> un punto: minimo de minimos, maximo de maximos, media ponderada por cantidad de las medias publicadas, cantidad."""
    g = {}
    for r in rows:
        a = g.setdefault((r["date"], hay_key(r)), {"r": r, "mn": r["pMin"], "mx": r["pMax"], "qty": 0.0, "hasq": False, "sw": 0.0, "sq": 0.0, "plain": []})
        a["mn"] = min(a["mn"], r["pMin"]); a["mx"] = max(a["mx"], r["pMax"])
        if r["qty"] is not None: a["qty"] += r["qty"]; a["hasq"] = True
        if r["avg"] is not None and r["qty"]: a["sw"] += r["avg"] * r["qty"]; a["sq"] += r["qty"]
        elif r["avg"] is not None: a["plain"].append(r["avg"])
    out = {}
    for (d, k), a in g.items():
        avg = a["sw"] / a["sq"] if a["sq"] else (sum(a["plain"]) / len(a["plain"]) if a["plain"] else None)
        out[(d, k)] = (a["r"], a["mn"], a["mx"], round(avg, 2) if avg is not None else None, clean(a["qty"]) if a["hasq"] else None)
    return out
def build_hay(rcfg, raw_rows, old, now, ts, stats):
    rows = hay_rows(raw_rows, stats); grp = hay_group(rows)
    hist = {}
    for k, pts in ((old or {}).get("history") or {}).items(): hist[k] = {p[0]: [p[1], p[2], (p[3] if p[3] and p[3] > 0 else None), p[4]] for p in pts}   # normaliza medias 0 de cargas anteriores
    for (d, k), (r, mn, mx, avg, qty) in grp.items(): hist.setdefault(k, {})[d] = [clean(mn), clean(mx), avg, qty]
    cut = (now - datetime.timedelta(days=RETAIN_DAYS)).isoformat(); ttl = (now - datetime.timedelta(days=HAY_KEY_TTL)).isoformat()
    history = {}
    for k, ds in sorted(hist.items()):
        pts = [[d] + v for d, v in sorted(ds.items()) if d >= cut]
        if pts and pts[-1][0] >= ttl: history[k] = pts
    if rows:
        ld = max(r["date"] for r in rows)
        lat = sorted([(k, v) for (d, k), v in grp.items() if d == ld], key=lambda kv: (kv[1][0]["class"], kv[1][0]["quality"], kv[1][0]["package"], kv[1][0]["unit"], kv[0]))
        latest = {"date": ld, "rows": [[v[0][c] for c in ("class", "quality", "package", "unit", "sale", "freight", "region", "use", "crop", "desc", "org")] + [v[4], clean(v[1]), clean(v[2]), v[3]] for k, v in lat]}
    else: latest = (old or {}).get("latest")
    if not latest: return None
    return {"schemaVersion": 1, "generatedAt": ts, "kind": "hay", "state": rcfg["state"], "source": src_of(rcfg), "cols": HAY_COLS, "keyCols": HAY_COLS[:11], "latest": latest, "history": history}

REG = None
def src_of(rcfg): return {"id": REG["sourceId"], "reportId": rcfg["reportId"], "reportTitle": rcfg["expectedTitle"], "url": REG["viewUrl"] + str(rcfg["reportId"])}

def run_report(rcfg, reg, key, fixture_dir, out, now, window_days, backfill_days, ts):
    kind, st, rid = rcfg["kind"], rcfg["state"], rcfg["reportId"]
    path = out / ("%s-%s.json" % (kind, st)); old = read_json(path)
    days = backfill_days if backfill_days > 0 else (window_days if old else FIRST_LOAD_DAYS)
    d1, raw = now, []
    d0 = now - datetime.timedelta(days=days)
    cur = d0
    while cur <= d1:
        end = min(cur + datetime.timedelta(days=CHUNK_DAYS - 1), d1)
        d = fetch_window(rid, reg, key, fixture_dir, cur, end); raw += rows_of(d)
        if fixture_dir: break
        cur = end + datetime.timedelta(days=1)
    stats = {"skipped": 0}
    doc = (build_cattle if kind == "cattle" else build_hay)(rcfg, raw, old, now, ts, stats)
    if doc is None: raise ApiError("EMPTY", "sin filas validas")
    changed = write_if_changed(path, doc)
    log("%s %s (%d): %d filas, %d descartadas, historial %d series%s" % (kind, st, rid, len(raw), stats["skipped"], len(doc["history"]), ", actualizado" if changed else ", sin cambios"))
    return {"kind": kind, "state": st, "reportId": rid, "status": "OK", "latest": doc["latest"]["date"], "rows": len(doc["latest"]["rows"]), "series": len(doc["history"]), "checkedAt": ts}

def main():
    global REG
    ap = argparse.ArgumentParser()
    ap.add_argument("--window-days", type=int, default=21); ap.add_argument("--backfill-days", type=int, default=0); ap.add_argument("--only", default="")
    ap.add_argument("--fixture-dir"); ap.add_argument("--out"); ap.add_argument("--now")
    a = ap.parse_args()
    REG = read_json(ROOT / "scripts/us-local-registry.json"); out = Path(a.out) if a.out else ROOT / "data/us-local"
    now = datetime.date.fromisoformat(a.now) if a.now else datetime.datetime.now(datetime.timezone.utc).date(); ts = now_iso()
    key = next((os.environ[k] for k in REG["keyEnv"] if os.environ.get(k)), None)
    only = {int(x) for x in a.only.split(",") if x.strip()}
    prev = {(r["kind"], r["state"]): r for r in (read_json(out / "status.json", {}) or {}).get("reports", [])}
    results, bad = [], 0
    if not key and not a.fixture_dir:
        log("SIN CLAVE (USDA_MMN_API_KEY / MARS_API_KEY): no se llama a la API ni se modifica ningun dato")
        for r in REG["reports"]: results.append(dict(prev.get((r["kind"], r["state"]), {"kind": r["kind"], "state": r["state"], "reportId": r["reportId"]}), status="NO_KEY", checkedAt=ts))
    else:
        for r in REG["reports"]:
            if only and r["reportId"] not in only: results.append(prev.get((r["kind"], r["state"])) or {"kind": r["kind"], "state": r["state"], "reportId": r["reportId"], "status": "NOT_RUN"}); continue
            try: results.append(run_report(r, REG, key, a.fixture_dir, out, now, a.window_days, a.backfill_days, ts))
            except ApiError as e:
                bad += 1; log("FALLO %s %s (%d): %s" % (r["kind"], r["state"], r["reportId"], e))
                results.append(dict(prev.get((r["kind"], r["state"]), {"kind": r["kind"], "state": r["state"], "reportId": r["reportId"]}), status=e.kind, error=str(e)[:120], checkedAt=ts))
    run = "NO_KEY" if (not key and not a.fixture_dir) else "OK" if not bad else "PARTIAL" if bad < len(results) else "FAILED"
    write_if_changed(out / "status.json", {"schemaVersion": 1, "generatedAt": ts, "sourceId": REG["sourceId"], "run": {"status": run}, "reports": results})
    log("estado de la ejecucion:", run)
    return 0 if run in ("OK", "NO_KEY", "PARTIAL") else 1
if __name__ == "__main__": sys.exit(main())

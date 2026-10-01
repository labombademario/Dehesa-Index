#!/usr/bin/env python3
"""US Local Cash Bids: registry -> API MARS -> normalizacion -> validacion -> deduplicacion/revisiones -> frescura -> JSON por estado/producto.
Fuente: USDA AMS MyMarketNews / MARS (informes de grano por estado). La clave (secret USDA_MMN_API_KEY; se acepta MARS_API_KEY, la misma API) solo se lee del entorno:
nunca se escribe en ficheros, logs ni cabeceras impresas.
Seguridad: un fallo de la API NUNCA borra datos; el informe que falla conserva su ultimo dataset valido y queda marcado en ingestion-status.json (DELAYED/ERROR).
Sin clave: no se llama a la API ni se inventa nada; solo se regenera el inventario (reports.json) y el estado (NO_KEY).
Uso: update-us-cash-bids.py [--window-days 21] [--backfill-days N] [--only ID,ID] [--fixture-dir DIR] [--out DIR] [--discover] [--from-ams-compact] [--now YYYY-MM-DD]
  --fixture-dir  lee <id>.json de un directorio en vez de llamar a la API (tests; nunca toca la red)
  --from-ams-compact  arranque unico: construye el almacen desde data/ams/<id>.json (datos reales ya ingestados por CI, sin basis ni fecha de publicacion)"""
import argparse, base64, datetime, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lib_cashbids as L

ROOT = L.ROOT
def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def dump(doc): return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
def write_if_changed(path, doc, volatile=("generatedAt",)):
    """Escribe solo si el contenido cambia (ignorando campos volatiles): evita commits vacios."""
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        try:
            old = json.loads(path.read_text(encoding="utf-8"))
            a = {k: v for k, v in old.items() if k not in volatile}; b = {k: v for k, v in doc.items() if k not in volatile}
            if a == b: return False
        except Exception: pass
    path.write_text(dump(doc), encoding="utf-8"); return True
def read_json(path, default=None):
    try: return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception: return default

class ApiError(Exception):
    def __init__(self, kind, msg=""): super().__init__(kind + (": " + msg if msg else "")); self.kind = kind
def api_get(url, key, timeout=90, tries=3):
    """GET con autenticacion Basic (clave : vacio). 401/403 -> AUTH_FAILURE; 404 -> UNAVAILABLE; el resto reintenta y acaba en ERROR. Nunca imprime la clave ni la cabecera."""
    tok = base64.b64encode((key + ":").encode()).decode(); last = ""
    for i in range(tries):
        req = urllib.request.Request(url, headers={"Authorization": "Basic " + tok, "Accept": "application/json", "User-Agent": "dehesaindex-cashbids/1.0"})
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
def fetch_report(rid, reg, key, fixture_dir, days, now):
    if fixture_dir:
        p = Path(fixture_dir) / ("%d.json" % rid)
        if not p.exists(): raise ApiError("UNAVAILABLE", "fixture ausente")
        d = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(d, dict) and d.get("_fixtureError"): raise ApiError(d["_fixtureError"], "fixture")
        return d
    url = "%s%d?q=report_begin_date=%s:%s&allSections=true" % (reg["apiBase"], rid, mdy(now - datetime.timedelta(days=days)), mdy(now))
    return api_get(url, key)

def store_path(out, st, com): return out / "history" / st / (com + ".json")
def load_store(out, st, com):
    d = read_json(store_path(out, st, com))
    return d if d and "series" in d else L.empty_store(st, com)

def reconcile_bootstrap(store):
    """Un punto de arranque (sin fecha de publicacion) cuya serie coincide de forma unica con una serie ya ingestada desde la API
    (misma especificacion; la API aporta campos que el resumen no tenia, p. ej. el punto de entrega) se funde en ella para no duplicar mercados."""
    ser = store["series"]; boot = [k for k, s in ser.items() if s["pts"] and all(p[6] is None for p in s["pts"])]
    raw = [k for k, s in ser.items() if any(p[6] is not None for p in s["pts"])]
    moved = 0
    spec = lambda s: tuple(s[k] for k in ("reportId", "commodity", "commodityClass", "grade", "protein", "locationName", "deliveryPeriod", "unit"))
    for b in boot:
        sb = ser[b]; cands = [r for r in raw if r != b and spec(ser[r]) == spec(sb) and (sb["deliveryPoint"] is None or sb["deliveryPoint"] == ser[r]["deliveryPoint"])]
        if len(cands) != 1: continue
        t = ser[cands[0]]; have = {p[0] for p in t["pts"]}
        t["pts"] += [p for p in sb["pts"] if p[0] not in have]; t["pts"].sort(key=lambda p: p[0]); del ser[b]; moved += 1
    return moved

def compact_rows(doc, rcfg):
    """data/ams/<id>.json (resumen ya ingestado) -> filas con la forma de 'Report Detail' (solo para el arranque; sin basis ni publicacion)."""
    dn = doc.get("dn") or []; rows = []
    keymap = {"commodity": "commodity", "class": "class", "grade": "grade", "protein": "protein", "delivery_point": "delivery_point", "trade_loc": "trade_loc",
              "freight": "freight", "sale Type": "sale_type", "trans_mode": "trans_mode", "delivery_start": "delivery_start", "delivery_end": "delivery_end", "application": "application", "desc": "desc"}
    for s in doc.get("series", []):
        base = {keymap[k]: v for k, v in zip(dn, s["v"]) if k in keymap and v not in ("", None)}
        for d, a, lo, hi in s["p"]:
            y, m, dd = d.split("-")
            r = dict(base); r.update({"report_end_date": "%s/%s/%s" % (m, dd, y), "price_unit": s["u"], "avg_price": a, "price_min": lo, "price_max": hi}); rows.append(r)
    return rows

def split_dims(rcfg):  # dimensiones extra que forman parte de la identidad de serie en este informe (config, no codigo)
    return rcfg.get("splitBy") or []

def shard_commodity_name(store): return next(iter(v["commodityName"] for v in store["series"].values()))
def build_outputs(out, reg, status, ts, now_day):
    """Regenera shards, manifest y reports.json desde los almacenes."""
    freq_of = lambda rid: next((r["frequency"] for r in reg["reports"] if r["reportId"] == rid), "daily")
    changed, tot = 0, {"series": 0, "cur": 0, "hist": 0, "withBasisSeries": 0}
    states, byCom, rep_stats, watch = {}, {}, {}, {}
    for f in sorted((out / "history").glob("*/*.json")) if (out / "history").exists() else []:
        store = read_json(f)
        if not store or not store.get("series"): continue
        st, com = store["state"], store["commodity"]
        shard = L.shard_of(store, freq_of, now_day, ts)
        shard["breaks"] = sorted([dict(b, reportId=int(rid)) for rid, rs_ in status["reports"].items() for b in rs_.get("definitionChanges", []) if int(rid) in {s_["reportId"] for s_ in shard["series"]}], key=lambda b: (b["date"], b["reportId"]))
        changed += write_if_changed(out / st / (com + ".json"), shard)
        e = {"shard": "%s/%s.json" % (st, com), "history": "history/%s/%s.json" % (st, com), "series": len(shard["series"]),
             "markets": len({s["locationName"] for s in shard["series"]}), "latest": max(s["date"] for s in shard["series"]),
             "classes": sorted({s["commodityClass"] for s in shard["series"] if s["commodityClass"]}),
             "withBasis": sum(1 for s in shard["series"] if s["bLo"] is not None or s["bHi"] is not None),
             "reports": sorted({s["reportId"] for s in shard["series"]})}
        states.setdefault(st, {"name": reg["states"].get(st, st), "commodities": {}})["commodities"][com] = e
        byCom.setdefault(com, {"name": next(iter(s["commodityName"] for s in store["series"].values())), "states": []})["states"].append(st)
        tot["series"] += e["series"]; tot["withBasisSeries"] += e["withBasis"]
        tot["cur"] += sum(1 for s in shard["series"] if s["freshness"] in ("LIVE", "FRESH", "EXPECTED_DELAY"))
        tot["hist"] += sum(len(s["pts"]) for s in store["series"].values())
        for s in shard["series"]:
            wv = s["avg"] if s["avg"] is not None else (s["lo"] if s["lo"] is not None and s["lo"] == s["hi"] else None)
            if wv is not None and s["freshness"] in ("LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED"):  # indice de la lista de seguimiento (lo carga el navegador solo si sigues un mercado)
                lab = "%s %s \u00b7 %s (%s)" % (reg["states"].get(st, st), shard_commodity_name(store), s["locationName"] or "-", ", ".join(x for x in (s["deliveryPoint"], s["commodityClass"], s["grade"], s["protein"], s["description"], ("delivery " + s["deliveryPeriod"].replace("/", " to ")) if s["deliveryPeriod"] else None, s["saleType"] if s["saleType"] and s["saleType"] != "Bid" else None, s["freight"]) if x))
                watch["%s/%s/%s" % (st, com, s["id"])] = [lab[:110], "USD/" + s["unit"] if s["currency"] == "USD" else s["unit"], s["frequency"], "cashbid", s["date"], wv, s["changePct"], s["bLo"] if s["bLo"] is not None and s["bLo"] == s["bHi"] else None]
            r = rep_stats.setdefault(s["reportId"], {"commodities": set(), "last": "", "pub": "", "basis": False, "series": 0, "pts": 0})
            r["commodities"].add(com); r["last"] = max(r["last"], s["date"]); r["pub"] = max(r["pub"], s["pub"] or ""); r["basis"] |= (s["bLo"] is not None or s["bHi"] is not None); r["series"] += 1; r["pts"] += s["n"]
    reports = []
    for r in reg["reports"]:
        st = status["reports"].get(str(r["reportId"]), {}); rs = rep_stats.get(r["reportId"])
        reports.append({"reportId": r["reportId"], "slugId": st.get("slugId"), "slugName": st.get("slugName"), "reportName": st.get("reportName") or r["expectedTitle"],
                        "state": r.get("state"), "market": r["market"], "marketType": st.get("marketType"), "frequency": r["frequency"],
                        "commodities": sorted(rs["commodities"]) if rs else [], "active": bool(r["enabled"]),
                        "sourceUrl": reg["viewUrl"] + str(r["reportId"]), "lastPublished": (rs["pub"] or rs["last"]) if rs else None,
                        "ingestionStatus": st.get("status") or ("DISABLED" if not r["enabled"] else "NOT_RUN"),
                        "tier": r["tier"], "scope": r["scope"], "hasData": bool(rs), "hasBasis": bool(rs and rs["basis"]), "series": rs["series"] if rs else 0,
                        "observations": rs["pts"] if rs else 0, "reportNameVerified": bool(st.get("reportNameVerified"))})
    cands = read_json(out / "reports.json", {}).get("candidates", []) if (out / "reports.json").exists() else []
    if status.get("candidates") is not None: cands = status["candidates"]
    changed += write_if_changed(out / "reports.json", {"schemaVersion": 1, "generatedAt": ts, "sourceId": L.SOURCE_ID, "reports": reports, "candidates": cands})
    lic = read_json(ROOT / "data/license-registry.json", {}).get("sources", {}).get(L.SOURCE_ID, {})
    changed += write_if_changed(out / "watch.json", {"schemaVersion": 1, "generatedAt": ts, "doc": "Indice de seguimiento: clave 'ESTADO/producto/idSerie' -> [etiqueta, unidad, frecuencia, grupo, fecha, valor, cambio %, basis unico publicado]. Solo series con un valor principal publicado (promedio o precio exacto).", "series": dict(sorted(watch.items()))})
    man = {"schemaVersion": 1, "generatedAt": ts, "sourceId": L.SOURCE_ID, "license": {"status": lic.get("status"), "licenseId": lic.get("licenseId"), "confidence": lic.get("confidence")},
           "run": {"status": status["runStatus"]}, "latestObservation": max([e["latest"] for s in states.values() for e in s["commodities"].values()] or [None]) if states else None,
           "totals": {"reportsRegistered": len(reg["reports"]), "reportsEnabled": sum(1 for r in reg["reports"] if r["enabled"]), "reportsWithData": len(rep_stats),
                      "reportsWithBasis": sum(1 for v in rep_stats.values() if v["basis"]), "states": len(states), "commodities": len(byCom), "series": tot["series"],
                      "currentSeries": tot["cur"], "historicalObservations": tot["hist"], "seriesWithBasis": tot["withBasisSeries"]},
           "states": states, "commodities": {k: {"name": v["name"], "states": sorted(v["states"])} for k, v in sorted(byCom.items())}}
    changed += write_if_changed(out / "manifest.json", man)
    return man, changed

def discover(reg, key, fixture):
    """Inventario de candidatos: lista de informes de MARS filtrada a grano/cash bids que aun no estan en el registro. Solo informa: no ingiere nada sin revision."""
    doc = fixture if fixture is not None else api_get(reg["apiBase"].rstrip("/"), key)
    rows = doc if isinstance(doc, list) else (doc.get("results") if isinstance(doc, dict) else []) or []
    known = {r["reportId"] for r in reg["reports"]}; out = []
    import re
    for r in rows:
        if not isinstance(r, dict): continue
        n = {L.norm(k): v for k, v in r.items()}
        rid = n.get("slugid") or n.get("reportid")
        try: rid = int(rid)
        except (TypeError, ValueError): continue
        title = str(n.get("reporttitle") or n.get("slugname") or "")
        if rid in known or not re.search(r"grain|elevator|cash bid|bids", title, re.I) or re.search(r"retail|feed|ethanol|rail|barge freight", title, re.I): continue
        out.append({"reportId": rid, "reportName": title, "marketType": L._s(n.get("markettypes") or n.get("markettype")), "lastPublished": L._date(n.get("publisheddate")), "ingestionStatus": "CANDIDATE"})
    return sorted(out, key=lambda x: x["reportId"])

def run(a):
    reg = L.load_registry(a.registry); out = Path(a.out) if a.out else L.OUT
    ts = now_iso(); now = datetime.datetime.strptime(a.now, "%Y-%m-%d") if a.now else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    now_day = (now.date() - datetime.date(1970, 1, 1)).days
    key = next((os.environ[k] for k in reg["keyEnv"] if os.environ.get(k)), None)
    lic = read_json(ROOT / "data/license-registry.json", {}).get("sources", {}).get(L.SOURCE_ID)
    if lic and lic["status"] in ("RESTRICTED", "BLOCKED"): print("License Gate: %s esta %s; no se ingiere." % (L.SOURCE_ID, lic["status"])); return 1
    prev = read_json(out / "ingestion-status.json", {"reports": {}})
    status = {"schemaVersion": 1, "runStatus": "OK", "lastRunAt": ts, "keyConfigured": bool(key), "mode": "fixture" if a.fixture_dir else "bootstrap" if a.from_ams_compact else "api",
              "lastSuccessAt": prev.get("lastSuccessAt"), "reports": prev.get("reports", {}), "revisionsDetected": 0, "candidates": None}
    only = {int(x) for x in a.only.split(",")} if a.only else None
    todo = [r for r in reg["reports"] if r["enabled"] and (not only or r["reportId"] in only)]
    rc = 0; touched = {}; revisions = []; totals = {"added": 0, "same": 0, "revised": 0, "reconciled": 0, "stale_ignored": 0}
    if not key and not a.fixture_dir and not a.from_ams_compact:
        status["runStatus"] = "NO_KEY"
        print("::warning::Falta el secret USDA_MMN_API_KEY: pipeline preparado, no se ha pedido ni inventado ningun dato.")
    else:
        auth_failed = False; ok = bad = 0
        for r in todo:
            rid = r["reportId"]; rs = status["reports"].setdefault(str(rid), {}); rs["lastAttemptAt"] = ts
            if auth_failed: rs["status"] = "AUTH_FAILURE"; bad += 1; continue
            try:
                if a.from_ams_compact:
                    d = read_json(ROOT / "data/ams" / ("%d.json" % rid))
                    if not d: raise ApiError("UNAVAILABLE", "sin data/ams/%d.json" % rid)
                    rows, head, rname = compact_rows(d, r), None, d.get("title")
                else:
                    store_has = any((out / "history").glob("*/*.json")) if (out / "history").exists() else False
                    days = a.backfill_days or (a.window_days if prev.get("reports", {}).get(str(rid), {}).get("lastSuccessAt") else max(a.window_days, 400))
                    doc = fetch_report(rid, reg, key, a.fixture_dir, days, now)
                    head, rows = L.sections(doc); rname = (head or {}).get("report_title")
                    if not rows: raise ApiError("EMPTY", "el informe no devolvio filas de detalle")
                if not a.from_ams_compact:
                    rs["fieldsSeen"] = L.fields_seen(rows)
                    ident = sorted({L.norm(k) for k in rs["fieldsSeen"]} & L.IDENTITY_FIELDS); old_id = rs.get("identityFields")
                    # discontinuidad = cambia la definicion del informe: aparece una dimension de identidad nueva o cambia el titulo oficial
                    chg = []
                    if old_id is not None and set(ident) - set(old_id): chg.append({"date": ts[:10], "kind": "NEW_DIMENSION", "added": sorted(set(ident) - set(old_id))})
                    nm = (head or {}).get("report_title")
                    if nm and rs.get("reportName") and rs.get("reportNameVerified") and nm != rs["reportName"]: chg.append({"date": ts[:10], "kind": "TITLE_CHANGE", "from": rs["reportName"], "to": nm})
                    if chg: rs["definitionChanges"] = (rs.get("definitionChanges", []) + chg)[-20:]
                    rs["identityFields"] = sorted(set(old_id or []) | set(ident))
                if head:
                    h = {L.norm(k): v for k, v in head.items()}
                    rs.update({"slugId": L._s(h.get("slugid")), "slugName": L._s(h.get("slugname")), "marketType": L._s(h.get("markettypes") or h.get("markettype"))})
                if rname: rs["reportName"] = rname; rs["reportNameVerified"] = not a.from_ams_compact
                obs, rej = L.normalize_rows(rows, {**r, "state": r.get("state")}, reg, ts)
                rs["rows"] = len(rows); rs["rejected"] = rej
                if rows and not obs: raise ApiError("NO_OBSERVATIONS", "ninguna fila valida: %s" % json.dumps(rej, sort_keys=True))
                by = {}
                for o in obs:
                    if not o["state"]: continue
                    by.setdefault((o["state"], o["commodity"]), []).append(o)
                for (st, com), lst in by.items():
                    store = touched.get((st, com)) or load_store(out, st, com)
                    m = L.merge(store, lst, ts)
                    for k in totals: totals[k] += m[k]
                    revisions += m["revisions"]; touched[(st, com)] = store
                    if not a.from_ams_compact: reconcile_bootstrap(store)
                rs["status"] = "OK"; rs["lastSuccessAt"] = ts; rs["lastObservation"] = max(o["observationDate"] for o in obs); ok += 1
            except ApiError as e:
                rs["status"] = e.kind if e.kind in ("UNAVAILABLE", "AUTH_FAILURE", "ERROR") else "ERROR"; rs["error"] = str(e)[:200]; bad += 1
                if e.kind == "AUTH_FAILURE": auth_failed = True
                print("informe %d: %s (se conserva el ultimo dataset valido)" % (rid, e))
        status["runStatus"] = "AUTH_FAILURE" if auth_failed else "OK" if not bad else "ERROR" if not ok else "PARTIAL"
        if ok: status["lastSuccessAt"] = ts
        if status["runStatus"] in ("AUTH_FAILURE", "ERROR"): rc = 1
    for (st, com), store in touched.items():
        write_if_changed(store_path(out, st, com), L.history_of(store, ts))
    # los informes con un fallo conservan datos: su frescura real la dice el calendario, no un borrado
    if a.discover and (key or a.fixture_dir is not None):
        try: status["candidates"] = discover(reg, key, json.loads(Path(a.discover_fixture).read_text()) if a.discover_fixture else None)
        except Exception as e: print("discover: %s (no es critico; no se tocan datos)" % type(e).__name__)
    man, changed = build_outputs(out, reg, status, ts, now_day)
    rv = read_json(out / "revisions.json", {"schemaVersion": 1, "revisions": []})["revisions"]
    write_if_changed(out / "revisions.json", {"schemaVersion": 1, "generatedAt": ts, "revisions": (revisions + rv)[:300]})
    status["revisionsDetected"] = len(revisions); status["merge"] = totals
    if status["runStatus"] == "OK" or status["runStatus"] == "PARTIAL":
        pass
    (out).mkdir(parents=True, exist_ok=True); (out / "ingestion-status.json").write_text(dump(status), encoding="utf-8")
    print("US cash bids: %s | modo %s | informes con dato %d | series %d | obs historicas %d | revisiones %d | %s" % (
        status["runStatus"], status["mode"], man["totals"]["reportsWithData"], man["totals"]["series"], man["totals"]["historicalObservations"], len(revisions), json.dumps(totals)))
    return rc

def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--window-days", type=int, default=21); p.add_argument("--backfill-days", type=int, default=0); p.add_argument("--only")
    p.add_argument("--fixture-dir"); p.add_argument("--out"); p.add_argument("--discover", action="store_true"); p.add_argument("--discover-fixture")
    p.add_argument("--from-ams-compact", action="store_true"); p.add_argument("--now"); p.add_argument("--registry")
    return run(p.parse_args(argv))
if __name__ == "__main__": sys.exit(main())

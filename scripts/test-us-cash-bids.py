#!/usr/bin/env python3
"""Tests de US Local Cash Bids con fixtures (scripts/fixtures/us-cash-bids/). Nunca tocan la API real ni necesitan clave.
Los valores de las fixtures son observaciones reales ya publicadas en data/ams/ (24-30 sep 2026); los campos de basis/futuros y las fechas de publicacion
de las fixtures *-SYNTHETIC-* son entradas de prueba (nombres de campo supuestos hasta confirmarlos en CI con fieldsSeen)."""
import contextlib, copy, importlib.util, io, json, os, re, shutil, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import lib_cashbids as L
spec = importlib.util.spec_from_file_location("upd", ROOT / "scripts/update-us-cash-bids.py"); U = importlib.util.module_from_spec(spec); spec.loader.exec_module(U)
FIX = ROOT / "scripts/fixtures/us-cash-bids"
NOW = "2026-10-01"
fails = []
def check(name, cond, extra=""):
    if not cond: fails.append(name + (" :: " + str(extra) if extra else ""))
def J(p): return json.loads(Path(p).read_text(encoding="utf-8"))

def run(out, fxdir, only=None, extra=(), env=None, registry=None):
    args = ["--out", str(out), "--now", NOW] + (["--fixture-dir", str(fxdir)] if fxdir else []) + (["--only", only] if only else []) + list(extra) + (["--registry", str(registry)] if registry else [])
    old = {k: os.environ.get(k) for k in ("USDA_MMN_API_KEY", "MARS_API_KEY")}
    for k in old: os.environ.pop(k, None)
    for k, v in (env or {}).items(): os.environ[k] = v
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf): rc = U.main(args)
    finally:
        for k, v in old.items():
            os.environ.pop(k, None)
            if v is not None: os.environ[k] = v
    return rc, buf.getvalue()
def fx(tmp, name, rid):  # copia una fixture con el nombre <reportId>.json que espera el pipeline
    d = Path(tmp) / "fx"; d.mkdir(exist_ok=True); shutil.copy(FIX / name, d / ("%d.json" % rid)); return d

tmp = Path(tempfile.mkdtemp(prefix="cashbids-"))
try:
    # --- 1. Iowa diario: regiones con rango y promedio, sin basis
    o1 = tmp / "o1"; rc, _ = run(o1, fx(tmp, "2850-iowa-daily.json", 2850), only="2850")
    check("ia rc", rc == 0)
    sh = J(o1 / "IA/corn.json"); S = {s["locationName"]: s for s in sh["series"]}
    check("ia dos regiones", set(S) == {"North Central", "Southwest"}, list(S))
    s = S["North Central"]
    check("ia tipo REGION", s["locationType"] == "REGION" and s["deliveryPoint"] == "Country Elevators", s)
    check("ia unidad", s["unit"] == "bu" and s["currency"] == "USD")
    check("ia precios", s["avg"] == 4.5835 and s["lo"] == 4.5075 and s["hi"] == 4.7675 and s["priceKind"] == "AVERAGE", s)
    check("ia sin basis (null, no inventado)", s["bLo"] is None and s["bHi"] is None and s["futuresContract"] is None)
    check("ia cambio vs dia previo", s["prevDate"] == "2026-09-29" and abs(s["changePct"] - round((4.5835 / 4.796 - 1) * 100, 2)) < 0.01, s)
    check("ia serie id estable y distinto", len({x["id"] for x in sh["series"]}) == 2 and s["id"].startswith("us-cb:2850:"))
    check("ia frescura diaria", s["freshness"] in ("LIVE", "FRESH"), s["freshness"])
    man = J(o1 / "manifest.json")
    check("manifest ruta", man["states"]["IA"]["commodities"]["corn"]["shard"] == "IA/corn.json" and man["totals"]["reportsWithBasis"] == 0)
    rep = [r for r in J(o1 / "reports.json")["reports"] if r["reportId"] == 2850][0]
    check("reports campos", all(k in rep for k in ("reportId", "slugId", "slugName", "reportName", "state", "market", "marketType", "frequency", "commodities", "active", "sourceUrl", "lastPublished", "ingestionStatus")), rep)
    check("reports slug del header", rep["slugName"] == "FIXTURE_SLUG" and rep["slugId"] == "2850" and rep["ingestionStatus"] == "OK", rep)
    check("fieldsSeen registra nombres, no valores", "avg_price" in J(o1 / "ingestion-status.json")["reports"]["2850"]["fieldsSeen"])
    # --- 2. Kansas: trigo y maiz en shards distintos; clases/grados/proteina separados
    o2 = tmp / "o2"; run(o2, fx(tmp, "2886-kansas-wheat-corn.json", 2886), only="2886")
    w = J(o2 / "KS/wheat.json"); c = J(o2 / "KS/corn.json")
    check("ks dos shards", len(w["series"]) > 0 and len(c["series"]) > 0 and all(x["commodity"] == "wheat" for x in w["series"]) and all(x["commodity"] == "corn" for x in c["series"]))
    keys = {(x["locationName"], x["commodityClass"], x["grade"], x["protein"]) for x in w["series"]}
    check("ks trigo: una serie por clase/grado/proteina/mercado, sin mezclar", len(keys) == len(w["series"]) and len({x["commodityClass"] for x in w["series"]}) >= 1, keys)
    # --- 3. Nebraska: sin punto de entrega
    o3 = tmp / "o3"; run(o3, fx(tmp, "3225-nebraska-soy.json", 3225), only="3225")
    ne = J(o3 / "NE/soybeans.json")["series"]
    check("ne sin delivery point sigue siendo REGION", ne and all(x["deliveryPoint"] is None and x["locationType"] == "REGION" for x in ne), ne[:1])
    # --- 4. Minnesota sin trade_loc: ubicacion por defecto del registro, nunca inventada
    o4 = tmp / "o4"; run(o4, fx(tmp, "3049-mn-no-tradeloc.json", 3049), only="3049")
    mn = J(o4 / "MN/corn.json")["series"]
    check("mn ubicacion por defecto del registro", mn and mn[0]["locationName"] == "Southern Minnesota" and mn[0]["locationType"] == "REGION", mn[:1])
    # --- 5. Precio exacto y rango sin promedio
    o5 = tmp / "o5"; run(o5, fx(tmp, "2850-exact-and-range-only.json", 2850), only="2850")
    S5 = {s["locationName"]: s for s in J(o5 / "IA/corn.json")["series"]}
    check("precio exacto", S5["North Central"]["priceKind"] == "EXACT" and S5["North Central"]["lo"] == S5["North Central"]["hi"] and S5["North Central"]["changePct"] is not None, S5["North Central"])
    check("rango sin promedio: no se inventa punto medio", S5["Southwest"]["priceKind"] == "RANGE" and S5["Southwest"]["avg"] is None and S5["Southwest"]["changePct"] is None, S5["Southwest"])
    # --- 6. Basis presente (campos de prueba)
    o6 = tmp / "o6"; run(o6, fx(tmp, "2850-with-basis-SYNTHETIC-FIELDS.json", 2850), only="2850")
    b = J(o6 / "IA/corn.json")["series"][0]
    check("basis como rango publicado, sin calcular", b["bLo"] == -0.25 and b["bHi"] == -0.15 and b["basisUnit"] == "$ Per Bushel" and b["futuresContract"] == "Dec", b)
    check("manifest cuenta reports con basis", J(o6 / "manifest.json")["totals"]["reportsWithBasis"] == 1)
    # --- 7. Informe corregido -> revision con oldValue/newValue/detectedAt
    rc, _ = run(o1, fx(tmp, "2850-corrected.json", 2850), only="2850")
    rv = J(o1 / "revisions.json")["revisions"]
    check("revision detectada", len(rv) == 1 and rv[0]["oldValue"] == 4.5835 and abs(rv[0]["newValue"] - 4.6335) < 1e-9 and rv[0]["detectedAt"] and rv[0]["locationName"] == "North Central", rv)
    check("revision no duplica puntos", len([p for p in J(o1 / "history/IA/corn.json")["series"][S["North Central"]["id"]]["pts"] if p[0] == "2026-09-30"]) == 1)
    check("shard refleja el valor corregido", {x["locationName"]: x for x in J(o1 / "IA/corn.json")["series"]}["North Central"]["avg"] == 4.6335)
    # repetir la misma carga corregida no genera otra revision
    run(o1, fx(tmp, "2850-corrected.json", 2850), only="2850"); check("sin revisiones repetidas", len(J(o1 / "revisions.json")["revisions"]) == 1)
    # --- 8. Duplicados: el exacto colapsa, el ambiguo (misma publicacion, otro valor) se descarta
    o8 = tmp / "o8"; run(o8, fx(tmp, "2850-duplicates.json", 2850), only="2850")
    rs = J(o8 / "ingestion-status.json")["reports"]["2850"]
    pts = list(J(o8 / "history/IA/corn.json")["series"].values())[0]["pts"]
    check("duplicado ambiguo descartado y contado", rs["rejected"].get("ambiguous_same_publication") == 1 and rs["rejected"].get("duplicate_collapsed", 0) >= 1, rs["rejected"])
    check("sin fechas repetidas", len({p[0] for p in pts}) == len(pts))
    # --- 9. Informe semanal: no debe verse STALE a los 3 dias; y el diario dentro de su calendario
    import freshness as F
    day = lambda s: (__import__("datetime").date.fromisoformat(s) - __import__("datetime").date(1970, 1, 1)).days
    for age, exp in ((3, {"LIVE", "FRESH", "EXPECTED_DELAY"}),):
        st = F.evaluate("2026-09-28", "weekly", L.SOURCE_ID, day("2026-10-01"))["state"]
        check("semanal a 3 dias no es stale", st in exp, st)
    check("semanal a 30 dias si es tarde", F.evaluate("2026-08-31", "weekly", L.SOURCE_ID, day("2026-10-01"))["state"] in ("DELAYED", "STALE"))
    check("diario a 3 dias (fin de semana largo) no es stale", F.evaluate("2026-09-28", "daily", L.SOURCE_ID, day("2026-10-01"))["state"] in ("LIVE", "FRESH", "EXPECTED_DELAY"))
    reg = L.load_registry(); reg2 = copy.deepcopy(reg)
    reg2["reports"] = [dict(r, enabled=(r["reportId"] == 2850), frequency="weekly") for r in reg["reports"]]
    rp = tmp / "reg-weekly.json"; rp.write_text(json.dumps(reg2))
    o9 = tmp / "o9"; run(o9, fx(tmp, "2850-iowa-daily.json", 2850), only="2850", registry=rp)
    check("pipeline semanal usa calendario semanal", all(s["frequency"] == "weekly" and s["freshness"] in ("LIVE", "FRESH", "EXPECTED_DELAY") for s in J(o9 / "IA/corn.json")["series"]))
    # --- 10. Informe no disponible: no borra ni toca los datos existentes
    before = (o1 / "IA/corn.json").read_text()
    empty = tmp / "empty"; empty.mkdir()
    rc, _ = run(o1, empty, only="2850")
    st = J(o1 / "ingestion-status.json")
    check("no disponible: estado UNAVAILABLE", st["reports"]["2850"]["status"] == "UNAVAILABLE" and st["runStatus"] == "ERROR", st["reports"]["2850"])
    check("no disponible: datos intactos", (o1 / "IA/corn.json").read_text() == before and (o1 / "history/IA/corn.json").exists())
    # --- 11. Fallo de autenticacion: se conserva todo, estado AUTH_FAILURE, rc != 0
    d401 = tmp / "d401"; d401.mkdir(); shutil.copy(FIX / "401-auth-failure.json", d401 / "2850.json"); shutil.copy(FIX / "401-auth-failure.json", d401 / "3192.json")
    rc, _ = run(o1, d401, only="2850,3192")
    check("auth: rc 1 y estado", rc == 1 and J(o1 / "ingestion-status.json")["runStatus"] == "AUTH_FAILURE")
    check("auth: datos intactos", (o1 / "IA/corn.json").read_text() == before)
    check("auth: manifest conserva las series", J(o1 / "manifest.json")["states"]["IA"]["commodities"]["corn"]["series"] == 2)
    # --- 12. Sin clave: arquitectura lista, ningun dato inventado
    o12 = tmp / "o12"; rc, outp = run(o12, None)
    mf = J(o12 / "manifest.json")
    check("sin clave: NO_KEY, rc 0, sin shards", rc == 0 and mf["run"]["status"] == "NO_KEY" and mf["totals"]["series"] == 0 and not any(o12.glob("*/*.json")) and "USDA_MMN_API_KEY" in outp and not (o12 / "history").exists())
    check("sin clave: reports.json se genera desde el registro", len(J(o12 / "reports.json")["reports"]) == len(reg["reports"]) and all(r["hasData"] is False for r in J(o12 / "reports.json")["reports"]))
    check("sin clave: ningun report dice OK", all(r["ingestionStatus"] in ("NOT_RUN", "DISABLED") for r in J(o12 / "reports.json")["reports"]))
    # --- 13. La clave nunca aparece en ficheros ni en la salida
    o13 = tmp / "o13"; rc, outp = run(o13, fx(tmp, "2850-iowa-daily.json", 2850), only="2850", env={"USDA_MMN_API_KEY": "SECRET_TEST_KEY_123"})
    leak = [p for p in o13.rglob("*") if p.is_file() and "SECRET_TEST_KEY_123" in p.read_text(errors="ignore")]
    check("la clave no se filtra", not leak and "SECRET_TEST_KEY_123" not in outp and J(o13 / "ingestion-status.json")["keyConfigured"] is True, leak)
    # --- 14. Arranque desde el resumen existente y fusion posterior con filas de la API (misma serie, ahora con punto de entrega)
    o14 = tmp / "o14"; rc, _ = run(o14, None, only="2850", extra=["--from-ams-compact"])
    check("arranque desde data/ams", rc == 0 and (o14 / "IA/corn.json").exists() and all(p[6] is None for p in list(J(o14 / "history/IA/corn.json")["series"].values())[0]["pts"]))
    n0 = len(J(o14 / "history/IA/corn.json")["series"])
    run(o14, fx(tmp, "2850-iowa-daily.json", 2850), only="2850")
    h14 = J(o14 / "history/IA/corn.json")["series"]
    nc = [s for s in h14.values() if s["locationName"] == "North Central" and s["deliveryPoint"] == "Country Elevators"]
    check("fusion arranque+API sin duplicar mercados", len(nc) == 1 and len(nc[0]["pts"]) >= 80, [len(x["pts"]) for x in nc])
    # --- 15. Registro: ids unicos, estados validos, sin IDs duplicados fuera del registro
    ids = [r["reportId"] for r in reg["reports"]]
    check("registro: ids unicos", len(ids) == len(set(ids)))
    check("registro: estados validos", all(r.get("state") in reg["states"] for r in reg["reports"] if r["enabled"]))
    check("registro: estados MVP presentes", {r["state"] for r in reg["reports"] if r["tier"] == "mvp"} == {"IA", "IL", "KS", "NE", "MN", "MO"})
    check("registro: tipos de ubicacion validos", all(v in L.LOCATION_TYPES for v in reg["deliveryPointTypes"].values()) and all(r.get("defaultLocationType", "UNKNOWN") in L.LOCATION_TYPES for r in reg["reports"]))
    mvp = [str(r["reportId"]) for r in reg["reports"] if r["tier"] in ("mvp", "priority")]
    pat = re.compile(r"(?<![\d.])(%s)(?![\d.])" % "|".join(mvp)); hard = []
    for pth in list((ROOT / "scripts").glob("*.py")) + list((ROOT / "scripts").glob("*.mjs")) + list((ROOT / "js").glob("*.js")) + list(ROOT.glob("*.html")):
        if pth.name in ("test-us-cash-bids.py", "update-ams.mjs", "build-ams-daily.py") or pth.name.startswith("e2e"): continue
        t = pth.read_text(encoding="utf-8", errors="ignore")
        if "us-cash" in t or "cashbids" in t or "precios-locales" in t:
            m = pat.search(re.sub(r"\?v=\d+[\w-]*", "", t))
            if m: hard.append((pth.name, m.group(1)))
    check("ningun id de informe hardcodeado fuera del registro", not hard, hard)
    # --- 16. Normalizador: filas invalidas se rechazan con motivo, nunca se corrigen
    rows = [{"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "-1"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "999"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel"},
            {"commodity": "Corn", "price_unit": "$ Per Bushel", "avg_price": "4.1"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "avg_price": "4.1"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "4.1", "price_min": "4.5", "price_max": "4.0"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "4.1", "sale_type": "Ask"},
            {"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "4.1", "period": "Year Ago"}]
    obs, rej = L.normalize_rows(rows, {"reportId": 1, "state": "IA", "scope": "STATE_REPORT"}, reg, "t")
    check("filas invalidas rechazadas", not obs and rej == {"implausible_price": 3, "no_price": 1, "no_date": 1, "no_unit": 1, "non_bid_sale_type": 1, "not_current_period": 1}, rej)
    obs, _ = L.normalize_rows([{"commodity": "Corn", "report_end_date": "09/30/2026", "price_unit": "$ Per Bushel", "avg_price": "4.1"}], {"reportId": 1, "state": "IA", "scope": "STATE_REPORT"}, reg, "t")
    check("sin geografia en informe estatal: STATE con el nombre del estado, no un elevador", obs[0]["locationType"] == "STATE" and obs[0]["locationName"] == "Iowa", obs[0])
    check("unidad no convertida", L.unit_of("$ Per Bushel") == ("USD", "bu") and L.unit_of("Cents Per Bushel") == (None, "Cents Per Bushel"))
    # --- 17. discover: solo candidatos de grano que aun no estan en el registro
    cand = U.discover(reg, None, [{"slug_id": 9001, "report_title": "Example Daily Grain Bids"}, {"slug_id": 2850, "report_title": "Iowa Daily Cash Grain Bids"}, {"slug_id": 9002, "report_title": "Retail Grain Prices"}, {"slug_id": 9003, "report_title": "Hog Report"}])
    check("discover filtra y excluye lo registrado", [c["reportId"] for c in cand] == [9001] and cand[0]["ingestionStatus"] == "CANDIDATE", cand)
    # --- 18. Discontinuidad: cambia la definicion del informe (dimension nueva o titulo) -> se marca, no se mezcla en silencio
    o18 = tmp / "o18"; run(o18, fx(tmp, "2850-iowa-daily.json", 2850), only="2850")
    ch = json.loads((FIX / "2850-iowa-daily.json").read_text()); ch[0]["results"][0]["report_title"] = "Iowa Daily Cash Grain Bids (renamed)"
    for r in ch[1]["results"]: r["desc"] = "New Crop"
    d18 = tmp / "fx18"; d18.mkdir(); (d18 / "2850.json").write_text(json.dumps(ch))
    run(o18, d18, only="2850")
    brk = J(o18 / "IA/corn.json")["breaks"]
    check("discontinuidad registrada", {b["kind"] for b in brk} == {"NEW_DIMENSION", "TITLE_CHANGE"} and all(b["reportId"] == 2850 for b in brk), brk)
    sids = J(o18 / "IA/corn.json")["series"]
    check("la serie 'New Crop' es otra serie, no continua la anterior", len(sids) == 4 and len({x["id"] for x in sids}) == 4 and sum(1 for x in sids if x["description"] == "New Crop") == 2, [(x["locationName"], x["description"]) for x in sids])
    # --- 19. Contexto de pares: movimiento de grupo no es anomalia; un punto que se aparta de sus pares si
    st19 = L.empty_store("IA", "corn")
    def mk(loc, prev, last):
        base = {"reportId": 1, "state": "IA", "commodity": "corn", "commodityName": "Corn", "commodityClass": "Yellow", "grade": "US #2", "protein": None, "deliveryPoint": "Country Elevators", "locationName": loc, "locationType": "REGION", "freight": None, "saleType": None, "transMode": None, "description": None, "application": None, "deliveryPeriod": None, "currency": "USD", "unit": "bu"}
        base["pts"] = [["2026-09-29", prev, None, None, None, None, None], ["2026-09-30", last, None, None, None, None, None]]
        return base
    for i, (a, b) in enumerate([(5.0, 4.8), (5.0, 4.79), (5.0, 4.81), (5.0, 4.8), (5.0, 5.6)]): st19["series"]["s%d" % i] = mk("M%d" % i, a, b)
    sh = L.shard_of(st19, lambda r: "daily", now_day=None, generated_at="t")["series"]
    by = {x["locationName"]: x for x in sh}
    check("caida compartida por el grupo: sin aviso", all(by["M%d" % i]["changeFlag"] is None for i in range(4)) and by["M0"]["peerMedianPct"] == -4.0, [(x["locationName"], x["changePct"], x["peerMedianPct"], x["changeFlag"]) for x in sh])
    check("serie que se aparta de sus pares: PEER_OUTLIER", by["M4"]["changeFlag"] == "PEER_OUTLIER", by["M4"])
    two = L.empty_store("IA", "corn"); two["series"]["a"] = mk("A", 5.0, 4.0); two["series"]["b"] = mk("B", 5.0, 5.5)
    check("sin pares suficientes no se afirma nada", all(x["changeFlag"] is None and x["peerMedianPct"] is None for x in L.shard_of(two, lambda r: "daily", None, "t")["series"]))
    # --- 20. Tabla ZIP -> estado (cerca de mi): prefijo dominante + excepciones exactas, sin coordenadas
    import importlib.util
    sp = importlib.util.spec_from_file_location("bzs", str(ROOT / "scripts/build-zip-state.py")); bzs = importlib.util.module_from_spec(sp); sp.loader.exec_module(bzs)
    rows = [{"zipcode": z, "state_abbr": st} for z, st in [("50010", "IA"), ("50011", "IA"), ("50012", "IA"), ("50099", "MN"), ("6820", "IL"), ("XXXXX", "IA"), ("12345", "ZZ")]]
    pre, exc, n = bzs.build(rows)
    check("zip: prefijo dominante y excepcion exacta; ZIP/estado invalidos ignorados", pre == {"500": "IA", "068": "IL"} and exc == {"50099": "MN"} and n == 5, (pre, exc, n))
    tab = json.loads((ROOT / "data/us-cash-bids/zip-state.json").read_text())
    look = lambda z: tab["exceptions"].get(z) or tab["prefix"].get(z[:3])
    check("zip: ciudades de referencia", [look(z) for z in ("50010", "66502", "68501", "55401", "61820", "65201")] == ["IA", "KS", "NE", "MN", "IL", "MO"])
    check("zip: sin coordenadas ni ciudades", set(tab) == {"schemaVersion", "generatedAt", "sourceId", "note", "zips", "prefix", "exceptions"})
finally:
    shutil.rmtree(tmp, ignore_errors=True)
if fails:
    print("FALLAN %d:" % len(fails)); [print(" -", f) for f in fails]; sys.exit(1)
print("test-us-cash-bids OK")

#!/usr/bin/env python3
"""Tests de scripts/verify-anomalies.py con respuestas de la fuente simuladas (sin red): una anomalia solo pasa a KNOWN_VERIFIED_ANOMALY si la
fuente reproduce nuestras cifras; un desajuste, una marca 'no aplicable' o una fuente caida NUNCA la promueven ni la silencian."""
import csv, importlib.util, io, json, shutil, sys, tempfile, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("va", ROOT / "scripts" / "verify-anomalies.py"); va = importlib.util.module_from_spec(spec); spec.loader.exec_module(va)
fails = 0
def T(name, ok):
    global fails
    if not ok: fails += 1; print("FALLA", name)
anoms = json.loads((ROOT / "data/data-anomalies.json").read_text())["anomalies"]; A = {a["series"]: a for a in anoms}
def pts(a):
    cc, sid = a["series"].split("/", 1)
    return {p: v for p, v in next(s for s in json.loads((ROOT / "data" / a["file"]).read_text())["countries"][cc]["series"] if s["id"] == sid)["points"]}
def eurostat_json(a, flags=None, delta=None, dim_extra=None):
    pr = a["verifier"]["periods"]; o = pts(a); times = sorted(set(pr))
    val = {str(i): (o[t] + (delta or 0 if t == times[0] else 0)) for i, t in enumerate(times)}
    return json.dumps({"id": ["geo", "time"], "size": [1, len(times)], "dimension": {"geo": {"category": {"index": {"AT": 0}}}, "time": {"category": {"index": {t: i for i, t in enumerate(times)}}}}, "value": val, "status": flags or {}}).encode()
def pristine(a):  # estado de partida de la prueba: sin verificar (los datos reales ya pueden estar verificados por el pipeline)
    a = dict(a); a["status"] = "UNEXPLAINED_ANOMALY"
    for k in ("evidence", "verifiedAt", "sourceUrl", "lastCheck"): a.pop(k, None)
    a.setdefault("nextAction", "Verificar contra la fuente primaria"); return a
def run(files, apply=True, only=None):
    tmp = Path(tempfile.mkdtemp()); data = tmp / "data"; data.mkdir()
    for a in anoms: shutil.copy(ROOT / "data" / a["file"], data / a["file"])
    doc = json.loads((ROOT / "data/data-anomalies.json").read_text()); doc["anomalies"] = [pristine(a) for a in doc["anomalies"] if not only or a["series"] == only]
    (data / "data-anomalies.json").write_text(json.dumps(doc)); fx = tmp / "fx"; fx.mkdir()
    for n, b in files.items(): (fx / n).write_bytes(b)
    import io as _io, contextlib
    with contextlib.redirect_stdout(_io.StringIO()): rc = va.main(["--fixtures", str(fx), "--data", str(data)] + (["--apply"] if apply else []))
    res = {a["series"]: a for a in json.loads((data / "data-anomalies.json").read_text())["anomalies"]}; shutil.rmtree(tmp); return rc, res

AT = A["AT/at-slaughter-ths_hd-b4110"]; sid = AT["series"]
parent = eurostat_json(AT)  # el padre solo aporta contexto
rc, r = run({"eurostat-B4110": eurostat_json(AT), "eurostat-B4100": parent}, only=sid)
T("Eurostat reproducido -> KNOWN_VERIFIED con evidence/verifiedAt/sourceUrl", rc == 0 and r[sid]["status"] == "KNOWN_VERIFIED_ANOMALY" and all(r[sid].get(k) for k in ("evidence", "verifiedAt", "sourceUrl")) and "ninguna" in r[sid]["evidence"] and "hipotesis" in r[sid]["evidence"])
rc, r = run({"eurostat-B4110": eurostat_json(AT), "eurostat-B4100": parent}, apply=False, only=sid)
T("sin --apply no se promueve, pero se registra el resultado", r[sid]["status"] == "UNEXPLAINED_ANOMALY" and r[sid]["lastCheck"]["result"] == "REPRODUCED")
rc, r = run({"eurostat-B4110": eurostat_json(AT, flags={"0": "z"}), "eurostat-B4100": parent}, only=sid)
T("marca 'no aplicable' (z) -> FLAGGED, no se promueve", rc == 1 and r[sid]["status"] == "UNEXPLAINED_ANOMALY" and r[sid]["lastCheck"]["result"] == "FLAGGED")
rc, r = run({"eurostat-B4110": eurostat_json(AT, delta=5), "eurostat-B4100": parent}, only=sid)
T("valor distinto -> MISMATCH, no se promueve ni se silencia", rc == 1 and r[sid]["status"] == "UNEXPLAINED_ANOMALY" and r[sid]["lastCheck"]["result"] == "MISMATCH")
rc, r = run({}, only=sid)
T("fuente caida -> UNAVAILABLE (codigo 2), sigue UNEXPLAINED", rc == 2 and r[sid]["status"] == "UNEXPLAINED_ANOMALY" and r[sid]["lastCheck"]["result"] == "UNAVAILABLE")

CA = A["CA/ca-trade-imp-wheat"]; o = pts(CA)
def statcan_zip(delta=0, scalar="millions", scale=1.0):
    b = io.StringIO(); w = csv.writer(b); w.writerow(["REF_DATE", "GEO", "Basis", "Seasonal adjustment", "Trade", "North American Product Classification System (NAPCS) [1]", "VALUE", "SCALAR_FACTOR", "STATUS"])
    for i, p in enumerate(CA["verifier"]["periods"]):
        w.writerow([p, "Canada", "Customs", "Unadjusted", "Import", "Wheat [11]", (o[p] + (delta if i == 0 else 0)) * scale, scalar, ""])
    w.writerow(["1996-01", "Canada", "Customs", "Seasonally adjusted", "Import", "Wheat [11]", 999, "millions", ""])  # no debe contarse
    z = io.BytesIO(); zf = zipfile.ZipFile(z, "w"); zf.writestr("12100163.csv", b.getvalue()); zf.close(); return z.getvalue()
rc, r = run({"statcan-12100163": statcan_zip()}, only=CA["series"])
T("StatCan reproducido (filtra por ajuste estacional)", rc == 0 and r[CA["series"]]["status"] == "KNOWN_VERIFIED_ANOMALY")
rc, r = run({"statcan-12100163": statcan_zip(scalar="units", scale=1e6)}, only=CA["series"])
T("StatCan: el factor de escala se aplica como el pipeline", r[CA["series"]]["status"] == "KNOWN_VERIFIED_ANOMALY")
rc, r = run({"statcan-12100163": statcan_zip(delta=1)}, only=CA["series"])
T("StatCan desajuste -> MISMATCH", r[CA["series"]]["lastCheck"]["result"] == "MISMATCH" and r[CA["series"]]["status"] == "UNEXPLAINED_ANOMALY")

AU = A["AU/au-imp-wheat"]; o = pts(AU)
def abs_csv(rows):
    b = io.StringIO(); w = csv.writer(b); w.writerow(["TIME_PERIOD", "COUNTRY_ORIGIN", "OBS_VALUE", "UNIT_MULT"])
    for r in rows: w.writerow(r)
    return b.getvalue().encode()
main = abs_csv([(p, "TOT: Total", o[p] * 1e6, 0) for p in AU["verifier"]["periods"]])
org = {"abs-origin-" + p: abs_csv([(p, "TOT: Total", 10e6, 0), (p, "CA: Canada", 8e6, 0), (p, "NZ: New Zealand", 2e6, 0)]) for p in AU["verifier"]["origins"]}
rc, r = run(dict(org, **{"abs-MERCH_IMP": main}), only=AU["series"])
T("ABS reproducido, con origenes como contexto", r[AU["series"]]["status"] == "KNOWN_VERIFIED_ANOMALY" and "Canada" in r[AU["series"]]["evidence"])
rc, r = run(dict(org, **{"abs-MERCH_IMP": abs_csv([(p, "TOT: Total", (o[p] + 1) * 1e6, 0) for p in AU["verifier"]["periods"]])}), only=AU["series"])
T("ABS desajuste -> MISMATCH", r[AU["series"]]["lastCheck"]["result"] == "MISMATCH")
# update-austria.py: records() propaga la marca de Eurostat y slaughter() no publica 'no aplicable'/'confidencial' como 0
src = (ROOT / "scripts/update-austria.py").read_text(); assert src.rstrip().endswith("\nmain()"); ns = {}; exec(src.rstrip()[:-len("main()")], ns)
j = {"id": ["meat", "unit", "time"], "size": [1, 1, 4], "dimension": {"meat": {"category": {"index": {"B4110": 0}, "label": {"B4110": "Lamb"}}}, "unit": {"category": {"index": {"THS_HD": 0}}}, "time": {"category": {"index": {"2006": 0, "2007": 1, "2008": 2, "2009": 3}}}}, "value": {"0": 0, "1": 0, "2": 243.3, "3": 231.1}, "status": {"0": "z", "1": "c"}}
recs, _ = ns["records"](j)
T("records() propaga la marca de calidad", [r["_s"] for r, v in recs] == ["z", "c", None, None])
got = {}; ns["fetch"] = lambda ds, **f: j; ns["put"] = lambda sid, g, l, u, fq, pts, *a, **k: got.update({sid: pts})
ns["slaughter"]()
T("slaughter() no publica 'no aplicable' (z) ni 'confidencial' (c) como un 0", got.get("at-slaughter-ths_hd-b4110") == [("2008", 243.3), ("2009", 231.1)])
print("verify-anomalies: %d fallos" % fails); sys.exit(1 if fails else 0)

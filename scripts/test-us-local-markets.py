#!/usr/bin/env python3
"""Tests de scripts/update-us-local-markets.py sin red. Los fixtures usan los NOMBRES DE CAMPO reales de los informes AMS observados el 2026-10-03
(resumen semanal de ganado y Direct Hay Report); los VALORES son sinteticos y solo sirven para comprobar la logica (agregacion, fusion de historial, fallos)."""
import importlib.util, json, os, subprocess, sys, tempfile, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lm", ROOT / "scripts" / "update-us-local-markets.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
def cat(date, cl, lo, hi, head, wt, p, pmin, pmax, com="Feeder Cattle", frame="Medium and Large", grade="1", lot="None", unit="Per Cwt", rcp=5000):
    return {"report_date": date, "commodity": com, "class": cl, "frame": frame, "muscle_grade": grade, "lot_desc": lot, "price_unit": unit, "weight_collect": "Actual", "head_count": head,
            "avg_weight": wt, "avg_weight_min": lo, "avg_weight_max": hi, "avg_price": p, "avg_price_min": pmin, "avg_price_max": pmax, "weight_break_low": str(lo) if lo else "None",
            "weight_break_high": str(hi) if hi else "None", "receipts": rcp, "receipts_week_ago": rcp - 100, "receipts_year_ago": 4000}
def hay(date, cl, q, pk, un, mn, mx, qty=None, avg=None, sale="Trade", fr="F.O.B.", reg="South Central"):
    r = {"report_begin_date": date, "class": cl, "quality": q, "package": pk, "price_Unit": un, "sale_Type": sale, "freight": fr, "region": reg, "use": "None", "crop_Age": "None", "desc": "None", "conventional": "Conventional", "price_Min": str(mn), "price_Max": str(mx)}
    if qty is not None: r["quantity"] = str(qty)
    if avg is not None: r["wtd_Avg_Price"] = avg
    return r
tmp = Path(tempfile.mkdtemp()); fx = tmp / "fx"; out = tmp / "out"; fx.mkdir()
def run(*args, env=None):
    e = dict(os.environ); e.pop("USDA_MMN_API_KEY", None); e.pop("MARS_API_KEY", None); e.update(env or {})
    return subprocess.run([sys.executable, str(ROOT / "scripts/update-us-local-markets.py"), "--out", str(out), *args], capture_output=True, text=True, env=e)
# --- sin clave: no toca nada
r = run(); eq(r.returncode, 0, "sin clave sale con 0"); eq(sorted(p.name for p in out.glob("*")), ["status.json"], "sin clave solo status.json")
eq(json.loads((out / "status.json").read_text())["run"]["status"], "NO_KEY", "estado NO_KEY")
# --- ganado: dos filas del mismo tramo se agregan ponderando por cabezas; una fila fuera de la especificacion de referencia no entra en el historial
S = lambda results: [{"results": results}]
rows1 = [cat("09/21/2026", "Steers", 500, 550, 100, 520, 400.0, 380, 420), cat("09/21/2026", "Steers", 500, 550, 300, 525, 380.0, 360, 400),
         cat("09/21/2026", "Steers", 500, 550, 50, 520, 300.0, 290, 310, lot="Unweaned"), cat("09/21/2026", "Heifers", 600, 650, 10, 610, 350.0, 340, 360),
         cat("09/21/2026", "Slaughter Cows", 0, 0, 20, 1300, 120.0, 110, 125, com="Slaughter Cattle", frame="N/A", grade="N/A"),
         cat("09/21/2026", "Steers", 700, 750, 0, 700, 300.0, 290, 310), cat("09/21/2026", "Steers", 700, 750, 20, 700, 300.0, 320, 310)]
(fx / "1895.json").write_text(json.dumps(S(rows1)))
now = "2026-09-30"
for rid in (1860, 1831, 1821, 1784): (fx / ("%d.json" % rid)).write_text(json.dumps({"_fixtureError": "UNAVAILABLE"}))
(fx / "2885.json").write_text(json.dumps([{"reportSection": "Report Header", "results": [{"x": 1}]}, {"reportSection": "Report Details", "results": [
    hay("09/21/2026", "Alfalfa", "Premium", "Large Round", "Per Ton", 200, 220, 100, 210.0), hay("09/21/2026", "Alfalfa", "Premium", "Large Round", "Per Ton", 190, 230, 300, 230.0),
    hay("09/21/2026", "Alfalfa", "Good", "Small Square", "Per Bale", 8, 9, avg=0.0)]}, {"reportSection": "Report Receipts", "results": [{"thisWeek_Volume": 5}]}]))
r = run("--fixture-dir", str(fx), "--now", now, "--only", "1895,1860,2885")
eq(r.returncode, 0, "con fixtures sale con 0 (fallos parciales no son error global)")
d = json.loads((out / "cattle-KS.json").read_text())
eq(d["latest"]["date"], "2026-09-21", "fecha del ultimo informe"); eq(d["latest"]["receipts"], {"week": 5000, "weekAgo": 4900, "yearAgo": 4000}, "recibos")
n_rows = len(d["latest"]["rows"]); eq(n_rows, 5, "filas validas (2 invalidas descartadas: 0 cabezas y precio fuera de rango)")
eq(sorted(d["history"]), ["Heifers|600", "Steers|500"], "solo la especificacion de referencia entra en el historial")
eq(d["history"]["Steers|500"], [["2026-09-21", 385.0, 400, 523.8]], "media ponderada por cabezas (100x400+300x380)/400, peso medio ponderado")
eq(not (out / "cattle-NE.json").exists(), True, "informe que falla sin fichero previo no crea nada")
h = json.loads((out / "hay-KS.json").read_text()); eq(h["latest"]["date"], "2026-09-21", "fecha del heno")
big = [x for x in h["latest"]["rows"] if x[0] == "Alfalfa" and x[1] == "Premium"]; eq(len(big), 1, "dos filas de la misma especificacion se agrupan")
eq(big[0][11:], [400, 190, 230, 225.0], "cantidad total, minimo de minimos, maximo de maximos, media ponderada por cantidad (100x210+300x230)/400")
eq(sorted(h["history"]), sorted("|".join(x[:11]) for x in h["latest"]["rows"]), "una serie por especificacion")
eq([x[14] for x in h["latest"]["rows"] if x[1] == "Good"], [None], "media ponderada 0 del USDA = sin dato, no un precio")
st = json.loads((out / "status.json").read_text()); eq({(x["kind"], x["state"]): x["status"] for x in st["reports"] if x["reportId"] in (1895, 1860, 2885)}, {("cattle", "KS"): "OK", ("cattle", "NE"): "UNAVAILABLE", ("hay", "KS"): "OK"}, "estado por informe")
eq(st["run"]["status"], "PARTIAL", "ejecucion parcial")
# --- segunda semana: se fusiona, el dato revisado de la misma fecha sustituye al anterior y el fallo no borra lo que habia
rows2 = [cat("09/28/2026", "Steers", 500, 550, 200, 520, 410.0, 400, 420, rcp=6000), cat("09/21/2026", "Steers", 500, 550, 400, 524, 390.0, 380, 400)]
(fx / "1895.json").write_text(json.dumps(S(rows2)))
r = run("--fixture-dir", str(fx), "--now", "2026-10-03", "--only", "1895"); d = json.loads((out / "cattle-KS.json").read_text())
eq(d["history"]["Steers|500"], [["2026-09-21", 390.0, 400, 524.0], ["2026-09-28", 410.0, 200, 520.0]], "fusion y revision de la misma fecha")
eq(d["latest"]["date"], "2026-09-28", "nuevo ultimo informe"); eq([x[0] for x in d["receipts"]], ["2026-09-21", "2026-09-28"], "recibos por semana")
eq("Heifers|600" in d["history"], True, "la serie que no vino esta semana se conserva")
(fx / "1895.json").write_text(json.dumps({"_fixtureError": "ERROR"})); r = run("--fixture-dir", str(fx), "--now", "2026-10-03", "--only", "1895")
d2 = json.loads((out / "cattle-KS.json").read_text()); eq(d2["latest"]["date"], "2026-09-28", "un fallo de la API no borra datos"); eq(json.loads((out / "status.json").read_text())["reports"][0]["status"], "ERROR", "se anota el fallo")
# --- retencion: puntos de mas de 420 dias salen del historial; series de heno inactivas dejan de arrastrarse
old = {"history": {"Steers|500": [["2024-01-01", 300.0, 10, 500.0], ["2026-09-21", 390.0, 400, 524.0]]}, "receipts": [["2024-01-01", 100]]}
new = M.build_cattle({"state": "KS", "reportId": 1, "expectedTitle": "x"}, [cat("09/28/2026", "Steers", 500, 550, 5, 520, 400.0, 390, 410)], old, datetime.date(2026, 10, 3), "t", {"skipped": 0}) if setattr(M, "REG", {"sourceId": "usda_ams_mars", "viewUrl": "u/"}) is None else None
eq([p[0] for p in new["history"]["Steers|500"]], ["2026-09-21", "2026-09-28"], "retencion de 420 dias")
oldh = {"history": {"A|||Per Ton||||||||": [["2026-01-05", 100, 110, None, None]], "B|||Per Ton||||||||": [["2026-09-21", 100, 110, None, None]]}}
nh = M.build_hay({"state": "KS", "reportId": 1, "expectedTitle": "x"}, [hay("09/28/2026", "C", "Good", "Small Square", "Per Bale", 8, 9)], oldh, datetime.date(2026, 10, 3), "t", {"skipped": 0})
eq(sorted(k.split("|")[0] for k in nh["history"]), ["B", "C"], "serie de heno inactiva (mas de 120 dias) se retira")
print("OK test-us-local-markets" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

#!/usr/bin/env python3
"""Pruebas de coherencia de las series de costes, balance y combustible de Canadá (StatCan), con los datos reales publicados."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
S = {s["id"]: s for s in json.loads((ROOT / "data" / "canada-stats.json").read_text())["countries"]["CA"]["series"]}
F = []
def T(name, ok):
    print(("OK   " if ok else "FALLO ") + name)
    if not ok: F.append(name)
def val(sid, period):
    for p, v in S[sid]["points"]:
        if p == period: return v
    return None
def years(sid): return {p for p, v in S[sid]["points"]}
need = ["ca-exp-canada-total-expenses", "ca-exp-canada-operating-expenses", "ca-exp-canada-fertiliser-and-lime",
        "ca-cap-total-farm-capital", "ca-cap-land-and-buildings", "ca-cap-machinery-and-equipment", "ca-debt-total", "ca-debt-chartered-banks"]
T("existen las series clave", all(n in S for n in need))
common = sorted(years("ca-exp-canada-total-expenses") & years("ca-exp-canada-operating-expenses"))
T("gastos totales >= gastos de explotacion en todos los anos", all(val("ca-exp-canada-total-expenses", y) >= val("ca-exp-canada-operating-expenses", y) for y in common))
T("los gastos totales = explotacion + amortizacion (1 %)", all(abs(val("ca-exp-canada-total-expenses", y) - val("ca-exp-canada-operating-expenses", y) - val("ca-exp-canada-depreciation", y)) <= 0.01 * val("ca-exp-canada-total-expenses", y) for y in common if val("ca-exp-canada-depreciation", y) is not None))
T("cada partida <= gastos de explotacion", all(val(i, y) <= val("ca-exp-canada-operating-expenses", y) for i in S if i.startswith("ca-exp-canada-") and i not in ("ca-exp-canada-total-expenses", "ca-exp-canada-operating-expenses", "ca-exp-canada-depreciation") for y in years(i) & set(common)))
T("provincias: gasto total de una provincia < gasto total de Canada", all(val("ca-exp-%s-total-expenses" % p, y) < val("ca-exp-canada-total-expenses", y) for p in ("saskatchewan", "alberta", "manitoba", "ontario", "quebec") if "ca-exp-%s-total-expenses" % p in S for y in years("ca-exp-%s-total-expenses" % p) & set(common)))
cy = sorted(years("ca-cap-total-farm-capital") & years("ca-cap-land-and-buildings") & years("ca-cap-machinery-and-equipment"))
T("capital total >= tierra + maquinaria", all(val("ca-cap-total-farm-capital", y) >= val("ca-cap-land-and-buildings", y) + val("ca-cap-machinery-and-equipment", y) - 1 for y in cy))
dy = sorted(years("ca-debt-total") & years("ca-debt-chartered-banks"))
parts = [i for i in S if i.startswith("ca-debt-") and i != "ca-debt-total"]
T("deuda total >= suma de los prestamistas listados", all(val("ca-debt-total", y) >= sum(val(i, y) or 0 for i in parts) - 1 for y in dy))
fuel = [i for i in S if i.startswith("ca-fuel-")]
T("hay series de combustible", len(fuel) >= 5)
T("precios de combustible entre 20 y 400 c/l", all(20 <= v <= 400 for i in fuel for p, v in S[i]["points"]))
T("combustible mensual (periodos AAAA-MM) y al dia (< 6 meses)", all(len(S[i]["latestPeriod"]) == 7 for i in fuel))
T("sin saltos mensuales de combustible > 35 %", all(abs(b[1] / a[1] - 1) < 0.35 for i in fuel for a, b in zip(S[i]["points"], S[i]["points"][1:])))
print("\n%d fallos" % len(F)); sys.exit(1 if F else 0)

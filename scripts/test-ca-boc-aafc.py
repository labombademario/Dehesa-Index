#!/usr/bin/env python3
"""Prueba sin red de BCPI (Valet) y sacrificio semanal AAFC con respuestas sinteticas con la estructura real."""
import datetime, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def load(n, f):
    spec = importlib.util.spec_from_file_location(n, ROOT / "scripts" / f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
B = load("b", "update-ca-boc-bcpi.py"); A = load("a", "update-ca-aafc-slaughter.py")
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
today = datetime.date.today()
wk = [(today - datetime.timedelta(days=7 * i)).isoformat() for i in range(120)][::-1]
doc = {"observations": [{"d": d, "W.AGRI": {"v": "%.2f" % (300 + i)}, "W.FISH": {"v": "1730.27"}, "W.BCPI": {"v": "700"}, "W.XXXX": {"v": "1"}} for i, d in enumerate(wk)]}
s = {x["id"]: x for x in B.series_from(doc, "weekly")}
eq(sorted(s), ["ca-boc-bcpi-agri-w", "ca-boc-bcpi-bcpi-w"], "semanal: sin pesca ni codigos desconocidos")
eq(s["ca-boc-bcpi-agri-w"]["latestPeriod"], wk[-1], "ultima semana"); eq(s["ca-boc-bcpi-agri-w"]["latest"], 419.0, "ultimo valor")
months = ["%d-%02d" % (2020 + i // 12, i % 12 + 1) for i in range(72)]
doc = {"observations": [{"d": m + "-01", "M.FISH": {"v": "1600"}, "M.AGRI": {"v": "360.5"}, "M.ENER": {"v": "oops"}} for m in months]}
m_ = {x["id"]: x for x in B.series_from(doc, "monthly")}
eq(sorted(m_), ["ca-boc-bcpi-agri-m", "ca-boc-bcpi-fish-m"], "mensual: valor no numerico se ignora")
eq(m_["ca-boc-bcpi-agri-m"]["points"][0][0], months[0], "periodo AAAA-MM")
rows = []
for i, d in enumerate(wk):
    for c, k in (("Cattle", "Steers"), ("Cattle", "Cows"), ("Hogs", "Total Approved Hogs Slaughtered"), ("Calves", "Female")):
        rows.append({"EndDt_DtFin": d + "T00:00:00-05:00", "MjrCmdtyEn_PrdtPrncplAn": c, "CtgryEn_CtgrieAn": k, "NumHd_NmbTetes": "1,%03d" % i})
rows.append({"EndDt_DtFin": wk[-1] + "T00:00:00-05:00", "MjrCmdtyEn_PrdtPrncplAn": "Cattle", "CtgryEn_CtgrieAn": "Cows", "NumHd_NmbTetes": "x"})
s = {x["id"]: x for x in A.series_from({"data": rows})}
eq(sorted(s), ["ca-aafc-slaughter-calves-female-w", "ca-aafc-slaughter-cattle-cows-w", "ca-aafc-slaughter-cattle-steers-w"], "ids")
eq(s["ca-aafc-slaughter-cattle-steers-w"]["latest"], 1119.0, "miles con coma"); eq(s["ca-aafc-slaughter-cattle-cows-w"]["latest"], 1119.0, "fila no numerica ignorada")
print("OK test-ca-boc-aafc" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

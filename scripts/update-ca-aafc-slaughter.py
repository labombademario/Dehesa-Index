#!/usr/bin/env python3
"""Sacrificio semanal de ganado bajo inspeccion federal (AAFC, Weekly Red Meat Slaughter) -> data/ca-aafc-slaughter-stats.json (formato *-stats.json, pais CA).
JSON abierto (Open Government Licence - Canada): cabezas por semana (fin de semana en sabado), producto principal (bovino, ternero, cerdo, ovino) y categoria. Desde 1997; se guardan las ultimas 520 semanas.
Solo cifras publicadas; no se suman categorias (AAFC publica ya los totales que quiere dar).
Uso: update-ca-aafc-slaughter.py [--local DIR] [--out DIR]"""
import json, sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
URL = "https://od-do.agr.gc.ca/WeeklyRedMeatSlaughter_AbattageAnimauxViandeRougeHebdomadaire.json"
PAGE = "https://open.canada.ca/data/en/dataset/43ea3719-f2ea-4c30-91d2-c8cf9b9b1cef"
SRC = "Agriculture and Agri-Food Canada, Weekly Red Meat Slaughter"
def series_from(doc):
    rows = doc if isinstance(doc, list) else next(v for v in doc.values() if isinstance(v, list))
    by = {}; dup = 0
    for r in rows:
        try:
            d = r["EndDt_DtFin"][:10]; c = r["MjrCmdtyEn_PrdtPrncplAn"].strip(); k = r["CtgryEn_CtgrieAn"].strip(); v = float(str(r["NumHd_NmbTetes"]).replace(",", ""))
        except (KeyError, ValueError, TypeError, AttributeError): continue
        if (c, k, d) in by: dup += 1
        by[(c, k, d)] = v
    if dup: U.log("filas repetidas (gana la ultima):", dup)
    cats = {}
    for (c, k, d), v in by.items(): cats.setdefault((c, k), []).append((d, v))
    out = []
    for (c, k), pts in sorted(cats.items()):
        if "total approved" in k.lower(): continue  # categoria antigua que ya viene a 0
        label = "Federally inspected slaughter: %s, %s (weekly, head)" % (c.lower(), k.lower())
        s = U.mk_series("ca-aafc-slaughter-%s-%s-w" % (U.slug(c, 20), U.slug(k, 30)), "livestock", label, "head", "weekly", pts, SRC, min_points=52, max_age_years=1, keep=520)
        if s: out.append(s)
    return out
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "ca-aafc-slaughter-stats.json"
    rc = 0
    try:
        ser = series_from(json.loads(U.get(URL, timeout=240).decode("utf-8-sig")))
        U.log("series:", len(ser), [s["id"] for s in ser])
        if len(ser) < 8: raise ValueError("solo %d series (se esperan >=8)" % len(ser))
        if not any(s["id"].startswith("ca-aafc-slaughter-hogs") for s in ser) or not any(s["id"].startswith("ca-aafc-slaughter-cattle") for s in ser): raise ValueError("faltan cerdos o vacuno")
        doc = U.stats_doc(SRC, PAGE, "Open Government Licence - Canada", ser)
        doc["countries"] = {"CA": dict(doc["countries"]["US"], name="Canada")}
        U.write_json(out, doc); U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "ca-aafc-slaughter-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

#!/usr/bin/env python3
"""Fertilizantes de EE. UU. (USDA AMS, informes estatales de costes de produccion ya descargados en data/ams/) -> data/us-fertilizers.json.
Solo reordena precios que AMS publica (dolares por tonelada, distribuidor): por fertilizante y estado, ultimo precio, anterior, hace un ano y ultimas 52 lecturas.
No promedia especificaciones distintas (potasa roja y blanca, nitrogeno liquido 28/30/32 se muestran por separado) y descarta lo que dejo de publicarse (>45 dias)."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data" / "ams"
REPORTS = {2863: "Iowa", 3195: "Illinois", 3776: "Maryland", 3883: "Inter-Mountain West", 3621: "Oklahoma", 3159: "North Carolina"}
PRODUCTS = [("amoniaco", "Anhydrous Ammonia"), ("urea", "Urea (46-0-0)"), ("dap", "DAP (Diammonium Phosphate 18-46-0)"), ("map", "MAP (Monoammonium Phosphate 11-52-0)"),
            ("potasa", "Potash"), ("uan", "Liquid Nitrogen")]
STALE_DAYS = 45
def d(s): return datetime.date.fromisoformat(s)
def pick(p, target, tol):
    best = None
    for x in p:
        gap = abs((d(x[0]) - target).days)
        if gap <= tol and (best is None or gap < best[0]): best = (gap, x)
    return best[1] if best else None
def main():
    rows = {pid: [] for pid, _ in PRODUCTS}; asof = ""
    for rid, state in REPORTS.items():
        try: doc = json.loads((D / ("%d.json" % rid)).read_text())
        except Exception as e: print("aviso: sin informe %d (%s)" % (rid, e), file=sys.stderr); continue
        for s in doc["series"]:
            if s["v"][0] != "Fertilizer" or s.get("u") != "Dollars Per Ton": continue
            name = s["v"][1]
            for pid, pre in PRODUCTS:
                if name.startswith(pre):
                    p = [x for x in s["p"] if x[1] is not None]
                    if len(p) < 2: break
                    asof = max(asof, p[-1][0])
                    rows[pid].append({"state": state, "reportId": rid, "spec": name, "p": p}); break
    out = []
    for pid, _ in PRODUCTS:
        sts = []
        for r in rows[pid]:
            p = r["p"]; last = p[-1]
            if (d(asof) - d(last[0])).days > STALE_DAYS: continue
            prev = p[-2]; yo = pick(p, d(last[0]) - datetime.timedelta(days=364), 14)
            sts.append({"state": r["state"], "reportId": r["reportId"], "spec": r["spec"], "date": last[0], "avg": round(last[1], 2), "min": last[2], "max": last[3],
                        "prev": round(prev[1], 2), "prevDate": prev[0], "yoy": round(yo[1], 2) if yo else None, "yoyDate": yo[0] if yo else None,
                        "hist": [[x[0], round(x[1], 2)] for x in p[-52:]]})
        if not sts: continue
        sts.sort(key=lambda x: (x["spec"], x["state"]))
        out.append({"id": pid, "states": sts})
    res = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": asof,
           "source": {"name": "USDA AMS Market News (informes estatales de costes de produccion)", "url": "https://mymarketnews.ams.usda.gov/", "license": "Public domain (U.S. Government work)"},
           "unit": "USD/short ton", "products": out}
    (ROOT / "data" / "us-fertilizers.json").write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")))
    print("us-fertilizers: %d productos, %d filas, al %s" % (len(out), sum(len(x["states"]) for x in out), asof))
if __name__ == "__main__": main()

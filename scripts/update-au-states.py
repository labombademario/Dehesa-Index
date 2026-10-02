#!/usr/bin/env python3
"""Australia por estado: exportaciones agroalimentarias por estado de origen (ABS Data API, MERCH_EXP, CC BY 4.0) -> data/au-states.json
Clave del dataflow: COMMODITY_SITC.COUNTRY.STATE.FREQ. Se pide mensual (A$) y se suma por anio natural completo (12 meses). No se estima nada."""
import csv, datetime, io, json, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.api.abs.gov.au/rest/data/"
PROD = [("0", "agrifood"), ("001", "live"), ("011", "beef"), ("012", "sheepmeat"), ("022", "milk"), ("024", "cheese"), ("041", "wheat"), ("043", "barley"), ("044", "maize"), ("061", "sugar"), ("112", "wine"), ("222", "oilseeds"), ("263", "cotton"), ("268", "wool")]
STATES = {"new south wales": "NSW", "victoria": "VIC", "queensland": "QLD", "south australia": "SA", "western australia": "WA", "tasmania": "TAS", "northern territory": "NT", "australian capital territory": "ACT"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def abs_csv(path, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(BASE + path, headers={"Accept": "application/vnd.sdmx.data+csv", "User-Agent": "Dehesa-Index-data-bot/1.0"})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(req, timeout=180).read().decode("utf-8-sig"))))
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: break
            time.sleep(4 * (i + 1))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    out = {s: {} for s in STATES.values()}; shown = False
    for code, key in PROD:
        try: rows = abs_csv("MERCH_EXP/%s.TOT..M?format=csvfilewithlabels&startPeriod=2012-01" % code)
        except Exception as e: log("ERROR", code, e); continue
        if rows and not shown:
            shown = True; log("columnas", ",".join(rows[0].keys())); log("muestra", json.dumps(rows[0])[:500])
        cell = {}
        for r in rows:
            if r.get("OBS_VALUE") in (None, ""): continue
            st = None
            for k, v in r.items():
                if "STATE" in k.upper() and v:
                    nm = v.split(": ", 1)[-1].strip().lower()
                    if nm in STATES: st = STATES[nm]
            if not st: continue
            per = r["TIME_PERIOD"]; y = int(per[:4])
            cell.setdefault((st, y), {})[per] = float(r["OBS_VALUE"]) * 10 ** int(r.get("UNIT_MULT") or 0) / 1e6
        for (st, y), m in cell.items():
            if len(m) == 12: out[st].setdefault(key, {})[y] = round(sum(m.values()), 3)
        log(code, key, "celdas", len(cell))
    for st in out: out[st] = {k: [[y, v[y]] for y in sorted(v)] for k, v in out[st].items()}
    n = sum(len(v) for v in out.values())
    if n < 60 or any("agrifood" not in out[s] for s in ("NSW", "VIC", "QLD", "WA", "SA")):
        print("FALLO: datos insuficientes", n); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Australian Bureau of Statistics, International Trade in Goods (MERCH_EXP), by state of origin", "url": "https://www.abs.gov.au/statistics/economy/international-trade", "license": "CC BY 4.0"},
           "unit": "A$ million, calendar-year exports by state of origin", "products": {k: l for l, k in [(c, k) for c, k in PROD]}, "states": out}
    p = outdir / "au-states.json"; p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "au-states-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB"); return 0
if __name__ == "__main__": sys.exit(main())

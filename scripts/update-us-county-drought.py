#!/usr/bin/env python3
"""EE. UU. sequia por CONDADO: U.S. Drought Monitor (NDMC, USDA, NOAA) -> data/us-county/drought/<ESTADO>.json + data/us-county/drought/index.json
Fuente: API CountyStatistics del Drought Monitor (sin clave), estadistica 1 = % de superficie del condado en D0..D4 (acumulado: D1 incluye D2-D4).
Una consulta por estado (el servicio devuelve todos sus condados) y las ultimas 52 semanas. Se copia tal cual lo publica el servicio: nada se estima.
Una semana sin dato de un condado queda como null. Si faltan estados o semanas, no se escribe nada (un fallo nunca borra datos).
Uso: update-us-county-drought.py [--out DIR] [--fixture-dir DIR]   (fixture: <ST>.json con la respuesta del servicio, sin red)"""
import argparse, datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent"
STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()
WEEKS = 52
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=4):
    last = ""
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "dehesaindex-county/1.0"}), timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last = str(e)[:120]; time.sleep(4 * (i + 1))
    raise RuntimeError(last)
def fetch_state(st, fixture):
    if fixture: return json.loads((Path(fixture) / (st + ".json")).read_text("utf-8"))
    end = datetime.date.today(); start = end - datetime.timedelta(days=WEEKS * 7 + 10)
    f = lambda d: "%d/%d/%d" % (d.month, d.day, d.year)
    return get("%s?aoi=%s&startdate=%s&enddate=%s&statisticsType=1" % (API, st, f(start), f(end)))
def build(st, rows):
    weeks = sorted({r["mapDate"][:10] for r in rows})[-WEEKS:]
    idx = {w: i for i, w in enumerate(weeks)}
    cs = {}
    for r in rows:
        w = r["mapDate"][:10]
        if w not in idx or r.get("state") != st: continue
        vals = [r.get(k) for k in ("d0", "d1", "d2", "d3", "d4")]
        if any(v is None or not (0 <= v <= 100.0001) for v in vals): continue
        if not (vals[0] >= vals[1] >= vals[2] >= vals[3] >= vals[4]): continue   # acumulado: cada categoria incluye las mas graves
        c = cs.setdefault(r["fips"], {"n": r["county"], "v": [None] * len(weeks)})
        c["v"][idx[w]] = [round(float(v), 2) for v in vals]
    return weeks, cs
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture-dir"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "us-county" / "drought"
    docs = {}; bad = []
    for st in STATES:
        try:
            rows = fetch_state(st, a.fixture_dir)
            weeks, cs = build(st, rows)
            if len(weeks) < 40 or len(cs) < 1: raise RuntimeError("pocas semanas (%d) o condados (%d)" % (len(weeks), len(cs)))
            docs[st] = (weeks, cs)
        except Exception as e:
            bad.append(st); log("ERROR %s: %s" % (st, e))
        time.sleep(0.3)
    if len(bad) > 2 or len(docs) < 49:
        log("no se escribe nada: fallan %d estados" % len(bad)); return 1
    latest = max(w[-1] for w, _ in docs.values())
    out.mkdir(parents=True, exist_ok=True); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    idx = {}
    for st, (weeks, cs) in docs.items():
        doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "us_drought_monitor", "url": "https://droughtmonitor.unl.edu/"}, "state": st, "unit": "% de superficie del condado; D0..D4 acumulado", "categories": ["D0", "D1", "D2", "D3", "D4"], "weeks": weeks, "counties": cs}
        (out / (st + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
        idx[st] = {"counties": len(cs), "latest": weeks[-1]}
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": {"id": "us_drought_monitor", "url": "https://droughtmonitor.unl.edu/"}, "latest": latest, "states": idx, "counties": sum(v["counties"] for v in idx.values())}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d estados, %d condados, ultima semana %s%s" % (len(idx), sum(v["counties"] for v in idx.values()), latest, ("; sin datos: " + ",".join(bad)) if bad else "")); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "us-county-drought-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

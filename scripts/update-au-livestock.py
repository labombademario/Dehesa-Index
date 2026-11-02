#!/usr/bin/env python3
"""Australia: sacrificio de ganado (miles de cabezas) y carne producida (toneladas) por estado y trimestre (ABS, Livestock Products, CC BY 4.0) -> data/au-livestock/<ESTADO>.json + AU.json + index.json
Fuente: ABS Data API (SDMX, sin clave), dataflows LSTOCK_SLAUGHT y LSTOCK_MEAT (trimestral desde 1965-T3, serie original sin ajuste estacional).
Se copia tal cual lo publica el ABS; lo no disponible o no publicado (estados n, u, m) queda como hueco, nunca como cero.
Control: en los ultimos 20 trimestres la suma de los ocho estados y territorios no se aparta mas de un 1 % (o 3 unidades) del total de Australia; si falla, no se escribe nada.
Uso: update-au-livestock.py [--out DIR]"""
import argparse, csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://data.api.abs.gov.au/rest/data/ABS,%s,1.0.0/all?dimensionAtObservation=AllDimensions"
STATE = {"1": "NSW", "2": "VIC", "3": "QLD", "4": "SA", "5": "WA", "6": "TAS", "7": "NT", "8": "ACT", "AUS": "AU"}
SL = {"10": "steers", "20": "cows", "30": "cattle", "60": "calves", "70": "sheep", "80": "lambs", "110": "pigs", "170": "chickens"}
MT = {"301": "beef", "601": "veal", "701": "mutton", "801": "lamb", "1101": "pork", "171": "chicken", "120": "redmeat"}
BAD = ("n", "u", "m", "q", "s", "t")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(flow):
    last = None
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(API % flow, headers={"Accept": "application/vnd.sdmx.data+csv", "User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}), timeout=180).read().decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def rd(flow, dim, names):
    out = {}; per = set()
    for r in csv.DictReader(io.StringIO(get(flow))):
        if r["TSEST"] != "10" or r["STATE"] not in STATE or r[dim] not in names: continue
        v = None
        if r["OBS_VALUE"] != "" and r["OBS_STATUS"] not in BAD:
            try: v = float(r["OBS_VALUE"])
            except ValueError: v = None
        if v is not None and v < 0: v = None
        per.add(r["TIME_PERIOD"]); out.setdefault(STATE[r["STATE"]], {}).setdefault(names[r[dim]], {})[r["TIME_PERIOD"]] = v
    return out, per
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "au-livestock"
    S, p1 = rd("LSTOCK_SLAUGHT", "LSTOCK_SLAUGHT", SL); M, p2 = rd("LSTOCK_MEAT", "LSTOCK_MEAT", MT)
    per = sorted(p1 | p2)
    log("sacrificio", sum(len(v) for d in S.values() for v in d.values()), "observaciones; carne", sum(len(v) for d in M.values() for v in d.values()), "; trimestres", per[0], per[-1])
    if len(S) < 9 or len(M) < 9 or len(per) < 100: log("FALLO: cobertura insuficiente"); return 1
    ok = tot = 0
    for D, nm in ((S, "sacrificio"), (M, "carne")):
        for item in {i for st in D for i in D[st]}:
            for q in per[-20:]:
                au = D.get("AU", {}).get(item, {}).get(q); parts = [D[s].get(item, {}).get(q) for s in STATE.values() if s != "AU" and s in D]
                if au is None or not au or None in parts and sum(1 for p in parts if p is None) > 3: continue
                tot += 1; ok += abs(sum(p or 0 for p in parts) - au) <= max(0.01 * au, 3)
    log("control suma de estados frente a Australia: %d de %d cuadran" % (ok, tot))
    if tot < 100 or ok < 0.95 * tot: log("FALLO: el control no cuadra, no se escribe nada"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "abs", "url": "https://www.abs.gov.au/statistics/industry/agriculture/livestock-products-australia"}
    units = {"slaughter": "thousand head", "meat": "tonnes"}
    out.mkdir(parents=True, exist_ok=True); n = 0
    for st in STATE.values():
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "state": st, "periods": per, "units": units,
               "slaughter": {i: [S.get(st, {}).get(i, {}).get(q) for q in per] for i in SL.values() if i in S.get(st, {})},
               "meat": {i: [M.get(st, {}).get(i, {}).get(q) for q in per] for i in MT.values() if i in M.get(st, {})}}
        (out / (st + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8"); n += 1
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "units": units, "periods": [per[0], per[-1]], "states": [s for s in STATE.values()], "slaughter": list(SL.values()), "meat": list(MT.values())}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d ficheros, %d KB, hasta %s" % (n, sum(f.stat().st_size for f in out.glob("*.json")) // 1024, per[-1])); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "au-livestock-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

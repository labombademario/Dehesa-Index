#!/usr/bin/env python3
"""Australia: cultivos de secano (broadacre) y horticultura por area estadistica SA2 (ABS, Australian Agriculture, CC BY 4.0) -> data/au-sa2/<ESTADO>.json + index.json
Fuente: ABS Data API (SDMX, sin clave) - dataflows AG_BROADACRE y AG_HORTICULTURE, anuales (año fiscal julio-junio), ~2.480 SA2.
Se copia tal cual lo publica el ABS: superficie total, produccion con tasa (levied production, solo lo sujeto a la tasa agraria), valor local y numero de pagadores/negocios.
Los valores no publicados por confidencialidad o no disponibles (estados n, q, v, w..t) quedan como hueco, nunca como cero.
Control: para cada indicador de superficie y año, la suma de los SA2 no supera el total de Australia que publica el ABS (se admite 0,5 % de redondeo) y alcanza al menos el 50 %
(los SA2 confidenciales cuentan en el total pero no se publican); si falla, no se escribe nada.
Uso: update-au-sa2-agriculture.py [--out DIR]"""
import argparse, csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://data.api.abs.gov.au/rest/"
FLOWS = [("AG_BROADACRE", "1.0.1"), ("AG_HORTICULTURE", "1.0.1")]
STATE = {"1": "NSW", "2": "VIC", "3": "QLD", "4": "SA", "5": "WA", "6": "TAS", "7": "NT", "8": "ACT"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, accept):
    last = None
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}), timeout=180).read()
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def names(flow):
    j = json.loads(get(API + "dataflow/ABS/%s?references=all&detail=full" % flow, "application/vnd.sdmx.structure+json"))["data"]
    items, regions = {}, {}
    for cl in j["codelists"]:
        if cl["id"] == "CL_ASGS_STATE_SA2": regions = {c["id"]: c["name"] for c in cl["codes"]}
        elif "DATAITEM" in cl["id"]: items = {c["id"]: c["name"] for c in cl["codes"]}
    return items, regions
UNIT = {"HA": "ha", "T": "t", "AUD": "AUD", "NUM": "number", "KG": "kg"}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "au-sa2"
    items, units, regions, vals, years = {}, {}, {}, {}, set()
    auss = {}
    for flow, ver in FLOWS:
        it, rg = names(flow); items.update(it); regions.update(rg)
        raw = get(API + "data/ABS,%s,%s/all?dimensionAtObservation=AllDimensions" % (flow, ver), "application/vnd.sdmx.data+csv").decode("utf-8-sig")
        n = 0
        for r in csv.DictReader(io.StringIO(raw)):
            m = re.match(r"^(\d{4})-\d\d-\d\d/P1Y$", r["TIME_PERIOD"])
            if not m: continue
            y = int(m.group(1)); years.add(y); units[r["DATAITEM"]] = UNIT.get(r["UNIT_MEASURE"], r["UNIT_MEASURE"])
            v = None
            if r["OBS_VALUE"] != "" and r["OBS_STATUS"] not in ("n", "q", "v", "w", "s", "t", "u", "m"):
                try: v = float(r["OBS_VALUE"])
                except ValueError: v = None
            reg = r["REGION"]
            if reg == "AUS": auss[(r["DATAITEM"], y)] = v; continue
            if len(reg) == 9 and reg[0] in STATE:
                if v is not None and v < 0: continue
                vals.setdefault(reg, {}).setdefault(r["DATAITEM"], {})[y] = v
            n += 1
        log(flow, n, "observaciones SA2")
    ys = sorted(years)
    if len(ys) < 2 or len(vals) < 500: log("FALLO: cobertura insuficiente", len(ys), len(vals)); return 1
    # control de superficie frente al total de Australia
    ok = tot = 0
    for (item, y), au in auss.items():
        if not item.endswith("_Area_Total") or not au: continue
        s = sum((vals[g].get(item, {}).get(y) or 0) for g in vals)
        tot += 1
        if s <= au * 1.005 and s >= au * 0.5: ok += 1
        else: log("control", item, y, "suma SA2", round(s), "Australia", round(au))
    log("control superficie frente a Australia: %d de %d cuadran" % (ok, tot))
    if tot < 10 or ok < 0.9 * tot: log("FALLO: el control no cuadra, no se escribe nada"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "abs", "url": "https://www.abs.gov.au/statistics/industry/agriculture"}
    out.mkdir(parents=True, exist_ok=True); cnt = {}
    used = sorted({i for g in vals for i in vals[g]})
    meta = {i: {"n": items.get(i, i), "u": units.get(i, "")} for i in used}
    for st in STATE.values():
        areas = {}
        for g, d in vals.items():
            if STATE[g[0]] != st: continue
            v = {i: [d[i].get(y) for y in ys] for i in d if any(d[i].get(y) is not None for y in ys)}
            if v: areas[g] = {"n": regions.get(g, g), "v": v}
        cnt[st] = len(areas)
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "state": st, "years": ys, "items": {i: meta[i] for i in sorted({i for ar in areas.values() for i in ar["v"]})}, "areas": dict(sorted(areas.items()))}
        (out / (st + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "years": ys, "items": meta, "states": cnt}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d estados, %d SA2 con datos, años %s, %d KB" % (len(cnt), sum(cnt.values()), ys, sum(f.stat().st_size for f in out.glob("*.json")) // 1024)); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "au-sa2-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

#!/usr/bin/env python3
"""Australia: ganado, cultivos, valor de la produccion, agua de riego, empresas y empleo agrarios por municipio (LGA) y region SA4 (ABS, "Data by region", CC BY 4.0) -> data/au-regional/<ESTADO>.json + index.json
Fuente: ABS Data API (SDMX, sin clave), dataflows ABS_REGIONAL_LGA2021 y ABS_REGIONAL_ASGS2021 (v1.6.0). Medidas AGRIC_* (Agricultural commodities y Gross value of agricultural production, años 2011/2016/2021),
WATER_* (Water use on Australian farms, 2017-2021), CABEE_19 (empresas agrarias, 2021-2025) y LEED_5 (empleos asalariados agrarios, 2018-2023).
Se copia tal cual lo publica el ABS; lo no publicado queda como hueco, nunca como cero. Valor de produccion en millones de AUD.
Control: la suma de las SA4 de cada estado reproduce el total estatal del ABS (1 %) en superficie de explotaciones 2021 y, para los municipios, la suma no supera al total estatal (0,5 %)
y alcanza al menos el 60 %; si falla, no se escribe nada.
Uso: update-au-regional-agriculture.py [--out DIR]"""
import argparse, csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://data.api.abs.gov.au/rest/"
STATE = {"1": "NSW", "2": "VIC", "3": "QLD", "4": "SA", "5": "WA", "6": "TAS", "7": "NT", "8": "ACT"}
AG = {"AGRIC_3": "Total area of holdings", "AGRIC_10": "Dairy cattle", "AGRIC_11": "Meat cattle", "AGRIC_12": "Sheep and lambs", "AGRIC_13": "Pigs", "AGRIC_19": "Meat chickens",
      "AGRIC_20": "Area of broadacre crops", "AGRIC_21": "Area of vegetables", "AGRIC_22": "Area of orchard fruit and nut trees", "AGRIC_15": "Gross value of agricultural production",
      "AGRIC_16": "Gross value of crops", "AGRIC_17": "Gross value of livestock slaughtered and other disposals", "WATER_2": "Area of agricultural land", "WATER_3": "Area of irrigated agricultural land",
      "WATER_4": "Volume of water applied to irrigated land", "WATER_7": "Application rate of irrigation water"}
UNITS = {"AGRIC_3": "ha", "AGRIC_10": "head", "AGRIC_11": "head", "AGRIC_12": "head", "AGRIC_13": "head", "AGRIC_19": "head", "AGRIC_20": "ha", "AGRIC_21": "ha", "AGRIC_22": "ha", "AGRIC_15": "AUD m", "AGRIC_16": "AUD m",
         "AGRIC_17": "AUD m", "WATER_2": "ha", "WATER_3": "ha", "WATER_4": "ML", "WATER_7": "ML/ha", "CABEE_19": "businesses", "LEED_5": "jobs"}
BIZ = {"CABEE_19": "Number of businesses, agriculture, forestry and fishing", "LEED_5": "Employee jobs, agriculture, forestry and fishing"}
BAD = ("n", "u", "m", "q", "s", "t", "v", "w")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, accept):
    last = None
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}), timeout=240).read()
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def rows(flow, measures, rt, dimname):
    raw = get(API + "data/ABS,%s,1.6.0/%s.%s..A?dimensionAtObservation=AllDimensions" % (flow, "+".join(measures), rt), "application/vnd.sdmx.data+csv").decode("utf-8-sig")
    out = {}
    for r in csv.DictReader(io.StringIO(raw)):
        v = None
        if r["OBS_VALUE"] != "" and r["OBS_STATUS"] not in BAD:
            try: v = float(r["OBS_VALUE"])
            except ValueError: v = None
        if v is not None and v < 0: v = None
        out.setdefault(r[dimname], {}).setdefault(r["MEASURE"], {})[int(r["TIME_PERIOD"][:4])] = v
    return out
def names(flow, cl_id):
    j = json.loads(get(API + "dataflow/ABS/%s?references=all&detail=full" % flow, "application/vnd.sdmx.structure+json"))["data"]
    for cl in j["codelists"]:
        if cl["id"] == cl_id: return {c["id"]: c["name"] for c in cl["codes"]}
    return {}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "au-regional"
    ms = list(AG); lga = rows("ABS_REGIONAL_LGA2021", ms + list(BIZ), "LGA2021", "LGA_2021"); sa4 = rows("ABS_REGIONAL_ASGS2021", ms, "SA4", "ASGS_2021"); ste = rows("ABS_REGIONAL_ASGS2021", ["AGRIC_3", "AGRIC_15"], "STE", "ASGS_2021")
    nl = names("ABS_REGIONAL_LGA2021", "CL_LGA_2021"); n4 = names("ABS_REGIONAL_ASGS2021", "CL_ASGS_2021")
    log("LGA", len(lga), "areas; SA4", len(sa4), "regiones; estados", len(ste))
    if len(lga) < 300 or len(sa4) < 60 or len(ste) < 8: log("FALLO: cobertura insuficiente"); return 1
    ok = tot = 0
    for code, st in STATE.items():
        t = (ste.get(code, {}).get("AGRIC_3") or {}).get(2021)
        if not t: continue
        s4 = sum(((d.get("AGRIC_3") or {}).get(2021) or 0) for c, d in sa4.items() if c[0] == code)
        sl = sum(((d.get("AGRIC_3") or {}).get(2021) or 0) for c, d in lga.items() if c[0] == code)
        tot += 2; a1 = abs(s4 - t) <= 0.01 * t; a2 = 0.6 * t <= sl <= 1.005 * t; ok += a1 + a2
        log("control", st, "estado", round(t), "SA4", round(s4), "LGA", round(sl), "SA4 ok" if a1 else "SA4 NO", "LGA ok" if a2 else "LGA NO")
    log("control: %d de %d cuadran" % (ok, tot))
    if tot < 12 or ok < tot * 0.85: log("FALLO: el control no cuadra, no se escribe nada"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "abs", "url": "https://www.abs.gov.au/statistics/regional/regional-statistics"}
    out.mkdir(parents=True, exist_ok=True); cnt = {}
    items = {i: {"n": AG.get(i) or BIZ[i], "u": UNITS[i]} for i in list(AG) + list(BIZ)}
    for code, st in STATE.items():
        L = {}
        for c, d in lga.items():
            if c[0] != code: continue
            v = {m: {str(y): x for y, x in sorted(ys.items()) if x is not None} for m, ys in d.items()}; v = {m: ys for m, ys in v.items() if ys}
            if v: L[c] = {"n": nl.get(c, c), "v": v}
        S = {}
        for c, d in sa4.items():
            if c[0] != code: continue
            v = {m: {str(y): x for y, x in sorted(ys.items()) if x is not None} for m, ys in d.items()}; v = {m: ys for m, ys in v.items() if ys}
            if v: S[c] = {"n": n4.get(c, c), "v": v}
        cnt[st] = [len(L), len(S)]
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "state": st, "items": items, "lga": dict(sorted(L.items())), "sa4": dict(sorted(S.items()))}
        (out / (st + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "items": items, "states": cnt}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d estados, %d LGA, %d SA4, %d KB" % (len(cnt), sum(v[0] for v in cnt.values()), sum(v[1] for v in cnt.values()), sum(f.stat().st_size for f in out.glob("*.json")) // 1024)); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "au-regional-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

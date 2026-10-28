#!/usr/bin/env python3
"""Lluvia y temperatura mensual como media de toda la región (no un punto): rejilla de NASA POWER promediada dentro de cada región NUTS 2
-> data/region-grid-climate/<PAIS>.json

Fuente: NASA POWER (MERRA-2), endpoint «regional» (registro nasa_power; datos de NASA de uso libre citando la fuente), parámetros PRECTOTCORR
(precipitación, mm/día) y T2M (temperatura media a 2 m, °C). La rejilla es de 0,5° de latitud por 0,625° de longitud.
- Meses de años cerrados: endpoint mensual. Año en curso (y el anterior si el mensual aún no lo trae): endpoint diario, sumado o promediado por mes;
  solo se publican meses completos (todos sus días con dato).
- Media de la región: cada celda pesa por la superficie de la celda que cae dentro de la región (geometría NUTS 2021 de Eurostat/GISCO en
  scripts/ref/nuts2-eu.geojson), con el coseno de la latitud. En islas pequeñas o costas, las celdas mezclan tierra y mar: se indica.
- Normal 1991-2020 de cada mes y anomalía (lluvia en % sobre la normal, temperatura en °C), calculadas por Dehesa Index con la misma rejilla.
Valores imposibles de la fuente (lluvia > 48 mm/día de media mensual, -999) se descartan, nunca se corrigen. Si falta una región o algo falla, no se escribe.
Uso: update-region-grid-climate.py [EL ...] [--out DIR] [--cache DIR]   (sin países: todos los de COUNTRIES)"""
import calendar, datetime, json, math, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://power.larc.nasa.gov/api/temporal/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
COUNTRIES = ["EL"]
NORMAL = (1991, 2020); FROM = 1991; DLAT, DLON = 0.5, 0.625; HIST_FROM = "2001-01"
LOG = []; CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, name, tries=4):
    if CACHE and (CACHE / name).exists(): return json.loads((CACHE / name).read_bytes())
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=240) as r: b = r.read()
            j = json.loads(b)
            if not j.get("features"): raise ValueError("sin celdas: %s" % str(j.get("messages"))[:200])
            if CACHE: (CACHE / name).write_bytes(b)
            return j
        except Exception as e: last = e; time.sleep(8 * (k + 1))
    raise RuntimeError("%s: %s" % (url[-160:], str(last)[:200]))
def bbox(g):
    x0, y0, x1, y1 = g.bounds; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w, h = max(x1 - x0 + 2 * DLON, 2.2), max(y1 - y0 + 2 * DLAT, 2.2)   # el endpoint pide al menos 2° de lado; margen de una celda
    return round(cx - w / 2, 3), round(cx + w / 2, 3), round(cy - h / 2, 3), round(cy + h / 2, 3)
def fetch(cc, rid, g, par, kind, y0, y1):
    lo0, lo1, la0, la1 = bbox(g)
    if kind == "monthly": q = "monthly/regional?parameters=%s&community=AG&longitude-min=%s&longitude-max=%s&latitude-min=%s&latitude-max=%s&start=%d&end=%d&format=json" % (par, lo0, lo1, la0, la1, y0, y1)
    else: q = "daily/regional?parameters=%s&community=AG&longitude-min=%s&longitude-max=%s&latitude-min=%s&latitude-max=%s&start=%d0101&end=%s&format=json" % (par, lo0, lo1, la0, la1, y0, y1)
    j = get(B + q, "%s-%s-%s-%s-%s.json" % (cc, rid, par, kind, y0))
    return [((f["geometry"]["coordinates"][0], f["geometry"]["coordinates"][1]), f["properties"]["parameter"][par]) for f in j["features"]]
def weights(cells, g):
    from shapely.geometry import box
    W = {}
    for (lon, lat), _ in cells:
        a = box(lon - DLON / 2, lat - DLAT / 2, lon + DLON / 2, lat + DLAT / 2).intersection(g).area * math.cos(math.radians(lat))
        if a > 0: W[(lon, lat)] = a
    return W
def avg(cells, W, key, bad):
    num = den = 0.0
    for c, d in cells:
        w = W.get(c)
        if not w: continue
        v = d.get(key)
        if v is None or v <= -990 or bad(v): return None   # una celda sin dato invalida el mes: no se promedia con menos celdas
        num += v * w; den += w
    return num / den if den else None
def region(cc, rid, name, g, today):
    y_now = today.year; out = {}
    # con una normal de lluvia de menos de 5 mm (julio en Creta) el % sobre la normal no significa nada: precipAnomalyPct queda vacío
    pr_m = fetch(cc, rid, g, "PRECTOTCORR", "monthly", FROM, y_now - 1); tm_m = fetch(cc, rid, g, "T2M", "monthly", FROM, y_now - 1)
    W = weights(pr_m, g)
    if not W: raise RuntimeError("%s: ninguna celda dentro de la región" % rid)
    for y in range(FROM, y_now):
        for m in range(1, 13):
            k = "%d%02d" % (y, m); p = avg(pr_m, W, k, lambda v: v > 48); t = avg(tm_m, W, k, lambda v: v < -60 or v > 50)
            if p is not None and t is not None: out["%d-%02d" % (y, m)] = (p * calendar.monthrange(y, m)[1], t)
    # diario: año en curso y, si el mensual aún no trae el año pasado, también ese
    years = [y_now] + ([y_now - 1] if not any(k.startswith(str(y_now - 1)) for k in out) else [])
    end = (today - datetime.timedelta(days=1)).strftime("%Y%m%d")
    for y in years:
        pr_d = fetch(cc, rid, g, "PRECTOTCORR", "daily", y, end if y == y_now else "%d1231" % y); tm_d = fetch(cc, rid, g, "T2M", "daily", y, end if y == y_now else "%d1231" % y)
        for m in range(1, 13):
            nd = calendar.monthrange(y, m)[1]; ps, ts = 0.0, 0.0; ok = True
            for d in range(1, nd + 1):
                k = "%d%02d%02d" % (y, m, d); p = avg(pr_d, W, k, lambda v: v > 500); t = avg(tm_d, W, k, lambda v: v < -60 or v > 55)
                if p is None or t is None: ok = False; break
                ps += p; ts += t
            if ok: out["%d-%02d" % (y, m)] = (ps, ts / nd)
    return out, len(W)
def main():
    global CACHE
    outdir = ROOT / "data" / "region-grid-climate"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    ccs = [a for a in sys.argv[1:] if a.isupper() and len(a) == 2] or COUNTRIES
    from shapely.geometry import shape
    fc = json.loads((ROOT / "scripts" / "ref" / "nuts2-eu.geojson").read_text(encoding="utf-8"))["features"]
    today = datetime.date.today(); rc = 0
    for cc in ccs:
        feats = [f for f in fc if f["properties"]["id"].startswith(cc) and len(f["properties"]["id"]) == 4]
        if not feats: log("ERROR %s: sin regiones NUTS 2 en la geometría" % cc); rc = 1; continue
        units = []
        mac = (json.loads((ROOT / "data" / "eu-regions-macro.json").read_text(encoding="utf-8")).get("regions") or {}).get(cc) or {}
        mapid = {v["nuts"][0]: k for k, v in mac.items() if v.get("nuts") and len(set(v["nuts"])) == 1}   # id de la región en el mapa y en region.html (ATT, KMA…)
        try:
            for f in sorted(feats, key=lambda f: f["properties"]["id"]):
                rid, name = f["properties"]["id"], f["properties"]["name"]; g = shape(f["geometry"])
                M, ncell = region(cc, rid, name, g, today)
                nr = {m: [M["%d-%02d" % (y, m)][0] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in M] for m in range(1, 13)}
                nt = {m: [M["%d-%02d" % (y, m)][1] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in M] for m in range(1, 13)}
                if any(len(v) < 25 for v in nr.values()): raise RuntimeError("%s: normal incompleta" % rid)
                nr = {m: sum(v) / len(v) for m, v in nr.items()}; nt = {m: sum(v) / len(v) for m, v in nt.items()}
                def rec(p):
                    pm, tc = M[p]; m = int(p[5:])
                    return {"period": p, "precipMm": round(pm, 1), "precipBaselineMm": round(nr[m], 1), "precipAnomalyPct": round((pm / nr[m] - 1) * 100, 1) if nr[m] >= 5 else None,
                            "tempC": round(tc, 1), "tempBaselineC": round(nt[m], 1), "tempAnomalyC": round(tc - nt[m], 2)}
                pers = sorted(M); last = pers[-1]; y, mo = int(last[:4]), int(last[5:]); first = "%d-%02d" % (y - 1, mo)
                H = [rec(p) for p in pers if p >= HIST_FROM]
                units.append({"id": rid, "name": name, "mapId": mapid.get(rid), "cells": ncell, "months": [rec(p) for p in pers if p >= first],
                              "history": {"from": H[0]["period"], "precipAnomalyPct": [None if h["precipAnomalyPct"] is None else round(h["precipAnomalyPct"]) for h in H], "tempAnomalyC": [round(h["tempAnomalyC"], 1) for h in H],
                                          "periods": len(H)}})
                if [h["period"] for h in H] != sorted(set(h["period"] for h in H)): raise RuntimeError("%s: meses repetidos" % rid)
                log("%s %s: %d celdas, último %s" % (cc, rid, ncell, last))
        except Exception as e:
            log("ERROR %s: %s; no se escribe" % (cc, e)); rc = 1; continue
        lp = max(u["months"][-1]["period"] for u in units)
        if lp < (today.replace(day=1) - datetime.timedelta(days=70)).strftime("%Y-%m"): log("ERROR %s: último mes %s demasiado antiguo" % (cc, lp)); rc = 1; continue
        # historiales alineados: todas las regiones empiezan en HIST_FROM; los huecos (mes inválido) rompen la alineación y se rechazan
        for u in units:
            if u["history"]["from"] != HIST_FROM: log("ERROR %s %s: el historial empieza en %s" % (cc, u["id"], u["history"]["from"])); rc = 1; break
        else:
            doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": cc, "lastPeriod": lp, "baseline": "%d-%d" % NORMAL,
                   "grid": "0.5° x 0.625° (MERRA-2)", "source": {"id": "nasa_power", "name": "NASA POWER (MERRA-2 reanalysis), regional endpoint", "url": "https://power.larc.nasa.gov/", "license": "NASA data, free to use with attribution"},
                   "methodology": {
                       "es": "Media de toda la región, no de un punto: la rejilla de NASA POWER (reanálisis MERRA-2, celdas de 0,5° × 0,625°) promediada dentro de la región, pesando cada celda por la parte de su superficie que cae en ella. Normal 1991-2020 y diferencia calculadas por Dehesa Index con la misma rejilla. Es un reanálisis, no estaciones: en islas pequeñas y costas las celdas mezclan tierra y mar.",
                       "en": "Average over the whole region, not one point: the NASA POWER grid (MERRA-2 reanalysis, 0.5° × 0.625° cells) averaged within the region, each cell weighted by the share of its area inside it. The 1991-2020 normal and the difference are calculated by Dehesa Index from the same grid. It is a reanalysis, not stations: on small islands and coasts cells mix land and sea.",
                       "fr": "Moyenne sur toute la région, pas en un point : la grille de NASA POWER (réanalyse MERRA-2, mailles de 0,5° × 0,625°) moyennée dans la région, chaque maille pondérée par la part de sa surface qui s’y trouve. Normale 1991-2020 et écart calculés par Dehesa Index avec la même grille. C’est une réanalyse, pas des stations : sur les petites îles et les côtes, les mailles mêlent terre et mer.",
                       "it": "Media dell’intera regione, non di un punto: la griglia di NASA POWER (rianalisi MERRA-2, celle di 0,5° × 0,625°) mediata all’interno della regione, pesando ogni cella per la parte della sua superficie che vi ricade. Normale 1991-2020 e scarto calcolati da Dehesa Index con la stessa griglia. È una rianalisi, non stazioni: nelle piccole isole e sulle coste le celle mescolano terra e mare."},
                   "units": units, "log": [l for l in LOG if l.startswith(cc)][-6:]}
            outdir.mkdir(parents=True, exist_ok=True); tmp = outdir / (cc + ".json.tmp")
            tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / (cc + ".json"))
            log("%s escrito: %d regiones, último %s" % (cc, len(units), lp))
    return rc
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "region-grid-climate-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

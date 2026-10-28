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
COUNTRIES = ["EL", "ES", "IT", "AT", "BE", "NL", "DK"]   # países cuyas páginas de región usaban el punto de una ciudad; FR y DE tienen datos de su servicio meteorológico
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
        finally: time.sleep(0.4)   # sin ráfagas contra NASA POWER
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
    # en el meridiano 0 la fuente devuelve la misma celda dos veces («-0.0» con datos y «0.0» todo -999): se juntan quedándose con el valor válido
    cells = {}
    for f in j["features"]:
        c = (round(f["geometry"]["coordinates"][0], 4) + 0.0, round(f["geometry"]["coordinates"][1], 4) + 0.0); d = f["properties"]["parameter"][par]
        if c not in cells: cells[c] = dict(d); continue
        for k, v in d.items():
            if v is not None and v > -990 and (cells[c].get(k) is None or cells[c][k] <= -990): cells[c][k] = v
    return list(cells.items())
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
    """{AAAA-MM: (lluvia del mes en mm o None si la fuente trae un artefacto, temperatura media °C)}, celdas, meses con lluvia anulada"""
    y_now = today.year; out = {}
    pr_m = fetch(cc, rid, g, "PRECTOTCORR", "monthly", FROM, y_now - 1); tm_m = fetch(cc, rid, g, "T2M", "monthly", FROM, y_now - 1)
    W = weights(pr_m, g)
    if not W: raise RuntimeError("%s: ninguna celda dentro de la región" % rid)
    tot = sum(W.values()); BIG = {c for c, w in W.items() if w / tot >= 0.02}   # celdas con al menos el 2 % del peso: una celda casi toda de mar no anula la región
    # máximo 1991-2020 de cada celda y mes del año (mm/día de media). La lluvia de NASA POWER trae artefactos en algunas celdas (p. ej. 755 mm en un día de
    # enero de 2026 en el suroeste de Cerdeña): si una celda pasa de 48 mm/día de media en el mes o triplica su máximo 1991-2020, la lluvia de ese mes
    # se anula para la región (no se corrige ni se quita la celda). La temperatura no se ve afectada y se publica.
    MX = {}
    for c, dd in pr_m:
        if c not in BIG: continue
        for m in range(1, 13):
            v = [dd.get("%d%02d" % (yy, m)) for yy in range(NORMAL[0], NORMAL[1] + 1)]; v = [x for x in v if x is not None and -990 < x <= 48]
            if v: MX[(c, m)] = max(v)
    def bad(c, m, mmday): return c in BIG and (mmday > 48 or ((c, m) in MX and mmday > 3 * MX[(c, m)] and mmday > 3))
    FLAG = []
    for y in range(FROM, y_now):
        for m in range(1, 13):
            k = "%d%02d" % (y, m); t = avg(tm_m, W, k, lambda v: v < -60 or v > 50)
            if t is None: continue
            if y > NORMAL[1] and any(dd.get(k) is not None and dd[k] > -990 and bad(c, m, dd[k]) for c, dd in pr_m): FLAG.append("%d-%02d" % (y, m)); p = None
            else:
                p = avg(pr_m, W, k, lambda v: False); p = None if p is None else p * calendar.monthrange(y, m)[1]
            out["%d-%02d" % (y, m)] = (p, t)
    # diario: año en curso y, si el mensual aún no trae el año pasado, también ese
    years = [y_now] + ([y_now - 1] if not any(k.startswith(str(y_now - 1)) for k in out) else [])
    end = (today - datetime.timedelta(days=1)).strftime("%Y%m%d")
    for y in years:
        pr_d = fetch(cc, rid, g, "PRECTOTCORR", "daily", y, end if y == y_now else "%d1231" % y); tm_d = fetch(cc, rid, g, "T2M", "daily", y, end if y == y_now else "%d1231" % y)
        for m in range(1, 13):
            nd = calendar.monthrange(y, m)[1]; days = ["%d%02d%02d" % (y, m, d) for d in range(1, nd + 1)]
            T = [avg(tm_d, W, k, lambda v: v < -60 or v > 55) for k in days]
            if any(v is None for v in T): continue   # mes incompleto (el mes en curso) o sin dato: no se publica
            P = [avg(pr_d, W, k, lambda v: False) for k in days]; p = None if any(v is None for v in P) else sum(P)
            if p is not None:
                for c, dd in pr_d:
                    vals = [dd.get(k) for k in days]
                    if all(v is not None and v > -990 for v in vals) and bad(c, m, sum(vals) / nd): FLAG.append("%d-%02d" % (y, m)); p = None; break
            out["%d-%02d" % (y, m)] = (p, sum(T) / nd)
    if FLAG: log("%s %s: lluvia anulada por artefactos de la fuente (una celda > 48 mm/día de media o más del triple de su máximo 1991-2020): %s" % (cc, rid, ", ".join(sorted(set(FLAG))[-12:])))
    return out, len(W), sorted(set(FLAG))
def main():
    global CACHE
    outdir = ROOT / "data" / "region-grid-climate"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    ccs = [a for a in sys.argv[1:] if a.isupper() and len(a) == 2] or COUNTRIES
    from shapely.geometry import shape
    from shapely.ops import unary_union
    fc = json.loads((ROOT / "scripts" / "ref" / "nuts2-eu.geojson").read_text(encoding="utf-8"))["features"]
    today = datetime.date.today(); rc = 0
    for cc in ccs:
        # regiones tal como las usan el mapa y region.html (data/eu-regions-macro.json): cada una es una o varias NUTS 2 (Trentino-Alto Adigio = ITH1 + ITH2)
        geo = {f["properties"]["id"]: f for f in fc if f["properties"]["id"].startswith(cc) and len(f["properties"]["id"]) == 4}
        mac = (json.loads((ROOT / "data" / "eu-regions-macro.json").read_text(encoding="utf-8")).get("regions") or {}).get(cc) or {}
        regs = []
        for mid, v in sorted(mac.items()):
            nuts = sorted({n for n in (v.get("nuts") or []) if n in geo})
            if not nuts: log("ERROR %s: la región %s no tiene NUTS 2 en la geometría (%s)" % (cc, mid, v.get("nuts"))); regs = []; break
            regs.append((mid, nuts))
        if not regs: rc = 1; continue
        units = []
        try:
            for mid, nuts in regs:
                rid = "+".join(nuts); name = " + ".join(geo[n]["properties"]["name"] for n in nuts)
                g = unary_union([shape(geo[n]["geometry"]) for n in nuts])
                M, ncell, flags = region(cc, rid, name, g, today)
                nr = {m: [M["%d-%02d" % (y, m)][0] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in M and M["%d-%02d" % (y, m)][0] is not None] for m in range(1, 13)}
                nt = {m: [M["%d-%02d" % (y, m)][1] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in M] for m in range(1, 13)}
                if any(len(v) < 25 for v in nr.values()): raise RuntimeError("%s: normal incompleta" % rid)
                nr = {m: sum(v) / len(v) for m, v in nr.items()}; nt = {m: sum(v) / len(v) for m, v in nt.items()}
                def rec(p):
                    pm, tc = M[p]; m = int(p[5:])
                    r = {"period": p}
                    if pm is not None: r.update(precipMm=round(pm, 1), precipBaselineMm=round(nr[m], 1), precipAnomalyPct=round((round(pm, 1) / round(nr[m], 1) - 1) * 100, 1) if nr[m] >= 5 else None)
                    else: r["precipFlag"] = True   # lluvia anulada: artefacto de la fuente
                    r.update(tempC=round(tc, 1), tempBaselineC=round(nt[m], 1), tempAnomalyC=round(tc - nt[m], 2))
                    return r
                pers = sorted(M); last = pers[-1]; y, mo = int(last[:4]), int(last[5:]); first = "%d-%02d" % (y - 1, mo)
                # meses sin dato válido (una celda con -999 o con lluvia imposible en la fuente, como febrero y marzo de 2026 en el sur de Italia):
                # quedan como hueco explícito, nunca se rellenan, y el historial sigue alineado mes a mes
                allp = []; yy, mm = int(HIST_FROM[:4]), int(HIST_FROM[5:])
                while "%d-%02d" % (yy, mm) <= last: allp.append("%d-%02d" % (yy, mm)); yy, mm = (yy + (mm == 12), mm % 12 + 1)
                gaps = [p for p in allp if p not in M]
                if gaps: log("%s %s: meses sin dato válido en la fuente: %s" % (cc, rid, ", ".join(gaps[-12:])))
                if len(gaps) > 12: raise RuntimeError("%s: %d meses sin dato" % (rid, len(gaps)))
                rec0 = rec
                def rec(p): return rec0(p) if p in M else {"period": p, "gap": True}
                H = [rec(p) for p in allp]
                units.append({"id": rid, "name": name, "nuts": nuts, "mapId": mid, "cells": ncell, "gaps": gaps, "precipFlagged": [f for f in flags if f >= HIST_FROM], "months": [rec(p) for p in allp if p >= first],
                              "history": {"from": H[0]["period"], "precipAnomalyPct": [None if h.get("precipAnomalyPct") is None else round(h["precipAnomalyPct"]) for h in H], "tempAnomalyC": [None if h.get("tempAnomalyC") is None else round(h["tempAnomalyC"], 1) for h in H],
                                          "periods": len(H)}})
                if [h["period"] for h in H] != sorted(set(h["period"] for h in H)): raise RuntimeError("%s: meses repetidos" % rid)
                log("%s %s: %d celdas, último %s" % (cc, rid, ncell, last))
        except Exception as e:
            log("ERROR %s: %s; no se escribe" % (cc, e)); rc = 1; continue
        lp = max(u["months"][-1]["period"] for u in units)
        if lp < (today.replace(day=1) - datetime.timedelta(days=70)).strftime("%Y-%m"): log("ERROR %s: último mes %s demasiado antiguo" % (cc, lp)); rc = 1; continue
        late = [u["id"] for u in units if u["months"][-1]["period"] != lp]
        if late: log("ERROR %s: regiones sin el último mes %s: %s; no se escribe" % (cc, lp, late)); rc = 1; continue
        # historiales alineados: todas las regiones empiezan en HIST_FROM; los huecos (mes inválido) rompen la alineación y se rechazan
        for u in units:
            if u["history"]["from"] != HIST_FROM: log("ERROR %s %s: el historial empieza en %s" % (cc, u["id"], u["history"]["from"])); rc = 1; break
        else:
            doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": cc, "lastPeriod": lp, "baseline": "%d-%d" % NORMAL,
                   "grid": "0.5° x 0.625° (MERRA-2)", "source": {"id": "nasa_power", "name": "NASA POWER (MERRA-2 reanalysis), regional endpoint", "url": "https://power.larc.nasa.gov/", "license": "NASA data, free to use with attribution"},
                   "methodology": {
                       "es": "Media de toda la región, no de un punto: la rejilla de NASA POWER (reanálisis MERRA-2, celdas de 0,5° × 0,625°) promediada dentro de la región, pesando cada celda por la parte de su superficie que cae en ella. Normal 1991-2020 y diferencia calculadas por Dehesa Index con la misma rejilla. Es un reanálisis, no estaciones: en islas pequeñas y costas las celdas mezclan tierra y mar. La lluvia de la fuente trae a veces valores imposibles en algunas celdas (sobre todo en el sur de Italia y Cerdeña desde 2025): si una celda pasa de 48 mm al día de media en el mes o triplica su máximo de 1991-2020, la lluvia de ese mes no se publica para la región; la temperatura sí.",
                       "en": "Average over the whole region, not one point: the NASA POWER grid (MERRA-2 reanalysis, 0.5° × 0.625° cells) averaged within the region, each cell weighted by the share of its area inside it. The 1991-2020 normal and the difference are calculated by Dehesa Index from the same grid. It is a reanalysis, not stations: on small islands and coasts cells mix land and sea. The source rainfall sometimes has impossible values in some cells (above all in southern Italy and Sardinia since 2025): if a cell averages over 48 mm a day in the month or triples its 1991-2020 maximum, that month’s rainfall is not published for the region; temperature is.",
                       "fr": "Moyenne sur toute la région, pas en un point : la grille de NASA POWER (réanalyse MERRA-2, mailles de 0,5° × 0,625°) moyennée dans la région, chaque maille pondérée par la part de sa surface qui s’y trouve. Normale 1991-2020 et écart calculés par Dehesa Index avec la même grille. C’est une réanalyse, pas des stations : sur les petites îles et les côtes, les mailles mêlent terre et mer. La pluie de la source contient parfois des valeurs impossibles dans certaines mailles (surtout dans le sud de l’Italie et en Sardaigne depuis 2025) : si une maille dépasse 48 mm par jour en moyenne sur le mois ou triple son maximum 1991-2020, la pluie de ce mois n’est pas publiée pour la région ; la température l’est.",
                       "it": "Media dell’intera regione, non di un punto: la griglia di NASA POWER (rianalisi MERRA-2, celle di 0,5° × 0,625°) mediata all’interno della regione, pesando ogni cella per la parte della sua superficie che vi ricade. Normale 1991-2020 e scarto calcolati da Dehesa Index con la stessa griglia. È una rianalisi, non stazioni: nelle piccole isole e sulle coste le celle mescolano terra e mare. La pioggia della fonte ha talvolta valori impossibili in alcune celle (soprattutto nel Sud Italia e in Sardegna dal 2025): se una cella supera i 48 mm al giorno di media nel mese o triplica il suo massimo 1991-2020, la pioggia di quel mese non è pubblicata per la regione; la temperatura sì."},
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

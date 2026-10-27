#!/usr/bin/env python3
"""Belgica: tiempo observado y deficit de precipitacion (KMI/IRM, estaciones automaticas AWS) -> data/be-weather.json

Fuente: Real Instituto Meteorologico de Belgica (KMI-IRM), observaciones diarias de sus estaciones meteorologicas automaticas (WFS publico de opendata.meteo.be, capa
aws:aws_1day, 14 estaciones, la mas antigua desde 2003). Son datos de alto valor (HVD) del KMI: reutilizables con CC BY 4.0 citando al KMI como fuente. No se usan los datos
en malla de 5x5 km del KMI (no reutilizables).
  - deficit: suma acumulada desde el 1 de abril de (evaporacion de referencia de Makkink - precipitacion), media de las estaciones con dato (al menos 8). Mismo metodo que
    el neerslagtekort neerlandes (scripts/knmi_deficit.py): lo calcula Dehesa Index, no es una cifra publicada por el KMI. Makkink = 0,65 * s/(s+gamma) * K / lambda, con K la
    radiacion global diaria (W/m2 -> MJ/m2) medida por la estacion. Se compara con el año anterior y con la mediana y el rango p10-p90 de 2005 en adelante.
  - monthly: lluvia mensual y temperatura media (media de estaciones) de los ultimos 12 meses frente al normal 2005-año anterior.
  - stations: por estacion, ultima observacion, lluvia de 30 dias, temperatura media y minima de 7 dias, temperatura del suelo a 10 cm y dias de helada.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-be-weather.py [--local carpeta con <año>.json]"""
import argparse, datetime, json, math, statistics, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "be-weather.json"
WFS = "https://opendata.meteo.be/geoserver/aws/wfs"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
SINCE = 2005
NDAYS = 214            # 1 abril .. 31 octubre
MINST = 8              # estaciones minimas por dia
PROP = "code,timestamp,precip_quantity,temp_avg,temp_min,temp_max,short_wave_from_sky_avg,pressure,temp_soil_avg_10cm"
# provincia (NUTS 2 de Eurostat) de cada estacion, por punto en poligono (GISCO 2021)
PROV = {"6414": "BE25", "6418": "BE25", "6438": "BE21", "6447": "BE10", "6439": "BE21", "6434": "BE23", "6459": "BE35", "6464": "BE21", "6477": "BE22",
        "10101002": "BE25", "6455": "BE35", "6472": "BE34", "6494": "BE33", "6484": "BE34"}
def get(params, tries=4):
    u = WFS + "?" + urllib.parse.urlencode(dict(service="WFS", version="2.0.0", request="GetFeature", outputFormat="application/json", **params)); last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(str(last)[:160])
def fetch_year(y, local):
    if local:
        p = Path(local) / ("%d.json" % y)
        if not p.exists(): raise RuntimeError("falta %s" % p.name)
        return json.loads(p.read_text(encoding="utf-8"))
    return get({"typeNames": "aws:aws_1day", "propertyName": PROP, "sortBy": "timestamp", "count": "30000",
                "cql_filter": "timestamp BETWEEN %d-01-01T00:00:00Z AND %d-12-31T23:59:59Z" % (y, y)})
def makkink(t, k, p):
    """Evaporacion de referencia de Makkink (mm/dia) con temperatura media (C), radiacion global media (W/m2) y presion (hPa)."""
    if t is None or k is None or not -40 < t < 45 or not 0 <= k < 500: return None
    es = 0.6108 * math.exp(17.27 * t / (t + 237.3)); s = 4098 * es / (t + 237.3) ** 2; g = 0.000665 * ((p if p and 800 < p < 1100 else 1013.0) / 10.0)
    return max(0.0, 0.65 * s / (s + g) * k * 0.0864 / 2.45)   # k W/m2 * 86400 s / 1e6 = MJ/m2; lambda = 2.45 MJ/kg
def days(fc):
    """-> {fecha: {estacion: dict(r, t, tmin, e, soil)}} con los valores nulos omitidos."""
    out = {}
    for f in fc.get("features", []):
        p = f["properties"]; d = (p.get("timestamp") or "")[:10]
        if not d: continue
        r = p.get("precip_quantity")
        row = {"r": r if r is not None and 0 <= r < 400 else None, "t": p.get("temp_avg"), "tmin": p.get("temp_min"), "soil": p.get("temp_soil_avg_10cm"),
               "e": makkink(p.get("temp_avg"), p.get("short_wave_from_sky_avg"), p.get("pressure"))}
        out.setdefault(d, {})[str(p["code"])] = row
    return out
def season(y, D):
    """Curva acumulada del 1 de abril al 31 de octubre; None donde no hay dato aun."""
    cum = 0.0; out = []; d = datetime.date(y, 4, 1); last = None
    for i in range(NDAYS):
        rows = [v for v in D.get(d.isoformat(), {}).values() if v["r"] is not None and v["e"] is not None]
        if len(rows) >= MINST: cum += sum(v["e"] - v["r"] for v in rows) / len(rows); out.append(round(cum, 1)); last = i
        else: out.append(None)
        d += datetime.timedelta(days=1)
    for i in range(1, (last or 0) + 1):
        if out[i] is None: out[i] = out[i - 1]
    return out
def q(vs, p):
    vs = sorted(vs); k = (len(vs) - 1) * p; f = int(k); c = min(f + 1, len(vs) - 1); return vs[f] + (vs[c] - vs[f]) * (k - f)
def mean(a): return sum(a) / len(a) if a else None
def build(years, today, stations):
    cy, py = today.year, today.year - 1
    if cy not in years: raise RuntimeError("sin datos del año en curso")
    allseasons = {}
    for y, D in sorted(years.items()):
        s = season(y, D)
        if y == cy and not any(v is not None for v in s): continue
        allseasons[y] = s
    if py not in allseasons: raise RuntimeError("falta el año anterior")
    cur = allseasons[cy]; n = max(i for i, v in enumerate(cur) if v is not None)
    ref = [y for y in allseasons if y < cy and y >= SINCE and allseasons[y][-1] is not None]
    if len(ref) < 12: raise RuntimeError("solo %d años de referencia" % len(ref))
    med = [round(q([allseasons[y][i] for y in ref if allseasons[y][i] is not None], 0.5), 1) for i in range(NDAYS)]
    p10 = [round(q([allseasons[y][i] for y in ref if allseasons[y][i] is not None], 0.1), 1) for i in range(NDAYS)]
    p90 = [round(q([allseasons[y][i] for y in ref if allseasons[y][i] is not None], 0.9), 1) for i in range(NDAYS)]
    ymax = [[y, max(v for v in allseasons[y] if v is not None)] for y in sorted(allseasons) if y < cy or y == cy]
    if not -150 < cur[n] < 600: raise RuntimeError("deficit fuera de rango: %s" % cur[n])
    dates = sorted(d for d, rows in years[cy].items() if sum(1 for v in rows.values() if v["r"] is not None) >= MINST)
    asof = datetime.date.fromisoformat(dates[-1])
    deficit = {"asOf": asof.isoformat(), "curYear": cy, "prevYear": py, "since": min(ref), "start": "04-01", "days": NDAYS, "stations": max(len(r) for r in years[cy].values()),
               "cur": cur[:n + 1], "prev": allseasons[py], "med": med, "p10": p10, "p90": p90, "yearMax": ymax}
    # mensual: media de estaciones por dia; lluvia mensual = suma de la media diaria (mes con al menos 25 dias con dato)
    def month_vals(D, y, m):
        r, t = [], []
        for dd in range(1, 32):
            try: k = datetime.date(y, m, dd).isoformat()
            except ValueError: break
            rows = [v for v in D.get(k, {}).values()]
            rr = [v["r"] for v in rows if v["r"] is not None]; tt = [v["t"] for v in rows if v["t"] is not None]
            if len(rr) >= MINST: r.append(mean(rr))
            if len(tt) >= MINST: t.append(mean(tt))
        return (sum(r) if len(r) >= 25 else None, mean(t) if len(t) >= 25 else None)
    monthly = []; cm = datetime.date(asof.year, asof.month, 1)
    for i in range(11, -1, -1):
        y, m = cm.year, cm.month - i
        while m <= 0: m += 12; y -= 1
        partial = (y, m) == (asof.year, asof.month) and asof.day < 28
        rv, tv = month_vals(years.get(y, {}), y, m)
        nr = [month_vals(years[yy], yy, m) for yy in sorted(years) if SINCE <= yy < cy and yy != y]
        nrr = [a for a, _ in nr if a is not None]; ntt = [b for _, b in nr if b is not None]
        monthly.append({"y": y, "m": m, "rain": round(rv, 1) if rv is not None and not partial else None, "temp": round(tv, 1) if tv is not None else None,
                        "rainNormal": round(mean(nrr), 1) if len(nrr) >= 10 else None, "tempNormal": round(mean(ntt), 1) if len(ntt) >= 10 else None})
    # ultimos 30 dias
    win = [(asof - datetime.timedelta(days=i)) for i in range(29, -1, -1)]
    def nat_rain(D, ds):
        s = 0.0; c = 0
        for d in ds:
            rr = [v["r"] for v in D.get(d.isoformat(), {}).values() if v["r"] is not None]
            if len(rr) >= MINST: s += mean(rr); c += 1
        return s if c >= 25 else None
    cur30 = nat_rain(years[cy] if win[0].year == cy else {**years.get(win[0].year, {}), **years[cy]}, win)
    norm = []
    for yy in sorted(years):
        if SINCE <= yy < cy:
            try: w = [datetime.date(yy - (asof.year - d.year), d.month, d.day) for d in win]
            except ValueError: continue
            v = nat_rain(dict(sum([list(years.get(x.year, {}).items()) for x in w[:1] + w[-1:]], [])), w)
            if v is not None: norm.append(v)
    last30 = {"from": win[0].isoformat(), "to": asof.isoformat(), "rain": round(cur30, 1) if cur30 is not None else None, "rainNormal": round(mean(norm), 1) if len(norm) >= 10 else None}
    st = []
    D = {**years.get(win[0].year, {}), **years[cy]}
    for s in stations:
        c = str(s["code"]); rs = [D.get(d.isoformat(), {}).get(c) for d in win]
        ob = [(d, r) for d, r in zip(win, rs) if r]
        if not ob: continue
        rain = [r["r"] for _, r in ob if r["r"] is not None]; t7 = [r["t"] for d, r in ob if r["t"] is not None and (asof - d).days < 7]
        m7 = [r["tmin"] for d, r in ob if r["tmin"] is not None and (asof - d).days < 7]; soil = [(d, r["soil"]) for d, r in ob if r["soil"] is not None]
        st.append({"code": c, "name": s["name"].title(), "province": PROV.get(c), "lat": round(s["lat"], 3), "lon": round(s["lon"], 3), "alt": s["alt"], "last": ob[-1][0].isoformat(),
                   "rain30": round(sum(rain), 1) if len(rain) >= 25 else None, "temp7": round(mean(t7), 1) if len(t7) >= 5 else None, "tmin7": round(min(m7), 1) if len(m7) >= 5 else None,
                   "soil10": round(soil[-1][1], 1) if soil and (asof - soil[-1][0]).days <= 3 else None, "frost30": sum(1 for _, r in ob if r["tmin"] is not None and r["tmin"] < 0)})
    return deficit, monthly, last30, st
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--local", default=""); ap.add_argument("--today", default=""); ap.add_argument("--out", default=str(OUT)); a = ap.parse_args()
    out = Path(a.out); today = datetime.date.fromisoformat(a.today) if a.today else datetime.date.today()
    try:
        if a.local:
            stations = json.loads((Path(a.local) / "stations.json").read_text(encoding="utf-8"))
        else:
            stations = [dict(code=f["properties"]["code"], name=f["properties"]["name"], lon=f["geometry"]["coordinates"][0], lat=f["geometry"]["coordinates"][1], alt=f["properties"]["altitude"],
                             end=f["properties"]["date_end"]) for f in get({"typeNames": "aws:aws_station"})["features"]]
        stations = [s for s in stations if not s.get("end")]
        if len(stations) < 10: raise RuntimeError("solo %d estaciones activas" % len(stations))
        years = {}
        for y in range(SINCE, today.year + 1):
            try: years[y] = days(fetch_year(y, a.local))
            except Exception as e:
                if y >= today.year - 1: raise
                print("aviso: %d no disponible (%s)" % (y, str(e)[:80]))
        deficit, monthly, last30, st = build(years, today, stations)
    except Exception as e:
        print("FALLO:", e); return 0 if out.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": deficit["asOf"],
           "source": {"name": "Real Instituto Meteorologico de Belgica (KMI-IRM), estaciones meteorologicas automaticas (AWS), observaciones diarias", "url": "https://opendata.meteo.be/", "license": "CC BY 4.0 (datos de alto valor del KMI-IRM)",
                      "note": "Deficit y medias calculados por Dehesa Index a partir de las observaciones diarias del KMI; no son cifras publicadas por el KMI"},
           "deficit": deficit, "last30": last30, "monthly": monthly, "stations": st}
    out.parent.mkdir(parents=True, exist_ok=True); out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("be-weather.json %s: deficit %s mm, lluvia 30 d %s (normal %s), %d estaciones, %d años" % (doc["asOf"], deficit["cur"][-1], last30["rain"], last30["rainNormal"], len(st), len(years)))
    return 0
if __name__ == "__main__": sys.exit(main())

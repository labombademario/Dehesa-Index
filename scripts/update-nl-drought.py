#!/usr/bin/env python3
"""Paises Bajos: sequia por region COROP (NUTS 3) y deficit de precipitacion del KNMI -> data/nl-drought.json
1) Indicador Combinado de Sequia (CDI) del European Drought Observatory (JRC / Copernicus EMS, licencia CC BY 4.0), el mismo que alimenta la ficha de cada pais
(scripts/update-eu-drought.py, que lo agrega por pais y por region NUTS 2: Paises Bajos tiene 4). Aqui se calcula, para cada una de las 40 regiones COROP (NUTS 3 de
Eurostat/GISCO, (c) EuroGeographics, reutilizacion libre citando la fuente), el porcentaje de la superficie (ponderado por cos(latitud)) en cada clase: 1 vigilancia,
2 aviso, 3 alerta, 4 recuperacion, 5 recuperacion temporal de la humedad del suelo, 6 recuperacion temporal de la vegetacion. Una imagen cada 10 dias, ultimos 3 anos.
2) Deficit de precipitacion (neerslagtekort) como lo define el KNMI, calculado por Dehesa Index con los datos diarios del KNMI (scripts/knmi_deficit.py): acumulado
desde el 1 de abril de evaporacion de referencia menos precipitacion, media de 13 estaciones; se compara la temporada actual con la anterior y con la mediana y el
rango p10-p90 de 2001 en adelante. Si el KNMI falla se conserva la parte anterior.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-nl-drought.py [--nc a.nc b.nc ...]"""
import datetime, importlib.util, json, sys, time
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "nl-drought.json"
kspec = importlib.util.spec_from_file_location("kd", ROOT / "scripts" / "knmi_deficit.py"); KD = importlib.util.module_from_spec(kspec); kspec.loader.exec_module(KD)
spec = importlib.util.spec_from_file_location("eu", ROOT / "scripts" / "update-eu-drought.py"); EU = importlib.util.module_from_spec(spec); spec.loader.exec_module(EU)
def deficit(old):
    """Curvas de deficit (mm) por dia desde el 1 de abril: ano actual, anterior y referencia 2001-anterior (mediana, p10, p90)."""
    today = datetime.date.today(); cy = today.year if today >= datetime.date(today.year, 4, 2) else today.year - 1; py = cy - 1
    o = old or {}; same = o.get("curYear") == cy and o.get("prevYear") == py and o.get("med")
    cur = KD.get_year(cy, today)
    if not any(v is not None for v in cur): raise ValueError("sin datos de %d" % cy)
    if same: prev, med, p10, p90, ymax = o["prev"], o["med"], o["p10"], o["p90"], o["yearMax"]
    else:
        prev = None; ys = {}
        for y in range(2001, py + 1):
            c = KD.get_year(y, today); ys[y] = c; time.sleep(2)
        prev = ys[py]
        def q(v, p):
            v = sorted(x for x in v if x is not None)
            if len(v) < 10: return None
            k = (len(v) - 1) * p; f = int(k); return round(v[f] + (v[min(f + 1, len(v) - 1)] - v[f]) * (k - f), 1)
        med = [q([ys[y][i] for y in ys], 0.5) for i in range(KD.NDAYS)]; p10 = [q([ys[y][i] for y in ys], 0.1) for i in range(KD.NDAYS)]; p90 = [q([ys[y][i] for y in ys], 0.9) for i in range(KD.NDAYS)]
        ymax = [[y, round(max(v for v in ys[y] if v is not None), 1)] for y in sorted(ys) if any(v is not None for v in ys[y])]
    n = max(i for i, v in enumerate(cur) if v is not None); asof = (datetime.date(cy, 4, 1) + datetime.timedelta(days=n)).isoformat()
    if cur[n] is not None and not -150 < cur[n] < 500: raise ValueError("deficit fuera de rango: %s" % cur[n])
    return {"asOf": asof, "curYear": cy, "prevYear": py, "since": 2001, "start": "04-01", "days": KD.NDAYS, "stations": 13, "cur": cur[:n + 1], "prev": prev, "med": med, "p10": p10, "p90": p90, "yearMax": ymax}
def main():
    args = sys.argv[1:]
    try:
        import shapely
        if args[:1] == ["--nc"]: paths = [Path(p) for p in args[1:]]
        else: paths = []; [paths.append(Path("/tmp/" + u.rsplit("/", 1)[-1])) or paths[-1].write_bytes(EU.get(u, True)) for u in EU.files(datetime.date.today())]
        lon = lat = None; periods = []; imgs = []
        for p in paths:
            lo, la, t, a = EU.load(p)
            if lon is None: lon, lat = lo, la
            elif lo.shape != lon.shape or abs(lo[0] - lon[0]) > 1e-6 or abs(la[0] - lat[0]) > 1e-6: raise ValueError("%s: la malla cambio" % p.name)
            for i, d in enumerate(t): periods.append(d); imgs.append(a[i])
        order = np.argsort(periods); periods = [periods[i] for i in order]; imgs = [imgs[i] for i in order]
        if len(set(periods)) != len(periods) or not periods: raise ValueError("decadas repetidas o vacias")
        w1 = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon))); counties = {}
        for f in json.loads((ROOT / "scripts" / "ref" / "nuts3-nl.json").read_text(encoding="utf-8"))["features"]:
            g = shapely.from_geojson(json.dumps(f["geometry"])); x0, y0, x1, y1 = g.bounds
            xi = np.where((lon >= x0) & (lon <= x1))[0]; yi = np.where((lat >= y0) & (lat <= y1))[0]
            X, Y = np.meshgrid(lon[xi[0]:xi[-1] + 1], lat[yi[0]:yi[-1] + 1]); m = shapely.contains_xy(g, X, Y); box = (yi[0], yi[-1] + 1, xi[0], xi[-1] + 1)
            if m.sum() < 6: raise ValueError("%s: solo %d celdas" % (f["properties"]["id"], m.sum()))
            rows = []; cov = None
            for img in imgs:
                s, cv = EU.shares(img[box[0]:box[1], box[2]:box[3]], m, w1[box[0]:box[1], box[2]:box[3]])
                if s is None: raise ValueError("%s: sin dato en %s" % (f["properties"]["id"], periods[len(rows)]))
                rows.append(s); cov = cv
            counties[f["properties"]["id"]] = {"name": f["properties"]["name"], "cells": int(m.sum()), "coverage": cov, "v": rows}
        if len(counties) != 40: raise ValueError("%d regiones en vez de 40" % len(counties))
    except Exception as e:
        print("FALLO:", e); return 0 if OUT.exists() else 1
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    try: dfc = deficit(old.get("deficit"))
    except Exception as e:
        print("AVISO deficit KNMI:", e); dfc = old.get("deficit")
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": periods[-1].isoformat(),
           "source": {"name": "European Drought Observatory (EDO), Combined Drought Indicator v4.1 - (c) European Commission, JRC; regiones: Eurostat/GISCO NUTS 2021 (c) EuroGeographics",
                      "url": "https://drought.emergency.copernicus.eu/", "license": "CC BY 4.0 (EDO); GISCO: reutilizacion libre citando la fuente"},
           "unit": "% de la superficie con dato (ponderada por cos latitud)", "grid": "0.0417 deg (EPSG:4326)", "classes": ["watch", "warning", "alert", "recovery", "smRecovery", "vegRecovery"],
           "periods": [p.isoformat() for p in periods], "counties": counties}
    if dfc: doc["deficit"] = dfc; doc["source"]["knmi"] = "KNMI, daggegevens (evaporacion de referencia de Makkink y precipitacion), 13 estaciones; calculo de Dehesa Index"; doc["source"]["knmiUrl"] = "https://www.knmi.nl/nederland-nu/klimatologie/daggegevens"
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    last = {k: sum(v["v"][-1][:3]) for k, v in counties.items()}
    print("deficit KNMI:", dfc and (dfc["asOf"], dfc["cur"][-1], "max ano pasado", dfc["prev"] and max(v for v in dfc["prev"] if v is not None), "max 2018", [m for m in dfc["yearMax"] if m[0] == 2018]))
    print("nl-drought.json %s: %d regiones, %d decadas; superficie en sequia agricola (clases 1-3) por provincia: %s" % (doc["asOf"], len(counties), len(periods), dict(sorted(last.items(), key=lambda kv: -kv[1])[:6])))
    return 0
if __name__ == "__main__": sys.exit(main())

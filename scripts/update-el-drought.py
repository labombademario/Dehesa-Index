#!/usr/bin/env python3
"""Grecia: sequia por unidad regional (NUTS 3) -> data/el-drought.json
Indicador Combinado de Sequia (CDI) del European Drought Observatory (JRC / Copernicus EMS, licencia CC BY 4.0), el mismo que alimenta la ficha de cada pais
(scripts/update-eu-drought.py, que lo agrega por pais y por region NUTS 2: Grecia tiene 13). Aqui se calcula, para cada una de las 49 unidades regionales (NUTS 3 de
Eurostat/GISCO 2021, (c) EuroGeographics, reutilizacion libre citando la fuente), el porcentaje de la superficie (ponderado por cos(latitud)) en cada clase:
1 vigilancia (deficit de precipitacion), 2 aviso (+ deficit de humedad del suelo), 3 alerta (+ estres de vegetacion), 4 recuperacion, 5 recuperacion temporal
de la humedad del suelo, 6 recuperacion temporal de la vegetacion. Una imagen cada 10 dias, ultimos 3 anos.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-el-drought.py [--nc a.nc b.nc ...]"""
import datetime, importlib.util, json, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "el-drought.json"
spec = importlib.util.spec_from_file_location("eu", ROOT / "scripts" / "update-eu-drought.py"); EU = importlib.util.module_from_spec(spec); spec.loader.exec_module(EU)
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
        for f in json.loads((ROOT / "scripts" / "ref" / "nuts3-el.json").read_text(encoding="utf-8"))["features"]:
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
        if len(counties) != 49: raise ValueError("%d unidades en vez de 49" % len(counties))
    except Exception as e:
        print("FALLO:", e); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": periods[-1].isoformat(),
           "source": {"name": "European Drought Observatory (EDO), Combined Drought Indicator v4.1 - (c) European Commission, JRC; unidades regionales: Eurostat/GISCO NUTS 2021 (c) EuroGeographics",
                      "url": "https://drought.emergency.copernicus.eu/", "license": "CC BY 4.0 (EDO); GISCO: reutilizacion libre citando la fuente"},
           "unit": "% de la superficie con dato (ponderada por cos latitud)", "grid": "0.0417 deg (EPSG:4326)", "classes": ["watch", "warning", "alert", "recovery", "smRecovery", "vegRecovery"],
           "periods": [p.isoformat() for p in periods], "counties": counties}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    last = {k: sum(v["v"][-1][:3]) for k, v in counties.items()}
    print("el-drought.json %s: %d provincias, %d decadas; superficie en sequia agricola (clases 1-3) por provincia: %s" % (doc["asOf"], len(counties), len(periods), dict(sorted(last.items(), key=lambda kv: -kv[1])[:6])))
    return 0
if __name__ == "__main__": sys.exit(main())

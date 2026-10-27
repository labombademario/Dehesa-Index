#!/usr/bin/env python3
"""Sequia por provincia/condado (NUTS 3) de 14 paises -> data/eu-drought-nuts3/<CC>.json
Indicador Combinado de Sequia (CDI) del European Drought Observatory (JRC / Copernicus EMS, licencia CC BY 4.0), el mismo que alimenta la ficha de cada
pais (scripts/update-eu-drought.py, que lo agrega por pais y por region NUTS 2). Aqui se calcula, para cada unidad NUTS 3 de Eurostat/GISCO 2021
((c) EuroGeographics, reutilizacion libre citando la fuente), el porcentaje de su superficie (ponderado por cos(latitud)) en cada clase: 1 vigilancia
(deficit de precipitacion), 2 aviso (+ deficit de humedad del suelo), 3 alerta (+ estres de vegetacion). Las clases de recuperacion no se guardan.
Una imagen cada 10 dias, ultimos 3 anos. Italia, Croacia, Irlanda, Portugal, Grecia, Paises Bajos, Austria y Belgica tienen su propio fichero (update-<cc>-drought.py).
Si algo falla se conservan los ficheros anteriores. Uso: python3 scripts/update-eu-drought-nuts3.py [--nc a.nc b.nc ...] [--only DE,FR]"""
import datetime, importlib.util, json, shutil, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-drought-nuts3"
# pais -> unidades NUTS 3 que se esperan (minimo; se descartan las que quedan fuera del dominio del CDI)
EXPECT = {"DE": 400, "FR": 96, "RO": 42, "BG": 28, "SE": 21, "FI": 19, "HU": 20, "CZ": 14, "SI": 12, "DK": 11, "LT": 10, "SK": 8, "LV": 6, "EE": 5}
spec = importlib.util.spec_from_file_location("eu", ROOT / "scripts" / "update-eu-drought.py"); EU = importlib.util.module_from_spec(spec); spec.loader.exec_module(EU)
def compute(cc, feats, lon, lat, imgs, w1, mincells=6):
    """{id: {name, cells, coverage, v:[[vigilancia, aviso, alerta] por decada]}} de las unidades con dato en todas las decadas."""
    import shapely
    out = {}
    for f in feats:
        g = shapely.from_geojson(json.dumps(f["geometry"])); x0, y0, x1, y1 = g.bounds
        xi = np.where((lon >= x0) & (lon <= x1))[0]; yi = np.where((lat >= y0) & (lat <= y1))[0]
        if not len(xi) or not len(yi): continue
        near = False
        if int(shapely.contains_xy(g, *np.meshgrid(lon[xi[0]:xi[-1] + 1], lat[yi[0]:yi[-1] + 1])).sum()) < mincells:
            # unidad mas pequena que unas pocas celdas de 4 km (ciudades, islas): se toman las celdas cuyo centro queda a menos de 0,0417 / 0,0834 / 0,125 grados
            for k in (1, 2, 3):
                gb = g.buffer(0.0417 * k); bx = gb.bounds; xi = np.where((lon >= bx[0]) & (lon <= bx[2]))[0]; yi = np.where((lat >= bx[1]) & (lat <= bx[3]))[0]
                if not len(xi) or not len(yi): break
                m = shapely.contains_xy(gb, *np.meshgrid(lon[xi[0]:xi[-1] + 1], lat[yi[0]:yi[-1] + 1]))
                if m.sum() >= mincells: near = True; break
            else: m = None
            if not near: continue
        else: m = shapely.contains_xy(g, *np.meshgrid(lon[xi[0]:xi[-1] + 1], lat[yi[0]:yi[-1] + 1]))
        b = (yi[0], yi[-1] + 1, xi[0], xi[-1] + 1); rows = []; cov = None
        for img in imgs:
            s, cv = EU.shares(img[b[0]:b[1], b[2]:b[3]], m, w1[b[0]:b[1], b[2]:b[3]])
            if s is None: rows = None; break
            rows.append(s[:3]); cov = cv
        if rows is None: continue
        out[f["properties"]["id"]] = dict({"name": f["properties"]["name"], "cells": int(m.sum()), "coverage": cov, "v": rows}, **({"near": 1} if near else {}))
    return out
def main():
    args = sys.argv[1:]; only = None
    if "--only" in args: i = args.index("--only"); only = args[i + 1].split(","); del args[i:i + 2]
    try:
        if args[:1] == ["--nc"]: paths = [Path(p) for p in args[1:]]
        else: paths = []; [paths.append(Path("/tmp/" + u.rsplit("/", 1)[-1])) or paths[-1].write_bytes(EU.get(u, True)) for u in EU.files(datetime.date.today())]
        lon = lat = None; periods = []; imgs = []
        for p in paths:
            lo, la, t, a = EU.load(p)
            if lon is None: lon, lat = lo, la
            elif lo.shape != lon.shape or abs(lo[0] - lon[0]) > 1e-6 or abs(la[0] - lat[0]) > 1e-6: raise ValueError("%s: la malla cambio" % p.name)
            for i, d in enumerate(t): periods.append(d); imgs.append(a[i])
        order = np.argsort(periods); periods = [periods[i] for i in order]; imgs = [imgs[i] for i in order]
        if len(set(periods)) != len(periods) or len(periods) < 20: raise ValueError("decadas repetidas o insuficientes")
        w1 = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon))); res = {}
        for cc, n in EXPECT.items():
            if only and cc not in only: continue
            feats = json.loads((ROOT / "scripts" / "ref" / ("nuts3-%s.json" % cc.lower())).read_text(encoding="utf-8"))["features"]
            if len(feats) < n: raise ValueError("%s: el contorno trae %d unidades y se esperan %d" % (cc, len(feats), n))
            r = compute(cc, feats, lon, lat, imgs, w1)
            if len(r) < 0.9 * len(feats): raise ValueError("%s: solo %d de %d unidades con dato" % (cc, len(r), len(feats)))
            res[cc] = r; print(cc, len(r), "de", len(feats))
    except Exception as e:
        print("FALLO:", e); return 0 if OUT.exists() else 1
    tmp = OUT.with_name("eu-drought-nuts3.tmp"); shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir(parents=True)
    if only and OUT.exists():
        for f in OUT.glob("*.json"):
            if f.stem not in only: shutil.copy(f, tmp / f.name)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for cc, regs in res.items():
        doc = {"schemaVersion": 1, "generatedAt": now, "asOf": periods[-1].isoformat(), "country": cc,
               "source": {"name": "European Drought Observatory (EDO), Combined Drought Indicator v4.1 - (c) European Commission, JRC; unidades: Eurostat/GISCO NUTS 2021 (c) EuroGeographics",
                          "url": "https://drought.emergency.copernicus.eu/", "license": "CC BY 4.0 (EDO); GISCO: reutilizacion libre citando la fuente"},
               "unit": "% de la superficie con dato (ponderada por cos latitud)", "grid": "0.0417 deg (EPSG:4326)", "classes": ["watch", "warning", "alert"],
               "periods": [p.isoformat() for p in periods], "regions": regs}
        (tmp / (cc + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    shutil.rmtree(OUT, ignore_errors=True); tmp.rename(OUT)
    print("eu-drought-nuts3: %d paises, %d decadas hasta %s" % (len(res), len(periods), periods[-1])); return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Ingredientes del indicador de sequia en Europa (EDO, JRC / Copernicus EMS, CC BY 4.0) -> data/eu-drought-ind/<PAIS>.json
  sm   Anomalia del indice de humedad del suelo (smian, v3.0.2, rejilla ~1,8 km): desviaciones tipicas respecto a lo normal; negativo = suelo mas seco de lo habitual.
  spi3 Indice normalizado de precipitacion a 3 meses (SPI-3, E-OBS, rejilla 0,1 grados): negativo = trimestre mas seco de lo normal (<= -1 seco, <= -2 muy seco).
Por pais (poligonos Natural Earth, scripts/ref/ne-countries-eu.json) y por region NUTS 2 (scripts/ref/nuts2-eu.geojson): media ponderada por cos(latitud) de los pixeles con dato,
para las decadas del ano en curso y del anterior. Para la humedad del suelo se toma 1 de cada 3 pixeles en cada eje (suficiente para una media regional y 9 veces menos calculo).
Cada pais se escribe en su fichero; sm y spi3 son independientes (el SPI llega con unas semanas de retraso respecto a la humedad del suelo).
Si algo falla se conserva el directorio anterior. Uso: python3 scripts/update-eu-drought-indicators.py"""
import datetime, json, re, shutil, sys, urllib.request
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUTD = ROOT / "data" / "eu-drought-ind"
REF = ROOT / "scripts" / "ref" / "ne-countries-eu.json"
REF2 = ROOT / "scripts" / "ref" / "nuts2-eu.geojson"
B = "https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/"
IND = {"sm": (B + "EDO_Soil_Moisture_Index_Anomaly/ver3-0-2/", r"smian_m_eul_(\d{4})0101_\d{8}_t\.nc", "smian", 3),
       "spi3": (B + "EDO_E-OBS_Standardized_Precipitation_Index_SPI3/ver1-0-0/", r"spo03_m_edo_(\d{4})0101_\d{8}_t\.nc", "spo03", 1)}
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(url, binary=True):
    with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=600) as r:
        b = r.read(); return b if binary else b.decode("utf-8", "replace")
def years_files(base, rx, today):
    found = {int(m.group(1)): m.group(0) for m in re.finditer(r'href="(%s)"' % rx, get(base, False)) for m in [re.search(rx, m.group(1))]}
    ys = [y for y in (today.year - 1, today.year) if y in found]
    if not ys: raise ValueError("sin ficheros recientes en %s" % base)
    return [(y, base + found[y]) for y in ys]
def zones(lon, lat):
    import shapely
    Z = {}
    def add(key, name, cc, g):
        x0, y0, x1, y1 = g.bounds; xi = np.where((lon >= x0) & (lon <= x1))[0]; yi = np.where((lat >= y0) & (lat <= y1))[0]
        if not len(xi) or not len(yi): return
        X, Y = np.meshgrid(lon[xi[0]:xi[-1] + 1], lat[yi[0]:yi[-1] + 1]); m = shapely.contains_xy(g, X, Y)
        if m.any(): Z[key] = (name, cc, (yi[0], yi[-1] + 1, xi[0], xi[-1] + 1), m)
    for f in json.loads(REF.read_text())["features"]:
        add("C:" + f["properties"]["iso2"], f["properties"]["name"], f["properties"]["iso2"], shapely.from_geojson(json.dumps(f["geometry"])))
    for f in json.loads(REF2.read_text())["features"]:
        add("R:" + f["properties"]["id"], f["properties"]["name"], f["properties"]["cc"], shapely.from_geojson(json.dumps(f["geometry"])))
    return Z
def process(key):
    import netCDF4
    base, rx, var, stride = IND[key]; today = datetime.date.today(); dates = []; series = {}; Z = None; w = None
    for y, name in years_files(base, rx, today):
        p = Path("/tmp/%s_%d.nc" % (key, y)); p.write_bytes(get(name))
        d = netCDF4.Dataset(str(p)); v = d.variables[var]
        lon = np.asarray(d.variables["lon"][:], float)[::stride]; lat = np.asarray(d.variables["lat"][:], float)[::stride]
        if Z is None:
            Z = zones(lon, lat); w = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon)))
        t0 = datetime.date.fromisoformat(d.variables["time"].units.split("since")[1].split()[0])
        for i, dd in enumerate(d.variables["time"][:]):
            a = np.ma.filled(v[i].astype("float32") if v.ndim == 3 else v[i, 0].astype("float32"), np.nan)[::stride, ::stride]
            a = np.where(np.abs(a) < 20, a, np.nan); dates.append((t0 + datetime.timedelta(days=int(dd))).isoformat())
            for k, (nm, cc, (y0, y1, x0, x1), m) in Z.items():
                sub = a[y0:y1, x0:x1]; ok = m & ~np.isnan(sub); ww = w[y0:y1, x0:x1] * ok
                tot = float(ww.sum()); series.setdefault(k, []).append(round(float((np.nan_to_num(sub) * ww).sum() / tot), 2) if tot > 0 and ok.sum() >= 1 else None)
        d.close(); p.unlink()
    return dates, series, Z
def main():
    res = {}; Zall = {}
    for key in IND:
        try: res[key] = process(key)[:2]
        except Exception as e: print("FALLO", key, repr(e)[:300]); res[key] = None
    if not any(res.values()): return 1
    # nombres: se vuelven a leer del ultimo Z
    names = {}
    for f in json.loads(REF.read_text())["features"]: names["C:" + f["properties"]["iso2"]] = f["properties"]["name"]
    for f in json.loads(REF2.read_text())["features"]: names["R:" + f["properties"]["id"]] = f["properties"]["name"]
    tmp = OUTD.with_name("eu-drought-ind.tmp"); shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir(parents=True)
    ccs = {}
    for key, r in res.items():
        if not r: continue
        dates, series = r
        for k, v in series.items():
            if all(x is None for x in v): continue
            cc = k.split(":")[1] if k[0] == "C" else k.split(":")[1][:2]
            cc = {"GR": "EL", "GB": "UK"}.get(cc, cc) if k[0] == "C" else cc
            o = ccs.setdefault(cc, {}).setdefault(key, {"dates": dates, "country": None, "regions": {}})
            if k[0] == "C": o["country"] = v
            else: o["regions"][k.split(":")[1]] = {"name": names[k], "v": v}
    for cc, o in ccs.items():
        (tmp / (cc + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "desviaciones tipicas (z)", "ind": o}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    if len(ccs) < 20: print("FALLO: solo %d paises" % len(ccs)); return 1
    shutil.rmtree(OUTD, ignore_errors=True); tmp.rename(OUTD); print("escrito", len(ccs), "paises"); return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Alemania: humedad del suelo por Land, mes a mes desde 1991 -> data/de-soil-moisture.json
Fuente: Deutscher Wetterdienst (DWD), Climate Data Center, «grids_germany/monthly/soil_moist»: rejilla de 1 km con la humedad del suelo
media del mes bajo hierba y suelo franco-arenoso, en % de la capacidad de campo util (% nFK), modelo AMBAV. Datos abiertos del DWD
(Creative Commons BY 4.0, «Datenbasis: Deutscher Wetterdienst»).
Dehesa Index promedia las celdas de cada Land (limites de Natural Earth, dominio publico; rejilla en Gauss-Krüger zona 3, EPSG:31467) y de
Alemania entera, y calcula para cada mes del ano la media, el minimo y el maximo de 1991-2020. Por debajo de 50 % nFK las plantas empiezan a
sufrir; por debajo de 30 % hay estres hidrico fuerte (umbrales habituales del DWD). Se descargan solo los meses que faltan y los tres ultimos.
Uso: python3 scripts/update-de-soil-moisture.py"""
import datetime, gzip, json, re, sys, time, urllib.request
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "de-soil-moisture.json"
BASE = "https://opendata.dwd.de/climate_environment/CDC/grids_germany/monthly/soil_moist/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(u, t=180):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def grid(name):
    txt = gzip.decompress(get(BASE + name)).decode("latin-1").splitlines()
    hd = {}
    for i in range(6):
        k, v = txt[i].split()[:2]; hd[k.lower()] = float(v)
    a = np.array([[float(x) for x in ln.split()] for ln in txt[6:] if ln.strip()], dtype=np.float32)
    a[a == hd["nodata_value"]] = np.nan
    return hd, a
def mask(hd, shape):
    """codigo del Land de cada celda (o '') a partir de los centros de celda en EPSG:31467"""
    from pyproj import Transformer
    from shapely.geometry import shape as shp
    from shapely import contains_xy
    nr, nc = shape; cs = hd["cellsize"]
    xs = hd["xllcorner"] + (np.arange(nc) + 0.5) * cs; ys = hd["yllcorner"] + (nr - np.arange(nr) - 0.5) * cs   # la primera fila es la de arriba
    X, Y = np.meshgrid(xs, ys)
    lon, lat = Transformer.from_crs("EPSG:31467", "EPSG:4326", always_xy=True).transform(X, Y)
    out = np.full(shape, "", dtype="<U2")
    for f in json.loads((ROOT / "scripts" / "ref" / "ne-admin1-4c.json").read_text(encoding="utf-8"))["DEU"]:
        code = f["properties"]["iso_3166_2"].split("-")[1]; g = shp(f["geometry"])
        out[contains_xy(g, lon, lat)] = code
    return out
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    table = {m: {k: old["values"][k][i] for k in old.get("regions", [])} for i, m in enumerate(old.get("months", []))} if old.get("values") else {}
    try:
        names = sorted(re.findall(r'href="(grids_germany_monthly_soil_moist_(\d{6})\.asc\.gz)"', get(BASE).decode("latin-1")), key=lambda x: x[1])
    except Exception as e:
        print("FALLO listado:", e); return 0 if OUT.exists() else 1
    if len(names) < 300: print("FALLO: solo %d meses en el listado" % len(names)); return 0 if OUT.exists() else 1
    recent = set(n[1] for n in names[-3:])
    todo = [n for n in names if ("%s-%s" % (n[1][:4], n[1][4:])) not in table or n[1] in recent]
    M = None; codes = None; err = 0
    for fn, ym in todo:
        try: hd, a = grid(fn)
        except Exception as e: print("AVISO", fn, e); err += 1; continue
        if M is None or M.shape != a.shape:
            M = mask(hd, a.shape); codes = sorted(set(M[M != ""].tolist()))
            if len(codes) != 16: print("FALLO: la mascara tiene %d Laender" % len(codes)); return 0 if OUT.exists() else 1
        row = {}
        for c in codes:
            x = a[M == c]; x = x[~np.isnan(x)]
            row[c] = round(float(x.mean()), 1) if x.size > 20 else None
        x = a[M != ""]; x = x[~np.isnan(x)]; row["DE"] = round(float(x.mean()), 1)
        table["%s-%s" % (ym[:4], ym[4:])] = row
    months = sorted(table)
    if len(months) < 300 or err > max(3, len(todo) // 4): print("FALLO: %d meses, %d errores" % (len(months), err)); return 0 if OUT.exists() else 1
    regions = ["DE"] + sorted(k for k in table[months[-1]] if k != "DE")
    values = {k: [table[m].get(k) for m in months] for k in regions}
    clim = {}
    for k in regions:
        c = []
        for mo in range(1, 13):
            xs = [values[k][i] for i, m in enumerate(months) if int(m[5:]) == mo and 1991 <= int(m[:4]) <= 2020 and values[k][i] is not None]
            c.append([round(sum(xs) / len(xs), 1), min(xs), max(xs)] if len(xs) >= 25 else None)
        clim[k] = c
    for k in regions:
        bad = [v for v in values[k] if v is not None and not 0 <= v <= 130]
        if bad: print("FALLO valores fuera de rango en", k, bad[:3]); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": months[-1], "unit": "% nFK",
           "source": {"name": "Deutscher Wetterdienst (DWD), Climate Data Center, humedad del suelo mensual en rejilla de 1 km (AMBAV)", "url": BASE, "license": "CC BY 4.0 (Datenbasis: Deutscher Wetterdienst)"},
           "climatology": "1991-2020", "climFields": ["mean", "min", "max"], "regions": regions, "months": months, "values": values, "clim": clim}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    L = months[-1]; c = clim["DE"][int(L[5:]) - 1]
    print("de-soil-moisture.json: %d meses (%s..%s); %s Alemania %.1f %% nFK (media 1991-2020 %s); %d descargados, %d errores" % (len(months), months[0], L, L, values["DE"][-1], c[0] if c else None, len(todo), err))
    return 0
if __name__ == "__main__": sys.exit(main())

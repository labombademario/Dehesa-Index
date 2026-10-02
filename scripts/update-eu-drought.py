#!/usr/bin/env python3
"""Sequia en Europa: Indicador Combinado de Sequia (CDI) del European Drought Observatory (JRC / Copernicus EMS) -> data/eu-drought.json.
Fuente: NetCDF anuales con una imagen cada 10 dias (EPSG:4326, 0,0417 grados), licencia CC BY 4.0:
https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/EDO_Combined_Drought_Indicator/ver4-1-1/
Valores: 0 sin sequia, 1 vigilancia (deficit de precipitacion), 2 aviso (+ deficit de humedad del suelo), 3 alerta (+ estres de vegetacion),
4 recuperacion completa, 5 recuperacion temporal de la humedad, 6 recuperacion temporal de la vegetacion, 7 sin dato en el dominio, 8 fuera del dominio.
Por pais (poligonos Natural Earth, dominio publico, scripts/ref/ne-countries-eu.json) y para la UE-27: % de la superficie con dato (valores 0-6) en cada clase 1-6,
ponderado por cos(latitud) (los pixeles en grados no tienen el mismo area). El CDI cubre todo el territorio, no solo la tierra cultivada: es superficie total del pais.
Se guardan los ultimos 3 anos de decadas para comparar la misma decada con el ano anterior. Si algo falla (descarga, formato, dominio) el fichero anterior se conserva.
Uso: python3 scripts/update-eu-drought.py [--nc a.nc b.nc ...] [--out ruta]"""
import datetime, json, re, sys, urllib.request
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-drought.json"
REF = ROOT / "scripts" / "ref" / "ne-countries-eu.json"
BASE = "https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/EDO_Combined_Drought_Indicator/ver4-1-1/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
EU27 = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split()
YEARS = 3
def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180) as r:
        b = r.read(); return b if binary else b.decode("utf-8", "replace")
def files(today):
    """Ficheros NetCDF anuales del listado (los ultimos YEARS anos), mas reciente al final."""
    idx = get(BASE); found = {}
    for m in re.finditer(r'href="(cdinx_m_edo_(\d{4})0101_\d{8}_t\.nc)"', idx): found[int(m.group(2))] = m.group(1)
    ys = sorted(found)[-YEARS:]
    if not ys or ys[-1] < today.year - 1: raise ValueError("el listado no trae el ano en curso ni el anterior: %s" % sorted(found)[-3:])
    return [BASE + found[y] for y in ys]
def load(path):
    import netCDF4
    d = netCDF4.Dataset(str(path)); v = d.variables["cdinx"]
    if v.dtype != np.uint8 or v.ndim != 4: raise ValueError("formato inesperado de cdinx: %s %s" % (v.dtype, v.shape))
    lon = np.asarray(d.variables["lon"][:], dtype=float); lat = np.asarray(d.variables["lat"][:], dtype=float)
    base = datetime.date.fromisoformat(d.variables["time"].units.split("since")[1].split()[0])
    t = [base + datetime.timedelta(days=int(x)) for x in d.variables["time"][:]]
    a = np.asarray(v[:, 0, :, :]); d.close()
    return lon, lat, t, a
def masks(lon, lat):
    import shapely
    feats = json.loads(REF.read_text())["features"]; X, Y = np.meshgrid(lon, lat); out = {}; names = {}
    for f in feats:
        g = shapely.from_geojson(json.dumps(f["geometry"])); x0, y0, x1, y1 = g.bounds
        sel = (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1); m = np.zeros(X.shape, bool)
        if sel.any(): m[sel] = shapely.contains_xy(g, X[sel], Y[sel])
        out[f["properties"]["iso2"]] = m; names[f["properties"]["iso2"]] = f["properties"]["name"]
    return out, names
def shares(img, m, w):
    """% de superficie (ponderada) por clase 1..6 sobre los pixeles con dato (0..6) del pais; mas la cobertura con dato."""
    ok = m & (img <= 6); tot = float((w * ok).sum()); full = float((w * m).sum())
    if tot <= 0 or full <= 0: return None, 0.0
    return [round(100.0 * float((w * (ok & (img == c))).sum()) / tot, 1) for c in range(1, 7)], round(100.0 * tot / full, 1)
def main():
    args = sys.argv[1:]; outp = OUT
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1]); del args[i:i + 2]
    try:
        if args[:1] == ["--nc"]: paths = [Path(p) for p in args[1:]]
        else: paths = []; [paths.append(Path("/tmp/" + u.rsplit("/", 1)[-1])) or paths[-1].write_bytes(get(u, True)) for u in files(datetime.date.today())]
        lon = lat = None; periods = []; imgs = []
        for p in paths:
            lo, la, t, a = load(p)
            if lon is None: lon, lat = lo, la
            elif lo.shape != lon.shape or abs(lo[0] - lon[0]) > 1e-6 or abs(la[0] - lat[0]) > 1e-6: raise ValueError("%s: la malla cambio" % p.name)
            for i, d in enumerate(t): periods.append(d); imgs.append(a[i])
        if not periods: raise ValueError("sin imagenes")
        order = np.argsort(periods); periods = [periods[i] for i in order]; imgs = [imgs[i] for i in order]
        if len(set(periods)) != len(periods): raise ValueError("decadas repetidas")
        w1 = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon))); ms, names = masks(lon, lat)
        eu = np.zeros_like(ms["ES"])
        for c in EU27: eu |= ms[c]
        ms["EU27"] = eu; names["EU27"] = "European Union (27)"
        res = {}
        for c, m in ms.items():
            rows = []; cov = None
            for img in imgs:
                s, cv = shares(img, m, w1)
                rows.append(s); cov = cv
            if all(r is None for r in rows): continue
            if any(r is None for r in rows): raise ValueError("%s: periodos sin datos" % c)
            res[c] = {"name": names[c], "coverage": cov, "v": rows}
    except Exception as e: print("FALLO:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "European Drought Observatory (EDO), Combined Drought Indicator v4.1 - (c) European Commission, JRC", "url": "https://drought.emergency.copernicus.eu/", "license": "CC BY 4.0"},
           "unit": "% de la superficie con dato (ponderada por cos latitud)", "grid": "0.0417 deg (EPSG:4326)", "asOf": periods[-1].isoformat(),
           "classes": ["watch", "warning", "alert", "recovery", "smRecovery", "vegRecovery"], "periods": [p.isoformat() for p in periods], "countries": res}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(res), "ambitos,", len(periods), "decadas, ultima", doc["asOf"]); return 0
if __name__ == "__main__": sys.exit(main())

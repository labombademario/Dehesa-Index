#!/usr/bin/env python3
"""Temperatura y lluvia mensual de cada pais europeo frente a su media -> data/eu-climate.json
Fuente: NASA POWER (reanalisis MERRA-2, rejilla 0,5 x 0,625 grados), API regional mensual, parametros T2M (temperatura media a 2 m, grados C) y PRECTOTCORR (precipitacion corregida, mm/dia,
que se pasa a mm/mes). https://power.larc.nasa.gov/ (datos de NASA de uso libre citando la fuente). Resolucion gruesa: sirve para el pais, no para una parcela.
Por pais (poligonos Natural Earth, scripts/ref/ne-countries-eu.json) y UE-27: media de las celdas cuyo centro cae dentro del pais (ponderada por cos latitud; para paises sin ninguna
celda, la mas cercana a menos de 0,7 grados). Normal = media 1991-2020 de ese mes. Se publican los ultimos 36 meses completos con la temperatura, la lluvia y sus normales.
Lluvia: las celdas-mes con artefactos de la fuente (mas de 48 mm/dia de media o mas del triple de su maximo 1991-2020) se excluyen de la media; si pesan mas del 5 % del pais, la lluvia de ese mes queda vacia.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-eu-climate.py"""
import calendar, datetime, json, sys, time, urllib.request
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-climate.json"
REF = ROOT / "scripts" / "ref" / "ne-countries-eu.json"
API = "https://power.larc.nasa.gov/api/temporal/monthly/regional"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
EU27 = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split()
B0, B1 = 1991, 2020
def get(url):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[:140], last))
def tile(par, lo0, lo1, la0, la1, y1):
    q = "%s?parameters=%s&community=AG&longitude-min=%s&longitude-max=%s&latitude-min=%s&latitude-max=%s&format=json&start=%d&end=%d" % (API, par, lo0, lo1, la0, la1, B0, y1)
    time.sleep(1.0); return get(q)["features"]
def main():
    import shapely
    today = datetime.date.today(); y1 = today.year
    cells = {}   # (lon, lat) -> {par: {YYYYMM: v}}
    try:
        for lo0 in range(-25, 45, 10):
            for la0, la1 in ((34, 44), (44, 54), (54, 64), (64, 72)):
                for par in ("T2M", "PRECTOTCORR"):
                    for f in tile(par, lo0, lo0 + 10, la0, la1, y1):
                        x, y = f["geometry"]["coordinates"][:2]; cells.setdefault((round(x, 3), round(y, 3)), {})[par] = f["properties"]["parameter"][par]
        if len(cells) < 3000: raise ValueError("pocas celdas: %d" % len(cells))
        keys = sorted(cells); lon = np.array([k[0] for k in keys]); lat = np.array([k[1] for k in keys])
        months = sorted({m for c in cells.values() for p in c.values() for m in p if not m.endswith("13")})
        mi = {m: i for i, m in enumerate(months)}
        arr = {par: np.full((len(keys), len(months)), np.nan) for par in ("T2M", "PRECTOTCORR")}
        for ci, k in enumerate(keys):
            for par, d in cells[k].items():
                for m, v in d.items():
                    if m in mi and v is not None and v > -900: arr[par][ci, mi[m]] = v
        # artefactos de lluvia de la fuente (p. ej. 755 mm en un dia de enero de 2026 en Cerdena; ~15 mm/dia en toda Dinamarca en marzo de 2024): una celda-mes con mas
        # de 48 mm/dia de media o, despues de la normal, con mas del triple del maximo 1991-2020 de esa celda en ese mes, no entra en la media de lluvia de ese mes;
        # si las celdas excluidas pesan mas del 5 % del pais, la lluvia de ese mes del pais no se publica. La temperatura no se toca. Misma regla que update-region-grid-climate.py
        ylab0 = np.array([int(m[:4]) for m in months]); mon0 = np.array([int(m[4:]) for m in months]); P = arr["PRECTOTCORR"]
        MX = np.full((len(keys), 13), np.nan)
        for mm in range(1, 13):
            cols = np.where((mon0 == mm) & (ylab0 >= B0) & (ylab0 <= B1))[0]
            if len(cols): MX[:, mm] = np.nanmax(np.where(P[:, cols] <= 48, P[:, cols], np.nan), axis=1)
        FLAG = (P > 48) | ((ylab0[None, :] > B1) & (P > 3) & (P > 3 * MX[:, mon0]))
        FLAG &= np.isfinite(P)
        if FLAG.any(): print("artefactos de lluvia: %d celdas-mes excluidas (%d meses)" % (int(FLAG.sum()), int(FLAG.any(0).sum())))
        arr["PRECTOTCORR"] = np.where(FLAG, np.nan, P)
        # ultimo mes completo con dato en casi todas las celdas
        ok = [i for i in range(len(months)) if np.isfinite(arr["T2M"][:, i]).mean() > 0.9 and np.isfinite(arr["PRECTOTCORR"][:, i]).mean() > 0.9]
        if not ok: raise ValueError("sin meses completos")
        last = ok[-1]; sel = [i for i in ok if i > last - 36]
        feats = json.loads(REF.read_text())["features"]; geoms = {f["properties"]["iso2"]: shapely.from_geojson(json.dumps(f["geometry"])) for f in feats}; names = {f["properties"]["iso2"]: f["properties"]["name"] for f in feats}
        inside = {}
        for c, g in geoms.items():
            m = shapely.contains_xy(g, lon, lat)
            if not m.any():
                d = np.array([g.distance(shapely.Point(x, y)) for x, y in zip(lon, lat)]); j = int(d.argmin())
                if d[j] < 0.7: m = np.zeros(len(lon), bool); m[j] = True
            if m.any(): inside[c] = m
        eu = np.zeros(len(lon), bool)
        for c in EU27:
            if c in inside: eu |= inside[c]
        inside["EU27"] = eu; names["EU27"] = "European Union (27)"
        ylab = [int(m[:4]) for m in months]; mon = [int(m[4:]) for m in months]
        base = [i for i in range(len(months)) if B0 <= ylab[i] <= B1]
        res = {}
        for c, m in inside.items():
            w = np.cos(np.deg2rad(lat[m])); row = {}
            for par, key in (("T2M", "t"), ("PRECTOTCORR", "p")):
                a = arr[par][m]; ok2 = np.isfinite(a); ww = w[:, None] * ok2
                ser = np.where(ww.sum(0) > 0, (np.nan_to_num(a) * ww).sum(0) / np.where(ww.sum(0) > 0, ww.sum(0), 1), np.nan)
                if key == "p":
                    ser = ser * np.array([calendar.monthrange(ylab[i], mon[i])[1] for i in range(len(months))])
                    fw = (w[:, None] * FLAG[m]).sum(0) / w.sum()   # peso de las celdas con artefacto
                    ser = np.where(fw > 0.05, np.nan, ser)
                norm = {mm: float(np.nanmean([ser[i] for i in base if mon[i] == mm])) for mm in range(1, 13)}
                row[key] = [None if not np.isfinite(ser[i]) else round(float(ser[i]), 2 if key == "t" else 1) for i in sel]
                row[key + "n"] = [round(norm[mon[i]], 2 if key == "t" else 1) for i in sel]
            row["name"] = names[c]; row["cells"] = int(m.sum()); res[c] = row
        if len(res) < 35: raise ValueError("solo %d paises" % len(res))
        doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "source": {"name": "NASA POWER (MERRA-2 reanalysis)", "url": "https://power.larc.nasa.gov/", "license": "NASA open data; cite source"},
               "baseline": "%d-%d" % (B0, B1), "grid": "0.5 x 0.625 deg", "units": {"t": "C", "p": "mm/month"}, "months": [months[i][:4] + "-" + months[i][4:] for i in sel], "countries": res}
    except Exception as e: print("FALLO:", repr(e)[:300]); return 1
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT.name, len(res), "ambitos, ultimo mes", doc["months"][-1], "celdas", len(cells)); return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Austria: sequia por Land (balance hidrico climatico SPEI de GeoSphere Austria) y estado de las aguas subterraneas -> data/at-drought.json
1) GeoSphere Austria, WINFORE v2 (rejilla diaria de 1 km): SPEI30 y SPEI90, indice estandarizado de precipitacion menos evapotranspiracion
   de referencia en 30 y 90 dias (con peso decreciente). Por debajo de -1 es seco, de -1,5 muy seco y de -2 extremadamente seco.
   Dehesa Index calcula, para cada Land (limites de Natural Earth, dominio publico) y para Austria, el SPEI medio y el porcentaje de la
   superficie en cada clase. Licencia: CC BY 4.0 (datos de GeoSphere Austria accesibles sin registro).
   Historico: un dia cada 7 hacia atras hasta 2 anos en la primera pasada; despues se anaden los dias que falten.
2) BMLUK, «Grundwasser Aktuell» (OGC API Features de gis.lfrz.gv.at): ultimo nivel de unas 230 estaciones de aguas subterraneas con
   teletransmision, con el color del mapa oficial. Dehesa Index cuenta las estaciones por Land y por clase. Licencia: CC BY 4.0 (data.gv.at).
Uso: python3 scripts/update-at-drought.py"""
import datetime, io, json, sys, tempfile, time, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "at-drought.json"
WIN = "https://dataset.api.hub.geosphere.at/v1/grid/historical/winfore-v2-1d-1km"
GW = "https://gis.lfrz.gv.at/api/geodata/i000501/ogc/features/v1/collections/i000501:grundwasser_aktuell/items?f=json&limit=2000"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
L = {"AT-1": "B", "AT-2": "K", "AT-3": "NO", "AT-4": "OO", "AT-5": "S", "AT-6": "ST", "AT-7": "T", "AT-8": "V", "AT-9": "W"}
LN = {"Burgenland": "B", "Kärnten": "K", "Niederösterreich": "NO", "Oberösterreich": "OO", "Salzburg": "S", "Steiermark": "ST", "Tirol": "T", "Vorarlberg": "V", "Wien": "W"}
GWC = {"#DF0101": "veryLow", "#FE9A2E": "low", "#58FA58": "normal", "#0080FF": "high", "#0000FF": "veryHigh"}
CUT = [("dry", -1.0), ("veryDry", -1.5), ("extreme", -2.0)]
def get(u, t=240):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def grid(day):
    import netCDF4
    b = get(WIN + "?" + urllib.parse.urlencode({"parameters": "SPEI30,SPEI90", "start": day, "end": day, "bbox": "46.1,9.3,49.2,17.4", "output_format": "netcdf"}))
    with tempfile.NamedTemporaryFile(suffix=".nc") as f:
        f.write(b); f.flush(); ds = netCDF4.Dataset(f.name)
        out = {k: np.ma.filled(ds.variables[k][0].astype("f4"), np.nan) for k in ("SPEI30", "SPEI90")}
        lat = np.array(ds.variables["lat"][:]); lon = np.array(ds.variables["lon"][:]); ds.close()
    return out, lat, lon
def mask(lat, lon):
    from shapely.geometry import shape
    from shapely import contains_xy
    out = np.full(lat.shape, "", dtype="<U2")
    for f in json.loads((ROOT / "scripts" / "ref" / "ne-admin1-nlat.json").read_text(encoding="utf-8"))["AUT"]:
        out[contains_xy(shape(f["geometry"]), lon, lat)] = L[f["properties"]["iso_3166_2"]]
    return out
def stats(a):
    v = a[~np.isnan(a)]
    if v.size == 0: return None
    s = {"mean": round(float(v.mean()), 2), "n": int(v.size)}
    for k, c in CUT: s[k] = round(100.0 * float((v <= c).sum()) / v.size, 1)
    return s
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    try:
        meta = json.loads(get(WIN + "/metadata"))
        last = meta["end_time"][:10]
        G, lat, lon = grid(last); M = mask(lat, lon)
        if (M != "").sum() < 70000: raise ValueError("solo %d celdas dentro de Austria" % (M != "").sum())
        lands = {}
        for code in L.values():
            sel = M == code; lands[code] = {k.lower(): stats(np.where(sel, G[k], np.nan)) for k in ("SPEI30", "SPEI90")}
        nat = {k.lower(): stats(np.where(M != "", G[k], np.nan)) for k in ("SPEI30", "SPEI90")}
        hist = {h["date"]: h for h in old.get("history", [])}
        todo = [last]; d0 = datetime.date.fromisoformat(last)
        if len(hist) < 20:
            todo += [(d0 - datetime.timedelta(days=7 * i)).isoformat() for i in range(1, 105)]
        else:
            lastH = max(hist); d = datetime.date.fromisoformat(lastH) + datetime.timedelta(days=1)
            while d < d0: todo.append(d.isoformat()); d += datetime.timedelta(days=1)
        for day in todo:
            if day in hist and day != last: continue
            try: g = G if day == last else grid(day)[0]
            except Exception as e: print("AVISO", day, e); continue
            s90 = stats(np.where(M != "", g["SPEI90"], np.nan)); s30 = stats(np.where(M != "", g["SPEI30"], np.nan))
            if s90: hist[day] = {"date": day, "spei90": s90["mean"], "dry90": s90["dry"], "spei30": s30["mean"] if s30 else None}
        hist = [hist[k] for k in sorted(hist)][-800:]
    except Exception as e:
        print("AVISO WINFORE:", e)
        if not old.get("lands"): return 0 if OUT.exists() else 1
        last, lands, nat, hist = old["asOf"], old["lands"], old["austria"], old.get("history", [])
    gw = old.get("groundwater")
    try:
        fs = json.loads(get(GW))["features"]; per = {c: {} for c in L.values()}; tot = {}; dates = []
        for f in fs:
            p = f["properties"]; c = GWC.get((p.get("farbcode") or "").upper()); land = LN.get(p.get("bundesland") or "")
            if not c or p.get("transp"): continue
            tot[c] = tot.get(c, 0) + 1; dates.append(p.get("zeitpunkt") or "")
            if land: per[land][c] = per[land].get(c, 0) + 1
        if sum(tot.values()) < 100: raise ValueError("solo %d estaciones con clase" % sum(tot.values()))
        gw = {"date": max(dates)[:10], "stations": sum(tot.values()), "classes": tot, "lands": per}
    except Exception as e: print("AVISO aguas subterraneas:", e)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": last,
           "source": {"name": "GeoSphere Austria, WINFORE v2 (SPEI30, SPEI90); BMLUK, Grundwasser Aktuell", "url": "https://data.hub.geosphere.at/dataset/winfore-v2-1d-1km",
                      "gwUrl": "https://www.data.gv.at/", "license": "CC BY 4.0 (GeoSphere Austria; BMLUK)"},
           "thresholds": dict(CUT), "lands": lands, "austria": nat, "history": hist}
    if gw: doc["groundwater"] = gw
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("at-drought.json %s: Austria SPEI90 %s (seco %s %%), SPEI30 %s; %d dias de historico; aguas subterraneas %s" % (
        last, nat["spei90"]["mean"], nat["spei90"]["dry"], nat["spei30"]["mean"], len(hist), gw and (gw["date"], gw["classes"])))
    print({k: (v["spei90"]["mean"], v["spei90"]["dry"]) for k, v in lands.items() if v.get("spei90")})
    return 0
if __name__ == "__main__": sys.exit(main())

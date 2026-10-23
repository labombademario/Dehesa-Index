#!/usr/bin/env python3
"""Superficie de cultivos de EE. UU. por estado segun el Cropland Data Layer (USDA NASS, clasificacion por satelite, servicio CropScape) -> data/us-nass-cdl-stats.json (formato *-stats.json).
ES UNA ESTIMACION POR SATELITE, no una cifra de encuesta oficial: se suman los pixeles clasificados de cada cultivo (30 m, 10 m desde 2024). Las cifras oficiales de superficie siguen siendo las de NASS Quick Stats.
Descarga incremental: cada (estado, ano) se pide una vez y se guarda en data/us-nass-cdl-cache.json; cada ejecucion solo pide lo que falta (primero el ano mas reciente en todos los estados) y para al agotar el tiempo.
Serie por estado y cultivo; la serie nacional suma los 48 estados y solo se publica cuando estan todos en ese ano.
Uso: update-us-nass-cdl.py [--local DIR] [--out DIR]   (--local: solo para pruebas)"""
import csv, io, json, re, sys, time
from datetime import datetime, timezone
from pathlib import Path
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
API = "https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLStat?year=%d&fips=%s&format=csv"
PAGE = "https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php"
SG = "USDA NASS, Cropland Data Layer (CropScape)"
STATES = {"01": "Alabama", "04": "Arizona", "05": "Arkansas", "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware", "12": "Florida", "13": "Georgia", "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky",
          "22": "Louisiana", "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota", "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada", "33": "New Hampshire", "34": "New Jersey",
          "35": "New Mexico", "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota", "47": "Tennessee",
          "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"}
CROPS = ["Corn", "Soybeans", "Winter Wheat", "Spring Wheat", "Durum Wheat", "Cotton", "Rice", "Sorghum", "Alfalfa", "Sunflower", "Peanuts", "Barley", "Oats", "Canola", "Potatoes", "Sugarbeets", "Dry Beans", "Other Hay/Non Alfalfa"]
FIRST = 2008
BUDGET_S = 50 * 60
NOTE = "Estimación por satélite (Cropland Data Layer de NASS): suma de píxeles clasificados, no una cifra de encuesta oficial."
def fetch(fips, year):
    """{cultivo: acres} de un estado y ano, o None si CropScape no responde o no tiene ese ano."""
    x = U.get(API % (year, fips), tries=2, timeout=240).decode("utf-8", "replace")
    m = re.search(r"<returnURL>([^<]+)</returnURL>", x)
    if not m: return None
    rows = list(csv.reader(io.StringIO(U.get(m.group(1).replace("&amp;", "&"), tries=2, timeout=240).decode("utf-8-sig", "replace"))))
    hs = [h.strip().lower() for h in rows[0]]
    if "category" not in hs or "acreage" not in hs: raise ValueError("CSV sin Category/Acreage: %r" % rows[0])
    ci, ai = hs.index("category"), hs.index("acreage"); out = {}
    for r in rows[1:]:
        if len(r) > max(ci, ai) and r[ci].strip() in CROPS:
            v = U.fnum(r[ai]); 
            if v is not None: out[r[ci].strip()] = round(v, 1)
    return out
def latest_year(probe=fetch):
    y = datetime.now(timezone.utc).year
    for yy in range(y, y - 3, -1):
        try:
            if probe("19", yy): return yy
        except Exception as e: U.log("sin CDL de", yy, repr(e)[:80])
    raise ValueError("no hay ningun ano reciente en CropScape")
def pending(cache, last):
    """(ano, fips) que faltan, primero el ano mas reciente."""
    return [(y, f) for y in range(last, FIRST - 1, -1) for f in STATES if str(y) not in cache.get(f, {})]
def build(cache):
    ser = []; total = {}
    for f, name in STATES.items():
        for c in CROPS:
            pts = [(y, d[c]) for y, d in cache.get(f, {}).items() if c in d]
            if len(pts) < 5: continue
            s = U.mk_series("us-cdl-%s-%s-a" % (U.slug(c, 22), f), "crops", "Cropland Data Layer (satellite estimate): %s acreage, %s" % (c, name), "acres", "annual", pts, SG, min_points=5, max_age_years=3, note=NOTE)
            if s and s["latest"] >= 1000: ser.append(s)
    for c in CROPS:
        pts = []
        for y in sorted({y for f in STATES for y in cache.get(f, {})}):
            if all(str(y) in cache.get(f, {}) for f in STATES): pts.append((y, sum(cache[f][y].get(c, 0.0) for f in STATES)))
        s = U.mk_series("us-cdl-%s-us-a" % U.slug(c, 22), "crops", "Cropland Data Layer (satellite estimate): %s acreage, 48 contiguous states (sum)" % c, "acres", "annual", pts, SG, min_points=5, max_age_years=3, note=NOTE)
        if s: ser.append(s)
    return ser
def main():
    local, outdir = U.parse_args()
    d = outdir or ROOT / "data"; out = d / "us-nass-cdl-stats.json"; cp = d / "us-nass-cdl-cache.json"
    rc = 0
    try:
        cache = json.loads(cp.read_text()) if cp.exists() else {}
        last = latest_year(); U.log("ultimo ano de CDL:", last)
        todo = pending(cache, last); U.log("pendientes:", len(todo)); t0 = time.time(); got = 0; fail = 0
        for y, f in todo:
            if time.time() - t0 > BUDGET_S: U.log("tiempo agotado; el resto se pide en la siguiente ejecucion"); break
            try:
                r = fetch(f, y)
                if r is None: raise ValueError("sin respuesta")
                if not r: raise ValueError("sin cultivos")
                cache.setdefault(f, {})[str(y)] = r; got += 1
            except Exception as e:
                fail += 1; U.log("fallo %s %d: %s" % (STATES[f], y, repr(e)[:90]))
                if fail > 25 and got == 0: raise ValueError("CropScape no responde")
            time.sleep(0.5)
        U.log("descargados: %d, fallos: %d" % (got, fail))
        ser = build(cache); ids = [s["id"] for s in ser]
        if len(ser) < 100: raise ValueError("solo %d series (se esperan >=100)" % len(ser))
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos")
        U.write_json(cp, cache)
        U.write_json(out, U.stats_doc("USDA National Agricultural Statistics Service, Cropland Data Layer", PAGE, "US Government work (public domain); credit: USDA NASS Cropland Data Layer", ser))
        U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-nass-cdl-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

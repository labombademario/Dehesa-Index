#!/usr/bin/env python3
"""Sequia en Canada: Canadian Drought Monitor (Agriculture and Agri-Food Canada y socios) -> data/canada-drought.json.
Fuente: poligonos mensuales de "areas of drought" en GeoJSON (EPSG:3857), un fichero por clase D0-D4, licencia Open Government Licence - Canada:
https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/
Las clases son acumulativas (D1 incluye D2...), igual que el US Drought Monitor: D0 anormalmente seco, D1 moderada, D2 severa, D3 extrema, D4 excepcional.
Por provincia y territorio (poligonos Natural Earth 1:50m, dominio publico, scripts/ref/ne-provinces-ca.json): % de la SUPERFICIE TOTAL de la provincia
(tierra y agua interior, no solo la agricola) que cae en cada clase; el area se calcula en una proyeccion conica equivalente de Albers, no en grados ni en Mercator.
Son cifras aproximadas: la frontera de Natural Earth esta generalizada y no coincide con la de la fuente. Ultimos MONTHS meses; los meses ya guardados se reutilizan
salvo los 2 ultimos (la fuente puede revisarlos). Si algo falla el fichero anterior se conserva.
Uso: python3 scripts/update-canada-drought.py [--fixture mes=ruta.json.gz] [--out ruta]"""
import calendar, datetime, gzip, io, json, math, re, sys, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "canada-drought.json"
REF = ROOT / "scripts" / "ref" / "ne-provinces-ca.json"
BASE = "https://agriculture.canada.ca/atlas/data_donnees/canadianDroughtMonitor/data_donnees/geoJSON/areasofDrought/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
MONTHS = 18
CLASSES = ["D0", "D1", "D2", "D3", "D4"]
CODES = {"Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB", "New Brunswick": "NB", "Newfoundland and Labrador": "NL", "Nova Scotia": "NS", "Northwest Territories": "NT",
         "Nunavut": "NU", "Ontario": "ON", "Prince Edward Island": "PE", "Québec": "QC", "Saskatchewan": "SK", "Yukon": "YT"}
R = 6378137.0
# Albers equal-area conic sobre la esfera (paralelos 50 y 70, origen 40 N, 96 O): conserva areas, que es lo unico que se necesita
_p1, _p2, _p0, _l0 = [math.radians(x) for x in (50, 70, 40, -96)]
_n = (math.sin(_p1) + math.sin(_p2)) / 2; _C = math.cos(_p1) ** 2 + 2 * _n * math.sin(_p1)
_r0 = math.sqrt(_C - 2 * _n * math.sin(_p0)) / _n
def albers(lon, lat):
    l, p = math.radians(lon), math.radians(lat); r = math.sqrt(_C - 2 * _n * math.sin(p)) / _n; t = _n * (l - _l0)
    return R * r * math.sin(t), R * (_r0 - r * math.cos(t))
def merc_to_lonlat(x, y): return math.degrees(x / R), math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)
def tr_ll(xs, ys, zs=None):
    o = [albers(a, b) for a, b in zip(xs, ys)]; return [p[0] for p in o], [p[1] for p in o]
def tr_merc(xs, ys, zs=None):
    o = [albers(*merc_to_lonlat(a, b)) for a, b in zip(xs, ys)]; return [p[0] for p in o], [p[1] for p in o]
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=240) as r: return r.read()
def listing(url): return re.findall(r'href="([^"?/][^"]*/?)"', get(url).decode("utf-8", "replace"))
def month_files(ym):
    """{clase: FeatureCollection} de un mes ('2608'): zip unico o carpeta con un GeoJSON por clase."""
    yy = 2000 + int(ym[:2]); names = listing(BASE + "%d/" % yy); out = {}
    zipn = [n for n in names if n.startswith("cdm_%s_" % ym) and n.endswith(".zip")]; dirn = [n for n in names if n.startswith("cdm_%s_" % ym) and n.endswith("/")]
    if zipn:
        z = zipfile.ZipFile(io.BytesIO(get(BASE + "%d/%s" % (yy, zipn[0]))))
        for n in z.namelist():
            m = re.search(r"_D([0-4])_", n)
            if m and n.lower().endswith("json"): out["D" + m.group(1)] = json.loads(z.read(n))
    elif dirn:
        for n in listing(BASE + "%d/%s" % (yy, dirn[0])):
            m = re.search(r"_D([0-4])_", n)
            if m and n.lower().endswith("json"): out["D" + m.group(1)] = json.loads(get(BASE + "%d/%s%s" % (yy, dirn[0], n)))
    return out
def provinces():
    from shapely.geometry import shape
    from shapely.ops import transform
    d = json.loads(REF.read_text(encoding="utf-8")); out = {}
    for f in d["features"]:
        n = f["properties"]["name"]
        if n in CODES: g = transform(tr_ll, shape(f["geometry"]).buffer(0)); out[CODES[n]] = (n, g)
    if len(out) != 13: raise ValueError("faltan provincias en la referencia: %d" % len(out))
    return out
def shares(files, prov):
    """{codigo: [% D0, D1, D2, D3, D4]} de la superficie total de cada provincia."""
    from shapely.geometry import shape
    from shapely.ops import transform, unary_union
    geo = {}
    for c in CLASSES:
        fc = files.get(c)
        if fc is None: raise ValueError("falta la clase " + c)
        gs = [transform(tr_merc, shape(f["geometry"]).buffer(0)) for f in fc["features"] if f.get("geometry")]
        geo[c] = unary_union(gs) if gs else None
    out = {}
    for code, (_, pg) in prov.items():
        row = []
        for c in CLASSES:
            g = geo[c]; a = 0.0 if g is None or not g.intersects(pg) else g.intersection(pg).area
            row.append(round(min(100.0, 100.0 * a / pg.area), 1))
        out[code] = row
    return out
def last_day(ym): y, m = 2000 + int(ym[:2]), int(ym[2:]); return datetime.date(y, m, calendar.monthrange(y, m)[1]).isoformat()
def recent_months(today):
    out = []; y, m = today.year, today.month
    for _ in range(MONTHS + 2):
        out.append("%02d%02d" % (y % 100, m)); m -= 1
        if m == 0: y, m = y - 1, 12
    return out
def main():
    args = sys.argv[1:]; outp = OUT; fx = {}
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1]); del args[i:i + 2]
    while "--fixture" in args:
        i = args.index("--fixture"); k, p = args[i + 1].split("=", 1); del args[i:i + 2]
        raw = Path(p).read_bytes(); d = json.loads((gzip.decompress(raw) if p.endswith(".gz") else raw).decode("utf-8"))
        fx[k] = {("D" + re.search(r"_D([0-4])_", n).group(1)): v for n, v in d["files"].items()}
    try:
        prov = provinces(); old = {}
        if outp.exists() and not fx:
            try:
                o = json.loads(outp.read_text(encoding="utf-8"))
                old = {p: {c: v["v"][i] for c, v in o["provinces"].items()} for i, p in enumerate(o["periods"])}
            except Exception: old = {}
        got = {}
        if fx:
            for ym, files in fx.items(): got[last_day(ym)] = shares(files, prov)
        else:
            try: have = set(listing(BASE)) | {y for yy in range(2024, datetime.date.today().year + 1) for y in listing(BASE + "%d/" % yy)}
            except Exception as e: raise RuntimeError("no se pudo leer el listado: %r" % e)
            ms = recent_months(datetime.date.today()); avail = [m for m in ms if any(h.startswith("cdm_%s_" % m) for h in have)]
            if len(avail) < 6: raise ValueError("el listado trae pocos meses: %s" % avail)
            keep = sorted(avail, reverse=True)[:MONTHS]
            for k, ym in enumerate(keep):
                d = last_day(ym)
                if d in old and k >= 2: got[d] = old[d]; continue
                try: got[d] = shares(month_files(ym), prov); print("mes", ym, "calculado")
                except Exception as e: print("AVISO sin mes", ym, repr(e)); 
                if d not in got and d in old: got[d] = old[d]
        if len(got) < (1 if fx else 6): raise ValueError("pocos meses: %d" % len(got))
    except Exception as e: print("FALLO:", e); return 1
    periods = sorted(got)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Canadian Drought Monitor, Agriculture and Agri-Food Canada and partners", "url": "https://agriculture.canada.ca/en/agricultural-production/weather/canadian-drought-monitor", "license": "Open Government Licence - Canada"},
           "unit": "% of the province's total area (land and inland water), cumulative: each class includes the more severe ones", "asOf": periods[-1], "classes": CLASSES, "periods": periods,
           "provinces": {c: {"name": prov[c][0], "v": [got[p][c] for p in periods]} for c in sorted(prov)}}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(periods), "meses, ultimo", periods[-1]); return 0
if __name__ == "__main__": sys.exit(main())

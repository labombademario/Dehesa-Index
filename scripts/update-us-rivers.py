#!/usr/bin/env python3
"""Caudal de los rios de las barcazas de grano de EE. UU. (Mississippi, Illinois y Ohio), diario, del USGS (Water Services, dominio publico, sin clave).
Escribe data/us-markets/rivers.json y data/us-markets/rivers-log.txt.
 - Fuente: https://waterservices.usgs.gov/nwis/dv/ , parametro 00060 (caudal medio diario, pies cubicos por segundo), desde 2000 (o desde que existe la estacion).
   Los valores provisionales del USGS se publican tal cual (el USGS los revisa despues; la siguiente ejecucion los reemplaza).
 - Lo unico calculado: (1) media de los ultimos 7 dias con dato; (2) su percentil frente a todos los caudales diarios del mismo mes del calendario en los años
   anteriores al actual; (3) para el grafico, los percentiles 10, 50 y 90 de cada dia del año (ventana de +-7 dias) en esos mismos años. Nada se rellena:
   un dia sin dato no aparece.
 - Por que importa: con el rio bajo las barcazas cargan menos (menos calado) y el flete sube; con el rio muy alto se cierran esclusas. No es un aviso de navegacion
   (eso lo da el Cuerpo de Ingenieros y el NWS).
Uso: python3 scripts/update-us-rivers.py [--fixture fichero.json]  (con --fixture lee ese JSON del USGS en lugar de la red; para los tests)."""
import bisect, datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-markets"
# estacion, rio, tramo (para ordenar de aguas arriba a aguas abajo)
STATIONS = [
    ("05420500", "Mississippi", "Clinton, IA"),
    ("05586100", "Illinois", "Valley City, IL"),
    ("07010000", "Mississippi", "St. Louis, MO"),
    ("07020500", "Mississippi", "Chester, IL"),
    ("07022000", "Mississippi", "Thebes, IL"),
    ("03612600", "Ohio", "Olmsted, IL"),
    ("07032000", "Mississippi", "Memphis, TN"),
    ("07289000", "Mississippi", "Vicksburg, MS"),
]
URL = "https://waterservices.usgs.gov/nwis/dv/?format=json&sites=%s&parameterCd=00060&statCd=00003&startDT=2000-01-01"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)"}
KEEP_DAYS = 760          # serie diaria publicada: unos dos años
MIN_YEARS = 8            # años completos de historia para dar percentiles
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (OUT / "rivers-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def http(url, tries=4, timeout=180):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def parse(doc):
    """JSON del USGS -> {estacion: {'AAAA-MM-DD': cfs}}"""
    out = {}
    for ts in doc["value"]["timeSeries"]:
        if ts["variable"]["variableCode"][0]["value"] != "00060": continue
        site = ts["sourceInfo"]["siteCode"][0]["value"]; nd = float(ts["variable"].get("noDataValue", -999999))
        for blk in ts["values"]:
            for v in blk["value"]:
                try: x = float(v["value"])
                except (TypeError, ValueError): continue
                if x == nd or x < 0: continue
                out.setdefault(site, {})[v["dateTime"][:10]] = x
    return out


def pct_rank(sorted_vals, x):
    """percentil (0-100) de x dentro de sorted_vals"""
    if not sorted_vals: return None
    lo = bisect.bisect_left(sorted_vals, x); hi = bisect.bisect_right(sorted_vals, x)
    return round((lo + hi) / 2.0 / len(sorted_vals) * 100, 1)


def quant(sorted_vals, q):
    if not sorted_vals: return None
    i = q * (len(sorted_vals) - 1); a = int(i); b = min(a + 1, len(sorted_vals) - 1)
    return sorted_vals[a] + (sorted_vals[b] - sorted_vals[a]) * (i - a)


def station(site, river, reach, days, today):
    if not days: return None
    ks = sorted(days); last = ks[-1]
    if (today - datetime.date.fromisoformat(last)).days > 20: log("aviso: %s sin dato desde %s; se publica sin percentil" % (site, last))
    this_year = int(last[:4])
    hist = {k: v for k, v in days.items() if int(k[:4]) < this_year}
    years = sorted({k[:4] for k in hist})
    full = [y for y in years if sum(1 for k in hist if k.startswith(y)) >= 330]
    recent = [days[k] for k in ks[-7:] if (datetime.date.fromisoformat(last) - datetime.date.fromisoformat(k)).days < 7]
    avg7 = sum(recent) / len(recent) if recent else None
    pc = None
    if len(full) >= MIN_YEARS and avg7 is not None:
        month = [v for k, v in hist.items() if k[5:7] == last[5:7]]; month.sort()
        pc = pct_rank(month, avg7)
    # climatologia por dia del año (ventana +-7), años completos anteriores al actual
    clim = None
    if len(full) >= MIN_YEARS:
        bydoy = {}
        for k, v in hist.items():
            if k[:4] not in full: continue
            d = datetime.date.fromisoformat(k); j = min(d.timetuple().tm_yday, 365)
            bydoy.setdefault(j, []).append(v)
        clim = []
        for j in range(1, 366):
            w = []
            for o in range(-7, 8): w += bydoy.get((j - 1 + o) % 365 + 1, [])
            w.sort()
            clim.append([round(quant(w, .1)), round(quant(w, .5)), round(quant(w, .9))] if len(w) >= 50 else None)
    cut = (datetime.date.fromisoformat(last) - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    return {"id": site, "river": river, "reach": reach, "unit": "ft3/s", "first": ks[0], "last": last, "lastValue": days[last],
            "avg7": round(avg7) if avg7 is not None else None, "pctMonth": pc, "histYears": [full[0], full[-1]] if full else None, "nYears": len(full),
            "points": [[k, round(days[k])] for k in ks if k >= cut], "clim": clim}


def main():
    doc = json.load(open(sys.argv[sys.argv.index("--fixture") + 1])) if "--fixture" in sys.argv else json.loads(http(URL % ",".join(s[0] for s in STATIONS)))
    data = parse(doc); today = datetime.date.today()
    if "--fixture" in sys.argv: today = datetime.date.fromisoformat(max(max(v) for v in data.values()))
    out = []
    for site, river, reach in STATIONS:
        st = station(site, river, reach, data.get(site, {}), today)
        if st: out.append(st); log("%s %s %s: %s cfs el %s, media 7 dias %s, percentil del mes %s (%d años)" % (site, river, reach, st["lastValue"], st["last"], st["avg7"], st["pctMonth"], st["nYears"]))
        else: log("aviso: %s sin datos" % site)
    if len(out) < 5 or not any(s["id"] == "07010000" for s in out): raise SystemExit("FALLO: el USGS devolvio datos insuficientes (%d estaciones)" % len(out))
    latest = max(s["last"] for s in out)
    if "--fixture" not in sys.argv and (today - datetime.date.fromisoformat(latest)).days > 10: raise SystemExit("FALLO: el ultimo dato del USGS (%s) es demasiado antiguo" % latest)
    res = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestDate": latest,
           "source": {"id": "usgs_water", "name": "U.S. Geological Survey, National Water Information System, daily values (discharge, parameter 00060)", "url": "https://waterdata.usgs.gov/nwis", "license": "US public domain (credit USGS)"},
           "unit": "ft3/s", "pointFields": ["date", "dischargeCfs"], "climFields": ["p10", "p50", "p90"], "stations": out}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "rivers.json").write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("rivers.json: %d estaciones, ultimo dia %s" % (len(out), latest))


if __name__ == "__main__":
    main()

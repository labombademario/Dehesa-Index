#!/usr/bin/env python3
"""Incendios forestales por pais: superficie quemada y numero de incendios, anual y del año en curso -> data/forest-fires.json
Fuente: EFFIS (European Forest Fire Information System) y GWIS (Global Wildfire Information System), Copernicus / JRC.
  UE-27, Reino Unido y Suiza: sistema EFFIS, desde 2006.  EE. UU., Canada, Australia, Argentina, Chile y Uruguay: sistema GWIS, desde 2012.
Son estimaciones por satelite (perimetros quemados cartografiados), NO las estadisticas nacionales de los servicios de extincion: no son
comparables entre EFFIS y GWIS ni con las cifras oficiales de cada pais. El numero de incendios es el de incendios cartografiados.
El ultimo año es parcial (acumulado hasta hoy). Licencia: CC BY 4.0 (EFFIS data and services licence).
La API es la que usa la aplicacion web de estadisticas de EFFIS (api2.effis.emergency.copernicus.eu/statistics/v2): no esta documentada y
puede cambiar. Si un pais falla se conserva su serie anterior; si fallan varios o ninguno, el fichero no se toca y el script sale con error.
Ademas escribe data/forest-fires-season.json: acumulado semanal del año en curso (endpoint «weekly» de la misma API, con year=<año>) junto al
minimo, la media y el maximo 2006-2025 (2012-2025 en GWIS) de cada semana tal como los calcula EFFIS/GWIS. La UE-27 suma los 27 (acumulado y media
son sumables; minimo y maximo no, y no se dan). Si falla la temporada de un pais, ese pais queda fuera del fichero de temporada; no afecta al anual.
Uso: python3 scripts/update-forest-fires.py"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "forest-fires.json"
API = "https://api2.effis.emergency.copernicus.eu/statistics/v2/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
# ISO2 del sitio (EL = Grecia, UK = Reino Unido) -> ISO3 de la API
EFFIS = {"AT": "AUT", "BE": "BEL", "BG": "BGR", "HR": "HRV", "CY": "CYP", "CZ": "CZE", "DK": "DNK", "EE": "EST", "FI": "FIN", "FR": "FRA", "DE": "DEU",
         "EL": "GRC", "HU": "HUN", "IE": "IRL", "IT": "ITA", "LV": "LVA", "LT": "LTU", "LU": "LUX", "MT": "MLT", "NL": "NLD", "PL": "POL", "PT": "PRT",
         "RO": "ROU", "SK": "SVK", "SI": "SVN", "ES": "ESP", "SE": "SWE", "UK": "GBR", "CH": "CHE"}
GWIS = {"US": "USA", "CA": "CAN", "AU": "AUS", "AR": "ARG", "CL": "CHL", "UY": "URY"}
EU27 = [c for c in EFFIS if c not in ("UK", "CH")]
MAX_FAIL = 3
def get(system, iso3):
    u = "%s%s/estimatesbycountry?country=%s" % (API, system, iso3)
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60) as r: d = json.loads(r.read().decode("utf-8"))
            if not isinstance(d, list) or not d: raise RuntimeError("respuesta vacia o inesperada: %s" % str(d)[:120])
            return d
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s %s: %s" % (system, iso3, last))
def get_season(system, iso3, year):
    u = "%s%s/weekly?country=%s&year=%d" % (API, system, iso3, year)
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60) as r: d = json.loads(r.read().decode("utf-8"))
            rows = d.get("banfcumulative") or []
            if len(rows) < 50: raise RuntimeError("semanas: %d" % len(rows))
            return rows
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError("%s %s temporada: %s" % (system, iso3, last))
def season(year, today):
    """{cc: {"system", "weeks": [[semana, fecha fin AAAA-MM-DD, acumulado ha o None, media, minimo, maximo, incendios acumulados o None, media de incendios]]}}"""
    out = {}; fails = []
    for system, table in (("effis", EFFIS), ("gwis", GWIS)):
        for cc, iso3 in table.items():
            try:
                rows = get_season(system, iso3, year); wk = []
                for r in sorted(rows, key=lambda r: int(r["week"])):
                    dt = str(r["mddate"]); end = "%s-%s-%s" % (dt[:4], dt[4:6], dt[6:8])
                    fut = end > today.isoformat()           # semanas que aun no han terminado: sin dato del año (la API puede traer ceros)
                    a = None if fut or r.get("area_ha") is None else int(round(r["area_ha"]))
                    n = None if fut or r.get("events") is None else int(r["events"])
                    rd = lambda v, k=0: None if v is None else round(v, k)
                    wk.append([int(r["week"]), end, a, rd(r.get("area_ha_avg")), rd(r.get("area_ha_min")), rd(r.get("area_ha_max")), n, rd(r.get("events_avg"), 1)])
                if all(w[2] is None for w in wk): raise RuntimeError("sin semanas del año")
                out[cc] = {"system": system, "fromYear": int(rows[0].get("min_year") or (2006 if system == "effis" else 2012)), "weeks": wk}
            except Exception as e: fails.append("%s (%s)" % (cc, str(e)[:80]))
    eu = [c for c in EU27 if c in out]
    if len(eu) == len(EU27):
        W = []
        for i, w in enumerate(out[EU27[0]]["weeks"]):
            col = [out[c]["weeks"][i] for c in EU27]
            ok = all(x[0] == w[0] for x in col)
            if not ok: W = []; break
            a = None if any(x[2] is None for x in col) else sum(x[2] for x in col)
            n = None if any(x[6] is None for x in col) else sum(x[6] for x in col)
            W.append([w[0], w[1], a, round(sum(x[3] or 0 for x in col)), None, None, n, round(sum(x[7] or 0 for x in col), 1)])
        if W: out["EU"] = {"system": "effis", "fromYear": 2006, "weeks": W, "sumOf": "EU27"}
    return out, fails
def load_old():
    try: return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception: return None
def main():
    today = datetime.date.today(); year = today.year
    old = load_old(); oldc = (old or {}).get("countries", {}); oldy = (old or {}).get("years", [])
    years = list(range(2006, year + 1)); idx = {y: i for i, y in enumerate(years)}
    out = {}; fails = []
    for system, table in (("effis", EFFIS), ("gwis", GWIS)):
        for cc, iso3 in table.items():
            try:
                rows = get(system, iso3)
                ba = [None] * len(years); nf = [None] * len(years)
                for r in rows:
                    y = int(r["year"])
                    if y not in idx: continue
                    ba[idx[y]] = int(round(r["ba"])); nf[idx[y]] = int(r["nf"])
                out[cc] = {"system": system, "ba": ba, "nf": nf}
            except Exception as e:
                fails.append("%s (%s)" % (cc, str(e)[:100]))
                o = oldc.get(cc)
                if o and oldy:                                      # conserva la serie anterior, alineada a los años nuevos
                    m = dict(zip(oldy, zip(o["ba"], o["nf"])))
                    out[cc] = {"system": o["system"], "ba": [m.get(y, (None, None))[0] for y in years], "nf": [m.get(y, (None, None))[1] for y in years]}
    if len(fails) > MAX_FAIL or len(out) < len(EFFIS) + len(GWIS) - MAX_FAIL:
        print("ERROR: fallan %d paises (%s); no se toca el fichero" % (len(fails), "; ".join(fails))); return 1
    for f in fails: print("AVISO: conservada la serie anterior de", f)
    # UE-27: suma de los 27 (cada pais cartografiado por EFFIS); los años sin dato de algun pais quedan en hueco
    eu = {"system": "effis", "ba": [], "nf": []}
    for i, y in enumerate(years):
        vb = [out[c]["ba"][i] for c in EU27 if c in out]; vn = [out[c]["nf"][i] for c in EU27 if c in out]
        full = len(vb) == len(EU27) and None not in vb
        eu["ba"].append(sum(vb) if full else None); eu["nf"].append(sum(vn) if full else None)
    out["EU"] = eu
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": today.isoformat(), "currentYear": year,
           "unit": {"ba": "ha", "nf": "incendios cartografiados"},
           "source": {"name": "EFFIS / GWIS (Copernicus, Joint Research Centre), estimaciones de superficie quemada por satelite", "url": "https://forest-fire.emergency.copernicus.eu/apps/effis.statistics/estimates",
                      "license": "CC BY 4.0"},
           "years": years, "countries": dict(sorted(out.items()))}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    try:
        se, sf = season(year, today)
        for f in sf: print("AVISO temporada:", f)
        if len(se) >= len(EFFIS) + len(GWIS) - MAX_FAIL:
            sdoc = {"schemaVersion": 1, "generatedAt": doc["generatedAt"], "asOf": today.isoformat(), "year": year,
                    "columns": ["week", "weekEnd", "cumHa", "avgCumHa", "minCumHa", "maxCumHa", "cumFires", "avgCumFires"],
                    "note": "Acumulado semanal del año en curso y minimo, media y maximo del mismo acumulado en los años anteriores (EFFIS 2006-%d, GWIS 2012-%d), calculados por EFFIS/GWIS." % (year - 1, year - 1),
                    "source": doc["source"], "countries": dict(sorted(se.items()))}
            (ROOT / "data" / "forest-fires-season.json").write_text(json.dumps(sdoc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            print("forest-fires-season.json:", len(se), "paises")
        else: print("AVISO: temporada con %d paises; no se toca forest-fires-season.json" % len(se))
    except Exception as e: print("AVISO: temporada no actualizada:", str(e)[:200])
    es = out["ES"]; print("forest-fires.json", OUT.stat().st_size, "bytes;", len(out), "paises; España %d: %s ha, %s incendios; fallos: %d" % (year, es["ba"][-1], es["nf"][-1], len(fails)))
    return 0
if __name__ == "__main__": sys.exit(main())

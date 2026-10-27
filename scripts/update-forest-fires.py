#!/usr/bin/env python3
"""Incendios forestales por pais: superficie quemada y numero de incendios, anual y del año en curso -> data/forest-fires.json
Fuente: EFFIS (European Forest Fire Information System) y GWIS (Global Wildfire Information System), Copernicus / JRC.
  UE-27, Reino Unido y Suiza: sistema EFFIS, desde 2006.  EE. UU., Canada, Australia, Argentina, Chile y Uruguay: sistema GWIS, desde 2012.
Son estimaciones por satelite (perimetros quemados cartografiados), NO las estadisticas nacionales de los servicios de extincion: no son
comparables entre EFFIS y GWIS ni con las cifras oficiales de cada pais. El numero de incendios es el de incendios cartografiados.
El ultimo año es parcial (acumulado hasta hoy). Licencia: CC BY 4.0 (EFFIS data and services licence).
La API es la que usa la aplicacion web de estadisticas de EFFIS (api2.effis.emergency.copernicus.eu/statistics/v2): no esta documentada y
puede cambiar. Si un pais falla se conserva su serie anterior; si fallan varios o ninguno, el fichero no se toca y el script sale con error.
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
    es = out["ES"]; print("forest-fires.json", OUT.stat().st_size, "bytes;", len(out), "paises; España %d: %s ha, %s incendios; fallos: %d" % (year, es["ba"][-1], es["nf"][-1], len(fails)))
    return 0
if __name__ == "__main__": sys.exit(main())

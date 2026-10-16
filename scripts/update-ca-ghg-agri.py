#!/usr/bin/env python3
"""Canada: emisiones de gases de efecto invernadero de la agricultura (Environment and Climate Change Canada, inventario oficial) -> data/ca-ghg-agri.json
Fuente: Canada's Official Greenhouse Gas Inventory (ECCC Data Mart, carpeta A-IPCC-Sector, fichero GHG_IPCC_Can_Prov_Terr.csv), 1990-ultimo ano, en kt de CO2 equivalente.
Licencia: Open Government Licence - Canada. El Data Mart publica los ficheros a traves de una API propia (data-donnees.az.ec.gc.ca/api/file).
Mismo esquema que el resto de ficheros <cc>-ghg-agri.json (js/es-ghg-agri.js), sin maquinaria ni especies: este inventario no las separa asi.
  CategoryID 0 = total nacional; 500 = Agricultura; 510 fermentacion enterica; 520 estiercol; 530 suelos agricolas; 540 quema de residuos;
  550 encalado, urea y otros fertilizantes con carbono. «x» = dato suprimido por confidencialidad: queda como hueco (null), nunca como cero.
Si algo falla o no cuadra se conserva el fichero anterior. Uso: python3 scripts/update-ca-ghg-agri.py"""
import csv, datetime, io, json, sys, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ca-ghg-agri.json"
API = "https://data-donnees.az.ec.gc.ca/api/file?path="
PATH = "substances/monitor/canada-s-official-greenhouse-gas-inventory/A-IPCC-Sector/GHG_IPCC_Can_Prov_Terr.csv"
PAGE = "https://data-donnees.ec.gc.ca/data/substances/monitor/canada-s-official-greenhouse-gas-inventory/"
H = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
REG = {"Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB", "New Brunswick": "NB", "Newfoundland and Labrador": "NL", "Nova Scotia": "NS", "Northwest Territories": "NT", "Nunavut": "NU",
       "Ontario": "ON", "Prince Edward Island": "PE", "Quebec": "QC", "Saskatchewan": "SK", "Yukon": "YT"}
CATS = {"510": "enteric", "520": "manure", "530": "soils", "540": "burning", "550": "limUrea"}
def fnum(v):
    v = (v or "").strip()
    if v == "" or v.lower() == "x": return None
    try: return float(v)
    except ValueError: return None
def main():
    try:
        raw = urllib.request.urlopen(urllib.request.Request(API + urllib.parse.quote(PATH), headers=H), timeout=300).read().decode("utf-8-sig", "replace")
        rows = list(csv.DictReader(io.StringIO(raw)))
        if len(rows) < 10000: raise ValueError("fichero corto: %d filas" % len(rows))
        years = sorted({int(r["Year"]) for r in rows if (r.get("Year") or "").isdigit()})
        if years[0] != 1990 or years[-1] < 2022: raise ValueError("anos raros %s-%s" % (years[0], years[-1]))
        idx = {y: i for i, y in enumerate(years)}
        def get(region, cid, col):
            a = [None] * len(years)
            for r in rows:
                if r["Region"] == region and r["CategoryID"] == cid and (r.get("Year") or "").isdigit() and int(r["Year"]) in idx: a[idx[int(r["Year"])]] = fnum(r.get(col))
            return a
        nat = get("Canada", "0", "CO2eq"); agr = get("Canada", "500", "CO2eq")
        if any(v is None for v in nat) or any(v is None for v in agr): raise ValueError("faltan valores nacionales de total o agricultura")
        cat = {k: get("Canada", cid, "CO2eq") for cid, k in CATS.items()}
        gas = {"CH4": get("Canada", "500", "CH4 (CO2eq)"), "N2O": get("Canada", "500", "N2O (CO2eq)"), "CO2": get("Canada", "500", "CO2")}
        for i, y in enumerate(years):   # controles: cuadran las partes con el total de agricultura y el total de agricultura con el nacional
            s = sum(cat[k][i] for k in cat if cat[k][i] is not None)
            if abs(s - agr[i]) > 0.02 * agr[i]: raise ValueError("%d: categorias suman %.0f y agricultura %.0f" % (y, s, agr[i]))
            if not (20000 < agr[i] < 100000) or not agr[i] < nat[i]: raise ValueError("%d: agricultura %.0f fuera de rango" % (y, agr[i]))
            g = sum(gas[k][i] for k in gas if gas[k][i] is not None)
            if abs(g - agr[i]) > 0.02 * agr[i]: raise ValueError("%d: gases suman %.0f y agricultura %.0f" % (y, g, agr[i]))
        regions = {}
        for name, code in REG.items():
            a = get(name, "500", "CO2eq")
            if any(v is not None for v in a): regions[code] = [None if v is None else round(v, 1) for v in a]
        if len(regions) < 10: raise ValueError("pocas regiones: %d" % len(regions))
    except Exception as e:
        print("FALLO:", repr(e)[:300]); return 0 if OUT.exists() else 1
    r1 = lambda a: [None if v is None else round(v, 1) for v in a]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "kt CO2-eq", "country": "CA", "sourceKind": "eccc",
           "source": {"name": "Environment and Climate Change Canada, Canada's Official Greenhouse Gas Inventory (IPCC sectors, Canada, provinces and territories)", "url": PAGE, "license": "Open Government Licence - Canada", "licenseShort": "OGL Canada"},
           "years": years, "agriculture": r1(agr), "national": r1(nat), "byCategory": {k: r1(v) for k, v in cat.items()}, "byGas": {k: r1(v) for k, v in gas.items()}, "regions": regions}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("ca-ghg-agri.json: %d-%d, agricultura %d: %.1f kt (%.1f %% del total), %d regiones" % (years[0], years[-1], years[-1], agr[-1], 100 * agr[-1] / nat[-1], len(regions)))
    return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Costes y renta agraria de la UE (Eurostat, cuentas economicas de la agricultura) -> data/eu-farm-economics.json.
Datasets (API publica de Eurostat, sin clave): aact_eaa01 (valores a precios corrientes, millones de euros), aact_eaa06 (indicador A de renta real por UTA, 2020=100)
y aact_ali01 (empleo agrario, miles de UTA). Por pais y para la UE-27 (EU27_2020), ultimos 12 anos:
output = produccion de la rama agraria (AM180000), ic = consumo intermedio (AM200000), energy/fert/ppp/vet/feed = energia, fertilizantes, fitosanitarios, veterinario, piensos
(AM202000/203000/204000/205000/206000), gva = valor anadido bruto (AM260000), nva = neto (AM280000), comp = remuneracion de asalariados (AM290000),
factor = renta de los factores (AM320000), entrep = renta empresarial (AM370000), awu = miles de UTA (AM400000), indA = indicador A (indice 2020=100).
Solo se guardan cifras publicadas; los ratios (p. ej. coste de piensos sobre produccion) los calcula la pagina. Si falla la descarga o el formato, el fichero anterior se conserva.
Uso: python3 scripts/update-eu-farm-economics.py [--fixture ruta.json] [--out ruta]"""
import datetime, json, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-farm-economics.json"
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
ITEMS = {"AM180000": "output", "AM200000": "ic", "AM202000": "energy", "AM203000": "fert", "AM204000": "ppp", "AM205000": "vet", "AM206000": "feed", "AM260000": "gva", "AM280000": "nva", "AM290000": "comp", "AM320000": "factor", "AM370000": "entrep"}
KEYS = ["output", "ic", "energy", "fert", "ppp", "vet", "feed", "gva", "nva", "comp", "factor", "entrep", "awu", "indA"]
YEARS = 12
AGG = {"EA", "EA19", "EA20", "EA21", "EU", "EU27_2020_EFTA", "EU28", "EU27_2007", "EFTA"}  # solo agregados que no son la UE-27
def get(path):
    with urllib.request.urlopen(urllib.request.Request(API + path, headers=H), timeout=180) as r: return json.loads(r.read().decode("utf-8"))
def cells(j):
    """Recorre un JSON-stat: genera ({dimension: codigo}, valor) para cada valor no vacio."""
    ids, sz = j["id"], j["size"]; cats = []
    for k in ids:
        ix = j["dimension"][k]["category"]["index"]
        cats.append([c for c, _ in sorted(ix.items(), key=lambda x: x[1])] if isinstance(ix, dict) else list(ix))
    for pos, v in j["value"].items():
        if v is None: continue
        p = int(pos); idx = [0] * len(ids)
        for k in range(len(ids) - 1, -1, -1): idx[k] = p % sz[k]; p //= sz[k]
        yield {ids[k]: cats[k][idx[k]] for k in range(len(ids))}, float(v)
def build(raw):
    """raw = {'eaa01':..., 'eaa06':..., 'ali01':...} (JSON-stat). Devuelve el documento."""
    data = {}; years = set()
    def put(geo, year, key, v): data.setdefault(geo, {}).setdefault(key, {})[year] = v; years.add(year)
    for c, v in cells(raw["eaa01"]):
        if c["am_item"] in ITEMS and c["indic_agr"] == "PRD_BP" and c["unit"] == "MIO_EUR": put(c["geo"], c["time"], ITEMS[c["am_item"]], round(v, 2))
    for c, v in cells(raw["eaa06"]):
        if c["indic_agr"] == "IND_A" and c["unit"] == "I20": put(c["geo"], c["time"], "indA", round(v, 2))
    for c, v in cells(raw["ali01"]):
        if c["am_item"] == "AM400000" and c["unit"] == "THS_AWU": put(c["geo"], c["time"], "awu", round(v, 3))
    ys = sorted(years)[-YEARS:]
    if not ys or "EU27_2020" not in data: raise ValueError("sin datos de la UE-27")
    geos = {}
    for g, d in data.items():
        if g in AGG or "output" not in d: continue  # agregados (zona euro, UE-28...) y ambitos sin cuentas completas: no se publican
        geos[g] = {k: [d.get(k, {}).get(y) for y in ys] for k in KEYS}
    return {"years": [int(y) for y in ys], "geos": geos, "updated": {k: raw[k].get("updated") for k in ("eaa01", "eaa06", "ali01")}}
def main():
    args = sys.argv[1:]; outp = OUT
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1]); del args[i:i + 2]
    try:
        if args[:1] == ["--fixture"]: raw = json.loads(Path(args[1]).read_text())
        else:
            raw = {"eaa01": get("aact_eaa01?format=JSON&lang=en&unit=MIO_EUR&indic_agr=PRD_BP&lastTimePeriod=%d&" % YEARS + "&".join("am_item=" + i for i in ITEMS)),
                   "eaa06": get("aact_eaa06?format=JSON&lang=en&unit=I20&indic_agr=IND_A&lastTimePeriod=%d" % YEARS),
                   "ali01": get("aact_ali01?format=JSON&lang=en&am_item=AM400000&lastTimePeriod=%d" % YEARS)}
        b = build(raw)
    except Exception as e: print("FALLO:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Eurostat, Economic accounts for agriculture (aact_eaa01, aact_eaa06, aact_ali01)", "url": "https://ec.europa.eu/eurostat/web/agriculture/data/database", "license": "Eurostat reuse policy (Decision 2011/833/EU)"},
           "unit": "million EUR, current prices (indA: index 2020=100; awu: thousand annual work units)", "keys": KEYS, "years": b["years"], "geos": b["geos"], "eurostatUpdated": b["updated"]}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(b["geos"]), "ambitos,", b["years"][0], "-", b["years"][-1]); return 0
if __name__ == "__main__": sys.exit(main())

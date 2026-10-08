#!/usr/bin/env python3
"""«Qué sembrar»: datos por region y cultivo para comparar opciones de siembra (idea de Mario, 8-oct-2026).
Solo cifras oficiales ya publicadas en Dehesa; nada se predice aqui: rendimientos de los ultimos años de la region, precio recibido
por el productor (campaña reciente y actual), ingreso por superficie, costes de cultivo cuando existen (USDA ERS, media nacional)
y existencias frente a su media (balances). El reparto de hectareas lo calcula la pagina con reglas explicadas al usuario.
-> data/sowing/us.json (estados de EE. UU., USD/acre) y data/sowing/fr.json (regiones de Francia, EUR/ha)."""
import datetime, json, statistics
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"; OUT = D / "sowing"
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def load(p): return json.loads((D / p).read_text())
N4 = lambda es, en, fr, it: {"es": es, "en": en, "fr": fr, "it": it}

# ---------------- EE. UU. ----------------
US = [  # id, nombre, clave NASS, unidad de rendimiento, unidad de precio, historico de precio mensual (data/prices/history/us), clave ERS, clave PSD
    ("corn", N4("Maíz", "Corn", "Maïs", "Mais"), "CORN, GRAIN", "bu/acre", "USD/bu", "maiz", "maiz", "maiz"),
    ("soybeans", N4("Soja", "Soybeans", "Soja", "Soia"), "SOYBEANS", "bu/acre", "USD/bu", None, "soja", "soja"),
    ("wheat", N4("Trigo", "Wheat", "Blé", "Grano"), "WHEAT", "bu/acre", "USD/bu", "trigo", "trigo", "trigo"),
    ("barley", N4("Cebada", "Barley", "Orge", "Orzo"), "BARLEY", "bu/acre", "USD/bu", "cebada", "cebada", "cebada"),
    ("oats", N4("Avena", "Oats", "Avoine", "Avena"), "OATS", "bu/acre", "USD/bu", "avena", "avena", None),
    ("sorghum", N4("Sorgo", "Sorghum", "Sorgho", "Sorgo"), "SORGHUM, GRAIN", "bu/acre", "USD/bu", "sorgo", None, None),
    ("peanuts", N4("Cacahuete", "Peanuts", "Arachide", "Arachidi"), "PEANUTS", "lb/acre", "USD/lb", None, None, None),
    ("cotton", N4("Algodón (upland)", "Cotton (upland)", "Coton (upland)", "Cotone (upland)"), "COTTON, UPLAND", "lb/acre", "USD/lb", None, None, None),
    ("hay", N4("Heno (alfalfa)", "Hay (alfalfa)", "Foin (luzerne)", "Fieno (erba medica)"), "HAY, ALFALFA", "tons/acre", "USD/ton", None, None, None)]
def us():
    S = load("nass-crops.json")["series"]; ers = load("ers-cost-reference.json")["crops"]; ers_raw = load("ers.json")["costs"]; psd = {c["id"]: c for c in load("supply-demand.json")["commodities"]}
    states = load("us-states/index.json") if (D / "us-states/index.json").exists() else None
    crops, regions = {}, {}
    for cid, nm, key, yu, pu, hist, ek, pk in US:
        ys = S.get(key + " - YIELD, MEASURED IN " + {"bu/acre": "BU / ACRE", "lb/acre": "LB / ACRE", "tons/acre": "TONS / ACRE"}[yu], {}).get("s", {})
        val = S.get(key + " - PRODUCTION, MEASURED IN $", {}).get("s", {}); ah = S.get(key + " - ACRES HARVESTED", {}).get("s", {})
        prod = S.get(key + " - PRODUCTION, MEASURED IN " + {"bu/acre": "BU", "lb/acre": "LB", "tons/acre": "TONS"}[yu], {}).get("s", {})
        if cid == "cotton":   # algodón: produccion en balas de 480 lb y rendimiento en lb/acre
            prod = {st: [[y, v * 480] for y, v in pts] for st, pts in S.get("COTTON, UPLAND - PRODUCTION, MEASURED IN 480 LB BALES", {}).get("s", {}).items()}
        if not ys: continue
        # precio implicito nacional por año = suma valor / suma produccion (estados con ambos datos)
        imp = {}
        for st in val:
            for y, v in val[st]:
                q = dict(prod.get(st, [])).get(y)
                if v and q: imp.setdefault(y, [0, 0]); imp[y][0] += v; imp[y][1] += q
        price_hist = {y: round(a / b, 4) for y, (a, b) in sorted(imp.items()) if b}
        cur = None
        if hist and (D / "prices/history/us" / (hist + ".json")).exists():
            h = load("prices/history/us/" + hist + ".json")["history"][-12:]
            if len(h) >= 6: cur = {"value": round(statistics.mean(x["value"] for x in h), 4), "kind": "avg12m", "from": "%d-%s" % (h[0]["year"], h[0]["period"]), "to": "%d-%s" % (h[-1]["year"], h[-1]["period"]), "sourceId": "usda_nass"}
        if not cur and price_hist:
            y = max(price_hist); cur = {"value": price_hist[y], "kind": "implied", "from": y, "to": y, "sourceId": "usda_nass"}
        costs = None
        if ek and ek in ers:
            e = ers[ek]; costs = {"operating": e["operatingCosts"], "total": e["totalCostsListed"], "year": e["year"], "unit": "USD/acre", "scope": "U.S. total", "sourceId": "usda_ers"}
        elif cid in ers_raw:   # cultivos que la calculadora no usa (sorgo, algodón, cacahuete): lineas publicadas 'Total, operating costs' y 'Total, costs listed'
            rows = [r for r in ers_raw[cid] if r[3] == "U.S. total"]
            if rows:
                yr = max(r[4] for r in rows); v = {r[1]: r[5] for r in rows if r[4] == yr}
                if v.get("Total, operating costs"): costs = {"operating": v["Total, operating costs"], "total": v.get("Total, costs listed"), "year": yr, "unit": "USD/acre", "scope": "U.S. total", "sourceId": "usda_ers"}
        stocks = None
        if pk and pk in psd:
            c = psd[pk].get("countries", {}).get("United States", {}).get("years", {}); yrs = sorted(c, key=int)
            r = [(y, c[y]["endingStocks"] / c[y]["consumption"]) for y in yrs if c[y].get("consumption")]
            if len(r) >= 6: stocks = {"ratio": round(r[-1][1], 4), "year": r[-1][0], "avg5": round(statistics.mean(x[1] for x in r[-6:-1]), 4), "sourceId": "usda_fas_psd"}
        crops[cid] = {"name": nm, "yieldUnit": yu, "priceUnit": pu, "areaUnit": "acre", "revUnit": "USD/acre", "price": {"current": cur, "hist": price_hist}, "costs": costs, "stocks": stocks}
        for st, pts in ys.items():
            if st == "OT": continue
            a = dict(ah.get(st, [])); v = dict(val.get(st, []))
            rec = {"yield": {y: x for y, x in pts}, "area": {y: a[y] for y in a}, "rev": {y: round(v[y] / a[y], 2) for y in v if a.get(y)}}
            regions.setdefault(st, {"crops": {}})["crops"][cid] = rec
    doc = {"schemaVersion": 1, "generatedAt": NOW, "country": "US", "areaUnit": "acre", "currency": "USD",
           "note": "Rendimiento por estado (USDA NASS), ingreso por acre cosechado = valor de la produccion / acres cosechados (NASS), precio actual = media de 12 meses del precio recibido (NASS) o, si no hay serie mensual, precio implicito del ultimo año; costes de USDA ERS (media nacional, no por estado).",
           "crops": crops, "regions": regions}
    (OUT / "us.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    return len(crops), len(regions)

# ---------------- Francia ----------------
FR = [("soft-wheat", "fr-paid-soft-wheat", "wheat"), ("durum-wheat", "fr-paid-durum-wheat", "durum"), ("barley", "fr-paid-barley", "barley"), ("maize-grain-seed", "fr-paid-maize", "maize"),
      ("oats", "fr-paid-oats", "oats"), ("rye", "fr-paid-rye", "rye"), ("triticale", "fr-paid-triticale", "triticale"), ("sorghum", "fr-paid-sorghum", "sorghum"),
      ("rapeseed", "fr-paid-rapeseed", None), ("sunflower", "fr-paid-sunflower-seed", None), ("soybeans", "fr-paid-soybeans", None), ("protein-peas", "fr-paid-peas", None),
      ("faba-beans", "fr-paid-faba-beans", None), ("lentils", "fr-fam-farmgate-lentil", None), ("linseed", "fr-fam-farmgate-flax", None), ("rice", "fr-fam-farmgate-rice", None)]
FRN = {"soft-wheat": N4("Trigo blando", "Soft wheat", "Blé tendre", "Grano tenero"), "durum-wheat": N4("Trigo duro", "Durum wheat", "Blé dur", "Grano duro"), "barley": N4("Cebada", "Barley", "Orge", "Orzo"),
       "maize-grain-seed": N4("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella"), "oats": N4("Avena", "Oats", "Avoine", "Avena"), "rye": N4("Centeno", "Rye", "Seigle", "Segale"),
       "triticale": N4("Triticale", "Triticale", "Triticale", "Triticale"), "sorghum": N4("Sorgo", "Sorghum", "Sorgho", "Sorgo"), "rapeseed": N4("Colza", "Rapeseed", "Colza", "Colza"),
       "sunflower": N4("Girasol", "Sunflower", "Tournesol", "Girasole"), "soybeans": N4("Soja", "Soybeans", "Soja", "Soia"), "protein-peas": N4("Guisante proteaginoso", "Protein peas", "Pois protéagineux", "Pisello proteico"),
       "faba-beans": N4("Haba", "Faba beans", "Féverole", "Favino"), "lentils": N4("Lenteja", "Lentils", "Lentille", "Lenticchia"), "linseed": N4("Lino oleaginoso", "Linseed", "Lin oléagineux", "Lino da olio"), "rice": N4("Arroz", "Rice", "Riz", "Riso")}
def fr():
    reg = load("france-crops-regions.json"); ser = {}
    for f in ("france-stats.json", "france-campaign-stats.json"):
        for s in load(f)["countries"]["FR"]["series"]: ser[s["id"]] = s
    bal = load("supply-balances/fr.json")
    crops, regions = {}, {}
    for cid, pid, bk in FR:
        s = ser.get(pid)
        if not s: continue
        pts = dict((p[0], p[1]) for p in s["points"])
        hist = {}   # precio de campaña completa: el acumulado del 4.º trimestre (abril-junio del año siguiente)
        for per, v in pts.items():
            if per.endswith("-Q2"): hist[str(int(per[:4]) - 1)] = v
        last = s["points"][-1]
        cur = {"value": last[1], "kind": "campaignToDate", "from": last[0], "to": last[0], "sourceId": "franceagrimer"}
        stocks = None
        if bk:
            r = []
            for y in sorted(bal["campaigns"], key=int):
                v = bal["campaigns"][y]["v"].get(bk) or {}
                if v.get("endingStocks") is not None and v.get("totalUse"): r.append((y, v["endingStocks"] / v["totalUse"]))
            if len(r) >= 6: stocks = {"ratio": round(r[-1][1], 4), "year": r[-1][0], "avg5": round(statistics.mean(x[1] for x in r[-6:-1]), 4), "sourceId": "franceagrimer"}
        crops[cid] = {"name": FRN[cid], "yieldUnit": "t/ha", "priceUnit": "EUR/t", "areaUnit": "ha", "revUnit": "EUR/ha", "price": {"current": cur, "hist": hist}, "costs": None, "stocks": stocks}
    for code, R in reg["regions"].items():
        rr = {"name": R["name"], "crops": {}}
        for cid in crops:
            c = R["c"].get(cid)
            if not c: continue
            yld = {y: round(v[1] / 10, 3) for y, v in c.items() if v and v[1]}   # q/ha -> t/ha
            area = {y: v[0] for y, v in c.items() if v and v[0]}
            ph = crops[cid]["price"]["hist"]
            rev = {y: round(yld[y] * ph[y], 1) for y in yld if y in ph}
            rr["crops"][cid] = {"yield": yld, "area": area, "rev": rev}
        if rr["crops"]: regions[code] = rr
    doc = {"schemaVersion": 1, "generatedAt": NOW, "country": "FR", "areaUnit": "ha", "currency": "EUR",
           "note": "Rendimiento y superficie por region (SSP/Agreste via FranceAgriMer; el ultimo año es provisional), precio pagado al productor por campaña (FranceAgriMer, media acumulada de la campaña), ingreso por ha = rendimiento x precio de esa campaña. No hay costes de cultivo publicados en Dehesa para Francia.",
           "crops": crops, "regions": regions}
    (OUT / "fr.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    return len(crops), len(regions)

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print("us", us()); print("fr", fr())

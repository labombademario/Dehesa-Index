#!/usr/bin/env python3
"""«Mercados Dehesa» (idea de Mario, 20-oct-2026): cerdo iberico, pastos y corcho en una sola pagina, solo con cifras oficiales ya publicadas.
No se inventa ni se estima nada; lo que no tiene fuente abierta (precio del cerdo iberico, de la bellota, del corcho) se declara en la pagina como PENDIENTE.
Entradas (ya en el repositorio):
  - data/spain-livestock/livestock-porcino.json (MAPA, Encuestas ganaderas: cerdos de capa blanca y iberico por provincia, mayo y noviembre)
  - data/spain-land/land.json (MAPA: precio de la tierra y canon de arrendamiento; pastizal y prados)
  - data/eu-trade-stats.json (Eurostat Comext, capitulo 45 «corcho y sus manufacturas»; valor en millones de EUR, mensual)
Salida: data/dehesa.json (pequeno: la pagina dehesa.html no carga los ficheros grandes)."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def load(p): return json.loads((D / p).read_text(encoding="utf-8"))
def N4(es, en, fr, it): return {"es": es, "en": en, "fr": fr, "it": it}

def pigs():
    d = load("spain-livestock/livestock-porcino.json"); per = d["periods"]; V = d["v"]
    ids = [v["id"] for v in d["vars"]]
    def col(area, vid):
        a = V.get(area)
        if not a or vid not in a: return None
        return a[vid]
    def series(area, vid):
        c = col(area, vid)
        return [[per[i], c[i]] for i in range(len(per)) if c and c[i] is not None]
    # 01 = total de animales; 27 = total iberico; 30 = iberico de cebo; 35 = iberico, cerdas reproductoras
    for need in ("01", "27", "30", "35"):
        if need not in ids: raise SystemExit("porcino: falta la variable %s" % need)
    es = {"total": series("ES", "01"), "iberian": series("ES", "27"), "iberianFattening": series("ES", "30"), "iberianSows": series("ES", "35")}
    last = per[-1]; names = load("spain-land/land.json")["price"]["prov"]["names"]
    prov = []
    for code in sorted(k for k in V if k != "ES"):
        t, i = col(code, "01"), col(code, "27")
        if not t or not i or t[-1] is None or i[-1] is None: continue
        prov.append({"code": code, "name": names.get(code, code), "iberian": i[-1], "total": t[-1], "share": round(100.0 * i[-1] / t[-1], 1) if t[-1] else None})
    prov.sort(key=lambda r: -r["iberian"])
    return {"period": last, "es": es, "provinces": prov[:12],
            "source": {"name": "MAPA, Encuestas ganaderas: efectivos de ganado porcino (mayo y noviembre)", "url": d["source"]["url"] if "source" in d else "", "licence": "MAPA aviso legal: reutilizacion citando la fuente"}}

AREAS = {"EX": N4("Extremadura", "Extremadura", "Estrémadure", "Estremadura"), "AN": N4("Andalucía", "Andalusia", "Andalousie", "Andalusia"),
         "CL": N4("Castilla y León", "Castile and León", "Castille-et-León", "Castiglia e León"), "CM": N4("Castilla-La Mancha", "Castilla-La Mancha", "Castille-La Manche", "Castiglia-La Mancia"),
         "ES": N4("España", "Spain", "Espagne", "Spagna")}
# Provincias con mas dehesa (Extremadura, oeste de Andalucia y Salamanca, mas Castilla-La Mancha y Avila/Zamora): codigos INE
DEHESA_PROV = ["06", "10", "21", "41", "14", "37", "13", "45", "11", "23", "05", "49"]
def pasture():
    l = load("spain-land/land.json"); yrs = l["years"]; out = {}
    for cc, nm in AREAS.items():
        p = l["price"]["ccaa"].get(cc, {}).get("PST"); r = l["rent"]["ccaa"].get(cc, {}).get("PST")
        if p is None and r is None: continue
        out[cc] = {"name": nm, "price": p, "rent": r}
    pv = l["price"]["prov"]; names = pv["names"]
    prov = [{"code": c, "name": names.get(c, c), "price": pv["values"][c]["PST"]} for c in DEHESA_PROV if isinstance(pv["values"].get(c), dict) and pv["values"][c].get("PST") is not None]
    prov.sort(key=lambda r: -r["price"])
    return {"years": yrs, "status": l.get("status", {}), "areas": out, "provYear": pv["year"], "provinces": prov, "priceUnit": l["price"]["unit"], "rentUnit": l["rent"]["unit"],
            "source": l["source"]}

def cork():
    d = load("eu-trade-stats.json"); out = {}
    for cc in ("ES", "PT"):
        for s in d["countries"].get(cc, {}).get("series", []):
            if s["id"] not in ("eu-%s-trade-exp-cork" % cc.lower(), "eu-%s-trade-imp-cork" % cc.lower()): continue
            kind = "exports" if "-exp-" in s["id"] else "imports"
            by = {}
            for p, v in s["points"]: by.setdefault(p[:4], []).append(v)
            ann = [[int(y), round(sum(v), 3)] for y, v in sorted(by.items()) if len(v) == 12]   # solo años completos
            if len(ann) >= 3: out.setdefault(cc, {})[kind] = ann[-12:]; out[cc]["latestMonth"] = s["latestPeriod"]
    return {"unit": "EUR million", "countries": out,
            "source": {"name": "Eurostat (Comext), capitulo 45 (corcho y sus manufacturas); suma anual calculada por Dehesa Index", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "licence": "Eurostat reuse policy (CC BY 4.0); cite source"}}

def cork_production():
    """Produccion de corcho por CCAA (data/es-cork.json, MITECO). Si el fichero aun no existe, None."""
    f = D / "es-cork.json"
    if not f.exists(): return None
    d = load("es-cork.json"); ys = sorted(d["years"], key=int)
    return {"unit": "t", "years": [int(y) for y in ys], "total": [d["years"][y]["total"] for y in ys], "ccaa": {c: [d["years"][y]["ccaa"].get(c) for y in ys] for c in d["names"]},
            "names": d["names"], "unallocated": {y: d["years"][y]["unallocated"] for y in ys if "unallocated" in d["years"][y]}, "yearNotes": {y: d["years"][y]["note"] for y in ys if "note" in d["years"][y]}, "estimatedAN": d.get("estimated", {}).get("AN", []), "totalIsSum": [int(y) for y in ys if d["years"][y].get("totalIsSum")],
            "publishedTotal": {y: d["years"][y]["publishedTotal"] for y in ys if "publishedTotal" in d["years"][y]}, "source": d["source"]}

def main():
    ck = cork(); ck["production"] = cork_production(); ck["anuario2021"] = load("es-cork-anuario2021.json")
    doc_products = load("es-forest-products-anuario2021.json")
    doc = {"schemaVersion": 1, "generatedAt": NOW, "pigs": pigs(), "pasture": pasture(), "cork": ck, "forest": {k: doc_products[k] for k in ("pineNut", "chestnut", "truffle", "mushrooms", "resin")} | {"source": doc_products["source"]}}
    (D / "dehesa.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("dehesa.json: %d provincias de iberico, %d zonas de pasto, corcho %s" % (len(doc["pigs"]["provinces"]), len(doc["pasture"]["areas"]), sorted(doc["cork"]["countries"])))
if __name__ == "__main__": sys.exit(main())

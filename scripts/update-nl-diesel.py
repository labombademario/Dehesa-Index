#!/usr/bin/env python3
"""Paises Bajos: gasoleo semanal (Boletin Petrolero de la UE), precio diario en surtidor (CBS) y precio de compra del gasoleo por los agricultores -> data/nl-diesel.json
Paises Bajos no publica en abierto un precio del «rode diesel» (gasoleo rojo, el de la maquinaria agricola y no vial): no se inventa ni se estima. Hay tres series oficiales:
1) Boletin Petrolero de la UE (Comision Europea, DG ENER): gasoleo de automocion con y sin impuestos y gasoleo de calefaccion, semanal, EUR/1000 l -> EUR/l.
2) CBS, tabla 80416ned «Pompprijzen motorbrandstoffen; per dag»: precio medio ponderado diario en surtidor del diesel y la gasolina Euro95 con IVA e impuestos
   (se publica una vez por semana). Se guardan los ultimos 4 anos.
3) Precio de compra del gasoleo (dieselolie) por las explotaciones agrarias, EUR por 100 l, anual: Eurostat apri_ap_ina (2000-2024, el CBS lo envia a Eurostat) y desde
   2025 el CBS, tabla 86337NED «Landbouwprijzen; absolute inputprijzen». Sin IVA (metodologia de Eurostat para los precios de insumos).
Licencias: CBS CC BY 4.0 (con cita); Eurostat CC BY 4.0; Decision 2011/833/UE (Comision). Si una parte falla se conserva la anterior. Uso: python3 scripts/update-nl-diesel.py"""
import datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "nl-diesel.json"
WOB = "https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx"
CBS = "https://opendata.cbs.nl/ODataApi/odata/"
ES = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apri_ap_ina?format=JSON&lang=EN&geo=NL&currency=EUR&prod_inp=20232000"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json, */*"}
def get(u, t=120, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def weekly():
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(get(WOB, 300)), read_only=True, data_only=True)
    def col(ws, name):
        hdr = [str(x or "").strip() for x in next(ws.iter_rows(values_only=True, max_row=1))]; i = hdr.index(name); out = {}
        for r in ws.iter_rows(values_only=True, min_row=2):
            if not isinstance(r[0], datetime.datetime) or i >= len(r): continue
            try: out[r[0].date().isoformat()] = float(r[i]) / 1000
            except (TypeError, ValueError): pass
        return out
    wt = wb["Prices with taxes"]; wo = wb["Prices wo taxes"]
    dt = col(wt, "NL_price_with_tax_diesel"); ht = col(wt, "NL_price_with_tax_heating_oil"); dn = col(wo, "NL_price_wo_tax_diesel")
    out = [[d, round(dt[d], 4), round(dn[d], 4) if d in dn else None, round(ht[d], 4) if d in ht else None] for d in sorted(dt) if 0.3 < dt[d] < 3.5]
    if len(out) < 500: raise ValueError("serie semanal corta: %d" % len(out))
    for a, b in zip(out, out[1:]):
        if abs(b[1] - a[1]) > 0.6: raise ValueError("salto raro entre %s y %s" % (a[0], b[0]))
    return out
def pump():
    d0 = (datetime.date.today() - datetime.timedelta(days=4 * 366)).strftime("%Y%m%d"); out = []
    u = CBS + "80416ned/TypedDataSet?$format=json&$filter=" + urllib.request.quote("Perioden ge '%s'" % d0)
    while u:
        d = json.loads(get(u).decode("utf-8-sig")); out += d["value"]; u = d.get("odata.nextLink")
    rows = []
    for r in out:
        p = r["Perioden"]
        if r.get("Diesel_2") is None or r.get("BenzineEuro95_1") is None: continue
        rows.append(["%s-%s-%s" % (p[:4], p[4:6], p[6:8]), round(r["Diesel_2"], 3), round(r["BenzineEuro95_1"], 3)])
    rows.sort()
    if len(rows) < 700: raise ValueError("pompprijzen cortos: %d" % len(rows))
    if not all(0.5 < x[1] < 3.5 and 0.5 < x[2] < 3.5 for x in rows): raise ValueError("pompprijzen fuera de rango")
    return rows
def farm():
    d = json.loads(get(ES)); T = d["dimension"]["time"]["category"]["index"]; v = d["value"]; out = {}
    if isinstance(T, list): T = {k: i for i, k in enumerate(T)}
    for y, i in T.items():
        if str(i) in v and v[str(i)] is not None: out[int(y)] = round(v[str(i)] / 100, 4)
    try:
        for r in json.loads(get(CBS + "86337NED/TypedDataSet?$format=json&$filter=Landbouwinput%20eq%20'A065314'").decode("utf-8-sig"))["value"]:
            y = int(r["Perioden"][:4])
            if r.get("GemiddeldePrijs_1") is not None and y not in out: out[y] = round(r["GemiddeldePrijs_1"] / 100, 4)
    except Exception as e: print("AVISO CBS 86337NED:", e)
    rows = [[y, out[y]] for y in sorted(out)]
    if len(rows) < 20 or not all(0.2 < x[1] < 2.5 for x in rows): raise ValueError("precio agrario anual raro: %s" % rows[-3:])
    return rows
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "EUR/l",
           "source": {"name": "Comisión Europea, Weekly Oil Bulletin; CBS Países Bajos, Pompprijzen motorbrandstoffen (80416ned) y Landbouwprijzen (86337NED); Eurostat apri_ap_ina",
                      "url": "https://opendata.cbs.nl/statline/#/CBS/nl/dataset/80416ned/table", "wobUrl": "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en",
                      "farmUrl": "https://ec.europa.eu/eurostat/databrowser/view/apri_ap_ina/default/table", "license": "CC BY 4.0 (CBS, Eurostat); Decisión 2011/833/UE (Comisión)"},
           "weeklyFields": ["date", "dieselTax", "dieselNoTax", "heatingOilTax"], "pumpFields": ["date", "diesel", "petrol95"], "farmFields": ["year", "dieselNoVat"], "vat": 0.21}
    for key, fn in (("weekly", weekly), ("pump", pump), ("farm", farm)):
        try: doc[key] = fn()
        except Exception as e:
            print("AVISO %s:" % key, e)
            if old.get(key): doc[key] = old[key]
    if not all(k in doc for k in ("weekly", "pump", "farm")): print("FALLO: falta una parte"); return 0 if OUT.exists() else 1
    doc["asOf"] = doc["weekly"][-1][0]
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("nl-diesel.json: %d semanas (ultima %s, %.3f EUR/l); surtidor CBS %d dias, ultimo %s diesel %.3f; gasoleo agrario %d anos, ultimo %s: %.3f EUR/l" % (
        len(doc["weekly"]), doc["weekly"][-1][0], doc["weekly"][-1][1], len(doc["pump"]), doc["pump"][-1][0], doc["pump"][-1][1], len(doc["farm"]), doc["farm"][-1][0], doc["farm"][-1][1]))
    return 0
if __name__ == "__main__": sys.exit(main())

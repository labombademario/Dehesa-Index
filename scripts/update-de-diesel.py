#!/usr/bin/env python3
"""Alemania: gasoleo y fioul de calefaccion, y lo que cuesta el gasoleo a una explotacion agraria con la devolucion «Agrardiesel» -> data/de-diesel.json
1) Precios semanales de Alemania del Boletin Petrolero de la UE (Comision Europea, DG ENER, «Weekly Oil Bulletin», historico desde 2005):
   gasoleo con y sin impuestos y fioul de calefaccion con impuestos (EUR por 1.000 l -> EUR/l). Reutilizacion: Decision 2011/833/UE.
2) Devolucion del impuesto al gasoleo de las explotaciones agrarias y forestales (Agrardiesel, § 57 EnergieStG): importe por litro que publica
   la aduana alemana (zoll.de, «Höhe der Steuerentlastung»). Se lee en cada ejecucion; si la pagina cambia y no se encuentra, queda sin dato.
3) Coste aproximado para la explotacion = precio con impuestos / (1 + IVA) - devolucion (las explotaciones en regimen general recuperan el IVA).
   Calculo de Dehesa Index; el IVA del gasoleo en Alemania es el 19 %. Uso: python3 scripts/update-de-diesel.py"""
import datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "de-diesel.json"
WOB = "https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx"
ZOLL = "https://www.zoll.de/DE/Fachthemen/Steuern/Verbrauchsteuern/Energie/Steuerbeguenstigung/Steuerentlastung/Betriebe-Land-Forstwirtschaft/betriebe-land-forstwirtschaft_node.html"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
VAT = 0.19
def get(u, t=240):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def col(ws, name):
    hdr = [str(x or "").strip() for x in next(ws.iter_rows(values_only=True, max_row=1))]
    try: return hdr.index(name)
    except ValueError: raise ValueError("columna %s no encontrada" % name)
def series(ws, ci):
    out = {}
    for r in ws.iter_rows(values_only=True, min_row=2):
        d = r[0]
        if not isinstance(d, datetime.datetime) or ci >= len(r): continue
        try: v = float(r[ci]) / 1000.0
        except (TypeError, ValueError): continue
        if 0.2 < v < 4.0: out[d.date().isoformat()] = round(v, 4)
    return out
def refund():
    t = re.sub(r"<[^>]+>|\s+", " ", get(ZOLL).decode("utf-8", "replace"))
    m = re.search(r"Entlastungssatz in Höhe von ([0-9]+,[0-9]+) Euro je Liter", t)
    if not m: raise ValueError("importe de la devolucion no encontrado en la pagina de la aduana")
    i = m.start(); return float(m.group(1).replace(",", ".")), t[max(0, i - 60): m.end() + 1].strip()
def main():
    import openpyxl
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    try:
        wb = openpyxl.load_workbook(io.BytesIO(get(WOB, 300)), read_only=True, data_only=True)
        wt = wb["Prices with taxes"]; wo = wb["Prices wo taxes"]
        dt = series(wt, col(wt, "DE_price_with_tax_diesel")); ht = series(wt, col(wt, "DE_price_with_tax_heating_oil")); do = series(wo, col(wo, "DE_price_wo_tax_diesel"))
        dates = sorted(dt)
        if len(dates) < 500: raise ValueError("serie corta: %d semanas" % len(dates))
        rows = [[d, dt[d], do.get(d), ht.get(d)] for d in dates]
        for a, b in zip(rows, rows[1:]):
            if abs(b[1] - a[1]) > 0.6 and (datetime.date.fromisoformat(b[0]) - datetime.date.fromisoformat(a[0])).days <= 8: raise ValueError("salto sospechoso %s -> %s" % (a, b))
    except Exception as e:
        print("FALLO boletin petrolero:", e); return 0 if OUT.exists() else 1
    rf = None; rtext = None
    try: rf, rtext = refund()
    except Exception as e:
        print("AVISO devolucion Agrardiesel:", e)
        if old.get("agrardiesel"): rf = old["agrardiesel"]["eurPerLitre"]; rtext = old["agrardiesel"].get("text")
    last = rows[-1]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": last[0], "unit": "EUR/l",
           "source": {"name": "Comisión Europea, Weekly Oil Bulletin (Alemania)", "url": "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en", "license": "Reutilización de documentos de la Comisión (Decisión 2011/833/UE)"},
           "fields": ["date", "dieselTax", "dieselNoTax", "heatingOilTax"], "weekly": rows, "vat": VAT,
           "agrardiesel": {"eurPerLitre": rf, "text": rtext, "url": ZOLL, "law": "§ 57 Energiesteuergesetz"} if rf is not None else None,
           "farmCost": round(last[1] / (1 + VAT) - rf, 4) if rf is not None else None}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("de-diesel.json: %d semanas %s..%s; %s gasoleo %.3f EUR/l (sin impuestos %s), fioul %s; Agrardiesel %s EUR/l; coste aprox. explotacion %s" % (len(rows), rows[0][0], last[0], last[0], last[1], last[2], last[3], rf, doc["farmCost"]))
    return 0
if __name__ == "__main__": sys.exit(main())

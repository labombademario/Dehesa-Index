#!/usr/bin/env python3
"""Gasoleo de automocion semanal en 16 paises de la UE sin pagina propia de gasoleo -> data/diesel-eu-more.json
Fuente: Boletin Semanal del Petroleo de la Comision Europea (DG ENER), la misma hoja que ya usan Alemania, Francia, Espana, Italia y Portugal:
columnas XX_price_with_tax_diesel (con impuestos) y XX_price_wo_tax_diesel (sin impuestos), EUR por 1000 l -> EUR/l. Reutilizacion: Decision 2011/833/UE.
Nada se estima: si falta un pais o una columna no se escribe. Desde 2019 (la grafica de la ficha empieza ahi). Uso: python3 scripts/update-eu-diesel-more.py"""
import datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "diesel-eu-more.json"
WOB = "https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx"
# codigo de la ficha -> prefijos posibles en el boletin (Grecia aparece como EL o GR)
CODES = {"EL": ["EL", "GR"], "BG": ["BG"], "CY": ["CY"], "CZ": ["CZ"], "DK": ["DK"], "EE": ["EE"], "FI": ["FI"], "HU": ["HU"], "LT": ["LT"], "LU": ["LU"], "LV": ["LV"], "MT": ["MT"], "RO": ["RO"], "SE": ["SE"], "SI": ["SI"], "SK": ["SK"]}
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def get(u, t=300, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-80:], last))
def col(ws, name):
    rows = ws.iter_rows(values_only=True)
    hdr = [str(x or "").strip().lower() for x in next(rows)]
    if name not in hdr: return None
    i = hdr.index(name); out = {}
    for r in rows:
        if not r or not isinstance(r[0], datetime.datetime) or i >= len(r): continue
        try: v = float(r[i]) / 1000
        except (TypeError, ValueError): continue
        if 0.3 < v < 3.5: out[r[0].date().isoformat()] = round(v, 4)
    return out
def main():
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(get(WOB)), read_only=True, data_only=True)
    wt, wo = wb["Prices with taxes"], wb["Prices wo taxes"]
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    res = dict(old.get("countries") or {}); got = 0
    for cc, pref in CODES.items():
        t = n = None
        for p in pref:
            t = col(wt, p.lower() + "_price_with_tax_diesel")
            if t: n = col(wo, p.lower() + "_price_wo_tax_diesel") or {}; break
        if not t: print("AVISO", cc, "sin columna con impuestos"); continue
        days = [d for d in sorted(t) if d >= "2019-01-01"]
        if len(days) < 200: print("AVISO", cc, "serie corta", len(days)); continue
        rows = [[d, t[d], n.get(d)] for d in days]
        for a, b in zip(rows, rows[1:]):
            if abs(b[1] - a[1]) > 0.6: print("AVISO", cc, "salto raro", a[0], b[0]); rows = None; break
        if not rows: continue
        res[cc] = rows; got += 1
    if got < 10: print("FALLO: solo %d paises" % got); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "EUR/l", "fields": ["date", "dieselTax", "dieselNoTax"],
           "source": {"name": "Comision Europea, Weekly Oil Bulletin", "url": "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en", "license": "Decision 2011/833/UE (reutilizacion de documentos de la Comision)"},
           "note": "Gasoleo de automocion, precio medio comunicado por cada Estado miembro. Las comparaciones entre paises tienen validez limitada por diferencias de calidad y de mercado.", "countries": res}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("diesel-eu-more.json: %d paises" % len(res), {c: (r[-1][0], r[-1][1]) for c, r in res.items()})
    return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""USDA AMS, despiece estimado nacional de la canal de cordero (LM_XL502, slug 2649) -> data/us-lamb.json.
API publica sin clave: https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2649/<seccion>
Dolares por 100 libras (cwt), media movil ponderada de 5 dias de precios FOB en planta (Mandatory Price Reporting) y rendimientos de la industria.
Por dia: valor bruto de la canal, valor neto, cuarto delantero (foresaddle) y trasero (hindsaddle), y si ese dia es una correccion de AMS (4.ª col. = 1).
Se guardan los ultimos 3 anos. Solo cifras publicadas; si falla la descarga o el formato cambia, el fichero anterior se conserva.
Uso: python3 scripts/update-us-lamb.py [--fixture ruta.json] [--out ruta]"""
import datetime, json, sys, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-lamb.json"
BASE = "https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2649/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
SECTIONS = [("GROSS CARCASS VALUE", "gross_carcass_price"), ("NET CARCASS VALUE", "net_carcass_price"), ("FORESADDLE VALUE", "foresaddle_price"), ("HINDSADDLE VALUE", "hindsaddle_price")]
KEEP_DAYS = 3 * 366
def iso(s): return datetime.datetime.strptime(s, "%m/%d/%Y").strftime("%Y-%m-%d")
def build(raw):
    """raw[seccion] = filas de la API. Devuelve filas [fecha, bruto, neto, delantero, trasero, correccion] ascendentes por fecha."""
    corr = {iso(r["report_date"]): 1 if r.get("is_correction") else 0 for r in raw["Summary"]}
    cols = []
    for sec, f in SECTIONS:
        cols.append({iso(r["report_date"]): r[f] for r in raw[sec] if r.get(f) is not None})
    days = sorted(set(cols[0]) & set(cols[1]) & set(cols[2]) & set(cols[3]))
    if not days: raise ValueError("sin dias con las cuatro cifras")
    last = datetime.date.fromisoformat(days[-1]); lim = (last - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    return [[d] + [round(float(c[d]), 4) for c in cols] + [corr.get(d, 0)] for d in days if d >= lim]
def get(sec):
    req = urllib.request.Request(BASE + urllib.parse.quote(sec), headers=H)
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode("utf-8"))["results"]
def main():
    args = sys.argv[1:]; outp = OUT
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1]); del args[i:i + 2]
    try:
        if args[:1] == ["--fixture"]: raw = json.loads(Path(args[1]).read_text())
        else: raw = {s: get(s) for s in ["Summary"] + [s for s, _ in SECTIONS]}
        rows = build(raw)
    except Exception as e: print("FALLO:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "USDA AMS, National Estimated Lamb Carcass Cutout (LM_XL502)", "url": "https://mymarketnews.ams.usda.gov/viewReport/2649", "license": "US Government work (public domain); credit: USDA AMS"},
           "unit": "USD/cwt (100 lb), 5-day rolling weighted average FOB plant", "columns": ["date", "gross", "net", "foresaddle", "hindsaddle", "correction"], "rows": rows}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(rows), "dias, ultimo", rows[-1][0]); return 0
if __name__ == "__main__": sys.exit(main())

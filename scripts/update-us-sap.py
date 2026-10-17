#!/usr/bin/env python3
"""Previsiones de precio medio de campana de EE. UU. (USDA ERS, Season-Average Price Forecasts) -> data/us-markets/sap-forecasts.json.
ERS calcula cada semana, con los futuros y la base, una PREVISION DE MODELO del precio medio recibido por el agricultor (maiz, soja, trigo, algodon).
No es una prevision oficial del USDA (lo dice el propio ERS) y no sustituye a la cifra del WASDE: el CSV trae las dos, y aqui se publican juntas.
Fuente: outputfc.csv (model_forecast_date, commodity, futures_model_type, marketing_year, MYA_price_model_forecast, MYA_price_WASDE_forecast,
WASDE_forecast_date, actual_MYA_price, price_unit). Los valores se copian tal cual; NA es un hueco. Si no valida, NO se toca el JSON anterior.
Uso: update-us-sap.py [--local DIR] [--out DIR]"""
import csv, io, re, sys, datetime
from collections import defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
PAGE = "https://www.ers.usda.gov/data-products/season-average-price-forecasts"
KNOWN = "https://www.ers.usda.gov/media/6497/output-forecast-csv-file.csv"
COMM = ["Corn", "Soybeans", "Wheat", "Cotton"]
RANGE = {"Corn": (0.5, 20), "Soybeans": (2, 40), "Wheat": (0.8, 25), "Cotton": (0.2, 3)}   # rango de sentido comun (USD por bushel / libra) para detectar un fichero corrupto
N_MY = 4        # campanas por producto (la actual, la siguiente y las anteriores para ver como convergio la prevision)
MAX_PTS = 140   # semanas por campana
def my_label(y): return "%d/%02d" % (y, (y + 1) % 100)
def build(rows):
    last = max(r["model_forecast_date"] for r in rows)
    out = []
    for c in COMM:
        rc = [r for r in rows if r["commodity"] == c]
        if not rc: raise ValueError("falta " + c)
        # tipo de modelo vigente = el de la fecha mas reciente (trigo paso de un contrato a tres)
        lastc = max(r["model_forecast_date"] for r in rc)
        types = {r["futures_model_type"] for r in rc if r["model_forecast_date"] == lastc}
        mtype = "Single contract" if "Single contract" in types else sorted(types)[0]
        rc = [r for r in rc if r["futures_model_type"] == mtype]
        by = defaultdict(dict)   # MY -> fecha -> fila
        unit = None
        for r in rc:
            y = int(r["marketing_year"]); by[y][r["model_forecast_date"]] = r; unit = r["price_unit"] or unit
        ys = sorted(by)[-N_MY:]
        years = []
        for y in ys:
            dates = sorted(by[y])[-MAX_PTS:]
            pts = []; actual = None
            for d in dates:
                r = by[y][d]; m = U.fnum(r["MYA_price_model_forecast"]); w = U.fnum(r["MYA_price_WASDE_forecast"])
                a = U.fnum(r["actual_MYA_price"])
                if a is not None: actual = a
                if m is None and w is None: continue
                pts.append([d, round(m, 4) if m is not None else None, round(w, 4) if w is not None else None])
            if len(pts) < 3: continue
            wd = [by[y][d]["WASDE_forecast_date"] for d in dates if by[y][d]["WASDE_forecast_date"] not in ("NA", "")]
            years.append({"marketYear": y, "label": my_label(y), "points": pts, "actual": actual, "wasdeDate": wd[-1] if wd else None})
        if not years: raise ValueError("sin campanas para " + c)
        lo, hi = RANGE[c]
        for y in years:
            for p in y["points"]:
                for v in p[1:]:
                    if v is not None and not lo <= v <= hi: raise ValueError("%s %s: %s fuera de rango" % (c, y["label"], v))
        out.append({"id": c, "unit": unit, "modelType": mtype, "latestForecastDate": lastc, "years": years})
    return last, out
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-markets" / "sap-forecasts.json"
    rc = 0
    try:
        url = None
        try: url = U.find_link(PAGE, r"output-forecast-csv-file[^\"]*\.csv|outputfc\.csv", "https://www.ers.usda.gov/")
        except Exception as e: U.log("pagina no legible:", repr(e)[:120])
        url = url or KNOWN
        U.log("CSV:", url)
        raw = U.get(url).decode("utf-8-sig", "replace")
        rows = list(csv.DictReader(io.StringIO(raw)))
        need = {"model_forecast_date", "commodity", "futures_model_type", "marketing_year", "MYA_price_model_forecast", "MYA_price_WASDE_forecast", "WASDE_forecast_date", "actual_MYA_price", "price_unit"}
        if len(rows) < 5000 or not need <= set(rows[0]): raise ValueError("formato inesperado: %d filas, columnas %s" % (len(rows), sorted(need - set(rows[0] if rows else []))))
        last, comm = build(rows)
        age = (datetime.date.today() - datetime.date.fromisoformat(last)).days
        if age > 75: raise ValueError("la ultima prevision es de hace %d dias (%s)" % (age, last))
        doc = {"schemaVersion": "1.0", "generatedAt": U.now_iso(), "sourceId": "usda_ers", "pageUrl": PAGE, "csvUrl": url,
               "latestForecastDate": last, "official": False,
               "note": {"es": "Prevision de modelo de ERS (futuros + base): NO es una prevision oficial del USDA. La cifra oficial es la del WASDE, que se muestra al lado.",
                        "en": "ERS model forecast (futures + basis): NOT an official USDA forecast. The official figure is the WASDE number, shown alongside."},
               "commodities": comm}
        U.write_json(out, doc)
        U.log("OK: %d productos, ultima prevision %s" % (len(comm), last))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-sap-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

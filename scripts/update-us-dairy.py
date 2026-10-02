#!/usr/bin/env python3
"""USDA AMS, National Dairy Products Sales Report (NDPSR, slug 2993) -> data/us-dairy.json.
API publica sin clave: https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2993/<seccion>
Por producto, precio semanal medio ponderado de las ventas (USD/lb) y ventas (lb): mantequilla, cheddar de bloque de 40 lb, suero seco y leche desnatada en polvo.
Historico = secciones "Final ..." (semanas ya revisadas, una fila por semana); las semanas mas recientes aun sin revision salen del informe actual y se marcan provisional (4.ª columna = 1).
Nada se calcula ni se rellena: filas sin precio se descartan. Si falla la descarga o el formato cambia, el fichero anterior se conserva.
Uso: python3 scripts/update-us-dairy.py [--fixture ruta.json]"""
import datetime, json, sys, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-dairy.json"
BASE = "https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2993/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
PRODUCTS = [("butter", "mantequilla", "Butter Prices and Sales", "Butter_Price", "Butter_Sales"),
            ("block", "cheddar", "40 Pound Block Cheddar Cheese Prices and Sales", "cheese_40_Price", "cheese_40_Sales"),
            ("whey", "suero", "Dry Whey Prices and Sales", "whey_Price", "whey_Sales"),
            ("nfdm", "leche_polvo", "Nonfat Dry Milk Prices and Sales", "nonfat_milk_Price", "nonfat_milk_Sales")]
KEEP_WEEKS = 520
def iso(s): return datetime.datetime.strptime(s, "%m/%d/%Y").strftime("%Y-%m-%d")
def fnum(t):
    if t is None: return None
    try: return float(str(t).replace(",", ""))
    except ValueError: return None
def points(rows, pf, sf):
    out = {}
    for r in rows:
        p = fnum(r.get(pf)); s = fnum(r.get(sf))
        if p is None or p <= 0: continue
        out[iso(r["Week Ending Date"])] = [round(p, 4), int(s) if s is not None else None]
    return out
def build(data):
    """data[clave] = {'current': [...], 'final': [...]} (filas tal cual de la API). Devuelve la lista de productos."""
    res = []
    for key, pid, sect, pf, sf in PRODUCTS:
        d = data[key]
        fin = points(d["final"], pf, sf)
        # solo el informe actual (ultimo published_date); las filas de informes antiguos ya estan en 'final'
        cur_rows = d["current"]
        if cur_rows:
            mx = max(r["published_date"] for r in cur_rows)
            cur_rows = [r for r in cur_rows if r["published_date"] == mx]
        cur = points(cur_rows, pf, sf)
        series = {k: v + [0] for k, v in fin.items()}
        for k, v in cur.items():
            if k not in series: series[k] = v + [1]
        if not series: raise ValueError("%s: sin filas con precio" % sect)
        rows = [[k] + series[k] for k in sorted(series)][-KEEP_WEEKS:]
        res.append({"id": pid, "section": sect, "unit": "USD/lb", "series": rows})
    return res
def get(section):
    req = urllib.request.Request(BASE + urllib.parse.quote(section), headers=H)
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode("utf-8"))["results"]
def main():
    args = sys.argv[1:]
    if args[:1] == ["--fixture"]: data = json.loads(Path(args[1]).read_text())
    else:
        data = {}
        for key, pid, sect, pf, sf in PRODUCTS:
            try: data[key] = {"current": get(sect), "final": get("Final " + sect)}
            except Exception as e: print("FALLO", sect, e); return 1
            print("OK", sect, len(data[key]["final"]), "semanas finales")
    try: prods = build(data)
    except Exception as e: print("FALLO formato:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "USDA AMS, National Dairy Products Sales Report (NDPSR)", "url": "https://mymarketnews.ams.usda.gov/viewReport/2993", "license": "US Government work (public domain); credit: USDA AMS"},
           "unit": "USD/lb", "columns": ["weekEnding", "price", "sales", "provisional"], "products": prods}
    out = Path(args[2]) if args[:1] == ["--fixture"] and len(args) > 2 else OUT
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", out.name, [(p["id"], len(p["series"]), p["series"][-1][0]) for p in prods])
    return 0
if __name__ == "__main__": sys.exit(main())

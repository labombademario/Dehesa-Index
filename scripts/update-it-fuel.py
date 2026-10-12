#!/usr/bin/env python3
"""Italia: gasoleo de automocion y de calefaccion, semanal desde 2005, y gasoleo en las gasolineras por region -> data/it-fuel.json
1) Precios medios semanales de los carburantes (Ministero dell'Ambiente e della Sicurezza Energetica, DGSAIE, servicio de exportacion CSV):
   GASOLIO_AUTO y GASOLIO_RISCALDAMENTO, en euros por 1.000 litros con impuestos -> EUR/l. Datos del sitio del MASE bajo CC BY 4.0 (note legali).
2) Precio del gasoleo en cada gasolinera a las 8 de la manana (Ministero delle Imprese e del Made in Italy, Osservaprezzi carburanti, IODL 2.0):
   Dehesa Index calcula la mediana por region (precios en autoservicio comunicados en los ultimos 8 dias) a partir de la provincia de cada estacion.
El gasoleo agricola (con impuesto reducido y cupos asignados por las regiones a traves del UMA) no tiene un precio publico nacional.
Si una parte falla se conserva la del fichero anterior. Uso: python3 scripts/update-it-fuel.py"""
import csv, datetime, io, json, statistics, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "it-fuel.json"
WEEKLY = "https://sisen.mase.gov.it/dgsaie/api/v1/weekly-prices/report/export?format=CSV&lang=en"
PRICES = "https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv"
PLANTS = "https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
TODAY = datetime.date.today()
# sigla de provincia -> region (ids de vendor/it-regions.js)
PR = {"ABR": "AQ CH PE TE", "BAS": "MT PZ", "CAL": "CS CZ KR RC VV", "CAM": "AV BN CE NA SA", "EMR": "BO FC FE MO PC PR RA RE RN", "FVG": "GO PN TS UD",
      "LAZ": "FR LT RI RM VT", "LIG": "GE IM SP SV", "LOM": "BG BS CO CR LC LO MB MI MN PV SO VA", "MAR": "AN AP FM MC PU", "MOL": "CB IS",
      "PIE": "AL AT BI CN NO TO VB VC", "PUG": "BA BR BT FG LE TA", "SAR": "CA NU OR SS SU CI VS OG OT", "SIC": "AG CL CT EN ME PA RG SR TP",
      "TAA": "BZ TN", "TOS": "AR FI GR LI LU MS PI PO PT SI", "UMB": "PG TR", "VDA": "AO", "VEN": "BL PD RO TV VE VI VR"}
P2R = {p: r for r, ps in PR.items() for p in ps.split()}
def get(u, t=240):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def num(s):
    s = (s or "").strip().replace(",", "")
    try: return float(s)
    except ValueError: return None
def weekly():
    rows = list(csv.DictReader(io.StringIO(get(WEEKLY).decode("utf-8-sig"))))
    out = []
    for r in rows:
        d = (r.get("SURVEY_DATE") or "").strip(); a = num(r.get("AUTOMOTIVE_GAS_OIL")); h = num(r.get("HEATING_GAS_OIL"))
        if len(d) == 10 and a: out.append([d, round(a / 1000, 4), round(h / 1000, 4) if h else None])
    out.sort()
    if len(out) < 500: raise ValueError("serie semanal corta: %d" % len(out))
    for x in out:
        if not 0.6 < x[1] < 3.5: raise ValueError("gasoleo fuera de rango en %s: %s" % (x[0], x[1]))
    return out
def stations():
    def rows(u):
        L = get(u, 300).decode("utf-8", "replace").splitlines()
        return list(csv.reader(L[2:], delimiter="|"))   # linea 1: «Estrazione del ...»; linea 2: cabecera
    prov = {}
    for r in rows(PLANTS):
        if len(r) >= 8: prov[r[0]] = r[7].strip().upper()
    cut = TODAY - datetime.timedelta(days=8); by = {}
    for r in rows(PRICES):
        if len(r) < 5 or r[1].strip() != "Gasolio" or r[3].strip() != "1": continue   # gasoleo normal, autoservicio
        try: v = float(r[2]); d = datetime.datetime.strptime(r[4].strip()[:10], "%d/%m/%Y").date()
        except ValueError: continue
        reg = P2R.get(prov.get(r[0], ""))
        if reg and d >= cut and 0.8 < v < 3.5: by.setdefault(reg, []).append(v)
    allv = [v for vs in by.values() for v in vs]
    if len(allv) < 8000: raise ValueError("solo %d gasolineras con precio reciente" % len(allv))
    return {"date": TODAY.isoformat(), "median": round(statistics.median(allv), 3), "n": len(allv), "regions": {k: [round(statistics.median(v), 3), len(v)] for k, v in sorted(by.items())}}
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "EUR/l",
           "source": {"name": "MASE (DGSAIE), prezzi medi settimanali dei carburanti; MIMIT, Osservaprezzi carburanti", "url": "https://sisen.mase.gov.it/dgsaie/prezzi-settimanali-carburanti",
                      "stationsUrl": "https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti", "license": "CC BY 4.0 (MASE); IODL 2.0 (MIMIT)"},
           "fields": ["date", "dieselTax", "heatingOilTax"]}
    try: doc["weekly"] = weekly()
    except Exception as e:
        print("AVISO serie semanal:", e)
        if old.get("weekly"): doc["weekly"] = old["weekly"]
    try: doc["stations"] = stations()
    except Exception as e:
        print("AVISO gasolineras:", e)
        if old.get("stations"): doc["stations"] = old["stations"]
    if "weekly" not in doc or "stations" not in doc: print("FALLO: falta una de las dos partes"); return 0 if OUT.exists() else 1
    doc["asOf"] = doc["weekly"][-1][0]
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    w = doc["weekly"][-1]; s = doc["stations"]
    print("it-fuel.json: %d semanas (%s..%s); %s gasoleo %.3f, calefaccion %s; gasolineras %d, mediana %.3f en %d regiones" % (len(doc["weekly"]), doc["weekly"][0][0], w[0], w[0], w[1], w[2], s["n"], s["median"], len(s["regions"])))
    return 0
if __name__ == "__main__": sys.exit(main())

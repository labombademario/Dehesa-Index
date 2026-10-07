#!/usr/bin/env python3
"""Tipos de cambio historicos mensuales (media del periodo, tipo de referencia del BCE) frente al euro, desde 1999.
API de datos del BCE (SDMX, publica y sin clave): EXR/M.<MONEDA>.EUR.SP00.A. Escribe data/fx-history.json y data/fx-history-log.txt.
Formato: {"base":"EUR","quote":"unidades de moneda por 1 EUR","currencies":{"USD":[["1999-01",1.1608],...]}}. Se usa en el cliente para convertir series largas
con el tipo de cada periodo (no el de hoy)."""
import csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CUR = ["USD", "CAD", "AUD", "GBP", "DKK", "CHF"]
URL = "https://data-api.ecb.europa.eu/service/data/EXR/M.%s.EUR.SP00.A?format=csvdata&startPeriod=1999-01"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Dehesa-Index-data-bot/1.0", "Accept": "text/csv"}), timeout=60) as r: return r.read().decode("utf-8")
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:200])
def main():
    out = {}
    for c in CUR:
        try: rows = list(csv.DictReader(io.StringIO(get(URL % c))))
        except Exception as e: log("ERROR", c, e); continue
        pts = sorted((r["TIME_PERIOD"], round(float(r["OBS_VALUE"]), 6)) for r in rows if r.get("OBS_VALUE") not in (None, ""))
        if len(pts) < 100: log("pocos puntos", c, len(pts)); continue
        out[c] = [list(p) for p in pts]; log(c, len(pts), "meses, ultimo", pts[-1])
    if len(out) < 4: log("faltan monedas"); (ROOT / "data" / "fx-history-log.txt").write_text("\n".join(LOG)); sys.exit(1)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "base": "EUR", "quote": "units of currency per 1 EUR (monthly average)",
           "source": {"name": "European Central Bank — euro foreign exchange reference rates", "url": "https://data.ecb.europa.eu/data/datasets/EXR", "license": "ECB reuse policy (free with attribution)"}, "currencies": out}
    (ROOT / "data" / "fx-history.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "fx-history-log.txt").write_text("\n".join(LOG))
main()

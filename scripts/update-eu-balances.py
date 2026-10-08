#!/usr/bin/env python3
"""UE: balance de cereales de la Comisión Europea (DG AGRI) -> data/supply-balances/eu.json.
Descarga Cereals_bs_EUROPA_EU.xlsx y lo convierte con scripts/build_supply_balances.py (build_eu), que comprueba que cada balance cuadra.
Si la descarga falla o el libro cambia de forma, el script termina con error y se conserva el JSON anterior (nunca se publica un balance dudoso)."""
import sys, tempfile, time, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_supply_balances as B
URL = "https://circabc.europa.eu/sd/a/2f20cdb4-6113-48d8-9990-b1ac7edd2e2a/Cereals_bs_EUROPA_EU.xlsx"
UA = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
def download():
    last = None
    for i in range(4):
        try:
            data = urllib.request.urlopen(urllib.request.Request(URL, headers=UA), timeout=120).read()
            if data[:2] != b"PK": raise RuntimeError("la respuesta no es un Excel (%d bytes)" % len(data))
            return data
        except Exception as e:
            last = e; print("intento %d: %r" % (i + 1, e), flush=True); time.sleep(5 * (i + 1))
    raise SystemExit("no se pudo descargar el balance de la UE: %r" % last)
if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as d:
        f = Path(d) / "cereals.xlsx"; f.write_bytes(download())
        doc = B.build_eu(str(f))
    print("eu.json: %d campañas, %d productos" % (len(doc["campaigns"]), len(doc["products"])))

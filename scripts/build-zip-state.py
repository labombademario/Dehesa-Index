#!/usr/bin/env python3
"""Genera data/us-cash-bids/zip-state.json: tabla codigo postal -> estado para el selector «cerca de mi» de precios-locales.html.

Fuente: US Census Bureau ZIP Code Tabulation Areas (ZCTA, Censo 2000; dominio publico como obra del gobierno federal) segun la copia CSV
https://github.com/scpike/us-state-county-zip (geo-data.csv), derivada del recurso ZIP de MCDC (Universidad de Missouri). Es un HECHO geografico (a que estado
pertenece cada ZIP), no una lista comercial; sin coordenadas, sin ciudades, sin condados.
Formato compacto: `prefix[ZIP3] = estado dominante`; `exceptions[ZIP5] = estado` solo cuando el ZIP no coincide con el dominante de su prefijo.
Uso: python3 scripts/build-zip-state.py /ruta/geo-data.csv   (el CSV se descarga a mano; el script no accede a la red)."""
import csv, sys, json, collections, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STATES = set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split())
def build(rows):
    z = {}
    for r in rows:
        zc = str(r["zipcode"]).strip().zfill(5); st = r["state_abbr"].strip().upper()
        if len(zc) == 5 and zc.isdigit() and st in STATES: z[zc] = st
    by = collections.defaultdict(collections.Counter)
    for zc, st in z.items(): by[zc[:3]][st] += 1
    prefix = {p: c.most_common(1)[0][0] for p, c in sorted(by.items())}
    exc = {zc: st for zc, st in sorted(z.items()) if prefix[zc[:3]] != st}
    return prefix, exc, len(z)
if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    prefix, exc, n = build(csv.DictReader(open(sys.argv[1], encoding="utf-8")))
    out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sourceId": "us_census_zcta",
           "note": "ZCTA del Censo 2000; un ZIP posterior cuyo prefijo exista se asigna al estado dominante del prefijo. Solo estado: no hay coordenadas ni condados.",
           "zips": n, "prefix": prefix, "exceptions": exc}
    (ROOT / "data/us-cash-bids/zip-state.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("zip-state.json: %d ZIP, %d prefijos, %d excepciones" % (n, len(prefix), len(exc)))

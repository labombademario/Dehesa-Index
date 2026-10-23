#!/usr/bin/env python3
"""Indices de precios de materias primas del Banco de Canada (BCPI) -> data/ca-boc-bcpi-stats.json (formato *-stats.json, pais CA).
API Valet, grupos BCPI_WEEKLY y BCPI_MONTHLY. Indices en dolares de EE. UU., 1972 = 100: total, sin energia, energia, metales y minerales, silvicultura, agricultura y pesca.
La pesca se publica solo mensual (en el grupo semanal repite el ultimo dato mensual), asi que no se guarda como semanal. Cada punto es una cifra publicada; nada se calcula.
Semanal: se guardan las ultimas 520 semanas (10 anos); mensual: desde el inicio.
Uso: update-ca-boc-bcpi.py [--local DIR] [--out DIR]"""
import json, sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
VAL = "https://www.bankofcanada.ca/valet/observations/group/%s/json"
SRC = "Bank of Canada, Commodity Price Index (BCPI)"
PAGE = "https://www.bankofcanada.ca/rates/price-indexes/bcpi/"
NAMES = {"BCPI": "total", "BCNE": "total excluding energy", "ENER": "energy", "MTLS": "metals and minerals", "FOPR": "forestry", "AGRI": "agriculture", "FISH": "fish"}
GROUP = {"AGRI": "prices", "FOPR": "prices", "FISH": "prices", "ENER": "prices", "BCPI": "prices", "BCNE": "prices", "MTLS": "prices"}
def series_from(doc, freq):
    """doc = JSON de Valet. Devuelve [serie]. freq: 'weekly' o 'monthly'."""
    w = freq == "weekly"; pre = "W." if w else "M."; by = {}
    for o in doc["observations"]:
        for k, v in o.items():
            if not k.startswith(pre) or not isinstance(v, dict): continue
            code = k[2:]
            if code not in NAMES or (w and code == "FISH"): continue
            try: by.setdefault(code, []).append((o["d"] if w else o["d"][:7], float(v["v"])))
            except (KeyError, ValueError, TypeError): pass
    out = []
    for code, pts in sorted(by.items()):
        s = U.mk_series("ca-boc-bcpi-%s-%s" % (code.lower(), "w" if w else "m"), GROUP[code], "Bank of Canada commodity price index (BCPI), %s, %s" % (NAMES[code], freq),
                        "index 1972=100 (US$)", freq, pts, SRC, min_points=52 if w else 24, max_age_years=1, keep=520 if w else None)
        if s: out.append(s)
    return out
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "ca-boc-bcpi-stats.json"
    rc = 0
    try:
        ser = []
        for g, f in (("BCPI_WEEKLY", "weekly"), ("BCPI_MONTHLY", "monthly")):
            ser += series_from(json.loads(U.get(VAL % g).decode("utf-8")), f)
        ids = {s["id"] for s in ser}
        U.log("series:", len(ser))
        for need in ("ca-boc-bcpi-agri-w", "ca-boc-bcpi-agri-m", "ca-boc-bcpi-fish-m", "ca-boc-bcpi-fopr-m", "ca-boc-bcpi-ener-m"):
            if need not in ids: raise ValueError("falta " + need)
        doc = U.stats_doc(SRC, PAGE, "Bank of Canada terms of use (attribution)", ser)
        doc["countries"] = {"CA": dict(doc["countries"]["US"], name="Canada")}
        U.write_json(out, doc); U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "ca-boc-bcpi-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

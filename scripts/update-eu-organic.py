#!/usr/bin/env python3
"""Precios ecologicos frente al producto de comparacion -> data/eu-organic-stats.json (Agri-food Data Portal de la Comision Europea, /organic/prices).
El portal publica, por pais, mes, sector y producto, el precio ecologico, el precio del producto de comparacion («overall») y el diferencial en %.
Reglas: todo tal como lo publica el portal (sin convertir ni estimar); el diferencial se copia, no se recalcula, y se comprueba contra los dos precios
(si una fila no cuadra a 0,15 puntos, se descarta y se registra). Un hueco es un hueco.
Uso: python3 scripts/update-eu-organic.py [--local DIR] [--out DIR]   (--local: DIR/organic.json en lugar de la red; solo pruebas)"""
import json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import usda_lib as U

URL = "https://api.tech.ec.europa.eu/agrifood/api/organic/prices"
NAMES = {"AT": "Austria", "BE": "Belgium", "BG": "Bulgaria", "HR": "Croatia", "CY": "Cyprus", "CZ": "Czechia", "DK": "Denmark", "EE": "Estonia", "FI": "Finland", "FR": "France", "DE": "Germany", "EL": "Greece", "HU": "Hungary", "IE": "Ireland", "IT": "Italy", "LV": "Latvia", "LT": "Lithuania", "LU": "Luxembourg", "MT": "Malta", "NL": "Netherlands", "PL": "Poland", "PT": "Portugal", "RO": "Romania", "SK": "Slovakia", "SI": "Slovenia", "ES": "Spain", "SE": "Sweden", "UK": "United Kingdom"}
ISO = {"GR": "EL", "GB": "UK"}

def load():
    if U.LOCAL is not None:
        return json.loads((U.LOCAL / "organic.json").read_text(encoding="utf-8"))
    return json.loads(U.get(URL, timeout=300, accept="*/*").decode("utf-8"))

def main():
    local, out = U.parse_args(); out = out or (U.ROOT / "data")
    rows = load()
    if not isinstance(rows, list) or len(rows) < 500: raise SystemExit("organic/prices: respuesta inesperada (%s filas)" % (len(rows) if isinstance(rows, list) else type(rows)))
    groups = {}; bad = 0
    for r in rows:
        o, a, d = r.get("organicPrice"), r.get("overallPrice"), r.get("differencePercentage")
        cc = ISO.get(r.get("memberStateCode"), r.get("memberStateCode"))
        if not cc or not r.get("year") or not r.get("monthNumber") or o is None or a is None or not o > 0 or not a > 0: bad += 1; continue
        if d is not None and abs((o / a - 1) * 100 - d) > 0.15: bad += 1; continue
        key = (cc, r["sector"], r["organicProduct"], r["overallProduct"], r["organicStage"], r.get("overallStage"), r.get("organicUnit"), r.get("overallUnit"))
        g = groups.setdefault(key, {"o": {}, "a": {}, "d": {}})
        p = "%04d-%02d" % (r["year"], r["monthNumber"])
        g["o"][p] = o; g["a"][p] = a
        if d is not None: g["d"][p] = d
    U.log("filas %d, descartadas %d, series candidatas %d" % (len(rows), bad, len(groups)))
    countries = {}
    for (cc, sector, op, ap, stage, astage, ou, au), g in sorted(groups.items()):
        base = "eu-org-%s-%s-%s" % (cc.lower(), U.slug(sector, 20), U.slug(op, 28))
        if ap and ap != op: base += "-vs-" + U.slug(ap, 24)
        stage_note = stage if stage == astage or not astage else "%s / %s" % (stage, astage)
        what = "%s vs %s" % (op, ap) if ap and ap != op else op
        for kind, lab, unit, pts in (("organic", "organic price", ou, g["o"]), ("overall", "comparison price (%s)" % (ap or "overall"), au or ou, g["a"]), ("premium", "organic premium over comparison", "%", g["d"])):
            if kind == "premium" and not pts: continue
            s = U.mk_series("%s-%s" % (base, kind), "prices", "%s: %s, %s (EU Agri-food)" % (sector, what, lab), unit or "", "monthly", sorted(pts.items()), "EU Agri-food organic prices", min_points=6, max_age_years=2,
                            note="Stage: %s. Prices as published by the European Commission; the premium is the Commission's own figure." % stage_note)
            if s: countries.setdefault(cc, []).append(s)
    n = sum(len(v) for v in countries.values())
    if n < 150: raise SystemExit("solo %d series de ecologico (se esperaban mas de 150): no se escribe" % n)
    src = {"name": "European Commission, Agri-food Data Portal (organic prices)", "url": "https://agridata.ec.europa.eu/extensions/DashboardPrices/OrganicPrices.html", "license": "EU Commission reuse policy (Decision 2011/833/EU), CC BY 4.0"}
    doc = {"schemaVersion": 1, "generatedAt": U.now_iso(), "countries": {cc: {"name": NAMES.get(cc, cc), "extend": True, "source": src, "series": v} for cc, v in sorted(countries.items())}, "log": U.LOG[-40:]}
    U.write_json(out / "eu-organic-stats.json", doc); U.write_log(out / "eu-organic-log.txt")
    print("OK %d series en %d paises" % (n, len(countries)))

if __name__ == "__main__": main()

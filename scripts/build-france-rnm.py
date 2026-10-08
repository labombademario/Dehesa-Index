#!/usr/bin/env python3
"""Francia (FranceAgriMer, RNM - Reseau des Nouvelles des Marches, a mano): cotizaciones de cerdo, cordero, vacuno, ternera, huevos y conejo
-> data/france-rnm-stats.json (formato country-stats). Entrada: los CSV anuales COT-MUL-prd_RNM-A*.csv (ISO-8859-1, ';', coma decimal).
  python3 scripts/build-france-rnm.py <COT-MUL-prd_RNM-A25.csv> [<A26.csv> ...]
Las cotizaciones diarias de Rungis se resumen en la ultima cotizacion de cada semana; el resto ya es semanal. Ventana corta: lo que traigan los CSV (2025 en adelante)."""
import csv, datetime, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ws = lambda s: re.sub(r"\s+", " ", s).strip()
# (mercado, producto, id, grupo, etiqueta, unidad, divisor para pasar a la unidad final)
SER = [("France : porc charcutier entrée abattoir", "PORC (carcasse) France classe E", "pork-e", "Pig carcass, France, class E, slaughterhouse intake", "€/kg", 1),
       ("France : porc charcutier entrée abattoir", "PORC (carcasse) France classe S", "pork-s", "Pig carcass, France, class S, slaughterhouse intake", "€/kg", 1),
       ("Cadran de Plérin : porc charcutier", "PORC (carcasse) 56% taux-de-muscle-des-pièces Bretagne", "pork-plerin", "Pig carcass 56% lean, Cadran de Plérin (Brittany)", "€/100 kg", 1),
       ("Bassin Bretagne : porcelets", "PORCELET 25 kg Bretagne", "piglet-25-bre", "Piglet 25 kg, Brittany, with premium", "€/kg", 1),
       ("MIN de Rungis : ovins", "AGNEAU (carcasse) couvert 16-22 kg France cat. R", "lamb-rungis-r", "Lamb carcass 16-22 kg, France, class R, Rungis wholesale", "€/kg", 1),
       ("MIN de Rungis : gros bovins", "BOEUF vache (carcasse) France cat. R", "beef-cow-rungis-r", "Cow carcass, France, class R, Rungis wholesale", "€/kg", 1),
       ("MIN de Rungis : gros bovins", "BOEUF génisse (carcasse) France cat. R", "beef-heifer-rungis-r", "Heifer carcass, France, class R, Rungis wholesale", "€/kg", 1),
       ("MIN de Rungis : veau", "VEAU (carcasse) blanc France cat. E", "veal-rungis-e", "White veal carcass, France, class E, Rungis wholesale", "€/kg", 1),
       ("MIN de Rungis : œuf", "OEUF M(53-63g) cat.A France colis de 360", "egg-m-rungis", "Eggs size M, class A, France, Rungis wholesale", "€/100 eggs", 1),
       ("MIN de Rungis : œuf", "OEUF G(63-73g) cat.A France colis de 360", "egg-l-rungis", "Eggs size L, class A, France, Rungis wholesale", "€/100 eggs", 1),
       ("France : lapin vif", "LAPIN vif France", "rabbit-live", "Live rabbit, France, farm gate", "€/kg", 1),
       ("MIN de Rungis : volaille", "LAPIN (entier) France standard", "rabbit-rungis", "Whole rabbit, France, Rungis wholesale", "€/kg", 1)]
def load(paths):
    rows = {}
    for f in paths:
        with open(f, encoding="cp1252", newline="") as fh:
            rd = csv.reader(fh, delimiter=";"); hdr = [ws(h) for h in next(rd)]; ix = {h: i for i, h in enumerate(hdr)}
            for r in rd:
                if len(r) < len(hdr): continue
                m, p, v = ws(r[ix["marché"]]), ws(r[ix["produit"]]), ws(r[ix["valeur en euro(s)"]]).replace(" ", "").replace(",", ".")
                try: val = float(v); dt = datetime.datetime.strptime(ws(r[ix["date cotation"]]), "%d/%m/%Y").date()
                except ValueError: continue
                rows.setdefault((m, p), {})[dt] = val
    return rows
def main(paths):
    data = load(paths); series = []
    for m, p, sid, lab, unit, _ in SER:
        d = data.get((ws(m), ws(p)))
        assert d, "sin datos: %s / %s" % (m, p)
        wk = {}
        for dt, v in sorted(d.items()): wk[dt.isocalendar()[:2]] = (dt, v)   # ultima cotizacion de cada semana ISO
        pts = [[dt.isoformat(), round(v, 4)] for dt, v in sorted(wk.values())]
        vals = [v for _p, v in pts]; assert 0.5 < min(vals) and max(vals) < 400, sid
        last, prev = pts[-1][1], pts[-2][1]
        series.append({"id": "fr-rnm-" + sid, "group": "prices_lv", "label": lab, "unit": unit, "frequency": "weekly", "latestPeriod": pts[-1][0], "latest": last,
                       "changePct": round((last - prev) / prev * 100, 2), "points": pts, "sourceGroup": "FranceAgriMer – RNM (Réseau des Nouvelles des Marchés)"})
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"FR": {"name": "France", "source": {"name": "FranceAgriMer – RNM", "url": "https://rnm.franceagrimer.fr/", "license": "Licence Ouverte 2.0"}, "series": series}}, "log": []}
    (ROOT / "data" / "france-rnm-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for s in series: print(s["id"], s["latestPeriod"], s["latest"], len(s["points"]))
if __name__ == "__main__":
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    main(sys.argv[1:])

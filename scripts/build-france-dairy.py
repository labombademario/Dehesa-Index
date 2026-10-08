#!/usr/bin/env python3
"""Francia (FranceAgriMer, a mano): leche de vaca mensual (recogida, grasa, proteina, precio al ganadero) y precio del Comte, del Tableau de bord hebdomadaire du lait (PDF con capa de texto)
-> data/france-dairy-stats.json (formato country-stats).
  python3 scripts/build-france-dairy.py <TDB-LAI-PRODUITS-*.pdf>
Necesita pdftotext (poppler). Las tablas se leen por orden de aparicion y se validan contra las medias que el propio PDF imprime ('Moy. fin juil.').
Solo se publica lo que sale de FranceAgriMer/SSP/RNM: los quesos de ZMB e ISMEA de la misma pagina son de terceros y no se usan."""
import datetime, json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MON = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]
MON3 = ["janv", "fevr", "mars", "avr", "mai", "juin", "juil", "aout", "sept", "oct", "nov", "dec"]
def num(s):
    s = s.strip().replace("\xa0", " ").replace("%", "")
    if s in (".", "", "sc", "NC", "nd"): return None
    return float(s.replace(" ", "").replace(",", "."))
def month_rows(page, names):
    import unicodedata
    out = []
    for l in page.splitlines():
        cells = re.split(r"\s{2,}", l.strip())
        k = "".join(c for c in unicodedata.normalize("NFD", cells[0].lower().rstrip(".")) if unicodedata.category(c) != "Mn")
        if k in names and len(cells) > 3: out.append((names.index(k) + 1, [num(c) for c in cells[1:]]))
    return out
def blocks(rows):
    """Bloques consecutivos de 12 meses (enero..diciembre)."""
    out, cur = [], []
    for m, v in rows:
        if m == 1 and cur: out.append(cur); cur = []
        cur.append((m, v))
    if cur: out.append(cur)
    return out
def mk(id_, label, unit, pts, grp="milk"):
    pts = sorted((p, round(v, 4)) for p, v in pts if v is not None)
    last, prev = pts[-1][1], pts[-2][1]
    return {"id": id_, "group": grp, "label": label, "unit": unit, "frequency": "monthly", "latestPeriod": pts[-1][0], "latest": last, "changePct": round((last - prev) / prev * 100, 2) if prev else None,
            "points": [[p, v] for p, v in pts], "sourceGroup": "FranceAgriMer / SSP – enquête mensuelle laitière"}
def two_years(block, col25, col26, year=2026):
    pts = []
    for m, v in block:
        for y, c in ((year - 1, col25), (year, col26)):
            if c < len(v) and v[c] is not None: pts.append(("%d-%02d" % (y, m), v[c]))
    return pts
def main(pdf):
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True, check=True).stdout.split("\f")
    year = int(re.search(r"(20\d\d)", re.search(r"Semaine n°\d+, du [\d/]*?(\d{4})", " ".join(txt)).group(0)).group(1)) if re.search(r"Semaine n°\d+, du [\d/]*?(\d{4})", " ".join(txt)) else 2026
    p1, p2 = blocks(month_rows(txt[0], MON)), blocks(month_rows(txt[1], MON))
    assert len(p1) >= 1 and len(p2) >= 4, (len(p1), len(p2))
    coll, org, share, std, real = p1[0], p2[0], p2[1], p2[2], p2[3]
    assert coll[0][1][0] == 1958349.0 or coll[0][1][0] > 1e6, coll[0]
    # validacion contra el PDF: la media simple enero-julio debe acercarse (1,5 %) a la 'Moy.fin juil.' que imprime (ponderada por volumen)
    stated = [[num(c) for c in re.split(r"\s{2,}", l.strip())[1:]] for l in txt[1].splitlines() if re.match(r"\s*\.?\s*Moy\.\s*fin juil\.", l)]
    assert len(stated) == 2, stated
    for blk, st in ((std, stated[0]), (real, stated[1])):
        for col25, col26, i25, i26 in ((0, 1, 0, 1), (3, 4, 3, 4), (6, 7, 6, 7)):
            for col, ix in ((col25, i25), (col26, i26)):
                vals = [v[col] for _m, v in blk if _m <= 7 and v[col] is not None]
                if len(vals) == 7 and st[ix] is not None: assert abs(sum(vals) / 7 / st[ix] - 1) < 0.015, (col, sum(vals) / 7, st[ix])
    S = []
    # la recogida total ya esta en el catalogo con mas historia (Eurostat fr-eus-milk-m-d1110d, desde 1968): aqui solo grasa, proteina, bio y precios
    S.append(mk("fr-dairy-fat", "Cow milk fat content, all milks, France", "g/l", two_years(coll, 3, 4, year)))
    S.append(mk("fr-dairy-protein", "Cow milk protein content, all milks, France", "g/l", two_years(coll, 6, 7, year)))
    S.append(mk("fr-dairy-collection-organic", "Organic cow milk collection, France", "1000 l", two_years(org, 0, 1, year)))
    for nm, c in (("all", 0), ("conventional", 3), ("organic", 6)):
        S.append(mk("fr-dairy-price-std-" + nm, "Farm milk price, standard 38 g fat/32 g protein, %s milk, France" % nm, "€/1000 l", two_years(std, c, c + 1, year), "prices_lv"))
        S.append(mk("fr-dairy-price-real-" + nm, "Farm milk price incl. premiums, %s milk, France" % nm, "€/1000 l", two_years(real, c, c + 1, year), "prices_lv"))
    # Comté (RNM): pagina de quesos; columnas por producto: 2025, 2026, ecart, moy5
    cheese = month_rows(txt[20], MON3)
    pts = []
    for m, v in cheese[:12]:
        if len(v) >= 3:
            if v[0] is not None: pts.append(("%d-%02d" % (year - 1, m), v[0]))
            if len(v) >= 4 and v[1] is not None and len(v) >= 16: pts.append(("%d-%02d" % (year, m), v[1]))
    S.append(mk("fr-dairy-comte", "Comté cheese, wheel, France (RNM)", "€/kg", pts, "prices"))
    for s in S:
        vals = [v for _p, v in s["points"]]
        assert len(vals) >= 7, s["id"]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"FR": {"name": "France", "source": {"name": "FranceAgriMer – tableau de bord lait", "url": "https://www.franceagrimer.fr/", "license": "Licence Ouverte 2.0"}, "series": S}}, "log": []}
    (ROOT / "data" / "france-dairy-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for s in S: print(s["id"], s["latestPeriod"], s["latest"], len(s["points"]))
if __name__ == "__main__":
    if len(sys.argv) != 2: raise SystemExit(__doc__)
    main(sys.argv[1])

#!/usr/bin/env python3
"""Corcho en España: produccion por comunidad autonoma, 2014-2022 (MITECO, Estadistica Anual de Otros Aprovechamientos Forestales) + 2024 (Anuario forestal, copiado a mano)
-> data/es-cork.json.
Fuente 1 (automatica): libro «Tablas resumen 2005-2022»; una hoja por año; se lee la columna «Corcho» y las filas «Total <CCAA>» / «Total general» / «TOTAL».
  Las hojas de 2005-2013 tienen otro diseño (sin filas de total) y NO se leen: no se adivina nada.
Fuente 2 (manual): data/es-cork-manual.json, cifras de la tabla E.1 del Anuario de Estadistica Forestal 2024 (PDF), copiadas tal cual; 2023 no esta publicado.
Aviso que da el propio MITECO: la cifra de Andalucia (35.000 t en 2020-2022) es una ESTIMACION porque la comunidad no aporta la produccion en monte privado.
Nada se rellena ni interpola: celda vacia = sin dato. Uso: python3 scripts/update-es-cork.py [--file libro.xlsx] (--file para probar sin red)."""
import argparse, datetime, io, json, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
URL = "https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/estadisticas/otros-aprovecha-forestales/OTROS-APROVECHAMIENTOS-FORESTALES-Tablas-resumen-2005-2022.xlsx"
PAGE = "https://www.miteco.gob.es/es/biodiversidad/estadisticas/forestal_anual_otros_aprovechamientos.html"
CCAA = {"andalucia": ("AN", "Andalucía"), "aragon": ("AR", "Aragón"), "asturias": ("AS", "Asturias"), "c valenciana": ("CV", "Comunidad Valenciana"), "canarias": ("CN", "Canarias"),
        "cantabria": ("CB", "Cantabria"), "castilla y leon": ("CL", "Castilla y León"), "castilla-la mancha": ("CM", "Castilla-La Mancha"), "cataluna": ("CT", "Cataluña"),
        "extremadura": ("EX", "Extremadura"), "galicia": ("GA", "Galicia"), "la rioja": ("RI", "La Rioja"), "madrid": ("MD", "Madrid"), "c de madrid": ("MD", "Madrid"),
        "murcia": ("MC", "Murcia"), "navarra": ("NA", "Navarra"), "c f de navarra": ("NA", "Navarra"), "pais vasco": ("PV", "País Vasco")}
def key(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(s.replace(".", " ").replace(",", " ").split())
def parse(xlsx_bytes):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True); out = {}; log = []
    for ws in wb.worksheets:
        if not ws.title.isdigit() or int(ws.title) < 2014: continue
        rows = list(ws.iter_rows(values_only=True)); hi = None
        for i, r in enumerate(rows[:10]):
            for j, c in enumerate(r):
                if isinstance(c, str) and c.strip().lower().startswith("corcho"): hi = (i, j); break
            if hi: break
        if not hi: log.append("%s: sin columna Corcho" % ws.title); continue
        i, j = hi; y = int(ws.title); per = {}; tot = None
        for r in rows[i + 1:]:
            a = r[0] if r else None
            if not isinstance(a, str) or not a.strip().lower().startswith("total"): continue
            v = r[j] if len(r) > j else None
            v = round(float(v), 2) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
            nm = a.strip()[5:].strip()
            if key(nm) == "general" or a.strip() == "TOTAL": tot = v; continue
            k = CCAA.get(key(nm))
            if k is None: log.append("%s: comunidad desconocida %r" % (y, nm)); continue
            if v is not None: per[k[0]] = v
        if tot is None or not per: log.append("%s: sin total" % y); continue
        s = sum(per.values())
        if abs(s - tot) > 1.0:
            log.append("%s: el total publicado (%.2f) no cuadra con la suma de comunidades (%.2f); diferencia %.2f. Se usa la suma y se guarda el total publicado" % (y, tot, s, tot - s))
            out[y] = {"total": round(s, 2), "totalIsSum": True, "publishedTotal": tot, "ccaa": per}
        else: out[y] = {"total": tot, "ccaa": per}
    return out, log
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file"); a = ap.parse_args()
    try:
        if a.file: b = Path(a.file).read_bytes()
        else:
            req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex)"})
            b = urllib.request.urlopen(req, timeout=120).read()
        years, log = parse(b)
    except Exception as e:
        print("::warning::MITECO corcho: %s; se conserva el fichero anterior" % e); return 1
    if len(years) < 7:
        print("::warning::MITECO corcho: solo %d años legibles (%s); se conserva el fichero anterior" % (len(years), "; ".join(log))); return 1
    man = json.loads((D / "es-cork-manual.json").read_text(encoding="utf-8")); my = int(man["year"])
    if my in years: print("::warning::el año manual %d ya esta en el libro; manda el libro" % my)
    else: years[my] = {"total": round(sum(man["ccaa"].values()), 2), "ccaa": man["ccaa"], "totalIsSum": True, "manual": True}
    names = {v[0]: v[1] for v in CCAA.values()}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "t",
           "years": {str(y): years[y] for y in sorted(years)}, "names": {c: names[c] for c in sorted({c for y in years.values() for c in y["ccaa"]})},
           "estimated": {"AN": [y for y in sorted(years) if years[y]["ccaa"].get("AN") == 35000.0]},
           "notes": {"es": "Andalucía no aporta la producción en monte privado: MITECO publica 35.000 t como estimación (2020-2022). El total de 2024 es la suma de las comunidades con dato (no hay total nacional publicado) y no incluye a las que no declaran."},
           "source": {"name": "MITECO, Estadística Anual de Otros Aprovechamientos Forestales (2014-2022) y Anuario de Estadística Forestal 2024, tabla E.1", "url": PAGE,
                      "licence": "MITECO aviso legal: reutilización citando la fuente"}, "log": log}
    (D / "es-cork.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("es-cork.json: años %s; %s" % (sorted(years), "; ".join(log) or "sin avisos")); return 0
if __name__ == "__main__": sys.exit(main())

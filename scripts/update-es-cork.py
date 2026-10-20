#!/usr/bin/env python3
"""Corcho en España: produccion por comunidad autonoma, 2005-2022 (MITECO, Estadistica Anual de Otros Aprovechamientos Forestales) + 2024 (Anuario forestal, copiado a mano)
-> data/es-cork.json.
Fuente 1 (automatica): libro «Tablas resumen 2005-2022»; una hoja por año; se lee la columna «Corcho» y las filas «Total <CCAA>» / «Total general» / «TOTAL».
  Las hojas de 2005-2013 tienen otro diseño (una fila por comunidad y fila final «ESPAÑA») y se leen aparte (parse_old).
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
        "murcia": ("MC", "Murcia"), "navarra": ("NA", "Navarra"), "c f de navarra": ("NA", "Navarra"), "pais vasco": ("PV", "País Vasco"),
        "comunidad de madrid": ("MD", "Madrid"), "comunidad foral de navarra": ("NA", "Navarra"), "comunidad valenciana": ("CV", "Comunidad Valenciana"), "islas baleares": ("IB", "Islas Baleares"),
        "p de asturias": ("AS", "Asturias"), "r de murcia": ("MC", "Murcia")}
# Notas del MITECO sobre años concretos (hoja del libro y Anuario forestal 2021, tabla 9.1)
YEAR_NOTES = {2005: "Cifra muy inferior a las de 2006-2021; el MITECO la publica así (Anuario 2021, tabla 9.1: 20.973 t). El libro no la explica.",
              2007: "El total del libro (27.212 t) es muy inferior al de la serie del Anuario 2021 (60.728 t, que incluye la estimación del monte privado de Andalucía). Aquí va el del libro.",
              2008: "El total incluye una estimación de Extremadura que no viene desglosada (nota del MITECO en el Anuario 2021, tabla 9.1: no hay cifras de Extremadura de 2008, 2009 ni 2010).",
              2009: "El total incluye una estimación de Extremadura que no viene desglosada (nota del MITECO en el Anuario 2021, tabla 9.1).",
              2010: "El total incluye una estimación de Extremadura que no viene desglosada (nota de la propia hoja del MITECO)."}
def key(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(s.replace(".", " ").replace(",", " ").split())
def parse_old(ws, y, log):
    """Hojas 2005-2013: una fila por comunidad (MAYUSCULAS), cabecera «corcho» en la columna B y fila final «ESPAÑA» con el total."""
    rows = list(ws.iter_rows(values_only=True)); hi = None
    for i, r in enumerate(rows[:10]):
        for j, c in enumerate(r):
            if isinstance(c, str) and c.strip().lower().startswith("corcho"): hi = (i, j); break
        if hi: break
    if not hi: log.append("%s: sin columna Corcho" % y); return None
    i, j = hi; per = {}; tot = None
    for r in rows[i + 1:]:
        a = r[0] if r else None
        if not isinstance(a, str) or not a.strip(): continue
        v = r[j] if len(r) > j else None
        v = round(float(v), 2) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
        if a.strip().upper().startswith("ESPA"): tot = v; continue
        k = CCAA.get(key(a))
        if k is None:
            if a.strip().isupper() and a.strip().lower() != "unidades" and len(a.strip()) < 40: log.append("%s: comunidad desconocida %r" % (y, a.strip()))
            continue
        if v is not None: per[k[0]] = v
    if tot is None or not per: log.append("%s: sin total" % y); return None
    s = sum(per.values()); out = {"total": tot, "ccaa": per}
    if abs(s - tot) > 1.0: out["unallocated"] = round(tot - s, 2)
    return out
def parse(xlsx_bytes):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True); out = {}; log = []
    for ws in wb.worksheets:
        if not ws.title.isdigit(): continue
        if int(ws.title) < 2014:
            o = parse_old(ws, int(ws.title), log)
            if o:
                if int(ws.title) in YEAR_NOTES: o["note"] = YEAR_NOTES[int(ws.title)]
                out[int(ws.title)] = o
            continue
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
    if len(years) < 12:
        print("::warning::MITECO corcho: solo %d años legibles (%s); se conserva el fichero anterior" % (len(years), "; ".join(log))); return 1
    man = json.loads((D / "es-cork-manual.json").read_text(encoding="utf-8")); my = int(man["year"])
    if my in years: print("::warning::el año manual %d ya esta en el libro; manda el libro" % my)
    else: years[my] = {"total": round(sum(man["ccaa"].values()), 2), "ccaa": man["ccaa"], "totalIsSum": True, "manual": True}
    names = {v[0]: v[1] for v in CCAA.values()}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "t",
           "years": {str(y): years[y] for y in sorted(years)}, "names": {c: names[c] for c in sorted({c for y in years.values() for c in y["ccaa"]})},
           "estimated": {"AN": [y for y in sorted(years) if years[y]["ccaa"].get("AN") == 35000.0]},
           "notes": {"es": "Los años 2008-2010 incluyen en el total una estimación de Extremadura sin desglosar; 2005 y 2007 son muy inferiores al resto (ver la nota de cada año). Andalucía no aporta la producción en monte privado: MITECO publica 35.000 t como estimación (2020-2022). El total de 2024 es la suma de las comunidades con dato (no hay total nacional publicado) y no incluye a las que no declaran."},
           "source": {"name": "MITECO, Estadística Anual de Otros Aprovechamientos Forestales (2014-2022) y Anuario de Estadística Forestal 2024, tabla E.1", "url": PAGE,
                      "licence": "MITECO aviso legal: reutilización citando la fuente"}, "log": log}
    (D / "es-cork.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("es-cork.json: años %s; %s" % (sorted(years), "; ".join(log) or "sin avisos")); return 0
if __name__ == "__main__": sys.exit(main())

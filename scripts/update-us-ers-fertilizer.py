#!/usr/bin/env python3
"""Uso y precio de fertilizantes en EE. UU. (USDA ERS, Fertilizer Use and Price, libro .xls con todas las tablas) -> data/us-ers-fertilizer-stats.json (formato *-stats.json).
Es un archivo historico que ERS ya no actualiza (consumo hasta 1.7.2015, precios hasta 2014, indices hasta 2018): se publica como serie larga de referencia, con nota.
  Table1  consumo de nutrientes N, P2O5, K2O y total (1.000 t de nutriente, ano a 30 de junio) y cuotas
  Table4/5  consumo por material (t cortas de material): amoniaco, urea, nitrato, DAP, MAP, cloruro potasico...
  Table7  precio medio pagado por los agricultores por material (USD/t corta), en las fechas de la encuesta
  Table8  indices de precios (2011=100): pagados y recibidos por agricultores e IPP de fertilizantes
  Table9-13  porcentaje de superficie de maiz fertilizada y dosis por acre fertilizado (N, P2O5, K2O) por estado
Uso: update-us-ers-fertilizer.py [--local DIR] [--out DIR]   (--local: carpeta con all-fertilizer-use-and-price-tables-in-a-single-workbook.xls)"""
import re, sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
PAGE = "https://www.ers.usda.gov/data-products/fertilizer-use-and-price"
KNOWN = "https://www.ers.usda.gov/media/5291/all-fertilizer-use-and-price-tables-in-a-single-workbook.xls"
SG = "USDA ERS, Fertilizer Use and Price"
NOTE = "Archivo histórico de ERS, ya sin actualizar: la serie termina en %s."
def last(pts): return max([p for p, v in pts if v is not None] or ["?"])
def clean(s): return re.sub(r"\s+", " ", re.sub(r"\s*\d/\s*$", "", str(s))).strip()
def yr(c):
    v = U.fnum(str(c).strip()) if not isinstance(c, float) else c
    return int(v) if v is not None and 1900 < v < 2100 and float(v).is_integer() else None
def heads(rows, hrows, ncols):
    """Nombre de cada columna: partes no vacias de las filas de cabecera (la de arriba se arrastra a la derecha), sin repetidos."""
    out = []; fill = {}
    for k, h in enumerate(hrows):
        last = ""
        for j in range(ncols):
            c = clean(rows[h][j]) if j < len(rows[h]) else ""
            if c: last = c
            elif k == len(hrows) - 1: last = ""   # la fila de abajo (la del nombre de columna) no se arrastra
            fill.setdefault(h, {})[j] = c or last
    for j in range(ncols):
        parts = []
        for h in hrows:
            c = fill[h][j]
            if c and c not in parts: parts.append(c)
        out.append(" - ".join(parts))
    return out
def by_year(rows, first, cols, names):
    """Tabla con el ano en la columna 0: {col: [(AAAA, valor)]}."""
    d = {c: [] for c in cols}
    for r in rows[first:]:
        y = yr(r[0]) if r else None
        if y is None: continue
        for c in cols:
            if c < len(r): d[c].append((str(y), U.fnum(r[c])))
    return d
def read_t1(rows):
    ser = []; names = {1: ("Nitrogen (N)", "thousand t nutrient"), 2: ("Phosphate (P2O5)", "thousand t nutrient"), 3: ("Potash (K2O)", "thousand t nutrient"), 4: ("Total primary nutrients", "thousand t nutrient"),
                       6: ("Nitrogen share of total", "%"), 7: ("Phosphate share of total", "%"), 8: ("Potash share of total", "%")}
    d = by_year(rows, 0, list(names), names)
    for c, (n, u) in names.items(): ser.append(U.mk_series("us-ersfert-use-%s-a" % U.slug(n, 20), "inputs", "Fertilizer consumption: %s (ERS, year ending June 30)" % n, u, "annual", d[c], SG, min_points=10, max_age_years=15, note=NOTE % last(d[c])))
    return ser
def read_materials(rows, hrows, sid, label):
    ncols = max(len(r) for r in rows); hs = heads(rows, hrows, ncols); first = max(hrows) + 1
    d = by_year(rows, first, [c for c in range(1, ncols) if hs[c]], hs); ser = []
    for c, pts in d.items():
        if len([1 for p, v in pts if v is not None]) < 10: continue
        ser.append(U.mk_series("us-ersfert-%s-%s-a" % (sid, U.slug(hs[c], 36)), "inputs", "%s: %s (ERS, year ending June 30)" % (label, hs[c]), "short tons of material", "annual", pts, SG, min_points=10, max_age_years=15, note=NOTE % last(pts)))
    return ser
def read_prices(rows):
    hdr = next(i for i, r in enumerate(rows) if r and clean(r[0]).lower() == "year"); ncols = max(len(r) for r in rows); hs = heads(rows, [hdr], ncols)
    d = {c: [] for c in range(2, ncols) if hs[c]}
    for r in rows[hdr + 1:]:
        y = yr(r[0]) if r else None; m = U.mon_num(re.sub(r"[^A-Za-z]", "", str(r[1]))[:3]) if y and len(r) > 1 else None
        if not (y and m): continue
        for c in d: d[c].append(("%d-%02d" % (y, m), U.fnum(r[c]) if c < len(r) else None))
    ser = []
    for c, pts in d.items():
        s = U.mk_series("us-ersfert-price-%s-m" % U.slug(hs[c], 36), "prices", "Price paid by farmers: %s (ERS, survey dates)" % hs[c], "USD/short ton of material", "monthly", pts, SG, min_points=10, max_age_years=20,
                        note="Archivo histórico de ERS: precios en las fechas de la encuesta (abril/septiembre en los primeros años) hasta %s." % last(pts))
        if s: ser.append(s)
    return ser
def read_indices(rows):
    names = {1: "Index of prices paid by farmers for fertilizer", 2: "Index of prices received by farmers for crops", 4: "Producer price index: all fertilizers", 5: "Producer price index: nitrogen", 6: "Producer price index: phosphate", 7: "Producer price index: potash"}
    d = by_year(rows, 0, list(names), names); ser = []
    for c, n in names.items():
        s = U.mk_series("us-ersfert-index-%s-a" % U.slug(n, 40), "prices", "%s (ERS, 2011=100)" % n, "index 2011=100", "annual", d[c], SG, min_points=10, max_age_years=15, note=NOTE % last(d[c]))
        if s: ser.append(s)
    return ser
def read_states(rows, sid, label, unit):
    hdr = next(i for i, r in enumerate(rows) if r and clean(r[0]).lower() == "state"); years = [yr(c) for c in rows[hdr][1:]]; ser = []
    for r in rows[hdr + 1:]:
        n = clean(r[0]) if r else ""
        if not n or n.startswith("NA =") or re.match(r"^\d/", n) or n.lower().startswith("source"): 
            if n.startswith("NA =") or n.lower().startswith("source"): break
            continue
        pts = [(str(y), U.fnum(r[i + 1])) for i, y in enumerate(years) if y and i + 1 < len(r)]
        n = re.sub(r"\s*\d/$", "", n)
        s = U.mk_series("us-ersfert-%s-%s-a" % (sid, U.slug(n, 24)), "inputs", "%s, %s (ERS)" % (label, n), unit, "annual", pts, SG, min_points=5, max_age_years=15, note="Archivo histórico de ERS (encuestas de ARMS/NASS): la serie termina en %s." % last(pts))
        if s: ser.append(s)
    return ser
def build(sheet):
    """sheet(nombre) -> filas (listas de celdas)."""
    ser = []; add = ser.extend
    add(read_t1(sheet("Table1")))
    add(read_materials(sheet("Table4"), [2], "mat-n", "Nitrogen materials consumed"))
    add(read_materials(sheet("Table5"), [3, 4], "mat-pk", "Phosphate and potash materials consumed"))
    add(read_prices(sheet("Table7")))
    add(read_indices(sheet("Table8")))
    for t, sid, lab, un in (("Table9", "corn-n-pct", "Corn acreage receiving nitrogen", "%"), ("Table10", "corn-n-rate", "Nitrogen rate on corn per fertilized acre", "lb/acre"), ("Table11", "corn-p-pct", "Corn acreage receiving phosphate", "%"),
                            ("Table12", "corn-p-rate", "Phosphate rate on corn per fertilized acre", "lb/acre"), ("Table13", "corn-k-pct", "Corn acreage receiving potash", "%")):
        add(read_states(sheet(t), sid, lab, un))
    return [s for s in ser if s]
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "us-ers-fertilizer-stats.json"
    rc = 0
    try:
        import xlrd
        try: url = U.find_link(PAGE, r"all-fertilizer-use-and-price-tables.*\.xls", "https://www.ers.usda.gov/")
        except Exception as e: U.log("pagina no legible:", repr(e)[:100]); url = None
        url = url or KNOWN; U.log("XLS:", url)
        wb = xlrd.open_workbook(file_contents=U.get(url))
        ser = build(lambda n: [wb.sheet_by_name(n).row_values(i) for i in range(wb.sheet_by_name(n).nrows)])
        ids = [s["id"] for s in ser]
        if len(ser) < 60: raise ValueError("solo %d series (se esperan >=60)" % len(ser))
        for need in ("us-ersfert-use-nitrogen-n-a", "us-ersfert-price-anhydrous-ammonia-m", "us-ersfert-corn-n-rate-iowa-a"):
            if need not in ids: raise ValueError("falta la serie " + need)
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos")
        U.write_json(out, U.stats_doc("USDA Economic Research Service, Fertilizer Use and Price", PAGE, "US Government work (public domain); credit: USDA ERS", ser))
        U.log("OK: %d series" % len(ser))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-ers-fertilizer-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

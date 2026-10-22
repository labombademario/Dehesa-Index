#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-fr-agreste-more.py con libros y CSV sinteticos: cabeceras de años, provisionales, filas vacias, TERUTI, vendimia, IPAMPA y seleccion de estadisticas."""
import csv, importlib.util, io, sys, zipfile
from pathlib import Path
sp = importlib.util.spec_from_file_location("fm", str(Path(__file__).resolve().parent / "update-fr-agreste-more.py")); fm = importlib.util.module_from_spec(sp); sp.loader.exec_module(fm)


def check(c, m):
    if not c:
        print("FALLO:", m)
        sys.exit(1)


class FakeXL:
    def __init__(self, sheets): self.s = sheets
    def names(self): return list(self.s)
    def rows(self, n): return iter(self.s[n])


def with_xl(sheets, fn):
    old = fm.XL
    fm.XL = lambda blob: FakeXL(sheets)
    try:
        return fn(b"x")
    finally:
        fm.XL = old


# empleo: cabecera con años y "(p)", etiqueta en la columna 1, celdas vacias y filas sin etiqueta
sheets = {}
for sheet, tid, label, unit, nlab in fm.EMP_SHEETS:
    hdr = [""] + ["Etiqueta"] * nlab + ["2023", "2024", "2025 (p)"]
    rows = [["Titulo"], hdr]
    lab = ["Cereales", "Otro"][:nlab]
    rows.append([""] + lab + ["100", "110", "120.5"])
    rows.append([""] + ["Sin dato", "x"][:nlab] + ["", "", ""])
    rows.append([""] * (nlab + 4))
    sheets[sheet] = rows
tabs = with_xl(sheets, fm.read_empleo)
check(len(tabs) == len(fm.EMP_SHEETS), "una tabla por hoja")
s = tabs[0]["series"]
check(len(s) == 1 and s[0]["points"] == [["2023", 100], ["2024", 110], ["2025", 120.5]], "puntos: %r" % s)
check(s[0]["provisional"] == ["2025"], "provisional 2025")
check(tabs[3]["series"][0]["label"] == "Cereales - Otro", "etiqueta de dos columnas: %r" % tabs[3]["series"][0]["label"])
sheets.pop("ETP - OTEX")
try:
    with_xl(sheets, fm.read_empleo); check(False, "debe fallar si falta una hoja")
except RuntimeError:
    pass

# TERUTI
yrs = ["Surface %d" % y for y in range(1982, 2004)]
dep = [["Département", "Libellé département", "Région", "Libellé région", "Nomenclature (en 3 postes)"] + yrs,
       ["01", "Ain", "84", "ARA", "2- Sols agricoles"] + ["1000.5"] * 22,
       ["", "", "", "", ""] + [""] * 22,
       ["971", "Guadeloupe", "01", "Guadeloupe", "2- Sols agricoles"] + [""] * 10 + ["5"] * 12,
       ["99", "France métropolitaine", "", "", "1- Sols artificialisés"] + ["9"] * 22]
reg = [["Région", "Libellé région", "Nomenclature (en 3 postes)", "Nomenclature (en 13 postes)"] + yrs,
       ["11", "Ile-de-France", "1- Sols artificialisés", "11- Sols bâtis"] + ["3"] * 22]
t = with_xl({"3_postes_par_departement": dep, "13_postes_par_region": reg}, fm.read_teruti)
check(len(t[0]["series"]) == 3 and len(t[1]["series"]) == 1, "series TERUTI: %d %d" % (len(t[0]["series"]), len(t[1]["series"])))
check(t[0]["series"][1]["points"][0][0] == "1992", "Guadalupe empieza donde hay dato: %r" % t[0]["series"][1]["points"][:1])

# vendimia
def zcsv(name_fmt, years, header, rowfn):
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        for y in years:
            o = io.StringIO(); w = csv.writer(o, delimiter=";"); w.writerow(header)
            for r in rowfn(y): w.writerow(r)
            z.writestr(name_fmt % y, o.getvalue())
    return b.getvalue()


vh = ["NOM", "ANNREF", "GEOGRAPHIE", "GEOGRAPHIE_LIB", "N027", "N027_LIB", "N027_MOD", "N802b", "N802b_LIB", "N802b_MOD", "VALEUR", "QUALITE"]
vz = zcsv("FDS_VINCONJ_%d.csv", range(2010, 2022), vh, lambda y: [["VINCONJ", y, "TOUS", "Tous bassins viticoles ou non", "g", "Production (volume)", "020.01", "p", "TOTAL VINS", "1", "%d.5" % (40000 + y), "OUI"],
                                                                 ["VINCONJ", y, "CORSE", "Corse", "g", "Production (volume)", "020.01", "p", "TOTAL VINS", "1", "", "OUI"]])
tv = fm.read_vinconj(vz)
check(len(tv) == 1 and len(tv[0]["series"]) == 1 and len(tv[0]["series"][0]["points"]) == 12, "vendimia: celda vacia no existe")
try:
    fm.read_vinconj(zcsv("FDS_VINCONJ_%d.csv", range(2020, 2022), vh, lambda y: [])); check(False, "pocos CSV")
except RuntimeError:
    pass

# IPAMPA
ih = ["NOM", "ANNREF", "GEOGRAPHIE", "GEOGRAPHIE_LIB", "IPAMPA_DIM1", "IPAMPA_DIM1_LIB", "IPAMPA_DIM1_MOD", "IPAMPA_DIM2", "IPAMPA_DIM2_LIB", "IPAMPA_DIM2_MOD", "IPAMPA_DIM3", "IPAMPA_DIM3_LIB", "IPAMPA_DIM3_MOD", "IPAMPA_DIM4", "IPAMPA_DIM4_LIB", "IPAMPA_DIM4_MOD", "VALEUR", "QUALITE"]


def irows(y):
    out = []
    for reg_, mon in (("France y compris DOM (1)", "Janvier"), ("France y compris DOM (1)", "Février"), ("France y compris DOM (1)", "Moyenne annuelle"), ("Bretagne", "Moyenne annuelle"), ("Bretagne", "Janvier")):
        for code, lab, base in (("001", "Indice général (B.2020)", 100), ("003", "_Semences (B.2020)", 90)):
            out.append(["IPAMPA", y, "FR", "FR", "I", "Indice moyen annuel base 100 en 2020", "001", "P", lab, code, "L", reg_, "1", "Pe", mon, "1", str(base + y - 2000), "OUI"])
    out.append(["IPAMPA", y, "FR", "FR", "I", "Pondérations Ipampa base 100 en 2020", "002", "P", "Indice général (B.2020)", "001", "L", "Bretagne", "1", "Pe", "Janvier", "1", "5", "OUI"])
    return out


nat, regs = fm.read_ipampa(zcsv("FDS_IPAMPA_%d.csv", range(2005, 2017), ih, irows))
check(len(nat[0]["series"]) == 2 and nat[0]["series"][0]["depth"] == 0 and nat[0]["series"][1]["depth"] == 1, "profundidad conservada (0 incluido)")
check(nat[0]["series"][0]["points"][0] == ["2005-01", 105], "mensual nacional: %r" % nat[0]["series"][0]["points"][:2])
check(len(regs) == 2 and all(len(x["series"]) == 2 for x in regs), "dos regiones x dos productos (las ponderaciones no se mezclan)")
check(regs[0]["series"][0]["points"][-1][0] == "2016", "media anual por region")

# estadisticas
docs = {"ipampa-fr.json": fm.doc(nat, "t", "n"), "vinconj.json": fm.doc(tv, "t", "n")}
st = fm.stats(docs, "n")["countries"]["FR"]["series"]
check([s["id"] for s in st if s["group"] == "inputs"] == ["fr-ipampa-fr-001", "fr-ipampa-fr-003"], "estadisticas IPAMPA incluyen el indice general: %r" % [s["id"] for s in st])
print("ok: test-fr-agreste-more")

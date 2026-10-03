#!/usr/bin/env python3
"""Tests de scripts/update-spain-crops.py sin red, con un libro Excel sintetico que imita la hoja BD_ del MAPA (nombres de columna y codigos reales; valores inventados
solo para comprobar la logica): suma de medidas, regadio al aire libre + protegido, valores repetidos, negativos, nombres con guiones, provincias, campana."""
import importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
import openpyxl
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sc", ROOT / "scripts" / "update-spain-crops.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
HDR = ("PRO_ID", "PRO_DESCRIPCION", "CSP_PST_ID", "CSP_PST_TXTCORTO", "CSP_DCW_VERSION", "CSP_DCW_AB1234", "CSP_CLV_TXT_FORMULARIO", "CSP_DCW_TXYZ", "CSP_CVR_DESCRIPCION", "CSP_DCW_VALOR")
def row(pid, pn, grp, crop, name, var, val): return (pid, pn, 1, grp, 1, crop, name, var, "x", val)
rows = [HDR,
    row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "SCUT", 100), row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "SCUS", 90),
    row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "SCUR", 10), row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "SCOT", 98),
    row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "PCOG", 300.5), row(1, "Araba/Álava", "Cereales", "CE1101", "           -Trigo  de invierno", "HURG", 12.4),
    row(2, "Albacete", "Cereales", "CE1101", "           -Trigo  de invierno", "SCUT", 50), row(2, "Albacete", "Cereales", "CE1101", "           -Trigo  de invierno", "PCOG", 120),
    row(2, "Albacete", "Cereales", "CE0000", "TOTAL CEREALES GRANO", "SCUT", 0), row(2, "Albacete", "Cereales", "CE0000", "TOTAL CEREALES GRANO", "PCOG", 0),
    row(2, "Albacete", "Hortalizas", "HO1111", "Col", "SCUT", 30), row(2, "Albacete", "Hortalizas", "HO1111", "Col", "SCRA", 20), row(2, "Albacete", "Hortalizas", "HO1111", "Col", "SCRP", 5),
    row(2, "Albacete", "Hortalizas", "HO1111", "Col", "SCUS", 5), row(2, "Albacete", "Hortalizas", "HO1111", "Col", "PCOH", 900),
    row(3, "Alicante", "Olivar", "OL1100", "Olivar de aceituna de mesa", "SRTT", 40), row(3, "Alicante", "Olivar", "OL1100", "Olivar de aceituna de mesa", "PTRE", -5),
    row(3, "Alicante", "Res Herbáceos", "RH2010", "x", "SCUT", 7), row(3, "Alicante", "Cereales", "CE1101", "Trigo", "SCUT", None)]
tmp = Path(tempfile.mkdtemp())
def xlsx(path, rws):
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = "TABLA GLOBAL"; ws2 = wb.create_sheet("BD_HORTALIZAS-NO")
    for r in rws: ws2.append(list(r))
    wb.save(path)
xlsx(tmp / "a.xlsx", rows)
out = tmp / "out"
r = subprocess.run([sys.executable, str(ROOT / "scripts/update-spain-crops.py"), "--out", str(out), "--local", "2024:" + str(tmp / "a.xlsx")], capture_output=True, text=True)
eq(r.returncode, 0, "sale con 0 (%s)" % r.stderr[-300:])
c = json.loads((out / "crops-cereales.json").read_text(encoding="utf-8"))
eq(c["group"], "cereales", "clave de grupo"); eq(c["measures"], M.MEASURES, "medidas"); eq(list(c["campaigns"]), ["2024"], "campaña dada")
cr = {x["c"]: x for x in c["campaigns"]["2024"]["crops"]}
eq(sorted(cr), ["CE1101"], "CE0000 todo ceros y sin datos no aparece; CE1101 si")
x = cr["CE1101"]; eq(x["n"], "Trigo de invierno", "nombre limpio"); eq(x["l"], 1, "nivel por guion")
eq(x["v"]["01"], [100, 90, 10, 98, 300.5], "medidas de Alava"); eq(x["v"]["02"], [50, None, None, None, 120], "Albacete solo con lo que hay (null, no 0)")
eq("03" in x["v"], False, "provincia con valor nulo no aparece"); eq(x["t"], [150, 90, 10, 98, 420.5], "totales nacionales = suma de provincias")
eq(c["provinces"]["01"], "Araba/Álava", "nombre de provincia")
h = json.loads((out / "crops-hortalizas.json").read_text(encoding="utf-8"))["campaigns"]["2024"]["crops"][0]["v"]["02"]
eq(h, [30, 5, 25, None, 900], "hortalizas: regadio = aire libre + protegido")
o = json.loads((out / "crops-olivar.json").read_text(encoding="utf-8"))["campaigns"]["2024"]["crops"][0]["v"]["03"]
eq(o, [40, None, None, None, None], "negativo ignorado, no se inventa")
idx = json.loads((out / "index.json").read_text(encoding="utf-8")); eq(sorted(idx["groups"]), ["cereales", "hortalizas", "olivar"], "grupos del indice")
eq(idx["files"][0]["bdNegativeIgnored"], 1, "negativos contados")
# valor repetido y distinto -> error y no se publica
xlsx(tmp / "b.xlsx", rows + [row(1, "Araba/Álava", "Cereales", "CE1101", "x", "SCUT", 101)])
r = subprocess.run([sys.executable, str(ROOT / "scripts/update-spain-crops.py"), "--out", str(tmp / "out2"), "--local", "2024:" + str(tmp / "b.xlsx")], capture_output=True, text=True)
eq(r.returncode != 0, True, "valor repetido y distinto falla"); eq((tmp / "out2" / "index.json").exists(), False, "no se publica nada si falla")
# misma fila repetida con el mismo valor -> se tolera
xlsx(tmp / "c.xlsx", rows + [row(1, "Araba/Álava", "Cereales", "CE1101", "x", "SCUT", 100)])
r = subprocess.run([sys.executable, str(ROOT / "scripts/update-spain-crops.py"), "--out", str(tmp / "out3"), "--local", "2024:" + str(tmp / "c.xlsx")], capture_output=True, text=True)
eq(r.returncode, 0, "repetido igual se tolera")
# etiqueta de campana en la pagina
html = '<a href="/dam/mapa/x/reglamento-n--543-2009/re1_olivar_formato_tabla_global-0.xlsx">OLIVAR DATOS PROVISIONALES CAMPAÑA 2025</a><a href="/dam/mapa/x/reglamento-n--543-2009/re1_vinedo_formato_tabla_global.xlsx">VIÑEDO sin año</a>'
it = M.page_files(html); eq([(i[1], i[3]) for i in it], [("re1_olivar_formato_tabla_global-0.xlsx", 2025)], "campaña desde la etiqueta; sin etiqueta se ignora")
p = M.pick_files([("u1", "re1_cereales_formato_tabla_global-0.xlsx", "l", 2024), ("u2", "re1_olivar_formato_tabla_global.xlsx", "l", 2024), ("u3", "re1_olivar_formato_tabla_global-0.xlsx", "l", 2025)])
eq([x[1] for x in p[2024]["shared"]], ["re1_cereales_formato_tabla_global-0.xlsx"], "BD compartida: solo cereales"); eq(p[2024]["own"], [], "2024 no relee los demas libros (misma BD)"); eq([x[1] for x in p[2025]["own"]], ["re1_olivar_formato_tabla_global-0.xlsx"], "2025 BD propia")
if bad:
    print("\n".join("FALLA " + b for b in bad)); sys.exit(1)
print("OK test-spain-crops")

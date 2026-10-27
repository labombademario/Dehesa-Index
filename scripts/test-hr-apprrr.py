#!/usr/bin/env python3
"""Pruebas del lector de la APPRRR (Croacia) con libros XLSX sinteticos: nombres de provincia, '-' como 0, suma de municipios, orden de columnas,
descubrimiento por titulo (año mas reciente) y fallo cerrado cuando falta una provincia o los totales no cuadran. Uso: python3 scripts/test-hr-apprrr.py"""
import importlib.util, io, sys
from pathlib import Path
import openpyxl
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("m", ROOT / "scripts" / "update-hr-apprrr.py"); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
ok = True
def chk(name, cond):
    global ok
    print(("OK   " if cond else "FALLO ") + name)
    if not cond: ok = False
def book(rows):
    wb = openpyxl.Workbook(); ws = wb.active
    for r in rows: ws.append(r)
    b = io.BytesIO(); wb.save(b); return b.getvalue()
C = m.COUNTIES
# farms
fh = [[".", "Tip", None, None], [None, "OBRT", None, "OBRT Ukupno", "ZADRUGA", None, "ZADRUGA Ukupno", "(blank)", None, "(blank) Ukupno", "Ukupno"], ["Županija/Grad/Naselje", "F", "M", None, "F", "M", None, "(blank)", None, None]]
fr = [fh[0], fh[1], fh[2]] + [[c, 1, 2, 3, 0, 1, 1, None, None, None, 4] for c in C] + [["Ukupno", 0, 0, 63, 0, 0, 21, None, None, None, 84]]
f = m.parse_farms(m.load_rows(book(fr)))
chk("farms: 21 provincias y tipos sin (blank)", len(f["rows"]) == 21 and f["types"] == ["OBRT", "ZADRUGA"])
chk("farms: total de la fila Ukupno", f["total"] == 84 and f["rows"]["Istarska"]["total"] == 4)
# size
sh = [["Prikaz podataka"], ["Županija", "Grad", "Naselje", "<3", None, None, "≥3 i <20", None, None, "≥20 i <100", None, None, "≥100 i <1.500", None, None, "≥1.500", None, None, "UKUPNO", None, None], [None] * 3 + ["Broj PG-a", "Broj ARKOD parcela", "Površina (ha)"] * 6]
sr = list(sh)
for c in C:
    nm = c + " županija" if c == "Istarska" else c
    sr.append([nm, "G", "N1", 1, 2, 10.5, "-", "-", "-", 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 10.5])
    sr.append([nm, "G", "N2", 1, 3, 4.5, 1, 1, 5.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 9.5])
sr.append(["UKUPNO", None, None, 42, 105, 315.0, 21, 21, 105.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
s = m.parse_size(m.load_rows(book(sr)))
chk("size: suma de asentamientos", s["rows"]["Istarska"]["lt3"] == {"parcels": 5.0, "ha": 15.0} and s["rows"]["Istarska"]["3_20"]["ha"] == 5.0)
chk("size: nombre con 'županija' normalizado y '-' = 0", s["rows"]["Zadarska"]["20_100"]["ha"] == 0)
chk("size: total del fichero", s["fileTotal"]["parcels"] == 126 and s["fileTotal"]["ha"] == 420.0)
# use: columnas (parcelas, ha) y (ha, parcelas)
uh = [["Prikaz podataka"], ["Županija", "Grad", "Naselje", "ORANICA", None, "LIVADA", None, "UKUPNO", None], [None, None, None, "Broj ARKOD parcela", "Površina ARKOD parcela (ha)", "Površina ARKOD parcela", "Broj ARKOD parcela", "Broj ARKOD parcela", "Površina ARKOD parcela (ha)"]]
ur = list(uh) + [[c, "G", "N", 3, 7.5, 2.5, 1, 4, 10.0] for c in C]
u = m.parse_use(m.load_rows(book(ur)))
chk("use: orden de columnas variable", u["rows"]["Zagrebačka"]["ORANICA"] == {"parcels": 3.0, "ha": 7.5} and u["rows"]["Zagrebačka"]["LIVADA"] == {"parcels": 1.0, "ha": 2.5})
chk("use: total desde la columna UKUPNO", u["fileTotal"]["ha"] == 210.0)
# vineyard
vr = [["Vinogradi na dan 31.12.2024.", None, None, None, None], [None] * 5, ["Županija*", "Površina (ha)", "Broj parcela", "Broj PG-a", "Broj trsova"]]
vr += [[c + (" županija" if c != "Grad Zagreb" else ""), 100.0, 10, 5, 400000] for c in C] + [["Ukupno", 2100.0, 210, 105, 8400000], ["Izvor:ARKOD"], ["Iskrčeni vinogradi na dan 31.12.2024.", None, None, None, None], ["Županija*", "Površina (ha)", "Broj parcela", "Broj PG-a", None]]
vr += [[c, 1.0, 1, 1, None] for c in C[:18]] + [["Ukupno", 18.0, 18, 18, None], ["Vinova loza unutar mješovitih višegodišnjih nasada na dan 31.12.2024.", None, None, None, None], ["Županija*", "Površina (ha)", "Broj parcela", "Broj PG-a", None]]
vr += [[c, 2.0, 1, 1, None] for c in C[:18]] + [["Ukupno", 36.0, 18, 18, None]]
v = m.parse_vineyard(m.load_rows(book(vr)))
chk("vineyard: tres bloques", set(v) == {"active", "cleared", "mixed"} and len(v["active"]["rows"]) == 21 and len(v["cleared"]["rows"]) == 18)
chk("vineyard: cepas solo en el bloque activo", v["active"]["rows"]["Istarska"]["vines"] == 400000 and v["cleared"]["rows"]["Istarska"]["vines"] is None)
# build + check: datos sinteticos son demasiado pequeños -> la comprobacion de rangos debe rechazarlos (fallo cerrado)
meta = dict((k, (2025, "t", "u")) for k in ("farms", "size", "use", "vineyard"))
doc = m.build({"farms": book(fr), "size": book(sr), "use": book(ur), "vineyard": book(vr)}, meta)
errs = m.check(doc)
chk("check: rango imposible rechazado", any("fuera de rango" in e for e in errs))
# provincia que falta
doc2 = m.build({"farms": book(fr[:-3] + [fr[-1]]), "size": book(sr), "use": book(ur), "vineyard": book(vr)}, meta)
chk("check: provincia ausente detectada", any("faltan provincias" in e for e in m.check(doc2)))
# descubrimiento por titulo
chk("kind_of: tipos por titulo", [m.kind_of(t) for t in ("Upisnik_poljoprivrednika - broj PG-a 31.12.2024.", "Podaci iz Vinogradarskog registra za 2024. godinu", "Broj i površina ARKOD-a po naseljima i vrsti uporabe poljoprivrednog zemljišta 31.12.2025.", "Površine ARKOD-a i broja-PG-a s obzirom na veličinu i sjedište PG-a 31.12.2025.", "otra cosa")] == ["farms", "vineyard", "use", "size", None])
chk("county: variantes", m.county("Šibensko-Kninska") == "Šibensko-kninska" and m.county("Istarska županija") == "Istarska" and m.county("Ukupno") is None)
chk("county: codificacion rota de libros antiguos", m.county("Pożeíko-slavonska żupanija_x0000__x0000_") == "Požeško-slavonska" and m.county("Koprivničko-kriżevačka żupanija") == "Koprivničko-križevačka" and m.county("Grad Zagreb_x0000_") == "Grad Zagreb" and m.county("Izvor:ARKOD") is None)
# serie historica: un año anterior valido entra, uno con provincias de menos se descarta con aviso
prev = book(fr[:3] + [[c, 1, 1, 2, 0, 1, 1, None, None, None, 3] for c in C] + [fr[-1]])
bad = book(fr[:-4] + [fr[-1]])
doc3 = m.build({"farms": book(fr), "size": book(sr), "use": book(ur), "vineyard": book(vr)}, meta, {"farms": {2023: (prev, "t", "u"), 2022: (bad, "t", "u")}})
chk("history: año anterior valido incluido y orden ascendente", list(doc3["history"]["farms"]) == ["2023", "2025"] and doc3["history"]["farms"]["2023"]["Istarska"]["total"] == 3)
chk("history: año con provincias de menos descartado", "2022" not in doc3["history"]["farms"])
sys.exit(0 if ok else 1)

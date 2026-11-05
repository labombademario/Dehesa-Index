#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-uk-mmo-fish.py y data/uk-mmo-fish.json (MMO, Reino Unido): el lector entiende la disposicion real de la hoja (cantidad y valor de 5 anos en dos bloques,
totales por grupo, puertos con cuatro bloques en horizontal, serie historica) y rechaza unidades, grupos y totales incoherentes; el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; ROOT = R.parent
sp = importlib.util.spec_from_file_location("mmo", R / "update-uk-mmo-fish.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def rejects(fn, *a):
    try: fn(*a)
    except ValueError: return True
    return False
YS = [2021, 2022, 2023, 2024, 2025]
def srows(q_unit="Quantity ('000 tonnes)", v_unit="Value (£ million)", tweak=None):
    """hoja como la 2.2: nombre en la col. 2 (totales en la 1), cantidad en las cols. 3,5,..,11 y valor en las 13,15,..,21"""
    def row(name, q, v, tot=False):
        r = [""] * 22; r[1 if tot else 2] = name
        for i, x in enumerate(q): r[3 + 2 * i] = str(x)
        for i, x in enumerate(v): r[13 + 2 * i] = str(x)
        return r
    h = [""] * 22; h[3] = q_unit; h[13] = v_unit
    y = [""] * 22
    for i, a in enumerate(YS): y[3 + 2 * i] = str(a); y[13 + 2 * i] = str(a)
    rows = [["TABLE 2.2 x"], [], h, y, [],
            row("Cod", [10] * 5, [40] * 5), row("Plaice", [2] * 5, [4] * 5), row("Total Demersal", [12] * 5, [44] * 5, True), [],
            row("Mackerel", [30] * 5, [60] * 5), row("Total Pelagic", [30] * 5, [60] * 5, True), [],
            row("Crabs", [5] * 5, [15] * 5), row("Total Shellfish", [5] * 5, [15] * 5, True), [],
            row("Total All Species", [47] * 5, [119] * 5, True), ["Source: Fisheries Administrations in the UK"], [], ["(a)", "nota"]]
    if tweak: tweak(rows)
    return rows
ys, rows, tot = M.species_table(srows(), "2.2")
ok("anos 2021-2025", ys == YS)
ok("3 especies con su grupo", [(r[0], r[1]) for r in rows] == [("Cod", "Demersal"), ("Plaice", "Demersal"), ("Mackerel", "Pelagic"), ("Crabs", "Shellfish")])
ok("cantidad y valor por ano", rows[0][2] == [10.0] * 5 and rows[0][3] == [40.0] * 5)
ok("totales por grupo y general", tot["Demersal"][0][0] == 12 and tot["All"][1][4] == 119)
M.check_species("2.2", rows, tot); ok("suma de especies = totales", True)
ok("unidades distintas se rechazan", rejects(M.species_table, srows(q_unit="Quantity (tonnes)"), "x"))
ok("valor en otra unidad se rechaza", rejects(M.species_table, srows(v_unit="Value (£ thousand)"), "x"))
def drop_pelagic(rows): rows[:] = [r for r in rows if "Total Pelagic" not in r]
ok("falta un total de grupo se rechaza", rejects(M.species_table, srows(tweak=drop_pelagic), "x"))
yb, rb, tb = M.species_table(srows(), "2.2"); rb[0][2][2] = 99.0
ok("especie que no suma el total se rechaza", rejects(M.check_species, "x", rb, tb))
yb, rb, tb = M.species_table(srows(), "2.2"); tb["All"][0][1] = 90.0
ok("grupos que no suman el total se rechazan", rejects(M.check_species, "x", rb, tb))
def dash(rows):
    for r in rows:
        if r[:3] == ["", "", "Plaice"]: r[5] = "-"
y2, r2, t2 = M.species_table(srows(tweak=dash), "x")
ok("«-» queda como null sin rellenar", r2[1][2][1] is None)
# serie historica
H = [["TABLE 2.7 x"], [], ["", "", "1938", "1948", "1960", "1970", "1980"], [], ["Demersal"], ["", "Quantity ('000 tonnes)", "1", "2", "3", "4", "5"], ["", "Value (£ million)", "1", "2", "3", "4", "5"], [],
     ["Pelagic"], ["", "Quantity ('000 tonnes)", "1", "2", "3", "4", "5"], ["", "Value (£ million)", "1", "2", "3", "4", "5"], [], ["Shellfish"], ["", "Quantity ('000 tonnes)", "1", "2", "3", "4", "5"],
     ["", "Value (£ million)", "1", "2", "3", "4", "5"], [], ["Total"], ["", "Quantity ('000 tonnes)", "3", "6", "9", "12", "15"], ["", "Value (£ million)", "3", "6", "9", "12", "15"]]
hy, hq, hv = M.history(H); ok("historico: 5 anos y 4 grupos", hy == [1938, 1948, 1960, 1970, 1980] and sorted(hq) == ["Demersal", "Pelagic", "Shellfish", "Total"] and hq["Total"][4] == 15.0)
ok("historico sin un grupo se rechaza", rejects(M.history, [r for r in H if r[:1] != ["Shellfish"]]))
# puertos: cuatro bloques en horizontal
def prow(name, vals, tot=False):
    r = [""] * 50; r[1 if tot else 2] = name
    for b in range(4):
        for k in range(2):
            for i in range(5): r[3 + 12 * b + 6 * k + i] = str(vals[b][k] + i)
    return r
hd = [""] * 50; yr = [""] * 50; bl = [""] * 50; bl[0] = "(a) All species"; bl[15] = "(b) Demersal"; bl[27] = "(c) Pelagic"; bl[39] = "(d) Shellfish"
for b in range(4):
    hd[3 + 12 * b] = "Quantity ('000 tonnes)"; hd[9 + 12 * b] = "Value (£ million)"
    for k in range(2):
        for i, a in enumerate(YS): yr[3 + 12 * b + 6 * k + i] = str(a)
bl[15 - 0] = "(b) Demersal"
P = [["TABLE 2.13 x"], [], hd, yr, bl, [], prow("Peterhead", [(10, 20), (2, 4), (6, 12), (2, 4)]), prow("Lerwick", [(5, 10), (1, 2), (3, 6), (1, 2)]), prow("Total All Ports", [(15, 30), (3, 6), (9, 18), (3, 6)], True),
     ["Source: Fisheries Administrations in the UK"], ["(a) Ports in Isle of Man and therefore not included in Tables 2.13a-d"]]
py, pp, pt, note = M.ports_table(P)
ok("puertos: 2 puertos y los 4 bloques", len(pp) == 2 and sorted(pp[0][1]) == ["All", "Demersal", "Pelagic", "Shellfish"])
ok("puertos: bloque Pelagic leido en su columna (Peterhead 6 t, valor 12)", pp[0][1]["Pelagic"][0][0] == 6.0 and pp[0][1]["Pelagic"][1][0] == 12.0)
ok("puertos: total de la hoja y nota de la Isla de Man", pt["All"][0][0] == 15.0 and "Isle of Man" in note)
ok("puertos: anos", py == YS)
# datos publicados y contrato
D = ROOT / "data" / "uk-mmo-fish.json"; doc = json.load(open(D))
def run(d): e, w, s = [], [], {}; ct.uk_mmo_fish(d, e, w, s); return e
ok("el contrato acepta lo publicado", run(doc) == [])
ok("39 especies y 4 naciones", len(doc["uk"]["species"]) == 39 and sorted(doc["nations"]) == ["England", "Northern Ireland", "Scotland", "Wales"])
ok("Reino Unido: total entre 300 y 600 mil t y entre 500 y 1.500 M£ el ultimo ano", 300 < doc["uk"]["totals"]["All"][0][-1] < 600 and 500 < doc["uk"]["totals"]["All"][1][-1] < 1500)
ok("Escocia es la nacion con mas cantidad", max(doc["nations"], key=lambda n: doc["nations"][n]["totals"]["All"][0][-1]) == "Scotland")
ok("la suma de puertos es el total de la hoja", abs(sum(p[2]["All"][0][-1] or 0 for p in doc["ports"]) - doc["portsTotal"]["All"][0][-1]) < 0.01)
b = copy.deepcopy(doc); b["uk"]["species"][0][2][-1] = -1
ok("cantidad negativa se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["uk"]["species"][2][2][-1] *= 3
ok("especie que no suma el grupo se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["nations"]["Wales"]["totals"]["All"][0][-1] *= 4
ok("naciones que no cuadran con el Reino Unido se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["years"] = [2020, 2021, 2023, 2024, 2025]
ok("anos con hueco se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["ports"] = b["ports"][:10]
ok("pocos puertos se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["ports"][0][2]["All"][1][-1] = 9999
ok("puerto con mas valor que el total se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["history"]["years"][0] = 1950
ok("historico que no empieza en 1938 se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["source"]["id"] = "otra"
ok("fuente distinta se rechaza", run(b) != [])
b = copy.deepcopy(doc); k = next(r for r in b["uk"]["species"] if r[0] == "Cod"); k[3][-1] = k[2][-1] * 0.001
ok("precio absurdo (1 libra/t) se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

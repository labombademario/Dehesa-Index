#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-gal-lonjas.py y data/gal-lonjas.json (primera venta en lonjas de Galicia, Pesca de Galicia): el lector entiende el CSV real (BOM, ';', coma decimal, filas partidas),
suma por lonja, especie y mes, rechaza filas rotas, fechas de otro ano, grupos y provincias desconocidos y cifras negativas; el contrato acepta lo publicado y rechaza datos corrompidos."""
import copy, importlib.util, json, sys
from pathlib import Path
R = Path(__file__).resolve().parent; ROOT = R.parent
sp = importlib.util.spec_from_file_location("gal", R / "update-gal-lonjas.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
sp = importlib.util.spec_from_file_location("ct", R / "contract_tests.py"); ct = importlib.util.module_from_spec(sp); sp.loader.exec_module(ct)
bad = 0
def ok(msg, cond):
    global bad
    print(("OK   " if cond else "FALLA"), msg); bad += 0 if cond else 1
def rejects(raw, y=2025):
    try: M.parse(raw, y)
    except ValueError: return True
    return False
HEAD = "﻿"
ROWS = ["01/01/2025;Peixes;ELX;Anguías;Pontevedra;Zona I - Vigo;A Guarda;18,941;7576,400;400,00",
        "01/02/2025;Cefalópodos;CTC;Choco;A Coruña;Zona VII - Coruña-Ferrol;A Coruña (Lonja Coruña, S.A.);122,700;831,050;6,77",
        "15/02/2025;Cefalópodos;CTC;Choco;A Coruña;Zona VII - Coruña-Ferrol;A Coruña (Lonja Coruña, S.A.);100,000;700,000;7,00",
        "01/03/2025;Bivalvos;VER;Berberecho;Pontevedra;Zona II - Pontevedra;Ribeira.;1.234,500;9.876,25;8,00"]
def csvtext(rows, nl="\r\n"): return (HEAD + nl.join(rows) + nl).encode("utf-8")
# lectura de unas pocas filas (el minimo de 1000 filas se salta con un ano relleno)
many = ROWS + ["02/03/2025;Peixes;ELX;Anguías;Pontevedra;Zona I - Vigo;Vigo;1,000;10,000;10,00"] * 1100
d = M.parse(csvtext(many), 2025)
ok("filas leidas", d["rows"] == len(many))
ok("kg con coma decimal y miles con punto", abs(d["lonjas"]["Ribeira"][0] - 1234.5) < 1e-6 and abs(d["lonjas"]["Ribeira"][1] - 9876.25) < 1e-6)
ok("el punto final del nombre de lonja se quita (Ribeira.)", "Ribeira" in d["lonjas"] and "Ribeira." not in d["lonjas"])
ok("suma por lonja y por especie", abs(d["lonjas"]["A Coruña (Lonja Coruña, S.A.)"][0] - 222.7) < 1e-6 and abs(d["species"]["CTC"][1] - 1531.05) < 1e-6)
ok("suma por mes (febrero)", abs(d["months"][2][0] - 222.7) < 1e-6 and 1 in d["months"] and 3 in d["months"])
ok("desglose lonja x especie", abs(d["cells"][("A Coruña (Lonja Coruña, S.A.)", "CTC")][1] - 1531.05) < 1e-6)
ok("provincia y zona guardadas", d["meta"][("l", "A Guarda")] == ("Pontevedra", "Zona I - Vigo"))
ok("nombre gallego y grupo de la especie", d["meta"][("s", "ELX")] == ("Anguías", "Peixes"))
ok("fila con 9 campos se rechaza", rejects(csvtext(many + ["01/05/2025;Peixes;ELX;Anguías;Pontevedra;Zona I;Vigo;1,0;2,0"])))
ok("fecha invalida se rechaza", rejects(csvtext(many + ["31/02/2025;Peixes;ELX;Anguías;Pontevedra;Zona I;Vigo;1,0;2,0;2,00"])))
ok("fecha de otro ano se rechaza", rejects(csvtext(many + ["01/05/2024;Peixes;ELX;Anguías;Pontevedra;Zona I;Vigo;1,0;2,0;2,00"])))
ok("grupo biologico desconocido se rechaza", rejects(csvtext(many + ["01/05/2025;Dinosaurios;ELX;Anguías;Pontevedra;Zona I;Vigo;1,0;2,0;2,00"])))
ok("provincia desconocida se rechaza", rejects(csvtext(many + ["01/05/2025;Peixes;ELX;Anguías;Madrid;Zona I;Vigo;1,0;2,0;2,00"])))
ok("cantidad negativa se rechaza", rejects(csvtext(many + ["01/05/2025;Peixes;ELX;Anguías;Pontevedra;Zona I;Vigo;-1,0;2,0;2,00"])))
ok("cifra vacia se rechaza", rejects(csvtext(many + ["01/05/2025;Peixes;ELX;Anguías;Pontevedra;Zona I;Vigo;;2,0;2,00"])))
ok("muy pocas filas se rechazan", rejects(csvtext(ROWS)))
try: M.check_year(2025, d); ok("un ano con 3 lonjas no pasa los controles", False)
except ValueError: ok("un ano con 3 lonjas no pasa los controles", True)
# datos publicados y contrato
D = ROOT / "data" / "gal-lonjas.json"; doc = json.load(open(D))
def run(x): e, w, s = [], [], {}; ct.gal_lonjas(x, e, w, s); return e
ok("el contrato acepta lo publicado", run(doc) == [])
ok("anos desde 2003 sin huecos", doc["years"][0] == 2003 and doc["years"] == list(range(2003, doc["years"][-1] + 1)))
i = doc["years"].index(2003)
tk = sum(o["kg"][i] or 0 for o in doc["lonjas"])
ok("2003: 124,7 mil t, igual que la tabla 5861 del IGE (124.666 t)", abs(tk / 1000 - 124666) < 250)
ok("mas de 50 lonjas y 150 especies en la serie", len(doc["lonjas"]) > 50 and len(doc["species"]) > 150)
ok("Vigo o A Coruña es la lonja con mas valor el ultimo ano", doc["lonjas"][0]["n"] in ("Vigo", "A Coruña (Lonja Coruña, S.A.)"))
b = copy.deepcopy(doc); b["lonjas"][0]["kg"][-1] = -5
ok("kg negativos se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["lonjas"][0]["kg"][-1] = (b["lonjas"][0]["kg"][-1] or 0) * 3
ok("lonja que no cuadra con las especies se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["lonjas"][0]["p"] = "Madrid"
ok("provincia desconocida se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["lonjas"][0]["eur"][-1] = None
ok("kg y euros con huecos distintos se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["years"] = b["years"][:3] + [2008] + b["years"][4:]
ok("anos con hueco se rechazan", run(b) != [])
b = copy.deepcopy(doc); b["months"]["kg"][5] = (b["months"]["kg"][5] or 0) + 1e7
ok("meses que no cuadran se rechazan", run(b) != [])
b = copy.deepcopy(doc); k0 = next(iter(b["cells"]["rows"])); b["cells"]["rows"][k0][0][1] += 1e8
ok("desglose que no suma el ultimo ano se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["cells"]["rows"]["Lonja inventada"] = [["XXX", 1.0, 1.0]]
ok("lonja inexistente en el desglose se rechaza", run(b) != [])
b = copy.deepcopy(doc); b["source"]["id"] = "otra"
ok("fuente distinta se rechaza", run(b) != [])
print("fallos:", bad); sys.exit(1 if bad else 0)

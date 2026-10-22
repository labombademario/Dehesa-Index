#!/usr/bin/env python3
"""Pruebas sin red de scripts/update-fr-comex.py: periodos, unidades, nombres de socios, y que un año que la fuente ya no trae se conserva y uno que si trae se reemplaza."""
import importlib.util, io, sys, zipfile
from pathlib import Path
sp = importlib.util.spec_from_file_location("fc", str(Path(__file__).resolve().parent / "update-fr-comex.py")); fc = importlib.util.module_from_spec(sp); sp.loader.exec_module(fc)
fails = 0
def ok(c, m):
    global fails
    print(("ok   " if c else "FALLO ") + m)
    if not c: fails += 1
ok(fc.period("Mai", 2026) == ("M", "2026-05"), "mes en frances")
ok(fc.period("Août", 2025) == ("M", "2025-08"), "mes con acento")
ok(fc.period("Trimestre 3", 2025) == ("Q", "2025-Q3"), "trimestre")
ok(fc.period("Total annuel", 2024) == ("A", "2024"), "total anual")
ok(fc.period("Semaine 3", 2024) is None, "periodo desconocido se ignora")
ok(fc.unit_flow("Exportations en valeur (1000 d'euros)")[:3] == ("export-eur", "thousand EUR", "export"), "valor en miles de euros")
ok(fc.unit_flow("Importations en volume (tonnes)")[1] == "t", "volumen en toneladas")
ok(fc.unit_flow("Exportation d’oeufs (Teoc)")[2] == "export", "huevos Teoc")
ok(fc.unit_flow("Importations en valeur (1000 euros)", "cop")[1] == "thousand t", "cereales: cifras en miles de toneladas")
ok(fc.fix_name("SEnEgal") == "Sénégal" and fc.fix_name("SlovEnie") == "Slovénie" and fc.fix_name("Egypte") == "Egypte", "nombres con la e acentuada perdida")
H = "NOM;ANNREF;GEOGRAPHIE;GEOGRAPHIE_LIB;COMEXCOP_DIM1;COMEXCOP_DIM1_LIB;COMEXCOP_DIM1_MOD;COMEXCOP_DIM2;COMEXCOP_DIM2_LIB;COMEXCOP_DIM2_MOD;COMEXCOP_DIM3;COMEXCOP_DIM3_LIB;COMEXCOP_DIM3_MOD;COMEXCOP_DIM4;COMEXCOP_DIM4_LIB;COMEXCOP_DIM4_MOD;VALEUR;QUALITE\n"
def row(y, ind, prod, per, geo, v):
    return "COMEXCOP;%d;FR;FR - France;Indicateur;%s;001;Produit;%s;001;Periodicite;%s;001;Liste;%s;001;%s;OUI\n" % (y, ind, prod, per, geo, v)
def zipof(years):
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        for y, rows in years.items():
            z.writestr("FDS_COMEXCOP_%d.csv" % y, H + "".join(rows))
    return b.getvalue()
E1, I1 = "Exportations en valeur (1000 euros)", "Importations en valeur (1000 euros)"
z1 = zipof({2024: [row(2024, E1, "Blé tendre", "Total annuel", "MONDE", 100), row(2024, E1, "Blé tendre", "Janvier", "MONDE", 10), row(2024, E1, "Blé tendre", "Décembre", "MONDE", 12),
                   row(2024, E1, "Blé tendre", "Total annuel", "___Espagne", 5), row(2024, E1, "Blé tendre", "Janvier", "___Espagne", 1)],
            2025: [row(2025, E1, "Blé tendre", "Total annuel", "MONDE", 90), row(2025, E1, "Blé tendre", "Mars", "MONDE", 9)]})
d1 = fc.build("cop", z1, None)
ok(d1["years"] == [2024, 2025] and d1["partialYear"] == 2025, "primera edicion: años y año parcial")
ok(len(d1["series"]) == 2, "mensual solo para agregados: %d series" % len(d1["series"]))
sp_ = [p for p in d1["partners"] if p["fr"] == "Espagne (y compris Canaries)" or p["fr"] == "Espagne"]
ok(len(sp_) == 1, "socio de profundidad 3 presente")
k_es = [k for k in d1["series"] if k.endswith("|%d" % d1["partners"].index(sp_[0]))][0]
ok("M" not in d1["series"][k_es], "un pais no guarda mensual")
# segunda edicion: la fuente solo trae 2025 (corregido) y 2026; 2024 debe conservarse
old = dict(d1); old["_ind"] = [i["fr"] for i in d1["indicators"]]; old["_prod"] = [("_" * p["depth"]) + p["fr"] for p in d1["products"]]; old["_part"] = [p["raw"] for p in d1["partners"]]
z2 = zipof({2025: [row(2025, E1, "Blé tendre", "Total annuel", "MONDE", 95), row(2025, I1, "Blé tendre", "Total annuel", "MONDE", 7)], 2026: [row(2026, E1, "Blé tendre", "Février", "MONDE", 3)]})
d2 = fc.build("cop", z2, old)
mundo = [k for k, s in d2["series"].items() if k.startswith("0|0|") and "A" in s]
a = d2["series"]["0|0|%d" % [i for i, p in enumerate(d2["partners"]) if p["fr"] == "MONDE"][0]]
ok(a["A"].get("2024") == 100 and a["A"].get("2025") == 95, "2024 se conserva y 2025 se reemplaza: %s" % a["A"])
ok(d2["years"] == [2024, 2025, 2026], "años acumulados")
ok(d2["indicators"][0]["fr"] == E1 and len(d2["indicators"]) == 2, "los indices antiguos no cambian al añadir un indicador")
print("%d fallos" % fails); sys.exit(1 if fails else 0)

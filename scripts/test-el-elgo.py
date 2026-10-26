#!/usr/bin/env python3
"""Pruebas de scripts/update-el-elgo.py sin red: filas sinteticas con la forma real de data.gov.gr.
Comprueba la agregacion (nacional, ecologico, anual por provincia), la union de nombres duplicados de ELGO y que falla cerrado
ante una fila duplicada, una unidad desconocida, un precio imposible o un mes sin datos."""
import importlib.util, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location("elgo", Path(__file__).with_name("update-el-elgo.py")); E = importlib.util.module_from_spec(spec); spec.loader.exec_module(E)
fails = []
E.MIN_KG = 0
def check(name, cond):
    print(("OK   " if cond else "FALLO"), name)
    if not cond: fails.append(name)
def raises(f):
    try: f()
    except RuntimeError: return True
    return False
def mrow(y, m, pref, typ, kg, eur, org=0, prod=3):
    return {"Έτος": y, "Μήνας ID": m, "Περιφερειακή Ενότητα": pref, "Είδος Γάλακτος": typ, "Πλήθος Παραγωγών Σύνολο": prod, "Ποσότητα Σύνολο (Kg)": kg, "Αξία Σύνολο (€)": eur,
            "Ποσότητα Βιολογικό (Kg)": org, "Αξία Βιολογικό (€)": 0, "Ποσότητα Συμβατικό (Kg)": kg - org}
rows = [mrow(2024 + (m > 12), (m - 1) % 12 + 1, p, t, 1000.0 * (j + 1), 1400.0 * (j + 1), org=100.0 if t == "Πρόβειο" else 0)
        for m in range(1, 15) for j, p in enumerate(["ΛΑΡΙΣΑΣ", "ΑΡΓΟΛΙΔΑΣ", "ΑΡΓΟΛΙΔΟΣ"][:2]) for t in ("Πρόβειο", "Αγελαδινό")]
rows = [dict(r, **{"Αξία Σύνολο (€)": r["Ποσότητα Σύνολο (Kg)"] * (1.4 if r["Είδος Γάλακτος"] == "Πρόβειο" else 0.5)}) for r in rows]
out = {}; E.do_milk(rows, out); m = out["milk"]
check("14 meses contiguos", len(m["months"]) == 14 and m["months"][0] == "2024-01" and m["months"][-1] == "2025-02")
check("oveja: suma nacional del primer mes = 3000 kg", m["types"]["sheep"]["kg"][0] == 3000)
check("precio de oveja 1,4 y de vaca 0,5", m["types"]["sheep"]["price"][0] == 1.4 and m["types"]["cow"]["price"][0] == 0.5)
check("ecologico 200 kg el primer mes", m["types"]["sheep"]["orgKg"][0] == 200)
check("anual por provincia suma el nacional de 2024", sum(v["kg"]["2024"] for v in m["prefectures"]["sheep"].values()) == sum(m["types"]["sheep"]["kg"][:12]))
bad = [dict(r) for r in rows] + [dict(rows[0])]
check("fila duplicada falla cerrado", raises(lambda: E.do_milk(bad, {})))
check("unidad desconocida falla cerrado", raises(lambda: E.do_milk([dict(rows[0], **{"Περιφερειακή Ενότητα": "ΑΤΛΑΝΤΙΔΑΣ"})] + rows[1:], {})))
check("precio imposible falla cerrado", raises(lambda: E.do_milk([dict(r, **{"Αξία Σύνολο (€)": r["Ποσότητα Σύνολο (Kg)"] * 9}) for r in rows], {})))
check("mes ausente falla cerrado", raises(lambda: E.do_milk([r for r in rows if not (r["Έτος"] == 2024 and r["Μήνας ID"] == 5)], {})))
check("ARGOLIDOS y ARGOLIDAS son la misma unidad", E.pref({"Περιφερειακή Ενότητα": "ΑΡΓΟΛΙΔΟΣ"}) == E.pref({"Περιφερειακή Ενότητα": "ΑΡΓΟΛΙΔΑΣ"}))
check("todas las unidades tienen nombre en ingles", all(E.PREF[k] for k in E.PREF) and len(E.PID) == len(E.PREF))
print("\n%d fallos" % len(fails)); sys.exit(1 if fails else 0)

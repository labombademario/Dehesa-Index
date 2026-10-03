#!/usr/bin/env python3
"""Tests de scripts/update-mb-cattle.py sin red, con texto REAL extraido de tres informes semanales de Manitoba (scripts/fixtures/mb): lectura de subastas,
semana sin venta («No sale»/«No Sale»), NA = null, cabezas = total, y rechazo de semanas incoherentes (nada se publica a medias)."""
import importlib.util, json, re, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "mb"
spec = importlib.util.spec_from_file_location("mb", ROOT / "scripts" / "update-mb-cattle.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
T = {n: (FX / ("cattle-sheep-goat-prices-%s.txt" % n)).read_text(encoding="utf-8") for n in ("2026-10-02", "2026-09-25", "2026-09-04")}
r = M.check_report(M.parse_report(T["2026-10-02"]))
eq(r["date"], "2026-10-02", "fecha"); eq(r["weekTotal"], 6785, "total semana"); eq(r["head"]["Ashern"], 1126, "cabezas Ashern"); eq(r["ytd"], {"2026": 175590, "2025": 180312}, "acumulado")
eq(r["summary"]["cowD12"], [189.29, 231.07, 210.18], "resumen D1,2"); eq(r["summary"]["steer901"], [421.0, 475.8, 448.4], "resumen novillos 901+"); eq(r["summary"]["heif401"], [567.5, 647.75, 607.63], "resumen terneras 401-500")
eq(r["marts"]["Ashern"]["date"], "2026-09-30", "venta Ashern"); eq(r["marts"]["Ashern"]["rows"]["cowD12"], [210.0, 283.0, 246.5], "Ashern vacas D1,2")
eq(r["marts"]["Ashern"]["rows"]["steer401"], [505.0, 726.0, 615.5], "Ashern novillos 401-500"); eq(r["marts"]["Gladstone"]["rows"]["bull"], [220.0, 240.0, 230.0], "Gladstone toros")
eq(sorted(r["marts"]), sorted(M.MARTS), "siete subastas")
w = M.check_report(M.parse_report(T["2026-09-04"]))
eq(w["marts"]["Ashern"]["date"], None, "Ashern sin venta"); eq(all(v is None for v in w["marts"]["Ashern"]["rows"].values()), True, "sin venta = sin precios")
eq(w["marts"]["Winnipeg"]["date"], None, "«No Sale» con otra mayuscula"); eq(w["marts"]["Grunthal"]["rows"]["steer901"], None, "NA = null (no se rellena)")
eq(M.parse_report(T["2026-09-25"])["marts"]["Ashern"]["rows"]["steer401"], None, "NA parcial en una clase")
def fails(txt, what):
    try: M.check_report(M.parse_report(txt)); bad.append("no rechazo: " + what)
    except ValueError: pass
t = T["2026-10-02"]
fails(t.replace("Week total sold:                                               6,785", "Week total sold:                                               6,700"), "suma de cabezas distinta del total")
fails(t.replace("210.00            283.00         246.50", "210.00            283.00         300.50"), "media por encima del maximo")
fails(t.replace("210.00            283.00         246.50", "210.00            283.00           9.50"), "precio absurdo")
fails(t.replace("Sale date: 2026-09-30", "Sale date: 2026-08-01", 1), "venta fuera de la semana del informe")
fails(t.replace("October 2, 2026", "Funday"), "sin fecha")
fails(re.sub(r"\n\s*D3 Cows[^\n]*", "", t, count=1), "una clase menos")
# el programa entero con --text: escribe, es idempotente, y descarta la semana mala sin tocar las buenas
tmp = Path(tempfile.mkdtemp()); out = tmp / "o"
files = [str(FX / ("cattle-sheep-goat-prices-%s.txt" % n)) for n in T]
rc = subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-cattle.py"), "--out", str(out), "--text"] + files, capture_output=True, text=True)
eq(rc.returncode, 0, "sale con 0 (%s)" % rc.stderr[-200:])
d = json.loads((out / "cattle.json").read_text(encoding="utf-8")); eq(sorted(d["weeks"]), ["2026-09-04", "2026-09-25", "2026-10-02"], "tres semanas"); eq(d["classes"], M.CLASSES, "clases")
eq(len(d["weeks"]["2026-10-02"]["summary"]), 15, "15 clases en el resumen")
bp = tmp / "mala.txt"; bp.write_text(t.replace("October 2, 2026", "October 9, 2026").replace("6,785", "6,000"), encoding="utf-8")
rc = subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-cattle.py"), "--out", str(out), "--text", str(bp)], capture_output=True, text=True)
d2 = json.loads((out / "cattle.json").read_text(encoding="utf-8")); eq(sorted(d2["weeks"]), sorted(d["weeks"]), "la semana mala no se publica y las buenas se conservan"); eq("2026-10-09" in d2["weeks"], False, "semana mala ausente")
if bad: print("\n".join("FALLA " + b for b in bad)); sys.exit(1)
print("OK test-mb-cattle")

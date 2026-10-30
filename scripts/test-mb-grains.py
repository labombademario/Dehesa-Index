#!/usr/bin/env python3
"""Tests de scripts/update-mb-grains.py sin red, con texto REAL extraido de informes semanales de Manitoba (scripts/fixtures/mb/grains-*.txt): lectura del bloque OPEN MARKET,
bushel x factor = tonelada, «na» en minusculas y acento grave suelto, valor repetido de la harina de colza (mayo de 2024) dejado en disputa sin corregir, y rechazo de informes
incoherentes (nada se publica a medias)."""
import importlib.util, json, re, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "mb"
spec = importlib.util.spec_from_file_location("mbg", ROOT / "scripts" / "update-mb-grains.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
T = {n: (FX / ("grains-%s.txt" % n)).read_text(encoding="utf-8") for n in ("2026-10-23", "2026-10-16", "2024-05-17", "2024-05-24", "2024-05-31", "2024-06-07")}
r = M.parse_report(T["2026-10-23"]); eq(M.check_report(r), [], "informe sano sin disputas")
eq(r["date"], "2026-10-23", "fecha"); eq(r["rows"]["wheat_wrs"], [307.18, 8.36, -16.9], "trigo WRS [t, bu, cambio]"); eq(r["rows"]["canola"], [739.42, 16.77, -22.05], "colza")
eq(r["rows"]["soybeans"], [581.29, 15.82, -4.78], "soja"); eq(r["rows"]["canola_meal"], [397.16, None, -5.51], "harina de colza: solo tonelada"); eq(r["rows"]["oats"][0], 297.62, "avena")
eq(len(r["rows"]), 12, "12 cultivos"); eq(sorted(r["rows"]), sorted(M.KEYS), "claves")
# semana anterior: el cambio semanal publicado cuadra con la semana anterior publicada
p = M.parse_report(T["2026-10-16"]); eq(M.check_report(r, ("2026-10-16", p["rows"])), [], "cambio semanal cuadra con la semana anterior")
# «na» en minusculas, acento grave suelto y valor repetido (mayo de 2024)
a = M.parse_report(T["2024-05-24"]); b = M.parse_report(T["2024-05-31"]); c = M.parse_report(T["2024-05-17"])
eq(b["rows"]["canola_meal"][0], 395.73, "«na» y acento grave no rompen la lectura"); eq(M.check_report(c), [], "17 de mayo sano")
eq(M.check_report(a, ("2024-05-17", c["rows"])), ["canola_meal"], "24 de mayo: harina repetida con cambio distinto de cero = en disputa")
eq(M.check_report(b, ("2024-05-24", a["rows"])), ["canola_meal"], "31 de mayo: otra copia = en disputa")
def fails(txt, what, prev=None):
    try: M.check_report(M.parse_report(txt), prev); bad.append("no rechazo: " + what)
    except ValueError: pass
t = T["2026-10-23"]
fails(t.replace("307.18", "3.18"), "tonelada absurda"); fails(t.replace("8.36", "9.99"), "bushel que no cuadra con la tonelada")
fails(t.replace("October 23, 2026", "Funday"), "sin fecha"); fails(t.replace("October 23, 2026", "October 24, 2026"), "informe en sabado")
fails(re.sub(r"\n\s*Oats[^\n]*", "", t, count=1), "un cultivo menos"); fails(t.replace("OPEN MARKET", "CERRADO"), "sin bloque OPEN MARKET")
# el programa entero con --text: escribe, es idempotente y descarta el informe malo sin tocar los buenos
tmp = Path(tempfile.mkdtemp()); out = tmp / "o"
files = [str(FX / ("grains-%s.txt" % n)) for n in ("2024-05-17", "2024-05-24", "2024-05-31", "2024-06-07", "2026-10-16", "2026-10-23")]
rc = subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-grains.py"), "--out", str(out), "--text"] + files, capture_output=True, text=True)
eq(rc.returncode, 0, "sale con 0 (%s)" % rc.stderr[-200:])
d = json.loads((out / "grains.json").read_text(encoding="utf-8"))
eq(sorted(d["weeks"]), ["2024-05-17", "2024-05-24", "2024-05-31", "2024-06-07", "2026-10-16", "2026-10-23"], "seis semanas"); eq(d["crops"], M.KEYS, "cultivos")
eq(d["disputed"], ["2024-05-24|canola_meal", "2024-05-31|canola_meal"], "dos celdas en disputa"); eq(d["weeks"]["2024-05-24"][11], [None, None], "celda en disputa vacia, no corregida")
eq(d["weeks"]["2024-06-07"][11][0], 394.85, "7 de junio vuelve a publicarse"); eq(d["weeks"]["2026-10-23"][0], [307.18, 8.36], "ultima semana [t, bu]"); eq(d["monthly"], {}, "sin --monthly no se inventa historia mensual")
before = (out / "grains.json").read_text(encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-grains.py"), "--out", str(out), "--text"] + files, capture_output=True, text=True)
eq((out / "grains.json").read_text(encoding="utf-8").split('"weeks"')[1], before.split('"weeks"')[1], "segunda pasada idempotente")
bp = tmp / "mala.txt"; bp.write_text(t.replace("October 23, 2026", "October 30, 2026").replace("307.18", "3.18"), encoding="utf-8")
subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-grains.py"), "--out", str(out), "--text", str(bp)], capture_output=True, text=True)
d2 = json.loads((out / "grains.json").read_text(encoding="utf-8")); eq(sorted(d2["weeks"]), sorted(d["weeks"]), "el informe malo no se publica y los buenos se conservan")
# Excel mensual: cabecera distinta = error; filas de otros cultivos ignoradas; mes repetido = error
try:
    import openpyxl, io
    def xl(rows):
        wb = openpyxl.Workbook(); ws = wb.active
        for r_ in rows: ws.append(r_)
        bio = io.BytesIO(); wb.save(bio); return bio.getvalue()
    H = ["Year", "Month", "UOM", "Crop", "Value", "Indicator"]; I = "Farmer's net cash return at Wpg elevator"
    m, ign = M.read_monthly(xl([H, [2025, 12, "CAD/tonne", "Canola, #1CR", 572.314, I], [2025, 11, "CAD/tonne", "Canola, #1CR", 560.0, I], [2025, 12, "CAD/tonne", "Rye, #2", 200.0, I], [2025, 12, "CAD/bushel", "Barley, #1CW", 4.0, I]]))
    eq(m["canola"], {"2025-12": 572.31, "2025-11": 560.0}, "mensual: C$/t con dos decimales"); eq(m["barley"], {}, "mensual: otra unidad ignorada"); eq(ign, ["Rye, #2"], "mensual: cultivo ajeno ignorado")
    try: M.read_monthly(xl([["A", "B"], [1, 2]])); bad.append("no rechazo: cabecera del Excel distinta")
    except ValueError: pass
    try: M.read_monthly(xl([H, [2025, 12, "CAD/tonne", "Canola, #1CR", 1, I], [2025, 12, "CAD/tonne", "Canola, #1CR", 2, I]])); bad.append("no rechazo: mes repetido")
    except ValueError: pass
except ImportError: print("AVISO: sin openpyxl, se omite la prueba del Excel mensual")
if bad: print("\n".join("FALLA " + b for b in bad)); sys.exit(1)
print("OK test-mb-grains")

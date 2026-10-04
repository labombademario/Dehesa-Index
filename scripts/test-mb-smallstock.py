#!/usr/bin/env python3
"""Tests de scripts/update-mb-smallstock.py sin red, con texto REAL de informes semanales de Manitoba (scripts/fixtures/mb2): ovino y caprino (cabras por cabeza o en C$/cwt, fecha imposible,
celdas en disputa entre informes, NA = null) y porcino (cambio de ano con NA, semanas y rangos), y la ejecucion completa con --text (escribe, es idempotente, descarta lo malo sin tocar lo bueno)."""
import importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; FX = ROOT / "scripts" / "fixtures" / "mb2"
spec = importlib.util.spec_from_file_location("mbs", ROOT / "scripts" / "update-mb-smallstock.py"); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
rd = lambda n: (FX / n).read_text(encoding="utf-8")
SG = lambda d: "cattle-sheep-goat-prices-%s.txt" % d; HG = lambda d: "hog-prices-%s.txt" % d
# --- ovino y caprino
d, b = M.parse_sheep_goat(rd(SG("2026-10-02"))); ok = M.check_sheep_goat(d, b)
eq(d.isoformat(), "2026-10-02", "fecha del informe"); eq(sorted(ok), ["Grunthal", "Winnipeg"], "dos subastas")
eq(ok["Winnipeg"]["date"], "2026-09-16", "ultima venta Winnipeg"); eq(ok["Winnipeg"]["rows"]["sheep"], [180.0, 265.0, 222.5], "Winnipeg oveja"); eq(ok["Winnipeg"]["rows"]["lambU60"], [400.0, 435.0, 417.5], "Winnipeg cordero <60")
eq(ok["Winnipeg"]["rows"]["kid"], [390.0, 560.0, 475.0], "Winnipeg cabrito (C$/cwt)"); eq(ok["Grunthal"]["rows"]["lamb100"], None, "NA = null, no se rellena"); eq(ok["Grunthal"]["rows"]["nanny"], [230.0, 312.0, 271.0], "Grunthal cabra")
# cabras por cabeza (informe de marzo de 2025): el ovino entra, las cabras NO (otra unidad)
d, b = M.parse_sheep_goat(rd(SG("2025-03-28"))); ok = M.check_sheep_goat(d, b)
eq(ok["Winnipeg"]["rows"]["sheep"], [165.0, 185.0, 175.0], "marzo 2025 oveja"); eq([ok["Winnipeg"]["rows"][k] for k in ("billy", "nanny", "kid")], [None, None, None], "cabras por cabeza no se ingieren")
# C$/swt en Winnipeg y C$/cwt en Grunthal en el mismo informe
d, b = M.parse_sheep_goat(rd(SG("2025-04-18"))); ok = M.check_sheep_goat(d, b)
eq(ok["Winnipeg"]["rows"]["kid"], None, "Winnipeg rotulado swt: sin cabras"); eq(ok["Grunthal"]["rows"]["kid"], [265.15, 500.0, 382.58], "Grunthal rotulado cwt: con cabras")
# fecha imposible (2149): la subasta se omite, el informe no se publica a medias
d, b = M.parse_sheep_goat(rd(SG("2025-01-10"))); ok = M.check_sheep_goat(d, b)
eq("Winnipeg" in ok, False, "fecha 2149 omitida")
# el programa entero
tmp = Path(tempfile.mkdtemp()); out = tmp / "o"
run = lambda files, o=out: subprocess.run([sys.executable, str(ROOT / "scripts/update-mb-smallstock.py"), "--out", str(o), "--text"] + [str(f) for f in files], capture_output=True, text=True)
rc = run([FX / SG("2026-05-01"), FX / SG("2026-10-02"), FX / HG("2026-09-29"), FX / HG("2026-01-06"), FX / HG("2025-01-07")]); eq(rc.returncode, 0, "sale con 0 (%s)" % rc.stderr[-200:])
sg = json.loads((out / "sheep-goat.json").read_text(encoding="utf-8")); hg = json.loads((out / "hogs.json").read_text(encoding="utf-8"))
eq(sorted(sg["sales"]["Winnipeg"]), ["2026-03-18", "2026-09-16"], "ventas de Winnipeg"); eq(sorted(sg["sales"]["Grunthal"]), ["2026-04-22", "2026-09-23"], "ventas de Grunthal"); eq(sg["classes"], M.SG_CLASSES, "clases")
# hog: cambio de ano con NA
w = hg["weeks"]; eq(w["2026-09-25"], [234.69, 222.62, 124922, 104.51], "semana 39 de 2026"); eq(w["2026-09-04"][0], 261.08, "semana 36")
eq(w["2026-01-02"], [227.13, 215.77, None, None] if w["2026-01-02"][2] is None else w["2026-01-02"], "semana 1 de 2026"); eq("2025-12-12" in w and w["2025-12-12"][0] is not None, False, "NA = sin valor")
eq(w["2025-01-03"][0], 223.56, "semana 1 de 2025 (informe de enero de 2025)")
# idempotencia
before = (out / "sheep-goat.json").read_text(encoding="utf-8"), (out / "hogs.json").read_text(encoding="utf-8")
rc = run([FX / SG("2026-10-02"), FX / HG("2026-09-29")]); after = (out / "sheep-goat.json").read_text(encoding="utf-8"), (out / "hogs.json").read_text(encoding="utf-8")
eq([x.split('"generatedAt"')[0] for x in before] == [x.split('"generatedAt"')[0] for x in after], True, "repetir un informe no cambia nada")
# celda en disputa: mismo dato dos veces con un valor distinto -> queda vacia y se anota; un tercer informe no la repone
m2 = tmp / "SG-2026-05-08.txt"; (tmp / "cattle-sheep-goat-prices-2026-05-08.txt").write_text(rd(SG("2026-05-08")), encoding="utf-8")
o2 = tmp / "o2"; rc = run([FX / SG("2026-05-01"), FX / SG("2026-05-08")], o2); d2 = json.loads((o2 / "sheep-goat.json").read_text(encoding="utf-8"))
eq(d2["sales"]["Grunthal"]["2026-04-22"][1], None, "celda en disputa (440 frente a 880) queda vacia"); eq("Grunthal|2026-04-22|1" in d2["disputed"], True, "disputa anotada")
rc = run([FX / SG("2026-05-01")], o2); d3 = json.loads((o2 / "sheep-goat.json").read_text(encoding="utf-8")); eq(d3["sales"]["Grunthal"]["2026-04-22"][1], None, "un informe posterior no repone una celda en disputa")
# informe malo: no se publica y lo bueno se conserva
t = rd(HG("2026-09-29")); (tmp / "hog-prices-2026-10-06.txt").write_text(t.replace("September 29, 2026", "October 6, 2026").replace("234.69", "34.69"), encoding="utf-8")
rc = run([tmp / "hog-prices-2026-10-06.txt"]); h2 = json.loads((out / "hogs.json").read_text(encoding="utf-8")); eq(h2["weeks"]["2026-09-25"][0], 234.69, "el informe malo no cambia lo publicado")
if bad: print("\n".join("FALLA " + b for b in bad)); sys.exit(1)
print("OK test-mb-smallstock")

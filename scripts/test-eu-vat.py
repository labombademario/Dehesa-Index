#!/usr/bin/env python3
"""Tests del lector de TEDB con la respuesta SOAP real de la Comision (scripts/fixtures/tedb/vat-2026-10-01.xml.gz, descargada el 2026-10-01). Sin red."""
import gzip, importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("v", ROOT / "scripts" / "update-eu-vat.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
countries, on = C.build(C.parse(gzip.open(ROOT / "scripts" / "fixtures" / "tedb" / "vat-2026-10-01.xml.gz").read()))
eq(len(countries), 27, "27 paises"); eq("GR" in countries and "EL" not in countries, True, "Grecia como GR")
std = {k: v["standard"] for k, v in countries.items()}
eq((std["ES"], std["FR"], std["DE"], std["IT"], std["HU"], std["LU"], std["FI"]), (21.0, 20.0, 19.0, 22.0, 27.0, 17.0, 25.5), "tipos generales conocidos")
eq(countries["DE"]["crops"]["trigo"], 7.0, "DE trigo 7 %"); eq(countries["FR"]["crops"]["trigo"], 5.5, "FR trigo 5,5 %")
# TEDB no asocia el 4 % espanol a codigos NC: no se inventa un tipo para el trigo espanol
eq(countries["ES"]["crops"]["trigo"], None, "ES trigo sin dato en TEDB"); eq(countries["ES"]["inputs"]["fertilizante"], 10.0, "ES fertilizantes 10 %")
eq(any(r["rate"] == 4.0 for r in countries["ES"]["reduced"]), True, "ES lista el 4 % entre los tipos")
eq(all(v["standard"] > max([r["rate"] for r in v["reduced"] if r["rate"] != "exempt"] or [0]) for v in countries.values()), True, "ningun reducido supera el general")
eq(countries["DK"]["reduced"], [], "Dinamarca sin tipos reducidos"); eq(countries["MT"]["crops"]["trigo"], "exempt", "Malta: exento")
# faltan paises: debe fallar y no publicar
res = [r for r in C.parse(gzip.open(ROOT / "scripts" / "fixtures" / "tedb" / "vat-2026-10-01.xml.gz").read()) if r["ms"] != "FR"]
try: C.build(res); bad.append("debia fallar sin Francia")
except ValueError: pass
print("OK test-eu-vat" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)

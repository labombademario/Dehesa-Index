#!/usr/bin/env python3
"""Tests del lector del calendario USDA con muestras reales (scripts/fixtures/usda). Sin red."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; F = ROOT / "scripts" / "fixtures" / "usda"
spec = importlib.util.spec_from_file_location("cal", ROOT / "scripts" / "update-usda-calendar.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
rows, off = C.parse_nass((F / "nass-calendar-2026-10.txt").read_text(), 2026, 10)
eq(off, 0, "filas fuera de mes"); eq(len(rows), 19, "filas octubre")
cof = [r for r in rows if r["id"] == "cattle-on-feed"]; eq(cof, [{"date": "2026-10-23", "time": "15:00", "agency": "NASS", "id": "cattle-on-feed", "name": "Cattle on Feed"}], "cattle on feed")
cp = [r for r in rows if r["id"] == "crop-progress"]; eq([(r["date"], r["time"]) for r in cp], [("2026-10-05", "16:00")], "crop progress 4 pm")
eq([r["time"] for r in rows if r["id"] == "crop-production"], ["12:00"], "12 pm = 12:00")
sw = [r for r in rows if r["id"] == "slaughter-weekly"]; eq(len(sw), 2, "slaughter weekly"); eq(all(r.get("qs") for r in sw), True, "quick stats")
eq([r["date"] for r in rows if r["id"] == "dairy-products"], ["2026-10-05"], "fecha sin repetir en filas de continuacion")
r12, _ = C.parse_nass((F / "nass-calendar-2026-12.txt").read_text(), 2026, 12)
eq([r["id"] for r in r12 if "county" in r["id"]], ["county-estimates-barley-oats-winter-wheat-durum-wheat-spring-wheat"], "nombre con comas")
eq([r["date"] for r in r12 if r["id"] == "hogs-and-pigs"], ["2026-12-23"], "hogs and pigs")
h, off = C.parse_nass((F / "nass-calendar-html-sample.html").read_text(), 2026, 10)
eq([(r["id"], r["date"], r["time"]) for r in h], [("cattle-on-feed", "2026-10-23", "15:00"), ("slaughter-weekly", "2026-10-23", "15:00"), ("crop-progress", "2026-10-26", "16:00")], "HTML")
_, off = C.parse_nass((F / "nass-calendar-2026-10.txt").read_text(), 2026, 11); eq(off, 19, "mes equivocado se descarta")
y, t, d = C.parse_wasde((F / "wasde-page.txt").read_text())
eq((y, t, len(d), d[9]), (2026, "12:00", 12, "2026-10-09"), "WASDE")
# Pagina desde oct-2026: dos anos seguidos (texto real de usda.gov/wasde, 9-oct-2026). Antes se leian 24 fechas como un solo ano y fallaba.
two = ("2026 WASDE Release Dates (12:00pm ET) In 2026 the WASDE report will be released on Jan. 12, Feb. 10, Mar. 10, Apr. 9, May 12, Jun. 11, Jul. 10, Aug. 12, Sep. 11, Oct. 9, Nov. 10, and Dec. 10. "
       "2027 WASDE Release Dates (12:00pm ET) In 2027 the WASDE report will be released on Jan. 12, Feb. 10, Mar. 10, Apr. 9, May 12, Jun. 11, Jul. 9, Aug. 12, Sep. 10, Oct. 8, Nov. 10, and Dec. 10.")
w2 = C.parse_wasde_all(two)
eq([(a, b, len(c), c[9]) for a, b, c in w2], [(2026, "12:00", 12, "2026-10-09"), (2027, "12:00", 12, "2027-10-08")], "WASDE dos anos")
m2 = C.merge([], {}, w2); eq(len([r for r in m2 if r["id"] == "wasde"]), 24, "merge de dos anos")
try: C.parse_wasde_all(two.replace("Oct. 8, ", "")); bad.append("WASDE 2027 incompleto debia fallar")
except ValueError: pass
try: C.parse_wasde("In 2026 the WASDE report will be released on Jan. 12, Feb. 10."); bad.append("WASDE incompleto debia fallar")
except ValueError: pass
prev = [{"date": "2026-10-20", "agency": "NASS", "id": "old", "name": "Old"}, {"date": "2026-09-01", "agency": "NASS", "id": "sep", "name": "Sep"}]
m = C.merge(prev, {(2026, 10): rows}, (y, t, d))
eq(any(r["id"] == "old" for r in m), False, "mes leido se sustituye"); eq(any(r["id"] == "sep" for r in m), True, "mes no leido se conserva")
eq(sorted(m, key=lambda r: (r["date"], r.get("time", ""), r["id"])), m, "orden")
for b in bad: print("FALLA", b)
print("OK test-usda-calendar" if not bad else "%d fallos" % len(bad)); sys.exit(1 if bad else 0)

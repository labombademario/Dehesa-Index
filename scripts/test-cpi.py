#!/usr/bin/env python3
"""Pruebas de scripts/update-cpi.py sin red: los lectores de Eurostat (JSON-stat), ONS (CSV), BLS y StatCan (JSON), las comprobaciones
de integridad y el empaquetado. Los ficheros de ejemplo se construyen aquí con el formato que publican las fuentes."""
import importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cpi", ROOT / "scripts" / "update-cpi.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
errs = []
def eq(a, b, what):
    if a != b: errs.append("%s: %r != %r" % (what, a, b))

# Eurostat JSON-stat: 2 países x 3 meses, un hueco (None) en ES 2024-02
js = {"id": ["freq", "unit", "coicop", "geo", "time"], "size": [1, 1, 1, 2, 3],
      "dimension": {"freq": {"category": {"index": {"M": 0}}}, "unit": {"category": {"index": {"I15": 0}}}, "coicop": {"category": {"index": {"CP00": 0}}},
                    "geo": {"category": {"index": {"ES": 0, "FR": 1}}}, "time": {"category": {"index": {"2024-01": 0, "2024-02": 1, "2024-03": 2}}}},
      "value": {"0": 120.1, "2": 121.0, "3": 118.0, "4": 118.5, "5": 119.0}}
o = m.parse_eurostat(json.dumps(js))
eq(o["ES"], {"2024-01": 120.1, "2024-03": 121.0}, "eurostat ES con hueco")
eq(o["FR"]["2024-02"], 118.5, "eurostat FR")
js["dimension"]["unit"]["category"]["index"] = {"I15": 0, "I05": 1}; js["size"][1] = 2
try: m.parse_eurostat(json.dumps(js)); errs.append("eurostat: dos unidades deberían fallar")
except ValueError: pass

# ONS CSV: metadatos, anual, trimestral y mensual
csv = '"Title","CPI INDEX 00: ALL ITEMS 2015=100"\n"CDID","D7BT"\n"Source dataset ID","MM23"\n"PreUnit",""\n"Unit",""\n"Release date","16-09-2026"\n"Next release","14 October 2026"\n"Important notes",""\n"2024","133.9"\n"2024 Q1","132.1"\n"2024 JAN","131.5"\n"2024 FEB","132.3"\n"2024 MAR","132.5"\n'
eq(m.parse_ons(csv), {"2024-01": 131.5, "2024-02": 132.3, "2024-03": 132.5}, "ons")

# BLS: dos bloques; M13 (media anual) se ignora
b1 = {"status": "REQUEST_SUCCEEDED", "Results": {"series": [{"seriesID": "CUUR0000SA0", "data": [{"year": "2024", "period": "M02", "value": "310.326"}, {"year": "2024", "period": "M13", "value": "313.689"}, {"year": "2024", "period": "M01", "value": "308.417"}]}]}}
eq(m.parse_bls([json.dumps(b1)]), {"2024-02": 310.326, "2024-01": 308.417}, "bls")
try: m.parse_bls([json.dumps({"status": "REQUEST_NOT_PROCESSED", "message": ["limit"]})]); errs.append("bls: rechazo debería fallar")
except ValueError: pass

# StatCan
sc = [{"status": "SUCCESS", "object": {"vectorId": 41690973, "vectorDataPoint": [{"refPer": "2024-01-01", "value": 158.3}, {"refPer": "2024-02-01", "value": 159.0}, {"refPer": "2024-03-01", "value": None}]}}]
eq(m.parse_statcan(json.dumps(sc)), {"2024-01": 158.3, "2024-02": 159.0}, "statcan")

# comprobaciones
ok = {"%04d-%02d" % (2020 + i // 12, i % 12 + 1): 100 + i * 0.2 for i in range(30)}
eq(m.check("X", ok), None, "serie válida")
bad = dict(ok); bad["2021-05"] = ok["2021-05"] * 1.5
assert m.check("X", bad) and "salto" in m.check("X", bad), "salto mensual no detectado"
bad = dict(ok); bad["2021-05"] = -1
assert "no positivo" in m.check("X", bad), "valor negativo no detectado"
assert "menos de 24" in m.check("X", {"2024-01": 1.0}), "serie corta no detectada"
# empaquetado ida y vuelta, con un mes sin dato (se queda en null, no se rellena)
g = dict(ok); del g["2020-07"]
eq(m.unpack(m.pack(g)), g, "pack/unpack con hueco")
eq(m.pack(g)["v"][6], None, "hueco = null")
if errs:
    print("\n".join("FALLA: " + e for e in errs)); sys.exit(1)
print("test-cpi: OK")

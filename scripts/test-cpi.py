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

# INDEC (datos.gob.ar): filas [fecha, valor], con un null que se ignora
ind = {"data": [["2024-08-01", 6000.5], ["2024-09-01", 6150.25], ["2024-10-01", None]], "meta": []}
eq(m.parse_indec(json.dumps(ind)), {"2024-08": 6000.5, "2024-09": 6150.25}, "indec")
try: m.parse_indec(json.dumps({"errors": ["x"]})); errs.append("indec: respuesta sin data deberia fallar")
except ValueError: pass

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

# Eurostat reexpresa el HICP en base 2025=100 (I25): enlace con la serie 2015=100 por los meses comunes
old = {"2025-%02d" % i: 100 + i for i in range(1, 13)}                    # I15 termina en 2025-12
new = {"2025-%02d" % i: (100 + i) / 1.25 for i in range(1, 13)}            # misma serie en base 2025 (factor 1,25)
new.update({"2026-01": 113 / 1.25 * 1.01, "2026-02": 113 / 1.25 * 1.02})  # meses nuevos, solo en I25
ext, f = m.rebase(old, new)
eq(round(f, 4), 1.25, "factor de enlace")
eq(sorted(ext), ["2026-01", "2026-02"], "meses añadidos")
eq(round(ext["2026-01"], 2), round(113 * 1.01, 2), "valor enlazado en base antigua")
eq(m.rebase(old, {"2025-12": 90.0}), ({}, None), "sin solape suficiente no se enlaza")


# src_eurostat con fixtures: la serie 2015=100 acaba en 2025-12 y la 2025=100 (prc_hicp_minr) trae 2026; el resultado llega a 2026 sin salto
import tempfile, os
def _js(unit, geo, series):
    times = sorted(series)
    return {"id": ["freq", "unit", "coicop18", "geo", "time"], "size": [1, 1, 1, 1, len(times)],
            "dimension": {"freq": {"category": {"index": {"M": 0}}}, "unit": {"category": {"index": {unit: 0}}}, "coicop18": {"category": {"index": {"TOTAL": 0}}},
                          "geo": {"category": {"index": {geo: 0}}}, "time": {"category": {"index": {t: i for i, t in enumerate(times)}}}},
            "value": {str(i): series[t] for i, t in enumerate(times)}}
i15 = {"%04d-%02d" % (2024 + (i // 12), i % 12 + 1): 120 + i * 0.1 for i in range(24)}            # 2024-01..2025-12
i25 = {k: v / 1.2 for k, v in i15.items() if k >= "2025-01"}
i25.update({"2026-01": i15["2025-12"] / 1.2 + 0.1, "2026-02": i15["2025-12"] / 1.2 + 0.2})
with tempfile.TemporaryDirectory() as td:
    td = Path(td); (td / "eurostat.json").write_text(json.dumps(_js("I15", "ES", i15))); (td / "eurostat-i25.json").write_text(json.dumps(_js("I25", "ES", i25)))
    m.FIX = td
    r = m.src_eurostat()["ES"]
    m.FIX = None
eq(max(r), "2026-02", "src_eurostat: llega a 2026-02")
eq(round(r["2026-01"], 2), round(i15["2025-12"] + 0.12, 2), "src_eurostat: enlace sin salto")
eq(m.check("ES", r), None, "src_eurostat: la serie enlazada es valida")

# inflación interanual de la franja macro (scripts/macro_infl.py): solo de cpi.json
sys.path.insert(0, str(ROOT / "scripts"))
import macro_infl
mm = {"s": "2025-01", "src": "eurostat", "v": [100.0 + i * 0.25 for i in range(20)]}          # 2025-01..2026-08
r = macro_infl.one({"m": mm})
eq((r["m"], r["y"], r["src"], r["kind"]), ("2026-08", 2026, "eurostat", "hicp"), "infl: último mes")
eq(r["v"], round((mm["v"][19] / mm["v"][7] - 1) * 100, 2), "infl: interanual")
mm2 = dict(mm, v=mm["v"][:19] + [None]); eq(macro_infl.one({"m": mm2})["m"], "2026-07", "infl: último mes con dato")
mm3 = dict(mm, v=mm["v"][:15] + [None] * 5); eq(macro_infl.one({"m": mm3}), None, "infl: sin los 3 últimos meses no se publica")
eq(macro_infl.one({"m": {"s": "2025-01", "src": "bls", "v": [100.0] * 10}}), None, "infl: menos de 13 meses")
a = {"src": "world_bank_wdi", "y0": 2020, "v": [100.0, 102.0, 105.0, 110.0, 112.0, 115.0]}
eq(macro_infl.one({"a": a}), {"v": 2.68, "y": 2025, "m": None, "src": "world_bank_wdi", "kind": "cpi"}, "infl: anual (Australia)")
eq(macro_infl.one({"m": dict(mm, v=[0.0] * 20)}), None, "infl: índice cero no divide")
mac = {"countries": {"ES": {"currency": "EUR", "infl": {"v": 9}}, "XX": {"infl": {"v": 1}}}}
macro_infl.patch(mac, {"countries": {"ES": {"m": mm}, "EA": {"m": mm}, "ZZ": {"m": mm}}})
eq(sorted(mac["countries"]), ["ES", "XX", "ZZ"], "patch: países")
eq("infl" in mac["countries"]["XX"], False, "patch: se quita infl si ya no hay dato")
eq(mac["countries"]["ES"]["currency"], "EUR", "patch: respeta el resto de datos")
if errs:
    print("\n".join("FALLA: " + e for e in errs)); sys.exit(1)
print("test-cpi: OK")

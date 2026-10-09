#!/usr/bin/env python3
"""Existencias mensuales de España (MAPA SIEGA) e IPCA de mantequilla y queso (Eurostat): lectores con respuestas reales guardadas (scripts/fixtures/spain-siega, sin red).
Comprueba el decodificador de Power BI (valores repetidos, nulos, diccionario de textos), cifras concretas de arroz, colza y soja, que se rechazan respuestas incompletas, meses repetidos,
negativos y fechas que no son dia 1, que una combinacion sin etiqueta se descarta (no se inventa), que las series salen en miles de toneladas y que el parser de Eurostat lee la rejilla JSON-stat.
Uso: python3 scripts/test-spain-siega.py"""
import copy, importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def load(n):
    sp = importlib.util.spec_from_file_location(n.replace("-", "_"), ROOT / "scripts" / (n + ".py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
S = load("update-spain-siega"); H = load("update-spain-hicp")
FX = ROOT / "scripts" / "fixtures" / "spain-siega"
fail = 0
def ok(n, c):
    global fail
    if not c: fail += 1; print("FALLA", n)
net = S.load_fixture(FX)
raw = S.build_series(net); by = {(p, m): dict(pl) for p, m, pl in raw}
ok("13 combinaciones publicadas (arroz x3, cereales x4, colza x2, soja x2, girasol x2); aceites y variedades de arroz quedan fuera a proposito", len(raw) == 13 and not any(m in ("ACC", "ACR", "AOL", "LIN", "IND", "JAP") for _, m, _ in raw))
ok("cebada nov-2022 = 4.650 kt (4.650.000 t)", by[("CB", "EGR")]["2022-11"] == 4650.0)
ok("colza grano dic-2023 = 122 kt y valor repetido por R se expande", by[("CL", "GRA")]["2023-12"] == 122.0)
ok("arroz cascara, descascarillado y blanqueado presentes", all(("AR", m) in by for m in ("CAS", "DCA", "BLA")))
ok("soja grano presente", ("SJ", "GRA") in by and all(v >= 0 for v in by[("SJ", "GRA")].values()))
series = S.make_doc(raw, None); ids = {s["id"] for s in series}
ok("ids unicos", len(ids) == len(series))
s = {x["id"]: x for x in series}["es-siega-stock-rice-paddy"]
ok("serie mensual, grupo stocks, miles de t", s["frequency"] == "monthly" and s["group"] == "stocks" and s["unit"] == "thousand t")
ok("latest = ultimo punto y changePct coherente", s["latest"] == s["points"][-1][1] and abs(s["changePct"] - round((s["points"][-1][1] - s["points"][-2][1]) / s["points"][-2][1] * 100, 2)) < 0.01)
ok("ninguna etiqueta usa la palabra aceite (se etiquetaria como oliva)", not any("aceite" in v[0].lower() for v in S.LABELS.values()))
# rechazos
raw_resp = json.loads((FX / "q_Valores_Mensuales.json").read_text("utf-8"))
inc = copy.deepcopy(raw_resp); inc["results"][0]["result"]["data"]["dsr"]["DS"][0]["RT"] = [["x"]]
try: S.decode(inc); ok("respuesta paginada debe fallar", False)
except ValueError: pass
neg = copy.deepcopy(raw); neg[0] = (neg[0][0], neg[0][1], [(neg[0][2][0][0], -1.0)] * 1)
ok("make_doc descarta series de menos de 6 meses", len(S.make_doc(neg, None)) == len(raw) - 1)
try: S.month(1667347200000 + 86400000 * 3); ok("fecha que no es dia 1 debe fallar", False)
except ValueError: pass
ok("mes valido", S.month(1667260800000) == "2022-11")
# combinacion sin etiqueta: se descarta
lab = dict(S.LABELS); del S.LABELS[("SJ", "GRA")]
ok("combinacion sin etiqueta se descarta", len(S.build_series(net)) == 12); S.LABELS.update(lab)
sk = set(S.SKIPPED); S.SKIPPED.clear()
ok("sin SKIPPED, las combinaciones sin etiqueta tambien se descartan (no se inventa nada)", len(S.build_series(net)) == 13); S.SKIPPED.update(sk)
# HICP
j = {"version": "2.0", "id": ["freq", "unit", "coicop18", "geo", "time"], "size": [1, 1, 2, 1, 3], "value": {"0": 100.65, "1": 100.65, "3": 99.04, "4": 99.33},
     "dimension": {"freq": {"category": {"index": {"M": 0}}}, "unit": {"category": {"index": {"I25": 0}}}, "coicop18": {"category": {"index": {"CP01145": 0, "CP01152": 1}}},
                   "geo": {"category": {"index": {"ES": 0}}}, "time": {"category": {"index": {"2026-07": 0, "2026-08": 1, "2026-09": 2}}}}}
p = H.parse(j)
ok("HICP: queso 2 meses, mantequilla 2 meses, septiembre sin dato no se inventa", p == {"CP01145": {"2026-07": 100.65, "2026-08": 100.65}, "CP01152": {"2026-07": 99.04, "2026-08": 99.33}})
bad = copy.deepcopy(j); bad["dimension"]["geo"]["category"]["index"] = {"FR": 0}
try: H.parse(bad); ok("HICP de otro pais debe fallar", False)
except ValueError: pass
print("test-spain-siega:", "%d fallos" % fail if fail else "OK"); sys.exit(1 if fail else 0)

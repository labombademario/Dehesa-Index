#!/usr/bin/env python3
"""canonicalSeriesId v2: casos de diseno (lo que v1 colapsaba), determinismo, migracion v1->v2 y unicidad sobre el registro real."""
import importlib.util, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT / "scripts"))
sp = importlib.util.spec_from_file_location("bsr", ROOT / "scripts/build-series-registry.py"); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
bad = []
def T(name, cond):
    print(("ok   " if cond else "FAIL ") + name)
    if not cond: bad.append(name)
def cid(label, cc="X", g="prices", f="monthly", u="eur"):
    b, q = M.split_label(label); tk = M.toks(label); n = M.ordered_numbers(b)
    return "|".join([cc, g, f, u, "-".join(sorted(tk))] + (["n:" + n] if n else []) + (["q:" + M.qual_slug(q)] if M.qual_slug(q) else []))
D = [("forma: grano frente a polvo", "Fertilizante: Superfosfato de cal 18 % (grano)", "Fertilizante: Superfosfato de cal 18 % (polvo)"),
     ("origen: Turquia frente a Italia", "Aubergines (origin: Turkey)", "Aubergines (origin: Italy)"),
     ("nutriente anidado: N frente a P2O5", "Livestock manure (Nitrogen (N)): total excretion", "Livestock manure (Phosphate (P205)): total excretion"),
     ("umbral: < 20 frente a >= 20 meses", "Laying hens (< 20 months)", "Laying hens (>=20 months)"),
     ("relacion NPK 1-1-0 frente a 0-1-1", "Binary fertilizers: 1 - 1 - 0 (price paid)", "Binary fertilizers: 0 - 1 - 1 (price paid)"),
     ("calidad: con y sin etiquetas", "Cow, class R (standard)", "Cow, class R (standard + quality labels, to Jul 2022)"),
     ("alcance: incluye semilla", "Producer price index: Cereals (incl. seed) (2020=100)", "Producer price index: Cereals (2020=100)")]
for n, a, b in D: T("distintos: " + n, cid(a) != cid(b))
T("sin parentesis conserva el id v1 (pais|grupo|frec|unidad|conceptos)", cid("Cattle meat production") == "X|prices|monthly|eur|cattle-meat-production")
T("determinista: mismo texto, mismo id", cid("Aubergines (origin: Spain)") == cid("Aubergines (origin: Spain)"))
T("independiente del orden de las palabras del concepto", cid("Meat pigs production") == cid("Production pigs meat"))
T("pais, frecuencia y unidad distinguen", len({cid("Wheat", cc="ES"), cid("Wheat", cc="FR"), cid("Wheat", f="weekly"), cid("Wheat", u="usd")}) == 4)
reg = json.loads((ROOT / "data/series-registry.json").read_text())
T("el registro es v2", reg.get("canonicalVersion") == 2 and reg["summary"]["canonicalCollisions"] == 0)
by = {}
for s in reg["series"]: by.setdefault(s["canonicalSeriesId"], []).append(s)
und = [c for c, g in by.items() if len(g) > 1 and not all(a["file"] != b["file"] and b["id"] in a["alternates"] and a["id"] in b["alternates"] for i, a in enumerate(g) for b in g[i + 1:])]
T("canonicalSeriesId unico salvo equivalencias declaradas (%d series, %d ids)" % (len(reg["series"]), len(by)), not und)
T("migracion: v1 = v2 sin los segmentos n:/q: y queda unico por serie (pais, id)", len({(s["country"], s["id"]) for s in reg["series"]}) == len(reg["series"]) and all(re.sub(r"\|[nq]:[^|]*", "", s["canonicalSeriesId"]).count("|") >= 4 for s in reg["series"]))
T("dims coherentes con el id", all(s["dims"]["country"] == s["canonicalSeriesId"].split("|")[0] and s["dims"]["frequency"] == s["canonicalSeriesId"].split("|")[2] for s in reg["series"]))
sys.exit(1 if bad else 0)

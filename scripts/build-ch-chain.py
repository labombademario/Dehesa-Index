#!/usr/bin/env python3
"""data/ch-chain.json — Suiza: transmision de precios por la cadena (productor -> transformador -> consumidor) y prima bio. Derivado de data/switzerland-foag-stats.json (FOAG/BLW).
Es DESCRIPTIVO, no predictivo: cada etapa se muestra como indice base 100 en un periodo comun con su propia unidad y base de IVA; NO se restan etapas ni se llama margen a la diferencia (se desconocen costes y mezcla comercial).
La prima bio es organico / convencional - 1 solo entre series con la misma especificacion, unidad, etapa y base de IVA, y en periodos con dato en ambas; sin interpolar."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
doc = json.loads((ROOT / "data" / "switzerland-foag-stats.json").read_text(encoding="utf-8"))
S = {s["id"]: s for s in doc["countries"]["CH"]["series"]}
def pts(sid): return dict((p, v) for p, v in S[sid]["points"])
def vat(sid):
    n = S[sid].get("periodNote", ""); return "incl. VAT" if "incl. VAT" in n else ("excl. VAT" if "excl. VAT" in n else "n/a")
def annual_mean(sid):
    by = {}
    for p, v in S[sid]["points"]:
        by.setdefault(p[:4], []).append(v)
    return {y: round(sum(v) / len(v), 4) for y, v in by.items() if len(v) == 12}
def stage_obj(stage, sid, data):
    return {"stage": stage, "seriesId": sid, "label": S[sid]["label"], "unit": S[sid]["unit"], "vat": vat(sid), "frequency": S[sid]["frequency"] if data is None else None}
CHAINS = [  # (id, nombre, [(etapa, serieId)], frecuencia)
    ("milk-butter", "Milk -> butter", [("producer", "ch-foag-milk-price-total"), ("processor", "ch-foag-milk-proc-butter"), ("consumer", "ch-foag-milk-retail-butter")], "monthly"),
    ("milk-uht", "Milk -> UHT milk", [("producer", "ch-foag-milk-price-total"), ("consumer", "ch-foag-milk-retail-uht-milk")], "monthly"),
    ("milk-powder", "Milk -> skimmed milk powder", [("producer", "ch-foag-milk-price-total"), ("processor", "ch-foag-milk-proc-smp"), ("consumer", "ch-foag-milk-retail-uht-milk")], "monthly"),
    ("eggs", "Eggs (all production forms)", [("producer", "ch-foag-egg-price-all"), ("consumer", "ch-foag-egg-retail-all")], "monthly"),
    ("wheat-flour", "Top wheat -> mill -> flour (annual means, full years)", [("producer", "ch-foag-cereal-price-topwheat-conv"), ("processor", "ch-foag-cereal-mill-topwheat-conv"), ("processor2", "ch-foag-cereal-mill-flour")], "annual"),
]
chains = []
for cid, name, stages, fr in CHAINS:
    if any(sid not in S for _, sid in stages): continue
    data = []
    for st, sid in stages:
        if fr == "annual":
            d = pts(sid) if S[sid]["frequency"] == "annual" else annual_mean(sid)
        else:
            d = pts(sid)
        data.append((st, sid, d))
    common = sorted(set.intersection(*[set(d) for _, _, d in data]))
    if len(common) < 12 and fr == "monthly" or len(common) < 3: continue
    # base comun: ultimo periodo comun de arranque estable: primer periodo comun
    base = common[0]
    out = []
    for st, sid, d in data:
        b = d[base]
        out.append({"stage": st, "seriesId": sid, "label": S[sid]["label"], "unit": S[sid]["unit"], "vat": vat(sid), "points": [[p, round(d[p] / b * 100, 1)] for p in common]})
    last = common[-1]
    chains.append({"id": cid, "name": name, "frequency": fr, "basePeriod": base, "latestPeriod": last, "stages": out,
                   "latest": {o["stage"]: o["points"][-1][1] for o in out}, "change12m": None if fr != "monthly" or len(common) < 13 else {o["stage"]: round(o["points"][-1][1] / o["points"][-13][1] * 100 - 100, 1) for o in out}})
PAIRS = [  # (id, nombre, organico, convencional)
    ("milk-producer", "Milk: producer price, organic vs conventional (dairy milk)", "ch-foag-milk-price-organic", "ch-foag-milk-price-dairy-conv"),
    ("eggs-producer-barn", "Eggs: producer price, organic vs barn", "ch-foag-egg-price-organic", "ch-foag-egg-price-barn"),
    ("eggs-producer-freerange", "Eggs: producer price, organic vs free range", "ch-foag-egg-price-organic", "ch-foag-egg-price-freerange"),
    ("eggs-retail-barn", "Eggs: retail price, organic vs barn", "ch-foag-egg-retail-organic", "ch-foag-egg-retail-barn"),
    ("eggs-retail-freerange", "Eggs: retail price, organic vs free range", "ch-foag-egg-retail-organic", "ch-foag-egg-retail-freerange"),
    ("wheat-producer", "Wheat: producer price, organic vs top wheat conventional", "ch-foag-cereal-price-wheat-organic", "ch-foag-cereal-price-topwheat-conv"),
    ("wheat-mill", "Wheat: franco-mill price, organic vs top wheat conventional", "ch-foag-cereal-mill-wheat-organic", "ch-foag-cereal-mill-topwheat-conv"),
    ("rapeseed-producer", "Rapeseed: producer price, organic vs conventional", "ch-foag-oilseed-price-rapeseed-organic", "ch-foag-oilseed-price-rapeseed-conv"),
]
prem = []
for pid, name, o, c in PAIRS:
    if o not in S or c not in S: continue
    if S[o]["unit"] != S[c]["unit"] or S[o]["frequency"] != S[c]["frequency"] or vat(o) != vat(c): continue
    do, dc = pts(o), pts(c)
    com = sorted(set(do) & set(dc))
    if len(com) < 3: continue
    series = [[p, round((do[p] / dc[p] - 1) * 100, 1), do[p], dc[p]] for p in com]
    prem.append({"id": pid, "name": name, "organicSeriesId": o, "conventionalSeriesId": c, "unit": S[o]["unit"], "vat": vat(o), "frequency": S[o]["frequency"], "points": series,
                 "latestPeriod": series[-1][0], "latestPremiumPct": series[-1][1]})
if not chains and not prem: sys.exit("sin cadenas ni primas")
out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sourceIds": ["foag_ch"],
       "method": "Indices base 100 en el primer periodo comun a todas las etapas; cada etapa conserva su unidad y base de IVA (productor y consumo, con IVA; transformacion, sin IVA). Prima = organico/convencional - 1 solo con misma unidad, frecuencia y base de IVA.",
       "caveats": ["No es un margen: no se restan etapas ni se conocen costes, mezcla comercial ni rendimientos de transformacion.",
                   "Los productos de cada etapa no son identicos (leche cruda, mantequilla, leche UHT): se compara la evolucion, no el nivel.",
                   "La prima bio compara la especificacion publicada por FOAG; la leche bio y la convencional pueden diferir en composicion y destino."],
       "chains": chains, "premiums": prem}
(ROOT / "data" / "ch-chain.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("cadenas", len(chains), "primas", len(prem))

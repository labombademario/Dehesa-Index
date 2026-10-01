#!/usr/bin/env python3
"""Registro de series: canonicalSeriesId + sourcePriority (organismo nacional > Eurostat armonizado > organizacion internacional > secundaria).
Escribe data/series-registry.json: por serie {id, country, file, tier, canonicalSeriesId, preferred, alternates[]}.
canonicalSeriesId = pais|grupo|frecuencia|unidad|conceptos (etiqueta sin parentesis, tokens ordenados). Si dos series de ficheros distintos comparten
canonicalSeriesId o son casi iguales (Jaccard >= 0.75 de tokens con misma unidad y frecuencia), se marcan como candidatas a duplicado y 'preferred' queda en la de mejor tier
(luego la mas reciente, luego la mas larga). A fecha de hoy no hay duplicados entre ficheros; el registro y el aviso de validate-data quedan para que no entren a futuro."""
import datetime, json, re, sys, collections
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FILES = {"country-stats": 1, "spain-stats": 1, "france-stats": 1, "germany-stats": 1, "belgium-stats": 1, "austria-stats": 1, "portugal-stats": 1, "canada-stats": 1, "australia-trade-stats": 1, "portugal-eurostat-stats": 2, "eu-trade-stats": 2, "interest-rates-stats": 1}
TIER_OVERRIDE = {"us-policy-rate": 3}  # BIS (organizacion internacional) en vez del banco central
TIERS = {1: "national official body", 2: "Eurostat harmonised", 3: "international organisation", 4: "secondary / aggregator"}
def toks(label): return frozenset(re.findall(r"[a-z0-9]+", re.sub(r"\([^)]*\)", "", label.lower())))
def main():
    rows = []
    for f, tier in FILES.items():
        d = json.loads((ROOT / "data" / (f + ".json")).read_text())  # estricto: un fichero fuente ausente o roto detiene el build (no se publica nada)
        for cc, c in d.get("countries", {}).items():
            for s in c["series"]:
                t = TIER_OVERRIDE.get(s["id"], tier); tk = toks(s["label"])
                rows.append({"id": s["id"], "country": cc, "file": f + ".json", "tier": t, "canonicalSeriesId": "|".join([cc, s["group"], s["frequency"], s["unit"], "-".join(sorted(tk))]), "_tk": tk, "_u": (cc, s["unit"], s["frequency"]), "latest": s["latestPeriod"], "n": len(s["points"]), "alternates": []})
    by = collections.defaultdict(list)
    for r in rows: by[r["_u"]].append(r)
    dups = 0
    for l in by.values():
        for i in range(len(l)):
            for j in range(i + 1, len(l)):
                a, b = l[i], l[j]
                if a["file"] == b["file"]: continue
                u = len(a["_tk"] | b["_tk"])
                if a["canonicalSeriesId"] == b["canonicalSeriesId"] or (u and len(a["_tk"] & b["_tk"]) / u >= 0.75):
                    a["alternates"].append(b["id"]); b["alternates"].append(a["id"]); dups += 1
    byid = {(r["country"], r["id"]): r for r in rows}
    for r in rows:
        r["preferred"] = True
        for alt in r["alternates"]:
            o = byid[(r["country"], alt)]
            if (o["tier"], -len(o["latest"]) and o["latest"] == r["latest"], ) and (o["tier"] < r["tier"] or (o["tier"] == r["tier"] and (o["latest"] > r["latest"] or (o["latest"] == r["latest"] and o["n"] > r["n"])))): r["preferred"] = False
        del r["_tk"], r["_u"]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "tiers": TIERS, "series": rows, "summary": {"series": len(rows), "duplicateCandidates": dups, "nonPreferred": sum(1 for r in rows if not r["preferred"])}}
    out = ROOT / "data" / "series-registry.json"
    try:
        old = json.loads(out.read_text())
        if old.get("series") == doc["series"]: print("sin cambios", doc["summary"]); return
    except Exception: pass
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print(doc["summary"])
main()

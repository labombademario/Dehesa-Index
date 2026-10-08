#!/usr/bin/env python3
"""Registro de series: canonicalSeriesId + sourcePriority (organismo nacional > Eurostat armonizado > organizacion internacional > secundaria).
Escribe data/series-registry.json: por serie {id, country, file, tier, canonicalSeriesId, preferred, alternates[]}.
canonicalSeriesId (v2) = pais|grupo|frecuencia|unidad|conceptos[|q:calificadores]. "conceptos" = tokens ordenados de la etiqueta SIN los parentesis; "calificadores" = el contenido de
los parentesis EN ORDEN (forma, calidad, origen, nutriente, base...), que distingue series que v1 colapsaba (Superfosfato 18 % (grano) frente a (polvo), "Aubergines (origin: Turkey)" frente a (origin: Italy)).
Determinista y estable: depende solo de la etiqueta/unidad/frecuencia/grupo de la propia serie, nunca de las demas. Las series sin parentesis conservan el id v1. `dims` desglosa pais, grupo, metrica, producto(s), conceptos,
calificadores, frecuencia y unidad. Dos series solo pueden compartir canonicalSeriesId si son equivalencias DECLARADAS (ficheros distintos y referenciadas en `alternates`); si no, el build falla. Si dos series de ficheros distintos comparten
canonicalSeriesId o son casi iguales (Jaccard >= 0.75 de tokens con misma unidad y frecuencia), se marcan como candidatas a duplicado y 'preferred' queda en la de mejor tier
(luego la mas reciente, luego la mas larga). A fecha de hoy no hay duplicados entre ficheros; el registro y el aviso de validate-data quedan para que no entren a futuro."""
from pathlib import Path
import datetime, json, re, sys, collections
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_tags import tags as product_tags
import coverage_model as CM
ROOT = Path(__file__).resolve().parents[1]
FILES = {"country-stats": 1, "spain-stats": 1, "france-stats": 1, "france-crops-stats": 1, "france-extras-stats": 1, "france-campaign-stats": 1, "france-rnm-stats": 1, "france-dairy-stats": 1, "germany-stats": 1, "belgium-stats": 1, "austria-stats": 1, "uk-stats": 1, "portugal-stats": 1, "eu-gapfill-stats": 1, "canada-stats": 1, "us-stats": 1, "australia-trade-stats": 1, "portugal-eurostat-stats": 2, "italy-eurostat-stats": 2, "eurostat-depth-stats": 2, "uk-trade-stats": 2, "chile-stats": 1, "argentina-stats": 1, "poland-eurostat-stats": 1, "eurostat-eu-stats": 1, "eurostat-euw-stats": 1, "abares-stats": 1, "switzerland-foag-stats": 1, "switzerland-meteo-stats": 1, "poland-stats": 1, "eu-trade-stats": 2, "interest-rates-stats": 1}
TIER_OVERRIDE = {"us-policy-rate": 3}  # BIS (organizacion internacional) en vez del banco central
TIERS = {1: "national official body", 2: "Eurostat harmonised", 3: "international organisation", 4: "secondary / aggregator"}
def split_label(label):
    """(base sin parentesis, [contenido de cada parentesis de primer nivel, en orden]); admite anidados: 'Manure (Nitrogen (N))' -> ('Manure', ['Nitrogen (N)'])."""
    base, quals, depth, cur = [], [], 0, []
    for ch in label:
        if ch == "(":
            if depth: cur.append(ch)
            depth += 1
        elif ch == ")" and depth:
            depth -= 1
            if depth: cur.append(ch)
            else: quals.append("".join(cur)); cur = []
        elif depth: cur.append(ch)
        else: base.append(ch)
    if depth: base.append("(" + "".join(cur))  # parentesis sin cerrar: se trata como texto
    return "".join(base), quals
def toks(label): return frozenset(re.findall(r"[a-z0-9]+", split_label(label)[0].lower()))
CMP = [("<=", " le "), (">=", " ge "), ("\u2264", " le "), ("\u2265", " ge "), ("<", " lt "), (">", " gt "), ("%", " pct ")]
def _slug(s):
    s = s.lower()
    for a, b in CMP: s = s.replace(a, b)
    return "-".join(re.findall(r"[a-z0-9]+", s))
def qual_slug(quals): return "+".join(x for x in (_slug(q) for q in quals) if x)
def ordered_numbers(base):
    """Secuencia ORDENADA de numeros del concepto cuando hay 2 o mas (relaciones NPK '1 - 1 - 0' frente a '0 - 1 - 1'): el conjunto de tokens las confundiria."""
    n = re.findall(r"\d+", base)
    return "-".join(n) if len(n) >= 2 else ""
def main():
    rows = []
    for f, tier in FILES.items():
        d = json.loads((ROOT / "data" / (f + ".json")).read_text())  # estricto: un fichero fuente ausente o roto detiene el build (no se publica nada)
        for cc, c in d.get("countries", {}).items():
            for s in c["series"]:
                t = TIER_OVERRIDE.get(s["id"], tier); tk = toks(s["label"])
                rows.append({"id": s["id"], "country": cc, "file": f + ".json", "tier": t, "canonicalSeriesId": "|".join([cc, s["group"], s["frequency"], s["unit"], "-".join(sorted(tk))] + (["n:" + ordered_numbers(split_label(s["label"])[0])] if ordered_numbers(split_label(s["label"])[0]) else []) + (["q:" + qual_slug(split_label(s["label"])[1])] if qual_slug(split_label(s["label"])[1]) else [])), "dims": {"country": cc, "group": s["group"], "metric": CM.GROUP_METRIC.get(s["group"]), "products": product_tags(s["label"]), "concept": sorted(tk), "qualifiers": [q.strip() for q in split_label(s["label"])[1]], "frequency": s["frequency"], "unit": s["unit"]}, "_tk": tk, "_u": (cc, s["unit"], s["frequency"]), "latest": s["latestPeriod"], "n": len(s["points"]), "alternates": []})
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
    byc = collections.defaultdict(list)
    for r in rows: byc[r["canonicalSeriesId"]].append(r)
    undeclared = []
    for cid, g in byc.items():
        for i in range(len(g)):
            for j in range(i + 1, len(g)):
                a, b = g[i], g[j]
                if not (a["file"] != b["file"] and b["id"] in a["alternates"] and a["id"] in b["alternates"]): undeclared.append((cid, a["id"], b["id"]))
    if undeclared:
        for u in undeclared[:20]: print("COLISION canonicalSeriesId no declarada:", u, file=sys.stderr)
        sys.exit("canonicalSeriesId debe ser unico salvo equivalencias declaradas: %d colisiones" % len(undeclared))
    doc = {"schemaVersion": 2, "canonicalVersion": 2, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "tiers": TIERS, "series": rows, "summary": {"series": len(rows), "canonicalCollisions": 0, "declaredEquivalences": sum(1 for g in byc.values() if len(g) > 1), "duplicateCandidates": dups, "nonPreferred": sum(1 for r in rows if not r["preferred"])}}
    out = ROOT / "data" / "series-registry.json"
    try:
        old = json.loads(out.read_text())
        if old.get("series") == doc["series"]: print("sin cambios", doc["summary"]); return
    except Exception: pass
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print(doc["summary"])
if __name__ == "__main__": main()

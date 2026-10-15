#!/usr/bin/env python3
"""Catalogo comercial: que ficheros de data/ se pueden ofrecer a empresas segun el registro de licencias.

Fuente unica de verdad: data/license-registry.json (no se inventa ningun permiso). Para cada fuente que se usa se calcula un veredicto:
  apto         VERIFIED y commercialUse, derivatives y redistribution = yes
  condiciones  VERIFIED, sin ningun 'no' ni 'unclear', y al menos un 'conditional' (hay que cumplir condiciones concretas: marcar datos modificados, no cobrar extra, etc.)
  no-apto      cualquier otro caso: PENDING, RESTRICTED, BLOCKED o algun permiso 'no'/'unclear'. La parte de pago no puede incluirlo.
Para cada fichero (o carpeta) se combinan las fuentes que contiene:
  apto / condiciones   todas sus fuentes son aptas (o aptas con condiciones)
  parcial              mezcla: solo se puede ofrecer filtrando por fuente (lista commercialSources)
  no-apto              ninguna fuente es apta
  derivado             fichero calculado por Dehesa Index cuyo linaje (de que fuentes sale) el registro todavia no declara: queda fuera hasta declararlo.
Escribe data/commercial-catalog.json (completo) y data/commercial-summary.json (resumen pequeno para la landing de Empresas: cifras y nombre/veredicto de cada fuente). No es asesoramiento juridico: es la lectura mecanica del registro.
Uso: python3 scripts/build-commercial-catalog.py [--check]  (--check falla si el fichero publicado esta desfasado)"""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
OUT = D / "commercial-catalog.json"; OUT_SUM = D / "commercial-summary.json"
reg = json.loads((D / "license-registry.json").read_text(encoding="utf-8"))
S = reg["sources"]; ALIAS = {}
for k, v in S.items():
    ALIAS[k] = k
    for a in v.get("aliases", []): ALIAS[a] = k
RANK = {"apto": 0, "condiciones": 1, "no-apto": 2}

def verdict(v):
    if v["status"] != "VERIFIED": return "no-apto"
    perms = (v["commercialUse"], v["derivatives"], v["redistribution"])
    if any(p in ("no", "unclear") for p in perms): return "no-apto"
    return "apto" if all(p == "yes" for p in perms) else "condiciones"

def reason(v):
    if v["status"] != "VERIFIED": return "licencia %s en el registro" % v["status"]
    bad = [n for n, p in (("uso comercial", v["commercialUse"]), ("derivados", v["derivatives"]), ("redistribución", v["redistribution"])) if p in ("no", "unclear")]
    return ("%s: %s" % ("sin confirmar" if all(v[k] == "unclear" for k in ("commercialUse", "derivatives", "redistribution")) else "limitado", ", ".join(bad))) if bad else ""

def canon(sid):
    k = ALIAS.get(sid)
    if not k: raise SystemExit("sourceId %r no esta en el registro de licencias" % sid)
    return k

def obs_sources(name):
    doc = json.loads((D / name).read_text(encoding="utf-8"))
    return sorted({canon(o["sourceId"]) for o in doc["observations"]})

def file_parts(path, m):
    """(ambito, [(alcance, sourceId)]) de una entrada de files."""
    if m.get("fromField") == "sourceId":
        return "observaciones", [("observaciones", s) for s in obs_sources(path[5:])]
    parts = [("fichero", canon(s)) for s in m.get("sources", [])]
    if m.get("default"): parts.append(("resto", canon(m["default"])))
    for c, s in sorted(m.get("byCountry", {}).items()): parts.append(("pais:" + c, canon(s)))
    for p, s in sorted(m.get("bySourceGroupPrefix", {}).items()): parts.append(("grupo:" + p, canon(s)))
    return ("carpeta" if path.endswith("/") else "fichero"), parts

def build():
    used_ids = set(); datasets = []
    for path in sorted(reg["files"]):
        m = reg["files"][path]; scope, parts = file_parts(path, m)
        ids = sorted({s for _, s in parts}); used_ids.update(ids)
        vs = {s: verdict(S[s]) for s in ids}
        good = [s for s in ids if vs[s] != "no-apto"]; bad = [s for s in ids if vs[s] == "no-apto"]
        if not ids: v = "derivado"
        elif not bad: v = "apto" if all(vs[s] == "apto" for s in ids) else "condiciones"
        elif good: v = "parcial"
        else: v = "no-apto"
        e = {"path": path, "scope": scope, "verdict": v, "sources": ids}
        if good and bad: e["commercialSources"] = good
        if bad: e["excludedSources"] = bad
        rv = [x for x in good if S[x]["commercialUse"] == "conditional" and not S[x].get("ownerDecision")]
        if rv: e["reviewBeforeSelling"] = rv
        if scope in ("fichero", "carpeta") and len({sc for sc, _ in parts}) > 1 or any(sc.startswith(("pais:", "grupo:")) for sc, _ in parts):
            e["parts"] = [{"scope": sc, "sourceId": s, "verdict": vs[s]} for sc, s in parts]
        datasets.append(e)
    derived = [{"path": "data/" + n, "verdict": "derivado"} for n in sorted(reg["derived"])]
    sources = []
    for k in sorted(used_ids):
        v = S[k]; vd = verdict(v)
        e = {"id": k, "name": v["name"], "url": v["url"], "country": v["country"], "licenseId": v["licenseId"], "licenseName": v["licenseName"], "licenseUrl": v["licenseUrl"],
             "verdict": vd, "status": v["status"], "legalConfidence": v["legalConfidence"], "commercialUse": v["commercialUse"], "derivatives": v["derivatives"],
             "redistribution": v["redistribution"], "attribution": v["attributionText"]}
        if v.get("additionalRestrictions"): e["conditions"] = v["additionalRestrictions"]
        if vd == "no-apto": e["why"] = reason(v)
        if v.get("ownerDecision"): e["ownerDecision"] = v["ownerDecision"]["text"] + " (" + v["ownerDecision"]["date"] + ")"
        if vd == "condiciones" and v["commercialUse"] == "conditional" and not v.get("ownerDecision"): e["reviewBeforeSelling"] = True  # la condicion afecta al propio uso comercial: leerla antes de cobrar por estos datos
        sources.append(e)
    cnt = lambda lst, key, val: sum(1 for x in lst if x[key] == val)
    summary = {"sources": len(sources), "sourcesApto": cnt(sources, "verdict", "apto"), "sourcesCondiciones": cnt(sources, "verdict", "condiciones"), "sourcesNoApto": cnt(sources, "verdict", "no-apto"),
               "datasets": len(datasets), **{"datasets_" + k: cnt(datasets, "verdict", k) for k in ("apto", "condiciones", "parcial", "no-apto")}, "datasets_reviewBeforeSelling": sum(1 for x in datasets if x.get("reviewBeforeSelling")), "derived": len(derived)}
    return {"schemaVersion": 1, "policy": {
        "es": "Lectura mecánica de data/license-registry.json. Apto: fuente VERIFIED con uso comercial, derivados y redistribución permitidos. Condiciones: VERIFIED con alguna condición concreta (se citan). No apto: licencia pendiente, restringida, bloqueada o con algún permiso negado o sin confirmar. No es asesoramiento jurídico.",
        "en": "Mechanical reading of data/license-registry.json. Fit: VERIFIED source with commercial use, derivatives and redistribution allowed. Conditions: VERIFIED with specific conditions (quoted). Not fit: licence pending, restricted, blocked, or with a denied or unconfirmed permission. Not legal advice."},
        "summary": summary, "sources": sources, "datasets": datasets, "derived": derived}

def summary_doc(doc):
    return {"schemaVersion": 1, "summary": doc["summary"], "sources": {x["id"]: {"name": x["name"], "verdict": x["verdict"]} for x in doc["sources"]}}

def write_json(path, doc, check):
    """Escribe conservando generatedAt si nada mas cambia; con check devuelve False si esta desfasado."""
    try: old = json.loads(path.read_text(encoding="utf-8")); g = old.pop("generatedAt", None)
    except Exception: old, g = {}, None
    if check: return old == doc
    if old == doc and g: return True
    out = {"schemaVersion": doc["schemaVersion"], "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), **{k: v for k, v in doc.items() if k != "schemaVersion"}}
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"); return True

def main():
    doc = build(); sm = summary_doc(doc)
    if "--check" in sys.argv:
        if not (write_json(OUT, doc, True) and write_json(OUT_SUM, sm, True)): print("catalogo comercial desfasado: ejecuta python3 scripts/build-commercial-catalog.py"); sys.exit(1)
        print("catalogo comercial al dia (%s)" % doc["summary"]); return
    write_json(OUT, doc, False); write_json(OUT_SUM, sm, False); print(doc["summary"])

main()

#!/usr/bin/env python3
"""License Gate (CI): data/license-registry.json es la fuente unica de verdad sobre licencias de datos.
Falla (exit 1) si:
 - una fuente del registro tiene campos obligatorios ausentes o valores fuera de catalogo, o un estado incoherente (VERIFIED sin licenseUrl/verifiedAt;
   RESTRICTED/BLOCKED marcada como usada);
 - un fichero de datos publicado no esta en el registro (ni como fuente externa ni como derivado);
 - un sourceId usado en latest/history/normalized, en los ficheros de estadisticas por pais o en el catalogo no existe en el registro,
   o apunta a una fuente RESTRICTED/BLOCKED, o a una fuente marcada used:false;
 - el catalogo (data/catalog/**) no propaga sourceId/licenseId coherentes con el registro;
 - hay texto legal categorico incompatible con el registro (p. ej. afirmar que FAOSTAT es "no comercial": sus terminos actuales son CC BY 4.0 con una restriccion de promocion comercial).
Avisa (no falla salvo --strict) de las fuentes PENDING en uso y de verificaciones antiguas. Uso: python3 scripts/check-licenses.py [--strict] [--report]"""
import datetime, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
STRICT = "--strict" in sys.argv
REQ = ["name", "url", "country", "licenseId", "licenseName", "licenseUrl", "commercialUse", "derivatives", "redistribution", "attributionRequired", "attributionText",
       "additionalRestrictions", "thirdPartyExceptions", "thirdPartyNote", "verifiedAt", "status", "confidence", "evidence", "used", "aliases"]
YNC = {"yes", "no", "conditional", "unclear"}; STATUS = {"VERIFIED", "PENDING", "RESTRICTED", "BLOCKED"}
errs, warns = [], []
reg = json.loads((D / "license-registry.json").read_text(encoding="utf-8"))
S = reg["sources"]; alias = {}
for k, v in S.items():
    alias[k] = k
    for a in v.get("aliases", []): alias[a] = k
def res(sid, where):
    k = alias.get(sid)
    if not k: errs.append("%s: sourceId '%s' no esta en data/license-registry.json" % (where, sid)); return None
    return k
# 1) forma del registro
today = datetime.date.today()
for k, v in S.items():
    for f in REQ:
        if f not in v: errs.append("registro/%s: falta '%s'" % (k, f))
    if v.get("status") not in STATUS: errs.append("registro/%s: status invalido %r" % (k, v.get("status")))
    for f in ("commercialUse", "derivatives", "redistribution"):
        if v.get(f) not in YNC: errs.append("registro/%s: %s invalido %r" % (k, f, v.get(f)))
    if v.get("status") == "VERIFIED":
        if not v.get("licenseUrl") or not v.get("verifiedAt"): errs.append("registro/%s: VERIFIED exige licenseUrl y verifiedAt" % k)
        if v.get("commercialUse") == "no" or v.get("derivatives") == "no": errs.append("registro/%s: VERIFIED incompatible con commercialUse/derivatives = no" % k)
        try:
            age = (today - datetime.date.fromisoformat(v["verifiedAt"])).days
            if age > reg["policy"]["maxAgeDaysVerified"]: warns.append("registro/%s: verificada hace %d dias (> %d): reverificar" % (k, age, reg["policy"]["maxAgeDaysVerified"]))
        except Exception: errs.append("registro/%s: verifiedAt invalido" % k)
    if v.get("status") in ("RESTRICTED", "BLOCKED") and v.get("used"): errs.append("registro/%s: %s no puede estar usada" % (k, v["status"]))
    if v.get("status") == "PENDING" and not v.get("evidence"): errs.append("registro/%s: PENDING sin explicacion (evidence)" % k)
    if v.get("licenseId") == "UNKNOWN" and v.get("status") == "VERIFIED": errs.append("registro/%s: VERIFIED con licenseId UNKNOWN" % k)
# 2) cobertura de ficheros
known = set(p[5:] for p in reg["files"] if p.endswith(".json")) | set(reg["derived"]) | {"license-registry.json"}
for f in sorted(D.glob("*.json")):
    if f.name not in known: errs.append("data/%s: fichero publicado sin entrada en el registro de licencias (files o derived)" % f.name)
for d in sorted(p for p in D.iterdir() if p.is_dir()):
    if d.name not in ("eu", "ams", "catalog", "series", "snapshots") and ("data/%s/" % d.name) not in reg["files"]: errs.append("data/%s/: directorio sin entrada en el registro" % d.name)
used_by = {}
for path, m in reg["files"].items():
    ids = list(m.get("sources", [])) + ([m["default"]] if m.get("default") else []) + list(m.get("byCountry", {}).values()) + list(m.get("bySourceGroupPrefix", {}).values())
    for sid in ids:
        k = res(sid, "files[%s]" % path)
        if k: used_by.setdefault(k, set()).add(path)
# 3) contenido: sourceId reales
def used(k, where):
    s = S[k]; used_by.setdefault(k, set()).add(where)
    if s["status"] in ("RESTRICTED", "BLOCKED"): errs.append("%s: usa la fuente %s, que esta %s" % (where, k, s["status"]))
for n in ("latest", "history", "normalized"):
    doc = json.loads((D / (n + ".json")).read_text())
    for sid in sorted({o["sourceId"] for o in doc["observations"]}):
        k = res(sid, "data/%s.json" % n)
        if k: used(k, "data/%s.json" % n)
for f in sorted((D / "prices/latest").glob("*.json")):  # capa ligera de precios: cada observacion lleva su sourceId
    for sid in sorted({o["sourceId"] for o in json.loads(f.read_text())["observations"]}):
        k = res(sid, "data/prices/latest/%s" % f.name)
        if k: used(k, "data/prices/")
for path, m in reg["files"].items():
    if not (m.get("byCountry") or m.get("bySourceGroupPrefix")): continue
    f = ROOT / path
    if not f.exists(): errs.append("%s: listado en el registro pero no existe" % path); continue
    doc = json.loads(f.read_text())
    for cc, c in doc.get("countries", {}).items():
        if m.get("byCountry") and cc in m["byCountry"]: continue
        if m.get("bySourceGroupPrefix"):
            for s in c["series"]:
                g = s.get("sourceGroup", "")
                if not any(g.startswith(pf) for pf in m["bySourceGroupPrefix"]): errs.append("%s: serie %s/%s con sourceGroup '%s' sin fuente asignada" % (path, cc, s["id"], g)); break
            continue
        errs.append("%s: pais %s sin fuente asignada en el registro" % (path, cc))
# 4) catalogo
n_cat = 0; per_src = {}
for f in sorted((D / "catalog").glob("*.json")) + sorted((D / "catalog" / "eu").glob("*.json")):
    if f.name == "manifest.json": continue
    for s in json.loads(f.read_text()).get("series", []):
        n_cat += 1
        sid = s.get("sourceId")
        if not sid: errs.append("catalog/%s: serie %s sin sourceId" % (f.relative_to(D / "catalog"), s.get("id"))); break
        k = res(sid, "catalog/" + f.name)
        if not k: break
        if s.get("licenseId") != S[k]["licenseId"]: errs.append("catalog/%s: serie %s licenseId %r != registro %r" % (f.name, s.get("id"), s.get("licenseId"), S[k]["licenseId"])); break
        used(k, "catalog"); per_src[k] = per_src.get(k, 0) + 1
# 5) coherencia used / uso real
for k, v in S.items():
    if v["used"] and k not in used_by: warns.append("registro/%s: marcada used:true pero ningun fichero la usa" % k)
    if not v["used"] and k in used_by: errs.append("registro/%s: used:false pero la usan %s" % (k, sorted(used_by[k])[:3]))
# 6) texto legal categorico
LINT = [(r"FAOSTAT[^\n]{0,100}(no comercial|non-commercial|non commercial|NC-SA|sin uso comercial)", "FAOSTAT: sus terminos actuales son CC BY 4.0 con restriccion de promocion comercial, no 'no comercial' categorico")]
for f in list((ROOT / "js").glob("*.js")) + list(ROOT.glob("*.html")) + [ROOT / "README.md"]:
    if not f.exists(): continue
    t = f.read_text(encoding="utf-8", errors="ignore")
    for rx, msg in LINT:
        if re.search(rx, t, re.I): errs.append("%s: %s" % (f.name, msg))
# informe
pend = sorted(k for k, v in S.items() if v["used"] and v["status"] == "PENDING")
for k in pend: warns.append("PENDING en uso: %s (%d series en catalogo) — %s" % (k, per_src.get(k, 0), S[k]["licenseName"][:70]))
cnt = {}
for v in S.values(): cnt[v["status"]] = cnt.get(v["status"], 0) + 1
for e in errs: print("ERROR  ", e)
for w in warns: print("AVISO  ", w)
print("Licencias: %d fuentes %s; %d series de catalogo revisadas; %d PENDING en uso; %d errores" % (len(S), cnt, n_cat, len(pend), len(errs)))
if "--report" in sys.argv:
    tot = sum(per_src.values()) or 1
    for k, n in sorted(per_src.items(), key=lambda x: -x[1]): print("  %-18s %5d series  %-9s %s" % (k, n, S[k]["status"], S[k]["licenseId"]))
sys.exit(1 if errs or (STRICT and pend) else 0)

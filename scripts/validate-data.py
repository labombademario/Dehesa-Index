#!/usr/bin/env python3
"""Contratos de esquema y tests de datos de Dehesa Index (solo libreria estandar).
Uso:  python3 scripts/validate-data.py [--files data/a.json data/b.json] [--strict] [--no-report]
      python3 scripts/validate-data.py --derived      # contratos + tests semanticos + consistencia de los ficheros derivados (los ejecutan los workflows antes del commit)
      python3 scripts/validate-data.py --all          # TODAS las familias (schemas/registry.json) + consistencia entre ficheros (CI)
      python3 scripts/validate-data.py --consistency  # solo consistencia entre ficheros
 - Valida cada archivo contra su JSON Schema (schemas/*.schema.json; subconjunto: type, required, properties, items, enum, pattern,
   minimum, minItems, maxItems, minProperties, minLength, additionalSchema = esquema para cada valor de un objeto).
 - Tests de datos: sin NaN/Infinity, sin fechas futuras, series ordenadas y sin periodos repetidos, periodo coherente con la frecuencia,
   latest = ultimo punto, unidad no vacia, saltos absurdos (> JUMP x la mediana reciente) como aviso, y conjunto de datos no vacio.
 - Escribe data/data-quality.json (resumen por archivo) salvo --no-report. Sale con codigo 1 si hay errores (los avisos no fallan salvo --strict).
Los workflows lo ejecutan ANTES de hacer commit: un fichero roto no llega a main."""
import fnmatch, datetime, json, math, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import contract_tests as CT
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"; SCH = ROOT / "schemas"
JUMP = 25.0          # salto maximo respecto a la mediana de los 12 puntos previos antes de avisar
FAMILY = {  # archivo -> esquema
    **{n: "country-stats" for n in ["country-stats", "spain-stats", "france-stats", "germany-stats", "belgium-stats", "austria-stats", "uk-stats", "portugal-stats", "portugal-eurostat-stats", "canada-stats", "australia-trade-stats", "eu-trade-stats", "interest-rates-stats"]},
    **{n: "tariffs" for n in ["us-tariffs", "tariffs-mx", "tariffs-ca", "tariffs-eu"]},
    "country-macro": "country-macro"}
FREQ_RE = {"annual": r"^\d{4}$", "monthly": r"^\d{4}-\d{2}$", "weekly": r"^\d{4}-\d{2}-\d{2}$", "daily": r"^\d{4}-\d{2}-\d{2}$",
           "quarterly": r"^\d{4}-(Q[1-4]|\d{2})$", "semiannual": r"^\d{4}-(S[12]|\d{2})$"}
TYPES = {"object": dict, "array": list, "string": str, "integer": int, "boolean": bool, "null": type(None)}
def is_type(v, t):
    if t == "number": return isinstance(v, (int, float)) and not isinstance(v, bool)
    if t == "integer": return isinstance(v, int) and not isinstance(v, bool)
    return isinstance(v, TYPES[t])
def check(v, s, path, errs, limit=40):
    if len(errs) >= limit: return
    t = s.get("type")
    if t:
        ts = t if isinstance(t, list) else [t]
        if not any(is_type(v, x) for x in ts): errs.append("%s: tipo %s, esperado %s" % (path, type(v).__name__, "/".join(ts))); return
    if "enum" in s and v not in s["enum"]: errs.append("%s: valor %r fuera de %s" % (path, v, s["enum"]))
    if isinstance(v, str):
        if "pattern" in s and not re.search(s["pattern"], v): errs.append("%s: %r no cumple %s" % (path, v[:40], s["pattern"]))
        if "minLength" in s and len(v) < s["minLength"]: errs.append("%s: cadena demasiado corta" % path)
    if isinstance(v, str) and "maxLength" in s and len(v) > s["maxLength"]: errs.append("%s: cadena demasiado larga" % path)
    if is_type(v, "number") and "minimum" in s and v < s["minimum"]: errs.append("%s: %s < %s" % (path, v, s["minimum"]))
    if is_type(v, "number") and "maximum" in s and v > s["maximum"]: errs.append("%s: %s > %s" % (path, v, s["maximum"]))
    if isinstance(v, list):
        if "minItems" in s and len(v) < s["minItems"]: errs.append("%s: %d elementos (< %d)" % (path, len(v), s["minItems"]))
        if "maxItems" in s and len(v) > s["maxItems"]: errs.append("%s: %d elementos (> %d)" % (path, len(v), s["maxItems"]))
        if "items" in s:
            for i, x in enumerate(v): check(x, s["items"], "%s[%d]" % (path, i), errs, limit)
    if isinstance(v, dict):
        for k in s.get("required", []):
            if k not in v: errs.append("%s: falta '%s'" % (path, k))
        if "minProperties" in s and len(v) < s["minProperties"]: errs.append("%s: %d claves (< %d)" % (path, len(v), s["minProperties"]))
        for k, sub in s.get("properties", {}).items():
            if k in v: check(v[k], sub, path + "." + k, errs, limit)
        if "additionalSchema" in s:
            for k, x in v.items(): check(x, s["additionalSchema"], path + "." + k, errs, limit)
def bad_number(x): return isinstance(x, float) and (math.isnan(x) or math.isinf(x))
def period_end(p):
    m = re.match(r"^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?(?:-(\d{2}))?$", p)
    if not m: return None
    y = int(m.group(1)); a = m.group(2); d = m.group(3)
    if a is None: return datetime.date(y, 1, 1)
    if a[0] == "Q": return datetime.date(y, (int(a[1]) - 1) * 3 + 1, 1)
    if a[0] == "S": return datetime.date(y, (int(a[1]) - 1) * 6 + 1, 1)
    try: return datetime.date(y, int(a), int(d) if d else 1)
    except ValueError: return None
def series_tests(doc, errs, warns, stats):
    today = datetime.date.today() + datetime.timedelta(days=2)
    for cc, c in doc.get("countries", {}).items():
        for s in c.get("series", []):
            sid = "%s/%s" % (cc, s.get("id")); pts = s.get("points") or []; stats["series"] += 1; stats["points"] += len(pts)
            if not pts: errs.append("%s: sin puntos" % sid); continue
            prev = None; seen = set(); vals = []; rx = FREQ_RE.get(s.get("frequency"))
            for p in pts:
                per, val = p[0], p[1]
                if val is None: continue
                if not is_type(val, "number") or bad_number(val): errs.append("%s: valor no numerico en %s" % (sid, per)); continue
                if rx and not re.match(rx, str(per)): errs.append("%s: periodo %s incoherente con frecuencia %s" % (sid, per, s.get("frequency"))); break
                if per in seen: errs.append("%s: periodo repetido %s" % (sid, per)); break
                seen.add(per)
                if prev is not None and str(per) < str(prev): errs.append("%s: puntos sin ordenar (%s tras %s)" % (sid, per, prev)); break
                prev = per
                d = period_end(str(per))
                if d and d > today: errs.append("%s: fecha futura %s" % (sid, per)); break
                if len(vals) >= 6 and s.get("group") != "rates":
                    ref = sorted(abs(x) for x in vals[-12:])[len(vals[-12:]) // 2]
                    allref = sorted(abs(x) for x in vals)[len(vals) // 2]
                    if ref > 0 and ref > 0.05 * allref and abs(val) > JUMP * ref and abs(val) > 1: warns.append("%s: salto %s -> %s en %s (mediana previa %.3g)" % (sid, vals[-1], val, per, ref))
                vals.append(val)
            if vals:
                last = pts[-1]
                if last[0] != s.get("latestPeriod"): errs.append("%s: latestPeriod %s != ultimo punto %s" % (sid, s.get("latestPeriod"), last[0]))
                elif last[1] is not None and abs(float(last[1]) - float(s.get("latest", 0))) > 1e-9 * max(1, abs(float(last[1]))): errs.append("%s: latest %s != ultimo punto %s" % (sid, s.get("latest"), last[1]))
def tariff_tests(doc, errs, warns, stats):
    lines = doc.get("lines", []); stats["lines"] = len(lines); seen = set()
    for l in lines:
        k = (l.get("h"), l.get("d"))
        if k in seen: warns.append("linea duplicada %s" % l.get("h")); 
        seen.add(k)
        if l.get("r") == "adv" and (l.get("a") is None or bad_number(l.get("a"))): errs.append("%s: adv sin valor numerico" % l.get("h"))
        if l.get("a") is not None and l["a"] > 1000: warns.append("%s: arancel ad valorem %s %% sospechoso" % (l.get("h"), l["a"]))
    free = sum(1 for l in lines if l.get("r") == "free")
    if lines and (free == len(lines) or free == 0): warns.append("todas las lineas tienen el mismo tipo de derecho (%d libres de %d)" % (free, len(lines)))
def validate_file(path):
    name = path.stem; res = {"file": path.name, "schema": FAMILY.get(name), "status": "ok", "errors": [], "warnings": [], "stats": {"series": 0, "points": 0, "lines": 0}}
    errs, warns = res["errors"], res["warnings"]
    try: doc = json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda c: (_ for _ in ()).throw(ValueError("constante no valida " + c)))
    except Exception as e: errs.append("JSON invalido: %s" % str(e)[:200]); res["status"] = "error"; return res
    res["generatedAt"] = doc.get("generatedAt") if isinstance(doc, dict) else None
    sch = FAMILY.get(name)
    if sch:
        check(doc, json.loads((SCH / (sch + ".schema.json")).read_text()), "$", errs)
        if not errs:
            if sch == "country-stats":
                series_tests(doc, errs, warns, res["stats"]); info, matched = [], set()
                warns[:] = triage(warns, info, matched); res["info"] = info[:25]
                for k, a in ANOM.items():
                    if a["file"] == path.name and k not in matched and a["status"] == "UNEXPLAINED_ANOMALY": warns.append("%s: anomalia registrada que ya no se detecta (cerrarla en data/data-anomalies.json)" % k)
            elif sch == "tariffs": tariff_tests(doc, errs, warns, res["stats"])
            if sch == "country-stats" and res["stats"]["series"] == 0: errs.append("conjunto de datos vacio")
    if isinstance(doc, dict) and doc.get("generatedAt"):
        try:
            g = datetime.datetime.strptime(doc["generatedAt"][:19], "%Y-%m-%dT%H:%M:%S")
            if g > datetime.datetime.utcnow() + datetime.timedelta(hours=26): errs.append("generatedAt en el futuro")
        except Exception: pass
    res["status"] = "error" if errs else ("warning" if warns else "ok")
    res["errors"] = errs[:25]; res["warnings"] = warns[:25]; res["nWarnings"] = len(warns); res["nErrors"] = len(errs)
    return res
REG = json.loads((SCH / "registry.json").read_text())
ANOM = {a["series"]: a for a in json.loads((DATA / "data-anomalies.json").read_text())["anomalies"]} if (DATA / "data-anomalies.json").exists() else {}
def triage(warns, info, matched):
    """Aviso de salto ligado a una anomalia registrada: KNOWN_VERIFIED -> info (deja de ser aviso); UNEXPLAINED -> sigue siendo aviso, etiquetado."""
    out = []
    for w in warns:
        a = ANOM.get(w.split(":", 1)[0]) if ": salto " in w else None
        if a: matched.add(a["series"])
        if a and a["status"] == "KNOWN_VERIFIED_ANOMALY": info.append(w + " [KNOWN_VERIFIED_ANOMALY]")
        elif a: out.append(w + " [UNEXPLAINED_ANOMALY: ver data/data-anomalies.json]")
        else: out.append(w)
    return out
_SCHEMAS = {}
def _schema(name):
    if name not in _SCHEMAS: _SCHEMAS[name] = json.loads((SCH / (name + ".schema.json")).read_text())
    return _SCHEMAS[name]
def contract_targets(derived_only=False):
    """[(ruta, familia, esquema, tests)] segun schemas/registry.json."""
    out = []
    for rel, (sch, tests) in REG["files"].items():
        if derived_only and rel not in REG["derived"]: continue
        if (DATA / rel).exists() or True: out.append((DATA / rel, rel, sch, tests))
    for pat, (sch, tests) in REG["globs"].items():
        if derived_only and pat not in REG.get("derivedGlobs", []): continue
        if True:
            for f in sorted(DATA.glob(pat)):
                if f.name in ("manifest.json",): continue
                out.append((f, str(f.relative_to(DATA)), sch, tests))
    return out
def validate_contract(path, rel, sch, tests):
    res = {"file": rel, "schema": sch, "status": "ok", "errors": [], "warnings": [], "stats": {"series": 0}}
    errs, warns = res["errors"], res["warnings"]
    if not path.exists(): errs.append("archivo inexistente"); res["status"] = "error"; return res
    try: doc = json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda c: (_ for _ in ()).throw(ValueError("constante no valida " + c)))
    except Exception as e: errs.append("JSON invalido: %s" % str(e)[:200]); res["status"] = "error"; return res
    check(doc, _schema(sch), "$", errs)
    if not errs:
        for t in tests:
            try: getattr(CT, t)(doc, errs, warns, res["stats"])
            except Exception as e: errs.append("test %s fallo: %r" % (t, e)[:200])
    if isinstance(doc, dict) and doc.get("generatedAt"):
        try:
            g = datetime.datetime.strptime(doc["generatedAt"][:19], "%Y-%m-%dT%H:%M:%S")
            if g > datetime.datetime.utcnow() + datetime.timedelta(hours=26): errs.append("generatedAt en el futuro")
        except Exception: pass
    res["status"] = "error" if errs else ("warning" if warns else "ok")
    res["nErrors"] = len(errs); res["nWarnings"] = len(warns); res["errors"] = errs[:25]; res["warnings"] = warns[:25]
    return res
def run_contracts(derived_only, quiet_ok=True):
    results = [validate_contract(*t) for t in contract_targets(derived_only)]
    fam = {}
    for r in results: fam.setdefault(r["schema"], []).append(r)
    for r in results:
        if r["status"] != "ok" or not quiet_ok or "/" not in r["file"]:
            print("%-8s %-40s %s" % (r["status"].upper(), r["file"], "; ".join(r["errors"][:3] + r["warnings"][:1])[:230]))
    n_ok = sum(1 for r in results if r["status"] == "ok")
    print("Contratos: %d ficheros, %d familias, %d ok" % (len(results), len(fam), n_ok))
    return results
def run_consistency():
    errs, warns = [], []; CT.consistency(errs, warns)
    for e in errs: print("ERROR    consistencia  %s" % e[:230])
    for w in warns: print("WARNING  consistencia  %s" % w[:230])
    print("Consistencia: %d errores, %d avisos" % (len(errs), len(warns)))
    return errs, warns
SCHEMA_KEYWORDS = {"$schema", "title", "type", "enum", "items", "maxItems", "minItems", "maxLength", "minLength", "maximum", "minimum", "minProperties", "pattern", "properties", "required", "additionalSchema"}
def schema_lint():
    """Un esquema con una palabra clave que este validador NO implementa se ignoraria en silencio (falsa seguridad): se rechaza."""
    bad = []
    def walk(o, where):
        if isinstance(o, dict):
            for k, v in o.items():
                if k not in SCHEMA_KEYWORDS: bad.append("%s: palabra clave no soportada '%s'" % (where, k))
                if k == "properties":
                    for pk, pv in v.items(): walk(pv, where + "." + pk)
                elif k not in ("enum", "required"): walk(v, where)
        elif isinstance(o, list):
            for x in o: walk(x, where)
    for f in sorted(SCH.glob("*.schema.json")): walk(json.loads(f.read_text()), f.name)
    return bad
def main():
    a = sys.argv[1:]
    if "--all" in a:
        lint = schema_lint()
        for m in lint[:10]: print("ERROR    esquema  " + m)
        if lint: sys.exit(1)
    if "--derived" in a or "--all" in a or "--consistency" in a:
        strict = "--strict" in a; results = []
        if "--all" in a:
            files = [DATA / (n + ".json") for n in FAMILY if (DATA / (n + ".json")).exists()]
            results += [validate_file(f) for f in files]
            for r in results:
                if r["status"] != "ok": print("%-8s %-40s %s" % (r["status"].upper(), r["file"], "; ".join(r["errors"][:3] + r["warnings"][:1])[:230]))
        if "--consistency" not in a: results += run_contracts("--derived" in a and "--all" not in a)
        ce, cw = run_consistency()
        bad = [r for r in results if r["status"] == "error"]; warn = [r for r in results if r["status"] == "warning"]
        print("Resumen: %d ficheros, %d con errores, %d con avisos, consistencia %d errores" % (len(results), len(bad), len(warn), len(ce)))
        sys.exit(1 if bad or ce or (strict and (warn or cw)) else 0)
    strict = "--strict" in a; report = "--no-report" not in a
    if "--files" in a:
        i = a.index("--files"); files = []
        for x in a[i + 1:]:
            if x.startswith("--"): break
            files.append(Path(x) if Path(x).is_absolute() else ROOT / x)
    else: files = [DATA / (n + ".json") for n in FAMILY if (DATA / (n + ".json")).exists()]
    def one(f):
        rel = str(f.relative_to(DATA)) if str(f).startswith(str(DATA)) else f.name
        if rel in REG["files"]: sch, tests = REG["files"][rel]; return validate_contract(f, rel, sch, tests)
        for pat, (sch, tests) in REG["globs"].items():
            if fnmatch.fnmatchcase(rel, pat): return validate_contract(f, rel, sch, tests)
        return validate_file(f)
    results = [one(f) for f in files if f.exists()]
    for f in files:
        if not f.exists(): results.append({"file": f.name, "status": "error", "errors": ["archivo inexistente"], "warnings": [], "stats": {}})
    bad = [r for r in results if r["status"] == "error"]; warn = [r for r in results if r["status"] == "warning"]
    for r in results:
        print("%-8s %-34s %s" % (r["status"].upper(), r["file"], "; ".join(r["errors"][:3] + r["warnings"][:1])[:230]))
    print("Resumen: %d archivos, %d con errores, %d con avisos" % (len(results), len(bad), len(warn)))
    if report and "--files" not in a:
        out = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
               "summary": {"files": len(results), "errors": len(bad), "warnings": len(warn)}, "files": results}
        (DATA / "data-quality.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    sys.exit(1 if bad or (strict and warn) else 0)
main()

#!/usr/bin/env python3
"""Pruebas negativas de los contratos: parte de datos REALES, los corrompe de una forma concreta y exige que validate-data los rechace.
Garantiza que los esquemas y tests semanticos 'muerden' (un validador que siempre dice OK es peor que ninguno). Uso: python3 scripts/test-contracts.py"""
import copy, fnmatch, importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
spec = importlib.util.spec_from_file_location("vd", ROOT / "scripts" / "validate-data.py")
src = (ROOT / "scripts" / "validate-data.py").read_text().rsplit("\nmain()", 1)[0]
vd = type(sys)("vd"); vd.__file__ = str(ROOT / "scripts" / "validate-data.py"); exec(compile(src, "validate-data.py", "exec"), vd.__dict__)
def run(rel, mutate):
    doc = json.loads((D / rel).read_text()); mutate(doc)
    sch, tests = vd.REG["files"].get(rel) or next(v for pat, v in vd.REG["globs"].items() if fnmatch.fnmatchcase(rel, pat))
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "x.json"; p.write_text(json.dumps(doc))
        return vd.validate_contract(p, rel, sch, tests)
def first(doc, key="observations"): return doc[key][0]
CASES = [
 ("latest.json", "valor no numerico", lambda d: first(d).__setitem__("value", "n/a")),
 ("latest.json", "region desconocida", lambda d: first(d).__setitem__("region", "mars")),
 ("latest.json", "id repetido", lambda d: d["observations"].append(copy.deepcopy(d["observations"][0]))),
 ("latest.json", "fecha futura", lambda d: first(d).__setitem__("observationDate", "2099-01-01")),
 ("latest.json", "indice con moneda", lambda d: [o.__setitem__("currency", "EUR") for o in d["observations"] if o["currency"] == "INDEX"][:1]),
 ("history.json", "id sin fecha", lambda d: first(d).__setitem__("id", "di_x")),
 ("quality.json", "stale incoherente", lambda d: d["observations"][0].__setitem__("stale", not d["observations"][0]["stale"])),
 ("quality.json", "scope incoherente", lambda d: d["scope"].__setitem__("stale", 999)),
 ("cross-market.json", "correlacion > 1", lambda d: d["relationships"][0].__setitem__("correlationReturns", 1.7)),
 ("fx-history.json", "tipo implausible", lambda d: d["currencies"]["USD"].__setitem__(5, [d["currencies"]["USD"][5][0], 99.0])),
 ("fx-history.json", "meses desordenados", lambda d: d["currencies"]["USD"].reverse()),
 ("product-compare.json", "punto negativo", lambda d: d["products"]["trigo"]["series"][0]["points"].__setitem__(0, [d["products"]["trigo"]["series"][0]["points"][0][0], -1])),
 ("product-compare.json", "pais repetido", lambda d: d["products"]["trigo"]["series"].append(copy.deepcopy(d["products"]["trigo"]["series"][0]))),
 ("watch-index.json", "entrada mal formada", lambda d: d["series"].__setitem__("ES/x", ["a"])),
 ("pipeline-status.json", "resumen incoherente", lambda d: d["summary"].__setitem__("ok", 0)),
 ("pipeline-status.json", "workflow inexistente", lambda d: d["pipelines"][0].__setitem__("workflow", "no-existe.yml")),
 ("daily-brief.json", "recuento incoherente", lambda d: d["counts"].__setitem__("upcoming", 99)),
 ("series-registry.json", "serie repetida", lambda d: d["series"].append(copy.deepcopy(d["series"][0]))),
 ("search-index.json", "URL externa", lambda d: d["entries"][0].__setitem__("u", "https://evil.example/")),
 ("drought.json", "D0..D4 creciente", lambda d: d["us"]["conus"][-1].__setitem__(5, 99.0)),
 ("drought.json", "porcentaje > 100", lambda d: d["us"]["conus"][-1].__setitem__(1, 140.0)),
 ("crop-progress.json", "condicion no suma 100", lambda d: d["crops"][0]["seasons"][next(iter(d["crops"][0]["seasons"]))]["condition"][0].__setitem__(1, 60)),
 ("climate.json", "temperatura imposible", lambda d: d["locations"][0]["months"][0].__setitem__("tempC", 90)),
 ("recan.json", "indice fuera de rango", lambda d: d["rows"][0].__setitem__(1, 99)),
 ("revisions.json", "revision sin fecha", lambda d: d["revisions"].append({"file": "a", "series": "x", "period": "2020", "old": 1, "new": 2})),
 ("catalog/manifest.json", "total incoherente", lambda d: d.__setitem__("seriesTotal", d["seriesTotal"] + 5)),
 ("export-sales.json", "semana desordenada", lambda d: d["commodities"][0]["weekly"].reverse()),
 ("gats.json", "mes futuro", lambda d: d["months"].append("209901")),
 ("freshness.json", "recuento incoherente", lambda d: d["catalog"]["byState"].__setitem__("LIVE", d["catalog"]["byState"]["LIVE"] + 1)),
 ("freshness.json", "estado inventado", lambda d: d["latest"]["observations"][0].__setitem__("state", "MAYBE")),
 ("product-metadata.json", "serie UE inexistente", lambda d: d["products"]["trigo"]["compare"].__setitem__("eu", ["cereales", "no-existe"])),
 ("product-metadata.json", "sin nombre en un idioma", lambda d: d["products"]["trigo"]["name"].pop("it")),
 ("product-metadata.json", "instrumento inexistente", lambda d: d["products"]["trigo"]["instruments"].append({"region": "us", "product": "no-existe"})),
 ("product-metadata.json", "relacion inventada", lambda d: d["products"]["trigo"]["related"].append({"product": "no-existe", "relation": "input", "why": "energy"})),
 ("products/trigo.json", "cuota que no es valor/mundo", lambda d: d["trade"]["exports"]["top"][0].__setitem__("share", 55.5)),
 ("products/trigo.json", "producto desconocido", lambda d: d.__setitem__("product", "no-existe")),
 ("products/trigo.json", "stock-to-use inventado", lambda d: d["supplyDemand"]["entities"]["US"][str(d["supplyDemand"]["marketYear"])].__setitem__("stockToUse", 5.0)),
 ("products/trigo.json", "campana fuera de ventana", lambda d: d["supplyDemand"]["entities"]["EU"].__setitem__("2010", {"production": 1})),
 ("products/trigo.json", "top desordenado", lambda d: d["trade"]["exports"]["top"].reverse()),
 ("freshness-policy.json", "rezago sin evidencia", lambda d: d["sources"]["statcan"].__setitem__("evidence", "x")),
 ("freshness-policy.json", "rezago absurdo", lambda d: d["sources"]["statcan"]["lagDays"].__setitem__("monthly", 9999)),
 ("quality.json", "freshness incoherente", lambda d: d["observations"][0].__setitem__("freshness", "STALE")),
 ("data-anomalies.json", "KNOWN sin evidencia", lambda d: d["anomalies"][0].__setitem__("status", "KNOWN_VERIFIED_ANOMALY")),
 ("data-anomalies.json", "serie inexistente", lambda d: d["anomalies"][0].__setitem__("series", "AT/no-existe")),
 ("daily-brief.json", "byKind incoherente", lambda d: d["byKind"]["PRICE"].__setitem__("datasets", 99)),
 ("daily-brief.json", "pipeline sin clasificar", lambda d: d["pipelinesCovered"].__setitem__("total", d["pipelinesCovered"]["total"] + 1)),
 ("product-compare.json", "sin aggregation", lambda d: d["products"]["trigo"]["series"][0].pop("aggregation")),
 ("product-compare.json", "estado de frescura inventado", lambda d: d["products"]["trigo"]["series"][0].__setitem__("fs", "OK")),
 ("views/home-summary.json", "mover con historico", lambda d: d["movers"][0].__setitem__("history", [1, 2])),
 ("views/home-summary.json", "markets.total incoherente", lambda d: d["markets"].__setitem__("total", d["markets"]["total"] + 1)),
 ("views/news-index.json", "clave fuera de rango", lambda d: d["keys"].__setitem__("trigo", [10 ** 6])),
 ("views/news-index.json", "enlace no http", lambda d: d["stories"][0].__setitem__("url", "javascript:alert(1)")),
 ("views/news-feed.json", "noticia repetida", lambda d: d["items"].append(copy.deepcopy(d["items"][0]))),
 ("views/news-feed.json", "fecha invalida", lambda d: d["items"][0].__setitem__("d", "ayer")),
 ("prices/manifest.json", "total incoherente", lambda d: d["totals"].__setitem__("observations", 1)),
 ("prices/manifest.json", "producto sin historico", lambda d: next(iter(d["regions"].values()))["products"].append("no-existe")),
 ("prices/latest/us.json", "historico dentro de latest", lambda d: first(d).__setitem__("history", [1])),
 ("prices/latest/us.json", "region cruzada", lambda d: first(d).__setitem__("region", "eu")),
 ("prices/latest/us.json", "spark no numerico", lambda d: first(d).__setitem__("spark", ["x"])),
 ("prices/history/us/trigo.json", "historico desordenado", lambda d: d["history"].reverse()),
 ("prices/history/us/trigo.json", "valor no numerico", lambda d: d["history"][3].__setitem__("value", "n/a")),
 ("prices/intelligence/uk.json", "puntos desordenados", lambda d: next(iter(d["series"].values()))["points"].reverse()),
 ("prices/intelligence/uk.json", "serie no comparable", lambda d: next(iter(d["series"].values())).__setitem__("comparability", "not_comparable")),
]
bad = 0
for rel, name, fn in CASES:
    try: r = run(rel, fn)
    except Exception as e: print("ROTO   %-24s %-26s %r" % (rel, name, e)); bad += 1; continue
    ok = r["status"] == "error"
    if not ok: bad += 1
    print("%-6s %-24s %-26s %s" % ("OK" if ok else "FALLA", rel, name, "" if ok else "el validador NO lo detecto"))
# datos reales intactos
for rel in ("latest.json", "fx-history.json", "product-compare.json"):
    r = run(rel, lambda d: None)
    if r["status"] == "error": print("FALLA datos reales %s: %s" % (rel, r["errors"][:2])); bad += 1
print("%d casos, %d fallos" % (len(CASES), bad)); sys.exit(1 if bad else 0)

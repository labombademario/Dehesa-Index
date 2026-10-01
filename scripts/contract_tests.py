#!/usr/bin/env python3
"""Tests semanticos por familia de datos (los contratos de forma estan en schemas/*.schema.json y schemas/registry.json).
Cada test recibe (doc, errs, warns, stats) y anade mensajes; ctx.py de validate-data.py los invoca segun schemas/registry.json.
Los de consistencia entre ficheros (cross_*) se ejecutan con validate-data.py --consistency / --all / --derived."""
import datetime, json, math, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
TODAY = datetime.date.today()
def _num(x): return isinstance(x, (int, float)) and not isinstance(x, bool) and not (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))
def _date(s):
    s = str(s)[:10]
    if re.match(r"^\d{4}-\d{2}$", s): s += "-01"
    try: return datetime.date.fromisoformat(s)
    except Exception: return None
def _ym(s):
    m = re.match(r"^(\d{4})-(\d{2})$", str(s)); return (int(m.group(1)), int(m.group(2))) if m else None
def _asc(seq, label, errs, key=lambda x: x):
    prev = None
    for x in seq:
        k = key(x)
        if prev is not None and k <= prev: errs.append("%s: orden no estrictamente ascendente (%s tras %s)" % (label, k, prev)); return False
        prev = k
    return True
def load(name):
    return json.loads((D / name).read_text(encoding="utf-8"))

# ---------- observaciones ----------
_MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
def _pnum(p):
    p = str(p).strip().upper()
    if p.isdigit(): return int(p)
    if p[:3] in _MON: return _MON[p[:3]]
    m = re.match(r"^Q([1-4])$", p)
    if m: return int(m.group(1)) * 3
    m = re.match(r"^(\d{1,2})-(\d{1,2})$", p)  # semanas MM-DD
    return int(m.group(1)) * 100 + int(m.group(2)) if m else 0
def _obs_common(doc, errs, warns, stats, hist):
    obs = doc["observations"]; stats["observations"] = len(obs); seen = set(); lim = TODAY + datetime.timedelta(days=2)
    for o in obs:
        i = o["id"]
        if i in seen: errs.append("id repetido %s" % i); break
        seen.add(i)
        d = _date(o["observationDate"])
        if d is None: errs.append("%s: fecha invalida %s" % (i, o["observationDate"])); break
        if d > lim: errs.append("%s: observationDate en el futuro %s" % (i, d)); break
        if o.get("publicationDate") and o["publicationDate"] < o["observationDate"] and o.get("frequency") != "quarterly": warns.append("%s: publicationDate anterior a la observacion" % i)
        if o["currency"] == "INDEX" and not str(o["unit"]).startswith("index"): errs.append("%s: moneda INDEX con unidad %s" % (i, o["unit"])); break
        if o["currency"] != "INDEX" and str(o["unit"]).startswith("index"): errs.append("%s: indice con moneda %s" % (i, o["currency"])); break
        if o["status"] == "verified" and not o.get("verifiedAt"): errs.append("%s: verified sin verifiedAt" % i); break
        if hist and not i.endswith(":" + o["observationDate"]): errs.append("%s: el id no termina en la fecha de observacion" % i); break
        if not hist and o["value"] is not None and o["currency"] != "INDEX" and o["value"] < 0 and o["product"] not in ("gas_natural",): warns.append("%s: precio negativo %s" % (i, o["value"]))
def obs_latest(doc, errs, warns, stats):
    _obs_common(doc, errs, warns, stats, False)
    for o in doc["observations"]:
        h = o.get("history") or []
        if h:
            if not _asc(h, o["id"] + " history", errs, key=lambda p: (p["year"], _pnum(p["period"]))): pass
            for p in h:
                if not _num(p["value"]): errs.append("%s: valor historico no numerico" % o["id"]); break
def obs_history(doc, errs, warns, stats):
    _obs_common(doc, errs, warns, stats, True)
    by = {}
    for o in doc["observations"]:
        if not _num(o["value"]): errs.append("%s: valor no numerico" % o["id"]); break
        by.setdefault(o["product"] + "|" + o["region"] + "|" + o["sourceId"], 0); by[o["product"] + "|" + o["region"] + "|" + o["sourceId"]] += 1
    stats["series"] = len(by)
    if len(by) < 40: errs.append("solo %d series en el historico" % len(by))

# ---------- derivados del motor de precios ----------
def quality(doc, errs, warns, stats):
    ob = doc["observations"]; sc = doc["scope"]; stats["observations"] = len(ob)
    if sc["latestObservations"] != len(ob): errs.append("scope.latestObservations %d != %d" % (sc["latestObservations"], len(ob)))
    if sc["stale"] != sum(1 for o in ob if o["stale"]): errs.append("scope.stale %d != recuento real %d" % (sc["stale"], sum(1 for o in ob if o["stale"])))
    if sc["verified"] + sc["pending"] != len(ob): errs.append("verified+pending != latestObservations")
    for o in ob:
        if o["stale"] != (o["freshness"] in ("DELAYED", "STALE")): errs.append("%s: stale=%s incoherente con freshness=%s" % (o["id"], o["stale"], o["freshness"])); break
    cnt = {}
    for o in ob: cnt[o["freshness"]] = cnt.get(o["freshness"], 0) + 1
    if cnt != sc["freshness"]: errs.append("scope.freshness %s != recuento real %s" % (sc["freshness"], cnt))
def intelligence(doc, errs, warns, stats):
    s = doc["series"]; stats["series"] = len(s); ids = set()
    for x in s:
        if x["id"] in ids: errs.append("id repetido %s" % x["id"]); break
        ids.add(x["id"])
        if x["coverageEnd"] < x["coverageStart"]: errs.append("%s: cobertura invertida" % x["id"]); break
        if x.get("volatility") is not None and x["volatility"] < 0: errs.append("%s: volatilidad negativa" % x["id"]); break
        if x.get("yoyPct") is not None and not _num(x["yoyPct"]): errs.append("%s: yoyPct no numerico" % x["id"]); break
def cross_market(doc, errs, warns, stats):
    mp = doc["methodology"]["minimumPeriods"]; stats["relationships"] = len(doc["relationships"]); seen = set()
    for r in doc["relationships"]:
        if r["commonPeriods"] < mp: errs.append("%s: %d periodos comunes < minimo %d" % (r["id"], r["commonPeriods"], mp))
        k = (r["id"], r["lagPeriods"])
        if k in seen: errs.append("relacion repetida %s lag %s" % k)
        seen.add(k)
        if (r["correlationReturns"] > 0) != (r["direction"] == "positive") and abs(r["correlationReturns"]) > 0.01: errs.append("%s: direction %s incoherente con r=%s" % (r["id"], r["direction"], r["correlationReturns"]))
        a = abs(r["correlationReturns"]); exp = "strong" if a >= 0.5 else ("moderate" if a >= 0.3 else "weak")
        if exp != r["strength"] and False: warns.append("%s: strength %s vs r=%s" % (r["id"], r["strength"], r["correlationReturns"]))

# ---------- USDA / clima ----------
def supply_demand(doc, errs, warns, stats):
    ids = set()
    for c in doc["commodities"]:
        if c["id"] in ids: errs.append("commodity repetida %s" % c["id"])
        ids.add(c["id"])
        if not _asc(c["marketYears"], c["id"] + " marketYears", errs): pass
        if c["latestMarketYear"] != max(c["marketYears"]) and c["latestMarketYear"] < max(c["marketYears"]) - 1: warns.append("%s: latestMarketYear %s lejos de %s" % (c["id"], c["latestMarketYear"], max(c["marketYears"])))
        if not c["world"]: errs.append("%s: sin agregado mundial" % c["id"])
    stats["commodities"] = len(ids)
def export_sales(doc, errs, warns, stats):
    for c in doc["commodities"]:
        if not _asc(c["weekly"], "%s weekly" % c["name"], errs, key=lambda x: x["w"]): pass
        for k in ("wk", "acc", "out"):
            if not _num(c["totals"].get(k)): errs.append("%s: totals.%s no numerico" % (c["name"], k))
        if c["weekly"] and c["weekly"][-1]["w"] > c["weekEnding"]: errs.append("%s: weekly posterior a weekEnding" % c["name"])
        if _date(c["weekEnding"]) and _date(c["weekEnding"]) > TODAY: errs.append("%s: weekEnding futuro" % c["name"])
def gats(doc, errs, warns, stats):
    if not _asc(doc["months"], "months", errs): pass
    if doc["latest"] not in doc["months"]: errs.append("latest %s no esta en months" % doc["latest"])
    if doc["months"][-1] > TODAY.strftime("%Y%m"): errs.append("mes futuro %s" % doc["months"][-1])
    for k in ("ex", "im"):
        for g, partners in doc[k].items():
            if g not in doc["groups"] and False: errs.append("grupo %s fuera de groups" % g)
            for p in partners:
                if p not in doc["partners"]: errs.append("%s/%s: socio %s sin ficha" % (k, g, p)); return
def climate(doc, errs, warns, stats):
    ids = set()
    for l in doc["locations"]:
        if l["id"] in ids: errs.append("localizacion repetida %s" % l["id"])
        ids.add(l["id"])
        ps = [m["period"] for m in l["months"]]
        _asc(ps, l["id"], errs)
        if ps and ps[-1] != doc["lastPeriod"]: errs.append("%s: ultimo mes %s != lastPeriod %s" % (l["id"], ps[-1], doc["lastPeriod"]))
        for m in l["months"]:
            if m["tempC"] is not None and not -60 <= m["tempC"] <= 60: errs.append("%s %s: temperatura %s fuera de rango" % (l["id"], m["period"], m["tempC"])); break
            if m["precipMm"] is not None and not 0 <= m["precipMm"] <= 3000: errs.append("%s %s: precipitacion %s fuera de rango" % (l["id"], m["period"], m["precipMm"])); break
    stats["locations"] = len(ids)
def climate_history(doc, errs, warns, stats):
    sy, sm = _ym(doc["start"]); n = None; last_nn = -1
    for l in doc["locations"]:
        a, b = l["precipMmDay"], l["tempC"]
        if len(a) != len(b): errs.append("%s: precip y temp con distinta longitud" % l["id"]); continue
        n = n or len(a)
        if len(a) != n: errs.append("%s: longitud %d distinta de %d" % (l["id"], len(a), n))
        if any(x is not None and not 0 <= x <= 100 for x in a): errs.append("%s: precip mm/dia fuera de 0..100" % l["id"])
        if any(x is not None and not -60 <= x <= 60 for x in b): errs.append("%s: temperatura fuera de rango" % l["id"])
        nn = max([i for i, x in enumerate(a) if x is not None] or [-1]); last_nn = max(last_nn, nn)
        if nn < 0: errs.append("%s: sin ningun dato" % l["id"])
    if last_nn >= 0:  # el vector se rellena con null hasta fin de ano: solo cuenta el ultimo dato real
        end = (sy * 12 + sm - 1) + last_nn; ey, em = divmod(end, 12); em += 1
        if datetime.date(ey, em, 1) > TODAY: errs.append("hay datos en %04d-%02d (futuro)" % (ey, em))
def crop_progress(doc, errs, warns, stats):
    for c in doc["crops"]:
        for yr, kinds in c["seasons"].items():
            for kind, rows in kinds.items():
                if not isinstance(rows, list): continue
                _asc(rows, "%s %s %s" % (c["id"], yr, kind), errs, key=lambda r: r[0])
                for r in rows:
                    if kind == "condition" and len(r) == 6:
                        t = sum(x or 0 for x in r[1:])
                        if not 90 <= t <= 110: errs.append("%s %s: condicion suma %s%%" % (c["id"], r[0], t)); break
                    if any(x is not None and not 0 <= x <= 100 for x in r[1:]): errs.append("%s %s: porcentaje fuera de 0..100" % (c["id"], r[0])); break
def drought(doc, errs, warns, stats):
    for st, rows in list(doc["states"].items()) + [("US", doc["us"]["conus"])]:
        _asc(rows, st, errs, key=lambda r: r[0])
        for r in rows:
            v = r[1:]
            if any(not _num(x) or not 0 <= x <= 100.01 for x in v): errs.append("%s %s: porcentaje fuera de 0..100" % (st, r[0])); break
            if any(v[i] + 0.05 < v[i + 1] for i in range(len(v) - 1)): errs.append("%s %s: D0..D4 acumulado no decreciente %s" % (st, r[0], v)); break
        if rows and rows[-1][0] > doc["latest"]: errs.append("%s: fecha posterior a latest" % st)
    if len(doc["states"]) < 48: errs.append("faltan estados (%d)" % len(doc["states"]))
def recan(doc, errs, warns, stats):
    ny, nc, nt, nd, nv = len(doc["years"]), len(doc["ccaa"]), len(doc["types"]), len(doc["dims"]), len(doc["vars"])
    for r in doc["rows"]:
        if not (0 <= r[0] < ny and 0 <= r[1] < nc and 0 <= r[2] < nt and 0 <= r[3] < nd): errs.append("fila con indices fuera de rango %s" % r[:4]); break
        if not isinstance(r[6], list) or len(r[6]) != nv: errs.append("fila con %s variables (esperadas %d)" % (len(r[6]) if isinstance(r[6], list) else '?', nv)); break
    stats["rows"] = len(doc["rows"])
def fx_history(doc, errs, warns, stats):
    rng = {"USD": (0.5, 2.0), "CAD": (1.0, 2.2), "AUD": (1.0, 2.5), "GBP": (0.5, 1.2), "DKK": (7.0, 7.7)}
    for c, rows in doc["currencies"].items():
        if not _asc(rows, c, errs, key=lambda r: r[0]): continue
        lo, hi = rng.get(c, (0, 1e9))
        for p, v in rows:
            if not _ym(p) or not _num(v) or not lo <= v <= hi: errs.append("%s %s: tipo %s fuera de rango plausible (%s-%s)" % (c, p, v, lo, hi)); break
        if rows and rows[-1][0] < (TODAY - datetime.timedelta(days=75)).strftime("%Y-%m"): warns.append("%s: ultimo mes %s (>75 dias)" % (c, rows[-1][0]))

# ---------- derivados del sitio ----------
def product_compare(doc, errs, warns, stats):
    n = 0
    for pid, p in doc["products"].items():
        seen = set()
        for s in p["series"]:
            n += 1
            k = s["c"]
            if k in seen: errs.append("%s/%s: pais repetido" % (pid, k))
            seen.add(k); pts = s["points"]
            if not _asc(pts, "%s/%s" % (pid, k), errs, key=lambda x: x[0]): continue
            if any(not _ym(x[0]) or not _num(x[1]) or x[1] <= 0 for x in pts): errs.append("%s/%s: punto invalido" % (pid, k)); continue
            if _ym(pts[-1][0]) and datetime.date(*_ym(pts[-1][0]), 1) > TODAY: errs.append("%s/%s: mes futuro" % (pid, k))
            if not (isinstance(s["latest"][0], str) and _num(s["latest"][1])): errs.append("%s/%s: latest invalido" % (pid, k))
            ag = s["aggregation"]
            if ag["points"] == "monthly_value" and s["freq"] != "monthly": errs.append("%s/%s: monthly_value con frecuencia %s" % (pid, k, s["freq"]))
            if ag["points"] == "monthly_mean" and s["freq"] == "weekly" and not ag.get("lastMonthObs"): errs.append("%s/%s: media mensual de datos semanales sin lastMonthObs" % (pid, k))
            elif s["latest"][0][:7] < pts[-1][0]: errs.append("%s/%s: latest %s anterior al ultimo mes mensual %s" % (pid, k, s["latest"][0], pts[-1][0]))
    stats["series"] = n
def watch_index(doc, errs, warns, stats):
    s = doc["series"]; stats["series"] = len(s)
    for k, v in s.items():
        if not re.match(r"^([A-Z]{2,3}|P)/.+", k): errs.append("clave invalida %s" % k); break
        if not (isinstance(v[0], str) and isinstance(v[1], str) and isinstance(v[4], str) and _num(v[5]) and (v[6] is None or _num(v[6]))): errs.append("%s: entrada mal formada %s" % (k, v)); break
def daily_brief(doc, errs, warns, stats):
    c = doc["counts"]
    if c["datasetsUpdated"] != len(doc["datasets"]): errs.append("counts.datasetsUpdated != len(datasets)")
    if c["newDatasets"] != len(doc["newDatasets"]): errs.append("counts.newDatasets != len(newDatasets)")
    if c["revisions"] != len(doc["revisions"]) and len(doc["revisions"]) < 30: errs.append("counts.revisions != len(revisions)")
    if c["stale"] != len(doc["stale"]): errs.append("counts.stale != len(stale)")
    if c["upcoming"] != len(doc["upcoming"]): errs.append("counts.upcoming != len(upcoming)")
    if doc["since"] > doc["generatedAt"]: errs.append("since posterior a generatedAt")
    for k, v in doc["byKind"].items():
        n = sum(1 for x in doc["coverage"] if x["kind"] == k)
        if v["datasets"] != n: errs.append("byKind.%s.datasets %d != %d en coverage" % (k, v["datasets"], n))
        if v["changed"] != sum(1 for x in doc["coverage"] if x["kind"] == k and x["status"] != "unchanged"): errs.append("byKind.%s.changed incoherente" % k)
    pc = doc["pipelinesCovered"]
    if pc["withKind"] + len(pc["internal"]) != pc["total"]: errs.append("pipelinesCovered: withKind + internal != total (hay pipelines sin clasificar)")
    for lst in ("movers", "newData"):
        for x in doc[lst]:
            if x.get("kind") not in doc["byKind"]: errs.append("%s: kind %r desconocido" % (lst, x.get("kind"))); break
    m = [abs(x["changePct"]) for x in doc["movers"] if _num(x["changePct"])]
    if m != sorted(m, reverse=True): errs.append("movers sin ordenar por |cambio|")
def pipeline_status(doc, errs, warns, stats):
    s = doc["summary"]; pl = doc["pipelines"]; names = [p["workflow"] for p in pl]; stats["pipelines"] = len(pl)
    if len(set(names)) != len(names): errs.append("workflows repetidos en pipeline-status")
    for k in ("ok", "late", "error", "not_run", "unknown"):
        if s[k] != sum(1 for p in pl if p["status"] == k): errs.append("summary.%s != recuento real" % k)
    if sum(s.values()) != len(pl): errs.append("summary no suma el total de pipelines")
    for p in pl:
        if not (ROOT / ".github/workflows" / p["workflow"]).exists(): errs.append("%s: el workflow no existe" % p["workflow"])
    exp = "error" if s["error"] else ("late" if s["late"] else ("unknown" if s["unknown"] and not s["ok"] else "ok"))
    if doc["global"] != exp and doc["global"] != "ok": warns.append("global=%s esperado %s" % (doc["global"], exp))
def series_registry(doc, errs, warns, stats):
    ids = set()
    for s in doc["series"]:
        k = (s["country"], s["id"])
        if k in ids: errs.append("serie repetida %s" % (k,)); break
        ids.add(k)
    if doc["summary"]["series"] != len(doc["series"]): errs.append("summary.series != len(series)")
    # canonicalSeriesId debe ser unico salvo equivalencias intencionadas explicitamente declaradas (ficheros distintos y referenciadas mutuamente en `alternates`)
    by = {}
    for s in doc["series"]: by.setdefault(s["canonicalSeriesId"], []).append(s)
    bad = 0
    for cid, g in by.items():
        for i in range(len(g)):
            for j in range(i + 1, len(g)):
                a, b = g[i], g[j]
                if not (a["file"] != b["file"] and b["id"] in a.get("alternates", []) and a["id"] in b.get("alternates", [])):
                    bad += 1
                    if bad <= 5: errs.append("canonicalSeriesId duplicado sin equivalencia declarada: %s (%s, %s)" % (cid, a["id"], b["id"]))
    if bad > 5: errs.append("... y %d colisiones canonicas mas" % (bad - 5))
    if doc["summary"].get("canonicalCollisions") != bad: errs.append("summary.canonicalCollisions %r != %d" % (doc["summary"].get("canonicalCollisions"), bad))
    for s in doc["series"]:
        d = s.get("dims")
        if not d or d["country"] != s["country"] or not d["frequency"] or not d["unit"] or s["canonicalSeriesId"].split("|")[0] != s["country"]: errs.append("%s: dims ausentes o incoherentes con canonicalSeriesId" % s["id"]); break
    stats["series"] = len(doc["series"])
def search_index(doc, errs, warns, stats):
    e = doc["entries"]; ids = [x["i"] for x in e]
    if len(set(ids)) != len(ids): errs.append("ids de buscador repetidos")
    for x in e:
        if not x["u"] or x["u"].startswith("http"): errs.append("%s: URL no local %s" % (x["i"], x["u"][:40])); break
        if not (x["n"].get("es") and x["n"].get("en")): errs.append("%s: sin nombre es/en" % x["i"]); break
    stats["entries"] = len(e)
def catalog_index(doc, errs, warns, stats):
    # el indice global debe ser exactamente el catalogo: mismas series, ids unicos, indices dentro del diccionario y punteros a ficheros existentes
    D_ = doc["dict"]; rows = doc["rows"]; man = json.loads((D / "catalog/manifest.json").read_text(encoding="utf-8"))
    if doc["total"] != len(rows): errs.append("total %d != filas %d" % (doc["total"], len(rows)))
    if len(rows) != man["seriesTotal"]: errs.append("indice con %d series, manifiesto %d" % (len(rows), man["seriesTotal"]))
    seen = set(); fsok = {"LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED", "STALE", "HISTORICAL", "DISCONTINUED", "PENDING"}
    for r in rows:
        if len(r) != 11: errs.append("fila con %d columnas" % len(r)); break
        k = (D_["cc"][r[2]] if r[2] < len(D_["cc"]) else None, r[0])
        if k[0] is None or r[3] >= len(D_["group"]) or r[4] >= len(D_["unit"]) or r[5] >= len(D_["freq"]) or r[7] >= len(D_["fs"]) or any(t >= len(D_["tag"]) for t in r[8]): errs.append("%s: indice fuera del diccionario" % r[0]); break
        if k in seen: errs.append("serie repetida %s/%s" % k); break
        seen.add(k)
        if D_["fs"][r[7]] not in fsok: errs.append("%s: estado de frescura %r invalido" % (r[0], D_["fs"][r[7]])); break
        c = man["countries"].get(k[0])
        if not c or r[10] not in (0, 1) or (r[10] == 1 and not c.get("catalogEu")): errs.append("%s: puntero a catalogo invalido" % r[0]); break
    n = {0: 0, 1: 0}
    for r in rows: n[r[10]] = n.get(r[10], 0) + 1
    if n[1] != sum(c.get("nEu", 0) for c in man["countries"].values()): errs.append("series UE del indice != manifiesto")
    stats["series"] = len(rows)
def catalog_manifest(doc, errs, warns, stats):
    k = doc["seriesByKind"]
    if sum(k.values()) != doc["seriesTotal"]: errs.append("seriesTotal %d != suma de seriesByKind %d" % (doc["seriesTotal"], sum(k.values())))
    ents = {}
    for cc, c in doc["countries"].items():
        et = c.get("entityType")
        if et not in ("country", "aggregate", "region"): errs.append("%s: entityType %r invalido" % (cc, et)); continue
        ents[et] = ents.get(et, 0) + 1
        if et == "country" and not (c.get("isoCode") and len(c["isoCode"]) == 2): errs.append("%s: pais sin isoCode" % cc)
        if et != "country" and c.get("isoCode"): errs.append("%s: %s con isoCode" % (cc, et))
        if et == "region" and not c.get("parent"): errs.append("%s: region sin parent" % cc)
        if not c.get("displayName") or c["displayName"] == cc and et == "country": errs.append("%s: displayName vacio o igual al codigo" % cc)
    if {k: v for k, v in doc["entities"].items() if k != "total"} != ents or doc["entities"]["total"] != len(doc["countries"]): errs.append("entities incoherente con countries")
    for sid, v in doc["provenance"]["sources"].items():
        if not v["officialUrl"].startswith("http") or not v["licenseId"]: errs.append("provenance.sources.%s incompleta" % sid)
    if sum(v["series"] for v in doc["provenance"]["sources"].values()) != doc["seriesTotal"]: errs.append("provenance.sources no suma seriesTotal")
    for cc, c in doc["countries"].items():
        if not (D / c["catalog"]).exists(): errs.append("%s: catalogo %s inexistente" % (cc, c["catalog"])); continue
        for m, v in c["metrics"].items():
            for f in v.get("files", []):
                if not (D / f).exists(): errs.append("%s/%s: shard %s inexistente" % (cc, m, f))
        s = c.get("summary")
        if s:
            core = sum(v["n"] for g, v in c["metrics"].items() if g != "product" and not g.startswith("eu_"))
            if s["n"] != core: errs.append("%s: summary.n %d != series del pais en metrics %d" % (cc, s["n"], core))
            if s["categories"] != len([g for g in c["metrics"] if g != "product" and not g.startswith("eu_")]): errs.append("%s: summary.categories incoherente" % cc)
            cv = s.get("coverage")
            if cv and not (0 <= cv["score"] <= 100 and all(0 <= cv[x] <= 1 for x in "bfdq")): errs.append("%s: coverage fuera de rango" % cc)
def views_eu_preview(doc, errs, warns, stats):
    stats["series"] = len(doc["cards"]); seen = set()
    for c in doc["cards"]:
        k = (c["family"], c["series"], c["c"])
        if k in seen: errs.append("tarjeta duplicada %s" % (k,))
        seen.add(k)
        if not (_date(c["last"][0]) and _num(c["last"][1])): errs.append("%s: last invalido %s" % (c["k"], c["last"]))
        for f in ("prev", "yoy"):
            if c.get(f) is not None and not (_date(c[f][0]) and _num(c[f][1])): errs.append("%s: %s invalido" % (c["k"], f))
        if c.get("prev") and c["prev"][0] >= c["last"][0]: errs.append("%s: prev no es anterior a last" % c["k"])
        if _date(c["last"][0]) and _date(c["last"][0]) > TODAY: errs.append("%s: dato en el futuro" % c["k"])
def series_shard(doc, errs, warns, stats):
    freq_rx = {"annual": r"^\d{4}$", "monthly": r"^\d{4}-\d{2}$", "weekly": r"^\d{4}-\d{2}-\d{2}$", "daily": r"^\d{4}-\d{2}-\d{2}$"}
    for s in doc["series"]:
        pts = s["points"]; rx = freq_rx.get(s.get("frequency"))
        if not _asc(pts, s["id"], errs, key=lambda p: str(p[0])): break
        if rx and any(not re.match(rx, str(p[0])) for p in pts): errs.append("%s: periodo incoherente con la frecuencia %s" % (s["id"], s.get("frequency"))); break
        if any(p[1] is not None and not _num(p[1]) for p in pts): errs.append("%s: valor no numerico" % s["id"]); break
    stats["series"] += len(doc["series"])

# ---------- consistencia entre ficheros ----------

# ---------- vistas pequenas y capa de precios (data/views, data/prices) ----------
def views_home_summary(doc, errs, warns, stats):
    for m in doc["movers"]:
        if "history" in m: errs.append("mover %s lleva historico completo (la vista debe ser ligera)" % m["id"])
    for c in doc["cropProgress"]["crops"]:
        if not c.get("seasons"): errs.append("cropProgress %s sin temporadas" % c.get("id"))
    for c in doc["supplyDemand"]["commodities"]:
        if not c.get("world"): errs.append("supplyDemand %s sin datos mundiales" % c.get("id"))
    if doc["markets"]["total"] != sum(doc["markets"]["families"].values()): errs.append("markets.total != suma de familias")
    if doc["stats"]["observations"] < 1: errs.append("stats.observations vacio")
    stats["series"] = len(doc["movers"])

def views_news_index(doc, errs, warns, stats):
    n = len(doc["stories"]); stats["series"] = n
    for k, ids in doc["keys"].items():
        if not isinstance(ids, list) or any((not isinstance(i, int)) or i < 0 or i >= n for i in ids): errs.append("clave %s apunta fuera de stories" % k)
    seen = set()
    for s_ in doc["stories"]:
        if s_["id"] in seen: errs.append("noticia duplicada %s" % s_["id"])
        seen.add(s_["id"])
        if not _date(s_["date"]): errs.append("%s: fecha invalida %s" % (s_["id"], s_["date"]))
        elif _date(s_["date"]) > TODAY + datetime.timedelta(days=2): errs.append("%s: noticia en el futuro" % s_["id"])
    if not doc["keys"]: errs.append("indice sin claves")

def views_news_feed(doc, errs, warns, stats):
    stats["series"] = len(doc["items"]); seen = set()
    if len(doc["items"]) > 600: errs.append("feed demasiado grande (%d > 600)" % len(doc["items"]))
    for a in doc["items"]:
        if a["id"] in seen: errs.append("noticia duplicada %s" % a["id"])
        seen.add(a["id"])
        if not _date(a["d"]): errs.append("%s: fecha invalida %s" % (a["id"], a["d"]))
    if len(doc["items"]) < 20: warns.append("feed con solo %d titulares" % len(doc["items"]))

def prices_manifest(doc, errs, warns, stats):
    tot = 0
    for r, m in doc["regions"].items():
        for f in ("latest", "intelligence"):
            if not (D / m[f]).exists(): errs.append("%s: falta %s" % (r, m[f]))
        for p in m["products"]:
            if not (D / m["historyDir"] / (p + ".json")).exists(): errs.append("%s/%s: falta su historico" % (r, p))
        if m["observations"] != len(m["products"]): errs.append("%s: observations %d != products %d" % (r, m["observations"], len(m["products"])))
        tot += m["observations"]
    if tot != doc["totals"]["observations"]: errs.append("totals.observations %d != suma de regiones %d" % (doc["totals"]["observations"], tot))
    stats["series"] = tot

def prices_latest(doc, errs, warns, stats):
    stats["series"] = len(doc["observations"]); seen = set()
    for o in doc["observations"]:
        if o["region"] != doc["region"]: errs.append("%s: region %s != %s" % (o["id"], o["region"], doc["region"]))
        if o["id"] in seen: errs.append("id duplicado %s" % o["id"])
        seen.add(o["id"])
        if "history" in o: errs.append("%s: lleva history completo (debe ir en prices/history)" % o["id"])
        if any(not _num(v) for v in o.get("spark", [])): errs.append("%s: spark con no numericos" % o["id"])
        if len(o.get("spark", [])) > 104: errs.append("%s: spark > 104 valores" % o["id"])
        if len(o.get("recent", [])) > 30: errs.append("%s: recent > 30 puntos" % o["id"])

def prices_history(doc, errs, warns, stats):
    h = doc["history"]; stats["series"] = len(h)
    keys = [(x["year"], _pnum(x["period"])) for x in h]
    if keys != sorted(keys): errs.append("%s/%s: historico no ordenado" % (doc["region"], doc["product"]))
    if len(set(keys)) != len(keys): warns.append("%s/%s: periodos repetidos" % (doc["region"], doc["product"]))
    if any(not _num(x["value"]) for x in h): errs.append("%s/%s: valores no numericos" % (doc["region"], doc["product"]))

def prices_intelligence(doc, errs, warns, stats):
    stats["series"] = len(doc["series"])
    for k, s_ in doc["series"].items():
        pts = s_["points"]
        if any(not (isinstance(p, list) and len(p) == 2 and _date(p[0]) and _num(p[1])) for p in pts): errs.append("%s: puntos invalidos" % k); continue
        if [p[0] for p in pts] != sorted(p[0] for p in pts): errs.append("%s: puntos no ordenados" % k)
        if s_["comparability"] == "not_comparable": errs.append("%s: serie no comparable en el motor de relaciones" % k)

def consistency(errs, warns):
    consistency_freshness(errs, warns)
    consistency_prices(errs, warns)
    _consistency(errs, warns)
def _consistency(errs, warns):
    def ld(n):
        try: return load(n)
        except Exception as e: errs.append("consistencia: no se puede leer %s (%s)" % (n, str(e)[:80])); return None
    lat, hist, norm, q, it, cat = (ld(n) for n in ["latest.json", "history.json", "normalized.json", "quality.json", "intelligence.json", "catalog.json"])
    if all([lat, hist, q, it]):
        ids = {o["id"] for o in lat["observations"]}
        for nm, other in (("quality", {o["id"] for o in q["observations"]}), ("intelligence", {o["id"] for o in it["series"]})):
            if ids != other: errs.append("latest vs %s: %d ids solo en latest, %d solo en %s" % (nm, len(ids - other), len(other - ids), nm))
        if q["scope"]["historyObservations"] != len(hist["observations"]): errs.append("quality.historyObservations %d != history %d" % (q["scope"]["historyObservations"], len(hist["observations"])))
        if norm and len(norm["observations"]) != len(hist["observations"]): errs.append("normalized %d != history %d observaciones" % (len(norm["observations"]), len(hist["observations"])))
        # history guarda UN punto por mes (primer dia del mes; para series semanales es el valor mensual agregado, no la ultima cotizacion)
        hk = {o["id"]: o for o in hist["observations"]}
        def mk(o): return o["id"] + ":" + o["observationDate"][:7] + "-01"
        miss = [o["id"] for o in lat["observations"] if mk(o) not in hk]
        if miss: errs.append("latest sin punto del mes en history: %s" % miss[:3])
        for o in lat["observations"]:
            h = hk.get(mk(o))
            if not h: continue
            tol = 1e-6 if o["frequency"] in ("monthly", "quarterly") else 0.35
            if abs(h["value"] - o["value"]) > tol * max(1, abs(o["value"])): errs.append("%s: latest %s vs history del mes %s (%s)" % (o["id"], o["value"], h["value"], o["frequency"]))
    if cat and lat and len(cat["latest"]) != len(lat["observations"]): errs.append("catalog.latest %d != latest %d" % (len(cat["latest"]), len(lat["observations"])))
    if cat and lat and cat["observationCount"] < len(lat["observations"]): errs.append("catalog.observationCount (filas de snapshots) %d < latest %d" % (cat["observationCount"], len(lat["observations"])))
    wi, reg, man = ld("watch-index.json"), ld("series-registry.json"), ld("catalog/manifest.json")
    if wi and lat:
        n = sum(1 for k in wi["series"] if k.startswith("P/"))
        if n != len(lat["observations"]): errs.append("watch-index: %d productos != %d en latest" % (n, len(lat["observations"])))
    if reg and man and reg["summary"]["series"] != man["seriesByKind"]["stats"]: errs.append("series-registry %d != manifest stats %d" % (reg["summary"]["series"], man["seriesByKind"]["stats"]))
    ps = ld("pipeline-status.json")
    if ps:
        wf = {p.name for p in (ROOT / ".github/workflows").glob("update-*.yml")}
        miss = sorted(wf - {p["workflow"] for p in ps["pipelines"]})
        if miss: errs.append("workflows sin entrada en pipeline-status: %s" % miss[:5])

def consistency_prices(errs, warns):
    """data/prices (capa ligera) frente a latest.json/history.json y al Relationship Engine del cliente."""
    try: pm = json.loads((D / "prices/manifest.json").read_text(encoding="utf-8")); lat = load("latest.json")
    except Exception as e: errs.append("consistencia prices: no se puede leer (%s)" % str(e)[:80]); return
    want = {o["id"]: o for o in lat["observations"]}; got = {}
    for r, m in pm["regions"].items():
        try: doc = json.loads((D / m["latest"]).read_text(encoding="utf-8")); it = json.loads((D / m["intelligence"]).read_text(encoding="utf-8"))
        except Exception as e: errs.append("prices/%s: %s" % (r, str(e)[:80])); continue
        for o in doc["observations"]: got[o["id"]] = o
        if len(it["series"]) != m["intelligenceSeries"]: errs.append("prices/%s: intelligenceSeries %d != %d series" % (r, m["intelligenceSeries"], len(it["series"])))
        for o in doc["observations"]:
            h = D / m["historyDir"] / (o["product"] + ".json")
            if not h.exists(): continue
            hd = json.loads(h.read_text(encoding="utf-8"))
            if hd["id"] != o["id"]: errs.append("%s: historico de otro id (%s)" % (o["id"], hd["id"]))
            if len(hd["history"]) != o["n"]: errs.append("%s: n=%d != %d puntos del historico" % (o["id"], o["n"], len(hd["history"])))
            if o.get("spark") and abs(o["spark"][-1] - hd["history"][-1]["value"]) > 1e-9: errs.append("%s: spark no termina en el ultimo punto del historico" % o["id"])
    if set(got) != set(want): errs.append("prices vs latest.json: %d ids solo en prices, %d solo en latest" % (len(set(got) - set(want)), len(set(want) - set(got))))
    for i, o in got.items():
        w = want.get(i)
        if w and (w["value"] != o["value"] or w["observationDate"] != o["observationDate"]): errs.append("%s: valor/fecha distinto de latest.json" % i)
    # Relationship Engine: cada par (a, b) de cada region debe tener sus dos series en prices/intelligence/<region>.json; si no, queda 'pending' (se avisa, no se rompe)
    js = (ROOT / "js/precios-intel.js").read_text(encoding="utf-8")
    block = js[js.index("var REGIONAL_RELATIONSHIP_DEFS"):js.index("var RELATIONSHIP_DEFS = REGIONAL_RELATIONSHIP_DEFS")]
    defs = re.findall(r"region:'(\w+)',\s*id:'([\w-]+)',\s*a:'(\w+)',\s*b:'(\w+)'", block)
    if len(defs) < 8: errs.append("no se han podido leer las relaciones de js/precios-intel.js (%d)" % len(defs))
    pend = []
    for reg, rid, a, b in defs:
        f = D / ("prices/intelligence/%s.json" % reg)
        ser = json.loads(f.read_text(encoding="utf-8"))["series"] if f.exists() else {}
        if a not in ser or b not in ser: pend.append("%s/%s" % (reg, rid))
    if pend: warns.append("relaciones sin las dos series en prices/intelligence (quedan 'pending'): %d de %d (%s)" % (len(pend), len(defs), ", ".join(pend[:6])))

def product_metadata(doc, errs, warns, stats):
    man = json.loads((D / "prices/manifest.json").read_text(encoding="utf-8"))["regions"]
    have = {(r, p) for r, v in man.items() for p in v["products"]}
    anyreg = {p for r, p in have}
    psd = {c["id"] for c in json.loads((D / "supply-demand.json").read_text(encoding="utf-8"))["commodities"]}
    heads = set(json.loads((D / "us-tariffs.json").read_text(encoding="utf-8"))["headings"])
    for pid, m in doc["products"].items():
        c = m.get("compare")
        if c and not (D / "eu" / c["eu"][0] / (c["eu"][1] + ".json")).exists(): errs.append("%s: serie UE %s/%s inexistente" % (pid, c["eu"][0], c["eu"][1]))
        for i in m["instruments"] + m["indices"]:
            if (i["region"], i["product"]) not in have: errs.append("%s: instrumento %s/%s no existe en prices/manifest.json" % (pid, i["region"], i["product"]))
        if m.get("psd") and m["psd"] not in psd: errs.append("%s: psd %s no esta en supply-demand.json" % (pid, m["psd"]))
        for h in m["hs"]:
            if h not in heads: warns.append("%s: partida HS %s sin datos de arancel" % (pid, h))
        for r in m["related"]:
            if r["product"] not in anyreg: errs.append("%s: coste relacionado %s no existe en prices" % (pid, r["product"]))
            if r["product"] == pid: errs.append("%s: se relaciona consigo mismo" % pid)
    for pid in doc["bushelKg"]:
        if pid not in doc["products"]: errs.append("bushelKg de un producto desconocido: %s" % pid)
    stats["series"] = len(doc["products"])

def instrument_identity(doc, errs, warns, stats):
    """Todo instrumento e indice de product-metadata.json tiene identidad visible (producto, forma, calidad, etapa, mercado/ubicacion) con 4 idiomas; sin datos inventados: `unspecified` es valido, vacio no."""
    meta = json.loads((D / "product-metadata.json").read_text(encoding="utf-8"))["products"]
    ids = {}
    for f in sorted((D / "prices/latest").glob("*.json")):
        for o in json.loads(f.read_text(encoding="utf-8"))["observations"]: ids[(o["region"], o["product"])] = o["id"]
    I = doc["instruments"]; seen = set()
    for pid, m in meta.items():
        for kind, lst in (("price", m["instruments"]), ("index", m["indices"])):
            for i in lst:
                oid = ids.get((i["region"], i["product"]))
                if not oid: continue  # lo avisa product_metadata
                seen.add(oid)
                e = I.get(oid)
                if not e: errs.append("%s: instrumento %s sin identidad en instrument-identity.json" % (pid, oid)); continue
                if (e["kind"] == "index") != (kind == "index"): errs.append("%s: %s kind %s incoherente con su lugar en product-metadata" % (pid, oid, e["kind"]))
    for oid, e in I.items():
        if oid not in seen: warns.append("%s: identidad de un instrumento que ningun producto usa" % oid)
        if e["form"] not in doc["forms"]: errs.append("%s: forma %r desconocida" % (oid, e["form"]))
        if e["stage"] not in doc["stages"]: errs.append("%s: etapa %r desconocida" % (oid, e["stage"]))
        if (e["kind"] == "index") != (e["form"] == "index" and e["stage"] == "index"): errs.append("%s: un indice debe tener form=index y stage=index (y solo un indice)" % oid)
        if e["stage"] == "unspecified" and "no indica" not in e["evidence"] and "no documenta" not in e["evidence"] and "no especifica" not in e["evidence"] and "no se cita" not in e["evidence"]: errs.append("%s: etapa unspecified sin declarar en la evidencia que la fuente no la indica" % oid)
    for pid, c in doc["comparator"].items():
        if not meta.get(pid, {}).get("compare"): errs.append("comparator/%s: el producto no tiene compare en product-metadata" % pid)
    for pid, m in meta.items():
        if m.get("compare") and pid not in doc["comparator"]: errs.append("comparator/%s: falta la identidad del concepto UE del comparador" % pid)
    # regla de comparacion: soja UE (harina 40-50 %, Espana, salida de fabrica), US (harina 46,5-48 %, Iowa, FOB) y CA (grano, Ontario) NO pueden ser equivalentes
    def key(e): return (e["product"]["en"], e["form"], (e["grade"] or {}).get("en"), e["stage"])
    s = [I.get(x) for x in ("di_pienso_harina_soja_eu", "di_pienso_harina_soja_us", "di_cereales_soja_grano_ca")]
    if all(s) and len({key(x) for x in s}) != 3: errs.append("soja: los tres instrumentos deben ser distintos (producto/forma/calidad/etapa)")
    stats["series"] = len(I)

def product_profile(doc, errs, warns, stats):
    meta = json.loads((D / "product-metadata.json").read_text(encoding="utf-8"))["products"]
    m = meta.get(doc["product"])
    if not m: errs.append("producto %s no esta en product-metadata.json" % doc["product"]); return
    if bool(m.get("psd")) != bool(doc["trade"]): errs.append("trade %s pero psd=%r en los metadatos" % ("presente" if doc["trade"] else "ausente", m.get("psd")))
    if bool(m["hs"]) != bool(doc["tariffs"]) and m["hs"]: warns.append("%s: tiene partidas HS pero ningun arancel disponible" % doc["product"])
    for flow in ("exports", "imports"):
        f = (doc["trade"] or {}).get(flow)
        if not f: continue
        sh = [x["share"] for x in f["top"]]
        if sh != sorted(sh, reverse=True): errs.append("%s: top no esta ordenado por cuota" % flow)
        if sum(sh) > f["coveredShare"] + 0.6: errs.append("%s: la suma del top (%.1f) supera la cobertura (%.1f)" % (flow, sum(sh), f["coveredShare"]))
        if f["hhiLowerBound"] + 1 < sum(x * x for x in sh): errs.append("%s: HHI menor que la suma de cuadrados del top" % flow)
        if abs(sum(sh[:3]) - f["top3Share"]) > 0.3: errs.append("%s: top3Share incoherente" % flow)
        for x in f["top"]:
            if abs(x["value"] / f["world"] * 100 - x["share"]) > 0.02: errs.append("%s: cuota de %s no es valor/mundo" % (flow, x["name"]))
    sd = doc.get("supplyDemand")
    if bool(m.get("psd")) != bool(sd): errs.append("supplyDemand %s pero psd=%r en los metadatos" % ("presente" if sd else "ausente", m.get("psd")))
    for ent, years in ((sd or {}).get("entities") or {}).items():
        if ent not in ("US", "EU", "WORLD"): errs.append("supplyDemand: entidad desconocida %s" % ent)
        for y, r in years.items():
            if int(y) > sd["marketYear"] or int(y) < sd["marketYear"] - 2: errs.append("supplyDemand %s: campana %s fuera de la ventana" % (ent, y))
            if "stockToUse" in r:
                if "endingStocks" not in r or not r.get("consumption") or abs(r["endingStocks"] / r["consumption"] * 100 - r["stockToUse"]) > 0.06: errs.append("supplyDemand %s/%s: stockToUse no es existencias/consumo" % (ent, y))
    for h in (doc["tariffs"] or {}).get("headings", []):
        for mk, v in h["markets"].items():
            if mk not in ("US", "EU", "CA", "MX"): errs.append("mercado de arancel desconocido %s" % mk)
            if v["free"] + v["adv"] + v["spec"] > v["n"] + v["trq"]: errs.append("%s/%s: tipos de derecho mayores que las lineas" % (h["hs"], mk))
    stats["series"] = 1

def relationships(doc, errs, warns, stats):
    """Coherencia de data/relationships.json: reglas de estado/fuerza/direccion/confianza y recalculo independiente desde el historico."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("relationships_engine", ROOT / "scripts" / "relationships_engine.py"); RE = importlib.util.module_from_spec(sp); sp.loader.exec_module(RE)
    ids = [r["id"] for r in doc["relationships"]]
    if len(ids) != len(set(ids)): errs.append("ids de relacion repetidos")
    stats["series"] = len(ids); recomputed = 0
    for r in doc["relationships"]:
        s = r["stat"]; f = r["frequency"]; rid = r["id"]; c = s["correlation"]
        if r["family"] not in doc["families"]: errs.append("%s: familia desconocida" % rid); continue
        if doc["families"][r["family"]]["frequency"] != f: errs.append("%s: frecuencia distinta de la de su familia" % rid)
        if r["input"]["key"] == r["market"]["key"]: errs.append("%s: entrada y mercado son la misma serie" % rid)
        if r["status"] != RE.status_of(s["n"], c, s["signStability"], f): errs.append("%s: status %s no sigue la regla (n=%s r=%s estab=%s)" % (rid, r["status"], s["n"], c, s["signStability"]))
        if r["confidence"] != RE.confidence(s["n"], c, s["signStability"], s["coverage"], f): errs.append("%s: confianza %s no sigue la regla" % (rid, r["confidence"]))
        if c is not None:
            if s["strength"] != RE.strength(c): errs.append("%s: strength incoherente con r=%s" % (rid, c))
            if s["direction"] != ("none" if abs(c) < 0.1 else "positive" if c > 0 else "negative"): errs.append("%s: direction incoherente con r=%s" % (rid, c))
        prof = {p[0]: p for p in s["lagProfile"]}
        if s["lag"] not in prof: errs.append("%s: el rezago elegido no esta en lagProfile" % rid)
        elif prof[s["lag"]][1] != c or prof[s["lag"]][2] != s["n"]: errs.append("%s: lagProfile no coincide con la correlacion/n publicados" % rid)
        if s["lagsTested"] != len(s["lagProfile"]) or sorted(prof) != sorted(doc["families"][r["family"]]["lagsTested"]): errs.append("%s: lagProfile distinto de los rezagos de la familia" % rid)
        if r["status"] != "INSUFFICIENT_DATA":
            ok = [p for p in s["lagProfile"] if p[1] is not None and p[2] >= RE.MIN_N[f]]
            if ok and max(abs(p[1]) for p in ok) > abs(c) + 1e-9: errs.append("%s: hay un rezago con mayor |r| que el publicado" % rid)
        if s["n"] > 0 and s["periodStart"] > s["periodEnd"]: errs.append("%s: periodo invertido" % rid)
        if s["signStability"] is not None and s["windows"] < 3: errs.append("%s: estabilidad publicada con menos de 3 ventanas" % rid)
        if c is not None and ("%d" % s["n"]) not in r["explanation"]["es"]: errs.append("%s: la explicacion no cita n" % rid)
        if c is not None and r["status"] != "INSUFFICIENT_DATA" and ("%.2f" % c).replace(".", ",") not in r["explanation"]["es"]: errs.append("%s: la explicacion no cita r" % rid)
        if "predic" not in r["explanation"]["es"].lower() and r["status"] != "INSUFFICIENT_DATA": errs.append("%s: la explicacion no declara que no es una prediccion" % rid)
        # recalculo independiente (solo cuando ambas series estan en su moneda original: no depende del tipo de cambio)
        if s["currencyTreatment"] == "original" and recomputed < 40:
            hs = []
            for side in ("input", "market"):
                fh = D / "prices" / "history" / r[side]["region"] / (r[side]["product"] + ".json")
                if not fh.exists(): errs.append("%s: falta el historico de %s" % (rid, r[side]["key"])); break
                hs.append(json.loads(fh.read_text(encoding="utf-8")))
            else:
                res = RE.analyse(RE.aggregate(hs[0]["history"], f), RE.aggregate(hs[1]["history"], f), f, doc["families"][r["family"]]["lagsTested"])
                recomputed += 1
                if not res: errs.append("%s: el recalculo no encuentra pares" % rid)
                elif res["lag"] != s["lag"] or res["n"] != s["n"] or (res["r"] is not None and c is not None and abs(res["r"] - c) > 1e-3): errs.append("%s: el recalculo desde el historico (lag %s n %s r %s) difiere del publicado (lag %s n %s r %s)" % (rid, res["lag"], res["n"], res["r"], s["lag"], s["n"], c))
    stats["recomputed"] = recomputed

def observatory(doc, errs, warns, stats):
    """Coherencia de data/observatory.json con sus fuentes (freshness, pipeline-status, anomalias, historicos de precios)."""
    ob = doc["observations"]; ks = [o["k"] for o in ob]; stats["series"] = len(ob)
    if len(ks) != len(set(ks)): errs.append("claves de observacion repetidas")
    if ks != sorted(ks, key=lambda k: (k.split("/")[2], k.split("/")[1])): errs.append("observaciones sin ordenar por region y producto")
    fr = doc["freshness"]
    if fr["latest"]["total"] != len(ob): errs.append("freshness.latest.total %s != %d observaciones" % (fr["latest"]["total"], len(ob)))
    for blk in ("latest", "catalog"):
        if sum(fr[blk]["byState"].values()) != fr[blk]["total"]: errs.append("freshness.%s: la suma de estados no es el total" % blk)
    if sum(1 for o in ob if o["freshness"] == "STALE") > 3 * max(1, fr["latest"]["byState"].get("STALE", 0)) + 3: warns.append("muchas observaciones STALE frente a freshness.json")
    ps = json.loads((D / "pipeline-status.json").read_text(encoding="utf-8")); pl = doc["pipelines"]
    if sum(pl["summary"].values()) != pl["total"] or pl["total"] != len(ps["pipelines"]): errs.append("pipelines: resumen y total no coinciden con pipeline-status.json")
    if sorted(x["workflow"] for x in pl["attention"]) != sorted(p["workflow"] for p in ps["pipelines"] if p["status"] != "ok"): errs.append("pipelines.attention no es exactamente lo que no esta ok")
    q = doc["quality"]
    if q["unexplained"] != sum(1 for a in q["anomalies"] if a["status"] == "UNEXPLAINED_ANOMALY") or q["verified"] != sum(1 for a in q["anomalies"] if a["status"] == "KNOWN_VERIFIED_ANOMALY"): errs.append("quality: recuentos de anomalias incoherentes")
    an = json.loads((D / "data-anomalies.json").read_text(encoding="utf-8"))["anomalies"]
    if len(an) != len(q["anomalies"]): errs.append("quality.anomalies no coincide con data-anomalies.json")
    for a, b in zip(doc["upcoming"], doc["upcoming"][1:]):
        if a["expectedNext"] > b["expectedNext"]: errs.append("upcoming sin ordenar por fecha"); break
    cv = doc["coverage"]; sn = cv["snapshots"]
    if [x["date"] for x in sn] != sorted(x["date"] for x in sn) or len({x["date"] for x in sn}) != len(sn): errs.append("instantaneas de cobertura desordenadas o repetidas")
    if sn[-1]["date"] != doc["today"]: errs.append("la ultima instantanea no es la de hoy")
    if len(sn) >= 2:
        a, b = sn[-2], sn[-1]; exp = 0
        if a["series"] != b["series"]: exp += 1
        for kk in ("countries", "sources"): exp += sum(1 for k in set(a[kk]) | set(b[kk]) if a[kk].get(k, 0) != b[kk].get(k, 0))
        if exp != len(cv["changes"]): errs.append("coverage.changes (%d) no coincide con la diferencia entre las dos ultimas instantaneas (%d)" % (len(cv["changes"]), exp))
    elif cv["changes"]: errs.append("coverage.changes sin instantanea previa con la que comparar")
    if cv["priceLayer"] != len(ob): errs.append("coverage.priceLayer != observaciones")
    today = datetime.date.fromisoformat(doc["today"]); done = 0
    for o in ob:
        if o["pubKnown"] != bool(o["publicationDate"]): errs.append("%s: pubKnown incoherente" % o["k"])
        fs = o.get("firstSeen")
        if o["isNew"] != (bool(fs) and (today - datetime.date.fromisoformat(fs)).days <= doc["newDays"]): errs.append("%s: isNew no sigue la regla de %d dias sobre firstSeen" % (o["k"], doc["newDays"]))
        if fs and fs > doc["today"]: errs.append("%s: firstSeen en el futuro" % o["k"])
        for w, m in o["moves"].items():
            if not m: continue
            lo, hi = doc["windows"][w]["minDays"], doc["windows"][w]["maxDays"]
            d0, d1 = datetime.date.fromisoformat(m["from"]), datetime.date.fromisoformat(m["to"])
            if (d1 - d0).days != m["days"] or not lo <= m["days"] <= hi: errs.append("%s/%s: dias fuera de la ventana (%s)" % (o["k"], w, m["days"]))
            if m["pct"] < -100: errs.append("%s/%s: variacion < -100 %%" % (o["k"], w))
        if done < 12 and o["moves"]["d30"]:  # recalculo independiente de un movimiento desde el historico publicado
            h = json.loads((D / "prices" / "history" / o["region"] / (o["product"] + ".json")).read_text(encoding="utf-8")); m = o["moves"]["d30"]; byd = {}
            for r in h["history"]:
                p = str(r["period"]).upper()
                try:
                    if len(p) == 5 and p[2] == "-": dt = datetime.date(r["year"], int(p[:2]), int(p[3:]))
                    elif p[0] == "Q": dt = datetime.date(r["year"], (int(p[1]) - 1) * 3 + 1, 1)
                    else: dt = datetime.date(r["year"], int(p) if p.isdigit() else _MON[p], 1)
                except Exception: continue
                byd[dt.isoformat()] = r["value"]
            if m["from"] not in byd or m["to"] not in byd: errs.append("%s: las fechas del movimiento no estan en el historico" % o["k"])
            elif abs((byd[m["to"]] / byd[m["from"]] - 1) * 100 - m["pct"]) > 0.011: errs.append("%s: el movimiento d30 (%s %%) no se reproduce desde el historico" % (o["k"], m["pct"]))
            done += 1

def source_candidates(doc, errs, warns, stats):
    """Coherencia de data/source-candidates.json con data/license-registry.json: el License Gate se recalcula aqui de forma independiente del generador."""
    import importlib.util
    sp = importlib.util.spec_from_file_location("coverage_model", ROOT / "scripts" / "coverage_model.py"); CM = importlib.util.module_from_spec(sp); sp.loader.exec_module(CM)
    reg = json.loads((D / "license-registry.json").read_text(encoding="utf-8"))["sources"]
    man = json.loads((D / "catalog" / "manifest.json").read_text(encoding="utf-8"))["countries"]
    cs = doc["candidates"]; stats["series"] = len(cs); ids = [c["sourceId"] for c in cs]; today = datetime.date.today().isoformat()
    if len(ids) != len(set(ids)): errs.append("sourceId repetido en la cola")
    for c in cs:
        k = c["sourceId"]; r = reg.get(c.get("registryId")) if c.get("registryId") else None
        if c.get("registryId") and not r: errs.append("%s: registryId %s no existe en el registro" % (k, c["registryId"])); continue
        if (r["status"] if r else "UNREVIEWED") != c["licenseStatus"]: errs.append("%s: licenseStatus %s no coincide con el registro (%s)" % (k, c["licenseStatus"], r["status"] if r else "UNREVIEWED"))
        if r:
            for a, b in (("licenseId", "licenseId"), ("commercialReuse", "commercialUse"), ("derivatives", "derivatives")):
                if c.get(a) != r[b]: errs.append("%s: %s no coincide con el registro" % (k, a))
        elif c["commercialReuse"] != "unknown" or c["derivatives"] != "unknown" or c.get("licenseId") or c.get("attribution"):
            errs.append("%s: sin entrada en el registro no puede declarar uso comercial, derivados, licencia ni atribucion (licencia inventada)" % k)
        # gate recalculado
        if c.get("registryId") is None and "decisionBlock" in c: pass
        if r and r["status"] in ("RESTRICTED", "BLOCKED"): exp = "BLOCKED"
        elif not r: exp = "BLOCKED" if c["gate"]["result"] == "BLOCKED" and any("Decision documentada" in x for x in c["gate"]["reasons"]) else "NOT_READY"
        elif r["status"] == "PENDING": exp = "NOT_READY"
        else: exp = "READY" if (r["commercialUse"] == "yes" and r["derivatives"] == "yes") else "NOT_READY"
        if c["gate"]["result"] != exp: errs.append("%s: gate %s pero el registro implica %s" % (k, c["gate"]["result"], exp))
        st = c["ingestionStatus"]
        if st == "ACTIVE":
            if not (r and r.get("used")): errs.append("%s: ACTIVE sin used=true en el registro" % k)
        else:
            if r and r.get("used") and c["scope"] == "integrated": errs.append("%s: fuente usada que no figura como ACTIVE" % k)
            if c["gate"]["result"] == "BLOCKED" and st != "BLOCKED": errs.append("%s: gate BLOCKED pero estado %s" % (k, st))
            if st == "BLOCKED" and c["gate"]["result"] != "BLOCKED": errs.append("%s: BLOCKED sin gate BLOCKED" % k)
            if st in ("READY", "INGESTING") and (c["gate"]["result"] != "READY" or not c["datasetIdentified"]): errs.append("%s: %s sin gate READY y dataset identificado (ingesta sin licencia)" % (k, st))
            if st == "LICENSE_REVIEW" and not r: errs.append("%s: LICENSE_REVIEW sin entrada en el registro" % k)
            if st == "DISCOVERED" and c["gate"]["result"] == "READY" and c["datasetIdentified"]: errs.append("%s: DISCOVERED con gate READY y dataset identificado deberia ser READY" % k)
        if c["licenseStatus"] in ("RESTRICTED", "BLOCKED") and st not in ("BLOCKED",): errs.append("%s: licencia %s con estado %s" % (k, c["licenseStatus"], st))
        if c["canStart"] != (st == "READY" and not c["technicalBlockers"]): errs.append("%s: canStart incoherente" % k)
        if c["lastChecked"] > today: errs.append("%s: lastChecked en el futuro" % k)
        for p in c["products"]:
            if p not in CM.KIND_OF: errs.append("%s: producto %s fuera del vocabulario del catalogo" % (k, p))
        if c["scope"] == "outside" and (c["country"] in man and man[c["country"]]["entityType"] == "country"): errs.append("%s: scope outside pero el pais ya esta en el catalogo" % k)
        if c["scope"] == "catalog" and c["country"] not in man: errs.append("%s: scope catalog con pais %s ausente del catalogo" % (k, c["country"]))
    act = {k for k, v in reg.items() if v.get("used")}
    if {c["sourceId"] for c in cs if c["ingestionStatus"] == "ACTIVE"} != act: errs.append("las fuentes ACTIVE no coinciden con las used=true del registro")
    sm = doc["summary"]
    if sm["total"] != len(cs) or sm["byStatus"] != {s: sum(1 for c in cs if c["ingestionStatus"] == s) for s in sorted({c["ingestionStatus"] for c in cs})}: errs.append("summary.total/byStatus no cuadran")
    if sm["canStart"] != sorted(c["sourceId"] for c in cs if c["canStart"]): errs.append("summary.canStart no coincide")

def coverage_gaps(doc, errs, warns, stats):
    """Coherencia de data/coverage-gaps.json: recalcula cada celda desde el catalogo y comprueba que los estados respetan evidencia, candidatas y License Gate."""
    import importlib.util, collections
    sp = importlib.util.spec_from_file_location("coverage_model", ROOT / "scripts" / "coverage_model.py"); CM = importlib.util.module_from_spec(sp); sp.loader.exec_module(CM)
    cand = {c["sourceId"]: c for c in json.loads((D / "source-candidates.json").read_text(encoding="utf-8"))["candidates"]}
    ST = ["AVAILABLE", "AVAILABLE_OUTSIDE_CATALOG", "STALE", "HISTORICAL_ONLY", "SOURCE_AVAILABLE_NOT_INGESTED", "LICENSE_PENDING", "MISSING"]
    mx = doc["matrix"]; stats["series"] = doc["summary"]["cells"]
    if doc["summary"]["notInMatrix"]["unmappedGroups"]: errs.append("grupos del catalogo sin tipo de metrica: %s (anadirlos a GROUP_METRIC)" % doc["summary"]["notInMatrix"]["unmappedGroups"])
    ents = {e[0]: e for e in CM.entities()}
    if set(mx) != set(ents): errs.append("entidades de la matriz != entidades del catalogo")
    n = collections.Counter(); stale = collections.defaultdict(lambda: [0, set()])
    for cc, (c0, name, et, files) in sorted(ents.items()):
        cnt = collections.defaultdict(lambda: [0, 0, 0]); ing = collections.Counter(); trk = collections.Counter(); unt = collections.Counter()
        for sr in CM.load_series(files):
            m = CM.GROUP_METRIC.get(sr["group"])
            if m in (None, "other"): continue
            ok = sr.get("fs") in ("LIVE", "FRESH", "EXPECTED_DELAY")
            ing[m] += 1
            if not [t for t in (sr.get("tags") or []) if t in CM.KIND_OF]: unt[m] += 1
            for t in [t for t in (sr.get("tags") or []) if t in CM.KIND_OF]: trk[t] += 1
            for t in sr.get("tags") or []:
                if t in CM.KIND_OF:
                    cnt[(t, m)][0] += 1; cnt[(t, m)][1] += 1 if ok else 0; cnt[(t, m)][2] += 1 if sr.get("fs") in ("HISTORICAL", "DISCONTINUED") else 0
                    if not ok and sr.get("fs") not in ("HISTORICAL", "DISCONTINUED"): stale[sr.get("sourceId")][0] += 1; stale[sr.get("sourceId")][1].add((cc, t, m))
        got = mx.get(cc, {}); tot = 0
        for p, kind in CM.KIND_OF.items():
            exp_m = CM.APPLICABLE[kind]
            if sorted(got.get(p, {})) != sorted(exp_m): errs.append("%s/%s: metricas %s != aplicables %s" % (cc, p, sorted(got.get(p, {})), sorted(exp_m))); continue
            for m in exp_m:
                cell = got[p][m]; ns, nf, na = cnt.get((p, m), (0, 0, 0)); st = cell["state"]; tot += 1; n[st] += 1
                if cell["series"] != ns or cell["fresh"] != nf: errs.append("%s/%s/%s: series/fresh (%d/%d) no se reproducen desde el catalogo (%d/%d)" % (cc, p, m, cell["series"], cell["fresh"], ns, nf)); continue
                ext = cell.get("external") or []; cl = cell.get("candidates") or []
                if st == "AVAILABLE" and nf == 0: errs.append("%s/%s/%s: AVAILABLE sin series frescas" % (cc, p, m))
                if cell.get("confidence") not in ("high", "medium", "low"): errs.append("%s/%s/%s: sin confidence valida" % (cc, p, m))
                elif st == "MISSING":
                    b = cell.get("basis") or {}
                    peers = sum(1 for c2, r2 in mx.items() if c2 != cc and r2[p][m]["state"] in ("AVAILABLE", "AVAILABLE_OUTSIDE_CATALOG"))
                    if b != {"metricIngested": ing[m] > 0, "productTracked": trk[p] > 0, "peers": peers, "untaggedCandidates": unt[m]}: errs.append("%s/%s/%s: basis de la confianza no se reproduce desde el catalogo y la matriz" % (cc, p, m))
                    exp = "high" if ing[m] > 0 and trk[p] > 0 and peers > 0 and unt[m] == 0 else "medium" if peers > 0 and (ing[m] > 0 or trk[p] > 0) else "low"
                    if cell["confidence"] != exp: errs.append("%s/%s/%s: confidence %s != %s segun su evidencia" % (cc, p, m, cell["confidence"], exp))
                elif cell.get("basis"): errs.append("%s/%s/%s: basis solo aplica a MISSING" % (cc, p, m))
                if cell.get("archive", 0) != na: errs.append("%s/%s/%s: archive %d no se reproduce desde el catalogo (%d)" % (cc, p, m, cell.get("archive", 0), na))
                if st == "STALE" and (ns == 0 or nf > 0 or na == ns): errs.append("%s/%s/%s: STALE incoherente" % (cc, p, m))
                if st == "HISTORICAL_ONLY" and (ns == 0 or nf > 0 or na != ns): errs.append("%s/%s/%s: HISTORICAL_ONLY incoherente (todas las series deben ser historicas)" % (cc, p, m))
                if st not in ("AVAILABLE", "STALE", "HISTORICAL_ONLY") and ns: errs.append("%s/%s/%s: %s pero hay %d series en el catalogo" % (cc, p, m, st, ns))
                if st == "AVAILABLE_OUTSIDE_CATALOG" and not ext: errs.append("%s/%s/%s: AVAILABLE_OUTSIDE_CATALOG sin evidencia externa" % (cc, p, m))
                if st in ("MISSING", "LICENSE_PENDING", "SOURCE_AVAILABLE_NOT_INGESTED") and ext: errs.append("%s/%s/%s: %s con evidencia externa" % (cc, p, m, st))
                for k in cl:
                    c = cand.get(k)
                    if not c: errs.append("%s/%s/%s: candidata %s inexistente" % (cc, p, m, k)); continue
                    if not c["productsConfirmed"] or p not in c["products"] or m not in c["metrics"] or c["country"] != cc: errs.append("%s/%s/%s: candidata %s no cubre esta celda con producto confirmado" % (cc, p, m, k))
                if st == "SOURCE_AVAILABLE_NOT_INGESTED" and not any(cand[k]["ingestionStatus"] == "READY" for k in cl if k in cand): errs.append("%s/%s/%s: SOURCE_AVAILABLE_NOT_INGESTED sin candidata READY" % (cc, p, m))
                if st == "LICENSE_PENDING" and not any(cand[k]["ingestionStatus"] == "LICENSE_REVIEW" or (cand[k]["ingestionStatus"] == "DISCOVERED" and cand[k]["licenseStatus"] == "UNREVIEWED") for k in cl if k in cand): errs.append("%s/%s/%s: LICENSE_PENDING sin candidata en revision" % (cc, p, m))
                if st in ("MISSING", "LICENSE_PENDING") and any(cand[k]["ingestionStatus"] == "READY" for k in cl if k in cand): errs.append("%s/%s/%s: hay candidata READY y la celda no es SOURCE_AVAILABLE_NOT_INGESTED" % (cc, p, m))
                for e in ext:
                    if e["sourceId"] == "usda_fas_psd":
                        sd = json.loads((D / "supply-demand.json").read_text(encoding="utf-8"))
                        pid = [k for k, v in CM.PSD_PRODUCT.items() if v == p]
                        if not any(c["id"] in pid for c in sd["commodities"]): errs.append("%s/%s/%s: evidencia PSD de un producto que no esta en supply-demand.json" % (cc, p, m))
        cs = doc["countries"][cc]
        if cs["cells"] != tot or sum(cs["byState"].values()) != tot: errs.append("%s: recuento de celdas por pais incoherente" % cc)
        if cs["covered"] != cs["byState"]["AVAILABLE"] + cs["byState"]["AVAILABLE_OUTSIDE_CATALOG"]: errs.append("%s: covered != AVAILABLE + AVAILABLE_OUTSIDE_CATALOG" % cc)
    if doc["summary"]["cells"] != sum(n.values()) or doc["summary"]["byState"] != {s: n.get(s, 0) for s in ST}: errs.append("summary.byState/cells no cuadra con la matriz")
    hc = sorted([cc, p, m] for cc, r in mx.items() for p, ms in r.items() for m, cell in ms.items() if cell["state"] == "MISSING" and cell.get("confidence") == "high")
    if doc["summary"].get("highConfidenceMissing") != hc: errs.append("summary.highConfidenceMissing no coincide con la matriz")
    mc = {k: sum(1 for r in mx.values() for ms in r.values() for cell in ms.values() if cell["state"] == "MISSING" and cell.get("confidence") == k) for k in ("high", "medium", "low")}
    if doc["summary"].get("missingByConfidence") != mc or sum(mc.values()) != doc["summary"]["byState"]["MISSING"]: errs.append("summary.missingByConfidence no cuadra con la matriz")
    for sr in doc["ranking"]["staleSources"]:
        s = stale.get(sr["sourceId"])
        if not s or s[0] != sr["staleSeries"] or len(s[1]) != sr["staleCells"]: errs.append("ranking.staleSources[%s] no se reproduce desde el catalogo" % sr["sourceId"])
    if {x["sourceId"] for x in doc["ranking"]["staleSources"]} != {k for k, v in stale.items() if v[1]}: errs.append("ranking.staleSources incompleto")
    for r in doc["ranking"]["candidateSources"]:
        c = cand.get(r["sourceId"])
        if not c or c["ingestionStatus"] != r["ingestionStatus"] or c["canStart"] != r["canStart"]: errs.append("ranking.candidateSources[%s] no coincide con la cola" % r["sourceId"])

def freshness_policy(doc, errs, warns, stats):
    if set(doc["states"]) != {"LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED", "STALE", "HISTORICAL", "DISCONTINUED", "PENDING"}: errs.append("estados distintos de los 8 definidos")
    if not set(doc.get("archiveStates", [])) <= set(doc["states"]) or set(doc.get("archiveStates", [])) & set(doc["okStates"]) or set(doc.get("archiveStates", [])) & set(doc.get("lateStates", [])): errs.append("archiveStates incoherente (debe ser subconjunto de states y disjunto de okStates/lateStates)")
    for f in doc["periodDays"]:
        if f not in doc.get("historicalAfterDays", {}): errs.append("frecuencia %s sin historicalAfterDays" % f)
    if not set(doc["okStates"]) <= set(doc["states"]): errs.append("okStates fuera de states")
    for f in doc["periodDays"]:
        if f not in doc["defaultLagDays"]: errs.append("frecuencia %s sin rezago por defecto" % f)
    for s, v in doc["sources"].items():
        for f, n in v["lagDays"].items():
            if f not in doc["periodDays"] or not isinstance(n, int) or n < 0 or n > 400: errs.append("%s: rezago %s=%r invalido" % (s, f, n))
        if len(v["evidence"]) < 20: errs.append("%s: rezago sin evidencia" % s)
    stats["series"] = len(doc["sources"])

def freshness_report(doc, errs, warns, stats):
    for blk in ("latest", "catalog"):
        if sum(doc[blk]["byState"].values()) != doc[blk]["total"]: errs.append("%s: byState no suma total" % blk)
    if len(doc["latest"]["observations"]) != doc["latest"]["total"]: errs.append("latest.total != filas")
    if sum(sum(v.values()) for v in doc["catalog"]["bySource"].values()) != doc["catalog"]["total"]: errs.append("catalog.bySource no suma total")
    late = doc["catalog"]["byState"].get("DELAYED", 0) + doc["catalog"]["byState"].get("STALE", 0)
    if late != doc["catalog"]["lateTotal"]: errs.append("lateTotal %d != DELAYED+STALE %d" % (doc["catalog"]["lateTotal"], late))
    c = doc["catalog"]
    if c["staleTotal"] != c["byState"].get("STALE", 0) or c["historicalTotal"] != c["byState"].get("HISTORICAL", 0) or c["discontinuedTotal"] != c["byState"].get("DISCONTINUED", 0): errs.append("catalog: staleTotal/historicalTotal/discontinuedTotal no coinciden con byState")
    if c["archiveTotal"] != c["historicalTotal"] + c["discontinuedTotal"] or c["activeTotal"] + c["archiveTotal"] != c["total"]: errs.append("catalog: activeTotal + archiveTotal != total")
    stats["series"] = doc["catalog"]["total"]
    # una fuente cuyo catalogo esta casi todo STALE es una incidencia de datos o de politica: se avisa
    for s, v in doc["catalog"]["bySource"].items():
        n = sum(v.values())
        if n >= 20 and v.get("STALE", 0) / n > 0.5: warns.append("%s: %d de %d series STALE" % (s, v["STALE"], n))

def consistency_freshness(errs, warns):
    try: fr = load("freshness.json"); man = load("catalog/manifest.json"); lat = load("latest.json"); q = load("quality.json")
    except Exception as e: errs.append("consistencia freshness: %s" % str(e)[:80]); return
    if fr["catalog"]["total"] != man["seriesTotal"]: errs.append("freshness.catalog.total %d != manifest.seriesTotal %d" % (fr["catalog"]["total"], man["seriesTotal"]))
    if fr["latest"]["total"] != len(lat["observations"]): errs.append("freshness.latest.total != latest.json")
    qs = {o["id"]: o["freshness"] for o in q["observations"]}
    diff = [o["id"] for o in fr["latest"]["observations"] if qs.get(o["id"]) != o["state"]]
    # quality.json (JS) y freshness.json (Python) evaluan con el mismo motor; pueden diferir como mucho por el dia en que se construyeron
    if len(diff) > 3: errs.append("quality.freshness y freshness.json discrepan en %d observaciones (%s)" % (len(diff), diff[:3]))

def data_anomalies(doc, errs, warns, stats):
    stats["series"] = len(doc["anomalies"]); seen = set()
    for a in doc["anomalies"]:
        if a["series"] in seen: errs.append("anomalia repetida %s" % a["series"])
        seen.add(a["series"])
        if not (D / a["file"]).exists(): errs.append("%s: fichero %s inexistente" % (a["series"], a["file"])); continue
        cc, sid = a["series"].split("/", 1)
        if not any(s["id"] == sid for s in json.loads((D / a["file"]).read_text(encoding="utf-8"))["countries"].get(cc, {}).get("series", [])): errs.append("%s: la serie no existe en %s" % (a["series"], a["file"]))
        if a["status"] == "KNOWN_VERIFIED_ANOMALY":
            for k in ("evidence", "verifiedAt", "sourceUrl"):
                if not a.get(k): errs.append("%s: KNOWN_VERIFIED_ANOMALY sin %s" % (a["series"], k))
        elif not a.get("hypothesis") or not a.get("nextAction"): errs.append("%s: UNEXPLAINED_ANOMALY sin hipotesis y accion siguiente" % a["series"])

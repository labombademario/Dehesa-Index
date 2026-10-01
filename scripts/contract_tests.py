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
    stats["series"] = len(doc["series"])
def search_index(doc, errs, warns, stats):
    e = doc["entries"]; ids = [x["i"] for x in e]
    if len(set(ids)) != len(ids): errs.append("ids de buscador repetidos")
    for x in e:
        if not x["u"] or x["u"].startswith("http"): errs.append("%s: URL no local %s" % (x["i"], x["u"][:40])); break
        if not (x["n"].get("es") and x["n"].get("en")): errs.append("%s: sin nombre es/en" % x["i"]); break
    stats["entries"] = len(e)
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
    for pid, m in doc["products"].items():
        c = m.get("compare")
        if c and not (D / "eu" / c["eu"][0] / (c["eu"][1] + ".json")).exists(): errs.append("%s: serie UE %s/%s inexistente" % (pid, c["eu"][0], c["eu"][1]))
    for pid in doc["bushelKg"]:
        if pid not in doc["products"]: errs.append("bushelKg de un producto desconocido: %s" % pid)
    stats["series"] = len(doc["products"])

def freshness_policy(doc, errs, warns, stats):
    if set(doc["states"]) != {"LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED", "STALE", "PENDING"}: errs.append("estados distintos de los 6 definidos")
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

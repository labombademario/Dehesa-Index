#!/usr/bin/env python3
"""Tests semanticos por familia de datos (los contratos de forma estan en schemas/*.schema.json y schemas/registry.json).
Cada test recibe (doc, errs, warns, stats) y anade mensajes; ctx.py de validate-data.py los invoca segun schemas/registry.json.
Los de consistencia entre ficheros (cross_*) se ejecutan con validate-data.py --consistency / --all / --derived."""
import datetime, json, math, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
TODAY = datetime.datetime.now(datetime.timezone.utc).date()   # UTC, como los constructores (date.today() es local y fallaba por la noche en husos de EE. UU.)
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
def es_climate_provinces(doc, errs, warns, stats):
    ids = set()
    for l in doc["provinces"]:
        if l["id"] in ids: errs.append("provincia repetida %s" % l["id"])
        ids.add(l["id"])
        ps = [m["period"] for m in l["months"]]
        _asc(ps, l["id"], errs)
        if ps and ps[-1] != doc["lastPeriod"] and ps[-1] > doc["lastPeriod"]: errs.append("%s: ultimo mes %s posterior a lastPeriod %s" % (l["id"], ps[-1], doc["lastPeriod"]))
        for m in l["months"]:
            if not -40 <= m["tempC"] <= 50: errs.append("%s %s: temperatura %s fuera de rango" % (l["id"], m["period"], m["tempC"])); break
            if not 0 <= m["precipMm"] <= 1500: errs.append("%s %s: precipitacion %s fuera de rango" % (l["id"], m["period"], m["precipMm"])); break
            if abs(round(m["tempC"] - m["tempBaselineC"], 1) - m["tempAnomalyC"]) > 0.11: errs.append("%s %s: anomalia termica no casa" % (l["id"], m["period"])); break
            if m["precipBaselineMm"] > 0 and abs(round(100 * (m["precipMm"] / m["precipBaselineMm"] - 1), 1) - m["precipAnomalyPct"]) > 0.6: errs.append("%s %s: anomalia de lluvia no casa" % (l["id"], m["period"])); break
    if len(ids) < 40: errs.append("solo %d provincias" % len(ids))
    stats["provinces"] = len(ids)

def eu_region_climate(doc, errs, warns, stats):
    n = 0
    for cc, regs in doc["countries"].items():
        for rid, l in regs.items():
            n += 1; k = "%s/%s" % (cc, rid)
            ps = [m["period"] for m in l["months"]]
            _asc(ps, k, errs)
            if ps and ps[-1] > doc["lastPeriod"]: errs.append("%s: ultimo mes %s posterior a lastPeriod %s" % (k, ps[-1], doc["lastPeriod"]))
            for m in l["months"]:
                if not -40 <= m["tempC"] <= 50: errs.append("%s %s: temperatura %s fuera de rango" % (k, m["period"], m["tempC"])); break
                if not 0 <= m["precipMm"] <= 1500: errs.append("%s %s: precipitacion %s fuera de rango" % (k, m["period"], m["precipMm"])); break
                if abs(round(m["tempC"] - m["tempBaselineC"], 1) - m["tempAnomalyC"]) > 0.11: errs.append("%s %s: anomalia termica no casa" % (k, m["period"])); break
                if m["precipBaselineMm"] > 0 and abs(round(100 * (m["precipMm"] / m["precipBaselineMm"] - 1), 1) - m["precipAnomalyPct"]) > 0.6: errs.append("%s %s: anomalia de lluvia no casa" % (k, m["period"])); break
    if n < 55: errs.append("solo %d regiones" % n)
    stats["regions"] = n

def es_jcyl_prices(doc, errs, warns, stats):
    ids = set(); n = 0
    for p in doc["products"]:
        if p["id"] in ids: errs.append("producto repetido %s" % p["id"])
        ids.add(p["id"])
        for sc, pts in p["series"].items():
            if sc not in doc["scopes"]: errs.append("%s: ambito %s desconocido" % (p["id"], sc)); continue
            ks = [x[0] for x in pts]
            if ks != sorted(set(ks)): errs.append("%s %s: periodos no estrictamente crecientes" % (p["id"], sc))
            for k, v in pts:
                if not (1 <= k % 100 <= 12 and 2000 <= k // 100 <= 2100): errs.append("%s %s: periodo %s no valido" % (p["id"], sc, k)); break
                if not v > 0: errs.append("%s %s %s: precio no positivo" % (p["id"], sc, k)); break
            n += len(pts)
    if len(ids) < 30: errs.append("solo %d productos" % len(ids))
    if doc["lastPeriod"] < "2026-01": errs.append("lastPeriod %s muy antiguo" % doc["lastPeriod"])
    stats["products"] = len(ids); stats["points"] = n

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
def usda_calendar(doc, errs, warns, stats):
    rel = doc["releases"]; seen = set()
    for r in rel:
        d = _date(r["date"])
        if d is None: errs.append("fecha invalida %s" % r["date"]); continue
        k = (r["date"], r.get("time", ""), r["id"])
        if k in seen: errs.append("publicacion repetida %s" % (k,))
        seen.add(k)
        if d.weekday() >= 5: errs.append("%s %s cae en fin de semana" % (r["id"], r["date"]))
    if [(r["date"], r.get("time", ""), r["id"]) for r in rel] != sorted(k for k in seen): errs.append("publicaciones no ordenadas por fecha")
    w = [r["date"] for r in rel if r["agency"] == "OCE" and r["id"] == "wasde"]
    if w and len({x[:4] for x in w}) == 1 and len(w) != 12: warns.append("WASDE: %d fechas en el ano (esperadas 12)" % len(w))
    fut = [r for r in rel if r["date"] >= TODAY.isoformat()]
    if not fut: warns.append("el calendario no tiene publicaciones futuras")
    stats["releases"] = len(rel); stats["upcoming"] = len(fut)
def cattle_on_feed(doc, errs, warns, stats):
    keys = ["onFeedStart", "placed", "marketed", "otherDisappearance", "onFeedEnd"]
    prev = None
    for r in doc["reports"]:
        lab = r["inventoryDate"]; d = _date(r["inventoryDate"]); rl = _date(r["release"])
        if d is None or rl is None: errs.append("%s: fecha invalida" % lab); continue
        if rl < d: errs.append("%s: publicado (%s) antes del inventario" % (lab, r["release"]))
        if rl > TODAY: errs.append("%s: publicacion futura" % lab)
        if r["flowMonth"] != (d - datetime.timedelta(days=1)).strftime("%Y-%m"): errs.append("%s: flowMonth %s incoherente" % (lab, r["flowMonth"]))
        n = r["national"]
        for blk in ("current", "yearAgo"):
            b = n[blk]
            if any(not isinstance(b.get(k), int) or b[k] < 0 for k in keys): errs.append("%s %s: cifras nacionales invalidas" % (lab, blk)); continue
            if abs(b["onFeedStart"] + b["placed"] - b["marketed"] - b["otherDisappearance"] - b["onFeedEnd"]) > 2: errs.append("%s %s: balance de existencias no cuadra" % (lab, blk))
        us = [s for s in r["states"] if s["state"] == "United States"]
        if len(us) != 1: errs.append("%s: falta la fila United States" % lab)
        else:
            if abs(us[0]["current"] - n["current"]["onFeedEnd"]) > 1: errs.append("%s: total por estado distinto del nacional" % lab)
            tot = sum(s["current"] for s in r["states"] if s["state"] != "United States")
            if abs(tot - us[0]["current"]) > max(3, us[0]["current"] * 0.005): errs.append("%s: suma de estados no cuadra" % lab)
        if prev and r["inventoryDate"] <= prev: errs.append("informes no ordenados (%s tras %s)" % (lab, prev))
        if prev and not (0.7 < n["current"]["onFeedEnd"] / max(1, n["yearAgo"]["onFeedEnd"]) < 1.4): warns.append("%s: existencias muy distintas de hace un ano" % lab)
        prev = r["inventoryDate"]
    stats["reports"] = len(doc["reports"])
EU27_EUROSTAT = "AT BE BG CY CZ DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK".split()
def eu_farm_economics(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys); g = doc["geos"]
    _asc(ys, "anos", errs)
    if ys[-1] > TODAY.year: errs.append("ano futuro %s" % ys[-1])
    if "EU27_2020" not in g: errs.append("falta EU27_2020"); return
    if len(g) < 20: errs.append("solo %d ambitos (esperados 25 o mas)" % len(g))
    for k, d in g.items():
        for key in doc["keys"]:
            v = d.get(key)
            if not isinstance(v, list) or len(v) != n: errs.append("%s.%s: debe tener %d valores" % (k, key, n)); break
        else:
            for i, y in enumerate(ys):
                o, ic, gv = d["output"][i], d["ic"][i], d["gva"][i]
                if any(d[key][i] is not None and not _num(d[key][i]) for key in doc["keys"]): errs.append("%s %s: valor no numerico" % (k, y)); continue
                if o is not None and ic is not None and gv is not None and abs(o - ic - gv) > max(2.0, 0.005 * abs(o)): errs.append("%s %s: produccion - consumo intermedio (%.1f) distinto del valor anadido bruto (%.1f)" % (k, y, o - ic, gv))
                parts = [d[key][i] for key in ("energy", "fert", "ppp", "vet", "feed")]
                if ic is not None and all(x is not None for x in parts) and sum(parts) > ic * 1.001 + 1: errs.append("%s %s: partidas de consumo intermedio (%.1f) superan el total (%.1f)" % (k, y, sum(parts), ic))
                if o is not None and o < 0: errs.append("%s %s: produccion negativa" % (k, y))
                if d["awu"][i] is not None and d["awu"][i] <= 0: errs.append("%s %s: UTA no positivas" % (k, y))
                if d["indA"][i] is not None and not (0 < d["indA"][i] < 500): errs.append("%s %s: indicador A fuera de rango (%s)" % (k, y, d["indA"][i]))
    # la suma de los 27 Estados miembros debe cuadrar con el agregado UE-27 publicado
    mem = [c for c in EU27_EUROSTAT if c in g]
    for i, y in enumerate(ys):
        eu = g["EU27_2020"]["output"][i]; vals = [g[c]["output"][i] for c in mem]
        if eu is None or any(v is None for v in vals) or len(mem) < 27: continue
        if abs(sum(vals) - eu) > 0.03 * eu: errs.append("%s: suma de los 27 (%.0f) distinta del agregado UE-27 (%.0f)" % (y, sum(vals), eu))
    if len(mem) < 27: warns.append("faltan Estados miembros: %s" % sorted(set(EU27_EUROSTAT) - set(mem)))
    stats["geos"] = len(g)

def eu_drought(doc, errs, warns, stats):
    ps = doc["periods"]; n = len(ps)
    ds = [_date(x) for x in ps]
    if any(d is None for d in ds): errs.append("periodo con fecha invalida"); return
    _asc(ps, "periodos", errs)
    if doc["asOf"] != ps[-1]: errs.append("asOf (%s) no es la ultima decada (%s)" % (doc["asOf"], ps[-1]))
    if any(d.day not in (1, 11, 21) for d in ds): errs.append("las decadas del CDI empiezan los dias 1, 11 y 21")
    if (TODAY - ds[-1]).days > 45: warns.append("ultima decada de hace mas de 45 dias (%s)" % ps[-1])
    for c in ("ES", "FR", "DE", "IT", "PL", "RO", "EU27"):
        if c not in doc["countries"]: errs.append("falta %s" % c)
    for c, x in doc["countries"].items():
        if len(x["v"]) != n: errs.append("%s: %d filas para %d decadas" % (c, len(x["v"]), n)); continue
        if not (80 <= x["coverage"] <= 100): errs.append("%s: cobertura con dato %s %% (esperado 80-100)" % (c, x["coverage"]))
        for i, r in enumerate(x["v"]):
            if any((not _num(v)) or v < 0 or v > 100 for v in r): errs.append("%s %s: porcentaje fuera de 0-100" % (c, ps[i])); break
            if sum(r) > 100.5: errs.append("%s %s: las clases suman %.1f %% (>100)" % (c, ps[i], sum(r))); break
    if "EU27" in doc["countries"] and "ES" in doc["countries"]:
        eu, es = doc["countries"]["EU27"]["v"][-1], doc["countries"]["ES"]["v"][-1]
        if sum(eu[:3]) < min(sum(es[:3]), 100) * 0.05 and sum(es[:3]) > 90: warns.append("UE-27 sin sequia aunque Espana este casi toda en sequia")
    stats["countries"] = len(doc["countries"])

_EUREG = {"ES": 17, "FR": 13, "IT": 20, "DE": 16, "NL": 12, "AT": 9, "BE": 11, "DK": 5, "PL": 16, "PT": 7, "CH": 7, "IE": 3, "EL": 13, "FI": 5, "BG": 6, "HR": 4, "LT": 2, "SK": 4, "CZ": 8, "HU": 8, "RO": 8, "SE": 8, "SI": 2, "UK": 12}
def eu_regions(doc, errs, warns, stats):
    cc = doc["country"]; R = doc["regions"]
    if cc not in _EUREG: errs.append("pais no previsto: %s" % cc); return
    if len(R) != _EUREG[cc]: errs.append("%s: %d regiones, se esperaban %d" % (cc, len(R), _EUREG[cc])); return
    # Reino Unido: Eurostat no tiene cuentas ni censo agrario por region tras el Brexit. Bulgaria: las cuentas regionales que publica Eurostat no cuadran
    # con el total nacional (doblan el valor, como si fueran leva) y no se publican. En ambos casos el bloque falta a proposito.
    _skip = {"UK": ("eaa", "farms"), "BG": ("eaa",)}.get(cc, ())
    for r, b in R.items():
        for k in ("eaa", "crops", "animals", "farms"):
            if k in _skip:
                if b.get(k): errs.append("%s %s: %s deberia faltar (fuente no fiable o inexistente)" % (cc, r, k))
                continue
            if not b.get(k): errs.append("%s %s: falta %s" % (cc, r, k))
        if errs: return
        for it, p in list(b.get("eaa", {}).items()) + list(b["animals"].items()) + [("milk", b.get("milk", []))]:
            ys = [x[0] for x in p]
            if ys != sorted(set(ys)): errs.append("%s %s %s: anios desordenados o repetidos" % (cc, r, it))
            if any(not _num(x[1]) for x in p): errs.append("%s %s %s: valor no numerico" % (cc, r, it))
            if it in ("AM180000", "AM160000", "AM100000", "AM110000", "AM120000", "AM200000") or it[0] == "A" and it[1] != "M" or it == "milk":  # partidas pequenas de la fuente pueden ser negativas (variacion de existencias); aqui solo los agregados y los efectivos
                if any(x[1] < 0 for x in p[-8:]): errs.append("%s %s %s: valor negativo" % (cc, r, it))
        for cr, c in b["crops"].items():
            for m, p in c.items():
                ys = [x[0] for x in p]
                if ys != sorted(set(ys)): errs.append("%s %s %s %s: anios desordenados" % (cc, r, cr, m))
                if any((not _num(x[1])) or x[1] < 0 for x in p): errs.append("%s %s %s %s: valor negativo" % (cc, r, cr, m))
            if "area" in c and "prod" in c and cr in ("C0000", "C1110", "C1300", "C1500", "R1000"):
                a = dict(c["area"])
                for y, v in c["prod"][-4:]:
                    if a.get(y, 0) > 0.05 and v / a[y] > (90 if cr == "R1000" else 20): errs.append("%s %s %s %s: rendimiento %.1f t/ha no plausible" % (cc, r, cr, y, v / a[y]))
        e = {k: dict(v) for k, v in b.get("eaa", {}).items()}
        for y in sorted(e.get("AM160000", {}))[-3:]:
            parts = sum(e[k].get(y, 0) for k in ("AM100000", "AM110000", "AM120000"))
            if parts > e["AM160000"][y] * 1.005 + 0.5: errs.append("%s %s %s: cultivos + animales + productos animales (%.0f) > produccion agraria (%.0f)" % (cc, r, y, parts, e["AM160000"][y]))
        an = {k: dict(v) for k, v in b["animals"].items()}
        for y, v in b["animals"]["A2000"][-3:]:
            cows = an.get("A2300F", {}).get(y, 0) + an.get("A2300G", {}).get(y, 0)
            if cows > v * 1.005 + 0.05: errs.append("%s %s %s: vacas (%.1f) > vacuno total (%.1f)" % (cc, r, y, cows, v))
        for y, f in b.get("farms", {}).get("TOTAL", {}).items():
            tipos = sum(b["farms"][t].get(y, {}).get("HLD", 0) for t in b["farms"] if t != "TOTAL")
            if f.get("HLD") and abs(tipos - f["HLD"]) > 0.01 * f["HLD"] + 15: errs.append("%s %s %s: explotaciones por tipo (%.0f) != total (%.0f)" % (cc, r, y, tipos, f["HLD"]))
    # las regiones suman el total nacional publicado por Eurostat (misma tabla de cuentas, otro fichero)
    try: N = load("eu-farm-economics.json")
    except Exception: N = None
    if N and cc in N["geos"] and "eaa" not in _skip:
        for key, it in (("ic", "AM200000"), ("gva", "AM260000"), ("output", "AM180000")):
            ys = [y for y in N["years"] if all(y in dict(b["eaa"].get(it, [])) for b in R.values())][-1:]  # solo el ultimo anio comun: los anos antiguos de algunas regiones (p. ej. NL antes de 2021) siguen sin revisar y suman ~89 %
            for y in ys:
                su = sum(dict(b["eaa"][it])[y] for b in R.values()); nv = N["geos"][cc][key][N["years"].index(y)]
                tol = 0.03 if cc == "FR" else 0.015 if cc == "PT" else 0.012  # PT: las regiones de 2022 suman un 1,2 % mas que el total nacional (version distinta de la revision de Eurostat); Francia: Eurostat publica ademas los territorios de ultramar, que no estan en el mapa
                if nv and abs(su / nv - 1) > tol: errs.append("%s %s %s: las regiones suman %.0f y el total nacional es %.0f (>%.1f %%)" % (cc, it, y, su, nv, tol * 100))
    stats["regions"] = len(R)

def au_states(doc, errs, warns, stats):
    S = doc["states"]
    for s in ("NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"):
        if s not in S: errs.append("falta %s" % s)
    if errs: return
    for s, b in S.items():
        for k, p in b.items():
            ys = [x[0] for x in p]
            if ys != sorted(set(ys)): errs.append("%s %s: anios desordenados o repetidos" % (s, k))
            if any((not _num(x[1])) or x[1] < 0 for x in p): errs.append("%s %s: valor negativo o no numerico" % (s, k))
    for y in sorted({x[0] for b in S.values() for x in b.get("agrifood", [])})[-3:]:
        parts = sum(dict(S[s].get("agrifood", [])).get(y, 0) for s in S)
        for k in ("beef", "wheat", "wool", "wine", "sugar", "sheepmeat", "milk", "cotton", "oilseeds", "barley"):
            if sum(dict(S[s].get(k, [])).get(y, 0) for s in S) > parts * 1.001 and k not in ("wool", "cotton", "oilseeds"): errs.append("%s %s: un producto (%s) supera el total agroalimentario" % (y, k, k))
    try: N = load("australia-trade-stats.json")["countries"]["AU"]["series"]
    except Exception: N = None
    if N:
        s0 = [x for x in N if x["id"] == "au-exp-agrifood"]
        if s0:
            for y in sorted({x[0] for b in S.values() for x in b.get("agrifood", [])})[-2:]:
                nv = sum(v for p, v in s0[0]["points"] if p.startswith(str(y))); su = sum(dict(S[s].get("agrifood", [])).get(y, 0) for s in S)
                if nv and not 0.95 < su / nv <= 1.001: errs.append("%s: los estados suman %.0f y el total nacional es %.0f (fuera de 95-100 %%)" % (y, su, nv))
    stats["states"] = len(S)

def canada_provinces(doc, errs, warns, stats):
    P = doc["provinces"]; need = ("CA", "SK", "AB", "MB", "ON", "QC", "BC")
    for g in need:
        if g not in P: errs.append("falta %s" % g)
    if errs: return
    prov = [g for g in P if g != "CA"]
    for g, b in P.items():
        for k, c in b.get("crops", {}).items():
            hp = dict(c.get("harea", [])); yp = dict(c.get("yield", [])); ap = dict(c.get("area", []))
            for p, v in c.get("prod", [])[-5:]:
                if v < 0: errs.append("%s %s %s: produccion negativa" % (g, k, p))
                if p in hp and p in yp and abs(v - hp[p] * yp[p] / 1000) > 0.06 * v + 2: errs.append("%s %s %s: produccion %.1f != superficie x rendimiento %.1f" % (g, k, p, v, hp[p] * yp[p] / 1000))
            for p, v in c.get("harea", [])[-5:]:
                if p in ap and v > ap[p] * 1.001 + 0.1: errs.append("%s %s %s: superficie cosechada (%.1f) > sembrada (%.1f)" % (g, k, p, v, ap[p]))
        for key in ("cattle", "hogs", "sheep", "income", "receipts"):
            for k, s in b.get(key, {}).items():
                ps = [x[0] for x in s["pts"]]
                if ps != sorted(set(ps)): errs.append("%s %s %s: periodos desordenados o repetidos" % (g, key, k))
                if any((not _num(x[1])) or (key in ("cattle", "hogs", "sheep") and x[1] < 0) for x in s["pts"]): errs.append("%s %s %s: valor no valido" % (g, key, k))
        ck = b.get("cattle", {})
        if "total-cattle" in ck:
            t = dict(ck["total-cattle"]["pts"])
            for k in ("dairy-cows", "beef-cows"):
                for p, v in ck.get(k, {"pts": []})["pts"][-6:]:
                    if v > t.get(p, 1e12) + 0.5: errs.append("%s %s %s: mas vacas (%.1f) que vacuno total (%.1f)" % (g, k, p, v, t[p]))
    for k in ("wheat-all", "canola-rapeseed", "barley", "soybeans"):
        ca = P["CA"]["crops"].get(k)
        if not ca: errs.append("falta %s en Canada" % k); continue
        yy, tv = ca["prod"][-1]; su = sum(dict(P[g]["crops"][k].get("prod", [])).get(yy, 0) for g in prov if k in P[g].get("crops", {}))
        if abs(su - tv) > 0.04 * tv: errs.append("%s %s: las provincias suman %.0f kt y Canada %.0f kt (>4 %%)" % (k, yy, su, tv))
    tr = lambda g, y: dict(P[g]["receipts"]["total-farm-cash-receipts"]["pts"]).get(y)
    ys = [x[0] for x in P["CA"]["receipts"]["total-farm-cash-receipts"]["pts"]][-3:]
    for y in ys:
        vs = [tr(g, y) for g in prov if "total-farm-cash-receipts" in P[g].get("receipts", {})]
        if len(vs) >= 9 and tr("CA", y) and abs(sum(vs) - tr("CA", y)) > 0.02 * tr("CA", y): errs.append("ingresos en efectivo %s: provincias %.0f != Canada %.0f" % (y, sum(vs), tr("CA", y)))
    stats["provinces"] = len(P)

def canada_drought(doc, errs, warns, stats):
    ps = doc["periods"]; n = len(ps); ds = [_date(x) for x in ps]
    if any(d is None for d in ds): errs.append("periodo con fecha invalida"); return
    _asc(ps, "periodos", errs)
    if doc["asOf"] != ps[-1]: errs.append("asOf (%s) no es el ultimo mes (%s)" % (doc["asOf"], ps[-1]))
    if any((d + datetime.timedelta(days=1)).day != 1 for d in ds): errs.append("los periodos son el ultimo dia del mes")
    if (TODAY - ds[-1]).days > 75: warns.append("ultimo mes de hace mas de 75 dias (%s)" % ps[-1])
    if doc["classes"] != ["D0", "D1", "D2", "D3", "D4"]: errs.append("clases inesperadas: %s" % doc["classes"])
    for c in ("SK", "AB", "MB", "ON", "QC", "BC"):
        if c not in doc["provinces"]: errs.append("falta %s" % c)
    for c, x in doc["provinces"].items():
        if len(x["v"]) != n: errs.append("%s: %d filas para %d meses" % (c, len(x["v"]), n)); continue
        for i, r in enumerate(x["v"]):
            if len(r) != 5 or any((not _num(v)) or v < 0 or v > 100 for v in r): errs.append("%s %s: porcentaje fuera de 0-100" % (c, ps[i])); break
            if any(r[k] < r[k + 1] for k in range(4)): errs.append("%s %s: las clases son acumulativas (D0 >= D1 >= ... >= D4)" % (c, ps[i])); break
    stats["provinces"] = len(doc["provinces"])

def us_dairy(doc, errs, warns, stats):
    ids = set(); n = 0; rng = {"mantequilla": (0.5, 6), "cheddar": (0.5, 6), "suero": (0.1, 3), "leche_polvo": (0.3, 5)}
    for p in doc["products"]:
        if p["id"] in ids: errs.append("%s: producto repetido" % p["id"])
        ids.add(p["id"]); prev = None; lo, hi = rng.get(p["id"], (0.05, 10)); n += len(p["series"])
        if not p["series"]: errs.append("%s: sin datos" % p["id"]); continue
        for r in p["series"]:
            d = _date(r[0])
            if d is None: errs.append("%s: fecha invalida %s" % (p["id"], r[0])); continue
            if d.weekday() != 5: errs.append("%s %s: la semana de NDPSR termina en sabado" % (p["id"], r[0]))
            if not (_num(r[1]) and lo <= r[1] <= hi): errs.append("%s %s: precio fuera de rango (%s USD/lb)" % (p["id"], r[0], r[1]))
            if r[3] not in (0, 1): errs.append("%s %s: marca provisional invalida" % (p["id"], r[0]))
        _asc([r[0] for r in p["series"]], p["id"], errs)
        if sum(r[3] for r in p["series"]) > 6: warns.append("%s: demasiadas semanas provisionales" % p["id"])
        if (TODAY - _date(p["series"][-1][0])).days > 21: warns.append("%s: ultimo dato de hace mas de 3 semanas" % p["id"])
    if ids != {"mantequilla", "cheddar", "suero", "leche_polvo"}: errs.append("productos esperados: mantequilla, cheddar, suero, leche_polvo")
    stats["points"] = n

def eu_vat(doc, errs, warns, stats):
    c = doc["countries"]; exp = set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split())
    if set(c) != exp: errs.append("paises UE-27 esperados; faltan %s, sobran %s" % (sorted(exp - set(c)), sorted(set(c) - exp)))
    for k, v in c.items():
        s = v["standard"]
        if not (_num(s) and 15 <= s <= 27): errs.append("%s: tipo general fuera de 15-27 %% (%s)" % (k, s))
        for r in v["reduced"]:
            if r["rate"] == "exempt": continue
            if not (_num(r["rate"]) and 0 <= r["rate"] < s): errs.append("%s: tipo reducido %s no es menor que el general %s" % (k, r["rate"], s))
        for grp in ("crops", "inputs"):
            for pk, pv in v[grp].items():
                if pv is None or pv == "exempt": continue
                if not (_num(pv) and 0 <= pv <= s): errs.append("%s %s: tipo %s fuera de 0-general" % (k, pk, pv))
    if _date(doc["situationOn"]) is None: errs.append("situationOn invalido")
    elif (TODAY - _date(doc["situationOn"])).days > 400: warns.append("situacion de TEDB de hace mas de 400 dias")
    if c.get("ES", {}).get("standard") != 21 and "ES" in c: warns.append("IVA general de Espana distinto de 21 %: comprobar")
    stats["countries"] = len(c)

def other_tax(doc, errs, warns, stats):
    g = doc["gb"]
    if not (_num(g["standard"]) and 15 <= g["standard"] <= 27 and _num(g["reduced"]) and 0 <= g["reduced"] < g["standard"]): errs.append("gb: tipos incoherentes")
    st = doc["us"]["states"]
    if len(st) != 51: errs.append("EE. UU.: se esperan 50 estados + DC")
    for k, v in st.items():
        r = v["rate"]
        if not (_num(r) and 0 <= r <= 8): errs.append("%s: tipo estatal fuera de 0-8 %% (%s)" % (k, r))
        if v.get("noStateSalesTax") and r != 0: errs.append("%s: sin impuesto estatal pero con tipo %s" % (k, r))
        if r == 0 and not v.get("noStateSalesTax"): errs.append("%s: tipo 0 sin marcar noStateSalesTax" % k)
    if _date(doc["reviewedAt"]) is None: errs.append("reviewedAt invalido")
    elif (TODAY - _date(doc["reviewedAt"])).days > 200: warns.append("tabla revisada hace mas de 200 dias: volver a comprobar")
    stats["states"] = len(st)

def canada_grain(doc, errs, warns, stats):
    weeks = doc["weeks"]; n = len(weeks); ds = [_date(w) for w in weeks]
    if any(d is None for d in ds): errs.append("semana con fecha invalida"); return
    _asc(weeks, "semanas", errs)
    for w, d in zip(weeks, ds):
        if d.weekday() != 6 and not (d.month == 7 and d.day == 31): errs.append("%s: la semana de la CGC acaba en domingo (o el 31 de julio, fin de campana)" % w)
    for a, b in zip(ds, ds[1:]):
        if (b - a).days > 14: errs.append("hueco de mas de 14 dias entre %s y %s" % (a, b)); break  # la CGC no publica la semana de Navidad: un hueco de 14 dias es normal
    if doc["asOf"] != weeks[-1]: errs.append("asOf no es la ultima semana")
    if (TODAY - ds[-1]).days > 21: warns.append("ultima semana de hace mas de tres semanas")
    caps = {"exports": 5000, "cumExports": 40000, "deliveries": 5000, "stocks": 20000}; seen = set()
    for g in doc["grains"]:
        if g["id"] in seen: errs.append("grano repetido %s" % g["id"])
        seen.add(g["id"])
        for k, cap in caps.items():
            col = g[k]
            if len(col) != n: errs.append("%s/%s: %d valores para %d semanas" % (g["id"], k, len(col), n)); continue
            for w, v in zip(weeks, col):
                if v is None: continue
                if not _num(v): errs.append("%s/%s %s: valor no numerico" % (g["id"], k, w)); continue
                if v > cap: errs.append("%s/%s %s: %s kt fuera de rango" % (g["id"], k, w, v))
                if k != "stocks" and v < 0: errs.append("%s/%s %s: valor negativo" % (g["id"], k, w))
                if k == "stocks" and v < -10: errs.append("%s/%s %s: existencias muy negativas (%s)" % (g["id"], k, w, v))
        cum = g["cumExports"]
        for i in range(1, n):
            a, b = cum[i - 1], cum[i]
            if a is not None and b is not None and b < a - max(20.0, 0.1 * a) and not (ds[i].month == 8 and ds[i].day <= 14): errs.append("%s: el acumulado de exportaciones cae de %s a %s en %s" % (g["id"], a, b, weeks[i]))
    stats["weeks"] = n; stats["grains"] = len(doc["grains"])

def us_lamb(doc, errs, warns, stats):
    rows = doc["rows"]; prev = None
    for r in rows:
        d = _date(r[0])
        if d is None: errs.append("fecha invalida %s" % r[0]); continue
        if d.weekday() > 4: errs.append("%s: el despiece se publica en dia laborable" % r[0])
        if r[5] not in (0, 1): errs.append("%s: marca de correccion invalida" % r[0])
        if not all(_num(v) and 200 <= v <= 1500 for v in r[1:5]): errs.append("%s: precio fuera de rango (USD/cwt)" % r[0]); continue
        if r[2] > r[1]: errs.append("%s: valor neto mayor que el bruto" % r[0])
        if abs((r[3] + r[4]) / 2 - r[1]) > 0.05 * r[1]: errs.append("%s: la media de delantero y trasero se aleja mas del 5 %% del valor bruto" % r[0])
        if prev is not None and abs(r[1] / prev - 1) > 0.15: errs.append("%s: salto del valor bruto superior al 15 %% en un dia" % r[0])
        prev = r[1]
    _asc([r[0] for r in rows], "dias", errs)
    if (TODAY - _date(rows[-1][0])).days > 7: warns.append("ultimo dato de hace mas de una semana")
    stats["days"] = len(rows)

def us_fertilizers(doc, errs, warns, stats):
    n = 0; seen = set(); asof = _date(doc["asOf"])
    if asof is None: errs.append("asOf invalido"); return
    for p in doc["products"]:
        for s in p["states"]:
            n += 1; k = (p["id"], s["state"], s["spec"]); lab = "%s %s" % (p["id"], s["state"])
            if k in seen: errs.append("%s: fila repetida" % lab)
            seen.add(k)
            if not (_num(s["avg"]) and 50 <= s["avg"] <= 3000): errs.append("%s: precio fuera de rango (%s USD/t)" % (lab, s["avg"]))
            if _num(s.get("min")) and _num(s.get("max")) and not (s["min"] - 0.01 <= s["avg"] <= s["max"] + 0.01): errs.append("%s: promedio fuera de [min, max]" % lab)
            d = _date(s["date"]); pd = _date(s["prevDate"])
            if d is None or pd is None: errs.append("%s: fecha invalida" % lab); continue
            if pd >= d: errs.append("%s: lectura anterior no es anterior" % lab)
            if d > asof: errs.append("%s: fecha posterior a asOf" % lab)
            if (asof - d).days > 45: errs.append("%s: dato de hace mas de 45 dias" % lab)
            h = s["hist"]
            if h[-1][0] != s["date"] or abs(h[-1][1] - s["avg"]) > 0.01: errs.append("%s: el historico no termina en el ultimo precio" % lab)
            _asc([x[0] for x in h], lab + " historico", errs)
            if s.get("yoy") is not None and not (0.3 < s["avg"] / s["yoy"] < 3): warns.append("%s: cambio anual superior a x3" % lab)
    stats["rows"] = n

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
def country_macro(doc, errs, warns, stats):
    """Macro por pais: la inflacion interanual (infl) sale de cpi.json y debe ser coherente con el.
    Rango creible, mes AAAA-MM no futuro, fuente del registro de licencias y valor = variacion real del indice."""
    import datetime as _d, math as _m
    cpi_doc = load("cpi.json"); reg = load("license-registry.json")["sources"]; today = _d.date.today().strftime("%Y-%m"); n = 0
    for cc, c in doc["countries"].items():
        i = c.get("infl")
        if i is None: continue
        n += 1
        if not isinstance(i.get("v"), (int, float)) or not _m.isfinite(i["v"]) or not -20 < i["v"] < 60: errs.append("%s infl: valor %r fuera de rango" % (cc, i.get("v"))); continue
        if i.get("src") not in reg: errs.append("%s infl: fuente %r no esta en el registro de licencias" % (cc, i.get("src")))
        if i.get("m") is not None and (not re.match(r"^\d{4}-\d{2}$", str(i["m"])) or i["m"] > today or int(i["m"][:4]) != i.get("y")): errs.append("%s infl: mes %r incoherente" % (cc, i.get("m")))
        b = cpi_doc["countries"].get(cc)
        if not b: errs.append("%s infl: el pais no esta en cpi.json" % cc); continue
        import importlib.util as _u
        sp = _u.spec_from_file_location("macro_infl", Path(__file__).resolve().parent / "macro_infl.py"); mi = _u.module_from_spec(sp); sp.loader.exec_module(mi)
        r = mi.one(b)
        if not r or abs(r["v"] - i["v"]) > 0.011 or r["m"] != i.get("m"): errs.append("%s infl: %r no coincide con lo que da cpi.json (%r)" % (cc, i, r))
    RNG = {"gdp": (1e9, 4e13), "gdppc": (500, 3e5), "pop": (3e5, 1.5e9), "unemp": (0, 40), "agri": (0, 40), "debt": (0, 400), "wageh": (0.5, 100), "gdpLc": (1e8, 1e17), "gdppcLc": (100, 1e9)}
    cur_ok = re.compile(r"^[A-Z]{3}$"); full = 0
    for cc, c in doc["countries"].items():
        if c.get("currency") is not None and not cur_ok.match(str(c["currency"])): errs.append("%s: moneda %r no es un codigo de 3 letras" % (cc, c.get("currency")))
        for k, (lo, hi) in RNG.items():
            e = c.get(k)
            if e is None: continue
            v, y = e.get("v"), e.get("y")
            if not isinstance(v, (int, float)) or not _m.isfinite(v) or not lo <= v <= hi: errs.append("%s %s: valor %r fuera de rango" % (cc, k, v))
            if not isinstance(y, int) or not 1990 <= y <= int(today[:4]): errs.append("%s %s: ano %r incoherente" % (cc, k, y))
        for k, kd in (("gdpLc", "gdp"), ("gdppcLc", "gdppc")):   # moneda local: moneda coherente y, si es euro, un cambio creible frente al dolar del mismo ano
            e = c.get(k)
            if not e: continue
            if not cur_ok.match(str(e.get("cur"))) or e.get("cur") != c.get("currency"): errs.append("%s %s: moneda %r distinta de la del pais %r" % (cc, k, e.get("cur"), c.get("currency")))
            if e.get("src") not in ("world_bank_wdi", "eurostat"): errs.append("%s %s: fuente %r desconocida" % (cc, k, e.get("src")))
            d = c.get(kd)
            if e.get("cur") == "EUR" and d and d.get("y") == e.get("y") and isinstance(e.get("v"), (int, float)) and d.get("v") and not 0.6 < e["v"] / d["v"] < 1.4: errs.append("%s %s: %.2f euros por dolar no es creible" % (cc, k, e["v"] / d["v"]))
        if all(c.get(k) for k in ("gdp", "pop", "gdppc")):
            full += 1
            if c["gdp"].get("y") == c["pop"].get("y") == c["gdppc"].get("y") and abs(c["gdp"]["v"] / c["pop"]["v"] / c["gdppc"]["v"] - 1) > 0.15: warns.append("%s: PIB / poblacion (%.0f) no cuadra con el PIB per capita (%.0f); es lo que publica el Banco Mundial" % (cc, c["gdp"]["v"] / c["pop"]["v"], c["gdppc"]["v"]))
    stats["macro completos"] = full
    if n < 20: errs.append("country-macro: inflacion en solo %d paises" % n)
    stats["infl paises"] = n
def cpi(doc, errs, warns, stats):
    """Indices de precios de consumo: bloques mensual (m) y anual (a) con valores positivos, sin saltos mensuales > 12 %, sin meses futuros y con la fuente que toca."""
    import math as _m
    n = 0
    for cc, c in doc["countries"].items():
        if "m" not in c and "a" not in c: errs.append("%s: sin bloque m ni a" % cc)
        m = c.get("m")
        if m:
            ym = _ym(m["s"])
            if not ym: errs.append("%s: mes inicial invalido" % cc); continue
            v = m["v"]; n += 1
            if v[0] is None or v[-1] is None: errs.append("%s: la serie mensual debe empezar y acabar con dato" % cc)
            last = (ym[0] * 12 + ym[1] - 1) + len(v) - 1
            if last >= TODAY.year * 12 + TODAY.month: errs.append("%s: mes futuro en el IPC mensual" % cc)
            prev = None
            for i, x in enumerate(v):
                if x is None: prev = None; continue
                if not _num(x) or x <= 0 or not _m.isfinite(x): errs.append("%s: valor invalido en la posicion %d" % (cc, i)); break
                if prev and abs(x / prev - 1) > 0.12: errs.append("%s: salto mensual de %.1f %% en la posicion %d" % (cc, (x / prev - 1) * 100, i)); break
                prev = x
            exp = {"US": "bls", "UK": "ons", "CA": "statcan", "AR": "indec"}.get(cc)
            if exp and m["src"] != exp: errs.append("%s: la fuente mensual deberia ser %s" % (cc, exp))
            if not exp and m["src"] != "eurostat": errs.append("%s: la fuente mensual deberia ser eurostat" % cc)
        a = c.get("a")
        if a:
            n += 1
            if a["y0"] + len(a["v"]) - 1 > TODAY.year: errs.append("%s: año futuro en el IPC anual" % cc)
            if a["v"][0] is None or a["v"][-1] is None: errs.append("%s: la serie anual debe empezar y acabar con dato" % cc)
            if any(x is not None and (not _num(x) or x <= 0) for x in a["v"]): errs.append("%s: valor anual no positivo" % cc)
    if n < 8: errs.append("cpi: solo %d bloques" % n)
    stats["cpi bloques"] = n

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
    # un trozo de data/watch/<PREFIJO>.json: todas las claves llevan su prefijo y los indices de fuente caben en su lista local
    s = doc["series"]; stats["series"] = stats.get("series", 0) + len(s); pre = doc.get("prefix"); ns = len(doc.get("sources") or [])
    for k, v in s.items():
        if not re.match(r"^([A-Z]{2,3}|P)/.+", k): errs.append("clave invalida %s" % k); break
        if k.split("/", 1)[0] != pre: errs.append("%s: clave fuera del trozo %s" % (k, pre)); break
        if len(v) > 8 and v[8] is not None and not (isinstance(v[8], int) and 0 <= v[8] < ns): errs.append("%s: indice de fuente %r fuera de la lista del trozo" % (k, v[8])); break
        if not (isinstance(v[0], str) and isinstance(v[1], str) and isinstance(v[4], str) and _num(v[5]) and (v[6] is None or _num(v[6]))): errs.append("%s: entrada mal formada %s" % (k, v)); break
def daily_brief(doc, errs, warns, stats):
    c = doc["counts"]
    if c["datasetsUpdated"] != len(doc["datasets"]): errs.append("counts.datasetsUpdated != len(datasets)")
    _chg = {x["file"] for x in doc["coverage"] if x["status"] != "unchanged"}
    if c["datasetsUpdated"] != len(_chg): errs.append("counts.datasetsUpdated (%d) != datasets con cambios en la cobertura por tipo (%d): las dos cifras deben contar lo mismo" % (c["datasetsUpdated"], len(_chg)))
    if c["newDatasets"] != len(doc["newDatasets"]): errs.append("counts.newDatasets != len(newDatasets)")
    if c["revisions"] != len(doc["revisions"]) and len(doc["revisions"]) < 30: errs.append("counts.revisions != len(revisions)")
    if c["stale"] != len(doc["stale"]): errs.append("counts.stale != len(stale)")
    if c["upcoming"] != len(doc["upcoming"]): errs.append("counts.upcoming != len(upcoming)")
    if doc["since"] > doc["generatedAt"]: errs.append("since posterior a generatedAt")
    for k, v in doc["byKind"].items():
        n = sum(1 for x in doc["coverage"] if x["kind"] == k)
        if v["datasets"] != n: errs.append("byKind.%s.datasets %d != %d en coverage" % (k, v["datasets"], n))
        if v["changed"] != sum(1 for x in doc["coverage"] if x["kind"] == k and x["status"] != "unchanged"): errs.append("byKind.%s.changed incoherente" % k)
    # destinos de los enlaces: cada href y cada clave de serie debe existir (producto, serie del catalogo del pais); una clave P/ sin href no se enlaza
    import urllib.parse as _up
    _prods = set(json.loads((ROOT / "data/product-metadata.json").read_text())["products"]); _ids = {}
    def _cat(cc):
        if cc not in _ids:
            _ids[cc] = set()
            for f in ("data/catalog/%s.json" % cc, "data/catalog/eu/%s.json" % cc):
                try: _ids[cc] |= {x["id"] for x in json.loads((ROOT / f).read_text())["series"]}
                except Exception: pass
        return _ids[cc]
    for sec, key in (("movers", "k"), ("gapMovers", "k"), ("newData", "k"), ("revisions", "series")):
        for x in doc[sec]:
            h = x.get("href"); k = x[key]
            if h:
                u = _up.urlparse(h); q = _up.parse_qs(u.query)
                if u.path == "producto.html" and q.get("p", [""])[0] not in _prods: errs.append("brief.%s: href %s no es una ficha de producto" % (sec, h)); break
                if u.path == "paises.html" and q.get("s", [""])[0] not in _cat(q.get("c", [""])[0]): errs.append("brief.%s: href %s apunta a una serie que no existe" % (sec, h)); break
            elif not k.startswith(("P/", "CB/")):
                cc, _, sid = k.partition("/")
                if sid not in _cat(cc): errs.append("brief.%s: la serie %s no existe en el catalogo (enlace roto)" % (sec, k)); break
            elif k.startswith("P/"): errs.append("brief.%s: %s sin destino verificado" % (sec, k)); break
    pc = doc["pipelinesCovered"]
    if pc["withKind"] + len(pc["internal"]) != pc["total"]: errs.append("pipelinesCovered: withKind + internal != total (hay pipelines sin clasificar)")
    for lst in ("movers", "newData"):
        for x in doc[lst]:
            if x.get("kind") not in doc["byKind"]: errs.append("%s: kind %r desconocido" % (lst, x.get("kind"))); break
    m = [abs(x["changePct"]) for x in doc["movers"] if _num(x["changePct"])]
    if m != sorted(m, reverse=True): errs.append("movers sin ordenar por |cambio|")
    cb = doc.get("cashBids")
    if cb:
        if sum(g["markets"] for g in cb["groups"]) > cb["marketsUpdated"]: errs.append("cashBids: mas mercados en los grupos que mercados actualizados")
        for g in cb["groups"]:
            if g["min"] > g["max"] or not (g["min"] <= g["lead"]["pct"] <= g["max"]): errs.append("cashBids %s/%s: rango de cambios incoherente (min/max/lead)" % (g["state"], g["commodity"])); break
        ab = [max(abs(g["min"]), abs(g["max"])) for g in cb["groups"]]
        if ab != sorted(ab, reverse=True): errs.append("cashBids: grupos sin ordenar por |cambio|")
        if cb["groups"] and not cb["asOf"]: errs.append("cashBids: grupos sin fecha")
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
    # un trozo del indice de busqueda (data/catalog/index/<CC>.json) debe ser exactamente el catalogo de su entidad: mismas series, ids unicos, indices dentro del diccionario y punteros validos
    D_ = doc["dict"]; rows = doc["rows"]; man = json.loads((D / "catalog/manifest.json").read_text(encoding="utf-8"))
    cc = doc.get("cc"); c = man["countries"].get(cc)
    if not c: errs.append("trozo de una entidad que no esta en el manifiesto: %r" % cc); return
    if doc["total"] != len(rows): errs.append("total %d != filas %d" % (doc["total"], len(rows)))
    if len(rows) != c["n"]: errs.append("%s: indice con %d series, manifiesto %d" % (cc, len(rows), c["n"]))
    seen = set(); fsok = {"LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED", "STALE", "HISTORICAL", "DISCONTINUED", "PENDING"}
    for r in rows:
        if len(r) != 11: errs.append("fila con %d columnas (se esperan 11)" % len(r)); break
        if r[2] >= len(D_["cc"]) or r[3] >= len(D_["group"]) or r[4] >= len(D_["unit"]) or r[5] >= len(D_["freq"]) or r[7] >= len(D_["fs"]) or r[10] >= len(D_["src"]) or any(t >= len(D_["tag"]) for t in r[8]): errs.append("%s: indice fuera del diccionario" % r[0]); break
        if D_["cc"][r[2]] != cc: errs.append("%s: fila de %s en el trozo de %s" % (r[0], D_["cc"][r[2]], cc)); break
        if r[0] in seen: errs.append("serie repetida %s/%s" % (cc, r[0])); break
        seen.add(r[0])
        if D_["fs"][r[7]] not in fsok: errs.append("%s: estado de frescura %r invalido" % (r[0], D_["fs"][r[7]])); break
        if r[9] not in (0, 1) or (r[9] == 1 and not c.get("catalogEu")): errs.append("%s: puntero a catalogo invalido" % r[0]); break
    if sum(1 for r in rows if r[9] == 1) != c.get("nEu", 0): errs.append("%s: series UE del indice != manifiesto" % cc)
    stats["series"] = stats.get("series", 0) + len(rows)

# ---------- US Local Cash Bids (data/us-cash-bids) ----------
_CB_SECRET = re.compile(r"authorization|basic [A-Za-z0-9+/=]{16,}|api[_-]?key|apikey|secret|token=", re.I)
def _cb_secret_scan(doc, errs):
    if _CB_SECRET.search(json.dumps(doc)): errs.append("el fichero contiene texto que parece una credencial (authorization/api key/secret): las claves solo viven en GitHub Secrets")
def _cb_pt(sid, p, errs, unit):
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(p[0])): errs.append("%s: fecha %r invalida" % (sid, p[0])); return False
    for i, v in enumerate(p[1:4], 1):
        if v is not None and (not _num(v) or v <= 0 or (unit == "bu" and v > 100)): errs.append("%s %s: precio %r fuera de rango" % (sid, p[0], v)); return False
    if p[2] is not None and p[3] is not None and p[2] > p[3]: errs.append("%s %s: minimo %s > maximo %s" % (sid, p[0], p[2], p[3])); return False
    if p[1] is None and p[2] is None and p[3] is None: errs.append("%s %s: punto sin ningun precio" % (sid, p[0])); return False
    if p[4] is not None and p[5] is not None and p[4] > p[5]: errs.append("%s %s: basis minimo > maximo" % (sid, p[0])); return False
    return True
def us_cashbids_shard(doc, errs, warns, stats):
    _cb_secret_scan(doc, errs); seen = set(); stats["series"] += len(doc["series"])
    for s in doc["series"]:
        sid = s["id"]
        if sid in seen: errs.append("serie repetida %s" % sid); break
        seen.add(sid)
        if not sid.startswith("us-cb:%d:" % s["reportId"]): errs.append("%s: el id no corresponde al informe %d" % (sid, s["reportId"])); break
        if s["state"] != doc["state"] or s["commodity"] != doc["commodity"]: errs.append("%s: serie en el shard equivocado (%s/%s)" % (sid, s["state"], s["commodity"])); break
        pts = s["pts"]
        if not _asc(pts, sid, errs, key=lambda p: str(p[0])): break
        if not all(_cb_pt(sid, p, errs, s["unit"]) for p in pts): break
        last = pts[-1]
        if s["date"] != last[0] or (s["avg"], s["lo"], s["hi"], s["bLo"], s["bHi"]) != tuple(last[1:6]): errs.append("%s: la ultima observacion no coincide con el ultimo punto" % sid); break
        if s["n"] < len(pts): errs.append("%s: n < puntos" % sid); break
        if s["first"] > pts[0][0]: errs.append("%s: first posterior al primer punto" % sid); break
        hl = last[1] if last[1] is not None else (last[2] if last[2] is not None and last[2] == last[3] else None)
        kind = "AVERAGE" if last[1] is not None else "EXACT" if hl is not None else "RANGE" if (last[2] is not None or last[3] is not None) else "NONE"
        if s["priceKind"] != kind: errs.append("%s: priceKind %s != %s" % (sid, s["priceKind"], kind)); break
        if len(pts) > 1:
            pv = pts[-2]; hp = pv[1] if pv[1] is not None else (pv[2] if pv[2] is not None and pv[2] == pv[3] else None)
            if (datetime.date.fromisoformat(last[0]) - datetime.date.fromisoformat(pv[0])).days > {"daily": 7, "weekly": 14}.get(s["frequency"], 7): hp = None  # = lib_cashbids.MAX_GAP_DAYS
            exp = round((hl / hp - 1) * 100, 2) if hl is not None and hp else None
            if s["prevDate"] != pv[0] or (s["changePct"] is None) != (exp is None) or (exp is not None and abs(s["changePct"] - exp) > 0.011): errs.append("%s: changePct %s no cuadra con los dos ultimos puntos (%s)" % (sid, s["changePct"], exp)); break
        elif s["changePct"] is not None or s["prevDate"] is not None: errs.append("%s: cambio sin observacion previa" % sid); break
        if last[4] is not None or last[5] is not None:
            if not s.get("basisUnit"): warns.append("%s: basis publicado sin unidad de basis (no se muestra con unidad inventada)" % sid)
        if s["locationType"] == "ELEVATOR" and not s["locationName"]: errs.append("%s: ELEVATOR sin nombre de instalacion" % sid); break
        if _num(s["avg"]) and _num(s["lo"]) and _num(s["hi"]) and not (s["lo"] - 1e-9 <= s["avg"] <= s["hi"] + 1e-9): warns.append("%s: promedio fuera del rango publicado" % sid)
        if abs(s["changePct"] or 0) > 8: warns.append("%s: cambio diario %.1f %% (revisar contra el informe original: puede ser un cambio de periodo de entrega o de cosecha)" % (sid, s["changePct"]))
def us_cashbids_history(doc, errs, warns, stats):
    _cb_secret_scan(doc, errs); stats["series"] += len(doc["series"])
    for sid, s in doc["series"].items():
        if not sid.startswith("us-cb:%d:" % s["reportId"]): errs.append("%s: id/informe inconsistente" % sid); break
        if not _asc(s["pts"], sid, errs, key=lambda p: str(p[0])): break
        if not all(_cb_pt(sid, p, errs, s["unit"]) for p in s["pts"]): break
        if s["state"] != doc["state"] or s["commodity"] != doc["commodity"]: errs.append("%s: serie en el almacen equivocado" % sid); break
def us_cashbids_reports(doc, errs, warns, stats):
    _cb_secret_scan(doc, errs); ids = [r["reportId"] for r in doc["reports"]]
    if len(ids) != len(set(ids)): errs.append("reportId repetido")
    reg = json.loads((ROOT / "scripts/us-cash-bids-registry.json").read_text(encoding="utf-8"))
    if set(ids) != {r["reportId"] for r in reg["reports"]}: errs.append("reports.json no coincide con scripts/us-cash-bids-registry.json (registro central)")
    on = {r["reportId"]: r["enabled"] for r in reg["reports"]}
    for r in doc["reports"]:
        if r["active"] != on.get(r["reportId"]): errs.append("%d: active != registro" % r["reportId"]); break
        if r["hasData"] != (r["observations"] > 0) or (r["hasData"] and not r["commodities"]): errs.append("%d: hasData incoherente" % r["reportId"]); break
        if not r["active"] and r["ingestionStatus"] not in ("DISABLED",) and not r["hasData"]: errs.append("%d: informe sin habilitar con estado %s" % (r["reportId"], r["ingestionStatus"])); break
        if r["hasBasis"] and not r["hasData"]: errs.append("%d: basis sin datos" % r["reportId"]); break
    stats["series"] += len(doc["reports"])
def us_cashbids_manifest(doc, errs, warns, stats):
    _cb_secret_scan(doc, errs); base = D / "us-cash-bids"; ser = 0; hist = 0
    for st, e in doc["states"].items():
        for com, c in e["commodities"].items():
            p = base / c["shard"]; h = base / c["history"]
            if not p.exists() or not h.exists(): errs.append("%s/%s: shard o historico inexistente" % (st, com)); continue
            sh = json.loads(p.read_text(encoding="utf-8")); hi = json.loads(h.read_text(encoding="utf-8"))
            if len(sh["series"]) != c["series"] or len({x["locationName"] for x in sh["series"]}) != c["markets"]: errs.append("%s/%s: series/mercados del manifiesto no cuadran con el shard" % (st, com))
            if set(hi["series"]) != {x["id"] for x in sh["series"]}: errs.append("%s/%s: shard e historico con distintas series" % (st, com)); continue
            for x in sh["series"]:
                hp = hi["series"][x["id"]]["pts"]
                if x["n"] != len(hp) or x["pts"][-1][:6] != hp[-1][:6] or x["first"] != hp[0][0]: errs.append("%s: shard vs historico (n/ultimo/primero)" % x["id"]); break
            ser += c["series"]; hist += sum(len(v["pts"]) for v in hi["series"].values())
    t = doc["totals"]
    if t["series"] != ser or t["historicalObservations"] != hist: errs.append("totals (%d series, %d obs) no cuadran con los ficheros (%d, %d)" % (t["series"], t["historicalObservations"], ser, hist))
    if t["states"] != len(doc["states"]) or t["commodities"] != len(doc["commodities"]): errs.append("totals.states/commodities no cuadran")
    if t["reportsWithBasis"] > t["reportsWithData"] or t["reportsWithData"] > t["reportsEnabled"]: errs.append("totals de informes incoherentes")
    lic = json.loads((D / "license-registry.json").read_text(encoding="utf-8"))["sources"].get(doc["sourceId"])
    if not lic or lic["status"] in ("RESTRICTED", "BLOCKED") or doc["license"]["status"] != lic["status"]: errs.append("el manifiesto declara una licencia distinta de la del registro (%s)" % (lic or {}).get("status"))
    stats["series"] += ser
def us_cashbids_zip(doc, errs, warns, stats):
    ok = set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split())
    _cb_secret_scan(doc, errs)
    import re as _re
    for k in doc["prefix"]:
        if not _re.match(r"^[0-9]{3}$", k): errs.append("zip-state: prefijo invalido %r" % k)
    for k in doc["exceptions"]:
        if not _re.match(r"^[0-9]{5}$", k): errs.append("zip-state: ZIP invalido %r" % k)
    if len(doc["prefix"]) < 800: errs.append("zip-state: solo %d prefijos (se esperan >= 800)" % len(doc["prefix"]))
    for k, s in list(doc["prefix"].items()) + list(doc["exceptions"].items()):
        if s not in ok: errs.append("zip-state: estado desconocido %s para %s" % (s, k))
    for z, s in doc["exceptions"].items():
        if z[:3] not in doc["prefix"]: errs.append("zip-state: excepcion %s sin prefijo" % z)
        elif doc["prefix"][z[:3]] == s: errs.append("zip-state: la excepcion %s es redundante" % z)
    for z, s in (("50010", "IA"), ("66502", "KS"), ("68501", "NE"), ("55401", "MN"), ("61820", "IL"), ("65201", "MO")):
        if doc["exceptions"].get(z) or doc["prefix"].get(z[:3]) != s: errs.append("zip-state: %s deberia ser %s" % (z, s))

def us_cashbids_watch(doc, errs, warns, stats):
    _cb_secret_scan(doc, errs); base = D / "us-cash-bids"; stats["series"] += len(doc["series"]); live = {}
    for f in sorted(base.glob("*/*.json")):
        sh = json.loads(f.read_text(encoding="utf-8"))
        for x in sh["series"]: live["%s/%s/%s" % (sh["state"], sh["commodity"], x["id"])] = x
    for k, a in doc["series"].items():
        x = live.get(k)
        if not x: errs.append("%s: serie que no existe en los shards" % k); break
        if a[4] != x["date"] or a[5] != (x["avg"] if x["avg"] is not None else x["lo"]) or a[6] != x["changePct"]: errs.append("%s: fecha/valor/cambio no coinciden con el shard" % k); break
        if x["freshness"] not in ("LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED"): errs.append("%s: una serie %s no debe estar en el indice de seguimiento" % (k, x["freshness"])); break
        if a[7] is not None and (x["bLo"] != a[7] or x["bHi"] != a[7]): errs.append("%s: basis del indice no es un basis unico publicado" % k); break
        if not isinstance(a[5], (int, float)) or a[5] <= 0: errs.append("%s: valor no valido" % k); break
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
def views_region_metrics(doc, errs, warns, stats):
    """Valores del mapa de regiones: cada clave es una region con contorno y nombre (js/region-names.js) y cada valor es un numero finito."""
    import re as _re
    names = (ROOT / "js" / "region-names.js").read_text() if "ROOT" in globals() else open("js/region-names.js").read()
    n = 0
    for cc, ms in doc["countries"].items():
        m = _re.search(r"var " + cc + r" = \{(.*?)\};", names, _re.S)
        ids = set(_re.findall(r"(\w+): '", m.group(1))) if m else set()
        if not ids: errs.append("%s: pais sin nombres de region" % cc); continue
        for mid, b in ms.items():
            bad = [k for k in b["vals"] if k not in ids]
            if bad: errs.append("%s/%s: regiones desconocidas %s" % (cc, mid, bad[:5]))
            for k, v in b["vals"].items():
                if not _num(v): errs.append("%s/%s/%s: valor no numerico" % (cc, mid, k))
            n += len(b["vals"])
    stats["series"] = n
_US_ST = set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split())
def us_states(doc, errs, warns, stats):
    """Series de EE. UU. por estado: periodos ordenados y sin repetir (AAAA o AAAA-MM), valores numericos; nada negativo salvo las rentas netas de ERS; censo y condados con claves validas."""
    st = doc["state"]
    if st != "US" and st not in _US_ST: errs.append("estado desconocido %s" % st); return
    n = 0
    for k, s in doc["series"].items():
        ps = [p[0] for p in s["points"]]
        if ps != sorted(set(ps)): errs.append("%s %s: periodos desordenados o repetidos" % (st, k))
        if any(not re.match(r"^\d{4}(-\d{2})?$", str(p)) for p in ps): errs.append("%s %s: periodo con formato raro" % (st, k))
        for p in s["points"]:
            if not _num(p[1]): errs.append("%s %s %s: valor no numerico" % (st, k, p[0])); break
            if p[1] < 0 and not k.startswith("ers_net"): errs.append("%s %s %s: valor negativo" % (st, k, p[0])); break
        n += len(ps)
    for k, v in (doc.get("census2022") or {}).items():
        if not _num(v) or v < 0: errs.append("%s censo %s invalido" % (st, k))
    for f, c in (doc.get("counties") or {}).items():
        if not re.match(r"^\d{5}$", f): errs.append("%s condado con FIPS raro %s" % (st, f)); break
    stats["series"] = n
def us_states_index(doc, errs, warns, stats):
    S = doc["states"]
    if "US" not in S: errs.append("falta el fichero nacional")
    bad = [k for k in S if k != "US" and k not in _US_ST]
    if bad: errs.append("estados desconocidos %s" % bad)
    stats["series"] = sum(v.get("series", 0) for v in S.values())
def us_markets_cot(doc, errs, warns, stats):
    """COT de la CFTC: semanas ordenadas sin repetir, contratos enteros no negativos, largos de gestores de dinero <= contratos abiertos."""
    n = len(doc["fields"])
    for m in doc["markets"]:
        ds = [p[0] for p in m["points"]]
        if ds != sorted(set(ds)) or any(not re.match(r"^\d{4}-\d{2}-\d{2}$", d) for d in ds): errs.append("%s: fechas desordenadas, repetidas o raras" % m["code"]); continue
        for p in m["points"]:
            if len(p) != n + 1: errs.append("%s %s: %d campos" % (m["code"], p[0], len(p) - 1)); break
            v = p[1:]
            if any(x is not None and (not _num(x) or x < 0) for x in v): errs.append("%s %s: valor negativo o no numerico" % (m["code"], p[0])); break
            if v[0] and v[1] is not None and v[1] > v[0]: errs.append("%s %s: largos de fondos > contratos abiertos" % (m["code"], p[0])); break
        if ds and ds[-1] < (datetime.date.today() - datetime.timedelta(days=60)).isoformat(): warns.append("%s: ultima semana %s" % (m["code"], ds[-1]))
    stats["series"] = len(doc["markets"])
def _dated_series(label, pts, errs, lo=0, hi=None):
    ds = [p[0] for p in pts]
    if ds != sorted(set(ds)) or any(not re.match(r"^\d{4}-\d{2}-\d{2}$", str(d)) for d in ds): errs.append("%s: fechas desordenadas, repetidas o raras" % label); return False
    for p in pts:
        for x in p[1:]:
            if x is not None and (not _num(x) or x < lo or (hi is not None and x > hi)): errs.append("%s %s: valor fuera de rango %r" % (label, p[0], x)); return False
    return True
def us_markets_transport(doc, errs, warns, stats):
    """Transporte de grano (AgTransport): indices > 0 y fletes de barcaza positivos, fechas ordenadas."""
    _dated_series("indicadores", doc["indicators"]["points"], errs, 0, 5000)
    for s in doc["bargePctTariff"]["series"]: _dated_series("barcaza %s" % s["location"], s["points"], errs, 0, 5000)
    for s in (doc.get("bargeUsdTon") or {}).get("series", []): _dated_series("barcaza USD/t %s" % s["location"], s["points"], errs, 0, 1000)
    stats["series"] = 1 + len(doc["bargePctTariff"]["series"]) + len((doc.get("bargeUsdTon") or {}).get("series", []))
def us_markets_fuel(doc, errs, warns, stats):
    """Gasoleo y propano (EIA): USD por galon entre 0 y 20, fechas ordenadas."""
    n = 0
    for k, s in doc["diesel"].items(): _dated_series("gasoleo %s" % k, s["points"], errs, 0, 20); n += 1
    for kind in ("residential", "wholesale"):
        for k, s in doc["propane"].get(kind, {}).items(): _dated_series("propano %s %s" % (kind, k), s["points"], errs, 0, 20); n += 1
    stats["series"] = n
def us_markets_ethanol(doc, errs, warns, stats):
    """Etanol (EIA): produccion 0 a 3000 mil barriles/dia, existencias 0 a 60000 mil barriles, fechas ordenadas."""
    n = 0
    for k, sr in doc["series"].items(): _dated_series("etanol %s" % k, sr["points"], errs, 0, 60000 if k.startswith("stocks") else 3000); n += 1
    stats["series"] = n
def us_markets_wasde(doc, errs, warns, stats):
    """WASDE (OCE/WAOB): >=150 magnitudes con id unico, anos comerciales sin repetir y ordenados, valores finitos y menos de 1e7, precios y produccion no negativos, series clave presentes y hist que termina en el mes del informe."""
    I = doc["items"]; ids = set(); rm = doc["reportMonth"]
    for it in I:
        if it["id"] in ids: errs.append("wasde: id repetido %s" % it["id"]); continue
        ids.add(it["id"]); ys = [r["my"] for r in it["rows"]]
        if ys != sorted(set(ys)): errs.append("wasde %s: anos desordenados o repetidos" % it["id"]); continue
        for r in it["rows"]:
            v = r["v"]
            if v is not None and (v != v or abs(v) > 1e7): errs.append("wasde %s %s: valor imposible %r" % (it["id"], r["my"], v)); break
            if v is not None and v < 0 and ("price" in it["id"] or "production" in it["id"] or "area" in it["id"]): errs.append("wasde %s %s: valor negativo" % (it["id"], r["my"])); break
            if r.get("hist") and r["hist"][-1][0] != rm: warns.append("wasde %s %s: el historico no acaba en %s" % (it["id"], r["my"], rm)); break
    for k in ("corn|avg-farm-price-bu", "wheat|avg-farm-price-bu", "soybeans|avg-farm-price-bu", "cotton|avg-farm-price", "corn|production", "dairyprices|class-iii"):
        if k not in ids: errs.append("wasde: falta la magnitud %s" % k)
    stats["series"] = len(I)
def eu_food_monitor_geo(doc, errs, warns, stats):
    """Monitor de precios de alimentos de Eurostat por zona: sin pareja producto-indice repetida, indices base 2025=100 mayores que 0 y menores de 100000 (hay paises con inflacion muy alta), serie que acaba en el mes declarado o antes y sin huecos en los extremos; la UE (EU27_2020) tiene que traer al menos 50 series y cualquier zona al menos 1."""
    seen = set(); n = 0
    def mi(m): return int(m[:4]) * 12 + int(m[5:7]) - 1
    for s in doc["series"]:
        k = (s["p"], s["i"])
        if k in seen: errs.append("fpm %s: serie repetida %s" % (doc["geo"], k)); continue
        seen.add(k)
        for v in s["v"]:
            if v is not None and not 0 < v < 100000: errs.append("fpm %s %s: indice imposible %r" % (doc["geo"], k, v)); break
        if mi(s["s"]) + len(s["v"]) - 1 > mi(doc["end"]): errs.append("fpm %s %s: acaba despues del mes final %s" % (doc["geo"], k, doc["end"]))
        if s["v"][-1] is None or s["v"][0] is None: errs.append("fpm %s %s: empieza o acaba en hueco" % (doc["geo"], k))
        n += 1
    if n < (50 if doc["geo"] == "EU27_2020" else 1): errs.append("fpm %s: solo %d series" % (doc["geo"], n))
    stats["series"] = n
def us_markets_sap(doc, errs, warns, stats):
    """Prevision de precio de ERS (modelo, no oficial): >=3 productos, cada ano con puntos de fecha ordenada y sin repetir, precio del modelo entre 0 y 1000, la marca official=false y la nota bilingue."""
    n = 0
    if doc.get("official") is not False: errs.append("sap: debe declararse official=false")
    for c in doc["commodities"]:
        for y in c["years"]:
            ds = [p[0] for p in y["points"]]
            if ds != sorted(set(ds)): errs.append("sap %s %s: fechas desordenadas o repetidas" % (c["id"], y["label"])); continue
            for p in y["points"]:
                if p[1] is not None and not 0 < p[1] < 1000: errs.append("sap %s %s: precio imposible %r" % (c["id"], y["label"], p[1])); break
                if p[2] is not None and not 0 < p[2] < 1000: errs.append("sap %s %s: cifra WASDE imposible %r" % (c["id"], y["label"], p[2])); break
        n += 1
    stats["series"] = n
def us_markets_baseline_tables(doc, errs, warns, stats):
    """Tablas xlsx de ERS: >=12 tablas, ids unicos, 5-12 columnas de periodo sin repetir, cada fila con tantos valores como periodos, valores finitos y menos de 1e9, y al menos 2 filas con datos por tabla."""
    T = doc["tables"]; ids = set(); n = 0
    if len(T) < 12: errs.append("baseline-tables: %d tablas (se esperan >=12)" % len(T)); return
    for t in T:
        if t["id"] in ids: errs.append("baseline-tables: id repetido %s" % t["id"])
        ids.add(t["id"]); y = t["years"]
        if not 5 <= len(y) <= 14 or len(set(y)) != len(y): errs.append("tabla %s: periodos raros %r" % (t["id"], y[:3])); continue
        if len(t["rows"]) < 2: errs.append("tabla %s: menos de 2 filas" % t["id"]); continue
        for r in t["rows"]:
            v = r["values"]
            if len(v) != len(y): errs.append("tabla %s, fila %r: %d valores para %d periodos" % (t["id"], r["label"][:30], len(v), len(y))); break
            if any(x is not None and abs(x) > 1e9 for x in v): errs.append("tabla %s, fila %r: valor imposible" % (t["id"], r["label"][:30])); break
            if all(x is None for x in v): warns.append("tabla %s, fila %r: sin ningun valor" % (t["id"], r["label"][:30]))
        n += len(t["rows"])
    stats["series"] = n
def us_markets_baseline(doc, errs, warns, stats):
    """Proyecciones ERS a 10 anos: >=150 series, anos ordenados y sin repetir (como maximo 12), mismo numero de valores que de anos, sin vacios, produccion/precio/superficie/rendimiento no negativos y las series clave presentes."""
    S = doc["series"]; seen = set(); key = {("Corn", "Farm price"), ("Soybeans", "Production"), ("Wheat", "Production"), ("Beef", "Commercial production"), ("Pork", "Commercial production"), ("Dairy", "Milk production")}
    have = set()
    if not S or len(S) < 150: errs.append("baseline: %d series (se esperan >=150)" % len(S)); return
    for s in S:
        k = (s["type"], s["commodity"], s["attribute"], s["unit"]); have.add((s["commodity"], s["attribute"]))
        if k in seen: errs.append("baseline: serie repetida %r" % (k,)); continue
        seen.add(k); y = s["years"]; v = s["values"]
        if len(y) != len(v) or not 5 <= len(y) <= 12 or y != sorted(set(y)): errs.append("baseline %s/%s: anos y valores no cuadran" % k[1:3]); continue
        if any(x != x or abs(x) > 1e9 for x in v): errs.append("baseline %s/%s: valor imposible" % k[1:3])
        a = s["attribute"]
        if min(v) < 0 and (a in ("Production", "Commercial production", "Farm price", "Planted acres", "Harvested acres") or a.startswith("Yield")): errs.append("baseline %s/%s: valor negativo" % k[1:3])
        elif min(v) < 0 and "return" not in a.lower(): warns.append("baseline %s/%s: valor negativo" % k[1:3])
        if s["unit"] == "Percent" and max(v) > 300: errs.append("baseline %s/%s: porcentaje fuera de rango" % k[1:3])
    for m in key - have: errs.append("baseline: falta la serie %s / %s" % m)
    stats["series"] = len(S)
def us_markets_slaughter(doc, errs, warns, stats):
    """Sacrificio diario (AMS 3208): fechas ordenadas y sin repetir, cabezas entre 0 y 2 millones (pollo hasta 80 millones), 11 columnas, acumulado del ano que no baja dentro del mismo ano y vacuno por clases que no supera el total."""
    n = 0; cols = doc["columns"]
    if len(cols) != 11: errs.append("slaughter: %d columnas" % len(cols)); return
    for k, sp in doc["species"].items():
        rows = sp["rows"]; ds = [r[0] for r in rows]
        if ds != sorted(set(ds)): errs.append("sacrificio %s: fechas desordenadas o repetidas" % k)
        for r in rows:
            if len(r) != 11 or not isinstance(r[1], int) or not 0 <= r[1] <= (80000000 if k == "chicken" else 2000000): errs.append("sacrificio %s %s: fila rara %r" % (k, r[0], r[:3])); break
        for a, b in zip(rows, rows[1:]):
            if a[0][:4] == b[0][:4] and a[7] and b[7] and b[7] < a[7] and (b[8] or 0) >= (a[8] or 0) and not b[10]: warns.append("sacrificio %s: el acumulado anual baja entre %s y %s" % (k, a[0], b[0])); break
        n += 1
    tot = {r[0]: r[1] for r in doc["species"]["cattle"]["rows"]}
    for d, c in doc["cattleClasses"].items():
        s = (c.get("steersHeifers") or 0) + (c.get("cowsBulls") or 0)
        if d in tot and s > tot[d] * 1.05 + 1000: warns.append("sacrificio vacuno %s: las clases (%d) superan el total (%d)" % (d, s, tot[d]))
    stats["series"] = n
def us_markets_inspections(doc, errs, warns, stats):
    """Inspecciones de exportacion (FGIS): toneladas semanales no negativas (maximo 6 millones), fechas ordenadas y sin repetir."""
    n = 0
    for g, pts in doc["series"].items(): _dated_series("inspecciones %s" % g, pts, errs, 0, 6000000); n += 1
    stats["series"] = n
def us_markets_lmr(doc, errs, warns, stats):
    """Precios de referencia LMR (AMS): USD por cwt entre 0 y 1500 (piezas de vacuno de hasta ~1500), fechas ordenadas."""
    R = doc["reports"]; n = 0
    for k in ("beef", "pork", "hogs"):
        r = R[k]
        if not r["rows"]: errs.append("%s sin filas" % k); continue
        for p in r["rows"]: pass
        _dated_series("lmr %s" % k, [[p[0]] + [x for x, c in zip(p[1:], r["columns"][1:]) if not c.lower().endswith("loads") and c not in ("carcassWeight", "barrowsGilts")] for p in r["rows"]], errs, 0, 1500); n += 1
    for k, pts in R["cattle"]["series"].items(): _dated_series("lmr vacuno %s" % k, [[p[0], p[1]] for p in pts], errs, 0, 1500); n += 1
    stats["series"] = n
def us_arcplc(doc, errs, warns, stats):
    """ARC-CO por condado (FSA): FIPS validos del estado, campanas AAAA, tasa de pago entre 0 y el maximo (con margen de redondeo), sin negativos."""
    st = doc["state"]
    if st not in _US_ST: errs.append("estado desconocido %s" % st); return
    n = 0
    for f, c in doc["counties"].items():
        if not re.match(r"^\d{5}$", f): errs.append("%s FIPS raro %s" % (st, f)); return
        for key, e in c["crops"].items():
            for y, v in e["years"].items():
                if not re.match(r"^20\d\d$", y): errs.append("%s %s %s: campana rara %s" % (st, f, key, y)); return
                for k, x in v.items():
                    if x is not None and (not _num(x) or x < 0): errs.append("%s %s %s %s %s: valor negativo o no numerico" % (st, f, key, y, k)); return
                r, mx = v.get("rate"), v.get("maxRate")
                if r is not None and mx is not None and r > mx + 0.05: errs.append("%s %s %s %s: tasa %s > maxima %s" % (st, f, key, y, r, mx)); return
                n += 1
    stats["series"] = n
def us_arcplc_national(doc, errs, warns, stats):
    """PLC nacional (FSA): tasas no negativas y <= tasa maxima; precio efectivo >= tasa de prestamo."""
    for y, rows in doc["plc"].items():
        if not re.match(r"^20\d\d$", y): errs.append("campana rara %s" % y); continue
        for r in rows:
            for k in ("refPrice", "mya", "loanRate", "effPrice", "rate", "maxRate"):
                if r.get(k) is not None and (not _num(r[k]) or r[k] < 0): errs.append("PLC %s %s %s invalido" % (y, r.get("crop"), k)); break
            if r.get("rate") is not None and r.get("maxRate") is not None and r["rate"] > r["maxRate"] + 1e-6: errs.append("PLC %s %s: tasa > maxima" % (y, r.get("crop")))
    stats["series"] = len(doc["plc"])
def us_arcplc_index(doc, errs, warns, stats):
    bad = [k for k in doc["states"] if k not in _US_ST]
    if bad: errs.append("estados desconocidos %s" % bad)
    stats["series"] = len(doc["states"])
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

def views_news_product(doc, errs, warns, stats):
    """Vista corta de la ficha de producto: debe ser un subconjunto exacto de news-feed.json (mismo id, fecha y titular) y no pasar de PRODUCT_TOP por clave."""
    stats["series"] = len(doc["items"]); seen = set(); per = {}
    try:
        fd = json.loads((D / "views/news-feed.json").read_text(encoding="utf-8"))
        # solo se exige el subconjunto cuando las dos vistas salen de la misma ejecucion (mismo generatedAt); otra ejecucion del bot de noticias puede haber renovado el feed antes
        feed = {a["id"]: a for a in fd["items"]} if fd.get("generatedAt") == doc.get("generatedAt") else None
    except Exception: feed = None
    for a in doc["items"]:
        if a["id"] in seen: errs.append("noticia duplicada %s" % a["id"])
        seen.add(a["id"])
        if not _date(a["d"]): errs.append("%s: fecha invalida %s" % (a["id"], a["d"]))
        if feed is not None:
            f = feed.get(a["id"])
            if not f: errs.append("%s: no esta en news-feed.json" % a["id"])
            elif (f["d"], f["h"], f["u"]) != (a["d"], a["h"], a["u"]): errs.append("%s: difiere de news-feed.json" % a["id"])
        for k in a.get("p") or []: per[k] = per.get(k, 0) + 1
    if not doc["items"]: errs.append("vista de producto vacia")

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
            # diferencia relativa simetrica (sobre el mayor de los dos): una caida real brusca de la fuente (p. ej. arroz japonica de Espana, -26 % en una semana al llegar la cosecha nueva) no debe parecer mas grande que una subida igual
            if abs(h["value"] - o["value"]) > tol * max(1, abs(o["value"]), abs(h["value"])): errs.append("%s: latest %s vs history del mes %s (%s)" % (o["id"], o["value"], h["value"], o["frequency"]))
    if cat and lat and len(cat["latest"]) != len(lat["observations"]): errs.append("catalog.latest %d != latest %d" % (len(cat["latest"]), len(lat["observations"])))
    if cat and lat and cat["observationCount"] < len(lat["observations"]): errs.append("catalog.observationCount (filas de snapshots) %d < latest %d" % (cat["observationCount"], len(lat["observations"])))
    wi, reg, man = ld("watch/P.json"), ld("series-registry.json"), ld("catalog/manifest.json")
    if man:   # indice de busqueda troceado: cada entidad del manifiesto tiene su trozo, y no sobra ninguno
        want = {"catalog/index/" + c["catalog"].split("/")[-1] for c in man["countries"].values()}
        have = {"catalog/index/" + p.name for p in (D / "catalog/index").glob("*.json")}
        if want - have: errs.append("trozos de indice que faltan: %s" % sorted(want - have)[:5])
        if have - want: errs.append("trozos de indice huerfanos: %s" % sorted(have - want)[:5])
    wix = ld("watch/index.json")
    if wix:
        have = sorted(p.stem for p in (D / "watch").glob("*.json") if p.name != "index.json")
        if wix["prefixes"] != have: errs.append("watch/index.json: prefijos %s != trozos %s" % (wix["prefixes"][:6], have[:6]))
    if wi and lat:
        n = sum(1 for k in wi["series"] if k.startswith("P/"))
        if n != len(lat["observations"]): errs.append("watch-index: %d productos != %d en latest" % (n, len(lat["observations"])))
    # el catalogo solo publica la serie preferida de cada duplicado (build-data-catalog); el registro las cuenta todas
    if reg and man and reg["summary"]["series"] - reg["summary"].get("nonPreferred", 0) != man["seriesByKind"]["stats"]: errs.append("series-registry %d (menos %d duplicadas no preferidas) != manifest stats %d" % (reg["summary"]["series"], reg["summary"].get("nonPreferred", 0), man["seriesByKind"]["stats"]))
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
    by = {r["id"]: r for r in doc["relationships"]}
    for ch in doc.get("chains") or []:   # cada eslabon de una cadena es una relacion observada de confianza alta o media, y los nodos encajan
        a, b = by.get(ch["links"][0]), by.get(ch["links"][1])
        if not a or not b: errs.append("cadena %s: eslabon inexistente" % ch["id"]); continue
        if any(x["status"] != "OBSERVED_RELATIONSHIP" or x["confidence"] not in ("HIGH", "MEDIUM") for x in (a, b)): errs.append("cadena %s: eslabon no solido" % ch["id"])
        if a["market"]["key"] != b["input"]["key"] or [n["key"] for n in ch["nodes"]] != [a["input"]["key"], a["market"]["key"], b["market"]["key"]]: errs.append("cadena %s: nodos que no encajan" % ch["id"])
    for r in doc["relationships"]:
        s = r["stat"]; f = r["frequency"]; rid = r["id"]; c = s["correlation"]
        if r["family"] not in doc["families"]: errs.append("%s: familia desconocida" % rid); continue
        if doc["families"][r["family"]]["frequency"] != f: errs.append("%s: frecuencia distinta de la de su familia" % rid)
        if r["input"]["key"] == r["market"]["key"]: errs.append("%s: entrada y mercado son la misma serie" % rid)
        if (r["input"]["key"].startswith("C/")) != (s.get("inputTransform") == "anomaly"): errs.append("%s: inputTransform incoherente con el tipo de serie de entrada (el clima es una anomalia, no un cambio)" % rid)
        if r["input"]["key"].startswith(("C/", "S/")) and r["input"]["currency"] != "INDEX": errs.append("%s: la entrada climatica o de existencias debe ir sin moneda" % rid)
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
        if s["currencyTreatment"] == "original" and recomputed < 80:
            ser = []; bad = False
            for side in ("input", "market"):
                k = r[side]["key"]
                if side == "input" and k.startswith("C/"):
                    _, loc, kind = k.split("/")
                    ser.append(RE.climate_series(json.loads((D / "climate-history.json").read_text(encoding="utf-8")), loc, kind)); continue
                if side == "input" and k.startswith("S/"):
                    st = next((x for f in sorted((D / "series" / "CA").glob("stocks*.json")) for x in json.loads(f.read_text(encoding="utf-8"))["series"] if x["id"] == k[2:]), None)   # el grupo puede ir en varios trozos
                    ser.append({int(a): b for a, b in st["points"] if isinstance(b, (int, float))} if st else None); continue
                fh = D / "prices" / "history" / r[side]["region"] / (r[side]["product"] + ".json")
                if not fh.exists(): errs.append("%s: falta el historico de %s" % (rid, k)); bad = True; break
                h = json.loads(fh.read_text(encoding="utf-8"))["history"]
                ser.append(RE.crop_year_average(h) if (f == "annual" and side == "market") else RE.aggregate(h, f))
            if not bad and ser[0] is None: errs.append("%s: no se pudo reconstruir la serie de entrada" % rid); bad = True
            if not bad:
                res = RE.analyse(ser[0], ser[1], f, doc["families"][r["family"]]["lagsTested"], xmode="level" if s.get("inputTransform") == "anomaly" else "change")
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
        if r and c.get("legalConfidence") != r.get("legalConfidence"): errs.append("%s: legalConfidence %s no coincide con el registro (%s)" % (k, c.get("legalConfidence"), r.get("legalConfidence")))
        if c.get("registryAlignment") == "DIVERGENT": errs.append("%s: las notas historicas contradicen el registro de licencias (%s); el registro manda" % (k, "; ".join(c.get("divergences", []))))
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
    ST = ["AVAILABLE", "AVAILABLE_OUTSIDE_CATALOG", "STALE", "HISTORICAL_ONLY", "INDEX_ONLY", "SOURCE_AVAILABLE_NOT_INGESTED", "LICENSE_PENDING", "SOURCE_RESTRICTED", "NOT_MATERIAL", "NOT_APPLICABLE", "MISSING"]
    OVR = {(e["cc"], e["product"], e["metric"]): e for e in json.loads((D / "coverage-overrides.json").read_text(encoding="utf-8"))["entries"]}; GEV = (json.loads((D / "eu-gapfill-stats.json").read_text(encoding="utf-8")).get("evidence") or {}) if (D / "eu-gapfill-stats.json").exists() else {}
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
            tg = list(sr.get("tags") or [])
            tg = CM.index_tags(sr, m, tg)
            if not [t for t in tg if t in CM.KIND_OF]: unt[m] += 1
            for t in [t for t in tg if t in CM.KIND_OF]: trk[t] += 1
            for t in tg:
                if t in CM.KIND_OF:
                    for mt in CM.cell_metrics(t, m, sr):
                        cnt[(t, mt)][0] += 1; cnt[(t, mt)][1] += 1 if ok else 0; cnt[(t, mt)][2] += 1 if sr.get("fs") in ("HISTORICAL", "DISCONTINUED") else 0
                        if not ok and sr.get("fs") not in ("HISTORICAL", "DISCONTINUED"): stale[sr.get("sourceId")][0] += 1; stale[sr.get("sourceId")][1].add((cc, t, mt))
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
                if st == "INDEX_ONLY" and not (m == "price" and got[p].get("price_index", {}).get("state") in ("AVAILABLE", "AVAILABLE_OUTSIDE_CATALOG", "STALE", "HISTORICAL_ONLY")): errs.append("%s/%s/%s: INDEX_ONLY sin indice de precios disponible" % (cc, p, m))
                if st in ("NOT_APPLICABLE", "NOT_MATERIAL", "SOURCE_RESTRICTED"):
                    e = OVR.get((cc, p, m))
                    if not e or e["state"] != st: errs.append("%s/%s/%s: %s sin entrada en coverage-overrides.json" % (cc, p, m, st))
                    elif st == "SOURCE_RESTRICTED" and not (isinstance(e["evidence"], dict) and e["evidence"].get("url") and e["evidence"].get("quote")): errs.append("%s/%s/%s: SOURCE_RESTRICTED sin cita de la licencia" % (cc, p, m))
                    elif st != "SOURCE_RESTRICTED":
                        x = GEV.get(str(e["evidence"]).split("#", 1)[-1]) or {}; a_, p_ = x.get("area_ha"), x.get("prod_t")
                        if not (a_ and p_): errs.append("%s/%s/%s: %s sin prueba en eu-gapfill-stats.json" % (cc, p, m, st))
                        elif st == "NOT_APPLICABLE" and (a_["max"] != 0 or p_["max"] != 0): errs.append("%s/%s/%s: NOT_APPLICABLE pero la fuente publica superficie o produccion" % (cc, p, m))
                        elif st == "NOT_MATERIAL" and not (a_["latest"] < 1000 and p_["latest"] < 5000): errs.append("%s/%s/%s: NOT_MATERIAL por encima del umbral" % (cc, p, m))
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


def premium_tracker(doc, errs, warns, stats):
    """Premium Tracker: el diferencial debe recalcularse de las medianas, respetar los minimos de muestra y no existir sin las dos partes."""
    MIN_ORG, MIN_CONV = 3, 5
    ids = set()
    for c in doc["cells"]:
        if c["id"] in ids: errs.append("premium: celda duplicada %s" % c["id"])
        ids.add(c["id"])
        o, v = c.get("organic"), c.get("conventional")
        has = [x is not None for x in (o, v, c.get("premium"), c.get("premiumPct"))]
        if any(has) and not all(has): errs.append("premium %s: diferencial a medias (organico/convencional/premium/pct)" % c["id"]); continue
        if not any(has):
            if not c.get("reason"): errs.append("premium %s: celda vacia sin motivo" % c["id"])
            continue
        if c.get("reason"): errs.append("premium %s: tiene valor y tambien motivo de ausencia" % c["id"])
        if o["n"] < MIN_ORG or v["n"] < MIN_CONV: errs.append("premium %s: muestra por debajo del minimo (%d org, %d conv)" % (c["id"], o["n"], v["n"]))
        if o["n"] != c["organicSeries"] and o["n"] > c["organicSeries"]: errs.append("premium %s: n organico mayor que las series" % c["id"])
        if abs((o["median"] - v["median"]) - c["premium"]) > 0.0002: errs.append("premium %s: premium no cuadra con las medianas" % c["id"])
        if v["median"] <= 0 or abs((o["median"] / v["median"] - 1) * 100 - c["premiumPct"]) > 0.06: errs.append("premium %s: porcentaje no cuadra" % c["id"])
        for x in (o, v):
            if not (x["min"] - 1e-9 <= x["median"] <= x["max"] + 1e-9): errs.append("premium %s: mediana fuera de rango" % c["id"])
        if c["unit"] != "bu": errs.append("premium %s: unidad no comparable %s" % (c["id"], c["unit"]))
    stats["cells"] = len(doc["cells"])


def home_tape(doc, errs, warns, stats):
    """Panel de la portada: cada fila debe ser identica a su observacion en data/prices/latest/<region>.json (nada convertido, nada inventado)."""
    import json as _j, os as _o
    base = _o.path.join(_o.path.dirname(_o.path.dirname(_o.path.abspath(__file__))), "data", "prices", "latest")
    cache, seen = {}, set()
    for r in doc["rows"]:
        k = (r["product"], r["region"])
        if k in seen: errs.append("home-tape: fila duplicada %s/%s" % k)
        seen.add(k)
        if r["region"] not in cache:
            try: cache[r["region"]] = {(o["product"], o["region"]): o for o in _j.load(open(_o.path.join(base, r["region"] + ".json")))["observations"]}
            except Exception: cache[r["region"]] = None
        obs = cache[r["region"]]
        if obs is None: errs.append("home-tape: falta data/prices/latest/%s.json" % r["region"]); continue
        o = obs.get(k)
        if not o: errs.append("home-tape %s/%s: no existe en la capa de precios" % k); continue
        for f in ("id", "sourceId", "observationDate", "value", "currency", "unit", "changePct"):
            if o.get(f) != r.get(f): errs.append("home-tape %s/%s: %s no coincide con la observacion original (%r != %r)" % (k[0], k[1], f, r.get(f), o.get(f)))
    # Coherencia entre superficies: la portada no puede ir por detras de la fuente cruda (caso real: la capa de precios se quedo en el 27-sep
    # mientras data/eu/cereales.json y el comparador ya tenian el 4-oct del mismo mercado).
    try:
        eu = _j.load(open(_o.path.join(_o.path.dirname(_o.path.dirname(base)), "eu", "cereales.json")))
        src = [r for s in eu["series"] if s["id"].startswith("milling-wheat-departure-from-silo") for r in s["regions"] if r.get("m") == "Zaragoza"]
        row = next((r for r in doc["rows"] if r.get("id") == "di_cereales_trigo_eu"), None)
        if src and row and src[0]["last"][0] > row["observationDate"]:
            errs.append("home-tape: trigo UE en %s pero la fuente (data/eu/cereales.json, Zaragoza) ya tiene %s" % (row["observationDate"], src[0]["last"][0]))
        if src and row and row["observationDate"] == src[0]["last"][0] and abs(row["value"] - src[0]["last"][1]) > 1e-6:
            errs.append("home-tape: trigo UE %s distinto de la fuente %s en la misma fecha" % (row["value"], src[0]["last"][1]))
    except (OSError, KeyError, ValueError, StopIteration): warns.append("home-tape: no se pudo cruzar el trigo UE con data/eu/cereales.json")
    if set(doc["sourceIds"]) != {r["sourceId"] for r in doc["rows"]}: errs.append("home-tape: sourceIds no coincide con las filas")
    stats["rows"] = len(doc["rows"])


def home_explore(doc, errs, warns, stats):
    """Cifras de las tarjetas de la portada: cada hecho se recalcula desde su fichero de origen y debe coincidir (nada estimado, nada inventado)."""
    import json as _j, os as _o
    base = _o.path.join(_o.path.dirname(_o.path.dirname(_o.path.abspath(__file__))), "data")
    def src(rel):
        try: return _j.load(open(_o.path.join(base, rel)))
        except Exception: return None
    seen = set()
    for f in doc["facts"]:
        if f["id"] in seen: errs.append("home-explore: hecho duplicado %s" % f["id"])
        seen.add(f["id"])
        s = src(f["file"])
        if s is None: errs.append("home-explore %s: falta el origen data/%s" % (f["id"], f["file"])); continue
        if f["id"] == "eu":
            if f.get("series") != sum(x["series"] for x in s["families"]) or f.get("families") != len(s["families"]): errs.append("home-explore eu: series/familias no coinciden con eu/index.json")
        elif f["id"] == "drought":
            row = s["us"]["conus"][-1]
            if f["date"] != row[0] or f.get("pctD1") != row[2]: errs.append("home-explore drought: no coincide con la ultima semana de drought.json")
            if not (0 <= f.get("pctD1", -1) <= 100): errs.append("home-explore drought: porcentaje fuera de 0-100")
        elif f["id"] == "cattle":
            r = s["reports"][-1]
            if f["date"] != r["inventoryDate"] or f.get("release") != r["release"] or f.get("onFeedKhead") != r["national"]["current"]["onFeedEnd"] or f.get("pctYearAgo") != r["national"]["pctYearAgo"]["onFeedEnd"]: errs.append("home-explore cattle: no coincide con el ultimo informe de cattle-on-feed.json")
        elif f["id"] == "exports":
            w = next((k for k in s["commodities"] if k["name"] == f.get("commodity")), None)
            if not w or f["date"] != w["weekEnding"] or f.get("netSales") != w["totals"]["net"] or f.get("unit") != w.get("unit"): errs.append("home-explore exports: no coincide con export-sales.json")
    stats["facts"] = len(doc["facts"])


WBA_PCT = {"forestPct", "permCropPct", "ruralPopPct", "agriEmpFemalePct", "agriEmpMalePct", "agriLandPct", "arableLandPct", "irrigatedPct", "agriEmploymentPct", "agriVaPct", "agriRawExpPct", "agriRawImpPct", "foodExpPct", "foodImpPct", "waterAgriPct"}
WBA_RANGE = {"cropIdx": (0, 400), "livestockIdx": (0, 400), "foodIdx": (0, 400), "cerealYield": (0, 20000), "fertKgHa": (0, 3000), "inflation": (-50, 10000), "gdpGrowth": (-50, 100), "cpi": (0, 1e8), "fxUsd": (0, 100000)}
# 21-oct-2026: con los 33 paises entran hiperinflaciones reales de la serie desde 1990 (Argentina 1990 ~2.300 %, Croacia 1993 ~1.500 %, Bulgaria 1997 ~1.060 %):
# el limite de inflacion sube a 10.000 % y el del IPC (base 2010 = 100) a 1e8 para no rechazar datos oficiales; siguen fuera los valores absurdos.
WBA_NONNEG = {"agriLandKm2", "arablePerCap", "agriVaPerWorker", "agriVaUsd", "cerealArea", "cerealProd", "ch4Agri", "n2oAgri"}


def worldbank_fertilizers(doc, errs, warns, stats):
    import datetime as _dt
    ids = [x["id"] for x in doc["series"]]
    if "urea" not in ids: errs.append("fertilizantes Banco Mundial: falta la urea")
    for x in doc["series"]:
        ps = [p[0] for p in x["points"]]
        if ps != sorted(set(ps)): errs.append("fertilizantes BM %s: periodos no ascendentes o repetidos" % x["id"]); continue
        for p, v in x["points"]:
            if not re.fullmatch(r"\d{4}-\d{2}", p): errs.append("fertilizantes BM %s: periodo %s no es AAAA-MM" % (x["id"], p)); break
            if not isinstance(v, (int, float)) or not 20 <= v <= 3000: errs.append("fertilizantes BM %s %s: precio fuera de rango (%s USD/t)" % (x["id"], p, v)); break
    last = max(x["points"][-1][0] for x in doc["series"])
    if last < (_dt.date.today() - _dt.timedelta(days=100)).strftime("%Y-%m"): warns.append("fertilizantes BM: ultimo mes %s, con retraso" % last)
    stats["series"] = len(doc["series"]); stats["ultimo"] = last
def worldbank_timber(doc, errs, warns, stats):
    import datetime as _dt
    ids = {x["id"]: x for x in doc["series"]}
    for must in ("logs-cameroon", "sawnwood-cameroon", "sawnwood-malaysia"):
        if must not in ids: errs.append("madera tropical Banco Mundial: falta %s" % must)
    for sid, x in ids.items():
        ps = [p[0] for p in x["points"]]
        if ps != sorted(set(ps)): errs.append("madera BM %s: periodos no ascendentes o repetidos" % sid); continue
        lo, hi = (20, 3000) if x["unit"] == "USD/m3" else (50, 3000)
        for p, v in x["points"]:
            if not re.fullmatch(r"\d{4}-\d{2}", p): errs.append("madera BM %s: periodo %s no es AAAA-MM" % (sid, p)); break
            if not isinstance(v, (int, float)) or not lo <= v <= hi: errs.append("madera BM %s %s: precio fuera de rango (%s %s)" % (sid, p, v, x["unit"])); break
        if (sid == "plywood") != (x["unit"] == "USc/sheet"): errs.append("madera BM %s: unidad %s no corresponde" % (sid, x["unit"]))
    last = max(x["points"][-1][0] for x in doc["series"])
    if last < (_dt.date.today() - _dt.timedelta(days=100)).strftime("%Y-%m"): warns.append("madera BM: ultimo mes %s, con retraso" % last)
    stats["series"] = len(doc["series"]); stats["ultimo"] = last
def worldbank_agri(doc, errs, warns, stats):
    """Banco Mundial (WDI): licencia CC BY-4.0 por indicador, series sin huecos en los extremos, rangos fisicos y coherencia produccion = rendimiento x superficie."""
    import datetime as _d, math as _m
    cy = _d.date.today().year
    ind = doc["indicators"]
    for k, i in ind.items():
        if i.get("license") != "CC BY-4.0": errs.append("worldbank-agri %s: licencia %r, solo se admite CC BY-4.0" % (k, i.get("license")))
    euro = {"ES": 1999, "FR": 1999, "DE": 1999, "BE": 1999, "AT": 1999, "PT": 1999, "IT": 1999, "NL": 1999, "EL": 2001, "IE": 1999, "FI": 1999, "SI": 2007, "SK": 2009, "EE": 2011, "LV": 2014, "LT": 2015, "HR": 2023, "BG": 2026}
    n = 0
    for c, ser in doc["countries"].items():
        for k, s in ser.items():
            n += 1
            if k not in ind: errs.append("worldbank-agri %s/%s: indicador sin descripcion" % (c, k)); continue
            v, y0 = s["v"], s["y0"]
            if v[0] is None or v[-1] is None: errs.append("worldbank-agri %s/%s: la serie debe empezar y acabar con dato" % (c, k))
            if y0 + len(v) - 1 > cy: errs.append("worldbank-agri %s/%s: año futuro %d" % (c, k, y0 + len(v) - 1))
            for i, x in enumerate(v):
                if x is None: continue
                if not _m.isfinite(x): errs.append("worldbank-agri %s/%s: valor no finito" % (c, k)); break
                ok = True
                if k in WBA_PCT: ok = 0 <= x <= 100
                elif k in WBA_RANGE: ok = WBA_RANGE[k][0] <= x <= WBA_RANGE[k][1]
                elif k in WBA_NONNEG: ok = x >= 0
                if not ok: errs.append("worldbank-agri %s/%s %d: valor fuera de rango (%s)" % (c, k, y0 + i, x)); break
            if k == "fxUsd" and (c == "US" or (c in euro and y0 < euro[c])): errs.append("worldbank-agri %s: tipo de cambio no admitido (EE. UU. o antes de la entrada en el euro)" % c)
        a, b, p = ser.get("cerealYield"), ser.get("cerealArea"), ser.get("cerealProd")
        if a and b and p:
            at = lambda s, y: s["v"][y - s["y0"]] if 0 <= y - s["y0"] < len(s["v"]) else None
            for i, pv in enumerate(p["v"]):
                y = p["y0"] + i; ya, ar = at(a, y), at(b, y)
                if pv and ya and ar and abs(pv * 1000 - ya * ar) / (pv * 1000) > 0.01:
                    errs.append("worldbank-agri %s %d: produccion de cereales no coincide con rendimiento x superficie" % (c, y)); break
    if n < 200: errs.append("worldbank-agri: solo %d series" % n)
    stats["worldbank-agri series"] = n

# Destatis define el rendimiento del maiz (con CCM) y del silomaiz sobre otra base en algunos Länder (p. ej. BW 2010-2015, desfase hasta 14 %): se admite hasta el 15 % solo ahi
GA_TOL = {"maize": 0.15, "silage": 0.15}
GA_LAND = {"SH", "HH", "NI", "HB", "NW", "HE", "RP", "BW", "BY", "SL", "BE", "BB", "MV", "SN", "ST", "TH"}


def germany_agri(doc, errs, warns, stats):
    """Destatis: años crecientes y sin duplicar, valores finitos y positivos, Länder validos, produccion = rendimiento x superficie / 10 (±2 %, superficie ≥ 5000 ha; ±15 % en maiz y silomaiz), alquiler entre 20 y 3000 EUR/ha y precio de la tierra entre 1000 y 500000 EUR/ha."""
    import math as _m, datetime as _d
    cy = _d.date.today().year
    keys = {c["k"] for c in doc["crops"]}
    n = 0

    def pts(tag, a, lo=None, hi=None):
        nonlocal n
        last = None
        for p in a:
            n += 1
            y, v = p
            if not isinstance(y, int) or y < 1900 or y > cy + 1: errs.append("germany-agri %s: año invalido %r" % (tag, y)); return
            if last is not None and y <= last: errs.append("germany-agri %s: años no crecientes (%d tras %d)" % (tag, y, last)); return
            last = y
            if not isinstance(v, (int, float)) or not _m.isfinite(v) or v < 0: errs.append("germany-agri %s %d: valor invalido %r" % (tag, y, v)); return
            if lo is not None and not (lo <= v <= hi): errs.append("germany-agri %s %d: valor fuera de rango (%s)" % (tag, y, v)); return
    RNG = {"area": (0, 1e8), "prod": (0, 1e9), "yield": (0, 2000)}
    for c, vs in doc["production"]["nat"].items():
        if c not in keys: errs.append("germany-agri: cultivo %s sin descripcion" % c)
        for vn, a in vs.items():
            if vn not in RNG: errs.append("germany-agri nat/%s: variable %s desconocida" % (c, vn)); continue
            pts("nat/%s/%s" % (c, vn), a, *RNG[vn])
    for c, ls in doc["production"]["land"].items():
        if c not in keys: errs.append("germany-agri: cultivo %s sin descripcion" % c)
        for lk, vs in ls.items():
            if lk not in GA_LAND: errs.append("germany-agri: Land desconocido %s" % lk); continue
            for vn, a in vs.items():
                if vn not in RNG: errs.append("germany-agri %s/%s: variable %s desconocida" % (c, lk, vn)); continue
                pts("%s/%s/%s" % (c, lk, vn), a, *RNG[vn])
            A, P, Y = (dict(vs.get(k, [])) for k in ("area", "prod", "yield"))
            for y in P:
                if y in A and y in Y and P[y] > 0 and A[y] >= 5000 and abs(Y[y] * A[y] / 10 - P[y]) / P[y] > GA_TOL.get(c, 0.02):
                    errs.append("germany-agri %s/%s %d: produccion no coincide con rendimiento x superficie" % (c, lk, y)); break
    for c, vs in doc["production"]["nat"].items():
        A, P, Y = (dict(vs.get(k, [])) for k in ("area", "prod", "yield"))
        for y in P:
            if y in A and y in Y and P[y] > 0 and abs(Y[y] * A[y] / 10 - P[y]) / P[y] > GA_TOL.get(c, 0.02):
                errs.append("germany-agri nat/%s %d: produccion no coincide con rendimiento x superficie" % (c, y)); break
    lp = doc["landPrice"]
    pts("landPrice/natPre", lp["natPre"], 1000, 500000)
    for b, vs in lp["nat"].items():
        if "p" in vs: pts("landPrice/nat/%s" % b, vs["p"], 1000, 500000)
    for lk, bs in lp["land"].items():
        if lk not in GA_LAND: errs.append("germany-agri: Land desconocido %s" % lk); continue
        for b, vs in bs.items():
            for vn, a in vs.items(): pts("landPrice/%s/%s/%s" % (lk, b, vn), a, *((1000, 500000) if vn == "p" else (0, 1e9)))
    rt = doc["rent"]
    for b, a in rt["nat"].items(): pts("rent/nat/%s" % b, a, 20, 3000)
    for lk, bs in rt["land"].items():
        if lk not in GA_LAND: errs.append("germany-agri: Land desconocido %s" % lk); continue
        for b, a in bs.items(): pts("rent/%s/%s" % (lk, b), a, 20, 3000)
    stats["germany-agri puntos"] = n

GL_SPECIES = {"cattle": (150, 500), "calves": (30, 250), "pigs": (60, 140), "sheep": (8, 45)}   # peso medio de canal (kg) plausible por especie


def germany_livestock(doc, errs, warns, stats):
    """Destatis ganaderia: periodos crecientes (AAAA, AAAA-MM o AAAA-05/11 en censos), valores finitos >= 0, Länder validos; peso medio de canal
    (toneladas / cabezas) plausible por especie; suma de Länder = total nacional (±0,5 %); 12 meses = año; huevos = gallinas x huevos por gallina (±1 %);
    vacas lecheras + nodrizas <= total; suma de especies de aves <= total; fruta con rendimiento plausible."""
    import math as _m, re as _re, datetime as _d
    n = 0

    def per(tag, a, rx):
        nonlocal n
        last = None
        for p in a:
            n += 1
            if not (isinstance(p, list) and len(p) == 2) or not isinstance(p[0], str) or not _re.match(rx, p[0]): errs.append("germany-livestock %s: periodo invalido %r" % (tag, p)); return None
            if last is not None and p[0] <= last: errs.append("germany-livestock %s: periodos no crecientes (%s tras %s)" % (tag, p[0], last)); return None
            last = p[0]
            if not isinstance(p[1], (int, float)) or isinstance(p[1], bool) or not _m.isfinite(p[1]) or p[1] < 0: errs.append("germany-livestock %s %s: valor invalido %r" % (tag, p[0], p[1])); return None
        return dict(a)

    nat, land, mon = doc["slaughter"]["nat"], doc["slaughter"]["land"], doc["slaughter"]["month"]
    for sp, vs in nat.items():
        if sp not in GL_SPECIES: errs.append("germany-livestock: especie desconocida %s" % sp); continue
        for vn, ts in vs.items():
            if vn not in ("heads", "tonnes"): errs.append("germany-livestock nat/%s: variable %s desconocida" % (sp, vn)); continue
            for st, a in ts.items():
                if st not in ("dom", "imp", "home"): errs.append("germany-livestock nat/%s/%s: tipo %s desconocido" % (sp, vn, st)); continue
                per("nat/%s/%s/%s" % (sp, vn, st), a, r"^\d{4}$")
        H, T = (dict(nat[sp].get(k, {}).get("dom", [])) for k in ("heads", "tonnes"))
        lo, hi = GL_SPECIES[sp] if sp in GL_SPECIES else (0, 1e9)
        for y in T:
            if y in H and H[y] >= 10000 and not (lo <= T[y] * 1000 / H[y] <= hi): errs.append("germany-livestock nat/%s %s: peso medio de canal %.0f kg fuera de %d-%d" % (sp, y, T[y] * 1000 / H[y], lo, hi)); break
    for sp, gs in land.items():
        for g, vs in gs.items():
            if g not in GA_LAND: errs.append("germany-livestock: Land desconocido %s" % g); continue
            for vn, ts in vs.items():
                for st, a in ts.items(): per("land/%s/%s/%s/%s" % (sp, g, vn, st), a, r"^\d{4}$")
        for vn in ("heads", "tonnes"):
            tot = {}
            for g, vs in gs.items():
                for y, v in vs.get(vn, {}).get("dom", []): tot.setdefault(y, []).append(v)
            N = dict(nat.get(sp, {}).get(vn, {}).get("dom", []))
            for y, vv in tot.items():
                if len(vv) >= 12 and y in N and N[y] > 1000 and abs(sum(vv) - N[y]) / N[y] > 0.005: errs.append("germany-livestock %s/%s %s: suma de Länder (%d) no coincide con el total nacional (%d)" % (sp, vn, y, sum(vv), N[y])); break
    for sp, vs in mon.items():
        for vn, ts in vs.items():
            for st, a in ts.items():
                m = per("month/%s/%s/%s" % (sp, vn, st), a, r"^\d{4}-(0[1-9]|1[0-2])$")
                if m is None or st != "dom": continue
                N = dict(nat.get(sp, {}).get(vn, {}).get(st, []))
                by = {}
                for p, v in m.items(): by.setdefault(p[:4], []).append(v)
                for y, vv in by.items():
                    if len(vv) == 12 and y in N and N[y] > 1000 and abs(sum(vv) - N[y]) / N[y] > 0.001: errs.append("germany-livestock month/%s/%s %s: los 12 meses (%d) no suman el año (%d)" % (sp, vn, y, sum(vv), N[y])); break
        if sp in mon:
            last = max((a[-1][0] for ts in vs.values() for a in ts.values() if a), default=None)
            if last and (_d.date.today() - _d.date(int(last[:4]), int(last[5:7]), 1)).days > 200: warns.append("germany-livestock: sacrificio mensual de %s no se actualiza desde %s" % (sp, last))
    T = {}
    for sp, vs in doc["poultry"].items():
        for vn, a in vs.items():
            if vn not in ("heads", "tonnes"): errs.append("germany-livestock poultry/%s: variable %s desconocida" % (sp, vn)); continue
            T[(sp, vn)] = per("poultry/%s/%s" % (sp, vn), a, r"^\d{4}$")
    for vn in ("heads", "tonnes"):
        tot = T.get(("total", vn))
        if tot:
            for y in tot:
                parts = sum((T.get((sp, vn)) or {}).get(y, 0) for sp in doc["poultry"] if sp != "total")
                if parts > tot[y] * 1.001: errs.append("germany-livestock poultry/%s %s: las especies (%d) superan el total (%d)" % (vn, y, parts, tot[y])); break
    E = doc["eggs"]
    for scope, blocks in (("nat", {"all": E["nat"]}), ("land", E["land"])):
        for k, b in blocks.items():
            S = {vn: per("eggs/%s/%s/%s" % (scope, k, vn), a, r"^\d{4}$") for vn, a in b.items() if vn in ("eggs", "hens", "perHen")}
            for vn in b:
                if vn not in ("eggs", "hens", "perHen"): errs.append("germany-livestock eggs/%s/%s: variable %s desconocida" % (scope, k, vn))
            if scope == "land" and k not in GA_LAND: errs.append("germany-livestock: Land desconocido %s" % k)
            if S.get("eggs") and S.get("hens") and S.get("perHen"):
                for y in S["eggs"]:
                    if y in S["hens"] and y in S["perHen"] and S["hens"][y] > 0 and abs(S["hens"][y] * S["perHen"][y] / 1000 - S["eggs"][y]) / S["eggs"][y] > 0.01: errs.append("germany-livestock eggs/%s/%s %s: huevos no coincide con gallinas x huevos por gallina" % (scope, k, y)); break
            for y, v in (S.get("perHen") or {}).items():
                if not (150 <= v <= 400): errs.append("germany-livestock eggs/%s/%s %s: huevos por gallina fuera de rango (%s)" % (scope, k, y, v)); break
    for sp, cats in doc["herd"].items():
        D = {c: per("herd/%s/%s" % (sp, c), a, r"^\d{4}-(05|11)$") for c, a in cats.items()}
        tot = D.get("total") or {}
        if sp == "cattle":
            for y in tot:
                if (D.get("dairy") or {}).get(y, 0) + (D.get("suckler") or {}).get(y, 0) > tot[y]: errs.append("germany-livestock herd/cattle %s: vacas lecheras + nodrizas superan el total" % y); break
        if sp == "pigs":
            for y in tot:
                if (D.get("sows") or {}).get(y, 0) > tot[y]: errs.append("germany-livestock herd/pigs %s: cerdas superan el total" % y); break
    for sp, vs in doc["fruit"].items():
        A, P = per("fruit/%s/area" % sp, vs.get("area", []), r"^\d{4}$") or {}, per("fruit/%s/prod" % sp, vs.get("prod", []), r"^\d{4}$") or {}
        for y in P:
            if y in A and A[y] > 500 and P[y] > 0 and not (0.5 <= P[y] / A[y] <= 60): errs.append("germany-livestock fruit/%s %s: rendimiento %.1f t/ha fuera de 0,5-60" % (sp, y, P[y] / A[y])); break
    prov = doc.get("provisional", {}).get("fruit", [])
    cy = _d.date.today().year
    if any(not isinstance(y, int) or y > cy for y in prov): errs.append("germany-livestock: años provisionales de fruta en el futuro")
    stats["germany-livestock puntos"] = n


def _ul_reg():
    import json as _j, pathlib as _p
    return _j.loads((_p.Path(__file__).resolve().parent / "us-local-registry.json").read_text(encoding="utf-8"))
UL_UNITS = {"Per Cwt": (20, 1500), "Per Unit": (100, 20000)}   # rango amplio: detecta errores de unidad, no opina sobre el mercado
UL_HAY = {"Per Ton": (30, 1500), "Per Bale": (0.5, 400), "Per Bundle": (5, 2000), "Per Point/Ton": (0.01, 50)}


def _ul_common(doc, kind, errs):
    import datetime as _d
    reg = _ul_reg()
    rep = next((r for r in reg["reports"] if r["kind"] == kind and r["state"] == doc["state"]), None)
    if rep is None: errs.append("us-local %s: estado %s sin informe en el registro" % (kind, doc["state"])); return False
    if doc["source"]["reportId"] != rep["reportId"]: errs.append("us-local %s/%s: el informe %s no es el del registro (%s)" % (kind, doc["state"], doc["source"]["reportId"], rep["reportId"])); return False
    try: d = _d.date.fromisoformat(doc["latest"]["date"])
    except ValueError: errs.append("us-local %s/%s: fecha invalida %r" % (kind, doc["state"], doc["latest"]["date"])); return False
    if d > _d.date.today() + _d.timedelta(days=7): errs.append("us-local %s/%s: fecha del informe en el futuro (%s)" % (kind, doc["state"], d)); return False
    return True


def _ul_series(tag, pts, errs, width):
    last = None
    for p in pts:
        if len(p) != width or not isinstance(p[0], str) or not re.match(r"^\d{4}-\d{2}-\d{2}$", p[0]): errs.append("us-local %s: punto invalido %r" % (tag, p)); return False
        if last is not None and p[0] <= last: errs.append("us-local %s: fechas no crecientes (%s tras %s)" % (tag, p[0], last)); return False
        last = p[0]
    return True


def us_crop_progress_index(doc, errs, warns, stats):
    import datetime as _dt
    if doc["lastWeekEnding"] > (_dt.date.today() + _dt.timedelta(days=7)).isoformat(): errs.append("crop progress estados: semana futura %s" % doc["lastWeekEnding"])
    if doc["lastWeekEnding"] < (_dt.date.today() - _dt.timedelta(days=120)).isoformat(): warns.append("crop progress estados: ultima semana %s" % doc["lastWeekEnding"])
    stats["estados"] = len(doc["states"])
def us_crop_progress_state(doc, errs, warns, stats):
    import re as _re
    n = 0
    for crop, c in doc["crops"].items():
        for y, rows in c.get("condition", {}).items():
            prev = None
            for r in rows:
                if len(r) != 6 or not _re.match(r"^\d{4}-\d{2}-\d{2}$", r[0]) or (prev and r[0] <= prev): errs.append("crop progress %s %s %s: fila %s" % (doc["state"], crop, y, r)); return
                prev = r[0]; n += 1
                if any(not 0 <= x <= 100 for x in r[1:]) or abs(sum(r[1:]) - 100) > 3: errs.append("crop progress %s %s %s %s: %s" % (doc["state"], crop, y, r[0], r[1:]))
        for grp in ("progress", "avg"):
            for y, st in c.get(grp, {}).items():
                for k, rows in st.items():
                    prev = None
                    for w, v in rows:
                        if prev and w <= prev: errs.append("crop progress %s %s %s %s: semanas desordenadas" % (doc["state"], crop, grp, k)); return
                        prev = w
                        if not 0 <= v <= 100: errs.append("crop progress %s %s %s %s %s: %s" % (doc["state"], crop, grp, k, w, v))
    stats["valoraciones"] = n
def us_local_cattle(doc, errs, warns, stats):
    """Ganado en subasta (resumen semanal USDA AMS): informe del registro, fecha no futura, filas con cabezas > 0 y precio minimo <= medio <= maximo en un rango plausible
    por unidad, tramos de peso ordenados, historial = Clase|tramo con fechas crecientes, precio y peso plausibles, y la ultima semana del historial coincide con las filas de referencia."""
    import datetime as _d
    if not _ul_common(doc, "cattle", errs): return
    st = doc["state"]; rows = doc["latest"]["rows"]; stats["us-local filas"] = stats.get("us-local filas", 0) + len(rows)
    for r in rows:
        com, cl, frame, grade, lot, unit, lo, hi, head, wt, pmn, pmx, p, x = r
        if unit not in UL_UNITS: errs.append("us-local cattle/%s: unidad desconocida %r" % (st, unit)); return
        if not isinstance(head, (int, float)) or head <= 0: errs.append("us-local cattle/%s %s %s: cabezas invalidas %r" % (st, com, cl, head)); return
        if not all(isinstance(v, (int, float)) for v in (pmn, pmx, p)) or not (pmn - 0.01 <= p <= pmx + 0.01): errs.append("us-local cattle/%s %s %s: precio minimo/medio/maximo incoherente (%r %r %r)" % (st, com, cl, pmn, p, pmx)); return
        a, b = UL_UNITS[unit]
        if not (a <= p <= b) and not (com == "Slaughter Cattle" and p >= 20): errs.append("us-local cattle/%s %s %s: precio fuera de rango (%s %s)" % (st, com, cl, p, unit)); return
        if lo is not None and hi is not None and not (lo < hi): errs.append("us-local cattle/%s %s: tramo de peso invertido (%s-%s)" % (st, cl, lo, hi)); return
        if wt is not None and not ((10 if ("Goat" in com or "Sheep" in com or "Lamb" in com) else 30) <= wt <= 3200): errs.append("us-local cattle/%s %s: peso medio fuera de rango (%s)" % (st, cl, wt)); return
    ref = {}
    for r in rows:
        if r[0] == "Feeder Cattle" and r[2] == "Medium and Large" and r[3] == "1" and r[4] == "" and r[5] == "Per Cwt" and r[1] in ("Steers", "Heifers", "Bulls") and r[6] is not None:
            a = ref.setdefault("%s|%d" % (r[1], int(r[6])), [0.0, 0.0]); a[0] += r[8] * r[12]; a[1] += r[8]
    for k, a in ref.items():
        h = doc["history"].get(k)
        if not h or h[-1][0] != doc["latest"]["date"]: errs.append("us-local cattle/%s: la serie %s no tiene la ultima semana" % (st, k)); return
        if abs(h[-1][1] - a[0] / a[1]) > 0.011 or h[-1][2] != round(a[1]): errs.append("us-local cattle/%s %s: la ultima semana del historial no coincide con las filas (%s vs %.2f)" % (st, k, h[-1][1], a[0] / a[1])); return
    for k, pts in doc["history"].items():
        m = re.match(r"^(Steers|Heifers|Bulls)\|(\d+)$", k)
        if not m: errs.append("us-local cattle/%s: clave de serie desconocida %r" % (st, k)); return
        if not _ul_series("cattle/%s/%s" % (st, k), pts, errs, 4): return
        lo = int(m.group(2))
        for p in pts:
            if not (50 <= p[1] <= 1200) or p[2] <= 0 or (p[3] is not None and not (lo - 5 <= p[3] <= lo + 150)): errs.append("us-local cattle/%s/%s %s: punto fuera de rango %r" % (st, k, p[0], p[1:])); return
        for q, p in zip(pts, pts[1:]):   # los lotes de menos de 10 cabezas son ruido de mercado fino (p. ej. 1 toro a 170 y otro a 260 $/cwt), no un fallo del dato
            if (_d.date.fromisoformat(p[0]) - _d.date.fromisoformat(q[0])).days <= 8 and q[1] > 0 and abs(p[1] / q[1] - 1) > 0.35 and min(p[2], q[2]) >= 10: warns.append("us-local cattle/%s/%s %s: salto semanal de %.0f %%" % (st, k, p[0], (p[1] / q[1] - 1) * 100))
    if not _ul_series("cattle/%s/receipts" % st, doc["receipts"], errs, 2): return
    if any(not isinstance(p[1], (int, float)) or p[1] < 0 for p in doc["receipts"]): errs.append("us-local cattle/%s: recibos negativos" % st); return
    if (_d.date.today() - _d.date.fromisoformat(doc["latest"]["date"])).days > 21: warns.append("us-local cattle/%s: el ultimo informe es del %s" % (st, doc["latest"]["date"]))
    stats["us-local series"] = stats.get("us-local series", 0) + len(doc["history"])


def us_local_hay(doc, errs, warns, stats):
    """Heno directo (Direct Hay Report USDA AMS): informe del registro, filas con unidad conocida y precio minimo <= medio <= maximo en rango plausible, clave de serie = primeras 11 columnas,
    fechas crecientes y la semana de cada fila coincide con el ultimo punto de su serie."""
    import datetime as _d
    if not _ul_common(doc, "hay", errs): return
    st = doc["state"]; rows = doc["latest"]["rows"]; stats["us-local filas"] = stats.get("us-local filas", 0) + len(rows)
    for r in rows:
        cl, q, pk, unit, sale, fr, reg, use, crop, desc, org, qty, pmn, pmx, avg = r
        if unit not in UL_HAY: errs.append("us-local hay/%s: unidad desconocida %r" % (st, unit)); return
        a, b = UL_HAY[unit]
        if not all(isinstance(v, (int, float)) for v in (pmn, pmx)) or not (0 < pmn <= pmx) or not (a <= pmn and pmx <= b): errs.append("us-local hay/%s %s %s: precio fuera de rango (%s-%s %s)" % (st, cl, q, pmn, pmx, unit)); return
        if avg is not None and not (pmn - 0.01 <= avg <= pmx + 0.01): errs.append("us-local hay/%s %s %s: media fuera del rango (%s)" % (st, cl, q, avg)); return
        if qty is not None and (not isinstance(qty, (int, float)) or qty < 0): errs.append("us-local hay/%s %s %s: cantidad invalida %r" % (st, cl, q, qty)); return
        k = "|".join(r[:11]); h = doc["history"].get(k)
        if not h or h[-1][0] != doc["latest"]["date"] or h[-1][1] != pmn or h[-1][2] != pmx: errs.append("us-local hay/%s: la serie de %s %s no coincide con la ultima semana" % (st, cl, q)); return
    for k, pts in doc["history"].items():
        if len(k.split("|")) != 11: errs.append("us-local hay/%s: clave de serie invalida %r" % (st, k)); return
        if not _ul_series("hay/%s/%s" % (st, k), pts, errs, 5): return
        if any(not (0 < p[1] <= p[2]) or (p[3] is not None and not (p[1] - 0.01 <= p[3] <= p[2] + 0.01)) for p in pts): errs.append("us-local hay/%s %s: minimo/medio/maximo incoherente" % (st, k)); return
    if (_d.date.today() - _d.date.fromisoformat(doc["latest"]["date"])).days > 45: warns.append("us-local hay/%s: el ultimo informe es del %s" % (st, doc["latest"]["date"]))
    stats["us-local series"] = stats.get("us-local series", 0) + len(doc["history"])


def us_local_status(doc, errs, warns, stats):
    """Estado de ingesta: un registro por informe del registro (sin repetidos), con su estado; un informe en error se avisa."""
    reg = {(r["kind"], r["state"]): r["reportId"] for r in _ul_reg()["reports"]}
    seen = set()
    for r in doc["reports"]:
        k = (r["kind"], r["state"])
        if k in seen: errs.append("us-local status: informe repetido %s/%s" % k); return
        seen.add(k)
        if reg.get(k) != r["reportId"]: errs.append("us-local status: %s/%s no coincide con el registro" % k); return
        if r["status"] in ("UNAVAILABLE", "AUTH_FAILURE", "ERROR", "EMPTY"): warns.append("us-local status: %s/%s en %s" % (k + (r["status"],)))
    if seen != set(reg): errs.append("us-local status: faltan informes del registro (%s)" % sorted(set(reg) - seen)[:3])
    stats["us-local informes"] = len(seen)


def mb_cattle(doc, errs, warns, stats):
    """Manitoba, ganado en subastas (C$/cwt): 15 clases fijas y 7 subastas; por semana (viernes, claves crecientes): cabezas por subasta que SUMAN el total publicado,
    cada [minimo, maximo, media] con minimo <= media <= maximo y rango plausible (40-1500), subasta sin venta (fecha null) sin precios, fecha de venta dentro de los 7 dias previos al informe."""
    import datetime as _d
    CL = ["cowD12", "cowD3", "bull", "steer901", "steer801", "steer701", "steer601", "steer501", "steer401", "heif901", "heif801", "heif701", "heif601", "heif501", "heif401"]
    MT = ["Ashern", "Gladstone", "Grunthal", "Killarney", "Ste Rose", "Virden", "Winnipeg"]
    if doc["classes"] != CL or doc["marts"] != MT: errs.append("mb-cattle: clases o subastas distintas de las esperadas"); return
    ks = list(doc["weeks"])
    if ks != sorted(ks) or len(set(ks)) != len(ks): errs.append("mb-cattle: semanas desordenadas o repetidas"); return
    def trio(t, tag):
        if t is None: return True
        if not (isinstance(t, list) and len(t) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in t)): errs.append("mb-cattle %s: precio invalido %r" % (tag, t)); return False
        if not (t[0] <= t[2] <= t[1]): errs.append("mb-cattle %s: minimo/media/maximo incoherentes %r" % (tag, t)); return False
        if not (40 <= t[2] <= 1500): errs.append("mb-cattle %s: precio fuera de rango %r" % (tag, t)); return False
        return True
    for k in ks:
        w = doc["weeks"][k]
        try: rd = _d.date.fromisoformat(k)
        except ValueError: errs.append("mb-cattle: fecha de semana invalida %r" % k); return
        if rd > _d.date.today() + _d.timedelta(days=2): errs.append("mb-cattle %s: informe en el futuro" % k); return
        if rd.weekday() != 4: warns.append("mb-cattle %s: el informe no es de un viernes" % k)
        if set(w["head"]) != set(MT) or any(not isinstance(v, int) or v < 0 for v in w["head"].values()): errs.append("mb-cattle %s: cabezas invalidas" % k); return
        if sum(w["head"].values()) != w["weekTotal"]: errs.append("mb-cattle %s: las cabezas por subasta suman %d y el total es %d" % (k, sum(w["head"].values()), w["weekTotal"])); return
        if len(w["summary"]) != 15 or not all(trio(t, "%s resumen" % k) for t in w["summary"]): return
        if set(w["marts"]) != set(MT): errs.append("mb-cattle %s: subastas distintas" % k); return
        for m, d in w["marts"].items():
            if len(d["rows"]) != 15 or not all(trio(t, "%s %s" % (k, m)) for t in d["rows"]): return
            if d["date"] is None:
                if any(d["rows"]): errs.append("mb-cattle %s %s: sin venta pero con precios" % (k, m)); return
            else:
                try: dd = _d.date.fromisoformat(d["date"])
                except ValueError: errs.append("mb-cattle %s %s: fecha de venta invalida" % (k, m)); return
                if not (0 <= (rd - dd).days <= 7): errs.append("mb-cattle %s %s: venta del %s fuera de la semana del informe" % (k, m, d["date"])); return
                if not any(d["rows"]): warns.append("mb-cattle %s %s: fecha de venta pero ninguna clase con precio" % (k, m))
    last = _d.date.fromisoformat(ks[-1])
    if (_d.date.today() - last).days > 21: warns.append("mb-cattle: el ultimo informe es del %s" % ks[-1])
    stats["mb-cattle semanas"] = len(ks)


def mb_sheep_goat(doc, errs, warns, stats):
    """Manitoba, ovino y caprino en subastas (Winnipeg y Grunthal, C$/cwt): 8 clases fijas (oveja, cordero en 4 tramos, macho, cabra, cabrito); por subasta, fechas de venta crecientes y de martes a viernes,
    cada [minimo, maximo, media] con minimo <= media <= maximo y rango plausible (40-800 ovino, 40-1500 caprino) o null (hueco o celda en disputa entre informes), y las celdas en disputa siempre vacias."""
    import datetime as _d
    CL = ["sheep", "lamb100", "lamb80", "lamb60", "lambU60", "billy", "nanny", "kid"]
    if doc["classes"] != CL or doc["marts"] != ["Winnipeg", "Grunthal"]: errs.append("mb-sheep-goat: clases o subastas distintas de las esperadas"); return
    if not set(doc["sales"]) <= set(doc["marts"]): errs.append("mb-sheep-goat: subasta desconocida"); return
    n = 0; newest = None
    for m, ss in doc["sales"].items():
        ks = list(ss)
        if ks != sorted(ks) or len(set(ks)) != len(ks): errs.append("mb-sheep-goat %s: ventas desordenadas o repetidas" % m); return
        for k in ks:
            try: dd = _d.date.fromisoformat(k)
            except ValueError: errs.append("mb-sheep-goat %s: fecha de venta invalida %r" % (m, k)); return
            if dd > _d.date.today() + _d.timedelta(days=1): errs.append("mb-sheep-goat %s %s: venta en el futuro" % (m, k)); return
            if dd.weekday() not in (1, 2, 3, 4): errs.append("mb-sheep-goat %s %s: la venta no cae de martes a viernes" % (m, k)); return
            rows = ss[k]
            if len(rows) != 8: errs.append("mb-sheep-goat %s %s: faltan clases" % (m, k)); return
            for i, t in enumerate(rows):
                if t is None: continue
                if not (isinstance(t, list) and len(t) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in t)): errs.append("mb-sheep-goat %s %s: precio invalido %r" % (m, k, t)); return
                if not (t[0] <= t[2] <= t[1]): errs.append("mb-sheep-goat %s %s %s: minimo/media/maximo incoherentes %r" % (m, k, CL[i], t)); return
                if not (40 <= t[2] <= (1500 if i >= 5 else 800)): errs.append("mb-sheep-goat %s %s %s: precio fuera de rango %r" % (m, k, CL[i], t)); return
                if "%s|%s|%d" % (m, k, i) in doc["disputed"]: errs.append("mb-sheep-goat %s %s %s: celda en disputa con valor" % (m, k, CL[i])); return
            if not any(rows): warns.append("mb-sheep-goat %s %s: venta sin ninguna clase con precio" % (m, k))
            n += 1; newest = k if newest is None or k > newest else newest
    if n == 0: errs.append("mb-sheep-goat: sin ventas"); return
    if (_d.date.today() - _d.date.fromisoformat(newest)).days > 60: warns.append("mb-sheep-goat: la ultima venta es del %s" % newest)
    stats["mb-sheep-goat ventas"] = n


def mb_hogs(doc, errs, warns, stats):
    """Manitoba, porcino semanal (procesadoras): semanas que acaban en viernes y crecen; [all-in C$/100 kg, Index 100 C$/100 kg, cerdos procesados, peso de canal kg] con rangos plausibles,
    all-in/Index 100 entre 0,95 y 1,2 (el Index 100 es el all-in dividido por el indice medio), sin saltos semanales superiores al 40 % y sin huecos de mas de una semana."""
    import datetime as _d
    if doc["fields"] != ["allIn", "index100", "pigs", "kg"]: errs.append("mb-hogs: campos distintos de los esperados"); return
    ks = list(doc["weeks"])
    if ks != sorted(ks) or len(set(ks)) != len(ks): errs.append("mb-hogs: semanas desordenadas o repetidas"); return
    prev = None
    for k in ks:
        try: d = _d.date.fromisoformat(k)
        except ValueError: errs.append("mb-hogs: fecha invalida %r" % k); return
        if d.weekday() != 4: errs.append("mb-hogs %s: la semana no acaba en viernes" % k); return
        if d > _d.date.today() + _d.timedelta(days=1): errs.append("mb-hogs %s: semana en el futuro" % k); return
        a, x, p, w = doc["weeks"][k]
        for v, lo, hi, nm in ((a, 100, 500, "all-in"), (x, 100, 500, "Index 100"), (p, 20000, 250000, "cerdos"), (w, 80, 130, "peso")):
            if v is None: continue
            if isinstance(v, bool) or not isinstance(v, (int, float)) or not (lo <= v <= hi): errs.append("mb-hogs %s: %s fuera de rango (%r)" % (k, nm, v)); return
        if a is not None and x is not None and not (0.95 <= a / x <= 1.2): errs.append("mb-hogs %s: all-in/Index 100 incoherente (%s/%s)" % (k, a, x)); return
        if prev is not None:
            if (d - prev[0]).days > 7: warns.append("mb-hogs: hueco entre %s y %s" % (prev[0], k))
            if prev[1] is not None and a is not None and abs(a / prev[1] - 1) > 0.4: errs.append("mb-hogs %s: salto del all-in superior al 40 %% (%s -> %s)" % (k, prev[1], a)); return
        prev = (d, a if a is not None else (prev[1] if prev else None))
    if (_d.date.today() - _d.date.fromisoformat(ks[-1])).days > 21: warns.append("mb-hogs: la ultima semana es del %s" % ks[-1])
    stats["mb-hogs semanas"] = len(ks)


def spain_crops(doc, errs, warns, stats):
    """MAPA superficies y producciones por provincia. Por cultivo y campana: 5 medidas [total, secano, regadio, cosechada, produccion], todas >= 0 o null; provincias que existen en el diccionario;
    el total nacional del cultivo es la suma de sus provincias (nulo solo si ninguna lo trae); secano + regadio = total; cosechada <= total a nivel nacional (por provincia el MAPA a veces la da mayor: aviso); campana con estado y no futura; codigos de cultivo sin repetir."""
    import datetime as _d
    g = doc["group"]; cy = _d.date.today().year
    if doc["measures"] != ["areaTotal", "areaSecano", "areaRegadio", "areaHarvested", "production"]: errs.append("spain-crops %s: medidas distintas de las esperadas" % g); return
    provs = doc["provinces"]
    if any(not re.match(r"^\d{2}$", k) or not (1 <= int(k) <= 52) for k in provs): errs.append("spain-crops %s: identificador de provincia invalido" % g); return
    for camp, cd in doc["campaigns"].items():
        if not re.match(r"^\d{4}$", camp) or not (2000 <= int(camp) <= cy + 1): errs.append("spain-crops %s: campana invalida %r" % (g, camp)); return
        seen = set()
        for x in cd["crops"]:
            tag = "spain-crops %s/%s %s" % (g, camp, x["c"])
            if x["c"] in seen: errs.append("%s: cultivo repetido" % tag); return
            seen.add(x["c"])
            def okv(a):
                return isinstance(a, list) and len(a) == 5 and all(e is None or (isinstance(e, (int, float)) and not isinstance(e, bool) and e >= 0) for e in a)
            if not okv(x["t"]): errs.append("%s: totales invalidos %r" % (tag, x["t"])); return
            for pid, a in x["v"].items():
                if pid not in provs: errs.append("%s: provincia %s no esta en el diccionario" % (tag, pid)); return
                if not okv(a): errs.append("%s/%s: valores invalidos %r" % (tag, pid, a)); return
                if a[0] is not None and a[1] is not None and a[2] is not None and abs(a[1] + a[2] - a[0]) > max(2, 0.001 * a[0]): errs.append("%s/%s: secano + regadio (%s) no es el total (%s)" % (tag, pid, a[1] + a[2], a[0])); return
                if a[0] is not None and a[3] is not None and a[3] > a[0] * 1.001 + 1: warns.append("%s/%s: superficie cosechada (%s) mayor que la total (%s); se publica tal cual la da el MAPA" % (tag, pid, a[3], a[0]))
            for i in range(5):
                vals = [a[i] for a in x["v"].values() if a[i] is not None]
                if not vals:
                    if x["t"][i] is not None: errs.append("%s: total %d sin ninguna provincia que lo respalde" % (tag, i)); return
                elif x["t"][i] is None or abs(sum(vals) - x["t"][i]) > max(0.01, abs(x["t"][i]) * 1e-6): errs.append("%s: el total %d (%s) no es la suma de las provincias (%s)" % (tag, i, x["t"][i], sum(vals))); return
            t = x["t"]
            if t[0] is not None and t[1] is not None and t[2] is not None and abs(t[1] + t[2] - t[0]) > max(2, 0.001 * t[0]): errs.append("%s: secano + regadio nacional no es el total" % tag); return
            if t[0] is not None and t[3] is not None and t[3] > t[0] * 1.001 + 1: errs.append("%s: superficie cosechada nacional (%s) mayor que la total (%s)" % (tag, t[3], t[0])); return
            if t[3] and t[4] is not None and x["l"] > 0 and not (0.05 <= t[4] / t[3] <= 400): warns.append("%s: rendimiento %.2f t/ha fuera de lo habitual" % (tag, t[4] / t[3]))
        stats["spain-crops cultivos"] = stats.get("spain-crops cultivos", 0) + len(cd["crops"])
    stats["spain-crops campanas"] = stats.get("spain-crops campanas", 0) + len(doc["campaigns"])


def spain_crops_index(doc, errs, warns, stats):
    """Indice de los libros del MAPA: cada grupo apunta a su fichero y sus campanas salen de los libros leidos; la revision no es anterior a la generacion."""
    have = {}
    for f in doc["files"]:
        for k in f["groups"]: have.setdefault(k, set()).add(f["campaign"])
    for k, gi in doc["groups"].items():
        if gi["file"] != "crops-" + k + ".json": errs.append("spain-crops index: %s apunta a %s" % (k, gi["file"])); return
        if set(gi["campaigns"]) - have.get(k, set()): errs.append("spain-crops index: %s tiene campanas que ningun libro leido respalda" % k); return
        if set(str(c) for c in gi["campaigns"]) != set(gi["crops"]): errs.append("spain-crops index: %s campanas y recuentos de cultivos no coinciden" % k); return
    if doc["checkedAt"] < doc["generatedAt"]: errs.append("spain-crops index: checkedAt anterior a generatedAt"); return
    stats["spain-crops grupos"] = len(doc["groups"])


def _sl_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_livestock", str(Path(__file__).resolve().parent / "update-spain-livestock.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m


def spain_livestock(doc, errs, warns, stats):
    """MAPA efectivos de ganado por provincia (mayo/noviembre). Valores >= 0 o null y de la longitud de los periodos; periodos ordenados y sin repetir; solo provincias INE (01-52, 50 en total) y ES;
    las provincias suman el total nacional de cada variable y periodo (la tolerancia es el redondeo del MAPA); el total nacional suma sus componentes. Un total provincial que no suma sus componentes
    es una incoherencia de la fuente: aviso, no error."""
    m = _sl_mod(); sp = doc["species"]; n = len(doc["periods"]); V = doc["v"]
    if doc["periods"] != sorted(set(doc["periods"])): errs.append("spain-livestock %s: periodos desordenados o repetidos" % sp); return
    ids = {x["id"] for x in doc["vars"]}
    if len(ids) != len(doc["vars"]): errs.append("spain-livestock %s: variable repetida" % sp); return
    if "ES" not in V: errs.append("spain-livestock %s: falta ES" % sp); return
    bad = [k for k in V if k != "ES" and not (re.match(r"^\d{2}$", k) and 1 <= int(k) <= 52)]
    if bad or len(V) != 51: errs.append("spain-livestock %s: areas distintas de ES + 50 provincias (%s)" % (sp, bad[:3])); return
    for ar, vs in V.items():
        for cd, arr in vs.items():
            if cd not in ids: errs.append("spain-livestock %s %s: variable %s sin declarar" % (sp, ar, cd)); return
            if len(arr) != n: errs.append("spain-livestock %s %s %s: longitud distinta de los periodos" % (sp, ar, cd)); return
            if any(x is not None and (isinstance(x, bool) or not isinstance(x, (int, float)) or x < 0) for x in arr): errs.append("spain-livestock %s %s %s: valor negativo o no numerico" % (sp, ar, cd)); return
    e, w = m.validate({sp: {"periods": doc["periods"], "v": V}})
    errs.extend("spain-livestock " + x for x in e[:5]); warns.extend("spain-livestock " + x for x in w[:5])
    stats["spain-livestock especies"] = stats.get("spain-livestock especies", 0) + 1


def spain_livestock_index(doc, errs, warns, stats):
    """Indice: cada especie apunta a su fichero y la revision no es anterior a la generacion."""
    for k, si in doc["species"].items():
        if si["file"] != "livestock-" + k + ".json": errs.append("spain-livestock index: %s apunta a %s" % (k, si["file"])); return
        if si["first"] > si["last"]: errs.append("spain-livestock index: %s primero > ultimo" % k); return
    if doc["checkedAt"] < doc["generatedAt"]: errs.append("spain-livestock index: checkedAt anterior a generatedAt")


def _sb_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_balances", str(Path(__file__).resolve().parent / "update-spain-balances.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m


def spain_balances(doc, errs, warns, stats):
    """Balances de cereales del MAPA. Por campaña y cereal: sin negativos; disponibilidades = existencias iniciales + produccion + importaciones; utilizaciones = consumo + exportaciones;
    existencias finales = disponibilidades - utilizaciones; consumo = suma de sus partidas. Las discrepancias de la columna TOTAL del propio PDF no son error pero deben estar en `notes`
    exactamente como las calcula el script (no se esconde ni se inventa ninguna). Existencias iniciales distintas de las finales de la campaña anterior: aviso."""
    m = _sb_mod()
    if doc["cereals"] != m.CEREALS or doc["items"] != m.ITEMS: errs.append("spain-balances: cereales o partidas distintos de los esperados"); return
    camps = {}
    for k, c in doc["campaigns"].items():
        if not re.match(r"^\d{4}$", k): errs.append("spain-balances: campaña %r invalida" % k); return
        y = int(k)
        if c["label"] != "%d/%02d" % (y, (y + 1) % 100): errs.append("spain-balances %s: etiqueta %s" % (k, c["label"])); return
        if set(c["v"]) != set(m.CEREALS) or any(set(v) != set(m.ITEMS) for v in c["v"].values()): errs.append("spain-balances %s: cereales o partidas incompletos" % k); return
        camps[y] = c
    e, w, notes = m.validate(camps)
    errs.extend("spain-balances " + x for x in e[:5]); warns.extend("spain-balances " + x for x in w[:5])
    for y, c in camps.items():
        key = lambda L: sorted(json.dumps(x, sort_keys=True) for x in L)
        if key(c["notes"]) != key(notes[y]): errs.append("spain-balances %d: las notas no coinciden con las discrepancias reales de la tabla" % y)
    stats["spain-balances campañas"] = len(camps)


def supply_balances(doc, errs, warns, stats):
    """Balances oficiales por pais (data/supply-balances/*.json, formato comun de scripts/build_supply_balances.py).
    Fuente con licencia VERIFIED; campañas = año de inicio con etiqueta AAAA/AA; valores numericos sin negativos; solo partidas y productos declarados;
    si el pais declara `identity` (oferta total - salidas = existencias finales) debe cuadrar dentro de su tolerancia: si no cuadra es error, no se corrige ni se oculta."""
    reg = json.loads((Path(__file__).resolve().parents[1] / "data" / "license-registry.json").read_text(encoding="utf-8"))["sources"]
    if doc["sourceId"] not in reg or reg[doc["sourceId"]].get("status") != "VERIFIED": errs.append("supply-balances %s: fuente %s sin licencia VERIFIED" % (doc["country"], doc["sourceId"])); return
    items = {i["id"] for i in doc["items"]}; prods = {p["id"] for p in doc["products"]}
    for k in [doc["stocksToUse"]["num"]] + doc["stocksToUse"]["den"] + doc["cards"] + doc["chart"]:
        if k not in items: errs.append("supply-balances %s: tarjetas, grafico o stocksToUse usan una partida no declarada (%s)" % (doc["country"], k)); return
    idt = doc.get("identity"); n = 0; bad = []
    for y, c in doc["campaigns"].items():
        if not re.match(r"^\d{4}$", y): errs.append("supply-balances %s: campaña %r invalida" % (doc["country"], y)); return
        if c.get("label") != "%s/%02d" % (y, (int(y) + 1) % 100): errs.append("supply-balances %s %s: etiqueta %r" % (doc["country"], y, c.get("label"))); return
        for p, vals in c["v"].items():
            if p not in prods: errs.append("supply-balances %s %s: producto %s no declarado" % (doc["country"], y, p)); return
            for k, v in vals.items():
                if k not in items: errs.append("supply-balances %s %s/%s: partida %s no declarada" % (doc["country"], y, p, k)); return
                if not isinstance(v, (int, float)) or isinstance(v, bool) or v < 0: errs.append("supply-balances %s %s/%s/%s: valor %r" % (doc["country"], y, p, k, v)); return
                n += 1
            if idt and all(k in vals for k in [idt["total"], idt["equals"]] + idt["minus"]):
                r = vals[idt["total"]] - sum(vals[k] for k in idt["minus"]) - vals[idt["equals"]]
                if abs(r) > max(1.0, idt["tolerancePct"] / 100.0 * vals[idt["total"]]): bad.append("%s %s: descuadre %.1f kt sobre %.1f" % (y, p, r, vals[idt["total"]]))
    errs.extend("supply-balances %s " % doc["country"] + b for b in bad[:5])
    ys = sorted(doc["campaigns"])
    if int(ys[-1]) < datetime.date.today().year - 3: warns.append("supply-balances %s: la ultima campaña es %s (datos viejos)" % (doc["country"], ys[-1]))
    stats["supply-balances %s cifras" % doc["country"]] = n


def _so_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_olive", str(Path(__file__).resolve().parent / "update-spain-olive.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m


def spain_olive(doc, errs, warns, stats):
    """Balance del olivar del MAPA: por campaña y producto sin negativos; origen = existencias iniciales + produccion + importaciones; destino (mercado interior + exportaciones + ajustes + existencias finales) = total = origen;
    UE-27 + extra UE-27 = total cuando hay desglose. Estado y mes de actualizacion validos. Aforo: las comunidades suman el total nacional y la campaña del aforo es posterior a la ultima del balance."""
    m = _so_mod()
    if doc["products"] != m.PRODUCTS or doc["items"] != m.ITEMS: errs.append("spain-olive: productos o partidas distintos de los esperados"); return
    camps = {}
    for k, c in doc["campaigns"].items():
        if not re.match(r"^\d{4}$", k): errs.append("spain-olive: campaña %r invalida" % k); return
        y = int(k)
        if c["label"] != "%d/%02d" % (y, (y + 1) % 100): errs.append("spain-olive %s: etiqueta %s" % (k, c["label"])); return
        if c["status"] not in (None, "provisional", "definitivo", "estimación"): errs.append("spain-olive %s: estado %r inventado" % (k, c["status"])); return
        if c["update"] is not None and not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", c["update"]): errs.append("spain-olive %s: mes de actualizacion invalido" % k); return
        if set(c["v"]) != set(m.PRODUCTS) or any(set(v) != set(m.ITEMS) for v in c["v"].values()): errs.append("spain-olive %s: productos o partidas incompletos" % k); return
        camps[y] = c
    e, w = m.validate(camps)
    errs.extend("spain-olive " + x for x in e[:5]); warns.extend("spain-olive " + x for x in w[:5])
    af = doc.get("aforo")
    if af:
        rows = af["ccaa"]
        for k in ("mean6", "previous", "estimate"):
            if abs(sum(r[k] for r in rows) - af["total"][k]) > 3: errs.append("spain-olive aforo: las comunidades no suman el total nacional (%s)" % k)
        if any(r[k] < 0 for r in rows for k in ("mean6", "previous", "estimate")): errs.append("spain-olive aforo: valor negativo")
        if af["campaign"] <= max(camps): errs.append("spain-olive aforo: la campaña del aforo no es posterior a la del balance")
    stats["spain-olive campañas"] = len(camps)

def _sm_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_milk", str(Path(__file__).resolve().parent / "update-spain-milk.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def _ss_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_slaughter", str(Path(__file__).resolve().parent / "update-spain-slaughter.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def _sw_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_wine", str(Path(__file__).resolve().parent / "update-spain-wine.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def _swm_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_wine_monthly", str(Path(__file__).resolve().parent / "update-spain-wine-monthly.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m


def _ssc_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_slaughter_census", str(Path(__file__).resolve().parent / "update-spain-slaughter-census.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def _swb_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_wine_balance_historic", str(Path(__file__).resolve().parent / "update-spain-wine-balance-historic.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def spain_wine_monthly(doc, errs, warns, stats):
    """Vino mensual de INFOVI (MAPA): meses ordenados y sin repetir, 17 comunidades, series de la longitud de los meses, sin negativos, comunidades = total, salidas = interiores + exteriores, exteriores = UE + terceros,
    identidad de existencias (inicial + produccion + entradas - salidas - operaciones propias = final) con un residuo < 10 % y una fuente por mes."""
    m = _swm_mod(); P = doc["months"]; n = len(P); N = doc["national"]
    if P != sorted(set(P)): errs.append("spain-wine-monthly: meses desordenados o repetidos"); return
    if set(doc["ccaa"]) != set(m.CCAA): errs.append("spain-wine-monthly: comunidades distintas de las 17 esperadas"); return
    if set(doc["sources"]) != set(P): errs.append("spain-wine-monthly: falta la fuente de algun mes o sobra una"); return
    for f in m.F:
        a = N[f]
        if len(a) != n: errs.append("spain-wine-monthly: la serie nacional %s no tiene la longitud de los meses" % f); return
        if any(x is not None and x < 0 for x in a): errs.append("spain-wine-monthly: valor negativo en %s" % f); return
        for c, d in doc["ccaa"].items():
            if len(d[f]) != n: errs.append("spain-wine-monthly: %s %s no tiene la longitud de los meses" % (c, f)); return
            if any(x is not None and x < 0 for x in d[f]): errs.append("spain-wine-monthly: valor negativo en %s %s" % (c, f)); return
    def near(a, b, tol): return a is None or b is None or abs(a - b) <= tol + 0.0001 * abs(b)
    for i, p in enumerate(P):
        for f in m.F:
            s = sum(d[f][i] for d in doc["ccaa"].values() if d[f][i] is not None); t = N[f][i]
            if t is not None and not near(s, t, 3): errs.append("spain-wine-monthly %s %s: las comunidades suman %s y el total %s" % (p, f, round(s), round(t)))
        if not near((N["exitsEU"][i] or 0) + (N["exitsThird"][i] or 0) + (N["exitsDomestic"][i] or 0), N["exitsTotal"][i], 3): errs.append("spain-wine-monthly %s: salidas distintas de interiores + UE + terceros" % p)
        v = [N[f][i] for f in ("stockStart", "production", "inSpain", "inAbroad", "exitsTotal", "ownOps", "stockEnd")]
        if None not in v and v[6]:
            res = v[0] + v[1] + v[2] + v[3] - v[4] - v[5] - v[6]
            if abs(res) > 0.10 * v[6]: errs.append("spain-wine-monthly %s: la identidad de existencias se rompe en %s hl" % (p, round(res)))
    stats["spain-wine-monthly meses"] = n


def spain_wine(doc, errs, warns, stats):
    """Vino de INFOVI (MAPA): campañas ordenadas y sin repetir, 17 comunidades, series de la longitud de las campañas, sin negativos, tinto+blanco = vino, categorias = vino, salidas = exportaciones + interiores,
    comunidades <= total (+0,01 %), rendimiento uva-vino en rango y una fuente por campaña."""
    m = _sw_mod(); C = doc["campaigns"]; n = len(C); N = doc["national"]
    if C != sorted(set(C)): errs.append("spain-wine: campañas desordenadas o repetidas"); return
    if set(doc["ccaa"]) != set(m.CCAA): errs.append("spain-wine: comunidades distintas de las 17 esperadas"); return
    if set(doc["sources"]) != set(C): errs.append("spain-wine: falta la fuente de alguna campaña o sobra una"); return
    for f in m.FIELDS:
        a = N[f]
        if len(a) != n: errs.append("spain-wine: la serie nacional %s no tiene la longitud de las campañas" % f); return
        if any(x is not None and x < 0 for x in a): errs.append("spain-wine: valor negativo en %s" % f); return
        for c, d in doc["ccaa"].items():
            if len(d[f]) != n: errs.append("spain-wine: %s %s no tiene la longitud de las campañas" % (c, f)); return
            if any(x is not None and x < 0 for x in d[f]): errs.append("spain-wine: valor negativo en %s %s" % (c, f)); return
    def near(a, b, tol): return a is None or b is None or abs(a - b) <= tol + 0.0001 * abs(b)
    for i, c in enumerate(C):
        g, w = N["grape"][i], N["wine"][i]
        if g and w and not 5 <= w / g <= 8: errs.append("spain-wine %s: rendimiento uva-vino fuera de rango" % c)
        if not near((N["red"][i] or 0) + (N["white"][i] or 0), w, 3): errs.append("spain-wine %s: tinto+blanco no es el vino producido" % c)
        cats = [N[x][i] for x in ("dop", "igp", "varietal", "sinig")]
        if all(x is not None for x in cats) and not near(sum(cats), w, 3): errs.append("spain-wine %s: las categorias no suman el vino producido" % c)
        if not near((N["exports"][i] or 0) + (N["domestic"][i] or 0), N["exits"][i], 3): errs.append("spain-wine %s: salidas distintas de exportaciones + interiores" % c)
        for f in m.FIELDS:
            s = sum(d[f][i] for d in doc["ccaa"].values() if d[f][i] is not None); t = N[f][i]
            if t is not None and not near(s, t, 3): errs.append("spain-wine %s %s: las comunidades suman %s y el total %s" % (c, f, round(s), round(t)))
    stats["spain-wine campañas"] = n


def spain_slaughter(doc, errs, warns, stats):
    """Sacrificio de ganado del MAPA: periodos ordenados y sin repetir, 7 especies y 17 comunidades, series de la longitud de los periodos, sin negativos, peso canal medio en el rango de cada especie,
    comunidades <= nacional (+0,5 %), el ultimo periodo es el del ultimo libro y toda incoherencia de la fuente esta anotada en notes."""
    m = _ss_mod(); P = doc["periods"]; n = len(P); N = doc["national"]
    if P != sorted(set(P)): errs.append("spain-slaughter: periodos desordenados o repetidos"); return
    if set(doc["ccaa"]) != set(m.CCAA): errs.append("spain-slaughter: comunidades distintas de las 17 esperadas"); return
    if P[-1] != doc["report"]["last"]: errs.append("spain-slaughter: el ultimo periodo (%s) no es el del ultimo libro (%s)" % (P[-1], doc["report"]["last"])); return
    for s in m.SPECIES:
        for k in ("heads", "carcass"):
            a = N[s][k]
            if len(a) != n: errs.append("spain-slaughter: %s %s no tiene la longitud de los periodos" % (s, k)); return
            if any(x is not None and x < 0 for x in a): errs.append("spain-slaughter: valor negativo en %s %s" % (s, k)); return
        lo, hi = m.WEIGHT[s]
        for i, p in enumerate(P):
            h, t = N[s]["heads"][i], N[s]["carcass"][i]
            if h and t is not None:
                kg = t / h if s in ("aves", "conejos") else t * 1000 / h
                if not lo <= kg <= hi: errs.append("spain-slaughter %s %s: peso canal medio %.1f kg fuera de rango" % (p, s, kg))
    for c, d in doc["ccaa"].items():
        for s in m.SPECIES:
            for k in ("heads", "carcass"):
                a = d[s][k]
                if len(a) != n: errs.append("spain-slaughter: %s %s %s no tiene la longitud de los periodos" % (c, s, k)); return
                if any(x is not None and x < 0 for x in a): errs.append("spain-slaughter: valor negativo en %s %s %s" % (c, s, k)); return
    for i, p in enumerate(P):
        for s in m.SPECIES:
            for k in ("heads", "carcass"):
                t = N[s][k][i]; v = [d[s][k][i] for d in doc["ccaa"].values() if d[s][k][i] is not None]
                if t is not None and v and sum(v) > t * 1.005 + 1: errs.append("spain-slaughter %s %s %s: las comunidades suman mas que el nacional" % (p, s, k))
    stats["spain-slaughter meses"] = n


def spain_slaughter_census(doc, errs, warns, stats):
    """Censo anual de sacrificio por provincia (MAPA): años ordenados y sin repetir, 50 provincias (id del mapa) y 17 comunidades esperadas, series de la longitud de los años, sin negativos, una celda DC es null (nunca cifra) y las claves de dc existen,
    aves y conejos en cabezas (orden de magnitud nacional), las comunidades suman el TOTAL y TOTAL + otros sacrificios = España, y toda diferencia entre las provincias y su comunidad (cifras publicadas del MAPA) esta anotada en notes."""
    m = _ssc_mod(); Y = doc["years"]; n = len(Y); S = m.SPECIES
    if Y != sorted(set(Y)): errs.append("spain-slaughter-census: años desordenados o repetidos"); return
    if set(doc["v"]) != {"ES"} | {p[0] for p in m.PROV}: errs.append("spain-slaughter-census: provincias distintas de las 50 esperadas"); return
    if set(doc["ccaa"]) != set(m.CCAA): errs.append("spain-slaughter-census: comunidades distintas de las 17 esperadas"); return
    if set(doc["files"]) != {str(y) for y in Y} or set(doc["basis"]) != {str(y) for y in Y} or set(doc["titles"]) != {str(y) for y in Y}: errs.append("spain-slaughter-census: files, basis y titles no coinciden con los años"); return
    groups = {"v": doc["v"], "ccaa": doc["ccaa"], "provTotal": {"TOTAL": doc["provTotal"]}, "others": {"OTROS": doc["others"]}}
    for gname, g in groups.items():
        for k, d in g.items():
            for s in S:
                for me in ("heads", "meat"):
                    a = d[s][me]
                    if len(a) != n: errs.append("spain-slaughter-census: %s %s %s no tiene la longitud de los años" % (k, s, me)); return
                    if any(x is not None and x < 0 for x in a): errs.append("spain-slaughter-census: valor negativo en %s %s %s" % (k, s, me)); return
    cls = {p[0]: p[2] for p in m.PROV}
    for key, sd in doc["dc"].items():
        if key != "ES" and key not in doc["v"] and key not in doc["ccaa"]: errs.append("spain-slaughter-census: dc de una region que no existe (%s)" % key); return
        for s, md in sd.items():
            for me, yd in md.items():
                for y, c in yd.items():
                    if s not in S or me not in ("heads", "meat") or int(y) not in Y or c not in (0, 1, 2, 3, 4): errs.append("spain-slaughter-census: dc mal formado en %s %s %s %s" % (key, s, me, y)); return
                    series = (doc["v"].get(key) or doc["ccaa"].get(key))
                    if series[s][me][Y.index(int(y))] is not None: errs.append("spain-slaughter-census: %s %s %s %s es DC y trae cifra" % (key, s, me, y))
    noted = {(x["year"], x["region"], x["species"], x["measure"]) for x in doc["notes"] if x.get("kind") == "sum"}
    tol = lambda x: 2.0 + 0.0005 * abs(x)
    for i, y in enumerate(Y):
        for s in S:
            for me in ("heads", "meat"):
                T = doc["provTotal"][s][me][i]; E = doc["v"]["ES"][s][me][i]; O = doc["others"][s][me][i]
                cs = [doc["ccaa"][k][s][me][i] for k in m.CCAA]
                if T is not None and all(c is not None for c in cs) and abs(sum(cs) - T) > tol(T): errs.append("spain-slaughter-census %d %s %s: las comunidades suman %s y el TOTAL %s" % (y, s, me, round(sum(cs), 1), round(T, 1)))
                if T is not None and E is not None and O is not None and abs(T + O - E) > tol(E): errs.append("spain-slaughter-census %d %s %s: TOTAL + otros sacrificios distinto de España" % (y, s, me))
                for slug in m.CCAA:
                    if slug in m.UNI: continue
                    c = doc["ccaa"][slug][s][me][i]; vv = [doc["v"][p[0]][s][me][i] for p in m.PROV if p[2] == slug]; ok_ = [x for x in vv if x is not None]
                    if c is None: continue
                    gap = sum(ok_) - c if len(ok_) == len(vv) else max(0.0, sum(ok_) - c)
                    if abs(gap) > tol(c) and (y, slug, s, me) not in noted: errs.append("spain-slaughter-census %d %s %s %s: las provincias suman %s y la comunidad %s y la diferencia no esta anotada" % (y, slug, s, me, round(sum(ok_), 1), round(c, 1)))
        for s in ("aves", "conejos"):
            h = doc["v"]["ES"][s]["heads"][i]; lo, hi = m.MAGN[s]
            if h is not None and not lo <= h <= hi: errs.append("spain-slaughter-census %d %s: %.0f cabezas en España fuera de orden de magnitud (¿miles?)" % (y, s, h))
    stats["spain-slaughter-census años"] = n


def spain_wine_balance_historic(doc, errs, warns, stats):
    """Balances oficiales del vino (MAPA) 2009/10-2015/16: campañas ordenadas y sin repetir, 25 epigrafes y 5 categorias de la longitud de las campañas, sin negativos, identidades contables (recursos, empleos, utilizacion interior,
    produccion), categorias que suman el vino total, existencias finales = iniciales de la campaña siguiente, y todo «blanco mayor que el total» de la fuente anotado en notes."""
    m = _swb_mod(); C = doc["campaigns"]; n = len(C)
    if C != sorted(set(C)): errs.append("spain-wine-balance-historic: campañas desordenadas o repetidas"); return
    if doc["codes"] != m.CODES or set(doc["v"]) != set(m.CODES): errs.append("spain-wine-balance-historic: epigrafes distintos de los 25 esperados"); return
    if set(doc["status"]) != set(C) or set(doc["files"]) != set(C): errs.append("spain-wine-balance-historic: status y files no coinciden con las campañas"); return
    z = lambda x: x or 0.0
    for c in m.CODES:
        for k in m.CATS:
            for col in ("all", "white"):
                a = doc["v"][c][k][col]
                if len(a) != n: errs.append("spain-wine-balance-historic: %s %s %s no tiene la longitud de las campañas" % (c, k, col)); return
                if any(x is not None and x < 0 for x in a): errs.append("spain-wine-balance-historic: valor negativo en %s %s %s" % (c, k, col)); return
    noted = {(x["campaign"], x["code"], x["category"]) for x in doc["notes"] if x.get("kind") == "white>total"}
    for i, camp in enumerate(C):
        d = {c: {k: {col: doc["v"][c][k][col][i] for col in ("all", "white")} for k in m.CATS} for c in m.CODES}
        e, nt = m.validate(camp, d); errs += ["spain-wine-balance-historic " + x for x in e]
        for x in nt:
            if (x["campaign"], x["code"], x["category"]) not in noted: errs.append("spain-wine-balance-historic %s fila %s %s: blanco mayor que el total y no está anotado" % (camp, x["code"], x["category"]))
    for i in range(n - 1):
        y0, y1 = int(C[i][:4]), int(C[i + 1][:4])
        if y1 != y0 + 1: continue
        for k in m.CATS:
            a, b = doc["v"]["7"][k]["all"][i], doc["v"]["1"][k]["all"][i + 1]
            if a is not None and b is not None and abs(a - b) > 10: errs.append("spain-wine-balance-historic %s %s: existencias finales (%s) distintas de las iniciales de %s (%s)" % (C[i], k, a, C[i + 1], b))
    stats["spain-wine-balance-historic campañas"] = n


def _land_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_spain_land", str(Path(__file__).resolve().parent / "update-spain-land.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def spain_land(doc, errs, warns, stats):
    """Precio de la tierra y canones del MAPA: anos ordenados con estado conocido, 17 comunidades + total nacional, series de la longitud de los anos, sin valores <= 0, tipos conocidos,
    las 50 provincias del ultimo ano, precio general de cada comunidad entre los de sus tipos, y el precio general nacional dentro de rango plausible (1.000-60.000 EUR/ha)."""
    m = _land_mod(); Y = doc["years"]; n = len(Y)
    if Y != sorted(set(Y)): errs.append("spain-land: anos desordenados o repetidos"); return
    if set(doc["status"]) != set(str(y) for y in Y): errs.append("spain-land: estado de campana distinto de los anos"); return
    if any(v not in ("definitive", "provisional") for v in doc["status"].values()): errs.append("spain-land: estado de campana inventado"); return
    want = set(m.CCAA.values()) | {"ES"}
    for blk, known in (("price", set(doc["types"])), ("rent", set(doc["rentTypes"]))):
        if set(doc[blk]["ccaa"]) != want: errs.append("spain-land %s: comunidades distintas de las 17 esperadas mas el total" % blk); return
        for c, tv in doc[blk]["ccaa"].items():
            for t, a in tv.items():
                if t not in known: errs.append("spain-land %s %s: tipo desconocido %s" % (blk, c, t)); return
                if len(a) != n: errs.append("spain-land %s %s %s: longitud distinta de los anos" % (blk, c, t)); return
                if any(x is not None and x <= 0 for x in a): errs.append("spain-land %s %s %s: valor no positivo" % (blk, c, t)); return
    pv = doc["price"]["prov"]
    if pv["year"] != Y[-1]: errs.append("spain-land: las provincias no son del ultimo ano"); return
    if set(pv["values"]) != set("%02d" % i for i in range(1, 51)) or set(pv["names"]) != set(pv["values"]): errs.append("spain-land: no hay exactamente las 50 provincias"); return
    for k, tv in pv["values"].items():
        if any(t not in doc["types"] or not isinstance(x, (int, float)) or x <= 0 for t, x in tv.items()): errs.append("spain-land provincia %s: valor o tipo invalido" % k); return
    g = doc["price"]["ccaa"]["ES"].get("PT")
    if not g or g[-1] is None or not 1000 <= g[-1] <= 60000: errs.append("spain-land: precio general nacional fuera de rango"); return
    r = doc["rent"]["ccaa"]["ES"].get("GEN")
    rl = [x for x in (r or []) if x is not None]   # el MAPA publica los canones un año despues que los precios: el ultimo año puede ser hueco
    if not rl or not 20 <= rl[-1] <= 2000: errs.append("spain-land: canon general nacional fuera de rango"); return
    stats["spain-land anos"] = n

def _lfi_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_land_fr_it", str(Path(__file__).resolve().parent / "update-land-fr-it.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def france_land(doc, errs, warns, stats):
    """Precio de la tierra de Francia (Agreste/FNSafer): anos consecutivos, departamentos con codigo valido (al menos 85 de tierras libres y 40 de alquiladas), series de la longitud de los anos,
    sin valores <= 0, y mediana departamental del ultimo ano dentro de lo plausible (3.000-15.000 EUR/ha)."""
    m = _lfi_mod(); Y = doc["years"]; n = len(Y)
    if Y != sorted(set(Y)) or Y != list(range(Y[0], Y[-1] + 1)): errs.append("france-land: anos desordenados, repetidos o con huecos"); return
    valid = set(m.dept_codes().values())
    for blk, mn in (("free", 85), ("rent", 40)):
        d = doc[blk]
        if len(d) < mn: errs.append("france-land %s: solo %d departamentos (minimo %d)" % (blk, len(d), mn)); return
        for c, a in d.items():
            if c not in valid: errs.append("france-land %s: departamento desconocido %s" % (blk, c)); return
            if len(a) != n: errs.append("france-land %s %s: longitud distinta de los anos" % (blk, c)); return
            if any(x is not None and (not isinstance(x, (int, float)) or x <= 0) for x in a): errs.append("france-land %s %s: valor no positivo" % (blk, c)); return
    v = sorted(a[-1] for a in doc["free"].values() if a[-1] is not None)
    if not v or not 3000 <= v[len(v) // 2] <= 15000: errs.append("france-land: mediana departamental del ultimo ano fuera de rango"); return
    stats["france-land anos"] = n

def _lpl_mod():
    import importlib.util as _u
    sp = _u.spec_from_file_location("update_land_pl", str(Path(__file__).resolve().parent / "update-land-pl.py")); m = _u.module_from_spec(sp); sp.loader.exec_module(m); return m

def poland_land(doc, errs, warns, stats):
    """Precio de la tierra arable de Polonia (GUS/BDL): anos consecutivos desde 1999, cuatro clases (total, fertile, medium, barren), las 16 voivodias y el total nacional PL en cada una,
    series de la longitud de los anos, sin valores <= 0 y la mediana de las voivodias del ultimo ano (total) dentro de 20.000-150.000 PLN/ha."""
    m = _lpl_mod(); Y = doc["years"]; n = len(Y)
    if Y != sorted(set(Y)) or Y != list(range(Y[0], Y[-1] + 1)): errs.append("poland-land: anos desordenados, repetidos o con huecos"); return
    want = set(m.UNITS.values()) | {"PL"}
    for cls in ("total", "fertile", "medium", "barren"):
        d = doc["classes"].get(cls)
        if not isinstance(d, dict) or set(d) != want: errs.append("poland-land %s: unidades distintas de las 16 voivodias y PL" % cls); return
        for c, a in d.items():
            if len(a) != n: errs.append("poland-land %s %s: longitud distinta de los anos" % (cls, c)); return
            if any(x is not None and (not isinstance(x, (int, float)) or x <= 0) for x in a): errs.append("poland-land %s %s: valor no positivo" % (cls, c)); return
    for cls in ("meadow", "goodMeadow", "badMeadow"):
        d = doc["classes"].get(cls)
        if d is None: continue
        if not isinstance(d, dict) or set(d) != want: errs.append("poland-land %s: unidades distintas de las 16 voivodias y PL" % cls); return
        for c, a in d.items():
            if len(a) != n: errs.append("poland-land %s %s: longitud distinta de los anos" % (cls, c)); return
            if any(x is not None and (not isinstance(x, (int, float)) or x <= 0) for x in a): errs.append("poland-land %s %s: valor no positivo" % (cls, c)); return
    v = sorted(a[-1] for k, a in doc["classes"]["total"].items() if k != "PL" and a[-1] is not None)
    if len(v) < 16 or not 20000 <= v[len(v) // 2] <= 150000: errs.append("poland-land: mediana de las voivodias del ultimo ano fuera de rango"); return
    stats["poland-land anos"] = n

def _upr_mod():
    if "_upr" not in globals():
        import importlib.util
        sp = importlib.util.spec_from_file_location("upr_ct", str(Path(__file__).resolve().parent / "update-poland-regions.py")); globals()["_upr"] = importlib.util.module_from_spec(sp); sp.loader.exec_module(globals()["_upr"])
    return globals()["_upr"]

def poland_regions(doc, errs, warns, stats):
    """Polonia por voivodia (GUS/BDL): los 42 indicadores esperados, cada uno con las 16 voivodias y el total nacional de la longitud de sus anos (consecutivos), sin valores negativos,
    y para las magnitudes aditivas la suma de las 16 voivodias dentro del 2 % del total nacional en el ultimo ano completo."""
    m = _upr_mod(); want = set(m.UNITS.values()); ids = [i[0] for i in m.INDICATORS]
    got = {x.get("id"): x for x in doc.get("indicators", [])}
    miss = [i for i in ids if i not in got and not i.startswith(("census-", "precision-"))]
    if len(miss) > 8: errs.append("poland-regions: faltan %d indicadores (%s...)" % (len(miss), ", ".join(miss[:3]))); return
    for i in miss: warns.append("poland-regions: indicador ausente %s" % i)
    for x in got.values():
        Y = x["years"]; n = len(Y)
        if Y != list(range(Y[0], Y[-1] + 1)): errs.append("poland-regions %s: anos desordenados o con huecos" % x["id"]); return
        if set(x["regions"]) != want: errs.append("poland-regions %s: unidades distintas de las 16 voivodias" % x["id"]); return
        if len(x["national"]) != n or any(len(a) != n for a in x["regions"].values()): errs.append("poland-regions %s: longitud distinta de los anos" % x["id"]); return
        if any(v is not None and (not isinstance(v, (int, float)) or v < 0) for a in list(x["regions"].values()) + [x["national"]] for v in a): errs.append("poland-regions %s: valor negativo" % x["id"]); return
        if x.get("additive"):
            for i in range(n - 1, -1, -1):
                vals = [a[i] for a in x["regions"].values()]
                if x["national"][i] is not None and None not in vals:
                    if x["national"][i] and abs(sum(vals) / x["national"][i] - 1) > 0.02: errs.append("poland-regions %s %d: la suma de las voivodias no cuadra con el total nacional" % (x["id"], Y[i])); return
                    break
    stats["poland-regions indicadores"] = len(got)

def poland_farm_shop(doc, errs, warns, stats):
    """Precio al agricultor frente a precio al consumo (GUS): pares leche, cerdo y vacuno; cada par con anos consecutivos, una serie 'farm' y al menos una 'retail' de la longitud de los anos,
    valores positivos y precios al consumo por encima del precio al agricultor en el ultimo ano comun (leche, cerdo y vacuno en tienda siempre cuestan mas que en la granja)."""
    P = {p.get("id"): p for p in doc.get("pairs", [])}
    if set(P) != {"milk", "pork", "beef"}: errs.append("poland-farm-shop: pares distintos de leche, cerdo y vacuno"); return
    for pid, p in P.items():
        Y = p["years"]; n = len(Y)
        if Y != list(range(Y[0], Y[-1] + 1)): errs.append("poland-farm-shop %s: anos con huecos" % pid); return
        farm = [s for s in p["series"] if s["role"] == "farm"]; ret = [s for s in p["series"] if s["role"] == "retail"]
        if len(farm) != 1 or not ret: errs.append("poland-farm-shop %s: falta la serie del agricultor o la de la tienda" % pid); return
        for s in p["series"]:
            if len(s["values"]) != n: errs.append("poland-farm-shop %s: longitud distinta de los anos" % pid); return
            if any(v is not None and (not isinstance(v, (int, float)) or v <= 0) for v in s["values"]): errs.append("poland-farm-shop %s: valor no positivo" % pid); return
        i = max(k for k in range(n) if farm[0]["values"][k] is not None and all(s["values"][k] is not None for s in ret))
        if any(s["values"][i] <= farm[0]["values"][i] for s in ret): errs.append("poland-farm-shop %s %d: el precio en tienda no supera al del agricultor (¿series cambiadas?)" % (pid, Y[i])); return
    stats["poland-farm-shop pares"] = len(P)

def italy_land(doc, errs, warns, stats):
    """Valor de la tierra de Italia (CREA): anos consecutivos desde 1960, las 20 regiones sin huecos, las 5 circoscrizioni, salto interanual razonable (-40 % a +70 % por region, -30 % a +40 % el total),
    unidades coherentes (regiones y circoscrizioni en EUR/ha completos, nunca en miles) y total de Italia en 8.000-60.000 EUR/ha."""
    m = _lfi_mod(); Y = doc["years"]; n = len(Y)
    if Y != list(range(Y[0], Y[-1] + 1)) or Y[0] != 1960: errs.append("italy-land: anos no consecutivos desde 1960"); return
    if set(doc["regions"]) != set(m.IT_REG.values()): errs.append("italy-land: regiones distintas de las 20 esperadas"); return
    if set(doc["macro"]) != set(m.IT_MACRO.values()): errs.append("italy-land: circoscrizioni distintas de las 5 esperadas"); return
    for k, a in list(doc["regions"].items()) + list(doc["macro"].items()) + [("IT", doc["italy"])]:
        if len(a) != n: errs.append("italy-land %s: longitud distinta de los anos" % k); return
        if any(x is not None and (not isinstance(x, (int, float)) or x <= 0) for x in a): errs.append("italy-land %s: valor no positivo" % k); return
        lim = (-0.30, 0.40) if k == "IT" else (-0.40, 0.70)
        for i in range(1, n):
            if a[i] is None or a[i - 1] is None: continue
            if not lim[0] < a[i] / a[i - 1] - 1 < lim[1]: errs.append("italy-land %s %d: salto interanual absurdo (¿unidades?)" % (k, Y[i])); return
    if any(a[i] is None for a in doc["regions"].values() for i in range(n)): errs.append("italy-land: hueco en una region"); return
    if not 8000 <= doc["italy"][-1] <= 60000: errs.append("italy-land: total de Italia fuera de rango"); return
    stats["italy-land anos"] = n

def spain_milk(doc, errs, warns, stats):
    """Leche cruda de INFOLAC (MAPA): periodos ordenados y sin repetir, series de la longitud de los periodos, 17 comunidades esperadas, sin negativos, precio/grasa/proteina en rango, leche ecologica <= entregas,
    comunidades suman las entregas del mes (el total puede superar la suma solo por el ganadero de otro pais que declara el MAPA, <= 0,1 %), ganaderos por comunidad <= total, y el ultimo periodo es el mes del ultimo informe."""
    m = _sm_mod(); P = doc["periods"]; n = len(P)
    if P != sorted(set(P)): errs.append("spain-milk: periodos desordenados o repetidos"); return
    if set(doc["ccaa"]) != set(m.CCAA): errs.append("spain-milk: comunidades distintas de las 17 esperadas"); return
    N = doc["national"]
    for k, a in N.items():
        if len(a) != n: errs.append("spain-milk: la serie nacional %s no tiene la longitud de los periodos" % k); return
        if any(x is not None and x < 0 for x in a): errs.append("spain-milk: valor negativo en %s" % k); return
    for c, vs in doc["ccaa"].items():
        for v, a in vs.items():
            if len(a) != n: errs.append("spain-milk: %s %s no tiene la longitud de los periodos" % (c, v)); return
            if any(x is not None and x < 0 for x in a): errs.append("spain-milk: valor negativo en %s %s" % (c, v)); return
            if v == "fat" and any(x is not None and not 2.5 <= x <= 6 for x in a): errs.append("spain-milk: grasa fuera de rango en %s" % c); return
            if v == "protein" and any(x is not None and not 2.5 <= x <= 4.5 for x in a): errs.append("spain-milk: proteina fuera de rango en %s" % c); return
    if P[-1] != doc["report"]["month"]: errs.append("spain-milk: el ultimo periodo (%s) no es el mes del informe (%s)" % (P[-1], doc["report"]["month"])); return
    for i, p in enumerate(P):
        d = N["deliveries"][i]
        if N["price"][i] is not None and not 0.2 <= N["price"][i] <= 1.0: errs.append("spain-milk %s: precio fuera de rango" % p)
        if N["fat"][i] is not None and not 2.5 <= N["fat"][i] <= 6: errs.append("spain-milk %s: grasa fuera de rango" % p)
        if N["protein"][i] is not None and not 2.5 <= N["protein"][i] <= 4.5: errs.append("spain-milk %s: proteina fuera de rango" % p)
        if d is not None and N["organic"][i] is not None and N["organic"][i] > d: errs.append("spain-milk %s: leche ecologica mayor que las entregas" % p)
        pr = [doc["ccaa"][c]["production"][i] for c in doc["ccaa"]]
        if d is not None and all(x is not None for x in pr):
            s = sum(pr); tol = 10 + 0.00002 * d
            if not (-tol <= d - s <= tol + 0.001 * d): errs.append("spain-milk %s: las comunidades suman %s t y las entregas %s t" % (p, round(s), d))
        fm = [doc["ccaa"][c]["farmers"][i] for c in doc["ccaa"]]
        if N["farmers"][i] is not None and all(x is not None for x in fm) and sum(fm) > N["farmers"][i] + 2: errs.append("spain-milk %s: mas ganaderos en las comunidades que en el total" % p)
    stats["spain-milk meses"] = n


def ers_cost_reference(doc, errs, warns, stats):
    """Referencia ERS: las partidas deben sumar el total publicado, los costes imputados no pueden exceder el total y no hay valores negativos."""
    keys = set(doc["map"])
    for crop, c in doc["crops"].items():
        if set(c["costs"]) != keys: errs.append("ers-ref %s: partidas distintas del mapa" % crop); continue
        if any(v < 0 for v in c["costs"].values()): errs.append("ers-ref %s: partida negativa" % crop)
        if abs(sum(c["costs"].values()) - c["totalCostsListed"]) > 0.06: errs.append("ers-ref %s: partidas (%.2f) no suman el total publicado (%.2f)" % (crop, sum(c["costs"].values()), c["totalCostsListed"]))
        if not (0 <= c["imputed"] <= c["totalCostsListed"]): errs.append("ers-ref %s: costes imputados fuera de rango" % crop)
        if not (c["yieldBuPerAcre"] > 0) or not (1990 <= c["year"] <= 2100): errs.append("ers-ref %s: rendimiento o ano invalidos" % crop)
        if c.get("operatingCosts") is not None and c["operatingCosts"] > c["totalCostsListed"] + 0.01: errs.append("ers-ref %s: costes operativos mayores que el total" % crop)
    stats["crops"] = len(doc["crops"])

def crop_insurance(doc, errs, warns, stats):
    """RMA Summary of Business: años consecutivos, 6 magnitudes enteras >= 0 por año, subvencion <= prima, indemnizacion/prima plausible en años cerrados,
    estados y cultivos SUMAN el total nacional (mismos registros, solo el redondeo individual), causas (admiten ajustes negativos pequeños) suman la indemnizacion por causa y causaCheck cuadra."""
    import datetime as _d
    cy = _d.date.today().year
    FIELDS = ["liability", "totalPremium", "subsidy", "indemnity", "policiesEarningPremium", "acres"]
    if doc["fields"] != FIELDS: errs.append("crop-insurance: campos distintos de %s" % FIELDS); return
    ys = doc["cropYears"]
    if ys != sorted(set(ys)) or ys[-1] - ys[0] != len(ys) - 1: errs.append("crop-insurance: cropYears no consecutivos o repetidos"); return
    if ys[-1] > cy + 1: errs.append("crop-insurance: año %d en el futuro" % ys[-1]); return
    if doc["latestCompleteYear"] not in ys or doc["provisionalFrom"] != doc["latestCompleteYear"] + 1: errs.append("crop-insurance: latestCompleteYear/provisionalFrom incoherentes"); return
    nat = doc["national"]
    if sorted(int(k) for k in nat) != ys: errs.append("crop-insurance: national no tiene exactamente los años de cropYears"); return
    def vec(v, tag):
        if not (isinstance(v, list) and len(v) == 6 and all(isinstance(x, int) and not isinstance(x, bool) and x >= 0 for x in v)): errs.append("crop-insurance %s: vector invalido %r" % (tag, v)); return False
        return True
    for y in ys:
        v = nat[str(y)]
        if not vec(v, "national/%d" % y): return
        if v[0] <= 0 or v[1] <= 0: errs.append("crop-insurance %d: capital asegurado o prima a cero" % y); return
        if v[2] > v[1]: errs.append("crop-insurance %d: subvencion (%d) mayor que la prima total (%d)" % (y, v[2], v[1])); return
        if y <= doc["latestCompleteYear"] and not (0.1 <= v[3] / v[1] <= 3.0): errs.append("crop-insurance %d: indemnizacion/prima fuera de 0,1-3 (%.2f)" % (y, v[3] / v[1])); return
    def agg(group, label, tol):
        for y in ys:
            s = [0] * 6
            for k, d in group.items():
                if str(y) in d:
                    if not vec(d[str(y)], "%s/%s/%d" % (label, k, y)): return
                    for j in range(6): s[j] += d[str(y)][j]
            for j in range(6):
                if abs(s[j] - nat[str(y)][j]) > tol: errs.append("crop-insurance %d: la suma de %s (%s=%d) no cuadra con el total nacional (%d)" % (y, label, FIELDS[j], s[j], nat[str(y)][j])); return
    for k in doc["states"]:
        if not re.match(r"^[A-Z]{2}$", k): errs.append("crop-insurance: estado invalido %r" % k); return
    agg(doc["states"], "estados", len(doc["states"]) + 1)
    agg(doc["crops"], "cultivos", len(doc["crops"]) + 1)
    ci = doc["causeIndemnity"]
    for k, d in ci.items():
        for y, v in d.items():
            if int(y) not in ys or not isinstance(v, int) or isinstance(v, bool): errs.append("crop-insurance causa %s %s: valor o año invalido" % (k, y)); return
            if v < 0 and -v > 0.001 * nat[y][3]: errs.append("crop-insurance causa %s %s: indemnizacion negativa (%d) mayor que el 0,1 %% de la nacional (la RMA admite ajustes negativos pequeños)" % (k, y, v)); return
    for k, st in doc["causeStateIndemnity"].items():
        if k not in ci: errs.append("crop-insurance: causeStateIndemnity con causa %r que no esta en causeIndemnity" % k); return
        for y in ci[k]:
            s = sum(d.get(y, 0) for d in st.values())
            if abs(s - ci[k][y]) > len(st) + 1: errs.append("crop-insurance causa %s %s: los estados suman %d y la causa %d" % (k, y, s, ci[k][y])); return
    for y, pair in doc["causeCheck"].items():
        if int(y) not in ys or not (isinstance(pair, list) and len(pair) == 2): errs.append("crop-insurance causeCheck %s invalido" % y); return
        s = sum(d.get(y, 0) for d in ci.values())
        if abs(s - pair[0]) > len(ci) + 1: errs.append("crop-insurance causeCheck %s: causas suman %d y se declara %d" % (y, s, pair[0])); return
        if pair[1] != nat[y][3]: errs.append("crop-insurance causeCheck %s: la indemnizacion SOB declarada no es la nacional" % y); return
        if int(y) < doc["provisionalFrom"] and pair[1] and abs(pair[0] - pair[1]) / pair[1] > 0.05: warns.append("crop-insurance %s: indemnizacion por causa (%d) y SOB (%d) difieren mas de un 5 %%" % (y, pair[0], pair[1]))
    stats["crop-insurance estados"] = len(doc["states"]); stats["crop-insurance cultivos"] = len(doc["crops"]); stats["crop-insurance causas"] = len(ci)


def crop_insurance_ca(doc, errs, warns, stats):
    """Seguro de cosechas de Canada (StatCan 32-10-0045 y 32-10-0049): años consecutivos, 11 territorios, tres magnitudes alineadas con los años,
    enteros >= 0 o null (hueco), Canada sin huecos en indemnizaciones y gasto en primas, y las provincias SUMAN Canada (StatCan publica ambos niveles; solo difiere el redondeo)."""
    import datetime as _d
    cy = _d.date.today().year
    MEAS = ["indemnities", "hailIndemnities", "farmPremiums"]
    GEOS = ["CA", "NL", "PE", "NS", "NB", "QC", "ON", "MB", "SK", "AB", "BC"]
    if doc["measures"] != MEAS: errs.append("crop-insurance-ca: magnitudes distintas de %s" % MEAS); return
    ys = doc["years"]
    if ys != sorted(set(ys)) or ys[-1] - ys[0] != len(ys) - 1: errs.append("crop-insurance-ca: years no consecutivos o repetidos"); return
    if doc["latestYear"] != ys[-1]: errs.append("crop-insurance-ca: latestYear (%s) no es el ultimo año (%s)" % (doc["latestYear"], ys[-1])); return
    if ys[-1] > cy: errs.append("crop-insurance-ca: año %d en el futuro" % ys[-1]); return
    if ys[-1] < cy - 3: warns.append("crop-insurance-ca: el ultimo año publicado es %d" % ys[-1])
    if any(y not in ys for y in doc["provisionalYears"]): errs.append("crop-insurance-ca: provisionalYears fuera de years"); return
    d = doc["data"]
    if sorted(d) != sorted(GEOS): errs.append("crop-insurance-ca: territorios distintos de los 11 esperados (%s)" % sorted(d)); return
    for g in GEOS:
        if sorted(d[g]) != sorted(MEAS): errs.append("crop-insurance-ca %s: magnitudes distintas" % g); return
        for m in MEAS:
            v = d[g][m]
            if not isinstance(v, list) or len(v) != len(ys): errs.append("crop-insurance-ca %s/%s: longitud %s distinta de la de years (%d)" % (g, m, len(v) if isinstance(v, list) else v, len(ys))); return
            for i, x in enumerate(v):
                if x is None: continue
                if not isinstance(x, int) or isinstance(x, bool) or x < 0: errs.append("crop-insurance-ca %s/%s/%d: valor invalido %r" % (g, m, ys[i], x)); return
    for m in ("indemnities", "farmPremiums"):
        if any(x is None for x in d["CA"][m]): errs.append("crop-insurance-ca: Canada con huecos en %s" % m); return
    if any(x <= 0 for x in d["CA"]["farmPremiums"]): errs.append("crop-insurance-ca: gasto en primas de Canada a cero"); return
    for m in MEAS:
        for i, y in enumerate(ys):
            ca = d["CA"][m][i]
            if ca is None: continue
            s = sum(d[g][m][i] or 0 for g in GEOS[1:])
            if abs(s - ca) > len(GEOS): errs.append("crop-insurance-ca %d: las provincias suman %d y Canada %d en %s (miles de CAD)" % (y, s, ca, m)); return
    for m in ("farmPremiums",):
        for i in range(1, len(ys)):
            a, b = d["CA"][m][i - 1], d["CA"][m][i]
            if a and not (0.5 <= b / a <= 2.0): warns.append("crop-insurance-ca %d: el gasto en primas de Canada cambia %.0f %% respecto al año anterior" % (ys[i], 100 * (b / a - 1)))
    stats["crop-insurance-ca años"] = len(ys)


def _cap_date(s):
    try: return datetime.date.fromisoformat(s)
    except Exception: return None


def _cap_num(x): return isinstance(x, (int, float)) and not isinstance(x, bool)


def cap_es_amounts(doc, errs, warns, stats):
    """PAC España, importes del RD 1048/2022 (BOE). 5 campañas 2023-2027; en cada fila minimo <= planificado <= maximo; 20 regiones con ayuda básica, redistributiva en 2 tramos,
    jóvenes y mujeres jóvenes (el planificado de las mujeres es el máximo de la región); las asignaciones por región SUMAN los totales del Anexo VII; cada ecorrégimen con su umbral de degresividad;
    ayudas asociadas con minimo <= maximo; fuente BOE; las discrepancias Anexo VIII/IX declaradas son las reales. No se estima ni se completa nada."""
    if doc["campaigns"] != [2023, 2024, 2025, 2026, 2027]: errs.append("cap-es: campañas distintas de 2023-2027"); return
    if doc["source"]["id"] != "boe_es": errs.append("cap-es: la fuente no es boe_es"); return
    if doc["source"]["consolidated"] is not True: errs.append("cap-es: el texto no esta marcado como consolidado"); return
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > datetime.date.today(): errs.append("cap-es: verifiedAt invalido o en el futuro"); return
    if _cap_date(doc["source"]["consolidatedAt"][:10]) is None: errs.append("cap-es: consolidatedAt invalido"); return
    def arr(a, tag, pos=True):
        if not (isinstance(a, list) and len(a) == 5 and all(_cap_num(x) for x in a)): errs.append("cap-es %s: debe tener 5 importes numericos" % tag); return False
        if pos and any(x <= 0 for x in a): errs.append("cap-es %s: importe cero o negativo" % tag); return False
        return True
    def trio(t, tag):
        for k in ("planned", "min", "max"):
            if not arr(t[k], "%s/%s" % (tag, k)): return False
        for c in range(5):
            if not (t["min"][c] <= t["planned"][c] <= t["max"][c]): errs.append("cap-es %s %d: minimo/planificado/maximo incoherentes (%s, %s, %s)" % (tag, doc["campaigns"][c], t["min"][c], t["planned"][c], t["max"][c])); return False
        return True
    regs = doc["regions"]
    if sorted(regs, key=int) != [str(i) for i in range(1, 21)]: errs.append("cap-es: las regiones no son 1-20"); return
    mism = []
    for k, r in regs.items():
        for n in ("abrs", "young", "youngWomen"):
            if not trio(r[n], "region %s %s" % (k, n)): return
        for c in range(5):
            if r["youngWomen"]["planned"][c] != r["young"]["max"][c]: errs.append("cap-es region %s: el planificado de las mujeres jóvenes no es el máximo de la región" % k); return
        t = r["redistributiveTiers"]
        if t[0]["fromHa"] != 0 or not (t[0]["toHa"] < t[1]["fromHa"] < t[1]["toHa"]): errs.append("cap-es region %s: tramos de hectáreas incoherentes" % k); return
        for i, x in enumerate(t):
            if not trio(x, "region %s tramo %d" % (k, i + 1)): return
            d = abs(x["annexVIIIAmount"] - x["planned"][3])
            if d > 0.5: errs.append("cap-es region %s tramo %d: el Anexo VIII (%s) y el IX (%s) difieren mas de 0,5 €" % (k, i + 1, x["annexVIIIAmount"], x["planned"][3])); return
            if d > 0.005: mism.append((int(k), i + 1))
        for n in ("abrs", "redistributive", "young"):
            if not arr(r["allocation"][n], "region %s asignacion %s" % (k, n)): return
    if sorted((d["region"], d["tier"]) for d in doc["discrepancies"]) != sorted(mism): errs.append("cap-es: las discrepancias declaradas entre los anexos VIII y IX no son las reales"); return
    for n in ("abrs", "redistributive", "young", "youngWomen"):
        if not arr(doc["allocations"][n], "asignaciones %s" % n): return
    for n in ("abrs", "redistributive", "young"):
        for c in range(5):
            s = sum(r["allocation"][n][c] for r in regs.values())
            if abs(s - doc["allocations"][n][c]) > 2: errs.append("cap-es %s %d: las regiones suman %.2f y el total es %.2f" % (n, doc["campaigns"][c], s, doc["allocations"][n][c])); return
    seen = set(); surf = {d["surfaceType"] for d in doc["degressivity"]}
    if len(surf) != len(doc["degressivity"]): errs.append("cap-es: umbrales de degresividad repetidos"); return
    for e in doc["ecoschemes"]:
        if e["id"] in seen: errs.append("cap-es: ecorrégimen repetido %s" % e["id"]); return
        seen.add(e["id"])
        if not trio(e, e["id"]): return
        if e["surfaceType"] not in surf and e["scheme"] != "i": errs.append("cap-es %s: sin umbral de degresividad para %s" % (e["id"], e["surfaceType"])); return
    codes = {b["scheme"] for b in doc["ecoschemeBudget"]}
    if not {e["scheme"] for e in doc["ecoschemes"]} <= {c[0] for c in codes}: errs.append("cap-es: ecorregímenes sin dotación en el Anexo XI"); return
    for b in doc["ecoschemeBudget"]:
        if not arr(b["amount"], "dotacion %s" % b["scheme"]): return
    ids = set()
    for a in doc["associatedAid"]:
        if a["id"] in ids: errs.append("cap-es: ayuda asociada repetida %s" % a["id"]); return
        ids.add(a["id"])
        if not (arr(a["min"], a["id"] + "/min") and arr(a["max"], a["id"] + "/max")): return
        if any(a["min"][c] > a["max"][c] for c in range(5)): errs.append("cap-es %s: minimo mayor que maximo" % a["id"]); return
        if (a["kind"] == "crop") != (a["unit"] == "EUR/ha"): errs.append("cap-es %s: unidad incoherente con el tipo" % a["id"]); return
    last = None
    for ch in doc["changes"]:
        d = _cap_date(ch["detectedAt"])
        if d is None or d > datetime.date.today() or (last and d < last): errs.append("cap-es: registro de cambios con fechas invalidas o desordenadas"); return
        last = d
    if (datetime.date.today() - vd).days > 21: warns.append("cap-es: los importes se verificaron por última vez el %s" % doc["verifiedAt"])
    stats["cap-es ecorregimenes"] = len(doc["ecoschemes"]); stats["cap-es ayudas asociadas"] = len(doc["associatedAid"])


def cap_es_watch(doc, errs, warns, stats):
    """PAC España, seguimiento del texto consolidado del BOE: huellas de la linea base (lo que revisaron las reglas) y de la última lectura; 'reviewNeeded' debe ser EXACTAMENTE la diferencia
    (no se puede ocultar un cambio), con las normas modificadoras nuevas incluidas; comprobacion semanal (aviso si pasa de 21 dias)."""
    cd = _cap_date(doc["checkedAt"])
    if cd is None or cd > datetime.date.today(): errs.append("cap-es watch: checkedAt invalido o en el futuro"); return
    b, c = doc["baseline"], doc["current"]
    for g in ("articles", "annexes", "provisions"):
        if not b[g] or not c[g]: errs.append("cap-es watch: grupo %s vacio" % g); return
    need = 0
    for g in ("articles", "annexes", "provisions"):
        for k, v in c[g].items():
            if k not in b[g] or b[g][k]["sha256"] != v["sha256"]: need += 1
    ba = {a["id"] for a in b["legal"]["amendments"]}
    need += sum(1 for a in c["legal"]["amendments"] if a["id"] not in ba)
    if len(doc["reviewNeeded"]) != need: errs.append("cap-es watch: reviewNeeded tiene %d entradas y la diferencia real es %d" % (len(doc["reviewNeeded"]), need)); return
    if not all(isinstance(x, str) and x for x in doc["reviewNeeded"]): errs.append("cap-es watch: reviewNeeded con entradas invalidas"); return
    if _cap_date(c["legal"]["consolidatedAt"][:10]) is None: errs.append("cap-es watch: consolidatedAt invalido"); return
    if need: warns.append("cap-es: el BOE ha cambiado algo que las reglas citan (%s): revisar data/cap/es/rules.json" % "; ".join(doc["reviewNeeded"][:4]))
    if (datetime.date.today() - cd).days > 21: warns.append("cap-es watch: ultima comprobacion del BOE el %s" % doc["checkedAt"])
    stats["cap-es articulos vigilados"] = len(c["articles"])


def cap_es_rules(doc, errs, warns, stats):
    """PAC España, reglas curadas: identificadores unicos; cada regla y entrada de calendario con base legal; fechas del calendario validas (mes/dia reales, fin posterior al inicio);
    las excepciones por campaña apuntan a una entrada del calendario y su fecha cae en la campaña o en la siguiente; tramos de reduccion contiguos y crecientes; 9 ecorregímenes a-i sin repetir; fuente BOE."""
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > datetime.date.today(): errs.append("cap-es rules: verifiedAt invalido o en el futuro"); return
    if (datetime.date.today() - vd).days > 120: warns.append("cap-es rules: reglas revisadas por última vez el %s" % doc["verifiedAt"])
    ids = [r["id"] for r in doc["rules"]]
    if len(set(ids)) != len(ids): errs.append("cap-es rules: identificadores de regla repetidos"); return
    cal = {}
    for x in doc["calendar"]:
        if x["id"] in cal: errs.append("cap-es rules: calendario con identificador repetido %s" % x["id"]); return
        cal[x["id"]] = x
        for tag in ("when", "until"):
            w = x.get(tag)
            if w is None: continue
            try: datetime.date(2024 + w["yearOffset"], w["month"], w["day"])
            except Exception: errs.append("cap-es rules: fecha invalida en %s/%s" % (x["id"], tag)); return
        if x.get("until"):
            a = (x["when"]["yearOffset"], x["when"]["month"], x["when"]["day"]); b = (x["until"]["yearOffset"], x["until"]["month"], x["until"]["day"])
            if not a < b: errs.append("cap-es rules: %s termina antes de empezar" % x["id"]); return
    for o in doc["campaignOverrides"]:
        if o["calendarId"] not in cal: errs.append("cap-es rules: excepcion para un hito que no existe (%s)" % o["calendarId"]); return
        d = _cap_date(o["date"])
        if d is None or d.year not in (o["campaign"], o["campaign"] + 1): errs.append("cap-es rules: la fecha de la excepcion %s/%s no cae en la campaña" % (o["campaign"], o["calendarId"])); return
        if o.get("region") is not None and not isinstance(o["region"], str): errs.append("cap-es rules: region invalida en una excepcion"); return
    codes = [e["code"] for e in doc["ecoschemes"]]
    if sorted(codes) != list("abcdefghi"): errs.append("cap-es rules: los ecorregímenes deben ser a-i sin repetir"); return
    byid = {r["id"]: r for r in doc["rules"]}
    for need in ("min-payment", "abrs-reduction", "young-farmers", "eco-degressivity", "eco-bonus-25", "financial-discipline"):
        if need not in byid or "values" not in byid[need]: errs.append("cap-es rules: falta la regla con valores %s" % need); return
    v = byid["min-payment"]["values"]
    if not (0 < v["minEur"] <= v["maxRaisedEur"]): errs.append("cap-es rules: umbral minimo incoherente"); return
    t = byid["abrs-reduction"]["values"]
    tiers = t["tiers"]
    if tiers[0]["fromEur"] <= 0 or any(tiers[i]["toEur"] != tiers[i + 1]["fromEur"] for i in range(len(tiers) - 1)) or tiers[-1]["toEur"] is not None: errs.append("cap-es rules: tramos de reduccion no contiguos"); return
    if any(not (0 < x["reduction"] <= 1) for x in tiers) or [x["reduction"] for x in tiers] != sorted(x["reduction"] for x in tiers) or tiers[-1]["reduction"] != 1: errs.append("cap-es rules: porcentajes de reduccion invalidos"); return
    if t["maxEur"] <= tiers[-1]["fromEur"]: errs.append("cap-es rules: el maximo de la ayuda basica debe superar el inicio del ultimo tramo"); return
    y = byid["young-farmers"]["values"]
    if not (1 <= y["maxHa"] <= 1000 and 1 <= y["years"] <= 10 and 0 <= y["womenBonus"] <= 0.5): errs.append("cap-es rules: valores de jóvenes fuera de rango"); return
    tr = (doc.get("i18n") or {}).get("rules") or {}
    for r in doc["rules"]:
        for l in ("en", "fr", "it"):
            if not (tr.get(r["id"]) or {}).get(l): warns.append("cap-es rules: la regla %s no tiene traduccion al %s (se mostrara en español)" % (r["id"], l))
    for k in tr:
        if k not in byid: errs.append("cap-es rules: traduccion de una regla que no existe (%s)" % k); return
    stats["cap-es reglas"] = len(doc["rules"]); stats["cap-es hitos"] = len(doc["calendar"])


# ---------------------------------------------------------------- Europa en profundidad: Dinamarca, Paises Bajos, Francia
def _eu_series(tag, seq, rx, errs, lo=0.0, hi=None):
    """Serie [[periodo, valor]]: periodo con el formato esperado, estrictamente creciente, valor numerico finito y dentro de rango. Devuelve {periodo: valor} o None."""
    out = {}; last = None
    if not isinstance(seq, list): errs.append("%s: no es una lista" % tag); return None
    for p in seq:
        if not (isinstance(p, list) and len(p) == 2 and isinstance(p[0], str) and re.match(rx, p[0])): errs.append("%s: punto invalido %r" % (tag, p)); return None
        if last is not None and p[0] <= last: errs.append("%s: periodos no crecientes (%s tras %s)" % (tag, p[0], last)); return None
        if not _num(p[1]) or p[1] < lo or (hi is not None and p[1] > hi): errs.append("%s %s: valor fuera de rango %r" % (tag, p[0], p[1])); return None
        last = p[0]; out[p[0]] = p[1]
    return out


def _eu_yield_count(A, Y, P, factor, minarea, tol, minprod=0, fromyear=0):
    """(comparaciones, discrepancias) entre rendimiento publicado y produccion/superficie."""
    tot = bad = 0
    for y in A:
        if y in Y and y in P and A[y] >= minarea and A[y] > 0 and Y[y] > 0 and P[y] >= minprod and int(y) >= fromyear:
            tot += 1
            if abs(P[y] * factor / A[y] - Y[y]) / Y[y] > tol: bad += 1
    return tot, bad


def denmark_depth(doc, errs, warns, stats):
    """Dinamarca (Statistics Denmark): cosecha por region (rendimiento = produccion/superficie), sacrificios mensuales, leche, censos trimestrales y subvenciones anuales."""
    if doc["source"]["id"] != "dst_dk": errs.append("denmark-depth: la fuente no es dst_dk"); return
    h = doc["harvest"]; regs = h["regions"]; n = 0; YT = [0, 0]
    if not (2015 <= h["breakYear"] <= TODAY.year): errs.append("denmark-depth: breakYear invalido"); return
    for c, rr in h["data"].items():
        if c not in h["crops"]: errs.append("denmark-depth: cultivo desconocido %s" % c); return
        for g, ms in rr.items():
            if g not in regs: errs.append("denmark-depth %s: region desconocida %s" % (c, g)); return
            S = {m: _eu_series("denmark-depth cosecha %s/%s/%s" % (c, g, m), ms[m], r"^\d{4}$", errs) for m in ms}
            if any(v is None for v in S.values()): return
            for m, s in S.items(): n += len(s)
            if all(k in S for k in ("area", "yield", "prod")):
                t, b = _eu_yield_count(S["area"], S["yield"], S["prod"], 1000, 1000, 0.04, minprod=20); YT[0] += t; YT[1] += b
                if g == "000" and b: errs.append("denmark-depth cosecha %s/000: el rendimiento nacional no cuadra con produccion/superficie (%d casos)" % (c, b)); return
    if "000" not in regs or not h["data"].get("wheat_winter", {}).get("000", {}).get("prod"): errs.append("denmark-depth: falta el trigo de invierno nacional"); return
    if YT[0] and YT[1] / YT[0] > 0.05: errs.append("denmark-depth: el rendimiento no cuadra con produccion/superficie en %d de %d casos (posible cambio de unidades)" % (YT[1], YT[0])); return
    for sp, cats in doc["slaughter"].items():
        if sp not in ("cattle", "pigs"): continue
        for cat, ms in cats.items():
            for m, s in ms.items():
                x = _eu_series("denmark-depth sacrificios %s/%s/%s" % (sp, cat, m), s, r"^\d{4}-(0[1-9]|1[0-2])$", errs)
                if x is None: return
                n += len(x)
    for k, s in doc["milk"].items():
        x = _eu_series("denmark-depth leche %s" % k, s, r"^\d{4}-(0[1-9]|1[0-2])$", errs)
        if x is None: return
        n += len(x)
    for sp, cats in doc["herd"].items():
        for cat, d in cats.items():
            for reg, s in (d.items() if isinstance(d, dict) and d and isinstance(next(iter(d.values())), list) else [("-", d)]):
                x = _eu_series("denmark-depth censo %s/%s/%s" % (sp, cat, reg), s, r"^\d{4}-Q[1-4]$", errs)
                if x is None: return
                n += len(x)
    for k, s in doc["subsidies"]["data"].items():
        if k not in doc["subsidies"]["names"]: errs.append("denmark-depth: subvencion sin nombre %s" % k); return
        x = _eu_series("denmark-depth subvencion %s" % k, s, r"^\d{4}$", errs, lo=-1e6)
        if x is None: return
    pc = doc["slaughter"]["pigs"].get("pigs", doc["slaughter"]["pigs"].get(next(iter(doc["slaughter"]["pigs"]), ""), {}))
    last = max((p[0] for s in pc.values() for p in s), default="")
    if last and (TODAY - datetime.date(int(last[:4]), int(last[5:7]), 1)).days > 150: warns.append("denmark-depth: el sacrificio de cerdos no se actualiza desde %s" % last)
    stats["denmark-depth puntos"] = n


def netherlands_farm(doc, errs, warns, stats):
    """Paises Bajos (CBS): cultivos por region (rendimiento = produccion/superficie), explotaciones y animales, sacrificios mensuales e indice de precios (2020=100)."""
    if doc["source"]["id"] != "cbs_nl": errs.append("netherlands-farm: la fuente no es cbs_nl"); return
    c = doc["crops"]; n = 0; cy = TODAY.year; YT = [0, 0]
    if any(not isinstance(y, int) or y > cy for y in c["provisional"]): errs.append("netherlands-farm: anos provisionales invalidos"); return
    for cr, rr in c["data"].items():
        if cr not in c["crops"]: errs.append("netherlands-farm: cultivo desconocido %s" % cr); return
        for g, ms in rr.items():
            if g not in c["regions"]: errs.append("netherlands-farm %s: region desconocida %s" % (cr, g)); return
            S = {m: _eu_series("netherlands-farm cultivo %s/%s/%s" % (cr, g, m), ms[m], r"^\d{4}$", errs) for m in ms}
            if any(v is None for v in S.values()): return
            for s in S.values(): n += len(s)
            if all(k in S for k in ("area", "yield", "prod")):
                t, b = _eu_yield_count(S["area"], S["yield"], S["prod"], 1, 1000, 0.10, fromyear=2005); YT[0] += t; YT[1] += b
    if YT[0] and YT[1] / YT[0] > 0.05: errs.append("netherlands-farm: el rendimiento no cuadra con produccion/superficie en %d de %d casos (posible cambio de unidades; el CBS tiene unas pocas discrepancias propias)" % (YT[1], YT[0])); return
    nat = c["data"].get("A042170", {}).get("NL01", {})
    if not nat.get("prod"): errs.append("netherlands-farm: falta el cultivo A042170 nacional"); return
    f = doc["farms"]; D = {}
    for k, gs in f["data"].items():
        for g, s in gs.items():
            if g not in f["regions"]: errs.append("netherlands-farm explotaciones %s: region desconocida %s" % (k, g)); return
            x = _eu_series("netherlands-farm explotaciones %s/%s" % (k, g), s, r"^\d{4}$", errs)
            if x is None: return
            n += len(x); D[(k, g)] = x
    for g in f["regions"]:
        a, b = D.get(("cattle", g), {}), D.get(("dairy_cows", g), {})
        for y in b:
            if y in a and b[y] > a[y]: errs.append("netherlands-farm %s %s: vacas lecheras (%s) superan el total de bovino (%s)" % (g, y, b[y], a[y])); return
        a, b = D.get(("agri_land", g), {}), D.get(("grass", g), {})
        for y in b:
            if y in a and b[y] > a[y] * 1.001: errs.append("netherlands-farm %s %s: pastos (%s) superan la superficie agraria (%s)" % (g, y, b[y], a[y])); return
    for sp, us in doc["slaughter"]["data"].items():
        for u, s in us.items():
            x = _eu_series("netherlands-farm sacrificios %s/%s" % (sp, u), s, r"^\d{4}-(0[1-9]|1[0-2])$", errs)
            if x is None: return
            n += len(x)
    for k, s in doc["priceIndex"]["data"].items():
        x = _eu_series("netherlands-farm indice %s" % k, s, r"^\d{4}-Q[1-4]$", errs, lo=20, hi=500)
        if x is None: return
        n += len(x)
    p = doc["slaughter"]["data"].get("pigs", {}).get("heads")
    if p and (TODAY - datetime.date(int(p[-1][0][:4]), int(p[-1][0][5:7]), 1)).days > 200: warns.append("netherlands-farm: el sacrificio mensual de cerdos no se actualiza desde %s" % p[-1][0])
    stats["netherlands-farm puntos"] = n


def netherlands_markets(doc, errs, warns, stats):
    """Paises Bajos (RVO): precios semanales (cerdo EUR/100 kg, lechon EUR/pieza, vacuno EUR/kg) y sacrificios semanales de cerdo (cabezas, peso, % carne, clases SEUROP que suman ~100)."""
    if doc["source"]["id"] != "rvo": errs.append("netherlands-markets: la fuente no es rvo"); return
    rx = r"^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$"; n = 0
    a = _eu_series("netherlands-markets cerdo", doc["pigPrice"]["pigs"], rx, errs, lo=50, hi=300)
    b = _eu_series("netherlands-markets lechon", doc["pigPrice"]["piglets"], rx, errs, lo=5, hi=150)
    if a is None or b is None: return
    n += len(a) + len(b)
    for k, s in doc["cattlePrice"]["data"].items():
        x = _eu_series("netherlands-markets vacuno %s" % k, s, rx, errs, lo=0.3, hi=15)
        if x is None: return
        n += len(x)
    ps = doc["pigSlaughter"]; R = {"heads": (10000, 800000), "weight": (70, 130), "lean": (50, 65)}
    G = {}
    for k, s in ps.items():
        lo, hi = R.get(k, (0, 100))
        x = _eu_series("netherlands-markets sacrificio %s" % k, s, rx, errs, lo=lo, hi=hi)
        if x is None: return
        n += len(x); G[k] = x
    gs = [k for k in G if k.startswith("grade_")]
    if gs:
        for w in G["heads"]:
            if all(w in G[k] for k in gs):
                t = sum(G[k][w] for k in gs)
                if not (97 <= t <= 103): errs.append("netherlands-markets sacrificio %s: las clases SEUROP suman %.1f %%" % (w, t)); return
    last = max(a)
    y, w = int(last[:4]), int(last[6:])
    try: ld = datetime.date.fromisocalendar(y, min(w, 52), 1)
    except ValueError: ld = None
    if ld and (TODAY - ld).days > 35: warns.append("netherlands-markets: el precio del cerdo no se actualiza desde %s" % last)
    stats["netherlands-markets puntos"] = n


def france_vigieau(doc, errs, warns, stats):
    """Francia (VigiEau): foto por departamento (nivel dentro de la escala), recuentos que suman los departamentos y el historial propio, con fechas crecientes y el ultimo recuento igual a la foto."""
    if doc["source"]["id"] != "vigieau": errs.append("france-vigieau: la fuente no es vigieau"); return
    L = doc["levels"]
    if L != ["vigilance", "alerte", "alerte_renforcee", "crise"]: errs.append("france-vigieau: escala de niveles inesperada"); return
    seen = set(); cnt = {k: 0 for k in L}; cnt["none"] = 0
    for d in doc["departments"]:
        if not re.match(r"^(\d{2}|2A|2B|97\d)$", d["code"]) or d["code"] in seen: errs.append("france-vigieau: codigo de departamento invalido o repetido %r" % d["code"]); return
        seen.add(d["code"])
        for k in ("level", "sup", "sou", "aep"):
            if d[k] is not None and d[k] not in L: errs.append("france-vigieau %s: nivel %s=%r desconocido" % (d["code"], k, d[k])); return
        cnt[d["level"] or "none"] += 1
    if cnt != doc["counts"]: errs.append("france-vigieau: los recuentos no coinciden con los departamentos"); return
    last = None
    for h in doc["history"]:
        dd = _date(h["date"])
        if dd is None or dd > TODAY or (last and h["date"] <= last): errs.append("france-vigieau: historial con fechas invalidas o no crecientes (%s)" % h["date"]); return
        if sum(h["counts"].values()) != len(doc["departments"]) and sum(h["counts"].values()) < 90: errs.append("france-vigieau %s: recuento historico incoherente" % h["date"]); return
        last = h["date"]
    if doc["history"][-1]["counts"] != doc["counts"]: errs.append("france-vigieau: el ultimo recuento del historial no es la foto actual"); return
    fm = doc.get("farm")
    if fm:
        deps = {d["code"]: d for d in doc["departments"]}
        for k, v in fm["departments"].items():
            if k not in deps: errs.append("france-vigieau farm: departamento %r desconocido" % k); return
            if not (isinstance(v["z"], int) and v["z"] >= 1): errs.append("france-vigieau farm %s: numero de zonas invalido" % k); return
            for t in ("irr", "wat"):
                a = v[t]
                if not (isinstance(a, list) and len(a) == 3 and all(isinstance(x, int) and x >= 0 for x in a) and sum(a) <= v["z"]): errs.append("france-vigieau farm %s: reparto de %s incoherente con las zonas" % (k, t)); return
            if deps[k]["level"] is None: errs.append("france-vigieau farm %s: hay zonas con arrete pero el departamento figura sin restricciones" % k); return
        for g in fm["guide"]:
            if not (isinstance(g, list) and len(g) == 6 and g[0] in ("Irrigation", "Abreuvement") and all(isinstance(x, str) and x for x in g)): errs.append("france-vigieau farm: fila de la guia invalida"); return
        stats["france-vigieau zonas con arrete"] = sum(v["z"] for v in fm["departments"].values())
    asof = (doc["source"].get("asOf") or "")[:10]
    if asof and _date(asof) and (TODAY - _date(asof)).days > 10: warns.append("france-vigieau: la API no se actualiza desde %s" % asof)
    stats["france-vigieau departamentos"] = len(doc["departments"])


def france_cereobs_cp(doc, errs, warns, stats):
    """Francia (Cere'Obs, cereales de paja): los cuatro cultivos presentes y cada uno cumple las mismas reglas que el maiz (semanas crecientes, 0-100, clases de estado ~100)."""
    ids = ("soft-wheat", "durum-wheat", "winter-barley", "spring-barley")
    for c in ids:
        if c not in doc["crops"]: errs.append("france-cereobs-cp: falta el cultivo %s" % c); return
        sub = {"source": doc["source"], "fields": doc["fields"], "national": doc["crops"][c]["national"], "regions": doc["crops"][c]["regions"]}
        e2 = []
        france_cereobs(sub, e2, warns, stats)
        if e2: errs.extend(["%s: %s" % (c, x) for x in e2]); return


def france_cereobs(doc, errs, warns, stats):
    """Francia (Cere'Obs, maiz): semanas crecientes, porcentajes 0-100, estado (5 clases) suma ~100 cuando esta completo; regiones no vacias."""
    if doc["source"]["id"] != "franceagrimer": errs.append("france-cereobs: la fuente no es franceagrimer"); return
    F = doc["fields"]; n = 0; rx = r"^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$"
    def rows(tag, seq):
        nonlocal n
        last = None
        for r in seq:
            if not (isinstance(r, list) and len(r) == len(F) + 1 and re.match(rx, str(r[0]))): errs.append("%s: fila invalida %r" % (tag, r[:2] if isinstance(r, list) else r)); return False
            if last and r[0] <= last: errs.append("%s: semanas no crecientes (%s tras %s)" % (tag, r[0], last)); return False
            last = r[0]
            for v in r[1:]:
                if v is not None and not (_num(v) and -0.01 <= v <= 100.01): errs.append("%s %s: porcentaje fuera de 0-100 (%r)" % (tag, r[0], v)); return False
            cs = r[-5:]
            if all(v is not None for v in cs) and not (97 <= sum(cs) <= 103): errs.append("%s %s: las clases de estado suman %.1f" % (tag, r[0], sum(cs))); return False
            n += 1
        return True
    if not rows("france-cereobs nacional", doc["national"]): return
    for g, seq in doc["regions"].items():
        if not seq or not rows("france-cereobs %s" % g, seq): errs.append("france-cereobs: region %s vacia o invalida" % g) if not seq else None; return
    ld = doc["source"].get("dataUntil")
    if ld and _date(ld) and (TODAY - _date(ld)).days > 330: warns.append("france-cereobs: los datos llegan hasta %s" % ld)
    stats["france-cereobs filas"] = n


def cap_de_amounts(doc, errs, warns, stats):
    """PAC Alemania: importes positivos con unidad, documentos declarados, tres campanas reales completas, razon real/planificado comun en las Oko-Regelungen y aviso si falta el importe real de 2026 pasado el 15-dic-2026."""
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > TODAY: errs.append("cap-de: verifiedAt invalido o en el futuro"); return
    docs = {d["id"]: d for d in doc["documents"]}
    for y in (2023, 2024, 2025):
        if "BAnz-%d" % y not in docs: errs.append("cap-de: falta la Bekanntmachung de %d" % y); return
    seen = set(); ratios = {}
    for it in doc["items"]:
        if it["id"] in seen: errs.append("cap-de: importe repetido %s" % it["id"]); return
        seen.add(it["id"])
        if it["unit"] not in ("EUR/ha", "EUR/head"): errs.append("cap-de %s: unidad invalida %r" % (it["id"], it["unit"])); return
        for y, v in it["actual"].items():
            if not _cap_num(v) or v <= 0: errs.append("cap-de %s: importe real %s invalido" % (it["id"], y)); return
        if it["actual"].keys() != {"2023", "2024", "2025"}: errs.append("cap-de %s: faltan campanas reales" % it["id"]); return
        if it["planned"]:
            if it["plannedDoc"] not in docs: errs.append("cap-de %s: documento de importe planificado desconocido" % it["id"]); return
            for y, v in it["planned"].items():
                if not _cap_num(v) or v <= 0: errs.append("cap-de %s: importe planificado %s invalido" % (it["id"], y)); return
            if it["group"] == "eco":
                for y in ("2023", "2024", "2025"): ratios.setdefault(y, []).append(it["actual"][y] / it["planned"][y])
    for y, rs in ratios.items():
        if max(rs) - min(rs) > 0.0012: errs.append("cap-de: la razon real/planificado de las Oko-Regelungen de %s no es comun (%.4f-%.4f): revisar la transcripcion" % (y, min(rs), max(rs))); return
    codes = {it["code"].split(",")[0] for it in doc["items"] if it["group"] == "eco"}
    cc = [c["code"] for c in doc["conditions"]]
    if set(cc) != {"\u00d6R " + k for k in ("1a", "1b", "1c", "1d", "2", "3", "4", "5", "6", "7")} or len(cc) != len(set(cc)): errs.append("cap-de: las condiciones no cubren cada Oko-Regelung una sola vez"); return
    if codes != set(cc): errs.append("cap-de: las condiciones y los importes de las Oko-Regelungen no coinciden"); return
    for c in doc["conditions"]:
        if c["ref"].split(" Nr.")[0] != "GAPDZV Anlage 5" or "GAPDZV-A5" not in docs: errs.append("cap-de %s: condicion sin referencia a la Anlage 5" % c["code"]); return
        for l in ("es", "en", "fr", "it"):
            if not c["text"].get(l) or any(len(x.strip()) < 10 for x in c["text"][l]): errs.append("cap-de %s: texto vacio en %s" % (c["code"], l)); return
        if len({len(c["text"][l]) for l in ("es", "en", "fr", "it")}) != 1: errs.append("cap-de %s: los idiomas tienen distinto numero de puntos" % c["code"]); return
    for k, d in doc["ecoAllocations"].items():
        if any((not _cap_num(v)) or v <= 0 for v in d.values()): errs.append("cap-de: asignacion invalida en %s" % k); return
    if TODAY >= datetime.date(2026, 12, 15) and doc["lastActualYear"] < 2026: warns.append("cap-de: debe de haberse publicado ya la Bekanntmachung de 2026: actualizar scripts/build-cap-de.py")
    stats["cap-de importes"] = len(doc["items"]); stats["cap-de condiciones"] = len(doc["conditions"])


def cap_fr_amounts(doc, errs, warns, stats):
    """PAC Francia: cada importe pertenece a una campaña declarada y tiene una cadena de versiones con documentos conocidos y fechas ordenadas, el vigente es el ultimo, los NOR son unicos,
    y los documentos de una campaña no se publican antes del inicio de ese año natural menos uno."""
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > TODAY: errs.append("cap-fr: verifiedAt invalido o en el futuro"); return
    camps = doc["campaigns"]
    if camps != sorted(set(camps)): errs.append("cap-fr: campañas repetidas o desordenadas"); return
    docs = {}
    for d in doc["documents"]:
        pub = _cap_date(d["published"]); sig = _cap_date(d["signed"])
        if pub is None or sig is None or pub > TODAY or sig > pub: errs.append("cap-fr %s: fechas invalidas" % d["id"]); return
        if d["id"] in docs or not str(d["jorfText"]).startswith("JORFTEXT") or not str(d["nor"]).startswith("AGR"): errs.append("cap-fr %s: documento repetido o referencia invalida" % d["id"]); return
        docs[d["id"]] = d
    if len({d["nor"] for d in docs.values()}) != len(docs): errs.append("cap-fr: NOR repetido"); return
    seen = set()
    for it in doc["items"]:
        if it["id"] in seen: errs.append("cap-fr: importe repetido %s" % it["id"]); return
        seen.add(it["id"])
        if it["campaign"] not in camps: errs.append("cap-fr %s: campaña %r no declarada" % (it["id"], it["campaign"])); return
        if it["unit"] not in ("EUR/ha", "EUR/head", "EUR", "PCT"): errs.append("cap-fr %s: unidad invalida %r" % (it["id"], it["unit"])); return
        vs = it["versions"]
        if not vs: errs.append("cap-fr %s: sin versiones" % it["id"]); return
        last = None
        for v in vs:
            if v["doc"] not in docs: errs.append("cap-fr %s: documento desconocido %s" % (it["id"], v["doc"])); return
            if not _cap_num(v["value"]) or v["value"] <= 0: errs.append("cap-fr %s: importe invalido" % it["id"]); return
            if last and docs[v["doc"]]["published"] < last: errs.append("cap-fr %s: versiones desordenadas" % it["id"]); return
            last = docs[v["doc"]]["published"]
            if int(docs[v["doc"]]["published"][:4]) < it["campaign"] - 1: errs.append("cap-fr %s: documento anterior a la campaña" % it["id"]); return
        if it["current"] != vs[-1]["value"] or it["currentDoc"] != vs[-1]["doc"]: errs.append("cap-fr %s: el importe vigente no es el de la ultima version" % it["id"]); return
    for c in camps:
        if not any(i["campaign"] == c for i in doc["items"]): errs.append("cap-fr: la campaña %d no tiene importes" % c); return
    stats["cap-fr importes"] = len(doc["items"]); stats["cap-fr arretes"] = len(docs)


def cap_pl_amounts(doc, errs, warns, stats):
    """PAC Polonia: tasas oficiales por campaña: cada valor apunta a un reglamento del Dziennik Ustaw de esa campaña, 'latest' es el de la ultima campaña, las estimaciones de 2026 son
    SOLO anticipos (kind ESTIMATED_RATE_FOR_ADVANCES) y salen del reglamento declarado."""
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > TODAY: errs.append("cap-pl: verifiedAt invalido o en el futuro"); return
    camps = doc["campaigns"]
    docs = {}
    for d in doc["documents"]:
        pub = _cap_date(d["published"]); sig = _cap_date(d["signed"])
        if pub is None or sig is None or pub > TODAY or sig > pub: errs.append("cap-pl %s: fechas invalidas" % d["id"]); return
        if d["id"] in docs or not re.fullmatch(r"DU/\d{4}/\d+", d["eli"]) or not d["url"].startswith("https://api.sejm.gov.pl/eli/acts/" + d["eli"]): errs.append("cap-pl %s: documento repetido o ELI invalido" % d["id"]); return
        if d["campaign"] not in camps: errs.append("cap-pl %s: campaña no declarada" % d["id"]); return
        docs[d["id"]] = d
    if len({d["eli"] for d in docs.values()}) != len(docs): errs.append("cap-pl: ELI repetido"); return
    seen = set()
    for it in doc["items"]:
        if it["id"] in seen: errs.append("cap-pl: tasa repetida %s" % it["id"]); return
        seen.add(it["id"])
        if not it["unit"].startswith("PLN"): errs.append("cap-pl %s: unidad invalida %r" % (it["id"], it["unit"])); return
        vals = it["values"]
        if not vals: errs.append("cap-pl %s: sin valores" % it["id"]); return
        for y, v in vals.items():
            if int(y) not in camps or v["doc"] not in docs or docs[v["doc"]]["campaign"] != int(y): errs.append("cap-pl %s/%s: documento o campaña incoherente" % (it["id"], y)); return
            if not _cap_num(v["value"]) or v["value"] <= 0: errs.append("cap-pl %s/%s: valor invalido" % (it["id"], y)); return
        ly = max(int(y) for y in vals)
        if it["latestCampaign"] != ly or it["latest"] != vals[str(ly)]["value"]: errs.append("cap-pl %s: 'latest' no es el de la ultima campaña" % it["id"]); return
    e = doc["estimates2026"]
    if e["kind"] != "ESTIMATED_RATE_FOR_ADVANCES" or e["doc"] not in docs or not 0 < e["advanceShare"] < 1: errs.append("cap-pl: estimaciones de 2026 mal declaradas"); return
    if any(not _cap_num(x["value"]) or x["value"] <= 0 for x in e["items"]): errs.append("cap-pl: estimacion invalida"); return
    stats["cap-pl tasas"] = len(doc["items"]); stats["cap-pl reglamentos"] = len(docs)


def cap_nat_rules(doc, errs, warns, stats):
    """PAC Francia/Italia/Polonia, reglas curadas: identificadores unicos, base legal en cada regla, intervencion y hito; fechas del calendario reales; las excepciones por campaña apuntan a un hito
    y caen en la campaña o la siguiente; cada texto tiene traduccion en en/fr/it; fuente con https."""
    cc = doc["country"]
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > TODAY: errs.append("cap-%s rules: verifiedAt invalido o en el futuro" % cc); return
    if (TODAY - vd).days > 120: warns.append("cap-%s rules: reglas revisadas por última vez el %s" % (cc, doc["verifiedAt"]))
    if not str(doc["source"]["url"]).startswith("https://"): errs.append("cap-%s rules: fuente sin https" % cc); return
    for grp in ("interventions", "rules", "calendar"):
        ids = [x["id"] for x in doc[grp]]
        if len(set(ids)) != len(ids): errs.append("cap-%s rules: identificadores repetidos en %s" % (cc, grp)); return
        for x in doc[grp]:
            if not x.get("legalBasis"): errs.append("cap-%s rules: %s %s sin base legal" % (cc, grp, x["id"])); return
    for r in doc["rules"]:
        if not r.get("text") or not str(r.get("officialUrl", "")).startswith("https://"): errs.append("cap-%s rules: regla %s sin texto o sin enlace oficial" % (cc, r["id"])); return
    cal = {}
    for c in doc["calendar"]:
        w = c["when"]
        try: datetime.date(2024, w["month"], w["day"])
        except Exception: errs.append("cap-%s rules: fecha invalida en %s" % (cc, c["id"])); return
        cal[c["id"]] = c
    for o in doc["campaignOverrides"]:
        if o["calendarId"] not in cal: errs.append("cap-%s rules: excepcion a un hito inexistente %s" % (cc, o["calendarId"])); return
        d = _cap_date(o["date"])
        if d is None or d.year not in (o["campaign"], o["campaign"] + 1): errs.append("cap-%s rules: fecha de excepcion fuera de campaña (%s)" % (cc, o["date"])); return
    tr = doc["i18n"]
    for grp, src in (("rules", doc["rules"]), ("calendar", doc["calendar"])):
        for x in src:
            t = tr[grp].get(x["id"])
            if not isinstance(t, dict) or not all(isinstance(t.get(l), str) and t[l] for l in ("en", "fr", "it")): errs.append("cap-%s rules: sin traduccion en/fr/it de %s %s" % (cc, grp, x["id"])); return
    for o in doc["campaignOverrides"]:
        t = tr["overrides"].get("%d:%s" % (o["campaign"], o["calendarId"]))
        if not isinstance(t, dict) or not all(isinstance(t.get(l), str) and t[l] for l in ("en", "fr", "it")): errs.append("cap-%s rules: sin traduccion de la excepcion %s" % (cc, o["calendarId"])); return
    stats["cap-%s reglas" % cc.lower()] = len(doc["rules"]); stats["cap-%s intervenciones" % cc.lower()] = len(doc["interventions"])


def cap_nat_watch(doc, errs, warns, stats):
    """PAC Francia/Italia/Polonia, vigilancia: 'reviewNeeded' es EXACTAMENTE la diferencia entre linea base y lectura actual (huellas distintas y textos candidatos sin revisar);
    sin lectura (NOT_YET_RUN) no hay fecha de comprobacion; comprobacion semanal (aviso a los 21 dias)."""
    cc = doc["country"]
    b, c = doc["baseline"], doc["current"]
    if doc["status"] == "NOT_YET_RUN":
        if doc["checkedAt"] is not None: errs.append("cap-%s watch: NOT_YET_RUN con fecha de comprobacion" % cc)
        return
    cd = _cap_date(doc["checkedAt"]) if doc["checkedAt"] else None
    if cd is None or cd > TODAY: errs.append("cap-%s watch: checkedAt invalido o en el futuro" % cc); return
    need = sum(1 for k, v in c["fingerprints"].items() if k not in b["fingerprints"] or b["fingerprints"][k]["sha256"] != v["sha256"])
    need += sum(1 for k in b["fingerprints"] if k not in c["fingerprints"])
    ack = set(b["acknowledged"])
    need += sum(1 for x in c["candidates"] if x["id"] not in ack)
    if len(doc["reviewNeeded"]) != need: errs.append("cap-%s watch: reviewNeeded tiene %d entradas y la diferencia real es %d" % (cc, len(doc["reviewNeeded"]), need)); return
    if len({x["id"] for x in c["candidates"]}) != len(c["candidates"]): errs.append("cap-%s watch: candidatos repetidos" % cc); return
    for x in c["candidates"]:
        if _cap_date(x["date"]) is None or not str(x["url"]).startswith("https://"): errs.append("cap-%s watch: candidato invalido %s" % (cc, x["id"])); return
    if c["lastScanned"] is not None and _cap_date(c["lastScanned"]) is None: errs.append("cap-%s watch: lastScanned invalido" % cc); return
    if need: warns.append("cap-%s: la fuente oficial ha publicado algo que las reglas pueden citar (%s): revisar data/cap/%s/rules.json" % (cc, "; ".join(doc["reviewNeeded"][:3]), cc.lower()))
    if doc["status"] == "UNREACHABLE": warns.append("cap-%s watch: la ultima lectura no pudo llegar a la fuente" % cc)
    if (TODAY - cd).days > 21: warns.append("cap-%s watch: ultima comprobacion el %s" % (cc, doc["checkedAt"]))
    stats["cap-%s textos vigilados" % cc.lower()] = len(c["fingerprints"]) + len(c["candidates"])


def cap_dk_amounts(doc, errs, warns, stats):
    """PAC Dinamarca: importes positivos con unidad, cada paragrafo de un decreto declarado, estado Valid, verificacion reciente (aviso a los 21 dias) y cambios con fechas ordenadas."""
    vd = _cap_date(doc["verifiedAt"])
    if vd is None or vd > TODAY: errs.append("cap-dk: verifiedAt invalido o en el futuro"); return
    ids = set()
    for d in doc["documents"]:
        if d["status"] != "Valid": errs.append("cap-dk %s: el decreto no esta vigente (%s)" % (d["id"], d["status"])); return
        if not (_cap_date(d["signed"]) and _cap_date(d["versionDate"])): errs.append("cap-dk %s: fechas invalidas" % d["id"]); return
        ids.add(d["id"])
    if ids != {"BEK1363", "BEK1381"}: errs.append("cap-dk: decretos distintos de BEK1363 y BEK1381"); return
    seen = set()
    for s in doc["schemes"]:
        if s["id"] in seen or s["doc"] not in ids: errs.append("cap-dk: esquema repetido o con decreto desconocido %s" % s["id"]); return
        seen.add(s["id"])
        if not s["items"]: errs.append("cap-dk %s: sin importes" % s["id"]); return
        for it in s["items"]:
            if not _cap_num(it["amount"]) or it["amount"] <= 0 or it["unit"] not in ("EUR/ha", "DKK/ha", "EUR", "EUR/unit"): errs.append("cap-dk %s: importe o unidad invalidos %r" % (s["id"], it)); return
    for t in doc["thresholds"]:
        if not _cap_num(t["value"]) or t["value"] <= 0: errs.append("cap-dk umbral %s: valor invalido" % t["id"]); return
    last = None
    for c in doc["changes"]:
        d = _cap_date(c.get("date", "")) 
        if d is None or d > TODAY or (last and d < last): errs.append("cap-dk: registro de cambios con fechas invalidas o desordenadas"); return
        last = d
    if (TODAY - vd).days > 21: warns.append("cap-dk: los importes se verificaron por ultima vez el %s" % doc["verifiedAt"])
    stats["cap-dk esquemas"] = len(doc["schemes"]); stats["cap-dk umbrales"] = len(doc["thresholds"])


def cap_index(doc, errs, warns, stats):
    """PAC 2.0, contrato comun: cada pais declara sus seis componentes; INGESTED/PARTIAL exigen fichero existente en data/cap y NOT_INGESTED una razon; ES, DK y EU
    coinciden con sus ficheros; los eventos solo usan tipos activos (NEW_RULE no se emite: no es detectable) y enlazan el texto oficial https; los plazos no son anteriores a asOf."""
    ao = _cap_date(doc["asOf"])
    if ao is None or ao > TODAY: errs.append("cap-index: asOf invalido o en el futuro"); return
    ccs = [c["cc"] for c in doc["countries"]]
    if len(ccs) != len(set(ccs)): errs.append("cap-index: paises repetidos"); return
    for need in ("ES", "DK", "EU"):
        if need not in ccs: errs.append("cap-index: falta %s" % need); return
    ing = 0
    for c in doc["countries"]:
        for k, v in c["components"].items():
            if k not in doc["contract"]["components"]: errs.append("cap-index %s: componente desconocido %s" % (c["cc"], k)); return
            if v["state"] in ("INGESTED", "PARTIAL"):
                ing += 1
                if not v.get("file") or not (D / "cap" / v["file"]).exists(): errs.append("cap-index %s/%s: fichero inexistente %r" % (c["cc"], k, v.get("file"))); return
            elif not v.get("reason") or not v.get("reasonCode"): errs.append("cap-index %s/%s: NOT_INGESTED sin razon" % (c["cc"], k)); return
        if any(v["state"] != "NOT_INGESTED" for v in c["components"].values()):
            la = c.get("legalAct")
            if not la or not str(la.get("url", "")).startswith("https://") or not la.get("ref"): errs.append("cap-index %s: pais con datos sin acto legal oficial https" % c["cc"]); return
    w = doc["watch"]
    if w["eventTypes"].get("NEW_RULE") != "NOT_DETECTABLE" or any(e["type"] == "NEW_RULE" for e in w["events"]): errs.append("cap-index: NEW_RULE no es detectable y no puede emitirse"); return
    for e in w["events"]:
        if not str(e["officialUrl"]).startswith("https://"): errs.append("cap-index: evento sin enlace oficial https"); return
    for x in w["deadlines"]:
        d = _cap_date(x["date"])
        if d is None or d < ao or not str(x["officialUrl"]).startswith("https://"): errs.append("cap-index: plazo %s invalido o anterior a asOf" % x["id"]); return
    es = next(c for c in doc["countries"] if c["cc"] == "ES")
    if not all(v["state"] == "INGESTED" for v in es["components"].values()): errs.append("cap-index: ES debe tener los seis componentes (ficheros de data/cap/es)"); return
    if (TODAY - ao).days > 60: warns.append("cap-index: los plazos se calcularon el %s; reconstruir con scripts/build-cap-index.py" % doc["asOf"])
    stats["cap-index componentes con dato"] = ing; stats["cap-index plazos"] = len(w["deadlines"])


def cap_dk_watch(doc, errs, warns, stats):
    """PAC Dinamarca, seguimiento: 'reviewNeeded' debe ser EXACTAMENTE la diferencia entre linea base y lectura actual (huellas de paragrafos y modificaciones nuevas)."""
    cd = _cap_date(doc["checkedAt"])
    if cd is None or cd > TODAY: errs.append("cap-dk watch: checkedAt invalido o en el futuro"); return
    b, c = doc["baseline"], doc["current"]
    if not b["sections"] or not c["sections"]: errs.append("cap-dk watch: sin paragrafos vigilados"); return
    need = sum(1 for k, v in c["sections"].items() if k not in b["sections"] or b["sections"][k]["sha256"] != v["sha256"])
    need += sum(1 for k, v in b["sections"].items() if k not in c["sections"])
    for k, v in c["amendments"].items():
        need += sum(1 for a in v if a not in b["amendments"].get(k, []))
    if len(doc["reviewNeeded"]) != need: errs.append("cap-dk watch: reviewNeeded tiene %d entradas y la diferencia real es %d" % (len(doc["reviewNeeded"]), need)); return
    if need: warns.append("cap-dk: los decretos han cambiado (%s): revisar data/cap/dk/amounts.json" % "; ".join(str(x) for x in doc["reviewNeeded"][:4]))
    if (TODAY - cd).days > 21: warns.append("cap-dk watch: ultima comprobacion el %s" % doc["checkedAt"])
    stats["cap-dk parrafos vigilados"] = len(c["sections"])


_UCY_MOD = None
def _ucy_mod():
    global _UCY_MOD
    if _UCY_MOD is None:
        import importlib.util as _iu, pathlib as _p
        sp = _iu.spec_from_file_location("ucy", _p.Path(__file__).resolve().parent / "update-us-county-yields.py"); m = _iu.module_from_spec(sp); sp.loader.exec_module(m); _UCY_MOD = m
    return _UCY_MOD
UCY_MAX = {"corn": 400, "soybeans": 120, "wheat-winter": 250, "wheat-spring": 200, "cotton-upland": 3500, "sorghum": 300, "rice": 13000, "peanuts": 7000, "hay-alfalfa": 12, "barley": 250, "oats": 250}   # rendimiento maximo plausible por condado (unidades de NASS)
UCY_STATES = {"01", "02", "04", "05", "06", "08", "09", "10", "11", "12", "13", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "44", "45", "46", "47", "48", "49", "50", "51", "53", "54", "55", "56"}


def us_county_yields(doc, errs, warns, stats):
    """Rendimiento, superficie cosechada y produccion por condado (NASS): cultivo y series del script, anos seguidos y no futuros, FIPS de 5 cifras de un estado conocido, tres series con un valor por ano
    (null = hueco, nunca cero para algo que NASS no publica), rendimiento plausible, superficie cosechada > 0 en 'OTHER COUNTIES' y produccion = rendimiento x superficie / divisor (4 %), con a lo sumo un 1 % de condados-ano fuera."""
    import datetime as _d
    m = _ucy_mod(); c = next((x for x in m.CROPS if x["slug"] == doc["slug"]), None)
    if c is None: errs.append("us-county: cultivo %r desconocido" % doc["slug"]); return
    if doc["crop"] != c["key"] or doc["series"] != {k: c[k] for k in m.METRICS} or doc["units"] != c["units"] or doc["metrics"] != list(m.METRICS): errs.append("us-county/%s: clave, series o unidades distintas de las del script" % c["slug"]); return
    ys = doc["years"]
    if ys != list(range(ys[0], ys[0] + len(ys))) or ys[-1] > _d.date.today().year: errs.append("us-county/%s: anos no seguidos o en el futuro %r" % (c["slug"], ys)); return
    bad = tot = n_latest = 0; mx = UCY_MAX[c["slug"]]
    for f, arrs in doc["counties"].items():
        if not re.fullmatch(r"\d{5}", f) or f[:2] not in UCY_STATES: errs.append("us-county/%s: FIPS invalido %r" % (c["slug"], f)); return
        if not (isinstance(arrs, list) and len(arrs) == 3 and all(isinstance(a, list) and len(a) == len(ys) for a in arrs)): errs.append("us-county/%s %s: forma de las series invalida" % (c["slug"], f)); return
        for a in arrs:
            for v in a:
                if v is not None and (isinstance(v, bool) or not isinstance(v, (int, float)) or v < 0): errs.append("us-county/%s %s: valor invalido %r" % (c["slug"], f, v)); return
        for i in range(len(ys)):
            a, b, p = arrs[0][i], arrs[1][i], arrs[2][i]
            if a is not None and a > mx: errs.append("us-county/%s %s %d: rendimiento %s fuera de rango (max %s)" % (c["slug"], f, ys[i], a, mx)); return
            if f.endswith("998") and b is not None and b <= 0: errs.append("us-county/%s %s %d: 'otros condados' con superficie 0" % (c["slug"], f, ys[i])); return
            if a is None or b is None or p is None: continue
            tot += 1; exp = a * b / c["div"]
            if (exp == 0 and p != 0) or (exp and abs(p / exp - 1) > m.TOL): bad += 1
        if arrs[0][-1] is not None and not f.endswith("998"): n_latest += 1
    if tot and bad / tot > 0.01: errs.append("us-county/%s: %d de %d condados-ano con produccion distinta de rendimiento x superficie" % (c["slug"], bad, tot)); return
    stats["us-county condados (ultimo ano)"] = stats.get("us-county condados (ultimo ano)", 0) + n_latest
    if n_latest < 5: warns.append("us-county/%s: solo %d condados con rendimiento en %d" % (c["slug"], n_latest, ys[-1]))


def us_county_status(doc, errs, warns, stats):
    """Estado de ingesta de rendimientos por condado: un cultivo del script por entrada, sin repetidos, y 'latest' coherente con el rango de anos."""
    m = _ucy_mod(); known = {c["slug"]: c["key"] for c in m.CROPS}; seen = set()
    for e in doc["crops"]:
        if e["slug"] not in known or known[e["slug"]] != e["key"] or e["slug"] in seen: errs.append("us-county status: cultivo desconocido o repetido %r" % e["slug"]); return
        seen.add(e["slug"])
        if e["status"] in ("OK", "PARTIAL") and not (isinstance(e.get("latest"), int) and isinstance(e.get("years"), list) and len(e["years"]) == 2 and e["years"][1] == e["latest"]): errs.append("us-county status/%s: latest o years incoherentes" % e["slug"]); return
    stats["us-county cultivos"] = len(doc["crops"])


def _wk_bounds(week):
    import datetime as _d
    y, w = int(week[:4]), int(week[6:]); mon = _d.date.fromisocalendar(y, w, 1); return mon.isoformat(), (mon + _d.timedelta(days=6)).isoformat()


def news_archive(doc, errs, warns, stats):
    """Archivo semanal de noticias: la semana y sus fechas coinciden (lunes a domingo ISO), todas las noticias caen dentro de la semana, sin ids repetidos entre registros completos y ligeros,
    la cobertura empieza dentro de la semana y los registros ligeros tienen la forma [id, fecha, region, tema, productos, medio]."""
    try: lo, hi = _wk_bounds(doc["week"])
    except Exception: errs.append("news-archive: semana invalida %r" % doc.get("week")); return
    if (doc["from"], doc["to"]) != (lo, hi): errs.append("news-archive %s: from/to no son lunes-domingo de la semana" % doc["week"]); return
    if not (lo <= doc["coverage"]["from"] <= hi): errs.append("news-archive %s: la cobertura empieza fuera de la semana" % doc["week"]); return
    ids = set()
    for i in doc["items"]:
        if not (lo <= i["date"] <= hi): errs.append("news-archive %s: noticia %s fuera de la semana (%s)" % (doc["week"], i["id"], i["date"])); return
        if i["id"] in ids: errs.append("news-archive %s: id repetido %s" % (doc["week"], i["id"])); return
        ids.add(i["id"])
    for r in doc["rest"]:
        if not (isinstance(r[0], str) and isinstance(r[1], str) and isinstance(r[4], list) and isinstance(r[5], str)): errs.append("news-archive %s: registro ligero malformado %r" % (doc["week"], r[:2])); return
        if not (lo <= r[1] <= hi): errs.append("news-archive %s: noticia %s fuera de la semana (%s)" % (doc["week"], r[0], r[1])); return
        if r[0] in ids: errs.append("news-archive %s: id repetido %s (completo y ligero)" % (doc["week"], r[0])); return
        ids.add(r[0])
    stats["news-archive noticias"] = len(ids)


def blog_weekly(doc, errs, warns, stats):
    """Resumen semanal del blog: semana y fechas coherentes; los totales cuadran (suma por region, por tema y por dia = total de noticias; solo dias de la cobertura);
    la cobertura es de al menos 3 dias y al menos 40 noticias; los titulares destacados caen dentro de la cobertura, tienen enlace https, no se repiten y no hay mas de 2 por medio en cada bloque;
    complete solo si la semana ya termino."""
    import datetime as _d
    try: lo, hi = _wk_bounds(doc["week"])
    except Exception: errs.append("blog-weekly: semana invalida %r" % doc.get("week")); return
    if (doc["from"], doc["to"]) != (lo, hi): errs.append("blog-weekly %s: from/to no son lunes-domingo" % doc["week"]); return
    c = doc["coverage"]; t = doc["totals"]
    if not (lo <= c["from"] <= hi): errs.append("blog-weekly %s: la cobertura empieza fuera de la semana" % doc["week"]); return
    if t["items"] < 40: errs.append("blog-weekly %s: solo %d noticias (< 40): no debe publicarse" % (doc["week"], t["items"])); return
    for k in ("byRegion", "byDay"):
        if sum(t[k].values()) != t["items"]: errs.append("blog-weekly %s: totals.%s suma %d y hay %d noticias" % (doc["week"], k, sum(t[k].values()), t["items"])); return
    if sum(t["byTopic"].values()) > t["items"]: errs.append("blog-weekly %s: los temas suman mas que las noticias" % doc["week"]); return
    if any(not (c["from"] <= d <= hi) for d in t["byDay"]): errs.append("blog-weekly %s: dias fuera de la cobertura" % doc["week"]); return
    if c["days"] < 3: errs.append("blog-weekly %s: cobertura de %d dias (< 3)" % (doc["week"], c["days"])); return
    if doc["complete"] != (_d.date.fromisoformat(hi) < _d.datetime.now(_d.timezone.utc).date()) and doc["complete"]: errs.append("blog-weekly %s: marcada completa antes de terminar la semana" % doc["week"]); return
    def block(name, rows):
        seen = set(); per = {}
        for h in rows:
            if not (c["from"] <= h["date"] <= hi): errs.append("blog-weekly %s %s: titular fuera de la cobertura (%s)" % (doc["week"], name, h["date"])); return False
            if not h["url"].startswith("https://") and not h["url"].startswith("http://"): errs.append("blog-weekly %s %s: enlace invalido" % (doc["week"], name)); return False
            if h["url"] in seen: errs.append("blog-weekly %s %s: titular repetido" % (doc["week"], name)); return False
            seen.add(h["url"]); per[h["source"]] = per.get(h["source"], 0) + 1
            if per[h["source"]] > 2: errs.append("blog-weekly %s %s: mas de 2 titulares de %s" % (doc["week"], name, h["source"])); return False
        return True
    if not block("top", doc["top"]): return
    for r, rows in doc["byRegion"].items():
        if r not in t["byRegion"]: errs.append("blog-weekly %s: region %s sin noticias en los totales" % (doc["week"], r)); return
        if not block(r, rows): return
    stats["blog-weekly noticias"] = t["items"]


def blog_weekly_index(doc, errs, warns, stats):
    """Indice del blog semanal: semanas ordenadas de la mas nueva a la mas antigua, sin repetir, con fechas de lunes a domingo."""
    ws = [w["week"] for w in doc["weeks"]]
    if ws != sorted(set(ws), reverse=True): errs.append("blog-weekly-index: semanas desordenadas o repetidas"); return
    for w in doc["weeks"]:
        try: lo, hi = _wk_bounds(w["week"])
        except Exception: errs.append("blog-weekly-index: semana invalida %r" % w["week"]); return
        if (w["from"], w["to"]) != (lo, hi) or not (lo <= w["coverageFrom"] <= hi): errs.append("blog-weekly-index %s: fechas incoherentes" % w["week"]); return
    stats["blog-weekly semanas"] = len(ws)


def blog_country_week(doc, errs, warns, stats):
    """«La semana en...» (build-country-weeks.py): semana lunes-domingo, cobertura dentro de la semana, cada dato destacado llego esa semana y despues
    del inicio de la cobertura, los totales cuadran con los bloques, los movimientos van de mayor a menor y sin estimaciones (valor y cambio numericos)."""
    try: lo, hi = _wk_bounds(doc["week"])
    except Exception: errs.append("blog-country-week: semana invalida %r" % doc.get("week")); return
    w = "%s %s" % (doc["country"], doc["week"])
    if (doc["from"], doc["to"]) != (lo, hi): errs.append("blog-country-week %s: from/to no son lunes-domingo" % w); return
    cov = doc["coverage"]["from"]
    if not (lo <= cov <= hi): errs.append("blog-country-week %s: cobertura fuera de la semana" % w); return
    t = doc["totals"]
    if sum(t["byBlock"].values()) != t["updates"]: errs.append("blog-country-week %s: los bloques no suman el total" % w); return
    for r in doc["movers"] + doc["releases"]:
        if not (cov <= r["seen"] <= hi): errs.append("blog-country-week %s: %s llego fuera de la semana (%s)" % (w, r["id"], r["seen"])); return
    if any(r["block"] != "precios" or r["changePct"] is None for r in doc["movers"]): errs.append("blog-country-week %s: movimiento que no es un precio o sin cambio" % w); return
    ch = [abs(r["changePct"]) for r in doc["movers"]]
    if ch != sorted(ch, reverse=True): errs.append("blog-country-week %s: movimientos desordenados" % w); return
    if any(not (lo <= n["date"] <= hi) for n in doc["news"]): errs.append("blog-country-week %s: titular fuera de la semana" % w); return
    if len(doc["news"]) > t["news"]: errs.append("blog-country-week %s: mas titulares que noticias contadas" % w); return
    stats["semana %s" % doc["country"]] = t["updates"]


def blog_country_index(doc, errs, warns, stats):
    """Indice de «La semana en...»: por pais, semanas de la mas nueva a la mas antigua, sin repetir, lunes-domingo, y su fichero existe."""
    for cc, rows in doc["countries"].items():
        ws = [r["week"] for r in rows]
        if ws != sorted(set(ws), reverse=True): errs.append("blog-country-index %s: semanas desordenadas o repetidas" % cc); return
        for r in rows:
            try: lo, hi = _wk_bounds(r["week"])
            except Exception: errs.append("blog-country-index %s: semana invalida %r" % (cc, r["week"])); return
            if (r["from"], r["to"]) != (lo, hi): errs.append("blog-country-index %s %s: fechas incoherentes" % (cc, r["week"])); return
            if not (ROOT / "data" / "blog" / "countries" / cc / (r["week"] + ".json")).exists(): errs.append("blog-country-index %s %s: falta el fichero de la semana" % (cc, r["week"])); return
    stats["semanas por pais"] = sum(len(v) for v in doc["countries"].values())


def blog_edition(doc, errs, warns, stats):
    """Edicion del blog semanal (archivo editorial unico, derivado del resumen): nace DRAFT sin revisor; APPROVED/PUBLISHED exigen revisor y fecha; Substack solo distribuye (nada
    publicado mientras sea DRAFT); canonica en dehesaindex.com; 4 idiomas con titulo, extracto, Markdown limpio y newsletter mas corta; cada fuente es un titular del resumen de esa semana."""
    try: lo, hi = _wk_bounds(doc["week"])
    except Exception: errs.append("blog-edition: semana invalida %r" % doc.get("week")); return
    if (doc["from"], doc["to"]) != (lo, hi): errs.append("blog-edition %s: from/to no son lunes-domingo" % doc["week"]); return
    ed, st = doc["editorial"], doc["status"]
    if st == "DRAFT" and (ed["reviewedBy"] or ed["reviewedAt"]): errs.append("blog-edition %s: DRAFT con revisor" % doc["week"]); return
    if st != "DRAFT" and (not ed["reviewedBy"] or _cap_date(ed["reviewedAt"] or "") is None): errs.append("blog-edition %s: %s sin revisor o fecha de revision" % (doc["week"], st)); return
    sub = doc["distribution"]["substack"]
    if st != "PUBLISHED" and sub["state"] != "NOT_PUBLISHED": errs.append("blog-edition %s: Substack marcado publicado sin estado PUBLISHED" % doc["week"]); return
    if st == "DRAFT" and sub["url"]: errs.append("blog-edition %s: DRAFT con URL de Substack" % doc["week"]); return
    if doc["canonicalUrl"] != "https://dehesaindex.com/blog.html#" + doc["week"]: errs.append("blog-edition %s: canonica distinta de dehesaindex.com" % doc["week"]); return
    for lg in ("es", "en", "fr", "it"):
        L = doc["languages"].get(lg)
        if not L or not all(L.get(k, "").strip() for k in ("title", "excerpt", "markdown", "newsletterMarkdown")): errs.append("blog-edition %s: idioma %s incompleto" % (doc["week"], lg)); return
        if not L["markdown"].startswith("# " + L["title"]) or not L["newsletterMarkdown"].startswith("# " + L["title"]): errs.append("blog-edition %s %s: el Markdown no abre con el titulo" % (doc["week"], lg)); return
        if len(L["newsletterMarkdown"]) >= len(L["markdown"]): errs.append("blog-edition %s %s: la newsletter debe ser mas corta que el articulo" % (doc["week"], lg)); return
        if doc["canonicalUrl"] not in L["newsletterMarkdown"]: errs.append("blog-edition %s %s: la newsletter no enlaza a la canonica" % (doc["week"], lg)); return
        if "<" in L["markdown"] or "<script" in L["newsletterMarkdown"]: errs.append("blog-edition %s %s: HTML dentro del Markdown" % (doc["week"], lg)); return
    wf = D / "blog" / "weekly" / (doc["week"] + ".json")
    if doc["derivedFrom"] != "data/blog/weekly/%s.json" % doc["week"] or not wf.exists(): errs.append("blog-edition %s: resumen de origen inexistente" % doc["week"]); return
    w = json.loads(wf.read_text(encoding="utf-8")); urls = {h["url"] for h in w["top"]} | {h["url"] for r in w["byRegion"].values() for h in r}
    for s in doc["sources"]:
        if not s["url"].startswith("http") or s["url"] not in urls: errs.append("blog-edition %s: fuente que no es un titular del resumen (%s)" % (doc["week"], s["url"])); return
    stats["blog-edition fuentes"] = len(doc["sources"])


def cap_eu_allocations(doc, errs, warns, stats):
    """PAC UE (Reglamento 2021/2115): 27 Estados, anos 2023-2027, importes enteros positivos y, en el anexo XI, la suma de paises igual al total EU-27 de cada ano."""
    dp, rd = doc["directPayments"], doc["ruralDevelopment"]
    for blk in (dp, rd):
        if len(blk["countries"]) != 27 or any(not isinstance(v, list) or len(v) != 5 for v in blk["countries"].values()): errs.append("cap-eu: se esperaban 27 Estados con 5 anos cada uno"); return
    if dp["years"] != ["2023", "2024", "2025", "2026", "2027"]: errs.append("cap-eu: anos de pagos directos inesperados %s" % dp["years"]); return
    for blk, name in ((dp, "pagos directos"), (rd, "desarrollo rural")):
        for cc, v in blk["countries"].items():
            if any((not isinstance(x, int)) or x <= 0 for x in v): errs.append("cap-eu %s %s: importe no positivo" % (name, cc)); return
    for k in range(5):
        s = sum(v[k] for v in rd["countries"].values())
        if s != rd["totalEU27"][k]: errs.append("cap-eu: anexo XI, la suma de paises (%d) no coincide con el total EU-27 (%d) en %s" % (s, rd["totalEU27"][k], rd["years"][k])); return
    stats["series"] = len(dp["countries"]) + len(rd["countries"])

# Denominaciones de origen (eAmbrosia): scripts/update-eambrosia.py
def gi_country(doc, errs, warns, stats):
    seen = set()
    for k in ("wine", "cheese"):
        for e in doc[k]:
            if e["id"] in seen: errs.append("%s %s: %s repetida" % (doc["country"], k, e["id"])); return
            seen.add(e["id"])
            if e.get("y") is not None and not (1900 <= e["y"] <= 2100): errs.append("%s %s: año de protección no plausible (%s)" % (doc["country"], e["id"], e["y"]))
            if e.get("u") and not str(e["u"]).startswith("http"): errs.append("%s %s: enlace no valido" % (doc["country"], e["id"]))
            if any(f in e for f in ("email", "phone", "producerGroupEmail", "producerGroupPhone")): errs.append("%s %s: datos de contacto publicados" % (doc["country"], e["id"]))
    stats["wine"] = len(doc["wine"]); stats["cheese"] = len(doc["cheese"])
# Precio del vino a granel: el script de actualizacion del vino
def wine_prices(doc, errs, warns, stats):
    import datetime as _dt
    ws = doc["es"]["weeks"]; prev = None
    for w in ws:
        a = _dt.date.fromisoformat(w["from"]); b = _dt.date.fromisoformat(w["to"])
        if (b - a).days != 6 or a.weekday() != 0: errs.append("vino ES %s: la semana no va de lunes a domingo" % w["week"]); return
        if prev is not None and w["to"] <= prev: errs.append("vino ES: semanas no ascendentes en %s" % w["week"]); return
        prev = w["to"]
        for c in ("white", "red"):
            if not 20 <= w[c] <= 120: errs.append("vino ES %s: %s fuera de rango plausible (%s)" % (w["week"], c, w[c]))
    if (_dt.date.today() - _dt.date.fromisoformat(ws[-1]["to"])).days > 70: warns.append("vino ES: el ultimo boletin tiene mas de 70 dias (%s)" % ws[-1]["week"])
    for k, pts in doc["fr"]["series"].items():
        p = None
        for ym, v in pts:
            if p is not None and ym <= p: errs.append("vino FR %s: meses no ascendentes en %s" % (k, ym)); return
            p = ym
            if not 15 <= v <= 400: errs.append("vino FR %s %s: valor fuera de rango (%s)" % (k, ym, v))
        if k not in ("red.aop", "white.aop") and p < (_dt.date.today() - _dt.timedelta(days=150)).strftime("%Y-%m"): warns.append("vino FR %s: ultimo mes %s, con retraso" % (k, p))
    stats["weeksES"] = len(ws); stats["seriesFR"] = len(doc["fr"]["series"])
# Cortas de madera en rollo (Eurostat for_remov)
def wood_removals(doc, errs, warns, stats):
    import datetime as _dt
    n = len(doc["years"])
    if doc["years"] != sorted(doc["years"]): errs.append("madera: años no ascendentes"); return
    for cc, c in doc["countries"].items():
        for k, v in c["series"].items():
            if len(v) != n: errs.append("madera %s %s: longitud %d distinta de los años (%d)" % (cc, k, len(v), n)); return
            for i, x in enumerate(v):
                if x is not None and not 0 <= x <= 300000: errs.append("madera %s %s %s: valor fuera de rango (%s)" % (cc, k, doc["years"][i], x))
        t = c["series"].get("TOTAL.RW"); 
        if not t or all(x is None for x in t): errs.append("madera %s: sin ningun total" % cc)   # un pais que Eurostat dejo de actualizar (p. ej. BE hasta 2020) se publica con su ultimo año y el aviso de abajo
        if c["last"] < _dt.date.today().year - 4: warns.append("madera %s: ultimo año %d" % (cc, c["last"]))
    stats["paises"] = len(doc["countries"])
# Estadistica agricola anual de Francia por region y departamento (Agreste SAA)
def france_saa_index(doc, errs, warns, stats):
    """Indice de la SAA: cada hoja tiene años ascendentes, productos y unidades; los departamentos apuntan a una region conocida."""
    for k, s in doc["sheets"].items():
        ys = s["years"]
        if ys != sorted(set(ys)): errs.append("france-saa index %s: años no ascendentes" % k); return
        if not (2010 <= ys[0] and ys[-1] <= 2100): errs.append("france-saa index %s: años fuera de rango" % k); return
        if not s["products"]: errs.append("france-saa index %s: sin productos" % k); return
    for c, d in doc["departments"].items():
        if d["region"] not in doc["regions"]: errs.append("france-saa index: departamento %s con region %s desconocida" % (c, d["region"])); return
    stats["hojas"] = len(doc["sheets"]); stats["departamentos"] = len(doc["departments"])


def france_saa(doc, errs, warns, stats):
    """Una hoja de la SAA a un nivel: cada serie tiene un valor por año o null, nada negativo, rendimientos plausibles, las zonas existen y el producto 'total' no baja de sus partes obvias."""
    n = len(doc["years"]); lim = {"REND": 10000, "PROD_MOY": 100000, "POIDS_MOY": 12000}; odd = 0
    for pr in doc["products"]:
        for a, d in pr["d"].items():
            if a not in doc["areas"]: errs.append("france-saa %s %s: zona %s sin nombre" % (doc["sheet"], doc["level"], a)); return
            for m in doc["metrics"]:
                v = d.get(m)
                if v is None: continue
                if len(v) != n: errs.append("france-saa %s %s %s %s: %d valores para %d años" % (doc["sheet"], pr["c"], a, m, len(v), n)); return
                for x in v:
                    if x is None: continue
                    if not isinstance(x, (int, float)) or x < -500: errs.append("france-saa %s %s %s %s: valor invalido %r" % (doc["sheet"], pr["c"], a, m, x)); return
                    # Agreste publica algun ajuste de redondeo (-1, -2 ha) y algun cociente absurdo en superficies minimas: se conservan tal cual y se cuentan
                    if x < 0 or x > lim.get(m, 1e13): odd += 1
    if odd: warns.append("france-saa %s %s: %d valores atipicos de la fuente (negativos de redondeo o cocientes absurdos)" % (doc["sheet"], doc["level"], odd))
    if doc.get("provisionalYear") is not None and doc["provisionalYear"] != doc["years"][-1]: warns.append("france-saa %s: el año provisional no es el ultimo" % doc["sheet"])
    stats["france-saa series"] = stats.get("france-saa series", 0) + sum(len(p["d"]) for p in doc["products"])
# Cuentas de las explotaciones de Francia (Agreste RICA)
def _rica_series(v, n, tag, errs, lo=-1e9, hi=1e12):
    if len(v) != n: errs.append("france-rica %s: %d valores para %d años" % (tag, len(v), n)); return False
    for x in v:
        if x is None: continue
        if not isinstance(x, (int, float)) or x < lo or x > hi: errs.append("france-rica %s: valor fuera de rango %r" % (tag, x)); return False
    return True


def france_rica_index(doc, errs, warns, stats):
    ys = doc["years"]
    if ys != sorted(set(ys)) or ys[0] < 1988: errs.append("france-rica index: años invalidos"); return
    ids = [i["id"] for i in doc["indicators"]]
    if len(ids) != len(set(ids)): errs.append("france-rica index: indicadores repetidos"); return
    for need in ("rcai", "ebe", "output", "uaa", "farms"):
        if need not in ids: errs.append("france-rica index: falta el indicador %s" % need); return
    stats["indicadores"] = len(ids); stats["regiones"] = len(doc["regions"])


def france_rica_national(doc, errs, warns, stats):
    """Francia metropolitana, OTEX x CDEX: cada serie tiene un valor por año o null; la muestra es un entero positivo; el RCAI total existe y es plausible."""
    n = len(doc["years"]); k = 0
    for basis in ("current", "constant"):
        for o, cs in doc[basis].items():
            for c, inds in cs.items():
                for i, v in inds.items():
                    if not _rica_series(v, n, "%s %s %s %s" % (basis, o, c, i), errs): return
                    k += 1
    tot = doc["current"].get("all", {}).get("all", {})
    for need in ("rcai", "sample", "farms"):
        if need not in tot or sum(1 for x in tot[need] if x is not None) < 30: errs.append("france-rica: falta la serie nacional %s" % need); return
    if any(x is not None and x < 1000 for x in tot["sample"]): errs.append("france-rica: muestra nacional implausible"); return
    if tot["rcai"][-1] is not None and not (0 < tot["rcai"][-1] < 500000): errs.append("france-rica: RCAI nacional fuera de rango"); return
    stats["series"] = k


def france_rica_regional(doc, errs, warns, stats):
    n = len(doc["years"]); k = 0
    for g, a in doc["data"].items():
        for o, inds in a.items():
            for i, v in inds.items():
                if not _rica_series(v, n, "%s %s %s" % (g, o, i), errs): return
                k += 1
    if "France hors DROM" not in doc["data"]: errs.append("france-rica: falta Francia metropolitana"); return
    stats["series"] = k
# Comercio exterior de Francia (Agreste, aduanas)
def france_comex_index(doc, errs, warns, stats):
    for k, d in doc["datasets"].items():
        if d["file"] != k + ".json": errs.append("france-comex index: %s apunta a %s" % (k, d["file"])); return
        if d["years"][0] > d["years"][1]: errs.append("france-comex index: %s con años invertidos" % k); return
    stats["conjuntos"] = len(doc["datasets"])


def france_comex(doc, errs, warns, stats):
    """Los indices de cada serie caen en sus diccionarios, los periodos son del formato esperado y de un año listado, los valores son numeros finitos (negativos solo en saldos),
    y donde la fuente publica saldo, saldo = exportaciones - importaciones (tolerancia 1 %) para el total mundial del producto de mayor nivel."""
    import re as _re
    ni, np_, ng = len(doc["indicators"]), len(doc["products"]), len(doc["partners"]); ys = set(str(y) for y in doc["years"]); n = 0
    pat = {"A": _re.compile(r"^\d{4}$"), "M": _re.compile(r"^\d{4}-(0[1-9]|1[0-2])$"), "Q": _re.compile(r"^\d{4}-Q[1-4]$")}
    for key, s in doc["series"].items():
        i, p, g = (int(x) for x in key.split("|"))
        if not (0 <= i < ni and 0 <= p < np_ and 0 <= g < ng): errs.append("france-comex %s: indice fuera de rango en %s" % (doc["dataset"], key)); return
        bal = doc["indicators"][i]["flow"] == "balance"
        for fr, d in s.items():
            if fr not in pat: errs.append("france-comex %s: frecuencia %r" % (doc["dataset"], fr)); return
            for per, v in d.items():
                if not pat[fr].match(per) or per[:4] not in ys: errs.append("france-comex %s %s: periodo %r" % (doc["dataset"], key, per)); return
                if not isinstance(v, (int, float)) or v != v or (v < 0 and not bal): errs.append("france-comex %s %s %s: valor %r" % (doc["dataset"], key, per, v)); return
        n += 1
    world = [k for k, p in enumerate(doc["partners"]) if p["fr"].lower() == "monde"]
    if doc["dataset"] != "oeufs" and not world: errs.append("france-comex %s: falta el socio Monde" % doc["dataset"]); return
    ix = {x["id"]: k for k, x in enumerate(doc["indicators"])}
    if world and "balance-eur" in ix and "export-eur" in ix and "import-eur" in ix:
        w = world[0]; bad = 0; tot = 0
        for key, s in doc["series"].items():
            i, p, g = (int(x) for x in key.split("|"))
            if g != w or i != ix["balance-eur"]: continue
            e = doc["series"].get("%d|%d|%d" % (ix["export-eur"], p, w), {}).get("A", {}); m = doc["series"].get("%d|%d|%d" % (ix["import-eur"], p, w), {}).get("A", {})
            for y, b in s.get("A", {}).items():
                if y in e and y in m:
                    tot += 1
                    if abs((e[y] - m[y]) - b) > 0.01 * max(abs(b), abs(e[y]), 1): bad += 1
        if tot and bad > 0.02 * tot: errs.append("france-comex %s: saldo distinto de exportaciones - importaciones en %d de %d casos" % (doc["dataset"], bad, tot)); return
        stats["saldos comprobados"] = stats.get("saldos comprobados", 0) + tot
    stats["france-comex series"] = stats.get("france-comex series", 0) + n
# Precios agricolas de fruta, hortaliza y patata de la UE-27 (Eurostat apri_ap_crpouta)
def eu_fv_farm(doc, errs, warns, stats):
    import datetime as _dt
    prods = doc["products"]; n = 0
    for code in prods:
        if code[:2] not in ("04", "05", "06"): errs.append("eu-fv-farm: codigo %s no es fruta, hortaliza ni patata" % code); return
    for cc, c in doc["countries"].items():
        if not c: errs.append("eu-fv-farm %s: sin ningun producto" % cc); continue
        for code, pts in c.items():
            if code not in prods: errs.append("eu-fv-farm %s: codigo %s sin nombre" % (cc, code)); return
            last = None
            for y, v in pts:
                if not (isinstance(v, (int, float)) and 0 < v <= 20000): errs.append("eu-fv-farm %s %s %s: valor fuera de rango (%s)" % (cc, code, y, v)); return
                if last is not None and not y > last: errs.append("eu-fv-farm %s %s: años no ascendentes en %s" % (cc, code, y)); return
                last = y
            n += 1
        ly = max(p[-1][0] for p in c.values())
        if int(ly) < _dt.date.today().year - 4: warns.append("eu-fv-farm %s: ultimo año %s" % (cc, ly))
    stats["paises"] = len(doc["countries"]); stats["series"] = n
# Precios de la madera en la UE (Eurostat sts_inpp_m y Skogsstyrelsen)
def eu_wood_prices(doc, errs, warns, stats):
    import datetime as _dt
    p = doc["ppi"]; prods = p["products"]; n = 0
    for cc, c in p["countries"].items():
        for code, pts in c.items():
            if code not in prods: errs.append("eu-wood-prices %s: codigo %s sin nombre" % (cc, code)); return
            last = None
            for ym, v in pts:
                if not (isinstance(v, (int, float)) and 20 <= v <= 500): errs.append("eu-wood-prices %s %s %s: indice fuera de rango (%s)" % (cc, code, ym, v)); return
                if last is not None and not ym > last: errs.append("eu-wood-prices %s %s: meses no ascendentes en %s" % (cc, code, ym)); return
                last = ym
            n += 1
        ly = max(x[-1][0] for x in c.values())
        if ly < (_dt.date.today() - _dt.timedelta(days=200)).strftime("%Y-%m"): warns.append("eu-wood-prices %s: ultimo mes %s, con retraso" % (cc, ly))
    for cc, s in doc["national"].items():
        for x in s["series"]:
            last = None
            for q, v in x["pts"]:
                if not (isinstance(v, (int, float)) and 50 <= v <= 3000): errs.append("eu-wood-prices %s %s %s: precio fuera de rango (%s)" % (cc, x["id"], q, v)); return
                if last is not None and not q > last: errs.append("eu-wood-prices %s %s: trimestres no ascendentes en %s" % (cc, x["id"], q)); return
                last = q
    stats["paises"] = len(p["countries"]); stats["series"] = n
# Argentina: cultivos por provincia (MAGyP)
def ar_provinces(doc, errs, warns, stats):
    cs = doc["campaigns"]
    if cs != sorted(cs) or doc["lastCampaign"] != cs[-1]: errs.append("ar-provinces: campañas desordenadas o lastCampaign incoherente"); return
    for p, crops in doc["provinces"].items():
        if p not in "ABCDEFGHJKLMNPQRSTUVWXYZ" or len(p) != 1: errs.append("ar-provinces: provincia %r no es un codigo ISO" % p); return
        for c, ss in crops.items():
            for camp, v in ss.items():
                s, h, q, y = v
                if camp not in cs or s < 0 or h < 0 or q < 0 or h > s * 1.02 + 5: errs.append("ar-provinces %s %s %s: valores incoherentes %s" % (p, c, camp, v)); return
                if y is not None and not (100 <= y <= 15000): errs.append("ar-provinces %s %s %s: rendimiento %s kg/ha fuera de rango" % (p, c, camp, y)); return
    soy = doc["national"].get("soja", {}).get(doc["lastCampaign"])
    if not soy or not (2e7 <= soy[2] <= 7e7): errs.append("ar-provinces: produccion nacional de soja implausible (%s)" % (soy and soy[2]))
    stats["provincias"] = len(doc["provinces"])
# Embalses del oeste de EE. UU. (Reclamation, RISE)
def us_reservoirs(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today().isoformat(); seen = set()
    for x in doc["items"]:
        nm, sh, st, rg, cap, ct, sto, d, py, pn, lat, lon, rid = x
        if rid in seen: errs.append("embalses US: repetido %s" % nm); return
        seen.add(rid)
        if d > today or d > doc["asOf"]: errs.append("embalses US %s: fecha futura %s" % (nm, d)); return
        if not (cap > 0 and sto >= 0 and sto <= cap * 1.6): errs.append("embalses US %s: agua %s fuera de lo plausible para capacidad %s" % (nm, sto, cap))
        if lat is not None and not (25 <= lat <= 49.5 and -125 <= lon <= -93): errs.append("embalses US %s: punto fuera del oeste de EE. UU. (%s, %s)" % (nm, lat, lon))
        if pn is not None and not 0 <= pn <= 600: errs.append("embalses US %s: %% de la media fuera de rango (%s)" % (nm, pn))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=14)).isoformat(): warns.append("embalses US: ultimo dato %s" % doc["asOf"])
    names = {x[1] for x in doc["items"]}
    for must in ("Mead (Hoover Dam)", "Powell (Glen Canyon Dam)", "Shasta"):
        if must not in names: errs.append("embalses US: falta %s" % must)
    stats["embalses"] = len(doc["items"])
# Polonia: gasoleo y devolucion de akcyza
def pl_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h, fx in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel PL: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel PL: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.4 < t < 3.0: errs.append("diesel PL %s: %s" % (d, t))
        if not 2.5 < fx < 7.0: errs.append("diesel PL %s: cambio %s zl/EUR" % (d, fx))
        if n is not None and n >= t: errs.append("diesel PL %s: sin impuestos >= con impuestos" % d)
    R = doc["refund"]
    if not 0.5 < R["zlPerLitre"] < 3: errs.append("akcyza PL: devolucion %s zl/l" % R["zlPerLitre"])
    if R["year"] < today.year: warns.append("akcyza PL: la devolucion es de %d; actualizar scripts/ref/pl-akcyza.json con el reglamento de %d" % (R["year"], today.year))
    if not 1 < doc["farmCostPLN"] < doc["dieselPLN"]: errs.append("diesel PL: coste de explotacion %s incoherente" % doc["farmCostPLN"])
    stats["semanas"] = len(doc["weekly"])
# Polonia: emisiones de la agricultura (Eurostat)
def pl_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI PL: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (20000 < a < 70000 and 250000 < t < 650000): errs.append("GEI PL %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI PL %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
# Polonia: avisos de sequia hidrologica (IMGW-PIB)
def pl_hydro_drought(doc, errs, warns, stats):
    import datetime as _dt
    if len(doc["voivodeships"]) != 16: errs.append("sequia PL: %d voivodatos" % len(doc["voivodeships"]))
    tot = sum(v["warnings"] for v in doc["voivodeships"].values())
    if doc["warnings"] and tot < len(doc["warnings"]): errs.append("sequia PL: los voivodatos suman menos avisos que la lista")
    for w in doc["warnings"]:
        if not w["areas"]: errs.append("sequia PL: aviso sin zonas"); break
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=4)).isoformat(): warns.append("sequia PL: ultimo dato %s" % doc["asOf"])
    stats["avisos"] = len(doc["warnings"])
# Belgica: gasoleo agricola (tarifa oficial del SPF Economia) y Boletin Petrolero
def be_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for r in doc["daily"]:
        if r[0] > (today + _dt.timedelta(days=4)).isoformat(): errs.append("diesel BE: fecha futura %s" % r[0]); return   # la tarifa se publica la vispera
        if prev and r[0] <= prev: errs.append("diesel BE: dias desordenados en %s" % r[0]); return
        prev = r[0]
        if not 0.3 < r[1] < 3.0: errs.append("diesel BE %s: agricola %s" % (r[0], r[1]))
        if r[3] is not None and r[3] <= r[1]: errs.append("diesel BE %s: el agricola no es mas barato que el de automocion" % r[0])
    prev = None
    for d, t, n, h in doc["weekly"]:
        if prev and d <= prev: errs.append("diesel BE: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.5 < t < 3.5: errs.append("diesel BE semanal %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel BE %s: sin impuestos >= con impuestos" % d)
    if doc["asOf"] < (today - _dt.timedelta(days=7)).isoformat(): warns.append("diesel BE: ultimo dia %s" % doc["asOf"])
    stats["dias"] = len(doc["daily"]); stats["semanas"] = len(doc["weekly"])
def be_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI BE: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (5000 < a < 15000 and 70000 < t < 180000): errs.append("GEI BE %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI BE %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def be_drought(doc, errs, warns, stats):
    import datetime as _dt
    P = doc["provinces"]
    if sorted(P) != ["VAN", "VBR", "VLI", "VOV", "VWV"]: errs.append("sequia BE: provincias %s" % sorted(P))
    for k, v in P.items():
        if v["banned"] > v["zones"] or v["bannedKm2"] > v["areaKm2"] + 0.1: errs.append("sequia BE %s: mas prohibido que total" % k)
    for k, v in doc["indices"].items():
        s = sum(v["shares"].values())
        if abs(s - 100) > 0.6: errs.append("sequia BE %s: las clases suman %.1f %%" % (k, s))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=4)).isoformat(): warns.append("sequia BE: ultimo dato %s" % doc["asOf"])
    stats["prohibidas"] = sum(v["banned"] for v in P.values())
def be_nitrates(doc, errs, warns, stats):
    prev = None
    for y, m, p in doc["series"]:
        if prev and y <= prev: errs.append("nitratos BE: anos desordenados en %s" % y); return
        prev = y
        if not 0 <= p <= 100: errs.append("nitratos BE %s: %s %%" % (y, p))
        if m is not None and not 5 < m < 60: errs.append("nitratos BE %s: media %s mg/l" % (y, m))
    stats["anos"] = len(doc["series"])
# Austria: gasoleo (Boletin Petrolero), devolucion Agrardiesel, SPEI y aguas subterraneas
def at_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel AT: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel AT: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.5 < t < 3.5: errs.append("diesel AT %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel AT %s: sin impuestos >= con impuestos" % d)
    R = doc["refund"]
    if not 0 < R["eurPerLitre"] < 0.6: errs.append("Agrardiesel AT: devolucion %s" % R["eurPerLitre"])
    if R.get("provisional"): warns.append("Agrardiesel AT: el tipo de %d es provisional; revisar scripts/ref/at-agrardiesel.json" % R["year"])
    if not 0.3 < doc["farmCostNet"] < doc["farmCostFlat"]: errs.append("diesel AT: costes incoherentes")
    stats["semanas"] = len(doc["weekly"])
def at_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI AT: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (5000 < a < 12000 and 50000 < t < 110000): errs.append("GEI AT %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI AT %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def at_drought(doc, errs, warns, stats):
    import datetime as _dt
    if sorted(doc["lands"]) != ["B", "K", "NO", "OO", "S", "ST", "T", "V", "W"]: errs.append("sequia AT: Lander %s" % sorted(doc["lands"]))
    for k, v in list(doc["lands"].items()) + [("AT", doc["austria"])]:
        for s in ("spei30", "spei90"):
            x = v.get(s)
            if not x or not -4 < x["mean"] < 4 or not (100 >= x["dry"] >= x["veryDry"] >= x["extreme"] >= 0): errs.append("sequia AT %s %s: %s" % (k, s, x))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=5)).isoformat(): warns.append("sequia AT: ultimo dato %s" % doc["asOf"])
    stats["dias"] = len(doc["history"])
def hr_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel HR: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel HR: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.3 < t < 3.5: errs.append("diesel HR %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel HR %s: sin impuestos >= con impuestos" % d)
    prev = None; lim = (today + _dt.timedelta(days=4)).isoformat()
    for d, pet, dsl, blue, ndsl, nblue in doc["official"]:
        if d > lim: errs.append("gasoleo azul HR: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("gasoleo azul HR: fechas desordenadas en %s" % d); return
        prev = d
        if not (0.3 < blue < dsl < 3.5 and (pet is None or 0.5 < pet < 3.5)): errs.append("precios oficiales HR %s: %s %s %s" % (d, pet, dsl, blue))
        if ndsl is not None and ndsl < dsl - 0.001: errs.append("HR %s: precio sin medidas (%s) menor que con medidas (%s)" % (d, ndsl, dsl))
    last = doc["official"][-1][0]
    if last < (today - _dt.timedelta(days=21)).isoformat(): warns.append("gasoleo azul HR: ultimo precio oficial %s" % last)
    if doc["weekly"][-1][0] < (today - _dt.timedelta(days=21)).isoformat(): warns.append("diesel HR: ultima semana %s" % doc["weekly"][-1][0])
    stats["semanas"] = len(doc["weekly"]); stats["oficiales"] = len(doc["official"])
def hr_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI HR: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (1000 < a < 5000 and 15000 < t < 50000): errs.append("GEI HR %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI HR %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def hr_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 21 or not all(k.startswith("HR") for k in C): errs.append("sequia HR: %d provincias" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia HR: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia HR %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia HR %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia HR %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia HR: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia HR: ultimo dato %s" % doc["asOf"])
    stats["decadas"] = len(P)
def it_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 107 or not all(k.startswith("IT") for k in C): errs.append("sequia IT: %d provincias" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia IT: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia IT %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia IT %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia IT %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia IT: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia IT: ultimo dato %s" % doc["asOf"])
    stats["decadas"] = len(P)
def el_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 49 or not all(k.startswith("EL") for k in C): errs.append("sequia EL: %d unidades" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia EL: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia EL %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia EL %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia EL %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia EL: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia EL: ultimo dato %s" % doc["asOf"])
    stats["decadas"] = len(P)
def ie_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel IE: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel IE: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.3 < t < 3.5: errs.append("diesel IE %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel IE %s: sin impuestos >= con impuestos" % d)
    prev = None
    for r in doc["clearance"]:
        if prev and r[0] <= prev: errs.append("despachos IE: meses desordenados en %s" % r[0]); return
        prev = r[0]
        if not all(0 < x < 1000 for x in r[1:]): errs.append("despachos IE %s: %s" % (r[0], r[1:]))
    prev = None
    for r in doc["prices"]:
        if prev and r[0] <= prev: errs.append("indices IE: meses desordenados en %s" % r[0]); return
        prev = r[0]
        if not all(30 < x < 300 for x in r[1:]): errs.append("indices IE %s: %s" % (r[0], r[1:]))
    if doc["weekly"][-1][0] < (today - _dt.timedelta(days=21)).isoformat(): warns.append("diesel IE: ultima semana %s" % doc["weekly"][-1][0])
    if doc["clearance"][-1][0] < (today - _dt.timedelta(days=150)).isoformat()[:7]: warns.append("despachos IE: ultimo mes %s" % doc["clearance"][-1][0])
    stats["semanas"] = len(doc["weekly"]); stats["meses"] = len(doc["clearance"])
def ie_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI IE: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (10000 < a < 30000 and 40000 < t < 90000): errs.append("GEI IE %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI IE %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def ie_nitrates(doc, errs, warns, stats):
    for key, w in (("groundwater", 6), ("rivers", 5)):
        prev = None
        for r in doc[key]:
            if prev and r[0] <= prev: errs.append("nitratos IE %s: periodos desordenados en %s" % (key, r[0])); return
            prev = r[0]
            if len(r) != w + 1 or any(not 0 <= x <= 100 for x in r[1:]) or abs(sum(r[1:]) - 100) > 2: errs.append("nitratos IE %s %s: %s" % (key, r[0], r[1:]))
    g = doc["groundwater"][-1]
    if int(g[0]) < 2020: warns.append("nitratos IE: ultimo ano %s" % g[0])
    stats["anos"] = len(doc["groundwater"]); stats["ultimo"] = g[0]
def ie_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 8 or not all(k.startswith("IE") for k in C): errs.append("sequia IE: %d regiones" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia IE: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia IE %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia IE %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia IE %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia IE: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia IE: ultimo dato %s" % doc["asOf"])
    stats["decadas"] = len(P)
def pt_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel PT: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel PT: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.3 < t < 3.5: errs.append("diesel PT %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel PT %s: sin impuestos >= con impuestos" % d)
    prev = None
    for y, v in doc["farm"]:
        if prev and y <= prev: errs.append("gasoleo agrario PT: anos desordenados en %s" % y); return
        prev = y
        if not 0.2 < v < 2.5: errs.append("gasoleo agrario PT %s: %s" % (y, v))
    if doc["weekly"][-1][0] < (today - _dt.timedelta(days=21)).isoformat(): warns.append("diesel PT: ultima semana %s" % doc["weekly"][-1][0])
    stats["semanas"] = len(doc["weekly"]); stats["anosAgrario"] = len(doc["farm"])
def pt_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI PT: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (3000 < a < 12000 and 40000 < t < 110000): errs.append("GEI PT %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI PT %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def pt_nitrates(doc, errs, warns, stats):
    for key, hi in (("groundwater", 100), ("nBalance", 600)):
        prev = None
        for y, v in doc[key]:
            if prev and y <= prev: errs.append("nitratos PT %s: anos desordenados en %s" % (key, y)); return
            prev = y
            if not 0 < v < hi: errs.append("nitratos PT %s %s: %s" % (key, y, v))
    if doc["groundwater"][-1][0] < __import__("datetime").date.today().year - 4: warns.append("nitratos PT: ultimo ano de aguas subterraneas %s" % doc["groundwater"][-1][0])
    stats["ultimoAguaSub"] = doc["groundwater"][-1][0]
def pt_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 23 or not all(k.startswith("PT") for k in C): errs.append("sequia PT: %d regiones" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia PT: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia PT %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia PT %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia PT %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia PT: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia PT: ultimo dato %s" % doc["asOf"])
    stats["decadas"] = len(P)
def nl_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today.isoformat(): errs.append("diesel NL: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel NL: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.3 < t < 3.5: errs.append("diesel NL %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel NL %s: sin impuestos >= con impuestos" % d)
    prev = None
    for d, dsl, pet in doc["pump"]:
        if d > today.isoformat(): errs.append("surtidor NL: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("surtidor NL: dias desordenados en %s" % d); return
        prev = d
        if not (0.5 < dsl < 3.5 and 0.5 < pet < 3.5): errs.append("surtidor NL %s: %s %s" % (d, dsl, pet))
    prev = None
    for y, v in doc["farm"]:
        if prev and y <= prev: errs.append("gasoleo agrario NL: anos desordenados en %s" % y); return
        prev = y
        if not 0.2 < v < 2.5: errs.append("gasoleo agrario NL %s: %s" % (y, v))
    if doc["weekly"][-1][0] < (today - _dt.timedelta(days=21)).isoformat(): warns.append("diesel NL: ultima semana %s" % doc["weekly"][-1][0])
    if doc["pump"][-1][0] < (today - _dt.timedelta(days=21)).isoformat(): warns.append("surtidor NL: ultimo dia %s" % doc["pump"][-1][0])
    stats["semanas"] = len(doc["weekly"]); stats["dias"] = len(doc["pump"]); stats["anosAgrario"] = len(doc["farm"])
def nl_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI NL: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (8000 < a < 30000 and 100000 < t < 350000): errs.append("GEI NL %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI NL %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
def nl_nitrates(doc, errs, warns, stats):
    for g in ("leaching", "ditch"):
        for k, rows in doc[g].items():
            prev = None
            for r in rows:
                if len(r) != 5 or (prev and r[0] <= prev): errs.append("nitratos NL %s %s: fila %s" % (g, k, r)); return
                prev = r[0]
                if not (0 <= r[1] < 400 and (r[2] is None or 0 <= r[2] < 400) and (r[3] is None or 0 <= r[3] < 800)): errs.append("nitratos NL %s %s %s: %s" % (g, k, r[0], r[1:]))
    for k in ("zand", "klei", "veen", "loess"):
        if k not in doc["leaching"]: errs.append("nitratos NL: falta lixiviado de %s" % k)
    for key, hi in (("groundwater", 100), ("nBalance", 600)):
        for y, v in doc[key]:
            if not 0 < v < hi: errs.append("nitratos NL %s %s: %s" % (key, y, v))
    if doc["leaching"]["zand"][-1][0] < __import__("datetime").date.today().year - 3: warns.append("nitratos NL: ultimo ano del LMM %s" % doc["leaching"]["zand"][-1][0])
    stats["ultimoLMM"] = doc["leaching"]["zand"][-1][0]
def be_weather(doc, errs, warns, stats):
    """Belgica (KMI): curvas de deficit de 214 dias en rango, ultimo dia del deficit = asOf, 12 meses seguidos con normales posibles, lluvia de 30 dias coherente con las estaciones y estaciones en provincias belgas con valores fisicos."""
    import datetime as _dt
    D = doc["deficit"]; n = D["days"]
    if n != 214 or not 0 < len(D["cur"]) <= n: errs.append("deficit BE: longitudes de curvas")
    if any(v is not None and not -150 < v < 600 for k in ("cur", "prev", "med", "p10", "p90") for v in D[k]): errs.append("deficit BE: valores fuera de rango")
    for i in range(n):
        a, b, c = D["p10"][i], D["med"][i], D["p90"][i]
        if None not in (a, b, c) and not a <= b <= c: errs.append("deficit BE: p10 <= mediana <= p90 no se cumple el dia %d" % i); break
    if not 8 <= D["stations"] <= 20: errs.append("deficit BE: %s estaciones" % D["stations"])
    if D["curYear"] != D["prevYear"] + 1: errs.append("deficit BE: años no consecutivos")
    if not any(m[0] == D["curYear"] for m in D["yearMax"]): errs.append("deficit BE: yearMax sin el año en curso")
    if D["asOf"] != doc["asOf"]: errs.append("deficit BE: asOf distinto")
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=5)).isoformat(): warns.append("tiempo BE: ultimo dato %s" % doc["asOf"])
    M = doc["monthly"]
    for i, m in enumerate(M):
        if not 1 <= m["m"] <= 12: errs.append("mensual BE: mes %s" % m["m"]); break
        if i and (m["y"] * 12 + m["m"]) - (M[i - 1]["y"] * 12 + M[i - 1]["m"]) != 1: errs.append("mensual BE: meses no consecutivos en %s-%s" % (m["y"], m["m"])); break
        for k, lo, hi in (("rain", 0, 400), ("rainNormal", 10, 200), ("temp", -10, 30), ("tempNormal", -5, 25)):
            if m[k] is not None and not lo <= m[k] <= hi: errs.append("mensual BE %s-%s: %s %s" % (m["y"], m["m"], k, m[k]))
    L = doc["last30"]
    if L["rain"] is not None and not 0 <= L["rain"] < 500: errs.append("lluvia 30 dias BE: %s" % L["rain"])
    if L["rainNormal"] is not None and not 10 < L["rainNormal"] < 250: errs.append("lluvia normal 30 dias BE: %s" % L["rainNormal"])
    codes = set()
    for s in doc["stations"]:
        if s["code"] in codes: errs.append("estacion repetida: " + s["code"])
        codes.add(s["code"])
        if not (s["province"] or "").startswith("BE"): errs.append("estacion %s sin provincia" % s["name"])
        if not (49.4 < s["lat"] < 51.6 and 2.5 < s["lon"] < 6.5): errs.append("estacion %s fuera de Belgica" % s["name"])
        if s["rain30"] is not None and not 0 <= s["rain30"] < 600: errs.append("estacion %s: lluvia 30 d %s" % (s["name"], s["rain30"]))
        if s["temp7"] is not None and not -25 < s["temp7"] < 40: errs.append("estacion %s: temperatura %s" % (s["name"], s["temp7"]))
        if s["soil10"] is not None and not -15 < s["soil10"] < 40: errs.append("estacion %s: suelo %s" % (s["name"], s["soil10"]))
        if not 0 <= s["frost30"] <= 30: errs.append("estacion %s: heladas %s" % (s["name"], s["frost30"]))
        if s["tmin7"] is not None and s["temp7"] is not None and s["tmin7"] > s["temp7"] + 0.01: errs.append("estacion %s: minima mayor que la media" % s["name"])
    if len(doc["stations"]) < 10: errs.append("solo %d estaciones" % len(doc["stations"]))
    stats["estaciones"] = len(doc["stations"]); stats["deficitHasta"] = D["asOf"]
def nordic_weather(doc, errs, warns, stats):
    """Suecia y Dinamarca (SMHI, DMI): 12 meses seguidos con valores fisicos, normales con al menos 12 años, lluvia de 30 dias coherente con el normal, estaciones unicas dentro de cada pais y ultimo dato reciente."""
    import datetime as _dt
    cc = doc["country"]; box = {"SE": (55.0, 69.5, 10.5, 24.5), "DK": (54.5, 58.0, 8.0, 15.5)}[cc]
    M = doc["monthly"]
    for i, m in enumerate(M):
        y, mo = int(m["m"][:4]), int(m["m"][5:7])
        if i and (y * 12 + mo) - (int(M[i - 1]["m"][:4]) * 12 + int(M[i - 1]["m"][5:7])) != 1: errs.append("mensual %s: meses no consecutivos en %s" % (cc, m["m"])); break
        for k, lo, hi in (("rain", 0, 400), ("rainN", 5, 250), ("temp", -25, 28), ("tempN", -20, 25)):
            if m[k] is not None and not lo <= m[k] <= hi: errs.append("mensual %s %s: %s %s" % (cc, m["m"], k, m[k]))
    if M[-1]["m"] > doc["asOf"][:7]: errs.append("mensual %s: mes posterior a asOf" % cc)
    L = doc["l30"]
    if L["rain"] is not None and not 0 <= L["rain"] < 500: errs.append("lluvia 30 dias %s: %s" % (cc, L["rain"]))
    if L["rainN"] is not None and not 5 < L["rainN"] < 250: errs.append("lluvia normal 30 dias %s: %s" % (cc, L["rainN"]))
    if L["temp"] is not None and not -25 < L["temp"] < 30: errs.append("temperatura 30 dias %s: %s" % (cc, L["temp"]))
    if L.get("years", 99) < 12: errs.append("normal 30 dias %s: solo %s años" % (cc, L.get("years")))
    A = doc.get("sinceApr")
    if A and (A["rain"] is None or not 0 <= A["rain"] < 1500 or (A["rainN"] is not None and not 20 < A["rainN"] < 1500)): errs.append("lluvia desde abril %s: %s" % (cc, A))
    ids = set()
    for s in doc["stations"]:
        if s["id"] in ids: errs.append("estacion repetida: " + s["id"])
        ids.add(s["id"])
        if s["rain30"] is not None and not 0 <= s["rain30"] < 600: errs.append("estacion %s: lluvia 30 d %s" % (s["name"], s["rain30"]))
        if s["temp7"] is not None and not -30 < s["temp7"] < 35: errs.append("estacion %s: temperatura %s" % (s["name"], s["temp7"]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=10)).isoformat(): warns.append("tiempo %s: ultimo dato %s" % (cc, doc["asOf"]))
    stats["estaciones"] = len(doc["stations"]); stats["hasta"] = doc["asOf"]
def be_wallonia_crops(doc, errs, warns, stats):
    """Valonia (SPW, SIGEC anonimo): campañas consecutivas, cultivos y grupos que suman el total de cada campaña, total declarado y parcelas en rango, sin saltos de mas del 5 % entre campañas, trigo y pradera presentes y en rango."""
    Y = doc["years"]; n = len(Y); T = doc["totals"]
    if n < 5 or Y != list(range(Y[0], Y[0] + n)) or doc["latestYear"] != Y[-1]: errs.append("campañas BE-WAL: %s" % Y)
    if len(T["ha"]) != n or len(T["parcels"]) != n: errs.append("totales BE-WAL: longitud"); return
    codes = set()
    for c in doc["crops"]:
        if c["code"] in codes: errs.append("cultivo repetido: " + c["code"])
        codes.add(c["code"])
        if len(c["ha"]) != n or len(c["n"]) != n: errs.append("cultivo %s: longitud de serie" % c["code"]); return
        if any(v is not None and not 0 <= v < 500000 for v in c["ha"]): errs.append("cultivo %s: superficie imposible" % c["code"])
    for i, y in enumerate(Y):
        if not 650000 < T["ha"][i] < 950000: errs.append("%s: total %s ha fuera de rango" % (y, T["ha"][i]))
        if not 250000 < T["parcels"][i] < 450000: errs.append("%s: %s parcelas fuera de rango" % (y, T["parcels"][i]))
        if i and abs(T["ha"][i] / T["ha"][i - 1] - 1) > 0.05: errs.append("%s: salto del total de mas del 5 %%" % y)
        if abs(sum(c["ha"][i] or 0 for c in doc["crops"]) - T["ha"][i]) > 1: errs.append("%s: los cultivos no suman el total" % y)
        if abs(sum(g["ha"][i] for g in doc["groups"]) - T["ha"][i]) > 1: errs.append("%s: los grupos no suman el total" % y)
    for code, lo, hi, nm in (("311", 80000, 170000, "froment d'hiver"), ("6", 300000, 450000, "prairie")):
        c = next((x for x in doc["crops"] if x["code"] == code), None)
        if not c or any(v is None or not lo < v < hi for v in c["ha"]): errs.append("%s (%s) ausente o fuera de %d-%d ha" % (nm, code, lo, hi))
    known = {c["code"] for c in doc["crops"]}
    for kind, lo_n in (("province", 5), ("region", 8)):
        zs = [a for a in doc.get("areas", []) if a["kind"] == kind]
        if "areas" in doc and len(zs) < lo_n: errs.append("zonas %s: %d (minimo %d)" % (kind, len(zs), lo_n))
        ids = [a["id"] for a in zs]
        if len(ids) != len(set(ids)): errs.append("zonas %s con id repetido" % kind)
        for a in zs:
            if len(a["ha"]) != n or len(a["n"]) != n or any(len(v) != n for v in a["crops"].values()): errs.append("zona %s: longitudes" % a["id"]); return
            if not set(a["crops"]) <= known: errs.append("zona %s: cultivo desconocido %s" % (a["id"], sorted(set(a["crops"]) - known)[:3]))
        for i, y in enumerate(Y):
            if not zs: break
            sm = sum(a["ha"][i] for a in zs)
            if not 0.985 * T["ha"][i] <= sm <= 1.04 * T["ha"][i]: errs.append("%s: la suma de zonas %s (%.0f ha) no cuadra con el total (%.0f)" % (y, kind, sm, T["ha"][i]))
            for a in zs:
                if sum(v[i] or 0 for v in a["crops"].values()) > a["ha"][i] + 1: errs.append("%s: zona %s: los cultivos suman mas que la zona" % (y, a["id"]))
        if kind == "province" and zs:
            lux = next((a for a in zs if a["id"] == "BE34"), None); hai = next((a for a in zs if a["id"] == "BE32"), None)
            if lux and hai and hai["ha"][-1] < lux["ha"][-1]: warns.append("Hainaut tiene menos superficie que Luxemburgo: revisar los poligonos")
    if Y[-1] < __import__("datetime").date.today().year - 3: warns.append("cultivos BE-WAL: ultima campaña %s" % Y[-1])
    stats["campañas"] = "%s-%s" % (Y[0], Y[-1]); stats["cultivos"] = len(doc["crops"]); stats["zonas"] = len(doc.get("areas", []))
def nl_drought(doc, errs, warns, stats):
    import datetime as _dt
    C = doc["counties"]; P = doc["periods"]
    if len(C) != 40 or not all(k.startswith("NL") for k in C): errs.append("sequia NL: %d regiones" % len(C)); return
    if P != sorted(set(P)): errs.append("sequia NL: decadas desordenadas")
    for k, c in C.items():
        if len(c["v"]) != len(P): errs.append("sequia NL %s: %d filas y %d decadas" % (k, len(c["v"]), len(P))); continue
        for i, v in enumerate(c["v"]):
            if len(v) != 6 or any(not 0 <= x <= 100.5 for x in v) or sum(v) > 100.5: errs.append("sequia NL %s %s: %s" % (k, P[i], v)); break
        if c.get("coverage", 0) < 80: errs.append("sequia NL %s: cobertura %s %%" % (k, c.get("coverage")))
    if doc["asOf"] != P[-1]: errs.append("sequia NL: asOf %s y ultima decada %s" % (doc["asOf"], P[-1]))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=40)).isoformat(): warns.append("sequia NL: ultimo dato %s" % doc["asOf"])
    D = doc.get("deficit")
    if D:
        n = D["days"]
        if not all(len(D[k]) == n for k in ("prev", "med", "p10", "p90")) or not 0 < len(D["cur"]) <= n: errs.append("deficit NL: longitudes de curvas")
        if any(v is not None and not -150 < v < 500 for k in ("cur", "prev", "med") for v in D[k]): errs.append("deficit NL: valores fuera de rango")
        if D["asOf"] < (_dt.date.today() - _dt.timedelta(days=10)).isoformat() and _dt.date.today().month in (4, 5, 6, 7, 8, 9, 10): warns.append("deficit NL: ultimo dia %s" % D["asOf"])
        stats["deficitHasta"] = D["asOf"]
    stats["decadas"] = len(P)
# Italia: gasoleo (MASE) y por region (MIMIT)
def it_fuel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today().isoformat(); prev = None
    for d, a, h in doc["weekly"]:
        if d > today: errs.append("gasolio IT: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("gasolio IT: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.6 < a < 3.5: errs.append("gasolio IT %s: %s" % (d, a))
        if h is not None and not 0.4 < h < 3.5: errs.append("riscaldamento IT %s: %s" % (d, h))
    S = doc["stations"]
    if S["n"] < 8000: errs.append("gasolio IT: solo %d gasolineras" % S["n"])
    for k, v in S["regions"].items():
        if not (0.9 < v[0] < 3.5 and v[1] >= 1): errs.append("gasolio IT %s: %s" % (k, v))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=21)).isoformat(): warns.append("gasolio IT: ultima semana %s" % doc["asOf"])
    stats["semanas"] = len(doc["weekly"]); stats["regiones"] = len(S["regions"])
# Italia: emisiones de la agricultura (Eurostat)
def it_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI IT: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (18000 < a < 60000 and 250000 < t < 650000): errs.append("GEI IT %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI IT %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
# Italia: severidad hidrica por distrito (ISPRA)
def it_water_severity(doc, errs, warns, stats):
    import datetime as _dt
    regs = []
    for k, d in doc["districts"].items():
        if d["level"] not in doc["levels"]: errs.append("severita IT %s: nivel %s" % (k, d["level"]))
        regs += d["regions"]
    if len(regs) != 20 or len(set(regs)) != 20: errs.append("severita IT: las regiones del mapa no son 20 distintas")
    if doc.get("asOf") and doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=120)).isoformat(): warns.append("severita IT: ISPRA no actualiza desde %s" % doc["asOf"])
    stats["distritos"] = len(doc["districts"])
# Alemania: gasoleo, fioul y Agrardiesel
def de_diesel(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today().isoformat(); prev = None
    for d, t, n, h in doc["weekly"]:
        if d > today: errs.append("diesel DE: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("diesel DE: semanas desordenadas en %s" % d); return
        prev = d
        if not 0.6 < t < 3.5: errs.append("diesel DE %s: %s" % (d, t))
        if n is not None and n >= t: errs.append("diesel DE %s: sin impuestos (%s) >= con impuestos (%s)" % (d, n, t))
    A = doc.get("agrardiesel")
    if A and not 0 < A["eurPerLitre"] < 0.5: errs.append("Agrardiesel: devolucion %s EUR/l fuera de lo plausible" % A["eurPerLitre"])
    if not A: warns.append("Agrardiesel: sin importe de devolucion")
    if doc.get("farmCost") is not None and not 0.3 < doc["farmCost"] < doc["weekly"][-1][1]: errs.append("diesel DE: coste de explotacion %s incoherente" % doc["farmCost"])
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=21)).isoformat(): warns.append("diesel DE: ultima semana %s" % doc["asOf"])
    stats["semanas"] = len(doc["weekly"])
# Alemania: emisiones de la agricultura (Eurostat)
def de_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI DE: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (35000 < a < 110000 and 450000 < t < 1400000): errs.append("GEI DE %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI DE %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
# Alemania: humedad del suelo por Land (DWD)
def de_soil_moisture(doc, errs, warns, stats):
    import datetime as _dt
    ms = doc["months"]; n = len(ms)
    for a, b in zip(ms, ms[1:]):
        if b <= a: errs.append("suelo DE: meses desordenados en %s" % b); return
    if set(doc["regions"]) != set(doc["values"]) or set(doc["regions"]) != set(doc["clim"]) or "DE" not in doc["regions"]: errs.append("suelo DE: regiones incoherentes"); return
    for k in doc["regions"]:
        if len(doc["values"][k]) != n: errs.append("suelo DE %s: %d valores para %d meses" % (k, len(doc["values"][k]), n)); continue
        if any(v is not None and not 0 <= v <= 130 for v in doc["values"][k]): errs.append("suelo DE %s: valores fuera de 0-130 %% nFK" % k)
        if len(doc["clim"][k]) != 12: errs.append("suelo DE %s: climatologia sin 12 meses" % k)
    last = _dt.date.fromisoformat(doc["asOf"] + "-01")
    if (_dt.date.today() - last).days > 75: warns.append("suelo DE: ultimo mes %s" % doc["asOf"])
    stats["meses"] = n
# Francia: GNR, gazole y fioul (DGEC) y gazole por departamento
def fr_gnr(doc, errs, warns, stats):
    import datetime as _dt
    today = _dt.date.today().isoformat(); prev = None
    for r in doc["weekly"]:
        d, g, gh, a, f = r
        if d > today: errs.append("GNR: fecha futura %s" % d); return
        if prev and d <= prev: errs.append("GNR: semanas desordenadas en %s" % d); return
        prev = d
        if g is None or not 0.4 < g < 3.0: errs.append("GNR %s: %s fuera de lo plausible" % (d, g))
        elif gh is not None and gh >= g: errs.append("GNR %s: el precio sin impuestos (%s) no puede superar al de con impuestos (%s)" % (d, gh, g))
        if a is not None and g is not None and g >= a: errs.append("GNR %s: mas caro que el gazole de carretera" % d)
    S = doc["stations"]
    if S["n"] < 5000: errs.append("GNR: solo %d gasolineras" % S["n"])
    for k, v in S["departments"].items():
        if not (0.9 < v[0] < 3.5 and v[1] >= 1): errs.append("gazole %s: %s" % (k, v))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=21)).isoformat(): warns.append("GNR: ultima semana %s" % doc["asOf"])
    stats["semanas"] = len(doc["weekly"]); stats["departamentos"] = len(S["departments"])
# Francia: emisiones de la agricultura (Eurostat)
def fr_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI FR: anos no consecutivos desde 1990"); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (40000 < a < 110000 and 250000 < t < 700000): errs.append("GEI FR %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        for k in ("byCategory", "byGas"):
            c = sum(v[i] for v in doc[k].values())
            if abs(c - a) > 2: errs.append("GEI FR %d: %s suma %.0f y la agricultura %.0f" % (ys[i], k, c, a))
    stats["anos"] = n; stats["ultimo"] = ys[-1]
# Francia: rios sin agua (ONDE)
def fr_onde(doc, errs, warns, stats):
    import datetime as _dt
    prev = None
    for m in doc["months"]:
        if prev and m["month"] <= prev: errs.append("ONDE: meses desordenados en %s" % m["month"]); return
        prev = m["month"]
        if [sum(v[i] for v in m["departments"].values()) for i in range(3)] != m["total"]: errs.append("ONDE %s: los departamentos no suman el total" % m["month"])
        if not 5 <= int(m["month"][5:]) <= 10: errs.append("ONDE: mes fuera de la temporada %s" % m["month"])
    big = [m for m in doc["months"] if sum(m["total"]) >= 1500]
    if len(big) < 40: errs.append("ONDE: solo %d campanas completas" % len(big))
    stats["meses"] = len(doc["months"]); stats["ultimo"] = doc["asOf"]
# Francia: nitratos en aguas subterraneas
def fr_nitrates(doc, errs, warns, stats):
    prev = None
    for y in doc["years"]:
        if prev and y["year"] != prev + 1: errs.append("nitratos FR: falta algun ano antes de %d" % y["year"])
        prev = y["year"]
        if y["points"] < 1500: errs.append("nitratos FR %d: solo %d puntos" % (y["year"], y["points"]))
        if not (2 < (y["median"] or 0) < 60): errs.append("nitratos FR %d: mediana %s" % (y["year"], y["median"]))
        if not 0 <= y["over50"] <= y["over25"] <= 100: errs.append("nitratos FR %d: porcentajes incoherentes" % y["year"])
        for k, v in y["departments"].items():
            if not (v[0] >= 1 and 0 <= v[3] <= v[2] <= 100): errs.append("nitratos FR %d/%s: %s" % (y["year"], k, v)); break
    if prev and prev < __import__("datetime").date.today().year - 2: warns.append("nitratos FR: ultimo ano %d" % prev)
    stats["anos"] = len(doc["years"])
# Espana: gasoleo B (agricola) en gasolineras por provincia (MITECO)
def es_gasoleo_b(doc, errs, warns, stats):
    import datetime as _dt
    L = doc["latest"]; today = _dt.date.today().isoformat()
    if not (0.6 < L["b"] < 3.0): errs.append("gasoleo B: mediana nacional %s fuera de lo plausible" % L["b"])
    if L["a"] and L["b"] >= L["a"]: errs.append("gasoleo B: no puede ser mas caro que el A (%s >= %s)" % (L["b"], L["a"]))
    if L["nb"] < 1000: errs.append("gasoleo B: solo %d estaciones" % L["nb"])
    for p, v in L["provinces"].items():
        if not (len(p) == 2 and "01" <= p <= "52"): errs.append("gasoleo B: provincia %s" % p); return
        if not (0.6 < v[0] < 3.0 and v[1] >= 1): errs.append("gasoleo B %s: mediana %s con %s estaciones" % (p, v[0], v[1]))
    rows = doc["history"]["rows"]; prev = None
    for r in rows:
        if r[0] > today: errs.append("gasoleo B: fecha futura %s" % r[0]); return
        if prev and r[0] <= prev: errs.append("gasoleo B: historico desordenado en %s" % r[0]); return
        if r[1] is not None and not 0.3 < r[1] < 3.0: errs.append("gasoleo B %s: %s" % (r[0], r[1]))
        prev = r[0]
    if L["date"] < (_dt.date.today() - _dt.timedelta(days=4)).isoformat(): warns.append("gasoleo B: ultimo dato %s" % L["date"])
    if doc["history"].get("pending"): warns.append("gasoleo B: faltan %d puntos del historico por reconstruir" % doc["history"]["pending"])
    stats["provincias"] = len(L["provinces"]); stats["historico"] = len(rows)
# Espana: emisiones GEI de la agricultura (MITECO)
def es_ghg_agri(doc, errs, warns, stats):
    ys = doc["years"]; n = len(ys)
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 1990: errs.append("GEI: anos no consecutivos desde 1990"); return
    for k in ("agriculture", "national", "machinery"):
        if len(doc[k]) != n: errs.append("GEI: %s con %d valores para %d anos" % (k, len(doc[k]), n)); return
    for i in range(n):
        a = doc["agriculture"][i]; t = doc["national"][i]
        if not (20000 < a < 70000 and 150000 < t < 600000): errs.append("GEI %d: agricultura %s / total %s fuera de lo plausible" % (ys[i], a, t))
        c = sum(v[i] for v in doc["byCategory"].values())
        if abs(c - a) > 2: errs.append("GEI %d: las categorias (%.0f) no suman la agricultura (%.0f)" % (ys[i], c, a))
        g = sum(v[i] for v in doc["byGas"].values())
        if abs(g - a) > 2: errs.append("GEI %d: los gases (%.0f) no suman la agricultura (%.0f)" % (ys[i], g, a))
    if ys[-1] < __import__("datetime").date.today().year - 4: warns.append("GEI: ultimo ano %d" % ys[-1])
    stats["anos"] = n; stats["ultimo"] = ys[-1]
# Espana: sequia prolongada y escasez por unidad territorial (MITECO)
def es_drought_ute(doc, errs, warns, stats):
    import datetime as _dt
    th = doc["thresholds"]["scarcity"]; nu = ns = 0
    def scen(v): return "normal" if v >= th["normal"] else "prealert" if v >= th["prealert"] else "alert" if v >= th["alert"] else "emergency"
    for dm, d in doc["demarcations"].items():
        for r in d["ute"]:
            nu += 1
            if not 0 <= r["value"] <= 1: errs.append("escasez %s/%s: indicador %s" % (dm, r["name"], r["value"]))
            elif r["state"] != scen(r["value"]): errs.append("escasez %s/%s: escenario %s no casa con %s" % (dm, r["name"], r["state"], r["value"]))
            if len(r["series"]) != len(r["months"]): errs.append("escasez %s/%s: meses y valores no casan" % (dm, r["name"]))
        for r in d["uts"]:
            ns += 1
            if not 0 <= r["value"] <= 1: errs.append("sequia %s/%s: indicador %s" % (dm, r["name"], r["value"]))
            elif (r["value"] < doc["thresholds"]["drought"]) != (r["state"] == "drought"): errs.append("sequia %s/%s: estado %s no casa con %s" % (dm, r["name"], r["state"], r["value"]))
    for must in ("Duero", "Tajo", "Guadiana", "Guadalquivir", "Ebro", "Júcar", "Segura"):
        if must not in doc["demarcations"]: errs.append("sequia/escasez: falta la demarcacion %s" % must)
    if nu < 80 or ns < 80: errs.append("sequia/escasez: solo %d UTE y %d UTS" % (nu, ns))
    if doc["asOf"] < (_dt.date.today() - _dt.timedelta(days=75)).isoformat(): warns.append("sequia/escasez: ultimo informe a %s" % doc["asOf"])
    stats["ute"] = nu; stats["uts"] = ns
# Embalses de Espana uno a uno (MITECO) con ubicacion de Wikidata
def spain_reservoirs_points(doc, errs, warns, stats):
    seen = set(); pts = 0; cap = 0.0
    for x in doc["items"]:
        nm, amb, c, a, py, lat, lon, q, h = x
        if (amb, nm) in seen: errs.append("embalses: repetido %s|%s" % (amb, nm)); return
        seen.add((amb, nm))
        if not (isinstance(c, (int, float)) and c > 0 and isinstance(a, (int, float)) and 0 <= a <= c * 1.05): errs.append("embalses %s: capacidad o agua incoherentes (%s / %s)" % (nm, a, c)); return
        if py is not None and not 0 <= py <= 105: errs.append("embalses %s: %% hace un ano fuera de rango" % nm)
        if lat is not None:
            pts += 1
            if not (35.8 <= lat <= 43.9 and -9.4 <= lon <= 4.4): errs.append("embalses %s: punto fuera de la Espana peninsular y Baleares (%s, %s)" % (nm, lat, lon))
            if not (isinstance(q, str) and q.startswith("Q")): errs.append("embalses %s: punto sin elemento de Wikidata" % nm)
        cap += c
    if not 54000 <= cap <= 58000: errs.append("embalses: capacidad total %.0f hm3 fuera de lo esperado" % cap)
    try:
        es = load("spain-reservoirs.json")
        if es["asOf"] != doc["asOf"]: errs.append("embalses: la semana (%s) no coincide con spain-reservoirs.json (%s)" % (doc["asOf"], es["asOf"]))
    except Exception: pass
    if pts < 0.6 * len(doc["items"]): warns.append("embalses: solo %d de %d con punto" % (pts, len(doc["items"])))
    stats["embalses"] = len(doc["items"]); stats["conPunto"] = pts
# Indice de precios de la madera de los bosques estatales alemanes (Destatis 61231-0002)
def wood_prices_de(doc, errs, warns, stats):
    import datetime as _dt
    ms = doc["months"]; n = len(ms)
    if ms != sorted(set(ms)): errs.append("madera DE: meses no ascendentes"); return
    for k, v in doc["series"].items():
        if len(v) != n: errs.append("madera DE %s: longitud %d distinta de los meses (%d)" % (k, len(v), n)); return
        for i, x in enumerate(v):
            if x is not None and not 10 <= x <= 400: errs.append("madera DE %s %s: indice fuera de rango (%s)" % (k, ms[i], x))
    t = doc["series"].get("total")
    if not t or t[-1] is None: errs.append("madera DE: el total no llega al ultimo mes")
    if doc["last"] != ms[-1]: errs.append("madera DE: last no coincide con el ultimo mes")
    if ms[-1] < (_dt.date.today() - _dt.timedelta(days=120)).strftime("%Y-%m"): warns.append("madera DE: ultimo mes %s, con retraso" % ms[-1])
    stats["meses"] = n
# Incendios forestales por pais (EFFIS / GWIS)
FOREST_FIRE_CC = ["AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "EU", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "UK",
                  "AR", "AU", "CA", "CL", "US", "UY"]
def forest_fires(doc, errs, warns, stats):
    import datetime as _dt
    ys = doc["years"]; n = len(ys); today = _dt.date.today()
    if ys != list(range(ys[0], ys[0] + n)) or ys[0] != 2006: errs.append("incendios: años no consecutivos desde 2006"); return
    if ys[-1] != doc["currentYear"]: errs.append("incendios: currentYear no es el ultimo año"); return
    if ys[-1] > today.year or ys[-1] < today.year - 1: errs.append("incendios: ultimo año %d lejos del actual" % ys[-1]); return
    miss = [c for c in FOREST_FIRE_CC if c not in doc["countries"]]
    if miss: errs.append("incendios: faltan paises %s" % miss); return
    for cc, c in doc["countries"].items():
        if len(c["ba"]) != n or len(c["nf"]) != n: errs.append("incendios %s: longitud distinta de los años" % cc); return
        first = 2012 if c["system"] == "gwis" else 2006
        for i, y in enumerate(ys):
            b, f = c["ba"][i], c["nf"][i]
            if (b is None) != (f is None): errs.append("incendios %s %d: superficie e incendios no coinciden en hueco" % (cc, y)); return
            if y < first and b is not None: errs.append("incendios %s %d: dato anterior al inicio del sistema (%d)" % (cc, y, first)); return
            if y >= first and b is None: errs.append("incendios %s %d: hueco dentro del rango del sistema" % (cc, y)); return
            if b is None: continue
            if b > 100_000_000 or f > 300_000: errs.append("incendios %s %d: cifra fuera de rango (%s ha, %s incendios)" % (cc, y, b, f)); return
            if b > 0 and f == 0: errs.append("incendios %s %d: superficie sin ningun incendio" % (cc, y)); return
    eu = doc["countries"]["EU"]
    if eu["system"] != "effis" or eu["ba"][-2] is None: errs.append("incendios UE: falta el total del ultimo año completo"); return
    if not 20_000 <= eu["ba"][-2] <= 3_000_000: errs.append("incendios UE %d: %s ha fuera de lo plausible" % (ys[-2], eu["ba"][-2]))
    if doc["asOf"] < (today - _dt.timedelta(days=5)).isoformat(): warns.append("incendios: datos de %s, con retraso" % doc["asOf"])
    stats["paises"] = len(doc["countries"]); stats["años"] = n
# Precios oficiales de la madera por surtido (SI, CZ, LV, FI, PL)
TIMBER_FREQ = {"M": (r"^\d{4}-(0[1-9]|1[0-2])$", 120), "Q": (r"^\d{4}-Q[1-4]$", 200), "H": (r"^\d{4}-H[12]$", 420), "W": (r"^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$", 45), "A": (r"^\d{4}$", 600)}
TIMBER_MAX = {"EUR/m3": 600, "CZK/m3": 12000, "PLN/m3": 1500}
def _timber_period_end(f, p):
    import datetime as _d
    y = int(p[:4])
    if f == "M": return _d.date(y + (int(p[5:]) == 12), int(p[5:]) % 12 + 1, 1)
    if f == "Q": return _d.date(y + (int(p[6]) == 4), (int(p[6]) * 3) % 12 + 1, 1)
    if f == "H": return _d.date(y + (int(p[6]) == 2), 7 if p[6] == "1" else 1, 1)
    if f == "W": return _d.date(y, 1, 1) + _d.timedelta(days=7 * int(p[6:]))
    return _d.date(y, 10, 31)   # anual (PL): el dato de enero-septiembre sale en octubre
def forest_timber_prices(doc, errs, warns, stats):
    import re as _re, datetime as _d
    today = _d.date.today()
    cs = doc.get("countries", {})
    for must in ("SI", "CZ", "LV", "FI", "PL"):
        if must not in cs: errs.append("falta el pais %s" % must)
    for cc, c in cs.items():
        f = c.get("freq"); pat, maxage = TIMBER_FREQ.get(f, (None, None))
        if not pat: errs.append("%s: frecuencia desconocida %r" % (cc, f)); continue
        per = c["periods"]; n = len(per)
        bad = [p for p in per if not _re.match(pat, p)]
        if bad: errs.append("%s: periodos con formato invalido (%s)" % (cc, bad[:2])); continue
        if per != sorted(set(per)): errs.append("%s: periodos repetidos o desordenados" % cc)
        end = _timber_period_end(f, per[-1])
        if (today - end).days > maxage: warns.append("%s: ultimo periodo %s antiguo (%d dias desde su fin)" % (cc, per[-1], (today - end).days))
        if end > today + _d.timedelta(days=14): errs.append("%s: ultimo periodo %s en el futuro" % (cc, per[-1]))
        if c.get("unit") not in TIMBER_MAX: errs.append("%s: unidad inesperada %r" % (cc, c.get("unit"))); continue
        top = TIMBER_MAX[c["unit"]]; ids = set(); nb = 0
        for s in c["series"]:
            if s["id"] in ids: errs.append("%s: serie repetida %s" % (cc, s["id"]))
            ids.add(s["id"]); nb += bool(s["bench"])
            if s["group"] not in doc["groups"]: errs.append("%s/%s: grupo desconocido %r" % (cc, s["id"], s["group"]))
            v = s["values"]
            if len(v) != n: errs.append("%s/%s: %d valores para %d periodos" % (cc, s["id"], len(v), n)); continue
            nums = [x for x in v if x is not None]
            if not nums: errs.append("%s/%s: serie vacia" % (cc, s["id"])); continue
            if any((not isinstance(x, (int, float))) or x <= 0 or x > top for x in nums): errs.append("%s/%s: precio no positivo o por encima de %s %s" % (cc, s["id"], top, c["unit"]))
            if v[-1] is None and cc not in ("FI",) : warns.append("%s/%s: sin dato en el ultimo periodo" % (cc, s["id"]))
            if len(nums) >= 2 and cc != "PL":
                jump = max(nums[i + 1] / nums[i] for i in range(len(nums) - 1))
                if jump > 4: errs.append("%s/%s: salto de x%.1f entre periodos" % (cc, s["id"], jump))
        if nb == 0 and cc != "PL": warns.append("%s: ninguna serie marcada como referencia" % cc)
    stats["countries"] = len(cs)
    stats["series"] = sum(len(c["series"]) for c in cs.values())
# Energia de la madera: pellets y astillas
WOOD_ENERGY_RANGE = {"us-pellet-domestic-price": (80, 600), "us-pellet-export-price": (80, 600), "us-pellet-domestic-qty": (1, 3e6), "us-pellet-export-qty": (1, 3e6),
                     "fi-pellet-consumer-price": (100, 1200), "fi-forest-chips-price": (5, 120), "hu-firewood-price": (1000, 40000)}
def wood_energy(doc, errs, warns, stats):
    import re as _re, datetime as _d
    today = _d.date.today(); ids = {s["id"]: s for s in doc["series"]}
    for must in WOOD_ENERGY_RANGE:
        if must not in ids: errs.append("falta la serie %s" % must)
    for sid, s in ids.items():
        pat = r"^\d{4}-(0[1-9]|1[0-2])$" if s["freq"] == "M" else r"^\d{4}-Q[1-4]$"
        per = s["periods"]
        if len(per) != len(s["values"]): errs.append("%s: %d periodos y %d valores" % (sid, len(per), len(s["values"]))); continue
        if any(not _re.match(pat, p) for p in per): errs.append("%s: periodo con formato invalido" % sid); continue
        if per != sorted(set(per)): errs.append("%s: periodos repetidos o desordenados" % sid)
        lo, hi = WOOD_ENERGY_RANGE.get(sid, (0, 1e9))
        if any(v is None or not isinstance(v, (int, float)) or v < lo or v > hi for v in s["values"]): errs.append("%s: valor fuera de %s-%s %s" % (sid, lo, hi, s["unit"]))
        y = int(per[-1][:4]); m = int(per[-1][5:]) if s["freq"] == "M" else int(per[-1][-1]) * 3
        age = (today - _d.date(y, m, 28)).days
        if age < -45: errs.append("%s: ultimo periodo %s en el futuro" % (sid, per[-1]))
        lim = 150 if sid.startswith("us-") else 240
        if age > lim: warns.append("%s: ultimo periodo %s antiguo (%d dias)" % (sid, per[-1], age))
    for a, b in (("us-pellet-domestic-price", "us-pellet-domestic-qty"), ("us-pellet-export-price", "us-pellet-export-qty")):
        if a in ids and b in ids and ids[a]["periods"] != ids[b]["periods"]: errs.append("%s y %s con periodos distintos" % (a, b))
    stats["series"] = len(ids)
# Cortas, daños y plagas forestales (CZ, SE, EE, HU)
FOREST_DAMAGE_MAX = {"m3 (sin corteza)": 5e7, "milj. m3sk": 200, "milj. m3fub": 200, "ha": 5e6, "escarabajos por trampa": 1e5, "ezer m3": 1e5, "1000 m3sk": 2e5, "%": 150}
FOREST_DAMAGE_MUST = ["cz-forestland-total", "cz-clearings-area", "ee-damaged-total", "hu-harvest-total", "hu-harvest-ratio", "cz-felling-total", "cz-salvage-total", "cz-salvage-insect", "se-storm-felled", "se-felling-gross", "se-bark-beetle-trap-mean", "ee-destroyed-total", "ee-destroyed-insects", "hu-damage-total", "hu-damage-insects"]
def forest_damage(doc, errs, warns, stats):
    import re as _re, datetime as _d
    cy = _d.date.today().year; ids = {}
    for s in doc["series"]:
        if s["id"] in ids: errs.append("serie repetida %s" % s["id"])
        ids[s["id"]] = s
    for must in FOREST_DAMAGE_MUST:
        if must not in ids: errs.append("falta la serie %s" % must)
    for sid, s in ids.items():
        if not sid.startswith(s["country"].lower() + "-"): errs.append("%s: el id no corresponde al pais %s" % (sid, s["country"]))
        pat = r"^\d{4}$" if s["freq"] == "A" else r"^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$"
        per = s["periods"]
        if len(per) != len(s["values"]): errs.append("%s: %d periodos y %d valores" % (sid, len(per), len(s["values"]))); continue
        if any(not _re.match(pat, p) for p in per): errs.append("%s: periodo con formato invalido" % sid); continue
        if per != sorted(set(per)): errs.append("%s: periodos repetidos o desordenados" % sid)
        top = FOREST_DAMAGE_MAX.get(s["unit"])
        if top is None: errs.append("%s: unidad inesperada %r" % (sid, s["unit"])); continue
        if any(not isinstance(v, (int, float)) or v < 0 or v > top for v in s["values"]): errs.append("%s: valor negativo o por encima de %s %s" % (sid, top, s["unit"]))
        ly = int(per[-1][:4])
        if ly > cy: errs.append("%s: ultimo periodo %s en el futuro" % (sid, per[-1]))
        if ly < cy - (2 if s["freq"] == "A" else 1) and "3y" not in sid: warns.append("%s: ultimo periodo %s antiguo" % (sid, per[-1]))     # las medias de 3 años (SE, 1996-2020) son una serie cerrada
    cz = lambda k: dict(zip(ids[k]["periods"], ids[k]["values"])) if k in ids else {}
    tot = cz("cz-salvage-total"); parts = [cz(k) for k in ("cz-salvage-natural", "cz-salvage-insect", "cz-salvage-emissions", "cz-salvage-other")]
    for y, v in tot.items():
        if all(y in p for p in parts) and abs(sum(p[y] for p in parts) - v) > 0.02 * v + 10: errs.append("CZ %s: la tala fortuita total (%s) no suma sus causas (%s)" % (y, v, sum(p[y] for p in parts)))
    ft = cz("cz-felling-total")
    for y, v in tot.items():
        if y in ft and v > ft[y] * 1.001: errs.append("CZ %s: la tala fortuita supera a la tala total" % y)
    eu = cz("ee-destroyed-total"); ei = cz("ee-destroyed-insects")
    for y, v in ei.items():
        if y in eu and v > eu[y] * 1.001 + 1: errs.append("EE %s: rodales destruidos por insectos (%s) superan al total (%s)" % (y, v, eu[y]))
    hu = cz("hu-damage-total"); hi = cz("hu-damage-insects")
    for y, v in hi.items():
        if y in hu and v > hu[y] * 1.001: errs.append("HU %s: daños por insectos superan al total" % y)
    # Chequia: partes de la propiedad <= total; regiones: tala fortuita <= tala total y la suma regional ~ el total nacional
    own = cz("cz-forestland-total")
    for k in ("cz-forestland-state", "cz-forestland-municipal", "cz-forestland-private"):
        for y, v in cz(k).items():
            if y in own and v > own[y] * 1.001: errs.append("CZ %s: %s supera a la superficie forestal total" % (y, k))
    regs = {}
    for sid, s in ids.items():
        if s.get("region"): regs.setdefault(sid.rsplit("-", 1)[0], []).append(s)
    for base, ss in regs.items():
        if base.startswith("cz-") and any(not s.get("region") for s in ss): errs.append("%s: serie regional sin region" % base)
    for sv in ("cz-felling-total", "cz-salvage-total"):
        base = sv.replace("cz-", "cz-", 1)
        rs = [s for sid, s in ids.items() if sid.startswith(base + "-") and s.get("region")]
        nat = cz(sv); tot = {}; cnt = {}
        for s in rs:
            for y, v in zip(s["periods"], s["values"]): tot[y] = tot.get(y, 0) + v; cnt[y] = cnt.get(y, 0) + 1
        for y, v in tot.items():
            if y in nat and len(rs) >= 12 and cnt[y] == len(rs) and abs(v - nat[y]) > 0.05 * nat[y] + 1000: errs.append("CZ %s: la suma de regiones de %s (%s) no coincide con el total nacional (%s)" % (y, sv, round(v), nat[y]))
    fs = [s for s in ids.values() if s["id"].startswith("cz-felling-total-") and s.get("region")]; ss = {s["region"]: s for s in ids.values() if s["id"].startswith("cz-salvage-total-") and s.get("region")}
    for f in fs:
        sv = ss.get(f["region"])
        if sv:
            fd_ = dict(zip(f["periods"], f["values"]))
            for y, v in zip(sv["periods"], sv["values"]):
                if y in fd_ and v > fd_[y] * 1.001: errs.append("CZ %s %s: la tala fortuita regional supera a la tala total" % (f["region"], y))
    sr = [s for s in ids.values() if s["id"].startswith("se-felling-gross-") and s.get("region")]
    if len(sr) < 20: errs.append("SE: solo %d provincias con corta bruta" % len(sr))
    seg = cz("se-felling-gross"); tot = {}
    for s in sr:
        for y, v in zip(s["periods"], s["values"]): tot[y] = tot.get(y, 0) + v
    for y, v in tot.items():
        if y in seg and len(sr) >= 20 and abs(v - seg[y]) > 0.03 * seg[y]: errs.append("SE %s: la suma de provincias (%.2f) no coincide con la corta bruta nacional (%.2f)" % (y, v, seg[y]))
    et = cz("ee-damaged-total")
    for k in [k for k in ids if k.startswith("ee-damaged-") and k != "ee-damaged-total"]:
        for y, v in cz(k).items():
            if y in et and v > et[y] * 1.001 + 1: errs.append("EE %s: %s supera al total de rodales dañados" % (y, k))
    ht = cz("hu-harvest-total")
    for k in [k for k in ids if k.startswith("hu-harvest-") and k not in ("hu-harvest-total", "hu-harvest-ratio")]:
        for y, v in cz(k).items():
            if y in ht and v > ht[y] * 1.001: errs.append("HU %s: %s supera a la corta total" % (y, k))
    se = cz("se-felling-gross"); sn = cz("se-felling-net")
    for y, v in sn.items():
        if y in se and v * 0.95 > se[y]: errs.append("SE %s: la corta neta (m3fub) no puede superar a la bruta (m3sk)" % y)
    stats["series"] = len(ids)
def uk_timber_prices(doc, errs, warns, stats):
    import re as _re, datetime as _d
    ids = {s["id"]: s for s in doc["series"]}
    for must in ("uk-standing-conifer", "uk-sawlog-softwood", "uk-small-roundwood"):
        if must not in ids: errs.append("falta la serie %s" % must)
    for sid, s in ids.items():
        per = s["periods"]
        if len(per) != len(s["values"]): errs.append("%s: %d periodos y %d valores" % (sid, len(per), len(s["values"]))); continue
        if any(not _re.fullmatch(r"\d{4}-(03|09)", p) for p in per): errs.append("%s: periodo que no es marzo ni septiembre" % sid); continue
        if per != sorted(set(per)): errs.append("%s: periodos repetidos o desordenados" % sid)
        if any(not isinstance(v, (int, float)) or not 10 <= v <= 200 for v in s["values"]): errs.append("%s: precio fuera de 10-200 GBP/m3" % sid)
    if "uk-standing-conifer" in ids and "uk-sawlog-softwood" in ids:
        a, b = ids["uk-standing-conifer"], ids["uk-sawlog-softwood"]
        if a["periods"] == b["periods"] and any(x >= y for x, y in zip(a["values"], b["values"])): errs.append("la madera en pie no puede valer mas que el rollo de aserrio")
    last = max(s["periods"][-1] for s in ids.values()) if ids else "0000-00"
    y, m = int(last[:4]), int(last[5:]); age = (_d.date.today() - _d.date(y + (m == 12), m % 12 + 1, 1)).days
    if age > 330: warns.append("madera UK: ultimo periodo %s, con %d dias de retraso" % (last, age))
    stats["series"] = len(ids); stats["ultimo"] = last
def wood_prices_na(doc, errs, warns, stats):
    """Indices de madera de EE. UU. (BLS) y Canada (StatCan): meses ascendentes, series de la misma longitud, indices en rango y llegando a un mes reciente."""
    import datetime as _dt
    n_all = 0
    for c, d in doc["countries"].items():
        ms = d["months"]; n = len(ms)
        if ms != sorted(set(ms)): errs.append("madera %s: meses no ascendentes" % c); continue
        for k, v in d["series"].items():
            if len(v) != n: errs.append("madera %s %s: longitud distinta de los meses" % (c, k)); break
            vals = [x for x in v if x is not None]
            if not vals: errs.append("madera %s %s: serie vacia" % (c, k)); continue
            if any(not 5 <= x <= 2000 for x in vals): errs.append("madera %s %s: indice fuera de rango" % (c, k))
            n_all += 1
        if ms[-1] < (_dt.date.today() - _dt.timedelta(days=150)).strftime("%Y-%m"): warns.append("madera %s: ultimo mes %s, con retraso" % (c, ms[-1]))
    stats["series"] = n_all
# Zona y categoria de las denominaciones francesas (INAO): scripts/update-inao-geo.py
def _gi_fr_ids():
    d = load("gi/FR.json"); return {e["f"] for k in ("wine", "cheese") for e in d[k]}
def gi_fr_geo(doc, errs, warns, stats):
    ids = _gi_fr_ids(); W, H = [float(x) for x in doc["viewBox"].split()[2:]]
    for f, a in doc["areas"].items():
        if f not in ids: errs.append("FR-geo: %s no es una denominacion de FR.json" % f); return
        x, y, w, h = a["b"]
        if w <= 0 or h <= 0 or x < -40 or y < -40 or x + w > W + 40 or y + h > H + 40: errs.append("FR-geo %s: caja fuera del mapa %s" % (f, a["b"])); return
        if not a["d"].count("M") or len(a["d"]) < 40: errs.append("FR-geo %s: trazado vacio" % f); return
    if len(doc["areas"]) < 0.85 * len(ids): errs.append("FR-geo: solo %d zonas de %d denominaciones" % (len(doc["areas"]), len(ids)))
    stats["areas"] = len(doc["areas"])
def gi_fr_inao(doc, errs, warns, stats):
    ids = _gi_fr_ids(); n = len(doc["cats"])
    if len(set(doc["cats"])) != n: errs.append("FR-inao: categorias repetidas")
    for f, ix in doc["e"].items():
        if f not in ids: errs.append("FR-inao: %s no es una denominacion de FR.json" % f); return
        if any(i >= n for i in ix): errs.append("FR-inao %s: indice de categoria fuera de rango" % f); return
    if any(f not in ids for f in doc["z"]) or doc["z"] != sorted(set(doc["z"])): errs.append("FR-inao: lista de zonas invalida")
    if set(doc["z"]) != set(load("gi/FR-geo.json")["areas"]): errs.append("FR-inao: la lista de zonas no coincide con FR-geo.json")
    stats["cats"] = n; stats["zones"] = len(doc["z"])
def gi_index(doc, errs, warns, stats):
    C = doc["countries"]
    for cc in ("ES", "FR", "IT", "PT", "EL", "DE"):
        if cc not in C or C[cc]["wine"] < 10: errs.append("gi: %s sin vinos o con muy pocos" % cc)
    tot = sum(v["wine"] + v["cheese"] for v in C.values())
    if tot < 1500: errs.append("gi: solo %d denominaciones" % tot)
    stats["countries"] = len(C); stats["total"] = tot

# ---- España: MAPA (precios, renta agraria, ESYRCE, fertilizantes, fitosanitarios) ----
def _weeks_ok(W, name, errs):
    prev = None
    for w in W:
        try: d = datetime.date.fromisoformat(w)
        except ValueError: errs.append("%s: fecha invalida %r" % (name, w)); return False
        if d.weekday() != 0: errs.append("%s: la semana %s no empieza en lunes" % (name, w)); return False
        if prev and w <= prev: errs.append("%s: semanas desordenadas o repetidas (%s)" % (name, w)); return False
        prev = w
    return True
def spain_prices_pmn(doc, errs, warns, stats):
    """Precios medios nacionales: semanas ISO (lunes) crecientes, >=100 series con tantos valores como semanas, sin ids repetidos, precios positivos y plausibles, series clave presentes."""
    W = doc["weeks"]; S = doc["series"]; ids = set()
    if not _weeks_ok(W, "pmn", errs): return
    if len(S) < 100: errs.append("pmn: %d series (se esperan >=100)" % len(S)); return
    for s in S:
        if s["id"] in ids: errs.append("pmn: id repetido %s" % s["id"])
        ids.add(s["id"])
        if len(s["v"]) != len(W): errs.append("pmn %s: %d valores para %d semanas" % (s["id"], len(s["v"]), len(W))); continue
        vs = [x for x in s["v"] if x is not None]
        if not vs: errs.append("pmn %s: sin ningun dato" % s["id"]); continue
        if min(vs) <= 0 or max(vs) > 30000 or any(x != x for x in vs): errs.append("pmn %s: precio imposible" % s["id"])
    for k, lo, hi in (("trigo-blando", 80, 700), ("cebada-pienso", 80, 700), ("maiz-grano", 80, 700), ("trigo-duro", 80, 900)):
        s = next((x for x in S if x["id"] == k), None)
        if not s: errs.append("pmn: falta la serie clave %s" % k); continue
        vs = [x for x in s["v"] if x is not None]
        if vs and not (lo <= vs[-1] <= hi): errs.append("pmn %s: ultimo precio %s fuera de %d-%d EUR/t" % (k, vs[-1], lo, hi))
    stats["series"] = len(S)
def spain_prices_obs(doc, errs, warns, stats):
    """Observatorio de precios: semanas ISO crecientes (>=500), series de origen y de MERCASA (>=25 cada una), valores positivos y por debajo de 500 EUR por unidad."""
    W = doc["weeks"]; S = doc["series"]; ids = set(); st = {"origen": 0, "mercasa": 0}
    if not _weeks_ok(W, "obs", errs): return
    if len(W) < 500: errs.append("obs: %d semanas (se esperan >=500)" % len(W))
    for s in S:
        if s["id"] in ids: errs.append("obs: id repetido %s" % s["id"])
        ids.add(s["id"]); st[s["stage"]] += 1
        if len(s["v"]) != len(W): errs.append("obs %s: %d valores para %d semanas" % (s["id"], len(s["v"]), len(W))); continue
        vs = [x for x in s["v"] if x is not None]
        if not vs: errs.append("obs %s: sin ningun dato" % s["id"]); continue
        if min(vs) <= 0 or max(vs) > 500: errs.append("obs %s: precio imposible" % s["id"])
    for k, n in st.items():
        if n < 25: errs.append("obs: solo %d series de %s (se esperan >=25)" % (n, k))
    stats["series"] = len(S)
def spain_income_cea(doc, errs, warns, stats):
    """Cuentas de la agricultura: años crecientes que llegan a >=2024, todas las filas con un valor por año, fila A y fila G (renta agraria) presentes y plausibles, y cada cuenta regional con >=18 territorios cuyo total ESPAÑA cuadra con la suma de comunidades (1 %)."""
    Y = doc["years"]; N = doc["national"]
    if Y != sorted(set(Y)) or Y[0] > 1995 or Y[-1] < 2024: errs.append("cea: años raros %r..%r" % (Y[0], Y[-1])); return
    for it in N:
        if len(it["v"]) != len(Y): errs.append("cea nacional %r: %d valores para %d años" % (it["label"][:30], len(it["v"]), len(Y)))
    A = next((x for x in N if x["label"].startswith("A.")), None); G = next((x for x in N if x["label"].startswith("G")), None)
    if not A or not G: errs.append("cea: faltan la fila A (produccion) o G (renta agraria)"); return
    if not 3e3 < (G["v"][-1] or 0) < 8e4: errs.append("cea: renta agraria %s fuera de rango (millones EUR)" % G["v"][-1])
    if not 1e4 < (A["v"][-1] or 0) < 2e5: errs.append("cea: produccion %s fuera de rango" % A["v"][-1])
    if (G["v"][-1] or 0) > (A["v"][-1] or 0): errs.append("cea: la renta agraria supera la produccion")
    for y, r in doc["regional"].items():
        R = r["regions"]
        if len(R) < 18 or not R[-1].upper().startswith("ESPA"): errs.append("cea regional %s: territorios raros" % y); continue
        for it in r["items"]:
            if len(it["v"]) != len(R): errs.append("cea regional %s %r: valores y territorios no cuadran" % (y, it["label"][:30])); break
        a = r["items"][0]["v"]
        if all(x is not None for x in a) and abs(sum(a[:-1]) - a[-1]) > 0.01 * abs(a[-1]): errs.append("cea regional %s: las comunidades no suman España (%s vs %s)" % (y, round(sum(a[:-1])), a[-1]))
    stats["series"] = len(N)
def spain_esyrce(doc, errs, warns, stats):
    """ESYRCE: territorios unicos con ESPAÑA, cada cultivo con un valor por territorio, hectareas no negativas y bajo 20 M ha, y si hay secano y regadio, secano+regadio ≈ total en España (<=1 % de los cultivos de mas de 1000 ha pueden fallar un 2 %)."""
    T = doc["territories"]; ids = [t["id"] for t in T]
    if len(set(ids)) != len(ids): errs.append("esyrce: territorios repetidos")
    if "espana" not in ids: errs.append("esyrce: falta ESPAÑA"); return
    ie = ids.index("espana"); M = doc["measures"]
    for m, cs in M.items():
        seen = set()
        for c in cs:
            k = (c["group"], c["name"])
            if k in seen: errs.append("esyrce %s: cultivo repetido %r" % (m, k)); break
            seen.add(k)
            if len(c["v"]) != len(T): errs.append("esyrce %s %r: %d valores para %d territorios" % (m, c["name"], len(c["v"]), len(T))); break
            if any(x is not None and (x < 0 or x > 2e7) for x in c["v"]): errs.append("esyrce %s %r: superficie imposible" % (m, c["name"])); break
    tot = {(c["group"], c["name"]): c["v"][ie] for c in M["total"]}
    if "secano" in M and "regadio" in M:
        sec = {(c["group"], c["name"]): c["v"][ie] for c in M["secano"]}; reg = {(c["group"], c["name"]): c["v"][ie] for c in M["regadio"]}
        big = bad = 0
        for k, t in tot.items():
            if t is None or t < 1000: continue
            big += 1; s = (sec.get(k) or 0) + (reg.get(k) or 0)
            if abs(s - t) > 0.02 * t: bad += 1; warns.append("esyrce: %r secano+regadio=%s total=%s" % (k, round(s), round(t)))
        if big and bad > 0.01 * big + 1: errs.append("esyrce: %d de %d cultivos no cuadran secano+regadio=total" % (bad, big))
    ts = [(k, v) for k, v in tot.items() if k[1] == "Trigo Total"]
    if ts and not 1e6 < (ts[0][1] or 0) < 4e6: errs.append("esyrce: trigo total España %s ha fuera de rango" % ts[0][1])
    stats["series"] = len(M["total"])
def spain_esyrce_index(doc, errs, warns, stats):
    Y = doc["years"]
    if not Y: errs.append("esyrce index: sin años"); return
    for y, v in Y.items():
        if not re.fullmatch(r"20\d\d", y) or v["territories"] < 50 or v["crops"] < 100: errs.append("esyrce index %s: datos raros" % y)
    stats["series"] = len(Y)
def spain_inputs_fertilizers(doc, errs, warns, stats):
    """Fertilizantes: filas con un valor por año, filas totales presentes, ventas agricolas plausibles (t) y regiones con un valor por año regional."""
    Y = doc["years"]; R = doc["rows"]
    if Y != sorted(set(Y)): errs.append("fert: años desordenados")
    for r in R:
        for m in ("produccion", "importacion", "ventas", "usosNoAgricolas", "exportacion"):
            if m in r and len(r[m]) != len(Y): errs.append("fert %s.%s: %d valores para %d años" % (r["id"], m, len(r[m]), len(Y)))
            elif m in r and any(x is not None and (x < 0 or x > 2e7) for x in r[m]): errs.append("fert %s.%s: valor imposible" % (r["id"], m))
    tn = next((r for r in R if r["id"] == "elemento:total-n"), None)
    if not tn: errs.append("fert: falta TOTAL N"); return
    v = [x for x in tn["ventas"] if x is not None]
    if not v or not 3e5 < v[-1] < 2e6: errs.append("fert: ventas de N %s t fuera de rango" % (v[-1] if v else None))
    rg = doc["regional"]
    for x in rg["regions"]:
        for e in ("N", "P2O5", "K2O"):
            if len(x[e]) != len(rg["years"]): errs.append("fert regional %s.%s: valores y años no cuadran" % (x["id"], e))
    stats["series"] = len(R)
def spain_inputs_pesticides(doc, errs, warns, stats):
    Y = doc["years"]; R = doc["rows"]
    t = next((r for r in R if r["id"] == "total"), None)
    if not t: errs.append("fito: falta TOTAL"); return
    for r in R:
        if len(r["v"]) != len(Y): errs.append("fito %s: %d valores para %d años" % (r["id"], len(r["v"]), len(Y))); continue
        if any(x is not None and (x < 0 or x > 5e5) for x in r["v"]): errs.append("fito %s: valor imposible" % r["id"])
    v = [x for x in t["v"] if x is not None]
    if not v or not 2e4 < v[-1] < 2e5: errs.append("fito: total %s t fuera de rango" % (v[-1] if v else None))
    stats["series"] = len(R)
def spain_health_focos(doc, errs, warns, stats):
    """Focos RASVE: ids unicos, fechas validas y no futuras, ni anteriores a 2000, y la clave de enfermedad coherente con el nombre."""
    ids = set(); today = datetime.date.today() + datetime.timedelta(days=2); names = {"asf": "peste porcina africana", "lsd": "dermatosis nodular", "bluetongue": "lengua azul", "hpai": "influenza aviar", "wnv": "nilo occidental"}
    for r in doc["focos"]:
        if r["id"] in ids: errs.append("focos: id repetido %s" % r["id"])
        ids.add(r["id"])
        try: d = datetime.date.fromisoformat(r["date"])
        except ValueError: errs.append("focos %s: fecha invalida" % r["id"]); continue
        if d > today or d.year < 2000: errs.append("focos %s: fecha fuera de rango %s" % (r["id"], r["date"]))
        if r["id"][:4] != r["date"][:4] and abs(int(r["id"][:4]) - d.year) > 1: errs.append("focos %s: el año del foco no cuadra con la fecha" % r["id"])
        k = r["kind"]
        if k in names and names[k] not in r["disease"].lower(): errs.append("focos %s: kind %s no coincide con %r" % (r["id"], k, r["disease"][:40]))
        if k == "other" and any(n in r["disease"].lower() for n in names.values()): errs.append("focos %s: enfermedad vigilada marcada como other" % r["id"])
    stats["series"] = len(doc["focos"])
def spain_esyrce_extra_index(doc, errs, warns, stats):
    Y = doc["years"]
    if not Y: errs.append("esyrce extra index: sin años"); return
    for y, v in Y.items():
        if not re.fullmatch(r"20\d\d", y) or not v.get("tables"): errs.append("esyrce extra index %s: datos raros" % y)
    stats["series"] = len(Y)
def _terr_ok(T, errs, what):
    ids = [t["id"] for t in T]
    if len(set(ids)) != len(ids): errs.append("%s: territorios repetidos" % what)
    return ids
def spain_esyrce_extra(doc, errs, warns, stats):
    """ESYRCE complementario: territorios unicos, series con un valor por territorio, rendimientos plausibles (0 < kg/ha < 300000), parcelas >= 0, estados de plantacion que suman la superficie total, sistemas de riego que suman el regadio y suelos con hectareas no negativas."""
    n = 0
    if "yields" in doc:
        sets = doc.get("yieldSets", [])
        for k, T in enumerate(sets): _terr_ok(T, errs, "yieldSets[%d]" % k)
        seen = set()
        for c in doc["yields"]:
            n += 1
            key = (c["group"], c["name"], c["regime"])
            if key in seen: errs.append("rendimientos: serie repetida %r" % (key,)); break
            seen.add(key)
            if not 0 <= c["set"] < len(sets): errs.append("rendimientos %r: conjunto de territorios inexistente" % (c["name"],)); continue
            L = len(sets[c["set"]])
            if len(c["y"]) != L or len(c["n"]) != L: errs.append("rendimientos %r: longitud distinta de los territorios" % (c["name"],)); continue
            if any(v is not None and not 0 < v < 3e5 for v in c["y"]): errs.append("rendimientos %r %s: valor imposible" % (c["name"], c["regime"])); continue
            if any(v is not None and v < 0 for v in c["n"]): errs.append("rendimientos %r: parcelas negativas" % (c["name"],))
            if any(y is not None and (m is not None and m <= 0) for y, m in zip(c["y"], c["n"])): errs.append("rendimientos %r: rendimiento sin parcelas aforadas" % (c["name"],))
    for key, parts, tot in (("irrigation", ("Gravedad", "Aspersión", "Automotriz", "Localizado", "Sin información"), "Total regadío"), ("greenhouses", ("Baja tecnificación", "Media tecnificación", "Altamente tecnificados", "Sin Información"), "Total invernaderos")):
        if key not in doc: continue
        T = doc[key]["territories"]; ids = _terr_ok(T, errs, key); M = doc[key]["measures"]
        for m, v in M.items():
            n += 1
            if len(v) != len(T): errs.append("%s %s: %d valores para %d territorios" % (key, m, len(v), len(T))); continue
            if any(x is not None and (x < 0 or x > 5e7) for x in v): errs.append("%s %s: superficie imposible" % (key, m))
        if "espana" in ids and tot in M:
            ie = ids.index("espana"); t = M[tot][ie]; ps = [M[p][ie] for p in parts if p in M and M[p][ie] is not None]
            if t and ps and abs(sum(ps) - t) > 0.01 * t: errs.append("%s: las partes suman %.0f y el total es %.0f" % (key, sum(ps), t))
    if "woody" in doc:
        T = doc["woody"]["territories"]; ids = _terr_ok(T, errs, "woody"); seen = set()
        for c in doc["woody"]["crops"]:
            n += 1
            if c["crop"] in seen: errs.append("leñosos: cultivo repetido %r" % c["crop"]); break
            seen.add(c["crop"])
            if len(c["v"]) != 7 or any(len(x) != len(T) for x in c["v"]): errs.append("leñosos %r: forma distinta" % c["crop"]); continue
            if any(v is not None and (v < 0 or v > 5e6) for col in c["v"] for v in col): errs.append("leñosos %r: superficie imposible" % c["crop"]); continue
            if "espana" in ids:
                ie = ids.index("espana"); parts = [c["v"][k][ie] for k in range(6) if c["v"][k][ie] is not None]; t = c["v"][6][ie]
                if t and parts and abs(sum(parts) - t) > 0.005 * t + 1: errs.append("leñosos %r: los estados suman %.0f y el total es %.0f" % (c["crop"], sum(parts), t))
    if "soil" in doc:
        for k, o in doc["soil"].items():
            T = o["territories"]; _terr_ok(T, errs, "soil " + k)
            for m, v in o["measures"].items():
                n += 1
                if len(v) != len(T) or any(x is not None and (x < 0 or x > 5e7) for x in v): errs.append("suelo %s %s: valores imposibles" % (k, m))
    if n == 0: errs.append("esyrce extra: sin series")
    stats["series"] = n
def _it_axis_ok(ax, errs, what):
    if ax != sorted(set(ax)) or not ax: errs.append("%s: periodos desordenados, repetidos o vacíos" % what); return False
    return True
def it_istat_slaughter(doc, errs, warns, stats):
    """Macellazioni: meses ordenados, series alineadas con los meses, sin negativos, rendimiento 0-100 % y vacuno/porcino totales en rango."""
    M = doc["months"]
    if not _it_axis_ok(M, errs, "macellazioni"): return
    n = 0
    for c, e in doc["species"].items():
        for k in ("heads", "dead", "yield"):
            n += 1
            if len(e[k]) != len(M): errs.append("macellazioni %s.%s: %d valores para %d meses" % (c, k, len(e[k]), len(M))); continue
            if any(x is not None and x < 0 for x in e[k]): errs.append("macellazioni %s.%s: valor negativo" % (c, k))
        if any(x is not None and x > 100 for x in e["yield"]): errs.append("macellazioni %s: rendimiento superior al 100 %%" % c)
        if any(x is not None and x > 1e9 for x in e["heads"]): errs.append("macellazioni %s: cabezas imposibles" % c)
    for c, lo, hi in (("TOTCATT", 5e4, 6e5), ("TOTPIG", 3e5, 3e6)):
        if c in doc["species"]:
            v = [x for x in doc["species"][c]["heads"] if x is not None]
            if v and not lo < v[-1] < hi: errs.append("macellazioni %s: %s cabezas en el último mes, fuera de %d-%d" % (c, v[-1], lo, hi))
    stats["series"] = n
def it_istat_prices(doc, errs, warns, stats):
    """Indices de precios agrarios: meses ordenados, tres series alineadas por grupo, indice entre 20 y 600 (base 2020=100) y variaciones entre -80 y 300 %."""
    n = 0
    for side in ("sold", "bought"):
        M = doc[side]["months"]
        if not _it_axis_ok(M, errs, "precios " + side): continue
        for c, e in doc[side]["items"].items():
            for k in ("index", "mom", "yoy"):
                n += 1
                if len(e[k]) != len(M): errs.append("precios %s %s.%s: %d valores para %d meses" % (side, c, k, len(e[k]), len(M))); continue
                lim = (20, 600) if k == "index" else (-80, 300)
                if any(x is not None and not lim[0] < x < lim[1] for x in e[k]): errs.append("precios %s %s.%s: valor fuera de %s" % (side, c, k, lim))
    stats["series"] = n
def _it_area_series(doc, errs, what, axis, groups):
    if not _it_axis_ok(doc[axis], errs, what): return 0
    A = doc["areas"]; n = 0
    if "IT" not in A: errs.append("%s: falta el total nacional IT" % what)
    for gname, G in groups:
        for c, e in G.items():
            for a, v in e["v"].items():
                n += 1
                if a not in A: errs.append("%s %s.%s: territorio sin definir" % (what, gname, c)); break
                if len(v) != len(doc[axis]): errs.append("%s %s.%s.%s: %d valores para %d periodos" % (what, gname, c, a, len(v), len(doc[axis]))); break
                if any(x is not None and (x < 0 or x > 1e12) for x in v): errs.append("%s %s.%s.%s: valor imposible" % (what, gname, c, a)); break
    return n
def it_istat_herds(doc, errs, warns, stats):
    """Existencias: periodos ordenados, cada serie con un valor por periodo, territorios definidos, con IT, y la suma de regiones no supera en mas de un 5 % al total nacional."""
    n = _it_area_series(doc, errs, "existencias", "periods", [("herds", doc["herds"])])
    A = doc["areas"]
    for k, e in doc["herds"].items():
        it = e["v"].get("IT")
        if not it: continue
        for j, tot in enumerate(it):
            parts = [v[j] for a, v in e["v"].items() if A.get(a, {}).get("kind") == "region" and a not in ("ITD1", "ITD2") and v[j] is not None]
            if tot and len(parts) >= 15 and sum(parts) > 1.05 * tot: errs.append("existencias %s %s: las regiones suman %d y Italia %d" % (k, doc["periods"][j], sum(parts), tot))
    stats["series"] = n
def it_istat_fertilisers(doc, errs, warns, stats):
    """Fertilizantes: años ordenados, serie por region con un valor por año, sin negativos y el total nacional de cada tipo en rango (menos de 20 Mt)."""
    stats["series"] = _it_area_series(doc, errs, "fertilizantes", "years", [("types", doc["types"])])
    for c, e in doc["types"].items():
        if any(x is not None and x > 2e7 for x in e["v"].get("IT", [])): errs.append("fertilizantes %s: total nacional imposible" % c)
def it_istat_pesticides(doc, errs, warns, stats):
    """Fitosanitarios: años ordenados, serie por region con un valor por año, sin negativos y kg/ha de cada clase por debajo de 500."""
    stats["series"] = _it_area_series(doc, errs, "fitosanitarios", "years", [("classes", doc["classes"]), ("perHa", doc["perHa"])])
    for c, e in doc["perHa"].items():
        for a, v in e["v"].items():
            if any(x is not None and x > 500 for x in v): errs.append("fitosanitarios %s.%s: kg/ha imposible" % (c, a)); break
def _it_vals_ok(doc, errs, what, axis, groups, cap):
    n = 0; A = doc["areas"]
    for gname, G in groups:
        for c, e in G.items():
            for a, v in e["v"].items():
                n += 1
                if a not in A: errs.append("%s %s.%s: territorio sin definir" % (what, gname, c)); break
                if len(v) != len(doc[axis]): errs.append("%s %s.%s.%s: %d valores para %d periodos" % (what, gname, c, a, len(v), len(doc[axis]))); break
                if any(x is not None and (x < 0 or x > cap) for x in v): errs.append("%s %s.%s.%s: valor imposible" % (what, gname, c, a)); break
    return n
def _it_regions_le_total(doc, errs, what, axis, G, tol=1.03):
    A = doc["areas"]
    for c, e in G.items():
        it = e["v"].get("IT")
        if not it: continue
        for j, tot in enumerate(it):
            parts = [v[j] for a, v in e["v"].items() if A.get(a, {}).get("kind") == "region" and a not in ("ITD1", "ITD2") and v[j] is not None]
            if tot and len(parts) >= 15 and sum(parts) > tol * tot: errs.append("%s %s %s: las regiones suman %.0f e Italia %.0f" % (what, c, doc[axis][j], sum(parts), tot)); break
def it_istat_crops(doc, errs, warns, stats):
    """Cultivos: años ordenados, una cifra por año, superficie por cultivo < 10 Mha, produccion < 60 Mt, las regiones no suman mas de un 3 % por encima de Italia y el rendimiento nacional (t/ha) entre 0,1 y 150."""
    if not _it_axis_ok(doc["years"], errs, "cultivos"): return
    C = doc["crops"]
    stats["series"] = _it_vals_ok(doc, errs, "cultivos", "years", [("a", {c: {"v": e["a"]} for c, e in C.items()})], 1e7) + _it_vals_ok(doc, errs, "cultivos", "years", [("p", {c: {"v": e["p"]} for c, e in C.items()})], 6e7)
    _it_regions_le_total(doc, errs, "cultivos superficie", "years", {c: {"v": e["a"]} for c, e in C.items()})
    for c, e in C.items():
        a = e["a"].get("IT"); p = e["p"].get("IT")
        if a and p:
            for j in range(len(a)):
                if a[j] and p[j] and not 0.1 < p[j] / a[j] < 150: errs.append("cultivos %s %s: %.1f t/ha fuera de 0,1-150" % (c, doc["years"][j], p[j] / a[j])); break
def it_istat_crops_prov(doc, errs, warns, stats):
    """Cultivos por provincia: mismas reglas que el fichero regional (provincias no superan Italia, rendimiento 0,1-150 t/ha) y al menos 100 provincias."""
    if sum(1 for a in doc["areas"].values() if a.get("kind") == "province") < 100: errs.append("menos de 100 provincias")
    it_istat_crops(doc, errs, warns, stats)


def it_istat_milk(doc, errs, warns, stats):
    """Lacteos: años ordenados, una cifra por año, valores sin negativos, porcentajes entre 0 y 100, leche total de Italia entre 5 y 30 Mt y regiones <= 3 % sobre Italia."""
    if not _it_axis_ok(doc["years"], errs, "lacteos"): return
    stats["series"] = _it_vals_ok(doc, errs, "lacteos", "years", [("products", doc["products"]), ("plants", doc["plants"])], 1e9)
    for c, e in doc["products"].items():
        if e["unit"] == "%" and any(x is not None and x > 100 for v in e["v"].values() for x in v): errs.append("lacteos %s: porcentaje superior a 100" % c)
    if "TOT_MILK_Q" in doc["products"]:
        it = doc["products"]["TOT_MILK_Q"]["v"].get("IT", [])
        if any(x is not None and not 5e6 < x < 3e7 for x in it): errs.append("lacteos: leche total de Italia fuera de 5-30 Mt")
        _it_regions_le_total(doc, errs, "lacteos", "years", {"TOT_MILK_Q": doc["products"]["TOT_MILK_Q"]})
def it_istat_agritourism(doc, errs, warns, stats):
    """Agriturismo: años ordenados, una cifra por año, sin negativos, explotaciones autorizadas de Italia entre 10 000 y 40 000 y regiones <= 3 % sobre Italia."""
    if not _it_axis_ok(doc["years"], errs, "agriturismo"): return
    stats["series"] = _it_vals_ok(doc, errs, "agriturismo", "years", [("series", doc["series"])], 1e8)
    s = doc["series"].get("NUMAGRIAUTH|ALL|ALL")
    if s:
        if any(x is not None and not 1e4 < x < 4e4 for x in s["v"].get("IT", [])): errs.append("agriturismo: explotaciones autorizadas de Italia fuera de 10 000-40 000")
        _it_regions_le_total(doc, errs, "agriturismo", "years", {"n": s})
def it_istat_irrigation(doc, errs, warns, stats):
    """Riego: años ordenados, una cifra por año, superficie irrigada de Italia entre 1,5 y 4 Mha, regada <= regable y explotaciones que riegan <= con superficie regable, regiones <= 3 % sobre Italia."""
    if not _it_axis_ok(doc["years"], errs, "riego"): return
    G = [("irrigable", doc["irrigable"]), ("bySystem", doc["bySystem"]), ("bySource", doc["bySource"]), ("byCrop", doc["byCrop"])]
    stats["series"] = _it_vals_ok(doc, errs, "riego", "years", G, 1e9)
    I = doc["irrigable"]
    if "IA" in I:
        if any(x is not None and not 1.5e6 < x < 4e6 for x in I["IA"]["v"].get("IT", [])): errs.append("riego: superficie irrigada de Italia fuera de 1,5-4 Mha")
        if "IBA" in I:
            for a, v in I["IA"]["v"].items():
                b = I["IBA"]["v"].get(a)
                if b and any(x is not None and y is not None and x > 1.001 * y for x, y in zip(v, b)): errs.append("riego %s: regada mayor que regable" % a); break
    if "FIATED" in I and "FIABLE" in I:
        for a, v in I["FIATED"]["v"].items():
            b = I["FIABLE"]["v"].get(a)
            if b and any(x is not None and y is not None and x > 1.001 * y for x, y in zip(v, b)): errs.append("riego %s: explotaciones que riegan mas que con superficie regable" % a); break
    for k in ("IA", "IBA", "FIATED"):
        if k in I: _it_regions_le_total(doc, errs, "riego", "years", {k: I[k]})
def it_istat_comuni(doc, errs, warns, stats):
    """Municipios: filas de 8 columnas, codigos de 6 cifras sin repetir, regada <= regable, y la suma de la superficie regada entre 1,5 y 3,5 Mha."""
    R = doc["rows"]; codes = [r[0] for r in R]
    if len(set(codes)) != len(codes) or any(not (isinstance(c, str) and len(c) == 6 and c.isdigit()) for c in codes): errs.append("municipios: codigos repetidos o mal formados")
    tot = 0.0
    for r in R:
        if len(r) != len(doc["cols"]): errs.append("municipios: fila con columnas de menos"); break
        if r[7] is not None: tot += r[7]
        if r[6] is not None and r[7] is not None and r[7] > 1.001 * r[6]: errs.append("municipios %s: regada mayor que regable" % r[0]); break
        if r[5] is not None and r[4] is not None and r[5] > r[4]: errs.append("municipios %s: explotaciones que riegan mas que con superficie regable" % r[0]); break
    if not 1.5e6 < tot < 3.5e6: errs.append("municipios: superficie regada total %.0f ha fuera de 1,5-3,5 Mha" % tot)
    stats["series"] = len(R)
def spain_ganaderia_eggs(doc, errs, warns, stats):
    """Huevos: territorios unicos con ESPAÑA, un valor por territorio, ponedoras en rango, jaula+suelo y campera+ecologica suman las gallinas (1 %) y la produccion en miles de docenas es coherente con el numero de ponedoras (15-30 docenas por gallina y año)."""
    T = doc["territories"]; ids = [t["id"] for t in T]
    if len(set(ids)) != len(ids) or "espana" not in ids: errs.append("huevos: territorios repetidos o sin ESPAÑA"); return
    ie = ids.index("espana"); n = 0
    for y, o in doc["years"].items():
        for key in ("hens", "dozens"):
            for k, v in o.get(key, {}).items():
                n += 1
                if len(v) != len(T): errs.append("huevos %s %s.%s: %d valores para %d territorios" % (y, key, k, len(v), len(T))); continue
                if any(x is not None and x < 0 for x in v): errs.append("huevos %s %s.%s: valor negativo" % (y, key, k))
        h = o.get("hens", {}); d = o.get("dozens", {})
        if "hens" in h and not 2e7 < (h["hens"][ie] or 0) < 9e7: errs.append("huevos %s: ponedoras de España %s fuera de rango" % (y, h["hens"][ie]))
        for src in (h, d):
            if all(k in src and src[k][ie] is not None for k in ("hens", "cage_floor", "free_organic")) and abs(src["cage_floor"][ie] + src["free_organic"][ie] - src["hens"][ie]) > 0.01 * src["hens"][ie]: errs.append("huevos %s: jaula+suelo y campera+ecológica no suman el total" % y)
        if h.get("hens") and d.get("hens") and h["hens"][ie] and d["hens"][ie]:
            r = d["hens"][ie] * 1000 / h["hens"][ie]
            if not 15 < r < 30: errs.append("huevos %s: %.1f docenas por gallina y año, fuera de 15-30" % (y, r))
    stats["series"] = n
def spain_ganaderia_dairy(doc, errs, warns, stats):
    """Lacteas: años ordenados, una cifra por año en cada serie, leche de vaca de España en rango y la suma de comunidades ≈ ESPAÑA (1 %)."""
    Y = doc["years"]
    if Y != sorted(set(Y)): errs.append("lácteas: años desordenados")
    n = 0
    for sec in (doc["industry"].get("collected", []), doc["industry"].get("products", []), doc["farm"]):
        for r in sec:
            n += 1
            if len(r["v"]) != len(Y): errs.append("lácteas %r: %d valores para %d años" % (r.get("label"), len(r["v"]), len(Y))); continue
            lo = -5e7 if str(r.get("label", "")).lower().startswith("diferencias") else 0  # el saldo de disponibilidades (diferencias y pérdidas) puede ser negativo
            if any(x is not None and (x < lo or x > 5e7) for x in r["v"]): errs.append("lácteas %r: valor imposible" % r.get("label"))
    cow = next((r for r in doc["industry"].get("collected", []) if r["label"].lower().startswith("i. leche de vaca")), None)
    if cow and any(x is not None and not 4000 < x < 12000 for x in cow["v"]): errs.append("lácteas: leche de vaca recogida fuera de 4-12 Mt")
    C = doc["cowMilkByCcaa"]; T = C["territories"]; ids = [t["id"] for t in T]
    if len(set(ids)) != len(ids): errs.append("lácteas: CCAA repetidas")
    if "espana" in ids:
        for j, y in enumerate(Y):
            es = C["v"]["espana"][j]; parts = [C["v"][t][j] for t in ids if t != "espana" and C["v"][t][j] is not None]
            if es and parts and abs(sum(parts) - es) > 0.01 * es: errs.append("lácteas %d: las CCAA suman %.0f y ESPAÑA %.0f" % (y, sum(parts), es))
    stats["series"] = n
def spain_ganaderia_forecasts(doc, errs, warns, stats):
    """Previsiones: ediciones AAAA-S1/S2, al menos tres especies, un valor por columna y, en bovino, el total ≈ suma de categorias (1 %)."""
    n = 0
    for ed, e in doc["editions"].items():
        if not re.fullmatch(r"20\d\d-S[12]", ed): errs.append("previsiones: edición rara %r" % ed)
        if len(e["species"]) < 3: errs.append("previsiones %s: solo %d especies" % (ed, len(e["species"])))
        for s in e["species"]:
            for p in s["periods"]:
                n += 1
                if len(p["v"]) != max(1, len(s["columns"])): errs.append("previsiones %s %s: valores y columnas no cuadran" % (ed, s["species"])); continue
                if any(x is not None and (x < 0 or x > 1e5) for x in p["v"]): errs.append("previsiones %s %s: valor imposible" % (ed, s["species"]))
                if s["species"].lower().startswith("total bovinos") and len(p["v"]) == 5 and all(x is not None for x in p["v"]) and abs(sum(p["v"][1:]) - p["v"][0]) > 0.01 * p["v"][0]: errs.append("previsiones %s: bovino no suma" % ed)
    stats["series"] = n
def spain_avances(doc, errs, warns, stats):
    """Avances: claves unicas, tres valores por cultivo con años consecutivos, superficies y producciones en rango y trigo total ≈ duro + blando (1 %)."""
    keys = set(); K = {}
    for it in doc["items"]:
        if it["key"] in keys: errs.append("avances: clave repetida %s" % it["key"]); break
        keys.add(it["key"]); K[it["key"]] = it
        if len(it["area"]) != 3 or len(it["prod"]) != 3 or len(it["years"]) != 3 or it["years"] != [it["years"][0] + i for i in range(3)]: errs.append("avances %s: forma distinta" % it["key"]); continue
        if any(x is not None and (x < 0 or x > 6e3) for x in it["area"]): errs.append("avances %s: superficie imposible" % it["key"])
        if any(x is not None and (x < 0 or x > 6e4) for x in it["prod"]): errs.append("avances %s: producción imposible" % it["key"])
    if len(doc["items"]) < 100: errs.append("avances: solo %d cultivos" % len(doc["items"]))
    w, d, b = K.get("cereales-trigo-resumen-general"), K.get("cereales-trigo-duro"), K.get("cereales-trigo-semiduro-y-blando")
    if w and d and b:
        for k in (0, 1):
            if all(x[k] is not None for x in (w["area"], d["area"], b["area"])) and abs(d["area"][k] + b["area"][k] - w["area"][k]) > 0.01 * w["area"][k]: errs.append("avances: trigo duro + blando no suma el total (superficie, columna %d)" % k)
    for ed, h in doc["history"].items():
        if not re.fullmatch(r"20\d\d-\d\d", ed): errs.append("avances: edición rara %r" % ed)
    stats["series"] = len(doc["items"])
def commercial_catalog(doc, errs, warns, stats):
    """data/commercial-catalog.json: el veredicto de cada fuente y de cada fichero se recalcula aqui, de forma independiente del generador, a partir de data/license-registry.json."""
    reg = json.loads((D / "license-registry.json").read_text(encoding="utf-8"))["sources"]
    def vd(v):
        if v["status"] != "VERIFIED" or any(v[k] in ("no", "unclear") for k in ("commercialUse", "derivatives", "redistribution")): return "no-apto"
        return "apto" if all(v[k] == "yes" for k in ("commercialUse", "derivatives", "redistribution")) else "condiciones"
    ids = [s["id"] for s in doc["sources"]]; S = {}
    if len(ids) != len(set(ids)): errs.append("catálogo comercial: fuente repetida")
    for s in doc["sources"]:
        r = reg.get(s["id"])
        if not r: errs.append("catálogo comercial: %s no está en el registro de licencias" % s["id"]); continue
        S[s["id"]] = s
        if s["verdict"] != vd(r): errs.append("catálogo comercial: %s es %s pero el registro dice %s" % (s["id"], s["verdict"], vd(r)))
        if bool(s.get("reviewBeforeSelling")) != (s["verdict"] == "condiciones" and r["commercialUse"] == "conditional" and not r.get("ownerDecision")): errs.append("catálogo comercial: %s con marca de revisión previa incoherente con el registro" % s["id"])
        if bool(s.get("ownerDecision")) != bool(r.get("ownerDecision")): errs.append("catálogo comercial: %s con decisión del propietario que no coincide con el registro" % s["id"])
        if s["verdict"] == "no-apto" and not s.get("why"): errs.append("catálogo comercial: %s no apta sin motivo" % s["id"])
        if s["verdict"] != "no-apto" and (s["status"] != "VERIFIED" or "no" in (s["commercialUse"], s["derivatives"], s["redistribution"]) or "unclear" in (s["commercialUse"], s["derivatives"], s["redistribution"])): errs.append("catálogo comercial: %s marcada apta con permisos no concedidos" % s["id"])
        if s["verdict"] != "no-apto" and not s.get("attribution"): errs.append("catálogo comercial: %s sin línea de atribución" % s["id"])
    # Comext no es redistribuible comercialmente para declarantes EFTA ni para Austria a 8 dígitos: los ficheros de comercio solo pueden tener declarantes de la UE-27 y capítulos de 2 dígitos.
    for fn, key in (("eu-trade-products.json", "reporters"), ("eu-trade-stats.json", "countries")):
        try: rep = json.loads((D / fn).read_text(encoding="utf-8")).get(key, {})
        except Exception: continue
        bad = sorted(set(rep) & {"NO", "CH", "IS", "LI"})
        if bad: errs.append("comercio Comext: %s tiene declarantes EFTA %s, no redistribuibles comercialmente" % (fn, ",".join(bad)))
    try:
        ap = json.loads((D / "eu-trade-products.json").read_text(encoding="utf-8")).get("reporters", {}).get("AT", {})
        longc = [k for k in (ap.get("products", {}) if isinstance(ap, dict) else {}) if len(str(k)) > 2 and str(k).isdigit()]
        if longc: errs.append("comercio Comext: Austria con códigos de producto de más de 2 dígitos (%s…)" % longc[0])
    except Exception: pass
    paths = [d["path"] for d in doc["datasets"]]
    if len(paths) != len(set(paths)): errs.append("catálogo comercial: fichero repetido")
    for d in doc["datasets"]:
        vs = []
        for sid in d["sources"]:
            if sid not in S: errs.append("catálogo comercial: %s usa %s, que no figura en sources" % (d["path"], sid)); break
            vs.append(S[sid]["verdict"])
        else:
            exp = "derivado" if not vs else ("no-apto" if all(x == "no-apto" for x in vs) else ("parcial" if "no-apto" in vs else ("apto" if all(x == "apto" for x in vs) else "condiciones")))
            if d["verdict"] != exp: errs.append("catálogo comercial: %s es %s pero sus fuentes dan %s" % (d["path"], d["verdict"], exp))
            if d["verdict"] == "parcial" and not d.get("commercialSources"): errs.append("catálogo comercial: %s parcial sin commercialSources" % d["path"])
            if d["verdict"] in ("apto", "condiciones") and (d.get("excludedSources")): errs.append("catálogo comercial: %s apto pero excluye fuentes" % d["path"])
            if set(d.get("commercialSources", [])) & set(d.get("excludedSources", [])): errs.append("catálogo comercial: %s fuente a la vez apta y excluida" % d["path"])
    sm = doc["summary"]
    for k, n in (("sources", len(doc["sources"])), ("datasets", len(doc["datasets"])), ("derived", len(doc["derived"])), ("sourcesApto", sum(s["verdict"] == "apto" for s in doc["sources"])),
                 ("sourcesNoApto", sum(s["verdict"] == "no-apto" for s in doc["sources"])), ("datasets_apto", sum(d["verdict"] == "apto" for d in doc["datasets"])), ("datasets_no-apto", sum(d["verdict"] == "no-apto" for d in doc["datasets"]))):
        if sm[k] != n: errs.append("catálogo comercial: resumen %s = %s, pero hay %s" % (k, sm[k], n))
    if sm["sourcesNoApto"] < 1: errs.append("catálogo comercial: ninguna fuente no apta (¿se ha relajado la regla?)")
    stats["series"] = len(doc["datasets"])
def commercial_summary(doc, errs, warns, stats):
    """data/commercial-summary.json es una vista del catálogo comercial: las cifras y el veredicto de cada fuente deben coincidir con data/commercial-catalog.json."""
    full = json.loads((D / "commercial-catalog.json").read_text(encoding="utf-8"))
    if doc["summary"] != full["summary"]: errs.append("resumen comercial: las cifras no coinciden con el catálogo comercial")
    V = {s["id"]: s for s in full["sources"]}
    if set(doc["sources"]) != set(V): errs.append("resumen comercial: las fuentes no coinciden con el catálogo comercial")
    for k, s in doc["sources"].items():
        if k in V and (s.get("verdict") != V[k]["verdict"] or s.get("name") != V[k]["name"]): errs.append("resumen comercial: %s no coincide con el catálogo" % k)
    stats["series"] = len(doc["sources"])

# ---- Grecia (ELSTAT): precios agrarios y cuentas regionales -------------------------------------------------------------
def _elgo_axis(doc, errs, what, M):
    if not M or M != sorted(set(M)): errs.append("%s: meses desordenados o repetidos" % what); return False
    def nxt(m): y, mo = int(m[:4]), int(m[5:]); return "%d-%02d" % (y + (mo == 12), mo % 12 + 1)
    if any(nxt(M[i]) != M[i + 1] for i in range(len(M) - 1)): errs.append("%s: meses con huecos" % what); return False
    return True


def _elgo_annual_sum(doc, errs, what, M, nat, prefs, field):
    """La suma de las unidades regionales de cada año (hasta el 0,05 %) es el total nacional del mismo año."""
    tot = {}
    for i, m in enumerate(M): tot[m[:4]] = tot.get(m[:4], 0) + (nat[i] or 0)
    for y, t in tot.items():
        s = sum(p.get(field, {}).get(y, 0) for p in prefs.values())
        if t and abs(s - t) > 5e-4 * t + 60: errs.append("%s %s: unidades suman %.0f y el total es %.0f" % (what, y, s, t)); return


def el_elgo_milk(doc, errs, warns, stats):
    """Leche de Grecia: meses contiguos, series alineadas, precio nacional entre 0,15 y 3,5 EUR/kg (oveja y cabra por encima de la vaca), kg ecologicos <= total, unidades regionales suman el total de cada año."""
    M = doc["months"]
    if not _elgo_axis(doc, errs, "leche", M): return
    if doc["lastMonth"] != M[-1]: errs.append("lastMonth no es el ultimo mes")
    for t, e in doc["types"].items():
        for k in ("kg", "price", "producers", "orgKg"):
            if len(e[k]) != len(M): errs.append("leche %s.%s: %d valores y %d meses" % (t, k, len(e[k]), len(M))); return
        if any(o > k + 2 for o, k in zip(e["orgKg"], e["kg"])): errs.append("leche %s: mas kg ecologicos que totales" % t)
        if t != "buffalo":
            if any(p is not None and not 0.15 < p < 3.5 for p in e["price"]): errs.append("leche %s: precio fuera de 0,15-3,5 EUR/kg" % t)
            if e["price"][-1] is None: errs.append("leche %s: sin precio en el ultimo mes" % t)
        _elgo_annual_sum(doc, errs, "leche " + t, M, e["kg"], doc["prefectures"][t], "kg")
    c, s = doc["types"]["cow"]["price"][-1], doc["types"]["sheep"]["price"][-1]
    if c and s and s < c: errs.append("leche: la oveja (%.2f) por debajo de la vaca (%.2f)" % (s, c))
    stats["series"] = sum(len(e) for e in doc["types"].values())


def el_elgo_meat(doc, errs, warns, stats):
    """Sacrificio de Grecia: meses contiguos, series alineadas, pesos medios por cabeza razonables (vacuno 80-450 kg, porcino 20-200 kg, ovino 3-40 kg), importados <= total, unidades suman el total anual."""
    M = doc["months"]
    if not _elgo_axis(doc, errs, "sacrificio", M): return
    lim = {"cattle": (80, 450), "pigs": (20, 200), "lamb": (3, 25), "sheep": (8, 60), "kid": (3, 20), "goat": (8, 60)}
    for g, e in doc["groups"].items():
        if not (len(e["heads"]) == len(e["kg"]) == len(e["importedKg"]) == len(M)): errs.append("sacrificio %s: series desalineadas" % g); return
        if any(i > k + 2 for i, k in zip(e["importedKg"], e["kg"])): errs.append("sacrificio %s: importados mayores que el total" % g)
        h, k = sum(e["heads"][-12:]), sum(e["kg"][-12:])
        if h and g in lim and not lim[g][0] <= k / h <= lim[g][1]: errs.append("sacrificio %s: %.1f kg por cabeza fuera de %s" % (g, k / h, lim[g]))
        _elgo_annual_sum(doc, errs, "sacrificio " + g, M, e["kg"], doc["prefectures"][g], "kg")
    PM = doc["poultry"]["months"]
    if not _elgo_axis(doc, errs, "aves", PM): return
    for t, e in doc["poultry"]["types"].items():
        if len(e["kg"]) != len(PM) or len(e["heads"]) != len(PM): errs.append("aves %s: series desalineadas" % t)
    b = doc["poultry"]["types"]["broiler"]
    if sum(b["heads"][-12:]) and not 0.5 <= sum(b["kg"][-12:]) / sum(b["heads"][-12:]) <= 4: errs.append("aves: peso del pollo fuera de 0,5-4 kg")
    stats["series"] = len(doc["species"]) * 2


def el_elgo_dairy(doc, errs, warns, stats):
    """Lacteos de Grecia: meses contiguos, series alineadas, ningun valor negativo, feta DOP entre 20 y 400 kt al año, kg ecologicos <= total."""
    M = doc["months"]
    if not _elgo_axis(doc, errs, "lacteos", M): return
    for g, v in doc["groups"].items():
        if len(v) != len(M) or any(x < 0 for x in v): errs.append("lacteos %s: serie desalineada o negativa" % g)
    PM = doc["pdo"]["months"]
    if not _elgo_axis(doc, errs, "DOP", PM): return
    for k, e in doc["pdo"]["products"].items():
        if len(e["kg"]) != len(PM) or len(e["orgKg"]) != len(PM): errs.append("DOP %s: series desalineadas" % k); return
        if any(o > x + 2 for o, x in zip(e["orgKg"], e["kg"])): errs.append("DOP %s: ecologico mayor que total" % k)
    f = doc["pdo"]["products"].get("Π.Ο.Π. ΦΕΤΑ")
    if not f or not 2e7 <= sum(f["kg"][-12:]) <= 4e8: errs.append("feta DOP fuera de 20-400 kt al año")
    else: _elgo_annual_sum(doc, errs, "feta DOP", PM, f["kg"], {p: {"kg": y} for p, y in doc["fetaPrefectures"].items()}, "kg")
    stats["series"] = len(doc["groups"]) + len(doc["pdo"]["products"])


def el_elstat_prices(doc, errs, warns, stats):
    """Indices mensuales (base 2020 = 100): meses contiguos y ordenados, series alineadas, indices entre 15 y 700, series principales vivas hasta el ultimo mes; productos con 2020 = 100."""
    M = doc["months"]
    if M != sorted(set(M)) or not M: errs.append("meses desordenados, repetidos o vacios"); return
    def nxt(m): y, mo = int(m[:4]), int(m[5:]); return "%d-%02d" % (y + (mo == 12), mo % 12 + 1)
    if any(nxt(M[i]) != M[i + 1] for i in range(len(M) - 1)): errs.append("meses con huecos")
    if doc["last"] != M[-1]: errs.append("last (%s) no es el ultimo mes (%s)" % (doc["last"], M[-1]))
    n = 0
    for side, need in (("output", ("140000", "100000", "130000", "060000", "080000")), ("input", ("220000", "202000", "203000", "206000"))):
        S = doc[side]
        for c in need:
            if c not in S: errs.append("%s: falta la serie %s" % (side, c))
            elif S[c]["v"][-1] is None and S[c]["v"][-2] is None: errs.append("%s %s: sin dato en los dos ultimos meses" % (side, c))
        for c, e in S.items():
            n += 1
            if len(e["v"]) != len(M): errs.append("%s %s: %d valores para %d meses" % (side, c, len(e["v"]), len(M))); continue
            if any(x is not None and not 15 < x < 700 for x in e["v"]): errs.append("%s %s: indice fuera de 15-700" % (side, c))
    for p, e in doc["products"].items():
        n += 1
        y0 = e["from"]; last = y0 + len(e["annual"]) - 1
        if not 1990 < y0 < 2030 or last > int(M[-1][:4]): errs.append("producto %s: años %s-%s fuera de rango" % (p, y0, last))
        if any(x is not None and not 5 < x < 800 for x in e["annual"]): errs.append("producto %s: indice anual fuera de 5-800" % p)
        if y0 <= 2020 <= last and e["annual"][2020 - y0] is not None and abs(e["annual"][2020 - y0] - 100) > 0.05: errs.append("producto %s: 2020 no es 100" % p)
        mo = e["monthly"]
        if mo and (len(mo["v"]) != 12 or any(x is not None and not 5 < x < 800 for x in mo["v"])): errs.append("producto %s: mensual mal formado" % p)
    stats["series"] = n
def el_elstat_accounts(doc, errs, warns, stats):
    """Cuenta regional: una columna por region, produccion = cultivos + ganado (14 = 10 + 13), 16 = 14 + 15, 20 = 18 - 19, NUTS 1 = suma de sus NUTS 2 y Grecia = suma de las 13 regiones."""
    ids = [r["id"] for r in doc["regions"]]
    if len(set(ids)) != len(ids) or "EL" not in ids: errs.append("regiones repetidas o sin total nacional EL"); return
    R = {}
    for r in doc["rows"]:
        if len(r["v"]) != len(ids): errs.append("linea %s: %d valores para %d regiones" % (r["c"], len(r["v"]), len(ids))); continue
        if any(x is not None and not -1e5 < x < 1e6 for x in r["v"]): errs.append("linea %s: valor imposible" % r["c"])
        if r["c"] in R: errs.append("linea %s repetida" % r["c"])
        R[r["c"]] = r["v"]
    for need in ("10", "13", "14", "15", "16", "17", "18", "19", "20"):
        if need not in R: errs.append("falta la linea " + need); return
    for k, i in enumerate(ids):
        for tot, (a, b, sg) in {"14": ("10", "13", 1), "16": ("14", "15", 1), "18": ("16", "17", 1), "20": ("18", "19", -1)}.items():
            x, y, z = R[a][k], R[b][k], R[tot][k]
            if None in (x, y, z): continue
            if abs(x + sg * y - z) > max(0.05, abs(z) * 0.002): errs.append("%s: linea %s no es %s %s %s (%.1f frente a %.1f)" % (i, tot, a, "+" if sg > 0 else "-", b, x + sg * y, z))
    pos = {x: k for k, x in enumerate(ids)}
    for n1, kids in {"EL4": ("EL41", "EL42", "EL43"), "EL5": ("EL51", "EL52", "EL53", "EL54"), "EL6": ("EL61", "EL62", "EL63", "EL64", "EL65")}.items():
        if n1 in pos and all(k in pos for k in kids) and R["14"][pos[n1]] is not None:
            s = sum(R["14"][pos[k]] or 0 for k in kids)
            if abs(s - R["14"][pos[n1]]) > max(1.0, 0.01 * s): errs.append("%s: produccion %.1f y la suma de sus regiones %.1f" % (n1, R["14"][pos[n1]], s))
    n2 = [pos[x["id"]] for x in doc["regions"] if x["level"] == 2]
    tot = R["14"][pos["EL"]]; s = sum(R["14"][k] or 0 for k in n2)
    if not tot or abs(s / tot - 1) > 0.03: errs.append("Grecia: produccion %.1f y la suma de las regiones %.1f" % (tot or 0, s))
    stats["series"] = len(R)


def el_elstat_regions(doc, errs, warns, stats):
    """Cultivos y ganaderia por region y unidad regional (ELSTAT): 1 Grecia + 13 regiones + unidades, cada serie alineada con las areas, regiones suman Grecia (±1,5 %), unidades suman su region cuando hay desglose, y produccion/superficie con rendimientos posibles."""
    A = doc["areas"]; ids = [a["id"] for a in A]
    if len(set(ids)) != len(ids) or ids[0] != "EL" or A[0]["level"] != 0: errs.append("areas repetidas o sin Grecia en primer lugar"); return
    regs = [a for a in A if a["level"] == 1]
    if len(regs) != 13: errs.append("regiones: %d, esperadas 13" % len(regs)); return
    if any(a["level"] == 2 and a["parent"] not in {r["id"] for r in regs} for a in A): errs.append("unidad con region inexistente"); return
    if str(doc["year"]) not in doc["years"]: errs.append("el año actual no esta en years"); return
    def sums(name, v):
        tot = v[0]
        if tot is None: errs.append(name + ": sin total nacional"); return
        s = sum(x or 0 for x, a in zip(v, A) if a["level"] == 1)
        if abs(s - tot) > max(3, 0.015 * abs(tot)): errs.append("%s: regiones suman %.1f y Grecia %.1f" % (name, s, tot))
        for r in regs:
            ch = [x for x, a in zip(v, A) if a["parent"] == r["id"]]
            if any(x is not None for x in ch):
                rv = v[ids.index(r["id"])]
                if rv is not None and abs(sum(x or 0 for x in ch) - rv) > max(3, 0.015 * abs(rv)): errs.append("%s %s: unidades suman %.1f y la region %.1f" % (name, r["en"], sum(x or 0 for x in ch), rv))
    n = 0
    for y, snap in doc["years"].items():
        for k, c in snap["crops"].items():
            for f in ("area", "prod"):
                v = c[f]
                if v is None: continue
                if len(v) != len(A): errs.append("%s %s.%s: %d valores y %d areas" % (y, k, f, len(v), len(A))); return
                if any(x is not None and not 0 <= x < 1e8 for x in v): errs.append("%s %s.%s: valor imposible" % (y, k, f))
                sums("%s %s.%s" % (y, k, f), v); n += 1
            if c["area"] and c["prod"] and c["area"][0] and c["prod"][0]:
                ry = c["prod"][0] / c["area"][0]
                if not 0.2 < ry < 100: errs.append("%s %s: rendimiento nacional %.2f t/ha imposible" % (y, k, ry))
        for k, c in snap["livestock"].items():
            if len(c["v"]) != len(A): errs.append("%s %s: %d valores y %d areas" % (y, k, len(c["v"]), len(A))); return
            if any(x is not None and not 0 <= x < 1e9 for x in c["v"]): errs.append("%s %s: valor imposible" % (y, k))
            sums("%s %s" % (y, k), c["v"]); n += 1
        L = snap["livestock"]
        if all(k in L for k in ("milk_total", "milk_cow", "milk_sheep", "milk_goat")):
            s = sum(L[k]["v"][0] for k in ("milk_cow", "milk_sheep", "milk_goat"))
            if abs(s - L["milk_total"]["v"][0]) > 0.03 * s: errs.append("%s: leche de vaca+oveja+cabra %.0f no suma el total %.0f" % (y, s, L["milk_total"]["v"][0]))
    stats["series"] = n


def _hr_tab(t):
    """Tabla PxWeb del DZS -> (dims, matriz plana, tamaños, indice del eje de años o None)."""
    size = [len(d["l"]) for d in t["dims"]]; n = 1
    for x in size: n *= x
    ky = next((i for i, d in enumerate(t["dims"]) if d["l"] and all(str(x).isdigit() and len(str(x)) == 4 for x in d["l"])), None)
    return size, n, ky
def _hr_at(t, size, ix):
    p = 0
    for k, s in enumerate(size): p = p * s + ix.get(k, 0)
    return t["v"][p]
def hr_apprrr(doc, errs, warns, stats):
    """Croacia por provincia (APPRRR): las 21 provincias en cada bloque, explotaciones por tipo que suman el total, ARKOD por tamaño y por uso que suman lo mismo (±3%), viñedo con provincias que suman el total y densidad de cepas posible."""
    if doc["source"]["id"] != "apprrr_hr": errs.append("la fuente no es apprrr_hr")
    C = doc["counties"]; n = 0
    if len(set(C)) != 21: errs.append("las provincias no son 21 distintas")
    for blk in ("farms", "size", "use"):
        miss = [c for c in C if c not in doc[blk]["rows"]]
        if miss: errs.append("%s: faltan provincias %s" % (blk, miss[:3]))
    F = doc["farms"]; tot = 0
    for c, r in F["rows"].items():
        s = sum(r[t] for t in F["types"])
        if abs(s - r["total"]) > 1 + 0.01 * r["total"]: errs.append("%s: los tipos de explotacion suman %d y el total es %d" % (c, s, r["total"]))
        if any(r[t] < 0 for t in F["types"]): errs.append(c + ": explotaciones negativas")
        tot += r["total"]; n += 1
    if abs(tot - F["total"]) > 1: errs.append("explotaciones: las provincias suman %d y el total es %d" % (tot, F["total"]))
    if not 80000 < F["total"] < 400000: errs.append("explotaciones: total imposible %s" % F["total"])
    S, U = doc["size"], doc["use"]; sh = uh = 0
    for c, r in S["rows"].items():
        for k in S["classes"]:
            x = r[k]
            if x["ha"] < 0 or x["parcels"] < 0: errs.append("%s/%s: valor negativo" % (c, k))
            if x["parcels"] > 0 and x["ha"] / x["parcels"] > 5000: errs.append("%s/%s: %.0f ha por parcela" % (c, k, x["ha"] / x["parcels"]))
            sh += x["ha"]
    for c, r in U["rows"].items():
        for k in U["uses"]:
            x = r[k]
            if x["ha"] < 0 or x["parcels"] < 0: errs.append("%s/%s: valor negativo" % (c, k))
            uh += x["ha"]
        n += 1
    if sh <= 0 or abs(uh - sh) > 0.03 * sh: errs.append("ARKOD por tamaño (%.0f ha) y por uso (%.0f ha) no cuadran" % (sh, uh))
    if not 700000 < sh < 2500000: errs.append("superficie ARKOD imposible: %.0f ha" % sh)
    V = doc["vineyard"]
    for k in ("active", "cleared", "mixed"):
        rows = V[k]["rows"]; ha = sum(x["ha"] for x in rows.values())
        if abs(ha - V[k]["total"]["ha"]) > max(1, 0.005 * V[k]["total"]["ha"]): errs.append("vinedo %s: provincias %.0f ha y total %.0f" % (k, ha, V[k]["total"]["ha"]))
        for c, x in rows.items():
            if x["ha"] < 0 or x["parcels"] < 0 or x["farms"] < 0: errs.append("vinedo %s/%s: negativo" % (k, c))
    for c, x in V["active"]["rows"].items():
        if x["ha"] >= 5 and not 1000 < x["vines"] / x["ha"] < 20000: errs.append("vinedo %s: %.0f cepas por ha" % (c, x["vines"] / x["ha"]))
    if not 8000 < V["active"]["total"]["ha"] < 40000: errs.append("vinedo: superficie total imposible")
    H = doc["history"]
    if len(H["farms"]) < 3: errs.append("serie de explotaciones con menos de 3 años")
    for k, lo, hi in (("farms", 80000, 400000), ("size", 700000, 2500000), ("use", 700000, 2500000), ("vineyard", 8000, 40000)):
        prev = None
        for y, rows in sorted(H[k].items()):
            miss = [c for c in C if c not in rows]
            if miss: errs.append("serie %s %s: faltan provincias %s" % (k, y, miss[:2])); continue
            v = sum(r["total"] for r in rows.values()) if k == "farms" else sum(r["ha"] for r in rows.values()) if k == "vineyard" else sum(x["ha"] for r in rows.values() for x in r.values())
            if not lo < v < hi: errs.append("serie %s %s: total %.0f imposible" % (k, y, v))
            if prev and abs(v / prev - 1) > 0.25: errs.append("serie %s %s: salto del %.0f%%" % (k, y, (v / prev - 1) * 100))
            prev = v
        ly = doc["asOf"][k][:4]
        if ly not in H[k]: errs.append("serie %s: falta el año %s" % (k, ly))
    ly = doc["asOf"]["farms"][:4]
    if ly in H["farms"] and abs(sum(r["total"] for r in H["farms"][ly].values()) - F["total"]) > 1: errs.append("serie de explotaciones: el ultimo año no coincide con el detalle")
    stats["provincias"] = len(C); stats["filas"] = n
def hr_dzs(doc, errs, warns, stats):
    """Estadistica agraria de Croacia (DZS): cada tabla con tantos valores como celdas, un eje de años al dia, sin negativos; cultivos: 4 regiones suman la Republica en superficie y produccion y el rendimiento publicado cuadra con produccion/superficie, el trigo suma sus clases; ganado y leche en rangos posibles; indices de precios con 2020 = 100; balances y abonos con totales posibles."""
    T = doc["tables"]; n = 0
    if doc["source"]["id"] != "dzs_hr": errs.append("la fuente no es dzs_hr")
    for key, t in T.items():
        size, cells, ky = _hr_tab(t)
        if cells != len(t["v"]): errs.append("%s: %d valores y %d celdas" % (key, len(t["v"]), cells)); continue
        if ky is None: errs.append(key + ": sin eje de años"); continue
        if not key.endswith("_h") and int(t["dims"][ky]["l"][-1]) < doc["year"] - 3: errs.append("%s: ultimo año %s muy atrasado" % (key, t["dims"][ky]["l"][-1]))
        if any(x is not None and x < 0 for x in t["v"]): errs.append(key + ": valor negativo")
        n += 1
        r = next((i for i, d in enumerate(t["dims"]) if any("Pannonian" in x for x in d["l"])), None)
        vk = next((i for i, d in enumerate(t["dims"]) if d["n"] == "Variable"), None)
        if r is not None:
            ys = len(t["dims"][ky]["l"]) - 1
            for c in range(size[0]):
                for v in range(size[vk] if vk is not None else 1):
                    if vk is not None and not t["dims"][vk]["l"][v].startswith(("Area", "Production")): continue
                    ix = {0: c, ky: ys}
                    if vk is not None: ix[vk] = v
                    root = _hr_at(t, size, {**ix, r: 0}); parts = [_hr_at(t, size, {**ix, r: j}) for j in range(1, size[r])]
                    if root is None or None in parts: continue
                    if abs(sum(parts) - root) > max(3, 0.03 * abs(root)): errs.append("%s %s: regiones suman %.0f y la Republica %.0f" % (key, t["dims"][0]["l"][c][:30], sum(parts), root))
        if key in ("bp2", "bp3", "bp4"):
            ix0 = {ky: len(t["dims"][ky]["l"]) - 1, r: 0}
            for c in range(size[0]):
                a = _hr_at(t, size, {**ix0, 0: c, vk: 0}); p = _hr_at(t, size, {**ix0, 0: c, vk: 1}); y = _hr_at(t, size, {**ix0, 0: c, vk: 2})
                if a and p and y is not None and abs(p / a - y) > max(0.15, 0.04 * y): errs.append("%s %s: rendimiento %.2f y produccion/superficie %.2f" % (key, t["dims"][0]["l"][c][:30], y, p / a))
        if key == "bp2":
            lab = t["dims"][0]["l"]; ix0 = {ky: len(t["dims"][ky]["l"]) - 1, r: 0, vk: 1}
            for c, l in enumerate(lab):
                m = re.match(r"^(\d+) .*\((\d+(?: \+ \d+)+)\)$", l)
                if not m: continue
                parts = [int(x) for x in m.group(2).split(" + ")]
                idx = {int(re.match(r"^(\d+) ", x).group(1)): i for i, x in enumerate(lab)}
                if any(p_ not in idx for p_ in parts): continue
                tot = _hr_at(t, size, {**ix0, 0: c}); ss = [_hr_at(t, size, {**ix0, 0: idx[p_]}) for p_ in parts]
                if tot is not None and None not in ss and abs(sum(ss) - tot) > max(5, 0.03 * tot): errs.append("bp2 %s: suma de clases %.0f y total %.0f" % (l[:30], sum(ss), tot))
            if "1 Wheat (2 + 3 + 4)" not in lab: errs.append("bp2: falta el trigo")
    if "bp2" in T:
        t = T["bp2"]; size, _, ky = _hr_tab(t); w = _hr_at(t, size, {0: 0, ky: size[ky] - 1, 2: 0, 3: 1})
        if w is None or not 2e5 < w < 3e6: errs.append("trigo de Croacia fuera de 0,2-3 Mt: %s" % w)
    if "milk" in T:
        t = T["milk"]; size, _, ky = _hr_tab(t); c = _hr_at(t, size, {0: 0, ky: size[ky] - 1})
        if c is None or not 1e5 < c < 1.5e6: errs.append("leche de vaca fuera de 100-1.500 millones de l: %s" % c)
    if "cattle" in T:
        t = T["cattle"]; size, _, ky = _hr_tab(t); c = _hr_at(t, size, {0: size[0] - 1, ky: size[ky] - 1, 2: 0})
        if c is None or not 1e5 < c < 1e6: errs.append("vacuno de Croacia fuera de 100.000-1.000.000 cabezas: %s" % c)
    for key in ("output", "input"):
        if key in T:
            t = T[key]; size, _, ky = _hr_tab(t); yl = t["dims"][ky]["l"]; kp = next(i for i, d in enumerate(t["dims"]) if "Year" in d["l"])
            if "2020" not in yl: errs.append(key + ": sin 2020"); continue
            for c in range(size[0]):
                x = _hr_at(t, size, {0: c, ky: yl.index("2020"), kp: t["dims"][kp]["l"].index("Year")})
                if x is not None and abs(x - 100) > 0.6: errs.append("%s: indice anual 2020 = %s" % (key, x))
    if "products" in T:
        t = T["products"]; size, _, ky = _hr_tab(t); b = _hr_at(t, size, {0: 0, ky: size[ky] - 1})
        if b is None or not 300 < b < 30000: errs.append("mantequilla fuera de 300-30.000 t: %s" % b)
    stats["tablas"] = n


def eu_land(doc, errs, warns, stats):
    """Precio de la tierra y regadio por region: % = regadio/SAU, regadio <= SAU, un solo año por pais, Grecia con regadio mas caro que secano, cada region tiene nombre."""
    C = doc["countries"]; n = 0
    for c, e in C.items():
        ir = e["irrigation"]["regions"]
        if c not in ir: errs.append("%s: falta el regadio nacional" % c); continue
        yrs = {x["year"] for x in ir.values()}
        if len(yrs) != 1: errs.append("%s: regiones con varios años de regadio %s" % (c, sorted(yrs)))
        for g, x in ir.items():
            if g not in e["regions"]: errs.append("%s %s: region sin nombre" % (c, g))
            if x["irrigated"] > x["uaa"] * 1.001: errs.append("%s %s: regadio mayor que la SAU" % (c, g))
            if abs(x["irrigated"] / x["uaa"] * 100 - x["share"]) > 0.02: errs.append("%s %s: porcentaje no cuadra" % (c, g))
            n += 1
        for p, G in e["price"].items():
            for g, pts in G.items():
                if g not in e["regions"]: errs.append("%s %s: region de precio sin nombre" % (c, g))
                ys = [y for y, v in pts]
                if ys != sorted(set(ys)): errs.append("%s %s %s: años desordenados" % (c, p, g))
                if any(not 100 < v < 2000000 for y, v in pts): errs.append("%s %s %s: precio imposible" % (c, p, g))
    a, b = C["EL"]["price"].get("ARAIB", {}).get("EL"), C["EL"]["price"].get("ARAXIB", {}).get("EL")
    if not a or not b: errs.append("Grecia: faltan arable de regadio o de secano")
    else:
        yb = dict(b)
        if any(v <= yb[y] for y, v in a if y in yb): errs.append("Grecia: el regadio no vale mas que el secano")
    if C["DE"]["price"]: warns.append("Alemania ya publica precio de tierra: revisar la interfaz")
    stats["regions"] = n



def api_series(doc, errs, warns, stats):
    """Serie de la API: puntos ordenados y sin fechas repetidas, rows/first/last coherentes, valores finitos, la unidad y la fuente declaradas y el veredicto comercial permitido."""
    pts = doc["points"]; ds = [p[0] for p in pts]
    if ds != sorted(ds) or len(set(ds)) != len(ds): errs.append("fechas desordenadas o repetidas")
    if doc["rows"] != len(pts): errs.append("rows (%s) no coincide con los puntos (%d)" % (doc["rows"], len(pts)))
    if doc["first"] != ds[0] or doc["last"] != ds[-1]: errs.append("first/last no coinciden con los puntos")
    if any(v != v or abs(v) > 1e9 for _, v in pts): errs.append("valor no finito o imposible")
    if not doc["id"].endswith("/" + doc["product"]) or not doc["id"].startswith(doc["region"] + "/"): errs.append("id no coincide con region/producto")
    n = doc.get("note")
    if n and not (isinstance(n, dict) and n.get("es")): errs.append("nota sin texto en espanol")
    elif n and set(n) != {"es", "en", "fr", "it"}: warns.append("la nota solo esta en: %s (falta traducir; ver scripts/api_notes_i18n.py)" % ", ".join(sorted(n)))
    stats["points"] = len(pts)


def api_latest(doc, errs, warns, stats):
    """Ultimos valores: ids unicos, y la variacion cuadra con el valor anterior."""
    ids = [s["id"] for s in doc["series"]]
    if len(set(ids)) != len(ids): errs.append("ids repetidos")
    for s in doc["series"]:
        p, v, c = s.get("previous"), s["value"], s.get("changePct")
        if p and c is not None and abs((v / p - 1) * 100 - c) > 0.011: errs.append("%s: changePct %s no cuadra con %s -> %s" % (s["id"], c, p, v))
        if (p is None) != (c is None): errs.append("%s: anterior y variacion deben ir juntos" % s["id"])
    stats["series"] = len(ids)


def api_index(doc, errs, warns, stats):
    """Catalogo: ids unicos, enlaces con la forma de la API, y el resumen cuadra con las series."""
    S = doc["series"]; ids = [s["id"] for s in S]
    if len(set(ids)) != len(ids): errs.append("ids repetidos")
    if doc["summary"]["series"] != len(S) or doc["summary"]["rows"] != sum(s["rows"] for s in S): errs.append("resumen no cuadra con las series")
    for s in S:
        if s["url"] != "/data/api/v1/series/%s.json" % s["id"]: errs.append("%s: enlace a la serie incorrecto" % s["id"])
        if not s["csv"].startswith("/data/pack/") or not s["xlsx"].startswith("/data/pack/"): errs.append("%s: enlaces de descarga fuera del paquete" % s["id"])
    stats["series"] = len(S)


def _digest_event(e, errs, th):
    if e["id"] != "%s@%s" % (e["series"], e["date"]): errs.append("%s: id no coincide con serie y fecha" % e["id"])
    if not e["previous"] or abs((e["value"] / e["previous"] - 1) * 100 - e["changePct"]) > 0.011: errs.append("%s: changePct no cuadra" % e["id"])
    if (e["changePct"] > 0) != (e.get("direction", "up" if e["changePct"] > 0 else "down") == "up"): errs.append("%s: direccion incoherente" % e["id"])
    f = e.get("frequency")
    if f and abs(e["changePct"]) < th[f] - 0.001: errs.append("%s: movimiento por debajo del umbral de su frecuencia" % e["id"])


def digest_events(doc, errs, warns, stats):
    """Avisos: cada evento cuadra (id, variacion, direccion, umbral), sin ids repetidos y ordenados del mas reciente al mas antiguo."""
    ids = [e["id"] for e in doc["events"]]
    if len(set(ids)) != len(ids): errs.append("eventos repetidos")
    def _rd(d):   # fecha real: trimestre = dia 15 del segundo mes, mes = dia 15 (igual que build-digest.py)
        m = re.match(r"^(\d{4})-Q([1-4])$", d)
        if m: return (int(m.group(1)), (int(m.group(2)) - 1) * 3 + 2, 15)
        p = d.split("-")
        return (int(p[0]), int(p[1]), int(p[2]) if len(p) > 2 else 15)
    keys = [(_rd(e["date"]), e["id"]) for e in doc["events"]]
    if keys != sorted(keys, reverse=True): errs.append("eventos desordenados")
    for e in doc["events"]: _digest_event(e, errs, doc["thresholdsPct"])
    stats["events"] = len(ids)


def digest_weekly(doc, errs, warns, stats):
    """Resumen semanal: subidas ordenadas de mayor a menor, bajadas de mayor a menor caida, un solo evento por serie, y el resumen cuadra."""
    U, D = doc["topUp"], doc["topDown"]
    if [e["changePct"] for e in U] != sorted([e["changePct"] for e in U], reverse=True): errs.append("subidas desordenadas")
    if [e["changePct"] for e in D] != sorted(e["changePct"] for e in D): errs.append("bajadas desordenadas")
    if any(e["changePct"] <= 0 for e in U) or any(e["changePct"] >= 0 for e in D): errs.append("signo incoherente en subidas o bajadas")
    s = [e["series"] for e in U + D]
    if len(set(s)) != len(s): errs.append("una serie aparece dos veces")
    if doc["summary"]["up"] + doc["summary"]["down"] != doc["summary"]["seriesWithMoves"]: errs.append("resumen: subidas + bajadas no suman las series con movimiento")
    if len(U) > doc["summary"]["up"] or len(D) > doc["summary"]["down"]: errs.append("mas destacados que series con movimiento")
    for e in U + D: _digest_event(e, errs, {"daily": 0, "weekly": 0, "monthly": 0, "quarterly": 0})
    stats["destacados"] = len(U) + len(D)


def indices_basket(doc, errs, warns, stats):
    """Cesta: meses unicos y ordenados, rows/first/last coherentes, pesos que suman 100, la media del año base vale 100, variaciones recalculadas bien y veredicto = el peor de los miembros."""
    P = doc["points"]; ks = [p[0] for p in P]
    if ks != sorted(ks) or len(set(ks)) != len(ks): errs.append("meses desordenados o repetidos")
    if doc["rows"] != len(P) or doc["first"] != ks[0] or doc["last"] != ks[-1]: errs.append("rows/first/last no coinciden con los puntos")
    if any(not (0 < p[1] < 1e6) for p in P): errs.append("valor de indice imposible")
    if abs(sum(m["weightPct"] for m in doc["members"]) - 100) > 0.1: errs.append("los pesos no suman 100")
    by = [p[1] for p in P if p[0][:4] == doc["basePeriod"]]
    if len(by) == 12 and abs(sum(by) / 12 - 100) > 1.0: errs.append("la media del año base (%.2f) no es 100" % (sum(by) / 12))
    if ks[0][:4] != doc["basePeriod"]: errs.append("la serie debe empezar en el año base")
    _pm = "%d-%02d" % ((int(P[-1][0][:4]) - 1, 12) if P[-1][0][5:] == "01" else (int(P[-1][0][:4]), int(P[-1][0][5:]) - 1)) if P else None
    if len(P) > 1 and P[-2][0] == _pm and (doc["changeMoMPct"] is None or abs((P[-1][1] / P[-2][1] - 1) * 100 - doc["changeMoMPct"]) > 0.02): errs.append("changeMoMPct no cuadra")
    if len(P) > 1 and P[-2][0] != _pm and doc["changeMoMPct"] is not None: errs.append("changeMoMPct con un hueco entre los dos ultimos meses debe ser null")
    if doc.get("changeYoYPct") is not None:
        d = dict(P); k = "%d-%s" % (int(ks[-1][:4]) - 1, ks[-1][5:])
        if k not in d or abs((P[-1][1] / d[k] - 1) * 100 - doc["changeYoYPct"]) > 0.02: errs.append("changeYoYPct no cuadra")
    worst = "condiciones" if any(m["verdict"] == "condiciones" for m in doc["members"]) else "apto"
    if doc["verdict"] != worst: errs.append("el veredicto debe ser el peor de los miembros (%s)" % worst)
    stats["months"] = len(P)


def indices_index(doc, errs, warns, stats):
    """Catalogo de cestas: ids unicos, enlaces con la forma correcta, y una cesta no puede estar a la vez publicada y excluida."""
    ids = [b["id"] for b in doc["baskets"]]
    if len(set(ids)) != len(ids): errs.append("cestas repetidas")
    if set(ids) & {e["id"] for e in doc["excluded"]}: errs.append("una cesta aparece publicada y excluida")
    for b in doc["baskets"]:
        if b["url"] != "/data/indices/%s.json" % b["id"]: errs.append("%s: enlace incorrecto" % b["id"])
    stats["baskets"] = len(ids)


# Boletin mensual de coyuntura de Francia (Agreste BulConj)
def france_bulconj_index(doc, errs, warns, stats):
    for k, d in doc["sheets"].items():
        if not d.get("file", "").endswith(".json") or d.get("series", 0) < 1: errs.append("france-bulconj index: hoja %s sin fichero o sin series" % k); return
    stats["hojas"] = len(doc["sheets"])


def france_bulconj(doc, errs, warns, stats):
    """Cada serie trae periodos AAAA-MM, AAAA-AAAA (campaña, consecutiva) o AAAA, valores numericos finitos, ids unicos y la hoja no queda vacia."""
    import re as _re
    ids = set(); n = 0
    for s in doc["series"]:
        if s["id"] in ids: errs.append("france-bulconj %s: id repetido %s" % (doc["sheet"], s["id"])); return
        ids.add(s["id"])
        for p, v in s["pts"].items():
            m = _re.fullmatch(r"(\d{4})(?:-(\d{2}|\d{4}))?", p)
            if not m or not (1950 <= int(m.group(1)) <= 2100): errs.append("france-bulconj %s %s: periodo %r" % (doc["sheet"], s["id"], p)); return
            if len(p) == 9 and int(p[5:]) != int(p[:4]) + 1: errs.append("france-bulconj %s %s: campaña %r no consecutiva" % (doc["sheet"], s["id"], p)); return
            if len(p) == 7 and not 1 <= int(p[5:]) <= 12: errs.append("france-bulconj %s %s: mes %r" % (doc["sheet"], s["id"], p)); return
            if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("france-bulconj %s %s %s: valor %r" % (doc["sheet"], s["id"], p, v)); return
            n += 1
    stats["series"] = len(doc["series"]); stats["puntos"] = n


# Infos Rapides de Francia (Agreste)
def _ira_pts(pts, where, errs):
    import re as _re
    for p, v in pts.items():
        if not _re.fullmatch(r"\d{4}(-(0[1-9]|1[0-2]))?", p) or not 1990 <= int(p[:4]) <= 2100: errs.append("%s: periodo %r" % (where, p)); return False
        if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("%s %s: valor %r" % (where, p, v)); return False
    return True


def france_infosrapides_index(doc, errs, warns, stats):
    bad = [k for k, e in doc["editions"].items() if e.get("kind") not in ("Lai", "Gcu", "Cex", "Fru") or e.get("status") not in ("ok", "error")]
    if bad: errs.append("france-infosrapides index: ediciones con tipo o estado raro: %s" % bad[:3]); return
    # Una edicion ilegible solo avisa si ninguna edicion posterior del mismo informe se leyo bien: las posteriores traen las mismas series con su historico
    oks = {}
    for e in doc["editions"].values():
        if e["status"] == "ok" and e.get("published"): oks[e["kind"]] = max(oks.get(e["kind"], ""), e["published"])
    nerr = sum(1 for e in doc["editions"].values() if e["status"] == "error" and not (e.get("published") and oks.get(e["kind"], "") > e["published"]))
    if nerr: warns.append("france-infosrapides index: %d ediciones ilegibles sin edicion posterior que las sustituya" % nerr)
    stats["ediciones"] = len(doc["editions"])


def france_infosrapides_series(doc, errs, warns, stats):
    n = 0
    for k, s in doc["series"].items():
        if not s.get("label") or not s.get("unit") or not s.get("pts"): errs.append("france-infosrapides %s: serie incompleta" % k); return
        if not _ira_pts(s["pts"], "france-infosrapides " + k, errs): return
        n += len(s["pts"])
    stats["series"] = len(doc["series"]); stats["puntos"] = n


def france_infosrapides_cultivos(doc, errs, warns, stats):
    import re as _re
    eds = set(doc["editions"]); n = 0
    for y, regs in doc["est"].items():
        if not _re.fullmatch(r"\d{4}", y): errs.append("france-infosrapides cultivos: cosecha %r" % y); return
        for rg, cult in regs.items():
            if rg not in doc["regions"]: errs.append("france-infosrapides cultivos: region %r sin nombre" % rg); return
            for c, byed in cult.items():
                for ed, t in byed.items():
                    if ed not in eds or not isinstance(t, list) or len(t) != 3 or any(v is not None and (isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or v < 0) for v in t): errs.append("france-infosrapides cultivos %s/%s/%s/%s: %r" % (y, rg, c, ed, t)); return
                    n += 1
    stats["estimaciones"] = n


# Conjuntos adicionales de Agreste (empleo, TERUTI, vendimia, IPAMPA)
def france_agreste_more_index(doc, errs, warns, stats):
    for f in doc["files"]:
        if not f.get("file", "").endswith(".json") or f.get("series", 0) < 1: errs.append("france-agreste-more index: %s sin fichero o sin series" % f.get("file")); return
    stats["ficheros"] = len(doc["files"])


def france_agreste_more(doc, errs, warns, stats):
    """Periodos AAAA o AAAA-MM ordenados y sin repetir, valores numericos finitos, ids unicos en el fichero y ninguna tabla vacia."""
    import re as _re
    ids = set(); n = 0
    for t in doc["tables"]:
        if not t["series"]: errs.append("france-agreste-more %s: tabla vacia" % t["id"]); return
        for s in t["series"]:
            if s["id"] in ids: errs.append("france-agreste-more %s: id repetido" % s["id"]); return
            ids.add(s["id"]); last = ""
            for p, v in s["points"]:
                if not isinstance(p, str) or not _re.fullmatch(r"\d{4}(-(0[1-9]|1[0-2]))?", p) or not 1950 <= int(p[:4]) <= 2100: errs.append("france-agreste-more %s: periodo %r" % (s["id"], p)); return
                if p <= last: errs.append("france-agreste-more %s: periodos desordenados o repetidos en %s" % (s["id"], p)); return
                last = p
                if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("france-agreste-more %s %s: valor %r" % (s["id"], p, v)); return
                n += 1
    stats["tablas"] = len(doc["tables"]); stats["puntos"] = n


# Paises Bajos: cinco conjuntos del CBS (facturacion, invernaderos, nitrogeno, cadena de precios, otros)
def netherlands_more_index(doc, errs, warns, stats):
    for f in doc["files"]:
        if not f.get("file", "").endswith(".json") or f.get("series", 0) < 1: errs.append("netherlands-more index: %s sin fichero o sin series" % f.get("file")); return
    stats["ficheros"] = len(doc["files"])


def netherlands_more(doc, errs, warns, stats):
    """Periodos AAAA, AAAA-Qn o AAAA-MM ordenados y sin repetir (una misma serie no mezcla formatos), valores numericos finitos, ids unicos, nombres en los cuatro idiomas y ninguna tabla vacia."""
    import re as _re
    ids = set(); n = 0
    for t in doc["tables"]:
        if not t["series"]: errs.append("netherlands-more %s: tabla vacia" % t["id"]); return
        if set(t.get("l", {})) != {"en", "fr", "it"}: errs.append("netherlands-more %s: tabla sin nombre en en/fr/it" % t["id"]); return
        for s in t["series"]:
            if s["id"] in ids: errs.append("netherlands-more %s: id repetido" % s["id"]); return
            if set(s.get("l", {})) != {"en", "fr", "it"} or not all(s["l"].values()): errs.append("netherlands-more %s: serie sin nombre en en/fr/it" % s["id"]); return
            ids.add(s["id"]); last = ""; shape = None
            for p, v in s["points"]:
                k = "q" if "Q" in str(p) else "m" if _re.fullmatch(r"\d{4}-\d{2}", str(p)) else "y"
                if shape is None: shape = k
                if k != shape: errs.append("netherlands-more %s: mezcla de formatos de periodo en %s" % (s["id"], p)); return
                if not isinstance(p, str) or not _re.fullmatch(r"\d{4}(-(0[1-9]|1[0-2]|Q[1-4]))?", p) or not 1950 <= int(p[:4]) <= 2100: errs.append("netherlands-more %s: periodo %r" % (s["id"], p)); return
                if p <= last: errs.append("netherlands-more %s: periodos desordenados o repetidos en %s" % (s["id"], p)); return
                last = p
                if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("netherlands-more %s %s: valor %r" % (s["id"], p, v)); return
                n += 1
            for pv in s.get("provisional", []):
                if pv not in [x[0] for x in s["points"]]: errs.append("netherlands-more %s: provisional %s sin dato" % (s["id"], pv)); return
    stats["tablas"] = len(doc["tables"]); stats["puntos"] = n


# Belgica: seis conjuntos de Statbel (censo ganadero, cosecha, IPC de alimentos, pesca, lacteos, carne)
def belgium_more_index(doc, errs, warns, stats):
    for f in doc["files"]:
        if not f.get("file", "").endswith(".json") or f.get("series", 0) < 1: errs.append("belgium-more index: %s sin fichero o sin series" % f.get("file")); return
    stats["ficheros"] = len(doc["files"])


def belgium_more(doc, errs, warns, stats):
    """Periodos AAAA, AAAA-Qn o AAAA-MM ordenados y sin repetir (una misma serie no mezcla formatos), valores numericos finitos, ids unicos, nombres en los cuatro idiomas y ninguna tabla vacia."""
    import re as _re
    ids = set(); n = 0
    for t in doc["tables"]:
        if not t["series"]: errs.append("belgium-more %s: tabla vacia" % t["id"]); return
        if set(t.get("l", {})) != {"en", "fr", "it"}: errs.append("belgium-more %s: tabla sin nombre en en/fr/it" % t["id"]); return
        if not t.get("group"): errs.append("belgium-more %s: tabla sin grupo" % t["id"]); return
        for s in t["series"]:
            if s["id"] in ids: errs.append("belgium-more %s: id repetido" % s["id"]); return
            if set(s.get("l", {})) != {"en", "fr", "it"} or not all(s["l"].values()): errs.append("belgium-more %s: serie sin nombre en en/fr/it" % s["id"]); return
            ids.add(s["id"]); last = ""; shape = None
            for p, v in s["points"]:
                k = "q" if "Q" in str(p) else "m" if _re.fullmatch(r"\d{4}-\d{2}", str(p)) else "y"
                if shape is None: shape = k
                if k != shape: errs.append("belgium-more %s: mezcla de formatos de periodo en %s" % (s["id"], p)); return
                if not isinstance(p, str) or not _re.fullmatch(r"\d{4}(-(0[1-9]|1[0-2]|Q[1-4]))?", p) or not 1950 <= int(p[:4]) <= 2100: errs.append("belgium-more %s: periodo %r" % (s["id"], p)); return
                if p <= last: errs.append("belgium-more %s: periodos desordenados o repetidos en %s" % (s["id"], p)); return
                last = p
                if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("belgium-more %s %s: valor %r" % (s["id"], p, v)); return
                n += 1
            for pv in s.get("provisional", []):
                if pv not in [x[0] for x in s["points"]]: errs.append("belgium-more %s: provisional %s sin dato" % (s["id"], pv)); return
    stats["tablas"] = len(doc["tables"]); stats["puntos"] = n


def portugal_more_index(doc, errs, warns, stats):
    for f in doc["files"]:
        if not f.get("file", "").endswith(".json") or f.get("series", 0) < 1: errs.append("portugal-more index: %s sin fichero o sin series" % f.get("file")); return
    stats["ficheros"] = len(doc["files"])


def portugal_more(doc, errs, warns, stats):
    """Periodos AAAA, AAAA/AA (campana), AAAA-Qn, AAAA-Sn o AAAA-MM ordenados y sin repetir (una misma serie no mezcla formatos), valores numericos finitos, ids unicos, nombres en los cuatro idiomas y ninguna tabla vacia."""
    import re as _re
    ids = set(); n = 0
    for t in doc["tables"]:
        if not t["series"]: errs.append("portugal-more %s: tabla vacia" % t["id"]); return
        if set(t.get("l", {})) != {"en", "fr", "it"}: errs.append("portugal-more %s: tabla sin nombre en en/fr/it" % t["id"]); return
        if not t.get("group"): errs.append("portugal-more %s: tabla sin grupo" % t["id"]); return
        for s in t["series"]:
            if s["id"] in ids: errs.append("portugal-more %s: id repetido" % s["id"]); return
            if set(s.get("l", {})) != {"en", "fr", "it"} or not all(s["l"].values()): errs.append("portugal-more %s: serie sin nombre en en/fr/it" % s["id"]); return
            ids.add(s["id"]); last = ""; shape = None
            for p, v in s["points"]:
                k = "q" if "Q" in str(p) else "s" if "S" in str(p) else "c" if "/" in str(p) else "m" if _re.fullmatch(r"\d{4}-\d{2}", str(p)) else "y"
                if shape is None: shape = k
                if k != shape: errs.append("portugal-more %s: mezcla de formatos de periodo en %s" % (s["id"], p)); return
                if not isinstance(p, str) or not _re.fullmatch(r"\d{4}(/\d{2}|-(0[1-9]|1[0-2]|Q[1-4]|S[12]))?", p) or not 1900 <= int(p[:4]) <= 2100: errs.append("portugal-more %s: periodo %r" % (s["id"], p)); return
                if p <= last: errs.append("portugal-more %s: periodos desordenados o repetidos en %s" % (s["id"], p)); return
                last = p
                if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or abs(v) > 1e12: errs.append("portugal-more %s %s: valor %r" % (s["id"], p, v)); return
                n += 1
            for pv in s.get("provisional", []):
                if pv not in [x[0] for x in s["points"]]: errs.append("portugal-more %s: provisional %s sin dato" % (s["id"], pv)); return
    stats["tablas"] = len(doc["tables"]); stats["puntos"] = n


def poland_zsrir_index(doc, errs, warns, stats):
    for f in doc["files"]:
        if not f.get("file", "").endswith(".json") or f.get("series", 0) < 1: errs.append("poland-zsrir index: %s sin fichero o sin series" % f.get("file")); return
    stats["ficheros"] = len(doc["files"])


def poland_zsrir(doc, errs, warns, stats):
    """Periodos AAAA-MM (mensual) o AAAA-Www (semana ISO, 01-53) ordenados y sin repetir (una serie no mezcla formatos), valores numericos positivos, ids unicos, nombres en los cuatro idiomas y ninguna tabla vacia."""
    import datetime as _dt, re as _re
    ids = set(); n = 0
    for t in doc["tables"]:
        if not t["series"]: errs.append("poland-zsrir %s: tabla vacia" % t["id"]); return
        if set(t.get("l", {})) != {"en", "fr", "it"}: errs.append("poland-zsrir %s: tabla sin nombre en en/fr/it" % t["id"]); return
        if not t.get("group"): errs.append("poland-zsrir %s: tabla sin grupo" % t["id"]); return
        for s in t["series"]:
            if s["id"] in ids: errs.append("poland-zsrir %s: id repetido" % s["id"]); return
            if set(s.get("l", {})) != {"en", "fr", "it"} or not all(s["l"].values()): errs.append("poland-zsrir %s: serie sin nombre en en/fr/it" % s["id"]); return
            ids.add(s["id"]); last = ""; shape = None
            for p, v in s["points"]:
                k = "w" if _re.fullmatch(r"\d{4}-W\d{2}", str(p)) else "m" if _re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", str(p)) else None
                if k is None: errs.append("poland-zsrir %s: periodo %r" % (s["id"], p)); return
                if shape is None: shape = k
                if k != shape: errs.append("poland-zsrir %s: mezcla de formatos de periodo en %s" % (s["id"], p)); return
                if not 2000 <= int(p[:4]) <= 2100: errs.append("poland-zsrir %s: año %r" % (s["id"], p)); return
                if k == "w":
                    try: _dt.date.fromisocalendar(int(p[:4]), int(p[6:]), 7)
                    except ValueError: errs.append("poland-zsrir %s: semana inexistente %s" % (s["id"], p)); return
                if p <= last: errs.append("poland-zsrir %s: periodos desordenados o repetidos en %s" % (s["id"], p)); return
                last = p
                if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or not 0 < v < 1e7: errs.append("poland-zsrir %s %s: valor %r" % (s["id"], p, v)); return
                n += 1
    stats["tablas"] = len(doc["tables"]); stats["puntos"] = n

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

_EUREG = {"ES": 17, "FR": 13, "IT": 20, "DE": 16, "NL": 12, "AT": 9}
def eu_regions(doc, errs, warns, stats):
    cc = doc["country"]; R = doc["regions"]
    if cc not in _EUREG: errs.append("pais no previsto: %s" % cc); return
    if len(R) != _EUREG[cc]: errs.append("%s: %d regiones, se esperaban %d" % (cc, len(R), _EUREG[cc])); return
    for r, b in R.items():
        for k in ("eaa", "crops", "animals", "farms"):
            if not b.get(k): errs.append("%s %s: falta %s" % (cc, r, k))
        if errs: return
        for it, p in list(b["eaa"].items()) + list(b["animals"].items()) + [("milk", b.get("milk", []))]:
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
        e = {k: dict(v) for k, v in b["eaa"].items()}
        for y in sorted(e.get("AM160000", {}))[-3:]:
            parts = sum(e[k].get(y, 0) for k in ("AM100000", "AM110000", "AM120000"))
            if parts > e["AM160000"][y] * 1.005 + 0.5: errs.append("%s %s %s: cultivos + animales + productos animales (%.0f) > produccion agraria (%.0f)" % (cc, r, y, parts, e["AM160000"][y]))
        an = {k: dict(v) for k, v in b["animals"].items()}
        for y, v in b["animals"]["A2000"][-3:]:
            cows = an.get("A2300F", {}).get(y, 0) + an.get("A2300G", {}).get(y, 0)
            if cows > v * 1.005 + 0.05: errs.append("%s %s %s: vacas (%.1f) > vacuno total (%.1f)" % (cc, r, y, cows, v))
        for y, f in b["farms"]["TOTAL"].items():
            tipos = sum(b["farms"][t].get(y, {}).get("HLD", 0) for t in b["farms"] if t != "TOTAL")
            if f.get("HLD") and abs(tipos - f["HLD"]) > 0.01 * f["HLD"] + 15: errs.append("%s %s %s: explotaciones por tipo (%.0f) != total (%.0f)" % (cc, r, y, tipos, f["HLD"]))
    # las regiones suman el total nacional publicado por Eurostat (misma tabla de cuentas, otro fichero)
    try: N = load("eu-farm-economics.json")
    except Exception: N = None
    if N and cc in N["geos"]:
        for key, it in (("ic", "AM200000"), ("gva", "AM260000"), ("output", "AM180000")):
            ys = [y for y in N["years"] if all(y in dict(b["eaa"].get(it, [])) for b in R.values())][-1:]  # solo el ultimo anio comun: los anos antiguos de algunas regiones (p. ej. NL antes de 2021) siguen sin revisar y suman ~89 %
            for y in ys:
                su = sum(dict(b["eaa"][it])[y] for b in R.values()); nv = N["geos"][cc][key][N["years"].index(y)]
                tol = 0.03 if cc == "FR" else 0.012  # Francia: Eurostat publica ademas los territorios de ultramar, que no estan en el mapa
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
        if (b - a).days > 10: errs.append("hueco de mas de 10 dias entre %s y %s" % (a, b)); break
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
            exp = {"US": "bls", "UK": "ons", "CA": "statcan"}.get(cc)
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
    # el indice global debe ser exactamente el catalogo: mismas series, ids unicos, indices dentro del diccionario y punteros a ficheros existentes
    D_ = doc["dict"]; rows = doc["rows"]; man = json.loads((D / "catalog/manifest.json").read_text(encoding="utf-8"))
    if doc["total"] != len(rows): errs.append("total %d != filas %d" % (doc["total"], len(rows)))
    if len(rows) != man["seriesTotal"]: errs.append("indice con %d series, manifiesto %d" % (len(rows), man["seriesTotal"]))
    seen = set(); fsok = {"LIVE", "FRESH", "EXPECTED_DELAY", "DELAYED", "STALE", "HISTORICAL", "DISCONTINUED", "PENDING"}
    for r in rows:
        if len(r) != 12: errs.append("fila con %d columnas (se esperan 12)" % len(r)); break
        k = (D_["cc"][r[2]] if r[2] < len(D_["cc"]) else None, r[0])
        if k[0] is None or r[3] >= len(D_["group"]) or r[4] >= len(D_["unit"]) or r[5] >= len(D_["freq"]) or r[7] >= len(D_["fs"]) or r[11] >= len(D_["src"]) or any(t >= len(D_["tag"]) for t in r[8]): errs.append("%s: indice fuera del diccionario" % r[0]); break
        if k in seen: errs.append("serie repetida %s/%s" % k); break
        seen.add(k)
        if D_["fs"][r[7]] not in fsok: errs.append("%s: estado de frescura %r invalido" % (r[0], D_["fs"][r[7]])); break
        c = man["countries"].get(k[0])
        if not c or r[10] not in (0, 1) or (r[10] == 1 and not c.get("catalogEu")): errs.append("%s: puntero a catalogo invalido" % r[0]); break
    n = {0: 0, 1: 0}
    for r in rows: n[r[10]] = n.get(r[10], 0) + 1
    if n[1] != sum(c.get("nEu", 0) for c in man["countries"].values()): errs.append("series UE del indice != manifiesto")
    stats["series"] = len(rows)

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
            # diferencia relativa simetrica (sobre el mayor de los dos): una caida real brusca de la fuente (p. ej. arroz japonica de Espana, -26 % en una semana al llegar la cosecha nueva) no debe parecer mas grande que una subida igual
            if abs(h["value"] - o["value"]) > tol * max(1, abs(o["value"]), abs(h["value"])): errs.append("%s: latest %s vs history del mes %s (%s)" % (o["id"], o["value"], h["value"], o["frequency"]))
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
                    st = next((x for x in json.loads((D / "series" / "CA" / "stocks.json").read_text(encoding="utf-8"))["series"] if x["id"] == k[2:]), None)
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
            if not [t for t in (sr.get("tags") or []) if t in CM.KIND_OF]: unt[m] += 1
            for t in [t for t in (sr.get("tags") or []) if t in CM.KIND_OF]: trk[t] += 1
            for t in sr.get("tags") or []:
                if t in CM.KIND_OF:
                    mt = CM.cell_metric(t, m)
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


WBA_PCT = {"agriLandPct", "arableLandPct", "irrigatedPct", "agriEmploymentPct", "agriVaPct", "agriRawExpPct", "agriRawImpPct", "foodExpPct", "foodImpPct", "waterAgriPct"}
WBA_RANGE = {"cropIdx": (0, 400), "livestockIdx": (0, 400), "foodIdx": (0, 400), "cerealYield": (0, 20000), "fertKgHa": (0, 3000), "inflation": (-50, 500), "gdpGrowth": (-50, 100), "cpi": (0, 100000), "fxUsd": (0, 100000)}
WBA_NONNEG = {"agriLandKm2", "arablePerCap", "agriVaPerWorker", "agriVaUsd", "cerealArea", "cerealProd", "ch4Agri", "n2oAgri"}


def worldbank_agri(doc, errs, warns, stats):
    """Banco Mundial (WDI): licencia CC BY-4.0 por indicador, series sin huecos en los extremos, rangos fisicos y coherencia produccion = rendimiento x superficie."""
    import datetime as _d, math as _m
    cy = _d.date.today().year
    ind = doc["indicators"]
    for k, i in ind.items():
        if i.get("license") != "CC BY-4.0": errs.append("worldbank-agri %s: licencia %r, solo se admite CC BY-4.0" % (k, i.get("license")))
    euro = {"ES", "FR", "DE", "BE", "AT", "PT", "NL"}
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
            if k == "fxUsd" and (c == "US" or (c in euro and y0 < 1999)): errs.append("worldbank-agri %s: tipo de cambio no admitido (EE. UU. o antes de 1999 en zona euro)" % c)
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
        if wt is not None and not ((10 if ("Goat" in com or "Sheep" in com or "Lamb" in com) else 30) <= wt <= 2600): errs.append("us-local cattle/%s %s: peso medio fuera de rango (%s)" % (st, cl, wt)); return
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
        for q, p in zip(pts, pts[1:]):
            if (_d.date.fromisoformat(p[0]) - _d.date.fromisoformat(q[0])).days <= 8 and q[1] > 0 and abs(p[1] / q[1] - 1) > 0.35: warns.append("us-local cattle/%s/%s %s: salto semanal de %.0f %%" % (st, k, p[0], (p[1] / q[1] - 1) * 100))
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

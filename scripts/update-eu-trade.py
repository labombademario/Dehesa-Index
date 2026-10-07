#!/usr/bin/env python3
"""Comercio exterior agroalimentario de ES, FR, DE, BE, AT, PT, IT, DK, NL y PL (Eurostat Comext, DS-045409, CC BY 4.0).
Escribe data/eu-trade-stats.json (extend: añade series a cada país) y data/eu-trade-log.txt.
 - Mensual desde 2000: exportaciones, importaciones y balanza de total agroalimentario (cap. 01-24 del SA) y de capítulos clave; socio WORLD (incluye comercio intra-UE).
 - Anual por socio: ranking de destinos y orígenes del total agroalimentario, top 10 por país y flujo, con serie desde 2002.
Valores en millones de euros."""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
LOG = []; OUT = {}
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-trade-log.txt").write_text("\n".join(LOG))
    except Exception: pass
REP = {"PL": "Poland", "ES": "Spain", "FR": "France", "DE": "Germany", "BE": "Belgium", "AT": "Austria", "PT": "Portugal", "IT": "Italy", "DK": "Denmark", "NL": "Netherlands"}
CH = ["%02d" % i for i in range(1, 25)]
KEY = {"01": "live animals", "02": "meat", "04": "dairy, eggs and honey", "07": "vegetables", "08": "fruit and nuts", "10": "cereals", "12": "oilseeds", "15": "fats and oils", "17": "sugar", "22": "beverages (incl. wine)", "23": "animal feed and food residues", "31": "fertilisers"}
HS4 = {"1001": "wheat and meslin", "1002": "rye", "1003": "barley", "1004": "oats", "1005": "maize", "1006": "rice", "1201": "soya beans", "1205": "rape or colza seeds", "1701": "cane or beet sugar", "0701": "potatoes",
       "0201": "bovine meat, fresh or chilled", "0202": "bovine meat, frozen", "0203": "pig meat", "0204": "sheep and goat meat", "0207": "poultry meat", "0401": "milk and cream", "0405": "butter", "0406": "cheese and curd", "0407": "birds' eggs", "2204": "wine of fresh grapes"}   # solo producto x socio anual (top 6 socios); sin series mensuales para no engordar el indice global
EXTRA = {"ES": {"1509": "olive oil"}, "PT": {"1509": "olive oil", "45": "cork"}, "IT": {"1509": "olive oil"}, "FR": {"1509": "olive oil"}}
def get(params, tries=4):
    q = urllib.parse.urlencode(params, doseq=True) + "&format=JSON&lang=EN&indicators=VALUE_IN_EUROS"
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=150) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])
def cells(j):
    ids, size = j["id"], j["size"]; order = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]
        o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        order[d] = o
    val = j.get("value", {}); items = val.items() if isinstance(val, dict) else enumerate(val)
    for k, v in items:
        if v is None: continue
        k = int(k); rec = {}
        for d in reversed(ids):
            n = len(order[d]); rec[d] = order[d][k % n]; k //= n
        yield rec, v / 1e6
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]
def put(cc, sid, group, label, unit, freq, pts, src, ch=True):
    d = {p: v for p, v in pts}
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return
    prev = pts[-2][1]
    OUT.setdefault(cc, {})[sid] = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=pts[-1][0], latest=pts[-1][1],
        changePct=round((pts[-1][1] / prev - 1) * 100, 2) if ch and prev else None, points=pts, sourceGroup=src)
def monthly(cc):
    n = 0
    prods = CH + ["31"] + list(EXTRA.get(cc, {}))
    for flow, tag, word in (("2", "exp", "Exports"), ("1", "imp", "Imports")):
        j = get({"reporter": cc, "partner": "WORLD", "product": prods, "flow": flow, "freq": "M", "sinceTimePeriod": "2000-01"})
        by = {}
        for r, v in cells(j): by.setdefault(r["product"], {})[r["time"]] = v
        tot = {}
        for c in CH:
            for p, v in by.get(c, {}).items(): tot[p] = tot.get(p, 0) + v
        by["_agri"] = tot; by["_" + tag] = tot
        globals().setdefault("_M", {})[(cc, tag)] = by
        label = dict(KEY); label.update(EXTRA.get(cc, {}))
        put(cc, "eu-%s-trade-%s-agrifood" % (cc.lower(), tag), "trade", "%s: agri-food total, HS 01-24 (monthly)" % word, "EUR million", "monthly", sorted(tot.items()), "Eurostat Comext"); n += 1
        for c, nm in label.items():
            if by.get(c): put(cc, "eu-%s-trade-%s-%s" % (cc.lower(), tag, slug(nm)), "trade", "%s: %s (monthly)" % (word, nm), "EUR million", "monthly", sorted(by[c].items()), "Eurostat Comext"); n += 1
    ex, im = _M[(cc, "exp")]["_agri"], _M[(cc, "imp")]["_agri"]
    put(cc, "eu-%s-trade-bal-agrifood" % cc.lower(), "trade", "Trade balance: agri-food total, HS 01-24 (monthly)", "EUR million", "monthly", [(p, v - im[p]) for p, v in ex.items() if p in im], "Eurostat Comext", ch=False); n += 1
    for c, nm in {**KEY, **EXTRA.get(cc, {})}.items():
        a, b = _M[(cc, "exp")].get(c), _M[(cc, "imp")].get(c)
        if a and b: put(cc, "eu-%s-trade-bal-%s" % (cc.lower(), slug(nm)), "trade", "Trade balance: %s (monthly)" % nm, "EUR million", "monthly", [(p, v - b[p]) for p, v in a.items() if p in b], "Eurostat Comext", ch=False); n += 1
    return n
def partners(cc):
    n = 0; yr = datetime.date.today().year - 1
    for flow, tag, word in (("2", "exp", "Exports to"), ("1", "imp", "Imports from")):
        j = get({"reporter": cc, "product": CH, "flow": flow, "freq": "A", "time": str(yr)})
        tot = {}; names = j["dimension"]["partner"]["category"]["label"]
        for r, v in cells(j):
            if len(r["partner"]) == 2 and r["partner"] != cc: tot[r["partner"]] = tot.get(r["partner"], 0) + v
        if not tot: log(cc, tag, "sin socios para", yr); continue
        top = sorted(tot, key=lambda k: -tot[k])[:10]
        j = get({"reporter": cc, "partner": top, "product": CH, "flow": flow, "freq": "A", "sinceTimePeriod": "2002"})
        ser = {}
        for r, v in cells(j): ser.setdefault(r["partner"], {}); ser[r["partner"]][r["time"]] = ser[r["partner"]].get(r["time"], 0) + v
        for p in top:
            nm = re.sub(r"\s*\(.*", "", names.get(p, p)).strip()
            put(cc, "eu-%s-tp-%s-%s" % (cc.lower(), tag, p.lower()), "partners", "%s %s: agri-food, HS 01-24 (annual)" % (word, nm), "EUR million", "annual", sorted(ser.get(p, {}).items()), "Eurostat Comext"); n += 1
    return n
def extra_intra(cc):
    n = 0
    for flow, tag, word in (("2", "exp", "Exports"), ("1", "imp", "Imports")):
        j = get({"reporter": cc, "partner": ["EXT_EU27_2020", "INT_EU27_2020"], "product": CH, "flow": flow, "freq": "M", "sinceTimePeriod": "2000-01"})
        tot = {}
        for r, v in cells(j): d = tot.setdefault(r["partner"], {}); d[r["time"]] = d.get(r["time"], 0) + v
        for pc, nm in (("EXT_EU27_2020", "extra-EU"), ("INT_EU27_2020", "intra-EU")):
            put(cc, "eu-%s-trade-%s-agrifood-%s" % (cc.lower(), tag, nm.replace("-EU", "")), "trade", "%s: agri-food total, %s (monthly)" % (word, nm), "EUR million", "monthly", sorted(tot.get(pc, {}).items()), "Eurostat Comext"); n += 1
    return n
PRODS = {}
def products(cc):
    """Producto x socio, anual (ultimos 6 anos completos): top 10 socios + agregados extra/intra/mundo."""
    yr = datetime.date.today().year - 1; years = [str(y) for y in range(yr - 5, yr + 1)]
    label = dict(KEY); label.update(EXTRA.get(cc, {})); label.update(HS4); n = 0
    for flow, tag in (("2", "exp"), ("1", "imp")):
        j = get({"reporter": cc, "product": list(label), "flow": flow, "freq": "A", "sinceTimePeriod": years[0], "untilTimePeriod": years[-1]})
        names = j["dimension"]["partner"]["category"]["label"]
        by = {}
        for r, v in cells(j): by.setdefault(r["product"], {}).setdefault(r["partner"], {})[r["time"]] = v
        for c in label:
            d = by.get(c, {})
            cand = {k: v for k, v in d.items() if len(k) == 2 and k != cc and v.get(years[-1])}
            top = sorted(cand, key=lambda k: -cand[k][years[-1]])[:6 if c in HS4 else 10]
            if not top: continue
            row = lambda k: [round(d[k].get(y, 0), 3) if d.get(k, {}).get(y) is not None else None for y in years]
            PRODS.setdefault(cc, {}).setdefault(c, {"name": label[c]})[tag] = {
                "world": row("WORLD") if "WORLD" in d else None, "extra": row("EXT_EU27_2020") if "EXT_EU27_2020" in d else None, "intra": row("INT_EU27_2020") if "INT_EU27_2020" in d else None,
                "partners": [{"c": k, "n": re.sub(r"\s*\(.*", "", names.get(k, k)).strip(), "v": row(k)} for k in top]}; n += 1
    return n
def main():
    for cc in REP:
        for fn in (monthly, extra_intra, partners, products):
            try: log(cc, fn.__name__, fn(cc))
            except Exception as e: log("ERROR", cc, fn.__name__, repr(e))
    tot = sum(len(v) for v in OUT.values()); log("series", tot)
    if tot < 60: sys.exit(1)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "countries": {
        cc: {"name": REP[cc], "extend": True, "source": {"name": "Eurostat (Comext)", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "license": "Eurostat reuse policy (CC BY 4.0); cite source"}, "series": list(s.values())} for cc, s in OUT.items()}, "log": LOG[-30:]}
    (ROOT / "data" / "eu-trade-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "eu-trade-products.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": doc["generatedAt"], "years": [str(y) for y in range(datetime.date.today().year - 6, datetime.date.today().year)], "unit": "EUR million", "source": {"name": "Eurostat (Comext)", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "license": "Eurostat reuse policy (CC BY 4.0); cite source"}, "reporters": PRODS}, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "eu-trade-log.txt").write_text("\n".join(LOG))
main()

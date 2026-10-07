#!/usr/bin/env python3
"""Australia: importaciones, balanza y socios comerciales agroalimentarios (ABS Data API, CC BY 4.0).
MERCH_EXP / MERCH_IMP: clave COMMODITY_SITC.COUNTRY.STATE.FREQ. Escribe data/australia-trade-stats.json (extend AU),
data/au-trade-products.json (producto x socio, mismo esquema que eu-trade-products.json) y data/australia-trade-log.txt.
Las exportaciones de los 8 productos que ya trae update-country-stats.py no se repiten aquí."""
import csv, datetime, io, json, re, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.api.abs.gov.au/rest/data/"
LOG = []; OUT = {}; PRODS = {}
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "australia-trade-log.txt").write_text("\n".join(LOG))
    except Exception: pass
def abs_csv(path, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(BASE + path, headers={"Accept": "application/vnd.sdmx.data+csv", "User-Agent": "Dehesa-Index-data-bot/1.0"})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(req, timeout=120).read().decode("utf-8-sig"))))
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: break
            time.sleep(4 * (i + 1))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:160])
EXISTING = {"041": "wheat", "043": "barley", "044": "maize", "222": "oilseeds", "011": "beef", "012": "sheepmeat", "024": "cheese", "001": "live"}
PROD = [("0", "agri-food total (SITC 0, food and live animals)", "agrifood"), ("001", "live animals", "live"), ("011", "bovine meat", "beef"), ("012", "other meat (incl. sheep meat)", "sheepmeat"),
        ("022", "milk and cream", "milk"), ("024", "cheese and curd", "cheese"), ("041", "wheat", "wheat"), ("043", "barley", "barley"), ("044", "maize", "maize"), ("061", "sugar", "sugar"),
        ("112", "alcoholic beverages (incl. wine)", "wine"), ("222", "oilseeds (canola etc.)", "oilseeds"), ("263", "cotton", "cotton"), ("268", "wool", "wool"), ("56", "fertilisers", "fertilisers"),
        ("023", "butter and other milk fats", "butter"), ("025", "birds eggs", "eggs"), ("057", "fruit and nuts (fresh or dried)", "fruit"), ("042", "rice", "rice")]
def mult(r): return 10 ** int(r.get("UNIT_MULT") or 0)
def put(sid, group, label, unit, freq, pts, src, ch=True):
    d = {p: v for p, v in pts}
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return
    prev = pts[-2][1]
    OUT[sid] = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=pts[-1][0], latest=pts[-1][1], changePct=round((pts[-1][1] / prev - 1) * 100, 2) if ch and prev else None, points=pts, sourceGroup=src)
MON = {}
def monthly():
    n = 0
    for code, label, key in PROD:
        for ds, tag, word in (("MERCH_EXP", "exp", "Exports"), ("MERCH_IMP", "imp", "Imports")):
            try:
                rows = abs_csv("%s/%s.TOT.TOT.M?format=csvfilewithlabels&startPeriod=1988" % (ds, code))
                pts = [(r["TIME_PERIOD"], float(r["OBS_VALUE"]) * mult(r) / 1e6) for r in rows if r.get("OBS_VALUE") not in (None, "")]
            except Exception as e: log("ERROR", ds, code, e); continue
            MON[(code, tag)] = dict(pts)
            if tag == "exp" and code in EXISTING: continue
            put("au-%s-%s" % (tag, key), "trade", "%s: %s" % (word, label), "A$ million (value)", "monthly", pts, "ABS MERCH_" + tag.upper()); n += 1
        a, b = MON.get((code, "exp")), MON.get((code, "imp"))
        if a and b: put("au-bal-%s" % key, "trade", "Trade balance: %s" % label, "A$ million (value)", "monthly", [(p, v - b[p]) for p, v in a.items() if p in b], "ABS MERCH", ch=False); n += 1
    log("mensual", n)
def split(v):
    v = (v or "").strip()
    return tuple(x.strip() for x in v.split(":", 1)) if ": " in v else (v, v)
def by_country(ds, code, since):
    """Devuelve ({pais: {ano: valor A$ M}}, {codigo: nombre}) para un producto, todos los paises, anual."""
    dim = "COUNTRY_DEST" if ds == "MERCH_EXP" else "COUNTRY_ORIGIN"
    rows = abs_csv("%s/%s..TOT.M?format=csvfilewithlabels&startPeriod=%s" % (ds, code, since))
    if rows and not by_country.__dict__.get("shown"): by_country.shown = True; log("columnas", ",".join(rows[0].keys()))
    res = {}; names = {}
    for r in rows:
        if r.get("OBS_VALUE") in (None, "") or r["TIME_PERIOD"][:4] >= str(datetime.date.today().year): continue
        c, nm = split(r.get(dim, ""))
        if not nm or nm == c:
            for k, v in r.items():
                if k.startswith(dim + ":") or k.startswith("Country"): nm = v; break
        res.setdefault(c, {})[r["TIME_PERIOD"][:4]] = res.get(c, {}).get(r["TIME_PERIOD"][:4], 0) + float(r["OBS_VALUE"]) * mult(r) / 1e6; names[c] = nm
    return res, names
def partners():
    n = 0; yr = datetime.date.today().year - 1; years = [str(y) for y in range(yr - 5, yr + 1)]
    for code, label, key in PROD:
        for ds, tag, word in (("MERCH_EXP", "exp", "Exports to"), ("MERCH_IMP", "imp", "Imports from")):
            try: res, names = by_country(ds, code, years[0])
            except Exception as e: log("ERROR socios", ds, code, e); continue
            tot = res.get("TOT", {})
            cand = {c: v for c, v in res.items() if c != "TOT" and v.get(years[-1])}
            top = sorted(cand, key=lambda c: -cand[c][years[-1]])[:10]
            if not top: continue
            row = lambda v: [round(v[y], 3) if y in v else None for y in years]
            PRODS.setdefault("AU", {}).setdefault(code, {"name": label})[tag] = {"world": row(tot) if tot else None, "extra": None, "intra": None, "partners": [{"c": c, "n": re.sub(r"\s*\(.*", "", names.get(c, c)).strip(), "v": row(cand[c])} for c in top]}
            if code == "0":
                full, _ = by_country(ds, code, "2000")
                for c in top: put("au-tp-%s-%s" % (tag, c.lower()), "partners", "%s %s: agri-food, SITC 0 (annual)" % (word, re.sub(r"\s*\(.*", "", names.get(c, c)).strip()), "A$ million (value)", "annual", sorted(full.get(c, {}).items()), "ABS " + ds); n += 1
    log("socios", n)
def main():
    for fn in (monthly, partners):
        try: fn()
        except Exception as e: log("ERROR", fn.__name__, repr(e))
    log("series", len(OUT), "productos", len(PRODS.get("AU", {})))
    if len(OUT) < 15: sys.exit(1)
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); src = {"name": "Australian Bureau of Statistics (ABS Data API)", "url": "https://www.abs.gov.au/", "license": "CC BY 4.0"}
    (ROOT / "data" / "australia-trade-stats.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "countries": {"AU": {"name": "Australia", "extend": True, "source": src, "series": list(OUT.values())}}}, ensure_ascii=False, separators=(",", ":")))
    yr = datetime.date.today().year
    (ROOT / "data" / "au-trade-products.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "years": [str(y) for y in range(yr - 6, yr)], "unit": "A$ million", "source": src, "reporters": PRODS}, ensure_ascii=False, separators=(",", ":")))
main()

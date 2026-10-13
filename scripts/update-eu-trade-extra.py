#!/usr/bin/env python3
"""Comercio agroalimentario de la UE-27 con el resto del mundo (Eurostat Comext, DS-045409, CC BY 4.0), para el perfil de la Union Europea.
Declarante EU27_2020 (el agregado de la UE: solo comercio extra-UE). Escribe data/eu-extra-trade-stats.json (countries.EU, extend) y data/eu-extra-trade-log.txt.
 - Anual: ranking de destinos y origenes del total agroalimentario (cap. 01-24 del SA), top 10, serie desde 2002.
 - Anual: exportaciones, importaciones y balanza extra-UE del total agroalimentario.
Valores en millones de euros. Si la consulta falla o no trae socios, no se toca el fichero. Uso: python3 scripts/update-eu-trade-extra.py"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
REP = "EU27_2020"; CH = ["%02d" % i for i in range(1, 25)]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(params, tries=4):
    q = urllib.parse.urlencode(params, doseq=True) + "&format=JSON&lang=EN&indicators=VALUE_IN_EUROS"; last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=150) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])
def cells(j):
    ids, size = j["id"], j["size"]; order = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]; o = [None] * len(idx)
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
def series(sid, group, label, pts):
    pts = [[p, round(v, 3)] for p, v in sorted(pts)]
    if len(pts) < 5 or int(pts[-1][0][:4]) < datetime.date.today().year - 2: return None
    prev = pts[-2][1]
    return dict(id=sid, group=group, label=label, unit="EUR million", frequency="annual", latestPeriod=pts[-1][0], latest=pts[-1][1],
                changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup="Eurostat Comext")
def main():
    out = []; yr = datetime.date.today().year - 1; totals = {}
    for flow, tag, word in (("2", "exp", "Exports to"), ("1", "imp", "Imports from")):
        j = get({"reporter": REP, "product": CH, "flow": flow, "freq": "A", "time": str(yr)})
        tot = {}; names = j["dimension"]["partner"]["category"]["label"]
        for r, v in cells(j):
            if len(r["partner"]) == 2: tot[r["partner"]] = tot.get(r["partner"], 0) + v
        if not tot: log(tag, "sin socios para", yr); continue
        top = sorted(tot, key=lambda k: -tot[k])[:10]
        j = get({"reporter": REP, "partner": top, "product": CH, "flow": flow, "freq": "A", "sinceTimePeriod": "2002"})
        ser = {}
        for r, v in cells(j): ser.setdefault(r["partner"], {}); ser[r["partner"]][r["time"]] = ser[r["partner"]].get(r["time"], 0) + v
        for p in top:
            nm = re.sub(r"\s*\(.*", "", names.get(p, p)).strip()
            s = series("eu-tp-%s-%s" % (tag, p.lower()), "partners", "%s %s: extra-EU agri-food, HS 01-24 (annual)" % (word, nm), list(ser.get(p, {}).items()))
            if s: out.append(s)
        j = get({"reporter": REP, "partner": ["WORLD"], "product": CH, "flow": flow, "freq": "A", "sinceTimePeriod": "2002"})
        t = {}
        for r, v in cells(j): t[r["time"]] = t.get(r["time"], 0) + v
        totals[tag] = t
    for tag, word in (("exp", "Exports"), ("imp", "Imports")):
        if totals.get(tag):
            s = series("eu-extra-trade-%s-agrifood" % tag, "trade", "%s: agri-food total, extra-EU-27 (annual)" % word, list(totals[tag].items()))
            if s: out.append(s)
    if totals.get("exp") and totals.get("imp"):
        bal = [(y, totals["exp"][y] - totals["imp"][y]) for y in totals["exp"] if y in totals["imp"]]
        s = series("eu-extra-trade-bal-agrifood", "trade", "Balance: agri-food total, extra-EU-27 (annual)", bal)
        if s: s["changePct"] = None; out.append(s)
    if sum(1 for s in out if s["group"] == "partners") < 6: log("pocos socios (%d): no se escribe" % len(out)); (ROOT / "data" / "eu-extra-trade-log.txt").write_text("\n".join(LOG)); sys.exit(0)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"EU": {"name": "European Union", "extend": True, "source": {"name": "Eurostat (Comext)", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "license": "Eurostat reuse policy (CC BY 4.0); cite source"}, "series": out}}}
    (ROOT / "data" / "eu-extra-trade-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("EU: %d series" % len(out)); (ROOT / "data" / "eu-extra-trade-log.txt").write_text("\n".join(LOG))
main()

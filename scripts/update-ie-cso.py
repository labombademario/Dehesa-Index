#!/usr/bin/env python3
"""Irlanda — estadisticas agrarias del CSO (Central Statistics Office, PxStat, CC BY 4.0) -> data/ie-cso-stats.json (countries.IE, extend)
  * AHM05  Agricultural Input and Output Price Indices (base 2020=100), mensual: 42 indices (producto y insumos).
  * AKA01  Leche de vaca recibida por industrias y cooperativas (millones de litros; grasa y proteina), anual.
  * ARA02  Venta de tierra agricola (PSRA/CSO): precio mediano y medio por hectarea y numero de transacciones, por tipo de tierra y region, anual.
Sin clave. Nada se estima: una celda vacia de la tabla se omite; una serie con menos de 3 puntos o sin dato desde hace mas de 3 anos no se publica.
Los precios mensuales de leche (AJM07) y fertilizantes (AJM05) del CSO estan parados desde 2024 y no se cargan."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ie-cso-stats.json"
CSO = "https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/%s/JSON-stat/2.0/en"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
SRC = {"name": "Central Statistics Office, Ireland (CC BY 4.0)", "url": "https://data.cso.ie/", "license": "CC BY 4.0"}
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a)); print(*a)
def get(u, t=120, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-80:], last))
def table(code):
    """JSON-stat 2.0 -> {'dims': [(id, [(key, label)], unit_by_key)], 'value': list, 'size': list}"""
    d = json.loads(get(CSO % code)); dims = []
    for k in d["id"]:
        c = d["dimension"][k]["category"]; idx = c["index"]
        keys = sorted(idx, key=lambda x: idx[x]) if isinstance(idx, dict) else list(idx)
        lab = c.get("label", {}); un = {kk: (v.get("base") or v.get("label") or "") for kk, v in (c.get("unit") or {}).items()}
        dims.append((k, [(kk, lab.get(kk, kk)) for kk in keys], un))
    return {"dims": dims, "value": d["value"], "size": d["size"], "updated": d.get("updated")}
def cell(t, ix):
    n = 0
    for i, s in zip(ix, t["size"]): n = n * s + i
    v = t["value"][n]
    return v if isinstance(v, (int, float)) else None
def per(key):
    key = str(key)
    if re.fullmatch(r"\d{6}", key): return key[:4] + "-" + key[4:]
    return key
def build(sid, group, label, unit, freq, pts, src, note=None):
    pts = sorted({p: v for p, v in pts if v is not None}.items())
    pts = [[p, round(v, 3)] for p, v in pts]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3: return None
    prev = pts[-2][1]
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=pts[-1][0], latest=pts[-1][1],
             changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup=src)
    if note: s["periodNote"] = note
    return s
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def prices():
    t = table("AHM05"); (_, st, _), (_, tm, _), (_, cat, _) = t["dims"]; out = []
    for j, (ck, cl) in enumerate(cat):
        pts = [(per(tk), cell(t, (0, i, j))) for i, (tk, _) in enumerate(tm)]
        s = build("ie-cso-ahm05-" + slug(cl), "prices", "Agricultural price index, Ireland: %s (2020=100, CSO)" % cl.strip(), "index 2020=100", "monthly", pts, "CSO AHM05")
        if s: out.append(s)
    log("AHM05", len(out), "series"); return out
def milk():
    t = table("AKA01"); (_, st, un), (_, tm, _), (_, ori, _) = t["dims"]; out = []
    for i0, (sk, sl) in enumerate(st):
        for j, (ok, ol) in enumerate(ori):
            pts = [(per(tk), cell(t, (i0, i, j))) for i, (tk, _) in enumerate(tm)]
            unit = un.get(sk) or ("%" if "Content" in sl else "million litres")
            lab = "Cows' milk intake by processors and co-ops, %s origin: %s (%s, CSO)" % (ol.lower(), sl.lower().replace("intake of cows milk by milk processors and co-ops", "volume"), unit)
            s = build("ie-cso-aka01-%s-%s" % (slug(sl)[:24], slug(ol)), "milk", lab, unit, "annual", pts, "CSO AKA01")
            if s: out.append(s)
    log("AKA01", len(out), "series"); return out
def land():
    t = table("ARA02"); (_, st, un), (_, tm, _), (_, typ, _), (_, reg, _) = t["dims"]; out = []
    want = {"Median Price per Hectare": "median price per hectare", "Mean Price per Hectare": "mean price per hectare", "Number of Transactions": "number of transactions"}
    for i0, (sk, sl) in enumerate(st):
        if sl not in want: continue
        for j, (tk2, tl) in enumerate(typ):
            for k, (rk, rl) in enumerate(reg):
                pts = [(per(yk), cell(t, (i0, i, j, k))) for i, (yk, _) in enumerate(tm)]
                unit = "EUR/ha" if "Hectare" in sl else "transactions"
                lab = "Agricultural land sales, %s, %s: %s (%s, CSO)" % (rl, tl.lower(), want[sl], unit)
                s = build("ie-cso-ara02-%s-%s-%s" % (slug(sl)[:14], slug(tl), slug(rl)), "inputs", lab, unit, "annual", pts, "CSO ARA02")
                if s: out.append(s)
    log("ARA02", len(out), "series"); return out
def main():
    ser = []
    for fn in (prices, milk, land):
        try: ser += fn()
        except Exception as e: log("ERROR", fn.__name__, repr(e)[:300])
    ids = [s["id"] for s in ser]
    if len(ids) != len(set(ids)): raise SystemExit("ids repetidos")
    if len(ser) < 40: raise SystemExit("FALLO: pocas series (%d)" % len(ser))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"IE": {"name": "Ireland", "extend": True, "source": SRC, "series": sorted(ser, key=lambda s: s["id"])}}, "log": LOG[-20:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "ie-cso-log.txt").write_text("\n".join(LOG) + "\n")
    print("series", len(ser))
main()

#!/usr/bin/env python3
"""Tierra agraria y riego (Eurostat) -> data/eu-land/land.json

Para Francia, Italia, Polonia, Portugal, Alemania, Bélgica, Croacia y Grecia:
  price:      apri_lprc, precio de la tierra agraria (EUR/ha) por pais, NUTS 1 y NUTS 2: tierra arable (ARA), arable de regadio posible
              (ARAIB, "irrigable") y de secano (ARAXIB, "non-irrigable") y pasto permanente (J0000). Solo los territorios que publican cada tipo:
              ARAIB/ARAXIB existen para Italia (hasta 2020), Grecia, España, Eslovaquia, Rumanía y algo de Polonia; NO para Francia, Portugal,
              Alemania, Bélgica ni Croacia, y aqui no se inventan. Alemania no publica precio de tierra en apri_lprc.
  irrigation: superficie agraria regada (ef_mp_irri, ultimos 12 meses; ultimo año disponible de cada territorio: 2023 en FR/PT/DE/BE/HR, 2010 en IT/EL/PL) sobre la SAU (ef_lus_main). Base TOTAL (todas las explotaciones)
              si existe; si no, la de explotaciones por encima del umbral fisico (ABVTH) con su propia SAU. Si la SAU del año 2023 no existe se usa la
              Nada se estima: sin dato = no aparece.
Uso: python3 scripts/update-eu-land.py [--local carpeta con apri_lprc.json, irri.json, lus.json]"""
import argparse, datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
CC = ["FR", "IT", "PL", "PT", "DE", "BE", "HR", "EL"]
PRODS = ["ARA", "ARAIB", "ARAXIB", "J0000"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def get(u, tries=3, t=180):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e:
            last = e; time.sleep(4 * (k + 1))
    raise RuntimeError("%s: %s" % (u[:90], str(last)[:120]))
def q(params): return "&".join("%s=%s" % (k, urllib.parse.quote(str(x))) for k, v in params for x in (v if isinstance(v, list) else [v]))
def jsonstat(raw):
    """JSON-stat de Eurostat -> (filas [(dict de dimensiones, valor)], etiquetas {dim: {codigo: texto}})."""
    d = json.loads(raw) if isinstance(raw, (bytes, str)) else raw
    ids, size = d["id"], d["size"]; cats = {}; labs = {}
    for k in ids:
        c = d["dimension"][k]["category"]; ix = c["index"]
        cats[k] = list(ix) if isinstance(ix, list) else [x for x, _ in sorted(ix.items(), key=lambda p: p[1])]
        labs[k] = c.get("label", {})
    rows = []
    for k, v in d.get("value", {}).items():
        k = int(k); r = {}
        for dm, n in reversed(list(zip(ids, size))): r[dm] = cats[dm][k % n]; k //= n
        rows.append((r, v))
    return rows, labs
def fetch(ds, params, name, local):
    if local:
        p = Path(local) / (name + ".json")
        if not p.exists(): raise RuntimeError("falta " + str(p))
        return jsonstat(p.read_bytes())
    return jsonstat(get(API + ds + "?" + q(params)))
def cc_of(geo):
    for c in CC:
        if geo.startswith(c) and len(geo) <= 4: return c
    return None
def level(geo): return {2: 0, 3: 1, 4: 2}[len(geo)]

def build(local):
    out = {c: {"regions": {}, "price": {}, "irrigation": {"regions": {}}} for c in CC}
    # --- precios ---
    rows, labs = fetch("apri_lprc", [("lang", "EN"), ("unit", "EUR_HA"), ("sinceTimePeriod", "2012")], "apri_lprc", local)
    for r, v in rows:
        g = r["geo"]; c = cc_of(g)
        if not c or r["agriprod"] not in PRODS or v is None: continue
        out[c]["regions"].setdefault(g, {"name": labs["geo"].get(g, g), "level": level(g)})
        out[c]["price"].setdefault(r["agriprod"], {}).setdefault(g, {})[int(r["time"])] = round(float(v), 1)
    for c in CC:
        for p, G in out[c]["price"].items():
            for g in G: G[g] = [[y, G[g][y]] for y in sorted(G[g])]
    # --- riego y SAU ---
    irr, labs_i = fetch("ef_mp_irri", [("lang", "EN"), ("statinfo", ["TOTAL", "ABVTH"]), ("irrmeth", "TOTAL"), ("wat_src", "TOTAL"), ("irr_area", "UAA_IT"), ("unit", "HA")], "irri", local)
    lus, labs_l = fetch("ef_lus_main", [("lang", "EN"), ("statinfo", ["TOTAL", "ABVTH"]), ("crops", "UAA"), ("unit", "HA"), ("farmtype", "TOTAL"), ("so_eur", "TOTAL"), ("uaarea", "TOTAL")], "lus", local)
    I = {}; Ln = {}
    for r, v in irr:
        if v is None: continue
        I[(r["geo"], r.get("statinfo", "TOTAL"), int(r["time"]))] = float(v)
    for r, v in lus:
        if v is None or r.get("crops", "UAA") != "UAA": continue
        Ln[(r["geo"], r.get("statinfo", "TOTAL"), int(r["time"]))] = float(v)
    nat = {}
    for g in sorted({k[0] for k in I}):
        c = cc_of(g)
        if not c: continue
        if g == c: nat[c] = max(k[2] for k in I if k[0] == g and (k[1], k[2]) in {(b, k[2]) for b in ("TOTAL", "ABVTH")} and (g, k[1], k[2]) in Ln)
    for g in sorted({k[0] for k in I}):
        c = cc_of(g)
        if not c or c not in nat: continue
        best = None   # ultimo año con riego y SAU del MISMO año; base TOTAL antes que ABVTH
        for y in [nat[c]]:   # un solo año por pais: sus regiones son comparables entre si
            for basis in ("TOTAL", "ABVTH"):
                irrv, u = I.get((g, basis, y)), Ln.get((g, basis, y))
                if irrv is not None and u and u > 0 and irrv <= u * 1.001: best = (y, basis, irrv, u); break
            if best: break
        if not best: continue
        y, basis, irrv, u = best
        out[c]["regions"].setdefault(g, {"name": (labs_i.get("geo", {}) or {}).get(g, g), "level": level(g)})
        out[c]["irrigation"]["regions"][g] = {"year": y, "irrigated": round(irrv), "uaa": round(u), "basis": basis, "share": round(irrv / u * 100, 2)}
    return out
def validate(out):
    for c in CC:
        e = out[c]; ir = e["irrigation"]["regions"]
        if c not in ir: raise RuntimeError("%s: falta el dato nacional de riego" % c)
        if not 0 < ir[c]["share"] < 60: raise RuntimeError("%s: %% de regadio nacional imposible (%s)" % (c, ir[c]["share"]))
        if c in ("FR", "IT", "PL", "PT", "HR", "EL") and ("ARA" not in e["price"] or c not in e["price"]["ARA"]): raise RuntimeError("%s: falta el precio nacional de la tierra arable" % c)
        for p, G in e["price"].items():
            for g, pts in G.items():
                if any(not 100 < v < 2000000 for y, v in pts): raise RuntimeError("%s %s %s: precio fuera de rango" % (c, p, g))
        for g, x in ir.items():
            if not 0 <= x["share"] <= 100: raise RuntimeError("%s %s: %% de regadio imposible" % (c, g))
    # Grecia: el regadio siempre vale mas que el secano. Italia NO se exige: sus series de Eurostat se cruzan en 2019-2020 (dato oficial, se muestra tal cual y se avisa)
    for c in ("IT", "EL"):
        a, b = out[c]["price"].get("ARAIB", {}).get(c), out[c]["price"].get("ARAXIB", {}).get(c)
        if not a or not b: raise RuntimeError("%s: faltan los precios de arable irrigable/no irrigable" % c)
        ya = dict(a); yb = dict(b)
        if c == "EL" and any(ya[y] <= yb[y] for y in ya if y in yb): raise RuntimeError("%s: algun año el regadio no vale mas que el secano: revisar" % c)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "eu-land")); ap.add_argument("--local", default=""); ap.add_argument("--log", default=str(ROOT / "data" / "eu-land-log.txt"))
    a = ap.parse_args(); code = 0
    try:
        out = build(a.local or None); validate(out)
        doc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "eurostat", "name": "Eurostat (apri_lprc, ef_mp_irri, ef_lus_main)", "url": "https://ec.europa.eu/eurostat/databrowser/view/apri_lprc/default/table"},
               "notes": {"IT": "irrigable-vs-secano"}, "note": "Precio de la tierra agraria (EUR/ha) y superficie regada sobre la SAU. Solo lo que Eurostat publica para cada territorio.", "countries": out}
        Path(a.out).mkdir(parents=True, exist_ok=True)
        s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"; (Path(a.out) / "land.json").write_text(s, encoding="utf-8")
        for c in CC: log(c, "regiones", len(out[c]["regions"]), "precios", {p: len(G) for p, G in out[c]["price"].items()}, "regadio", len(out[c]["irrigation"]["regions"]), "nacional %s %%" % out[c]["irrigation"]["regions"][c]["share"])
        log("escrito land.json", len(s) // 1024, "KB")
    except Exception as e:
        log("ERROR", str(e)[:300]); code = 1
    Path(a.log).write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if code: raise SystemExit("no se escribe nada")
if __name__ == "__main__": main()

#!/usr/bin/env python3
"""Croacia (DZS, Državni zavod za statistiku) -> data/hr-dzs/{crops,livestock,dairy,prices,balance}.json

Fuente: base PxWeb del DZS, https://web.dzs.hr/PXWeb/api/v1/en/Poljoprivreda, lov, šumarstvo i ribarstvo/ (API publica, sin clave).
Reutilizable citando el nombre completo del Zavod como fuente (condiciones de uso de dzs.gov.hr; los conjuntos tambien estan en data.gov.hr con la
«Otvorena dozvola RH»). Croacia solo publica el detalle por 4 regiones estadisticas (Pannonian, Adriatic, City of Zagreb, North Croatia): no hay provincias.
  - crops:     biljna proizvodnja BP2-BP6 (NUTS 2021): superficie, produccion y rendimiento de cultivos, hortalizas, frutales, aceite y vino, 2020 -> hoy.
  - livestock: stocarstvo AG_SP01-05 (cabezas por categoria y region, 2021 -> hoy; historico nacional 2000-2020) y AG_SP07-10 (leche, huevos, lana, miel).
  - dairy:     leche recogida en lecherias, productos frescos y otros productos (mantequilla, quesos, suero), 2008 -> hoy.
  - prices:    indices de precios agrarios, producto (Output) e insumos (Input), base 2020 = 100, trimestral desde 2005.
  - balance:   balances de cereales, oleaginosas, arroz y azucar (BU1-BU4) y consumo de abonos minerales (PMG1-2).
Nada se estima: una celda sin dato (estado 'z' o '.') es null. Si algo no cuadra (regiones que no suman, indice base distinto de 100, tabla vacia) el fichero no se toca.
Uso: python3 scripts/update-hr-dzs.py [--only crops,livestock,dairy,prices,balance] [--local carpeta con <tabla>.json]"""
import argparse, datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://web.dzs.hr/PXWeb/api/v1/en/Poljoprivreda, lov, šumarstvo i ribarstvo/"
PAGE = "https://web.dzs.hr/PXWeb/pxweb/en/Poljoprivreda,%20lov,%20%C5%A1umarstvo%20i%20ribarstvo/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", "Content-Type": "application/json"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
# fichero -> {clave de tabla: (ruta, año minimo del ultimo dato)}
JOBS = {
    "crops": {"bp2": ("Biljna proizvodnja/BP2_NUTS2021.px", 2024), "bp3": ("Biljna proizvodnja/BP3_NUTS2021.px", 2024), "bp4": ("Biljna proizvodnja/BP4_NUTS2021.px", 2024),
              "bp5": ("Biljna proizvodnja/BP5_NUTS2021.px", 2024), "bp6": ("Biljna proizvodnja/BP6_NUTS2021.px", 2024)},
    "livestock": {"cattle": ("Stočarstvo/AG_SP01_NUTS2021.px", 2024), "pigs": ("Stočarstvo/AG_SP02_NUTS2021.px", 2024), "sheep": ("Stočarstvo/AG_SP03_NUTS2021.px", 2024),
                  "goats": ("Stočarstvo/AG_SP04_NUTS2021.px", 2024), "poultry": ("Stočarstvo/AG_SP05_NUTS2021.px", 2024),
                  "cattle_h": ("Stočarstvo/AG_SP01.px", 2019), "pigs_h": ("Stočarstvo/AG_SP02.px", 2019), "sheep_h": ("Stočarstvo/AG_SP03.px", 2019),
                  "goats_h": ("Stočarstvo/AG_SP04.px", 2019), "poultry_h": ("Stočarstvo/AG_SP05.px", 2019),
                  "milk": ("Stočarstvo/AG_SP07.px", 2024), "eggs": ("Stočarstvo/AG_SP08.px", 2024), "wool": ("Stočarstvo/AG_SP09.px", 2024), "honey": ("Stočarstvo/AG_SP10.px", 2024)},
    "dairy": {"collected": ("Mlijeko i mliječni proizvodi/AG_ML1.px", 2024), "fresh": ("Mlijeko i mliječni proizvodi/AG_ML2.px", 2024), "products": ("Mlijeko i mliječni proizvodi/AG_ML3.px", 2024)},
    "prices": {"output": ("Cijene u poljoprivredi/IC11.px", 2026), "input": ("Cijene u poljoprivredi/IC13.px", 2026)},
    "balance": {"cereals": ("Bilanca usjeva/BU1.px", 2023), "oilseeds": ("Bilanca usjeva/BU2.px", 2023), "rice": ("Bilanca usjeva/BU3.px", 2023), "sugar": ("Bilanca usjeva/BU4.px", 2023),
                "fert_active": ("Potrošnja mineralnih gnojiva u poljoprivredi/PMG1.px", 2024), "fert_tonnes": ("Potrošnja mineralnih gnojiva u poljoprivredi/PMG2.px", 2024)},
}
def http(u, data=None, tries=6):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=UA), timeout=120) as r: return json.load(r)
        except Exception as e:
            last = e
            if getattr(e, "code", None) == 429 or "429" in str(e): time.sleep(20 * (k + 1)); continue
            if getattr(e, "code", None) in (400, 404): break
            time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-50:], str(last)[:100]))
def fetch_px(path, local):
    """Tabla PxWeb completa en json-stat2."""
    if local:
        p = Path(local) / (path.split("/")[-1].replace(".px", "") + ".json")
        if not p.exists(): raise RuntimeError("falta " + p.name)
        return json.loads(p.read_text(encoding="utf-8"))
    u = urllib.parse.quote(BASE + path, safe=":/")
    time.sleep(3)
    meta = http(u)
    q = {"query": [{"code": v["code"], "selection": {"filter": "all", "values": ["*"]}} for v in meta["variables"]], "response": {"format": "json-stat2"}}
    time.sleep(3)
    return http(u, json.dumps(q).encode())
def parse(js):
    """json-stat2 -> {title, dims:[{n, l:[etiquetas]}], v:[valores en orden C], size}. Valores no numericos = null."""
    ids = js["id"]; dims = []
    for i in ids:
        d = js["dimension"][i]; c = d["category"]; idx = c["index"]
        order = sorted(idx, key=lambda k: idx[k]) if isinstance(idx, dict) else list(idx)
        lab = c.get("label", {})
        dims.append({"n": re.sub(r"\s+", " ", str(d.get("label", i))).strip(), "l": [re.sub(r"\s+", " ", str(lab.get(k, k))).strip() for k in order]})
    v = [None if (x is None or isinstance(x, str) or isinstance(x, bool)) else (round(float(x), 3) if isinstance(x, float) else x) for x in js["value"]]
    n = 1
    for d in dims: n *= len(d["l"])
    if n != len(v): raise RuntimeError("tabla con %d valores y %d celdas" % (len(v), n))
    return {"title": re.sub(r"\s+", " ", js.get("label", "")).strip(), "dims": dims, "v": v, "updated": js.get("updated", "")}
def axis(t, pred):
    k = [i for i, d in enumerate(t["dims"]) if pred(d)]
    return k[0] if k else None
def years_of(t):
    k = axis(t, lambda d: all(re.fullmatch(r"\d{4}", x) for x in d["l"]))
    if k is None: raise RuntimeError("tabla sin dimension de años")
    return k, [int(x) for x in t["dims"][k]["l"]]
def cell(t, ix):
    """valor por posiciones {indice_de_dimension: posicion}."""
    size = [len(d["l"]) for d in t["dims"]]; p = 0
    for k, s in enumerate(size): p = p * s + ix.get(k, 0)
    return t["v"][p]
SPARSE = ("rice", "oilseeds", "sugar")      # balances con muchas combinaciones vacias por construccion
def check_table(key, t, minyear):
    if not t["v"]: raise RuntimeError(key + ": tabla vacia")
    nn = sum(1 for x in t["v"] if x is not None)
    if nn < (0.3 if len(t["v"]) <= 40 or key in SPARSE else 0.5) * len(t["v"]): raise RuntimeError("%s: solo %d de %d celdas con dato" % (key, nn, len(t["v"])))
    k, ys = years_of(t)
    # algun dato en el ultimo año: la serie debe estar al dia
    size = [len(d["l"]) for d in t["dims"]]
    last = max(ys)
    if last < minyear: raise RuntimeError("%s: ultimo año %d, se esperaba al menos %d" % (key, last, minyear))
    # region: Republica + 4 regiones. Las regiones suman la Republica (area, produccion, cabezas; el rendimiento no se suma)
    r = axis(t, lambda d: any("Pannonian" in x for x in d["l"]))
    if r is not None:
        vk = axis(t, lambda d: any(x.startswith("Area") or x.startswith("Production") for x in d["l"]))
        total = bad = 0
        import itertools
        rng = [range(s) for s in size]
        for pos in itertools.product(*[range(1) if i == r else rng[i] for i in range(len(size))]):
            ix = dict(enumerate(pos))
            if vk is not None and t["dims"][vk]["l"][ix[vk]].startswith("Yield"): continue
            root = cell(t, {**ix, r: 0}); parts = [cell(t, {**ix, r: j}) for j in range(1, size[r])]
            if root is None or any(x is None for x in parts): continue
            total += 1
            if abs(sum(parts) - root) > max(3, 0.03 * abs(root)): bad += 1
        if total and bad > 0.03 * total: raise RuntimeError("%s: las regiones no suman la Republica en %d de %d celdas" % (key, bad, total))
    return last
def check_prices(key, t):
    ky, ys = years_of(t)
    if 2020 not in ys: raise RuntimeError(key + ": sin el año base 2020")
    kp = axis(t, lambda d: "Year" in d["l"] and "Q1" in d["l"]); kc = axis(t, lambda d: d is not t["dims"][ky] and d is not t["dims"][kp])
    yi = ys.index(2020); pi = t["dims"][kp]["l"].index("Year")
    for c in range(len(t["dims"][kc]["l"])):
        x = cell(t, {ky: yi, kp: pi, kc: c})
        if x is not None and abs(x - 100) > 0.6: raise RuntimeError("%s: indice anual 2020 = %s (debe ser 100): %s" % (key, x, t["dims"][kc]["l"][c][:40]))
    tot = cell(t, {ky: yi, kp: pi, kc: 0})
    if tot is None: raise RuntimeError(key + ": sin indice total en 2020")
    for i in range(len(ys)):
        for j in range(len(t["dims"][kp]["l"])):
            x = cell(t, {ky: i, kp: j, kc: 0})
            if x is not None and not 20 < x < 400: raise RuntimeError("%s: indice total imposible %s" % (key, x))
def check_series(key, t):
    """Series nacionales (leche, huevos, miel...): sin negativos, ni saltos de un orden de magnitud entre años contiguos."""
    ky, ys = years_of(t); size = [len(d["l"]) for d in t["dims"]]
    others = [i for i in range(len(size)) if i != ky]
    import itertools
    for pos in itertools.product(*[range(size[i]) for i in others]):
        ix = dict(zip(others, pos)); prev = None
        for yi in range(len(ys)):
            x = cell(t, {**ix, ky: yi})
            if x is None: continue
            if x < 0: raise RuntimeError("%s: valor negativo" % key)
            if prev and prev > 50 and x > 0 and not 0.1 < x / prev < 10: raise RuntimeError("%s: salto de %s a %s en %d" % (key, prev, x, ys[yi]))
            prev = x
SERIES = ("milk", "eggs", "honey", "collected")      # series nacionales largas: sin saltos de un orden de magnitud
def run(job, outdir, local):
    out = {}; lasts = {}
    for key, (path, miny) in JOBS[job].items():
        t = parse(fetch_px(path, local)); last = check_table(key, t, miny)
        if job == "prices": check_prices(key, t)
        elif key in SERIES: check_series(key, t)
        out[key] = {"title": t["title"], "path": path, "last": last, "dims": t["dims"], "v": t["v"]}
        lasts[key] = last
        log(job, key, "ultimo año", last, "celdas", len(t["v"]))
    doc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "dzs_hr", "name": "Državni zavod za statistiku (Croatian Bureau of Statistics)", "url": PAGE},
           "year": max(lasts.values()), "tables": out,
           "note": "Base PxWeb del DZS (estadistica agraria, precios agrarios, balances). Detalle regional solo por las 4 regiones estadisticas; no hay provincias. Celda sin dato = null."}
    outdir.mkdir(parents=True, exist_ok=True)
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
    (outdir / (job + ".json")).write_text(s, encoding="utf-8"); log("escrito", job + ".json", len(s) // 1024, "KB")
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "hr-dzs")); ap.add_argument("--only", default=""); ap.add_argument("--local", default="")
    ap.add_argument("--log", default=str(ROOT / "data" / "hr-dzs-log.txt"))
    a = ap.parse_args(); only = [x for x in a.only.split(",") if x] or list(JOBS); fails = 0
    for n in only:
        try: run(n, Path(a.out), a.local or None)
        except Exception as e: fails += 1; log("ERROR", n, str(e)[:240])
    Path(a.log).write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if fails: raise SystemExit("%d de %d conjuntos fallaron: lo que falló no se toca" % (fails, len(only)))
if __name__ == "__main__": main()

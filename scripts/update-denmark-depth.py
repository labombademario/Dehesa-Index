#!/usr/bin/env python3
"""Dinamarca en profundidad: cosecha por zona, sacrificios con precio, leche, censos y subvenciones directas de Statistics Denmark
(StatBank API, CC BY 4.0) -> data/denmark-depth.json
Tablas: HST77 (cosecha 2006-2024 por landsdel) + HST88 (cosecha desde 2025, nueva clasificacion), ANI41/ANI51 (sacrificio de vacuno y porcino, mensual),
ANI71 (leche, mensual), SVIN (censo porcino, trimestral), KVAEG5 (censo vacuno por zona, trimestral), TILSKUD2 (subvenciones directas, anual).
Todo se guarda como lo publica el organismo; solo conversiones exactas: 1000 ha -> ha, hkg/ha -> t/ha (/10), millones de kg = miles de toneladas.
Los valores ".." (sin dato) se omiten, nunca se rellenan. Si una tabla falla, falla todo (no se escribe un fichero a medias).
Modo de prueba sin red: DK_FIXTURES=<carpeta con info_<TABLA>.json y csv_<TABLA>.csv>."""
import csv, datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://api.statbank.dk/v1/"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
FIX = os.environ.get("DK_FIXTURES")
def post(path, body):
    last = None
    for i in range(3):
        try:
            req = urllib.request.Request(API + path, data=json.dumps(body).encode(), headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=180) as r: return r.read().decode("utf-8-sig", "replace")
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("StatBank %s: %s" % (path, str(last)[:160]))
def table(tid):
    """-> (info, rows) con rows = lista de dicts {codigo_variable: id_valor, 'v': float|None}"""
    if FIX:
        info = json.loads((Path(FIX) / ("info_%s.json" % tid)).read_text(encoding="utf-8"))
        raw = (Path(FIX) / ("csv_%s.csv" % tid)).read_text(encoding="utf-8-sig")
    else:
        info = json.loads(post("tableinfo", {"table": tid, "format": "JSON", "lang": "en"}))
        raw = post("data", {"table": tid, "format": "CSV", "lang": "en", "valuePresentation": "Code", "variables": [{"code": v["id"], "values": ["*"]} for v in info["variables"]]})
    vars_ = info["variables"]
    ids = [{x["id"]: x["id"] for x in v["values"]} for v in vars_]
    txt = [{x["text"]: x["id"] for x in v["values"]} for v in vars_]
    rd = csv.reader(io.StringIO(raw), delimiter=";"); head = next(rd)
    if len(head) != len(vars_) + 1: raise ValueError("%s: cabecera inesperada %s" % (tid, head))
    out = []
    for r in rd:
        if len(r) != len(head): continue
        d = {}; ok = True
        for i, v in enumerate(vars_):
            c = r[i].strip(); k = ids[i].get(c) or txt[i].get(c)
            if k is None: ok = False; break
            d[v["id"]] = k
        if not ok: continue
        s = r[-1].strip()
        try: d["v"] = float(s)
        except ValueError: d["v"] = None   # ".." = sin dato
        out.append(d)
    if not out: raise ValueError("%s: sin filas" % tid)
    log("tabla", tid, len(out), "celdas", "actualizada", info.get("updated"))
    return info, out
def names(info, var):
    for v in info["variables"]:
        if v["id"] == var: return {x["id"]: x["text"] for x in v["values"]}
    raise KeyError(var)
def per(code):
    m = re.match(r"^(\d{4})M(\d{2})$", code)
    if m: return "%s-%s" % (m.group(1), m.group(2))
    m = re.match(r"^(\d{4})[KQ](\d)$", code)
    if m: return "%s-Q%s" % (m.group(1), m.group(2))
    if re.match(r"^\d{4}$", code): return code
    raise ValueError("periodo no reconocido: " + code)
def clean(v):
    r = round(v, 4); return int(r) if r == int(r) else r
def ser(d):
    return [[p, clean(v)] for p, v in sorted(d.items())]
# ---------------------------------------------------------------- cosecha
REG_KIND = {"000": ("nation", None), "084": ("region", None), "085": ("region", None), "083": ("region", None), "082": ("region", None), "081": ("region", None),
            "15": ("province", "084"), "04": ("province", "084"), "07": ("province", "083"), "08": ("province", "083"), "09": ("province", "082"), "10": ("province", "082")}
# clave propia: (codigo HST77, codigo HST88, ruptura de clasificacion en 2025)
CROPS = [("cereals", "H100", "C0000", False), ("wheat_winter", "H110", "C1111", True), ("wheat_spring", "H120", "C1112", True), ("rye", "H130", "C1210", False), ("triticale", "H140", "C1600", False),
         ("barley_winter", "H150", "C1310", False), ("barley_spring", "H160", "C1320", False), ("oats_other", "H170", None, False), ("oats", None, "C1410", False), ("cereal_mix", None, "C1420", False),
         ("other_cereals", None, "C1990", False), ("maize_grain", "H175", "C1500", True), ("rapeseed", "H200", "I1110", True), ("pulses", "H300", "P0000", False), ("peas", "H310", "P1100", False),
         ("beans", "H312", "P1200", True), ("lupins", None, "P1300", False), ("potato_seed", "H511", None, False), ("potato_starch", "H512", None, False), ("potato_food", "H513", None, False),
         ("sugarbeet", "H520", None, False), ("fodder_beet", "H530", None, False)]
def build_harvest():
    i77, r77 = table("HST77"); i88, r88 = table("HST88")
    reg77 = names(i77, "OMRÅDE"); reg88 = names(i88, "LANDSDEL")
    regions = {}
    for k, nm in reg77.items():
        if k in REG_KIND: regions[k] = {"name": nm, "kind": REG_KIND[k][0], "parent": REG_KIND[k][1]}
    for k in reg88:
        if k not in regions: raise ValueError("HST88: zona nueva " + k)
    cn77 = names(i77, "AFGRØDE"); cn88 = names(i88, "AFGRØDE")
    data = {}; crops = {}
    def put(key, reg, meas, y, v):
        data.setdefault(key, {}).setdefault(reg, {}).setdefault(meas, {})[y] = v
    for key, c77, c88, brk in CROPS:
        crops[key] = {"name": cn77[c77] if c77 else cn88[c88], "hst77": c77, "hst88": c88, "classBreak": bool(brk and c77 and c88)}
        if c88: crops[key]["name88"] = cn88[c88]
        if c77: crops[key]["name77"] = cn77[c77]
    m77 = {"010": ("area", 1000.0), "020": ("yield", 0.1), "030": ("prod", 1.0)}; m88 = {"005": ("area", 1.0), "020": ("yield", 0.1), "030": ("prod", 1.0)}
    by77 = {c[1]: c[0] for c in CROPS if c[1]}; by88 = {c[2]: c[0] for c in CROPS if c[2]}
    n = 0
    for rows, bykey, meas, cvar, rvar in ((r77, by77, m77, "AFGRØDE", "OMRÅDE"), (r88, by88, m88, "AFGRØDE", "LANDSDEL")):
        for d in rows:
            key = bykey.get(d[cvar]); m = meas.get(d["MÆNGDE4"])
            if not key or not m or d["v"] is None or d[rvar] not in regions: continue
            put(key, d[rvar], m[0], d["Tid"], round(d["v"] * m[1], 4)); n += 1
    log("cosecha", n, "valores")
    res = {}
    for key, rd in data.items():
        res[key] = {rg: {mm: ser(yy) for mm, yy in ms.items()} for rg, ms in rd.items()}
    return {"breakYear": 2025, "regions": regions, "crops": crops, "data": res, "tables": {"HST77": i77.get("updated"), "HST88": i88.get("updated")}}
# ---------------------------------------------------------------- sacrificios
SL_UNITS = {"SLAGEKS": "heads", "GENSLAG": "weight", "PROD": "prod", "PRISER": "price", "SALG": "value"}
def slaughter(tid, cats, since):
    info, rows = table(tid); cn = names(info, "DYRKAT"); out = {}
    for d in rows:
        if d["DYRKAT"] not in cats or d["v"] is None or d["ENHED"] not in SL_UNITS: continue
        p = per(d["Tid"])
        if p < since or (d["v"] == 0 and d["ENHED"] in ("GENSLAG", "PRISER")): continue   # un peso o precio 0 es "no publicado", no un valor
        out.setdefault(cats[d["DYRKAT"]], {}).setdefault(SL_UNITS[d["ENHED"]], {})[p] = d["v"]
    labels = {cats[k]: cn[k] for k in cats}
    return {k: {u: ser(s) for u, s in us.items()} for k, us in out.items()}, labels, info.get("updated"), (info.get("footnote") or {}).get("text", "")
MILK = {"MAELK1": "milk_total", "MAELK11": "milk_dairies", "OKO": "milk_organic", "FMAELK": "fat", "PMAELK": "protein", "PROD4": "butter", "PROD6": "cheese", "PROD10": "smp"}
def milk(since):
    info, rows = table("ANI71"); out = {}
    for d in rows:
        k = MILK.get(d["MÆNGDE4"])
        if not k or d["v"] is None: continue
        p = per(d["Tid"])
        if p >= since: out.setdefault(k, {})[p] = d["v"]
    return {k: ser(s) for k, s in out.items()}, info.get("updated")
def herd():
    i1, r1 = table("SVIN"); pigs = {}
    for d in r1:
        k = {"D29": "total", "D181": "sows", "D223": "piglets", "D28": "fatteners", "D226": "weaners"}.get(d["TYPE"])
        if k and d["v"] is not None: pigs.setdefault(k, {})[per(d["Tid"])] = d["v"]
    i2, r2 = table("KVAEG5"); cattle = {}
    for d in r2:
        k = {"D17": "total", "D14": "dairy_cows", "D15": "suckler_cows", "D136": "heifers", "D53": "male"}.get(d["DYR"])
        if k and d["v"] is not None and d["OMRÅDE"] in REG_KIND: cattle.setdefault(k, {}).setdefault(d["OMRÅDE"], {})[per(d["Tid"])] = d["v"]
    return {"pigs": {k: ser(s) for k, s in pigs.items()}, "cattle": {k: {rg: ser(s) for rg, s in rs.items()} for k, rs in cattle.items()}}, {"SVIN": i1.get("updated"), "KVAEG5": i2.get("updated")}
SUB = {"300": "total", "305": "direct", "310": "basic", "315": "eco_total", "325": "eco_biodiv", "330": "eco_grass", "335": "eco_mowing", "340": "eco_varied", "345": "eco_organic",
       "350": "other_direct", "355": "coupled", "360": "young", "375": "other_total", "380": "natura2000", "390": "organic_invest"}
def subsidies():
    info, rows = table("TILSKUD2"); out = {}; nm = names(info, "TILSKUDSART")
    for d in rows:
        k = SUB.get(d["TILSKUDSART"])
        if k and d["v"] is not None: out.setdefault(k, {})[per(d["Tid"])] = d["v"]
    return {"names": {SUB[c]: nm[c] for c in SUB if c in nm}, "data": {k: ser(s) for k, s in out.items()}}, info.get("updated")
def build():
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "DK",
           "source": {"id": "dst_dk", "name": "Statistics Denmark (Danmarks Statistik), StatBank", "url": "https://www.statbank.dk/", "license": "CC BY 4.0",
                      "tables": ["HST77", "HST88", "ANI41", "ANI51", "ANI71", "SVIN", "KVAEG5", "TILSKUD2"]},
           "units": {"area": "ha", "yield": "t/ha", "prod": "thousand tonnes", "heads": "thousand head", "weight": "kg", "price": "DKK øre per kg", "value": "million DKK", "milk": "million kg", "herd": "head (pigs: thousand)", "subsidy": "million DKK"}}
    h = build_harvest(); doc["harvest"] = h
    cattle, lc, u41, n41 = slaughter("ANI41", {"KVAEGIALT": "cattle", "VOKSKVAEGIALT": "adult_cattle", "KALVEIALT": "calves", "KOER": "cows", "UNGTYRE": "young_bulls", "KVIER": "heifers"}, "2005-01")
    pigs, lp, u51, n51 = slaughter("ANI51", {"SVINIALT": "pigs", "SLAGTSVIN": "fatteners", "SOER": "sows"}, "2005-01")
    doc["slaughter"] = {"cattle": cattle, "pigs": pigs, "labels": {"cattle": lc, "pigs": lp}, "notes": {"cattle": n41, "pigs": n51}}
    ml, um = milk("2005-01"); doc["milk"] = ml
    hd, uh = herd(); doc["herd"] = hd
    sb, us = subsidies(); doc["subsidies"] = sb
    doc["updated"] = {**h["tables"], "ANI41": u41, "ANI51": u51, "ANI71": um, **uh, "TILSKUD2": us}
    return doc
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True)
    try: doc = build()
    except Exception as e:
        import traceback
        log("FALLO:", type(e).__name__, str(e)[:300])
        if os.environ.get("GITHUB_ACTIONS"): print("::error title=denmark-depth::" + (" | ".join(LOG[-6:]) + " | " + traceback.format_exc()[-1500:])[:3500].replace("%", "%25").replace("\r", "").replace("\n", "%0A"), flush=True)
        (outdir / "denmark-depth-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    h = doc["harvest"]["data"]
    ok = (h.get("cereals", {}).get("000", {}).get("prod") and doc["slaughter"]["pigs"].get("pigs", {}).get("heads") and doc["slaughter"]["cattle"].get("cattle", {}).get("price")
          and doc["milk"].get("milk_total") and doc["herd"]["pigs"].get("total") and doc["herd"]["cattle"].get("dairy_cows", {}).get("000") and doc["subsidies"]["data"].get("direct"))
    if not ok: log("FALLO: faltan bloques esenciales"); (outdir / "denmark-depth-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    (outdir / "denmark-depth.json").write_text(s, encoding="utf-8")
    log("escrito denmark-depth.json", len(s) // 1024, "KB"); (outdir / "denmark-depth-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

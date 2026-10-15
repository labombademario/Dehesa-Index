#!/usr/bin/env python3
"""Italia (ISTAT, esploradati SDMX) -> data/italy-istat/{slaughter,prices,herds,fertilisers,pesticides}.json

Fuente: ISTAT, servicio SDMX https://esploradati.istat.it/SDMXWS/rest (licencia CC BY 4.0, https://www.istat.it/note-legali/).
  - slaughter:   101_1033 macellazioni mensuales (cabezas, peso canal, rendimiento) por categoria de animal, nacional.
  - prices:      101_12_DF_DCSP_PREZZIAGR_10 (indice de precios percibidos, base 2020) y _9 (precios pagados), mensual, nacional.
  - herds:       101_961 existencias de ganado (dic. y jun.) por region.
  - fertilisers: 104_466_DF_DCSP_FERTILIZZANTI_4 fertilizantes distribuidos (t) por tipo y region (2013-2016 vienen en quintales: /10).
  - pesticides:  101_22 principios activos distribuidos (kg) por clase y region, y kg/ha por clase.
Nada se estima: celda ausente = null. Las etiquetas (ingles, con italiano de respaldo) salen de la estructura SDMX de cada flujo.
Uso: python3 scripts/update-it-istat.py [--only slaughter,prices,...]  (--local carpeta: lee CSV guardados <nombre>.csv, sin etiquetas)"""
import argparse, csv, datetime, io, json, re, statistics, sys, time, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://esploradati.istat.it/SDMXWS/rest/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(u, accept, t=280, tries=3):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: return r.read()
        except Exception as e:
            last = e; time.sleep(4 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-90:], str(last)[:120]))
def sdmx_csv(flow, key, q):
    b = http(B + "data/" + flow + "/" + key + "?" + q + "&detail=dataonly", "application/vnd.sdmx.data+csv;version=1.0.0")
    return list(csv.DictReader(io.StringIO(b.decode("utf-8", "replace"))))
def ln(e): return e.tag.rsplit("}", 1)[-1]
XMLLANG = "{http://www.w3.org/XML/1998/namespace}lang"
def labels(flow, dims):
    """{dim: {code: {'en':..., 'it':...}}} desde la estructura SDMX del flujo. Si falla, {} (se usa el codigo)."""
    out = {}
    try:
        root = ET.fromstring(http(B + "dataflow/IT1/" + flow + "/latest?references=descendants&detail=full", "application/vnd.sdmx.structure+xml;version=2.1"))
    except Exception as e:
        log("  etiquetas de", flow, "no disponibles:", str(e)[:100]); return out
    cls = {}
    for cl in root.iter():
        if ln(cl) == "Codelist": cls[cl.get("id")] = cl
    for d in root.iter():
        if ln(d) != "Dimension" or d.get("id") not in dims: continue
        ref = next((r for r in d.iter() if ln(r) == "Ref" and (r.get("id") or "").startswith("CL_")), None)
        cl = cls.get(ref.get("id")) if ref is not None else None
        if cl is None: continue
        m = {}
        for c in cl:
            if ln(c) != "Code": continue
            nm = {}
            for n in c:
                if ln(n) == "Name": nm[n.get(XMLLANG, "")] = (n.text or "").strip()
            m[c.get("id")] = {"en": nm.get("en") or nm.get("it") or c.get("id"), "it": nm.get("it") or nm.get("en") or c.get("id")}
        out[d.get("id")] = m
    return out
TYPOS = {"lahying": "laying", "less then": "less than", "viitelli": "vitelli"}   # erratas evidentes en las etiquetas del ISTAT
def fixtypo(s):
    for a, b in TYPOS.items(): s = s.replace(a, b)
    return s
def lab(L, dim, code):
    x = (L.get(dim) or {}).get(code); return {"en": fixtypo(x["en"]), "it": fixtypo(x["it"])} if x else {"en": code, "it": code}
def num(v):
    try: return None if v in ("", None) else float(v)
    except ValueError: return None
def area_kind(a):
    """IT nacional; ITCD/ITFG macroareas del ISTAT (Nord, Mezzogiorno); ITC/ITD/ITE/ITF/ITG de 3 letras (grandes zonas); 4 caracteres = region; 5+ = provincia."""
    if a == "IT": return "country"
    if a in ("ITCD", "ITFG"): return "macro"
    if len(a) == 3: return "zone"
    if len(a) == 4 and a[:3] in ("ITC", "ITD", "ITE", "ITF", "ITG"): return "region"
    return "province"
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def head(extra):
    d = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "istat", "name": "ISTAT", "url": "https://esploradati.istat.it/databrowser/"}}; d.update(extra); return d
def write(out, name, doc):
    (out / name).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); log("escrito", name, len(json.dumps(doc)) // 1024, "KB")
def get_rows(loc, name, flow, key, q):
    if loc: return list(csv.DictReader(open(Path(loc) / (name + ".csv"), encoding="utf-8")))
    return sdmx_csv(flow, key, q)
def months_axis(ms): return sorted(set(ms))

def do_slaughter(out, loc):
    rows = get_rows(loc, "slaughter_it", "101_1033", "M.IT....", "startPeriod=2019")
    L = {} if loc else labels("101_1033", ["TYPE_OF_HERD"])
    ms = months_axis(r["TIME_PERIOD"] for r in rows); ix = {m: i for i, m in enumerate(ms)}; sp = {}
    def put(code, k, m, v):
        e = sp.setdefault(code, {"heads": [None] * len(ms), "dead": [None] * len(ms), "yield": [None] * len(ms)}); e[k][ix[m]] = v
    for r in rows:
        v = num(r["OBS_VALUE"]); dt = r["DATA_TYPE"]; c = r["TYPE_OF_HERD"]; m = r["TIME_PERIOD"]
        if v is None: continue
        if dt == "HEADSLAUGH": put(c, "heads", m, round(v))
        elif dt == "HEADSLAUGH_THO": put(c + "#t", "heads", m, round(v * 1000))   # respaldo: se usa solo si falta HEADSLAUGH
        elif dt == "TOTDEAWEIG_Q": put(c, "dead", m, round(v / 10, 2))         # quintales -> toneladas
        elif dt == "TOTDEAWEIG_KG": put(c + "#k", "dead", m, round(v / 1000, 2))
        elif dt == "AVEYIELD_PERC": put(c, "yield", m, round(v, 2))
    for c in [k for k in sp if "#" in k]:
        base, kind = c.split("#"); e = sp.pop(c); b = sp.setdefault(base, {"heads": [None] * len(ms), "dead": [None] * len(ms), "yield": [None] * len(ms)})
        k = "heads" if kind == "t" else "dead"
        for i, v in enumerate(e[k]):
            if b[k][i] is None and v is not None: b[k][i] = v
    sp = {c: e for c, e in sp.items() if any(v is not None for v in e["heads"]) or any(v is not None for v in e["dead"])}
    log("macellazioni:", len(sp), "categorias,", len(ms), "meses", ms[0], "->", ms[-1])
    write(out, "slaughter.json", head({"months": ms, "units": {"heads": "cabezas", "dead": "t peso canal", "yield": "% rendimiento"}, "species": {c: dict(label=lab(L, "TYPE_OF_HERD", c), **e) for c, e in sorted(sp.items())},
                                       "note": "Macellazioni mensili ISTAT (dato provvisorio per i mesi più recenti). Peso canal en toneladas (el ISTAT lo publica en quintales o kg)."}))

def do_prices(out, loc):
    res = {}
    for kind, name, flow, idx_t, mom_t, yoy_t, col in (("sold", "price_sold", "101_12_DF_DCSP_PREZZIAGR_10", "76", "81", "82", "SOLD_PRODUCTS"), ("bought", "price_bought", "101_12_DF_DCSP_PREZZIAGR_9", "75", "79", "80", "PURCHASE_PRODUCTS")):
        rows = get_rows(loc, name, flow, "ALL", "startPeriod=2019")
        L = {} if loc else labels(flow, [col])
        ms = months_axis(r["TIME_PERIOD"] for r in rows); ix = {m: i for i, m in enumerate(ms)}; pr = {}
        for r in rows:
            v = num(r["OBS_VALUE"]); k = {idx_t: "index", mom_t: "mom", yoy_t: "yoy"}.get(r["DATA_TYPE"])
            if v is None or k is None: continue
            e = pr.setdefault(r[col], {"index": [None] * len(ms), "mom": [None] * len(ms), "yoy": [None] * len(ms)}); e[k][ix[r["TIME_PERIOD"]]] = round(v, 2)
        pr = {c: e for c, e in pr.items() if any(v is not None for v in e["index"])}
        log("precios", kind, ":", len(pr), "grupos,", len(ms), "meses", ms[0], "->", ms[-1])
        res[kind] = {"months": ms, "items": {c: dict(label=lab(L, col, c), **e) for c, e in sorted(pr.items())}}
    write(out, "prices.json", head({"sold": res["sold"], "bought": res["bought"], "base": "2020=100", "note": "Indici ISTAT dei prezzi dei prodotti venduti e acquistati dagli agricoltori (base 2020). mom = variación sobre el mes anterior, yoy = sobre el mismo mes del año anterior, ambas en %, tal como las publica el ISTAT."}))

def do_herds(out, loc):
    rows = get_rows(loc, "herd", "101_961", "ALL", "startPeriod=2015")
    L = {} if loc else labels("101_961", ["TYPE_OF_HERD", "REF_AREA", "SEX_ANIMAL"])
    ps = months_axis(r["TIME_PERIOD"] for r in rows); ix = {p: i for i, p in enumerate(ps)}; herds = {}; areas = {}
    for r in rows:
        a = r["REF_AREA"]; k = area_kind(a)
        if k == "province": continue
        v = num(r["OBS_VALUE"]); dt = r["DATA_TYPE"]
        if v is None: continue
        if dt == "HE_SAMP_THO": v *= 1000
        elif dt != "HE_SAMP": continue
        key = r["TYPE_OF_HERD"] + "|" + r["SEX_ANIMAL"]; e = herds.setdefault(key, {"label": lab(L, "TYPE_OF_HERD", r["TYPE_OF_HERD"]), "sex": r["SEX_ANIMAL"], "v": {}})
        arr = e["v"].setdefault(a, [None] * len(ps))
        if arr[ix[r["TIME_PERIOD"]]] is None or dt == "HE_SAMP": arr[ix[r["TIME_PERIOD"]]] = round(v)
        areas[a] = {"kind": k, "label": lab(L, "REF_AREA", a)}
    log("existencias:", len(herds), "categorias,", len(areas), "areas,", ps[0], "->", ps[-1])
    write(out, "herds.json", head({"periods": ps, "areas": areas, "herds": dict(sorted(herds.items())), "unit": "cabezas",
                                   "note": "Indagine ISTAT sulle consistenze (dicembre; giugno per suini e alcuni gruppi). sex: 1 maschi, 2 femmine, 9 totale, tal como en la codificación del ISTAT."}))

def do_fert(out, loc):
    if loc: rows = get_rows(loc, "fert4", "", "", "")
    else: rows = sdmx_csv("104_466_DF_DCSP_FERTILIZZANTI_4", "A....ALL.WORLD.ALL.9", "startPeriod=2013")
    L = {} if loc else labels("104_466_DF_DCSP_FERTILIZZANTI_4", ["TYPE_OF_FERTILIZER", "REF_AREA"])
    ys = months_axis(r["TIME_PERIOD"] for r in rows); ix = {y: i for i, y in enumerate(ys)}; types = {}; areas = {}
    for r in rows:
        a = r["REF_AREA"]; k = area_kind(a)
        if k == "province": continue
        if (r.get("TYPE_OF_PLANT_NUTRIENTS"), r.get("PRODUCTION_AREA"), r.get("PRODUCT_TYPE"), r.get("Y_USE_ORGANIC_FARMING")) != ("ALL", "WORLD", "ALL", "9"): continue
        v = num(r["OBS_VALUE"])
        if v is None: continue
        dt = r["DATA_TYPE"]
        if dt == "FERT_DISTRIB_Q": v = v / 10.0          # quintales -> toneladas
        elif dt != "FERT_DISTRIB_T": continue
        t = types.setdefault(r["TYPE_OF_FERTILIZER"], {"label": lab(L, "TYPE_OF_FERTILIZER", r["TYPE_OF_FERTILIZER"]), "v": {}})
        arr = t["v"].setdefault(a, [None] * len(ys))
        if arr[ix[r["TIME_PERIOD"]]] is None or dt == "FERT_DISTRIB_T": arr[ix[r["TIME_PERIOD"]]] = round(v, 1)
        areas[a] = {"kind": k, "label": lab(L, "REF_AREA", a)}
    log("fertilizantes:", len(types), "tipos,", len(areas), "areas,", ys[0], "->", ys[-1])
    write(out, "fertilisers.json", head({"years": ys, "areas": areas, "types": dict(sorted(types.items())), "unit": "t de producto",
                                         "note": "Fertilizzanti distribuiti per uso agricolo (ISTAT). Las cifras de 2013-2016 se publican en quintales y se pasan a toneladas (÷10)."}))

def do_pest(out, loc):
    if loc: rows = get_rows(loc, "fito", "", "", "")
    else: rows = sdmx_csv("101_22", "A..AIKGPP+AIKGHA.ALL..TOT.ALL", "startPeriod=2019")
    L = {} if loc else labels("101_22", ["PLANT_PROTECTION_PROD", "REF_AREA"])
    ys = months_axis(r["TIME_PERIOD"] for r in rows); ix = {y: i for i, y in enumerate(ys)}; classes = {}; areas = {}; perha = {}
    for r in rows:
        a = r["REF_AREA"]; k = area_kind(a)
        if k == "province" or r["TYPE_OF_CROP"] != "ALL" or r["NUMBER_PHYTOS_TREAT"] != "TOT" or r["LEVEL_OF_TOXICITY"] != "ALL": continue
        v = num(r["OBS_VALUE"])
        if v is None: continue
        c = r["PLANT_PROTECTION_PROD"]; dt = r["DATA_TYPE"]
        if dt == "AIKGPP": classes.setdefault(c, {"label": lab(L, "PLANT_PROTECTION_PROD", c), "v": {}})["v"].setdefault(a, [None] * len(ys))[ix[r["TIME_PERIOD"]]] = round(v)
        elif dt == "AIKGHA": perha.setdefault(c, {"label": lab(L, "PLANT_PROTECTION_PROD", c), "v": {}})["v"].setdefault(a, [None] * len(ys))[ix[r["TIME_PERIOD"]]] = round(v, 2)
        areas[a] = {"kind": k, "label": lab(L, "REF_AREA", a)}
    log("fitosanitarios:", len(classes), "clases,", len(perha), "clases kg/ha,", len(areas), "areas,", ys[0], "->", ys[-1])
    write(out, "pesticides.json", head({"years": ys, "areas": areas, "classes": dict(sorted(classes.items())), "perHa": dict(sorted(perha.items())), "unit": "kg de sustancia activa", "unitPerHa": "kg de sustancia activa por ha",
                                         "note": "Prodotti fitosanitari distribuiti per uso agricolo (ISTAT): principi attivi contenuti, por clase y región. Es lo distribuido para la venta, no lo aplicado en campo."}))

JOBS = {"slaughter": do_slaughter, "prices": do_prices, "herds": do_herds, "fertilisers": do_fert, "pesticides": do_pest}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "italy-istat")); ap.add_argument("--only", default=""); ap.add_argument("--local", default=""); ap.add_argument("--log", default=str(ROOT / "data" / "italy-istat-log.txt"))
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True); only = [x for x in a.only.split(",") if x] or list(JOBS); fails = 0
    for n in only:
        try: JOBS[n](out, a.local or None)
        except Exception as e: fails += 1; log("ERROR", n, str(e)[:200])
    Path(a.log).write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if fails == len(only): raise SystemExit("ningun conjunto se pudo leer: no se toca nada")
if __name__ == "__main__": main()

#!/usr/bin/env python3
"""Grecia: precios al consumo de alimentos y, por región y unidad regional, ocupados y valor añadido de la agricultura -> data/greece-more-stats.json
(formato de ficheros de estadísticas por país; país EL). Mismo planteamiento que scripts/update-it-istat-more.py y scripts/update-de-more.py.

1. IPCA/HICP de Grecia por subclase ECOICOP v2 de alimentos y bebidas (01.x), vino y cerveza, más el índice general (Eurostat prc_hicp_minr, 2025=100,
   mensual desde 2005; lo elabora ELSTAT). Grupo «prices».
2. Ocupados en agricultura, silvicultura y pesca (NACE A) según la Encuesta de Población Activa, 15 años y más, ambos sexos, miles de personas, anual, para
   Grecia, sus 4 zonas NUTS 1 y sus 13 regiones NUTS 2 (Eurostat lfst_r_lfe2en2). Grupo «income». Estimación por encuesta: en regiones pequeñas el error es mayor.
3. Cuentas regionales (Eurostat, a partir de ELSTAT), sección A, anual desde 2000, para Grecia, NUTS 1, NUTS 2 y las unidades regionales NUTS 3:
   valor añadido bruto a precios corrientes (nama_10r_3gva, millones de euros) y empleo de las cuentas (nama_10r_3empers, miles de personas ocupadas).
   Las cuentas cuentan personas ocupadas de otra forma que la encuesta: no se mezclan ni se comparan entre sí. Grupo «income».
Licencia: Eurostat, política de reutilización (Decisión 2011/833/UE; registro eurostat). Valores tal cual. Si algo falla, no se escribe nada.
Uso: update-el-more.py [--out DIR] [--cache DIR]"""
import datetime, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
EU = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
SG = "Eurostat"
N1 = ["EL4", "EL5", "EL6"]   # EL3 (Ática, NUTS 1) es el mismo territorio que EL30 (NUTS 2): solo se publica EL30
N2 = ["EL30", "EL41", "EL42", "EL43", "EL51", "EL52", "EL53", "EL54", "EL61", "EL62", "EL63", "EL64", "EL65"]
LOG = []
CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def n3():
    ids = sorted(set(re.findall(r'"id":"(EL\d{3})"', (ROOT / "vendor" / "el-nuts3.js").read_text(encoding="utf-8"))))
    if len(ids) < 40: raise RuntimeError("vendor/el-nuts3.js: solo %d unidades" % len(ids))
    return ids
def http(u, name, t=240, tries=4):
    if CACHE and (CACHE / name).exists(): return (CACHE / name).read_bytes()
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept="application/json")), timeout=t) as r: b = r.read()
            if not b: raise ValueError("respuesta vacía")
            if CACHE: (CACHE / name).write_bytes(b)
            return b
        except Exception as e:
            last = e
            if getattr(e, "code", None) in (400, 404): break
            time.sleep(6 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-120:], str(last)[:140]))
def cells(ds, q, name):
    """[(registro de dimensiones, valor)] y etiquetas de geo"""
    j = json.loads(http(EU + ds + "?format=JSON&lang=EN&" + q, name))
    ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}
    out = []
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); out.append(({ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}, float(v)))
    return out, j["dimension"]["geo"]["category"]["label"] if "geo" in j["dimension"] else {}, j
def mk(sid, group, label, unit, freq, pts, sg, minpts, note=None):
    pl = sorted(pts.items())
    if len(pl) < minpts: log("se omite %s: solo %d puntos" % (sid, len(pl))); return None
    prev = pl[-2][1] if len(pl) > 1 else None
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": pl[-1][0], "latest": pl[-1][1],
         "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": sg}
    if note: s["note"] = note
    return s
def name(lab, g): return "Greece" if g == "EL" else (lab.get(g) or g)

def hicp():
    C, _, j = cells("prc_hicp_minr", "geo=EL&unit=I25&sinceTimePeriod=2005-01", "hicp-el.json")
    lab = j["dimension"]["coicop18"]["category"]["label"]; by = {}
    for rec, v in C:
        if rec["geo"] != "EL" or rec["unit"] != "I25" or rec["freq"] != "M": raise ValueError("celda fuera de lo pedido: %s" % rec)
        c = rec["coicop18"]
        if c == "TOTAL" or (len(c) == 7 and (c.startswith("CP01") or c in ("CP02121", "CP02130"))): by.setdefault(c, {})[rec["time"]] = v
    out = []
    for c, pts in sorted(by.items()):
        nm = lab[c].replace(" (ND)", "").replace(" (S)", "")
        s = mk("el-hicp-" + ("cp00" if c == "TOTAL" else c.lower()), "prices", "Consumer price index (HICP, 2025=100): %s, Greece" % ("All items" if c == "TOTAL" else nm), "index 2025=100", "monthly", pts,
               "Eurostat prc_hicp_minr (ELSTAT)", 60)
        if s: out.append(s)
    if len(out) < 40: raise RuntimeError("IPCA: solo %d series" % len(out))
    log("IPCA: %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def lfs():
    geos = ["EL"] + N1 + N2
    C, lab, _ = cells("lfst_r_lfe2en2", "nace_r2=A&sex=T&age=Y_GE15&unit=THS_PER&sinceTimePeriod=2000&" + "&".join("geo=" + g for g in geos), "lfs-el.json")
    by = {}
    for rec, v in C:
        if (rec["nace_r2"], rec["sex"], rec["age"], rec["unit"]) != ("A", "T", "Y_GE15", "THS_PER"): raise ValueError("celda fuera de lo pedido: %s" % rec)
        by.setdefault(rec["geo"], {})[rec["time"]] = round(v, 1)
    out = []
    for g in geos:
        if g not in by: log("ocupados (encuesta): sin datos para %s" % g); continue
        s = mk("el-lfs-emp-agr-" + g.lower(), "income", "Employed persons in agriculture, forestry and fishing (Labour Force Survey, 15 and over, thousand persons): %s" % name(lab, g),
               "thousand persons", "annual", by[g], SG + " lfst_r_lfe2en2 (ELSTAT Labour Force Survey)", 8,
               None if g == "EL" else "Estimación por encuesta: en las regiones pequeñas el error de muestreo es mayor y Eurostat no publica las cifras menos fiables.")
        if s: out.append(s)
    if len([s for s in out if s["id"][-4:].upper() in N2]) < 12: raise RuntimeError("ocupados (encuesta): solo %d series" % len(out))
    log("ocupados (encuesta): %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def accounts():
    geos = ["EL"] + N1 + N2 + n3(); out = []
    for ds, q, key, lab_t, unit, nd in (("nama_10r_3gva", "unit=CP_MEUR", "gva-agr", "Gross value added of agriculture, forestry and fishing, current prices (regional accounts)", "EUR million", 1),
                                        ("nama_10r_3empers", "unit=THS&wstatus=EMP", "acc-emp-agr", "Persons employed in agriculture, forestry and fishing (regional accounts, thousand persons)", "thousand persons", 2)):
        by = {}; lab = {}
        for k in range(0, len(geos), 25):   # la URL con 70 geos es larga: en tandas
            C, l2, _ = cells(ds, "nace_r2=A&" + q + "&sinceTimePeriod=2000&" + "&".join("geo=" + g for g in geos[k:k + 25]), "%s-el-%d.json" % (ds, k)); lab.update(l2)
            for rec, v in C:
                if rec["nace_r2"] != "A": raise ValueError("celda fuera de lo pedido: %s" % rec)
                by.setdefault(rec["geo"], {})[rec["time"]] = round(v, nd)
        n = 0
        for g in geos:
            if g not in by: continue
            s = mk("el-%s-%s" % (key, g.lower()), "income", "%s: %s" % (lab_t, name(lab, g)), unit, "annual", by[g], SG + " %s (ELSTAT regional accounts)" % ds, 8,
                   "Cuentas regionales: el último año puede revisarse. Empleo medido como en las cuentas, distinto de la Encuesta de Población Activa." if key == "acc-emp-agr" else "Cuentas regionales: el último año puede revisarse.")
            if s: out.append(s); n += 1
        if n < 60: raise RuntimeError("%s: solo %d series" % (ds, n))
        log("%s: %d series, último %s" % (ds, n, max(s["latestPeriod"] for s in out if s["id"].startswith("el-" + key + "-"))))
    return out

def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    series = []
    for nm, fn in (("IPCA", hicp), ("ocupados (encuesta)", lfs), ("cuentas regionales", accounts)):
        try: series += fn()
        except Exception as e: log("ERROR: %s: %s; no se escribe nada" % (nm, e)); return 1
    if len({s["id"] for s in series}) != len(series): log("ERROR: ids repetidos"); return 1
    src = {"name": "Eurostat (HICP prc_hicp_minr, Labour Force Survey lfst_r_lfe2en2, regional accounts nama_10r_3gva and nama_10r_3empers), compiled by ELSTAT",
           "url": "https://ec.europa.eu/eurostat/web/regions/database", "license": "Eurostat reuse policy (Commission Decision 2011/833/EU)"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"EL": {"name": "Greece", "extend": True, "source": src, "series": series}}, "log": LOG[-12:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "greece-more-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "greece-more-stats.json")
    log("escrito: %d series" % len(series)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "greece-more-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

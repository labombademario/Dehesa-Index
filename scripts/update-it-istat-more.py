#!/usr/bin/env python3
"""Italia: precios al consumo de alimentos, ocupados agrarios y valor añadido agrario por región -> data/italy-istat-more-stats.json
(formato de ficheros de estadísticas por país; país IT). Mismo planteamiento que scripts/update-spain-ine.py para España.

1. Índice de precios de consumo armonizado (IPCA/HICP) de Italia por subclase ECOICOP v2 de alimentos y bebidas (01.x), vino y cerveza, más el índice general
   (Eurostat prc_hicp_minr, 2025=100, mensual desde 2005). El IPCA de Italia lo elabora ISTAT; se toma de Eurostat porque el servicio SDMX de ISTAT solo
   publica la base 2025 desde enero de 2026 y las bases anteriores en flujos separados, mientras que Eurostat ofrece la serie ya enlazada. Grupo «prices».
2. Ocupados en agricultura, silvicultura y pesca (Ateco 2007 sección A) por región, trimestral desde 2004, miles de personas
   (ISTAT, encuesta de fuerzas de trabajo, flujo 150_938_DF_DCCV_OCCUPATIT1_22). Grupo «income».
3. Valor añadido bruto de la rama A por región, a precios corrientes y en volumen encadenado (año de referencia 2020), millones de euros, anual desde 1995
   (ISTAT, conti economici territoriali, flujo 93_1227_DF_DCCN_TNA1_1, última edición publicada). Grupo «income».
Regiones: las 20 regiones (Trentino-Alto Adige como una, ITDA) y el total de Italia; no se publican macroáreas ni provincias autónomas por separado.
Licencias: ISTAT CC BY 4.0 (istat); Eurostat, política de reutilización (Decisión 2011/833/UE). Valores tal cual.
Uso: update-it-istat-more.py [--out DIR] [--cache DIR]"""
import csv, datetime, io, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
B = "https://esploradati.istat.it/SDMXWS/rest/"
EU = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
REG = {"IT": "Italia", "ITC1": "Piemonte", "ITC2": "Valle d'Aosta", "ITC3": "Liguria", "ITC4": "Lombardia", "ITDA": "Trentino-Alto Adige", "ITD3": "Veneto",
       "ITD4": "Friuli-Venezia Giulia", "ITD5": "Emilia-Romagna", "ITE1": "Toscana", "ITE2": "Umbria", "ITE3": "Marche", "ITE4": "Lazio", "ITF1": "Abruzzo",
       "ITF2": "Molise", "ITF3": "Campania", "ITF4": "Puglia", "ITF5": "Basilicata", "ITF6": "Calabria", "ITG1": "Sicilia", "ITG2": "Sardegna"}
LOG = []
CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(u, accept, name, t=290, tries=4):
    if CACHE and (CACHE / name).exists(): return (CACHE / name).read_bytes()
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: b = r.read()
            if not b: raise ValueError("respuesta vacía")
            if CACHE: (CACHE / name).write_bytes(b)
            return b
        except Exception as e:
            last = e
            if getattr(e, "code", None) in (400, 404): break
            time.sleep(6 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-110:], str(last)[:140]))
def istat(flow, key, q, name):
    b = http(B + "data/" + flow + "/" + key + "?" + q + "&detail=dataonly", "application/vnd.sdmx.data+csv;version=1.0.0", name)
    return list(csv.DictReader(io.StringIO(b.decode("utf-8", "replace"))))
def fnum(s):
    try: return float(s)
    except (TypeError, ValueError): return None
def mk(sid, group, label, unit, freq, pts, sg, minpts, note=None):
    pl = sorted(pts.items())
    if len(pl) < minpts: log("se omite %s: solo %d puntos" % (sid, len(pl))); return None
    prev = pl[-2][1] if len(pl) > 1 else None
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": pl[-1][0], "latest": pl[-1][1],
         "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": sg}
    if note: s["note"] = note
    return s

def hicp():
    b = http(EU + "?format=JSON&lang=EN&geo=IT&unit=I25&sinceTimePeriod=2005-01", "application/json", "hicp-it.json")
    j = json.loads(b); ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}
    lab = j["dimension"]["coicop18"]["category"]["label"]; by = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        if rec["geo"] != "IT" or rec["unit"] != "I25" or rec["freq"] != "M": raise ValueError("celda fuera de lo pedido: %s" % rec)
        c = rec["coicop18"]
        if c == "TOTAL" or (len(c) == 7 and (c.startswith("CP01") or c in ("CP02121", "CP02130"))): by.setdefault(c, {})[rec["time"]] = float(v)
    out = []
    for c, pts in sorted(by.items()):
        nm = lab[c].replace(" (ND)", "").replace(" (S)", "")
        s = mk("it-hicp-" + ("cp00" if c == "TOTAL" else c.lower()), "prices", "Consumer price index (HICP, 2025=100): %s, Italy" % ("All items" if c == "TOTAL" else nm), "index 2025=100", "monthly", pts,
               "Eurostat prc_hicp_minr (ISTAT)", 60)
        if s: out.append(s)
    if len(out) < 40: raise RuntimeError("IPCA: solo %d series" % len(out))
    log("IPCA: %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def employment():
    rows = istat("150_938_DF_DCCV_OCCUPATIT1_22", "Q.............", "startPeriod=2004", "occ.csv")
    by = {}
    for r in rows:
        if r.get("ECON_ACTIVITY_NACE_2007") != "A" or r.get("REF_AREA") not in REG: continue
        if (r.get("SEX"), r.get("AGE"), r.get("POSIZ_PROF")) != ("9", "Y15-89", "9"): continue
        v = fnum(r.get("OBS_VALUE")); p = r.get("TIME_PERIOD", "")
        if v is None or len(p) != 7 or p[4:6] != "-Q": continue
        by.setdefault(r["REF_AREA"], {})[p] = round(v, 3)
    out = []
    for rc in REG:
        if rc not in by: continue
        s = mk("it-istat-occ-agr-" + rc.lower(), "income", "Employed in agriculture, forestry and fishing (Labour Force Survey, thousand persons): %s" % REG[rc], "thousand persons", "quarterly",
               by[rc], "ISTAT Rilevazione forze di lavoro", 20, None if rc == "IT" else "Estimación por encuesta: en las regiones pequeñas el error de muestreo es mayor.")
        if s: out.append(s)
    if len(out) < 18: raise RuntimeError("ocupados: solo %d series" % len(out))
    log("ocupados: %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def gva():
    rows = istat("93_1227_DF_DCCN_TNA1_1", "A..B1G_B_W2_S1.A.Z.Z.V+L_2020.N.B.", "startPeriod=1995", "tna.csv")
    ed = max({r["EDITION"] for r in rows}, key=lambda e: (int(e[:4]), int(e[5:]) if e[5:].isdigit() else 0)); log("valor añadido: edición", ed)   # «2025M12» va después de «2025M6»
    val, vol = {}, {}
    for r in rows:
        if r["EDITION"] != ed or r["REF_AREA"] not in REG: continue
        v = fnum(r.get("OBS_VALUE"))
        if v is None: continue
        (val if r["VALUATION"] == "V" else vol).setdefault(r["REF_AREA"], {})[r["TIME_PERIOD"]] = round(v, 1)
    out = []
    for rc in REG:
        for d, key, lab, unit in ((val, "gva-agr", "Gross value added of agriculture, forestry and fishing, current prices", "EUR million"),
                                  (vol, "gva-agr-vol", "Gross value added of agriculture, forestry and fishing, chain-linked volumes (reference year 2020)", "EUR million (chain-linked 2020)")):
            if rc not in d: continue
            s = mk("it-istat-%s-%s" % (key, rc.lower()), "income", "%s: %s" % (lab, REG[rc]), unit, "annual", d[rc], "ISTAT Conti economici territoriali", 10,
                   "ISTAT, edición %s de las cuentas territoriales; el último año puede revisarse." % ed)
            if s: out.append(s)
    if len(out) < 38: raise RuntimeError("valor añadido: solo %d series" % len(out))
    log("valor añadido: %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    series = []
    for name, fn in (("IPCA", hicp), ("ocupados", employment), ("valor añadido", gva)):
        try: series += fn()
        except Exception as e: log("ERROR: %s: %s; no se escribe nada" % (name, e)); return 1
    if len({s["id"] for s in series}) != len(series): log("ERROR: ids repetidos"); return 1
    src = {"name": "ISTAT (rilevazione forze di lavoro, conti economici territoriali) and Eurostat HICP for Italy (prc_hicp_minr)", "url": "https://esploradati.istat.it/databrowser/", "license": "CC BY 4.0 (ISTAT); Eurostat reuse policy"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"IT": {"name": "Italy", "extend": True, "source": src, "series": series}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "italy-istat-more-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "italy-istat-more-stats.json")
    log("escrito: %d series" % len(series)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "italy-istat-more-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

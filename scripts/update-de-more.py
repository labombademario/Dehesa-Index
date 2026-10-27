#!/usr/bin/env python3
"""Alemania: precios al consumo de alimentos y, por Land, ocupados y valor añadido de la agricultura -> data/germany-more-stats.json
(formato de ficheros de estadísticas por país; país DE). Mismo planteamiento que scripts/update-it-istat-more.py para Italia.

1. Índice de precios de consumo armonizado (IPCA/HICP) de Alemania por subclase ECOICOP v2 de alimentos y bebidas (01.x), vino y cerveza, más el índice
   general (Eurostat prc_hicp_minr, 2025=100, mensual desde 2005). Lo elabora Destatis; se toma de Eurostat porque ofrece la serie ya enlazada en la
   clasificación ECOICOP v2, igual que para Italia y España. Grupo «prices».
2. Por Land y para Alemania, sección A (agricultura, silvicultura y pesca), anual desde 1991, del Arbeitskreis «Volkswirtschaftliche Gesamtrechnungen der
   Länder» (VGRdL), Reihe 1 Band 1, fichero Excel publicado en statistikportal.de (se localiza en la página de resultados por Land):
   valor añadido bruto a precios corrientes (hoja 2.2, millones de euros), índice de volumen encadenado (hoja 7.2, 2020=100),
   ocupados (hoja 11.2, miles de personas) y valor añadido por ocupado (hoja 4.2, euros). Grupo «income».
   El Arbeitskreis permite reproducir citando la fuente y pide que los ocupados no se publiquen con más de un decimal en miles: se redondean así.
   Las cifras de Berlín, Hamburgo y Bremen son muy pequeñas (agricultura casi inexistente) y se publican tal cual.
Valores tal cual; Dehesa Index solo redondea. Si falta algo o algo falla, no se escribe nada.
Uso: update-de-more.py [--out DIR] [--cache DIR]"""
import datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
EU = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
VPAGE = "https://www.statistikportal.de/de/vgrdl/ergebnisse-laenderebene/bruttoinlandsprodukt-bruttowertschoepfung"
VBASE = "https://www.statistikportal.de"
# columnas del Excel (encabezado sin guiones ni saltos) -> (id, nombre)
LAND = [("Baden-Württemberg", "bw"), ("Bayern", "by"), ("Berlin", "be"), ("Brandenburg", "bb"), ("Bremen", "hb"), ("Hamburg", "hh"), ("Hessen", "he"),
        ("Mecklenburg-Vorpommern", "mv"), ("Niedersachsen", "ni"), ("Nordrhein-Westfalen", "nw"), ("Rheinland-Pfalz", "rp"), ("Saarland", "sl"),
        ("Sachsen", "sn"), ("Sachsen-Anhalt", "st"), ("Schleswig-Holstein", "sh"), ("Thüringen", "th"), ("Deutschland", "de")]
SHEETS = [("2.2", "in Mio. Euro", "gva-agr", "Gross value added of agriculture, forestry and fishing, current prices", "EUR million", 1),
          ("7.2", "Index (2020 = 100)", "gva-agr-vol", "Gross value added of agriculture, forestry and fishing, price-adjusted chain index (2020=100)", "index 2020=100", 2),
          ("11.2", "in Tausend Personen", "emp-agr", "Persons employed in agriculture, forestry and fishing (thousand persons)", "thousand persons", 1),
          ("4.2", "in Euro", "gva-agr-per-emp", "Gross value added per person employed in agriculture, forestry and fishing, current prices", "EUR", 0)]
LOG = []
CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(u, name, accept="*/*", t=240, tries=4):
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
def mk(sid, group, label, unit, freq, pts, sg, minpts, note=None):
    pl = sorted(pts.items())
    if len(pl) < minpts: log("se omite %s: solo %d puntos" % (sid, len(pl))); return None
    prev = pl[-2][1] if len(pl) > 1 else None
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": pl[-1][0], "latest": pl[-1][1],
         "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": sg}
    if note: s["note"] = note
    return s

def hicp():
    j = json.loads(http(EU + "?format=JSON&lang=EN&geo=DE&unit=I25&sinceTimePeriod=2005-01", "hicp-de.json", "application/json"))
    ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}
    lab = j["dimension"]["coicop18"]["category"]["label"]; by = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        if rec["geo"] != "DE" or rec["unit"] != "I25" or rec["freq"] != "M": raise ValueError("celda fuera de lo pedido: %s" % rec)
        c = rec["coicop18"]
        if c == "TOTAL" or (len(c) == 7 and (c.startswith("CP01") or c in ("CP02121", "CP02130"))): by.setdefault(c, {})[rec["time"]] = float(v)
    out = []
    for c, pts in sorted(by.items()):
        nm = lab[c].replace(" (ND)", "").replace(" (S)", "")
        s = mk("de-hicp-" + ("cp00" if c == "TOTAL" else c.lower()), "prices", "Consumer price index (HICP, 2025=100): %s, Germany" % ("All items" if c == "TOTAL" else nm), "index 2025=100", "monthly", pts,
               "Eurostat prc_hicp_minr (Destatis)", 60)
        if s: out.append(s)
    if len(out) < 40: raise RuntimeError("IPCA: solo %d series" % len(out))
    log("IPCA: %d series, último %s" % (len(out), max(s["latestPeriod"] for s in out))); return out

def norm(h): return re.sub(r"[\s\-]+", "", str(h or "").replace("_x000D_", ""))   # «Baden-_x000D_\nWürttemberg» y «Rheinland-Pfalz» -> sin guiones ni espacios

def vgrdl():
    import openpyxl
    page = http(VPAGE, "vgrdl.html", "text/html").decode("utf-8", "replace")
    links = re.findall(r'href="([^"]*vgrdl_r1b1_bs(\d{4})[^"]*\.xlsx)"', page)
    if not links: raise RuntimeError("no aparece el Excel de la Reihe 1 Band 1 en %s" % VPAGE)
    href, yr = max(links, key=lambda x: (x[1], x[0]))
    url = href if href.startswith("http") else VBASE + href; log("VGRdL:", url)
    wb = openpyxl.load_workbook(io.BytesIO(http(url, "vgrdl_r1b1.xlsx")), read_only=True, data_only=True)
    out = []; edition = None
    for r in wb["Impressum"].iter_rows(values_only=True):
        t = " ".join(str(c) for c in r if c)
        if t.startswith("Erschienen im"): edition = t.replace("Erschienen im", "").strip()
    for sh, block, key, lab, unit, nd in SHEETS:
        rows = [r for r in wb[sh].iter_rows(values_only=True) if any(c is not None for c in r)]
        hdr = next(r for r in rows if r and r[0] == "Jahr"); cols = [norm(c) for c in hdr]
        if "Land- und Forstwirtschaft, Fischerei (A)" not in " ".join(str(c) for r in rows[:4] for c in r if c): raise RuntimeError("hoja %s: no es la sección A" % sh)
        idx = {}
        for name, lid in LAND:
            if norm(name) not in cols: raise RuntimeError("hoja %s: falta la columna %s (%s)" % (sh, name, cols))
            idx[lid] = (name, cols.index(norm(name)))   # la primera; «Deutschland» se repite al final
        cur = None; data = {lid: {} for _, lid in LAND}
        for r in rows:
            if r[0] is None and isinstance(r[1], str): cur = r[1].strip(); continue
            if cur != block or not isinstance(r[0], (int, float)): continue
            y = str(int(r[0]))
            for lid, (name, ci) in idx.items():
                v = r[ci] if ci < len(r) else None
                if isinstance(v, (int, float)): data[lid][y] = round(float(v), nd) if nd else int(round(v))
        for name, lid in LAND:
            s = mk("de-vgrdl-%s-%s" % (key, lid), "income", "%s: %s" % (lab, name), unit, "annual", data[lid], "VGRdL (Statistische Ämter des Bundes und der Länder)", 20,
                   "Volkswirtschaftliche Gesamtrechnungen der Länder, Reihe 1 Band 1 (%s); los últimos años pueden revisarse." % (edition or "edición %s" % yr))
            if s: out.append(s)
    if len(out) < 4 * 17: raise RuntimeError("VGRdL: solo %d series" % len(out))
    last = max(s["latestPeriod"] for s in out)
    if int(last) < datetime.date.today().year - 3: raise RuntimeError("VGRdL: último año %s demasiado antiguo" % last)
    log("VGRdL: %d series, último %s" % (len(out), last)); return out

def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    series = []
    for name, fn in (("IPCA", hicp), ("VGRdL", vgrdl)):
        try: series += fn()
        except Exception as e: log("ERROR: %s: %s; no se escribe nada" % (name, e)); return 1
    if len({s["id"] for s in series}) != len(series): log("ERROR: ids repetidos"); return 1
    src = {"name": "Eurostat HICP for Germany (prc_hicp_minr, compiled by Destatis) and Arbeitskreis Volkswirtschaftliche Gesamtrechnungen der Länder (VGRdL)",
           "url": VPAGE, "license": "Eurostat reuse policy; VGRdL: reproduction permitted with source attribution"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"DE": {"name": "Germany", "extend": True, "source": src, "series": series}}, "log": LOG[-12:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "germany-more-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "germany-more-stats.json")
    log("escrito: %d series" % len(series)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "germany-more-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

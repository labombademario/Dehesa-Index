#!/usr/bin/env python3
"""Suiza: estadisticas agrarias abiertas de la Oficina Federal de Estadistica (BFS/OFS) y produccion lactea de Eurostat -> data/switzerland-bfs-stats.json
(countries.CH, extend: se suma a FOAG y MeteoSwiss).

Conjuntos (opendata.swiss, licencia «Open use. Must provide the source» = terms_by, comprobada el 10-oct-2026 en cada recurso):
  - Erlöspreisstatistik: Mengen und Preise zur Produktion der Landwirtschaft (T 7.4.2.12, cuentas economicas de la agricultura):
    cantidades producidas (miles de t; vino en miles de hl) y precios de produccion (CHF/t a precios basicos, que incluyen las
    subvenciones al producto; vino en CHF/hl), anual desde 1985. Animales en peso vivo; la leche incluye la leche dada a los terneros.
    La BFS marca el ultimo año como «Schätzung/Estimation» y el anterior como provisional (p). La ESTIMACION NO SE PUBLICA:
    la columna se descarta. El provisional se publica con su nota.
  - Produzentenpreisindex Landwirtschaft (T 7.2.3.2.1) e Einkaufspreisindex landwirtschaftlicher Produktionsmittel (T 7.2.3.2.2):
    medias anuales, indice diciembre 2020 = 100, elaborados por Agristat (Union Suiza de Campesinos) y publicados por la BFS.
  - Eurostat apro_mk_pobta (geo=CH): mantequilla y queso producidos en las centrales lecheras (miles de t, anual). Datos de un pais
    de la AELC: reutilizables con cita segun la politica de Eurostat.
Los enlaces de descarga de la BFS cambian con cada publicacion: se resuelven en cada ejecucion con la API de opendata.swiss.
Nada se suma, se resta ni se recalcula. Modo desarrollo: CH_BFS_DIR=<carpeta con erloes.xlsx, ppi.xlsx, epi.xlsx, mkpobta.json>."""
import datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "switzerland-bfs-stats.json"
LOGF = ROOT / "data" / "switzerland-bfs-log.txt"
H = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
DEV = os.environ.get("CH_BFS_DIR")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180).read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))

def ods_xlsx(package, dev_name):
    """Descarga el XLS en aleman (o el primero) del conjunto de opendata.swiss y comprueba que su licencia sigue siendo terms_by."""
    if DEV: return (Path(DEV) / dev_name).read_bytes(), "dev"
    p = json.loads(get("https://opendata.swiss/api/3/action/package_show?id=" + package))["result"]
    res = [r for r in p["resources"] if (r.get("format") or "").upper() in ("XLS", "XLSX")]
    if not res: raise RuntimeError(package + ": sin recurso XLS")
    bad = [r for r in res if not str(r.get("rights", "")).endswith("#terms_by")]
    if bad: raise RuntimeError(package + ": la licencia ya no es terms_by (" + str(bad[0].get("rights")) + "); revisar antes de publicar")
    de = [r for r in res if re.search(r"/de/|Produzentenpreis|Einkaufspreis|Erlöspreis", json.dumps(r, ensure_ascii=False))] or res
    url = de[0].get("download_url") or de[0].get("url")
    return get(url), url

def sheet_rows(b, want=None):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
    out = {}
    for ws in wb.worksheets:
        out[ws.title] = [list(r) for r in ws.iter_rows(values_only=True)]
    return out

OUTS = {}
def put(sid, group, label, unit, freq, pts, src, note=None):
    d = {}
    for p, v in pts:
        if isinstance(v, (int, float)): d[str(p)] = float(v)
    pts = [[p, round(v, 4)] for p, v in sorted(d.items())]
    if len(pts) < 3 or int(pts[-1][0][:4]) < datetime.date.today().year - 3:
        log("descartada", sid, len(pts)); return
    last, prev = pts[-1], pts[-2]
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": last[0], "latest": last[1],
         "changePct": round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, "points": pts, "sourceGroup": src}
    if note: s["note"] = note
    OUTS[sid] = s

# ---------- Erlöspreisstatistik ----------
# etiqueta alemana o francesa -> (clave, etiqueta inglesa del sitio). El maiz forrajero (silo) se omite: no es maiz grano.
PROD = [((r"^Weizen und Spelz", r"^Blé et épeautre"), "wheat", "Wheat and spelt"), ((r"^Roggen", r"^Seigle"), "rye", "Rye and maslin"),
        ((r"^Gerste", r"^Orge"), "barley", "Barley"), ((r"^Hafer", r"^Avoine"), "oats", "Oats and summer cereal mixtures"),
        ((r"^Körnermais", r"^Maïs \(grains\)"), "grain-maize", "Grain maize"), ((r"^Raps", r"^Graines de colza"), "rapeseed", "Rapeseed (rape and turnip rape)"),
        ((r"^Eiweiss|^Körnerleguminosen|^Protein", r"^Protéagineux"), "protein-crops", "Protein crops"), ((r"^Rohtabak|^Tabak", r"^Tabac"), "tobacco", "Raw tobacco"),
        ((r"^Zuckerrüben", r"^Betteraves sucrières"), "sugar-beet", "Sugar beet"), ((r"^Kartoffeln", r"^Pommes de terre"), "potatoes", "Potatoes"),
        ((r"^Tafeläpfel", r"^Pommes de table"), "apples", "Table apples (fruit)"), ((r"^Tafelbirnen", r"^Poires de table"), "pears", "Table pears (fruit)"),
        ((r"^Pfirsiche", r"^Pêches"), "peaches", "Peaches (fruit)"), ((r"^Aprikosen", r"^Abricots"), "apricots", "Apricots (fruit)"),
        ((r"^Kirschen", r"^Cerises"), "cherries", "Cherries (fruit)"), ((r"^Erdbeeren", r"^Fraises"), "strawberries", "Strawberries (fruit)"),
        ((r"^Trauben|^Weintrauben", r"^Raisins"), "grapes", "Wine grapes"), ((r"^Wein(e)? ", r"^Wein$", r"^Vins "), "wine", "Wine, total"),
        ((r"^Tafelwein|^Landwein", r"^Vin de table"), "wine-table", "Wine, table wine"), ((r"^Qualitätswein", r"^Vin de qualité"), "wine-quality", "Wine, quality wine"),
        ((r"^Rindvieh|^Rinder", r"^Bovins"), "cattle", "Cattle (excluding calves), live weight"), ((r"^Kälber", r"^Veaux"), "calves", "Calves, live weight"),
        ((r"^Schweine", r"^Porcins"), "pigs", "Pigs, live weight"), ((r"^Schafe und Ziegen", r"^Ovins et caprins"), "sheep-goats", "Sheep and goats, live weight"),
        ((r"^Geflügel", r"^Volailles"), "poultry", "Poultry, live weight"), ((r"^Hühner|^Hähnchen|^Poulets", r"^Poulets"), "chickens", "Chickens (poultry), live weight"),
        ((r"^Milch", r"^Lait"), "milk", "Milk (incl. milk fed to calves)"), ((r"^Eier", r"^Oeufs|^Œufs"), "eggs", "Eggs"),
        ((r"^Rohwolle|^Wolle", r"^Laine"), "wool", "Raw wool"), ((r"^Honig", r"^Miel"), "honey", "Honey")]
def match(label):
    for pats, key, en in PROD:
        if any(re.search(p, label) for p in pats): return key, en
    return None
def year_cols(rows):
    """-> ([(col, año, provisional)], numero de nota de la estimacion). Se descartan las columnas marcadas como estimacion."""
    est = None
    for r in rows:
        t = str(r[0] or "")
        m = re.match(r"^\s*(\d)\)\s*(Schätzung|Estimation|Stima)", t, re.I)
        if m: est = m.group(1)
    hdr = next(r for r in rows if str(r[0] or "").strip() in ("Produkt", "Produit"))
    cols = []
    for i, h in enumerate(hdr[1:], 1):
        if h is None: continue
        hs = str(h).strip(); m = re.match(r"^(\d{4})", hs)
        if not m: continue
        if est and re.search(r"\b%s\)" % est, hs): continue   # estimacion: fuera
        cols.append((i, m.group(1), bool(re.search(r"\bp\b|semi|provis", hs, re.I))))
    return cols, est
def erloes():
    b, url = ods_xlsx("erlospreisstatistik-mengen-und-preise-zur-produktion-der-landwirtschaft2", "erloes.xlsx")
    sh = sheet_rows(b); n = 0
    for title, rows in sh.items():
        kind = "qty" if re.search(r"Mengen|Quantit", title) else "price" if re.search(r"Preise|Prix", title) else None
        if not kind: continue
        cols, est = year_cols(rows); prov = [y for _, y, p in cols if p]
        log("Erlöspreisstatistik", title, "años", cols[0][1], "..", cols[-1][1], "(estimacion descartada: nota %s)" % est, "provisional:", prov)
        for r in rows:
            lab = str(r[0] or "").strip(); m = match(lab) if lab else None
            if not m: continue
            key, en = m; wine = key.startswith("wine") and key != "wine-grapes" and "grapes" not in key
            pts = [(y, r[i]) for i, y, _ in cols if i < len(r)]
            note = "BFS, economic accounts for agriculture (unit value statistics). %s%s" % ("Provisional year(s): %s. " % ", ".join(prov) if prov else "", "The BFS estimate for the latest year is not published here.")
            if kind == "qty":
                put("ch-bfs-qty-%s" % key, "production", "%s: production (BFS)" % en, "thousand hl" if wine else "thousand t", "annual", pts, "BFS Erlöspreisstatistik T 7.4.2.12", note)
            else:
                put("ch-bfs-price-%s" % key, "prices", "%s: producer price at basic prices (BFS)" % en, "CHF/hl" if wine else "CHF/t", "annual", pts, "BFS Erlöspreisstatistik T 7.4.2.12",
                    note + " Basic prices include product subsidies.")
            n += 1
    log("Erlöspreisstatistik: series", n, "de", url)

# ---------- indices de precios (Agristat / BFS) ----------
PPI = [((r"^Landwirtschaftliche Produkte", r"^Produits agricoles"), "total", "Agricultural products, total"), ((r"^Getreide", r"^Céréales"), "cereals", "Cereals"),
       ((r"^Handelsgewächse", r"^Cultures industrielles|^Plantes industrielles"), "industrial", "Industrial crops"), ((r"^Futterpflanzen", r"^Plantes fourragères"), "forage", "Forage plants"),
       ((r"^Frischgemüse", r"^Légumes frais"), "vegetables", "Fresh vegetables"), ((r"^Kartoffeln", r"^Pommes de terre"), "potatoes", "Potatoes"),
       ((r"^Obst", r"^Fruits"), "fruit", "Fruit"), ((r"^Rindvieh|^Rinder", r"^Bovins"), "cattle", "Cattle"), ((r"^Schweine", r"^Porcins"), "pigs", "Pigs"),
       ((r"^Schafe", r"^Ovins"), "sheep", "Sheep"), ((r"^Geflügel", r"^Volailles"), "poultry", "Poultry"), ((r"^Rohmilch", r"^Lait cru"), "milk", "Raw milk"),
       ((r"^Eier", r"^Oeufs|^Œufs"), "eggs", "Eggs"), ((r"^Sonstige tierische", r"^Autres produits animaux"), "other-animal", "Other animal products")]
EPI = [((r"^Landwirtschaftliche Produktionsmittel|^Produktionsmittel, total", r"^Agents de production agricole, total"), "total", "Agricultural inputs, total"),
       ((r"^Saatgut|^Saat- und Pflanzgut", r"^Semences"), "seeds", "Seeds and planting stock"), ((r"^Energie", r"^Energie"), "energy", "Energy and lubricants"),
       ((r"^Dünge", r"^Engrais"), "fertilisers", "Fertilisers and soil improvers"), ((r"^Pflanzenschutz", r"^Produits phytosanitaires"), "plant-protection", "Plant protection products"),
       ((r"^Tierarzt", r"^Vétérinaire"), "veterinary", "Veterinary expenses"), ((r"^Futtermittel", r"^Aliments pour animaux"), "feed", "Animal feedingstuffs"),
       ((r"^Unterhalt der Maschinen|^Instandhaltung von Maschinen", r"^Entretien des machines"), "machinery-maint", "Maintenance of machinery and equipment"),
       ((r"^Unterhalt der Gebäude|^Instandhaltung von Bauten", r"^Entretien des bâtiments"), "buildings-maint", "Maintenance of buildings"),
       ((r"^Übrige Waren|^Sonstige Waren", r"^Autres biens et services"), "other", "Other goods and services"),
       ((r"^Investitionsgüter|^Ausrüstungsgüter", r"^Biens d'équipements"), "equipment", "Capital goods (machinery, equipment, vehicles)"),
       ((r"^Bauten", r"^Constructions"), "buildings", "Buildings"), ((r"^Übrige Investitionen|^Sonstige Investitionen", r"^Autres investissements"), "other-invest", "Other investment")]
def index_table(package, dev, table, spec, prefix, group, what):
    b, url = ods_xlsx(package, dev)
    rows = next(iter(sheet_rows(b).values()))
    hdr = next(r for r in rows if sum(1 for c in r if isinstance(c, int) and 1990 <= c <= 2100) >= 5)
    hdr_i = rows.index(hdr)
    # la columna de ponderacion (encabezado «Gewichtung/Pondération» en la fila de arriba) lleva como cabecera el año base: no es un dato
    weight = {i for r in rows[max(0, hdr_i - 2):hdr_i] for i, c in enumerate(r) if re.search(r"Gewichtung|Pondération|Ponderazione", str(c or ""))}
    cols = [(i, str(c)) for i, c in enumerate(hdr) if isinstance(c, int) and 1990 <= c <= 2100 and i not in weight]
    if not weight: raise RuntimeError(table + ": no se encuentra la columna de ponderacion; revisar la estructura")
    n = 0
    for r in rows[hdr_i + 1:]:
        lab = str(r[0] or "").strip()
        if not lab: continue
        m = next(((k, en) for pats, k, en in spec if any(re.search(p, lab) for p in pats)), None)
        if not m: continue
        k, en = m
        put("ch-bfs-%s-%s" % (prefix, k), group, "%s: %s (Dec 2020=100, annual mean; Agristat/BFS)" % (en, what), "index Dec 2020=100", "annual",
            [(y, r[i]) for i, y in cols if i < len(r)], "BFS %s (Agristat)" % table)
        n += 1
    log(table, "series", n, "años", cols[0][1], "..", cols[-1][1], "de", url)

# ---------- Eurostat: mantequilla y queso (centrales lecheras) ----------
def dairy():
    if DEV: j = json.loads((Path(DEV) / "mkpobta.json").read_text())
    else: j = json.loads(get("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apro_mk_pobta?lang=EN&geo=CH&milkitem=PRO&dairyprod=D6100&dairyprod=D7100"))
    ids, size = j["id"], j["size"]; cats = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]; o = [None] * len(idx)
        for k, v in (idx.items() if isinstance(idx, dict) else enumerate(idx)): o[v] = k
        cats[d] = o
    by = {}
    for k, v in j.get("value", {}).items():
        k = int(k); rec = {}
        for d, n in reversed(list(zip(ids, size))): rec[d] = cats[d][k % n]; k //= n
        if rec.get("milkitem") == "PRO" and rec.get("geo") == "CH": by.setdefault(rec["dairyprod"], []).append((rec["time"], v))
    for code, key, en in (("D6100", "butter", "Butter"), ("D7100", "cheese", "Cheese")):
        put("ch-es-dairy-%s" % key, "production", "%s: production in dairies (Eurostat)" % en, "thousand t", "annual", by.get(code, []), "Eurostat apro_mk_pobta")
    log("apro_mk_pobta CH:", sorted(by))

def main():
    ok = 0
    for name, fn in (("erloes", erloes), ("ppi", lambda: index_table("produzentenpreisindex-landwirtschaft", "ppi.xlsx", "T 7.2.3.2.1", PPI, "ppi", "idx_perc", "producer price index")),
                     ("epi", lambda: index_table("einkaufspreisindex-landwirtschaftlicher-produktionsmittel5", "epi.xlsx", "T 7.2.3.2.2", EPI, "inputidx", "idx_pag", "input price index (prices paid by farmers)")),
                     ("dairy", dairy)):
        try: fn(); ok += 1
        except Exception as e: log("ERROR", name, repr(e)[:300])
    LOGF.write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if len(OUTS) < 20 or ok < 3:
        log("FALLO: demasiado pocas series (%d) o bloques (%d)" % (len(OUTS), ok)); LOGF.write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"CH": {"name": "Switzerland", "extend": True,
                                "source": {"name": "Swiss Federal Statistical Office (BFS/OFS) with Agristat; Eurostat for dairy products", "url": "https://www.bfs.admin.ch/bfs/en/home/statistics/agriculture-forestry.html",
                                           "license": "opendata.swiss: Open use. Must provide the source (terms_by); Eurostat reuse policy"},
                                "series": sorted(OUTS.values(), key=lambda s: s["id"])}}, "log": LOG[-40:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito", OUT.name, len(OUTS), "series"); LOGF.write_text("\n".join(LOG) + "\n", encoding="utf-8")
    return 0
if __name__ == "__main__": sys.exit(main())

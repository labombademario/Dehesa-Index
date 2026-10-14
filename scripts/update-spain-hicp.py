#!/usr/bin/env python3
"""España: indices de precios de CONSUMO de la mantequilla y el queso (Eurostat, IPCA/HICP, ECOICOP v2) -> data/spain-hicp-stats.json (formato de ficheros de estadisticas por pais).
Desde el 13-oct-2026 el mismo fichero lleva tambien, de Eurostat y para ES: precio de la tierra agricola y alquileres (apri_lprc, apri_lrnt; EUR/ha, anual, grupo «inputs» como los valores de la tierra de EE. UU.)
y agricultura ecologica (org_cropar, org_coptyp, apro_mt_lsorg; grupo «organic»). Se reutiliza este script/fichero para no abrir un fichero nuevo con 7 registros; el nombre se queda por historia.

Conjunto prc_hicp_minr (indice mensual, 2025=100), pais ES, partidas CP01152 «Butter and other oils and fats derived from milk» y CP01145 «Cheese». Son indices de precios al CONSUMIDOR
(lo que paga el hogar), no precios en origen: la etiqueta de cada serie lo dice («Consumer price index») y el grupo es «prices», no «idx_perc» (precios percibidos por el agricultor).
La matriz de cobertura los cuenta como indice de precios del producto porque el indicador es de ese producto, pero no sustituyen a un precio industrial o en origen.
Licencia: politica de reutilizacion de Eurostat (Decision 2011/833/UE), con cita de la fuente. Valores tal cual; un mes sin dato (Eurostat lo marca asi) no tiene punto.
Uso: update-spain-hicp.py [--out DIR]"""
import datetime, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
SINCE = "2015-01"
ITEMS = {"CP01152": ("butter and other fats derived from milk", "butter"), "CP01145": ("cheese", "cheese")}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=120).read().decode("utf-8")
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %r" % (url[:120], last))
def parse(j):
    """JSON-stat 2.0 de prc_hicp_minr (freq, unit, coicop18, geo, time) -> {coicop: {periodo: valor}}"""
    ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}; out = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        if rec["geo"] != "ES" or rec["unit"] != "I25" or rec["freq"] != "M": raise ValueError("celda fuera de lo pedido: %s" % rec)
        out.setdefault(rec["coicop18"], {})[rec["time"]] = float(v)
    return out
LAND = [("apri_lprc", "EUR_HA", {"ARA": "arable land", "ARAIB": "irrigable arable land", "ARAXIB": "non-irrigable arable land", "J0000": "permanent grassland"}, "land-price", "Agricultural land price", 10),
        ("apri_lrnt", "EUR_HA", {"ARA_J0000": "arable land and/or permanent grassland", "ARA": "arable land", "J0000": "permanent grassland"}, "land-rent", "Agricultural land rent (one year)", 6)]
def parse_any(j, geo="ES"):
    """JSON-stat 2.0 de Eurostat -> {(dimension, codigo)...: {periodo: valor}}; solo celdas de geo pedido y con valor."""
    ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}; out = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        if rec["geo"] != geo: raise ValueError("celda fuera de lo pedido: %s" % rec)
        key = tuple((k, rec[k]) for k in ids if k not in ("freq", "geo", "time"))
        out.setdefault(key, {})[rec["time"]] = float(v)
    return out
def mk(sid, group, label, unit, pts, ds, minpts):
    pl = sorted(pts.items())
    if len(pl) < minpts: raise ValueError("%s: solo %d puntos (se esperan %d o mas)" % (sid, len(pl), minpts))
    prev = pl[-2][1] if len(pl) > 1 else None
    return {"id": sid, "group": group, "label": label, "unit": unit, "frequency": "annual", "latestPeriod": pl[-1][0], "latest": pl[-1][1],
            "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": "Eurostat " + ds}
def land_series(docs):
    """docs: {dataset: json}. Precio y alquiler de la tierra agricola de Espana, EUR/ha, tal cual los publica Eurostat."""
    out = []
    for ds, unit, names, key, title, minpts in LAND:
        by = parse_any(docs[ds])
        for code, nm in names.items():
            pts = by.get((("unit", unit), ("agriprod", code)))
            if not pts: log("AVISO: %s %s sin datos" % (ds, code)); continue
            out.append(mk("es-%s-%s" % (key, code.lower()), "inputs", "%s: %s, Spain, EUR/ha (Eurostat %s)" % (title, nm, ds), "EUR/ha", pts, ds, minpts))
    if len(out) < 6: raise ValueError("tierra: solo %d series (se esperan 6 o mas)" % len(out))
    return out
ORG_LS = {"A2000": "bovine animals", "A2300F": "dairy cows", "A3100": "pigs", "A4100": "sheep", "A4200": "goats"}
def organic_series(docs):
    """Agricultura ecologica de Espana (Eurostat): superficie, operadores registrados y censo ganadero ecologico."""
    out = []
    by = parse_any(docs["org_cropar"])
    for code, nm in (("UAAXK0000", "utilised agricultural area"), ("ARA", "arable land")):
        pts = by.get((("unit", "HA"), ("crops", code), ("agprdmet", "TOTAL")))
        if pts: out.append(mk("es-organic-area-%s" % code.lower(), "organic", "Organic area (fully converted + in conversion): %s, Spain (Eurostat org_cropar)" % nm, "ha", pts, "org_cropar", 8))
    pts = by.get((("unit", "PC_UAA"), ("crops", "UAAXK0000"), ("agprdmet", "TOTAL")))
    if pts: out.append(mk("es-organic-share-uaa", "organic", "Organic share of total utilised agricultural area, Spain (Eurostat org_cropar)", "%", pts, "org_cropar", 8))
    by = parse_any(docs["org_coptyp"])
    for code, nm in (("OP", "all operators"), ("PRD_AGRI", "agricultural producers")):
        pts = by.get((("unit", "NR"), ("operator", code), ("procstat", "REG_END")))
        if pts: out.append(mk("es-organic-op-%s" % code.lower(), "organic", "Organic operators registered at year end: %s, Spain (Eurostat org_coptyp)" % nm, "number", pts, "org_coptyp", 8))
    by = parse_any(docs["apro_mt_lsorg"])
    for code, nm in ORG_LS.items():
        pts = by.get((("animals", code), ("unit", "THS_HD")))
        if pts: out.append(mk("es-organic-ls-%s" % code.lower(), "organic", "Organic livestock: %s, Spain (Eurostat apro_mt_lsorg)" % nm, "thousand head", pts, "apro_mt_lsorg", 8))
    if len(out) < 8: raise ValueError("ecologico: solo %d series (se esperan 8 o mas)" % len(out))
    return out
EXTRA_Q = {"apri_lprc": "unit=EUR_HA", "apri_lrnt": "unit=EUR_HA", "org_cropar": "agprdmet=TOTAL&crops=UAAXK0000&crops=ARA",
           "org_coptyp": "procstat=REG_END&operator=OP&operator=PRD_AGRI", "apro_mt_lsorg": "animals=" + "&animals=".join(ORG_LS) + "&unit=THS_HD"}
def fetch_extra():
    base = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
    return {ds: json.loads(get(base + ds + "?format=JSON&lang=EN&geo=ES&sinceTimePeriod=2005&" + q)) for ds, q in EXTRA_Q.items()}
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    url = API + "?format=JSON&lang=EN&geo=ES&unit=I25&sinceTimePeriod=%s&" % SINCE + "&".join("coicop18=" + c for c in ITEMS)
    try: by = parse(json.loads(get(url)))
    except Exception as e: log("ERROR:", e); return 1
    series = []
    for code, (txt, key) in ITEMS.items():
        pl = sorted(by.get(code, {}).items())
        if len(pl) < 60: log("ERROR: %s solo trae %d meses (se esperan 60 o mas); no se escribe nada" % (code, len(pl))); return 1
        prev = pl[-2][1] if len(pl) > 1 else None
        series.append({"id": "es-hicp-" + key, "group": "prices", "label": "Consumer price index (HICP, 2025=100): %s, Spain (Eurostat prc_hicp_minr %s)" % (txt, code), "unit": "index 2025=100", "frequency": "monthly",
                       "latestPeriod": pl[-1][0], "latest": pl[-1][1], "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": "Eurostat prc_hicp_minr"})
        log(code, key, len(pl), "meses; ultimo", pl[-1][0])
    try:
        docs = fetch_extra(); extra = land_series(docs) + organic_series(docs)
    except Exception as e: log("ERROR: tierra/ecologico:", e); return 1
    for x in extra: log(x["id"], len(x["points"]), "puntos; ultimo", x["latestPeriod"], x["latest"])
    series += extra
    src = {"name": "Eurostat – HICP (prc_hicp_minr), agricultural land prices and rents (apri_lprc, apri_lrnt), organic farming (org_cropar, org_coptyp, apro_mt_lsorg)", "url": "https://ec.europa.eu/eurostat/web/hicp", "license": "Eurostat reuse policy (Decision 2011/833/EU)"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": series}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "spain-hicp-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-hicp-stats.json")
    return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-hicp-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

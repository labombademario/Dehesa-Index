#!/usr/bin/env python3
"""Alemania: lluvia y temperatura media mensual por Land, medias de área del DWD -> data/de-climate-laender.json

Fuente: Deutscher Wetterdienst, Climate Data Center, «regional_averages_DE» (Gebietsmittel por Bundesland desde 1881), licencia CC BY 4.0
(registro dwd_cdc): https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/monthly/
  precipitation/regional_averages_rr_MM.txt (mm) y air_temperature_mean/regional_averages_tm_MM.txt (°C), un fichero por mes del año.
Los valores por Land son los del DWD tal cual. Lo que calcula Dehesa Index: la normal 1991-2020 de cada Land y mes (media de esos 30 años de la propia
serie del DWD) y la anomalía (lluvia en % sobre la normal; temperatura en °C de diferencia).
El DWD no publica Berlín, Hamburgo ni Bremen por separado: Berlín usa «Brandenburg/Berlin» y Hamburgo y Bremen «Niedersachsen/Hamburg/Bremen»; se indica.
Solo meses cerrados (el DWD publica el mes al terminar). Historial mensual de anomalías desde 2001. Si falta algún Land o algo falla, no se escribe nada.
Uso: update-de-climate-laender.py [--out DIR] [--cache DIR]"""
import datetime, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
B = "https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/monthly/"
PAGE = B
# id del mapa -> (nombre, columna del DWD)
LAND = {"BW": ("Baden-Württemberg", "Baden-Wuerttemberg"), "BY": ("Bayern", "Bayern"), "BE": ("Berlin", "Brandenburg/Berlin"), "BB": ("Brandenburg", "Brandenburg"),
        "HB": ("Bremen", "Niedersachsen/Hamburg/Bremen"), "HH": ("Hamburg", "Niedersachsen/Hamburg/Bremen"), "HE": ("Hessen", "Hessen"), "MV": ("Mecklenburg-Vorpommern", "Mecklenburg-Vorpommern"),
        "NI": ("Niedersachsen", "Niedersachsen"), "NW": ("Nordrhein-Westfalen", "Nordrhein-Westfalen"), "RP": ("Rheinland-Pfalz", "Rheinland-Pfalz"), "SL": ("Saarland", "Saarland"),
        "SN": ("Sachsen", "Sachsen"), "ST": ("Sachsen-Anhalt", "Sachsen-Anhalt"), "SH": ("Schleswig-Holstein", "Schleswig-Holstein"), "TH": ("Thüringen", "Thueringen"),
        "DE": ("Deutschland", "Deutschland")}
NORMAL = (1991, 2020); HIST_FROM = "2001-01"
LOG = []; CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, name, tries=4):
    if CACHE and (CACHE / name).exists(): return (CACHE / name).read_bytes()
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r: b = r.read()
            if CACHE: (CACHE / name).write_bytes(b)
            return b
        except Exception as e: last = e; time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %r" % (url, last))
def read(var, short):
    """{columna: {AAAA-MM: valor}}"""
    out = {}
    for m in range(1, 13):
        txt = get(B + "%s/regional_averages_%s_%02d.txt" % (var, short, m), "%s_%02d.txt" % (short, m)).decode("latin-1")
        lines = [l for l in txt.splitlines() if l.strip()]
        hi = next(i for i, l in enumerate(lines) if l.startswith("Jahr;Monat;"))
        cols = [c.strip() for c in lines[hi].split(";")]
        for l in lines[hi + 1:]:
            p = [c.strip() for c in l.split(";")]
            if len(p) < 3 or not p[0].isdigit(): continue
            per = "%s-%02d" % (p[0], int(p[1]))
            for c, v in zip(cols[2:], p[2:]):
                if not c: continue
                try: out.setdefault(c, {})[per] = float(v)
                except ValueError: pass
    return out
def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    try: RR, TM = read("precipitation", "rr"), read("air_temperature_mean", "tm")
    except Exception as e: log("ERROR:", e); return 1
    today = datetime.date.today(); last_closed = (today.replace(day=1) - datetime.timedelta(days=1)).strftime("%Y-%m")
    units = []
    for lid, (name, col) in LAND.items():
        if col not in RR or col not in TM: log("ERROR: el DWD no trae la columna %s" % col); return 1
        rr, tm = RR[col], TM[col]
        nr = {m: [rr["%d-%02d" % (y, m)] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in rr] for m in range(1, 13)}
        nt = {m: [tm["%d-%02d" % (y, m)] for y in range(NORMAL[0], NORMAL[1] + 1) if "%d-%02d" % (y, m) in tm] for m in range(1, 13)}
        if any(len(v) < 30 for v in nr.values()) or any(len(v) < 30 for v in nt.values()): log("ERROR: %s sin normal completa" % name); return 1
        nr = {m: sum(v) / len(v) for m, v in nr.items()}; nt = {m: sum(v) / len(v) for m, v in nt.items()}
        def rec(p):
            m = int(p[5:]); r = {}
            if p in rr: r.update(precipMm=round(rr[p], 1), precipBaselineMm=round(nr[m], 1), precipAnomalyPct=round((rr[p] / nr[m] - 1) * 100, 1))
            if p in tm: r.update(tempC=round(tm[p], 1), tempBaselineC=round(nt[m], 1), tempAnomalyC=round(tm[p] - nt[m], 2))
            return r
        pers = sorted(p for p in set(rr) | set(tm) if p <= last_closed)
        y0, m0 = int(last_closed[:4]), int(last_closed[5:]); first_recent = "%d-%02d" % (y0 - 1, m0)
        months = [dict(period=p, **rec(p)) for p in pers if p >= first_recent and rec(p)]
        P, T = [], []
        for p in [x for x in pers if x >= HIST_FROM]:
            r = rec(p); P.append(None if "precipAnomalyPct" not in r else round(r["precipAnomalyPct"])); T.append(r.get("tempAnomalyC") if r.get("tempAnomalyC") is None else round(r["tempAnomalyC"], 1))
        u = {"id": lid, "name": name, "region": lid, "dwdArea": col, "months": months, "history": {"from": HIST_FROM, "precipAnomalyPct": P, "tempAnomalyC": T}}
        if col != name and lid != "DE": u["note"] = "El DWD no publica %s por separado: se muestra el área «%s»." % (name, col)
        units.append(u)
    lp = max(u["months"][-1]["period"] for u in units)
    if lp < (today.replace(day=1) - datetime.timedelta(days=70)).strftime("%Y-%m"): log("ERROR: último mes %s demasiado antiguo" % lp); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "lastPeriod": lp, "baseline": "%d-%d" % NORMAL,
           "source": {"id": "dwd_cdc", "name": "Deutscher Wetterdienst, Climate Data Center: regional averages (Gebietsmittel) by Land", "url": PAGE, "license": "CC BY 4.0"},
           "methodology": {
             "es": "Lluvia y temperatura media mensual de cada Land tal como las publica el Deutscher Wetterdienst (medias de área). La normal 1991-2020 y la diferencia con ella las calcula Dehesa Index con la propia serie del DWD. Berlín, Hamburgo y Bremen no se publican por separado: se usan las áreas Brandenburg/Berlin y Niedersachsen/Hamburg/Bremen.",
             "en": "Monthly rainfall and mean temperature for each Land as published by the Deutscher Wetterdienst (area averages). The 1991-2020 normal and the difference from it are calculated by Dehesa Index from the DWD's own series. Berlin, Hamburg and Bremen are not published separately: the Brandenburg/Berlin and Niedersachsen/Hamburg/Bremen areas are used.",
             "fr": "Pluie et température moyenne mensuelles de chaque Land telles que publiées par le Deutscher Wetterdienst (moyennes de zone). La normale 1991-2020 et l’écart sont calculés par Dehesa Index à partir de la série du DWD. Berlin, Hambourg et Brême ne sont pas publiés séparément : on utilise les zones Brandenburg/Berlin et Niedersachsen/Hamburg/Bremen.",
             "it": "Pioggia e temperatura media mensili di ogni Land come le pubblica il Deutscher Wetterdienst (medie d’area). La normale 1991-2020 e lo scarto sono calcolati da Dehesa Index sulla serie del DWD. Berlino, Amburgo e Brema non sono pubblicati separatamente: si usano le aree Brandenburg/Berlin e Niedersachsen/Hamburg/Bremen."},
           "missing": [], "units": units, "log": LOG[-10:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "de-climate-laender.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "de-climate-laender.json")
    log("escrito: %d unidades, último %s" % (len(units), lp)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "de-climate-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

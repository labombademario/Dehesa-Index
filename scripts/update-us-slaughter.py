#!/usr/bin/env python3
"""Sacrificio diario de EE. UU. (USDA AMS, informe MARS 3208 «Daily Livestock and Poultry Slaughter») -> data/us-markets/slaughter.json
Cabezas sacrificadas por dia y especie (vacuno, terneros, cerdo, ovino, pollo joven) bajo inspeccion federal, tal como las publica el informe:
ESTIMACION del dia (el informe sale hacia las 12:00 hora del Este) con comparacion de hace una semana y de hace un ano, acumulado de la semana y del
ano, y la division del vacuno (novillos/vaquillas y vacas/toros) del dia anterior. Solo cabezas: el informe no trae pesos ni produccion de carne.
Cada informe repite el dia anterior ya revisado: para cada fecha se conserva la fila del informe MAS RECIENTE. Si algo no se entiende, no se escribe nada.
Requiere MARS_API_KEY (solo del entorno; nunca se escribe). Uso: update-us-slaughter.py [--days N] [--outdir DIR]"""
import base64, datetime, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
KEY = os.environ.get("MARS_API_KEY", ""); REPORT = 3208; KEEP_DAYS = 800
SPECIES = {"cattle": "Cattle", "calves": "Calves", "hogs": "Hogs", "sheep": "Sheep", "chicken": "Chicken (Young)"}
COLS = ["date", "head", "weekAgo", "yearAgo", "wtd", "prevWtd", "lyWtd", "ytd", "prevYtd", "pctChange", "revised"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a)
    if KEY: s = s.replace(KEY, "***")
    LOG.append(s); print(s, flush=True)
def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            rq = urllib.request.Request(url, headers={"Authorization": "Basic " + base64.b64encode((KEY + ":").encode()).decode(), "Accept": "application/json", "User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)"})
            with urllib.request.urlopen(rq, timeout=180) as r: return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = "HTTP %s" % e.code
            if e.code in (400, 401, 403, 404): break
        except Exception as e: last = repr(e)[:200]
        time.sleep(4 * (i + 1))
    raise RuntimeError(last)
def num(v):
    try:
        x = float(str(v).replace(",", "").strip()); return x if x == x else None
    except Exception: return None
def iso(s):
    try: return datetime.datetime.strptime(str(s)[:10], "%m/%d/%Y").date().isoformat()
    except Exception: return None
def to_int(v):
    x = num(v); return None if x is None else int(round(x))
def parse(secs):
    """-> ({especie: {fecha: (informe, fila)}}, {fecha: {steersHeifers, cowsBulls}})"""
    days = {k: {} for k in SPECIES}; cls = {}; rev = {v: k for k, v in SPECIES.items()}
    for s in secs:
        name = s.get("reportSection") or ""
        for r in s.get("results") or []:
            sd = str(r.get("slaughter_date") or "")[:10]; rd = iso(r.get("report_date")); head = to_int(r.get("slaughter"))
            if not sd or not rd or head is None or "Header" in name: continue
            if r.get("commodity") == "Cattle" and r.get("class") in ("Steers/Heifers", "Cows/Bulls"):
                k = "steersHeifers" if r["class"] == "Steers/Heifers" else "cowsBulls"
                if cls.setdefault(sd, {}).get("_rd", "") <= rd: cls[sd][k] = head; cls[sd]["_rd"] = rd
                continue
            sp = rev.get(r.get("commodity"))
            if not sp or r.get("class") != "All": continue
            row = [sd, head, to_int(r.get("week_ago")), to_int(r.get("year_ago")), to_int(r.get("week_to_date")), to_int(r.get("prev_week_to_date")), to_int(r.get("last_year_week_to_date")),
                   to_int(r.get("current_year_to_date")), to_int(r.get("previous_year_to_date")), num(r.get("%_change")), 1 if str(r.get("revision")).lower() == "yes" else 0]
            if sd not in days[sp] or days[sp][sd][0] <= rd or (days[sp][sd][0] == rd and r.get("period") == "Current"): days[sp][sd] = (rd, row)
    for v in cls.values(): v.pop("_rd", None)
    return days, cls
def main():
    outdir = Path(sys.argv[sys.argv.index("--outdir") + 1]) if "--outdir" in sys.argv else ROOT / "data" / "us-markets"; outdir.mkdir(parents=True, exist_ok=True)
    fp = outdir / "slaughter.json"; old = json.loads(fp.read_text(encoding="utf-8")) if fp.exists() else None
    days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else (14 if old else 400)
    if not KEY: log("falta MARS_API_KEY"); return 1
    end = datetime.date.today(); beg = end - datetime.timedelta(days=days)
    url = "https://marsapi.ams.usda.gov/services/v1.2/reports/%d?q=report_begin_date=%s:%s&allSections=true" % (REPORT, beg.strftime("%m/%d/%Y"), end.strftime("%m/%d/%Y"))
    try: d = get(url)
    except Exception as e: log("MARS", REPORT, "error", e); return 1
    secs = d if isinstance(d, list) else [d]
    log("secciones:", [(s.get("reportSection"), len(s.get("results") or [])) for s in secs])
    new, ncls = parse(secs)
    if not all(new[k] for k in SPECIES): log("faltan especies en la respuesta:", {k: len(v) for k, v in new.items()}); return 1
    merged = {}
    for k in SPECIES:
        have = {r[0]: r for r in ((old or {}).get("species", {}).get(k, {}).get("rows") or [])}
        have.update({sd: v[1] for sd, v in new[k].items()})
        merged[k] = [have[x] for x in sorted(have)][-KEEP_DAYS:]
    mcls = dict((old or {}).get("cattleClasses") or {}); mcls.update(ncls)
    cut = (end - datetime.timedelta(days=KEEP_DAYS)).isoformat(); mcls = {k: v for k, v in sorted(mcls.items()) if k >= cut}
    for k, rows in merged.items():
        for r in rows:
            if not 0 <= r[1] <= (80_000_000 if k == "chicken" else 2_000_000): log("valor fuera de rango", k, r); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sourceId": "usda_ams_mars",
           "report": {"id": REPORT, "title": "Daily Livestock and Poultry Slaughter", "url": "https://mymarketnews.ams.usda.gov/viewReport/%d" % REPORT},
           "note": "Estimacion diaria de animales sacrificados bajo inspeccion federal (FIS), publicada por USDA AMS hacia las 12:00 hora del Este; se revisa al dia siguiente. Solo cabezas: no hay pesos ni produccion de carne. Pollo: solo pollo joven.",
           "unit": "head", "columns": COLS, "species": {k: {"label": SPECIES[k], "rows": merged[k]} for k in SPECIES}, "cattleClasses": mcls}
    fp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("escrito", fp.name, {k: len(v) for k, v in merged.items()}, "ultimo dia", max(r[0] for r in merged["hogs"]))
    return 0
if __name__ == "__main__":
    rc = main(); (ROOT / "data" / "us-markets" / "slaughter-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); sys.exit(rc)

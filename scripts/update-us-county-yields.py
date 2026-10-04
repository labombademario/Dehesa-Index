#!/usr/bin/env python3
"""EE. UU. rendimiento, superficie cosechada y produccion por CONDADO: USDA NASS Quick Stats -> data/us-county/yields/<cultivo>.json + data/us-county/status.json
Fuente: encuestas de NASS (county estimates), nivel COUNTY, periodo YEAR, todas las practicas. Una consulta por serie (short_desc) y ano.
NASS publica estimaciones por condado solo donde la encuesta lo permite y la cobertura cambia de un ano a otro (maiz: unos 1.500 condados en 2024).
Lo que NASS no publica o suprime ((D) y similares) queda como hueco (null), nunca como cero. 'OTHER COUNTIES' (codigo 998) es la suma que NASS
publica para los condados de un estado que no se publican por separado: se guarda con el FIPS <estado>998 y no se estima nada.
Control interno: produccion = rendimiento x superficie cosechada (factor de unidad segun cultivo) dentro de una tolerancia; si mas del 1 % de las
combinaciones condado-ano no cuadran, no se escribe el cultivo.
La clave (secret NASS_API_KEY) solo se lee del entorno: nunca se escribe en ficheros ni en logs. Un fallo de la API nunca borra datos.
Uso: update-us-county-yields.py [--full] [--only slug,slug] [--fixture-dir DIR] [--out DIR] [--now YYYY-MM-DD]
  --full         vuelve a pedir todos los anos (por defecto solo los ultimos 3 si ya hay fichero)
  --fixture-dir  lee <slug>.<ano>.<yield|harvested|production>.json (lista 'data' de Quick Stats) en vez de llamar a la API (tests; sin red)"""
import argparse, datetime, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://quickstats.nass.usda.gov/api/api_GET/"
YEARS_BACK = 9              # ventana: ano actual - 9 .. ano actual (10 campanas)
REFRESH_YEARS = 3           # NASS revisa los ultimos anos: se vuelven a pedir siempre
PAUSE = 0.4                 # pausa entre consultas para no pasarse del limite de NASS
RATE_WAIT = 45              # espera tras un 403 (limite de peticiones), multiplicada por el intento
TOL = 0.04                  # tolerancia produccion vs rendimiento x superficie (heno llega al 1,8 %)
LOG = []
LOGPATH = ROOT / "data" / "us-county-yields-log.txt"
# slug, clave del selector de la web (nombre de la serie de NASS sin el sufijo), unidades de rendimiento y produccion, divisor de produccion (cotton: 480 lb por paca; rice: 100 lb por cwt)
def spec(slug, key, yu, pu, div=1):
    return {"slug": slug, "key": key, "yield": key + " - YIELD, MEASURED IN " + yu, "harvested": key + " - ACRES HARVESTED", "production": key + " - PRODUCTION, MEASURED IN " + pu,
            "units": {"yield": yu, "harvested": "ACRES", "production": pu}, "div": div}
CROPS = [
    spec("corn", "CORN, GRAIN", "BU / ACRE", "BU"), spec("soybeans", "SOYBEANS", "BU / ACRE", "BU"), spec("wheat-winter", "WHEAT, WINTER", "BU / ACRE", "BU"),
    spec("wheat-spring", "WHEAT, SPRING, (EXCL DURUM)", "BU / ACRE", "BU"), spec("cotton-upland", "COTTON, UPLAND", "LB / ACRE", "480 LB BALES", 480),
    spec("sorghum", "SORGHUM, GRAIN", "BU / ACRE", "BU"), spec("rice", "RICE", "LB / ACRE", "CWT", 100), spec("peanuts", "PEANUTS", "LB / ACRE", "LB"),
    spec("hay-alfalfa", "HAY, ALFALFA", "TONS / ACRE", "TONS"), spec("barley", "BARLEY", "BU / ACRE", "BU"), spec("oats", "OATS", "BU / ACRE", "BU"),
]
METRICS = ("yield", "harvested", "production")
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def dump(doc): return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
def read_json(p, default=None):
    try: return json.loads(Path(p).read_text(encoding="utf-8"))
    except Exception: return default
def write_if_changed(path, doc, volatile=("generatedAt", "checkedAt")):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        old = read_json(path)
        if isinstance(old, dict) and {k: v for k, v in old.items() if k not in volatile} == {k: v for k, v in doc.items() if k not in volatile}: return False
    path.write_text(dump(doc), encoding="utf-8"); return True

class ApiError(Exception):
    def __init__(self, kind, msg=""): super().__init__(kind + (": " + msg if msg else "")); self.kind = kind
def api_rows(key, short_desc, year, tries=4):
    time.sleep(PAUSE)
    q = urllib.parse.urlencode({"key": key, "format": "JSON", "source_desc": "SURVEY", "agg_level_desc": "COUNTY", "short_desc": short_desc, "year": str(year), "reference_period_desc": "YEAR", "freq_desc": "ANNUAL"})
    last = ""
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers={"User-Agent": "dehesaindex-county/1.0", "Accept": "application/json"}), timeout=180) as r:
                return json.loads(r.read().decode("utf-8")).get("data") or []
        except urllib.error.HTTPError as e:
            if e.code == 400: return []                      # NASS responde 400 cuando no hay registros
            if e.code == 401: raise ApiError("AUTH_FAILURE", "HTTP 401")
            if e.code == 403:                               # NASS responde 403 al pasarse del limite de peticiones: se espera y se reintenta; no es un fallo de clave
                last = "HTTP 403"; time.sleep(RATE_WAIT * (i + 1)); continue
            last = "HTTP %d" % e.code
        except Exception as e: last = type(e).__name__
        time.sleep(3 * (i + 1))
    raise ApiError("RATE_LIMITED" if last == "HTTP 403" else "ERROR", last)
def fixture_rows(fx, slug, year, metric):
    p = Path(fx) / ("%s.%d.%s.json" % (slug, year, metric))
    if not p.exists(): return []
    d = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(d, dict) and d.get("_fixtureError"): raise ApiError(d["_fixtureError"], "fixture")
    return d

def num(v):
    """Cifra de NASS; '(D)', '(Z)', '(NA)', '(X)' y vacios son huecos."""
    s = str(v if v is not None else "").replace(",", "").strip()
    if not re.fullmatch(r"-?\d+(\.\d+)?", s): return None
    return float(s)
def clean(v):
    if v is None: return None
    return int(v) if v == int(v) else round(v, 3)
def fips_of(r):
    st, co = str(r.get("state_fips_code") or "").strip(), str(r.get("county_code") or "").strip()
    return st + co if re.fullmatch(r"\d{2}", st) and re.fullmatch(r"\d{3}", co) else None
def parse(rows, short_desc, stats):
    """fips -> valor para una serie y ano; descarta filas de otra serie, practica o dominio."""
    out = {}
    for r in rows:
        if r.get("short_desc") != short_desc or r.get("agg_level_desc") not in (None, "COUNTY"): stats["other_series"] += 1; continue
        if r.get("prodn_practice_desc") not in (None, "ALL PRODUCTION PRACTICES") or r.get("domain_desc") not in (None, "TOTAL"): stats["other_series"] += 1; continue
        f = fips_of(r)
        if not f: stats["bad_fips"] += 1; continue
        v = num(r.get("Value"))
        if v is None: stats["suppressed"] += 1; out.setdefault(f, None); continue
        if v < 0: stats["negative"] += 1; continue
        out[f] = v
    return out

def build_crop(c, key, fixture_dir, old, now, full, stats, err):
    """Devuelve el documento del cultivo o None. old = documento anterior (se conserva lo que no se vuelve a pedir o falla)."""
    y1 = now.year; y0 = y1 - YEARS_BACK
    prev = {}
    if old and not full:
        for f, arrs in (old.get("counties") or {}).items():
            for mi, m in enumerate(METRICS):
                for yi, y in enumerate(old["years"]):
                    v = arrs[mi][yi]
                    if v is not None: prev[(m, y, f)] = v
    refresh = range(y0, y1 + 1) if (full or not old) else range(max(y0, y1 - REFRESH_YEARS + 1), y1 + 1)
    got = {}      # (m, y, f) -> valor nuevo o None
    failed = []
    for y in refresh:
        for m in METRICS:
            try: rows = fixture_rows(fixture_dir, c["slug"], y, m) if fixture_dir else api_rows(key, c[m], y)
            except ApiError as e:
                if e.kind in ("AUTH_FAILURE", "RATE_LIMITED"): raise
                failed.append((y, m)); err.append("%s %d %s: %s" % (c["slug"], y, m, e)); continue
            if not rows and any(k[0] == m and k[1] == y for k in prev):
                failed.append((y, m)); err.append("%s %d %s: respuesta vacia con datos previos; se conserva lo anterior" % (c["slug"], y, m)); continue
            for f, v in parse(rows, c[m], stats).items(): got[(m, y, f)] = v
    # un (ano, cifra) que fallo conserva lo anterior; uno que responde sustituye lo anterior (incluida la baja de un condado)
    cells = {}
    for (m, y, f), v in prev.items():
        if y in refresh and (y, m) not in failed: continue
        if y < y0: continue
        cells[(m, y, f)] = v
    for k, v in got.items(): cells[k] = v
    years_with = sorted({y for (m, y, f), v in cells.items() if v is not None})
    if not years_with: return None
    years = list(range(years_with[0], years_with[-1] + 1))
    fl = sorted({f for (m, y, f) in cells})
    counties = {}
    for f in fl:
        arrs = [[clean(cells.get((m, y, f))) for y in years] for m in METRICS]
        if any(v is not None for a in arrs for v in a): counties[f] = arrs
    return {"years": years, "counties": counties, "failed": failed}

def validate(c, doc):
    """(errores, avisos): control produccion = rendimiento x superficie / divisor; huecos y estructura."""
    errs, warns = [], []
    ys = doc["years"]; bad = tot = 0
    for f, (ay, ah, ap) in doc["counties"].items():
        for i, y in enumerate(ys):
            a, b, p = ay[i], ah[i], ap[i]
            if a is None or b is None or p is None: continue
            tot += 1
            exp = a * b / c["div"]
            if (exp == 0 and p != 0) or (exp and abs(p / exp - 1) > TOL): bad += 1; warns.append("%s %d: produccion %s distinta de rendimiento x superficie %.0f" % (f, y, p, exp))
    if tot and bad / tot > 0.01: errs.append("%s: %d de %d combinaciones condado-ano no cuadran (produccion distinta de rendimiento x superficie)" % (c["slug"], bad, tot))
    if not doc["counties"]: errs.append(c["slug"] + ": sin condados")
    return errs, warns[:10]

def to_doc(c, built, ts):
    return {"schemaVersion": 1, "generatedAt": ts, "checkedAt": ts, "source": {"id": "usda_nass", "url": "https://quickstats.nass.usda.gov/"}, "crop": c["key"], "slug": c["slug"], "metrics": list(METRICS), "units": c["units"],
            "series": {m: c[m] for m in METRICS}, "years": built["years"], "counties": built["counties"]}
def _other(f): return f.endswith("998")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--full", action="store_true"); ap.add_argument("--only"); ap.add_argument("--fixture-dir"); ap.add_argument("--out"); ap.add_argument("--now"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "us-county"; out.mkdir(parents=True, exist_ok=True)
    global LOGPATH
    if a.out: LOGPATH = out / "log.txt"
    now = datetime.date.fromisoformat(a.now) if a.now else datetime.date.today(); ts = now_iso()
    key = os.environ.get("NASS_API_KEY", "")
    only = set(a.only.split(",")) if a.only else None
    status = {"schemaVersion": 1, "generatedAt": ts, "sourceId": "usda_nass", "run": {"status": "OK"}, "crops": []}
    if not key and not a.fixture_dir:
        log("sin NASS_API_KEY: no se llama a la API ni se inventa nada"); status["run"]["status"] = "NO_KEY"
        status["crops"] = [{"slug": c["slug"], "key": c["key"], "status": "NOT_RUN"} for c in CROPS]
        write_if_changed(out / "status.json", status); return 0
    rc = 0
    for c in CROPS:
        if only and c["slug"] not in only: status["crops"].append({"slug": c["slug"], "key": c["key"], "status": "NOT_RUN"}); continue
        path = out / "yields" / (c["slug"] + ".json"); old = read_json(path); stats = {"other_series": 0, "bad_fips": 0, "suppressed": 0, "negative": 0}; err = []
        ent = {"slug": c["slug"], "key": c["key"], "status": "OK"}
        try: built = build_crop(c, key, a.fixture_dir, old, now, a.full, stats, err)
        except ApiError as e:
            log("%s: %s" % (c["slug"], e)); ent["status"] = e.kind; status["crops"].append(ent)
            if e.kind == "AUTH_FAILURE": status["run"]["status"] = "AUTH_FAILURE"; rc = 1; break
            if e.kind == "RATE_LIMITED":                    # NASS nos frena: se para, se conserva lo anterior y el resto queda para la proxima ejecucion
                status["run"]["status"] = "PARTIAL"
                for c2 in CROPS[CROPS.index(c) + 1:]: status["crops"].append({"slug": c2["slug"], "key": c2["key"], "status": "NOT_RUN"})
                break
            continue
        for e in err[:6]: log("aviso:", e)
        if built is None:
            ent["status"] = "NO_DATA" if not err else "ERROR"; log("%s: sin datos de condados en la ventana" % c["slug"]); status["crops"].append(ent)
            if err: rc = 0
            continue
        doc = to_doc(c, built, ts)
        errs, warns = validate(c, doc)
        for w in warns: log("aviso:", c["slug"], w)
        if errs:
            for e in errs: log("ERROR de validacion:", e)
            ent["status"] = "INVALID"; status["crops"].append(ent); rc = 1; continue
        if built["failed"]: ent["status"] = "PARTIAL"; ent["failed"] = ["%d/%s" % x for x in built["failed"]]
        changed = write_if_changed(path, doc)
        ys = doc["years"]; n_main = [sum(1 for f, ar in doc["counties"].items() if not _other(f) and ar[0][i] is not None) for i in range(len(ys))]
        ent.update({"years": [ys[0], ys[-1]], "latest": ys[-1], "countiesLatest": n_main[-1], "suppressed": stats["suppressed"], "checkedAt": ts})
        status["crops"].append(ent); log("%s: %d-%d, %d condados con rendimiento en %d%s" % (c["slug"], ys[0], ys[-1], n_main[-1], ys[-1], "" if changed else " (sin cambios)"))
    if any(e["status"] in ("PARTIAL", "ERROR") for e in status["crops"]) and status["run"]["status"] == "OK": status["run"]["status"] = "PARTIAL"
    write_if_changed(out / "status.json", status)
    return rc

if __name__ == "__main__":
    rc = main()
    try: LOGPATH.write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

#!/usr/bin/env python3
"""Poblacion, edad mediana, paro y tasa de empleo por estado y territorio de Australia (ABS Data API, CC BY 4.0) -> data/australia-states-macro.json
Misma forma que data/canada-provinces-macro.json: {regions: {NSW: {pop, age, unemp, epop}}}, cada serie [[periodo, valor]].
  pop   : poblacion residente estimada (ERP_Q, trimestral) a 30 de junio de cada anio (trimestre de junio), personas
  age   : edad mediana, CALCULADA por Dehesa Index sobre las edades simples de ERP_Q (30 de junio); no es una cifra publicada por el ABS
  unemp : tasa de paro (LF, M13), desestacionalizada, mensual, % de la poblacion activa de 15+
  epop  : tasa de empleo (LF, M16, empleo / poblacion civil de 15+), desestacionalizada, mensual
No hay PIB por estado en la API del ABS: queda sin dato, no se estima. Si una fuente falla se conserva lo que ya habia de esa metrica."""
import csv, datetime, io, json, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.api.abs.gov.au/rest/data/"
STATES = {"new south wales": "NSW", "victoria": "VIC", "queensland": "QLD", "south australia": "SA", "western australia": "WA", "tasmania": "TAS", "northern territory": "NT", "australian capital territory": "ACT"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def abs_csv(path, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(BASE + path, headers={"Accept": "application/vnd.sdmx.data+csv", "User-Agent": "Dehesa-Index-data-bot/1.0"})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(req, timeout=240).read().decode("utf-8-sig"))))
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: break
            time.sleep(4 * (i + 1))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def state_of(r):
    return STATES.get((r.get("Region") or "").strip().lower())
def num(x):
    try: return float(x)
    except Exception: return None
def labour(measure):
    rows = abs_csv("LF/%s.3.1599.20.1+2+3+4+5+6+7+8.M?startPeriod=%d-01&format=csvfilewithlabels" % (measure, datetime.date.today().year - 9))
    out = {}
    for r in rows:
        st = state_of(r); v = num(r.get("OBS_VALUE"))
        if st and v is not None and r["TIME_PERIOD"][4:5] == "-": out.setdefault(st, []).append([r["TIME_PERIOD"], round(v, 1)])
    return {k: sorted(v) for k, v in out.items()}
def population():
    """ERP por edad simple a 30 de junio: poblacion total y edad mediana (interpolada dentro del anio de edad)."""
    y0 = datetime.date.today().year - 6
    rows = abs_csv("ERP_Q/1.3..1+2+3+4+5+6+7+8.Q?startPeriod=%d-Q2&format=csvfilewithlabels" % y0)
    by = {}
    for r in rows:
        st = state_of(r); v = num(r.get("OBS_VALUE")); per = r["TIME_PERIOD"]
        if not st or v is None or not per.endswith("-Q2") or r.get("UNIT_MEASURE") != "PSNS": continue
        a = r["AGE"]
        if a.isdigit() and 0 <= int(a) <= 100: by.setdefault((st, int(per[:4])), {})[int(a)] = v
        elif a == "TOT": by.setdefault((st, int(per[:4])), {})["tot"] = v
    pop, age = {}, {}
    for (st, y), d in sorted(by.items()):
        ages = [d.get(i) for i in range(101)]
        if any(x is None for x in ages): continue            # faltan edades: no se calcula
        tot = sum(ages)
        if d.get("tot") is not None and abs(tot - d["tot"]) > 0.001 * d["tot"]: log("aviso: suma de edades no cuadra con el total", st, y); continue
        half, cum = tot / 2.0, 0.0
        for i, n in enumerate(ages):
            if cum + n >= half: med = i + (half - cum) / n; break
            cum += n
        pop.setdefault(st, []).append([y, int(round(tot))]); age.setdefault(st, []).append([y, round(med, 1)])
    return pop, age
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True); p = outdir / "australia-states-macro.json"
    try: old = json.loads(p.read_text(encoding="utf-8"))["regions"]
    except Exception: old = {}
    res = {}; rc = 0
    def run(key, fn):
        nonlocal rc
        try:
            d = fn(); log(key, "estados:", len(d))
            if len(d) < 8: raise ValueError("solo %d estados" % len(d))
            return d
        except Exception as e:
            log("FALLO", key, repr(e)); rc = 1
            return {st: o[key] for st, o in old.items() if o.get(key)}
    res["unemp"] = run("unemp", lambda: labour("M13")); res["epop"] = run("epop", lambda: labour("M16"))
    try: pop, age = population(); log("pop/age estados:", len(pop), len(age)); assert len(pop) == 8
    except Exception as e:
        log("FALLO pop/age", repr(e)); rc = 1
        pop = {st: o["pop"] for st, o in old.items() if o.get("pop")}; age = {st: o["age"] for st, o in old.items() if o.get("age")}
    res["pop"], res["age"] = pop, age
    regions = {}
    for st in sorted(STATES.values()):
        o = {k: res[k][st] for k in ("pop", "age", "unemp", "epop") if res.get(k, {}).get(st)}
        if o: regions[st] = o
    if len(regions) < 8:
        log("FALLO: faltan estados"); (outdir / "australia-states-macro-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Australian Bureau of Statistics (ABS Data API): Labour Force (LF) and Quarterly Population Estimates (ERP_Q)", "url": "https://www.abs.gov.au/", "license": "CC BY 4.0"},
           "units": {"pop": "persons, estimated resident population at 30 June", "age": "median age, years, calculated by Dehesa Index from single-year ERP at 30 June", "unemp": "% of the labour force aged 15+, seasonally adjusted, monthly", "epop": "employment to population ratio, % of the civilian population aged 15+, seasonally adjusted, monthly"},
           "regions": regions}
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "australia-states-macro-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

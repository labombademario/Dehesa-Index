#!/usr/bin/env python3
"""PIB, poblacion y paro por estado de EE. UU. para las paginas de region (mismas cifras que la franja del pais, pero por estado).
Salida: data/us-states-macro.json  {regions: {IL: {gdp, pop, unemp, gdppc}}}, cada serie [[periodo, valor]].
Fuentes oficiales del gobierno federal (dominio publico, se cita la fuente):
  U.S. Bureau of Economic Analysis (BEA), SAGDP1 linea 3: PIB a precios corrientes, millones de USD, anual   -> gdp
  U.S. Census Bureau, Population Estimates Program (NST-EST): poblacion a 1 de julio, personas, anual        -> pop
  U.S. Bureau of Labor Statistics (BLS), LAUS (API publica v1): tasa de paro, % desestacionalizada, mensual   -> unemp
  gdppc = gdp / pop calculado por Dehesa Index, solo los anios con ambos datos.
Nunca se rellena un hueco. Si una fuente falla se conserva lo que ya habia de esa metrica.
Uso: python3 scripts/update-us-states-macro.py [--outdir data]"""
import csv, datetime, io, json, sys, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "DehesaIndex (github.com/labombademario/Dehesa-Index)"}
FIPS = {"01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
        "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
        "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
        "54": "WV", "55": "WI", "56": "WY"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, data=None, timeout=120):
    req = urllib.request.Request(url, data=data, headers=dict(UA, **({"Content-Type": "application/json"} if data else {})))
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.read()
def num(x):
    try: return float(str(x).replace(",", "").strip())
    except Exception: return None
def census():
    urls = ["https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv",
            "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/totals/NST-EST2024-ALLDATA.csv"]
    last = None
    for u in urls:
        try: raw = http(u).decode("latin-1"); break
        except Exception as e: last = e; raw = None
    if raw is None: raise RuntimeError("Census: %r" % last)
    out = {}
    for r in csv.DictReader(io.StringIO(raw)):
        if r.get("SUMLEV") != "040" or r.get("STATE") not in FIPS: continue
        pts = [[int(k[-4:]), int(float(r[k]))] for k in r if k.startswith("POPESTIMATE") and num(r[k]) is not None]
        out[FIPS[r["STATE"]]] = sorted(pts)
    return out
def bea():
    z = zipfile.ZipFile(io.BytesIO(http("https://apps.bea.gov/regional/zip/SAGDP.zip", timeout=300)))
    name = [n for n in z.namelist() if n.startswith("SAGDP1__ALL_AREAS")][0]
    rows = list(csv.reader(io.StringIO(z.read(name).decode("latin-1"))))
    head = rows[0]; yrs = [(i, int(h)) for i, h in enumerate(head) if h.isdigit()]
    out = {}
    for r in rows[1:]:
        if len(r) < len(head) or r[4].strip() != "3": continue
        fips = r[0].strip().strip('"')[:2]
        if fips not in FIPS or not r[0].strip().strip('"').endswith("000"): continue
        pts = [[y, round(num(r[i]), 1)] for i, y in yrs if y >= 2010 and num(r[i]) is not None]
        if pts: out[FIPS[fips]] = pts
    return out
def bls():
    ids = {"LASST%s%s03" % (f, "0" * 11): FIPS[f] for f in FIPS}
    now = datetime.date.today().year; keys = sorted(ids); out = {}
    for i in range(0, len(keys), 25):
        chunk = keys[i:i + 25]
        j = json.loads(http("https://api.bls.gov/publicAPI/v1/timeseries/data/", json.dumps({"seriesid": chunk, "startyear": str(now - 9), "endyear": str(now)}).encode()))
        if j.get("status") != "REQUEST_SUCCEEDED": raise RuntimeError("BLS: %s %s" % (j.get("status"), j.get("message")))
        for s in j["Results"]["series"]:
            pts = []
            for d in s["data"]:
                if not d["period"].startswith("M") or d["period"] == "M13": continue
                v = num(d["value"])
                if v is not None: pts.append(["%s-%s" % (d["year"], d["period"][1:]), v])
            if pts: out[ids[s["seriesID"]]] = sorted(pts)
    return out
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True); p = outdir / "us-states-macro.json"
    try: old = json.loads(p.read_text(encoding="utf-8"))["regions"]
    except Exception: old = {}
    res = {}; rc = 0
    for key, fn in (("pop", census), ("gdp", bea), ("unemp", bls)):
        try:
            d = fn(); log(key, "estados:", len(d))
            if len(d) < 45: raise ValueError("solo %d estados" % len(d))
            res[key] = d
        except Exception as e:
            log("FALLO", key, repr(e)); rc = 1
            res[key] = {st: o[key] for st, o in old.items() if o.get(key)}
    regions = {}
    for st in sorted(set(FIPS.values())):
        o = {k: res[k][st] for k in ("gdp", "pop", "unemp") if res.get(k, {}).get(st)}
        if o.get("gdp") and o.get("pop"):
            pop = {y: v for y, v in o["pop"]}
            pc = [[y, round(v * 1e6 / pop[y])] for y, v in o["gdp"] if pop.get(y)]
            if pc: o["gdppc"] = pc
        if o: regions[st] = o
    if len(regions) < 45:
        log("FALLO: pocos estados"); (outdir / "us-states-macro-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "U.S. BEA (SAGDP1), U.S. Census Bureau (PEP NST-EST), U.S. BLS (LAUS)", "url": "https://www.bea.gov/data/gdp/gdp-state", "license": "US Government works (public domain); cite BEA, Census Bureau and BLS"},
           "units": {"gdp": "USD million, current prices, annual", "pop": "persons, 1 July estimate", "unemp": "% of the labour force, seasonally adjusted, monthly", "gdppc": "USD per inhabitant (GDP / population, calculated by Dehesa Index)"},
           "regions": regions}
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "us-states-macro-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

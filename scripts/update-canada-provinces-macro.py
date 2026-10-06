#!/usr/bin/env python3
"""PIB, poblacion y paro por provincia y territorio de Canada para las paginas de region (Statistics Canada, Open Government Licence - Canada).
Salida: data/canada-provinces-macro.json  {regions: {ON: {gdp, pop, unemp, gdppc}}}, cada serie [[periodo, valor]].
  36-10-0222-01  PIB a precios de mercado, precios corrientes, anual, millones de CAD       -> gdp
  17-10-0005-01  poblacion a 1 de julio, todas las edades, ambos sexos, personas             -> pop
  14-10-0287-01  tasa de paro 15+, ambos sexos, desestacionalizada, mensual (provincias)      -> unemp
  gdppc = gdp / pop calculado por Dehesa Index, solo los anios con ambos datos.
Nunca se rellena un hueco: lo que Statistics Canada no publica para una region no aparece. Si una fuente falla se conserva lo que habia.
Uso: python3 scripts/update-canada-provinces-macro.py [--outdir data]"""
import datetime, importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cs", ROOT / "scripts" / "update-canada-stats.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
S.log = log
GEO = {"Newfoundland and Labrador": "NL", "Prince Edward Island": "PE", "Nova Scotia": "NS", "New Brunswick": "NB", "Quebec": "QC", "Ontario": "ON", "Manitoba": "MB", "Saskatchewan": "SK",
       "Alberta": "AB", "British Columbia": "BC", "Yukon": "YT", "Northwest Territories": "NT", "Nunavut": "NU"}
def geo(r):
    g = (r.get("GEO") or "").split(",")[0].strip()
    return GEO.get(g)
def eq(r, col, val): return (r.get(col) or "").strip().lower() == val.lower()
def has(r, col, val): return val.lower() in (r.get(col) or "").lower()
def diag(rows, cols):
    for c in cols: log("  valores de", c, sorted({r.get(c) for r in rows})[:12])
def gdp():
    rows = [r for r in S.load(36100222) if geo(r)]
    sel = [r for r in rows if eq(r, "Estimates", "Gross domestic product at market prices") and has(r, "Prices", "current")]
    if not sel: diag(rows, ["Estimates", "Prices"]); raise ValueError("sin filas de PIB")
    out = {}
    for r in sel:
        v = S.num(r)
        if v is not None: out.setdefault(geo(r), {})[int(r["REF_DATE"][:4])] = round(v / 1e6, 1)
    return {k: sorted(d.items()) for k, d in out.items()}
def pop():
    rows = [r for r in S.load(17100005) if geo(r)]
    sel = [r for r in rows if has(r, "Gender", "total") and eq(r, "Age group", "All ages")]
    if not sel: diag(rows, ["Gender", "Age group"]); raise ValueError("sin filas de poblacion")
    out = {}
    for r in sel:
        v = S.num(r)
        if v is not None: out.setdefault(geo(r), {})[int(r["REF_DATE"][:4])] = round(v)
    return {k: sorted(d.items()) for k, d in out.items()}
def unemp():
    yr = datetime.date.today().year
    rows = S.load_filtered(14100287, lambda r: bool(geo(r)) and eq(r, "Labour force characteristics", "Unemployment rate") and r["REF_DATE"][:4] >= str(yr - 9))
    sel = [r for r in rows if has(r, "Gender", "total") and has(r, "Age group", "15 years and over") and has(r, "Data type", "seasonally adjusted") and (not r.get("Statistics") or eq(r, "Statistics", "Estimate"))]
    if not sel: diag(rows, ["Gender", "Age group", "Data type", "Statistics"]); raise ValueError("sin filas de paro")
    out = {}
    for r in sel:
        try: v = float(r["VALUE"])
        except Exception: continue
        out.setdefault(geo(r), {})[r["REF_DATE"][:7]] = v
    return {k: sorted(d.items()) for k, d in out.items()}
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True); p = outdir / "canada-provinces-macro.json"
    try: old = json.loads(p.read_text(encoding="utf-8"))["regions"]
    except Exception: old = {}
    res = {}; rc = 0
    for key, fn in (("gdp", gdp), ("pop", pop), ("unemp", unemp)):
        try:
            d = fn(); log(key, "regiones:", len(d), sorted(d))
            if len(d) < 9: raise ValueError("solo %d regiones" % len(d))
            res[key] = d
        except Exception as e:
            log("FALLO", key, repr(e)); rc = 1
            res[key] = {k: o[key] for k, o in old.items() if o.get(key)}
    regions = {}
    for st in sorted(set(GEO.values())):
        o = {k: res[k][st] for k in ("gdp", "pop", "unemp") if res.get(k, {}).get(st)}
        if o.get("gdp") and o.get("pop"):
            pp = dict(o["pop"]); pc = [[y, round(v * 1e6 / pp[y])] for y, v in o["gdp"] if pp.get(y)]
            if pc: o["gdppc"] = pc
        if o: regions[st] = o
    if len(regions) < 9:
        log("FALLO: pocas regiones"); (outdir / "canada-provinces-macro-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Statistics Canada, tables 36-10-0222-01, 17-10-0005-01 and 14-10-0287-01", "url": "https://www150.statcan.gc.ca/n1/en/type/data", "license": "Statistics Canada Open Licence"},
           "units": {"gdp": "CAD million, current prices, annual", "pop": "persons, 1 July estimate", "unemp": "% of the labour force aged 15+, seasonally adjusted, monthly", "gdppc": "CAD per inhabitant (GDP / population, calculated by Dehesa Index)"},
           "regions": regions}
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "canada-provinces-macro-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

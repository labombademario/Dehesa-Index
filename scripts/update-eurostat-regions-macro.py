#!/usr/bin/env python3
"""PIB, poblacion y paro por region (Eurostat, NUTS 2) para las mismas regiones que ya tienen pagina (ES, FR, IT, DE, NL, AT, BE, DK, PL).
Salida: data/eu-regions-macro.json  {regions: {PAIS: {REGION: {nuts, gdp, pop, unemp, gdppc}}}}, cada serie [[anio, valor]].
Datasets (reutilizacion con cita de la fuente):
  nama_10r_2gdp   PIB a precios corrientes, millones EUR            -> gdp   (suma de NUTS 2 si la region no tiene NUTS propio)
  demo_r_d2jan    poblacion a 1 de enero, personas (ambos sexos)    -> pop   (idem)
  lfst_r_lfu3rt   tasa de paro 15-74 anos, % de la poblacion activa -> unemp (SOLO si Eurostat publica el codigo de la region: una tasa no se puede sumar)
  gdppc = gdp / pop calculado por Dehesa Index (solo los anios con ambos datos).
Nunca se rellena un hueco: sin dato publicado, la serie no existe.
Las regiones y su correspondencia con NUTS son las de update-eurostat-regions.py.
Uso: python3 scripts/update-eurostat-regions-macro.py [--only es,fr] [--outdir data]"""
import datetime, importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("eurreg", ROOT / "scripts" / "update-eurostat-regions.py")
ER = importlib.util.module_from_spec(spec); spec.loader.exec_module(ER)
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def own_series(t, key, own, ymin=2000):
    s = t.get((key, own)) if own else None
    return [[y, round(v, 3)] for y, v in sorted((s or {}).items()) if y >= ymin]
def build(cc, reg):
    G = ER.geos(reg)
    out = {r: {"nuts": ([s[0]] if s[0] else []) + s[1]} for r, s in reg.items()}
    j = ER.fetch("nama_10r_2gdp", unit="MIO_EUR", geo=G); t = ER.collect(j, lambda c: "gdp")
    for r, s in reg.items():
        p = ER.region_series(t, "gdp", s, ymin=2000)
        if p: out[r]["gdp"] = p
    j = ER.fetch("demo_r_d2jan", unit="NR", sex="T", age="TOTAL", geo=G); t = ER.collect(j, lambda c: "pop")
    for r, s in reg.items():
        p = ER.region_series(t, "pop", s, ymin=2000)
        if p: out[r]["pop"] = [[y, round(v)] for y, v in p]
    j = ER.fetch("lfst_r_lfu3rt", unit="PC", sex="T", age="Y15-74", geo=G); t = ER.collect(j, lambda c: "unemp")
    for r, s in reg.items():
        p = own_series(t, "unemp", s[0]) or (own_series(t, "unemp", s[1][0]) if len(s[1]) == 1 else [])
        if p: out[r]["unemp"] = p
    for r, o in out.items():
        if o.get("gdp") and o.get("pop"):
            pop = {y: v for y, v in o["pop"]}
            o["gdppc"] = [[y, round(v * 1e6 / pop[y])] for y, v in o["gdp"] if pop.get(y)]
            if not o["gdppc"]: del o["gdppc"]
        log(cc, r, {k: len(v) for k, v in o.items() if k != "nuts"})
    return out
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    only = args[args.index("--only") + 1].split(",") if "--only" in args else None
    res, rc = {}, 0
    for cc, reg in ER.COUNTRIES.items():
        if only and cc not in only: continue
        try:
            out = build(cc, reg)
            ok = sum(1 for v in out.values() if v.get("gdp") and v.get("pop"))
            if ok < len(reg) * 0.8: raise ValueError("%s: solo %d de %d regiones con PIB y poblacion" % (cc.upper(), ok, len(reg)))
            res[cc.upper()] = out
        except Exception as e:
            print("FALLO", cc, repr(e)); LOG.append("FALLO %s %r" % (cc, e)); rc = 1
    if not res: return 1
    p = outdir / "eu-regions-macro.json"
    if p.exists() and only:  # ejecucion parcial: conserva los demas paises
        try:
            old = json.loads(p.read_text(encoding="utf-8"))["regions"]
            for k, v in old.items(): res.setdefault(k, v)
        except Exception: pass
    elif p.exists():  # si un pais falla, se conserva el anterior en vez de perderlo
        try:
            old = json.loads(p.read_text(encoding="utf-8"))["regions"]
            for k, v in old.items(): res.setdefault(k, v)
        except Exception: pass
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Eurostat (nama_10r_2gdp, demo_r_d2jan, lfst_r_lfu3rt)", "url": "https://ec.europa.eu/eurostat/", "license": "Eurostat reuse policy (Commission Decision 2011/833/EU)"},
           "units": {"gdp": "EUR million, current prices", "pop": "persons on 1 January", "unemp": "% of the labour force, 15-74", "gdppc": "EUR per inhabitant (GDP / population, calculated by Dehesa Index)"},
           "regions": dict(sorted(res.items()))}
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "eu-regions-macro-log.txt").write_text("\n".join(LOG[-200:]) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

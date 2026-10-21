#!/usr/bin/env python3
"""PIB, poblacion y paro por region (Eurostat, NUTS 2) para las mismas regiones que ya tienen pagina (ES, FR, IT, DE, NL, AT, BE, DK, PL, PT, CH, IE, EL).
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
# Portugal: desde la division NUTS 2024 Eurostat publica el PIB (y la poblacion reciente) de Centro, Lisboa y Alentejo solo con codigos nuevos.
# Las regiones de la web siguen siendo las NUTS 2021; se reconstruyen EXACTAMENTE sumando las mismas unidades NUTS 3 (comunidades intermunicipais) que las componian.
PT_N3 = {"CEN": ["PT1D1", "PT191", "PT192", "PT193", "PT194", "PT195", "PT196", "PT1D2"],   # Oeste, Aveiro, Coimbra, Leiria, Viseu Dao Lafoes, Beira Baixa, Beiras e Serra da Estrela, Medio Tejo
         "LIS": ["PT1A0", "PT1B0"],                                                            # Area Metropolitana de Lisboa = Grande Lisboa + Peninsula de Setubal
         "ALE": ["PT1C1", "PT1C2", "PT1C3", "PT1C4", "PT1D3"]}                                 # Alentejo Litoral, Baixo, Alto, Central y Leziria do Tejo
def pt_nuts3(out):
    G = sorted({g for v in PT_N3.values() for g in v})
    tg = ER.collect(ER.fetch("nama_10r_3gdp", unit="MIO_EUR", geo=G), lambda c: "gdp")
    tp = ER.collect(ER.fetch("demo_r_pjanaggr3", sex="T", age="TOTAL", unit="NR", geo=G), lambda c: "pop")
    for r, kids in PT_N3.items():
        for key, t, rnd in (("gdp", tg, lambda v: round(v, 3)), ("pop", tp, round)):
            ser = [t.get((key, k)) for k in kids]
            if not all(ser): log("pt", r, key, "NUTS 3 incompleto: no se usa"); continue
            years = sorted(set.intersection(*[set(x) for x in ser]))
            tot = {y: sum(x[y] for x in ser) for y in years if y >= 2000}
            cur = {y: v for y, v in out[r].get(key, [])}
            # control: donde ya hay dato oficial de la region (NUTS 2021), la suma debe coincidir (0,5 %)
            bad = [y for y in tot if y in cur and abs(tot[y] / cur[y] - 1) > 0.005]
            if bad: log("pt", r, key, "la suma NUTS 3 no coincide con el dato oficial en", bad, "-> no se usa"); continue
            for y, v in tot.items(): cur.setdefault(y, v)
            out[r][key] = [[y, rnd(v)] for y, v in sorted(cur.items())]
            out[r].setdefault("via", {})[key] = "NUTS3"
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
    if cc == "pt":
        try: pt_nuts3(out)
        except Exception as e: log("pt NUTS 3 no disponible:", repr(e))
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
            if ok < len(reg) * {"pt": 0.5, "uk": 0.0, "cz": 0.0, "hu": 0.0, "ro": 0.0, "se": 0.0, "si": 0.0}.get(cc, 0.8):  # PT: el PIB de Centro, Lisboa y Alentejo cambia de codigo NUTS en 2024 y Eurostat no lo publica con los codigos antiguos; esas tres quedan sin PIB (hueco)
               raise ValueError("%s: solo %d de %d regiones con PIB y poblacion" % (cc.upper(), ok, len(reg)))
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
           "source": {"name": "Eurostat (nama_10r_2gdp, nama_10r_3gdp, demo_r_d2jan, demo_r_pjanaggr3, lfst_r_lfu3rt)", "url": "https://ec.europa.eu/eurostat/", "license": "Eurostat reuse policy (Commission Decision 2011/833/EU)"},
           "units": {"gdp": "EUR million, current prices", "pop": "persons on 1 January", "unemp": "% of the labour force, 15-74", "gdppc": "EUR per inhabitant (GDP / population, calculated by Dehesa Index)"},
           "regions": dict(sorted(res.items()))}
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "eu-regions-macro-log.txt").write_text("\n".join(LOG[-200:]) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

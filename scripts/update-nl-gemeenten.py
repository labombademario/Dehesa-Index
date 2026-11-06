#!/usr/bin/env python3
"""Paises Bajos por municipio (gemeente, ~340): cultivos, ganado y uso del suelo (CBS) -> data/nl-gemeenten/<PROVINCIA>.json (12 provincias) + index.json
Fuente: tabla 80781NED de CBS StatLine (Landbouw; gewassen, dieren en grondgebruik naar gemeente, datos abiertos, id cbs_nl), ultimo anio publicado; la relacion municipio -> provincia sale de
'Gebieden in Nederland <anio>' (tabla 86059NED) con los municipios vigentes. Las superficies llegan en 'are' (1 are = 0,01 ha) y los invernaderos en m2: aqui se guardan en hectareas.
El CBS cuenta cada explotacion en el municipio de su sede; una explotacion con parcelas en varios municipios suma en todos, por eso la suma de explotaciones puede superar algo el total.
Controles (si fallan no se escribe nada): entre 300 y 360 municipios con datos; la suma de municipios no se aparta mas de 0,5 % del total nacional en superficie ni de 2 % en explotaciones;
explotaciones nacionales entre 35.000 y 70.000; sin negativos; las 12 provincias.
Uso: update-nl-gemeenten.py [--out DIRECTORIO]"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://opendata.cbs.nl/ODataApi/odata/"
TAB, GIN = "80781NED", "86059NED"
PROV = {"Groningen": "GR", "Fryslân": "FR", "Drenthe": "DR", "Overijssel": "OV", "Gelderland": "GE", "Flevoland": "FL", "Utrecht": "UT", "Noord-Holland": "NH", "Zuid-Holland": "ZH",
        "Zeeland": "ZE", "Noord-Brabant": "NB", "Limburg": "LI"}
# (clave, columna del CBS, divisor para pasar a hectareas o 1 si son cabezas/explotaciones)
SPEC = [("farms", "AantalLandbouwbedrijvenTotaal_1", 1), ("land", "Cultuurgrond_3", 100), ("arable", "AkkerbouwTotaal_8", 100), ("potato", "AardappelenTotaal_9", 100), ("cereal", "Granen_14", 100),
        ("beet", "Suikerbieten_18", 100), ("hort", "TuinbouwOpenGrondTotaal_34", 100), ("glass", "TuinbouwOnderGlasTotaal_46", 10000), ("grass", "GraslandTotaal_73", 100),
        ("cattle", "RundveeTotaal_84", 1), ("dairy", "MelkEnKalfkoeien2Jaar_88", 1), ("sheep", "Schapen_95", 1), ("goats", "GeitenTotaal_96", 1), ("horses", "PaardenEnPonySTotaal_99", 1),
        ("pigs", "VarkensTotaal_121", 1), ("chickens", "KippenTotaal_125", 1)]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(path, params=None, tries=4):
    url = BASE + path + ("?" + urllib.parse.urlencode(params, safe="$',") if params else "")
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}), timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last = str(e)[:160]; time.sleep(10 * (i + 1))
    raise RuntimeError("%s -> %s" % (path, last))
def conv(v, div):
    if v is None: return None
    if not isinstance(v, (int, float)) or isinstance(v, bool) or v < 0: raise RuntimeError("valor no valido %r" % (v,))
    return int(round(v)) if div == 1 else round(v / div, 2)
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "nl-gemeenten"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "nl-gemeenten-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    try:
        pers = get(TAB + "/Perioden")["value"]
        years = sorted(p["Key"] for p in pers if re.match(r"^\d{4}JJ00$", p["Key"]))
        cols = ",".join(["RegioS", "Perioden"] + [c for _, c, _ in SPEC])
        year = None
        for pk in reversed(years[-4:]):
            rows = get(TAB + "/TypedDataSet", {"$filter": "Perioden eq '%s'" % pk, "$select": cols})["value"]
            nl = [r for r in rows if r["RegioS"].strip() == "NL01"]
            if nl and nl[0].get("AantalLandbouwbedrijvenTotaal_1"): year = int(pk[:4]); break
        if not year: return fail("no hay un anio reciente con total nacional")
        log("anio", year, "filas", len(rows))
        gin = get(GIN + "/TypedDataSet", {"$select": "Code_1,Naam_2,Naam_29"})["value"]
    except RuntimeError as e: return fail(str(e))
    # el CBS publica la tabla 'Gebieden in Nederland' de cada anio; si la del anio de los datos no es 86059NED se avisa en el log pero se usa igual (solo aporta la provincia)
    prov = {}
    for g in gin:
        pn = g["Naam_29"].strip()
        if g["Code_1"].strip().startswith("GM") and pn in PROV: prov[g["Code_1"].strip()] = (g["Naam_2"].strip(), PROV[pn])
    nat = {k: conv(nl[0].get(c), d) for k, c, d in SPEC}
    regs = {}; sums = {k: 0 for k, _, _ in SPEC}; kept = 0; unknown = []
    for r in rows:
        code = r["RegioS"].strip()
        if not code.startswith("GM"): continue
        vals = {k: conv(r.get(c), d) for k, c, d in SPEC}
        if not vals["farms"]: continue
        if code not in prov: unknown.append(code); continue
        name, pv = prov[code]
        regs.setdefault(pv, {})[code] = [name] + [vals[k] for k, _, _ in SPEC]; kept += 1
        for k in sums: sums[k] += vals[k] or 0
    log("municipios con datos", kept, "provincias", len(regs), "sin provincia conocida", len(unknown), unknown[:5])
    for k, _, _ in SPEC:
        n = nat[k]
        if n: log("  control %-9s municipios %14s nacional %14s (%.2f %%)" % (k, round(sums[k], 2), n, 100 * sums[k] / n))
    if not 300 <= kept <= 360 or len(regs) != 12: return fail("municipios o provincias fuera de rango:", kept, len(regs))
    if unknown: return fail("municipios con datos sin provincia:", unknown[:10])
    if not 35000 <= nat["farms"] <= 70000: return fail("explotaciones nacionales fuera de rango:", nat["farms"])
    for k, _, _ in SPEC:
        n = nat[k]
        if not n: continue
        tol = 0.02 if k == "farms" else 0.005
        if abs(sums[k] - n) > n * tol: return fail("%s: la suma de municipios %s se aparta mas de %.1f %% del total %s" % (k, sums[k], tol * 100, n))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "cbs_nl", "url": "https://opendata.cbs.nl/#/CBS/nl/dataset/80781NED/table"}
    keys = [k for k, _, _ in SPEC]
    for pv, cm in sorted(regs.items()):
        (out / (pv + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": pv, "year": year, "ind": keys, "gemeenten": cm}, ensure_ascii=False, separators=(",", ":")) + "\n")
    idx = {"schemaVersion": 1, "generatedAt": now, "source": src, "year": year, "gemeenten": kept, "ind": keys, "regions": {r: len(cm) for r, cm in sorted(regs.items())},
           "totals": {k: round(v, 2) for k, v in sums.items()}, "national": {k: v for k, v in nat.items() if v is not None}}
    (out / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(regs), "provincias")
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())

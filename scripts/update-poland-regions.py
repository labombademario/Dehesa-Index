#!/usr/bin/env python3
"""Polonia: cosechas, superficies, rendimientos, censos de ganado, produccion de carne y leche POR VOIVODIA -> data/poland-regions/regions.json.
Fuente: GUS (Oficina Central de Estadistica), Banco de Datos Locales (BDL), API publica https://bdl.stat.gov.pl/api/v1/ (data/by-variable/{id}?unit-level=2 para las 16 voivodias y unit-level=0 para Polonia).
Las variables son las mismas que ya usa update-poland.py a nivel nacional (temas P1423 cultivos, P2138 otros cultivos, P1440/P1441/P1442 ganado, P1443 carne, P1444 leche, P2140 acopio de leche);
aqui se piden ademas por voivodia. Licencia: aviso de copyright de GUS (registro de licencias, fuente gus_poland). Solo el valor definitivo (attrId 1); cualquier otro atributo es un hueco, nunca un cero.
Conversiones exactas: dt (quintal, 100 kg) -> t (x0,1), miles de toneladas -> t (x1000). Sin estimaciones ni relleno de huecos.
Validaciones (si falla alguna no se escribe nada): 16 voivodias identificadas por su codigo BDL, valores no negativos, para las magnitudes aditivas (superficie, cosecha, censo, produccion) la suma de las 16 voivodias
dentro del 2 % del total nacional que publica GUS en el ultimo ano comun, y para los rendimientos el valor nacional dentro del minimo y el maximo de las voivodias.
Uso: update-poland-regions.py [--out DIR] [--fixtures DIR]   (con --fixtures no se toca la red; asi lo usan los tests)"""
import datetime, importlib.util, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://bdl.stat.gov.pl/api/v1/"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
KEY = bool(os.environ.get("BDL_CLIENT_ID"))
if KEY: UA["X-ClientId"] = os.environ["BDL_CLIENT_ID"]   # clave gratuita de BDL: cupo de 50.000 peticiones por 7 dias; sin ella, limites anonimos (100 por 15 min) y el script espera
_sp = importlib.util.spec_from_file_location("ulp", str(ROOT / "scripts" / "update-land-pl.py")); _m = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_m)
UNITS = _m.UNITS   # codigo BDL de nivel 2 -> id de voivodia (DS, KP, ...)
# (id de variable BDL, grupo, etiqueta en ingles, unidad, factor, aditiva)
CROPS = [("Cereals, total", 4313, 4314, 4315), ("Wheat", 4331, 4332, 4333), ("Rye", 4337, 4338, 4339), ("Barley", 4343, 4344, 4345), ("Oats", 4349, 4350, 4351),
         ("Triticale", 4355, 4356, 4357), ("Maize for grain", 47779, 47752, 47766), ("Potatoes", 4367, 4368, 4369), ("Sugar beets", 4373, 4374, 4375), ("Rape and turnip rape", 4379, 4380, 4381)]
INDICATORS = []
for nm, a, y, h in CROPS:
    key = nm.lower().replace(",", "").replace(" ", "-")
    INDICATORS += [("crop-area-" + key, a, "crops", "%s: sown area" % nm, "ha", 1.0, True), ("crop-yield-" + key, y, "crops", "%s: yield" % nm, "t/ha", 0.1, False),
                   ("crop-harvest-" + key, h, "crops", "%s: harvest" % nm, "t", 0.1, True)]
INDICATORS += [("herd-cattle", 4409, "livestock", "Cattle: total herd", "head", 1.0, True), ("herd-dairy-cows", 4414, "livestock", "Dairy cows", "head", 1.0, True),
               ("herd-pigs", 4421, "livestock", "Pigs: total herd", "head", 1.0, True), ("herd-sheep", 4435, "livestock", "Sheep", "head", 1.0, True),
               ("herd-poultry", 10520, "livestock", "Poultry, total", "head", 1.0, True), ("herd-laying-hens", 10522, "livestock", "Laying hens", "head", 1.0, True),
               ("slaughter-total", 4453, "production", "Production of animals for slaughter, total", "t", 1.0, True), ("slaughter-beef", 4454, "production", "Production of animals for slaughter, beef", "t", 1.0, True),
               ("slaughter-pork", 4456, "production", "Production of animals for slaughter, pork", "t", 1.0, True), ("slaughter-poultry", 4458, "production", "Production of animals for slaughter, poultry", "t", 1.0, True),
               ("milk-production", 47795, "milk", "Cows' milk production", "t", 1000.0, True)]
SNAP = set()   # indicadores de una sola foto (censo agrario 2020, encuesta de agricultura de precision 2023): no tienen serie; se publican con su unico ano
def snap(iid, var, label, unit, additive=True):
    SNAP.add(iid); INDICATORS.append((iid, var, "census", label, unit, 1.0, additive))
for key, var in (("total", 1633195), ("up-to-1-ha", 1633196), ("1-5-ha", 1633197), ("5-10-ha", 1633198), ("10-15-ha", 1633199), ("15-ha-plus", 1633200)): snap("census-farms-size-" + key, var, "Agricultural holdings by area of agricultural land: " + key.replace("-", " "), "farms")
for key, var in (("cereal", 1641527), ("vegetables", 1641528), ("other-crops", 1641530)): snap("census-treatments-" + key, var, "Plant protection treatments on the surface: " + key.replace("-", " "), "pcs")
for key, var in (("cereal", 1641532), ("vegetables", 1641533), ("other-crops", 1641535)): snap("census-treatments-farms-" + key, var, "Farms making plant protection treatments: " + key.replace("-", " "), "farms")
for key, var in (("tractors", 1641445), ("combine-harvesters-cereals", 1641446), ("field-crop-sprayers", 1641450)): snap("census-machines-" + key, var, "Agricultural machines: " + key.replace("-", " "), "pcs")
for key, var in (("tractors", 1641452), ("combine-harvesters-cereals", 1641453), ("field-crop-sprayers", 1641457)): snap("census-machines-farms-" + key, var, "Farms using: " + key.replace("-", " "), "farms")
for key, var, u in (("solid-manure", 1640595, "t"), ("poultry-manure", 1640596, "t"), ("liquid-manure", 1640597, "m3"), ("slurry", 1640598, "m3")): snap("census-manure-" + key, var, "Natural fertiliser consumption: " + key.replace("-", " "), u)
for key, var in (("solid-manure", 1640599), ("poultry-manure", 1640600), ("liquid-manure", 1640601), ("slurry", 1640602)): snap("census-manure-farms-" + key, var, "Farms using natural fertiliser: " + key.replace("-", " "), "farms")
for key, var in (("robots", 1751757), ("gps-sprayers", 1751758), ("band-sprayers", 1751759), ("variable-rate", 1751760), ("crop-monitoring", 1751761), ("soil-samples", 1751762), ("software", 1751763), ("internet", 1751764)): snap("precision-" + key, var, "Farms with precision farming / digital tools: " + key.replace("-", " "), "farms")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
NREQ = [0, time.time()]
def get(u, tries=4, timeout=90):
    last = None
    for i in range(tries):
        if not KEY and NREQ[0] >= 70 and time.time() - NREQ[1] < 900:
            w = 905 - (time.time() - NREQ[1]); log("pausa", int(w), "s por el limite anonimo de la API"); time.sleep(max(w, 1)); NREQ[0] = 0; NREQ[1] = time.time()
        try:
            time.sleep(0.5 if KEY else 1.3); NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429: log("429 de la API: espero 15 min"); time.sleep(910); NREQ[0] = 0; NREQ[1] = time.time()
            else: time.sleep(8 * (i + 1))
        except Exception as e:
            last = e; time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:140], last))
def fetch(var, level, fixtures):
    if fixtures: return json.loads((Path(fixtures) / ("data%d_l%d.json" % (var, level))).read_text("utf-8"))
    return get(B + "data/by-variable/%d?unit-level=%d&format=json&lang=en&page-size=100" % (var, level))
def one_series(unit, years, mult):
    by = {}
    for v in unit["values"]:
        if v.get("attrId") == 1 and v.get("val") is not None: by[int(v["year"])] = round(v["val"] * mult, 4)
    return [by.get(y) for y in years]
def build(fixtures=None):
    out = []
    for iid, var, grp, label, unit, mult, additive in INDICATORS:
        try: out.append(one_indicator(iid, var, grp, label, unit, mult, additive, fixtures))
        except Exception as e:
            if iid not in SNAP: raise
            log("censo/precision: %s omitido (%s)" % (iid, str(e)[:120]))
    return [x for x in out if x]
def one_indicator(iid, var, grp, label, unit, mult, additive, fixtures):
    if True:
        l2, l0 = fetch(var, 2, fixtures), fetch(var, 0, fixtures)
        if l2.get("variableId", var) != var or l0.get("variableId", var) != var: raise RuntimeError("%s: la API devolvio otra variable" % iid)
        res = {u["id"]: u for u in l2["results"]}
        if set(res) != set(UNITS): raise RuntimeError("%s: unidades distintas de las 16 voivodias (%s)" % (iid, sorted(set(res) ^ set(UNITS))[:4]))
        if len(l0["results"]) != 1 or l0["results"][0]["id"] != "000000000000": raise RuntimeError("%s: nivel nacional inesperado" % iid)
        ys = sorted({int(v["year"]) for u in l2["results"] for v in u["values"]} | {int(v["year"]) for v in l0["results"][0]["values"]})
        years = list(range(ys[0], ys[-1] + 1))
        reg = {UNITS[i]: one_series(res[i], years, mult) for i in res}
        nat = one_series(l0["results"][0], years, mult)
        # recorta los anos iniciales y finales sin ningun dato (la serie empieza cuando hay datos de voivodia)
        has = [any(a[i] is not None for a in reg.values()) for i in range(len(years))]
        if not any(has): log("sin datos por voivodia:", iid); return None
        s, e = has.index(True), len(has) - 1 - has[::-1].index(True)
        years = years[s:e + 1]; reg = {k: a[s:e + 1] for k, a in reg.items()}; nat = nat[s:e + 1]
        return {"id": iid, "group": grp, "label": label, "unit": unit, "years": years, "national": nat, "regions": reg, "additive": additive, "variable": var}
def validate(ind):
    if len(ind) < 60: raise RuntimeError("demasiados pocos indicadores (%d)" % len(ind))
    for x in ind:
        n = len(x["years"]); ids = x["id"]
        if len(x["national"]) != n or any(len(a) != n for a in x["regions"].values()): raise RuntimeError("%s: longitudes distintas" % ids)
        if any(v is not None and (not isinstance(v, (int, float)) or v < 0) for a in list(x["regions"].values()) + [x["national"]] for v in a): raise RuntimeError("%s: valor negativo o no numerico" % ids)
        if x["id"] not in SNAP and x["years"][-1] < datetime.date.today().year - 3: raise RuntimeError("%s: ultimo ano %d demasiado antiguo" % (ids, x["years"][-1]))
        last = None
        for i in range(n - 1, -1, -1):
            if x["national"][i] is not None and sum(1 for a in x["regions"].values() if a[i] is not None) == 16: last = i; break
        if last is None: raise RuntimeError("%s: ningun ano con las 16 voivodias y el total nacional" % ids)
        vals = [a[last] for a in x["regions"].values()]; nat = x["national"][last]
        if x["additive"]:
            if nat and abs(sum(vals) / nat - 1) > 0.02: raise RuntimeError("%s %d: la suma de las voivodias (%s) se aparta mas del 2 %% del total nacional (%s)" % (ids, x["years"][last], round(sum(vals), 1), nat))
        elif nat is not None and not min(vals) <= nat <= max(vals): raise RuntimeError("%s %d: el valor nacional queda fuera del rango de las voivodias" % (ids, x["years"][last]))
def licence_ok(src):
    try: v = json.loads((ROOT / "data" / "license-registry.json").read_text("utf-8"))["sources"][src]
    except Exception: return False
    return v.get("status") == "VERIFIED" and bool(v.get("used"))
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--out" in args: outdir = Path(args[args.index("--out") + 1])
    fx = args[args.index("--fixtures") + 1] if "--fixtures" in args else None
    log("clave BDL_CLIENT_ID: %s" % ("presente" if KEY else "ausente (limites anonimos)"))
    try:
        ind = build(fx); validate(ind)
        if not licence_ok("gus_poland") and "--out" not in args: log("Polonia (regiones) leida y validada pero NO publicada: gus_poland no esta VERIFIED"); return 0
        doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "indicators": ind,
               "source": {"name": "GUS (Statistics Poland), Local Data Bank (BDL): crop production, livestock population, animal production by voivodeship", "url": "https://bdl.stat.gov.pl/bdl/dane/podgrup/temat",
                          "api": B + "data/by-variable/{variableId}?unit-level=2", "licence": "Statistics Poland copyright notice: copying and own compilations allowed if the source is cited",
                          "note": "Valores definitivos por voivodia (nivel 2 de BDL) y total nacional (nivel 0). Cosecha y rendimiento convertidos de dt a t; leche de miles de toneladas a t. Los huecos son datos que GUS no publica."}}
        p = outdir / "poland-regions" / "regions.json"; p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".json.tmp"); tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); os.replace(tmp, p)
        log("OK Polonia regiones: %d indicadores, 16 voivodias" % len(ind)); return 0
    except Exception as e:
        log("ERROR Polonia regiones:", e); return 1
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "poland-regions-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

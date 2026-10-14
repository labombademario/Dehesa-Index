#!/usr/bin/env python3
"""Polonia: precio medio de la tierra arable (por hectárea) en el tráfico privado, por voivodía, 1999-hoy -> data/poland-land/land.json.
Fuente: GUS (Oficina Central de Estadística), Banco de Datos Locales (BDL), API pública https://bdl.stat.gov.pl/api/v1/ , tema P1460
«Average prices of arable land (per 1ha) in private turnover» (PLN/ha) y, desde 2013, tema P3415 (prados y pastos: total 450360, buenos 450359, malos 450358). Variables 4899 (total), 4902 (fértil), 4905 (medianamente fértil), 4908 (pobre).
Licencia: aviso de copyright de GUS (registro de licencias, fuente gus_poland): copia y resúmenes propios permitidos citando la fuente.
Solo se publica el valor definitivo de cada año (attrId 1); cualquier otro atributo (p. ej. 91, que llega con valor 0) es un hueco, nunca un cero.
Las unidades se identifican por el código BDL del nivel 2 (no por el nombre). Validaciones (si falla alguna no se escribe nada): 16 voivodías, años consecutivos iguales en las cuatro variables,
valores entre 500 y 400.000 PLN/ha, saltos interanuales entre -45 % y +120 % (prados: -60 % y +250 %, mercado fino) (2005, adhesión a la UE, llega a +97 % en la tierra pobre de Cuyavia-Pomerania), el valor nacional dentro del mínimo y el máximo de las voivodías.
Uso: update-land-pl.py [--out DIR] [--fixtures DIR]   (con --fixtures no se toca la red; así lo usan los tests)"""
import datetime, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://bdl.stat.gov.pl/api/v1/"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
if os.environ.get('BDL_CLIENT_ID'): UA['X-ClientId'] = os.environ['BDL_CLIENT_ID']   # clave gratuita de la API de BDL (mas cupo de peticiones); sin ella, limites anonimos
VARS = {"total": 4899, "fertile": 4902, "medium": 4905, "barren": 4908}
MEADOW_VARS = {"meadow": 450360, "goodMeadow": 450359, "badMeadow": 450358}   # P3415: pastos/prados, serie anual desde 2013
UNITS = {"011200000000": "MA", "012400000000": "SL", "020800000000": "LB", "023000000000": "WP", "023200000000": "ZP", "030200000000": "DS", "031600000000": "OP", "040400000000": "KP",
         "042200000000": "PM", "042800000000": "WN", "051000000000": "LD", "052600000000": "SK", "060600000000": "LU", "061800000000": "PK", "062000000000": "PD", "071400000000": "MZ"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, tries=4, timeout=90):
    last = None
    for i in range(tries):
        try:
            time.sleep(1.4)
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429: log("429 de la API: espero 15 min"); time.sleep(910)
            else: time.sleep(8 * (i + 1))
        except Exception as e:
            last = e; time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:140], last))
def fetch(var, level, fixtures):
    if fixtures: return json.loads((Path(fixtures) / ("data%d_l%d.json" % (var, level))).read_text("utf-8"))
    return get(B + "data/by-variable/%d?unit-level=%d&format=json&lang=en&page-size=100" % (var, level))
def series(unit, years):
    """[valor por año] con solo attrId 1; huecos = None."""
    by = {}
    for v in unit["values"]:
        if v.get("attrId") == 1 and v.get("val") is not None: by[int(v["year"])] = v["val"]
        else: log("  descartado %s %s (attr %s, val %s)" % (unit.get("name"), v.get("year"), v.get("attrId"), v.get("val")))
    return [by.get(y) for y in years]
def one(var, level_fx, fixtures, years, strict_years):
    """{unidad: serie alineada a years} de una variable; con strict_years los anos deben coincidir exactamente con years (las clases de tierra arable), si no deben ser un tramo final consecutivo de years (pastos, desde 2013)."""
    l2, l0 = fetch(var, 2, fixtures), fetch(var, 0, fixtures)
    if l2.get("variableId", var) != var or l0.get("variableId", var) != var: raise RuntimeError("la API devolvio otra variable")
    res = {u["id"]: u for u in l2["results"]}
    if set(res) != set(UNITS): raise RuntimeError("%s: unidades distintas de las 16 voivodias (%s)" % (var, sorted(set(res) ^ set(UNITS))[:4]))
    ys = sorted({int(v["year"]) for u in l2["results"] for v in u["values"]} | {int(v["year"]) for u in l0["results"] for v in u["values"]})
    if ys != list(range(ys[0], ys[-1] + 1)): raise RuntimeError("%s: anos con huecos" % var)
    if len(l0["results"]) != 1 or l0["results"][0]["id"] != "000000000000": raise RuntimeError("%s: nivel nacional inesperado" % var)
    return ys, res, l0["results"][0]
def build(fixtures=None):
    classes, years = {}, None
    for cls, var in VARS.items():
        ys, res, nat = one(var, None, fixtures, years, True)
        if years is None: years = ys
        elif ys != years: raise RuntimeError("%s: anos distintos a los de la variable total" % cls)
        d = {UNITS[i]: series(res[i], years) for i in res}
        d["PL"] = series(nat, years)
        classes[cls] = d
    for cls, var in MEADOW_VARS.items():
        ys, res, nat = one(var, None, fixtures, years, False)
        if ys[-1] != years[-1] or ys[0] < years[0]: raise RuntimeError("%s: anos fuera del rango de la tierra arable" % cls)
        pad = [None] * (ys[0] - years[0])
        d = {UNITS[i]: pad + series(res[i], ys) for i in res}
        d["PL"] = pad + series(nat, ys)
        classes[cls] = d
    return years, classes

def validate(years, classes):
    n = len(years)
    for cls, d in classes.items():
        for k, a in d.items():
            if len(a) != n: raise RuntimeError("%s %s: longitud" % (cls, k))
            prev = None; lo, hi = (-0.60, 2.50) if cls in MEADOW_VARS else (-0.45, 1.20)   # mercados de prados finos: medias de GUS mas volatiles (p. ej. prados malos de Pequena Polonia 2025: 27.083 -> 60.000)
            for i, x in enumerate(a):
                if x is None: prev = None; continue
                if not isinstance(x, (int, float)) or not 500 <= x <= 400000: raise RuntimeError("%s %s %d: valor fuera de rango (%s)" % (cls, k, years[i], x))
                if prev and not lo < x / prev - 1 < hi: raise RuntimeError("%s %s %d: salto interanual absurdo (%s -> %s)" % (cls, k, years[i], prev, x))
                prev = x
        for i in range(n):
            reg = [a[i] for k, a in d.items() if k != "PL" and a[i] is not None]
            if reg and d["PL"][i] is not None and not min(reg) <= d["PL"][i] <= max(reg): raise RuntimeError("%s %d: el valor nacional queda fuera del rango de las voivodias" % (cls, years[i]))
    if sum(1 for k, a in classes["total"].items() if k != "PL" and a[-1] is not None) < 16: raise RuntimeError("total: faltan voivodias en el ultimo ano")
def licence_ok(src):
    try: v = json.loads((ROOT / "data" / "license-registry.json").read_text("utf-8"))["sources"][src]
    except Exception: return False
    return v.get("status") == "VERIFIED" and bool(v.get("used"))
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--out" in args: outdir = Path(args[args.index("--out") + 1])
    fx = args[args.index("--fixtures") + 1] if "--fixtures" in args else None
    log("clave BDL_CLIENT_ID: %s" % (("presente (%d caracteres)" % len(os.environ["BDL_CLIENT_ID"])) if os.environ.get("BDL_CLIENT_ID") else "ausente (limites anonimos)"))
    try:
        years, classes = build(fx); validate(years, classes)
        if not licence_ok("gus_poland") and "--out" not in args: log("Polonia leida y validada pero NO publicada: gus_poland no esta VERIFIED en el registro de licencias"); return 0
        doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "PLN/ha", "years": years, "classes": classes,
               "source": {"name": "GUS (Statistics Poland), Local Data Bank (BDL): average prices of arable land (per 1 ha) in private turnover", "url": "https://bdl.stat.gov.pl/bdl/dane/podgrup/temat?tema=P1460",
                          "api": B + "data/by-variable/4899", "licence": "Statistics Poland copyright notice: copying and own compilations allowed if the source is cited",
                          "note": "Precio medio de la tierra arable por hectárea en el tráfico privado (PLN corrientes), por voivodía y calidad de la tierra (BDL: total, fértil, medianamente fértil, pobre). Solo el valor definitivo de cada año; los huecos son datos que GUS no publica."}}
        p = outdir / "poland-land" / "land.json"; p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".json.tmp"); tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); os.replace(tmp, p)
        log("OK Polonia: %d-%d, 16 voivodias, total nacional %s PLN/ha (%d)" % (years[0], years[-1], classes["total"]["PL"][-1], years[-1]))
        return 0
    except Exception as e:
        log("ERROR Polonia:", e); return 1
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "land-pl-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

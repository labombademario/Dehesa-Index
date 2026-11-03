#!/usr/bin/env python3
"""Polonia por municipio (gmina, ~2.480): Censo Agrario 2020 (PSR 2020) de GUS, Banco de Datos Locales (BDL)
-> data/pl-gminy/<VOIVODIA>.json + index.json
Fuente: GUS, API publica https://bdl.stat.gov.pl/api/v1/ (data/by-variable/{id}?unit-level=6). Licencia: aviso de copyright de GUS (fuente gus_poland). Necesita BDL_CLIENT_ID (clave gratuita de BDL, cupo de 50.000 peticiones).
Temas del censo 2020 con nivel gmina (nivel 6 de BDL): P4137 explotaciones por tamaño, P4138 tamaño medio, P4141 superficie agraria por tamaño, P4142 uso del suelo, P4144 explotaciones que venden,
P4146 ganado, P4149 superficie sembrada, P4083 mano de obra (AWU). Solo las explotaciones agrarias en total. Solo se guardan las gminas de tipo 1 (urbana), 2 (rural) y 3 (urbano-rural) (ultima cifra del id de 12 cifras):
los tipos 4 y 5 son partes de una gmina urbano-rural y contarian dos veces. Un valor ausente o con atributo distinto del definitivo (attrId 1) queda como hueco; los secretos estadisticos son frecuentes en municipios pequeños.
Controles (si fallan no se escribe nada): entre 2.400 y 2.550 gminas; cada gmina cuelga de un powiat conocido (data/pl-powiaty); sin negativos; para las variables aditivas que tienen su equivalente por powiat,
la suma de las gminas de cada powiat cuadra con el valor que GUS publica para el powiat (2 % + 5; solo donde ninguna gmina del powiat esta oculta) y nunca lo supera en mas de un 5 %; para el tamaño medio, el valor del powiat queda entre el minimo y el maximo de sus gminas.
Uso: update-pl-gminy.py [--out DIRECTORIO]"""
import concurrent.futures, datetime, importlib.util, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://bdl.stat.gov.pl/api/v1/"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
KEY = bool(os.environ.get("BDL_CLIENT_ID"))
if KEY: UA["X-ClientId"] = os.environ["BDL_CLIENT_ID"]
YEAR = 2020
_sp = importlib.util.spec_from_file_location("ulp", str(ROOT / "scripts" / "update-land-pl.py")); _m = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_m)
UNITS = _m.UNITS
# (tema, [(variable de gmina, variable equivalente por powiat o None, aditiva)])
def pair(a, b, n, add=True): return [(a + i, (b + i) if b else None, add) for i in range(n)]
VARS = [("P4137", pair(1633195, 1633320, 6)), ("P4141", pair(1645055, 1633298, 6)), ("P4138", [(1633207, 1633270, False), (1633208, 1633271, False)]),
        ("P4142", pair(1645079, 1633344, 11)), ("P4144", [(1633419, 1633413, True)]),
        ("P4146", [(1645219, 1645195, True), (1645220, 1645196, True), (1645221, 1645197, True), (1645222, 1645198, True), (1645223, 1645199, True), (1645224, 1645200, True), (1646129, 1646085, True),
                   (1645225, 1645201, True), (1645226, 1645202, True), (1645227, 1645203, True), (1645228, 1645204, True), (1645229, 1645205, True)]),
        ("P4149", [(1645123, 1633601, True), (1645124, 1633602, True), (1645125, 1633603, True), (1645137, 1633604, True), (1645138, 1633605, True), (1645139, 1633606, True), (1645140, 1633607, True)]
                  + [(v, None, True) for v in (1645126, 1645127, 1645128, 1645130, 1645131, 1645132, 1645133, 1645329, 1645330, 1645331)]),
        ("P4083", [(1623463, 1623469, True)])]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, tries=8, timeout=90):
    last = None
    for i in range(tries):
        try:
            time.sleep(0.15 if KEY else 1.3)
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429: time.sleep(60 * (i + 1))
            else: time.sleep(min(8 * (i + 1), 40))
        except Exception as e: last = e; time.sleep(min(8 * (i + 1), 40))
    raise RuntimeError("%s -> %s" % (u[:140], last))
def pages(var):
    for i in range(3):
        try: return pages1(var)
        except Exception as e:
            if i == 2: raise
            time.sleep(20)
def pages1(var):
    out, p = [], 0
    while True:
        d = get(B + "data/by-variable/%d?unit-level=6&year=%d&format=json&lang=en&page-size=100&page=%d" % (var, YEAR, p))
        if d.get("variableId", var) != var: raise RuntimeError("%d: la API devolvio otra variable" % var)
        out += d.get("results", [])
        if len(out) >= d.get("totalRecords", 0) or not d.get("results"): return out
        p += 1
def val(u):
    for v in u.get("values", []):
        if int(v["year"]) == YEAR and v.get("attrId") == 1 and v.get("val") is not None: return v["val"]
    return None
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "pl-gminy"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "pl-gminy-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    log("clave BDL_CLIENT_ID: %s" % ("presente" if KEY else "ausente (limites anonimos: muy lento)"))
    # powiaty (de data/pl-powiaty): nombre y valores para el control
    PW, PWV = {}, {}
    for f in sorted((ROOT / "data" / "pl-powiaty").glob("[A-Z][A-Z].json")):
        d = json.loads(f.read_text("utf-8"))
        for pid, p in d["powiaty"].items(): PW[pid] = p["n"].replace("Powiat ", "", 1); PWV[pid] = p["v"]
    if len(PW) != 380: return fail("faltan powiaty de data/pl-powiaty (%d)" % len(PW))
    meta = {}
    for subj, vs in VARS:
        d = get(B + "variables?subject-id=%s&page-size=100&format=json&lang=en" % subj)
        for r in d.get("results", []): meta[r["id"]] = (subj, [r.get(k) for k in ("n1", "n2", "n3") if r.get(k)], r.get("measureUnitName") or "-")
    allv = [v for subj, vs in VARS for v in vs]
    for v, pv, add in allv:
        if v not in meta: return fail("variable", v, "no figura en su tema")
    CACHE = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6 if KEY else 1) as ex:
        futs = {ex.submit(pages, v): v for v, pv, add in allv}
        for f in concurrent.futures.as_completed(futs):
            try: CACHE[futs[f]] = f.result()
            except Exception as e: return fail("variable", futs[f], str(e)[:200])
    log("variables descargadas:", len(CACHE))
    G, IND = {}, {}; ok = tot = over = 0; bad = []
    for v, pv, add in allv:
        rows = CACHE[v]
        for u in rows:
            uid = u["id"]
            if not (len(uid) == 12 and uid.isdigit()): return fail("id de gmina no valido", uid)
            if uid[-1] not in "123": continue
            pid = uid[:9] + "000"
            if pid not in PW: return fail("gmina sin powiat conocido", uid, pid)
            if uid[:4] + "00000000" not in UNITS: return fail("gmina sin voivodia conocida", uid)
            x = val(u)
            if x is not None and x < 0: return fail("valor negativo", v, uid)
            G.setdefault(uid, {"n": u["name"], "p": pid, "v": {}})["v"][str(v)] = x
        if pv is not None:
            by = {}
            for uid, g in G.items():
                if str(v) in g["v"]: by.setdefault(g["p"], []).append(g["v"][str(v)])
            for pid, xs in by.items():
                t = PWV[pid].get(str(pv)); have = [x for x in xs if x is not None]
                if t is None or not have: continue
                if add:
                    tol = 0.02 * abs(t) + 5
                    if sum(have) > t * 1.05 + tol: over += 1; bad.append(("DESBORDE", v, pid, round(sum(have), 1), t))
                    if None in xs or t < 100: continue
                    tot += 1; g_ = abs(sum(have) - t) <= tol; ok += g_
                    if not g_: bad.append(("DESCUADRE", v, pid, round(sum(have), 1), t))
                else:
                    tot += 1; g_ = min(have) * 0.98 - 0.05 <= t <= max(have) * 1.02 + 0.05; ok += g_
                    if not g_: bad.append(("FUERA", v, pid, t, min(have), max(have)))
        s, lab, un = meta[v]; IND[str(v)] = {"subject": s, "label": " | ".join(lab), "unit": un, "additive": add}
    log("gminas (tipos 1-3):", len(G))
    if not 2400 <= len(G) <= 2550: return fail("numero de gminas inesperado:", len(G))
    for b in bad[:25]: log(*b)
    log("control: %d de %d cuadran, %d desbordes" % (ok, tot, over))
    if tot < 500 or ok < 0.85 * tot or over > 0.01 * tot: return fail("el control no cuadra, no se escribe nada")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "gus_poland", "name": "GUS (Statistics Poland), Local Data Bank (BDL), Powszechny Spis Rolny 2020", "url": "https://bdl.stat.gov.pl/", "license": "GUS: cita de la fuente"}
    out.mkdir(parents=True, exist_ok=True); per = {}
    for uid, g in sorted(G.items()):
        per.setdefault(UNITS[uid[:4] + "00000000"], {})[uid] = {"n": g["n"], "p": PW[g["p"]], "k": g["p"][:9], "v": {k: x for k, x in g["v"].items() if x is not None}}
    for v_, gm in sorted(per.items()):
        (out / (v_ + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "voivodeship": v_, "year": YEAR, "gminy": gm}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "year": YEAR, "voivodeships": sorted(per), "indicators": IND}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d gminas en %d voivodias, %d indicadores, %d KB" % (len(G), len(per), len(IND), sum(f.stat().st_size for f in out.glob("*.json")) // 1024))
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Polonia por distrito (powiat, 380: 314 powiaty y 66 ciudades con derechos de powiat): Censo Agrario 2020 (PSR 2020) de GUS, Banco de Datos Locales (BDL)
-> data/pl-powiaty/<VOIVODIA>.json + index.json
Fuente: GUS, API publica https://bdl.stat.gov.pl/api/v1/ (data/by-variable/{id}?unit-level=5 para los powiaty y unit-level=2 para las 16 voivodias). Licencia: aviso de copyright de GUS (fuente gus_poland).
Clave gratuita BDL_CLIENT_ID (cupo de 50.000 peticiones); sin ella se aplican los limites anonimos y el script espera, pero la ejecucion es larga.
Temas del censo 2020 con nivel powiat: P4122 explotaciones por tamaño, P4124 superficie agraria por tamaño de explotacion, P4125 tamaño medio, P4127 uso del suelo, P4129 explotaciones que venden,
P4131 ganado (cabezas y explotaciones con cada especie), P4134 superficie sembrada, P4084 mano de obra (AWU). Solo las explotaciones agrarias en total (no el subconjunto de explotaciones individuales).
Las series de rendimientos, cosechas y leche NO existen por powiat en BDL (solo por voivodia: ya estan en poland-regions). Todo tal cual lo publica la fuente; un valor ausente o con atributo distinto del definitivo (attrId 1) queda como hueco.
Controles (si fallan no se escribe nada): 380 powiaty; cada powiat pertenece a su voivodia por codigo; sin negativos; para las variables aditivas la suma de los powiaty de cada voivodia cuadra con el valor que GUS publica para la voivodia (2 % + 5);
para el tamaño medio, la media de la voivodia queda entre el minimo y el maximo de sus powiaty.
Uso: update-pl-powiaty.py [--out DIRECTORIO]"""
import concurrent.futures, datetime, importlib.util, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://bdl.stat.gov.pl/api/v1/"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
KEY = bool(os.environ.get("BDL_CLIENT_ID"))
if KEY: UA["X-ClientId"] = os.environ["BDL_CLIENT_ID"]
YEAR = 2020
# tema -> (variables de BDL, aditiva)
VARS = [("P4122", list(range(1633320, 1633326)), True), ("P4124", list(range(1633298, 1633304)), True), ("P4125", [1633270, 1633271], False),
        ("P4127", list(range(1633344, 1633355)), True), ("P4129", list(range(1633413, 1633419)), True),
        ("P4131", [1645195, 1645196, 1645197, 1645198, 1646082, 1646083, 1646084, 1645199, 1645200, 1646085, 1646086, 1646089, 1646090, 1646091,
                   1645201, 1645202, 1645203, 1645204, 1646092, 1646093, 1646094, 1645205], True),
        ("P4134", list(range(1633601, 1633608)), True), ("P4084", [1623469, 1623472, 1623475, 1623478], True)]
_sp = importlib.util.spec_from_file_location("ulp", str(ROOT / "scripts" / "update-land-pl.py")); _m = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_m)
UNITS = _m.UNITS   # id BDL de nivel 2 -> voivodia (DS, KP...)
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
NREQ = [0, time.time()]
def get(u, tries=4, timeout=90):
    last = None
    for i in range(tries):
        if not KEY and NREQ[0] >= 70 and time.time() - NREQ[1] < 900:
            w = 905 - (time.time() - NREQ[1]); log("pausa", int(w), "s por el limite anonimo"); time.sleep(max(w, 1)); NREQ[0] = 0; NREQ[1] = time.time()
        try:
            time.sleep(0.2 if KEY else 1.3); NREQ[0] += 1
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429: log("429: espero 15 min"); time.sleep(910); NREQ[0] = 0; NREQ[1] = time.time()
            else: time.sleep(8 * (i + 1))
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:140], last))
def pages(var, level):
    out, p = [], 0
    while True:
        d = get(B + "data/by-variable/%d?unit-level=%d&year=%d&format=json&lang=en&page-size=100&page=%d" % (var, level, YEAR, p))
        if d.get("variableId", var) != var: raise RuntimeError("%d: la API devolvio otra variable" % var)
        out += d.get("results", [])
        if len(out) >= d.get("totalRecords", 0) or not d.get("results"): return out
        p += 1
def val(u):
    for v in u.get("values", []):
        if int(v["year"]) == YEAR and v.get("attrId") == 1 and v.get("val") is not None: return v["val"]
    return None
def voiv_of(uid):
    return UNITS.get(uid[:4] + "00000000")
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "pl-powiaty"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "pl-powiaty-log.txt"
    log("clave BDL_CLIENT_ID: %s" % ("presente" if KEY else "ausente (limites anonimos)"))
    meta = {}
    for subj, ids, add in VARS:
        d = get(B + "variables?subject-id=%s&page-size=100&format=json&lang=en" % subj)
        for r in d.get("results", []): meta[r["id"]] = (subj, [r.get(k) for k in ("n1", "n2", "n3") if r.get(k)], r.get("measureUnitName") or "-")
    # la API tarda unos segundos por peticion: con clave se piden en paralelo (6 a la vez, dentro del limite de la API)
    CACHE = {}
    if KEY:
        jobs = [(var, lv) for subj, ids, add in VARS for var in ids if var in meta for lv in (5, 2)]
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
            futs = {ex.submit(pages, v, lv): (v, lv) for v, lv in jobs}
            for f in concurrent.futures.as_completed(futs):
                try: CACHE[futs[f]] = f.result()
                except Exception as e: log("ERROR", futs[f], str(e)[:200]); logf.write_text("\n".join(LOG) + "\n"); return 1
        log("peticiones hechas:", len(CACHE))
    P, IND = {}, {}; ok = tot = over = 0; bad = []
    for subj, ids, add in VARS:
        for var in ids:
            if var not in meta: log("FALLO: variable", var, "no figura en el tema", subj); logf.write_text("\n".join(LOG) + "\n"); return 1
            try: l5, l2 = CACHE.get((var, 5)) or pages(var, 5), CACHE.get((var, 2)) or pages(var, 2)
            except Exception as e: log("ERROR", var, str(e)[:200]); logf.write_text("\n".join(LOG) + "\n"); return 1
            if len(l5) != 380: log("FALLO: %d powiaty en la variable %d (se esperaban 380)" % (len(l5), var)); logf.write_text("\n".join(LOG) + "\n"); return 1
            by = {}
            for u in l5:
                v = voiv_of(u["id"])
                if not v: log("FALLO: powiat sin voivodia conocida", u["id"]); logf.write_text("\n".join(LOG) + "\n"); return 1
                x = val(u)
                if x is not None and x < 0: log("FALLO: valor negativo", var, u["id"]); logf.write_text("\n".join(LOG) + "\n"); return 1
                P.setdefault(u["id"], {"n": u["name"], "v": {}, "l": v})["v"][str(var)] = x
                by.setdefault(v, []).append(x)
            lv = {voiv_of(u["id"]): val(u) for u in l2 if voiv_of(u["id"])}
            for v, xs in by.items():
                t = lv.get(v)
                if t is None: continue
                have = [x for x in xs if x is not None]
                if not have: continue
                if add:
                    tol = 0.02 * abs(t) + 5
                    if sum(have) > t * 1.05 + tol: over += 1; bad.append(("DESBORDE", var, v, round(sum(have), 1), t))
                    if None in xs or t < 100: continue
                    tot += 1; g = abs(sum(have) - t) <= tol; ok += g
                    if not g: bad.append(("DESCUADRE", var, v, round(sum(have), 1), t))
                else:
                    tot += 1; g = min(have) * 0.98 - 0.05 <= t <= max(have) * 1.02 + 0.05; ok += g
                    if not g: bad.append(("FUERA", var, v, t, min(have), max(have)))
            s, lab, un = meta[var]; IND[str(var)] = {"subject": s, "label": " | ".join(lab), "unit": un, "additive": add}
        log("tema", subj, "listo")
    for b in bad[:25]: log(*b)
    log("control: %d de %d cuadran, %d desbordes" % (ok, tot, over))
    if tot < 200 or ok < 0.85 * tot or over > 0.01 * tot: log("FALLO: el control no cuadra, no se escribe nada"); logf.write_text("\n".join(LOG) + "\n"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "gus_poland", "name": "GUS (Statistics Poland), Local Data Bank (BDL), Powszechny Spis Rolny 2020", "url": "https://bdl.stat.gov.pl/", "license": "GUS: cita de la fuente"}
    out.mkdir(parents=True, exist_ok=True); per = {}
    for uid, d in sorted(P.items()): per.setdefault(d["l"], {})[uid] = {"n": d["n"], "v": {k: x for k, x in d["v"].items() if x is not None}}
    for v, pw in sorted(per.items()):
        (out / (v + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "voivodeship": v, "year": YEAR, "powiaty": pw}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "year": YEAR, "voivodeships": sorted(per), "indicators": IND}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d powiaty en %d voivodias, %d indicadores, %d KB" % (len(P), len(per), len(IND), sum(f.stat().st_size for f in out.glob("*.json")) // 1024))
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())

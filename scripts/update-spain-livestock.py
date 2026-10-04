#!/usr/bin/env python3
"""España: efectivos de ganado por provincia (MAPA, «Encuestas ganaderas», libro efectivos_ganado.xlsx; mayo y noviembre desde 2010)
-> data/spain-livestock/livestock-<especie>.json + data/spain-livestock/index.json.

El libro trae una hoja larga «data» (año, mes, comunidad, provincia, especie, variable, valor). De ella solo se leen las filas de provincia (codigo INE de 2 cifras) y el total
nacional (99/99); las filas de comunidad se ignoran porque las comunidades uniprovinciales aparecen dos veces (como provincia y como comunidad) y sumarlas duplicaria.
Nada se estima: una (provincia, variable, periodo) ausente es null. Los valores se guardan tal cual salvo un redondeo a 1 decimal (ovino y caprino traen decimales desde 2016).
Se rechaza la escritura entera si algo no cuadra: valores negativos, componentes que no suman su total, o provincias que no suman el total nacional.
Si el libro no ha cambiado (Last-Modified) no se descarga: solo se actualiza checkedAt. --file usa un libro local (pruebas)."""
import argparse, datetime, io, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-livestock"
URL = "https://www.mapa.gob.es/dam/mapa/contenido/estadisticas/temas/estadisticas-agrarias/3.ganaderia/encuestas-ganaderas/efectivos_ganado.xlsx"
PAGE = "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/ganaderia/encuestas-ganaderas/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
SPECIES = {"Bovino": "bovino", "Ovino": "ovino", "Caprino": "caprino", "Porcino": "porcino"}
# jerarquia: total -> componentes (la suma de componentes debe dar el total)
def _pig(o, t):  # o = desplazamiento del codigo de variable; t = total animales
    return {t: [t + 1, t + 2, t + 3, t + 7, t + 8], t + 3: [t + 4, t + 5, t + 6], t + 8: [t + 9, t + 10, t + 11, t + 12]}
HIER = {
    "bovino": {1: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]},
    "ovino": {1: [2, 3, 4], 4: [5, 6, 7, 8, 9]},
    "caprino": {1: [2, 3, 4], 4: [5, 6, 8, 9]},
    "porcino": {},
}
HIER["porcino"].update(_pig(0, 1)); HIER["porcino"].update(_pig(13, 14)); HIER["porcino"].update(_pig(26, 27))
LOG = []
def TOL(total):
    """El MAPA redondea cada celda por separado: componentes y provincias pueden diferir en unidades (hasta ~0,01 % en las series de ovino y caprino). Mas que eso se rechaza."""
    return 5 + 0.0005 * abs(total)
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def http(url, method="GET", tries=3, timeout=300):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read() if method == "GET" else dict(r.headers)
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s %s -> %s" % (method, url, str(last)[:160]))

def vcode(v):
    """'04TCebo' -> 4"""
    d = ""
    for ch in str(v):
        if ch.isdigit(): d += ch
        else: break
    return int(d)

def parse(rows):
    """rows: filas de la hoja 'data' (la primera es la cabecera). Devuelve {especie: doc}."""
    it = iter(rows); head = [str(x or "").strip() for x in next(it)]
    want = ["AÑO", "MES", "COMUNIDAD", "PROVINCIA", "ESPECIE", "VARIABLE", "VALOR"]
    try: ix = [head.index(w) for w in want]
    except ValueError: raise RuntimeError("cabecera inesperada: %r" % head)
    data = {}; periods = {}; names = {}
    for r in it:
        if r is None or r[ix[0]] is None: continue
        a, m, c, p, e, v, val = [r[i] for i in ix]
        e = str(e).strip()
        if e not in SPECIES: continue
        sp = SPECIES[e]; c = str(c).zfill(2); p = str(p).zfill(2)
        if (c, p) == ("99", "99"): area = "ES"
        elif p != "99" and c != "99" and 1 <= int(p) <= 52: area = p
        else: continue  # fila de comunidad
        per = "%d-%02d" % (int(a), int(m))
        if val is None or str(val).strip() == "": continue
        if not isinstance(val, (int, float)): raise RuntimeError("valor no numerico %r en %s %s %s" % (val, sp, area, v))
        if val < 0: log("valor negativo en la fuente, se deja como hueco: %s %s %s %s = %s" % (sp, area, v, "%d-%02d" % (int(a), int(m)), val)); continue
        code = "%02d" % vcode(v)
        periods.setdefault(sp, set()).add(per)
        names.setdefault(sp, {})[code] = str(v).strip()
        key = (area, code, per)
        if key in data.setdefault(sp, {}) and data[sp][key] != val: raise RuntimeError("valor repetido y distinto: %s %s" % (sp, key))
        data[sp][key] = val
    docs = {}
    for sp in SPECIES.values():
        if sp not in data: raise RuntimeError("falta la especie " + sp)
        pers = sorted(periods[sp]); codes = sorted(names[sp]); pidx = {p: i for i, p in enumerate(pers)}
        areas = sorted({k[0] for k in data[sp]}, key=lambda x: (x != "ES", x))
        v = {}
        for ar in areas:
            v[ar] = {}
            for cd in codes:
                arr = [None] * len(pers); any_ = False
                for per, i in pidx.items():
                    x = data[sp].get((ar, cd, per))
                    if x is not None: arr[i] = round(x, 1) if isinstance(x, float) else x; any_ = True
                if any_: v[ar][cd] = arr
        docs[sp] = {"species": sp, "periods": pers, "vars": [{"id": cd, "src": names[sp][cd]} for cd in codes], "v": v}
    return docs

def validate(docs):
    """Devuelve (errores, avisos). Errores bloquean la escritura: negativos ya apartados, total nacional que no suma sus componentes, provincias que no suman el nacional.
    Un total provincial que no suma sus componentes es una incoherencia de la propia fuente (pasa en provincias pequeñas de porcino): se avisa y se publica tal cual, sin corregir."""
    errs = []; warns = []
    for sp, d in docs.items():
        n = len(d["periods"]); V = d["v"]
        if "ES" not in V: errs.append(sp + ": falta el total nacional"); continue
        for ar, vs in V.items():
            for cd, arr in vs.items():
                if len(arr) != n: errs.append("%s %s %s: longitud" % (sp, ar, cd))
                if any(x is not None and x < 0 for x in arr): errs.append("%s %s %s: valor negativo" % (sp, ar, cd))
        for ar, vs in V.items():  # componentes suman el total
            for tot, comps in HIER[sp].items():
                t = vs.get("%02d" % tot)
                if t is None: continue
                cs = [vs.get("%02d" % c) for c in comps]
                for i in range(n):
                    if t[i] is None: continue
                    present = [c[i] for c in cs if c is not None and c[i] is not None]
                    if len(present) != len(comps): continue  # componentes incompletos: no se compara
                    if abs(sum(present) - t[i]) > TOL(t[i]): (errs if ar == "ES" else warns).append("%s %s var %02d %s: componentes %s != total %s" % (sp, ar, tot, d["periods"][i], round(sum(present), 1), t[i])); break
        provs = [a for a in V if a != "ES"]  # provincias suman el nacional
        for cd, nat in V["ES"].items():
            for i in range(n):
                if nat[i] is None: continue
                ps = [V[a][cd][i] for a in provs if cd in V[a] and V[a][cd][i] is not None]
                if len(ps) != len(provs): continue
                if abs(sum(ps) - nat[i]) > TOL(nat[i]): errs.append("%s var %s %s: provincias %s != nacional %s" % (sp, cd, d["periods"][i], round(sum(ps), 1), nat[i])); break
    return errs, warns

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def write_json(path, obj):
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file"); ap.add_argument("--force", action="store_true"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True)
    idx_path = out / "index.json"; old = json.loads(idx_path.read_text("utf-8")) if idx_path.exists() else None
    lm = None
    if a.file: blob = Path(a.file).read_bytes()
    else:
        try: lm = http(URL, "HEAD").get("Last-Modified")
        except Exception as e: log("HEAD fallo, se descarga igualmente:", e)
        if old and lm and old.get("lastModified") == lm and not a.force:
            old["checkedAt"] = now(); write_json(idx_path, old); log("libro sin cambios (Last-Modified %s)" % lm); return 0
        blob = http(URL)
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
    if "data" not in wb.sheetnames: log("ERROR: el libro no tiene la hoja 'data'"); return 1
    try: docs = parse(wb["data"].iter_rows(values_only=True))
    except Exception as e: log("ERROR al leer:", e); return 1
    errs, warns = validate(docs)
    for w in warns: log("AVISO (incoherencia de la fuente, se publica tal cual):", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    t = now(); species = {}
    for sp, d in docs.items():
        d["schemaVersion"] = 1; d["generatedAt"] = t; d["source"] = {"id": "mapa_es", "url": URL}; d["units"] = "cabezas"; write_json(out / ("livestock-%s.json" % sp), d)
        species[sp] = {"file": "livestock-%s.json" % sp, "first": d["periods"][0], "last": d["periods"][-1], "periods": len(d["periods"]), "vars": len(d["vars"]), "areas": len(d["v"]) - 1}
    write_json(idx_path, {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": URL}, "page": PAGE, "lastModified": lm or (old or {}).get("lastModified"), "species": species})
    log("OK:", ", ".join("%s %s..%s" % (s, v["first"], v["last"]) for s, v in species.items())); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-livestock-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

#!/usr/bin/env python3
"""España: vino mes a mes y por comunidad (MAPA, INFOVI informe mensual) -> data/spain-wine/monthly.json.

El MAPA publica cada mes un libro con las declaraciones de los operadores (productores de >= 1.000 hl y almacenistas): existencias iniciales (cuadro 1), entrada de uva y producción del mes (2.1),
entradas de vino de España (3.1) y de otros países (3.2), salidas por destino (4.0: interiores, UE y terceros países), salidas por operaciones propias (4.6) y existencias finales (5), en hl, por comunidad.
- NO es el mismo perímetro que el informe ampliado de campaña (data/spain-wine/infovi.json, todos los operadores): el mensual es mas estrecho y sus cifras no se suman ni se mezclan con las de campaña.
- Los libros no tienen un nombre fijo: se leen todos los .xlsx de la pagina anual (salvo ampliados, existencias y boletines) y el mes sale del titulo del cuadro 5 («EXISTENCIAS FINALES A 31 DE JULIO 2026»). Si dos libros son del mismo mes gana el «corregido» o el ultimo.
- Se rechaza la escritura entera si algo no cuadra (totales distintos de la suma de comunidades, salidas distintas de interiores + exteriores, existencias que no encadenan, identidad de existencias rota en mas de un 10 %; en los meses de vendimia el residuo llega al 1-2 % porque el mosto que fermenta pasa a vino y el libro no lo recoge, por eso solo se avisa).
--file usa un libro local (pruebas)."""
import argparse, datetime, importlib.util, io, json, os, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("usw_base", ROOT / "scripts" / "update-spain-wine.py"); B = importlib.util.module_from_spec(sp); sp.loader.exec_module(B)
OUT = ROOT / "data" / "spain-wine"
FIRST = B.FIRST
CCAA, SITE, V = B.CCAA, B.SITE, B.V
F = ["stockStart", "stockEnd", "mustEnd", "grape", "production", "inSpain", "inAbroad", "exitsDomestic", "exitsEU", "exitsThird", "exitsTotal", "ownOps"]
LOG = B.LOG; log = B.log; http = B.http; norm = B.norm
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
def month_of(wb):
    S = B.sheets(wb)
    ws = S.get("5")
    if ws is None: raise ValueError("falta el cuadro 5")
    for r in ws.iter_rows(min_row=1, max_row=4):
        for c in r:
            if isinstance(c.value, str) and c.value.strip().upper().startswith("CUADRO"):
                m = re.search(r"(?i)\ba\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de\s+)?(\d{4})", re.sub(r"\s+", " ", c.value))
                if m and norm(m.group(2)) in MONTHS: return "%s-%02d" % (m.group(3), MONTHS.index(norm(m.group(2))) + 1)
    raise ValueError("no se lee el mes del cuadro 5")
def parse(wb):
    S = B.sheets(wb); need = ["1", "2.1", "3.1", "3.2", "4.0", "5"]; opt = "4.6" in S  # el libro de enero de 2021 no trae el cuadro 4.6: sin dato, no cero
    miss = [k for k in need if k not in S]
    if miss: raise ValueError("faltan cuadros del informe: " + ", ".join(miss))
    T = {k: B.block(S[k]) for k in need + (["4.6"] if opt else [])}
    for k in T:
        if "TOTAL" not in T[k] or len([x for x in T[k] if x != "TOTAL"]) != 17: raise ValueError("cuadro %s: no se leen las 17 comunidades y el total" % k)
    c = B.cells; d = {}
    d["stockStart"] = c(T["1"], 6); d["stockEnd"] = c(T["5"], 6); d["mustEnd"] = c(T["5"], 7)
    d["grape"] = {k: None if v is None else v / 1000.0 for k, v in c(T["2.1"], 2).items()}; d["production"] = c(T["2.1"], 5)
    d["inSpain"] = c(T["3.1"], 4); d["inAbroad"] = c(T["3.2"], 6)
    d["exitsDomestic"] = c(T["4.0"], 3); d["exitsEU"] = c(T["4.0"], 4); d["exitsThird"] = c(T["4.0"], 5); d["_exitsExt"] = c(T["4.0"], 6); d["exitsTotal"] = c(T["4.0"], 7)
    d["ownOps"] = c(T["4.6"], 2) if opt else {k: None for k in T["5"]}
    return month_of(wb), d
def validate(m, d):
    errs = []; warns = []
    keys = [k for k in d["stockEnd"] if k != "TOTAL"]
    close = lambda a, b, t=3.0: a is None or b is None or abs(a - b) <= t + 0.0001 * abs(b)
    for f in F + ["_exitsExt"]:
        if f == "ownOps" and d[f].get("TOTAL") is None: continue
        for k, v in d[f].items():
            if v is not None and v < 0: errs.append("%s %s %s: valor negativo" % (m, f, k))
        if d[f].get("TOTAL") is None: errs.append("%s %s: falta el total" % (m, f)); continue
        s = sum(d[f][k] for k in keys if d[f].get(k) is not None)
        if not close(s, d[f]["TOTAL"]): errs.append("%s %s: las comunidades suman %s y el TOTAL del MAPA es %s" % (m, f, round(s, 1), round(d[f]["TOTAL"], 1)))
    for k in keys + ["TOTAL"]:
        if not close((d["exitsDomestic"][k] or 0) + (d["_exitsExt"][k] or 0), d["exitsTotal"][k]): errs.append("%s %s: salidas distintas de interiores + exteriores" % (m, k))
        if not close((d["exitsEU"][k] or 0) + (d["exitsThird"][k] or 0), d["_exitsExt"][k]): errs.append("%s %s: salidas exteriores distintas de UE + terceros" % (m, k))
    t = {f: d[f]["TOTAL"] for f in F}
    if None not in (t["stockStart"], t["stockEnd"], t["production"], t["inSpain"], t["inAbroad"], t["exitsTotal"], t["ownOps"]) and d["ownOps"]["TOTAL"] is not None:
        res = t["stockStart"] + t["production"] + t["inSpain"] + t["inAbroad"] - t["exitsTotal"] - t["ownOps"] - t["stockEnd"]
        d["_residual"] = res
        if abs(res) > 0.10 * t["stockEnd"]: errs.append("%s: la identidad de existencias se rompe en %s hl (%.1f %% de las existencias)" % (m, round(res), abs(res) / t["stockEnd"] * 100))
        elif abs(res) > 0.003 * t["stockEnd"]: warns.append("%s: identidad de existencias con un residuo de %s hl" % (m, round(res)))
    return errs, warns
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
r3 = B.r3; write_json = B.write_json
def merge(old, new):
    revs = []; allm = {}
    if old:
        for i, p in enumerate(old["months"]):
            allm[p] = {"national": {f: old["national"][f][i] for f in F}, "ccaa": {k: {f: old["ccaa"][k][f][i] for f in F} for k in CCAA}}
    for p, d in new.items():
        n = {f: r3(d[f]["TOTAL"]) for f in F}; cc = {k: {f: r3(d[f].get(k)) for f in F} for k in CCAA}
        if p in allm:
            for f in F:
                o = allm[p]["national"][f]
                if o is not None and n[f] is not None and abs(o - n[f]) > 1e-6: revs.append((p, f, o, n[f]))
        allm[p] = {"national": n, "ccaa": cc}
    ms = sorted(allm)
    return ms, {f: [allm[p]["national"][f] for p in ms] for f in F}, {k: {f: [allm[p]["ccaa"][k][f] for p in ms] for f in F} for k in CCAA}, revs
def chain(ms, N):
    """Existencias finales de un mes = iniciales del siguiente (si son meses seguidos); avisos, no errores (el MAPA corrige cifras)."""
    w = []
    for i in range(len(ms) - 1):
        y, m = map(int, ms[i].split("-")); nx = "%d-%02d" % ((y + 1, 1) if m == 12 else (y, m + 1))
        if ms[i + 1] != nx: continue
        a, b = N["stockEnd"][i], N["stockStart"][i + 1]
        if a is not None and b is not None and abs(a - b) > 0.002 * a: w.append("%s: existencias finales %s y iniciales de %s %s no encadenan" % (ms[i], round(a), ms[i + 1], round(b)))
    return w
def find_links(html, year):
    c = []
    for h in dict.fromkeys(re.findall(r'href="([^"]+\.xlsx)"', html)):
        n = norm(h.rsplit("/", 1)[-1])
        if ("ano-%d/" % year) in h and "ampliad" not in n and "existencias" not in n and "boletin" not in n: c.append(h if h.startswith("http") else SITE + h)
    return c

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file", action="append"); ap.add_argument("--force", action="store_true"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "monthly.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None
    import openpyxl
    parsed = {}; src = dict((old or {}).get("sources", {})); changed = False
    try:
        if a.file:
            for f in a.file:
                p, d = parse(openpyxl.load_workbook(f, data_only=True)); parsed[p] = d; src[p] = {"url": None, "lastModified": None}; changed = True
        else:
            known = {v.get("url"): (p, v) for p, v in src.items() if v.get("url")}
            for y in range(FIRST, datetime.date.today().year + 1):
                links = []
                for pu in B.year_pages(y):
                    try: links = find_links(http(pu).decode("utf-8", "replace"), y)
                    except Exception as ex: log("pagina %s: %s" % (pu.rsplit("/", 1)[-1], str(ex)[:80])); continue
                    if links: break
                for url in links:
                    lm = None
                    try: lm = http(url, "HEAD").get("Last-Modified")
                    except Exception as ex: log("HEAD fallo:", str(ex)[:60])
                    if not a.force and url in known and lm and known[url][1].get("lastModified") == lm: continue
                    try: p, d = parse(openpyxl.load_workbook(io.BytesIO(http(url)), data_only=True))
                    except Exception as ex: log("libro %s no se lee: %s" % (url.rsplit("/", 1)[-1], str(ex)[:100])); continue
                    if p in parsed and "corregid" not in norm(url) and "corregid" in norm(src.get(p, {}).get("url") or ""): continue
                    if p in parsed: log("AVISO: dos libros del mes %s, se usa %s" % (p, url.rsplit("/", 1)[-1]))
                    parsed[p] = d; src[p] = {"url": url, "lastModified": lm}; changed = True
    except Exception as ex: log("ERROR al leer los informes:", ex); return 1
    if not changed and old:
        old["checkedAt"] = now(); write_json(path, old); log("informes sin cambios"); return 0
    errs = []
    for p, d in sorted(parsed.items()):
        e, w = validate(p, d); errs += e
        for x in w: log("AVISO:", x)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    ms, N, CC, revs = merge(old, parsed)
    for p, f, o, n in revs[:30]: log("revision del MAPA: %s %s %s -> %s" % (p, f, o, n))
    for w in chain(ms, N)[:20]: log("AVISO:", w)
    t = now()
    doc = {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": SITE + V + "datos_infovi_anteriores"}, "months": ms, "units": {"wine": "hectolitros", "grape": "toneladas de uva"}, "fields": F,
           "national": N, "ccaa": CC, "ccaaNames": CCAA, "sources": {p: src.get(p) for p in ms if src.get(p)}, "revisions": len(revs)}
    write_json(path, doc); log("OK: %s..%s (%d meses), %d revisiones" % (ms[0], ms[-1], len(ms), len(revs))); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-wine-monthly-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

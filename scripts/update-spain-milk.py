#!/usr/bin/env python3
"""España: leche cruda entregada a los primeros compradores (MAPA, INFOLAC, declaraciones obligatorias RD 319/2015)
-> data/spain-milk/infolac.json.

Cada mes el MAPA publica un PDF «Declaraciones de entregas de leche cruda a los primeros compradores» que cubre los 12 ultimos meses (y compara con el año anterior).
El archivo acumula historia: cada informe nuevo añade sus meses; si un mes ya estaba, el informe mas reciente lo sustituye (el MAPA avisa de que los datos no estan consolidados) y se anota en el log.
Series nacionales: entregas (t, 24 meses en el primer informe), precio medio declarado (EUR/l, con historia mensual desde 2022 de la tabla 8), grasa y proteina (%), ganaderos y compradores, leche ecologica (t).
Series por comunidad autonoma (12 meses por informe): leche producida (t), grasa, proteina y ganaderos con entregas.
Nada se estima: un mes sin dato es null (en la tabla de precios el MAPA pone 0,000 en los meses futuros; eso es hueco, no cero). Se rechaza la escritura entera si algo no cuadra
(comunidades que no suman el total, total que no coincide con la tabla general, precio de la tabla general distinto del de la tabla de evolucion, valores fuera de rango).
--local FICHERO.txt usa el texto de un informe ya convertido (pruebas); --pdf FICHERO.pdf usa un PDF local."""
import argparse, datetime, json, os, re, subprocess, sys, tempfile, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-milk"
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/ganaderia/temas/produccion-y-mercados-ganaderos/sectores-ganaderos/vacuno-lechero/informacion-del-sector/declaraciones-leche"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
MABBR = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
CCAA = {"andalucia": "Andalucía", "aragon": "Aragón", "asturias": "Asturias", "baleares": "Illes Balears", "canarias": "Canarias", "cantabria": "Cantabria", "clm": "Castilla-La Mancha", "cyl": "Castilla y León",
        "cataluna": "Cataluña", "extremadura": "Extremadura", "galicia": "Galicia", "madrid": "Comunidad de Madrid", "murcia": "Región de Murcia", "navarra": "Navarra", "paisvasco": "País Vasco", "larioja": "La Rioja", "valenciana": "Comunitat Valenciana"}
VARS = ["production", "fat", "protein", "farmers"]
NUMRE = r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, tries=3, timeout=180):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s)).strip()
def num(tok): return float(tok.replace(".", "").replace(",", "."))
def pdftext(blob):
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "b.pdf"; p.write_bytes(blob)
        return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout
def pdf_link(html):
    c = [h for h in dict.fromkeys(re.findall(r'href="([^"]+\.pdf)"', html)) if re.search(r"entregas[-_]de[-_]leche", h, re.I)]
    if not c: return None
    h = c[0]; return h if h.startswith("http") else SITE + h

def ccaa_key(label):
    n = norm(label)
    for k, w in (("andalucia", "andalucia"), ("aragon", "aragon"), ("asturias", "asturias"), ("baleares", "baleares"), ("canarias", "canarias"), ("cantabria", "cantabria"), ("clm", "castilla la mancha"), ("cyl", "castilla y leon"),
                 ("cataluna", "cataluna"), ("extremadura", "extremadura"), ("galicia", "galicia"), ("madrid", "madrid"), ("murcia", "murcia"), ("navarra", "navarra"), ("paisvasco", "pais vasco"), ("larioja", "rioja"), ("valenciana", "valenciana")):
        if n.startswith(w): return k
    if n.startswith("otros"): return "otros"
    if n in ("espana", "total"): return "ES"
    return None
def period(y, m): return "%d-%02d" % (y, m)
def shift(y, m, d):
    k = y * 12 + (m - 1) + d; return k // 12, k % 12 + 1

ROW12 = re.compile(r"^\s*(\*?[A-Za-zÁÉÍÓÚáéíóúñÑ][A-Za-zÁÉÍÓÚáéíóúñÑ .()\-]*?)\s{2,}((?:(?:%s)\s+){11}(?:%s))\s*$" % (NUMRE, NUMRE))
def table(lines, title, stop_keys=("ES",)):
    """Primera tabla cuya linea de titulo contiene `title`: devuelve {clave: [12 valores]} hasta la fila de total."""
    i = next((k for k, l in enumerate(lines) if title in l), None)
    if i is None: raise ValueError("falta la tabla «%s»" % title)
    rows = {}
    for l in lines[i + 1: i + 60]:
        m = ROW12.match(l)
        if not m: continue
        key = ccaa_key(m.group(1))
        if key is None: continue
        rows[key] = [num(x) for x in re.findall(NUMRE, m.group(2))]
        if key == "ES": break
    if "ES" not in rows: raise ValueError("la tabla «%s» no trae fila de total" % title)
    return rows

def parse(text):
    lines = text.splitlines()
    m = re.search(r"(%s)\s+(\d{4})" % "|".join(w.upper() for w in MONTHS), text)
    if not m: raise ValueError("no se encuentra el mes del informe")
    rm = [w.upper() for w in MONTHS].index(m.group(1)) + 1; ry = int(m.group(2))
    ext = re.search(r"extracci[oó]n de datos:\s*(\d{2})/(\d{2})/(\d{4})", text); pub = re.search(r"publicaci[oó]n:\s*(\d{2})/(\d{2})/(\d{4})", text)
    pers = [period(*shift(ry, rm, d)) for d in range(-11, 1)]
    prev = [period(*shift(ry, rm, d)) for d in range(-23, -11)]
    nat = {k: {} for k in ("deliveries", "price", "fat", "protein", "farmers", "buyers", "organic")}
    # tabla general (seccion 2): filas con 12 cifras y etiqueta en las lineas vecinas
    i0 = next((k for k, l in enumerate(lines) if "DATOS GENERALES" in l and "SEP" in l), None)
    if i0 is None: raise ValueError("falta la tabla de datos generales")
    sec = lines[i0: i0 + 60]; deliv = []
    for k, l in enumerate(sec):
        mm = re.match(r"^\s*(?:Entregas de leche en|Variaci[oó]n respecto|Mills \(Kg\.\) acum\. En|Importe medio|Materia grasa \(%\)|Prote[ií]na \(%\)|Compradores que|Ganaderos con)\s*(.*)$", l)
        if not mm: continue
        # etiqueta completa = linea + las dos siguientes no numericas; las cifras estan en la propia linea o en la siguiente
        vals = re.findall(r"-?(?:%s)" % NUMRE, mm.group(1))
        j = k
        while len(vals) < 12 and j + 1 < len(sec) and j < k + 2:
            j += 1; mx = re.match(r"^\s*((?:-?(?:%s))(?:\s+-?(?:%s)){11})\s*$" % (NUMRE, NUMRE), sec[j])
            if mx: vals = re.findall(r"-?(?:%s)" % NUMRE, mx.group(1))
        if len(vals) != 12: continue
        lab = norm(" ".join(sec[k: k + 4]))
        v = [num(x) for x in vals]
        if lab.startswith("entregas de leche en"):
            deliv.append(v)
        elif lab.startswith("importe medio"): nat["price"] = dict(zip(pers, v))
        elif lab.startswith("materia grasa"): nat["fat"] = dict(zip(pers, v))
        elif lab.startswith("proteina"): nat["protein"] = dict(zip(pers, v))
        elif lab.startswith("compradores"): nat["buyers"] = dict(zip(pers, v))
        elif lab.startswith("ganaderos"): nat["farmers"] = dict(zip(pers, v))
    if len(deliv) != 2: raise ValueError("la tabla general debe traer 2 filas de entregas (anterior y actual), trae %d" % len(deliv))
    # la primera fila es el periodo anterior, la segunda el actual
    nat["deliveries"].update(dict(zip(prev, deliv[0]))); nat["deliveries"].update(dict(zip(pers, deliv[1])))
    for k in ("price", "fat", "protein", "buyers", "farmers"):
        if len(nat[k]) != 12: raise ValueError("la tabla general no trae la fila de %s" % k)
    # evolucion del precio por mes y año (tabla 8): historia mas larga; 0,000 = sin dato
    hist = {}
    i8 = next((k for k, l in enumerate(lines) if re.match(r"^\s*Mes\s+20\d\d\s+20\d\d", l)), None)
    if i8 is not None:
        yrs = [int(x) for x in re.findall(r"20\d\d", lines[i8])[:5]]
        for l in lines[i8 + 1: i8 + 45]:
            mm = re.match(r"^\s*(\w+)\s+((?:\d,\d{3}\s+){4}\d,\d{3})", l)
            if not mm: continue
            w = norm(mm.group(1))
            if w in MONTHS or w in [norm(x) for x in MONTHS]:
                mo = [norm(x) for x in MONTHS].index(w) + 1
                for y, x in zip(yrs, mm.group(2).split()):
                    v = num(x); hist[period(y, mo)] = None if v == 0 else v
    # tablas por comunidad (12 meses)
    cc = {}
    for var, title in (("production", "LECHE CRUDA PRODUCIDA POR COMUNIDAD AUT"), ("fat", "CARACTERÍSTICAS CUALITATIVAS. MATERIA GRASA"), ("protein", "CARACTERÍSTICAS CUALITATIVAS. PROTEÍNA"), ("farmers", "GANADEROS CON ENTREGAS")):
        t = table(lines, title)
        for key, v in t.items():
            if key == "ES": nat.setdefault("_es_" + var, dict(zip(pers, v))); continue
            if key == "otros": nat["_otros_" + var] = dict(zip(pers, v)); continue
            cc.setdefault(key, {})[var] = dict(zip(pers, v))
    org = table(lines, "LECHE CRUDA ECOLÓGICA DECLARADA POR COMPRADORES (T.)")
    nat["organic"] = dict(zip(pers, org["ES"]))
    return {"month": period(ry, rm), "extracted": "%s-%s-%s" % (ext.group(3), ext.group(2), ext.group(1)) if ext else None, "published": "%s-%s-%s" % (pub.group(3), pub.group(2), pub.group(1)) if pub else None,
            "periods": pers, "national": nat, "priceHistory": hist, "ccaa": cc}

def validate(r):
    errs = []; warns = []; P = r["periods"]; N = r["national"]; C = r["ccaa"]
    if sorted(C) != sorted(CCAA): errs.append("comunidades inesperadas: %s" % sorted(set(C) ^ set(CCAA)))
    for p in P:
        tot = N["deliveries"][p]
        s = sum(C[k]["production"][p] for k in C if k in CCAA)
        tol = 10 + 0.00002 * tot; ot = N.get("_otros_farmers", {}).get(p, 0)
        if ot and 0 < tot - s <= 0.0005 * tot + tol: warns.append("%s: el total (%s t) supera la suma de comunidades (%s t) en %s t: el MAPA incluye un ganadero de otro pais («Otros») que no aparece en la tabla por comunidad" % (p, tot, round(s), round(tot - s)))
        elif abs(s - tot) > tol: errs.append("%s: comunidades %s != total %s (t)" % (p, round(s), tot))
        if abs(N["_es_production"][p] - tot) > 1: errs.append("%s: total de produccion por CCAA %s != entregas %s" % (p, N["_es_production"][p], tot))
        fs = sum(C[k]["farmers"][p] for k in C if k in CCAA); fo = N["farmers"][p]
        if abs(fo - fs - r["national"].get("_otros_farmers", {}).get(p, 0)) > 2: errs.append("%s: ganaderos de las comunidades %s no cuadran con el total %s" % (p, fs, fo))
        w = sum(C[k]["production"][p] * C[k]["fat"][p] for k in C if k in CCAA) / max(1, sum(C[k]["production"][p] for k in C if k in CCAA))
        if abs(w - N["fat"][p]) > 0.03: warns.append("%s: grasa ponderada de las comunidades %.3f vs %.2f del total" % (p, w, N["fat"][p]))
        if not 0.2 <= N["price"][p] <= 1.0: errs.append("%s: precio fuera de rango %s" % (p, N["price"][p]))
        if not 2.5 <= N["fat"][p] <= 6 or not 2.5 <= N["protein"][p] <= 4.5: errs.append("%s: grasa o proteina fuera de rango" % p)
        h = r["priceHistory"].get(p)
        if h is not None and abs(h - N["price"][p]) > 0.0015: errs.append("%s: precio de la tabla general %s != tabla de evolucion %s" % (p, N["price"][p], h))
        if N["organic"][p] < 0 or N["organic"][p] > tot: errs.append("%s: leche ecologica fuera de rango" % p)
    for k in C:
        for v in VARS:
            if sorted(C[k][v]) != sorted(P): errs.append("%s %s: faltan meses" % (k, v))
            if any(x < 0 for x in C[k][v].values()): errs.append("%s %s: negativo" % (k, v))
    if len(r["priceHistory"]) < 12: errs.append("la tabla de evolucion del precio trae %d meses" % len(r["priceHistory"]))
    return errs, warns

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def write_json(path, obj):
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)

def merge(old, r):
    """Une el informe `r` con el archivo anterior `old` (o None). Devuelve el documento nuevo y la lista de revisiones (mes, serie, antes, ahora)."""
    revs = []
    series = {"national": {}, "ccaa": {}}
    if old:
        for k in old["national"]: series["national"][k] = dict(zip(old["periods"], old["national"][k]))
        for c, vs in old["ccaa"].items(): series["ccaa"][c] = {v: dict(zip(old["periods"], a)) for v, a in vs.items()}
    def put(dst, key, vals, tag):
        d = dst.setdefault(key, {})
        for p, v in vals.items():
            if v is None: continue
            if p in d and d[p] is not None and abs(d[p] - v) > 1e-9: revs.append((p, tag, d[p], v))
            d[p] = v
    N = r["national"]
    for k in ("deliveries", "price", "fat", "protein", "farmers", "buyers", "organic"): put(series["national"], k, N[k], "ES " + k)
    put(series["national"], "price", r["priceHistory"], "ES price")
    for c, vs in r["ccaa"].items():
        for v, vals in vs.items(): put(series["ccaa"].setdefault(c, {}), v, vals, c + " " + v)
    pers = sorted({p for d in series["national"].values() for p in d} | {p for c in series["ccaa"].values() for d in c.values() for p in d})
    ar = lambda d: [d.get(p) for p in pers]
    doc = {"periods": pers, "national": {k: ar(d) for k, d in series["national"].items()}, "ccaa": {c: {v: ar(d) for v, d in vs.items()} for c, vs in series["ccaa"].items()}}
    return doc, revs

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--local"); ap.add_argument("--pdf"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "infolac.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None; url = None
    try:
        if a.local: text = Path(a.local).read_text("utf-8")
        elif a.pdf: text = pdftext(Path(a.pdf).read_bytes())
        else:
            url = pdf_link(http(PAGE).decode("utf-8", "replace"))
            if not url: log("ERROR: la pagina no enlaza el informe de entregas; no se escribe nada"); return 1
            if old and old.get("report", {}).get("pdf") == url:
                old["checkedAt"] = now(); write_json(path, old); log("informe sin cambios (%s)" % url[-50:]); return 0
            text = pdftext(http(url))
        r = parse(text)
    except Exception as e: log("ERROR al leer el informe:", e); return 1
    errs, warns = validate(r)
    for w in warns: log("AVISO:", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    if old and old["report"]["month"] > r["month"]: log("AVISO: el informe %s es anterior al ya guardado %s; no se escribe nada" % (r["month"], old["report"]["month"])); return 0
    doc, revs = merge(old, r)
    for p, tag, b, n in revs[:40]: log("revision del MAPA: %s %s %s -> %s" % (p, tag, b, n))
    if len(revs) > 40: log("... y %d revisiones mas" % (len(revs) - 40))
    t = now()
    doc.update({"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": PAGE}, "units": {"deliveries": "t", "price": "EUR/l", "fat": "%", "protein": "%", "farmers": "n", "buyers": "n", "organic": "t", "production": "t"},
                "ccaaNames": CCAA, "report": {"month": r["month"], "extracted": r["extracted"], "published": r["published"], "pdf": url}, "revisions": len(revs)})
    write_json(path, doc); log("OK: informe %s; %d meses (%s..%s); %d revisiones" % (r["month"], len(doc["periods"]), doc["periods"][0], doc["periods"][-1], len(revs))); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-milk-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

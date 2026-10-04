#!/usr/bin/env python3
"""España: sacrificio mensual de ganado en mataderos (MAPA, Estadística de producciones ganaderas, libro «web_sacrificios_<mes>-web.xlsx») -> data/spain-slaughter/slaughter.json.

El libro trae (a) la hoja «2022-2026» con el sacrificio mensual NACIONAL por especie (bovino, ovino, caprino, porcino, equino, aves, conejos): reses/cabezas y peso canal en toneladas, con el total del año;
y (b) una hoja por mes («2025-2026-enero»...) con las 17 comunidades autonomas para ese mes en los dos años (filas «Galicia 25», «Galicia 26»...) y una fila «Total España».
- La serie nacional sale de la hoja «2022-2026». Las comunidades salen de las hojas mensuales; las filas «Total España» de las hojas mensuales NO se usan: en la hoja de agosto de 2026 esa fila repite casi exactamente la de julio y no cuadra con la serie nacional (se anota en `notes`).
- «DC» (dato confidencial) y celdas vacias = null; nada se estima. Las comunidades con DC no suman el nacional: por eso la suma de las comunidades solo se exige <= nacional.
- Unidades: cabezas (aves y conejos, miles de cabezas) y toneladas de peso canal. En las hojas mensuales el peso canal de aves y conejos viene en kg: se convierte a t segun la cabecera de la hoja.
- El archivo acumula historia: cada libro nuevo añade su mes y revisa los anteriores; si un valor ya publicado cambia, gana el libro nuevo y queda en el log.
Se rechaza la escritura entera si algo no cuadra (suma de meses distinta del total del año, pesos medios fuera de rango, comunidades que suman mas que el nacional, negativos).
--file usa un libro local (pruebas)."""
import argparse, datetime, io, json, os, re, sys, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-slaughter"
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/estadistica/temas/estadisticas-agrarias/ganaderia/encuestas-sacrificio-ganado"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
SPECIES = ["bovino", "ovino", "caprino", "porcino", "equino", "aves", "conejos"]
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
NAT_ROW = {"bovino": 11, "ovino": 17, "caprino": 23, "porcino": 29, "equino": 35, "aves": 41, "conejos": 47}  # primera fila (año 2022) del bloque de cabezas; el de peso canal esta 42 filas mas abajo
CCAA = {"galicia": "Galicia", "asturias": "Asturias", "cantabria": "Cantabria", "paisvasco": "País Vasco", "navarra": "Navarra", "larioja": "La Rioja", "aragon": "Aragón", "cataluna": "Cataluña", "baleares": "Illes Balears", "cyl": "Castilla y León",
        "madrid": "Comunidad de Madrid", "clm": "Castilla-La Mancha", "valenciana": "Comunitat Valenciana", "murcia": "Región de Murcia", "extremadura": "Extremadura", "andalucia": "Andalucía", "canarias": "Canarias"}
# peso canal medio plausible por cabeza (kg): protege contra mezclas de unidades
WEIGHT = {"bovino": (150, 450), "ovino": (5, 30), "caprino": (3, 20), "porcino": (60, 130), "equino": (80, 320), "aves": (1, 3.5), "conejos": (0.8, 2.5)}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, method="GET", tries=3, timeout=300):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA, method=method), timeout=timeout) as r: return r.read() if method == "GET" else dict(r.headers)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s %s -> %s" % (method, url, str(last)[:160]))
def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s)).strip()
def ccaa_key(label):
    n = norm(label)
    for k, w in (("galicia", "galicia"), ("asturias", "asturias"), ("cantabria", "cantabria"), ("paisvasco", "pais vasco"), ("navarra", "navarra"), ("larioja", "rioja"), ("aragon", "aragon"), ("cataluna", "cataluna"), ("baleares", "balears"), ("cyl", "castilla y leon"),
                 ("madrid", "madrid"), ("clm", "castilla la mancha"), ("valenciana", "comunitat valenciana"), ("murcia", "murcia"), ("extremadura", "extremadura"), ("andalucia", "andalucia"), ("canarias", "canarias")):
        if n.startswith(w): return k
    return "ES" if n.startswith("total espana") else None
def val(x):
    """DC (dato confidencial) y vacio = None; numerico tal cual."""
    if x is None: return None
    if isinstance(x, (int, float)): return float(x)
    return None
def page_link(html):
    c = []
    for h in dict.fromkeys(re.findall(r'href="([^"]+\.xlsx)"', html)):
        m = re.search(r"/encuesta-de-sacrificio-de-ganado/(\d{4})/(.*)$", h)
        if m and re.search(r"sacrificio", m.group(2), re.I) and "web_" in m.group(2): c.append((int(m.group(1)), h))
    if not c: return None
    h = max(c)[1]; return h if h.startswith("http") else SITE + h

def parse_national(ws):
    """Hoja «2022-2026»: devuelve (periods, {especie: {heads: {p: v}, carcass: {p: v}, total_heads: {año: v}, total_carcass: {año: v}}})."""
    hdr = [ws.cell(9, c).value for c in range(1, 16)]
    if not (hdr[0] and "Clase" in str(hdr[0]) and str(hdr[2]).strip().lower() == "enero" and "Total" in str(hdr[14])): raise ValueError("cabecera inesperada en la hoja nacional: %r" % (hdr,))
    out = {}
    for sp, r0 in NAT_ROW.items():
        lab = str(ws.cell(r0, 1).value or "").lower()
        if not lab.startswith(sp[:4]): raise ValueError("la fila %d no es de %s (%r)" % (r0, sp, lab))
        d = {"heads": {}, "carcass": {}, "total_heads": {}, "total_carcass": {}}
        for kind, base in (("heads", r0), ("carcass", r0 + 42)):
            if kind == "carcass" and not str(ws.cell(base, 1).value or "").lower().startswith(sp[:4]): raise ValueError("el bloque de peso canal de %s no esta donde se espera (fila %d)" % (sp, base))
            r = base
            while True:
                y = ws.cell(r, 2).value
                if not isinstance(y, (int, float)): break
                y = int(y)
                for m in range(12):
                    v = val(ws.cell(r, 3 + m).value)
                    if v is not None: d[kind]["%d-%02d" % (y, m + 1)] = v
                t = val(ws.cell(r, 15).value)
                if t is not None: d["total_" + kind][y] = t
                r += 1
        out[sp] = d
    return out

def parse_month(ws, month):
    """Hoja mensual: {año: {clave_ccaa|'ES': {especie: (cabezas, peso_canal_t)}}}. Valores DC = None."""
    heads = {}
    for k, sp in enumerate(SPECIES):
        c0 = 2 + 3 * k
        if str(ws.cell(1, c0).value or "").strip().lower() != sp: raise ValueError("la columna %d de %s no es %s (%r)" % (c0, ws.title, sp, ws.cell(1, c0).value))
        heads[sp] = (str(ws.cell(2, c0).value or ""), str(ws.cell(2, c0 + 1).value or ""))
    if str(ws.cell(2, 1).value or "").strip().lower() != MONTHS[month - 1]: raise ValueError("%s: el mes de la hoja no es %s" % (ws.title, MONTHS[month - 1]))
    out = {}
    for r in range(3, ws.max_row + 1):
        a = ws.cell(r, 1).value
        if not a: continue
        m = re.match(r"^(.*?)\s+(\d{2})$", str(a).strip())
        if not m: continue
        key = ccaa_key(m.group(1))
        if key is None: continue
        y = 2000 + int(m.group(2))
        row = {}
        for k, sp in enumerate(SPECIES):
            c0 = 2 + 3 * k; h = val(ws.cell(r, c0).value); t = val(ws.cell(r, c0 + 1).value)
            if t is not None and re.search(r"\(kg", heads[sp][1], re.I): t = t / 1000.0
            row[sp] = (h, t)
        out.setdefault(y, {})[key] = row
    return out

def parse_book(wb):
    nat = parse_national(wb["2022-2026"])
    months = {}
    for m in range(1, 13):
        name = next((n for n in wb.sheetnames if re.match(r"^20\d\d-20\d\d-%s$" % MONTHS[m - 1], n)), None)
        if name: months[m] = parse_month(wb[name], m)
    if not months: raise ValueError("el libro no trae hojas mensuales por comunidad")
    return nat, months

def build(nat, months):
    periods = sorted({p for sp in nat.values() for p in sp["heads"]})
    N = {sp: {"heads": [nat[sp]["heads"].get(p) for p in periods], "carcass": [nat[sp]["carcass"].get(p) for p in periods]} for sp in SPECIES}
    cc = {}; notes = []
    for m, by_year in sorted(months.items()):
        for y, rows in by_year.items():
            p = "%d-%02d" % (y, m)
            if p not in periods: continue
            i = periods.index(p)
            for key, row in rows.items():
                if key == "ES":
                    for sp in SPECIES:
                        for j, kind in enumerate(("heads", "carcass")):
                            a = row[sp][j]; b = N[sp][kind][i]
                            if a is not None and b is not None and abs(a - b) > 0.005 * max(abs(b), 1): notes.append({"period": p, "species": sp, "kind": kind, "national": round(b, 3), "monthSheetTotal": round(a, 3)})
                    continue
                d = cc.setdefault(key, {sp: {"heads": [None] * len(periods), "carcass": [None] * len(periods)} for sp in SPECIES})
                for sp in SPECIES:
                    d[sp]["heads"][i], d[sp]["carcass"][i] = row[sp]
    return periods, N, cc, notes

def validate(periods, N, cc, nat):
    errs = []; warns = []
    n = len(periods)
    for sp in SPECIES:
        for kind in ("heads", "carcass"):
            a = N[sp][kind]
            if len(a) != n: errs.append("%s %s: longitud" % (sp, kind))
            if any(x is not None and x < 0 for x in a): errs.append("%s %s: valor negativo" % (sp, kind))
        for y in sorted({int(p[:4]) for p in periods}):
            idx = [i for i, p in enumerate(periods) if p.startswith(str(y))]
            for kind in ("heads", "carcass"):
                tot = nat[sp]["total_" + kind].get(y)
                if tot is None: continue
                vals = [N[sp][kind][i] for i in idx]
                if any(v is None for v in vals) and len(idx) == 12: errs.append("%s %s %d: faltan meses" % (sp, kind, y)); continue
                s = sum(v for v in vals if v is not None)
                if abs(s - tot) > 1 + 0.00005 * abs(tot): errs.append("%s %s %d: la suma de los meses (%s) no es el total del año (%s)" % (sp, kind, y, round(s, 1), round(tot, 1)))
        lo, hi = WEIGHT[sp]
        for i, p in enumerate(periods):
            h, t = N[sp]["heads"][i], N[sp]["carcass"][i]
            if h and t is not None:
                kg = t / h if sp in ("aves", "conejos") else t * 1000 / h
                if not lo <= kg <= hi: errs.append("%s %s: peso canal medio %.1f kg fuera de rango (%s-%s)" % (sp, p, kg, lo, hi))
    for key, d in cc.items():
        for sp in SPECIES:
            for kind in ("heads", "carcass"):
                if any(x is not None and x < 0 for x in d[sp][kind]): errs.append("%s %s %s: valor negativo" % (key, sp, kind))
    for i, p in enumerate(periods):
        for sp in SPECIES:
            for kind in ("heads", "carcass"):
                s = sum(d[sp][kind][i] for d in cc.values() if d[sp][kind][i] is not None); t = N[sp][kind][i]
                if t is not None and s > t * 1.005 + 1: errs.append("%s %s %s: las comunidades suman %s y el nacional %s" % (p, sp, kind, round(s, 1), round(t, 1)))
    return errs, warns

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def write_json(path, obj):
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)
def r3(x): return None if x is None else round(x, 3)

def merge(old, periods, N, cc):
    """Une lo nuevo con el archivo anterior: union de periodos; el libro nuevo gana y se anotan las revisiones."""
    if not old: return periods, N, cc, []
    P = sorted(set(old["periods"]) | set(periods)); revs = []
    def al(oldarr, newarr):
        o = dict(zip(old["periods"], oldarr)) if oldarr else {}; w = dict(zip(periods, newarr)) if newarr else {}
        res = []
        for p in P:
            ov, nv = o.get(p), w.get(p)
            if nv is not None and ov is not None and abs(ov - nv) > 1e-6: revs.append((p, ov, nv))
            res.append(nv if nv is not None else ov)
        return res
    N2 = {sp: {k: al(old["national"][sp][k], N[sp][k]) for k in ("heads", "carcass")} for sp in SPECIES}
    cc2 = {}
    for key in sorted(set(old["ccaa"]) | set(cc)):
        cc2[key] = {sp: {k: al((old["ccaa"].get(key) or {}).get(sp, {}).get(k), (cc.get(key) or {}).get(sp, {}).get(k)) for k in ("heads", "carcass")} for sp in SPECIES}
    return P, N2, cc2, revs

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file"); ap.add_argument("--force", action="store_true"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "slaughter.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None; url = None; lm = None
    try:
        if a.file: blob = Path(a.file).read_bytes()
        else:
            url = page_link(http(PAGE).decode("utf-8", "replace"))
            if not url: log("ERROR: la pagina no enlaza el libro de sacrificio mensual; no se escribe nada"); return 1
            try: lm = http(url, "HEAD").get("Last-Modified")
            except Exception as e: log("HEAD fallo, se descarga igualmente:", e)
            if old and not a.force and old.get("report", {}).get("url") == url and lm and old["report"].get("lastModified") == lm:
                old["checkedAt"] = now(); write_json(path, old); log("libro sin cambios (Last-Modified %s)" % lm); return 0
            blob = http(url)
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=False, data_only=True)
        nat, months = parse_book(wb)
        periods, N, cc, notes = build(nat, months)
    except Exception as e: log("ERROR al leer el libro:", e); return 1
    errs, warns = validate(periods, N, cc, nat)
    for w in warns: log("AVISO:", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    P, N2, cc2, revs = merge(old, periods, N, cc)
    for p, o, n in revs[:30]: log("revision del MAPA: %s %s -> %s" % (p, o, n))
    if len(revs) > 30: log("... y %d revisiones mas" % (len(revs) - 30))
    for x in notes: log("INCOHERENCIA de la fuente (hoja mensual vs serie nacional):", x)
    keep = [x for x in (old or {}).get("notes", []) if x["period"] not in {y["period"] for y in notes} and x["period"] not in periods]
    allnotes = sorted(keep + notes, key=lambda x: (x["period"], x["species"], x["kind"]))
    t = now(); last = P[-1]
    doc = {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": PAGE}, "species": SPECIES, "periods": P,
           "units": {"heads": "cabezas (aves y conejos: miles de cabezas)", "carcass": "toneladas de peso canal"},
           "national": {sp: {k: [r3(x) for x in v] for k, v in d.items()} for sp, d in N2.items()},
           "ccaa": {k: {sp: {kk: [r3(x) for x in vv] for kk, vv in d.items()} for sp, d in sps.items()} for k, sps in cc2.items()}, "ccaaNames": CCAA,
           "notes": allnotes, "report": {"last": last, "url": url, "lastModified": lm}, "revisions": len(revs)}
    write_json(path, doc); log("OK: %s..%s (%d meses), %d comunidades, %d incoherencias de la fuente anotadas, %d revisiones" % (P[0], last, len(P), len(cc2), len(allnotes), len(revs))); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-slaughter-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

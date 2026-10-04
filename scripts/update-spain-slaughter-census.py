#!/usr/bin/env python3
"""España: sacrificio anual de ganado por provincia (MAPA, Encuesta anual de sacrificio de ganado en mataderos, «censo exhaustivo») -> data/spain-slaughter/census.json.

Un libro por año (2004-2025), .xls hasta 2022 y .xlsx desde 2023 (el de 2024 cuelga de un enlace /dam/jcr:). Las dos primeras hojas de cada libro son lo que se lee: «cabezas» y «producción de carne»
(toneladas de peso canal), por provincia y comunidad, de las 7 especies (bovino, ovino, caprino, porcino, equino, aves, conejos).
- Los nombres de hoja, las cabeceras y los nombres de provincia cambian de un año a otro; se leen por contenido (la fila de cabecera es la que nombra las especies, la provincia sale de una tabla de alias).
- Aves y conejos van en miles de cabezas hasta 2024 y en cabezas en 2025: se detecta por la cabecera o la nota al pie y se comprueba contra el orden de magnitud nacional; aqui todo queda en cabezas.
- «DC» (dato confidencial, con clase 1-4 desde 2016) = null y la clase queda aparte; una celda vacia = null. Nada se estima ni se reparte: el total de cada comunidad incluye sus provincias confidenciales,
  de modo que una provincia DC es un hueco aunque su comunidad si tenga cifra. Un cero publicado es un cero (provincia sin sacrificio).
- «España» es la fila publicada (provincias + «otros sacrificios» no asignables a una provincia, que hasta 2007 son muy grandes en ovino y caprino); «TOTAL» es solo la suma de las provincias. Se guardan las dos.
- Se rechaza la escritura entera si algo no cuadra (provincias sin reconocer, comunidades que no suman el total, provincias visibles que suman mas que su comunidad, orden de magnitud de aves/conejos).
--file usa un libro local (pruebas; --year AAAA obligatorio)."""
import argparse, datetime, io, json, os, re, sys, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-slaughter"
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/estadistica/temas/estadisticas-agrarias/ganaderia/encuestas-sacrificio-ganado"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
FIRST = 2004
SPECIES = ["bovino", "ovino", "caprino", "porcino", "equino", "aves", "conejos"]
MEAS = ["heads", "meat"]
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
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()
# (id alfabetico del mapa de provincias, nombre, comunidad, alias normalizados)
PROV = [
    ("01", "Álava", "paisvasco", "alava araba"), ("02", "Albacete", "clm", ""), ("03", "Alicante", "valenciana", "alacant"), ("04", "Almería", "andalucia", ""), ("05", "Ávila", "cyl", ""), ("06", "Badajoz", "extremadura", ""),
    ("07", "Baleares", "baleares", "illes balears|islas baleares"), ("08", "Barcelona", "cataluna", ""), ("09", "Burgos", "cyl", ""), ("10", "Cáceres", "extremadura", ""), ("11", "Cádiz", "andalucia", ""), ("12", "Castellón", "valenciana", "castello"),
    ("13", "Ciudad Real", "clm", ""), ("14", "Córdoba", "andalucia", ""), ("15", "A Coruña", "galicia", "coruna la|a coruna|la coruna|coruna"), ("16", "Cuenca", "clm", ""), ("17", "Girona", "cataluna", "gerona|girona"), ("18", "Granada", "andalucia", ""),
    ("19", "Guadalajara", "clm", ""), ("20", "Gipuzkoa", "paisvasco", "guipuzcoa|gipuzkoa"), ("21", "Huelva", "andalucia", ""), ("22", "Huesca", "aragon", ""), ("23", "Jaén", "andalucia", ""), ("24", "León", "cyl", ""), ("25", "Lleida", "cataluna", "lerida|lleida"),
    ("26", "La Rioja", "larioja", "rioja"), ("27", "Lugo", "galicia", ""), ("28", "Madrid", "madrid", "c madrid|comunidad de madrid"), ("29", "Málaga", "andalucia", ""), ("30", "Murcia", "murcia", "r de murcia|region de murcia|r murcia"), ("31", "Navarra", "navarra", "c f de navarra|comunidad foral de navarra"),
    ("32", "Ourense", "galicia", "orense|ourense"), ("33", "Asturias", "asturias", "p asturias|p de asturias|principado de asturias"), ("34", "Palencia", "cyl", ""), ("35", "Las Palmas", "canarias", ""), ("36", "Pontevedra", "galicia", ""), ("37", "Salamanca", "cyl", ""),
    ("38", "Santa Cruz de Tenerife", "canarias", "sta cr tenerife|s c de tenerife|santa cruz de tenerife|tenerife"), ("39", "Cantabria", "cantabria", ""), ("40", "Segovia", "cyl", ""), ("41", "Sevilla", "andalucia", ""), ("42", "Soria", "cyl", ""), ("43", "Tarragona", "cataluna", ""),
    ("44", "Teruel", "aragon", ""), ("45", "Toledo", "clm", ""), ("46", "Valencia", "valenciana", ""), ("47", "Valladolid", "cyl", ""), ("48", "Bizkaia", "paisvasco", "vizcaya|bizkaia"), ("49", "Zamora", "cyl", ""), ("50", "Zaragoza", "aragon", "")]
CCAA = {"galicia": "Galicia", "asturias": "Asturias", "cantabria": "Cantabria", "paisvasco": "País Vasco", "navarra": "Navarra", "larioja": "La Rioja", "aragon": "Aragón", "cataluna": "Cataluña", "baleares": "Illes Balears", "cyl": "Castilla y León",
        "madrid": "Comunidad de Madrid", "clm": "Castilla-La Mancha", "valenciana": "Comunitat Valenciana", "murcia": "Región de Murcia", "extremadura": "Extremadura", "andalucia": "Andalucía", "canarias": "Canarias"}
CC_ALIAS = {"galicia": "", "asturias": "", "cantabria": "", "paisvasco": "pais vasco|c vasca|euskadi", "navarra": "", "larioja": "", "aragon": "", "cataluna": "catalunya", "baleares": "", "cyl": "cast y leon|castilla y leon|castilla leon|c y leon", "madrid": "", "clm": "c la mancha|castilla la mancha|cast la mancha",
            "valenciana": "c valenciana|comunidad valenciana|comunitat valenciana|valenciana", "murcia": "", "extremadura": "", "andalucia": "", "canarias": ""}
UNI = {"asturias": "33", "cantabria": "39", "navarra": "31", "larioja": "26", "madrid": "28", "murcia": "30", "baleares": "07"}  # comunidades de una sola provincia: la misma fila vale para las dos
PROV_OF = {p[0]: p[2] for p in PROV}
LABEL = {}
for pid, name, cc, al in PROV:
    for a in [name] + [x for x in al.split("|") if x]: LABEL[norm(a)] = "p" + pid
for slug, name in CCAA.items():
    for a in [name, slug] + [x for x in CC_ALIAS[slug].split("|") if x]:
        if norm(a) not in LABEL: LABEL[norm(a)] = "c" + slug
# plausibilidad del peso canal medio por cabeza (kg) en cada provincia-año: solo aviso (hay provincias con aves pequeñas y cifras redondeadas)
WEIGHT = {"bovino": (100, 700), "ovino": (4, 35), "caprino": (2, 30), "porcino": (40, 140), "equino": (80, 400), "aves": (0.3, 4.5), "conejos": (0.5, 3)}
# orden de magnitud nacional de aves y conejos en cabezas (comprueba el cambio de unidad)
MAGN = {"aves": (3e8, 1.6e9), "conejos": (1.5e7, 1.2e8)}
DCRE = re.compile(r"^\s*dc\b\s*\(?\s*(\d)?\s*\)?\s*$", re.I)

def rows_of(path_or_bytes, ext):
    """Lista de (nombre de hoja, filas) con celdas de texto o numero; .xls con xlrd, .xlsx con openpyxl."""
    if ext == "xls":
        import xlrd
        wb = xlrd.open_workbook(file_contents=path_or_bytes) if isinstance(path_or_bytes, bytes) else xlrd.open_workbook(path_or_bytes)
        out = []
        for s in wb.sheets()[:6]: out.append((s.name, [[(None if c == "" else c) for c in s.row_values(i)] for i in range(s.nrows)]))
        return out
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(path_or_bytes) if isinstance(path_or_bytes, bytes) else path_or_bytes, data_only=True, read_only=False)
    out = []
    for ws in wb.worksheets[:3]:  # las hojas de aves/equino/porcino de 2024-25 llegan a 16.000 columnas: solo se leen las 12 primeras de las dos primeras
        out.append((ws.title, [list(r) for r in ws.iter_rows(max_col=24, values_only=True)]))
    return out
def pick(sheets):
    h = m = None
    for name, rows in sheets:
        n = norm(name)
        if "grafico" in n: continue
        if h is None and "cabez" in n: h = (name, rows)
        elif m is None and any(k in n for k in ("peso", "prod", "carne")): m = (name, rows)
    if h is None or m is None: raise ValueError("no se encuentran las hojas de cabezas y de carne (%s)" % ", ".join(s[0] for s in sheets))
    return h, m
def read_sheet(name, rows):
    """-> (filas {clave: {especie: (valor|None, dc|None)}}, unidades {especie: factor a cabezas}, titulo)"""
    hdr = None
    for i, r in enumerate(rows):
        hits = {}
        for j, c in enumerate(r):
            if isinstance(c, str):
                n = norm(c)
                for s in SPECIES:
                    if n == s or n.startswith(s + " "): hits.setdefault(s, j)
        if len(hits) == len(SPECIES): hdr = i; col = hits; break
    if hdr is None: raise ValueError("hoja %s: no se encuentra la fila de cabecera con las 7 especies" % name)
    first = min(col.values()); title = " ".join(str(c).strip() for r in rows[:4] for c in r if isinstance(c, str) and c.strip())
    out = {}; end = None; started = False
    for i in range(hdr + 1, len(rows)):
        r = rows[i]; lab = None
        for j in range(min(first, 3)):
            if isinstance(r[j], str) and r[j].strip(): lab = r[j]; break
        if lab is None: continue
        n = norm(lab)
        if n in ("total espana", "espana"): key = "ES"
        elif n == "total": key = "TOTAL"
        elif n.startswith("otros sacrif"): key = "OTROS"
        else: key = LABEL.get(n)
        if key is None and not started: continue  # filas de cabecera que siguen a la de especies («CC.AA.», «(en miles)»)
        started = started or key is not None
        vals = {}
        for s in SPECIES:
            v = r[col[s]] if col[s] < len(r) else None
            if isinstance(v, bool): raise ValueError("%s %s: valor logico" % (name, lab))
            if isinstance(v, (int, float)): vals[s] = (float(v), None)
            elif v is None or (isinstance(v, str) and not v.strip()): vals[s] = (None, None)
            elif isinstance(v, str) and DCRE.match(v): vals[s] = (None, int(DCRE.match(v).group(1) or 0))
            else: raise ValueError("%s %s %s: celda no reconocida %r" % (name, lab, s, v))
        if key is None:
            if any(v[0] is not None or v[1] is not None for v in vals.values()): raise ValueError("%s: fila con datos y nombre sin reconocer: %r" % (name, lab))
            continue
        if key in out and out[key] != vals: raise ValueError("%s: la fila %r aparece dos veces con cifras distintas" % (name, lab))
        out[key] = vals
        if key == "ES": end = i; break
    if "ES" not in out: raise ValueError("hoja %s: no hay fila «España»" % name)
    foot = " ".join(str(c) for r in rows[(end or 0) + 1:] for c in r if isinstance(c, str))
    units = {}
    for s in ("aves", "conejos"):
        head = " ".join(str(rows[k][col[s]]) for k in range(max(0, hdr - 1), min(len(rows), hdr + 4)) if col[s] < len(rows[k]) and isinstance(rows[k][col[s]], str))
        n = norm(head)
        units[s] = 1000 if ("miles" in n or ("1" in n.split() and re.search(r"miles de animales", norm(foot)))) else 1
    return out, units, title
def build_year(sheets, year):
    (hn, hr), (mn, mr) = pick(sheets)
    H, uh, title = read_sheet(hn, hr); M, um, _ = read_sheet(mn, mr)
    if set(H) != set(M): raise ValueError("%d: filas distintas entre cabezas y carne: %s" % (year, sorted(set(H) ^ set(M))))
    reg = {}
    for key in H:
        reg[key] = {s: {"heads": (None if H[key][s][0] is None else H[key][s][0] * (uh.get(s, 1) if s in uh else 1)), "meat": M[key][s][0], "dcH": H[key][s][1], "dcM": M[key][s][1]} for s in SPECIES}
    for slug, pid in UNI.items():
        a, b = "c" + slug, "p" + pid
        if a in reg and b not in reg: reg[b] = reg[a]
        elif b in reg and a not in reg: reg[a] = reg[b]
        elif a in reg and b in reg and reg[a] != reg[b]: raise ValueError("%d: %s tiene dos filas distintas (provincia y comunidad)" % (year, slug))
    miss = [p[1] for p in PROV if "p" + p[0] not in reg]
    if miss: raise ValueError("%d: faltan provincias: %s" % (year, ", ".join(miss)))
    missc = [k for k in CCAA if "c" + k not in reg]
    if missc: raise ValueError("%d: faltan comunidades: %s" % (year, ", ".join(missc)))
    alltext = " ".join(str(c) for r in hr for c in r if isinstance(c, str))
    basis = "census" if re.search(r"censal|exhaustiv|censo", alltext, re.I) else ("unraised" if re.search(r"sin elevar", alltext, re.I) else "unspecified")
    return {"reg": reg, "title": re.sub(r"\s+", " ", title)[:160], "basis": basis, "hasOthers": "OTROS" in reg}
def validate(year, Y):
    errs = []; warns = []; notes = []; nbig = 0; R = Y["reg"]
    tol = lambda x: 2.0 + 0.0005 * abs(x)
    for s in SPECIES:
        for m in MEAS:
            g = lambda k: R[k][s][m] if k in R else None
            for k, d in R.items():
                if d[s][m] is not None and d[s][m] < -1e-6: errs.append("%d %s %s %s: valor negativo" % (year, k, s, m))
            ccs = [k for k in CCAA if g("c" + k) is not None]
            if g("TOTAL") is not None and len(ccs) == len([k for k in CCAA]):
                tot = sum(g("c" + k) for k in CCAA)
                if abs(tot - g("TOTAL")) > tol(g("TOTAL")): errs.append("%d %s %s: las comunidades suman %.1f y el TOTAL del MAPA es %.1f" % (year, s, m, tot, g("TOTAL")))
            elif g("TOTAL") is not None:
                tot = sum(g("c" + k) for k in ccs)
                if tot > g("TOTAL") + tol(g("TOTAL")): errs.append("%d %s %s: las comunidades visibles suman mas que el TOTAL" % (year, s, m))
            if g("TOTAL") is not None and g("ES") is not None and g("OTROS") is not None:
                if abs(g("TOTAL") + g("OTROS") - g("ES")) > tol(g("ES")): errs.append("%d %s %s: TOTAL + otros sacrificios (%.1f) distinto de España (%.1f)" % (year, s, m, g("TOTAL") + g("OTROS"), g("ES")))
            elif g("TOTAL") is not None and g("ES") is not None and abs(g("TOTAL") - g("ES")) > tol(g("ES")) and g("OTROS") is None: warns.append("%d %s %s: TOTAL y España difieren y no hay fila de otros sacrificios" % (year, s, m))
            for slug in CCAA:
                if slug in UNI: continue
                c = g("c" + slug); ps = [p for p in PROV if p[2] == slug]; vis = [g("p" + p[0]) for p in ps]; vv = [x for x in vis if x is not None]
                if c is None: continue
                gap = sum(vv) - c if len(vv) == len(ps) else max(0.0, sum(vv) - c)
                if abs(gap) > tol(c):
                    msg = "%d %s %s %s: las provincias %ssuman %.1f y la comunidad %.1f" % (year, slug, s, m, "" if len(vv) == len(ps) else "visibles ", sum(vv), c)
                    big = abs(gap) > 0.15 * c and abs(gap) > 0.01 * (R["ES"][s][m] or 0)
                    nbig += 1 if big else 0
                    notes.append({"year": year, "kind": "sum", "region": slug, "species": s, "measure": m, "provinces": round(sum(vv), 1), "ccaa": round(c, 1)})
                    if big: warns.append(msg + " (cifras publicadas por el MAPA, se dejan tal cual y se anotan)")
    if nbig > 3: errs.append("%d: %d desajustes grandes entre provincias y comunidad: probable error de lectura, no del MAPA" % (year, nbig))
    for s in ("aves", "conejos"):
        h = R["ES"][s]["heads"]; lo, hi = MAGN[s]
        if h is not None and not (lo <= h <= hi): errs.append("%d %s: %.0f cabezas en España fuera de %.0e-%.0e (unidad mal detectada)" % (year, s, h, lo, hi))
    for k, d in R.items():
        if not (k.startswith("p") or k == "ES"): continue
        for s in SPECIES:
            h, t = d[s]["heads"], d[s]["meat"]
            if h and t:
                kg = t * 1000.0 / h; lo, hi = WEIGHT[s]
                if not (lo <= kg <= hi) and h > 20000: warns.append("%d %s %s: peso canal medio %.1f kg fuera de %s-%s" % (year, k, s, kg, lo, hi))
    return errs, warns, notes
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def r3(x): return None if x is None else round(x, 3)
def write_json(path, obj):
    tmp = path.with_suffix(".tmp"); tmp.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8"); os.replace(tmp, path)
def to_doc(allY, files, notes, old_revs):
    years = sorted(allY)
    def block(key, getter=None):
        return {s: {m: [r3(allY[y]["reg"][key][s][m]) if key in allY[y]["reg"] else None for y in years] for m in MEAS} for s in SPECIES}
    v = {"ES": block("ES")}
    for p in PROV: v[p[0]] = block("p" + p[0])
    cc = {k: block("c" + k) for k in CCAA}
    dc = {}
    for key in ["p" + p[0] for p in PROV] + ["c" + k for k in CCAA] + ["ES"]:
        for s in SPECIES:
            for m, f in (("heads", "dcH"), ("meat", "dcM")):
                d = {str(y): allY[y]["reg"][key][s][f] for y in years if key in allY[y]["reg"] and allY[y]["reg"][key][s][f] is not None}
                if d: dc.setdefault(key[1:] if key != "ES" else "ES", {}).setdefault(s, {})[m] = d
    # las claves de dc de comunidades y provincias no chocan: las provincias son «01».. y las comunidades son nombres
    doc = {"schemaVersion": 1, "generatedAt": now(), "checkedAt": now(), "source": {"id": "mapa_es", "url": PAGE}, "years": years, "species": SPECIES, "units": {"heads": "cabezas", "meat": "toneladas de peso canal"},
           "provinces": {p[0]: {"name": p[1], "ccaa": p[2]} for p in PROV}, "ccaaNames": CCAA, "v": v, "ccaa": cc, "dc": dc,
           "provTotal": block("TOTAL"), "others": block("OTROS"),
           "basis": {str(y): allY[y]["basis"] for y in years}, "titles": {str(y): allY[y]["title"] for y in years}, "files": files, "notes": notes, "revisions": old_revs}
    return doc
def from_doc(doc):
    """Reconstruye {año: Y} desde census.json (para no volver a bajar libros sin cambios)."""
    Ys = {}
    for i, y in enumerate(doc["years"]):
        reg = {}
        def put(key, blk, f="v"):
            reg[key] = {s: {"heads": blk[s]["heads"][i], "meat": blk[s]["meat"][i], "dcH": None, "dcM": None} for s in SPECIES}
        for pid in doc["v"]:
            if pid == "ES": put("ES", doc["v"]["ES"])
            else: put("p" + pid, doc["v"][pid])
        for k in doc["ccaa"]: put("c" + k, doc["ccaa"][k])
        put("TOTAL", doc["provTotal"])
        if any(doc["others"][s][m][i] is not None for s in SPECIES for m in MEAS): put("OTROS", doc["others"])
        for key, sd in doc["dc"].items():
            rk = "ES" if key == "ES" else ("p" + key if key in doc["provinces"] else "c" + key)
            for s, md in sd.items():
                for m, yd in md.items():
                    if str(y) in yd: reg[rk][s]["dcH" if m == "heads" else "dcM"] = yd[str(y)]
        for key in reg:
            for s in SPECIES:  # los valores de las celdas con DC ya son null en el archivo
                pass
        Ys[y] = {"reg": reg, "title": doc["titles"][str(y)], "basis": doc["basis"][str(y)], "hasOthers": "OTROS" in reg}
    return Ys
def find_links(html):
    """Año -> url del libro anual (.xls/.xlsx), por el texto del enlace («Sacrificios 2023», «Censo exhaustivo 2025»)."""
    found = {}
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
        href, text = m.group(1), re.sub(r"<[^>]+>", "", m.group(2)); t = norm(text)
        y = re.search(r"\b(20\d\d)\b", t)
        if not y or not re.search(r"(sacrificios? \d{4}|censo exhaustivo)", t) or "pdf" in t or "pdf" in href.lower() or "mensual" in t: continue
        base = href.split("?")[0].lower()
        if not (base.endswith(".xls") or base.endswith(".xlsx")): continue
        found.setdefault(int(y.group(1)), href if href.startswith("http") else SITE + href)
    return found

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file", action="append"); ap.add_argument("--year", action="append", type=int); ap.add_argument("--force", action="store_true"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "census.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None
    allY = from_doc(old) if old else {}; files = dict(old["files"]) if old else {}; new = {}; changed = False
    try:
        if a.file:
            if not a.year or len(a.year) != len(a.file): log("--file necesita un --year por libro"); return 1
            for f, y in zip(a.file, a.year):
                sh = rows_of(f, f.rsplit(".", 1)[-1].lower()); new[y] = build_year(sh, y); files[str(y)] = {"url": None, "lastModified": None}; changed = True
        else:
            links = find_links(http(PAGE).decode("utf-8", "replace"))
            if not links: log("ERROR: no se encuentra ningun libro anual en la pagina del MAPA"); return 1
            for y in range(FIRST, datetime.date.today().year + 1):
                url = links.get(y)
                if not url: continue
                lm = None
                try: lm = http(url, "HEAD").get("Last-Modified")
                except Exception as ex: log("HEAD fallo:", str(ex)[:60])
                prev = files.get(str(y))
                if not a.force and prev and prev.get("url") == url and lm and prev.get("lastModified") == lm and y in allY: continue
                ext = url.split("?")[0].rsplit(".", 1)[-1].lower()
                try: new[y] = build_year(rows_of(http(url), ext), y)
                except Exception as ex: log("libro %d (%s) no se lee: %s" % (y, url.rsplit("/", 1)[-1], str(ex)[:160])); continue
                files[str(y)] = {"url": url, "lastModified": lm}; changed = True
    except Exception as ex: log("ERROR al leer los libros:", ex); return 1
    if not changed and old:
        old["checkedAt"] = now(); write_json(path, old); log("censo sin cambios"); return 0
    errs = []
    for y, Y in sorted(new.items()):
        e, w, nt = validate(y, Y); errs += e; Y["notes"] = nt
        for x in w[:8]: log("AVISO:", x)
        if len(w) > 8: log("AVISO: %d avisos mas en %d" % (len(w) - 8, y))
    if errs:
        for e in errs[:25]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    revs = 0
    for y, Y in new.items():
        if y in allY:
            for k, d in Y["reg"].items():
                for s in SPECIES:
                    for m in MEAS:
                        o = allY[y]["reg"].get(k, {}).get(s, {}).get(m)
                        if o is not None and d[s][m] is not None and abs(o - d[s][m]) > 1e-3 + 1e-6 * abs(o): revs += 1
        allY[y] = Y
    notes = []
    for y in sorted(allY):
        if allY[y]["basis"] == "unraised": notes.append({"year": y, "kind": "basis", "text": "datos sin elevar (según el título del libro del MAPA)"})
        notes += allY[y].get("notes", [])
    doc = to_doc(allY, files, notes, (old or {}).get("revisions", 0) + revs)
    write_json(path, doc); log("OK: %d-%d (%d años), %d revisiones" % (doc["years"][0], doc["years"][-1], len(doc["years"]), revs)); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-slaughter-census-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

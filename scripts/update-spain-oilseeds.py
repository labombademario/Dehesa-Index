#!/usr/bin/env python3
"""España: balances anuales de oleaginosas (MAPA, Subdirección General de Cultivos Herbáceos e Industriales y Aceite de Oliva, «Balance oleaginosas en España»)
-> data/spain-oilseeds-stats.json (formato de ficheros de estadisticas por pais).

Fuente: un PDF por campaña de comercialización (1 jul - 30 jun) en la pagina «balances-gestion» de leguminosas y oleaginosas del MAPA, desde 2016/17. Cada PDF trae dos tablas con colza, soja,
girasol y el total (miles de t): semillas (superficie, rendimiento, produccion, existencias iniciales, importaciones, consumo interno, exportaciones, existencias finales) y tortas/harinas
(produccion utilizable, existencias iniciales, importaciones, consumo, exportaciones, existencias finales). Se leen con `pdftotext -layout`; las columnas se asignan por el borde derecho de los numeros.
Aqui se publican como series anuales (periodo = año en que empieza la campaña) las partidas que no estaban ya en el catalogo: importaciones, exportaciones, consumo interno y existencias finales
de las semillas, y produccion utilizable, importaciones, exportaciones, consumo interno y existencias finales de las tortas/harinas, para colza y soja (el girasol se lee y valida, pero no se publica por el presupuesto de datos de la ficha de España). La superficie, el rendimiento y la
produccion de semillas ya vienen de las estadisticas de cultivos del MAPA y no se duplican. La ultima campaña es una estimacion del propio MAPA y las cifras se revisan: el PDF manda.
Nada se estima ni se completa: si una tabla no cuadra (disponibilidades = existencias iniciales + produccion + importaciones; utilizaciones = consumo + exportaciones;
existencias finales = disponibilidades - utilizaciones) en colza, soja o girasol no se escribe nada. La columna TOTAL del PDF no se publica (mezcla productos distintos).
--local AAAA:fichero.txt lee texto ya extraido de un PDF (pruebas); AAAA = año en que empieza la campaña."""
import argparse, datetime, json, os, re, subprocess, sys, tempfile, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/leguminosas-y-oleaginosas/balances-gestion"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
CROPS = ["rapeseed", "soy", "sunflower", "total"]
# etiqueta normalizada (sin tildes, sin «A. », sin parentesis) -> clave
SEED_ROWS = [("superficie", "area"), ("rendimiento", "yield"), ("produccion", "production"), ("existencias iniciales", "beginningStocks"), ("importaciones", "imports"),
             ("total disponibilidades", "totalSupply"), ("consumo interno", "consumption"), ("exportaciones", "exports"), ("total utilizaciones", "totalUse"), ("existencias finales", "endingStocks")]
MEAL_ROWS = [("produccion utilizable", "production"), ("existencias iniciales", "beginningStocks"), ("importaciones", "imports"), ("total disponibilidades", "totalSupply"),
             ("consumo interno", "consumption"), ("exportaciones", "exports"), ("total utilizaciones", "totalUse"), ("existencias finales", "endingStocks")]
NUM = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?")
# partida -> (grupo del catalogo, texto de la etiqueta); solo lo que no esta ya en el catalogo
SEED_SERIES = {"imports": ("trade", "imports"), "exports": ("trade", "exports"), "consumption": ("production", "domestic use"), "endingStocks": ("stocks", "closing stock")}
MEAL_SERIES = {"production": ("production", "usable output"), "imports": ("trade", "imports"), "exports": ("trade", "exports"), "consumption": ("production", "domestic use"), "endingStocks": ("stocks", "closing stock")}
CROP_TXT = {"rapeseed": ("rapeseed", "rapeseed meal and cake"), "soy": ("soybeans", "soybean meal and cake"), "sunflower": ("sunflower seed", "sunflower meal and cake")}
KEYS = {"rapeseed": "rapeseed", "soy": "soybean", "sunflower": "sunflower"}
PUBLISH = ("rapeseed", "soy")   # el girasol se lee y se valida igual, pero no se publica: el presupuesto de datos de la ficha de España (scripts/page-budget.json) no admite mas series
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def http(url, tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))

def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"^\s*[a-c]\.\s*", "", s); return re.sub(r"\s+", " ", s).strip()

def num(tok): return float(tok.replace(".", "").replace(",", "."))

def pdf_links(html):
    """{año de inicio: url} de los PDF de balances de oleaginosas. El nombre del fichero lleva la campaña (..._AAAA_AA.pdf); los de leguminosas grano se ignoran."""
    out = {}
    for h in re.findall(r'href="([^"]+\.pdf)"', html):
        m = re.search(r"/((?:1-)?balances-?oleaginosas-?es)_(\d{4})_(\d{2})\.pdf$", h)
        if not m: continue
        y = int(m.group(2))
        if int(m.group(3)) != (y + 1) % 100: log("campaña incoherente en el nombre, se ignora:", h[-70:]); continue
        out[y] = h if h.startswith("http") else SITE + h
    return out

def parse_table(lines, rows_def):
    keys = [k for _, k in rows_def]; rows = {}
    for ln in lines:
        lab = re.match(r"^\s*(?:[A-C]\.\s*)?([A-Za-zÁÉÍÓÚáéíóúñÑ ()/\.0-9]+?)\s{2,}(?=[\d])", ln)
        if not lab: continue
        n = re.sub(r"\s*\(.*$", "", norm(lab.group(1))); key = None
        for k, v in rows_def:
            if n == k: key = v
        if not key: continue
        if key in rows: raise ValueError("fila repetida: " + key)
        rows[key] = [(mm.end() + lab.end(), num(mm.group(0))) for mm in NUM.finditer(ln[lab.end():])]
    miss = [k for k in keys if k not in rows]
    if miss: raise ValueError("faltan filas: %s" % miss)
    ref = [e for e, _ in rows["totalSupply"]]
    if len(ref) != len(CROPS): raise ValueError("la fila de disponibilidades no trae %d columnas" % len(CROPS))
    gap = min(b - a for a, b in zip(ref, ref[1:]))
    v = {c: {} for c in CROPS}
    for k in keys:
        used = {}
        for e, x in rows[k]:
            j = min(range(len(ref)), key=lambda i: abs(ref[i] - e))
            if abs(ref[j] - e) > gap / 2 or j in used: raise ValueError("columna ambigua en %s (borde %d)" % (k, e))
            used[j] = x
        for j, c in enumerate(CROPS): v[c][k] = used.get(j)
    return v

def parse_text(text, year):
    """Texto de pdftotext -layout -> {status, edition, seeds:{cultivo:{partida:valor|None}}, meals:{...}}. Lanza ValueError si el PDF no es el esperado."""
    m = re.search(r"Campa[ñn]a\s+(\d{4})/(\d{4})\s*(?:\(([^)]*)\))?", text)
    if not m or int(m.group(1)) != year or int(m.group(2)) != year + 1: raise ValueError("el PDF no es de la campaña %d/%d" % (year, year + 1))
    ed = re.search(r"^\s*(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{4})\s*$", text, re.I | re.M)
    i = text.find("BALANCE SEMILLAS"); j = text.find("BALANCE TORTAS")
    if i < 0 or j < i: raise ValueError("no estan las dos tablas (semillas y tortas/harinas)")
    return {"status": (m.group(3) or "").strip().lower() or None, "edition": (ed.group(1).capitalize() + " " + ed.group(2)) if ed else None,
            "seeds": parse_table(text[i:j].splitlines(), SEED_ROWS), "meals": parse_table(text[j:].splitlines(), MEAL_ROWS)}

def tol(x): return 3 + 0.001 * abs(x or 0)

def validate(camps):
    """(errores, avisos). Errores: colza, soja o girasol cuyas cifras no cuadran o son negativas. Avisos: la columna TOTAL no suma lo que dice, existencias iniciales distintas de las finales anteriores."""
    errs = []; warns = []
    for y, c in sorted(camps.items()):
        lab = "%d/%02d" % (y, (y + 1) % 100)
        for tname, T in (("semillas", c["seeds"]), ("tortas", c["meals"])):
            for cr in CROPS:
                d = T[cr]; tag = "%s %s %s" % (tname, cr, lab); sink = errs if cr != "total" else warns
                for k, x in d.items():
                    if x is not None and x < 0: errs.append("%s %s: valor negativo" % (tag, k))
                g = lambda k: d[k] or 0
                def chk(msg, printed, comp):
                    if printed is not None and abs(comp - printed) > tol(printed): sink.append("%s: %s (impreso %s, calculado %.1f)" % (tag, msg, printed, comp))
                chk("disponibilidades != existencias iniciales + produccion + importaciones", d["totalSupply"], g("beginningStocks") + g("production") + g("imports"))
                chk("utilizaciones != consumo + exportaciones", d["totalUse"], g("consumption") + g("exports"))
                chk("existencias finales != disponibilidades - utilizaciones", d["endingStocks"], g("totalSupply") - g("totalUse"))
            for k in ("production", "imports", "exports", "consumption", "endingStocks"):
                if T["total"][k] is not None:
                    sm = sum(T[cr][k] or 0 for cr in CROPS[:-1])
                    if abs(sm - T["total"][k]) > tol(T["total"][k]) + 3: warns.append("%s %s %s: total != suma de cultivos (%s vs %.1f)" % (tname, k, lab, T["total"][k], sm))
        d = c["seeds"]
        for cr in CROPS[:-1]:
            if d[cr]["area"] and d[cr]["yield"] and d[cr]["production"] and abs(d[cr]["area"] * d[cr]["yield"] - d[cr]["production"]) > 0.12 * d[cr]["production"] + 5: warns.append("semillas %s %s: produccion lejos de superficie x rendimiento" % (cr, lab))
    for y in sorted(camps):
        if y - 1 in camps:
            for tname in ("seeds", "meals"):
                for cr in CROPS[:-1]:
                    a, b = camps[y - 1][tname][cr]["endingStocks"], camps[y][tname][cr]["beginningStocks"]
                    if a is not None and b is not None and abs(a - b) > tol(a): warns.append("%s %s: existencias iniciales %d/%02d (%s) != finales de la campaña anterior (%s)" % (tname, cr, y, (y + 1) % 100, b, a))
    return errs, warns

def make_series(camps):
    out = []
    for tname, defs in (("seeds", SEED_SERIES), ("meals", MEAL_SERIES)):
        for cr in PUBLISH:
            for item, (grp, what) in defs.items():
                pts = [[str(y), camps[y][tname][cr][item]] for y in sorted(camps) if camps[y][tname][cr][item] is not None]
                if len(pts) < 3: continue
                prev = pts[-2][1]; txt = CROP_TXT[cr][0 if tname == "seeds" else 1]
                out.append({"id": "es-oilseed-%s-%s-%s" % ("seed" if tname == "seeds" else "meal", KEYS[cr], re.sub(r"[^a-z]+", "-", what)), "group": grp,
                            "label": "Balance sheet, %s: %s (MAPA oilseed balance, marketing year from 1 July; latest year is an estimate)" % (what, txt), "unit": "thousand t", "frequency": "annual",
                            "latestPeriod": pts[-1][0], "latest": pts[-1][1], "changePct": round((pts[-1][1] - prev) / prev * 100, 2) if prev else None, "points": pts, "sourceGroup": "MAPA balance oleaginosas"})
    return out

def pdftext(blob):
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "b.pdf"; p.write_bytes(blob)
        return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--local", action="append", default=[]); ap.add_argument("--out"); a = ap.parse_args()
    outdir = Path(a.out) if a.out else ROOT / "data"; texts = {}
    if a.local:
        for s in a.local: y, f = s.split(":", 1); texts[int(y)] = Path(f).read_text("utf-8")
    else:
        try: links = pdf_links(http(PAGE).decode("utf-8", "replace"))
        except Exception as e: log("ERROR: no se pudo leer la pagina:", e); return 1
        if len(links) < 8: log("ERROR: la pagina trae solo %d balances (se esperan 8 o mas); no se escribe nada" % len(links)); return 1
        for y, u in sorted(links.items()):
            try: texts[y] = pdftext(http(u))
            except Exception as e: log("ERROR: no se pudo bajar o leer %d: %s" % (y, e)); return 1
    camps = {}
    for y, t in sorted(texts.items()):
        try: camps[y] = parse_text(t, y)
        except Exception as e: log("ERROR al leer %d/%02d: %s; no se escribe nada" % (y, (y + 1) % 100, e)); return 1
    errs, warns = validate(camps)
    for w in warns: log("AVISO:", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    series = make_series(camps)
    if len(series) < 16: log("ERROR: solo %d series (se esperan 16 o mas); no se escribe nada" % len(series)); return 1
    src = {"name": "MAPA — Balance de oleaginosas en España (Subdirección General de Cultivos Herbáceos e Industriales y Aceite de Oliva)", "url": PAGE, "license": "MAPA aviso legal: reuse without prior authorisation if the source is cited"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": sorted(series, key=lambda s: s["id"])}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True); tmp = outdir / "spain-oilseeds-stats.json.tmp"
    tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-oilseeds-stats.json")
    log("OK: campañas %s; %d series" % (", ".join("%d/%02d" % (y, (y + 1) % 100) for y in sorted(camps)), len(series))); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-oilseeds-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

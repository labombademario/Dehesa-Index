#!/usr/bin/env python3
"""Manitoba: precios semanales de granos y oleaginosas en el elevador de Winnipeg (Manitoba Agriculture, informe «Grain and Oilseed Prices», PDF de los viernes)
-> data/mb-markets/grains.json (semanas acumuladas, C$/t y C$/bushel tal como los publica la fuente) y su historia mensual oficial desde 1987
(Excel «manitoba-markets-crops-prices-monthly.xlsx» de la misma pagina; solo las 12 filas del bloque OPEN MARKET).
Fuente: gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/ ; licencia OpenMB (uso comercial y derivados con atribucion; excluye material de terceros).
NO se ingieren los bloques de futuros del mismo PDF (ICE y Chicago): son de terceros. Tampoco los tipos de cambio.
Se leen con `pdftotext -layout`. Nada se estima: «NA» es null. Una semana que no pasa las comprobaciones (fecha del informe = la del enlace, bushel x factor = tonelada,
cambio semanal = tonelada - tonelada de la semana anterior publicada si es la anterior, rango plausible) NO se publica y se anota; las demas siguen.
Uso: update-mb-grains.py [--out DIR] [--text FICHERO.txt ...] [--no-monthly]   (--text: lee texto ya extraido, sin red; solo pruebas)"""
import argparse, datetime, io, json, re, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.gov.mb.ca"
PAGE = BASE + "/agriculture/markets-and-statistics/crop-statistics/grains-oilseeds-market-prices-current-year.html"
ARCHIVE = BASE + "/agriculture/markets-and-statistics/crop-statistics/grains-oilseeds-market-prices-archives.html"
MONTHLY = BASE + "/agriculture/markets-and-statistics/crop-statistics/pubs/manitoba-markets-crops-prices-monthly.xlsx"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
# clave, etiqueta del PDF (cultivo + variedad), etiqueta del Excel mensual, bushels por tonelada (None = solo tonelada)
CROPS = [
    ("wheat_wrs", ("Wheat", "Western Red Spring"), "Wheat, Western Red Spring", 36.7437),
    ("wheat_nhr", ("Wheat", "Northern Hard Red"), "Wheat, Northern Hard Red", 36.7437),
    ("wheat_rw", ("Wheat", "Red Winter"), "Wheat, Red Winter", 36.7437),
    ("wheat_sp", ("Wheat", "Special Purpose (Low Vomi)"), "Wheat, Special Purpose (Low Vomi)", 36.7437),
    ("barley", ("Barley", "#1CW"), "Barley, #1CW", 45.9296),
    ("flax", ("Flaxseed", "#1CW"), "Flaxseed, #1CW", 39.3680),
    ("canola", ("Canola", "#1CR"), "Canola, #1CR", 44.0920),
    ("peas", ("Peas", "#2 Yellow"), "Peas, #2 Yellow", 36.7437),
    ("corn", ("Corn", "#2"), "Corn, #2", 39.3680),
    ("oats", ("Oats", "#2CW"), "Oats, #2CW", 64.8421),
    ("soybeans", ("Soybeans", ""), "Soybeans", 36.7437),
    ("canola_meal", ("Canola Meal", "34%, Altona"), "Canola Meal, 34%, Altona", None),
]
KEYS = [c[0] for c in CROPS]
RETAIN_WEEKS = 520
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

NUM = r"(NA|-?\d[\d,]*\.?\d*)"
def num(t): return None if t == "NA" else float(t.replace(",", ""))
def parse_report(text):
    """Texto de pdftotext -layout -> {date, rows:{clave:[tonelada, bushel|None, cambio|None]}}  (solo el bloque OPEN MARKET)"""
    lines = text.splitlines()
    m = re.search(r"^\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})\s*$", "\n".join(lines[:8]), re.M)
    if not m: raise ValueError("sin fecha del informe")
    date = datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date().isoformat()
    i = next((k for k, l in enumerate(lines) if l.strip().startswith("OPEN MARKET")), None)
    if i is None: raise ValueError("sin bloque OPEN MARKET")
    j = next((k for k in range(i + 1, len(lines)) if re.match(r"^\s*C\$/tonne\b", lines[k]) or lines[k].strip().startswith("CLOSING FUTURES")), len(lines))
    block = lines[i + 1:j]
    rows = {}
    for key, (crop, variety), _x, bu_t in CROPS:
        pat = re.compile(r"^\s*%s\s+%s\s+(.*)$" % (re.escape(crop), re.escape(variety)) if variety else r"^\s*%s\s+(.*)$" % re.escape(crop))
        hit = [pat.match(l.replace("`", " ")) for l in block]; hit = [h for h in hit if h and not re.search(r"[A-Za-z]", re.sub(r"\bna\b", "NA", h.group(1), flags=re.I).replace("NA", ""))]
        if len(hit) != 1: raise ValueError("%s: %d filas en el informe" % (key, len(hit)))
        v = [num(t) for t in re.findall(r"(?<![\w.])" + NUM + r"(?![\w.])", re.sub(r"\bna\b", "NA", hit[0].group(1), flags=re.I))]
        if bu_t is None:
            if len(v) != 3: raise ValueError("%s: %d columnas en vez de 3" % (key, len(v)))
            rows[key] = [v[0], None, v[1]]
        else:
            if len(v) != 4: raise ValueError("%s: %d columnas en vez de 4" % (key, len(v)))
            rows[key] = [v[1], v[0], v[2]]
    return {"date": date, "rows": rows}

def check_report(r, prev=None):
    """prev = (fecha, filas) del informe publicado inmediatamente anterior, si esta a 10 dias o menos. Devuelve las claves en disputa
    (cambio semanal publicado que no cuadra con la semana anterior): su valor NO se publica y no se corrige."""
    d = datetime.date.fromisoformat(r["date"]); disputed = []
    if d.weekday() > 4: raise ValueError("el informe es de un fin de semana (%s)" % r["date"])
    if d > datetime.date.today() + datetime.timedelta(days=2): raise ValueError("informe en el futuro")
    for key, _lbl, _x, bu_t in CROPS:
        t, bu, ch = r["rows"][key]
        if t is None: continue
        if not (50 <= t <= 2500): raise ValueError("%s: tonelada fuera de rango (%s)" % (key, t))
        if bu_t is not None and bu is not None and abs(bu * bu_t - t) > max(1.0, t * 0.006): raise ValueError("%s: %s C$/bu x %s no da %s C$/t" % (key, bu, bu_t, t))
        if prev and ch is not None and prev[1][key][0] is not None and abs(prev[1][key][0] + ch - t) > 0.06: disputed.append(key)
    return disputed

def compact(r): return [[r["rows"][k][0], r["rows"][k][1]] for k in KEYS]

def http(url, tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))
def pdf_text(data):
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "r.pdf"; p.write_bytes(data)
        return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout

def read_monthly(data):
    """Excel mensual oficial -> {clave:{'AAAA-MM': C$/t}}. Solo filas de «Farmer's net cash return at Wpg elevator» en CAD/tonne de los 12 cultivos; el resto se ignora."""
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True); ws = wb.worksheets[0]
    it = ws.iter_rows(values_only=True); head = [str(x or "").strip() for x in next(it)]
    need = ["Year", "Month", "UOM", "Crop", "Value", "Indicator"]
    if head[:6] != need: raise ValueError("cabecera del Excel mensual distinta: %r" % head[:6])
    by = {c[2]: c[0] for c in CROPS}; out = {k: {} for k in KEYS}; ignored = set()
    for y, mth, uom, crop, val, ind in (r[:6] for r in it):
        if y is None: continue
        if crop not in by: ignored.add(str(crop)); continue
        if uom != "CAD/tonne" or "net cash return" not in str(ind): continue
        if val is None or isinstance(val, str): continue
        k = "%04d-%02d" % (int(y), int(mth))
        if k in out[by[crop]]: raise ValueError("mes repetido %s %s" % (crop, k))
        out[by[crop]][k] = round(float(val), 2)
    return out, sorted(ignored)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "mb-markets")); ap.add_argument("--text", nargs="*", default=None); ap.add_argument("--no-monthly", action="store_true")
    a = ap.parse_args(); out = Path(a.out); f = out / "grains.json"
    prev = {}
    if f.exists():
        try: prev = json.loads(f.read_text(encoding="utf-8"))
        except Exception: prev = {}
    weeks = dict(prev.get("weeks", {})); monthly = prev.get("monthly", {}); errors = []; got = 0
    reports = []
    if a.text is not None:
        reports = [("local", Path(p).read_text(encoding="utf-8")) for p in a.text]
    else:
        links = set()
        for page in (PAGE, ARCHIVE):
            try: links |= set(re.findall(r'href="([^"]*pubs/grains-\d{4}-\d{2}-\d{2}\.pdf)"', http(page).decode("utf-8", "replace")))
            except Exception as e: log("ERROR pagina", page.rsplit("/", 1)[-1], str(e)[:120])
        if not links: raise SystemExit("las paginas no enlazan informes semanales: no se toca nada")
        # solo se descargan los informes que aun no estan publicados (los de las ultimas 8 semanas se releen por si la fuente los revisa)
        have = sorted(weeks); recent = set(have[-8:])
        for h in sorted(links):
            d = re.search(r"grains-(\d{4}-\d{2}-\d{2})", h).group(1)
            if d in weeks and d not in recent: continue
            try: reports.append((h.rsplit("/", 1)[-1], pdf_text(http(h if h.startswith("http") else BASE + h))))
            except Exception as e: errors.append("%s: %s" % (h.rsplit("/", 1)[-1], str(e)[:160])); log("ERROR descarga", errors[-1])
    parsed = []
    for key, txt in reports:
        try:
            r = parse_report(txt)
            nm = re.search(r"grains-(\d{4}-\d{2}-\d{2})", key)
            if nm and nm.group(1) != r["date"]: raise ValueError("la fecha del informe (%s) no coincide con la del enlace (%s)" % (r["date"], nm.group(1)))
            parsed.append(r)
        except Exception as e:
            errors.append("%s: %s" % (key, e)); log("SEMANA DESCARTADA", errors[-1])
    full = {d: {k: [w[i][0], w[i][1], None] for i, k in enumerate(KEYS)} for d, w in weeks.items()}   # filas para comparar (con el valor original aunque este en disputa)
    disputed = set(prev.get("disputed", []))
    for r in sorted(parsed, key=lambda x: x["date"]):
        before = [x for x in sorted(full) if x < r["date"]]
        pv = (before[-1], full[before[-1]]) if before and (datetime.date.fromisoformat(r["date"]) - datetime.date.fromisoformat(before[-1])).days <= 10 else None
        try: bad = check_report(r, pv)
        except Exception as e:
            errors.append("%s: %s" % (r["date"], e)); log("SEMANA DESCARTADA", errors[-1]); continue
        # si la semana anterior ya estaba en disputa, esta solo se disputa cuando repite exactamente su valor con un cambio distinto de cero (copia): si no, no hay referencia fiable y no se juzga
        bad = [k for k in bad if not (pv and "%s|%s" % (pv[0], k) in disputed) or r["rows"][k][0] == pv[1][k][0]]
        c = compact(r)
        for k in bad:
            c[KEYS.index(k)] = [None, None]; disputed.add("%s|%s" % (r["date"], k)); log("celda en disputa (cambio semanal incoherente con la semana anterior):", r["date"], k)
        if r["date"] in weeks and weeks[r["date"]] != c: log("revision de una semana ya publicada:", r["date"])
        weeks[r["date"]] = c; full[r["date"]] = {k: [r["rows"][k][0], r["rows"][k][1], r["rows"][k][2]] for k in KEYS}; got += 1
    if not weeks: raise SystemExit("ninguna semana valida: no se toca nada")
    if not a.no_monthly and a.text is None:
        try:
            m, ign = read_monthly(http(MONTHLY, timeout=180))
            if sum(len(v) for v in m.values()) < 3000: raise ValueError("Excel mensual con menos de 3000 valores")
            if prev.get("monthly") and any(len(m[k]) < len(prev["monthly"].get(k, {})) for k in KEYS): raise ValueError("el Excel mensual trae menos meses que lo ya publicado")
            monthly = m; log("mensual:", sum(len(v) for v in m.values()), "valores; filas de otros cultivos ignoradas:", ", ".join(ign))
        except Exception as e: errors.append("mensual: %s" % str(e)[:160]); log("ERROR mensual (se conserva lo publicado):", errors[-1])
    keep = sorted(weeks)[-RETAIN_WEEKS:]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "mb_agri", "name": "Manitoba Agriculture - Grain and Oilseed Prices (precio neto al agricultor en el elevador de Winnipeg)", "url": PAGE},
           "unit": "C$/t", "crops": KEYS, "weeks": {k: weeks[k] for k in keep}, "disputed": sorted(x for x in disputed if x.split("|")[0] in keep), "monthly": monthly}
    old = {k: v for k, v in prev.items() if k != "generatedAt"}; new = {k: v for k, v in doc.items() if k != "generatedAt"}
    if old != new:
        out.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); log("escrito", f.name, len(keep), "semanas;", got, "leidas")
    else: log("sin cambios;", got, "informes leidos")
    return 1 if errors and got == 0 else 0

if __name__ == "__main__":
    try: rc = main()
    finally:
        try:
            if "--text" not in sys.argv and "--out" not in sys.argv: (ROOT / "data" / "mb-grains-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8")
        except Exception: pass
    sys.exit(rc)

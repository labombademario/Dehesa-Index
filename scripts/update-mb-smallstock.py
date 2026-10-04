#!/usr/bin/env python3
"""Manitoba: ovino y caprino en subastas (Winnipeg y Grunthal) y porcino (procesadoras) de los informes semanales de Manitoba Agriculture
-> data/mb-markets/sheep-goat.json y data/mb-markets/hogs.json (historia acumulada).
Fuentes: informe «Cattle, Sheep and Goat Prices» (PDF de los viernes, seccion «Sheep and Goat») e informe «Hog Prices» (PDF de los martes), gov.mb.ca/agriculture/markets-and-statistics/livestock-statistics/ ;
licencia OpenMB (uso comercial y derivados con atribucion). Se leen con `pdftotext -layout`. Nada se estima: «NA» es null.
Ovino/caprino: una venta = subasta + fecha de la ultima venta; 8 clases (oveja de desecho, cordero en 4 tramos de peso, macho, cabra y cabrito) con minimo, maximo y media en C$/cwt.
  Manitoba publico las cabras en C$/cabeza hasta 2025 y desde abril de 2025 las convierte a C$/cwt con pesos medios estimados por ella misma: solo se aceptan cabras cuando el propio informe rotula C$/cwt
  (si no, ese precio queda null); el cordero y la oveja salen siempre como C$/cwt.
Porcino: por semana (fin de semana en viernes) precio medio ponderado de la canal «all in» y «Index 100» en C$/100 kg, cerdos procesados y peso medio de canal (kg), todo de las procesadoras de Manitoba.
  No se ingieren las cotizaciones de lechones de destete (son de USDA AMS, ya cubiertas) ni la columna del ano anterior (se reconstruye con la propia historia).
Una venta o semana que no pasa las comprobaciones NO se publica y se anota; las demas siguen.
Uso: update-mb-smallstock.py [--out DIR] [--backfill] [--text FICHERO.txt ...]   (--text: lee texto ya extraido, sin red; el nombre del fichero decide si es de ganado o de porcino)"""
import argparse, datetime, json, re, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.gov.mb.ca"
PAGE = BASE + "/agriculture/markets-and-statistics/livestock-statistics/livestock-market-prices-current.html"
ARCHIVE = BASE + "/agriculture/markets-and-statistics/livestock-statistics/livestock-market-prices-archive.html"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
SG_CLASSES = ["sheep", "lamb100", "lamb80", "lamb60", "lambU60", "billy", "nanny", "kid"]
SG_LABELS = [("sheep", r"Sheep"), ("lamb100", r"100 ?\+ ?lbs\.?"), ("lamb80", r"80 ?- ?100 lbs"), ("lamb60", r"60 ?- ?80 lbs"), ("lambU60", r"Under 60 lbs"), ("billy", r"Billys"), ("nanny", r"Nannys"), ("kid", r"Kids")]
SG_MARTS = ["Winnipeg", "Grunthal"]
HOG_FIELDS = ["allIn", "index100", "pigs", "kg"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
NUM = r"(NA\*?|-?\d[\d,]*\.?\d*)"
def num(t):
    return None if t.startswith("NA") else float(t.replace(",", ""))
def report_date(text):
    m = re.search(r"^\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})\s*$", "\n".join(text.splitlines()[:8]), re.M)
    if not m: raise ValueError("sin fecha del informe")
    return datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date()

# ---------- ovino y caprino ----------
def parse_sheep_goat(text):
    """-> (fecha del informe, {subasta: {"date": ultima venta, "prev": venta anterior, "rows": {clase: [lo, hi, avg]|None}, "goatsCwt": bool}})"""
    rd = report_date(text); lines = text.splitlines()
    i0 = next((i for i, l in enumerate(lines) if re.match(r"^\s*Sheep and Goat\b", l)), None)
    if i0 is None: raise ValueError("sin seccion Sheep and Goat")
    heads = [(i, re.match(r"^\s*([A-Z][A-Za-z. ]+?)\s+Last sale date:\s*(\S+)\s+Sale date:\s*(\S+)", l)) for i, l in enumerate(lines) if i > i0]
    heads = [(i, m) for i, m in heads if m]
    if not heads: raise ValueError("sin subastas en Sheep and Goat")
    out = {}
    for n, (i, m) in enumerate(heads):
        j = heads[n + 1][0] if n + 1 < len(heads) else len(lines)
        mart, last, prev = m.group(1).strip(), m.group(2), m.group(3)
        blk = [l for l in lines[i + 1:j] if not re.match(r"^\s*(Note:|Contact us|Kids \(|Email|www)", l) and "Contact us" not in l]
        rows = {}; pos = 0
        for k, lab in SG_LABELS:
            hit = None
            for t in range(pos, len(blk)):
                mm = re.search(r"(?:^|\s)%s\s+%s\s+%s\s+%s\s+%s\s*$" % (lab, NUM, NUM, NUM, NUM), blk[t])
                if mm and (k != "sheep" or re.match(r"^\s*Sheep\b", blk[t])): hit = (t, mm); break
            if not hit: raise ValueError("%s: falta la fila %s" % (mart, k))
            pos = hit[0] + 1; v = [num(hit[1].group(g)) for g in (1, 2, 3)]
            rows[k] = None if any(x is None for x in v) else v
        btxt = "\n".join(blk); gi = btxt.find("Billys")
        goat_txt = btxt[gi:] if gi >= 0 else ""
        si = btxt.find("Sheep"); lamb_txt = btxt[si:gi] if gi > si >= 0 else ""
        if not (re.search(r"C\$/cwt", lamb_txt) and not re.search(r"C\$/head|C\$/swt", lamb_txt)): raise ValueError("%s: el cordero no esta rotulado en C$/cwt" % mart)
        goats_cwt = bool(re.search(r"C\$/cwt", goat_txt)) and not re.search(r"C\$/head|C\$/swt", goat_txt)
        out[mart] = {"date": last, "prev": prev, "rows": rows, "goatsCwt": goats_cwt}
    return rd, out
def check_sheep_goat(rd, blocks):
    """Una subasta que no pasa las comprobaciones se omite (se anota) y las demas del mismo informe siguen."""
    ok = {}
    for mart, b in blocks.items():
        try: ok[mart] = _check_block(rd, mart, b)
        except ValueError as e: log("SUBASTA OMITIDA", str(e))
    return ok
def _check_block(rd, mart, b):
    try:
        d = datetime.date.fromisoformat(b["date"]); p = datetime.date.fromisoformat(b["prev"])
    except ValueError: raise ValueError("%s: fecha de venta ilegible (%s / %s)" % (mart, b["date"], b["prev"]))
    if not (0 <= (rd - d).days <= 150): raise ValueError("%s: fecha de la ultima venta %s fuera de la ventana del informe %s" % (mart, b["date"], rd))
    if not (0 < (d - p).days <= 120): raise ValueError("%s: venta anterior %s incoherente con %s" % (mart, b["prev"], b["date"]))
    if d.weekday() not in (1, 2, 3, 4): raise ValueError("%s: la venta del %s cae en %s (las subastas venden de martes a viernes; fecha dudosa)" % (mart, b["date"], d.strftime("%A")))
    rows = {}
    for k, t in b["rows"].items():
        if k in ("billy", "nanny", "kid") and not b["goatsCwt"]: rows[k] = None; continue
        if t is None: rows[k] = None; continue
        lo, hi, av = t
        top = 1500 if k in ("billy", "nanny", "kid") else 800
        if not (lo <= av <= hi): log("celda descartada (minimo/media/maximo incoherentes):", mart, b["date"], k, t); rows[k] = None; continue
        if not (40 <= av <= top): raise ValueError("%s %s: precio fuera de rango %r" % (mart, k, t))
        rows[k] = t
    return {"date": b["date"], "rows": rows}
def merge_cells(cur, new, tag, disputed):
    """Mezcla una fila nueva con la ya guardada. Si dos informes dan valores distintos para la misma celda no se sabe cual es el bueno (p. ej. 440 vs 880):
    la celda queda null y se anota como en disputa para que un informe posterior no la reponga."""
    if cur is None: return list(new)
    out = []
    for i, (a, b) in enumerate(zip(cur, new)):
        key = "%s|%d" % (tag, i)
        if key in disputed: out.append(None)
        elif a == b or b is None: out.append(a)
        elif a is None: out.append(b)
        else: disputed.add(key); out.append(None); log("celda en disputa entre informes (se deja vacia):", tag, i, a, b)
    return out
def compact_sale(rows):
    return [rows[k] for k in SG_CLASSES]

# ---------- porcino ----------
HOG_SECTIONS = [("allIn", r"^\s*All In Weights"), ("index100", r"^\s*Index 100, C\$/100 kg"), ("pigs", r"^\s*Number of Pigs Processed by Major Processors\s*$"), ("kg", r"^\s*Average Weight of Hogs Processed by Major Processors, Kg\s*$")]
def parse_hogs(text):
    """-> (fecha del informe, {fin de semana: {campo: valor|None}})"""
    rd = report_date(text); lines = text.splitlines()
    starts = []
    for f, rx in HOG_SECTIONS:
        i = next((i for i, l in enumerate(lines) if re.match(rx, l)), None)
        if i is None: raise ValueError("falta la tabla " + f)
        starts.append((i, f))
    starts.sort(); weeks = {}
    for n, (i, f) in enumerate(starts):
        j = starts[n + 1][0] if n + 1 < len(starts) else len(lines); got = 0
        for l in lines[i + 1:j]:
            m = re.match(r"^\s*(\d{1,2})\s+(\d{4}-\d{2}-\d{2})\s+%s\s+%s\s+" % (NUM, NUM), l)
            if not m: continue
            got += 1; weeks.setdefault(m.group(2), {})[f] = num(m.group(3))
        if got != 4: raise ValueError("tabla %s: %d filas semanales en vez de 4" % (f, got))
    return rd, weeks
def check_hogs(rd, weeks):
    ok = {}
    for we, v in weeks.items():
        d = datetime.date.fromisoformat(we)
        if d.weekday() != 4: raise ValueError("fin de semana %s no es viernes" % we)
        if not (0 <= (rd - d).days <= 35): raise ValueError("semana %s fuera de la ventana del informe %s" % (we, rd))
        full = {f: v.get(f) for f in HOG_FIELDS}
        a, x, p, k = (full[f] for f in HOG_FIELDS)
        if a is not None and not (100 <= a <= 500): raise ValueError("%s: precio all-in fuera de rango (%s)" % (we, a))
        if x is not None and not (100 <= x <= 500): raise ValueError("%s: Index 100 fuera de rango (%s)" % (we, x))
        if p is not None and not (20000 <= p <= 250000): raise ValueError("%s: cerdos procesados fuera de rango (%s)" % (we, p))
        if k is not None and not (80 <= k <= 130): raise ValueError("%s: peso de canal fuera de rango (%s)" % (we, k))
        if a is not None and x is not None and not (0.95 <= a / x <= 1.2): raise ValueError("%s: all-in/Index 100 incoherente (%s / %s)" % (we, a, x))
        if all(t is None for t in full.values()): continue
        ok[we] = [full["allIn"], full["index100"], None if full["pigs"] is None else int(full["pigs"]), full["kg"]]
    return ok

# ---------- red ----------
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
def load(f):
    if f.exists():
        try: return json.loads(f.read_text(encoding="utf-8"))
        except Exception: return {}
    return {}
def write_if_changed(f, prev, doc, what):
    old = {k: v for k, v in prev.items() if k != "generatedAt"}; new = {k: v for k, v in doc.items() if k != "generatedAt"}
    if old != new:
        f.parent.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); log("escrito", f.name, what)
    else: log("sin cambios en", f.name)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "mb-markets")); ap.add_argument("--backfill", action="store_true"); ap.add_argument("--text", nargs="*", default=None)
    a = ap.parse_args(); out = Path(a.out); fs, fh = out / "sheep-goat.json", out / "hogs.json"
    ps, ph = load(fs), load(fh)
    sales = {m: dict(v) for m, v in (ps.get("sales") or {}).items()}; hweeks = dict(ph.get("weeks") or {})
    dsg = set(ps.get("disputed") or []); dh = set(ph.get("disputed") or [])
    errors = []; gs = gh = 0; reports = []   # (clave, tipo, texto)
    if a.text is not None:
        for p in a.text: reports.append((Path(p).name, "hog" if "hog" in Path(p).name else "sg", Path(p).read_text(encoding="utf-8")))
    else:
        links = set()
        for pg in [PAGE] + ([ARCHIVE] if a.backfill else []):
            html = http(pg).decode("utf-8", "replace")
            links |= set(re.findall(r'href="([^"]*(?:cattle-sheep-goat-prices|hog-prices)-\d{4}-\d{2}-\d{2}\.pdf)"', html))
        if not links: raise SystemExit("la pagina no enlaza informes semanales: no se toca nada")
        for h in sorted(links):
            try: reports.append((h.rsplit("/", 1)[-1], "hog" if "hog-prices" in h else "sg", pdf_text(http(h if h.startswith("http") else BASE + h))))
            except Exception as e: errors.append("%s: %s" % (h.rsplit("/", 1)[-1], str(e)[:160])); log("ERROR descarga", errors[-1])
            if a.backfill: time.sleep(0.5)
    for key, kind, txt in reports:
        try:
            nm = re.search(r"prices-(\d{4}-\d{2}-\d{2})", key)
            if kind == "sg":
                rd, blocks = parse_sheep_goat(txt)
                if nm and nm.group(1) != rd.isoformat(): raise ValueError("la fecha del informe (%s) no coincide con la del enlace (%s)" % (rd, nm.group(1)))
                ok = check_sheep_goat(rd, blocks)
            else:
                rd, wk = parse_hogs(txt)
                if nm and not (0 <= (datetime.date.fromisoformat(nm.group(1)) - rd).days <= 3): raise ValueError("la fecha del informe (%s) no coincide con la del enlace (%s)" % (rd, nm.group(1)))
                ok = check_hogs(rd, wk)
        except Exception as e:
            errors.append("%s: %s" % (key, e)); log("INFORME DESCARTADO", errors[-1]); continue
        if kind == "sg":
            for mart, b in ok.items():
                cur = sales.setdefault(mart, {}); cur[b["date"]] = merge_cells(cur.get(b["date"]), compact_sale(b["rows"]), "%s|%s" % (mart, b["date"]), dsg)
            gs += 1
        else:
            for we, v in ok.items():
                hweeks[we] = merge_cells(hweeks.get(we), v, we, dh)
            gh += 1
    sgdoc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "mb_agri", "name": "Manitoba Agriculture - Cattle, Sheep and Goat Prices (subastas de Winnipeg y Grunthal)", "url": PAGE},
             "unit": "C$/cwt", "classes": SG_CLASSES, "marts": SG_MARTS, "disputed": sorted(dsg), "sales": {m: {d: sales[m][d] for d in sorted(sales[m])} for m in sorted(sales)}}
    hgdoc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "mb_agri", "name": "Manitoba Agriculture - Hog Prices (procesadoras de Manitoba)", "url": PAGE},
             "fields": HOG_FIELDS, "units": {"allIn": "C$/100 kg", "index100": "C$/100 kg", "pigs": "cabezas", "kg": "kg"}, "disputed": sorted(dh), "weeks": {d: hweeks[d] for d in sorted(hweeks)}}
    if sgdoc["sales"]: write_if_changed(fs, ps, sgdoc, "%d ventas; %d informes leidos" % (sum(len(v) for v in sgdoc["sales"].values()), gs))
    if hgdoc["weeks"]: write_if_changed(fh, ph, hgdoc, "%d semanas; %d informes leidos" % (len(hgdoc["weeks"]), gh))
    if not sgdoc["sales"] and not hgdoc["weeks"]: raise SystemExit("ningun informe valido: no se toca nada")
    return 1 if errors and gs + gh == 0 else 0

if __name__ == "__main__":
    try: rc = main()
    finally:
        try:
            if "--text" not in sys.argv and "--out" not in sys.argv: (ROOT / "data" / "mb-smallstock-log.txt").write_text("\n".join(LOG[-150:]) + "\n", encoding="utf-8")
        except Exception: pass
    sys.exit(rc)

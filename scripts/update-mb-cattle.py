#!/usr/bin/env python3
"""Manitoba: precios semanales de ganado vacuno en las subastas (Manitoba Agriculture, informe «Cattle, Sheep and Goat Prices», PDF de los viernes)
-> data/mb-markets/cattle.json (historia acumulada semana a semana).
Fuente: gov.mb.ca/agriculture/markets-and-statistics/livestock-statistics/ ; licencia OpenMB (uso comercial y derivados con atribucion).
NO se ingiere el historico mensual en Excel de esa pagina: sus precios de ganado son de Canfax (terceros). Ovino y caprino quedan fuera de esta version.
El informe da por subasta (Ashern, Gladstone, Grunthal, Killarney, Ste Rose, Virden, Winnipeg) minimo, maximo y media en C$/cwt por clase y tramo de peso,
las cabezas vendidas y el acumulado del ano. Se leen con `pdftotext -layout`. Nada se estima: «NA» es null; una subasta sin venta queda sin fecha.
Una semana que no pasa las comprobaciones (suma de cabezas, orden minimo<=media<=maximo, rango plausible) NO se publica y se anota; las demas siguen.
Uso: update-mb-cattle.py [--out DIR] [--text FICHERO.txt ...]   (--text: lee texto ya extraido, sin red; solo pruebas)"""
import argparse, datetime, json, re, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = "https://www.gov.mb.ca/agriculture/markets-and-statistics/livestock-statistics/livestock-market-prices-current.html"
BASE = "https://www.gov.mb.ca"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
MARTS = ["Ashern", "Gladstone", "Grunthal", "Killarney", "Ste Rose", "Virden", "Winnipeg"]
CLASSES = ["cowD12", "cowD3", "bull", "steer901", "steer801", "steer701", "steer601", "steer501", "steer401", "heif901", "heif801", "heif701", "heif601", "heif501", "heif401"]
RETAIN_WEEKS = 520
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

NUM = r"(NA|-?\d[\d,]*\.?\d*)"
LABEL = re.compile(r"^\s*(D1, ?2 Cows|D3 Cows|Bulls|\(\s*901 ?\+ ?lb\)|\(801-900\)|\(701-800\)|\(601-700\)|\(501-600\)|\(401-500\))\s+(.*)$")
MART_HEAD = re.compile(r"^\s*(%s)\s+Sale date:\s*(\d{4}-\d{2}-\d{2}|No sale)" % "|".join(MARTS), re.I)
def num(t):
    return None if t == "NA" else float(t.replace(",", ""))
def rows_in(lines):
    """Lineas con etiqueta de clase -> lista de listas de numeros (u NA->None) en el orden en que aparecen."""
    out = []
    for ln in lines:
        m = LABEL.match(ln)
        if not m or re.search(r"[A-Za-z]", m.group(2).replace("NA", "")): continue   # las lineas de eje de graficos llevan texto
        toks = re.findall(r"(?<![\w.])" + NUM + r"(?![\w.])", m.group(2))
        out.append([num(t) for t in toks])
    return out
def to_classes(rows, width, tag):
    if len(rows) != len(CLASSES): raise ValueError("%s: %d filas de clase en vez de %d" % (tag, len(rows), len(CLASSES)))
    out = {}
    for k, r in zip(CLASSES, rows):
        if len(r) < width: raise ValueError("%s %s: faltan columnas (%r)" % (tag, k, r))
        trio = r[:3]
        out[k] = trio if all(x is not None for x in trio) else None
    return out
def parse_report(text):
    """Texto de pdftotext -layout -> {date, head{mart:n}, weekTotal, ytd{year:n}, summary{clase:[min,max,media]}, marts{mart:{date,rows}}}"""
    lines = text.splitlines()
    m = re.search(r"^\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})\s*$", "\n".join(lines[:6]), re.M)
    if not m: raise ValueError("sin fecha del informe")
    date = datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date().isoformat()
    # cabezas
    head = {}; wk = None; ytd = {}
    for ln in lines[:60]:
        for mart in MARTS:
            mm = re.match(r"^\s*%s\s+([\d,]+)\b" % re.escape(mart), ln)
            if mm and mart not in head: head[mart] = int(mm.group(1).replace(",", ""))
        w = re.search(r"Week total sold:\s*([\d,]+)", ln)
        if w: wk = int(w.group(1).replace(",", ""))
        y = re.search(r"(\d{4}) Year-to-day total sold:\s*([\d,]+)", ln)
        if y: ytd[y.group(1)] = int(y.group(2).replace(",", ""))
    if set(head) != set(MARTS) or wk is None or len(ytd) != 2: raise ValueError("tabla de cabezas incompleta")
    # secciones
    idx_sum = next((i for i, l in enumerate(lines) if "Auction Markets Summary" in l), None)
    idx_marts = [(i, MART_HEAD.match(l)) for i, l in enumerate(lines) if MART_HEAD.match(l)]
    idx_end = next((i for i, l in enumerate(lines) if re.match(r"^\s*Sheep and Goat\b", l)), len(lines))
    if idx_sum is None or len(idx_marts) != len(MARTS): raise ValueError("secciones no encontradas (resumen %s, subastas %d)" % (idx_sum, len(idx_marts)))
    summary = to_classes(rows_in(lines[idx_sum:idx_marts[0][0]]), 3, "resumen")
    marts = {}
    for n, (i, mm) in enumerate(idx_marts):
        j = idx_marts[n + 1][0] if n + 1 < len(idx_marts) else idx_end
        mart, sd = mm.group(1), mm.group(2)
        cl = to_classes(rows_in(lines[i + 1:j]), 5, mart)
        marts[mart] = {"date": None if sd.lower() == "no sale" else sd, "rows": cl}
        if sd.lower() == "no sale" and any(v for v in cl.values()): raise ValueError("%s: «No sale» con precios" % mart)
    return {"date": date, "head": head, "weekTotal": wk, "ytd": ytd, "summary": summary, "marts": marts}

def check_report(r):
    if sum(r["head"].values()) != r["weekTotal"]: raise ValueError("las cabezas por subasta suman %d y el total publicado es %d" % (sum(r["head"].values()), r["weekTotal"]))
    def ok(t, tag):
        lo, hi, av = t
        if not (lo <= av <= hi): raise ValueError("%s: minimo/media/maximo incoherentes %r" % (tag, t))
        if not (40 <= av <= 1500): raise ValueError("%s: precio fuera de rango %r" % (tag, t))
    for k, t in r["summary"].items():
        if t: ok(t, "resumen " + k)
    for mart, d in r["marts"].items():
        for k, t in d["rows"].items():
            if t: ok(t, mart + " " + k)
        if d["date"]:
            dd = datetime.date.fromisoformat(d["date"]); rd = datetime.date.fromisoformat(r["date"])
            if not (0 <= (rd - dd).days <= 7): raise ValueError("%s: fecha de venta %s fuera de la semana del informe %s" % (mart, d["date"], r["date"]))
        elif any(d["rows"].values()): raise ValueError(mart + ": sin venta pero con precios")
    return r

def compact(r):
    return {"head": r["head"], "weekTotal": r["weekTotal"], "ytd": r["ytd"], "summary": [r["summary"][k] for k in CLASSES],
            "marts": {m: {"date": d["date"], "rows": [d["rows"][k] for k in CLASSES]} for m, d in r["marts"].items()}}

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

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "mb-markets")); ap.add_argument("--text", nargs="*", default=None)
    a = ap.parse_args(); out = Path(a.out); f = out / "cattle.json"
    prev = {}
    if f.exists():
        try: prev = json.loads(f.read_text(encoding="utf-8"))
        except Exception: prev = {}
    weeks = dict(prev.get("weeks", {})); errors = []; got = 0
    reports = []   # (clave, texto)
    if a.text is not None:
        reports = [("local", Path(p).read_text(encoding="utf-8")) for p in a.text]
    else:
        html = http(PAGE).decode("utf-8", "replace")
        links = sorted(set(re.findall(r'href="([^"]*cattle-sheep-goat-prices-\d{4}-\d{2}-\d{2}\.pdf)"', html)))
        if not links: raise SystemExit("la pagina no enlaza informes semanales: no se toca nada")
        for h in links:
            try: reports.append((h.rsplit("/", 1)[-1], pdf_text(http(h if h.startswith("http") else BASE + h))))
            except Exception as e: errors.append("%s: %s" % (h.rsplit("/", 1)[-1], str(e)[:160])); log("ERROR descarga", errors[-1])
    for key, txt in reports:
        try:
            r = check_report(parse_report(txt))
            nm = re.search(r"prices-(\d{4}-\d{2}-\d{2})", key)
            if nm and nm.group(1) != r["date"]: raise ValueError("la fecha del informe (%s) no coincide con la del enlace (%s)" % (r["date"], nm.group(1)))
        except Exception as e:
            errors.append("%s: %s" % (key, e)); log("SEMANA DESCARTADA", errors[-1]); continue
        c = compact(r)
        if r["date"] in weeks and weeks[r["date"]] != c: log("revision de una semana ya publicada:", r["date"])
        weeks[r["date"]] = c; got += 1
    if not weeks: raise SystemExit("ninguna semana valida: no se toca nada")
    keep = sorted(weeks)[-RETAIN_WEEKS:]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "mb_agri", "name": "Manitoba Agriculture - Cattle, Sheep and Goat Prices (subastas de Manitoba)", "url": PAGE},
           "unit": "C$/cwt", "classes": CLASSES, "marts": MARTS, "weeks": {k: weeks[k] for k in keep}}
    old = {k: v for k, v in prev.items() if k != "generatedAt"}; new = {k: v for k, v in doc.items() if k != "generatedAt"}
    if old != new:
        out.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"); log("escrito", f.name, len(keep), "semanas;", got, "leidas")
    else: log("sin cambios;", got, "informes leidos")
    return 1 if errors and got == 0 else 0

if __name__ == "__main__":
    try: rc = main()
    finally:
        try:
            if "--text" not in sys.argv and "--out" not in sys.argv: (ROOT / "data" / "mb-markets-log.txt").write_text("\n".join(LOG[-100:]) + "\n", encoding="utf-8")
        except Exception: pass
    sys.exit(rc)

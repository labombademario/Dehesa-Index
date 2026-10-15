#!/usr/bin/env python3
"""España: Cuentas Económicas de la Agricultura / renta agraria (MAPA) -> data/spain-income/cea.json
Fuente: libros Excel de la página «cuentas-economicas-agricultura» del MAPA. Nacional 1990-último año (valores corrientes a precios básicos, millones de €)
y cuentas regionales por comunidad autónoma de cada año publicado (solo los libros resumen, no los «detallados»).
Cada fila se identifica por su etiqueta tal como la publica el MAPA; nada se calcula ni se estima. Años recientes: avance/estimación del propio MAPA."""
import argparse, datetime, html, io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/cuentas-economicas-agricultura"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, tries=3, timeout=240):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))
def page_files(htm):
    out = []; seen = set()
    for h in re.findall(r'href="([^"#]+\.xlsx?)"', htm, re.I):
        u = urllib.parse.urljoin(PAGE, html.unescape(h)); n = urllib.parse.unquote(u.split("/")[-1])
        if u not in seen: seen.add(u); out.append((u, n))
    return out
def clean(s): return re.sub(r"\s+", " ", str(s or "")).strip()
def level(lbl):
    raw = str(lbl)
    if re.match(r"^\s*[A-G][\.\s=-]", raw) and not raw.startswith("   "): return 0
    if raw.strip().isupper(): return 1
    return 2 if re.match(r"^\s+\d+\s", raw) or re.match(r"^\s*\d+\s", raw) else 1
def rnd(v): return None if isinstance(v, bool) or not isinstance(v, (int, float)) else round(float(v), 2)
def rows_of(data):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    return [list(r) for r in wb.worksheets[0].iter_rows(values_only=True)]
def parse_national(data):
    rows = rows_of(data)
    hi = next(i for i, r in enumerate(rows) if sum(1 for c in r[1:] if isinstance(c, (int, float)) and 1980 < c < 2100) >= 10)
    yc = {j: int(c) for j, c in enumerate(rows[hi]) if isinstance(c, (int, float)) and 1980 < c < 2100}
    items = []
    for r in rows[hi + 1:]:
        if not r or not r[0] or not any(isinstance(r[j], (int, float)) for j in yc if j < len(r)): continue
        lbl = clean(r[0]); items.append({"label": lbl, "level": level(r[0]), "v": [rnd(r[j]) if j < len(r) else None for j in sorted(yc)]})
    return [yc[j] for j in sorted(yc)], items
def parse_regional(data):
    rows = rows_of(data)
    hi = next(i for i, r in enumerate(rows) if sum(1 for c in r[1:] if isinstance(c, str) and c.strip()) >= 10)
    cc = {j: clean(c) for j, c in enumerate(rows[hi]) if j > 0 and isinstance(c, str) and c.strip()}
    items = []
    for r in rows[hi + 1:]:
        if not r or not r[0]:
            if items: break
            continue
        if not any(isinstance(r[j], (int, float)) for j in cc if j < len(r)): continue
        items.append({"label": clean(r[0]), "level": level(r[0]), "v": [rnd(r[j]) if j < len(r) else None for j in cc]})
        if re.match(r"^G\b", clean(r[0])): break
    return list(cc.values()), items
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "spain-income")); ap.add_argument("--local", action="append", default=[], help="nac|reg:año:ruta")
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    nat = []; reg = {}
    if a.local:
        for s in a.local:
            k, y, p = s.split(":", 2); (nat.append((p, p)) if k == "nac" else reg.setdefault(int(y), []).append((p, p)))
    else:
        for u, n in page_files(http(PAGE).decode("utf-8", "replace")):
            l = n.lower()
            if "detall" in l: continue
            if "resultados-nacionales" in l and "1990" in l: nat.append((u, n))
            elif re.search(r"resultados-?regionales", l):
                m = re.search(r"(20\d\d)", l)
                if m: reg.setdefault(int(m.group(1)), []).append((u, n))
    if not nat: raise SystemExit("no hay libro nacional: no se toca nada")
    u, n = nat[0]; years, items = parse_national(Path(u).read_bytes() if a.local else http(u)); log("nacional", n, years[0], years[-1], len(items), "filas")
    regions = {}; files = [{"file": n, "kind": "national"}]
    for y in sorted(reg):
        u, n = reg[y][0]
        try: names, it = parse_regional(Path(u).read_bytes() if a.local else http(u))
        except Exception as e: log("ERROR regional", y, n, str(e)[:100]); continue
        regions[str(y)] = {"regions": names, "items": it}; files.append({"file": n, "kind": "regional", "year": y}); log("regional", y, len(names), "territorios", len(it), "filas")
    doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, Cuentas Económicas de la Agricultura", "url": PAGE}, "unit": "millones de euros, valores corrientes a precios básicos",
           "years": years, "national": items, "regional": regions, "files": files,
           "note": "Los últimos años nacionales son avance o estimación del MAPA y se revisan. Las cuentas regionales llegan hasta el último año publicado por comunidades."}
    (out / "cea.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (ROOT / "data" / "spain-income-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

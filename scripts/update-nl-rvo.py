#!/usr/bin/env python3
"""Paises Bajos: precios semanales del cerdo y del vacuno y sacrificios semanales de cerdo, de RVO (Rijksdienst voor Ondernemend Nederland) -> data/netherlands-markets.json
RVO publica Excel con nombre fechado (tm-week-NN); la direccion se descubre en las paginas de estadisticas de rvo.nl. Se guarda tal cual lo publica RVO:
referencia vleesvarkens (EUR/100 kg, sin IVA), biggen (EUR/pieza), vacuno (EUR/kg canal, sin IVA), sacrificios de cerdo (cabezas/semana, peso, % carne, clases SEUROP en %).
Falla entero si falta un bloque esencial. Modo sin red: RVO_FIXTURES=<carpeta con pig_price.xlsx, cattle_price.xlsx, pig_slaughter.xlsx>."""
import datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.rvo.nl"
PAGES = ["/onderwerpen/marktinformatie/statistieken"]
FILES = {"pig_price": r"Prijswaarneming-vleesvarkens", "cattle_price": r"Prijswaarneming-runderen", "pig_slaughter": r"Varkensslachtingen"}
LOG = []; FIX = os.environ.get("RVO_FIXTURES")
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}), timeout=120) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s: %s" % (url, str(last)[:160]))
def discover():
    found = {}
    pages = list(PAGES); seen = set()
    while pages:
        p = pages.pop(0)
        if p in seen: continue
        seen.add(p)
        try: html = http(BASE + p).decode("utf-8", "replace")
        except Exception as e: log("pagina no disponible", p, str(e)[:80]); continue
        for m in re.finditer(r'href="(/sites/default/files/[^"]+?\.xlsx)"', html):
            u = m.group(1)
            for k, pat in FILES.items():
                if re.search(pat, u, re.I) and k not in found: found[k] = u
        if len(seen) < 12:
            for m in re.finditer(r'href="(/onderwerpen/marktinformatie/statistieken/[a-z0-9-]+)"', html):
                if m.group(1) not in seen: pages.append(m.group(1))
    log("excel descubiertos:", json.dumps(found))
    return found
def load(key):
    import openpyxl
    if FIX: data = (Path(FIX) / (key + ".xlsx")).read_bytes()
    else: data = http(BASE + FOUND[key])
    return openpyxl.load_workbook(io.BytesIO(data), data_only=True)
def num(v):
    return round(float(v), 4) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
def sheets(wb):
    for ws in wb.worksheets:
        if re.fullmatch(r"\d{4}", ws.title.strip()): yield int(ws.title), list(ws.iter_rows(values_only=True))
def weekrows(rows):
    """Filas con semana entera en la primera columna que contiene 'Week' en la cabecera."""
    hdr = next((i for i, r in enumerate(rows) if any(isinstance(c, str) and c.strip().lower() == "week" for c in r)), None)
    if hdr is None: return None, None, []
    wc = [j for j, c in enumerate(rows[hdr]) if isinstance(c, str) and c.strip().lower() == "week"][0]
    out = []
    for r in rows[hdr + 1:]:
        w = r[wc] if wc < len(r) else None
        if isinstance(w, (int, float)) and not isinstance(w, bool) and 1 <= int(w) <= 53 and int(w) == w: out.append((int(w), r))
    return hdr, wc, out
def wk(y, w): return "%d-W%02d" % (y, w)
def pig_price():
    out = {"pigs": {}, "piglets": {}}
    for y, rows in sheets(load("pig_price")):
        hdr, wc, wr = weekrows(rows)
        for w, r in wr:
            a = num(r[wc + 1]) if wc + 1 < len(r) else None; b = num(r[wc + 2]) if wc + 2 < len(r) else None
            if a is not None: out["pigs"].setdefault(wk(y, w), a)
            if b is not None: out["piglets"].setdefault(wk(y, w), b)
    log("precio cerdo", len(out["pigs"]), "semanas;", len(out["piglets"]), "lechones")
    return {k: sorted([[p, v] for p, v in d.items()]) for k, d in out.items()}
def cattle_price():
    out = {}; labels = {}
    for y, rows in sheets(load("cattle_price")):
        hdr, wc, wr = weekrows(rows)
        if hdr is None: continue
        cat = rows[hdr - 1]; cls = rows[hdr]; cur = None; cols = {}
        for j in range(wc + 1, len(cls)):
            if j < len(cat) and isinstance(cat[j], str) and cat[j].strip(): cur = cat[j].strip()
            if isinstance(cls[j], str) and cls[j].strip() and cur:
                cols[j] = (cur, re.sub(r"\s+", "", cls[j]))
        for w, r in wr:
            for j, (c, k) in cols.items():
                v = num(r[j]) if j < len(r) else None
                if v is not None:
                    key = {"Stieren": "bulls", "Koeien": "cows", "Vaarzen": "heifers"}.get(c, c.lower()) + "_" + k
                    out.setdefault(key, {}).setdefault(wk(y, w), v); labels[key] = c + " " + k
    log("precio vacuno", len(out), "series")
    return {"labels": labels, "data": {k: sorted([[p, v] for p, v in d.items()]) for k, d in out.items()}}
def atypical(data):
    """Semanas en que un precio de vacuno cae por debajo de la mitad de la mediana de las 4 semanas vecinas a cada lado: RVO las publica asi; se conservan y se marcan, no se corrigen."""
    out = {}
    for k, s in data.items():
        v = [x[1] for x in s]; w = []
        for i, x in enumerate(s):
            nb = sorted(v[max(0, i - 4):i] + v[i + 1:i + 5])
            if len(nb) >= 4 and x[1] < 0.5 * nb[len(nb) // 2]: w.append(x[0])
        if w: out[k] = w
    return out
def pig_slaughter():
    out = {}
    for y, rows in sheets(load("pig_slaughter")):
        hdr, wc, wr = weekrows(rows)
        if hdr is None: continue
        head = [str(c).strip() if c is not None else "" for c in rows[hdr]]
        idx = {"heads": wc + 1, "weight": wc + 2, "lean": wc + 3}
        for g in "SEUROP":
            if g in head: idx["grade_" + g] = head.index(g)
        for w, r in wr:
            for k, j in idx.items():
                v = num(r[j]) if j < len(r) else None
                if v is not None: out.setdefault(k, {}).setdefault(wk(y, w), v)
    log("sacrificios cerdo", len(out.get("heads", {})), "semanas")
    return {k: sorted([[p, v] for p, v in d.items()]) for k, d in out.items()}
FOUND = {}
def build():
    global FOUND
    if not FIX:
        FOUND = discover(); miss = [k for k in FILES if k not in FOUND]
        if miss: raise RuntimeError("no se encontraron los Excel de RVO: " + ", ".join(miss))
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "NL",
           "source": {"id": "rvo", "name": "RVO (Netherlands Enterprise Agency), market statistics", "url": "https://www.rvo.nl/onderwerpen/marktinformatie/statistieken", "license": "RVO information is public and may be reused",
                      "files": {k: (BASE + v) for k, v in FOUND.items()}},
           "units": {"pigPrice": "EUR/100 kg excl. VAT (class E)", "pigletPrice": "EUR/piece excl. VAT", "cattlePrice": "EUR/kg carcass excl. VAT", "heads": "head/week", "weight": "kg", "lean": "% lean meat", "grade": "% of carcasses"}}
    doc["pigPrice"] = pig_price(); doc["cattlePrice"] = cattle_price(); doc["cattlePrice"]["atypical"] = atypical(doc["cattlePrice"]["data"]); doc["pigSlaughter"] = pig_slaughter()
    return doc
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True)
    try: doc = build()
    except Exception as e:
        import traceback
        log("FALLO:", type(e).__name__, str(e)[:300])
        if os.environ.get("GITHUB_ACTIONS"): print("::error title=nl-rvo::" + (" | ".join(LOG[-6:]) + " | " + traceback.format_exc()[-1500:])[:3500].replace("%", "%25").replace("\r", "").replace("\n", "%0A"), flush=True)
        (outdir / "netherlands-markets-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    if not (doc["pigPrice"]["pigs"] and doc["cattlePrice"]["data"] and doc["pigSlaughter"].get("heads")):
        log("FALLO: faltan bloques esenciales"); (outdir / "netherlands-markets-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")); (outdir / "netherlands-markets.json").write_text(s, encoding="utf-8")
    log("escrito netherlands-markets.json", len(s) // 1024, "KB"); (outdir / "netherlands-markets-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

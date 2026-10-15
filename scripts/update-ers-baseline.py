#!/usr/bin/env python3
"""Proyecciones agrarias a 10 anos de EE. UU. (USDA ERS, Agricultural Baseline Database; Interagency Agricultural Projections Committee).
Busca en la pagina del producto el ZIP mas reciente (la edicion temprana de noviembre sustituye a la de febrero sin tocar codigo), lee el CSV maquina-legible
(year_type,year,value,unit,attribute,commodity,commodity_type,year_of_projection) y escribe data/us-markets/baseline.json: una serie por commodity+atributo,
con los 12 anos que publica (1 de historia, el actual y 10 de proyeccion). Valores y unidades tal como los publica ERS; no se calcula nada. Si no puede
validar lo descargado, NO toca el JSON anterior."""
import csv, io, json, re, sys, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = "https://ers.usda.gov/data-products/agricultural-baseline-database"
KNOWN = ["https://ers.usda.gov/media/5014/usda-agricultural-baseline-projections-to-2035.zip?v=91724"]
OUT = ROOT / "data" / "us-markets" / "baseline.json"
LOGF = ROOT / "data" / "ers-baseline-log.txt"
UA = {"User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=180):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
def candidates():
    out = []
    try:
        h = get(PAGE, 60).decode("utf-8", "replace")
        for m in re.finditer(r'href="([^"]+\.zip[^"]*)"', h):
            u = m.group(1).replace("&amp;", "&")
            if u.startswith("/"): u = "https://ers.usda.gov" + u
            if re.search(r"baseline|projection", u, re.I) and u not in out: out.append(u)
        log("pagina:", len(out), "enlaces zip candidatos")
    except Exception as e: log("pagina no legible:", repr(e)[:120])
    for k in KNOWN:
        if k not in out: out.append(k)
    return out
def read_zip(raw):
    z = zipfile.ZipFile(io.BytesIO(raw)); best = None
    for i in z.infolist():
        if not i.filename.lower().endswith(".csv"): continue
        t = z.read(i).decode("utf-8-sig", "replace").splitlines()
        if t and t[0].strip().lower().startswith("year_type,year,value,unit,attribute,commodity,commodity_type,year_of_projection"):
            best = (i.filename, t)
    readme = ""
    for i in z.infolist():
        if i.filename.lower().endswith(".txt"):
            m = re.search(r"Updated\s+([0-9/]+)", z.read(i).decode("utf-8", "replace"))
            if m: readme = m.group(1)
    return best, readme
def parse(t):
    ser = {}; order = []; ed = set()
    for r in csv.DictReader(t):
        try: v = float(r["value"])
        except Exception: continue
        k = (r["commodity_type"], r["commodity"], r["attribute"], r["unit"], r["year_type"]); ed.add(r["year_of_projection"])
        if k not in ser: ser[k] = {}; order.append(k)
        ser[k][r["year"]] = v
    return ser, order, ed
def main():
    ok = None
    for u in candidates():
        try:
            raw = get(u); best, readme = read_zip(raw)
            if not best: log("sin CSV valido en", u[:100]); continue
            ser, order, ed = parse(best[1])
            if len(ser) < 150: log("pocas series", len(ser), u[:100]); continue
            ed_y = max(ed); log("candidato", u[:110], "edicion", ed_y, "series", len(ser), "readme", readme)
            if ok is None or (ed_y, readme[-2:], len(raw)) > (ok[0], ok[1], ok[2]): ok = (ed_y, readme[-2:], len(raw), u, best[0], ser, order, readme)
        except Exception as e: log("error", u[:100], repr(e)[:150])
    if not ok: log("sin edicion valida: se conserva el JSON anterior"); return 1
    ed_y, _, _, url, fn, ser, order, readme = ok
    yrs = sorted({y for s in ser.values() for y in s})
    out = {"schemaVersion": 1, "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sourceId": "usda_ers", "edition": ed_y,
           "readmeUpdated": readme, "file": fn, "zipUrl": url.split("?")[0], "pageUrl": PAGE,
           "series": [{"type": k[0], "commodity": k[1], "attribute": k[2], "unit": k[3], "yearType": k[4], "years": sorted(ser[k]), "values": [ser[k][y] for y in sorted(ser[k])]} for k in order]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("escrito", OUT.name, len(out["series"]), "series; edicion", ed_y, "; anos", yrs[0], "a", yrs[-1], "; origen", url[:110])
    return 0
if __name__ == "__main__":
    try: rc = main()
    except Exception as e: log("error", repr(e)[:300]); rc = 1
    LOGF.write_text("\n".join(LOG) + "\n", encoding="utf-8"); sys.exit(rc)

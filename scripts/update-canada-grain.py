#!/usr/bin/env python3
"""Canadian Grain Commission, Grain Statistics Weekly -> data/canada-grain.json.
CSV abiertos (Open Government Licence - Canada), uno por campana (1 ago - 31 jul):
https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/<AAAA-AA>/gsw-shg-en.csv
Por semana (termina en domingo) y grano, en miles de toneladas:
  exports    exportaciones por terminales portuarias (hoja "Terminal Exports", periodo "Current Week"); NO incluye lo que sale por carretera o ferrocarril directo a EE. UU.
  cumExports lo mismo acumulado en la campana (periodo "Crop Year"), tal como lo publica la CGC (sirve para contrastar la suma de semanas)
  deliveries entregas de productores a elevadores primarios (hoja "Primary", metrica "Deliveries")
  stocks     existencias comerciales: elevadores primarios y de proceso, terminales y puertos (hoja "Summary", metrica "Stocks")
Si una fila trae "All grades combined" se usa esa; si no, se suman los grados (asi no se cuenta dos veces).
Se guardan las 3 ultimas campanas. Solo cifras publicadas; si la descarga o el formato fallan, el fichero anterior se conserva.
Uso: python3 scripts/update-canada-grain.py [--fixture AAAA-AA=ruta.csv[.gz] ...] [--out ruta]"""
import csv, datetime, gzip, io, json, sys, time, urllib.request
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "canada-grain.json"
URL = "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/%s/gsw-shg-en.csv"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
# grano de la CGC -> (id, nombre en ingles)
GRAINS = {"Wheat": ("wheat", "Wheat (excluding durum)"), "Amber Durum": ("durum", "Amber durum"), "Barley": ("barley", "Barley"), "Canola": ("canola", "Canola"),
          "Oats": ("oats", "Oats"), "Peas": ("peas", "Peas"), "Lentils": ("lentils", "Lentils"), "Flaxseed": ("flaxseed", "Flaxseed"), "Soybeans": ("soybeans", "Soybeans"),
          "Corn": ("corn", "Corn"), "Rye": ("rye", "Rye"), "Chick Peas": ("chickpeas", "Chickpeas")}
PROVINCES = {"Manitoba", "Saskatchewan", "Alberta", "British Columbia"}
KEEP_YEARS = 3
def iso(s):
    d, m, y = s.split("/"); return datetime.date(int(y), int(m), int(d)).isoformat()
def crop_years(today=None):
    t = today or datetime.date.today(); start = t.year if t.month >= 8 else t.year - 1
    return ["%d-%02d" % (y, (y + 1) % 100) for y in range(start, start - KEEP_YEARS, -1)]
def total(rows, worksheet, metric, period, regions=None):
    """Suma por (grano, fecha) de todas las regiones; por region usa 'All grades combined' si existe, si no suma los grados."""
    cell = defaultdict(lambda: {"all": None, "sum": 0.0})
    for r in rows:
        if r["worksheet"] != worksheet or r["metric"] != metric or r["period"] != period or r["grain"] not in GRAINS: continue
        if r["Ktonnes"] in ("", None): continue
        if regions and r["Region"] not in regions: continue
        k = (r["grain"], iso(r["Week Ending Date"]), r["Region"]); v = float(r["Ktonnes"])
        if r["grade"] == "All grades combined": cell[k]["all"] = (cell[k]["all"] or 0.0) + v
        else: cell[k]["sum"] += v
    out = defaultdict(float)
    for (g, d, _), c in cell.items(): out[(g, d)] += c["all"] if c["all"] is not None else c["sum"]
    return out
def build(files):
    """files = {'2026-27': filas del CSV (lista de dict), ...}. Devuelve (semanas, granos)."""
    rows = [r for fy in sorted(files) for r in files[fy]]
    ex = total(rows, "Terminal Exports", "Exports", "Current Week"); cum = total(rows, "Terminal Exports", "Exports", "Crop Year")
    dl = total(rows, "Primary", "Deliveries", "Current Week", PROVINCES); st = total(rows, "Summary", "Stocks", "Current Week")
    weeks = sorted({d for (_, d) in list(ex) + list(dl) + list(st)})
    if len(weeks) < 4: raise ValueError("menos de 4 semanas")
    grains = []
    for name, (gid, label) in GRAINS.items():
        cols = {}
        for key, src in (("exports", ex), ("cumExports", cum), ("deliveries", dl), ("stocks", st)):
            cols[key] = [round(src[(name, w)], 1) if (name, w) in src else None for w in weeks]
        if not any(v is not None for v in cols["exports"] + cols["deliveries"] + cols["stocks"]): continue
        grains.append(dict(id=gid, name=label, **cols))
    if not grains: raise ValueError("sin granos")
    return weeks, grains
def fetch(fy):
    last = None
    for i in range(4):
        try:
            req = urllib.request.Request(URL % fy, headers=H)
            with urllib.request.urlopen(req, timeout=180) as r: return r.read().decode("utf-8", "replace")
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %r" % (fy, last))
def rows_of(text): return list(csv.DictReader(io.StringIO(text)))
def main():
    args = sys.argv[1:]; outp = OUT; fx = {}
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1]); del args[i:i + 2]
    while "--fixture" in args:
        i = args.index("--fixture"); k, p = args[i + 1].split("=", 1); del args[i:i + 2]
        raw = Path(p).read_bytes(); fx[k] = (gzip.decompress(raw) if p.endswith(".gz") else raw).decode("utf-8")
    try:
        files = {}
        if fx: files = {k: rows_of(v) for k, v in fx.items()}
        else:
            for fy in crop_years():
                try: files[fy] = rows_of(fetch(fy)); print("campana", fy, len(files[fy]), "filas")
                except Exception as e: print("AVISO sin campana", fy, e)
        weeks, grains = build(files)
    except Exception as e: print("FALLO:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Canadian Grain Commission, Grain Statistics Weekly", "url": "https://www.grainscanada.gc.ca/en/grain-research/statistics/grain-statistics-weekly/", "license": "Open Government Licence - Canada"},
           "unit": "thousand tonnes", "asOf": weeks[-1], "weeks": weeks, "grains": grains,
           "note": "Exports are shipments through licensed port terminals (not direct rail or truck shipments to the United States). Stocks are commercial stocks in primary, process and terminal elevators. The CGC revises recent weeks."}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(weeks), "semanas,", len(grains), "granos, ultima", weeks[-1]); return 0
if __name__ == "__main__": sys.exit(main())

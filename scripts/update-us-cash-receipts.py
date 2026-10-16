#!/usr/bin/env python3
"""EE. UU.: ingresos en efectivo por producto y estado (USDA ERS, Farm Income and Wealth Statistics) -> data/us-cash-receipts.json
Obra del Gobierno federal de EE. UU. (dominio publico). Mismo fichero de ERS que ya usa update-us-states.py (totales por estado); aqui se guardan los productos.
- Variables «Cash receipts value, <producto>, all» (miles de USD corrientes), solo productos de un nivel; se excluyen los agregados de ERS (todos los
  productos, cultivos, ganado y productos, ganado para carne, aves y huevos, cultivos forrajeros, cereales para alimentacion, oleaginosas, frutas y frutos secos,
  hortalizas) y los componentes del algodon (fibra y semilla), que ya estan en «cotton».
- Por estado: los 12 productos con mayor ingreso en el ultimo ano publicado y los ultimos 6 anos. Nada se estima; un hueco es un hueco (null).
- ERS publica el total nacional del ano en curso como prevision; por estado se usa el ultimo ano con dato en casi todos los estados.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-us-cash-receipts.py"""
import csv, datetime, io, json, re, sys, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-cash-receipts.json"
PAGE = "https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-u-s-and-state-level-farm-income-and-wealth-statistics"
H = {"User-Agent": "Mozilla/5.0 dehesaindex"}
AGG = {"all commodities", "crops", "livestock and products", "meat animals", "poultry/eggs", "feed crops", "food grains", "oil crops", "fruits/nuts", "cotton lint", "cottonseed"}
NYEARS, TOP = 6, 12
def norm(d): return re.sub(r"\s+", " ", re.sub(r"\s+,", ",", d or "")).strip().lower()
def main():
    try:
        page = urllib.request.urlopen(urllib.request.Request(PAGE, headers=H), timeout=120).read().decode("utf-8", "replace")
        rel = []
        for href in set(re.findall(r'href="([^"]+-release[^"]*\.zip)"', page)):
            m = re.search(r"/([a-z]+)-(\d{1,2})-(\d{4})-release", href)
            if m:
                try: rel.append((datetime.datetime.strptime("%s %s %s" % m.groups(), "%B %d %Y").date(), href))
                except ValueError: pass
        if not rel: print("FALLO: sin ficheros de publicacion"); return 0 if OUT.exists() else 1
        d, href = max(rel); url = urllib.parse.urljoin(PAGE, href)
        try:
            if json.loads(OUT.read_text()).get("release") == d.isoformat(): print("sin cambios: edicion", d); return 0
        except Exception: pass
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300).read()))
        name = next(n for n in z.namelist() if n.lower().endswith(".csv"))
        rd = csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig", errors="replace"))
        V = {}  # (estado, producto) -> {anio: valor}
        total = {}
        for r in rd:
            desc = norm(r.get("VariableDescriptionTotal"))
            m = re.match(r"^cash receipts value, ([^,]+), all$", desc)
            if not m: continue
            prod, st, y = m.group(1), (r.get("State") or "").strip(), str(r.get("Year") or "")
            if not re.match(r"^\d{4}$", y) or len(st) != 2: continue
            try: v = float(str(r.get("Amount")).replace(",", ""))
            except ValueError: continue
            if prod == "all commodities": total.setdefault(st, {})[y] = v; continue
            if prod in AGG or prod.startswith("vegetables"): continue
            V.setdefault((st, prod), {})[y] = v
    except Exception as e:
        print("FALLO:", repr(e)[:200]); return 0 if OUT.exists() else 1
    cnt = {}
    for t in total.values():
        for y in t: cnt[y] = cnt.get(y, 0) + 1
    last = max((y for y, n in cnt.items() if n >= 40), default=None)   # ultimo ano con dato en (casi) todos los estados: ERS solo preve el total nacional
    if not last or len(total) < 40: print("FALLO: pocos estados con total (%d)" % len(total)); return 0 if OUT.exists() else 1
    years = [str(y) for y in range(int(last) - NYEARS + 1, int(last) + 1)]
    S = {}
    for st in sorted(total):
        rows = [(p, [v.get(y) for y in years]) for (s, p), v in V.items() if s == st and v.get(last) is not None and v[last] > 0]
        rows.sort(key=lambda x: -x[1][-1])
        top = rows[:TOP]
        if top: S[st] = {"total": [total[st].get(y) for y in years], "items": [[p, vals] for p, vals in top]}
    if len(S) < 40: print("FALLO: pocos estados (%d)" % len(S)); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "release": d.isoformat(), "unit": "USD thousand", "years": years, "lastYear": last,
           "source": {"name": "USDA ERS, Farm Income and Wealth Statistics", "url": PAGE, "license": "Obra del Gobierno federal de EE. UU. (dominio publico)"}, "states": S}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("us-cash-receipts.json: edicion %s, %d estados, anos %s-%s" % (d, len(S), years[0], years[-1]), {k: S[k]["items"][0] for k in ("US", "IA", "CA") if k in S})
    return 0
if __name__ == "__main__": sys.exit(main())

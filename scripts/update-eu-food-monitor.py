#!/usr/bin/env python3
"""Monitor de precios de alimentos de Eurostat (prc_fpmt_m) -> data/eu-food-monitor/<GEO>.json + index.json + data/eu-food-monitor-stats.json (solo el agregado UE-27).
41 productos (COICOP 2018) x 4 indices a lo largo de la cadena: precio agrario (ACPI), precio de produccion (PPI), precio de importacion (IPI) y precio al consumo (IPCA/HICP).
Indice base 2025 = 100, mensual desde 1995. Solo se guarda el indice (unidad I25): las tasas de variacion las calcula la web a partir de el. Un hueco es un hueco.
Uso: python3 scripts/update-eu-food-monitor.py [--local DIR] [--out DIR]   (--local: DIR/fpmt_<GEO>.json[.gz]; solo pruebas)"""
import gzip, json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import usda_lib as U

API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_fpmt_m"
GEOS = ["EU27_2020", "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE", "IS", "NO", "CH", "UK", "ME", "MK", "GE", "AL", "RS", "TR", "UA", "XK"]
INDX = ["ACPI", "PPI", "IPI", "HICP"]

def fetch(geo):
    if U.LOCAL is not None:
        for n in ("fpmt_%s.json" % geo, "fpmt_%s.json.gz" % geo):
            p = U.LOCAL / n
            if p.exists(): return json.loads((gzip.decompress(p.read_bytes()) if n.endswith(".gz") else p.read_bytes()).decode("utf-8"))
        return None
    try: return json.loads(U.get("%s?geo=%s&unit=I25&lang=EN" % (API, geo), timeout=240, accept="*/*").decode("utf-8"))
    except Exception as e: U.log("sin datos de %s: %s" % (geo, e)); return None

def cats(j, d):
    c = j["dimension"][d]["category"]; idx = c["index"]; o = [None] * len(idx)
    if isinstance(idx, dict):
        for k, v in idx.items(): o[v] = k
    else: o = list(idx)
    return o, c.get("label", {})

def parse(j):
    ids, size = j["id"], j["size"]; cs = {d: cats(j, d) for d in ids}
    t = cs["time"][0]; tn = len(t); vals = j.get("value", {}); st = j.get("status", {}) or {}
    if isinstance(vals, list): vals = {str(i): v for i, v in enumerate(vals) if v is not None}
    rows = {}
    for k, v in vals.items():
        k0 = int(k); rec = {}; kk = k0
        for d, n in reversed(list(zip(ids, size))): rec[d] = cs[d][0][kk % n]; kk //= n
        if rec.get("unit") != "I25" or v is None: continue
        pos = cs["time"][0].index(rec["time"]); r = rows.setdefault((rec["coicop18"], rec["indx"]), [None] * tn); r[pos] = v
        if st.get(k) in ("p", "e"): rows.setdefault(("flag", rec["coicop18"], rec["indx"]), {})[pos] = st[k]
    return t, rows, cs["coicop18"][1], cs["indx"][1]

def main():
    local, out = U.parse_args(); out = (out or (U.ROOT / "data")) / "eu-food-monitor"; out.mkdir(parents=True, exist_ok=True)
    geos = {}; prods = {}; stat_series = []; upd = None
    for g in GEOS:
        j = fetch(g)
        if not j: continue
        upd = upd or j.get("updated")
        t, rows, plab, ilab = parse(j)
        for c, l in plab.items(): prods.setdefault(c, l)
        ser = []; lastm = ""
        for (c, i), arr in sorted((k, v) for k, v in rows.items() if k[0] != "flag"):
            nz = [n for n, x in enumerate(arr) if x is not None]
            if len(nz) < 12 or i not in INDX: continue
            a, b = nz[0], nz[-1]; s = {"p": c, "i": i, "s": t[a], "v": [None if x is None else round(x, 2) for x in arr[a:b + 1]]}
            fl = rows.get(("flag", c, i), {}).get(b)
            if fl: s["f"] = fl
            ser.append(s); lastm = max(lastm, t[b])
            if g == "EU27_2020": stat_series.append(U.mk_series("eu-fpm-%s-%s" % (i.lower(), c.lower()), "prices", "Food price monitor: %s, %s (Eurostat prc_fpmt_m, index 2025=100)" % (plab.get(c, c), ilab.get(i, i)), "index 2025=100", "monthly", [(t[a + n], x) for n, x in enumerate(arr[a:b + 1]) if x is not None], "Eurostat prc_fpmt_m", min_points=12, max_age_years=2, note="Eurostat marks some of the latest values as provisional or estimated."))
        if ser:
            U.write_json(out / ("%s.json" % g), {"schemaVersion": 1, "geo": g, "base": "2025=100", "end": t[-1], "series": ser}); geos[g] = lastm
            U.log("%s: %d series, ultimo mes %s" % (g, len(ser), lastm))
        if U.LOCAL is None: time.sleep(1)
    if "EU27_2020" not in geos or len(geos) < (3 if U.LOCAL is not None else 20): raise SystemExit("solo %d zonas con datos (EU27_2020 obligatoria): no se escribe el indice" % len(geos))
    stat_series = [s for s in stat_series if s]
    U.write_json(out / "index.json", {"schemaVersion": 1, "source": "Eurostat prc_fpmt_m", "sourceUpdated": upd, "base": "2025=100", "generatedAt": U.now_iso(), "indices": [{"code": c, "label": l} for c, l in zip(INDX, ["Agricultural commodity price index", "Producer price index", "Import price index", "Harmonised index of consumer prices"])], "products": [{"code": c, "label": prods[c]} for c in sorted(prods)], "geos": [{"code": g, "last": geos[g]} for g in GEOS if g in geos]})
    src = {"name": "Eurostat, Food price monitoring tool (prc_fpmt_m)", "url": "https://ec.europa.eu/eurostat/databrowser/view/prc_fpmt_m/default/table", "license": "Eurostat reuse policy (Decision 2011/833/EU), CC BY 4.0"}
    U.write_json(out.parent / "eu-food-monitor-stats.json", {"schemaVersion": 1, "generatedAt": U.now_iso(), "countries": {"EU": {"name": "European Union", "extend": True, "source": src, "series": stat_series}}, "log": U.LOG[-40:]}); U.write_log(out.parent / "eu-food-monitor-log.txt")
    print("OK %d zonas, %d series UE-27" % (len(geos), len(stat_series)))

if __name__ == "__main__": main()

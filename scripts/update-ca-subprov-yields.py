#!/usr/bin/env python3
"""Canada: superficie sembrada y cosechada, rendimiento y produccion por region agraria pequeña (Small Area Data Regions, SADR) -> data/ca-sub/yields/<cultivo>.json + index.json
Fuente: Statistics Canada, tabla 32-10-0002 (Estimated areas, yield and production of principal field crops by Small Area Data Regions), descarga completa en CSV, sin clave.
81 areas: 6 provincias con detalle (QC, ON, MB, SK, AB, BC) y sus regiones; 20 cultivos, 1976-2025 donde existe. Unidades guardadas: hectareas, kg/ha y toneladas metricas
(son las que ya publica la tabla; no se convierte nada). Las celdas suprimidas (x, F, ..) no traen valor y quedan como hueco (null), nunca como cero.
Saskatchewan cambio de regiones en 2017 (de 20 regiones SADR a 17 que coinciden con las divisiones censales del Censo 2016): se guardan las dos series con su propio identificador.
Control: produccion = rendimiento x superficie cosechada dentro del 25 % + 100 t (la tabla redondea las superficies a centenas y los rendimientos a 100 kg/ha, y en las regiones pequeñas el redondeo pesa mucho); si mas del 2 % de las combinaciones no cuadran, no se escribe nada. Las cifras se copian sin corregir aunque alguna celda historica sea incoherente en la propia fuente.
Uso: update-ca-subprov-yields.py [--out DIR] [--fixture-dir DIR]   (fixture: 32100002.csv descomprimido, sin red)"""
import argparse, csv, datetime, io, json, re, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://www150.statcan.gc.ca/n1/tbl/csv/32100002-eng.zip"
PROV = {"Québec": "QC", "Ontario": "ON", "Manitoba": "MB", "Saskatchewan": "SK", "Alberta": "AB", "British Columbia": "BC"}
CROPS = {"Barley": "barley", "Corn for grain": "corn", "Oats": "oats", "Soybeans": "soybeans", "Wheat, all": "wheat-all", "Canary seed": "canary-seed", "Canola": "canola", "Flaxseed": "flaxseed",
         "Lentils": "lentils", "Mustard seed": "mustard-seed", "Peas, dry": "peas-dry", "Rye, fall remaining": "rye-fall", "Sunflower seed": "sunflower", "Wheat, durum": "wheat-durum",
         "Wheat, spring": "wheat-spring", "Wheat, winter remaining": "wheat-winter", "Chick peas": "chickpeas", "Rye, all": "rye-all", "Rye, spring": "rye-spring", "Triticale": "triticale"}
METRICS = {"Seeded area (hectares)": "seeded", "Harvested area (hectares)": "harvested", "Average yield (kilograms per hectare)": "yield", "Production (metric tonnes)": "production"}
UNITS = {"seeded": "ha", "harvested": "ha", "yield": "kg/ha", "production": "t"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def text(fixture):
    if fixture: return (Path(fixture) / "32100002.csv").read_text("utf-8-sig")
    last = None
    for i in range(3):
        try:
            z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=300).read()))
            return z.read([n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]).decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError(repr(last)[:140])
def region(geo):
    """-> (id, nombre, provincia, nivel) o None"""
    if geo in PROV: return PROV[geo], geo, PROV[geo], "PR"
    m = re.search(r"\s-\s([^-]+?)(?: \(corresponds.*)?$", geo)
    if not m or m.group(1).strip() not in PROV: return None
    p = PROV[m.group(1).strip()]; new = "(corresponds" in geo
    head = geo[:m.start()]
    n = re.search(r"(?:Region |, )(\d+)$", head)
    num = n.group(1) if n else None
    if head.startswith("Small Area Data Region"): label = "SADR " + (num or "")
    else:
        label = re.sub(r",\s*\d+$", "", head).strip()
        label = re.sub(r"\s*Region\s+\d+$", "", label).strip() or head
    cdm = re.search(r"Census Divisions? ([\d]+(?: and \d+)?)", geo)
    if new and cdm: label = label + " (= CD " + cdm.group(1) + ")"
    return "%s:%s%s" % (p, num or re.sub(r"\W+", "", label)[:12], "n" if new else ""), label, p, "SADR"
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture-dir"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "ca-sub" / "yields"
    rd = csv.reader(io.StringIO(text(a.fixture_dir))); h = next(rd)
    gi, di, ci, vi, ri = h.index("GEO"), h.index("Harvest disposition"), h.index("Type of crop"), h.index("VALUE"), h.index("REF_DATE")
    cells = {}; regs = {}; years = set()
    for row in rd:
        m = METRICS.get(row[di]); c = CROPS.get(row[ci])
        if not m or not c or row[vi].strip() == "": continue
        r = region(row[gi])
        if not r: continue
        try: v = float(row[vi])
        except ValueError: continue
        y = int(row[ri]); years.add(y); regs[r[0]] = r
        cells.setdefault(c, {}).setdefault(r[0], {}).setdefault(m, {})[y] = int(v) if v == int(v) else round(v, 1)
    ylist = list(range(min(years), max(years) + 1))
    if max(years) < datetime.date.today().year - 2 or len(cells) < 18 or len(regs) < 70: log("FALLO: cobertura insuficiente", len(cells), len(regs), max(years)); return 1
    bad = tot = 0
    for c, rs in cells.items():
        for rid, ms in rs.items():
            for y in ms.get("yield", {}):
                hv, pv = ms.get("harvested", {}).get(y), ms.get("production", {}).get(y)
                if hv and pv:
                    tot += 1
                    if abs(ms["yield"][y] * hv / 1000.0 - pv) > 0.25 * pv + 100: bad += 1
    log("control produccion = rendimiento x superficie: %d combinaciones, %d fuera de la tolerancia (25 %% + 100 t)" % (tot, bad))
    if tot and bad / tot > 0.02: log("FALLO: demasiadas combinaciones no cuadran"); return 1
    out.mkdir(parents=True, exist_ok=True); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "statcan", "url": "https://www150.statcan.gc.ca/n1/en/catalogue/32100002"}
    names = {v: k for k, v in CROPS.items()}
    for c, rs in sorted(cells.items()):
        regions = {}
        for rid, ms in sorted(rs.items()):
            _, label, p, lv = regs[rid]
            regions[rid] = {"n": label, "p": p, "l": lv, "v": {m: [ms[m].get(y) for y in ylist] for m in METRICS.values() if m in ms}}
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "crop": names[c], "slug": c, "units": UNITS, "years": ylist, "regions": regions}
        (out / (c + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "units": UNITS, "years": [ylist[0], ylist[-1]], "crops": {c: names[c] for c in sorted(cells)}, "regions": {k: {"n": v[1], "p": v[2], "l": v[3]} for k, v in sorted(regs.items())}}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d cultivos, %d areas, %d-%d" % (len(cells), len(regs), ylist[0], ylist[-1])); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "ca-subprov-yields-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

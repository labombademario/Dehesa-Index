#!/usr/bin/env python3
"""Canada: indice de vegetacion NDVI (1 km, satelite) por region agricola censal (CAR) y division censal (CD) -> data/ca-sub/ndvi/<PROV>.json + index.json
Fuente: Statistics Canada, tabla 32-10-0383 (NDVI at one kilometre resolution by land use type for agricultural areas of Canada, 2021 geographic boundaries), descarga completa en CSV,
sin clave. La tabla es semanal (abril-octubre, desde 1987); se guarda, por area y año, el maximo y la media de la temporada (abril-octubre) para 'Cropland' (tierra de cultivo) y
'Total agriculture'. Un año solo cuenta si tiene al menos 20 semanas de la temporada; los años incompletos se omiten, nunca se rellenan. Valores tal cual los publica la fuente (3 decimales).
La serie publicada llega hasta mayo de 2024 (la ultima publicacion de Statistics Canada); el script la relee y toma lo que haya.
Uso: update-ca-subprov-ndvi.py [--out DIR] [--fixture-dir DIR]   (fixture: 32100383.csv descomprimido, sin red)"""
import argparse, csv, datetime, io, json, re, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://www150.statcan.gc.ca/n1/tbl/csv/32100383-eng.zip"
PROV = {"10": "NL", "11": "PE", "12": "NS", "13": "NB", "24": "QC", "35": "ON", "46": "MB", "47": "SK", "48": "AB", "59": "BC"}
USES = {"Cropland": "crop", "Total agriculture": "all"}
LV = {"2021S0501": "CAR", "2021A0003": "CD"}
MIN_WEEKS = 20
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def open_csv(fixture):
    if fixture: return open(Path(fixture) / "32100383.csv", encoding="utf-8-sig", newline="")
    last = None
    for i in range(3):
        try:
            blob = urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=300).read()
            z = zipfile.ZipFile(io.BytesIO(blob)); n = [x for x in z.namelist() if x.endswith(".csv") and "MetaData" not in x][0]
            return io.TextIOWrapper(z.open(n), encoding="utf-8-sig", newline="")
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError(repr(last)[:140])
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture-dir"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "ca-sub" / "ndvi"
    rd = csv.reader(open_csv(a.fixture_dir)); h = next(rd)
    ri, gi, di, li, vi = h.index("REF_DATE"), h.index("GEO"), h.index("DGUID"), h.index("Land use"), h.index("VALUE")
    acc = {}; names = {}; rows = 0
    for row in rd:
        lv = LV.get(row[di][:9]); use = USES.get(row[li].strip())
        if not lv or not use or row[vi] == "": continue
        d = row[ri]; mo = int(d[5:7])
        if mo < 4 or mo > 10: continue
        m = re.search(r"\[(\d{4})\]$", row[gi])
        if not m or m.group(1)[:2] not in PROV: continue
        try: v = float(row[vi])
        except ValueError: continue
        if not (-0.3 <= v <= 1.0): continue
        code = m.group(1)
        names[code] = (lv, re.sub(r"\s+", " ", re.sub(r",\s*[^,]+\s*\[\d+\]$", "", row[gi])).strip())
        acc.setdefault((code, use, int(d[:4])), []).append(v); rows += 1
    log("filas leidas:", rows)
    years = sorted({k[2] for k in acc if len(acc[k]) >= MIN_WEEKS})
    if len(names) < 200 or len(years) < 30: log("FALLO: cobertura insuficiente", len(names), len(years)); return 1
    byp = {}
    for code, (lv, nm) in names.items():
        v = {}
        for use in ("crop", "all"):
            pk, mn = [], []
            for y in years:
                s = acc.get((code, use, y))
                if s and len(s) >= MIN_WEEKS: pk.append(round(max(s), 3)); mn.append(round(sum(s) / len(s), 3))
                else: pk.append(None); mn.append(None)
            if any(x is not None for x in pk): v[use + "_peak"] = pk; v[use + "_mean"] = mn
        if v: byp.setdefault(PROV[code[:2]], {})[code] = {"n": nm, "l": lv, "v": v}
    out.mkdir(parents=True, exist_ok=True); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "statcan", "url": "https://www150.statcan.gc.ca/n1/en/catalogue/32100383"}
    for p, d in sorted(byp.items()):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "province": p, "years": years, "seasonMonths": [4, 10], "minWeeks": MIN_WEEKS, "areas": dict(sorted(d.items()))}
        (out / (p + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "years": years, "lastYear": years[-1], "provinces": {p: len(d) for p, d in sorted(byp.items())}}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d provincias, %d areas, años %d-%d" % (len(byp), sum(len(d) for d in byp.values()), years[0], years[-1])); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "ca-subprov-ndvi-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

#!/usr/bin/env python3
"""Seguro de cosechas de Canadá por provincia (Statistics Canada, Open Licence) -> data/crop-insurance-ca.json
Dos tablas anuales de la WDS, sin clave:
  32-10-0045-01 Farm cash receipts: 'Crop insurance payments' (indemnizaciones cobradas por las explotaciones; sin el granizo privado desde 1992)
                                    y 'Private Hail Insurance' (solo MB, SK y AB; el resto es '..').
  32-10-0049-01 Farm operating expenses: 'Crop and hail insurance' (gasto de las explotaciones; NO es la prima total del programa).
Valores en miles de dólares canadienses tal como los publica StatCan (SCALAR_FACTOR = thousands). No se estima nada: un hueco es null."""
import csv, datetime, io, json, sys, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
WDS = "https://www150.statcan.gc.ca/t1/wds/rest/"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
FIRST_YEAR = 2000
GEOS = [("Canada", "CA"), ("Newfoundland and Labrador", "NL"), ("Prince Edward Island", "PE"), ("Nova Scotia", "NS"), ("New Brunswick", "NB"), ("Quebec", "QC"), ("Ontario", "ON"), ("Manitoba", "MB"), ("Saskatchewan", "SK"), ("Alberta", "AB"), ("British Columbia", "BC")]
GEO = dict(GEOS)
MEASURES = [("indemnities", 32100045, "Crop insurance payments"), ("hailIndemnities", 32100045, "Private Hail Insurance"), ("farmPremiums", 32100049, "Crop and hail insurance")]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch_resume(url, tries=8):
    """Descarga con reanudación (Range): StatCan corta a veces la conexión a mitad de fichero."""
    buf = b""
    for i in range(tries):
        h = dict(UA)
        if buf: h["Range"] = "bytes=%d-" % len(buf)
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=150)
            if buf and r.status != 206: buf = b""
            while True:
                c = r.read(65536)
                if not c: break
                buf += c
            return buf
        except Exception as e:
            log("corte en", len(buf) // 1024, "KB", repr(e)[:80]); time.sleep(3 * (i + 1))
    raise RuntimeError("descarga incompleta")
def fetch(pid, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(WDS + "getFullTableDownloadCSV/%d/en" % pid, headers=UA)
            info = json.loads(urllib.request.urlopen(req, timeout=90).read())
            raw = fetch_resume(info["object"])
            z = zipfile.ZipFile(io.BytesIO(raw)); name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
            rows = list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")))
            log("tabla", pid, len(rows), "filas", len(raw) // 1024, "KB"); return rows
        except Exception as e:
            last = e; log("intento", i + 1, "fallido:", repr(e)[:100]); time.sleep(8 * (i + 1))
    raise RuntimeError("%d: %r" % (pid, last)[:200])
def member_col(rows):
    if not rows: raise ValueError("tabla vacía")
    skip = {"REF_DATE", "GEO", "DGUID", "UOM", "UOM_ID", "SCALAR_FACTOR", "SCALAR_ID", "VECTOR", "COORDINATE", "VALUE", "STATUS", "SYMBOL", "TERMINATED", "DECIMALS"}
    return [c for c in rows[0] if c not in skip][0]
def build(tables, today=None):
    """tables: {pid: filas CSV}. Devuelve (documento, avisos). Lanza ValueError si los datos no son fiables."""
    today = today or datetime.date.today()
    raw = {m: {} for m, _, _ in MEASURES}; status = {}; prelim = set()
    for m, pid, member in MEASURES:
        rows = tables[pid]; mc = member_col(rows)
        for r in rows:
            if r[mc] != member or r["GEO"] not in GEO: continue
            try: y = int(r["REF_DATE"][:4])
            except ValueError: continue
            if y < FIRST_YEAR or r["VALUE"] in ("", None): continue
            if (r.get("SCALAR_FACTOR") or "").strip().lower() != "thousands": raise ValueError("%s: unidad inesperada %r" % (member, r.get("SCALAR_FACTOR")))
            v = float(r["VALUE"])
            if v != int(v): raise ValueError("%s %s: valor no entero %r" % (member, r["GEO"], r["VALUE"]))
            raw[m].setdefault(GEO[r["GEO"]], {})[y] = int(v)
            st = (r.get("STATUS") or "").strip()
            if st:
                status[st] = status.get(st, 0) + 1
                if st == "p" and r["GEO"] == "Canada" and m != "hailIndemnities": prelim.add(y)
    ca_ind, ca_pre = raw["indemnities"].get("CA", {}), raw["farmPremiums"].get("CA", {})
    years = sorted(set(ca_ind) & set(ca_pre))
    if not years or years[0] != FIRST_YEAR or years != list(range(years[0], years[-1] + 1)): raise ValueError("serie de Canadá incompleta o con huecos: %s" % years[:3])
    if years[-1] < today.year - 2: raise ValueError("último año %d demasiado antiguo" % years[-1])
    data = {}
    for g in [c for _, c in GEOS]:
        data[g] = {m: [raw[m].get(g, {}).get(y) for y in years] for m, _, _ in MEASURES}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "statcan", "name": "Statistics Canada, tables 32-10-0045-01 (Farm cash receipts) and 32-10-0049-01 (Farm operating expenses and depreciation charges)", "url": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210004501", "license": "Statistics Canada Open Licence"},
           "unit": "CAD thousand", "measures": [m for m, _, _ in MEASURES],
           "tables": {"indemnities": "32-10-0045-01 Crop insurance payments", "hailIndemnities": "32-10-0045-01 Private Hail Insurance", "farmPremiums": "32-10-0049-01 Crop and hail insurance"},
           "years": years, "latestYear": years[-1], "provisionalYears": sorted(y for y in prelim if y in years), "data": data}
    return doc, status
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    tables = {}
    try:
        for pid in (32100045, 32100049): tables[pid] = fetch(pid)
        doc, status = build(tables)
    except Exception as e:
        log("FALLO:", e); return 1
    log("años", doc["years"][0], "-", doc["latestYear"], "; estados STATUS:", json.dumps(status))
    ca = doc["data"]["CA"]
    for m in doc["measures"]: log("CA", m, doc["latestYear"], ca[m][-1])
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / "crop-insurance-ca.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "crop-insurance-ca-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

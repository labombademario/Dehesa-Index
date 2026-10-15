#!/usr/bin/env python3
"""Proyecciones a 10 anos de ERS (Agricultural Baseline Database; CC0 en data.gov). FASE 1 (sondeo): descarga el ZIP de la ultima version completa,
lista su contenido y vuelca cabeceras y primeras filas en data/ers-baseline-log.txt para escribir el lector con datos reales. No escribe datos."""
import io, sys, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://ers.usda.gov/media/5014/usda-agricultural-baseline-projections-to-2035.zip?v=91724"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def main():
    rq = urllib.request.Request(URL, headers={"User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)"})
    with urllib.request.urlopen(rq, timeout=180) as r: raw = r.read()
    log("bytes", len(raw))
    z = zipfile.ZipFile(io.BytesIO(raw)); names = z.infolist(); log("ficheros", len(names))
    for i in names[:80]: log(" ", i.filename, i.file_size)
    for i in names[:60]:
        n = i.filename.lower(); b = z.read(i)
        if n.endswith((".csv", ".txt")):
            t = b.decode("utf-8-sig", "replace").splitlines(); log("CSV", i.filename, len(t), "filas"); [log("   ", l[:300]) for l in t[:6]]
            if n.endswith(".txt"): [log("README|", l[:400]) for l in t[:140]]
            if n.endswith(".csv"):
                import csv, collections
                cat = collections.OrderedDict(); yrs = set(); ty = set()
                for r in csv.DictReader(t):
                    k = (r["commodity_type"], r["commodity"], r["attribute"], r["unit"], r["year_type"])
                    cat.setdefault(k, 0); cat[k] += 1; yrs.add(r["year"]); ty.add(r["year_of_projection"])
                log("CATALOGO", len(cat), "combinaciones; años", sorted(yrs)[:3], sorted(yrs)[-3:], "proyeccion", sorted(ty))
                for k, v in cat.items(): log("CAT|", " | ".join(k), v)
        elif n.endswith((".xlsx", ".xlsm")):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(b), read_only=True, data_only=True); log("XLSX", i.filename, wb.sheetnames[:12])
                for sh in wb.sheetnames[:2]:
                    log("  hoja", sh)
                    for k, row in enumerate(wb[sh].iter_rows(values_only=True)):
                        if k >= 8: break
                        log("   ", [c for c in row[:14]])
            except Exception as e: log("XLSX", i.filename, "error", repr(e)[:150])
        elif n.endswith(".zip"): log("ZIP anidado", i.filename)
    return 0
if __name__ == "__main__":
    try: rc = main()
    except Exception as e: log("error", repr(e)[:300]); rc = 1
    (ROOT / "data" / "ers-baseline-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); sys.exit(rc)

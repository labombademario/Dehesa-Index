#!/usr/bin/env python3
"""Seguro de cosechas de EE. UU. (USDA RMA, Summary of Business) -> data/crop-insurance.json
Fuentes (ficheros publicos de la RMA, delimitados por | y sin clave):
  state_county_crop/sobcov_<AÑO>.zip   estado x condado x cultivo x plan x nivel de cobertura (polizas, superficie, capital asegurado, prima, subvencion, indemnizacion)
  cause_of_loss/colsom_<AÑO>.zip       lo mismo con causa y mes de la perdida (indemnizacion por causa)
Se SUMAN los registros tal cual (sin estimar ni rellenar nada). Control: los totales nacionales de la RMA para 2024 (informe "By Insurance Plan",
capital asegurado 158.675.899.515 $, prima 15.882.603.437 $, subvencion 9.881.540.968 $, indemnizacion 15.172.182.135 $) se reproducen exactamente
con esta suma. Si un año anterior al actual falta o da totales absurdos se aborta y se conserva el fichero anterior."""
import datetime, io, json, sys, time, urllib.error, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://pubfs-rma.fpac.usda.gov/pub/Web_Data_Files/Summary_of_Business/"
SOB, COL = BASE + "state_county_crop/sobcov_%d.zip", BASE + "cause_of_loss/colsom_%d.zip"
YEARS_BACK = 11          # año actual y los 10 anteriores
TOP_CAUSES = 6           # causas con detalle por estado
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"})
            return urllib.request.urlopen(req, timeout=240).read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404: return None
            time.sleep(5 * (i + 1))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def rows(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    for line in z.read(z.infolist()[0].filename).decode("latin-1").splitlines():
        c = line.split("|")
        if len(c) >= 28: yield c
def num(c, i):
    try: return float(c[i])
    except (ValueError, IndexError): return 0.0
def sob_year(blob):
    """-> total nacional, por estado y por cultivo: [capital asegurado, prima total, subvencion, indemnizacion, polizas con prima, acres]"""
    tot, st, cr = [0.0] * 6, {}, {}
    for c in rows(blob):
        v = [num(c, 20), num(c, 21), num(c, 22), num(c, 26), num(c, 13), num(c, 18) if c[17].strip() == "Acres" else 0.0]
        s, k = c[2].strip(), c[6].strip()
        a, b = st.setdefault(s, [0.0] * 6), cr.setdefault(k, [0.0] * 6)
        for j in range(6): tot[j] += v[j]; a[j] += v[j]; b[j] += v[j]
    return tot, st, cr
def col_year(blob):
    """indemnizacion por causa y por causa x estado"""
    by, bs = {}, {}
    for c in rows(blob):
        if len(c) < 29: continue
        ind = num(c, 28); cause = c[12].strip(); s = c[2].strip()
        by[cause] = by.get(cause, 0.0) + ind; d = bs.setdefault(cause, {}); d[s] = d.get(s, 0.0) + ind
    return by, bs
def r(x): return int(round(x))
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    cy = datetime.datetime.now(datetime.timezone.utc).year
    years, st, cr, causes, cst, colsum = {}, {}, {}, {}, {}, {}
    for y in range(cy - YEARS_BACK + 1, cy + 1):
        blob = fetch(SOB % y)
        if blob is None:
            if y >= cy: log("sin fichero SOB de", y, "(aun no publicado)"); continue
            log("FALLO: falta sobcov", y); return 1
        tot, s, c = sob_year(blob); log("sob", y, "capital", r(tot[0]), "prima", r(tot[1]), "subvencion", r(tot[2]), "indemnizacion", r(tot[3]), "polizas", r(tot[4]))
        if y < cy - 1 and (tot[0] <= 0 or tot[1] <= 0 or tot[3] <= 0 or tot[2] > tot[1]):
            log("FALLO: totales absurdos en", y); return 1
        years[y] = tot
        for k, v in s.items(): st.setdefault(k, {})[y] = v
        for k, v in c.items(): cr.setdefault(k, {})[y] = v
        cb = fetch(COL % y)
        if cb is None: log("sin fichero COL de", y); continue
        by, bs = col_year(cb); colsum[y] = sum(by.values())
        log("col", y, "indemnizacion por causa", r(colsum[y]), "frente a SOB", r(tot[3]), "(%.2f%%)" % (100.0 * colsum[y] / tot[3] if tot[3] else 0))
        for k, v in by.items(): causes.setdefault(k, {})[y] = v
        for k, d in bs.items():
            for s2, v in d.items(): cst.setdefault(k, {}).setdefault(s2, {})[y] = v
    if len(years) < 8 or max(years) < cy - 1: log("FALLO: datos insuficientes", sorted(years)); return 1
    last = max(years)
    def ser(d, nd=0): return {str(y): [r(x) for x in d[y]] for y in sorted(d) if any(d[y])}
    top = sorted(causes, key=lambda k: -sum(causes[k].get(y, 0) for y in causes[k] if y < cy - 1))[:TOP_CAUSES]
    doc = {
        "schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {"id": "usda_rma", "name": "USDA Risk Management Agency (RMA), Summary of Business", "url": "https://www.rma.usda.gov/tools-reports/summary-of-business", "license": "US-PD"},
        "unit": "USD (importes tal como los publica la RMA); polizas = polizas con prima; acres = filas cuya unidad es acre",
        "fields": ["liability", "totalPremium", "subsidy", "indemnity", "policiesEarningPremium", "acres"],
        "cropYears": sorted(years), "latestCompleteYear": cy - 2, "provisionalFrom": cy - 1,
        "national": ser(years),
        "states": {k: ser(v) for k, v in sorted(st.items())},
        "crops": {k: ser(v) for k, v in sorted(cr.items())},
        "causeIndemnity": {k: {str(y): r(v) for y, v in sorted(d.items()) if v} for k, d in sorted(causes.items())},
        "causeStateIndemnity": {k: {s: {str(y): r(v) for y, v in sorted(d.items()) if v} for s, d in sorted(cst[k].items())} for k in top},
        "causeCheck": {str(y): [r(colsum[y]), r(years[y][3])] for y in sorted(colsum)},
    }
    p = outdir / "crop-insurance.json"; p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "crop-insurance-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    log("escrito", p.name, p.stat().st_size // 1024, "KB; ultimo año", last); return 0
if __name__ == "__main__": sys.exit(main())

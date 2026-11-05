#!/usr/bin/env python3
"""Seguro de cosechas de EE. UU. por CONDADO (USDA RMA, Summary of Business, state_county_crop/sobcov_<AÑO>.zip) -> data/us-county/insurance/<ESTADO>.json + index.json
Mismo fichero publico y mismo metodo que scripts/update-crop-insurance.py (que lo suma por estado): aqui se suma por condado y se guardan, para los ultimos 6 años,
[capital asegurado $, prima total $, subvencion $, indemnizacion $, polizas con prima, acres asegurados] y, del ultimo año completo, los 5 cultivos con mas capital asegurado.
Control: los totales nacionales de 2024 que ya publicamos en data/crop-insurance.json (capital 158.674.538.522 $, prima 15.882.497.169 $, subvencion 9.881.485.833 $, indemnizacion 15.175.339.990 $)
se reproducen exactamente sumando todos los registros (los de condado sin asignar, codigo 999, cuentan en el control pero no se publican como condado); si no coinciden, no se escribe nada. Nada se estima: un condado sin registros no aparece.
Uso: update-us-county-insurance.py [--out DIR] [--fixture-dir DIR]   (fixture: sobcov_<AÑO>.zip locales, sin red)"""
import argparse, datetime, io, json, sys, time, urllib.error, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://pubfs-rma.fpac.usda.gov/pub/Web_Data_Files/Summary_of_Business/state_county_crop/sobcov_%d.zip"
YEARS = 6
TOP_CROPS = 5
CHECK_2024 = [158674538522, 15882497169, 9881485833, 15175339990]   # = national de data/crop-insurance.json (el informe de la RMA de 2024 se ha revisado desde el original)
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch(y, fixture):
    if fixture:
        p = Path(fixture) / ("sobcov_%d.zip" % y)
        return p.read_bytes() if p.exists() else None
    last = None
    for i in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(URL % y, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"}), timeout=240).read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            last = e; time.sleep(5 * (i + 1))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def num(c, i):
    try: return float(c[i])
    except (ValueError, IndexError): return 0.0
def year_rows(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    for line in z.read(z.infolist()[0].filename).decode("latin-1").splitlines():
        c = line.split("|")
        if len(c) >= 28: yield c
def agg(blob):
    """-> {fips: {name, st, v:[6], crops:{crop:[liab,prem,indem]}}} y total nacional"""
    out = {}; tot = [0.0] * 4
    for c in year_rows(blob):
        sf, cf, st = c[1].strip(), c[3].strip(), c[2].strip()
        if not (sf.isdigit() and cf.isdigit()): continue
        fips = sf.zfill(2) + cf.zfill(3)
        v = [num(c, 20), num(c, 21), num(c, 22), num(c, 26), num(c, 13), num(c, 18) if c[17].strip() == "Acres" else 0.0]
        tot[0] += v[0]; tot[1] += v[1]; tot[2] += v[2]; tot[3] += v[3]       # el total nacional incluye los registros sin condado (999)
        if cf == "999": continue                                              # 999 = condado sin asignar: cuenta en el control, no se publica como condado
        d = out.setdefault(fips, {"name": c[4].strip().title(), "st": st, "v": [0.0] * 6, "crops": {}})
        for j in range(6): d["v"][j] += v[j]
        k = c[6].strip(); cr = d["crops"].setdefault(k, [0.0, 0.0, 0.0])
        cr[0] += v[0]; cr[1] += v[1]; cr[2] += v[3]
    return out, tot
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--fixture-dir"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "us-county" / "insurance"
    cy = datetime.datetime.now(datetime.timezone.utc).year
    years = {}; ycur = None
    for y in range(cy - YEARS + 1, cy + 1):
        blob = fetch(y, a.fixture_dir)
        if blob is None:
            if y >= cy: log("sin fichero de", y, "(aun no publicado)"); continue
            log("FALLO: falta sobcov", y); return 1
        d, tot = agg(blob); years[y] = d
        log("sob", y, "condados", len(d), "capital", round(tot[0]), "prima", round(tot[1]), "indemnizacion", round(tot[3]))
        if y == 2024 and [round(x) for x in tot] != CHECK_2024:
            log("FALLO: los totales de 2024 no reproducen los de la RMA", [round(x) for x in tot]); return 1
        if y < cy - 1 and (tot[0] <= 0 or tot[1] <= 0 or tot[2] > tot[1]): log("FALLO: totales absurdos en", y); return 1
    if len(years) < YEARS - 1 or max(years) < cy - 1: log("FALLO: datos insuficientes", sorted(years)); return 1
    ylist = sorted(years); last_full = max(y for y in ylist if y <= cy - 1)
    states = {}
    for y in ylist:
        for fips, d in years[y].items():
            s = states.setdefault(d["st"], {}).setdefault(fips, {"n": d["name"], "y": {}})
            s["y"][str(y)] = [round(d["v"][0]), round(d["v"][1]), round(d["v"][2]), round(d["v"][3]), int(round(d["v"][4])), int(round(d["v"][5]))]
            if y == last_full:
                top = sorted(d["crops"].items(), key=lambda kv: -kv[1][0])[:TOP_CROPS]
                s["top"] = [[k, round(v[0]), round(v[1]), round(v[2])] for k, v in top if v[0] > 0]
    if len(states) < 48: log("FALLO: solo %d estados" % len(states)); return 1
    out.mkdir(parents=True, exist_ok=True); now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "usda_rma", "url": "https://www.rma.usda.gov/tools-reports/summary-of-business"}
    idx = {}
    for st, cs in sorted(states.items()):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "state": st, "years": [str(y) for y in ylist], "lastFullYear": last_full,
               "fields": ["liability", "premium", "subsidy", "indemnity", "policies", "acres"], "topYear": last_full, "counties": cs}
        (out / (st + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
        idx[st] = len(cs)
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "years": [str(y) for y in ylist], "lastFullYear": last_full, "states": idx, "counties": sum(idx.values())}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d estados, %d condados, años %s-%s" % (len(idx), sum(idx.values()), ylist[0], ylist[-1])); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "us-county-insurance-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

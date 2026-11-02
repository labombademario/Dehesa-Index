#!/usr/bin/env python3
"""Australia: empleo, horas y costes laborales de la agricultura (ABS Labour Account Australia, CC BY 4.0) -> data/australia-labour-stats.json (extend AU)
Fuente: ABS Data API (SDMX, sin clave), dataflow LABOUR_ACCT_Q, industria 01XX (Agriculture, ANZSIC 01), total nacional, serie original, trimestral desde 1994-T3.
Se copia tal cual lo publica el ABS (miles de empleos/personas/horas, millones de A$). Solo hay nivel nacional: el ABS no publica la cuenta laboral por industria y estado.
Nota: el Indice de Precios de Salarios (WPI) del ABS no incluye agricultura (arranca en la industria B), asi que no hay indice de salarios agrarios; el coste laboral por hora de la cuenta laboral incluye la renta de los autonomos y no es un salario.
Control: compensacion de asalariados + renta laboral de autonomos = renta laboral total (1 %) en cada trimestre; si falla, no se escribe nada.
Uso: update-au-labour.py [--out FICHERO]"""
import argparse, csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://data.api.abs.gov.au/rest/data/ABS,LABOUR_ACCT_Q,1.1/%s.AUS.01XX.10.Q?dimensionAtObservation=AllDimensions"
M = [("M12", "Filled jobs in agriculture, Australia", "thousand jobs", "Empleos ocupados en agricultura (ANZSIC 01), en miles. Cuenta laboral del ABS, serie original."),
     ("M19", "Employed persons in agriculture, Australia", "thousand persons", "Personas ocupadas en agricultura (ANZSIC 01), en miles. Cuenta laboral del ABS, serie original."),
     ("M28", "Hours actually worked in agriculture, Australia", "thousand hours", "Horas realmente trabajadas en agricultura (ANZSIC 01) en el trimestre, en miles."),
     ("M38", "Total labour costs in agriculture, Australia", "A$ million", "Coste laboral total de agricultura (ANZSIC 01) en el trimestre, millones de A$."),
     ("M39", "Compensation of employees in agriculture, Australia", "A$ million", "Remuneracion de asalariados de agricultura (ANZSIC 01) en el trimestre, millones de A$."),
     ("M41", "Labour income from self-employment in agriculture, Australia", "A$ million", "Renta laboral de autonomos de agricultura (ANZSIC 01), millones de A$; en el campo es la mayor parte de la renta laboral."),
     ("M3", "Average labour cost per job in agriculture, Australia", "A$", "Coste laboral medio por empleo de agricultura (ANZSIC 01) en el trimestre, en A$."),
     ("M4", "Average labour cost per hour worked in agriculture, Australia", "A$ per hour", "Coste laboral medio por hora trabajada en agricultura (ANZSIC 01), en A$. Incluye la renta laboral de los autonomos, asi que no es un salario; el WPI del ABS no cubre agricultura."),
     ("M10", "Job vacancies in agriculture, Australia", "thousand", "Vacantes en agricultura (ANZSIC 01), en miles.")]
BAD = ("n", "u", "m", "q", "s", "t", "v", "w")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(codes):
    last = None
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(URL % "+".join(codes), headers={"Accept": "application/vnd.sdmx.data+csv", "User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}), timeout=240).read().decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "australia-labour-stats.json"
    codes = [m[0] for m in M] + ["M39", "M41", "M42"]
    D = {}
    for r in csv.DictReader(io.StringIO(get(sorted(set(codes))))):
        if r["OBS_VALUE"] == "" or r["OBS_STATUS"] in BAD: continue
        try: v = float(r["OBS_VALUE"])
        except ValueError: continue
        D.setdefault(r["MEASURE"], {})[r["TIME_PERIOD"]] = v
    log("medidas", {k: len(v) for k, v in sorted(D.items())})
    if any(len(D.get(m[0], {})) < 100 for m in M): log("FALLO: series demasiado cortas"); return 1
    bad = 0; n = 0
    for q, t in D.get("M42", {}).items():
        c, s = D.get("M39", {}).get(q), D.get("M41", {}).get(q)
        if c is None or s is None: continue
        n += 1; bad += abs(c + s - t) > 0.01 * abs(t) + 1
    log("control remuneracion + autonomos = renta laboral total: %d trimestres, %d fuera" % (n, bad))
    if n < 100 or bad > 0.02 * n: log("FALLO: el control no cuadra, no se escribe nada"); return 1
    mult = {"M12": 1, "M19": 1, "M28": 1, "M10": 1, "M38": 1, "M39": 1, "M41": 1, "M3": 1, "M4": 1}
    ser = []
    for code, label, unit, note in M:
        pts = sorted((q, round(v, 3)) for q, v in D[code].items())
        last, prev = pts[-1], pts[-2]
        ser.append({"id": "au-labacct-ag-%s" % code.lower(), "group": "income" if code not in ("M4", "M3") else "costs", "label": label + " (quarterly)", "unit": unit, "frequency": "quarterly", "latestPeriod": last[0], "latest": last[1],
                    "changePct": round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, "points": [[p, v] for p, v in pts], "sourceGroup": "ABS Labour Account", "sourceId": "abs", "periodNote": note, "reference": "ABS Labour Account Australia, dataflow LABOUR_ACCT_Q, industry 01XX, original series"})
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"name": "Australian Bureau of Statistics (ABS Data API), Labour Account Australia", "url": "https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-account-australia", "license": "CC BY 4.0"}
    out.write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "countries": {"AU": {"name": "Australia", "extend": True, "source": src, "series": ser}}}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d series, hasta %s" % (len(ser), ser[0]["latestPeriod"])); return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "australia-labour-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

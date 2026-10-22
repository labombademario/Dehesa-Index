#!/usr/bin/env python3
"""Poblacion, paro y valor anadido bruto (VAB) por region y nacion del Reino Unido (12 regiones ITL1) -> data/uk-regions-macro.json
Fuente: Office for National Statistics via NOMIS (API abierta, Open Government Licence v3.0). Mismo formato que data/canada-provinces-macro.json:
{regions: {UKC: {pop, unemp, gva, gvapc}}}, cada serie [[periodo, valor]]; las claves son los codigos NUTS 1 (UKC..UKN) que ya usa la web.
  pop   : poblacion residente estimada a mitad de ano (NM_2002_1, todas las edades y sexos), personas
  unemp : tasa de paro CALCULADA por Dehesa Index = parados / poblacion activa de 16+ (Encuesta Anual de Poblacion, NM_17_1, celdas T01:16 y T01:4),
          media de 12 meses; periodo = mes de fin ('YYYY-MM'). No es una cifra publicada tal cual por el ONS.
  gva   : VAB en millones de libras (NM_2400_1), solo si el ONS lo publica en esa region; NO es PIB y no se presenta como tal
  gvapc : VAB por habitante, CALCULADO por Dehesa Index (VAB / poblacion del mismo ano)
Si una fuente falla se conserva lo que ya habia de esa metrica y la ejecucion queda en rojo."""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
N = "https://www.nomisweb.co.uk/api/v01/dataset/"
CODES = {"E12000001": "UKC", "E12000002": "UKD", "E12000003": "UKE", "E12000004": "UKF", "E12000005": "UKG", "E12000006": "UKH", "E12000007": "UKI",
         "E12000008": "UKJ", "E12000009": "UKK", "W92000004": "UKL", "S92000003": "UKM", "N92000002": "UKN"}
MONTHS = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def nomis(path, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(N + path, headers={"User-Agent": "Dehesa-Index-data-bot/1.0"})
            return list(csv.DictReader(io.StringIO(urllib.request.urlopen(req, timeout=240).read().decode("utf-8-sig"))))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:200])
def num(x):
    try: return float(x)
    except Exception: return None
def population():
    out = {}
    for r in nomis("NM_2002_1.data.csv?geography=TYPE480&date=2010-latest&gender=0&c_age=200&measures=20100&select=date_name,geography_code,obs_value"):
        k = CODES.get(r["GEOGRAPHY_CODE"]); v = num(r["OBS_VALUE"])
        if k and v is not None and r["DATE_NAME"].isdigit(): out.setdefault(k, []).append([int(r["DATE_NAME"]), int(v)])
    return {k: sorted(v) for k, v in out.items()}
def unemployment():
    rows = nomis("NM_17_1.data.csv?geography=TYPE480&cell=402720257,402719233&date=2014-01...latest&measures=20100&select=date_name,geography_code,cell_name,obs_value")
    by = {}
    for r in rows:
        k = CODES.get(r["GEOGRAPHY_CODE"]); v = num(r["OBS_VALUE"]); m = re.match(r"\w{3} (\d{4})-(\w{3}) (\d{4})$", r["DATE_NAME"])
        if not (k and v is not None and m): continue
        per = "%s-%02d" % (m.group(3), MONTHS[m.group(2)])
        by.setdefault((k, per), {})["u" if r["CELL_NAME"].startswith("T01:16") else "a"] = v
    out = {}
    for (k, per), d in sorted(by.items()):
        if d.get("u") is not None and d.get("a"): out.setdefault(k, []).append([per, round(d["u"] / d["a"] * 100, 1)])
    return out
def gva():
    rows = nomis("NM_2400_1.data.csv?geography=TYPE480&date=2010-latest&measures=20100&select=date_name,geography_code,obs_value")
    out = {}
    for r in rows:
        k = CODES.get(r["GEOGRAPHY_CODE"]); v = num(r["OBS_VALUE"])
        if k and v is not None and r["DATE_NAME"].isdigit(): out.setdefault(k, []).append([int(r["DATE_NAME"]), round(v, 1)])
    return {k: sorted(v) for k, v in out.items()}
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    outdir.mkdir(parents=True, exist_ok=True); p = outdir / "uk-regions-macro.json"
    try: old = json.loads(p.read_text(encoding="utf-8"))["regions"]
    except Exception: old = {}
    res = {}; rc = 0
    for key, fn, need in (("pop", population, 12), ("unemp", unemployment, 12), ("gva", gva, 9)):
        try:
            d = fn(); log(key, "regiones:", len(d), {k: v[-1] for k, v in list(d.items())[:2]})
            if len(d) < need: raise ValueError("solo %d regiones" % len(d))
            res[key] = d
        except Exception as e:
            log("FALLO", key, repr(e)); res[key] = {k: o[key] for k, o in old.items() if o.get(key)}
            if key != "gva": rc = 1
    pcap = {}
    for k, s in res.get("gva", {}).items():
        pm = dict(res.get("pop", {}).get(k, []))
        pcap[k] = [[y, round(v * 1e6 / pm[y])] for y, v in s if y in pm]
    regions = {}
    for k in sorted(CODES.values()):
        o = {a: res[a][k] for a in ("pop", "unemp", "gva") if res.get(a, {}).get(k)}
        if pcap.get(k): o["gvapc"] = pcap[k]
        if o: regions[k] = o
    if len(regions) < 12:
        log("FALLO: faltan regiones"); (outdir / "uk-regions-macro-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Office for National Statistics via NOMIS (Annual Population Survey, mid-year population estimates, regional gross value added)", "url": "https://www.nomisweb.co.uk/", "license": "Open Government Licence v3.0"},
           "units": {"pop": "persons", "unemp": "% of economically active 16+ (calculated)", "gva": "GBP million", "gvapc": "GBP per inhabitant (calculated)"}, "regions": regions}
    old_doc = None
    try: old_doc = json.loads(p.read_text(encoding="utf-8"))
    except Exception: pass
    if not old_doc or {k: v for k, v in old_doc.items() if k != "generatedAt"} != {k: v for k, v in doc.items() if k != "generatedAt"}:
        p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "uk-regions-macro-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

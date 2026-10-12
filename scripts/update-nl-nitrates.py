#!/usr/bin/env python3
"""Paises Bajos: nitrato en el agua de lixiviacion y en las zanjas de explotaciones agrarias (RIVM, LMM), nitrato en aguas subterraneas y balance de nitrogeno
(Eurostat) -> data/nl-nitrates.json
1) RIVM, Landelijk Meetnet effecten Mestbeleid (LMM), «Datatool waterkwaliteit» (CSV abierto, licencia CC BY 4.0): desde 1992 mide cada ano la calidad del agua que
   sale de la zona radicular (uitspoelingswater) y de las zanjas (slootwater) en explotaciones agrarias. Se guarda el nitrato (mg/l NO3) de todas las explotaciones («alle»)
   por region de suelo: arena (muestreo de verano), arcilla, loess y turba (invierno). Media del ano, mediana (p50), p90 y numero de explotaciones.
   El enlace del CSV cambia con cada version: se busca en la pagina de la datatool.
2) Eurostat sdg_06_40: nitrato en aguas subterraneas (mg/l NO3), media nacional anual desde 2007.
3) Eurostat aei_pr_gnb: balance bruto de nitrogeno por hectarea de superficie agraria util (kg N/ha), desde 1985.
Si una parte falla se conserva la anterior. Uso: python3 scripts/update-nl-nitrates.py"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "nl-nitrates.json"
PAGE = "https://www.rivm.nl/landelijk-meetnet-effecten-mestbeleid/datatool-waterkwaliteit"
ES = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/%s?format=JSON&lang=EN&geo=NL%s"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "*/*"}
def get(u, t=180, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def lmm(raw=None):
    if raw is None:
        links = re.findall(r'href="([^"]+\.csv[^"]*)"', get(PAGE).decode("utf-8", "replace"))
        if not links: raise ValueError("sin enlace CSV en la datatool")
        u = links[0]; u = u if u.startswith("http") else "https://www.rivm.nl" + u; raw = get(u, 240)
    rd = list(csv.DictReader(io.StringIO(raw.decode("cp1252", "replace")), delimiter=";"))
    if len(rd) < 5000 or "component" not in rd[0]: raise ValueError("CSV del LMM raro: %d filas" % len(rd))
    want = {("uitspoelingswater", "zomer", "zand"): ("leaching", "zand"), ("uitspoelingswater", "winter", "klei"): ("leaching", "klei"), ("uitspoelingswater", "winter", "veen"): ("leaching", "veen"),
            ("uitspoelingswater", "winter", "löss"): ("leaching", "loess"), ("slootwater", "winter", "klei"): ("ditch", "klei"), ("slootwater", "winter", "veen"): ("ditch", "veen"), ("slootwater", "winter", "zand"): ("ditch", "zand")}
    out = {"leaching": {}, "ditch": {}}; seen = set()
    for r in rd:
        if r["component"] != "Nitraat" or r["bedrijfstype"] != "alle" or r["eenheid"] != "mg/l": continue
        k = want.get((r["watertype"], r["seizoen"], r["hoofdgrondsoortregio"]))
        if not k: continue
        def f(x):
            try: return round(float(x), 1)
            except ValueError: return None
        row = [int(r["jaar"]), f(r["jaartot_gem"]), f(r["p50"]), f(r["p90"]), int(r["aantal_bedrijven"] or 0)]
        if (k, row[0]) in seen or row[1] is None: continue
        seen.add((k, row[0])); out[k[0]].setdefault(k[1], []).append(row)
    for g in out.values():
        for v in g.values(): v.sort()
    for k in ("zand", "klei", "veen", "loess"):
        v = out["leaching"].get(k, [])
        if len(v) < 15 or v[-1][0] < datetime.date.today().year - 3: raise ValueError("LMM %s: serie corta o vieja (%d)" % (k, len(v)))
        if not all(0 <= x[1] < 400 for x in v): raise ValueError("LMM %s fuera de rango" % k)
    return out
def eurostat(code, extra, lo, hi):
    d = json.loads(get(ES % (code, extra))); T = d["dimension"]["time"]["category"]["index"]; v = d["value"]
    if isinstance(T, list): T = {k: i for i, k in enumerate(T)}
    rows = [[int(y), round(v[str(i)], 2)] for y, i in sorted(T.items()) if str(i) in v and v[str(i)] is not None]
    if len(rows) < 10 or not all(lo < x[1] < hi for x in rows): raise ValueError("%s: serie rara %s" % (code, rows[-3:]))
    return rows
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "limit": 50,
           "source": {"name": "RIVM, Landelijk Meetnet effecten Mestbeleid (LMM); Eurostat sdg_06_40 y aei_pr_gnb", "url": PAGE, "eurostatUrl": "https://ec.europa.eu/eurostat/databrowser/view/sdg_06_40/default/table",
                      "license": "CC BY 4.0 (RIVM LMM; Eurostat)"}, "fields": ["year", "mean", "p50", "p90", "farms"], "unit": "mg/l NO3"}
    try: doc.update(lmm())
    except Exception as e:
        print("AVISO LMM:", e)
        for k in ("leaching", "ditch"):
            if old.get(k): doc[k] = old[k]
    for key, code, extra, lo, hi in (("groundwater", "sdg_06_40", "", 0, 100), ("nBalance", "aei_pr_gnb", "&nutrient=N&indic_ag=BAL_UAA", 0, 600)):
        try: doc[key] = eurostat(code, extra, lo, hi)
        except Exception as e:
            print("AVISO %s:" % code, e)
            if old.get(key): doc[key] = old[key]
    if not all(k in doc for k in ("leaching", "groundwater", "nBalance")): print("FALLO: falta una parte"); return 0 if OUT.exists() else 1
    doc["asOf"] = "%d-12-31" % doc["leaching"]["zand"][-1][0]
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    z = doc["leaching"]["zand"][-1]; g = doc["groundwater"][-1]; b = doc["nBalance"][-1]
    print("nl-nitrates.json: lixiviado en arena %d: %s mg/l (%d explotaciones); aguas subterraneas %d: %s mg/l; balance N %d: %s kg/ha; regiones %s" % (z[0], z[1], z[4], g[0], g[1], b[0], b[1], list(doc["leaching"])))
    return 0
if __name__ == "__main__": sys.exit(main())

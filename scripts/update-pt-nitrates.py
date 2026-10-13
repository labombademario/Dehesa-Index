#!/usr/bin/env python3
"""Portugal: nitrato en aguas subterraneas y balance de nitrogeno (Eurostat) -> data/pt-nitrates.json
Solo hay dos series nacionales abiertas y con licencia clara; Dehesa Index no las reparte por region ni inventa nada:
1) Eurostat sdg_06_40: nitrato en aguas subterraneas (mg/l NO3), media nacional anual desde 2008.
2) Eurostat aei_pr_gnb: balance bruto de nitrogeno por hectarea de superficie agraria util (kg N/ha).
La Agencia Portuguesa do Ambiente (SNIRH/SNIAmb) tiene datos de nitratos por estacion, pero sus conjuntos en dados.gov.pt no declaran licencia («notspecified»)
y el SNIRH bloquea la descarga automatica, asi que no se usan. Licencia de Eurostat: CC BY 4.0.
Si una parte falla se conserva la anterior. Uso: python3 scripts/update-pt-nitrates.py"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "pt-nitrates.json"
ES = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/%s?format=JSON&lang=EN&geo=PT%s"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "*/*"}
def get(u, t=180, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
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
           "source": {"name": "Eurostat sdg_06_40 y aei_pr_gnb", "url": "https://ec.europa.eu/eurostat/databrowser/view/sdg_06_40/default/table", "license": "CC BY 4.0 (Eurostat)"}, "unit": "mg/l NO3"}
    for key, code, extra, lo, hi in (("groundwater", "sdg_06_40", "", 0, 100), ("nBalance", "aei_pr_gnb", "&nutrient=N&indic_ag=BAL_UAA", 0, 600)):
        try: doc[key] = eurostat(code, extra, lo, hi)
        except Exception as e:
            print("AVISO %s:" % code, e)
            if old.get(key): doc[key] = old[key]
    if not all(k in doc for k in ("groundwater", "nBalance")): print("FALLO: falta una parte"); return 0 if OUT.exists() else 1
    doc["asOf"] = "%d-12-31" % max(doc["groundwater"][-1][0], doc["nBalance"][-1][0])
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    g = doc["groundwater"][-1]; b = doc["nBalance"][-1]
    print("pt-nitrates.json: aguas subterraneas %d: %s mg/l (%d anos); balance N %d: %s kg/ha (%d anos)" % (g[0], g[1], len(doc["groundwater"]), b[0], b[1], len(doc["nBalance"])))
    return 0
if __name__ == "__main__": sys.exit(main())

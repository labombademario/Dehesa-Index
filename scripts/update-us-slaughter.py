#!/usr/bin/env python3
"""Sacrificio diario de EE. UU. (USDA AMS, informe MARS 3208 «Daily Livestock and Poultry Slaughter») -> data/us-markets/slaughter.json
Cabezas sacrificadas por especie (vacuno, terneros, cerdo, ovino, pollo joven) tal como las publica el informe; solo cabezas, sin pesos.
Todo tal como lo publica la fuente: un hueco es un hueco. Si algo no se entiende, NO se escribe nada y el log guarda la estructura recibida.
Requiere MARS_API_KEY (solo del entorno; nunca se escribe). Uso: update-us-slaughter.py [--days N] [--probe]"""
import base64, datetime, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / "data" / "us-markets"
KEY = os.environ.get("MARS_API_KEY", ""); REPORT = 3208
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a)
    if KEY: s = s.replace(KEY, "***")
    LOG.append(s); print(s, flush=True)
def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            rq = urllib.request.Request(url, headers={"Authorization": "Basic " + base64.b64encode((KEY + ":").encode()).decode(), "Accept": "application/json", "User-Agent": "dehesaindex.com data pipeline (+https://dehesaindex.com)"})
            with urllib.request.urlopen(rq, timeout=120) as r: return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = "HTTP %s" % e.code
            if e.code in (400, 401, 403, 404): break
        except Exception as e: last = repr(e)[:200]
        time.sleep(4 * (i + 1))
    raise RuntimeError(last)
def main():
    days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else 14
    if not KEY: log("falta MARS_API_KEY"); return 1
    end = datetime.date.today(); beg = end - datetime.timedelta(days=days)
    url = "https://marsapi.ams.usda.gov/services/v1.2/reports/%d?q=report_begin_date=%s:%s&allSections=true" % (REPORT, beg.strftime("%m/%d/%Y"), end.strftime("%m/%d/%Y"))
    try: d = get(url)
    except Exception as e: log("MARS", REPORT, "error", e); return 1
    secs = d if isinstance(d, list) else [d]
    log("secciones:", [(s.get("reportSection"), len(s.get("results") or [])) for s in secs])
    # sondeo: estructura recibida (claves y 3 filas de cada seccion) para escribir el lector con datos reales
    for s in secs:
        rs = s.get("results") or []
        log("SEC", s.get("reportSection"), "claves:", sorted(rs[0].keys()) if rs else [])
        drop = ("office", "market_", "slug_", "report_title", "report_begin", "report_end")
        for r in rs[:60]: log("  ", json.dumps({k: v for k, v in r.items() if not k.startswith(drop)}, ensure_ascii=False)[:500])
    return 0
if __name__ == "__main__":
    rc = main(); (OUT / "slaughter-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); sys.exit(rc)

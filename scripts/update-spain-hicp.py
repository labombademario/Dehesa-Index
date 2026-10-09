#!/usr/bin/env python3
"""España: indices de precios de CONSUMO de la mantequilla y el queso (Eurostat, IPCA/HICP, ECOICOP v2) -> data/spain-hicp-stats.json (formato de ficheros de estadisticas por pais).

Conjunto prc_hicp_minr (indice mensual, 2025=100), pais ES, partidas CP01152 «Butter and other oils and fats derived from milk» y CP01145 «Cheese». Son indices de precios al CONSUMIDOR
(lo que paga el hogar), no precios en origen: la etiqueta de cada serie lo dice («Consumer price index») y el grupo es «prices», no «idx_perc» (precios percibidos por el agricultor).
La matriz de cobertura los cuenta como indice de precios del producto porque el indicador es de ese producto, pero no sustituyen a un precio industrial o en origen.
Licencia: politica de reutilizacion de Eurostat (Decision 2011/833/UE), con cita de la fuente. Valores tal cual; un mes sin dato (Eurostat lo marca asi) no tiene punto.
Uso: update-spain-hicp.py [--out DIR]"""
import datetime, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr"
SINCE = "2015-01"
ITEMS = {"CP01152": ("butter and other fats derived from milk", "butter"), "CP01145": ("cheese", "cheese")}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=120).read().decode("utf-8")
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %r" % (url[:120], last))
def parse(j):
    """JSON-stat 2.0 de prc_hicp_minr (freq, unit, coicop18, geo, time) -> {coicop: {periodo: valor}}"""
    ids, sizes = j["id"], j["size"]; cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}; out = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        if rec["geo"] != "ES" or rec["unit"] != "I25" or rec["freq"] != "M": raise ValueError("celda fuera de lo pedido: %s" % rec)
        out.setdefault(rec["coicop18"], {})[rec["time"]] = float(v)
    return out
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    url = API + "?format=JSON&lang=EN&geo=ES&unit=I25&sinceTimePeriod=%s&" % SINCE + "&".join("coicop18=" + c for c in ITEMS)
    try: by = parse(json.loads(get(url)))
    except Exception as e: log("ERROR:", e); return 1
    series = []
    for code, (txt, key) in ITEMS.items():
        pl = sorted(by.get(code, {}).items())
        if len(pl) < 60: log("ERROR: %s solo trae %d meses (se esperan 60 o mas); no se escribe nada" % (code, len(pl))); return 1
        prev = pl[-2][1] if len(pl) > 1 else None
        series.append({"id": "es-hicp-" + key, "group": "prices", "label": "Consumer price index (HICP, 2025=100): %s, Spain (Eurostat prc_hicp_minr %s)" % (txt, code), "unit": "index 2025=100", "frequency": "monthly",
                       "latestPeriod": pl[-1][0], "latest": pl[-1][1], "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": "Eurostat prc_hicp_minr"})
        log(code, key, len(pl), "meses; ultimo", pl[-1][0])
    src = {"name": "Eurostat – HICP, monthly data (prc_hicp_minr)", "url": "https://ec.europa.eu/eurostat/web/hicp", "license": "Eurostat reuse policy (Decision 2011/833/EU)"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": series}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "spain-hicp-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-hicp-stats.json")
    return 0
if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-hicp-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

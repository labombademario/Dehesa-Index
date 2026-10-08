#!/usr/bin/env python3
"""UE: existencias de cierre de cereales y oleaginosas por pais (Eurostat) -> data/eu-stocks-stats.json
Conjuntos apro_cbs_cer (trigo blando y espelta, trigo duro, cebada, maiz grano) y apro_cbs_oil (colza, girasol, soja), indicador STK_CL
(«Closing stock», miles de toneladas, anual). Solo lo que cada Estado miembro notifica: si un pais no publica un cultivo, no hay serie.
No se mezcla con STK_EMY («stock at the end of the marketing year»): Eurostat los publica por separado y no siempre coinciden.
Licencia: politica de reutilizacion de Eurostat (Decision 2011/833/UE), con cita de la fuente. Valores tal cual, sin convertir.
Uso: update-eu-stocks.py [--out DIR]"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180).read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))
# codigo de Eurostat -> codigo de Dehesa Index (solo paises del sitio)
GEO = {c: c for c in "AT BE BG CY CZ DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK".split()}
GEO["EU27_2020"] = "EU"
NAME = {"EL": "Greece", "EU": "European Union"}
# (conjunto, cultivo) -> (texto de la etiqueta, clave corta del id)
CROPS = {
    ("apro_cbs_cer", "C1110"): ("common wheat and spelt", "common-wheat"),
    ("apro_cbs_cer", "C1120"): ("durum wheat", "durum-wheat"),
    ("apro_cbs_cer", "C1300"): ("barley", "barley"),
    ("apro_cbs_cer", "C1500"): ("grain maize and corn-cob-mix", "maize"),
    ("apro_cbs_oil", "I1110"): ("rapeseed (rape and turnip rape seeds)", "rapeseed"),
    ("apro_cbs_oil", "I1120"): ("sunflower seed", "sunflower-seed"),
    ("apro_cbs_oil", "I1130"): ("soybeans (soya)", "soybeans"),
}
NOW = datetime.date.today()
def fetch(code):
    j = json.loads(get(API + code + "?format=JSON&lang=en&stk_flow=STK_CL"))
    ids, sizes = j["id"], j["size"]
    cat = {k: list(v["category"]["index"]) for k, v in j["dimension"].items()}
    lab = {k: v["category"].get("label", {}) for k, v in j["dimension"].items()}
    out = {}
    for p, v in j["value"].items():
        if v is None: continue
        pos = int(p); d = []
        for s in reversed(sizes): d.append(pos % s); pos //= s
        d.reverse(); rec = {ids[i]: cat[ids[i]][d[i]] for i in range(len(ids))}
        out.setdefault((rec["geo"], rec["crops"]), {})[rec["time"]] = float(v)
    return out, lab
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    by = {}; names = {}; skipped = {"short": 0, "old": 0, "other_geo": 0}
    for code in ("apro_cbs_cer", "apro_cbs_oil"):
        data, lab = fetch(code); log(code, "series recibidas", len(data))
        for (geo, crop), pts in sorted(data.items()):
            cc = GEO.get(geo)
            if not cc: skipped["other_geo"] += 1; continue
            meta = CROPS.get((code, crop))
            if not meta: continue
            pl = sorted((t, v) for t, v in pts.items() if len(t) == 4 and t.isdigit())
            if len(pl) < 3: skipped["short"] += 1; continue
            if int(pl[-1][0]) < NOW.year - 4: skipped["old"] += 1; continue
            prev = pl[-2][1] if len(pl) > 1 else None
            ch = round((pl[-1][1] - prev) / prev * 100, 2) if prev else None
            names[cc] = NAME.get(cc) or lab["geo"].get(geo, cc)
            by.setdefault(cc, []).append({
                "id": "%s-eurostat-stock-%s" % (cc.lower(), meta[1]), "group": "stocks",
                "label": "Closing stock: %s (Eurostat cereal and oilseed balance sheets)" % meta[0],
                "unit": "thousand t", "frequency": "annual", "latestPeriod": pl[-1][0], "latest": pl[-1][1], "changePct": ch,
                "points": [[t, v] for t, v in pl], "sourceGroup": "Eurostat " + code})
    n = sum(len(v) for v in by.values())
    log("paises", len(by), "series", n, "descartadas", json.dumps(skipped))
    if n < 20: raise SystemExit("demasiado pocas series (%d); no se escribe nada" % n)
    src = {"name": "Eurostat – cereal and oilseed balance sheets (apro_cbs_cer, apro_cbs_oil)", "url": "https://ec.europa.eu/eurostat/web/agriculture/database",
           "license": "Eurostat reuse policy (Decision 2011/833/EU)"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {cc: {"name": names[cc], "extend": True, "source": src, "series": sorted(v, key=lambda s: s["id"])} for cc, v in sorted(by.items())},
           "log": LOG[-30:]}
    (outdir / "eu-stocks-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (outdir / "eu-stocks-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    for cc in sorted(by): log(cc, len(by[cc]), "series; ultimo", max(s["latestPeriod"] for s in by[cc]))
if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Precio unitario de importacion del azufre (CN 2503) de la UE-27 y de cada Estado miembro (Eurostat Comext, DS-045409, CC BY 4.0).
Escribe data/eu-sulphur.json y data/eu-sulphur-log.txt.
 - Flujo: importaciones desde fuera de la UE (socio EXT_EU27_2020); el comercio intra-UE mezcla reexpediciones y distorsiona el precio.
 - Mensual desde 2015: valor (EUR), cantidad (toneladas) y precio unitario = valor / toneladas. Es un valor unitario de aduana (CIF) de lo realmente
   importado, no un precio de mercado: va por detras del mercado y se mueve con el volumen del mes.
 - Un mes sin cantidad, sin valor o con menos de MIN_T toneladas no da precio unitario (se omite el punto, no se rellena).
Uso: python3 scripts/update-eu-sulphur.py [--fixture fichero.json]   (con --fixture lee ese JSON de Comext en lugar de la red; para los tests)."""
import datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
SINCE = "2015-01"
MIN_T = 500.0          # por debajo de este volumen mensual el valor unitario es ruido (envios sueltos)
CODES = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"]
COMEXT = {"EL": "GR"}  # codigo del sitio -> codigo de declarante en Comext
REPORTERS = ["EU27_2020"] + [COMEXT.get(c, c) for c in CODES]
BACK = {v: k for k, v in COMEXT.items()}
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-sulphur-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def fetch(tries=4):
    q = urllib.parse.urlencode({"reporter": REPORTERS, "partner": "EXT_EU27_2020", "product": "2503", "flow": "1", "freq": "M", "sinceTimePeriod": SINCE,
                                "indicators": ["VALUE_IN_EUROS", "QUANTITY_IN_100KG"], "format": "JSON", "lang": "EN"}, doseq=True)
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=150) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def parse(j):
    """JSON-stat de Comext -> {cc: {periodo: [euros, toneladas]}}; cc 'EU' es el agregado UE-27."""
    ids = j["id"]; order = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]
        o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        order[d] = o
    val = j.get("value", {}); items = val.items() if isinstance(val, dict) else enumerate(val)
    out = {}
    for k, v in items:
        if v is None: continue
        k = int(k); rec = {}
        for d in reversed(ids):
            n = len(order[d]); rec[d] = order[d][k % n]; k //= n
        rep = rec["reporter"]; cc = "EU" if rep == "EU27_2020" else BACK.get(rep, rep)
        cell = out.setdefault(cc, {}).setdefault(rec["time"], [None, None])
        if rec["indicators"] == "VALUE_IN_EUROS": cell[0] = float(v)
        elif rec["indicators"] == "QUANTITY_IN_100KG": cell[1] = float(v) / 10.0   # 100 kg -> toneladas
    return out


def build(raw):
    countries = {}
    for cc, months in sorted(raw.items()):
        pts = []
        for p, (eur, t) in sorted(months.items()):
            if not eur or not t or t < MIN_T: continue
            pts.append([p, round(eur / t, 1), round(t), round(eur)])
        if len(pts) >= 24: countries[cc] = {"points": pts}
    return countries


def main():
    j = json.load(open(sys.argv[sys.argv.index("--fixture") + 1])) if "--fixture" in sys.argv else fetch()
    raw = parse(j); countries = build(raw)
    if "EU" not in countries or len(countries) < 8: raise SystemExit("FALLO: Comext devolvio datos insuficientes (%d paises)" % len(countries))
    last = max(c["points"][-1][0] for c in countries.values())
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestPeriod": last,
           "source": {"id": "eurostat_comext", "name": "Eurostat Comext (DS-045409), CN 2503 sulphur of all kinds, imports from outside the EU", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "license": "CC BY 4.0"},
           "unit": "EUR/t", "minTonnes": MIN_T, "pointFields": ["period", "unitValueEurPerTonne", "tonnes", "valueEur"], "countries": countries}
    out = ROOT / "data" / "eu-sulphur.json"
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-sulphur.json: %d series, ultimo mes %s, UE-27 %s EUR/t" % (len(countries), last, countries["EU"]["points"][-1][1]))


if __name__ == "__main__":
    main()

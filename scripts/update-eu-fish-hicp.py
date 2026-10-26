#!/usr/bin/env python3
"""Indice de precios de consumo armonizado (IPCA) del pescado y otros productos del mar, por Estado miembro y UE, de Eurostat.
Escribe data/eu-fish-hicp.json y data/eu-fish-hicp-log.txt.
 - Fuente: Eurostat, prc_hicp_minr (IPCA, ECOICOP v2, indices mensuales), COICOP 18 = CP0113 "Fish and other seafood", unidad I25 (2025 = 100). La API publica no pide clave.
   Es el mismo conjunto que usan update-cpi.py, update-spain-hicp.py y update-france-hicp.py. Desde 2019 (la serie empieza en enero de 2019 en todos los paises).
 - Es un indice de precios al consumo de TODO el pescado y marisco (fresco, congelado, ahumado, conservas): no es el precio de una especie. Nada se calcula ni se estima; un mes sin
   dato queda fuera. Comprobaciones: valor positivo y salto mensual de menos del 30 %.
Uso: python3 scripts/update-eu-fish-hicp.py [--fixture fichero.json]  (con --fixture lee ese JSON-stat en lugar de la red; para los tests)."""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr?format=JSON&lang=en&coicop18=CP0113&unit=I25&sinceTimePeriod=2019-01"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)"}
GEO = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "EU27_2020"]
MAX_MOM = 0.30
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-fish-hicp-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def http(url, tries=4, timeout=120):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def parse(doc):
    """JSON-stat 2.0 -> {geo: {'AAAA-MM': valor}} (solo unidad I25 y COICOP CP0113)."""
    ids, size, dim, val = doc["id"], doc["size"], doc["dimension"], doc.get("value") or {}
    if isinstance(val, list): val = {str(i): v for i, v in enumerate(val) if v is not None}
    pos = {d: dim[d]["category"]["index"] for d in ids}
    pos = {d: (p if isinstance(p, dict) else {k: i for i, k in enumerate(p)}) for d, p in pos.items()}
    inv = {d: {i: k for k, i in pos[d].items()} for d in ids}
    out = {}
    for key, v in val.items():
        n, idx = int(key), []
        for s in reversed(size): idx.append(n % s); n //= s
        idx.reverse(); cell = {d: inv[d][i] for d, i in zip(ids, idx)}
        if cell.get("unit", "I25") != "I25" or cell.get("coicop18", "CP0113") != "CP0113" or cell["geo"] not in GEO: continue
        out.setdefault(cell["geo"], {})[cell["time"]] = float(v)
    return out


def build(raw):
    out = {}
    for g, m in raw.items():
        ks = sorted(m); good = {}
        prev = None
        for k in ks:
            v = m[k]
            if v <= 0: continue
            if prev is not None and abs(v / prev - 1) > MAX_MOM: log("aviso: %s %s salta %.0f %% frente al mes anterior; se descarta el pais" % (g, k, (v / prev - 1) * 100)); good = None; break
            good[k] = round(v, 2); prev = v
        if good and len(good) >= 24: out["EU" if g == "EU27_2020" else g] = [[k, good[k]] for k in sorted(good)]
    return out


def main():
    doc = json.load(open(sys.argv[sys.argv.index("--fixture") + 1], encoding="utf-8")) if "--fixture" in sys.argv else json.loads(http(URL))
    if "error" in doc: raise SystemExit("FALLO: Eurostat devolvio un error: %s" % str(doc["error"])[:200])
    countries = build(parse(doc))
    if len(countries) < 20 or "ES" not in countries: raise SystemExit("FALLO: Eurostat devolvio datos insuficientes (%d paises)" % len(countries))
    latest = max(v[-1][0] for v in countries.values())
    if "--fixture" not in sys.argv and (datetime.date.today() - datetime.date(int(latest[:4]), int(latest[5:]), 1)).days > 120: raise SystemExit("FALLO: el ultimo mes del IPCA del pescado (%s) es demasiado antiguo" % latest)
    out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestMonth": latest, "unit": "Index, 2025=100",
           "source": {"id": "eurostat", "name": "Eurostat, HICP - ECOICOP ver.2 - monthly index (prc_hicp_minr), CP0113 Fish and other seafood", "url": "https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_minr/default/table", "license": "Eurostat reuse policy (Decision 2011/833/EU)"},
           "pointFields": ["month", "index"], "countries": countries}
    (ROOT / "data" / "eu-fish-hicp.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-fish-hicp.json: %d paises/UE, ultimo mes %s" % (len(countries), latest))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Valor unitario de importacion del azufre (HS 2503) de EE. UU. (US Census Bureau, API de comercio exterior, dominio publico).
Escribe data/us-sulphur.json y data/us-sulphur-log.txt. Necesita el secreto CENSUS_API_KEY (clave gratuita; la misma de update-us-states-macro).
 - Importaciones para consumo (CON_VAL_MO, valor de aduana) entre cantidad (CON_QY1_MO, toneladas) = USD por tonelada, mensual desde 2015, total de todos los paises.
   Se usan las importaciones para consumo (no las generales) porque son las que suma el USGS: 2023 2.300 kt frente a 2.390 kt del USGS (las generales daban 1.140 kt).
 - Es un valor unitario de aduana de lo realmente importado, no un precio de mercado. Un mes sin cantidad o con menos de MIN_T toneladas no da precio.
 - El total se toma de la fila de total mundial (CTY_CODE '-'); no se suman paises porque el Census mezcla agregados (OCDE, USMCA...) con paises. Se comprueba la unidad.
Uso: python3 scripts/update-us-sulphur.py [--fixture fichero.json]  (con --fixture lee ese JSON del Census en lugar de la red; para los tests)."""
import datetime, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://api.census.gov/data/timeseries/intltrade/imports/hs"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
SINCE = "2015-01"
MIN_T = 500.0
FACTOR = {"KG": 0.001, "T": 1.0}   # unidad de cantidad del Census -> toneladas metricas (en HS 2503 las lineas de 10 digitos vienen en T; se comprueba en cada ejecucion)
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "us-sulphur-log.txt").write_text("\n".join(LOG))
    except Exception: pass


ATTEMPTS = [("HS4", ["2503"]), ("HS10", ["2503000010", "2503000090"])]   # si el total HS4 no trae cantidad, se suman las lineas de 10 digitos


def fetch(key, level, code, tries=4):
    q = urllib.parse.urlencode({"get": "GEN_VAL_MO,GEN_QY1_MO,CON_VAL_MO,CON_QY1_MO,CON_CIF_MO,CON_CHA_MO,DUT_VAL_MO,UNIT_QY1,CTY_CODE,CTY_NAME", "COMM_LVL": level, "I_COMMODITY": code, "time": "from " + SINCE, "key": key})
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=120) as r:
                body = r.read().decode("utf-8", "replace")
                if r.geturl().endswith("missing_key.html") or body.lstrip().startswith("<"): raise RuntimeError("el Census no acepto la clave")
                return json.loads(body)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def diag(code, rows):
    """Diagnostico en el log: por año y linea, toneladas e importes (MUSD) de las importaciones generales y para consumo (valor, CIF, cargos, dutiable); sirve para elegir la medida coherente."""
    try:
        h = rows[0]; F = ("GEN_QY1_MO", "GEN_VAL_MO", "CON_QY1_MO", "CON_VAL_MO", "CON_CIF_MO", "CON_CHA_MO", "DUT_VAL_MO")
        ix = {k: h.index(k) for k in F + ("CTY_CODE", "time")}
        yr = {}
        for r in rows[1:]:
            if (r[ix["CTY_CODE"]] or "").strip() != "-": continue
            a = yr.setdefault(r[ix["time"]][:4], [0.0] * len(F))
            for i, k in enumerate(F): a[i] += float(r[ix[k]] or 0)
        for y, a in sorted(yr.items())[-4:]:
            log("diag %s %s: gen %d kt %.0f MUSD | consumo %d kt, valor %.0f, CIF %.0f, cargos %.0f, dutiable %.0f MUSD" % (code, y, a[0] / 1000, a[1] / 1e6, a[2] / 1000, a[3] / 1e6, a[4] / 1e6, a[5] / 1e6, a[6] / 1e6))
    except Exception as e: log("diag %s fallo: %r" % (code, e))


def parse(rows):
    """Lista de listas del Census (primera fila = cabecera) -> {periodo: [USD, toneladas]}; devuelve tambien las unidades vistas."""
    h = rows[0]; ix = {k: h.index(k) for k in ("CON_VAL_MO", "CON_QY1_MO", "UNIT_QY1", "CTY_CODE", "time")}
    world = {}; units = set()
    for r in rows[1:]:
        try: v = float(r[ix["CON_VAL_MO"]]); q = float(r[ix["CON_QY1_MO"]])
        except (TypeError, ValueError): continue
        u = (r[ix["UNIT_QY1"]] or "").strip(); units.add(u); p = r[ix["time"]][:7]; code = (r[ix["CTY_CODE"]] or "").strip()
        f = FACTOR.get(u)
        if f is None: continue      # unidad desconocida (p. ej. '-' en los totales HS4, que no traen cantidad): no se interpreta
        if code == "-":
            w = world.setdefault(p, [0.0, 0.0]); w[0] += v; w[1] += q * f      # varias lineas HS10 se suman
    return world, units, bool(world)


def build(months):
    pts = []
    for p, (usd, t) in sorted(months.items()):
        if usd and t and t >= MIN_T: pts.append([p, round(usd / t, 1), round(t), round(usd)])
    return pts


def main():
    if "--fixture" in sys.argv: rows = json.load(open(sys.argv[sys.argv.index("--fixture") + 1]))
    else:
        key = os.environ.get("CENSUS_API_KEY", "").strip()
        if not key: raise SystemExit("FALLO: falta el secreto CENSUS_API_KEY")
        rows = None
    pts = []
    for level, codes in ATTEMPTS:
        if rows is None:
            got = []
            for code in codes:
                try: r = fetch(key, level, code)
                except Exception as e: log("%s %s: %s" % (level, code, e)); continue
                got += r if not got else r[1:]
                if level == "HS10": diag(code, r)
        else: got = rows
        if not got: continue
        months, units, from_total = parse(got)
        log("%s: filas %d, unidades %s, total mundial en la fuente: %s" % (level, len(got) - 1, sorted(units), from_total))
        if not units & set(FACTOR): log("%s: sin unidad de cantidad conocida (%s): se descarta" % (level, sorted(units))); continue
        if units - set(FACTOR) - {"-", ""}: log("%s: unidades inesperadas %s: se descarta" % (level, sorted(units))); continue
        pts = build(months)
        if len(pts) >= 24: break
        if len(pts) < 24: raise SystemExit("FALLO: el Census devolvio datos insuficientes (%d meses con volumen)" % len(pts))
    ann = {}
    for p, v, t, usd in pts: ann[p[:4]] = ann.get(p[:4], 0) + t
    log("toneladas por año (meses con volumen): " + ", ".join("%s %d kt" % (y, round(t / 1000)) for y, t in sorted(ann.items())[-4:]))
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestPeriod": pts[-1][0],
           "source": {"id": "census", "name": "U.S. Census Bureau, International Trade API, HS 2503 sulphur, imports for consumption", "url": "https://www.census.gov/foreign-trade/index.html", "license": "US public domain (credit Census Bureau)"},
           "unit": "USD/t", "minTonnes": MIN_T, "pointFields": ["period", "unitValueUsdPerTonne", "tonnes", "valueUsd"], "points": pts}
    (ROOT / "data" / "us-sulphur.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("us-sulphur.json: %d meses, ultimo %s, %s USD/t" % (len(pts), pts[-1][0], pts[-1][1]))


if __name__ == "__main__":
    main()

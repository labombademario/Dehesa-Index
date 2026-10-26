#!/usr/bin/env python3
"""Valor unitario de importacion de fertilizantes de EE. UU. por producto (y origen), mensual (US Census Bureau, API de comercio exterior, dominio publico).
Escribe data/us-fertilizer-imports.json y data/us-fertilizer-imports-log.txt. Necesita el secreto CENSUS_API_KEY (el mismo de update-us-sulphur.py).
 - Productos: los fertilizantes del monitor Comext de la UE (scripts/update-eu-input-prices.py), con el mismo codigo SA de 6 cifras, para que se comparen fila a fila:
   urea 310210, nitrato amonico 310230, UAN 310280, sulfato amonico 310221, cloruro potasico 310420, DAP 310530, NPK 310520, amoniaco anhidro 281410 (en la UE, 2814 entero)
   y acido fosforico 280920 (en la UE, 2809 entero).
 - Calculo (el unico): importaciones generales, valor de aduana (GEN_VAL_MO) entre cantidad (GEN_QY1_MO) = USD por tonelada. Se suman las lineas de 10 cifras de cada codigo,
   solo las que vienen en toneladas o kilos (si una linea trae otra unidad se descarta y se anota). Total mundial = fila CTY_CODE '-'. Un mes con menos de MIN_T
   toneladas no da precio. Es lo que costo en aduana lo realmente importado (sin flete interior ni margen), no un precio de mercado.
 - Origenes: reparto de las toneladas de los ultimos 12 meses con dato entre paises (codigos de pais del Census de 4 cifras, no agregados).
Uso: python3 scripts/update-us-fertilizer-imports.py [--fixture fichero.json]  (con --fixture lee una lista de filas del Census con columna I_COMMODITY; para los tests)."""
import datetime, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://api.census.gov/data/timeseries/intltrade/imports/hs"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
SINCE = "2016-01"
MIN_T = 500.0
FACTOR = {"KG": 0.001, "T": 1.0}
# id del monitor UE (cn), codigo SA6 del Census
PRODUCTS = [("310210", "310210"), ("310230", "310230"), ("310280", "310280"), ("310221", "310221"), ("310420", "310420"), ("310530", "310530"), ("310520", "310520"), ("2814", "281410"), ("2809", "280920")]
# nombre del Census -> ISO 3166-1 alfa-2 (solo para las banderas y el nombre traducido; un pais que no este aqui se publica con su nombre)
ISO = {"CANADA": "CA", "RUSSIA": "RU", "TRINIDAD AND TOBAGO": "TT", "QATAR": "QA", "SAUDI ARABIA": "SA", "OMAN": "OM", "ALGERIA": "DZ", "EGYPT": "EG", "MOROCCO": "MA", "MEXICO": "MX",
       "BAHRAIN": "BH", "UNITED ARAB EMIRATES": "AE", "NIGERIA": "NG", "CHINA": "CN", "VENEZUELA": "VE", "ISRAEL": "IL", "BELGIUM": "BE", "NETHERLANDS": "NL", "GERMANY": "DE", "JORDAN": "JO",
       "AUSTRALIA": "AU", "KOREA, SOUTH": "KR", "JAPAN": "JP", "BRAZIL": "BR", "CHILE": "CL", "PERU": "PE", "LITHUANIA": "LT", "ESTONIA": "EE", "BELARUS": "BY", "UKRAINE": "UA",
       "TURKEY": "TR", "TURKIYE": "TR", "INDIA": "IN", "INDONESIA": "ID", "MALAYSIA": "MY", "KUWAIT": "KW", "IRELAND": "IE", "NORWAY": "NO", "POLAND": "PL", "UZBEKISTAN": "UZ",
       "KAZAKHSTAN": "KZ", "ARGENTINA": "AR", "COLOMBIA": "CO", "FRANCE": "FR", "SPAIN": "ES", "ITALY": "IT", "UNITED KINGDOM": "GB", "LATVIA": "LV", "FINLAND": "FI", "SWEDEN": "SE",
       "DENMARK": "DK", "AUSTRIA": "AT", "SWITZERLAND": "CH", "GUATEMALA": "GT", "TAIWAN": "TW", "VIETNAM": "VN", "THAILAND": "TH", "PHILIPPINES": "PH", "SOUTH AFRICA": "ZA",
       "TUNISIA": "TN", "LIBYA": "LY", "IRAQ": "IQ", "IRAN": "IR", "SINGAPORE": "SG", "HONG KONG": "HK", "GEORGIA": "GE", "AZERBAIJAN": "AZ", "TURKMENISTAN": "TM", "ROMANIA": "RO",
       "BULGARIA": "BG", "CROATIA": "HR", "SLOVAKIA": "SK", "CZECH REPUBLIC": "CZ", "CZECHIA": "CZ", "HUNGARY": "HU", "PORTUGAL": "PT", "GREECE": "GR", "ECUADOR": "EC", "DOMINICAN REPUBLIC": "DO"}
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "us-fertilizer-imports-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def fetch(key, hs6, tries=4):
    q = urllib.parse.urlencode({"get": "I_COMMODITY,GEN_VAL_MO,GEN_QY1_MO,UNIT_QY1,CTY_CODE,CTY_NAME", "COMM_LVL": "HS10", "I_COMMODITY": hs6 + "*", "time": "from " + SINCE, "key": key})
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=180) as r:
                if r.status == 204: return []
                body = r.read().decode("utf-8", "replace")
                if r.geturl().endswith("missing_key.html") or body.lstrip().startswith("<"): raise RuntimeError("el Census no acepto la clave o la consulta")
                return json.loads(body) if body.strip() else []
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def parse(rows):
    """filas del Census (la primera es la cabecera) -> ({mes: [USD, t]} del total mundial, {pais: {mes: t}}, unidades vistas, unidades descartadas)"""
    if not rows: return {}, {}, set(), set()
    h = rows[0]; ix = {k: h.index(k) for k in ("GEN_VAL_MO", "GEN_QY1_MO", "UNIT_QY1", "CTY_CODE", "CTY_NAME", "time")}
    world, cty, seen, bad = {}, {}, set(), set()
    for r in rows[1:]:
        u = (r[ix["UNIT_QY1"]] or "").strip(); seen.add(u); f = FACTOR.get(u)
        if f is None: bad.add(u); continue
        try: v = float(r[ix["GEN_VAL_MO"]]); q = float(r[ix["GEN_QY1_MO"]]) * f
        except (TypeError, ValueError): continue
        p = r[ix["time"]][:7]; code = (r[ix["CTY_CODE"]] or "").strip()
        if code == "-":
            w = world.setdefault(p, [0.0, 0.0]); w[0] += v; w[1] += q
        elif re.fullmatch(r"[1-7]\d{3}", code) and q > 0:
            name = (r[ix["CTY_NAME"]] or "").strip().upper()
            c = cty.setdefault(ISO.get(name, name.title()), {}); c[p] = c.get(p, 0.0) + q
    return world, cty, seen, bad


def build(world, cty):
    pts = [[p, round(usd / t, 1), round(t), round(usd)] for p, (usd, t) in sorted(world.items()) if usd > 0 and t >= MIN_T]
    if not pts: return None
    last12 = [p for p, _, _, _ in pts][-12:]
    tot = sum(sum(m.get(p, 0.0) for p in last12) for m in cty.values())
    top = sorted(((c, sum(m.get(p, 0.0) for p in last12)) for c, m in cty.items()), key=lambda x: -x[1])
    origins = {"from": last12[0], "to": last12[-1], "tonnes": round(tot), "top": [[c, round(t / tot * 100, 1)] for c, t in top[:6] if t > 0]} if tot > 0 else None
    return {"points": pts, "origins": origins}


def main():
    out = {}
    if "--fixture" in sys.argv:
        rows = json.load(open(sys.argv[sys.argv.index("--fixture") + 1]))
        h = rows[0]; ci = h.index("I_COMMODITY")
        for cn, hs6 in PRODUCTS:
            sub = [h] + [r for r in rows[1:] if str(r[ci]).startswith(hs6)]
            w, c, seen, bad = parse(sub); b = build(w, c)
            if b: out[cn] = dict(hs6=hs6, **b)
    else:
        key = os.environ.get("CENSUS_API_KEY", "").strip()
        if not key: raise SystemExit("FALLO: falta el secreto CENSUS_API_KEY")
        for cn, hs6 in PRODUCTS:
            try: rows = fetch(key, hs6)
            except Exception as e: log("%s: %s" % (hs6, e)); continue
            w, c, seen, bad = parse(rows); b = build(w, c)
            log("%s: %d filas, unidades %s%s, %d meses con precio%s" % (hs6, max(0, len(rows) - 1), sorted(seen), (" (descartadas %s)" % sorted(bad)) if bad else "", len(b["points"]) if b else 0,
                                                                     (", ultimo %s %s USD/t" % (b["points"][-1][0], b["points"][-1][1])) if b else ""))
            if b: out[cn] = dict(hs6=hs6, **b)
            time.sleep(1)
    if len(out) < 6 or "310210" not in out: raise SystemExit("FALLO: el Census devolvio datos insuficientes (%d productos: %s)" % (len(out), sorted(out)))
    latest = max(v["points"][-1][0] for v in out.values())
    if "--fixture" not in sys.argv and (datetime.date.today() - datetime.date(int(latest[:4]), int(latest[5:]), 1)).days > 150: raise SystemExit("FALLO: el ultimo mes (%s) es demasiado antiguo" % latest)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestPeriod": latest,
           "source": {"id": "census", "name": "U.S. Census Bureau, International Trade API, fertiliser imports (HS 3102, 3104, 3105, 2814, 2809), general imports", "url": "https://www.census.gov/foreign-trade/index.html", "license": "US public domain (credit Census Bureau)"},
           "unit": "USD/t", "minTonnes": MIN_T, "pointFields": ["period", "unitValueUsdPerTonne", "tonnes", "valueUsd"], "products": out}
    (ROOT / "data" / "us-fertilizer-imports.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("us-fertilizer-imports.json: %d productos, ultimo mes %s" % (len(out), latest))


if __name__ == "__main__":
    main()

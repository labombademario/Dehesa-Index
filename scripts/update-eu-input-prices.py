#!/usr/bin/env python3
"""Valores unitarios de comercio exterior de insumos agrarios de la UE-27 y sus Estados miembros (Eurostat Comext, DS-045409, CC BY 4.0).
Escribe data/eu-input-prices.json y data/eu-input-prices-log.txt.
 - Productos: fertilizantes (urea, nitrato amonico, UAN, sulfato amonico, cloruro potasico, DAP, NPK, amoniaco, acido fosforico), energia (petroleo y derivados, gas,
   plasticos), piensos (harina de soja, piensos preparados) y otros insumos (fitosanitarios, semillas, tractores).
 - Flujos: importaciones y exportaciones desde/hacia fuera de la UE (socio EXT_EU27_2020); el comercio intra-UE mezcla reexpediciones y distorsiona el precio.
 - Mensual desde 2016: valor (EUR), cantidad (toneladas) y valor unitario = valor / toneladas. Es un valor de aduana de lo realmente comerciado, no un precio de mercado.
   Un mes sin cantidad, sin valor o con menos toneladas que el umbral del producto no da precio (se omite el punto, no se rellena); una serie necesita 24 meses validos.
 - Origenes: por producto, reparto de las importaciones extra-UE de la UE-27 y de cada Estado miembro (con al menos 500 t) por pais de origen en el ultimo año completo (cuota sobre toneladas, 6 mayores).
 - Cereales (trigo, maiz, cebada): mismo valor unitario de importacion, como referencia para cruzar con los fertilizantes (lo hace scripts/build-input-monitor-countries.py).
Uso: python3 scripts/update-eu-input-prices.py [--fixture ruta.json --origins-fixture ruta.json]  (con --fixture lee esos JSON de Comext en lugar de la red; para los tests)."""
import datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
SINCE = "2016-01"
CODES = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"]
COMEXT = {"EL": "GR"}
REPORTERS = ["EU27_2020"] + [COMEXT.get(c, c) for c in CODES]
BACK = {v: k for k, v in COMEXT.items()}
MEMBERS = set(CODES) | {"GR"}
# id, codigo CN, grupo, toneladas minimas al mes, nombre (es, en, fr, it)
P = [
    ("urea", "310210", "fert", 500, ("Urea", "Urea", "Urée", "Urea")),
    ("an", "310230", "fert", 500, ("Nitrato amónico", "Ammonium nitrate", "Nitrate d’ammonium", "Nitrato di ammonio")),
    ("uan", "310280", "fert", 500, ("UAN (urea y nitrato amónico en solución)", "UAN (urea and ammonium nitrate solution)", "UAN (urée et nitrate d’ammonium en solution)", "UAN (urea e nitrato di ammonio in soluzione)")),
    ("as", "310221", "fert", 500, ("Sulfato amónico", "Ammonium sulphate", "Sulfate d’ammonium", "Solfato di ammonio")),
    ("kcl", "310420", "fert", 500, ("Cloruro potásico", "Potassium chloride", "Chlorure de potassium", "Cloruro di potassio")),
    ("dap", "310530", "fert", 500, ("Fosfato diamónico (DAP)", "Diammonium phosphate (DAP)", "Phosphate diammonique (DAP)", "Fosfato biammonico (DAP)")),
    ("npk", "310520", "fert", 500, ("Abonos NPK", "NPK fertilisers", "Engrais NPK", "Concimi NPK")),
    ("nh3", "2814", "fert", 500, ("Amoniaco", "Ammonia", "Ammoniac", "Ammoniaca")),
    ("h3po4", "2809", "fert", 500, ("Ácido fosfórico", "Phosphoric acid", "Acide phosphorique", "Acido fosforico")),
    ("oil", "2710", "energy", 5000, ("Petróleo y derivados (gasóleo, fuelóleo…)", "Petroleum oils (diesel, fuel oil…)", "Huiles de pétrole (gazole, fioul…)", "Oli di petrolio (gasolio, olio combustibile…)")),
    ("gas", "2711", "energy", 5000, ("Gas de petróleo y gas natural (GNL, GLP…)", "Petroleum gases and natural gas (LNG, LPG…)", "Gaz de pétrole et gaz naturel (GNL, GPL…)", "Gas di petrolio e gas naturale (GNL, GPL…)")),
    ("plastics", "3920", "energy", 500, ("Láminas y películas de plástico", "Plastic plates, sheets and films", "Plaques, feuilles et films en plastique", "Lastre, fogli e pellicole di plastica")),
    ("soymeal", "2304", "feed", 5000, ("Harina de soja", "Soya-bean meal", "Tourteaux de soja", "Farina di soia")),
    ("prepfeed", "2309", "feed", 500, ("Piensos preparados", "Prepared animal feed", "Aliments préparés pour animaux", "Mangimi preparati")),
    ("wheat", "1001", "grain", 5000, ("Trigo", "Wheat", "Blé", "Frumento")),
    ("maize", "1005", "grain", 5000, ("Maíz", "Maize", "Maïs", "Mais")),
    ("barley", "1003", "grain", 5000, ("Cebada", "Barley", "Orge", "Orzo")),
    ("pesticides", "3808", "other", 100, ("Fitosanitarios", "Plant-protection products", "Produits phytosanitaires", "Prodotti fitosanitari")),
    ("seeds", "1209", "other", 200, ("Semillas para siembra", "Seeds for sowing", "Semences", "Sementi per semina")),
    ("tractors", "8701", "other", 100, ("Tractores (por tonelada de peso)", "Tractors (per tonne of weight)", "Tracteurs (par tonne de poids)", "Trattori (per tonnellata di peso)")),
]
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-input-prices-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def get(params, tries=4):
    q = urllib.parse.urlencode(dict(params, format="JSON", lang="EN", indicators=["VALUE_IN_EUROS", "QUANTITY_IN_100KG"]), doseq=True)
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=150) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def cells(j):
    """JSON-stat de Comext -> filas {dimension: codigo, 'v': valor}."""
    ids = j["id"]; order = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]
        o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        order[d] = o
    val = j.get("value", {}); items = val.items() if isinstance(val, dict) else enumerate(val)
    for k, v in items:
        if v is None: continue
        k = int(k); rec = {}
        for d in reversed(ids):
            n = len(order[d]); rec[d] = order[d][k % n]; k //= n
        rec["v"] = float(v); yield rec


def parse_monthly(j):
    """-> {(producto, cc): {periodo: [euros, toneladas]}}; cc 'EU' es el agregado UE-27."""
    out = {}
    for r in cells(j):
        rep = r["reporter"]; cc = "EU" if rep == "EU27_2020" else BACK.get(rep, rep)
        cell = out.setdefault((r["product"], cc), {}).setdefault(r["time"], [None, None])
        if r["indicators"] == "VALUE_IN_EUROS": cell[0] = r["v"]
        elif r["indicators"] == "QUANTITY_IN_100KG": cell[1] = r["v"] / 10.0
    return out


def build(raw, min_t):
    """{(producto, cc): meses} -> {producto: {cc: {'points': [[periodo, EUR/t, t]]}}}"""
    out = {}
    for (prod, cc), months in sorted(raw.items()):
        pts = []
        for p, (eur, t) in sorted(months.items()):
            if not eur or not t or t < min_t.get(prod, 500.0): continue
            pts.append([p, round(eur / t, 1), round(t)])
        if len(pts) >= 24: out.setdefault(prod, {})[cc] = {"points": pts}
    return out


def parse_origins(j, year):
    """-> {producto: {declarante: {pais: toneladas}}} del año dado (declarante 'EU' = UE-27), solo paises de origen (ISO2, no miembros de la UE)."""
    out = {}
    for r in cells(j):
        if r["indicators"] != "QUANTITY_IN_100KG" or r["time"] != year: continue
        pa = r["partner"]
        if len(pa) != 2 or pa in MEMBERS or pa in ("EU", "XX", "QZ", "QY", "QX", "QV", "QU", "QW"): continue
        rep = r["reporter"]; cc = "EU" if rep == "EU27_2020" else BACK.get(rep, rep)
        d = out.setdefault(r["product"], {}).setdefault(cc, {}); d[pa] = d.get(pa, 0.0) + r["v"] / 10.0
    return out


def shares(tons, top=6, min_t=0.0):
    tot = sum(tons.values())
    if tot <= 0 or tot < min_t: return None
    best = sorted(tons.items(), key=lambda x: -x[1])[:top]
    return {"tonnes": round(tot), "top": [[c, round(100.0 * t / tot, 1)] for c, t in best if t > 0]}


def main():
    min_t = {p[1]: float(p[3]) for p in P}   # clave: codigo CN
    fixture = "--fixture" in sys.argv
    flows = {"imp": "1", "exp": "2"}; res = {}
    for fl, code in flows.items():
        if fixture:
            raw = parse_monthly(json.load(open(sys.argv[sys.argv.index("--fixture") + 1])))
        else:
            raw = {}
            for pid, cn, grp, mt, names in P:
                try:
                    j = get({"reporter": REPORTERS, "partner": "EXT_EU27_2020", "product": cn, "flow": code, "freq": "M", "sinceTimePeriod": SINCE})
                except Exception as e: log("%s %s: %s" % (fl, cn, e)); continue
                raw.update(parse_monthly(j)); time.sleep(0.5)
        res[fl] = build(raw, min_t)
        log("%s: %d productos con serie, %d series" % (fl, len(res[fl]), sum(len(v) for v in res[fl].values())))
    year = str(datetime.date.today().year - 1)
    origins_raw = {}
    if "--origins-fixture" in sys.argv:
        origins_raw = parse_origins(json.load(open(sys.argv[sys.argv.index("--origins-fixture") + 1])), year)
    elif not fixture:
        for pid, cn, grp, mt, names in P:      # un producto por consulta: declarantes x todos los socios x un año cabe holgado en una respuesta
            try:
                for cn_, byrep in parse_origins(get({"reporter": REPORTERS, "product": cn, "flow": "1", "freq": "A", "sinceTimePeriod": year}), year).items(): origins_raw.setdefault(cn_, {}).update(byrep)
            except Exception as e: log("origenes %s: %s" % (cn, e))
            time.sleep(0.5)
    origins = {}; origins_by = {}
    for pid, cn, grp, mt, names in P:
        for cc, tons in origins_raw.get(cn, {}).items():
            s = shares(tons, min_t=0.0 if cc == "EU" else 500.0)
            if not s: continue
            if cc == "EU": origins[cn] = s
            else: origins_by.setdefault(cn, {})[cc] = s
    products = [{"id": pid, "cn": cn, "group": grp, "name": dict(zip(("es", "en", "fr", "it"), names)), "minTonnes": mt} for pid, cn, grp, mt, names in P if cn in res["imp"] or cn in res["exp"]]
    if "EU" not in res["imp"].get("310210", {}) or len(products) < 8: raise SystemExit("FALLO: Comext devolvio datos insuficientes (%d productos)" % len(products))
    last = max(c["points"][-1][0] for fl in res.values() for v in fl.values() for c in v.values())
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestPeriod": last, "originsYear": year,
           "source": {"id": "eurostat_comext", "name": "Eurostat Comext (DS-045409), trade with non-EU countries, unit values", "url": "https://ec.europa.eu/eurostat/web/international-trade-in-goods/data/database", "license": "CC BY 4.0"},
           "unit": "EUR/t", "pointFields": ["period", "unitValueEurPerTonne", "tonnes"], "products": products,
           "imports": {k: v for k, v in res["imp"].items()}, "exports": {k: v for k, v in res["exp"].items()}, "origins": origins, "originsByCountry": origins_by}
    (ROOT / "data" / "eu-input-prices.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-input-prices.json: %d productos, ultimo mes %s, origenes de %d productos UE-27 y %d paises (%s)" % (len(products), last, len(origins), sum(len(v) for v in origins_by.values()), year))


if __name__ == "__main__":
    main()

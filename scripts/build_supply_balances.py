#!/usr/bin/env python3
"""data/supply-balances/<país>.json — balances oficiales de oferta y demanda por país (pestañas de oferta-demanda.html).
Formato común para todos los países (lo lee js/oferta-demanda-paises.js; lo valida schemas/supply-balances.schema.json y contract_tests.supply_balances):

  cards = partidas de las tarjetas de arriba; chart = partidas del gráfico de líneas (las dos listas, subconjuntos de items).
  campaigns[año][v][producto][partida] = número en miles de toneladas. Partida ausente = la fuente no la publica: NO se rellena ni se calcula.
  items = partidas que la fuente publica, en el orden de la tabla (sub = nivel de sangría; strong = negrita).
  stocksToUse = cómo se calcula existencias/uso (num ÷ suma de den) para esa fuente; se rotula en la página.

Aquí: la librería común (write) y Canadá (Statistics Canada 32-10-0013), derivada de data/canada-stats.json sin llamadas nuevas a la red.
Uso: python3 scripts/build_supply_balances.py ca
"""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "supply-balances"
LANGS = ("es", "en", "fr", "it")


def T(es, en, fr, it):
    return {"es": es, "en": en, "fr": fr, "it": it}


def write(cc, doc):
    """Comprobaciones mínimas antes de escribir: mejor no publicar que publicar roto."""
    item_ids = [i["id"] for i in doc["items"]]
    assert len(item_ids) == len(set(item_ids)), "partidas repetidas"
    prod_ids = [p["id"] for p in doc["products"]]
    assert len(prod_ids) == len(set(prod_ids)), "productos repetidos"
    assert doc["campaigns"], "sin campañas"
    for y, c in doc["campaigns"].items():
        for p, vals in c["v"].items():
            assert p in prod_ids, "producto desconocido %s" % p
            for k, v in vals.items():
                assert k in item_ids, "partida desconocida %s" % k
                assert isinstance(v, (int, float)) and not isinstance(v, bool), "valor no numérico %s/%s/%s" % (y, p, k)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / (cc.lower() + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


# ---------------------------------------------------------------- Canadá

CA_PRODUCTS = [  # (id, prefijo de serie en canada-stats.json, nombre)
    ("wheat", "ca-gb-all-wheat", T("Trigo (total)", "Wheat (all)", "Blé (total)", "Frumento (totale)")),
    ("durum", "ca-gb-durum-wheat", T("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro")),
    ("barley", "ca-gb-barley", T("Cebada", "Barley", "Orge", "Orzo")),
    ("oats", "ca-gb-oats", T("Avena", "Oats", "Avoine", "Avena")),
    ("rye", "ca-gb-rye", T("Centeno", "Rye", "Seigle", "Segale")),
    ("canola", "ca-gb-canola", T("Colza (canola)", "Canola", "Colza (canola)", "Colza (canola)")),
    ("soybeans", "ca-gb-soybeans", T("Soja", "Soybeans", "Soja", "Soia")),
    ("flaxseed", "ca-gb-flaxseed", T("Lino (semilla)", "Flaxseed", "Lin (graine)", "Lino (semi)")),
    ("peas", "ca-gb-dry-peas", T("Guisante seco", "Dry peas", "Pois secs", "Pisello secco")),
    ("lentils", "ca-gb-lentils", T("Lenteja", "Lentils", "Lentilles", "Lenticchia")),
]
CA_ITEMS = [  # (id, sufijo de serie, nombre, sangría, negrita)
    ("totalSupply", "total-supplies", T("Oferta total", "Total supplies", "Offre totale", "Offerta totale"), 0, True),
    ("production", "production", T("Producción", "Production", "Production", "Produzione"), 1, False),
    ("exports", "exports", T("Exportaciones", "Exports", "Exportations", "Esportazioni"), 0, False),
    ("domestic", "domestic-disappearance", T("Consumo interno", "Domestic disappearance", "Utilisation intérieure", "Consumo interno"), 0, False),
    ("endingStocks", "ending-stocks", T("Existencias finales", "Ending stocks", "Stocks finaux", "Scorte finali"), 0, True),
]
CA_FIRST = 2006  # últimas 20 campañas: lo anterior pesa y no se consulta


def build_ca():
    src = json.loads((ROOT / "data" / "canada-stats.json").read_text(encoding="utf-8"))
    S = {s["id"]: s for s in src["countries"]["CA"]["series"]}
    camps, missing = {}, []
    for pid, prefix, _ in CA_PRODUCTS:
        for iid, suffix, _n, _s, _b in CA_ITEMS:
            s = S.get(prefix + "-" + suffix)
            if not s:
                missing.append(prefix + "-" + suffix); continue
            assert s.get("unit") == "thousand t", "unidad inesperada en %s: %r" % (s["id"], s.get("unit"))
            for per, v in s["points"]:
                if int(per) < CA_FIRST or v is None: continue
                c = camps.setdefault(per, {"label": "%s/%02d" % (per, (int(per) + 1) % 100), "v": {}})
                c["v"].setdefault(pid, {})[iid] = v
    if missing: raise SystemExit("faltan series de balance en canada-stats.json: %s" % ", ".join(missing[:5]))
    doc = {
        "schemaVersion": 1,
        "generatedAt": src["generatedAt"],
        "country": "CA",
        "sourceId": "statcan",
        "source": {"name": "Statistics Canada", "table": "32-10-0013-01", "url": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210001301"},
        "unit": "kt",
        "note": T(
            "Campaña agrícola de agosto a julio: 2025/26 va de agosto de 2025 a julio de 2026. «Oferta total» incluye las existencias iniciales y las importaciones, que esta tabla de Statistics Canada no publica por separado. Cifras tal como las publica la fuente; Statistics Canada puede revisar las campañas recientes.",
            "Crop year August to July: 2025/26 runs from August 2025 to July 2026. “Total supplies” includes beginning stocks and imports, which this Statistics Canada table does not publish separately. Figures as published by the source; Statistics Canada may revise recent crop years.",
            "Campagne d’août à juillet : 2025/26 va d’août 2025 à juillet 2026. « Offre totale » inclut les stocks initiaux et les importations, que ce tableau de Statistique Canada ne publie pas séparément. Chiffres tels que publiés par la source ; Statistique Canada peut réviser les campagnes récentes.",
            "Campagna da agosto a luglio: 2025/26 va da agosto 2025 a luglio 2026. «Offerta totale» include le scorte iniziali e le importazioni, che questa tabella di Statistics Canada non pubblica separatamente. Cifre come pubblicate dalla fonte; Statistics Canada può rivedere le campagne recenti."),
        "items": [{"id": i, "name": n, "sub": sub, "strong": strong} for i, _s, n, sub, strong in CA_ITEMS],
        "cards": ["production", "domestic", "exports", "endingStocks"],
        "chart": ["production", "domestic", "exports"],
        "stocksToUse": {"num": "endingStocks", "den": ["domestic", "exports"]},
        "identity": {"total": "totalSupply", "minus": ["exports", "domestic"], "equals": "endingStocks", "tolerancePct": 0.5},
        "products": [{"id": p, "name": n} for p, _pf, n in CA_PRODUCTS],
        "campaigns": dict(sorted(camps.items())),
    }
    write("ca", doc)
    return doc


if __name__ == "__main__":
    which = sys.argv[1:] or ["ca"]
    for w in which:
        {"ca": build_ca}[w]()
        print("supply-balances/%s.json escrito" % w)

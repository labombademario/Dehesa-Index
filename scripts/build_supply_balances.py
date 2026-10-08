#!/usr/bin/env python3
"""data/supply-balances/<país>.json — balances oficiales de oferta y demanda por país (pestañas de oferta-demanda.html).
Formato común para todos los países (lo lee js/oferta-demanda-paises.js; lo valida schemas/supply-balances.schema.json y contract_tests.supply_balances):

  cards = partidas de las tarjetas de arriba; chart = partidas del gráfico de líneas (las dos listas, subconjuntos de items).
  campaigns[año][v][producto][partida] = número en miles de toneladas. Partida ausente = la fuente no la publica: NO se rellena ni se calcula.
  items = partidas que la fuente publica, en el orden de la tabla (sub = nivel de sangría; strong = negrita).
  stocksToUse = cómo se calcula existencias/uso (num ÷ suma de den) para esa fuente; se rotula en la página.

Aquí: la librería común (write) y Canadá (Statistics Canada 32-10-0013), derivada de data/canada-stats.json sin llamadas nuevas a la red.
Uso: python3 scripts/build_supply_balances.py ca
     python3 scripts/build_supply_balances.py eu <Cereals_bs_EUROPA_EU.xlsx>   (lo descarga scripts/update-eu-balances.py)
     python3 scripts/build_supply_balances.py fr <BIL-CER-cer_princ-camp-*.pdf> [SCR-CER-historique_bilans_prev-*.xlsx]  (OCR + Excel histórico; a mano, ver build_fr)
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


# ---------------------------------------------------------------- Unión Europea
# Comisión Europea (DG AGRI), «Cereals supply & demand» (Cereals_bs_EUROPA_EU.xlsx): una hoja por campaña (julio-junio),
# productos en columnas y partidas en filas. Se localizan por el TEXTO de cabeceras y filas, no por posición: si la
# Comisión cambia el libro de forma que no se reconoce, el script falla y se conserva el JSON anterior.
EU_PRODUCTS = [  # (id, cabecera en el Excel, nombre)
    ("wheat", "common wheat", T("Trigo blando", "Common wheat", "Blé tendre", "Frumento tenero")),
    ("barley", "barley", T("Cebada", "Barley", "Orge", "Orzo")),
    ("durum", "durum wheat", T("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro")),
    ("maize", "maize", T("Maíz", "Maize", "Maïs", "Mais")),
    ("rye", "rye", T("Centeno", "Rye", "Seigle", "Segale")),
    ("sorghum", "sorghum", T("Sorgo", "Sorghum", "Sorgho", "Sorgo")),
    ("oats", "oats", T("Avena", "Oats", "Avoine", "Avena")),
    ("triticale", "triticale", T("Triticale", "Triticale", "Triticale", "Triticale")),
    ("total", "total cereals", T("Total cereales", "Total cereals", "Total céréales", "Totale cereali")),
]
EU_ITEMS = [  # (id, fila en el Excel, nombre, sangría, negrita)
    ("beginStocks", "beginning stocks", T("Existencias iniciales", "Beginning stocks", "Stocks initiaux", "Scorte iniziali"), 0, False),
    ("production", "usable production", T("Producción utilizable", "Usable production", "Production utilisable", "Produzione utilizzabile"), 0, False),
    ("imports", "imports (from third countries)", T("Importaciones (países terceros)", "Imports (third countries)", "Importations (pays tiers)", "Importazioni (paesi terzi)"), 0, False),
    ("totalSupply", "total supply", T("Oferta total", "Total supply", "Offre totale", "Offerta totale"), 0, True),
    ("domestic", "total domestic use", T("Consumo interno", "Total domestic use", "Utilisation intérieure", "Consumo interno"), 0, True),
    ("food", "human consumption", T("Consumo humano", "Human consumption", "Consommation humaine", "Consumo umano"), 1, False),
    ("seed", "seed", T("Semilla", "Seed", "Semences", "Sementi"), 1, False),
    ("industrial", "industrial uses", T("Usos industriales", "Industrial uses", "Usages industriels", "Usi industriali"), 1, False),
    ("feed", "animal feed", T("Alimentación animal", "Animal feed", "Alimentation animale", "Alimentazione animale"), 1, False),
    ("losses", "losses", T("Pérdidas", "Losses", "Pertes", "Perdite"), 1, False),
    ("exports", "exports (to third countries)", T("Exportaciones (países terceros)", "Exports (third countries)", "Exportations (pays tiers)", "Esportazioni (paesi terzi)"), 0, False),
    ("totalUse", "total use", T("Uso total", "Total use", "Utilisation totale", "Utilizzo totale"), 0, True),
    ("endingStocks", "ending stocks", T("Existencias finales", "Ending stocks", "Stocks finaux", "Scorte finali"), 0, True),
]


def _close(a, b, pct, floor=5.0):
    return abs(a - b) <= max(floor, pct / 100.0 * max(abs(a), abs(b)))


def build_eu(xlsx):
    import openpyxl, re
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    pid_by_head = {h: p for p, h, _n in EU_PRODUCTS}
    row_by_label = {l: i for i, l, _n, _s, _b in EU_ITEMS}
    camps, updated = {}, None
    for ws in wb.worksheets:
        if not re.match(r"^\d{4}-\d{2}", ws.title): continue  # hojas de campaña: «2024-25 estimation», «2023-24»…
        label = hdr = None
        for r in range(1, 8):
            for c in range(1, 8):
                v = ws.cell(r, c).value
                if isinstance(v, str):
                    m = re.match(r"^(\d{4})/(\d{2})\b", v.strip())
                    if m and label is None: label = (m.group(1), m.group(1) + "/" + m.group(2))
                    m2 = re.search(r"last updated:\s*(\d{2})/(\d{2})/(\d{4})", v)
                    if m2: updated = "%s-%s-%s" % (m2.group(3), m2.group(2), m2.group(1))
        cols = {}
        for r in range(1, 8):
            found = {}
            for c in range(1, ws.max_column + 1):
                v = ws.cell(r, c).value
                if isinstance(v, str) and v.strip().lower() in pid_by_head: found[pid_by_head[v.strip().lower()]] = c
            if len(found) >= 6: cols, hdr = found, r; break
        if not label or not hdr: raise SystemExit("hoja «%s»: no se reconoce campaña o cabecera" % ws.title)
        if set(cols) != set(pid_by_head.values()): raise SystemExit("hoja «%s»: faltan productos %s" % (ws.title, sorted(set(pid_by_head.values()) - set(cols))))
        rows = {}
        for r in range(hdr + 1, ws.max_row + 1):
            for c in (2, 3):
                v = ws.cell(r, c).value
                if isinstance(v, str):
                    k = v.strip().rstrip("*").strip().lower()
                    if k in row_by_label and row_by_label[k] not in rows: rows[row_by_label[k]] = r
        if set(rows) != set(row_by_label.values()): raise SystemExit("hoja «%s»: faltan partidas %s" % (ws.title, sorted(set(row_by_label.values()) - set(rows))))
        v = {}
        for p, c in cols.items():
            d = {}
            for i, r in rows.items():
                x = ws.cell(r, c).value
                if isinstance(x, bool) or not isinstance(x, (int, float)): raise SystemExit("hoja «%s» %s/%s: valor no numérico %r" % (ws.title, p, i, x))
                d[i] = round(float(x), 1)
            v[p] = d
        camps[label[0]] = {"label": label[1], "v": v}
    if len(camps) < 3: raise SystemExit("solo %d campañas reconocidas" % len(camps))
    # Cuadre interno de cada balance: si el libro cambia de significado, no se publica.
    for y, c in camps.items():
        for p, d in c["v"].items():
            ctx = "%s/%s" % (c["label"], p)
            assert _close(d["beginStocks"] + d["production"] + d["imports"], d["totalSupply"], 0.5), "oferta no cuadra " + ctx
            assert _close(d["domestic"] + d["exports"], d["totalUse"], 0.5), "uso total no cuadra " + ctx
            assert _close(d["food"] + d["seed"] + d["industrial"] + d["feed"] + d["losses"], d["domestic"], 1.0), "consumo interno no cuadra " + ctx
            assert _close(d["totalSupply"] - d["totalUse"], d["endingStocks"], 0.5), "existencias finales no cuadran " + ctx
            assert min(d.values()) >= 0, "valor negativo " + ctx
        nxt = camps.get(str(int(y) + 1))
        if nxt:
            for p, d in c["v"].items():
                assert _close(d["endingStocks"], nxt["v"][p]["beginStocks"], 0.5), "existencias finales ≠ iniciales siguientes %s/%s" % (c["label"], p)
    doc = {
        "schemaVersion": 1,
        "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "country": "EU",
        "sourceId": "eu_agrifood",
        "source": {"name": "European Commission, DG AGRI — Cereals supply & demand", "table": "Cereals_bs_EUROPA_EU.xlsx" + ((" (last updated " + updated + ")") if updated else ""),
                   "url": "https://agriculture.ec.europa.eu/data-and-analysis/markets/overviews/balance-sheets-sector_en"},
        "unit": "kt",
        "note": T(
            "UE-27. Campaña de julio a junio: 2025/26 va de julio de 2025 a junio de 2026. Los balances de la Comisión mezclan estimación (campaña más reciente cerrada), previsión (campaña en curso) y proyección (campaña siguiente), y se revisan en cada actualización. Importaciones y exportaciones son solo con países terceros (no cuenta el comercio dentro de la UE). «Consumo interno» suma consumo humano, semilla, usos industriales, alimentación animal y pérdidas. El libro incluye las campañas más recientes, no una serie larga.",
            "EU-27. Marketing year July to June: 2025/26 runs from July 2025 to June 2026. The Commission’s balance sheets mix estimates (latest closed year), forecasts (current year) and projections (next year), and are revised at each update. Imports and exports are with third countries only (intra-EU trade is not counted). “Total domestic use” adds human consumption, seed, industrial uses, animal feed and losses. The workbook covers the most recent years, not a long series.",
            "UE-27. Campagne de juillet à juin : 2025/26 va de juillet 2025 à juin 2026. Les bilans de la Commission mêlent estimation (dernière campagne close), prévision (campagne en cours) et projection (campagne suivante), et sont révisés à chaque mise à jour. Importations et exportations concernent uniquement les pays tiers (hors commerce intra-UE). « Utilisation intérieure » additionne consommation humaine, semences, usages industriels, alimentation animale et pertes. Le classeur couvre les campagnes récentes, pas une longue série.",
            "UE-27. Campagna da luglio a giugno: 2025/26 va da luglio 2025 a giugno 2026. I bilanci della Commissione mescolano stima (ultima campagna chiusa), previsione (campagna in corso) e proiezione (campagna successiva) e vengono rivisti a ogni aggiornamento. Importazioni ed esportazioni riguardano solo i paesi terzi (escluso il commercio intra-UE). «Consumo interno» somma consumo umano, sementi, usi industriali, alimentazione animale e perdite. La cartella include le campagne recenti, non una serie lunga."),
        "items": [{"id": i, "name": n, "sub": sub, "strong": strong} for i, _l, n, sub, strong in EU_ITEMS],
        "cards": ["production", "domestic", "exports", "endingStocks"],
        "chart": ["production", "domestic", "exports"],
        "stocksToUse": {"num": "endingStocks", "den": ["domestic", "exports"]},
        "identity": {"total": "totalSupply", "minus": ["totalUse"], "equals": "endingStocks", "tolerancePct": 0.5},
        "products": [{"id": p, "name": n} for p, _h, n in EU_PRODUCTS],
        "campaigns": dict(sorted(camps.items())),
    }
    write("eu", doc)
    return doc


# ---------------------------------------------------------------- Francia
# FranceAgriMer, «Bilans céréaliers annuels» (PDF mensual, sin capa de texto): trigo blando, cebada, maíz grano y trigo duro, 2017/18-2026/27.
# Lectura por OCR con varias configuraciones; una cifra solo se acepta si el balance de esa campaña cuadra (oferta, uso total, existencias)
# y las existencias finales de cada campaña coinciden con las iniciales de la siguiente. Lo que no cuadra no se publica.
# No hay pipeline automático: el PDF cambia de URL cada mes. Para actualizar: descargar el PDF y ejecutar
#   python3 scripts/build_supply_balances.py fr <PDF>      (necesita poppler-utils y tesseract-ocr)
FR_PAGES = [  # (id, página del PDF, nombre)
    ("wheat", 3, T("Trigo blando", "Common wheat", "Blé tendre", "Frumento tenero")),
    ("barley", 4, T("Cebada", "Barley", "Orge", "Orzo")),
    ("maize", 5, T("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella")),
    ("durum", 6, T("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro")),
]
FR_ITEMS = [  # (id, regex de etiqueta, nombre, sangría, negrita)
    ("beginStocks", r"^stock initial sur", T("Existencias iniciales", "Beginning stocks", "Stock initial", "Scorte iniziali"), 0, False),
    ("collecte", r"^collecte", T("Cosecha comercializada (collecte)", "Marketed crop (collecte)", "Collecte (production commercialisée)", "Raccolto commercializzato (collecte)"), 0, False),
    ("imports", r"^importations", T("Importaciones", "Imports", "Importations", "Importazioni"), 0, False),
    ("adjustment", r"^ajustement", T("Ajuste", "Adjustment", "Ajustement", "Rettifica"), 0, False),
    ("totalSupply", r"total ressources", T("Recursos totales del mercado", "Total market resources", "Total ressources pour le marché", "Risorse totali del mercato"), 0, True),
    ("domestic", r"^total uti\w*sations domestiques", T("Usos interiores", "Domestic uses", "Utilisations domestiques", "Utilizzi interni"), 0, True),
    ("exports", r"^total exportations", T("Exportaciones (grano, harina y malta)", "Exports (grain, flour and malt)", "Exportations (grains, farine et malt)", "Esportazioni (granella, farina e malto)"), 0, True),
    ("totalUse", r"^total utilisations par le march", T("Usos totales del mercado", "Total market uses", "Total utilisations par le marché", "Utilizzi totali del mercato"), 0, True),
    ("endingStocks", r"^stock final sur le march", T("Existencias finales", "Ending stocks", "Stock final", "Scorte finali"), 0, True),
]
FR_COLS = {i: 2017 + i for i in range(9)}
FR_COLS[10] = 2026  # col. 9 = previsión de julio de 2026/27: se usa la de septiembre (la más reciente)
FR_REQ = ("beginStocks", "collecte", "totalSupply", "domestic", "exports", "totalUse", "endingStocks")


FR_XLSX = [  # (id, hoja del Excel histórico, nombre)
    ("wheat", "Blé tendre", T("Trigo blando", "Common wheat", "Blé tendre", "Frumento tenero")),
    ("barley", "Orges", T("Cebada", "Barley", "Orge", "Orzo")),
    ("maize", "Maïs", T("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella")),
    ("durum", "Blé dur", T("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro")),
    ("triticale", "Triticale", T("Triticale", "Triticale", "Triticale", "Triticale")),
    ("oats", "Avoine", T("Avena", "Oats", "Avoine", "Avena")),
    ("rye", "Seigle", T("Centeno", "Rye", "Seigle", "Segale")),
    ("sorghum", "Sorgho", T("Sorgo", "Sorghum", "Sorgho", "Sorgo")),
    ("buckwheat", "Sarrasin", T("Alforfón", "Buckwheat", "Sarrasin", "Grano saraceno")),
]


def _fr_xlsx_history(xlsx):
    """Balances anuales 1996/97-... de FranceAgriMer en hoja de cálculo (texto, sin OCR): {producto: {año: {partida: valor}}}."""
    import openpyxl, re, unicodedata
    def norm(x): return "".join(c for c in unicodedata.normalize("NFD", str(x).lower()) if unicodedata.category(c) != "Mn").strip()
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    out = {}
    for pid, sheet, _n in FR_XLSX:
        ws = wb[sheet]
        hdr = None
        for r in range(1, ws.max_row + 1):
            n = sum(1 for c in range(1, ws.max_column + 1) if isinstance(ws.cell(r, c).value, str) and re.match(r"^\s*\d{4}/\d{2}\s*$", ws.cell(r, c).value))
            if n >= 10: hdr = r  # la última cabecera es la del «Bilan de marché»
        cols = {c: int(ws.cell(hdr, c).value.strip()[:4]) for c in range(1, ws.max_column + 1) if isinstance(ws.cell(hdr, c).value, str) and re.match(r"^\s*\d{4}/\d{2}\s*$", ws.cell(hdr, c).value)}
        rows = {}
        for r in range(hdr + 1, ws.max_row + 1):
            lab = ws.cell(r, 1).value
            if not isinstance(lab, str): continue
            k = norm(lab)
            for iid, rx, *_ in FR_ITEMS:
                if iid not in rows and re.search(rx, k.replace("utilisations", "utilisations")):
                    rows[iid] = r
        camps = {}
        for c, y in cols.items():
            v = {}
            for iid, r in rows.items():
                x = ws.cell(r, c).value
                if isinstance(x, (int, float)) and not isinstance(x, bool): v[iid] = round(float(x), 1)
            camps[y] = v
        out[pid] = camps
    return out


def _fr_candidates(pdf):
    import collections, re, sys
    sys.path.insert(0, str(ROOT / "scripts"))
    import fr_bilans_ocr as O
    cand = {pid: {iid: {c: collections.Counter() for c in FR_COLS} for iid, *_ in FR_ITEMS} for pid, _p, _n in FR_PAGES}
    for pid, page, _n in FR_PAGES:
        for dpi, psm in ((400, 6), (400, 4), (600, 6), (500, 4)):
            w = O.ocr_page(pdf, page, dpi, psm)
            hs, _ = O.table(w)
            if not hs: continue
            hdr = [(h[0], h[1]) for h in hs[0]]
            for lab, vals, _y in O.rows_of(w, hdr, hs[0][0][2] + 20):
                for iid, rx, *_ in FR_ITEMS:
                    if re.search(rx, lab.lower()):
                        for c, txt in vals.items():
                            if c in FR_COLS:
                                d = re.sub(r"\D", "", txt)
                                if d and len(d) <= 6: cand[pid][iid][c][int(d)] += 1
    return cand


def build_fr(pdf, xlsx=None):
    import itertools, datetime
    cand = _fr_candidates(pdf)
    camps, rejected = {}, []
    for pid, _pg, _n in FR_PAGES:
        for c, year in FR_COLS.items():
            opts = {}
            for iid, *_ in FR_ITEMS:
                top = [v for v, _n2 in cand[pid][iid][c].most_common(3)]
                opts[iid] = top if iid in FR_REQ else top + [None]
            if any(not opts[i] for i in FR_REQ): rejected.append((pid, year, "faltan partidas")); continue
            best, bscore, tie = None, -1, False
            for combo in itertools.product(*[opts[i] for i, *_ in FR_ITEMS]):
                v = dict(zip([i for i, *_ in FR_ITEMS], combo))
                sup = v["beginStocks"] + v["collecte"] + (v["imports"] or 0) + (v["adjustment"] or 0)
                if abs(sup - v["totalSupply"]) > 2 and not (pid == "barley" and v["imports"] is None and 0 <= v["totalSupply"] - sup <= 120): continue
                if abs(v["domestic"] + v["exports"] - v["totalUse"]) > 2: continue
                if abs(v["totalSupply"] - v["totalUse"] - v["endingStocks"]) > 3: continue
                score = sum(cand[pid][i][c][x] for i, x in v.items() if x is not None)
                if score > bscore: best, bscore, tie = v, score, False
                elif score == bscore and v != best: tie = True
            if best is None or tie: rejected.append((pid, year, "no cuadra" if best is None else "ambigua")); continue
            camps.setdefault(str(year), {"label": "%d/%02d" % (year, (year + 1) % 100), "v": {}})["v"][pid] = {k: float(x) for k, x in best.items() if x is not None}
    if xlsx:
        # El Excel histórico (texto) aporta 1996/97-2024/25 y 5 cereales más. Donde el PDF (más reciente, ya revisado) tiene la campaña, manda el PDF;
        # además sirve de contraste independiente de la lectura por OCR.
        hist = _fr_xlsx_history(xlsx)
        n = nd = 0
        for pid, cs in hist.items():
            for y, v in sorted(cs.items()):
                k = str(y)
                if pid in camps.get(k, {}).get("v", {}):
                    o = camps[k]["v"][pid]
                    for it, val in o.items():
                        if it in v:
                            n += 1; nd += abs(v[it] - val) > max(3.0, 0.01 * abs(val))
                    continue
                if any(i not in v for i in ("beginStocks", "collecte", "totalSupply", "domestic", "exports", "totalUse", "endingStocks")): rejected.append((pid, y, "Excel: faltan partidas")); continue
                tol = max(3.0, 0.003 * v["totalSupply"])
                if abs(v["beginStocks"] + v["collecte"] + v.get("imports", 0) + v.get("adjustment", 0) - v["totalSupply"]) > tol or abs(v["domestic"] + v["exports"] - v["totalUse"]) > tol or abs(v["totalSupply"] - v["totalUse"] - v["endingStocks"]) > tol or min(v.values()) < 0:
                    rejected.append((pid, y, "Excel: el balance no cuadra")); continue
                camps.setdefault(k, {"label": "%d/%02d" % (y, (y + 1) % 100), "v": {}})["v"][pid] = v
        print("contraste OCR vs Excel: %d cifras comparables, %d con diferencia > 1 %% (revisiones de la campaña 2024/25)" % (n, nd))
    for y, cmp_ in camps.items():
        nxt = camps.get(str(int(y) + 1))
        for pid, d in cmp_["v"].items():
            if nxt and pid in nxt["v"]:
                assert abs(d["endingStocks"] - nxt["v"][pid]["beginStocks"]) <= 3, "existencias finales ≠ iniciales siguientes %s/%s: %s vs %s" % (cmp_["label"], pid, d["endingStocks"], nxt["v"][pid]["beginStocks"])
    for r in rejected: print("descartado:", r)
    used = {i for c in camps.values() for d in c["v"].values() for i in d}
    doc = {
        "schemaVersion": 1,
        "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "country": "FR",
        "sourceId": "franceagrimer",
        "source": {"name": "FranceAgriMer — Bilans céréaliers annuels", "table": "Bilans céréaliers annuels (PDF du 16 septembre 2026) et historique des bilans (Excel du 1er octobre 2025)", "url": "https://www.franceagrimer.fr/"},
        "unit": "kt",
        "note": T(
            "Campaña de julio a junio. 2025/26 es provisional y 2026/27 es una previsión (septiembre de 2026); FranceAgriMer revisa los balances cada mes. «Cosecha comercializada» (collecte) es la parte de la producción que llega al mercado, y es menor que la producción total. Las exportaciones incluyen grano, harina y malta (en equivalente grano) a la UE y a países terceros. Cifras leídas del PDF oficial y publicadas solo si el balance de cada campaña cuadra; las que no cuadraron se omiten. Hasta 2016/17 y para triticale, avena, centeno, sorgo y alforfón (que el PDF no incluye), las cifras vienen del histórico de FranceAgriMer en hoja de cálculo, que llega a 2024/25; las campañas que no cuadran en esa fuente se omiten. Se actualiza a mano.",
            "Marketing year July to June. 2025/26 is provisional and 2026/27 is a forecast (September 2026); FranceAgriMer revises the balances every month. “Marketed crop” (collecte) is the part of production that reaches the market, and is smaller than total production. Exports include grain, flour and malt (grain equivalent) to the EU and third countries. Figures read from the official PDF and published only when each year’s balance adds up; those that did not are omitted. Up to 2016/17, and for triticale, oats, rye, sorghum and buckwheat (not in the PDF), figures come from FranceAgriMer’s historical workbook, which runs to 2024/25; years that do not add up in that source are omitted. Updated manually.",
            "Campagne de juillet à juin. 2025/26 est provisoire et 2026/27 est une prévision (septembre 2026) ; FranceAgriMer révise les bilans chaque mois. La « collecte » est la part de la production qui arrive sur le marché, inférieure à la production totale. Les exportations comprennent grains, farine et malt (en équivalent grain) vers l’UE et les pays tiers. Chiffres lus dans le PDF officiel et publiés seulement si le bilan de chaque campagne est équilibré ; les autres sont omis. Jusqu’en 2016/17, et pour le triticale, l’avoine, le seigle, le sorgho et le sarrasin (absents du PDF), les chiffres viennent de l’historique FranceAgriMer en tableur, qui va jusqu’à 2024/25 ; les campagnes qui ne s’équilibrent pas dans cette source sont omises. Mise à jour manuelle.",
            "Campagna da luglio a giugno. Il 2025/26 è provvisorio e il 2026/27 è una previsione (settembre 2026); FranceAgriMer rivede i bilanci ogni mese. Il « collecte » è la parte della produzione che arriva sul mercato, inferiore alla produzione totale. Le esportazioni comprendono granella, farina e malto (in equivalente granella) verso UE e paesi terzi. Cifre lette dal PDF ufficiale e pubblicate solo se il bilancio di ogni campagna quadra; le altre sono omesse. Fino al 2016/17, e per triticale, avena, segale, sorgo e grano saraceno (assenti dal PDF), le cifre provengono dallo storico FranceAgriMer in foglio di calcolo, che arriva al 2024/25; le campagne che non quadrano in quella fonte sono omesse. Aggiornamento manuale."),
        "items": [{"id": i, "name": n, "sub": sub, "strong": strong} for i, _rx, n, sub, strong in FR_ITEMS if i in used],
        "cards": ["collecte", "domestic", "exports", "endingStocks"],
        "chart": ["collecte", "domestic", "exports"],
        "stocksToUse": {"num": "endingStocks", "den": ["domestic", "exports"]},
        "identity": {"total": "totalSupply", "minus": ["totalUse"], "equals": "endingStocks", "tolerancePct": 0.5},
        "products": [{"id": p, "name": n} for p, _pg, n in FR_PAGES] + ([{"id": p, "name": n} for p, _sh, n in FR_XLSX if p not in {q for q, *_ in FR_PAGES}] if xlsx else []),
        "campaigns": dict(sorted(camps.items())),
    }
    write("fr", doc)
    return doc


if __name__ == "__main__":
    a = sys.argv[1:] or ["ca"]
    if a[0] == "eu":
        if len(a) < 2: raise SystemExit("uso: build_supply_balances.py eu <Cereals_bs_EUROPA_EU.xlsx>")
        build_eu(a[1])
    elif a[0] == "fr":
        if len(a) < 2: raise SystemExit("uso: build_supply_balances.py fr <BIL-CER-cer_princ-camp-*.pdf> [SCR-CER-historique_bilans_prev-*.xlsx]")
        build_fr(a[1], a[2] if len(a) > 2 else None)
    else:
        for w in a: {"ca": build_ca}[w]()
    print("supply-balances/%s.json escrito" % a[0])

#!/usr/bin/env python3
"""Portugal: ocho bloques nuevos del INE (API de indicadores, CC BY 4.0; incendios: ICNF; pesca: DGRM) -> data/portugal-more/*.json y data/portugal-more-stats.json.

  - pesca.json      : precio medio de la pesca descargada (EUR/kg) por puerto/region y grupo de especies, 1969-.
  - balances.json   : balances de abastecimiento: autoabastecimiento, consumo humano total y por habitante (carne, cereales, fruta, miel, vino).
  - leche.json      : leche recogida por tipo (vaca, oveja, cabra), toneladas y litros, 1986-.
  - carne.json      : produccion bruta indigena de carne (INE, trimestral porcino; semestral bovino, ovino, caprino), 1995-.
  - ipc.json        : IPCA (indice armonizado de precios al consumo, base 2025 = 100) por grupo COICOP de alimentos, mensual desde 1996.
  - incendios.json  : incendios rurales (numero por tamano) y superficie quemada por tipo; Portugal, regiones y municipios, 2001-.
  - cultivos.json   : superficie de los principales cultivos por region (NUTS 2024), 2023-.
  - insumos.json    : consumo aparente de fertilizantes minerales por ha de SAU (1995-) y produccion de miel (1938-).

Todo se guarda como lo publica el INE. La escala de cada indicador (potencia de 10: miles de cabezas, miles de toneladas...) se lee de la ficha de metadatos del INE en cada
ejecucion y se compara con la esperada: si no coincide el bloque no se publica. Un valor ausente se omite y nada se estima ni se convierte.
Cada bloque es independiente: si uno falla se conserva lo publicado y se sigue con los demas.
Formato comun (igual que Belgica): {schemaVersion, generatedAt, source, edition, tables:[{id, group, label, l, unit, note, series:[{id, label, l, orig, points, provisional}]}]}."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pt_more_labels as LB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "portugal-more"
API = "https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&Dim1=T&lang=EN&varcd="
META = "https://www.ine.pt/bddXplorer/htdocs/minfo.jsp?lingua=EN&var_cd="
LOG = []
SRC = {"name": "INE Portugal (Statistics Portugal) - indicators API; fires: ICNF; fish landings: DGRM", "url": "https://www.ine.pt/xportal/xmain?xpid=INE&xpgid=ine_indicadores", "license": "CC BY 4.0 (INE)"}
FILES = {
    "pesca.json": ("Pesca: precio medio de la descarga", "Precio medio (EUR/kg) de la pesca descargada por puerto y grupo de especies, 1969-2025 (DGRM vía INE)"),
    "balances.json": ("Balances de abastecimiento", "Autoabastecimiento y consumo humano (total y por habitante) de carne, cereales, fruta, miel y vino (INE)"),
    "leche.json": ("Leche recogida", "Leche de vaca, oveja y cabra recogida en las industrias, en toneladas y litros, 1986-2025 (INE)"),
    "carne.json": ("Producción bruta de carne", "Producción bruta indígena de carne de porcino (trimestral), bovino, ovino y caprino (semestral), 1995-2025 (INE)"),
    "ipc.json": ("Precios al consumo de alimentos (IPCA)", "Índice armonizado de precios al consumo por grupo COICOP de alimentación, mensual desde 1996, base 2025 = 100 (INE)"),
    "incendios.json": ("Incendios rurales y superficie quemada", "Número de incendios por tamaño y superficie quemada por tipo; Portugal, regiones y municipios, 2001-2025 (ICNF vía INE)"),
    "cultivos.json": ("Superficie de cultivos por región", "Superficie de los principales cultivos en Portugal y en cada región, 2023-2025 (INE)"),
    "insumos.json": ("Fertilizantes y miel", "Consumo aparente de fertilizantes minerales por hectárea de SAU y producción de miel (INE)"),
}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


T0 = time.time()
DEADLINE_S = 19 * 60  # el paso de CI se corta a los 25 min: acabamos limpios antes y se conserva lo ya publicado


def fetch(url, tries=4, binary=False):
    last = None
    for i in range(tries):
        if time.time() - T0 > DEADLINE_S:
            raise RuntimeError("presupuesto de tiempo agotado")
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 DehesaIndex"}), timeout=90) as r:
                b = r.read()
                return b if binary else b.decode("utf-8", "replace")
        except Exception as e:
            last = e
            time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[-60:], str(last)[:140]))


def power(v):
    """Potencia de 10 de la unidad segun la ficha de metadatos del INE (3 = miles)."""
    tx = re.sub(r"\s+", " ", re.sub(r"&nbsp;", " ", re.sub(r"<[^>]+>", " ", fetch(META + v))))
    m = re.search(r"Measure unit \(symbol\) (.*?) Power of 10 (-?\d+)", tx)
    if not m:
        raise RuntimeError("%s: la ficha de metadatos no da la escala" % v)
    return int(m.group(2))


_J = {}


def indicator(v, expect_power):
    """Descarga un indicador, comprueba su escala y devuelve [(periodo, fila)] con valor numerico."""
    if v not in _J:
        _J[v] = json.loads(fetch(API + v))[0]
    j = _J[v]
    if "Dados" not in j or not j["Dados"]:
        raise RuntimeError("%s: sin datos (%s)" % (v, str(j.get("Sucesso"))[:80]))
    p = power(v)
    if p != expect_power:
        raise RuntimeError("%s: escala 10^%d y se esperaba 10^%d; no se publica" % (v, p, expect_power))
    out = []
    unparsed = set()
    for k, lst in j["Dados"].items():
        per = period(k)
        if per is None:
            unparsed.add(k)
            continue
        for r in lst:
            if "valor" not in r:
                continue
            try:
                val = float(r["valor"])
            except ValueError:
                continue
            out.append((per, r, val))
    if unparsed:
        raise RuntimeError("%s: periodos no reconocidos %s" % (v, sorted(unparsed)[:3]))
    return j, out


MON = {m: i + 1 for i, m in enumerate("january february march april may june july august september october november december".split())}


def period(k):
    s = k.strip().lower()
    if re.fullmatch(r"\d{4}", s):
        return s
    m = re.fullmatch(r"(\d{4}) / (\d{4})", s)
    if m and int(m.group(2)) == int(m.group(1)) + 1:
        return "%s/%s" % (m.group(1), m.group(2)[2:])
    m = re.fullmatch(r"([a-z]+) (\d{4})", s)
    if m and m.group(1) in MON:
        return "%s-%02d" % (m.group(2), MON[m.group(1)])
    m = re.fullmatch(r"(\d)(?:st|nd|rd|th) quarter (\d{4})", s)
    if m:
        return "%s-Q%s" % (m.group(2), m.group(1))
    m = re.fullmatch(r"(\d)(?:st|nd|rd|th) semi-annual (\d{4})", s)
    if m:
        return "%s-S%s" % (m.group(2), m.group(1))
    return None


def rnd(v, d=3):
    r = round(v, d)
    return int(r) if r == int(r) else r


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def mk_series(sid, lab, pts, prov=None, orig=None):
    """lab = [es, en, fr, it]; pts = {periodo: valor}."""
    p = sorted(([k, v] for k, v in pts.items() if v is not None), key=lambda x: x[0])
    d = {"id": sid, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}}
    if orig:
        d["orig"] = orig
    d["points"] = p
    have = set(x[0] for x in p)
    pv = sorted(k for k in (prov or []) if k in have)
    if pv:
        d["provisional"] = pv
    return d


def mk_table(tid, group, lab, unit, note, ser):
    ser = [s for s in ser if len(s["points"]) >= 2]
    return {"id": tid, "group": group, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "unit": unit, "note": note, "series": ser}


def doc(tabs, edition, now):
    return {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition, "tables": tabs}


def latest_period(tabs):
    return max([s["points"][-1][0] for t in tabs for s in t["series"] if s["points"]] or [""])


def T(*a):
    return list(a)


def collect(rows, keyf):
    """rows -> {clave: ({periodo: valor}, {periodos provisionales})}"""
    d = {}
    for per, r, val in rows:
        k = keyf(r)
        if k is None:
            continue
        pts, pv = d.setdefault(k, ({}, set()))
        pts[per] = rnd(val)
        if "provisional" in str(r.get("sinal_conv_desc", "")).lower():
            pv.add(per)
    return d


def edition_of(j):
    return "%s (actualizado %s)" % (j.get("UltimoPref", ""), j.get("DataUltimoAtualizacao", ""))


# ------------------------------------------------------------ 1. pesca
def pesca():
    j, rows = indicator("0001066", 0)
    names = {}
    for per, r, val in rows:
        names[r["geocod"]] = r["geodsg"]
    d = collect(rows, lambda r: (r["geocod"], r["dim_3_t"]) if r.get("dim_3_t") in LB.SPECIES else None)
    if len(d) < 100:
        raise RuntimeError("pesca con solo %d series" % len(d))
    tabs = []
    keep = geo_keep(names)
    order = ["PT", "1", "2", "3"] + sorted(c for c in keep if c not in ("PT", "1", "2", "3"))
    for sp, slb in LB.SPECIES.items():
        ser = []
        for c in order:
            if (c, sp) not in d:
                continue
            pts, pv = d[(c, sp)]
            nm = LB.FISH_AGG.get(c) or [names[c]] * 4
            ser.append(mk_series("pt-pesca-%s-%s" % (c.lower(), slug(sp)), nm, pts, pv))
        tabs.append(mk_table("pesca-" + slug(sp), "pesca", T("Precio medio descargado: " + slb[0].lower(), "Mean landed price: " + slb[1].lower(), "Prix moyen débarqué : " + slb[2].lower(), "Prezzo medio sbarcato: " + slb[3].lower()), "€/kg",
                             "Precio medio de la pesca descargada en lonjas y puertos de Portugal (valor dividido por cantidad, tal como lo publican DGRM y el INE), por puerto, isla o región.", ser))
    tabs = [t for t in tabs if t["series"]]
    return edition_of(j), tabs


# ------------------------------------------------------------ 2. balances
def balances():
    tabs = []
    eds = []

    def block(v, power0, dictn, tid, group, lab, unit, note, pre):
        j, rows = indicator(v, power0)
        eds.append(j.get("DataUltimoAtualizacao", ""))
        d = collect(rows, lambda r: r.get("dim_3_t") if r.get("dim_3_t") in dictn else None)
        ser = [mk_series("pt-%s-%s" % (pre, slug(k)), dictn[k], d[k][0], d[k][1]) for k in dictn if k in d]
        if not ser:
            raise RuntimeError("%s sin series" % v)
        tabs.append(mk_table(tid, group, lab, unit, note, ser))

    block("0000212", 0, LB.MEAT, "carne-autoabast", "carne", T("Autoabastecimiento de carne", "Self-sufficiency in meat", "Autosuffisance en viande", "Autosufficienza di carne"), "%",
          "Producción dividida por consumo (por encima del 100 % Portugal produce más de lo que consume). Balance de abastecimiento de productos animales del INE.", "carne-selfsuff")
    block("0000210", 3, LB.MEAT, "carne-consumo", "carne", T("Consumo humano de carne", "Human consumption of meat", "Consommation humaine de viande", "Consumo umano di carne"), "miles de t",
          "Consumo humano total, en miles de toneladas (el INE publica la cifra con la escala 10^3).", "carne-consumo")
    block("0000211", 0, LB.MEAT, "carne-consumo-pc", "carne", T("Consumo humano de carne por habitante", "Human consumption of meat per capita", "Consommation humaine de viande par habitant", "Consumo umano di carne pro capite"), "kg/hab.",
          "Consumo humano por habitante y año.", "carne-consumo-pc")
    block("0000182", 0, LB.CEREALS, "cereales-autoabast", "vegetal", T("Autoabastecimiento de cereales", "Self-sufficiency in cereals", "Autosuffisance en céréales", "Autosufficienza di cereali"), "%",
          "Por campaña (julio-junio). Balance de abastecimiento de productos vegetales del INE.", "cereal-selfsuff")
    block("0000164", 0, LB.FRUITS, "fruta-autoabast", "vegetal", T("Autoabastecimiento de fruta", "Self-sufficiency in fruit", "Autosuffisance en fruits", "Autosufficienza di frutta"), "%",
          "Por campaña, solo para las principales especies comercializadas.", "fruit-selfsuff")
    for key, (v, lab, unit) in LB.SINGLE.items():
        pw = 3 if v == "0000177" else 0
        j, rows = indicator(v, pw)
        eds.append(j.get("DataUltimoAtualizacao", ""))
        d = collect(rows, lambda r: "x")
        if "x" not in d:
            raise RuntimeError("%s sin datos" % v)
        u = "miles de hl" if pw == 3 else unit
        grp = "miel" if key.startswith("honey") else "vino"
        tabs.append(mk_table(key, grp, lab, u, "Por campaña. Balance de abastecimiento de productos vegetales del INE.", [mk_series("pt-" + key, lab, d["x"][0], d["x"][1])]))
    return "actualizado %s" % max(eds), tabs


# ------------------------------------------------------------ 3. leche
def leche():
    tabs = []
    eds = []
    for v, pw, tid, unit, lab in (("0004753", 0, "leche-t", "t", T("Leche recogida (toneladas)", "Milk collected (tonnes)", "Lait collecté (tonnes)", "Latte raccolto (tonnellate)")),
                                  ("0004752", 3, "leche-l", "miles de l", T("Leche recogida (litros)", "Milk collected (litres)", "Lait collecté (litres)", "Latte raccolto (litri)"))):
        j, rows = indicator(v, pw)
        eds.append(j.get("DataUltimoAtualizacao", ""))
        d = collect(rows, lambda r: r.get("dim_3_t") if r.get("dim_3_t") in LB.MILK else None)
        ser = [mk_series("pt-leche-%s-%s" % (tid[-1], slug(k)), LB.MILK[k], d[k][0], d[k][1]) for k in LB.MILK if k in d]
        if len(ser) < 3:
            raise RuntimeError("%s con solo %d series" % (v, len(ser)))
        tabs.append(mk_table(tid, "leche", lab, unit, "Leche recogida por las industrias lácteas (encuesta de recogida de leche y productos lácteos del INE), por tipo de leche.", ser))
    return "actualizado %s" % max(eds), tabs


# ------------------------------------------------------------ 4. carne (produccion bruta)
def carne():
    tabs = []
    eds = []
    note = "Producción bruta indígena: producción neta más el saldo de comercio exterior de animales vivos (exportación menos importación), convertida a peso en canal; cifra en miles de cabezas (escala 10^3 del INE)."
    j, rows = indicator("0000549", 3)
    eds.append(j.get("DataUltimoAtualizacao", ""))
    d = collect(rows, lambda r: "x")
    tabs.append(mk_table("carne-cerdo", "carne", T("Porcino (trimestral)", "Pigs (quarterly)", "Porcins (trimestriel)", "Suini (trimestrale)"), "miles de cabezas", note,
                         [mk_series("pt-cargross-pig", T("Porcino", "Pigs", "Porcins", "Suini"), d["x"][0], d["x"][1])]))
    j, rows = indicator("0000548", 3)
    eds.append(j.get("DataUltimoAtualizacao", ""))
    d = collect(rows, lambda r: r.get("dim_3_t") if r.get("dim_3_t") in LB.BOVINE else None)
    tabs.append(mk_table("carne-bovino", "carne", T("Bovino (semestral)", "Cattle (half-yearly)", "Bovins (semestriel)", "Bovini (semestrale)"), "miles de cabezas", note,
                         [mk_series("pt-cargross-bov-" + slug(k), LB.BOVINE[k], d[k][0], d[k][1]) for k in LB.BOVINE if k in d]))
    ser = []
    for v, nm in (("0000550", T("Ovino", "Sheep", "Ovins", "Ovini")), ("0000551", T("Caprino", "Goats", "Caprins", "Caprini"))):
        j, rows = indicator(v, 3)
        eds.append(j.get("DataUltimoAtualizacao", ""))
        d = collect(rows, lambda r: "x")
        ser.append(mk_series("pt-cargross-" + v, nm, d["x"][0], d["x"][1]))
    tabs.append(mk_table("carne-ovino-caprino", "carne", T("Ovino y caprino (semestral)", "Sheep and goats (half-yearly)", "Ovins et caprins (semestriel)", "Ovini e caprini (semestrale)"), "miles de cabezas", note, ser))
    tabs = [t for t in tabs if t["series"]]
    if not tabs:
        raise RuntimeError("carne sin series")
    return "actualizado %s" % max(eds), tabs


# ------------------------------------------------------------ 5. IPCA
def ipc():
    j, rows = indicator("0014651", 0)
    d = collect(rows, lambda r: r.get("dim_3") if r.get("dim_3") in LB.CPI and r.get("geodsg") == "Portugal" else None)
    ser = [mk_series("pt-hicp-" + k.lower(), LB.CPI[k], d[k][0], d[k][1], k) for k in LB.CPI if k in d]
    tab = mk_table("ipca-alimentos", "ipc", T("IPCA por grupo de alimentos", "HICP by food group", "IPCH par groupe alimentaire", "IPCA per gruppo alimentare"), "índice 2025=100",
                   "Índice armonizado de precios al consumo de Portugal por grupo COICOP 2018, base 2025 = 100, mensual desde 1996. El código COICOP aparece al pasar el ratón por el nombre.", ser)
    if len(tab["series"]) < 20:
        raise RuntimeError("IPCA con solo %d series" % len(tab["series"]))
    return edition_of(j), [tab]


# ------------------------------------------------------------ 6. incendios
def geo_keep(names):
    """codigos de geografia sin repetir el nombre de su nivel superior (200 = 20 = 2: Azores)."""
    keep = {}
    for c, n in names.items():
        if len(c) <= 3 and not (len(c) > 1 and names.get(c[:-1]) == n):
            keep[c] = n
    return keep


def incendios():
    jn, rn = indicator("0013514", 0)
    jb, rb = indicator("0013510", 0)
    names = {r["geocod"]: r["geodsg"] for per, r, v in rn}
    names.update({r["geocod"]: r["geodsg"] for per, r, v in rb})
    reg = geo_keep(names)
    muni = {c: n for c, n in names.items() if len(c) == 7}
    if len(muni) < 250:
        raise RuntimeError("solo %d municipios" % len(muni))
    dn = collect(rn, lambda r: (r["geocod"], r["dim_3_t"]) if r.get("dim_3_t") in LB.FIRE_SIZE else None)
    db = collect(rb, lambda r: (r["geocod"], r["dim_3_t"]) if r.get("dim_3_t") in LB.BURNT else None)
    order = ["PT", "1", "2", "3"] + sorted(c for c in reg if c not in ("PT", "1", "2", "3"))
    tabs = []

    def nm(c):
        return LB.REGIONS.get(c) or [names[c]] * 4

    ser = [mk_series("pt-fire-n-pt-" + slug(s), LB.FIRE_SIZE[s], dn[("PT", s)][0], dn[("PT", s)][1]) for s in LB.FIRE_SIZE if ("PT", s) in dn]
    tabs.append(mk_table("inc-n-tam", "nacional", T("Incendios por tamaño (Portugal)", "Fires by size (Portugal)", "Incendies par taille (Portugal)", "Incendi per dimensione (Portogallo)"), "nº",
                         "Número de incendios rurales en Portugal por tamaño de la superficie quemada (ICNF).", ser))
    ser = [mk_series("pt-fire-ha-pt-" + slug(s), LB.BURNT[s], db[("PT", s)][0], db[("PT", s)][1]) for s in LB.BURNT if ("PT", s) in db]
    tabs.append(mk_table("inc-ha-tipo", "nacional", T("Superficie quemada por tipo (Portugal)", "Burnt area by type (Portugal)", "Surface brûlée par type (Portugal)", "Superficie bruciata per tipo (Portogallo)"), "ha",
                         "Superficie quemada en Portugal por tipo de terreno: bosque, matorral y pastizal, y terreno agrícola (ICNF).", ser))
    ser = [mk_series("pt-fire-n-reg-" + c.lower(), nm(c), dn[(c, "Total")][0], dn[(c, "Total")][1]) for c in order if (c, "Total") in dn]
    tabs.append(mk_table("inc-n-reg", "regiones", T("Número de incendios por región", "Number of fires by region", "Nombre d'incendies par région", "Numero di incendi per regione"), "nº",
                         "Todos los tamaños. Incluye Portugal, regiones NUTS II y subregiones NUTS III (que se solapan con las regiones).", ser))
    ser = [mk_series("pt-fire-ha-reg-" + c.lower(), nm(c), db[(c, "Total")][0], db[(c, "Total")][1]) for c in order if (c, "Total") in db]
    tabs.append(mk_table("inc-ha-reg", "regiones", T("Superficie quemada por región", "Burnt area by region", "Surface brûlée par région", "Superficie bruciata per regione"), "ha",
                         "Todos los tipos de terreno. Incluye Portugal, regiones NUTS II y subregiones NUTS III (que se solapan con las regiones).", ser))
    mo = sorted(muni, key=lambda c: muni[c])
    ser = [mk_series("pt-fire-n-mun-" + c, [muni[c]] * 4, dn[(c, "Total")][0], dn[(c, "Total")][1]) for c in mo if (c, "Total") in dn]
    tabs.append(mk_table("inc-n-mun", "municipios", T("Número de incendios por municipio", "Number of fires by municipality", "Nombre d'incendies par commune", "Numero di incendi per comune"), "nº",
                         "Todos los tamaños; un cero es un año sin incendios en el municipio.", ser))
    ser = [mk_series("pt-fire-ha-mun-" + c, [muni[c]] * 4, db[(c, "Total")][0], db[(c, "Total")][1]) for c in mo if (c, "Total") in db]
    tabs.append(mk_table("inc-ha-mun", "municipios", T("Superficie quemada por municipio", "Burnt area by municipality", "Surface brûlée par commune", "Superficie bruciata per comune"), "ha",
                         "Todos los tipos de terreno.", ser))
    tabs = [t for t in tabs if t["series"]]
    if len(tabs) < 6:
        raise RuntimeError("incendios con %d tablas" % len(tabs))
    return edition_of(jn), tabs


# ------------------------------------------------------------ 7. cultivos por region
def cultivos():
    j, rows = indicator("0013080", 0)
    names = {r["geocod"]: r["geodsg"] for per, r, v in rows}
    reg = geo_keep(names)
    d = collect(rows, lambda r: (r["geocod"], r["dim_3"]) if r.get("dim_3") in LB.CROPS else None)
    missing = sorted({r["dim_3"] for per, r, v in rows if r.get("dim_3") not in LB.CROPS})
    if missing:
        log("cultivos: especies sin traducir (no se publican): %s" % ", ".join(missing))
    tabs = []
    for c in ["PT", "1", "2", "3"] + sorted(x for x in reg if x not in ("PT", "1", "2", "3")):
        if c not in reg:
            continue
        nm = LB.REGIONS.get(c) or [names[c]] * 4
        ser = [mk_series("pt-crop-%s-%s" % (c.lower(), k), LB.CROPS[k], d[(c, k)][0], d[(c, k)][1]) for k in LB.CROPS if (c, k) in d]
        grp = "nacional" if c == "PT" else "regiones"
        tabs.append(mk_table("cultivos-" + c.lower(), grp, T("Superficie de cultivos: " + nm[0], "Crop area: " + nm[1], "Superficie des cultures : " + nm[2], "Superficie delle colture: " + nm[3]), "ha",
                             "Superficie de los principales cultivos (INE). Los grupos (cereales, hortalizas, fruta...) aparecen junto a sus especies: no se suman entre sí. Solo hay tres años publicados con esta geografía.", ser))
    tabs = [t for t in tabs if t["series"]]
    if len(tabs) < 8:
        raise RuntimeError("cultivos con %d tablas" % len(tabs))
    return edition_of(j), tabs


# ------------------------------------------------------------ 8. fertilizantes y miel
def insumos():
    tabs = []
    eds = []
    j, rows = indicator("0004079", 0)
    eds.append(j.get("DataUltimoAtualizacao", ""))
    d = collect(rows, lambda r: "x")
    tabs.append(mk_table("fertilizantes", "insumos", T("Fertilizantes minerales: consumo aparente por hectárea", "Mineral fertilisers: apparent consumption per hectare", "Engrais minéraux : consommation apparente par hectare", "Fertilizzanti minerali: consumo apparente per ettaro"), "kg/ha",
                         "Consumo aparente de fertilizantes minerales (nitrógeno, fósforo y potasio) dividido por la superficie agrícola utilizada (indicadores agroambientales del INE).",
                         [mk_series("pt-fertilizantes", T("Fertilizantes minerales (kg por ha de SAU)", "Mineral fertilisers (kg per ha of UAA)", "Engrais minéraux (kg par ha de SAU)", "Fertilizzanti minerali (kg per ha di SAU)"), d["x"][0], d["x"][1])]))
    j, rows = indicator("0000924", 0)
    eds.append(j.get("DataUltimoAtualizacao", ""))
    d = collect(rows, lambda r: "x")
    tabs.append(mk_table("miel", "miel", T("Producción de miel", "Honey production", "Production de miel", "Produzione di miele"), "t", "Producción anual de miel en Portugal desde 1938 (estadísticas de producción animal del INE).",
                         [mk_series("pt-miel", T("Producción de miel", "Honey production", "Production de miel", "Produzione di miele"), d["x"][0], d["x"][1])]))
    tabs = [t for t in tabs if t["series"]]
    if len(tabs) < 2:
        raise RuntimeError("insumos incompleto")
    return "actualizado %s" % max(eds), tabs


# ------------------------------------------------------------ estadisticas (catalogo)
def load(name):
    p = OUT / name
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def one(d, tid, sid):
    t = next((t for t in (d or {"tables": []})["tables"] if t["id"] == tid), None)
    return next((s for s in (t or {"series": []})["series"] if s["id"] == sid), None), t


def stats(docs, now):
    out = []

    def add(sid, grp, label, unit, s, freq, minpts=2):
        if not s or len(s["points"]) < minpts:
            return
        p = s["points"]
        ch = None
        per = p[-1][0]
        if freq == "annual":
            ch = round((p[-1][1] / p[-2][1] - 1) * 100, 2) if p[-2][1] else None
        else:
            prev = next((v for k, v in p if k == "%d%s" % (int(per[:4]) - 1, per[4:])), None)
            ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": freq, "latestPeriod": per, "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "portugal-more"})

    pe = docs.get("pesca.json")
    for sp, nm in (("total", "todas las especies"), ("sea-fish", "pescado de mar"), ("crustaceans", "crustáceos"), ("molluscs", "moluscos")):
        s, tb = one(pe, "pesca-" + sp, "pt-pesca-pt-" + sp)
        add("pt-pesca-precio-" + sp, "prices", "Precio medio de la pesca descargada (%s), Portugal (INE)" % nm, "€/kg", s, "annual", 8)
    b = docs.get("balances.json")
    for k, nm in (("total-meat-and-offal", "carne y despojos"), ("meat-of-bovine-animals", "vacuno"), ("pig-meat", "cerdo"), ("poultrymeat", "aves")):
        s, tb = one(b, "carne-autoabast", "pt-carne-selfsuff-" + k)
        add("pt-autoabast-" + k, "consumption", "Autoabastecimiento de %s, Portugal (INE)" % nm, "%", s, "annual", 8)
        s, tb = one(b, "carne-consumo-pc", "pt-carne-consumo-pc-" + k)
        add("pt-consumo-pc-" + k, "consumption", "Consumo de %s por habitante, Portugal (INE)" % nm, "kg/hab.", s, "annual", 8)
    # cereales y vino van por campana (AAAA/AA): se quedan en portugal.html; el catalogo solo admite anual AAAA
    le = docs.get("leche.json")
    for k, nm in (("cow-s-milk", "vaca"), ("sheep-milk", "oveja"), ("goat-milk", "cabra"), ("total-of-milk", "total")):
        s, tb = one(le, "leche-t", "pt-leche-t-" + k)
        add("pt-leche-recogida-" + k, "milk", "Leche recogida (%s), Portugal (INE)" % nm, "t", s, "annual", 8)
    c = docs.get("carne.json")
    s, tb = one(c, "carne-cerdo", "pt-cargross-pig")
    add("pt-carne-bruta-cerdo", "production", "Producción bruta de carne de porcino, Portugal (INE)", "miles de cabezas", s, "quarterly", 12)
    i = docs.get("ipc.json")
    for k, lab in LB.CPI.items():
        s, tb = one(i, "ipca-alimentos", "pt-hicp-" + k.lower())
        add("pt-hicp-" + k.lower(), "consumption", "IPCA, %s, Portugal (INE)" % lab[0].lower(), "índice 2025=100", s, "monthly", 24)
    f = docs.get("incendios.json")
    s, tb = one(f, "inc-n-tam", "pt-fire-n-pt-total")
    add("pt-incendios-n", "environment", "Incendios rurales, Portugal (ICNF vía INE)", "nº", s, "annual", 10)
    s, tb = one(f, "inc-ha-tipo", "pt-fire-ha-pt-total")
    add("pt-incendios-ha", "environment", "Superficie quemada, Portugal (ICNF vía INE)", "ha", s, "annual", 10)
    n = docs.get("insumos.json")
    s, tb = one(n, "fertilizantes", "pt-fertilizantes")
    add("pt-fertilizantes", "environment", "Consumo aparente de fertilizantes minerales por ha de SAU, Portugal (INE)", "kg/ha", s, "annual", 8)
    s, tb = one(n, "miel", "pt-miel")
    add("pt-miel", "production", "Producción de miel, Portugal (INE)", "t", s, "annual", 8)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"PT": {"name": "Portugal", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    jobs = [("pesca", pesca), ("balances", balances), ("leche", leche), ("carne", carne), ("ipc", ipc), ("incendios", incendios), ("cultivos", cultivos), ("insumos", insumos)]
    for name, fn in jobs:
        try:
            ed, tabs = fn()
            docs[name + ".json"] = doc(tabs, ed, now)
            log("%s: leido (edicion %s, %d tablas, %d series)" % (name, ed, len(tabs), sum(len(t["series"]) for t in tabs)))
        except Exception as ex:
            log("%s: NO se pudo leer (%s); se conserva lo publicado" % (name, str(ex)[:220]))
        time.sleep(2)
    files = []
    for n, (title, desc) in FILES.items():
        d = docs.get(n)
        if not d:
            continue
        (OUT / n).write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        files.append({"file": n, "title": title, "description": desc, "edition": d["edition"], "tables": len(d["tables"]), "series": sum(len(t["series"]) for t in d["tables"]), "generatedAt": d["generatedAt"]})
    if not files:
        log("sin datos; no se escribe nada")
        (ROOT / "data" / "portugal-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "portugal-more-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["PT"]["series"])))
    (ROOT / "data" / "portugal-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

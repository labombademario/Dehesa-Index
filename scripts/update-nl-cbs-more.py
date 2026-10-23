#!/usr/bin/env python3
"""Paises Bajos: cinco bloques nuevos del CBS (Statistics Netherlands, StatLine OData) -> data/netherlands-more/*.json y data/netherlands-more-stats.json.

  - omzet.json         : 85159NED facturacion y numero de explotaciones por trimestre (desde 2018), por provincia y 42 tipos de explotacion (no es un precio: es volumen de negocio).
  - horticultura.json  : 81302NED (superficie de invernadero y aire libre 2000-) y 80783NED (champiñon, endibia forzada, forzado de bulbos).
  - nitrogeno.json     : 83475NED balance de minerales, 83983NED/83982NED estiercol y amoniaco, 83655NED estiercol fuera de la agricultura, 83566NED fitosanitarios vendidos, 80240NED derechos de cerdos y aves.
  - cadena.json        : 85770NED PPI de la industria alimentaria (mensual) y 86141NED IPC de alimentos (mensual).
  - otros.json         : 37738 hortalizas por especie, 85303NED pastoreo del vacuno de leche, 86338NED huevos, 84448NED finanzas (ecologico/convencional), 85676NED cosecha provisional frente a definitiva.

Todo se guarda como lo publica el CBS (solo conversiones exactas de unidad: are->ha, m2->ha, mln kg->kt, 1 000 kg->t); un valor vacio o confidencial se omite, nada se estima. Cada bloque es independiente:
si uno falla se conserva lo publicado de ese bloque y se sigue con los demas. Formato comun: {schemaVersion, generatedAt, source, edition, tables:[{id, label, l, unit, note, series:[{id, label, l, nl, points, provisional?}]}]}
donde label es el nombre en espanol, l = {en, fr, it} y nl = el titulo neerlandes original del CBS. Modo sin red: NL_MORE_FIXTURES=<carpeta con <clave>.json>."""
import datetime, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nl_more_labels as LB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "netherlands-more"
BASE = "https://opendata.cbs.nl/ODataApi/odata/"
FIX = os.environ.get("NL_MORE_FIXTURES")
LOG = []
SRC = {"name": "Statistics Netherlands (CBS) - StatLine", "url": "https://opendata.cbs.nl/", "license": "CC BY 4.0 (CBS)"}
FILES = {
    "omzet.json": ("Facturacion de las explotaciones por trimestre", "Facturacion y numero de explotaciones por trimestre desde 2018, por provincia y 42 tipos de explotacion (volumen de negocio, no precio)"),
    "horticultura.json": ("Invernaderos, flores, setas y bulbos", "Superficie de horticultura bajo cristal y al aire libre desde 2000 (tomate, pimiento, pepino, flor cortada, plantas de maceta, bulbos, viveros) y champiñon, endibia y forzado de bulbos"),
    "nitrogeno.json": ("Nitrogeno, estiercol y politica agraria", "Balance de minerales, estiercol y amoniaco por tipo de explotacion, provincia y animal, fitosanitarios vendidos y derechos de produccion de cerdos y aves"),
    "cadena.json": ("Cadena de precios: industria y consumo", "Indice de precios de productor de la industria alimentaria y IPC de alimentos, mensual"),
    "otros.json": ("Hortalizas, pastoreo, huevos y finanzas", "Hortalizas por especie, pastoreo del vacuno de leche, huevos de consumo, finanzas de las explotaciones y cosecha provisional frente a definitiva"),
}

# unidad del CBS -> (unidad publicada, factor exacto)
UNITS = {"are": ("ha", 0.01), "ha": ("ha", 1), "hectare": ("ha", 1), "m2": ("ha", 0.0001), "mln euro": ("M€", 1), "aantal": ("nº", 1), "mln kg": ("kt", 1), "1 000 kg": ("t", 1), "1000 kg": ("t", 1),
         "ton": ("t", 1), "%": ("%", 1), "mln stuks": ("M uds", 1), "1000 stuks": ("miles de uds", 1), "dagen per jaar": ("días/año", 1), "% weidedagen": ("% de días", 1), "2021=100": ("índice 2021=100", 1),
         "2025=100": ("índice 2025=100", 1), "2011=100": ("índice 2011=100", 1), "1 000 varkenseenheden": ("miles de uds. de cerdo", 1), "1 000 pluimvee-eenheden": ("miles de uds. de ave", 1),
         "1 000 kg fosfaat": ("t de fosfato", 1), "mln kg": ("kt", 1), "x 1 000": ("miles", 1)}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def get(path, key):
    if FIX:
        return json.loads((Path(FIX) / (key + ".json")).read_text(encoding="utf-8"))
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + path, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}), timeout=120) as r:
                return json.loads(r.read().decode("utf-8-sig"))
        except Exception as e:
            last = e
            time.sleep(4 * (i + 1))
    raise RuntimeError("CBS %s: %s" % (path, str(last)[:160]))


def rows(path, key):
    out = []
    d = get(path, key)
    out += d["value"]
    n = 0
    while d.get("odata.nextLink") and not FIX and n < 80:
        nl = d["odata.nextLink"]
        d = get(nl[len(BASE):] if nl.startswith(BASE) else nl, key + "_%d" % n)
        out += d["value"]
        n += 1
    return out


def q(s):
    return urllib.parse.quote(s, safe="")


_raw = {}


def rawkey(table, dname, key):
    """El CBS rellena con espacios algunas claves (p. ej. 'NL01    '): el filtro OData necesita la clave tal cual."""
    k = (table, dname)
    if k not in _raw:
        _raw[k] = {v["Key"].strip(): v["Key"] for v in get("%s/%s" % (table, dname), "dim_%s_%s" % (table, dname))["value"]}
    return _raw[k].get(key, key)


def flt(table=None, **kw):
    return "$filter=" + q(" and ".join("%s eq '%s'" % (k, rawkey(table, k, v) if table else v) for k, v in kw.items()))


_props = {}


def props(table):
    if table not in _props:
        _props[table] = {v["Key"].strip(): v for v in get("%s/DataProperties" % table, "props_" + table)["value"] if v.get("Key")}
    return _props[table]


def dim(table, name):
    return {v["Key"].strip(): v["Title"].strip() for v in get("%s/%s" % (table, name), "dim_%s_%s" % (table, name))["value"]}


def pstatus(table):
    return {v["Key"].strip(): v.get("Status") for v in get("%s/Perioden" % table, "per_" + table)["value"]}


def period(p):
    p = p.strip()
    m = re.match(r"^(\d{4})JJ00$", p)
    if m:
        return m.group(1)
    m = re.match(r"^(\d{4})KW0(\d)$", p)
    if m:
        return "%s-Q%s" % (m.group(1), m.group(2))
    m = re.match(r"^(\d{4})MM(\d{2})$", p)
    if m:
        return "%s-%s" % (m.group(1), m.group(2))
    return None


def conv(table, topic):
    """(unidad publicada, factor) de un tema segun lo que declara el CBS; si no se conoce, la unidad cruda y factor 1."""
    u = (props(table).get(topic) or {}).get("Unit") or ""
    u = u.strip()
    return UNITS.get(u, (u or "", 1))


def num(v, f):
    if v is None:
        return None
    r = round(float(v) * f, 4)
    return int(r) if r == int(r) else r


def kind(p):
    return "q" if "-Q" in p else "m" if re.fullmatch(r"\d{4}-\d{2}", p) else "y"


def mk_series(sid, lab, pts, prov=None, nl=None, keep=None):
    """lab = [es, en, fr, it]; pts = {periodo: valor}; keep = 'y' | 'q' | 'm': el CBS mezcla en una misma tabla el total anual con los trimestres o los meses,
    y una serie no puede mezclar periodicidades, asi que cada tabla publica solo la que le corresponde."""
    p = sorted(([k, v] for k, v in pts.items() if v is not None and (keep is None or kind(k) == keep)), key=lambda x: x[0])
    d = {"id": sid, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}}
    if nl:
        d["nl"] = nl
    d["points"] = p
    have = set(x[0] for x in p)
    pv = sorted(k for k in (prov or []) if k in have)
    if pv:
        d["provisional"] = pv
    return d


def mk_table(tid, lab, unit, note, ser):
    ser = [s for s in ser if s["points"]]
    return {"id": tid, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "unit": unit, "note": note, "series": ser}


def T(es, en, fr, it):
    return [es, en, fr, it]


def doc(tabs, edition, now):
    return {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition, "tables": tabs}


def modified(*tables):
    out = []
    for t in tables:
        try:
            out.append(str(get("%s/TableInfos" % t, "ti_" + t)["value"][0].get("Modified", ""))[:10])
        except Exception:
            pass
    return max(out) if out else ""


# ------------------------------------------------------------ 1. facturacion 85159NED
def omzet():
    tn, rn = LB.FARM_TYPES, LB.PROVINCES
    st = pstatus("85159NED")
    raw = {}
    for g0 in rn:
        for r in rows("85159NED/TypedDataSet?" + flt("85159NED", RegioS=g0), "t85159_" + g0):
            g, t, p = r["RegioS"].strip(), r["Bedrijfstype"].strip(), period(r["Perioden"])
            if g in rn and t in tn and p:
                raw.setdefault((g, t), {})[r["Perioden"].strip()] = (r.get("Omzet_2"), r.get("Bedrijven_1"))
    log("omzet: %d combinaciones region x tipo" % len(raw))
    if not raw:
        raise RuntimeError("85159NED sin datos")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    names = dim("85159NED", "Bedrijfstype")
    nrg = dim("85159NED", "RegioS")

    def pts(g, t, i):
        return {period(k): num(v[i], 1) for k, v in raw.get((g, t), {}).items()}
    s_tipo = [mk_series("nl-" + t.lower(), tn[t], pts("NL01", t, 0), prov, names.get(t), "q") for t in tn]
    s_farm = [mk_series("nl-farms-" + t.lower(), tn[t], pts("NL01", t, 1), prov, names.get(t), "q") for t in tn]
    s_year = [mk_series("nl-year-" + t.lower(), tn[t], pts("NL01", t, 0), prov, names.get(t), "y") for t in tn]
    s_prov = []
    for g in rn:
        if g == "NL01":
            continue
        for t in LB.FARM_GROUPS:
            lab = ["%s: %s" % (rn[g][0], tn[t][0]), "%s: %s" % (rn[g][1], tn[t][1]), "%s : %s" % (rn[g][2], tn[t][2]), "%s: %s" % (rn[g][3], tn[t][3])]
            s_prov.append(mk_series("nl-%s-%s" % (g.lower(), t.lower()), lab, pts(g, t, 0), prov, "%s: %s" % (nrg.get(g, g), names.get(t, t)), "q"))
    note = "Facturacion (omzet) de las explotaciones agrarias en millones de euros por trimestre. Es volumen de negocio, no un precio. Los ultimos trimestres son provisionales."
    tabs = [mk_table("omzet-tipo", T("Facturación por tipo de explotación", "Turnover by farm type", "Chiffre d’affaires par type d’exploitation", "Fatturato per tipo di azienda"), "M€", note, s_tipo),
            mk_table("omzet-anual", T("Facturación anual por tipo de explotación", "Annual turnover by farm type", "Chiffre d’affaires annuel par type d’exploitation", "Fatturato annuo per tipo di azienda"), "M€", "Suma de los cuatro trimestres del año (el CBS publica el año completo cuando cierra el cuarto trimestre).", s_year),
            mk_table("explotaciones-tipo", T("Explotaciones por tipo", "Farms by type", "Exploitations par type", "Aziende per tipo"), "nº", "Número de explotaciones con facturación declarada en el trimestre.", s_farm),
            mk_table("omzet-provincia", T("Facturación por provincia y grupo", "Turnover by province and group", "Chiffre d’affaires par province et groupe", "Fatturato per provincia e gruppo"), "M€", note, s_prov)]
    return modified("85159NED"), tabs


# ------------------------------------------------------------ 2. horticultura 81302NED / 80783NED
def horticultura():
    out = []
    st = pstatus("81302NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    data = {}
    for r in rows("81302NED/TypedDataSet", "t81302"):
        p = period(r["Perioden"])
        if p:
            data[p] = r
    log("horticultura: 81302NED %d anos" % len(data))
    if not data:
        raise RuntimeError("81302NED sin datos")
    pr = props("81302NED")

    def build(items):
        ser = []
        for key, sid, lab in items:
            u, f = conv("81302NED", key)
            if u != "ha":
                raise RuntimeError("81302NED %s: unidad inesperada %r" % (key, u))
            ser.append(mk_series("nl-" + sid, lab, {p: num(r.get(key), f) for p, r in data.items()}, prov, pr[key]["Title"].strip()))
        return ser
    out.append(mk_table("invernadero", T("Horticultura bajo cristal: superficie", "Glasshouse horticulture: area", "Horticulture sous serre : surface", "Orticoltura in serra: superficie"), "ha", "Superficie cultivada bajo cristal en hectáreas (tomate, pimiento, pepino, flor cortada, plantas de maceta…).", build(LB.GLASS_AREA)))
    out.append(mk_table("aire-libre", T("Horticultura al aire libre: superficie", "Open-field horticulture: area", "Horticulture de plein champ : surface", "Orticoltura in pieno campo: superficie"), "ha", "Superficie al aire libre en hectáreas (bulbos, flor, vivero, fruta y hortalizas).", build(LB.OPEN_AREA)))
    # 80783NED: solo total de tipos y Holanda
    st2 = pstatus("80783NED")
    prov2 = [period(k) for k, v in st2.items() if v == "Voorlopig"]
    d2 = {}
    for r in rows("80783NED/TypedDataSet?" + flt("80783NED", RegioS="NL01", Bedrijfstypen="T001061"), "t80783"):
        p = period(r["Perioden"])
        if p:
            d2[p] = r
    log("horticultura: 80783NED %d anos" % len(d2))
    pr2 = props("80783NED")
    ser2 = []
    unit_ser = {}
    for key, sid, lab, _u in LB.OTHER_HORT:
        u, f = conv("80783NED", key)
        unit_ser.setdefault(u, []).append(mk_series("nl-" + sid, lab, {p: num(r.get(key), f) for p, r in d2.items()}, prov2, pr2[key]["Title"].strip()))
    names = {"ha": T("Setas, endibia y forzado de bulbos: superficie y cantidad", "Mushrooms, chicory and bulb forcing", "Champignons, endive et forçage", "Funghi, cicoria e forzatura"),
             "nº": T("Setas, endibia y bulbos: explotaciones", "Mushrooms, chicory and bulbs: farms", "Champignons, endive et bulbes : exploitations", "Funghi, cicoria e bulbi: aziende")}
    for u, ss in unit_ser.items():
        lab = names.get(u, T("Setas, endibia y forzado de bulbos (%s)" % u, "Mushrooms, chicory and bulb forcing (%s)" % u, "Champignons, endive et forçage (%s)" % u, "Funghi, cicoria e forzatura (%s)" % u))
        out.append(mk_table("otros-" + re.sub(r"[^a-z0-9]+", "-", u.lower()).strip("-"), lab, u, "Total nacional (todos los tipos de explotación). Cada serie conserva la unidad que publica el CBS.", ss))
    return modified("81302NED", "80783NED"), out


# ------------------------------------------------------------ 3. nitrogeno y politica
def nitrogeno():
    tabs = []
    # 3a balance de minerales 83475NED
    st = pstatus("83475NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    by = {}
    for r in rows("83475NED/TypedDataSet", "t83475"):
        m = r["Mineralen"].strip()
        p = period(r["Perioden"])
        if m in LB.MINERALS and p:
            by.setdefault(m, {})[p] = r
    log("nitrogeno: balance %d minerales" % len(by))
    if not by:
        raise RuntimeError("83475NED sin datos")
    pr = props("83475NED")
    for m, mlab in LB.MINERALS.items():
        ser = []
        for key, sid, lab in LB.MIN_BALANCE:
            u, f = conv("83475NED", key)
            if u not in ("kt", "%"):
                raise RuntimeError("83475NED %s: unidad inesperada %r" % (key, u))
            ser.append(mk_series("nl-bal-%s-%s" % (m.lower(), sid), lab, {p: num(r.get(key), f) for p, r in by.get(m, {}).items()}, prov, pr[key]["Title"].strip()))
        # cada elemento con su propia unidad: kt salvo la eficiencia (%)
        kt = [s for s in ser if not s["id"].endswith("-efficiency")]
        ef = [s for s in ser if s["id"].endswith("-efficiency")]
        n_es, n_en, n_fr, n_it = mlab
        tabs.append(mk_table("balance-" + m.lower(), T("Balance de minerales de la agricultura: %s" % n_es, "Agricultural mineral balance: %s" % n_en, "Bilan minéral de l’agriculture : %s" % n_fr, "Bilancio minerale dell’agricoltura: %s" % n_it), "kt",
                             "Entradas, salidas y pérdidas de %s del conjunto de la agricultura, en millones de kg (kt). Último año disponible: 2024." % n_es.lower(), kt))
        tabs.append(mk_table("eficiencia-" + m.lower(), T("Eficiencia de uso: %s" % n_es, "Use efficiency: %s" % n_en, "Efficacité d’utilisation : %s" % n_fr, "Efficienza d’uso: %s" % n_it), "%", "Porcentaje del mineral aportado que sale en productos agrarios.", ef))
    # 3b estiercol por tipo y provincia 83983NED
    st = pstatus("83983NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    types = set(LB.MANURE_TYPES)
    prv = LB.PROVINCES
    d83 = {}
    for r in rows("83983NED/TypedDataSet", "t83983"):
        g, t, p = r["RegioS"].strip(), r["Bedrijfstype"].strip(), period(r["Perioden"])
        if p and (t in types) and g in prv:
            d83.setdefault((g, t), {})[p] = r
    log("nitrogeno: estiercol 83983NED %d combinaciones" % len(d83))
    pr = props("83983NED")
    for key, sid, lab, cunit in LB.MANURE_TOPICS:
        u, f = conv("83983NED", key)
        ser = [mk_series("nl-man-%s-%s" % (sid, t.lower()), LB.MANURE_TYPES[t], {p: num(r.get(key), f) for p, r in d83.get(("NL01", t), {}).items()}, prov, pr[key]["Title"].strip()) for t in LB.MANURE_TYPES]
        tabs.append(mk_table("estiercol-tipo-" + sid, T("%s por tipo de explotación" % lab[0], "%s by farm type" % lab[1], "%s par type d’exploitation" % lab[2], "%s per tipo di azienda" % lab[3]), u, "Total nacional por tipo de explotación.", ser))
    for key, sid, lab, cunit in LB.MANURE_TOPICS:
        u, f = conv("83983NED", key)
        ser = []
        for g in prv:
            if g == "NL01":
                continue
            ser.append(mk_series("nl-man-%s-%s" % (sid, g.lower()), prv[g], {p: num(r.get(key), f) for p, r in d83.get((g, "T001061"), {}).items()}, prov))
        tabs.append(mk_table("estiercol-provincia-" + sid, T("%s por provincia" % lab[0], "%s by province" % lab[1], "%s par province" % lab[2], "%s per provincia" % lab[3]), u, "Todas las explotaciones, por provincia.", ser))
    # 3c por animal 83982NED
    st = pstatus("83982NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d82 = {}
    for r in rows("83982NED/TypedDataSet?" + flt("83982NED", RegioS="NL01"), "t83982"):
        t, p = r["Diercategorie"].strip(), period(r["Perioden"])
        if p and t in LB.ANIMALS:
            d82.setdefault(t, {})[p] = r
    log("nitrogeno: por animal 83982NED %d categorias" % len(d82))
    pr = props("83982NED")
    topics82 = [("TotaalMestproductie_1", "manure", LB.MANURE_TOPICS[0][2]), ("TotaalStikstofuitscheiding_5", "n-excr", LB.MANURE_TOPICS[1][2]),
                ("AmmoniakemissieN_9", "nh3", LB.MANURE_TOPICS[2][2]), ("TotaalFosfaatuitscheiding_13", "p-excr", LB.MANURE_TOPICS[3][2])]
    for key, sid, lab in topics82:
        u, f = conv("83982NED", key)
        ser = [mk_series("nl-ani-%s-%s" % (sid, t.lower()), LB.ANIMALS[t], {p: num(r.get(key), f) for p, r in d82.get(t, {}).items()}, prov, pr[key]["Title"].strip()) for t in LB.ANIMALS]
        tabs.append(mk_table("animal-" + sid, T("%s por especie" % lab[0], "%s by animal category" % lab[1], "%s par catégorie d’animaux" % lab[2], "%s per categoria animale" % lab[3]), u, "Total nacional por categoría de animal.", ser))
    # 3d estiercol fuera de la agricultura 83655NED
    st = pstatus("83655NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d55 = {}
    for r in rows("83655NED/TypedDataSet?" + flt("83655NED", Mestsoorten="T001263"), "t83655"):
        m, p = r["Mineralen"].strip(), period(r["Perioden"])
        if p and m in ("A028942", "A028943"):
            d55.setdefault(m, {})[p] = r
    pr = props("83655NED")
    for m, mlab in (("A028942", LB.MINERALS["A028942"]), ("A028943", T("Fosfato (P2O5)", "Phosphate (P2O5)", "Phosphate (P2O5)", "Fosfato (P2O5)"))):
        ser = []
        for key, sid, lab in LB.MANURE_OUT:
            u, f = conv("83655NED", key)
            ser.append(mk_series("nl-out-%s-%s" % (m.lower(), sid), lab, {p: num(r.get(key), f) for p, r in d55.get(m, {}).items()}, prov, pr[key]["Title"].strip()))
        tabs.append(mk_table("estiercol-fuera-" + m.lower(), T("Estiércol colocado fuera de la agricultura: %s" % mlab[0], "Manure placed outside agriculture: %s" % mlab[1], "Effluents placés hors agriculture : %s" % mlab[2], "Letame collocato fuori dall’agricoltura: %s" % mlab[3]), "kt",
                             "Contenido en %s del estiércol vendido fuera de la agricultura (exportación neta, tratamiento industrial, espacios naturales, aficionados)." % mlab[0].lower(), ser))
    # 3e fitosanitarios 83566NED
    st = pstatus("83566NED")
    prov = [period(k) for k, v in st.items() if v in ("Voorlopig", "NaderVoorlopig")]
    d66 = {}
    for r in rows("83566NED/TypedDataSet", "t83566"):
        t, p = r["Toepassingsgroepen"].strip(), period(r["Perioden"])
        if p and t in LB.PESTICIDE_GROUPS:
            d66.setdefault(t, {})[p] = r
    u, f = conv("83566NED", "AfzetWerkzameStof_1")
    ser = [mk_series("nl-pest-" + t.lower(), LB.PESTICIDE_GROUPS[t], {p: num(r.get("AfzetWerkzameStof_1"), f) for p, r in d66.get(t, {}).items()}, prov, None) for t in LB.PESTICIDE_GROUPS]
    tabs.append(mk_table("fitosanitarios", T("Fitosanitarios vendidos (materia activa)", "Plant protection products sold (active substance)", "Produits phytosanitaires vendus (substance active)", "Prodotti fitosanitari venduti (sostanza attiva)"), u, "Ventas de materia activa por grupo de aplicación, en toneladas.", ser))
    log("nitrogeno: fitosanitarios %d grupos" % len(d66))
    # 3f derechos de produccion 80240NED
    st = pstatus("80240NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d40 = {}
    for r in rows("80240NED/TypedDataSet", "t80240"):
        g, p = r["RegioS"].strip(), period(r["Perioden"])
        if p:
            d40.setdefault(g, {})[p] = r
    rn80 = dim("80240NED", "RegioS")
    pr = props("80240NED")
    for key, sid, lab, cunit in LB.RIGHTS_TOPICS:
        u, f = conv("80240NED", key)
        ser = []
        for g in ["NL01"] + [x for x in LB.PROVINCES if x != "NL01"]:
            if g in d40:
                ser.append(mk_series("nl-rights-%s-%s" % (sid, g.lower()), LB.PROVINCES[g], {p: num(r.get(key), f) for p, r in d40[g].items()}, prov, pr[key]["Title"].strip()))
        tabs.append(mk_table("derechos-" + sid, T(lab[0], lab[1], lab[2], lab[3]), u, "Derechos de producción de cerdos y aves (sistema de reducción de fosfato y derechos de cría), por provincia.", ser))
    log("nitrogeno: derechos %d regiones" % len(d40))
    return modified("83475NED", "83983NED", "83982NED", "83655NED", "83566NED", "80240NED"), tabs


# ------------------------------------------------------------ 4. cadena de precios
def cadena():
    tabs = []
    st = pstatus("85770NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    names = dim("85770NED", "AlleProdComCoderingen")
    byarea = {a[0]: {} for a in LB.PPI_AREAS}
    for code, sid, lab in LB.PPI_PRODUCTS:
        for r in rows("85770NED/TypedDataSet?" + flt("85770NED", AlleProdComCoderingen=code), "t85770_" + code):
            a, p = r["Afzetgebieden"].strip(), period(r["Perioden"])
            if a in byarea and p:
                byarea[a].setdefault(code, {})[p] = r.get("ProducentenprijsindexPPI_1")
    log("cadena: PPI %d lineas" % len(byarea[LB.PPI_AREAS[0][0]]))
    if not byarea[LB.PPI_AREAS[0][0]]:
        raise RuntimeError("85770NED sin datos")
    for a, asid, alab in LB.PPI_AREAS:
        ser = [mk_series("nl-ppi-%s-%s" % (asid, sid), lab, {p: num(v, 1) for p, v in byarea[a].get(code, {}).items()}, prov, names.get(code), "m") for code, sid, lab in LB.PPI_PRODUCTS]
        tabs.append(mk_table("ppi-" + asid, T("Precios de la industria alimentaria: %s" % alab[0], "Food-industry producer prices: %s" % alab[1], "Prix à la production de l’industrie alimentaire : %s" % alab[2], "Prezzi alla produzione dell’industria alimentare: %s" % alab[3]), "índice 2021=100",
                             "Índice de precios de productor (PPI) de la industria alimentaria y de bebidas, 2021 = 100, mensual desde 2018.", ser))
    st = pstatus("86141NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    names = dim("86141NED", "Bestedingscategorieen")
    d = {}
    for code, sid, lab in LB.CPI_ITEMS:
        for r in rows("86141NED/TypedDataSet?" + flt("86141NED", Bestedingscategorieen=code), "t86141_" + code):
            p = period(r["Perioden"])
            if p:
                d.setdefault(code, {})[p] = r.get("CPI_1")
    log("cadena: IPC %d categorias" % len(d))
    ser = [mk_series("nl-cpi-" + sid, lab, {p: num(v, 1) for p, v in d.get(code, {}).items()}, prov, names.get(code), "m") for code, sid, lab in LB.CPI_ITEMS]
    tabs.append(mk_table("ipc-alimentos", T("IPC de alimentos y bebidas", "Consumer prices: food and beverages", "Prix à la consommation : alimentation et boissons", "Prezzi al consumo: alimentari e bevande"), "índice 2025=100", "Índice de precios al consumo por categoría COICOP, 2025 = 100, mensual desde diciembre de 2009.", ser))
    return modified("85770NED", "86141NED"), tabs


# ------------------------------------------------------------ 5. otros
def otros():
    tabs = []
    st = pstatus("37738")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d = {}
    for r in rows("37738/TypedDataSet", "t37738"):
        g, p = r["Groenten"].strip(), period(r["Perioden"])
        if p:
            d.setdefault(g, {})[p] = r
    log("otros: hortalizas %d especies" % len(d))
    if not d:
        raise RuntimeError("37738 sin datos")
    nm = dim("37738", "Groenten")
    for key, sid, lab in (("Oogst_1", "harvest", T("Hortalizas: cosecha por especie", "Vegetables: harvest by species", "Légumes : récolte par espèce", "Ortaggi: raccolto per specie")),
                          ("Teeltoppervlakte_2", "area", T("Hortalizas: superficie por especie", "Vegetables: area by species", "Légumes : surface par espèce", "Ortaggi: superficie per specie"))):
        u, f = conv("37738", key)
        ser = [mk_series("nl-veg-%s-%s" % (sid, v[1]), v[2], {p: num(r.get(key), f) for p, r in d.get(v[0], {}).items()}, prov, nm.get(v[0])) for v in LB.VEG]
        tabs.append(mk_table("hortalizas-" + sid, lab, u, "Cosecha en kt (mln kg) y superficie en ha, 1998-2025.", ser))
    # pastoreo 85303NED
    st = pstatus("85303NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d = {}
    for r in rows("85303NED/TypedDataSet?" + flt("85303NED", RegioS="NL01", Melkvee="A028975", GrootveeEenheid="T001355"), "t85303"):
        p = period(r["Perioden"])
        if p:
            d[p] = r
    log("otros: pastoreo %d anos" % len(d))
    pr = props("85303NED")
    for key, sid, lab, cunit in LB.GRAZING:
        u, f = conv("85303NED", key)
        tabs.append(mk_table("pastoreo-" + sid, T("Pastoreo de vacas de leche: %s" % lab[0], "Dairy-cow grazing: %s" % lab[1], "Pâturage des vaches laitières : %s" % lab[2], "Pascolo delle vacche da latte: %s" % lab[3]), u, "Vacas de leche y de cría (≥ 2 años), total nacional.",
                             [mk_series("nl-graze-" + sid, lab, {p: num(r.get(key), f) for p, r in d.items()}, prov, pr[key]["Title"].strip())]))
    # huevos 86338NED
    st = pstatus("86338NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d = {}
    for r in rows("86338NED/TypedDataSet", "t86338"):
        p = period(r["Perioden"])
        if p:
            d[p] = r
    ser = []
    pr = props("86338NED")
    for key, sid, lab in LB.EGGS:
        u, f = conv("86338NED", key)
        ser.append(mk_series("nl-eggs-" + sid, lab, {p: num(r.get(key), f) for p, r in d.items()}, prov, pr[key]["Title"].strip()))
    tabs.append(mk_table("huevos", T("Huevos de consumo: convencionales y ecológicos", "Table eggs: conventional and organic", "Œufs de consommation : conventionnels et biologiques", "Uova da consumo: convenzionali e biologiche"), "M uds", "Producción de huevos de consumo en millones de unidades (2022-2025; el CBS publica el comparativo ecológico/convencional desde 2022).", ser))
    log("otros: huevos %d anos" % len(d))
    # finanzas 84448NED
    st = pstatus("84448NED")
    prov = [period(k) for k, v in st.items() if v == "Voorlopig"]
    d = {}
    for r in rows("84448NED/TypedDataSet", "t84448"):
        t, m, p = r["Bedrijfstypen"].strip(), r["Landbouwmethoden"].strip(), period(r["Perioden"])
        if p and m in LB.METHODS and t in LB.FIN_TYPES:
            d.setdefault((t, m), {})[p] = r
    log("otros: finanzas %d combinaciones" % len(d))
    pr = props("84448NED")
    for key, sid, lab, cunit in LB.FIN_TOPICS:
        u, f = conv("84448NED", key)
        ser = []
        for t in LB.FIN_TYPES:
            for m in LB.METHODS:
                ml = LB.METHODS[m]
                tl = LB.FARM_TYPES[t]
                nm = [("%s (%s)" % (tl[i], ml[i])) for i in range(4)]
                ser.append(mk_series("nl-fin-%s-%s-%s" % (sid, t.lower(), m.lower()), nm, {p: num(r.get(key), f) for p, r in d.get((t, m), {}).items()}, prov))
        tabs.append(mk_table("finanzas-" + sid, T("Finanzas de las explotaciones: %s" % lab[0], "Farm finances: %s" % lab[1], "Finances des exploitations : %s" % lab[2], "Finanze delle aziende: %s" % lab[3]), u, "Datos de balance y cuenta de resultados de las explotaciones, por tipo y método (total, ecológica, convencional). 2010-2023.", ser))
    # cosecha provisional frente a definitiva 85676NED
    d = {}
    for r in rows("85676NED/TypedDataSet", "t85676"):
        g, p = r["Gewassen"].strip(), period(r["Perioden"])
        if p:
            d.setdefault(g, {})[p] = r
    log("otros: cosecha provisional %d cultivos" % len(d))
    nm = dim("85676NED", "Gewassen")
    blocks = [("area", "Superficie sembrada", "Sown area", "Surface semée", "Superficie seminata", "VoorlopigeOogstraming_1", "DefinitieveOogstraming_2", "Verschil_3"),
              ("prod", "Producción bruta", "Gross production", "Production brute", "Produzione lorda", "VoorlopigeOogstraming_9", "DefinitieveOogstraming_10", "Verschil_11")]
    for sid, es, en, fr, it, kp, kd, kv in blocks:
        for kind, key, lab in (("prov", kp, T("estimación provisional", "provisional estimate", "estimation provisoire", "stima provvisoria")), ("def", kd, T("estimación definitiva", "final estimate", "estimation définitive", "stima definitiva")),
                               ("diff", kv, T("diferencia (definitiva frente a provisional)", "difference (final vs provisional)", "écart (définitive par rapport à provisoire)", "differenza (definitiva rispetto a provvisoria)"))):
            u, f = conv("85676NED", key)
            ser = []
            for code, csid, clab in LB.CROPS:
                ser.append(mk_series("nl-est-%s-%s-%s" % (sid, kind, csid), clab, {p: num(r.get(key), f) for p, r in d.get(code, {}).items()}, None, nm.get(code)))
            tabs.append(mk_table("estimacion-%s-%s" % (sid, kind), T("%s: %s" % (es, lab[0]), "%s: %s" % (en, lab[1]), "%s : %s" % (fr, lab[2]), "%s: %s" % (it, lab[3])), u,
                                 "Estimación de cosecha del CBS: la provisional se publica durante la campaña y la definitiva al cerrarla; la diferencia mide cuánto se corrige.", ser))
    return modified("37738", "85303NED", "86338NED", "84448NED", "85676NED"), tabs


# ------------------------------------------------------------ estadisticas (catalogo de series)
def load(name):
    try:
        return json.loads((OUT / name).read_text(encoding="utf-8"))
    except Exception:
        return None


def tbl(d, tid):
    return next((t for t in (d or {}).get("tables", []) if t["id"] == tid), None)


def one(d, tid, sid):
    t = tbl(d, tid)
    return next((s for s in (t or {"series": []})["series"] if s["id"] == sid), None), t


def stats(docs, now):
    out = []

    def add(sid, grp, label, unit, s, freq, minpts=2):
        if not s or len(s["points"]) < minpts:
            return
        p = s["points"]
        ch = None
        if freq == "annual":
            ch = round((p[-1][1] / p[-2][1] - 1) * 100, 2) if p[-2][1] else None
        elif freq == "quarterly":
            prev = next((v for k, v in p if k == "%d-%s" % (int(p[-1][0][:4]) - 1, p[-1][0][5:])), None)
            ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        elif freq == "monthly":
            prev = next((v for k, v in p if k == "%d-%s" % (int(p[-1][0][:4]) - 1, p[-1][0][5:])), None)
            ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": freq, "latestPeriod": p[-1][0], "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "netherlands-more"})

    o = docs.get("omzet.json")
    for t in ("T001061", "A009502", "A009488", "A009490", "A009489", "A009514", "A009511", "A009493"):
        s, tb = one(o, "omzet-tipo", "nl-" + t.lower())
        if s:
            add("nl-omzet-" + t.lower(), "income", "Facturación de las explotaciones: %s (CBS)" % s["label"], "M€", s, "quarterly", 8)
    h = docs.get("horticultura.json")
    for tid, sid, nm in (("invernadero", "glass-total", "Horticultura bajo cristal"), ("invernadero", "tomato", "Tomate bajo cristal"), ("invernadero", "pepper", "Pimiento bajo cristal"), ("invernadero", "cucumber", "Pepino bajo cristal"),
                         ("invernadero", "cut-glass", "Flor cortada bajo cristal"), ("invernadero", "pot-plants", "Plantas de maceta"), ("aire-libre", "bulbs", "Bulbos y tubérculos de flor"), ("aire-libre", "tulips", "Tulipanes (bulbo)"),
                         ("aire-libre", "nursery-open", "Viveros y plantas vivaces"), ("aire-libre", "veg-open", "Hortalizas al aire libre")):
        s, tb = one(h, tid, "nl-" + sid)
        if s:
            add("nl-hort-%s-%s" % (tid, sid), "crops", "Superficie, Países Bajos: %s (CBS)" % nm, "ha", s, "annual", 10)
    s, tb = one(h, "otros-ha", "nl-mushroom-area")
    if s:
        add("nl-hort-mushroom-area", "crops", "Superficie de cultivo de champiñón, Países Bajos (CBS)", "ha", s, "annual", 10)
    n = docs.get("nitrogeno.json")
    for tid, sid, nm in (("balance-a028942", "loss-total", "Pérdida total de nitrógeno de la agricultura"), ("balance-a028942", "loss-soil", "Pérdida de nitrógeno al suelo y al agua"), ("balance-a028942", "nh3", "Volatilización de amoníaco (balance)"),
                         ("balance-a028942", "in-fert", "Nitrógeno aportado como abono mineral")):
        s, tb = one(n, tid, "nl-bal-a028942-" + sid)
        if s:
            add("nl-nbal-" + sid, "environment", "%s, Países Bajos (CBS)" % nm, "kt", s, "annual", 10)
    s, tb = one(n, "eficiencia-a028942", "nl-bal-a028942-efficiency")
    if s:
        add("nl-nbal-efficiency", "environment", "Eficiencia de uso del nitrógeno, Países Bajos (CBS)", "%", s, "annual", 10)
    for tid, sid, nm in (("estiercol-tipo-nh3", "nl-man-nh3-t001061", "Emisión de amoníaco de la ganadería (estiércol)"), ("estiercol-tipo-n-excr", "nl-man-n-excr-t001061", "Excreción de nitrógeno de la ganadería"),
                         ("estiercol-tipo-n-surplus", "nl-man-n-surplus-t001061", "Excedente de nitrógeno de la ganadería"), ("estiercol-tipo-manure", "nl-man-manure-t001061", "Producción de estiércol")):
        s, tb = one(n, tid, sid)
        if s:
            add("nl-" + tid, "environment", "%s, Países Bajos (CBS)" % nm, tb["unit"], s, "annual", 10)
    s, tb = one(n, "fitosanitarios", "nl-pest-t001222")
    if s:
        add("nl-pesticides-total", "inputs", "Fitosanitarios vendidos (materia activa), Países Bajos (CBS)", "t", s, "annual", 8)
    for tid, nm in (("derechos-pig-units", "Derechos de cerdos"), ("derechos-poultry-units", "Derechos de aves")):
        s, tb = one(n, tid, "nl-rights-%s-nl01" % tid.split("derechos-")[1])
        if s:
            add("nl-" + tid, "livestock", "%s (unidades), Países Bajos (CBS)" % nm, tb["unit"], s, "annual", 10)
    c = docs.get("cadena.json")
    for sid, nm in (("food", "alimentación (total)"), ("meat", "carne transformada"), ("poultry", "carne de ave"), ("dairy", "lácteos"), ("cheese", "queso"), ("bakery", "panadería y pastas"), ("oils", "aceites y grasas"), ("sugar", "azúcar"), ("feed", "piensos")):
        s, tb = one(c, "ppi-all", "nl-ppi-all-" + sid)
        if s:
            add("nl-ppi-" + sid, "prices", "Precios de productor de la industria: %s, Países Bajos (CBS)" % nm, "índice 2021=100", s, "monthly", 24)
    for sid, nm in (("food-drink", "alimentos y bebidas"), ("food", "alimentos"), ("meat-all", "carne"), ("dairy-eggs", "leche, lácteos y huevos"), ("bread", "pan"), ("vegetables", "hortalizas"), ("fruit", "fruta"), ("butter", "mantequilla")):
        s, tb = one(c, "ipc-alimentos", "nl-cpi-" + sid)
        if s:
            add("nl-cpi-" + sid, "consumption", "IPC, %s, Países Bajos (CBS)" % nm, "índice 2025=100", s, "monthly", 24)
    ot = docs.get("otros.json")
    for sid, nm in (("tomato", "tomate"), ("pepper", "pimiento"), ("cucumber", "pepino"), ("onion", "cebolla"), ("carrot-winter", "zanahoria de invierno"), ("mushroom", "champiñón"), ("total", "total hortalizas")):
        s, tb = one(ot, "hortalizas-harvest", "nl-veg-harvest-" + sid)
        if s:
            add("nl-veg-harvest-" + sid, "crops", "Cosecha de hortalizas: %s, Países Bajos (CBS)" % nm, "kt", s, "annual", 10)
    s, tb = one(ot, "pastoreo-days", "nl-graze-days")
    if s:
        add("nl-graze-days", "livestock", "Días de pastoreo de las vacas de leche, Países Bajos (CBS)", "días/año", s, "annual", 8)
    for sid, nm in (("organic", "ecológicos"), ("conventional", "convencionales"), ("total", "total")):
        s, tb = one(ot, "huevos", "nl-eggs-" + sid)
        if s:
            add("nl-eggs-" + sid, "production", "Huevos de consumo %s, Países Bajos (CBS)" % nm, "M uds", s, "annual", 3)
    for sid, nm in (("assets", "activo total"), ("equity", "patrimonio neto"), ("debt-long", "deuda a largo plazo"), ("result", "resultado ordinario")):
        s, tb = one(ot, "finanzas-" + sid, "nl-fin-%s-t001061-t001368" % sid)
        if s:
            add("nl-fin-" + sid, "income", "Finanzas de las explotaciones: %s, Países Bajos (CBS)" % nm, "M€", s, "annual", 8)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"NL": {"name": "Netherlands", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    jobs = [("omzet", omzet), ("horticultura", horticultura), ("nitrogeno", nitrogeno), ("cadena", cadena), ("otros", otros)]
    for name, fn in jobs:
        try:
            ed, tabs = fn()
            docs[name + ".json"] = doc(tabs, ed, now)
            log("%s: leido (CBS al %s, %d tablas, %d series)" % (name, ed, len(tabs), sum(len(t["series"]) for t in tabs)))
        except Exception as ex:
            log("%s: NO se pudo leer (%s); se conserva lo publicado" % (name, str(ex)[:200]))
    files = []
    for n, (title, desc) in FILES.items():
        d = docs.get(n)
        if not d:
            continue
        (OUT / n).write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        files.append({"file": n, "title": title, "description": desc, "edition": d["edition"], "tables": len(d["tables"]), "series": sum(len(t["series"]) for t in d["tables"]), "generatedAt": d["generatedAt"]})
    if not files:
        log("sin datos; no se escribe nada")
        (ROOT / "data" / "netherlands-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "netherlands-more-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["NL"]["series"])))
    (ROOT / "data" / "netherlands-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

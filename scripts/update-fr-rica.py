#!/usr/bin/env python3
"""Francia: cuentas de las explotaciones (RICA, Agreste/SSP), series 1988-2024
-> data/france-rica/index.json, national.json, regional.json, by-size.json y data/france-rica-stats.json (series clave para el catalogo).

Fuente: libro «RICA series longues» (ficha disaron/RICA-SeriesLongues). Explotaciones de Francia metropolitana con produccion bruta estandar (PBS) > 25 000 EUR
(15 000 EUR en los DROM). Cada fila es orientacion tecnico-economica (OTEX) x clase de dimension economica (CDEX) x indicador (83), una columna por año.
- national.json: Francia metropolitana, OTEX x CDEX, EUR corrientes (todos los indicadores) y EUR constantes de 2024 (solo los indicadores que cambian con la inflacion).
- regional.json: antiguas regiones (22) x OTEX, todas las clases, EUR corrientes, indicadores clave.
- by-size.json: antiguas regiones x clase, todas las OTEX, EUR corrientes, indicadores clave.
Una celda vacia es null: el RICA no la difunde si hay menos de 20 explotaciones en la muestra. Nada se estima. Si la descarga falla se conserva lo publicado."""
import datetime, json, re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import XL, DL, detail_files, fetch, num, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-rica"
FALLBACK = DL + "RICA-SeriesLongues/RICA_s%C3%A9ries_longues.xlsx"
LOG = []
SRC = {"name": "Agreste (SSP) - Reseau d'information comptable agricole (RICA), series longues 1988-2024",
       "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/RICA-SeriesLongues/detail/", "license": "Licence Ouverte 2.0 (Etalab)"}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\([^)]*\)\s*$", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


OTEX = {"Toutes": "all", "Céréales et oléoprotéagineux": "cereales", "Autres grandes cultures": "autres-gc", "Maraîchage": "maraichage", "Horticulture": "horticulture",
        "Viticulture": "viticulture", "Fruits et autres cultures permanentes": "fruits", "Bovins lait": "bovins-lait", "Bovins viande": "bovins-viande", "Bovins mixtes": "bovins-mixtes",
        "Ovins et caprins": "ovins-caprins", "Autres herbivores": "autres-herbivores", "Porcins": "porcins", "Volailles": "volailles", "Granivores mixtes": "granivores-mixtes",
        "Polyculture polyélevage": "polyculture"}
OTEX_EN = {"all": "All farm types", "cereales": "Cereals and oilseeds", "autres-gc": "Other field crops", "maraichage": "Market gardening", "horticulture": "Horticulture", "viticulture": "Wine growing",
           "fruits": "Fruit and other permanent crops", "bovins-lait": "Dairy cattle", "bovins-viande": "Beef cattle", "bovins-mixtes": "Mixed cattle", "ovins-caprins": "Sheep and goats",
           "autres-herbivores": "Other grazing livestock", "porcins": "Pigs", "volailles": "Poultry", "granivores-mixtes": "Mixed granivores", "polyculture": "Mixed crops and livestock"}
CDEX_EN = {"all": "All sizes", "small": "Small farms (SPO up to EUR 100,000)", "medium": "Medium farms (SPO EUR 100,000-250,000)", "large": "Large farms (SPO over EUR 250,000)"}


def cdex_id(s):
    s = s.strip()
    if s.startswith("Toutes"):
        return "all"
    if s.startswith("Petites"):
        return "small"
    if s.startswith("Moyennes"):
        return "medium"
    if s.startswith("Grandes"):
        return "large"
    return None


# indicador clave -> (id, nombre en ingles). Se busca por el texto exacto de la fuente (sin la unidad).
KEY = [("Nombre d'exploitations dans échantillon", "sample", "Farms in sample"), ("Nombre d'exploitations représentées", "farms", "Farms represented"),
       ("Production brute standard", "spo", "Standard output per farm"), ("Surface agricole utile", "uaa", "Utilised agricultural area per farm"),
       ("Main d'oeuvre totale", "labour", "Labour, total (FTE)"), ("Main d'oeuvre non salariée", "labour-family", "Unpaid labour (FTE)"),
       ("Production de l'exercice", "output", "Output of the year"), ("Consommations intermédiaires", "intermediate", "Intermediate consumption"),
       ("Valeur ajoutée", "gva", "Value added"), ("Excédent brut d'exploitation", "ebe", "Gross operating surplus (EBE)"),
       ("Résultat courant avant impôts", "rcai", "Current result before tax (RCAI)"), ("Résultat de l'exercice", "result", "Net result of the year"),
       ("Subventions d'exploitation", "subsidies", "Operating subsidies"), ("Charges d'approvisionnement", "supplies", "Supply costs (feed, seed, fertiliser, etc.)"),
       ("Engrais et amendements", "fertiliser", "Fertilisers and soil improvers"), ("Produits phytosanitaires", "pesticides", "Plant protection products"),
       ("Carburants et lubrifiants", "fuel", "Fuel and lubricants"), ("Loyers et fermages", "rents", "Rents and leases"), ("Charges de personnel", "wages", "Staff costs"),
       ("Total des charges", "costs", "Total costs"), ("Production de l'exercice par hectare", "output-ha", "Output per hectare"),
       ("Production de l'exercice par ETP", "output-fte", "Output per FTE"), ("RCAI par ETP non salarié", "rcai-fte", "RCAI per unpaid FTE"),
       ("Taux d'endettement", "debt-ratio", "Debt ratio"), ("Indépendance financière", "independence", "Financial independence")]
# los que van al catalogo (nacional, toda la poblacion)
CAT_NAT = ["spo", "uaa", "labour", "output", "gva", "ebe", "rcai", "result", "subsidies", "costs", "rcai-fte", "output-ha", "debt-ratio", "independence", "farms", "fertiliser", "pesticides", "fuel", "wages"]
CAT_BY_OTEX = ["rcai", "rcai-fte", "output", "subsidies"]
CAT_BY_CDEX = ["rcai", "rcai-fte", "output"]
CAT_REGION = ["rcai", "rcai-fte"]


def unit_of(label):
    m = re.search(r"\(([^)]*)\)\s*$", label)
    return m.group(1) if m else "farms"


def read_sheet(x, name):
    """-> (anos, filas [(clave1, clave2, indicador, valores)]). Las claves son las dos primeras columnas."""
    it = x.rows(name)
    h = next(it)
    yi = [(i, int(c)) for i, c in enumerate(h) if re.fullmatch(r"\d{4}", str(c).strip())]
    if not yi:
        raise ValueError("sin columnas de año en " + name)
    ys = [y for _, y in yi]
    rows = []
    for r in it:
        if len(r) < 3 or not r[2]:
            continue
        rows.append((r[0].strip(), r[1].strip(), r[2].strip(), [num(r[i]) if i < len(r) else None for i, _ in yi]))
    return ys, rows


def discover():
    try:
        urls, _ = detail_files("RICA-SeriesLongues", log=log)
        u = pick(urls, r"RICA.*\.xlsx$")
        if u:
            return quote_url(u)
    except Exception as e:
        log("ficha ilegible, se usa la direccion conocida:", str(e)[:120])
    return FALLBACK


def put(d, keys, v):
    for k in keys[:-1]:
        d = d.setdefault(k, {})
    d[keys[-1]] = v


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        url = discover()
        log("descargando", url)
        x = XL(fetch(url, "bin", tries=6, wait=25, timeout=300, log=log))
    except Exception as e:
        log("DESCARGA FALLIDA, se conserva lo publicado:", str(e)[:200])
        (ROOT / "data" / "france-rica-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    names = x.names()
    need = ["France hors DROM - € courants", "France hors DROM - € constants", "Toutes CDEX - € courants", "Toutes OTEX - € courants"]
    for n in need:
        if n not in names:
            log("falta la hoja", n, "- hojas:", names)
            sys.exit(1)
    ys, cur = read_sheet(x, need[0])
    ys2, con = read_sheet(x, need[1])
    if ys2 != ys:
        log("años distintos entre euros corrientes y constantes")
        sys.exit(1)
    # indicadores: orden de la fuente, ids por clave o por texto
    labels = []
    for _, _, ind, _ in cur:
        if ind not in labels:
            labels.append(ind)
    key_by_label = {}
    for base, kid, en in KEY:
        hit = [l for l in labels if re.sub(r"\s*\([^)]*\)\s*$", "", l) == base]
        if hit:
            key_by_label[hit[0]] = (kid, en)
        else:
            log("indicador clave que ya no existe en la fuente:", base)
    ind_id = {}
    for l in labels:
        ind_id[l] = key_by_label[l][0] if l in key_by_label else slug(l)
    if len(set(ind_id.values())) != len(ind_id):
        log("identificadores de indicador repetidos")
        sys.exit(1)
    nat = {}
    for o, c, ind, v in cur:
        oi, ci = OTEX.get(o), cdex_id(c)
        if oi is None or ci is None:
            log("OTEX o CDEX nuevos, se ignoran:", o, c)
            continue
        put(nat, [oi, ci, ind_id[ind]], v)
    conn = {}
    changed = set()
    curmap = {(OTEX.get(o), cdex_id(c), ind_id[i]): v for o, c, i, v in cur}
    for o, c, ind, v in con:
        k = (OTEX.get(o), cdex_id(c), ind_id[ind])
        if k[0] is None or k[1] is None:
            continue
        if curmap.get(k) != v:
            put(conn, [k[0], k[1], k[2]], v)
            changed.add(ind_id[ind])
    # comprobaciones minimas antes de publicar
    tot = nat.get("all", {}).get("all", {}).get("rcai")
    if not tot or sum(1 for v in tot if v is not None) < 30 or len(nat) < 14:
        log("el cuadro nacional no tiene la forma esperada (RCAI total o numero de OTEX): no se publica")
        sys.exit(1)
    # regional (anteriores regiones): todas las clases, por OTEX; y por clase, todas las OTEX
    keyids = {kid for _, kid, _ in KEY}
    ys3, reg_rows = read_sheet(x, need[2])
    ys4, size_rows = read_sheet(x, need[3])
    if ys3 != ys or ys4 != ys:
        log("años distintos en las hojas regionales")
        sys.exit(1)
    regional, regions = {}, []
    for g, o, ind, v in reg_rows:
        oi = OTEX.get(o)
        if oi is None or ind_id.get(ind) not in keyids:
            continue
        if g not in regions:
            regions.append(g)
        put(regional, [g, oi, ind_id[ind]], v)
    bysize = {}
    for g, c, ind, v in size_rows:
        ci = cdex_id(c)
        if ci is None or ind_id.get(ind) not in keyids:
            continue
        put(bysize, [g, ci, ind_id[ind]], v)
    index = {"schemaVersion": 1, "generatedAt": now, "source": SRC, "years": ys,
             "field": "Explotaciones con produccion bruta estandar (PBS) superior a 25 000 EUR (15 000 EUR en los DROM). Los indicadores son medias por explotacion, salvo los recuentos.",
             "otex": {i: {"fr": o, "en": OTEX_EN[i]} for o, i in OTEX.items()}, "cdex": {"all": {"fr": "Toutes", "en": CDEX_EN["all"]}, "small": {"fr": "Petites structures - PBS inférieure ou égale à 100 000 €", "en": CDEX_EN["small"]},
             "medium": {"fr": "Moyennes structures - PBS comprise entre 100 000 et 250 000 €", "en": CDEX_EN["medium"]}, "large": {"fr": "Grandes structures - PBS supérieure ou égale à 250 000 €", "en": CDEX_EN["large"]}},
             "indicators": [dict(id=ind_id[l], fr=l, unit=unit_of(l), key=l in key_by_label, constant=ind_id[l] in changed, **({"en": key_by_label[l][1]} if l in key_by_label else {})) for l in labels],
             "regions": regions, "constantBase": 2024}
    dump = lambda p, o: (OUT / p).write_text(json.dumps(o, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    dump("index.json", index)
    dump("national.json", {"schemaVersion": 1, "generatedAt": now, "years": ys, "area": "France hors DROM", "current": nat, "constant": conn})
    dump("regional.json", {"schemaVersion": 1, "generatedAt": now, "years": ys, "basis": "current", "data": regional})
    dump("by-size.json", {"schemaVersion": 1, "generatedAt": now, "years": ys, "basis": "current", "data": bysize})
    log("ok", len(labels), "indicadores", len(nat), "OTEX", len(regions), "regiones", len(changed), "indicadores en euros constantes", ys[0], "-", ys[-1])
    st = stats(index, nat, conn, regional, ys, now)
    n = len(st["countries"]["FR"]["series"])
    if n < 60:
        log("pocas series de catalogo (%d): no se escribe france-rica-stats.json" % n)
        sys.exit(1)
    (ROOT / "data" / "france-rica-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("series de catalogo:", n)
    (ROOT / "data" / "france-rica-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


def mk(sid, label, unit, ys, vals):
    pts = [[str(y), v] for y, v in zip(ys, vals) if v is not None]
    if len(pts) < 2:
        return None
    last, prev = pts[-1][1], pts[-2][1]
    return {"id": sid, "group": "income", "label": label, "unit": unit, "frequency": "annual", "latestPeriod": pts[-1][0], "latest": last,
            "changePct": round((last / prev - 1) * 100, 2) if prev and prev > 0 and last is not None else None, "points": pts, "sourceGroup": "agreste-rica"}


def stats(index, nat, conn, regional, ys, now):
    ind = {i["id"]: i for i in index["indicators"]}
    out = []

    def add(s):
        if s:
            out.append(s)

    def lab(i):
        return ind[i].get("en") or ind[i]["fr"]

    for i in CAT_NAT:
        v = nat.get("all", {}).get("all", {}).get(i)
        if v and i in ind:
            u = ind[i]["unit"]
            add(mk("fr-rica-nat-%s" % i, "Farm accounts: %s, all farms, France (RICA)" % lab(i), u, ys, v))
    v = conn.get("all", {}).get("all", {}).get("rcai")
    if v:
        add(mk("fr-rica-nat-rcai-real", "Farm accounts: Current result before tax, constant 2024 euros, all farms, France (RICA)", "€", ys, v))
    for o, oid in OTEX.items():
        if oid == "all":
            continue
        for i in CAT_BY_OTEX:
            v = nat.get(oid, {}).get("all", {}).get(i)
            if v and i in ind:
                add(mk("fr-rica-%s-%s" % (oid, i), "Farm accounts: %s, %s, France (RICA)" % (lab(i), OTEX_EN[oid]), ind[i]["unit"], ys, v))
    for c in ("small", "medium", "large"):
        for i in CAT_BY_CDEX:
            v = nat.get("all", {}).get(c, {}).get(i)
            if v and i in ind:
                add(mk("fr-rica-size-%s-%s" % (c, i), "Farm accounts: %s, %s, France (RICA)" % (lab(i), CDEX_EN[c]), ind[i]["unit"], ys, v))
    for g, d in regional.items():
        if g in ("France", "France hors DROM"):
            continue
        for i in CAT_REGION:
            v = d.get("all", {}).get(i)
            if v and i in ind:
                add(mk("fr-rica-reg-%s-%s" % (slug(g), i), "Farm accounts: %s, %s (former region, RICA)" % (lab(i), g), ind[i]["unit"], ys, v))
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": SRC, "series": out}}}


if __name__ == "__main__":
    main()

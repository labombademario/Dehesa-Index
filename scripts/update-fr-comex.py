#!/usr/bin/env python3
"""Francia: comercio exterior por producto y pais (Agreste/SSP con datos de las Aduanas, DGDDI)
-> data/france-comex/index.json, cop.json (cereales y oleoproteaginosas), lait.json (lacteos), oeufs.json (huevos, desde 1999), iaa.json (industria agroalimentaria)
y data/france-comex-stats.json (series clave para el catalogo).

Fuente: cuatro conjuntos «COMEX*» de Agreste (fichas disaron/COMEXCOP, COMEXLAIT, COMEXOEUFS, COMEXIAA). Cada uno es un zip con un CSV por año (separador ;, UTF-8) en formato largo:
indicador x producto x periodo (mes, trimestre o total anual) x socio comercial. Valores en miles de euros, toneladas, toneladas equivalentes huevo con cascara (Teoc), numero de huevos o euros.
Las fichas publican solo los ultimos años (COP, LAIT y IAA: 3; OEUFS: desde 1999); el script CONSERVA los años que la fuente ya no trae y reemplaza los que si trae (las aduanas revisan).
Para no hacer los ficheros enormes: total anual para todos los socios; mensual y trimestral solo para los agregados (mundo, UE, paises terceros) y, en lacteos, para todos (solo tienen esos tres).
Un año en curso solo trae meses hasta el ultimo cerrado: su «total anual» es acumulado y se marca en partialYear. Nada se estima ni se suma entre socios."""
import csv, datetime, io, json, re, sys, unicodedata, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import DL, detail_files, fetch, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-comex"
LOG = []
SRC = {"name": "Agreste (SSP) / Direction generale des douanes et droits indirects (DGDDI) - Echanges exterieurs de la France y compris DROM",
       "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/COMEXCOP/detail/", "license": "Licence Ouverte 2.0 (Etalab)"}
DATASETS = {
    "cop": ("COMEXCOP", "Cereales y oleoproteaginosas", "cereals"),
    "lait": ("COMEXLAIT", "Lacteos", "dairy"),
    "oeufs": ("COMEXOEUFS", "Huevos y ovoproductos", "eggs"),
    "iaa": ("COMEXIAA", "Industria agroalimentaria", "food"),
}
MONTHS = {"janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fold(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")


def period(p, year):
    """'Mai' -> ('M','2026-05'); 'Trimestre 2' -> ('Q','2026-Q2'); 'Total annuel' -> ('A','2026'); otro -> None."""
    f = fold(p)
    if f in MONTHS:
        return "M", "%d-%02d" % (year, MONTHS[f])
    m = re.fullmatch(r"trimestre (\d)", f)
    if m:
        return "Q", "%d-Q%s" % (year, m.group(1))
    if f == "total annuel":
        return "A", str(year)
    return None


def unit_flow(label, ds=""):
    """-> (id, unidad, flujo, tipo) a partir de la etiqueta del indicador."""
    f = fold(label)
    flow = "balance" if ("solde" in f) else ("export" if "export" in f else "import")
    if ds == "cop":   # la ficha titula el conjunto «en volume» y llama a los indicadores «(1000 euros)»; las cifras (trigo blando 14 000 = 14 Mt) solo cuadran como miles de toneladas
        return flow + "-kt", "thousand t", flow, "volume"
    if "volume" in f or "tonnes" in f:
        return flow + "-t", "t", flow, "volume"
    if "teoc" in f:
        return flow + "-teoc", "t shell-egg equivalent", flow, "volume"
    if "nombre" in f:
        return flow + "-eggs", "eggs", flow, "volume"
    if "(1000" in f:
        return flow + "-eur", "thousand EUR", flow, "value"
    return flow + "-eur", "EUR", flow, "value"


def fix_name(n):
    n = re.sub(r"(?<=[A-Za-z])E(?=[a-z])", "é", n)
    return n.replace("EUAN", "États-Unis").replace("E.U.A.N", "États-Unis")


def read_year(csvtext, ds):
    """Filas normalizadas (ano, indicador, producto, socio, periodo, valor)."""
    rd = csv.reader(io.StringIO(csvtext), delimiter=";")
    h = next(rd)
    ix = {k: i for i, k in enumerate(h)}
    if ds == "oeufs":
        ci = (ix["COMEXOEUFS_DIM1_LIB"], ix["N406_LIB"], ix["GEOGRAPHIE_LIB"], ix["N053_LIB"])
    else:
        k = "COMEX" + {"cop": "COP", "lait": "LAIT", "iaa": "IAA"}[ds] + "_DIM"
        ci = (ix[k + "1_LIB"], ix[k + "2_LIB"], ix[k + "4_LIB"], ix[k + "3_LIB"])
    iv, iy = ix["VALEUR"], ix["ANNREF"]
    for r in rd:
        if len(r) <= iv or r[iv] == "":
            continue
        try:
            v = float(r[iv])
        except ValueError:
            continue
        yield int(r[iy]), r[ci[0]], r[ci[1]], r[ci[2]], r[ci[3]], v


def build(ds, zbytes, old):
    pid = DATASETS[ds][0]
    z = zipfile.ZipFile(io.BytesIO(zbytes))
    inds, prods, parts = {}, {}, {}
    rows, years, months_seen = [], set(), {}
    for info in sorted(z.infolist(), key=lambda i: i.filename):
        if not info.filename.lower().endswith(".csv"):
            continue
        for y, il, pl, gl, per, v in read_year(z.read(info.filename).decode("utf-8-sig"), ds):
            pp = period(per, y)
            if not pp:
                continue
            years.add(y)
            if pp[0] == "M":
                months_seen[y] = max(months_seen.get(y, 0), int(pp[1][-2:]))
            rows.append((y, il, pl, gl, pp, v))
    if not rows:
        raise RuntimeError("%s: sin filas" % pid)
    # diccionarios (orden de aparicion estable: se ordenan por texto para que el fichero no cambie sin motivo)
    for _, il, pl, gl, _, _ in rows:
        inds.setdefault(il, None); prods.setdefault(pl, None); parts.setdefault(gl, None)
    # el diccionario se amplia con el de la edicion anterior para que los indices no cambien
    ind_list = list(old["_ind"]) if old else []
    prod_list = list(old["_prod"]) if old else []
    part_list = list(old["_part"]) if old else []
    for lst, d in ((ind_list, inds), (prod_list, prods), (part_list, parts)):
        have = set(lst)
        lst.extend(sorted(k for k in d if k not in have))
    ii = {k: i for i, k in enumerate(ind_list)}
    pi = {k: i for i, k in enumerate(prod_list)}
    gi = {k: i for i, k in enumerate(part_list)}
    series = {}
    if old:
        drop = years
        for key, s in old["series"].items():
            ns = {}
            for fr, d in s.items():
                nd = {p: v for p, v in d.items() if int(p[:4]) not in drop}
                if nd:
                    ns[fr] = nd
            if ns:
                series[key] = ns
    for y, il, pl, gl, (fr, p), v in rows:
        depth = len(gl) - len(gl.lstrip("_"))
        if fr != "A" and ds != "lait" and (ds == "oeufs" or depth > 1):
            continue
        key = "%d|%d|%d" % (ii[il], pi[pl], gi[gl])
        series.setdefault(key, {}).setdefault(fr, {})[p] = round(v, 3) if v != int(v) else int(v)
    partial = [y for y, m in months_seen.items() if m < 12]
    allyears = sorted(set(years) | (set(old["years"]) if old else set()))
    doc = {"schemaVersion": 1, "dataset": ds, "title": DATASETS[ds][1], "years": allyears, "partialYear": max(partial) if partial else None,
           "lastMonth": ("%d-%02d" % (max(months_seen), months_seen[max(months_seen)])) if months_seen else None,
           "unitNote": ("Las cifras vienen etiquetadas «en valeur (1000 euros)» pero el conjunto se titula «en volume» y solo cuadran como miles de toneladas (trigo blando 14 000 = 14 Mt): se publican como miles de toneladas." if ds == "cop" else
                        "UE = UE-27 en todo el periodo (el Reino Unido cuenta como pais tercero tambien antes de 2020: Agreste retropola la serie)." if ds == "iaa" else None),
           "indicators": [], "products": [], "partners": [], "series": dict(sorted(series.items()))}
    seen_ids = set()
    for il in ind_list:
        iid, unit, flow, kind = unit_flow(il, ds)
        doc["indicators"].append({"id": iid, "fr": il, "unit": unit, "flow": flow, "kind": kind})
    for pl in prod_list:
        doc["products"].append({"id": slug(pl) or "x", "fr": pl.lstrip("_ ").strip(), "depth": len(pl) - len(pl.lstrip("_"))})
    for gl in part_list:
        m = re.match(r"^([A-Z]{2})\s[-–]\s(.+)$", gl.strip())
        name = fix_name(m.group(2) if m else gl.lstrip("_ ").strip())
        pid2 = (m.group(1) if m else slug(gl)) or "x"
        if pid2 in seen_ids:
            pid2 = pid2 + "-" + str(len(seen_ids))
        seen_ids.add(pid2)
        doc["partners"].append({"id": pid2, "fr": name, "depth": 0 if m else len(gl) - len(gl.lstrip("_")), "raw": gl})
    return doc


def load_old(ds):
    f = OUT / (ds + ".json")
    if not f.exists():
        return None
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
        d["_ind"] = [i["fr"] for i in d["indicators"]]
        d["_prod"] = [("_" * p["depth"]) + p["fr"] for p in d["products"]]
        d["_part"] = [p["raw"] for p in d["partners"]]
        return d
    except Exception as e:
        log("fichero previo ilegible, se reconstruye:", ds, str(e)[:80])
        return None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {}
    for ds, (pid, title, _) in DATASETS.items():
        try:
            try:
                urls, _h = detail_files(pid, log=log)
                u = pick(urls, r"FDS_.*\.zip$") or (DL + "%s/FDS_%s.zip" % (pid, pid))
            except Exception as e:
                log(pid, "ficha ilegible, direccion conocida:", str(e)[:100])
                u = DL + "%s/FDS_%s.zip" % (pid, pid)
            log("descargando", u)
            zb = fetch(quote_url(u), "bin", tries=6, wait=25, timeout=300, log=log)
            old = load_old(ds)
            doc = build(ds, zb, old)
            docs[ds] = doc
            log("ok", ds, len(doc["series"]), "series", doc["years"][0], "-", doc["years"][-1], "parcial" if doc["partialYear"] else "", doc["lastMonth"])
        except Exception as e:
            log("FALLO", pid, "se conserva lo publicado:", str(e)[:200])
    if not docs:
        (ROOT / "data" / "france-comex-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    for ds, doc in docs.items():
        doc["schemaVersion"] = 1
        doc["generatedAt"] = now
        doc["source"] = SRC
        (OUT / (ds + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    idx = {"schemaVersion": 1, "generatedAt": now, "source": SRC, "datasets": {}}
    for ds in DATASETS:
        f = OUT / (ds + ".json")
        if not f.exists():
            continue
        d = docs.get(ds) or json.loads(f.read_text(encoding="utf-8"))
        idx["datasets"][ds] = {"file": ds + ".json", "title": DATASETS[ds][1], "years": [d["years"][0], d["years"][-1]], "partialYear": d["partialYear"], "lastMonth": d["lastMonth"],
                               "series": len(d["series"]), "indicators": len(d["indicators"]), "products": len(d["products"]), "partners": len(d["partners"])}
    if "cop" not in idx["datasets"] or len(idx["datasets"]) < 2:
        log("faltan conjuntos: no se publica el indice")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(now)
    n = len(st["countries"]["FR"]["series"])
    if n < 40:
        log("pocas series de catalogo (%d): no se escribe france-comex-stats.json" % n)
        sys.exit(1)
    (ROOT / "data" / "france-comex-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("series de catalogo:", n)
    (ROOT / "data" / "france-comex-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


# ---- series de catalogo -------------------------------------------------------------------------------------------------------------------------
CAT = {
    "cop": (["CEREALES", "Blé tendre", "Orge", "Maïs (grain et semences)", "Blé dur", "OLEAGINEUX", "Colza", "Tournesol"], ["export-kt", "import-kt"], ["MONDE"], True,
            {"CEREALES": "Cereals", "Blé tendre": "Soft wheat", "Orge": "Barley", "Maïs (grain et semences)": "Maize", "Blé dur": "Durum wheat", "OLEAGINEUX": "Oilseeds", "Colza": "Rapeseed", "Tournesol": "Sunflower seed"}),
    "lait": (["Ensemble lait, produits laitiers et dérivés", "Fromages (tous laits)", "_Beurre (vrac ou conditionné)", "Séchage de poudres de lait", "Laits conditionnés (tous laits)", "Yaourts et desserts lactés"],
             ["export-eur", "import-eur", "export-t", "import-t"], ["Monde"], True,
             {"Ensemble lait, produits laitiers et dérivés": "Milk and dairy, total", "Fromages (tous laits)": "Cheese", "_Beurre (vrac ou conditionné)": "Butter", "Séchage de poudres de lait": "Milk powders",
              "Laits conditionnés (tous laits)": "Packaged milk", "Yaourts et desserts lactés": "Yoghurts and dairy desserts"}),
    "iaa": (["PRODUITS DES INDUSTRIES ALIMENTAIRES", "_VIANDES ET PRODUITS A BASE DE VIANDE", "_PRODUITS LAITIERS", "BOISSONS", "_VINS DE RAISIN", "__Vins de raisin - Champagne et mousseux", "_ALIMENTS POUR ANIMAUX",
             "_PRODUITS DU TRAVAIL DES GRAINS ET PRODUITS AMYLACES", "_HUILES ET GRAISSES VEGETALES ET ANIMALES", "__Sucre"], ["export-eur", "import-eur", "balance-eur"], ["Monde"], True,
            {"PRODUITS DES INDUSTRIES ALIMENTAIRES": "Food industry products", "_VIANDES ET PRODUITS A BASE DE VIANDE": "Meat and meat products", "_PRODUITS LAITIERS": "Dairy products", "BOISSONS": "Beverages",
             "_VINS DE RAISIN": "Wine", "__Vins de raisin - Champagne et mousseux": "Champagne and sparkling wine", "_ALIMENTS POUR ANIMAUX": "Animal feed", "_PRODUITS DU TRAVAIL DES GRAINS ET PRODUITS AMYLACES": "Grain milling and starch products",
             "_HUILES ET GRAISSES VEGETALES ET ANIMALES": "Vegetable and animal oils and fats", "__Sucre": "Sugar"}),
    "oeufs": (["Total œufs et Ovoproduits|1"], ["export-teoc", "import-teoc"], ["DE", "ES", "NL", "BE", "IT", "GB"], False, {"Total œufs et Ovoproduits|1": "Eggs and egg products, total"}),
}
FLOW_EN = {"export": "Exports", "import": "Imports", "balance": "Trade balance"}
KIND_EN = {"eur": "value", "t": "volume", "teoc": "volume", "kt": "volume"}
GRP = {"cop": "trade", "lait": "trade", "iaa": "trade", "oeufs": "trade"}


def stats(now):
    out = []
    for ds, (prods, inds, partners, monthly, en) in CAT.items():
        f = OUT / (ds + ".json")
        if not f.exists():
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        ind_ix = {i["id"]: k for k, i in enumerate(d["indicators"])}
        prod_ix = {("_" * p["depth"]) + p["fr"]: k for k, p in enumerate(d["products"])}
        part_ix = {p["id"] if ds == "oeufs" else p["fr"]: k for k, p in enumerate(d["partners"])}
        part_name = {p["id"] if ds == "oeufs" else p["fr"]: p["fr"] for p in d["partners"]}
        part_raw = lambda s: s
        for pr in prods:
            key = pr.split("|")[0] if ds == "oeufs" else pr
            pk = None
            for lab, k in prod_ix.items():
                if (ds == "oeufs" and lab.startswith(key)) or lab == key or lab.lstrip("_") == key.lstrip("_"):
                    pk = k
                    break
            if pk is None:
                continue
            for iid in inds:
                if iid not in ind_ix:
                    continue
                for pt in partners:
                    gk = part_ix.get(pt)
                    if gk is None:
                        continue
                    s = d["series"].get("%d|%d|%d" % (ind_ix[iid], pk, gk))
                    if not s:
                        continue
                    flow, kind = iid.split("-")[0], iid.split("-")[1]
                    unit = d["indicators"][ind_ix[iid]]["unit"]
                    where = "World" if pt in ("MONDE", "Monde") else part_name[pt]
                    for fr, per in (("A", "annual"), ("M", "monthly")):
                        if fr == "M" and not monthly:
                            continue
                        pts = sorted(s.get(fr, {}).items())
                        if fr == "A" and d["partialYear"]:
                            pts = [p for p in pts if int(p[0]) != d["partialYear"]]   # el acumulado del año en curso no es comparable con un año completo
                        pts = [[p, v] for p, v in pts]
                        if len(pts) < 2:
                            continue
                        last, prev = pts[-1][1], pts[-2][1]
                        name = en.get(pr, pr.lstrip("_"))
                        out.append({"id": "fr-comex-%s-%s-%s-%s-%s" % (ds, slug(name), iid, slug(where), fr.lower()), "group": GRP[ds],
                                    "label": "%s of %s, %s, France (%s trade)" % (FLOW_EN[flow], name.lower(), where, KIND_EN[kind]) + (" - %s" % ("monthly" if fr == "M" else "annual")),
                                    "unit": unit, "frequency": per, "latestPeriod": pts[-1][0], "latest": last,
                                    "changePct": round((last / prev - 1) * 100, 2) if prev and prev > 0 and last is not None and flow != "balance" else None,
                                    "points": pts, "sourceGroup": "agreste-comex"})
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": SRC, "series": out}}}


if __name__ == "__main__":
    main()

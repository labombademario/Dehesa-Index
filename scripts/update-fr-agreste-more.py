#!/usr/bin/env python3
"""Francia: cuatro conjuntos de Agreste (SSP) -> data/france-agreste-more/*.json y data/france-agreste-more-stats.json.

  - empleo.json   : Estimaciones de empleo agricola (dossier Dos<AAMM>, libro EEA_<año>_france_metro.xlsx): ETP por categoria de activo, OTEX, region y departamento, permanentes, salario horario bruto.
  - teruti.json   : TERUTI-Lucas, series largas desde 1982 (hectareas por uso del suelo: 3 postes por departamento, 13 postes por region).
  - vinconj.json  : Coyuntura vitivinicola (FDS_VINCONJ, un CSV por año desde 2000): produccion de vino por cuenca y categoria (miles de hl).
  - ipampa-fr.json, ipampa-regiones.json : IPAMPA (indices de precios de los medios de produccion), base 100 = 2020; Francia mensual y regiones anual (media anual).

Los cuatro se leen del contenido real de los ficheros; una celda vacia o ilegible no existe, nada se estima. Cada conjunto es independiente: si uno falla (Agreste es intermitente) se conserva lo
publicado de ese conjunto y se sigue con los demas. Formato comun: {schemaVersion, generatedAt, source, edition, tables:[{id, label, unit, note, series:[{id, label, points:[[periodo, valor]], provisional?}]}]}."""
import csv, datetime, io, json, re, sys, unicodedata, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import XL, detail_files, fetch, num, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-agreste-more"
LOG = []
SRC = {"name": "Agreste (SSP) - empleo agricola, TERUTI, IPAMPA y coyuntura vitivinicola", "url": "https://agreste.agriculture.gouv.fr/agreste-web/", "license": "Licence Ouverte 2.0 (Etalab)"}
EMPLEO_IDS = ["Dos2702", "Dos2602"]
FILES = {
    "empleo.json": ("Empleo agricola (ETP, permanentes y salarios)", "Empleo agricola en equivalentes a tiempo completo por categoria de activo, orientacion tecnico-economica, region y departamento, mas salario horario bruto"),
    "teruti.json": ("Uso del suelo (TERUTI-Lucas)", "Superficie en hectareas por uso del suelo en Francia desde 1982: 3 postes por departamento y 13 postes por region"),
    "vinconj.json": ("Vendimia por cuenca (coyuntura vitivinicola)", "Produccion de vino por cuenca vitivinicola y categoria (AOP, IGP, sin IG, eaux-de-vie) desde 2000"),
    "ipampa-fr.json": ("IPAMPA Francia (medios de produccion)", "Indice de precios de los medios de produccion agricola, mensual, base 100 = 2020, 192 productos"),
    "ipampa-regiones.json": ("IPAMPA por region", "Indice de precios de los medios de produccion agricola, media anual por region, base 100 = 2020"),
}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fold(s):
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower().strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")[:70]


def pts_clean(p):
    return sorted(([a, b] for a, b in p if b is not None), key=lambda x: x[0])


def series(sid, label, pts, **extra):
    d = {"id": sid, "label": label, "points": pts_clean(pts)}
    d.update({k: v for k, v in extra.items() if v or v == 0})
    return d


def table(tid, label, unit, note, ser):
    return {"id": tid, "label": label, "unit": unit, "note": note, "series": [s for s in ser if s["points"]]}


# ---- empleo -----------------------------------------------------------------------------------------------------------------------------------------
EMP_SHEETS = [
    ("ETP - CAT. ACTIF", "etp-categoria", "Empleo por categoria de activo", "ETP", 1),
    ("ETP - OTEX", "etp-otex", "Empleo por orientacion tecnico-economica (OTEX)", "ETP", 1),
    ("ETP - REGION", "etp-region", "Empleo por region", "ETP", 1),
    ("ETP - DEP.", "etp-departamento", "Empleo por departamento", "ETP", 2),
    ("ETP - OTEX x CAT. ACTIF", "etp-otex-categoria", "Empleo por OTEX y categoria de activo", "ETP", 2),
    ("PERM. - OTEX", "permanentes-otex", "Activos permanentes por OTEX", "personas", 1),
    ("PERM. - REGION", "permanentes-region", "Activos permanentes por region", "personas", 1),
    ("SALAIRE - OTEX", "salario-otex", "Salario bruto horario medio por OTEX", "EUR/hora", 1),
    ("SALAIRE - REG.", "salario-region", "Salario bruto horario medio por region", "EUR/hora", 1),
]


def year_cell(c):
    m = re.fullmatch(r"\s*(\d{4})(\.0)?\s*(\(p\))?\s*", str(c))
    return (m.group(1), bool(m.group(3))) if m else None


def read_empleo(blob):
    x = XL(blob)
    tabs = []
    for sheet, tid, label, unit, nlab in EMP_SHEETS:
        if sheet not in x.names():
            raise RuntimeError("falta la hoja %s" % sheet)
        rows = list(x.rows(sheet))
        h = next((i for i, r in enumerate(rows) if sum(1 for c in r if year_cell(c)) >= 3), None)
        if h is None:
            raise RuntimeError("hoja %s sin cabecera de años" % sheet)
        hdr = rows[h]
        ycols = [(j, year_cell(c)) for j, c in enumerate(hdr) if year_cell(c)]
        j0 = ycols[0][0]
        lab_cols = [j for j in range(j0) if any(len(r) > j and r[j] != "" for r in rows[h + 1:])][-nlab:]
        note = " ".join(c for r in rows[:h] for c in r if c)[:300]
        ser = []
        for r in rows[h + 1:]:
            labs = [r[j] if len(r) > j else "" for j in lab_cols]
            if not all(labs):
                continue
            pts, prov = [], []
            for j, (y, p) in ycols:
                v = num(r[j]) if len(r) > j else None
                if v is not None:
                    pts.append([y, v])
                    if p:
                        prov.append(y)
            if pts:
                ser.append(series("%s-%s" % (tid, slug(" ".join(labs))), " - ".join(labs), pts, provisional=prov))
        if not ser:
            raise RuntimeError("hoja %s sin filas" % sheet)
        tabs.append(table(tid, label, unit, note, ser))
    return tabs


# ---- TERUTI -----------------------------------------------------------------------------------------------------------------------------------------
def read_teruti(blob):
    x = XL(blob)
    tabs = []
    for sheet, tid, label, nkey in (("3_postes_par_departement", "3-postes-departamento", "Uso del suelo por departamento (3 postes)", 5), ("13_postes_par_region", "13-postes-region", "Uso del suelo por region (13 postes)", 4)):
        rows = list(x.rows(sheet))
        hdr = rows[0]
        ycols = [(j, m.group(1)) for j, c in enumerate(hdr) for m in [re.fullmatch(r"Surface (\d{4})", c.strip())] if m]
        if len(ycols) < 20:
            raise RuntimeError("TERUTI %s: cabecera inesperada" % sheet)
        ser = []
        for r in rows[1:]:
            if len(r) <= nkey or not r[0]:
                continue
            if sheet.startswith("3_"):
                labs, ident = [r[1], r[4]], [r[0], r[4][:1]]
            else:
                labs, ident = [r[1], r[3]], [r[0], r[3][:2]]
            pts = [[y, num(r[j])] for j, y in ycols if len(r) > j]
            ser.append(series("teruti-%s-%s" % (tid[:2].strip("-"), slug("-".join(ident))), " - ".join(labs), pts))
        if not ser:
            raise RuntimeError("TERUTI %s sin filas" % sheet)
        tabs.append(table("teruti-" + tid, label, "ha", "Hectareas; encuesta TERUTI-Lucas, series largas desde 1982 (metropoli, Guadalupe, Martinica, Reunion, Guayana y Mayotte segun años).", ser))
    return tabs


# ---- VINCONJ ----------------------------------------------------------------------------------------------------------------------------------------
def read_vinconj(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    names = sorted(n for n in z.namelist() if re.search(r"FDS_VINCONJ_\d{4}\.csv$", n))
    if len(names) < 10:
        raise RuntimeError("VINCONJ: solo %d CSV" % len(names))
    data, geo, cat = {}, {}, {}
    for n in names:
        for r in csv.DictReader(io.StringIO(z.read(n).decode("utf8", "replace")), delimiter=";"):
            v = num(r.get("VALEUR", "").replace(",", "."))
            if v is None or r.get("QUALITE", "OUI") not in ("OUI", ""):
                continue
            key = (r["N802b_MOD"], r["GEOGRAPHIE"])
            geo[r["GEOGRAPHIE"]] = r["GEOGRAPHIE_LIB"]
            cat[r["N802b_MOD"]] = r["N802b_LIB"]
            data.setdefault(key, {})[r["ANNREF"]] = v
    tabs = []
    for c, cl in sorted(cat.items(), key=lambda t: float(t[0])):
        ser = [series("vinconj-%s-%s" % (c.replace(".", ""), slug(g)), geo[g], list(d.items())) for (cc, g), d in sorted(data.items()) if cc == c for d in [data[(cc, g)]]]
        tabs.append(table("vinconj-" + c.replace(".", ""), cl, "miles de hl", "Produccion de vino por cuenca vitivinicola. 'Tous bassins viticoles ou non' es el total de Francia. El ultimo año es la estimacion de la campaña en curso.", ser))
    return tabs


# ---- IPAMPA -----------------------------------------------------------------------------------------------------------------------------------------
MONTHS = {"janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12}


def read_ipampa(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    names = sorted(n for n in z.namelist() if re.search(r"FDS_IPAMPA_\d{4}\.csv$", n))
    if len(names) < 10:
        raise RuntimeError("IPAMPA: solo %d CSV" % len(names))
    prod, nat, reg = {}, {}, {}
    for n in names:
        for r in csv.DictReader(io.StringIO(z.read(n).decode("utf8", "replace")), delimiter=";"):
            if not r["IPAMPA_DIM1_LIB"].startswith("Indice"):
                continue
            v = num(r["VALEUR"].replace(",", "."))
            if v is None or r.get("QUALITE", "OUI") not in ("OUI", ""):
                continue
            code, region, per, y = r["IPAMPA_DIM2_MOD"], r["IPAMPA_DIM3_LIB"], fold(r["IPAMPA_DIM4_LIB"]), r["ANNREF"]
            lab = r["IPAMPA_DIM2_LIB"]
            prod[code] = (len(lab) - len(lab.lstrip("_")), lab.lstrip("_"))
            national = region.startswith("France")
            if per == "moyenne annuelle":
                reg.setdefault((code, region), {})[y] = v
            elif national and per in MONTHS:
                nat.setdefault(code, {})["%s-%02d" % (y, MONTHS[per])] = v
    if not nat or not reg:
        raise RuntimeError("IPAMPA sin datos")
    ser_nat = [series("ipampa-fr-" + c, prod[c][1], list(d.items()), depth=prod[c][0]) for c, d in sorted(nat.items())]
    regions = sorted({r for _, r in reg})
    tabs_reg = []
    for rg in regions:
        tabs_reg.append(table("ipampa-reg-" + slug(rg), rg, "indice (base 100 = 2020)", "Media anual del indice de precios de los medios de produccion en la region.",
                              [series("ipampa-reg-%s-%s" % (slug(rg), c), prod[c][1], list(reg[(c, rg)].items()), depth=prod[c][0]) for c in sorted(prod) if (c, rg) in reg]))
    return [table("ipampa-fr", "IPAMPA Francia, mensual", "indice (base 100 = 2020)", "Indice mensual de precios de los medios de produccion agricola; 'depth' es el nivel jerarquico (0 = indice general).", ser_nat)], tabs_reg


# ---- orquestacion -------------------------------------------------------------------------------------------------------------------------------------
def first_pub(ids, pat):
    for pid in ids:
        try:
            urls, _ = detail_files(pid, log=log)
            u = pick(urls, pat)
            if u:
                return pid, quote_url(u)
        except Exception as e:
            log("%s: %s" % (pid, str(e)[:120]))
    return None, None


def dl(pid_list, pat, name):
    pid, u = first_pub(pid_list, pat)
    if not u:
        raise RuntimeError("%s: sin enlace" % name)
    log("descargando", u)
    return pid, fetch(u, "bin", tries=4, wait=20, timeout=240, log=log)


def get_empleo():
    pid, blob = dl(EMPLEO_IDS, r"Donn.*\.zip$", "empleo")
    z = zipfile.ZipFile(io.BytesIO(blob))
    n = next((n for n in z.namelist() if re.search(r"EEA_\d{4}_france_metro\.xlsx$", n)), None)
    if not n:
        raise RuntimeError("empleo: sin EEA_*_france_metro.xlsx en el zip")
    return pid, read_empleo(z.read(n))


def doc(tabs, edition, now):
    return {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition, "tables": tabs}


def load(name):
    try:
        return json.loads((OUT / name).read_text(encoding="utf-8"))
    except Exception:
        return None


def pts_of(d, tid, sid):
    for t in d["tables"]:
        if t["id"] == tid:
            for s in t["series"]:
                if s["id"] == sid:
                    return s
    return None


def stats(docs, now):
    out = []

    def add(sid, grp, label, unit, s, freq, minpts=2):
        if not s or len(s["points"]) < minpts:
            return
        p = s["points"]
        ch = round((p[-1][1] / p[-2][1] - 1) * 100, 2) if freq == "annual" and p[-2][1] else None
        if freq == "monthly":
            prev = next((v for q, v in p if q == "%d-%s" % (int(p[-1][0][:4]) - 1, p[-1][0][5:])), None)
            ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": freq, "latestPeriod": p[-1][0], "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "agreste-more"})

    e = docs.get("empleo.json")
    if e:
        t = next((t for t in e["tables"] if t["id"] == "etp-categoria"), None)
        for s in (t or {"series": []})["series"]:
            add("fr-emp-" + s["id"], "income", "Empleo agricola: %s (ETP, Agreste)" % s["label"], "ETP", s, "annual")
        t = next((t for t in e["tables"] if t["id"] == "salario-otex"), None)
        for s in (t or {"series": []})["series"]:
            if "ensemble" in fold(s["label"]):
                add("fr-emp-" + s["id"], "income", "Salario bruto horario medio: %s (Agreste)" % s["label"], "EUR/hora", s, "annual")
    v = docs.get("vinconj.json")
    if v:
        for t in v["tables"]:
            for s in t["series"]:
                if s["id"].endswith("-tous-bassins-viticoles-ou-non") or s["label"].startswith("Tous bassins"):
                    add("fr-" + s["id"], "crops", "Produccion de vino, Francia: %s (Agreste)" % t["label"], "miles de hl", s, "annual")
    i = docs.get("ipampa-fr.json")
    if i:
        for s in i["tables"][0]["series"]:
            if s.get("depth", 9) <= 1:
                add("fr-" + s["id"], "inputs", "IPAMPA, %s (base 100 = 2020, Agreste)" % s["label"], "indice", s, "monthly", 24)
    t = docs.get("teruti.json")
    if t:
        tab = next((x for x in t["tables"] if x["id"] == "teruti-3-postes-departamento"), None)
        for s in (tab or {"series": []})["series"]:
            if s["label"].startswith("France m"):
                add("fr-" + s["id"], "crops", "Uso del suelo, Francia metropolitana: %s (TERUTI, Agreste)" % s["label"].split(" - ")[-1], "ha", s, "annual", 10)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    editions = {}
    jobs = [
        ("empleo", get_empleo),
        ("teruti", lambda: ("TERUTI", read_teruti(dl(["TERUTI-SeriesLongues"], r"\.xlsx$", "TERUTI")[1]))),
        ("vinconj", lambda: ("VINCONJ", read_vinconj(dl(["VINCONJ"], r"\.zip$", "VINCONJ")[1]))),
        ("ipampa", lambda: ("IPAMPA", read_ipampa(dl(["IPAMPA"], r"\.zip$", "IPAMPA")[1]))),
    ]
    for name, fn in jobs:
        try:
            ed, res = fn()
            if name == "ipampa":
                docs["ipampa-fr.json"], docs["ipampa-regiones.json"] = doc(res[0], ed, now), doc(res[1], ed, now)
            else:
                docs[name + ".json"] = doc(res, ed, now)
            log("%s: leido (%s)" % (name, ed))
        except Exception as ex:
            log("%s: NO se pudo leer (%s); se conserva lo publicado" % (name, str(ex)[:200]))
    files = []
    for n, (title, desc) in FILES.items():
        d = docs.get(n)
        if not d:
            continue
        (OUT / n).write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        files.append({"file": n, "title": title, "description": desc, "edition": d["edition"], "tables": len(d["tables"]), "series": sum(len(t["series"]) for t in d["tables"]),
                      "generatedAt": d["generatedAt"]})
    if not files:
        log("sin datos; no se escribe nada")
        (ROOT / "data" / "france-agreste-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "france-agreste-more-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["FR"]["series"])))
    (ROOT / "data" / "france-agreste-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

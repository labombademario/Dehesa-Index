#!/usr/bin/env python3
"""Francia: Infos Rapides mensuales (Agreste/SSP) -> data/france-infosrapides/{index,lait,cultivos,comercio}.json y data/france-infosrapides-stats.json.

Cada edicion es una ficha con numero propio (IraLai26133, IraGcu26131, IraCex26132: tipo + año de 2 cifras + numero correlativo de 3 cifras, compartido por todos los informes del año).
La pipeline descubre las ediciones nuevas probando los numeros siguientes (y, la primera vez, todo 2025 y 2026) y lee tres informes:
  - Lait: libro de «données complémentaires» (zip). Tablas 1, 2, 3, 7 y 9 traen el historico mensual completo (recogida de leche de vaca, cabra y oveja, % bio y AOP/IGP, tenores, precio real y
    estandar convencional/bio, indices, precio de la leche de cabra, indice de oveja). Tablas 4, 5, 6 y 8 solo traen el mes de la edicion (cuenca, fabricaciones): se acumulan edicion a edicion.
  - Grandes cultures: libro «regions» (una hoja por region + Francia). Estimacion de superficie, rendimiento y produccion de la cosecha del año y de la anterior, por cultivo y region.
    Se guarda cada edicion (mes de la estimacion) para ver como se revisa la cosecha.
  - Commerce extérieur: libro «données complémentaires», hojas graph*: saldo agroalimentario UE / terceros paises, exportaciones e importaciones totales y cereal UE / terceros, mensual desde 2020.
    (El comercio mensual por producto ya lo trae el boletin de coyuntura: no se duplica.)
Nada se inventa: una celda vacia, «s.», «nd» o «**» no existe. Se CONSERVA todo punto de ediciones anteriores que la actual ya no trae; una edicion nueva reemplaza los puntos que vuelve a traer.
Si la descarga falla se conserva lo publicado."""
import concurrent.futures, datetime, io, json, re, sys, time, unicodedata, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import DL, H, ERR_MARK, XL, _get, clean_html, fetch, num, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-infosrapides"
LOG = []
SRC = {"name": "Agreste (SSP) - Infos Rapides", "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/IraLai26133/detail/", "license": "Licence Ouverte 2.0 (Etalab)"}
SEED = {"Lai": (26, 133), "Gcu": (26, 131), "Cex": (26, 132)}   # ultima edicion conocida al escribir el script: punto de partida del escaneo
MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fold(s):
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower().strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")


def fr_period(c):
    """'Août 2026' -> '2026-08'; '2017-01' -> '2017-01'; serie de Excel (43831) -> '2020-01'; 'août-26' -> '2026-08'; otro -> None."""
    c = str(c).strip()
    if re.fullmatch(r"\d{4}-\d{2}", c):
        return c
    m = re.fullmatch(r"([^\W\d_]+)\.? (\d{4})", c)
    if m and fold(m.group(1)) in MONTHS:
        return "%s-%02d" % (m.group(2), MONTHS.index(fold(m.group(1))) + 1)
    m = re.fullmatch(r"([^\W\d_]+)\.?-(\d{2})", c)
    if m and fold(m.group(1)) in MONTHS:
        return "20%s-%02d" % (m.group(2), MONTHS.index(fold(m.group(1))) + 1)
    if re.fullmatch(r"\d{5}(\.0+)?", c):
        d = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(c)))
        return "%d-%02d" % (d.year, d.month)
    return None


def val(c):
    v = num(str(c).strip()) if c != "" else None
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def rnd(v, k=4):
    return None if v is None else (round(v, k) if isinstance(v, float) else v)


# ---- descubrimiento de ediciones --------------------------------------------------------------------------------------------------------------------
def probe(pub, tries=3):
    """('yes', urls, html) | ('no',) | ('unk',). Una ficha inexistente responde 200 con una pagina «Erreur»; los fallos intermitentes («Accès non autorisé», 400, tiempo) son «unk»."""
    for i in range(tries):
        try:
            st, ct, b = _get(H + "disaron/%s/detail/" % pub, 60)
            t = b.decode("utf8", "replace")
            if st == 200 and ERR_MARK not in t[:6000]:
                urls = []
                for m in re.findall(r'href="([^"#]+)"', t):
                    m = re.sub(r";jsessionid=[^/?\"]*", "", m.replace("&amp;", "&"))
                    if "/download/publication/" in m and "/" + pub + "/" in m:
                        urls.append(m if m.startswith("http") else "https://agreste.agriculture.gouv.fr" + m)
                if urls:
                    return ("yes", list(dict.fromkeys(urls)), t)
                if "<title>Erreur" in t or "Erreur|" in clean_html(t)[:40]:
                    return ("no",)
        except Exception:
            pass
        time.sleep(3 * (i + 1))
    return ("unk",)


def no_file(urls):
    import urllib.parse
    raise RuntimeError("la ficha no trae el fichero esperado; ficheros: %s" % [urllib.parse.unquote(u).split("/")[-1] for u in urls])


def pid(kind, yy, n):
    return "Ira%s%02d%03d" % (kind, yy, n)


def discover(state):
    """Prueba los numeros nuevos de cada informe. Devuelve {id: (urls, html)} de ediciones nuevas."""
    known = {k: e for k, e in state["editions"].items() if e["status"] == "ok" or e.get("tries", 1) >= 3}   # las ilegibles se reintentan hasta 3 veces
    jobs = []
    for kind, (yy0, n0) in SEED.items():
        mine = [(int(k[-5:-3]), int(k[-3:])) for k, e in state["editions"].items() if e["kind"] == kind]
        last = max(mine + [(yy0, n0)])
        if not state.get("backfilled"):
            rng = [(25, n) for n in range(1, 221)] + [(26, n) for n in range(1, last[1] + 41)]
        else:
            rng = [(last[0], n) for n in range(last[1] + 1, last[1] + 41)]
            if datetime.date.today().month <= 3:
                rng += [(last[0] + 1, n) for n in range(1, 41)]
        jobs += [(kind, yy, n) for yy, n in rng if pid(kind, yy, n) not in known]
    jobs += [(state["editions"][k]["kind"], int(k[-5:-3]), int(k[-3:])) for k in state["editions"] if k not in known and (state["editions"][k]["kind"], int(k[-5:-3]), int(k[-3:])) not in jobs]
    found, unk = {}, []
    with concurrent.futures.ThreadPoolExecutor(6) as ex:
        for (kind, yy, n), r in zip(jobs, ex.map(lambda j: probe(pid(*j)), jobs)):
            if r[0] == "yes":
                found[pid(kind, yy, n)] = (r[1], r[2])
            elif r[0] == "unk":
                unk.append(pid(kind, yy, n))
    log("escaneo:", len(jobs), "numeros probados,", len(found), "ediciones, ", len(unk), "sin respuesta")
    return found, unk


# ---- Lait ------------------------------------------------------------------------------------------------------------------------------------------
# Tabla -> {columna: (id, etiqueta en ingles, unidad, texto que debe contener la cabecera de esa columna)}
LAIT_HIST = {
    "Tableau 1": {2: ("collecte-vache", "Cow milk collection, France", "1000 l", "vache"), 4: ("part-bio", "Organic share of cow milk collection, France", "%", ""), 5: ("part-aop-igp", "PDO/PGI share of cow milk collection, France", "%", "aop"),
                  6: ("collecte-chevre", "Goat milk collection, France", "1000 l", "chevre"), 8: ("collecte-brebis", "Sheep milk collection, France", "1000 l", "brebis")},
    "Tableau 2": {2: ("teneur-mg", "Fat content of cow milk, France", "g/l", "grasse"), 3: ("teneur-mp", "Protein content of cow milk, France", "g/l", "proteique"),
                  4: ("prix-reel-tous", "Cow milk price at actual contents, all milk, France", "€/1000 l", "tous"), 6: ("prix-reel-conv", "Cow milk price at actual contents, conventional, France", "€/1000 l", "convention"),
                  8: ("prix-reel-bio", "Cow milk price at actual contents, organic, France", "€/1000 l", "bio"), 10: ("prix-std-tous", "Cow milk standard price 38/32, all milk, France", "€/1000 l", "tous"),
                  12: ("prix-std-conv", "Cow milk standard price 38/32, conventional, France", "€/1000 l", "convention"), 14: ("prix-std-bio", "Cow milk standard price 38/32, organic, France", "€/1000 l", "bio")},
    "Tableau 3": {2: ("indice-aop-igp", "Real cow milk price index PDO/PGI (Jan 2017 = 100), France", "index", "aop"), 3: ("indice-conv", "Real cow milk price index conventional (Jan 2017 = 100), France", "index", "convention")},
    "Tableau 7": {2: ("prix-reel-chevre", "Goat milk price at actual contents, all milk, France", "€/1000 l", "reelles")},
    "Tableau 9": {2: ("indice-std-brebis", "Sheep milk standard price index (Jan 2022 = 100), France", "index", "standard"), 3: ("indice-reel-brebis", "Sheep milk real price index (Jan 2022 = 100), France", "index", "reel")},
}


def lait_hist(sheets):
    """sheets: {nombre: filas}. -> series {id: {label, unit, pts}} de las tablas con historico mensual."""
    out = {}
    for tab, cols in LAIT_HIST.items():
        rows = sheets.get(tab)
        if not rows:
            log("Lait: falta", tab)
            continue
        first = next((i for i, r in enumerate(rows) if len(r) > 2 and fr_period(r[1]) and any(str(c).strip() for c in r[2:])), None)
        if first is None:
            log("Lait:", tab, "sin filas de datos")
            continue
        hdr = [fold(" ".join(str(r[j]) for r in rows[1:first] if j < len(r))) for j in range(max(len(r) for r in rows[:first + 1]) + 1)]
        for j, (sid, lab, unit, need) in cols.items():
            if j >= len(hdr) or (need and need not in hdr[j]):
                log("Lait:", tab, "columna", j, "no es la esperada (%r en %r): se omite" % (need, hdr[j][:60] if j < len(hdr) else "(falta)"))
                continue
            pts = {}
            for r in rows[first:]:
                if len(r) > j and fr_period(r[1]):
                    v = val(r[j])
                    if v is not None:
                        pts[fr_period(r[1])] = rnd(v)
            if pts:
                out["lait-" + sid] = {"label": lab, "unit": unit, "pts": pts}
    return out


def lait_snap(sheets):
    """Tablas 4, 5, 6 y 8: solo el mes de la edicion. Cada fila da un punto en el mes de la cabecera."""
    out = {}
    for tab, spec in (("Tableau 4", "bassin"), ("Tableau 5", "vache"), ("Tableau 6", "chevre"), ("Tableau 8", "brebis")):
        rows = sheets.get(tab)
        if not rows:
            continue
        per, hrow = None, None
        for i, r in enumerate(rows[:8]):
            for c in r:
                p = fr_period(c)
                if p and re.search(r"\d{4}", str(c)) and not re.fullmatch(r"[\d.\-]+", str(c).strip()):
                    per, hrow = p, i
                    break
            if per:
                break
        if not per:
            log("Lait:", tab, "sin mes en la cabecera: se omite")
            continue
        for r in rows[hrow + 1:]:
            if len(r) < 4 or not str(r[1]).strip() or str(r[1]).strip()[:1] in "(*" or fold(r[1]).startswith(("source", "s.", "nd", "**")):
                continue
            lab = re.sub(r"\s*\(\d\)|\s*\*+$", "", str(r[1]).strip()).strip()
            if spec == "bassin":
                for j, key, name, unit in ((2, "collecte", "milk collection", "1000 l"), (6, "prix", "milk price at actual contents", "€/1000 l")):
                    v = val(r[j]) if len(r) > j else None
                    if v is not None:
                        out["lait-bassin-%s-%s" % (slug(lab), key)] = {"label": "Cow %s, basin %s" % (name, lab), "unit": unit, "pts": {per: rnd(v)}}
            else:
                v = val(r[2])
                if v is None:
                    continue
                unit = "1000 l" if fold(lab).startswith("lait conditionne") else "t"
                animal = {"vache": "cow", "chevre": "goat", "brebis": "sheep"}[spec]
                out["lait-fab-%s-%s" % (spec, slug(lab))] = {"label": "%s production (%s milk), France" % (lab, animal), "unit": unit, "pts": {per: rnd(v)}}
    return out


def read_lait(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    name = next((i.filename for i in z.infolist() if re.search(r"compl", fold(i.filename)) and i.filename.lower().endswith(".xlsx")), None)
    if not name:
        raise RuntimeError("el zip de leche no trae el libro de datos complementarios: %s" % [i.filename for i in z.infolist()])
    x = XL(z.read(name))
    sheets = {n: list(x.rows(n)) for n in x.names() if n.startswith("Tableau")}
    return {**lait_hist(sheets), **lait_snap(sheets)}


# ---- Grandes cultures --------------------------------------------------------------------------------------------------------------------------------
def gcu_edition(title):
    m = re.search(r"au (1er|\d+) ([^\W\d_]+) (\d{4})", str(title))
    if m and fold(m.group(2)) in MONTHS:
        return "%s-%02d" % (m.group(3), MONTHS.index(fold(m.group(2))) + 1)
    return None


def read_gcu(blob):
    """-> (edicion 'AAAA-MM', {cosecha: {region: {cultivo: [sup, rend, prod]}}}, {codigo: nombre})."""
    x = XL(blob)
    est, names, edition = {}, {}, None
    for sh in x.names():
        m = re.match(r"(\d{2}) - ", sh)
        if not (m or sh == "France métropolitaine"):
            continue
        code = m.group(1) if m else "FR"
        rows = list(x.rows(sh))
        ed = gcu_edition(rows[0][0]) if rows and rows[0] else None
        edition = edition or ed
        reg = next((r[0].strip() for r in rows[1:6] if r and r[0].strip() and not fold(r[0]).startswith("source")), sh)
        names[code] = reg
        hi = next((i for i, r in enumerate(rows[:12]) if any(str(c).strip().upper().startswith("RECOLTE") for c in r)), None)
        if hi is None:
            log("Gcu: hoja", sh, "sin cabecera RECOLTE")
            continue
        camp = [(j, re.search(r"(\d{4})", str(c)).group(1)) for j, c in enumerate(rows[hi]) if str(c).strip().upper().startswith("RECOLTE") and re.search(r"\d{4}", str(c))]
        for r in rows[hi + 2:]:
            if not r or not str(r[0]).strip() or str(r[0]).strip().startswith("*"):
                continue
            cul = re.sub(r"\s*\*+$", "", str(r[0]).strip())
            for j, y in camp:
                t = [val(r[j + k]) if len(r) > j + k else None for k in range(3)]
                if all(v is None for v in t):
                    continue
                est.setdefault(y, {}).setdefault(code, {})[cul] = [rnd(v, 3) for v in t]
    if not edition:
        raise RuntimeError("no se encontro el mes de la estimacion en los titulos")
    return edition, est, names


# ---- Commerce extérieur ----------------------------------------------------------------------------------------------------------------------------------
CEX_SHEETS = {"graph2": ("solde-ue-tiers", "Agrifood trade balance {}, France"), "graph3": ("echanges", "Agrifood {}, France"), "graph4": ("solde-brut", "Trade balance of raw agricultural products, France"),
              "graph5": ("solde-transforme", "Trade balance of processed agrifood products, France"), "graph6": ("cereales", "Cereal exports {}, France")}
CEX_ES = {"ue": "with the EU", "pays-tiers": "with third countries", "exportations": "exports", "importations": "imports"}


def read_cex(blob):
    x = XL(blob)
    out = {}
    for sh, (key, tmpl) in CEX_SHEETS.items():
        if sh not in x.names():
            continue
        rows = list(x.rows(sh))
        hi = next((i for i, r in enumerate(rows[:6]) if sum(1 for c in r[1:] if fr_period(c)) >= 12), None)
        if hi is None:
            log("Cex: hoja", sh, "sin fila de fechas")
            continue
        per = [(j, fr_period(c)) for j, c in enumerate(rows[hi]) if j > 0 and fr_period(c)]
        for r in rows[hi + 1:]:
            lab = str(r[0]).strip() if r else ""
            if not lab:
                continue
            pts = {p: rnd(val(r[j])) for j, p in per if len(r) > j and val(r[j]) is not None}
            if not pts:
                continue
            nm = CEX_ES.get(slug(lab), lab)
            if sh == "graph6":
                nm = "to third countries" if "pays tiers" in fold(lab) else "to the EU"
            out["cex-%s-%s" % (key, slug(lab))[:90]] = {"label": tmpl.format(nm) if "{}" in tmpl else tmpl, "unit": "million EUR", "pts": pts}
    return out


# ---- almacen --------------------------------------------------------------------------------------------------------------------------------------
def load(f, default):
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return default


def merge_series(old, new):
    """old, new: {id: {label, unit, pts}}. Lo nuevo reemplaza los puntos que trae; lo viejo que ya no viene se conserva."""
    res = {k: {"label": v["label"], "unit": v["unit"], "pts": dict(v["pts"])} for k, v in (old or {}).items()}
    for k, v in new.items():
        s = res.setdefault(k, {"label": v["label"], "unit": v["unit"], "pts": {}})
        s["label"], s["unit"] = v["label"], v["unit"]
        s["pts"].update(v["pts"])
    return res


def merge_est(old, edition, new):
    """old: {cosecha: {region: {cultivo: {edicion: [s, r, p]}}}}; new: {cosecha: {region: {cultivo: [s, r, p]}}}."""
    old = old or {}
    for y, regs in new.items():
        for rg, cult in regs.items():
            for c, t in cult.items():
                old.setdefault(y, {}).setdefault(rg, {}).setdefault(c, {})[edition] = t
    return old


def doc(now, **kw):
    return dict({"schemaVersion": 1, "generatedAt": now, "source": SRC}, **kw)


def write(path, d):
    path.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    state = load(OUT / "index.json", {"editions": {}})
    state.setdefault("editions", {})
    lait = load(OUT / "lait.json", {}).get("series", {})
    cult = load(OUT / "cultivos.json", {})
    com = load(OUT / "comercio.json", {}).get("series", {})
    est, names, editions = cult.get("est", {}), cult.get("regions", {}), set(cult.get("editions", []))
    try:
        found, unk = discover(state)
    except Exception as e:
        log("DESCUBRIMIENTO FALLIDO, se conserva lo publicado:", str(e)[:200])
        found, unk = {}, []
    if not state.get("backfilled") and not unk:
        state["backfilled"] = True
    # editar de la mas antigua a la mas reciente: lo reciente reemplaza
    for pub in sorted(found, key=lambda k: (k[-5:-3], k[-3:])):
        urls, html = found[pub]
        kind = pub[3:6]
        m = re.search(r"Paru le\s*:\s*(\d{2})/(\d{2})/(\d{4})", clean_html(html))
        ent = {"kind": kind, "tries": state["editions"].get(pub, {}).get("tries", 0) + 1, "published": "%s-%s-%s" % (m.group(3), m.group(2), m.group(1)) if m else None, "status": "ok"}
        try:
            if kind == "Lai":
                u = pick(urls, r"\.zip$") or no_file(urls)
                new = read_lait(fetch(quote_url(u), "bin", tries=4, wait=20, timeout=180, log=log))
                lait = merge_series(lait, new)
                ent["series"] = len(new)
            elif kind == "Gcu":
                u = pick(urls, r"regions.*\.xlsx$") or no_file(urls)
                ed, e2, nm = read_gcu(fetch(quote_url(u), "bin", tries=4, wait=20, timeout=180, log=log))
                est = merge_est(est, ed, e2)
                names.update(nm)
                editions.add(ed)
                ent["edition"] = ed
            elif kind == "Cex":
                u = pick(urls, r"compl.*\.xlsx$") or no_file(urls)
                new = read_cex(fetch(quote_url(u), "bin", tries=4, wait=20, timeout=180, log=log))
                com = merge_series(com, new)
                ent["series"] = len(new)
            log("ok", pub, ent)
        except Exception as e:
            ent["status"] = "error"
            ent["error"] = str(e)[:160]
            log("EDICION ILEGIBLE", pub, str(e)[:160])
        state["editions"][pub] = ent
    if not found and (OUT / "index.json").exists():
        log("sin ediciones nuevas: se conserva lo publicado")
        (ROOT / "data" / "france-infosrapides-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    if not state["editions"]:
        log("sin ediciones leidas: no se publica nada nuevo")
        (ROOT / "data" / "france-infosrapides-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    state.update({"schemaVersion": 1, "generatedAt": now, "source": SRC})
    state["latest"] = {k: max((p for p, e in state["editions"].items() if e["kind"] == k and e["status"] == "ok"), key=lambda p: (p[-5:-3], p[-3:]), default=None) for k in SEED}
    write(OUT / "index.json", state)
    write(OUT / "lait.json", doc(now, series=lait))
    write(OUT / "cultivos.json", doc(now, editions=sorted(editions), regions=names, est=est))
    write(OUT / "comercio.json", doc(now, series=com))
    st = stats(lait, com, est, names, now)
    log("series de catalogo:", len(st["countries"]["FR"]["series"]))
    write(ROOT / "data" / "france-infosrapides-stats.json", st)
    (ROOT / "data" / "france-infosrapides-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


# ---- catalogo ------------------------------------------------------------------------------------------------------------------------------------
CROPS = [("Blé tendre", "Soft wheat"), ("Blé dur", "Durum wheat"), ("Orge", "Barley"), ("Maïs grain", "Grain maize"), ("Colza", "Rapeseed"), ("Tournesol", "Sunflower"),
         ("Betteraves industrielles", "Sugar beet"), ("Pommes de terre de conservation et demi-saison", "Potatoes (storage and mid-season)")]
METRICS = [(2, "production", "1000 t"), (1, "yield", "q/ha"), (0, "area", "1000 ha")]


def series_pts(s):
    p = sorted(s["pts"].items())
    return [[k, v] for k, v in p]


def stats(lait, com, est, names, now):
    out = []

    def add(sid, grp, label, unit, pts, minpts, yoy=True):
        if len(pts) < minpts:
            return
        last = pts[-1]
        ch = None
        if yoy and re.fullmatch(r"\d{4}-\d{2}", last[0]):
            prev = next((v for p, v in pts if p == "%d-%s" % (int(last[0][:4]) - 1, last[0][5:])), None)
            if prev not in (None, 0) and prev > 0 and last[1] > 0:
                ch = round((last[1] / prev - 1) * 100, 2)
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": "monthly", "latestPeriod": last[0], "latest": last[1], "changePct": ch, "points": pts, "sourceGroup": "agreste-infosrapides"})

    for k, s in sorted(lait.items()):
        hist = k[5:] in {c[0] for cols in LAIT_HIST.values() for c in cols.values()}
        add("fr-ira-" + k, "milk", s["label"] + " (Infos Rapides)", s["unit"], series_pts(s), 24 if hist else 12)
    for k, s in sorted(com.items()):
        add("fr-ira-" + k, "trade", s["label"] + " (Infos Rapides)", s["unit"], series_pts(s), 24)
    ys = sorted(est)
    for y in ys[-1:]:
        fr = est[y].get("FR", {})
        for fr_name, en in CROPS:
            e = fr.get(fr_name)
            if not e or len(e) < 2:
                continue
            for idx, met, unit in METRICS:
                pts = [[ed, t[idx]] for ed, t in sorted(e.items()) if t[idx] is not None]
                add("fr-ira-gcu-%s-%s-%s" % (slug(en), met, y), "crops", "%s %s estimate, harvest %s, France (Infos Rapides, by edition)" % (en, met, y), unit, pts, 2, yoy=False)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": SRC, "series": out}}}


if __name__ == "__main__":
    main()

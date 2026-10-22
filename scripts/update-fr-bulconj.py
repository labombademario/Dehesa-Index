#!/usr/bin/env python3
"""Francia: Bulletin de conjoncture mensuel (BulConj, Agreste/SSP) -> data/france-bulconj/index.json, una hoja por fichero (<hoja>.json) y data/france-bulconj-stats.json (series de precios clave).

Fuente: ficha disaron/BulConj, un zip con el libro «<AAMM>_Bulletin.xls» (40 hojas: cereales, oleoproteaginosas, patata, azucar, hortalizas, fruta, vino, bovino, ternera, porcino, ovino, aves y huevos,
leche, industrias agroalimentarias, clima, maquinaria, energia, abonos, IPAMPA, piensos, comercio exterior por nomenclatura, precios de produccion y de consumo). Cada hoja apila varias tablas con
la misma cabecera «Rubriques | N° | Unité | <periodo> ...». Tres disposiciones:
  - campaña x meses (cabecera «Campagne», meses de la campaña: julio-junio, agosto-julio, septiembre-agosto, octubre-septiembre) mas una columna final (acumulado o media de campaña);
  - año x meses (cabecera «Année», enero-diciembre) mas una columna final (total o media anual);
  - columnas anuales (años o campañas) sin meses.
Una fila de datos lleva rubrica (solo en la primera fila del bloque), numero, unidad (en una fila aparte) y periodo; los titulos en mayusculas («EXPORTATIONS», «EN TETES», «BLE TENDRE») y las
etiquetas sueltas («Marché France métropolitaine») dan el contexto. La clave de cada serie es hoja + contexto + rubrica + numero + unidad. Los periodos son AAAA-MM (mes), AAAA-AAAA (campaña, valor de la columna final)
o AAAA (año). El libro solo trae unas campañas de detalle mensual: el script CONSERVA los puntos de ediciones anteriores y reemplaza los que la edicion actual vuelve a traer. Una celda vacia no existe: nada se estima.
Si la descarga falla se conserva lo publicado."""
import datetime, io, json, re, sys, unicodedata, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_agreste import DL, detail_files, fetch, pick, quote_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "france-bulconj"
LOG = []
SRC = {"name": "Agreste (SSP) - Bulletin de conjoncture mensuel", "url": "https://agreste.agriculture.gouv.fr/agreste-web/disaron/BulConj/detail/", "license": "Licence Ouverte 2.0 (Etalab)"}
MONTHS = {"janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fold(s):
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower().strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-")


def tok_year(c):
    """2025 / 2025.0 / '2025' -> 2025; otro -> None."""
    if isinstance(c, (int, float)) and c == int(c) and 1900 <= c <= 2100:
        return int(c)
    if isinstance(c, str) and re.fullmatch(r"\d{4}(\.0)?", c.strip()):
        return int(float(c))
    return None


def tok_camp(c):
    m = re.fullmatch(r"(\d{4})-(\d{4})", str(c).strip())
    return (int(m.group(1)), int(m.group(2))) if m else None


def numv(c):
    if isinstance(c, bool) or c == "" or c is None:
        return None
    if isinstance(c, (int, float)):
        v = float(c)
    else:
        try:
            v = float(str(c).replace(",", ".").strip())
        except ValueError:
            return None
    if v != v:
        return None
    return int(v) if v == int(v) and abs(v) < 1e12 else round(v, 6)


def is_title(c0, rest_empty):
    s = str(c0).strip()
    letters = re.sub(r"[^A-Za-zÀ-ÿ]", "", s)
    return rest_empty and len(letters) >= 3 and s.upper() == s and not s.startswith("(")


def parse_sheet(rows):
    """rows: lista de listas (celdas). -> lista de series {id, sec, label, detail, no, unit, agg, pts:{periodo:valor}}."""
    series, order = {}, []
    hdr = None          # (modo, columnas de datos [(indice, clave)], nombre de la columna final, primer mes)
    path, sub, data_seen = [], "", False
    label, no, unit = "", "", ""

    def side(c0, rest_empty):
        """Filas sin datos: titulos (mayusculas), etiquetas sueltas y unidades. Devuelve True si la fila era una de ellas."""
        nonlocal path, sub, label, no, unit, data_seen
        if c0 and is_title(c0, rest_empty):
            t0 = re.sub(r"\s+", " ", c0).strip()
            path = (path[:-1] if (data_seen and path) else path) + [t0]
            path = path[-3:]
            data_seen = False
            label, no = "", ""
            return True
        return False

    for row in rows:
        c = list(row) + [""] * max(0, 20 - len(row))
        c0 = str(c[0]).strip()
        if str(c[1]).strip() == "N°":
            h = [str(x).strip() for x in c]
            pc = next((i for i in range(2, 6) if h[i] in ("Campagne", "Année", "Année civile")), None)
            if pc is not None:
                cols, aggname, start = [], "", None
                for i in range(pc + 1, len(h)):
                    f = fold(h[i])
                    if f in MONTHS:
                        start = start or MONTHS[f]
                        cols.append((i, MONTHS[f]))
                    elif h[i] != "":
                        aggname = h[i]
                        cols.append((i, "agg"))
                hdr = ("camp" if h[pc] == "Campagne" else "year", cols, aggname, start or 1, pc)
            else:
                cols = []
                for i in range(3, len(h)):
                    if tok_camp(c[i]) or tok_year(c[i]):
                        cols.append((i, tok_camp(c[i]) or tok_year(c[i])))
                    elif h[i] != "":
                        cols.append((i, h[i]))
                hdr = ("cols", cols, "", 1, 3)
            label, no, unit, sub, data_seen = "", "", "", "", False
            continue
        if c0.startswith("Haut de la feuille"):
            path, sub, hdr, data_seen = [], "", None, False
            continue
        rest_empty = all(str(x).strip() == "" for x in c[1:6])
        if side(c0, rest_empty):
            continue
        if hdr is None:
            continue
        mode = hdr[0]
        if mode in ("camp", "year"):
            ptok = c[hdr[4]]
            ok = (tok_camp(ptok) is not None) if mode == "camp" else (tok_year(ptok) is not None)
            vals = None
        else:
            vals = [(i, k, numv(c[i])) for i, k in hdr[1]]
            ok = any(v is not None for _, _, v in vals)
        if not ok:
            if c0 and rest_empty and len(c0) <= 90 and not c0.startswith(("(", "Source", "Note", "Les ")):
                sub = c0
                label, no = "", ""
            elif hdr[4] > 2 and str(c[2]).strip() and not c0 and str(c[1]).strip() == "":
                unit = str(c[2]).strip()
            continue
        frag = re.sub(r"\s+", " ", c0).strip()
        if frag:
            label = frag
        if str(c[1]).strip():
            v1 = numv(c[1])
            no = str(v1) if v1 is not None else str(c[1]).strip()
        if hdr[4] > 2 and str(c[2]).strip():
            unit = str(c[2]).strip()
        data_seen = True
        key = (tuple(path), sub, no, unit) if no else (tuple(path), sub, "L:" + label, unit)
        if key not in series:
            series[key] = {"sec": " > ".join(path + ([sub] if sub else [])), "label": label, "frags": [], "no": no, "unit": unit, "agg": hdr[2] if mode != "cols" else "", "pts": {}}
            order.append(key)
        s = series[key]
        if frag and frag != s["label"] and frag not in s["frags"]:
            s["frags"].append(frag)
        if mode in ("camp", "year"):
            if mode == "camp":
                y0, y1 = tok_camp(ptok)
            else:
                y0 = tok_year(ptok)
            for i, k in hdr[1]:
                v = numv(c[i])
                if v is None:
                    continue
                if k == "agg":
                    s["pts"]["%d-%d" % (y0, y1) if mode == "camp" else str(y0)] = v
                else:
                    yy = y0 if (mode == "year" or k >= hdr[3]) else y1
                    s["pts"]["%d-%02d" % (yy, k)] = v
        else:
            for i, k, v in vals:
                if v is None:
                    continue
                if isinstance(k, tuple):
                    s["pts"]["%d-%d" % k] = v
                elif isinstance(k, int):
                    s["pts"][str(k)] = v
    out, ids = [], set()
    for key in order:
        s = series[key]
        if not s["pts"]:
            continue
        base = "|".join(slug(x) for x in (s["sec"], s["no"] or s["label"], s["unit"]))
        sid, k = base, 2
        while sid in ids:
            sid, k = "%s~%d" % (base, k), k + 1
        ids.add(sid)
        s["id"] = sid
        s["detail"] = " / ".join(s.pop("frags"))[:200]
        out.append(s)
    return out


def merge(old, new):
    """Conserva los puntos de ediciones previas que la actual ya no trae y las series que desaparecen."""
    by = {s["id"]: s for s in new}
    for o in old or []:
        s = by.get(o["id"])
        if s is None:
            new.append(o)
            continue
        for p, v in o["pts"].items():
            s["pts"].setdefault(p, v)
    return new


def sheet_file(name):
    return slug(name) + ".json"


def discover():
    try:
        urls, _ = detail_files("BulConj", log=log)
        u = pick(urls, r"_Bulletin\.zip$") or pick(urls, r"\.zip$")
        if u:
            return quote_url(u)
    except Exception as e:
        log("ficha ilegible:", str(e)[:120])
    return None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        import xlrd
    except ImportError:
        log("falta xlrd (pip install xlrd)")
        sys.exit(1)
    try:
        url = discover()
        if not url:
            raise RuntimeError("sin enlace al zip del boletin")
        log("descargando", url)
        z = zipfile.ZipFile(io.BytesIO(fetch(url, "bin", tries=6, wait=25, timeout=300, log=log)))
        member = next((i.filename for i in z.infolist() if re.search(r"_Bulletin\.xls$", i.filename)), None)
        if not member:
            raise RuntimeError("el zip no trae el libro _Bulletin.xls: %s" % [i.filename for i in z.infolist()])
        wb = xlrd.open_workbook(file_contents=z.read(member))
    except Exception as e:
        log("DESCARGA FALLIDA, se conserva lo publicado:", str(e)[:200])
        (ROOT / "data" / "france-bulconj-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        return
    edition = re.match(r"(\d{4})_", member)
    updated = ""
    try:
        sm = wb.sheet_by_name("Sommaire")
        for r in range(sm.nrows):
            m = re.search(r"Mis à jour le (\d{2}/\d{2}/\d{2})", str(sm.cell_value(r, 0)))
            if m:
                d, mo, y = m.group(1).split("/")
                updated = "20%s-%s-%s" % (y, mo, d)
    except Exception:
        pass
    sheets = {}
    for sh in wb.sheets():
        if sh.name in ("Sommaire", "SiglesDéfinitions"):
            continue
        rows = [[(sh.cell_value(r, c) if sh.cell_type(r, c) != 5 else "") for c in range(sh.ncols)] for r in range(sh.nrows)]
        try:
            ser = parse_sheet(rows)
        except Exception as e:
            log("hoja ilegible", sh.name, str(e)[:100])
            continue
        title = str(rows[0][0]).strip() if rows and rows[0] else sh.name
        f = OUT / sheet_file(sh.name)
        old = None
        if f.exists():
            try:
                old = json.loads(f.read_text(encoding="utf-8"))["series"]
            except Exception:
                old = None
        ser = merge(old, ser)
        sheets[sh.name] = {"file": sheet_file(sh.name), "title": title, "series": ser}
        log("ok", sh.name, len(ser), "series", sum(len(s["pts"]) for s in ser), "puntos")
    if len(sheets) < 25 or "Céréales" not in sheets:
        log("el libro no tiene la forma esperada (hojas leidas: %d): no se publica" % len(sheets))
        sys.exit(1)
    idx = {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition.group(1) if edition else None, "updated": updated or None, "sheets": {}}
    for name, d in sheets.items():
        doc = {"schemaVersion": 1, "generatedAt": now, "source": SRC, "sheet": name, "title": d["title"], "edition": idx["edition"], "updated": idx["updated"], "series": d["series"]}
        (OUT / d["file"]).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        idx["sheets"][name] = {"file": d["file"], "title": d["title"], "series": len(d["series"]), "points": sum(len(s["pts"]) for s in d["series"])}
    (OUT / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(sheets, now)
    n = len(st["countries"]["FR"]["series"])
    log("series de catalogo:", n)
    if n:
        (ROOT / "data" / "france-bulconj-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    cand = [(name, s["id"], s["unit"], max(s["pts"]), len(s["pts"])) for name, d in sheets.items() for s in d["series"] if re.search(r"€|euro|indice|index", s["unit"], re.I) and re.search(r"^\d{4}-\d{2}$", max(s["pts"], default=""))]
    log("candidatas de precio/indice con datos mensuales:", len(cand))
    for name, sid, u, last, k in cand:
        log("  CAND", name, "|", sid, "|", u, "|", last, "|", k)
    (ROOT / "data" / "france-bulconj-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


# Hojas y tablas que entran al catalogo: cotizaciones y precios mensuales de productos agrarios e insumos (hoja -> (patron de la tabla, grupo)).
PICK = {
    "cereales": (r"^cotations", "prices"), "oleoproteagineux": (r"^cotations", "prices"), "sucre": (r"^cours", "prices"), "pommes-de-terre": (r"^cours", "prices"),
    "gros-bovins": (r"^(cotations|prix)", "prices_lv"), "veaux": (r"^(cotations|prix)", "prices_lv"), "porcins": (r"^(cotations|prix)", "prices_lv"),
    "ovinscaprinsequides": (r"^(cotations|prix)", "prices_lv"), "volaillesoeufslapins": (r"^(cours|cotations|ufs)", "prices_lv"),
    "lait": (r"^(prix|autres-cotations-donnees-a-partir)", "milk"),
    "engrais": (r"^prix", "inputs"), "alimentation-animale": (r"^prix-des-matieres", "inputs"), "energie": (r"^prix-des-produits", "inputs"),
}
SHEET_ES = {"cereales": "cereales", "oleoproteagineux": "oleaginosas y proteaginosas", "sucre": "azucar", "pommes-de-terre": "patata", "gros-bovins": "bovino adulto", "veaux": "terneros",
            "porcins": "porcino", "ovinscaprinsequides": "ovino", "volaillesoeufslapins": "aves y huevos", "lait": "leche", "engrais": "abonos", "alimentation-animale": "piensos", "energie": "energia"}


def unit_short(u):
    t = fold(u)
    t = re.sub(r"\s*-\s*entree abattoir", "", t)
    t = t.replace("euro par 100 kg", "euro / 100 kg").replace("euro-hl", "euro / hl")
    m = re.match(r"euro / (.+)$", t)
    if not m:
        return None
    d = m.group(1).replace(" ", "")
    return "\u20ac/" + {"tonne": "t", "kg": "kg", "kgvif": "kg live", "kgcarcasse": "kg carcass", "100kgcarcasse": "100 kg carcass", "100kg": "100 kg", "hl": "hl", "1000litres": "1000 l", "litre": "l", "100kg d'elementsfertilisants": "100 kg nutrient", "cent": "100 units", "tete": "head"}.get(d, d)


def clean_label(s):
    t = re.sub(r"\s*\(\d+\)\*?|\s*\*+$", "", s).strip()
    return re.sub(r"\s+", " ", t)


def stats(sheets, now):
    out = []
    allm = [max(p for p in s["pts"] if re.fullmatch(r"\d{4}-\d{2}", p)) for d in sheets.values() for s in d["series"] if any(re.fullmatch(r"\d{4}-\d{2}", p) for p in s["pts"])]
    newest = max(allm) if allm else ""
    ny, nm = (int(newest[:4]), int(newest[5:])) if newest else (0, 0)
    for name, d in sheets.items():
        key = slug(name)
        if key not in PICK:
            continue
        pat, grp = PICK[key]
        for s in d["series"]:
            sec = s["sec"]
            top = slug(sec.split(" > ")[0])
            if not re.search(pat, top):
                continue
            u = unit_short(s["unit"])
            if not u:
                continue
            mon = sorted((p, v) for p, v in s["pts"].items() if re.fullmatch(r"\d{4}-\d{2}", p))
            if len(mon) < 12:
                continue
            ly, lm = int(mon[-1][0][:4]), int(mon[-1][0][5:])
            if (ny - ly) * 12 + (nm - lm) > 8:
                continue  # serie interrumpida: no es un precio de hoy
            pts = [[p, v] for p, v in mon]
            last = pts[-1][1]
            prev = next((v for p, v in reversed(pts[:-1]) if p == "%d-%02d" % (ly - 1, lm)), None)
            ch = round((last / prev - 1) * 100, 2) if prev and prev > 0 else None
            lab = clean_label(s["label"]) + (" (" + clean_label(s["detail"]) + ")" if s["detail"] else "")
            ctx = " / ".join(clean_label(x).capitalize() for x in sec.split(" > "))
            lab = "%s - %s, %s, France (BulConj)" % (lab, ctx, SHEET_ES.get(key, name))
            out.append({"id": "fr-bulconj-" + d["file"][:-5] + "-" + slug(s["id"].replace("|", "-"))[:90], "group": grp, "label": lab[:170], "unit": u, "frequency": "monthly",
                        "latestPeriod": pts[-1][0], "latest": last, "changePct": ch, "points": pts, "sourceGroup": "agreste-bulconj"})
    seen = {}
    for x in out:
        n = seen.get(x["id"], 0)
        seen[x["id"]] = n + 1
        if n:
            x["id"] += "-%d" % (n + 1)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"FR": {"name": "France", "extend": True, "source": SRC, "series": out}}}


if __name__ == "__main__":
    main()

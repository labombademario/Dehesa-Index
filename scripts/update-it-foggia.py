#!/usr/bin/env python3
"""Italia: Borsa Merci di Foggia (Camera di Commercio di Foggia), listini settimanali -> data/italy-foggia.json

Fuente: conjuntos «Foggia - listini dei prezzi dei prodotti cerealicoli / olivicoli anno AAAA» (Camera di Commercio di Foggia), publicados en el portal
opengovernment.unioncamere.gov.it y recogidos en el catálogo nacional dati.gov.it (desde GitHub Actions dati.gov.it no responde: se usa primero la ficha de Unioncamere), licencia CC BY 4.0;
un CSV (';') por mes en opengovernment.unioncamere.gov.it, con una columna de precio mínimo y otra de máximo por cada miércoles de cotización.
Productos: trigo duro por calidad (fino, buono mercantile, mercantile, biológico), sémolas de trigo duro, aceite de oliva virgen extra por acidez, DOP Dauno,
IGP Puglia, virgen y lampante. Las aceitunas (pocas sesiones al año) no se publican.
Reglas:
  - Cada serie es una calidad con sus especificaciones: el 19-jun-2024 la Borsa cambió las del trigo duro (peso específico, vitreosidad, proteína) y las
    calidades se separan por el peso mínimo que declaran, para no unir precios de trigos distintos.
  - Se guardan el mínimo y el máximo tal cual. Un par en el que el mínimo supera al máximo, o un precio que se aparta más de un 40 % de la mediana de
    sus vecinos en la misma serie (erratas como «165» por «465»), se descarta y se anota en «dropped» y en el registro. No se corrige nada.
  - Sin cotización (en verano no cotiza el trigo duro convencional) = sin punto.
  - La Cámara publica por meses con uno a tres meses de retraso: la página lo dice.
Uso: update-it-foggia.py [--out DIR] [--cache DIR]"""
import csv, datetime, io, json, os, re, statistics, sys, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
CKAN = "https://www.dati.gov.it/opendata/api/3/action/package_show?id=foggia-listini-dei-prezzi-dei-prodotti-%s-anno-%d"
FIRST_YEAR = 2023
LOG = []; CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, name=None, tries=4):
    if CACHE and name and (CACHE / name).exists(): return (CACHE / name).read_bytes()
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r: b = r.read()
            if CACHE and name: (CACHE / name).write_bytes(b)
            return b
        except Exception as e:
            last = e
            if getattr(e, "code", None) == 404: break
            time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %r" % (url[-100:], last))
UC = "https://opengovernment.unioncamere.gov.it/dataset/foggia-listini-dei-prezzi-dei-prodotti-%s-anno-%d"
def resources(kind_ds, y):
    """URLs de los CSV del conjunto. Primero la ficha del conjunto en el portal de Unioncamere (la que responde desde GitHub Actions);
    si falla, el catálogo dati.gov.it. None si la licencia no es CC BY 4.0."""
    try:
        h = get(UC % (kind_ds, y), "uc-%s-%d.html" % (kind_ds, y)).decode("utf-8", "replace")
        if "foggia" not in h.lower(): raise ValueError("ficha sin contenido")
        if not re.search(r"CC\.?\s*BY\.?\s*4\.0|Creative Commons Attribuzione 4\.0", h): return None
        u = list(dict.fromkeys(re.findall(r'href="(https://opengovernment\.unioncamere\.gov\.it/download/\d+)"', h)))
        if u: return u
        raise ValueError("ficha sin ficheros")
    except Exception as e:
        log("AVISO: ficha de Unioncamere %s %d no disponible (%s); se prueba dati.gov.it" % (kind_ds, y, str(e)[:80]))
    pkg = json.loads(get(CKAN % (kind_ds, y), "pkg-%s-%d.json" % (kind_ds, y)))["result"]
    lic = pkg.get("license_id") or ""
    if "CC BY" not in lic and "cc-by" not in lic.lower(): return None
    return [r.get("url") for r in pkg.get("resources", []) if r.get("url")]
def text(b):
    try: return b.decode("utf-8-sig")
    except UnicodeDecodeError: return b.decode("cp1252")
def norm(s): return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
def fnum(s):
    s = (s or "").strip().replace(" ", "")
    if not s or s in ("-", "n.q.", "nq"): return None
    s = s.replace(".", "").replace(",", ".") if re.match(r"^\d{1,3}(\.\d{3})+(,\d+)?$", s) else s.replace(",", ".")
    try: return float(s)
    except ValueError: return None
GRAIN = [("biologico", "durum-organic", "Grano duro biologico"), ("buono mercantile", "durum-bm", "Grano duro buono mercantile"), ("fino", "durum-fino", "Grano duro fino"),
         ("mercantile", "durum-merc", "Grano duro mercantile")]
def classify(name, kind):
    """(id, nombre, unidad) o None"""
    n = norm(name)
    if kind == "olio":
        if "olio" not in n or n.startswith(("olive", "varieta")): return None   # «Olive da olio varietà Coratina» son aceitunas, no aceite
        base = re.sub(r"\s+", " ", name.strip()); key = re.sub(r"[^a-z0-9]+", "-", n).strip("-")
        up = sum(ch.isupper() for ch in base); lo = sum(ch.islower() for ch in base)
        if up > lo:   # «OLIO EXTRAVERGINE D.O.P. DAUNO, Gargano» -> «Olio extravergine DOP Dauno, Gargano»
            base = (base[:1] + base[1:].lower()).replace("d.o.p. dauno", "DOP Dauno").replace("igp puglia", "IGP Puglia")
            base = re.sub(r"(Dauno, )(\w)", lambda m: m.group(1) + m.group(2).upper(), base)
        return ("oil-" + key[:60], base, "€/kg")
    if n.startswith("semola") or "semola di grano duro" in n:
        g = "080-085" if "0.80" in n or "0,80" in n else "086-090" if "0.86" in n or "0,86" in n else None
        if not g: return None
        return ("semola-" + g, "Semola di grano duro (ceneri %s %%)" % ("0,80-0,85" if g == "080-085" else "0,86-0,90"), "€/t")
    if "grano duro" not in n: return None
    for kw, gid, lab in GRAIN:
        if kw in n:
            m = re.search(r"peso min\.?\s*(\d+(?:[.,]\d+)?)", n); w = m.group(1).replace(",", ".") if m else "x"
            return ("%s-p%s" % (gid, w.replace(".", "")), "%s (peso min. %s kg/hl)" % (lab, w.replace(".", ",")), "€/t")
    return None
def parse(t, kind, acc, names):
    rows = [r for r in csv.reader(io.StringIO(t), delimiter=";")]
    # algunos ficheros (2024) empiezan con una fila de título y otra vacía: la cabecera es la primera fila que empieza por «Data» o «Prodotto»
    hi = next((i for i, r in enumerate(rows) if r and re.match(r"^(data|prodotto)", norm(r[0].strip()))), None)
    if hi is None: return 0
    rows = rows[hi:]
    # dos formatos: cabecera «Prodotto;prezzo minimo €/t rilevazione del dd/mm/aaaa;...» o dos filas «Data;dd/mm/aaaa;...» + «Valori;prezzo minimo;...»
    dates, kinds, start = [], [], 1
    h = rows[0]
    if h and norm(h[0]).startswith("data") and len(rows) > 1:
        dates = [(re.search(r"(\d{2})/(\d{2})/(\d{4})", c) or [None]) for c in h[1:]]; kinds = [norm(c) for c in rows[1][1:]]; start = 2
    else:
        dates = [(re.search(r"(\d{2})/(\d{2})/(\d{4})", c) or [None]) for c in h[1:]]; kinds = [norm(c) for c in h[1:]]
    cols = []
    for i, (m, k) in enumerate(zip(dates, kinds)):
        if not m or m[0] is None: cols.append(None); continue
        d = "%s-%s-%s" % (m.group(3), m.group(2), m.group(1))
        cols.append((d, "min" if "minimo" in k else "max" if "massimo" in k else None))
    n = 0
    for r in rows[start:]:
        if not r or not r[0].strip(): continue
        c = classify(r[0], kind)
        if not c: continue
        sid, nm, unit = c; names[sid] = (nm, unit, kind)
        for i, cell in enumerate(r[1:]):
            if i >= len(cols) or not cols[i] or not cols[i][1]: continue
            v = fnum(cell)
            if v is None: continue
            acc.setdefault(sid, {}).setdefault(cols[i][0], {})[cols[i][1]] = v; n += 1
    return n
def clean(acc, names):
    dropped = []
    for sid, pts in acc.items():
        for d in list(pts):
            p = pts[d]
            if "min" in p and "max" in p and p["min"] > p["max"]: dropped.append([sid, d, p.get("min"), p.get("max"), "mínimo mayor que el máximo"]); pts.pop(d)
        ks = sorted(pts)
        for j, d in enumerate(ks):
            if d not in pts: continue
            near = [statistics.mean([x for x in pts[k].values()]) for k in ks[max(0, j - 4): j + 5] if k != d and k in pts]
            if len(near) < 3: continue
            med = statistics.median(near); v = pts[d]
            bad = [x for x in v.values() if abs(x - med) > 0.4 * med]
            if bad: dropped.append([sid, d, v.get("min"), v.get("max"), "se aparta más de un 40 %% de la mediana de sus vecinos (%.2f)" % med]); pts.pop(d)
    for x in dropped: log("descartado:", x)
    return dropped
def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    acc, names, files = {}, {}, 0
    for y in range(FIRST_YEAR, datetime.date.today().year + 1):
        for kind_ds in ("cerealicoli", "olivicoli"):
            kind = "grano" if kind_ds == "cerealicoli" else "olio"
            try: urls = resources(kind_ds, y)
            except Exception as e: log("AVISO: sin conjunto %s %d (%s)" % (kind_ds, y, str(e)[:100])); continue
            if urls is None: log("ERROR: licencia inesperada en %s %d" % (kind_ds, y)); return 1
            for u in urls:
                try: parse(text(get(u, "r" + u.rsplit("/", 1)[-1] + ".csv")), kind, acc, names); files += 1
                except Exception as e: log("AVISO: %s: %s" % (u, str(e)[:100])); continue
    dropped = clean(acc, names)
    series = []
    for sid, pts in sorted(acc.items()):
        pl = [[d, pts[d].get("min"), pts[d].get("max")] for d in sorted(pts) if pts[d]]
        if len(pl) < 4: continue
        nm, unit, kind = names[sid]
        series.append({"id": "it-foggia-" + sid, "name": nm, "group": kind, "unit": unit, "points": pl, "latest": pl[-1]})
    if len(series) < 6 or not any(s["group"] == "grano" for s in series) or not any(s["group"] == "olio" for s in series):
        log("ERROR: solo %d series (se esperan trigo y aceite); no se escribe nada" % len(series)); return 1
    last = max(s["points"][-1][0] for s in series)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "cciaa_foggia", "name": "Camera di Commercio di Foggia, Borsa Merci — listini settimanali (dati.gov.it)", "url": "https://www.dati.gov.it/opendata/dataset?q=foggia+listini+dei+prezzi", "license": "CC BY 4.0"},
           "lastDate": last, "files": files, "series": series, "dropped": dropped,
           "note": "Precio mínimo y máximo de cada sesión de los miércoles, tal como los publica la Borsa Merci di Foggia. Los listados se publican por meses con uno a tres meses de retraso. Las calidades de trigo duro se separan por su peso específico mínimo porque la Borsa cambió las especificaciones el 19-jun-2024.",
           "log": LOG[-20:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "italy-foggia.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "italy-foggia.json")
    log("escrito: %d series de %d ficheros; última sesión %s; %d valores descartados" % (len(series), files, last, len(dropped)))
    return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "italy-foggia-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

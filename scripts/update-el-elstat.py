#!/usr/bin/env python3
"""Grecia (ELSTAT, Autoridad Estadistica Helenica) -> data/el-elstat/{prices,accounts}.json

Fuente: https://www.statistics.gr (ELSTAT reutilizable gratis, tambien con fines comerciales, citando la fuente;
politica de difusion de ELSTAT y condiciones de las estadisticas europeas).
  - prices:   publicacion DKT30 "Agricultural Price Indices", base 2020 = 100, mensual desde 2000.
              · indices de precios en origen (sin subvenciones) por grupo y subgrupo (serie 04, hoja Output),
              · indices de precios de los insumos (serie 04, hoja Input: energia, abonos, piensos, maquinaria...),
              · indices de productos seleccionados (serie 01): anual desde 2000 y mensual del año en curso.
  - accounts: publicacion SEL61 "Regional Accounts for Agriculture": cuentas economicas de la agricultura por region
              (NUTS 1 y 2), millones de euros, año mas reciente: produccion por cultivo y ganado, consumos intermedios,
              valor añadido, subvenciones, renta.
Nada se estima: celda vacia o 0,0 en un indice mensual = mes sin precio (producto fuera de temporada) = null.
Los .xls se leen con xlrd; la cuenta regional (.xlsx) con openpyxl. Si algo no cuadra (indices, sumas), no se escribe nada.
Uso: python3 scripts/update-el-elstat.py [--only prices,accounts,regions] [--local carpeta con ts01.xls ts04.xls regional.xlsx]"""
import argparse, datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
INST = "documents_WAR_publicationsportlet_INSTANCE_"
BASE = "https://www.statistics.gr/en/statistics?p_p_id=" + INST + "%s&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=4&p_p_col_pos=%d&_" + INST + "%s_javax.faces.resource=document&_" + INST + "%s_ln=downloadResources&_" + INST + "%s_documentID=%d&_" + INST + "%s_locale=en"
def doc_url(inst, pos, doc): return BASE % (inst, pos, inst, inst, inst, doc, inst)
FILES = {   # nombre local -> (url, extension esperada)
    "ts01": (doc_url("Mr0GiQJSgPHd", 3, 114677), "xls"),       # productos seleccionados (anual y mensual del año en curso)
    "ts04": (doc_url("Mr0GiQJSgPHd", 3, 114681), "xls"),       # indices mensuales por grupo: precios en origen (Output) e insumos (Input)
    "regional": (doc_url("VBZOni0vs5VJ", 2, 579762), "xlsx"),  # cuentas agrarias regionales
}
PAGES = {"prices": "https://www.statistics.gr/en/statistics/-/publication/DKT30/-", "accounts": "https://www.statistics.gr/en/statistics/-/publication/SEL61/-"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def http(u, tries=3, t=120):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e:
            last = e
            if getattr(e, "code", None) in (400, 404): break
            time.sleep(4 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-60:], str(last)[:120]))
def fetch(name, local):
    if local:
        for ext in ("xls", "xlsx"):
            p = Path(local) / (name + "." + ext)
            if p.exists(): return p.read_bytes()
        raise RuntimeError("falta " + name + " en " + str(local))
    b = http(FILES[name][0]); want = FILES[name][1]
    if want == "xls" and b[:4] != b"\xd0\xcf\x11\xe0": raise RuntimeError(name + ": no es un .xls (cabecera %r)" % b[:8])
    if want == "xlsx" and b[:2] != b"PK": raise RuntimeError(name + ": no es un .xlsx (cabecera %r)" % b[:8])
    return b
def xls_sheets(b):
    import xlrd
    wb = xlrd.open_workbook(file_contents=b)
    return {s.name: [s.row_values(r) for r in range(s.nrows)] for s in wb.sheets()}
def clean(s): return re.sub(r"\s+", " ", str(s)).strip()
def num(v):
    if isinstance(v, (int, float)) and not isinstance(v, bool): return float(v)
    return None
def code_of(v):
    if isinstance(v, float): return str(int(v))
    return clean(v)
def idx(v):
    """Indice mensual: vacio o 0,0 = sin precio ese mes."""
    x = num(v)
    return None if x is None or x == 0 else round(x, 1)
TITLE = re.compile(r"^(Output|Input) Price Index in Agriculture - Livestock, (\d{4})$")
MONTHS = "Jan Feb Mar Apr May June July Aug Sep Oct Nov Dec".split()

def parse_monthly(rows, side):
    """Hoja Output/Input de la serie 04 -> {codigo: {name, weight, m: {(año, mes): valor}, avg: {año: valor}}}."""
    out = {}; year = None; i = 0
    while i < len(rows):
        r = rows[i]; m = TITLE.match(clean(r[0])) if isinstance(r[0], str) else None
        if m:
            if m.group(1) != side: raise RuntimeError("hoja %s con titulo %s" % (side, clean(r[0])))
            year = int(m.group(2)); i += 1
            while i < len(rows) and clean(rows[i][0]) != "Code": i += 1
            i += 1
            while i < len(rows) and clean(rows[i][0]) and not clean(rows[i][0]).startswith("Note"):
                c = rows[i]; cd = code_of(c[0]); e = out.setdefault(cd, {"name": "", "weight": None, "m": {}, "avg": {}})
                nm = clean(c[1])
                if nm: e["name"] = nm
                w = num(c[3])
                if w is not None and (e["weight"] is None or year >= e.get("wy", 0)): e["weight"] = w; e["wy"] = year
                for k in range(12):
                    v = idx(c[4 + k])
                    if v is not None: e["m"][(year, k + 1)] = v
                a = idx(c[16]) if len(c) > 16 else None
                if a is not None: e["avg"][year] = a
                i += 1
            continue
        i += 1
    if not out or year is None: raise RuntimeError("no se reconoce la hoja " + side)
    return out
def series_block(side, S, first_ym, last_ym):
    ax = []; y, mo = first_ym
    while (y, mo) <= last_ym:
        ax.append((y, mo)); mo += 1
        if mo == 13: y += 1; mo = 1
    return ax
def parse_products(sh):
    """Serie 01: bloques de 15 productos con filas anuales y, para el año en curso, 12 filas mensuales (0,0 o vacio = sin precio)."""
    prods = {}; i = 0; cur = []; names = []; codes = []
    TY = {"Cuccumbers": "Cucumbers", "Cheries": "Cherries", "Wheat. soft": "Soft wheat", "Wheat. hard": "Durum wheat", "Sheep milk": "Sheep milk"}
    def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    while i < len(sh):
        r = sh[i]
        if clean(r[0]) == "Year and Month" or clean(r[0]).startswith("Year and Mon"):
            names = [clean(c) for c in r[1:]]; codes = [clean(c) for c in sh[i - 1][1:]] if i else [""] * len(names)
            cur = []
            for j, nm in enumerate(names):
                if not nm: continue
                nm2 = TY.get(nm, nm); pid = slug(nm2)
                e = prods.setdefault(pid, {"name": nm2, "code": codes[j] or None, "annual": {}, "monthly": {}}); cur.append((j, pid))
            i += 1
            year_m = None
            while i < len(sh):
                r = sh[i]; a0 = r[0]
                if isinstance(a0, float) and all(clean(x) == "" for x in r[1:]):      # cabecera del año con meses debajo
                    year_m = int(a0); i += 1; continue
                if isinstance(a0, float):
                    for j, pid in cur:
                        v = num(r[1 + j]);
                        if v: prods[pid]["annual"][int(a0)] = round(v, 1)
                    i += 1; continue
                s0 = clean(a0)
                if s0 in MONTHS and year_m:
                    for j, pid in cur:
                        v = idx(r[1 + j])
                        if v is not None: prods[pid]["monthly"].setdefault(year_m, {})[MONTHS.index(s0) + 1] = v
                    i += 1; continue
                if s0 == "" and all(clean(x) == "" for x in r): i += 1; continue
                break
            continue
        i += 1
    items = {}
    for pid, e in prods.items():
        if not e["annual"]: continue
        y0 = min(e["annual"]); y1 = max(e["annual"])
        v = [e["annual"].get(y) for y in range(y0, y1 + 1)]
        mo = None
        if e["monthly"]:
            my = max(e["monthly"]); mo = {"year": my, "v": [e["monthly"][my].get(k) for k in range(1, 13)]}
        items[pid] = {"name": e["name"], "code": e["code"], "from": y0, "annual": v, "monthly": mo}
    return items
def do_prices(outdir, local):
    t04 = xls_sheets(fetch("ts04", local)); t01 = xls_sheets(fetch("ts01", local))
    if "Output Price Index" not in t04 or "Input Price Index" not in t04: raise RuntimeError("ts04 sin hojas Output/Input: " + str(list(t04)))
    sides = {}
    allym = []
    for side, sh in (("Output", "Output Price Index"), ("Input", "Input Price Index")):
        sides[side] = parse_monthly(t04[sh], side); allym += [k for e in sides[side].values() for k in e["m"]]
    first = (2000, 1); last = max(allym)
    ax = series_block(None, None, first, last); months = ["%d-%02d" % ym for ym in ax]
    doc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "elstat", "name": "ELSTAT (Hellenic Statistical Authority)", "url": PAGES["prices"]},
           "base": "2020=100", "months": months, "last": months[-1],
           "note": "Indices de precios agrarios de ELSTAT (publicacion DKT30), datos provisionales los meses recientes. Precios en origen sin subvenciones. Un mes sin precio es null."}
    for side, key in (("Output", "output"), ("Input", "input")):
        S = sides[side]; items = {}
        for cd, e in S.items():
            v = [e["m"].get(ym) for ym in ax]
            if not any(x is not None for x in v): continue
            items[cd] = {"name": e["name"], "weight": e["weight"], "v": v}
        doc[key] = items
        # el promedio anual que publica ELSTAT esta ponderado por la produccion de cada mes (no es la media simple), asi que no se compara
        # con ella: se comprueba que el de 2020 es 100 (base) y que cada promedio cae dentro del rango de sus 12 meses (columna bien leida)
        bad = 0; chk = 0; b20 = 0; n20 = 0
        for cd, e in S.items():
            for yr, a in e["avg"].items():
                vals = [e["m"].get((yr, k)) for k in range(1, 13)]
                if yr == 2020: n20 += 1; b20 += abs(a - 100) > 0.05
                if any(x is None for x in vals): continue
                chk += 1
                if not min(vals) - 0.15 <= a <= max(vals) + 0.15: bad += 1
        log(key, len(items), "series;", chk, "promedios comprobados,", bad, "fuera de rango;", n20, "de 2020,", b20, "distintos de 100")
        if chk < 50 or bad > 0 or n20 < 8 or b20 > 0: raise RuntimeError(key + ": el promedio anual no cuadra con los meses (%d de %d; 2020: %d de %d)" % (bad, chk, b20, n20))
    sh = t01.get("Indices of SelectedAgr.Products") or next(iter(t01.values()))
    items = parse_products(sh)
    doc["products"] = items
    log("productos seleccionados:", len(items))
    if len(items) < 40: raise RuntimeError("productos seleccionados: solo %d" % len(items))
    # 2020 = 100 en los productos seleccionados (base)
    off = [p for p, e in items.items() if e["from"] <= 2020 and e["annual"][2020 - e["from"]] is not None and abs(e["annual"][2020 - e["from"]] - 100) > 0.05]
    if off: raise RuntimeError("productos cuyo 2020 no es 100: %s" % off[:5])
    write(outdir, "prices.json", doc)

REG = {   # nombre de la hoja -> (id NUTS, nivel)
    "Ellada": ("EL", 0), "Attiki": ("EL30", 2), "Nisia Aigaiou, Kriti": ("EL4", 1), "Voreio Aigaio": ("EL41", 2), "Notio Aigaio": ("EL42", 2), "Kriti": ("EL43", 2),
    "Voreia Ellada": ("EL5", 1), "Anatoliki Makedonia & Thraki": ("EL51", 2), "Kentriki Makedonia": ("EL52", 2), "Dytiki Makedonia": ("EL53", 2), "Ipeiros": ("EL54", 2),
    "Kentriki Ellada": ("EL6", 1), "Thessalia": ("EL61", 2), "Ionia Nisia": ("EL62", 2), "Dytiki Ellada": ("EL63", 2), "Sterea Ellada": ("EL64", 2), "Peloponnisos": ("EL65", 2)}
def parse_accounts(b):
    import io, openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True); ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True)); year = None
    for r in rows[:12]:
        m = re.match(r"^Year (\d{4})$", clean(r[0] or ""))
        if m: year = int(m.group(1))
    if not year: raise RuntimeError("no se encuentra el año de la cuenta regional")
    hi = next((k for k, r in enumerate(rows) if clean(r[0] or "") == "CATEGORIES"), None)
    if hi is None: raise RuntimeError("sin cabecera CATEGORIES")
    cols = []
    for j in range(2, len(rows[hi])):
        nm = clean(rows[hi][j] or "")
        if not nm: break
        if nm not in REG: raise RuntimeError("region desconocida en la cuenta regional: " + nm)
        cols.append((j, nm))
    if len(cols) != len(REG): raise RuntimeError("regiones: %d, esperadas %d" % (len(cols), len(REG)))
    regions = [{"id": REG[nm][0], "level": REG[nm][1], "name": nm} for j, nm in cols]
    out = []
    for r in rows[hi + 1:]:
        cd = clean(r[0] if r[0] is not None else "")
        if not cd or r[1] is None: continue
        if not re.match(r"^\d{2}(\.\d{1,2})?$", cd): continue
        vals = []
        for j, nm in cols:
            x = r[j]; vals.append(round(float(x), 3) if isinstance(x, (int, float)) else None)
        out.append({"c": cd, "name": clean(r[1]), "v": vals})
    codes = {x["c"] for x in out}
    for need in ("10", "13", "14", "16", "20", "27"):
        if need not in codes: raise RuntimeError("falta la linea " + need)
    # las 13 regiones NUTS 2 suman el total nacional (±3 %) en la produccion agraria
    pos = {x["id"]: k for k, x in enumerate(regions)}
    n2 = [k for k, x in enumerate(regions) if x["level"] == 2]
    for line in ("14", "16", "20"):
        row = next(x for x in out if x["c"] == line)
        tot = row["v"][pos["EL"]]; ssum = sum((row["v"][k] or 0) for k in n2)
        if not tot or abs(ssum / tot - 1) > 0.03: raise RuntimeError("linea %s: regiones suman %.1f y el total es %.1f" % (line, ssum, tot or 0))
    doc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "elstat", "name": "ELSTAT (Hellenic Statistical Authority)", "url": PAGES["accounts"]},
           "year": year, "unit": "million EUR", "regions": regions, "rows": out,
           "note": "Cuentas economicas de la agricultura por region (ELSTAT, publicacion SEL61), a precios basicos, millones de euros. Atica y Grecia son regiones NUTS 2 con su propio NUTS 1; las tres zonas NUTS 1 (Islas del Egeo y Creta, Grecia del Norte, Grecia Central) son la suma de sus NUTS 2."}
    return doc
def do_accounts(outdir, local):
    doc = parse_accounts(fetch("regional", local))
    log("cuenta regional", doc["year"], len(doc["rows"]), "lineas")
    write(outdir, "accounts.json", doc)
def write(out, name, doc):
    out.mkdir(parents=True, exist_ok=True)
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
    (out / name).write_text(s, encoding="utf-8"); log("escrito", name, len(s) // 1024, "KB")

# ---------------------------------------------------------------- cultivos y ganaderia por region y unidad regional
PUB = {"crops": "https://www.statistics.gr/en/statistics/-/publication/SPG06/-", "livestock": "https://www.statistics.gr/en/statistics/-/publication/SPK33/-"}
# tabla -> (publicacion, prefijo del enlace). Los ficheros cambian de documentID cada año: se resuelven por el texto del enlace.
RTABLES = {"t01": ("crops", r"^01\."), "t2a": ("crops", r"^02a\."), "t2c": ("crops", r"^02c\."), "t5b": ("crops", r"^05b\."), "t07": ("crops", r"^07\."),
           "l02": ("livestock", r"^02\."), "l03": ("livestock", r"^03\."), "l7a": ("livestock", r"^07a\.")}
# indicador -> (tabla, [cabeceras de area/cabezas], [cabeceras de produccion], etiqueta). Cabecera = ruta normalizada que ACABA asi; debe ser unica.
RCROPS = {
    "wheat_common": ("t2a", ["Wheat | Common | 1"], ["Wheat | Common | 2"], "Common wheat"),
    "wheat_durum": ("t2a", ["Wheat | Durum | 1"], ["Wheat | Durum | 2"], "Durum wheat"),
    "barley": ("t2a", ["Barley | 1"], ["Barley | 2"], "Barley"),
    "oats": ("t2a", ["Oats | 1"], ["Oats | 2"], "Oats"),
    "maize": ("t2a", ["Maize | without intercropping | 1"], ["Maize | without intercropping | 2"], "Maize"),
    "rice": ("t2a", ["Rice | 1"], ["Rice | 2"], "Rice"),
    "cotton": ("t2c", ["Cotton | irrigated | 1", "Cotton | non-irrigated | 1"], ["Cotton | irrigated", "Cotton | non-irrigated"], "Cotton"),
    "sunflower": ("t2c", ["Sunflower | 1"], ["Sunflower | 2"], "Sunflower"),
    "soya": ("t2c", ["Soya seed | 1"], ["Soya seed | 2"], "Soya"),
    "rapeseed": ("t2c", ["Rapeseed | 1"], ["Rapeseed | 2"], "Rapeseed"),
    "sugarbeet": ("t2c", ["Sugarbeets | 1"], ["Sugarbeets | 2"], "Sugar beet"),
}
RTREES = {"orange": "Orange trees | 5", "mandarin": "Mandarin trees | 5", "lemon": "Lemon trees | 5", "peach": "Peach - Nectarine trees | 5", "apple": "Apple trees | 5",
          "kiwi": "Kiwi trees | 5", "almond": "Almond trees | 5", "walnut": "Walnut trees | 5", "cherry": "Cherry trees | 5", "pistachio": "Pistachio trees | 5"}
RLIVE = {  # clave -> (tabla, cabecera, unidad, etiqueta)
    "cattle": ("l02", "General total", "head", "Cattle and buffaloes"), "dairy_cows": ("l02", "Cows for milk production", "head", "Dairy cows"),
    "sheep": ("l03", "Sheep | Total", "head", "Sheep"), "goats": ("l03", "Goats | Total", "head", "Goats"), "pigs": ("l03", "Pigs | Total", "head", "Pigs"),
    "milk_total": ("l7a", "Grand Total of milk", "t", "Milk, all species"), "milk_cow": ("l7a", "Bovine milk | Total", "t", "Cow and buffalo milk"),
    "milk_sheep": ("l7a", "Sheep milk | Total", "t", "Sheep milk"), "milk_goat": ("l7a", "Goat milk | Total", "t", "Goat milk"),
}
RALIAS = {"Κέας - Κύθνου": "Κύθνου", "Καρπάθου - Ηρωικής Νήσου Κάσου": "Καρπάθου"}   # misma unidad, nombre distinto segun la tabla
def eng(s): return s is not None and re.search(r"[A-Za-z]{3}", str(s)) is not None
def rtable(b):
    """Libro regional de ELSTAT -> dict(title, year, rows=[(el, en, level, {col: valor})], heads={col: cabecera normalizada}). Sin hojas con 'Σύνολο Ελλάδας' falla."""
    import io, openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True)
    for ws in wb.worksheets:
        g = next((r for r in range(1, ws.max_row + 1) if ws.cell(r, 1).value and "Σύνολο Ελλάδας" in str(ws.cell(r, 1).value)), None)
        if g is None: continue
        grid = {(r, c): ws.cell(r, c).value for r in range(1, g) for c in range(1, ws.max_column + 1)}
        for m in ws.merged_cells.ranges:
            if m.min_row < g:
                v = ws.cell(m.min_row, m.min_col).value
                for r in range(m.min_row, min(m.max_row, g - 1) + 1):
                    for c in range(m.min_col, m.max_col + 1): grid[(r, c)] = v
        lab = next((c for c in range(ws.max_column, 0, -1) if ws.cell(g, c).value and eng(ws.cell(g, c).value)), None)
        if lab is None: continue
        heads = {}
        for c in range(2, lab):
            parts = []
            for r in range(1, g):
                v = grid.get((r, c))
                if v is None: continue
                t = clean(v)
                if re.search(r"Table|Areas in|Weight in|Regions|^\d\. ", t) and not re.fullmatch(r"\d+", t): continue
                if (eng(v) or re.fullmatch(r"\d+", t)) and (not parts or parts[-1] != t): parts.append(t)
            heads[c] = " | ".join(parts)
        text = " ".join(clean(ws.cell(r, c).value) for r in range(1, g) for c in range(1, 4) if ws.cell(r, c).value)
        ym = re.findall(r"\b(20\d\d)\b", text)
        rows = []
        for r in range(g, ws.max_row + 1):
            el = ws.cell(r, 1).value; en = ws.cell(r, lab).value
            if not el or not en: continue
            ele = clean(el).rstrip(".").strip(); ele = RALIAS.get(ele, ele)
            if r == g: level = 0
            elif ele.startswith("Περιφέρεια"): level = 1
            elif str(el).startswith(" "): level = 2
            else: continue
            vals = {}
            for c in range(2, lab):
                x = ws.cell(r, c).value
                vals[c] = float(x) if isinstance(x, (int, float)) and not isinstance(x, bool) else None
            rows.append((ele, clean(en), level, vals))
        return {"year": int(ym[0]) if ym else None, "heads": heads, "rows": rows, "text": text, "sheet": ws}
    raise RuntimeError("tabla regional sin fila 'Σύνολο Ελλάδας'")
def find_col(heads, suffix):
    hit = [c for c, h in heads.items() if h == suffix or h.endswith(" | " + suffix)]
    if len(hit) != 1: raise RuntimeError("cabecera %r: %d coincidencias" % (suffix, len(hit)))
    return hit[0]
def link_table(pub_html, rx):
    """Enlace de descarga (.xlsx) de la tabla cuyo texto empieza por rx en la pagina de la publicacion."""
    import html as H
    out = []
    for m in re.finditer(r'<a[^>]*href="([^"]*documentID=\d+[^"]*)"[^>]*>(.*?)</a>', pub_html, re.S):
        t = clean(H.unescape(re.sub(r"<[^>]+>", "", m.group(2))))
        if re.search(rx, t, re.I): out.append(H.unescape(m.group(1)))
    if len(out) != 1: raise RuntimeError("enlace %s: %d coincidencias" % (rx, len(out)))
    u = out[0]
    u = u if u.startswith("http") else "https://www.statistics.gr" + u
    return u.replace("statistics.gr:443/", "statistics.gr/", 1)      # el proxy de salida no resuelve el host con puerto explicito
def load_rtables(local):
    pages = {}; tabs = {}
    for k, (pub, rx) in RTABLES.items():
        if local:
            p = Path(local) / (k + ".xlsx")
            if not p.exists(): raise RuntimeError("falta " + k + ".xlsx en " + str(local))
            b = p.read_bytes()
        else:
            if pub not in pages: pages[pub] = http(PUB[pub]).decode("utf-8", "ignore")
            b = http(link_table(pages[pub], rx))
            if b[:2] != b"PK": raise RuntimeError(k + ": no es un .xlsx")
        tabs[k] = rtable(b)
    return tabs
def aligned(tabs):
    """Lista de areas de referencia (Grecia, regiones y unidades) de la tabla de cereales; el resto se alinea por nombre griego."""
    ref = tabs["t2a"]["rows"]
    areas = []; reg = None
    for el, en, lv, _ in ref:
        if lv == 0: aid = "EL"
        elif lv == 1: aid = "R%02d" % (sum(1 for a in areas if a["level"] == 1) + 1); reg = aid
        else: aid = "U%03d" % (sum(1 for a in areas if a["level"] == 2) + 1)
        areas.append({"id": aid, "el": el, "en": re.sub(r"^Region of ", "", en), "level": lv, "parent": None if lv == 0 else ("EL" if lv == 1 else reg)})
    return areas
def series(tab, areas, cols):
    by = {}
    for el, en, lv, vals in tab["rows"]: by[el] = vals
    miss = [a["el"] for a in areas if a["level"] < 2 and a["el"] not in by]
    if miss: raise RuntimeError("faltan regiones en la tabla: " + ", ".join(miss[:4]))
    out = []
    for a in areas:
        if a["el"] not in by: out.append(None); continue      # unidad que esa tabla no desglosa
        vs = [by[a["el"]][c] for c in cols]
        out.append(None if all(v is None for v in vs) else sum(v or 0 for v in vs))
    return out
def check_sums(name, areas, v, tol=0.015):
    """Regiones suman Grecia y unidades suman su region (tolerancia relativa tol; abs 3 por redondeo). Devuelve lista de desviaciones."""
    bad = []; ix = {a["id"]: k for k, a in enumerate(areas)}
    def cmp(label, tot, parts):
        if tot is None: return
        s = sum(x or 0 for x in parts)
        if abs(s - tot) > max(3, tol * abs(tot)): bad.append("%s %s: suma %.1f, total %.1f" % (name, label, s, tot))
    cmp("EL", v[0], [v[k] for k, a in enumerate(areas) if a["level"] == 1])
    for a in areas:
        if a["level"] == 1:
            ch = [v[k] for k, b in enumerate(areas) if b["parent"] == a["id"]]
            if any(x is not None for x in ch): cmp(a["en"], v[ix[a["id"]]], ch)   # tablas sin desglose provincial: no se comprueba
    return bad
def do_regions(outdir, local):
    tabs = load_rtables(local)
    years = {k: t["year"] for k, t in tabs.items()}
    ys = {y for y in years.values() if y}
    if len(ys) != 1: raise RuntimeError("tablas de años distintos: %s" % years)
    year = ys.pop()
    for k, t in tabs.items():
        if not t["year"]: raise RuntimeError(k + ": sin año")
    areas = aligned(tabs); nreg = sum(1 for a in areas if a["level"] == 1); nuni = sum(1 for a in areas if a["level"] == 2)
    if nreg != 13 or nuni < 70 or nuni > 80: raise RuntimeError("estructura inesperada: %d regiones, %d unidades" % (nreg, nuni))
    crops = {}; live = {}; warn = []
    for key, (tk, ac, pc, lab) in RCROPS.items():
        t = tabs[tk]; area = series(t, areas, [find_col(t["heads"], h) for h in ac])
        prod = series(t, areas, [find_col(t["heads"], h) for h in pc])
        area = [None if x is None else round(x / 10.0, 1) for x in area]      # estremas -> ha
        prod = [None if x is None else round(x, 1) for x in prod]
        crops[key] = {"label": lab, "area": area, "prod": prod}
        for nm, v in (("area", area), ("prod", prod)): warn += check_sums(key + "." + nm, areas, v)
        if not (area[0] and prod[0]): raise RuntimeError(key + ": sin total nacional")
    t = tabs["t5b"]
    for key, h in RTREES.items():
        prod = [None if x is None else round(x, 1) for x in series(t, areas, [find_col(t["heads"], h)])]
        crops["tree_" + key] = {"label": key.capitalize(), "area": None, "prod": prod}
        warn += check_sums("tree_" + key, areas, prod)
        if not prod[0]: raise RuntimeError(key + ": sin total nacional")
    # aceite de oliva (tabla 7: cabecera propia, columna 'Olive oil')
    t7 = tabs["t07"]; ws = t7["sheet"]; col = None
    for r in range(1, 12):
        for c in range(2, 6):
            if clean(ws.cell(r, c).value or "").lower() == "olive oil": col = c
    if not col: raise RuntimeError("tabla 7 sin columna Olive oil")
    crops["olive_oil"] = {"label": "Olive oil", "area": None, "prod": [None if x is None else round(x, 1) for x in series(t7, areas, [col])]}
    warn += check_sums("olive_oil", areas, crops["olive_oil"]["prod"])
    for key, (tk, h, unit, lab) in RLIVE.items():
        t = tabs[tk]; v = [None if x is None else round(x, 1) for x in series(t, areas, [find_col(t["heads"], h)])]
        live[key] = {"label": lab, "unit": unit, "v": v}; warn += check_sums(key, areas, v)
        if not v[0]: raise RuntimeError(key + ": sin total nacional")
    for w in warn: log("aviso", w)
    if len(warn) > 6: raise RuntimeError("demasiadas desviaciones de suma (%d): %s" % (len(warn), warn[0]))
    # historico: se conservan los años ya publicados
    prev = {}
    f = outdir / "regions.json"
    if f.exists():
        try: prev = json.loads(f.read_text(encoding="utf-8")).get("years", {})
        except Exception: prev = {}
    snap = {"crops": crops, "livestock": live}
    if prev and str(year) not in prev and max(int(y) for y in prev) > year: raise RuntimeError("el año %d es anterior al ya publicado" % year)
    prev[str(year)] = snap
    doc = {"schemaVersion": 1, "generatedAt": now(), "source": {"id": "elstat", "name": "ELSTAT (Hellenic Statistical Authority)", "url": PUB["crops"], "url2": PUB["livestock"]},
           "year": year, "areas": areas, "years": prev,
           "note": "Encuesta agraria anual (SPG06, cultivos) y encuesta ganadera anual (SPK33) de ELSTAT por region y unidad regional. Superficies en hectareas (ELSTAT publica estremas: 1 ha = 10 estremas), produccion en toneladas, ganado en cabezas a 31 de diciembre, leche en toneladas. Casilla vacia = sin dato (—)."}
    log("regiones", year, len(areas), "areas", len(crops), "cultivos", len(live), "series ganaderas")
    write(outdir, "regions.json", doc)

JOBS = {"prices": do_prices, "accounts": do_accounts, "regions": do_regions}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "el-elstat")); ap.add_argument("--only", default=""); ap.add_argument("--local", default="")
    ap.add_argument("--log", default=str(ROOT / "data" / "el-elstat-log.txt"))
    a = ap.parse_args(); only = [x for x in a.only.split(",") if x] or list(JOBS); fails = 0
    for n in only:
        try: JOBS[n](Path(a.out), a.local or None)
        except Exception as e: fails += 1; log("ERROR", n, str(e)[:240])
    Path(a.log).write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if fails: raise SystemExit("%d de %d conjuntos fallaron: lo que falló no se toca" % (fails, len(only)))
if __name__ == "__main__": main()

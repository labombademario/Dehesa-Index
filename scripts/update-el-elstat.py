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
Uso: python3 scripts/update-el-elstat.py [--only prices,accounts] [--local carpeta con ts01.xls ts04.xls regional.xlsx]"""
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
JOBS = {"prices": do_prices, "accounts": do_accounts}
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

#!/usr/bin/env python3
"""Belgica: seis bloques nuevos de Statbel (ficheros abiertos, CC BY 4.0) -> data/belgium-more/*.json y data/belgium-more-stats.json.

  - ganado.json   : censo agrario de mayo (DBREF-L05 tabla A, 2015-) cabezas de ganado, superficies y explotaciones por region y provincia + avance del ano en curso (L05-PROV-WEB, provisional).
  - cosecha.json  : estimacion definitiva de cosecha (L06): produccion, rendimiento y superficie por cultivo; Belgica 5 anos y regiones.
  - ipc.json      : indice de precios al consumo por grupo de producto (COICOP), mensual desde 2006, base 2025 = 100.
  - pesca.json    : desembarques de la flota belga por especie: cantidad, valor y precio medio de lonja (valor / cantidad), anual y mensual.
  - lacteos.json  : produccion de productos lacteos (leche de consumo, nata, yogur, mantequilla, polvos, quesos), mensual y anual.
  - carne.json    : balances de abastecimiento de carne (produccion, comercio, consumo aparente, autoabastecimiento), anual.

Todo se guarda como lo publica Statbel (solo conversiones exactas de unidad: are -> ha, kg -> t, EUR -> miles de EUR, litros -> miles de litros, 100 kg/ha -> t/ha); un valor vacio o confidencial se omite y nada se estima.
El unico dato derivado es el precio medio de lonja (valor / cantidad), marcado como tal. Cada bloque es independiente: si uno falla se conserva lo publicado y se sigue con los demas.
Formato comun: {schemaVersion, generatedAt, source, edition, tables:[{id, group, label, l, unit, note, series:[{id, label, l, orig, points, provisional}]}]}.
Los Excel de Statbel cambian de nombre cada ano: los ficheros se buscan por patron en la pagina de cada tema."""
import datetime, io, json, re, sys, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import be_more_labels as LB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "belgium-more"
THEME = "https://statbel.fgov.be/en/themes/"
LOG = []
SRC = {"name": "Statbel (Belgian statistical office) - open data", "url": "https://statbel.fgov.be/en/open-data", "license": "CC BY 4.0 (Statbel)"}
FILES = {
    "ganado.json": ("Censo ganadero, superficies y explotaciones", "Cabezas de ganado, superficies de cultivo y número de explotaciones por región y provincia, 2015-2025, más el avance provisional del año en curso (Statbel, encuesta de mayo)"),
    "cosecha.json": ("Cosecha definitiva por cultivo", "Producción, rendimiento y superficie de cada cultivo: Bélgica (5 años) y Flandes, Valonia y Bruselas (Statbel)"),
    "ipc.json": ("Precios al consumo de alimentos (IPC)", "Índice de precios al consumo por grupo de producto alimentario, mensual desde 2006, base 2025 = 100 (Statbel)"),
    "pesca.json": ("Pesca marítima: desembarques y precio de lonja", "Cantidad, valor y precio medio de lonja por especie de la flota belga, anual y mensual (Statbel)"),
    "lacteos.json": ("Productos lácteos elaborados", "Leche de consumo, nata, yogur, mantequilla, leche en polvo y quesos, mensual y anual (Statbel)"),
    "carne.json": ("Balances de abastecimiento de carne", "Producción, comercio exterior, consumo aparente y autoabastecimiento de vacuno, cerdo, aves y otras carnes (Statbel)"),
}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 DehesaIndex"}), timeout=180) as r:
                return r.read()
        except Exception as e:
            last = e
            if i < 2:
                time.sleep(15 * (i + 1))
    raise RuntimeError("%s -> %s" % (u, str(last)[:160]))


def page_files(path, pat):
    """Enlaces de la pagina de un tema de Statbel cuyo texto cumple el patron (sin repetidos, URL absoluta)."""
    h = get(THEME + path).decode("utf-8", "replace")
    out = []
    for x in dict.fromkeys(re.findall(r'href="([^"]+)"', h)):
        if re.search(pat, x):
            out.append(x if x.startswith("http") else "https://statbel.fgov.be" + x)
    return out


def sheets(b):
    out = {}
    if b[:2] == b"PK":
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
        for ws in wb.worksheets:
            out[ws.title] = [list(r) for r in ws.iter_rows(values_only=True)]
    else:
        import xlrd
        wb = xlrd.open_workbook(file_contents=b)
        for sh in wb.sheets():
            out[sh.name] = [sh.row_values(i) for i in range(sh.nrows)]
    return out


def num(v):
    if isinstance(v, bool) or v is None or v in ("", "..", "...", "-", " -", "x"):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(" ", "").replace("\xa0", "")
    if s in ("", "-", "..", "...", "x"):
        return None
    try:
        return float(s.replace(",", "."))
    except ValueError:
        return None


def rnd(v, d=3):
    r = round(v, d)
    return int(r) if r == int(r) else r


def cell(row, j):
    return row[j] if j < len(row) else None


def T(*a):
    return list(a)


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


def fl(l, n):
    return l[n]


# ------------------------------------------------------------ 1. censo agrario
GEO_ORDER = [g[0] for g in LB.GEOS]
GEO_LAB = {g[0]: g[2] for g in LB.GEOS}


def geo_cols(header):
    """{clave de region: indice de columna} a partir de la fila de cabecera de la tabla A."""
    out = {}
    for j, c in enumerate(header):
        t = str(c or "").strip().lower()
        if not t:
            continue
        for key, pre, _ in LB.GEOS:
            if t.startswith(pre) and key not in out:
                out[key] = j
                break
    return out


def parse_tab_a(rows):
    """{codigo: {region: valor}} del Excel DBREF-L05 tabla A, y el factor are -> ha tras comprobar la unidad."""
    hi = next((i for i, r in enumerate(rows) if str(cell(r, 0) or "").strip() == "Codes"), None)
    if hi is None:
        raise RuntimeError("tabla A sin fila de cabecera 'Codes'")
    cols = geo_cols(rows[hi])
    if "be" not in cols or "vl" not in cols or "wa" not in cols:
        raise RuntimeError("tabla A sin columnas de Belgica/regiones: %s" % sorted(cols))
    data = {}
    for r in rows[hi + 1:]:
        c = str(cell(r, 0) or "").strip()
        if not re.match(r"^[A-Z]{1,2}\d{5,6}$", c):
            continue
        d = {k: num(cell(r, j)) for k, j in cols.items()}
        d = {k: v for k, v in d.items() if v is not None}
        if d:
            data[c] = d
    sau = (data.get("C000001") or {}).get("be")
    if sau is None:
        raise RuntimeError("tabla A sin superficie agraria utilizada (C000001)")
    if 1.0e6 <= sau <= 1.7e6:
        scale = 1.0
    elif 1.0e8 <= sau <= 1.7e8:
        scale = 0.01  # el Excel declara las superficies en are (1 ha = 100 are)
    else:
        raise RuntimeError("unidad de superficie no reconocida: SAU de Belgica = %s" % sau)
    return data, scale


def parse_l05(rows):
    """Avance del ano en curso (L05-PROV-WEB): {codigo: {region: valor}}, ano anterior y ano en curso."""
    h0 = rows[0]
    cols = {}
    for j, c in enumerate(h0):
        t = str(c or "").strip().lower()
        for key, pre in (("be", "belgi"), ("vl", "vlaams"), ("wa", "waals")):
            if t.startswith(pre) and key not in cols:
                cols[key] = j
    if "be" not in cols:
        raise RuntimeError("L05 sin columna de Belgica")
    yrs = [str(cell(rows[1], cols["be"])).strip()[:4], str(cell(rows[1], cols["be"] + 1)).strip()[:4]]
    if not all(re.match(r"^\d{4}$", y) for y in yrs):
        raise RuntimeError("L05 sin anos en la cabecera: %s" % yrs)
    prev, cur = {}, {}
    for r in rows[2:]:
        c = str(cell(r, 0) or "").strip()
        if not re.match(r"^[A-Z]{1,2}\d{5,6}$", c):
            continue
        for key, j in cols.items():
            a, b = num(cell(r, j)), num(cell(r, j + 1))
            if a is not None:
                prev.setdefault(c, {})[key] = a
            if b is not None:
                cur.setdefault(c, {})[key] = b
    return int(yrs[0]), int(yrs[1]), prev, cur


def ganado():
    fl_ = page_files("agriculture-fishery/farm-and-horticultural-holdings", r"DBREF-L05-\d{4}-TAB-A")
    by = {}
    for u in fl_:
        m = re.search(r"DBREF-L05-(\d{4})-TAB-A", u)
        if m and (m.group(1) not in by or u.endswith(".xlsx")):
            by[m.group(1)] = u
    if len(by) < 3:
        raise RuntimeError("faltan ficheros del censo agrario (%d)" % len(by))
    years = {}
    for y in sorted(by):
        try:
            sh = sheets(get(by[y]))
            rows = next(r for n, r in sh.items() if len(r) > 100)
            data, sc = parse_tab_a(rows)
            years[int(y)] = (data, sc)
        except Exception as e:
            log("ganado: se omite %s (%s)" % (y, str(e)[:120]))
    if len(years) < 3:
        raise RuntimeError("censo agrario: menos de 3 anos legibles")
    last = max(years)
    log("ganado: anos %s" % sorted(years))
    prov_y, prov = None, {}
    try:
        u = sorted(page_files("agriculture-fishery/farm-and-horticultural-holdings", r"L05-\d{4}-PROV-WEB"))[-1]
        sh = sheets(get(u))
        rows = next(r for n, r in sh.items() if len(r) > 100)
        py, cy, prev, cur = parse_l05(rows)
        if cy > last:
            prov_y, prov = cy, cur
            log("ganado: avance provisional de %d (%s)" % (cy, u.split("/")[-1]))
    except Exception as e:
        log("ganado: sin avance provisional (%s)" % str(e)[:120])

    def series(code, lab_fn, conv):
        out = []
        for g in GEO_ORDER:
            pts = {}
            for y, (data, sc) in years.items():
                v = (data.get(code) or {}).get(g)
                if v is not None:
                    pts[str(y)] = rnd(v * (sc if conv else 1), 2)
            if prov_y and g in (prov.get(code) or {}):
                pts[str(prov_y)] = rnd(prov[code][g], 2)
            out.append(mk_series("be-agr-%s-%s" % (code.lower(), g), lab_fn(g), pts, [str(prov_y)] if prov_y else None))
        return out
    tabs = []
    gl = lambda lab: (lambda g: [lab[0] + " · " + GEO_LAB[g][0], lab[1] + " · " + GEO_LAB[g][1], lab[2] + " · " + GEO_LAB[g][2], lab[3] + " · " + GEO_LAB[g][3]])
    note_h = "Número de cabezas en la encuesta de mayo (censo agrario). El último año es un avance provisional de Statbel cuando ya hay datos del año en curso."
    for code, lab in LB.LIVESTOCK.items():
        tabs.append(mk_table("ganado-" + code.lower(), "ganado", lab, "cabezas", note_h, series(code, gl(lab), False)))
    note_a = "Superficie en hectáreas (el Excel de Statbel las da en áreas: 1 ha = 100 áreas). El último año es un avance provisional cuando ya hay datos del año en curso."
    for code, lab in LB.AREAS.items():
        tabs.append(mk_table("sup-" + code.lower(), "superficies", lab, "ha", note_a, series(code, gl(lab), True)))
    pts = lambda code: {str(y): d[code]["be"] for y, (d, sc) in years.items() if (d.get(code) or {}).get("be") is not None}
    tabs.append(mk_table("explotaciones-region", "explotaciones", LB.FARMS["H010000"], "nº", "Explotaciones con producción agraria en la encuesta de mayo.", series("H010000", gl(LB.FARMS["H010000"]), False)))
    sz = [mk_series("be-agr-%s-be" % c.lower(), lab, {k: rnd(v) for k, v in pts(c).items()}) for c, lab in LB.FARM_SIZES.items()]
    tabs.append(mk_table("explotaciones-tamano", "explotaciones", T("Explotaciones por tamaño, Bélgica", "Farms by size, Belgium", "Exploitations par taille, Belgique", "Aziende per dimensione, Belgio"), "nº",
                         "Número de explotaciones por clase de superficie agrícola, Bélgica.", sz))
    tabs = [t for t in tabs if t["series"]]
    if not tabs:
        raise RuntimeError("censo agrario sin series")
    return str(prov_y or last), tabs


# ------------------------------------------------------------ 2. cosecha
def norm_crop(s):
    return re.sub(r"\s+", " ", str(s or "").replace("’", "'").replace("\xa0", " ")).strip().lower()


def crop_rows(rows):
    """[(clave normalizada, fila)] de las filas de cultivo (las de seccion no llevan 'nature de la recolte')."""
    out = []
    for r in rows[6:]:
        if str(cell(r, 0) or "").strip() and str(cell(r, 1) or "").strip() and norm_crop(cell(r, 0)) in LB.CROPS:
            out.append((norm_crop(cell(r, 0)), r))
    return out


def cosecha():
    fr = {}
    for u in page_files("agriculture-fishery/farm-and-horticultural-holdings", r"L06-\d{4}-DEF-RESULT-TAB-FR"):
        m = re.search(r"L06-(\d{4})-", u)
        if m:
            fr[int(m.group(1))] = u
    if not fr:
        raise RuntimeError("sin fichero de cosecha L06 en frances")
    ys = sorted(fr)[-2:]
    docs = {}
    for y in ys:
        try:
            docs[y] = sheets(get(fr[y]))
        except Exception as e:
            log("cosecha: se omite %d (%s)" % (y, str(e)[:100]))
    if not docs:
        raise RuntimeError("cosecha sin ficheros legibles")
    last = max(docs)
    be = docs[last]
    # guardas de unidad: superficie en ha, rendimiento en 100 kg/ha (q/ha) y produccion en toneladas
    hdr = " ".join(str(c) for c in be["BELGIQUE"][5])
    if not (re.search(r"\bha\b", hdr) and "100 kg" in hdr and "tonnes" in hdr.lower()):
        raise RuntimeError("unidades de la cosecha no reconocidas: %s" % re.sub(r"\s+", " ", hdr)[:120])
    prod, yld, area = {}, {}, {}
    ev = be["EVOLUTION DES PRODUCTIONS"]
    yr_prod = [int(float(c)) for c in ev[5][2:] if num(c)]
    for k, r in crop_rows(ev):
        for j, y in enumerate(yr_prod):
            v = num(cell(r, 2 + j))
            if v is not None:
                prod.setdefault(k, {})[str(y)] = rnd(v)
    ey = be["EVOLUTIONS DES RENDEMENTS"]
    yr_y = [int(float(c)) for c in ey[5][2:] if num(c)]
    for k, r in crop_rows(ey):
        for j, y in enumerate(yr_y):
            v = num(cell(r, 2 + j))
            if v is not None:
                yld.setdefault(k, {})[str(y)] = rnd(v / 10, 3)
    reg = {}
    for y, sh in docs.items():
        for k, r in crop_rows(sh["BELGIQUE"]):
            v = num(cell(r, 2))
            if v is not None:
                area.setdefault(k, {})[str(y)] = rnd(v)
        rr = sh["REGIONS"]
        top = rr[4]
        starts = {}
        for j, c in enumerate(top):
            t = str(c or "").lower()
            for key in LB.CROP_GEO:
                if key in t:
                    starts[key] = j
        for k, r in crop_rows(rr):
            for g, j in starts.items():
                a, q, p = num(cell(r, j)), num(cell(r, j + 1)), num(cell(r, j + 2))
                for name, v, f in (("area", a, 1), ("yield", q, 0.1), ("prod", p, 1)):
                    if v is not None:
                        reg.setdefault((name, k, g), {})[str(y)] = rnd(v * f, 3)

    def ser(d, prefix, geo=None, gname=None):
        out = []
        for k, lab in LB.CROPS.items():
            key = (geo, k) if geo else k
            pts = d.get(key)
            if pts:
                if gname:
                    lb = [lab[i] + " · " + gname[i] for i in range(4)]
                else:
                    lb = lab
                out.append(mk_series("be-cosecha-%s-%s" % (prefix, re.sub(r"[^a-z0-9]+", "-", k).strip("-") + ("-" + geo if geo else "")), lb, pts, None, k))
        return out
    tabs = [
        mk_table("produccion", "cosecha", T("Producción por cultivo, Bélgica", "Production by crop, Belgium", "Production par culture, Belgique", "Produzione per coltura, Belgio"), "t", "Estimación definitiva de la cosecha (toneladas), Bélgica, últimos 5 años.", ser(prod, "prod")),
        mk_table("rendimiento", "cosecha", T("Rendimiento por cultivo, Bélgica", "Yield by crop, Belgium", "Rendement par culture, Belgique", "Resa per coltura, Belgio"), "t/ha",
                 "Rendimiento medio en toneladas por hectárea (Statbel lo da en quintales por hectárea: 10 q/ha = 1 t/ha), Bélgica, últimos 5 años.", ser(yld, "yield")),
        mk_table("superficie", "cosecha", T("Superficie cosechada por cultivo, Bélgica", "Harvested area by crop, Belgium", "Superficie récoltée par culture, Belgique", "Superficie raccolta per coltura, Belgio"), "ha", "Superficie cosechada (hectáreas), Bélgica.", ser(area, "area")),
    ]
    for geo, gname in LB.CROP_GEO.items():
        d_p = {(g, k): v for (n, k, g), v in reg.items() if n == "prod"}
        d_y = {(g, k): v for (n, k, g), v in reg.items() if n == "yield"}
        tabs.append(mk_table("produccion-" + geo, "cosecha-region", T("Producción por cultivo, " + gname[0], "Production by crop, " + gname[1], "Production par culture, " + gname[2], "Produzione per coltura, " + gname[3]), "t", "Estimación definitiva (toneladas).", ser(d_p, "prod", geo, gname)))
        tabs.append(mk_table("rendimiento-" + geo, "cosecha-region", T("Rendimiento por cultivo, " + gname[0], "Yield by crop, " + gname[1], "Rendement par culture, " + gname[2], "Resa per coltura, " + gname[3]), "t/ha", "Rendimiento medio (t/ha).", ser(d_y, "yield", geo, gname)))
    tabs = [t for t in tabs if t["series"]]
    if not tabs:
        raise RuntimeError("cosecha sin series")
    return str(last), tabs


# ------------------------------------------------------------ 3. IPC alimentos
def ipc():
    u = next((x for x in page_files("consumer-prices/consumer-price-index", r"Indexen%20per%20productgroep") if x.endswith(".xlsx")), None)
    if not u:
        raise RuntimeError("no se encontro el Excel de indices por grupo de producto")
    rows = list(sheets(get(u)).values())[0]
    h = rows[0]
    cols = [(j, str(c)[:7]) for j, c in enumerate(h) if re.match(r"^\d{4}-\d{2}", str(c))]
    if len(cols) < 24:
        raise RuntimeError("IPC sin columnas mensuales")
    ser = []
    for r in rows[1:]:
        c = str(cell(r, 0) or "").strip()
        if c not in LB.CPI:
            continue
        pts = {k: rnd(num(cell(r, j)), 3) for j, k in cols if num(cell(r, j)) is not None}
        lab = LB.CPI[c]
        fr = re.sub(r"\s+", " ", str(cell(r, 2) or "")).strip() or lab[2]
        nl = re.sub(r"\s+", " ", str(cell(r, 3) or "")).strip()
        ser.append(mk_series("be-cpi-" + re.sub(r"[^a-z0-9]+", "-", c.lower()).strip("-"), [lab[0], lab[1], fr, lab[3]], pts, None, nl or None))
    tab = mk_table("ipc-alimentos", "ipc", T("IPC por grupo de producto", "CPI by product group", "IPC par groupe de produits", "IPC per gruppo di prodotti"), "índice 2025=100",
                   "Índice de precios al consumo de Bélgica por grupo COICOP, base 2025 = 100, mensual desde 2006.", ser)
    if len(tab["series"]) < 10:
        raise RuntimeError("IPC con solo %d series" % len(tab["series"]))
    return latest_period([tab]), [tab]


# ------------------------------------------------------------ 4. pesca
def fish_sheet(rows):
    """{nombre: (kg, EUR)} de una hoja de desembarques (columnas 'Total'); los grupos van con la clave del grupo."""
    h = " ".join(str(c) for c in rows[4][:3]).lower()
    if "quantity" not in h or "value" not in h:
        raise RuntimeError("hoja de pesca sin columnas de cantidad y valor")
    out = {}
    group = None
    for r in rows[5:]:
        name = str(cell(r, 0) or "").strip().rstrip(":").strip()
        if not name or name.startswith("*"):
            continue
        q, v = num(cell(r, 1)), num(cell(r, 2))
        if name in ("Demersal fishes", "Pelagic fishes", "Crustaceans and molluscs"):
            group = name
            continue
        if name == "Overall total":
            out[name] = (q, v)
        elif name == "Total" and group:
            out[group] = (q, v)
        elif name in LB.FISH and group and name != "Other species":
            out[name] = (q, v)
    return out


def fish_tables(period_rows, freq):
    qty, val, pri = {}, {}, {}
    # Control de unidades: las hojas anuales de Statbel anteriores a 2023 rotulan el valor «in EUR», pero la cifra es ~100 veces menor que la real
    # (p. ej. 2022: 795.190 EUR por 13.217 t, 0,06 EUR/kg frente a ~6 EUR/kg desde 2023). No se puede corregir con un factor verificado:
    # se descartan valor y precio de los periodos cuyo precio medio total es inferior a 1 EUR/kg; la cantidad se mantiene.
    bad = set()
    for p, d in period_rows.items():
        q, v = d.get("Overall total", (None, None))
        if q and v is not None and v / q < 1.0:
            bad.add(p)
    if bad:
        log("pesca %s: valor y precio descartados por unidad incoherente en la fuente: %s" % (freq, sorted(bad)))
    for p, d in period_rows.items():
        for k, (q, v) in d.items():
            if q is not None:
                qty.setdefault(k, {})[p] = rnd(q / 1000, 3)
            if v is not None and p not in bad:
                val.setdefault(k, {})[p] = rnd(v / 1000, 3)
            if q and v is not None and q > 0 and p not in bad:
                pri.setdefault(k, {})[p] = rnd(v / q, 3)
    fx = "anual" if freq == "y" else "mensual"
    en = "yearly" if freq == "y" else "monthly"
    fr = "annuel" if freq == "y" else "mensuel"
    it = "annuale" if freq == "y" else "mensile"

    def ser(d, pre):
        return [mk_series("be-pesca-%s-%s-%s" % (pre, freq, re.sub(r"[^a-z0-9]+", "-", k.lower()).strip("-")), LB.FISH[k], d[k], None, k) for k in LB.FISH if k in d]
    return [
        mk_table("pesca-cantidad-" + freq, "pesca", T("Desembarques en cantidad, " + fx, "Landings by quantity, " + en, "Débarquements en quantité, " + fr, "Sbarchi in quantità, " + it), "t", "Toneladas de pescado desembarcadas por la flota belga en todos los puertos (Statbel da kg).", ser(qty, "qty")),
        mk_table("pesca-valor-" + freq, "pesca", T("Desembarques en valor, " + fx, "Landings by value, " + en, "Débarquements en valeur, " + fr, "Sbarchi in valore, " + it), "miles de €", "Valor de primera venta en miles de euros (Statbel da euros).", ser(val, "val")),
        mk_table("pesca-precio-" + freq, "pesca", T("Precio medio de lonja, " + fx, "Average auction price, " + en, "Prix moyen à la criée, " + fr, "Prezzo medio all’asta, " + it), "€/kg",
                 "Dato derivado: valor dividido por cantidad desembarcada; no es una cotización publicada por Statbel.", ser(pri, "price")),
    ]


def pesca():
    yl = [u for u in page_files("agriculture-fishery/sea-fishing", r"fishkind_yearlyresults_en\.xls") if "foreign" not in u.lower()]
    if not yl:
        raise RuntimeError("sin fichero anual de pesca")
    yrs = {}
    for n, rows in sheets(get(yl[0])).items():
        if re.match(r"^\d{4}$", n):
            try:
                yrs[n] = fish_sheet(rows)
            except Exception as e:
                log("pesca anual %s omitido (%s)" % (n, str(e)[:80]))
    tabs = fish_tables({k: v for k, v in yrs.items() if len(v) > 5}, "y")
    mon = {}
    mf = {}
    for u in page_files("agriculture-fishery/sea-fishing", r"(?i)fishkind_monthlyresults\d{4}_en\.xls"):
        m = re.search(r"monthlyresults(\d{4})_en", u, re.I)
        if m:
            mf[int(m.group(1))] = u
    for y, u in sorted(mf.items()):
        try:
            for n, rows in sheets(get(u)).items():
                if re.match(r"^\d{6}$", n):
                    d = fish_sheet(rows)
                    if len(d) > 5:
                        mon["%s-%s" % (n[:4], n[4:])] = d
        except Exception as e:
            log("pesca mensual %d omitido (%s)" % (y, str(e)[:80]))
    if len(mon) >= 12:
        tabs += fish_tables(mon, "m")
    tabs = [t for t in tabs if t["series"]]
    log("pesca: %d anos, %d meses" % (len(yrs), len(mon)))
    if not tabs:
        raise RuntimeError("pesca sin series")
    return latest_period(tabs), tabs


# ------------------------------------------------------------ 5. lacteos
def dairy_sheet(rows):
    """{clave: (valor, unidad)} de una hoja de produccion de lacteos; unidad 'l' o 'kg' segun el encabezado de cada bloque."""
    out = {}
    unit = "l"
    started = False
    pending = None
    for r in rows:
        c0, c1, c2 = (str(cell(r, j) or "").replace("\xa0", " ").strip() for j in range(3))
        c3 = str(cell(r, 3) or "")
        if "(Kg)" in c3:
            unit = "kg"
        elif "(Litre)" in c3 and c0 in ("", "Milk products"):
            unit = "l"
        l0, l1, l2 = c0.lower(), c1.lower(), c2.lower()
        v = num(cell(r, 3))
        key = None
        if pending and l2.startswith("- pasteurised"):
            # hoja anual: el nombre del producto va en una fila y la cifra en la siguiente
            if pending not in out:
                out[pending] = (v, unit)
            pending = None
            continue
        if c0 == "MILK":
            started = True
            key = "milk"
        elif not started:
            continue
        elif l0.startswith("- whole milk") and "whole" not in out:
            key = "whole"
            if v is None:
                pending, key = "whole", None
        elif l0.startswith("- semi-skimmed milk") and "semi" not in out:
            key = "semi"
            if v is None:
                pending, key = "semi", None
        elif l0.startswith("- skimmed milk") and "pasteurised" in l2 and "skim" not in out:
            key = "skim"
        elif l0 == "- skimmed milk" and v is None and "skim" not in out:
            pending = "skim"
        elif l0.startswith("- over 29"):
            key = "cream-hi"
        elif l0.startswith("- below or equal to 29"):
            key = "cream-lo"
        elif l1.startswith("- yoghurt"):
            key = "yoghurt"
        elif l1.startswith("- fermented milk"):
            key = "fermented"
        elif "traditional butter" in l1:
            key = "butter"
        elif l0.startswith("- cream, whole milk"):
            key = "powder-whole"
        elif l0.startswith("- skimmed milk (fat"):
            key = "powder-skim"
        elif l1.startswith("- natural") and "fresh-cheese" not in out:
            key = "fresh-cheese"
        elif l1.startswith("- gouda"):
            key = "gouda"
        elif l1.startswith("- mozzarella") or l2.startswith("- mozzarella"):
            key = "mozzarella"
        elif l0.startswith("processed cheese"):
            key = "processed"
        if key and key not in out:
            out[key] = (v, unit)
    return out


def lacteos():
    mf = {}
    for u in page_files("agriculture-fishery/milk-and-milk-product-statistics", r"(?i)milk_monthlyresults\d{4}b?_en\.xls"):
        m = re.search(r"monthlyresults(\d{4})", u, re.I)
        if m:
            mf[int(m.group(1))] = u
    mon, yrs = {}, {}
    for y, u in sorted(mf.items()):
        if y < 2018:
            continue
        try:
            for n, rows in sheets(get(u)).items():
                if re.match(r"^\d{6}$", n):
                    d = dairy_sheet(rows)
                    if len(d) >= 5:
                        mon["%s-%s" % (n[:4], n[4:])] = d
        except Exception as e:
            log("lacteos mensual %d omitido (%s)" % (y, str(e)[:80]))
    yl = [u for u in page_files("agriculture-fishery/milk-and-milk-product-statistics", r"milk_yearlyresults_en\.xls")]
    if yl:
        try:
            for n, rows in sheets(get(yl[0])).items():
                if re.match(r"^\d{4}$", n):
                    d = dairy_sheet(rows)
                    if len(d) >= 5:
                        yrs[n] = d
        except Exception as e:
            log("lacteos anual omitido (%s)" % str(e)[:80])
    log("lacteos: %d meses, %d anos" % (len(mon), len(yrs)))
    tabs = []
    for freq, src, fx in (("m", mon, "mensual"), ("y", yrs, "anual")):
        if len(src) < 3:
            continue
        en = "monthly" if freq == "m" else "yearly"
        fr = "mensuel" if freq == "m" else "annuel"
        it = "mensile" if freq == "m" else "annuale"
        for unit, uname, div, nm in (("l", "miles de litros", 1000, ("Leche, nata y yogur", "Milk, cream and yoghurt", "Lait, crème et yaourt", "Latte, panna e yogurt")),
                                     ("kg", "t", 1000, ("Mantequilla, leche en polvo y queso", "Butter, milk powder and cheese", "Beurre, lait en poudre et fromage", "Burro, latte in polvere e formaggio"))):
            ser = []
            for k, lab in LB.DAIRY.items():
                pts = {p: rnd(d[k][0] / div, 3) for p, d in src.items() if k in d and d[k][0] is not None and d[k][1] == unit}
                if pts:
                    ser.append(mk_series("be-lacteos-%s-%s" % (freq, k), lab, pts))
            tabs.append(mk_table("lacteos-%s-%s" % (freq, unit), "lacteos", T("%s, %s" % (nm[0], fx), "%s, %s" % (nm[1], en), "%s, %s" % (nm[2], fr), "%s, %s" % (nm[3], it)), uname,
                                 "Producción de las industrias lácteas belgas (Statbel da litros o kg).", ser))
    tabs = [t for t in tabs if t["series"]]
    if not tabs:
        raise RuntimeError("lacteos sin series")
    return latest_period(tabs), tabs


# ------------------------------------------------------------ 6. carne
def carne():
    u = next(iter(page_files("agriculture-fishery/supply-balance-sheets-meat", r"delmeat_statbel_en\.xls")), None)
    if not u:
        raise RuntimeError("sin balance de carne")
    rows = list(sheets(get(u)).values())[0]
    if "tonnes of carcass" not in str(rows[0][0]).lower():
        raise RuntimeError("unidad del balance de carne no reconocida: %s" % str(rows[0][0])[:80])
    cur = None
    years = None
    data = {}
    for r in rows[1:]:
        name = str(cell(r, 0) or "").strip()
        y1 = num(cell(r, 1))
        if name and y1 is not None and 1900 <= y1 <= 2100 and float(y1).is_integer() and not str(cell(r, 1)).startswith("0"):
            cur = LB.MEAT_BLOCKS.get(name)
            years = [int(num(c)) for c in r[1:] if num(c) is not None and 1900 <= num(c) <= 2100]
            continue
        if not cur or not name:
            continue
        v = LB.MEAT_VARS.get(name.replace("%  ", "% ").strip())
        if not v:
            continue
        for j, y in enumerate(years or []):
            x = num(cell(r, 1 + j))
            if x is not None:
                data.setdefault((v[0], cur[0]), {})[str(y)] = rnd(x, 3)
    tabs = []
    for vk, (vid, vlab, unit) in ((n, (v[0], v[1], v[2])) for n, v in LB.MEAT_VARS.items()):
        ser = [mk_series("be-carne-%s-%s" % (vid, b[0]), b[1], data[(vid, b[0])]) for b in LB.MEAT_BLOCKS.values() if (vid, b[0]) in data]
        tabs.append(mk_table("carne-" + vid, "carne", vlab, unit, "Balance de abastecimiento de carne de Bélgica; las cifras absolutas están en toneladas de peso en canal.", ser))
    tabs = [t for t in tabs if t["series"]]
    if not tabs:
        raise RuntimeError("carne sin series")
    return latest_period(tabs), tabs


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
        if freq == "annual":
            ch = round((p[-1][1] / p[-2][1] - 1) * 100, 2) if p[-2][1] else None
        else:
            prev = next((v for k, v in p if k == "%d-%s" % (int(p[-1][0][:4]) - 1, p[-1][0][5:])), None)
            ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": freq, "latestPeriod": p[-1][0], "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "belgium-more"})

    g = docs.get("ganado.json")
    for code, grp, unit, geos in (("A100000", "livestock", "cabezas", ("be", "vl", "wa")), ("A132210", "livestock", "cabezas", ("be", "vl", "wa")), ("A132220", "livestock", "cabezas", ("be",)), ("A200000", "livestock", "cabezas", ("be", "vl", "wa")),
                                  ("A242000", "livestock", "cabezas", ("be",)), ("A600000", "livestock", "cabezas", ("be",)), ("A601100", "livestock", "cabezas", ("be",)), ("A602000", "livestock", "cabezas", ("be",))):
        for geo in geos:
            s, tb = one(g, "ganado-" + code.lower(), "be-agr-%s-%s" % (code.lower(), geo))
            if s:
                add("be-ganado-%s-%s" % (code.lower(), geo), grp, "%s, %s (Statbel)" % (LB.LIVESTOCK[code][0], LB.GEOS[GEO_ORDER.index(geo)][2][0]), unit, s, "annual", 6)
    for code in ("C000001", "C100000", "C110000", "C110110", "C110600", "C120100", "C130000", "C150300", "C300000", "C170000", "C400000", "C220000"):
        s, tb = one(g, "sup-" + code.lower(), "be-agr-%s-be" % code.lower())
        if s:
            add("be-sup-%s" % code.lower(), "crops", "Superficie: %s, Bélgica (Statbel)" % LB.AREAS[code][0], "ha", s, "annual", 6)
    s, tb = one(g, "explotaciones-region", "be-agr-h010000-be")
    if s:
        add("be-explotaciones", "structure", "Explotaciones con producción agraria, Bélgica (Statbel)", "nº", s, "annual", 6)
    c = docs.get("cosecha.json")
    for k in ("froment d'hiver", "orge d'hiver", "maïs grain", "betteraves sucrières", "pommes de terre de conservation", "colza et navette"):
        sl = re.sub(r"[^a-z0-9]+", "-", k).strip("-")
        s, tb = one(c, "produccion", "be-cosecha-prod-" + sl)
        if s:
            add("be-cosecha-prod-" + sl, "production", "Producción de %s, Bélgica (Statbel)" % LB.CROPS[k][0].lower(), "t", s, "annual", 4)
    for k in ("froment d'hiver", "pommes de terre de conservation", "betteraves sucrières"):
        sl = re.sub(r"[^a-z0-9]+", "-", k).strip("-")
        s, tb = one(c, "rendimiento", "be-cosecha-yield-" + sl)
        if s:
            add("be-cosecha-yield-" + sl, "crops", "Rendimiento de %s, Bélgica (Statbel)" % LB.CROPS[k][0].lower(), "t/ha", s, "annual", 4)
    i = docs.get("ipc.json")
    for code, lab in LB.CPI.items():
        sid = "be-cpi-" + re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-")
        s, tb = one(i, "ipc-alimentos", sid)
        if s:
            add(sid, "consumption", "IPC, %s, Bélgica (Statbel)" % lab[0].lower(), "índice 2025=100", s, "monthly", 24)
    p = docs.get("pesca.json")
    for freq, fq, mp in (("y", "annual", 8), ("m", "monthly", 24)):
        for tid, pre, nm, unit in (("pesca-cantidad", "qty", "Desembarques", "t"), ("pesca-valor", "val", "Valor de los desembarques", "miles de €")):
            s, tb = one(p, "%s-%s" % (tid, freq), "be-pesca-%s-%s-overall-total" % (pre, freq))
            if s:
                add("be-pesca-%s-%s-total" % (pre, freq), "production", "%s totales de pescado, Bélgica (Statbel)" % nm, unit, s, fq, mp)
        for k in ("Sole", "Plaice", "Turbot", "Ray", "Anglerfish"):
            sl = k.lower()
            s, tb = one(p, "pesca-precio-" + freq, "be-pesca-price-%s-%s" % (freq, sl))
            if s:
                add("be-pesca-price-%s-%s" % (freq, sl), "prices", "Precio medio de lonja de %s, Bélgica (Statbel, valor/cantidad)" % LB.FISH[k][0].lower(), "€/kg", s, fq, mp)
    d = docs.get("lacteos.json")
    for freq, fq, mp in (("m", "monthly", 24), ("y", "annual", 6)):
        for tid, key in (("lacteos-%s-l" % freq, "milk"), ("lacteos-%s-l" % freq, "yoghurt"), ("lacteos-%s-kg" % freq, "butter"), ("lacteos-%s-kg" % freq, "powder-skim"), ("lacteos-%s-kg" % freq, "gouda"), ("lacteos-%s-kg" % freq, "mozzarella")):
            s, tb = one(d, tid, "be-lacteos-%s-%s" % (freq, key))
            if s:
                add("be-lacteos-%s-%s" % (freq, key), "production", "Producción de %s, Bélgica (Statbel)" % LB.DAIRY[key][0].lower(), tb["unit"], s, fq, mp)
    m = docs.get("carne.json")
    for vid, nm, unit in (("production", "Producción bruta de carne", "t"), ("consumption", "Consumo aparente de carne", "t"), ("selfsuff", "Autoabastecimiento de carne", "%")):
        for b in ("beef", "pork", "poultry", "total"):
            s, tb = one(m, "carne-" + vid, "be-carne-%s-%s" % (vid, b))
            if s:
                bl = next(x[1][0] for x in LB.MEAT_BLOCKS.values() if x[0] == b)
                add("be-carne-%s-%s" % (vid, b), "production" if vid == "production" else "consumption", "%s: %s, Bélgica (Statbel)" % (nm, bl.lower()), unit, s, "annual", 6)
    # mismo titulo con frecuencia distinta (anual y mensual): se distingue en el titulo para que el buscador y las fichas no muestren dos filas iguales
    cnt = {}
    for o in out: cnt[o["label"]] = cnt.get(o["label"], 0) + 1
    for o in out:
        if cnt[o["label"]] > 1: o["label"] += " - " + {"annual": "anual", "monthly": "mensual"}.get(o["frequency"], o["frequency"])
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"BE": {"name": "Belgium", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    jobs = [("ganado", ganado), ("cosecha", cosecha), ("ipc", ipc), ("pesca", pesca), ("lacteos", lacteos), ("carne", carne)]
    for name, fn in jobs:
        try:
            ed, tabs = fn()
            docs[name + ".json"] = doc(tabs, ed, now)
            log("%s: leido (edicion %s, %d tablas, %d series)" % (name, ed, len(tabs), sum(len(t["series"]) for t in tabs)))
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
        (ROOT / "data" / "belgium-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "belgium-more-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["BE"]["series"])))
    (ROOT / "data" / "belgium-more-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Polonia: boletines de precios del ZSRIR (Ministerio de Agricultura, dane.gov.pl, CC BY 4.0) -> data/poland-zsrir/*.json y data/poland-zsrir-stats.json.

Fase 1 (cereales y colza). Cada boletin semanal es un xlsx (lunes-domingo) que el ZSRIR publica los jueves; incluye el historico mensual y el semanal de varios anos.
  - cereales.json : precio de compra de 12 cereales (PLN/t), mensual desde 2006-10, y trigo de consumo semanal desde 2022.
  - colza.json    : precio de compra de la colza (PLN/t), mensual y semanal desde 2022.
Periodos semanales: AAAA-Www (semana ISO, por el domingo en que acaba la semana). Un valor 'nld', '---', '-' o vacio se omite; nada se estima ni se convierte.
Seguridad: el ultimo punto semanal se contrasta con la tabla resumen del propio boletin (misma semana); si no coincide el bloque no se publica y se conserva lo publicado.
Cada bloque es independiente. Formato comun: {schemaVersion, generatedAt, source, edition, tables:[{id, group, label, l, unit, note, series:[{id, label, l, points}]}]}."""
import datetime, io, json, re, sys, time, urllib.request, warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pl_zsrir_labels as LB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "poland-zsrir"
API = "https://api.dane.gov.pl/1.4/datasets/%s/resources?sort=-data_date&per_page=%d"
LOG = []
SRC = {"name": "ZSRIR (Ministerstwo Rolnictwa i Rozwoju Wsi) - boletines de mercado en dane.gov.pl", "url": "https://dane.gov.pl/pl/dataset/546", "license": "CC BY 4.0 (MRiRW, dane.gov.pl)"}
FILES = {
    "cereales.json": ("Cereales: precio de compra", "Precio de compra de 12 cereales (PLN/t), mensual desde 2006 y trigo de consumo semanal desde 2022 (ZSRIR)"),
    "carne.json": ("Carne: precios de compra", "Precio de compra de cerdo (vivo y canal clase E), vacuno en canal y pollo broiler, semanal, y cerdo vivo mensual (ZSRIR)"),
    "lacteos.json": ("Leche, lácteos y huevos: precios", "Leche cruda mensual, mantequilla, leche en polvo y quesos semanales, y huevos para transformación semanales (ZSRIR)"),
    "piensos.json": ("Piensos compuestos: precio de venta", "Precio mensual de venta de piensos para bovino, aves y porcino, 10 años (ZSRIR)"),
    "fruta.json": ("Manzana, zanahoria, tomate y patata: compra del comercio minorista", "Precio semanal de compra de manzanas, zanahoria, tomate y patata por el comercio minorista (ZSRIR); el boletín trae solo un año, la serie se acumula"),
    "azucar.json": ("Azúcar: precios mensuales", "Precio mensual del azúcar blanco: venta al mercado interior y compra de la transformación y del comercio minorista (ZSRIR)"),
    "colza.json": ("Colza: precio de compra", "Precio de compra de la semilla de colza (PLN/t), mensual y semanal desde 2022 (ZSRIR)"),
}
ROMAN = {m: i + 1 for i, m in enumerate("I II III IV V VI VII VIII IX X XI XII".split())}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fetch(url, tries=5, binary=False):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 DehesaIndex"}), timeout=200) as r:
                b = r.read()
                return b if binary else b.decode("utf-8", "replace")
        except Exception as e:
            last = e
            time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[-60:], str(last)[:140]))


def workbook(dataset, tries=4):
    """Descarga el boletin mas reciente que se pueda abrir. Devuelve (openpyxl workbook, fecha de publicacion, titulo)."""
    import openpyxl
    warnings.filterwarnings("ignore")
    lst = json.loads(fetch(API % (dataset, tries)))["data"]
    err = None
    for r in lst:
        a = r["attributes"]
        if str(a.get("format", "")).lower() != "xlsx" or not a.get("download_url"):
            continue
        try:
            wb = openpyxl.load_workbook(io.BytesIO(fetch(a["download_url"], binary=True)), data_only=True)
            return wb, a.get("data_date"), a.get("title")
        except Exception as ex:
            err = ex
            log("dataset %s: %s no se pudo abrir (%s)" % (dataset, a.get("title"), str(ex)[:80]))
    raise RuntimeError("dataset %s: ningun boletin legible (%s)" % (dataset, str(err)[:80]))


def num(x):
    if isinstance(x, bool):
        return None
    if isinstance(x, (int, float)):
        return float(x) if x == x else None
    if isinstance(x, str):
        s = x.strip().replace(",", ".")
        if re.fullmatch(r"-?\d+(\.\d+)?", s):
            return float(s)
    return None


def rnd(v, d=2):
    r = round(v, d)
    return int(r) if r == int(r) else r


def wk(d):
    y, w, _ = d.isocalendar()
    return "%d-W%02d" % (y, w)


def weekly(ws, c0=0, c1=999, min_year=2022):
    """Bloques anuales de dos columnas (ultimo dia de la semana, valor). Devuelve {año de la cabecera: {AAAA-Www: valor}} ya fusionado."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    pts = {}
    for c in range(c0, min(c1, len(rows[0]) if rows else 0)):
        col = [(i, r[c], r[c + 1] if c + 1 < len(r) else None) for i, r in enumerate(rows) if c < len(r)]
        dts = [(i, d, v) for i, d, v in col if isinstance(d, datetime.datetime)]
        if len(dts) < 40:
            continue
        prev = None
        for i, d, v in dts:
            if prev is not None and d.date() <= prev:
                continue
            prev = d.date()
            x = num(v)
            if x is None or d.date().isocalendar()[0] < min_year or d.date() > datetime.date.today():
                continue
            pts[wk(d.date())] = (d.date(), rnd(x))
    return pts


def summary_weekly(ws, label_re):
    """Tabla resumen del boletin: fila cuyo titulo coincide -> {fecha ISO: valor} segun las cabeceras 'dd.mm' / año."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    last1 = ""
    for i, r in enumerate(rows):
        if len(r) > 1 and isinstance(r[1], str) and r[1].strip():
            last1 = r[1]
        parts = [last1 if (len(r) > 1 and not (isinstance(r[1], str) and r[1].strip())) else r[1]] if len(r) > 1 else []
        txt = re.sub(r"\s+", " ", " ".join([x for x in (parts + [r[0] if r else None, r[2] if len(r) > 2 else None]) if isinstance(x, str)])).strip()
        for c in range(1):
            if txt and re.search(label_re, txt, re.I) and len(txt) < 60:
                # cabecera: primera fila anterior con celdas 'dd.mm.yyyy' o 'dd.mm'
                for h in range(i - 1, -1, -1):
                    hs = [v.strip() if isinstance(v, str) else (v.strftime("%d.%m.%Y") if isinstance(v, datetime.datetime) else "") for v in rows[h]]
                    dd = [(j, v) for j, v in enumerate(hs) if re.fullmatch(r"\d{2}\.\d{2}(\.\d{4})?", v)]
                    if dd:
                        out = {}
                        for j, v in dd:
                            m = re.fullmatch(r"(\d{2})\.(\d{2})(?:\.(\d{4}))?", v)
                            yr = m.group(3) or (str(rows[h + 1][j]).strip() if h + 1 < len(rows) else "")
                            if not re.fullmatch(r"\d{4}", str(yr)):
                                continue
                            try:
                                dt = datetime.date(int(yr), int(m.group(2)), int(m.group(1)))
                            except ValueError:
                                continue
                            val = num(rows[i][j]) if j < len(rows[i]) else None
                            if val is not None:
                                out.setdefault(dt.isoformat(), val)
                        return out
    return {}


def check_last(pts, summ, name, scale=1):
    """El ultimo punto semanal debe coincidir con la misma semana del resumen del boletin (tolerancia 0,5 %)."""
    if not pts:
        raise RuntimeError("%s: sin puntos semanales" % name)
    k = max(pts)
    d, v = pts[k]
    s = summ.get(d.isoformat())
    s = s / scale if s is not None else None
    if s is None:
        raise RuntimeError("%s: el resumen del boletin no trae la semana %s; no se puede contrastar" % (name, d))
    if abs(v - s) > max(0.5, abs(s) * 0.005):
        raise RuntimeError("%s: semana %s vale %s pero el resumen del boletin dice %s; no se publica" % (name, d, v, s))
    return d


def mk_series(sid, lab, pts, unit=None):
    p = sorted(([k, v] for k, v in pts.items() if v is not None), key=lambda x: x[0])
    return {"id": sid, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "points": p}


def strip_clones(ser, name, min_same=20):
    """Las hojas de graficos del boletin arrastran a veces el historico de otra serie (mismos valores al centimo semana tras semana). Si dos series de una tabla coinciden en
    min_same o mas periodos, ninguna de las dos es fiable antes del ultimo periodo coincidente: se recortan a lo que viene despues."""
    cut = {}
    for i in range(len(ser)):
        for j in range(i + 1, len(ser)):
            a, b = dict(ser[i]["points"]), dict(ser[j]["points"])
            same = [k for k in a if k in b and abs(a[k] - b[k]) < 1e-9]
            if len(same) >= min_same:
                last = max(same)
                for x in (i, j):
                    cut[x] = max(cut.get(x, ""), last)
                log("%s: %s y %s tienen %d valores identicos hasta %s; se recortan a lo posterior" % (name, ser[i]["id"], ser[j]["id"], len(same), last))
    out = []
    for i, x in enumerate(ser):
        if i in cut:
            x = dict(x)
            x["points"] = [p for p in x["points"] if p[0] > cut[i]]
        out.append(x)
    return out


def mk_table(tid, group, lab, unit, note, ser):
    ser = [s for s in strip_clones(ser, tid) if len(s["points"]) >= 2]
    return {"id": tid, "group": group, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "unit": unit, "note": note, "series": ser}


def doc(tabs, edition, now):
    return {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition, "tables": tabs}


def monthly_dates(ws, hdr_re="MC/ROK"):
    """Hoja con fechas mensuales en filas: devuelve ({columna: nombre}, [(fecha, fila)])."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next((i for i, r in enumerate(rows) if any(isinstance(x, str) and re.fullmatch(hdr_re, x.strip()) for x in r)), None)
    if h is None:
        raise RuntimeError("cabecera mensual no encontrada")
    names = {}
    for c, x in enumerate(rows[h]):
        if isinstance(x, str) and x.strip() and not re.fullmatch(hdr_re, x.strip()):
            names[c] = re.sub(r"\s+", " ", x).strip()
    data = []
    for r in rows[h + 1:]:
        d = next((x for x in r[:3] if isinstance(x, datetime.datetime)), None)
        if d is None:
            if data:
                break
            continue
        data.append((d, r))
    return names, data


def roman_table(ws, hdr="MIESIĄC", nth=0):
    """Tabla mensual con los meses en numeros romanos (filas) y los años en columnas -> {AAAA-MM: valor}. nth = que cabecera de la hoja (0 = la primera)."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    hs = [i for i, r in enumerate(rows) if any(isinstance(x, str) and x.strip() == hdr for x in r)]
    if len(hs) <= nth:
        raise RuntimeError("cabecera %s no encontrada" % hdr)
    h = hs[nth]
    cols = {}
    for c, x in enumerate(rows[h]):
        n = num(x.strip()) if isinstance(x, str) else num(x)
        if n and 2000 <= n <= 2100:
            cols[c] = int(n)
    pts = {}
    for r in rows[h + 1:h + 13]:
        m = ROMAN.get(str(r[1]).strip())
        if not m:
            continue
        for c, y in cols.items():
            x = num(r[c]) if c < len(r) else None
            if x is not None:
                pts["%d-%02d" % (y, m)] = rnd(x)
    return pts


def year_rows(ws, after_rx=None, maxc=14):
    """Tabla con el año en la primera columna de datos (filas) y los meses I..XII en columnas -> {AAAA-MM: valor}. after_rx = rotulo de la seccion tras la que empieza."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    start = 0
    if after_rx:
        start = next((i + 1 for i, r in enumerate(rows) if len(r) > 1 and isinstance(r[1], str) and re.search(after_rx, r[1], re.I)), None)
        if start is None:
            raise RuntimeError("seccion %s no encontrada" % after_rx)
    pts = {}
    seen = False
    for r in rows[start:]:
        y = num(r[1].strip()) if len(r) > 1 and isinstance(r[1], str) else (num(r[1]) if len(r) > 1 else None)
        if y and 2000 <= y <= 2100 and y == int(y):
            seen = True
            for m in range(12):
                x = num(r[2 + m]) if 2 + m < len(r) and 2 + m < maxc else None
                if x is not None:
                    pts["%d-%02d" % (int(y), m + 1)] = rnd(x)
        elif seen:
            break
    return pts


def has_value(ws, v, rows=40):
    """Contraste de una serie mensual: el ultimo valor tiene que aparecer en la tabla resumen de la misma hoja o de otra del boletin."""
    for r in ws.iter_rows(min_row=1, max_row=rows, values_only=True):
        for x in r:
            n = num(x)
            if n is not None and abs(n - v) < 0.006:
                return True
    return False


def cell_value(ws, rx, col=3):
    """Valor numerico (columna col, 0-based) de la primera fila cuyo rotulo (columnas B y C, arrastrando el de B) coincide."""
    last1 = ""
    for r in ws.iter_rows(values_only=True):
        if len(r) > 1 and isinstance(r[1], str) and r[1].strip():
            last1 = r[1]
        b = last1 if len(r) > 1 and not (isinstance(r[1], str) and r[1].strip()) else (r[1] if len(r) > 1 else "")
        txt = re.sub(r"\s+", " ", " ".join(x for x in (b, r[2] if len(r) > 2 else None) if isinstance(x, str))).strip()
        if txt and re.search(rx, txt, re.I):
            return num(r[col]) if len(r) > col else None
    return None


def wser(wb, sheet, c0, c1, sumsheet, rx, sid, lab, scale=1):
    """Serie semanal de un grupo de columnas, contrastada con el resumen. Devuelve (serie, fecha del ultimo punto)."""
    pts = weekly(wb[sheet], c0, c1)
    d = check_last(pts, summary_weekly(wb[sumsheet], rx), "%s (%s)" % (sid, sheet), scale)
    return mk_series(sid, lab, {k: v[1] for k, v in pts.items()}), d


def merge_old(tabs, old, name):
    """Una tabla que falla no borra la publicada: se conserva la anterior y se avisa."""
    if not old:
        return tabs
    have = set(t["id"] for t in tabs)
    out = list(tabs)
    for t in old.get("tables", []):
        if t["id"] not in have:
            out.append(t)
            log("%s: la tabla %s no se pudo leer; se conserva la publicada" % (name, t["id"]))
    return out


# ------------------------------------------------------------ bloques
def cereales():
    wb, dd, title = workbook("546")
    names, data = monthly_dates(wb["ZAKUP WYKRESY MCE"])
    ser = []
    miss = []
    for c, nm in names.items():
        meta = LB.CEREALS.get(nm)
        if not meta:
            miss.append(nm)
            continue
        pts = {}
        for d, r in data:
            x = num(r[c]) if c < len(r) else None
            if x is not None:
                pts["%d-%02d" % (d.year, d.month)] = rnd(x)
        ser.append(mk_series("pl-cer-m-" + meta[0], meta[1], pts))
    if miss:
        log("cereales: cabeceras sin traduccion (no se publican): %s" % miss)
    if not ser:
        raise RuntimeError("cereales: ninguna serie mensual")
    tabs = [mk_table("cereales-mensual", "cereales", ("Cereales: precio de compra, mensual", "Cereals: purchase price, monthly", "Céréales : prix d'achat, mensuel", "Cereali: prezzo d'acquisto, mensile"), "PLN/t", "Precio medio mensual de compra de grano en empresas (ZSRIR); sin IVA", ser)]
    wsw = wb["ZAKUP WYKRESY TYG."]
    zz = wb["ZAKUP ZIARNA"]
    pts = weekly(wsw, 2, 13)
    summ = check_last(pts, summary_weekly(zz, r"\bPszenica konsumpcyjna"), "trigo semanal")
    mz = weekly(wsw, 14, 25)
    check_last(mz, summary_weekly(zz, r"\bKukurydza sucha"), "maiz semanal")
    tabs.append(mk_table("cereales-semanal", "cereales", ("Trigo de consumo y maíz: precio semanal", "Food wheat and maize: weekly price", "Blé de consommation et maïs : prix hebdomadaire", "Frumento di consumo e mais: prezzo settimanale"), "PLN/t", "Precio medio semanal de compra, semana de lunes a domingo (ZSRIR)", [mk_series("pl-cer-w-pszenica-kons", LB.WHEAT_WEEK, {k: v[1] for k, v in pts.items()}), mk_series("pl-cer-w-kukurydza", LB.MAIZE_WEEK, {k: v[1] for k, v in mz.items()})]))
    return "semana %s" % summ.isoformat(), tabs


def colza():
    wb, dd, title = workbook("957")
    ws = wb["CENY_MIESIĘCZNE"]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next(i for i, r in enumerate(rows) if any(isinstance(x, str) and x.strip() == "MIESIĄC" for x in r))
    cols = {}
    for c, x in enumerate(rows[h]):
        n = num(x) if not isinstance(x, str) else num(x.strip())
        if n and 2000 <= n <= 2100:
            cols[c] = int(n)
    pts = {}
    for r in rows[h + 1:h + 13]:
        m = ROMAN.get(str(r[1]).strip())
        if not m:
            continue
        for c, y in cols.items():
            x = num(r[c]) if c < len(r) else None
            if x is not None:
                pts["%d-%02d" % (y, m)] = rnd(x)
    tabs = [mk_table("colza-mensual", "colza", ("Colza: precio de compra, mensual", "Rapeseed: purchase price, monthly", "Colza : prix d'achat, mensuel", "Colza: prezzo d'acquisto, mensile"), "PLN/t", "Precio medio mensual de compra de semilla de colza (ZSRIR)", [mk_series("pl-colza-m-semilla", LB.RAPE_MONTH, pts)])]
    wp = weekly(wb["WYKRES RZEPAK"])
    summ = check_last(wp, summary_weekly(wb["ZAKUP RZEPAKU, SPRZEDAŻ "], r"\bNasiona rzepaku"), "colza semanal")
    tabs.append(mk_table("colza-semanal", "colza", ("Colza: precio de compra, semanal", "Rapeseed: purchase price, weekly", "Colza : prix d'achat, hebdomadaire", "Colza: prezzo d'acquisto, settimanale"), "PLN/t", "Precio medio semanal de compra de semilla de colza, semana de lunes a domingo (ZSRIR)", [mk_series("pl-colza-w-semilla", LB.RAPE_WEEK, {k: v[1] for k, v in wp.items()})]))
    return "semana %s" % summ.isoformat(), tabs


def carne():
    """Porcino (777), vacuno (1214) y pollo (601). Cada tabla es independiente: la que falla se conserva de lo publicado (merge_old)."""
    tabs, eds, errs = [], [], []

    def tbl(tid, lab, unit, note, build):
        try:
            ser, ds = build()
            tabs.append(mk_table(tid, "carne", lab, unit, note, ser))
            eds.extend(ds)
        except Exception as ex:
            errs.append("%s: %s" % (tid, str(ex)[:160]))

    wb, dd, t = workbook("777")
    tbl("porcino-vivo-semanal", ("Cerdo de engorde: precio semanal", "Fattening pigs: weekly price", "Porcs charcutiers : prix hebdomadaire", "Suini da ingrasso: prezzo settimanale"), "PLN/kg peso vivo", "Precio medio de compra en mataderos, semana de lunes a domingo (ZSRIR)",
        lambda: (lambda r: ([r[0]], [r[1]]))(wser(wb, "ZAKUP ŻYWIEC WYKRES TYG", 2, 13, "ZAKUP ŻYWIEC", r"^POLSKA$", "pl-pig-live-w", LB.PIG_LIVE_W)))
    tbl("porcino-canal-semanal", ("Canal de cerdo clase E: precio semanal", "Pig carcass class E: weekly price", "Carcasse de porc classe E : prix hebdomadaire", "Carcassa suina classe E: prezzo settimanale"), "PLN/t", "Precio medio de compra por masa de carne en canal (mps), clase E de la escala EUROP, en mataderos (ZSRIR)",
        lambda: (lambda r: ([r[0]], [r[1]]))(wser(wb, "ZAKUP KL. E WYKRES TYG", 2, 13, "ZAKUP EUROP", r"^Klasa E$", "pl-pig-e-w", LB.PIG_E_W)))

    def pig_m():
        pts = roman_table(wb["ZAKUP ŻYWIEC WYKRES MSC"])
        return [mk_series("pl-pig-live-m", LB.PIG_LIVE_M, pts)], []
    tbl("porcino-vivo-mensual", ("Cerdo de engorde: precio mensual", "Fattening pigs: monthly price", "Porcs charcutiers : prix mensuel", "Suini da ingrasso: prezzo mensile"), "PLN/kg peso vivo", "Precio medio mensual de compra en mataderos (ZSRIR)", pig_m)

    wb, dd, t = workbook("1214")

    def beef():
        a, d1 = wser(wb, "ZAKUP WYKRESY (1) ", 2, 13, "ZAKUP BYDŁA", r"\bBydło ogółem", "pl-beef-total-w", LB.BEEF_W["total"])
        b, d2 = wser(wb, "ZAKUP WYKRESY (1) ", 14, 25, "ZAKUP BYDŁA", r"\bbyki 12-24", "pl-beef-bulls-w", LB.BEEF_W["bulls"])
        c, d3 = wser(wb, "ZAKUP WYKRESY (2)", 2, 13, "ZAKUP BYDŁA", r"\bjałówki", "pl-beef-heifers-w", LB.BEEF_W["heifers"])
        d, d4 = wser(wb, "ZAKUP WYKRESY (2)", 14, 25, "ZAKUP BYDŁA", r"\bkrowy", "pl-beef-cows-w", LB.BEEF_W["cows"])
        return [a, b, c, d], [d1, d2, d3, d4]
    tbl("vacuno-canal-semanal", ("Vacuno en canal: precio semanal", "Beef carcass: weekly price", "Bovins en carcasse : prix hebdomadaire", "Bovini in carcassa: prezzo settimanale"), "PLN/t", "Precio medio de compra por masa de carne en canal (mps) en mataderos, por categoría (ZSRIR)", beef)

    wb, dd, t = workbook("601")

    def chicken():
        r = wser(wb, "SKUP KURCZĄT WYKRES", 2, 13, "SKUP DROBIU POLSKA", r"\bKurczęta typu brojle", "pl-chicken-w", LB.CHICKEN_W, scale=1000)
        return [r[0]], [r[1]]
    tbl("pollo-semanal", ("Pollo broiler: precio semanal", "Broiler chicken: weekly price", "Poulet de chair : prix hebdomadaire", "Pollo da carne: prezzo settimanale"), "PLN/kg", "Precio medio de compra en mataderos de aves; el boletin lo da en zl/kg en la hoja semanal (ZSRIR)", chicken)
    for e in errs:
        log("carne: " + e)
    if not tabs:
        raise RuntimeError("carne: ninguna tabla (%s)" % "; ".join(errs)[:200])
    return "semana %s" % max(eds).isoformat(), tabs


def lacteos():
    """Leche cruda (mensual), mantequilla, leche en polvo y quesos (semanal) del dataset 1024 y huevos para transformacion (1003). Una tabla que falla se conserva (merge_old)."""
    tabs, eds, errs = [], [], []

    def tbl(tid, grp, lab, unit, note, build):
        try:
            ser, ds = build()
            tabs.append(mk_table(tid, grp, lab, unit, note, ser))
            eds.extend(ds)
        except Exception as ex:
            errs.append("%s: %s" % (tid, str(ex)[:160]))

    wb, dd, t = workbook("1024")
    TS = "TAB. TYGODNIOWA"

    def weeklies(specs):
        out, ds = [], []
        for sheet, c0, c1, rx, sid, lab in specs:
            a, d = wser(wb, sheet, c0, c1, TS, rx, sid, lab)
            out.append(a); ds.append(d)
        return out, ds
    tbl("lacteos-semanal", "lacteos", ("Mantequilla, leche en polvo y quesos: precio de venta semanal", "Butter, milk powder and cheese: weekly selling price", "Beurre, lait en poudre et fromages : prix de vente hebdomadaire", "Burro, latte in polvere e formaggi: prezzo di vendita settimanale"), "PLN/100 kg", "Precio medio de venta de los productos lácteos en Polonia, semana de lunes a domingo (ZSRIR). Leche entera en polvo y Edam empiezan en la semana 49 de 2025: antes, las hojas históricas del boletín repiten en ambas la misma serie y no se publican.",
        lambda: weeklies([("MASŁO WYKRESY TYG.", 2, 13, r"^Masło Ekstra w blokach", "pl-dairy-butter-block-w", LB.DAIRY["butter-block"]), ("MASŁO WYKRESY TYG.", 17, 28, r"^Masło Ekstra konfekcjonowane", "pl-dairy-butter-pack-w", LB.DAIRY["butter-pack"]),
                          ("MLEKO W PROSZKU WYKRESY TYG.", 2, 13, r"^Mleko odtłuszczone", "pl-dairy-smp-w", LB.DAIRY["smp"]), ("MLEKO W PROSZKU WYKRESY TYG.", 17, 28, r"^Mleko pełne", "pl-dairy-wmp-w", LB.DAIRY["wmp"]),
                          ("SERY WYKRESY TYG.", 2, 13, r"^Ser Edamski", "pl-dairy-edam-w", LB.DAIRY["edam"]), ("SERY WYKRESY TYG.", 17, 28, r"^Ser Gouda", "pl-dairy-gouda-w", LB.DAIRY["gouda"])]))

    def milk():
        pts = year_rows(wb["MIESIĘCZNE CENY SKUPU 2004-2026"])
        k = max(pts)
        if not has_value(wb["SKUP MLEKA"], pts[k]):
            raise RuntimeError("el ultimo valor mensual (%s = %s) no aparece en el resumen SKUP MLEKA; no se publica" % (k, pts[k]))
        if len(pts) < 200:
            raise RuntimeError("serie de leche cruda demasiado corta (%d)" % len(pts))
        return [mk_series("pl-milk-raw-m", LB.MILK_RAW_M, pts)], []
    tbl("leche-cruda-mensual", "lacteos", ("Leche cruda: precio de compra mensual", "Raw milk: monthly purchase price", "Lait cru : prix d'achat mensuel", "Latte crudo: prezzo d'acquisto mensile"), "PLN/100 kg", "Precio medio mensual de compra de leche cruda de parámetros estándar, desde 2004 (ZSRIR)", milk)

    wb, dd, t = workbook("1003")

    def eggs():
        r = wser(wb, "SKUP WYKRESY", 2, 13, "SKUP-PRZETWÓRSTWO", r"^Jaja do przetwórstwa", "pl-eggs-proc-w", LB.EGGS_PROC_W)
        return [r[0]], [r[1]]
    tbl("huevos-semanal", "huevos", ("Huevos para transformación: precio de compra semanal", "Eggs for processing: weekly purchase price", "Œufs de transformation : prix d'achat hebdomadaire", "Uova per la trasformazione: prezzo d'acquisto settimanale"), "PLN/t", "Precio medio semanal de compra de huevos destinados a la industria (ZSRIR)", eggs)
    for e in errs:
        log("lacteos: " + e)
    if not tabs:
        raise RuntimeError("lacteos: ninguna tabla (%s)" % "; ".join(errs)[:200])
    return "semana %s" % max(eds).isoformat() if eds else "mensual", tabs


def piensos():
    """Precio de venta de piensos para bovino, aves y porcino (dataset 1022), mensual, 10 años. El ultimo mes se contrasta con la hoja resumen de cada especie."""
    wb, dd, t = workbook("1022")
    ws = wb["CENY PASZ (10 LAT)"]
    spec = [("BYDŁO - M\\.P\\. UZUPE", "BYDŁO PL", r"UZUPEŁNIAJĄCE OGÓŁEM", "pl-feed-cattle-m", LB.FEED["cattle"]),
            ("DRÓB - M\\.P\\. PE", "DRÓB PL", r"^M\.P\. PEŁNOPORCJOWE$", "pl-feed-poultry-m", LB.FEED["poultry"]),
            ("TRZODA - M\\.P\\. PE", "TRZODA PL", r"PEŁNOPORCJOWE OGÓŁEM", "pl-feed-pig-m", LB.FEED["pig"])]
    ser = []
    for sec, sheet, rx, sid, lab in spec:
        pts = year_rows(ws, sec)
        k = max(pts)
        v = cell_value(wb[sheet], rx)
        if v is None or abs(v - pts[k]) > 0.01 + abs(v) * 0.0005:
            raise RuntimeError("%s: %s = %s pero la hoja %s dice %s; no se publica" % (sid, k, pts[k], sheet, v))
        ser.append(mk_series(sid, lab, pts))
    return "mes %s" % max(max(p for p, _ in s["points"]) for s in ser), [mk_table("piensos-mensual", "piensos", ("Piensos compuestos: precio de venta mensual", "Compound feed: monthly selling price", "Aliments composés : prix de vente mensuel", "Mangimi composti: prezzo di vendita mensile"), "PLN/t", "Precio medio mensual de venta de piensos: complementarios para bovino, completos para aves y para porcino, en toda Polonia, últimos 10 años (ZSRIR)", ser)]


def wide_weekly(ws, min_year=2022):
    """Hoja de graficos con una fecha por fila (columna B) y un producto por columna (cabecera 'TYDZIEŃ' en B) -> {nombre: {AAAA-Www: (fecha, valor)}}."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next((i for i, r in enumerate(rows) if len(r) > 1 and isinstance(r[1], str) and r[1].strip() == "TYDZIEŃ"), None)
    if h is None:
        raise RuntimeError("cabecera TYDZIEŃ no encontrada")
    names = {c: re.sub(r"\s+", " ", x).strip() for c, x in enumerate(rows[h]) if c >= 2 and isinstance(x, str) and x.strip()}
    out = {n: {} for n in names.values()}
    prev = None
    for r in rows[h + 1:]:
        d = r[1] if len(r) > 1 else None
        if not isinstance(d, datetime.datetime) or d.date() > datetime.date.today() or d.date().isocalendar()[0] < min_year:
            continue
        if prev is not None and d.date() <= prev:
            log("fecha fuera de orden %s tras %s (año mal escrito en la hoja): fila omitida" % (d.date(), prev))
            continue
        prev = d.date()
        k = wk(d.date())
        for c, n in names.items():
            x = num(r[c]) if c < len(r) else None
            if x is not None and k not in out[n]:
                out[n][k] = (d.date(), rnd(x))
    return out


PREV = {}


def accumulate(sid, new_pts):
    """El boletin de fruta y hortaliza solo trae el ultimo año: se suman los puntos ya publicados (los nuevos mandan)."""
    old = {}
    for d in (PREV.get("fruta.json") or {}).get("tables", []):
        for x in d["series"]:
            if x["id"] == sid:
                old = dict(x["points"])
    old.update(new_pts)
    return old


def fruta():
    wb, dd, t = workbook("912")
    tabs, eds, errs = [], [], []
    for sheet, sumsheet, spec, tid, grp, lab, note in (
        ("WYKRES JABŁKA DETAL", "ZAKUP OWOCE DETAL - LUZ", LB.APPLES, "manzana-detal-semanal", "fruta", ("Manzana: precio de compra del comercio minorista, semanal", "Apples: retail purchase price, weekly", "Pommes : prix d'achat du commerce de détail, hebdomadaire", "Mele: prezzo d'acquisto del commercio al dettaglio, settimanale"), "Precio medio semanal que paga el comercio minorista (cadenas) por manzanas nacionales sueltas, por variedad (ZSRIR). El boletín trae un año; la serie se acumula desde la primera publicación."),
        ("WYKRES_CENY WARZYW", "ZAKUP WARZ DETAL - LUZ", LB.VEG, "hortalizas-detal-semanal", "hortalizas", ("Zanahoria, tomate y patata: precio de compra del comercio minorista, semanal", "Carrots, tomatoes and potatoes: retail purchase price, weekly", "Carottes, tomates et pommes de terre : prix d'achat du commerce de détail, hebdomadaire", "Carote, pomodori e patate: prezzo d'acquisto del commercio al dettaglio, settimanale"), "Precio medio semanal que paga el comercio minorista (cadenas) por hortalizas nacionales sueltas (ZSRIR). El boletín trae un año; la serie se acumula desde la primera publicación."),
    ):
        try:
            data = wide_weekly(wb[sheet])
            summ = wb[sumsheet]
            ser = []
            for nm, (code, labs) in spec.items():
                pts = data.get(nm)
                if not pts:
                    raise RuntimeError("columna %s no encontrada" % nm)
                d = check_last(pts, summary_weekly(summ, r"^" + re.escape(nm) + r"(/|$)"), "%s (%s)" % (nm, sheet))
                eds.append(d)
                ser.append(mk_series("pl-fv-" + code + "-w", labs, accumulate("pl-fv-" + code + "-w", {k: v[1] for k, v in pts.items()})))
            tabs.append(mk_table(tid, grp, lab, "PLN/100 kg", note, ser))
        except Exception as ex:
            errs.append("%s: %s" % (tid, str(ex)[:160]))
    for e in errs:
        log("fruta: " + e)
    if not tabs:
        raise RuntimeError("fruta: ninguna tabla (%s)" % "; ".join(errs)[:200])
    return "semana %s" % max(eds).isoformat(), tabs


def azucar():
    wb, dd, t = workbook("367")
    ser = []
    for sheet, sumsheet, sid, lab in (("SPRZEDAŻ KRAJ WYKRES", "SPRZEDAŻ KRAJ", "pl-sugar-sales-m", LB.SUGAR["sales"]), ("ZAKUP PRZETWÓRSTWO WYKRES", "ZAKUP PRZETWÓRSTWO", "pl-sugar-industry-m", LB.SUGAR["industry"]), ("ZAKUP DETAL WYKRES", "ZAKUP DETAL", "pl-sugar-retail-m", LB.SUGAR["retail"])):
        pts = roman_table(wb[sheet])
        k = max(pts)
        if not has_value(wb[sumsheet], pts[k]):
            raise RuntimeError("%s: el ultimo valor (%s = %s) no aparece en la hoja %s; no se publica" % (sid, k, pts[k], sumsheet))
        ser.append(mk_series(sid, lab, pts))
    ed = max(p[-1][0] for p in (x["points"] for x in ser))
    return "mes %s" % ed, [mk_table("azucar-mensual", "azucar", ("Azúcar blanco: precio mensual", "White sugar: monthly price", "Sucre blanc : prix mensuel", "Zucchero bianco: prezzo mensile"), "PLN/t", "Precio medio mensual del azúcar blanco en Polonia desde 2022 (ZSRIR); el boletín se publica con unos dos meses de retraso", ser)]


# ------------------------------------------------------------ estadisticas (catalogo): solo series mensuales
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
    return next((s for s in (t or {"series": []})["series"] if s["id"] == sid), None)


def stats(docs, now):
    out = []

    def add(sid, grp, label, unit, s, minpts=24):
        if not s or len(s["points"]) < minpts:
            return
        p = s["points"]
        per = p[-1][0]
        prev = next((v for k, v in p if k == "%d%s" % (int(per[:4]) - 1, per[4:])), None)
        ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": "monthly", "latestPeriod": per, "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "poland-zsrir"})

    c = docs.get("cereales.json")
    for key, (code, lab) in LB.CEREALS.items():
        if code in ("pszenica-kons", "pszenica-pasz", "zyto-kons", "jeczmien-pasz", "kukurydza-sucha"):
            add("pl-zsrir-cer-" + code, "prices", "%s, precio de compra, Polonia (ZSRIR)" % lab[0], "PLN/t", one(c, "cereales-mensual", "pl-cer-m-" + code))
    add("pl-zsrir-colza", "prices", "Colza (semilla), precio de compra, Polonia (ZSRIR)", "PLN/t", one(docs.get("colza.json"), "colza-mensual", "pl-colza-m-semilla"), 36)
    pm = one(docs.get("carne.json"), "porcino-vivo-mensual", "pl-pig-live-m")
    add("pl-zsrir-cerdo-vivo", "prices", "Cerdo de engorde (peso vivo), precio de compra, Polonia (ZSRIR)", "PLN/kg", pm, 36)
    add("pl-zsrir-leche-cruda", "milk", "Leche cruda, precio de compra, Polonia (ZSRIR)", "PLN/100 kg", one(docs.get("lacteos.json"), "leche-cruda-mensual", "pl-milk-raw-m"), 60)
    for k, nm in (("cattle", "bovino"), ("poultry", "aves"), ("pig", "porcino")):
        add("pl-zsrir-pienso-" + k, "inputs", "Pienso para %s, precio de venta, Polonia (ZSRIR)" % nm, "PLN/t", one(docs.get("piensos.json"), "piensos-mensual", "pl-feed-" + k + "-m"), 36)
    add("pl-zsrir-azucar-venta", "prices", "Azúcar blanco envasado, venta interior, Polonia (ZSRIR)", "PLN/t", one(docs.get("azucar.json"), "azucar-mensual", "pl-sugar-sales-m"), 36)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"PL": {"name": "Polonia", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    PREV.update(docs)
    new = False
    for name, fn in (("cereales", cereales), ("colza", colza), ("carne", carne), ("lacteos", lacteos), ("piensos", piensos), ("fruta", fruta), ("azucar", azucar)):
        try:
            ed, tabs = fn()
            tabs = merge_old(tabs, docs.get(name + ".json"), name)
            old = docs.get(name + ".json")
            if old and old.get("tables") == tabs:
                log("%s: sin cambios (%s)" % (name, ed))
            else:
                docs[name + ".json"] = doc(tabs, ed, now)
                new = True
                log("%s: leido (%s, %d tablas, %d series)" % (name, ed, len(tabs), sum(len(t["series"]) for t in tabs)))
        except Exception as ex:
            log("%s: NO se pudo leer (%s); se conserva lo publicado" % (name, str(ex)[:220]))
        time.sleep(2)
    files = []
    for n, (title, desc) in FILES.items():
        d = docs.get(n)
        if not d:
            continue
        files.append({"file": n, "title": title, "description": desc, "edition": d["edition"], "tables": len(d["tables"]), "series": sum(len(t["series"]) for t in d["tables"]), "generatedAt": d["generatedAt"]})
    if not files:
        log("sin datos; no se escribe nada")
        (ROOT / "data" / "poland-zsrir-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    if not new and (OUT / "index.json").exists():
        log("ningun boletin nuevo; no se reescribe nada")
        return
    for n in FILES:
        if docs.get(n):
            (OUT / n).write_text(json.dumps(docs[n], ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "poland-zsrir-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["PL"]["series"])))
    (ROOT / "data" / "poland-zsrir-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

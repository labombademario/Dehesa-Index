#!/usr/bin/env python3
"""Hungria — tablas STADAT de agricultura del KSH (Oficina Central de Estadistica) -> data/hu-ksh-stats.json (countries.HU, extend)
Fuente: https://www.ksh.hu (STADAT, ficheros CSV en ingles). Licencia: CC BY 4.0 para todo el contenido del sitio, tablas incluidas
(condiciones de uso del KSH, https://www.ksh.hu/copyright_eng; quedan fuera los ficheros consultados a peticion a las bases internas, que no usamos).
Tablas (desde 1990): mez0001 resumen, mez0008 uso de la tierra, mez0009 alquiler y precio de la tierra, mez0012/15/18 superficie, produccion y rendimiento de cultivos
herbaceos, mez0013/16/19 hortalizas, mez0014/17/20 frutas y uva, mez0027 y mez0029 censo ganadero, mez0032-0035 produccion animal, leche y huevos.
Precios mensuales (ara0052 compra de cultivos, ara0053 compra de ganado y productos, ara0054 mercado del productor; desde 2022): se omiten las tablas acumuladas (ara0049).
Formato STADAT: CSV ISO-8859-2 con ';', cabecera «Year;col;col...», '..' = sin dato. Nada se estima; una celda vacia se omite; una serie con <3 puntos o parada >3 anos no se publica."""
import csv, datetime, io, json, re, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "hu-ksh-stats.json"
URL = "https://www.ksh.hu/stadat_files/mez/en/%s.csv"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
SRC = {"name": "Hungarian Central Statistical Office (KSH), STADAT (CC BY 4.0)", "url": "https://www.ksh.hu/stadat", "license": "CC BY 4.0"}
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a)); print(*a)
# (tabla, grupo, prefijo de etiqueta, hoja con unidad en cabecera, columnas a saltar tras el ano)
TABLES = [
    ("mez0001", "income", "Agriculture summary", True, 0),
    ("mez0008", "inputs", "Agricultural land area by use", False, 0),
    ("mez0009", "inputs", "Land price and rent", False, 0),
    ("mez0012", "crops", "Harvested area", False, 0), ("mez0013", "crops", "Harvested area", False, 0), ("mez0014", "crops", "Harvested area", False, 0),
    ("mez0015", "production", "Production", False, 0), ("mez0016", "production", "Production", False, 0), ("mez0017", "production", "Production", False, 0),
    ("mez0018", "crops", "Average yield", False, 0), ("mez0019", "crops", "Average yield", False, 0), ("mez0020", "crops", "Average yield", False, 0),
    ("mez0027", "livestock", "Livestock, 1 December", False, 1), ("mez0029", "livestock", "Poultry stock, 1 December", False, 1),
    ("mez0032", "production", "Production of animals for slaughter", False, 0), ("mez0033", "production", "Meat production", False, 0),
    ("mez0034", "milk", "Production", True, 0), ("mez0035", "milk", "Average production", True, 0),
]
def get(u, t=90, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read().decode("iso-8859-2")
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-40:], last))
def num(x):
    x = (x or "").replace("\xa0", "").replace(" ", "").strip()
    if x in ("", "..", "-", "...", "x"): return None
    try: return float(x.replace(",", "."))
    except ValueError: return None
def clean(s): return re.sub(r"\s+", " ", s or "").strip()
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def unit_of(title):
    m = re.search(r"\[([^\]]+)\]", title); u = clean(m.group(1)) if m else ""
    return {"thousand hectares": "thousand ha", "hectares": "ha", "hectar": "ha", "tonnes": "t", "tonne": "t", "thousand tonne": "thousand t", "HUF/hectares": "HUF/ha", "kg/hectare": "kg/ha", "kg/hectar": "kg/ha", "1000 heads": "thousand heads", "1000 heads]": "thousand heads"}.get(u, u)
def col_unit(h):
    parts = [clean(p) for p in h.rsplit(",", 1)]
    if len(parts) == 2 and len(parts[1]) < 25 and parts[1] and not parts[1][0].isupper():
        u = parts[1].replace("pct", "%")
        return parts[0], {"tonne": "t", "litre": "litres", "pieces": "pcs"}.get(u, u)
    return clean(h), ""
def build(sid, group, label, unit, pts, tab, note=None):
    pts = sorted({p: v for p, v in pts if v is not None}.items())
    pts = [[p, round(v, 3)] for p, v in pts]
    if len(pts) < 3 or int(pts[-1][0]) < datetime.date.today().year - 3: return None
    prev = pts[-2][1]
    s = dict(id=sid, group=group, label=label, unit=unit, frequency="annual", latestPeriod=pts[-1][0], latest=pts[-1][1],
             changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup="KSH STADAT %s" % tab)
    if note: s["periodNote"] = note
    return s
def note_for(tab, name, pts):
    n = []
    if pts and pts[-1][0] == str(datetime.date.today().year): n.append("The current-year value is as published by KSH and may be provisional.")
    if tab == "mez0008" and "kitchen" in name.lower(): n.append("Large steps in this series (1992, 2020) may reflect changes in KSH's land-use classification rather than real change; see the KSH table notes.")
    return " ".join(n) or None
def parse(tab, group, prefix, colunits, skip):
    rows = list(csv.reader(io.StringIO(get(URL % tab)), delimiter=";", quotechar='"'))
    title = clean(rows[0][0]); tu = unit_of(title)
    hi = next(i for i, r in enumerate(rows) if r and clean(r[0]) == "Year")
    head = [clean(h) for h in rows[hi]]; section = ""; data = {}
    for r in rows[hi + 1:]:
        if not r or not clean(r[0]): continue
        if not re.fullmatch(r"\d{4}", clean(r[0])):
            if not any(clean(c) for c in r[1:]): section = clean(r[0])
            continue
        y = clean(r[0])
        if int(y) < 1990: continue
        for j in range(1 + skip, len(head)):
            v = num(r[j]) if j < len(r) else None
            data.setdefault((section, j), []).append((y, v))
    out = []
    for (sec, j), pts in data.items():
        name, unit = (col_unit(head[j]) if colunits else (head[j], tu))
        if not unit: unit = tu
        if "previous year = 100" in unit: unit = "index (previous year = 100)"
        low = name.lower()
        if "huf/hectares" in head[j].lower(): name, unit = clean(head[j].split(",")[0]), "HUF/ha"
        elif not unit and ("previous year" in low or "terms of trade" in low): unit = "index (previous year = 100)"
        elif not unit and "share" in low: unit = "%"
        if not unit: log("sin unidad, se omite:", tab, name[:60]); continue
        lab = "%s: %s%s (%s, KSH)" % (prefix, name, (", " + sec.lower()) if sec else "", unit)
        s = build("hu-ksh-%s-%s%s" % (tab[3:], slug(name)[:40], ("-" + slug(sec)[:20]) if sec else ""), group, lab, unit, pts, tab,
                  note_for(tab, name, pts))
        if s: out.append(s)
    log(tab, len(out), "series")
    return out
MONTHS = {m: i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
# tablas mensuales de precios (ara): (tabla, grupo, prefijo, unidad por defecto de la cabecera del titulo)
MONTHLY = [("ara0052", "prices", "Procurement price", True), ("ara0053", "prices_lv", "Procurement price", True), ("ara0054", "prices", "Producer market price", True)]
def parse_monthly(tab, group, prefix, _):
    rows = list(csv.reader(io.StringIO(get("https://www.ksh.hu/stadat_files/ara/en/%s.csv" % tab)), delimiter=";", quotechar='"'))
    tu = unit_of(clean(rows[0][0])); hi = next(i for i, r in enumerate(rows) if r and clean(r[0]) == "Year")
    head = [clean(h) for h in rows[hi]]; year = None; data = {}
    for r in rows[hi + 1:]:
        if not r: continue
        if clean(r[0]): year = clean(r[0])
        m = MONTHS.get(clean(r[1]) if len(r) > 1 else "")
        if not year or not re.fullmatch(r"\d{4}", year) or not m: continue
        for j in range(2, len(head)):
            data.setdefault(j, []).append(("%s-%02d" % (year, m), num(r[j]) if j < len(r) else None))
    out = []
    for j, pts in data.items():
        mu = re.search(r",\s*(HUF/[A-Za-z]+)$", head[j])
        name, unit = (head[j][:mu.start()], mu.group(1)) if mu else (head[j], tu)
        pts = sorted({p: v for p, v in pts if v is not None}.items())
        pts = [[p, round(v, 3)] for p, v in pts]
        if len(pts) < 12 or not unit: continue
        y, mo = datetime.date.today().year, datetime.date.today().month
        ly, lm = map(int, pts[-1][0].split("-"))
        if (y - ly) * 12 + mo - lm > 18: continue
        prev = pts[-2][1]
        out.append(dict(id="hu-ksh-%s-%s" % (tab[3:], slug(name)[:40]), group=group, label="%s: %s (%s, KSH)" % (prefix, name, unit), unit=unit, frequency="monthly",
                        latestPeriod=pts[-1][0], latest=pts[-1][1], changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts,
                        sourceGroup="KSH STADAT %s" % tab))
    log(tab, len(out), "series mensuales")
    return out
def main():
    ser = []
    for t in MONTHLY:
        try: ser += parse_monthly(*t)
        except Exception as e: log("ERROR", t[0], repr(e)[:300])
    for t in TABLES:
        try: ser += parse(*t)
        except Exception as e: log("ERROR", t[0], repr(e)[:300])
    ids = [s["id"] for s in ser]
    if len(ids) != len(set(ids)): raise SystemExit("ids repetidos: %s" % sorted({i for i in ids if ids.count(i) > 1})[:5])
    if len(ser) < 150: raise SystemExit("FALLO: pocas series (%d)" % len(ser))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"HU": {"name": "Hungary", "extend": True, "source": SRC, "series": sorted(ser, key=lambda s: s["id"])}}, "log": LOG[-25:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "hu-ksh-log.txt").write_text("\n".join(LOG) + "\n")
    print("series", len(ser))
main()

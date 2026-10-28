#!/usr/bin/env python3
"""Eslovaquia — base STATdata de la Oficina de Estadistica de la Republica Eslovaca (SUSR) -> data/sk-statdata-stats.json (countries.SK, extend)
Fuente: https://statdata.statistics.sk (API publica de datos abiertos: /public/api/dc/opendata/cube/dataset/<cubo>/download, zip con un CSV en ingles).
Licencia: CC BY 4.0 («All information is subject to the license terms of the Creative Commons Attribution License (cc-by) 4.0», pagina Open data de slovak.statistics.sk).
Cubos:
  sp1826ms  precios medios mensuales de productos agrarios (desde 2018): cereales, oleaginosas, patata, hortaliza, fruta, ganado de abasto por clase SEUROP, leche, huevos.
  sp1011qs  precios trimestrales de suministros a la agricultura (desde 2015): abonos, piensos compuestos, semillas, fitosanitarios y servicios.
  pl2003rs  superficie cosechada, produccion y rendimiento por cultivo (anual, desde 1970).
  pl2016rs  censo ganadero a 31 de diciembre (anual, desde 1970).
  pl2015rs  reproduccion, produccion y rendimientos ganaderos (anual, desde 1970).
Los meses «1. - n.» y el trimestre «1. - 4. Q.» son acumulados del ano y se omiten; «.» = sin dato. Nada se estima.
Unidades: el cubo sp1826ms etiqueta como «Tonnes» los precios de aves, carpa y trucha (son EUR por tonelada; el cubo es de precios en euros) y como
«ton of butcher weight» la lana; se publican como EUR/t con nota. Una serie con <3 puntos o parada >3 anos no se publica."""
import csv, datetime, io, json, re, time, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "sk-statdata-stats.json"
URL = "https://statdata.statistics.sk/public/api/dc/opendata/cube/dataset/%s/download?lang=EN&type=CSV"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
SRC = {"name": "Statistical Office of the Slovak Republic (ŠÚ SR), STATdata (CC BY 4.0)", "url": "https://statdata.statistics.sk", "license": "CC BY 4.0"}
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a)); print(*a)

def get(code, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL % code, headers=H), timeout=180) as r:
                z = zipfile.ZipFile(io.BytesIO(r.read()))
            name = [n for n in z.namelist() if n.lower().endswith(".csv")][0]
            return z.read(name).decode("utf-8-sig")
        except Exception as e:
            log("  intento", i + 1, code, type(e).__name__, str(e)[:120])
            time.sleep(10 * (i + 1))
    raise RuntimeError("no se pudo descargar " + code)

def rows(code, name_col):
    """CSV sin comillas: si un nombre lleva comas, la fila trae columnas de mas y se recomponen en la columna del nombre."""
    rd = csv.reader(io.StringIO(get(code)))
    head = next(rd); k = head.index(name_col); out = []
    for r in rd:
        if not r: continue
        extra = len(r) - len(head)
        if extra > 0: r = r[:k] + [",".join(r[k:k + extra + 1])] + r[k + extra + 1:]
        if len(r) != len(head): continue
        out.append({h: v.replace("\xa0", " ").strip() for h, v in zip(head, r)})
    log(code, len(out), "filas")
    return out

def num(v):
    v = v.strip()
    if v in ("", ".", "..", "-", "x"): return None
    try: return float(v)
    except ValueError: return None

def slug(s, n=60): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:n].strip("-")
def clean(name):
    """«1111160101 Grain maize» -> «Grain maize» (se quita el codigo de la clasificacion) y se normalizan espacios."""
    return re.sub(r"\s+", " ", re.sub(r"^\d+\s+", "", name)).strip()

def series(sid, group, label, unit, freq, pts, sg, note=None):
    pts = sorted((p, v) for p, v in pts.items() if v is not None)
    if len(pts) < 3: return None
    last = pts[-1][0]; yr = int(last[:4])
    if datetime.date.today().year - yr > 3: return None
    prev = pts[-2][1]
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": last, "latest": pts[-1][1],
         "changePct": round((pts[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pts], "sourceGroup": sg}
    if note: s["periodNote"] = note
    return s

UNIT_1826 = {"Eur / t": "EUR/t", "Eur / piece": "EUR/head", "eur / ton of butcher weight": "EUR/t carcass weight", "eur / ton of living weight": "EUR/t live weight",
             "Tonnes": "EUR/t", "eur / thous.l": "EUR/1000 l", "eur / thous. pieces": "EUR/1000 eggs"}
NOTE_UNIT = "ŠÚ SR labels the unit of this price as «%s»; the cube holds average prices in euros, so it is shown as EUR per tonne."

def prices_monthly(out):
    data = {}
    for r in rows("sp1826ms", "e_agroprod"):
        m = r["e_month"].rstrip(".")
        if not m.isdigit(): continue          # «1. - n.» = acumulado del ano
        key = (r["e_agroprod"], r["e_unit"])
        data.setdefault(key, {})["%s-%02d" % (r["e_year"], int(m))] = num(r["value"])
    for (raw, unit), pts in data.items():
        code = raw.split()[0]; name = clean(raw)
        if code.startswith(("11121", "11122")): g = "prices_fv"       # hortaliza, fruta, uva
        elif code.startswith("11123"): g = "prices"                  # plantones de frutales
        elif code.startswith(("11221", "11222")): g = "milk"         # leche de vaca y de oveja
        elif code.startswith("112"): g = "prices_lv"                 # ganado, aves, huevos, lana
        elif code.startswith("12"): g = "fish"
        else: g = "prices"
        u = UNIT_1826.get(unit, unit)
        if u == "EUR/head" and code.startswith("11123"): u = "EUR/tree"
        note = None
        if unit == "Tonnes" or (unit == "eur / ton of butcher weight" and "wool" in name.lower()):
            u = "EUR/t"; note = NOTE_UNIT % unit
        s = series("sk-sus-1826-" + code, g, "Average price: %s (%s, ŠÚ SR)" % (name, u), u, "monthly", pts, "ŠÚ SR STATdata sp1826ms", note)
        if s: out.append(s)

FERT = re.compile(r"(sulphate|amofos|dam - 390|dap|dasa|lad 27|npk|urea|potassium|limestone)", re.I)
FEED = re.compile(r"(feeding mixture|fodder salt)", re.I)
def inputs_quarterly(out):
    data = {}
    for r in rows("sp1011qs", "e_agroprice"):
        q = re.match(r"^(\d)\. Q\.$", r["e_quarter"])
        if not q: continue                    # «1. - 4. Q.» = media anual
        key = (re.sub(r"\s+", " ", r["e_agroprice"]).strip(), r["e_unit"])
        data.setdefault(key, {})["%s-Q%s" % (r["e_year"], q.group(1))] = num(r["value"])
    for (name, unit), pts in data.items():
        g = "inputs_f" if FERT.search(name) else "inputs_a" if FEED.search(name) else "inputs"
        u = {"Eur / t": "EUR/t", "Eur / kg": "EUR/kg", "Eur / l": "EUR/l", "eur / ha": "EUR/ha", "eur / 1 piece": "EUR/procedure",
             "eur / 1 batch": "EUR/dose", "eur / 1 seed unit": "EUR/seed unit", "eur / 1 appearance": "EUR/procedure"}.get(unit, unit)
        s = series("sk-sus-1011-" + slug(name), g, "Price of supplies to agriculture: %s (%s, ŠÚ SR)" % (name, u), u, "quarterly", pts, "ŠÚ SR STATdata sp1011qs")
        if s: out.append(s)

def crops_annual(out):
    data = {}
    for r in rows("pl2003rs", "e_agrocrops-areatype"):
        if not r["e_year"].isdigit(): continue
        data.setdefault((r["e_agrocrops-areatype"], r["e_indic"]), {})[r["e_year"]] = num(r["value"])
    IND = {"Harvested area": ("crops", "Harvested area", "ha", "area"), "Yields": ("production", "Production", "t", "prod"), "Hectare yields": ("crops", "Yield", "t/ha", "yield")}
    for (raw, ind), pts in data.items():
        if ind not in IND: continue
        g, lab, u, k = IND[ind]; name = clean(raw)
        code = raw.split()[0] if raw.split()[0].isdigit() else slug(raw, 30)
        s = series("sk-sus-2003-%s-%s" % (k, code), g, "%s: %s (%s, ŠÚ SR)" % (lab, name, u), u, "annual", pts, "ŠÚ SR STATdata pl2003rs")
        if s: out.append(s)

def livestock_annual(out):
    data = {}
    for r in rows("pl2016rs", "e_livestock"):
        if r["e_year"].isdigit(): data.setdefault(r["e_livestock"], {})[r["e_year"]] = num(r["value"])
    for raw, pts in data.items():
        code = raw.split()[0]; name = clean(raw)
        s = series("sk-sus-2016-" + code, "livestock", "Livestock, 31 December: %s (heads, ŠÚ SR)" % name, "heads", "annual", pts, "ŠÚ SR STATdata pl2016rs")
        if s: out.append(s)
    data = {}
    for r in rows("pl2015rs", "e_indic"):
        if r["e_year"].isdigit(): data.setdefault((r["e_indic"], r["e_unit"]), {})[r["e_year"]] = num(r["value"])
    U = {"Piece": "heads", "Thousand litres": "thousand litres", "Litre": "litres", "Kilogram": "kg", "Thousand pieces": "thousand eggs"}
    for (ind, unit), pts in data.items():
        u = U.get(unit, unit)
        if ind.startswith("Number of reared"): u = "head"
        if ind.startswith("Average number of eggs"): u = "eggs"
        if "daily weight gains" in ind: u = "g/day" if max(v for v in pts.values() if v is not None) > 50 else "kg/day"
        g = "milk" if "milk" in ind.lower() else "production"
        s = series("sk-sus-2015-" + slug(ind), g, "%s (%s, ŠÚ SR)" % (ind, u), u, "annual", pts, "ŠÚ SR STATdata pl2015rs")
        if s: out.append(s)

def main():
    out = []
    for f in (prices_monthly, inputs_quarterly, crops_annual, livestock_annual):
        n = len(out); f(out); log(f.__name__, len(out) - n, "series")
    ids = [s["id"] for s in out]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: raise SystemExit("ids repetidos: %s" % sorted(dup)[:5])
    if len(out) < 300: raise SystemExit("solo %d series: no se escribe" % len(out))
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"SK": {"name": "Slovakia", "extend": True, "source": SRC, "series": out}}, "log": LOG[-20:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    log("escrito", OUT.name, len(out), "series")

if __name__ == "__main__":
    main()

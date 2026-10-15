#!/usr/bin/env python3
"""data/cpi.json — índices de precios de consumo para deflactar precios («precios reales»).
Mensuales: Eurostat HICP (prc_hicp_midx, 2015=100) para los países de la UE y la UE; ONS CPI D7BT (2015=100) para el Reino Unido;
BLS CPI-U CUUR0000SA0 (1982-84=100) para EE. UU.; Statistics Canada, vector v41690973 (2002=100) para Canadá.
Anuales: Banco Mundial WDI (FP.CPI.TOTL, 2010=100), leídos de data/worldbank-agri.json (sin red).
Reglas: nunca se rellena ni se estima. Si una fuente falla, o devuelve datos que no pasan las comprobaciones (valor no positivo, salto mensual > 12 %),
se conserva el bloque anterior de ese país y queda anotado en el log. Un mes que no publica la fuente queda null.
Uso: python3 scripts/update-cpi.py [--fixtures DIR]   (con --fixtures lee eurostat.json, ons.csv, bls-*.json, statcan.json de DIR en vez de la red)"""
import csv, datetime, io, json, math, os, re, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "cpi.json"
LOG = []
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)"}
FIX = None
if "--fixtures" in sys.argv:
    FIX = Path(sys.argv[sys.argv.index("--fixtures") + 1])

EU_GEO = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "EU", "EA"]
MONTHS = {m: i + 1 for i, m in enumerate(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"])}
MAX_MOM = 0.12
START_YEAR = 2000


def log(m):
    LOG.append(datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S ") + m)
    print(m)


def http(url, body=None, tries=3):
    for i in range(tries):
        try:
            h = dict(UA)
            data = None
            if body is not None:
                data = json.dumps(body).encode()
                h["Content-Type"] = "application/json"
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=90) as r:
                return r.read().decode("utf-8-sig")
        except Exception as e:
            log("  error %s: %s" % (url[:90], e))
            time.sleep(3 * (i + 1))
    return None


def fixture(name):
    p = FIX / name
    return p.read_text(encoding="utf-8") if p.exists() else None


# ---------- parsers (puros: reciben texto, devuelven {periodo 'YYYY-MM': valor}) ----------
def parse_eurostat(text):
    """JSON-stat 2.0 de prc_hicp_midx -> {geo: {'YYYY-MM': valor}}"""
    d = json.loads(text)
    ids, sizes = d["id"], d["size"]
    cats = {}
    for dim in ids:
        ix = d["dimension"][dim]["category"]["index"]
        cats[dim] = ix if isinstance(ix, dict) else {c: i for i, c in enumerate(ix)}
    strides, s = {}, 1
    for dim, n in zip(reversed(ids), reversed(sizes)):
        strides[dim] = s
        s *= n
    vals = d["value"]
    get = (lambda k: vals.get(str(k))) if isinstance(vals, dict) else (lambda k: vals[k] if k < len(vals) else None)
    out = {}
    fixed = {}
    for dim in ids:
        if dim not in ("geo", "time") and len(cats[dim]) != 1:
            raise ValueError("dimensión %s con %d categorías: se esperaba una sola" % (dim, len(cats[dim])))
        if dim not in ("geo", "time"):
            fixed[dim] = 0
    for g, gi in cats["geo"].items():
        for t, ti in cats["time"].items():
            k = gi * strides["geo"] + ti * strides["time"]
            v = get(k)
            if v is not None:
                out.setdefault(g, {})[t] = float(v)
    return out


def parse_ons(text):
    out = {}
    for row in csv.reader(io.StringIO(text)):
        if len(row) < 2:
            continue
        a = row[0].strip().split()
        if len(a) == 2 and a[0].isdigit() and a[1].upper() in MONTHS:
            try:
                out["%s-%02d" % (a[0], MONTHS[a[1].upper()])] = float(row[1])
            except ValueError:
                pass
    return out


def parse_bls(texts):
    out = {}
    for text in texts:
        d = json.loads(text)
        if d.get("status") != "REQUEST_SUCCEEDED":
            raise ValueError("BLS: %s %s" % (d.get("status"), d.get("message")))
        for s in d["Results"]["series"]:
            for p in s["data"]:
                if p["period"].startswith("M") and p["period"] != "M13":
                    try:
                        out["%s-%s" % (p["year"], p["period"][1:])] = float(p["value"])
                    except ValueError:
                        pass
    return out


def parse_statcan(text):
    d = json.loads(text)
    r = d[0]
    if r.get("status") != "SUCCESS":
        raise ValueError("StatCan: %s" % r.get("status"))
    out = {}
    for p in r["object"]["vectorDataPoint"]:
        if p.get("value") not in (None, ""):
            out[p["refPer"][:7]] = float(p["value"])
    return out


def parse_indec(text):
    """API de series de datos.gob.ar (INDEC, IPC nacional, base dic-2016=100): {"data": [["2026-08-01", 12276.766], ...]} -> {'YYYY-MM': valor}"""
    d = json.loads(text)
    rows = d.get("data")
    if not isinstance(rows, list):
        raise ValueError("INDEC: respuesta sin 'data'")
    out = {}
    for r in rows:
        if isinstance(r, list) and len(r) >= 2 and r[1] is not None and re.match(r"^\d{4}-\d{2}-\d{2}$", str(r[0])):
            out[str(r[0])[:7]] = float(r[1])
    return out


# ---------- fuentes ----------
def src_eurostat():
    if FIX:
        t = fixture("eurostat.json")
    else:
        t = http("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx?format=JSON&lang=EN&unit=I15&coicop=CP00&sinceTimePeriod=%d-01" % START_YEAR)
    base = {g: v for g, v in parse_eurostat(t).items() if g in EU_GEO} if t else {}
    if len(base) < len(EU_GEO) - 3:  # la serie antigua ya no llega o falla: se parte de lo ya guardado (el empalme con la base 2025 necesita meses comunes)
        try:
            for g, c in json.loads(OUT.read_text(encoding="utf-8"))["countries"].items():
                if g in EU_GEO and g not in base and (c.get("m") or {}).get("src") == "eurostat":
                    base[g] = unpack(c["m"])
        except Exception:
            pass
    if not base:
        return {}
    # Desde 2026 Eurostat publica el HICP en base 2025=100 y con COICOP 2018 (prc_hicp_minr, el mismo conjunto que ya usan update-spain-hicp.py y
    # update-france-hicp.py); la serie 2015=100 de prc_hicp_midx se queda en 2025-12. Se enlaza la nueva con la vieja por los meses comunes.
    # El codigo del indice general en COICOP 2018 es TOTAL; se prueban alternativas por si el conjunto lo llama distinto.
    new = {}
    base_url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
    for ds, dim, code in (("prc_hicp_minr", "coicop18", "TOTAL"), ("prc_hicp_minr", "coicop18", "CP00"), ("prc_hicp_midx", "coicop", "CP00")):
        try:
            t2 = fixture("eurostat-i25.json") if FIX else http("%s%s?format=JSON&lang=EN&unit=I25&%s=%s&sinceTimePeriod=2025-01" % (base_url, ds, dim, code), tries=2)
            got = {g: v for g, v in parse_eurostat(t2).items() if g in EU_GEO} if t2 else {}
        except Exception as e:
            log("Eurostat %s %s=%s: no se pudo leer (%s)" % (ds, dim, code, e))
            got = {}
        if got:
            new = got
            log("Eurostat %s %s=%s (I25): %d paises, hasta %s" % (ds, dim, code, len(got), max(max(v) for v in got.values())))
            break
        if FIX:
            break
    for g, pts in new.items():
        if g in base:
            ext, f = rebase(base[g], pts)
            if ext:
                base[g] = dict(base[g], **ext)
                log("%s: I15 enlazado con I25 (factor %.4f, +%d meses hasta %s)" % (g, f, len(ext), max(ext)))
    return base


def rebase(old, new, min_overlap=6):
    """Enlaza una serie en base antigua con la misma en base nueva: factor = mediana de antigua/nueva en los meses comunes;
    devuelve ({mes: valor en base antigua} de los meses posteriores al último de la antigua, factor), o ({}, None) si no hay solape suficiente."""
    common = sorted(k for k in old if k in new and new[k] > 0)
    if len(common) < min_overlap:
        return {}, None
    r = sorted(old[k] / new[k] for k in common)
    f = r[len(r) // 2]
    last = max(old)
    return {k: round(v * f, 4) for k, v in new.items() if k > last}, f


def src_ons():
    t = fixture("ons.csv") if FIX else http("https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7bt/mm23")
    return parse_ons(t) if t else {}


def src_bls():
    texts = []
    now = datetime.date.today().year
    y = START_YEAR
    while y <= now:
        e = min(y + 9, now)
        if FIX:
            t = fixture("bls-%d.json" % y)
        else:
            t = http("https://api.bls.gov/publicAPI/v1/timeseries/data/", {"seriesid": ["CUUR0000SA0"], "startyear": str(y), "endyear": str(e)})
        if t:
            texts.append(t)
        y = e + 1
    return parse_bls(texts) if texts else {}


def src_statcan():
    t = fixture("statcan.json") if FIX else http("https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods", [{"vectorId": 41690973, "latestN": 360}])
    return parse_statcan(t) if t else {}


def src_indec():
    # solo desde ago-2024: antes la inflacion mensual supera el 12 % y la comprobacion de saltos descartaria la serie; basta para la interanual
    t = fixture("indec.json") if FIX else http("https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&start_date=2024-08-01&limit=200&format=json")
    return parse_indec(t) if t else {}


# ---------- comprobaciones y empaquetado ----------
def check(cc, pts):
    """Devuelve None si es válido, o el motivo."""
    if len(pts) < 24:
        return "menos de 24 meses"
    ks = sorted(pts)
    prev = None
    for k in ks:
        v = pts[k]
        if not math.isfinite(v) or v <= 0:
            return "valor no positivo en %s" % k
        if prev is not None:
            y0, m0 = map(int, prev[0].split("-"))
            y1, m1 = map(int, k.split("-"))
            if (y1 - y0) * 12 + (m1 - m0) == 1 and abs(v / prev[1] - 1) > MAX_MOM:
                return "salto mensual de %.1f %% en %s" % ((v / prev[1] - 1) * 100, k)
        prev = (k, v)
    return None


def pack(pts):
    ks = sorted(pts)
    y0, m0 = map(int, ks[0].split("-"))
    y1, m1 = map(int, ks[-1].split("-"))
    n = (y1 - y0) * 12 + (m1 - m0) + 1
    v = [None] * n
    for k in ks:
        y, m = map(int, k.split("-"))
        v[(y - y0) * 12 + (m - m0)] = round(pts[k], 4)
    return {"s": ks[0], "v": v}


def unpack(b):
    y, m = map(int, b["s"].split("-"))
    out = {}
    for i, v in enumerate(b["v"]):
        if v is not None:
            out["%04d-%02d" % (y + (m - 1 + i) // 12, (m - 1 + i) % 12 + 1)] = v
    return out


def main():
    old = {}
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        pass
    oc = old.get("countries", {})
    res = {}
    META = {
        "eurostat": ("Eurostat HICP, all items (prc_hicp_midx)", "2015=100"),
        "ons": ("ONS CPI index, all items (D7BT)", "2015=100"),
        "bls": ("BLS CPI-U, all items, U.S. city average, not seasonally adjusted (CUUR0000SA0)", "1982-84=100"),
        "statcan": ("Statistics Canada CPI, all-items, Canada (v41690973)", "2002=100"),
        "indec": ("INDEC IPC nacional, nivel general (serie 148.3_INIVELNAL_DICI_M_26, datos.gob.ar)", "dic-2016=100"),
    }
    monthly = {}
    for name, fn in (("eurostat", src_eurostat), ("ons", src_ons), ("bls", src_bls), ("statcan", src_statcan), ("indec", src_indec)):
        try:
            data = fn()
        except Exception as e:
            log("%s: fallo al leer (%s); se conserva lo anterior" % (name, e))
            data = {}
        if name == "eurostat":
            for g, pts in data.items():
                monthly[g] = (name, pts)
        elif data:
            monthly[{"ons": "UK", "bls": "US", "statcan": "CA", "indec": "AR"}[name]] = (name, data)
        else:
            log("%s: sin datos; se conserva lo anterior" % name)
    for cc, (name, pts) in monthly.items():
        why = check(cc, pts)
        if why:
            log("%s (%s): descartado, %s; se conserva lo anterior" % (cc, name, why))
            continue
        b = pack(pts)
        b.update({"src": name, "name": META[name][0], "base": META[name][1]})
        # no se pierde historia: los meses que la fuente ya no devuelva y teníamos se conservan
        prev = (oc.get(cc) or {}).get("m")
        if prev and prev.get("src") == name:
            merged = unpack(prev)
            merged.update(pts)
            if not check(cc, merged):
                nb = pack(merged)
                b["s"], b["v"] = nb["s"], nb["v"]
        res.setdefault(cc, {})["m"] = b
        log("%s: %s, %d meses hasta %s" % (cc, name, len([x for x in b["v"] if x is not None]), max(pts)))
    for cc, c in oc.items():  # países cuya fuente falló: se conserva el bloque anterior
        if "m" in c and "m" not in res.get(cc, {}):
            res.setdefault(cc, {})["m"] = c["m"]
    # anuales: Banco Mundial, de data/worldbank-agri.json
    try:
        wb = json.loads((ROOT / "data" / "worldbank-agri.json").read_text(encoding="utf-8"))
        for cc, c in wb["countries"].items():
            s = c.get("cpi")
            if s and s.get("v"):
                res.setdefault(cc, {})["a"] = {"src": "world_bank_wdi", "name": "World Bank WDI, consumer price index (FP.CPI.TOTL)", "base": "2010=100", "y0": s["y0"], "v": s["v"]}
    except Exception as e:
        log("anual: no se pudo leer worldbank-agri.json (%s); se conserva lo anterior" % e)
        for cc, c in oc.items():
            if "a" in c:
                res.setdefault(cc, {})["a"] = c["a"]
    if not res:
        log("sin ningún país: no se escribe nada")
        (ROOT / "data" / "cpi-log.txt").write_text("\n".join(LOG) + "\n")
        return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "note": "Índices de precios de consumo. m = mensual (s = primer mes, v = valores consecutivos, null = mes sin dato); a = anual (y0 = primer año). Cada bloque indica su fuente y su base; las bases de bloques distintos no son comparables entre sí.",
           "countries": {k: res[k] for k in sorted(res)}}
    txt = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    if OUT.exists():  # si solo cambia generatedAt, no se reescribe (evita commits vacíos)
        try:
            o = json.loads(OUT.read_text(encoding="utf-8"))
            o["generatedAt"] = doc["generatedAt"]
            if json.dumps(o, ensure_ascii=False, separators=(",", ":")) == txt:
                log("sin cambios")
                (ROOT / "data" / "cpi-log.txt").write_text("\n".join(LOG) + "\n")
                return 0
        except Exception:
            pass
    OUT.write_text(txt + "\n", encoding="utf-8")
    log("escrito %s (%d países)" % (OUT.name, len(res)))
    try:  # inflación interanual de la franja macro (scripts/macro_infl.py), a partir de lo recién escrito
        sys.path.insert(0, str(ROOT / "scripts"))
        import macro_infl
        mp = ROOT / "data" / "country-macro.json"
        macro = json.loads(mp.read_text(encoding="utf-8")); before = json.dumps(macro["countries"], sort_keys=True)
        n = macro_infl.patch(macro, doc)
        if json.dumps(macro["countries"], sort_keys=True) != before:
            mp.write_text(json.dumps(macro, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        log("inflación en country-macro.json: %d países" % n)
    except Exception as e:
        log("inflación: no se pudo actualizar country-macro.json (%s)" % e)
    (ROOT / "data" / "cpi-log.txt").write_text("\n".join(LOG) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Andalucía: precios agrarios semanales del Observatorio de Precios y Mercados de la Junta de Andalucía -> data/spain-prices/andalucia.json.

Fuente: formulario de datos abiertos del Observatorio (www.juntadeandalucia.es/agriculturaypesca/observatorio, acción «OpenData»), que devuelve
un CSV (';') con INICIO;FIN;GRUPO;SECTOR;SUBSECTOR;PRODUCTO;TIPO;SUBTIPO;POSICION;CATEGORIA;FORMATO;CANAL;PRECIO;UNIDAD.
El conjunto está en el catálogo de datos abiertos de la Junta («Precios agrarios en el Observatorio de Precios y Mercados»,
https://www.juntadeandalucia.es/datosabiertos/portal/dataset/precios-agrarios-en-el-observatorio-de-precios-y-mercados) con licencia CC BY 4.0.
Los precios los aportan operadores (empresas) al Observatorio; se publican tal cual, en la posición comercial y unidad que indica la fuente.

Una serie = producto + tipo + subtipo + posición comercial + categoría + formato + canal + unidad. Semanas: lunes (INICIO de la fuente; siempre lunes).
Primera ejecución: baja desde 2019 año a año. Después: baja el año anterior y el actual y los funde con el histórico del fichero (lo nuevo manda:
la fuente puede revisar semanas recientes). Una serie que deja de aparecer conserva su histórico.
Series con menos de 8 precios en total se omiten. Precio 0 o negativo = sin dato (se cuenta en el registro).
Uso: update-es-andalucia-prices.py [--out DIR] [--from AAAA] [--csv FICHERO]   (--csv: lee un CSV ya bajado, para pruebas sin red)"""
import csv, datetime, hashlib, io, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request, http.cookiejar
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.juntadeandalucia.es/agriculturaypesca/observatorio/servlet/FrontController"
DATASET = "https://www.juntadeandalucia.es/datosabiertos/portal/dataset/precios-agrarios-en-el-observatorio-de-precios-y-mercados"
SUBSECTORES = ["20", "10", "19", "21", "34", "35", "33", "60", "946728", "32", "30", "31", "50", "110", "140", "131", "655486", "1472760", "647048", "678579"]
POSICIONES = "0,5,7,2291331,2214443,2291332,6,2291333,1,10,21,2214444,2,22,2214442,3332194,3"
FIRST_YEAR = 2019
MINPTS = 8
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def opener():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [("User-Agent", "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)")]
    op.open(URL + "?ec=default&action=Static&url=openData.jsp&page=1", timeout=120).read()   # sesión (cookie) como en el navegador
    return op
def fetch_year(op, y, last_week):
    data = [("ec", "default"), ("action", "OpenData"), ("tiposPrecio", "-1,0"), ("listPosComercial", POSICIONES), ("desglose", "subtipo"),
            ("AnnoInicial", str(y)), ("SemanaInicial", "1"), ("AnnoFinal", str(y)), ("SemanaFinal", str(last_week)), ("nivel", "subtipo")] + [("SUBSECTORES", s) for s in SUBSECTORES]
    body = urllib.parse.urlencode(data).encode()
    last = None
    for i in range(3):
        try:
            r = op.open(urllib.request.Request(URL, data=body, method="POST"), timeout=600)
            txt = r.read().decode("utf-8-sig")
            if not txt.startswith("INICIO;FIN;"): raise ValueError("respuesta inesperada: %r" % txt[:120])
            return txt
        except Exception as e: last = e; time.sleep(10 * (i + 1))
    raise RuntimeError("año %s: %r" % (y, last))
def slug(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
SKIP = {"NO DESIGNADO", "SIN ESPECIFICAR", "SIN ESPECIFICAR (ECO)", ""}
def cap(s):
    """«TOMATE» -> «Tomate»; «LAMPANTE (1 g)» -> «Lampante (1 g)»: si dominan las mayúsculas se pasa a minúsculas con inicial mayúscula."""
    s = s.strip(); up = sum(c.isupper() for c in s); lo = sum(c.islower() for c in s)
    return s[:1].upper() + s[1:].lower() if up > lo else s
def name_of(k):
    prod, tipo, sub, pos, cat, fmt, canal, unit = k
    parts = [cap(prod)] + [cap(x) for x in (tipo, sub) if x.strip().upper() not in SKIP and x.strip().upper() != prod.strip().upper()]
    extra = []
    if cat.strip() and cat.strip().upper() not in SKIP: extra.append(("cat. " + cat.strip()) if re.match(r"^(I{1,3}|EXTRA)\b", cat.strip().upper()) else cat.strip().lower())   # categoría comercial (I, II) o, en ganado, sexo/clase
    if fmt.strip() and fmt.strip().upper() not in SKIP and fmt.strip().lower() != "sin especificar": extra.append(fmt.strip().lower())
    if canal.strip(): extra.append(canal.strip())
    return ", ".join(parts) + (" (" + "; ".join(extra) + ")" if extra else "")
UNITS = {"Euros/kg": "€/kg", "Euros/t": "€/t", "Euros/100 kg vivo": "€/100 kg vivo", "Euros/100 kg en canal": "€/100 kg canal", "Euros/100 l": "€/100 l"}
def parse(txt, acc, meta, stats):
    for x in csv.DictReader(io.StringIO(txt), delimiter=";"):
        try: d = datetime.datetime.strptime(x["INICIO"], "%d/%m/%Y").date()
        except Exception: stats["bad_date"] += 1; continue
        if d.weekday() != 0: stats["not_monday"] += 1; continue
        try: v = float(x["PRECIO"].replace(",", "."))
        except Exception: stats["bad_price"] += 1; continue
        if v <= 0: stats["nonpositive"] += 1; continue
        k = tuple((x[c] or "").strip() for c in ("PRODUCTO", "TIPO", "SUBTIPO", "POSICION", "CATEGORIA", "FORMATO", "CANAL", "UNIDAD"))
        acc.setdefault(k, {})[d.isoformat()] = v
        meta[k] = ((x["SECTOR"] or "").strip(), (x["SUBSECTOR"] or "").strip())
def sid_of(k):
    base = "and-" + slug(" ".join(p for p in (k[0], k[1], k[2], k[3], k[4], k[5], k[6]) if p and p.upper() not in SKIP))
    return base[:90] + "-" + hashlib.sha1("|".join(k).encode("utf-8")).hexdigest()[:6]
def main():
    outdir = ROOT / "data" / "spain-prices"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    path = outdir / "andalucia.json"
    old = None
    if path.exists():
        try: old = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e: log("AVISO: no se pudo leer el fichero anterior:", e)
    today = datetime.date.today(); iso = today.isocalendar()
    acc, meta = {}, {}
    stats = {"bad_date": 0, "not_monday": 0, "bad_price": 0, "nonpositive": 0}
    if "--csv" in sys.argv:
        parse(Path(sys.argv[sys.argv.index("--csv") + 1]).read_text(encoding="utf-8-sig"), acc, meta, stats)
    else:
        y0 = int(sys.argv[sys.argv.index("--from") + 1]) if "--from" in sys.argv else (today.year - 1 if old else FIRST_YEAR)
        op = opener()
        for y in range(y0, today.year + 1):
            lw = iso[1] if y == iso[0] else (53 if datetime.date(y, 12, 28).isocalendar()[1] == 53 else 52)
            try: txt = fetch_year(op, y, lw)
            except Exception as e: log("ERROR:", e); return 1
            n0 = sum(len(v) for v in acc.values()); parse(txt, acc, meta, stats); log("año %d: %d precios" % (y, sum(len(v) for v in acc.values()) - n0))
    log("filas descartadas:", stats)
    if sum(len(v) for v in acc.values()) < 1000: log("ERROR: muy pocos precios (%d); no se escribe nada" % sum(len(v) for v in acc.values())); return 1
    # fundir con el histórico anterior
    series = {}
    if old:
        W = old["weeks"]
        for s in old["series"]:
            k = tuple(s["key"]); series[k] = {W[i]: v for i, v in enumerate(s["v"]) if v is not None}; meta.setdefault(k, (s.get("sectorGroup") or "", s.get("sector") or ""))
    for k, pts in acc.items(): series.setdefault(k, {}).update(pts)
    series = {k: v for k, v in series.items() if len(v) >= MINPTS}
    weeks = sorted({w for v in series.values() for w in v})
    if not weeks: log("ERROR: sin semanas"); return 1
    # semanas continuas (lunes a lunes) para que el gráfico tenga huecos donde no hay precio
    d = datetime.date.fromisoformat(weeks[0]); end = datetime.date.fromisoformat(weeks[-1]); W = []
    while d <= end: W.append(d.isoformat()); d += datetime.timedelta(days=7)
    out, ids = [], set()
    for k in sorted(series, key=lambda k: (meta[k][1], name_of(k))):
        sid = sid_of(k)
        if sid in ids: log("ERROR: id repetido", sid); return 1
        ids.add(sid); p = series[k]
        out.append({"id": sid, "name": name_of(k), "unit": UNITS.get(k[7], k[7]), "sector": meta[k][1], "sectorGroup": meta[k][0], "pos": k[3], "key": list(k), "v": [p.get(w) for w in W]})
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "junta_andalucia_observatorio", "name": "Junta de Andalucía, Observatorio de Precios y Mercados", "url": DATASET, "license": "CC BY 4.0"},
           "weeks": W, "weekDefinition": "lunes de la semana; los precios cubren lunes a domingo",
           "note": "Precios aportados por operadores al Observatorio de Precios y Mercados de la Junta de Andalucía, en la posición comercial («pos») y la unidad indicadas. Un valor null es semana sin precio publicado.",
           "series": out, "log": LOG[-20:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp"); tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, path)
    log("escrito: %d series, %d semanas (%s a %s)" % (len(out), len(W), W[0], W[-1]))
    return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "spain-andalucia-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

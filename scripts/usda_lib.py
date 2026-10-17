"""Utilidades comunes de los procesos USDA nuevos (WASDE, previsiones de precio ERS, carne y ganado ERS, leche FMMO, transformacion NASS).
 - get(): descarga con reintentos; con --local DIR (solo pruebas) lee del disco el fichero con el mismo nombre en lugar de ir a la red.
 - Nada se estima: los scripts solo copian lo publicado; lo que falta queda como hueco.
 - Escritura atomica: un script que no valida su resultado NO toca el fichero anterior."""
import json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
LOG = []
LOCAL = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def parse_args(argv=None):
    """--local DIR (pruebas sin red) y --out DIR (escribe en otra carpeta). Devuelve (local, out)."""
    global LOCAL
    a = list(sys.argv[1:] if argv is None else argv); out = None
    if "--local" in a: LOCAL = Path(a[a.index("--local") + 1])
    if "--out" in a: out = Path(a[a.index("--out") + 1])
    return LOCAL, out
def get(url, tries=3, timeout=180, accept=None):
    """Bytes de la URL. Con --local, el fichero de nombre igual al ultimo tramo de la ruta (sin parametros)."""
    if LOCAL is not None:
        name = os.path.basename(urllib.parse.urlparse(url).path) or "index.html"
        p = LOCAL / name
        if p.exists(): return p.read_bytes()
        raise RuntimeError("sin copia local de " + name)
    h = dict(UA)
    if accept: h["Accept"] = accept
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout) as r: return r.read()
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s: %r" % (url, last))
def find_link(page_url, pattern, base=None):
    """Primer enlace de la pagina cuyo href cumple el patron (el numero de fichero de ERS cambia en cada actualizacion). Devuelve URL absoluta o None."""
    html = get(page_url, timeout=90).decode("utf-8", "replace")
    for m in re.finditer(r'href="([^"]+)"', html):
        u = m.group(1).replace("&amp;", "&")
        if re.search(pattern, u, re.I): return urllib.parse.urljoin(base or page_url, u)
    return None
def fnum(v):
    if v is None: return None
    s = str(v).strip().replace(",", "")
    if s in ("", "NA", "N/A", "(D)", "(NA)", "(S)", "(X)", "-", "--"): return None
    try:
        x = float(s)
        return x if x == x and abs(x) != float("inf") else None
    except ValueError: return None
def now_iso(): return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def write_json(path, doc, pretty=False):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    txt = json.dumps(doc, ensure_ascii=False, separators=None if pretty else (",", ":"), indent=1 if pretty else None) + "\n"
    tmp = path.with_suffix(path.suffix + ".tmp"); tmp.write_text(txt, encoding="utf-8"); os.replace(tmp, path)
def write_log(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(LOG) + "\n", encoding="utf-8")
MON = {m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}
def mon_num(s):
    """'Sep', 'September', 'sep' -> 9; None si no es un mes."""
    return MON.get((s or "").strip().lower()[:3]) if re.match(r"^[A-Za-z]{3,9}\.?$", (s or "").strip()) else None
def mk_series(sid, group, label, unit, freq, pts, source_group, min_points=3, max_age_years=3, keep=None, note=None):
    """Serie en el formato comun de los *-stats.json. pts = [(periodo, valor)]; duplicados: gana el ultimo. Se descarta (y se registra) si tiene pocos puntos o esta muerta."""
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    rows = [[p, round(v, 4)] for p, v in sorted(d.items())]
    if keep: rows = rows[-keep:]
    if len(rows) < min_points or int(rows[-1][0][:4]) < datetime.now(timezone.utc).year - max_age_years:
        log("descartada %s: %d puntos, ultimo %s" % (sid, len(rows), rows[-1][0] if rows else "-")); return None
    prev = rows[-2][1]
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": rows[-1][0], "latest": rows[-1][1],
         "changePct": round((rows[-1][1] / prev - 1) * 100, 2) if prev else None, "points": rows, "sourceGroup": source_group}
    if note: s["periodNote"] = note
    return s
def slug(s, n=48): return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")[:n].strip("-")
def stats_doc(source_name, source_url, license_text, series, extra_log=None):
    """Envoltorio de un *-stats.json: countries.US con extend=True (se anade al catalogo de EE. UU.)."""
    return {"schemaVersion": 1, "generatedAt": now_iso(),
            "countries": {"US": {"name": "United States", "extend": True, "source": {"name": source_name, "url": source_url, "license": license_text}, "series": series}},
            "log": (extra_log if extra_log is not None else LOG[-40:])}

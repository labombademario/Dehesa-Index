#!/usr/bin/env python3
"""España: balances de cereales (MAPA, Subdirección General de Cultivos Herbáceos e Industriales y Aceite de Oliva, «Balances de cereales de España»)
-> data/spain-balances/cereals.json.

Fuente: un PDF por campaña de comercialización (1 jul - 30 jun) en la pagina «balances-de-gestion-de-cereales» del MAPA, desde 2016/17. Cada PDF trae una tabla con ocho cereales
(trigo blando, trigo duro, cebada, maiz, centeno, avena, sorgo, triticale) y el total: superficie, rendimiento, produccion, existencias iniciales, importaciones, disponibilidades,
consumo interno (pienso, semillas, alimentacion humana, usos industriales, de los cuales bioetanol, perdidas), exportaciones, utilizaciones y existencias finales (miles de t).
Se leen con `pdftotext -layout`. Las celdas vacias del PDF son null (nunca cero); las columnas se asignan por el borde derecho de los numeros, no por orden de aparicion.
Nada se estima ni se completa. Si una tabla no cuadra (disponibilidades = existencias iniciales + produccion + importaciones; utilizaciones = consumo + exportaciones;
existencias finales = disponibilidades - utilizaciones; total = suma de cereales) no se escribe nada. El estado de cada campaña («estimación», «provisional») es el que pone el PDF; si no pone ninguno queda null.
--local AAAA:fichero.pdf lee un PDF local (pruebas); AAAA = año en que empieza la campaña."""
import argparse, datetime, json, os, re, subprocess, sys, tempfile, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-balances"
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/cereales/balances-de-gestion-de-cereales"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
CEREALS = ["wheat_soft", "wheat_durum", "barley", "maize", "rye", "oats", "sorghum", "triticale", "total"]
# etiqueta normalizada (sin tildes, sin «A. ») -> clave
ROWS = [("superficie", "area"), ("rendimiento", "yield"), ("produccion", "production"), ("existencias iniciales", "beginningStocks"), ("importaciones", "imports"),
        ("total disponibilidades", "totalSupply"), ("consumo interno", "consumption"), ("alimentacion animal", "feed"), ("semillas", "seed"), ("alimentacion humana", "food"),
        ("usos industriales", "industrial"), ("de los cuales a bioetanol", "bioethanol"), ("perdidas", "losses"), ("exportaciones", "exports"),
        ("total utilizaciones", "totalUse"), ("existencias finales", "endingStocks")]
ITEMS = [k for _, k in ROWS]
SUMMABLE = [k for k in ITEMS if k != "yield"]  # el total del PDF es la suma de los cereales (salvo rendimiento)
NUM = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def http(url, method="GET", tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read() if method == "GET" else dict(r.headers)
        except Exception as e:
            last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s %s -> %s" % (method, url, str(last)[:160]))

def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"^\s*[a-c]\.\s*", "", s); return re.sub(r"\s+", " ", s).strip()

def num(tok):
    return float(tok.replace(".", "").replace(",", "."))

def pdf_links(html):
    """[(url, campaña de inicio)] de los PDF de balances de cereales de la pagina (el año sale del nombre del fichero: ..._AAAA_AA.pdf)."""
    out = {}
    for h in re.findall(r'href="([^"]+balances[^"]*cereales[^"]*\.pdf)"', html):
        m = re.search(r"_(\d{4})_(\d{2})\.pdf$", h)
        if not m: log("enlace sin campaña, se ignora:", h[-80:]); continue
        y = int(m.group(1))
        if int(m.group(2)) != (y + 1) % 100: log("campaña incoherente en el nombre, se ignora:", h[-80:]); continue
        out[y] = h if h.startswith("http") else SITE + h
    return out

def parse_text(text, year):
    """Texto de pdftotext -layout -> {status, edition, v:{cereal:{item: valor|None}}}. Lanza ValueError si la tabla no es la esperada."""
    lines = text.splitlines()
    m = re.search(r"Campa[ñn]a\s+(\d{4})/(\d{4})\s*(?:\(([^)]*)\))?", text)
    if not m or int(m.group(1)) != year or int(m.group(2)) != year + 1: raise ValueError("el PDF no es de la campaña %d/%d" % (year, year + 1))
    status = (m.group(3) or "").strip().lower() or None
    ed = re.search(r"^\s*(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{4})\s*$", text, re.I | re.M)
    rows = {}
    for ln in lines:
        lab = re.match(r"^\s*(?:[A-C]\.\s*)?([A-Za-zÁÉÍÓÚáéíóúñÑ ()/\.0-9]+?)\s{2,}(?=[\d])", ln) or re.match(r"^\s*(de los cuales a bioetanol)\s+", ln, re.I)
        if not lab: continue
        key = None; n = norm(lab.group(1)); n = re.sub(r"\s*\(.*$", "", n)
        for k, v in ROWS:
            if n == k: key = v
        if not key: continue
        body = ln[lab.end():]
        toks = [(mm.end() + lab.end(), num(mm.group(0))) for mm in NUM.finditer(body)]
        if key in rows: raise ValueError("fila repetida: " + key)
        rows[key] = toks
    miss = [k for k in ITEMS if k not in rows]
    if miss: raise ValueError("faltan filas: %s" % miss)
    ref = [e for e, _ in rows["totalSupply"]]
    if len(ref) != len(CEREALS): raise ValueError("la fila de disponibilidades no trae %d columnas" % len(CEREALS))
    gap = min(b - a for a, b in zip(ref, ref[1:]))
    v = {c: {} for c in CEREALS}
    for k in ITEMS:
        used = {}
        for e, x in rows[k]:
            j = min(range(len(ref)), key=lambda i: abs(ref[i] - e))
            if abs(ref[j] - e) > gap / 2 or j in used: raise ValueError("columna ambigua en %s (borde %d)" % (k, e))
            used[j] = x
        for j, c in enumerate(CEREALS): v[c][k] = used.get(j)
    return {"status": status, "edition": (ed.group(1).capitalize() + " " + ed.group(2)) if ed else None, "v": v}

def tol(x): return 3 + 0.001 * abs(x or 0)

def validate(camps):
    """(errores, avisos, notas). Errores (bloquean): cualquier cereal cuyas cifras no cuadran. Notas: la columna TOTAL del propio PDF no cuadra con la suma de los cereales o con sus identidades
    (pasa en 2019/20: el consumo total publicado incluye otros 800 kt que ningun cereal trae; y el bioetanol del maiz en 2025/26 supera al total). Se publica tal cual y se deja la nota."""
    errs = []; warns = []; notes = {y: [] for y in camps}
    for y, c in sorted(camps.items()):
        V = c["v"]; lab = "%d/%02d" % (y, (y + 1) % 100)
        for cer in CEREALS:
            d = V[cer]; tag = "%s %s" % (cer, lab); bad = errs if cer != "total" else None
            for k, x in d.items():
                if x is not None and x < 0: errs.append("%s %s: valor negativo" % (tag, k))
            def g(k): return d[k] or 0
            def chk(msg, item, printed, comp, t):
                if printed is None or abs(comp - printed) <= t: return
                if bad is not None: bad.append("%s: %s" % (tag, msg))
                else: notes[y].append({"item": item, "printed": printed, "computed": round(comp, 1), "rule": msg})
            chk("disponibilidades != existencias iniciales + produccion + importaciones", "totalSupply", d["totalSupply"], g("beginningStocks") + g("production") + g("imports"), tol(d["totalSupply"]))
            chk("utilizaciones != consumo + exportaciones", "totalUse", d["totalUse"], g("consumption") + g("exports"), tol(d["totalUse"]))
            chk("existencias finales != disponibilidades - utilizaciones", "endingStocks", d["endingStocks"], g("totalSupply") - g("totalUse"), tol(d["totalSupply"]))
            chk("consumo interno != suma de sus partidas", "consumption", d["consumption"], g("feed") + g("seed") + g("food") + g("industrial") + g("losses"), tol(d["consumption"]))
            if d["area"] and d["yield"] and d["production"] and cer != "total" and abs(d["area"] * d["yield"] - d["production"]) > 0.12 * d["production"] + 5: warns.append("%s: produccion lejos de superficie x rendimiento" % tag)
        for k in SUMMABLE:
            if k == "bioethanol": continue
            parts = [V[cer][k] for cer in CEREALS[:-1]]
            if V["total"][k] is None: continue
            sm = sum(p or 0 for p in parts)
            if abs(sm - V["total"][k]) > tol(V["total"][k]) + 5: notes[y].append({"item": k, "printed": V["total"][k], "computed": round(sm, 1), "rule": "total != suma de los cereales"})
        be = [V[cer]["bioethanol"] for cer in CEREALS[:-1] if V[cer]["bioethanol"] is not None]
        if be and V["total"]["bioethanol"] is not None and abs(sum(be) - V["total"]["bioethanol"]) > tol(V["total"]["bioethanol"]): notes[y].append({"item": "bioethanol", "printed": V["total"]["bioethanol"], "computed": round(sum(be), 1), "rule": "total != suma de los cereales"})
    for y in sorted(camps):
        if y - 1 in camps:
            for cer in CEREALS:
                a, b = camps[y - 1]["v"][cer]["endingStocks"], camps[y]["v"][cer]["beginningStocks"]
                if a is not None and b is not None and abs(a - b) > tol(a): warns.append("%s: existencias iniciales %d/%02d (%s) != finales de la campaña anterior (%s)" % (cer, y, (y + 1) % 100, b, a))
    return errs, warns, notes

def pdftext(blob):
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "b.pdf"; p.write_bytes(blob)
        return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def write_json(path, obj):
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--local", action="append", default=[]); ap.add_argument("--out"); ap.add_argument("--force", action="store_true"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "cereals.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None
    blobs = {}; meta = {}
    if a.local:
        for s in a.local: y, f = s.split(":", 1); blobs[int(y)] = Path(f).read_bytes(); meta[int(y)] = {"url": None, "size": len(blobs[int(y)])}
    else:
        try: links = pdf_links(http(PAGE).decode("utf-8", "replace"))
        except Exception as e: log("ERROR: no se pudo leer la pagina:", e); return 1
        if len(links) < 5: log("ERROR: la pagina trae solo %d balances (se esperan 10 o mas); no se escribe nada" % len(links)); return 1
        for y, u in sorted(links.items()):
            prev = (old or {}).get("campaigns", {}).get(str(y))
            try: h = http(u, "HEAD"); sig = {"size": int(h.get("Content-Length") or 0), "lastModified": h.get("Last-Modified")}
            except Exception as e: log("HEAD fallo para %d, se descarga:" % y, e); sig = None
            if prev and sig and not a.force and prev.get("size") == sig["size"] and prev.get("lastModified") == sig["lastModified"] and sig["size"]: meta[y] = dict(sig, url=u, keep=True); continue
            try: blobs[y] = http(u); meta[y] = dict(sig or {"size": len(blobs[y]), "lastModified": None}, url=u)
            except Exception as e: log("ERROR: no se pudo bajar %d:" % y, e); return 1
    camps = {}
    for y, p in ((int(k), v) for k, v in (old or {}).get("campaigns", {}).items()):
        if y in meta and meta[y].get("keep"): camps[y] = p
    for y, b in sorted(blobs.items()):
        try: r = parse_text(pdftext(b), y)
        except Exception as e: log("ERROR al leer %d/%02d: %s; no se escribe nada" % (y, (y + 1) % 100, e)); return 1
        r.update({"label": "%d/%02d" % (y, (y + 1) % 100), "pdf": meta[y].get("url"), "size": meta[y].get("size"), "lastModified": meta[y].get("lastModified")}); camps[y] = r
    if not camps: log("ERROR: sin campañas"); return 1
    errs, warns, notes = validate(camps)
    for y in camps: camps[y]["notes"] = notes[y]
    for w in warns: log("AVISO:", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    if not blobs and old: old["checkedAt"] = now(); write_json(path, old); log("sin cambios en los PDF"); return 0
    t = now()
    write_json(path, {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": PAGE}, "unit": "miles de toneladas (superficie en miles de ha, rendimiento en t/ha)", "marketingYear": "1 jul - 30 jun",
                      "cereals": CEREALS, "items": ITEMS, "campaigns": {str(y): camps[y] for y in sorted(camps)}})
    log("OK: campañas %s" % ", ".join(camps[y]["label"] for y in sorted(camps))); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-balances-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

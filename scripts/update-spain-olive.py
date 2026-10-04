#!/usr/bin/env python3
"""España: balance del sector del olivar (MAPA, Subdirección General de Cultivos Herbáceos e Industriales y Aceite de Oliva) y aforo de producción de aceite de oliva
-> data/spain-balances/olive.json.

Fuente: PDF por campaña en la pagina «aceite-oliva-y-aceituna-mesa/balances» del MAPA. Cada PDF trae tres columnas (aceite de oliva, aceite de orujo de oliva, aceituna de mesa; miles de t):
existencias iniciales, produccion, importaciones (con desglose UE-27/extra UE-27 en los definitivos), total, mercado interior, exportaciones (idem), ajustes y perdidas (solo aceituna de mesa),
existencias finales, total. Campaña del aceite y el orujo: 1 oct - 30 sep; aceituna de mesa: 1 sep - 31 ago. La campaña, el estado (provisional, definitivo, estimación) y el mes de actualizacion salen del texto del PDF.
Si una campaña tiene varios PDF se queda el definitivo, y entre iguales el de actualizacion mas reciente. Tambien se lee el «Aforo de producción de aceite de oliva» de la campaña que empieza (estimacion por comunidad autonoma,
publicada el 1 de octubre; es una ESTIMACION, no una produccion medida): si el aforo no se puede leer se conserva el anterior y se avisa, sin bloquear los balances.
Se leen con `pdftotext -layout`; columnas por el borde derecho de los numeros; celdas vacias o «-» = null. Nada se estima. Si un balance no cuadra no se escribe nada.
--local AAAA:fichero.pdf (balance) y --aforo fichero.pdf leen ficheros locales (pruebas)."""
import argparse, datetime, json, os, re, subprocess, sys, tempfile, time, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-balances"
SITE = "https://www.mapa.gob.es"
PAGE = SITE + "/es/agricultura/temas/producciones-agricolas/aceite-oliva-y-aceituna-mesa/balances"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
PRODUCTS = ["oil", "pomace", "tableOlive"]
ITEMS = ["beginningStocks", "production", "imports", "importsEU", "importsNonEU", "totalSupply", "domestic", "exports", "exportsEU", "exportsNonEU", "lossesAdj", "endingStocks", "totalUse"]
NUM = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?")
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, method="GET", tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as r: return r.read() if method == "GET" else dict(r.headers)
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s %s -> %s" % (method, url, str(last)[:160]))
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[\s\-]+$", "", s.strip()); return re.sub(r"\s+", " ", re.sub(r"(?<=[a-zñ\)])\d+$", "", s)).strip()
def num(tok): return float(tok.replace(".", "").replace(",", "."))
def pdftext(blob):
    with tempfile.TemporaryDirectory() as t:
        p = Path(t) / "b.pdf"; p.write_bytes(blob)
        return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout

def pdf_links(html):
    bal, aforo = [], None
    for h in dict.fromkeys(re.findall(r'href="([^"]+\.pdf)"', html)):
        if "/balances/" not in h: continue
        u = h if h.startswith("http") else SITE + h
        if "aforo" in h.lower(): aforo = u
        elif "balance" in h.lower(): bal.append(u)
    return bal, aforo

def parse_balance(text):
    """-> {campaign (año de inicio), label, status, update, v:{product:{item: valor|None}}}. ValueError si no es la tabla esperada."""
    m = re.search(r"Campa[ñn]a\s+(\d{4})/(\d{4})", text, re.I)
    if not m or int(m.group(2)) != int(m.group(1)) + 1: raise ValueError("sin campaña")
    y = int(m.group(1))
    st = re.search(r"(provisional|definitiv|estimaci)", text[:text.find("Existencias")], re.I)
    status = None
    if st: status = {"provisional": "provisional", "definitiv": "definitivo", "estimaci": "estimación"}[st.group(1).lower()]
    up = re.search(r"Actualizaci[oó]n\s+(%s)\s+(\d{4})" % "|".join(MONTHS), text, re.I)
    update = "%s-%02d" % (up.group(2), MONTHS.index(up.group(1).lower()) + 1) if up else None
    rows = []; seen_total = 0; ctx = None
    for ln in text.splitlines():
        lab = re.match(r"^\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\.\-() 0-9]+?)\s{2,}(?=[\d])", ln)
        if not lab: continue
        n = norm(lab.group(1)); body = ln[lab.end():]
        toks = [(mm.end() + lab.end(), num(mm.group(0))) for mm in NUM.finditer(body)]
        if not toks: continue
        if n == "existencias iniciales (a 1 octubre)": n = "existencias iniciales"
        key = None
        if n == "existencias iniciales": key = "beginningStocks"
        elif n == "produccion": key = "production"
        elif n == "importaciones": key = "imports"; ctx = "imports"
        elif n == "exportaciones": key = "exports"; ctx = "exports"
        elif n == "ue-27": key = ctx + "EU"
        elif n == "extra ue-27": key = ctx + "NonEU"
        elif n == "total recursos": key = "totalSupply"
        elif n == "total realizacion": key = "totalUse"
        elif n == "total": key = "totalSupply" if seen_total == 0 else "totalUse"; seen_total += 1
        elif n in ("consumo interior", "mercado interior"): key = "domestic"; ctx = None
        elif n == "ajustes y perdidas": key = "lossesAdj"; ctx = None
        elif n == "existencias finales": key = "endingStocks"; ctx = None
        if not key: continue
        if any(k == key for k, _ in rows): raise ValueError("fila repetida " + key)
        rows.append((key, toks))
    d = dict(rows)
    for need in ("beginningStocks", "production", "imports", "totalSupply", "domestic", "exports", "endingStocks", "totalUse"):
        if need not in d: raise ValueError("falta la fila " + need)
    ref = [e for e, _ in d["production"]]
    if len(ref) != 3: raise ValueError("la fila de producción no trae 3 columnas")
    gap = min(b - a for a, b in zip(ref, ref[1:]))
    v = {p: {k: None for k in ITEMS} for p in PRODUCTS}
    for k, toks in rows:
        used = {}
        for e, x in toks:
            j = min(range(3), key=lambda i: abs(ref[i] - e))
            if abs(ref[j] - e) > gap / 2 or j in used: raise ValueError("columna ambigua en %s" % k)
            used[j] = x
        for j, p in enumerate(PRODUCTS): v[p][k] = used.get(j)
    return {"campaign": y, "label": "%d/%02d" % (y, (y + 1) % 100), "status": status, "update": update, "v": v}

def validate(camps):
    errs = []; warns = []
    for y, c in sorted(camps.items()):
        for p in PRODUCTS:
            d = c["v"][p]; tag = "%s %s" % (p, c["label"]); g = lambda k: d[k] or 0
            for k, x in d.items():
                if x is not None and x < 0: errs.append("%s %s: valor negativo" % (tag, k))
            if abs(g("beginningStocks") + g("production") + g("imports") - g("totalSupply")) > 0.5: errs.append("%s: total != existencias iniciales + produccion + importaciones" % tag)
            if abs(g("domestic") + g("exports") + g("lossesAdj") + g("endingStocks") - g("totalUse")) > 0.5: errs.append("%s: destino no suma el total" % tag)
            if abs(g("totalSupply") - g("totalUse")) > 0.5: errs.append("%s: total origen != total destino" % tag)
            if d["importsEU"] is not None and abs(g("importsEU") + g("importsNonEU") - g("imports")) > 0.5: errs.append("%s: importaciones UE + extra UE != total" % tag)
            if d["exportsEU"] is not None and abs(g("exportsEU") + g("exportsNonEU") - g("exports")) > 0.5: errs.append("%s: exportaciones UE + extra UE != total" % tag)
    for y in sorted(camps):
        if y - 1 in camps:
            for p in PRODUCTS:
                a, b = camps[y - 1]["v"][p]["endingStocks"], camps[y]["v"][p]["beginningStocks"]
                if a is not None and b is not None and abs(a - b) > 0.5: warns.append("%s: existencias iniciales %s (%s) != finales de la campaña anterior (%s)" % (p, camps[y]["label"], b, a))
    return errs, warns

def parse_aforo(text):
    """Tabla «Producción a nivel autonómico» del aforo -> {campaign, published, ccaa:[{name, mean6, previous, estimate}], total:{...}}"""
    m = re.search(r"AFORO NACIONAL CAMPA[ÑN]A\s+(\d{4})/(\d{4})", text)
    if not m or int(m.group(2)) != int(m.group(1)) + 1: raise ValueError("aforo sin campaña")
    pub = re.search(r"FECHA DE PUBLICACI[ÓO]N:\s*(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚ]+)\s+DE\s+(\d{4})", text)
    pdate = None
    if pub:
        mo = [x for x in MONTHS if x == unicodedata.normalize("NFC", pub.group(2).lower())]
        if mo: pdate = "%s-%02d-%02d" % (pub.group(3), MONTHS.index(mo[0]) + 1, int(pub.group(1)))
    i = text.find("Producción a nivel autonómico")
    if i < 0: raise ValueError("sin tabla autonómica")
    rows = []
    for ln in text[i:].splitlines():
        mm = re.match(r"^\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\.\- \*]+?)\s{2,}((?:-?\d{1,3}(?:\.\d{3})*|-?\d+)\s{2,}(?:-?\d{1,3}(?:\.\d{3})*|-?\d+)\s{2,}(?:-?\d{1,3}(?:\.\d{3})*|-?\d+))\s{2,}[\d,]+\s*%", ln)
        if not mm: continue
        a = [int(x.replace(".", "")) for x in re.split(r"\s{2,}", mm.group(2).strip())]
        rows.append({"name": mm.group(1).strip().rstrip("*").strip(), "mean6": a[0], "previous": a[1], "estimate": a[2]})
        if mm.group(1).strip().lower().startswith("total nacional"): break
    if not rows or not rows[-1]["name"].lower().startswith("total nacional"): raise ValueError("sin fila de total nacional")
    tot = rows.pop(); y = int(m.group(1))
    for k in ("mean6", "previous", "estimate"):
        if abs(sum(r[k] for r in rows) - tot[k]) > 3: raise ValueError("el aforo autonómico no suma el total nacional (%s)" % k)
    if len(rows) < 8: raise ValueError("pocas comunidades en el aforo")
    return {"campaign": y, "label": "%d/%02d" % (y, (y + 1) % 100), "published": pdate, "unit": "toneladas de aceite de oliva", "ccaa": rows, "total": {k: tot[k] for k in ("mean6", "previous", "estimate")}}

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def write_json(path, obj):
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)
def rank(c): return (1 if c["status"] == "definitivo" else 0, c["update"] or "")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--local", action="append", default=[]); ap.add_argument("--aforo"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "olive.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None
    texts = {}; aforo_text = None; aforo_url = None
    if a.local or a.aforo:
        for s in a.local: u, f = s.split(":", 1); texts[u] = (pdftext(Path(f).read_bytes()), None)
        if a.aforo: aforo_text = pdftext(Path(a.aforo).read_bytes())
    else:
        try: bal, aforo_url = pdf_links(http(PAGE).decode("utf-8", "replace"))
        except Exception as e: log("ERROR: no se pudo leer la pagina:", e); return 1
        if len(bal) < 4: log("ERROR: la pagina trae solo %d balances (se esperan 5 o mas); no se escribe nada" % len(bal)); return 1
        for u in bal:
            try: texts[u] = (pdftext(http(u)), u)
            except Exception as e: log("ERROR: no se pudo leer %s: %s" % (u[-60:], e)); return 1
        if aforo_url:
            try: aforo_text = pdftext(http(aforo_url, timeout=240))
            except Exception as e: log("AVISO: no se pudo bajar el aforo:", e)
    best = {}
    for k, (t, u) in texts.items():
        try: c = parse_balance(t)
        except Exception as e: log("ERROR al leer %s: %s; no se escribe nada" % (str(k)[-60:], e)); return 1
        c["pdf"] = u
        if c["campaign"] not in best or rank(c) > rank(best[c["campaign"]]): best[c["campaign"]] = c
    if not best: log("ERROR: sin balances"); return 1
    errs, warns = validate(best)
    for w in warns: log("AVISO:", w)
    if errs:
        for e in errs[:20]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    af = (old or {}).get("aforo")
    if aforo_text:
        try: af = parse_aforo(aforo_text); af["pdf"] = aforo_url
        except Exception as e: log("AVISO: el aforo no se pudo leer (%s); se conserva el anterior" % e)
    t = now()
    write_json(path, {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": PAGE}, "unit": "miles de toneladas", "products": PRODUCTS, "items": ITEMS,
                      "marketingYear": {"oil": "1 oct - 30 sep", "pomace": "1 oct - 30 sep", "tableOlive": "1 sep - 31 ago"},
                      "campaigns": {str(y): {k: v for k, v in best[y].items() if k != "campaign"} for y in sorted(best)}, "aforo": af})
    log("OK: campañas %s; aforo %s" % (", ".join(best[y]["label"] for y in sorted(best)), af["label"] if af else "sin aforo")); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-olive-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

#!/usr/bin/env python3
"""España: medios de producción agrícola (MAPA) -> data/spain-inputs/fertilizers.json y pesticides.json
- Fertilizantes: «Mercado de fertilizantes, cifras definitivas» (producción, importación, ventas agrícolas, usos no agrícolas, exportación, en toneladas de producto y de elemento N, P2O5, K2O) y ventas agrícolas por comunidad.
- Fitosanitarios: «Encuesta de comercialización de productos fitosanitarios» (toneladas de sustancia activa por categoría). A partir de 2022 el MAPA excluye algunas sustancias activas (nota del propio libro): hay ruptura de serie.
Cada libro anual se lee por etiquetas de fila y de columna; lo que no se reconoce se registra y no se inventa."""
import argparse, datetime, html, io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
E = "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/estadisticas-medios-produccion/"
FERT_PAGE = E + "fertilizantes"; FITO_PAGE = E + "fitosanitarios"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, tries=3, timeout=300):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))
def links(page):
    htm = http(page).decode("utf-8", "replace"); out = []; seen = set()
    for h in re.findall(r'href="([^"#]+\.xlsx?)"', htm, re.I):
        u = urllib.parse.urljoin(page, html.unescape(h))
        if u not in seen: seen.add(u); out.append((u, urllib.parse.unquote(u.split("/")[-1])))
    return out
def slug(s):
    s = unicodedata.normalize("NFKD", str(s).lower()); s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"\([^)]*\)", " ", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
def clean(s): return re.sub(r"\s+", " ", str(s or "")).strip()
def num(v): return None if isinstance(v, bool) or not isinstance(v, (int, float)) else round(float(v), 1)
def wbrows(data):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    return [(ws.title, [list(r) for r in ws.iter_rows(values_only=True)]) for ws in wb]
MEAS = [("produccion", "PRODUCCION"), ("importacion", "IMPORTACION"), ("ventas", "VENTAS"), ("usosNoAgricolas", "USOS NO"), ("exportacion", "EXPORTACION")]
def parse_fert(data):
    sheets = wbrows(data); prods = {}; order = []; ccaa = {}
    for title, rows in sheets:
        t = title.lower()
        if t.startswith("por producto"):
            hi = next((i for i, r in enumerate(rows) if r and r[0] and str(r[0]).strip().upper().startswith("PRODUCTOS")), None)
            if hi is None: continue
            cols = {}
            for j, h in enumerate(rows[hi]):
                H = clean(h).upper()
                for k, pat in MEAS:
                    if j > 0 and H.startswith(pat) and k not in cols.values(): cols[j] = k
            sect = "producto"
            for r in rows[hi + 1:]:
                if not r or not r[0]: continue
                lab = clean(r[0])
                if lab.upper().startswith("ELEMENTOS FERTILIZANTES"): sect = "elemento"; continue
                if lab[:2] in ("C:", "(I") or lab.startswith("("): break
                vals = {k: num(r[j]) for j, k in cols.items() if j < len(r)}
                if not any(v is not None for v in vals.values()): continue
                key = sect + ":" + slug(lab)
                if sect == "elemento" and lab.upper().startswith("EN "): key = "elemento:" + slug(lab) + "-" + str(len([o for o in order if o.startswith("elemento:" + slug(lab))]))
                prods[key] = {"label": lab, "section": sect, "vals": vals}; order.append(key)
        elif t.startswith("ventas agr"):
            hi = next((i for i, r in enumerate(rows) if r and r[0] and str(r[0]).strip().upper() == "CCAA"), None)
            if hi is None: continue
            for r in rows[hi + 1:]:
                if not r or not r[0]: continue
                lab = clean(r[0])
                if not any(isinstance(x, (int, float)) for x in r[1:4]): continue
                ccaa[slug(lab)] = {"name": lab, "N": num(r[1]), "P2O5": num(r[2]), "K2O": num(r[3])}
    return prods, order, ccaa
def parse_fito(data):
    sheets = wbrows(data); title, rows = next(((t, r) for t, r in sheets if t.lower().startswith("datos")), (None, None))
    if rows is None: raise ValueError("sin hoja Datos")
    out = {}; order = []; newblock = True; notes = []
    for r in rows:
        lab = clean(r[0]) if r and r[0] is not None else ""
        v = r[1] if len(r) > 1 else None
        if not lab and v is None: newblock = True; continue
        if lab.startswith("(") and not isinstance(v, (int, float)): notes.append(lab); continue
        if not isinstance(v, (int, float)): continue
        key = slug(lab)
        out[key] = {"label": re.sub(r"\s*\(\*+\)\s*$", "", lab), "main": newblock or key == "total", "v": num(v)}; order.append(key); newblock = False
    return out, order, notes
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "spain-inputs"))
    ap.add_argument("--local-fert", action="append", default=[]); ap.add_argument("--local-fito", action="append", default=[])
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    fert = {}; fito = {}
    if a.local_fert or a.local_fito:
        for s in a.local_fert: y, p = s.split(":", 1); fert[int(y)] = (p, Path(p).name)
        for s in a.local_fito: y, p = s.split(":", 1); fito[int(y)] = (p, Path(p).name)
    else:
        for u, n in links(FERT_PAGE):
            m = re.search(r"fertilizantes(20\d\d)", n.lower()) or re.search(r"/fertilizantes/(20\d\d)/", u)
            if m and not re.search(r"cuestionario|enero", n.lower()): fert.setdefault(int(m.group(1)), (u, n))
        for u, n in links(FITO_PAGE):
            l = n.lower(); m = re.search(r"(20\d\d)", l)
            if m and re.search(r"fitosanitarios|sustanciascomercializadas", l) and not re.search(r"cuestionario|cuetionario", l): fito.setdefault(int(m.group(1)), (u, n))
    # --- fertilizantes ---
    fy = {}
    for y in sorted(fert):
        if y < 2021: continue
        u, n = fert[y]
        try: fy[y] = parse_fert(Path(u).read_bytes() if a.local_fert else http(u))
        except Exception as e: log("ERROR fert", y, n, str(e)[:100]); continue
        log("fert", y, n[:50], len(fy[y][0]), "filas", len(fy[y][2]), "comunidades")
    if fy:
        years = sorted(fy); keys = []; meta = {}
        for y in years:
            for k in fy[y][1]:
                if k not in meta: keys.append(k); meta[k] = {"label": fy[y][0][k]["label"], "section": fy[y][0][k]["section"]}
                meta[k]["label"] = fy[y][0][k]["label"]
        rows = []
        for k in keys:
            row = {"id": k, "label": meta[k]["label"], "section": meta[k]["section"]}
            for m, _ in MEAS: row[m] = [fy[y][0].get(k, {"vals": {}})["vals"].get(m) for y in years]
            if any(any(v is not None for v in row[m]) for m, _ in MEAS): rows.append(row)
        cc = {}; cy = [y for y in years if fy[y][2]]
        for y in cy:
            for k, v in fy[y][2].items(): cc.setdefault(k, {"name": v["name"]})["name"] = v["name"]
        regions = []
        for k, v in cc.items(): regions.append({"id": k, "name": v["name"], **{e: [fy[y][2].get(k, {}).get(e) for y in cy] for e in ("N", "P2O5", "K2O")}})
        doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, Mercado de fertilizantes", "url": FERT_PAGE}, "unit": "t", "years": years, "rows": rows,
               "regional": {"years": cy, "unit": "t de elemento (N, P2O5, K2O), ventas agrícolas", "regions": regions},
               "note": "Cifras definitivas del MAPA. Toneladas de producto (sección «producto») o de elemento fertilizante (sección «elemento»). Importación y exportación proceden de DataComex."}
        (out / "fertilizers.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    else: log("sin libros de fertilizantes legibles; se conserva lo anterior")
    # --- fitosanitarios ---
    py = {}
    for y in sorted(fito):
        u, n = fito[y]
        try: py[y] = parse_fito(Path(u).read_bytes() if a.local_fito else http(u))
        except Exception as e: log("ERROR fito", y, n, str(e)[:100]); continue
        log("fito", y, n[:50], len(py[y][0]), "filas")
    if py:
        years = sorted(py); keys = []; meta = {}
        for y in years:
            for k in py[y][1]:
                if k not in meta: keys.append(k); meta[k] = {"label": py[y][0][k]["label"], "main": py[y][0][k]["main"]}
        rows = [{"id": k, "label": meta[k]["label"], "main": meta[k]["main"], "v": [py[y][0].get(k, {}).get("v") for y in years]} for k in keys]
        doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, Comercialización de fitosanitarios", "url": FITO_PAGE}, "unit": "t de sustancia activa", "years": years, "rows": rows,
               "notes": py[years[-1]][2], "breaks": [{"from": 2022, "text": "A partir de 2022 se excluyen sustancias activas (ver notas del MAPA); la serie no es comparable con años anteriores."}],
               "note": "Cantidad de sustancias activas comercializadas, por categoría. Subcategorías confidenciales se agrupan en «otros»."}
        (out / "pesticides.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    else: log("sin libros de fitosanitarios legibles; se conserva lo anterior")
    if not fy and not py: raise SystemExit("nada que escribir")
    (ROOT / "data" / "spain-inputs-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

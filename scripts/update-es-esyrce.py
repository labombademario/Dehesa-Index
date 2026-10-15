#!/usr/bin/env python3
"""España: ESYRCE, superficies por cultivo específico por provincia y comunidad (MAPA, Encuesta sobre Superficies y Rendimientos de Cultivos)
-> data/spain-esyrce/esyrce-<año>.json + data/spain-esyrce/index.json

Fuente: libros «3.3 Distribución de la superficie de cultivos específicos» de la página ESYRCE del MAPA. Un libro por año con una hoja por grupo de cultivos
(filas = provincias y comunidades + ESPAÑA, columnas = cultivos; hectáreas). El año más reciente trae además los libros de secano (3.3.1) y regadío (3.3.2).
El año de cada libro se toma de la carpeta de su URL (.../esyrce/2024/...); los libros recientes de la gestión de contenidos (sin año en la URL) se asignan al
año siguiente al mayor año con carpeta, y se comprueba que coincidan con el avance publicado. Nada se estima: celda vacía = null."""
import argparse, datetime, html, io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/esyrce"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
CCAA = {"galicia", "principado-de-asturias", "cantabria", "pais-vasco", "comunidad-foral-de-navarra", "la-rioja", "aragon", "cataluna", "illes-balears", "castilla-y-leon",
        "comunidad-de-madrid", "castilla-la-mancha", "comunitat-valenciana", "region-de-murcia", "extremadura", "andalucia", "canarias"}
ALT = {"c-valenciana": "comunitat-valenciana", "comunidad-valenciana": "comunitat-valenciana", "murcia": "region-de-murcia", "baleares": "illes-balears", "asturias": "principado-de-asturias",
       "navarra": "comunidad-foral-de-navarra", "madrid": "comunidad-de-madrid", "castilla-la-mancha": "castilla-la-mancha", "castilla-la-mancha-": "castilla-la-mancha", "castilla-la-mancha-1": "castilla-la-mancha"}
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
def slug(s):
    s = unicodedata.normalize("NFKD", str(s).lower()); s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
def clean(s): return re.sub(r"\s+", " ", str(s or "")).strip()
def page_files(htm):
    out = []; seen = set()
    for h, t in re.findall(r'href="([^"#]+\.xlsx?)"[^>]*>(.*?)</a>', htm, re.S | re.I):
        u = urllib.parse.urljoin(PAGE, html.unescape(h))
        if u in seen: continue
        seen.add(u); out.append((u, urllib.parse.unquote(u.split("/")[-1]), clean(re.sub(r"<[^>]+>", " ", t))))
    return out
def classify(name):
    """-> 'total'|'secano'|'regadio'|None segun el nombre del libro 3.3 / 3.3.1 / 3.3.2"""
    n = name.lower()
    if re.search(r"3\.3\.1[_ ]|3\.3\.1\b", n) and "secano" in n: return "secano"
    if re.search(r"3\.3\.2", n) and ("regad" in n): return "regadio"
    if re.search(r"(^|[_/ ])3\.3[_ ]distribuci", n) or re.search(r"(^|[^0-9.])33distribuciongeneraldecultivosespecificos", n): return "total"
    return None
def terr(name):
    s = slug(name); s = ALT.get(s, s)
    return s
def num(v): return None if isinstance(v, bool) or not isinstance(v, (int, float)) else round(float(v), 1)
def parse(data):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    crops = []; terrs = None
    for ws in wb:
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        hi = next((i for i, r in enumerate(rows[:4]) if r and r[0] and str(r[0]).strip().lower().startswith("provincias")), None)
        if hi is None: continue
        title = clean(rows[hi - 1][1]) if hi > 0 and len(rows[hi - 1]) > 1 and rows[hi - 1][1] else clean(re.sub(r"^C\d+[A-D]?\s+", "", ws.title))
        data_rows = []
        for r in rows[hi + 1:]:
            if not r or not r[0]:
                if data_rows: break
                continue
            data_rows.append(r)
        names = [clean(r[0]) for r in data_rows]
        if terrs is None: terrs = names
        elif [terr(x) for x in names] != [terr(x) for x in terrs]: log("  hoja con territorios distintos, se ignora:", ws.title); continue
        for j, h in enumerate(rows[hi]):
            if j == 0 or not h or not str(h).strip(): continue
            vals = [num(r[j]) if j < len(r) else None for r in data_rows]
            if not any(v is not None for v in vals): continue
            crops.append({"group": title or clean(ws.title), "name": clean(h), "v": vals})
    return terrs or [], crops
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "spain-esyrce")); ap.add_argument("--local", action="append", default=[], help="año:medida:ruta")
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sets = {}   # año -> medida -> (u, nombre)
    if a.local:
        for s in a.local:
            y, m, p = s.split(":", 2); sets.setdefault(int(y), {})[m] = (p, Path(p).name)
    else:
        items = page_files(http(PAGE).decode("utf-8", "replace")); folder = {}; nofolder = []
        for u, n, t in items:
            m = classify(n)
            if not m: continue
            fy = re.search(r"/esyrce/(20\d\d)/", u)
            (folder.setdefault(int(fy.group(1)), {}).setdefault(m, (u, n))) if fy else nofolder.append((m, u, n))
        for y, d in folder.items(): sets.setdefault(y, {}).update(d)
        if nofolder:
            y = (max(folder) + 1) if folder else datetime.date.today().year - 1
            for m, u, n in nofolder: sets.setdefault(y, {}).setdefault(m, (u, n))
            log("libros sin año en la URL asignados a", y)
    if not sets: raise SystemExit("no hay libros ESYRCE 3.3: no se toca nada")
    idx = {"years": {}}
    for y in sorted(sets):
        doc = {"schemaVersion": 1, "generatedAt": now, "year": y, "unit": "ha", "source": {"id": "mapa_es", "name": "MAPA, ESYRCE", "url": PAGE}, "measures": {}}
        terrs0 = None
        for m in ("total", "secano", "regadio"):
            if m not in sets[y]: continue
            u, n = sets[y][m]
            try: terrs, crops = parse(Path(u).read_bytes() if a.local else http(u))
            except Exception as e: log("ERROR", y, m, n, str(e)[:100]); continue
            log("leído", y, m, n[:60], len(terrs), "territorios", len(crops), "columnas")
            if terrs0 is None: terrs0 = terrs
            elif [terr(x) for x in terrs] != [terr(x) for x in terrs0]: log("  territorios distintos entre medidas, se ignora", m); continue
            doc["measures"][m] = crops
        if not doc["measures"].get("total"): log("sin total para", y); continue
        doc["territories"] = [{"id": terr(t), "name": t, "kind": ("country" if terr(t) == "espana" else "ccaa" if terr(t) in CCAA else "province")} for t in terrs0]
        (out / ("esyrce-%d.json" % y)).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        idx["years"][str(y)] = {"file": "esyrce-%d.json" % y, "measures": sorted(doc["measures"]), "crops": len(doc["measures"]["total"]), "territories": len(doc["territories"])}
    if not idx["years"]: raise SystemExit("no se leyó ningún año: no se toca nada")
    idx.update({"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, ESYRCE", "url": PAGE},
                "note": "Hectáreas por cultivo específico. Secano y regadío solo en el año más reciente. El último año es avance provisional del MAPA."})
    (out / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (ROOT / "data" / "spain-esyrce-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8"); return 0
if __name__ == "__main__": sys.exit(main())

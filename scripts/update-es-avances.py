#!/usr/bin/env python3
"""España: avances mensuales de superficies y producciones agrícolas (MAPA) -> data/spain-avances/avances.json

Fuente: «Cuaderno» mensual de la página «Avances de superficies y producciones de cultivos». Se lee la hoja «resumen nacional» (cuatro paneles de 14 columnas):
superficie (miles de ha) y producción (miles de t) de tres años consecutivos por cultivo: dato definitivo, provisional y avance del año en curso.
«Mes» = mes al que corresponde la última estimación (nota (1) del cuaderno). La página enlaza todas las ediciones; se lee la más reciente que sea hoja de cálculo
y se conserva en `history` la evolución de la cifra de avance de cada edición ya leída. Nada se estima: celda vacía = null."""
import argparse, datetime, html, io, json, re, sys, urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
import importlib.util
spec = importlib.util.spec_from_file_location("esy", str(ROOT / "scripts" / "update-es-esyrce.py")); esy = importlib.util.module_from_spec(spec); spec.loader.exec_module(esy)
http, slug, clean = esy.http, esy.slug, esy.clean
PAGE = "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/avances-superficies-producciones-agricolas"
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
STATUS = {"definit.": "definitivo", "definitivo": "definitivo", "provis.": "provisional", "provisional": "provisional", "avance": "avance"}
def log(*a): esy.log(*a)
def num(v): return None if isinstance(v, bool) or not isinstance(v, (int, float)) else round(float(v), 3)
def edition_of(name):
    m = re.search(r"(%s)[\s_-]*(20\d\d)" % "|".join(MONTHS), name.lower())
    return (int(m.group(2)), MONTHS.index(m.group(1)) + 1) if m else None
def find_files():
    page = http(PAGE).decode("utf-8", "replace"); out = {}
    for h, t in re.findall(r'href="([^"#]+\.(?:xlsm|xlsx|xls))"[^>]*>(.*?)</a>', page, re.S | re.I):
        u = urllib.parse.urljoin(PAGE, html.unescape(h)); n = urllib.parse.unquote(u.split("/")[-1])
        if "cuaderno" not in n.lower(): continue
        e = edition_of(n)
        if e: out.setdefault(e, (u, n))
    return out
def sheet_rows(data, name):
    if name.lower().endswith(".xls"):
        import xlrd
        b = xlrd.open_workbook(file_contents=data); s = next((x for x in b.sheets() if x.name.strip().lower().startswith("resumen")), None)
        return [s.row_values(i) for i in range(s.nrows)] if s else None
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    ws = next((w for w in wb.worksheets if w.title.strip().lower().startswith("resumen")), None)
    return [list(r) for r in ws.iter_rows(values_only=True)] if ws else None
def parse(rows):
    items = []; ed_label = None
    for r in rows[:4]:
        for v in r:
            if isinstance(v, str) and re.match(r"^(%s)\s+20\d\d$" % "|".join(m.upper() for m in MONTHS), v.strip().upper()): ed_label = v.strip()
    hdr = next((i for i, r in enumerate(rows[:12]) if r and r[0] == "CULTIVOS"), None)
    if hdr is None: return None, []
    ncol = max(len(r) for r in rows[hdr:hdr + 2]); starts = [c for c in range(ncol) if c < len(rows[hdr]) and rows[hdr][c] == "CULTIVOS"]
    for P in starts:
        yrs = [rows[hdr + 1][P + k] if P + k < len(rows[hdr + 1]) else None for k in (4, 5, 6)]
        sts = [STATUS.get(clean(rows[hdr][P + k]).lower()) if P + k < len(rows[hdr]) and isinstance(rows[hdr][P + k], str) else None for k in (4, 5, 6)]
        if not all(isinstance(y, (int, float)) for y in yrs) or not all(sts): log("  panel", P, "sin años/estados legibles, se ignora"); continue
        yrs = [int(y) for y in yrs]
        if yrs != [yrs[0], yrs[0] + 1, yrs[0] + 2]: log("  panel", P, "años no consecutivos", yrs); continue
        section = ""
        for r in rows[hdr + 2:]:
            if len(r) <= P + 12: continue
            lab = r[P]
            if not isinstance(lab, str) or not clean(lab): continue
            lab = clean(lab)
            a = [num(r[P + k]) for k in (4, 5, 6)]; p = [num(r[P + k]) for k in (10, 11, 12)]
            if lab.startswith("(") and re.match(r"^\(\d+\)", lab): continue   # notas al pie
            if all(x is None for x in a + p):
                if len(lab) < 60 and lab.upper() == lab and not lab.startswith("("): section = re.sub(r"\s*\(\d+\)$", "", lab)   # solo los rótulos en mayúsculas son secciones
                continue
            at = clean(r[P + 2]) if isinstance(r[P + 2], str) else ""
            items.append({"section": section, "label": lab, "areaType": at, "areaMonth": int(r[P + 3]) if isinstance(r[P + 3], (int, float)) and not isinstance(r[P + 3], bool) else None,
                          "prodMonth": int(r[P + 9]) if isinstance(r[P + 9], (int, float)) and not isinstance(r[P + 9], bool) else None, "years": yrs, "status": sts, "area": a, "prod": p})
    return ed_label, items
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "spain-avances")); ap.add_argument("--local", action="append", default=[], help="ruta al cuaderno (el nombre debe llevar mes y año)")
    ap.add_argument("--log", default=str(ROOT / "data" / "spain-avances-log.txt"))
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    fp = out / "avances.json"; old = {}
    if fp.exists():
        try: old = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as e: log("fichero anterior ilegible:", str(e)[:80])
    todo = {}
    if a.local:
        for p in a.local:
            e = edition_of(Path(p).name)
            if e: todo[e] = (p, Path(p).name)
    else:
        files = find_files()
        if not files: raise SystemExit("la página no enlaza ningún cuaderno en hoja de cálculo: no se toca nada")
        latest = max(files); todo[latest] = files[latest]
        log("ediciones con hoja de cálculo en la página:", len(files), "· se lee", "%d-%02d" % latest)
    hist = dict(old.get("history", {})); cur = None
    for e in sorted(todo):
        u, n = todo[e]; ek = "%d-%02d" % e
        try:
            data = Path(u).read_bytes() if a.local else http(u)
            rows = sheet_rows(data, n)
            if not rows: log("edición", ek, "sin hoja «resumen nacional»"); continue
            lab, items = parse(rows)
        except Exception as ex: log("edición", ek, "ERROR", str(ex)[:120]); continue
        if len(items) < 100: log("edición", ek, "ignorada: solo", len(items), "cultivos leídos (se esperan >100)"); continue
        keyed = {}
        for it in items:
            k = slug(it["section"] + "/" + it["label"]); i = 2
            while k in keyed: k = slug(it["section"] + "/" + it["label"]) + "-%d" % i; i += 1
            it["key"] = k; keyed[k] = it
        # historial: la cifra de avance (última columna con dato) de esta edición
        h = {}
        for k, it in keyed.items():
            if it["status"][2] == "avance" and (it["area"][2] is not None or it["prod"][2] is not None): h[k] = [it["area"][2], it["prod"][2], it["years"][2]]
        hist[ek] = h
        cur = (e, lab, list(keyed.values())); log("edición", ek, lab, len(items), "cultivos")
    if cur is None and not old: raise SystemExit("no se leyó ninguna edición: no se toca nada")
    if cur is not None and (old.get("edition") is None or "%d-%02d" % cur[0] >= old.get("edition", "")):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, Avances de superficies y producciones agrícolas", "url": PAGE},
               "edition": "%d-%02d" % cur[0], "editionLabel": cur[1], "units": {"area": "miles de hectáreas", "prod": "miles de toneladas"}, "items": cur[2], "history": dict(sorted(hist.items())),
               "note": "«Mes» es el mes de la última estimación. Definitivo = cifra cerrada; provisional = año anterior aún revisable; avance = estimación del año en curso. El historial guarda la cifra de avance de cada edición leída."}
    else:
        doc = old; doc["history"] = dict(sorted(hist.items())); doc["generatedAt"] = now
    fp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    Path(a.log).write_text("\n".join(esy.LOG) + "\n", encoding="utf-8")
if __name__ == "__main__": main()

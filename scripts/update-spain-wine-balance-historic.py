#!/usr/bin/env python3
"""España: balances oficiales del vino 2009/10-2015/16 (MAPA, «Balance del vino») -> data/spain-wine/balance-historic.json.

Un libro por campaña (.xls y .xlsx, nombres irregulares) con el balance nacional en miles de hectolitros: existencias iniciales, producción de vinos y mostos (con mostos no vinificables y producción utilizable), importaciones,
exportaciones, utilización interior (consumo humano, usos industriales, transformación, pérdidas) y existencias finales, para el vino total y por categoría (DOP, IGP, varietales, otros vinos), cada una en total y blanco.
- Es OTRA serie que INFOVI (data/spain-wine/infovi.json, desde 2020/21 con declaraciones de los operadores): el balance es una construcción del MAPA con estimaciones, tiene otras categorías y no se enlaza ni se suma con INFOVI.
  No hay balance publicado de 2016/17 a 2019/20 (hueco real) y no hay desglose por comunidad.
- Las filas se reconocen por su epigrafe numerico (1, 1.1, 2, 2.1, ... 7.1), no por el texto ni por la posicion (el libro de 2012/13 trae una columna de orden delante). La campaña sale del titulo («BALANCE DEL VINO 2009 - 2010»).
- Si una campaña tiene balance provisional y definitivo (2014/15) gana el definitivo; los informes en PDF no se leen.
- Se rechaza la escritura entera si algo no cuadra: recursos = existencias iniciales + producción utilizable + importaciones, recursos = exportaciones + utilización interior + existencias finales, utilización interior = suma de sus partes,
  producción = mostos no vinificables + utilizable, y las cuatro categorías suman el vino total (tolerancia de redondeo de 3 miles de hl).
--file usa un libro local (pruebas)."""
import argparse, datetime, importlib.util, io, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("usw_base", ROOT / "scripts" / "update-spain-wine.py"); B = importlib.util.module_from_spec(sp); sp.loader.exec_module(B)
OUT = ROOT / "data" / "spain-wine"
SITE = B.SITE
PAGE = SITE + "/es/estadistica/temas/estadisticas-agrarias/agricultura/balance-del-vino"
LOG = B.LOG; log = B.log; http = B.http; norm = B.norm; r3 = B.r3; write_json = B.write_json
CATS = ["total", "dop", "igp", "varietal", "other"]
CODES = ["1", "1.1", "2", "2.1", "2.1.1", "2.1.2", "2.2", "3", "3.1", "3.1.1", "4", "5", "5.1", "5.1.1", "6", "6.1", "6.2", "6.2.1", "6.2.1.2.1", "6.2.1.2.3", "6.2.2", "6.3", "6.4", "7", "7.1"]
LABELS = {"1": "Existencias iniciales totales", "1.1": "Existencias iniciales en el mercado", "2": "Producción total de vinos y mostos", "2.1": "Mostos no vinificables", "2.1.1": "Mosto para zumo de uva", "2.1.2": "Pérdidas de mostos", "2.2": "Producción utilizable",
          "3": "Importaciones totales", "3.1": "Importaciones de terceros países", "3.1.1": "Importaciones de terceros países: envasados", "4": "Recursos = empleos", "5": "Exportaciones totales", "5.1": "Exportaciones a terceros países", "5.1.1": "Exportaciones a terceros países: envasados",
          "6": "Utilización interior total", "6.1": "Consumo humano", "6.2": "Usos industriales", "6.2.1": "Destilación", "6.2.1.2.1": "Destilación: subproductos", "6.2.1.2.3": "Destilación: uso de boca", "6.2.2": "Fabricación de vinagres", "6.3": "Transformación", "6.4": "Pérdidas de vinos",
          "7": "Existencias finales totales", "7.1": "Existencias finales en el mercado"}
def code_of(c):
    if isinstance(c, (int, float)) and not isinstance(c, bool): return str(int(c)) if float(c) == int(c) else None
    if isinstance(c, str):
        s = c.strip().rstrip(".")
        if re.fullmatch(r"\d+(\.\d+)*", s): return s[:-2] if s.endswith(".0") and s.count(".") == 1 else s
    return None
def rows_of(src, ext):
    if ext == "xls":
        import xlrd
        wb = xlrd.open_workbook(file_contents=src) if isinstance(src, bytes) else xlrd.open_workbook(src); s = wb.sheet_by_index(0)
        return s.name, [[(None if c == "" else c) for c in s.row_values(i)] for i in range(s.nrows)]
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(src) if isinstance(src, bytes) else src, data_only=True); ws = wb.worksheets[0]
    return ws.title, [list(r) for r in ws.iter_rows(values_only=True)]
def parse(sheet, rows):
    title = " ".join(str(c) for r in rows[:3] for c in r if isinstance(c, str))
    m = re.search(r"(?i)balance\s+(?:del\s+)?vino\s+(\d{4})\s*[-–]\s*(\d{4})", title) or re.search(r"(?i)(\d{4})\s*[-–]\s*(\d{4})", sheet)
    if not m: raise ValueError("no se lee la campaña del titulo")
    y0, y1 = int(m.group(1)), int(m.group(2))
    if y1 != y0 + 1: raise ValueError("campaña %d-%d no consecutiva" % (y0, y1))
    status = "provisional" if re.search(r"(?i)provisional", title + " " + sheet) else ("final" if re.search(r"(?i)definit|definitv", title + " " + sheet) else None)
    if status is None: raise ValueError("el titulo no dice si el balance es provisional o definitivo")
    data = {}
    for r in rows:
        li = next((i for i, c in enumerate(r) if isinstance(c, str) and re.search(r"[A-Za-zÁÉÍÓÚáéíóú]{4}", c) and not re.fullmatch(r"\s*\d[\d.]*\s*", c)), None)
        if li is None or li == 0: continue
        code = code_of(r[li - 1])
        if code not in CODES: continue
        vals = []
        for c in (r[li + 1:li + 11] + [None] * 10)[:10]:
            if isinstance(c, bool): raise ValueError("%s: valor logico" % code)
            if isinstance(c, (int, float)): vals.append(float(c))
            elif c is None or (isinstance(c, str) and not c.strip()): vals.append(None)  # celda vacia: sin dato publicado (null), no cero
            else: raise ValueError("fila %s: celda no reconocida %r" % (code, c))
        if vals[0] is None or vals[1] is None: raise ValueError("fila %s: falta el vino total" % code)
        if any(isinstance(x, (int, float)) for x in r[li + 11:]): raise ValueError("fila %s: hay cifras fuera de las 10 columnas esperadas" % code)
        if code in data: raise ValueError("fila %s repetida" % code)
        data[code] = {CATS[i]: {"all": vals[2 * i], "white": vals[2 * i + 1]} for i in range(5)}
    miss = [c for c in CODES if c not in data]
    if miss: raise ValueError("faltan filas: " + ", ".join(miss))
    return "%d/%02d" % (y0, y1 % 100), status, data
def validate(camp, d):
    """-> (errores, notas). Las identidades contables y la suma de categorías bloquean; un «blanco» algo mayor que su total (error de la propia fuente) se deja tal cual y se anota."""
    errs = []; notes = []; close = lambda a, b, t=3.0: abs(a - b) <= t; z = lambda x: x or 0.0
    for cat in CATS:
        for col in ("all", "white"):
            g = lambda c: d[c][cat][col]; w = "%s %s %s" % (camp, cat, col)
            for c in CODES:
                if g(c) is not None and g(c) < 0: errs.append("%s fila %s: valor negativo" % (w, c))
            if not close(z(g("2")), z(g("2.1")) + z(g("2.2"))): errs.append("%s: producción distinta de mostos no vinificables + utilizable" % w)
            if not close(z(g("4")), z(g("1")) + z(g("2.2")) + z(g("3"))): errs.append("%s: recursos distintos de existencias iniciales + producción utilizable + importaciones" % w)
            if not close(z(g("4")), z(g("5")) + z(g("6")) + z(g("7"))): errs.append("%s: recursos distintos de exportaciones + utilización interior + existencias finales" % w)
            if not close(z(g("6")), z(g("6.1")) + z(g("6.2")) + z(g("6.3")) + z(g("6.4")), 4.0): errs.append("%s: utilización interior distinta de la suma de sus partes" % w)
            if z(g("1.1")) > z(g("1")) + 3 or z(g("7.1")) > z(g("7")) + 3: errs.append("%s: existencias en el mercado mayores que las totales" % w)
            if not close(z(g("2.1")), z(g("2.1.1")) + z(g("2.1.2")), 4.0): errs.append("%s: mostos no vinificables distintos de zumo + pérdidas" % w)
    for col in ("all", "white"):
        for c in CODES:
            s = sum(z(d[c][k][col]) for k in CATS[1:])
            if not close(s, z(d[c]["total"][col]), 5.0): errs.append("%s fila %s %s: las categorías suman %s y el vino total %s" % (camp, c, col, s, d[c]["total"][col]))
    for c in CODES:
        for cat in CATS:
            a, wv = d[c][cat]["all"], d[c][cat]["white"]
            if a is not None and wv is not None and wv > a + 3:
                notes.append({"campaign": camp, "code": c, "category": cat, "kind": "white>total", "white": r3(wv), "total": r3(a)})  # cifras publicadas por el MAPA: se dejan tal cual y se anotan
    return errs, notes
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def to_doc(allc, files):
    camps = sorted(allc)
    v = {c: {k: {col: [r3(allc[p]["data"][c][k][col]) for p in camps] for col in ("all", "white")} for k in CATS} for c in CODES}
    t = now()
    return {"schemaVersion": 1, "generatedAt": t, "checkedAt": t, "source": {"id": "mapa_es", "url": PAGE}, "units": {"wine": "miles de hectolitros"}, "campaigns": camps, "categories": CATS, "codes": CODES, "labels": LABELS,
            "status": {p: allc[p]["status"] for p in camps}, "v": v, "files": {p: files.get(p) for p in camps}}
def from_doc(doc):
    out = {}
    for i, p in enumerate(doc["campaigns"]): out[p] = {"status": doc["status"][p], "data": {c: {k: {col: doc["v"][c][k][col][i] for col in ("all", "white")} for k in CATS} for c in CODES}}
    return out
def find_links(html):
    out = []
    for h in dict.fromkeys(re.findall(r'href="([^"]+\.(?:xls|xlsx))"', html, re.I)):
        if "balance" in norm(h.rsplit("/", 1)[-1]): out.append(h if h.startswith("http") else SITE + h)
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--file", action="append"); ap.add_argument("--force", action="store_true"); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT; out.mkdir(parents=True, exist_ok=True); path = out / "balance-historic.json"
    old = json.loads(path.read_text("utf-8")) if path.exists() else None
    allc = from_doc(old) if old else {}; files = dict(old["files"]) if old else {}; new = {}; changed = False
    try:
        srcs = []
        if a.file: srcs = [(f, None, None, f.rsplit(".", 1)[-1].lower()) for f in a.file]
        else:
            links = find_links(http(PAGE).decode("utf-8", "replace"))
            if not links: log("ERROR: no se encuentra ningun balance en la pagina del MAPA"); return 1
            known = {(v or {}).get("url"): v for v in files.values() if v}
            for u in links:
                lm = None
                try: lm = http(u, "HEAD").get("Last-Modified")
                except Exception as ex: log("HEAD fallo:", str(ex)[:60])
                if not a.force and u in known and lm and known[u].get("lastModified") == lm: continue
                srcs.append((None, u, lm, u.split("?")[0].rsplit(".", 1)[-1].lower()))
        for f, u, lm, ext in srcs:
            try: camp, st, data = parse(*rows_of(f if f else http(u), ext))
            except Exception as ex: log("libro %s no se lee: %s" % ((f or u).rsplit("/", 1)[-1], str(ex)[:140])); continue
            prev = new.get(camp) or allc.get(camp)
            if prev and prev["status"] == "final" and st == "provisional": continue  # el definitivo gana al provisional
            new[camp] = {"status": st, "data": data}; files[camp] = {"url": u, "lastModified": lm}; changed = True
    except Exception as ex: log("ERROR al leer los balances:", ex); return 1
    if not changed and old:
        old["checkedAt"] = now(); write_json(path, old); log("balances sin cambios"); return 0
    errs = []; notes = list(old["notes"]) if old else []
    for p, c in sorted(new.items()):
        e, nt = validate(p, c["data"]); errs += e; notes = [x for x in notes if x["campaign"] != p] + nt
    if errs:
        for e in errs[:25]: log("ERROR de validacion:", e)
        log("no se escribe nada (%d errores)" % len(errs)); return 1
    revs = 0
    for p, c in new.items():
        if p in allc and any(abs(allc[p]["data"][k][x][y] - c["data"][k][x][y]) > 1e-6 for k in CODES for x in CATS for y in ("all", "white")): revs += 1
        allc[p] = c
    doc = to_doc(allc, files); doc["notes"] = notes; write_json(path, doc); log("OK: %s..%s (%d campañas), %d revisiones" % (doc["campaigns"][0], doc["campaigns"][-1], len(doc["campaigns"]), revs)); return 0

if __name__ == "__main__":
    rc = main()
    try: (ROOT / "data" / "spain-wine-balance-historic-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
    except Exception: pass
    sys.exit(rc)

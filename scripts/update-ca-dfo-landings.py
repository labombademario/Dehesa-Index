#!/usr/bin/env python3
"""Canada: desembarques comerciales de pesca marina por provincia y especie, 1990-ultimo ano (Fisheries and Oceans Canada, DFO, «Commercial Seafisheries Landings»)
-> data/ca-dfo-landings.json  (cantidad en kg de peso vivo y valor en C$ corrientes, tal como los publica la fuente; ano civil).
Fuente: open.canada.ca, conjunto 6e16f703-9c57-46c9-9194-6573398c17e6, licencia «Open Government Licence - Canada» (ca-ogl-lgo; el campo license_id se comprueba en cada carga).
El CSV se localiza por el catalogo (recurso CSV en ingles cuyo nombre contiene «Landings»), porque el nombre del fichero lleva el ultimo ano.
Nada se estima: «x» (suprimido por confidencialidad) queda como null y no se rellena; los totales son los que publica la fuente (Grand total y Total de cada grupo).
Comprobaciones (si una falla no se publica y se conserva el fichero anterior): cabecera exacta, provincias conocidas, anos seguidos, Atlantic = suma de las 5 provincias
atlanticas, Canada = Atlantic + British Columbia (tolerancia 0,01 % por redondeo), suma de especies <= total (+0,1 %) y igual al total si la provincia-ano no tiene celdas suprimidas,
y nunca menos anos que los ya publicados.
Uso: update-ca-dfo-landings.py [--out FICHERO.json] [--csv FICHERO.csv]   (--csv: lee un CSV local, sin red; solo pruebas)"""
import argparse, csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ca-dfo-landings.json"
LOGF = ROOT / "data" / "ca-dfo-landings-log.txt"
PKG = "https://open.canada.ca/data/api/action/package_show?id=6e16f703-9c57-46c9-9194-6573398c17e6"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
HEAD = ["Year", "Province", "Species Group", "Species", "Quantity (kgs)", "Value (CAD)"]
ATL = ["Newfoundland and Labrador", "Prince Edward Island", "Nova Scotia", "New Brunswick", "Quebec"]
PROVS = ["Canada", "Atlantic"] + ATL + ["British Columbia"]
GROUPS = {"Groundfish": "groundfish", "Pelagics": "pelagics", "Shellfish": "shellfish", "Other": "other"}
SRC = {"id": "dfo_landings", "name": "Fisheries and Oceans Canada (DFO), Commercial Seafisheries Landings", "url": "https://open.canada.ca/data/en/dataset/6e16f703-9c57-46c9-9194-6573398c17e6",
       "license": "Open Government Licence - Canada"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=120, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-80:], last))
def slug(s): return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")
def cell(t):
    t = (t or "").strip().replace(",", "")
    if t in ("x", "X"): return None, True
    if not re.fullmatch(r"-?\d+(\.\d+)?", t): raise ValueError("celda no numerica: %r" % t)
    f = float(t); return (int(f) if f == int(f) else f), False

def parse(raw):
    """bytes del CSV -> dict(data) sin metadatos; lanza ValueError si algo no cuadra"""
    try: text = raw.decode("utf-8-sig")
    except UnicodeDecodeError: text = raw.decode("cp1252", "replace")
    rd = csv.reader(io.StringIO(text)); rows = list(rd)
    if not rows or [h.strip() for h in rows[0]] != HEAD: raise ValueError("cabecera distinta: %r" % (rows[0] if rows else None))
    tot, land, supp = {}, {}, []
    species = {}
    for r in rows[1:]:
        if not r or not (r[0] or "").strip().isdigit(): continue        # filas vacias y notas al pie
        if len(r) != 6: raise ValueError("fila con %d columnas: %r" % (len(r), r))
        y, prov, grp, sp = int(r[0]), r[1].strip(), r[2].strip(), r[3].strip()
        if prov not in PROVS: raise ValueError("provincia desconocida: %r" % prov)
        q, sq = cell(r[4]); v, sv = cell(r[5])
        if sq != sv: raise ValueError("una celda suprimida y la otra no: %s %s %s" % (y, prov, sp))
        if q is not None and (q < 0 or v < 0): raise ValueError("negativo: %s %s %s" % (y, prov, sp))
        if grp == "Grand total" and sp == "Grand total": key = "grand"
        elif sp.startswith("Total ") and grp in GROUPS and sp.lower() == "total " + grp.lower(): key = "t_" + GROUPS[grp]
        elif grp in GROUPS: key = None
        else: raise ValueError("grupo desconocido: %r" % grp)
        if key:
            d = tot.setdefault(prov, {}).setdefault(key, {})
            if str(y) in d: raise ValueError("total repetido: %s %s %s" % (y, prov, key))
            d[str(y)] = [q, v]
        else:
            k = slug(sp); species.setdefault(k, {"name": sp, "group": GROUPS[grp]})
            if species[k] != {"name": sp, "group": GROUPS[grp]}: raise ValueError("especie en dos grupos: %s" % sp)
            d = land.setdefault(prov, {}).setdefault(k, {})
            if str(y) in d: raise ValueError("fila repetida: %s %s %s" % (y, prov, sp))
            d[str(y)] = [q, v]
            if q is None: supp.append([y, prov, k])
    years = sorted({int(y) for p in tot.values() for g in p.values() for y in g})
    if not years or years != list(range(years[0], years[-1] + 1)): raise ValueError("anos no seguidos: %s" % years)
    for p in PROVS:
        for y in years:
            if str(y) not in tot.get(p, {}).get("grand", {}): raise ValueError("falta el total de %s en %s" % (p, y))
            if any(str(y) not in land.get(p, {}).get(k, {}) for k in species): raise ValueError("faltan especies de %s en %s" % (p, y))
    return {"years": years, "provinces": PROVS, "species": [dict(key=k, **species[k]) for k in sorted(species)], "totals": tot, "landings": land,
            "suppressed": sorted(supp)}

def check(d):
    """coherencia interna; devuelve la lista de problemas (vacia = bien)"""
    errs = []; tol = 1e-4
    T = d["totals"]; L = d["landings"]
    for y in map(str, d["years"]):
        for i in (0, 1):
            g = lambda p: T[p]["grand"][y][i]
            if any(g(p) is None for p in PROVS): errs.append("total suprimido en %s" % y); continue
            a = sum(g(p) for p in ATL)
            if abs(a - g("Atlantic")) > tol * g("Atlantic") + 3: errs.append("Atlantic %s [%d]: %s frente a suma %s" % (y, i, g("Atlantic"), a))
            c = g("Atlantic") + g("British Columbia")
            if abs(c - g("Canada")) > tol * g("Canada") + 3: errs.append("Canada %s [%d]: %s frente a suma %s" % (y, i, g("Canada"), c))
        for p in PROVS:
            sup = [k for k in L[p] if L[p][k][y][0] is None]
            for i in (0, 1):
                s = sum((L[p][k][y][i] or 0) for k in L[p]); t = T[p]["grand"][y][i]
                if s > t * 1.001 + 3: errs.append("%s %s [%d]: especies %s > total %s" % (p, y, i, s, t))
                if not sup and abs(s - t) > t * 0.002 + 3: errs.append("%s %s [%d]: especies %s distinto del total %s sin celdas suprimidas" % (p, y, i, s, t))
    return errs

def locate():
    pk = json.loads(get(PKG))
    if not pk.get("success"): raise RuntimeError("catalogo sin exito")
    r = pk["result"]
    if r.get("license_id") != "ca-ogl-lgo": raise RuntimeError("la licencia del conjunto ya no es ca-ogl-lgo: %r" % r.get("license_id"))
    c = [x for x in r["resources"] if x.get("format") == "CSV" and x.get("language") == ["en"] and "Landings" in (x.get("name") or "")]
    if len(c) != 1: raise RuntimeError("%d recursos CSV candidatos" % len(c))
    return c[0]["url"], r.get("date_modified")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(OUT)); ap.add_argument("--csv"); a = ap.parse_args()
    out = Path(a.out); mod = None
    try:
        if a.csv: raw = Path(a.csv).read_bytes()
        else:
            url, mod = locate(); log("CSV:", url[-70:], "modificado:", mod); raw = get(url)
        d = parse(raw); errs = check(d)
        if d["years"][0] != 1990 or d["years"][-1] > datetime.date.today().year: errs.append("rango de anos raro: %s-%s" % (d["years"][0], d["years"][-1]))
        if errs:
            for e in errs[:20]: log("ERROR", e)
            raise ValueError("%d incoherencias" % len(errs))
        if out.exists():
            old = json.loads(out.read_text())
            if old.get("years") and (d["years"][0] > old["years"][0] or d["years"][-1] < old["years"][-1]):
                raise ValueError("el CSV nuevo tiene menos anos (%d-%d) que lo publicado (%d-%d)" % (d["years"][0], d["years"][-1], old["years"][0], old["years"][-1]))
    except Exception as e:
        log("FALLO:", repr(e)[:300]); LOGF.write_text("\n".join(LOG) + "\n") if not a.csv else None
        sys.exit(1)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "source": dict(SRC, datasetModified=mod),
           "units": {"quantity": "kg", "value": "CAD"}, "note": "Quantity in live weight; value in current Canadian dollars; calendar year. 'null' = suppressed by DFO for confidentiality. Data subject to revision.", **d}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    g = d["totals"]["Canada"]["grand"]; y = str(d["years"][-1])
    log("ca-dfo-landings: %d-%d, Canada %s: %.0f kt, %.0f M CAD, %d especies, %d celdas suprimidas" % (d["years"][0], d["years"][-1], y, g[y][0] / 1e6, g[y][1] / 1e6, len(d["species"]), len(d["suppressed"])))
    if not a.csv: LOGF.write_text("\n".join(LOG) + "\n")
if __name__ == "__main__": main()

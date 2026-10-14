#!/usr/bin/env python3
"""Francia: agricultura ecologica por departamento y region (Agence BIO / organismos certificadores, data.gouv.fr, Licence Ouverte 2.0) -> data/france-organic-stats.json (countries.FR, extend)
Dataset: https://www.data.gouv.fr/datasets/historique-detaille-des-surfaces-cheptels-et-nombre-doperateurs-par-departement (licencia declarada en la ficha: Licence Ouverte / Open Licence 2.0).
Se usan solo los ficheros por DEPARTAMENTO (la ficha de «por region» no declara licencia); las regiones se suman desde los departamentos. Los CSV se identifican por sus columnas, no por el titulo ni la URL:
  * surfbio + nb_exp sin code_groupe  -> superficie total (AB + en conversion) y explotaciones por departamento y año (2008-)
  * code_groupe + surfbio             -> superficie por grupo de produccion
  * tetesbio                          -> cabaña (cabezas; colmenas en apicultura)
  * nboperateur                       -> operadores certificados por actividad (P produccion, T transformacion, D distribucion, I importacion)
Valores tal cual; «NC» (secreto estadistico) y «NA» son huecos, nunca cero. El total nacional de superficie solo se publica los años en que NINGUN departamento tiene hueco; en cabaña y grupos el
total suma los departamentos que publican el dato y se advierte en la nota. Si falla una validacion no se escribe nada.
Uso: update-france-organic.py [--dir CARPETA con los CSV]  (con --dir no se toca la red; asi lo usan los tests)"""
import csv, datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SLUG = "historique-detaille-des-surfaces-cheptels-et-nombre-doperateurs-par-departement"
API = "https://www.data.gouv.fr/api/1/datasets/%s/" % SLUG
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
SRC_GROUP = "Agence BIO / organismes certificateurs (data.gouv.fr)"
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def http(url, tries=3, timeout=180):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (url, str(last)[:160]))
def num(s):
    s = (s or "").strip()
    if s in ("", "NC", "NA", "ND", "-"): return None
    try: return float(s)
    except ValueError: return None
def read_csv(raw):
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
def classify(rows):
    c = set(rows[0]) if rows else set()
    if "nboperateur" in c: return "operators"
    if "tetesbio" in c: return "herds"
    if "surfbio" in c and "code_groupe" in c: return "groups"
    if "surfbio" in c and "nb_exp" in c: return "totals"
    return None
def load(dirpath=None):
    out = {}
    if dirpath:
        for p in sorted(Path(dirpath).glob("*.csv")):
            rows = read_csv(p.read_bytes()); k = classify(rows)
            if k: out[k] = rows
        return out
    meta = json.loads(http(API))
    lic = meta.get("license")
    if lic != "lov2": raise RuntimeError("la ficha de data.gouv ya no declara Licence Ouverte 2.0 (license=%r): no se publica" % lic)
    for r in meta["resources"]:
        if (r.get("format") or "").lower() != "csv": continue
        rows = read_csv(http(r["url"])); k = classify(rows)
        if k and k not in out: out[k] = rows; log("recurso", k, len(rows), "filas;", r["url"][-60:])
    return out
HERDS = {"API": ("Beehives", "hives"), "AUPA": ("Other animal production", "head"), "AUVOL": ("Other poultry for meat", "head"), "BL": ("Dairy ewes", "head"), "BV": ("Meat ewes", "head"),
         "CH": ("Goats", "head"), "CO": ("Fattening pigs", "head"), "LAR": ("Breeding does (rabbits)", "head"), "LA": ("Rabbits (estimate)", "head"), "PO": ("Laying hens", "head"),
         "PC": ("Broilers", "head"), "TR": ("Breeding sows", "head"), "VA": ("Suckler cows", "head"), "VL": ("Dairy cows", "head")}
GROUPS = {}   # code_groupe -> nombre en ingles (se completa tras ver el log de la primera ejecucion)
ACT = {"Production": ("P", "production"), "Transformation": ("T", "processing"), "Distribution": ("D", "distribution"), "Importation": ("I", "import")}
SER = {}
def add(sid, label, unit, pts, note=None):
    pts = sorted((str(p), round(v, 4)) for p, v in pts.items() if v is not None)
    if len(pts) < 3: log("descartada", sid, len(pts)); return
    last, prev = pts[-1], pts[-2]
    s = {"id": sid, "group": "organic", "label": label, "unit": unit, "frequency": "annual", "latestPeriod": last[0], "latest": last[1],
         "changePct": round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, "points": [[p, v] for p, v in pts], "sourceGroup": SRC_GROUP, "sourceId": "agence_bio"}
    if note: s["note"] = note
    SER[sid] = s
def build(data):
    tot = data.get("totals")
    if not tot: raise RuntimeError("falta el CSV de superficies totales por departamento")
    depts = {}; regions = {}
    for r in tot:
        depts[r["codedepartement"]] = r["departement"]; regions[r["coderegion"]] = r["region"]
    years = sorted({int(r["annee"]) for r in tot})
    # --- validaciones
    last = years[-1]; nd = len({r["codedepartement"] for r in tot if int(r["annee"]) == last})
    if nd < 95: raise RuntimeError("solo %d departamentos en %d" % (nd, last))
    by_dep = {}   # (dep, año) -> (surfbio, surfab, surfc123, nb_exp)
    for r in tot: by_dep[(r["codedepartement"], int(r["annee"]))] = (num(r["surfbio"]), num(r["surfab"]), num(r["surfc123"]), num(r["nb_exp"]))
    deps_all = sorted(depts)
    NOTE_SUM = "Suma de los departamentos; solo se publican los años sin ningun hueco («NC», secreto estadistico)."
    def national(idx):
        d = {}
        for y in years:
            vs = [by_dep.get((c, y), (None,) * 4)[idx] for c in deps_all if (c, y) in by_dep]
            if vs and len(vs) >= 95 and all(v is not None for v in vs): d[y] = sum(vs)
        return d
    area = national(0)
    if not area or not (1.0e6 <= area[max(area)] <= 6.0e6): raise RuntimeError("superficie nacional fuera de rango: %s" % (area.get(max(area)) if area else None))
    ys = sorted(area)
    for a, b in zip(ys, ys[1:]):
        if b == a + 1 and not (0.65 <= area[b] / area[a] <= 1.5): raise RuntimeError("salto anual implausible %d->%d: %s -> %s" % (a, b, area[a], area[b]))
    add("fr-ab-area-total", "Organic farming: total area, certified and in conversion, France (ha, Agence BIO)", "ha", area, NOTE_SUM)
    add("fr-ab-area-certified", "Organic farming: area with conversion completed, France (ha, Agence BIO)", "ha", national(1), NOTE_SUM)
    add("fr-ab-area-conversion", "Organic farming: area in conversion, France (ha, Agence BIO)", "ha", national(2), NOTE_SUM)
    add("fr-ab-farms", "Organic farming: committed holdings with area, France (number, Agence BIO)", "holdings", national(3), NOTE_SUM)
    reg_of = {}
    for r in tot: reg_of[r["codedepartement"]] = r["coderegion"]
    for rc in sorted(regions):
        cs = [c for c in deps_all if reg_of.get(c) == rc]
        for idx, sid, lab, unit in ((0, "area", "Organic farming area, %s (ha, Agence BIO)", "ha"), (3, "farms", "Organic farming holdings, %s (number, Agence BIO)", "holdings")):
            d = {}
            for y in years:
                vs = [by_dep[(c, y)][idx] for c in cs if (c, y) in by_dep]
                if vs and all(v is not None for v in vs): d[y] = sum(vs)
            add("fr-ab-reg-%s-%s" % (rc, sid), lab % regions[rc], unit, d, NOTE_SUM.replace("departamentos", "departamentos de la region"))
    for c in deps_all:
        d = {y: by_dep[(c, y)][0] for y in years if (c, y) in by_dep}
        add("fr-ab-dep-%s-area" % c.lower(), "Organic farming area, %s (ha, Agence BIO)" % depts[c], "ha", d)
    # --- cabaña
    NOTE_NC = "Suma de los departamentos que publican el dato; las celdas con secreto estadistico («NC») no se incluyen."
    hd = data.get("herds")
    if hd:
        for code, (en, unit) in HERDS.items():
            d = {}
            for r in hd:
                if r["code_groupe"] == code:
                    v = num(r["tetesbio"])
                    if v is not None: d[int(r["annee"])] = d.get(int(r["annee"]), 0) + v
            add("fr-ab-herd-%s" % code.lower(), "Organic livestock: %s, committed (%s, Agence BIO)" % (en, "hives" if unit == "hives" else "head"), unit, d, NOTE_NC)
        seen = sorted({(r["code_groupe"], r["groupe_production"]) for r in hd}); log("grupos de cabaña:", seen)
    gr = data.get("groups")
    if gr:
        seen = sorted({(r["code_groupe"], r["groupe_production"]) for r in gr}); log("grupos de superficie:", seen)
        for code, en in GROUPS.items():
            d = {}
            for r in gr:
                if r["code_groupe"] == code:
                    v = num(r["surfbio"])
                    if v is not None: d[int(r["annee"])] = d.get(int(r["annee"]), 0) + v
            add("fr-ab-grp-%s-area" % code.lower(), "Organic farming area: %s (ha, Agence BIO)" % en, "ha", d, NOTE_NC)
    op = data.get("operators")
    if op:
        d = {}; da = {}
        for r in op:
            v = num(r["nboperateur"])
            if v is None: continue
            y = int(r["annee"]); d[y] = d.get(y, 0) + v
            k = ACT.get(r["activites"]); 
            if k: da.setdefault(k, {})[y] = da.setdefault(k, {}).get(y, 0) + v
        add("fr-ab-operators", "Organic farming: certified operators, all activities, France (number, Agence BIO)", "operators", d, "Un operador cuenta una sola vez, con la actividad principal (P > T > D > I).")
        for (code, en), dd in da.items(): add("fr-ab-operators-%s" % code.lower(), "Organic farming: certified operators, %s, France (number, Agence BIO)" % en, "operators", dd, "Un operador cuenta una sola vez, con la actividad principal (P > T > D > I).")
        if d and not (10000 <= d[max(d)] <= 200000): raise RuntimeError("operadores fuera de rango: %s" % d[max(d)])
    return {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "countries": {"FR": {"name": "France", "extend": True, "source": {"name": "Agence BIO / organismes certificateurs (data.gouv.fr)", "url": "https://www.data.gouv.fr/datasets/" + SLUG, "license": "Licence Ouverte / Open Licence 2.0"},
                                 "series": sorted(SER.values(), key=lambda s: s["id"])}}, "log": LOG[-30:]}
def main():
    a = sys.argv[1:]; d = a[a.index("--dir") + 1] if "--dir" in a else None
    outdir = ROOT / "data"
    try:
        doc = build(load(d))
    except Exception as e:
        log("FALLO:", type(e).__name__, str(e)[:300]); (outdir / "france-organic-log.txt").write_text("\n".join(LOG) + "\n"); return 1
    log("series", len(SER))
    (outdir / "france-organic-log.txt").write_text("\n".join(LOG) + "\n")
    (outdir / "france-organic-stats.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return 0
if __name__ == "__main__": sys.exit(main())

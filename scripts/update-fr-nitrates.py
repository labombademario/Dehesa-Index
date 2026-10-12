#!/usr/bin/env python3
"""Francia: nitratos en las aguas subterraneas por departamento -> data/fr-nitrates.json
Fuente: API Hub'Eau «Qualité des nappes d'eau souterraines» (ADES, BRGM; datos publicos del sistema de informacion sobre el agua,
Licence Ouverte 2.0), parametro 1340 (nitratos, mg/l NO3). Por cada punto de control y ano Dehesa Index calcula la media de sus analisis
(un analisis por debajo del limite de cuantificacion cuenta como la mitad de ese limite) y, por departamento: numero de puntos, mediana de
las medias y % de puntos por encima de 25 y de 50 mg/l (50 mg/l es el limite del agua potable y de la Directiva de Nitratos).
Anos completos desde 2015; se recalculan los dos ultimos. Uso: python3 scripts/update-fr-nitrates.py"""
import datetime, json, statistics, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "fr-nitrates.json"
API = "https://hubeau.eaufrance.fr/api/v1/qualite_nappes/analyses"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
TODAY = datetime.date.today()
def get(u, t=240):
    last = None
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-110:], last))
def fetch(a, b):
    q = {"code_param": 1340, "format": "json", "size": 10000, "date_debut_prelevement": a, "date_fin_prelevement": b,
         "fields": "bss_id,num_departement,nom_departement,resultat,code_remarque,limite_quantification"}
    u = API + "?" + urllib.parse.urlencode(q); rows = []; total = None
    while u:
        d = get(u); total = d.get("count", total); rows += d.get("data") or []; u = d.get("next")
        if len(rows) >= 20000: break
    if total and len(rows) < total: raise RuntimeError("%s..%s: %d de %d filas (limite de la API)" % (a, b, len(rows), total))
    return rows
def year(y):
    rows = []
    for a, b in (("%d-01-01" % y, "%d-04-30" % y), ("%d-05-01" % y, "%d-08-31" % y), ("%d-09-01" % y, "%d-12-31" % y)):
        rows += fetch(a, b)
    pts = {}; names = {}
    for r in rows:
        v = r.get("resultat"); d = str(r.get("num_departement") or "").strip()
        if v is None or not d: continue
        try: v = float(v)
        except Exception: continue
        if str(r.get("code_remarque")) not in ("1", "None") and r.get("code_remarque") is not None:
            lq = r.get("limite_quantification"); v = float(lq) / 2 if lq else v / 2
        if not 0 <= v < 1000: continue
        pts.setdefault((d.zfill(2), r["bss_id"]), []).append(v); names[d.zfill(2)] = r.get("nom_departement")
    dep = {}
    for (d, _), vs in pts.items(): dep.setdefault(d, []).append(sum(vs) / len(vs))
    out = {d: [len(m), round(statistics.median(m), 1), round(100.0 * sum(1 for x in m if x > 25) / len(m), 1), round(100.0 * sum(1 for x in m if x > 50) / len(m), 1)] for d, m in sorted(dep.items())}
    allm = [x for m in dep.values() for x in m]
    return {"year": y, "analyses": len(rows), "points": len(allm), "median": round(statistics.median(allm), 1) if allm else None,
            "over25": round(100.0 * sum(1 for x in allm if x > 25) / max(1, len(allm)), 1), "over50": round(100.0 * sum(1 for x in allm if x > 50) / max(1, len(allm)), 1),
            "departments": out}, names
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    years = {x["year"]: x for x in old.get("years", [])}; names = dict(old.get("deptNames", {})); err = 0
    for y in range(2015, TODAY.year):
        if y in years and y < TODAY.year - 2: continue
        try:
            Y, nm = year(y); years[y] = Y; names.update(nm)
        except Exception as e: print("AVISO", y, e); err += 1
    ys = [years[k] for k in sorted(years)]
    if len(ys) < 5 or ys[-1]["points"] < 1500: print("FALLO: %d anos, ultimo con %s puntos" % (len(ys), ys[-1]["points"] if ys else 0)); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "mg/l NO3",
           "source": {"name": "ADES (BRGM), qualité des eaux souterraines, vía Hub'Eau", "url": "https://ades.eaufrance.fr/", "api": API, "license": "Licence Ouverte 2.0"},
           "deptFields": ["points", "median", "pctOver25", "pctOver50"], "deptNames": dict(sorted(names.items())), "years": ys}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    L = ys[-1]
    print("fr-nitrates.json: %d-%d; %d: %d puntos, mediana %.1f mg/l, %.1f %% > 50 mg/l, %d departamentos; %d errores" % (ys[0]["year"], L["year"], L["year"], L["points"], L["median"], L["over50"], len(L["departments"]), err))
    return 0
if __name__ == "__main__": sys.exit(main())

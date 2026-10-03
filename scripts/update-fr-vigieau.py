#!/usr/bin/env python3
"""Francia: restricciones de agua por departamento (VigiEau, Ministerio de la Transicion Ecologica) -> data/france-vigieau.json
Foto actual por departamento (nivel maximo y por origen: superficial, subterranea, agua potable) y NUESTRO historial diario de recuentos por nivel
(la API solo da el estado de hoy; el historial empieza el dia en que arranca esta tuberia y no se reconstruye). Niveles: vigilance < alerte < alerte_renforcee < crise; sin nivel = sin restricciones.
Modo sin red: FR_FIXTURES=<carpeta con vigieau.json>."""
import csv, datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://api.vigieau.beta.gouv.fr/api/departements"
LEVELS = ["vigilance", "alerte", "alerte_renforcee", "crise"]
LOG = []; FIX = os.environ.get("FR_FIXTURES")
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch():
    if FIX: return json.loads((Path(FIX) / "vigieau.json").read_text(encoding="utf-8"))
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}), timeout=90) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("VigiEau: " + str(last)[:160])
def lv(x): return x if x in LEVELS else None
DG = "https://www.data.gouv.fr/api/1/datasets/donnee-secheresse-vigieau/"
def http(url, js=False):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}), timeout=180) as r:
                b = r.read()
                return json.loads(b.decode("utf-8")) if js else b.decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(url[:60] + ": " + str(last)[:120])
def clean(t, n=240):
    t = re.sub(r"\s+", " ", (t or "")).strip(); return t if len(t) <= n else t[:n - 1].rstrip() + "…"
def status(d):
    """Clasificacion automatica del texto del arrete: none (sin restriccion), ban (prohibido sin excepciones), cond (con condiciones, horarios o excepciones)."""
    t = re.sub(r"\s+", " ", (d or "")).strip().lower()
    if re.match(r"^(pas de (restriction|limitation)|aucune (restriction|limitation)|autoris)", t) and "sauf" not in t[:30]: return "none"
    if t.startswith("interdit") and "sauf" not in t and "d\u00e9rogation" not in t and "exception" not in t: return "ban"
    return "cond"
def kind(nom, th):
    n = (nom or "").lower()
    if "abreuv" in n or "abreuv" in (th or "").lower(): return "wat"
    if "irrig" in n or (th or "") == "Irriguer": return "irr"
    return None
RANK = {"none": 0, "cond": 1, "ban": 2}
def zkey(r): return (r.get("zone.departement"), r.get("zone.type"), r.get("zone.nom"), r.get("arrete.id"))
def farm():
    """Zonas de restriccion vigentes y usos agrarios (riego y abrevado) por departamento + guia nacional por nivel. Fuente: CSV 'Restrictions' y 'Restriction Guide' del dataset data.gouv.fr de VigiEau."""
    if FIX:
        rp = Path(FIX) / "restrictions.csv"; gp = Path(FIX) / "guide.csv"
        if not rp.exists(): return None
        rt = rp.read_text(encoding="utf-8"); gt = gp.read_text(encoding="utf-8") if gp.exists() else ""
    else:
        ds = http(DG, True); rs = ds.get("resources", [])
        ru = [r["url"] for r in rs if r.get("format") == "csv" and (r.get("title") or "").strip().lower() == "restrictions"]
        gu = [r["url"] for r in rs if r.get("format") == "csv" and (r.get("title") or "").lower().startswith("restriction guide")]
        if not ru: raise RuntimeError("VigiEau: el CSV de restricciones no esta en el dataset")
        rt = http(ru[0]); gt = http(gu[0]) if gu else ""
    zones = {}; allz = set(); n = 0
    for r in csv.DictReader(io.StringIO(rt)):
        n += 1; z = zkey(r); allz.add(z)
        if r.get("usage.u.concerne_exploitation") != "true": continue
        k = kind(r.get("usage.u.nom"), r.get("usage.u.thematique"))
        e = zones.setdefault(z, {"irr": None, "wat": None})
        if k:
            st = status(r.get("usage.u.description"))
            if e[k] is None or RANK[st] > RANK[e[k]]: e[k] = st
    if n < 50: raise RuntimeError("VigiEau: el CSV de restricciones trae solo %d filas" % n)
    by = {}
    for z in allz:
        d = by.setdefault(z[0], {"z": 0, "irr": [0, 0, 0], "wat": [0, 0, 0]})
        d["z"] += 1
        e = zones.get(z)
        if not e: continue
        for k in ("irr", "wat"):
            if e[k]: d[k][RANK[e[k]]] += 1
    guide = []
    if gt:
        for r in csv.DictReader(io.StringIO(gt)):
            if r.get("concerne_exploitation") == "True" and r.get("thematique") in ("Irrigation", "Abreuvement"):
                guide.append([r["thematique"], clean(r["usage"], 120)] + [clean(r.get(l), 220) for l in LEVELS])
    log("restricciones: filas", n, "zonas", len(allz), "departamentos", len(by), "guia", len(guide))
    return {"departments": dict(sorted(by.items())), "guide": guide, "rows": n}
def build(outdir, today):
    raw = fetch()
    if not isinstance(raw, list) or len(raw) < 90: raise RuntimeError("VigiEau devolvio %s departamentos (se esperaban ~101)" % (len(raw) if isinstance(raw, list) else "?"))
    deps = []; counts = {k: 0 for k in LEVELS}; counts["none"] = 0; asof = None
    for d in raw:
        mx = lv(d.get("niveauGraviteMax"))
        deps.append({"code": d["code"], "name": d["nom"], "region": d.get("region"), "level": mx, "sup": lv(d.get("niveauGraviteSupMax")), "sou": lv(d.get("niveauGraviteSouMax")), "aep": lv(d.get("niveauGraviteAepMax"))})
        counts[mx or "none"] += 1
        a = ((d.get("availability") or {}).get("AEP") or {}).get("asOf")
        if a and (asof is None or a > asof): asof = a
    prev = outdir / "france-vigieau.json"; hist = []
    if prev.exists():
        try: hist = json.loads(prev.read_text(encoding="utf-8")).get("history", [])
        except Exception: hist = []
    hist = [h for h in hist if h.get("date") != today] + [{"date": today, "counts": counts}]
    hist = sorted(hist, key=lambda h: h["date"])[-1200:]
    log("departamentos", len(deps), "recuento", json.dumps(counts))
    fm = None
    try: fm = farm()
    except Exception as e: log("AVISO usos agrarios:", str(e)[:200])
    if fm is None and prev.exists():
        try: fm = json.loads(prev.read_text(encoding="utf-8")).get("farm")
        except Exception: fm = None
    out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "FR",
            "source": {"id": "vigieau", "name": "VigiEau (Ministere de la Transition ecologique), restrictions d'usage de l'eau", "url": "https://vigieau.gouv.fr/", "license": "Licence Ouverte 2.0 (data.gouv.fr)", "asOf": asof},
            "levels": LEVELS, "departments": sorted(deps, key=lambda x: x["code"]), "counts": counts, "history": hist,
            "notes": {"history": "Historial propio: un recuento por dia de ejecucion desde que arranco la tuberia; la API publica solo el estado vigente.", "level": "Nivel maximo vigente en el departamento entre sus zonas de restriccion (sup=aguas superficiales, sou=subterraneas, aep=agua potable).", "farm": "farm.departments[codigo]: z=zonas con arrete vigente; irr y wat = zonas por trato del riego y del abrevado [sin restriccion, con condiciones u horarios, prohibido]. Clasificacion automatica del texto del arrete: solo orientativa, manda el arrete. farm.guide = guia nacional por nivel."}}
    if fm: out["farm"] = dict(fm, asOf=today)
    return out
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    today = args[args.index("--date") + 1] if "--date" in args else datetime.date.today().isoformat()
    outdir.mkdir(parents=True, exist_ok=True)
    try: doc = build(outdir, today)
    except Exception as e:
        log("FALLO:", type(e).__name__, str(e)[:300])
        if os.environ.get("GITHUB_ACTIONS"): print("::error title=fr-vigieau::" + " | ".join(LOG[-6:])[:3000].replace("%", "%25").replace("\n", "%0A"), flush=True)
        return 1
    s = json.dumps(doc, ensure_ascii=False, separators=(",", ":")); (outdir / "france-vigieau.json").write_text(s, encoding="utf-8")
    log("escrito france-vigieau.json", len(s) // 1024, "KB"); return 0
if __name__ == "__main__": sys.exit(main())

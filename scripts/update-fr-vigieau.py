#!/usr/bin/env python3
"""Francia: restricciones de agua por departamento (VigiEau, Ministerio de la Transicion Ecologica) -> data/france-vigieau.json
Foto actual por departamento (nivel maximo y por origen: superficial, subterranea, agua potable) y NUESTRO historial diario de recuentos por nivel
(la API solo da el estado de hoy; el historial empieza el dia en que arranca esta tuberia y no se reconstruye). Niveles: vigilance < alerte < alerte_renforcee < crise; sin nivel = sin restricciones.
Modo sin red: FR_FIXTURES=<carpeta con vigieau.json>."""
import datetime, json, os, sys, time, urllib.request
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
    return {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "FR",
            "source": {"id": "vigieau", "name": "VigiEau (Ministere de la Transition ecologique), restrictions d'usage de l'eau", "url": "https://vigieau.gouv.fr/", "license": "Licence Ouverte 2.0 (data.gouv.fr)", "asOf": asof},
            "levels": LEVELS, "departments": sorted(deps, key=lambda x: x["code"]), "counts": counts, "history": hist,
            "notes": {"history": "Historial propio: un recuento por dia de ejecucion desde que arranco la tuberia; la API publica solo el estado vigente.", "level": "Nivel maximo vigente en el departamento entre sus zonas de restriccion (sup=aguas superficiales, sou=subterraneas, aep=agua potable)."}}
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

#!/usr/bin/env python3
"""Irlanda: nitratos en las aguas subterraneas y estado ecologico de los rios -> data/ie-nitrates.json
Agencia de Proteccion Ambiental de Irlanda (EPA), publicados por el CSO como indicadores ambientales (licencia CC BY 4.0):
- EIIA14 «Ireland nitrates in groundwater»: porcentaje de puntos de control de aguas subterraneas por tramo de nitrato (mg/l NO3), 2016-... El umbral de la
  Directiva de Nitratos de la UE es 50 mg/l (tramo «>=50»).
- EIIA13 «Ireland river water quality»: porcentaje de tramos de rio por estado ecologico (Directiva Marco del Agua), por periodo de evaluacion de 3 anos.
La EPA no publica en abierto la concentracion de nitrato por region o por estacion en un formato fijo: lo que hay es este resumen nacional.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-ie-nitrates.py"""
import datetime, importlib.util, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ie-nitrates.json"
spec = importlib.util.spec_from_file_location("ied", ROOT / "scripts" / "update-ie-diesel.py"); IED = importlib.util.module_from_spec(spec); spec.loader.exec_module(IED)
def table(code, cats, raw=None):
    ts, C, v = IED.jsonstat(code, raw); rows = []
    for t in ts:
        r = [v(t, c) for c in cats]
        if any(x is None for x in r): continue
        if abs(sum(r) - 100) > 2: raise ValueError("%s %s: suma %.1f" % (code, t, sum(r)))
        rows.append([t] + [round(x, 1) for x in r])
    return rows
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Environmental Protection Agency (EPA) Irlanda, vía CSO: indicadores EIIA14 y EIIA13", "url": "https://www.cso.ie/en/statistics/environment/environmentalindicatorsireland/",
                      "epaUrl": "https://www.epa.ie/", "license": "CC BY 4.0 (CSO; EPA)"},
           "groundwaterClasses": ["lt5", "5to10", "10to25", "25to37", "37to50", "ge50"], "groundwaterLabels": ["<5", "5–<10", "10–<25", "25–<37,5", "37,5–<50", "≥50"], "groundwaterUnit": "% de puntos de control, mg/l NO3",
           "riverClasses": ["high", "good", "moderate", "poor", "bad"], "riverUnit": "% de tramos de rio"}
    for key, code, cats in (("groundwater", "EIIA14", ["10", "20", "30", "40", "50", "60"]), ("rivers", "EIIA13", ["12", "11", "21", "22", "23"])):
        try:
            doc[key] = table(code, cats)
            if len(doc[key]) < 5: raise ValueError("%s: solo %d periodos" % (code, len(doc[key])))
        except Exception as e:
            print("AVISO %s:" % code, e)
            if old.get(key): doc[key] = old[key]
    if "groundwater" not in doc or "rivers" not in doc: print("FALLO"); return 0 if OUT.exists() else 1
    doc["asOf"] = doc["groundwater"][-1][0] + "-12-31"   # el indicador es anual: asOf = fin del ultimo ano evaluado
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    g = doc["groundwater"][-1]; r = doc["rivers"][-1]
    print("ie-nitrates.json: aguas subterraneas %s: %s%% de puntos >= 50 mg/l (%d años); rios %s: %s%% en estado bueno o alto" % (g[0], g[6], len(doc["groundwater"]), r[0], round(r[1] + r[2], 1)))
    return 0
if __name__ == "__main__": sys.exit(main())

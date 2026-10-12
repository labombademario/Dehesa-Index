#!/usr/bin/env python3
"""Francia: rios que se quedan sin agua en verano (Observatoire national des étiages, ONDE, Office français de la biodiversité) -> data/fr-onde.json
Fuente: API Hub'Eau «Écoulement des cours d'eau» (hubeau.eaufrance.fr, datos publicos del sistema de informacion sobre el agua, Licence Ouverte 2.0).
Unos 3.500 puntos de pequenos rios se visitan cada mes de mayo a septiembre (campanas «usuales», mas campanas complementarias en crisis) y se
anota si el agua corre (1, 1a, 1f), si hay agua pero no corre (2, «écoulement non visible») o si el cauce esta seco (3, «assec»).
Dehesa Index cuenta, por mes y departamento, cuantos puntos hay en cada estado (si un punto se visita dos veces en el mes cuenta la ultima visita).
Historico desde 2012. Uso: python3 scripts/update-fr-onde.py"""
import datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "fr-onde.json"
API = "https://hubeau.eaufrance.fr/api/v1/ecoulement/observations"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
TODAY = datetime.date.today()
CLS = {"1": "flow", "1a": "flow", "1f": "flow", "2": "noflow", "3": "dry"}
def get(u, t=180):
    last = None
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-110:], last))
def month(y, m):
    a = datetime.date(y, m, 1); b = (a + datetime.timedelta(days=32)).replace(day=1) - datetime.timedelta(days=1)
    q = {"format": "json", "size": 5000, "date_observation_min": a.isoformat(), "date_observation_max": b.isoformat(),
         "fields": "code_station,code_departement,libelle_departement,code_ecoulement,date_observation"}
    u = API + "?" + urllib.parse.urlencode(q); rows = []
    while u:
        d = get(u); rows += d.get("data") or []; u = d.get("next")
        if len(rows) > 19000: break
    return rows
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    months = dict((m["month"], m) for m in old.get("months", []))
    names = dict(old.get("deptNames", {}))
    todo = []
    for y in range(2012, TODAY.year + 1):
        for m in range(5, 11):
            key = "%d-%02d" % (y, m)
            if datetime.date(y, m, 1) > TODAY: continue
            # se vuelven a pedir los meses del ano en curso y del anterior (pueden llegar observaciones tarde); los antiguos se guardan
            if key in months and y < TODAY.year - 1: continue
            todo.append((y, m))
    err = 0
    for y, m in todo:
        try: rows = month(y, m)
        except Exception as e: print("AVISO", y, m, e); err += 1; continue
        last = {}
        for r in rows:
            c = CLS.get(str(r.get("code_ecoulement") or ""))
            if not c or not r.get("code_departement"): continue
            k = r["code_station"]
            if k not in last or r["date_observation"] >= last[k][0]: last[k] = (r["date_observation"], str(r["code_departement"]).zfill(2), c)
            names[str(r["code_departement"]).zfill(2)] = r.get("libelle_departement") or names.get(str(r["code_departement"]).zfill(2))
        if not last: months.pop("%d-%02d" % (y, m), None); continue
        dep = {}
        for _, d, c in last.values():
            v = dep.setdefault(d, [0, 0, 0]); v[["flow", "noflow", "dry"].index(c)] += 1
        tot = [sum(v[i] for v in dep.values()) for i in range(3)]
        months["%d-%02d" % (y, m)] = {"month": "%d-%02d" % (y, m), "total": tot, "departments": dict(sorted(dep.items()))}
    ms = [months[k] for k in sorted(months)]
    if len(ms) < 40 or err > len(todo) // 2: print("FALLO: %d meses, %d errores" % (len(ms), err)); return 0 if OUT.exists() else 1
    last = ms[-1]
    if sum(last["total"]) < 500: print("AVISO: ultimo mes %s con pocas observaciones (%d)" % (last["month"], sum(last["total"])))
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": last["month"],
           "source": {"name": "OFB, Observatoire national des étiages (ONDE), vía Hub'Eau", "url": "https://onde.eaufrance.fr/", "api": API, "license": "Licence Ouverte 2.0"},
           "classes": ["flow", "noflow", "dry"], "deptNames": dict(sorted(names.items())), "months": ms}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    t = last["total"]
    print("fr-onde.json: %d meses (%s..%s); %s: %d puntos, %.1f %% secos, %.1f %% sin corriente; %d errores" % (len(ms), ms[0]["month"], last["month"], last["month"], sum(t), 100.0 * t[2] / max(1, sum(t)), 100.0 * t[1] / max(1, sum(t)), err))
    return 0
if __name__ == "__main__": sys.exit(main())

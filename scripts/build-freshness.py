#!/usr/bin/env python3
"""Informe de frescura (Freshness Engine 2.0) -> data/freshness.json.
Aplica el motor a (1) las observaciones de data/latest.json y (2) las 5.818 series del catalogo (campo `fs`), y explica por que cada
observacion esta en su estado. Resume por fuente y por estado; lista lo DELAYED/STALE con la fecha en la que se esperaba el siguiente dato."""
import datetime, glob, json, sys
from collections import Counter
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import freshness as FR
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "data"
now_ms = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000; now = FR.today_ord(now_ms)
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":"))
lat = json.loads((D / "latest.json").read_text(encoding="utf-8"))["observations"]
obs = []
for o in lat:
    r = FR.evaluate(o["observationDate"], o["frequency"], o["sourceId"], now)
    row = {"id": o["id"], "product": o["product"], "region": o["region"], "sourceId": o["sourceId"], "frequency": o["frequency"], "observationDate": o["observationDate"], "state": r["state"], "ageDays": r["ageDays"]}
    if r["state"] != "PENDING": row.update({"lagDays": r["lagDays"], "expectedNext": FR.iso(r["due"]), "why": FR.explain(r, o["frequency"])})
    obs.append(row)
cat = Counter(); by_src = {}; late = []
man = json.loads((D / "catalog/manifest.json").read_text(encoding="utf-8"))
for f in sorted(glob.glob(str(D / "catalog/*.json")) + glob.glob(str(D / "catalog/eu/*.json"))):
    if f.endswith("manifest.json"): continue
    for s in json.loads(Path(f).read_text(encoding="utf-8"))["series"]:
        cat[s["fs"]] += 1; by_src.setdefault(s["sourceId"], Counter())[s["fs"]] += 1
        if s["fs"] in ("DELAYED", "STALE"):
            r = FR.evaluate(s["latestPeriod"], s["freq"], s["sourceId"], now); late.append({"id": s["id"], "sourceId": s["sourceId"], "frequency": s["freq"], "latestPeriod": s["latestPeriod"], "state": s["fs"], "expectedNext": FR.iso(r["due"])})
late.sort(key=lambda x: (x["state"] != "STALE", x["sourceId"], x["id"]))
out = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "policy": "freshness-policy.json",
       "latest": {"total": len(obs), "byState": dict(Counter(o["state"] for o in obs)), "observations": obs},
       "catalog": {"total": sum(cat.values()), "byState": dict(cat), "bySource": {k: dict(v) for k, v in sorted(by_src.items())}, "lateSample": late[:200], "lateTotal": len(late)},
       "explanation": "Antes, 46 de 81 observaciones se marcaban 'stale' al medir la edad desde el INICIO del periodo con umbrales fijos (p. ej. 45 dias para series mensuales): un dato mensual de agosto ya contaba como viejo el 15 de octubre aunque fuera el ultimo publicable. Ahora se mide contra el calendario de publicacion de cada fuente."}
p = D / "freshness.json"
try:
    old = json.loads(p.read_text(encoding="utf-8")); g = old.pop("generatedAt", None); same = dump(old | {"generatedAt": None}) == dump(out | {"generatedAt": None})
except Exception: same = False; g = None
if same: out["generatedAt"] = g
p.write_text(dump(out) + "\n", encoding="utf-8")
print("Frescura: latest", out["latest"]["byState"], "| catalogo", out["catalog"]["byState"])

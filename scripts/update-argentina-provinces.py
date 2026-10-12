#!/usr/bin/env python3
"""Argentina por provincia -> data/ar-provinces.json
Fuente: Ministerio de Agricultura, Ganaderia y Pesca (MAGyP), «Estimaciones agricolas» (datos.magyp.gob.ar, CC BY 4.0): superficie sembrada y
cosechada, produccion y rendimiento por cultivo, campaña, provincia y departamento. Aqui se suma por provincia (los departamentos sin dato no
cuentan; el rendimiento de la provincia es produccion / superficie cosechada, calculado por Dehesa Index). Ultimas 25 campañas de los cultivos
extensivos principales. Uso: python3 scripts/update-argentina-provinces.py"""
import csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ar-provinces.json"
PKG = "https://datos.magyp.gob.ar/api/3/action/package_show?id=estimaciones-agricolas"
H = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
# INDEC (provincia_id) -> ISO 3166-2:AR (letra), que es el id del mapa
ISO = {"02": "C", "06": "B", "10": "K", "14": "X", "18": "W", "22": "H", "26": "U", "30": "E", "34": "P", "38": "Y", "42": "L", "46": "F", "50": "M", "54": "N", "58": "Q", "62": "R",
       "66": "A", "70": "J", "74": "D", "78": "Z", "82": "S", "86": "G", "90": "T", "94": "V"}
CROPS = {"soja total": "soja", "soja 1ra": None, "soja 2da": None, "maíz": "maiz", "trigo total": "trigo", "girasol": "girasol", "cebada total": "cebada", "sorgo": "sorgo", "maní": "mani", "algodón": "algodon", "arroz": "arroz", "avena": "avena", "poroto seco": "poroto"}
KEEP = 25
def get(u, t=300):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:100], last))
def num(s):
    try: return float(str(s).replace(",", "."))
    except Exception: return None
def main():
    res = json.loads(get(PKG))["result"]["resources"]
    url = next(r["url"] for r in res if (r.get("format") or "").lower() == "csv" and "estimaciones-agricolas" in r["url"])
    rows = list(csv.DictReader(io.StringIO(get(url).decode("utf-8-sig"))))
    if len(rows) < 50000: print("FALLO: solo %d filas" % len(rows)); return 1
    names = {r["cultivo"] for r in rows}
    agg = {}   # (cultivo, campaña, prov) -> [sembrada, cosechada, produccion]
    for r in rows:
        c = r["cultivo"].strip().lower(); key = CROPS.get(c)
        if not key: continue
        p = ISO.get(r["provincia_id"].strip().zfill(2))
        if not p: continue
        a = agg.setdefault((key, r["campania"].strip(), p), [0.0, 0.0, 0.0])
        for i, k in enumerate(("superficie_sembrada_ha", "superficie_cosechada_ha", "produccion_tm")):
            v = num(r[k])
            if v is not None and v >= 0: a[i] += v
    camps = sorted({k[1] for k in agg})[-KEEP:]
    out = {}
    for (crop, camp, p), (s, h, q) in agg.items():
        if camp not in camps or (s == 0 and q == 0): continue
        out.setdefault(p, {}).setdefault(crop, {})[camp] = [round(s), round(h), round(q), round(q * 1000 / h) if h > 0 else None]
    missing = sorted(set(CROPS) - names - {"soja 1ra", "soja 2da"})
    if missing: print("AVISO cultivos no encontrados en el fichero:", missing)
    nat = {}
    for p, cs in out.items():
        for crop, ss in cs.items():
            for camp, v in ss.items():
                n = nat.setdefault(crop, {}).setdefault(camp, [0, 0, 0]); n[0] += v[0]; n[1] += v[1]; n[2] += v[2]
    soy = nat.get("soja", {}).get(camps[-1], [0, 0, 0])[2] if camps else 0
    if len(out) < 14 or not (5e6 < max(v[2] for v in nat.get("soja", {}).values() or [[0, 0, 0]]) < 8e7): print("FALLO: datos incoherentes (%d provincias, soja max %s)" % (len(out), soy)); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Ministerio de Agricultura, Ganaderia y Pesca (MAGyP), Estimaciones agricolas", "url": "https://datos.magyp.gob.ar/dataset/estimaciones-agricolas", "license": "CC BY 4.0", "file": url.rsplit("/", 1)[-1]},
           "fields": ["sown_ha", "harvested_ha", "production_t", "yield_kg_ha"], "campaigns": camps, "lastCampaign": camps[-1],
           "national": {c: {k: v for k, v in sorted(ss.items())} for c, ss in sorted(nat.items())}, "provinces": {p: {c: dict(sorted(ss.items())) for c, ss in sorted(cs.items())} for p, cs in sorted(out.items())}}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("ar-provinces.json", OUT.stat().st_size, "bytes,", len(out), "provincias, campañas", camps[0], "..", camps[-1]); return 0
if __name__ == "__main__": sys.exit(main())

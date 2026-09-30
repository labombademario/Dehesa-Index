#!/usr/bin/env python3
"""Canadá: precios agrícolas mensuales de Statistics Canada, tabla 32-10-0077-01
(Farm product prices, crops and livestock). Licencia Open Government Licence - Canada.
La tabla solo trae provincias (no hay total nacional): para cada producto se elige una provincia de
referencia según una lista de preferencia fija y se exige dato reciente y suficiente historia.
Escribe observaciones region 'ca' en data/snapshots/<fecha>.json y un informe en data/canada-coverage.json."""
import csv, io, json, re, sys, urllib.request, zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP_DIR = ROOT / "data" / "snapshots"
PID = 32100077
WDS = "https://www150.statcan.gc.ca/t1/wds/rest/"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0", "Content-Type": "application/json"}

# nuestro producto -> (producto de StatCan, provincias por orden de preferencia, UOM publicada, unidad final, conversión)
SPEC = {
    "trigo":   ("Wheat (except durum wheat)", ["Saskatchewan", "Alberta", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "cebada":  ("Barley", ["Alberta", "Saskatchewan", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "avena":   ("Oats", ["Saskatchewan", "Manitoba", "Alberta"], "Dollars per metric tonne", "tonelada", 1.0),
    "colza":   ("Canola (including rapeseed)", ["Saskatchewan", "Alberta", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "maiz":    ("Corn for grain", ["Ontario", "Quebec"], "Dollars per metric tonne", "tonelada", 1.0),
    "centeno": ("Rye", ["Saskatchewan", "Alberta", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "soja_grano": ("Soybeans", ["Ontario", "Quebec", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "lenteja": ("Lentils", ["Saskatchewan", "Alberta"], "Dollars per metric tonne", "tonelada", 1.0),
    "guisante_seco": ("Dry peas", ["Saskatchewan", "Alberta", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    "lino": ("Flaxseed", ["Saskatchewan", "Manitoba"], "Dollars per metric tonne", "tonelada", 1.0),
    # leche: $/kilolitro -> $/100 kg con densidad 1,03 kg/l (1 kl = 1.030 kg), igual que Defra
    "leche":   ("Unprocessed milk from bovine", ["Quebec", "Ontario"], "Dollars per kilolitre", "100kg", 100.0 / 1030.0),
    "vaca":    ("Steers for slaughter", ["Alberta", "Ontario"], "Dollars per hundredweight", "cwt", 1.0),
    "cerdo":   ("Hogs", ["Ontario", "Quebec", "Manitoba"], "Dollars per hundredweight", "cwt", 1.0),
    "cordero": ("Lambs", ["Ontario", "Quebec", "Alberta"], "Dollars per hundredweight", "cwt", 1.0),
    "pollo":   ("Chickens for meat", ["Ontario", "Quebec"], "Dollars per kilogram", "kg", 1.0),
    "huevos":  ("Eggs in shell", ["Ontario", "Quebec"], "Dollars per dozen", "docena", 1.0),
}
CAT = {"soja_grano": "cereales", "lenteja": "cereales", "guisante_seco": "cereales", "lino": "cereales", "trigo": "cereales", "cebada": "cereales", "avena": "cereales", "colza": "cereales", "maiz": "cereales", "centeno": "cereales",
       "leche": "lacteos", "vaca": "ganado", "cerdo": "porcino", "cordero": "ovino", "pollo": "avicultura", "huevos": "avicultura"}

def call(path, body=None):
    req = urllib.request.Request(WDS + path, data=None if body is None else json.dumps(body).encode(), headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

now = datetime.now(timezone.utc)
verified_at = now.isoformat(timespec="seconds").replace("+00:00", "Z")
pub_date = now.date().isoformat()
try:
    meta = call("getCubeMetadata", [{"productId": PID}])
    rel = meta[0]["object"].get("releaseTime") or ""
    if re.match(r"\d{4}-\d{2}-\d{2}", rel):
        pub_date = rel[:10]
except Exception as e:
    print("releaseTime no disponible:", e)

info = call("getFullTableDownloadCSV/%d/en" % PID)
raw = urllib.request.urlopen(urllib.request.Request(info["object"], headers={"User-Agent": UA["User-Agent"]}), timeout=300).read()
z = zipfile.ZipFile(io.BytesIO(raw))
name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
series = {}  # (producto, provincia, uom) -> {periodo: valor}
for r in csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")):
    prod = re.sub(r"\s*\[\d+\]\s*$", "", r["Farm products"]).strip()
    if r["VALUE"] == "":
        continue
    series.setdefault((prod, r["GEO"], r["UOM"]), {})[r["REF_DATE"]] = float(r["VALUE"])
table_max = max(p for s in series.values() for p in s)
print("tabla", PID, "último periodo", table_max)

def months_back(ym, n):
    y, m = int(ym[:4]), int(ym[5:])
    t = y * 12 + (m - 1) - n
    return "%04d-%02d" % (t // 12, t % 12 + 1)

min_recent = months_back(table_max, 3)
coverage, observations = {}, []
for key, (sc_prod, provs, uom, unit, conv) in SPEC.items():
    rep = {"statcanProduct": sc_prod, "candidates": {}}
    chosen = None
    for prov in provs:
        s = series.get((sc_prod, prov, uom))
        if not s:
            rep["candidates"][prov] = "sin serie (o unidad distinta)"
            continue
        periods = sorted(s)
        last = periods[-1]
        recent36 = sum(1 for p in periods if p > months_back(table_max, 36))
        rep["candidates"][prov] = {"last": last, "points": len(periods), "last36m": recent36}
        if chosen is None and last >= min_recent and recent36 >= 24:
            chosen = (prov, s)
    if not chosen:
        rep["result"] = "SIN DATO: ninguna provincia cumple (último dato <= 3 meses y >= 24 meses de los últimos 36)"
        coverage[key] = rep
        continue
    prov, s = chosen
    periods = sorted(s)
    pts = [(p, round(s[p] * conv, 4)) for p in periods][-240:]
    last, val = pts[-1]
    prev = pts[-2][1] if len(pts) > 1 and months_back(last, 1) == pts[-2][0] else None
    change = round((val / prev - 1) * 100, 4) if prev else None
    rep["result"] = {"province": prov, "last": last, "value": val, "unit": unit}
    coverage[key] = rep
    observations.append({
        "id": "di_%s_%s_ca" % (CAT[key], key), "product": key, "region": "ca", "sourceId": "statcan",
        "observationDate": last, "publicationDate": pub_date, "status": "verified", "verifiedAt": verified_at,
        "comparability": "directional",
        "methodology": "Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en %s, %s, publicado en %s%s. Canadá no publica total nacional en esta tabla: se usa la provincia de referencia." % (prov, sc_prod, uom.replace("Dollars", "CAD"), "; expresado en CAD/100 kg con una densidad de 1,03 kg/l (estándar de la leche de vaca)" if key == "leche" else ""),
        "value": val, "currency": "CAD", "unit": unit, "frequency": "monthly", "changePct": change,
        "province": prov,
        "history": [{"period": p[5:], "year": int(p[:4]), "value": v} for p, v in pts],
    })
    print("OK", key, prov, last, val, unit)

(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "data" / "canada-coverage.json").write_text(json.dumps({"generatedAt": verified_at, "table": PID, "tableMax": table_max, "publicationDate": pub_date, "products": coverage}, indent=1, ensure_ascii=False) + "\n")
if not observations:
    sys.exit("Sin observaciones de Canadá")
SNAP_DIR.mkdir(parents=True, exist_ok=True)
snap = SNAP_DIR / (now.date().isoformat() + ".json")
doc = {"schemaVersion": "1.0", "generatedAt": verified_at, "observations": []}
if snap.exists():
    doc = json.loads(snap.read_text(encoding="utf-8"))
doc["observations"] = [o for o in doc.get("observations", []) if o.get("region") != "ca"] + observations
snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(len(observations), "observaciones de Canadá")

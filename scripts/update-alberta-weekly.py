#!/usr/bin/env python3
"""Alberta: Weekly Crop Market Review y Weekly Livestock Market Review (Alberta Agriculture and Irrigation,
Open Government Licence - Alberta). Son PDF semanales de formato fijo: se descargan, se convierten con
pdftotext -layout y se extraen solo las cifras con etiqueta exacta. Lo extraído queda en data/alberta-weekly.json
(caché por número de la semana) para no volver a bajar los PDF antiguos. Escribe observaciones region 'ca',
sourceId 'alberta_ag', frecuencia semanal. La fecha es la del informe (viernes)."""
import json, re, subprocess, sys, tempfile, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "alberta-weekly.json"
SNAP_DIR = ROOT / "data" / "snapshots"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
LISTINGS = {
    "crop": ["https://open.alberta.ca/publications/3479492", "https://open.alberta.ca/publications/3479492-2025"],
    "livestock": ["https://open.alberta.ca/publications/3479685", "https://open.alberta.ca/publications/3479685-2025"],
}
# producto -> (categoría, unidad, etiqueta en el informe)
PRODUCTS = {
    "canola_elevador":   ("cereales", "tonelada", "Canola, oferta de elevador (Alberta centro, entregado)"),
    "trigo_pienso_ab":   ("cereales", "tonelada", "Trigo forrajero, oferta de elevador (Alberta centro, entregado)"),
    "cebada_pienso_ab":  ("cereales", "tonelada", "Cebada forrajera, oferta de elevador (Alberta centro, entregado)"),
    "avena_pienso_ab":   ("cereales", "tonelada", "Avena forrajera, oferta de elevador (Alberta centro, entregado)"),
    "trigo_cwrs_ab":     ("cereales", "tonelada", "Trigo CWRS n.º 1/2, oferta media de elevador (Alberta)"),
    "lenteja_laird_ab":  ("cereales", "tonelada", "Lenteja Laird n.º 1, oferta al contado (Alberta)"),
    "guisante_verde_ab": ("cereales", "tonelada", "Guisante verde n.º 2 o mejor, oferta al contado (Alberta)"),
    "novillo_ab":        ("ganado", "cwt", "Novillos, ventas directas de Alberta, precio medio en vivo"),
    "cerdo_ab":          ("porcino", "kg", "Cerdo, precio al contado de Alberta, índice 100, por kg de canal"),
}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()

def num(m, g=1):
    return float(m.group(g).replace(",", "")) if m else None

def parse_crop(t):
    out = {}
    for key, rx in [("canola_elevador", r"CANOLA\s+-\*?Central\s+([\d,.]+)"), ("trigo_pienso_ab", r"FEED WHEAT\s+-\*?Central\s+([\d,.]+)"),
                    ("cebada_pienso_ab", r"FEED BARLEY\s+-\*?Central\s+([\d,.]+)"), ("avena_pienso_ab", r"FEED OATS\s+-\*?Central\s+([\d,.]+)"),
                    ("lenteja_laird_ab", r"#1 LAIRD\s+([\d,.]+)"), ("guisante_verde_ab", r"GREEN #2 OR BETTER\s+([\d,.]+)")]:
        v = num(re.search(rx, t))
        if v is not None: out[key] = v
    m = re.search(r"CWRS\*?\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+[+-]?[\d,.]+", t)
    if m: out["trigo_cwrs_ab"] = num(m, 3)
    return out

def parse_livestock(t):
    out = {}
    i = t.find("ALBERTA DIRECT SALES")
    if i >= 0:
        avgs = re.findall(r"\bAVERAGE\s+([\d,.]+)\s+[\d,.N/A]+", t[i:])
        if avgs: out["novillo_ab"] = float(avgs[0].replace(",", ""))   # primera fila AVERAGE = novillos (STR); la segunda son vaquillas
    m = re.search(r"ALTA AVG\s+([\d,.]+)\s+[\d,.N/A]+", t)
    if m: out["cerdo_ab"] = num(m)
    return out

def issue_links(kind):
    links = {}
    for url in LISTINGS[kind]:
        try:
            html = get(url).decode("utf-8", "ignore")
        except Exception as e:
            print("listado no disponible", url, e); continue
        for l in re.findall(r'href="([^"]+\.pdf[^"]*)"', html):
            d = re.search(r"(\d{4}-\d{2}-\d{2})\.pdf", l)
            if d:
                links[d.group(1)] = ("https://open.alberta.ca" + l) if l.startswith("/") else l
    return links

cache = {"issues": {}}
if CACHE.exists():
    cache = json.loads(CACHE.read_text(encoding="utf-8"))
issues = cache.setdefault("issues", {})
new_count = 0
for kind, parser in (("crop", parse_crop), ("livestock", parse_livestock)):
    for d, url in sorted(issue_links(kind).items()):
        if kind in issues.get(d, {}):
            continue
        try:
            with tempfile.TemporaryDirectory() as tmp:
                pdf = Path(tmp) / "x.pdf"; pdf.write_bytes(get(url))
                txt = Path(tmp) / "x.txt"
                subprocess.run(["pdftotext", "-layout", str(pdf), str(txt)], check=True)
                vals = parser(txt.read_text(errors="ignore"))
            issues.setdefault(d, {})[kind] = vals
            new_count += 1
        except Exception as e:
            print("FALLO", kind, d, e)
print("informes nuevos:", new_count)
CACHE.write_text(json.dumps(cache, indent=1, sort_keys=True) + "\n", encoding="utf-8")

now = datetime.now(timezone.utc)
verified_at = now.isoformat(timespec="seconds").replace("+00:00", "Z")
observations, report = [], {}
for key, (cat, unit, label) in PRODUCTS.items():
    pts = []
    for d in sorted(issues):
        for kind in ("crop", "livestock"):
            v = issues[d].get(kind, {}).get(key)
            if v is not None: pts.append((d, v))
    report[key] = {"points": len(pts), "last": pts[-1] if pts else None}
    if len(pts) < 12:
        print("SIN DATO suficiente:", key, len(pts)); continue
    pts = pts[-104:]
    d, val = pts[-1]
    prev = pts[-2][1]
    change = round((val / prev - 1) * 100, 4) if prev else None
    observations.append({
        "id": "di_%s_%s_ca" % (cat, key), "product": key, "region": "ca", "sourceId": "alberta_ag",
        "observationDate": d, "publicationDate": d, "status": "verified", "verifiedAt": verified_at,
        "comparability": "directional",
        "methodology": "Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta): %s. Cifra tomada del informe semanal en PDF de la fecha indicada; las ofertas de elevador y de compradores son precios ofrecidos, no operaciones cerradas." % label,
        "value": val, "currency": "CAD", "unit": unit, "frequency": "weekly", "changePct": change, "province": "Alberta",
        "history": [{"period": p[5:], "year": int(p[:4]), "value": v} for p, v in pts],
    })
    print("OK", key, d, val, len(pts), "puntos")
(ROOT / "data" / "alberta-weekly-report.json").write_text(json.dumps({"generatedAt": verified_at, "products": report}, indent=1) + "\n")
if not observations:
    sys.exit("Sin observaciones de Alberta")
SNAP_DIR.mkdir(parents=True, exist_ok=True)
snap = SNAP_DIR / (now.date().isoformat() + ".json")
doc = {"schemaVersion": "1.0", "generatedAt": verified_at, "observations": []}
if snap.exists():
    doc = json.loads(snap.read_text(encoding="utf-8"))
mine = {o["product"] for o in observations}
doc["observations"] = [o for o in doc.get("observations", []) if not (o.get("region") == "ca" and o.get("product") in mine)] + observations
snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(len(observations), "observaciones de Alberta")

#!/usr/bin/env python3
"""Colza FISICA de la Comision Europea (Agri-food Data Portal, API publica sin clave) al panel de precios: Rouen (Francia), media nacional de Alemania,
Polonia y Hungria. Semanal, EUR/tonelada. NO es el futuro de Euronext (ECO): es el precio fisico que la Comision recoge de cada Estado miembro.
Region 'eu', comparabilidad «not_comparable» (cada pais mide una fase de mercado distinta). Licencia: Decision 2011/833/UE (atribucion).
La API no publica fecha de publicacion: se registra el dia en que se recupero. Una serie sin dato en las ultimas 6 semanas o con menos de 20 puntos se omite.
Claves: las mismas que js/data.js (bloque EUP_PANEL). Uso: python3 scripts/build-eu-oilseeds-panel-obs.py"""
import json, sys, urllib.request
from datetime import datetime, timezone, date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP_DIR = ROOT / "data" / "snapshots"
URL = ("https://api.tech.ec.europa.eu/agrifood/api/oilseeds/prices?products=Rapeseed&memberStateCodes=FR,DE,PL,HU"
       "&beginDate=01/01/2021&endDate=%s")
MIN_POINTS = 20
MAX_AGE_DAYS = 42
# clave: (pais, mercado exacto de la API, descripcion de la fase para la metodologia)
SERIES = {
    "colza_fr": ("FR", "Rouen", "Francia, entrega a la industria en Rouen"),
    "colza_de": ("DE", "National Average", "Alemania, media nacional, salida de silo del agricultor"),
    "colza_pl": ("PL", "Not Defined", "Polonia, media nacional (la Comision no define la fase de mercado)"),
    "colza_hu": ("HU", "Not Defined", "Hungria, media nacional (la Comision no define la fase de mercado)"),
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Dehesa-Index-data-bot/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def iso(d):  # dd/mm/yyyy -> yyyy-mm-dd
    return "%s-%s-%s" % (d[6:10], d[3:5], d[0:2])


def price(s):
    s = str(s).replace("€", "").replace(",", "").strip()
    return float(s)


def main():
    now = datetime.now(timezone.utc)
    today = now.date()
    verified_at = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = fetch(URL % today.strftime("%d/%m/%Y"))
    obs = []
    for key, (cc, market, desc) in SERIES.items():
        pts = {}
        for r in rows:
            if r.get("memberStateCode") != cc or r.get("market") != market or r.get("product") != "Rapeseed":
                continue
            if r.get("unit") != "national currency/ton" or not str(r.get("price", "")).startswith("€"):
                continue  # solo toneladas y euros
            try:
                v = price(r["price"])
            except ValueError:
                continue
            if v > 0:
                pts[iso(r["endDate"])] = v
        pts = sorted(pts.items())
        if len(pts) < MIN_POINTS:
            print("POCOS PUNTOS:", key, len(pts)); continue
        last, val = pts[-1]
        age = (today - date.fromisoformat(last)).days
        if age > MAX_AGE_DAYS:
            print("SIN DATO RECIENTE:", key, last); continue
        prev = pts[-2][1]
        obs.append({
            "id": "di_pienso_%s_eu" % key, "product": key, "region": "eu", "sourceId": "eu_agrifood",
            "observationDate": last, "publicationDate": today.isoformat(), "status": "verified", "verifiedAt": verified_at,
            "comparability": "not_comparable",
            "methodology": "Comision Europea, Agri-food Data Portal: precio semanal de la colza en %s, EUR/tonelada. Es un precio fisico, no el futuro de Euronext (Matif). La API no publica fecha de publicacion: se registra el dia en que se recupero." % desc,
            "value": val, "currency": "EUR", "unit": "tonelada", "frequency": "weekly",
            "changePct": round((val / prev - 1) * 100, 4) if prev else None,
            "history": [{"period": d[5:], "year": int(d[:4]), "value": v} for d, v in pts],
        })
        print("OK", key, last, val, len(pts), "puntos")
    if not obs:
        sys.exit("Sin observaciones")
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    snap = SNAP_DIR / (today.isoformat() + ".json")
    doc = {"schemaVersion": "1.0", "generatedAt": verified_at, "observations": []}
    if snap.exists():
        doc = json.loads(snap.read_text(encoding="utf-8"))
    mine = {o["product"] for o in obs}
    doc["observations"] = [o for o in doc.get("observations", []) if not (o.get("region") == "eu" and o.get("product") in mine)] + obs
    snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(len(obs), "series de colza fisica para el panel")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""EE. UU. en el panel de precios: mantequilla, queso cheddar de bloque y suero seco (USDA AMS, National Dairy Products Sales Report, semanal) y,
del informe de bioenergia de USDA ERS (mensual): gasolina base para mezcla, DDGS (granos secos de destileria) y coste del maiz por galon de etanol.
Las series ya estan en data/ (us-dairy.json, us-ers-bioenergy-stats.json); este script NO baja nada: las lee y escribe observaciones region 'us' en el
snapshot de hoy. Despues el motor de precios reconstruye latest.json, data/prices/, el catalogo, etc. No se cambia ninguna unidad.
Claves: las mismas que js/data.js (bloque US_PANEL). Uso: python3 scripts/build-us-panel-obs.py"""
import json, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP_DIR = ROOT / "data" / "snapshots"
MIN_POINTS = 12
MAX_WEEKS = 520
MAX_DAYS = 520
ERS = "USDA ERS, Bioenergy Statistics"
AMS = "USDA AMS, National Dairy Products Sales Report (NDPSR)"

# clave: (categoria, origen, id de serie, unidad del panel, frecuencia, sourceId, descripcion, origen)
PRODUCTS = {
    "mantequilla": ("lacteos", "dairy", "mantequilla", "lb", "weekly", "usda_ams_mars", "Mantequilla: precio semanal medio ponderado de las ventas (EE. UU.)", AMS),
    "cheddar": ("lacteos", "dairy", "cheddar", "lb", "weekly", "usda_ams_mars", "Queso cheddar de bloque de 40 lb: precio semanal medio ponderado de las ventas (EE. UU.)", AMS),
    "suero": ("lacteos", "dairy", "suero", "lb", "weekly", "usda_ams_mars", "Suero seco: precio semanal medio ponderado de las ventas (EE. UU.)", AMS),
    "gasolina_base_us": ("energia", "ers", "us-ersbio-t14-gasoline-spot-price-for-reformulated-gasoline-ble-los-angele-m", "gal", "monthly", "usda_ers", "Gasolina base para mezcla con etanol (RBOB, Los Angeles): precio spot mensual", ERS),
    "ddgs_us": ("pienso", "ers", "us-ersbio-t9-distillers-dri-wholesale-price-central-il-m-my", "ton_corta", "monthly", "usda_ers", "Granos secos de destileria (DDGS), precio mayorista en Illinois central: mensual", ERS),
    "coste_maiz_etanol_us": ("energia", "ers", "us-ersbio-t14-corn-blend-cost-cost-of-corn-per-gallon-of-et-united-sta-m", "gal", "monthly", "usda_ers", "Coste del maiz por galon de etanol producido (EE. UU.): mensual", ERS),
}
LMR = "USDA AMS, Livestock Mandatory Reporting (LMR)"
# carne y ganado (LMR, diario, USD por cwt = 100 lb): clave: (categoria, informe, columna o serie, descripcion)
LMR_PRODUCTS = {
    "cutout_vacuno_choice": ("ganado", "beef", 1, "Valor del corte de vacuno en caja, Choice (informe LM_XB403)"),
    "cutout_vacuno_select": ("ganado", "beef", 2, "Valor del corte de vacuno en caja, Select (informe LM_XB403)"),
    "novillo_vivo_us": ("ganado", "cattle", "steer|live_fob", "Novillos de sacrificio, precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100)"),
    "novillo_canal_us": ("ganado", "cattle", "steer|dressed_delivered", "Novillos de sacrificio, precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100)"),
    "novilla_vivo_us": ("ganado", "cattle", "heifer|live_fob", "Novillas de sacrificio, precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100)"),
    "novilla_canal_us": ("ganado", "cattle", "heifer|dressed_delivered", "Novillas de sacrificio, precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100)"),
    "vacuno_vivo_us": ("ganado", "cattle", "all_beef_type|live_fob", "Vacuno de sacrificio (todos los tipos), precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100)"),
    "vacuno_canal_us": ("ganado", "cattle", "all_beef_type|dressed_delivered", "Vacuno de sacrificio (todos los tipos), precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100)"),
    "cutout_cerdo": ("porcino", "pork", 1, "Valor del corte de cerdo FOB planta (informe LM_PK602)"),
    "lomo_cerdo": ("porcino", "pork", 2, "Lomo de cerdo, FOB planta (informe LM_PK602)"),
    "paleta_cerdo": ("porcino", "pork", 3, "Paleta/aguja (butt) de cerdo, FOB planta (informe LM_PK602)"),
    "picnic_cerdo": ("porcino", "pork", 4, "Paleta delantera (picnic) de cerdo, FOB planta (informe LM_PK602)"),
    "costilla_cerdo": ("porcino", "pork", 5, "Costillar de cerdo, FOB planta (informe LM_PK602)"),
    "jamon_cerdo": ("porcino", "pork", 6, "Jamón de cerdo (pieza fresca), FOB planta (informe LM_PK602)"),
    "panceta_cerdo": ("porcino", "pork", 7, "Panceta (belly) de cerdo, FOB planta (informe LM_PK602)"),
    "cerdo_base_us": ("porcino", "hogs", 1, "Cerdos sacrificados el día anterior, precio base de la canal, compra directa (informe LM_HG201)"),
    "cerdo_neto_us": ("porcino", "hogs", 2, "Cerdos sacrificados el día anterior, precio neto de la canal, compra directa (informe LM_HG201)"),
}


def load():
    dairy = {p["id"]: p for p in json.loads((ROOT / "data" / "us-dairy.json").read_text(encoding="utf-8"))["products"]}
    d = json.loads((ROOT / "data" / "us-ers-bioenergy-stats.json").read_text(encoding="utf-8"))
    ers = {s["id"]: s for s in next(iter(d["countries"].values()))["series"]}
    lmr = json.loads((ROOT / "data" / "us-markets" / "lmr.json").read_text(encoding="utf-8"))["reports"]
    return dairy, ers, lmr


def main():
    dairy, ers, lmr = load()
    now = datetime.now(timezone.utc)
    verified_at = now.isoformat(timespec="seconds").replace("+00:00", "Z")
    obs = []
    for key, (cat, kind, sid, unit, freq, source, desc, origin) in PRODUCTS.items():
        if kind == "dairy":
            p = dairy.get(sid)
            if not p: print("SIN SERIE:", key); continue
            pts = [(r[0], round(float(r[1]), 4)) for r in p["series"] if r[1] is not None][-MAX_WEEKS:]
        else:
            s = ers.get(sid)
            if not s or s.get("frequency") != "monthly": print("SIN SERIE:", key, sid); continue
            pts = [(a, round(float(b), 4)) for a, b in s["points"] if b is not None]
        if len(pts) < MIN_POINTS:
            print("POCOS PUNTOS:", key, len(pts)); continue
        pp, val = pts[-1]; prev = pts[-2][1]
        change = round((val / prev - 1) * 100, 4) if prev else None
        hist = [{"period": q[5:], "year": int(q[:4]), "value": v} for q, v in pts]
        obs.append({
            "id": "di_%s_%s_us" % (cat, key), "product": key, "region": "us", "sourceId": source,
            "observationDate": pp, "publicationDate": verified_at[:10], "status": "verified", "verifiedAt": verified_at,
            "comparability": "directional",
            "methodology": "%s: %s. Serie %s en dolares de EE. UU.; sin cambio de unidad." % (origin, desc, "semanal" if freq == "weekly" else "mensual"),
            "value": val, "currency": "USD", "unit": unit, "frequency": freq, "changePct": change,
            "history": hist,
        })
        print("OK", key, pp, val, len(pts), "puntos")
    for key, (cat, rep, ref, desc) in LMR_PRODUCTS.items():
        r = lmr.get(rep)
        if not r: print("SIN INFORME:", key); continue
        if rep == "cattle":
            rows = [(q[0], q[1]) for q in r["series"].get(ref, [])]
        else:
            rows = [(q[0], q[ref]) for q in r["rows"]]
        pts = [(d, round(float(v), 4)) for d, v in rows if v is not None][-MAX_DAYS:]
        if len(pts) < MIN_POINTS: print("POCOS PUNTOS:", key, len(pts)); continue
        pp, val = pts[-1]; prev = pts[-2][1]
        change = round((val / prev - 1) * 100, 4) if prev else None
        obs.append({
            "id": "di_%s_%s_us" % (cat, key), "product": key, "region": "us", "sourceId": "usda_ams_lmr",
            "observationDate": pp, "publicationDate": verified_at[:10], "status": "verified", "verifiedAt": verified_at,
            "comparability": "directional",
            "methodology": "%s: %s. Serie diaria en dolares de EE. UU. por 100 libras (cwt); sin cambio de unidad." % (LMR, desc),
            "value": val, "currency": "USD", "unit": "cwt", "frequency": "daily", "changePct": change,
            "history": [{"period": q[5:], "year": int(q[:4]), "value": v} for q, v in pts],
        })
        print("OK", key, pp, val, len(pts), "puntos")
    if not obs:
        sys.exit("Sin observaciones")
    snap = SNAP_DIR / (now.date().isoformat() + ".json")
    doc = {"schemaVersion": "1.0", "generatedAt": verified_at, "observations": []}
    if snap.exists():
        doc = json.loads(snap.read_text(encoding="utf-8"))
    mine = {o["product"] for o in obs}
    doc["observations"] = [o for o in doc.get("observations", []) if not (o.get("region") == "us" and o.get("product") in mine)] + obs
    snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(len(obs), "observaciones de EE. UU. para el panel")


if __name__ == "__main__":
    main()

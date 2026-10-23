#!/usr/bin/env python3
"""Reino Unido en el panel de precios: combustible en surtidor (DESNZ), vacuno y cordero en canal de Irlanda del Norte (DAERA) y precio de
los huevos a productor (Defra). Las series ya estan en data/ (uk-fuel-stats, uk-ni-market-stats, uk-stats); este script NO baja nada: las lee y
escribe observaciones region 'uk' en el snapshot de hoy. Despues el motor de precios reconstruye latest.json, data/prices/, el catalogo, etc.
Solo se cambia de unidad por aritmetica exacta (peniques -> libras) y se dice en la metodologia. Claves: las mismas que js/data.js (bloque UK_PANEL).
Uso: python3 scripts/build-uk-panel-obs.py"""
import json, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP_DIR = ROOT / "data" / "snapshots"
FUEL, NI, UK = "uk-fuel-stats.json", "uk-ni-market-stats.json", "uk-stats.json"
D_FUEL = "DESNZ, Weekly road fuel prices (Open Government Licence v3.0)"
D_NI = "DAERA, Northern Ireland Agricultural Market Report (Open Government Licence v3.0)"
D_UK = "Defra, UK egg statistics (Open Government Licence v3.0)"

# clave: (categoria, fichero, id de serie, unidad, frecuencia, sourceId, ambito, descripcion, origen)
PRODUCTS = {
    "diesel_uk": ("energia", FUEL, "uk-fuel-diesel-pump", "litro", "weekly", "desnz_fuel_prices", "Reino Unido", "Gasoleo (ULSD) en surtidor, media del Reino Unido, con impuesto especial e IVA; la fuente da peniques por litro", D_FUEL),
    "gasolina_uk": ("energia", FUEL, "uk-fuel-petrol-pump", "litro", "weekly", "desnz_fuel_prices", "Reino Unido", "Gasolina sin plomo (ULSP) en surtidor, media del Reino Unido, con impuesto especial e IVA; la fuente da peniques por litro", D_FUEL),
    "vacas_ni": ("ganado", NI, "uk-ni-cows-all-grades-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Vacas (todas las clasificaciones), precio medio en canal; la fuente da peniques por kg", D_NI),
    "vacas_r3_ni": ("ganado", NI, "uk-ni-cows-r3-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Vacas (clasificacion R3), precio medio en canal; la fuente da peniques por kg", D_NI),
    "novillas_ni": ("ganado", NI, "uk-ni-heifers-all-grades-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Novillas (todas las clasificaciones), precio medio en canal; la fuente da peniques por kg", D_NI),
    "novillas_r3_ni": ("ganado", NI, "uk-ni-heifers-r3-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Novillas (clasificacion R3), precio medio en canal; la fuente da peniques por kg", D_NI),
    "novillos_ni": ("ganado", NI, "uk-ni-steers-all-grades-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Novillos (todas las clasificaciones), precio medio en canal; la fuente da peniques por kg", D_NI),
    "novillos_r3_ni": ("ganado", NI, "uk-ni-steers-r3-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Novillos (clasificacion R3), precio medio en canal; la fuente da peniques por kg", D_NI),
    "toros_ni": ("ganado", NI, "uk-ni-young-bulls-all-grades-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Toros jovenes (todas las clasificaciones), precio medio en canal; la fuente da peniques por kg", D_NI),
    "toros_r3_ni": ("ganado", NI, "uk-ni-young-bulls-r3-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Toros jovenes (clasificacion R3), precio medio en canal; la fuente da peniques por kg", D_NI),
    "corderos_ni": ("ovino", NI, "uk-ni-lambs-all-price", "kg", "weekly", "daera_ni", "Irlanda del Norte", "Corderos (todas las clasificaciones), precio medio en canal; la fuente da peniques por kg", D_NI),
    "huevos_todos_uk": ("avicultura", UK, "uk-egg-price-all", "docena", "quarterly", "defra", "Reino Unido", "Huevos, precio medio de la empaquetadora al productor (todos los tipos); la fuente da peniques por docena", D_UK),
    "huevos_jaula_uk": ("avicultura", UK, "uk-egg-price-enriched", "docena", "quarterly", "defra", "Reino Unido", "Huevos de gallinas en jaula enriquecida, precio medio de la empaquetadora al productor; la fuente da peniques por docena", D_UK),
    "huevos_campero_uk": ("avicultura", UK, "uk-egg-price-free-range", "docena", "quarterly", "defra", "Reino Unido", "Huevos camperos, precio medio de la empaquetadora al productor; la fuente da peniques por docena", D_UK),
}
MIN_POINTS = 12
MAX_WEEKS = 520   # 10 anos de semanas


def qdate(p):  # '2026-Q2' -> '2026-06' (mes final del trimestre)
    y, q = p.split("-Q")
    return "%s-%02d" % (y, int(q) * 3)


def main():
    cache = {}
    now = datetime.now(timezone.utc)
    verified_at = now.isoformat(timespec="seconds").replace("+00:00", "Z")
    obs = []
    for key, (cat, f, sid, unit, freq, source, scope, desc, origin) in PRODUCTS.items():
        if f not in cache:
            cache[f] = {s["id"]: s for s in json.loads((ROOT / "data" / f).read_text(encoding="utf-8"))["countries"]["UK"]["series"]}
        s = cache[f].get(sid)
        if not s or s.get("frequency") != freq:
            print("SIN SERIE:", key, sid); continue
        pts = [(qdate(p) if freq == "quarterly" else p, round(v * 0.01, 4)) for p, v in s["points"] if v is not None]
        if freq == "weekly": pts = pts[-MAX_WEEKS:]
        if len(pts) < MIN_POINTS:
            print("POCOS PUNTOS:", key, len(pts)); continue
        p, val = pts[-1]; prev = pts[-2][1]
        change = round((val / prev - 1) * 100, 4) if prev else None
        per = "Serie trimestral (mes final del trimestre)" if freq == "quarterly" else "Serie semanal"
        hist = [{"period": (q[5:7] if freq == "quarterly" else q[5:]), "year": int(q[:4]), "value": v} for q, v in pts]
        obs.append({
            "id": "di_%s_%s_uk" % (cat, key), "product": key, "region": "uk", "sourceId": source,
            "observationDate": p, "publicationDate": verified_at[:10], "status": "verified", "verifiedAt": verified_at,
            "comparability": "directional",
            "methodology": "%s: %s. %s en libras esterlinas. Cambio de unidad hecho por Dehesa Index con aritmetica exacta (peniques a libras), sin estimar nada." % (origin, desc, per),
            "value": val, "currency": "GBP", "unit": unit, "frequency": freq, "changePct": change, "province": scope,
            "history": hist,
        })
        print("OK", key, p, val, len(pts), "puntos")
    if not obs:
        sys.exit("Sin observaciones")
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    snap = SNAP_DIR / (now.date().isoformat() + ".json")
    doc = {"schemaVersion": "1.0", "generatedAt": verified_at, "observations": []}
    if snap.exists():
        doc = json.loads(snap.read_text(encoding="utf-8"))
    mine = {o["product"] for o in obs}
    doc["observations"] = [o for o in doc.get("observations", []) if not (o.get("region") == "uk" and o.get("product") in mine)] + obs
    snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(len(obs), "observaciones de Reino Unido para el panel")


if __name__ == "__main__":
    main()

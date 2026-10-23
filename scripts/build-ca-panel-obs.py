#!/usr/bin/env python3
"""Canada en el panel de precios: abonos, energia, piensos y precios al por menor (lacteos, carne, huevos).
Las series ya estan en data/ (Alberta Farm Input Prices, Statistics Canada); este script NO baja nada: las lee y
escribe observaciones region 'ca' en el snapshot de hoy (data/snapshots/AAAA-MM-DD.json), igual que update-alberta-weekly.py.
Despues el motor de precios (price-engine) reconstruye latest.json, data/prices/, el catalogo, etc.
Solo se cambia de unidad por aritmetica exacta y se dice en la metodologia: 100 L -> L, centimos -> dolares, saco -> tonelada,
envase -> kg. No se estima ni se rellena nada; una serie sin dato reciente queda fuera.
Claves del producto: las mismas que js/data.js (bloque CA_PANEL).
Uso: python3 scripts/build-ca-panel-obs.py"""
import json, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP_DIR = ROOT / "data" / "snapshots"
FILES = ["ca-alberta-inputs-stats.json", "canada-stats.json", "ca-statcan-more-stats.json"]

AB_INP = "ca-ab-inputs-"
ALB = "Alberta Agriculture and Irrigation, Alberta Farm Input Prices (Open Government Licence - Alberta)"
SC = "Statistics Canada (Open Government Licence - Canada)"


def ab(slug): return AB_INP + slug + "-m"


# clave: (categoria, id de la serie, factor, unidad, sourceId, provincia/ambito, descripcion en espanol, como se obtiene la cifra)
PRODUCTS = {
    # --- Abonos (Alberta; precio al agricultor, CAD por tonelada, a granel) ---
    "urea_ab": ("fertilizantes", ab("fertilizer-46-0-0-urea-bulk-tonne"), 1, "tonelada", "alberta_ag", "Alberta", "Urea 46-0-0 a granel", ALB),
    "amoniaco_ab": ("fertilizantes", ab("fertilizer-82-0-0-anhydrous-ammonia-full-service-with-applicator-bulk"), 1, "tonelada", "alberta_ag", "Alberta", "Amoniaco anhidro 82-0-0, con aplicador", ALB),
    "potasa_ab": ("fertilizantes", ab("fertilizer-0-0-60-potassium-chloride-bulk-tonne"), 1, "tonelada", "alberta_ag", "Alberta", "Cloruro potasico 0-0-60 a granel", ALB),
    "map_ab": ("fertilizantes", ab("fertilizer-11-52-0-monoammonium-phosphate-bulk-tonne"), 1, "tonelada", "alberta_ag", "Alberta", "Fosfato monoamonico 11-52-0 a granel", ALB),
    "sulfato_amonico_ab": ("fertilizantes", ab("fertilizer-21-0-0-24-ammonium-sulphate-bulk-tonne"), 1, "tonelada", "alberta_ag", "Alberta", "Sulfato amonico 21-0-0-24 a granel", ALB),
    # --- Energia ---
    "diesel_agr_ab": ("energia", ab("diesel-fuel-marked-farm-fuel-provincial-allowance-deducted-100-litres"), 0.01, "litro", "alberta_ag", "Alberta", "Gasoleo agricola marcado (descontada la ayuda provincial); la fuente da el precio por 100 litros y aqui se divide entre 100", ALB),
    "gasolina_agr_ab": ("energia", ab("marked-gasoline-regular-unleaded-marked-farm-fuel-100-litres"), 0.01, "litro", "alberta_ag", "Alberta", "Gasolina marcada de uso agricola; precio por 100 litros dividido entre 100", ALB),
    "propano_ab": ("energia", ab("propane-liquefied-for-farm-use-bulk-100-litres"), 0.01, "litro", "alberta_ag", "Alberta", "Propano para uso agricola a granel; precio por 100 litros dividido entre 100", ALB),
    "gas_natural_ab": ("energia", ab("natural-gas-excluding-service-or-delivery-charge-prov-rebate-deducted"), 1, "gj", "alberta_ag", "Alberta", "Gas natural sin cargos de servicio ni reparto, con la rebaja provincial descontada, CAD por gigajulio", ALB),
    "electricidad_ab": ("energia", ab("electricity-farm-use-excluding-service-or-delivery-charge-100-kwh"), 0.01, "kwh", "alberta_ag", "Alberta", "Electricidad de uso agricola sin cargos de servicio ni reparto; precio por 100 kWh dividido entre 100", ALB),
    "gasolina_ca": ("energia", "ca-fuel-canada-regular-gasoline-self-service", 0.01, "litro", "statcan", "Canada", "Gasolina normal en surtidor (autoservicio), media nacional; la fuente da centimos por litro", SC),
}
for city, cid in [("calgary", "calgary"), ("edmonton", "edmonton"), ("regina", "regina"), ("saskatoon", "saskatoon"), ("winnipeg", "winnipeg"), ("toronto", "toronto"), ("montreal", "montreal"), ("vancouver", "vancouver")]:
    PRODUCTS["diesel_" + cid] = ("energia", "ca-fuel-%s-diesel-self-service" % cid, 0.01, "litro", "statcan", city.capitalize() if city != "montreal" else "Montréal",
                                 "Diésel en surtidor (autoservicio) en %s; la fuente da céntimos por litro" % (city.capitalize() if city != "montreal" else "Montréal"), SC)
# --- Piensos ---
PRODUCTS.update({
    "heno_ab": ("pienso", ab("hay-good-quality-over-50-alfalfa-farm-gate-ton"), 1, "ton_corta", "alberta_ag", "Alberta", "Heno de buena calidad (mas del 50 % de alfalfa), en la granja; CAD por tonelada corta", ALB),
    "pienso_broiler_ab": ("pienso", ab("broiler-grower-complete-feed-15-17-protein-bagged-20-kg"), 50, "tonelada", "alberta_ag", "Alberta", "Pienso completo de crecimiento de pollos (15-17 % de proteina), saco de 20 kg; el precio por saco se pasa a tonelada (x50)", ALB),
    "leche_ternero_ab": ("pienso", ab("calf-milk-replacer-bagged-20-kg"), 50, "tonelada", "alberta_ag", "Alberta", "Sustituto de leche para terneros, saco de 20 kg; el precio por saco se pasa a tonelada (x50)", ALB),
    "iniciador_ternero_ab": ("pienso", ab("calf-starter-ration-pellets-13-20-protein-bagged-25-kg"), 40, "tonelada", "alberta_ag", "Alberta", "Racion de arranque para terneros en pellet (13-20 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40)", ALB),
    "suplemento_cebo_ab": ("pienso", ab("feedlot-supplement-pellets-30-32-protein-bagged-20-kg"), 50, "tonelada", "alberta_ag", "Alberta", "Suplemento para cebadero en pellet (30-32 % de proteina), saco de 20 kg; el precio por saco se pasa a tonelada (x50)", ALB),
    "pienso_cerdo_ab": ("pienso", ab("hog-grower-ration-pellets-15-17-protein-bagged-25-kg"), 40, "tonelada", "alberta_ag", "Alberta", "Racion de crecimiento de cerdos en pellet (15-17 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40)", ALB),
    "suplemento_cerdo_ab": ("pienso", ab("swine-supplement-pellets-35-40-protein-bagged-25-kg"), 40, "tonelada", "alberta_ag", "Alberta", "Suplemento porcino en pellet (35-40 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40)", ALB),
    "mineral_vacuno_ab": ("pienso", ab("cattle-mineral-salt-free-16-phosphorus-16-calcium-20-kg"), 50, "tonelada", "alberta_ag", "Alberta", "Mineral para vacuno sin sal (16 % de fosforo y 16 % de calcio), envase de 20 kg; el precio por envase se pasa a tonelada (x50)", ALB),
})
# --- Al por menor (Statistics Canada, tabla 18-10-0245; media nacional) ---
R = "ca-retail-"
RETAIL = [
    ("leche_1l_ca", "lacteos", "milk-1-litre", 1, "litro", "Leche, 1 litro"),
    ("leche_4l_ca", "lacteos", "milk-4-litres", 0.25, "litro", "Leche, envase de 4 litros; el precio del envase se divide entre 4 (por litro)"),
    ("mantequilla_ca", "lacteos", "butter-454-grams", 1000 / 454.0, "kg", "Mantequilla, 454 g; el precio del envase se pasa a kg"),
    ("queso_bloque_ca", "lacteos", "block-cheese-500-grams", 2, "kg", "Queso en bloque, 500 g; el precio del envase se pasa a kg"),
    ("yogur_ca", "lacteos", "yogurt-500-grams", 2, "kg", "Yogur, 500 g; el precio del envase se pasa a kg"),
    ("ternera_picada_ca", "ganado", "ground-beef-per-kilogram", 1, "kg", "Carne picada de vacuno, por kg"),
    ("ternera_guisar_ca", "ganado", "beef-stewing-cuts-per-kilogram", 1, "kg", "Vacuno para guisar, por kg"),
    ("ternera_lomo_ca", "ganado", "beef-striploin-cuts-per-kilogram", 1, "kg", "Lomo alto de vacuno (striploin), por kg"),
    ("ternera_redondo_ca", "ganado", "beef-top-sirloin-cuts-per-kilogram", 1, "kg", "Solomillo bajo de vacuno (top sirloin), por kg"),
    ("cerdo_lomo_ca", "porcino", "pork-loin-cuts-per-kilogram", 1, "kg", "Lomo de cerdo, por kg"),
    ("cerdo_paleta_ca", "porcino", "pork-shoulder-cuts-per-kilogram", 1, "kg", "Paleta de cerdo, por kg"),
    ("bacon_ca", "porcino", "bacon-500-grams", 2, "kg", "Bacon, 500 g; el precio del envase se pasa a kg"),
    ("pollo_entero_ca", "avicultura", "whole-chicken-per-kilogram", 1, "kg", "Pollo entero, por kg"),
    ("pollo_pechuga_ca", "avicultura", "chicken-breasts-per-kilogram", 1, "kg", "Pechugas de pollo, por kg"),
    ("huevos_docena_ca", "avicultura", "eggs-1-dozen", 1, "docena", "Huevos, 1 docena"),
]
for k, cat, slug, f, unit, desc in RETAIL:
    PRODUCTS[k] = (cat, R + slug, f, unit, "statcan", "Canada", desc + " (precio al consumidor)", SC)

MIN_POINTS = 12   # menos que esto no se enseña


def load_series():
    ser = {}
    for f in FILES:
        for s in json.loads((ROOT / "data" / f).read_text(encoding="utf-8"))["countries"]["CA"]["series"]:
            ser[s["id"]] = s
    return ser


def main():
    ser = load_series()
    now = datetime.now(timezone.utc)
    verified_at = now.isoformat(timespec="seconds").replace("+00:00", "Z")
    obs = []
    for key, (cat, sid, factor, unit, source, prov, desc, origin) in PRODUCTS.items():
        s = ser.get(sid)
        if not s or s.get("frequency") != "monthly":
            print("SIN SERIE:", key, sid); continue
        pts = [(p, round(v * factor, 4)) for p, v in s["points"] if v is not None]
        if len(pts) < MIN_POINTS:
            print("POCOS PUNTOS:", key, len(pts)); continue
        p, val = pts[-1]
        prev = pts[-2][1]
        change = round((val / prev - 1) * 100, 4) if prev else None
        conv = "" if factor == 1 else " Cambio de unidad hecho por Dehesa Index con aritmetica exacta, sin estimar nada."
        obs.append({
            "id": "di_%s_%s_ca" % (cat, key), "product": key, "region": "ca", "sourceId": source,
            "observationDate": p, "publicationDate": verified_at[:10], "status": "verified", "verifiedAt": verified_at,
            "comparability": "directional",
            "methodology": "%s: %s. Serie mensual en dolares canadienses.%s" % (origin, desc, conv),
            "value": val, "currency": "CAD", "unit": unit, "frequency": "monthly", "changePct": change, "province": prov,
            "history": [{"period": q[5:7], "year": int(q[:4]), "value": v} for q, v in pts],
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
    doc["observations"] = [o for o in doc.get("observations", []) if not (o.get("region") == "ca" and o.get("product") in mine)] + obs
    snap.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(len(obs), "observaciones de Canada para el panel")


if __name__ == "__main__":
    main()

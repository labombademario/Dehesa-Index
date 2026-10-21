#!/usr/bin/env python3
"""Produccion vegetal por pais, campana en curso incluida -> data/eu-production-stats.json (Agri-food Data Portal de la Comision Europea).
  cereal/production    produccion, superficie y rendimiento por cultivo (27 estados + Reino Unido hasta donde publica), desde 2002
  oilseeds/production  oleaginosas y proteaginosas, desde 2000
  rice/production      arroz por producto (suma de los codigos NC que lista el portal para ese producto)
  sugar/production     azucar por region o pais y campana (el periodo es el ano de inicio: 2026 = 2026/27)
  oliveOil/production  aceite de oliva por mes de produccion (9 paises, desde 2009/10)
Unidades como las publica el portal (miles de t, miles de ha, t/ha); no se convierte ni se estima. El ultimo ano es la campana en curso: el portal no dice si es definitivo.
Uso: python3 scripts/update-eu-production.py [--local DIR] [--out DIR]  (--local: DIR/{cereal_prod,oilseeds_prod,rice_prod,sugar_prod,olive_m}.json; solo pruebas)"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import usda_lib as U

BASE = "https://api.tech.ec.europa.eu/agrifood/api/"
EP = {"cereal": ("cereal/production", "cereal_prod"), "oilseeds": ("oilseeds/production", "oilseeds_prod"), "rice": ("rice/production", "rice_prod"),
      "sugar": ("sugar/production", "sugar_prod"), "olive": ("oliveOil/production?granularity=monthly", "olive_m")}
ISO = {"GR": "EL", "GB": "UK"}
NAMES = {"AT": "Austria", "BE": "Belgium", "BG": "Bulgaria", "HR": "Croatia", "CY": "Cyprus", "CZ": "Czechia", "DK": "Denmark", "EE": "Estonia", "FI": "Finland", "FR": "France", "DE": "Germany", "EL": "Greece", "HU": "Hungary", "IE": "Ireland", "IT": "Italy", "LV": "Latvia", "LT": "Lithuania", "LU": "Luxembourg", "MT": "Malta", "NL": "Netherlands", "PL": "Poland", "PT": "Portugal", "RO": "Romania", "SK": "Slovakia", "SI": "Slovenia", "ES": "Spain", "SE": "Sweden", "UK": "United Kingdom", "EU": "European Union"}
SUGAR_CC = {"Austria": "AT", "Belgium": "BE", "Croatia": "HR", "Czechia": "CZ", "Germany": "DE", "Hungary": "HU", "Italy": "IT", "Lithuania": "LT", "Netherlands": "NL", "Poland": "PL", "Romania": "RO", "Slovakia": "SK", "Spain": "ES", "France Met": "FR", "France Dom": "FR"}
MONTHS = {m: i + 1 for i, m in enumerate(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"])}
CURRENT = "The latest year is the current campaign; the portal does not say whether it is final, so treat it as provisional."
OUT = {}
BLOCK = {"cereal": "-cereal-", "oilseeds": "-oilseeds-", "rice": "-rice-", "sugar": "-sugar-", "olive": "-olive-oil-"}   # trozo del id que identifica cada bloque

def fetch(k):
    path, fx = EP[k]
    if U.LOCAL is not None: return json.loads((U.LOCAL / (fx + ".json")).read_text(encoding="utf-8"))
    return json.loads(U.get(BASE + path, timeout=300, accept="*/*").decode("utf-8"))

def add(cc, s):
    if s: OUT.setdefault(cc, []).append(s)

def crops(rows, tag, label_of):
    by = {}
    for r in rows:
        cc = ISO.get(r.get("memberStateCode"), r.get("memberStateCode")); cr = r.get("crop")
        if not cc or not cr or not r.get("year"): continue
        for m in ("grossProduction", "area", "yield"):
            v = r.get(m)
            if v is not None and v >= 0: by.setdefault((cc, cr, m), {})[str(r["year"])] = v
    U_ = {"grossProduction": ("production", "thousand t", "production"), "area": ("area", "thousand ha", "area"), "yield": ("yield", "t/ha", "yield")}
    for (cc, cr, m), pts in sorted(by.items()):
        k, unit, nm = U_[m]
        if not any(pts.values()): continue   # siempre cero: el pais no cultiva eso, no es una serie
        add(cc, U.mk_series("eu-prod-%s-%s-%s-%s" % (cc.lower(), tag, U.slug(cr, 24), k), "crops", "%s: %s %s (EU Agri-food)" % (label_of, cr, nm), unit, "annual", sorted(pts.items()), "EU Agri-food %s production" % tag, min_points=3, max_age_years=3, note=CURRENT))

def rice(rows):
    acc = {}
    for r in rows:
        cc = ISO.get(r.get("memberStateCode"), r.get("memberStateCode")); pr = r.get("product")
        if not cc or not pr or not r.get("year"): continue
        for m in ("area", "milledRiceEquivalentQuantity", "riceHuskQuantity"):
            g = acc.setdefault((cc, pr, m), {}).setdefault(str(r["year"]), [])
            g.append(r.get(m))
    UN = {"area": ("area", "ha", "area"), "milledRiceEquivalentQuantity": ("milled", "t", "milled-rice equivalent"), "riceHuskQuantity": ("husked", "t", "husked rice")}
    for (cc, pr, m), yrs in sorted(acc.items()):
        pts = {y: sum(v) for y, v in yrs.items() if all(x is not None for x in v)}   # si falta un codigo NC ese ano, hueco (no se suma lo que hay)
        k, unit, nm = UN[m]
        if not any(pts.values()): continue
        add(cc, U.mk_series("eu-prod-%s-rice-%s-%s" % (cc.lower(), U.slug(pr.split(")", 1)[-1], 22), k), "crops", "Rice: %s, %s (EU Agri-food)" % (pr.split(")", 1)[-1].strip(), nm), unit, "annual", sorted(pts.items()), "EU Agri-food rice production", min_points=3, max_age_years=3,
                              note="Sum of the CN codes the portal lists for this product; a year is left empty if any code has no figure. " + CURRENT))

def sugar(rows):
    by = {}; est = {}
    for r in rows:
        reg = r.get("region"); my = str(r.get("marketingYear") or "")
        if not reg or len(my) < 4: continue
        cc = SUGAR_CC.get(reg, "EU"); y = my[:4]
        for m, u in (("grossProduction", "gp"), ("area", "ar"), ("yield", "yl")):
            v = r.get(m)
            if v is not None and v >= 0: by.setdefault((cc, reg, u), {})[y] = v
        if r.get("isEstimated") == "Y": est[(cc, reg)] = y
    UN = {"gp": ("production", "t", "production"), "ar": ("area", "thousand ha", "area"), "yl": ("yield", "t/ha", "yield")}
    for (cc, reg, u), pts in sorted(by.items()):
        k, unit, nm = UN[u]
        nm_reg = reg if cc == "EU" else ("%s (mainland)" % reg.replace(" Met", "") if reg.endswith("Met") else "France (overseas departments)" if reg.endswith("Dom") else reg)
        add(cc, U.mk_series("eu-prod-%s-sugar-%s-%s" % (cc.lower(), U.slug(reg, 24), k), "crops", "Sugar beet: %s %s by marketing year, period = starting year (EU Agri-food)" % (nm_reg, nm), unit, "annual", sorted(pts.items()), "EU Agri-food sugar production", min_points=3, max_age_years=3,
                              note="Marketing year: 2026 means 2026/27. " + ("The portal flags %s as estimated. " % est[(cc, reg)] if (cc, reg) in est else "") + CURRENT))

def olive(rows):
    by = {}
    for r in rows:
        cc = ISO.get(r.get("memberStateCode"), r.get("memberStateCode")); mo = MONTHS.get(r.get("productionMonth")); v = r.get("monthProductionQuantity")
        if not cc or not mo or not r.get("productionYear") or v is None or v < 0: continue
        by.setdefault(cc, {})["%04d-%02d" % (r["productionYear"], mo)] = v
    for cc, pts in sorted(by.items()):
        add(cc, U.mk_series("eu-prod-%s-olive-oil-monthly" % cc.lower(), "production", "Olive oil: production by month (EU Agri-food)", "thousand t", "monthly", sorted(pts.items()), "EU Agri-food olive oil production", min_points=12, max_age_years=2,
                              note="Months with no production are not listed by the portal. " + CURRENT))

def carry(prev_path, failed):
    """Un bloque que falla (p. ej. 404 del portal) no borra lo publicado: se conservan sus series del fichero anterior tal cual,
    sin tocar sus puntos, y queda escrito en el log y como aviso del workflow. Asi no bajan ni la cobertura ni los totales por un fallo pasajero."""
    if not failed: return
    try: prev = json.loads(Path(prev_path).read_text(encoding="utf-8"))
    except Exception: U.log("sin fichero anterior: los bloques %s quedan sin datos esta vez" % ",".join(failed)); return
    have = {s["id"] for v in OUT.values() for s in v}
    for k in failed:
        n = 0
        for cc, c in (prev.get("countries") or {}).items():
            for s in c.get("series") or []:
                if BLOCK.get(k, "-%s-" % k) in s.get("id", "") and s["id"] not in have: OUT.setdefault(cc, []).append(s); n += 1
        U.log("MANTENIDO %s: %d series del fichero anterior (la fuente fallo; se reintenta en la proxima ejecucion)" % (k, n))
        print("::warning::eu-production: bloque %s fallo; se mantienen %d series publicadas" % (k, n))

def main():
    local, out = U.parse_args(); out = out or (U.ROOT / "data"); failed = []
    for k, fn, arg in (("cereal", crops, ("cereal", "Cereals")), ("oilseeds", crops, ("oilseeds", "Oilseeds and protein crops")), ("rice", rice, None), ("sugar", sugar, None), ("olive", olive, None)):
        try:
            rows = fetch(k)
            if not isinstance(rows, list) or len(rows) < 30: raise RuntimeError("respuesta inesperada (%s)" % (len(rows) if isinstance(rows, list) else type(rows)))
            n0 = sum(len(v) for v in OUT.values()); fn(rows, *arg) if arg else fn(rows)
            U.log("%s: %d filas, +%d series" % (k, len(rows), sum(len(v) for v in OUT.values()) - n0))
        except Exception as e:
            U.log("FALLO %s: %s" % (k, e)); failed.append(k)
    carry(out / "eu-production-stats.json", failed)
    n = sum(len(v) for v in OUT.values())
    if n < 400 or "cereal" not in " ".join(s["id"] for v in OUT.values() for s in v): raise SystemExit("solo %d series (se esperaban mas de 400 con cereales): no se escribe" % n)
    src = {"name": "European Commission, Agri-food Data Portal (crop, sugar, rice and olive oil production)", "url": "https://agridata.ec.europa.eu/extensions/DashboardCereals/CerealsProduction.html", "license": "EU Commission reuse policy (Decision 2011/833/EU), CC BY 4.0"}
    doc = {"schemaVersion": 1, "generatedAt": U.now_iso(), "countries": {cc: {"name": NAMES.get(cc, cc), "extend": True, "source": src, "series": v} for cc, v in sorted(OUT.items())}, "log": U.LOG[-40:]}
    U.write_json(out / "eu-production-stats.json", doc); U.write_log(out / "eu-production-log.txt")
    print("OK %d series en %d paises" % (n, len(OUT)))

if __name__ == "__main__": main()

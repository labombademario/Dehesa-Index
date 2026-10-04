#!/usr/bin/env python3
"""Genera vendor/ca-provinces.js: contornos de las provincias y territorios de Canada (Natural Earth 1:50m, dominio publico) en proyeccion Albers equivalente, lista para SVG.
Mismo formato que vendor/us-states.js: window.DEHESA_CA_PROVINCES = {viewBox, states:[{id, name, d}]}. Uso: python3 scripts/build-region-maps.py"""
import importlib.util, json
from pathlib import Path
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.ops import transform
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("d", ROOT / "scripts" / "update-canada-drought.py"); D = importlib.util.module_from_spec(spec); spec.loader.exec_module(D)
W = 975.0
fc = json.loads((ROOT / "scripts" / "ref" / "ne-provinces-ca.json").read_text(encoding="utf-8"))
geo = {}
for f in fc["features"]:
    n = f["properties"]["name"]
    if n in D.CODES: geo[D.CODES[n]] = (n, transform(D.tr_ll, shape(f["geometry"])).simplify(2500, preserve_topology=True))
minx = min(g.bounds[0] for _, g in geo.values()); maxx = max(g.bounds[2] for _, g in geo.values()); miny = min(g.bounds[1] for _, g in geo.values()); maxy = max(g.bounds[3] for _, g in geo.values())
k = W / (maxx - minx); H = round((maxy - miny) * k, 1)
def path(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; out = []
    for p in polys:
        if p.area * k * k < 4: continue  # islas de menos de ~4 px2
        for ring in [p.exterior] + list(p.interiors):
            pts = ["%.1f %.1f" % ((x - minx) * k, (maxy - y) * k) for x, y in ring.coords]
            out.append("M" + "L".join(pts) + "Z")
    return "".join(out)
items = [{"id": c, "name": n, "d": path(g)} for c, (n, g) in sorted(geo.items())]
js = "/* Contornos de las provincias y territorios de Canada (proyeccion Albers equivalente) a partir de Natural Earth 1:50m (dominio publico). Generado por scripts/build-region-maps.py. */\nwindow.DEHESA_CA_PROVINCES = " + json.dumps({"viewBox": "0 0 %d %s" % (W, H), "states": items}, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "vendor" / "ca-provinces.js").write_text(js, encoding="utf-8"); print("vendor/ca-provinces.js", len(js), "bytes", len(items), "provincias, viewBox", "0 0 %d %s" % (W, H))

# ---------- Paises europeos: regiones a partir de Natural Earth 1:10m (admin-1, dominio publico), proyeccion plana con cos(lat) ----------
import math
from shapely.ops import unary_union
from shapely.affinity import translate
adm = json.loads((ROOT / "scripts" / "ref" / "ne-admin1-4c.json").read_text(encoding="utf-8")); adm.update(json.loads((ROOT / "scripts" / "ref" / "ne-admin1-au.json").read_text(encoding="utf-8"))); adm.update(json.loads((ROOT / "scripts" / "ref" / "ne-admin1-nlat.json").read_text(encoding="utf-8")))
def europe_map(cc, feats, codes, key, var, label, tol, canarias=False, W2=900.0):
    byreg = {}
    for f in feats:
        r = f["properties"][key]
        if r in codes: byreg.setdefault(r, []).append(shape(f["geometry"]))
    assert len(byreg) == len(codes), (cc, sorted(set(codes) - set(byreg)))
    lat = sum((g.bounds[1] + g.bounds[3]) / 2 for gs in byreg.values() for g in gs) / sum(len(gs) for gs in byreg.values())
    c = math.cos(math.radians(lat)); out = {}
    for r, gs in byreg.items():
        g = unary_union([x.buffer(0.004, join_style=2) for x in gs]).buffer(-0.004, join_style=2)  # cierra las rendijas entre unidades vecinas antes de disolver
        if canarias and r in ("Canary Is.", "Las Palmas", "Santa Cruz de Tenerife"): g = translate(g, xoff=9.0, yoff=6.0)
        g = transform(lambda x, y, z=None: ([v * c for v in x], list(y)) if hasattr(x, "__iter__") else (x * c, y), g)
        out[codes[r]] = (r, g.simplify(tol * c, preserve_topology=True))
    mnx = min(g.bounds[0] for _, g in out.values()); mxx = max(g.bounds[2] for _, g in out.values()); mny = min(g.bounds[1] for _, g in out.values()); mxy = max(g.bounds[3] for _, g in out.values())
    k2 = W2 / (mxx - mnx); H2 = round((mxy - mny) * k2, 1)
    def p2(g):
        polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]; o = []
        for p in polys:
            if p.area * k2 * k2 < 3: continue
            for ring in [p.exterior] + list(p.interiors): o.append("M" + "L".join("%.1f %.1f" % ((x - mnx) * k2, (mxy - y) * k2) for x, y in ring.coords) + "Z")
        if not o:  # region minuscula (p. ej. ACT): se conserva su poligono mayor para que siga siendo clicable
            big = max(polys, key=lambda q: q.area); o.append("M" + "L".join("%.1f %.1f" % ((x - mnx) * k2, (mxy - y) * k2) for x, y in big.exterior.coords) + "Z")
        return "".join(o)
    items = [{"id": i, "name": n, "d": p2(g)} for i, (n, g) in sorted(out.items())]
    js = "/* Contornos de " + label + " a partir de Natural Earth 1:10m (dominio publico); unidades administrativas disueltas por region. Generado por scripts/build-region-maps.py. */\nwindow." + var + " = " + json.dumps({"viewBox": "0 0 %d %s" % (W2, H2), "states": items}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    fn = {"ES": "es-ccaa", "FR": "fr-regions", "IT": "it-regions", "DE": "de-laender", "AU": "au-states", "NL": "nl-provinces", "AT": "at-laender", "ESP": "es-provinces"}[cc]
    (ROOT / "vendor" / (fn + ".js")).write_text(js, encoding="utf-8"); print("vendor/%s.js" % fn, len(js), "bytes", len(items), "regiones, viewBox", "0 0 %d %s" % (W2, H2))
ES_CODES = {"Andalucía": "AN", "Aragón": "AR", "Asturias": "AS", "Canary Is.": "CN", "Cantabria": "CB", "Castilla y León": "CL", "Castilla-La Mancha": "CM", "Cataluña": "CT", "Extremadura": "EX", "Foral de Navarra": "NC", "Galicia": "GA", "Islas Baleares": "IB", "La Rioja": "RI", "Madrid": "MD", "Murcia": "MC", "País Vasco": "PV", "Valenciana": "VC"}
FR_CODES = {"Auvergne-Rhône-Alpes": "ARA", "Bourgogne-Franche-Comté": "BFC", "Bretagne": "BRE", "Centre-Val de Loire": "CVL", "Corse": "COR", "Grand Est": "GES", "Hauts-de-France": "HDF", "Normandie": "NOR", "Nouvelle-Aquitaine": "NAQ", "Occitanie": "OCC", "Pays de la Loire": "PDL", "Provence-Alpes-Côte-d'Azur": "PAC", "Île-de-France": "IDF"}
IT_CODES = {"Abruzzo": "ABR", "Apulia": "PUG", "Basilicata": "BAS", "Calabria": "CAL", "Campania": "CAM", "Emilia-Romagna": "EMR", "Friuli-Venezia Giulia": "FVG", "Lazio": "LAZ", "Liguria": "LIG", "Lombardia": "LOM", "Marche": "MAR", "Molise": "MOL", "Piemonte": "PIE", "Sardegna": "SAR", "Sicily": "SIC", "Toscana": "TOS", "Trentino-Alto Adige": "TAA", "Umbria": "UMB", "Valle d'Aosta": "VDA", "Veneto": "VEN"}
DE_CODES = {"Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB", "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV", "Niedersachsen": "NI", "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP", "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST", "Schleswig-Holstein": "SH", "Thüringen": "TH"}
europe_map("ES", adm["ESP"], ES_CODES, "region", "DEHESA_ES_CCAA", "las comunidades autonomas de Espana (Canarias en recuadro)", 0.012, canarias=True)
ESP_CODES = {"Álava": "01", "Albacete": "02", "Alicante": "03", "Almería": "04", "Ávila": "05", "Badajoz": "06", "Baleares": "07", "Barcelona": "08", "Burgos": "09", "Cáceres": "10", "Cádiz": "11", "Castellón": "12", "Ciudad Real": "13", "Córdoba": "14", "La Coruña": "15", "Cuenca": "16", "Gerona": "17", "Granada": "18", "Guadalajara": "19", "Gipuzkoa": "20", "Huelva": "21", "Huesca": "22", "Jaén": "23", "León": "24", "Lérida": "25", "La Rioja": "26", "Lugo": "27", "Madrid": "28", "Málaga": "29", "Murcia": "30", "Navarra": "31", "Orense": "32", "Asturias": "33", "Palencia": "34", "Las Palmas": "35", "Pontevedra": "36", "Salamanca": "37", "Santa Cruz de Tenerife": "38", "Cantabria": "39", "Segovia": "40", "Sevilla": "41", "Soria": "42", "Tarragona": "43", "Teruel": "44", "Toledo": "45", "Valencia": "46", "Valladolid": "47", "Bizkaia": "48", "Zamora": "49", "Zaragoza": "50", "Ceuta": "51", "Melilla": "52"}
europe_map("ESP", adm["ESP"], ESP_CODES, "name", "DEHESA_ES_PROVINCES", "las provincias de Espana (Canarias en recuadro)", 0.012, canarias=True)
europe_map("FR", [f for f in adm["FRA"]], FR_CODES, "region", "DEHESA_FR_REGIONS", "las regiones de Francia metropolitana (sin ultramar)", 0.012)
europe_map("IT", adm["ITA"], IT_CODES, "region", "DEHESA_IT_REGIONS", "las regiones de Italia", 0.012)
europe_map("DE", adm["DEU"], DE_CODES, "name", "DEHESA_DE_LAENDER", "los Lander de Alemania", 0.01)
AU_CODES = {"New South Wales": "NSW", "Victoria": "VIC", "Queensland": "QLD", "South Australia": "SA", "Western Australia": "WA", "Tasmania": "TAS", "Northern Territory": "NT", "Australian Capital Territory": "ACT"}
europe_map("AU", adm["AUS"], AU_CODES, "name", "DEHESA_AU_STATES", "los estados y territorios de Australia", 0.03)
NL_CODES = {"Groningen": "GR", "Friesland": "FR", "Drenthe": "DR", "Overijssel": "OV", "Gelderland": "GE", "Flevoland": "FL", "Utrecht": "UT", "Noord-Holland": "NH", "Zuid-Holland": "ZH", "Zeeland": "ZE", "Noord-Brabant": "NB", "Limburg": "LI"}
AT_CODES = {"Burgenland": "B", "Niederösterreich": "NO", "Wien": "W", "Kärnten": "K", "Steiermark": "ST", "Oberösterreich": "OO", "Salzburg": "S", "Tirol": "T", "Vorarlberg": "V"}
europe_map("NL", adm["NLD"], NL_CODES, "name", "DEHESA_NL_PROVINCES", "las provincias de los Paises Bajos (sin el Caribe neerlandes)", 0.004)
europe_map("AT", adm["AUT"], AT_CODES, "name", "DEHESA_AT_LAENDER", "los Lander de Austria", 0.006)

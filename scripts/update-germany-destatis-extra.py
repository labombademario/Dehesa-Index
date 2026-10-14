#!/usr/bin/env python3
"""Alemania: mas tablas de Destatis (GENESIS-Online, Datenlizenz Deutschland - Namensnennung 2.0) -> data/germany-extra-stats.json
Necesita GENESIS_TOKEN (el mismo de update-germany). Sin token no se toca el fichero. Todo tal cual lo publica Destatis; solo kg -> t.
  41253-0002  vino: superficie en produccion, rendimiento y cosecha de mosto por region vitivinicola (anual desde 1991)
  41244-0001  vino: primera estimacion de la cosecha del año en curso (nacional)
  41261-0001  cortas de madera por grupo de especies (anual desde 1998)
  41261-0010  cortas de madera por Land (total)
  41261-0003  cortas por daños (insectos, viento, sequia, nieve, otros), todas las especies y propiedades
  41271-0001  explotaciones agrarias y superficie agraria util (nacional, desde 1971)
  41271-0010  explotaciones y superficie agraria util por Land (desde 1991)
  41141-0005  explotaciones ecologicas y su superficie (censo y encuestas de estructura, 2010-2023)
  41321-0003  incubadoras: huevos incubados y pollitos nacidos por especie (mensual desde 2010)
  41362-0001  acuicultura: produccion por tipo (anual desde 2011)
  41363-0001  precio de venta del pescado de acuicultura por especie y canal (anual desde 2011)
  42321-0003  ventas interiores de abonos por tipo (trimestral); 61243-0005/-0014  precios de electricidad y gas para empresas (semestral)
  61241-0101  precio de productor del gasoleo de calefaccion (mensual); 41215  hortalizas; 41232  bayas; 41214  setas; 41241-0006  forraje
  41252-0002  vinedo por region y variedad; 41312/41313/41314  tamaño de hato (vacas de leche, cerdos de cebo, ovino); 41141-0009/-0015/-0016  tenencia, regadio y cultivos permanentes
Uso: GENESIS_TOKEN=... python3 scripts/update-germany-destatis-extra.py"""
import csv, datetime, io, json, os, re, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "germany-extra-stats.json"; LOGF = ROOT / "data" / "germany-extra-log.txt"
URL = "https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile"
MON = {m: i + 1 for i, m in enumerate(["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"])}
LAND = {"Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB", "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV", "Niedersachsen": "NI",
        "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP", "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST", "Schleswig-Holstein": "SH", "Thüringen": "TH"}
LAND_EN = {"Bayern": "Bavaria", "Hessen": "Hesse", "Niedersachsen": "Lower Saxony", "Nordrhein-Westfalen": "North Rhine-Westphalia", "Rheinland-Pfalz": "Rhineland-Palatinate", "Sachsen": "Saxony",
           "Sachsen-Anhalt": "Saxony-Anhalt", "Thüringen": "Thuringia", "Mecklenburg-Vorpommern": "Mecklenburg-Western Pomerania"}
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def num(s):
    s = (s or "").strip()
    if s in ("", ".", "..", "...", "-", "/", "x", "–"): return None
    try: return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)
    except ValueError: return None
def fetch(tok, name, sy):
    body = urllib.parse.urlencode({"name": name, "area": "all", "startyear": sy, "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=h, method="POST"), timeout=240) as r: raw = r.read()
            if raw[:2] != b"PK": raise RuntimeError("sin ZIP: " + raw[:160].decode("utf-8", "replace"))
            z = zipfile.ZipFile(io.BytesIO(raw)); return list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(("%s: %s" % (name, last)).replace(tok, "<token>"))
def labels(r):
    """{n: etiqueta} de las variables de clasificacion de la fila (1_variable_attribute_label, ...)"""
    return {int(k.split("_")[0]): (v or "").strip() for k, v in r.items() if re.match(r"^\d+_variable_attribute_label$", k)}
def codes(r): return {int(k.split("_")[0]): (r[k] or "").strip() for k in r if re.match(r"^\d+_variable_code$", k)}
def period(r):
    c = codes(r); L = labels(r); t = r["time"].strip()
    for n, code in c.items():
        if code == "MONAT":
            m = MON.get(L.get(n)); return "%s-%02d" % (t, m) if m else None
    return t
SER = {}
def add(id_, group, label, unit, freq, pts, note, factor=1.0):
    pts = sorted((p, round(v * factor, 4)) for p, v in pts.items() if v is not None)
    if len(pts) < 2: log("descartada", id_, len(pts)); return
    last, prev = pts[-1], pts[-2]
    SER[id_] = {"id": id_, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": last[0], "latest": last[1],
                "changePct": round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, "points": [[p, v] for p, v in pts], "sourceGroup": "Destatis GENESIS-Online", "sourceId": "destatis", "note": note}
def pick(rows, var, **want):
    """puntos {periodo: valor} de las filas cuya variable de valor es var y cuyas etiquetas de clasificacion contienen want (por valor)"""
    out = {}
    for r in rows:
        if r["value_variable_label"].strip() != var: continue
        L = set(labels(r).values())
        if not all(v in L for v in want.values()): continue
        p = period(r); v = num(r["value"])
        if p and v is not None: out[p] = v
    return out
def main():
    tok = os.environ.get("GENESIS_TOKEN", "").strip()
    if not tok: log("sin GENESIS_TOKEN: se conserva data/germany-extra-stats.json"); LOGF.write_text("\n".join(LOG) + "\n"); return 0
    T = {}
    for name, sy in (("41253-0002", "1991"), ("41244-0001", "2019"), ("41261-0001", "1998"), ("41261-0010", "1998"), ("41261-0003", "2006"), ("41271-0001", "1971"), ("41271-0010", "1991"),
                     ("41141-0005", "2010"), ("41321-0003", "2010"), ("41362-0001", "2011"), ("41363-0001", "2011"),
                     ("42321-0003", "2010"), ("61243-0005", "2019"), ("61243-0014", "2019"), ("61241-0101", "2005"), ("41215-0001", "2010"), ("41215-0002", "2010"), ("41232-0001", "2012"), ("41214-0001", "2012"),
                     ("41241-0006", "2010"), ("41252-0002", "2015"), ("41312-0004", "2010"), ("41313-0004", "2010"), ("41314-0002", "2011"), ("41141-0009", "2010"), ("41141-0015", "2010"), ("41141-0016", "2020")):
        try: T[name] = fetch(tok, name, sy); log(name, len(T[name]), "filas")
        except Exception as e: log("ERROR", name, str(e)[:200])
    WN = "Datos de la estadistica de la vendimia de Destatis (41253); el mosto (Weinmost) es la uva prensada antes de fermentar, en hectolitros."
    if "41253-0002" in T:
        R = T["41253-0002"]
        add("de-wine-must-total", "production", "Wine must harvest, Germany", "hl", "annual", _region(R, "Erntemenge an Weinmost", "Insgesamt", "Insgesamt"), WN)
        for kind, en in (("Weißmost", "white"), ("Rotmost", "red")):
            add("de-wine-must-" + en, "production", "Wine must harvest, %s, Germany" % en, "hl", "annual", _region(R, "Erntemenge an Weinmost", kind, "Insgesamt"), WN)
        add("de-wine-area", "crops", "Vineyard area in production, Germany", "ha", "annual", _region(R, "Rebfläche im Ertrag", "Insgesamt", "Insgesamt"), WN)
        add("de-wine-yield", "crops", "Wine must yield per hectare, Germany", "hl/ha", "annual", _region(R, "Weinmostertrag je Hektar", "Insgesamt", "Insgesamt"), WN)
        regs = sorted({labels(r).get(3) for r in R} - {"Insgesamt", None})
        for g in regs:
            slug = re.sub(r"[^a-z]+", "-", g.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")).strip("-")
            add("de-wine-must-" + slug, "production", "Wine must harvest, %s, Germany" % g, "hl", "annual", _region(R, "Erntemenge an Weinmost", "Insgesamt", g), WN)
    if "41244-0001" in T:
        R = T["41244-0001"]; pts = {}
        for r in R:
            L = labels(r)
            if r["value_variable_label"].strip() == "Erntemenge an Weinmost" and "Insgesamt" in L.values():
                v = num(r["value"]); p = period(r)
                if v is not None and p: pts[p] = v
        add("de-wine-must-estimate", "production", "Wine must harvest, first estimate, Germany", "hl", "annual", pts, "Primera estimacion de Destatis (41244), se publica antes de cerrar la vendimia y se revisa despues; la cifra definitiva es la de de-wine-must-total.")
    HN = "Cortas de madera de Destatis (41261), en miles de m3 sin corteza; incluye todas las propiedades (estado, municipios y privados)."
    SP = {"Insgesamt": ("total", "all species"), "Fichte, Tanne, Douglasie und sonstiges Nadelholz": ("spruce", "spruce and other conifers"), "Kiefer und Lärche": ("pine", "pine and larch"),
          "Buche und sonstiges Laubholz": ("beech", "beech and other broadleaves"), "Eiche und Roteiche": ("oak", "oak")}
    if "41261-0001" in T:
        for de, (k, en) in SP.items(): add("de-timber-harvest-" + k, "production", "Timber harvest, %s, Germany" % en, "1000 m3", "annual", pick(T["41261-0001"], "Holzeinschlag", a=de), HN)
    if "41261-0010" in T:
        for land, code in LAND.items():
            pts = {}
            for r in T["41261-0010"]:
                L = labels(r)
                if L.get(1) == land and L.get(2) == "Insgesamt": v = num(r["value"]); pts[r["time"].strip()] = v
            add("de-timber-harvest-land-" + code.lower(), "production", "Timber harvest, %s, Germany" % LAND_EN.get(land, land), "1000 m3", "annual", pts, HN)
    if "41261-0003" in T:
        CA = {"Insgesamt": ("total", "all causes"), "Insekten": ("insects", "insects"), "Wind/Sturm": ("wind", "wind and storm"), "Trockenheit": ("drought", "drought"), "Schnee/Duft": ("snow", "snow and frost"), "Sonstiges": ("other", "other causes")}
        for de, (k, en) in CA.items():
            pts = {}
            for r in T["41261-0003"]:
                L = labels(r)
                if L.get(2) == de and L.get(3) == "Insgesamt" and L.get(4) == "Insgesamt": pts[r["time"].strip()] = num(r["value"])
            add("de-timber-damaged-" + k, "production", "Damaged timber harvest, %s, Germany" % en, "1000 m3", "annual", pts, "Corta forzosa por daños (Schadholzeinschlag), Destatis 41261; todas las especies y propiedades.")
    SN = "Estadistica de estructura agraria de Destatis (41271): explotaciones con al menos 5 ha de SAU o con minimos de ganado o cultivos especiales; los umbrales cambiaron en 1999 y 2010, asi que la serie larga tiene saltos de metodo."
    if "41271-0001" in T:
        R = T["41271-0001"]
        add("de-farms-holdings", "production", "Agricultural holdings, Germany", "holdings", "annual", pick(R, "Landwirtschaftliche Betriebe"), SN)
        add("de-farms-uaa", "crops", "Utilised agricultural area, Germany", "ha", "annual", pick(R, "Landwirtschaftlich genutzte Fläche"), SN)
    if "41271-0010" in T:
        for land, code in LAND.items():
            if code in ("BE", "HH", "HB"): continue   # ciudades-estado: muy pocas explotaciones
            add("de-farms-holdings-" + code.lower(), "production", "Agricultural holdings, %s, Germany" % LAND_EN.get(land, land), "holdings", "annual", pick(T["41271-0010"], "Landwirtschaftliche Betriebe", a=land), SN)
            add("de-farms-uaa-" + code.lower(), "crops", "Utilised agricultural area, %s, Germany" % LAND_EN.get(land, land), "ha", "annual", pick(T["41271-0010"], "Landwirtschaftlich genutzte Fläche", a=land), SN)
    if "41141-0005" in T:
        R = T["41141-0005"]; ON = "Explotaciones con agricultura ecologica (convertidas o en conversion) y su superficie, Destatis 41141 (censos 2010, 2020 y encuestas de estructura)."
        def org(var):
            pts = {}
            for r in R:
                L = labels(r)
                if r["value_variable_label"].strip() == var and L.get(2) == "Insgesamt" and L.get(3) in ("Insgesamt", ""): v = num(r["value"]); pts[r["time"].strip()] = v if v is not None else pts.get(r["time"].strip())
            return pts
        add("de-organic-holdings", "organic", "Organic farms, Germany", "holdings", "annual", org("Landwirtsch. Betriebe mit ökologischem Landbau"), ON)
        add("de-organic-uaa", "organic", "Farmland of organic farms, Germany", "ha", "annual", org("LF in Betrieben mit ökologischem Landbau"), ON)
    if "41321-0003" in T:
        R = T["41321-0003"]; BN = "Estadistica de incubadoras de Destatis (41321): pollitos nacidos y huevos incubados en las incubadoras con capacidad de al menos 1.000 huevos, mensual."
        for de, k, en in (("Insgesamt", "total", "all poultry"), ("Hühnerküken, Mastrassen zum Gebrauch", "broiler", "broiler chicks"), ("Hühnerküken, Legerassen zum Gebrauch", "layer", "laying-hen chicks"),
                          ("Truthühnerküken zum Gebrauch", "turkey", "turkey poults"), ("Entenküken zum Gebrauch", "duck", "ducklings"), ("Gänseküken zum Gebrauch", "goose", "goslings")):
            pts = {}
            for r in R:
                L = labels(r)
                if r["value_variable_label"].strip() == "Geschlüpfte Küken" and L.get(3) == de: p = period(r); pts[p] = num(r["value"])
            add("de-hatch-chicks-" + k, "livestock", "Chicks hatched, %s, Germany" % en, "head", "monthly", pts, BN)
        pts = {}
        for r in R:
            if r["value_variable_label"].strip() == "Eingelegte Bruteier" and labels(r).get(3) == "Insgesamt": pts[period(r)] = num(r["value"])
        add("de-hatch-eggs-set", "livestock", "Hatching eggs set, all poultry, Germany", "eggs", "monthly", pts, BN)
    if "41362-0001" in T:
        AN = "Produccion de la acuicultura de Destatis (41362), en toneladas (Destatis publica kg)."
        for de, k, en in (("Insgesamt", "total", "total"), ("Fische", "fish", "fish"), ("Weichtiere", "molluscs", "molluscs")):
            add("de-aqua-" + k, "production", "Aquaculture production, %s, Germany" % en, "t", "annual", pick(T["41362-0001"], "Erzeugte Menge", a=de), AN, 0.001)
    if "41363-0001" in T:
        PN = "Precio de venta del pescado vivo o recien sacrificado de acuicultura, Destatis 41363, euros por kg, por canal de venta."
        for sp, k, en in (("Regenbogenforelle (ohne Lachsforelle)", "trout", "rainbow trout"), ("Gemeiner Karpfen", "carp", "common carp"), ("Lachsforelle", "salmontrout", "salmon trout")):
            for ch, kc, enc in (("Vermarktung an Großhandel", "wholesale", "sold to wholesale"), ("Direktvermarktung", "direct", "direct sale")):
                pts = {}
                for r in T["41363-0001"]:
                    L = labels(r)
                    if L.get(3) == sp and L.get(2) == ch: pts[r["time"].strip()] = num(r["value"])
                add("de-fishprice-%s-%s" % (k, kc), "prices", "Aquaculture price, %s, %s, Germany" % (en, enc), "EUR/kg", "annual", pts, PN)

    more(T)
    log("series", len(SER))
    if len(SER) < 40: log("demasiado pocas series; no se escribe"); LOGF.write_text("\n".join(LOG) + "\n"); return 1
    src = {"name": "Statistisches Bundesamt (Destatis), GENESIS-Online", "url": "https://www-genesis.destatis.de/", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"DE": {"name": "Germany", "source": src, "series": sorted(SER.values(), key=lambda s: s["id"])}}}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); LOGF.write_text("\n".join(LOG) + "\n")
    print("germany-extra-stats.json", OUT.stat().st_size, "bytes"); return 0
def slug(t):
    t = t.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")
def tpts(R, var, want, per):
    """puntos {periodo: valor}; want = {n_variable: etiqueta}; per(r) -> periodo o None"""
    out = {}
    for r in R:
        if var and r["value_variable_label"].strip() != var: continue
        L = labels(r)
        if any(L.get(n) != v for n, v in want.items()): continue
        p = per(r); v = num(r["value"])
        if p and v is not None: out[p] = v
    return out
def tr(lab, M):
    """traduccion por subcadena (clave mas larga primero); si no hay, la etiqueta alemana"""
    for k in sorted(M, key=len, reverse=True):
        if k in lab: return M[k]
    return lab
def p_year(r): return r["time"].strip()[:4]
def p_q(n):
    def f(r):
        m = re.match(r"(\d)\.", labels(r).get(n, "")); return "%s-Q%s" % (r["time"].strip()[:4], m.group(1)) if m else None
    return f
def p_h(n):
    def f(r):
        m = re.match(r"(\d)\.", labels(r).get(n, "")); return "%s-S%s" % (r["time"].strip()[:4], m.group(1)) if m else None
    return f
def p_m(r):
    m = re.match(r"^(\d{4})-(\d{2})P1M$", r["time"].strip()); return "%s-%s" % (m.group(1), m.group(2)) if m else None
def more(T):
    FN = "Ventas interiores de abonos de Destatis (42321), trimestral, toneladas de nutriente (N, P2O5, K2O) o de CaO segun el tipo; solo los tipos con unidad de nutriente en su etiqueta."
    EN_F = {"Kalkammonsalpeter": "calcium ammonium nitrate", "Ammoniumnitrat-Harnstoff": "urea ammonium nitrate solution", "Kaliumchlorid": "potassium chloride", "Kaliumsulfat": "potassium sulphate", "Kalirohsalz": "crude potash salt",
            "Branntkalk": "quicklime", "Kohlensaurer Kalk": "carbonate lime", "Konverterkalk": "converter lime", "Andere Einnährstoffdünger": "other single-nutrient fertilisers", "Andere Kalkdünger": "other lime fertilisers",
            "Andere Phosphatdünger": "other phosphate fertilisers", "NK- und NPK-Dünger": "NK and NPK compound", "NPK-Dünger": "NPK compound", "NP-Dünger": "NP compound", "PK-Dünger": "PK compound", "Superphosphat": "superphosphate"}
    if "42321-0003" in T:
        R = T["42321-0003"]; seen = {}
        for r in R:
            lab = labels(r).get(3, ""); m = re.search(r"\(t-([A-Za-z0-9]+)\)", lab)
            if m: seen[lab] = m.group(1)
        for lab, nut in sorted(seen.items()):
            base = re.sub(r"\s*\(t-[A-Za-z0-9]+\)", "", lab)
            en = tr(base, EN_F)
            add("de-fert-sales-" + slug(en) + "-" + nut.lower(), "inputs", "Fertiliser sales, %s (%s), Germany" % (en, nut), "t " + nut, "quarterly", tpts(R, None, {3: lab}, p_q(1)), FN)
    EP = "Precios de la electricidad y del gas para no hogares de Destatis (61243), semestral, EUR por kWh; 'con impuestos' incluye todos los impuestos y tasas, 'sin impuestos' excluye impuestos, tasas y recargos."
    def energy(tab, var, kind, en, classes):
        if tab not in T: return
        R = T[tab]
        for cl, kc in classes:
            for pre, kp, enp in (("Durchschnittspreise inkl.", "gross", "incl. taxes"), ("Durchschnittspreise ohne Steuern", "net", "excl. taxes")):
                pts = {}
                for r in R:
                    L = labels(r)
                    if L.get(4) == cl and L.get(3, "").startswith(pre):
                        p = p_h(1)(r); v = num(r["value"])
                        if p and v is not None: pts[p] = v
                add("de-%s-price-business-%s-%s" % (kind, kc, kp), "inputs", "%s price for business, %s, %s, Germany" % (en, kc.replace("-", " "), enp), "EUR/kWh", "semiannual", pts, EP)
    energy("61243-0005", "Strompreise", "electricity", "Electricity", [("Insgesamt", "all"), ("20 bis unter 500 MWh", "20-500-mwh")])
    energy("61243-0014", "Erdgaspreise", "gas", "Natural gas", [("Insgesamt", "all"), ("278 bis unter 2 778 MWh", "278-2778-mwh")])
    if "61241-0101" in T:
        MN = {m: i + 1 for i, m in enumerate(["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"])}
        def pm(r):
            m = MN.get(labels(r).get(1)); return "%s-%02d" % (r["time"].strip()[:4], m) if m else None
        R = T["61241-0101"]
        for kind, k, en in (("Lief.i.TKW", "truck", "tanker-truck delivery to consumers"), ("Lieferung v. mind. 500 t", "wholesale", "wholesale delivery of 500 t or more")):
            pts = {}
            for r in R:
                L = labels(r)
                if L.get(2) == "Deutschland" and L.get(3, "").startswith(kind):
                    p = pm(r); v = num(r["value"])
                    if p and v is not None: pts[p] = v
            add("de-heating-oil-producer-" + k, "inputs", "Light heating oil producer price, %s, Germany" % en, "EUR/hl", "monthly", pts, "Precio de productor del gasoleo de calefaccion ligero de Destatis (61241), EUR por hectolitro; se usa como referencia del gasoleo agricola, que no es lo mismo.")
    VN = "Estadistica de hortalizas de Destatis (41215): superficie y cosecha, explotaciones con al menos 0,5 ha de hortalizas al aire libre (umbrales segun el tipo)."
    if "41215-0001" in T:
        R = T["41215-0001"]
        for var, k, en, u, g in (("Anbaufläche Gemüse", "area", "Vegetable area", "ha", "crops"), ("Erntemenge Gemüse", "harvest", "Vegetable harvest", "t", "production"), ("Betriebe mit Gemüseanbau", "holdings", "Vegetable growers", "holdings", "production")):
            add("de-veg-total-" + k, g, en + ", Germany", u, "annual", tpts(R, var, {}, p_year), VN)
    VEG = {"Spargel": "asparagus", "Möhren": "carrots", "Speisezwiebeln": "dry onions", "Bundzwiebeln": "spring onions", "Weißkohl": "white cabbage", "Rotkohl": "red cabbage", "Blumenkohl": "cauliflower", "Broccoli": "broccoli", "Einlegegurken": "pickling cucumbers",
           "Salatgurken": "salad cucumbers", "Gurken": "cucumbers", "Spinat": "spinach", "Eissalat": "iceberg lettuce", "Porree": "leek", "Rote Rüben": "beetroot", "Rote Bete": "beetroot", "sellerie": "celeriac", "Kohlrabi": "kohlrabi", "Chinakohl": "Chinese cabbage", "Feldsalat": "lamb's lettuce", "kürbis": "pumpkin", "Tomaten": "tomatoes", "Rettich": "radish"}
    if "41215-0002" in T:
        R = T["41215-0002"]; last = {}
        for r in R:
            if r["value_variable_label"].strip() == "Erntemenge Gemüse (Freiland)":
                v = num(r["value"]); y = r["time"].strip()[:4]; c = labels(r).get(2, "")
                if v is not None and c and (c not in last or y >= last[c][0]): last[c] = (y, v)
        top = sorted((c for c in last if "insgesamt" not in c.lower() and not c.startswith("Sonstige")), key=lambda c: -last[c][1])[:16]
        for c in top:
            nm = tr(c, VEG)
            add("de-veg-%s-harvest" % slug(nm), "production", "Field vegetable harvest, %s, Germany" % nm, "t", "annual", tpts(R, "Erntemenge Gemüse (Freiland)", {2: c}, p_year), VN)
            add("de-veg-%s-area" % slug(nm), "crops", "Field vegetable area, %s, Germany" % nm, "ha", "annual", tpts(R, "Anbaufläche Gemüse (Freiland)", {2: c}, p_year), VN)
    if "41232-0001" in T:
        R = T["41232-0001"]; BE = "Estadistica de bayas (Strauchbeeren) de Destatis (41232): fresas aparte; superficie en ha y cosecha en toneladas."
        for var, k, en, u, g in (("Anbaufläche", "area", "Bush-berry area", "ha", "crops"), ("Erntemenge", "harvest", "Bush-berry harvest", "t", "production"), ("Betriebe mit Strauchbeerenanbau", "holdings", "Bush-berry growers", "holdings", "production")):
            add("de-berries-" + k, g, en + ", Germany", u, "annual", tpts(R, var, {}, p_year), BE)
    if "41214-0001" in T:
        R = T["41214-0001"]; MU = "Estadistica de setas de cultivo de Destatis (41214); la superficie de cosecha se publica en 1.000 m2 (superficie acumulada de todas las cosechas del año)."
        for var, k, en, u, g, f in (("Erntemenge", "harvest", "Cultivated mushroom harvest", "t", "production", 1), ("Betriebe", "holdings", "Mushroom growers", "holdings", "production", 1)):
            add("de-mushrooms-" + k, g, en + ", Germany", u, "annual", tpts(R, var, {2: "Insgesamt"}, p_year), MU)
        add("de-mushrooms-champignon-harvest", "production", "Champignon harvest, Germany", "t", "annual", tpts(R, "Erntemenge", {2: "Champignons"}, p_year), MU)
    if "41241-0006" in T:
        R = T["41241-0006"]; FO = "Cosecha de forraje basto de Destatis (41241), toneladas de producto fresco o conservado segun el uso."
        for de, k, en in (("Heu", "hay", "hay"), ("Silage", "silage", "silage"), ("Frischfutter / Weide", "fresh", "fresh feed and grazing")):
            add("de-forage-" + k, "production", "Forage harvest (grassland and field grass), %s, Germany" % en, "t", "annual", tpts(R, "Erntemenge von Raufutter", {2: "Insgesamt", 3: de}, p_year), FO)
    if "41252-0002" in T:
        R = T["41252-0002"]; VI = "Estadistica de superficie de vinedo de Destatis (41252): superficie con uva de vinificacion por region vitivinicola, en hectareas."
        for g in sorted({labels(r).get(2) for r in R} - {"Insgesamt", None}):
            add("de-vine-area-" + slug(g), "crops", "Wine-grape vineyard area, %s, Germany" % g, "ha", "annual", tpts(R, "Mit Keltertrauben bestockte Rebfläche", {2: g, 3: "Insgesamt"}, p_year), VI)
        VAR = {"Riesling": "Riesling", "Müller-Thurgau (Rivaner)": "Muller-Thurgau", "Blauer Spätburgunder": "Pinot noir", "Grauer Burgunder": "Pinot gris", "Weißer Burgunder": "Pinot blanc", "Dornfelder": "Dornfelder", "Grauer Burgunder": "Pinot gris", "Silvaner": "Silvaner", "Weißer Riesling": "Riesling"}
        last = {}
        for r in R:
            L = labels(r)
            if L.get(2) == "Insgesamt" and L.get(3) not in ("Insgesamt", None):
                v = num(r["value"]); y = r["time"].strip()[:4]
                if v is not None and (L[3] not in last or y >= last[L[3]][0]): last[L[3]] = (y, v)
        for c in sorted((c for c in last if c not in ("Rotwein", "Weißwein", "Weisswein") and not c.startswith(("Sonstige", "Andere"))), key=lambda c: -last[c][1])[:8]:
            add("de-vine-variety-" + slug(VAR.get(c, c)), "crops", "Wine-grape area, %s, Germany" % VAR.get(c, c), "ha", "annual", tpts(R, "Mit Keltertrauben bestockte Rebfläche", {2: "Insgesamt", 3: c}, p_year), VI)
    CS = "Estructura de la cabana de Destatis (41312, 41313, 41314): numero de explotaciones y de animales segun el tamano del hato, en mayo y noviembre (la frecuencia depende de la especie)."
    def herd(tab, hold_var, head_var, kind, en_h, en_a, sizes):
        if tab not in T: return
        R = T[tab]
        add("de-%s-holdings" % kind, "livestock", "%s, Germany" % en_h, "holdings", "monthly", tpts(R, hold_var, {2: "Insgesamt"}, p_m), CS)
        add("de-%s-head" % kind, "livestock", "%s, Germany" % en_a, "head", "monthly", tpts(R, head_var, {2: "Insgesamt"}, p_m), CS)
        for lab, k in sizes:
            add("de-%s-head-%s" % (kind, k), "livestock", "%s, herds of %s, Germany" % (en_a, lab.replace(" Tiere", " head").replace(" und mehr", " or more").replace(" bis ", " to ")), "head", "monthly", tpts(R, head_var, {2: lab}, p_m), CS)
    herd("41312-0004", "Haltungen mit Milchkühen", "Milchkühe", "dairy-cows", "Dairy cow holdings", "Dairy cows", [("500 und mehr Tiere", "500plus"), ("200 bis 499 Tiere", "200-499"), ("100 bis 199 Tiere", "100-199"), ("1 bis 9 Tiere", "1-9")])
    herd("41313-0004", "Betriebe mit Mastschweinen", "Mastschweine", "fattening-pigs", "Fattening pig holdings", "Fattening pigs", [("5000 und mehr Tiere", "5000plus"), ("1000 bis 1999 Tiere", "1000-1999"), ("1 bis 99 Tiere", "1-99")])
    herd("41314-0002", "Betriebe mit Schafhaltung", "Schafe", "sheep", "Sheep holdings", "Sheep", [("1000 und mehr Tiere", "1000plus"), ("1 bis 49 Tiere", "1-49")])
    TN = "Tenencia y uso de la tierra agraria de Destatis (41141, censos agrarios 2010 y 2020 y encuesta de estructura 2016 y 2023)."
    if "41141-0009" in T:
        R = T["41141-0009"]
        for de, k, en in (("Eigene selbstbewirtschaftete LF", "own", "owned"), ("Gepachtete landwirtschaftlich genutzte Fläche", "rented", "rented")):
            add("de-land-tenure-%s-area" % k, "crops", "Utilised agricultural area, %s, Germany" % en, "ha", "annual", tpts(R, "Fläche im jeweiligen Eigentumsverhältnis", {2: de, 3: "Insgesamt", 4: "Insgesamt"}, p_year), TN)
    if "41141-0015" in T:
        R = T["41141-0015"]
        add("de-irrigated-area", "crops", "Irrigated area in the previous year, Germany", "ha", "annual", tpts(R, "Bewässerte Fläche im Vorjahr", {2: "Insgesamt"}, p_year), TN)
        add("de-irrigated-holdings", "production", "Farms with irrigation, Germany", "holdings", "annual", tpts(R, "Landwirtschaftl. Betr. mit Bewässerung im Vorjahr", {2: "Insgesamt"}, p_year), TN)
    if "41141-0016" in T:
        R = T["41141-0016"]
        for de, k, en in (("Rebflächen", "vines", "Vineyards"), ("Baumobstanlagen für Kernobst", "pome", "Pome-fruit orchards"), ("Baumobstanlagen für Steinobst", "stone", "Stone-fruit orchards"), ("Beerenobstanlagen (ohne Erdbeeren)", "berries", "Berry plantations"), ("Baumschulen", "nurseries", "Tree nurseries")):
            add("de-permanent-%s-area" % k, "crops", "%s area (farm structure survey), Germany" % en, "ha", "annual", tpts(R, "Dauerkulturfläche", {2: de, 3: "Insgesamt"}, p_year), TN)
def _region(R, var, kind, region):
    """41253-0002: variable 2 = tipo de mosto, variable 3 = region vitivinicola"""
    pts = {}
    for r in R:
        L = labels(r)
        if r["value_variable_label"].strip() == var and L.get(2) == kind and L.get(3) == region: pts[r["time"].strip()] = num(r["value"])
    return pts
if __name__ == "__main__": sys.exit(main())

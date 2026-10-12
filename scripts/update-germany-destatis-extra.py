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
                     ("41141-0005", "2010"), ("41321-0003", "2010"), ("41362-0001", "2011"), ("41363-0001", "2011")):
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
    log("series", len(SER))
    if len(SER) < 40: log("demasiado pocas series; no se escribe"); LOGF.write_text("\n".join(LOG) + "\n"); return 1
    src = {"name": "Statistisches Bundesamt (Destatis), GENESIS-Online", "url": "https://www-genesis.destatis.de/", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"DE": {"name": "Germany", "source": src, "series": sorted(SER.values(), key=lambda s: s["id"])}}}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); LOGF.write_text("\n".join(LOG) + "\n")
    print("germany-extra-stats.json", OUT.stat().st_size, "bytes"); return 0
def _region(R, var, kind, region):
    """41253-0002: variable 2 = tipo de mosto, variable 3 = region vitivinicola"""
    pts = {}
    for r in R:
        L = labels(r)
        if r["value_variable_label"].strip() == var and L.get(2) == kind and L.get(3) == region: pts[r["time"].strip()] = num(r["value"])
    return pts
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Cortas, daños y plagas forestales -> data/forest-damage.json
  CZ  Chequia  CSU, conjunto abierto LES0104: tala total y tala fortuita (por causas naturales, por insectos, por otras causas), m3 sin corteza, anual desde 2015.
  SE  Suecia   Skogsstyrelsen (PxWeb): JO0312_07 bosque derribado por tormenta (millones de m3sk), JO0312_01 cortas brutas y por surtido,
               y la captura semanal de escarabajo de la corteza del abeto (Ips typographus) en trampas de feromonas: media de las trampas, desde 2016.
  EE  Estonia  Statistics Estonia KK513: rodales forestales destruidos por causa (insectos, viento, incendio, enfermedades...), ha, anual desde 1991.
  Ampliacion (27 oct): CZ LES0101 (propiedad), LES0102 (13 regiones: cortas, tala fortuita, superficie, repoblacion), LES0103 (claros); SE JO0312_02a (cortas brutas por provincia);
               EE KK514 (rodales dañados por causa); HU kor0006 (cortas por especie). Las series regionales llevan el campo "region".
  HU  Hungria  KSH STADAT kor0010: superficie de bosque danada por grupo de daños (insectos, abioticos, vertebrados...), ha, anual desde 2017.
Cada serie lleva sus periodos. Los paises que fallan conservan su serie anterior (maximo 1 fallo). Uso: python3 scripts/update-forest-damage.py"""
import csv, datetime, io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "forest-damage.json"
UA = {"User-Agent": "Mozilla/5.0 Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
MAX_FAIL = 1
def http(url, data=None, headers=None, tries=4, timeout=120):
    last = None; h = dict(UA); h.update(headers or {})
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError("%s: %s" % (url[:90], repr(last)[:160]))
def jpost(url, query):
    return json.loads(http(url, json.dumps({"query": query, "response": {"format": "json-stat2"}}).encode(), {"Content-Type": "application/json"}).decode("utf-8-sig"))
def jget(url): return json.loads(http(url).decode("utf-8-sig"))
def cats(d, dim):
    c = d["dimension"][dim]["category"]; idx = c["index"]
    codes = list(idx) if isinstance(idx, list) else sorted(idx, key=idx.get)
    return codes, c.get("label", {})
def cells(d):
    """json-stat2 -> {tupla de (codigo, etiqueta) por dimension: valor}"""
    ids = d["id"]; size = d["size"]; vals = d["value"]
    cc = {i: cats(d, i) for i in ids}
    strides = []; s = 1
    for z in reversed(size): strides.insert(0, s); s *= z
    out = {}
    for flat, v in enumerate(vals):
        if v is None: continue
        out[tuple(cc[i][0][(flat // strides[k]) % size[k]] for k, i in enumerate(ids))] = v
    return out, {i: cc[i][1] for i in ids}
def S(sid, country, group, label, freq, unit, d, source, note):
    ps = sorted(d)
    return {"id": sid, "country": country, "group": group, "label": label, "freq": freq, "unit": unit, "periods": ps, "values": [d[p] for p in ps], "source": source, "note": note}
# ------------------------------------------------------------------ Chequia
CZ_SRC = {"name": "Czech Statistical Office (CSU), open dataset LES0104: Felling and salvage felling", "url": "https://data.csu.gov.cz/opendata/sady/LES0104", "license": "CSU open data (data.gov.cz): no copyright, no database right"}
CZ_MAP = [("5980J", "cz-felling-total", "felling", "Total felling"), ("5981J", "cz-salvage-total", "salvage", "Salvage (incidental) felling, total"),
          ("5981J1", "cz-salvage-natural", "salvage", "Salvage felling: natural causes (wind, snow, drought)"), ("5981J2", "cz-salvage-insect", "salvage", "Salvage felling: insects (bark beetle)"),
          ("5981J3", "cz-salvage-emissions", "salvage", "Salvage felling: air pollution"), ("5981J4", "cz-salvage-other", "salvage", "Salvage felling: other causes")]
def adapter_cz():
    raw = http("https://data.csu.gov.cz/opendata/sady/LES0104/distribuce/csv").decode("utf-8-sig")
    got = {}
    for r in csv.DictReader(io.StringIO(raw)):
        if r["UZ02HZ.KRAJ"] != "": continue                          # solo el total nacional
        try: got[(r["IndicatorType"], r["Roky"])] = float(r["Hodnota"])
        except ValueError: continue
    out = []
    for code, sid, grp, lab in CZ_MAP:
        d = {y: round(v) for (c, y), v in got.items() if c == code}
        if len(d) < 5: continue
        out.append(S(sid, "CZ", grp, lab, "A", "m3 (sin corteza)", d, CZ_SRC, "Tala en bosques de Chequia en m3 sin corteza; la fortuita (de saneamiento) es la que sigue a plagas, tormentas y sequia."))
    if not any(s["id"] == "cz-salvage-insect" for s in out): raise RuntimeError("falta la tala por insectos")
    return out + adapter_cz_more()

CZ_SRC1 = dict(CZ_SRC, name="Czech Statistical Office (CSU), open dataset LES0101: Forest ownership and categories", url="https://data.csu.gov.cz/opendata/sady/LES0101")
CZ_SRC2 = dict(CZ_SRC, name="Czech Statistical Office (CSU), open dataset LES0102: Forestry by region", url="https://data.csu.gov.cz/opendata/sady/LES0102")
CZ_SRC3 = dict(CZ_SRC, name="Czech Statistical Office (CSU), open dataset LES0103: Clearings and afforestation", url="https://data.csu.gov.cz/opendata/sady/LES0103")
CZ_OWN = [("4582J", "cz-forestland-total", "Forest land, total"), ("5873J01", "cz-forestland-state", "Forest land: state forests"), ("5873J02", "cz-forestland-municipal", "Forest land: municipal forests"),
          ("5873J03", "cz-forestland-private", "Forest land: private forests"), ("5873J024", "cz-forestland-other", "Forest land: other owners")]
CZ_CLR = [("6501R", "cz-clearings-area", "Clearings (felled, not yet regenerated), area at 31 December"), ("5875T", "cz-clearings-new-felling", "New clearings: from felling"),
          ("5875ZI", "cz-clearings-new-natural", "New clearings: from natural disasters"), ("5883J", "cz-afforestation", "Afforestation, total")]
CZ_REG = [("4582LES", "forestland", "area", "Forest land", "ha"), ("5980J", "felling-total", "felling", "Total felling", "m3 (sin corteza)"), ("5981J", "salvage-total", "salvage", "Salvage (incidental) felling, total", "m3 (sin corteza)"),
          ("5981J1", "salvage-natural", "salvage", "Salvage felling: natural causes (wind, snow, drought)", "m3 (sin corteza)"), ("5981J2", "salvage-insect", "salvage", "Salvage felling: insects (bark beetle)", "m3 (sin corteza)"),
          ("5883J", "afforestation", "regen", "Afforestation, total", "ha")]
def _csu(dsid): return list(csv.DictReader(io.StringIO(http("https://data.csu.gov.cz/opendata/sady/%s/distribuce/csv" % dsid).decode("utf-8-sig"))))
def adapter_cz_more():
    out = []
    r = _csu("LES0101"); got = {}
    for x in r:
        try: got[(x["IndicatorType"], x["Roky"])] = float(x["Hodnota"])
        except ValueError: pass
    for code, sid, lab in CZ_OWN:
        d = {y: round(v) for (c, y), v in got.items() if c == code}
        if len(d) < 10: raise RuntimeError("LES0101 %s con %d años" % (code, len(d)))
        out.append(S(sid, "CZ", "area", lab, "A", "ha", d, CZ_SRC1, "Superficie de terreno forestal de Chequia a 31 de diciembre, por tipo de propietario (estimación cualificada del CSU para la propiedad)."))
    r = _csu("LES0103"); got = {}
    for x in r:
        try: got[(x["IndicatorType"], x["Roky"])] = float(x["Hodnota"])
        except ValueError: pass
    for code, sid, lab in CZ_CLR:
        d = {y: round(v) for (c, y), v in got.items() if c == code}
        if len(d) < 10: raise RuntimeError("LES0103 %s con %d años" % (code, len(d)))
        out.append(S(sid, "CZ", "clearing" if "clearings" in sid else "regen", lab, "A", "ha", d, CZ_SRC3, "Claros (superficie talada aun sin regenerar) y repoblación en los bosques de Chequia, en hectareas."))
    r = _csu("LES0102"); acc = {}; names = {}
    for x in r:
        k = x["UZ02HZ.KRAJ"]
        if not k: continue
        try: acc.setdefault((k, x["IndicatorType"]), {})[x["Roky"]] = round(float(x["Hodnota"]))
        except ValueError: pass
        names[k] = x["Území-Kraj"]
    for k in sorted(names):
        for code, tag, grp, lab, unit in CZ_REG:
            d = acc.get((k, code), {})
            if len(d) < 5: raise RuntimeError("LES0102 %s %s con %d años" % (k, code, len(d)))
            o = S("cz-%s-%s" % (tag, k), "CZ", grp, lab, "A", unit, d, CZ_SRC2, "Dato regional de Chequia (kraj); Praga se publica junto con la region de Bohemia Central.")
            o["region"] = names[k]; out.append(o)
    if len(names) < 12: raise RuntimeError("LES0102: %d regiones" % len(names))
    return out
# ------------------------------------------------------------------ Suecia
SKS = "https://pxweb.skogsstyrelsen.se/api/v1/sv/Skogsstyrelsens%20statistikdatabas/"
SE_SRC = {"name": "Skogsstyrelsen (Swedish Forest Agency), statistical database", "url": "https://pxweb.skogsstyrelsen.se/pxweb/sv/Skogsstyrelsens%20statistikdatabas/", "license": "CC0 (Skogsstyrelsen)"}
def se_year(label):
    m = re.match(r"(\d{4})(.*)", label); return (m.group(1), m.group(2).strip()) if m else (None, None)
def adapter_se():
    out = []
    # tormenta
    d = jpost(SKS + "Avverkning/JO0312_07.px", [{"code": "År", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); y = {lab["År"][k[0]]: v for k, v in c.items()}
    y = {k: v for k, v in y.items() if re.fullmatch(r"\d{4}", k) and k >= "1990"}
    if len(y) < 10: raise RuntimeError("tormenta: pocos años")
    out.append(S("se-storm-felled", "SE", "storm", "Storm-felled forest (volume of trees blown down)", "A", "milj. m3sk", y, SE_SRC, "Volumen de bosque derribado por tormentas en el año, millones de m3sk (m3 de volumen de bosque en pie); el dato se publica solo en los años con tormentas notables."))
    # cortas
    d = jpost(SKS + "Avverkning/JO0312_01.px", [{"code": "Sortiment av stamved", "selection": {"filter": "all", "values": ["*"]}}, {"code": "År", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d)
    want = {"Bruttoavverkning, milj. m³sk": ("se-felling-gross", "Gross felling", "milj. m3sk"), "Summa sågtimmer, milj. m³f ub": ("se-felling-sawlogs", "Felling: sawlogs", "milj. m3fub"),
            "Summa massaved, milj. m³f ub": ("se-felling-pulpwood", "Felling: pulpwood", "milj. m3fub"), "Brännved av stamvirke, milj. m³f ub": ("se-felling-fuelwood", "Felling: fuelwood", "milj. m3fub"),
            "Summa nettoavverkning, milj. m³f ub": ("se-felling-net", "Net felling", "milj. m3fub")}
    rows = {}
    for k, v in c.items():
        sort = lab["Sortiment av stamved"][k[0]]; yr = lab["År"][k[1]]
        if sort in want and re.fullmatch(r"\d{4}( Prel\.)?", yr): rows.setdefault(sort, {})[yr[:4]] = v      # preliminar incluido, el prognostico no
    for sort, (sid, name, unit) in want.items():
        dd = {k: v for k, v in rows.get(sort, {}).items() if k >= "1990"}
        if len(dd) < 20: raise RuntimeError("cortas: %s con %d años" % (sort, len(dd)))
        out.append(S(sid, "SE", "felling", name, "A", unit, dd, SE_SRC, "Cortas de madera de Suecia; el ultimo año es preliminar. m3sk = volumen de bosque en pie; m3fub = volumen de troncos sin corteza."))
    # escarabajo: media semanal de las trampas
    d = jpost(SKS + "Granbarkborresv%C3%A4rmning/01_antal_granbarkborrar_%20nyny.px", [{"code": "Fällans plats", "selection": {"filter": "all", "values": ["*"]}}, {"code": "År", "selection": {"filter": "all", "values": ["*"]}}, {"code": "Vecka", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); acc = {}
    for k, v in c.items():
        yr = lab["År"][k[1]]; wk = lab["Vecka"][k[2]]
        m = re.search(r"(\d+)", wk)
        if not m or not re.fullmatch(r"\d{4}", yr): continue
        acc.setdefault("%s-W%02d" % (yr, int(m.group(1))), []).append(float(v))
    wk = {p: round(sum(v) / len(v), 1) for p, v in acc.items() if len(v) >= 5}                 # al menos 5 trampas con dato
    if len(wk) < 50: raise RuntimeError("escarabajo: %d semanas" % len(wk))
    out.append(S("se-bark-beetle-trap-mean", "SE", "beetle", "Spruce bark beetle (Ips typographus): mean catch per pheromone trap", "W", "escarabajos por trampa", wk,
                 dict(SE_SRC, name="Skogsstyrelsen, Granbarkborresvärmning 01: average number of spruce bark beetles per trap"), "Media entre las trampas con dato de cada semana (cálculo propio sobre las medias por trampa de Skogsstyrelsen); semanas de vuelo, de abril a agosto, desde 2016."))
    # cortas brutas por provincia (län), 4 años
    d = jpost(SKS + "Avverkning/JO0312_02a.px", [{"code": "År", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); reg = {}
    for k, v in c.items():
        rg = lab["Region"][k[0]]; yr = lab["År"][k[1]]
        m = re.match(r"(\d{2}) (.+)$", rg)
        if not m or m.group(1) == "00" or not re.fullmatch(r"\d{4}( Prel\.)?", yr): continue
        reg.setdefault((m.group(1), m.group(2)), {})[yr[:4]] = round(float(v), 3)
    if len(reg) < 20: raise RuntimeError("regiones suecas: %d" % len(reg))
    for (code, name), dd in sorted(reg.items()):
        if len(dd) < 3: continue
        o = S("se-felling-gross-%s" % code, "SE", "felling", "Gross felling", "A", "milj. m3sk", dd, dict(SE_SRC, name="Skogsstyrelsen, JO0312_02a: gross felling volume by region"), "Corta bruta por provincia (län) en millones de m3sk; el ultimo año es preliminar. La tabla solo cubre los ultimos años.")
        o["region"] = name; out.append(o)
    # historia mas larga: media de 3 años por provincia (1996-2020), todas las categorias de propietario
    d = jpost(SKS + "Avverkning/JO0312_02b.px", [{"code": "Ägarkategori", "selection": {"filter": "item", "values": ["2"]}}, {"code": "Region", "selection": {"filter": "all", "values": ["*"]}}, {"code": "År (3-årsmedelvärde)", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); reg3 = {}; dim = [i for i in d["id"] if i.startswith("År")][0]
    for k, v in c.items():
        rg = lab["Region"][k[d["id"].index("Region")]]; yr = lab[dim][k[d["id"].index(dim)]]
        m = re.match(r"(\d{2}) (.+)$", rg)
        if not m or m.group(1) == "00": continue
        reg3.setdefault((m.group(1), m.group(2)), {})[yr] = round(float(v))
    if len(reg3) < 20: raise RuntimeError("regiones suecas 02b: %d" % len(reg3))
    names3 = {code: name for (code, name) in reg3}
    for o in out:                                                        # mismo nombre de provincia en las dos tablas
        if o["id"].startswith("se-felling-gross-") and o.get("region") and o["id"][-2:] in names3: o["region"] = names3[o["id"][-2:]]
    for (code, name), dd in sorted(reg3.items()):
        if len(dd) < 10: continue
        o = S("se-felling3y-%s" % code, "SE", "felling", "Gross felling, 3-year mean (1996-2020)", "A", "1000 m3sk", dd, dict(SE_SRC, name="Skogsstyrelsen, JO0312_02b: gross felling volume by region and owner category (3-year mean)"), "Corta bruta por provincia, media movil de 3 años (miles de m3sk), todas las categorias de propietario; la serie anual de 2022-2025 es otra tabla y no es comparable punto a punto.")
        o["region"] = name; out.append(o)
    return out
# ------------------------------------------------------------------ Estonia
EE_URL = "https://andmed.stat.ee/api/v1/en/stat/keskkond/loodusvarad-ja-nende-kasutamine/metsavaru/KK513.px"
EE_SRC = {"name": "Statistics Estonia, KK513: Destroyed forest stands by county", "url": "https://andmed.stat.ee/en/stat/keskkond__loodusvarad-ja-nende-kasutamine__metsavaru/KK513", "license": "CC BY-SA 4.0 (Statistics Estonia)"}
EE_MAP = {"Total": ("ee-destroyed-total", "all", "Destroyed forest stands, total"), "Insect pests": ("ee-destroyed-insects", "beetle", "Destroyed stands: insect pests"),
          "Windfall": ("ee-destroyed-wind", "storm", "Destroyed stands: windfall"), "Forest fires": ("ee-destroyed-fire", "fire", "Destroyed stands: forest fires"),
          "Forest diseases": ("ee-destroyed-disease", "disease", "Destroyed stands: forest diseases"), "Game damages": ("ee-destroyed-game", "other", "Destroyed stands: game damage"),
          "Unfavourable water conditions": ("ee-destroyed-water", "other", "Destroyed stands: unfavourable water conditions")}
def adapter_ee():
    d = jpost(EE_URL, [{"code": "Maakond", "selection": {"filter": "item", "values": ["00"]}}, {"code": "Aasta", "selection": {"filter": "all", "values": ["*"]}}, {"code": "Hukkumise põhjus", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); rows = {}
    for k, v in c.items():
        reason = lab["Hukkumise põhjus"][k[2]]; yr = lab["Aasta"][k[1]]
        if reason in EE_MAP: rows.setdefault(reason, {})[yr] = round(float(v), 1)
    out = []
    for reason, (sid, grp, name) in EE_MAP.items():
        dd = rows.get(reason, {})
        if len(dd) < 5: raise RuntimeError("Estonia %s con %d años" % (reason, len(dd)))
        out.append(S(sid, "EE", grp, name, "A", "ha", dd, EE_SRC, "Superficie de rodales forestales destruidos en el año, por causa; las causas con cero años sin dato no se rellenan."))
    return out + adapter_ee_more()
EE_URL2 = EE_URL.replace("KK513", "KK514")
EE_SRC2 = dict(EE_SRC, name="Statistics Estonia, KK514: Damaged forest stands by county, 31 December", url="https://andmed.stat.ee/en/stat/keskkond__loodusvarad-ja-nende-kasutamine__metsavaru/KK514")
EE_MAP2 = {"Total": ("ee-damaged-total", "all", "Damaged forest stands, total"), "Needle pests": ("ee-damaged-needle", "beetle", "Damaged stands: needle pests"), "Leaf pests": ("ee-damaged-leaf", "beetle", "Damaged stands: leaf pests"),
           "Stem pests": ("ee-damaged-stem", "beetle", "Damaged stands: stem pests"), "Root rot": ("ee-damaged-rootrot", "disease", "Damaged stands: root rot"), "Unfavourable weather conditions": ("ee-damaged-weather", "storm", "Damaged stands: unfavourable weather"),
           "Windfall": ("ee-damaged-wind", "storm", "Damaged stands: windfall"), "Forest fires": ("ee-damaged-fire", "fire", "Damaged stands: forest fires"), "Mechanic damages caused by games": ("ee-damaged-game", "other", "Damaged stands: game damage"),
           "Unfavourable water conditions": ("ee-damaged-water", "other", "Damaged stands: unfavourable water conditions"), "Human activities": ("ee-damaged-human", "other", "Damaged stands: human activities")}
def adapter_ee_more():
    d = jpost(EE_URL2, [{"code": "Maakond", "selection": {"filter": "item", "values": ["00"]}}, {"code": "Aasta", "selection": {"filter": "all", "values": ["*"]}}, {"code": "Kahjustuse põhjus", "selection": {"filter": "all", "values": ["*"]}}])
    c, lab = cells(d); rows = {}
    for k, v in c.items():
        reason = lab["Kahjustuse põhjus"][k[2]]; yr = lab["Aasta"][k[1]]
        if reason in EE_MAP2: rows.setdefault(reason, {})[yr] = round(float(v), 1)
    out = []
    for reason, (sid, grp, name) in EE_MAP2.items():
        dd = rows.get(reason, {})
        if dd and int(max(dd)) < max(int(y) for r in rows.values() for y in r) - 2: continue          # causa dejada de publicar
        if len(dd) < 5: raise RuntimeError("Estonia KK514 %s con %d años" % (reason, len(dd)))
        out.append(S(sid, "EE", grp, name, "A", "ha", dd, EE_SRC2, "Superficie de rodales forestales dañados (no destruidos) a 31 de diciembre, por causa."))
    return out
# ------------------------------------------------------------------ Hungria
HU_SRC = {"name": "Hungarian Central Statistical Office (KSH), STADAT 15.1.1.12: Forest damage by damage group", "url": "https://www.ksh.hu/stadat_files/kor/en/kor0010.html", "license": "CC BY 4.0 (KSH)"}
HU_MAP = {"Altogether": ("hu-damage-total", "all", "Forest damage, all groups"), "Insect damages": ("hu-damage-insects", "beetle", "Forest damage: insects"),
          "Abiotic damages": ("hu-damage-abiotic", "storm", "Forest damage: abiotic (weather, drought, fire)"), "Vertebrate damages": ("hu-damage-vertebrates", "other", "Forest damage: vertebrates (game)"),
          "Pathogen damages": ("hu-damage-pathogens", "disease", "Forest damage: pathogens")}
def adapter_hu():
    raw = http("https://www.ksh.hu/stadat_files/kor/en/kor0010.csv").decode("iso-8859-2")
    rows = list(csv.reader(io.StringIO(raw), delimiter=";"))
    hdr = next(r for r in rows if r and r[0].strip() == "Denomination")
    cols = {name.strip(): i for i, name in enumerate(hdr)}
    year = None; unit_ha = False; res = {}
    for r in rows:
        if not r or not r[0].strip(): continue
        a = r[0].strip()
        if re.fullmatch(r"\d{4}", a): year = a; unit_ha = False; continue
        if a == "Hectare": unit_ha = True; continue
        if a == "Percent": unit_ha = False; continue
        if year and unit_ha and a == "Total":
            for name, (sid, grp, lab) in HU_MAP.items():
                if name not in cols: continue
                s = r[cols[name]].strip().replace(" ", "").replace("\xa0", "")
                if s.isdigit(): res.setdefault(name, {})[year] = int(s)
            unit_ha = False
    out = []
    for name, (sid, grp, lab) in HU_MAP.items():
        dd = res.get(name, {})
        if len(dd) < 4: raise RuntimeError("Hungria %s con %d años" % (name, len(dd)))
        out.append(S(sid, "HU", grp, lab, "A", "ha", dd, HU_SRC, "Superficie de bosque dañada en el año (fila «Total» de la tabla en hectareas), por grupo de daño."))
    return out + adapter_hu_more()
HU_SRC2 = {"name": "Hungarian Central Statistical Office (KSH), STADAT 15.1.1.8: Harvesting of wood on forest land by species group", "url": "https://www.ksh.hu/stadat_files/kor/en/kor0006.html", "license": "CC BY 4.0 (KSH)"}
HU_HARV = {"Total": ("hu-harvest-total", "Felling: total, all species", "ezer m3"), "Oaks": ("hu-harvest-oaks", "Felling: oaks", "ezer m3"), "Turkey oak": ("hu-harvest-turkey-oak", "Felling: Turkey oak", "ezer m3"),
           "Beech": ("hu-harvest-beech", "Felling: beech", "ezer m3"), "Hornbeam": ("hu-harvest-hornbeam", "Felling: hornbeam", "ezer m3"), "Black locust": ("hu-harvest-locust", "Felling: black locust", "ezer m3"),
           "Improved poplars": ("hu-harvest-poplar", "Felling: improved poplars", "ezer m3"), "Pines": ("hu-harvest-pines", "Felling: pines", "ezer m3"), "Wood harvesting ratio, %": ("hu-harvest-ratio", "Felling as a share of increment (harvesting ratio)", "%")}
def adapter_hu_more():
    raw = http("https://www.ksh.hu/stadat_files/kor/en/kor0006.csv").decode("iso-8859-2")
    rows = list(csv.reader(io.StringIO(raw), delimiter=";"))
    hdr = next(r for r in rows if r and r[0].strip() == "Denomination"); yrs = [h.strip() for h in hdr]
    out = []
    for r in rows:
        if not r or r[0].strip() not in HU_HARV: continue
        sid, lab, unit = HU_HARV[r[0].strip()]; d = {}
        for y, v in zip(yrs[1:], r[1:]):
            v = v.strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
            if re.fullmatch(r"\d{4}", y) and re.fullmatch(r"\d+(\.\d+)?", v): d[y] = float(v) if "." in v else int(v)
        if len(d) < 10: raise RuntimeError("Hungria kor0006 %s con %d años" % (sid, len(d)))
        out.append(S(sid, "HU", "ratio" if unit == "%" else "felling", lab, "A", unit, d, HU_SRC2, "Cortas en terreno forestal de Hungria, miles de m3 (ezer m3) por grupo de especies; la ratio compara la corta con el crecimiento."))
    if len(out) != len(HU_HARV): raise RuntimeError("Hungria kor0006: faltan filas")
    return out
ADAPTERS = [("CZ", adapter_cz), ("SE", adapter_se), ("EE", adapter_ee), ("HU", adapter_hu)]
def main():
    try: old = json.loads(OUT.read_text(encoding="utf-8")).get("series", [])
    except Exception: old = []
    series = []; fails = []
    for cc, fn in ADAPTERS:
        try:
            r = fn(); series += r; print(cc, "OK", len(r), "series;", ", ".join("%s %s" % (s["id"].split("-", 1)[1], s["periods"][-1]) for s in r)[:200])
        except Exception as e:
            fails.append(cc); print("FALLO", cc, str(e)[:200]); series += [s for s in old if s["country"] == cc]
    if len(fails) > MAX_FAIL or not series:
        print("ERROR: fallan %d paises; no se toca el fichero" % len(fails)); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "groups": ["felling", "salvage", "storm", "beetle", "disease", "fire", "all", "other", "area", "regen", "clearing", "ratio"], "series": series}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("forest-damage.json", OUT.stat().st_size, "bytes;", len(series), "series; fallos:", len(fails)); return 0
if __name__ == "__main__": sys.exit(main())

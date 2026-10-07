#!/usr/bin/env python3
"""Datos agrarios por region (Espana, Francia, Italia, Alemania, Paises Bajos, Austria, Belgica, Dinamarca y Polonia) desde Eurostat, para las paginas de region.
Salida: data/eu-regions-es.json, -fr.json, -it.json, -de.json, -nl.json, -at.json, -be.json, -dk.json, -pl.json (una region por comunidad, region, provincia o Land).
Datasets (todos por region NUTS, reutilizacion con cita de la fuente):
  aact_eaa01_r  cuentas economicas de la agricultura (millones EUR, precios corrientes)
  apro_cpshr    cultivos: superficie y produccion
  apro_mt_ls_r  efectivos ganaderos (miles de cabezas)
  agr_r_milkpr  leche de vaca en granja (miles de t)
  ef_m_farmleg  estructura de las explotaciones (censo agrario 2010-2023): explotaciones, SAU, UGM, UTA, produccion estandar
Una region se calcula asi: si Eurostat publica el codigo NUTS de la region, se usa tal cual; si no, se suman sus NUTS 2 y solo cuando estan todos (nunca se rellena un hueco).
Uso: python3 scripts/update-eurostat-regions.py [--outdir data]"""
import datetime, json, sys, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
Y0 = 2000
# region -> (NUTS de la propia region o None, [NUTS 2 hijos])
ES = {"GA": ("ES11", ["ES11"]), "AS": ("ES12", ["ES12"]), "CB": ("ES13", ["ES13"]), "PV": ("ES21", ["ES21"]), "NC": ("ES22", ["ES22"]), "RI": ("ES23", ["ES23"]), "AR": ("ES24", ["ES24"]), "MD": ("ES30", ["ES30"]), "CL": ("ES41", ["ES41"]), "CM": ("ES42", ["ES42"]), "EX": ("ES43", ["ES43"]), "CT": ("ES51", ["ES51"]), "VC": ("ES52", ["ES52"]), "IB": ("ES53", ["ES53"]), "AN": ("ES61", ["ES61"]), "MC": ("ES62", ["ES62"]), "CN": ("ES70", ["ES70"])}
FR = {"IDF": ("FR1", ["FR10"]), "CVL": ("FRB", ["FRB0"]), "BFC": ("FRC", ["FRC1", "FRC2"]), "NOR": ("FRD", ["FRD1", "FRD2"]), "HDF": ("FRE", ["FRE1", "FRE2"]), "GES": ("FRF", ["FRF1", "FRF2", "FRF3"]), "PDL": ("FRG", ["FRG0"]), "BRE": ("FRH", ["FRH0"]), "NAQ": ("FRI", ["FRI1", "FRI2", "FRI3"]), "OCC": ("FRJ", ["FRJ1", "FRJ2"]), "ARA": ("FRK", ["FRK1", "FRK2"]), "PAC": ("FRL", ["FRL0"]), "COR": ("FRM", ["FRM0"])}
IT = {"PIE": ("ITC1", ["ITC1"]), "VDA": ("ITC2", ["ITC2"]), "LIG": ("ITC3", ["ITC3"]), "LOM": ("ITC4", ["ITC4"]), "ABR": ("ITF1", ["ITF1"]), "MOL": ("ITF2", ["ITF2"]), "CAM": ("ITF3", ["ITF3"]), "PUG": ("ITF4", ["ITF4"]), "BAS": ("ITF5", ["ITF5"]), "CAL": ("ITF6", ["ITF6"]), "SIC": ("ITG1", ["ITG1"]), "SAR": ("ITG2", ["ITG2"]), "TAA": (None, ["ITH1", "ITH2"]), "VEN": ("ITH3", ["ITH3"]), "FVG": ("ITH4", ["ITH4"]), "EMR": ("ITH5", ["ITH5"]), "TOS": ("ITI1", ["ITI1"]), "UMB": ("ITI2", ["ITI2"]), "MAR": ("ITI3", ["ITI3"]), "LAZ": ("ITI4", ["ITI4"])}
DE = {"BW": ("DE1", ["DE11", "DE12", "DE13", "DE14"]), "BY": ("DE2", ["DE21", "DE22", "DE23", "DE24", "DE25", "DE26", "DE27"]), "BE": ("DE3", ["DE30"]), "BB": ("DE4", ["DE40"]), "HB": ("DE5", ["DE50"]), "HH": ("DE6", ["DE60"]), "HE": ("DE7", ["DE71", "DE72", "DE73"]), "MV": ("DE8", ["DE80"]), "NI": ("DE9", ["DE91", "DE92", "DE93", "DE94"]), "NW": ("DEA", ["DEA1", "DEA2", "DEA3", "DEA4", "DEA5"]), "RP": ("DEB", ["DEB1", "DEB2", "DEB3"]), "SL": ("DEC", ["DEC0"]), "SN": ("DED", ["DED2", "DED4", "DED5"]), "ST": ("DEE", ["DEE0"]), "SH": ("DEF", ["DEF0"]), "TH": ("DEG", ["DEG0"])}
NL = {"GR": ("NL11", ["NL11"]), "FR": ("NL12", ["NL12"]), "DR": ("NL13", ["NL13"]), "OV": ("NL21", ["NL21"]), "GE": ("NL22", ["NL22"]), "FL": ("NL23", ["NL23"]), "UT": ("NL31", ["NL31"]), "NH": ("NL32", ["NL32"]), "ZH": ("NL33", ["NL33"]), "ZE": ("NL34", ["NL34"]), "NB": ("NL41", ["NL41"]), "LI": ("NL42", ["NL42"])}
AT = {"B": ("AT11", ["AT11"]), "NO": ("AT12", ["AT12"]), "W": ("AT13", ["AT13"]), "K": ("AT21", ["AT21"]), "ST": ("AT22", ["AT22"]), "OO": ("AT31", ["AT31"]), "S": ("AT32", ["AT32"]), "T": ("AT33", ["AT33"]), "V": ("AT34", ["AT34"])}
# Belgica: 11 provincias (NUTS 2; Bruselas-Capital es una region propia). Dinamarca: 5 regiones (NUTS 2).
BE = {"BRU": ("BE10", ["BE10"]), "VAN": ("BE21", ["BE21"]), "VLI": ("BE22", ["BE22"]), "VOV": ("BE23", ["BE23"]), "VBR": ("BE24", ["BE24"]), "VWV": ("BE25", ["BE25"]),
      "WBR": ("BE31", ["BE31"]), "WHT": ("BE32", ["BE32"]), "WLG": ("BE33", ["BE33"]), "WLX": ("BE34", ["BE34"]), "WNA": ("BE35", ["BE35"])}
DK = {"HOV": ("DK01", ["DK01"]), "SJA": ("DK02", ["DK02"]), "SYD": ("DK03", ["DK03"]), "MID": ("DK04", ["DK04"]), "NJY": ("DK05", ["DK05"])}
# Polonia: 16 voivodias. Mazowieckie = PL9 (NUTS 1), que Eurostat parte en dos NUTS 2 (PL91 Warszawski stoleczny y PL92 Mazowiecki regionalny): se usa PL9 o, si falta, la suma de ambos.
PL = {"MA": ("PL21", ["PL21"]), "SL": ("PL22", ["PL22"]), "WP": ("PL41", ["PL41"]), "ZP": ("PL42", ["PL42"]), "LB": ("PL43", ["PL43"]), "DS": ("PL51", ["PL51"]), "OP": ("PL52", ["PL52"]), "KP": ("PL61", ["PL61"]),
      "WN": ("PL62", ["PL62"]), "PM": ("PL63", ["PL63"]), "LD": ("PL71", ["PL71"]), "SK": ("PL72", ["PL72"]), "LU": ("PL81", ["PL81"]), "PK": ("PL82", ["PL82"]), "PD": ("PL84", ["PL84"]), "MZ": ("PL9", ["PL91", "PL92"])}
# Puntos de la fuente descartados por error evidente. Gelderland y Flevoland (NL) tienen la produccion de patata de 2022 intercambiada en Eurostat
# (807 y 255 mil t frente a ~260 y ~790 en los demas anios; la suma de ambas es normal): rendimiento de 128 y 14 t/ha. Se descarta la produccion de ese anio, no se corrige.
EXCLUDE = {("NL", "GE", "R1000", 2022), ("NL", "FL", "R1000", 2022)}
COUNTRIES = {"es": ES, "fr": FR, "it": IT, "de": DE, "nl": NL, "at": AT, "be": BE, "dk": DK, "pl": PL}
EAA = ["AM180000", "AM160000", "AM100000", "AM110000", "AM120000", "AM010000", "AM020000", "AM030000", "AM040000", "AM050000", "AM060000", "AM064000", "AM065000", "AM070000", "AM080000", "AM111000", "AM112000", "AM114000", "AM115000", "AM121000", "AM122000",
       "AM200000", "AM206000", "AM203000", "AM202000", "AM260000", "AM280000", "AM310000", "AM320000", "AM330000", "AM370000"]
CROPS = ["UAA", "ARA", "J0000", "C0000", "C1110", "C1120", "C1200", "C1300", "C1400", "C1500", "R1000", "R2000", "I1110", "I1120", "I1130", "P0000", "G3000", "F0000", "T0000", "W1000", "O1000"]
STRUC = ["AR_THS_HA", "MAR_THS_HA", "HPRD_HUMD_EU_THS_T"]
ANIMALS = ["A2000", "A2300F", "A2300G", "A3100", "A4100", "A4200"]
FARMTYPES = ["TOTAL", "FT1", "FT2", "FT3", "FT4", "FT5", "FT6", "FT7", "FT8", "FT9"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch(ds, **flt):
    pairs = [("lang", "EN"), ("format", "JSON")]
    for k, v in flt.items():
        for x in (v if isinstance(v, (list, tuple)) else [v]): pairs.append((k, x))
    url = API + ds + "?" + urllib.parse.urlencode(pairs)
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DehesaIndex"}), timeout=180) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None  # seleccion sin datos
            last = e
        except Exception as e: last = e
    raise RuntimeError("%s: %s" % (ds, last))
def cells(j):
    """(dict dimension->codigo, valor) de una respuesta JSON-stat."""
    if not j or not j.get("value"): return
    ids, size = j["id"], j["size"]; cat = {}
    for d in ids:
        c = j["dimension"][d]["category"]["index"]
        cat[d] = [k for k, _ in sorted(c.items(), key=lambda kv: kv[1])] if isinstance(c, dict) else list(c)
    for key, v in j["value"].items():
        i = int(key); co = {}
        for d, s in zip(reversed(ids), reversed(size)): co[d] = cat[d][i % s]; i //= s
        if v is not None: yield co, float(v)
def collect(j, keyf):
    """{(clave, geo): {anio: valor}}"""
    out = {}
    for co, v in cells(j):
        try: y = int(co["time"])
        except Exception: continue
        out.setdefault((keyf(co), co["geo"]), {})[y] = v
    return out
def region_series(table, key, spec, ymin=Y0):
    """Serie de una region: NUTS propio si existe; si no, suma de los NUTS 2 solo cuando estan todos ese anio."""
    own, kids = spec; s = table.get((key, own)) if own else None
    res = {}
    if s:
        for y, v in s.items():
            if y >= ymin: res[y] = v
    ch = [table.get((key, k)) for k in kids]
    if all(ch):
        for y in set.intersection(*[set(c) for c in ch]):
            if y >= ymin and y not in res: res[y] = sum(c[y] for c in ch)
    return [[y, round(res[y], 3)] for y in sorted(res)]
def geos(reg):
    g = set()
    for own, kids in reg.values():
        if own: g.add(own)
        g.update(kids)
    return sorted(g)
def build(cc, reg):
    G = geos(reg); out = {r: {"nuts": ([s[0]] if s[0] else []) + s[1]} for r, s in reg.items()}
    j = fetch("aact_eaa01_r", am_item=EAA, indic_agr="PRD_BP", unit="MIO_EUR", geo=G); t = collect(j, lambda c: c["am_item"])
    for r, s in reg.items():
        for it in EAA:
            p = region_series(t, it, s)
            if p: out[r].setdefault("eaa", {})[it] = p
    j = fetch("apro_cpshr", crops=CROPS, strucpro=STRUC, geo=G); t = collect(j, lambda c: (c["crops"], c["strucpro"]))
    for r, s in reg.items():
        for cr in CROPS:
            a = region_series(t, (cr, "AR_THS_HA"), s) or region_series(t, (cr, "MAR_THS_HA"), s); pr = region_series(t, (cr, "HPRD_HUMD_EU_THS_T"), s)
            if pr and (cc.upper(), r, cr) in {x[:3] for x in EXCLUDE}:
                n0 = len(pr); pr = [q for q in pr if (cc.upper(), r, cr, q[0]) not in EXCLUDE]
                if len(pr) != n0: log(cc, r, cr, "produccion descartada por error evidente de la fuente")
            if a or pr: out[r].setdefault("crops", {})[cr] = {k: v for k, v in (("area", a), ("prod", pr)) if v}
    j = fetch("apro_mt_ls_r", animals=ANIMALS, unit="THS_HD", geo=G); t = collect(j, lambda c: c["animals"])
    for r, s in reg.items():
        for an in ANIMALS:
            p = region_series(t, an, s)
            if p: out[r].setdefault("animals", {})[an] = p
    j = fetch("agr_r_milkpr", milkitem="PRO", dairyprod="D1110A", geo=G); t = collect(j, lambda c: "milk")
    for r, s in reg.items():
        p = region_series(t, "milk", s)
        if p: out[r]["milk"] = p
    # estructura: solo hay NUTS 2 (se suman los hijos)
    kids = sorted({k for s in reg.values() for k in s[1]})
    j = fetch("ef_m_farmleg", statinfo="TOTAL", leg_form="TOTAL", so_eur="TOTAL", uaarea="TOTAL", farmtype=FARMTYPES, unit=["HLD", "HA", "EUR", "LSU", "AWU"], geo=kids)
    t = collect(j, lambda c: (c["farmtype"], c["unit"]))
    for r, s in reg.items():
        farms = {}
        for ft in FARMTYPES:
            for un in ("HLD", "HA", "EUR", "LSU", "AWU"):
                p = region_series(t, (ft, un), (None, s[1]), ymin=2000)
                for y, v in p: farms.setdefault(ft, {}).setdefault(str(y), {})[un] = v
        if farms.get("TOTAL"): out[r]["farms"] = farms
    for r in out:
        log(cc, r, {k: (len(v) if hasattr(v, "__len__") else 1) for k, v in out[r].items() if k != "nuts"})
    return out
def main():
    args = sys.argv[1:]; outdir = ROOT / "data"
    if "--outdir" in args: outdir = Path(args[args.index("--outdir") + 1])
    rc = 0
    only = args[args.index("--only") + 1].split(",") if "--only" in args else None
    for cc, reg in COUNTRIES.items():
        if only and cc not in only: continue
        try:
            out = build(cc, reg)
            ok = sum(1 for v in out.values() if v.get("eaa") and v.get("crops") and v.get("animals"))
            if ok < len(reg) * 0.9: raise ValueError("%s: solo %d de %d regiones con datos completos" % (cc.upper(), ok, len(reg)))
        except Exception as e:
            print("FALLO", cc, repr(e)); rc = 1; continue
        doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": cc.upper(),
               "source": {"name": "Eurostat (aact_eaa01_r, apro_cpshr, apro_mt_ls_r, agr_r_milkpr, ef_m_farmleg)", "url": "https://ec.europa.eu/eurostat/", "license": "Eurostat reuse policy (Commission Decision 2011/833/EU)"},
               "units": {"eaa": "EUR million, current prices", "area": "thousand ha", "prod": "thousand t", "animals": "thousand head", "milk": "thousand t", "HLD": "holdings", "HA": "ha", "EUR": "EUR standard output", "LSU": "livestock units", "AWU": "annual work units"},
               "regions": out}
        p = outdir / ("eu-regions-%s.json" % cc)
        p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); log("escrito", p.name, p.stat().st_size // 1024, "KB")
    (outdir / "eu-regions-log.txt").write_text("\n".join(LOG[-200:]) + "\n", encoding="utf-8")
    return rc
if __name__ == "__main__": sys.exit(main())

#!/usr/bin/env python3
"""Italia (ISTAT, SDMX) segunda tanda -> data/italy-istat/{crops,milk,agritourism,irrigation,comuni}.json

  crops:       101_1015 cultivos: superficie (ha) y produccion recolectada (q -> t) por region y cultivo, anual desde 2018 (los años recientes son estimaciones del ISTAT).
  crops-prov:  el mismo flujo 101_1015 por provincia (107): mismo formato que crops.json (+ la region de cada provincia y el total de Italia), para el selector «Provincias».
  milk:        101_959 leche y productos lacteos por region (anual, 2015-2020/21): produccion por producto y numero de establecimientos.
  agritourism: 101_965 agriturismo por region: explotaciones autorizadas, camas, plazas de acampada, mesas y habitaciones, por tipo de autorizacion y servicio.
  irrigation:  censo agrario 2020 (y encuesta SPA 2023 si existe): explotaciones y superficie irrigable/irrigada, por sistema, fuente y cultivo; Italia, regiones y provincias.
  comuni:      censo agrario 2020: explotaciones y superficie irrigable/irrigada por municipio.
Fuente ISTAT (CC BY 4.0). Nada se estima: celda ausente = null. Uso: python3 scripts/update-it-istat-2.py [--only crops,crops-prov,milk,...]"""
import argparse, csv, importlib.util, io, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("it1", ROOT / "scripts" / "update-it-istat.py"); I = importlib.util.module_from_spec(spec); spec.loader.exec_module(I)
log, http, B, ET, ln, XMLLANG = I.log, I.http, I.B, I.ET, I.ln, I.XMLLANG
REGIONS = "IT ITC1 ITC2 ITC3 ITC4 ITD3 ITD4 ITD5 ITDA ITD1 ITD2 ITE1 ITE2 ITE3 ITE4 ITF1 ITF2 ITF3 ITF4 ITF5 ITF6 ITG1 ITG2".split()
PROV = re.compile(r"^(IT[CDEFG]\d[0-9A-Z]|IT1\d\d)$")   # NUTS3 y los codigos IT108-IT111 de las provincias nuevas
COMUNE = re.compile(r"^\d{6}$")
REGION_OF = {"01": "ITC1", "02": "ITC2", "03": "ITC4", "04": "ITDA", "05": "ITD3", "06": "ITD4", "07": "ITC3", "08": "ITD5", "09": "ITE1", "10": "ITE2", "11": "ITE3", "12": "ITE4", "13": "ITF1", "14": "ITF2", "15": "ITF3", "16": "ITF4", "17": "ITF5", "18": "ITF6", "19": "ITG1", "20": "ITG2"}

PARENT = {}   # codigo -> codigo padre (jerarquia de la lista de territorios del ISTAT)
def struct(flow):
    """-> (dims en orden, {dim: {code: {'en','it'}}}); si falla, ([], {})."""
    try:
        root = ET.fromstring(http(B + "dataflow/IT1/" + flow + "/latest?references=descendants&detail=full", "application/vnd.sdmx.structure+xml;version=2.1"))
    except Exception as e:
        log("  estructura de", flow, "no disponible:", str(e)[:100]); return [], {}
    cls = {c.get("id"): c for c in root.iter() if ln(c) == "Codelist"}; dims = []; L = {}
    for d in root.iter():
        if ln(d) != "Dimension" or not d.get("position"): continue
        dims.append((int(d.get("position")), d.get("id")))
        ref = next((r for r in d.iter() if ln(r) == "Ref" and (r.get("id") or "").startswith("CL_")), None)
        cl = cls.get(ref.get("id")) if ref is not None else None
        if cl is None: continue
        m = {}
        for c in cl:
            if ln(c) != "Code": continue
            nm = {n.get(XMLLANG, ""): (n.text or "").strip() for n in c if ln(n) == "Name"}
            m[c.get("id")] = {"en": nm.get("en") or nm.get("it") or c.get("id"), "it": nm.get("it") or nm.get("en") or c.get("id")}
            for pa in c:
                if ln(pa) == "Parent":
                    for rf in pa:
                        if ln(rf) == "Ref" and rf.get("id"): PARENT[c.get("id")] = rf.get("id")
        L[d.get("id")] = m
    return [x[1] for x in sorted(dims)], L
def get(flow, dims, sel, q):
    sel = dict(sel, FREQ="A"); key = ".".join(sel.get(d, "") for d in dims)
    b = http(B + "data/" + flow + "/" + key + "?" + q + "&detail=dataonly", "application/vnd.sdmx.data+csv;version=1.0.0", t=280)
    return list(csv.DictReader(io.StringIO(b.decode("utf-8", "replace"))))
def getmany(flow, dims, sel, codes, q, n=20):
    """Reparte la lista de territorios en peticiones cortas (la URL no admite cientos de codigos)."""
    rows = []
    for k in range(0, len(codes), n):
        try: rows += get(flow, dims, dict(sel, REF_AREA="+".join(codes[k:k + n])), q)
        except RuntimeError as e:
            if "404" not in str(e): raise                       # 404 = ninguno de esos territorios tiene dato en este flujo
    return rows
def lab(L, dim, code): return I.lab(L, dim, code)
def axis(rows): return sorted(set(r["TIME_PERIOD"] for r in rows))
def area_info(L, a): return {"kind": I.area_kind(a), "label": lab(L, "REF_AREA", a)}
def put(store, code, a, ix, n, i, v):
    store.setdefault(code, {}).setdefault(a, [None] * n)[i] = v

def do_crops(out):
    flow = "101_1015"; dims, L = struct(flow)
    if not dims: raise RuntimeError("sin estructura")
    rows = get(flow, dims, {"REF_AREA": "+".join(REGIONS), "DATA_TYPE": "ART+HP_Q_EXT"}, "startPeriod=2018")
    ys = axis(rows); ix = {y: i for i, y in enumerate(ys)}; A = {}; area = {}; prod = {}
    for r in rows:
        v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
        if v is None or r["DESTINATION_WINEGRAPES"] != "ALL" or I.area_kind(a) not in ("country", "region"): continue
        A[a] = area_info(L, a); i = ix[r["TIME_PERIOD"]]
        if r["DATA_TYPE"] == "ART": put(area, r["TYPE_OF_CROP"], a, ix, len(ys), i, round(v))
        elif r["DATA_TYPE"] == "HP_Q_EXT": put(prod, r["TYPE_OF_CROP"], a, ix, len(ys), i, round(v / 10, 1))
    crops = {c: {"label": lab(L, "TYPE_OF_CROP", c), "a": area[c], "p": prod.get(c, {})} for c in sorted(area)}
    log("cultivos:", len(crops), "cultivos,", len(A), "areas,", ys[0], "->", ys[-1])
    I.write(out, "crops.json", I.head({"years": ys, "areas": A, "crops": crops, "units": {"a": "ha", "p": "t"},
        "note": "Coltivazioni ISTAT: superficie (ha) y produccion recolectada (ISTAT la publica en quintales; aqui en toneladas). Los años más recientes son estimaciones del ISTAT."}))

PROV_REGION_FALLBACK = {"IT108": "ITC4", "IT109": "ITI3", "IT110": "ITF4", "IT111": "ITG2"}   # provincias nuevas (Monza, Fermo, Barletta-Andria-Trani, Sud Sardegna): sin prefijo de region en el codigo
TN_BZ = ("ITD1", "ITD2")
def prov_region(a):
    p = PARENT.get(a); r = p if p and len(p) == 4 and p[:3] in ("ITC", "ITD", "ITE", "ITF", "ITG") else PROV_REGION_FALLBACK.get(a, a[:4])
    return "ITDA" if r in ("ITD1", "ITD2") else r

def do_crops_prov(out):
    """Cultivos por provincia (mismo flujo que crops.json). Superficie y produccion recolectada; cada provincia lleva su region."""
    flow = "101_1015"; dims, L = struct(flow)
    if not dims: raise RuntimeError("sin estructura")
    provs = sorted(c for c in L.get("REF_AREA", {}) if (PROV.match(c) or c in TN_BZ) and c not in ("ITD10", "ITD20"))   # la lista de territorios incluye tambien los ~12.000 municipios; Bolzano y Trento son ITD1 e ITD2 (4 caracteres, como una region)
    rows = getmany(flow, dims, {"DATA_TYPE": "ART+HP_Q_EXT"}, provs, "startPeriod=2018", n=10)
    nat = get(flow, dims, {"REF_AREA": "IT", "DATA_TYPE": "ART+HP_Q_EXT"}, "startPeriod=2018")
    ys = axis(rows + nat); ix = {y: i for i, y in enumerate(ys)}; A = {}; area = {}; prod = {}
    for r in rows + nat:
        v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
        if v is None or r["DESTINATION_WINEGRAPES"] != "ALL" or not (a == "IT" or a in TN_BZ or I.area_kind(a) == "province"): continue
        if a == "IT": A[a] = {"kind": "country", "label": lab(L, "REF_AREA", a)}
        else: A[a] = {"kind": "province", "label": lab(L, "REF_AREA", a), "region": prov_region(a)}
        i = ix[r["TIME_PERIOD"]]
        if r["DATA_TYPE"] == "ART": put(area, r["TYPE_OF_CROP"], a, ix, len(ys), i, round(v))
        elif r["DATA_TYPE"] == "HP_Q_EXT": put(prod, r["TYPE_OF_CROP"], a, ix, len(ys), i, round(v / 10, 1))
    crops = {c: {"label": lab(L, "TYPE_OF_CROP", c), "a": area[c], "p": prod.get(c, {})} for c in sorted(area) if len([k for k in area[c] if k != "IT"]) >= 3}
    nprov = len([a for a in A if a != "IT"])
    if nprov < 100: raise RuntimeError("solo %d provincias con dato" % nprov)
    regs = {}
    for a, x in A.items():
        if x["kind"] == "province": regs.setdefault(x["region"], []).append(a)
    log("cultivos por provincia:", len(crops), "cultivos,", nprov, "provincias en", len(regs), "regiones,", ys[0], "->", ys[-1])
    I.write(out, "crops-prov.json", I.head({"years": ys, "areas": A, "regions": {r: lab(L, "REF_AREA", r) for r in sorted(regs)}, "crops": crops, "units": {"a": "ha", "p": "t"},
        "note": "Coltivazioni ISTAT por provincia: superficie (ha) y produccion recolectada (ISTAT la publica en quintales; aqui en toneladas). Los años más recientes son estimaciones del ISTAT. Solo cultivos con dato en al menos 3 provincias; celda ausente = sin dato publicado. En 2026 (estimacion) el ISTAT ya usa las provincias nuevas de Cerdeña."}))

def do_milk(out):
    flow = "101_959"; dims, L = struct(flow)
    if not dims: raise RuntimeError("sin estructura")
    base = {"REF_AREA": "+".join(REGIONS)}
    rows = get(flow, dims, dict(base, DATA_TYPE="DAIRY_PROD", TYPE_UNITS_MILK_PROD="ALL", TONNES_OF_PROD_YEAR="TOT"), "startPeriod=2015&endPeriod=2021")
    pl = get(flow, dims, dict(base, DATA_TYPE="FACT", TONNES_OF_PROD_YEAR="TOT", TYPE_OF_DAIRY_PROD="ALL"), "startPeriod=2015&endPeriod=2021")
    ys = axis(rows + pl); ix = {y: i for i, y in enumerate(ys)}; A = {}; prods = {}; plants = {}; units = {}
    ALIAS = {"BUTT_THO_TONS": "BUTT_Q", "CREAM_THO_TONS": "CREAM_Q", "RM_THO_TONS": "RMI_Q"}   # misma magnitud con dos codigos segun el año
    CLEAN = re.compile(r"\s+(in quintals|thousands of tons|in tons|in quintali|migliaia di tonnellate|in tonnellate)\b", re.I)
    def conv(code, v):
        if code.endswith("_THO_TONS"): return round(v * 1000, 1), "t"
        if code.endswith("_TONS"): return round(v, 1), "t"
        if code.endswith("_Q"): return round(v / 10, 1), "t"
        if code.endswith("_PERC"): return round(v, 2), "%"
        return None, None
    for r in rows:
        v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
        if v is None or I.area_kind(a) not in ("country", "region"): continue
        raw = r["TYPE_OF_DAIRY_PROD"]; x, u = conv(raw, v)
        if x is None: continue
        c = ALIAS.get(raw, raw); units[c] = u; A[a] = area_info(L, a); i = ix[r["TIME_PERIOD"]]
        if raw == c or prods.get(c, {}).get(a, [None] * len(ys))[i] is None: put(prods, c, a, ix, len(ys), i, x)
    for r in pl:
        v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
        if v is None or I.area_kind(a) not in ("country", "region"): continue
        A[a] = area_info(L, a); put(plants, r["TYPE_UNITS_MILK_PROD"], a, ix, len(ys), ix[r["TIME_PERIOD"]], round(v))
    log("lacteos:", len(prods), "productos,", len(plants), "tipos de establecimiento,", len(A), "areas,", ys[0], "->", ys[-1])
    I.write(out, "milk.json", I.head({"years": ys, "areas": A, "products": {c: {"label": {k: CLEAN.sub("", s) for k, s in lab(L, "TYPE_OF_DAIRY_PROD", c).items()}, "unit": units[c], "v": v} for c, v in sorted(prods.items())},
        "plants": {c: {"label": lab(L, "TYPE_UNITS_MILK_PROD", c), "v": v} for c, v in sorted(plants.items())},
        "note": "Latte e prodotti lattiero-caseari ISTAT. Las masas se publican en quintales o toneladas y aqui van en toneladas; los porcentajes (grasa, proteina) tal cual."}))

def do_agri(out):
    flow = "101_965"; dims, L = struct(flow)
    if not dims: raise RuntimeError("sin estructura")
    rows = get(flow, dims, {"REF_AREA": "+".join(REGIONS)}, "startPeriod=2018")
    ys = axis(rows); ix = {y: i for i, y in enumerate(ys)}; A = {}; main = {}; dyn = {}; alt = {}; sex = {}; n = len(ys)
    for r in rows:
        v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
        if v is None or I.area_kind(a) not in ("country", "region"): continue
        A[a] = area_info(L, a); i = ix[r["TIME_PERIOD"]]; dt, au, sv = r["DATA_TYPE"], r["AGRIT_AUTHORIZATION"], r["AGRITOURISM_SERVICES"]
        du, dy, al, sx = r["AUTHO_DURAT_AGRITOUR"], r["DINAMIC_AGRIT_AUTHORIZ"], r["ALTIMETRIC_ZONE"], r["SEX"]
        if du != "TOTAL": continue
        if dy == "ACT" and al == "TOT" and sx == "9": put(main, dt + "|" + au + "|" + sv, a, ix, n, i, round(v))
        if dt == "NUMAGRIAUTH" and au == "ALL" and sv == "ALL" and al == "TOT" and sx == "9" and dy in ("ACT", "NEW", "CLOSED"): put(dyn, dy, a, ix, n, i, round(v))
        if dt == "NUMAGRIAUTH" and au == "ALL" and sv == "ALL" and dy == "ACT" and sx == "9" and al != "TOT": put(alt, al, a, ix, n, i, round(v))
        if dt == "NUMAGRIAUTH" and au == "ALL" and sv == "ALL" and dy == "ACT" and al == "TOT" and sx in ("1", "2"): put(sex, sx, a, ix, n, i, round(v))
    ml = {}
    for k, v in main.items():
        dt, au, sv = k.split("|"); ml[k] = {"measure": dt, "label": {"en": lab(L, "AGRIT_AUTHORIZATION", au)["en"] + (" / " + lab(L, "AGRITOURISM_SERVICES", sv)["en"] if sv != "ALL" else ""), "it": lab(L, "AGRIT_AUTHORIZATION", au)["it"] + (" / " + lab(L, "AGRITOURISM_SERVICES", sv)["it"] if sv != "ALL" else "")}, "v": v}
    log("agriturismo:", len(ml), "series,", len(A), "areas,", ys[0], "->", ys[-1], "; dinamica", list(dyn), "altimetria", list(alt), "sexo", list(sex))
    I.write(out, "agritourism.json", I.head({"years": ys, "areas": A, "measures": {c: lab(L, "DATA_TYPE", c) for c in sorted(set(x["measure"] for x in ml.values()))}, "series": dict(sorted(ml.items())),
        "dynamics": dyn, "altimetric": {c: {"label": lab(L, "ALTIMETRIC_ZONE", c), "v": v} for c, v in alt.items()}, "sex": sex,
        "note": "Agriturismo ISTAT: explotaciones con autorizacion activa a 31 de diciembre salvo que se diga otra cosa. Sexo = sexo de quien dirige la explotacion (1 hombres, 2 mujeres)."}))

IRR_FLOWS = [("cons", ["DF_DCAT_CENSAGRIC2020_SURF_IRR_CONS", "DF_DCAT_CENSAGRIC2020_SURF_SPA2023_2"], None),
             ("sys", ["DF_DCAT_CENSAGRIC2020_IRRSIS", "DF_DCAT_CENSAGRIC2020_IRRSIS_SPA2023"], "IRRIGATION_SYSTEM"),
             ("src", ["DF_DCAT_CENSAGRIC2020_IRRSOU", "DF_DCAT_CENSAGRIC2020_IRRSOU_SPA2023_1"], "WATER_IRRIG_SOURCE"),
             ("crop", ["DF_DCAT_CENSAGRIC2020_SURF_IRRCROPS", "DF_DCAT_CENSAGRIC2020_IRRCROPS_SPA2023_1"], "TYPE_OF_CROP")]
def do_irrigation(out):
    flows = {}; allL = {}; provs = []
    for kind, names, sub in IRR_FLOWS:
        rows = []; L = {}
        for f in names:
            try:
                dims, L1 = struct(f)
                if not dims: continue
                if not provs and "REF_AREA" in L1: provs = sorted(c for c in L1["REF_AREA"] if PROV.match(c))
                for d, m in L1.items(): L.setdefault(d, {}).update(m)
                r = getmany(f, dims, {}, REGIONS + provs, "", 20)
                for x in r: x["_flow"] = f
                rows += r; log("  censo", f, len(r), "filas")
            except Exception as e: log("  censo", f, "ERROR", str(e)[:150])
        flows[kind] = rows
        for d, m in L.items(): allL.setdefault(d, {}).update(m)
    ys = axis([x for r in flows.values() for x in r]); ix = {y: i for i, y in enumerate(ys)}; n = len(ys); A = {}
    res = {}
    for kind, names, sub in IRR_FLOWS:
        g = {}
        for r in flows[kind]:
            v = I.num(r["OBS_VALUE"]); a = r["REF_AREA"]
            if v is None or I.area_kind(a) not in ("country", "region", "province", "zone", "macro"): continue
            A[a] = area_info(allL, a); code = r["DATA_TYPE"] + ("|" + r[sub] if sub else "")
            put(g, code, a, ix, n, ix[r["TIME_PERIOD"]], round(v, 2) if r["DATA_TYPE"] in ("IA", "IBA", "IA_CONSIR") else round(v))
        res[kind] = {c: {"label": (lab(allL, "DATA_TYPE", c.split("|")[0]), lab(allL, sub, c.split("|")[1]) if sub else None), "v": v} for c, v in sorted(g.items())}
        for c in res[kind]:
            a, b = res[kind][c]["label"]; res[kind][c]["label"] = {"en": a["en"] + (" / " + b["en"] if b else ""), "it": a["it"] + (" / " + b["it"] if b else "")}
            res[kind][c]["measure"] = c.split("|")[0]; res[kind][c]["part"] = c.split("|")[1] if sub else None
        log("riego", kind, ":", len(res[kind]), "series")
    if not all(res[k] for k in ("cons", "sys", "src", "crop")): raise RuntimeError("riego incompleto (%s): no se sobrescribe el fichero anterior" % ", ".join("%s=%d" % (k, len(v)) for k, v in res.items()))
    I.write(out, "irrigation.json", I.head({"years": ys, "areas": A, "measures": {c: lab(allL, "DATA_TYPE", c) for c in sorted(set(x["measure"] for g in res.values() for x in g.values()))},
        "parts": {k: {c: lab(allL, d, c) for c in sorted(set(x["part"] for x in res[k].values() if x["part"]))} for k, d in (("sys", "IRRIGATION_SYSTEM"), ("src", "WATER_IRRIG_SOURCE"), ("crop", "TYPE_OF_CROP"))},
        "irrigable": res["cons"], "bySystem": res["sys"], "bySource": res["src"], "byCrop": res["crop"], "unit": {"area": "ha", "farms": "explotaciones"},
        "note": "Censimento dell'agricoltura 2020 (ISTAT) y, cuando existe, la encuesta de estructura 2023. Superficie en hectareas."}))

def do_comuni(out):
    flow = "DF_DCAT_CENSAGRIC2020_SURF_IRR_CONS"; dims, L = struct(flow)
    if not dims: raise RuntimeError("sin estructura")
    names = L.get("REF_AREA", {}); codes = sorted(c for c in names if COMUNE.match(c))
    log("  municipios en el catalogo:", len(codes))
    if not codes: raise RuntimeError("sin municipios en la estructura")
    rows = []
    rows = get(flow, dims, {}, "")                            # una sola peticion (unas 40 000 filas): el servicio rechaza claves con muchos codigos
    d = {}
    for r in rows:
        v = I.num(r["OBS_VALUE"]); c = r["REF_AREA"]
        if v is None or not COMUNE.match(c): continue
        d.setdefault(c, {})[r["DATA_TYPE"]] = v
    # region y provincia de cada municipio SIN tabla externa: el codigo ISTAT de municipio empieza por el de provincia (3 cifras);
    # se empareja cada prefijo con la provincia (NUTS3) cuya suma coincide exactamente en el propio fichero (superficie regada, regable y explotaciones).
    provs = sorted(c for c in L.get("REF_AREA", {}) if PROV.match(c)) + ["ITD1", "ITD2"]
    pr = {}
    for r in getmany(flow, dims, {}, provs, "", 20):
        v = I.num(r["OBS_VALUE"])
        if v is not None: pr.setdefault(r["REF_AREA"], {})[r["DATA_TYPE"]] = v
    pre = {}
    for c, x in d.items():
        s = pre.setdefault(c[:3], {"FIABLE": 0.0, "IA": 0.0, "IBA": 0.0, "n": 0})
        s["n"] += 1
        for k in ("FIABLE", "IA", "IBA"): s[k] += x.get(k) or 0.0
    match = {}
    for pf, s in pre.items():
        hit = [a for a, x in pr.items() if all(abs((x.get(k) or 0.0) - s[k]) < 1.0 for k in ("FIABLE", "IA", "IBA")) and (x.get("IBA") or 0) > 0]
        if len(hit) == 1: match[pf] = hit[0]
        elif len(hit) > 1:                                    # empate (p. ej. ITD1 e ITD10 son la misma provincia): se queda con el codigo de 5 caracteres
            h5 = [a for a in hit if len(a) == 5]
            if len(h5) == 1: match[pf] = h5[0]
    def region_of(a):
        p = PARENT.get(a)
        r = p if p and len(p) == 4 and p[:3] in ("ITC", "ITD", "ITE", "ITF", "ITG") else a[:4]
        return "ITDA" if r in ("ITD1", "ITD2") else r
    log("  prefijos de provincia emparejados:", len(match), "de", len(pre), "; sin emparejar:", sorted(set(pre) - set(match)), "; regiones:", sorted(set(region_of(a) for a in match.values())))
    items = []
    for c in sorted(d):
        x = d[c]; a = match.get(c[:3])
        items.append([c, names.get(c, {}).get("it", c), region_of(a) if a else None, lab(L, "REF_AREA", a)["it"] if a else None, x.get("FIABLE"), x.get("FIATED"), x.get("IBA"), x.get("IA")])
    log("municipios con dato:", len(items))
    if len(items) < 3000: raise RuntimeError("muy pocos municipios (%d)" % len(items))
    I.write(out, "comuni.json", I.head({"year": "2020", "cols": ["code", "name", "region", "province", "farmsIrrigable", "farmsIrrigated", "irrigableHa", "irrigatedHa"], "rows": items,
        "note": "Censimento dell'agricoltura 2020 (ISTAT) por municipio. Superficie en hectareas; provincia y region deducidas emparejando el prefijo del codigo ISTAT del municipio con la provincia cuyos totales coinciden en el propio fichero."}))

JOBS = {"crops": do_crops, "crops-prov": do_crops_prov, "milk": do_milk, "agritourism": do_agri, "irrigation": do_irrigation, "comuni": do_comuni}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "italy-istat")); ap.add_argument("--only", default=""); ap.add_argument("--log", default=str(ROOT / "data" / "italy-istat-2-log.txt"))
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True); only = [x for x in a.only.split(",") if x] or list(JOBS); fails = 0
    for n in only:
        try: JOBS[n](out)
        except Exception as e: fails += 1; log("ERROR", n, str(e)[:200])
    Path(a.log).write_text("\n".join(I.LOG) + "\n", encoding="utf-8")
    if fails == len(only): raise SystemExit("ningun conjunto se pudo leer: no se toca nada")
if __name__ == "__main__": main()

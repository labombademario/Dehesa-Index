#!/usr/bin/env python3
"""Paises Bajos por provincia: mano de obra, tamano de explotacion y diversificacion (CBS) -> data/nl-structure/<PROVINCIA>.json (12) + index.json
Fuente: CBS StatLine, datos abiertos (id cbs_nl):
  80784NED  mano de obra agraria por region y sexo (personas y unidades de trabajo anual 'aje'; familia / no familia), anios 2005 2010 2015 2020 y el ultimo
  80787NED  tierra de cultivo por clase de tamano de explotacion (explotaciones y hectareas: 0,01-1, 1-5, 5-10, 10-30, 30 o mas ha), mismos anios
  80807NED  explotaciones con actividades de diversificacion (venta directa, agroturismo, agricultura social, energia...), todos los anios publicados (1998-2023)
Todo se guarda como lo publica el CBS; un valor vacio o confidencial queda como hueco (null), nada se estima ni se reparte.
Controles (si fallan no se escribe nada): las 12 provincias; la suma de provincias no se aparta del total nacional mas de 1 % en explotaciones, hectareas y personas (2 % en 'aje' y en diversificacion,
que el CBS redondea); las clases de tamano suman el total; sin negativos.
Uso: update-nl-structure.py [--out DIRECTORIO]"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://opendata.cbs.nl/ODataApi/odata/"
PV = {"PV20": "GR", "PV21": "FR", "PV22": "DR", "PV23": "OV", "PV24": "FL", "PV25": "GE", "PV26": "UT", "PV27": "NH", "PV28": "ZH", "PV29": "ZE", "PV30": "NB", "PV31": "LI"}
SNAP = (2005, 2010, 2015, 2020)
LAB = [("pers", "RegelmatigWerkzaamTotaal_1"), ("fam", "GezinsarbeidskrachtenTotaal_2"), ("heads", "Bedrijfshoofden_3"), ("spouse", "Echtgenoten_4"), ("famother", "MeewerkendeFamilie_5"),
       ("nonfam", "NietGezinsarbeidskrachtenTotaal_6"), ("mgr", "Bedrijfsleiders_7"), ("other", "OverigeRegelmatigWerkzamePersonen_8"), ("irreg", "NietRegelmatigWerkzaam_9"),
       ("aje", "RegelmatigWerkzaamTotaal_10"), ("ajefam", "GezinsarbeidskrachtenTotaal_11"), ("ajenon", "NietGezinsarbeidskrachtenTotaal_15"), ("fwork", "RegelmatigWerkzaamTotaal_19")]
SIZE_AREA = ["CultuurgrondTotaal_8", "k_001Tot1Ha_9", "k_1Tot5Ha_10", "k_5Tot10Ha_11", "k_10Tot30Ha_12", "k_30HaOfMeer_13"]
SIZE_FARMS = ["CultuurgrondTotaal_27", "k_001Tot1Ha_28", "k_1Tot5Ha_29", "k_5Tot10Ha_30", "k_10Tot30Ha_31", "k_30HaOfMeer_32"]
DIV = [("farms", "TotaalAantalLandbouwbedrijven_1"), ("shop", "VerkoopAanHuisTotaal_2"), ("direct", "RechtstreekseVerkoopAanDeConsument_3"), ("viaone", "VerkoopVia1Tussenschakel_4"), ("storage", "StallingVanGoederenOfDieren_5"),
       ("agritour", "Agrotoerisme_6"), ("processing", "VerwerkingLandbouwproducten_7"), ("care", "Zorglandbouw_8"), ("aqua", "Aquacultuur_9"), ("contract", "LoonwerkVoorDerden_10"),
       ("nature", "AgrarischNatuurEnLandschapsbeheer_11"), ("childcare", "AgrarischeKinderopvang_12"), ("educ", "BoerderijEducatie_13"), ("energy", "EnergieproductieLeveringAanDerden_14")]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(path, params=None, tries=4):
    url = BASE + path + ("?" + urllib.parse.urlencode(params, safe="$',()") if params else "")
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}), timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))["value"]
        except Exception as e:
            last = str(e)[:160]; time.sleep(10 * (i + 1))
    raise RuntimeError("%s -> %s" % (path, last))
def years(tab):
    return sorted(int(p["Key"][:4]) for p in get(tab + "/Perioden") if re.match(r"^\d{4}JJ00$", p["Key"]))
def num(v):
    if v is None: return None
    if not isinstance(v, (int, float)) or isinstance(v, bool) or v < 0: raise RuntimeError("valor no valido %r" % (v,))
    return v
def rows(tab, cols, yrs, extra=None):
    flt = "(startswith(RegioS,'NL01') or startswith(RegioS,'PV')) and (" + " or ".join("Perioden eq '%dJJ00'" % y for y in yrs) + ")"
    if extra: flt += " and " + extra
    sel = ",".join(["RegioS", "Perioden"] + (["Geslacht"] if "Geslacht" in (extra or "") else []) + (["Bedrijfstypen"] if "Bedrijfstypen" in (extra or "") else []) + cols)
    out = {}
    for r in get(tab + "/TypedDataSet", {"$filter": flt, "$select": sel}):
        out[(r["RegioS"].strip(), int(r["Perioden"][:4]))] = r
    return out
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "nl-structure"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "nl-structure-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    try:
        yl, ys, yd = years("80784NED"), years("80787NED"), years("80807NED")
        ylab = sorted(set(y for y in SNAP if y in yl) | {yl[-1]}); ysz = sorted(set(y for y in SNAP if y in ys) | {ys[-1]})
        log("anios mano de obra", ylab, "tamano", ysz, "diversificacion", yd)
        lab = {}
        for g, k in (("1100", "t"), ("3000", "m"), ("4000", "f")):
            lab[k] = rows("80784NED", [c for _, c in LAB], ylab, "startswith(Geslacht,'%s')" % g)
        sz = rows("80787NED", SIZE_AREA + SIZE_FARMS, ysz)
        dv = rows("80807NED", [c for _, c in DIV], yd, "startswith(Bedrijfstypen,'T001061')")
    except RuntimeError as e: return fail(str(e))
    prov = {}; nat = {"lab": {}, "size": {}, "div": {}}
    def lv(sex, code, y): r = lab[sex].get((code, y)); return [num(r.get(c)) if r else None for _, c in LAB]
    for code, pv in PV.items():
        d = {"lab": {}, "size": {}, "div": {}}
        for y in ylab:
            d["lab"][str(y)] = {k: lv(k, code, y) for k in ("t", "m", "f")}
        for y in ysz:
            r = sz.get((code, y))
            if r: d["size"][str(y)] = {"area": [num(r.get(c)) for c in SIZE_AREA], "farms": [num(r.get(c)) for c in SIZE_FARMS]}
        for y in yd:
            r = dv.get((code, y))
            if r: d["div"][str(y)] = [num(r.get(c)) for _, c in DIV]
        prov[pv] = d
    for y in ylab: nat["lab"][str(y)] = {k: lv(k, "NL01", y) for k in ("t", "m", "f")}
    for y in ysz:
        r = sz.get(("NL01", y)); nat["size"][str(y)] = {"area": [num(r.get(c)) for c in SIZE_AREA], "farms": [num(r.get(c)) for c in SIZE_FARMS]} if r else None
    for y in yd:
        r = dv.get(("NL01", y)); nat["div"][str(y)] = [num(r.get(c)) for _, c in DIV] if r else None
    # controles
    def tot(vals): return sum(v or 0 for v in vals)
    y1 = str(ysz[-1]); yl1 = str(ylab[-1]); yd1 = str(yd[-1])
    checks = [("explotaciones por tamano %s" % y1, tot(p["size"][y1]["farms"][0:1] for p in prov.values() if y1 in p["size"]) if False else sum((p["size"].get(y1) or {"farms": [0]})["farms"][0] or 0 for p in prov.values()), nat["size"][y1]["farms"][0], 0.01),
              ("hectareas por tamano %s" % y1, sum((p["size"].get(y1) or {"area": [0]})["area"][0] or 0 for p in prov.values()), nat["size"][y1]["area"][0], 0.01),
              ("personas %s" % yl1, sum(p["lab"][yl1]["t"][0] or 0 for p in prov.values()), nat["lab"][yl1]["t"][0], 0.01),
              ("aje %s" % yl1, sum(p["lab"][yl1]["t"][9] or 0 for p in prov.values()), nat["lab"][yl1]["t"][9], 0.02),
              ("explotaciones diversificacion %s" % yd1, sum((p["div"].get(yd1) or [0])[0] or 0 for p in prov.values()), (nat["div"][yd1] or [0])[0], 0.02)]
    for name, s, n, tol in checks:
        if not n: return fail("sin total nacional:", name)
        log("  control %-36s provincias %12s nacional %12s (%.2f %%)" % (name, round(s, 1), n, 100 * s / n))
        if abs(s - n) > n * tol: return fail("%s: la suma de provincias %s se aparta mas de %.0f %% del total %s" % (name, s, tol * 100, n))
    for pv, p in prov.items():
        for y, s in p["size"].items():
            for k, tl in (("area", 0.01), ("farms", 0.02)):
                a = s[k]
                if a[0] and None not in a[1:] and abs(sum(a[1:]) - a[0]) > a[0] * tl + 2: return fail("%s %s %s: las clases suman %s y el total es %s" % (pv, y, k, sum(a[1:]), a[0]))
    if any(not p["size"] or not p["lab"] or not p["div"] for p in prov.values()): return fail("falta algun bloque en alguna provincia")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "cbs_nl", "url": "https://opendata.cbs.nl/#/CBS/nl/dataset/80784NED/table"}
    meta = {"lab": [k for k, _ in LAB], "size": ["total", "c1", "c2", "c3", "c4", "c5"], "div": [k for k, _ in DIV]}
    for pv, p in sorted(prov.items()):
        (out / (pv + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": pv, "ind": meta, "labYears": ylab, "sizeYears": ysz, "divYears": yd, **p}, ensure_ascii=False, separators=(",", ":")) + "\n")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "provinces": sorted(prov), "ind": meta, "labYears": ylab, "sizeYears": ysz, "divYears": yd, "national": nat}, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(prov), "provincias")
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())

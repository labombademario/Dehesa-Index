#!/usr/bin/env python3
"""Finlandia por gran region NUTS 2: explotaciones por orientacion productiva y estructura de los rebanos (Luke) -> data/fi-sector/<NUTS2>.json (FI19 FI1B FI1C FI1D FI20) + index.json
Fuente: Luke (statdb.luke.fi, CC BY 4.0, id luke_fi), cuadros por maakunta (provincia, NUTS 3) que aqui se agrupan en las 5 grandes regiones NUTS 2 por nombre:
  yrirak/0400_yrirak  explotaciones por orientacion productiva (cereal, otros cultivos, invernadero, aire libre, leche, vacuno de carne, otro bovino, porcino, aves, otro herbivoro, mixta), todos los anios
  kotlkm/0300_kotlkm  vacas lecheras y explotaciones por tamano del rebano (1-9 ... 300 o mas), anios 2010 2015 2020 y el ultimo
  kotlkm/0500_kotlkm  cerdos de cebo y explotaciones por tamano del rebano, anios 2015 2020 y el ultimo
Un valor oculto por secreto estadistico queda como hueco (null): nada se estima ni se reparte. Las cifras de cada region son la suma de sus maakunta publicadas; si falta alguna, el hueco se arrastra (null).
Controles (si fallan no se escribe nada): las 5 regiones; la suma de regiones no supera el total nacional (0,5 %) ni queda por debajo del 97 % en explotaciones; las orientaciones no suman mas que el total de su region; sin negativos.
Uso: update-fi-sector.py [--out DIRECTORIO]"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LUKE = "https://statdb.luke.fi/PxWeb/api/v1/en/LUKE/maa/"
UA = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
N2 = {"FI1B": ["Uusimaa"], "FI1C": ["Southwest Finland", "Kanta-Häme", "Päijät-Häme", "Kymenlaakso", "South Karelia"],
      "FI19": ["Satakunta", "Pirkanmaa", "Central Finland", "South Ostrobothnia", "Ostrobothnia"],
      "FI1D": ["South Savo", "North Savo", "North Karelia", "Kainuu", "Central Ostrobothnia", "North Ostrobothnia", "Lapland"], "FI20": ["Åland"]}
SECT = ["VILJ", "KASV_MUU", "KASVH", "AVOM", "LYPS", "NLIH", "NMUU", "SIKA", "SIIP", "LAIMUU", "SEKA"]
SECK = ["cereal", "plant", "glass", "open", "milk", "beef", "cattle", "pigs", "poultry", "grazing", "mixed"]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def call(url, body=None, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers=dict(UA, **({"Content-Type": "application/json"} if body else {})))
            with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode("utf-8-sig"))
        except Exception as e:
            last = str(e)[:160]; time.sleep(8 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[-70:], last))
def meta(path):
    return {v["code"]: (v["values"], v["valueTexts"]) for v in call(LUKE + path)["variables"]}
def q(path, sel):
    return call(LUKE + path, {"query": [{"code": c, "selection": {"filter": "item", "values": v}} for c, v in sel], "response": {"format": "json"}})["data"]
def num(v):
    v = (v or "").strip().replace(" ", "")
    if v in ("", ".", "..", "...", "-"): return None
    x = float(v.replace(",", "."))
    if x < 0: raise RuntimeError("valor negativo %r" % v)
    return int(round(x))
def add(vals):
    return None if any(v is None for v in vals) else sum(vals)
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "fi-sector"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "fi-sector-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    try:
        m4 = meta("yrirak/0400_yrirak.px"); mk, mkt = m4["MK"]; name2mk = {t: c for c, t in zip(mk, mkt)}
        allname = {t for ts in N2.values() for t in ts}
        miss = allname - set(name2mk)
        if miss: return fail("maakunta sin codigo:", sorted(miss))
        extra = [t for t in mkt if t not in allname and t != "WHOLE COUNTRY"]
        if extra: return fail("maakunta sin gran region:", extra)
        yrs = [y for y in m4["A"][0] if int(y) >= 2011]
        d4 = q("yrirak/0400_yrirak.px", [("INFO", ["KPL"]), ("A", yrs), ("MK", mk), ("TUOTS", ["TUOTS_YHT"] + SECT)])
        sec = {}
        for r in d4: sec[(r["key"][-2], r["key"][-3], r["key"][-1])] = num(r["values"][0])   # (MK, anio, sector)
        herds = {}
        for key, path, info, years_want in (("dairy", "kotlkm/0300_kotlkm.px", "LLEHM_YKS", (2010, 2015, 2020)), ("pigs", "kotlkm/0500_kotlkm.px", "SIKA_YKS", (2015, 2020))):
            mm = meta(path); ys = sorted(int(y) for y in mm["A"][0])
            infos = mm["INFO"][0]; head = [i for i in infos if i != "TILA_KPL"][0]
            ck = [c for c in mm if c not in ("INFO", "A", "MK")][0]; classes, ctext = mm[ck]
            use = sorted(set(y for y in years_want if y in ys) | {ys[-1]})
            mk2, mkt2 = mm["MK"]; n2 = {t: c for c, t in zip(mk2, mkt2)}
            if allname - set(n2): return fail(key, "maakunta sin codigo:", sorted(allname - set(n2)))
            d = {}
            for inf in (head, "TILA_KPL"):
                for r in q(path, [("INFO", [inf]), ("A", [str(y) for y in use]), ("MK", mk2), (ck, classes)]):
                    d[(inf == "TILA_KPL", r["key"][-2], r["key"][-3], r["key"][-1])] = num(r["values"][0])
            herds[key] = (use, classes, ctext, d, n2)
    except RuntimeError as e: return fail(str(e))
    regs = {}; nat = {}
    for r, names in N2.items():
        sc = {}
        for y in yrs:
            sc[y] = [add([sec[(name2mk[n], y, t)] for n in names]) for t in ["TUOTS_YHT"] + SECT]
        d = {"years": [int(y) for y in yrs], "ind": ["total"] + SECK, "sec": {y: sc[y] for y in yrs}}
        for key, (use, classes, ctext, hd, n2) in herds.items():
            d[key] = {"classes": ctext, "years": use}
            for y in use:
                d[key][str(y)] = {"head": [add([hd[(False, n2[n], str(y), c)] for n in names]) for c in classes], "farms": [add([hd[(True, n2[n], str(y), c)] for n in names]) for c in classes]}
        regs[r] = d
    # controles
    nm = {}
    for y in yrs:
        tot = sum(regs[r]["sec"][y][0] or 0 for r in regs); n = sec[("SSS" if "SSS" in mk else mk[0], y, "TUOTS_YHT")]
        nm[y] = (tot, n)
        if not n or tot > n * 1.005 or tot < n * 0.97: return fail("explotaciones %s: regiones %s frente a nacional %s" % (y, tot, n))
    log("explotaciones", yrs[-1], "regiones", nm[yrs[-1]][0], "nacional", nm[yrs[-1]][1])
    for r, d in regs.items():
        for y, v in d["sec"].items():
            if v[0] is not None and sum(x or 0 for x in v[1:]) > v[0] * 1.001: return fail("%s %s: las orientaciones suman mas que el total" % (r, y))
        for key in herds:
            for y in d[key]["years"]:
                b = d[key][str(y)]
                for k in ("head", "farms"):
                    a = b[k]
                    if a[0] is not None and sum(x or 0 for x in a[1:]) > a[0] * 1.001: return fail("%s %s %s: las clases suman mas que el total" % (r, key, y))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "luke_fi", "url": "https://statdb.luke.fi/PxWeb/pxweb/en/LUKE/LUKE__02%20Maatalous__04%20Tuotanto__02%20Maatalous__yrirak/"}
    for r, d in sorted(regs.items()):
        (out / (r + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": r, **d}, ensure_ascii=False, separators=(",", ":")) + "\n")
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "regions": sorted(regs), "years": [int(y) for y in yrs], "ind": ["total"] + SECK,
                                               "national": {str(y): [sec[(mk[0], y, t)] for t in ["TUOTS_YHT"] + SECT] for y in yrs}}, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(regs), "regiones"); logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())

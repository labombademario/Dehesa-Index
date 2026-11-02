#!/usr/bin/env python3
"""Alemania: Landwirtschaftszaehlung / Agrarstrukturerhebung por Bundesland (Destatis GENESIS-Online, Datenlizenz Deutschland - Namensnennung 2.0) -> data/de-lz-laender.json
Necesita GENESIS_TOKEN (el de update-germany). Sin token no se toca el fichero. Todo tal cual lo publica Destatis (años 2010, 2013, 2016, 2020, 2023); los valores
suprimidos ('-', '.', 'x', '/') quedan como hueco, nunca como cero. Tablas por Land (41141-01xx), solo la fila "Insgesamt" de las clases de tamaño:
  0101 uso del suelo (explotaciones y superficie por clase)   0103 cultivos de labor   0104 ganado (explotaciones y cabezas, 1 de marzo)
  0105 agricultura ecologica   0115 regadio   0116 cultivos permanentes   0117 prados y pastos
Control: para cada clase de las tablas 0101 (y 0104) la suma de los Länder se compara con la tabla nacional (41141-0001 / -0004) en 2020; al menos el 85 % de las comparaciones
deben cuadrar al 2 % (el censo redondea); si falla, no se escribe nada.
Uso: GENESIS_TOKEN=... python3 scripts/update-de-lz-laender.py [--out FICHERO]"""
import argparse, datetime, importlib.util, json, os, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sp = importlib.util.spec_from_file_location("ge", ROOT / "scripts" / "update-germany-destatis-extra.py"); ge = importlib.util.module_from_spec(sp); sp.loader.exec_module(ge)
LAND = ge.LAND
YEARS = [2010, 2013, 2016, 2020, 2023]
VAL = {"Landwirtschaftliche Betriebe": "farms", "Landwirtschaftliche Betriebe mit Viehhaltung": "farms", "Landwirtschaftliche Betriebe mit Dauerkulturen": "farms", "Landwirtschaftliche Betriebe mit Dauergrünland": "farms",
       "Landwirtsch. Betriebe mit ökologischem Landbau": "farms", "Landwirtschaftl. Betr. mit Bewässerung im Vorjahr": "farms", "Fläche": "area", "Dauerkulturfläche": "area", "Dauergrünlandfläche": "area",
       "LF in Betrieben mit ökologischem Landbau": "area", "Bewässerte Fläche im Vorjahr": "area", "Viehbestand": "head", "Tiere": "animals"}
TABLES = [("landuse", "41141-0101", 2), ("arable", "41141-0103", 2), ("livestock", "41141-0104", 2), ("organic", "41141-0105", 2), ("irrigation", "41141-0115", None), ("permanent", "41141-0116", 2), ("grassland", "41141-0117", 2)]
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def year(t): return int(t[:4])
def build(rows, clsn, tot_ok=("Insgesamt", "")):
    """{land: {clase: {farms:[5], area:[5]...}}} con la clase en clasificacion clsn (None = sin clase) y el resto de clasificaciones en 'Insgesamt' o vacias"""
    out = {}
    for r in rows:
        L = ge.labels(r); land = LAND.get(L.get(1))
        if not land: continue
        vk = VAL.get(r["value_variable_label"].strip())
        if not vk: continue
        if any(v not in tot_ok for n, v in L.items() if n not in (1, clsn)): continue
        cls = (L.get(clsn) or "Insgesamt") if clsn else "Insgesamt"
        if re.search(r" ha$", cls): continue
        if clsn is None and any(v not in tot_ok for n, v in L.items() if n != 1): continue
        y = year(r["time"])
        if y not in YEARS: continue
        v = ge.num(r["value"])
        arr = out.setdefault(land, {}).setdefault(cls, {}).setdefault(vk, [None] * len(YEARS)); arr[YEARS.index(y)] = v
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--probe", action="store_true"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "de-lz-laender.json"; logf = ROOT / "data" / "de-lz-laender-log.txt"
    tok = os.environ.get("GENESIS_TOKEN", "").strip()
    if not tok: log("sin GENESIS_TOKEN: se conserva", out.name); logf.write_text("\n".join(LOG) + "\n"); return 0
    T = {}
    for key, name, clsn in TABLES + [("nat_landuse", "41141-0001", None), ("nat_livestock", "41141-0004", None)]:
        try: T[key] = ge.fetch(tok, name, "2010"); log(name, len(T[key]), "filas")
        except Exception as e: log("ERROR", name, str(e)[:200]); T[key] = None
    if any(T[k] is None for k in ("landuse", "livestock")): log("FALLO: faltan tablas esenciales"); logf.write_text("\n".join(LOG) + "\n"); return 1
    data = {}
    for key, name, clsn in TABLES:
        if T[key] is None: continue
        d = build(T[key], clsn)
        # el censo no da 'Insgesamt' de tamaño en las tablas de cultivos de labor: la clase es clasificacion 2 y el tamaño clasificacion 3
        data[key] = d; log(key, len(d), "Länder,", len({c for l in d.values() for c in l}), "clases")
    # control contra las tablas nacionales (2020)
    def nat(rows, clsn):
        o = {}
        for r in rows:
            L = ge.labels(r); vk = VAL.get(r["value_variable_label"].strip())
            if not vk or year(r["time"]) != 2020: continue
            cls = (L.get(1) or "Insgesamt") if clsn else "Insgesamt"
            if any(v not in ("Insgesamt", "") for n, v in L.items() if n != 1): continue
            v = ge.num(r["value"])
            if v is not None: o[(cls, vk)] = v
        return o
    ok = tot = 0
    for key, nk in (("landuse", "nat_landuse"), ("livestock", "nat_livestock")):
        if T[nk] is None: log("sin tabla nacional para", key); continue
        N = nat(T[nk], True); i = YEARS.index(2020)
        for (cls, vk), nv in N.items():
            vs = [data[key].get(l, {}).get(cls, {}).get(vk, [None] * 5)[i] for l in data[key]]
            if None in vs or len(vs) < 16 or nv < 100: continue
            tot += 1; ok += abs(sum(vs) - nv) <= 0.02 * nv + 5
    log("control Länder frente a Alemania: %d de %d clases cuadran" % (ok, tot))
    if tot < 20 or ok < 0.85 * tot: log("FALLO: el control no cuadra, no se escribe nada"); logf.write_text("\n".join(LOG) + "\n"); return 1
    # clases sin ningun valor fuera
    for key, d in data.items():
        for l in d:
            for c in list(d[l]):
                if all(all(x is None for x in arr) for arr in d[l][c].values()): del d[l][c]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"id": "destatis", "name": "Statistisches Bundesamt (Destatis), GENESIS-Online, Landwirtschaftszählung/Agrarstrukturerhebung", "url": "https://www-genesis.destatis.de/", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"},
           "years": YEARS, "units": {"farms": "farms", "area": "ha", "head": "head", "animals": "animals"}, "tables": {k: {"code": n} for k, n, c in TABLES if k in data}, "data": data}
    for k in doc["tables"]: doc["tables"][k]["lands"] = data[k]
    doc["tables"] = {k: v["lands"] for k, v in doc["tables"].items()}; del doc["data"]
    out.parent.mkdir(parents=True, exist_ok=True); out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %s %d KB" % (out.name, out.stat().st_size // 1024))
    if a.probe:
        for k, d in data.items(): print(k, sorted({c for l in d.values() for c in l})[:200])
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())

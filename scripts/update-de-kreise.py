#!/usr/bin/env python3
"""Alemania por distrito (Kreise y ciudades independientes): Landwirtschaftszaehlung / Agrarstrukturerhebung de la Regionaldatenbank Deutschland
(Statistische Aemter des Bundes und der Laender, Datenlizenz Deutschland - Namensnennung 2.0) -> data/de-kreise/<LAND>.json + index.json
Necesita RDB_USER y RDB_PASSWORD (cuenta gratuita de regionalstatistik.de, solo como secretos de GitHub). Sin ellos no se toca nada.
Tablas 41141-xx-4 (nivel Kreise, años 2010, 2016 y 2020; ganado a 1 de marzo):
  01-01 uso del suelo   02-02 cultivos de labor   03-02 ganado   04-02 ecologico   05-01 tamaño de la explotacion
  06-01 propiedad y arrendamiento   07-01 forma juridica y tipo   09-01 sucesion (titulares de 55 años o mas)
Todo tal cual lo publica la fuente; los valores suprimidos ('-', '.', 'x', '/') quedan como hueco, nunca como cero.
Control: cada tabla trae tambien el nivel Land. Para cada clase y medida donde TODOS los distritos del Land tienen dato, la suma de distritos debe cuadrar con el Land (2 % + 5);
y la suma de distritos nunca puede superar al Land. Si cuadran menos del 85 % o hay desbordes, no se escribe nada.
Uso: RDB_USER=... RDB_PASSWORD=... python3 scripts/update-de-kreise.py [--out DIRECTORIO]"""
import argparse, csv, datetime, io, json, os, re, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.regionalstatistik.de/genesisws/rest/2020/data/tablefile"
YEARS = [2010, 2016, 2020]
LAND = {"01": "SH", "02": "HH", "03": "NI", "04": "HB", "05": "NW", "06": "HE", "07": "RP", "08": "BW", "09": "BY", "10": "SL", "11": "BE", "12": "BB", "13": "MV", "14": "SN", "15": "ST", "16": "TH"}
TABLES = [("landuse", "41141-01-01-4"), ("crops", "41141-02-02-4"), ("livestock", "41141-03-02-4"), ("organic", "41141-04-02-4"), ("size", "41141-05-01-4"),
          ("tenure", "41141-06-01-4"), ("legal", "41141-07-01-4"), ("succession", "41141-09-01-4")]
MISSING = ("", ".", "..", "...", "-", "/", "x", "–")
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def num(s):
    s = (s or "").strip()
    if s in MISSING: return None
    try: return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)
    except ValueError: return None
def fetch(user, pw, name):
    body = urllib.parse.urlencode({"name": name, "area": "all", "startyear": "2010", "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": user, "password": pw, "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE, data=body, headers=h, method="POST"), timeout=240) as r: raw = r.read()
            if raw[:2] != b"PK": raise RuntimeError("sin ZIP: " + raw[:160].decode("utf-8", "replace"))
            z = zipfile.ZipFile(io.BytesIO(raw)); return list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(("%s: %s" % (name, last)).replace(user, "<u>").replace(pw, "<p>"))
def parse(rows):
    """{'k': {ags: {nombre, {clase: {medida: [v por año]}}}}, 'l': {land: {clase: {medida: [v]}}}, 'm': {medida: (etiqueta, unidad)}}"""
    k, l, m = {}, {}, {}
    for r in rows:
        lv = r.get("1_variable_code", "")
        if lv not in ("KREISE", "DLAND"): continue
        y = int(r["time"][:4])
        if y not in YEARS: continue
        code = r["value_variable_code"].strip(); m[code] = (r["value_variable_label"].strip(), r["value_unit"].strip())
        cls = (r.get("2_variable_attribute_label") or "").strip() or "-"
        v = num(r["value"]); i = YEARS.index(y); ags = r["1_variable_attribute_code"].strip()
        if lv == "KREISE":
            d = k.setdefault(ags, {"n": r["1_variable_attribute_label"].strip(), "t": {}})
            tgt = d["t"]
        else:
            land = LAND.get(ags[:2])
            if not land: continue
            tgt = l.setdefault(land, {})
        tgt.setdefault(cls, {}).setdefault(code, [None] * len(YEARS))[i] = v
    return k, l, m
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "de-kreise"; logf = ROOT / "data" / "de-kreise-log.txt"
    user, pw = os.environ.get("RDB_USER", "").strip(), os.environ.get("RDB_PASSWORD", "").strip()
    if not user or not pw: log("sin RDB_USER/RDB_PASSWORD: se conserva", out.name); logf.write_text("\n".join(LOG) + "\n"); return 0
    D, LD, M = {}, {}, {}
    for key, name in TABLES:
        try: rows = fetch(user, pw, name)
        except Exception as e: log("ERROR", name, str(e)[:200]); logf.write_text("\n".join(LOG) + "\n"); return 1
        k, l, m = parse(rows); D[key], LD[key] = k, l; M[key] = {c: {"label": v[0], "unit": v[1]} for c, v in m.items()}
        log(name, len(rows), "filas,", len(k), "distritos,", len(l), "Länder")
    # control: suma de distritos frente al Land
    ok = tot = over = 0
    for key in D:
        by = {}
        for ags, d in D[key].items(): by.setdefault(LAND.get(ags[:2]), []).append(d["t"])
        for land, lst in by.items():
            if not land or land not in LD[key]: continue
            for cls, meas in LD[key][land].items():
                for code, arr in meas.items():
                    for i in range(len(YEARS)):
                        lv = arr[i]
                        if lv is None or lv < 100: continue
                        vs = [t.get(cls, {}).get(code, [None] * 3)[i] for t in lst]
                        have = [v for v in vs if v is not None]
                        if have and sum(have) > lv * 1.02 + 5: over += 1
                        if None in vs: continue
                        tot += 1; ok += abs(sum(vs) - lv) <= 0.02 * lv + 5
    log("control distritos frente a Land: %d de %d cuadran, %d desbordes" % (ok, tot, over))
    if tot < 200 or ok < 0.85 * tot or over > 0.01 * max(tot, 1): log("FALLO: el control no cuadra, no se escribe nada"); logf.write_text("\n".join(LOG) + "\n"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "destatis", "name": "Statistische Ämter des Bundes und der Länder, Regionaldatenbank Deutschland, Landwirtschaftszählung/Agrarstrukturerhebung", "url": "https://www.regionalstatistik.de/", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"}
    out.mkdir(parents=True, exist_ok=True); per = {}
    for key in D:
        for ags, d in D[key].items():
            land = LAND.get(ags[:2])
            if not land: continue
            e = per.setdefault(land, {}).setdefault(ags, {"n": d["n"], "t": {}})
            clean = {c: {m: arr for m, arr in meas.items() if any(x is not None for x in arr)} for c, meas in d["t"].items()}
            clean = {c: meas for c, meas in clean.items() if meas}
            if clean: e["t"][key] = clean
    n = 0
    for land in sorted(per):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "land": land, "years": YEARS, "kreise": per[land]}
        (out / (land + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8"); n += len(per[land])
    meas = {key: M[key] for key in M}
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "years": YEARS, "lands": sorted(per), "tables": {k: n_ for k, n_ in TABLES}, "measures": meas}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d distritos en %d Länder, %d KB" % (n, len(per), sum(f.stat().st_size for f in out.glob("*.json")) // 1024))
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())

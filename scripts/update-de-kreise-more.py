#!/usr/bin/env python3
"""Alemania por distrito (Kreise): mas series de la Regionaldatenbank Deutschland (Statistische Aemter des Bundes und der Laender, Datenlizenz Deutschland - Namensnennung 2.0)
-> data/de-kreise-more/<LAND>.json + index.json
Necesita RDB_USER y RDB_PASSWORD (secretos de GitHub). Sin ellos no se toca nada. Todo tal cual lo publica la fuente; los valores suprimidos quedan como hueco, nunca como cero.
  yields   41241-01-03-4  rendimientos por hectarea (dt/ha) de cultivos de campo (Ernteerhebung)
  cattle   41312-01-01-4  bovinos por categoria (incluye vacas de leche) a 3 de noviembre
  jobs     13312-01-05-4  ocupados (miles) en agricultura, silvicultura y pesca (seccion A) y total
  histf    41120-01-02-4  explotaciones con tierra de labor y superficie agraria por clase de cultivo (1999-2007)
  histl    41120-12-01-4  explotaciones con ganado (historico)
Las tablas grandes se piden por trozos de años (la API responde codigo 98 si la tabla es demasiado grande); si un trozo sigue siendo grande se parte por años.
Controles por tipo: bovinos, empleo y historico son aditivos (la suma de distritos debe cuadrar con el Land, 2 % + tolerancia; nunca superarlo en mas de un 5 %);
rendimientos no son aditivos: cada valor debe ser plausible (>0 y <= 1500 dt/ha) y el del Land debe quedar entre el minimo y el maximo de sus distritos. Si el control falla, no se escribe nada.
Uso: RDB_USER=... RDB_PASSWORD=... python3 scripts/update-de-kreise-more.py [--out DIRECTORIO]"""
import argparse, csv, datetime, io, json, os, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.regionalstatistik.de/genesisws/rest/2020/data/tablefile"
LAND = {"01": "SH", "02": "HH", "03": "NI", "04": "HB", "05": "NW", "06": "HE", "07": "RP", "08": "BW", "09": "BY", "10": "SL", "11": "BE", "12": "BB", "13": "MV", "14": "SN", "15": "ST", "16": "TH"}
# clave, tabla, año inicial, año final, tipo de control, clases que se guardan (None = todas)
TABLES = [("yields", "41241-01-03-4", 2010, 2025, "range", None), ("cattle", "41312-01-01-4", 2010, 2025, "add", None),
          ("jobs", "13312-01-05-4", 2000, 2024, "add", ("Land- und Forstwirtschaft, Fischerei (A)", "Insgesamt")),
          ("histf", "41120-01-02-4", 1999, 2007, "add", None), ("histl", "41120-12-01-4", 1999, 2007, "add", None)]
MISSING = ("", ".", "..", "...", "-", "/", "x", "–")
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def num(s):
    s = (s or "").strip()
    if s in MISSING: return None
    try: return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)
    except ValueError: return None
class TooBig(Exception): pass
def fetch(user, pw, name, y0, y1):
    body = urllib.parse.urlencode({"name": name, "area": "all", "startyear": str(y0), "endyear": str(y1), "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": user, "password": pw, "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE, data=body, headers=h, method="POST"), timeout=300) as r: raw = r.read()
            if raw[:2] == b"PK":
                z = zipfile.ZipFile(io.BytesIO(raw)); return list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
            txt = raw[:400].decode("utf-8", "replace")
            if '"Code":98' in txt: raise TooBig(txt)
            if '"Code":-' in txt or "keine Daten" in txt.lower() or '"Code":104' in txt or '"Code":22' in txt: return []
            raise RuntimeError("sin ZIP: " + txt[:200])
        except TooBig: raise
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(("%s %s-%s: %s" % (name, y0, y1, last)).replace(user, "<u>").replace(pw, "<p>"))
def fetch_chunked(user, pw, name, y0, y1):
    """pide todo el rango; si la API dice 'demasiado grande', parte el rango en dos hasta llegar a un año"""
    try: return fetch(user, pw, name, y0, y1)
    except TooBig:
        if y0 >= y1: raise RuntimeError("%s %s: demasiado grande incluso para un año" % (name, y0))
        m = (y0 + y1) // 2; return fetch_chunked(user, pw, name, y0, m) + fetch_chunked(user, pw, name, m + 1, y1)
def parse(rows, keep):
    """{'k': {ags: {'n', 't': {clase: {medida: {año: valor}}}}}, 'l': {land: {clase: {medida: {año: v}}}}, 'm': {medida: (etiqueta, unidad)}, 'y': set(años)}"""
    k, l, m, ys = {}, {}, {}, set()
    for r in rows:
        lv = r.get("1_variable_code", "")
        if lv not in ("KREISE", "DLAND"): continue
        y = int(r["time"][:4]); ys.add(y)
        code = r["value_variable_code"].strip(); m[code] = (r["value_variable_label"].strip(), r["value_unit"].strip())
        cls = (r.get("2_variable_attribute_label") or "").strip() or "-"
        if keep and cls not in keep: continue
        v = num(r["value"]); ags = r["1_variable_attribute_code"].strip()
        if lv == "KREISE": tgt = k.setdefault(ags, {"n": r["1_variable_attribute_label"].strip(), "t": {}})["t"]
        else:
            land = LAND.get(ags[:2])
            if not land: continue
            tgt = l.setdefault(land, {})
        tgt.setdefault(cls, {}).setdefault(code, {})[y] = v
    # una subdivision de 8 cifras (p. ej. la ciudad de Hannover dentro de la Region de Hannover) se cuenta dos veces si su unidad madre de 5 cifras tambien esta: se queda la madre
    par = {a for a in k if len(a) == 5}; dup = [a for a in k if len(a) == 8 and a[:5] in par]
    for a in dup: del k[a]
    return k, l, m, sorted(ys)
def control(kind, key, K, Lnd, years):
    """(ok, total, desbordes, ejemplos)"""
    ok = tot = over = 0; bad = []
    by = {}
    for ags, d in K.items(): by.setdefault(LAND.get(ags[:2]), []).append(d["t"])
    for land, lst in by.items():
        if not land or land not in Lnd: continue
        for cls, meas in Lnd[land].items():
            for code, ser in meas.items():
                for y, lv in ser.items():
                    if lv is None: continue
                    vs = [t.get(cls, {}).get(code, {}).get(y) for t in lst]
                    have = [v for v in vs if v is not None]
                    if kind == "range":
                        if len(have) < 3: continue
                        tot += 1; good = min(have) * 0.98 - 0.5 <= lv <= max(have) * 1.02 + 0.5; ok += good
                        if not good: bad.append((key, land, cls, y, round(lv, 1), round(min(have), 1), round(max(have), 1)))
                        continue
                    tol = 0.02 * abs(lv) + (0.3 if key == "jobs" else 5)
                    if have and sum(have) > lv * 1.05 + tol: over += 1; bad.append(("DESBORDE", key, land, cls, code, y, round(sum(have), 1), lv))
                    if None in vs or lv < (5 if key == "jobs" else 100): continue
                    tot += 1; good = abs(sum(vs) - lv) <= tol; ok += good
                    if not good: bad.append(("DESCUADRE", key, land, cls, code, y, round(sum(vs), 1), lv))
    return ok, tot, over, bad
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "data" / "de-kreise-more"; logf = ROOT / "data" / "de-kreise-more-log.txt"
    user, pw = os.environ.get("RDB_USER", "").strip(), os.environ.get("RDB_PASSWORD", "").strip()
    if not user or not pw: log("sin RDB_USER/RDB_PASSWORD: se conserva", out.name); logf.write_text("\n".join(LOG) + "\n"); return 0
    D, LD, M, Y = {}, {}, {}, {}; allbad = []; tok = tot = over = 0
    for key, name, y0, y1, kind, keep in TABLES:
        try: rows = fetch_chunked(user, pw, name, y0, y1)
        except Exception as e: log("ERROR", name, str(e)[:240]); logf.write_text("\n".join(LOG) + "\n"); return 1
        k, l, m, ys = parse(rows, keep)
        if not k: log("FALLO: sin distritos en", name); logf.write_text("\n".join(LOG) + "\n"); return 1
        D[key], LD[key], Y[key] = k, l, ys; M[key] = {c: {"label": v[0], "unit": v[1]} for c, v in m.items()}
        o, t, ov, bad = control(kind, key, k, l, ys); tok += o; tot += t; over += ov; allbad += bad
        log(name, len(rows), "filas,", len(k), "distritos, años", ys[0] if ys else "-", "-", ys[-1] if ys else "-", "|", "control %d de %d, %d desbordes" % (o, t, ov))
    for b in allbad[:25]: log(*b)
    log("control total: %d de %d cuadran, %d desbordes" % (tok, tot, over))
    if tot < 500 or tok < 0.85 * tot or over > 0.01 * max(tot, 1): log("FALLO: el control no cuadra, no se escribe nada"); logf.write_text("\n".join(LOG) + "\n"); return 1
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "destatis", "name": "Statistische Ämter des Bundes und der Länder, Regionaldatenbank Deutschland", "url": "https://www.regionalstatistik.de/", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"}
    out.mkdir(parents=True, exist_ok=True); per = {}
    for key in D:
        ys = Y[key]
        for ags, d in D[key].items():
            land = LAND.get(ags[:2])
            if not land: continue
            e = per.setdefault(land, {}).setdefault(ags, {"n": d["n"], "t": {}})
            clean = {}
            for c, meas in d["t"].items():
                mm = {m: [ser.get(y) for y in ys] for m, ser in meas.items()}
                mm = {m: arr for m, arr in mm.items() if any(x is not None for x in arr)}
                if mm: clean[c] = mm
            if clean: e["t"][key] = clean
    n = 0
    for land in sorted(per):
        doc = {"schemaVersion": 1, "generatedAt": now, "source": src, "land": land, "years": Y, "kreise": per[land]}
        (out / (land + ".json")).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8"); n += len(per[land])
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "years": Y, "lands": sorted(per), "tables": {k: nme for k, nme, *_ in TABLES}, "measures": M}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d distritos en %d Länder, %d KB" % (n, len(per), sum(f.stat().st_size for f in out.glob("*.json")) // 1024))
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())

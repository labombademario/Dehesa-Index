#!/usr/bin/env python3
"""Galicia: primera venta de pesca fresca y marisqueo por lonja y especie, 2003-ultimo ano (Xunta de Galicia, Consellería do Mar, «Pesca de Galicia») -> data/gal-lonjas.json
Fuente: https://www.pescadegalicia.gal/gl/descargas (seccion «Pesca fresca»: un CSV por ano con cada nota de primera venta agregada por dia, especie y lonja; ';' como separador, coma decimal,
UTF-8 con BOM; campos: fecha, grupo biologico, codigo FAO, nombre gallego, provincia, zona, lonja, kg, euros, euros/kg). El aviso legal del portal permite reutilizar la informacion (uso comercial
y no comercial) citando la fuente y sin desnaturalizar el contenido.
Nada se estima: se suman las filas tal cual; los anos antiguos se conservan del fichero anterior (solo se vuelven a descargar los dos ultimos anos, o todos con --full).
Se guarda, por ano: kg y euros de cada lonja, de cada especie (codigo FAO) y por mes, y para el ultimo ano el desglose lonja x especie. El precio medio es euros / kg (calculo de Dehesa Index).
Comprobaciones (si falla una no se escribe nada): cada fila tiene 10 campos, fecha valida del ano del fichero, cifras numericas no negativas, al menos 20 lonjas y 100 especies por ano,
entre 70.000 y 250.000 t y entre 150 y 700 M euros al ano, precio medio global entre 0,5 y 20 euros/kg, la suma por lonja = por especie = por mes, y nunca menos anos que los ya publicados.
Uso: update-gal-lonjas.py [--out FICHERO.json] [--full] [--csv ANO=FICHERO.csv ...]   (--csv: lee ficheros locales, sin red; solo pruebas)"""
import argparse, csv, datetime, io, json, re, subprocess, sys, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "gal-lonjas.json"
LOGF = ROOT / "data" / "gal-lonjas-log.txt"
BASE = "https://www.pescadegalicia.gal"
PAGE = BASE + "/gl/descargas"
UA = "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"
GROUPS = {"Peixes", "Bivalvos", "Cefalópodos", "Crustáceos", "Equinodermos", "Resto das descargas", "Algas", "Poliquetos", "Gasterópodos"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def curl(u, t=300, tries=4):
    last = None
    for i in range(tries):
        try:
            r = subprocess.run(["curl", "-sS", "--compressed", "-L", "-m", str(t), "-A", UA, u], capture_output=True)
            if r.returncode == 0 and len(r.stdout) > 1000: return r.stdout
            last = (r.stderr.decode("utf8", "replace") or "respuesta vacia").strip()[:160]
        except Exception as e: last = str(e)
        time.sleep(10 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-60:], last))
def num(s):
    s = (s or "").strip()
    if not s: raise ValueError("cifra vacia")
    v = float(s.replace(".", "").replace(",", "."))
    if v < 0: raise ValueError("cifra negativa %r" % s)
    return v
def clean(n): return re.sub(r"\.$", "", re.sub(r"\s+", " ", n.strip()))
def parse(raw, year):
    """bytes del CSV de un ano -> dict(lonjas, species, months, cells) con sumas de kg y euros; lanza ValueError si algo no cuadra"""
    text = raw.decode("utf-8-sig")
    L, S, M, C, meta = {}, {}, {}, {}, {}
    n = 0
    for r in csv.reader(io.StringIO(text, newline=""), delimiter=";"):
        if not r: continue
        if len(r) != 10: raise ValueError("fila con %d campos: %r" % (len(r), r[:3]))
        d, g, fao, nm, prov, zone, lon, kg, eur, pr = [x.strip() for x in r]
        try: dt = datetime.datetime.strptime(d, "%d/%m/%Y")
        except ValueError: raise ValueError("fecha no valida %r" % d)
        if dt.year != year: raise ValueError("fecha %s fuera del ano %d" % (d, year))
        if g not in GROUPS: raise ValueError("grupo biologico desconocido %r" % g)
        if not fao or not lon or prov not in ("A Coruña", "Lugo", "Pontevedra"): raise ValueError("fila incompleta o provincia desconocida: %r" % r[:7])
        k, e = num(kg), num(eur)
        lon = clean(lon); zone = re.sub(r"\s+", " ", zone)
        for D, key in ((L, lon), (S, fao), (M, dt.month)):
            x = D.setdefault(key, [0.0, 0.0]); x[0] += k; x[1] += e
        c = C.setdefault((lon, fao), [0.0, 0.0]); c[0] += k; c[1] += e
        meta.setdefault(("l", lon), (prov, zone)); meta.setdefault(("s", fao), (nm, g))
        n += 1
    if n < 1000: raise ValueError("%d: muy pocas filas (%d)" % (year, n))
    return {"lonjas": L, "species": S, "months": M, "cells": C, "meta": meta, "rows": n}
def check_year(y, d):
    tk = sum(v[0] for v in d["lonjas"].values()); te = sum(v[1] for v in d["lonjas"].values())
    if len(d["lonjas"]) < 20 or len(d["species"]) < 100: raise ValueError("%d: %d lonjas y %d especies" % (y, len(d["lonjas"]), len(d["species"])))
    if not 70e6 <= tk <= 250e6: raise ValueError("%d: %.0f kg fuera de rango" % (y, tk))
    if not 150e6 <= te <= 700e6: raise ValueError("%d: %.0f euros fuera de rango" % (y, te))
    if not 0.5 <= te / tk <= 20: raise ValueError("%d: precio medio %.2f fuera de rango" % (y, te / tk))
    for k in ("species", "months"):
        a = sum(v[0] for v in d[k].values()); b = sum(v[1] for v in d[k].values())
        if abs(a - tk) > 1 or abs(b - te) > 1: raise ValueError("%d: suma por %s (%.0f kg, %.0f euros) distinta de la de lonjas" % (y, k, a, b))
    return tk, te
def discover():
    html = curl(PAGE).decode("utf-8", "replace")
    ys = sorted({int(x) for x in re.findall(r"/descargas/pescafresca/pescafresca(\d{4})\.csv", html)})
    if len(ys) < 15 or ys[0] != 2003 or ys != list(range(ys[0], ys[-1] + 1)): raise RuntimeError("lista de anos inesperada: %s" % ys)
    return ys
def r1(x): return round(x, 1)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--full", action="store_true"); ap.add_argument("--csv", nargs="*"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT
    def fail(*m):
        log("FALLO:", *m)
        if not a.csv: LOGF.write_text("\n".join(LOG) + "\n")
        return 1
    old = None
    if out.exists() and not a.full:
        try: old = json.loads(out.read_text())
        except ValueError: old = None
    try:
        if a.csv: files = {int(x.split("=")[0]): Path(x.split("=", 1)[1]).read_bytes() for x in a.csv}; years = sorted(files)
        else: years = discover(); files = None
        keep = {}
        if old:   # anos ya publicados: se conservan salvo los dos ultimos
            for i, y in enumerate(old["years"]):
                if y < years[-1] - 1: keep[y] = i
        D = {}
        for y in years:
            if y in keep: continue
            raw = files[y] if files else curl("%s/descargas/pescafresca/pescafresca%d.csv" % (BASE, y))
            D[y] = parse(raw, y); tk, te = check_year(y, D[y])
            log(y, "filas", D[y]["rows"], "lonjas", len(D[y]["lonjas"]), "especies", len(D[y]["species"]), "kg %.1f mil t" % (tk / 1e6), "euros %.1f M" % (te / 1e6))
    except (RuntimeError, ValueError, KeyError) as e: return fail(str(e))
    # ensamblar: lonjas y especies con series por ano (null donde no hay ventas)
    idx = {y: i for i, y in enumerate(years)}
    lon, spe, mon = {}, {}, {}
    def put(dct, key, i, v, n):
        x = dct.setdefault(key, {"kg": [None] * n, "eur": [None] * n}); x["kg"][i] = r1(v[0]); x["eur"][i] = r1(v[1])
    n = len(years)
    meta_l, meta_s = {}, {}
    if old:
        for o in old["lonjas"]: meta_l[o["n"]] = (o["p"], o["z"])
        for o in old["species"]: meta_s[o["c"]] = (o["n"], o["g"])
        for o in old["lonjas"]:
            for y, i in keep.items():
                if o["kg"][i] is not None: put(lon, o["n"], idx[y], (o["kg"][i], o["eur"][i]), n)
        for o in old["species"]:
            for y, i in keep.items():
                if o["kg"][i] is not None: put(spe, o["c"], idx[y], (o["kg"][i], o["eur"][i]), n)
        for y, i in keep.items():
            for m in range(12):
                k = old["months"]["kg"][(y - old["years"][0]) * 12 + m]
                if k is not None: mon[(y, m + 1)] = (k, old["months"]["eur"][(y - old["years"][0]) * 12 + m])
    for y, d in D.items():
        for k, v in d["lonjas"].items(): put(lon, k, idx[y], v, n)
        for k, v in d["species"].items(): put(spe, k, idx[y], v, n)
        for m, v in d["months"].items(): mon[(y, m)] = (r1(v[0]), r1(v[1]))
        for (t, k), v in d["meta"].items():
            if t == "l": meta_l[k] = v
            else: meta_s[k] = v
    last = years[-1]
    if last not in D: return fail("el ultimo ano no se ha descargado")
    if old and len(years) < len(old["years"]): return fail("menos anos que lo ya publicado")
    cells = {}
    for (lo, fao), v in D[last]["cells"].items(): cells.setdefault(lo, []).append([fao, r1(v[0]), r1(v[1])])
    for k in cells: cells[k].sort(key=lambda r: -r[2])
    lonjas = [{"n": k, "p": meta_l[k][0], "z": meta_l[k][1], "kg": v["kg"], "eur": v["eur"]} for k, v in sorted(lon.items(), key=lambda kv: -(kv[1]["eur"][-1] or 0))]
    species = [{"c": k, "n": meta_s[k][0], "g": meta_s[k][1], "kg": v["kg"], "eur": v["eur"]} for k, v in sorted(spe.items(), key=lambda kv: -(kv[1]["eur"][-1] or 0))]
    mk, me = [], []
    for y in years:
        for m in range(1, 13):
            v = mon.get((y, m)); mk.append(v[0] if v else None); me.append(v[1] if v else None)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "xunta_pesca", "url": PAGE, "license": "Reutilizacion con cita de la fuente (aviso legal de Pesca de Galicia)"},
           "years": years, "units": {"kg": "kg", "eur": "EUR"}, "lonjas": lonjas, "species": species, "months": {"from": "%d-01" % years[0], "kg": mk, "eur": me}, "cells": {"year": last, "rows": cells}}
    # coherencia final entre ensamblado y cada ano
    for i, y in enumerate(years):
        tk = sum(o["kg"][i] or 0 for o in lonjas); ts = sum(o["kg"][i] or 0 for o in species); tm = sum((mk[i * 12 + m] or 0) for m in range(12))
        if abs(tk - ts) > 5 + tk * 1e-6 or abs(tk - tm) > 5 + tk * 1e-6: return fail("%d: sumas finales distintas (%.0f %.0f %.0f)" % (y, tk, ts, tm))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", out, out.stat().st_size, "bytes;", len(lonjas), "lonjas,", len(species), "especies,", len(years), "anos")
    if not a.csv: LOGF.write_text("\n".join(LOG) + "\n")
    return 0
if __name__ == "__main__":
    sys.exit(main())

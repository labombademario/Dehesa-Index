#!/usr/bin/env python3
"""USDA NASS Cattle on Feed (informe mensual, texto plano) -> data/cattle-on-feed.json.
URL: https://www.nass.usda.gov/Publications/Todays_Reports/reports/cofdMMYY.txt  (MM/YY = mes de publicacion).
Por informe se guardan SOLO cifras publicadas (miles de cabezas, cebaderos de 1.000+ cabezas): existencias al inicio y al final del mes,
entradas, salidas (fed cattle marketed) y otras bajas, con la misma fila del ano anterior; y la tabla por estado. Nada se calcula ni se rellena:
lo que no se lee con seguridad se descarta y el informe NO se guarda.
Un informe solo entra si pasa las comprobaciones de coherencia (existencias iniciales + entradas - salidas - bajas = finales, el total de la tabla por
estado coincide con el nacional, la suma de estados cuadra con el total). Si falla la descarga o el formato cambia, el fichero anterior se conserva.
Primera ejecucion (o hueco): recupera hasta 24 meses atras. Uso: python3 scripts/update-cattle-on-feed.py"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "cattle-on-feed.json"
BASE = "https://www.nass.usda.gov/Publications/Todays_Reports/reports/cofd%02d%02d.txt"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "text/plain"}
MONTHS = {m: i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
ROW = re.compile(r"^(On feed (\w+) 1|Placed on feed during (\w+)|Fed cattle marketed during (\w+)|Other disappearance during (\w+)) \.+:\s+(\S+)\s+(\S+)\s+(\S+)\s*$")
SROW = re.compile(r"^([A-Za-z][A-Za-z .]*?) \.{2,}:\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$")
def num(t):
    t = t.replace(",", "")
    return int(t) if t.isdigit() else None
def parse(txt):
    """Devuelve el informe como dict o lanza ValueError con el motivo."""
    mr = re.search(r"Released (\w+) (\d{1,2}), (\d{4})", txt)
    if not mr or mr.group(1) not in MONTHS: raise ValueError("sin fecha de publicacion")
    release = datetime.date(int(mr.group(3)), MONTHS[mr.group(1)], int(mr.group(2)))
    segs = re.split(r"\n(?=Cattle on Feed Inventory)", txt)
    if len(segs) < 4: raise ValueError("faltan tablas (%d bloques)" % len(segs))
    nat, st = segs[1], segs[3]
    mh = re.search(r"United States:\s+(\w+) 1, (\d{4}) and (\d{4})", nat)
    if not mh or mh.group(1) not in MONTHS: raise ValueError("cabecera de la tabla nacional no reconocida")
    inv = datetime.date(int(mh.group(3)), MONTHS[mh.group(1)], 1)
    prev_m = (inv.replace(day=1) - datetime.timedelta(days=1))
    rows = []
    for ln in nat.split("\n"):
        m = ROW.match(ln.strip()) if ln.strip() else None
        if m: rows.append(m)
    if len(rows) < 5: raise ValueError("tabla nacional incompleta (%d filas)" % len(rows))
    rows = rows[:5]
    for i, m in enumerate(rows):  # grupos: 2 = "On feed <mes> 1", 3/4/5 = entradas/salidas/bajas "during <mes>"
        grp = [2, 3, 4, 5, 2][i]; mon = (inv if i == 4 else prev_m).strftime("%B")
        if m.group(grp) != mon: raise ValueError("mes de la fila %d (%s) no es %s" % (i + 1, m.group(grp), mon))
    vals = []
    for m in rows:
        a, b, p = num(m.group(6)), num(m.group(7)), num(m.group(8))
        if a is None or b is None: raise ValueError("valor no numerico en la tabla nacional")
        vals.append((a, b, p))
    keys = ["onFeedStart", "placed", "marketed", "otherDisappearance", "onFeedEnd"]
    national = {"yearAgo": {k: v[0] for k, v in zip(keys, vals)}, "current": {k: v[1] for k, v in zip(keys, vals)}, "pctYearAgo": {k: v[2] for k, v in zip(keys, vals)}}
    c = national["current"]
    if abs(c["onFeedStart"] + c["placed"] - c["marketed"] - c["otherDisappearance"] - c["onFeedEnd"]) > 2: raise ValueError("el balance de existencias no cuadra")
    y = national["yearAgo"]
    if abs(y["onFeedStart"] + y["placed"] - y["marketed"] - y["otherDisappearance"] - y["onFeedEnd"]) > 2: raise ValueError("el balance del ano anterior no cuadra")
    states, us = [], None
    for ln in st.split("\n"):
        m = SROW.match(ln.strip()) if ln.strip() else None
        if not m or m.group(1).strip().lower() in ("item", "state"): continue
        v = [num(m.group(i)) for i in range(2, 7)]
        if v[0] is None or v[1] is None or v[2] is None: continue
        r = {"state": m.group(1).strip(), "yearAgo": v[0], "prevMonth": v[1], "current": v[2], "pctYearAgo": v[3], "pctPrevMonth": v[4]}
        if r["state"] == "United States": us = r
        else: states.append(r)
    if not us or len(states) < 5: raise ValueError("tabla por estado incompleta")
    if abs(us["current"] - c["onFeedEnd"]) > 1: raise ValueError("total por estado (%s) distinto del nacional (%s)" % (us["current"], c["onFeedEnd"]))
    if abs(us["prevMonth"] - c["onFeedStart"]) > 1: raise ValueError("existencias del mes anterior distintas entre tablas")
    if abs(us["yearAgo"] - y["onFeedEnd"]) > 1: raise ValueError("ano anterior distinto entre tablas")
    if abs(sum(s["current"] for s in states) - us["current"]) > max(3, us["current"] * 0.005): raise ValueError("la suma de estados no cuadra con el total")
    return {"release": release.isoformat(), "inventoryDate": inv.isoformat(), "flowMonth": prev_m.strftime("%Y-%m"), "national": national, "states": states + [us]}
def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60) as r: return r.read().decode("latin-1")
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            last = e
        except Exception as e: last = e
        time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def merge(prev, new):
    d = {r["inventoryDate"]: r for r in prev}
    for r in new: d[r["inventoryDate"]] = r
    return [d[k] for k in sorted(d)]
def main():
    try: prev = json.loads(OUT.read_text(encoding="utf-8")).get("reports", [])
    except Exception: prev = []
    today = datetime.date.today(); span = 3 if len(prev) >= 12 else 24
    got, notes, y, m = [], [], today.year, today.month
    for _ in range(span):
        url = BASE % (m, y % 100)
        try:
            txt = get(url)
            if txt is None: pass  # aun no publicado (o fuera de archivo)
            else:
                r = parse(txt); r["url"] = url; got.append(r); print("OK", url, r["inventoryDate"])
        except Exception as e: notes.append("%s: %s" % (url.rsplit("/", 1)[-1], e)); print("FALLO", notes[-1])
        m -= 1
        if m < 1: y, m = y - 1, 12
    if not got: print("ningun informe leido: no se escribe nada"); return 1
    rep = merge(prev, got)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "USDA NASS, Cattle on Feed", "url": "https://www.nass.usda.gov/Publications/Todays_Reports/reports/", "license": "US Government work (public domain); credit: USDA NASS"},
           "unit": "1,000 head", "scope": "Feedlots with capacity of 1,000 or more head", "notes": notes, "reports": rep}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT.name, len(rep), "informes")
    return 0
if __name__ == "__main__": sys.exit(main())

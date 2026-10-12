#!/usr/bin/env python3
"""Gasoleo B (gasoleo agricola) en Espana: precio en las gasolineras, por provincia -> data/es-gasoleo-b.json
Fuente: Ministerio para la Transicion Ecologica y el Reto Demografico (MITECO), precios de carburantes en las estaciones de servicio
(Geoportal de Gasolineras, servicio REST de sedeaplicaciones.minetur.gob.es). Licencia CC BY 4.0 segun el catalogo de datos abiertos del
MITECO (conjunto «Precio de carburantes en las gasolineras espanolas»). Cada estacion comunica sus precios de venta al publico (con impuestos).
Dehesa Index calcula la mediana por provincia y para toda Espana del gasoleo B y, para comparar, del gasoleo A (automocion) en las mismas fechas.
Historico: el servicio da los precios de cualquier dia pasado (EstacionesTerrestresHist). Se reconstruye un punto al mes (dia 15) desde 2007 y uno
por semana (lunes) desde 2023; despues, un punto por dia en cada ejecucion. La reconstruccion se hace por tandas con limite de tiempo
(BACKFILL_MIN minutos, 25 por defecto) y sigue en la ejecucion siguiente. Si la descarga del dia falla, el fichero anterior se conserva.
Uso: python3 scripts/update-es-gasoleo-b.py"""
import datetime, json, os, statistics, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "es-gasoleo-b.json"
B = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
PROVS = ["%02d" % i for i in range(1, 53)]
TODAY = datetime.date.today()
def get(u, t=240):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read().decode("utf-8-sig"))
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def num(s):
    try: v = float(str(s).replace(",", "."))
    except Exception: return None
    return v if 0.3 < v < 4.0 else None   # fuera de esto es un error de tecleo de la estacion
def products():
    L = get(B + "Listados/ProductosPetroliferos/")
    ids = {}
    for p in L:
        n = (p.get("NombreProducto") or "").strip().lower()
        if n in ("gasóleo b", "gasoleo b"): ids["b"] = p["IDProducto"]
        if n in ("gasóleo a habitual", "gasoleo a habitual", "gasóleo a", "gasoleo a"): ids.setdefault("a", p["IDProducto"])
    if set(ids) != {"a", "b"}: raise RuntimeError("productos no encontrados en el listado: %s" % [p.get("NombreProducto") for p in L])
    return ids
def summary(rows):
    """rows: [(provincia, precio)] -> (mediana nacional, n, {prov: [mediana, n, minimo]})"""
    by = {}
    for p, v in rows: by.setdefault(p, []).append(v)
    allv = [v for _, v in rows]
    if not allv: return None, 0, {}
    return round(statistics.median(allv), 3), len(allv), {p: [round(statistics.median(v), 3), len(v), round(min(v), 3)] for p, v in sorted(by.items())}
def day_rows(date, pid):
    """precios de un producto en una fecha (None = hoy) -> [(provincia, precio)]"""
    u = B + ("EstacionesTerrestres/FiltroProducto/%s" % pid if date is None else "EstacionesTerrestresHist/FiltroProducto/%s/%s" % (date.strftime("%d-%m-%Y"), pid))
    d = get(u); out = []
    for e in d.get("ListaEESSPrecio") or []:
        v = num(e.get("PrecioProducto")); p = (e.get("IDProvincia") or "").strip().zfill(2)
        if v is not None and p in PROVS: out.append((p, v))
    return d.get("Fecha"), out
def wanted():
    ds = []
    y, m = 2007, 1
    while (y, m) < (2023, 1):
        ds.append(datetime.date(y, m, 15)); m += 1
        if m == 13: y, m = y + 1, 1
    d = datetime.date(2023, 1, 2)
    while d < TODAY: ds.append(d); d += datetime.timedelta(days=7)
    return ds
def point(date, ids):
    fb, rb = day_rows(date, ids["b"]); fa, ra = day_rows(date, ids["a"])
    mb, nb, pb = summary(rb); ma, na, pa = summary(ra)
    if nb < 300: raise RuntimeError("solo %d estaciones con gasoleo B en %s" % (nb, date or "hoy"))
    return {"b": mb, "nb": nb, "a": ma, "na": na, "pb": pb, "pa": {k: v[0] for k, v in pa.items()}}
def main():
    try: doc = json.loads(OUT.read_text())
    except Exception: doc = None
    hist = {h[0]: h for h in (doc or {}).get("history", {}).get("rows", [])}   # fecha -> [fecha, B, A, nB, {prov: B}]
    try: ids = products()
    except Exception as e: print("FALLO listado de productos:", e); return 1 if doc is None else 0
    try: today = point(None, ids)
    except Exception as e: print("FALLO precios de hoy:", e); return 1 if doc is None else 0
    hist[TODAY.isoformat()] = [TODAY.isoformat(), today["b"], today["a"], today["nb"], {p: v[0] for p, v in today["pb"].items()}]
    # reconstruccion del historico por tandas
    todo = [d for d in wanted() if d.isoformat() not in hist]
    budget = time.time() + 60 * float(os.environ.get("BACKFILL_MIN", "25")); done = 0; fails = 0
    def one(d):
        try: return d, point(d, ids), None
        except Exception as e: return d, None, str(e)[:120]
    with ThreadPoolExecutor(4) as ex:
        for i in range(0, len(todo), 8):
            if time.time() > budget: break
            for d, p, err in ex.map(one, todo[i:i + 8]):
                if err: fails += 1; print("AVISO", d, err); continue
                hist[d.isoformat()] = [d.isoformat(), p["b"], p["a"], p["nb"], {k: v[0] for k, v in p["pb"].items()}]; done += 1
    # los puntos diarios de mas de 400 dias se aclaran: solo quedan los de la rejilla mensual/semanal (el fichero no crece sin fin)
    keep = set(d.isoformat() for d in wanted()); cut = (TODAY - datetime.timedelta(days=400)).isoformat()
    rows = [hist[k] for k in sorted(hist) if k >= cut or k in keep]
    # control: un salto de mas de 0,35 EUR/l en la mediana nacional entre dos puntos seguidos es sospechoso (2022 llego a ~0,2 en una semana)
    for a, b in zip(rows, rows[1:]):
        if a[1] and b[1] and abs(b[1] - a[1]) > 0.35 and (datetime.date.fromisoformat(b[0]) - datetime.date.fromisoformat(a[0])).days <= 8:
            print("FALLO salto sospechoso", a[0], a[1], "->", b[0], b[1]); return 1 if doc is None else 0
    left = len([d for d in wanted() if d.isoformat() not in hist])
    out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": TODAY.isoformat(),
           "unit": "EUR/l", "source": {"name": "MITECO, precios de carburantes en las estaciones de servicio (Geoportal de Gasolineras)", "url": "https://geoportalgasolineras.es/",
                                      "api": B, "license": "CC BY 4.0", "catalog": "https://catalogo.datosabiertos.miteco.gob.es/catalogo/dataset/214e0895-b3aa-4662-8ebe-18134c21fb45"},
           "latest": {"date": TODAY.isoformat(), "b": today["b"], "nb": today["nb"], "a": today["a"], "na": today["na"],
                      "provinces": {p: v + [today["pa"].get(p)] for p, v in today["pb"].items()}},
           "provFields": ["medianB", "stationsB", "minB", "medianA"],
           "history": {"fields": ["date", "medianB", "medianA", "stationsB", "provincesB"], "rows": rows, "pending": left}}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("es-gasoleo-b.json", OUT.stat().st_size, "bytes; hoy B %.3f (%d estaciones) A %.3f; historico %d puntos (%d nuevos, %d fallos, %d pendientes)" % (today["b"], today["nb"], today["a"], len(rows), done, fails, left))
    return 0
if __name__ == "__main__": sys.exit(main())

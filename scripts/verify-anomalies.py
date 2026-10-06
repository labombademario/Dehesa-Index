#!/usr/bin/env python3
"""Verifica las anomalias registradas en data/data-anomalies.json contra la FUENTE PRIMARIA.

Para cada anomalia con bloque `verifier` descarga la fuente oficial (Eurostat / Statistics Canada / ABS), compara los periodos indicados con los
valores que publica Dehesa y deja el resultado en `lastCheck`:
  REPRODUCED   los valores publicados por la fuente coinciden con los nuestros (y, en Eurostat, ninguno lleva marca 'no aplicable/confidencial'):
               la cifra es real tal como la publica la fuente. Con --apply la anomalia pasa a KNOWN_VERIFIED_ANOMALY con evidence/verifiedAt/sourceUrl.
  MISMATCH     alguna cifra difiere: error de unidad, serie, parseo o transformacion. NO se promueve ni se silencia: hay que corregir el pipeline.
  FLAGGED      Eurostat marca algun periodo como no aplicable/confidencial: el 0 no es un dato; hay que corregir el pipeline (no se promueve).
  UNAVAILABLE  la fuente no respondio o no devolvio los periodos: la anomalia sigue UNEXPLAINED (nada se asume).
Necesita red (se ejecuta en CI: .github/workflows/verify-anomalies.yml). Sin red sale con codigo 2 y no cambia nada.
Uso: verify-anomalies.py [--apply] [--fixtures DIR]   (--fixtures: respuestas guardadas, solo para tests)"""
import argparse, csv, datetime, io, json, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"; ANOM = DATA / "data-anomalies.json"
TOL = 0.0006          # nuestras cifras van redondeadas a 3 decimales
BAD_FLAGS = ("z", "c")  # Eurostat: z = no aplicable, c = confidencial
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}


# ---------------------------------------------------------------- red (sustituible por fixtures en tests)
def http(url, headers=None, tries=3, timeout=180):
    last = None
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=dict(UA, **(headers or {}))), timeout=timeout).read()
        except Exception as e:
            last = e; time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:200])


# ---------------------------------------------------------------- Eurostat (JSON-stat)
def eurostat_series(j, time_dim="time"):
    """{periodo: (valor|None, marca|None)} de una consulta que deja una sola serie (el resto de dimensiones con 1 categoria)."""
    ids, size = j["id"], j["size"]; cats = {}
    for d in ids:
        idx = j["dimension"][d]["category"]["index"]
        cats[d] = [k for k, _ in sorted(idx.items(), key=lambda kv: kv[1])] if isinstance(idx, dict) else list(idx)
    others = [d for d in ids if d != time_dim]
    if any(len(cats[d]) != 1 for d in others): raise ValueError("la consulta no deja una sola serie: " + ",".join(d for d in others if len(cats[d]) != 1))
    val, st = j.get("value", {}), j.get("status", {})
    if isinstance(val, list): val = {str(i): v for i, v in enumerate(val) if v is not None}
    out = {}
    for pos, per in enumerate(cats[time_dim]):
        v = val.get(str(pos)); f = st.get(str(pos)) if isinstance(st, dict) else None
        out[per] = (None if v is None else float(v), f)
    return out


def fetch_eurostat(v, fx):
    q = "lang=EN&" + "&".join("%s=%s" % (k, urllib.parse.quote(x)) for k, x in v["filters"].items())
    url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/%s?%s" % (v["dataset"], q)
    raw = fx("eurostat-%s" % v["filters"].get("meat", v["dataset"]), url)
    return eurostat_series(json.loads(raw)), url


# ---------------------------------------------------------------- Statistics Canada (tabla completa CSV, como el pipeline)
SC = {"units": 1, "tens": 10, "hundreds": 100, "thousands": 1e3, "millions": 1e6, "billions": 1e9}


def statcan_points(rows, filt, product_col_prefix="North American Product"):
    """{periodo: (valor CAD millones, None)} para el producto y las dimensiones indicadas (misma conversion que update-canada-stats.py)."""
    import re
    out = {}
    for r in rows:
        ck = [k for k in r if k.startswith(product_col_prefix)][0]
        nm = re.sub(r"\s*\[.*?\]\s*$", "", r[ck]).strip()
        if nm != filt["product"] or any(r.get(k) != x for k, x in filt.items() if k != "product"): continue
        if r.get("VALUE") in ("", None): continue
        out[r["REF_DATE"]] = (float(r["VALUE"]) * SC.get((r.get("SCALAR_FACTOR") or "units").strip().lower(), 1) / 1e6, r.get("STATUS") or None)
    return out


def fetch_statcan(v, fx):
    url = "https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/%d/en" % v["pid"]
    z = zipfile.ZipFile(io.BytesIO(fx("statcan-%d" % v["pid"], url, big=True)))
    name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
    return statcan_points(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")), v["filters"]), "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=%d01" % (v["pid"] // 100)


def statcan_table_points(rows, filters, prefix, div):
    """{periodo: (valor, estado)} de una tabla de StatCan filtrando por columnas (igualdad exacta o prefijo); valor = VALUE x factor de escala / div (misma conversion que update-canada-stats.py)."""
    out = {}
    for r in rows:
        if any(r.get(k) != x for k, x in filters.items()) or any(not (r.get(k) or "").startswith(x) for k, x in prefix.items()): continue
        if r.get("VALUE") in ("", None): continue
        out[r["REF_DATE"]] = (float(r["VALUE"]) * SC.get((r.get("SCALAR_FACTOR") or "units").strip().lower(), 1) / div, r.get("STATUS") or None)
    return out


def fetch_statcan_table(v, fx):
    url = "https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/%d/en" % v["pid"]
    z = zipfile.ZipFile(io.BytesIO(fx("statcan-%d" % v["pid"], url, big=True)))
    name = [n for n in z.namelist() if n.endswith(".csv") and "MetaData" not in n][0]
    pts = statcan_table_points(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")), v["filters"], v.get("prefix", {}), v.get("div", 1))
    return pts, "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=%d01" % (v["pid"] // 100)


# ---------------------------------------------------------------- ABS (SDMX CSV)
def abs_points(rows):
    return {r["TIME_PERIOD"]: (float(r["OBS_VALUE"]) * 10 ** int(r.get("UNIT_MULT") or 0) / 1e6, r.get("OBS_STATUS") or None) for r in rows if r.get("OBS_VALUE") not in (None, "")}


def abs_origins(rows, period, dim="COUNTRY_ORIGIN", top=3):
    """Principales paises de origen de un mes (A$ millones), excluyendo el total."""
    acc = {}
    for r in rows:
        if r.get("TIME_PERIOD") != period or r.get("OBS_VALUE") in (None, ""): continue
        c = (r.get(dim) or "").split(":", 1); code = c[0].strip(); nm = (c[1] if len(c) > 1 else c[0]).strip()
        if code in ("TOT", ""): continue
        acc[nm] = acc.get(nm, 0) + float(r["OBS_VALUE"]) * 10 ** int(r.get("UNIT_MULT") or 0) / 1e6
    return sorted(acc.items(), key=lambda kv: -kv[1])[:top]


def fetch_abs(v, fx):
    base = "https://data.api.abs.gov.au/rest/data/%s/" % v["dataset"]
    ps = sorted(v["periods"]); q = "?format=csvfilewithlabels&startPeriod=%s&endPeriod=%s" % (ps[0], ps[-1])
    rows = list(csv.DictReader(io.StringIO(fx("abs-" + v["dataset"], base + v["key"] + q).decode("utf-8-sig"))))
    pts = abs_points(rows); ctx = []
    for per in v.get("origins", []):
        key = v["key"].split(".")[0] + ".." + ".".join(v["key"].split(".")[2:])  # todos los paises de origen
        orows = list(csv.DictReader(io.StringIO(fx("abs-origin-" + per, base + key + "?format=csvfilewithlabels&startPeriod=%s&endPeriod=%s" % (per, per)).decode("utf-8-sig"))))
        top = abs_origins(orows, per)
        if top: ctx.append("%s: principales origenes %s" % (per, ", ".join("%s %.1f" % t for t in top)))
    return pts, base + v["key"], ctx


# ---------------------------------------------------------------- Defra (hojas ODS de GOV.UK)
def fetch_defra(v, fx):
    """Columna de una hoja del ODS oficial de Defra: {periodo: (valor|None, None)}. Reutiliza el parser de update-uk-defra.py (misma tabla, mismas filas)."""
    import importlib.util, pandas as pd
    sp = importlib.util.spec_from_file_location("defra", ROOT / "scripts" / "update-uk-defra.py"); D = importlib.util.module_from_spec(sp); sp.loader.exec_module(D)
    if getattr(fx, "fixtures", False): raw = fx("defra-" + v["dataset"] + ".ods", "")
    else: raw = fx("defra-" + v["dataset"], D.find(v["slug"], v["pattern"])[0])
    xl = pd.ExcelFile(io.BytesIO(raw), engine="odf"); names, rows = D.table(xl.parse(v["sheet"], header=None), v["kindSheet"])
    hit = [k for k, c in enumerate(names) if c == v["column"]]
    if len(hit) != 1: raise RuntimeError("columna ausente o ambigua: %s" % v["column"])
    pts = {}
    for r in rows:
        x = D.num(r[hit[0]]); p = D.per(r, v["kindSheet"])
        pts[p] = (None if x is None else x, None)
    return pts, "https://www.gov.uk/government/statistical-data-sets/" + v["slug"]


# ---------------------------------------------------------------- comparacion
def compare(ours, src, periods):
    """Filas {period, ours, source, flag, match} para cada periodo pedido; match=None si falta algun lado."""
    rows = []
    for p in periods:
        o = ours.get(p); s = src.get(p)
        sv, fl = (s if s else (None, None))
        rows.append({"period": p, "ours": o, "source": None if sv is None else round(sv, 3), "flag": fl,
                     "match": None if (o is None or sv is None) else abs(o - sv) <= TOL})
    return rows


def verdict(rows, kind):
    if not rows or any(r["match"] is None for r in rows): return "UNAVAILABLE"
    if any(not r["match"] for r in rows): return "MISMATCH"
    if kind == "eurostat" and any(c in (r["flag"] or "") for r in rows for c in BAD_FLAGS): return "FLAGGED"
    return "REPRODUCED"


def our_points(a):
    cc, sid = a["series"].split("/", 1)
    for s in json.loads((DATA / a["file"]).read_text(encoding="utf-8"))["countries"][cc]["series"]:
        if s["id"] == sid: return {p: v for p, v in s["points"]}
    raise KeyError(a["series"])


def check(a, fx, now):
    v = a["verifier"]; kind = v["kind"]; ctx = []
    try:
        if kind == "eurostat":
            src, url = fetch_eurostat(v, fx)
            if v.get("parent"):
                ps, _ = fetch_eurostat({"dataset": v["dataset"], "filters": dict(v["filters"], **v["parent"])}, fx)
                ctx.append("%s: %s" % (v["parent"]["meat"], ", ".join("%s=%s" % (p, ps[p][0]) for p in v["periods"] if p in ps)))
        elif kind == "statcan": src, url = fetch_statcan(v, fx)
        elif kind == "statcan_table": src, url = fetch_statcan_table(v, fx)
        elif kind == "abs": src, url, ctx = fetch_abs(v, fx)
        elif kind == "defra_ods": src, url = fetch_defra(v, fx)
        else: raise ValueError("verificador desconocido " + kind)
    except Exception as e:
        return {"at": now, "result": "UNAVAILABLE", "detail": "fuente no disponible: %s" % str(e)[:160], "rows": []}, None
    rows = compare(our_points(a), src, v["periods"])
    return {"at": now, "result": verdict(rows, kind), "sourceUrl": url, "rows": rows, "context": ctx}, url


def evidence(a, res):
    r = res["rows"]; vals = "; ".join("%s: %s" % (x["period"], x["source"]) for x in r)
    fl = sorted({x["flag"] for x in r if x["flag"]})
    s = "Comparado con la fuente primaria el %s: los %d periodos revisados coinciden exactamente con los que publica la fuente (%s)." % (res["at"][:10], len(r), vals)
    if a["verifier"]["kind"] == "eurostat": s += " Marcas de calidad de Eurostat en esos periodos: %s." % (", ".join(fl) if fl else "ninguna (ni 'no aplicable' ni 'confidencial')")
    if res.get("context"): s += " Contexto de la fuente: " + " | ".join(res["context"]) + "."
    return s + " Que la cifra sea la publicada no explica por si sola su causa: la hipotesis se mantiene como hipotesis."


def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument("--apply", action="store_true"); ap.add_argument("--fixtures"); ap.add_argument("--data", help="directorio data alternativo (tests)"); o = ap.parse_args(argv)
    global DATA, ANOM
    if o.data: DATA = Path(o.data); ANOM = DATA / "data-anomalies.json"
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    if o.fixtures:
        def fx(name, url, big=False):
            f = Path(o.fixtures) / name
            if not f.exists(): raise RuntimeError("sin fixture " + name)
            return f.read_bytes()
    else:
        def fx(name, url, big=False):
            if big:  # tabla completa de StatCan: la URL real sale de la respuesta de la API
                return http(json.loads(http(url, {"Content-Type": "application/json"}))["object"], timeout=600)
            if "assets.publishing.service.gov.uk" in url: return http(url, timeout=300)
            return http(url, {"Accept": "application/vnd.sdmx.data+csv" if "abs.gov.au" in url else "application/json"})
    fx.fixtures = bool(o.fixtures)
    doc = json.loads(ANOM.read_text(encoding="utf-8")); out = []; unavailable = 0
    for a in doc["anomalies"]:
        if a["status"] != "UNEXPLAINED_ANOMALY" or not a.get("verifier"): continue
        res, url = check(a, fx, now); a["lastCheck"] = {k: res[k] for k in ("at", "result") if k in res} | {"detail": res.get("detail") or "; ".join("%s %s/%s" % (x["period"], x["ours"], x["source"]) for x in res["rows"])}
        print("%-34s %-12s %s" % (a["series"], res["result"], a["lastCheck"]["detail"][:150])); unavailable += res["result"] == "UNAVAILABLE"
        if res["result"] == "REPRODUCED" and o.apply:
            a.update({"status": "KNOWN_VERIFIED_ANOMALY", "evidence": evidence(a, res), "verifiedAt": now[:10], "sourceUrl": url})
            a.pop("nextAction", None); a["verification"] = "Verificada contra la fuente primaria por scripts/verify-anomalies.py (ver evidence)."
        out.append(res)
    if out: ANOM.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 2 if out and unavailable == len(out) else (1 if any(r["result"] in ("MISMATCH", "FLAGGED") for r in out) else 0)


if __name__ == "__main__":
    sys.exit(main())

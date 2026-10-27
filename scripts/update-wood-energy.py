#!/usr/bin/env python3
"""Energia de la madera: precio de los pellets y de la biomasa forestal -> data/wood-energy.json
  EE. UU.: EIA Form EIA-63C (Densified Biomass Fuel Report): precio medio y cantidad de pellets vendidos en el mercado interior y exportados, mensual.
           Los CSV solo traen el año en curso (sin año en el fichero): el año se lee de la frase de la pagina («... in July 2026 ...») y la serie se acumula
           con la que ya hay en el fichero, que es la unica forma de tener historico.
  Finlandia: Estadisticas de Finlandia (StatFin) 12gv (pellet de madera, precio al consumidor con IVA, EUR/t, trimestral: feb-may-ago-nov) y
           12gb (astillas forestales entregadas en produccion de energia, sin IVA, EUR/MWh, trimestral).
Cada serie lleva sus propios periodos. Si una fuente falla se conserva su serie anterior; si fallan las tres, el fichero no se toca.
Uso: python3 scripts/update-wood-energy.py"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "wood-energy.json"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
EIA = "https://www.eia.gov/biofuels/biomass/"
STATFIN = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/ehi/"
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
def http(url, data=None, headers=None, tries=4, timeout=90):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=dict(H, **(headers or {}))), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError("%s: %s" % (url, last))
def merge(old, new):
    """Fusiona dos series {periodo: valor}; manda la nueva (EIA revisa las cifras del año)."""
    m = dict(old); m.update(new); return m
def pack(sid, label, group, freq, unit, currency, vat, d, source, note):
    ps = sorted(d)
    return {"id": sid, "label": label, "group": group, "freq": freq, "unit": unit, "currency": currency, "vat": vat, "periods": ps, "values": [d[p] for p in ps], "source": source, "note": note}
def old_series(old, sid):
    for s in (old or {}).get("series", []):
        if s["id"] == sid: return dict(zip(s["periods"], s["values"]))
    return {}
def parse63c(t7, t8, year):
    dom = {}; domq = {}; exp = {}; expq = {}
    region = None
    for row in csv.reader(io.StringIO(t7)):
        if not row or row[0].startswith(("Note", "N/A", "Source")): continue
        if row[0]: region = row[0]; continue
        if region == "U.S. Total" and len(row) >= 4 and row[1].isdigit():
            p = "%d-%02d" % (year, int(row[1]))
            try: domq[p] = int(row[2]); dom[p] = float(row[3])
            except ValueError: pass          # W = withheld, N/A
    for row in csv.reader(io.StringIO(t8)):
        if len(row) >= 3 and row[0].isdigit():
            p = "%d-%02d" % (year, int(row[0]))
            try: expq[p] = int(row[1]); exp[p] = float(row[2])
            except ValueError: pass
    return dom, domq, exp, expq
def eia_archive(old, year):
    """Rellena años anteriores con el informe de diciembre archivado por la EIA (archive/AAAA/12/csv). Solo años que aun no estan guardados."""
    have = old_series(old, "us-pellet-domestic-price")
    acc = [{}, {}, {}, {}]
    for y in range(2017, year):
        if "%d-12" % y in have: continue
        try:
            t7 = http(EIA + "archive/%d/12/csv/EIA_63C_Table_7.csv" % y, tries=2).decode("cp1252", "replace").lstrip("\ufeff"); t8 = http(EIA + "archive/%d/12/csv/EIA_63C_Table_8.csv" % y, tries=2).decode("cp1252", "replace").lstrip("\ufeff")
        except RuntimeError as e:
            print("aviso: archivo EIA %d no disponible (%s)" % (y, str(e)[:80]), file=sys.stderr); continue
        for k, d in enumerate(parse63c(t7, t8, y)): acc[k].update(d)
    return acc
def eia(old):
    page = http(EIA).decode("utf-8", "replace")
    m = re.search(r"(%s) (20\d\d) (?:were|was|averaged)" % "|".join(MONTHS), page) or re.search(r"in (%s) (20\d\d)" % "|".join(MONTHS), page)
    if not m: raise RuntimeError("no se pudo leer el mes y el año de la pagina de la EIA")
    year = int(m.group(2))
    t7 = http(EIA + "csv/EIA_63C_Table_7.csv").decode("utf-8-sig"); t8 = http(EIA + "csv/EIA_63C_Table_8.csv").decode("utf-8-sig")
    dom, domq, exp, expq = parse63c(t7, t8, year)
    if not dom or not exp: raise RuntimeError("tablas 7 u 8 vacias")
    arch = eia_archive(old, year)
    src = {"name": "U.S. Energy Information Administration, Form EIA-63C Densified Biomass Fuel Report", "url": EIA, "license": "US public domain (EIA)"}
    n1 = "Precio medio de los pellets de biomasa densificada vendidos por los fabricantes de EE. UU."
    arch_for = dict(zip(("us-pellet-domestic-price", "us-pellet-export-price", "us-pellet-domestic-qty", "us-pellet-export-qty"), (arch[0], arch[2], arch[1], arch[3])))
    out = []
    for sid, lab, d, unit, note in (("us-pellet-domestic-price", "Densified biomass fuel (pellets), domestic sales: average price", dom, "USD/t", n1 + " en el mercado interior."),
                                    ("us-pellet-export-price", "Densified biomass fuel (pellets), exports: average price", exp, "USD/t", n1 + " exportados."),
                                    ("us-pellet-domestic-qty", "Densified biomass fuel (pellets), domestic sales: quantity", domq, "t", "Toneladas vendidas en el mercado interior."),
                                    ("us-pellet-export-qty", "Densified biomass fuel (pellets), exports: quantity", expq, "t", "Toneladas exportadas.")):
        out.append(pack(sid, lab, "pellets", "M", unit, "USD" if unit == "USD/t" else None, "n/d", merge(merge(arch_for[sid], old_series(old, sid)), d), src, note + " Años cerrados: informe de diciembre de cada año archivado por la EIA; el año en curso, informe mensual vigente."))
    return out
def px(table, query):
    return json.loads(http(STATFIN + table + ".px", json.dumps({"query": query, "response": {"format": "json-stat2"}}).encode(), {"Content-Type": "application/json"}).decode("utf-8-sig"))
def stat_series(d, cat_dim_filter=None):
    ids = d["id"]; tdim = ids[0]
    tc = d["dimension"][tdim]["category"]["index"]; tc = tc if isinstance(tc, list) else sorted(tc, key=tc.get)
    return {t: v for t, v in zip(tc, d["value"])}
def fi_pellet():
    d = px("12gv", [{"code": "timeperiod_m", "selection": {"filter": "all", "values": ["*"]}}, {"code": "contentscode", "selection": {"filter": "item", "values": ["hinta_euroa_t"]}}])
    s = stat_series(d); out = {}
    for t, v in s.items():
        if v is None: continue
        out["%s-%s" % (t[:4], t[5:])] = round(float(v), 2)
    src = {"name": "Statistics Finland, StatFin 12gv: consumer prices of wood pellet in heat production", "url": "https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__ehi/statfin_ehi_pxt_12gv.px", "license": "CC BY 4.0 (Statistics Finland)"}
    return pack("fi-pellet-consumer-price", "Wood pellet, consumer price (heat production)", "pellets", "M", "EUR/t", "EUR", "incl", out, src, "Precio al consumidor del pellet de madera, con IVA; una observacion por trimestre (febrero, mayo, agosto y noviembre).")
def fi_chips():
    d = px("12gb", [{"code": "timeperiod_q", "selection": {"filter": "all", "values": ["*"]}}, {"code": "energia_27_20200611", "selection": {"filter": "item", "values": ["E"]}}, {"code": "contentscode", "selection": {"filter": "item", "values": ["hinta_eur_mwh"]}}])
    tdim = d["id"][0]; s = stat_series(d); out = {}
    for t, v in s.items():
        if v is None: continue
        out[t.replace("Q", "-Q")] = round(float(v), 2)
    src = {"name": "Statistics Finland, StatFin 12gb: prices of domestic fuels in energy production (forest chips delivered)", "url": "https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__ehi/statfin_ehi_pxt_12gb.px", "license": "CC BY 4.0 (Statistics Finland)"}
    return pack("fi-forest-chips-price", "Forest chips delivered, energy production", "chips", "Q", "EUR/MWh", "EUR", "excl", out, src, "Precio de las astillas forestales entregadas a las plantas de energia, sin IVA; trimestral desde 2016.")
def main():
    try: old = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception: old = None
    series = []; fails = []
    for name, fn in (("EIA", lambda: eia(old)), ("FI pellet", lambda: [fi_pellet()]), ("FI chips", lambda: [fi_chips()])):
        try:
            r = fn(); series += r; print(name, "OK", [(s["id"], s["periods"][-1], s["values"][-1]) for s in r])
        except Exception as e:
            fails.append(name); print("FALLO", name, str(e)[:200])
            keep = {"EIA": "us-", "FI pellet": "fi-pellet", "FI chips": "fi-forest-chips"}[name]
            series += [s for s in (old or {}).get("series", []) if s["id"].startswith(keep)]
    if len(fails) == 3 or not series:
        print("ERROR: fallan todas las fuentes; no se toca el fichero"); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "series": series}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wood-energy.json", OUT.stat().st_size, "bytes;", len(series), "series; fallos:", len(fails)); return 0
if __name__ == "__main__": sys.exit(main())

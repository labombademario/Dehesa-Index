#!/usr/bin/env python3
"""Precio minorista online del pescado (euros por kg, media mensual) por Estado miembro, categoria y producto, de EUMOFA (Comision Europea).
Escribe data/eu-fish-retail-prices.json y data/eu-fish-retail-prices-log.txt.
 - Fuente: <AÑO>_Daily-online retail prices.csv del cubo publico que enlaza la descarga masiva de EUMOFA (ver scripts/update-eu-fish-first-sales.py). Los analistas de
   EUMOFA descargan a mano cada dia los precios de tiendas online de grandes cadenas de cada pais (metadatos de EUMOFA, "Metadata 1 - Data collection", apartado 4). Existe desde 2021
   (2019 y 2020 devuelven 403).
 - Filas: una por dia, tienda/producto vigilado y presentacion. Hay dos tipos: con "PRICE PER KG (EUR)" (precio por kilo publicado) y solo con "PRICE PER UNIT (EUR)" (un envase
   con un rango de peso, p. ej. 200-250 g: el precio por kilo no se puede saber). Solo se usan las del primer tipo; las otras se descartan, nunca se divide por un peso estimado.
 - Calculo (el unico): por pais, categoria (Fresh, Frozen, Smoked, Prepared-preserved) y producto, media de los precios por kilo de cada mes. Una serie es un producto vigilado
   (en la mayoria, un solo articulo): no es un indice de precios al consumo del pescado. Un mes necesita al menos MIN_DAYS dias con precio; una serie, al menos MIN_MONTHS meses.
 - Saltos: un mes que cambia mas de BREAK (25 %) frente al anterior se lista en "breaks" de la serie. Suele ser un cambio del articulo vigilado (otro envase o marca), no del mercado;
   los datos no se corrigen y la pagina no calcula variaciones que atraviesen un salto.
 - Paises: los Estados miembros que EUMOFA vigila (17). El campo de moneda local no se usa.
Uso: python3 scripts/update-eu-fish-retail-prices.py [--fixture fichero.csv ...]  (con --fixture lee esos CSV en lugar de la red; para los tests)."""
import csv, datetime, io, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://dev-eumofa-bulk.s3.eu-west-1.amazonaws.com/%s"
FROM_YEAR = 2021
MIN_DAYS = 5
MIN_MONTHS = 12
BREAK = 0.25
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
CC = {"Austria": "AT", "Belgium": "BE", "Bulgaria": "BG", "Croatia": "HR", "Cyprus": "CY", "Czechia": "CZ", "Denmark": "DK", "Estonia": "EE", "Finland": "FI", "France": "FR",
      "Germany": "DE", "Greece": "EL", "Hungary": "HU", "Ireland": "IE", "Italy": "IT", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", "Malta": "MT", "Netherlands": "NL",
      "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Slovakia": "SK", "Slovenia": "SI", "Spain": "ES", "Sweden": "SE"}
NEED = ["YEAR", "MONTH", "DAY", "COUNTRY", "CATEGORY", "PRODUCT", "PRICE PER KG (EUR)"]
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-fish-retail-prices-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def http(url, tries=4, timeout=300):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %s" % (url, repr(last)[:200]))


def num(s):
    s = (s or "").strip().replace(",", ".")
    if not s: return None
    try: return float(s)
    except ValueError: return None


def accumulate(text, acc):
    """acc[(cc, categoria, producto)]['AAAA-MM'] = {'days': set(dias), 'sum': suma de precios, 'n': filas}. Solo filas con precio por kilo."""
    rd = csv.DictReader(io.StringIO(text.lstrip("﻿")), delimiter=";")
    miss = [c for c in NEED if c not in (rd.fieldnames or [])]
    if miss: raise RuntimeError("faltan columnas en el CSV: %s" % miss)
    n = 0
    for r in rd:
        cc = CC.get((r["COUNTRY"] or "").strip())
        if not cc: continue
        y, m, d = (r["YEAR"] or "").strip(), (r["MONTH"] or "").strip(), (r["DAY"] or "").strip()
        if not (y.isdigit() and m.isdigit() and d.isdigit()) or not 1 <= int(m) <= 12: continue
        p = num(r["PRICE PER KG (EUR)"])
        if p is None or p <= 0 or p > 1000: continue
        cat, prod = (r["CATEGORY"] or "").strip(), (r["PRODUCT"] or "").strip()
        if not cat or not prod: continue
        cell = acc.setdefault((cc, cat, prod), {}).setdefault("%s-%02d" % (y, int(m)), {"days": set(), "sum": 0.0, "n": 0})
        cell["days"].add(int(d)); cell["sum"] += p; cell["n"] += 1; n += 1
    return n


def build(acc):
    """-> {cc: [{'category', 'product', 'points': [[AAAA-MM, eur/kg, dias], ...]}]}"""
    out = {}
    for (cc, cat, prod), months in sorted(acc.items()):
        pts = [[k, round(v["sum"] / v["n"], 2), len(v["days"])] for k, v in sorted(months.items()) if len(v["days"]) >= MIN_DAYS]
        if len(pts) < MIN_MONTHS: continue
        # saltos de mas del BREAK % de un mes al siguiente (mes contiguo): casi siempre es un cambio del articulo vigilado, no del mercado; se marcan, no se corrigen
        idx = lambda k: int(k[:4]) * 12 + int(k[5:]) - 1
        brk = [pts[i][0] for i in range(1, len(pts)) if idx(pts[i][0]) - idx(pts[i - 1][0]) == 1 and abs(pts[i][1] / pts[i - 1][1] - 1) > BREAK]
        out.setdefault(cc, []).append({"category": cat, "product": prod, "breaks": brk, "points": pts})
    for cc in out: out[cc].sort(key=lambda s: (-len(s["points"]), s["product"], s["category"]))
    return out


def files():
    this = datetime.date.today().year
    return ["%d_Daily-online retail prices.csv" % y for y in range(FROM_YEAR, this + 1)]


def main():
    acc, n = {}, 0
    if "--fixture" in sys.argv:
        for f in sys.argv[sys.argv.index("--fixture") + 1:]: n += accumulate(open(f, encoding="utf-8").read(), acc)
    else:
        this = datetime.date.today().year
        for name in files():
            try: raw = http(BASE % urllib.parse.quote(name))
            except RuntimeError as e:
                if name.startswith(str(this)) and datetime.date.today().timetuple().tm_yday < 70: log("aviso: aun no hay fichero de %d (%s)" % (this, e)); continue
                raise SystemExit("FALLO: no se pudo descargar %s: %s" % (name, e))
            k = accumulate(raw.decode("utf-8", "replace"), acc); n += k
            log("%s: %.1f MB, %d filas con precio por kilo" % (name, len(raw) / 1e6, k))
    countries = build(acc)
    if len(countries) < 10 or "ES" not in countries: raise SystemExit("FALLO: EUMOFA devolvio datos insuficientes (%d paises: %s)" % (len(countries), sorted(countries)))
    latest = max(s["points"][-1][0] for v in countries.values() for s in v)
    if "--fixture" not in sys.argv and (datetime.date.today() - datetime.date(int(latest[:4]), int(latest[5:]), 1)).days > 150: raise SystemExit("FALLO: el ultimo mes de precios minoristas (%s) es demasiado antiguo" % latest)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestMonth": latest, "fromYear": FROM_YEAR, "unit": "EUR/kg",
           "minDays": MIN_DAYS, "source": {"id": "eumofa", "name": "EUMOFA (European Market Observatory for Fisheries and Aquaculture Products), daily online retail prices, bulk download",
                                           "url": "https://fishery-aquaculture-market-observatory.ec.europa.eu/en/data/bulk-download", "license": "CC BY 4.0 (content owned by the EU; EUMOFA legal notice)"},
           "pointFields": ["month", "price", "days"], "countries": countries}
    (ROOT / "data" / "eu-fish-retail-prices.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-fish-retail-prices.json: %d paises, %d series, ultimo mes %s, %d filas leidas" % (len(countries), sum(len(v) for v in countries.values()), latest, n))


if __name__ == "__main__":
    main()

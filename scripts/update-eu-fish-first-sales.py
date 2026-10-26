#!/usr/bin/env python3
"""Precio semanal en primera venta (lonja) del pescado por pais y especie, de EUMOFA (Observatorio Europeo del Mercado de Productos de la Pesca y la Acuicultura, Comision Europea).
Escribe data/eu-fish-first-sales.json y data/eu-fish-first-sales-log.txt.
 - Fuente: la "descarga masiva" (Bulk Download) de EUMOFA es un panel de Amazon QuickSight que enlaza ficheros CSV publicos en
   https://dev-eumofa-bulk.s3.eu-west-1.amazonaws.com/<AÑO>_First_sale_weekly_by_ERS.csv (uno por año, sin cuenta). El cubo se llama "dev-" pero es el que enlaza el panel
   publico (comprobado el 25-oct-2026). No se puede listar: los nombres siguen el patron del panel. Si un año que debe existir falla, el script falla (no publica datos a medias).
 - Columnas: year;week_of_year;country;location;commodity_group;main_commercial_species;product;english_name;cod_size;presentation;preservation;volume(Kg);weight;value(Eur).
   Una fila por semana, puerto (location), especie, talla, presentacion y conservacion.
 - Calculo (el unico): por pais, especie comercial principal y semana, precio medio = suma del valor / suma del volumen (euros por kg). Mezcla puertos, tallas,
   presentaciones y conservaciones: un cambio de mezcla mueve el precio. Una semana con menos de MIN_KG kg de esa especie en ese pais queda sin precio (demasiado ruido).
 - Paises: solo los Estados miembros de la UE. Noruega, Islandia y las Feroe vienen de fuentes de terceros (Sildelaget, oficinas estadisticas nacionales) y la licencia
   CC BY 4.0 de EUMOFA solo cubre el contenido propiedad de la UE: se descartan.
 - Especies: por pais, las TOP_SPECIES con mas valor en las ultimas 52 semanas con dato, y solo si tienen precio en al menos MIN_WEEKS de esas 52.
 - Los paises informan con retraso distinto (de una a cuatro semanas): la ultima semana de cada pais es la suya; nunca se rellena.
 - MENSUAL (clave "monthly"): <AÑO>_first_sale_by_ERS_code.csv del mismo cubo, todos los paises que envian notas de venta (unos 20 Estados miembros, entre ellos Italia,
   Dinamarca, Paises Bajos, Irlanda, Grecia y Croacia, que no tienen dato semanal). Mismo calculo por mes; fuera las filas en peso vivo (el resto es peso neto) y las de
   destino "Non-food" (harina y aceite de pescado, precio de otro mercado). Umbral MIN_KG_M kg al mes; especies con precio en al menos MIN_MONTHS de los ultimos 12 meses.
Uso: python3 scripts/update-eu-fish-first-sales.py [--fixture fichero.csv ...]  (con --fixture lee esos CSV en lugar de la red; para los tests)."""
import csv, datetime, io, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://dev-eumofa-bulk.s3.eu-west-1.amazonaws.com/%d_First_sale_weekly_by_ERS.csv"
BASE_M = "https://dev-eumofa-bulk.s3.eu-west-1.amazonaws.com/%d_first_sale_by_ERS_code.csv"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
FROM_YEAR = 2019
MIN_KG = 500.0
TOP_SPECIES = 12
MIN_WEEKS = 26
MIN_KG_M = 2000.0
MIN_MONTHS = 9
# nombre en el CSV -> codigo de pais del sitio (EL = Grecia). Solo Estados miembros.
CC = {"Austria": "AT", "Belgium": "BE", "Bulgaria": "BG", "Croatia": "HR", "Cyprus": "CY", "Czechia": "CZ", "Denmark": "DK", "Estonia": "EE", "Finland": "FI", "France": "FR",
      "Germany": "DE", "Greece": "EL", "Hungary": "HU", "Ireland": "IE", "Italy": "IT", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", "Malta": "MT", "Netherlands": "NL",
      "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Slovakia": "SK", "Slovenia": "SI", "Spain": "ES", "Sweden": "SE"}
NEED_M = ["Year", "Month_of_Year", "Country", "Main_commercial_species", "Commodity_Group", "Volume(Kg)", "Value(Eur)", "weight", "Destination_use"]
NEED = ["year", "week_of_year", "country", "main_commercial_species", "commodity_group", "volume(Kg)", "value(Eur)"]
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-fish-first-sales-log.txt").write_text("\n".join(LOG))
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


def accumulate(text, acc, groups):
    """Suma valor y volumen por (pais, especie, semana). acc[cc][especie]['AAAA-Www'] = [kg, eur]. groups[especie] = grupo de producto."""
    rd = csv.DictReader(io.StringIO(text.lstrip("﻿")), delimiter=";")
    miss = [c for c in NEED if c not in (rd.fieldnames or [])]
    if miss: raise RuntimeError("faltan columnas en el CSV: %s" % miss)
    n = 0
    for r in rd:
        cc = CC.get((r["country"] or "").strip())
        if not cc: continue
        y, w = (r["year"] or "").strip(), (r["week_of_year"] or "").strip()
        if not (y.isdigit() and w.isdigit()) or not 1 <= int(w) <= 53: continue
        kg, eur = num(r["volume(Kg)"]), num(r["value(Eur)"])
        if kg is None or eur is None or kg <= 0 or eur < 0: continue
        sp = (r["main_commercial_species"] or "").strip()
        if not sp or sp.lower().startswith("other ") or (", other" in sp and " and " in sp): continue   # cajones "Other ..." (otros peces marinos, etc.): no son una especie
        k = "%s-W%02d" % (y, int(w))
        cell = acc.setdefault(cc, {}).setdefault(sp, {}).setdefault(k, [0.0, 0.0])
        cell[0] += kg; cell[1] += eur; n += 1
        groups.setdefault(sp, (r["commodity_group"] or "").strip())
    return n


def accumulate_monthly(text, acc, groups):
    """Como accumulate, pero mensual: acc[cc][especie]['AAAA-MM'] = [kg, eur]. Fuera peso vivo y destino no alimentario."""
    rd = csv.DictReader(io.StringIO(text.lstrip("\ufeff")), delimiter=";")
    miss = [c for c in NEED_M if c not in (rd.fieldnames or [])]
    if miss: raise RuntimeError("faltan columnas en el CSV mensual: %s" % miss)
    n = 0
    for r in rd:
        cc = CC.get((r["Country"] or "").strip())
        if not cc: continue
        if (r["weight"] or "").strip().lower() != "net weight" or (r["Destination_use"] or "").strip().lower() == "non-food": continue
        y, m = (r["Year"] or "").strip(), (r["Month_of_Year"] or "").strip()
        if not (y.isdigit() and m.isdigit()) or not 1 <= int(m) <= 12: continue
        kg, eur = num(r["Volume(Kg)"]), num(r["Value(Eur)"])
        if kg is None or eur is None or kg <= 0 or eur < 0: continue
        sp = (r["Main_commercial_species"] or "").strip()
        if not sp or sp.lower().startswith("other ") or (", other" in sp and " and " in sp): continue   # cajones genericos ("Molluscs and aquatic invertebrates, other")
        cell = acc.setdefault(cc, {}).setdefault(sp, {}).setdefault("%s-%02d" % (y, int(m)), [0.0, 0.0])
        cell[0] += kg; cell[1] += eur; n += 1
        groups.setdefault(sp, (r["Commodity_Group"] or "").strip())
    return n


def build(acc, groups, window=52, min_kg=None, min_n=None, last_key="lastWeek"):
    """-> {cc: {'lastWeek', 'species': [{'name', 'group', 'points': [[semana, eur/kg, toneladas], ...]}]}} (semanas sin precio fuera)."""
    out = {}
    for cc, sps in acc.items():
        weeks = sorted({k for d in sps.values() for k in d})
        if not weeks: continue
        min_kg = MIN_KG if min_kg is None else min_kg; min_n = MIN_WEEKS if min_n is None else min_n
        last52 = set(weeks[-window:])
        cand = []
        for sp, d in sps.items():
            pts = [[k, round(v[1] / v[0], 2), round(v[0] / 1000.0, 1)] for k, v in sorted(d.items()) if v[0] >= min_kg]
            recent = [p for p in pts if p[0] in last52]
            if len(recent) < min_n: continue
            val = sum(d[k][1] for k in last52 if k in d)
            cand.append((val, sp, pts))
        cand.sort(key=lambda x: -x[0])
        sel = [{"name": sp, "group": groups.get(sp, ""), "value52": round(val), "points": pts} for val, sp, pts in cand[:TOP_SPECIES]]
        if sel: out[cc] = {last_key: weeks[-1], "species": sel}
    return out


def main():
    acc, groups, n = {}, {}, 0
    if "--fixture" in sys.argv:
        for f in sys.argv[sys.argv.index("--fixture") + 1:]: n += accumulate(open(f, encoding="utf-8").read(), acc, groups)
    else:
        this = datetime.date.today().year
        for y in range(FROM_YEAR, this + 1):
            try: raw = http(BASE % y)
            except RuntimeError as e:
                # el fichero del año en curso puede no existir aun en las primeras semanas de enero
                if y == this and datetime.date.today().timetuple().tm_yday < 30: log("aviso: aun no hay fichero de %d (%s)" % (y, e)); continue
                raise SystemExit("FALLO: no se pudo descargar el fichero de %d: %s" % (y, e))
            k = accumulate(raw.decode("utf-8", "replace"), acc, groups); n += k
            log("%d: %.1f MB, %d filas de Estados miembros" % (y, len(raw) / 1e6, k))
    macc, mgroups = {}, {}
    if "--fixture-m" in sys.argv:
        for f in sys.argv[sys.argv.index("--fixture-m") + 1:]: accumulate_monthly(open(f, encoding="utf-8").read(), macc, mgroups)
    elif "--fixture" not in sys.argv:
        this = datetime.date.today().year
        for y in range(FROM_YEAR, this + 1):
            try: raw = http(BASE_M % y)
            except RuntimeError as e:
                if y == this and datetime.date.today().timetuple().tm_yday < 70: log("aviso: aun no hay fichero mensual de %d (%s)" % (y, e)); continue
                raise SystemExit("FALLO: no se pudo descargar el fichero mensual de %d: %s" % (y, e))
            k = accumulate_monthly(raw.decode("utf-8", "replace"), macc, mgroups)
            log("mensual %d: %.1f MB, %d filas de Estados miembros" % (y, len(raw) / 1e6, k))
    monthly = build(macc, mgroups, window=12, min_kg=MIN_KG_M, min_n=MIN_MONTHS, last_key="lastMonth")
    countries = build(acc, groups)
    if len(countries) < 5 or "ES" not in countries: raise SystemExit("FALLO: EUMOFA devolvio datos insuficientes (%d paises: %s)" % (len(countries), sorted(countries)))
    latest = max(v["lastWeek"] for v in countries.values())
    if "--fixture" not in sys.argv:
        ly, lw = int(latest[:4]), int(latest[6:])
        age = (datetime.date.today() - datetime.date.fromisocalendar(ly, min(lw, 52), 1)).days
        if age > 70: raise SystemExit("FALLO: la ultima semana de EUMOFA (%s) tiene %d dias" % (latest, age))
        if len(monthly) < 12 or "IT" not in monthly: raise SystemExit("FALLO: el mensual de EUMOFA devolvio datos insuficientes (%d paises: %s)" % (len(monthly), sorted(monthly)))
        lm = max(v["lastMonth"] for v in monthly.values())
        if (datetime.date.today() - datetime.date(int(lm[:4]), int(lm[5:]), 1)).days > 150: raise SystemExit("FALLO: el ultimo mes de EUMOFA (%s) es demasiado antiguo" % lm)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestWeek": latest, "fromYear": FROM_YEAR,
           "minKg": MIN_KG, "unit": "EUR/kg",
           "source": {"id": "eumofa", "name": "EUMOFA (European Market Observatory for Fisheries and Aquaculture Products), weekly first sales by ERS, bulk download",
                      "url": "https://fishery-aquaculture-market-observatory.ec.europa.eu/en/data/bulk-download", "license": "CC BY 4.0 (content owned by the EU; EUMOFA legal notice)"},
           "pointFields": ["week", "price", "tonnes"], "countries": countries}
    if monthly: doc["monthly"] = {"latestMonth": max(v["lastMonth"] for v in monthly.values()), "minKg": MIN_KG_M, "pointFields": ["month", "price", "tonnes"], "countries": monthly}
    (ROOT / "data" / "eu-fish-first-sales.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-fish-first-sales.json: %d paises (%s), ultima semana %s, %d filas leidas; mensual %d paises (%s)" % (len(countries), ", ".join(sorted(countries)), latest, n, len(monthly), ", ".join(sorted(monthly))))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Costes y renta de la explotacion agraria media de cada Estado miembro de la UE (red FADN/FSDN, resultados estandar publicos de la Comision Europea).
Escribe data/eu-fadn.json y data/eu-fadn-log.txt.
 - Fuente: libreria publica "FSDN Public" de CIRCABC (acceso de invitado, sin cuenta), carpeta Standard Reports > SO, fichero YEAR.COUNTRY.csv (separador ';',
   una fila por año y pais; variables SExxx = euros por explotacion media, salvo las marcadas). Los identificadores de carpeta y fichero se buscan por nombre en cada
   ejecucion; el identificador de la carpeta Standard Reports es la unica constante.
 - Variables: las definiciones (guia oficial RICC 1750) estan en VARS; ninguna se calcula ni se estima, se copia lo que publica la Comision. Un valor vacio queda sin dato.
 - Es una MUESTRA contable (no un censo) de explotaciones comerciales; cada año se publica con retraso (el ultimo es el 2024 en octubre de 2026) y la definicion de
   algunas variables cambia en ciertos años (ver la guia): no se empalman series.
 - Paises: los 27 Estados miembros (EL = Grecia) y el agregado UE-27. Reino Unido y los demas agregados se descartan.
 - UE-27: el CSV trae "EU-27_2020" con huecos (faltan 2022 y 2023 en la descarga del 25-oct-2026) y "(ALL) EU", completo. Desde 2021 los dos son IDENTICOS (comprobado en 2021 y 2024:
   renta neta 32.157 y 32.254 EUR); antes de 2021 "(ALL) EU" incluye al Reino Unido y NO coincide. Por eso la UE-27 es EU-27_2020 y solo los años >= 2021 que a EU-27_2020 le faltan
   se toman de "(ALL) EU". Nunca se mezclan para un mismo año ni se usan antes de 2021.
Uso: python3 scripts/update-eu-fadn.py [--fixture fichero.csv]  (con --fixture lee ese CSV en lugar de la red; para los tests)."""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = "https://circabc.europa.eu/"
STD_REPORTS = "7c68c459-6dca-4795-bab6-a045721e4395"      # FSDN Public > library > Standard Reports
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
MEMBERS = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"]
# codigo, grupo, unidad, nombre (es, en, fr, it)
VARS = [
    ("SE131", "output", "EUR", ("Producción total", "Total output", "Production totale", "Produzione totale")),
    ("SE605", "output", "EUR", ("Subvenciones corrientes (sin inversión)", "Subsidies on current operations", "Subventions courantes (hors investissement)", "Sovvenzioni correnti (esclusi investimenti)")),
    ("SE270", "cost", "EUR", ("Insumos totales (costes totales)", "Total inputs", "Intrants totaux", "Fattori produttivi totali")),
    ("SE295", "cost", "EUR", ("Fertilizantes y enmiendas", "Fertilisers and soil improvers", "Engrais et amendements", "Concimi e ammendanti")),
    ("SE300", "cost", "EUR", ("Protección de cultivos (fitosanitarios)", "Crop protection", "Protection des cultures", "Protezione delle colture")),
    ("SE285", "cost", "EUR", ("Semillas y plantas", "Seeds and plants", "Semences et plants", "Sementi e piante")),
    ("SE345", "cost", "EUR", ("Energía (carburantes, electricidad)", "Energy (motor fuels, electricity)", "Énergie (carburants, électricité)", "Energia (carburanti, elettricità)")),
    ("SE310", "cost", "EUR", ("Pienso para ganado de pasto", "Feed for grazing livestock", "Aliments pour herbivores", "Mangimi per erbivori")),
    ("SE320", "cost", "EUR", ("Pienso para cerdos y aves", "Feed for pigs and poultry", "Aliments pour porcs et volailles", "Mangimi per suini e pollame")),
    ("SE420", "income", "EUR", ("Renta neta de la explotación", "Farm net income", "Revenu net de l’exploitation", "Reddito netto aziendale")),
    ("SE425", "income", "EUR/AWU", ("Valor añadido neto por unidad de trabajo", "Farm net value added per work unit", "Valeur ajoutée nette par unité de travail", "Valore aggiunto netto per unità di lavoro")),
    ("SE025", "structure", "ha", ("Superficie agraria útil", "Utilised agricultural area", "Surface agricole utilisée", "Superficie agricola utilizzata")),
]
CODES = [v[0] for v in VARS]
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "eu-fadn-log.txt").write_text("\n".join(LOG))
    except Exception: pass


def http(url, tries=4, timeout=120):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def children(nid):
    d = json.loads(http(BASE + "service/circabc/spaces/%s/children?guest=true&language=en&page=1&limit=200" % nid))
    return d.get("data", [])


def find_csv():
    """-> bytes del CSV YEAR.COUNTRY.csv de la carpeta SO."""
    so = next((x for x in children(STD_REPORTS) if x.get("name") == "SO"), None)
    if not so: raise RuntimeError("no hay carpeta SO en Standard Reports")
    f = next((x for x in children(so["id"]) if x.get("name") == "YEAR.COUNTRY.csv"), None)
    if not f: raise RuntimeError("no hay YEAR.COUNTRY.csv en SO")
    return http(BASE + "rest/download/" + f["id"], timeout=180)


EU_FILL_FROM = 2021   # desde este año "(ALL) EU" es el mismo agregado que EU-27_2020


def cc_of(label):
    """'(ES) Spain' -> 'ES'; 'EU-27_2020' -> 'EU'; '(ALL) EU' -> 'EUALL' (solo para rellenar huecos de la UE-27); el resto (Reino Unido, agregados antiguos) -> None."""
    label = (label or "").strip()
    if label == "EU-27_2020": return "EU"
    if label == "(ALL) EU": return "EUALL"
    m = re.match(r"^\(([A-Z]{2})\)", label)
    return m.group(1) if m and m.group(1) in MEMBERS else None


def parse(text):
    """CSV -> {cc: {codigo: {año: valor}}}"""
    rd = csv.reader(io.StringIO(text.lstrip("﻿")), delimiter=";"); head = next(rd)
    ix = {c.strip(): i for i, c in enumerate(head)}
    miss = [c for c in ["YEAR", "COUNTRY"] + CODES if c not in ix]
    if miss: raise RuntimeError("faltan columnas en el CSV: %s" % miss)
    out = {}
    for row in rd:
        if len(row) <= max(ix[c] for c in CODES): continue
        cc = cc_of(row[ix["COUNTRY"]])
        if not cc or not re.fullmatch(r"\d{4}", row[ix["YEAR"]].strip()): continue
        y = row[ix["YEAR"]].strip()
        for c in CODES:
            v = row[ix[c]].strip().replace(",", ".")
            if v in ("", "-", "NA", "."): continue
            try: x = float(v)
            except ValueError: continue
            out.setdefault(cc, {}).setdefault(c, {})[y] = x
    return out


def build(raw):
    raw = dict(raw); eu_all = raw.pop("EUALL", {})
    if "EU" in raw:
        eu = {c: dict(d) for c, d in raw["EU"].items()}
        for c, d in eu_all.items():
            for y, v in d.items():
                if int(y) >= EU_FILL_FROM and y not in eu.setdefault(c, {}): eu[c][y] = v
        raw["EU"] = eu
    countries = {}
    for cc, vs in raw.items():
        ser = {c: [[int(y), round(v, 2)] for y, v in sorted(d.items())] for c, d in vs.items() if len(d) >= 3}
        if ser: countries[cc] = ser
    return countries


def main():
    text = open(sys.argv[sys.argv.index("--fixture") + 1], encoding="utf-8").read() if "--fixture" in sys.argv else find_csv().decode("utf-8-sig", "replace")
    countries = build(parse(text))
    n_members = len([c for c in countries if c != "EU"])
    if "EU" not in countries or n_members < 20 or "SE420" not in countries["EU"]: raise SystemExit("FALLO: el FADN devolvio datos insuficientes (%d Estados miembros, UE %s)" % (n_members, "EU" in countries))
    latest = max(p[0] for v in countries.values() for s in v.values() for p in s[-1:])
    if latest < datetime.date.today().year - 4: raise SystemExit("FALLO: el ultimo año del FADN (%d) es demasiado antiguo" % latest)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "latestYear": latest,
           "source": {"id": "fadn_fsdn", "name": "European Commission, FADN/FSDN public database, standard results (SO), by country", "url": "https://agriculture.ec.europa.eu/data-and-analysis/farm-structures-and-economics/fsdn_en", "license": "European Commission reuse notice (Decision 2011/833/EU)"},
           "pointFields": ["year", "value"],
           "variables": [{"code": c, "group": g, "unit": u, "name": dict(zip(("es", "en", "fr", "it"), n))} for c, g, u, n in VARS],
           "countries": countries}
    (ROOT / "data" / "eu-fadn.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("eu-fadn.json: %d Estados miembros + UE, ultimo año %d, UE renta neta %s EUR" % (n_members, latest, dict(map(tuple, countries["EU"]["SE420"])).get(latest)))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Alemania: precio de compraventa de tierra agrícola por Regierungsbezirk -> data/de-land-prices.json

Fuente: Statistisches Bundesamt (Destatis), GENESIS-Online, tabla 61521-0020 «Kaufwerte für landwirtschaftliche Grundstücke: Regierungsbezirke, Jahre»
(Datenlizenz Deutschland – Namensnennung – Version 2.0; registro destatis). Necesita GENESIS_TOKEN (el mismo de update-germany); sin token no se toca nada.
Por año y región: precio medio de compraventa en euros por hectárea de superficie agraria, superficie vendida (ha) y número de compraventas, tal cual.
Las 38 regiones son las NUTS 2 de Alemania: los Regierungsbezirke (o regiones estadísticas en Niedersachsen y Rheinland-Pfalz, Direktionsbezirke en Sachsen) y
los Länder que no los tienen. Se identifican por el código oficial (AGS) que trae la tabla y, si faltara, por el nombre; se asignan al id NUTS 2 del mapa
(vendor/de-nuts2.js). Si la tabla trae también Länder o Alemania, se guardan aparte. Si la estructura no es la esperada, se escribe en el registro y no se toca nada.
Uso: GENESIS_TOKEN=... python3 scripts/update-de-land-prices.py [--out DIR]"""
import csv, datetime, io, json, os, re, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile"
TABLE = "61521-0020"
# AGS -> (NUTS 2, nombre)
REG = {"081": ("DE11", "Stuttgart"), "082": ("DE12", "Karlsruhe"), "083": ("DE13", "Freiburg"), "084": ("DE14", "Tübingen"),
       "091": ("DE21", "Oberbayern"), "092": ("DE22", "Niederbayern"), "093": ("DE23", "Oberpfalz"), "094": ("DE24", "Oberfranken"), "095": ("DE25", "Mittelfranken"),
       "096": ("DE26", "Unterfranken"), "097": ("DE27", "Schwaben"), "11": ("DE30", "Berlin"), "12": ("DE40", "Brandenburg"), "04": ("DE50", "Bremen"), "02": ("DE60", "Hamburg"),
       "064": ("DE71", "Darmstadt"), "065": ("DE72", "Gießen"), "066": ("DE73", "Kassel"), "13": ("DE80", "Mecklenburg-Vorpommern"),
       "031": ("DE91", "Braunschweig"), "032": ("DE92", "Hannover"), "033": ("DE93", "Lüneburg"), "034": ("DE94", "Weser-Ems"),
       "051": ("DEA1", "Düsseldorf"), "053": ("DEA2", "Köln"), "055": ("DEA3", "Münster"), "057": ("DEA4", "Detmold"), "059": ("DEA5", "Arnsberg"),
       "071": ("DEB1", "Koblenz"), "072": ("DEB2", "Trier"), "073": ("DEB3", "Rheinhessen-Pfalz"), "10": ("DEC0", "Saarland"),
       "145": ("DED4", "Chemnitz"), "146": ("DED2", "Dresden"), "147": ("DED5", "Leipzig"), "15": ("DEE0", "Sachsen-Anhalt"), "01": ("DEF0", "Schleswig-Holstein"), "16": ("DEG0", "Thüringen")}
LAENDER = {"08": "Baden-Württemberg", "09": "Bayern", "06": "Hessen", "03": "Niedersachsen", "05": "Nordrhein-Westfalen", "07": "Rheinland-Pfalz", "14": "Sachsen", "DG": "Deutschland"}
LAND_OF = {"DE1": "Baden-Württemberg", "DE2": "Bayern", "DE3": "Berlin", "DE4": "Brandenburg", "DE5": "Bremen", "DE6": "Hamburg", "DE7": "Hessen", "DE8": "Mecklenburg-Vorpommern",
           "DE9": "Niedersachsen", "DEA": "Nordrhein-Westfalen", "DEB": "Rheinland-Pfalz", "DEC": "Saarland", "DED": "Sachsen", "DEE": "Sachsen-Anhalt", "DEF": "Schleswig-Holstein", "DEG": "Thüringen"}
LOG = []
def log(*a): s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def num(s):
    s = (s or "").strip()
    if s in ("", ".", "..", "...", "-", "/", "x", "–"): return None
    try: return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)
    except ValueError: return None
def fetch(tok, name, sy):
    body = urllib.parse.urlencode({"name": name, "area": "all", "startyear": sy, "format": "ffcsv", "compress": "false", "transpose": "false", "job": "false", "language": "de"}).encode()
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=h, method="POST"), timeout=240) as r: raw = r.read()
            if raw[:2] != b"PK": raise RuntimeError("sin ZIP: " + raw[:200].decode("utf-8", "replace"))
            z = zipfile.ZipFile(io.BytesIO(raw)); return list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig")), delimiter=";"))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(("%s: %s" % (name, last)).replace(tok, "<token>"))
def cls(r):
    """[(n, código de variable, código de atributo, etiqueta)] de las clasificaciones de la fila"""
    out = []
    for k in r:
        m = re.match(r"^(\d+)_variable_code$", k)
        if m: n = m.group(1); out.append((int(n), (r[k] or "").strip(), (r.get(n + "_variable_attribute_code") or "").strip(), (r.get(n + "_variable_attribute_label") or "").strip()))
    return sorted(out)
def kind(lab):
    l = lab.lower()
    if "kaufwert" in l or "kaufpreis" in l or ("eur" in l and "ha" in l): return "price"
    if "veräußerungsfälle" in l or "veraeusserungsfaelle" in l or "fälle" in l or "anzahl" in l: return "cases"
    if "fläche" in l or "flaeche" in l: return "area"
    return None
def describe(R):
    log("filas:", len(R), "columnas:", list(R[0].keys())[:30] if R else [])
    vv = sorted({r.get("value_variable_label", "").strip() + " [" + r.get("value_variable_code", "").strip() + "] " + r.get("value_unit", "").strip() for r in R})
    log("variables de valor:", vv)
    seen = {}
    for r in R:
        for n, vc, ac, al in cls(r): seen.setdefault((n, vc), set()).add(ac + "=" + al)
    for k, v in sorted(seen.items()): log("clasificación", k, len(v), sorted(v)[:45])
def main():
    tok = os.environ.get("GENESIS_TOKEN", "").strip()
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if not tok: log("sin GENESIS_TOKEN: se conserva data/de-land-prices.json"); return 0
    try: R = fetch(tok, TABLE, "2000")
    except Exception as e: log("ERROR:", e); return 1
    if not R: log("ERROR: tabla vacía"); return 1
    describe(R)
    byname = {v[1].lower(): (k, v) for k, v in REG.items()}
    units, nat, kinds, other = {}, {}, set(), set()
    for r in R:
        k = kind(r.get("value_variable_label", ""))
        if not k: continue
        C = cls(r); reg = None; ok = True
        for n, vc, ac, al in C:
            hit = REG.get(ac) or LAENDER.get(ac) and ("LAND", LAENDER[ac])
            if not hit:
                nm = re.sub(r",.*$", "", al).strip().lower()
                if nm in byname: hit = byname[nm][1]
                elif nm in [x.lower() for x in LAENDER.values()]: hit = ("LAND", al.split(",")[0].strip())
            if hit: reg = hit; continue
            if al.lower() not in ("insgesamt", "zusammen", ""): ok = False; other.add("%s=%s" % (vc, al))
        if not reg or not ok: continue
        y = (r.get("time") or "").strip()[:4]; v = num(r.get("value"))
        if not y.isdigit() or v is None: continue
        kinds.add(k)
        if reg[0] == "LAND": nat.setdefault(reg[1], {}).setdefault(y, {})[k] = v
        else: units.setdefault(reg[0], {"id": reg[0], "name": reg[1], "land": LAND_OF[reg[0][:3]], "years": {}})["years"].setdefault(y, {})[k] = v
    if other: log("filas descartadas por clasificaciones no totales (muestra):", sorted(other)[:20])
    log("regiones con datos: %d; Länder/total: %s; magnitudes: %s" % (len(units), sorted(nat), sorted(kinds)))
    if len(units) < 34 or "price" not in kinds: log("ERROR: estructura inesperada (se esperaban 38 regiones con precio por hectárea)"); return 1
    def rows(d): return [dict(year=y, **{{"price": "priceEurHa", "area": "areaHa", "cases": "sales"}[k]: (round(v) if k != "area" else round(v, 1)) for k, v in sorted(x.items())}) for y, x in sorted(d.items())]
    U = []
    for uid in sorted(units):
        u = units[uid]; U.append({"id": uid, "name": u["name"], "land": u["land"], "years": rows(u["years"])})
    last = max(r["year"] for u in U for r in u["years"] if "priceEurHa" in r)
    if int(last) < datetime.date.today().year - 3: log("ERROR: último año %s demasiado antiguo" % last); return 1
    missing = sorted(v[0] for v in REG.values() if v[0] not in units)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "lastYear": last, "table": TABLE,
           "source": {"id": "destatis", "name": "Statistisches Bundesamt (Destatis), GENESIS-Online, table 61521-0020 (Kaufwerte für landwirtschaftliche Grundstücke)",
                      "url": "https://www-genesis.destatis.de/datenbank/online/statistic/61521/table/61521-0020", "license": "Datenlizenz Deutschland – Namensnennung – Version 2.0"},
           "methodology": {
             "es": "Precio medio de las compraventas de tierra agrícola (superficie agraria, sin edificios ni inventario) registradas en el año, en euros por hectárea, con la superficie vendida y el número de compraventas, tal como los publica Destatis por Regierungsbezirk. Las regiones con pocas ventas pueden variar mucho de un año a otro.",
             "en": "Average price of agricultural land sales (farmland, without buildings or inventory) recorded in the year, in euros per hectare, with the area sold and the number of sales, as published by Destatis by Regierungsbezirk. Regions with few sales can swing a lot from year to year.",
             "fr": "Prix moyen des ventes de terres agricoles (surface agricole, sans bâtiments ni inventaire) enregistrées dans l’année, en euros par hectare, avec la surface vendue et le nombre de ventes, tels que publiés par Destatis par Regierungsbezirk. Les régions avec peu de ventes peuvent varier fortement d’une année à l’autre.",
             "it": "Prezzo medio delle compravendite di terreni agricoli (superficie agricola, senza fabbricati né scorte) registrate nell’anno, in euro per ettaro, con la superficie venduta e il numero di compravendite, come li pubblica Destatis per Regierungsbezirk. Le regioni con poche vendite possono oscillare molto da un anno all’altro."},
           "missing": missing, "units": U, "totals": [{"name": k, "years": rows(v)} for k, v in sorted(nat.items())], "log": LOG[-14:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "de-land-prices.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "de-land-prices.json")
    log("escrito: %d regiones, último año %s, faltan %s" % (len(U), last, missing)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "de-land-prices-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

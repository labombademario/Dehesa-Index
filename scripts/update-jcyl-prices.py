#!/usr/bin/env python3
"""Observatorio de precios de los productos agrícolas y ganaderos de Castilla y León (Junta de Castilla y León, datos abiertos).
Precios mensuales en origen por provincia (más el total de la Comunidad) desde 2015, un CSV (cp1252, separador ';', decimal '.').
Licencia: Creative Commons Reconocimiento 4.0 (la página del conjunto de datos en datosabiertos.jcyl.es la declara).
Reglas: nada se estima ni se rellena; un dato no numérico o no positivo se ignora y se cuenta; un mes repetido con dos valores distintos aborta la carga.
Si la fuente falla o trae muy pocas filas NO se sobrescribe data/es-jcyl-prices.json."""
import csv, io, json, sys, urllib.request, datetime, collections
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://datosabiertos.jcyl.es/web/jcyl/risp/es/medio-rural-pesca/observatorio-precios-agrarios/1284987653873.csv"
PAGE = "https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-rural-pesca/observatorio-precios-agrarios/1284987653873"
UA = "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"
SCOPES = {"CYL": "Castilla y León", "05": "Ávila", "09": "Burgos", "24": "León", "34": "Palencia", "37": "Salamanca", "40": "Segovia", "42": "Soria", "47": "Valladolid", "49": "Zamora"}
UNITS = {"euros/100 kg": "€/100 kg", "euros/100 kg vivo": "€/100 kg vivo", "euros/100 l": "€/100 l", "euros/100 doc": "€/100 docenas", "cabeza": "€/cabeza", "euros/cabeza en vivo": "€/cabeza vivo"}

def scope(a):
    a = a.strip()
    if a.upper() == "CYL": return "CYL"
    code = a.split("-")[0].strip().zfill(2)
    return code if code in SCOPES else None

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    raw = Path(src).read_bytes() if src else urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": UA}), timeout=90).read()
    for enc in ("utf-8-sig", "cp1252"):
        try: txt = raw.decode(enc); break
        except UnicodeDecodeError: continue
    rows = list(csv.reader(io.StringIO(txt), delimiter=";"))
    if [h.strip().upper() for h in rows[0]] != ["MES", "AÑO", "PRODUCTO", "AMBITO", "PRECIO", "UNIDAD"]:
        print("Cabecera inesperada:", rows[0]); sys.exit(1)
    rows = rows[1:]
    if len(rows) < 20000: print("Solo %d filas: no se sobrescribe" % len(rows)); sys.exit(1)
    prods = collections.OrderedDict(); ignored = 0; unk = collections.Counter()
    for r in rows:
        if len(r) < 6: ignored += 1; continue
        m, y, p, a, pr, u = [x.strip() for x in r[:6]]
        sc = scope(a)
        try: m, y, pr = int(m), int(y), float(pr)
        except ValueError: ignored += 1; continue
        if sc is None or not 1 <= m <= 12 or pr <= 0: ignored += 1; unk[a] += 0 if sc else 1; continue
        ul = u.lower(); note = None
        unit = UNITS.get(ul)
        if unit is None and ul.startswith("euros/cabeza vivo"): unit, note = "€/cabeza vivo", u
        if unit is None: print("Unidad no reconocida: %r (%s)" % (u, p)); sys.exit(1)
        P = prods.setdefault(p, {"id": p, "name": p, "unit": unit, "series": {}})
        if P["unit"] != unit: print("El producto %s cambia de unidad (%s / %s)" % (p, P["unit"], unit)); sys.exit(1)
        if note: P["unitNote"] = note
        S = P["series"].setdefault(sc, {}); k = y * 100 + m
        if k in S and S[k] != pr: print("Dato repetido con valores distintos: %s %s %s" % (p, sc, k)); sys.exit(1)
        S[k] = pr
    out = []
    last = 0
    for p in sorted(prods):
        P = prods[p]
        P["series"] = {s: [[k, v] for k, v in sorted(S.items())] for s, S in P["series"].items()}
        for S in P["series"].values(): last = max(last, S[-1][0])
        out.append(P)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "lastPeriod": "%d-%02d" % (last // 100, last % 100),
           "source": {"id": "jcyl_open_data", "name": "Junta de Castilla y León, Observatorio de precios de los productos agrícolas y ganaderos (datos abiertos)", "url": PAGE, "license": "Creative Commons Reconocimiento 4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.es_ES"},
           "note": "Precios mensuales en origen (sin transporte, subvenciones ni impuestos indirectos) por provincia; el total de la Comunidad lo pondera la Junta. Formato de cada punto: [AAAAMM, precio]. Sin dato = no hay punto.",
           "scopes": SCOPES, "ignoredRows": ignored, "products": out}
    (ROOT / "data" / "es-jcyl-prices.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Observatorio CyL: %d productos, %d filas leídas, %d ignoradas, último mes %s" % (len(out), len(rows), ignored, doc["lastPeriod"]))

main()

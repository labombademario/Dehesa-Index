#!/usr/bin/env python3
"""Series historicas del Anuario de Estadistica Forestal 2021 (MITECO): piñon, castaña, trufas y hongos, resina, cortas de madera y leñas.
Uso: python3 -I scripts/extract-anuario2021-series.py <texto.txt>   (texto = pdftotext -layout del PDF; el sandbox no llega a miteco.gob.es, se baja con la rama de sondeo)
Lee las tablas 8.7, 8.11, 9.4, 9.6, 9.8 y 9.10 por su pie de tabla. Copia las cifras tal cual; los asteriscos del MITECO quedan como bandera 'est'. No estima nada."""
import json, re, sys, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "data"
L = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").splitlines()
NUM = re.compile(r"^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?%?\*{0,4}$|^s\.d\.$|^S\.D\.$", re.I)
def n(tok):
    if tok.lower() == "s.d.": return None
    t = tok.rstrip("*").rstrip("%").replace(".", "").replace(",", "."); return float(t) if "." in t else int(t)
def rows(cap, back=75):
    i = next(k for k, l in enumerate(L) if re.search(cap, l)); out = {}
    for l in L[max(0, i - back):i]:
        t = re.sub(r"\s+(\*+)", r"\1", l).split()
        if len(t) >= 3 and re.fullmatch(r"20[0-2]\d", t[0]) and all(NUM.match(x) for x in t[1:]):
            out[int(t[0])] = t[1:]
    return out
def series(cap, cols, back=75):
    r = rows(cap, back); res = []
    for y in sorted(r):
        t = r[y]
        if len(t) != len(cols): sys.exit("%s %s: %d columnas, esperaba %d: %s" % (cap, y, len(t), len(cols), t))
        row = {"year": y}
        for c, x in zip(cols, t): row[c] = n(x)
        row["est"] = any(x.endswith("*") for x in t)
        res.append(row)
    return res
def madera():
    r = rows(r"Tabla 8\.7:", 95); res = []
    for y in sorted(r):
        t = r[y]
        if len(t) == 6: c, f, s, tot, var, val = t
        elif len(t) == 5: c, f, tot, var, val = t; s = None
        else: sys.exit("8.7 %s: %s" % (y, t))
        res.append({"year": y, "coniferas": n(c), "frondosas": n(f), "sinClasificar": n(s) if s else None, "total": n(tot), "valor": n(val), "est": val.endswith("*")})
    return res
out = {"schemaVersion": 1, "kind": "manual",
 "source": {"name": "MITECO, Anuario de Estadistica Forestal 2021 (tablas 8.7, 8.11, 9.4, 9.6, 9.8 y 9.10)", "url": "https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/estadisticas/aef2021/Anuario%20Estadistica%20Forestal%202021.pdf"},
 "notes": {"est": "Valor economico calculado por el MITECO a partir de un precio medio estimado (asterisco en el Anuario), no un precio de mercado.", "s.d.": "sin dato publicado"},
 "wood": madera(),
 "firewood": series(r"Tabla 8\.11:", ["production", "change", "value"], 60),
 "resin": series(r"Tabla 9\.4:", ["production", "value"]),
 "chestnut": series(r"Tabla 9\.6:", ["production", "value"]),
 "pineNut": series(r"Tabla 9\.8:", ["production", "value"]),
 "truffle": [], "mushrooms": []}
for y, t in sorted(rows(r"Tabla 9\.10:", 80).items()):
    if len(t) != 4: sys.exit("9.10 %s: %s" % (y, t))
    out["truffle"].append({"year": y, "production": n(t[0]), "value": n(t[1])}); out["mushrooms"].append({"year": y, "production": n(t[2]), "value": n(t[3])})
for k in ("firewood",):
    for r in out[k]: r.pop("change")
(D / "es-forest-products-anuario2021.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print({k: (len(v), v[0]["year"], v[-1]["year"]) for k, v in out.items() if isinstance(v, list)})

#!/usr/bin/env python3
"""Escribe en js/data.js la linea `var FXM = {...};`: dolares por 1 unidad de EUR, GBP, CAD y DKK, MEDIA MENSUAL del BCE desde 1999-01.
La web convierte cada precio con el cambio del mes del dato (no con el de hoy). Origen: data/fx-history.json (lo refresca update-fx-history.py).
Uso: python3 scripts/build-fx-monthly.py [--check]"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
START = "1999-01"
def build():
    d = json.load(open(ROOT / "data" / "fx-history.json"))["currencies"]
    usd = {m: v for m, v in d["USD"]}
    out = {"s": START}
    months = None
    for c in ("EUR", "GBP", "CAD", "DKK"):
        q = {m: v for m, v in (d["USD"] if c == "EUR" else d[c])}
        rows = []
        for m in sorted(usd):
            if m not in q: raise SystemExit("falta el mes %s para %s" % (m, c))
            rows.append(round(usd[m] if c == "EUR" else usd[m] / q[m], 5))
        if months is None: months = sorted(usd)
        out[c] = rows
    if months[0] != START: raise SystemExit("la serie no empieza en " + START)
    # meses consecutivos sin huecos: el indice es (anio-1999)*12+mes-1
    for i, m in enumerate(months):
        if (int(m[:4]) - 1999) * 12 + int(m[5:7]) - 1 != i: raise SystemExit("hueco en " + m)
    out["e"] = months[-1]
    return "var FXM = " + json.dumps(out, separators=(",", ":")) + "; // medias mensuales del BCE (USD por 1 unidad); las escribe scripts/build-fx-monthly.py"
def main():
    p = ROOT / "js" / "data.js"; src = p.read_text(encoding="utf8")
    line = build(); rx = re.compile(r"^[ \t]*var FXM = .*$", re.M)
    if not rx.search(src): raise SystemExit("data.js no tiene la linea `var FXM = ...;` (anclarla junto a var FX = ...)")
    new = rx.sub(lambda m: "  " + line, src, count=1)
    if "--check" in sys.argv: sys.exit(0 if new == src else 1)
    if new != src: p.write_text(new, encoding="utf8"); print("js/data.js: FXM actualizado")
    else: print("FXM sin cambios")
if __name__ == "__main__": main()

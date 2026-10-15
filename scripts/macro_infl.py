#!/usr/bin/env python3
"""Inflación interanual por país para la franja macro (data/country-macro.json -> countries[CC].infl).
Sale solo de data/cpi.json (sin red): mensual = variación del último mes con dato frente al mismo mes del año anterior
(Eurostat HICP, BLS, StatCan, ONS); anual = variación del último año del índice del Banco Mundial (solo si el país no tiene mensual, p. ej. Australia).
infl = {v: % interanual (2 decimales), y: año, m: 'AAAA-MM' o null, src: id del registro de licencias, kind: 'hicp' | 'cpi'}
Uso: python3 scripts/macro_infl.py   (parchea data/country-macro.json con lo que hay en data/cpi.json)"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"EA"}  # zona euro: el perfil de país no la muestra; la UE (EU) sí


def _ym(s, i):
    y, m = int(s[:4]), int(s[5:7])
    t = y * 12 + (m - 1) + i
    return "%04d-%02d" % (t // 12, t % 12 + 1)


def one(c):
    """Inflación de un bloque de país de cpi.json, o None si no hay dos puntos comparables."""
    m = c.get("m")
    if m and m.get("v"):
        v = m["v"]
        for i in range(len(v) - 1, 11, -1):
            if v[i] is not None and v[i - 12] is not None and v[i - 12] > 0:
                return {"v": round((v[i] / v[i - 12] - 1) * 100, 2), "y": int(_ym(m["s"], i)[:4]), "m": _ym(m["s"], i), "src": m.get("src"), "kind": "hicp" if m.get("src") == "eurostat" else "cpi"}
            if i < len(v) - 3:  # el último dato publicado manda: si faltan los 3 últimos meses, no se inventa
                break
    a = c.get("a")
    if a and a.get("v") and not m:
        v = a["v"]
        if len(v) >= 2 and v[-1] is not None and v[-2] is not None and v[-2] > 0:
            return {"v": round((v[-1] / v[-2] - 1) * 100, 2), "y": a["y0"] + len(v) - 1, "m": None, "src": a.get("src"), "kind": "cpi"}
    return None


def compute(cpi):
    out = {}
    for cc, c in cpi.get("countries", {}).items():
        if cc in SKIP:
            continue
        r = one(c)
        if r and r["v"] is not None and abs(r["v"]) < 100:
            out[cc] = r
    return out


def patch(macro, cpi):
    """Añade/actualiza infl en macro['countries'] (crea la entrada del país si no existe). Devuelve el nº de países con infl."""
    inf = compute(cpi)
    cs = macro.setdefault("countries", {})
    for cc in list(cs):
        if "infl" in cs[cc] and cc not in inf:
            del cs[cc]["infl"]
    for cc, r in inf.items():
        cs.setdefault(cc, {})["infl"] = r
    return len(inf)


def main():
    mp, cp = ROOT / "data" / "country-macro.json", ROOT / "data" / "cpi.json"
    macro, cpi = json.loads(mp.read_text(encoding="utf-8")), json.loads(cp.read_text(encoding="utf-8"))
    before = json.dumps(macro["countries"], sort_keys=True)
    n = patch(macro, cpi)
    if json.dumps(macro["countries"], sort_keys=True) != before:
        mp.write_text(json.dumps(macro, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("infl: %d paises, country-macro.json actualizado" % n)
    else:
        print("infl: %d paises, sin cambios" % n)
    return 0


if __name__ == "__main__":
    sys.exit(main())

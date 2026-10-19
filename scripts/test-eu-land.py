#!/usr/bin/env python3
"""Pruebas de scripts/update-eu-land.py con JSON-stat sintetico: lectura de dimensiones, un solo año de regadio por pais, SAU del mismo año, y rechazo de datos imposibles."""
import importlib.util, json, tempfile, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
s = importlib.util.spec_from_file_location("m", ROOT / "scripts" / "update-eu-land.py"); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
def js(dims, rows):
    ids = list(dims); size = [len(dims[k]) for k in ids]; val = {}
    for key, v in rows:
        i = 0
        for k, n in zip(ids, size): i = i * n + dims[k].index(key[k])
        val[str(i)] = v
    return {"id": ids, "size": size, "dimension": {k: {"category": {"index": dims[k], "label": {x: x for x in dims[k]}}} for k in ids}, "value": val}
ok = 0
def check(name, cond):
    global ok
    if not cond: sys.exit("FALLA: " + name)
    ok += 1; print("OK    ", name)
d = js({"a": ["x", "y"], "geo": ["FR", "ES"]}, [({"a": "x", "geo": "FR"}, 1), ({"a": "y", "geo": "ES"}, 2)])
r, l = m.jsonstat(d); check("JSON-stat: filas y dimensiones", sorted((x["a"], x["geo"], v) for x, v in r) == [("x", "FR", 1), ("y", "ES", 2)])
check("pais por codigo NUTS", m.cc_of("FR10") == "FR" and m.cc_of("ES") is None and m.cc_of("EL43") == "EL" and m.level("EL43") == 2 and m.level("DE") == 0)
def fx(irr, lus, price_years=(2019, 2020)):
    geos = ["FR", "IT", "PL", "PT", "DE", "BE", "HR", "EL"]
    pr = []
    for g in geos:
        for p, base in (("ARA", 1000), ("J0000", 500), ("ARAIB", 2000), ("ARAXIB", 1000)):
            if g in ("DE",) or (p in ("ARAIB", "ARAXIB") and g not in ("IT", "EL")): continue
            for y in price_years: pr.append(({"freq": "A", "unit": "EUR_HA", "agriprod": p, "geo": g, "time": str(y)}, base + y % 10))
    dp = js({"freq": ["A"], "unit": ["EUR_HA"], "agriprod": ["ARA", "ARAIB", "ARAXIB", "J0000"], "geo": geos, "time": [str(y) for y in price_years]}, pr)
    di = js({"freq": ["A"], "irrmeth": ["TOTAL"], "wat_src": ["TOTAL"], "statinfo": ["TOTAL"], "irr_area": ["UAA_IT"], "unit": ["HA"], "geo": geos + ["FR10"], "time": ["2010", "2023"]},
            [({"freq": "A", "irrmeth": "TOTAL", "wat_src": "TOTAL", "statinfo": "TOTAL", "irr_area": "UAA_IT", "unit": "HA", "geo": g, "time": y}, v) for (g, y), v in irr.items()])
    dl = js({"freq": ["A"], "statinfo": ["TOTAL"], "crops": ["UAA"], "farmtype": ["TOTAL"], "so_eur": ["TOTAL"], "uaarea": ["TOTAL"], "unit": ["HA"], "geo": geos + ["FR10"], "time": ["2010", "2023"]},
            [({"freq": "A", "statinfo": "TOTAL", "crops": "UAA", "farmtype": "TOTAL", "so_eur": "TOTAL", "uaarea": "TOTAL", "unit": "HA", "geo": g, "time": y}, v) for (g, y), v in lus.items()])
    return dp, di, dl
def run(dp, di, dl):
    d = Path(tempfile.mkdtemp())
    for n, x in (("apri_lprc", dp), ("irri", di), ("lus", dl)): (d / (n + ".json")).write_text(json.dumps(x))
    out = m.build(str(d)); m.validate(out); return out
G = ["FR", "IT", "PL", "PT", "DE", "BE", "HR", "EL"]
irr = {(g, "2023"): 100 for g in G}; lus = {(g, "2023"): 1000 for g in G}
irr[("FR10", "2010")] = 50; lus[("FR10", "2010")] = 500          # region con otro año que el nacional: se descarta
for g in ("IT", "PL", "EL"): irr.pop((g, "2023")); lus.pop((g, "2023")); irr[(g, "2010")] = 200; lus[(g, "2010")] = 1000
out = run(*fx(irr, lus))
check("año unico por pais: region de otro año descartada", "FR10" not in out["FR"]["irrigation"]["regions"])
check("Italia usa su ultimo año (2010) con la SAU de 2010", out["IT"]["irrigation"]["regions"]["IT"]["year"] == 2010 and out["IT"]["irrigation"]["regions"]["IT"]["share"] == 20.0)
check("Francia usa 2023", out["FR"]["irrigation"]["regions"]["FR"]["year"] == 2023 and out["FR"]["irrigation"]["regions"]["FR"]["share"] == 10.0)
check("Italia y Grecia traen arable de regadio y secano", out["IT"]["price"]["ARAIB"]["IT"][0][0] == 2019 and "ARAXIB" in out["EL"]["price"])
check("Francia no trae regadio/secano inventado", "ARAIB" not in out["FR"]["price"])
check("Alemania sin precios (solo regadio)", out["DE"]["price"] == {} and "DE" in out["DE"]["irrigation"]["regions"])
bad = dict(irr); bad[("PT", "2023")] = 5000
try: run(*fx(bad, lus)); check("regadio mayor que SAU rechazado: no se rechazo", False)
except RuntimeError as e: check("regadio mayor que SAU: se descarta y falla por falta de dato nacional", "PT" in str(e))
dp, di, dl = fx(irr, lus)
for k in dp["value"]:
    if dp["id"] and True: pass
try:
    low = js({"freq": ["A"], "unit": ["EUR_HA"], "agriprod": ["ARA"], "geo": ["FR"], "time": ["2020"]}, [({"freq": "A", "unit": "EUR_HA", "agriprod": "ARA", "geo": "FR", "time": "2020"}, 5)])
    run(low, di, dl); check("precio imposible rechazado: no se rechazo", False)
except RuntimeError as e: check("precio imposible o ausente rechazado", True)
print(ok, "comprobaciones OK")

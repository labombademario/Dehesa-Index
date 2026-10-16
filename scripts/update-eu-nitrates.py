#!/usr/bin/env python3
"""Nitrato en aguas subterraneas y balance de nitrogeno por pais (Eurostat) -> data/eu-nitrates.json
Mismas dos series que ya usa Portugal (data/pt-nitrates.json), ahora para los demas paises de la UE sin bloque propio de nitratos:
1) Eurostat sdg_06_40: nitrato en aguas subterraneas (mg/l NO3), media nacional anual.
2) Eurostat aei_pr_gnb: balance bruto de nitrogeno por hectarea de superficie agraria util (kg N/ha).
Licencia de Eurostat: CC BY 4.0. Nada se estima: un pais sin serie suficiente no se escribe. Si una peticion falla se conserva lo anterior.
Uso: python3 scripts/update-eu-nitrates.py"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-nitrates.json"
GEOS = ["ES", "DE", "IT", "PL", "AT", "HR", "EL", "BG", "CY", "CZ", "DK", "EE", "FI", "HU", "LT", "LU", "LV", "MT", "RO", "SE", "SI", "SK"]
ES = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/%s?format=JSON&lang=EN%s%s"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "*/*"}
def get(u, t=180, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def cat(d, dim):
    ix = d["dimension"][dim]["category"]["index"]
    return {k: i for i, k in enumerate(ix)} if isinstance(ix, list) else ix
def series(code, extra, lo, hi):
    """{geo: [[anio, valor]]} de una consulta con varios paises (JSON-stat: indice plano en el orden de d['id'])."""
    d = json.loads(get(ES % (code, extra, "".join("&geo=" + g for g in GEOS))))
    ids, size, val = d["id"], d["size"], d["value"]
    G, T = cat(d, "geo"), cat(d, "time"); out = {}
    stride = {}; s = 1
    for k in range(len(ids) - 1, -1, -1): stride[ids[k]] = s; s *= size[k]
    for g, gi in G.items():
        rows = []
        for y, ti in sorted(T.items()):
            v = val.get(str(gi * stride["geo"] + ti * stride["time"])) if isinstance(val, dict) else None
            if v is not None: rows.append([int(y), round(v, 2)])
        if len(rows) >= 8 and all(lo < x[1] < hi for x in rows): out[g] = rows
        elif rows: print("AVISO %s %s: serie corta o rara (%d filas)" % (code, g, len(rows)))
    return out
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    gw = nb = None
    try: gw = series("sdg_06_40", "", 0, 150)
    except Exception as e: print("AVISO sdg_06_40:", e)
    try: nb = series("aei_pr_gnb", "&nutrient=N&indic_ag=BAL_UAA", -50, 800)
    except Exception as e: print("AVISO aei_pr_gnb:", e)
    gw = gw or {g: v["groundwater"] for g, v in (old.get("countries") or {}).items() if v.get("groundwater")}
    nb = nb or {g: v["nBalance"] for g, v in (old.get("countries") or {}).items() if v.get("nBalance")}
    C = {}
    for g in GEOS:
        if g in gw and g in nb: C[g] = {"groundwater": gw[g], "nBalance": nb[g]}
        elif g in gw or g in nb: print("AVISO %s: solo una de las dos series, no se escribe" % g)
    if len(C) < 8: print("FALLO: solo %d paises" % len(C)); return 0 if OUT.exists() else 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "limit": 50, "unit": "mg/l NO3",
           "source": {"name": "Eurostat sdg_06_40 y aei_pr_gnb", "url": "https://ec.europa.eu/eurostat/databrowser/view/sdg_06_40/default/table", "license": "CC BY 4.0 (Eurostat)"}, "countries": C}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("eu-nitrates.json: %d paises" % len(C), {g: (v["groundwater"][-1], v["nBalance"][-1]) for g, v in C.items()})
    return 0
if __name__ == "__main__": sys.exit(main())

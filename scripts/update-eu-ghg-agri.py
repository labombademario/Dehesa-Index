#!/usr/bin/env python3
"""Emisiones de gases de efecto invernadero de la agricultura de un pais de la UE, segun su inventario nacional tal como lo publica Eurostat
(env_air_gge, CC BY 4.0) -> data/<pais>-ghg-agri.json, con el mismo esquema que data/es-ghg-agri.json (que sale del inventario del MITECO).
kt de CO2 equivalente. Agricultura = CRF3 (categorias 3A-3J); por ganado = digestion (3A1-3A4) + estiercol (3B1-3B4), y el N2O indirecto del
estiercol (3B5) aparte; por gas = CH4, N2O y CO2 en CO2 equivalente; maquinaria = CRF1A4C (en Eurostat incluye la pesca); total = sin LULUCF.
Uso: python3 scripts/update-eu-ghg-agri.py FR [fr]"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/env_air_gge?format=JSON&lang=EN&geo=%s&unit=THS_T"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
CATS = {"enteric": ["CRF3A"], "manure": ["CRF3B"], "rice": ["CRF3C"], "soils": ["CRF3D"], "burning": ["CRF3E", "CRF3F"], "liming": ["CRF3G"], "urea": ["CRF3H"], "otherC": ["CRF3I", "CRF3J"]}
SPEC = {"cattle": ["CRF3A1", "CRF3B1"], "sheep": ["CRF3A2", "CRF3B2"], "pigs": ["CRF3A3", "CRF3B3"], "other": ["CRF3A4", "CRF3B4"], "indirect": ["CRF3B5"]}
GAS = {"CH4": "CH4_CO2E", "N2O": "N2O_CO2E", "CO2": "CO2"}
def get(u, t=180):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def cube(geo, airpol, crfs):
    d = get(API % geo + "&airpol=" + airpol + "".join("&src_crf=" + c for c in crfs))
    T = d["dimension"]["time"]["category"]["index"]; S = d["dimension"]["src_crf"]["category"]["index"]; v = d["value"]
    nt = len(T); yrs = sorted(T, key=lambda k: T[k])
    return yrs, {c: [v.get(str(S[c] * nt + T[y])) for y in yrs] for c in S}
def main():
    geo = (sys.argv[1] if len(sys.argv) > 1 else "FR").upper(); key = (sys.argv[2] if len(sys.argv) > 2 else geo.lower())
    out = ROOT / "data" / ("%s-ghg-agri.json" % key)
    try:
        allc = sorted({c for v in list(CATS.values()) + list(SPEC.values()) for c in v} | {"CRF3", "CRF1A4C", "TOTX4_MEMO"})
        yrs, G = cube(geo, "GHG", allc)
        gas = {}
        for k, a in GAS.items():
            y2, X = cube(geo, a, ["CRF3"]); m = dict(zip(y2, X.get("CRF3", [])))
            gas[k] = [m.get(y) for y in yrs]
    except Exception as e:
        print("FALLO descarga:", e); return 0 if out.exists() else 1
    keep = [i for i, y in enumerate(yrs) if G.get("CRF3", [None])[i] is not None and G.get("TOTX4_MEMO", [None])[i] is not None]
    if len(keep) < 30: print("FALLO serie corta"); return 0 if out.exists() else 1
    years = [int(yrs[i]) for i in keep]
    def ser(codes): return [round(sum((G.get(c) or [None] * len(yrs))[i] or 0.0 for c in codes), 1) for i in keep]
    agri = [round(G["CRF3"][i], 1) for i in keep]; nat = [round(G["TOTX4_MEMO"][i], 1) for i in keep]; mach = [round(G["CRF1A4C"][i] or 0.0, 1) for i in keep]
    bycat = {k: ser(v) for k, v in CATS.items()}
    # lo que las subcategorias no cubren (redondeos o categorias sin desglose) se anota aparte para que la suma cuadre con CRF3
    rest = [round(agri[j] - sum(v[j] for v in bycat.values()), 1) for j in range(len(keep))]
    if any(abs(x) > 0.05 * agri[j] for j, x in enumerate(rest)): print("FALLO las categorias no cuadran con CRF3:", rest[-3:]); return 0 if out.exists() else 1
    bycat["otherC"] = [round(bycat["otherC"][j] + rest[j], 1) for j in range(len(keep))]
    bygas = {k: [round(v[i] or 0.0, 1) for i in keep] for k, v in gas.items()}
    grest = [round(agri[j] - sum(v[j] for v in bygas.values()), 1) for j in range(len(keep))]
    if any(abs(x) > 0.02 * agri[j] for j, x in enumerate(grest)): print("FALLO los gases no cuadran con CRF3:", grest[-3:]); return 0 if out.exists() else 1
    big = max(bygas, key=lambda k: bygas[k][-1]); bygas[big] = [round(bygas[big][j] + grest[j], 1) for j in range(len(keep))]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "kt CO2-eq", "country": geo,
           "source": {"name": "Eurostat, env_air_gge (inventario nacional de gases de efecto invernadero comunicado a la CMNUCC y a la UE)", "url": "https://ec.europa.eu/eurostat/databrowser/view/env_air_gge/default/table", "license": "CC BY 4.0 (política de reutilización de Eurostat)"},
           "machineryIncludesFishing": True, "years": years, "agriculture": agri, "national": nat, "machinery": mach,
           "byCategory": bycat, "bySpecies": {k: ser(v) for k, v in SPEC.items()}, "byGas": bygas}
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    L = len(years) - 1
    print("%s: %d-%d; agricultura %.0f kt (%.1f %% de %.0f kt); maquinaria y pesca %.0f kt; categorias %s; ganado %s; gases %s" % (out.name, years[0], years[-1], agri[L], 100 * agri[L] / nat[L], nat[L], mach[L], {k: round(v[L]) for k, v in bycat.items()}, {k: round(v[L]) for k, v in doc["bySpecies"].items()}, {k: round(v[L]) for k, v in bygas.items()}))
    return 0
def many(codes):
    """Varios paises en una sola ejecucion (16-oct-2026): python3 scripts/update-eu-ghg-agri.py --many BG CZ DK ...
    Cada pais escribe su data/<pais>-ghg-agri.json; el que falle conserva su fichero anterior. Rojo solo si ninguno sale."""
    ok = 0
    for cc in codes:
        sys.argv = [sys.argv[0], cc, cc.lower()]
        try: r = main()
        except Exception as e: print("FALLO", cc, e); r = 1
        if r == 0 and (ROOT / "data" / ("%s-ghg-agri.json" % cc.lower())).exists(): ok += 1
    print("paises con fichero: %d de %d" % (ok, len(codes)))
    return 0 if ok else 1
if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--many": sys.exit(many([a.upper() for a in sys.argv[2:]]))
    sys.exit(main())

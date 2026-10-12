#!/usr/bin/env python3
"""Embalses del oeste de EE. UU. (Bureau of Reclamation) -> data/us-reservoirs.json (+ data/us-reservoirs-normals.json)
Lista de embalses, ubicacion y capacidad: Western Water Data Hub (Internet of Water), coleccion teacup-edr, la misma que usa el panel oficial
«Reservoir Conditions» de Reclamation (https://data.usbr.gov/visualizations/reservoir-conditions). Agua almacenada: API RISE de Reclamation
(parametro 3, Lake/Reservoir Storage, acre-pies), dato diario. Media 1990-2020 por dia del ano: calculada por Dehesa Index con la serie RISE de
esos 30 anos (data/us-reservoirs-normals.json; se recalcula si falta o tiene mas de un ano). Datos federales de EE. UU.: dominio publico.
Solo los embalses que publica RISE (los de USACE y USGS de la lista no entran). Un embalse sin dato en las ultimas 3 semanas queda sin valor.
Uso: python3 scripts/update-us-reservoirs.py"""
import csv, datetime, io, json, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-reservoirs.json"; NORM = ROOT / "data" / "us-reservoirs-normals.json"
LIST = "https://api.wwdh.internetofwater.app/collections/teacup-edr/items?f=csv&limit=5000"
RISE = "https://data.usbr.gov/rise/api/result"
H = {"User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)", "Accept": "application/vnd.api+json, application/json, text/csv, */*"}
FIPS = {"04": "AZ", "06": "CA", "08": "CO", "16": "ID", "20": "KS", "30": "MT", "31": "NE", "32": "NV", "35": "NM", "38": "ND", "40": "OK", "41": "OR", "46": "SD", "48": "TX", "49": "UT", "53": "WA", "56": "WY"}
TODAY = datetime.date.today()
def get(u, t=120):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:120], last))
def rise(loc, after, before=None, n=500):
    q = [("locationId", loc), ("parameterId", 3), ("dateTime[after]", after), ("itemsPerPage", n), ("order[dateTime]", "DESC")]
    if before: q.append(("dateTime[before]", before))
    out = {}
    for x in json.loads(get(RISE + "?" + urllib.parse.urlencode(q), 240)).get("data", []):
        a = x.get("attributes") or {}; v = a.get("result"); d = (a.get("dateTime") or "")[:10]
        ra = a.get("resultAttributes") or {}
        if ra.get("resultType") not in (None, "observed") or a.get("modelRunId"): continue   # solo observado: fuera previsiones y modelos
        if not d or d > TODAY.isoformat(): continue   # ninguna fecha futura (hay series con 2099-12-31 de relleno)
        if isinstance(v, (int, float)) and v >= 0: out.setdefault(d, float(v))
    return out
def normals(loc):
    s = rise(loc, "1990-09-30", "2020-10-01", 15000); by = {}
    for d, v in s.items():
        dt = datetime.date.fromisoformat(d); doy = min(dt.timetuple().tm_yday, 365); by.setdefault(doy, []).append(v)
    if len(s) < 3650: return None   # menos de 10 anos de datos: sin media
    res = []
    for k in range(1, 366):
        w = [v for j in range(k - 3, k + 4) for v in by.get((j - 1) % 365 + 1, [])]
        res.append(round(sum(w) / len(w)) if len(w) >= 40 else None)
    return res
def main():
    rows = list(csv.DictReader(io.StringIO(get(LIST).decode("utf-8"))))
    res = [r for r in rows if r["source_name"].startswith("RISE") and "/rise/api/location/" in r["source_uri"]]
    if len(res) < 150: print("FALLO: solo %d embalses RISE en la lista" % len(res)); return 1
    # coordenadas: la lista CSV no las trae; se piden en GeoJSON
    gj = json.loads(get(LIST.replace("f=csv", "f=json")))
    xy = {f["properties"]["id"]: f["geometry"]["coordinates"] for f in gj.get("features", []) if f.get("geometry")}
    try: N = json.loads(NORM.read_text())
    except Exception: N = {"generatedAt": "2000-01-01", "items": {}}
    rebuild = (TODAY - datetime.date.fromisoformat(N["generatedAt"][:10])).days > 365
    after = (TODAY - datetime.timedelta(days=380)).isoformat()
    def one(r):
        # el identificador fiable es wwdh_fid (= locationId de la consulta de datos); source_uri tiene alguna errata (Mead: 3154 en vez de 3514)
        loc = (r.get("wwdh_fid") or "").strip() if r.get("wwdh_collection") == "rise-edr" else ""
        if not loc.isdigit():
            import re as _re
            m = _re.search(r"locationId=(\d+)", r.get("source_api_url") or ""); loc = m.group(1) if m else r["source_uri"].rstrip("/").split("/")[-1]
        try: s = rise(loc, after)
        except Exception as e: return r, loc, None, None, str(e)[:120]
        nm = N["items"].get(loc)
        if rebuild or loc not in N["items"]:
            try: nm = normals(loc)
            except Exception: nm = N["items"].get(loc)
        return r, loc, s, nm, None
    with ThreadPoolExecutor(8) as ex: got = list(ex.map(one, res))
    items = []; newN = {}; errs = 0
    for r, loc, s, nm, err in got:
        if nm: newN[loc] = nm
        if err: errs += 1; print("AVISO", r["id"], err); continue
        cap = float(r["capacity_value"]) if r["capacity_value"] else None
        if not s or not cap: continue
        d = max(s); v = s[d]; dd = datetime.date.fromisoformat(d)
        if (TODAY - dd).days > 21: continue   # sin dato reciente: no se muestra un valor viejo como actual
        ago = dd - datetime.timedelta(days=365); ya = min((x for x in s if abs((datetime.date.fromisoformat(x) - ago).days) <= 4), key=lambda x: abs((datetime.date.fromisoformat(x) - ago).days), default=None)
        doy = min(dd.timetuple().tm_yday, 365); avg = nm[doy - 1] if nm else None
        st = FIPS.get(r["state"].rstrip("/").split("/")[-1], "")
        c = xy.get(r["id"])
        items.append([r["popup_label"] or r["map_label"], r["map_label"], st, r["reg_name"], round(cap), r["storage_capacity_label"], round(v), d,
                      round(100.0 * s[ya] / cap, 1) if ya else None, round(100.0 * v / avg, 1) if avg else None, round(c[1], 4) if c else None, round(c[0], 4) if c else None, int(loc)])
    if len(items) < 120: print("FALLO: solo %d embalses con dato reciente (%d errores)" % (len(items), errs)); return 1
    if rebuild or newN.keys() - N["items"].keys():
        N = {"generatedAt": TODAY.isoformat() if rebuild else N["generatedAt"], "note": "Media 1990-2020 del agua almacenada por dia del ano (ventana de 7 dias), acre-pies; serie RISE de Reclamation. Calculo de Dehesa Index.", "items": {**N["items"], **newN}}
        NORM.write_text(json.dumps(N, separators=(",", ":")), encoding="utf-8")
    asof = max(x[7] for x in items)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": asof, "unit": "acre-feet",
           "source": {"name": "Bureau of Reclamation, RISE (Lake/Reservoir Storage)", "url": "https://data.usbr.gov/visualizations/reservoir-conditions", "license": "Public domain (U.S. federal government data)"},
           "listSource": {"name": "Western Water Data Hub (Internet of Water), teacup-edr", "url": "https://dashboard.wwdh.internetofwater.app/"},
           "fields": ["name", "short", "state", "region", "capacity", "capacityType", "storage", "date", "pctYearAgo", "pctOfNormal", "lat", "lon", "riseId"], "items": sorted(items, key=lambda x: -x[4])}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tc = sum(x[4] for x in items); ts = sum(x[6] for x in items)
    print("us-reservoirs.json", len(items), "embalses, al", asof, "llenado conjunto %.1f %%" % (100 * ts / tc), "; con media 30 anos:", sum(1 for x in items if x[9] is not None), "; errores", errs)
    return 0
if __name__ == "__main__": sys.exit(main())

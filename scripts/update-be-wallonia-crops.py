#!/usr/bin/env python3
"""Valonia: superficie por cultivo del parcelario agricola anonimo del SIGEC (Politica Agricola Comun) -> data/be-wallonia-crops.json

Fuente: Service public de Wallonie (SPW), «Parcellaire agricole anonyme» (Organisme payeur de Wallonie), servicios ArcGIS de geoservices.wallonie.be
(AGRICULTURE/SIGEC_PARC_AGRI_ANON__AAAA, una campaña por servicio, 2015 en adelante; el servicio sin año es una copia de la ultima). Licencia CC BY 4.0
(ficha del geoportal: «L'utilisateur peut utiliser et modifier les données [...] à condition de citer les sources»). No se descarga ninguna geometria: cada campaña
sale de UNA consulta de estadisticas del servidor (suma de SURF_HA y numero de parcelas por cultivo), unos 100-210 grupos.
 - Cada campaña se guarda tal cual la devuelve el SPW. Las campañas cerradas no cambian, asi que solo se vuelven a pedir las dos ultimas (por si el SPW corrige) y las que faltan.
 - Los codigos de cultivo (CULT_COD) se mantienen, pero el SPW cambió la nomenclatura: «Autres» (99) baja de 42.000 ha en 2015 a 6.000 en 2022 al repartirse en cultivos nuevos, y
   aparecen codigos nuevos (mezclas de cereales desde 2022). El panel lo avisa; no se reconstruye una serie «homogenea».
 - Es la superficie declarada a la PAC por los agricultores (parcelas agricolas y forestales gestionadas por el organismo pagador), no la superficie agraria total de Valonia.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-be-wallonia-crops.py [--fixture fichero.json]  (el fixture es {"years": {"2022": [filas]}}; para los tests)."""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "be-wallonia-crops.json"
BASE = "https://geoservices.wallonie.be/arcgis/rest/services/AGRICULTURE"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
STATS = json.dumps([{"statisticType": "sum", "onStatisticField": "SURF_HA", "outStatisticFieldName": "ha"}, {"statisticType": "count", "onStatisticField": "OBJECTID", "outStatisticFieldName": "n"}])
REFETCH = 2            # campañas mas recientes que se vuelven a pedir siempre
SRC = {"name": "Service public de Wallonie (SPW), Parcellaire agricole anonyme (SIGEC, Organisme payeur de Wallonie)", "url": "https://geoportail.wallonie.be/catalogue/49294570-2a8d-49ca-995c-1b0890672bc8.html",
       "license": "CC BY 4.0", "attribution": "Service public de Wallonie (SPW) - Parcellaire agricole anonyme"}


def get(url, params=None, tries=4, timeout=150):
    u = url + ("?" + urllib.parse.urlencode(params) if params else ""); last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[:120], str(last)[:140]))


def discover():
    """campañas publicadas -> {año: nombre del servicio}"""
    d = get(BASE, {"f": "json"}); out = {}
    for s in d.get("services", []):
        m = re.match(r"^AGRICULTURE/SIGEC_PARC_AGRI_ANON__(\d{4})$", s.get("name", ""))
        if m and s.get("type") == "MapServer": out[int(m.group(1))] = s["name"].split("/")[1]
    return out


def fetch_year(y, svc):
    """una campaña -> filas {code, name, group, ha, n}"""
    d = get("%s/%s/MapServer/0/query" % (BASE, svc), {"where": "1=1", "groupByFieldsForStatistics": "CAMPAGNE,CULT_COD,CULT_NOM,GROUPE_CULT", "outStatistics": STATS, "f": "json"})
    if d.get("error") or d.get("exceededTransferLimit"): raise RuntimeError("%s: %s" % (svc, d.get("error") or "demasiados grupos"))
    rows = []
    for f in d.get("features", []):
        a = f["attributes"]
        if str(a.get("CAMPAGNE")) != str(y): raise RuntimeError("%s: campaña %s en el servicio de %s" % (svc, a.get("CAMPAGNE"), y))
        rows.append({"code": str(a["CULT_COD"]).strip(), "name": clean(a.get("CULT_NOM")), "group": clean(a.get("GROUPE_CULT")), "ha": float(a.get("HA") or a.get("ha") or 0), "n": int(a.get("N") or a.get("n") or 0)})
    return rows


def clean(s): return re.sub(r"\s+", " ", str(s or "").replace("’", "'")).strip()


def build(raw, svcs, now):
    """raw {año: filas} -> documento publicado"""
    years = sorted(raw)
    latest = {}   # codigo -> (nombre, grupo) de la ultima campaña en la que aparece
    for y in years:
        for r in raw[y]: latest[r["code"]] = (r["name"], r["group"])
    by = {}
    for y in years:
        for r in raw[y]:
            c = by.setdefault(r["code"], {"code": r["code"], "name": latest[r["code"]][0], "group": latest[r["code"]][1], "ha": [None] * len(years), "n": [None] * len(years)})
            i = years.index(y); c["ha"][i] = round((c["ha"][i] or 0) + r["ha"], 1); c["n"][i] = (c["n"][i] or 0) + r["n"]
    crops = sorted(by.values(), key=lambda c: -(c["ha"][-1] or 0))
    groups = {}
    for c in crops:
        g = groups.setdefault(c["group"], {"name": c["group"], "ha": [0.0] * len(years), "n": [0] * len(years)})
        for i in range(len(years)): g["ha"][i] = round(g["ha"][i] + (c["ha"][i] or 0), 1); g["n"][i] += c["n"][i] or 0
    tot = {"ha": [round(sum(r["ha"] for r in raw[y]), 1) for y in years], "parcels": [sum(r["n"] for r in raw[y]) for y in years]}
    return {"schemaVersion": 1, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "latestYear": years[-1], "years": years, "source": dict(SRC, services={str(y): svcs[y] for y in years if y in svcs}),
            "totals": tot, "groups": sorted(groups.values(), key=lambda g: -g["ha"][-1]), "crops": crops}


def check(doc):
    errs = []; Y = doc["years"]; n = len(Y)
    if n < 5 or Y != list(range(Y[0], Y[0] + n)): errs.append("campañas no consecutivas o menos de 5: %s" % Y)
    if doc["latestYear"] != Y[-1]: errs.append("latestYear distinto de la ultima campaña")
    if Y[-1] < datetime.date.today().year - 3: errs.append("la ultima campaña (%s) es demasiado antigua" % Y[-1])
    T = doc["totals"]
    for i, y in enumerate(Y):
        if not 650000 < T["ha"][i] < 950000: errs.append("%s: superficie total %s ha fuera de rango" % (y, T["ha"][i]))
        if not 250000 < T["parcels"][i] < 450000: errs.append("%s: %s parcelas fuera de rango" % (y, T["parcels"][i]))
        if i and abs(T["ha"][i] / T["ha"][i - 1] - 1) > 0.05: errs.append("%s: salto del total de mas del 5 %% respecto a la campaña anterior" % y)
    codes = set()
    for c in doc["crops"]:
        if c["code"] in codes: errs.append("cultivo repetido: " + c["code"])
        codes.add(c["code"])
        if len(c["ha"]) != n or len(c["n"]) != n: errs.append("cultivo %s: longitudes" % c["code"])
    for i, y in enumerate(Y):
        if abs(sum(c["ha"][i] or 0 for c in doc["crops"]) - T["ha"][i]) > 1: errs.append("%s: los cultivos no suman el total" % y)
        if abs(sum(g["ha"][i] for g in doc["groups"]) - T["ha"][i]) > 1: errs.append("%s: los grupos no suman el total" % y)
    wheat = next((c for c in doc["crops"] if c["code"] == "311"), None)
    if not wheat or any(v is None or not 80000 < v < 170000 for v in wheat["ha"]): errs.append("froment d'hiver (311) ausente o fuera de 80.000-170.000 ha")
    grass = next((c for c in doc["crops"] if c["code"] == "6"), None)
    if not grass or any(v is None or not 300000 < v < 450000 for v in grass["ha"]): errs.append("prairie (6) ausente o fuera de 300.000-450.000 ha")
    return errs


def main():
    now = datetime.datetime.now(datetime.timezone.utc)
    fixture = json.load(open(sys.argv[sys.argv.index("--fixture") + 1])) if "--fixture" in sys.argv else None
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() and not fixture else None
    raw, svcs = {}, {}
    if fixture:
        for y, rows in fixture["years"].items(): raw[int(y)] = rows; svcs[int(y)] = "SIGEC_PARC_AGRI_ANON__%s" % y
    else:
        svcs = discover()
        if not svcs: raise SystemExit("FALLO: no se encontro ninguna campaña en geoservices.wallonie.be")
        keep = {}
        if old:   # campañas cerradas: se reconstruyen las filas desde el fichero anterior
            for i, y in enumerate(old["years"]):
                if y in svcs and y < max(svcs) - REFETCH + 1:
                    keep[y] = [{"code": c["code"], "name": c["name"], "group": c["group"], "ha": c["ha"][i], "n": c["n"][i]} for c in old["crops"] if c["ha"][i] is not None]
        for y in sorted(svcs):
            if y in keep: raw[y] = keep[y]; continue
            raw[y] = fetch_year(y, svcs[y]); print("campaña %d: %d cultivos, %.0f ha" % (y, len(raw[y]), sum(r["ha"] for r in raw[y])), flush=True)
    doc = build(raw, svcs, now); errs = check(doc)
    if errs:
        for e in errs: print("FALLO:", e)
        raise SystemExit("FALLO: el resultado no pasa las comprobaciones; se conserva el fichero anterior")
    if not fixture: OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("be-wallonia-crops.json: campañas %s-%s, %d cultivos, %.0f ha en %d" % (doc["years"][0], doc["years"][-1], len(doc["crops"]), doc["totals"]["ha"][-1], doc["latestYear"]))
    return doc


if __name__ == "__main__":
    main()

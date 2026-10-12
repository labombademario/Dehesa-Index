#!/usr/bin/env python3
"""Belgica (Flandes): prohibiciones de captar agua de los rios y estado de la sequia -> data/be-drought.json
Fuente: Vlaamse Milieumaatschappij (VMM), servicios publicos de waterinfo.be (ArcGIS REST, sin autenticacion):
1) captatie/captatieverboden, capa «zones»: zonas de captacion (subcuencas) con su estado. Cuando el caudal o el nivel de la estacion de
   referencia baja de su umbral, el gobernador de cada provincia prohibe bombear agua de los cursos de agua de esa zona (riego, abrevado,
   fumigacion). Estado 1 = «verboden» (prohibido) en el mapa oficial. Dehesa Index cuenta, por provincia, las zonas prohibidas y la superficie
   que cubren.
2) droogtedashboard/Droogtestatus_thema: SPI-3 (indice de precipitacion estandarizado a 3 meses) observado, SPEI-3 y la prevision del SPI-3 a
   10 dias, en cuatro clases (normal, seco, muy seco, extremadamente seco). Dehesa Index calcula el porcentaje de la superficie de Flandes en
   cada clase (poligonos en Lambert 72, EPSG:31370).
Licencia: datos de la VMM bajo la «Modellicentie voor gratis hergebruik» del Gobierno flamenco (reutilizacion libre citando la fuente).
Valonia no publica un indicador equivalente en un servicio abierto. Se guarda cada dia un historico propio.
Uso: python3 scripts/update-be-drought.py"""
import datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "be-drought.json"
B = "https://inspirepub.waterinfo.be/arcgis/rest/services/"
CAPT = B + "captatie/captatieverboden/MapServer/1/query"
SPI = B + "droogtedashboard/Droogtestatus_thema/MapServer/%d/query"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
PROV = {"ANT": "VAN", "VLB": "VBR", "LIM": "VLI", "OVL": "VOV", "WVL": "VWV"}   # codigo VMM -> id de vendor/be-provinces.js
CLS = {"normaal": "normal", "droog": "dry", "zeer droog": "veryDry", "uiterst droog": "extreme"}
def get(u, t=180):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r:
                d = json.loads(r.read().decode("utf-8"))
                if "error" in d: raise RuntimeError(d["error"])
                return d
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-80:], last))
def ms(v): return datetime.datetime.fromtimestamp(v / 1000, datetime.timezone.utc).date().isoformat() if v else None
def bans():
    fs = []; off = 0
    while True:
        q = get(CAPT + "?" + urllib.parse.urlencode({"where": "1=1", "outFields": "provincie,naam,status,advies,perman,startd,eindd,type_metin,st_area(shape)", "returnGeometry": "false",
                                                   "resultOffset": off, "resultRecordCount": 1000, "orderByFields": "objectid", "f": "json"}))
        f = [x["attributes"] for x in q.get("features", [])]; fs += f; off += len(f)
        if not q.get("exceededTransferLimit") or not f: break
    if len(fs) < 500: raise ValueError("solo %d zonas de captacion" % len(fs))
    prov = {v: {"zones": 0, "banned": 0, "permanent": 0, "areaKm2": 0.0, "bannedKm2": 0.0, "since": None} for v in PROV.values()}
    for a in fs:
        p = PROV.get((a.get("provincie") or "").strip())
        if not p: continue
        ar = (a.get("st_area(shape)") or 0) / 1e6; P = prov[p]; P["zones"] += 1; P["areaKm2"] += ar
        if a.get("status") == 1:
            P["banned"] += 1; P["bannedKm2"] += ar
            if a.get("perman") == 1: P["permanent"] += 1
            s = ms(a.get("startd"))
            if s and a.get("perman") != 1 and (not P["since"] or s < P["since"]): P["since"] = s
    for P in prov.values():
        P["areaKm2"] = round(P["areaKm2"], 1); P["bannedKm2"] = round(P["bannedKm2"], 1); P["share"] = round(100 * P["bannedKm2"] / P["areaKm2"], 1) if P["areaKm2"] else None
    return prov, len(fs)
def spi():
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    def poly(g):
        # anillos de ArcGIS: exteriores en sentido horario, huecos en antihorario
        ext, holes = [], []
        for r in g.get("rings", []):
            p = Polygon(r)
            if not p.is_valid: p = p.buffer(0)
            s = sum((r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]) for i in range(len(r) - 1))
            (ext if s > 0 else holes).append(p)
        return unary_union(ext).difference(unary_union(holes)) if holes else unary_union(ext)
    out = {}
    for lid, key in ((30, "spi3"), (31, "spei3"), (33, "spi3fcst")):
        q = get(SPI % lid + "?" + urllib.parse.urlencode({"where": "1=1", "outFields": "class,timestamp,forecast", "returnGeometry": "true", "outSR": "31370", "f": "json"}))
        areas = {}; ts = None
        for f in q.get("features", []):
            c = CLS.get((f["attributes"].get("class") or "").strip().lower())
            if not c: continue
            areas[c] = areas.get(c, 0) + poly(f["geometry"]).area; ts = ms(f["attributes"].get("timestamp"))
        tot = sum(areas.values())
        if tot < 1e10 or tot > 2e10: raise ValueError("%s: superficie rara %.0f km2" % (key, tot / 1e6))   # Flandes ~13.600 km2
        out[key] = {"date": ts, "shares": {c: round(100 * areas.get(c, 0) / tot, 1) for c in CLS.values()}}
    return out
def main():
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": today, "region": "Vlaanderen",
           "source": {"name": "Vlaamse Milieumaatschappij (VMM), waterinfo.be: captatieverboden en droogtestatus", "url": "https://waterinfo.vlaanderen.be/",
                      "api": B, "license": "Modellicentie voor gratis hergebruik (Vlaamse overheid)"}, "classes": list(CLS.values())}
    try: doc["provinces"], doc["zonesTotal"] = bans()
    except Exception as e:
        print("AVISO captaciones:", e)
        if old.get("provinces"): doc["provinces"], doc["zonesTotal"] = old["provinces"], old.get("zonesTotal")
    try: doc["indices"] = spi()
    except Exception as e:
        print("AVISO SPI:", e)
        if old.get("indices"): doc["indices"] = old["indices"]
    if "provinces" not in doc or "indices" not in doc: print("FALLO: falta una parte"); return 0 if OUT.exists() else 1
    P = doc["provinces"]; nb = sum(p["banned"] for p in P.values())
    sh = doc["indices"]["spi3"]["shares"]
    hist = [h for h in old.get("history", []) if h["date"] != today]
    hist.append({"date": today, "banned": nb, "bannedKm2": round(sum(p["bannedKm2"] for p in P.values()), 1), "dryShare": round(sh["dry"] + sh["veryDry"] + sh["extreme"], 1)})
    doc["history"] = hist[-500:]
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("be-drought.json %s: %d de %s zonas con prohibicion de captar; por provincia %s; SPI-3 %s %s" % (today, nb, doc.get("zonesTotal"),
          {k: (v["banned"], v["share"]) for k, v in P.items()}, doc["indices"]["spi3"]["date"], sh))
    return 0
if __name__ == "__main__": sys.exit(main())

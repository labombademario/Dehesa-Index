#!/usr/bin/env python3
"""Suiza: clima mensual (temperatura media y precipitacion) de 9 estaciones SwissMetNet de MeteoSuisse -> data/switzerland-meteo-stats.json.
Fuente: MeteoSwiss, Open Government Data (CC BY 4.0, 'Source: MeteoSwiss'), https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/. Datos sin modificar salvo conversion de fecha. Meses sin valor se omiten (no se interpolan).
Descarga baja frecuencia (mensual); la licencia pide evitar descargas de alta frecuencia."""
import csv, datetime, io, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "switzerland-meteo-stats.json"
LOG = ROOT / "data" / "switzerland-meteo-log.txt"
BASE = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/%s/ogd-smn_%s_m.csv"
FROM = "1991-01"
STATIONS = [("ber", "Bern/Zollikofen"), ("pay", "Payerne"), ("luz", "Luzern"), ("tae", "Aadorf/Taenikon"), ("chu", "Chur"), ("gve", "Geneve/Cointrin"), ("sma", "Zuerich/Fluntern"), ("sio", "Sion"), ("lug", "Lugano")]
VARS = [("tre200m0", "temp", "Mean air temperature", "°C", 1), ("rre150m0", "rain", "Precipitation (monthly total)", "mm", 1)]
LOCAL = os.environ.get("CH_METEO_DIR")
log = []
def say(m): log.append(m); print(m)
def get(st):
    if LOCAL:
        return (Path(LOCAL) / ("ogd-smn_%s_m.csv" % st)).read_bytes()
    last = None
    for i in range(3):
        try:
            r = urllib.request.Request(BASE % (st, st), headers={"User-Agent": "dehesaindex.com data pipeline (contact via site)"})
            return urllib.request.urlopen(r, timeout=60).read()
        except Exception as e:
            last = e; time.sleep(3 * (i + 1))
    raise last
series = []
now = datetime.datetime.now(datetime.timezone.utc)
cur = now.strftime("%Y-%m")
for st, name in STATIONS:
    try:
        txt = get(st).decode("cp1252")
    except Exception as e:
        say("ERR %s %s" % (st, e)); continue
    rows = list(csv.DictReader(io.StringIO(txt), delimiter=";"))
    for col, key, lab, unit, _ in VARS:
        pts = {}
        for r in rows:
            v = (r.get(col) or "").strip()
            ts = (r.get("reference_timestamp") or "").strip()
            if not v or len(ts) < 10: continue
            p = ts[6:10] + "-" + ts[3:5]
            if p < FROM or p >= cur: continue
            try: pts[p] = round(float(v), 2)
            except ValueError: continue
        pts = sorted(pts.items())
        if len(pts) < 120:
            say("SKIP %s %s %d pts" % (st, col, len(pts))); continue
        prev = pts[-2][1]
        series.append({"id": "ch-meteo-%s-%s" % (st, key), "group": "climate", "label": "%s: %s"  % (name, lab), "unit": unit, "frequency": "monthly",
                       "latestPeriod": pts[-1][0], "latest": pts[-1][1], "changePct": None, "points": [[p, v] for p, v in pts], "sourceGroup": "MeteoSwiss SwissMetNet",
                       "periodNote": "Estacion SwissMetNet %s; mes natural; sin interpolar. Cambio vs. mes anterior no se calcula (serie estacional)." % st.upper(),
                       "reference": {"source": "MeteoSwiss", "dataset": "Automatic weather stations (ogd-smn) - %s, monthly" % st.upper(), "licence": "CC BY 4.0 (Source: MeteoSwiss)", "original": "https://opendata.swiss/en/dataset/automatische-wetterstationen-aktuelle-messwerte"}})
        say("OK %s %s %d pts %s..%s" % (st, col, len(pts), pts[0][0], pts[-1][0]))
if len(series) < 12:
    sys.exit("pocas series: %d" % len(series))
doc = {"schemaVersion": 1, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
       "countries": {"CH": {"name": "Switzerland", "extend": True, "source": {"name": "MeteoSwiss, Open Government Data (SwissMetNet)", "url": "https://opendata.swiss/en/dataset/automatische-wetterstationen-aktuelle-messwerte", "license": "CC BY 4.0 - Source: MeteoSwiss"}, "series": series}},
       "log": log[-60:]}
if not LOCAL or os.environ.get("CH_WRITE") == "1":
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    LOG.write_text("\n".join(log) + "\n", encoding="utf-8")
print("series", len(series))

#!/usr/bin/env python3
"""Nivel y caudal de los rios alemanes de navegacion (Rin, Meno, Elba y Danubio), PEGELONLINE de la Administracion federal de vias navegables (WSV, licencia DL-DE-Zero-2.0).
Escribe data/de-rivers.json y data/de-rivers-log.txt.
 - Fuente: https://www.pegelonline.wsv.de/webservices/rest-api/v2 . Datos brutos (Rohdaten) cada 15 minutos, sin clave. La API solo da unos 30 dias de historia
   (start=P30D como maximo), asi que cada ejecucion recalcula la media diaria de esos 30 dias y la UNE a la historia ya guardada en data/de-rivers.json: la serie
   propia crece un dia por dia desde la primera ejecucion. Un dia con menos del 80 % de las lecturas esperadas no se guarda; nada se rellena.
 - Media diaria = media de las lecturas del dia local (Europa/Berlin), nivel en centimetros y caudal en m3/s (solo donde la estacion mide caudal).
 - Referencias oficiales de cada estacion (valores caracteristicos del propio PEGELONLINE, sin recalcular): NNW (minimo absoluto), MNW (media de los minimos), MW (media),
   MHW (media de los maximos), HHW (maximo absoluto), GlW (nivel equivalente de aguas bajas, solo en el Rin) y el periodo al que corresponden. El estado
   «bajo/normal/alto» es el que publica la WSV (stateMnwMhw: bajo = por debajo de MNW, alto = por encima de MHW), no un calculo nuestro.
 - Por que importa: con el rio bajo las barcazas cargan menos (menos calado) y el flete de cereal y fertilizante sube. No es un aviso de navegacion (eso lo da la WSV).
Uso: python3 scripts/update-de-rivers.py [--fixture fichero.json]  (con --fixture lee {"stations": [...], "measurements": {"uuid/W": [...]}} en lugar de la red; para los tests)."""
import datetime, json, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "de-rivers.json"
LOGF = ROOT / "data" / "de-rivers-log.txt"
API = "https://www.pegelonline.wsv.de/webservices/rest-api/v2"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)"}
# (rio en PEGELONLINE, estacion en PEGELONLINE, rio para mostrar), de aguas arriba a aguas abajo dentro de cada rio
STATIONS = [("RHEIN", "MAXAU", "Rhein"), ("RHEIN", "KAUB", "Rhein"), ("RHEIN", "KÖLN", "Rhein"), ("RHEIN", "DUISBURG-RUHRORT", "Rhein"), ("RHEIN", "EMMERICH", "Rhein"),
            ("MAIN", "FRANKFURT OSTHAFEN", "Main"), ("ELBE", "DRESDEN", "Elbe"), ("ELBE", "MAGDEBURG-STROMBRÜCKE", "Elbe"), ("DONAU", "PASSAU DONAU", "Donau")]
REFS = ["NNW", "MNW", "MW", "MHW", "HHW", "GlW"]
KEEP_DAYS = 800          # historia propia guardada
MIN_COVER = 0.8          # parte minima de las lecturas esperadas de un dia
STATES = {"low", "normal", "high"}
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: LOGF.write_text("\n".join(LOG))
    except Exception: pass


def http(url, tries=4, timeout=90):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(repr(last)[:200])


def daily(meas, per_day):
    """[{timestamp, value}] -> {'AAAA-MM-DD': media} solo de los dias con al menos MIN_COVER de las lecturas esperadas"""
    acc = {}
    for m in meas:
        try: v = float(m["value"])
        except (KeyError, TypeError, ValueError): continue
        a = acc.setdefault(str(m["timestamp"])[:10], [0.0, 0]); a[0] += v; a[1] += 1
    return {d: s / n for d, (s, n) in acc.items() if n >= per_day * MIN_COVER}


def pick(stations):
    out = {}
    for w, name, shown in STATIONS:
        for s in stations:
            if s.get("shortname") == name and (s.get("water") or {}).get("shortname") == w: out[(w, name)] = s; break
    return out


def series_of(st, short):
    for t in st.get("timeseries") or []:
        if t.get("shortname") == short: return t
    return None


def station(st, shown, old, meas_for, now):
    """una estacion -> dict publicado, o None si no tiene nivel"""
    tw, tq = series_of(st, "W"), series_of(st, "Q")
    cw = (tw or {}).get("currentMeasurement")
    if not tw or not cw or cw.get("value") is None: return None
    ref = {}
    for c in tw.get("characteristicValues") or []:
        k = c.get("shortname")
        if k in REFS and c.get("value") is not None and k not in ref:
            ref[k] = c["value"]
            if c.get("timespanStart") and k in ("MNW", "MW", "MHW"): ref["period"] = [c["timespanStart"][:4], c["timespanEnd"][:4]]
    state = cw.get("stateMnwMhw")
    # historia: la ya guardada + los dias recalculados ahora (los nuevos mandan)
    days = {p[0]: [p[1], p[2]] for p in (old or {}).get("points", [])}
    uid = st["uuid"]; eq = lambda t: max(1, int((t or {}).get("equidistance") or 15))
    dw = daily(meas_for(uid, "W"), 1440 // eq(tw))
    dq = daily(meas_for(uid, "Q"), 1440 // eq(tq)) if tq else {}
    for d, v in dw.items(): days[d] = [round(v, 1), round(dq[d], 1) if d in dq else None]
    today = now.date().isoformat()
    days.pop(today, None)   # el dia en curso esta incompleto
    ks = sorted(days)[-KEEP_DAYS:]
    cq = (tq or {}).get("currentMeasurement")
    return {"id": st["shortname"].lower().replace(" ", "-"), "uuid": uid, "river": shown, "name": st["shortname"].title().replace(" Donau", ""),
            "km": st.get("km"), "agency": st.get("agency"),
            "w": {"value": cw["value"], "time": cw["timestamp"], "state": state if state in STATES else None, "unit": "cm"},
            "q": {"value": cq["value"], "time": cq["timestamp"], "unit": "m3/s"} if cq and cq.get("value") is not None else None,
            "ref": ref, "first": ks[0] if ks else None, "last": ks[-1] if ks else None, "points": [[d, days[d][0], days[d][1]] for d in ks]}


def main():
    fixture = json.load(open(sys.argv[sys.argv.index("--fixture") + 1])) if "--fixture" in sys.argv else None
    now = datetime.datetime.now(datetime.timezone.utc) if not fixture else datetime.datetime.fromisoformat(fixture["now"])
    old = {}
    if OUT.exists():
        try: old = {s["id"]: s for s in json.loads(OUT.read_text(encoding="utf-8")).get("stations", [])}
        except Exception: old = {}
    if fixture: stations = fixture["stations"]
    else:
        q = urllib.parse.urlencode({"waters": ",".join(sorted({w for w, _, _ in STATIONS})), "includeTimeseries": "true", "includeCurrentMeasurement": "true", "includeCharacteristicValues": "true"})
        stations = http(API + "/stations.json?" + q)
    chosen = pick(stations)
    cache = {}

    def meas_for(uid, short):
        k = uid + "/" + short
        if k in cache: return cache[k]
        if fixture: cache[k] = fixture["measurements"].get(k, [])
        else:
            try: cache[k] = http("%s/stations/%s/%s/measurements.json?start=P30D" % (API, uid, short))
            except Exception as e: log("aviso: %s sin lecturas (%s)" % (k, e)); cache[k] = []
            time.sleep(0.3)
        return cache[k]
    out = []
    for w, name, shown in STATIONS:
        st = chosen.get((w, name))
        if not st: log("aviso: %s %s no esta en PEGELONLINE" % (w, name)); continue
        sid = st["shortname"].lower().replace(" ", "-")
        r = station(st, shown, old.get(sid), meas_for, now)
        if not r: log("aviso: %s %s sin nivel actual" % (w, name)); continue
        out.append(r); log("%s %s: %s cm (%s)%s, %d dias de historia propia" % (shown, name, r["w"]["value"], r["w"]["state"], (", %s m3/s" % r["q"]["value"]) if r["q"] else "", len(r["points"])))
    if len(out) < 6 or not any(s["id"] == "kaub" for s in out): raise SystemExit("FALLO: PEGELONLINE devolvio datos insuficientes (%d estaciones)" % len(out))
    latest = max(s["w"]["time"] for s in out)
    age = now - datetime.datetime.fromisoformat(latest)
    if not fixture and age > datetime.timedelta(hours=12): raise SystemExit("FALLO: la ultima lectura (%s) es demasiado antigua" % latest)
    res = {"schemaVersion": 1, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "latestTime": latest,
           "source": {"id": "pegelonline", "name": "Wasserstraßen- und Schifffahrtsverwaltung des Bundes (WSV), PEGELONLINE, Rohdaten", "url": "https://www.pegelonline.wsv.de/", "license": "DL-DE-Zero-2.0"},
           "units": {"w": "cm", "q": "m3/s"}, "pointFields": ["date", "levelCm", "dischargeM3s"], "stations": out}
    OUT.write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("de-rivers.json: %d estaciones, ultima lectura %s" % (len(out), latest))


if __name__ == "__main__":
    main()

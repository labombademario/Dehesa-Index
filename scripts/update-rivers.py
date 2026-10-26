#!/usr/bin/env python3
"""Nivel y caudal de rios de Paises Bajos, Francia, Canada y Belgica (Flandes) -> data/rivers-{nl,fr,ca,be}.json y data/rivers-log.txt.
Un adaptador por pais; cada uno devuelve, por estacion, las lecturas recientes (nivel y caudal) y, si la fuente lo da, la serie diaria historica larga:
 - nl: Rijkswaterstaat, Waterwebservices (DD-API 2.0). Lecturas cada 10 min de los ultimos 30 dias. Sin historia larga -> sin estado. Licencia CC0.
 - fr: Hub'Eau Hydrometrie (SCHAPI/Eaufrance), observations_tr (H en mm, Q en l/s) y obs_elab QmnJ (caudal medio diario desde la apertura). Licencia: Licence Ouverte Etalab (Hub'Eau).
 - ca: ECCC / Water Survey of Canada, API geomet-OGC hydrometric-realtime (30 dias) y hydrometric-daily-mean (hasta el ano anterior). ECCC Data Services End-use Licence v2.1.1.
 - be: VMM / Hydrologisch Informatiecentrum Vlaanderen, KiWIS waterinfo.be (series P.15/O.15 y DagGem). Licencia: Modellicentie voor gratis hergebruik (Vlaanderen).
Media diaria: dia local con lecturas en >= 20 horas distintas; el dia en curso se descarta. La historia propia (points) se une a la ya guardada (KEEP_DAYS) y, donde hay serie larga, se rellena con ella.
Referencia propia (calculo de Dehesa Index, no oficial): para la fecha de la ultima lectura, valores diarios de +-7 dias en los anos anteriores (>= 8 anos); cuartiles y percentil de la lectura actual.
Estado: bajo (percentil < 25), normal, alto (percentil > 75), solo con referencia.
Uso: python3 scripts/update-rivers.py [nl fr ca be]  (sin argumentos: todos)."""
import datetime, json, statistics, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
LOGF = DATA / "rivers-log.txt"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)", "Accept": "application/json"}
KEEP_DAYS = 430
MIN_HOURS = 20
MIN_YEARS = 8
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: LOGF.write_text("\n".join(LOG))
    except Exception: pass


def http(url, data=None, tries=4, timeout=120):
    last = None
    for i in range(tries):
        try:
            h = dict(UA)
            body = None
            if data is not None: body = json.dumps(data).encode("utf-8"); h["Content-Type"] = "application/json"
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=h), timeout=timeout) as r: return json.loads(r.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404): break
            time.sleep(5 * (i + 1))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[:140], repr(last)[:160]))


# ---------- calculo comun ----------
def daily(readings):
    """[(AAAA-MM-DDTHH:MM, valor)] -> {fecha: media} con >= MIN_HOURS horas distintas"""
    acc = {}
    for t, v in readings:
        if v is None: continue
        a = acc.setdefault(t[:10], [0.0, 0, set()]); a[0] += v; a[1] += 1; a[2].add(t[11:13])
    return {d: s / n for d, (s, n, hs) in acc.items() if len(hs) >= MIN_HOURS}


def doy_window(d0, d, days=7):
    """True si la fecha d (AAAA-MM-DD) esta a +-days de la misma fecha de d0, en cualquier ano (ignora el ano)"""
    y = int(d[:4]); m, dd = int(d0[5:7]), int(d0[8:10])
    try: c = datetime.date(y, m, dd)
    except ValueError: c = datetime.date(y, m, 28)
    x = datetime.date(y, int(d[5:7]), int(d[8:10]))
    return abs((x - c).days) <= days


def reference(hist, d0, current):
    """hist {fecha: valor}; devuelve ref {p25,p50,p75,pct,years:[a,b],n} o None"""
    y0 = int(d0[:4])
    pool = [v for d, v in hist.items() if int(d[:4]) < y0 and doy_window(d0, d)]
    yrs = sorted({int(d[:4]) for d, v in hist.items() if int(d[:4]) < y0 and doy_window(d0, d)})
    if len(yrs) < MIN_YEARS or len(pool) < 40: return None
    pool.sort(); n = len(pool)
    q = lambda p: pool[min(n - 1, max(0, int(round(p * (n - 1)))))]
    below = sum(1 for v in pool if v < current) + 0.5 * sum(1 for v in pool if v == current)
    return {"p25": round(q(0.25), 2), "p50": round(q(0.5), 2), "p75": round(q(0.75), 2), "pct": round(100.0 * below / n), "years": [yrs[0], yrs[-1]], "n": len(yrs)}


def build_station(meta, now, old):
    """meta: id, river, name, lon, lat, w (lecturas cm), q (lecturas m3/s), wh/qh (historia diaria larga), unitsNote -> dict publicado o None"""
    w, q = meta.get("w") or [], meta.get("q") or []
    if not w and not q: return None
    last_w, last_q = (w[-1] if w else None), (q[-1] if q else None)
    days = {p[0]: [p[1], p[2]] for p in (old or {}).get("points", [])}
    wh, qh = meta.get("wh") or {}, meta.get("qh") or {}
    for d in (set(wh) | set(qh)) if meta.get("prefill", True) else ():
        e = days.get(d, [None, None])
        if d in wh and e[0] is None: e[0] = round(wh[d], 1)
        if d in qh and e[1] is None: e[1] = round(qh[d], 3)
        days[d] = e
    dw, dq = daily(w), daily(q)
    for d in set(dw) | set(dq):
        e = days.get(d, [None, None])
        if d in dw: e[0] = round(dw[d], 1)
        if d in dq: e[1] = round(dq[d], 3)
        days[d] = e
    days.pop(now.date().isoformat(), None)
    ks = sorted(days)[-KEEP_DAYS:]
    basis = "Q" if (last_q and (qh or not wh)) else ("W" if last_w else "Q")
    hist, cur, d0 = (qh, last_q[1] if last_q else None, last_q[0][:10] if last_q else None) if basis == "Q" else (wh, last_w[1] if last_w else None, last_w[0][:10] if last_w else None)
    ref = reference(hist, d0, cur) if hist and cur is not None else None
    state = None
    if ref: ref["basis"] = basis; state = "low" if ref["pct"] < 25 else "high" if ref["pct"] > 75 else "normal"
    return {"id": meta["id"], "river": meta["river"], "name": meta["name"], "lon": meta.get("lon"), "lat": meta.get("lat"), "state": state,
            "w": {"value": round(last_w[1], 1), "time": last_w[0], "state": state, "unit": "cm"} if last_w else None,
            "q": {"value": round(last_q[1], 3), "time": last_q[0], "unit": "m3/s"} if last_q else None,
            "ref": ref or {}, **({"base": meta["base"]} if meta.get("base") else {}), "first": ks[0] if ks else None, "last": ks[-1] if ks else None, "points": [[d, days[d][0], days[d][1]] for d in ks]}


# ---------- Paises Bajos ----------
NL_API = "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen"
NL_STATIONS = [("Rijn", "lobith.bovenrijn.tolkamer", "Lobith"), ("Waal", "tiel.waal", "Tiel"), ("Nederrijn", "driel.boven", "Driel"), ("Lek", "hagestein.boven", "Hagestein"),
               ("IJssel", "olst", "Olst"), ("Maas", "venlo", "Venlo"), ("Maas", "maastricht.sintpieter.zuid", "Maastricht"), ("Maas", "eijsden.grens", "Eijsden")]


def nl_series(code, g, start, end):
    r = http(NL_API, {"Locatie": {"Code": code}, "AquoPlusWaarnemingMetadata": {"AquoMetadata": {"Compartiment": {"Code": "OW"}, "Grootheid": {"Code": g}}},
                      "Periode": {"Begindatumtijd": start, "Einddatumtijd": end}})
    out, loc = [], None
    for wl in r.get("WaarnemingenLijst") or []:
        loc = loc or wl.get("Locatie")
        hoed = (wl["AquoMetadata"].get("Hoedanigheid") or {}).get("Code")
        if g == "WATHTE" and hoed not in ("NAP", None): continue
        for m in wl.get("MetingenLijst") or []:
            v = (m.get("Meetwaarde") or {}).get("Waarde_Numeriek")
            if v is None or abs(v) > 1e6: continue
            out.append((m["Tijdstip"][:16], float(v)))
        if out: break
    out.sort(); return out, loc


def nl_baseline(code, now, cached):
    """Caudal diario de +-10 dias alrededor de hoy en los 20 anos anteriores (Rijkswaterstaat: diario hasta ~2017, cada 10 min despues). Se guarda en el fichero y se refresca cada 5 dias."""
    d0 = now.date()
    if cached and cached.get("d0") and (d0 - datetime.date.fromisoformat(cached["d0"])).days <= 5 and cached.get("q"): return cached
    qh = {}
    for y in range(now.year - 20, now.year):
        try: c = datetime.date(y, d0.month, d0.day)
        except ValueError: c = datetime.date(y, d0.month, 28)
        a, b = c - datetime.timedelta(days=10), c + datetime.timedelta(days=11)
        try: ser, _ = nl_series(code, "Q", a.strftime("%Y-%m-%dT00:00:00.000+01:00"), b.strftime("%Y-%m-%dT00:00:00.000+01:00"))
        except Exception as e: log("aviso: nl %s historia %d: %s" % (code, y, e)); continue
        acc = {}
        for t, v in ser: acc.setdefault(t[:10], []).append(v)
        for d, vs in acc.items(): qh[d] = sum(vs) / len(vs)
        time.sleep(0.2)
    return {"d0": d0.isoformat(), "q": [[d, round(v, 2)] for d, v in sorted(qh.items())]} if len(qh) > 100 else (cached or None)


def adapt_nl(now, old=None):
    end = now.astimezone(datetime.timezone(datetime.timedelta(hours=1))); start = end - datetime.timedelta(days=30)
    f = lambda d: d.strftime("%Y-%m-%dT%H:%M:%S.000+01:00")
    res = []
    for river, code, name in NL_STATIONS:
        try:
            w, loc = nl_series(code, "WATHTE", f(start), f(end)); time.sleep(0.3)
            q, loc2 = nl_series(code, "Q", f(start), f(end)); time.sleep(0.3)
        except Exception as e: log("aviso: nl %s: %s" % (code, e)); continue
        loc = loc or loc2 or {}
        sid = code.split(".")[0] if code.count(".") else code
        base = nl_baseline(code, now, ((old or {}).get(sid) or {}).get("base")) if q else None
        res.append({"id": sid, "river": river, "name": name, "lon": loc.get("Lon"), "lat": loc.get("Lat"), "w": w, "q": q, "base": base, "qh": {d: v for d, v in (base or {}).get("q", [])}, "prefill": False})
    for r in res:
        if r["lon"] is not None: r["lon"], r["lat"] = round(r["lon"], 4), round(r["lat"], 4)
    return res


# ---------- Francia ----------
FR_API = "https://hubeau.eaufrance.fr/api/v2/hydrometrie"
FR_STATIONS = [("Seine", "F700000103", "Paris"), ("Seine", "H320000104", "Vernon"), ("Marne", "F664000104", "Gournay-sur-Marne"), ("Loire", "K418001010", "Gien"), ("Loire", "K435001010", "Orléans"),
               ("Loire", "K490003010", "Tours"), ("Loire", "M530001010", "Montjean"), ("Saône", "U430001001", "Mâcon"), ("Rhône", "V300002002", "Lyon"), ("Rhône", "V401001002", "Valence"),
               ("Rhône", "V720001002", "Tarascon"), ("Garonne", "O614001001", "Lamagistère"), ("Garonne", "O900001002", "Tonneins"), ("Dordogne", "P238001001", "Cénac"), ("Meuse", "B502001001", "Sedan")]


def hubeau_pages(url):
    out = []
    while url:
        r = http(url); out += r.get("data") or []; url = r.get("next")
        if url: time.sleep(0.2)
    return out


def adapt_fr(now, old=None):
    tz = ZoneInfo("Europe/Paris"); res = []
    start = (now - datetime.timedelta(days=30)).strftime("%Y-%m-%dT00:00:00Z")
    for river, code, name in FR_STATIONS:
        try:
            st = http("%s/referentiel/stations?code_station=%s&format=json&fields=code_station,longitude_station,latitude_station" % (FR_API, code))["data"][0]
            series = {}
            for g, f in (("H", 0.1), ("Q", 0.001)):
                rows = hubeau_pages("%s/observations_tr?code_entite=%s&grandeur_hydro=%s&date_debut_obs=%s&size=5000&format=json&fields=date_obs,resultat_obs" % (FR_API, code, g, start))
                s = []
                for r in rows:
                    if r.get("resultat_obs") is None: continue
                    t = datetime.datetime.fromisoformat(r["date_obs"].replace("Z", "+00:00")).astimezone(tz).strftime("%Y-%m-%dT%H:%M")
                    s.append((t, float(r["resultat_obs"]) * f))
                s.sort(); series[g] = s; time.sleep(0.2)
            qh = {}
            try:
                for r in hubeau_pages("%s/obs_elab?code_entite=%s&grandeur_hydro_elab=QmnJ&size=5000&format=json&fields=date_obs_elab,resultat_obs_elab" % (FR_API, code)):
                    if r.get("resultat_obs_elab") is not None: qh[r["date_obs_elab"][:10]] = float(r["resultat_obs_elab"]) * 0.001
            except Exception as e: log("aviso: fr %s sin historia diaria (%s)" % (code, e))
        except Exception as e: log("aviso: fr %s: %s" % (code, e)); continue
        res.append({"id": code, "river": river, "name": name, "lon": round(st["longitude_station"], 4), "lat": round(st["latitude_station"], 4), "w": series["H"], "q": series["Q"], "qh": qh})
    return res


# ---------- Canada ----------
CA_API = "https://api.weather.gc.ca/collections"
CA_STATIONS = [("Fraser", "08MF005", "Hope"), ("Thompson", "08LF023", "Kamloops"), ("Bow", "05BH004", "Calgary"), ("Oldman", "05AD007", "Lethbridge"), ("South Saskatchewan", "05AJ001", "Medicine Hat"),
               ("South Saskatchewan", "05HG001", "Saskatoon"), ("North Saskatchewan", "05DF001", "Edmonton"), ("Red", "05OC001", "Emerson"), ("Assiniboine", "05MJ001", "Headingley"),
               ("Peace", "07HA001", "Peace River"), ("Athabasca", "07BE001", "Athabasca"), ("Ottawa", "02KF005", "Britannia"), ("Saint Lawrence", "02OA016", "LaSalle"),
               ("Saint John", "01AK003", "Fredericton"), ("Grand", "02GA003", "Galt")]


def ca_items(coll, q, sort, cap):
    out, off = [], 0
    while off < cap:
        r = http("%s/%s/items?f=json&limit=10000&offset=%d&sortby=%s&%s" % (CA_API, coll, off, sort, q)); f = r.get("features") or []
        out += f
        if len(f) < 10000: break
        off += 10000; time.sleep(0.2)
    return out


def adapt_ca(now, old=None):
    res = []
    for river, code, name in CA_STATIONS:
        try:
            rt = ca_items("hydrometric-realtime", "STATION_NUMBER=" + code, "DATETIME", 30000)
            if not rt: log("aviso: ca %s sin lecturas" % code); continue
            w, q, lon, lat = [], [], rt[0]["geometry"]["coordinates"][0], rt[0]["geometry"]["coordinates"][1]
            for f in rt:
                p = f["properties"]; t = (p.get("DATETIME_LST") or p["DATETIME"])[:16]
                if p.get("LEVEL") is not None: w.append((t, p["LEVEL"] * 100.0))
                if p.get("DISCHARGE") is not None: q.append((t, float(p["DISCHARGE"])))
            qh = {}
            for f in ca_items("hydrometric-daily-mean", "STATION_NUMBER=" + code, "-DATE", 12000):
                p = f["properties"]
                if p.get("DISCHARGE") is not None: qh[p["DATE"]] = float(p["DISCHARGE"])
        except Exception as e: log("aviso: ca %s: %s" % (code, e)); continue
        res.append({"id": code.lower(), "river": river, "name": name, "lon": round(lon, 4), "lat": round(lat, 4), "w": w, "q": q, "qh": qh, "prefill": False})   # la serie diaria historica de Canada llega hasta el ano anterior: solo sirve de referencia, no se une a points
    return res


# ---------- Belgica (Flandes) ----------
BE_API = "https://download.waterinfo.be/tsmdownload/KiWIS/KiWIS?service=kisters&type=queryServices&datasource=0&format=json&"
BE_STATIONS = [("Demer", "01L09_136", "Hasselt"), ("Demer", "01L09_138", "Bilzen"), ("Dijle", "01L08_093", "Wilsele"), ("Zenne", "01L08_193", "Lot"), ("Grote Nete", "01L10_077", "Geel"),
               ("Kleine Nete", "01L10_055", "Herentals"), ("Mandel", "01L05_409", "Oostrozebeke"), ("Dommel", "01L11_022", "Overpelt"), ("Gete", "01L09_152", "Halen")]


def kiwis(**kw): return http(BE_API + urllib.parse.urlencode(kw))


def be_ts(no):
    t = kiwis(request="getTimeseriesList", station_no=no, returnfields="ts_id,ts_name,parametertype_name,coverage")[1:]
    pick = {}
    for ts_id, name, par, a, b in [r[:5] for r in t]:
        if par not in ("Q", "H"): continue
        if name == "DagGem": pick[(par, "d")] = ts_id
        elif name in ("P.15", "O.15", "O.1", "P.10", "P.60") and b >= (datetime.datetime.utcnow() - datetime.timedelta(days=3)).strftime("%Y-%m-%d"):
            if (par, "r") not in pick or name in ("P.15", "O.15"): pick[(par, "r")] = ts_id
    return pick


def be_vals(ts_id, a, b):
    r = kiwis(request="getTimeseriesValues", ts_id=ts_id, **{"from": a, "to": b}, returnfields="Timestamp,Value")
    return [(t[:16] if t[10] == "T" else t, v) for t, v in (r[0].get("data") or []) if v is not None]


def adapt_be(now, old=None):
    res = []; a30 = (now - datetime.timedelta(days=30)).strftime("%Y-%m-%d"); b = (now + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    for river, no, name in BE_STATIONS:
        try:
            st = kiwis(request="getStationList", station_no=no, returnfields="station_latitude,station_longitude")[1]
            ts = be_ts(no)
            if ("Q", "r") not in ts and ("H", "r") not in ts: log("aviso: be %s sin serie reciente" % no); continue
            w = [(t, float(v) * 100.0) for t, v in be_vals(ts[("H", "r")], a30, b)] if ("H", "r") in ts else []
            q = [(t, float(v)) for t, v in be_vals(ts[("Q", "r")], a30, b)] if ("Q", "r") in ts else []
            qh, wh = {}, {}
            a_hist = (now - datetime.timedelta(days=365 * 40)).strftime("%Y-%m-%d")
            if ("Q", "d") in ts:
                for t, v in be_vals(ts[("Q", "d")], a_hist, b): qh[t[:10]] = float(v)
            if ("H", "d") in ts:
                for t, v in be_vals(ts[("H", "d")], (now - datetime.timedelta(days=KEEP_DAYS + 5)).strftime("%Y-%m-%d"), b): wh[t[:10]] = float(v) * 100.0
        except Exception as e: log("aviso: be %s: %s" % (no, e)); continue
        res.append({"id": no.lower(), "river": river, "name": name, "lon": round(float(st[1]), 4), "lat": round(float(st[0]), 4), "w": w, "q": q, "wh": wh, "qh": qh})
    return res


ADAPTERS = {
    "nl": (adapt_nl, {"id": "rijkswaterstaat", "name": "Rijkswaterstaat, Waterwebservices (DD-API 2.0), ruwe data", "url": "https://waterwebservices.rijkswaterstaat.nl/", "license": "CC0-1.0"}),
    "fr": (adapt_fr, {"id": "hubeau_hydrometrie", "name": "Hub'Eau, API Hydrométrie (SCHAPI, Eaufrance)", "url": "https://hubeau.eaufrance.fr/page/api-hydrometrie", "license": "Licence Ouverte 2.0"}),
    "ca": (adapt_ca, {"id": "eccc_hydrometric", "name": "Environment and Climate Change Canada, Water Survey of Canada (geomet-OGC)", "url": "https://api.weather.gc.ca/", "license": "ECCC Data Services End-use Licence 2.1.1"}),
    "be": (adapt_be, {"id": "vmm_waterinfo", "name": "Vlaamse Milieumaatschappij, Hydrologisch Informatiecentrum (waterinfo.be KiWIS)", "url": "https://www.waterinfo.be/", "license": "Modellicentie voor gratis hergebruik v1.0"}),
}


def run(cc, now):
    fn, src = ADAPTERS[cc]; out_f = DATA / ("rivers-%s.json" % cc)
    old = {}
    if out_f.exists():
        try: old = {s["id"]: s for s in json.loads(out_f.read_text(encoding="utf-8")).get("stations", [])}
        except Exception: old = {}
    metas = fn(now, old); out = []
    for m in metas:
        s = build_station(m, now, old.get(m["id"]))
        if not s or not (s["w"] or s["q"]): log("aviso: %s %s sin lectura actual" % (cc, m["id"])); continue
        out.append(s)
        log("%s %s %s: %s cm, %s m3/s, estado %s, %d dias" % (cc, s["river"], s["name"], s["w"]["value"] if s["w"] else "-", s["q"]["value"] if s["q"] else "-", s["state"], len(s["points"])))
    if len(out) < 4: raise RuntimeError("%s: datos insuficientes (%d estaciones)" % (cc, len(out)))
    latest = max((s["w"] or s["q"])["time"] for s in out)
    res = {"schemaVersion": 1, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "country": cc.upper(), "latestTime": latest, "source": src,
           "units": {"w": "cm", "q": "m3/s"}, "pointFields": ["date", "levelCm", "dischargeM3s"], "stations": out}
    out_f.write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    log("rivers-%s.json: %d estaciones, ultima lectura %s" % (cc, len(out), latest))


def main():
    sel = [a for a in sys.argv[1:] if a in ADAPTERS] or list(ADAPTERS)
    now = datetime.datetime.now(datetime.timezone.utc); bad = []
    for cc in sel:
        try: run(cc, now)
        except Exception as e: log("FALLO %s: %s" % (cc, e)); bad.append(cc)
    if len(bad) == len(sel): raise SystemExit("FALLO: ningun pais se pudo actualizar (%s)" % ", ".join(bad))
    if bad: log("aviso: paises sin actualizar (se conserva lo publicado): " + ", ".join(bad))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Nivel y caudal de rios de Paises Bajos, Francia, Canada, Belgica (Flandes) y Polonia -> data/rivers-{nl,fr,ca,be,pl}.json y data/rivers-log.txt.
Un adaptador por pais; cada uno devuelve, por estacion, las lecturas recientes (nivel y caudal) y, si la fuente lo da, la serie diaria historica larga:
 - nl: Rijkswaterstaat, Waterwebservices (DD-API 2.0). Lecturas cada 10 min de los ultimos 30 dias. Sin historia larga -> sin estado. Licencia CC0.
 - fr: Hub'Eau Hydrometrie (SCHAPI/Eaufrance), observations_tr (H en mm, Q en l/s) y obs_elab QmnJ (caudal medio diario desde la apertura). Licencia: Licence Ouverte Etalab (Hub'Eau).
 - ca: ECCC / Water Survey of Canada, API geomet-OGC hydrometric-realtime (30 dias) y hydrometric-daily-mean (hasta el ano anterior). ECCC Data Services End-use Licence v2.1.1.
 - be: VMM / Hydrologisch Informatiecentrum Vlaanderen, KiWIS waterinfo.be (series P.15/O.15 y DagGem). Licencia: Modellicentie voor gratis hergebruik (Vlaanderen).
 - pl: IMGW-PIB, danepubliczne.imgw.pl: API /api/data/hydro (ultima lectura de nivel y caudal de cada estacion) + archivo de medias diarias (dane_hydrologiczne/dobowe, hasta el ano hidrologico cerrado). La API no da historia: la serie propia se acumula con la ultima lectura de cada dia; el archivo solo alimenta la referencia. Licencia: reglamento de datos del IMGW-PIB (reutilizacion citando la fuente).
 - se: SMHI, opendata-download-hydroobs.smhi.se, parametro 1 (Vattenforing, Dygn): caudal medio diario, archivo corregido (desde 1900-1980 segun la estacion) que en las estaciones del SMHI llega hasta ayer. Solo caudal (la API de SMHI no da nivel). Licencia CC BY 4.0 SE.
Media diaria: dia local con lecturas en >= 20 horas distintas; el dia en curso se descarta. La historia propia (points) se une a la ya guardada (KEEP_DAYS) y, donde hay serie larga, se rellena con ella.
Referencia propia (calculo de Dehesa Index, no oficial): para la fecha de la ultima lectura, valores diarios de +-7 dias en los anos anteriores (>= 8 anos); cuartiles y percentil de la lectura actual.
Estado: bajo (percentil < 25), normal, alto (percentil > 75), solo con referencia.
Uso: python3 scripts/update-rivers.py [nl fr ca be pl]  (sin argumentos: todos)."""
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


DEADLINE = [None]   # tope de tiempo por pais (segundos desde el inicio de su adaptador): una API caida no debe agotar los 40 min de todo el flujo
def http(url, data=None, tries=4, timeout=120):
    last = None
    for i in range(tries):
        if DEADLINE[0] and time.time() > DEADLINE[0]: raise RuntimeError("%s -> presupuesto de tiempo del pais agotado" % url[:100])
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
    if meta.get("snap"):   # fuentes sin historia (IMGW): la serie propia es la ultima lectura de cada dia, que se pisa con la siguiente del mismo dia
        for k, last in ((0, last_w), (1, last_q)):
            if last:
                e = days.get(last[0][:10], [None, None]); e[k] = round(last[1], 1 if k == 0 else 3); days[last[0][:10]] = e
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


def nl_series(code, g, start, end, tries=4, timeout=120):
    r = http(NL_API, tries=tries, timeout=timeout, data={"Locatie": {"Code": code}, "AquoPlusWaarnemingMetadata": {"AquoMetadata": {"Compartiment": {"Code": "OW"}, "Grootheid": {"Code": g}}},
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
    qh = {}; seguidos = 0
    for y in range(now.year - 20, now.year):
        if seguidos >= 2: log("aviso: nl %s historia: 2 fallos seguidos, se corta (la API no responde; cada intento aislado, 60 s); se usa lo guardado" % code); break   # sin esto una estacion caida agota los 40 min del flujo
        try: c = datetime.date(y, d0.month, d0.day)
        except ValueError: c = datetime.date(y, d0.month, 28)
        a, b = c - datetime.timedelta(days=10), c + datetime.timedelta(days=11)
        try: ser, _ = nl_series(code, "Q", a.strftime("%Y-%m-%dT00:00:00.000+01:00"), b.strftime("%Y-%m-%dT00:00:00.000+01:00"), tries=1, timeout=60)
        except Exception as e: seguidos += 1; log("aviso: nl %s historia %d: %s" % (code, y, e)); continue
        seguidos = 0; acc = {}
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


# ---------- Polonia (IMGW-PIB) ----------
PL_API = "https://danepubliczne.imgw.pl/api/data/hydro"
PL_ARCH = "https://danepubliczne.imgw.pl/data/dane_pomiarowo_obserwacyjne/dane_hydrologiczne/dobowe"
PL_FIRST_YEAR = 2005
# (rio en la nomenclatura del IMGW, codigo de estacion, nombre mostrado); el codigo es el id_stacji de la API y el PSKDSZS del archivo
PL_STATIONS = [("Wisła", "150210190", "Zawichost"), ("Wisła", "150210170", "Sandomierz"), ("Wisła", "152210170", "Warszawa-Bulwary"), ("Wisła", "152190030", "Włocławek"), ("Wisła", "154180150", "Tczew"),
               ("Odra", "150180060", "Racibórz-Miedonia"), ("Odra", "151160150", "Malczyce"), ("Odra", "151160060", "Głogów"), ("Odra", "152140020", "Gozdowice"), ("Odra", "152140050", "Słubice"),
               ("Warta", "152160140", "Poznań"), ("Warta", "152150040", "Gorzów Wielkopolski"), ("Bug", "152210090", "Wyszków"), ("Narew", "153220070", "Wizna"), ("San", "150220070", "Rzuchów"),
               ("Noteć", "153160170", "Ujście")]
PL_STALE_Q = 3   # dias: un caudal mas viejo que el nivel en mas de esto se descarta (algunas estaciones dejan de calcular el caudal)


def pl_time(s):
    return str(s)[:10] + "T" + str(s)[11:16] if s else None


def pl_file_months(d0, y):
    """meses calendario que cubren d0 +-7 dias en el ano y -> [(ano hidrologico, indice de mes, ano calendario, mes calendario)]"""
    try: c = datetime.date(y, int(d0[5:7]), int(d0[8:10]))
    except ValueError: c = datetime.date(y, int(d0[5:7]), 28)
    ms = []
    for k in (-7, 7):
        x = c + datetime.timedelta(days=k); ms.append((x.year, x.month))
    return sorted(set(ms))


def pl_zip_csv(url):
    import io, zipfile
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r: raw = r.read()
            z = zipfile.ZipFile(io.BytesIO(raw)); return z.read(z.namelist()[0]).decode("cp1250", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            last = e; time.sleep(4)
        except Exception as e: last = e; time.sleep(4)
    raise RuntimeError("%s -> %s" % (url, repr(last)[:120]))


def pl_rows(text, codes, out_w, out_q, want=None):
    """lineas del CSV del IMGW -> out_w/out_q {codigo: {fecha: valor}}. Nivel 9999 y caudal 99999.999 son 'sin dato' (desde 2024, vacio)."""
    import csv
    for r in csv.reader(text.splitlines()):
        if len(r) < 10: continue
        code = r[0].strip().strip('"').strip()
        if code not in codes: continue
        try:
            hy, hm, dd, cm = int(r[3]), int(r[4]), int(r[5]), int(r[9])
            y = hy - 1 if cm >= 11 else hy
            d = "%04d-%02d-%02d" % (y, cm, dd); datetime.date(y, cm, dd)
        except (ValueError, IndexError): continue
        if want and d not in want: continue
        try:
            w = float(r[6]) if r[6].strip() else None
            if w is not None and w >= 9999: w = None
        except ValueError: w = None
        try:
            q = float(r[7]) if r[7].strip() else None
            if q is not None and q >= 99999: q = None
        except ValueError: q = None
        if w is not None: out_w.setdefault(code, {})[d] = w
        if q is not None: out_q.setdefault(code, {})[d] = q


def pl_history(codes, d0, now):
    """medias diarias del archivo del IMGW en la ventana d0 +-7 dias de cada ano cerrado -> (nivel, caudal) por codigo"""
    ow, oq = {}, {}
    for y in range(PL_FIRST_YEAR, now.year):
        want = {(datetime.date(y, int(d0[5:7]), min(int(d0[8:10]), 28)) + datetime.timedelta(days=k)).isoformat() for k in range(-7, 8)}
        files = set()
        for (cy, cm) in pl_file_months(d0, y):
            hy = cy + 1 if cm >= 11 else cy
            if hy >= 2023: files.add("%s/%d/codz_%d.zip" % (PL_ARCH, hy, hy))
            else: files.add("%s/%d/codz_%d_%02d.zip" % (PL_ARCH, hy, hy, (cm - 11) % 12 + 1))
        for u in sorted(files):
            try: t = pl_zip_csv(u)
            except Exception as e: log("aviso: pl archivo %s: %s" % (u[-22:], e)); continue
            if t: pl_rows(t, codes, ow, oq, want)
    return ow, oq


def adapt_pl(now, old=None):
    api = http(PL_API, timeout=120); by = {str(x.get("id_stacji")): x for x in api}
    metas = []
    for river, code, name in PL_STATIONS:
        x = by.get(code)
        if not x or x.get("stan_wody") in (None, "") or not x.get("stan_wody_data_pomiaru"): log("aviso: pl %s %s sin lectura en la API" % (river, name)); continue
        tw = pl_time(x["stan_wody_data_pomiaru"])
        w = [(tw, float(x["stan_wody"]))]
        q = []
        if x.get("przeplyw") not in (None, "") and x.get("przeplyw_data"):
            tq = pl_time(x["przeplyw_data"])
            if (datetime.date.fromisoformat(tw[:10]) - datetime.date.fromisoformat(tq[:10])).days <= PL_STALE_Q: q = [(tq, float(x["przeplyw"]))]
        metas.append({"id": code, "river": river, "name": name, "lon": round(float(x["lon"]), 4) if x.get("lon") else None, "lat": round(float(x["lat"]), 4) if x.get("lat") else None, "w": w, "q": q, "snap": True, "prefill": False,
                      "base": {"km": float(x["kilometr_biegu_rzeki"])} if x.get("kilometr_biegu_rzeki") not in (None, "") else None})
    if not metas: raise RuntimeError("pl: la API no devolvio ninguna estacion elegida")
    d0 = max(m["w"][0][0] for m in metas)[:10]
    wh, qh = pl_history({m["id"] for m in metas}, d0, now)
    for m in metas:
        m["wh"], m["qh"] = wh.get(m["id"], {}), qh.get(m["id"], {})
        if not m["base"]: m.pop("base")
    return metas


# ---------- Suecia ----------
SE_API = "https://opendata-download-hydroobs.smhi.se/api/version/1.0/parameter/1/station/%s/period/corrected-archive/data.json"
SE_STATIONS = [("Kalix älv", "17", "Räktfors"), ("Torne älv", "2395", "Kallio 2"), ("Ume älv", "2237", "Granåker"), ("Pite älv", "1387", "Gransel"), ("Indalsälven", "2117", "Fyrås"),
               ("Ljusnan", "740", "Nybro"), ("Dalälven", "2407", "Svärdsjö"), ("Norrström", "2139", "Karlslund 2"), ("Göta älv", "1221", "Moholm"), ("Motala ström", "2293", "Tolhem"),
               ("Nyköpingsån", "1273", "Hallbosjön"), ("Viskan", "2201", "Åsbro 3"), ("Ätran", "364", "Hillared"), ("Nissan", "2340", "Snapparp"), ("Lagan", "200", "Rörvik"),
               ("Emån", "1622", "Brusafors"), ("Mörrumsån", "186", "Mörrum"), ("Helge å", "1069", "Möckeln"), ("Rönne å", "1635", "Klippan 2"), ("Kävlingeån", "2126", "Ellinge")]
SE_STALE_DAYS = 6   # una estacion cuya ultima lectura es mas antigua se deja fuera
SE_MIN_YEARS = 8


def adapt_se(now, old=None):
    """Caudal medio diario de 20 estaciones del SMHI. Las fechas de la API son la medianoche local en milisegundos UTC; se pasan a fecha local de Estocolmo."""
    tz = ZoneInfo("Europe/Stockholm") if ZoneInfo else datetime.timezone(datetime.timedelta(hours=1))
    cat = http("https://opendata-download-hydroobs.smhi.se/api/version/1.0/parameter/1.json", timeout=120); pos = {str(x["id"]): x for x in cat.get("station", [])}
    metas = []
    for river, code, name in SE_STATIONS:
        try: d = http(SE_API % code, timeout=180)
        except Exception as e: log("aviso: se %s %s: %s" % (river, name, e)); continue
        qh = {}
        for r in d.get("value", []):
            if r.get("value") is None: continue
            day = datetime.datetime.fromtimestamp(r["date"] / 1000, datetime.timezone.utc).astimezone(tz).date().isoformat()
            qh[day] = float(r["value"])
        if not qh: log("aviso: se %s %s sin datos" % (river, name)); continue
        last = max(qh)
        if (now.date() - datetime.date.fromisoformat(last)).days > SE_STALE_DAYS: log("aviso: se %s %s: ultima lectura %s, antigua" % (river, name, last)); continue
        x = pos.get(code, {})
        metas.append({"id": code, "river": river, "name": name, "lon": round(x["longitude"], 4) if x.get("longitude") is not None else None, "lat": round(x["latitude"], 4) if x.get("latitude") is not None else None,
                      "w": [], "q": [(last + "T00:00", qh[last])], "qh": qh, "wh": {}, "base": {"catchmentKm2": round(x["catchmentSize"], 1)} if x.get("catchmentSize") not in (None, -9999.0) else None})
        if not metas[-1]["base"]: metas[-1].pop("base")
    if not metas: raise RuntimeError("se: la API no devolvio ninguna estacion elegida")
    return metas


ADAPTERS = {
    "nl": (adapt_nl, {"id": "rijkswaterstaat", "name": "Rijkswaterstaat, Waterwebservices (DD-API 2.0), ruwe data", "url": "https://waterwebservices.rijkswaterstaat.nl/", "license": "CC0-1.0"}),
    "fr": (adapt_fr, {"id": "hubeau_hydrometrie", "name": "Hub'Eau, API Hydrométrie (SCHAPI, Eaufrance)", "url": "https://hubeau.eaufrance.fr/page/api-hydrometrie", "license": "Licence Ouverte 2.0"}),
    "ca": (adapt_ca, {"id": "eccc_hydrometric", "name": "Environment and Climate Change Canada, Water Survey of Canada (geomet-OGC)", "url": "https://api.weather.gc.ca/", "license": "ECCC Data Services End-use Licence 2.1.1"}),
    "be": (adapt_be, {"id": "vmm_waterinfo", "name": "Vlaamse Milieumaatschappij, Hydrologisch Informatiecentrum (waterinfo.be KiWIS)", "url": "https://www.waterinfo.be/", "license": "Modellicentie voor gratis hergebruik v1.0"}),
    "se": (adapt_se, {"id": "smhi", "name": "SMHI (Swedish Meteorological and Hydrological Institute), Hydrologiska observationer: Vattenföring (Dygn), arkiv med kontrollerade värden", "url": "https://opendata-download-hydroobs.smhi.se/", "license": "CC BY 4.0 SE (Creative Commons Erkännande 4.0 SE)"}),
    "pl": (adapt_pl, {"id": "imgw_pib", "name": "Instytut Meteorologii i Gospodarki Wodnej (IMGW-PIB), dane publiczne: hydro API y archivo de medias diarias", "url": "https://danepubliczne.imgw.pl/", "license": "IMGW-PIB: reutilizacion citando la fuente"}),
}


def run(cc, now):
    fn, src = ADAPTERS[cc]; out_f = DATA / ("rivers-%s.json" % cc)
    old = {}
    if out_f.exists():
        try: old = {s["id"]: s for s in json.loads(out_f.read_text(encoding="utf-8")).get("stations", [])}
        except Exception: old = {}
    DEADLINE[0] = time.time() + 12 * 60
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

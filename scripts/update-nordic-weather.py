#!/usr/bin/env python3
"""Suecia y Dinamarca: tiempo observado frente a lo normal (lluvia y temperatura) -> data/se-weather.json y data/dk-weather.json
Fuentes (datos abiertos, CC BY 4.0): SMHI (observaciones meteorologicas, parametros 2 temperatura media diaria y 5 precipitacion diaria; archivo corregido + ultimos meses)
y DMI (Danmarks Meteorologiske Institut, API climateData, stationValue diario: mean_temp y acc_precip).
Calculo de Dehesa Index (no son cifras publicadas por los institutos): promedio de las estaciones con dato cada dia (al menos MINST); mensual = suma de lluvia / media de temperatura
de los dias con dato (mes con >= 90 % de dias); normal = media de los mismos meses de SINCE al ano anterior (al menos MINYEARS anos); 30 dias = ultimos 30 dias frente a la misma ventana
en los anos anteriores; desde el 1 de abril = lluvia acumulada frente a la misma fecha en los anos anteriores.
Si algo falla se conserva el fichero anterior. Uso: python3 scripts/update-nordic-weather.py [se] [dk]"""
import datetime, json, statistics, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)", "Accept": "application/json"}
SINCE = 2005; MINYEARS = 12; MINST = 6; NMONTHS = 12
SE_ST = [("53430", "Lund"), ("64030", "Kristianstad"), ("64510", "Växjö"), ("71420", "Göteborg"), ("78400", "Visby"), ("83270", "Skara"), ("85240", "Linköping-Malmslätt"),
         ("96190", "Eskilstuna"), ("96350", "Västerås"), ("97510", "Uppsala"), ("105370", "Falun"), ("107420", "Gävle"), ("162860", "Luleå")]
SE_API = "https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/%d/station/%s/period/%s/data.%s"
def http(url, tries=4, timeout=180):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return json.loads(r.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404): break
            time.sleep(5 * (i + 1))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[:150], repr(last)[:160]))
def text(url, tries=4, timeout=240):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404): break
            time.sleep(5 * (i + 1))
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[:150], repr(last)[:160]))
def se_series(par, sid):
    """{AAAA-MM-DD: valor}: archivo corregido (CSV, hasta ~3 meses atras; manda donde coincide) + ultimos meses (JSON, dia representativo en 'ref')"""
    out = {}
    for line in text(SE_API % (par, sid, "corrected-archive", "csv")).splitlines():
        f = line.split(";")
        if len(f) >= 5 and f[2][:4].isdigit() and len(f[2]) == 10 and f[3].strip():
            try: out[f[2]] = float(f[3])
            except ValueError: pass
    if len(out) < 3000: raise RuntimeError("archivo corto (%d dias)" % len(out))
    try:
        for r in http(SE_API % (par, sid, "latest-months", "json")).get("value", []):
            if r.get("ref") and r.get("value") not in (None, ""): out.setdefault(r["ref"], float(r["value"]))
    except Exception as e: print("aviso: se %s %s sin ultimos meses: %s" % (par, sid, e), flush=True)
    return out
def fetch_se():
    st = {}
    for sid, name in SE_ST:
        try: st[sid] = {"name": name, "t": se_series(2, sid), "r": se_series(5, sid)}
        except Exception as e: print("aviso: se %s %s: %s" % (sid, name, e), flush=True)
    return st
DK_ST = [("06030", "Ålborg"), ("06060", "Karup"), ("06069", "Foulum"), ("06070", "Århus"), ("06080", "Esbjerg"), ("06104", "Billund"), ("06116", "Store Jyndevad"), ("06120", "Odense"),
         ("06135", "Flakkebjerg"), ("06156", "Holbæk"), ("06170", "Roskilde"), ("06180", "København"), ("06149", "Gedser")]
DK_API = "https://opendataapi.dmi.dk/v2/climateData/collections/stationValue/items?stationId=%s&parameterId=%s&timeResolution=day&datetime=%s/%s&limit=300000"
def dk_series(par, sid, start, end):
    out = {}; url = DK_API % (sid, par, start, end)
    for _ in range(6):
        d = http(url, timeout=240)
        for f in d.get("features", []):
            p = f["properties"]
            if p.get("value") is not None and p.get("from"): out[p["from"][:10]] = float(p["value"])
        nxt = [l["href"] for l in d.get("links", []) if l.get("rel") == "next"]
        if len(d.get("features", [])) < 300000 or not nxt: break
        url = nxt[0]
    return out
def fetch_dk():
    st = {}; now = datetime.datetime.now(datetime.timezone.utc); end = (now + datetime.timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    for sid, name in DK_ST:
        try:
            s = {"name": name, "t": dk_series("mean_temp", sid, "1990-01-01T00:00:00Z", end), "r": dk_series("acc_precip", sid, "1990-01-01T00:00:00Z", end)}
            print("dk %s %s: %d dias temperatura (desde %s), %d de lluvia (desde %s)" % (sid, name, len(s["t"]), min(s["t"]) if s["t"] else "-", len(s["r"]), min(s["r"]) if s["r"] else "-"), flush=True)
            if s["t"] and s["r"]: st[sid] = s
        except Exception as e: print("aviso: dk %s %s: %s" % (sid, name, e), flush=True)
    return st
ADAPT = {"se": (fetch_se, {"id": "smhi", "name": "SMHI, observaciones meteorologicas (parametros 2 y 5)", "url": "https://opendata-download-metobs.smhi.se/", "license": "CC BY 4.0 SE"}),
         "dk": (fetch_dk, {"id": "dmi", "name": "DMI, Danmarks Meteorologiske Institut, climateData stationValue diario (mean_temp, acc_precip)", "url": "https://www.dmi.dk/friedata/", "license": "CC BY 4.0"})}
def avg_days(st, key):
    """{fecha: promedio de estaciones} con al menos MINST estaciones"""
    acc = {}
    for s in st.values():
        for d, v in s[key].items(): a = acc.setdefault(d, []); a.append(v)
    return {d: sum(v) / len(v) for d, v in acc.items() if len(v) >= MINST}
def monthly(days, kind):
    """{AAAA-MM: valor} de los meses con >= 90 % de dias"""
    by = {}
    for d, v in days.items(): by.setdefault(d[:7], []).append(v)
    out = {}
    for m, vs in by.items():
        y, mo = int(m[:4]), int(m[5:7]); nd = (datetime.date(y + (mo == 12), mo % 12 + 1, 1) - datetime.date(y, mo, 1)).days
        if len(vs) >= 0.9 * nd: out[m] = sum(vs) if kind == "sum" else sum(vs) / len(vs)
    return out
def window(days, end, n, kind):
    """valor en los n dias hasta `end` (inclusive) de cada ano: {ano: valor} (solo si hay >= 90 % de dias)"""
    out = {}
    for y in range(SINCE, end.year + 1):
        try: e = end.replace(year=y)
        except ValueError: e = end.replace(year=y, day=28)
        vs = [days[(e - datetime.timedelta(days=k)).isoformat()] for k in range(n) if (e - datetime.timedelta(days=k)).isoformat() in days]
        if len(vs) >= 0.9 * n: out[y] = sum(vs) if kind == "sum" else sum(vs) / len(vs)
    return out
def since_apr(days, end):
    out = {}
    for y in range(SINCE, end.year + 1):
        try: e = end.replace(year=y)
        except ValueError: e = end.replace(year=y, day=28)
        a = datetime.date(y, 4, 1); n = (e - a).days + 1
        if n < 1: continue
        vs = [days[(a + datetime.timedelta(days=k)).isoformat()] for k in range(n) if (a + datetime.timedelta(days=k)).isoformat() in days]
        if len(vs) >= 0.9 * n: out[y] = sum(vs)
    return out
def normal(per_year, y0):
    prev = [v for y, v in per_year.items() if y < y0]
    return (sum(prev) / len(prev), len(prev)) if len(prev) >= MINYEARS else (None, len(prev))
def build(cc, st, src, now):
    rain, temp = avg_days(st, "r"), avg_days(st, "t")
    if len(rain) < 3000 or len(temp) < 3000: raise RuntimeError("%s: pocos dias con dato (lluvia %d, temperatura %d)" % (cc, len(rain), len(temp)))
    end = max(d for d in rain if d in temp); end_d = datetime.date.fromisoformat(end)
    if (now.date() - end_d).days > 10: raise RuntimeError("%s: la ultima fecha con dato es %s" % (cc, end))
    mr, mt = monthly(rain, "sum"), monthly(temp, "mean"); months = []
    ms = sorted(m for m in set(mr) | set(mt) if m <= end[:7])[-NMONTHS:]
    for m in ms:
        mo = m[5:]
        rn = normal({int(k[:4]): v for k, v in mr.items() if k[5:] == mo}, int(m[:4])); tn = normal({int(k[:4]): v for k, v in mt.items() if k[5:] == mo}, int(m[:4]))
        months.append({"m": m, "rain": round(mr[m], 1) if m in mr else None, "rainN": round(rn[0], 1) if rn[0] is not None else None, "temp": round(mt[m], 1) if m in mt else None, "tempN": round(tn[0], 1) if tn[0] is not None else None})
    w30r, w30t, sa = window(rain, end_d, 30, "sum"), window(temp, end_d, 30, "mean"), since_apr(rain, end_d); y0 = end_d.year
    rn30, tn30, san = normal(w30r, y0), normal(w30t, y0), normal(sa, y0)
    cur = lambda w: round(w[y0], 1) if y0 in w else None
    rd = lambda x: round(x, 1) if x is not None else None
    stations = []
    for sid, s in st.items():
        last = max(s["r"]) if s["r"] else None
        r30 = [s["r"][(end_d - datetime.timedelta(days=k)).isoformat()] for k in range(30) if (end_d - datetime.timedelta(days=k)).isoformat() in s["r"]]
        t7 = [s["t"][(end_d - datetime.timedelta(days=k)).isoformat()] for k in range(7) if (end_d - datetime.timedelta(days=k)).isoformat() in s["t"]]
        stations.append({"id": sid, "name": s["name"], "last": last, "rain30": round(sum(r30), 1) if len(r30) >= 27 else None, "temp7": round(sum(t7) / len(t7), 1) if len(t7) >= 6 else None})
    yrs = sorted({int(m[:4]) for m in mr}); first = min(w30r) if w30r else SINCE
    return {"schemaVersion": 1, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "country": cc.upper(), "asOf": end, "source": src, "since": first, "stations": stations,
            "l30": {"rain": cur(w30r), "rainN": rd(rn30[0]), "temp": cur(w30t), "tempN": rd(tn30[0]), "from": (end_d - datetime.timedelta(days=29)).isoformat(), "years": rn30[1]},
            "sinceApr": {"rain": cur(sa), "rainN": rd(san[0]), "years": san[1]} if y0 in sa else None, "monthly": months}
def main():
    sel = [a for a in sys.argv[1:] if a in ADAPT] or list(ADAPT); now = datetime.datetime.now(datetime.timezone.utc); bad = []
    for cc in sel:
        fn, src = ADAPT[cc]
        try:
            doc = build(cc, fn(), src, now)
            (DATA / ("%s-weather.json" % cc)).write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
            print("%s-weather.json: %d estaciones, hasta %s, 30 dias %s mm (normal %s), desde abril %s" % (cc, len(doc["stations"]), doc["asOf"], doc["l30"]["rain"], doc["l30"]["rainN"], (doc["sinceApr"] or {}).get("rain")), flush=True)
        except Exception as e: print("FALLO %s: %s" % (cc, e), flush=True); bad.append(cc)
    if len(bad) == len(sel): raise SystemExit(1)
if __name__ == "__main__": main()

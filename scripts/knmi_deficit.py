"""Deficit de precipitacion de Paises Bajos a partir de los datos diarios del KNMI (daggegevens, EV24 = evaporacion de referencia de Makkink y RH = precipitacion,
en 0,1 mm). Definicion del KNMI: suma acumulada desde el 1 de abril de (evaporacion de referencia - precipitacion), media de 13 estaciones principales
(Valkenburg, De Kooy, Schiphol, De Bilt, Leeuwarden, Eelde, Twenthe, Vlissingen, Rotterdam, Gilze-Rijen, Eindhoven, Volkel, Maastricht). Dehesa Index lo calcula
por si mismo con esos datos; no es la cifra publicada por el KNMI. Un dia entra si al menos 8 estaciones tienen dato de las dos variables."""
import datetime, time, urllib.request
URL = "https://www.daggegevens.knmi.nl/klimatologie/daggegevens"
STNS = "210:235:240:260:270:280:290:310:344:350:370:375:380"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
NDAYS = 214   # 1 abril .. 31 octubre
def fetch(y0, d0, y1, d1, tries=4):
    body = ("start=%s&end=%s&vars=EV24:RH&stns=%s" % (d0, d1, STNS)).encode(); last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=H), timeout=240) as r: t = r.read().decode("utf-8", "replace")
            if "Query Error" in t or "<html" in t[:200].lower(): raise RuntimeError("KNMI: " + t[-200:].replace("\n", " "))
            return t
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError(str(last)[:200])
def parse(t):
    """-> {fecha ISO: [(evap mm, lluvia mm)...]}"""
    out = {}
    for l in t.split("\n"):
        if not l or l[0] == "#": continue
        p = [x.strip() for x in l.split(",")]
        if len(p) < 4 or not p[2] or not p[3]: continue
        try: e = int(p[2]) / 10.0; r = max(0, int(p[3])) / 10.0
        except ValueError: continue
        d = "%s-%s-%s" % (p[1][:4], p[1][4:6], p[1][6:8]); out.setdefault(d, []).append((e, r))
    return out
def season(year, raw):
    """Curva acumulada (mm) del 1 de abril al 31 de octubre de un ano; None donde falta dato (o aun no ha llegado)."""
    cum = 0.0; out = []; d = datetime.date(year, 4, 1); last_ok = None
    for i in range(NDAYS):
        v = raw.get(d.isoformat())
        if v and len(v) >= 8:
            cum += sum(e - r for e, r in v) / len(v); out.append(round(cum, 1)); last_ok = i
        else: out.append(None)
        d += datetime.timedelta(days=1)
    # huecos sueltos (no al final): se rellenan con el valor anterior para no romper la curva
    for i in range(1, last_ok + 1 if last_ok is not None else 0):
        if out[i] is None: out[i] = out[i - 1]
    return out
def get_year(y, today):
    end = min(datetime.date(y, 10, 31), today - datetime.timedelta(days=1))
    return season(y, parse(fetch(y, "%d0401" % y, y, end.strftime("%Y%m%d"))))

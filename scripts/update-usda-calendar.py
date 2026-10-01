#!/usr/bin/env python3
"""Calendario oficial de publicaciones de USDA (NASS + WASDE) -> data/usda-calendar.json.
Fuentes (paginas publicas, dominio publico de EE. UU.):
 - NASS, "Reports by Date": https://www.nass.usda.gov/Publications/Calendar/reports_by_date.php?view=l&month=MM&year=YYYY
 - WASDE (Office of the Chief Economist): fechas del ano en la pagina del informe.
Reglas: solo se escribe lo que la fuente publica (ninguna fecha calculada ni inventada); si un mes no se puede leer o devuelve 0 filas,
se conserva lo que ya habia de ese mes; si NINGUNA fuente responde, el fichero no se toca y el proceso sale en rojo.
El analizador acepta HTML o texto (celdas separadas por tabuladores/saltos) para poder probarlo con muestras (scripts/test-usda-calendar.py)."""
import datetime, json, re, sys, time, urllib.request
from html.parser import HTMLParser
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "usda-calendar.json"
NASS = "https://www.nass.usda.gov/Publications/Calendar/reports_by_date.php?view=l&month=%02d&year=%d"
WASDE_URL = "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "text/html,text/plain"}
DATE_RE = re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*,\s*(\d{2})/(\d{2})/(\d{2})$")
TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})\s*([ap])m\s+E[SD]?T$", re.I)
STATUS_RE = re.compile(r"^(Published|Report Pending|Pending|Cancel|Resched|Postpon)", re.I)
END_RE = re.compile(r"^Last Modified", re.I)
MONTHS = {m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}

class _Tok(HTMLParser):
    def __init__(self): super().__init__(); self.t = []; self.skip = 0
    def handle_starttag(self, tag, a):
        if tag in ("script", "style"): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip: self.skip -= 1
    def handle_data(self, d):
        if not self.skip and d.strip(): self.t.append(re.sub(r"\s+", " ", d).strip())
def tokens(raw):
    if "<" in raw and ">" in raw:
        p = _Tok(); p.feed(raw); return p.t
    out = []
    for line in raw.replace("\r", "").split("\n"):
        for c in line.split("\t"):
            c = re.sub(r"\s+", " ", c).strip()
            if c: out.append(c)
    return out
def slug(name): return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
def parse_nass(raw, year, month):
    """Devuelve (filas, filas_fuera_de_mes). Cada fila: {date, time, agency, id, name[, qs]}."""
    rows, bad, cur, ent = [], 0, None, None
    def close():
        nonlocal ent
        if ent and ent["parts"]:
            name = " ".join(ent["parts"]); qs = bool(re.search(r"\(Quick Stats database\)", name, re.I))
            name = re.sub(r"\s*\(Quick Stats database\)\s*", " ", name, flags=re.I).strip()
            if name and ent["date"]:
                r = {"date": ent["date"], "time": ent["time"], "agency": "NASS", "id": slug(name), "name": name}
                if qs: r["qs"] = True
                rows.append(r)
        ent = None
    for k in tokens(raw):
        m = DATE_RE.match(k)
        if m: close(); cur = "20%s-%s-%s" % (m.group(4), m.group(2), m.group(3)); continue
        m = TIME_RE.match(k)
        if m:
            close(); h = int(m.group(1)) % 12 + (12 if m.group(3).lower() == "p" else 0)
            ent = {"date": cur, "time": "%02d:%s" % (h, m.group(2)), "parts": []}; continue
        if ent is not None:
            if STATUS_RE.match(k) or END_RE.match(k): close()
            else: ent["parts"].append(k)
    close()
    ok = []
    for r in rows:
        if r["date"][:7] == "%04d-%02d" % (year, month): ok.append(r)
        else: bad += 1
    return ok, bad
def parse_wasde(raw):
    """Fechas WASDE del ano (12 esperadas). Devuelve (year, time|None, [iso...]) o lanza ValueError."""
    t = re.sub(r"\s+", " ", " ".join(tokens(raw)))
    my = re.search(r"In (\d{4}) the WASDE report will be released on (.+?)\.(?:\s+[A-Z]|$)", t)
    if not my: raise ValueError("sin frase de fechas WASDE")
    year = int(my.group(1)); seg = my.group(2) + "."
    out = []
    for mm, dd in re.findall(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\b", seg):
        out.append(datetime.date(year, MONTHS[mm.lower()], int(dd)).isoformat())
    if len(out) != 12 or out != sorted(set(out)): raise ValueError("WASDE: %d fechas (esperadas 12 ascendentes)" % len(out))
    mt = re.search(r"WASDE Release Dates \((\d{1,2}):(\d{2})\s*([ap])m ET\)", t, re.I)
    tm = None
    if mt: tm = "%02d:%s" % (int(mt.group(1)) % 12 + (12 if mt.group(3).lower() == "p" else 0), mt.group(2))
    return year, tm, out
def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60) as r: return r.read().decode("utf-8", "replace")
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:160])
def merge(prev, nass_months, wasde):
    """nass_months: {(y,m): filas}; wasde: (year,time,fechas) o None. Sustituye solo lo leido; conserva el resto."""
    keep = [r for r in prev if not (r["agency"] == "NASS" and (int(r["date"][:4]), int(r["date"][5:7])) in nass_months)]
    if wasde: keep = [r for r in keep if not (r["agency"] == "OCE" and r["date"][:4] == str(wasde[0]))]
    for rows in nass_months.values(): keep += rows
    if wasde:
        for d in wasde[2]:
            r = {"date": d, "agency": "OCE", "id": "wasde", "name": "WASDE"}
            if wasde[1]: r["time"] = wasde[1]
            keep.append(r)
    return sorted(keep, key=lambda r: (r["date"], r.get("time", ""), r["id"]))
def main():
    today = datetime.date.today(); notes = []; got_nass = {}; wasde = None
    try: prev = json.loads(OUT.read_text(encoding="utf-8")).get("releases", [])
    except Exception: prev = []
    y, m = today.year, today.month - 1
    if m < 1: y, m = y - 1, 12
    for _ in range(6):  # el mes anterior y los cinco siguientes
        try:
            rows, bad = parse_nass(get(NASS % (m, y)), y, m)
            if rows: got_nass[(y, m)] = rows; print("NASS %d-%02d: %d filas%s" % (y, m, len(rows), " (%d fuera de mes)" % bad if bad else ""))
            else: notes.append("NASS %d-%02d: 0 filas, se conserva lo anterior" % (y, m)); print(notes[-1])
        except Exception as e: notes.append("NASS %d-%02d: %s" % (y, m, e)); print(notes[-1])
        m += 1
        if m > 12: y, m = y + 1, 1
    try: wasde = parse_wasde(get(WASDE_URL)); print("WASDE %d: %d fechas" % (wasde[0], len(wasde[2])))
    except Exception as e: notes.append("WASDE: %s" % e); print(notes[-1])
    if not got_nass and not wasde: print("ninguna fuente respondio: no se escribe nada"); return 1
    rel = merge(prev, got_nass, wasde)
    cutoff = (today - datetime.timedelta(days=75)).isoformat()
    rel = [r for r in rel if r["date"] >= cutoff]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "USDA NASS (Reports by Date) y USDA OCE (WASDE)", "url": "https://www.nass.usda.gov/Publications/Calendar/reports_by_date.php", "license": "US Government work (public domain); credit: U.S. Department of Agriculture"},
           "timezone": "America/New_York", "notes": notes, "releases": rel}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT.name, len(rel), "publicaciones")
    nxt = (today.year + (today.month == 12), today.month % 12 + 1)
    return 0 if (((today.year, today.month) in got_nass or nxt in got_nass) and wasde) else 1
if __name__ == "__main__": sys.exit(main())

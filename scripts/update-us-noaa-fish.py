#!/usr/bin/env python3
"""EE. UU. — desembarques comerciales de pesca de NOAA Fisheries (FOSS, Fisheries One Stop Shop) -> data/us-noaa-fish-stats.json (countries.US, extend; grupo 'fish')
API publica ORDS sin clave: https://apps-st.fisheries.noaa.gov/ods/foss/landings/ (registros por ano, estado y especie, libras de peso vivo y dolares corrientes).
Licencia: dominio publico (CC0 1.0 en el catalogo federal data.gov, ficha «Fisheries One Stop Shop Public Data»).
  * Total nacional por ano (valor y libras): suma de Dehesa Index de todos los registros comerciales que publica NOAA para ese ano, incluida la partida
    «withheld for confidentiality» (lo que NOAA no desglosa por especie para no revelar a un pescador concreto). No se estima nada.
  * Las 8 especies con mas valor el ultimo ano (valor y libras, sumando los estados) y los 10 estados con mas valor (valor y libras).
NOAA revisa los ultimos anos: el ultimo ano publicado puede cambiar. Series con <3 puntos o paradas (ultimo dato anterior a ano-3) no se publican."""
import datetime, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "us-noaa-fish-stats.json"
API = "https://apps-st.fisheries.noaa.gov/ods/foss/landings/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)", "Accept": "application/json"}
SRC = {"name": "NOAA Fisheries, Fisheries One Stop Shop (FOSS), commercial landings (public domain)", "url": "https://www.fisheries.noaa.gov/foss", "license": "CC0 1.0 (U.S. public domain)"}
FIRST = 1990
NOTE = "Sum by Dehesa Index of all commercial landing records NOAA publishes for the year, including the part withheld for confidentiality. NOAA revises recent years."
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a)); print(*a, flush=True)
def get(u, t=120, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def year_rows(y):
    rows, off = [], 0
    q = urllib.parse.quote(json.dumps({"year": y, "collection": "Commercial"}))
    while True:
        d = get("%s?q=%s&limit=5000&offset=%d" % (API, q, off)); it = d.get("items") or []
        rows += it; off += len(it)
        if not d.get("hasMore") or not it: break
    return rows
def nice(s):
    s = re.sub(r"\*+", "", s or "").strip()
    par = re.findall(r"\(.*?\)", s); s = re.sub(r",?\s*\(.*?\)", "", s).strip()
    parts = [p.strip() for p in s.split(",") if p.strip()]
    s = " ".join(reversed(parts)).lower() + ((" " + " ".join(par)) if par else "")
    return s[:1].upper() + s[1:]
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]
def build(sid, label, unit, pts, src, note=NOTE):
    pts = sorted((str(p), round(v, 2)) for p, v in pts.items() if v is not None)
    pts = [[p, v] for p, v in pts]
    if len(pts) < 3 or int(pts[-1][0]) < datetime.date.today().year - 3: return None
    prev = pts[-2][1]
    return dict(id=sid, group="fish", label=label, unit=unit, frequency="annual", latestPeriod=pts[-1][0], latest=pts[-1][1],
                changePct=round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, points=pts, sourceGroup=src, periodNote=note)
def main():
    tot_v, tot_lb, sp_v, sp_lb, st_v, st_lb, names = {}, {}, {}, {}, {}, {}, {}
    years = list(range(FIRST, datetime.date.today().year + 1)); got = []
    for y in years:
        try: rows = year_rows(y)
        except Exception as e: log("ERROR", y, repr(e)[:200]); continue
        if not rows: log(y, "sin registros"); continue
        got.append(y); v_sum = lb_sum = 0.0; nv = 0
        for r in rows:
            v, lb = r.get("dollars"), r.get("pounds")
            r["ts_afs_name"] = r.get("ts_afs_name") or "UNSPECIFIED"; r["state_name"] = r.get("state_name") or ""
            if isinstance(v, (int, float)): v_sum += v; nv += 1; sp_v.setdefault(r["ts_afs_name"], {})[y] = sp_v.get(r["ts_afs_name"], {}).get(y, 0) + v; st_v.setdefault(r["state_name"], {})[y] = st_v.get(r["state_name"], {}).get(y, 0) + v
            if isinstance(lb, (int, float)): lb_sum += lb; sp_lb.setdefault(r["ts_afs_name"], {})[y] = sp_lb.get(r["ts_afs_name"], {}).get(y, 0) + lb; st_lb.setdefault(r["state_name"], {})[y] = st_lb.get(r["state_name"], {}).get(y, 0) + lb
        if nv: tot_v[y] = v_sum
        tot_lb[y] = lb_sum
        log(y, len(rows), "registros", round(v_sum / 1e6, 1), "MUSD")
    if len(got) < 20: raise SystemExit("FALLO: pocos anos (%d)" % len(got))
    last = max(got); ser = []
    for s in (build("us-noaa-fish-landings-value", "Commercial fish landings: total value (USD, NOAA Fisheries)", "USD", tot_v, "NOAA FOSS commercial landings"),
              build("us-noaa-fish-landings-lb", "Commercial fish landings: total quantity (pounds live weight, NOAA Fisheries)", "lb", tot_lb, "NOAA FOSS commercial landings")):
        if s: ser.append(s)
    notesp = "Main species chosen by Dehesa Index from the latest published value; NOAA sums all states. " + "NOAA revises recent years."
    for nm in [k for k, _ in sorted(((k, v.get(last, 0)) for k, v in sp_v.items() if "WITHHELD" not in k.upper() and k != "UNSPECIFIED"), key=lambda x: -x[1])[:8]]:
        for d, u, txt in ((sp_v, "USD", "value"), (sp_lb, "lb", "quantity (pounds live weight)")):
            s = build("us-noaa-fish-sp-%s-%s" % (slug(nm), u.lower()), "Commercial fish landings: %s, %s (NOAA Fisheries)" % (nice(nm), txt), u, d.get(nm, {}), "NOAA FOSS %s" % nm, notesp)
            if s: ser.append(s)
    for nm in [k for k, _ in sorted(((k, v.get(last, 0)) for k, v in st_v.items() if k), key=lambda x: -x[1])[:10]]:
        for d, u, txt in ((st_v, "USD", "value"), (st_lb, "lb", "quantity (pounds live weight)")):
            s = build("us-noaa-fish-st-%s-%s" % (slug(nm), u.lower()), "Commercial fish landings in %s: %s (NOAA Fisheries)" % (nm.title(), txt), u, d.get(nm, {}), "NOAA FOSS %s" % nm,
                      "Main states chosen by Dehesa Index from the latest published value. " + NOTE)
            if s: ser.append(s)
    ids = [s["id"] for s in ser]
    if len(ids) != len(set(ids)): raise SystemExit("ids repetidos")
    if len(ser) < 20: raise SystemExit("FALLO: pocas series (%d)" % len(ser))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    doc = {"schemaVersion": 1, "generatedAt": now, "countries": {"US": {"name": "United States", "extend": True, "source": SRC, "series": sorted(ser, key=lambda s: s["id"])}}, "log": LOG[-25:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "data" / "us-noaa-fish-log.txt").write_text("\n".join(LOG) + "\n")
    print("series", len(ser))
main()

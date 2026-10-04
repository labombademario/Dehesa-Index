#!/usr/bin/env python3
"""Blog semanal automatico de Dehesa Index (sin texto inventado, sin modelos de lenguaje).

1) ARCHIVO: data/news.json solo guarda ~4 dias. Cada ejecucion vuelca sus noticias en data/news-archive/<AAAA-Www>.json (semana ISO de la
   fecha de cada noticia). Solo guarda lo necesario para enlazar: titular en su idioma original, medio, fecha, region, temas, productos, enlace
   y la relevancia que ya calculo el pipeline de noticias. No se guarda la descripcion ni se reproduce ningun texto de la noticia.
2) RESUMEN: de cada semana archivada con cobertura suficiente genera data/blog/weekly/<AAAA-Www>.json: totales (noticias, medios, regiones,
   temas, productos, dias), los titulares mas relevantes en general y por region, con su enlace; y data/blog/weekly/index.json.
   La seleccion es determinista (relevancia, fecha, id) con un maximo de 2 titulares por medio en cada bloque y sin titulares casi iguales.
   El texto en prosa lo compone la web (blog.js, 4 idiomas) a partir de estas cifras; aqui no hay prosa.
Cobertura honesta: cada archivo recuerda desde que dia tiene noticias completas (coverage.from). Una semana se publica solo si hay >= MIN_ITEMS
noticias y >= MIN_DAYS dias cubiertos; si la semana aun no ha terminado se marca complete=false (se reconstruye con cada ejecucion).
Uso: python3 scripts/update-weekly-blog.py            # archiva data/news.json y reconstruye los resumenes
     python3 scripts/update-weekly-blog.py --backfill-git   # una vez: archiva tambien las versiones antiguas de data/news.json (historial de git)
     python3 scripts/update-weekly-blog.py --build-only"""
import datetime, json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"; ARCH = DATA / "news-archive"; OUT = DATA / "blog" / "weekly"
MIN_ITEMS = 40; MIN_DAYS = 3
REGIONS = ["us", "ca", "uk", "eu", "global"]
PER_REGION = {"us": 6, "ca": 5, "uk": 4, "eu": 8, "global": 6}
TOP_N = 8; MAX_PER_SOURCE = 2

def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def wk(d):
    y, w, _ = datetime.date.fromisoformat(d).isocalendar(); return "%04d-W%02d" % (y, w)
def wk_range(key):
    y, w = int(key[:4]), int(key[6:]); mon = datetime.date.fromisocalendar(y, w, 1); return mon, mon + datetime.timedelta(days=6)
def slim(x):
    lang = x.get("lang") or "es"; h = x.get("headline") or {}
    t = (h.get(lang) or h.get("es") or h.get("en") or "").strip()
    if not t or not x.get("url") or not re.match(r"^\d{4}-\d\d-\d\d$", x.get("date", "")): return None
    o = {"id": x["id"], "date": x["date"], "region": x.get("region") or "global", "topic": x.get("topic") or "", "topics": x.get("topics") or [],
         "products": x.get("products") or [], "source": x.get("source") or "", "lang": lang, "h": t[:300], "url": x["url"], "rel": int(x.get("relevance") or 0)}
    return o

KEEP_REL = 54   # relevancia a partir de la cual se guarda el registro completo (el resto solo cuenta: id, fecha, region, tema, productos, medio)
FULL_REGIONS = ("us", "ca", "uk")  # estas regiones tienen pocas noticias: se guardan todas completas para poder destacar titulares de ellas
def keep_full(i): return i["rel"] >= KEEP_REL or i["region"] in FULL_REGIONS
def lite(i): return [i["id"], i["date"], i["region"], i["topic"], i["products"], i["source"]]
def unlite(r): return {"id": r[0], "date": r[1], "region": r[2], "topic": r[3], "products": r[4], "source": r[5]}

def archive(doc):
    """Mezcla un news.json (doc) en los archivos semanales. Devuelve las semanas tocadas.
    Cobertura: solo se puede asegurar que una semana esta completa desde el dia en que empezamos a archivarla (dia del primer news.json que la contiene)."""
    items = [s for s in (slim(x) for x in doc.get("items", [])) if s]
    if not items: return set()
    snap = (doc.get("generatedAt") or now_iso())[:10]
    ARCH.mkdir(parents=True, exist_ok=True); touched = set(); by = {}
    for i in items: by.setdefault(wk(i["date"]), []).append(i)
    for key, rows in by.items():
        f = ARCH / (key + ".json"); mon, sun = wk_range(key)
        if snap > sun.isoformat() and not f.exists(): continue   # semana ya terminada antes de empezar a archivar: no hay cobertura completa de ningun dia, no se guarda
        cur = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {"schemaVersion": 1, "week": key, "from": mon.isoformat(), "to": sun.isoformat(), "coverage": None, "items": [], "rest": []}
        full = {i["id"]: i for i in cur["items"]}; rest = {r[0]: r for r in cur["rest"]}
        for r in rows:
            if keep_full(r):
                o = full.get(r["id"])
                if o is None or r["rel"] > o["rel"]: full[r["id"]] = r
                rest.pop(r["id"], None)
            elif r["id"] not in full and r["id"] not in rest: rest[r["id"]] = lite(r)
        cov = max(mon.isoformat(), snap)
        if cur["coverage"] and cur["coverage"].get("from") and cur["coverage"]["from"] < cov: cov = cur["coverage"]["from"]
        cur["coverage"] = {"from": cov}
        cur["items"] = sorted(full.values(), key=lambda i: (i["date"], i["id"])); cur["rest"] = sorted(rest.values(), key=lambda r: (r[1], r[0]))
        cur["generatedAt"] = max(cur.get("generatedAt") or "", doc.get("generatedAt") or now_iso())
        f.write_text(json.dumps(cur, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); touched.add(key)
    return touched

def norm(t): return re.sub(r"[^a-z0-9]+", " ", t.lower())[:48].strip()
def pick(items, n, per_source=MAX_PER_SOURCE):
    out, seen, cnt = [], set(), {}
    for i in sorted(items, key=lambda i: (-i["rel"], i["date"], i["id"])):
        k = norm(i["h"])
        if k in seen or cnt.get(i["source"], 0) >= per_source: continue
        seen.add(k); cnt[i["source"]] = cnt.get(i["source"], 0) + 1; out.append(i)
        if len(out) >= n: break
    return [{k: i[k] for k in ("date", "region", "topic", "products", "source", "lang", "h", "url")} for i in out]

def build(key, today):
    a = json.loads((ARCH / (key + ".json")).read_text(encoding="utf-8")); mon, sun = wk_range(key)
    cov = a["coverage"]["from"]; fullItems = [i for i in a["items"] if i["date"] >= cov]
    items = fullItems + [unlite(r) for r in a["rest"] if r[1] >= cov]   # items: todas las noticias para contar; fullItems: las que tienen enlace y titular
    days = sorted({i["date"] for i in items})
    covDays = (min(sun, today) - datetime.date.fromisoformat(cov)).days + 1
    if len(items) < MIN_ITEMS or covDays < MIN_DAYS: return None
    cnt = lambda f: dict(sorted(((k, sum(1 for i in items if f(i) == k)) for k in {f(i) for i in items} if k), key=lambda kv: (-kv[1], kv[0])))
    prods = {}
    for i in items:
        for p in set(i["products"]): prods[p] = prods.get(p, 0) + 1
    return {"schemaVersion": 1, "week": key, "from": mon.isoformat(), "to": sun.isoformat(), "generatedAt": now_iso(), "complete": today > sun,
            "coverage": {"from": cov, "days": covDays},
            "totals": {"items": len(items), "sources": len({i["source"] for i in items}),
                       "byRegion": cnt(lambda i: i["region"]), "byTopic": cnt(lambda i: i["topic"]),
                       "byProduct": dict(sorted(prods.items(), key=lambda kv: (-kv[1], kv[0]))[:10]),
                       "byDay": {d: sum(1 for i in items if i["date"] == d) for d in days}},
            "top": pick(fullItems, TOP_N),
            "byRegion": {r: pick([i for i in fullItems if i["region"] == r], PER_REGION[r]) for r in REGIONS if any(i["region"] == r for i in fullItems)}}

def build_all(touched=None):
    today = datetime.datetime.now(datetime.timezone.utc).date(); OUT.mkdir(parents=True, exist_ok=True); rows = []
    for f in sorted(ARCH.glob("*.json")):
        key = f.stem; p = OUT / (key + ".json")
        if touched is not None and key not in touched and p.exists():
            d = json.loads(p.read_text(encoding="utf-8"))
        else:
            d = build(key, today)
            if d is None:
                if p.exists(): p.unlink()
                continue
            if p.exists():  # no reescribir si solo cambia generatedAt
                old = json.loads(p.read_text(encoding="utf-8")); o2 = dict(old); n2 = dict(d); o2.pop("generatedAt", None); n2.pop("generatedAt", None)
                if o2 == n2: d = old
            p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        rows.append({"week": d["week"], "from": d["from"], "to": d["to"], "complete": d["complete"], "items": d["totals"]["items"], "sources": d["totals"]["sources"], "coverageFrom": d["coverage"]["from"]})
    rows.sort(key=lambda r: r["week"], reverse=True)
    idx = OUT / "index.json"; new = {"schemaVersion": 1, "weeks": rows}
    if idx.exists():
        old = json.loads(idx.read_text(encoding="utf-8")); g = old.pop("generatedAt", None)
        if old == new: return rows
    new["generatedAt"] = now_iso(); idx.write_text(json.dumps(new, ensure_ascii=False, indent=1), encoding="utf-8")
    return rows

def backfill_git():
    shas = subprocess.run(["git", "log", "--format=%H", "--reverse", "--", "data/news.json"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    n = 0
    for sha in shas:
        r = subprocess.run(["git", "show", sha + ":data/news.json"], cwd=ROOT, capture_output=True, text=True)
        if r.returncode: continue
        try: archive(json.loads(r.stdout))
        except Exception as e: print("aviso", sha[:8], e)
        n += 1
    print("backfill: %d versiones de news.json" % n)

def main():
    if "--backfill-git" in sys.argv: backfill_git()
    touched = None
    if "--build-only" not in sys.argv and "--backfill-git" not in sys.argv:
        touched = archive(json.loads((DATA / "news.json").read_text(encoding="utf-8")))
    rows = build_all()
    print("semanas publicadas:", ", ".join("%s (%d)" % (r["week"], r["items"]) for r in rows) or "ninguna")
if __name__ == "__main__": main()

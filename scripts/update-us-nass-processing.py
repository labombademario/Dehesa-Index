#!/usr/bin/env python3
"""Transformacion de granos y oleaginosas en EE. UU. (USDA NASS) -> data/us-nass-processing-stats.json (formato *-stats.json) + libro data/us-nass-processing-ledger.json.
Dos informes mensuales en texto, publicados en ESMIS (Biblioteca Agricola Nacional):
  Fats and Oils: Oilseed Crushings, Production, Consumption and Stocks   soja (trituracion, aceite, harina, existencias), colza/canola, algodon, otras oleaginosas y grasas animales
  Grain Crushings and Co-Products Production                              maiz consumido para alcohol/etanol y coproductos (DDGS, aceite de maiz, gluten...)
Cada informe trae TRES columnas (el mes, el mes anterior ya revisado y el mismo mes del ano anterior). Los informes se leen en orden cronologico y el valor mas reciente
de cada mes sustituye al anterior (NASS revisa al mes siguiente); asi el libro crece con cada ejecucion y la historia se acumula sin inventar nada hacia atras.
(D) = dato retenido por confidencialidad -> hueco. "-" = cero, tal como indica el propio informe. No se leen las tablas regionales.
Uso: update-us-nass-processing.py [--local DIR] [--out DIR]"""
import json, re, sys
from collections import OrderedDict, defaultdict
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
ES = "https://esmis.nal.usda.gov"
PUBS = {"fo": ("fats-and-oils-oilseed-crushings-production-consumption-and-stocks", "cafo"), "gc": ("grain-crushings-and-co-products-production", "cagc")}
SG = "USDA NASS, Fats and Oils / Grain Crushings and Co-Products (ESMIS)"
MONTHS = {m: i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}
SUBGROUPS = {"Crush", "Refine", "Consumption", "Stocks"}
UNITS = {"tons": "short tons", "1,000 pounds": "thousand lb", "1,000 bushels": "thousand bushels", "pounds": "lb", "million pounds": "million lb"}
MAX_PAGES = 6
def month_key(s):
    m = re.match(r"^([A-Z][a-z]+)\s+(\d{4})$", s.strip())
    return "%s-%02d" % (m.group(2), MONTHS[m.group(1)]) if m and m.group(1) in MONTHS else None
def parse(text, code):
    """Texto de un informe -> (mes de referencia, filas {t, com, sub, label, unit, vals:{AAAA-MM: valor|None}}). Solo tablas 'United States'."""
    lines = text.replace("\r", "").split("\n")
    rows = []; ref = None
    tbl = None; cols = None; com = None; sub = None; tunit = None
    for i, ln in enumerate(lines):
        t = re.match(r"^(.+?) - United States: ([A-Z][a-z]+ \d{4}) with\b", ln)
        if t:
            tbl = t.group(1).strip(); cols = None; com = None; sub = None; tunit = None
            ref = ref or month_key(t.group(2)); continue
        if re.match(r"^(.+?) - Regional\b|^Statistical Methodology|^USDA National Agricultural Statistics Service", ln):
            tbl = None; cols = None; continue
        if tbl is None or ":" not in ln: continue
        left, right = ln.split(":", 1)
        mh = re.findall(r"[A-Z][a-z]+ \d{4}", right)
        if len(mh) == 3 and re.search(r"Item|Purpose|Co-products", left):
            cols = [month_key(x) for x in mh]
            if None in cols: cols = None
            continue
        if cols is None: continue
        if left.strip() == "":
            u = right.strip().strip(":").strip()
            if u and not re.search(r"\d{3}", u.replace("1,000", "")): tunit = u
            continue
        if right.strip(" :") == "":
            nm = left.strip()
            if nm in SUBGROUPS: sub = nm
            else: com = nm; sub = None
            continue
        vals = right.split()
        if len(vals) != 3: continue
        indent = len(left) - len(left.lstrip())
        lab = left.strip(); unit = None
        m = re.match(r"^(.*?)\.{2,}\s*(.*)$", lab)
        if m: lab, unit = m.group(1).strip(), (m.group(2).strip() or None)
        else: lab = lab.rstrip(".").strip()
        unit = unit or tunit
        parsed = OrderedDict()
        for c, v in zip(cols, vals):
            v = v.strip()
            if v == "-": parsed[c] = 0.0
            else: parsed[c] = U.fnum(v)
        rows.append({"t": tbl, "com": com, "sub": sub, "label": lab, "unit": unit, "ind": indent, "vals": parsed})
    if not rows or not ref: raise ValueError("%s: no se reconocio ninguna tabla" % code)
    return ref, rows
def key(r):
    return "|".join([r["t"], r["com"] or "", r["sub"] or "", r["label"], r["unit"] or ""])
def release_urls(pub):
    slug, code = PUBS[pub]
    found = OrderedDict()
    for p in range(MAX_PAGES):
        try: h = U.get("%s/publication/%s?page=%d" % (ES, slug, p), timeout=90).decode("utf-8", "replace")
        except Exception as e: U.log("pagina %d no legible: %s" % (p, repr(e)[:80])); break
        n0 = len(found)
        for m in re.finditer(r'href="([^"]*release-files/(\d+)/(%s(\d{2})(\d{2}))\.txt)"' % code, h):
            href, rid, nm, mm, yy = m.groups()
            found.setdefault(rid, (urljoin(href), nm, "20%s-%s" % (yy, mm)))
        if len(found) == n0 and p > 0: break
    return found
def urljoin(h): return h if h.startswith("http") else ES + h
def load_ledger(path):
    if path.exists(): return json.loads(path.read_text(encoding="utf-8"))
    return {"done": [], "series": {}}
def main():
    local, outdir = U.parse_args()
    d = outdir or ROOT / "data"
    out = d / "us-nass-processing-stats.json"; led_path = d / "us-nass-processing-ledger.json"
    rc = 0
    try:
        ledger = load_ledger(led_path); done = set(ledger["done"]); news = []
        for pub in PUBS:
            urls = release_urls(pub) if local is None else OrderedDict((p.stem, (str(p), p.stem, "20%s-%s" % (p.stem[-2:], p.stem[4:6]))) for p in sorted(local.glob(PUBS[pub][1] + "????.txt")))
            if not urls: raise ValueError("sin informes para " + pub)
            for rid, (url, nm, ym) in urls.items(): news.append((ym, nm, rid, url, pub))
        news.sort()                      # cronologico: el informe mas reciente sustituye a los anteriores
        latest = {p: max(x[0] for x in news if x[4] == p) for p in PUBS}
        n_read = 0
        for ym, nm, rid, url, pub in news:
            tag = pub + ":" + rid
            if tag in done and ym != latest[pub]: continue          # el ultimo se relee siempre (puede salir corregido)
            try:
                txt = (open(url, encoding="utf-8", errors="replace").read() if local is not None else U.get(url).decode("utf-8", "replace"))
                ref, rows = parse(txt, nm)
            except Exception as e:
                U.log("informe %s no leido: %s" % (nm, repr(e)[:100])); continue
            for r in rows:
                s = ledger["series"].setdefault(key(r), {"t": r["t"], "com": r["com"], "sub": r["sub"], "label": r["label"], "unit": r["unit"], "m": {}})
                for c, v in r["vals"].items():
                    if v is not None: s["m"][c] = v
                    elif c == ref: s["m"].pop(c, None)          # (D) en el mes de referencia: hueco, no se arrastra un valor viejo
            done.add(tag); n_read += 1
        ledger["done"] = sorted(done)
        U.log("informes leidos esta vez: %d; en el libro: %d; series: %d" % (n_read, len(done), len(ledger["series"])))
        ser = []
        for k, s in sorted(ledger["series"].items()):
            if not s["m"]: continue
            u = UNITS.get(s["unit"] or "", s["unit"] or "")
            if not u: continue
            lab = s["label"]; com = s["com"]; t = s["t"]
            who = com or ("Soybeans" if t.startswith("Soybean") else "")
            low = (s["sub"] or "").lower() + " " + lab.lower()
            g = "stocks" if ("stock" in low or "on hand" in low) else "production"
            title = "%s: %s%s" % (who or t, lab, " (" + s["sub"].lower() + ")" if s["sub"] and s["sub"] not in lab else "")
            sid = "us-nass-proc-%s-%s-%s" % (U.slug(t, 18), U.slug(who + " " + (s["sub"] or "") + " " + lab, 60), "m")
            m = U.mk_series(sid, g, "%s (NASS monthly report)" % title, u, "monthly", list(s["m"].items()), SG, min_points=3, max_age_years=1)
            if m: ser.append(m)
        ids = [s["id"] for s in ser]
        if len(ids) != len(set(ids)): raise ValueError("ids repetidos")
        need = ["Soybeans crushed", "Fuel alcohol"]
        for n in need:
            if not any(n.lower().replace(" ", "-") in i for i in ids): raise ValueError("falta la serie de " + n)
        sc = next(s for s in ser if "soybeans-crushed" in s["id"])
        if not 3e6 < sc["latest"] < 9e6: raise ValueError("trituracion de soja fuera de rango: %s" % sc["latest"])
        lastm = sc["latestPeriod"]
        import datetime as dt
        today = dt.date.today(); age = (today.year * 12 + today.month) - (int(lastm[:4]) * 12 + int(lastm[5:7]))
        if age > 5: raise ValueError("la ultima trituracion es de %s" % lastm)
        if len(ser) < 30: raise ValueError("solo %d series" % len(ser))
        U.write_json(out, U.stats_doc("USDA National Agricultural Statistics Service, Fats and Oils and Grain Crushings reports (ESMIS)", ES + "/publication/" + PUBS["fo"][0], "US Government work (public domain); credit: USDA NASS", ser))
        U.write_json(led_path, ledger)
        U.log("OK: %d series, soja triturada hasta %s" % (len(ser), lastm))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "us-nass-processing-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

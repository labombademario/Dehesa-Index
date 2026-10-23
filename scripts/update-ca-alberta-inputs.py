#!/usr/bin/env python3
"""Precios de insumos agrarios de Alberta (Alberta Agriculture and Irrigation, "Alberta Farm Input Prices") -> data/ca-alberta-inputs-stats.json (formato *-stats.json, pais CA).
Open Government Licence - Alberta. Cada mes se publica un PDF de una pagina con la media provincial (encuesta de la primera semana del mes, dolares canadienses): fertilizantes, piensos y forrajes,
semillas, fitosanitarios, combustibles, energia, materiales, maquinaria y mano de obra. Se leen los PDF de 2022 en adelante (los anteriores son imagenes sin texto) con pdfplumber; de cada PDF solo la columna del mes actual.
Las fichas se descubren por la API CKAN de open.alberta.ca (titulo "Alberta farm input prices [AAAA]"). Un PDF ilegible se salta y se registra; si salen pocos meses el fichero anterior se conserva.
Nota: cuando Alberta cambia la especificacion de un producto lo avisa con asteriscos; el texto del producto se mantiene, asi que la serie puede traer un salto de especificacion.
Uso: update-ca-alberta-inputs.py [--local DIR] [--out DIR]"""
import io, json, re, sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
import usda_lib as U
ROOT = U.ROOT
CKAN = "https://open.alberta.ca/api/3/action/package_search?q=%22Alberta+farm+input+prices%22&rows=60"
PAGE = "https://open.alberta.ca/publications/0704-917x"
SRC = "Alberta Agriculture and Irrigation, Alberta Farm Input Prices"
FIRST_YEAR = 2022
MONTHS = {m: i + 1 for i, m in enumerate(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
NUM = r"\d{1,3}(?:,\d{3})*\.\d{2}"
LINE = re.compile(r"^(?P<name>\S.*?)(?:\s+\*+)?\s+(?P<a>[-\d,.]+)\s+(?P<b>[-\d,.]+)\s+(?P<c>-|%s)$" % NUM)
def pdf_text(b):
    import pdfplumber
    with pdfplumber.open(io.BytesIO(b)) as p: return "\n".join((pg.extract_text() or "") for pg in p.pages)
def parse_text(text):
    """-> (AAAA-MM, {producto: valor del mes actual}). Las lineas con '-' (sin dato) o con cifras mal escritas en el mes actual se saltan."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    hdr = next((l for l in lines if re.search(r"Dollars", l)), None)
    if not hdr: raise ValueError("sin cabecera de precios")
    m = re.search(r"\b([A-Z][a-z]{2})\s+(\d{4})\s*$", hdr)
    if not m or m.group(1).lower() not in MONTHS: raise ValueError("cabecera sin mes: " + hdr[:80])
    per = "%s-%02d" % (m.group(2), MONTHS[m.group(1).lower()]); out = {}
    for l in lines[lines.index(hdr) + 1:]:
        mm = LINE.match(l)
        if not mm or mm.group("c") == "-": continue
        name = re.sub(r"\s+", " ", mm.group("name")).strip(" *")
        out[name] = float(mm.group("c").replace(",", ""))
    return per, out
def unit_of(name):
    n = name.lower().rstrip(". ")
    for pat, u in ((r"100 kwh$", "CAD/100 kWh"), (r"\bgj$", "CAD/GJ"), (r"100 litres$", "CAD/100 L"), (r"\blitre$", "CAD/L"), (r"\btonne$", "CAD/tonne"), (r"\bton$", "CAD/short ton"), (r"\bbushel$", "CAD/bushel"),
                   (r"per month$", "CAD/month"), (r"per hour$", "CAD/hour"), (r"\beach$", "CAD each"), (r"\bbagged, \d+ kg$", "CAD/bag"), (r"\bkg$", "CAD/bag")):
        if re.search(pat, n): return u
    return "CAD"
def group_of(name):
    n = name.lower()
    if n.startswith("fertilizer"): return "inputs_f"
    if re.search(r"ration|supplement|replacer|feed |hay,|mineral|complete feed", n): return "inputs_a"
    return "inputs"
def build(months):
    """months = {AAAA-MM: {producto: valor}} -> [serie]."""
    by = {}
    for per, d in months.items():
        for name, v in d.items(): by.setdefault(name, []).append((per, v))
    ids = {}; out = []
    for name, pts in sorted(by.items()):
        sid = "ca-ab-inputs-%s-m" % U.slug(name, 70)
        if sid in ids and ids[sid] != name: raise ValueError("id repetido: " + sid)
        ids[sid] = name
        s = U.mk_series(sid, group_of(name), "Alberta farm input prices: %s" % name, unit_of(name), "monthly", pts, SRC, min_points=12, max_age_years=1)
        if s: out.append(s)
    return out
def pdf_links():
    j = json.loads(U.get(CKAN).decode("utf-8")); links = []
    for r in j["result"]["results"]:
        m = re.search(r"Alberta farm input prices\s*\[(\d{4})\]", r.get("title", ""), re.I)
        if not m or int(m.group(1)) < FIRST_YEAR: continue
        for res in r.get("resources", []):
            u = res.get("url", "")
            if u.lower().endswith(".pdf") and "farm-input-prices" in u: links.append(u)
    return sorted(set(links))
def main():
    local, outdir = U.parse_args()
    out = (outdir or ROOT / "data") / "ca-alberta-inputs-stats.json"
    rc = 0
    try:
        links = pdf_links(); U.log("PDF:", len(links)); months = {}; bad = 0
        for u in links:
            try:
                per, d = parse_text(pdf_text(U.get(u, timeout=120)))
                if len(d) < 30: raise ValueError("solo %d productos" % len(d))
                months[per] = d
            except Exception as e:
                bad += 1; U.log("PDF saltado %s: %r" % (u.rsplit("/", 1)[-1], e))
        U.log("meses leidos:", len(months), "saltados:", bad, "rango:", min(months) if months else "-", max(months) if months else "-")
        if len(months) < 36: raise ValueError("solo %d meses (se esperan >=36)" % len(months))
        ser = build(months)
        ids = {s["id"] for s in ser}
        if not any("urea" in i for i in ids) or not any("diesel" in i for i in ids): raise ValueError("faltan urea o diesel")
        doc = U.stats_doc(SRC, PAGE, "Open Government Licence - Alberta", ser)
        doc["countries"] = {"CA": dict(doc["countries"]["US"], name="Canada")}
        U.write_json(out, doc); U.log("OK: %d series, %d meses" % (len(ser), len(months)))
    except Exception as e:
        U.log("FALLO:", repr(e)[:300]); rc = 1
    if outdir is None: U.write_log(ROOT / "data" / "ca-alberta-inputs-log.txt")
    sys.exit(rc)
if __name__ == "__main__": main()

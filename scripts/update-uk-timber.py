#!/usr/bin/env python3
"""Indices de precios de la madera del Reino Unido (Forest Research, Timber Price Indices, semestral) -> data/uk-timber-prices.json
Sustituye al valor fijo que habia en js/data.js. Se lee el ultimo boletin PDF enlazado en la pagina de Forest Research y de el las tablas 2 (venta en pie de
coniferas), 4 (rollos de aserrio de coniferas) y 7 (madera pequeña), precio medio NOMINAL en £ por m3 con corteza, «year to» marzo y septiembre desde 2021.
Los boletines salen en mayo y noviembre; si el ultimo enlazado no se puede leer, el fichero no se toca. Licencia: OGL v3.
Uso: python3 scripts/update-uk-timber.py"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
import pdfplumber
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "uk-timber-prices.json"
PAGE = "https://www.forestresearch.gov.uk/tools-and-resources/statistics/statistics-by-topic/timber-statistics/timber-price-indices/"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
MON = {"Mar": "03", "Sep": "09"}
def http(url, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r: return r.read()
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError("%s: %s" % (url, last))
def release_key(u):
    """cdn.../AAAA/MM/TPI....pdf -> (AAAA, MM): la fecha de subida sirve para ordenar los boletines."""
    m = re.search(r"/(\d{4})/(\d{2})/", u); return (int(m.group(1)), int(m.group(2))) if m else (0, 0)
def table(text, n):
    """Filas «31-Mar-21 real nominal idx idx» de la tabla n -> {'2021-03': nominal}."""
    i = text.find("Table %d: Average prices" % n)
    if i < 0: raise RuntimeError("tabla %d no encontrada" % n)
    out = {}
    for line in text[i:i + 2500].splitlines():
        m = re.match(r"\s*\d{2}-(Mar|Sep)-(\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$", line)
        if m: out["20%s-%s" % (m.group(2), MON[m.group(1)])] = float(m.group(4))
        elif out and line.strip().startswith("Note"): break
    if len(out) < 6: raise RuntimeError("tabla %d con %d filas" % (n, len(out)))
    return out
def main():
    html = http(PAGE).decode("utf-8", "replace")
    links = sorted({u for u in re.findall(r"https://cdn\.forestresearch\.gov\.uk/\d{4}/\d{2}/[^\"'\s]*TPI[^\"'\s]*\.pdf", html, re.I)}, key=lambda u: (release_key(u), u))
    if not links: print("ERROR: sin boletines enlazados"); return 1
    url = links[-1]
    tmp = ROOT / ".uk-tpi.pdf"; tmp.write_bytes(http(url))
    try:
        with pdfplumber.open(tmp) as pdf: text = "\n".join((p.extract_text(layout=True) or "") for p in pdf.pages)
    finally: tmp.unlink()
    m = re.search(r"Data to (\w+ \d{4})", text); upto = m.group(1) if m else None
    series = []
    for sid, n, label in (("uk-standing-conifer", 2, "Coniferous standing sales: average price"), ("uk-sawlog-softwood", 4, "Softwood sawlogs: average price"), ("uk-small-roundwood", 7, "Small roundwood: average price")):
        t = table(text, n); ps = sorted(t)
        series.append({"id": sid, "label": label, "unit": "GBP/m3 overbark (nominal)", "freq": "H", "periods": ps, "values": [t[p] for p in ps]})
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "dataTo": upto, "bulletin": url,
           "source": {"name": "Forest Research (UK), Timber Price Indices", "url": PAGE, "license": "Open Government Licence v3.0"},
           "note": "Precio medio nominal de los doce meses terminados en marzo o septiembre (Gran Bretaña). Solo el boletin mas reciente enlazado en la pagina de Forest Research.", "series": series}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("uk-timber-prices.json", upto, url, [(s["id"], s["periods"][-1], s["values"][-1]) for s in series]); return 0
if __name__ == "__main__": sys.exit(main())

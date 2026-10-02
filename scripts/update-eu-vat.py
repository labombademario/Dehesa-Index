#!/usr/bin/env python3
"""Tipos de IVA de la UE-27 desde TEDB (Taxes in Europe Database, Comision Europea) -> data/eu-vat.json.
Servicio SOAP publico sin clave: https://ec.europa.eu/taxation_customs/tedb/ws/ (VatRetrievalService.wsdl).
Guarda: tipo general, tipos reducidos/superreducidos/exento que TEDB asocia a categorias agricolas y, para los cultivos de la calculadora
y los insumos principales, el tipo que TEDB asocia a su codigo NC. Si TEDB no asocia el producto a un codigo NC (p. ej. el 4 % espanol)
NO se adivina: el campo queda en null y la calculadora pide elegir el tipo.
Uso: python3 scripts/update-eu-vat.py [--fixture ruta.xml[.gz]] [--out ruta]"""
import datetime, gzip, json, re, sys, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "eu-vat.json"
URL = "https://ec.europa.eu/taxation_customs/tedb/ws/"
ACTION = "urn:ec.europa.eu:taxud:tedb:services:v1:VatRetrievalService/RetrieveVatRates"
STATES = "AT BE BG HR CY CZ DK EE FI FR DE EL HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split()
ISO = {"EL": "GR"}  # TEDB usa EL; el resto de la web usa GR
CROPS = {"trigo": "1001", "cebada": "1003", "avena": "1004", "maiz": "1005", "arroz": "1006", "soja": "1201", "colza": "1205"}
INPUTS = {"semilla": "1209", "fertilizante": "3102", "fitosanitario": "3808", "gasoleo": "2710"}
AGRI = re.compile(r"FOODSTUFFS|AGRICULTURAL|FERTIL|PLANT|SUPERRED|CERTAIN_AG|PESTI")
REGIONAL = re.compile(r"Canary|Azores|Madeira|Corsica|Mount Athos|Heligoland|Livigno|Campione|Ceuta|Melilla|Aland|Åland", re.I)
def _ln(t): return t.rsplit("}", 1)[-1]
def child(e, name):
    for c in e:
        if _ln(c.tag) == name: return c
    return None
def text(e, name, d=""):
    c = child(e, name); return (c.text or d) if c is not None else d
def codes(e):
    c = child(e, "cnCodes"); out = []
    if c is None: return out
    for k in c:
        v = text(k, "value").replace(" ", "")
        if v: out.append(v)
    return out
def parse(xml):
    root = ET.fromstring(xml); res = []
    for e in root.iter():
        if _ln(e.tag) != "vatRateResults": continue
        rt = child(e, "rate"); cat = child(e, "category"); v = text(rt, "value")
        res.append({"ms": text(e, "memberState"), "kind": text(e, "type"), "rtype": text(rt, "type"), "value": float(v) if v != "" else None,
                    "cat": text(cat, "identifier") if cat is not None else "", "cn": codes(e), "comment": text(e, "comment"), "on": text(e, "situationOn")[:10]})
    return res
def label(r):
    if r["rtype"] in ("EXEMPTED",): return "exempt"
    return r["value"]
def best(rows, probe):
    """Tipo TEDB para un codigo NC: entradas cuyo codigo es el propio o uno mas general; gana la mas especifica. None si hay duda."""
    hits = []
    for r in rows:
        for c in r["cn"]:
            if probe.startswith(c): hits.append((len(c), label(r)))
    if not hits: return None
    top = max(h[0] for h in hits); vals = sorted({h[1] for h in hits if h[0] == top}, key=str)
    return vals[0] if len(vals) == 1 else None
def build(res):
    by = {}
    for r in res: by.setdefault(r["ms"], []).append(r)
    if set(by) != set(STATES): raise ValueError("faltan paises: %s" % sorted(set(STATES) - set(by)))
    out = {}; on = ""
    for ms in STATES:
        rows = by[ms]
        std = [r["value"] for r in rows if r["kind"] == "STANDARD" and r["rtype"] == "DEFAULT" and r["value"] is not None and not REGIONAL.search(r["comment"][:200])]
        if not std: raise ValueError("%s: sin tipo general" % ms)
        reduced = {}
        for r in rows:
            if r["kind"] == "STANDARD" or not AGRI.search(r["cat"]): continue
            if r["rtype"] in ("NOT_APPLICABLE", "OUT_OF_SCOPE"): continue
            k = label(r)
            if k is None: continue
            reduced.setdefault(str(k), {"rate": k, "type": r["rtype"], "cats": set()})["cats"].add(r["cat"])
            on = max(on, r["on"])
        code_rows = [r for r in rows if r["kind"] != "STANDARD" and r["cn"] and r["rtype"] not in ("NOT_APPLICABLE", "OUT_OF_SCOPE")]
        out[ISO.get(ms, ms)] = {"standard": max(std),
            "reduced": sorted([{"rate": v["rate"], "type": v["type"], "categories": sorted(v["cats"])} for v in reduced.values()], key=lambda x: (x["rate"] == "exempt", x["rate"] if x["rate"] != "exempt" else 0)),
            "crops": {k: best(code_rows, p) for k, p in CROPS.items()}, "inputs": {k: best(code_rows, p) for k, p in INPUTS.items()}}
    return out, on
def main():
    a = sys.argv[1:]; outp = OUT
    if "--out" in a: i = a.index("--out"); outp = Path(a[i + 1]); del a[i:i + 2]
    try:
        if a[:1] == ["--fixture"]:
            p = Path(a[1]); raw = gzip.open(p).read() if p.suffix == ".gz" else p.read_bytes()
        else:
            today = datetime.date.today().isoformat()
            body = ('<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="urn:ec.europa.eu:taxud:tedb:services:v1:IVatRetrievalService" xmlns:typ="urn:ec.europa.eu:taxud:tedb:services:v1:IVatRetrievalService:types"><soapenv:Header/><soapenv:Body><v1:retrieveVatRatesReqMsg><typ:memberStates>'
                    + "".join("<typ:isoCode>%s</typ:isoCode>" % s for s in STATES) + "</typ:memberStates><typ:situationOn>%s</typ:situationOn></v1:retrieveVatRatesReqMsg></soapenv:Body></soapenv:Envelope>" % today).encode()
            req = urllib.request.Request(URL, data=body, headers={"Content-Type": "text/xml;charset=UTF-8", "SOAPAction": ACTION, "User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"})
            with urllib.request.urlopen(req, timeout=180) as r: raw = r.read()
            if "--save-raw" in sys.argv: pass
        countries, on = build(parse(raw))
    except Exception as e: print("FALLO:", e); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "situationOn": on,
           "source": {"name": "European Commission, Taxes in Europe Database (TEDB)", "url": "https://ec.europa.eu/taxation_customs/tedb/", "license": "Datos de TEDB aportados por los Estados miembros; reutilizacion segun la politica de la Comision (Decision 2011/833/UE)"},
           "note": "Los tipos los comunican los Estados miembros. Un tipo null significa que TEDB no lo asocia a un codigo NC; no es lo mismo que el tipo general.", "countries": countries}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, len(countries), "paises, situacion", on); return 0
if __name__ == "__main__": sys.exit(main())

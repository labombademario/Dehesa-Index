#!/usr/bin/env python3
"""Emisiones de gases de efecto invernadero de la agricultura espanola, 1990-ultimo ano -> data/es-ghg-agri.json
Fuente: Inventario Nacional de Emisiones (Sistema Espanol de Inventario, MITECO), conjunto «Emisiones nacionales de gases de efecto invernadero
(GEI)» del catalogo de datos abiertos del MITECO, CSV, licencia CC BY 4.0. Cifras en kilotoneladas de CO2 equivalente, tal como las publica el
inventario. Se usan solo las filas de inventario de nivel mas bajo (las agregaciones las hace Dehesa Index sumando, para no contar dos veces).
Agricultura = sector 3 del IPCC (fermentacion enterica, gestion del estiercol, arroz, suelos agricolas, quema de rastrojos, encalado, urea y otros
fertilizantes con carbono). Aparte, el combustible de la maquinaria y las instalaciones agrarias y forestales (1A4ci y 1A4cii; la pesca, 1A4ciii,
no entra), que el inventario cuenta en el sector de la energia. Total nacional = todos los sectores sin el uso de la tierra (sector 4, LULUCF).
Uso: python3 scripts/update-es-ghg-agri.py"""
import csv, datetime, io, json, re, ssl, subprocess, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "es-ghg-agri.json"
HOST = "catalogo.datosabiertos.miteco.gob.es"
API = "https://%s/catalogo/api/3/action/package_show?id=c1f5ae00-18d5-478d-aab1-685ae5506857" % HOST
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
def context():
    """El servidor no envia el certificado intermedio (FNMT): se descarga el que indica el propio certificado (AIA) y se verifica con el."""
    ctx = ssl.create_default_context()
    try:
        pem = ssl.get_server_certificate((HOST, 443))
        txt = subprocess.run(["openssl", "x509", "-noout", "-text"], input=pem.encode(), capture_output=True).stdout.decode()
        for u in re.findall(r"CA Issuers - URI:(\S+)", txt):
            der = urllib.request.urlopen(u, timeout=60).read()
            p = subprocess.run(["openssl", "x509", "-inform", "PEM" if der.startswith(b"-----") else "DER", "-outform", "PEM"], input=der, capture_output=True).stdout.decode()
            if "BEGIN CERTIFICATE" in p: ctx.load_verify_locations(cadata=p)
    except Exception as e: print("AVISO cadena de certificados:", e)
    return ctx
CTX = None
def get(u, t=180):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t, context=CTX) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def num(s):
    s = (s or "").strip()
    if not s or s in ("-", "NA", "NO", "NE", "IE", "C"): return None
    try: return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)
    except Exception: return None
SPECIES = [("dairy", r"vacuno lechero"), ("beef", r"vacuno no lechero|vacuno(?! lechero)"), ("sheep", r"ovej|ovino"), ("goats", r"caprino|cabra"),
           ("pigs", r"cerdo|porcino"), ("poultry", r"aves|av[ií]col|gallina|pollo|pavo|broiler"), ("other", r".")]
CATS = [("enteric", "3A"), ("manure", "3B"), ("rice", "3C"), ("soils", "3D"), ("burning", "3F"), ("liming", "3G"), ("urea", "3H"), ("otherC", "3I"), ("otherC", "3J")]
def main():
    global CTX
    CTX = context()
    try:
        res = json.loads(get(API))["result"]["resources"]
        data_u = next(r["url"] for r in res if "emisiones-gei" in r["url"] and r["url"].endswith(".csv"))
        code_u = next(r["url"] for r in res if "codigos" in r["url"] and r["url"].endswith(".csv"))
        rows = list(csv.reader(io.StringIO(get(data_u).decode("utf-8-sig", "replace")), delimiter=";"))
        codes = {r[0]: r[7] for r in csv.reader(io.StringIO(get(code_u).decode("utf-8-sig", "replace")), delimiter=";") if len(r) > 8}
    except Exception as e:
        print("FALLO descarga:", e); return 0 if OUT.exists() else 1
    head = rows[0]; yc = [(i, int(h[-4:])) for i, h in enumerate(head) if re.fullmatch(r"CO2EQ\d{4}", h)]
    if len(yc) < 30: print("FALLO cabecera inesperada:", head[:14]); return 0 if OUT.exists() else 1
    years = [y for _, y in yc]; ia = head.index("ACTIVIDAD"); ig = head.index("CONTAMINANTE"); iu = head.index("UNIDAD"); isec = head.index("SECCION")
    inv = [r for r in rows[1:] if len(r) > yc[-1][0] and r[isec].strip().upper() == "INV"]
    def key(r):   # jerarquia IPCC por columnas (sector, division, clase, subclase, actividad, subactividad) hasta la primera vacia
        k = []
        for x in r[1:7]:
            if not x.strip(): break
            k.append(x.strip())
        return tuple(k)
    keys = set(key(r) for r in inv)
    pref = set(k[:n] for k in keys for n in range(1, len(k)))
    leaf = [r for r in inv if key(r) not in pref]   # sin filas agregadas (el codigo de texto no sirve: 1A4ci es prefijo de 1A4cii)
    def blank(): return [0.0] * len(years)
    agri = blank(); nat = blank(); mach = blank(); bycat = {}; bysp = {}; bygas = {}
    for r in leaf:
        a = r[ia].strip(); g = r[ig].strip()
        vals = [num(r[i]) for i, _ in yc]
        for k, v in enumerate(vals):
            if v is None: continue
            if not a.startswith("4"): nat[k] += v
            if a.startswith("3"):
                agri[k] += v
                c = next((n for n, p in CATS if a.startswith(p)), "otherC"); bycat.setdefault(c, blank())[k] += v
                bygas.setdefault(g, blank())[k] += v
                if a.startswith("3A") or a.startswith("3B"):
                    d = (codes.get(a) or "").lower(); s = next(n for n, p in SPECIES if re.search(p, d))
                    bysp.setdefault(s, blank())[k] += v
            if a in ("1A4ci", "1A4cii") or (a.startswith("1A4c") and key(r)[:5] in (("1", "A", "4", "c", "i"), ("1", "A", "4", "c", "ii"))): mach[k] += v
    last = len(years) - 1
    # controles: agricultura espanola ronda 35-45 Mt CO2-eq y el total nacional 250-450 Mt (sin LULUCF)
    if not (25000 < agri[last] < 60000 and 200000 < nat[last] < 500000):
        print("FALLO cifras fuera de lo esperado: agricultura %.0f kt, total %.0f kt" % (agri[last], nat[last])); return 0 if OUT.exists() else 1
    if abs(sum(v[last] for v in bycat.values()) - agri[last]) > 1: print("FALLO las categorias no suman el total"); return 1
    r1 = lambda v: [round(x, 1) for x in v]
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "unit": "kt CO2-eq",
           "source": {"name": "MITECO, Inventario Nacional de Emisiones de gases de efecto invernadero", "url": "https://catalogo.datosabiertos.miteco.gob.es/catalogo/dataset/c1f5ae00-18d5-478d-aab1-685ae5506857", "license": "CC BY 4.0", "file": data_u.rsplit("/", 1)[-1]},
           "years": years, "agriculture": r1(agri), "national": r1(nat), "machinery": r1(mach),
           "byCategory": {k: r1(v) for k, v in sorted(bycat.items())}, "bySpecies": {k: r1(v) for k, v in sorted(bysp.items())}, "byGas": {k: r1(v) for k, v in sorted(bygas.items())}}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("es-ghg-agri.json %d-%d; agricultura %.0f kt (%.1f %% del total %.0f kt); maquinaria %.0f kt; categorias %s; especies %s" % (years[0], years[-1], agri[last], 100 * agri[last] / nat[last], nat[last], mach[last], {k: round(v[last]) for k, v in bycat.items()}, {k: round(v[last]) for k, v in bysp.items()}))
    return 0
if __name__ == "__main__": sys.exit(main())

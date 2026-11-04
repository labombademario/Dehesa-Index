#!/usr/bin/env python3
"""Francia por comuna (~35.000): Recensement agricole 2020 (Agreste, ministère de l'Agriculture) -> data/fr-communes/<REGION>.json (13 regiones metropolitanas) + index.json
Fuente: GeoClip «Cartostat» de Agreste (https://stats.agriculture.gouv.fr/cartostat/), la cartografia oficial del censo agrario por comuna (mismos datos que el conjunto
«Agreste - Données COMMUNALES du recensement agricole» de data.gouv.fr, Licence Ouverte). Se pide cada indicador a GC_indic.php (vista map11 = Francia por comuna 2020); la lista
de comunas viene de GC_refdata.php y los valores de 'distribution.values' en el mismo orden. El secreto estadistico queda como hueco (null): nunca se rellena.
El servidor no manda la cadena de certificados completa: se anade el emisor indicado en el propio certificado (AIA) a un paquete local; la verificacion TLS nunca se desactiva.
Se guardan las comunas con explotaciones (las demas, y las de ultramar, no). Controles (si fallan no se escribe nada): entre 34.000 y 36.000 comunas; para cada indicador la suma de los valores iguala el total que publica GeoClip (distribution.sumth, tolerancia 0,5 + 0,01 %)
cuando es aditivo; explotaciones 2020 entre 380.000 y 430.000; SAU 2020 entre 25 y 30 millones de ha; sin negativos; los porcentajes entre 0 y 100.
Uso: update-fr-communes.py [--out DIRECTORIO]"""
import datetime, json, re, subprocess, sys, tempfile, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
HOST = "stats.agriculture.gouv.fr"
BASE = "https://%s/cartostat/" % HOST
HASH = "&prodhash=285aa024"
# (clave corta, id de GeoClip, tipo: 'n' aditivo con suma de control, 'p' porcentaje/media o 'e' evolucion 2020/2010 en % (puede ser negativa), decimales)
INDS = [("nbexpl20", "nbexpl20", "n", 0), ("sau20", "sau20", "n", 0), ("pbs20", "pbs20", "n", 0), ("ugbtot20", "ugbtot20", "n", 0), ("ugbher20", "ugbher20", "n", 0),
        ("vaclait20", "vaclait20", "n", 0), ("vacnourrices20", "vacnourrices20", "n", 0), ("brebis20", "brebis20", "n", 0), ("chevres20", "chevres20", "n", 0),
        ("porcsengr20", "nbporcsengr20", "n", 0), ("truies20", "nbtruiesreprod20", "n", 0), ("etp20", "etp20", "n", 1), ("cexcoex20", "cexcoex20", "n", 0),
        ("explirrigab20", "explirrigab20", "n", 0), ("nbexplev", "nbexplev", "e", 1), ("sauev20", "sauev20", "e", 1),
        ("partprairie20", "partprairie20_", "p", 1), ("partcereoleopro20", "partcereoleopro20_", "p", 1), ("partvigne20", "partvigne20_", "p", 1),
        ("partcultperm20", "partcultperm20_", "p", 1), ("partirrig20", "partirrig20_", "p", 1), ("cexm40an20", "cexcoexm40an20_", "p", 1), ("cexp55an20", "cexcoexp55an20_", "p", 1)]
# departamento (INSEE) -> region de Dehesa Index (13 regiones metropolitanas; ultramar 971-976 no se incluye)
DEP_REG = {}
for _r, _d in {"ARA": "01 03 07 15 26 38 42 43 63 69 73 74", "BFC": "21 25 39 58 70 71 89 90", "BRE": "22 29 35 56", "CVL": "18 28 36 37 41 45", "COR": "2A 2B",
               "GES": "08 10 51 52 54 55 57 67 68 88", "HDF": "02 59 60 62 80", "IDF": "75 77 78 91 92 93 94 95", "NOR": "14 27 50 61 76",
               "NAQ": "16 17 19 23 24 33 40 47 64 79 86 87", "OCC": "09 11 12 30 31 32 34 46 48 65 66 81 82", "PDL": "44 49 53 72 85", "PAC": "04 05 06 13 83 84"}.items():
    for _x in _d.split(): DEP_REG[_x] = _r
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
BUNDLE = None
def sh(cmd, inp=None, timeout=120):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, input=inp, timeout=timeout)
def make_bundle():
    global BUNDLE
    r = sh("echo | openssl s_client -connect %s:443 -servername %s -showcerts 2>/dev/null" % (HOST, HOST))
    certs = re.findall(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", r.stdout, re.S)
    if not certs: raise RuntimeError("no se obtuvo el certificado de %s" % HOST)
    d = Path(tempfile.mkdtemp()); (d / "leaf.pem").write_text(certs[0])
    t = sh("openssl x509 -in %s -noout -text | grep -i 'CA Issuers'" % (d / "leaf.pem")).stdout
    m = re.search(r"CA Issuers - URI:(\S+)", t)
    if not m: raise RuntimeError("el certificado no indica su emisor (AIA)")
    der = subprocess.run(["curl", "-sS", "-m", "60", "-L", m.group(1)], capture_output=True).stdout
    (d / "iss.der").write_bytes(der)
    sh("openssl x509 -inform DER -in %s -out %s" % (d / "iss.der", d / "iss.pem"))
    ca = ""
    for p in ("/etc/ssl/certs/ca-certificates.crt", "/etc/pki/tls/certs/ca-bundle.crt"):
        if Path(p).exists(): ca = Path(p).read_text(); break
    (d / "bundle.pem").write_text(ca + "\n" + (d / "iss.pem").read_text())
    BUNDLE = str(d / "bundle.pem")
def get(path, tries=4):
    last = None
    for i in range(tries):
        try:
            time.sleep(2)
            r = subprocess.run(["curl", "-sS", "--compressed", "-m", "180", "--cacert", BUNDLE, "-A", "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", BASE + path],
                               capture_output=True, text=True)
            if r.returncode == 0 and r.stdout.lstrip().startswith("{"): return json.loads(r.stdout)
            last = (r.stderr or r.stdout[:120]).strip()[:160]
        except Exception as e: last = str(e)
        time.sleep(15 * (i + 1))
    raise RuntimeError("%s -> %s" % (path[:90], last))
def dep_of(code):
    return code[:3] if code[:2] == "97" else code[:2]
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "fr-communes"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "fr-communes-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    make_bundle()
    li = get("GC_listIndics.php?lang=fr&obs=main" + HASH)["content"]["indics"]
    meta = {}
    for k, gid, typ, dec in INDS:
        c = [i for i in li if i["c_id_indicateur"] == gid]
        if not c: return fail("indicador %s no esta en GeoClip" % gid)
        meta[k] = c[0]
    ref = get("GC_refdata.php?nivgeo=com2020&extent=extent1&lang=fr" + HASH)["content"]["territories"]
    codes, names = ref["codgeo"], ref["libgeo"]
    n = len(codes)
    log("comunas", n)
    if not (34000 <= n <= 36000) or len(names) != n: return fail("numero de comunas fuera de rango:", n)
    cols = {}; sums = {}; used = []
    for k, gid, typ, dec in INDS:
        m = meta[k]
        if "map11" not in (m.get("c_id_view") or []):
            log("  %-16s %-18s sin vista por comuna en GeoClip: se omite" % (k, gid))
            if typ == "n": return fail("%s: indicador aditivo sin vista por comuna" % k)
            continue
        try: j = get("GC_indic.php?indic=%s&dataset=%s&view=map11&lang=fr%s" % (gid, m["c_id_dataset"], HASH))["content"]
        except RuntimeError as e:
            if typ == "n": return fail(str(e))
            log("  %-16s %-18s GeoClip no lo sirve por comuna: se omite" % (k, gid)); continue
        vals = j["distribution"]["values"]
        if len(vals) != n: return fail("%s: %d valores para %d comunas" % (k, len(vals), n))
        col = []
        for v in vals:
            if isinstance(v, (int, float)) and not isinstance(v, bool) and v > -99998 and (typ == 'e' or v >= 0): col.append(round(float(v), dec) if dec else (int(round(v))))
            else: col.append(None)  # secreto estadistico (GeoClip lo marca con un valor negativo) o sin dato
        got = sum(x for x in col if x is not None); ok = sum(1 for x in col if x is not None)
        if any(isinstance(v, (int, float)) and v <= -99998 for v in vals): log("  %s: -99999 (secreto) tratado como hueco" % k)
        if typ == "p" and any(x > 100.0001 for x in col if x is not None): return fail("%s: porcentaje mayor que 100" % k)
        if typ == "n":
            ref_sum = j["distribution"].get("sumth")
            if isinstance(ref_sum, (int, float)) and abs(got - ref_sum) > 0.5 + 1e-4 * abs(ref_sum): return fail("%s: la suma %s no iguala el total de GeoClip %s" % (k, got, ref_sum))
            sums[k] = got
        log("  %-16s %-18s %-14s comunas con dato %6d  suma %s" % (k, gid, m["c_id_dataset"], ok, round(got, 1) if typ == "n" else "-"))
        cols[k] = col; used.append(k)
    if not 380000 <= sums["nbexpl20"] <= 430000: return fail("explotaciones 2020 fuera de rango:", sums["nbexpl20"])
    if not 25e6 <= sums["sau20"] <= 30e6: return fail("SAU 2020 fuera de rango:", sums["sau20"])
    keys = used; ix = keys.index("nbexpl20")
    regs = {}; kept = 0; nofarm = 0; dom = 0
    for i, c in enumerate(codes):
        d = dep_of(c)
        if d not in DEP_REG: dom += 1; continue
        row = [cols[k][i] for k in keys]
        if not row[ix]: nofarm += 1; continue  # sin explotaciones (0) o con el dato oculto: no aporta nada a una tabla
        regs.setdefault(DEP_REG[d], {})[c] = [names[i]] + row; kept += 1
    log("comunas con explotaciones", kept, "sin explotaciones u ocultas", nofarm, "ultramar (no incluidas)", dom, "regiones", len(regs))
    if len(regs) != 13 or not 25000 <= kept <= 35000: return fail("regiones o comunas fuera de rango:", len(regs), kept)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "agreste_ra", "url": "https://stats.agriculture.gouv.fr/cartostat/"}
    for r, cm in sorted(regs.items()):
        (out / (r + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": r, "year": 2020, "ind": keys, "communes": cm}, ensure_ascii=False, separators=(",", ":")) + "\n")
    idx = {"schemaVersion": 1, "generatedAt": now, "source": src, "year": 2020, "communes": kept, "ind": {k: {"id": g, "dataset": meta[k]["c_id_dataset"], "unit": meta[k].get("c_unite"), "label": meta[k].get("c_lib_indicateur_court"), "type": t} for k, g, t, _ in INDS if k in cols},
           "regions": {r: len(cm) for r, cm in sorted(regs.items())}, "totals": {k: round(v, 1) for k, v in sums.items()}}
    (out / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(regs), "regiones")
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""España por municipio (~8.100): Censo Agrario 2020 (INE) -> data/es-municipios/<REGION>.json (17 comunidades) + index.json
Fuente: tablas del Censo Agrario 2020 en INEbase (CC BY 4.0), descargadas como CSV de https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/<tabla>.csv:
75471 SAU por tipo de uso, 75476 ganado por especie, 75481 titulares por sexo, 75482 titulares por edad, 75483 formacion agraria. Cada tabla trae el total nacional, las
comunidades, provincias, comarcas y municipios; aqui solo se guardan los municipios (codigo INE de 5 cifras). El INE asigna cada explotacion al municipio donde esta la mayor parte
de su tierra o de su ganado. El secreto estadistico ('..') queda como hueco (null): nunca se rellena ni se reparte.
Controles (si fallan no se escribe nada): entre 7.500 y 8.300 municipios con explotaciones; la suma de municipios no supera el total nacional (0,1 %) ni queda por debajo del 90 %
en explotaciones y SAU; explotaciones 2020 entre 800.000 y 950.000; SAU entre 22 y 26 millones de ha; sin negativos.
Uso: update-es-municipios.py [--out DIRECTORIO]"""
import datetime, json, re, subprocess, sys, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/%d.csv"
# provincia (INE) -> region de Dehesa Index (17 comunidades; Ceuta 51 y Melilla 52 no se incluyen)
PROV_REG = {}
for _r, _p in {"PV": "01 20 48", "CM": "02 13 16 19 45", "VC": "03 12 46", "AN": "04 11 14 18 21 23 29 41", "CL": "05 09 24 34 37 40 42 47 49", "EX": "06 10", "IB": "07",
               "CT": "08 17 25 43", "GA": "15 27 32 36", "AR": "22 44 50", "RI": "26", "MD": "28", "MC": "30", "NC": "31", "AS": "33", "CN": "35 38", "CB": "39"}.items():
    for _x in _p.split(): PROV_REG[_x] = _r
# (clave, tabla, categoria (None = sin columna extra), medida, entero?)
SPEC = [("expl", 75471, "SAU", "Explotaciones", True), ("sau", 75471, "SAU", "Superficie (ha.)", False),
        ("arable", 75471, "1.1 Tierra arable", "Superficie (ha.)", False), ("woody", 75471, "1.3 Cultivos leñosos", "Superficie (ha.)", False),
        ("pasture", 75471, "1.4 Pastos permanentes", "Superficie (ha.)", False), ("greenh", 75471, "2 SAU en invernadero o abrigo alto accesible", "Superficie (ha.)", False),
        ("bovh", 75476, "1 Bovinos", "Cabezas", True), ("bovx", 75476, "1 Bovinos", "Explotaciones", True),
        ("ovch", 75476, "2_3 Ovino y caprino", "Cabezas", True), ("ovcx", 75476, "2_3 Ovino y caprino", "Explotaciones", True),
        ("porh", 75476, "4 Porcinos", "Cabezas", True), ("porx", 75476, "4 Porcinos", "Explotaciones", True),
        ("aveh", 75476, "5 Aves de corral", "Cabezas", True),
        ("jef", 75481, "Ambos sexos", "Personas", True), ("jefm", 75481, "Mujeres", "Personas", True), ("edad", 75481, "Ambos sexos", "Edad media", False),
        ("j25", 75482, "Menos de 25 años", "Personas", True), ("j34", 75482, "De 25 a 34 años", "Personas", True), ("j65", 75482, "De 65 y más", "Personas", True),
        ("univ", 75483, "Estudios Universitarios y/o superiores agrarios", None, True)]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def download(t, tries=4):
    last = None
    for i in range(tries):
        try:
            time.sleep(2)
            r = subprocess.run(["curl", "-sS", "--compressed", "-L", "-m", "240", "-A", "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", URL % t], capture_output=True)
            txt = r.stdout.decode("utf-8-sig", "replace")
            if r.returncode == 0 and txt.count("\n") > 1000 and ";" in txt[:400]: return txt
            last = (r.stderr.decode("utf8", "replace") or txt[:120]).strip()[:160]
        except Exception as e: last = str(e)
        time.sleep(15 * (i + 1))
    raise RuntimeError("tabla %d -> %s" % (t, last))
def num(s, integer):
    s = s.strip().strip('"')
    if s in ("", ".", "..", "...", "-"): return None
    s = s.replace(".", "").replace(",", "") if integer else s.replace(".", "").replace(",", ".")
    try: v = float(s)
    except ValueError: return None
    if v < 0: return None
    return int(round(v)) if integer else round(v, 2)
def parse(t, txt):
    """-> (head, filas) con filas = [ambito, [columnas intermedias], valor]"""
    L = [l for l in txt.replace("\r", "").split("\n") if l.strip()]
    head = L[0].split(";"); rows = [l.split(";") for l in L[1:]]
    return head, rows
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "es-municipios"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "es-municipios-log.txt"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    tabs = {}
    for t in sorted(set(s[1] for s in SPEC)):
        try: tabs[t] = parse(t, download(t))
        except RuntimeError as e: return fail(str(e))
        log("tabla", t, "filas", len(tabs[t][1]), "cabecera", tabs[t][0][:3])
    names = {}; mun = {}; nat = {}
    for k, t, cat, med, integer in SPEC:
        head, rows = tabs[t]
        for r in rows:
            if t == 75483:  # jerarquica: nacional, comunidad, provincia, comarca, municipio, formacion, valor
                if len(r) < 7 or r[5] != cat: continue
                amb, v = r[4] or r[0], r[6]
                if not r[1] and not r[4]: nat[k] = num(v, integer); continue
            else:  # plana: ambito, categoria, medida, valor
                if len(r) < 4 or r[1] != cat or r[2] != med: continue
                amb, v = r[0], r[3]
                if amb == "Total Nacional": nat[k] = num(v, integer); continue
            m = re.match(r"^(\d{5}) (.+)$", amb)
            if not m: continue
            names[m.group(1)] = m.group(2); mun.setdefault(m.group(1), {})[k] = num(v, integer)
    keys = [s[0] for s in SPEC]
    log("municipios con alguna cifra", len(mun))
    sums = {k: sum(v.get(k) or 0 for v in mun.values()) for k in keys}
    for k in ("expl", "sau", "bovh", "ovch", "porh", "aveh", "jef"):
        n = nat.get(k)
        if n is None: continue
        if sums[k] > n * 1.001: return fail("%s: la suma de municipios %s supera el total nacional %s" % (k, sums[k], n))
        if k in ("expl", "sau") and sums[k] < n * 0.9: return fail("%s: la suma de municipios %s es menor del 90 %% del total %s" % (k, sums[k], n))
        log("  control %-6s municipios %12s nacional %12s (%.1f %%)" % (k, round(sums[k], 1), n, 100 * sums[k] / n if n else 0))
    if not 800000 <= sums["expl"] <= 950000: return fail("explotaciones fuera de rango:", sums["expl"])
    if not 22e6 <= sums["sau"] <= 26e6: return fail("SAU fuera de rango:", sums["sau"])
    regs = {}; kept = 0; skip = 0
    for c, v in sorted(mun.items()):
        reg = PROV_REG.get(c[:2])
        if not reg: skip += 1; continue
        if not v.get("expl"): continue
        regs.setdefault(reg, {})[c] = [names[c]] + [v.get(k) for k in keys]; kept += 1
    log("municipios con explotaciones", kept, "fuera de las 17 comunidades", skip, "regiones", len(regs))
    if len(regs) != 17 or not 7500 <= kept <= 8300: return fail("regiones o municipios fuera de rango:", len(regs), kept)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.json"): old.unlink()
    src = {"id": "ine_es", "url": "https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736176851&menu=resultados&idp=1254735727106"}
    for r, cm in sorted(regs.items()):
        (out / (r + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": r, "year": 2020, "ind": keys, "municipios": cm}, ensure_ascii=False, separators=(",", ":")) + "\n")
    idx = {"schemaVersion": 1, "generatedAt": now, "source": src, "year": 2020, "municipios": kept, "ind": keys,
           "regions": {r: len(cm) for r, cm in sorted(regs.items())}, "totals": {k: round(v, 1) for k, v in sums.items()}, "national": {k: v for k, v in nat.items() if v is not None}}
    (out / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", len(regs), "regiones")
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__":
    sys.exit(main())

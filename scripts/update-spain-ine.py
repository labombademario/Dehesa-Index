#!/usr/bin/env python3
"""España: estadísticas del INE (Instituto Nacional de Estadística) -> data/spain-ine-stats.json (formato de ficheros de estadísticas por país).

Cuatro bloques, todos de ficheros CSV públicos de INEbase (www.ine.es/jaxiT3 y www.ine.es/jaxi), licencia CC BY 4.0 (registro: ine_es):
  1. IPC, índices nacionales de subclases ECOICOP ver.2 (tabla 79184, base 2025=100, mensual, serie enlazada desde 2002):
     las subclases de alimentos y bebidas no alcohólicas (01.x), vino y cerveza, y el índice general para comparar. Grupo «prices».
  2. Índices de Precios Industriales (IPRI), índices nacionales de clases CNAE-2009 (tabla 61525, base 2021=100, mensual):
     industria de la alimentación (10xx) y bebidas (11xx) en «prices»; fertilizantes (2015), fitosanitarios (2020) y piensos
     para animales de granja (1091) en «inputs», porque son precios de salida de fábrica de insumos agrarios.
  3. EPA: ocupados en el sector Agricultura por comunidad autónoma (tabla 65311, miles de personas, trimestral, desde 2008).
     Ceuta y Melilla no se publican aquí: sus cifras de ocupados agrarios son casi siempre inferiores a 1 000 personas y el INE
     advierte de que las estimaciones por debajo de 5 000 personas pueden estar afectadas por fuertes errores de muestreo.
  4. Contabilidad Regional de España (tablas 77773 y 77774): valor añadido bruto de la rama A (agricultura, ganadería, silvicultura
     y pesca) por comunidad, a precios corrientes (millones de euros: el INE publica miles de euros y aquí se divide entre 1 000),
     su peso en el PIB regional (%, «estructura porcentual» del INE) e índice de volumen encadenado (2020=100). Anual desde 2000.
     El último año es «avance» (A) y el anterior «provisional» (P); se indica en la nota de cada serie.

El INE renumera sus tablas cuando cambia de base o publica una revisión. Cada bloque prueba sus identificadores en orden y se queda
con la tabla cuya cabecera coincide y cuyo último periodo es el más reciente. Si ninguna sirve, el bloque falla y no se escribe nada:
el fichero anterior queda tal cual y el estado de pipelines lo muestra.
Valores tal cual (salvo el paso de miles a millones de euros indicado). Celda vacía o «..» = sin punto. Series con pocos puntos se omiten.
Uso: update-spain-ine.py [--out DIR] [--cache DIR]   (--cache: lee los CSV de ese directorio si existen; para pruebas sin red)"""
import csv, datetime, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
LOG = []
CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch(kind, tid, tries=3):
    """kind 't' = jaxiT3 (tablas tempus), 'tpx' = jaxi (tablas PC-Axis). Devuelve el texto CSV (';' como separador) o None."""
    name = "%s%s.csv" % (kind, tid)
    if CACHE and (CACHE / name).exists(): return (CACHE / name).read_text(encoding="utf-8-sig")
    url = ("https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/%s.csv" if kind == "t" else "https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/%s.csv") % tid
    last = None
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300)
            b = r.read()
            if not b: return None   # el INE responde 204 vacío para tablas retiradas
            return b.decode("utf-8-sig")
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    log("AVISO: no se pudo bajar %s: %r" % (url, last)); return None
def num(s):
    s = (s or "").strip().strip('"')
    if s in ("", "..", ".", "-"): return None
    try: return float(s.replace(".", "").replace(",", "."))
    except ValueError: return None
def rows(text):
    r = list(csv.reader(io.StringIO(text), delimiter=";"))
    return r[0], r[1:]
def per_m(p):  # 2026M09 -> 2026-09
    m = re.match(r"^(\d{4})M(\d{2})$", p); return "%s-%s" % m.groups() if m else None
def per_q(p):  # 2026T3 -> 2026-Q3
    m = re.match(r"^(\d{4})T([1-4])$", p); return "%s-Q%s" % m.groups() if m else None
def per_a(p):  # 2024(A) -> (2024, 'A')
    m = re.match(r"^(\d{4})(?:\((\w)\))?$", p); return (m.group(1), m.group(2)) if m else (None, None)
def pick(cands, header_ok, latest_of):
    """Prueba cada (tipo, id) y se queda con la tabla de cabecera válida y último periodo más reciente."""
    best = None
    for kind, tid in cands:
        txt = fetch(kind, tid)
        if not txt: log("tabla %s=%s: vacía o no disponible" % (kind, tid)); continue
        head, body = rows(txt)
        if not header_ok(head): log("tabla %s=%s: cabecera inesperada %s" % (kind, tid, head)); continue
        lp = latest_of(body)
        log("tabla %s=%s: %d filas, último periodo %s" % (kind, tid, len(body), lp))
        if lp and (best is None or lp > best[0]): best = (lp, kind, tid, head, body)
    return best
def mk(sid, group, label, unit, freq, pts, sg, minpts, note=None):
    pl = sorted(pts.items())
    if len(pl) < minpts: log("se omite %s: solo %d puntos" % (sid, len(pl))); return None
    prev = pl[-2][1] if len(pl) > 1 else None
    s = {"id": sid, "group": group, "label": label, "unit": unit, "frequency": freq, "latestPeriod": pl[-1][0], "latest": pl[-1][1],
         "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": sg}
    if note: s["note"] = note
    return s
def clean_name(s): return re.sub(r"\s+", " ", s).strip()

# 1. IPC ----------------------------------------------------------------------------------------------------
CPI_TABLES = [("t", 79184)]
CPI_KEEP = re.compile(r"^(01\.|02\.1\.2\.1 |02\.1\.3\.0 )")
def cpi():
    b = pick(CPI_TABLES, lambda h: len(h) == 4 and "Subclases" in h[0] and h[1] == "Tipo de dato",
             lambda body: max((per_m(r[2]) or "" for r in body if r[1] == "Índice" and num(r[3]) is not None), default=None))
    if not b: raise RuntimeError("IPC: ninguna tabla de subclases válida")
    by = {}
    for r in b[4]:
        if r[1] != "Índice": continue
        name = clean_name(r[0]); p = per_m(r[2]); v = num(r[3])
        if p is None or v is None: continue
        if name == "Índice general" or CPI_KEEP.match(name): by.setdefault(name, {})[p] = v
    out = []
    for name, pts in sorted(by.items()):
        if name == "Índice general": sid, nm = "es-ine-cpi-general", "Índice general"
        else:
            code, nm = name.split(" ", 1); sid = "es-ine-cpi-" + code.replace(".", "")
        s = mk(sid, "prices", "IPC (base 2025=100): %s" % nm, "index 2025=100", "monthly", pts, "INE IPC", 60)
        if s: out.append(s)
    if len(out) < 40: raise RuntimeError("IPC: solo %d series (se esperan 40 o más)" % len(out))
    log("IPC: tabla %s, %d series, último %s" % (b[2], len(out), b[0])); return out

# 2. IPRI ---------------------------------------------------------------------------------------------------
IPRI_TABLES = [("t", 61525)]
IPRI_INPUTS = {"2015", "2020", "1091"}
def ipri():
    b = pick(IPRI_TABLES, lambda h: len(h) == 4 and h[0] == "Clases" and h[1] == "Índices y Tasas",
             lambda body: max((per_m(r[2]) or "" for r in body if r[1] == "Índice" and r[0][:2] in ("10", "11") and num(r[3]) is not None), default=None))
    if not b: raise RuntimeError("IPRI: ninguna tabla de clases válida")
    by = {}
    for r in b[4]:
        if r[1] != "Índice": continue
        m = re.match(r"^(\d{4}) (.+)$", clean_name(r[0]))
        if not m: continue
        code, nm = m.groups()
        if not (code[:2] in ("10", "11") or code in IPRI_INPUTS): continue
        p = per_m(r[2]); v = num(r[3])
        if p is None or v is None: continue
        by.setdefault((code, nm), {})[p] = v
    out = []
    for (code, nm), pts in sorted(by.items()):
        s = mk("es-ine-ipri-" + code, "inputs" if code in IPRI_INPUTS else "prices", "Precios industriales (IPRI, base 2021=100): %s" % nm,
               "index 2021=100", "monthly", pts, "INE IPRI", 60)
        if s: out.append(s)
    if len(out) < 25: raise RuntimeError("IPRI: solo %d series (se esperan 25 o más)" % len(out))
    if not all(any(x["id"] == "es-ine-ipri-" + c for x in out) for c in IPRI_INPUTS): raise RuntimeError("IPRI: falta alguna clase de insumos (2015, 2020, 1091)")
    log("IPRI: tabla %s, %d series, último %s" % (b[2], len(out), b[0])); return out

# 3. EPA ----------------------------------------------------------------------------------------------------
EPA_TABLES = [("t", 65311), ("t", 79326)]
CCAA = {"01": "Andalucía", "02": "Aragón", "03": "Asturias", "04": "Illes Balears", "05": "Canarias", "06": "Cantabria", "07": "Castilla y León",
        "08": "Castilla-La Mancha", "09": "Cataluña", "10": "Comunitat Valenciana", "11": "Extremadura", "12": "Galicia", "13": "Comunidad de Madrid",
        "14": "Región de Murcia", "15": "Comunidad Foral de Navarra", "16": "País Vasco", "17": "La Rioja", "18": "Ceuta", "19": "Melilla"}
def region(cell):
    cell = clean_name(cell)
    if cell in ("Total Nacional", ""): return "es"
    m = re.match(r"^(\d{2}) ", cell); return m.group(1) if m else None
def rname(rc): return "España" if rc == "es" else CCAA[rc]
def epa():
    b = pick(EPA_TABLES, lambda h: h[:3] == ["Sexo", "Comunidades y Ciudades Autónomas", "Sector económico"],
             lambda body: max((per_q(r[3]) or "" for r in body if r[2] == "Agricultura" and num(r[4]) is not None), default=None))
    if not b: raise RuntimeError("EPA: ninguna tabla de ocupados por sector y comunidad válida")
    by = {}
    for r in b[4]:
        if r[0] != "Ambos sexos" or r[2] != "Agricultura": continue
        rc = region(r[1]); p = per_q(r[3]); v = num(r[4])
        if rc is None or rc in ("18", "19") or p is None or v is None: continue
        by.setdefault(rc, {})[p] = v
    out = []
    for rc in ["es"] + sorted(k for k in by if k != "es"):
        if rc not in by: continue
        small = any(v < 5.0 for p, v in sorted(by[rc].items())[-8:])   # algún trimestre de los dos últimos años por debajo de 5 000 personas
        s = mk("es-ine-epa-agr-" + rc, "income", "Ocupados en agricultura (EPA, miles de personas): %s" % rname(rc), "thousand persons", "quarterly", by[rc], "INE EPA", 20,
               "Estimación por encuesta: por debajo de 5 000 personas el INE advierte de fuertes errores de muestreo." if small else None)
        if s: out.append(s)
    if len(out) < 15: raise RuntimeError("EPA: solo %d series (se esperan 15 o más)" % len(out))
    log("EPA: tabla %s, %d series, último %s" % (b[2], len(out), b[0])); return out

# 4. Contabilidad Regional ----------------------------------------------------------------------------------
CRE_VAL = [("tpx", 77773), ("tpx", 76923)]
CRE_VOL = [("tpx", 77774), ("tpx", 76924)]
CRE_HEAD = lambda h: h[1:4] == ["Comunidades y Ciudades Autónomas", "Ramas de actividad", "Magnitud"]
def cre_latest(body): return max((per_a(r[4])[0] or "" for r in body if r[2].startswith("A.") and num(r[5]) is not None), default=None)
def cre():
    bv = pick(CRE_VAL, CRE_HEAD, cre_latest); bq = pick(CRE_VOL, CRE_HEAD, cre_latest)
    if not bv or not bq: raise RuntimeError("CRE: falta la tabla de valores o la de volumen")
    val, share, vol, flags = {}, {}, {}, {}
    for body, which in ((bv[4], "v"), (bq[4], "q")):
        for r in body:
            if not r[2].startswith("A."): continue
            rc = region(r[1]); y, fl = per_a(r[4]); v = num(r[5])
            if rc is None or y is None or v is None: continue
            if fl: flags[y] = fl
            if which == "v" and r[3] == "Valor": val.setdefault(rc, {})[y] = round(v / 1000.0, 3)
            elif which == "v" and r[3] == "Estructura porcentual": share.setdefault(rc, {})[y] = v
            elif which == "q" and r[3] == "Índices de volumen encadenados": vol.setdefault(rc, {})[y] = v
    fnote = "; ".join("%s %s" % (y, {"A": "avance", "P": "provisional"}.get(f, f)) for y, f in sorted(flags.items()))
    note = ("Datos del INE: " + fnote + ".") if fnote else None
    out = []
    for rc in ["es"] + sorted(k for k in val if k != "es"):
        for d, key, lab, unit in ((val, "vab-agr", "VAB de la rama agraria, precios corrientes (millones de euros)", "EUR million"),
                                  (share, "vab-agr-share", "Peso de la rama agraria en el PIB (%)", "%"),
                                  (vol, "vab-agr-vol", "VAB de la rama agraria, índice de volumen encadenado (2020=100)", "index 2020=100")):
            if rc not in d: continue
            s = mk("es-ine-%s-%s" % (key, rc), "income", "%s: %s" % (lab, rname(rc)), unit, "annual", d[rc], "INE Contabilidad Regional", 10, note)
            if s: out.append(s)
    if len(out) < 45: raise RuntimeError("CRE: solo %d series (se esperan 45 o más)" % len(out))
    log("CRE: tablas %s y %s, %d series, último %s" % (bv[2], bq[2], len(out), bv[0])); return out

def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1])
    series = []
    for name, fn in (("IPC", cpi), ("IPRI", ipri), ("EPA", epa), ("CRE", cre)):
        try: series += fn()
        except Exception as e: log("ERROR: %s: %s; no se escribe nada" % (name, e)); return 1
    ids = [s["id"] for s in series]
    if len(ids) != len(set(ids)): log("ERROR: ids repetidos"); return 1
    src = {"name": "INE — IPC, Índices de Precios Industriales, Encuesta de Población Activa y Contabilidad Regional de España", "url": "https://www.ine.es/", "license": "CC BY 4.0"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": series}}, "log": LOG[-30:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "spain-ine-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-ine-stats.json")
    log("escrito: %d series" % len(series))
    return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "spain-ine-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

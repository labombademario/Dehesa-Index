#!/usr/bin/env python3
"""Croacia (APPRRR, Agencija za placanja u poljoprivredi, ribarstvu i ruralnom razvoju) -> data/hr-apprrr/counties.json

Unica fuente abierta con detalle por provincia (21 zupanije) de Croacia: el DZS solo publica 4 regiones.
Fuente: conjuntos de la organizacion de la APPRRR en data.gov.hr (CKAN, licencia «Otvorena dozvola RH» = open-license), ficheros XLSX anuales (corte 31.12):
  - farms:    Upisnik poljoprivrednika: explotaciones (PG) por tipo juridico y provincia.
  - size:     ARKOD (SIGPAC croata): parcelas y hectareas por tamaño de explotacion y provincia (suma de los municipios).
  - use:      ARKOD: parcelas y hectareas por tipo de uso (tierra de cultivo, prado, pasto, vinedo, olivar, fruta...) y provincia.
  - vineyard: Registro vitivinicola: vinedo en produccion, arrancado y vid dentro de plantaciones mixtas por provincia.
El conjunto de cada tema se descubre por titulo en CKAN y se toma el año mas reciente (no hay URLs fijas). Nada se estima: '-' es 0 (la fuente lo usa para «sin parcelas»).
Si algo no cuadra (provincias que faltan, totales que no suman, ordenes de magnitud imposibles) el fichero no se toca.
Uso: python3 scripts/update-hr-apprrr.py [--local carpeta con farms.xlsx size.xlsx use.xlsx vineyard.xlsx]"""
import argparse, datetime, difflib, io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CKAN = "https://data.gov.hr/ckan/api/3/action/package_search?fq=organization:agencija-za-placanja-u-poljoprivredi-ribarstvu-i-ruralnom-razvoju&rows=200"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
COUNTIES = ["Bjelovarsko-bilogorska", "Brodsko-posavska", "Dubrovačko-neretvanska", "Grad Zagreb", "Istarska", "Karlovačka", "Koprivničko-križevačka", "Krapinsko-zagorska",
            "Ličko-senjska", "Međimurska", "Osječko-baranjska", "Požeško-slavonska", "Primorsko-goranska", "Sisačko-moslavačka", "Splitsko-dalmatinska", "Šibensko-kninska",
            "Varaždinska", "Virovitičko-podravska", "Vukovarsko-srijemska", "Zadarska", "Zagrebačka"]
CK = {c.casefold(): c for c in COUNTIES}
def county(x):
    """Nombre de provincia canonico o None (admite 'Istarska županija', 'Šibensko-Kninska')."""
    if not isinstance(x, str): return None
    x = re.sub(r"_x[0-9a-fA-F]{4}_", "", x).replace("ż", "ž").replace("Ż", "Ž")
    s = re.sub(r"\s*županija\s*$", "", x.strip(), flags=re.I).casefold()
    if s in CK: return CK[s]
    m = difflib.get_close_matches(s, list(CK), n=1, cutoff=0.88)  # algun libro antiguo trae el nombre con la codificacion rota (Pożeíko)
    return CK[m[0]] if m else None
def num(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return float(v)
    s = str(v).strip()
    if s in ("", "-", "–", "."): return 0.0
    return float(s.replace(".", "").replace(",", ".")) if re.search(r",\d{1,2}$", s) else float(s.replace(" ", ""))
SIZE_KEYS = ["lt3", "3_20", "20_100", "100_1500", "ge1500"]
def http_json(u, tries=4):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-60:], str(last)[:100]))
def http_bytes(u, tries=4):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-60:], str(last)[:100]))
def kind_of(title):
    t = title.lower()
    if "vinogradar" in t: return "vineyard"
    if "upisnik" in t: return "farms"
    if "naseljima" in t and "uporab" in t: return "use"
    if "veličin" in t or "velicin" in t: return "size"
    return None
def discover():
    """{tipo: {año: (titulo, url)}} con todos los XLSX abiertos de cada tipo."""
    d = http_json(CKAN)["result"]["results"]
    best = {}
    for p in d:
        if p.get("license_id") != "open-license": continue
        k = kind_of(p.get("title", ""))
        yrs = re.findall(r"20\d\d", p.get("title", ""))
        xl = [r for r in p.get("resources", []) if r.get("url") and ((r.get("format") or "").upper() == "XLSX" or r["url"].lower().endswith(".xlsx"))]
        if not k or not xl: continue
        y = int(yrs[-1]) if yrs else (2021 if k == "farms" else None)
        if y: best.setdefault(k, {})[y] = (p["title"], xl[0]["url"])
    return best
def load_rows(blob, sheet=0):
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(blob) if isinstance(blob, bytes) else blob, read_only=True, data_only=True)
    ws = wb.worksheets[sheet]
    return [list(r) for r in ws.iter_rows(values_only=True)]
def parse_farms(rows):
    hdr = rows[1]
    cols = [(i, str(h).replace(" Ukupno", "").strip()) for i, h in enumerate(hdr) if isinstance(h, str) and h.endswith(" Ukupno") and h.strip() != "Ukupno" and not h.startswith("(blank)")]
    tot_i = next((i for i, h in enumerate(hdr) if isinstance(h, str) and h.strip() == "Ukupno"), None)
    if not cols or tot_i is None: raise RuntimeError("farms: cabecera no reconocida")
    out, grand = {}, None
    for r in rows[3:]:
        c = county(r[0])
        if c: out[c] = dict([(n, num(r[i])) for i, n in cols] + [("total", num(r[tot_i]))])
        elif isinstance(r[0], str) and r[0].strip() == "Ukupno": grand = num(r[tot_i])
    return {"types": [n for _, n in cols], "rows": out, "total": grand}
def parse_size(rows):
    pos = [i for i, h in enumerate(rows[1]) if h and i >= 3 and str(h).strip().upper() != "UKUPNO"]
    if len(pos) != 5: raise RuntimeError("size: se esperaban 5 clases de tamaño, hay %d" % len(pos))
    out = dict((c, dict((k, {"parcels": 0.0, "ha": 0.0}) for k in SIZE_KEYS)) for c in COUNTIES)
    gp = gh = None
    for r in rows[3:]:
        c = county(r[0])
        if c and r[2] is not None:
            for k, i in zip(SIZE_KEYS, pos):
                out[c][k]["parcels"] += num(r[i + 1]); out[c][k]["ha"] += num(r[i + 2])
        elif isinstance(r[0], str) and r[0].strip().upper() == "UKUPNO":
            gp = sum(num(r[i + 1]) for i in pos); gh = sum(num(r[i + 2]) for i in pos)
    for c in out:
        for k in SIZE_KEYS: out[c][k]["ha"] = round(out[c][k]["ha"], 2)
    return {"classes": SIZE_KEYS, "rows": out, "fileTotal": {"parcels": gp, "ha": gh}}
def parse_use(rows):
    names, pos = [], []
    for i, h in enumerate(rows[1]):
        if i >= 3 and h and str(h).strip().upper() != "UKUPNO": names.append(str(h).strip()); pos.append(i)
    # cada uso ocupa dos columnas: parcelas y hectareas (el orden varia entre años: se lee de la fila 3)
    sub = rows[2]
    cols = []
    for n, i in zip(names, pos):
        a, b = str(sub[i] or "").lower(), str(sub[i + 1] or "").lower()
        if "broj" in a and "povr" in b: cols.append((n, i, i + 1))
        elif "povr" in a and "broj" in b: cols.append((n, i + 1, i))
        else: raise RuntimeError("use: subcabecera no reconocida en " + n)
    out = dict((c, dict((n, {"parcels": 0.0, "ha": 0.0}) for n, _, _ in cols)) for c in COUNTIES)
    # el total del fichero es la columna UKUPNO de cada fila (los tres ultimos pares), no una fila final
    ti = next((i for i, h in enumerate(rows[1]) if h and str(h).strip().upper() == "UKUPNO"), None)
    if ti is None: raise RuntimeError("use: sin columna UKUPNO")
    tcol = ti + 1 if "povr" in str(sub[ti + 1] or "").lower() else ti
    gh = 0.0
    for r in rows[3:]:
        c = county(r[0])
        if c and r[2] is not None:
            for n, ip, ih in cols: out[c][n]["parcels"] += num(r[ip]); out[c][n]["ha"] += num(r[ih])
            gh += num(r[tcol])
    for c in out:
        for n, _, _ in cols: out[c][n]["ha"] = round(out[c][n]["ha"], 2)
    return {"uses": [n for n, _, _ in cols], "rows": out, "fileTotal": {"ha": gh}}
def parse_vineyard(rows):
    blocks, cur = {}, None
    for r in rows:
        a = r[0]
        if isinstance(a, str) and not county(a) and a.strip() != "Ukupno" and not a.startswith(("Izvor", "*", "Županija")) and r[1] is None and r[2] is None:
            t = a.lower()
            cur = "active" if t.startswith("vinogradi") else "cleared" if t.startswith("iskr") else "mixed" if "mje" in t else None
            if cur: blocks[cur] = {"rows": {}, "total": None}
            continue
        if cur is None: continue
        c = county(a)
        if c: blocks[cur]["rows"][c] = {"ha": round(num(r[1]), 2), "parcels": num(r[2]), "farms": num(r[3]), "vines": num(r[4]) if cur == "active" else None}
        elif isinstance(a, str) and a.strip() == "Ukupno": blocks[cur]["total"] = {"ha": num(r[1]), "parcels": num(r[2])}
    return blocks
def check(doc):
    errs = []
    f, s, u, v = doc["farms"], doc["size"], doc["use"], doc["vineyard"]
    for name, rows in (("farms", f["rows"]), ("size", s["rows"]), ("use", u["rows"])):
        miss = [c for c in COUNTIES if c not in rows]
        if miss: errs.append("%s: faltan provincias %s" % (name, miss))
    if abs(sum(r["total"] for r in f["rows"].values()) - (f["total"] or 0)) > 0.5: errs.append("farms: las provincias no suman el total del fichero")
    if not 80000 < (f["total"] or 0) < 400000: errs.append("farms: total %s fuera de rango" % f["total"])
    sp = sum(x["parcels"] for r in s["rows"].values() for x in r.values()); sh = sum(x["ha"] for r in s["rows"].values() for x in r.values())
    if abs(sp - (s["fileTotal"]["parcels"] or 0)) > max(5, 0.001 * sp): errs.append("size: parcelas %s != total del fichero %s" % (sp, s["fileTotal"]["parcels"]))
    if abs(sh - (s["fileTotal"]["ha"] or 0)) > max(5, 0.002 * sh): errs.append("size: hectareas %s != total del fichero %s" % (sh, s["fileTotal"]["ha"]))
    if not 700000 < sh < 2500000: errs.append("size: superficie ARKOD %s ha fuera de rango" % sh)
    uh = sum(x["ha"] for r in u["rows"].values() for x in r.values())
    if abs(uh - (u["fileTotal"]["ha"] or 0)) > max(5, 0.002 * uh): errs.append("use: hectareas %s != total del fichero" % uh)
    if abs(uh - sh) > 0.03 * sh: errs.append("use y size difieren mas de un 3%% (%s vs %s ha)" % (uh, sh))
    for k in ("active", "cleared", "mixed"):
        if k not in v: errs.append("vineyard: falta el bloque " + k); continue
        miss = len(v[k]["rows"])
        if miss < 17: errs.append("vineyard %s: solo %d provincias" % (k, miss))
        t = v[k]["total"]
        if not t: errs.append("vineyard %s: sin fila Ukupno" % k); continue
        ha = sum(x["ha"] for x in v[k]["rows"].values())
        if abs(ha - t["ha"]) > max(1, 0.005 * t["ha"]): errs.append("vineyard %s: las provincias suman %.1f ha y el total es %.1f" % (k, ha, t["ha"]))
    if "active" in v and not 8000 < (v["active"]["total"] or {}).get("ha", 0) < 40000: errs.append("vineyard: superficie total fuera de rango")
    H = doc.get("history", {})
    for k, lo, hi in (("farms", 80000, 400000), ("size", 700000, 2500000), ("use", 700000, 2500000), ("vineyard", 8000, 40000)):
        prev = None
        for y, rows in H.get(k, {}).items():
            if k == "farms": v = sum(r["total"] for r in rows.values())
            elif k == "vineyard": v = sum(r["ha"] for r in rows.values())
            else: v = sum(x["ha"] for r in rows.values() for x in r.values())
            if not lo < v < hi: errs.append("serie %s %s: total %.0f fuera de rango" % (k, y, v))
            if prev and abs(v / prev - 1) > 0.25: errs.append("serie %s %s: salto del %.0f%% frente al año anterior" % (k, y, (v / prev - 1) * 100))
            prev = v
        if doc["asOf"][k][:4] not in H.get(k, {}): errs.append("serie %s: falta el ultimo año" % k)
    return errs
PARSE = {"farms": parse_farms, "size": parse_size, "use": parse_use, "vineyard": parse_vineyard}
def build(blobs, meta, hist=None):
    """blobs/meta: ultimo año de cada tipo; hist: {tipo: {año: (bytes, titulo, url)}} con los años anteriores (opcional)."""
    doc = {"schemaVersion": 2, "generatedAt": now(),
           "source": {"id": "apprrr_hr", "name": "Agencija za plaćanja u poljoprivredi, ribarstvu i ruralnom razvoju (APPRRR)", "url": "https://data.gov.hr/organization/agencija-za-placanja-u-poljoprivredi-ribarstvu-i-ruralnom-razvoju",
                      "license": "Otvorena dozvola RH (data.gov.hr, open-license)"},
           "counties": COUNTIES, "asOf": {}, "datasets": {}}
    doc["farms"] = parse_farms(load_rows(blobs["farms"]))
    doc["size"] = parse_size(load_rows(blobs["size"]))
    doc["use"] = parse_use(load_rows(blobs["use"]))
    doc["vineyard"] = parse_vineyard(load_rows(blobs["vineyard"]))
    for k, (y, title, url) in meta.items():
        doc["asOf"][k] = "%d-12-31" % y; doc["datasets"][k] = {"title": title, "url": url}
    # serie historica por provincia: un bloque por tipo y año (el ultimo año tambien, para que la serie sea completa)
    H = dict((k, {}) for k in PARSE)
    for k in PARSE:
        H[k][str(meta[k][0])] = doc[k]["rows"] if k != "vineyard" else doc["vineyard"]["active"]["rows"]
    for k, ys in (hist or {}).items():
        for y, (blob, title, url) in sorted(ys.items()):
            if str(y) in H[k]: continue
            try:
                r = PARSE[k](load_rows(blob))
                rows = r["rows"] if k != "vineyard" else r["active"]["rows"]
                if any(c not in rows for c in COUNTIES): raise RuntimeError("provincias incompletas (%d)" % len(rows))
                H[k][str(y)] = rows
            except Exception as e: log("aviso: %s %s no se usa en la serie: %s" % (k, y, str(e)[:100]))
    doc["history"] = dict((k, dict(sorted(v.items()))) for k, v in H.items())
    return doc
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "hr-apprrr")); ap.add_argument("--local", default="")
    ap.add_argument("--log", default=str(ROOT / "data" / "hr-apprrr-log.txt")); a = ap.parse_args()
    try:
        if a.local:
            blobs = dict((k, (Path(a.local) / (k + ".xlsx")).read_bytes()) for k in ("farms", "size", "use", "vineyard"))
            meta = dict((k, (2025, "local " + k, "file://" + k)) for k in blobs); hist = {}
            for f in sorted(Path(a.local).glob("*_20??.xlsx")):
                k, y = f.stem.rsplit("_", 1)
                if k in PARSE and int(y) != meta[k][0]: hist.setdefault(k, {})[int(y)] = (f.read_bytes(), "local", "file://" + f.name)
        else:
            allk = discover(); miss = [k for k in ("farms", "size", "use", "vineyard") if k not in allk]
            if miss: raise RuntimeError("conjuntos no encontrados en CKAN: %s" % miss)
            meta, blobs, hist = {}, {}, {}
            for k, ys in allk.items():
                top = max(ys)
                for y, (title, url) in sorted(ys.items()):
                    try: b = http_bytes(url)
                    except Exception as e:
                        if y == top: raise
                        log("aviso: %s %s no descargable: %s" % (k, y, str(e)[:80])); continue
                    log("descargado", k, y)
                    if y == top: meta[k] = (y, title, url); blobs[k] = b
                    else: hist.setdefault(k, {})[y] = (b, title, url)
        doc = build(blobs, meta, hist)
        errs = check(doc)
        if errs:
            for e in errs: log("ERROR", e)
            log("fichero NO actualizado"); rc = 1
        else:
            out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
            (out / "counties.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
            log("OK counties.json", doc["asOf"]); rc = 0
    except Exception as e:
        log("ERROR", str(e)[:300]); rc = 1
    Path(a.log).write_text("\n".join(LOG) + "\n", encoding="utf-8")
    sys.exit(rc)
if __name__ == "__main__": main()

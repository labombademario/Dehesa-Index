#!/usr/bin/env python3
"""Reino Unido: desembarques de pesca por especie, nacion y puerto (MMO, «UK Sea Fisheries Annual Statistics», Seccion 2) -> data/uk-mmo-fish.json
Fuente: Marine Management Organisation (MMO) / DEFRA, gov.uk, licencia Open Government Licence v3.0. Hoja de calculo ODS «Section_2_Landings_<ano>.ods».
La URL del fichero cambia en cada edicion: se localiza desde la pagina de la edicion (o, si falla, desde la coleccion) buscando el enlace «Section_2_Landings_*.ods».
Tablas usadas: 2.2 (especies, desembarques en el Reino Unido por buques del Reino Unido, 5 anos: cantidad en miles de toneladas y valor en millones de libras),
2.2a/b/c/d (Inglaterra, Gales, Escocia, Irlanda del Norte), 2.13 (puertos, todas las especies, 5 anos), 2.13a-d (puertos principales por nacion: solo se usa para saber a que nacion
pertenece cada puerto) y 2.7 (serie historica 1938-ultimo ano por grupo). Nada se estima: «-» queda como null; los totales son los que publica la fuente.
Comprobaciones (si una falla no se escribe nada): hojas y rotulos esperados, 5 anos seguidos, suma de especies = total del grupo (0,5 %), grupos = total, la suma de las cuatro
naciones esta dentro de 2 % del Reino Unido, puertos <= total y al menos 40 puertos, serie historica con el ultimo ano igual al de 2.2.
Uso: update-uk-mmo-fish.py [--out FICHERO.json] [--ods FICHERO.ods]   (--ods: lee un ODS local, sin red; solo pruebas)"""
import argparse, datetime, io, json, re, sys, time, urllib.request, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "uk-mmo-fish.json"
LOGF = ROOT / "data" / "uk-mmo-fish-log.txt"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
PAGES = ["https://www.gov.uk/government/statistics/uk-sea-fisheries-annual-statistics-report-%d", "https://www.gov.uk/government/collections/uk-sea-fisheries-annual-statistics"]
NS = {"t": "urn:oasis:names:tc:opendocument:xmlns:table:1.0", "x": "urn:oasis:names:tc:opendocument:xmlns:text:1.0", "o": "urn:oasis:names:tc:opendocument:xmlns:office:1.0"}
T = "{%s}" % NS["t"]
NATIONS = [("England", "a"), ("Wales", "b"), ("Scotland", "c"), ("Northern Ireland", "d")]
GROUPS = ["Demersal", "Pelagic", "Shellfish"]
LINK = r'href="(https://assets\.publishing\.service\.gov\.uk/[^"]*?/Section_2_Landings_(\d{4})\.ods)"'
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=200, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def sheets(b):
    root = ET.fromstring(zipfile.ZipFile(io.BytesIO(b)).read("content.xml")); out = {}
    for tb in root.iter(T + "table"):
        rows = []
        for r in tb.iter(T + "table-row"):
            cells = []
            for c in r:
                if c.tag not in (T + "table-cell", T + "covered-table-cell"): continue
                n = int(c.get(T + "number-columns-repeated", "1"))
                v = c.get("{%s}value" % NS["o"]) or "".join("".join(p.itertext()) for p in c.findall("x:p", NS))
                cells += [v.strip()] * min(n, 60)
            while cells and cells[-1] == "": cells.pop()
            rows.append(cells)
        while rows and not rows[-1]: rows.pop()
        out[tb.get(T + "name")] = rows
    return out
def num(s):
    s = (s or "").strip().replace(",", "")
    if s in ("", "-", "..", "x", "X", "*"): return None
    try: return float(s)
    except ValueError: return None
def locate():
    """-> (url del ODS, url de la pagina, ano de la edicion)"""
    y = datetime.date.today().year
    for u in [PAGES[0] % (y - 1), PAGES[0] % (y - 2), PAGES[1]]:
        try: html = get(u).decode("utf-8", "replace")
        except RuntimeError as e: log("pagina no disponible:", e); continue
        m = re.findall(LINK, html)
        if m:
            m.sort(key=lambda x: x[1]); return m[-1][0], u, int(m[-1][1])
        for p in sorted(set(re.findall(r'href="(/government/statistics/uk-sea-fisheries-annual-statistics-report-(\d{4}))"', html)), key=lambda x: x[1], reverse=True)[:1]:
            html2 = get("https://www.gov.uk" + p[0]).decode("utf-8", "replace")
            m = re.findall(LINK, html2)
            if m: return m[-1][0], "https://www.gov.uk" + p[0], int(m[-1][1])
    raise RuntimeError("no se encuentra el enlace a Section_2_Landings_*.ods")
def year_cols(rows):
    """fila de anos (>= 3 celdas de 4 cifras) y rotulos de bloque encima -> (indice de la fila de anos, {columna: (medida, ano)})"""
    for hi, r in enumerate(rows[:12]):
        ys = [(i, int(c)) for i, c in enumerate(r) if re.fullmatch(r"(19|20)\d\d", c)]
        if len(ys) >= 3:
            lab = {}
            for lr in rows[max(0, hi - 3):hi]:
                for i, c in enumerate(lr):
                    if c: lab[i] = c
            out = {}
            for i, y in ys:
                k = max([j for j in lab if j <= i], default=None)
                t = lab.get(k, "").lower() if k is not None else ""
                m = "qty" if "quantity" in t else "val" if "value" in t else "price" if "price" in t else None
                if m: out[i] = (m, y)
            return hi, out
    raise ValueError("no hay fila de anos")
def species_table(rows, label):
    """2.2 y 2.2a-d -> (anos, [[nombre, grupo, qty[], val[]]], {grupo|'All': [qty[], val[]]})"""
    hi, cols = year_cols(rows)
    yrs = sorted({y for m, y in cols.values()})
    for m in ("qty", "val"):
        if sorted(y for mm, y in cols.values() if mm == m) != yrs: raise ValueError("%s: anos de %s distintos de %s" % (label, m, yrs))
    pos = {(m, y): i for i, (m, y) in cols.items()}
    head = " ".join(c for r in rows[:hi] for c in r).lower()
    if "'000 tonnes" not in head or "£ million" not in head: raise ValueError("%s: unidades inesperadas: %s" % (label, head[:160]))
    pend = []; out = []; tot = {}
    for r in rows[hi + 1:]:
        if not any(r): continue
        txt = [c for c in r[:3] if c and num(c) is None]
        if not txt: continue
        nm = txt[-1]
        if nm.startswith("Source") or nm.startswith("("): break
        q = [num(r[pos[("qty", y)]]) if pos[("qty", y)] < len(r) else None for y in yrs]
        v = [num(r[pos[("val", y)]]) if pos[("val", y)] < len(r) else None for y in yrs]
        if nm.startswith("Total "):
            g = nm[6:].strip(); key = "All" if g.lower().startswith("all") else g
            tot[key] = [q, v]
            if key in GROUPS:
                for p in pend: p[1] = key
                out += pend; pend = []
            continue
        pend.append([re.sub(r"\([a-z]\)$", "", nm).strip(), None, q, v])
    if pend: raise ValueError("%s: especies sin grupo: %s" % (label, [p[0] for p in pend][:5]))
    if set(tot) != set(GROUPS + ["All"]): raise ValueError("%s: totales %s" % (label, sorted(tot)))
    return yrs, out, tot
def check_species(label, rows, tot):
    for g in GROUPS:
        for k, nm in ((2, "cantidad"), (3, "valor")):
            for j in range(len(tot[g][0])):
                s = sum((r[k][j] or 0) for r in rows if r[1] == g); t = tot[g][k - 2][j]
                if t is None or abs(s - t) > max(0.005 * abs(t), 0.002): raise ValueError("%s: %s del grupo %s %s: suma %.4f total %.4f" % (label, nm, g, j, s, t))
    for k in (0, 1):
        for j in range(len(tot["All"][0])):
            s = sum(tot[g][k][j] or 0 for g in GROUPS); t = tot["All"][k][j]
            if abs(s - t) > max(0.005 * abs(t), 0.002): raise ValueError("%s: grupos %.3f != total %.3f" % (label, s, t))
def ports_table(rows):
    hi, cols = year_cols(rows)
    yrs = sorted({y for m, y in cols.values()}); pos = {(m, y): i for i, (m, y) in cols.items()}
    note = ""; out = []; tot = None
    for r in rows[hi + 1:]:
        if not any(r): continue
        if r[0].startswith("(a) Ports"): note = r[0]; continue
        if r[0].startswith("Source") or r[0].startswith("(a) All"): continue
        txt = [c for c in r[:3] if c and num(c) is None]
        if not txt: continue
        flag = "(a)" in txt
        nm = [c for c in txt if not re.fullmatch(r"\([a-z]\)", c)]
        if not nm: continue
        nm = nm[-1] if (len(r) > 2 and r[2]) else nm[0]
        q = [num(r[pos[("qty", y)]]) if pos[("qty", y)] < len(r) else None for y in yrs]
        v = [num(r[pos[("val", y)]]) if pos[("val", y)] < len(r) else None for y in yrs]
        if nm.startswith("Total"): tot = [q, v]; continue
        out.append([nm, q, v, flag])
    return yrs, out, tot, note
def major_ports(rows):
    for r in rows[:8]:
        names = [c for c in r if c and num(c) is None and c not in ("Quantity", "Value")]
        if len(names) >= 3: return names
    return []
def history(rows):
    ys = None; idx = []; grp = None; qty = {}; val = {}
    for r in rows:
        if ys is None:
            idx = [i for i, c in enumerate(r) if re.fullmatch(r"(19|20)\d\d", c)]
            if len(idx) >= 5: ys = [int(r[i]) for i in idx]
            continue
        if r and r[0] in GROUPS + ["Total"] and not any(r[1:]): grp = r[0]; continue
        if grp and len(r) > 2 and r[1].startswith(("Quantity", "Value")):
            (qty if r[1].startswith("Quantity") else val)[grp] = [num(r[i]) if i < len(r) else None for i in idx]
    if set(qty) != set(GROUPS + ["Total"]) or set(val) != set(qty): raise ValueError("historico: grupos %s %s" % (sorted(qty), sorted(val)))
    return ys, qty, val
def build(sh, ods_url, page, rep_year):
    if "Table_2_2" not in sh: raise ValueError("falta la hoja Table_2_2; hojas: %s" % list(sh)[:8])
    yrs, rows, tot = species_table(sh["Table_2_2"], "2.2"); check_species("2.2", rows, tot)
    if len(yrs) != 5 or yrs != list(range(yrs[0], yrs[0] + 5)): raise ValueError("anos: %s" % yrs)
    if yrs[-1] != rep_year: raise ValueError("el ultimo ano %s no es el de la edicion %s" % (yrs[-1], rep_year))
    log("2.2: %d especies, anos %s-%s, total %.1f mil t, %.1f M£" % (len(rows), yrs[0], yrs[-1], tot["All"][0][-1], tot["All"][1][-1]))
    uk = {"species": rows, "totals": tot}
    nations = {}
    for nm, suf in NATIONS:
        y2, r2, t2 = species_table(sh["Table_2_2" + suf], "2.2" + suf)
        if y2 != yrs: raise ValueError("2.2%s: anos distintos" % suf)
        check_species("2.2" + suf, r2, t2)
        nations[nm] = {"species": r2, "totals": t2}
        log("2.2%s %s: %d especies, total %.1f mil t" % (suf, nm, len(r2), t2["All"][0][-1]))
    for k, nm in ((0, "cantidad"), (1, "valor")):
        for j, y in enumerate(yrs):
            s = sum(nations[n]["totals"]["All"][k][j] or 0 for n in nations); t = tot["All"][k][j]
            log("  control naciones %s %s: suma %.2f Reino Unido %.2f (%.2f %%)" % (nm, y, s, t, 100 * s / t))
            if abs(s - t) > 0.02 * t: raise ValueError("naciones vs Reino Unido %s %s: %.2f vs %.2f" % (nm, y, s, t))
    py, ports, ptot, note = ports_table(sh["Table_2_13"])
    if py != yrs: raise ValueError("puertos: anos %s" % py)
    nat = {}
    for nm, suf in NATIONS:
        for p in major_ports(sh.get("Table_2_13" + suf, [])): nat[p] = nm
    log("2.13: %d puertos, con nacion %d, nota: %s" % (len(ports), sum(1 for p in ports if p[0] in nat), note[:160]))
    if len(ports) < 40 or ptot is None: raise ValueError("puertos insuficientes: %d" % len(ports))
    for k in (0, 1):
        s = sum((p[1 + k][-1] or 0) for p in ports)
        if s > ptot[k][-1] * 1.001 + 0.01: raise ValueError("puertos %s superan el total %.2f > %.2f" % (k, s, ptot[k][-1]))
        log("  control puertos %s %s: suma %.2f total %.2f" % ("qty" if k == 0 else "val", yrs[-1], s, ptot[k][-1]))
    hy, hq, hv = history(sh["Table_2_7"])
    if hy[-1] != yrs[-1]: raise ValueError("historico termina en %s" % hy[-1])
    log("2.7: %d anos %s-%s, ultimo total %.1f mil t" % (len(hy), hy[0], hy[-1], hq["Total"][-1]))
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    r5 = lambda l: [None if x is None else round(x, 5) for x in l]
    def fix(sec): return {"species": [[n, g, r5(q), r5(v)] for n, g, q, v in sec["species"]], "totals": {g: [r5(sec["totals"][g][0]), r5(sec["totals"][g][1])] for g in sec["totals"]}}
    return {"schemaVersion": 1, "generatedAt": now,
            "source": {"id": "mmo_fish", "url": page, "file": ods_url, "license": "Open Government Licence v3.0"},
            "reportYear": rep_year, "years": yrs, "units": {"qty": "thousand tonnes", "val": "GBP million"},
            "uk": fix(uk), "nations": {n: fix(v) for n, v in nations.items()},
            "ports": [[p[0], nat.get(p[0]), r5(p[1]), r5(p[2]), p[3]] for p in ports], "portsTotal": [r5(ptot[0]), r5(ptot[1])], "portsNote": note,
            "history": {"years": hy, "qty": {g: r5(v) for g, v in hq.items()}, "val": {g: r5(v) for g, v in hv.items()}}}
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out"); ap.add_argument("--ods"); a = ap.parse_args()
    out = Path(a.out) if a.out else OUT
    def fail(*m):
        log("FALLO:", *m)
        if not a.ods: LOGF.write_text("\n".join(LOG) + "\n")
        return 1
    try:
        if a.ods:
            raw = Path(a.ods).read_bytes(); url = page = "local"; ry = int(re.search(r"(\d{4})", Path(a.ods).name).group(1))
        else:
            url, page, ry = locate(); log("ODS:", url, "pagina:", page); raw = get(url)
        log("bytes", len(raw))
        data = build(sheets(raw), url, page, ry)
    except (RuntimeError, ValueError, KeyError, IndexError, zipfile.BadZipFile, ET.ParseError) as e: return fail(repr(e))
    if out.exists():
        try:
            old = json.loads(out.read_text())
            if old.get("reportYear", 0) > data["reportYear"]: return fail("edicion anterior a la ya publicada")
        except ValueError: pass
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
    log("escrito", out, out.stat().st_size, "bytes")
    if not a.ods: LOGF.write_text("\n".join(LOG) + "\n")
    return 0
if __name__ == "__main__":
    sys.exit(main())

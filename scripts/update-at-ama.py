#!/usr/bin/env python3
"""Austria: precios semanales de la AMA (Agrarmarkt Austria) -> data/austria-ama-stats.json (formato de estadísticas por país; país AT, extend).

Fuente: AMA, «Amtliche Statistiken der Agrarmarkt Austria» (ama.at/marktinformationen), declarados CC BY 4.0 en data.gv.at / data.europa.eu
(registro ama_at). Solo se toman cifras con «Quelle: AMA»: no se usan las cotizaciones de bolsas ni de otros países que la AMA reproduce.
1. Histórico: «Marktbericht Vieh und Fleisch» semanal en PDF (archivo desde 2023, hasta la semana 34 de 2026), sección «A) Preisbericht»:
   precio pagado al ganadero (Auszahlungspreis, EUR/kg en canal, sin IVA, con primas y descuentos, franco matadero) y número de animales de los
   mataderos obligados a declarar, de origen austriaco, por clase (jóvenes toros, bueyes, vacas, novillas en U3/R3/O3/E-P; cerdos S/E/U/S-P,
   cerdas, terneros, añojos), para Austria y para Baja Austria, Alta Austria y Estiria (la AMA no publica el resto de Länder por confidencialidad).
   Los PDF ya leídos se recuerdan en el propio fichero («ingested») y no se vuelven a descargar.
2. Continuación semanal: los informes de precios de la web (ama.at/marktinformationen/<sector>/preisberichte), que dan para Austria la cifra de la
   semana de vacuno (jóvenes toros, vacas y novillas E-P), cerdo (S, E, S-P), huevos (precio de centro de embalaje por sistema de cría, EUR/100) y
   pollo (precio de venta al por mayor, EUR/kg). La web solo enseña las últimas 8 semanas: el fichero acumula. En vacuno y cerdo continúan las
   mismas series nacionales que el PDF.
3. Abonos: precio medio mensual al agricultor de los abonos más usados (EUR/100 kg a granel, sin IVA), PDF de 2015-2025 y del año en curso.
Huecos de la fuente que se dejan como están: enero-abril de 2024 (el archivo de la AMA no tiene esos informes) y la semana 35 de 2026 en vacuno.
Valores tal cual; la fecha de cada punto es el lunes de la semana ISO. Si algo falla no se escribe nada.
Uso: update-at-ama.py [--out DIR] [--cache DIR]"""
import datetime, html, json, os, re, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
BASE = "https://www.ama.at"
ARCHIVE = BASE + "/marktinformationen/rinder/marktbericht"
SECTIONS = ["rinder", "schweine", "eier", "gefluegel"]
OUTNAME = "austria-ama-stats.json"
MON = {"jänner": 1, "januar": 1, "februar": 2, "feber": 2, "märz": 3, "april": 4, "mai": 5, "juni": 6, "juli": 7, "august": 8, "september": 9, "oktober": 10, "november": 11, "dezember": 12}
REG = {"Österreich": ("at", "Austria"), "Niederösterreich": ("noe", "Lower Austria"), "Oberösterreich": ("ooe", "Upper Austria"), "Steiermark": ("stmk", "Styria")}
# clase del informe -> (clave, etiqueta inglesa, unidad)
CLS = {"Jungstiere U3": ("young-bulls-u3", "young bulls U3"), "Jungstiere R3": ("young-bulls-r3", "young bulls R3"), "Jungstiere E-P": ("young-bulls-ep", "young bulls E-P"),
       "Ochsen U3": ("steers-u3", "steers U3"), "Ochsen R3": ("steers-r3", "steers R3"), "Ochsen E-P": ("steers-ep", "steers E-P"),
       "Kühe R3": ("cows-r3", "cows R3"), "Kühe O3": ("cows-o3", "cows O3"), "Kühe E-P": ("cows-ep", "cows E-P"),
       "Kalbinnen U3": ("heifers-u3", "heifers U3"), "Kalbinnen R3": ("heifers-r3", "heifers R3"), "Kalbinnen E-P": ("heifers-ep", "heifers E-P"),
       "Schweine S": ("pigs-s", "pigs S"), "Schweine E": ("pigs-e", "pigs E"), "Schweine U": ("pigs-u", "pigs U"), "Schweine S-P": ("pigs-sp", "pigs S-P"),
       "Zuchtsauen": ("sows", "sows"), "Kälber E-P": ("calves-ep", "calves E-P"), "Jungrinder E-P": ("young-cattle-ep", "young cattle E-P")}
WEB = {"Bodenhaltung (M)": ("eggs-barn-m", "eggs, barn, size M: packing-station price", "EUR/100 eggs"), "Freilandhaltung (M)": ("eggs-freerange-m", "eggs, free range, size M: packing-station price", "EUR/100 eggs"),
       "Bio-Haltung (M)": ("eggs-organic-m", "eggs, organic, size M: packing-station price", "EUR/100 eggs"),
       "grillfertig lose": ("chicken-whole", "chicken, whole oven-ready, loose: wholesale price", "EUR/kg"), "bratfertig auf Tasse": ("chicken-whole-tray", "chicken, whole on tray: wholesale price", "EUR/kg"),
       "Hühnerfilet": ("chicken-fillet", "chicken fillet: wholesale price", "EUR/kg")}
LOG = []; CACHE = None
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, name=None, tries=4):
    if CACHE and name and (CACHE / name).exists(): return (CACHE / name).read_bytes()
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r: b = r.read()
            if CACHE and name: (CACHE / name).write_bytes(b)
            time.sleep(0.5); return b
        except Exception as e:
            last = e
            if getattr(e, "code", None) == 404: break
            time.sleep(5 * (k + 1))
    raise RuntimeError("%s: %s" % (url, last))
def num(s):
    s = s.strip()
    if s in ("-", "", "–"): return None
    return float(s.replace(".", "").replace(",", "."))
def monday(d): return (d - datetime.timedelta(days=d.weekday())).isoformat()

def parse_pdf(b):
    """{(region, clase): (precio, animales)} y lunes de la semana del informe"""
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "a.pdf"; p.write_bytes(b)
        t = subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, timeout=120).stdout
    # «für die 34. Woche, 17. August 2026 bis …»; en Navidad sale un número doble «für die 51.+52. Woche, 15. Dezember 2025 bis 28. Dezember 2025»
    m = re.search(r"Preisbericht für die\s+(\d+)\.(?:\s*\+\s*(\d+)\.)?\s*Woche,\s*(\d+)\.\s*([A-Za-zÄÖÜäöü]+)\s+(\d{4})\s+bis", t)
    if not m: raise ValueError("sin cabecera «Preisbericht für die NN. Woche»")
    d = datetime.date(int(m.group(5)), MON[m.group(4).lower()], int(m.group(3)))
    wk = monday(d + datetime.timedelta(days=7)) if m.group(2) else monday(d)   # número doble: la columna «actual» es la segunda semana
    pw = (datetime.date.fromisoformat(wk) - datetime.timedelta(days=7)).isoformat()
    sec = t[m.start():]; e = re.search(r"\n\s*B\)\s*Preisbericht", sec); sec = sec[:e.start()] if e else sec[:20000]
    out = {}; reg = None
    for line in sec.splitlines():
        h = re.match(r"\s*(Österreich|Niederösterreich|Oberösterreich|Steiermark)\b(?:\s+\d\))?\s*(?:EUR/kg.*)?$", line)   # a veces «EUR/kg» va en la línea siguiente
        if h: reg = h.group(1); continue
        if not reg: continue
        r = re.match(r"\s*([A-Za-zÄÖÜäöü][A-Za-zÄÖÜäöü\- ]*?[0-9A-Z]?(?:-P)?)(?:\s+\d\))?\s{2,}([\d.,\-–]+)\s+([\d.,\-–]+)\s+([\d.,\-–]+)\s+([\d.,\-–]+)\s+([\d.,\-–]+)\s+([\d.,\-–]+)\s*$", line)
        if not r: continue
        name = re.sub(r"\s+", " ", r.group(1)).strip()
        if name not in CLS: continue
        out[(reg, name)] = (num(r.group(4)), num(r.group(5)), num(r.group(2)), num(r.group(3)))   # semana del informe y semana anterior
    if len([k for k in out if k[0] == "Österreich"]) < 12: raise ValueError("semana %s: solo %d clases de Austria" % (wk, len([k for k in out if k[0] == "Österreich"])))
    return wk, pw, out

def archive(state):
    page = get(ARCHIVE).decode("utf-8", "replace")
    L = re.findall(r'href="(/media/[^"]+\.pdf)"[^>]*>\s*<span>\s*Marktbericht Vieh und Fleisch[^<]*</span>', page)
    if len(L) < 50: raise RuntimeError("archivo de informes: solo %d PDF" % len(L))
    new = [u for u in dict.fromkeys(L) if u not in state["ingested"]]
    log("informes en el archivo: %d, nuevos: %d" % (len(set(L)), len(new)))
    for u in new:
        try: wk, pw, rows = parse_pdf(get(BASE + u, re.sub(r"[^A-Za-z0-9]", "_", u)))
        except Exception as e: log("aviso: %s no se pudo leer (%s)" % (u, e)); continue
        for (rg, nm), (p, q, p0, q0) in rows.items():
            k = "at-ama-%s-%s" % (REG[rg][0], CLS[nm][0])
            if p is not None: state["p"].setdefault(k, {})[wk] = p; state["own"].add((k, wk))
            if q is not None and rg == "Österreich": state["p"].setdefault(k + "-head", {})[wk] = q; state["own"].add((k + "-head", wk))
            # la columna de la semana anterior solo rellena una semana sin informe propio (nunca pisa la cifra del informe de esa semana)
            if p0 is not None and (k, pw) not in state["own"]: state["p"].setdefault(k, {}).setdefault(pw, p0)
            if q0 is not None and rg == "Österreich" and (k + "-head", pw) not in state["own"]: state["p"].setdefault(k + "-head", {}).setdefault(pw, q0)
        state["ingested"].append(u)

def week_monday(kw, pub):
    """lunes de la semana ISO kw a la que se refiere un informe publicado el día pub: la semana ya empezada más cercana antes de la
    publicación (como mucho 5 semanas antes), en el año ISO de la publicación o en el anterior (KW 52/53 publicadas en enero). Sin encaje: None."""
    iy = pub.isocalendar()[0]
    for y in (iy, iy - 1):
        try: mo = datetime.date.fromisocalendar(y, kw, 1)
        except ValueError: continue                      # KW 53 en un año ISO de 52 semanas
        if mo <= pub and (pub - mo).days <= 35: return mo.isoformat()
    return None

def web(state):
    n = 0
    for sec in SECTIONS:
        page = get(BASE + "/marktinformationen/%s/preisberichte" % sec).decode("utf-8", "replace")
        L = re.findall(r'href="(https://www\.ama\.at/marktinformationen/%s/preisberichte/[^"]+)".*?u-pill">\s*(\d{2})\.(\d{2})\.(\d{4})' % sec, page, flags=re.S)
        if not L: raise RuntimeError("%s: no hay informes de precios en la web" % sec)
        for url, dd, mm, yy in L:
            t = get(url).decode("utf-8", "replace"); i = t.find("<table"); j = t.find("</table>", i)
            if i < 0: log("aviso: %s sin tabla" % url); continue
            rows = [[html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, flags=re.S)] for r in re.findall(r"<tr.*?</tr>", t[i:j], flags=re.S)]
            m = re.search(r"KW\s*(\d+)", rows[0][0] if rows and rows[0] else "")
            if not m: log("aviso: %s sin semana" % url); continue
            wk = week_monday(int(m.group(1)), datetime.date(int(yy), int(mm), int(dd)))
            if not wk: log("aviso: %s: KW %s no encaja con la fecha %s.%s.%s; se omite" % (url, m.group(1), dd, mm, yy)); continue
            for r in rows[1:]:
                if len(r) < 2: continue
                nm = re.sub(r"\s+", " ", r[0]).strip()
                try: v = num(r[1])
                except ValueError: continue
                if v is None: continue
                if nm in CLS and sec in ("rinder", "schweine"): k = "at-ama-at-%s" % CLS[nm][0]
                elif nm in WEB: k = "at-ama-at-%s" % WEB[nm][0]
                else: log("aviso: fila desconocida «%s» en %s" % (nm, sec)); continue
                state["p"].setdefault(k, {})[wk] = v; n += 1
    log("informes web: %d valores" % n)

FERT_PAGE = BASE + "/marktinformationen/getreide-und-olsaaten/dungemittel"
MCOL = ["Jän", "Feb", "Mär|Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
def fert(state):
    """Precio medio al agricultor de los abonos más usados (EUR/100 kg a granel, sin IVA, media de Austria; «Quelle: AMA»), mensual: PDF de 2015-2025 y PDF del año
    en curso. Cada cifra se asigna al mes por su posición en la línea (las tablas tienen huecos cuando un abono no tuvo precio ese mes)."""
    page = get(FERT_PAGE).decode("utf-8", "replace")
    L = sorted(set(re.findall(r'href="(/media/[^"]*duengemittelpreise_(?:von_\d{4}_bis_\d{4}|monatsweise_ab_\d{4})\.pdf)"', page)))
    if not L: raise RuntimeError("no aparecen los PDF de precios de abonos")
    n = 0
    for u in L:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "f.pdf"; p.write_bytes(get(BASE + u, re.sub(r"[^A-Za-z0-9]", "_", u)))
            t = subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, timeout=120).stdout
        year, cols = None, None
        for line in t.splitlines():
            if re.fullmatch(r"\s*(20\d\d)\s*", line): year = int(line.strip()); cols = None; continue
            if year and re.search(r"\bJän\b", line) and re.search(r"\bFeb\b", line):
                cols = []
                for k, pat in enumerate(MCOL):
                    m = re.search(r"\b(?:%s)\b" % pat, line)
                    if m: cols.append((k + 1, (m.start() + m.end()) / 2))
                continue
            if not (year and cols) or line.strip().startswith("Quelle"): continue
            m = re.match(r"\s*([A-Za-zÄÖÜäöü][^\d]*?\d[\d/ %A-Za-z2O5.,]*?)\s{2,}(\d.*)$", line)
            name = None
            for nm in FERT:
                if line.strip().startswith(nm): name = nm; break
            if not name: continue
            for v in re.finditer(r"\d{1,3},\d{2}", line[line.find(name) + len(name):]):
                x = line.find(name) + len(name) + (v.start() + v.end()) / 2
                mo = min(cols, key=lambda c: abs(c[1] - x))
                if abs(mo[1] - x) > 6: continue   # cifra que no cae bajo ningún mes: no se adivina
                state["p"].setdefault("at-ama-at-fert-" + FERT[name], {})["%d-%02d" % (year, mo[0])] = num(v.group(0)); n += 1
    log("abonos: %d valores de %d PDF" % (n, len(L)))
FERT = {"Kalkammonsalpeter 27% N": "can-27", "Harnstoff 46% N": "urea-46", "Hyperkorn 26% P2O5": "hyperkorn-26", "Triplephosphat 45% P2O5": "tsp-45", "Kali 60% K2O": "potash-60",
        "Mischkalk 60% CaO": "lime-60", "Diammonphosphat 18/46/0": "dap-18-46-0", "PK Dünger 0/15/30": "pk-0-15-30", "PK Dünger 0/18/36": "pk-0-18-36", "PK Dünger 0/12/20": "pk-0-12-20",
        "Volldünger 15/15/15": "npk-15-15-15", "Volldünger 6/10/16": "npk-6-10-16", "Volldünger 20/8/8": "npk-20-8-8", "Volldünger 12/10/15": "npk-12-10-15", "Volldünger 14/10/20": "npk-14-10-20"}
FERT_EN = {"can-27": "calcium ammonium nitrate 27% N", "urea-46": "urea 46% N", "hyperkorn-26": "Hyperkorn (rock phosphate) 26% P2O5", "tsp-45": "triple superphosphate 45% P2O5",
           "potash-60": "potash 60% K2O", "lime-60": "mixed lime 60% CaO", "dap-18-46-0": "diammonium phosphate 18/46/0", "pk-0-15-30": "PK 0/15/30", "pk-0-18-36": "PK 0/18/36",
           "pk-0-12-20": "PK 0/12/20", "npk-15-15-15": "NPK 15/15/15", "npk-6-10-16": "NPK 6/10/16", "npk-20-8-8": "NPK 20/8/8", "npk-12-10-15": "NPK 12/10/15", "npk-14-10-20": "NPK 14/10/20"}

def build(state):
    out = []
    for k, pts in sorted(state["p"].items()):
        pl = sorted(pts.items())
        if len(pl) < 4: continue
        head = k.endswith("-head"); kk = k[:-5] if head else k
        rg = next(v for v in REG.values() if kk.startswith("at-ama-%s-" % v[0])); key = kk[len("at-ama-%s-" % rg[0]):]
        if key.startswith("fert-"):
            last = pl[-1][0]
            if int(last[:4]) < datetime.date.today().year - 1: continue   # abono que ya no se cotiza
            prev = pl[-2][1]
            out.append({"id": k, "group": "inputs", "label": "Austria, %s: farmer price, bulk, excl. VAT (AMA)" % FERT_EN[key[5:]], "unit": "EUR/100 kg", "frequency": "monthly",
                        "latestPeriod": last, "latest": pl[-1][1], "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl],
                        "sourceGroup": "AMA Agrarmarkt Austria"})
            continue
        if key in [c[0] for c in CLS.values()]:
            lab = [c[1] for c in CLS.values() if c[0] == key][0]
            if head: label, unit = "Austria, %s: animals slaughtered at reporting slaughterhouses, domestic origin (AMA)" % lab, "head"
            else: label, unit = "%s, %s: producer price, carcass weight, free slaughterhouse, excl. VAT (AMA)" % (rg[1], lab), "EUR/kg"
            group = "prices_lv"
        else:
            w = [v for v in WEB.values() if v[0] == key][0]; label, unit, group = "Austria, %s (AMA)" % w[1], w[2], "prices"
        prev = pl[-2][1]
        s = {"id": k, "group": group, "label": label, "unit": unit, "frequency": "weekly", "latestPeriod": pl[-1][0], "latest": pl[-1][1],
             "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None, "points": [[p, v] for p, v in pl], "sourceGroup": "AMA Agrarmarkt Austria"}
        if not head and group == "prices_lv" and rg[0] == "at" and key in ("young-bulls-ep", "cows-ep", "heifers-ep", "pigs-s", "pigs-e", "pigs-sp"):
            s["note"] = "Hasta la semana 34 de 2026, del Marktbericht semanal en PDF de la AMA; después, del informe de precios semanal de su web (misma cifra nacional)."
        out.append(s)
    return out

def main():
    global CACHE
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    if "--cache" in sys.argv: CACHE = Path(sys.argv[sys.argv.index("--cache") + 1]); CACHE.mkdir(parents=True, exist_ok=True)
    prev = outdir / OUTNAME; state = {"p": {}, "ingested": [], "own": set()}
    if prev.exists():
        d = json.loads(prev.read_text(encoding="utf-8")); state["ingested"] = d.get("ingested", [])
        for s in d["countries"]["AT"]["series"]: state["p"][s["id"]] = {p: v for p, v in s["points"]}
    try:
        archive(state); web(state); fert(state)
    except Exception as e: log("ERROR:", e, "; no se escribe nada"); return 1
    series = build(state)
    nat = [s for s in series if s["id"].startswith("at-ama-at-") and not s["id"].endswith("-head")]
    if len(nat) < 15: log("ERROR: solo %d series nacionales" % len(nat)); return 1
    last = max(s["latestPeriod"] for s in series)
    if last < (datetime.date.today() - datetime.timedelta(days=45)).isoformat(): log("ERROR: última semana %s demasiado antigua" % last); return 1
    src = {"name": "Agrarmarkt Austria (AMA), Marktinformation: weekly price reports and Marktbericht Vieh und Fleisch", "url": BASE + "/marktinformationen/", "license": "CC BY 4.0 (AMA data only)"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"AT": {"name": "Austria", "extend": True, "source": src, "series": series}}, "ingested": state["ingested"], "log": LOG[-15:]}
    outdir.mkdir(parents=True, exist_ok=True); tmp = outdir / (OUTNAME + ".tmp")
    tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / OUTNAME)
    log("escrito: %d series, última semana %s" % (len(series), last)); return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "austria-ama-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

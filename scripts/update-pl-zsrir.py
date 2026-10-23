#!/usr/bin/env python3
"""Polonia: boletines de precios del ZSRIR (Ministerio de Agricultura, dane.gov.pl, CC BY 4.0) -> data/poland-zsrir/*.json y data/poland-zsrir-stats.json.

Fase 1 (cereales y colza). Cada boletin semanal es un xlsx (lunes-domingo) que el ZSRIR publica los jueves; incluye el historico mensual y el semanal de varios anos.
  - cereales.json : precio de compra de 12 cereales (PLN/t), mensual desde 2006-10, y trigo de consumo semanal desde 2022.
  - colza.json    : precio de compra de la colza (PLN/t), mensual y semanal desde 2022.
Periodos semanales: AAAA-Www (semana ISO, por el domingo en que acaba la semana). Un valor 'nld', '---', '-' o vacio se omite; nada se estima ni se convierte.
Seguridad: el ultimo punto semanal se contrasta con la tabla resumen del propio boletin (misma semana); si no coincide el bloque no se publica y se conserva lo publicado.
Cada bloque es independiente. Formato comun: {schemaVersion, generatedAt, source, edition, tables:[{id, group, label, l, unit, note, series:[{id, label, l, points}]}]}."""
import datetime, io, json, re, sys, time, urllib.request, warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pl_zsrir_labels as LB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "poland-zsrir"
API = "https://api.dane.gov.pl/1.4/datasets/%s/resources?sort=-data_date&per_page=%d"
LOG = []
SRC = {"name": "ZSRIR (Ministerstwo Rolnictwa i Rozwoju Wsi) - boletines de mercado en dane.gov.pl", "url": "https://dane.gov.pl/pl/dataset/546", "license": "CC BY 4.0 (MRiRW, dane.gov.pl)"}
FILES = {
    "cereales.json": ("Cereales: precio de compra", "Precio de compra de 12 cereales (PLN/t), mensual desde 2006 y trigo de consumo semanal desde 2022 (ZSRIR)"),
    "colza.json": ("Colza: precio de compra", "Precio de compra de la semilla de colza (PLN/t), mensual y semanal desde 2022 (ZSRIR)"),
}
ROMAN = {m: i + 1 for i, m in enumerate("I II III IV V VI VII VIII IX X XI XII".split())}


def log(*a):
    s = " ".join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def fetch(url, tries=5, binary=False):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 DehesaIndex"}), timeout=200) as r:
                b = r.read()
                return b if binary else b.decode("utf-8", "replace")
        except Exception as e:
            last = e
            time.sleep(6 * (i + 1))
    raise RuntimeError("%s -> %s" % (url[-60:], str(last)[:140]))


def workbook(dataset, tries=4):
    """Descarga el boletin mas reciente que se pueda abrir. Devuelve (openpyxl workbook, fecha de publicacion, titulo)."""
    import openpyxl
    warnings.filterwarnings("ignore")
    lst = json.loads(fetch(API % (dataset, tries)))["data"]
    err = None
    for r in lst:
        a = r["attributes"]
        if str(a.get("format", "")).lower() != "xlsx" or not a.get("download_url"):
            continue
        try:
            wb = openpyxl.load_workbook(io.BytesIO(fetch(a["download_url"], binary=True)), data_only=True)
            return wb, a.get("data_date"), a.get("title")
        except Exception as ex:
            err = ex
            log("dataset %s: %s no se pudo abrir (%s)" % (dataset, a.get("title"), str(ex)[:80]))
    raise RuntimeError("dataset %s: ningun boletin legible (%s)" % (dataset, str(err)[:80]))


def num(x):
    if isinstance(x, bool):
        return None
    if isinstance(x, (int, float)):
        return float(x) if x == x else None
    if isinstance(x, str):
        s = x.strip().replace(",", ".")
        if re.fullmatch(r"-?\d+(\.\d+)?", s):
            return float(s)
    return None


def rnd(v, d=2):
    r = round(v, d)
    return int(r) if r == int(r) else r


def wk(d):
    y, w, _ = d.isocalendar()
    return "%d-W%02d" % (y, w)


def weekly(ws, c0=0, c1=999, min_year=2022):
    """Bloques anuales de dos columnas (ultimo dia de la semana, valor). Devuelve {año de la cabecera: {AAAA-Www: valor}} ya fusionado."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    pts = {}
    for c in range(c0, min(c1, len(rows[0]) if rows else 0)):
        col = [(i, r[c], r[c + 1] if c + 1 < len(r) else None) for i, r in enumerate(rows) if c < len(r)]
        dts = [(i, d, v) for i, d, v in col if isinstance(d, datetime.datetime)]
        if len(dts) < 40:
            continue
        for i, d, v in dts:
            x = num(v)
            if x is None or d.date().isocalendar()[0] < min_year or d.date() > datetime.date.today():
                continue
            pts[wk(d.date())] = (d.date(), rnd(x))
    return pts


def summary_weekly(ws, label_re):
    """Tabla resumen del boletin: fila cuyo titulo coincide -> {fecha ISO: valor} segun las cabeceras 'dd.mm' / año."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    last1 = ""
    for i, r in enumerate(rows):
        if len(r) > 1 and isinstance(r[1], str) and r[1].strip():
            last1 = r[1]
        parts = [last1 if (len(r) > 1 and not (isinstance(r[1], str) and r[1].strip())) else r[1]] if len(r) > 1 else []
        txt = re.sub(r"\s+", " ", " ".join([x for x in (parts + [r[0] if r else None, r[2] if len(r) > 2 else None]) if isinstance(x, str)])).strip()
        for c in range(1):
            if txt and re.search(label_re, txt, re.I) and len(txt) < 60:
                # cabecera: primera fila anterior con celdas 'dd.mm.yyyy' o 'dd.mm'
                for h in range(i - 1, -1, -1):
                    hs = [str(v).strip() if v is not None else "" for v in rows[h]]
                    dd = [(j, v) for j, v in enumerate(hs) if re.fullmatch(r"\d{2}\.\d{2}(\.\d{4})?", v)]
                    if dd:
                        out = {}
                        for j, v in dd:
                            m = re.fullmatch(r"(\d{2})\.(\d{2})(?:\.(\d{4}))?", v)
                            yr = m.group(3) or (str(rows[h + 1][j]).strip() if h + 1 < len(rows) else "")
                            if not re.fullmatch(r"\d{4}", str(yr)):
                                continue
                            try:
                                dt = datetime.date(int(yr), int(m.group(2)), int(m.group(1)))
                            except ValueError:
                                continue
                            val = num(rows[i][j]) if j < len(rows[i]) else None
                            if val is not None:
                                out.setdefault(dt.isoformat(), val)
                        return out
    return {}


def check_last(pts, summ, name):
    """El ultimo punto semanal debe coincidir con la misma semana del resumen del boletin (tolerancia 0,5 %)."""
    if not pts:
        raise RuntimeError("%s: sin puntos semanales" % name)
    k = max(pts)
    d, v = pts[k]
    s = summ.get(d.isoformat())
    if s is None:
        raise RuntimeError("%s: el resumen del boletin no trae la semana %s; no se puede contrastar" % (name, d))
    if abs(v - s) > max(0.5, abs(s) * 0.005):
        raise RuntimeError("%s: semana %s vale %s pero el resumen del boletin dice %s; no se publica" % (name, d, v, s))
    return d


def mk_series(sid, lab, pts, unit=None):
    p = sorted(([k, v] for k, v in pts.items() if v is not None), key=lambda x: x[0])
    return {"id": sid, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "points": p}


def mk_table(tid, group, lab, unit, note, ser):
    ser = [s for s in ser if len(s["points"]) >= 2]
    return {"id": tid, "group": group, "label": lab[0], "l": {"en": lab[1], "fr": lab[2], "it": lab[3]}, "unit": unit, "note": note, "series": ser}


def doc(tabs, edition, now):
    return {"schemaVersion": 1, "generatedAt": now, "source": SRC, "edition": edition, "tables": tabs}


def monthly_dates(ws, hdr_re="MC/ROK"):
    """Hoja con fechas mensuales en filas: devuelve ({columna: nombre}, [(fecha, fila)])."""
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next((i for i, r in enumerate(rows) if any(isinstance(x, str) and re.fullmatch(hdr_re, x.strip()) for x in r)), None)
    if h is None:
        raise RuntimeError("cabecera mensual no encontrada")
    names = {}
    for c, x in enumerate(rows[h]):
        if isinstance(x, str) and x.strip() and not re.fullmatch(hdr_re, x.strip()):
            names[c] = re.sub(r"\s+", " ", x).strip()
    data = []
    for r in rows[h + 1:]:
        d = next((x for x in r[:3] if isinstance(x, datetime.datetime)), None)
        if d is None:
            if data:
                break
            continue
        data.append((d, r))
    return names, data


# ------------------------------------------------------------ bloques
def cereales():
    wb, dd, title = workbook("546")
    names, data = monthly_dates(wb["ZAKUP WYKRESY MCE"])
    ser = []
    miss = []
    for c, nm in names.items():
        meta = LB.CEREALS.get(nm)
        if not meta:
            miss.append(nm)
            continue
        pts = {}
        for d, r in data:
            x = num(r[c]) if c < len(r) else None
            if x is not None:
                pts["%d-%02d" % (d.year, d.month)] = rnd(x)
        ser.append(mk_series("pl-cer-m-" + meta[0], meta[1], pts))
    if miss:
        log("cereales: cabeceras sin traduccion (no se publican): %s" % miss)
    if not ser:
        raise RuntimeError("cereales: ninguna serie mensual")
    tabs = [mk_table("cereales-mensual", "cereales", ("Cereales: precio de compra, mensual", "Cereals: purchase price, monthly", "Céréales : prix d'achat, mensuel", "Cereali: prezzo d'acquisto, mensile"), "PLN/t", "Precio medio mensual de compra de grano en empresas (ZSRIR); sin IVA", ser)]
    wsw = wb["ZAKUP WYKRESY TYG."]
    zz = wb["ZAKUP ZIARNA"]
    pts = weekly(wsw, 2, 13)
    summ = check_last(pts, summary_weekly(zz, r"\bPszenica konsumpcyjna"), "trigo semanal")
    mz = weekly(wsw, 14, 25)
    check_last(mz, summary_weekly(zz, r"\bKukurydza sucha"), "maiz semanal")
    tabs.append(mk_table("cereales-semanal", "cereales", ("Trigo de consumo y maíz: precio semanal", "Food wheat and maize: weekly price", "Blé de consommation et maïs : prix hebdomadaire", "Frumento di consumo e mais: prezzo settimanale"), "PLN/t", "Precio medio semanal de compra, semana de lunes a domingo (ZSRIR)", [mk_series("pl-cer-w-pszenica-kons", LB.WHEAT_WEEK, {k: v[1] for k, v in pts.items()}), mk_series("pl-cer-w-kukurydza", LB.MAIZE_WEEK, {k: v[1] for k, v in mz.items()})]))
    return "semana %s" % summ.isoformat(), tabs


def colza():
    wb, dd, title = workbook("957")
    ws = wb["CENY_MIESIĘCZNE"]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next(i for i, r in enumerate(rows) if any(isinstance(x, str) and x.strip() == "MIESIĄC" for x in r))
    cols = {}
    for c, x in enumerate(rows[h]):
        n = num(x) if not isinstance(x, str) else num(x.strip())
        if n and 2000 <= n <= 2100:
            cols[c] = int(n)
    pts = {}
    for r in rows[h + 1:h + 13]:
        m = ROMAN.get(str(r[1]).strip())
        if not m:
            continue
        for c, y in cols.items():
            x = num(r[c]) if c < len(r) else None
            if x is not None:
                pts["%d-%02d" % (y, m)] = rnd(x)
    tabs = [mk_table("colza-mensual", "colza", ("Colza: precio de compra, mensual", "Rapeseed: purchase price, monthly", "Colza : prix d'achat, mensuel", "Colza: prezzo d'acquisto, mensile"), "PLN/t", "Precio medio mensual de compra de semilla de colza (ZSRIR)", [mk_series("pl-colza-m-semilla", LB.RAPE_MONTH, pts)])]
    wp = weekly(wb["WYKRES RZEPAK"])
    summ = check_last(wp, summary_weekly(wb["ZAKUP RZEPAKU, SPRZEDAŻ "], r"\bNasiona rzepaku"), "colza semanal")
    tabs.append(mk_table("colza-semanal", "colza", ("Colza: precio de compra, semanal", "Rapeseed: purchase price, weekly", "Colza : prix d'achat, hebdomadaire", "Colza: prezzo d'acquisto, settimanale"), "PLN/t", "Precio medio semanal de compra de semilla de colza, semana de lunes a domingo (ZSRIR)", [mk_series("pl-colza-w-semilla", LB.RAPE_WEEK, {k: v[1] for k, v in wp.items()})]))
    return "semana %s" % summ.isoformat(), tabs


# ------------------------------------------------------------ estadisticas (catalogo): solo series mensuales
def load(name):
    p = OUT / name
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def one(d, tid, sid):
    t = next((t for t in (d or {"tables": []})["tables"] if t["id"] == tid), None)
    return next((s for s in (t or {"series": []})["series"] if s["id"] == sid), None)


def stats(docs, now):
    out = []

    def add(sid, grp, label, unit, s, minpts=24):
        if not s or len(s["points"]) < minpts:
            return
        p = s["points"]
        per = p[-1][0]
        prev = next((v for k, v in p if k == "%d%s" % (int(per[:4]) - 1, per[4:])), None)
        ch = round((p[-1][1] / prev - 1) * 100, 2) if prev else None
        out.append({"id": sid, "group": grp, "label": label, "unit": unit, "frequency": "monthly", "latestPeriod": per, "latest": p[-1][1], "changePct": ch, "points": p, "sourceGroup": "poland-zsrir"})

    c = docs.get("cereales.json")
    for key, (code, lab) in LB.CEREALS.items():
        if code in ("pszenica-kons", "pszenica-pasz", "zyto-kons", "jeczmien-pasz", "kukurydza-sucha"):
            add("pl-zsrir-cer-" + code, "prices", "%s, precio de compra, Polonia (ZSRIR)" % lab[0], "PLN/t", one(c, "cereales-mensual", "pl-cer-m-" + code))
    add("pl-zsrir-colza", "prices", "Colza (semilla), precio de compra, Polonia (ZSRIR)", "PLN/t", one(docs.get("colza.json"), "colza-mensual", "pl-colza-m-semilla"), 36)
    return {"schemaVersion": 1, "generatedAt": now, "countries": {"PL": {"name": "Polonia", "extend": True, "source": SRC, "series": out}}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    docs = {n: load(n) for n in FILES}
    new = False
    for name, fn in (("cereales", cereales), ("colza", colza)):
        try:
            ed, tabs = fn()
            old = docs.get(name + ".json")
            if old and old.get("tables") == tabs:
                log("%s: sin cambios (%s)" % (name, ed))
            else:
                docs[name + ".json"] = doc(tabs, ed, now)
                new = True
                log("%s: leido (%s, %d tablas, %d series)" % (name, ed, len(tabs), sum(len(t["series"]) for t in tabs)))
        except Exception as ex:
            log("%s: NO se pudo leer (%s); se conserva lo publicado" % (name, str(ex)[:220]))
        time.sleep(2)
    files = []
    for n, (title, desc) in FILES.items():
        d = docs.get(n)
        if not d:
            continue
        files.append({"file": n, "title": title, "description": desc, "edition": d["edition"], "tables": len(d["tables"]), "series": sum(len(t["series"]) for t in d["tables"]), "generatedAt": d["generatedAt"]})
    if not files:
        log("sin datos; no se escribe nada")
        (ROOT / "data" / "poland-zsrir-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")
        sys.exit(1)
    if not new and (OUT / "index.json").exists():
        log("ningun boletin nuevo; no se reescribe nada")
        return
    for n in FILES:
        if docs.get(n):
            (OUT / n).write_text(json.dumps(docs[n], ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": SRC, "files": files}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    st = stats(docs, now)
    (ROOT / "data" / "poland-zsrir-stats.json").write_text(json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    log("escrito: %d ficheros, %d series en las estadisticas" % (len(files), len(st["countries"]["PL"]["series"])))
    (ROOT / "data" / "poland-zsrir-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

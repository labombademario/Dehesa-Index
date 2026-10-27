#!/usr/bin/env python3
"""Francia: clima mensual por departamento a partir de las estaciones de Météo-France -> data/fr-climate-departements.json

Fuente: «Données climatologiques de base - mensuelles» (Météo-France, data.gouv.fr, Licence Ouverte 2.0):
  https://www.data.gouv.fr/fr/datasets/donnees-climatologiques-de-base-mensuelles/
  ficheros por departamento MENSQ_<dep>_previous-1950-<año-2>.csv.gz y MENSQ_<dep>_latest-<año-1>-<año>.csv.gz (las URL se leen de la API de data.gouv).
Método (cálculo de Dehesa Index con datos de estaciones, no un producto de Météo-France):
  - Por estación y mes: precipitación RR (mm) si el mes tiene todos los días de lluvia medidos (NBRR = días del mes); temperatura media
    (TX+TN)/2 si TX y TN tienen todos los días (NBTX = NBTN = días del mes). Así un mes en curso o con huecos no cuenta.
  - Normal de cada estación y mes del año: media 1991-2020 (periodo normal de la OMM), exigiendo 20 años completos de ese mes.
  - Valor del departamento en un mes: media de las estaciones con dato ese mes y con normal. Anomalía de precipitación = media del mes / media
    de las normales de esas mismas estaciones − 1 (en %); anomalía de temperatura = media de (valor − normal) de cada estación. Así un cambio en el
    conjunto de estaciones no crea anomalías falsas. Se exige un mínimo de 3 estaciones para la lluvia y 2 para la temperatura.
  - Solo Francia metropolitana: 95 unidades (Météo-France publica Córcega, 2A y 2B, en un solo fichero «20», que se trata como una unidad). Historial mensual desde 2001.
Si faltan más de 5 departamentos o algo falla, no se escribe nada y se conserva el fichero anterior.
Uso: update-fr-climate-departements.py [--out DIR] [--cache DIR] [--only 01,02]"""
import calendar, csv, datetime, gzip, io, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
API = "https://www.data.gouv.fr/api/1/datasets/donnees-climatologiques-de-base-mensuelles/"
PAGE = "https://www.data.gouv.fr/fr/datasets/donnees-climatologiques-de-base-mensuelles/"
DEPTS = {"01": ("Ain", "ARA"), "02": ("Aisne", "HDF"), "03": ("Allier", "ARA"), "04": ("Alpes-de-Haute-Provence", "PAC"), "05": ("Hautes-Alpes", "PAC"), "06": ("Alpes-Maritimes", "PAC"),
 "07": ("Ardèche", "ARA"), "08": ("Ardennes", "GES"), "09": ("Ariège", "OCC"), "10": ("Aube", "GES"), "11": ("Aude", "OCC"), "12": ("Aveyron", "OCC"), "13": ("Bouches-du-Rhône", "PAC"),
 "14": ("Calvados", "NOR"), "15": ("Cantal", "ARA"), "16": ("Charente", "NAQ"), "17": ("Charente-Maritime", "NAQ"), "18": ("Cher", "CVL"), "19": ("Corrèze", "NAQ"),
 "20": ("Corse (2A et 2B)", "COR"), "21": ("Côte-d'Or", "BFC"), "22": ("Côtes-d'Armor", "BRE"), "23": ("Creuse", "NAQ"), "24": ("Dordogne", "NAQ"),
 "25": ("Doubs", "BFC"), "26": ("Drôme", "ARA"), "27": ("Eure", "NOR"), "28": ("Eure-et-Loir", "CVL"), "29": ("Finistère", "BRE"), "30": ("Gard", "OCC"), "31": ("Haute-Garonne", "OCC"),
 "32": ("Gers", "OCC"), "33": ("Gironde", "NAQ"), "34": ("Hérault", "OCC"), "35": ("Ille-et-Vilaine", "BRE"), "36": ("Indre", "CVL"), "37": ("Indre-et-Loire", "CVL"), "38": ("Isère", "ARA"),
 "39": ("Jura", "BFC"), "40": ("Landes", "NAQ"), "41": ("Loir-et-Cher", "CVL"), "42": ("Loire", "ARA"), "43": ("Haute-Loire", "ARA"), "44": ("Loire-Atlantique", "PDL"), "45": ("Loiret", "CVL"),
 "46": ("Lot", "OCC"), "47": ("Lot-et-Garonne", "NAQ"), "48": ("Lozère", "OCC"), "49": ("Maine-et-Loire", "PDL"), "50": ("Manche", "NOR"), "51": ("Marne", "GES"), "52": ("Haute-Marne", "GES"),
 "53": ("Mayenne", "PDL"), "54": ("Meurthe-et-Moselle", "GES"), "55": ("Meuse", "GES"), "56": ("Morbihan", "BRE"), "57": ("Moselle", "GES"), "58": ("Nièvre", "BFC"), "59": ("Nord", "HDF"),
 "60": ("Oise", "HDF"), "61": ("Orne", "NOR"), "62": ("Pas-de-Calais", "HDF"), "63": ("Puy-de-Dôme", "ARA"), "64": ("Pyrénées-Atlantiques", "NAQ"), "65": ("Hautes-Pyrénées", "OCC"),
 "66": ("Pyrénées-Orientales", "OCC"), "67": ("Bas-Rhin", "GES"), "68": ("Haut-Rhin", "GES"), "69": ("Rhône", "ARA"), "70": ("Haute-Saône", "BFC"), "71": ("Saône-et-Loire", "BFC"),
 "72": ("Sarthe", "PDL"), "73": ("Savoie", "ARA"), "74": ("Haute-Savoie", "ARA"), "75": ("Paris", "IDF"), "76": ("Seine-Maritime", "NOR"), "77": ("Seine-et-Marne", "IDF"), "78": ("Yvelines", "IDF"),
 "79": ("Deux-Sèvres", "NAQ"), "80": ("Somme", "HDF"), "81": ("Tarn", "OCC"), "82": ("Tarn-et-Garonne", "OCC"), "83": ("Var", "PAC"), "84": ("Vaucluse", "PAC"), "85": ("Vendée", "PDL"),
 "86": ("Vienne", "NAQ"), "87": ("Haute-Vienne", "NAQ"), "88": ("Vosges", "GES"), "89": ("Yonne", "BFC"), "90": ("Territoire de Belfort", "BFC"), "91": ("Essonne", "IDF"),
 "92": ("Hauts-de-Seine", "IDF"), "93": ("Seine-Saint-Denis", "IDF"), "94": ("Val-de-Marne", "IDF"), "95": ("Val-d'Oise", "IDF")}
NORMAL = (1991, 2020); HIST_FROM = "2001-01"; MIN_P, MIN_T = 3, 2
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=4):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=300).read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %r" % (url[:140], last))
def urls():
    d = json.loads(get(API))
    out = {}
    for r in d["resources"]:
        m = re.search(r"MENSQ_(\w+?)_(previous|latest)-(\d{4})-(\d{4})\.csv\.gz$", r["url"])
        if m and m.group(1) in DEPTS: out.setdefault(m.group(1), {})[m.group(2)] = r["url"]
    return out
def fnum(s):
    s = (s or "").strip()
    if not s: return None
    try: return float(s)
    except ValueError: return None
def read(raw, acc, names):
    """acc[station][AAAA-MM] = (rr|None, tm|None)"""
    txt = gzip.decompress(raw).decode("utf-8", "replace")
    rd = csv.reader(io.StringIO(txt), delimiter=";"); h = next(rd); ix = {k: i for i, k in enumerate(h)}
    need = ["NUM_POSTE", "NOM_USUEL", "AAAAMM", "RR", "NBRR", "TX", "NBTX", "TN", "NBTN"]
    miss = [k for k in need if k not in ix]
    if miss: raise ValueError("faltan columnas %s" % miss)
    for r in rd:
        ym = r[ix["AAAAMM"]]
        if ym < "199101": continue
        y, m = int(ym[:4]), int(ym[4:6]); nd = calendar.monthrange(y, m)[1]; p = "%d-%02d" % (y, m)
        rr = fnum(r[ix["RR"]]) if fnum(r[ix["NBRR"]]) == nd else None
        tx, tn = fnum(r[ix["TX"]]), fnum(r[ix["TN"]])
        tm = (tx + tn) / 2.0 if tx is not None and tn is not None and fnum(r[ix["NBTX"]]) == nd and fnum(r[ix["NBTN"]]) == nd else None
        if rr is None and tm is None: continue
        st = r[ix["NUM_POSTE"]]; names[st] = r[ix["NOM_USUEL"]]
        acc.setdefault(st, {})[p] = (rr, tm)
def dept_series(acc):
    """Normales por estación y valores del departamento por mes."""
    norm = {}
    for st, d in acc.items():
        for k in (0, 1):
            for mo in range(1, 13):
                vals = [v[k] for p, v in d.items() if v[k] is not None and int(p[5:]) == mo and NORMAL[0] <= int(p[:4]) <= NORMAL[1]]
                if len(vals) >= 20: norm.setdefault(st, {})[(k, mo)] = sum(vals) / len(vals)
    periods = sorted({p for d in acc.values() for p in d if p >= HIST_FROM})
    out = {}
    for p in periods:
        mo = int(p[5:]); rp, rn, ta, tv, tn_ = [], [], [], [], []
        for st, d in acc.items():
            v = d.get(p); nm = norm.get(st, {})
            if not v: continue
            if v[0] is not None and (0, mo) in nm: rp.append(v[0]); rn.append(nm[(0, mo)])
            if v[1] is not None and (1, mo) in nm: tv.append(v[1]); ta.append(v[1] - nm[(1, mo)]); tn_.append(nm[(1, mo)])
        rec = {}
        if len(rp) >= MIN_P and sum(rn) > 0:
            mp, mn = sum(rp) / len(rp), sum(rn) / len(rn)
            rec.update(precipMm=round(mp, 1), precipBaselineMm=round(mn, 1), precipAnomalyPct=round((mp / mn - 1) * 100, 1), nPrecip=len(rp))
        if len(tv) >= MIN_T:
            rec.update(tempC=round(sum(tv) / len(tv), 1), tempBaselineC=round(sum(tn_) / len(tn_), 1), tempAnomalyC=round(sum(ta) / len(ta), 2), nTemp=len(tv))
        if rec: out[p] = rec
    return out, sum(1 for st in norm if any(k == 0 for k, _ in norm[st])), sum(1 for st in norm if any(k == 1 for k, _ in norm[st]))
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    cache = Path(sys.argv[sys.argv.index("--cache") + 1]) if "--cache" in sys.argv else None
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
    try: U = urls()
    except Exception as e:
        # la API de data.gouv a veces corta la conexión; los ficheros están en el almacén de Météo-France con un nombre fijo por año
        y = datetime.date.today().year; S3 = "https://meteofrance.s3.sbg.io.cloud.ovh.net/data/synchro_ftp/BASE/MENS/MENSQ_%s_%s.csv.gz"
        log("AVISO: lista de data.gouv no disponible (%s); se usan los nombres de fichero de Météo-France" % str(e)[:80])
        U = {d: {"previous": S3 % (d, "previous-1950-%d" % (y - 2)), "latest": S3 % (d, "latest-%d-%d" % (y - 1, y))} for d in DEPTS}
    deps, missing = [], []
    today = datetime.date.today(); last_closed = (today.replace(day=1) - datetime.timedelta(days=1)).strftime("%Y-%m")
    for dep, (name, reg) in DEPTS.items():
        if only and dep not in only: continue
        u = U.get(dep, {})
        if "previous" not in u or "latest" not in u: log("AVISO: %s sin ficheros previous/latest" % dep); missing.append(dep); continue
        acc, names = {}, {}
        try:
            for k in ("previous", "latest"):
                f = cache / u[k].rsplit("/", 1)[1] if cache else None
                raw = f.read_bytes() if f and f.exists() else get(u[k])
                if cache and f and not f.exists(): f.write_bytes(raw)
                read(raw, acc, names)
        except Exception as e: log("AVISO: %s: %s" % (dep, e)); missing.append(dep); continue
        ser, np_, nt = dept_series(acc)
        ser = {p: v for p, v in ser.items() if p <= last_closed}
        y0, m0 = int(last_closed[:4]), int(last_closed[5:]); first_recent = "%d-%02d" % ((y0 - 1, m0) if m0 > 0 else (y0 - 1, 12))
        months = [dict(period=p, **ser[p]) for p in sorted(ser) if p >= first_recent]   # solo los últimos 13 meses cerrados: un departamento sin estaciones recientes no se muestra con un dato viejo
        if not months: log("AVISO: %s (%s) sin estaciones suficientes en los últimos 13 meses" % (dep, name)); missing.append(dep); continue
        allp = sorted(ser); hp = []
        y, m = int(HIST_FROM[:4]), int(HIST_FROM[5:]); P, T = [], []
        while "%d-%02d" % (y, m) <= allp[-1]:
            v = ser.get("%d-%02d" % (y, m), {}); pa, ta = v.get("precipAnomalyPct"), v.get("tempAnomalyC")
            P.append(None if pa is None else round(pa)); T.append(None if ta is None else round(ta, 1))
            m += 1
            if m > 12: y, m = y + 1, 1
        deps.append({"id": dep, "name": name, "region": reg, "stationsPrecip": np_, "stationsTemp": nt, "months": months,
                     "history": {"from": HIST_FROM, "precipAnomalyPct": P, "tempAnomalyC": T}})
        log("%s %s: %d estaciones lluvia, %d temperatura; último %s" % (dep, name, np_, nt, months[-1]["period"]))
    if only: log("modo --only: no se escribe"); return 0
    if len(missing) > 5: log("ERROR: faltan %d departamentos (%s); no se escribe nada" % (len(missing), ",".join(missing))); return 1
    lp = max(d["months"][-1]["period"] for d in deps)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "lastPeriod": lp, "baseline": "%d-%d" % NORMAL,
           "source": {"id": "meteo_france", "name": "Météo-France, Données climatologiques de base - mensuelles (data.gouv.fr)", "url": PAGE, "license": "Licence Ouverte 2.0"},
           "methodology": {
             "es": "Media de las estaciones de Météo-France de cada departamento con el mes completo (lluvia todos los días; temperaturas máximas y mínimas todos los días), comparada con la normal 1991-2020 de esas mismas estaciones. La precipitación se da en mm y como % sobre lo normal; la temperatura media ((máxima+mínima)/2) en °C y como diferencia con lo normal. Cálculo de Dehesa Index con datos de Météo-France; se exigen al menos 3 estaciones para la lluvia y 2 para la temperatura. Solo meses cerrados.",
             "en": "Average of the Météo-France stations in each département with a complete month (rainfall every day; daily maximum and minimum temperatures every day), compared with the 1991-2020 normal of those same stations. Precipitation is shown in mm and as % of normal; mean temperature ((max+min)/2) in °C and as the difference from normal. Calculated by Dehesa Index from Météo-France data; at least 3 stations are required for rainfall and 2 for temperature. Closed months only.",
             "fr": "Moyenne des stations Météo-France de chaque département ayant un mois complet (précipitations tous les jours ; températures maximales et minimales tous les jours), comparée à la normale 1991-2020 de ces mêmes stations. Les précipitations sont en mm et en % de la normale ; la température moyenne ((max+min)/2) en °C et en écart à la normale. Calcul de Dehesa Index à partir des données de Météo-France ; au moins 3 stations pour la pluie et 2 pour la température. Mois clos uniquement.",
             "it": "Media delle stazioni di Météo-France di ogni dipartimento con il mese completo (pioggia tutti i giorni; temperature massime e minime tutti i giorni), confrontata con la normale 1991-2020 delle stesse stazioni. Le precipitazioni sono in mm e in % rispetto alla norma; la temperatura media ((max+min)/2) in °C e come scarto dalla norma. Calcolo di Dehesa Index su dati di Météo-France; servono almeno 3 stazioni per la pioggia e 2 per la temperatura. Solo mesi chiusi."},
           "missing": missing, "departements": deps, "log": LOG[-15:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "fr-climate-departements.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "fr-climate-departements.json")
    log("escrito: %d departamentos, último %s" % (len(deps), lp))
    return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv and "--only" not in sys.argv:
        try: (ROOT / "data" / "fr-climate-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)

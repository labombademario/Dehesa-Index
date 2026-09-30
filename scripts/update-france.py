#!/usr/bin/env python3
"""Francia (FranceAgriMer / VISIONet, Licence Ouverte 2.0) -> data/france-stats.json
Solo conjuntos con licencia explícita lov2 en data.gouv.fr:
  - Prix des céréales françaises (cotizaciones diarias desde 2001)
  - Historique des prix payés aux producteurs (trimestral, campaña acumulada, desde 2004/05)
  - Séries chronologiques cotations viandes (síntesis semanal nacional)
No se usan conjuntos 'notspecified'. Las series diarias se reducen a la última cotización de cada semana.
"""
import datetime, io, json, re, statistics, sys, time, urllib.parse, urllib.request, http.cookiejar
import openpyxl
try:
    import xlrd
except Exception:
    xlrd = None

B = 'https://visionet.franceagrimer.fr/Pages/'
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)

def req(u, data=None, raw=False):
    last = None
    for i in range(3):
        try:
            d = urllib.parse.urlencode(data).encode() if data else None
            r = urllib.request.Request(u, data=d, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex', 'Accept': '*/*', 'Accept-Language': 'fr,en'})
            with op.open(r, timeout=120) as x:
                b = x.read()
            return b if raw else b.decode('utf-8', 'replace')
        except Exception as e:
            last = e; time.sleep(4)
    raise RuntimeError('%s -> %s' % (u, last))

def listing(menu):
    req(B + 'SeriesChronologiques.aspx?menuurl=' + urllib.parse.quote(menu))
    r = req(B + 'SeriesChronologiquesDetail.aspx', dict(niveau='1', dossierRacine='SeriesChronologiques', menuId='', menuTitre=menu.split('/')[-1], menuUrl=menu, niveauMax='4'))
    return list(dict.fromkeys(urllib.parse.unquote(x) for x in re.findall(r'fileurl=([^"\'&<> ]+)', r)))

def download(fileurl):
    return req(B + 'OpenDocument.aspx?fileurl=' + urllib.parse.quote(fileurl) + '&telechargersanscomptage=oui', raw=True)

EPOCH = datetime.date(1899, 12, 30)
def to_date(v):
    if isinstance(v, (int, float)) and 20000 < v < 80000:
        return EPOCH + datetime.timedelta(days=int(v))
    if isinstance(v, datetime.datetime): return v.date()
    if isinstance(v, datetime.date): return v
    return None
def num(v):
    if isinstance(v, bool) or v is None or v == '': return None
    if isinstance(v, (int, float)): return float(v)
    try: return float(str(v).replace(',', '.'))
    except Exception: return None

def sheets_of(b, name):
    """-> {sheet: [[cells]]} para xls o xlsx"""
    out = {}
    if b[:4] == b'PK\x03\x04':
        wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
        for ws in wb.worksheets:
            out[ws.title] = [list(r) for r in ws.iter_rows(values_only=True)]
    else:
        if xlrd is None: raise RuntimeError('falta xlrd')
        wb = xlrd.open_workbook(file_contents=b)
        for sh in wb.sheets():
            out[sh.name] = [[(c if c != '' else None) for c in sh.row_values(i)] for i in range(sh.nrows)]
    return out

def weekly(obs):
    """obs: [(date, value)] -> última observación de cada semana ISO -> [[iso, v]]"""
    g = {}
    for d, v in sorted(obs):
        y, w, _ = d.isocalendar(); g[(y, w)] = (d, v)
    return [[d.isoformat(), round(v, 3)] for _, (d, v) in sorted(g.items())]

def series(sid, group, label, unit, freq, pts, extra=None):
    if len(pts) < 2: return None
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts)
    if extra: s.update(extra)
    return s

OUT = []
def add(s):
    if not s: return
    if s['frequency'] == 'weekly':
        last = datetime.date.fromisoformat(s['latestPeriod'])
        if (datetime.date.today() - last).days > 550:
            log('descartada (discontinuada)', s['label'], s['latestPeriod']); return
    OUT.append(s)

def clean(h):
    return re.sub(r'\s+', ' ', str(h or '')).strip()

# ---------- 1) Cereales: cotizaciones diarias ----------
SPECIES = {'BT': ('Soft wheat', 'soft-wheat'), 'OR': ('Feed barley', 'barley'), 'BD': ('Durum wheat', 'durum'), 'MA': ('Maize', 'maize')}
TRANS = [('Blé tendre', 'Soft wheat'), ('Orges Fourragère', 'Feed barley'), ('Blé dur', 'Durum wheat'), ('Maïs', 'Maize'),
         ('Rendu', 'delivered'), ('Supérieur', 'Superior'), ('Médium', 'Medium'), ('Base juillet', 'July basis'), ('Méditerranée', 'Mediterranean'),
         ('Rhin', 'Rhine'), ('Atlantique', 'Atlantic'), ('Fourragère', 'feed')]
def en(h):
    for a, b in TRANS: h = h.replace(a, b)
    return h

def cereals():
    files = [f for f in listing('SeriesChronologiques/productions vegetales/grandes cultures/cotations') if 'SCR-COT-CER_FR' in f]
    log('cereales ficheros', files)
    files.sort(key=lambda f: (f.endswith('.xls'),), reverse=True)  # .xls verificado primero
    data = None
    for f in files:
        try:
            sh = sheets_of(download(f), f)
            if any(k.startswith('BT_') for k in sh): data = sh; log('usando', f); break
        except Exception as e:
            log('ERR', f, e)
    if not data: raise RuntimeError('sin fichero de cereales')
    merged = {}  # (sp, header) -> {date: value}
    order = []
    for name, rows in data.items():
        m = re.match(r'(BT|OR|BD|MA)_', name)
        if not m or len(rows) < 3: continue
        sp = m.group(1); hdr, units = rows[0], rows[1]
        cols = []
        seen = {}
        for j, h in enumerate(hdr):
            u = clean(units[j] if j < len(units) else '')
            if not re.match(r'^\(?€/t\)?$', u): continue
            k = clean(h)
            if not k: continue
            seen[k] = seen.get(k, 0) + 1
            cols.append((j, k if seen[k] == 1 else '%s #%d' % (k, seen[k])))
        for j, k in cols:
            key = (sp, k)
            if key not in merged: merged[key] = {}; order.append(key)
            for r in rows[2:]:
                d = to_date(r[0]) if r else None
                v = num(r[j]) if d and j < len(r) else None
                if v is None or not (60 <= v <= 900): continue
                merged[key][d] = v
    for key in order:
        sp, k = key
        obs = list(merged[key].items())
        if len(obs) < 50: log('descartada', key, len(obs)); continue
        pts = weekly(obs)
        label = '%s: %s' % (SPECIES[sp][0], en(k).replace(SPECIES[sp][0] + ' ', '').replace('  ', ' ').strip())
        sid = 'fr-cot-%s-%s' % (SPECIES[sp][1], re.sub(r'[^a-z0-9]+', '-', k.lower()).strip('-')[:40])
        add(series(sid, 'quotes', label, '€/t', 'weekly', pts, {'sourceGroup': 'FranceAgriMer – cotations des céréales'}))
        log('cereal', label, len(pts), pts[0][0], pts[-1])

# ---------- 2) Precios pagados a productor (trimestral, campaña acumulada) ----------
PAID = {'Blé tendre': 'Soft wheat', 'Blé dur': 'Durum wheat', 'Orges': 'Barley', 'Maïs': 'Maize', 'Colza': 'Rapeseed', 'Tournesol': 'Sunflower seed', 'Pois': 'Peas', 'Soja': 'Soybeans', 'Avoine': 'Oats', 'Triticale': 'Triticale', 'Seigle': 'Rye', 'Sorgho': 'Sorghum', 'Féverole': 'Faba beans'}
def paid():
    files = [f for f in listing('SeriesChronologiques/productions vegetales/grandes cultures/prix payés aux producteurs') if 'HISTOPRIXTRIMESTRIELS' in f]
    log('pagados ficheros', files)
    if not files: raise RuntimeError('sin fichero de precios pagados')
    sh = sheets_of(download(sorted(files)[-1]), 'paid')
    rows = sh['Publication nationale']
    hi = next(i for i, r in enumerate(rows) if r and str(r[0]).startswith('Trimestre'))
    hdr = rows[hi]
    for j, h in enumerate(hdr):
        if h not in PAID: continue
        pts = []
        for r in rows[hi + 1:]:
            q, camp = r[0], r[1]
            v = num(r[j]) if j < len(r) else None
            if v is None or not isinstance(camp, str) or not re.match(r'^\d{4}/\d{2}$', camp): continue
            q = int(num(q) or 0)
            if q not in (1, 2, 3, 4): continue
            y = int(camp[:4])
            period = {1: '%d-Q3' % y, 2: '%d-Q4' % y, 3: '%d-Q1' % (y + 1), 4: '%d-Q2' % (y + 1)}[q]
            pts.append([period, round(v, 2)])
        pts.sort()
        if len(pts) >= 8:
            add(series('fr-paid-' + re.sub(r'[^a-z0-9]+', '-', PAID[h].lower()).strip('-'), 'prices_paid', PAID[h] + ': farm-gate price paid (season cumulative)', '€/t', 'quarterly', pts, {'sourceGroup': 'FranceAgriMer – prix payés aux producteurs'}))
            log('pagado', PAID[h], len(pts), pts[0][0], pts[-1])

# ---------- 3) Carnes: síntesis semanal nacional ----------
MEAT = [  # (hoja, id, etiqueta, unidad, grupo)
 ('PMP GBEA STD', 'gbea-std', 'Adult cattle at slaughterhouse gate: weighted avg price (standard)', '€/kg net', 'prices_lv'),
 ('PMP GBEA STD+SIQO', 'gbea-hist', 'Adult cattle at slaughterhouse gate: weighted avg price (standard + quality labels, to Jul 2022)', '€/kg net', 'prices_lv'),
 ('EA Vache R STD', 'vache-r', 'Cow, class R (standard)', '€/kg net', 'prices_lv'),
 ('EA Vache O STD', 'vache-o', 'Cow, class O (standard)', '€/kg net', 'prices_lv'),
 ('EA Vache P STD', 'vache-p', 'Cow, class P (standard)', '€/kg net', 'prices_lv'),
 ('EA JB R STD', 'jb-r', 'Young bull, class R (standard)', '€/kg net', 'prices_lv'),
 ('EA JB O STD', 'jb-o', 'Young bull, class O (standard)', '€/kg net', 'prices_lv'),
 ('EA JB U STD', 'jb-u', 'Young bull, class U (standard)', '€/kg net', 'prices_lv'),
 ('EA Boeuf R STD', 'boeuf-r', 'Steer, class R (standard)', '€/kg net', 'prices_lv'),
 ('EA Génisse R STD', 'genisse-r', 'Heifer, class R (standard)', '€/kg net', 'prices_lv'),
 ('EA Vache R STD+SIQO', 'vache-r-hist', 'Cow, class R (standard + quality labels, to Jul 2022)', '€/kg net', 'prices_lv'),
 ('EA JB R STD+SIQO', 'jb-r-hist', 'Young bull, class R (standard + quality labels, to Jul 2022)', '€/kg net', 'prices_lv'),
 ('VIF GBMA Limousin U 6-12 moi', 'maigre-limousin', 'Feeder calf: Limousin U male, 6-12 months, 300 kg', '€/kg live', 'prices_lv'),
 ('VIF GBMA charolais U 6-12 mo', 'maigre-charolais-6-12', 'Feeder calf: Charolais U male, 6-12 months, 350 kg', '€/kg live', 'prices_lv'),
 ('VIF GBMA charolais U 12-24 m', 'maigre-charolais-12-24', 'Feeder bull: Charolais U male, 12-24 months, 450 kg', '€/kg live', 'prices_lv'),
 ('VIF GBMA croise R 6-12 mois', 'maigre-croise', 'Feeder calf: crossbred R male, 6-12 months, 300 kg', '€/kg live', 'prices_lv'),
 ('PMP VEAUX EA', 'veaux', 'Veal calves at slaughterhouse gate: weighted avg price', '€/kg net', 'prices_lv'),
 ('VIF Petits veaux laitiers', 'veaux-laitiers', 'Dairy-breed calves, 14 days to 4 weeks, 45-50 kg', '€/head', 'prices_lv'),
 ('PMP AGNEAUX EA', 'agneaux', 'Lambs at slaughterhouse gate: weighted avg price', '€/kg net', 'prices_lv'),
 ('EA Porc', 'porc-e', 'Pig carcass, class E', '€/kg net', 'prices_lv'),
]
def meat():
    files = [f for f in listing('SeriesChronologiques/productions animales/viandes/séries hebdomadaires/synthèse toutes espèces') if 'SYNTHESE_COT_NAT_HEBDO' in f]
    log('carnes ficheros', files)
    if not files: raise RuntimeError('sin fichero de carnes')
    sh = sheets_of(download(sorted(files)[-1]), 'meat')
    for sheet, sid, label, unit, grp in MEAT:
        rows = sh.get(sheet)
        if not rows: log('hoja ausente', sheet); continue
        obs = []
        for r in rows:
            d = to_date(r[0]) if r else None
            v = num(r[2]) if d and len(r) > 2 else None
            # la serie está en euros desde 2002-01-01 (antes en francos): descartamos antes
            if v is None or d < datetime.date(2002, 1, 1): continue
            obs.append((d, v))
        pts = [[d.isoformat(), round(v, 3)] for d, v in sorted(obs)]
        add(series('fr-meat-' + sid, grp, label, unit, 'weekly', pts, {'sourceGroup': 'FranceAgriMer – cotations viandes'}))
        log('carne', label, len(pts), pts[0][0] if pts else '', pts[-1] if pts else '')

def main():
    for fn in (cereals, paid, meat):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, e)
    if len(OUT) < 10:
        log('Demasiado pocas series; no se escribe'); open('data/france-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'FR': {'name': 'France', 'source': {'name': 'FranceAgriMer (VISIONet)', 'url': 'https://visionet.franceagrimer.fr/', 'license': 'Licence Ouverte 2.0'}, 'series': OUT}},
           'log': LOG[-40:]}
    json.dump(doc, open('data/france-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/france-log.txt', 'w').write('\n'.join(LOG))
    log('series', len(OUT))
main()

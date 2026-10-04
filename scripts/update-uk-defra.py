#!/usr/bin/env python3
"""Reino Unido (Defra, Open Government Licence v3.0) -> data/uk-stats.json (countries.UK)
Cuatro conjuntos oficiales de Defra, todos bajo OGL v3.0 (uso comercial permitido citando la fuente):
  1. Sacrificio y producción de carne, mensual UK desde 1973 (CSV «machine readable»): cabezas sacrificadas, peso canal y producción de carne
     de vacuno, ovino y porcino. Solo filas «United Kingdom».
  2. Farm Business Income (Farm Business Survey, SOLO Inglaterra), anual: renta de la explotación por tipo de granja, precios corrientes.
     Defra cambia de tipología (SGM, 2007SO, 2010SO, 2013SO, 2017SO): para cada año se usa la tipología más reciente disponible (la misma
     práctica de Defra en su serie histórica). El periodo «2024» es el año agrícola 2024/25.
  3. Censos de ganado del 1 de junio (UK): vacuno, cerdos y ovino, anual.
  4. Cereales y colza (UK): rendimiento (t/ha) y superficie (ha), anual.
No inventa nada: un dato no disponible («[x]») es un hueco, nunca cero; si falta un fichero o el formato cambia, esa parte se omite y el
script termina con error sin escribir si quedan pocas series. Los enlaces se descubren con la API de contenido de GOV.UK.
Uso: python3 scripts/update-uk-defra.py [--fixtures DIR]   (con --fixtures lee slaughter.csv, fbi_timeseries.csv, livestock_pop_june_dec.ods, cereal_production.ods)"""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
FIX = Path(sys.argv[sys.argv.index('--fixtures') + 1]) if '--fixtures' in sys.argv else None
def get(u):
    last = None
    for i in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Dehesa-Index-data-bot/1.0'}), timeout=120).read()
        except Exception as e:
            last = e; time.sleep(8 * (i + 1))
    raise RuntimeError('%s -> %s' % (u, last))
def find(slug, pat):
    """(url, fecha de publicación) del primer adjunto de la página oficial cuyo enlace casa con pat"""
    api = json.loads(get('https://www.gov.uk/api/content/government/statistics/' + slug))
    links = sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+', json.dumps(api))))
    hit = [l for l in links if re.search(pat, l, re.I)]
    if not hit: raise RuntimeError('Defra %s: no hay adjunto «%s»' % (slug, pat))
    pub = str(api.get('public_updated_at') or '')[:10]
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', pub): raise RuntimeError('Defra %s: fecha de publicación no válida' % slug)
    return hit[-1], pub
def fetch(fixture, slug, pat):
    if FIX: return (FIX / fixture).read_bytes(), datetime.date.today().isoformat()
    u, pub = find(slug, pat); return get(u), pub
def num(v):
    if v is None or isinstance(v, bool): return None
    if isinstance(v, (int, float)): return None if v != v else float(v)
    t = str(v).strip().replace(',', '').replace('£', '')
    if t in ('', '[x]', '[c]', '[z]', '..', '-', 'nan'): return None
    try: return float(t)
    except ValueError: return None
slug_ = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

OUT = {}; PUB = {}
def put(sid, group, label, unit, freq, pts, src, extra=None):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 2: return False
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts, sourceGroup=src)
    if extra: s.update(extra)
    OUT[sid] = s; return True

CAT = {'prime_cattle': 'Prime cattle (steers, heifers, young bulls)', 'adult_cattle': 'Adult cattle (cows, adult bulls)', 'calves': 'Calves',
       'steers': 'Steers', 'heifers': 'Heifers', 'young_bulls': 'Young bulls', 'cows': 'Cows', 'adult_bulls': 'Adult bulls',
       'sheep_and_lambs': 'Sheep and lambs', 'ewes_and_rams': 'Ewes and rams', 'clean_pigs': 'Clean pigs', 'sows_and_boars': 'Sows and boars',
       'beef_and_veal': 'Beef and veal', 'mutton_and_lamb': 'Mutton and lamb', 'pigmeat': 'Pigmeat'}
def slaughter():
    raw, pub = fetch('slaughter.csv', 'cattle-sheep-and-pig-slaughter', r'machine-readable.*\.csv$')
    rows = [r for r in csv.DictReader(io.StringIO(raw.decode('utf-8-sig', 'replace'))) if r.get('country') == 'United Kingdom']
    if len(rows) < 5000: raise RuntimeError('sacrificio: muy pocas filas UK (%d)' % len(rows))
    by = {}
    for r in rows:
        try: d = datetime.datetime.strptime(r['month'], '%b-%y')
        except ValueError: continue
        v = num(r['value'])
        by.setdefault((r['category'], r['data_type'], r['unit']), {})[d.strftime('%Y-%m')] = v
    # el CSV da miles de cabezas y miles de toneladas; se publican en cabezas y toneladas (unidades que no dependen del idioma)
    TYPES = {'slaughterings': ('uk-slaughter-heads-', 'Slaughterings: %s (head)', 'head', 1000),
             'dressed_carcasse_weight': ('uk-slaughter-weight-', 'Average dressed carcase weight: %s (kg per head)', 'kg/head', 1),
             'meat_production': ('uk-meat-production-', 'Meat production: %s (tonnes)', 't', 1000)}
    n = 0
    for (cat, dt, unit), m in sorted(by.items()):
        if dt not in TYPES or cat not in CAT: log('sacrificio: omitido', cat, dt); continue
        ks = sorted(m)
        # continuidad: el mes no puede saltarse siglos ni quedar fuera de orden (el CSV usa años de 2 cifras)
        y0, m0 = map(int, ks[0].split('-')); gaps = 0
        for k in ks[1:]:
            y1, m1 = map(int, k.split('-'))
            if (y1 - y0) * 12 + (m1 - m0) != 1: gaps += 1
            y0, m0 = y1, m1
        if gaps > 12: raise RuntimeError('sacrificio %s/%s: demasiados saltos de mes (%d): posible error de siglo' % (cat, dt, gaps))
        pre, lab, u, mul = TYPES[dt]
        if put(pre + slug_(cat), 'production', lab % CAT[cat], u, 'monthly', [(k, None if v is None else round(v * mul, 3)) for k, v in m.items()], 'Defra – UK cattle, sheep and pig slaughter'): n += 1
    PUB['slaughter'] = pub; log('sacrificio:', n, 'series; publicado', pub)

def fbi():
    raw, pub = fetch('fbi_timeseries.csv', 'farm-business-income', r'fbi_timeseries.*\.csv$')
    rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig', 'replace'))))
    ORDER = ['SGM', '2007SO', '2010SO', '2013SO', '2017SO']
    rows = [r for r in rows if r['prices'] == 'Current' and r['fbs_variable'] == 'farm.business.income' and r['measure'] == 'FBI']
    if len(rows) < 100: raise RuntimeError('FBI: muy pocas filas (%d)' % len(rows))
    best = {}
    for r in rows:
        k = (r['farm_type'], r['survey_year']); t = ORDER.index(r['typology']) if r['typology'] in ORDER else -1
        if t < 0: raise RuntimeError('FBI: tipología desconocida ' + r['typology'])
        if k not in best or t > best[k][0]: best[k] = (t, num(r['value']), r['typology'])
    n = 0
    for ft in sorted({k[0] for k in best}):
        pts = []
        for (f, y), (t, v, ty) in best.items():
            if f != ft or not re.match(r'^\d{4}/\d{2}$', y): continue
            pts.append((y[:4], v))
        if put('uk-fbi-' + slug_(ft), 'income', 'Farm Business Income, England: %s (GBP per farm, current prices)' % ft, 'GBP/farm', 'annual', pts, 'Defra – Farm Business Income (England)',
               {'periodNote': 'Farm year starting in the period shown (2024 = 2024/25); England only; Defra typology changes over time'}): n += 1
    PUB['fbi'] = pub; log('FBI:', n, 'series; publicado', pub)

def livestock():
    import pandas as pd
    raw, pub = fetch('livestock_pop_june_dec.ods', 'livestock-populations-in-the-united-kingdom', r'June_and_December.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf')
    WANT = {'Cattle': [('Total cattle and calves', 'cattle', 'Cattle and calves, total'), ('Beef Herd', 'beef-herd', 'Beef herd (breeding females)'), ('Dairy Herd', 'dairy-herd', 'Dairy herd (breeding females)')],
            'Pigs': [('Total pigs', 'pigs', 'Pigs, total'), ('Female breeding herd', 'breeding-sows', 'Female breeding herd')],
            'Sheep': [('Total sheep and lambs', 'sheep', 'Sheep and lambs, total'), ('Female breeding flock', 'breeding-ewes', 'Female breeding flock')]}
    n = 0
    for sh, items in WANT.items():
        df = xl.parse(sh, header=None)
        hdr = next((i for i in range(min(8, len(df))) if str(df.iat[i, 0]).strip().lower().startswith('number of animals')), None)
        if hdr is None: log('censo: sin cabecera en', sh); continue
        dates = {}
        for j in range(1, df.shape[1]):
            c = df.iat[hdr, j]
            try: d = pd.Timestamp(c)
            except Exception: continue
            if d.month == 6: dates[j] = str(d.year)
        for lab, sid, name in items:
            row = next((i for i in range(hdr + 1, len(df)) if str(df.iat[i, 0]).strip() == lab), None)
            if row is None: log('censo: no está la fila', lab); continue
            pts = [(p, num(df.iat[row, j])) for j, p in dates.items()]
            if put('uk-livestock-june-' + sid, 'livestock', 'Livestock on holdings at 1 June: %s (head)' % name, 'head', 'annual', pts, 'Defra – Livestock populations in the UK (June survey)'): n += 1
    PUB['livestock'] = pub; log('censo ganado:', n, 'series; publicado', pub)

def cereals():
    import pandas as pd
    raw, pub = fetch('cereal_production.ods', 'cereal-and-oilseed-rape-production', r'\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf'); n = 0
    df = xl.parse('UK_cereal_yields_summary', header=None)
    hdr = next(i for i in range(8) if str(df.iat[i, 0]).strip().lower().startswith('year'))
    for j, name in ((1, 'Wheat'), (2, 'Barley'), (3, 'Oats'), (7, 'Oilseed rape')):
        if str(df.iat[hdr, j]).strip().lower() != name.lower(): log('cereales: columna inesperada', j, df.iat[hdr, j]); continue
        pts = []
        for i in range(hdr + 1, len(df)):
            y = str(df.iat[i, 0]).strip()
            if re.match(r'^\d{4}$', y): pts.append((y, num(df.iat[i, j])))
        if put('uk-cereal-yield-' + slug_(name), 'crops', 'Yield: %s, United Kingdom (t/ha)' % name, 't/ha', 'annual', pts, 'Defra – Cereal and oilseed rape production'): n += 1
    for sh, name, sid in (('Regional_wheat', 'Wheat', 'wheat'), ('Regional_total_barley', 'Barley', 'barley'), ('Regional_oats', 'Oats', 'oats'), ('Regional_OSR', 'Oilseed rape', 'oilseed-rape')):
        d2 = xl.parse(sh, header=None)
        hdr = next((i for i in range(8) if str(d2.iat[i, 0]).strip().lower().startswith('areas')), None)
        row = next((i for i in range(len(d2)) if str(d2.iat[i, 0]).strip() == 'United Kingdom'), None)
        if hdr is None or row is None: log('cereales: hoja sin cabecera', sh); continue
        pts = []
        for j in range(1, d2.shape[1]):
            c = d2.iat[hdr, j]
            try: y = int(float(c))
            except (TypeError, ValueError): continue  # columnas de variación o media de 5 años
            if 1990 < y < 2100: pts.append((str(y), num(d2.iat[row, j])))
        if put('uk-cereal-area-' + sid, 'crops', 'Area: %s, United Kingdom (hectares)' % name, 'ha', 'annual', pts, 'Defra – Cereal and oilseed rape production'): n += 1
    PUB['cereals'] = pub; log('cereales:', n, 'series; publicado', pub)

def main():
    for fn in (slaughter, fbi, livestock, cereals):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e))
    if len(OUT) < 30:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); (ROOT / 'data' / 'uk-log.txt').write_text('\n'.join(LOG)); sys.exit(1)
    out = ROOT / 'data' / 'uk-stats.json'
    old = {}
    if out.exists():
        try: old = {s['id']: s for s in json.loads(out.read_text())['countries']['UK']['series']}
        except Exception: old = {}
    for sid, s in old.items():  # una parte que falló hoy conserva su última versión buena en vez de desaparecer
        if sid not in OUT: OUT[sid] = s; 
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'UK': {'name': 'United Kingdom', 'source': {'name': 'Defra (UK Department for Environment, Food and Rural Affairs)', 'url': 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs',
                                'license': 'Open Government Licence v3.0 (commercial use allowed; cite source)'}, **({} if FIX else {'published': PUB}), 'series': sorted(OUT.values(), key=lambda s: s['id'])}},
           'log': LOG[-30:]}
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (ROOT / 'data' / 'uk-log.txt').write_text('\n'.join(LOG)); log('series', len(OUT))
if __name__ == '__main__': main()

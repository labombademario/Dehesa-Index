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
  5. Huevos (UK, trimestral): producción de huevos para consumo, entradas de las empacadoras por sistema de cría y precio medio empacadora→productor.
  6. Aves de corral (UK): sacrificio mensual, producción de carne mensual, incubadoras (huevos puestos a incubar y pollitos colocados).
  7. Cereales y colza por región (Inglaterra por regiones, Gales, Escocia, Irlanda del Norte): superficie, rendimiento y producción.
  8. Leche (UK, mensual): disponibilidad, uso y producción de leche de las lecherías; y suministros de mantequilla, queso, leche condensada, leche en polvo y yogur (producción, importaciones, exportaciones).
  9. Huevos: transformación y comercio (HMRC publicado por Defra).
  10. Agriculture in the United Kingdom (capítulos 3, 7, 8 y 13, anual): valor de la producción, precios en origen, leche por vaca, renta por país y comercio exterior de productos clave.
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
    api = None
    for sl in ([slug] if isinstance(slug, str) else slug):
        try: api = json.loads(get('https://www.gov.uk/api/content/government/' + (sl if sl.startswith('statistical-data-sets/') else 'statistics/' + sl))); break
        except Exception as e: last = e
    if api is None: raise RuntimeError('Defra %s: página no disponible (%s)' % (slug, last))
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

MON = {m: i + 1 for i, m in enumerate('jan feb mar apr may jun jul aug sep oct nov dec'.split())}
def table(df, kind):
    """(cabeceras limpias, filas) de una hoja de Defra: la cabecera es la fila cuya primera celda es Year/Month/Date/Quarter; acaba en la primera fila sin periodo válido"""
    hdr = next((i for i in range(min(12, len(df))) if str(df.iat[i, 0]).strip().lower() in ('year', 'month', 'date', 'quarter')), None)
    if hdr is None: raise RuntimeError('hoja sin cabecera de periodo')
    names = [re.sub(r'\[.*?\]|\*', '', str(c)).strip() for c in df.iloc[hdr]]
    rows = []
    for i in range(hdr + 1, len(df)):
        r = list(df.iloc[i])
        if per(r, kind) is None: break
        rows.append(r)
    return names, rows
def yr(c):
    m = re.match(r'^(\d{4})', str(c).strip()); return m.group(1) if m else None
def per(row, kind):
    """periodo de una fila. A/Q/M: año en la 1.ª columna (+ Quarter o Month en la 2.ª). DM/DA: fecha en la 1.ª columna (mensual / anual). DQ: texto «2018 Q1»"""
    c = row[0]
    if kind in ('DM', 'DA'):
        if isinstance(c, str):
            try: d = datetime.datetime.strptime(re.sub(r'\s*\[.*?\]', '', c).strip(), '%b-%y')
            except ValueError: return None
        else:
            try: d = datetime.datetime.fromisoformat(str(c)[:10])
            except ValueError: return None
        return d.strftime('%Y-%m' if kind == 'DM' else '%Y')
    if kind == 'DQ':
        m = re.match(r'^(\d{4}) Q([1-4])$', str(c).strip()); return '%s-Q%s' % (m.group(1), m.group(2)) if m else None
    y = yr(c)
    if y is None or not re.match(r'^\d{4}\D{0,3}$', str(c).strip()): return None
    if kind == 'A': return y
    if kind == 'Q':
        try: return '%s-Q%d' % (y, int(float(row[1])))
        except (TypeError, ValueError): return None
    m = MON.get(str(row[1]).strip().lower()[:3]); return '%s-%02d' % (y, m) if m else None
def sheet_series(xl, sheet, kind, cols, group, sid_pre, lab, unit, src, mul=1, extra=None, prefix=False):
    """cols: {nombre de columna en la hoja: (id, texto del nombre)}; una columna ausente se avisa en el log y se omite (nunca se rellena)"""
    import pandas as pd
    names, rows = table(xl.parse(sheet, header=None), kind); n = 0; series = []
    freq = {'A': 'annual', 'DA': 'annual', 'Q': 'quarterly', 'DQ': 'quarterly', 'M': 'monthly', 'DM': 'monthly'}[kind]
    for cn, (cid, nm) in cols.items():
        hit = [k for k, c in enumerate(names) if (c.lower().startswith(cn.lower()) if prefix else c == cn)]
        if len(hit) != 1: log('aviso: columna ausente o ambigua', cn, 'en', sheet); continue
        j = hit[0]
        pts = [(p, v) for p, v in ((per(r, kind), None if num(r[j]) is None else num(r[j]) * mul) for r in rows) if p and v is not None]
        series.append((cid, nm, pts))
    top = max((p[-1][0][:4] for _, _, p in series if p), default='0')
    for cid, nm, pts in series:
        if not pts or int(pts[-1][0][:4]) < int(top) - 2:  # Defra dejó de publicar esa columna (confidencial): no se muestra una serie muerta
            log('omitida (sin datos recientes):', sid_pre + cid, pts[-1][0] if pts else '-'); continue
        if put(sid_pre + cid, group, lab % nm, unit, freq, pts, src, extra): n += 1
    return n

def eggs():
    import pandas as pd
    S1 = 'Defra – UK egg statistics'
    raw, pub = fetch('egg_production.ods', ['egg-statistics'], r'Egg_production_dataset.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf'); n = 0
    n += sheet_series(xl, 'Production_Quarterly', 'Q', {'Total eggs': ('total', 'total'), 'Shell eggs': ('shell', 'shell eggs'), 'Processed eggs': ('processed', 'processed eggs')},
                      'production', 'uk-egg-production-', 'Egg production for human consumption, United Kingdom: %s (million dozen)', 'million dozen', S1)
    raw, pub2 = fetch('egg_packers_prices.ods', ['egg-statistics'], r'Packer_shell_egg.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf')
    SYS = {'Enriched': ('enriched', 'enriched cages'), 'Barn': ('barn', 'barn'), 'Free range': ('free-range', 'free range'), 'Organic': ('organic', 'organic')}
    n += sheet_series(xl, 'Intake_Quarterly', 'Q', dict(SYS, **{'Total shell eggs': ('total', 'all systems')}), 'production', 'uk-egg-packers-intake-',
                      'Egg packers intake, United Kingdom: %s (million dozen)', 'million dozen', S1)
    n += sheet_series(xl, 'Price_Quarterly', 'Q', dict(SYS, **{'All types': ('all', 'all types')}), 'prices', 'uk-egg-price-',
                      'Average packer-to-producer egg price, United Kingdom: %s (pence per dozen)', 'p/dozen', S1,
                      extra={'periodNote': 'Barn and organic prices are confidential in recent years and are not published; those series stop where Defra stops'})
    raw, pub3 = fetch('egg_processed.ods', ['egg-statistics'], r'Processed_eggs.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf')
    n += sheet_series(xl, 'Intake_Quarterly', 'Q', {'UK eggs': ('uk', 'UK eggs'), 'Imported eggs': ('imported', 'imported eggs'), 'Total available for processing': ('total', 'total')},
                      'production', 'uk-egg-processing-intake-', 'Egg processors intake, United Kingdom: %s (million dozen)', 'million dozen', S1)
    n += sheet_series(xl, 'Output_Quarterly', 'Q', {'Liquid Egg': ('liquid', 'liquid egg'), 'Other products': ('other', 'other egg products'), 'Total production': ('total', 'total')},
                      'production', 'uk-egg-processing-output-', 'Egg processors output, United Kingdom: %s (tonnes)', 't', S1, mul=1000)
    raw, pub4 = fetch('egg_trade.ods', ['egg-statistics'], r'Trade_dataset.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf')
    TR = {'Shell Eggs Total': ('shell', 'shell eggs'), 'Egg Products Total': ('products', 'egg products'), 'Total EU': ('eu', 'from or to the EU'), 'Total RoW': ('row', 'from or to the rest of the world'), 'Overall Total': ('total', 'total')}
    S2 = 'Defra – UK egg statistics (trade data from HMRC)'
    n += sheet_series(xl, 'Imports_Monthly', 'DM', TR, 'trade', 'uk-egg-imports-', 'UK egg imports: %s (million dozen)', 'million dozen', S2)
    n += sheet_series(xl, 'Exports_Monthly', 'DM', TR, 'trade', 'uk-egg-exports-', 'UK egg exports: %s (million dozen)', 'million dozen', S2)
    n += sheet_series(xl, 'Trade_Balance_Quarterly', 'DQ', {'Supply': ('supply', 'supply (million dozen)')}, 'production', 'uk-egg-balance-', 'UK egg balance: %s', 'million dozen', S1)
    n += sheet_series(xl, 'Trade_Balance_Quarterly', 'DQ', {'Domestic production as % of supply': ('self-sufficiency', 'domestic production as % of supply')}, 'production', 'uk-egg-balance-', 'UK egg balance: %s', '%', S1, mul=100)
    PUB['eggs'] = max(pub, pub2, pub3, pub4); log('huevos:', n, 'series; publicado', PUB['eggs'])

def poultry():
    import pandas as pd
    S1 = 'Defra – UK poultry statistics'
    raw, pub = fetch('poultry_slaughter.ods', ['poultry-and-poultry-meat-statistics'], r'Poultry_slaughter.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf'); n = 0
    n += sheet_series(xl, 'Slaughterings_Monthly', 'M', {'Broilers UK': ('broilers', 'broilers'), 'Boiling Fowl UK': ('boiling-fowl', 'boiling fowl'), 'Turkeys UK': ('turkeys', 'turkeys')},
                      'production', 'uk-poultry-slaughter-', 'Poultry slaughterings, United Kingdom: %s (birds)', 'birds', S1, mul=1e6)
    n += sheet_series(xl, 'Production_Monthly', 'M', {'Broilers': ('broilers', 'broilers'), 'Boiling Fowl': ('boiling-fowl', 'boiling fowl'), 'Turkeys': ('turkeys', 'turkeys'), 'Ducks': ('ducks', 'ducks'), 'Total': ('total', 'total')},
                      'production', 'uk-poultry-meat-production-', 'Poultrymeat production, United Kingdom: %s (tonnes carcase weight)', 't', S1, mul=1000)
    raw, pub2 = fetch('hatcheries.ods', ['poultry-and-poultry-meat-statistics'], r'Hatcheries.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf')
    n += sheet_series(xl, 'UK_Eggs_Set_Monthly', 'M', {'Commercial Broilers UK': ('broilers', 'commercial broilers'), 'Commercial Layers UK': ('layers', 'commercial layers'), 'Turkeys UK': ('turkeys', 'turkeys')},
                      'production', 'uk-hatchery-eggs-set-', 'Hatchery eggs set, United Kingdom: %s (eggs)', 'eggs', S1, mul=1e6)
    n += sheet_series(xl, 'UK_Placings_Monthly', 'M', {'Commercial Broilers UK': ('broilers', 'commercial broilers'), 'Commercial Layers UK': ('layers', 'commercial layers'), 'Turkeys UK': ('turkeys', 'turkeys')},
                      'production', 'uk-hatchery-placings-', 'Chicks and poults placed, United Kingdom: %s (birds)', 'birds', S1, mul=1e6)
    PUB['poultry'] = max(pub, pub2); log('aves:', n, 'series; publicado', PUB['poultry'])

REGIONS = ['United Kingdom', 'England', 'North East', 'North West and Merseyside', 'Yorkshire & The Humber', 'East Midlands', 'West Midlands', 'Eastern', 'South East and London', 'South West', 'Wales', 'Scotland', 'Northern Ireland']
REGFOLD = {re.sub(r'\s+', ' ', r.lower().replace('&', 'and')): r for r in REGIONS}
def cereals_regions():
    import pandas as pd
    raw, pub = fetch('cereal_production.ods', ['cereal-and-oilseed-rape-production'], r'\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf'); n = 0
    SH = (('Regional_wheat', 'Wheat', 'wheat'), ('Regional_total_barley', 'Barley', 'barley'), ('Regional_winter_barley', 'Winter barley', 'winter-barley'), ('Regional_spring_barley', 'Spring barley', 'spring-barley'), ('Regional_oats', 'Oats', 'oats'), ('Regional_OSR', 'Oilseed rape', 'oilseed-rape'))
    BLK = (('areas', 'Area', 'ha', 'hectares'), ('yields', 'Yield', 't/ha', 't/ha'), ('production', 'Production', 't', 'tonnes'))
    for sh, name, sid in SH:
        d = xl.parse(sh, header=None)
        starts = {}
        for i in range(len(d)):
            c = str(d.iat[i, 0]).strip().lower()
            for key, *_ in BLK:
                if c.startswith(key): starts[key] = i
        for key, lab, u, ulab in BLK:
            if key not in starts: log('cereales región: falta el bloque', key, 'en', sh); continue
            h = starts[key]
            cols = {}
            for j in range(1, d.shape[1]):
                try: y = int(float(d.iat[h, j]))
                except (TypeError, ValueError): continue  # columnas de variación, intervalo de confianza o media
                if 1990 < y < 2100: cols[j] = str(y)
            rows = {}
            for i in range(h + 1, min(h + 16, len(d))):
                r = REGFOLD.get(re.sub(r'\s+', ' ', str(d.iat[i, 0]).strip().lower().replace('&', 'and')))
                if r: rows[r] = i
                elif str(d.iat[i, 0]).strip() in ('tonnes', 'tonnes/hectare', '%'): break
            for reg in REGIONS:
                if reg not in rows: log('cereales región: falta', reg, sh, key); continue
                if key != 'production' and reg == 'United Kingdom': continue  # ya existen en la parte nacional (superficie y rendimiento UK)
                pts = [(p, num(d.iat[rows[reg], j])) for j, p in cols.items()]
                n += put('uk-reg-%s-%s-%s' % (key, sid, slug_(reg)), 'crops_regions', '%s: %s, %s (%s)' % (lab, name, reg, ulab), u, 'annual', pts, 'Defra – Cereal and oilseed rape production (regional)',
                    {'periodNote': 'Regional estimates from Defra surveys; Wales, Scotland and Northern Ireland have no confidence intervals' } if reg in ('Wales', 'Scotland', 'Northern Ireland') else None)
    PUB['cereals_regions'] = pub; log('cereales por región:', n, 'series; publicado', pub)

def milk():
    import pandas as pd
    raw, pub = fetch('milk.ods', ['milk-utilisation-by-dairies-in-england-and-wales'], r'Milkutil_dataset.*\.ods$')
    df = pd.ExcelFile(io.BytesIO(raw), engine='odf').parse('UK_Monthly', header=None)
    hdr = next((i for i in range(6) if str(df.iat[i, 0]).strip().lower() == 'date'), None)
    if hdr is None: raise RuntimeError('leche: hoja sin cabecera «Date»')
    names = [re.sub(r'\[.*?\]', '', str(c)).strip() for c in df.iloc[hdr]]
    months = []
    for i in range(hdr + 1, len(df)):
        c = df.iat[i, 0]
        if isinstance(c, str):  # «Jan-15 [4]»: fecha escrita con la nota de método al lado
            try: d = datetime.datetime.strptime(re.sub(r'\s*\[.*?\]', '', c).strip(), '%b-%y')
            except ValueError: break
        else:
            try: d = pd.Timestamp(c)
            except Exception: break
            if d != d: break
        months.append((i, d.strftime('%Y-%m')))
    ML = 'million litres'
    # (inicio del nombre de la columna en Defra, id, texto, unidad, factor): millones de litros se dejan en millones; miles de toneladas pasan a toneladas
    COLS = [('Milk sold to UK dairies', 'sold-to-dairies', 'Milk sold to UK dairies', ML, 'million l', 1),
            ('Availability of raw milk', 'raw-milk-availability', 'Availability of raw milk', ML, 'million l', 1),
            ('Disposals of milk for Liquid milk', 'use-liquid-milk', 'Milk used for liquid milk', ML, 'million l', 1),
            ('Total disposals of milk for cheese', 'use-cheese', 'Milk used for cheese', ML, 'million l', 1),
            ('Total milk used for manufacturing', 'use-manufacturing', 'Milk used for manufacturing', ML, 'million l', 1),
            ('Production of Liquid Milk', 'prod-liquid-milk', 'Liquid milk production', ML, 'million l', 1),
            ('Production of Cream', 'prod-cream', 'Cream production', ML, 'million l', 1),
            ('Production of Butter', 'prod-butter', 'Butter production', 'tonnes', 't', 1000),
            ('Total production of cheese', 'prod-cheese', 'Cheese production, total', 'tonnes', 't', 1000),
            ('Production of Cheddar', 'prod-cheddar', 'Cheddar production', 'tonnes', 't', 1000),
            ('Production of Yoghurt', 'prod-yoghurt', 'Yoghurt production', 'tonnes', 't', 1000),
            ('Production of Condensed milk', 'prod-condensed-milk', 'Condensed milk production', 'tonnes', 't', 1000),
            ('Production of Milk Powders', 'prod-milk-powders', 'Milk powder production', 'tonnes', 't', 1000)]
    n = 0
    for pre, cid, nm, ulab, u, mul in COLS:
        js = [j for j, c in enumerate(names) if c.lower().startswith(pre.lower())]
        if len(js) != 1: log('leche: columna no encontrada o ambigua', pre); continue
        j = js[0]
        pts = [(p, None if num(df.iat[i, j]) is None else num(df.iat[i, j]) * mul) for i, p in months]
        pts = [(p, v) for p, v in pts if v is not None]
        if not pts or int(pts[-1][0][:4]) < int(months[-1][1][:4]) - 2: log('omitida (sin datos recientes):', cid); continue  # p. ej. leche en polvo, suprimida por confidencialidad
        if put('uk-milk-' + cid, 'milk', 'United Kingdom milk: %s (%s)' % (nm, ulab), u, 'monthly', pts, 'Defra – UK milk utilisation by dairies',
               {'periodNote': 'Defra changed methodology in January 2015; production series before and after are not strictly comparable'}): n += 1
    PUB['milk'] = pub; log('leche:', n, 'series; publicado', pub)

def milk_products():
    import pandas as pd
    raw, pub = fetch('milk_supplies.ods', ['milk-utilisation-by-dairies-in-england-and-wales'], r'Milk_supplies_dataset.*\.ods$')
    xl = pd.ExcelFile(io.BytesIO(raw), engine='odf'); n = 0
    S1 = 'Defra – UK milk products supplies (trade data from HMRC)'
    # la nata se omite: su cabecera no aclara si va en miles de toneladas o en millones de litros (la portada dice «miles de toneladas salvo que se indique»)
    P = (('Butter', 'butter', 'butter', 'Production'), ('Cheese', 'cheese', 'cheese', 'Total Production'), ('Condensed_milk', 'condensed-milk', 'condensed milk', 'Total Production'),
         ('Milk_Powders', 'milk-powders', 'milk powders', 'Production'), ('Yoghurt', 'yoghurt', 'yoghurt', 'Total Production'))
    for sh, sid, nm, pcol in P:
        cols = {pcol: ('production', 'production'), 'Total Imports': ('imports', 'imports'), 'Total Exports': ('exports', 'exports'), 'Supplies': ('supplies', 'supplies')}
        for cn, (cid, w) in cols.items():
            n += sheet_series(xl, sh, 'DM', {cn: (cid, w)}, 'milk' if cid == 'production' else 'trade', 'uk-dairy-%s-' % sid, 'UK %s: ' % nm + '%s (tonnes)', 't', S1, mul=1000, prefix=True,
                              extra={'periodNote': 'Monthly data from 2015; HMRC trade data; supplies = production + imports - exports (less the change in intervention stocks, where it applies)'} if cid != 'production' else None)
    n += sheet_series(xl, 'Cheese', 'DM', {'Cheddar Production': ('cheddar', 'cheddar production')}, 'milk', 'uk-dairy-cheese-', 'UK cheese: %s (tonnes)', 't', S1, mul=1000, prefix=True)
    PUB['milk_products'] = pub; log('lácteos:', n, 'series; publicado', pub)

AUK_URL = ['statistical-data-sets/agriculture-in-the-united-kingdom-data-sets']
def auk_period(c):
    t = str(c).strip(); m = re.match(r'^(\d{4})(?:\.0)?(?:/\d{2})?(?:\D|$)', t)
    return m.group(1) if m else None
def auk_table(df, tprefix, hdr_row=None, lab_col=0):
    """tabla de un libro «Agriculture in the UK»: [(etiqueta, {periodo: valor})]. tprefix = inicio del título («Table 7.2b»); sin él, la cabecera es la fila 3 de la hoja"""
    if tprefix:
        t0 = next((i for i in range(len(df)) if str(df.iat[i, 0]).strip().startswith(tprefix + ' ') or str(df.iat[i, 0]).strip() == tprefix), None)
        if t0 is None: raise RuntimeError('no está la tabla ' + tprefix)
        hdr = t0 + 1
    else: hdr = hdr_row if hdr_row is not None else 2
    cols = {j: auk_period(df.iat[hdr, j]) for j in range(lab_col + 1, df.shape[1])}
    cols = {j: p for j, p in cols.items() if p and 1900 < int(p) < 2100}
    out = []
    for i in range(hdr + 1, len(df)):
        lab = str(df.iat[i, lab_col]).strip()
        if lab in ('nan', ''): break
        if re.match(r'^(Table|Figure) \d', lab): break
        out.append((lab, {p: num(df.iat[i, j]) for j, p in cols.items()}))
    return out
def auk_row(rows, start, after=None):
    i0 = 0
    if after:
        i0 = next((k for k, (l, _) in enumerate(rows) if l.lower().startswith(after.lower())), None)
        if i0 is None: return None
    return next((d for l, d in rows[i0:] if l.lower().startswith(start.lower())), None)

# (hoja del capítulo, tabla, tramo tras este encabezado, inicio de fila, id, grupo, etiqueta, unidad, factor, nota)
GBP = 'GBP million'
def auk_specs():
    S = []
    def crop_value(ch, sh, tb, row, sid, nm): S.append((ch, sh, tb, None, row, 'uk-auk-value-' + sid, 'crops', 'Value of production, United Kingdom: %s (GBP million)' % nm, 'GBP million', 1))
    crop_value(7, 'Table_7_2', 'Table 7.2a', 'Value of production at market prices', 'wheat', 'Wheat')
    crop_value(7, 'Table_7_3', 'Table 7.3a', 'Value of production at market prices', 'barley', 'Barley')
    crop_value(7, 'Table_7_4', 'Table 7.4a', 'Value of production at market prices', 'oats', 'Oats')
    crop_value(7, 'Table_7_5', 'Table 7.5a', 'Value of production (£ million)', 'oilseed-rape', 'Oilseed rape')
    crop_value(7, 'Table_7_6', 'Table 7.6a', 'Value of production (£ million)', 'sugar-beet', 'Sugar beet')
    def price(ch, sh, tb, row, sid, nm, unit='GBP per tonne', after=None):
        S.append((ch, sh, tb, after, row, 'uk-auk-price-' + sid, 'prices', 'Farm-gate price, United Kingdom: %s (%s)' % (nm, unit), unit.replace('GBP per tonne', 'GBP/t'), 1))
    price(7, 'Table_7_2', 'Table 7.2b', 'Milling wheat', 'milling-wheat', 'Milling wheat'); price(7, 'Table_7_2', 'Table 7.2b', 'Feed wheat', 'feed-wheat', 'Feed wheat')
    price(7, 'Table_7_3', 'Table 7.3b', 'Malting barley', 'malting-barley', 'Malting barley'); price(7, 'Table_7_3', 'Table 7.3b', 'Feed barley', 'feed-barley', 'Feed barley')
    price(7, 'Table_7_4', 'Table 7.4b', 'Milling oats', 'milling-oats', 'Milling oats'); price(7, 'Table_7_4', 'Table 7.4b', 'Feed oats', 'feed-oats', 'Feed oats')
    price(7, 'Table_7_6', 'Table 7.6a', 'Prices (average market price', 'sugar-beet', 'Sugar beet')
    price(7, 'Table_7_10', 'Table 7.10b', 'Early/maincrop', 'potatoes-maincrop', 'Early and maincrop potatoes'); price(7, 'Table_7_10', 'Table 7.10b', 'Seed', 'potatoes-seed', 'Seed potatoes')
    for k, nm, sid in (('Area (thousand hectares)', 'Sugar beet', 'sugar-beet'),):
        S.append((7, 'Table_7_6', 'Table 7.6a', None, k, 'uk-auk-area-' + sid, 'crops', 'Area: %s, United Kingdom (hectares)' % nm, 'ha', 1000))
    S.append((7, 'Table_7_6', 'Table 7.6a', None, 'Yield (adjusted', 'uk-auk-yield-sugar-beet', 'crops', 'Yield: Sugar beet, United Kingdom (t/ha)', 't/ha', 1))
    S.append((7, 'Table_7_6', 'Table 7.6a', None, 'Volume of harvested production', 'uk-auk-production-sugar-beet', 'crops', 'Production: Sugar beet, United Kingdom (tonnes)', 't', 1000))
    S.append((7, 'Table_7_10', 'Table 7.10a', None, 'Area harvested', 'uk-auk-area-potatoes', 'crops', 'Area: Potatoes, United Kingdom (hectares)', 'ha', 1000))
    S.append((7, 'Table_7_10', 'Table 7.10a', None, 'Yield', 'uk-auk-yield-potatoes', 'crops', 'Yield: Potatoes, United Kingdom (t/ha)', 't/ha', 1))
    S.append((7, 'Table_7_10', 'Table 7.10a', None, 'Volume of harvested production', 'uk-auk-production-potatoes', 'crops', 'Production: Potatoes, United Kingdom (tonnes)', 't', 1000))
    for row, nm in (('Cattle', 'cattle'), ('Pigs', 'pigs'), ('Sheep', 'sheep'), ('Poultry', 'poultry'), ('Total value', 'livestock, total')):
        S.append((8, 'Table_8_1', 'Table 8.1b', None, row, 'uk-auk-value-' + slug_(nm), 'production', 'Value of production, United Kingdom: %s (GBP million)' % nm, GBP, 1))
    S.append((8, 'Table_8_7', 'Table 8.7b', None, 'Value of production of eggs', 'uk-auk-value-eggs', 'production', 'Value of production, United Kingdom: eggs for human consumption (GBP million)', GBP, 1))
    S.append((8, 'Table_8_6', 'Table 8.6b', None, 'Value of production at market prices', 'uk-auk-value-milk', 'milk', 'Value of production, United Kingdom: milk (GBP million)', GBP, 1))
    def lp(ch, sh, tb, row, sid, nm): S.append((ch, sh, tb, None, row, 'uk-auk-price-' + sid, 'prices', 'Producer price, United Kingdom: %s (pence per kg deadweight)' % nm, 'p/kg', 1))
    lp(8, 'Table_8_2', 'Table 8.2c', 'Finished cattle: All prime', 'prime-cattle', 'prime cattle'); lp(8, 'Table_8_3', 'Table 8.3c', 'Clean pigs', 'clean-pigs', 'clean pigs')
    lp(8, 'Table_8_4', 'Table 8.4c', 'Finished sheep', 'finished-sheep', 'finished sheep (Great Britain)')
    for row, nm, sid in (('Table chickens', 'table chickens', 'chickens'), ('Boiling fowls', 'boiling fowls', 'boiling-fowls'), ('Turkeys', 'turkeys', 'turkeys'), ('Ducks', 'ducks', 'ducks'), ('Geese', 'geese', 'geese')): lp(8, 'Table_8_5', 'Table 8.5c', row, 'poultry-' + sid, nm)
    S.append((8, 'Table_8_6', 'Table 8.6a', None, 'Dairy herd', 'uk-auk-dairy-herd', 'livestock', 'Dairy herd, annual average, United Kingdom (head)', 'head', 1000))
    S.append((8, 'Table_8_6', 'Table 8.6a', None, 'Average yield per dairy cow', 'uk-auk-milk-yield', 'milk', 'Milk yield per dairy cow, United Kingdom (litres per year)', 'l/cow', 1))
    S.append((8, 'Table_8_6', 'Table 8.6b', None, 'Milk from the dairy herd', 'uk-auk-milk-dairy-herd', 'milk', 'Milk from the dairy herd, United Kingdom, annual (million litres)', 'million l', 1))
    S.append((8, 'Table_8_6', 'Table 8.6c', None, 'Farmgate price excluding bonus', 'uk-auk-milk-price-excl-bonus', 'milk', 'Farm-gate milk price, United Kingdom: excluding bonus payments (pence per litre)', 'p/l', 1))
    S.append((8, 'Table_8_6', 'Table 8.6c', None, 'Farmgate price including bonus', 'uk-auk-milk-price-incl-bonus', 'milk', 'Farm-gate milk price, United Kingdom: including bonus payments (pence per litre)', 'p/l', 1))
    S.append((8, 'Table_8_7', 'Table 8.7a', None, 'Number of laying fowl', 'uk-auk-laying-fowl', 'livestock', 'Laying fowl, United Kingdom (birds)', 'birds', 1000))
    return S
FBI_TYPE = {'cereals': 'Cereals', 'general cropping': 'General cropping', 'dairy': 'Dairy', 'grazing livestock (lowland)': 'Lowland grazing livestock', 'grazing livestock (lfa)': 'LFA grazing livestock',
            'specialist pigs': 'Specialist pigs', 'specialist poultry': 'Specialist poultry', 'mixed': 'Mixed', 'all types (including horticulture)': 'All Types'}
TRADE_ITEM = {'Cheese': 'cheese', 'Poultry meat': 'poultry meat', 'Poultry meat products': 'poultry meat products', 'Beef and veal': 'beef and veal', 'Wheat, unmilled': 'wheat (unmilled)', 'Lamb and mutton': 'lamb and mutton',
              'Pork': 'pork', 'Breakfast cereals': 'breakfast cereals', 'Milk and cream': 'milk and cream', 'Bacon and ham': 'bacon and ham', 'Butter': 'butter', 'Eggs & egg products': 'eggs and egg products',
              'Fresh vegetables': 'fresh vegetables', 'Fresh fruit': 'fresh fruit', 'Salmon (inc. smoked)': 'salmon (including smoked)'}
def auk():
    import pandas as pd
    SRC = 'Defra – Agriculture in the United Kingdom'; xls = {}; n = 0; pubs = []
    def book(ch):
        if ch not in xls:
            raw, pub = fetch('auk_chapter%d.ods' % ch, AUK_URL, r'AUK-chapter%d-[0-9]+i?\.ods$' % ch); pubs.append(pub)
            xls[ch] = pd.ExcelFile(io.BytesIO(raw), engine='odf')
        return xls[ch]
    cache = {}
    for ch, sh, tb, after, row, sid, grp, lab, unit, mul in auk_specs():
        try:
            if (ch, sh, tb) not in cache: cache[(ch, sh, tb)] = auk_table(book(ch).parse(sh, header=None), tb)
            d = auk_row(cache[(ch, sh, tb)], row, after)
        except Exception as e: log('AUK: error en', sh, tb, repr(e)); continue
        if d is None: log('AUK: no está la fila', row, 'en', sh); continue
        pts = [(p, None if v is None else v * mul) for p, v in d.items() if v is not None]
        if not pts or (pts[-1][0] < '2023' and sid != 'uk-auk-milk-price-incl-bonus'):  # Defra dejó de publicar esa serie (confidencial): no se enseña una serie muerta
            log('AUK: omitida (sin datos recientes)', sid, pts[-1][0] if pts else '-'); continue
        note = 'Series ends in 2020: Defra replaced it with the price excluding bonus payments from 2015' if sid == 'uk-auk-milk-price-incl-bonus' else 'The latest year is provisional (Defra)'
        if put(sid, grp, lab, unit, 'annual', pts, SRC, {'periodNote': note}): n += 1
    # renta de las explotaciones por país y tipo (tabla 3.1a; Inglaterra ya viene de la serie larga de FBI)
    try:
        rows = auk_table(book(3).parse('Table_3_1', header=None), 'Table 3.1a')
        for lab, d in rows:
            m = re.match(r'^(England|Wales|Scotland|Nothern Ireland|Northern Ireland|United Kingdom)\s*:\s*(.+)$', lab)
            if not m or m.group(1) == 'England': continue
            ctry = 'Northern Ireland' if m.group(1).startswith('Noth') else m.group(1); ty = FBI_TYPE.get(m.group(2).strip().lower())
            if not ty: log('AUK: tipo de granja desconocido', lab); continue
            if put('uk-auk-fbi-%s-%s' % (slug_(ctry), slug_(ty)), 'income', 'Farm Business Income, %s: %s (GBP per farm, current prices)' % (ctry, ty), 'GBP/farm', 'annual', list(d.items()), SRC,
                   {'periodNote': 'Farm year starting in the period shown (2024 = 2024/25); figures rounded by Defra; the latest year may be provisional'}): n += 1
    except Exception as e: log('AUK: error en renta por país', repr(e))
    # comercio exterior de productos clave en volumen (13.3) y valor por tipo (13.1a), a precios de 2025 en el caso del valor
    for flow, sh3, sh1 in (('exports', 'Table_13_3_Exports', 'Table_13_1a_Exports'), ('imports', 'Table_13_3_Imports', 'Table_13_1a_Imports')):
        try:
            for lab, d in auk_table(book(13).parse(sh3, header=None), None):
                if lab not in TRADE_ITEM: continue
                if put('uk-auk-trade-%s-%s' % (flow, slug_(TRADE_ITEM[lab])), 'trade', 'UK %s of key commodities: %s (tonnes)' % (flow, TRADE_ITEM[lab]), 't', 'annual', [(p, None if v is None else v * 1000) for p, v in d.items()], SRC,
                       {'periodNote': 'Volumes from HMRC trade data via Defra'}): n += 1
            for lab, d in auk_table(book(13).parse(sh1, header=None), None, lab_col=1):
                if lab.lower() == 'total': lab = 'total'
                if put('uk-auk-tradevalue-%s-%s' % (flow, slug_(lab)), 'trade', 'UK %s of food, feed and drink: %s (GBP million, 2025 prices)' % (flow, lab), 'GBP million', 'annual', list(d.items()), SRC,
                       {'periodNote': 'Real terms, 2025 prices; HMRC trade data via Defra'}): n += 1
        except Exception as e: log('AUK: error en comercio', flow, repr(e))
    PUB['auk'] = max(pubs) if pubs else ''; log('Agriculture in the UK:', n, 'series; publicado', PUB['auk'])

def main():
    for fn in (slaughter, fbi, livestock, cereals, eggs, poultry, cereals_regions, milk, milk_products, auk):
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

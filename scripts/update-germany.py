#!/usr/bin/env python3
"""Alemania -> data/germany-stats.json (countries.DE)
Fuentes con licencia explícita (verificada en los metadatos de GovData/BLE/Destatis):
  - BLE Kuhmilchpreise und -mengen (Datenlizenz Deutschland – Zero 2.0), mensual desde 2012
  - BLE Schlachtpreise, informe semanal (Datenlizenz Deutschland – Namensnennung 2.0), semanal desde 2022
  - BLE Markt- und Preisbericht Obst und Gemüse (Zero 2.0), semanal desde 2022
  - Destatis 61211-0001 / 61211-0003 / 61221-0003 (Namensnennung 2.0). Con el token GENESIS_TOKEN (cuenta gratuita de
    Destatis) se baja la serie completa desde 1968 por la API (data/tablefile, ffcsv). Sin token, o si la API falla,
    se usa la descarga estática sin registro, que son ventanas móviles (anual 10 años, mensual año en curso,
    trimestral 10 puntos); en ese caso se acumulan entre ejecuciones.
No se estima nada; las celdas vacías se omiten.
"""
import csv, datetime, json, os, re, sys, urllib.request, collections

LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)

def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'}), timeout=180) as r:
                return r.read()
        except Exception as e:
            last = e
    raise RuntimeError('%s -> %s' % (u, last))

def dec(b):
    try: return b.decode('utf-8-sig')
    except UnicodeDecodeError: return b.decode('cp1252', 'replace')

def num(s):
    s = (s or '').strip()
    if not s or s in ('.', '..', '...', '-', '/', 'x', '–'): return None
    try:
        if ',' in s: return float(s.replace('.', '').replace(',', '.'))
        if re.match(r'^\d{1,3}(\.\d{3})+$', s): return float(s.replace('.', ''))
        return float(s)
    except ValueError:
        return None

OUT = {}
def put(sid, group, label, unit, freq, pts, extra=None):
    pts = sorted(set((p, v) for p, v in pts))
    d = {}
    for p, v in pts: d[p] = v
    pts = [[p, round(v, 3)] for p, v in sorted(d.items())]
    if len(pts) < 2: return
    last, prev = pts[-1], pts[-2]
    ch = round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None
    s = dict(id=sid, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1], changePct=ch, points=pts)
    if extra: s.update(extra)
    OUT[sid] = s

def iso_monday(code):
    y, w = int(str(code)[:4]), int(str(code)[4:])
    return datetime.date.fromisocalendar(y, w, 1).isoformat()

O = 'https://open-data.ble.de/dataset/'

# ---------------- Leche ----------------
REG = {'Deutschland': 'Germany', 'Bundesgebiet Ost': 'East Germany', 'Bundesgebiet West': 'West Germany', 'Niedersachsen / Bremen': 'Lower Saxony / Bremen', 'Nordrhein-Westfalen': 'North Rhine-Westphalia',
       'Baden-Württemberg': 'Baden-Württemberg', 'Bayern': 'Bavaria', 'Hessen / Rheinland-Pfalz / Saarland': 'Hesse / Rhineland-Palatinate / Saarland', 'Schleswig-Holstein / Hamburg': 'Schleswig-Holstein / Hamburg',
       'Mecklenburg-Vorpommern': 'Mecklenburg-Western Pomerania', 'Sachsen': 'Saxony', 'Sachsen-Anhalt': 'Saxony-Anhalt', 'Thüringen': 'Thuringia', 'Brandenburg / Berlin': 'Brandenburg / Berlin'}
SYS = {'Konventionell': 'conventional', 'Biologisch': 'organic'}
def milk():
    t = dec(get(O + 'a617636f-28eb-4e6c-abb0-c45cbe8b22f1/resource/a50035d4-a14c-4677-8e65-2fc5b6c1eaf9/download/kuhmilchpreise-mengen.csv'))
    R = [r for r in csv.reader(t.splitlines()) if len(r) >= 11][1:]
    by = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in R:
        m = re.match(r'^(\d{2})-(\d{4})$', r[1])
        if not m or r[2] not in REG or r[3] not in SYS: continue
        p = '%s-%s' % (m.group(2), m.group(1))
        by[(r[2], r[3])]['abhof_std'].append((p, num(r[6])))
        by[(r[2], r[3])]['abhof'].append((p, num(r[7])))
        by[(r[2], r[3])]['molk'].append((p, num(r[8])))
        kg = num(r[5]); by[(r[2], r[3])]['vol'].append((p, kg / 1000 if kg else None))
        by[(r[2], r[3])]['prot'].append((p, num(r[9]))); by[(r[2], r[3])]['fat'].append((p, num(r[10])))
    for (reg, sy), d in by.items():
        g = 'milk' if reg == 'Deutschland' else 'milk_regions'
        pre = '%s, %s milk' % (REG[reg], SYS[sy]) if g == 'milk_regions' else '%s milk' % SYS[sy].capitalize()
        k = re.sub(r'[^a-z0-9]+', '-', (reg + '-' + sy).lower())
        clean = lambda pts: [(p, v) for p, v in pts if v is not None and v > 0]
        put('de-milk-abhof-std-' + k, g, pre + ': farm-gate price, standardised', 'ct/kg', 'monthly', clean(d['abhof_std']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
        if g == 'milk':
            put('de-milk-abhof-' + k, g, pre + ': farm-gate price, actual composition', 'ct/kg', 'monthly', clean(d['abhof']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
            put('de-milk-molkerei-' + k, g, pre + ': price delivered to dairy, standardised', 'ct/kg', 'monthly', clean(d['molk']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
            put('de-milk-vol-' + k, g, pre + ': milk delivered', 't', 'monthly', clean(d['vol']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
            put('de-milk-fat-' + k, g, pre + ': fat content', '%', 'monthly', clean(d['fat']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
            put('de-milk-protein-' + k, g, pre + ': protein content', '%', 'monthly', clean(d['prot']), {'sourceGroup': 'BLE – Kuhmilchpreise und -mengen'})
    log('leche', len(by), 'combinaciones')

# ---------------- Sacrificio ----------------
ANIM = {('Rind', 'Jungbullenfleisch'): 'Young bulls', ('Rind', 'Kuhfleisch'): 'Cows', ('Rind', 'Färsenfleisch'): 'Heifers', ('Rind', 'Bullenfleisch'): 'Bulls',
        ('Rind', 'Ochsenfleisch'): 'Steers', ('Rind', 'Jungrindfleisch'): 'Young cattle', ('Rind', 'Kalbfleisch'): 'Calves (veal)', ('Schaf', 'Lammfleisch'): 'Lambs', ('Schaf', 'Schaffleisch'): 'Sheep (mutton)', ('Schwein', 'Schweinefleisch'): 'Pigs'}
WANT = {('Jungbullenfleisch', 'R3'), ('Jungbullenfleisch', 'U3'), ('Jungbullenfleisch', 'E-P'), ('Kuhfleisch', 'O3'), ('Kuhfleisch', 'P2'), ('Kuhfleisch', 'R3'), ('Kuhfleisch', 'E-P'),
        ('Färsenfleisch', 'R3'), ('Färsenfleisch', 'E-P'), ('Bullenfleisch', 'E-P'), ('Ochsenfleisch', 'E-P'), ('Jungrindfleisch', 'E-P'), ('Kalbfleisch', 'E-P'),
        ('Lammfleisch', 'geschlachtet pauschal'), ('Lammfleisch', 'lebend pauschal'), ('Schaffleisch', 'geschlachtet pauschal'), ('Schweinefleisch', 'E'), ('Schweinefleisch', 'M')}
HALT = {'insgesamt': '', 'konventionell': ', conventional', 'ökologisch': ', organic'}
SREG = {'Niedersachsen und Bremen': 'Lower Saxony and Bremen', 'Nordrhein-Westfalen': 'North Rhine-Westphalia', 'Bayern': 'Bavaria',
        'Baden-Württemberg, Hessen und Rheinland-Pfalz': 'Baden-Württemberg, Hesse and Rhineland-Palatinate', 'Baden-Württemberg': 'Baden-Württemberg', 'Hessen und Rheinland-Pfalz': 'Hesse and Rhineland-Palatinate',
        'Brandenburg, Thüringen, Sachsen und Mecklenburg-Vorpommern': 'Brandenburg, Thuringia, Saxony and Mecklenburg-Western Pomerania',
        'Brandenburg, Mecklenburg-Vorpommern, Sachsen,Sachsen-Anhalt, Thüringen und Schleswig-Holstein': 'Brandenburg, Mecklenburg-Western Pomerania, Saxony, Saxony-Anhalt, Thuringia and Schleswig-Holstein',
        'Schleswig-Holstein und Hamburg': 'Schleswig-Holstein and Hamburg'}
RWANT = {('Jungbullenfleisch', 'R3'), ('Kuhfleisch', 'O3'), ('Färsenfleisch', 'R3'), ('Schweinefleisch', 'E'), ('Kalbfleisch', 'E-P')}
def slaughter():
    t = dec(get(O + 'c4eb6408-8cb2-42f9-b341-79fb57f81788/resource/214ea514-205b-4857-a78d-e254fae0983c/download/schlachtpreise-woche.csv'))
    acc = collections.defaultdict(list); n = 0; racc = collections.defaultdict(list)
    for r in csv.reader(t.splitlines()):
        if len(r) >= 9 and r[5] in SREG and r[6] == '€/100 kg' and r[7] == 'Kaltgewicht' and r[3] == 'insgesamt' and (r[2], r[4]) in RWANT and (r[1], r[2]) in ANIM:
            v = num(r[8])
            if v is not None and v > 0 and re.match(r'^\d{6}$', r[0]): racc[(r[1], r[2], r[4], r[5])].append((iso_monday(r[0]), v))
            continue
        if len(r) < 9 or r[5] != 'Deutschland' or r[6] != '€/100 kg' or r[7] != 'Kaltgewicht': continue
        if (r[1], r[2]) not in ANIM or (r[2], r[4]) not in WANT or r[3] not in HALT: continue
        if r[3] != 'insgesamt' and r[4] != 'E-P': continue  # ecológico/convencional solo en E-P
        v = num(r[8]); 
        if v is None or v <= 0 or not re.match(r'^\d{6}$', r[0]): continue
        acc[(r[1], r[2], r[3], r[4])].append((iso_monday(r[0]), v)); n += 1
    for (a, k, h, c), pts in acc.items():
        cls = c.replace('geschlachtet pauschal', 'slaughtered, all classes').replace('lebend pauschal', 'live, all classes')
        label = '%s, %s%s (Germany, carcass)' % (ANIM[(a, k)], 'class ' + cls if not cls.startswith(('slaughtered', 'live')) else cls, HALT[h])
        put('de-meat-%s-%s-%s' % (re.sub(r'[^a-z0-9]+', '-', k.lower()), re.sub(r'[^a-z0-9]+', '-', c.lower()), h[:3]), 'prices_lv', label, '€/100 kg cold carcass', 'weekly', pts, {'sourceGroup': 'BLE – Schlachtpreise (Wochenbericht)'})
    for (a, k, c, g), pts in racc.items():
        put('de-meatreg-%s-%s-%s' % (re.sub(r'[^a-z0-9]+', '-', k.lower()), re.sub(r'[^a-z0-9]+', '-', c.lower()), re.sub(r'[^a-z0-9]+', '-', g.lower())[:40]), 'meat_regions',
            '%s, class %s: %s' % (ANIM[(a, k)], c, SREG[g]), '€/100 kg cold carcass', 'weekly', pts, {'sourceGroup': 'BLE – Schlachtpreise (Wochenbericht)'})
    log('sacrificio', len(acc), 'series', n, 'filas; regionales', len(racc))

# ---------------- Frutas y hortalizas ----------------
GR = {'Äpfel': 'Apples', 'Birnen': 'Pears', 'Tomaten': 'Tomatoes', 'Orangen': 'Oranges', 'Gurken': 'Cucumbers', 'Tafeltrauben': 'Table grapes', 'Gemüsepaprika': 'Peppers', 'Kiwis': 'Kiwis', 'Mandarinen': 'Mandarins',
      'Blumenkohl': 'Cauliflower', 'Pfirsiche': 'Peaches', 'Nektarinen': 'Nectarines', 'Zwiebeln': 'Onions', 'Auberginen': 'Aubergines', 'Zitronen': 'Lemons', 'Zucchini': 'Courgettes', 'Möhren': 'Carrots',
      'Erdbeeren': 'Strawberries', 'Spargel': 'Asparagus', 'Bohnen': 'Beans', 'Kopfsalat': 'Lettuce', 'Bananen': 'Bananas', 'Lauch': 'Leeks', 'Zwetschgen': 'Plums (Zwetschgen)', 'Aprikosen': 'Apricots', 'Kirschen': 'Cherries'}
OR = {'Deutschland': 'Germany', 'Italien': 'Italy', 'Spanien': 'Spain', 'Niederlande': 'Netherlands', 'Belgien': 'Belgium', 'Frankreich': 'France', 'Türkei': 'Turkey', 'Griechenland': 'Greece', 'Neuseeland': 'New Zealand', 'Ägypten': 'Egypt',
      'Chile': 'Chile', 'Südafrika': 'South Africa', 'Polen': 'Poland', 'Marokko': 'Morocco', 'Portugal': 'Portugal', 'Österreich': 'Austria', 'Argentinien': 'Argentina', 'Peru': 'Peru'}
def fv():
    t = dec(get(O + '10824baf-7569-470c-95f2-c78f4facf5f1/resource/d92b81a6-af6a-482f-b1bc-0a7138bf11d1/download/marktundpreis-obstgemuese.csv'))
    acc = collections.defaultdict(dict)
    for r in csv.reader(t.splitlines()):
        if len(r) < 9 or r[6] != 'Deutschland' or not re.match(r'^\d{6}$', r[1]) or r[3] not in GR: continue
        v = num(r[8])
        if v is None or v <= 0: continue
        try: d = iso_monday(r[1])
        except ValueError: continue
        acc[(r[3], r[4], r[5], r[2])][d] = v
    today = datetime.date.today()
    cand = [(k, v) for k, v in acc.items() if len(v) >= 120 and (today - datetime.date.fromisoformat(max(v))).days < 400]
    cand.sort(key=lambda kv: -len(kv[1]))
    for (g, prod, size, org), v in cand[:45]:
        extra = ' %s' % prod if prod not in ('/', 'Sonstige Sorten') else ''
        sz = ', size %s' % size if size not in ('/', 'lose', '') else ''
        label = '%s%s%s (origin: %s)' % (GR[g], (' –' + extra) if extra else '', sz, OR.get(org, org))
        put('de-fv-' + re.sub(r'[^a-z0-9]+', '-', ('%s-%s-%s-%s' % (g, prod, size, org)).lower().replace('ä', 'a').replace('ö', 'o').replace('ü', 'u')).strip('-')[:70], 'prices_fv', label, '€/100 kg', 'weekly', list(v.items()), {'sourceGroup': 'BLE – Markt- und Preisbericht Obst und Gemüse'})
    log('fruta-hortaliza candidatas', len(cand), 'incluidas', min(45, len(cand)))

# ---------------- Destatis ----------------
MONTHS = {m: i + 1 for i, m in enumerate(['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'])}
def destatis(table):
    t = dec(get('https://genesis.destatis.de/genesisWS/downloads/00/tables/%s_00.csv' % table))
    L = [l.split(';') for l in t.splitlines()]
    return L
def genesis_raw(table, token, startyear='1968', **extra):
    """Descarga una tabla de la API GENESIS en formato plano (ffcsv) y devuelve el texto."""
    import io, zipfile, urllib.parse
    h = {'Content-Type': 'application/x-www-form-urlencoded', 'username': token, 'password': '', 'Accept': '*/*', 'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
    q = {'name': table, 'startyear': startyear, 'format': 'ffcsv', 'compress': 'false', 'language': 'de'}; q.update(extra)
    body = urllib.parse.urlencode(q).encode()
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request('https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile', data=body, headers=h, method='POST'), timeout=240) as r:
                raw = r.read()
            break
        except Exception as e:
            last = e; raw = None
    if raw is None: raise RuntimeError('GENESIS %s -> %s' % (table, str(last).replace(token, '<token>')))
    if raw[:2] == b'PK':
        z = zipfile.ZipFile(io.BytesIO(raw)); raw = z.read(z.namelist()[0])
    txt = dec(raw)
    if not txt.lstrip('\ufeff').startswith('statistics_code'): raise RuntimeError('GENESIS %s: respuesta inesperada %s' % (table, txt[:160].replace(token, '<token>')))
    return txt

def genesis_table(table, token):
    """Serie completa desde la API GENESIS. Devuelve {codigo: (etiqueta, [(periodo, valor)])}."""
    return parse_flat(genesis_raw(table, token))

def parse_flat(txt):
    rows = list(csv.reader(txt.splitlines(), delimiter=';'))
    if not rows or 'value' not in rows[0]: raise RuntimeError('ffcsv sin cabecera esperada: ' + (txt[:120] if txt else 'vacio'))
    H = rows[0]; ix = {c: i for i, c in enumerate(H)}
    nv = max(int(c.split('_')[0]) for c in H if re.match(r'^\d+_variable_attribute_code$', c))
    prod = '%d_variable_attribute_code' % nv; prodl = '%d_variable_attribute_label' % nv
    res = {}; seen = set()
    for r in rows[1:]:
        if len(r) < len(H): continue
        code = r[ix[prod]].strip(); t = r[ix['time']].strip(); v = num(r[ix['value']])
        if not re.match(r'^LW[A-Z]*(-\d+)*$', code) or v is None: continue
        if '1_variable_code' in ix and r[ix['1_variable_code']] == 'MONAT':
            m = MONTHS.get(r[ix['1_variable_attribute_label']].strip()); per = '%s-%02d' % (t, m) if m else None
        elif re.match(r'^\d{4}-\d{2}P1M$', t): per = t[:7]
        elif re.match(r'^\d{4}$', t): per = t
        else: per = None
        if not per: continue
        k = (code, per)
        if k in seen: continue
        seen.add(k)
        res.setdefault(code, (r[ix[prodl]].strip(), []))[1].append((per, v))
    return res

def parse_idx(L, mode):
    """devuelve {code:(label,[(period,val)])}"""
    hdr = None; hdr2 = None
    for i, r in enumerate(L):
        c = [x.strip() for x in r[2:]]
        if mode == 'annual' and c and all(re.match(r'^\d{4}$', x) for x in c if x) and any(c): hdr = c; start = i + 1; break
        if mode == 'quarter' and c and all(re.match(r'^\d{2}/\d{4}$', x) for x in c if x) and any(c): hdr = c; start = i + 1; break
        if mode == 'month' and c and all(re.match(r'^\d{4}$', x) for x in c if x) and any(c): hdr = c; hdr2 = [x.strip() for x in L[i + 1][2:]]; start = i + 2; break
    if hdr is None: raise RuntimeError('cabecera no encontrada')
    per = []
    for j, h in enumerate(hdr):
        if mode == 'annual': per.append(h)
        elif mode == 'quarter': per.append('%s-%s' % (h[3:], h[:2]))
        else:
            m = MONTHS.get(hdr2[j]); per.append('%s-%02d' % (h, m) if m else None)
    res = {}
    for r in L[start:]:
        if len(r) < 3 or not re.match(r'^LW[A-Z]*(-\d+)*$', r[0].strip()): continue
        pts = []
        for j, p in enumerate(per):
            if p and 2 + j < len(r):
                v = num(r[2 + j])
                if v is not None: pts.append((p, v))
        res[r[0].strip()] = (r[1].strip(), pts)
    return res

TR = {}
try:
    TR = json.load(open('scripts/de-labels.json'))
except Exception:
    pass
def tlabel(code, de):
    return TR.get(code, de)

PREV = {}
if os.path.exists('data/germany-stats.json'):
    try:
        for s in json.load(open('data/germany-stats.json'))['countries']['DE']['series']: PREV[s['id']] = s
    except Exception: pass

def idx_series(table, mode, group, pre, freq, title, windowed):
    res = None; tok = os.environ.get('GENESIS_TOKEN', '').strip()
    if tok:
        try:
            res = genesis_table(table, tok); windowed = False
            log('GENESIS API', table, len(res), 'series; periodos', min(p for _, (_, pts) in res.items() for p, _ in pts), '..', max(p for _, (_, pts) in res.items() for p, _ in pts))
        except Exception as e:
            log('AVISO GENESIS API fallo, se usa la descarga estatica:', table, str(e)[:200]); res = None
    else:
        log('sin GENESIS_TOKEN: descarga estatica (ventana movil)')
    if res is None:
        try:
            res = parse_idx(destatis(table), mode)
        except Exception as e:
            log('ERROR destatis', table, e); return
    for code, (de, pts) in res.items():
        sid = 'de-%s-%s' % (pre, code.lower())
        old = PREV.get(sid)
        if windowed and old: pts = [(p, v) for p, v in old['points']] + pts
        put(sid, group, '%s: %s (2020=100)' % (title, tlabel(code, de)), 'index 2020=100', freq, pts, {'sourceGroup': 'Destatis – ' + table, 'code': code})
    log('destatis', table, len(res), 'series')

def agri():
    """Produccion por Land, precios y alquileres de tierra -> data/germany-agri.json (solo con token GENESIS; si falla se conserva el fichero anterior)."""
    tok = os.environ.get('GENESIS_TOKEN', '').strip()
    if not tok: log('agri: sin GENESIS_TOKEN, se conserva data/germany-agri.json'); return
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import de_agri
    try:
        t = {}
        for n, sy in (('41241-0010', '2010'), ('41241-0005', '2010'), ('41241-0001', '1950'), ('41241-0002', '1950'), ('41241-0003', '1950'), ('61521-0010', '2021'), ('61521-0001', '2021'), ('61521-0100', '1991'), ('41141-0010', '2010')):
            t[n] = genesis_raw(n, tok, startyear=sy); log('agri GENESIS', n, len(t[n].splitlines()), 'filas')
        rl = {}
        for code in sorted(de_agri.LAND):
            rl[code] = genesis_raw('41141-0110', tok, startyear='2010', regionalvariable='DLAND', regionalkey=code); log('agri alquileres Land', code, len(rl[code].splitlines()), 'filas')
        d = de_agri.build(t, rl)
        if len(d['production']['land']) < 8 or len(d['landPrice']['land']) < 12 or len(d['rent']['land']) < 14:
            raise RuntimeError('agri incompleto: cultivos %d, precios %d, alquileres %d' % (len(d['production']['land']), len(d['landPrice']['land']), len(d['rent']['land'])))
        yrs = [y for c in d['production']['land'].values() for l in c.values() for v in l.values() for y, _ in v]
        d.update({'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
                  'source': {'name': 'Statistisches Bundesamt (Destatis), GENESIS-Online', 'url': 'https://www-genesis.destatis.de/', 'license': 'Datenlizenz Deutschland – Namensnennung 2.0', 'tables': sorted(set(list(t) + ['41141-0110']))},
                  'crops': [{'k': c[0], 'de': c[1]} for c in de_agri.CROPS], 'lastHarvestYear': max(yrs)})
        json.dump(d, open('data/germany-agri.json', 'w'), ensure_ascii=False, separators=(',', ':'))
        log('agri OK', os.path.getsize('data/germany-agri.json'), 'bytes')
    except Exception as e:
        log('AVISO agri fallo, se conserva el fichero anterior:', str(e)[:300].replace(tok, '<token>'))

def main():
    for fn in (milk, slaughter, fv):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, e)
    idx_series('61211-0001', 'annual', 'idx_perc', 'out-a', 'annual', 'Producer price index, annual', False)
    idx_series('61211-0003', 'month', 'idx_perc', 'out-m', 'monthly', 'Producer price index', True)
    idx_series('61221-0003', 'quarter', 'idx_pag', 'in-q', 'quarterly', 'Input price index', True)
    agri()
    if len(OUT) < 20:
        log('demasiado pocas series; no se escribe'); open('data/germany-log.txt', 'w').write('\n'.join(LOG)); sys.exit(1)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'DE': {'name': 'Germany', 'source': {'name': 'BLE (Bundesanstalt für Landwirtschaft und Ernährung) and Destatis', 'url': 'https://open-data.ble.de/', 'license': 'Datenlizenz Deutschland – Namensnennung 2.0 / Zero 2.0'}, 'series': list(OUT.values())}},
           'log': LOG[-40:]}
    json.dump(doc, open('data/germany-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    log('series', len(OUT))
    open('data/germany-log.txt', 'w').write('\n'.join(LOG))
    if os.environ.get('DE_LABELS'):
        open('data/probe/de-codes.txt', 'w').write('\n'.join('%s\t%s' % (s['code'], s['label']) for s in OUT.values() if 'code' in s))
main()

#!/usr/bin/env python3
"""Comercio por producto y socio de Reino Unido, Chile y Canada -> data/uk-trade-products.json, data/cl-trade-products.json, data/ca-trade-products.json
(mismo esquema que eu-trade-products.json: years, unit, source, reporters{CC: {producto: {name, nm, exp|imp: {world, extra, intra, partners[{c,n,v[]}]}}}}).
Fuentes nacionales abiertas, sin claves:
  UK  HMRC UK Trade Info (OTS, OData), Open Government Licence v3.0. Flujos 1/2 = UE, 3/4 = no UE. Valor en GBP.
  CL  ODEPA, datos abiertos (Aduanas), CC BY: ficheros anuales comex_exportacion_YYYY.csv / comex_importacion_YYYY.csv. Valor FOB/CIF en USD.
  CA  Statistics Canada, tabla 12-10-0171-01 (comercio por pais y seccion de producto NAPCS), Open Government Licence - Canada. Solo hay una seccion agraria.
Cada pais es independiente: si falla, su fichero anterior se queda como esta. Solo anos naturales completos. Sin estimaciones.
Uso: python3 scripts/update-trade-partners.py [UK CL CA]"""
import csv, datetime, io, json, pathlib, re, sys, time, urllib.parse, urllib.request, zipfile
from collections import defaultdict
ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
NOW = datetime.datetime.now(datetime.timezone.utc)
YEARS = [NOW.year - k for k in range(5, 0, -1)]
TOP = 15
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, data=None, t=300, hdr=None):
    last = None
    for i in range(3):
        try:
            h = dict(UA); h.update(hdr or {})
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=h), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(4)
    raise RuntimeError('%s -> %s' % (u[:110], last))
def write(cc, unit, source, products, years):
    doc = {'schemaVersion': 1, 'generatedAt': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'), 'years': [str(y) for y in years], 'unit': unit, 'source': source, 'reporters': {cc: products}}
    p = ROOT / 'data' / ('%s-trade-products.json' % cc.lower())
    if p.exists():
        try:
            old = json.loads(p.read_text(encoding='utf-8')); a = dict(old); b = dict(doc); a.pop('generatedAt', None); b.pop('generatedAt', None)
            if a == b: log(cc, 'sin cambios'); return
        except Exception: pass
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8'); log(cc, 'escrito', len(products), 'productos', years[0], '-', years[-1])
def node(world, extra, intra, rows, nyears):
    rows = [r for r in rows if any(r['v'])]; rows.sort(key=lambda r: -(r['v'][-1] or 0))
    return {'world': [round(x, 3) for x in world], 'extra': extra, 'intra': intra, 'partners': rows[:TOP]}
# ---------------------------------------------------------------- UK
UK_P = (('0201-0202', 'Beef', 'beef', 2010000, 2030000), ('0203', 'Pork', 'pork', 2030000, 2040000), ('0207', 'Poultry meat', 'poultry', 2070000, 2080000), ('0204', 'Sheep meat', 'sheep', 2040000, 2050000),
        ('04', 'Dairy and eggs (HS 04)', 'dairy', 4000000, 5000000), ('0406', 'Cheese and curd', 'cheese', 4060000, 4070000), ('1001', 'Wheat', 'wheat', 10010000, 10020000), ('1003', 'Barley', 'barley', 10030000, 10040000),
        ('1005', 'Maize', 'maize', 10050000, 10060000), ('12', 'Oilseeds (HS 12)', 'oilseeds', 12000000, 13000000), ('17', 'Sugar (HS 17)', 'sugar', 17000000, 18000000), ('07', 'Vegetables (HS 07)', 'veg', 7000000, 8000000),
        ('08', 'Fruit and nuts (HS 08)', 'fruit', 8000000, 9000000), ('2204', 'Wine', 'wine', 22040000, 22050000), ('31', 'Fertilisers (HS 31)', 'fert', 31000000, 32000000), ('01', 'Live animals (HS 01)', 'live', 1000000, 2000000))
UK_NM = {'beef': ('Carne de vacuno', 'Beef', 'Viande bovine', 'Carne bovina'), 'pork': ('Carne de cerdo', 'Pork', 'Viande porcine', 'Carne suina'), 'poultry': ('Carne de aves', 'Poultry meat', 'Viande de volaille', 'Carne avicola'),
         'sheep': ('Carne de ovino', 'Sheep meat', 'Viande ovine', 'Carne ovina'), 'dairy': ('Lacteos y huevos (cap. 04)', 'Dairy and eggs (HS 04)', 'Produits laitiers et oeufs (ch. 04)', 'Latticini e uova (cap. 04)'),
         'cheese': ('Queso y cuajada', 'Cheese and curd', 'Fromage et caille', 'Formaggio e cagliata'), 'wheat': ('Trigo', 'Wheat', 'Ble', 'Grano'), 'barley': ('Cebada', 'Barley', 'Orge', 'Orzo'), 'maize': ('Maiz', 'Maize', 'Mais', 'Mais'),
         'oilseeds': ('Oleaginosas (cap. 12)', 'Oilseeds (HS 12)', 'Oleagineux (ch. 12)', 'Semi oleosi (cap. 12)'), 'sugar': ('Azucar (cap. 17)', 'Sugar (HS 17)', 'Sucre (ch. 17)', 'Zucchero (cap. 17)'),
         'veg': ('Hortalizas (cap. 07)', 'Vegetables (HS 07)', 'Legumes (ch. 07)', 'Ortaggi (cap. 07)'), 'fruit': ('Fruta y frutos secos (cap. 08)', 'Fruit and nuts (HS 08)', 'Fruits et fruits a coque (ch. 08)', 'Frutta e frutta secca (cap. 08)'),
         'wine': ('Vino', 'Wine', 'Vin', 'Vino'), 'fert': ('Fertilizantes (cap. 31)', 'Fertilisers (HS 31)', 'Engrais (ch. 31)', 'Fertilizzanti (cap. 31)'), 'live': ('Animales vivos (cap. 01)', 'Live animals (HS 01)', 'Animaux vivants (ch. 01)', 'Animali vivi (cap. 01)')}
def nm4(t): return {'es': t[0], 'en': t[1], 'fr': t[2], 'it': t[3]}
def uk():
    B = 'https://api.uktradeinfo.com/'; tr = lambda q: B + urllib.parse.quote(q, safe="/?$=&',()")
    ctry = {}
    u = B + 'Country?$select=CountryId,CountryName,CountryCodeAlpha&$top=1000'
    while u:
        j = json.loads(get(u)); time.sleep(1.1)
        for r in j['value']: ctry[r['CountryId']] = (r['CountryCodeAlpha'].strip(), r['CountryName'].strip())
        u = j.get('@odata.nextLink')
    log('UK paises', len(ctry))
    out = {}
    for code, name, key, lo, hi in UK_P:
        o = {'name': name, 'nm': nm4(UK_NM[key])}
        for flows, tag in (((2, 4), 'exp'), ((1, 3), 'imp')):
            per = defaultdict(lambda: [0.0] * len(YEARS)); wd = [0.0] * len(YEARS); ex = [0.0] * len(YEARS); it = [0.0] * len(YEARS); ok = True
            for yi, y in enumerate(YEARS):
                q = 'OTS?$apply=filter(CommodityId ge %d and CommodityId lt %d and MonthId ge %d01 and MonthId le %d12)/groupby((CountryId,FlowTypeId),aggregate(Value with sum as v))' % (lo, hi, y, y)
                try:
                    u = tr(q)
                    while u:
                        time.sleep(1.1); j = json.loads(get(u))
                        for r in j.get('value', []):
                            if r['FlowTypeId'] not in flows or r.get('v') is None: continue
                            v = r['v'] / 1e6; per[r['CountryId']][yi] += v; wd[yi] += v
                            if r['FlowTypeId'] in (3, 4): ex[yi] += v
                            else: it[yi] += v
                        u = j.get('@odata.nextLink')
                except Exception as e: log('UK ERROR', key, tag, y, repr(e)[:150]); ok = False; break
            if not ok or not any(wd): continue
            rows = []
            for cid, v in per.items():
                c, n = ctry.get(cid, (str(cid), 'Country %s' % cid))
                rows.append({'c': c, 'n': n, 'v': [round(x, 3) for x in v]})
            o[tag] = node(wd, [round(x, 3) for x in ex], [round(x, 3) for x in it], rows, len(YEARS))
        if 'exp' in o or 'imp' in o: out[code] = o; log('UK', code, 'ok')
    if len(out) >= 8:
        write('UK', 'GBP million', {'name': 'HM Revenue & Customs, UK Trade Info (OTS)', 'url': 'https://www.uktradeinfo.com/', 'license': 'Open Government Licence v3.0; cite source'}, out, YEARS)
    else: log('UK: demasiados productos fallidos, se conserva el fichero anterior')
# ---------------------------------------------------------------- Chile
CL_P = (('0201-0202', 'Beef', 'beef', ('0201', '0202')), ('0203', 'Pork', 'pork', ('0203',)), ('0207', 'Poultry meat', 'poultry', ('0207',)), ('0204', 'Sheep meat', 'sheep', ('0204',)), ('04', 'Dairy and eggs (HS 04)', 'dairy', ('04',)),
        ('0406', 'Cheese and curd', 'cheese', ('0406',)), ('1001', 'Wheat', 'wheat', ('1001',)), ('1003', 'Barley', 'barley', ('1003',)), ('1005', 'Maize', 'maize', ('1005',)), ('12', 'Oilseeds (HS 12)', 'oilseeds', ('12',)),
        ('17', 'Sugar (HS 17)', 'sugar', ('17',)), ('07', 'Vegetables (HS 07)', 'veg', ('07',)), ('08', 'Fruit and nuts (HS 08)', 'fruit', ('08',)), ('2204', 'Wine', 'wine', ('2204',)), ('31', 'Fertilisers (HS 31)', 'fert', ('31',)),
        ('01', 'Live animals (HS 01)', 'live', ('01',)), ('1509', 'Olive oil', 'olive', ('1509',)))
CL_NM = dict(UK_NM); CL_NM['olive'] = ('Aceite de oliva', 'Olive oil', 'Huile d’olive', 'Olio d’oliva')
# nombre en espanol de ODEPA -> (ISO2, ingles)
CL_C = {'Estados Unidos': ('US', 'United States'), 'China': ('CN', 'China'), 'Japón': ('JP', 'Japan'), 'Corea del Sur': ('KR', 'South Korea'), 'Brasil': ('BR', 'Brazil'), 'México': ('MX', 'Mexico'), 'Perú': ('PE', 'Peru'),
        'Argentina': ('AR', 'Argentina'), 'Colombia': ('CO', 'Colombia'), 'Ecuador': ('EC', 'Ecuador'), 'Bolivia': ('BO', 'Bolivia'), 'Paraguay': ('PY', 'Paraguay'), 'Uruguay': ('UY', 'Uruguay'), 'Canadá': ('CA', 'Canada'),
        'España': ('ES', 'Spain'), 'Francia': ('FR', 'France'), 'Alemania': ('DE', 'Germany'), 'Italia': ('IT', 'Italy'), 'Países Bajos': ('NL', 'Netherlands'), 'Holanda': ('NL', 'Netherlands'), 'Bélgica': ('BE', 'Belgium'),
        'Reino Unido': ('GB', 'United Kingdom'), 'Portugal': ('PT', 'Portugal'), 'Polonia': ('PL', 'Poland'), 'Rusia': ('RU', 'Russia'), 'Turquía': ('TR', 'Turkey'), 'India': ('IN', 'India'), 'Tailandia': ('TH', 'Thailand'),
        'Vietnam': ('VN', 'Vietnam'), 'Taiwán': ('TW', 'Taiwan'), 'Hong Kong': ('HK', 'Hong Kong'), 'Indonesia': ('ID', 'Indonesia'), 'Malasia': ('MY', 'Malaysia'), 'Filipinas': ('PH', 'Philippines'), 'Australia': ('AU', 'Australia'),
        'Nueva Zelanda': ('NZ', 'New Zealand'), 'Sudáfrica': ('ZA', 'South Africa'), 'Arabia Saudita': ('SA', 'Saudi Arabia'), 'Emiratos Árabes Unidos': ('AE', 'United Arab Emirates'), 'Israel': ('IL', 'Israel'), 'Egipto': ('EG', 'Egypt'),
        'Venezuela': ('VE', 'Venezuela'), 'Panamá': ('PA', 'Panama'), 'Costa Rica': ('CR', 'Costa Rica'), 'Guatemala': ('GT', 'Guatemala'), 'Honduras': ('HN', 'Honduras'), 'El Salvador': ('SV', 'El Salvador'), 'Nicaragua': ('NI', 'Nicaragua'),
        'República Dominicana': ('DO', 'Dominican Republic'), 'Cuba': ('CU', 'Cuba'), 'Suecia': ('SE', 'Sweden'), 'Dinamarca': ('DK', 'Denmark'), 'Noruega': ('NO', 'Norway'), 'Finlandia': ('FI', 'Finland'), 'Irlanda': ('IE', 'Ireland'),
        'Suiza': ('CH', 'Switzerland'), 'Austria': ('AT', 'Austria'), 'Grecia': ('GR', 'Greece'), 'Rumania': ('RO', 'Romania'), 'Rumanía': ('RO', 'Romania'), 'Ucrania': ('UA', 'Ukraine'), 'Marruecos': ('MA', 'Morocco'), 'Argelia': ('DZ', 'Algeria'),
        'Nigeria': ('NG', 'Nigeria'), 'Singapur': ('SG', 'Singapore'), 'Pakistán': ('PK', 'Pakistan'), 'Bangladesh': ('BD', 'Bangladesh'), 'Irán': ('IR', 'Iran'), 'Irak': ('IQ', 'Iraq'), 'Jordania': ('JO', 'Jordan'), 'Líbano': ('LB', 'Lebanon'),
        'Hungría': ('HU', 'Hungary'), 'República Checa': ('CZ', 'Czechia'), 'Bulgaria': ('BG', 'Bulgaria'), 'Croacia': ('HR', 'Croatia'), 'Eslovaquia': ('SK', 'Slovakia'), 'Lituania': ('LT', 'Lithuania'), 'Letonia': ('LV', 'Latvia'), 'Estonia': ('EE', 'Estonia'), 'Puerto Rico': ('PR', 'Puerto Rico'), 'Brunei': ('BN', 'Brunei'), 'Rep. Dominicana': ('DO', 'Dominican Republic'), 'Qatar': ('QA', 'Qatar'), 'Chipre': ('CY', 'Cyprus'), 'Omán': ('OM', 'Oman'), 'Bielorrusia': ('BY', 'Belarus'), 'Rep. Checa': ('CZ', 'Czechia'), 'Kuwait': ('KW', 'Kuwait'), 'República de Servia': ('RS', 'Serbia'), 'Libia': ('LY', 'Libya'), 'Kazajstán': ('KZ', 'Kazakhstan'), 'Sri Lanka': ('LK', 'Sri Lanka'), 'Chile': ('CL', 'Chile')}
def cl_num(s):
    try: return float(str(s).replace('.', '').replace(',', '.')) if ',' in str(s) and str(s).count(',') == 1 and '.' in str(s) else float(str(s).replace(',', '.'))
    except Exception: return None
def cl():
    pk = json.loads(get('https://datos.odepa.gob.cl/api/3/action/package_show?id=comercio-exterior'))['result']
    if pk.get('license_id') != 'cc-by': raise RuntimeError('licencia ODEPA distinta de cc-by: %r' % pk.get('license_id'))
    res = {}
    for x in pk['resources']:
        m = re.match(r'(Exportaciones|Importaciones) del a', x['name'])
        y = re.search(r'(\d{4})', x['name'])
        if m and y and int(y.group(1)) in YEARS: res[(m.group(1), int(y.group(1)))] = x['url']
    out = {}; unk = defaultdict(float)
    acc = {(fl, p[2]): defaultdict(lambda: defaultdict(float)) for fl in ('Exportaciones', 'Importaciones') for p in CL_P}
    months = defaultdict(set)
    for (fl, y), u in sorted(res.items()):
        raw = get(u, t=600).decode('utf-8-sig', 'replace'); rd = csv.DictReader(io.StringIO(raw)); vcol = 'USD FOB' if fl == 'Exportaciones' else 'USD CIF'; pcol = 'Pais destino' if fl == 'Exportaciones' else 'Pais origen'
        for r in rd:
            try: months[(fl, y)].add(int(r['Mes']))
            except Exception: continue
            code = r['Codigo producto']; v = cl_num(r.get(vcol))
            if v is None: continue
            for hs, name, key, prefs in CL_P:
                if code.startswith(prefs[0]) or any(code.startswith(p) for p in prefs):
                    acc[(fl, key)][r[pcol].strip()][y] += v; break
        log('CL', fl, y, 'ok', len(months[(fl, y)]), 'meses')
    yrs = [y for y in YEARS if all(len(months[(fl, y)]) == 12 for fl in ('Exportaciones', 'Importaciones'))]
    if len(yrs) < 3: raise RuntimeError('menos de 3 anos completos')
    for hs, name, key, prefs in CL_P:
        o = {'name': name, 'nm': nm4(CL_NM[key])}
        for fl, tag in (('Exportaciones', 'exp'), ('Importaciones', 'imp')):
            d = acc[(fl, key)]
            if not d: continue
            world = [sum(v.get(y, 0.0) for v in d.values()) / 1e6 for y in yrs]; rows = []
            for pais, v in d.items():
                iso, en = CL_C.get(pais, (pais, pais))
                if pais not in CL_C: unk[pais] += sum(v.values())
                rows.append({'c': iso, 'n': en, 'v': [round(v.get(y, 0.0) / 1e6, 3) for y in yrs]})
            o[tag] = node(world, None, None, rows, len(yrs))
        if 'exp' in o or 'imp' in o: out[hs] = o
    for p, v in sorted(unk.items(), key=lambda kv: -kv[1])[:15]: log('CL pais sin traducir:', p, round(v / 1e6, 2))
    write('CL', 'USD million', {'name': 'ODEPA (Oficina de Estudios y Politicas Agrarias), comercio exterior (Aduanas)', 'url': 'https://datos.odepa.gob.cl/', 'license': 'Creative Commons Attribution (CC BY)'}, out, yrs)
# ---------------------------------------------------------------- Canada
def ca():
    b = get('https://www150.statcan.gc.ca/n1/tbl/csv/12100171-eng.zip', t=600); z = zipfile.ZipFile(io.BytesIO(b))
    nm = [n for n in z.namelist() if n.endswith('.csv') and 'MetaData' not in n][0]
    rd = csv.DictReader(io.TextIOWrapper(z.open(nm), encoding='utf-8-sig'))
    sect = 'Farm, fishing and intermediate food products [C11]'; data = {'Export': defaultdict(dict), 'Import': defaultdict(dict)}; seen = set(); unit = None
    for r in rd:
        if r.get('North American Product Classification System (NAPCS)') != sect: continue
        pr = r.get('Trading partner'); tr_ = r.get('Trade')
        if tr_ not in data or not r.get('VALUE'): continue
        y = int(r['REF_DATE'][:4]); seen.add(y); sc = {'units': 1, 'thousands': 1e3, 'millions': 1e6}.get((r.get('SCALAR_FACTOR') or 'units').lower(), 1)
        unit = (r.get('UOM') or '').strip(); data[tr_][pr][y] = float(r['VALUE']) * sc / 1e6
    yrs = [y for y in range(max(seen) - 4, max(seen) + 1)] if seen else []
    if len(yrs) < 3 or 'All countries' not in data['Export']: raise RuntimeError('tabla 12100171 sin los datos esperados (anos %s, socios %d)' % (sorted(seen)[-3:], len(data['Export'])))
    o = {'name': sect.split(' [')[0], 'nm': {'es': 'Productos agrarios, de la pesca y alimentos intermedios', 'en': sect.split(' [')[0], 'fr': 'Produits agricoles, de la pêche et aliments intermédiaires', 'it': 'Prodotti agricoli, della pesca e alimenti intermedi'}}
    for tr_, tag in (('Export', 'exp'), ('Import', 'imp')):
        d = data[tr_]; world = [d['All countries'].get(y, 0.0) for y in yrs]
        rows = [{'c': p, 'n': p, 'v': [round(v.get(y, 0.0), 3) for y in yrs]} for p, v in d.items() if p != 'All countries']
        o[tag] = node(world, None, None, rows, len(yrs))
    write('CA', 'CAD million', {'name': 'Statistics Canada, table 12-10-0171-01', 'url': 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1210017101', 'license': 'Open Government Licence - Canada; cite source'}, {'farm-food': o}, yrs)
def main():
    want = [a.upper() for a in sys.argv[1:]] or ['UK', 'CL', 'CA']
    for cc, fn in (('UK', uk), ('CL', cl), ('CA', ca)):
        if cc not in want: continue
        try: fn()
        except Exception as e: log('ERROR', cc, repr(e)[:300])
    (ROOT / 'data' / 'trade-partners-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
main()

#!/usr/bin/env python3
"""Argentina (datos abiertos del Estado: Secretaria de Agricultura, Ganaderia y Pesca y Subsecretaria de Programacion Macroeconomica, https://datos.gob.ar; licencia Creative Commons Attribution 4.0:
el campo license_id de cada conjunto en la API CKAN del portal es CC-BY-4.0, leido el 6 oct 2026) -> data/argentina-stats.json (countries.AR) y data/argentina-log.txt.
Todos los conjuntos se descubren en tiempo de ejecucion con la API CKAN (package_show) y se descargan como CSV. Conjuntos usados:
  trigo, maiz, soja, cebada, avena, centeno, arroz (...-siembra-cosecha-produccion-rendimiento): series anuales oficiales de superficie, produccion y rendimiento
  lino, poroto, mijo, yerba mate, te (series anuales), faena-pecuaria (SSPM, mensual) e indicadores-de-evolucion-del-sector-agropecuario (algodon, alpiste, cartamo, cebadas)
  estimaciones-agricolas: suma de las estimaciones departamentales de colza, girasol, sorgo y mani (la serie no se publica ya agregada)
  precios-fob-oficiales (USD/t, diarios -> media mensual), indice-novillo-sio-carnes-insc, indicadores-economicos-para-ganaderia-bovina, mercado-liniers-sa-resumen-precios...
  indicadores-mensuales-sector-bovino, faena-aviar, produccion-de-carne-aviar, produccion-nacional-lactea-por-mes-y-por-anio,   exportaciones-fob-por-rubro (INDEC, Intercambio Comercial Argentino, millones de USD)
Sin estimaciones: una serie con menos de 3 puntos o sin dato en los ultimos 3 anos se descarta y se anota en el log; los valores vacios no se rellenan."""
import csv, datetime, io, json, re, sys, time, urllib.request
from collections import defaultdict
CKAN = 'https://datos.gob.ar/api/3/action/package_show?id='
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
LOG = []
OUT = {}
NOW = datetime.date.today()
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def fetch(u, t=300):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(8 * (i + 1))
    raise RuntimeError('%s -> %s' % (u[:120], last))
def dec(b):
    try: return b.decode('utf-8-sig')
    except UnicodeDecodeError: return b.decode('cp1252')
def package(name):
    d = json.loads(fetch(CKAN + name, 90))['result']
    if str(d.get('license_id')).upper() not in ('CC-BY-4.0', 'CREATIVE COMMONS ATTRIBUTION 4.0'): raise RuntimeError('licencia inesperada en %s: %r' % (name, d.get('license_id')))
    return d
def csv_url(pkg, pick):
    """URL del primer recurso CSV cuyo nombre o URL cumple pick(nombre, url)."""
    for r in pkg['resources']:
        if (r.get('format') or '').upper() == 'CSV' and pick(r.get('name') or '', r.get('url') or ''): return r['url']
    raise RuntimeError('sin recurso CSV adecuado en ' + pkg.get('name', '?'))
def table(url, delim=','):
    rd = csv.reader(io.StringIO(dec(fetch(url))), delimiter=delim)
    head = [h.strip() for h in next(rd)]
    return head, [r for r in rd if r]
def num(s):
    s = (s or '').strip().replace(' ', '')
    if s in ('', '-', 'NA', 'NaN'): return None
    try: return float(s)
    except ValueError:
        try: return float(s.replace(',', '.'))
        except ValueError: return None
def mk(id_, group, label, unit, freq, pts, sg, note=None):
    pts = sorted(p for p in pts if p[1] is not None)
    if len(pts) < 3: log('descartada', id_, len(pts), 'puntos'); return
    if int(pts[-1][0][:4]) < NOW.year - 3: log('descartada', id_, 'ultimo', pts[-1][0]); return
    last, prev = pts[-1], pts[-2]
    s = dict(id=id_, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=last[1],
             changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=[[p, v] for p, v in pts], sourceGroup=sg)
    if note: s['note'] = note
    OUT[id_] = s
def monthly_mean(pairs):
    acc = defaultdict(lambda: [0.0, 0])
    for per, v in pairs:
        if v is None: continue
        a = acc[per]; a[0] += v; a[1] += 1
    return [(k, round(s / n, 3)) for k, (s, n) in sorted(acc.items())]
def col(head, rx):
    for i, h in enumerate(head):
        if re.search(rx, h, re.I): return i
    raise KeyError(rx)
# ---------------- cultivos: series anuales oficiales ----------------
CROPS = (('trigo-siembra-cosecha-produccion-rendimiento', 'wheat', 'Wheat'), ('maiz-siembra-cosecha-rendimiento-produccion', 'maize', 'Maize'), ('soja-siembra-cosecha-produccion-rendimiento', 'soy', 'Soybeans'),
         ('cebada-siembra-cosecha-produccion-rendimiento', 'barley', 'Barley'), ('avena-siembra-cosecha-produccion-rendimiento', 'oats', 'Oats'), ('centeno-siembra-cosecha-produccion-rendimiento', 'rye', 'Rye'),
         ('arroz-siembra-cosecha-produccion-rendimiento', 'rice', 'Rice'))
def crops():
    for name, key, en in CROPS:
        try:
            pkg = package(name)
            head, rows = table(csv_url(pkg, lambda n, u: u.endswith('-anual.csv')))
            ip, ih, isw, iy = col(head, r'^produccion_'), col(head, r'^superficie_cosechada'), col(head, r'^superficie_sembrada'), col(head, r'^rendimiento')
            def pts(i): return [(r[0][:4], num(r[i])) for r in rows if len(r) > i and r[0][:4].isdigit()]
            sg = 'SAGyP serie historica ' + key
            mk('ar-sagyp-%s-production' % key, 'crops', '%s: production, Argentina (SAGyP)' % en, 't', 'annual', pts(ip), sg)
            mk('ar-sagyp-%s-area-harvested' % key, 'crops', '%s: harvested area, Argentina (SAGyP)' % en, 'ha', 'annual', pts(ih), sg)
            mk('ar-sagyp-%s-area-sown' % key, 'crops', '%s: sown area, Argentina (SAGyP)' % en, 'ha', 'annual', pts(isw), sg)
            mk('ar-sagyp-%s-yield' % key, 'crops', '%s: yield, Argentina (SAGyP)' % en, 'kg/ha', 'annual', pts(iy), sg)
            log(key, 'ok')
        except Exception as e: log('ERROR', key, repr(e)[:200])
    try:  # estimaciones departamentales -> suma nacional
        pkg = package('estimaciones-agricolas')
        head, rows = table(csv_url(pkg, lambda n, u: 'estimaciones-agricolas' in u))
        ic, ia, ip, ih = col(head, r'^cultivo'), col(head, r'^anio'), col(head, r'^produccion'), col(head, r'^superficie_cosechada')
        want = {'colza': ('rapeseed', 'Rapeseed'), 'girasol': ('sunflower', 'Sunflower seed'), 'sorgo': ('sorghum', 'Sorghum'), 'maní': ('peanut', 'Peanuts (in shell)')}
        prod = defaultdict(lambda: defaultdict(float)); area = defaultdict(lambda: defaultdict(float))
        for r in rows:
            c = r[ic].strip().lower()
            if c in want and r[ia].isdigit():
                v = num(r[ip]); a = num(r[ih])
                if v is not None: prod[c][r[ia]] += v
                if a is not None: area[c][r[ia]] += a
        for c, (key, en) in want.items():
            nt = 'Suma de las estimaciones departamentales de SAGyP (estimaciones-agricolas); el campo es la campana indicada por su ano de inicio.'
            mk('ar-sagyp-%s-production' % key, 'crops', '%s: production, Argentina, sum of departmental estimates (SAGyP)' % en, 't', 'annual', [(y, round(v, 1)) for y, v in prod[c].items()], 'SAGyP estimaciones agricolas', nt)
            mk('ar-sagyp-%s-area-harvested' % key, 'crops', '%s: harvested area, Argentina, sum of departmental estimates (SAGyP)' % en, 'ha', 'annual', [(y, round(v, 1)) for y, v in area[c].items()], 'SAGyP estimaciones agricolas', nt)
        log('estimaciones ok')
    except Exception as e: log('ERROR estimaciones', repr(e)[:200])

# ---------------- precios FOB oficiales ----------------
FOB = (('soy', 'Soybeans', r'^habas_soja_demas_granel'), ('maize', 'Maize', r'^maiz_demas_grano_granel'), ('wheat', 'Wheat', r'^trigo_granel'), ('barley', 'Barley', r'^cebada_cervecera_granel_hasta'),
       ('rice', 'Rice (polished/glazed, up to 10% broken)', r'^arroz_pulido_glasaseado_cont_gra'), ('sorghum', 'Sorghum', r'^sorgo_granifero_demas_granel_hasta'), ('soy-meal', 'Soybean meal', r'^tortas_expellers_pellets_harina_soja_pellets_harina_extr'),
       ('soy-oil', 'Soybean oil (bulk)', r'^aceite_soja_granel'), ('sunflower-oil', 'Sunflower oil (bulk)', r'^aceite_girasol_granel'))
def fob():
    try:
        pkg = package('precios-fob-oficiales'); head, rows = table(csv_url(pkg, lambda n, u: 'valores-diarios' in u))
        for key, en, rx in FOB:
            try: i = col(head, rx)
            except KeyError: log('sin columna FOB', key); continue
            pairs = [(r[0][:7], num(r[i]) if len(r) > i and (num(r[i]) or 0) > 0 else None) for r in rows if r[0][:4].isdigit()]
            mk('ar-fob-%s' % key, 'prices', '%s: official FOB price, Argentina (SSPM/Ministerio de Economia)' % en, 'USD/t', 'monthly', monthly_mean(pairs), 'Precios FOB oficiales',
               'Media simple mensual de los valores diarios publicados (USD por tonelada).')
        log('fob ok')
    except Exception as e: log('ERROR fob', repr(e)[:200])
# ---------------- ganaderia, aves y leche ----------------
def livestock():
    try:  # INSC
        pkg = package('indice-novillo-sio-carnes-insc'); head, rows = table(csv_url(pkg, lambda n, u: 'indice-novillo' in u))
        i, d = col(head, r'INSC'), col(head, r'^fecha')
        mk('ar-insc-steer', 'prices_lv', 'Steer index INSC (SIO Carnes), zones 1-6: weighted price, live weight', 'ARS/kg live weight', 'monthly',
           monthly_mean([(r[d][:7], num(r[i])) for r in rows if len(r) > i and r[d][:4].isdigit()]), 'SIO Carnes INSC', 'Media simple mensual del precio medio ponderado diario de las liquidaciones de novillo (kg vivo), segun la fuente.')
        log('insc ok')
    except Exception as e: log('ERROR insc', repr(e)[:200])
    try:  # indicadores economicos
        pkg = package('indicadores-economicos-para-ganaderia-bovina'); head, rows = table(csv_url(pkg, lambda n, u: 'indicadores-economicos' in u))
        for key, en, rx, unit in (('steer', 'Steer price', r'^novillo\(\$/kg\)', 'ARS/kg'), ('calf', 'Calf (ternero) price', r'^ternero\(\$/kg\)', 'ARS/kg'), ('maize', 'Maize price (feed grain cost)', r'^maiz\(\$/ton\)', 'ARS/t'),
                                  ('cull-cow', 'Canning cow (vaca conserva) price', r'^vaca_conserva', 'ARS/head')):
            i = col(head, rx)
            mk('ar-sagyp-cattle-%s' % key, 'prices_lv' if key != 'maize' else 'prices', '%s, Argentina (SAGyP, bovine economic indicators)' % en, unit, 'monthly', [(r[0][:7], num(r[i])) for r in rows if len(r) > i and r[0][:4].isdigit()], 'SAGyP indicadores economicos bovinos')
        log('indicadores ok')
    except Exception as e: log('ERROR indicadores', repr(e)[:200])
    try:  # Liniers
        pkg = package('mercado-liniers-sa-resumen-precios-cantidad-peso-promedio'); head, rows = table(csv_url(pkg, lambda n, u: 'liniers' in u))
        iy, im = col(head, r'^a.o$'), col(head, r'^mes$')
        def ser(i): return [('%04d-%02d' % (int(r[iy]), int(r[im])), num(r[i])) for r in rows if len(r) > i and r[iy].isdigit()]
        for key, en, rx in (('steer', 'Steers', r'^Precio - Novillos'), ('cow', 'Cows', r'^Precio - Vacas'), ('calf', 'Calves', r'^Precio - Terneros')):
            mk('ar-liniers-%s-price' % key, 'prices_lv', '%s: monthly average price, Mercado de Liniers (live weight)' % en, 'ARS/kg live weight', 'monthly', ser(col(head, rx)), 'Mercado de Liniers')
        mk('ar-liniers-heads', 'livestock', 'Cattle: total head marketed, Mercado de Liniers', 'head', 'monthly', ser(col(head, r'^Cabezas Totales')), 'Mercado de Liniers')
        log('liniers ok')
    except Exception as e: log('ERROR liniers', repr(e)[:200])
    try:  # indicadores bovinos
        pkg = package('indicadores-mensuales-sector-bovino'); head, rows = table(csv_url(pkg, lambda n, u: 'indicadores-ganaderos-mensuales' in u))
        iy, im = col(head, r'^a.o$'), col(head, r'^mes$')
        def ser(i): return [('%04d-%02d' % (int(r[iy]), int(r[im])), num(r[i])) for r in rows if len(r) > i and r[iy].isdigit()]
        mk('ar-sagyp-cattle-slaughter', 'livestock', 'Cattle: slaughter, total head, Argentina (SAGyP)', 'head', 'monthly', ser(col(head, r'^Faena: Total en cabezas')), 'SAGyP indicadores bovinos')
        mk('ar-sagyp-beef-production', 'livestock', 'Beef: production, carcass weight, Argentina (SAGyP)', 'kt', 'monthly', ser(col(head, r'^Producci.n: En miles de toneladas')), 'SAGyP indicadores bovinos')
        mk('ar-sagyp-beef-consumption', 'livestock', 'Beef: apparent domestic consumption, carcass weight, Argentina (SAGyP)', 'kt', 'monthly', ser(col(head, r'^Consumo Interno: Aparente')), 'SAGyP indicadores bovinos')
        mk('ar-sagyp-beef-exports', 'trade', 'Beef: exports, carcass-weight equivalent, Argentina (SAGyP)', 't', 'monthly', ser(col(head, r'^Exportaciones: En toneladas')), 'SAGyP indicadores bovinos')
        log('bovinos ok')
    except Exception as e: log('ERROR bovinos', repr(e)[:200])
    for name, key, label, unit, rx, pick in (('faena-aviar', 'poultry-slaughter', 'Poultry: slaughter, Argentina (SENASA via SAGyP)', 'thousand head', r'faena', 'faena_aviar'),
                                             ('produccion-de-carne-aviar', 'poultry-meat', 'Poultry meat: production, Argentina (SAGyP)', 'kt', r'produccion', 'produccion_carne_aviar'),
                                             ('produccion-nacional-lactea-por-mes-y-por-anio', 'milk', 'Milk: production, Argentina (SAGyP)', 'million litres', r'produccion', 'produccion_leche_mes')):
        try:
            pkg = package(name); head, rows = table(csv_url(pkg, lambda n, u: pick in u)); i = col(head, rx)
            mk('ar-sagyp-%s' % key, 'livestock' if key != 'milk' else 'milk', label, unit, 'monthly', [(r[0][:7], num(r[i])) for r in rows if len(r) > i and r[0][:4].isdigit()], 'SAGyP ' + key)
            log(key, 'ok')
        except Exception as e: log('ERROR', key, repr(e)[:200])
# ---------------- comercio exterior por rubro ----------------
RUBROS = (('cereals', 'Cereals', r'^ica_exportaciones_cereales'), ('oilseeds', 'Oilseeds', r'^ica_exportaciones_semillas_frutos_oleaginosos'), ('fresh-fruit', 'Fresh fruit', r'^ica_exportaciones_frutas_frescas'),
          ('fresh-vegetables', 'Fresh vegetables and pulses', r'^ica_exportaciones_hortalizas'), ('meat', 'Meat', r'^ica_carnes'), ('dairy-eggs', 'Dairy products and eggs', r'^ica_productos_lacteos_huevos'),
          ('milling', 'Milling products', r'^ica_productos_molineria'), ('fats-oils', 'Fats and oils', r'^ica_grasas_aceites'), ('sugar', 'Sugar and confectionery', r'^ica_azucar'),
          ('beverages', 'Beverages, alcoholic liquids and vinegar', r'^ica_bebidas'))
def trade():
    try:
        pkg = package('exportaciones-fob-por-rubro'); head, rows = table(csv_url(pkg, lambda n, u: 'exportaciones-mensual' in u))
        for key, en, rx in RUBROS:
            i = col(head, rx)
            mk('ar-indec-exports-%s' % key, 'trade', '%s: Argentina exports, FOB value (INDEC, Intercambio Comercial Argentino)' % en, 'USD million', 'monthly', [(r[0][:7], round(num(r[i]), 3) if num(r[i]) is not None else None) for r in rows if len(r) > i and r[0][:4].isdigit()],
               'INDEC ICA exportaciones por rubro')
        log('comercio ok')
    except Exception as e: log('ERROR comercio', repr(e)[:200])
# ---------------- ampliacion: cultivos menores, faena por especie y campanas (8 oct) ----------------
MINOR = (('lino-siembra-cosecha-produccion-rendimiento', 'flax', 'Flax (linseed)', 'lino-serie'), ('poroto-siembra-cosecha-produccion-rendimiento', 'bean', 'Dry beans', 'poroto-'), ('mijo-siembra-cosecha-produccion-rendimiento', 'millet', 'Millet', 'mijo-serie'),
         ('yerba-mate-siembra-cosecha-produccion-rendimiento', 'mate', 'Yerba mate', 'yerba-mate-'), ('te-siembra-cosecha-produccion-rendimiento', 'tea', 'Tea', 'te-1970'))
def minor_crops():
    for name, key, en, pick in MINOR:
        try:
            pkg = package(name)
            head, rows = table(csv_url(pkg, lambda n, u: pick in u.split('/')[-1] and u.endswith('-anual.csv')))
            ip, ih, isw, iy = col(head, r'^produccion_'), col(head, r'^superficie_cosechada'), col(head, r'^superficie_sembrada'), col(head, r'^rendimiento')
            def pts(i): return [(r[0][:4], num(r[i])) for r in rows if len(r) > i and r[0][:4].isdigit()]
            sg = 'SAGyP serie historica ' + key
            mk('ar-sagyp-%s-production' % key, 'crops', '%s: production, Argentina (SAGyP)' % en, 't', 'annual', pts(ip), sg)
            mk('ar-sagyp-%s-area-harvested' % key, 'crops', '%s: harvested area, Argentina (SAGyP)' % en, 'ha', 'annual', pts(ih), sg)
            mk('ar-sagyp-%s-area-sown' % key, 'crops', '%s: sown area, Argentina (SAGyP)' % en, 'ha', 'annual', pts(isw), sg)
            mk('ar-sagyp-%s-yield' % key, 'crops', '%s: yield, Argentina (SAGyP)' % en, 'kg/ha', 'annual', pts(iy), sg)
            log(key, 'ok')
        except Exception as e: log('ERROR', key, repr(e)[:200])
SLAUGHTER = (('vacunos_cabezas', 'cattle-head', 'Cattle: slaughter, head', 'head'), ('vacunos_toneladas', 'cattle-t', 'Cattle: slaughter, carcass weight', 't'), ('ovinos_cabezas', 'sheep-head', 'Sheep: slaughter, head', 'head'),
             ('porcinos_cabezas', 'pigs-head', 'Pigs: slaughter, head', 'head'), ('porcinos_toneladas', 'pigs-t', 'Pigs: slaughter, carcass weight', 't'), ('aves_cabezas', 'poultry-head', 'Poultry: slaughter, head', 'thousand head'), ('aves_toneladas', 'poultry-t', 'Poultry: slaughter, carcass weight', 't'))
def slaughter():
    try:
        pkg = package('faena-pecuaria'); head, rows = table(csv_url(pkg, lambda n, u: 'valores-mensuales' in u))
        for rx, key, en, unit in SLAUGHTER:
            i = col(head, '^' + rx + '$')
            mk('ar-sspm-slaughter-%s' % key, 'livestock', '%s, Argentina (SSPM, Faena pecuaria)' % en, unit, 'monthly', [(r[0][:7], num(r[i])) for r in rows if len(r) > i and r[0][:4].isdigit()], 'SSPM faena pecuaria mensual',
               'Serie mensual de la Subsecretaria de Programacion Macroeconomica; las aves en cabezas segun la unidad publicada por la fuente.')
        log('faena ok')
    except Exception as e: log('ERROR faena', repr(e)[:200])
CAMP = (('algodon', 'cotton', 'Cotton'), ('alpiste', 'canary-seed', 'Canary seed'), ('cartamo', 'safflower', 'Safflower'), ('cebada_cervecera', 'barley-malting', 'Malting barley'), ('cebada_forrajera', 'barley-feed', 'Feed barley'))
def campaigns():
    try:
        pkg = package('indicadores-de-evolucion-del-sector-agropecuario')
        ha_head, ha = table(csv_url(pkg, lambda n, u: '34.1' in u)); t_head, tt = table(csv_url(pkg, lambda n, u: '34.2' in u))
        for rx, key, en in CAMP:
            nt = 'Valores por campana de la SSPM (indice_tiempo = ano de inicio de la campana segun la fuente).'
            try: i = col(ha_head, '^' + rx + r's?_hectareas$'); mk('ar-sspm-%s-area' % key, 'crops', '%s: area, Argentina by crop year (SSPM)' % en, 'ha', 'annual', [(r[0][:4], num(r[i])) for r in ha if len(r) > i and r[0][:4].isdigit()], 'SSPM evolucion del sector agropecuario', nt)
            except KeyError: log('sin superficie', key)
            try: i = col(t_head, '^' + rx + r's?_tonelad'); mk('ar-sspm-%s-production' % key, 'crops', '%s: production, Argentina by crop year (SSPM)' % en, 't', 'annual', [(r[0][:4], num(r[i])) for r in tt if len(r) > i and r[0][:4].isdigit()], 'SSPM evolucion del sector agropecuario', nt)
            except KeyError: log('sin produccion', key)
        log('campanas ok')
    except Exception as e: log('ERROR campanas', repr(e)[:200])
def main():
    for fn in (crops, fob, livestock, trade, minor_crops, slaughter, campaigns):
        try: fn()
        except Exception as e: log('ERROR', fn.__name__, repr(e)[:200])
    log('series', len(OUT))
    if len(OUT) < 40:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/argentina-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'Argentina, datos abiertos (Secretaria de Agricultura, Ganaderia y Pesca; Subsecretaria de Programacion Macroeconomica; INDEC)', 'url': 'https://datos.gob.ar/', 'license': 'Creative Commons Attribution 4.0 (CC BY 4.0)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'AR': {'name': 'Argentina', 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}}, 'log': LOG[-30:]}
    json.dump(doc, open('data/argentina-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/argentina-log.txt', 'w').write('\n'.join(LOG) + '\n')
main()

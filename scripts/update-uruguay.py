#!/usr/bin/env python3
"""Uruguay (datos abiertos del Estado: INIA, MGAP y URSEA en https://catalogodatos.gub.uy) -> data/uruguay-stats.json (countries.UY) y data/uruguay-log.txt.

Licencia: cada conjunto declara license_id 'odc-uy' (Licencia de Datos Abiertos - Uruguay; NO es ODbL) en la API CKAN. El script lo comprueba en cada ejecucion y
se detiene si un conjunto cambia de licencia. La licencia exige citar proveedor, licencia y conjunto, y declarar las modificaciones (aqui: medias/sumas mensuales y
sumas anuales calculadas por Dehesa Index, rotuladas como derivadas).

Conjuntos usados:
  inia-precipitacion-temps-extremas-{le,lb,sg,tyt,tb}  INIA, 5 estaciones (La Estanzuela, Las Brujas, Salto Grande, Treinta y Tres, Tacuarembo): un CSV diario por anio
        (fecha, temperaturaMaxima, temperaturaMinima, pluviometro; dia de 09h a 09h). Se publican medias mensuales de maxima y minima y lluvia total mensual, SOLO de
        meses con al menos el 90 % de los dias. Es clima de cinco estaciones, no un promedio nacional. Desde YEAR0.
  ursea-ppi_vs_pe_v2  URSEA, paridad de importacion (PPI) del gasoil 50S, ex planta y con impuestos. Es un precio MODELADO (paridad), no un precio observado en surtidor;
        la ventana de evaluacion va del dia 26 al 25, y el periodo es el mes en que termina. La fila con Inicio posterior a Fin se descarta y se anota (no se corrige la fecha).
  mgap-serie-precio-de-la-tierra-arrendamientos  MGAP, arrendamientos por semestre, anio y departamento (XLSX; mismo tratamiento que compraventas). 'Valor anual' = monto anual de los
        contratos; la suma nacional de 2020 coincide con el comunicado anual 2020 del MGAP (97,5 millones USD, 904.888 ha, 2.323 contratos, 108 USD/ha/anio). Solo anios con semestres 1 y 2 (2008 en adelante).
  mgap-serie-precio-de-la-tierra-compraventas  MGAP, compraventas de tierra por semestre, anio y departamento (XLSX; el CSV tiene la coma decimal sin comillas y desplaza columnas).
        Se publica por anio, con los departamentos que declaran los dos semestres: USD por hectarea = suma de montos / suma de hectareas (ponderado, no media de precios), hectareas
        y numero de operaciones. Operaciones registradas, no precios de oferta. Semestre 999 y anios incompletos no se asignan.
  mgap-datos-*-declaracion-jurada-de-existencias-dicose-snig-{2016..2025}  MGAP, DICOSE/SNIG, existencias por especie (datosanimales.csv, un conjunto por ejercicio). Se publica la
        suma nacional de AnimalesPorEspeciePD_AD (animales propios dentro + ajenos dentro, el criterio tradicional de DICOSE; existencia fisica en los establecimientos) de bovinos (1),
        ovinos (2) y bovinos de leche (11), y los nacimientos declarados de bovinos. NO se suma PD_PF (propios dentro + propios fuera) y NO se suman los codigos 1 y 11 en un total:
        la fuente no garantiza que no se solapen. Suinos, caprinos, yeguarizos y aves no se publican: el MGAP advierte que no pasaron controles de calidad. El ejercicio
        es el ejercicio ganadero de la declaracion jurada; no se supone una fecha exacta de referencia.
  inia-pad-por-grilla / inia-ibh-por-grilla / inia-anr-por-grilla  INIA GRAS, balance hidrico modelado sobre una grilla de ~30x30 km (179 celdas), un CSV por anio con promedios decadiales
        (sufijos 1-3) y mensuales (sufijo 0) de PAD (% de agua disponible en el suelo), IBH (indice de bienestar hidrico, %) y ANR (agua no retenida, mm acumulados). Se publica SOLO
        la columna mensual y la media simple de las celdas de la grilla de ese mes (los meses sin las 179 celdas no entran). Es un modelo, no una medicion, y la media de celdas
        NO es el % de superficie nacional afectada ni un indice oficial de sequia. El recurso 'inia_gras_pad2022.csv' del conjunto ANR lleva nombre de PAD: si su matriz es identica a la
        del PAD de ese anio se descarta y se anota.
Sin estimaciones: lo que falta no se rellena; una serie con menos de 3 puntos o sin dato en los ultimos 3 anios se descarta y se anota en el log.

Modo local de prueba: python3 scripts/update-uruguay.py --local DIR [--out DIR_SALIDA]  (DIR con los originales del paquete de investigacion: raw/*.csv, raw/*.xlsx, raw/ckan-*.json)."""
import csv, datetime, io, json, re, sys, time, urllib.parse, urllib.request, calendar
from collections import defaultdict
from pathlib import Path

CKAN = 'https://catalogodatos.gub.uy/api/3/action/package_show?id='
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
YEAR0 = 2000
STATIONS = {'le': 'La Estanzuela', 'lb': 'Las Brujas', 'sg': 'Salto Grande', 'tyt': 'Treinta y Tres', 'tb': 'Tacuarembó'}
LOG = []
OUT = {}
DEPT = {'livestock': {}, 'land': {}}   # datos por departamento (se escriben en data/uruguay-departments.json)
# Departamentos: codigo numerico alfabetico (INE/AGESIC; el mismo que usa DICOSE) y sufijo ISO 3166-2 (el id del mapa vendor/uy-departments.js). Son cosas distintas: no mezclar.
UY_DEPTS = [(1, 'Artigas', 'AR'), (2, 'Canelones', 'CA'), (3, 'Cerro Largo', 'CL'), (4, 'Colonia', 'CO'), (5, 'Durazno', 'DU'), (6, 'Flores', 'FS'), (7, 'Florida', 'FD'), (8, 'Lavalleja', 'LA'),
            (9, 'Maldonado', 'MA'), (10, 'Montevideo', 'MO'), (11, 'Paysandú', 'PA'), (12, 'Río Negro', 'RN'), (13, 'Rivera', 'RV'), (14, 'Rocha', 'RO'), (15, 'Salto', 'SA'), (16, 'San José', 'SJ'),
            (17, 'Soriano', 'SO'), (18, 'Tacuarembó', 'TA'), (19, 'Treinta y Tres', 'TT')]
ISO_OF = {c: i for c, _, i in UY_DEPTS}
NOW = datetime.date.today()
LOCAL = None
ROOT = Path(__file__).resolve().parent.parent


def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)


def fetch(u, t=120):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError('%s -> %s' % (u[:140], last))


def package(name):
    """Paquete CKAN (licencia comprobada). En modo local sale de los ckan-*.json del paquete de investigacion."""
    if LOCAL:
        for f in sorted(Path(LOCAL).glob('ckan-*.json')):
            for p in json.loads(f.read_text(encoding='utf-8'))['result']['results']:
                if p['name'] == name: d = p; break
            else: continue
            break
        else: raise RuntimeError('paquete no encontrado en local: ' + name)
    else:
        d = json.loads(fetch(CKAN + name, 60))['result']
    if str(d.get('license_id')).lower() != 'odc-uy':
        raise RuntimeError('licencia inesperada en %s: %r (se esperaba odc-uy)' % (name, d.get('license_id')))
    return d


def resource_bytes(res):
    if LOCAL:
        hits = sorted(Path(LOCAL).glob('*--%s.*' % res['id']))
        if not hits: return None
        return hits[0].read_bytes()
    return fetch(res['url'], 180)


def num(s):
    s = (str(s) if s is not None else '').strip()
    if s in ('', '-', 'NA', 'NaN', 'nan'): return None
    try: return float(s)
    except ValueError:
        try: return float(s.replace(',', '.'))
        except ValueError: return None


def mk(id_, group, label, unit, freq, pts, sg, note=None, minpts=3, maxage=3):
    pts = sorted((p, v) for p, v in pts if v is not None)
    if len(pts) < minpts: log('descartada', id_, len(pts), 'puntos'); return
    if int(pts[-1][0][:4]) < NOW.year - maxage: log('descartada', id_, 'ultimo', pts[-1][0]); return
    last, prev = pts[-1], pts[-2]
    s = dict(id=id_, group=group, label=label, unit=unit, frequency=freq, latestPeriod=last[0], latest=round(last[1], 3),
             changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=[[p, round(v, 3)] for p, v in pts], sourceGroup=sg)
    if note: s['note'] = note
    OUT[id_] = s


# ------------------------------------------------------------------ INIA: estaciones
def inia():
    for code, name in STATIONS.items():
        try:
            pkg = package('inia-precipitacion-temps-extremas-' + code)
        except Exception as e:
            log('INIA %s: %s' % (code, e)); continue
        days = {}
        for r in pkg['resources']:
            m = re.search(r'ppt_tmax_tmin_%s_(\d{4})\.csv' % re.escape(code), r.get('url') or '')
            if not m or int(m.group(1)) < YEAR0: continue
            try: b = resource_bytes(r)
            except Exception as e: log('INIA %s %s: fallo %s' % (code, m.group(1), e)); continue
            if b is None: continue
            head = b[:400]
            if head.lstrip().startswith(b'<') or b'fecha' not in head.lower():   # HTTP 200 con HTML (o cabecera inesperada) no es un dato
                log('INIA %s %s: contenido no es el CSV esperado, se omite' % (code, m.group(1))); continue
            for row in csv.DictReader(io.StringIO(b.decode('utf-8-sig'))):
                f = (row.get('fecha') or '').strip()
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', f): continue
                days[f] = (num(row.get('temperaturaMaxima')), num(row.get('temperaturaMinima')), num(row.get('pluviometro')))
        if not days: log('INIA', code, 'sin dias'); continue
        by = defaultdict(list)
        for f, v in days.items(): by[f[:7]].append(v)
        res = {0: [], 1: [], 2: []}
        for ym, vs in sorted(by.items()):
            y, m = int(ym[:4]), int(ym[5:])
            nd = calendar.monthrange(y, m)[1]
            for k in (0, 1, 2):
                xs = [v[k] for v in vs if v[k] is not None]
                if len(xs) < 0.9 * nd: continue   # mes incompleto: no se publica (ni se rellena)
                res[k].append((ym, sum(xs) / len(xs) if k < 2 else sum(xs)))
        nt = 'Estación INIA %s; registro diario de 09h a 09h. Cálculo de Dehesa Index a partir de los datos diarios; solo meses con al menos el 90 %% de los días. Estación puntual, no promedio nacional.' % name
        for k, (sfx, lab, unit) in enumerate([('tmax', 'mean daily maximum temperature', '°C'), ('tmin', 'mean daily minimum temperature', '°C'), ('rain', 'total rainfall', 'mm')]):
            mk('uy-inia-%s-%s' % (code, sfx), 'climate', 'Uruguay, %s station: monthly %s (INIA, derived from daily records)' % (name, lab), unit, 'monthly', res[k], 'INIA (Uruguay)', nt, minpts=12, maxage=1)


# ------------------------------------------------------------------ URSEA: PPI gasoil
def ursea():
    try: pkg = package('ursea-ppi_vs_pe_v2')
    except Exception as e: log('URSEA:', e); return
    res = [r for r in pkg['resources'] if (r.get('url') or '').endswith('ppi_da_nuevo.csv')]
    if not res: log('URSEA: sin recurso ppi_da_nuevo.csv'); return
    b = resource_bytes(res[0])
    if b is None or b.lstrip().startswith(b'<'): log('URSEA: contenido no es CSV'); return
    rows = list(csv.DictReader(io.StringIO(b.decode('utf-8-sig'))))
    good = []
    for i, r in enumerate(rows, 2):
        ini, fin = (r.get('Inicio') or '').strip(), (r.get('Fin') or '').strip()
        if not (re.fullmatch(r'\d{4}-\d{2}-\d{2}', ini) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', fin)): log('URSEA fila', i, 'fechas no validas', ini, fin); continue
        if ini > fin: log('URSEA fila', i, 'descartada: Inicio %s posterior a Fin %s (no se corrige la fecha)' % (ini, fin)); continue
        good.append(r)
    nt = 'Paridad de importación (PPI) modelada por URSEA, no un precio observado en surtidor ni el de Brent o diésel de otros países. Ventana de evaluación del día 26 al 25; el periodo es el mes en que termina.'
    for field, lab in (('Gasoil50S_ExP', 'ex-plant, excluding taxes'), ('Gasoil50S_ExP_imp', 'ex-plant, including taxes')):
        mk('uy-ursea-gasoil50s-' + ('ex' if field.endswith('ExP') else 'imp'), 'inputs', 'Uruguay, 50S gas oil import-parity price (PPI), %s (URSEA)' % lab, 'UYU/litre', 'monthly',
           [(r['Fin'][:7], num(r.get(field))) for r in good], 'URSEA (Uruguay)', nt)


# ------------------------------------------------------------------ MGAP: tierra
LAND = {
    'sale': dict(pkg='mgap-serie-precio-de-la-tierra-compraventas', file='compraventas-por-semestre-ao-y-departamento.xlsx', head=['idDepto', 'ano', 'Sem', 'montous_sum', 'suptran_sum', 'cuenta_sum'],
                 en='land sales', what='compraventas de tierra registradas (operaciones, no precios de oferta)', unit='USD/ha', cnt='operations',
                 extra=''),
    'rent': dict(pkg='mgap-serie-precio-de-la-tierra-arrendamientos', file='arrendamientos-por-departamento.xlsx', head=['DEPCOD', 'ano', 'Sem', 'montot_sum', 'suptran_sum', 'cuenta_sum'],
                 en='land rents', what='arrendamientos de tierra registrados (contratos, no precios de oferta)', unit='USD/ha/year', cnt='contracts',
                 extra=' El monto es el valor anual de los contratos: la suma nacional de 2020 de esta tabla (USD 97,5 millones, 904.888 ha, 2.323 contratos, 108 USD/ha/año) coincide con el comunicado anual 2020 del MGAP.'),
}


def land(kind):
    L = LAND[kind]
    try: pkg = package(L['pkg'])
    except Exception as e: log('MGAP tierra %s:' % kind, e); return
    res = [r for r in pkg['resources'] if (r.get('url') or '').endswith(L['file'])]
    if not res: log('MGAP tierra %s: sin XLSX %s' % (kind, L['file'])); return
    b = resource_bytes(res[0])
    if b is None: return
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
    except Exception as e: log('MGAP tierra %s: XLSX ilegible' % kind, e); return
    ws = wb['Datos'] if 'Datos' in wb.sheetnames else wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    head = [str(c).strip() if c is not None else '' for c in next(it)][:6]
    if head != L['head']:
        log('MGAP tierra %s: cabecera inesperada' % kind, head); return
    cell = defaultdict(dict)   # (anio, depto) -> semestre -> (USD, ha, n)
    has999 = set()
    for r in it:
        if not r or not isinstance(r[0], (int, float)) or not isinstance(r[1], (int, float)): continue
        sem = str(int(r[2])) if isinstance(r[2], (int, float)) else str(r[2])
        if sem == '999': has999.add((int(r[1]), int(r[0]))); continue   # semestre no asignado: no se reparte entre semestres
        if sem not in ('1', '2'): continue
        usd, ha, n = num(r[3]), num(r[4]), num(r[5])
        if usd is None or ha is None or n is None: continue
        cell[(int(r[1]), int(r[0]))][sem] = (usd, ha, n)
    yr = defaultdict(lambda: [0.0, 0.0, 0.0, 0])
    dy = defaultdict(dict)   # anio -> iso -> [USD, ha, n]
    for (y, d), s in cell.items():
        if '1' in s and '2' in s and (y, d) not in has999:   # solo departamentos con los dos semestres y sin filas 999 ese anio
            for k in ('1', '2'):
                yr[y][0] += s[k][0]; yr[y][1] += s[k][1]; yr[y][2] += s[k][2]
            yr[y][3] += 1
            if d in ISO_OF and sum(s[k][1] for k in ('1', '2')) > 0: dy[y][ISO_OF[d]] = [sum(s[k][0] for k in ('1', '2')), sum(s[k][1] for k in ('1', '2')), sum(s[k][2] for k in ('1', '2'))]
    ys = sorted(y for y in yr if yr[y][1] > 0)
    # un anio con bastantes menos departamentos que el resto esta incompleto (p. ej. el ultimo): no se publica
    mx = max((yr[y][3] for y in ys), default=0)
    short = [y for y in ys if yr[y][3] < mx - 2]
    if short: log('MGAP tierra %s: anios con pocos departamentos, descartados: %s' % (kind, short)); ys = [y for y in ys if y not in short]
    DEPT['land'][kind] = {str(y): {i: {'usdHa': round(v[0] / v[1], 2), 'ha': round(v[1], 1), 'n': int(v[2])} for i, v in sorted(dy[y].items())} for y in ys if y >= max(ys) - 9}
    nt = ('MGAP (DIEA), %s; registro de la DGR, operaciones de 10 o mas hectareas. Suma de los departamentos que declaran los dos semestres del anio; %s = suma de montos / suma de hectareas '
          '(ponderado, calculo de Dehesa Index). Los anios y departamentos con semestre incompleto o con filas de semestre 999 no se incluyen.' % (L['what'], L['unit'])) + L['extra']
    p = 'uy-mgap-land-%s' % kind
    mk(p + '-usd-ha', 'prices', 'Uruguay: %s, average price per hectare (MGAP, derived, weighted)' % L['en'], L['unit'], 'annual', [(str(y), yr[y][0] / yr[y][1]) for y in ys], 'MGAP (Uruguay)', nt)
    mk(p + '-area', 'prices', 'Uruguay: %s, area in registered operations (MGAP)' % L['en'], 'ha', 'annual', [(str(y), yr[y][1]) for y in ys], 'MGAP (Uruguay)', nt)
    mk(p + '-count', 'prices', 'Uruguay: %s, number of registered %s (MGAP)' % (L['en'], L['cnt']), L['cnt'], 'annual', [(str(y), yr[y][2]) for y in ys], 'MGAP (Uruguay)', nt)


# ------------------------------------------------------------------ INIA: balance hidrico en grilla
GRIDS = [('pad', 'inia-pad-por-grilla', 'Soil available water (PAD)', '%', 'percent of available water in the soil, modelled'),
         ('ibh', 'inia-ibh-por-grilla', 'Water well-being index (IBH)', '%', 'actual / potential evapotranspiration, modelled'),
         ('anr', 'inia-anr-por-grilla', 'Water not retained by the soil (ANR)', 'mm', 'surface runoff plus soil water excess, monthly accumulation, modelled')]


def read_grid(r):
    b = resource_bytes(r)
    if b is None: return None
    if b.lstrip().startswith(b'<'): log('Grilla %s: contenido no es CSV' % (r.get('url') or '')[-24:]); return None
    rd = csv.DictReader(io.StringIO(b.decode('utf-8-sig')))
    fn = rd.fieldnames or []
    if fn[:2] == ['Longitud', 'Latitud']: rd.fieldnames = ['id'] + fn   # formato 2000-2020: sin columna id; las celdas se identifican por su orden
    if not rd.fieldnames or rd.fieldnames[:3] != ['id', 'Longitud', 'Latitud']: log('Grilla %s: cabecera inesperada (primeras columnas: %s)' % ((r.get('url') or '')[-24:], (rd.fieldnames or [])[:5])); return None
    rows = list(rd)
    return rd.fieldnames, rows


def inia_grids():
    mats = {}   # (indicador, periodo) -> lista de valores por celda
    for key, name, label, unit, what in GRIDS:
        try: pkg = package(name)
        except Exception as e: log('Grilla %s: %s' % (key, e)); continue
        series = {}
        for r in pkg['resources']:
            u = r.get('url') or ''
            m = re.search(r'inia_gras_[a-z]+(\d{4})\.csv$', u)
            if not m or int(m.group(1)) < YEAR0: continue
            try: g = read_grid(r)
            except Exception as e: log('Grilla %s %s: fallo %s' % (key, m.group(1), e)); continue
            if not g: continue
            cols, rows = g
            if m.group(1) in ('2000', '2010', '2020') and not any(re.fullmatch(r'\d{4}_\d{2}0', c) for c in cols[3:]): log('Grilla %s %s: sin columnas mensuales (sufijo 0); columnas %s' % (key, m.group(1), cols[3:9]))
            if len(rows) < 150: log('Grilla %s %s: solo %d celdas, se omite' % (key, m.group(1), len(rows))); continue
            for c in cols[3:]:
                mm = re.fullmatch(r'(\d{4})_(\d{2})0', c)   # sufijo 0 = promedio/acumulado MENSUAL; 1-3 son decadas
                if not mm or mm.group(1) != m.group(1): continue
                vals = [num(x[c]) for x in rows]
                if any(v is None for v in vals): log('Grilla %s %s: celdas sin dato, mes omitido' % (key, c)); continue   # un dato ausente no es 0
                mats[(key, '%s-%s' % (mm.group(1), mm.group(2)))] = vals
                series['%s-%s' % (mm.group(1), mm.group(2))] = sum(vals) / len(vals)
        nt = ('INIA GRAS, balance hidrico modelado (%s). Media simple de las celdas de una grilla de unos 30x30 km en el mes (sufijo 0 del CSV); modelo, no medicion; no es el %% de superficie nacional '
              'afectada ni un indice oficial de sequia. Calculo de Dehesa Index. Solo meses completos.' % what)
        mk('uy-inia-grid-%s-mean' % key, 'climate', 'Uruguay: %s, mean of INIA grid cells, monthly (INIA GRAS, derived)' % label, unit, 'monthly', list(series.items()), 'INIA (Uruguay)', nt, minpts=12, maxage=1)
    # el recurso ANR con nombre de PAD no puede ser una copia del PAD
    for (k, p), v in list(mats.items()):
        if k == 'anr' and ('pad', p) in mats and mats[('pad', p)] == v:
            log('Grilla anr %s: matriz identica a PAD, recurso mal rotulado: serie ANR no publicada' % p); OUT.pop('uy-inia-grid-anr-mean', None); break


# ------------------------------------------------------------------ MGAP: DICOSE existencias
DICOSE_PKGS = ['mgap-datos-generados-en-base-a-la-declaracion-jurada-de-existencias-dicose-snig-2016', 'mgap-datos-actualizados-de-la-declaracion-jurada-de-existencias-dicose-snig-2017',
               'mgap-datos-2018-generados-en-base-a-la-declaracion-jurada-de-existencias-dicose-snig', 'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2019',
               'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2020', 'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2021',
               'datos-preliminares-declaracion-jurada-de-existencias-dicose-snig-2022', 'mgap-datos-actualizados-de-la-declaracion-jurada-de-existencias-dicose-snig-2023',
               'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2024', 'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2025']
SPECIES = {'1': 'cattle', '2': 'sheep', '11': 'dairy-cattle'}


def xml_rows(b):
    """Filas de un XML de DICOSE: cada elemento cuyos hijos son todos hojas es una fila {etiqueta sin espacio de nombres: texto}."""
    import xml.etree.ElementTree as ET
    for _, el in ET.iterparse(io.BytesIO(b)):
        if len(el) and all(len(c) == 0 for c in el):
            row = {c.tag.split('}')[-1].replace('ns1:', ''): (c.text or '') for c in el}
            el.clear()
            if any(v.strip() for v in row.values()): yield row


def dicose():
    tot = defaultdict(lambda: defaultdict(float))   # (especie) -> ejercicio -> PD_AD
    births = defaultdict(float)
    dep = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))   # especie -> anio -> iso -> PD_AD
    for name in DICOSE_PKGS:
        try: pkg = package(name)
        except Exception as e: log('DICOSE %s: %s' % (name[-12:], e)); continue
        got = False; diag = []
        # primero el datosanimales.csv de siempre; si en un anio ese fichero es un diccionario de datos, se prueban los demas CSV del paquete (menos los claramente ajenos)
        # en 2016-2020 los CSV son solo los metadatos y los datos estan en el XML de «Datos Animales»
        cands = sorted([r for r in pkg['resources'] if (r.get('url') or '').lower().endswith(('.csv', 'datosanimales.xml')) and not re.search(r'detallad|tenencia|usostierra|generales|mejoramientos', r.get('url') or '', re.I)],
                       key=lambda r: 0 if (r.get('url') or '').endswith('datosanimales.csv') else 2 if (r.get('url') or '').lower().endswith('.xml') else 1)
        for r in cands:
            try: b = resource_bytes(r)
            except Exception as e: log('DICOSE %s: fallo %s' % (name[-12:], e)); continue
            if b is None: continue
            isx = (r.get('url') or '').lower().endswith('.xml')
            if isx:
                rows = list(xml_rows(b)); rd = rows
                cols = {k: k for k in (rows[0] if rows else {})}
            else:
                if b.lstrip().startswith(b'<'): log('DICOSE %s: contenido no es CSV' % name[-12:]); continue
                rd = csv.DictReader(io.StringIO(b.decode('latin-1')), delimiter=';')
                cols = {(c or '').replace('ns1:', ''): c for c in (rd.fieldnames or [])}
            need = ('Ejercicio', 'EspecieCodigo', 'DepartamentoCodigo', 'AnimalesPorEspeciePD_AD', 'AnimalesPorEspecieNacimientosPD_AD')
            if any(n not in cols for n in need):   # otro recurso (p. ej. el detallado por categoria) o formato distinto
                if len(diag) < 3: diag.append('%s: faltan %s; columnas %s' % ((r.get('url') or '')[-28:], [n for n in need if n not in cols], list(cols)[:6]))
                continue
            sub = defaultdict(float); sb = 0.0; ej = set(); nrow = 0; sdep = defaultdict(lambda: defaultdict(float))
            for x in rd:
                e, sp = (x[cols['Ejercicio']] or '').strip(), (x[cols['EspecieCodigo']] or '').strip()
                v = num(x[cols['AnimalesPorEspeciePD_AD']])
                if not re.fullmatch(r'\d{4}', e) or v is None: continue
                ej.add(e); nrow += 1
                if sp in SPECIES:
                    sub[sp] += v
                    try: sdep[sp][ISO_OF[int(x[cols['DepartamentoCodigo']])]] += v
                    except (KeyError, ValueError): pass
                if sp == '1': sb += num(x[cols['AnimalesPorEspecieNacimientosPD_AD']]) or 0
            if len(ej) != 1 or nrow < 1000: log('DICOSE %s: ejercicios %s, filas %d: se omite' % (name[-12:], sorted(ej), nrow)); continue
            y = ej.pop()
            for sp, v in sub.items(): tot[sp][y] = v
            for sp, dd in sdep.items(): dep[sp][y] = dict(dd)
            births[y] = sb; got = True
            break
        if not got:
            diag = diag[:2] + ['recursos: %s' % [((r.get('name') or '')[:40], (r.get('format') or ''), (r.get('url') or '')[-30:]) for r in pkg['resources']][:16]]
        if False: diag.append('recursos: %s' % [(r.get('url') or '')[-34:] for r in pkg['resources']][:8])
        if not got: log('DICOSE %s: sin datosanimales.csv utilizable%s' % (name[-12:], (' | ' + ' | '.join(diag)) if diag else ''))
    for sp in SPECIES:
        yrs = sorted(dep[sp])[-10:]
        if yrs: DEPT['livestock'][SPECIES[sp]] = {y: {i: round(v) for i, v in sorted(dep[sp][y].items())} for y in yrs}
    nt = ('MGAP, DICOSE/SNIG: declaracion jurada de existencias. Suma nacional de animales propios dentro + ajenos dentro (PD_AD, criterio tradicional de DICOSE), ejercicio ganadero; '
          'no es un censo ni se suma con PD_PF. Los datos de ejercicios recientes son preliminares.')
    names = {'1': 'Cattle', '2': 'Sheep', '11': 'Dairy cattle (DICOSE species 11)'}
    for sp, nm in names.items():
        extra = ' No se suma con bovinos: la fuente no garantiza que los codigos 1 y 11 no se solapen.' if sp in ('1', '11') else ''
        mk('uy-dicose-%s-head' % SPECIES[sp], 'livestock', '%s: inventory on holdings, head, Uruguay (MGAP DICOSE, PD_AD)' % nm, 'head', 'annual', list(tot[sp].items()), 'MGAP (Uruguay)', nt + extra)
    mk('uy-dicose-cattle-births', 'livestock', 'Cattle: births declared, head, Uruguay (MGAP DICOSE)', 'head', 'annual',
       [(y, v) for y, v in births.items() if v > 0], 'MGAP (Uruguay)', nt + ' El dato de nacimientos solo existe para bovinos.')


GHG = {}
GHG_HEAD = ['Sector', 'Categoría', 'Subcategoría', 'Año', 'Tipo de GEI', 'GEI', 'Gg Gas', 'Gg CO2 - eq (GWP)', 'Gg CO2 - eq (GTP)']
GHG_FACTOR = {'CO2': 1.0, 'CH4': 28.0, 'N2O': 265.0}   # factores GWP que trae el propio fichero (corresponden a AR5, aunque su metadato diga AR2)
GHG_CAT = {'3.A.1': 'enteric', '3.A.2': 'manure', '3.C.6': 'manure', '3.C.4': 'soils', '3.C.5': 'soils', '3.C.7': 'rice', '3.C.3': 'urea', '3.C.1': 'burning'}


def ghg_parse(b):
    """Inventario nacional de GEI (Ministerio de Ambiente) -> estructura de data/uy-ghg-agri.json. El CSV oficial tiene la coma decimal sin comillas; se lee solo el XLSX."""
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
    ws = wb['Datos'] if 'Datos' in wb.sheetnames else wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    head = [str(c).strip() if c is not None else '' for c in next(it)][:9]
    if head != GHG_HEAD: log('GEI: cabecera inesperada', head); return None
    ag = defaultdict(float); nat = defaultdict(float); land = defaultdict(float)
    cat = defaultdict(lambda: defaultdict(float)); gas = defaultdict(lambda: defaultdict(float)); bad = set(); unk = set()
    for r in it:
        if not r or not r[0] or r[4] != 'Directo': continue   # los gases indirectos (CO, NOx, COVDM, SO2) no tienen CO2-eq
        try: y = int(r[3])
        except (TypeError, ValueError): continue
        g, w = num(r[6]), num(r[7])
        if w is None or g is None: bad.add(y); continue
        k = str(r[5]).strip()
        if k in GHG_FACTOR and g and abs(w / g - GHG_FACTOR[k]) > 0.02 * GHG_FACTOR[k]: bad.add(y); log('GEI: factor GWP distinto del esperado', y, k, round(w / g, 3)); continue
        sec, sub = str(r[0]).strip()[:1], str(r[2]).strip()[:5]
        if sec == '3' and str(r[1]).strip()[:3] == '3.B': land[y] += w; continue   # uso de la tierra (sumideros): aparte, no es agricultura ni entra en el total
        nat[y] += w
        if sec == '3':
            ag[y] += w; gas[k][y] += w
            c = GHG_CAT.get(sub)
            if c: cat[c][y] += w
            else: unk.add(sub); cat['otherC'][y] += w
    ys = sorted(y for y in ag if y not in bad)
    if len(ys) < 10: log('GEI: solo %d anios utilizables' % len(ys)); return None
    if bad: log('GEI: anios descartados por datos incompletos o factor distinto:', sorted(bad))
    if unk: log('GEI: subcategorias agricolas sin clasificar (van a "otros"):', sorted(unk))
    R = lambda d: [round(d.get(y, 0.0), 1) for y in ys]
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    return {'schemaVersion': 1, 'generatedAt': now, 'unit': 'kt CO2-eq', 'country': 'UY', 'sourceKind': 'singei',
            'source': {'name': 'Ministerio de Ambiente de Uruguay, Inventario Nacional de Gases de Efecto Invernadero (SINGEI; INGEI, directrices IPCC 2006)',
                       'url': 'https://catalogodatos.gub.uy/dataset/ambiente_ingei', 'license': 'Licencia de Datos Abiertos - Uruguay (odc-uy)', 'licenseShort': 'odc-uy'},
            'years': ys, 'agriculture': R(ag), 'national': R(nat), 'byCategory': {k: R(v) for k, v in cat.items()}, 'byGas': {k: R(v) for k, v in gas.items()},
            'landUseNet': R(land),
            'note': 'Solo gases directos (CO2, CH4, N2O, HFC, PFC, SF6) en CO2-eq con los factores del propio fichero (CH4 28, N2O 265, que son los de AR5; el metadato del fichero dice AR2). Agricultura = sector 3 sin la categoria 3.B Tierra; el total nacional no incluye 3.B (landUseNet, negativo = sumidero). Los anios no son consecutivos (1990, 1994, 1998, 2000, 2002... cada dos anios hasta 2014; anual desde 2016). Recurso senalado como discontinuado en el catalogo.'}


def ghg():
    try: pkg = package('ambiente_ingei')
    except Exception as e: log('GEI:', e); return
    res = [r for r in pkg['resources'] if (r.get('url') or '').lower().endswith('ingei.xlsx')]
    if not res: log('GEI: sin XLSX ingei.xlsx'); return
    b = resource_bytes(res[0])
    if b is None: return
    if b.lstrip().startswith(b'<'): log('GEI: el XLSX es HTML'); return
    d = ghg_parse(b)
    if d: GHG['doc'] = d


SCAN_ORGS = ['ine', 'bcu', 'opp', 'mef', 'mgap', 'diea']
SCAN_Q = ['censo 2023', 'poblacion', 'PIB', 'agropecuario', 'fertilizantes', 'granos']


def scan():
    """Rastreo del catalogo (solo lectura): lista en el log los conjuntos abiertos de las organizaciones que interesan, con titulo y licencia. No publica datos."""
    if LOCAL: return
    seen = set(); n = 0
    def one(label, url):
        nonlocal n
        try: res = json.loads(fetch(url, 60))['result']['results']
        except Exception as e: log('CATALOGO %s: %s' % (label, e)); return
        for p in res:
            if p['name'] in seen or str(p['name']).startswith(('mides-indicador', 'mgap-datos-', 'datos-preliminares')): continue
            seen.add(p['name']); n += 1
            fm = sorted({(r.get('format') or '?').upper() for r in p.get('resources', [])})
            log('CATALOGO [%s] %s | %s | org=%s | lic=%s | %s | mod=%s' % (label, p['name'][:70], (p.get('title') or '')[:80], (p.get('organization') or {}).get('name'), p.get('license_id'), ','.join(fm), (p.get('metadata_modified') or '')[:10]))
    for o in SCAN_ORGS:
        one('org:' + o, 'https://catalogodatos.gub.uy/api/3/action/package_search?rows=40&fq=organization:' + urllib.parse.quote(o))
    for q in SCAN_Q:
        one('q:' + q, 'https://catalogodatos.gub.uy/api/3/action/package_search?rows=15&q=' + urllib.parse.quote(q))
    log('CATALOGO: %d conjuntos distintos' % n)


FOREST_RES = '99dd17a8-ca56-4cee-8b17-c513dbe1d5ff'   # Cartografia de bosque plantado 2018, capa especies (GeoJSON; cada poligono trae Especie, Area_Has y DEPTO)
FOREST_YEAR = 2018
FOREST_RANGE = (700000.0, 1600000.0)   # ha plantadas en todo el pais: fuera de este rango el fichero no es lo esperado y no se publica


def _norm(t):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFKD', str(t)) if not unicodedata.combining(c)).strip().upper()


FOREST_ISO = {_norm(n): i for _, n, i in UY_DEPTS}


def forest_group(sp):
    t = _norm(sp)
    if t.startswith('EUCALYPTUS') or t.startswith('E.'): return 'eucalyptus'
    if t.startswith('PINUS') or t.startswith('P.'): return 'pinus'
    return 'other'


def forest_chunks(u, chunk=1 << 22):
    """GeoJSON grande en streaming (se reanuda con Range si la conexion se corta)."""
    import codecs
    dec = codecs.getincrementaldecoder('utf-8')('replace'); off = 0; fails = 0
    while True:
        try:
            h = dict(UA)
            if off: h['Range'] = 'bytes=%d-' % off
            with urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120) as r:
                if off and r.status != 206: raise RuntimeError('el servidor no admite Range')
                while True:
                    b = r.read(chunk)
                    if not b: yield dec.decode(b'', True); return
                    off += len(b); yield dec.decode(b)
        except Exception as e:
            fails += 1
            if fails > 6: raise RuntimeError('descarga forestal cortada en %d bytes: %s' % (off, e))
            time.sleep(8 * fails)


def forest_sum(chunks):
    """Suma Area_Has por (DEPTO, grupo de especie) leyendo solo los bloques "properties" (planos, sin llaves anidadas)."""
    pat = re.compile(r'"properties"\s*:\s*(\{[^{}]*\})'); acc = {}; spp = {}; nfeat = 0; buf = ''
    for ch in chunks:
        buf += ch; last = 0
        for m in pat.finditer(buf):
            last = m.end()
            try: pr = json.loads(m.group(1))
            except ValueError: continue
            a = pr.get('Area_Has'); d = pr.get('DEPTO'); e = pr.get('Especie')
            if not isinstance(a, (int, float)) or not d or a < 0: continue
            nfeat += 1; k = (_norm(d), forest_group(e)); acc[k] = acc.get(k, 0.0) + a
            spp[e] = spp.get(e, 0.0) + a
        rest = buf[last:]; j = rest.rfind('"properties"')
        buf = rest[j:] if j >= 0 else rest[-64:]
    return acc, spp, nfeat


def forest_result(acc, nfeat):
    """De (depto, grupo)->ha a {iso: {total, eucalyptus, pinus, other}}. None si el total no es plausible o hay departamentos sin reconocer."""
    tot = sum(acc.values())
    if not (FOREST_RANGE[0] <= tot <= FOREST_RANGE[1]):
        log('BOSQUE total fuera de rango (%.0f ha, %d poligonos): no se publica' % (tot, nfeat)); return None
    out = {}; bad = 0.0
    for (d, g), ha in acc.items():
        i = FOREST_ISO.get(d)
        if not i: bad += ha; log('BOSQUE departamento no reconocido: %r (%.0f ha)' % (d, ha)); continue
        o = out.setdefault(i, {'total': 0.0, 'eucalyptus': 0.0, 'pinus': 0.0, 'other': 0.0}); o[g] += ha; o['total'] += ha
    if bad > tot * 0.005:
        log('BOSQUE demasiada superficie sin departamento (%.1f%%): no se publica' % (100 * bad / tot)); return None
    return {i: {k: round(v) for k, v in o.items()} for i, o in sorted(out.items())}


def forest():
    if LOCAL: return
    pk = package('mgap-bosques-plantados-forestacion')
    r = next((x for x in pk.get('resources', []) if x.get('id') == FOREST_RES), None)
    if not r or not r.get('url'): raise RuntimeError('recurso forestal no encontrado')
    acc, spp, nfeat = forest_sum(forest_chunks(r['url']))
    log('BOSQUE %d poligonos, %.0f ha en total; especies: %s' % (nfeat, sum(acc.values()), '; '.join('%s=%.0f' % (k[:40], v) for k, v in sorted(spp.items(), key=lambda t: -t[1])[:12])))
    res = forest_result(acc, nfeat)
    if res: DEPT['forest'] = {'year': FOREST_YEAR, 'unit': 'ha', 'byDept': res}; log('BOSQUE publicado: %d departamentos, %d ha' % (len(res), sum(v['total'] for v in res.values())))


def dbf_rows(f):
    """Lector minimo de dBase (.dbf) en streaming: devuelve (campos, generador de dicts). f: objeto binario leible."""
    import struct
    h = f.read(32); n, hl, rl = struct.unpack('<xxxxIHH', h[:12]); fields = []
    while True:
        b0 = f.read(1)
        if not b0 or b0 == b'\r': break
        d = b0 + f.read(31)
        if len(d) < 32: break
        fields.append((d[:11].split(b'\0')[0].decode('latin-1'), chr(d[11]), d[16]))
    f.read(max(0, hl - 32 - 32 * len(fields) - 1))   # relleno hasta el inicio de los datos, si lo hay
    def gen():
        for _ in range(n):
            r = f.read(rl)
            if len(r) < rl: return
            if r[:1] == b'*': continue
            o = {}; p = 1
            for nm, ty, ln in fields:
                o[nm] = r[p:p + ln]; p += ln
            yield o
    return fields, gen()


def download_to(u, path, chunk=1 << 22):
    off = 0; fails = 0
    with open(path, 'wb') as out:
        while True:
            try:
                h = dict(UA)
                if off: h['Range'] = 'bytes=%d-' % off
                with urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120) as r:
                    while True:
                        b = r.read(chunk)
                        if not b: return off
                        out.write(b); off += len(b)
            except Exception as e:
                fails += 1
                if fails > 6: raise RuntimeError('descarga cortada en %d bytes: %s' % (off, e))
                time.sleep(8 * fails)


def probe_dbf(label, f):
    fields, rows = dbf_rows(f)
    log('PROBE %s campos: %s' % (label, ', '.join('%s:%s%d' % x for x in fields)))
    names = {x[0].upper(): x[0] for x in fields}
    keys = [k for k in names if 'DEP' in k or k.startswith('AREA') or k.startswith('SUP') or 'ESPEC' in k or k in ('CAMBIO', 'CLASE', 'CATEGORIA', 'TIPO')]
    log('PROBE %s campos candidatos: %s' % (label, keys))
    agg = {}; n = 0; first = None
    for r in rows:
        n += 1
        if first is None: first = {k: r[k].decode('latin-1', 'replace').strip() for k in r}
        dk = next((names[k] for k in names if 'DEP' in k), None); ak = next((names[k] for k in names if k.startswith('AREA') or k.startswith('SUP')), None)
        if dk and ak:
            try: v = float(r[ak].decode('latin-1').strip() or 0)
            except ValueError: continue
            k2 = _norm(r[dk].decode('latin-1', 'replace')); agg[k2] = agg.get(k2, 0.0) + v
    log('PROBE %s filas=%d primera=%s' % (label, n, json.dumps(first, ensure_ascii=False)[:500]))
    if agg: log('PROBE %s total por departamento (ha o unidad del campo, solo log): %s' % (label, json.dumps({k: round(v) for k, v in sorted(agg.items(), key=lambda t: -t[1])}, ensure_ascii=False)))


def probe_forest2():
    """Sonda de solo lectura (no publica): tabla de atributos del bosque plantado 2021 (zip con shapefile) y del bosque nativo (RAR)."""
    if LOCAL: return
    import shutil, subprocess, tempfile, zipfile
    tmp = Path(tempfile.mkdtemp())
    log('PROBE herramientas: ' + ', '.join('%s=%s' % (t, bool(shutil.which(t))) for t in ('7z', '7zz', 'unrar', 'bsdtar', 'unar')))
    for name, rid in (('mgap-bosques-plantados-forestacion', '72a34aa2-b876-45d6-a531-487262458654'), ('mgap-bosque-nativo', '071b9956-1632-4701-b662-0bbe85aaf2de'), ('mgap-bosque-nativo', '04220c8a-5373-4f95-8453-257e825150c7')):
        try:
            pk = package(name); r = next(x for x in pk['resources'] if x['id'] == rid)
            ext = '.zip' if r['url'].lower().endswith('.zip') else '.rar'; dst = tmp / (rid[:8] + ext)
            nb = download_to(r['url'], dst); log('PROBE %s | %s | %d bytes' % (name, r.get('name'), nb))
            if ext == '.zip':
                with zipfile.ZipFile(dst) as z:
                    log('PROBE zip contenido: ' + '; '.join('%s(%d)' % (i.filename, i.file_size) for i in z.infolist())[:900])
                    for i in z.infolist():
                        if i.filename.lower().endswith('.dbf'):
                            with z.open(i) as f: probe_dbf(i.filename, f)
                        if i.filename.lower().endswith('.prj'): log('PROBE prj %s: %s' % (i.filename, z.read(i)[:200].decode('latin-1', 'replace')))
            else:
                tool = next((t for t in ('7z', '7zz', 'unrar', 'bsdtar', 'unar') if shutil.which(t)), None)
                if not tool: log('PROBE sin herramienta para RAR'); continue
                od = tmp / ('x' + rid[:8]); od.mkdir()
                cmd = {'7z': ['7z', 'x', '-y', '-o' + str(od), str(dst), '*.dbf', '*.prj', '*.cpg'], '7zz': ['7zz', 'x', '-y', '-o' + str(od), str(dst), '*.dbf', '*.prj', '*.cpg'],
                       'unrar': ['unrar', 'x', '-y', str(dst), '*.dbf', '*.prj', str(od) + '/'], 'bsdtar': ['bsdtar', '-xf', str(dst), '-C', str(od), '--include=*.dbf', '--include=*.prj'], 'unar': ['unar', '-o', str(od), str(dst)]}[tool]
                pr = subprocess.run(cmd, capture_output=True, text=True, timeout=1500); log('PROBE %s rc=%d %s' % (tool, pr.returncode, (pr.stdout + pr.stderr)[-300:].replace('\n', ' | ')))
                for fp in sorted(od.rglob('*')):
                    if fp.suffix.lower() == '.dbf':
                        with open(fp, 'rb') as f: probe_dbf(fp.name, f)
                    elif fp.suffix.lower() == '.prj': log('PROBE prj %s: %s' % (fp.name, fp.read_text(errors='replace')[:200]))
        except Exception as e: log('PROBE %s %s: error %s' % (name, rid[:8], str(e)[:300]))
        finally:
            for q in tmp.glob(rid[:8] + '.*'): q.unlink(missing_ok=True)


def main():
    global LOCAL
    if '--local' in sys.argv: LOCAL = sys.argv[sys.argv.index('--local') + 1]
    if (ROOT / 'scripts/uy-probe-only.flag').exists() and not LOCAL:
        probe_forest2(); (ROOT / 'data/uruguay-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8'); return
    for fn in (inia, ursea, lambda: land('sale'), lambda: land('rent'), dicose, inia_grids, ghg, forest, scan):
        try: fn()
        except Exception as e: log('fallo en', getattr(fn, '__name__', 'bloque'), e)
    if not OUT: log('sin series'); sys.exit(1)
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'UY': {'name': 'Uruguay', 'source': {
        'name': 'Uruguay, datos abiertos (INIA, MGAP, URSEA; catalogodatos.gub.uy)', 'url': 'https://catalogodatos.gub.uy/',
        'license': 'Licencia de Datos Abiertos - Uruguay (odc-uy); Dehesa Index calcula medias, sumas y ponderaciones sin aval del proveedor'},
        'series': [OUT[k] for k in sorted(OUT)]}}}
    ddoc = {'schemaVersion': 1, 'generatedAt': now, 'source': doc['countries']['UY']['source'],
            'note': 'Departamentos por sufijo ISO 3166-2 (id del mapa) y codigo numerico alfabetico INE/AGESIC (el de DICOSE y MGAP). Existencias: DICOSE PD_AD por departamento donde esta registrado el tenedor (puede diferir del departamento donde pastan los animales). Tierra: solo departamentos con los dos semestres; USD/ha ponderado. Bosque plantado: suma de Area_Has por departamento de la cartografia forestal 2018 del MGAP (una edicion, no una serie).',
            'departments': [{'iso': i, 'code': c, 'name': n} for c, n, i in UY_DEPTS], 'livestock': DEPT['livestock'], 'land': DEPT['land']}
    if DEPT.get('forest'): ddoc['forest'] = DEPT['forest']
    log('series guardadas:', len(OUT))
    if GHG.get('doc'): (( Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else ROOT / 'data') / 'uy-ghg-agri.json').write_text(json.dumps(GHG['doc'], ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    out = Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else ROOT / 'data'
    (out / 'uruguay-stats.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (out / 'uruguay-departments.json').write_text(json.dumps(ddoc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (out / 'uruguay-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

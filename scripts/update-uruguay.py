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
  mgap-serie-precio-de-la-tierra-compraventas  MGAP, compraventas de tierra por semestre, anio y departamento (XLSX; el CSV tiene la coma decimal sin comillas y desplaza columnas).
        Se publica por anio, con los departamentos que declaran los dos semestres: USD por hectarea = suma de montos / suma de hectareas (ponderado, no media de precios), hectareas
        y numero de operaciones. Operaciones registradas, no precios de oferta. Semestre 999 y anios incompletos no se asignan.
Sin estimaciones: lo que falta no se rellena; una serie con menos de 3 puntos o sin dato en los ultimos 3 anios se descarta y se anota en el log.

Modo local de prueba: python3 scripts/update-uruguay.py --local DIR  (DIR con los originales del paquete de investigacion: raw/*.csv, raw/*.xlsx, raw/ckan-*.json)."""
import csv, datetime, io, json, re, sys, time, urllib.request, calendar
from collections import defaultdict
from pathlib import Path

CKAN = 'https://catalogodatos.gub.uy/api/3/action/package_show?id='
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
YEAR0 = 2000
STATIONS = {'le': 'La Estanzuela', 'lb': 'Las Brujas', 'sg': 'Salto Grande', 'tyt': 'Treinta y Tres', 'tb': 'Tacuarembó'}
LOG = []
OUT = {}
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
def land():
    try: pkg = package('mgap-serie-precio-de-la-tierra-compraventas')
    except Exception as e: log('MGAP tierra:', e); return
    res = [r for r in pkg['resources'] if (r.get('url') or '').endswith('compraventas-por-semestre-ao-y-departamento.xlsx')]
    if not res: log('MGAP tierra: sin XLSX por semestre y departamento'); return
    b = resource_bytes(res[0])
    if b is None: return
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(b), data_only=True, read_only=True)
    except Exception as e: log('MGAP tierra: XLSX ilegible', e); return
    ws = wb['Datos'] if 'Datos' in wb.sheetnames else wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    head = [str(c).strip() if c is not None else '' for c in next(it)][:6]
    if head != ['idDepto', 'ano', 'Sem', 'montous_sum', 'suptran_sum', 'cuenta_sum']:
        log('MGAP tierra: cabecera inesperada', head); return
    cell = defaultdict(dict)   # (anio, depto) -> semestre -> (USD, ha, n)
    for r in it:
        if not r or not isinstance(r[0], (int, float)) or not isinstance(r[1], (int, float)): continue
        sem = str(int(r[2])) if isinstance(r[2], (int, float)) else str(r[2])
        if sem not in ('1', '2'): continue   # 999 u otros: no se asignan a un semestre
        usd, ha, n = num(r[3]), num(r[4]), num(r[5])
        if usd is None or ha is None or n is None: continue
        cell[(int(r[1]), int(r[0]))][sem] = (usd, ha, n)
    yr = defaultdict(lambda: [0.0, 0.0, 0.0, 0])
    for (y, d), s in cell.items():
        if '1' in s and '2' in s:   # solo departamentos con los dos semestres del anio
            for k in ('1', '2'):
                yr[y][0] += s[k][0]; yr[y][1] += s[k][1]; yr[y][2] += s[k][2]
            yr[y][3] += 1
    ys = sorted(y for y in yr if yr[y][1] > 0)
    if ys and yr[ys[-1]][3] < max(yr[y][3] for y in ys) - 2: log('MGAP tierra: ultimo anio %d con pocos departamentos, descartado' % ys[-1]); ys = ys[:-1]
    nt = 'MGAP (DIEA), compraventas de tierra registradas (operaciones, no precios de oferta). Suma de los departamentos que declaran los dos semestres del año; USD por hectárea = suma de montos / suma de hectáreas (ponderado, cálculo de Dehesa Index). Los años y departamentos con semestre incompleto no se incluyen.'
    mk('uy-mgap-land-sale-usd-ha', 'prices', 'Uruguay: land sales, average price per hectare (MGAP, derived, weighted)', 'USD/ha', 'annual', [(str(y), yr[y][0] / yr[y][1]) for y in ys], 'MGAP (Uruguay)', nt)
    mk('uy-mgap-land-sale-area', 'prices', 'Uruguay: land sold, area in registered sales (MGAP)', 'ha', 'annual', [(str(y), yr[y][1]) for y in ys], 'MGAP (Uruguay)', nt)
    mk('uy-mgap-land-sale-count', 'prices', 'Uruguay: land sales, number of registered operations (MGAP)', 'operations', 'annual', [(str(y), yr[y][2]) for y in ys], 'MGAP (Uruguay)', nt)


def main():
    global LOCAL
    if '--local' in sys.argv: LOCAL = sys.argv[sys.argv.index('--local') + 1]
    for fn in (inia, ursea, land):
        try: fn()
        except Exception as e: log('fallo en', fn.__name__, e)
    if not OUT: log('sin series'); sys.exit(1)
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'UY': {'name': 'Uruguay', 'source': {
        'name': 'Uruguay, datos abiertos (INIA, MGAP, URSEA; catalogodatos.gub.uy)', 'url': 'https://catalogodatos.gub.uy/',
        'license': 'Licencia de Datos Abiertos - Uruguay (odc-uy); Dehesa Index calcula medias, sumas y ponderaciones sin aval del proveedor'},
        'series': [OUT[k] for k in sorted(OUT)]}}}
    log('series guardadas:', len(OUT))
    out = ROOT / 'data'
    (out / 'uruguay-stats.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (out / 'uruguay-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Pruebas del adaptador de Uruguay (scripts/update-uruguay.py) con originales sinteticos en modo local: sin red, sin cifras reales.
Cubre los casos de calidad que obligan al adaptador a NO publicar: licencia distinta de odc-uy, HTTP 200 con HTML, fila URSEA Inicio>Fin, semestre 999 de tierras,
meses INIA incompletos, PD_AD frente a PD_PF y suma de bovinos con bovinos de leche."""
import csv, io, json, subprocess, sys, tempfile
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
fails = []
def ok(name, cond):
    if not cond: fails.append(name); print('FALLA', name)

def pkg(name, urls, lic='odc-uy'):
    return {'name': name, 'license_id': lic, 'resources': [{'id': 'r%d' % i, 'url': u} for i, u in enumerate(urls)]}

def run(files, pkgs, extra=()):
    d = Path(tempfile.mkdtemp()); out = Path(tempfile.mkdtemp())
    (d / 'ckan-test.json').write_text(json.dumps({'result': {'results': pkgs}}))
    for n, b in files.items(): (d / n).write_bytes(b)
    p = subprocess.run([sys.executable, '-I', str(ROOT / 'scripts/update-uruguay.py'), '--local', str(d), '--out', str(out)], capture_output=True, text=True)
    st = out / 'uruguay-stats.json'
    series = {s['id']: s for s in json.loads(st.read_text())['countries']['UY']['series']} if st.exists() else {}
    return p, series, (out / 'uruguay-log.txt').read_text() if (out / 'uruguay-log.txt').exists() else p.stdout + p.stderr

def inia_csv(year, skip_days_in_feb=0):
    import calendar
    b = io.StringIO(); w = csv.writer(b); w.writerow(['fecha', 'temperaturaMaxima', 'temperaturaMinima', 'pluviometro'])
    for m in range(1, 13):
        for d in range(1, calendar.monthrange(year, m)[1] + 1):
            if m == 2 and d <= skip_days_in_feb: continue
            w.writerow(['%d-%02d-%02d' % (year, m, d), 20 + m, 10 + m, 1.0])
    return b.getvalue().encode()

# ---- 1. INIA: meses completos si; febrero con 5 dias menos (<90 %) no
files, pk = {}, []
for code in ('le',):
    urls = []
    for y in (2025, 2026):
        u = 'https://x/ppt_tmax_tmin_%s_%d.csv' % (code, y); urls.append(u)
    pk.append(pkg('inia-precipitacion-temps-extremas-' + code, urls))
    files['x--r0.csv'] = inia_csv(2025, skip_days_in_feb=0)
    files['x--r1.csv'] = inia_csv(2026, skip_days_in_feb=5)
p, s, log = run(files, pk)
ser = s.get('uy-inia-le-tmax')
ok('INIA genera serie', ser is not None)
if ser:
    per = [x[0] for x in ser['points']]
    ok('INIA: mes completo entra', '2026-01' in per)
    ok('INIA: febrero incompleto (23/28 dias) no entra', '2026-02' not in per)
    rain = dict(s['uy-inia-le-rain']['points'])
    ok('INIA: lluvia = suma mensual', abs(rain['2025-01'] - 31.0) < 1e-6)
    ok('INIA: maxima = media mensual', abs(dict(ser['points'])['2025-03'] - 23.0) < 1e-6)

# ---- 2. licencia distinta -> no se publica nada de ese conjunto
p, s, log = run(files, [pkg('inia-precipitacion-temps-extremas-le', ['https://x/ppt_tmax_tmin_le_2025.csv'], lic='cc-by')])
ok('licencia distinta de odc-uy: sin series', 'uy-inia-le-tmax' not in s)
ok('licencia distinta: queda en el log', 'licencia inesperada' in log)

# ---- 3. HTTP 200 con HTML no es dato
p, s, log = run({'x--r0.csv': b'<!DOCTYPE html><html>error</html>'}, [pkg('inia-precipitacion-temps-extremas-le', ['https://x/ppt_tmax_tmin_le_2025.csv'])])
ok('HTML con 200 no genera serie', 'uy-inia-le-tmax' not in s)

# ---- 4. URSEA: Inicio>Fin en cuarentena y sin corregir
rows = ['Inicio,Fin,Gasoil50S_ExP,Gasoil50S_ExP_imp']
import datetime
d0 = datetime.date(2025, 1, 26)
for k in range(8):
    a = datetime.date(2025 + (k + 0) // 12, (k % 12) + 1, 26); b = datetime.date(2025 + (k + 1) // 12, ((k + 1) % 12) + 1, 25)
    rows.append('%s,%s,%d.5,%d.5' % (a, b, 40 + k, 50 + k))
rows.append('2022-12-26,2022-12-25,99.0,99.0')
p, s, log = run({'x--r0.csv': '\n'.join(rows).encode()}, [pkg('ursea-ppi_vs_pe_v2', ['https://x/ppi_da_nuevo.csv'])])
u = s.get('uy-ursea-gasoil50s-ex')
ok('URSEA genera serie', u is not None)
if u:
    ok('URSEA: fila Inicio>Fin descartada', all(x[1] != 99.0 for x in u['points']))
    ok('URSEA: periodo = mes en que termina la ventana', u['points'][0][0] == '2025-02')
    ok('URSEA: descarte anotado en el log', 'posterior a Fin' in log)

# ---- 5. MGAP tierras: Sem 999 fuera, solo departamentos con los dos semestres, USD/ha ponderado
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Datos'
ws.append(['idDepto', 'ano', 'Sem', 'montous_sum', 'suptran_sum', 'cuenta_sum'])
for y in (2022, 2023, 2024):
    ws.append([1, y, 1, 1000.0, 100.0, 2]); ws.append([1, y, 2, 3000.0, 100.0, 2])   # dpto 1: (4000/200 = 20 USD/ha)
    ws.append([2, y, 1, 9000.0, 100.0, 1])                                          # dpto 2 solo semestre 1: fuera
ws.append([3, 2024, 999, 5e9, 1.0, 1])                                              # Sem 999: no se asigna ni contamina
ws.append([1, 2021, 999, 7.0, 1.0, 1]); ws.append([1, 2021, 1, 1000.0, 100.0, 2]); ws.append([1, 2021, 2, 3000.0, 100.0, 2])   # dpto-anio con fila 999: se excluye entero
bio = io.BytesIO(); wb.save(bio)
p, s, log = run({'x--r0.xlsx': bio.getvalue()}, [pkg('mgap-serie-precio-de-la-tierra-compraventas', ['https://x/compraventas-por-semestre-ao-y-departamento.xlsx'])])
l = s.get('uy-mgap-land-sale-usd-ha')
ok('Tierra genera serie', l is not None)
if l:
    ok('Tierra: USD/ha ponderado = suma montos / suma ha (20)', abs(l['latest'] - 20.0) < 1e-6)
    ok('Tierra: Sem 999 no contamina', l['latest'] < 1000)
    ok('Tierra: operaciones sumadas (4)', s['uy-mgap-land-sale-count']['latest'] == 4)
    ok('Tierra: dpto-anio con fila 999 excluido (2021 ausente)', '2021' not in dict(l['points']))

# ---- 5b. Arrendamientos: otra cabecera (DEPCOD, montot_sum), unidad USD/ha/anio
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Datos'
ws.append(['DEPCOD', 'ano', 'Sem', 'montot_sum', 'suptran_sum', 'cuenta_sum'])
for y in (2023, 2024, 2025):
    ws.append([1, y, 1, 5000.0, 100.0, 2]); ws.append([1, y, 2, 5000.0, 100.0, 3])
bio = io.BytesIO(); wb.save(bio)
p, s, log = run({'x--r0.xlsx': bio.getvalue()}, [pkg('mgap-serie-precio-de-la-tierra-arrendamientos', ['https://x/arrendamientos-por-departamento.xlsx'])])
r = s.get('uy-mgap-land-rent-usd-ha')
ok('Alquiler genera serie', r is not None)
if r:
    ok('Alquiler: 10000/200 = 50 USD/ha/anio', abs(r['latest'] - 50.0) < 1e-6 and r['unit'] == 'USD/ha/year')
    ok('Alquiler: contratos sumados (5)', s['uy-mgap-land-rent-count']['latest'] == 5)

# ---- 6. DICOSE: PD_AD, no PD_PF; bovinos y bovinos de leche separados; especies sin control de calidad fuera
def dic(year):
    b = io.StringIO(); w = csv.writer(b, delimiter=';')
    w.writerow(['ns1:Ejercicio', 'ns1:EspecieCodigo', 'ns1:AnimalesPorEspecieConsumoPD_AD', 'ns1:AnimalesPorEspecieNacimientosPD_AD', 'ns1:AnimalesPorEspecieMortandadPD_AD', 'ns1:CantidadTenedoresPorEspecie', 'ns1:AnimalesPorEspeciePD_AD', 'ns1:AnimalesPorEspeciePD_PF'])
    for i in range(1200):
        w.writerow([year, 1, 0, 2, 0, 1, 10, 12]); w.writerow([year, 11, 0, 0, 0, 1, 1, 2]); w.writerow([year, 5, 0, 0, 0, 1, 7, 7])
    return b.getvalue().encode('latin-1')
pk = []; files = {}
for i, y in enumerate((2023, 2024, 2025)):
    n = ['mgap-datos-actualizados-de-la-declaracion-jurada-de-existencias-dicose-snig-2023', 'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2024', 'mgap-datos-preliminares-basados-en-la-declaracion-jurada-de-existencias-dicose-snig-2025'][i]
    pk.append({'name': n, 'license_id': 'odc-uy', 'resources': [{'id': 'd%d' % i, 'url': 'https://x/datosanimales.csv'}]}); files['x--d%d.csv' % i] = dic(y)
p, s, log = run(files, pk)
c = s.get('uy-dicose-cattle-head')
ok('DICOSE genera bovinos', c is not None)
if c:
    ok('DICOSE: bovinos = PD_AD (12000), no PD_PF (14400)', c['latest'] == 12000.0)
    ok('DICOSE: bovinos de leche separado de bovinos', s['uy-dicose-dairy-cattle-head']['latest'] == 1200.0)
    ok('DICOSE: no hay serie de porcinos (sin control de calidad)', not any('pig' in k or 'swine' in k for k in s))
    ok('DICOSE: no hay total bovinos+leche', not any('total' in k for k in s))
    ok('DICOSE: nota avisa de no sumar bovinos y leche', 'No se suma con bovinos' in s['uy-dicose-dairy-cattle-head'].get('note', ''))

print('test-uruguay:', 'OK' if not fails else '%d fallos' % len(fails)); sys.exit(1 if fails else 0)

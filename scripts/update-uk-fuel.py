#!/usr/bin/env python3
"""Reino Unido: precio semanal en surtidor del gasoleo (ULSD) y la gasolina sin plomo (ULSP), con impuesto especial e IVA -> data/uk-fuel-stats.json
Fuente: Department for Energy Security and Net Zero (DESNZ), "Weekly road fuel prices" (Open Government Licence v3.0). Peniques por litro, precio medio
de surtidor en el Reino Unido, cada lunes. Se juntan los dos CSV oficiales (2003-2017 y 2018 en adelante); la direccion del de 2018 cambia con cada
publicacion y se localiza en la pagina de gov.uk. Si falla la descarga no se toca el fichero y sale en rojo."""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/uk-fuel-stats.json'; LOGF = ROOT / 'data/uk-fuel-log.txt'
PAGE = 'https://www.gov.uk/government/statistics/weekly-road-fuel-prices'
OLD = 'https://assets.publishing.service.gov.uk/media/68a3326b32d2c63f869343a3/weekly_road_fuel_prices_2003_to_2017.csv'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return r.read().decode('utf-8-sig', 'replace')
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise SystemExit('descarga fallida %s: %s' % (u, last))
def new_csv():
    t = get(PAGE)
    m = [x for x in re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s<>]+?\.csv', t) if '2003' not in x]
    if not m: raise SystemExit('no se encontro el CSV de 2018 en adelante en la pagina de gov.uk')
    log('CSV', m[0]); return m[0]
def parse(t, acc):
    rows = list(csv.reader(io.StringIO(t)))
    head = [h.strip() for h in rows[0]]
    def col(rx):
        for i, h in enumerate(head):
            if re.search(rx, h, re.I): return i
        raise SystemExit('columna no encontrada: %s en %s' % (rx, head))
    c = {'diesel': col(r'^ULSD.*Pump price'), 'petrol': col(r'^ULSP.*Pump price'), 'dutyD': col(r'^ULSD.*Duty'), 'vatD': col(r'^ULSD.*VAT')}
    for r in rows[1:]:
        if not r or not r[0].strip(): continue
        try: d = datetime.datetime.strptime(r[0].strip(), '%d/%m/%Y').date().isoformat()
        except ValueError: continue
        for k, i in c.items():
            try: acc.setdefault(k, {})[d] = float(r[i])
            except (ValueError, IndexError): pass
def main():
    acc = {}
    parse(get(OLD), acc); parse(get(new_csv()), acc)
    if len(acc.get('diesel', {})) < 900: raise SystemExit('muy pocas semanas: no se toca el fichero')
    DEF = [('diesel', 'uk-fuel-diesel-pump', 'Diesel (ULSD): average pump price, United Kingdom (DESNZ, weekly)', 'pence/litre'),
           ('petrol', 'uk-fuel-petrol-pump', 'Unleaded petrol (ULSP): average pump price, United Kingdom (DESNZ, weekly)', 'pence/litre'),
           ('dutyD', 'uk-fuel-diesel-duty', 'Diesel (ULSD): fuel duty rate, United Kingdom (DESNZ, weekly)', 'pence/litre'),
           ('vatD', 'uk-fuel-diesel-vat', 'Diesel (ULSD): VAT rate, United Kingdom (DESNZ, weekly)', '%')]
    series = []
    for k, sid, label, unit in DEF:
        pts = [[d, acc[k][d]] for d in sorted(acc.get(k, {}))]
        if not pts: continue
        prev = pts[-2][1] if len(pts) > 1 else None
        series.append({'id': sid, 'group': 'inputs', 'label': label, 'unit': unit, 'frequency': 'weekly', 'latestPeriod': pts[-1][0], 'latest': pts[-1][1],
                       'changePct': round((pts[-1][1] / prev - 1) * 100, 2) if prev else None, 'points': pts, 'sourceGroup': 'DESNZ'})
        log(sid, len(pts), pts[-1])
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'UK': {'name': 'United Kingdom', 'extend': True, 'source': {'name': 'Department for Energy Security and Net Zero (DESNZ), Weekly road fuel prices', 'url': PAGE, 'license': 'Open Government Licence v3.0'}, 'series': series}},
           'log': LOG}
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); same = o.get('countries') == doc['countries']
    except Exception: same = False
    if not same: OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    else: log('sin cambios')
    LOGF.write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()

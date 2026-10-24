#!/usr/bin/env python3
"""Rumania: clima mensual en estaciones agricolas de la ANM (Administratia Nationala de Meteorologie), portal de datos abiertos odp.meteoromania.ro.
Fuente: ZIP anual por estacion con un CSV mensual de datos diarios (ta temperatura media, r precipitacion). Politica de datos de la OMM: acceso libre y sin condiciones,
se pide citar al productor (metadato WCMP2 'rights'). Agregacion propia (media de ta y suma de r) solo en meses con todos sus dias. Usa el CSV, no la API EDR (esta desplaza la fecha un dia).
Escribe data/romania-anm-stats.json (countries.RO, extend) y data/romania-anm-log.txt."""
import csv, datetime, io, json, sys, time, zipfile, urllib.request, urllib.error, calendar
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
BASE = 'https://odp.meteoromania.ro/station_data_series/climate/daily/%s/%s_%d.zip'
ST = [('0-20000-0-15200', 'Arad'), ('0-20000-0-15247', 'Timisoara'), ('0-20000-0-15120', 'Cluj-Napoca'), ('0-20000-0-15090', 'Iasi'), ('0-20000-0-15310', 'Galati'),
      ('0-20000-0-15480', 'Constanta'), ('0-20000-0-15425', 'Slobozia'), ('0-20000-0-15420', 'Bucharest-Baneasa'), ('0-20000-0-15450', 'Craiova'), ('0-20000-0-15020', 'Botosani'),
      ('0-20000-0-15350', 'Buzau'), ('0-20000-0-15470', 'Rosiorii de Vede')]
LOG = []; OUT = {}
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            last = e; time.sleep(3 * (i + 1))
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:150])
def fl(x):
    try: return float(x)
    except Exception: return None
def station(wsi, y0, y1):
    ta = {}; rr = {}
    for y in range(y0, y1 + 1):
        b = get(BASE % (wsi, wsi, y)); time.sleep(0.4)
        if not b: continue
        try: z = zipfile.ZipFile(io.BytesIO(b))
        except zipfile.BadZipFile: continue
        days = {}
        for n in z.namelist():
            if not n.endswith('.csv'): continue
            lines = z.read(n).decode('utf-8-sig', 'replace').splitlines()
            h = next((i for i, l in enumerate(lines) if l.startswith('wsi,')), None)
            if h is None: continue
            for r in csv.DictReader(lines[h:]):
                try: m = int(r['luna'])
                except Exception: continue
                days.setdefault(m, []).append((fl(r.get('ta')), fl(r.get('r'))))
        for m, v in days.items():
            nd = calendar.monthrange(y, m)[1]
            t = [a for a, _ in v if a is not None]; p = [(0.0 if b == -1 else b) for _, b in v if b is not None]
            k = '%d-%02d' % (y, m)
            if len(t) == nd: ta[k] = sum(t) / nd
            if len(p) == nd: rr[k] = sum(p)
    return ta, rr
def put(sid, label, unit, pts, note):
    pts = [[k, round(v, 1)] for k, v in sorted(pts.items())]
    if len(pts) < 200: log('omitida', sid, len(pts)); return
    lp, lv = pts[-1]; pv = pts[-2][1]
    OUT[sid] = dict(id=sid, group='climate', label=label, unit=unit, frequency='monthly', latestPeriod=lp, latest=lv, changePct=None, points=pts, sourceGroup='ANM (Romania)', periodNote=note, reference='ANM Open Data Platform, daily quality controlled climate data')
def main():
    y1 = datetime.date.today().year; y0 = 2000
    for wsi, nm in ST:
        try: ta, rr = station(wsi, y0, y1)
        except Exception as e: log('ERROR', nm, e); continue
        s = nm.lower().replace(' ', '-')
        note = 'Dehesa Index agrega los datos diarios de la ANM a mensual (media de la temperatura diaria o suma de la precipitacion diaria) solo en meses con todos sus dias; la traza (<0,05 mm) cuenta como 0.'
        put('ro-anm-temp-%s' % s, 'Mean air temperature, monthly: %s, Romania (ANM)' % nm, '°C', ta, note)
        put('ro-anm-rain-%s' % s, 'Precipitation, monthly total: %s, Romania (ANM)' % nm, 'mm', rr, note)
        log(nm, len(ta), len(rr))
    log('series', len(OUT))
    if len(OUT) < 12: sys.exit(1)
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    src = {'name': 'Administratia Nationala de Meteorologie (ANM), Open Data Platform', 'url': 'https://odp.meteoromania.ro/', 'license': 'WMO Unified Data Policy: free and unrestricted access, attribution requested'}
    (ROOT / 'data' / 'romania-anm-stats.json').write_text(json.dumps({'schemaVersion': 1, 'generatedAt': now, 'countries': {'RO': {'name': 'Romania', 'extend': True, 'source': src, 'series': list(OUT.values())}}}, ensure_ascii=False, separators=(',', ':')))
    (ROOT / 'data' / 'romania-anm-log.txt').write_text('\n'.join(LOG) + '\n')
main()

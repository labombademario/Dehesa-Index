#!/usr/bin/env python3
"""Finlandia (Finnish Meteorological Institute, FMI) -> data/finland-fmi-stats.json (countries.FI, extend)
Fuente: servicio abierto WFS de FMI (sin clave): https://opendata.fmi.fi/wfs , consulta almacenada fmi::observations::weather::monthly::simple
(tmon = temperatura media mensual, C; rrmon = precipitacion mensual, mm). Estaciones de zonas agricolas: Jokioinen (sudoeste, cereales), Seinajoki (Ostrobotnia), Kuopio (Savonia, lacteos), Oulu, Sodankyla (Laponia).
Licencia: CC BY 4.0; credito obligatorio «©Finnish Meteorological Institute». La API limita cada consulta a menos de 10 años: se pide en tramos de 5.
Cada valor es el publicado por la fuente: sin estimaciones ni relleno; meses sin dato se omiten. Uso: python3 scripts/update-fi-fmi.py"""
import datetime, json, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'finland-fmi-stats.json'; LOG = ROOT / 'data' / 'finland-fmi-log.txt'
B = 'https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::monthly::simple&parameters=tmon,rrmon&place='
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
SG = 'Finnish Meteorological Institute'
STATIONS = [('Jokioinen', 'Jokioinen (south-west)'), ('Seinäjoki', 'Seinäjoki (Ostrobothnia)'), ('Kuopio', 'Kuopio (Savonia)'), ('Oulu', 'Oulu (north Ostrobothnia)'), ('Sodankylä', 'Sodankylä (Lapland)')]
FROM = 2000
log = []
def say(*a): s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
def slug(t): return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
def get(place, y0, y1):
    u = B + urllib.parse.quote(place) + '&starttime=%d-01-01T00:00:00Z&endtime=%d-12-31T00:00:00Z' % (y0, y1)
    err = None
    for k in range(3):
        time.sleep(1)
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read()
        except Exception as e: err = e; time.sleep(5 * (k + 1))
    raise RuntimeError('%s %d-%d -> %s' % (place, y0, y1, err))
def fetch(place):
    now = datetime.date.today().year; out = {'tmon': {}, 'rrmon': {}}; y = FROM
    while y <= now:
        y1 = min(y + 4, now)
        root = ET.fromstring(get(place, y, y1))
        for el in root.iter('{http://xml.fmi.fi/schema/wfs/2.0}BsWfsElement'):
            f = {c.tag.split('}')[1]: (c.text or '') for c in el}
            p, v = f.get('ParameterName'), f.get('ParameterValue')
            try: x = float(v)
            except Exception: continue
            if p in out and x == x and f.get('Time', '')[:7]: out[p][f['Time'][:7]] = x
        y = y1 + 1
    return out
OUTS = {}
def put(sid, label, unit, d):
    pp = sorted(d.items())
    if len(pp) < 200: say('omitida (pocos puntos):', sid, len(pp)); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    OUTS[sid] = {'id': sid, 'group': 'climate', 'label': label, 'unit': unit, 'frequency': 'monthly', 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv and pv > 0 else None,
                 'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'periodNote': 'Valor mensual de la estación meteorológica de FMI (observación oficial); crédito «©Finnish Meteorological Institute», CC BY 4.0.',
                 'reference': {'source': 'Finnish Meteorological Institute open data (©Finnish Meteorological Institute)', 'dataset': 'fmi::observations::weather::monthly::simple', 'licence': 'CC BY 4.0', 'original': 'https://en.ilmatieteenlaitos.fi/open-data'}}
for place, name in STATIONS:
    try:
        r = fetch(place)
        put('fi-fmi-temp-' + slug(place.replace('ä', 'a')), 'Mean air temperature: %s, Finland (FMI)' % name, '°C', r['tmon'])
        put('fi-fmi-rain-' + slug(place.replace('ä', 'a')), 'Monthly precipitation: %s, Finland (FMI)' % name, 'mm', r['rrmon'])
        say(place, len(r['tmon']), 'meses temp,', len(r['rrmon']), 'meses lluvia')
    except Exception as e: say('FALLO %s: %s' % (place, str(e)[:200]))
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 6: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'FI': {'name': 'Finland', 'extend': True, 'source': {'name': 'Finnish Meteorological Institute (open data)', 'url': 'https://en.ilmatieteenlaitos.fi/open-data', 'license': 'CC BY 4.0; credit: ©Finnish Meteorological Institute'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))

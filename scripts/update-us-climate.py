#!/usr/bin/env python3
"""EE. UU.: clima oficial NOAA NCEI (Climate at a Glance, nClimDiv) -> data/us-climate-stats.json (countries.US, extend).
Temperatura media (F), precipitacion (pulgadas) e indice de sequia de Palmer (PDSI) MENSUALES por estado (48 contiguos + Alaska) y el total de los 48 contiguos.
Fuente: https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/ (NOAA, dominio publico; citar NOAA NCEI). Sin conversiones.
Un fallo aislado no borra lo anterior: si salen muy pocas series no se escribe nada."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-climate-stats.json'; LOGF = ROOT / 'data/us-climate-log.txt'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
STATES = ['Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
          'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
          'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
ENT = [(i + 1, n) for i, n in enumerate(STATES)] + [(50, 'Alaska'), (110, 'Contiguous U.S.')]   # codigos nClimDiv: 1..48 alfabeticos, 50 Alaska, 110 48 contiguos
PARAMS = [('tavg', 'mean temperature', 'degF'), ('pcp', 'precipitation', 'inches'), ('pdsi', 'Palmer Drought Severity Index', 'index')]
Y0 = 2010
def get(u):
    err = None
    for k in range(3):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=60).read().decode('utf-8'))
        except Exception as e: err = e; time.sleep(3 * (k + 1))
    raise err
def main():
    now = datetime.date.today(); out = []
    for code, name in ENT:
        for par, txt, unit in PARAMS:
            u = 'https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/%s/time-series/%d/%s/1/0/%d-%d.json' % ('national' if code == 110 else 'statewide', code, par, Y0, now.year)
            if code == 110: u = u.replace('national/time-series/110', 'national/time-series/110')
            try: d = get(u)
            except Exception as e: log('ERROR', name, par, repr(e)[:120]); continue
            pts = []
            for k, v in sorted((d.get('data') or {}).items()):
                x = v.get('value') if isinstance(v, dict) else v
                if re.fullmatch(r'\d{6}', k) and isinstance(x, (int, float)) and x > -99: pts.append(['%s-%s' % (k[:4], k[4:]), x])
            if len(pts) < 24: log('pocos datos', name, par, len(pts)); continue
            last, prev = pts[-1], pts[-2]
            out.append({'id': 'us-noaa-%s-%s' % (re.sub(r'[^a-z]+', '-', name.lower()).strip('-'), par), 'group': 'climate', 'label': '%s: %s (NOAA)' % (name, txt), 'unit': unit, 'frequency': 'monthly',
                        'latestPeriod': last[0], 'latest': last[1], 'changePct': None, 'points': pts, 'sourceGroup': 'NOAA NCEI nClimDiv'})
            time.sleep(0.2)
    log('series', len(out))
    LOGF.write_text('\n'.join(LOG[-100:]) + '\n', encoding='utf-8')
    if len(out) < 100: log('demasiado pocas series; no se escribe'); sys.exit(1)
    src = {'name': 'NOAA National Centers for Environmental Information - Climate at a Glance (nClimDiv)', 'url': 'https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/', 'license': 'US Government work (public domain); cite NOAA NCEI'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': src, 'series': out}}, 'log': LOG[-30:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
main()

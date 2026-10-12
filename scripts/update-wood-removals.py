#!/usr/bin/env python3
"""Cortas de madera en rollo por pais -> data/wood-removals.json
Eurostat, conjunto for_remov (Joint Forest Sector Questionnaire): cortas anuales en miles de m3 sin corteza, por tipo de arbol (conifera / frondosa)
y destino (industrial: troza, trituracion, otros; lena). Paises: Alemania, Italia, Espana, Francia (el agregado UE-27 de Eurostat no pasa de 2016). No es un precio: es el volumen que se corta cada ano.
Uso: python3 scripts/update-wood-removals.py"""
import datetime, json, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'wood-removals.json'
GEOS = ['DE', 'IT', 'ES', 'FR']  # el agregado UE-27 de este conjunto solo llega a 2016: no se publica
URL = 'https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/for_remov?format=TSV&' + '&'.join('geo=' + g for g in GEOS)
KEYS = [('TOTAL', 'RW'), ('TOTAL', 'RW_IN'), ('TOTAL', 'RW_IN_LG'), ('TOTAL', 'RW_IN_PW'), ('TOTAL', 'RW_IN_O'), ('TOTAL', 'RW_FW'), ('CONIF', 'RW'), ('NCONIF', 'RW')]
def get():
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=180) as r: return r.read().decode('utf-8')
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(str(last)[:200])
def main():
    L = get().splitlines(); hdr = [h.strip() for h in L[0].split('\t')]; years = [int(h) for h in hdr[1:]]
    want = {'%s,%s,THS_M3,UNBK' % k: k for k in KEYS}
    data = {}; est = {}
    for line in L[1:]:
        c = line.split('\t'); k = c[0].split(','); geo = k[-1]; sub = '%s,%s,%s,%s' % (k[1], k[2], k[3], k[4])
        if sub not in want or geo not in GEOS: continue
        vals = []
        for j, cell in enumerate(c[1:]):
            t = cell.strip(); v = t.split(' ')[0] if t else ':'
            if v in (':', ''): vals.append(None); continue
            try: vals.append(float(v))
            except ValueError: vals.append(None); continue
            if ' ' in t and 'e' in t.split(' ', 1)[1] and want[sub] == ('TOTAL', 'RW'): est.setdefault(geo, set()).add(years[j])
        data.setdefault(geo, {})['%s.%s' % want[sub]] = vals
    if set(data) != set(GEOS): print('ERROR: faltan paises', sorted(data)); return 1
    first = min(i for cc in data.values() for v in cc.values() for i, x in enumerate(v) if x is not None)
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': 'THS_M3',
           'source': {'name': 'Eurostat, for_remov (Joint Forest Sector Questionnaire)', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/for_remov/default/table', 'license': 'Eurostat copyright notice (reutilizable citando la fuente)'},
           'years': years[first:], 'countries': {}}
    for cc, ser in sorted(data.items()):
        last = max((i for v in ser.values() for i, x in enumerate(v) if x is not None), default=0)
        out['countries'][cc] = {'series': {k: v[first:] for k, v in sorted(ser.items())}, 'estimated': sorted(y for y in est.get(cc, ()) if y >= years[first]), 'last': years[last]}
        print(cc, 'ultimo año', years[last], 'total', ser['TOTAL.RW'][last])
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('wood-removals.json', OUT.stat().st_size, 'bytes'); return 0
if __name__ == '__main__': sys.exit(main())

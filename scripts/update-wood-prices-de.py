#!/usr/bin/env python3
"""Alemania, madera en rollo de los bosques estatales -> data/wood-prices-de.json
Destatis GENESIS, tabla 61231-0002: indices de precios de productor de los productos de la corta de los bosques estatales
(Staatsforsten), mensual desde enero de 1968, base 2015=100. NO es un precio en euros por m3: es un indice.
Necesita el token GENESIS_TOKEN (el mismo de update-germany); sin el no se toca el fichero. Licencia: Datenlizenz Deutschland - Namensnennung 2.0.
Uso: GENESIS_TOKEN=... python3 scripts/update-wood-prices-de.py"""
import csv, datetime, io, json, os, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'wood-prices-de.json'
TABLE = '61231-0002'
URL = 'https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile'
# codigo GENESIS -> clave corta. Todas son indices 2015=100.
KEYS = {'ROHHOLZ': 'total', 'STAMMHOLZ': 'logs', 'INDUSTRIEHOLZ': 'pulp', 'BRENNHOLZ': 'fuel', 'STAMMHOLZFICHTE': 'spruce', 'STAMMHOLZKIEFER': 'pine',
        'STAMMHOLZBUCHE': 'beech', 'STAMMHOLZEICHE': 'oak', 'STAMMHOLZDOUGL': 'douglas'}
CHUNKS = [(1968, 1987), (1988, 2007), (2008, datetime.date.today().year)]  # la API rechaza tablas grandes en una sola peticion
MISSING = {'', '.', '..', '...', '-', '/', 'x', '–'}
def fetch(tok, a, b):
    h = {'Content-Type': 'application/x-www-form-urlencoded', 'username': tok, 'password': '', 'Accept': '*/*', 'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
    body = urllib.parse.urlencode({'name': TABLE, 'area': 'all', 'startyear': a, 'endyear': b, 'format': 'ffcsv', 'compress': 'false', 'transpose': 'false', 'job': 'false', 'language': 'de'}).encode()
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(URL, data=body, headers=h, method='POST'), timeout=240) as r: raw = r.read()
            if raw[:2] != b'PK': raise RuntimeError('respuesta sin ZIP: ' + raw[:200].decode('utf-8', 'replace'))
            z = zipfile.ZipFile(io.BytesIO(raw)); return z.read(z.namelist()[0]).decode('utf-8-sig')
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(('GENESIS %s %d-%d: %s' % (TABLE, a, b, last)).replace(tok, '<token>'))
def main():
    tok = os.environ.get('GENESIS_TOKEN', '').strip()
    if not tok: print('sin GENESIS_TOKEN: se conserva data/wood-prices-de.json'); return 0
    vals = {k: {} for k in KEYS.values()}
    for a, b in CHUNKS:
        rd = csv.DictReader(io.StringIO(fetch(tok, a, b)), delimiter=';')
        for r in rd:
            k = KEYS.get(r['3_variable_attribute_code'])
            if not k: continue
            m = r['1_variable_attribute_code']; v = (r['value'] or '').strip()
            if not m.startswith('MONAT') or v in MISSING: continue
            try: x = float(v.replace('.', '').replace(',', '.'))
            except ValueError: continue
            vals[k]['%s-%s' % (r['time'], m[5:])] = x
    tot = vals['total']
    if len(tot) < 600: print('ERROR: la serie total solo tiene %d meses' % len(tot)); return 1
    months = sorted(tot); first, last = months[0], months[-1]
    y, m = int(first[:4]), int(first[5:]); ly, lm = int(last[:4]), int(last[5:]); allm = []
    while (y, m) <= (ly, lm):
        allm.append('%04d-%02d' % (y, m)); m += 1
        if m > 12: y += 1; m = 1
    series = {k: [v.get(mm) for mm in allm] for k, v in vals.items()}
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': 'INDEX_2015', 'base': '2015=100',
           'source': {'name': 'Statistisches Bundesamt (Destatis), GENESIS-Online, tabla 61231-0002', 'url': 'https://www-genesis.destatis.de/datenbank/online/table/61231-0002', 'license': 'Datenlizenz Deutschland – Namensnennung – Version 2.0'},
           'months': allm, 'series': series, 'last': last}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('wood-prices-de.json', OUT.stat().st_size, 'bytes', first, '..', last, {k: sum(x is not None for x in v) for k, v in series.items()}); return 0
if __name__ == '__main__': sys.exit(main())

#!/usr/bin/env python3
"""Eurostat para los estados de la zona euro con peso agrario (BG EL FI HR IE LT SK) y relleno de ES, DE y NL -> data/eurostat-eu-stats.json (BG EL FI HR IE LT SK) y data/eurostat-euw-stats.json (DE ES NL)
Modo reducido (lite): solo cultivos, ganado, carne, leche, indices de precios y cuentas agrarias de los productos de la matriz de cobertura y los totales, para respetar el presupuesto de datos del repositorio.
Toda la logica vive en scripts/eurostat_country.py (nucleo comun con Italia y Polonia). Nada se estima: lo que Eurostat no publica para un pais se queda sin serie."""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eurostat_country as E
C = {'BG': 'Bulgaria', 'EL': 'Greece', 'FI': 'Finland', 'HR': 'Croatia', 'IE': 'Ireland', 'LT': 'Lithuania', 'SK': 'Slovakia', 'DE': 'Germany', 'ES': 'Spain', 'NL': 'Netherlands'}
SRC = {'url': 'https://ec.europa.eu/eurostat/web/agriculture', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
only = [a for a in sys.argv[1:] if a in C]
out = {}
for cc in (only or C):
    ser = E.collect({'geo': cc, 'pfx': cc.lower(), 'slug': 'eurostat-eu', 'name': C[cc], 'source': 'Eurostat', 'lite': True})
    if ser: out[cc] = {'name': C[cc], 'extend': True, 'source': dict(SRC, name='Eurostat (official national data via the European Statistical System)'), 'series': ser}
    else: E.log('sin datos suficientes', cc)
open('data/eurostat-eu-log.txt', 'w').write('\n'.join(E.LOG) + '\n')
if not out: sys.exit(1)
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
for fn, grp in (('eurostat-eu-stats.json', ('BG', 'EL', 'FI', 'HR', 'IE', 'LT', 'SK')), ('eurostat-euw-stats.json', ('DE', 'ES', 'NL'))):   # dos ficheros: el limite de peso por fichero (900 KB gzip) no admite los diez juntos
    cs = {k: v for k, v in out.items() if k in grp}
    if not cs: continue
    json.dump({'schemaVersion': 1, 'generatedAt': now, 'countries': cs, 'log': E.LOG[-30:]}, open('data/' + fn, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(fn, 'paises', len(cs), 'series', sum(len(v['series']) for v in cs.values()))

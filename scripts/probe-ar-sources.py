#!/usr/bin/env python3
"""Sonda temporal (21-oct-2026): fuentes oficiales para Argentina (socios comerciales, emisiones agrarias, sequia). Escribe data/probe-ar.txt. Se borra tras usarla."""
import json, urllib.request, urllib.parse
H = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
out = []
def get(u, n=400000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60) as r: return r.read(n).decode('utf-8', 'replace')
    except Exception as e: return 'ERROR %r' % e
def ck(path): return get('https://datos.gob.ar/api/3/action/' + path)
for pid in ['sspm-exportaciones-por-provincia-por-pais-destino', 'agroindustria-producciones-sostenibles---emisiones-gei-provenientes-agricultura-ganaderia-otros']:
    t = ck('package_show?id=' + pid)
    try:
        r = json.loads(t)['result']; out.append('== %s | %s | lic %s | %s' % (pid, r.get('title'), r.get('license_title'), r.get('metadata_modified')))
        for x in r.get('resources', []): out.append('   - %s | %s | %s | %s' % (x.get('name'), x.get('format'), x.get('url'), (x.get('description') or '')[:200].replace('\n', ' ')))
    except Exception as e: out.append('== %s ERROR %s %s' % (pid, e, t[:200]))
for q in ['importaciones pais origen', 'exportaciones pais destino', 'intercambio comercial', 'emisiones gases efecto invernadero', 'inventario gei', 'sequia', 'reservas agua suelo']:
    t = ck('package_search?rows=12&q=' + urllib.parse.quote(q))
    try:
        res = json.loads(t)['result']['results']; out.append('## busqueda %r: %d' % (q, len(res)))
        for r in res: out.append('   * %s | %s | %s | %s' % (r.get('name'), r.get('title'), r.get('license_title'), (r.get('organization') or {}).get('title')))
    except Exception as e: out.append('## %r ERROR %s %s' % (q, e, t[:200]))
for u in ['https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/', 'https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/GDO_Risk_of_Drought_Impact_for_Agriculture/',
          'https://inventariogei.ambiente.gob.ar/', 'https://apis.datos.gob.ar/series/api/search/?q=exportaciones%20china&limit=10', 'https://apis.datos.gob.ar/series/api/search/?q=importaciones%20brasil&limit=10',
          'https://apis.datos.gob.ar/series/api/search/?q=exportaciones%20union%20europea&limit=10', 'https://apis.datos.gob.ar/series/api/search/?q=emisiones%20gei%20agricultura&limit=10']:
    t = get(u, 60000); out.append('>> %s\n%s' % (u, t[:6000]))
open('data/probe-ar.txt', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out)[:3000])

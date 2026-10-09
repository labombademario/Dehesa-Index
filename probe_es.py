import csv, io, json, urllib.request, collections
from pathlib import Path
O = Path('probe_es6'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read().decode('utf8', 'replace')
API = 'https://servicio.mapa.gob.es/ckan/api/3/action/package_show?id='
BASE = 'https://servicio.mapa.gob.es/ckan/datastore/dump/'
out = {}
for pkg in ('esmapaindicespreciosindicepercibido',):
    d = json.loads(get(API + pkg))['result']
    rid = [r['id'] for r in d['resources'] if r.get('datastore_active')][0]
    rows = list(csv.DictReader(io.StringIO(get(BASE + rid))))
    c = collections.OrderedDict()
    for r in rows:
        k = (r['categoria'], r['grupo'], r['subgrupo'], r['producto'])
        e = c.setdefault(k, {'n': 0, 'first': '9999-99', 'last': '0000-00', 'bases': set(), 'nonnull': 0})
        e['n'] += 1; p = '%s-%02d' % (r['anio'], int(r['mes'])); e['first'] = min(e['first'], p); e['last'] = max(e['last'], p); e['bases'].add(r['anio_base'])
        if r['indice_mensual_producto'] not in ('', None, 'NA'): e['nonnull'] += 1
    out[pkg] = [dict(zip(('categoria', 'grupo', 'subgrupo', 'producto'), k), n=v['n'], first=v['first'], last=v['last'], bases=sorted(v['bases']), nonnull=v['nonnull']) for k, v in c.items()]
    (O / (pkg + '.csv')).write_text(''.join(l for l in io.StringIO(get(BASE + rid)).readlines()[:1] ) , encoding='utf8')
(O / 'products.json').write_text(json.dumps(out, ensure_ascii=False, indent=0))
print('ok')

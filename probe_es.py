import re, subprocess, json, urllib.request, urllib.parse
from pathlib import Path
O = Path('probe_es2'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
def get(u, binary=False, t=120):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r:
            b = r.read(); return b if binary else b.decode('utf8', 'replace')
    except Exception as e:
        return None if binary else 'ERR %s' % e
S = 'https://www.mapa.gob.es'
P = S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/'
pages = {'arroz-balances': P + 'arroz/balances-de-gestion-de-arroz', 'arroz-precios': P + 'arroz/evolucion-de-los-precios-del-arroz', 'leg-oleag': P + 'leguminosas-y-oleaginosas',
         'existencias-siega': P + 'evolucion-existencias-siega/', 'arroz-info': P + 'arroz/informacion_general_sector-arroz'}
info = {}
for k, u in pages.items():
    h = get(u) or ''; (O / (k + '.html')).write_text(h, encoding='utf8')
    ls = sorted({urllib.parse.unquote(m) for m in re.findall(r'href="([^"]+)"', h)})
    info[k] = {'len': len(h), 'files': [l for l in ls if re.search(r'\.(pdf|xlsx?|csv|ods)', l, re.I)], 'subs': [l for l in ls if re.search(r'(oleagin|arroz|balance|existenc|precio)', l, re.I) and not re.search(r'\.(pdf|xlsx?)', l, re.I)][:40]}
(O / 'pages.json').write_text(json.dumps(info, ensure_ascii=False, indent=1))
def dl(name, u):
    full = u if u.startswith('http') else S + u
    b = get(full, True)
    if b:
        (O / name).write_bytes(b)
        if name.endswith('.pdf'): subprocess.run(['pdftotext', '-layout', str(O / name), str(O / (name + '.txt'))])
    else:
        (O / (name + '.err')).write_text('fallo ' + full)
for k in ('arroz-balances', 'leg-oleag', 'existencias-siega'):
    fl = [f for f in info[k]['files'] if f.lower().endswith('.pdf')]
    for i, f in enumerate(fl[-4:]): dl('%s-%d.pdf' % (k, i), f)
dl('coyuntura.pdf', S + '/dam/mapa/contenido/estadisticas/temas/publicaciones/informe-semanal-de-coyuntura/2026/2026/informe-semanal-de-coyuntura-2026-s-24-11-1.pdf')
# Eurostat HICP v2: codigos de mantequilla, queso, arroz, aceites
E = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr?format=JSON&lang=EN&geo=ES&unit=I25&lastTimePeriod=1'
h = get(E) or ''
try:
    j = json.loads(h); lab = j['dimension']['coicop']['category']['label']
    hits = {k: v for k, v in lab.items() if re.search(r'butter|cheese|rice|milk|oil|egg|dairy|margarine|bread|cereal', v, re.I)}
    (O / 'hicp_codes.json').write_text(json.dumps({'n': len(lab), 'hits': hits, 'time': j['dimension']['time']['category']['index'], 'unit': j['dimension']['unit']['category']['label']}, ensure_ascii=False, indent=1))
except Exception as e:
    (O / 'hicp_codes.json').write_text('ERR %s %s' % (e, h[:500]))
print('ok')

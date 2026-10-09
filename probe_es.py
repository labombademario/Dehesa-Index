import re, subprocess, json, urllib.request, urllib.parse, base64, html
from pathlib import Path
O = Path('probe_es3'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
def req(u, data=None, headers=None, t=120, binary=False):
    h = dict(UA); h.update(headers or {})
    try:
        r = urllib.request.Request(u, data=data, headers=h)
        with urllib.request.urlopen(r, timeout=t) as x:
            b = x.read(); return b if binary else b.decode('utf8', 'replace')
    except Exception as e:
        return None if binary else 'ERR %s' % e
S = 'https://www.mapa.gob.es'; P = S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/leguminosas-y-oleaginosas/'
info = {}
for k in ('balances-gestion', 'boletin-mercado', 'precios-de-principales-oleaginosas', 'oleaginosas'):
    h = req(P + k) or ''; (O / (k + '.html')).write_text(h, encoding='utf8')
    ls = sorted({urllib.parse.unquote(m) for m in re.findall(r'href="([^"]+)"', h)})
    info[k] = {'len': len(h), 'files': [l for l in ls if re.search(r'\.(pdf|xlsx?|csv|ods)', l, re.I) and 'guia-cookies' not in l and 'agrivolt' not in l]}
(O / 'pages.json').write_text(json.dumps(info, ensure_ascii=False, indent=1))
def dl(name, u):
    b = req(u if u.startswith('http') else S + u, binary=True)
    if b:
        (O / name).write_bytes(b)
        if name.endswith('.pdf'): subprocess.run(['pdftotext', '-layout', str(O / name), str(O / (name + '.txt'))])
    else: (O / (name + '.err')).write_text('fallo ' + u)
bal = info['balances-gestion']['files']
for i, f in enumerate(bal[-3:]): dl('bal-%d.pdf' % i, f)
pr = info['precios-de-principales-oleaginosas']['files']
for i, f in enumerate(pr[-1:]): dl('precios-%d.pdf' % i, f)
# HICP ECOICOP v2
j = None
h = req('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr?format=JSON&lang=EN&geo=ES&unit=I25&lastTimePeriod=1') or ''
try:
    j = json.loads(h); dim = j['dimension']['coicop18']['category']['label']
    (O / 'hicp_codes.json').write_text(json.dumps({'n': len(dim), 'hits': {k: v for k, v in dim.items() if re.search(r'butter|cheese|rice|milk|oil|egg|dairy|margarine|bread|cereal|fat', v, re.I)}, 'time': list(j['dimension']['time']['category']['index']), 'unit': j['dimension']['unit']['category']['label']}, ensure_ascii=False, indent=1))
except Exception as e:
    (O / 'hicp_codes.json').write_text('ERR %s %s' % (e, h[:400]))
# Power BI publico (SIEGA)
key = 'eyJrIjoiOGVhODFiNWMtOTE0Zi00NjI2LWJhMjktMDU2YzgyMTFlNTcxIiwidCI6Ijk1MjIxYzAzLTRlYmYtNGViNS04Zjc4LTUzODA3MTAwMDRiYyIsImMiOjl9'
kj = json.loads(base64.b64decode(key + '=='))
pb = {'key': kj}
cl = req('https://api.powerbi.com/public/routing/cluster/' + kj['t'])
pb['cluster'] = (cl or '')[:300]
(O / 'pbi.json').write_text(json.dumps(pb, ensure_ascii=False, indent=1))
for host in re.findall(r'https://[^"\\]+', cl or '')[:1] + ['https://wabi-west-europe-d-primary-api.analysis.windows.net', 'https://wabi-north-europe-api.analysis.windows.net', 'https://wabi-west-europe-api.analysis.windows.net']:
    host = host.rstrip('/')
    m = req(host + '/public/reports/' + kj['k'] + '/modelsAndExploration?preferReadOnlySession=true', headers={'X-PowerBI-ResourceKey': kj['k'], 'Accept': 'application/json'})
    (O / ('models_' + re.sub(r'\W', '_', host)[-40:] + '.json')).write_text((m or '')[:200000])
print('ok')

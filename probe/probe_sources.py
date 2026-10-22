#!/usr/bin/env python3
"""Sondeo puntual (borrar tras leerlo): formato, licencia y acceso de fuentes candidatas, desde un runner de GitHub con red."""
import base64, json, os, re, sys, time, urllib.request, urllib.error
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
def get(url, headers=None, tries=2, timeout=60, data=None):
    h = dict(UA); h.update(headers or {}); last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=h, data=data)
            with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e: return e.code, dict(e.headers), e.read()[:400]
        except Exception as e: last = e; time.sleep(3)
    return 0, {}, str(last).encode()
def head(url, n=300, **k):
    st, h, b = get(url, **k); p('GET', url, '->', st, h.get('Content-Type'), len(b)); return st, h, b
sec = sys.argv[1] if len(sys.argv) > 1 else 'all'
if sec in ('all', 'statcan'):
    p('=== STATCAN')
    st, h, b = head('https://www150.statcan.gc.ca/t1/wds/rest/getAllCubesListLite', timeout=120)
    try:
        L = json.loads(b)
        for c in L:
            t = (c.get('cubeTitleEn') or '')
            if re.search(r'(?i)fruit|vegetable|potato|apple|berr|nursery|greenhouse|tomato|onion|carrot', t) and re.search(r'(?i)price|value|farm|marketed|production|area', t):
                p('CUBE', c['productId'], c.get('frequencyCode'), c.get('releaseTime'), c.get('cubeEndDate'), t[:150])
    except Exception as e: p('ERR cubes', e)
    head('https://www.statcan.gc.ca/en/terms-conditions/open-licence')
    st, h, b = head('https://www150.statcan.gc.ca/robots.txt'); p(b[:300].decode('utf8', 'ignore'))
if sec in ('all', 'mars'):
    p('=== MARS')
    key = os.environ.get('MARS_API_KEY', '')
    auth = {'Authorization': 'Basic ' + base64.b64encode((key + ':').encode()).decode()}
    st, h, b = head('https://marsapi.ams.usda.gov/services/v1.2/reports', headers=auth, timeout=120)
    try:
        L = json.loads(b); L = L if isinstance(L, list) else L.get('results') or L
        p('reports', len(L))
        for r in L:
            t = ' '.join(str(r.get(k, '')) for k in ('report_title', 'slug_name', 'market_types', 'commodities'))
            if re.search(r'(?i)fruit|vegetable|produce|terminal|shipping point|berries|apple|potato|onion|tomato|lettuce|citrus|nuts', t):
                p('REP', r.get('slug_id'), r.get('report_title'), '|', r.get('market_types'), '|', r.get('commodities') if 'commodities' in r else '', '|', r.get('published_date') or r.get('report_date'))
    except Exception as e: p('ERR mars', e, b[:200])
if sec in ('all', 'wine'):
    p('=== WINE (Comisión) y resto de vino')
    for u in ['https://api.tech.ec.europa.eu/agrifood/api/wine/prices', 'https://api.tech.ec.europa.eu/agrifood/api/wine/production', 'https://api.tech.ec.europa.eu/agrifood/api/wine/stocks', 'https://api.tech.ec.europa.eu/agrifood/swagger/index.html', 'https://api.tech.ec.europa.eu/agrifood/swagger/v1/swagger.json']:
        st, h, b = head(u); p(b[:500].decode('utf8', 'ignore').replace('\n', ' '))
    for u in ['https://www.ivv.gov.pt/np4/estatisticas/', 'https://www.ivv.gov.pt/np4/home', 'https://www.ismeamercati.it/vino', 'https://www.elstat.gr/', 'https://www.oiv.int/what-we-do/data-discovery-report']:
        st, h, b = head(u); p(re.sub(r'\s+', ' ', b[:300].decode('utf8', 'ignore')))
    for ds in ['apro_acs_a', 'vit_t1', 'apro_cpsh1']:
        st, h, b = head('https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/dataflow/ESTAT/%s/latest?detail=allstubs' % ds); p(b[:300].decode('utf8', 'ignore').replace('\n', ' '))
if sec in ('all', 'ssn'):
    p('=== SSN Argentina')
    for u in ['https://www.argentina.gob.ar/superintendencia-de-seguros', 'https://www.argentina.gob.ar/superintendencia-de-seguros/estadisticas', 'https://www.argentina.gob.ar/superintendencia-de-seguros/estadisticas/seguros-agropecuarios', 'https://www.argentina.gob.ar/robots.txt', 'https://datos.gob.ar/dataset?q=seguros+agropecuarios', 'https://www.argentina.gob.ar/aviso-legal']:
        st, h, b = head(u); t = b[:2500].decode('utf8', 'ignore'); p(re.sub(r'\s+', ' ', t)[:500])
        for m in re.findall(r'href="([^"]+\.(?:xls|xlsx|pdf|csv)[^"]*)"', b.decode('utf8', 'ignore') if st == 200 else ''): p('  LINK', m)
if sec == 'more':
    p('=== MORE')
    key = os.environ.get('MARS_API_KEY', '')
    auth = {'Authorization': 'Basic ' + base64.b64encode((key + ':').encode()).decode()}
    st, h, b = get('https://marsapi.ams.usda.gov/services/v1.2/reports', headers=auth, timeout=120)
    L = json.loads(b)
    for r in L:
        t = (r.get('report_title') or '')
        if re.search(r'(?i)retail|national', t) and re.search(r'(?i)fruit|veg|produce|specialty|organic', t): p('REP', r.get('slug_id'), t, '|', r.get('published_date'))
    for sid in (2315, 2314, 2316, 1662):
        st, h, b = get('https://marsapi.ams.usda.gov/services/v1.2/reports/%d' % sid, headers=auth, timeout=120)
        p('REPORT', sid, st, len(b)); p(b[:1800].decode('utf8', 'ignore').replace('\n', ' '))
    st, h, b = head('https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata', data=json.dumps([{'productId': 32100364}]).encode(), headers={'Content-Type': 'application/json'})
    p(b[:600].decode('utf8', 'ignore'))
    for u in ['https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210036401', 'https://www.statcan.gc.ca/en/terms-conditions/open-licence', 'https://open.canada.ca/en/open-government-licence-canada']:
        st, h, b = head(u); p(re.sub(r'\s+', ' ', b[:600].decode('utf8', 'ignore')))
    st, h, b = get('https://www.argentina.gob.ar/superintendencia-de-seguros/estadisticas'); t = b.decode('utf8', 'ignore')
    for m in re.findall(r'href="([^"]+)"[^>]*>([^<]{3,120})<', t):
        if re.search(r'(?i)agro|seguro|estad|riesgo|forest', m[0] + m[1]): p('  A', m[0], '|', m[1].strip())
if sec == 'third':
    p('=== THIRD')
    key = os.environ.get('MARS_API_KEY', '')
    auth = {'Authorization': 'Basic ' + base64.b64encode((key + ':').encode()).decode()}
    for sid in (2314, 2315, 2316):
        st, h, b = get('https://marsapi.ams.usda.gov/services/v1.2/reports/%d?q=report_begin_date=10/21/2026&allSections=true' % sid, headers=auth, timeout=120)
        p('REPORT', sid, st, len(b))
        try:
            d = json.loads(b); 
            for sec_ in (d if isinstance(d, list) else [d]):
                p(' section', sec_.get('reportSection'), sec_.get('stats'))
                rs = sec_.get('results') or []
                for r in rs[:6]: p('  ', json.dumps(r)[:700])
        except Exception as e: p('ERR', e, b[:300])
    for u in ['https://www150.statcan.gc.ca/t1/wds/rest/getAllCubesListLite', 'https://www150.statcan.gc.ca/n1/en/type/data']:
        st, h, b = head(u); p(re.sub(r'\s+', ' ', b[:200].decode('utf8', 'ignore')))
    for u in ['https://www.argentina.gob.ar/superintendencia-de-seguros/mercado-asegurador', 'https://www.argentina.gob.ar/superintendencia-de-seguros/estadisticas/informes']:
        st, h, b = get(u); t = b.decode('utf8', 'ignore'); p(u, st, len(t))
        for m in re.findall(r'href="([^"]+)"[^>]*>([^<]{3,140})<', t):
            if re.search(r'(?i)agro|forest|riesgos|xls|estadist|seguros-', m[0] + m[1]): p('  A', m[0], '|', m[1].strip())
os.makedirs('probe/out', exist_ok=True)
open('probe/out/%s.txt' % sec, 'w').write('\n'.join(OUT))

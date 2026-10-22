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
if sec == 'keys':
    key = os.environ.get('MARS_API_KEY', '')
    auth = {'Authorization': 'Basic ' + base64.b64encode((key + ':').encode()).decode()}
    for sid in (2314, 2315, 2316, 2390, 2412):
        st, h, b = get('https://marsapi.ams.usda.gov/services/v1.2/reports/%d?q=report_begin_date=10/21/2026&allSections=true' % sid, headers=auth, timeout=120)
        try:
            d = json.loads(b)
            for sec_ in (d if isinstance(d, list) else [d]):
                rs = sec_.get('results') or []
                if sec_.get('reportSection') == 'Report Details' and rs:
                    p('REPORT', sid, 'rows', len(rs)); p(' KEYS', json.dumps(rs[0]))
                    import collections
                    for k in ('commodity',): p(' commodities', sorted(collections.Counter(r.get(k) for r in rs).items(), key=lambda x: -x[1])[:80])
                    p(' packages', sorted(set(r.get('package') for r in rs))[:40])
        except Exception as e: p('ERR', sid, e, b[:200])
if sec == 'ckan':
    for u in ['https://open.canada.ca/data/api/action/package_search?q=fruit+vegetable+prices&rows=20', 'https://open.canada.ca/data/api/action/package_search?q=horticulture+wholesale+prices&rows=10', 'https://datos.gob.ar/api/3/action/package_search?q=seguros+agropecuarios&rows=10', 'https://datos.gob.ar/api/3/action/package_search?q=superintendencia+de+seguros&rows=10']:
        st, h, b = head(u, timeout=90)
        try:
            d = json.loads(b)
            for r in d['result']['results']:
                p('DS', r.get('id'), '|', (r.get('title') or r.get('title_translated', {}).get('en') or '')[:100] if isinstance(r.get('title'), str) or r.get('title') is None else str(r.get('title'))[:100], '|', r.get('license_title') or r.get('license_id'), '|', r.get('metadata_modified'))
                for x in (r.get('resources') or [])[:4]: p('    RES', (x.get('format') or ''), x.get('url'), '|', str(x.get('name'))[:70])
        except Exception as e: p('ERR', e, b[:200])
    for u in ['https://www150.statcan.gc.ca/t1/wds/rest/getAllCubesListLite', 'https://www150.statcan.gc.ca/n1/en/catalogue/32100364']:
        st, h, b = head(u); p(re.sub(r'\s+', ' ', b[:160].decode('utf8', 'ignore')))
if sec == 'aafc':
    for u in ['https://od-do.agr.gc.ca/WeeklyWholesalePrices_PrixDeGrossistesHebdomadaires55.csv', 'https://od-do.agr.gc.ca/DailyWholesalePrices_PrixDeGrossistesQuotidiens.csv']:
        st, h, b = head(u, timeout=120)
        t = b.decode('utf-8', 'ignore').splitlines()
        p('LINES', len(t), 'LAST-MODIFIED', h.get('Last-Modified'))
        for l in t[:8]: p('  ', l[:300])
        p('  ...'); 
        for l in t[-3:]: p('  ', l[:300])
    st, h, b = head('https://od-do.agr.gc.ca/WeeklyWholesalePrices_PrixDeGrossistesHebdomadaires.csv', timeout=180)
    t = b.decode('utf-8', 'ignore').splitlines(); p('FULL LINES', len(t), t[0][:300] if t else '', t[1][:300] if len(t) > 1 else '')
    rows = [l.split(',') for l in t[1:]]
    p('SAMPLE LAST', t[-1][:300])
    for u in ['https://open.canada.ca/data/api/action/package_show?id=b52424ca-ebb8-4847-808e-d525120b55df', 'https://open.canada.ca/data/api/action/package_show?id=920bc8e2-de26-4bf6-ac41-ed47962d0ff6']:
        st, h, b = head(u, timeout=90)
        try:
            r = json.loads(b)['result']; p('LIC', r.get('license_title'), '|', r.get('frequency') if 'frequency' in r else '', '|', str(r.get('notes') or r.get('notes_translated'))[:700])
        except Exception as e: p('ERR', e)
    for q in ['agropecuario', 'cosecha', 'siniestros', 'primas', 'seguros ramo']:
        st, h, b = head('https://datos.gob.ar/api/3/action/package_search?q=%s&rows=10' % q, timeout=90)
        try:
            for r in json.loads(b)['result']['results']:
                if re.search(r'(?i)segur|ssn', json.dumps(r)[:3000]): p('DS', r.get('id'), '|', str(r.get('title'))[:100], '|', r.get('license_title') or r.get('license_id'), '|', r.get('organization', {}).get('title') if r.get('organization') else '')
        except Exception as e: p('ERR', e)
    for q in ['seguros', 'produccion']:
        st, h, b = head('https://datosabiertos.ssn.gob.ar/api/3/action/package_search?q=%s&rows=40' % q, timeout=90)
        try:
            for r in json.loads(b)['result']['results']:
                p('SSN', r.get('id'), '|', str(r.get('title'))[:100], '|', r.get('license_id'), '|', [x.get('url') for x in r.get('resources', [])][:2])
        except Exception as e: p('ERR', e, b[:150])
if sec == 'aafc2':
    import csv, io, collections
    st, h, b = head('https://od-do.agr.gc.ca/WeeklyWholesalePrices_PrixDeGrossistesHebdomadaires55.csv', timeout=120)
    rd = csv.DictReader(io.StringIO(b.decode('utf-8-sig', 'ignore')))
    R = list(rd); p('HEADER', list(R[0].keys()))
    last = max(r['Date'] for r in R); p('LAST', last, 'rows', len(R))
    C = collections.Counter(r['CmdtyEn_PrdtAn'] for r in R); p('COMMODITIES', len(C))
    p(' | '.join('%s:%d' % kv for kv in sorted(C.items())))
    p('CENTRES', collections.Counter(r['CentreEn_CentreAn'] for r in R).most_common())
    p('CENTRES last wk', collections.Counter(r['CentreEn_CentreAn'] for r in R if r['Date'] == last).most_common())
    p('DATES last 6', sorted(set(r['Date'] for r in R))[-6:])
    p('CNTR', collections.Counter(r['Cntry_Pays'] for r in R).most_common(8))
    p('PKGUNITS', collections.Counter((r['PkgWtUnitEn_PqtPoidsUniteAn'] if 'PkgWtUnitEn_PqtPoidsUniteAn' in r else '') for r in R).most_common(8))
    ex = [r for r in R if r['Date'] == last and r['CentreEn_CentreAn'] == 'Wholesale-Toronto' and r['CmdtyEn_PrdtAn'] in ('Potatoes', 'Apples', 'Tomatoes')]
    for r in ex[:8]: p('EX', json.dumps(r, ensure_ascii=False)[:600])
if sec == 'ssn':
    B = 'https://datosabiertos.ssn.gob.ar/dataset/'
    for u in [B + 'aff081fd-65fc-45b9-99cc-fd67e25e9848/resource/d5ea6e2a-0e86-40df-b31e-92c7ed4006ad/download/indicadores-mercado-asegurador-actualizado.csv', B + 'd4c669c5-4962-43c4-9f78-9b4e9298c559/resource/637bc6e4-4a8a-453b-b85c-cb52e5c475c1/download/resultado_tecnico.csv']:
        st, h, b = head(u, timeout=120)
        t = b.decode('utf-8', 'ignore').splitlines(); p('LINES', len(t))
        for l in t[:4]: p('  ', l[:400])
        ag = [l for l in t if re.search(r'(?i)agro|granizo|cosecha|rural|ganad', l)]
        p('AGRO LINES', len(ag))
        for l in ag[:8]: p('  A', l[:400])
    st, h, b = head('https://datosabiertos.ssn.gob.ar/api/3/action/package_show?id=aff081fd-65fc-45b9-99cc-fd67e25e9848', timeout=60)
    try: r = json.loads(b)['result']; p('NOTES', str(r.get('notes'))[:800], '| LIC', r.get('license_id'))
    except Exception as e: p('ERR', e)
if sec == 'fvsa':
    def ck(base, q, rows=15):
        st, h, b = head('%s/api/3/action/package_search?q=%s&rows=%d' % (base, q, rows), timeout=90)
        try:
            for r in json.loads(b)['result']['results']:
                p('DS', r.get('id'), '|', str(r.get('title'))[:110], '|', r.get('license_id') or r.get('license_title'), '|', (r.get('organization') or {}).get('title'), '|', r.get('metadata_modified'))
                for x in (r.get('resources') or [])[:5]: p('    RES', x.get('format'), x.get('url'), '|', str(x.get('name'))[:60])
        except Exception as e: p('ERR', e, b[:150])
    for q in ['precios+frutas+hortalizas', 'precio+mayorista', 'vega+central', 'precios+consumidor+frutas']: ck('https://datos.odepa.gob.cl', q)
    for q in ['frutas+hortalizas', 'UAM+precios', 'precios+mayoristas', 'mercado+modelo']: ck('https://catalogodatos.gub.uy', q, 10)
    for q in ['mercado+central', 'frutas+hortalizas+precios', 'precios+mayoristas+frutas']: ck('https://datos.gob.ar', q, 10)
    for u in ['https://www.odepa.gob.cl/precios/frutas-y-hortalizas', 'https://www.mercadocentral.gob.ar/', 'https://www.mercadocentral.gob.ar/informaciones/precios-mayoristas', 'https://www.uam.com.uy/']:
        st, h, b = head(u, timeout=60); p(re.sub(r'\s+', ' ', b[:200].decode('utf8', 'ignore')))
if sec == 'odepa':
    import csv, io, collections
    B = 'https://datos.odepa.gob.cl/dataset/'
    for nm, u in [('MAYORISTA', B + '33f10516-acbe-4446-b633-68244b9b6b26/resource/580beca0-e87e-4dd4-9e8a-0bd92773f4a6/download/precio_mayorista_fruta-hortaliza_2026.csv'), ('CONSUMIDOR', B + 'd4646b7f-0d2e-4567-b6fa-932b1a6bb3f3/resource/9f885df4-afeb-4b75-8bab-9334f79db00f/download/precio_consumidor_2026.csv')]:
        st, h, b = head(u, timeout=180); p(nm, 'LAST-MOD', h.get('Last-Modified'))
        txt = b.decode('utf-8-sig', 'replace'); t = txt.splitlines(); p('LINES', len(t))
        for l in t[:4]: p('  ', l[:500])
        for l in t[-2:]: p('  ', l[:500])
        try:
            dl = csv.Sniffer().sniff(t[0], delimiters=',;|\t').delimiter
        except Exception: dl = ','
        R = list(csv.DictReader(io.StringIO(txt), delimiter=dl)); p('DELIM', repr(dl), 'ROWS', len(R), 'COLS', list(R[0].keys()) if R else '')
        for k in list(R[0].keys())[:20]:
            vals = collections.Counter(r[k] for r in R)
            p('COL', k, 'distinct', len(vals), list(vals.most_common(6)))

if sec == 'ukmacro':
    p('=== UKMACRO')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/'
    st, h, b = head(N + 'NM_2002_1.data.csv?geography=TYPE480&date=latest&gender=0&c_age=200&measures=20100&select=date_name,geography_name,geography_code,obs_value')
    p(b[:1500].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_2002_1.data.csv?geography=2092957699&date=2010,latest&gender=0&c_age=200&measures=20100&select=date_name,geography_name,obs_value')
    p(b[:600].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1.data.csv?geography=TYPE480&date=latest&variable=83,84,45&measures=20599&select=date_name,geography_name,variable_name,obs_value')
    p(b[:2500].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1.data.csv?geography=TYPE480&date=latest-5,latest&variable=84&measures=20599&select=date_name,geography_name,variable_name,obs_value')
    p(b[:800].decode('utf-8', 'replace'))
    st, h, b = head('https://api.beta.ons.gov.uk/v1/datasets?limit=200', timeout=90)
    try:
        for d in json.loads(b).get('items', []):
            t = (d.get('title') or '') + ' ' + (d.get('description') or '')
            if re.search(r'(?i)region|gdp|gva|earnings|nuts|itl', t): p('DS', d['id'], d.get('title'))
    except Exception as e: p('ERR', e)
    for u in ['https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductallitlregions/current/data',
              'https://www.ons.gov.uk/economy/grossdomesticproductgdp/datasets/regionalgrossdomesticproductallnutslevelregions/current/data',
              'https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/regionaleconomicactivitybygrossdomesticproductuk/1998to2023/data']:
        st, h, b = head(u, timeout=90); p(b[:1200].decode('utf-8', 'replace'))

if sec == 'ukmacro2':
    p('=== UKMACRO2')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/'
    st, h, b = head(N + 'NM_17_1.def.sdmx.json', timeout=90)
    try:
        j = json.loads(b); 
        for c in j['structure']['codelists']['codelist']:
            if c['id'] in ('CL_NM_17_1_VARIABLE', 'CL_NM_17_1_MEASURES'):
                for x in c['code'][:40]: p('CODE', c['id'], x['value'], x['description']['value'])
    except Exception as e: p('ERR', e, b[:300])
    st, h, b = head(N + 'NM_17_1.data.csv?geography=TYPE480&date=latest&variable=84&measures=20599,21001&select=date_name,geography_name,variable_name,measures_name,obs_value')
    p(b[:800].decode('utf-8', 'replace'))
    st, h, b = head('https://www.nomisweb.co.uk/api/v01/dataset/def.sdmx.json?search=*gva*', timeout=60); p(b[:900].decode('utf-8', 'replace'))
    st, h, b = head('https://www.nomisweb.co.uk/api/v01/dataset/def.sdmx.json?search=*agricult*', timeout=60); p(b[:900].decode('utf-8', 'replace'))
    for u in ['https://api.beta.ons.gov.uk/v1/datasets/regional-gdp-by-year', 'https://api.beta.ons.gov.uk/v1/datasets/regional-gdp-by-year/editions/time-series/versions/1/dimensions',
              'https://www.gov.uk/api/search.json?q=farm+structure+age+of+farmers+holders&count=10&fields=title&fields=link',
              'https://www.gov.uk/api/search.json?q=agricultural+census+age+of+farmers&count=10&fields=title&fields=link',
              'https://www.gov.uk/api/content/government/statistics/agricultural-facts-england-regional-profiles',
              'https://www.gov.uk/api/search.json?q=regional+gross+value+added+ITL1&count=8&fields=title&fields=link']:
        st, h, b = head(u, timeout=90); p(b[:1500].decode('utf-8', 'replace'))

if sec == 'ersreg':
    p('=== ERSREG')
    for u in ['https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/documentation',
              'https://www.ers.usda.gov/webdocs/publications/42298/32489_aib760_002.pdf',
              'https://www.ers.usda.gov/topics/farm-economy/farm-structure-and-organization/farm-resource-regions',
              'https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/']:
        st, h, b = head(u, timeout=90)
        t = b.decode('utf-8', 'replace')
        for m in sorted(set(re.findall(r'href="([^"]*(?:egion|county|county-to)[^"]*\.(?:xlsx?|csv|zip|pdf))"', t, re.I)))[:20]: p('LINK', m)
        p(t[:300].replace('\n', ' '))

if sec == 'uk3':
    p('=== UK3')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/'
    st, h, b = head(N + 'NM_17_1.def.sdmx.json', timeout=90); p(b[:3100].decode('utf-8', 'replace'))
    for ds in ('NM_17_1', 'NM_2002_1'):
        st, h, b = head(N + ds + '/variable.def.sdmx.json', timeout=60); p(b[:1500].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1/geography/TYPE480.def.sdmx.json', timeout=60); p(b[:600].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1.data.csv?geography=2013265921...2013265932&date=latest&variable=83&measures=20599&select=date_name,geography_name,variable_name,obs_value', timeout=60); p(b[:900].decode('utf-8', 'replace'))
    st, h, b = head('https://www.gov.uk/api/content/government/statistics/agricultural-workforce-in-england-at-1-june', timeout=90)
    try:
        j = json.loads(b)
        for a in j['details'].get('attachments', [])[:30]: p('ATT', a.get('title'), a.get('url'))
        for d in (j.get('links', {}).get('documents') or [])[:12]: p('DOC', d.get('title'), d.get('base_path'))
    except Exception as e: p('ERR', e, b[:300])
    st, h, b = head('https://www.gov.uk/api/search.json?q=agricultural+workforce+england+at+1+june&count=10&fields=title&fields=link', timeout=60); p(b[:1500].decode('utf-8', 'replace'))
    for u in ['https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/documentation', 'https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/']:
        st, h, b = head(u, timeout=90); t = b.decode('utf-8', 'replace')
        for m in sorted(set(re.findall(r'href="([^"]*)"', t))):
            if re.search(r'(?i)region|webdocs|county', m): p('HREF', m)
    st, h, b = head('https://www.ers.usda.gov/webdocs/DataFiles/Farm_Resource_Regions/Farm_Resource_Regions.xlsx', timeout=60)
    st, h, b = head('https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/documentation/', timeout=60)

if sec == 'uk4':
    import zipfile, io, subprocess
    p('=== UK4')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/'
    st, h, b = head(N + 'NM_17_1/cell.def.sdmx.json', timeout=60)
    try:
        for c in json.loads(b)['structure']['codelists']['codelist'][0]['code']:
            d = c['description']['value']
            if re.search(r'(?i)unemploy|economically active|employment rate', d): p('CELL', c['value'], d[:110])
    except Exception as e: p('ERR', e, b[:300])
    st, h, b = head('https://assets.publishing.service.gov.uk/media/6ab2606dfceb6fb3a6500fa9/Agricultural_Workforce_in_England-20260924.ods', timeout=120)
    try:
        z = zipfile.ZipFile(io.BytesIO(b)); x = z.read('content.xml').decode('utf-8')
        for m in re.finditer(r'<table:table table:name="([^"]*)"', x): p('SHEET', m.group(1))
        os.makedirs('probe/out', exist_ok=True); open('probe/out/workforce_content.xml', 'w').write(x[:0])
        for name in re.findall(r'<table:table table:name="([^"]*)"', x):
            if re.search(r'(?i)age', name):
                blk = x[x.index('<table:table table:name="%s"' % name):]; blk = blk[:blk.index('</table:table>')]
                rows = re.findall(r'<table:table-row[^>]*>(.*?)</table:table-row>', blk, re.S)[:25]
                p('== SHEET', name)
                for r in rows: p(' | '.join(re.sub(r'<[^>]+>', '', c) for c in re.findall(r'<table:table-cell[^>]*>(.*?)</table:table-cell>', r, re.S))[:230])
    except Exception as e: p('ERR ods', e)
    st, h, b = head('https://ers.usda.gov/webdocs/publications/42298/32489_aib-760_002.pdf?v=9694.8', timeout=120)
    if st == 200:
        open('/tmp/aib.pdf', 'wb').write(b)
        try:
            t = subprocess.run(['pdftotext', '-layout', '/tmp/aib.pdf', '-'], capture_output=True, text=True).stdout
            p('PDFLEN', len(t)); i = t.find('Heartland'); p(t[:0])
            for m in re.finditer(r'(?i)(county|counties) (list|by)|appendix', t): p('KW', t[max(0, m.start() - 60):m.start() + 120].replace('\n', ' '))
            open('probe/out/aib760.txt', 'w').write(t)
        except Exception as e: p('ERR pdf', e)

if sec == 'ersreg2':
    import subprocess
    p('=== ERSREG2')
    for u in ['https://www.ers.usda.gov/sites/default/files/images/reglink.xls', 'https://ers.usda.gov/sites/default/files/images/reglink.xls', 'https://www.ers.usda.gov/sites/default/files/_laserfiche/DataFiles/42298/reglink.xls']:
        st, h, b = head(u, timeout=90)
        if st == 200 and len(b) > 5000:
            os.makedirs('probe/out', exist_ok=True); open('probe/out/reglink.xls', 'wb').write(b); p('SAVED', len(b), b[:8]); break
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'xlrd'], check=False)
        import xlrd
        wb = xlrd.open_workbook('probe/out/reglink.xls')
        for sh in wb.sheets():
            p('SHEET', sh.name, sh.nrows, sh.ncols)
            for r in range(min(8, sh.nrows)): p(sh.row_values(r))
    except Exception as e: p('ERR xls', e)

if sec == 'uk5':
    p('=== UK5')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/'
    st, h, b = head(N + 'def.sdmx.json?search=*gva*', timeout=60)
    try:
        for k in json.loads(b)['structure']['keyfamilies']['keyfamily']:
            p('DS', k['id'], k['name']['value'], [a['annotationtext'] for a in k['annotations']['annotation'] if a['annotationtitle'] in ('Units', 'Mnemonic', 'LastUpdated')])
    except Exception as e: p('ERR', e)
    st, h, b = head(N + 'NM_17_1.data.csv?geography=TYPE480&cell=402720257,402719233&date=latest&measures=20100&select=date_name,geography_name,cell_name,obs_value', timeout=60); p(b[:1500].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1.data.csv?geography=2013265921&cell=402720257&date=latest-12,latest-8,latest-4,latest&measures=20100&select=date_name,geography_name,obs_value', timeout=60); p(b[:600].decode('utf-8', 'replace'))
    st, h, b = head(N + 'NM_17_1/date.def.sdmx.json', timeout=60); p(b[-700:].decode('utf-8', 'replace'))

if sec == 'uk6':
    p('=== UK6')
    N = 'https://www.nomisweb.co.uk/api/v01/dataset/NM_2400_1'
    st, h, b = head(N + '.def.sdmx.json', timeout=60)
    try:
        j = json.loads(b); kf = j['structure']['keyfamilies']['keyfamily'][0]
        p('DIMS', [d['conceptref'] for d in kf['components']['dimension']])
    except Exception as e: p('ERR', e)
    for dim in ('geography', 'industry', 'measures'):
        st, h, b = head(N + '/' + dim + '.def.sdmx.json?search=*' + ('region*' if dim == 'geography' else '*'), timeout=60); p(b[:900].decode('utf-8', 'replace'))
    st, h, b = head(N + '.data.csv?geography=TYPE480&date=latest&measures=20100&select=date_name,geography_name,geography_code,industry_name,obs_value', timeout=60); p(b[:900].decode('utf-8', 'replace'))
    st, h, b = head(N + '.data.csv?geography=2013265921&date=latest&select=date_name,geography_name,geography_code,measures_name,industry_name,obs_value', timeout=60); p(b[:900].decode('utf-8', 'replace'))

if sec == 'wds':
    W = 'https://www150.statcan.gc.ca/t1/wds/rest/'
    body = json.dumps([{"productId": 32100077}]).encode()
    for nm, ua in (('script', 'Dehesa-Index-data-bot/1.0'), ('moz', UA['User-Agent']), ('curl', 'curl/8.5.0'), ('py', 'Python-urllib/3.12')):
        for acc in ('application/json', '*/*'):
            st, h, b = get(W + 'getCubeMetadata', headers={'User-Agent': ua, 'Content-Type': 'application/json', 'Accept': acc}, data=body, tries=1)
            p('META', nm, acc, st, h.get('Content-Type'), b[:120])
    for nm, ua in (('script', 'Dehesa-Index-data-bot/1.0'), ('moz', UA['User-Agent'])):
        st, h, b = get(W + 'getFullTableDownloadCSV/32100077/en', headers={'User-Agent': ua, 'Accept': 'application/json'}, tries=1); p('CSVINFO', nm, st, b[:200])
    st, h, b = get('https://www150.statcan.gc.ca/n1/tbl/csv/32100077-eng.zip', timeout=200, tries=1); p('DIRECTZIP', st, h.get('Content-Type'), len(b), b[:60])
    st, h, b = get('https://www150.statcan.gc.ca/t1/tbl1/en/dtl!downloadDbLoadingData-nonTraduit.action?pid=3210007701&latestN=0&startDate=&endDate=&csvLocale=en&selectedMembers=%5B%5B%5D%5D', timeout=100, tries=1); p('DLACTION', st, h.get('Content-Type'), len(b), b[:80])
os.makedirs('probe/out', exist_ok=True)
open('probe/out/%s.txt' % sec, 'w').write('\n'.join(OUT))

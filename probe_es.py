import re, subprocess, json, urllib.request, urllib.parse, base64
from pathlib import Path
O = Path('probe_es4'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
def req(u, data=None, headers=None, t=120, binary=False):
    h = dict(UA); h.update(headers or {})
    try:
        r = urllib.request.Request(u, data=data, headers=h)
        with urllib.request.urlopen(r, timeout=t) as x:
            b = x.read(); return b if binary else b.decode('utf8', 'replace')
    except Exception as e:
        return None if binary else 'ERR %s' % e
S = 'https://www.mapa.gob.es'
B = S + '/dam/mapa/contenido/agricultura/temas/producciones-agricolas/cultivos-herbaceos/oleaginosas-y-leguminosas/balances-de-gestion-de-oleaginosas/'
names = ['balancesoleaginosases_2016_17', 'balancesoleaginosases_2017_18', 'balancesoleaginosases_2018_19', 'balancesoleaginosases_2019_20', '1-balances-oleaginosas-es_2020_21', '1-balances-oleaginosas-es_2021_22', '1-balances-oleaginosas-es_2022_23', '1-balances-oleaginosas-es_2023_24', '1-balances-oleaginosas-es_2024_25', '1-balances-oleaginosas-es_2025_26']
for n in names:
    b = req(B + n + '.pdf', binary=True)
    if b:
        f = O / (n + '.pdf'); f.write_bytes(b)
        subprocess.run(['pdftotext', '-layout', str(f), str(f) + '.txt'])
    else: (O / (n + '.err')).write_text('fallo')
# Eurostat
E = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
chk = {}
for ds, q in (('apri_pi20_outq', 'geo=ES&unit=I20&p_adj=NI&am_item=AM021100&am_item=AM021300&am_item=AM021200&am_item=AM021000&lastTimePeriod=2'),
              ('apri_pi20_outa', 'geo=ES&unit=I20&p_adj=NI&am_item=AM021100&am_item=AM021300&lastTimePeriod=3'),
              ('prc_hicp_minr', 'geo=ES&unit=I25&coicop18=CP01152&coicop18=CP01145&coicop18=CP01148&coicop18=CP011513&lastTimePeriod=3'),
              ('prc_hicp_midx', 'geo=ES&unit=I15&coicop=CP01151&coicop=CP01145&coicop=CP01147&lastTimePeriod=3'),
              ('prc_hicp_midx', 'geo=ES&unit=I15&coicop=CP01145&sinceTimePeriod=2024-01')):
    r = req(E + ds + '?format=JSON&lang=EN&' + q) or ''
    chk[ds + '?' + q] = r[:6000]
(O / 'eurostat.json').write_text(json.dumps(chk, ensure_ascii=False, indent=1))
# Power BI
key = 'eyJrIjoiOGVhODFiNWMtOTE0Zi00NjI2LWJhMjktMDU2YzgyMTFlNTcxIiwidCI6Ijk1MjIxYzAzLTRlYmYtNGViNS04Zjc4LTUzODA3MTAwMDRiYyIsImMiOjl9'
kj = json.loads(base64.b64decode(key + '=='))
host = 'https://wabi-west-europe-d-primary-api.analysis.windows.net'
H = {'X-PowerBI-ResourceKey': kj['k'], 'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'}
m = req(host + '/public/reports/' + kj['k'] + '/modelsAndExploration?preferReadOnlySession=true', headers=H)
(O / 'models.json').write_text(m or '')
try: mj = json.loads(m)
except Exception as e: mj = None; (O / 'models.err').write_text(str(e))
if mj:
    mid = mj['models'][0]['id']; db = mj['models'][0]['dbName']
    sc = req(host + '/public/reports/conceptualschema', data=json.dumps({'modelIds': [mid], 'userPreferredLocale': 'es-ES'}).encode(), headers=H)
    (O / 'schema.json').write_text(sc or '')
    try:
        sj = json.loads(sc); ents = sj['schemas'][0]['schema']['Entities']
    except Exception as e:
        ents = []; (O / 'schema.err').write_text(str(e))
    for e in ents:
        cols = [p for p in e.get('Properties', []) if 'Column' in p][:12]
        if not cols: continue
        sel = [{'Column': {'Expression': {'SourceRef': {'Source': 't'}}, 'Property': p['Name']}, 'Name': e['Name'] + '.' + p['Name']} for p in cols]
        cmd = {'SemanticQueryDataShapeCommand': {'Query': {'Version': 2, 'From': [{'Name': 't', 'Entity': e['Name'], 'Type': 0}], 'Select': sel}, 'Binding': {'Primary': {'Groupings': [{'Projections': list(range(len(sel)))}]}, 'DataReduction': {'DataVolume': 3, 'Primary': {'Top': {'Count': 300}}}, 'Version': 1}, 'ExecutionMetricsKind': 1}}
        body = {'version': '1.0.0', 'queries': [{'Query': {'Commands': [cmd]}, 'QueryId': '', 'ApplicationContext': {'DatasetId': db, 'Sources': []}}], 'cancelQueries': [], 'modelId': mid}
        r = req(host + '/public/reports/querydata?synchronous=true', data=json.dumps(body).encode(), headers=H)
        (O / ('q_' + re.sub(r'\W', '_', e['Name'])[:40] + '.json')).write_text((r or '')[:150000])
print('ok')

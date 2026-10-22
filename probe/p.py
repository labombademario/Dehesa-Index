import os, re, urllib.request, json
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 DehesaIndex/1.0 (+https://dehesaindex.com)'}
def get(u, n=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: b = r.read(); p('GET', u, r.status, r.headers.get('Content-Type'), len(b)); return b
    except Exception as e: p('ERR', u, e); return b''
for reg in ['UK', 'England', 'Wales', 'Scotland', 'Northern_Ireland', 'England_SE_and_central_S', 'East_Anglia']:
    for v in ['Rainfall', 'Tmean']:
        b = get('https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/%s/date/%s.txt' % (v, reg))
        t = b.decode('utf8', 'ignore'); L = t.splitlines()
        if L: p('\n'.join(L[:8])); p('...'); p('\n'.join(L[-3:]))
b = get('https://www.metoffice.gov.uk/climate/uk/summaries/datasets'); t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', b.decode('utf8', 'ignore')))
for m in re.finditer(r'(?i)(licen[cs]e|open government|copyright|terms)', t): p('CTX', t[max(0, m.start() - 200): m.start() + 250])
for m in re.findall(r'href="([^"]*datasets[^"]*\.txt)"', b.decode('utf8', 'ignore'))[:10]: p('LINK', m)
b = get('https://www.metoffice.gov.uk/hadobs/hadukp/data/monthly/HadEWP_monthly_totals.txt'); p(b[:400].decode('utf8', 'ignore'))
b = get('https://data-melbournewater.opendata.arcgis.com/api/download/v1/items/7db00ccb52134f53991257edfe37cade/csv?layers=0')
L = b.decode('utf8', 'ignore').splitlines(); p('MW rows', len(L)); p('\n'.join(L[:6])); p('\n'.join(L[-4:]))
b = get('https://services5.arcgis.com/ZSYwjtv8RKVhkXIL/arcgis/rest/services/MWC_Daily_StorageVolume_CompleteRecord/FeatureServer/0/query?where=1%3D1&outFields=*&orderByFields=OBJECTID+DESC&resultRecordCount=5&f=json')
p(b[:1500].decode('utf8', 'ignore'))
b = get('https://services5.arcgis.com/ZSYwjtv8RKVhkXIL/arcgis/rest/services/MWC_Daily_StorageVolume_CompleteRecord/FeatureServer/0?f=json'); p(b[:1500].decode('utf8', 'ignore'))
os.makedirs('probe/out', exist_ok=True); open('probe/out/clima.txt', 'w').write('\n'.join(OUT))

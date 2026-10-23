import urllib.request, re, io, json, traceback
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p4.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=90):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t); return r.status,r.headers.get('content-type'),r.read()
def tryu(name,u,show=600):
    try:
        s,ct,b=get(u); w('## %s %s %s len=%d'%(name,s,ct,len(b))); return b
    except Exception as e: w('## %s ERR %r'%(name,e)); return None
# Valet BCPI
b=tryu('valet-groups','https://www.bankofcanada.ca/valet/groups/json')
if b:
    g=json.loads(b)['groups']; w('groups with BCPI/AGRI: '+', '.join(k for k in g if 'BCPI' in k.upper() or 'COMMOD' in k.upper()))
for grp in ('BCPI_MONTHLY','BCPI_WEEKLY'):
    b=tryu(grp,'https://www.bankofcanada.ca/valet/observations/group/%s/json?recent=2'%grp)
    if b:
        j=json.loads(b); w('series: '+'; '.join('%s=%s'%(k,v.get('label')) for k,v in j['seriesDetail'].items())[:1800]); w('obs: '+json.dumps(j['observations'])[:500])
# Manitoba xlsx
for n,u in (('mb-weekly','https://gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/pubs/manitoba-markets-crops-prices-weekly.xlsx'),('mb-monthly','https://gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/pubs/manitoba-markets-crops-prices-monthly.xlsx')):
    b=tryu(n,u)
    if b:
        try:
            import openpyxl; wb=openpyxl.load_workbook(io.BytesIO(b),read_only=True,data_only=True)
            for ws in wb.worksheets[:6]:
                w(' sheet %s'%ws.title); 
                for i,r in enumerate(ws.iter_rows(values_only=True)):
                    if i<6 or i>=ws.max_row-2: w('   %s'%[str(c)[:18] for c in r[:12]])
                    if i>=8 and i<ws.max_row-3: continue
        except Exception as e: w(' xlsx ERR %r'%e)
# Alberta farm input prices page
b=tryu('ab-inputs','https://open.alberta.ca/publications/0704-917x')
if b:
    t=b.decode('utf-8','replace'); w(' links: '+' | '.join(sorted(set(re.findall(r'href="([^"]*(?:farm-input|monthly-farm)[^"]*)"',t)))[:12])); w(' lic: '+' | '.join(re.findall(r'[^<>]{0,80}(?:licen[cs]e|Licence)[^<>]{0,80}',t)[:5]))
# Ontario OMAFA datasets
b=tryu('ontario-org','https://data.ontario.ca/en/organization/agriculture-food-and-rural-affairs')
if b:
    t=b.decode('utf-8','replace'); w(' datasets: '+' | '.join(sorted(set(re.findall(r'/dataset/([a-z0-9-]+)',t)))[:60]))
# StatCan WDS reachability + key tables metadata
for tbl in ('16100017','18100004','32100107','18100265'):
    try:
        req=urllib.request.Request('https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata',data=json.dumps([{'productId':int(tbl)}]).encode(),headers=dict(UA,**{'Content-Type':'application/json'}))
        j=json.loads(urllib.request.urlopen(req,timeout=90).read()); o=j[0]['object']
        w('## WDS %s %s | %s -> %s | freq %s | dims %s'%(tbl,o.get('cubeTitleEn','')[:90],o.get('cubeStartDate'),o.get('cubeEndDate'),o.get('frequencyCode'),[d['dimensionNameEn'] for d in o['dimension']]))
    except Exception as e: w('## WDS %s ERR %r'%(tbl,e))

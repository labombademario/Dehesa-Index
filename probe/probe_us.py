import urllib.request, urllib.parse, json, os, re, collections
LOG=[]
def log(*a):
    LOG.append(' '.join(str(x) for x in a)); open('probe/probe-log.txt','w').write('\n'.join(LOG)+'\n')
def get(u, t=60):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (dehesaindex probe)','Accept':'*/*'}),timeout=t)
        return r.status, r.headers.get('content-type'), r.read()
    except Exception as e:
        return 'ERR', repr(e)[:160], b''
def show(u, n=500):
    s,ct,b=get(u); log('GET',u[:150],s,ct,len(b))
    if b: log('   ',re.sub(r'\s+',' ',b[:n].decode('utf8','replace')))
    return s,b
KEY=os.environ.get('NASS_API_KEY','')
BASE='https://quickstats.nass.usda.gov/api/api_GET/?key='+KEY+'&format=JSON&'
CANDS=[('ALMONDS','NATIONAL'),('PECANS','NATIONAL'),('WALNUTS','NATIONAL'),('PISTACHIOS','NATIONAL'),('ORANGES','NATIONAL'),('GRAPEFRUIT','NATIONAL'),('LEMONS','NATIONAL'),('APPLES','NATIONAL'),('PEACHES','NATIONAL'),('STRAWBERRIES','NATIONAL'),('BLUEBERRIES','NATIONAL'),('CRANBERRIES','NATIONAL'),('TOMATOES','NATIONAL'),('ONIONS','NATIONAL'),('LETTUCE','NATIONAL'),('HONEY','NATIONAL'),('TOBACCO','NATIONAL'),('BEANS','NATIONAL'),('LENTILS','NATIONAL'),('PEAS','NATIONAL'),('SUNFLOWER','NATIONAL'),('GOATS','NATIONAL'),('WOOL','NATIONAL'),('MOHAIR','NATIONAL'),('MUSHROOMS','NATIONAL'),('CATFISH','NATIONAL'),('TROUT','NATIONAL'),('TURKEYS','NATIONAL'),('BROILERS','NATIONAL'),('LABOR','NATIONAL'),('LABOR','REGION : MULTI-STATE'),('HEMP','NATIONAL'),('ORGANIC','NATIONAL')]
for c,lvl in CANDS:
    q=BASE+urllib.parse.urlencode({'commodity_desc':c,'agg_level_desc':lvl,'year__GE':'2023','source_desc':'SURVEY'})
    s,ct,b=get(q,90)
    try:
        j=json.loads(b)['data']
        agg=collections.OrderedDict()
        for r in j:
            k=(r['short_desc'][:80],r['freq_desc'])
            a=agg.setdefault(k,[0,'0'])
            a[0]+=1; a[1]=max(a[1],str(r['year'])+':'+r['reference_period_desc'][:8])
        log('NASS',c,lvl,s,'rows',len(j),'distinct',len(agg))
        for k,v in list(agg.items())[:14]: log('    ',k,v)
    except Exception as e:
        log('NASS',c,lvl,s,ct,b[:150])

s,b=show('https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/commercial-backyard-flocks',200)
t=b.decode('utf8','replace')
for m in re.finditer(r'<table.*?</table>',t,re.S):
    log('  APHIS-HPAI table',len(m.group(0)), re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',m.group(0)))[:700])
for m in re.finditer(r'href="([^"]+\.(?:csv|xlsx|json))"',t): log('  APHIS-link',m.group(1))
s,b=show('https://www.aphis.usda.gov/livestock-poultry-disease/cattle/ticks/screwworm',100)
t=b.decode('utf8','replace')
for m in re.finditer(r'<table.*?</table>',t,re.S):
    log('  APHIS-NWS table',len(m.group(0)), re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',m.group(0)))[:700])
for m in re.finditer(r'href="([^"]+\.(?:csv|xlsx|json))"',t): log('  NWS-link',m.group(1))
show('https://www.federalregister.gov/api/v1/documents.json?per_page=5&order=newest&conditions[term]=%22adverse+effect+wage+rates%22&conditions[type][]=NOTICE',900)
show('https://www.dol.gov/agencies/eta/foreign-labor/programs/h-2a',200)
s,b=show('https://www.kansascityfed.org/agriculture/ag-credit-survey/',100)
t=b.decode('utf8','replace')
for m in re.finditer(r'href="([^"]+\.(?:csv|xlsx|xls|pdf))"',t): log('  KC-link',m.group(1))
show('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/avg_interest_rates?page[size]=2',300)
show('https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-us-and-state-level-farm-income-and-wealth-statistics',200)
log('done')

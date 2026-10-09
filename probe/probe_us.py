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
            a[0]+=1; a[1]=max(a[1],r['year']+':'+r['reference_period_desc'][:8])
        log('NASS',c,lvl,s,'rows',len(j),'distinct',len(agg))
        for k,v in list(agg.items())[:14]: log('    ',k,v)
    except Exception as e:
        log('NASS',c,lvl,s,ct,b[:150])
show('https://flag.dol.gov/wage-data/aewr',400)
show('https://www.dol.gov/agencies/eta/foreign-labor/performance',200)
show('https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series/13/pcp/1/0/2024-2026.json',500)
show('https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/divisional/time-series/1301/pcp/1/0/2025-2026.json',300)
show('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations?stationTriplets=*:CO:SNTL&activeOnly=true',300)
show('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data?stationTriplets=713:CO:SNTL&elements=WTEQ&duration=DAILY&beginDate=2026-09-01&endDate=2026-10-08',300)
show('https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/commercial-backyard-flocks',600)
show('https://www.aphis.usda.gov/livestock-poultry-disease/cattle/ticks/screwworm',500)
show('https://www.aphis.usda.gov/sites/default/files/hpai-flocks.csv',200)
show('https://www.fsa.usda.gov/resources/programs/dairy-margin-coverage-program',300)
show('https://www.fsa.usda.gov/resources/farm-loans/farm-loan-interest-rates',300)
show('https://www.kansascityfed.org/agriculture/ag-credit-survey/',400)
show('https://www.chicagofed.org/research/data/agletter',300)
show('https://www.ers.usda.gov/data-products/ag-and-food-statistics-charting-the-essentials/',200)
show('https://www.nass.usda.gov/Publications/Todays_Reports/reports/',200)
show('https://www.ams.usda.gov/mnreports/',100)
log('done')

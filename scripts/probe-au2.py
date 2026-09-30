import json,re,html,urllib.request,urllib.parse,sys
def get(u,n=200000,t=60,h=None):
    try:
        r=urllib.request.Request(u,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
for q in ['commodity prices','agricultural commodity statistics','farm performance','fertiliser','exports','production','crop report','livestock']:
    u='https://data.gov.au/data/api/3/action/package_search?rows=15&q='+urllib.parse.quote(q)+'&fq=organization:abares'
    try:
        d=json.loads(get(u))
        for r in d['result']['results']:
            P('CKAN',q,'|',r['title'],'|',r.get('license_id'))
            for x in r['resources'][:6]: P('   ',x.get('format'),x.get('url'))
    except Exception as e: P('CKAN ERR',q,e)
for u in ['https://data.api.abs.gov.au/rest/data/AG_BROADACRE/all?startPeriod=2020&format=csvfilewithlabels','https://data.api.abs.gov.au/rest/data/LSTOCK_SLAUGHT/all?startPeriod=2024&format=csvfilewithlabels','https://data.api.abs.gov.au/rest/data/ITPI_EXP/all?startPeriod=2024&format=csvfilewithlabels']:
    s=get(u,4000); P('ABS',u); P(s[:1800])
s=get('https://www.mla.com.au/prices-markets/statistics/api/',400000)
txt=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S))))
P('MLA PAGE',txt[:3500])
P('MLA links',re.findall(r'href="([^"]*(?:api|swagger|terms|licen)[^"]*)"',s)[:20])
for u in ['https://api.mla.com.au/','https://api.mla.com.au/swagger/index.html','https://www.agriculture.gov.au/abares/data/weekly-commodity-price-update','https://www.agriculture.gov.au/abares/research-topics/agricultural-commodities/data']:
    P('GET',u); P(get(u,1500,90)[:900])
open('data/probe/australia2.txt','w').write('\n'.join(out))

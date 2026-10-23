import urllib.request, re, json, sys, traceback, ssl
UA={'User-Agent':'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)','Accept':'*/*'}
def get(u,t=90,raw=False):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t)
    b=r.read()
    return r.status,r.headers.get('content-type',''),b
def page(name,u):
    o=open('probe/out/%s.txt'%name,'w')
    try:
        s,ct,b=get(u); h=b.decode('utf-8','replace')
        o.write('%s\n%s %s len=%d\n'%(u,s,ct,len(b)))
        t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S)
        t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
        o.write('TEXT: '+t[:2500]+'\n')
        links=sorted(set(re.findall(r'href=["\']([^"\']+\.(?:csv|xlsx?|zip|json|txt|xml)[^"\']*)["\']',h,flags=re.I)))
        o.write('DATA LINKS (%d):\n'%len(links)+'\n'.join(links[:60])+'\n')
    except Exception as e:
        o.write('%s\nERR %r\n'%(u,e))
    o.close()
P=[
('ers_fert','https://www.ers.usda.gov/data-products/fertilizer-use-and-price'),
('ers_fooddollar','https://www.ers.usda.gov/data-products/food-dollar-series'),
('ers_foodexp','https://www.ers.usda.gov/data-products/food-expenditure-series'),
('ers_productivity','https://www.ers.usda.gov/data-products/agricultural-productivity-in-the-us'),
('ers_county','https://www.ers.usda.gov/data-products/county-level-data-sets'),
('ers_bioenergy','https://www.ers.usda.gov/data-products/us-bioenergy-statistics'),
('ers_intlprod','https://www.ers.usda.gov/data-products/international-agricultural-productivity'),
('ers_macro','https://www.ers.usda.gov/data-products/international-macroeconomic-data-set'),
('ers_excr','https://www.ers.usda.gov/data-products/agricultural-exchange-rate-data-set'),
('ers_foodsec','https://www.ers.usda.gov/data-products/international-food-security'),
('ers_pesticide','https://www.ers.usda.gov/data-products/pesticide-use-and-price'),
('ers_adjustment','https://www.ers.usda.gov/data-products/agricultural-trade-multipliers'),
('ers_foodenv','https://www.ers.usda.gov/data-products/food-environment-atlas'),
('ams_localdir','https://www.ams.usda.gov/services/local-regional/food-directories-datasets'),
('localfood_api','https://www.usdalocalfoodportal.com/fe/fdirectory_farmersmarket/?apikey=test&format=json'),
('fas_calendar','https://ipad.fas.usda.gov/rssiws/al/crop_calendar/'),
('fas_cropexplorer','https://ipad.fas.usda.gov/cropexplorer/'),
('fas_ipad','https://ipad.fas.usda.gov/'),
('cdl_release','https://www.nass.usda.gov/Research_and_Science/Cropland/Release/index.php'),
('rma_col','https://www.rma.usda.gov/tools-reports/summary-of-business/cause-of-loss'),
]
for n,u in P: page(n,u)
# CDL estadisticas (CropScape)
try:
    s,ct,b=get('https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLStat?year=2024&fips=19&format=csv',120)
    open('probe/out/cdl_stat.txt','w').write('%s %s len=%d\n%s\n'%(s,ct,len(b),b.decode('utf-8','replace')[:1500]))
except Exception as e: open('probe/out/cdl_stat.txt','w').write('ERR %r\n'%e)
# inventario oficial de datos de USDA (Project Open Data)
for n,u in (('usda_datajson','https://www.usda.gov/data.json'),('usda_datajson2','https://www.usda.gov/sites/default/files/documents/data.json')):
    try:
        s,ct,b=get(u,180)
        open('probe/out/%s.raw'%n,'wb').write(b[:200])
        j=json.loads(b.decode('utf-8','replace'))
        ds=j.get('dataset',[]) if isinstance(j,dict) else j
        L=[]
        for d in ds:
            pub=(d.get('publisher') or {}).get('name','') if isinstance(d.get('publisher'),dict) else ''
            urls=[x.get('downloadURL') or x.get('accessURL') or '' for x in d.get('distribution',[]) if isinstance(x,dict)]
            L.append('|'.join([d.get('title','')[:110],d.get('modified','')[:10],d.get('accrualPeriodicity','') or '',pub[:40],(urls[0] if urls else d.get('landingPage',''))[:150]]))
        open('probe/out/%s.txt'%n,'w').write('%s %s n=%d\n'%(s,ct,len(ds))+'\n'.join(sorted(L)))
    except Exception as e: open('probe/out/%s.txt'%n,'w').write('ERR %r\n'%e)

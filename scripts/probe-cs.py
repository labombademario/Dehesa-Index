import json,re,urllib.request,csv,io
def get(u,n=6000000,t=120,h=None):
    try:
        r=urllib.request.Request(u,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
s=get('https://opendata.cbs.nl/ODataApi/odata/85636ENG/ArableCrops?$format=json')
try:
    for x in json.loads(s)['value']: P('NLCROP',x['Key'],'|',x['Title'])
except Exception: P('NLCROP ERR',s[:200])
s=get('https://opendata.cbs.nl/ODataApi/odata/85636ENG/Regions?$format=json')
try:
    for x in json.loads(s)['value'][:6]: P('NLREG',x['Key'],'|',x['Title'])
except Exception: P('NLREG ERR',s[:200])
H={'Accept':'application/vnd.sdmx.structure+json','User-Agent':'Mozilla/5.0'}
for df in ['LSTOCK_SLAUGHT','MERCH_EXP']:
    s=get('https://data.api.abs.gov.au/rest/datastructure/ABS/%s?references=codelist'%df,h=H)
    try:
        d=json.loads(s)
        for cl in d['data']['codelists']:
            if cl['id'] in('CL_FREQ','CL_UNIT_MEASURE'): continue
            P('CL',df,cl['id'],len(cl['codes']))
            lim=60 if 'SITC' not in cl['id'] else 400
            for c in cl['codes'][:lim]:
                if 'SITC' in cl['id'] and not re.match(r'^(0|04|041|042|043|044|045|046|047|048|01|011|012|022|023|024|034|2|22|26|268|29)',c['id']): continue
                P('   ',c['id'],'|',c['name'][:90])
    except Exception as e: P('ABS ERR',df,s[:200])
s=get('https://data.api.abs.gov.au/rest/data/LSTOCK_SLAUGHT/all?startPeriod=2025&format=csvfilewithlabels&detail=dataonly',n=300000)
P('SLAUGHT header',s[:400])
open('data/probe/cs.txt','w').write('\n'.join(out))

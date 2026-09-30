import os, re, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u,t=170):
    req=urllib.request.Request(u,headers={'User-Agent':'DehesaIndex'})
    with urllib.request.urlopen(req,timeout=t) as r: return json.load(r)
out=[]
try:
    L=get('https://www150.statcan.gc.ca/t1/wds/rest/getAllCubesListLite')
    out.append('cubes %d'%len(L))
    kw=re.compile(r'farm|crop|cattle|hog|pig|milk|dairy|grain|meat|poultry|egg|fertili|wheat|canola|oilseed|pulse|sheep|livestock|agricult|slaughter|cash receipts|land|manure|honey|maple|greenhouse|fruit|vegetable|potato|stocks|food|feed|input price|agri-food|organic|cereal|barley|corn|soybean|beef|pork|red meat|flax|lentil|pea',re.I)
    rows=[]
    for c in L:
        t=c.get('cubeTitleEn','')
        pid=str(c['productId'])
        if (pid.startswith('32') or pid.startswith('18100') or pid.startswith('12100') or pid.startswith('98') or pid.startswith('16100') or pid.startswith('36100') or pid.startswith('24100')) and kw.search(t) and not c.get('archived') in (1,'1',True):
            rows.append('%s | %s | %s..%s | freq %s'%(pid,t[:150],c.get('cubeStartDate','')[:7],c.get('cubeEndDate','')[:7],c.get('frequencyCode')))
    out+=sorted(rows)
except Exception as e: out.append('ERR %s'%e)
open('data/probe/ca1.txt','w').write('\n'.join(out))

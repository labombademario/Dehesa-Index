import json,re,urllib.request,urllib.parse
def get(u,n=3000000,t=90,data=None,h=None):
    try:
        r=urllib.request.Request(u,data=data,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
s=get('https://api.statbank.dk/v1/tables?lang=en&format=JSON')
try:
    d=json.loads(s); P('DST tables',len(d))
    for r in d:
        if re.search(r'agricult|crop|cereal|wheat|barley|rape|cattle|pig|milk|dairy|fertili|slaughter|farm|livestock|holdings|meat|egg|harvest|price index for agric|export of agri',r['text'],re.I):
            P('DST',r['id'],'|',r['text'][:110],'|',r.get('firstPeriod'),r.get('latestPeriod'),r.get('variables'))
except Exception as e: P('DST ERR',s[:300])
for tid in ['7425eng','85636ENG']:
    s=get('https://opendata.cbs.nl/ODataApi/odata/%s/TableInfos?$format=json'%tid,20000); P('CBS info',tid,s[:700])
    s=get('https://opendata.cbs.nl/ODataApi/odata/%s/DataProperties?$format=json'%tid,200000)
    try:
        for x in json.loads(s)['value']:
            P('  prop',x.get('Key'),'|',x.get('Title'),'|',x.get('Unit'),'|',x.get('Type'))
    except Exception: P(s[:200])
    s=get('https://opendata.cbs.nl/ODataApi/odata/%s/TypedDataSet?$format=json&$top=3'%tid,6000); P(s[:1500])
open('data/probe/australia4.txt','w').write('\n'.join(out))

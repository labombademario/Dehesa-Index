import json,re,urllib.request
def get(u,data=None,n=3000000,t=90):
    try:
        r=urllib.request.Request(u,data=data,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Content-Type':'application/json'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
for tid in ['LPRIS10','KAPIT1','LPRIS38','ANI71','ANI41','ANI51','GOEDSALG','ANI9']:
    s=get('https://api.statbank.dk/v1/tableinfo',json.dumps({'table':tid,'format':'JSON','lang':'en'}).encode())
    try:
        d=json.loads(s); P('##',tid,d['text'],'|',d.get('updated'),'|',d.get('description','')[:150])
        for v in d['variables']:
            vals=[(x['id'],x['text']) for x in v['values']]
            P('  var',v['id'],'|',v['text'],'| n=',len(vals),'| elim',v.get('elimination'),'|',vals[:30] if v['id']!='Tid' else (vals[:2],vals[-2:]))
    except Exception as e: P('ERR',tid,s[:200])
s=get('https://api.statbank.dk/v1/data',json.dumps({'table':'LPRIS10','format':'CSV','variables':[{'code':'Tid','values':['2026M07','2026M06','2025M07']}]}).encode())
P('DATA LPRIS10'); P(s[:2500])
rows=[];u='https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$select=Identifier,Title,Period,Frequency&$filter=Language%20eq%20%27en%27'
for _ in range(20):
    try: d=json.loads(get(u))
    except Exception: break
    rows+=d['value']; u=d.get('odata.nextLink')
    if not u: break
for r in rows:
    if re.search(r'price',r['Title'],re.I) and re.search(r'agri|farm|milk|dairy|crop|livestock|cattle|pig|potato|cereal|fertil|horticult|meat|egg|poultry|land|feed',r['Title'],re.I): P('CBS',r['Identifier'],'|',r['Title'],'|',r['Period'],r['Frequency'])
open('data/probe/dk.txt','w').write('\n'.join(out))

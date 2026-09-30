import os, json, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
out=[]
def get(u, n=3000):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read()
    except Exception as e:
        return ('ERR %s'%e).encode()
for q in ['landwirtschaft','agrar','milch','preise landwirtschaft','getreide','schlachtung','düngemittel','biologisch','agrarmarkt','erzeugerpreise','rinder','schweine']:
    u='https://www.data.gv.at/api/hub/search/search?q=%s&filter=dataset&limit=15'%urllib.parse.quote(q)
    b=get(u)
    out.append('=== '+q+' '+u)
    try:
        j=json.loads(b)
        res=j.get('result',{}).get('results',[])
        for d in res:
            t=d.get('title');  t=t.get('de') if isinstance(t,dict) else t
            pub=d.get('publisher',{}); pub=pub.get('name') if isinstance(pub,dict) else pub
            out.append('- %s | %s | %s | %s'%(d.get('id'),t,pub,d.get('license') or d.get('licence')))
    except Exception as e:
        out.append(b[:500].decode('utf8','replace'))
out.append('=== STAT open data page')
out.append(get('https://www.statistik.at/en/services/tools/services/open-data')[:3000].decode('utf8','replace'))
open('data/probe/at1.txt','w').write('\n'.join(out))

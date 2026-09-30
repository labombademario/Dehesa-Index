import os, json, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
out=[]
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read()
    except Exception as e:
        return ('ERR %s'%e).encode()
for ds in ['agrar-marktdaten-erhoben-durch-die-agrarmarkt-austria','amtliche-statistiken-der-agrarmarkt-austria']:
    u='https://www.data.gv.at/api/hub/search/datasets/'+ds
    b=get(u); out.append('=== '+u)
    try:
        j=json.loads(b); r=j.get('result',j)
        out.append(json.dumps({k:r.get(k) for k in ('title','description','license','licence','modified')},ensure_ascii=False)[:1500])
        for d in r.get('distributions',[]):
            out.append('  DIST %s | %s | %s | %s'%(d.get('title'),d.get('format',{}).get('id') if isinstance(d.get('format'),dict) else d.get('format'),(d.get('access_url') or d.get('download_url')),json.dumps(d.get('licence') or d.get('license'))[:120]))
    except Exception as e:
        out.append(b[:800].decode('utf8','replace'))
for q in ['Preisindex Land- und Forstwirtschaft','Agrarpreisindex','Milcherzeugung','Schlachtungen','Viehbestand','Getreideernte','Bio Betriebe','Erzeugerpreise Getreide Schlachtvieh','Düngemittelpreise']:
    u='https://www.data.gv.at/api/hub/search/search?q=%s&filter=dataset&limit=10'%urllib.parse.quote(q)
    out.append('=== '+q)
    try:
        for d in json.loads(get(u)).get('result',{}).get('results',[]):
            t=d.get('title'); pub=d.get('publisher',{}); pub=pub.get('name') if isinstance(pub,dict) else pub
            if pub in('Statistik Austria','AMA','BMLUK'): out.append('- %s | %s | %s'%(d.get('id'),t,pub))
    except Exception as e: out.append(str(e))
for u in ['https://data.statistik.gv.at/','https://www.statistik.at/services/tools/services/open-data','https://data.statistik.gv.at/web/meta.jsp?dataset=OGD_preisind_land_forst','https://www.ama.at/marktinformationen']:
    out.append('=== '+u); out.append(get(u)[:1500].decode('utf8','replace'))
open('data/probe/at2.txt','w').write('\n'.join(out))

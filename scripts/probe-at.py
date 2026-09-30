import os, json, urllib.request, urllib.parse, re
os.makedirs('data/probe', exist_ok=True)
out=[]
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read()
    except Exception as e:
        return ('ERR %s'%e).encode()
seen={}
for q in ['Landwirtschaft','Land- und Forstwirtschaft','Agrar','Milch','Schlachtungen','Fleisch','Getreide','Ernte','Viehbestand','Tierhaltung','Betriebe land','Preise Agrar','landwirtschaftliche','Erzeugung','Biolandbau','Düngemittel','Futtermittel','Gesamtrechnung Landwirtschaft','Einkommen Landwirtschaft','Obst Gemüse','Kartoffeln','Eier','Weinbau','Holz Forst']:
    for pg in (0,1):
        u='https://www.data.gv.at/api/hub/search/search?q=%s&filter=dataset&limit=50&page=%d'%(urllib.parse.quote(q),pg)
        try:
            for d in json.loads(get(u)).get('result',{}).get('results',[]):
                pub=d.get('publisher',{}); pub=pub.get('name') if isinstance(pub,dict) else pub
                if pub in('Statistik Austria','AMA','BMLUK','Agrarmarkt Austria'):
                    t=d.get('title'); t=t.get('de') if isinstance(t,dict) else t
                    seen[d['id']]=(pub,t)
        except Exception as e: pass
for k,v in sorted(seen.items(), key=lambda x:x[1][1] or ''): out.append('%s | %s | %s'%(k,v[0],v[1]))
out.append('=== portal list')
h=get('https://data.statistik.gv.at/').decode('utf8','replace')
out.append(' '.join(re.findall(r'href="([^"]+)"',h))[:2500])
for u in ['https://marktinformation.ama.at/','https://www.ama.at/marktinformationen/']:
    out.append('=== '+u); h=get(u).decode('utf8','replace'); out.append(re.sub(r'\s+',' ',re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S))[:1500]); out.append(' '.join(re.findall(r'href="([^"]+)"',h))[:2000])
open('data/probe/at3.txt','w').write('\n'.join(out))

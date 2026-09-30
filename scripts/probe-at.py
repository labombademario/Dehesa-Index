import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
r=urllib.request.urlopen(urllib.request.Request('https://data.statistik.gv.at/web/catalog.jsp',headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=60)
h=r.read().decode('utf8','replace')
items=re.findall(r'<a href="meta\.jsp\?dataset=([A-Za-z0-9_]+)"[^>]*>(.*?)</a>',h)
seen=sorted(set(items))
open('data/probe/at9.txt','w').write('\n'.join('%s | %s'%(a,re.sub(r'\s+',' ',b)) for a,b in seen))

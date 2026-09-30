import os, re, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=40)
        return r.read().decode('utf8','replace')
    except Exception as e:
        return 'ERR %s'%e
out=[]
h=get('https://marktinformation.ama.at/')
out.append(h[:2500])
scripts=re.findall(r'src="([^"]+\.js[^"]*)"',h)
out.append('SCRIPTS %s'%scripts)
for s in scripts[:4]:
    u=urllib.parse.urljoin('https://marktinformation.ama.at/',s)
    js=get(u); out.append('=== %s len %d'%(u,len(js)))
    for m in set(re.findall(r'["\'`](/?(?:api|rest|odata|services|data)[A-Za-z0-9_/\-\.]*)["\'`]',js)): out.append('  path '+m)
    for m in set(re.findall(r'https?://[A-Za-z0-9_\./\-]+',js)): 
        if 'ama' in m or 'api' in m: out.append('  url '+m)
for u in ['https://marktinformation.ama.at/api','https://marktinformation.ama.at/swagger','https://www.gruenerbericht.at/','https://www.ama.at/marktinformationen/preise']:
    out.append('=== '+u); out.append(re.sub(r'\s+',' ',get(u))[:800])
open('data/probe/at10.txt','w').write('\n'.join(out))

import os, re, urllib.request, urllib.parse
os.makedirs('data/probe', exist_ok=True)
def get(u,n=1500):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'application/json'}),timeout=40)
        return 'OK %s '%r.status + r.read().decode('utf8','replace')[:n]
    except Exception as e:
        b=''
        try: b=e.read().decode('utf8','replace')[:300]
        except: pass
        return 'ERR %s %s'%(e,b)
out=[]
js=urllib.request.urlopen(urllib.request.Request('https://marktinformation.ama.at/main.bd57b7ed070e82d03a59.js',headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read().decode('utf8','replace')
for m in re.finditer(r'marktinformation-api\.ama\.at',js):
    out.append('CTX: '+js[max(0,m.start()-300):m.end()+500].replace('\n',' '))
for m in list(re.finditer(r'\$\{[A-Za-z_.]+\}/(?:[a-zA-Z_\-/]+)|\.get\(`?["\']?/[a-zA-Z_\-/]+',js))[:60]:
    out.append('EP: '+js[m.start():m.end()+60])
for m in list(re.finditer(r'"/(?:api/)?[a-zA-Z]+(?:/[a-zA-Z\-{}:]+)*"',js))[:0]: pass
for p in ['','/','/swagger','/swagger/index.html','/swagger/v1/swagger.json','/openapi.json','/datasets','/dataset','/produkte','/products','/markets','/categories']:
    u='https://marktinformation-api.ama.at/api'+p
    out.append('=== '+u+' -> '+get(u))
open('data/probe/at11.txt','w').write('\n'.join(out))

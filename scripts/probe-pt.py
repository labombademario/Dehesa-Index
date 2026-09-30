import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
B='https://www.ifap.pt/isip/ows/isip.data/ows'
def get(u, n=400000):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90)
        return r.read(n).decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
for t in ['culturas.2025jun10','ocupacoes.solo.2025jun10','freguesias','distritos']:
    T='isip.data:'+t
    out.append('=== '+T)
    h=get(B+'?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=%s&resultType=hits'%T)
    out.append('HITS '+' '.join(re.findall(r'number\w+="\d+"',h)))
    d=get(B+'?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=2.0.0&TYPENAMES=%s'%T)
    out.append('FIELDS '+' | '.join(a+':'+b for a,b in re.findall(r'name="(\w+)"[^>]*type="([\w:]+)"',d)))
    o=get(B+'?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=%s&count=3&outputFormat=application/json'%T)
    o=re.sub(r'"coordinates":\[[\[\]\d.,\- ]+\]','"coordinates":"..."',o)
    out.append('ONE '+o[:1500])
open('data/probe/pt8.txt','w').write('\n'.join(out))

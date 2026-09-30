import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
B='https://www.ifap.pt/isip/ows/isip.data/ows'
def get(u, n=6000):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90)
        return r.read(n*50).decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
cap=get(B+'?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0')
out.append('CAP len %d'%len(cap)); out.append(cap[:200])
names=re.findall(r'<(?:wfs:)?Name>([^<]+)</',cap)
out.append('NAMES: '+', '.join(names[:60]))
for t in names[:8]:
    out.append('=== '+t)
    out.append('HITS '+get(B+'?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=%s&resultType=hits'%t)[:400])
    out.append('DESC '+get(B+'?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=2.0.0&TYPENAMES=%s'%t)[:1800])
    out.append('ONE '+get(B+'?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=%s&count=1&outputFormat=application/json'%t)[:1500])
open('data/probe/pt7.txt','w').write('\n'.join(out))

import os, re, urllib.request
os.makedirs('data/probe', exist_ok=True)
B='https://www.ifap.pt/isip/ows/isip.data/ows'
def get(u, n=600000, raw=False):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90)
        d=r.read(n)
        return (r.headers.get('Content-Type'),len(d),r.headers.get('Access-Control-Allow-Origin')) if raw else d.decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
c=get(B+'?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0')
out.append('WMS cap len %d'%len(c))
for m in re.finditer(r'<Layer[^>]*>\s*<Name>([^<]+)</Name>\s*<Title>([^<]*)</Title>',c): out.append('LAYER %s | %s'%m.groups())
out.append('CRS '+' '.join(sorted(set(re.findall(r'<CRS>([^<]+)</CRS>',c)))[:30]))
out.append('SCALE '+' '.join(re.findall(r'<(?:Min|Max)ScaleDenominator>([^<]+)<',c)[:10]))
for L in ['isip.data:culturas.2025jun10','isip.data:ocupacoes.solo.2025jun10']:
    u=B+'?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=%s&STYLES=&CRS=EPSG:3857&BBOX=-1000000,4800000,-900000,4900000&WIDTH=512&HEIGHT=512&FORMAT=image/png&TRANSPARENT=true'%L
    out.append('GETMAP %s %s'%(L,get(u,raw=True)))
    u2=u.replace('-1000000,4800000,-900000,4900000','-1000000,4600000,-200000,5400000')
    out.append('GETMAP wide %s'%(get(u2,raw=True),))
open('data/probe/pt9.txt','w').write('\n'.join(out))

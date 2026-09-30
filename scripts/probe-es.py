import json,re,urllib.request,urllib.parse,html
def get(u,n=400000,t=90,h=None):
    try:
        r=urllib.request.Request(u,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
base='https://servicio.mapa.gob.es/ckan/api/3/action/'
s=get(base+'package_list'); P('package_list',s[:100])
try:
    names=json.loads(s)['result']; P('n packages',len(names))
    for n in names: P('PKG',n)
except Exception as e: P('ERR',s[:200])
s=get(base+'package_show?id=esmapaindicespreciospreciopercibido',200000)
try:
    d=json.loads(s)['result']; P('PERCIBIDO',d.get('title'),d.get('license_id'),d.get('license_title'),d.get('metadata_modified'))
    P(re.sub(r'\s+',' ',d.get('notes',''))[:800])
    for r in d['resources']: P('  RES',r.get('name'),r.get('format'),r.get('url'),r.get('size'))
except Exception as e: P('PERCIBIDO ERR',s[:300])
for u in ['https://servicio.mapa.gob.es/siarweb/avisoLegal','https://servicio.mapa.gob.es/apisiar/','https://servicio.mapa.gob.es/apisiar/swagger-ui/index.html','https://servicio.mapa.gob.es/siarweb/']:
    s=get(u,300000); txt=re.sub(r'\s+',' ',html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>',' ',s,flags=re.S)))
    P('GET',u); P(txt[:1500])
open('data/probe/es.txt','w').write('\n'.join(out))

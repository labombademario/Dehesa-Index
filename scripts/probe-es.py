import json,re,urllib.request,urllib.parse,html,time
def get(u,n=600000,t=90,h=None,retries=3):
    last=''
    for i in range(retries):
        try:
            r=urllib.request.Request(u,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
        except Exception as e:
            last='ERR %s'%e; time.sleep(5)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
base='https://servicio.mapa.gob.es/ckan/api/3/action/'
for pk in ['esmapaindicespreciospreciopercibido','esmapaindicespreciospreciopagado','esmapaindicespreciosindicepercibido','esmapaindicespreciosindicepagado','esmaparecanredcontable','esmapasalasincubaciondatosincubacion']:
    s=get(base+'package_show?id='+pk,200000)
    try:
        d=json.loads(s)['result']; P('##',pk,'|',d.get('title'),'|',d.get('license_id'),'|',d.get('license_title'),'|',d.get('metadata_modified'))
        P('  ',re.sub(r'\s+',' ',d.get('notes',''))[:500])
        for r in d['resources']: P('  RES',r.get('name'),'|',r.get('format'),'|',r.get('url'),'|',r.get('size'),'|',r.get('last_modified'))
    except Exception as e: P('##',pk,'ERR',s[:200])
s=get('https://servicio.mapa.gob.es/siarweb/avisoLegal')
txt=re.sub(r'\s+',' ',html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>',' ',s,flags=re.S)))
i=txt.find('Las presentes condiciones'); P('AVISO',txt[i:i+3500])
s=get('https://servicio.mapa.gob.es/siarweb/')
P('SIAR links',sorted(set(re.findall(r'href="([^"]+)"',s)))[:40])
for u in ['https://servicio.mapa.gob.es/apisiar/api/v1/','https://servicio.mapa.gob.es/apisiar/','https://servicio.mapa.gob.es/siarweb/Api','https://servicio.mapa.gob.es/siarweb/api']:
    s=get(u,20000,30,retries=1); P('TRY',u,s[:300].replace('\n',' '))
open('data/probe/es.txt','w').write('\n'.join(out))

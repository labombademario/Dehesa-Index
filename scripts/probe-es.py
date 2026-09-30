import json,re,urllib.request,time
def get(u,n=5000000,t=90,retries=4):
    last=''
    for i in range(retries):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
        except Exception as e:
            last='ERR %s'%e; time.sleep(8)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
b='https://servicio.mapa.gob.es/ckan/api/3/action/'
for pk in ['esmapaindicespreciospreciopercibido','esmapaindicespreciospreciopagado']:
    s=get(b+'package_show?id='+pk)
    try:
        d=json.loads(s)['result']; P('##',pk); P('NOTES',d.get('notes')); 
        for k in ['author','maintainer','url','version','license_url','temporal_start','frequency']: P(k,d.get(k))
        P('extras',json.dumps(d.get('extras'),ensure_ascii=False)[:1500])
        for r in d['resources']: P('RES',json.dumps({k:v for k,v in r.items() if k in('id','description','name','datastore_active','last_modified','created')},ensure_ascii=False))
    except Exception as e: P('ERR',s[:200])
    s=get(b+'datastore_search?limit=1&resource_id='+('23939af3-475f-4a4b-b18e-48fa9dbc4f3b' if 'percibido' in pk else 'bb45def4-7841-4fa8-9a56-b7f959a9a951'))
    try:
        d=json.loads(s)['result']; P('FIELDS',json.dumps(d['fields'],ensure_ascii=False))
    except Exception as e: P('FIELDS ERR',s[:200])
# productos y muestra de 2025 para sanity
s=get('https://servicio.mapa.gob.es/ckan/datastore/dump/23939af3-475f-4a4b-b18e-48fa9dbc4f3b',60000000)
import csv,io
rows=list(csv.DictReader(io.StringIO(s)))
prods={}
for r in rows: prods.setdefault((r['grupo'],r['producto']),[]).append((int(r['anio']),int(r['mes']),r['precio_mensual']))
for k,v in sorted(prods.items()):
    v.sort(); P('PROD',k,'n=',len(v),'first',v[0][:2],'last',v[-1], 'nonzero',sum(1 for x in v if x[2] not in('','0')))
open('data/probe/es.txt','w').write('\n'.join(out))
